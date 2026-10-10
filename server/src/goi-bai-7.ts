import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { SQL_GOI7 } from './goi-bai-7-schema'
import { chonGoi7, congNgay7, ngayVn7, quotaGoi7, diemConDungNguon7, type CauGoi7, type ViecGoi7 } from './goi-bai-7-loi'
import { tachMaTo } from './srs2-gv'
import { laMaToKhongGiao, damBaoBangBaiDaDay, phamViLop } from './bai-da-day'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { publicQuestion, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { docCauTheoRef, loiCauDoi, protectedQuestions, docKhoiEm, dongBoCacTo } from './game-v2-bank'
import { readGameScope } from './game-v2-reports'
import { docHoSo2 } from './srs2-d1'
import { docCauBtvnChuaNop } from './game-v2-luot'
import { dongCoHanhTrinh } from './hanh-trinh-dong-co'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { CAU_TOI_THIEU, tangCuaEm } from './hanh-trinh-ngay'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { apLamLaiKhac } from './cau-anh-em'
import { apXaoTheoRef, type LamLaiRef } from './lam-lai-so'
import { tachSongSinh } from './loi-hoc-luat'

type Row = Record<string, unknown>
const str = (x: unknown) => String(x ?? '')
async function currentQuestion(env: Env, ref: {qid:string;maDe:string;version:string}) { const q = await docCauTheoRef(env,ref); if (!q) throw loiCauDoi(); return q }
export function mang7(x: unknown): string[] { try { const a: unknown = typeof x === 'string' ? JSON.parse(x) : x; return Array.isArray(a) ? a.filter((v): v is string => typeof v === 'string') : [] } catch { return [] } }
const json = <T>(x: unknown): T => JSON.parse(str(x)) as T
const KHONG_CA = "NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')"
export const SQL_LUOT_GOI7 = `${SQL_LA_LAN_LAM} AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))`
export interface CoGoi7 { bat: boolean; batDau: string; batLuc?: string }
export async function coGoi7(env: Env): Promise<CoGoi7> {
  const r = await env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='goi_bai_7_v1'").first<{ gia_tri: string }>()
  if (!r) return { bat: false, batDau: '' }
  let c: Row; try { c = json<Row>(r.gia_tri) } catch { return {bat:false,batDau:''} }
  return { bat: c.bat === true, batDau: /^\d{4}-\d{2}-\d{2}$/.test(str(c.batDau)) ? str(c.batDau) : '', batLuc:Number.isFinite(Date.parse(str(c.batLuc)))?str(c.batLuc):undefined }
}
export const damBaoGoi7 = (env: Env) => chayDdlMotLan(env, 'goi_bai_7_v1', SQL_GOI7)

const dongBoDem7=new WeakMap<object,Map<string,{luc:number;p:Promise<{soGoi:number;soEm:number;soCau:number;hoan:boolean}>}>>()

/** Chỉ bài được chọn gần nhất của mỗi lớp ở thời điểm chuyển; những tick MỚI sau đó đều có gói riêng. */
export async function dongBoGoi7(env: Env, now: number, tran = 2, lop = '', batBuoc=false): Promise<{ soGoi: number; soEm: number; soCau: number; hoan: boolean }> {
  let m=dongBoDem7.get(env.DB)
  if(!m){m=new Map();dongBoDem7.set(env.DB,m)}
  const k=`${lop}|${tran}`,cu=m.get(k)
  if(!batBuoc&&cu&&now>=cu.luc&&now-cu.luc<20000){const r=await cu.p;return {soGoi:0,soEm:0,soCau:0,hoan:r.hoan}}
  const p=dongBoThat7(env,now,tran,lop);m.set(k,{luc:now,p})
  try{return await p}catch(e){m.delete(k);throw e}
}
async function dongBoThat7(env: Env, now: number, tran: number, lop: string): Promise<{ soGoi: number; soEm: number; soCau: number; hoan: boolean }> {
  const cfg = await coGoi7(env)
  if (!cfg.bat || !cfg.batDau) return { soGoi: 0, soEm: 0, soCau: 0, hoan: false }
  const ca = await env.DB.prepare("SELECT COUNT(*) AS n FROM ca WHERE trang_thai='mo'").first<{ n: number }>()
  if (ca?.n) return { soGoi: 0, soEm: 0, soCau: 0, hoan: true }
  await damBaoGoi7(env); await damBaoBangBaiDaDay(env)
  const ticks = await env.DB.prepare(`SELECT b.* FROM bai_da_day b WHERE b.bo_tick_luc IS NULL AND (?='' OR b.lop=?)
    AND NOT EXISTS(SELECT 1 FROM goi_bai_7 g WHERE g.tick_id=b.id)
    AND (julianday(b.tick_luc)>=julianday(?) OR NOT EXISTS(SELECT 1 FROM bai_da_day n WHERE n.lop=b.lop AND n.bo_tick_luc IS NULL AND (n.tick_luc>b.tick_luc OR (n.tick_luc=b.tick_luc AND n.vi_tri>b.vi_tri))))
    ORDER BY b.tick_luc DESC,b.vi_tri DESC LIMIT ?`).bind(lop,lop,cfg.batLuc??cfg.batDau+'T00:00:00+07:00', Math.max(1, tran)).all<Row>()
  let soGoi = 0, soEm = 0, soCau = 0
  for (const b of ticks.results) {
    const cau = await cauTuTick7(env,b)
    // Không bỏ qua bài thiếu chỉ mục: hàng giáo viên vẫn thấy gói rỗng cần bổ sung.
    const batDau = [ngayVn7(Date.parse(str(b.tick_luc))),cfg.batDau].sort().at(-1)!
    const han = congNgay7(batDau, 6), id = `g7:${str(b.id)}`, luc = new Date(now).toISOString()
    const rs = await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) SELECT ?,?,?,?,?,?,?,? WHERE ${KHONG_CA}`).bind(id,b.id,b.lop,b.khoa_bai,b.ten_bai,batDau,han,luc),
      env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_cau(goi_id,qid,version,ma_de,meta_json) SELECT ?,json_extract(value,'$.qid'),json_extract(value,'$.version'),json_extract(value,'$.maDe'),value FROM json_each(?) WHERE EXISTS(SELECT 1 FROM goi_bai_7 WHERE id=?) AND ${KHONG_CA}`).bind(id,JSON.stringify(cau),id),
      env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) SELECT ?,sbd,?,? FROM hoc_sinh WHERE lop=? AND COALESCE(trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM goi_bai_7 WHERE id=?) AND ${KHONG_CA}`).bind(id,batDau,han,b.lop,id),
    ])
    soGoi += Number(rs[0]?.meta.changes ?? 0); soCau += Number(rs[1]?.meta.changes ?? 0); soEm += Number(rs[2]?.meta.changes ?? 0)
  }
  // Nạp lại chỉ mục đã duyệt: gói rỗng hồi phục, bản sửa được gặp lại; không sửa sổ trả lời.
  const active = await env.DB.prepare(`SELECT b.*,g.id goi_id FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE (?='' OR b.lop=?) ORDER BY g.bat_dau DESC LIMIT ?`).bind(lop,lop,Math.max(1,tran)).all<Row>()
  for (const b of active.results) {
    const cau = await cauTuTick7(env,b)
    // Chỉ mục chưa sẵn sàng không làm mất manifest trước đó.
    if (!cau.length) continue
    const payload=JSON.stringify(cau),id=str(b.goi_id)
    await env.DB.batch([
      env.DB.prepare(`UPDATE goi_bai_7_cau SET meta_json=json_set(meta_json,'$.hopLe',json('false')) WHERE goi_id=? AND qid NOT IN(SELECT json_extract(value,'$.qid') FROM json_each(?)) AND ${KHONG_CA}`).bind(id,payload),
      env.DB.prepare(`INSERT INTO goi_bai_7_cau(goi_id,qid,version,ma_de,meta_json) SELECT ?,json_extract(value,'$.qid'),json_extract(value,'$.version'),json_extract(value,'$.maDe'),value FROM json_each(?) WHERE ${KHONG_CA} ON CONFLICT(goi_id,qid) DO UPDATE SET version=excluded.version,ma_de=excluded.ma_de,meta_json=excluded.meta_json`).bind(id,payload),
    ])
  }
  // Em mới chuyển/đăng ký lớp cũng nhận bài, không tạo lại tiến độ của em cũ.
  await env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han)
    SELECT g.id,h.sbd,g.bat_dau,g.han FROM goi_bai_7 g JOIN hoc_sinh h ON h.lop=g.lop AND COALESCE(h.trang_thai,'')<>'khoa' JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE ${KHONG_CA}`).run()
  return { soGoi, soEm, soCau, hoan: false }
}

