import { PHIEN_BAN_HT6 as PHIEN_BAN_HT5 } from './hanh-trinh-v6-loi'
import { baoCaoAB } from './hanh-trinh-do-luong'
import { SQL_HANH_TRINH_V5 } from './hanh-trinh-v5-schema'
import { lenhQuyetDinhV5 } from './hanh-trinh-v5-d1'
import { lenhChonV6 } from './hanh-trinh-v6-d1'
import type { Env } from './kieu'
import type { ChienDich, HoSo2, KeHoachDaChot } from './srs2-d1'
import { CAU_MOI_CHANG, CAU_TOI_THIEU, chonCauHanhTrinh, coLoThuSucHanhTrinh, mucNgayHanhTrinh, tienDoHanhTrinh, type TangHanhTrinh } from './hanh-trinh-ngay'
import { baiHanhTrinh, chonLoThem, tangSanSangTheoBai } from './hanh-trinh-bai'
import { SQL_BANG_HANH_TRINH } from './hanh-trinh-hop-nhat'
import { chayDdlMotLan } from './ddl-mot-lan'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { tachSongSinh } from './loi-hoc-luat'
import { SQL_TC } from './lam-lai-so'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { dongCoHanhTrinh, lenhGhiCanThiep, SQL_DONG_CO_HANH_TRINH } from './hanh-trinh-dong-co'

