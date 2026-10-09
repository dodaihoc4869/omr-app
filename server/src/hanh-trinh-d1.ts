import { PHIEN_BAN_HT5 } from './hanh-trinh-v5-loi'
import { baoCaoAB } from './hanh-trinh-do-luong'
import { SQL_HANH_TRINH_V5 } from './hanh-trinh-v5-schema'
import { lenhQuyetDinhV5 } from './hanh-trinh-v5-d1'
import type { Env } from './kieu'
import type { ChienDich, HoSo2, KeHoachDaChot } from './srs2-d1'
import { CAU_MOI_CHANG, CAU_TOI_THIEU, chonCauHanhTrinh, tangCuaEm, tienDoHanhTrinh, type TangHanhTrinh } from './hanh-trinh-ngay'
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

/** Kế hoạch riêng: chốt tầng đầu ngày, giữ phần đã làm; tính lại sau mỗi chặng.
 * UPDATE kế hoạch và mốc chặng cùng batch + CAS, hai máy không ghi đè nhau.
 */
export async function lapChotHanhTrinh(env: Env, sbd: string, ngay: string, nowMs: number, hs: HoSo2,
  cu: Row | null, chan: ReadonlySet<string>, trongSo?: Readonly<Record<string, number>>, dangVung?: readonly string[]): Promise<KeHoachDaChot> {
  await chayDdlMotLan(env, 'hanh_trinh_v3_v4', [...SQL_BANG_HANH_TRINH,...SQL_DONG_CO_HANH_TRINH,...SQL_HANH_TRINH_V5])
  const nhom = new Map([...hs.meta].map(([q, m]) => [q, m.group || q]))
  const rows = await env.DB.prepare(`SELECT qid,ket_qua,received_at,${SQL_TC} AS tc FROM su_kien_hoc WHERE sbd=? AND ngay_vn=?
    AND ket_qua IS NOT NULL AND COALESCE(visibility,'') <> 'embargoed'
    AND ${SQL_LA_LAN_LAM}
    AND (nguon <> 'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')})) ORDER BY received_at DESC,khoa DESC`).bind(sbd, ngay).all<Row>()
  const daLam = new Set((rows.results ?? []).map(r => String(r.tc || tachSongSinh(String(r.qid)).goc)))
  const daNhom = new Set<string>()
  const hopLe = new Set(hs.cau.map(c => c.qid))
  const xong = [...new Set([...ds(cu?.doan_json), ...ds(cu?.dao_json), ...daLam].map(goc))].filter(q => {
    const k = nhom.get(q) || q
    if (!daLam.has(q) || !hopLe.has(q) || daNhom.has(k)) return false
    daNhom.add(k); return true
  })
  const tangSanSang = new Map<string, TangHanhTrinh>()
  let snap = await env.DB.prepare('SELECT * FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>()
  if (!snap) {
    const theoBai = new Map<string, typeof hs.cau>()
    for (const c of hs.cau) {
      if (c.nguon !== 'chien_dich') continue
      const ma = hs.meta.get(c.qid)?.maDe ?? ''
      const bai = /^(.*?-B\d+)(?:-|$)/i.exec(ma)?.[1] ?? ma
      theoBai.set(bai, [...(theoBai.get(bai) ?? []), c])
    }
    let tang: TangHanhTrinh = 1
    for (const cau of theoBai.values()) {
      const t = tangCuaEm(cau, hs.tt, nhom, dangVung)
      tang = Math.max(tang, t) as TangHanhTrinh
      for (const c of cau) tangSanSang.set(c.qid, t)
    }
    await env.DB.prepare('INSERT OR IGNORE INTO hanh_trinh_v3_ngay(sbd,ngay,tang,toi_thieu) VALUES(?,?,?,?)')
      .bind(sbd, ngay, tang, CAU_TOI_THIEU[tang]).run()
    snap = (await env.DB.prepare('SELECT * FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>())!
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
    if (tangSanSang.size === 0) {
      const theoBai = new Map<string, typeof hs.cau>()
      for (const c of hs.cau) {
        if (c.nguon !== 'chien_dich') continue
        const ma = hs.meta.get(c.qid)?.maDe ?? ''
        const bai = /^(.*?-B\d+)(?:-|$)/i.exec(ma)?.[1] ?? ma
        theoBai.set(bai, [...(theoBai.get(bai) ?? []), c])
      }
      for (const cau of theoBai.values()) {
        const t = tangCuaEm(cau, hs.tt, nhom, dangVung)
        for (const c of cau) tangSanSang.set(c.qid, t)
      }
    }
    const engine = await dongCoHanhTrinh(env,sbd,nowMs,hs,chan)
    if(engine.v5){
      for(const [id,t] of engine.v5.tang)tangSanSang.set(id,t)
      const ready=Math.max(1,...engine.v5.tang.values()) as TangHanhTrinh
      if((!cu||!v5Cu||v5Cu.phien_ban!==PHIEN_BAN_HT5) && ready>tangNgay){
        await env.DB.prepare("UPDATE hanh_trinh_v3_ngay SET tang=MAX(tang,?),toi_thieu=MAX(toi_thieu,?) WHERE sbd=? AND ngay=? AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')").bind(ready,CAU_TOI_THIEU[ready],sbd,ngay).run()
        const next=await env.DB.prepare('SELECT tang,toi_thieu FROM hanh_trinh_v3_ngay WHERE sbd=? AND ngay=?').bind(sbd,ngay).first<Row>();tangNgay=Number(next!.tang) as TangHanhTrinh;toiThieu=Number(next!.toi_thieu)
      }
    }
    const trangThai = new Map([...hs.tt].map(([q,t])=>[q,engine.hen.has(q) && t.thanhThao ? {...t,henOn:engine.hen.get(q)!}:t]))
    const chanMoi = new Set([...chan,...engine.chan])
    const cung = hs.cau.filter(c => !hs.meta.get(c.qid)?.tuLuan && !chan.has(nhom.get(c.qid) || c.qid))
    const lap = chonCauHanhTrinh({ ngay, tang: tangNgay, toiThieu, daLam: xong, cau: cung, tt: trangThai, nhom, chan:chanMoi, trongSo:{...trongSo,...engine.trongSo}, tangSanSang, uuTienCanThiep:engine.canThiep?.qid, vaiTro:engine.v5?.nhom==='B'?engine.v5.vai:undefined })
    const xongDao = xong.filter(q => ds(cu?.dao_json).map(goc).includes(q)), xongDoan = xong.filter(q => !xongDao.includes(q))
    const dao = [...xongDao, ...lap.dao], doan = [...xongDoan, ...lap.doan]
    const write = cu
      ? env.DB.prepare(`UPDATE srs2_ke_hoach SET chien_dich_id=?,dao_json=?,doan_json=?,huyet_chien=0,tong=? WHERE sbd=? AND ngay=? AND dao_json=? AND doan_json=?`)
        .bind(hs.chienDich!.id, JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length, sbd, ngay, cu.dao_json, cu.doan_json)
      : env.DB.prepare(`INSERT OR IGNORE INTO srs2_ke_hoach(sbd,ngay,chien_dich_id,dao_json,doan_json,huyet_chien,tong,tao_luc) VALUES(?,?,?,?,?,0,?,?)`)
        .bind(sbd, ngay, hs.chienDich!.id, JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length, new Date(nowMs).toISOString())
    const decision=engine.v5?lenhQuyetDinhV5(env,sbd,ngay,moc,nowMs,engine.v5,[...lap.dao,...lap.doan]):null
    const exposure=lenhGhiCanThiep(env,sbd,ngay,moc,nowMs,engine,[...dao,...doan])
    const kiemMoi=env.DB.prepare('INSERT INTO hanh_trinh_v4_chot(sbd,ngay,da_lam) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM srs2_ke_hoach WHERE sbd=? AND ngay=? AND dao_json=? AND doan_json=?) ON CONFLICT(sbd,ngay) DO UPDATE SET da_lam=excluded.da_lam').bind(sbd,ngay,xong.length,sbd,ngay,JSON.stringify(dao),JSON.stringify(doan))
    await env.DB.batch([write, ...(decision?[decision]:[]), ...(exposure?[exposure]:[]),kiemMoi, env.DB.prepare('UPDATE hanh_trinh_v3_ngay SET xong_chot=? WHERE sbd=? AND ngay=? AND EXISTS(SELECT 1 FROM srs2_ke_hoach WHERE sbd=? AND ngay=? AND dao_json=? AND doan_json=?)').bind(moc, sbd, ngay,sbd,ngay,JSON.stringify(dao),JSON.stringify(doan))])
  }
  const saved = daChay || !cu
    ? (await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>())!
    : cu
  const dao = ds(saved.dao_json), doan = ds(saved.doan_json)
  const conDao = dao.filter(q => !daLam.has(goc(q))), conDoan = doan.filter(q => !daLam.has(goc(q)))
  const tong = dao.length + doan.length
  return { ngay, chienDichId: hs.chienDich!.id, dao, doan, conDao, conDoan, tong, huyetChien: false,
    hanhTrinh: tienDoHanhTrinh(tangNgay, toiThieu, tong, tong - conDao.length - conDoan.length) }
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