async function cauTuTick7(env: Env,b: Row): Promise<CauGoi7[]> {
  const to = mang7(b.ma_to_json).filter(m => !laMaToKhongGiao(m)), goc = [...new Set(to.map(m => tachMaTo(m).goc))]
  // Nguồn vừa bổ sung không phải chờ em mở game cũ để lập chỉ mục.
  if(env.DE)for(let i=0;i<goc.length;i+=3)await dongBoCacTo(env,goc.slice(i,i+3))
  const rows = await env.DB.prepare(`SELECT q.qid,q.json,q.version,q.ma_de FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de
    JOIN game_v2_index i ON i.ma_de=d.ma_de AND i.source_version=d.cap_nhat_luc
    WHERE COALESCE(d.da_xoa,0)=0 AND q.ma_de IN (SELECT value FROM json_each(?)) ORDER BY q.rowid`).bind(JSON.stringify(goc)).all<Row>()
  const ids = rows.results.map(r => str(r.qid))
  const qMap = await env.DB.prepare('SELECT qid,y,vkn_json FROM omni_q WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ids)).all<Row>()
  const skills = new Map<string, Set<string>>()
  for (const r of qMap.results) { const s = skills.get(str(r.qid)) ?? new Set<string>(); for (const k of mang7(r.vkn_json)) s.add(k); skills.set(str(r.qid), s) }
  const cau: CauGoi7[] = []
  for (const r of rows.results) {
    const q = json<PrivateQuestion>(r.json)
    if (laCauTuLuan(q) || !to.some(m => { const t = tachMaTo(m); return t.goc === str(r.ma_de) && (!t.phan || t.phan === q.phan) })) continue
    const maTo=to.find(m=>{const t=tachMaTo(m);return t.goc===q.maDe&&t.phan===q.phan})??to.find(m=>tachMaTo(m).goc===q.maDe)??q.maDe
    cau.push({ qid: q.qid, version: str(r.version), maDe: q.maDe, maTo,soCau:Number(/-(\d+)$/.exec(q.qid)?.[1])||undefined, group: q.group, phan: q.phan,
    kho: Number(q.sao) >= 2 || ['VDC', 'van_dung_cao'].includes(q.mucDo ?? ''),
    tinhToan: q.phan === 'III' || /(?:tính|khối lượng|số mol|thể tích|nồng độ|hiệu suất|phần trăm|pH|\d+[.,]?\d*\s*(?:mol|gam|g\b|lít|mL|kJ|%))/i.test(q.text + ' ' + q.tenDang),
    hopLe: q.reviewed === true, kyNang: [...((skills.get(q.qid)?.size ? skills.get(q.qid) : undefined) ?? new Set(q.dang ? [`dang:${q.dang}`] : [`cau:${q.qid}`]))] })
  }
  return cau
}

export interface GoiCuaEm7 { id: string; ten: string; khoaBai: string; batDau: string; han: string; cau: CauGoi7[]; daGap: Set<string>; gapNgay: Set<string>; tuLamNgay: Set<string>; choThay: Set<string>; quota: number }
/** Báo cáo câu mới: vượt quota vẫn hiển thị; một gốc dùng cho hai bài chỉ đếm một lần. */
export function homNayGoi7(goi:readonly GoiCuaEm7[]){
  const gap=new Set(goi.flatMap(g=>[...g.gapNgay])),daGap=new Set(goi.flatMap(g=>[...g.daGap]).filter(q=>!gap.has(q)))
  const cau=[...new Map(goi.flatMap(g=>g.cau).map(c=>[c.qid,c])).values()]
  const plan=chonGoi7({cau,daGap,daLamNgay:new Set(),quotaCon:0,sanSang:new Set(),chan:new Set(),sua:[],on:[],mucTieuNgay:0,nhomPhu:goi.map(g=>({qids:g.cau.map(c=>c.qid),quota:g.quota}))})
  return {tong:Math.max(gap.size,plan.viec.length+plan.thieuPhu),daLam:gap.size}
}
export async function docGoiCuaEm7(env: Env, sbd: string, now: number, chiDoc=false): Promise<GoiCuaEm7[]> {
  if(!chiDoc)await damBaoGoi7(env)
  const ngay = ngayVn7(now)
  const gs = await env.DB.prepare(`SELECT g.id,g.ten,g.khoa_bai,e.bat_dau,e.han FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id
    JOIN hoc_sinh h ON h.sbd=e.sbd AND h.lop=g.lop JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE e.sbd=? ORDER BY e.bat_dau DESC,g.id`).bind(sbd).all<Row>()
  if (!gs.results.length) return []
  const gids = JSON.stringify(gs.results.map(g => g.id))
  const [cs, gaps, events, quotas] = await Promise.all([
    env.DB.prepare('SELECT * FROM goi_bai_7_cau WHERE goi_id IN (SELECT value FROM json_each(?))').bind(gids).all<Row>(),
    env.DB.prepare('SELECT goi_id,qid,version,kieu,luc FROM goi_bai_7_gap WHERE sbd=? AND goi_id IN (SELECT value FROM json_each(?)) ORDER BY luc,receipt').bind(sbd,gids).all<Row>(),
    env.DB.prepare(`SELECT qid,json_extract(raw_json,'$.ht_cau_version') cau_version,ngay_vn,assistance,ket_qua FROM su_kien_hoc WHERE sbd=? AND received_at<=? AND qid IN (SELECT qid FROM goi_bai_7_cau WHERE goi_id IN (SELECT value FROM json_each(?))) AND ${SQL_LUOT_GOI7}`).bind(sbd,now,gids).all<Row>(),
    env.DB.prepare('SELECT * FROM goi_bai_7_ngay WHERE sbd=? AND ngay=?').bind(sbd,ngay).all<Row>(),
  ])
  const out: GoiCuaEm7[] = []
  for (const g of gs.results) {
    const cau = cs.results.filter(c => c.goi_id === g.id).map(c => json<CauGoi7>(c.meta_json)), versions = new Map(cau.map(c => [c.qid,c.version]))
    const daGap = new Set<string>(), gapNgay = new Set<string>(), tuLamNgay = new Set<string>(), choThay = new Set<string>(), first = new Map<string,string>()
    const gap = (qid:string,ngayGap:string) => { daGap.add(qid); if (!first.has(qid) || first.get(qid)!>ngayGap) first.set(qid,ngayGap) }
    for (const e of events.results) if (e.ket_qua !== null && str(e.cau_version) === versions.get(str(e.qid))) {
      gap(str(e.qid),str(e.ngay_vn)); if (e.ngay_vn === ngay) tuLamNgay.add(str(e.qid))
    }
    for (const e of gaps.results) if (e.goi_id === g.id && str(e.version) === versions.get(str(e.qid))) {gap(str(e.qid),ngayVn7(Date.parse(str(e.luc))));if(e.kieu==='cho_thay')choThay.add(str(e.qid));else choThay.delete(str(e.qid))}
    for (const [qid,d] of first) if (d===ngay) gapNgay.add(qid)
    const cu = quotas.results.find(q => q.goi_id === g.id)
    const quota = Math.max(cu ? Number(cu.quota) : 0,quotaGoi7(cau.length - daGap.size + gapNgay.size, ngay, str(g.han)))
    if (!cu && !chiDoc) await env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota) VALUES(?,?,?,?)').bind(g.id,sbd,ngay,quota).run()
    out.push({ id: str(g.id), ten: str(g.ten), khoaBai: str(g.khoa_bai), batDau: str(g.bat_dau), han: str(g.han), cau, daGap, gapNgay, tuLamNgay, choThay, quota })
  }
  return out
}

