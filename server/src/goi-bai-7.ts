import type { Env } from './kieu'
import { chayDdlMotLan, ddlDaXong } from './ddl-mot-lan'
import { SQL_GOI7 } from './goi-bai-7-schema'
import { chonGoi7, congNgay7, ngayVn7, quotaGoi7, diemConDungNguon7, mucNgayGoi7, type CauGoi7, type ViecGoi7 } from './goi-bai-7-loi'
import { tachMaTo } from './srs2-gv'
import { laMaToKhongGiao, damBaoBangBaiDaDay, phamViLop, lopCuaEm } from './bai-da-day'
import { TEN_LOP_CHUA_XEP, TEN_LOP_THUONG_12 } from './ten-lop'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { publicQuestion, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { docCauTheoRef, loiCauDoi, protectedQuestions, docKhoiEm, dongBoCacTo } from './game-v2-bank'
import { readGameScope } from './game-v2-reports'
import { docHoSo2, docMetaCau } from './srs2-d1'
import { docCauBtvnChuaNop } from './game-v2-luot'
import { dongCoHanhTrinh, docTruocDongCo, docTruocDongCoNeuSanBang, docTruocDongCoTheoHoSo } from './hanh-trinh-dong-co'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { CAU_TOI_THIEU, tangCuaEm, type TangHanhTrinh } from './hanh-trinh-ngay'
import { chanKhacKhoiEm } from './chan-khac-khoi'
import { apLamLaiKhac } from './cau-anh-em'
import { apXaoTheoRef, type LamLaiRef } from './lam-lai-so'
import { tachSongSinh } from './loi-hoc-luat'
import { quotaHocKt } from './kiem-tra-ca-nhan-loi'
import { docCauHinhDem } from './cau-hinh-dem'

type Row = Record<string, unknown>
const str = (x: unknown) => String(x ?? '')
async function currentQuestion(env: Env, ref: {qid:string;maDe:string;version:string}) { const q = await docCauTheoRef(env,ref); if (!q) throw loiCauDoi(); return q }
export function mang7(x: unknown): string[] { try { const a: unknown = typeof x === 'string' ? JSON.parse(x) : x; return Array.isArray(a) ? a.filter((v): v is string => typeof v === 'string') : [] } catch { return [] } }
const json = <T>(x: unknown): T => JSON.parse(str(x)) as T
const KHONG_CA = "NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')"
export const SQL_LUOT_GOI7 = `${SQL_LA_LAN_LAM} AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))`
/**
 * TÊN LỚP HIỆU LỰC của một dòng `hoc_sinh` (bí danh `h`) viết bằng SQL — ĐÚNG luật `tenLopCuaEm` (ten-lop.ts): `ten_lop` đã gán thì dùng, không thì
 * mặc định theo KHỐI (`lop` là KHỐI: '12' ⇒ '12 - Lớp Thường'; rỗng ⇒ 'Chưa xếp lớp'; khối khác ⇒ chính nó).
 * LỖI THẬT 12/10 (thầy chụp "Học sinh nhận bài 0 · Câu cần chữa 132" ở gói "12 - Lớp Thường · Bài 8 Amine"): `goi_bai_7.lop` = `bai_da_day.lop` là
 * TÊN LỚP ("12 - Lớp Thường", "12 - Tinh Hoa"…) mà gói so với `hoc_sinh.lop` (KHỐI "12") ⇒ không em nào được gắn vào gói (máy em cũng không thấy
 * gói). Mọi chỗ so lớp em với lớp gói đi qua biểu thức này. Chỉ đọc cột sẵn có — không đổi schema.
 */
export const sqlTenLopHs = (h: string): string =>
  `COALESCE(NULLIF(TRIM(${h}.ten_lop),''),CASE TRIM(COALESCE(${h}.lop,'')) WHEN '12' THEN '${TEN_LOP_THUONG_12}' WHEN '' THEN '${TEN_LOP_CHUA_XEP}' ELSE TRIM(${h}.lop) END)`
export interface CoGoi7 { bat: boolean; batDau: string; batLuc?: string }
export async function coGoi7(env: Env, tuoi=false): Promise<CoGoi7> {
  // Đọc kèm cờ kiểm tra riêng/OMNI trong cùng lô cấu hình, tuổi đệm tối đa 15 giây.
  const v=tuoi?(await env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa='goi_bai_7_v1'").first<{gia_tri:string}>())?.gia_tri:await docCauHinhDem(env,'goi_bai_7_v1')
  if (!v) return { bat: false, batDau: '' }
  let c: Row; try { c = json<Row>(v) } catch { return {bat:false,batDau:''} }
  return { bat: c.bat === true, batDau: /^\d{4}-\d{2}-\d{2}$/.test(str(c.batDau)) ? str(c.batDau) : '', batLuc:Number.isFinite(Date.parse(str(c.batLuc)))?str(c.batLuc):undefined }
}
export const damBaoGoi7 = (env: Env) => chayDdlMotLan(env, 'goi_bai_7_v1', SQL_GOI7)
/** Promise bắt đầu SỚM (đợt 17): đánh dấu đã bắt lỗi để không thành lỗi treo — nơi dùng vẫn `await` và nhận đúng lỗi. */
const som = <T,>(p: Promise<T>): Promise<T> => { p.catch(() => {}); return p }

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
  const cfg = await coGoi7(env,true)
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
      env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) SELECT ?,h.sbd,?,? FROM hoc_sinh h WHERE ${sqlTenLopHs('h')}=? AND COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM goi_bai_7 WHERE id=?) AND ${KHONG_CA}`).bind(id,batDau,han,b.lop,id),
    ])
    soGoi += Number(rs[0]?.meta.changes ?? 0); soCau += Number(rs[1]?.meta.changes ?? 0); soEm += Number(rs[2]?.meta.changes ?? 0)
  }
  // Nạp lại chỉ mục đã duyệt: gói rỗng hồi phục, bản sửa được gặp lại; không sửa sổ trả lời.
  // CHỈ GHI KHI ĐỔI (khẩn 12/10 22h30, số đo D1 thật: lệnh upsert này ghi ~1 triệu dòng/ngày — cron mỗi phút ghi lại y nguyên ~164 dòng/gói): dòng câu
  // giống hệt bản mới ⇒ `DO UPDATE … WHERE` bỏ qua, câu đã mang hopLe=false ⇒ không ghi lại. Kết quả trong bảng y hệt trước.
  const active = await env.DB.prepare(`SELECT b.*,g.id goi_id FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE (?='' OR b.lop=?) ORDER BY g.bat_dau DESC LIMIT ?`).bind(lop,lop,Math.max(1,tran)).all<Row>()
  for (const b of active.results) {
    const cau = await cauTuTick7(env,b)
    // Chỉ mục chưa sẵn sàng không làm mất manifest trước đó.
    if (!cau.length) continue
    const payload=JSON.stringify(cau),id=str(b.goi_id)
    await env.DB.batch([
      env.DB.prepare(`UPDATE goi_bai_7_cau SET meta_json=json_set(meta_json,'$.hopLe',json('false')) WHERE goi_id=? AND qid NOT IN(SELECT json_extract(value,'$.qid') FROM json_each(?)) AND COALESCE(json_extract(meta_json,'$.hopLe'),1)<>0 AND ${KHONG_CA}`).bind(id,payload),
      env.DB.prepare(`INSERT INTO goi_bai_7_cau(goi_id,qid,version,ma_de,meta_json) SELECT ?,json_extract(value,'$.qid'),json_extract(value,'$.version'),json_extract(value,'$.maDe'),value FROM json_each(?) WHERE ${KHONG_CA} ON CONFLICT(goi_id,qid) DO UPDATE SET version=excluded.version,ma_de=excluded.ma_de,meta_json=excluded.meta_json
        WHERE goi_bai_7_cau.version IS NOT excluded.version OR goi_bai_7_cau.ma_de IS NOT excluded.ma_de OR goi_bai_7_cau.meta_json IS NOT excluded.meta_json`).bind(id,payload),
    ])
  }
  // Em mới chuyển/đăng ký lớp cũng nhận bài, không tạo lại tiến độ của em cũ.
  await env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han)
    SELECT g.id,h.sbd,g.bat_dau,g.han FROM goi_bai_7 g JOIN hoc_sinh h ON ${sqlTenLopHs('h')}=g.lop AND COALESCE(h.trang_thai,'')<>'khoa' JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE ${KHONG_CA}`).run()
  return { soGoi, soEm, soCau, hoan: false }
}