type Row = Record<string, unknown>
const ds = (v: unknown): string[] => { try { const a: unknown = JSON.parse(String(v ?? '[]')); return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : [] } catch { return [] } }
const goc = (q: string) => q.replace(/#\d+$/, '')
/** Lần TỰ LÀM hôm nay đã tính được (ca chưa công bố/đã xoá không tính), mới nhất trước — dùng chung cho kế hoạch và Thử sức thêm. */
const docLamHomNay = (env: Env, sbd: string, ngay: string) => env.DB.prepare(`SELECT qid,ket_qua,received_at,${SQL_TC} AS tc FROM su_kien_hoc WHERE sbd=? AND ngay_vn=?
    AND ket_qua IS NOT NULL AND COALESCE(visibility,'') <> 'embargoed'
    AND ${SQL_LA_LAN_LAM}
    AND (nguon <> 'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')})) ORDER BY received_at DESC,khoa DESC`).bind(sbd, ngay).all<Row>()

/** Kế hoạch riêng: chốt tầng đầu ngày, giữ phần đã làm; tính lại sau mỗi chặng.
 * UPDATE kế hoạch và mốc chặng cùng batch + CAS, hai máy không ghi đè nhau.
 */
export async function lapChotHanhTrinh(env: Env, sbd: string, ngay: string, nowMs: number, hs: HoSo2,
  cu: Row | null, chan: ReadonlySet<string>, trongSo?: Readonly<Record<string, number>>, dangVung?: readonly string[], daMoRong=false): Promise<KeHoachDaChot> {
  await chayDdlMotLan(env, 'hanh_trinh_v3_v4', [...SQL_BANG_HANH_TRINH,...SQL_DONG_CO_HANH_TRINH,...SQL_HANH_TRINH_V5])
  const nhom = new Map([...hs.meta].map(([q, m]) => [q, m.group || q]))
  const rows = await docLamHomNay(env, sbd, ngay)
  const daLam = new Set((rows.results ?? []).map(r => String(r.tc || tachSongSinh(String(r.qid)).goc)))
  const daNhom = new Set<string>()
  const hopLe = new Set(hs.cau.map(c => c.qid))
  const xong = [...new Set([...ds(cu?.doan_json), ...ds(cu?.dao_json), ...daLam].map(goc))].filter(q => {
    const k = nhom.get(q) || q
    if (!daLam.has(q) || !hopLe.has(q) || daNhom.has(k)) return false
    daNhom.add(k); return true
  })
  const maDeCua = (q: string) => hs.meta.get(q)?.maDe
  // Hành trình v6 (main #217): tầng ngày do động cơ quyết; bản đồ tầng theo câu chỉ lấy từ động cơ khi chọn lại. Ước lượng Thử sức thêm (cuối hàm) dựng cổng theo bài khi cần.
  let tangSanSang = new Map<string, TangHanhTrinh>()
  let snap = await env.DB.prepare('SELECT * FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>()
  if(!snap){
    // Chỉ khởi tạo ngày mới; tầng được quyết bằng hồ sơ kỹ năng × tầng hiện tại.
    await env.DB.prepare('INSERT OR IGNORE INTO hanh_trinh_v3_ngay(sbd,ngay,tang,toi_thieu) VALUES(?,?,1,24)').bind(sbd,ngay).run()
    snap=(await env.DB.prepare('SELECT * FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').bind(sbd,ngay).first<Row>())!
  }
  let tangNgay = Number(snap.tang) as TangHanhTrinh, toiThieu = Number(snap.toi_thieu)
  const conCu = [...ds(cu?.doan_json), ...ds(cu?.dao_json)].filter(q => !daLam.has(goc(q)))
  const hong = conCu.some(q => !hs.meta.has(goc(q)) || hs.meta.get(goc(q))?.tuLuan || hs.tt.get(goc(q))?.catTia || chan.has(goc(q)) || chan.has(nhom.get(goc(q)) || goc(q)))
  const moc = Math.floor(xong.length / CAU_MOI_CHANG) * CAU_MOI_CHANG
  // Không đổi câu giữa chặng; sửa ngay nếu câu bị bảo vệ/rút khỏi kho.
  const v5Cu=await env.DB.prepare('SELECT phien_ban FROM hanh_trinh_v5_quyet_dinh WHERE sbd=? AND ngay=? ORDER BY moc DESC LIMIT 1').bind(sbd,ngay).first<{phien_ban:string}>()
  const kiem=await env.DB.prepare('SELECT da_lam FROM hanh_trinh_v4_chot WHERE sbd=? AND ngay=?').bind(sbd,ngay).first<{da_lam:number}>()
  const saiMoi=rows.results[0]?.ket_qua===0 && xong.length>(kiem?.da_lam??0)
  const doiBoSung = conCu.length === 0 && xong.length < toiThieu
  let daChay = false
  if (!v5Cu || v5Cu.phien_ban!==PHIEN_BAN_HT5 || !kiem || saiMoi || !cu || cu.chien_dich_id !== hs.chienDich?.id || Number(snap.xong_chot) !== moc || hong || doiBoSung) {
    daChay = true
    const engine = await dongCoHanhTrinh(env,sbd,nowMs,hs,chan)
    if(engine.v5){
      for(const [id,t] of engine.v5.tang)tangSanSang.set(id,t)
      const ready=Math.max(1,...[...engine.v5.tang].filter(([id])=>!engine.v5!.chanDoan.has(id)).map(([,t])=>t)) as TangHanhTrinh
      if((!cu||!v5Cu||v5Cu.phien_ban!==PHIEN_BAN_HT5) && ready>tangNgay){
        await env.DB.prepare("UPDATE hanh_trinh_v3_ngay SET tang=MAX(tang,?),toi_thieu=MAX(toi_thieu,?) WHERE sbd=? AND ngay=? AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')").bind(ready,CAU_TOI_THIEU[ready],sbd,ngay).run()
        const next=await env.DB.prepare('SELECT tang,toi_thieu FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').bind(sbd,ngay).first<Row>();tangNgay=Number(next!.tang) as TangHanhTrinh;toiThieu=Number(next!.toi_thieu)
      }
    }
    const trangThai = new Map([...hs.tt].map(([q,t])=>[q,engine.hen.has(q) && t.thanhThao ? {...t,henOn:engine.hen.get(q)!}:t]))
    const chanMoi = new Set([...chan,...engine.chan])
    const cung = hs.cau.filter(c => !hs.meta.get(c.qid)?.tuLuan && !chan.has(nhom.get(c.qid) || c.qid))
    const diagCu=await env.DB.prepare('SELECT qid,nhom FROM hanh_trinh_v6_chon WHERE sbd=? AND ngay=? AND moc=? AND diagnostic=1').bind(sbd,ngay,moc).all<{qid:string;nhom:string}>()
    const reserved=new Set(diagCu.results.map(c=>c.nhom))
    const freshDiag=[...(engine.v5?.chanDoan??[])].filter(id=>!reserved.has(nhom.get(id)||id)).sort((a,b)=>(engine.trongSo[b]??0)-(engine.trongSo[a]??0)).slice(0,Math.max(0,2-reserved.size))
    const allowedDiag=new Set([...reserved,...freshDiag.map(id=>nhom.get(id)||id)])
    for(const id of engine.v5?.chanDoan??[])if(!allowedDiag.has(nhom.get(id)||id))chanMoi.add(id)
    const daDiag=new Set(diagCu.results.filter(c=>daLam.has(c.qid)).map(c=>c.nhom)).size
    // Thử sức thêm (09/10): phần em đã tự lấy vượt sàn hôm nay (tổng kế hoạch đã chốt > sàn) được GIỮ khi chọn lại phần chưa làm — không vượt 2 × sàn.
    const tongCu = cu && cu.chien_dich_id === hs.chienDich?.id ? ds(cu.dao_json).length + ds(cu.doan_json).length : 0
    const lap = chonCauHanhTrinh({ ngay, tang: tangNgay, toiThieu: mucNgayHanhTrinh(toiThieu, tongCu), daLam: xong, cau: cung, tt: trangThai, nhom, chan:chanMoi, trongSo:{...trongSo,...engine.trongSo}, tangSanSang, uuTienCanThiep:engine.canThiep?.qid, chanDoan:engine.v5?.chanDoan, nganSachChanDoan:Math.max(0,2-daDiag), uuTienThamDo:engine.v5?.uuTienThamDo, vaiTro:engine.v5?.nhom==='B'?engine.v5.vai:undefined })
    if(!daMoRong&&lap.dao.length+lap.doan.length<Math.max(0,toiThieu-xong.length)&&engine.v5?.ungNgoai.length){
      const expanded=await import('./hanh-trinh-v6-kho').then(m=>m.boSungV6(env,sbd,ngay,hs,engine.v5!.ungNgoai,chan))
      if(expanded){Object.assign(hs,expanded);return lapChotHanhTrinh(env,sbd,ngay,nowMs,hs,cu,chan,trongSo,undefined,true)}
    }
    const xongDao = xong.filter(q => ds(cu?.dao_json).map(goc).includes(q)), xongDoan = xong.filter(q => !xongDao.includes(q))
    const dao = [...xongDao, ...lap.dao], doan = [...xongDoan, ...lap.doan]
    const write = cu
      ? env.DB.prepare(`UPDATE srs2_ke_hoach SET chien_dich_id=?,dao_json=?,doan_json=?,huyet_chien=0,tong=? WHERE sbd=? AND ngay=? AND dao_json=? AND doan_json=?`)
        .bind(hs.chienDich!.id, JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length, sbd, ngay, cu.dao_json, cu.doan_json)
      : env.DB.prepare(`INSERT OR IGNORE INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,0,?,?)`)
        .bind(sbd, ngay, hs.chienDich!.id, JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length, new Date(nowMs).toISOString())
    const decision=engine.v5?lenhQuyetDinhV5(env,sbd,ngay,moc,nowMs,engine.v5,[...lap.dao,...lap.doan]):null
    const receipt6=engine.v5?lenhChonV6(env,sbd,ngay,moc,nowMs,[...lap.dao,...lap.doan].slice(0,6).map(id=>engine.v5!.chon[id]!).filter(Boolean)):null
    const exposure=lenhGhiCanThiep(env,sbd,ngay,moc,nowMs,engine,[...dao,...doan])
    const kiemMoi=env.DB.prepare('INSERT INTO hanh_trinh_v4_chot(sbd,ngay,da_lam) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM srs2_ke_hoach WHERE sbd=? AND ngay=? AND dao_json=? AND doan_json=?) ON CONFLICT(sbd,ngay) DO UPDATE SET da_lam=excluded.da_lam').bind(sbd,ngay,xong.length,sbd,ngay,JSON.stringify(dao),JSON.stringify(doan))
    await env.DB.batch([write, ...(decision?[decision]:[]), ...(exposure?[exposure]:[]), ...(receipt6?[receipt6]:[]),kiemMoi, env.DB.prepare('UPDATE hanh_trinh_v3_ngay SET xong_chot=? WHERE sbd=? AND ngay=? AND EXISTS(SELECT 1 FROM srs2_ke_hoach WHERE sbd=? AND ngay=? AND dao_json=? AND doan_json=?)').bind(moc, sbd, ngay,sbd,ngay,JSON.stringify(dao),JSON.stringify(doan))])
  }
  const saved = daChay || !cu
    ? (await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>())!
    : cu
  const dao = ds(saved.dao_json), doan = ds(saved.doan_json)
  const conDao = dao.filter(q => !daLam.has(goc(q))), conDoan = doan.filter(q => !daLam.has(goc(q)))
  const tong = dao.length + doan.length
  const daXong = tong - conDao.length - conDoan.length
  // Sảnh (chỉ-thêm): tầng từng bài theo cây Dạy học — thuần, trên dữ liệu đã nạp, không thêm truy vấn.
  const bai = baiHanhTrinh(hs.phamVi, hs.cau, maDeCua, hs.tt, nhom, dangVung)
  // Thử sức thêm: ước lượng RẺ số câu còn lấy thêm được (cổng tầng theo bài, không chạy động cơ v5) — chỉ khi đã đủ sàn. Lệnh lấy câu chọn lại bằng động cơ đầy đủ.
  const lo = daXong >= toiThieu ? coLoThuSucHanhTrinh(toiThieu, tong) : 0
  const thuSucHanhTrinh = lo > 0 ? (() => {
    // Dòng chốt tầng đã có từ trước ⇒ bản đồ tầng chưa dựng ở lượt này (tối ưu CPU) — dựng ngay đây, chỉ khi em đã đủ sàn.
    if (tangSanSang.size === 0) tangSanSang = tangSanSangTheoBai(hs.cau, maDeCua, hs.tt, nhom, dangVung).tangSanSang
    const lap = chonLoThem({ ngay, tang: tangNgay, daCo: [...dao.map(goc), ...doan.map(goc), ...daLam], soCau: lo, cau: hs.cau, tt: hs.tt, nhom, chan, tangSanSang,
      trongSo, phamVi: hs.phamVi?.maDe ?? null, maDeCua, tuLuan: (q) => hs.meta.get(q)?.tuLuan !== false })
    return lap.dao.length + lap.doan.length
  })() : 0
  return { ngay, chienDichId: hs.chienDich!.id, dao, doan, conDao, conDoan, tong, huyetChien: false,
    hanhTrinh: { ...tienDoHanhTrinh(tangNgay, toiThieu, tong, daXong), ...(bai ? { bai } : {}) },
    ...(daXong >= toiThieu ? { thuSucHanhTrinh } : {}) }
}

/**
 * THỬ SỨC THÊM · Hành trình (09/10) — CHỈ CHỌN, không ghi (nơi gọi ghi so-khớp kế hoạch như lệnh cũ). Gọi khi em đã đủ sàn, không còn câu chưa làm.
 * Chọn bằng ĐÚNG đầu vào của lần chọn lại sau chặng: cổng tầng theo bài + tầng từng câu của bộ chọn v5, câu/nhóm bị động cơ chặn (thiếu tiên quyết, ngoài phạm vi),
 * lịch half-life, trọng số OMNI + động cơ, vai L4 nhóm B. Động cơ chạy CHỈ ĐỌC (`ghi=false`): không receipt, không nhật ký quyết định, không đổi mô hình.
 * Bỏ: câu/nhóm đã xếp hoặc đã làm hôm nay (mọi kênh tính lượt), câu tự luận, câu bảo vệ cho ca / nghi đáp án (`chan`).
 */
export async function chonLoThuSucHanhTrinh(env: Env, sbd: string, ngay: string, nowMs: number, hs: HoSo2, kh: KeHoachDaChot, chan: ReadonlySet<string>,
  soCau: number, trongSo?: Readonly<Record<string, number>>, dangVung?: readonly string[]): Promise<{ dao: string[]; doan: string[] }> {
  if (soCau <= 0 || !kh.hanhTrinh) return { dao: [], doan: [] }
  const nhom = new Map([...hs.meta].map(([q, m]) => [q, m.group || q]))
  const maDeCua = (q: string) => hs.meta.get(q)?.maDe
  const [rows, engine] = await Promise.all([docLamHomNay(env, sbd, ngay), dongCoHanhTrinh(env, sbd, nowMs, hs, chan, false)])
  const daLam = (rows.results ?? []).map(r => String(r.tc || tachSongSinh(String(r.qid)).goc))
  const { tangSanSang } = tangSanSangTheoBai(hs.cau, maDeCua, hs.tt, nhom, dangVung)
  if (engine.v5) for (const [id, t] of engine.v5.tang) tangSanSang.set(id, t)
  const trangThai = new Map([...hs.tt].map(([q, t]) => [q, engine.hen.has(q) && t.thanhThao ? { ...t, henOn: engine.hen.get(q)! } : t]))
  return chonLoThem({ ngay, tang: kh.hanhTrinh.tang, daCo: [...kh.dao.map(goc), ...kh.doan.map(goc), ...daLam], soCau, cau: hs.cau, tt: trangThai, nhom,
    chan: new Set([...chan, ...engine.chan]), tangSanSang, trongSo: { ...trongSo, ...engine.trongSo }, vaiTro: engine.v5?.nhom === 'B' ? engine.v5.vai : undefined,
    phamVi: hs.phamVi?.maDe ?? null, maDeCua, tuLuan: (q) => hs.meta.get(q)?.tuLuan !== false })
}

/** Bảng thầy chỉ đọc kế hoạch hôm nay, không replay toàn kho × toàn khối. */
export async function bangHanhTrinh(env: Env, cd: ChienDich, ngay: string) {
  const emJson = JSON.stringify(cd.sbd)
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  const [hs, kh, snap, suKien, muc, doLuong] = await Promise.all([
    env.DB.prepare('SELECT sbd,ho_ten FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(emJson).all<Row>(),
    env.DB.prepare('SELECT sbd,dao_json,doan_json FROM srs2_ke_hoach WHERE ngay=? AND sbd IN (SELECT value FROM json_each(?))').bind(ngay,emJson).all<Row>(),
    env.DB.prepare('SELECT * FROM hanh_trinh_v3_ngay WHERE ngay=? AND sbd IN (SELECT value FROM json_each(?))').bind(ngay,emJson).all<Row>(),
    env.DB.prepare(`SELECT sbd,qid,${SQL_TC} AS tc FROM su_kien_hoc WHERE ngay_vn=? AND sbd IN (SELECT value FROM json_each(?))
      AND ket_qua IS NOT NULL AND COALESCE(visibility,'') <> 'embargoed' AND ${SQL_LA_LAN_LAM}
      AND (nguon <> 'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}))`).bind(ngay,emJson).all<Row>(),
    env.DB.prepare('SELECT sbd,tien_do_json,cap_nhat_luc FROM hanh_trinh_v5_muc m WHERE sbd IN(SELECT value FROM json_each(?)) AND cap_nhat_luc=(SELECT MAX(cap_nhat_luc) FROM hanh_trinh_v5_muc WHERE sbd=m.sbd)').bind(emJson).all<Row>(),
    baoCaoAB(env,cd.sbd),
  ])
  const mucEm=new Map(muc.results.map(r=>[String(r.sbd),r]))
  const ten = new Map(hs.results.map(r => [String(r.sbd), String(r.ho_ten)]))
  const plan = new Map(kh.results.map(r => [String(r.sbd), [...ds(r.dao_json),...ds(r.doan_json)].map(goc)]))
  const chot = new Map(snap.results.map(r => [String(r.sbd),r]))
  const done = new Map<string,Set<string>>()
  for (const r of suKien.results) { const s=String(r.sbd); const qs=done.get(s) ?? new Set<string>(); qs.add(String(r.tc || tachSongSinh(String(r.qid)).goc)); done.set(s,qs) }
  const em = cd.sbd.map(sbd => {
    const r=chot.get(sbd), qs=plan.get(sbd) ?? []
    let tienDo:unknown=null;try{tienDo=JSON.parse(String(mucEm.get(sbd)?.tien_do_json??'null'))}catch{/* chưa có hồ sơ đo */}
    return { sbd,tienDo,ten:ten.get(sbd) ?? sbd,tang:r ? Number(r.tang) : null,toiThieu:r ? Number(r.toi_thieu) : null,
      daLam:qs.filter(q=>done.get(sbd)?.has(q)).length,daXep:qs.length,conThieu:r ? Math.max(0,Number(r.toi_thieu)-qs.length) : 0 }
  })
  return { ok:true,chienDich:{...cd,qids:undefined,sbd:undefined,soCau:cd.qids.length,soEm:cd.sbd.length,hanhTrinh:true},homNay:ngay,hetHan:false,
    lop:{coXat:0,thanhThao:0,huyetChien:0,canDayLaiCau:0,canDayLaiLuot:0},dang:[],em:[],canDayLai:[],noCu:[],hanhTrinhNgay:{em,doLuong} }
}