export async function lapGoi7(env: Env, sbd: string, now: number) {
  const goi = await docGoiCuaEm7(env,sbd,now)
  if (!goi.length) return null
  const qids = [...new Set(goi.flatMap(g => g.cau.map(c => c.qid)))], ngay = ngayVn7(now)
  const lop = (await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{lop:string}>())?.lop ?? ''
  const phamVi = await phamViLop(env,lop)
  const maCu = [...(phamVi?.maDe ?? [])].filter(m => !goi.some(g => g.cau.some(c => c.maDe === m)))
  // Ma trận cũ là toàn phạm vi; mẫu bổ sung chọn theo độ yếu, không chỉ câu đã làm.
  const [old,ungCu] = await Promise.all([
    env.DB.prepare(`SELECT DISTINCT j.value AS kn,p.trang_thai FROM game_v2_question q LEFT JOIN omni_q o ON q.qid=o.qid,
      json_each(CASE WHEN json_array_length(COALESCE(o.vkn_json,'[]'))>0 THEN o.vkn_json ELSE json_array(CASE WHEN COALESCE(q.dang,'')<>'' THEN 'dang:'||q.dang ELSE 'cau:'||q.qid END) END) j LEFT JOIN omni_p_vkn p ON p.vkn_id=j.value AND p.sbd=? WHERE q.ma_de IN (SELECT value FROM json_each(?))`).bind(sbd,JSON.stringify(maCu)).all<Row>(),
    env.DB.prepare(`SELECT q.qid,MIN(COALESCE(p.p,0.3)) yeu FROM game_v2_question q LEFT JOIN omni_q o ON o.qid=q.qid,
      json_each(CASE WHEN json_array_length(COALESCE(o.vkn_json,'[]'))>0 THEN o.vkn_json ELSE json_array(CASE WHEN COALESCE(q.dang,'')<>'' THEN 'dang:'||q.dang ELSE 'cau:'||q.qid END) END) j LEFT JOIN omni_p_vkn p ON p.vkn_id=j.value AND p.sbd=?
      WHERE q.ma_de IN(SELECT value FROM json_each(?)) AND json_extract(q.json,'$.reviewed')=1
      GROUP BY q.qid ORDER BY yeu,q.qid LIMIT 96`).bind(sbd,JSON.stringify(maCu)).all<Row>(),
  ])
  const [hs, baoVe, btvn, control] = await Promise.all([docHoSo2(env,sbd,ngay,undefined,undefined,undefined,[...qids,...ungCu.results.map(r=>str(r.qid))]), protectedQuestions(env),docCauBtvnChuaNop(env,sbd),readGameScope(env,sbd)])
  const chan = new Set([...baoVe,...btvn,...control.blocked,...goi.flatMap(g=>g.cau.filter(c=>c.hopLe===false).map(c=>c.qid))])
  if (control.types.length) for (const c of hs.cau) if (!c.dang || !control.types.includes(c.dang)) chan.add(c.qid)
  const engine = await dongCoHanhTrinh(env,sbd,now,hs,chan)
  const sanSang = new Set(hs.cau.filter(c => !engine.chan.has(c.qid) && !chan.has(c.qid) && !chan.has(hs.meta.get(c.qid)?.group??'') && !hs.meta.get(c.qid)?.tuLuan).map(c => c.qid))
  const done=await env.DB.prepare(`SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd=? AND ngay_vn=? AND ket_qua IS NOT NULL AND ${SQL_LUOT_GOI7}`).bind(sbd,ngay).all<{qid:string}>()
  const daLamNgay = new Set(done.results.map(r=>r.qid))
  const guidedToday=await env.DB.prepare("SELECT DISTINCT qid FROM goi_bai_7_gap WHERE sbd=? AND date(luc,'+7 hours')=?").bind(sbd,ngay).all<{qid:string}>()
  for(const r of guidedToday.results)daLamNgay.add(r.qid)
  const [views,teacherCorrections]=await Promise.all([
    env.DB.prepare('SELECT DISTINCT qid FROM loi_giai_hoi WHERE sbd=? AND julianday(luc)>=julianday(?)-0.5').bind(sbd,new Date(now).toISOString()).all<{qid:string}>(),
    env.DB.prepare('SELECT goi_id,qid,version FROM goi_bai_7_chua WHERE goi_id IN(SELECT value FROM json_each(?))').bind(JSON.stringify(goi.map(g=>g.id))).all<Row>(),
  ])
  const vuaXem=new Set(views.results.map(r=>r.qid)),daGap = new Set(goi.flatMap(g => [...g.daGap]))
  const uuTien=(a:{qid:string},b:{qid:string})=>(engine.trongSo[b.qid]??0)-(engine.trongSo[a.qid]??0)||a.qid.localeCompare(b.qid)
  const sua = hs.cau.filter(c => !vuaXem.has(c.qid)&&['mo','cho_kiem'].includes(hs.loiV2?.get(c.qid)?.trangThai ?? '')).sort(uuTien).map(c => c.qid)
  const on = hs.cau.filter(c => !vuaXem.has(c.qid)&&(!qids.includes(c.qid)||daGap.has(c.qid)) && (hs.tt.get(c.qid)?.laMoi || (engine.hen.get(c.qid) ?? hs.tt.get(c.qid)?.henOn ?? '9999') <= ngay)).sort(uuTien).map(c => c.qid)
  const chua=goi.flatMap(g=>g.cau.filter(c=>g.choThay.has(c.qid)&&teacherCorrections.results.some(r=>r.goi_id===g.id&&r.qid===c.qid&&r.version===c.version)).map(c=>c.qid))
  const cau = [...new Map(goi.flatMap(g => g.cau).map(c => [c.qid,c])).values()]
  const quotaCon = goi.reduce((n,g) => n+Math.max(0,g.quota-g.gapNgay.size),0)
  const tang = tangCuaEm(hs.cau,hs.tt,new Map([...hs.meta].map(([qid,m])=>[qid,m.group])))
  const toiThieu = CAU_TOI_THIEU[tang]
  const nhomPhu=[...goi].sort((a,b)=>a.han.localeCompare(b.han)).map(g=>({qids:g.cau.map(c=>c.qid),quota:Math.max(0,g.quota-g.gapNgay.size)}))
  const plan = chonGoi7({ cau,daGap,daLamNgay,quotaCon,sanSang,chan,sua,on,chua,mucTieuNgay:Math.max(0,toiThieu-daLamNgay.size),trongSo:engine.trongSo,nhomPhu })
  const kiem=await env.DB.prepare('SELECT goi_id,ma_de,diem,nop_luc,json FROM goi_bai_7_kiem WHERE sbd=? AND nop_luc IS NOT NULL ORDER BY nop_luc DESC LIMIT 30').bind(sbd).all<Row>()
  const diemDaDo=kiem.results.filter(r=>diemConDungNguon7(json<Row>(r.json).cau,goi.find(g=>g.id===r.goi_id)?.cau.filter(c=>(c.maTo??c.maDe)===r.ma_de)??[])).map(r=>({goiId:str(r.goi_id),maDe:str(r.ma_de),diem:Number(r.diem),luc:str(r.nop_luc),cauMoi:Number(json<Row>(r.json).cauMoi??0),tong:Number(json<Row>(r.json).tong??0)}))
  const skills = new Map(old.results.map(r => [str(r.kn),r.trang_thai === 'dat']))
  const kienThucCu = { tong: skills.size, dat: [...skills.values()].filter(Boolean).length, tyLe: skills.size ? Math.round(1000*[...skills.values()].filter(Boolean).length/skills.size)/10 : null }
  return { goi, plan, hs, chan, control, kienThucCu, diemDaDo, toiThieu, daLamNgay:daLamNgay.size }
}