async function cauTuTick7(env: Env,b: Row): Promise<CauGoi7[]> {
  const to = mang7(b.ma_to_json).filter(m => !laMaToKhongGiao(m)), goc = [...new Set(to.map(m => tachMaTo(m).goc))]
  // Nguồn vừa bổ sung không phải chờ em mở game cũ để lập chỉ mục.
  if(env.DE)for(let i=0;i<goc.length;i+=3)await dongBoCacTo(env,goc.slice(i,i+3))
  if(!await duNguonGoi7(env,to))return []
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

export async function duNguonGoi7(env:Env,maTo:readonly string[]):Promise<boolean>{
  const roots=[...new Set(maTo.filter(m=>!laMaToKhongGiao(m)).map(m=>tachMaTo(m).goc))]
  if(!roots.length)return false
  const r=await env.DB.prepare(`SELECT d.ma_de FROM de_kho d JOIN game_v2_index i ON i.ma_de=d.ma_de AND i.source_version=d.cap_nhat_luc WHERE COALESCE(d.da_xoa,0)=0 AND d.ma_de IN(SELECT value FROM json_each(?))`).bind(JSON.stringify(roots)).all<{ma_de:string}>()
  return new Set(r.results.map(r=>r.ma_de)).size===roots.length
}
export interface GoiCuaEm7 { id: string; ten: string; khoaBai: string; batDau: string; han: string; maDeNguon:string[]; cau: CauGoi7[]; daGap: Set<string>; gapNgay: Set<string>; tuLamNgay: Set<string>; choThay: Set<string>; nguonDayDu:boolean; quota: number }
/** Báo cáo câu mới: vượt quota vẫn hiển thị; một gốc dùng cho hai bài chỉ đếm một lần. */
export function homNayGoi7(goi:readonly GoiCuaEm7[]){
  const gap=new Set(goi.flatMap(g=>[...g.gapNgay])),daGap=new Set(goi.flatMap(g=>[...g.daGap]).filter(q=>!gap.has(q)))
  const cau=[...new Map(goi.flatMap(g=>g.cau).map(c=>[c.qid,c])).values()]
  const plan=chonGoi7({cau,daGap,daLamNgay:new Set(),quotaCon:0,sanSang:new Set(),chan:new Set(),sua:[],on:[],mucTieuNgay:0,nhomPhu:goi.map(g=>({qids:g.cau.map(c=>c.qid),quota:g.quota}))})
  return {tong:Math.max(gap.size,plan.viec.length+plan.thieuPhu),daLam:gap.size}
}
/** Phần của một gói nơi gọi cần biết SỚM (ngay khi đọc danh sách gói, trước lượt đọc câu/sổ): mã gói + gốc các tờ nguồn — tính y như `GoiCuaEm7`. */
export interface GoiNhe7 { id: string; maDeNguon: string[] }
const goiNheTuDong7 = (g: Row): GoiNhe7 => ({ id: str(g.id), maDeNguon: [...new Set(mang7(g.ma_to_json).map(m => tachMaTo(m).goc))] })
/** Danh sách gói em đang nhận (một câu đọc) — đầu vào của `docGoiCuaEm7`. */
const docDanhSachGoi7 = (env: Env, sbd: string) => env.DB.prepare(`SELECT g.id,g.ten,g.khoa_bai,e.bat_dau,e.han,b.ma_to_json FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id
    JOIN hoc_sinh h ON h.sbd=e.sbd AND ${sqlTenLopHs('h')}=g.lop JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE e.sbd=? ORDER BY e.bat_dau DESC,g.id`).bind(sbd).all<Row>()
/**
 * ĐỌC ĐOÁN danh sách gói của em (đợt 18): Sảnh / Mở chặng gọi CÙNG lúc đọc cờ Gói 7 (`coGoi7`) — trước: đọc cờ xong mới đọc gói, hai đợt D1 nối tiếp.
 * CHỈ khi bảng gói đã tạo xong trong isolate (không gửi lệnh tạo bảng trước khi biết cờ bật). Cờ tắt ⇒ kết quả bỏ không dùng (một lượt đọc thừa có chỉ mục,
 * chỉ khi Gói 7 tắt). Cùng câu SQL, cùng tham số với lượt đọc của `docGoiCuaEm7`; lỗi giữ bằng `som`, nổi lên đúng chỗ `await` cũ. Chưa sẵn bảng ⇒ undefined.
 */
export function docDanhSachGoiSom7(env: Env, sbd: string): Promise<{ results: Row[] }> | undefined {
  return ddlDaXong(env, 'goi_bai_7_v1') ? som(docDanhSachGoi7(env, sbd)) : undefined
}
/** `khiCoGoi` (đợt 18): em CÓ gói ⇒ báo nơi gọi NGAY sau lượt đọc danh sách gói để nó bắt đầu các lượt đọc của riêng nó CÙNG đợt với lượt đọc câu/sổ bên dưới
 *  (trước: chờ hàm này xong — hai đợt D1 nối tiếp). Lỗi của móc không làm hỏng việc đọc gói.
 *  `gsSom` = lượt `docDanhSachGoiSom7(env, sbd)` (đọc đoán cùng đợt cờ Gói 7); vắng ⇒ đọc như cũ (sau `damBaoGoi7`). */
export async function docGoiCuaEm7(env: Env, sbd: string, now: number, chiDoc=false, khiCoGoi?: (goi: readonly GoiNhe7[]) => void, gsSom?: Promise<{ results: Row[] }>): Promise<GoiCuaEm7[]> {
  if(!chiDoc)await damBaoGoi7(env)
  const ngay = ngayVn7(now)
  const gs = await (gsSom ?? docDanhSachGoi7(env, sbd))
  if (!gs.results.length) return []
  if (khiCoGoi) { try { khiCoGoi(gs.results.map(goiNheTuDong7)) } catch { /* chỉ là tăng tốc */ } }
  // ĐỌC TRƯỚC (đợt 18): kiểm "nguồn đủ" của TỪNG gói đi CÙNG đợt với lượt đọc câu/sổ dưới (trước: nối tiếp sau, mỗi gói một đợt). Cùng câu SQL, cùng
  // tham số; chỉ đọc bảng tờ/chỉ mục (không lệnh ghi nào của lượt này đụng). Gói không còn câu nào vẫn bỏ qua kết quả như cũ. Lỗi nổi lên đúng chỗ `await` cũ.
  const nguonSom = gs.results.map(g => som(duNguonGoi7(env,mang7(g.ma_to_json))))
  const gids = JSON.stringify(gs.results.map(g => g.id))
  const [cs, gaps, events, quotas] = await Promise.all([
    env.DB.prepare('SELECT * FROM goi_bai_7_cau WHERE goi_id IN (SELECT value FROM json_each(?))').bind(gids).all<Row>(),
    env.DB.prepare('SELECT goi_id,qid,version,kieu,luc FROM goi_bai_7_gap WHERE sbd=? AND goi_id IN (SELECT value FROM json_each(?)) ORDER BY luc,receipt').bind(sbd,gids).all<Row>(),
    env.DB.prepare(`SELECT qid,json_extract(raw_json,'$.ht_cau_version') cau_version,ngay_vn,assistance,ket_qua FROM su_kien_hoc WHERE sbd=? AND received_at<=? AND qid IN (SELECT qid FROM goi_bai_7_cau WHERE goi_id IN (SELECT value FROM json_each(?))) AND ${SQL_LUOT_GOI7}`).bind(sbd,now,gids).all<Row>(),
    env.DB.prepare('SELECT * FROM goi_bai_7_ngay WHERE sbd=? AND ngay=?').bind(sbd,ngay).all<Row>(),
  ])
  const out: GoiCuaEm7[] = []
  const kt=await import('./kiem-tra-ca-nhan')
  const ngayKiem=await kt.coKtCn(env)?new Set((await env.DB.prepare("SELECT ngay FROM kiem_tra_ca_nhan WHERE sbd=? AND trang_thai<>'cho_nguon' AND ngay>=?").bind(sbd,ngay).all<{ngay:string}>()).results.map(r=>r.ngay)):new Set<string>()
  for (const [i, g] of gs.results.entries()) {
    const cau = cs.results.filter(c => c.goi_id === g.id).map(c => json<CauGoi7>(c.meta_json)), versions = new Map(cau.map(c => [c.qid,c.version]))
    const nguonDayDu=cau.length>0&&await nguonSom[i]!
    if(!nguonDayDu)for(const c of cau)c.hopLe=false
    const daGap = new Set<string>(), gapNgay = new Set<string>(), tuLamNgay = new Set<string>(), choThay = new Set<string>(), first = new Map<string,string>()
    const gap = (qid:string,ngayGap:string) => { daGap.add(qid); if (!first.has(qid) || first.get(qid)!>ngayGap) first.set(qid,ngayGap) }
    for (const e of events.results) if (e.ket_qua !== null && str(e.cau_version) === versions.get(str(e.qid))) {
      gap(str(e.qid),str(e.ngay_vn)); if (e.ngay_vn === ngay) tuLamNgay.add(str(e.qid))
    }
    for (const e of gaps.results) if (e.goi_id === g.id && str(e.version) === versions.get(str(e.qid))) {gap(str(e.qid),ngayVn7(Date.parse(str(e.luc))));if(e.kieu==='cho_thay')choThay.add(str(e.qid));else choThay.delete(str(e.qid))}
    for (const [qid,d] of first) if (d===ngay) gapNgay.add(qid)
    const cu = quotas.results.find(q => q.goi_id === g.id)
    const quota = ngayKiem.has(ngay)?0:Math.max(cu ? Number(cu.quota) : 0,ngayKiem.size?quotaHocKt(cau.length-daGap.size+gapNgay.size,ngay,str(g.han),ngayKiem):quotaGoi7(cau.length - daGap.size + gapNgay.size, ngay, str(g.han)))
    if (!cu && !chiDoc) await env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota) VALUES(?,?,?,?)').bind(g.id,sbd,ngay,quota).run()
    out.push({ id: str(g.id), ten: str(g.ten), khoaBai: str(g.khoa_bai), batDau: str(g.bat_dau), han: str(g.han),maDeNguon:[...new Set(mang7(g.ma_to_json).map(m=>tachMaTo(m).goc))], cau, daGap, gapNgay, tuLamNgay, choThay, nguonDayDu, quota })
  }
  return out
}