export function tomTatGoi7(lap: NonNullable<Awaited<ReturnType<typeof lapGoi7>>>, now: number) {
  return { bat: true, ngay: ngayVn7(now), goi: lap.goi.map(g => ({ id:g.id,ten:g.ten,batDau:g.batDau,han:g.han,tong:g.cau.length,daGap:g.daGap.size,
    con:g.cau.length-g.daGap.size,to:[...new Set(g.cau.map(c=>c.maTo??c.maDe))],canBoSung:g.cau.filter(c=>c.hopLe===false).length,quota:g.quota,gapHomNay:g.gapNgay.size,quaHan:ngayVn7(now)>g.han && g.daGap.size<g.cau.length })),
    tuLamCon:lap.plan.tuLam,tiepCanCon:lap.plan.tiepCan,thieuPhu:lap.plan.thieuPhu,thieuNgay:Math.max(0,lap.toiThieu-lap.daLamNgay-lap.plan.viec.length),kienThucCu:lap.kienThucCu,
    canHoTro:lap.plan.tuLam*2+lap.plan.tiepCan*3>60 || lap.plan.thieuPhu>0 || lap.daLamNgay+lap.plan.viec.length<lap.toiThieu,
    mucTieuDiem:7,diemDaDo:lap.diemDaDo,toiThieu:lap.toiThieu,daLamHomNay:lap.daLamNgay }
}

/** Một đợt tối đa 6 câu; giữ các câu/phiên bản và vai ở máy chủ, không phát đáp án. */
export async function startGoi7(env: Env, sbd: string, now: number): Promise<Record<string,unknown> | null> {
  const lap = await lapGoi7(env,sbd,now)
  if (!lap) return null
  if (!lap.control.enabled) throw new Error('Thầy đang tạm dừng bài học cho em.')
  const khoi = await docKhoiEm(env,sbd)
  const old = await env.DB.prepare(`SELECT id,json FROM game_v2_session WHERE sbd=? AND created_at>=? AND json_extract(json,'$.hocTap')=1 ORDER BY created_at DESC LIMIT 1`).bind(sbd,new Date(now-2*3600000).toISOString()).first<Row>()
  const saved = old ? json<{questions:RefGoi7[]}>(old.json) : null
  const answered = old ? await env.DB.prepare('SELECT qid FROM game_v2_attempt WHERE session=? AND sbd=? UNION SELECT qid FROM goi_bai_7_gap WHERE receipt LIKE ? AND sbd=?').bind(old.id,sbd,`${str(old.id)}|%`,sbd).all<{qid:string}>() : {results:[]}
  const done = new Set(answered.results.map(r => r.qid))
  const viec = saved ? saved.questions.filter(r => !done.has(r.qid)).map(r=>({...r,vai:r.vai??'on',huongDan:r.huongDan??false})) : []
  const refs: RefGoi7[] = [], questions: Record<string,unknown>[] = []
  for (const v of (viec.length ? viec : lap.plan.viec.slice(0,6))) {
    const oldRef=saved?.questions.find(r=>r.qid===v.qid)
    const meta = oldRef ?? lap.hs.meta.get(v.qid) ?? lap.goi.flatMap(g=>g.cau).find(c=>c.qid===v.qid)
    if (!meta || lap.chan.has(v.qid) || lap.chan.has(meta.group)) continue
    let q: PrivateQuestion; try { q=await currentQuestion(env,meta) } catch { continue }
    if (!(await chanKhacKhoiEm(env,'goi7',{sbd,khoiEm:khoi},[q])).length || laCauTuLuan(q) || !q.reviewed || lap.control.types.length && (!q.dang || !lap.control.types.includes(q.dang))) continue
    let lamLai:LamLaiRef|undefined
    if(oldRef)q=apXaoTheoRef(q,oldRef)
    else if(v.vai==='sua'){
      const m=lap.hs.meta.get(q.qid)
      if(m){const x=(await apLamLaiKhac(env,lap.hs,[{q,m}],{sbd,nowMs:now,keHoach:lap.plan.viec.map(v=>v.qid)},new Set([...lap.chan,...refs.map(r=>r.qid)])))[0];if(x){q=x.q;lamLai=x.lamLai;const ss=tachSongSinh(q.qid);if(ss.songSinh!==null)lamLai={...lamLai,tc:ss.goc}}}
    }
    const ref: RefGoi7 = {...oldRef,...lamLai,qid:q.qid,maDe:q.maDe,version:q.version,group:q.group,novel:lap.hs.tt.get(q.qid)?.laMoi ?? true,
      role:v.vai==='moi'?'cau_moi':v.vai==='sua'?'on_lai':'on_lai',vai:v.vai,huongDan:v.huongDan}
    refs.push(ref); questions.push({...publicQuestion(q),...(ref.goiY?{goiY:ref.goiY}:{}),vaiGoi7:v.vai,huongDan7:v.huongDan,coGoi7:lap.goi.some(g=>g.cau.some(c=>c.qid===q.qid&&c.version===q.version))})
  }
  if (!refs.length) return {ok:true,questions:[],goi7:tomTatGoi7(lap,now),message:lap.plan.thieuPhu?'Còn câu cần thầy bổ sung học liệu hoặc đang được giữ cho ca kiểm tra.':'Em đã hoàn thành phần được xếp hôm nay. Lỗi chưa kiểm chứng vẫn được giữ để học tiếp.'}
  const id = viec.length && refs.length === viec.length ? str(old!.id) : crypto.randomUUID()
  if (id !== str(old?.id)) await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').bind(id,sbd,JSON.stringify({mode:'adventure',created:now,hoa2:1,hocTap:1,goi7:1,questions:refs}),new Date(now).toISOString()).run()
  return {ok:true,id,questions,goi7:tomTatGoi7(lap,now)}
}
interface RefGoi7 extends LamLaiRef { qid:string; maDe:string; version:string; group:string; novel:boolean; role:string; vai:ViecGoi7['vai']; huongDan:boolean; goiY?:unknown }