/** Mức hôm nay đã chốt của em ngày Gói 7 (một dòng `goi_bai_7_muc_ngay`). */
export interface MucNgay7 { tang: TangHanhTrinh; toiThieuTang: number; quota: number; muc: number; daChot: boolean }
const tangHopLe7 = (v: unknown): TangHanhTrinh => { const t = Math.floor(Number(v)); return (t >= 1 && t <= 4 ? t : 1) as TangHanhTrinh }
/**
 * CHỐT MỨC HÔM NAY (thầy 12/10: "một con số"). Lần lập đầu tiên trong ngày ghi `muc = mucNgayGoi7(CAU_TOI_THIEU[tầng], Σ quota câu mới hôm nay)` bằng
 * INSERT OR IGNORE; mọi lần sau trong ngày (và mọi màn thầy / phụ huynh / Nhịp học) ĐỌC LẠI số đã chốt — tầng lên giữa ngày hay lịch gói đổi cũng không
 * làm mức nhảy. `chiDoc` ⇒ không ghi (tính ra số nhưng `daChot: false`). Hai máy cùng lập lần đầu ⇒ đọc lại dòng thắng sau khi ghi.
 */
/** Dòng mức hôm nay ĐÃ CHỐT của em (null ⇒ chưa chốt / lỗi đọc). Đầu vào của `chotMucNgay7`; tách riêng (đợt 18) để `lapGoi7` đọc trước cùng đợt. */
export async function docMucNgay7(env: Env, sbd: string, ngay: string): Promise<MucNgay7 | null> {
  const r = await env.DB.prepare('SELECT tang,toi_thieu_tang,quota,muc FROM goi_bai_7_muc_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>().catch(() => null)
  return r && Number(r.muc) > 0 ? { tang: tangHopLe7(r.tang), toiThieuTang: Number(r.toi_thieu_tang) || 0, quota: Number(r.quota) || 0, muc: Number(r.muc), daChot: true } : null
}
/** `cuSom` = lượt `docMucNgay7(env,sbd,ngay)` nơi gọi đã bắt đầu sớm (bảng chỉ hàm này ghi ⇒ đọc sớm cùng kết quả); vắng ⇒ đọc như cũ. Lần đọc lại sau ghi luôn đọc mới. */
export async function chotMucNgay7(env: Env, sbd: string, ngay: string, tang: TangHanhTrinh, tongQuota: number, now: number, chiDoc = false, cuSom?: Promise<MucNgay7 | null>, giuCho=0): Promise<MucNgay7> {
  const doc = (): Promise<MucNgay7 | null> => docMucNgay7(env, sbd, ngay)
  const cu = await (cuSom ?? doc())
  if (cu) return cu
  const toiThieuTang = CAU_TOI_THIEU[tang], quota = Math.max(0, Math.floor(tongQuota) || 0)
  const moi: MucNgay7 = { tang, toiThieuTang, quota, muc: mucNgayGoi7(toiThieuTang, quota+Math.max(0,giuCho)), daChot: false }
  if (chiDoc) return moi
  await env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES(?,?,?,?,?,?,?)')
    .bind(sbd, ngay, moi.tang, moi.toiThieuTang, moi.quota, moi.muc, new Date(now).toISOString()).run()
    // Không ghi được (D1 trục trặc) ⇒ em vẫn học với số vừa tính; thầy thấy ngày ấy là mức ước tính — không làm hỏng màn em.
    .catch((e: unknown) => console.error('[goi7] chưa chốt được mức hôm nay:', e instanceof Error ? e.message : e))
  return (await doc()) ?? moi
}

/** Câu ĐÃ LÀM hôm nay của em (Gói 7): câu có kết quả trong sổ (lướt / chỉ xem không tính) ∪ câu đã học có hướng dẫn hôm nay. MỘT nguồn cho `lapGoi7`
 *  (sảnh, bắt đầu chặng) và lệnh nhẹ `hoc-tap-dem` — hai nơi luôn ra cùng một số. */
export async function docDaLamNgay7(env: Env, sbd: string, ngay: string): Promise<Set<string>> {
  const [done, guidedToday] = await Promise.all([
    env.DB.prepare(`SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd=? AND ngay_vn=? AND ket_qua IS NOT NULL AND ${SQL_LUOT_GOI7}`).bind(sbd,ngay).all<{qid:string}>(),
    env.DB.prepare("SELECT DISTINCT qid FROM goi_bai_7_gap WHERE sbd=? AND date(luc,'+7 hours')=?").bind(sbd,ngay).all<{qid:string}>(),
  ])
  const daLamNgay = new Set(done.results.map(r=>r.qid))
  for(const r of guidedToday.results)daLamNgay.add(r.qid)
  return daLamNgay
}
/**
 * LỆNH NHẸ `hoc-tap-dem` (khẩn 12/10 22h30 — thầy: "tối ưu triệt để máy chủ cho học sinh làm bài tập giờ cao điểm"). Số đo D1 thật 24 giờ: mỗi câu
 * em nộp, màn làm bài gọi lại CẢ sảnh (`lapGoi7`: ~25 truy vấn, gồm đọc siêu dữ liệu ~1.800 dòng câu, ma trận kỹ năng, động cơ hành trình) chỉ để cập
 * nhật ô "đã làm/M câu hôm nay". Lệnh này trả đúng hai con số ấy bằng 3 truy vấn có chỉ mục: đã làm = `docDaLamNgay7` (cùng hàm của `lapGoi7`), M = dòng
 * đã chốt `goi_bai_7_muc_ngay` (chưa chốt ⇒ null, máy em giữ M lúc mở chặng). Chỉ đọc, không ghi.
 */
export async function demHomNay7(env: Env, sbd: string, now: number): Promise<Record<string, unknown>> {
  const ngay = ngayVn7(now)
  const [daLam, muc] = await Promise.all([
    docDaLamNgay7(env, sbd, ngay),
    env.DB.prepare('SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>().catch(() => null),
  ])
  const m = muc ? Number(muc.muc) : NaN
  return { ok: true, ngay, daLamHomNay: daLam.size, toiThieu: Number.isFinite(m) && m > 0 ? m : null }
}
/**
 * CHẠY SỚM SONG SONG của `lapGoi7` (đợt 17; đợt 18 — luật thầy 13/10 "sửa xong máy chủ phải nhanh hơn" — bắt đầu NGAY khi đọc xong danh sách gói, CÙNG đợt với
 * lượt đọc câu/sổ của gói; trước: chờ `docGoiCuaEm7` xong rồi còn nối tiếp lớp ⇒ phạm vi ⇒ ma trận cũ ⇒ hồ sơ ⇒ … động cơ ⇒ mức hôm nay). Mỗi lượt chỉ cần
 * (em, lúc, mã gói, gốc tờ nguồn) — đều đã có từ danh sách gói (bảng gói chắc có: `damBaoGoi7` chạy trước lượt đọc ấy). Cùng câu SQL, cùng tham số; chỉ đổi lúc
 * bắt đầu. Không bảng nào ở đây bị lệnh ghi của lượt này đụng trước lúc đọc cũ (ghi của `docGoiCuaEm7` chỉ vào `goi_bai_7_ngay`). Hồ sơ bắt đầu ngay, chỉ CHỜ
 * danh sách ứng viên (câu gói + ma trận cũ) ở đúng chỗ dùng. Lỗi: `som` giữ, nổi lên đúng chỗ `await` cũ.
 */
function batDauSom7(env: Env, sbd: string, now: number, ngay: string, goi: readonly GoiNhe7[], qidsGoi: Promise<readonly string[]>, lopSom: Promise<string | null>) {
  const phuSom = som(Promise.all([protectedQuestions(env), docCauBtvnChuaNop(env, sbd), readGameScope(env, sbd)]))
  const khoiSom = som(docKhoiEm(env, sbd))
  const daLamSom = som(docDaLamNgay7(env, sbd, ngay))
  const xemChuaSom = som(Promise.all([
    env.DB.prepare('SELECT DISTINCT qid FROM loi_giai_hoi WHERE sbd=? AND julianday(luc)>=julianday(?)-0.5').bind(sbd,new Date(now).toISOString()).all<{qid:string}>(),
    env.DB.prepare('SELECT goi_id,qid,version FROM goi_bai_7_chua WHERE goi_id IN(SELECT value FROM json_each(?))').bind(JSON.stringify(goi.map(g=>g.id))).all<Row>(),
  ]))
  const kiemSom = som(env.DB.prepare('SELECT goi_id,ma_de,diem,nop_luc,json FROM goi_bai_7_kiem WHERE sbd=? AND nop_luc IS NOT NULL ORDER BY nop_luc DESC LIMIT 30').bind(sbd).all<Row>())
  // Phạm vi bài đã dạy theo TÊN LỚP của em (cùng nguồn màn Học sinh) — `hoc_sinh.lop` là khối, không khớp `bai_da_day.lop` (lỗi 12/10, xem sqlTenLopHs).
  const oldUngSom = som((async () => {
    const lop = (await lopSom) ?? ''
    const phamVi = await phamViLop(env,lop)
    const maCu = [...(phamVi?.maDe ?? [])].filter(m => !goi.some(g => g.maDeNguon.includes(m)))
    // Ma trận cũ là toàn phạm vi; mẫu bổ sung chọn theo độ yếu, không chỉ câu đã làm.
    return Promise.all([
      env.DB.prepare(`SELECT DISTINCT j.value AS kn,p.trang_thai FROM game_v2_question q LEFT JOIN omni_q o ON q.qid=o.qid,
      json_each(CASE WHEN json_array_length(COALESCE(o.vkn_json,'[]'))>0 THEN o.vkn_json ELSE json_array(CASE WHEN COALESCE(q.dang,'')<>'' THEN 'dang:'||q.dang ELSE 'cau:'||q.qid END) END) j LEFT JOIN omni_p_vkn p ON p.vkn_id=j.value AND p.sbd=? WHERE q.ma_de IN (SELECT value FROM json_each(?))`).bind(sbd,JSON.stringify(maCu)).all<Row>(),
      env.DB.prepare(`SELECT q.qid,MIN(COALESCE(p.p,0.3)) yeu FROM game_v2_question q LEFT JOIN omni_q o ON o.qid=q.qid,
      json_each(CASE WHEN json_array_length(COALESCE(o.vkn_json,'[]'))>0 THEN o.vkn_json ELSE json_array(CASE WHEN COALESCE(q.dang,'')<>'' THEN 'dang:'||q.dang ELSE 'cau:'||q.qid END) END) j LEFT JOIN omni_p_vkn p ON p.vkn_id=j.value AND p.sbd=?
      WHERE q.ma_de IN(SELECT value FROM json_each(?)) AND json_extract(q.json,'$.reviewed')=1
      GROUP BY q.qid ORDER BY yeu,q.qid LIMIT 96`).bind(sbd,JSON.stringify(maCu)).all<Row>(),
    ])
  })())
  const ungMoRong = som(Promise.all([qidsGoi, oldUngSom]).then(([qids, [, ungCu]]) => [...qids, ...ungCu.results.map(r => str(r.qid))]))
  const hsSom = som(docHoSo2(env, sbd, ngay, undefined, undefined, undefined, ungMoRong))
  // Động cơ hành trình + mức hôm nay: các lượt đọc chỉ phụ thuộc (em, lúc) đi luôn đợt này (xem `docTruocDongCo`, `docMucNgay7`) — động cơ chỉ khi bảng
  // của nó đã tạo xong trong isolate (không gửi lệnh tạo bảng sớm chặn các lượt đọc trên; isolate mới ⇒ bắt đầu ngay khi có hồ sơ, như dưới).
  const dongCo = docTruocDongCoNeuSanBang(env, sbd, now)
  const mucSom = som(docMucNgay7(env, sbd, ngay))
  return { phuSom, khoiSom, daLamSom, xemChuaSom, kiemSom, oldUngSom, hsSom, dongCo, mucSom }
}
/** `gsSom`: danh sách gói đã đọc đoán cùng đợt cờ Gói 7 (`docDanhSachGoiSom7`); vắng ⇒ đọc như cũ. */
export async function lapGoi7(env: Env, sbd: string, now: number, gsSom?: Promise<{ results: Row[] }>) {
  const ngay = ngayVn7(now)
  // Lớp của em (bảng lớp dùng chung cả trường, đệm 30 giây trong isolate — `lopCuaEm`) bắt đầu CÙNG đợt danh sách gói (đợt 18): đệm vừa hết hạn thì phạm vi
  // bài ⇒ ma trận cũ ⇒ hồ sơ không phải chờ thêm một đợt. Lỗi đọc ⇒ null như cũ (hàm tự bắt).
  const lopSom = som(lopCuaEm(env, sbd))
  // Danh sách câu của gói (đầu vào hồ sơ) chỉ biết sau khi `docGoiCuaEm7` xong — hồ sơ đã bắt đầu từ móc thì chờ đúng lời hứa này.
  let traQids: (q: readonly string[]) => void = () => {}, loiQids: (e: unknown) => void = () => {}
  const qidsGoi = som(new Promise<readonly string[]>((ok, loi) => { traQids = ok; loiQids = loi }))
  const giu: { s: ReturnType<typeof batDauSom7> | null } = { s: null }
  let goi: GoiCuaEm7[]
  try { goi = await docGoiCuaEm7(env,sbd,now,false,(ds) => { giu.s = batDauSom7(env,sbd,now,ngay,ds,qidsGoi,lopSom) },gsSom) } catch (e) { loiQids(e); throw e }
  const qids = [...new Set(goi.flatMap(g => g.cau.map(c => c.qid)))]
  traQids(qids)
  if (!goi.length) return null
  const som7 = giu.s ?? batDauSom7(env,sbd,now,ngay,goi,qidsGoi,lopSom)
  const { phuSom, khoiSom, daLamSom, xemChuaSom, kiemSom } = som7
  const [old] = await som7.oldUngSom
  const [hs, [baoVe, btvn, control]] = await Promise.all([som7.hsSom, phuSom])
  // β câu + dòng chiến dịch đầy đủ của động cơ (theo hồ sơ) đi CÙNG đợt với bước cổng khối dưới (đợt 18).
  const dongCo = som7.dongCo ?? docTruocDongCo(env, sbd, now)
  docTruocDongCoTheoHoSo(env, dongCo, hs)
  const chan = new Set([...baoVe,...btvn,...control.blocked,...goi.flatMap(g=>g.cau.filter(c=>c.hopLe===false).map(c=>c.qid))])
  if (control.types.length) for (const c of hs.cau) if (!c.dang || !control.types.includes(c.dang)) chan.add(c.qid)
  // CÙNG CỔNG VỚI LÚC PHÁT CÂU (khẩn 12/10 23h — thầy: "học sinh báo lỗi 2 câu cuối app không cho làm tiếp bảo tìm câu phù hợp"): câu gói em KHÔNG nhận
  // được ở `startGoi7` — không còn trong chỉ mục, tự luận, sai dạng thầy giới hạn, khác khối / câu nghi (`chanKhacKhoiEm`, đúng tham số của startGoi7) —
  // trước đây vẫn vào kế hoạch (vai tiếp cận, xếp CUỐI) ⇒ em làm hết phần còn lại thì sảnh "Còn 2 câu" mà mở chặng rỗng. Nay chặn ngay ở kế hoạch.
  {
    const daGap0 = new Set(goi.flatMap(g => [...g.daGap]))
    const ungGoi = [...new Map(goi.flatMap(g => g.cau).map(c => [c.qid, c])).values()].filter(c => !daGap0.has(c.qid) && !chan.has(c.qid) && !chan.has(c.group))
    const thieuMeta = ungGoi.filter(c => !hs.meta.has(c.qid)).map(c => c.qid)
    const [khoiEm, metaThem] = await Promise.all([khoiSom, thieuMeta.length ? docMetaCau(env, thieuMeta, goi.flatMap(g => g.maDeNguon)) : Promise.resolve(new Map<string, never>())])
    const metaCua = (qid: string) => hs.meta.get(qid) ?? metaThem.get(qid)
    const coTheGiao = ungGoi.filter(c => { const m = metaCua(c.qid); return !!m && !m.tuLuan && !(control.types.length && (!m.dang || !control.types.includes(m.dang))) })
    const quaCong = new Set((await chanKhacKhoiEm(env, 'goi7', { sbd, khoiEm }, coTheGiao, { cauCua: (c) => metaCua(c.qid) })).map(c => c.qid))
    for (const c of ungGoi) if (!quaCong.has(c.qid)) chan.add(c.qid)
  }
  const engine = await dongCoHanhTrinh(env,sbd,now,hs,chan,true,dongCo)
  const sanSang = new Set(hs.cau.filter(c => !engine.chan.has(c.qid) && !chan.has(c.qid) && !chan.has(hs.meta.get(c.qid)?.group??'') && !hs.meta.get(c.qid)?.tuLuan).map(c => c.qid))
  const daLamNgay = await daLamSom
  const [views,teacherCorrections]=await xemChuaSom
  const vuaXem=new Set(views.results.map(r=>r.qid)),daGap = new Set(goi.flatMap(g => [...g.daGap]))
  const uuTien=(a:{qid:string},b:{qid:string})=>(engine.trongSo[b.qid]??0)-(engine.trongSo[a.qid]??0)||a.qid.localeCompare(b.qid)
  const sua = hs.cau.filter(c => !vuaXem.has(c.qid)&&['mo','cho_kiem'].includes(hs.loiV2?.get(c.qid)?.trangThai ?? '')).sort(uuTien).map(c => c.qid)
  const on = hs.cau.filter(c => !vuaXem.has(c.qid)&&(!qids.includes(c.qid)||daGap.has(c.qid)) && (hs.tt.get(c.qid)?.laMoi || (engine.hen.get(c.qid) ?? hs.tt.get(c.qid)?.henOn ?? '9999') <= ngay)).sort(uuTien).map(c => c.qid)
  const chua=goi.flatMap(g=>g.cau.filter(c=>g.choThay.has(c.qid)&&teacherCorrections.results.some(r=>r.goi_id===g.id&&r.qid===c.qid&&r.version===c.version)).map(c=>c.qid))
  const cau = [...new Map(goi.flatMap(g => g.cau).map(c => [c.qid,c])).values()]
  const quotaCon = goi.reduce((n,g) => n+Math.max(0,g.quota-g.gapNgay.size),0)
  const tang = tangCuaEm(hs.cau,hs.tt,new Map([...hs.meta].map(([qid,m])=>[qid,m.group])))
  // MỘT CON SỐ (thầy 12/10): mức hôm nay M = max(mức theo tầng, Σ câu mới theo lịch các gói) — chốt lần lập đầu tiên trong ngày, các lần sau đọc lại.
  // Kế hoạch đúng M − đã làm câu: câu mới theo lịch vẫn đứng đầu nhưng không vượt phần còn lại của M (`chiTrongMuc`).
  const batKt=await import('./kiem-tra-ca-nhan').then(m=>m.coKtCn(env))
  const eligible=(id:string)=>sanSang.has(id)&&!daLamNgay.has(id)&&!chan.has(id)
  const suaCan=batKt?sua.filter(id=>eligible(id)&&!chua.includes(id)).slice(0,4):[]
  const onCan=batKt?on.filter(id=>eligible(id)&&!suaCan.includes(id)&&!chua.includes(id)):[]
  const giuOn=batKt?Math.min(6,onCan.length):0
  const muc7 = await chotMucNgay7(env,sbd,ngay,tang,goi.reduce((n,g)=>n+g.quota,0),now,false,som7.mucSom,giuOn+suaCan.length)
  const toiThieu = muc7.muc
  const nhomPhu=[...goi].sort((a,b)=>a.han.localeCompare(b.han)).map(g=>({qids:g.cau.map(c=>c.qid),quota:Math.max(0,g.quota-g.gapNgay.size)}))
  const plan = chonGoi7({ cau,daGap,daLamNgay,quotaCon,sanSang,chan,sua,on:batKt?[...onCan,...on.filter(id=>!onCan.includes(id))]:on,chua,mucTieuNgay:Math.max(0,toiThieu-daLamNgay.size),trongSo:engine.trongSo,nhomPhu,chiTrongMuc:true,giuOn })
  const kiem=await kiemSom
  const diemDaDo=kiem.results.filter(r=>diemConDungNguon7(json<Row>(r.json).cau,goi.find(g=>g.id===r.goi_id)?.cau.filter(c=>(c.maTo??c.maDe)===r.ma_de)??[])).map(r=>({goiId:str(r.goi_id),maDe:str(r.ma_de),diem:Number(r.diem),luc:str(r.nop_luc),cauMoi:Number(json<Row>(r.json).cauMoi??0),tong:Number(json<Row>(r.json).tong??0)}))
  const skills = new Map(old.results.map(r => [str(r.kn),r.trang_thai === 'vung']))
  const kienThucCu = { tong: skills.size, dat: [...skills.values()].filter(Boolean).length, tyLe: skills.size ? Math.round(1000*[...skills.values()].filter(Boolean).length/skills.size)/10 : null }
  return { goi, plan, hs, chan, control, kienThucCu, diemDaDo, toiThieu, daLamNgay:daLamNgay.size }
}

/** Số đếm hợp lệ (hữu hạn, ≥ 0); còn lại ⇒ 0 — không để NaN thành `null` trong JSON (app đọc chặt). */
const dem7 = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0
/** Một mục `diemDaDo` app nhận được: chuỗi id/mã/lúc, điểm 0–10, 0 ≤ câu mới ≤ tổng. */
const laDiemDaDo7 = (d: { goiId: unknown; maDe: unknown; diem: unknown; luc: unknown; cauMoi: unknown; tong: unknown }): boolean =>
  typeof d.goiId === 'string' && !!d.goiId && typeof d.maDe === 'string' && !!d.maDe && typeof d.luc === 'string' && !!d.luc &&
  typeof d.diem === 'number' && Number.isFinite(d.diem) && d.diem >= 0 && d.diem <= 10 &&
  typeof d.cauMoi === 'number' && typeof d.tong === 'number' && Number.isFinite(d.tong) && d.cauMoi >= 0 && d.cauMoi <= d.tong

/**
 * Tóm tắt Gói 7 gửi app. BẤT BIẾN (khẩn 12/10 21h30 — thầy: "lúc chiều hiện 31 câu giờ lại hiện 2 chặng"; app đọc chặt mà một trường phụ lệch là bỏ
 * cả gói ⇒ rơi về số sai): mỗi gói `to` chỉ gồm chuỗi khác rỗng · `daGap` chỉ đếm câu THUỘC gói và ≤ `tong` · `con = tong − daGap ≥ 0` · số đếm hữu hạn
 * ≥ 0 · `diemDaDo` chỉ gồm mục hợp lệ.
 */
export function tomTatGoi7(lap: NonNullable<Awaited<ReturnType<typeof lapGoi7>>>, now: number) {
  const homNay = ngayVn7(now)
  return { bat: true, ngay: homNay, goi: lap.goi.map(g => {
    const qids = new Set(g.cau.map(c => c.qid)), tong = qids.size, daGap = Math.min(tong, [...g.daGap].filter(q => qids.has(q)).length)
    return { id:g.id,ten:g.ten,batDau:g.batDau,han:g.han,tong,daGap,con:tong-daGap,nguonDayDu:g.nguonDayDu,
      to:[...new Set(g.cau.map(c=>c.maTo??c.maDe).filter((m): m is string => typeof m === 'string' && m.trim().length > 0))],
      canBoSung:g.cau.filter(c=>c.hopLe===false).length,quota:dem7(g.quota),gapHomNay:[...g.gapNgay].filter(q => qids.has(q)).length,quaHan:homNay>g.han && (!g.nguonDayDu||daGap<tong) }
  }),
    tuLamCon:dem7(lap.plan.tuLam),tiepCanCon:dem7(lap.plan.tiepCan),thieuPhu:dem7(lap.plan.thieuPhu),thieuNgay:Math.max(0,lap.toiThieu-lap.daLamNgay-lap.plan.viec.length),kienThucCu:lap.kienThucCu,
    canHoTro:lap.plan.tuLam*2+lap.plan.tiepCan*3>60 || lap.plan.thieuPhu>0 || lap.daLamNgay+lap.plan.viec.length<lap.toiThieu,
    mucTieuDiem:7,diemDaDo:lap.diemDaDo.filter(laDiemDaDo7),toiThieu:lap.toiThieu,daLamHomNay:lap.daLamNgay }
}

/** Một đợt tối đa 6 câu; giữ các câu/phiên bản và vai ở máy chủ, không phát đáp án. */
export async function startGoi7(env: Env, sbd: string, now: number, gsSom?: Promise<{ results: Row[] }>): Promise<Record<string,unknown> | null> {
  // Đợt 17: khối em + đợt cũ (và câu đã trả lời của nó) đọc SONG SONG với lập kế hoạch — trước đây nối tiếp sau `lapGoi7`. Bảng gói chắc có trước (`damBaoGoi7`).
  const khoiSom = som(docKhoiEm(env,sbd))
  const cuSom = som(damBaoGoi7(env).then(async () => {
    const old = await env.DB.prepare(`SELECT id,json FROM game_v2_session WHERE sbd=? AND created_at>=? AND json_extract(json,'$.hocTap')=1 ORDER BY created_at DESC LIMIT 1`).bind(sbd,new Date(now-2*3600000).toISOString()).first<Row>()
    const answered = old ? await env.DB.prepare('SELECT qid FROM game_v2_attempt WHERE session=? AND sbd=? UNION SELECT qid FROM goi_bai_7_gap WHERE receipt LIKE ? AND sbd=?').bind(old.id,sbd,`${str(old.id)}|%`,sbd).all<{qid:string}>() : {results:[] as {qid:string}[]}
    return { old, answered }
  }))
  // CÂU VỪA TRẢ LỜI (lỗi 13/10 — thầy: "làm xong chặng 2 bấm làm tiếp chặng 3 câu bị lặp, còn nếu thoát ra bấm làm tiếp thì ko bị"): lệnh nộp câu ghi
  // `game_v2_attempt` NGAY trong lô chấm, còn dòng sổ học (`su_kien_hoc` — nguồn "đã gặp / đã làm hôm nay" của kế hoạch) ghi SAU khi đã trả lời máy em
  // (`ctx.waitUntil`). Bấm "Học tiếp" ngay ⇒ kế hoạch lập khi sổ chưa kịp có câu cuối ⇒ xếp lại câu vừa làm. Nay câu em vừa trả lời trong 15 phút
  // (đọc từ bảng ghi ngay) không vào chặng mới; sau đó sổ đã có, kế hoạch tự loại như cũ.
  const vuaLamSom = som(env.DB.prepare('SELECT DISTINCT qid FROM game_v2_attempt WHERE sbd=? AND created_at>=?').bind(sbd,new Date(now-15*60_000).toISOString()).all<{qid:string}>()
    .then(r => new Set(r.results.map(x => x.qid))).catch(() => new Set<string>()))
  const lap = await lapGoi7(env,sbd,now,gsSom)
  if (!lap) return null
  if (!lap.control.enabled) throw new Error('Thầy đang tạm dừng bài học cho em.')
  const [khoi, { old, answered }, vuaLam] = await Promise.all([khoiSom, cuSom, vuaLamSom])
  const saved = old ? json<{questions:RefGoi7[]}>(old.json) : null
  const done = new Set(answered.results.map(r => r.qid))
  const viec = saved ? saved.questions.filter(r => !done.has(r.qid)).map(r=>({...r,vai:r.vai??'on',huongDan:r.huongDan??false})) : []
  const refs: RefGoi7[] = [], questions: Record<string,unknown>[] = []
  // Đợt cũ còn câu mà không câu nào phát được nữa ⇒ lấy theo kế hoạch hôm nay; kế hoạch đi tiếp qua câu không phát được cho đủ 6 câu (khẩn 12/10 23h).
  const lanThu = viec.length ? [viec, lap.plan.viec] : [lap.plan.viec]
  const cauGoi = new Map(lap.goi.flatMap(g=>g.cau).map(c=>[c.qid,c] as const).reverse())
  // ĐỌC SONG SONG THEO LÔ (đợt 17): trước đây TỪNG câu đọc nối tiếp (đọc câu theo ref ⇒ cổng khối) — 6 câu ≈ 12 lượt D1 chờ nhau ("Đang chuẩn bị những
  // câu…" lâu giờ cao điểm). Nay mỗi lô (đủ chỗ còn thiếu + 2 dự phòng) đọc các câu CÙNG LÚC, cổng khối MỘT lần cho cả lô (từng câu xét độc lập); vẫn
  // duyệt ĐÚNG thứ tự kế hoạch, ĐÚNG mọi điều kiện cũ ⇒ cùng bộ câu như trước.
  for (const ds of lanThu) { if (refs.length) break
    const ung = ds.map(v => { const oldRef = saved?.questions.find(r=>r.qid===v.qid); return { v, oldRef, meta: oldRef ?? lap.hs.meta.get(v.qid) ?? cauGoi.get(v.qid) } })
      .filter(x => x.meta && !lap.chan.has(x.v.qid) && !lap.chan.has(x.meta.group) && (ds === viec || !vuaLam.has(x.v.qid)))
    for (let i = 0; i < ung.length && refs.length < 6;) {
    const lo = ung.slice(i, i + 6 - refs.length + 2); i += lo.length
    const daDoc = (await Promise.all(lo.map(x => currentQuestion(env, x.meta!).then(q => ({ ...x, q }), () => null)))).filter((x): x is NonNullable<typeof x> => !!x)
    const quaKhoi = new Set(await chanKhacKhoiEm(env,'goi7',{sbd,khoiEm:khoi},daDoc.map(x => x.q)))
    for (const x of daDoc) {
    if (refs.length >= 6) break
    const v = x.v, oldRef = x.oldRef
    let q: PrivateQuestion = x.q
    if (!quaKhoi.has(q) || laCauTuLuan(q) || !q.reviewed || lap.control.types.length && (!q.dang || !lap.control.types.includes(q.dang))) continue
    let lamLai:LamLaiRef|undefined
    if(oldRef)q=apXaoTheoRef(q,oldRef)
    else if(v.vai==='sua'){
      const m=lap.hs.meta.get(q.qid)
      if(m){const x=(await apLamLaiKhac(env,lap.hs,[{q,m}],{sbd,nowMs:now,keHoach:lap.plan.viec.map(v=>v.qid)},new Set([...lap.chan,...refs.map(r=>r.qid)])))[0];if(x){q=x.q;lamLai=x.lamLai;const ss=tachSongSinh(q.qid);if(ss.songSinh!==null)lamLai={...lamLai,tc:ss.goc}}}
    }
    const ref: RefGoi7 = {...oldRef,...lamLai,qid:q.qid,maDe:q.maDe,version:q.version,group:q.group,novel:lap.hs.tt.get(q.qid)?.laMoi ?? true,
      role:v.vai==='moi'?'cau_moi':v.vai==='sua'?'on_lai':'on_lai',vai:v.vai,huongDan:v.huongDan}
    refs.push(ref); questions.push({...publicQuestion(q),...(ref.goiY?{goiY:ref.goiY}:{}),vaiGoi7:v.vai,huongDan7:v.huongDan,coGoi7:lap.goi.some(g=>g.cau.some(c=>c.qid===q.qid&&c.version===q.version))})
  } } }
  if (!refs.length) return {ok:true,questions:[],goi7:tomTatGoi7(lap,now),message:lap.plan.thieuPhu&&lap.daLamNgay<lap.toiThieu?'Còn câu cần thầy bổ sung học liệu hoặc đang được giữ cho ca kiểm tra.':'Em đã hoàn thành phần được xếp hôm nay. Lỗi chưa kiểm chứng vẫn được giữ để học tiếp.'}
  const id = viec.length && refs.length === viec.length && refs.every(r => viec.some(v => v.qid === r.qid)) ? str(old!.id) : crypto.randomUUID()
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