/** Em chọn "Chưa tự làm được" là nộp yêu cầu học có hỗ trợ, không phải một câu làm đúng/sai. */
export async function gapHuongDan7(env: Env,sbd: string,b: Row,now: number) {
  if (b.chuaTuLam !== true) throw new Error('Em chọn cách học từng bước trước khi xem phần chữa.')
  const row = await env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(str(b.session),sbd).first<{json:string}>()
  if (!row) throw new Error('Không tìm thấy đợt học của em.')
  const s = json<{goi7?:number;created:number;questions:RefGoi7[]}>(row.json), ref = s.questions.find(q=>q.qid===b.qid)
  if (!s.goi7 || !ref || now-s.created>2*3600000) throw new Error('Đợt học đã hết hạn. Em mở đợt mới.')
  const [q,blocked,btvn,control,goi] = await Promise.all([currentQuestion(env,ref),protectedQuestions(env),docCauBtvnChuaNop(env,sbd),readGameScope(env,sbd),docGoiCuaEm7(env,sbd,now)])
  if (!control.enabled || blocked.has(q.qid) || blocked.has(q.group) || btvn.has(q.qid) || control.blocked.includes(q.qid) || control.types.length && (!q.dang || !control.types.includes(q.dang))) throw new Error('Câu này hiện chưa mở phần chữa. Em chuyển sang câu khác.')
  const gs = goi.filter(g=>g.cau.some(c=>c.qid===q.qid && c.version===q.version))
  if (!gs.length || !q.reviewed || laCauTuLuan(q) || !(await chanKhacKhoiEm(env,'goi7-chua',sbd,[q])).length) throw new Error('Câu không thuộc bài được giao cho em.')
  const chua = await env.DB.prepare('SELECT loi_go FROM goi_bai_7_chua WHERE qid=? AND version=? AND goi_id IN (SELECT value FROM json_each(?)) LIMIT 1').bind(q.qid,q.version,JSON.stringify(gs.map(g=>g.id))).first<{loi_go:string}>()
  const solution = chua?.loi_go && chua.loi_go!=='@loi-giai-goc' ? chua.loi_go : q.solution
  if (!solution || typeof solution==='string' && !solution.trim()) {
    // Chỉ chứng nhận em đã gặp câu và cần thầy, không phát đáp án hay ghi đã hiểu.
    await env.DB.batch(gs.map(g=>env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)').bind(`${str(b.session)}|${q.qid}|${g.id}`,g.id,sbd,q.qid,q.version,'cho_thay',new Date(now).toISOString())))
    return {ok:true,choThay:true,correct:false}
  }
  // Sau khi phần chữa đã mở, máy chủ buộc mọi lần nộp trong phiên này là có hỗ trợ.
  ref.goiY={cotLoi:'Đã học phần chữa'}
  await env.DB.batch([
    env.DB.prepare("UPDATE game_v2_session SET json=json_set(json,? ,json(?)) WHERE id=? AND sbd=? AND json_extract(json,?)=?").bind(`$.questions[${s.questions.indexOf(ref)}].goiY`,JSON.stringify(ref.goiY),str(b.session),sbd,`$.questions[${s.questions.indexOf(ref)}].qid`,q.qid),
    ...gs.map(g=>env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)').bind(`${str(b.session)}|${q.qid}|${g.id}`,g.id,sbd,q.qid,q.version,'co_ho_tro',new Date(now).toISOString())),
    env.DB.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc) VALUES(?,?,?)').bind(sbd,q.qid,new Date(now).toISOString()),
  ])
  return {ok:true,correct:false,answer:q.correct,solution,solutionImages:q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai'),hocCoHoTro:true}
}
