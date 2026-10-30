import { LENH_BANG_DIEM_GON, lenhDiemGon } from './diem-gon'
import type { Env, D1PreparedStatement } from './kieu'
import { chayDdlMotLan, ddlDaXong } from './ddl-mot-lan'
import { SQL_GOI7 } from './goi-bai-7-schema'
import { docChanCauMoiGoi7 } from './goi-bai-7-chan-moi'
import { sqlEmDangNhan7, sqlQuyetDinhNhan7, sqlCacGoiConNhan7 } from './goi-bai-7-quyen'
import { chonGoi7, congNgay7, ngayVn7, quotaGoi7, soNgayCon7, diemConDungNguon7, mucNgayGoi7, type CauGoi7, type ViecGoi7 } from './goi-bai-7-loi'
import { xepBai6 } from './bai-6-cau'
import { duolingoChoEm } from './duolingo-bai-co'
import { tachMaTo } from './srs2-gv'
import { laMaToKhongGiao, damBaoBangBaiDaDay, phamViLop, lopCuaEm } from './bai-da-day'
import { TEN_LOP_CHUA_XEP, TEN_LOP_THUONG_12 } from './ten-lop'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import { publicQuestion, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { docCauTheoRef, loiCauDoi, protectedQuestions, docKhoiEm, dongBoCacTo } from './game-v2-bank'
import { readGameScope } from './game-v2-reports'
import { docHoSo2, docMetaCau } from './srs2-d1'
import { docCauBtvnChuaNop } from './game-v2-luot'
import { dongCoHanhTrinh, docBetaRongSom, docTruocDongCo, docTruocDongCoNeuSanBang, docTruocDongCoTheoHoSo } from './hanh-trinh-dong-co'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { CAU_TOI_THIEU, tangCuaCau, tangCuaEm, type TangHanhTrinh } from './hanh-trinh-ngay'
import { chanKhacKhoiEm, docCauNghiDem } from './chan-khac-khoi'
import { apLamLaiKhac } from './cau-anh-em'
import { apXaoTheoRef, type LamLaiRef } from './lam-lai-so'
import { ganNiemChoCau } from './niem-cau'
import { HAN_NIEM_CHUAN_BI_MS } from './niem-phong'
import { tachSongSinh } from './loi-hoc-luat'
import { quotaHocKt, quotaCacGoiHocKt } from './kiem-tra-ca-nhan-loi'
import { dbGoc, docCauHinhDem } from './cau-hinh-dem'
import { envGhiRieng, lenhTrong } from './doc-d1-theo-luot'
import { dauKhoCau, dauTruocLucDoc } from './dau-kho-cau'
import { soSanhOnHoiThay } from './hoi-thay-lich-on'
import { cungTap, layKeHoach7, nhoKeHoach7, xemKeHoach7 } from './goi-bai-7-nho'
import { dangKyKichThuoc } from './dem-chung'
import { lenhThuongTraLoi, tinhThuongHocCachGiai, type PhienNt } from './thuong-tra-loi'
import { ngayVnTt } from './thuong-luat'
import { CAU_MOT_BAI, SQL_KHONG_TU_SUA, SQL_LA_LUOT_CHANG } from './chuoi-ngay-bai'

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
      env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) SELECT ?,h.sbd,?,? FROM hoc_sinh h JOIN goi_bai_7 g ON g.id=? WHERE ${sqlTenLopHs('h')}=? AND COALESCE(h.trang_thai,'')<>'khoa' AND ${sqlQuyetDinhNhan7('g','h.sbd')} AND ${KHONG_CA}`).bind(id,batDau,han,id,b.lop),
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
    SELECT g.id,h.sbd,g.bat_dau,g.han FROM goi_bai_7 g JOIN hoc_sinh h ON ${sqlTenLopHs('h')}=g.lop AND COALESCE(h.trang_thai,'')<>'khoa' JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE ${sqlQuyetDinhNhan7('g','h.sbd')} AND ${KHONG_CA}`).run()
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
export interface GoiCuaEm7 { id: string; ten: string; khoaBai: string; batDau: string; han: string; maDeNguon:string[]; cau: CauGoi7[]; daGap: Set<string>; gapNgay: Set<string>; tuLamNgay: Set<string>; choThay: Set<string>; nguonDayDu:boolean; quota: number; kiemNhe?:boolean }
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
    JOIN hoc_sinh h ON h.sbd=e.sbd AND ${sqlTenLopHs('h')}=g.lop JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE e.sbd=? AND ${sqlEmDangNhan7('e','g','h')} ORDER BY e.bat_dau DESC,g.id`).bind(sbd).all<Row>()
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
 *  `gsSom` = lượt `docDanhSachGoiSom7(env, sbd)` (đọc đoán cùng đợt cờ Gói 7); vắng ⇒ đọc như cũ (sau `damBaoGoi7`).
 *  `ghiTre` (Gói R 15/10): nhận lệnh ghi quota ngày `goi_bai_7_ngay` thay vì ghi ngay — nơi gọi gửi CHUNG lô ghi cuối của lượt (trước: một lệnh ghi giữa lượt,
 *  mọi lượt đọc sau phải chờ nó — một đợt D1). Không lượt đọc nào của lượt đọc lại bảng này sau đây. Vắng ⇒ ghi ngay như cũ. */
export async function docGoiCuaEm7(env: Env, sbd: string, now: number, chiDoc=false, khiCoGoi?: (goi: readonly GoiNhe7[]) => void, gsSom?: Promise<{ results: Row[] }>, ghiTre?: D1PreparedStatement[]): Promise<GoiCuaEm7[]> {
  if(!chiDoc)await damBaoGoi7(env)
  const ngay = ngayVn7(now)
  const gs = await (gsSom ?? docDanhSachGoi7(env, sbd))
  if (!gs.results.length) return []
  if (khiCoGoi) { try { khiCoGoi(gs.results.map(goiNheTuDong7)) } catch { /* chỉ là tăng tốc */ } }
  // ĐỌC TRƯỚC (đợt 18): kiểm "nguồn đủ" của TỪNG gói đi CÙNG đợt với lượt đọc câu/sổ dưới (trước: nối tiếp sau, mỗi gói một đợt). Cùng câu SQL, cùng
  // tham số; chỉ đọc bảng tờ/chỉ mục (không lệnh ghi nào của lượt này đụng). Gói không còn câu nào vẫn bỏ qua kết quả như cũ. Lỗi nổi lên đúng chỗ `await` cũ.
  const nguonSom = gs.results.map(g => som(duNguonGoi7(env,mang7(g.ma_to_json))))
  const gids = JSON.stringify(gs.results.map(g => g.id))
  // Lịch kiểm tra chỉ đọc metadata nhỏ, cùng đợt câu/sổ/quota; không bóc đề riêng.
  const kiemSom=som(import('./kiem-tra-ca-nhan').then(async kt=>await kt.coKtCn(env)?new Map((await env.DB.prepare(`SELECT k.ngay,MAX(COALESCE(json_extract(km.meta_json,'$.baiNgayToiThieu'),0)) hoc,COUNT(*) n FROM kiem_tra_ca_nhan k JOIN hoc_sinh h ON h.sbd=k.sbd AND k.lop=${sqlTenLopHs('h')} LEFT JOIN kiem_tra_ca_nhan_meta km ON km.id=k.id WHERE k.sbd=? AND k.trang_thai<>'cho_nguon' AND k.ngay>=? GROUP BY k.ngay`).bind(sbd,ngay).all<{ngay:string;hoc:number;n:number}>()).results.map(r=>[r.ngay,r.hoc?Number(r.n):2])):new Map<string,number>()))
  const [cs, gaps, events, quotas, ngayKiem] = await Promise.all([
    env.DB.prepare('SELECT * FROM goi_bai_7_cau WHERE goi_id IN (SELECT value FROM json_each(?))').bind(gids).all<Row>(),
    env.DB.prepare('SELECT goi_id,qid,version,kieu,luc FROM goi_bai_7_gap WHERE sbd=? AND goi_id IN (SELECT value FROM json_each(?)) ORDER BY luc,receipt').bind(sbd,gids).all<Row>(),
    env.DB.prepare(`SELECT qid,json_extract(raw_json,'$.ht_cau_version') cau_version,ngay_vn,assistance,ket_qua FROM su_kien_hoc WHERE sbd=? AND received_at<=? AND qid IN (SELECT qid FROM goi_bai_7_cau WHERE goi_id IN (SELECT value FROM json_each(?))) AND ${SQL_LUOT_GOI7}`).bind(sbd,now,gids).all<Row>(),
    env.DB.prepare('SELECT * FROM goi_bai_7_ngay WHERE sbd=? AND ngay=?').bind(sbd,ngay).all<Row>(),
    kiemSom,
  ])
  const out: GoiCuaEm7[] = []

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
    const duKiem=(ngayKiem.get(ngay)??0)>=2
    const quota = duKiem?0:ngayKiem.get(ngay)===1?quotaHocKt(cau.length-daGap.size+gapNgay.size,ngay,str(g.han),ngayKiem):Math.max(cu ? Number(cu.quota) : 0,ngayKiem.size?quotaHocKt(cau.length-daGap.size+gapNgay.size,ngay,str(g.han),ngayKiem):quotaGoi7(cau.length - daGap.size + gapNgay.size, ngay, str(g.han)))
    out.push({ id: str(g.id), ten: str(g.ten), khoaBai: str(g.khoa_bai), batDau: str(g.bat_dau), han: str(g.han),maDeNguon:[...new Set(mang7(g.ma_to_json).map(m=>tachMaTo(m).goc))], cau, daGap, gapNgay, tuLamNgay, choThay, nguonDayDu, quota,kiemNhe:ngayKiem.get(ngay)===1 })
  }
  if(ngayKiem.size){
    const chia=quotaCacGoiHocKt(out.map(g=>({id:g.id,han:g.han,chuaGap:g.cau.length-g.daGap.size+g.gapNgay.size})),ngay,ngayKiem)
    for(const g of out)g.quota=ngayKiem.has(ngay)?chia.get(g.id)??0:Math.max(g.quota,chia.get(g.id)??0)
  }
  for(const g of out)if(!chiDoc&&!quotas.results.some(q=>q.goi_id===g.id)){
    const lenh=env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota) SELECT ?,?,?,? WHERE ${sqlCacGoiConNhan7('?','?',sqlTenLopHs('h'))}`).bind(g.id,sbd,ngay,g.quota,JSON.stringify([g.id]),sbd)
    if(ghiTre)ghiTre.push(lenh);else await lenh.run()
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
export async function chotMucNgay7(env: Env, sbd: string, ngay: string, tang: TangHanhTrinh, tongQuota: number, now: number, chiDoc = false, cuSom?: Promise<MucNgay7 | null>, giuCho=0,kiemNhe=false,goiId:readonly string[]=[]): Promise<MucNgay7> {
  const doc = (): Promise<MucNgay7 | null> => docMucNgay7(env, sbd, ngay)
  const cu = await (cuSom ?? doc())
  if (cu&&!kiemNhe) return cu
  if(cu&&kiemNhe&&cu.muc===12)return cu
  const toiThieuTang = kiemNhe?12:CAU_TOI_THIEU[tang], quota = Math.max(0, Math.floor(tongQuota) || 0)
  const moi: MucNgay7 = { tang, toiThieuTang, quota, muc: kiemNhe?12:mucNgayGoi7(toiThieuTang, quota+Math.max(0,giuCho)), daChot: false }
  if (chiDoc) return moi
  await env.DB.prepare(`INSERT OR IGNORE INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) SELECT ?,?,?,?,?,?,? WHERE ${sqlCacGoiConNhan7('?','?',sqlTenLopHs('h'))} ON CONFLICT(sbd,ngay) DO UPDATE SET toi_thieu_tang=12,quota=excluded.quota,muc=12 WHERE ?=1`)
    .bind(sbd, ngay, moi.tang, moi.toiThieuTang, moi.quota, moi.muc, new Date(now).toISOString(),JSON.stringify(goiId),sbd,kiemNhe?1:0).run()
    // Không ghi được (D1 trục trặc) ⇒ em vẫn học với số vừa tính; thầy thấy ngày ấy là mức ước tính — không làm hỏng màn em.
    .catch((e: unknown) => console.error('[goi7] chưa chốt được mức hôm nay:', e instanceof Error ? e.message : e))
  return (await doc()) ?? moi
}

/** Câu ĐÃ LÀM hôm nay của em (Gói 7): câu có kết quả trong sổ (lướt / chỉ xem không tính) ∪ câu đã học có hướng dẫn hôm nay. MỘT nguồn cho `lapGoi7`
 *  (sảnh, bắt đầu chặng) và lệnh nhẹ `hoc-tap-dem` — hai nơi luôn ra cùng một số. */
export async function docDaLamNgay7(env: Env, sbd: string, ngay: string, now?: number): Promise<Set<string>> {
  return (await docDaLamVaVuaLam7(env, sbd, ngay, now)).daLam
}
/** SỐ «đã làm hôm nay» (xem `docDaLamVaVuaLam7`: không cộng câu làm lại cuối chặng, có cộng câu lướt) — đúng con số Lộ trình / `hoc-tap-dem` / thẻ «Đủ…» / chuỗi dùng. */
export async function docSoDaLamNgay7(env: Env, sbd: string, ngay: string, now?: number): Promise<number> {
  return (await docDaLamVaVuaLam7(env, sbd, ngay, now)).soDaLam
}
/** CỬA SỔ "VỪA LÀM": lượt trả lời đã ghi ngay lúc chấm mà dòng sổ học (ghi hoãn) có thể chưa kịp có. */
const VUA_LAM_MS = 15 * 60_000
/**
 * ĐÃ LÀM HÔM NAY = sổ học (`su_kien_hoc`) ∪ câu học có hướng dẫn ∪ CÂU VỪA TRẢ LỜI (≤ 15 phút, trong ngày VN) đọc từ `game_v2_attempt`.
 * LỖI 13/10 20:11 (em báo "còn một câu mà nó báo hoàn thành", sảnh 23/24): lệnh nộp câu ghi `game_v2_attempt` NGAY trong lô chấm, còn dòng sổ học ghi SAU
 * khi đã trả lời máy em (`ctx.waitUntil`). Mở chặng / đếm ngay sau câu cuối ⇒ sổ chưa có câu ấy ⇒ bộ đếm 23/24 và kế hoạch xếp LẠI đúng câu vừa làm,
 * còn `startGoi7` (luật 13/10 không phát lại câu vừa trả lời) bỏ nó ⇒ chặng rỗng ⇒ "Em đã hoàn thành…". Nay kế hoạch + bộ đếm cùng thấy câu vừa làm
 * ngay. Cùng đợt đọc (không thêm vòng chờ D1); chỉ mục `game_v2_attempt(sbd, created_at)`.
 * MỘT SỐ VỚI LỊCH NGÀY (lỗi 13/10 22h, thầy: "app báo đủ mức rồi mà hôm nay lại báo thiếu" — Hôm nay 24/24, lịch ngày 19/24): (1) tập ĐÃ LÀM thêm ĐÚNG mã
 * sổ ghi (mã đã phát, kể cả bản ảo `~ss|bt|ydN` / lần `#n`) — trước cộng mã GỐC ⇒ câu ảo vừa làm đếm hai lần (mã sổ + mã gốc) suốt 15 phút, kế hoạch
 * tưởng đủ mức, ngừng phát câu; (2) chỉ thêm lượt CHƯA có dòng sổ — lượt đã ghi sổ thì sổ quyết định như lịch ngày (lướt / chẩn đoán không tính).
 * `vuaLam` (chặn phát lại) giữ cả mã đã phát lẫn mã gốc (`tachSongSinh`).
 * `now` vắng ⇒ như cũ (chỉ sổ). Lỗi đọc bảng lượt ⇒ bỏ phần thêm, như cũ.
 * KHÔNG TÍNH CÂU TỰ SỬA LỖI (lỗi 28/10, ảnh thầy: «Đủ 14/12 câu · 2/2 chặng» mà nút Sửa lỗi còn 2): lượt `chua_loi` từng cộng vào mức ⇒ kế hoạch bớt câu
 * học, chặng cuối tự «xong» dù em chưa học. Tự sửa lỗi là nút riêng trên Lộ trình (đếm riêng, thưởng riêng) ⇒ mức / chặng chỉ đếm câu học.
 */
export async function docDaLamVaVuaLam7(env: Env, sbd: string, ngay: string, now?: number): Promise<{ daLam: Set<string>; vuaLam: Set<string>; soVua: number; soDaLam: number; luot: Set<string> }> {
  const tu = now === undefined ? '' : new Date(Math.max(now - VUA_LAM_MS, Date.parse(`${ngay}T00:00:00+07:00`))).toISOString()
  const [done, guidedToday, vua] = await Promise.all([
    // (29/10) + lượt LƯỚT của chặng (câu đã phát + đã trả lời) và cờ `ll` (câu làm lại cuối chặng): `daLam` GIỮ cả hai (không phát lại câu em vừa làm), `soDaLam` chỉ đếm câu của chặng.
    env.DB.prepare(`SELECT qid, MIN(CASE WHEN COALESCE(json_extract(raw_json,'$.ll'),0)=1 THEN 1 ELSE 0 END) AS ll, MIN(CASE WHEN purpose='luot' THEN 1 ELSE 0 END) AS chi_luot FROM su_kien_hoc WHERE sbd=? AND ngay_vn=? AND ma_nguon NOT LIKE 'ktcn:%' AND ${SQL_KHONG_TU_SUA} AND ((ket_qua IS NOT NULL AND ${SQL_LUOT_GOI7}) OR ${SQL_LA_LUOT_CHANG}) GROUP BY qid`).bind(sbd,ngay).all<{qid:string;ll:number;chi_luot:number}>(),
    env.DB.prepare("SELECT DISTINCT qid FROM goi_bai_7_gap WHERE sbd=? AND date(luc,'+7 hours')=?").bind(sbd,ngay).all<{qid:string}>(),
    // `co_so`: lượt đã có dòng sổ (chỉ mục su_kien_hoc(sbd, qid, ngay_vn)) ⇒ sổ quyết định (lướt / chẩn đoán không tính); chưa có ⇒ đang chờ ghi, tính ngay (kể cả câu tiếp cận có gợi ý/hỗ trợ; chỉ trừ câu lướt hoặc câu làm lại cuối chặng).
    tu ? env.DB.prepare("SELECT a.qid,EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd=a.sbd AND s.qid=a.qid AND s.ngay_vn=? AND s.attempt_id=a.id) co_so,(CASE WHEN COALESCE(json_extract(a.json,'$.omni.luot'),0)=1 OR EXISTS(SELECT 1 FROM game_v2_session gs,json_each(gs.json,'$.questions') gq WHERE gs.id=a.session AND gs.sbd=a.sbd AND json_extract(gq.value,'$.qid')=a.qid AND COALESCE(json_extract(gq.value,'$.lamLaiCuoi'),0)=1) THEN 1 ELSE 0 END) khong_tinh FROM game_v2_attempt a WHERE a.sbd=? AND a.created_at>=?").bind(ngay,sbd,tu).all<{qid:string;co_so:number;khong_tinh:number}>().catch(() => ({ results: [] as {qid:string;co_so:number;khong_tinh:number}[] })) : Promise.resolve({ results: [] as {qid:string;co_so:number;khong_tinh:number}[] }),
  ])
  const daLamNgay = new Set<string>(), tinh = new Set<string>()
  const chiLuot = new Set<string>()
  for(const r of done.results){daLamNgay.add(r.qid);if(!Number(r.ll))tinh.add(r.qid);if(Number(r.chi_luot)&&!Number(r.ll))chiLuot.add(r.qid)}
  for(const r of guidedToday.results){daLamNgay.add(r.qid);tinh.add(r.qid)}
  const vuaLam = new Set<string>()
  // Lượt vừa trả lời mà sổ chưa kịp có: tính ngay vào số đã làm hôm nay (kể cả câu có gợi ý / hỗ trợ), TRỪ câu lướt hoặc câu làm lại cuối chặng.
  for(const r of vua.results){const q=str(r.qid);if(!q)continue;vuaLam.add(q);vuaLam.add(tachSongSinh(q).goc);if(!Number(r.co_so)){daLamNgay.add(q);if(!Number(r.khong_tinh))tinh.add(q)}}
  return { daLam: daLamNgay, vuaLam, soVua: vua.results.length, soDaLam: tinh.size, luot: chiLuot }
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
    docSoDaLamNgay7(env, sbd, ngay, now),
    env.DB.prepare('SELECT muc FROM goi_bai_7_muc_ngay WHERE sbd=? AND ngay=?').bind(sbd, ngay).first<Row>().catch(() => null),
  ])
  const m = muc ? Number(muc.muc) : NaN
  return { ok: true, ngay, daLamHomNay: daLam, toiThieu: Number.isFinite(m) && m > 0 ? m : null }
}
/**
 * CHẠY SỚM SONG SONG của `lapGoi7` (đợt 17; đợt 18 — luật thầy 13/10 "sửa xong máy chủ phải nhanh hơn" — bắt đầu NGAY khi đọc xong danh sách gói, CÙNG đợt với
 * lượt đọc câu/sổ của gói; trước: chờ `docGoiCuaEm7` xong rồi còn nối tiếp lớp ⇒ phạm vi ⇒ ma trận cũ ⇒ hồ sơ ⇒ … động cơ ⇒ mức hôm nay). Mỗi lượt chỉ cần
 * (em, lúc, mã gói, gốc tờ nguồn) — đều đã có từ danh sách gói (bảng gói chắc có: `damBaoGoi7` chạy trước lượt đọc ấy). Cùng câu SQL, cùng tham số; chỉ đổi lúc
 * bắt đầu. Không bảng nào ở đây bị lệnh ghi của lượt này đụng trước lúc đọc cũ (ghi của `docGoiCuaEm7` chỉ vào `goi_bai_7_ngay`). Hồ sơ bắt đầu ngay, chỉ CHỜ
 * danh sách ứng viên (câu gói + ma trận cũ) ở đúng chỗ dùng. Lỗi: `som` giữ, nổi lên đúng chỗ `await` cũ.
 */
function batDauSom7(env: Env, sbd: string, now: number, ngay: string, goi: readonly GoiNhe7[], qidsGoi: Promise<readonly string[]>, lopSom: Promise<string | null>) {
  // Câu NGHI SAI ĐÁP ÁN (đệm 60 giây trong isolate) đọc cùng đợt — kế hoạch và cổng phát câu dùng CHUNG tập này (lỗi 14/10, xem `lapGoi7`).
  const phuSom = som(Promise.all([protectedQuestions(env), docCauBtvnChuaNop(env, sbd), readGameScope(env, sbd),docChanCauMoiGoi7(env,sbd),docCauNghiDem(env, now)]))
  const khoiSom = som(docKhoiEm(env, sbd))
  const daLamSom = som(docDaLamVaVuaLam7(env, sbd, ngay, now))
  const xemChuaSom = som(Promise.all([
    env.DB.prepare('SELECT DISTINCT qid FROM loi_giai_hoi WHERE sbd=? AND julianday(luc)>=julianday(?)-0.5').bind(sbd,new Date(now).toISOString()).all<{qid:string}>(),
    env.DB.prepare('SELECT goi_id,qid,version FROM goi_bai_7_chua WHERE goi_id IN(SELECT value FROM json_each(?))').bind(JSON.stringify(goi.map(g=>g.id))).all<Row>(),
  ]))
  const kiemSom = som(env.DB.prepare('SELECT goi_id,ma_de,diem,nop_luc,json FROM goi_bai_7_kiem WHERE sbd=? AND nop_luc IS NOT NULL ORDER BY nop_luc DESC LIMIT 30').bind(sbd).all<Row>())
  // Gói R 15/10: điểm kỹ năng của em (chỉ theo SBD) đọc NGAY đợt này — trước: chờ lớp ⇒ phạm vi rồi mới đọc (thêm một đợt nối tiếp khi đệm lớp/phạm vi vừa hết).
  const diemSom = docDiemKyNang7(env, sbd)
  // Phạm vi bài đã dạy theo TÊN LỚP của em (cùng nguồn màn Học sinh) — `hoc_sinh.lop` là khối, không khớp `bai_da_day.lop` (lỗi 12/10, xem sqlTenLopHs).
  const oldUngSom = som((async () => {
    const lop = (await lopSom) ?? ''
    const phamVi = await phamViLop(env,lop)
    const maCu = [...(phamVi?.maDe ?? [])].filter(m => !goi.some(g => g.maDeNguon.includes(m)))
    // Ma trận cũ là toàn phạm vi; mẫu bổ sung chọn theo độ yếu, không chỉ câu đã làm.
    return docMaTranCu7(env, sbd, maCu, now, diemSom)
  })())
  const ungMoRong = som(Promise.all([qidsGoi, oldUngSom]).then(([qids, [, ungCu]]) => [...qids, ...ungCu.results.map(r => str(r.qid))]))
  // Động cơ hành trình + mức hôm nay: các lượt đọc chỉ phụ thuộc (em, lúc) đi luôn đợt này (xem `docTruocDongCo`, `docMucNgay7`) — động cơ chỉ khi bảng
  // của nó đã tạo xong trong isolate (không gửi lệnh tạo bảng sớm chặn các lượt đọc trên; isolate mới ⇒ bắt đầu ngay khi có hồ sơ, như dưới).
  const dongCo = docTruocDongCoNeuSanBang(env, sbd, now)
  // Gói R 15/10: hồ sơ báo tập ứng viên (`khiCoQids`) ⇒ β câu của cả tập đọc CÙNG đợt lượt đọc meta (`docBetaRongSom`) — khỏi một đợt sau hồ sơ.
  const hsSom = som(docHoSo2(env, sbd, ngay, undefined, undefined, dongCo ? (ds) => docBetaRongSom(env, dongCo, ds) : undefined, ungMoRong))
  const mucSom = som(docMucNgay7(env, sbd, ngay))
  return { phuSom, khoiSom, daLamSom, xemChuaSom, kiemSom, oldUngSom, hsSom, dongCo, mucSom }
}
/** Phần CHỈ PHỤ THUỘC KHO của hai câu SQL cũ (ma trận nhãn + 96 câu yếu; bản gốc giữ trong tests/goi7-ma-tran-cu-1310.test.ts làm phép thử): mỗi (câu, tờ, nhãn kỹ năng) — [qid, đã duyệt 0/1, nhãn]. Cùng CASE nhãn dự phòng (dạng / câu). */
const SQL_KN_TINH = `SELECT q.qid,CASE WHEN json_extract(q.json,'$.reviewed')=1 THEN 1 ELSE 0 END duyet,j.value AS kn FROM game_v2_question q LEFT JOIN omni_q o ON o.qid=q.qid,
      json_each(CASE WHEN json_array_length(COALESCE(o.vkn_json,'[]'))>0 THEN o.vkn_json ELSE json_array(CASE WHEN COALESCE(q.dang,'')<>'' THEN 'dang:'||q.dang ELSE 'cau:'||q.qid END) END) j WHERE q.ma_de IN (SELECT value FROM json_each(?))`
/** Bản đồ GỌN (bộ nhớ isolate — đo 13/10 21:20–22:05: 111 lỗi `exceededMemory`): mã câu / nhãn mỗi chuỗi giữ MỘT lần, bộ ba (chỉ số câu, đã duyệt, chỉ số nhãn) trong Uint32Array. */
type KnTinh7 = { q: string[]; k: string[]; ba: Uint32Array }
/** Trần TỔNG số bộ ba của mọi phạm vi đang đệm trong một isolate (~12 byte/bộ ba); vượt ⇒ bỏ phạm vi cũ nhất. */
const TRAN_BA_KN_TINH = 120_000
function gonKnTinh(rows: readonly Row[]): KnTinh7 {
  const q: string[] = [], k: string[] = [], iq = new Map<string, number>(), ik = new Map<string, number>(), ba = new Uint32Array(rows.length * 3)
  rows.forEach((x, i) => {
    const a = str(x.qid), b = str(x.kn)
    let u = iq.get(a); if (u === undefined) { u = q.length; q.push(a); iq.set(a, u) }
    let v = ik.get(b); if (v === undefined) { v = k.length; k.push(b); ik.set(b, v) }
    ba[3 * i] = u; ba[3 * i + 1] = Number(x.duyet) === 1 ? 1 : 0; ba[3 * i + 2] = v
  })
  return { q, k, ba }
}
/** Hạn tối đa của bản đồ câu → nhãn kỹ năng (tính từ lúc DỰNG): nhãn mới duyệt vào chậm nhất 10 phút — như danh mục Hành trình (HAN_TOI_DA_DANH_MUC). */
const HAN_KN_TINH_MS = 600_000
/** Sau bao lâu thì hỏi lại dấu kho (một dòng) trước khi dùng tiếp bản đồ — câu sửa/duyệt vào chậm nhất chừng này, như danh mục ngoài cao điểm. */
const KIEM_KN_TINH_MS = 60_000
const demKnTinh = new WeakMap<object, Map<string, { luc: number; kiem: number; dau: string; tinh: KnTinh7 }>>()
/**
 * MA TRẬN CŨ + ỨNG VIÊN YẾU của Gói 7 (13/10 tối — thầy: "tất cả mọi chỗ rút câu rất là lag, bạn tối ưu máy chủ chuyên sâu"). Số đo D1 thật 24 giờ:
 * hai câu SQL cũ (ma trận nhãn + 96 câu yếu, bản gốc ở test) chạy ~24.000 lần/ngày, mỗi lần quét ~6.500–8.900 dòng câu kèm tách JSON (~300 + 80 giây D1/ngày) — trong khi phần quét
 * kho (câu → nhãn kỹ năng, đã duyệt) giống hệt cho mọi em cùng phạm vi; chỉ điểm kỹ năng `omni_p_vkn` (khoá chính (sbd, vkn_id) ⇒ ≤ 1 dòng/nhãn) là của em.
 * Nay: bản đồ tĩnh (SQL_KN_TINH, MỘT lần quét thay hai) đệm theo isolate (khoá D1 gốc + phạm vi), dùng lại tới 10 phút từ lúc dựng, quá 60 giây thì hỏi
 * dấu kho (một dòng) CÙNG đợt với lượt đọc điểm của em. Điểm của em LUÔN đọc mới, rồi tính
 * ĐÚNG phép SQL cũ: DISTINCT (nhãn, trạng thái) và MIN(COALESCE(p, 0,3)) theo câu đã duyệt, xếp (độ yếu, mã câu), lấy 96. Số đợt D1 không tăng.
 */
// 28/10 (thử tải 270 em: câu này 6.102 lần × ~2.770 dòng): điểm kỹ năng của em chỉ đổi ở ẢNH CHỤP ĐÊM (`chupHoSoTho` là nơi DUY NHẤT ghi omni_p_vkn) ⇒ bản GỌN
// một dòng `omni_p_gon` (ghi cùng lô chụp; thiếu ⇒ cất nền ở lượt đầu), hợp lệ khi cùng mốc với `omni_em`. MỘT câu SQL: bản gọn hợp lệ ⇒ một dòng; không ⇒ CÙNG các
// dòng như câu cũ. Bảng gọn chưa có ⇒ câu cũ. Kết quả trả nơi gọi y hệt (vkn_id, p, trang_thai; thứ tự vkn_id).
const SQL_DIEM_GON = `SELECT NULL AS vkn_id, NULL AS p, NULL AS trang_thai, g.json AS j, NULL AS m FROM omni_p_gon g JOIN omni_em e ON e.sbd = g.sbd AND e.cap_nhat_luc = g.moc WHERE g.sbd = ?1
  UNION ALL SELECT vkn_id, p, trang_thai, NULL, (SELECT cap_nhat_luc FROM omni_em WHERE sbd = ?1) FROM omni_p_vkn WHERE sbd = ?1
    AND NOT EXISTS (SELECT 1 FROM omni_p_gon g JOIN omni_em e ON e.sbd = g.sbd AND e.cap_nhat_luc = g.moc WHERE g.sbd = ?1)`
async function docDiemKyNangGon(env: Env, sbd: string): Promise<{ results: Row[] }> {
  let r: { results?: Row[] }
  // Bảng gọn chưa có (D1 mới, trước đêm chụp đầu tiên) ⇒ câu cũ KÈM mốc ảnh chụp ⇒ tạo bảng + cất nền như dưới.
  try { r = await env.DB.prepare(SQL_DIEM_GON).bind(sbd).all<Row>() } catch { r = await env.DB.prepare('SELECT vkn_id, p, trang_thai, NULL AS j, (SELECT cap_nhat_luc FROM omni_em WHERE sbd = ?1) AS m FROM omni_p_vkn WHERE sbd = ?1').bind(sbd).all<Row>() }
  const ds = r.results ?? []
  const gon = ds.find((x) => x.j != null)
  if (gon) {
    try { return { results: (JSON.parse(String(gon.j)) as [string, number, string][]).map(([vkn_id, p, trang_thai]) => ({ vkn_id, p, trang_thai })) } } catch { /* hỏng ⇒ câu cũ */ }
    return env.DB.prepare('SELECT vkn_id,p,trang_thai FROM omni_p_vkn WHERE sbd=?').bind(sbd).all<Row>()
  }
  const ra = ds.map((x) => ({ vkn_id: x.vkn_id, p: x.p, trang_thai: x.trang_thai }))
  const moc = ds[0]?.m
  if (ra.length && typeof moc === 'string' && moc) {
    const e = envGhiRieng(env)
    void chayDdlMotLan(e, 'omni_p_gon_2810', LENH_BANG_DIEM_GON).then(() => lenhDiemGon(e, sbd, moc, ra.map((x) => [String(x.vkn_id), Number(x.p), String(x.trang_thai)] as const)).run()).catch(() => {})
  }
  return { results: ra }
}
const docDiemKyNang7 = (env: Env, sbd: string) => som(docDiemKyNangGon(env, sbd))
/** `diemSom` (Gói R 15/10) = lượt đọc điểm kỹ năng của em (`omni_p_vkn`, chỉ theo SBD) nơi gọi đã bắt đầu sớm — cùng câu SQL; vắng ⇒ đọc như cũ. */
export async function docMaTranCu7(env: Env, sbd: string, maCu: readonly string[], now: number, diemSom?: Promise<{ results: Row[] }>): Promise<[{ results: Row[] }, { results: Row[] }]> {
  const thamSo = JSON.stringify(maCu), khoa = [...maCu].sort().join('|'), goc = dbGoc(env.DB as unknown as object)
  const pSom = diemSom ?? docDiemKyNang7(env, sbd)
  let bang = demKnTinh.get(goc)
  if (!bang) { bang = new Map(); demKnTinh.set(goc, bang) }
  let e = bang.get(khoa)
  if (e && !(now - e.luc >= 0 && now - e.luc < HAN_KN_TINH_MS)) e = undefined
  if (e && !(now - e.kiem >= 0 && now - e.kiem < KIEM_KN_TINH_MS)) {
    const d = await dauKhoCau(env)
    if (d && (e.dau ? d === e.dau : dauTruocLucDoc(d, e.luc))) { e.dau = d; e.kiem = now } else e = undefined
  }
  if (!e) {
    // Cùng nhịp với lượt đọc điểm (không `await` nào trước) ⇒ lớp gom lệnh gửi chung một lô như hai câu cũ.
    const r = await env.DB.prepare(SQL_KN_TINH).bind(thamSo).all<Row>()
    e = { luc: now, kiem: now, dau: '', tinh: gonKnTinh(r.results ?? []) }
    bang.delete(khoa); bang.set(khoa, e)
    let tong = 0; for (const v of bang.values()) tong += v.tinh.ba.length / 3
    for (const [k2, v] of bang) { if (tong <= TRAN_BA_KN_TINH || k2 === khoa) break; tong -= v.tinh.ba.length / 3; bang.delete(k2) }
  }
  const { q: qs, k: ks, ba } = e.tinh, n = ba.length / 3
  const p = new Map(((await pSom).results ?? []).map((x) => [str(x.vkn_id), x]))
  const da = new Set<string>(), kn: Row[] = []
  for (let i = 0; i < n; i++) { const k = ks[ba[3 * i + 2]!]!, t = p.get(k)?.trang_thai ?? null, d = `${k}\u0000${t}`; if (da.has(d)) continue; da.add(d); kn.push({ kn: k, trang_thai: t }) }
  const yeu = new Map<string, number>()
  for (let i = 0; i < n; i++) {
    if (!ba[3 * i + 1]) continue
    const qid = qs[ba[3 * i]!]!, v = p.get(ks[ba[3 * i + 2]!]!)?.p, y = v == null ? 0.3 : Number(v), cu = yeu.get(qid)
    if (cu === undefined || y < cu) yeu.set(qid, y)
  }
  const ung = [...yeu].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).slice(0, 96).map(([qid, y]) => ({ qid, yeu: y }))
  return [{ results: kn }, { results: ung }]
}
/** `gsSom`: danh sách gói đã đọc đoán cùng đợt cờ Gói 7 (`docDanhSachGoiSom7`); vắng ⇒ đọc như cũ.
 *  `hoan` (Gói R 15/10): có ⇒ lô ghi cuối của động cơ (kèm quota ngày) KHÔNG gửi ở đây mà đẩy vào `hoan` để nơi gọi tự gửi (`startGoi7`: song song lượt đọc câu). */
/**
 * GIỚI HẠN LẬP KẾ HOẠCH NẶNG ĐỒNG THỜI (thầy 29/10 21:36 «học sinh đang kêu lag» — ảnh «Đang chuẩn bị những câu phù hợp với em…»; Analytics 19–23h: `exceededMemory` 1 070 lượt
 * (230 / 700 / 143 lượt mỗi giờ 19–21h), hôm qua 1 367): mỗi lượt `lapGoi7` giữ hồ sơ + sổ học + câu của gói của MỘT em (vài MB). Giờ cao điểm một isolate chạy xen kẽ hàng chục lượt
 * như vậy (Sảnh + Mở chặng + lập sẵn nền của cùng một em cũng chạy ba lần) ⇒ vượt 128 MB ⇒ isolate bị giết, KÉO THEO mọi lượt đang chạy. Việc này nặng CPU + D1 nên chạy xen quá 3 lượt không nhanh
 * hơn — xếp hàng: tối đa `TOI_DA_LAP_DONG_THOI` lượt cùng lúc mỗi isolate, lượt sau chờ lượt trước xong (bàn giao chỗ, không chen).
 */
export const TOI_DA_LAP_DONG_THOI = 3
/** Chờ chỗ tối đa (ms) — quá thì chạy luôn. */
export const CHO_TOI_DA_MS = 6_000
let dangLap7 = 0
const hangLap7: (() => void)[] = []
async function gioiHanLap7<T>(f: () => Promise<T>): Promise<T> {
  if (dangLap7 >= TOI_DA_LAP_DONG_THOI) {
    // Chờ chỗ do lượt trước bàn giao (không tăng dangLap7). Chờ quá CHO_TOI_DA_MS ⇒ rời hàng, chạy luôn (vượt trần một lượt) — hàng đợi không bao giờ thành chờ lâu.
    let nhan!: () => void
    const coCho = new Promise<boolean>((ok) => { nhan = () => ok(true); hangLap7.push(nhan) })
    let hen = 0
    const duoc = await Promise.race([coCho, new Promise<boolean>((ok) => { hen = setTimeout(() => ok(false), CHO_TOI_DA_MS) as unknown as number })])
    clearTimeout(hen)
    if (!duoc) { const i = hangLap7.indexOf(nhan); if (i >= 0) hangLap7.splice(i, 1); else { /* vừa được bàn giao đúng lúc hết giờ ⇒ đã có chỗ */ } if (i >= 0) dangLap7++ }
  } else dangLap7++
  // Nhả chỗ đúng MỘT lần: xong việc, hoặc quá 45 s (D1 treo) — không để một lượt kẹt chặn cả hàng.
  let nha = false
  const tha = () => { if (nha) return; nha = true; const ke = hangLap7.shift(); if (ke) ke(); else dangLap7-- }
  const hen = setTimeout(tha, 45_000)
  try { return await f() } finally { clearTimeout(hen); tha() }
}
/** Số lượt lập đang chạy / đang chờ (test). */
export const trangThaiLap7 = () => ({ chay: dangLap7, cho: hangLap7.length })
dangKyKichThuoc('lap7', () => dangLap7 * 1000 + hangLap7.length)
export function lapGoi7(env: Env, sbd: string, now: number, gsSom?: Promise<{ results: Row[] }>, hoan?: D1PreparedStatement[]) {
  const p = gioiHanLap7(() => lapGoi7Tho(env, sbd, now, gsSom, hoan))
  // Ghi danh lượt ĐANG LẬP của em (cùng isolate) để lượt đến sau trong vài giây dùng lại (`lapDungLai7`) thay vì lập lần nữa.
  const m = bangDangLap7(env.DB), muc = { luc: now, p }
  m.set(sbd, muc)
  const bo = () => { if (m.get(sbd) === muc) m.delete(sbd) }
  p.then(bo, bo)
  return p
}
/**
 * LẬP MỘT LẦN (29/10 22:05 — thầy «bắt buộc phải làm được 100%»): xong một chặng, app gọi CÙNG LÚC Sảnh (làm mới Lộ trình) + mở trước chặng sau, và máy chủ còn lập sẵn nền
 * (`sauCauCuoi`) ⇒ BA lượt `lapGoi7` cho cùng một em chồng nhau (vài MB + ~0,4 s CPU + ~5 đợt D1 mỗi lượt) — gốc của phần lớn tải nặng giờ cao điểm (`exceededMemory`, «Đang chuẩn bị…»).
 * Lượt đến sau, cùng isolate, khi một lượt lập của em ĐANG chạy (bắt đầu ≤ 5 s trước, cùng ngày) ⇒ chờ lượt ấy rồi ĐỐI CHIẾU «đã làm hôm nay / vừa làm» đọc MỚI (một lệnh D1, như bản nhớ
 * Sảnh → Mở chặng `goi-bai-7-nho.ts`): khớp từng câu ⇒ dùng lại; lệch (em vừa trả lời thêm) / lỗi ⇒ null ⇒ nơi gọi tự lập như cũ.
 */
type LapGoi7Kq = Awaited<ReturnType<typeof lapGoi7Tho>>
const DANG_LAP7 = new WeakMap<object, Map<string, { luc: number; p: Promise<LapGoi7Kq> }>>()
function bangDangLap7(db: unknown): Map<string, { luc: number; p: Promise<LapGoi7Kq> }> {
  const g = dbGoc(db as object)
  let m = DANG_LAP7.get(g)
  if (!m) { m = new Map(); DANG_LAP7.set(g, m) }
  return m
}
export async function lapDungLai7(env: Env, sbd: string, now: number): Promise<LapGoi7Kq | null> {
  const x = bangDangLap7(env.DB).get(sbd)
  if (!x || now - x.luc < 0 || now - x.luc > 5_000 || ngayVn7(x.luc) !== ngayVn7(now)) return null
  try {
    const [lap, moi] = await Promise.all([x.p, docDaLamVaVuaLam7(env, sbd, ngayVn7(now), now)])
    if (!lap || !moi) return null
    return moi.soVua === lap.soVua && cungTap(moi.daLam, lap.daLamTap) && cungTap(moi.vuaLam, lap.vuaLam) ? lap : null
  } catch { return null }
}
async function lapGoi7Tho(env: Env, sbd: string, now: number, gsSom?: Promise<{ results: Row[] }>, hoan?: D1PreparedStatement[]) {
  const ngay = ngayVn7(now)
  // Lớp của em (bảng lớp dùng chung cả trường, đệm 30 giây trong isolate — `lopCuaEm`) bắt đầu CÙNG đợt danh sách gói (đợt 18): đệm vừa hết hạn thì phạm vi
  // bài ⇒ ma trận cũ ⇒ hồ sơ không phải chờ thêm một đợt. Lỗi đọc ⇒ null như cũ (hàm tự bắt).
  const lopSom = som(lopCuaEm(env, sbd))
  // Danh sách câu của gói (đầu vào hồ sơ) chỉ biết sau khi `docGoiCuaEm7` xong — hồ sơ đã bắt đầu từ móc thì chờ đúng lời hứa này.
  let traQids: (q: readonly string[]) => void = () => {}, loiQids: (e: unknown) => void = () => {}
  const qidsGoi = som(new Promise<readonly string[]>((ok, loi) => { traQids = ok; loiQids = loi }))
  const giu: { s: ReturnType<typeof batDauSom7> | null } = { s: null }
  // Gói R: lệnh ghi quota ngày của gói đi CHUNG lô ghi cuối của động cơ (đứng đầu lô — đúng thứ tự ghi cũ), không chặn các lượt đọc giữa lượt.
  const ghiTre7: D1PreparedStatement[] = []
  let goi: GoiCuaEm7[]
  try { goi = await docGoiCuaEm7(env,sbd,now,false,(ds) => { giu.s = batDauSom7(env,sbd,now,ngay,ds,qidsGoi,lopSom) },gsSom,ghiTre7) } catch (e) { loiQids(e); throw e }
  const qids = [...new Set(goi.flatMap(g => g.cau.map(c => c.qid)))]
  traQids(qids)
  if (!goi.length) return null
  const som7 = giu.s ?? batDauSom7(env,sbd,now,ngay,goi,qidsGoi,lopSom)
  const { phuSom, khoiSom, daLamSom, xemChuaSom, kiemSom } = som7
  const [old] = await som7.oldUngSom
  const [hs, [baoVe, btvn, control,chanMoi,nghi]] = await Promise.all([som7.hsSom, phuSom])
  // Chỉ lọc ứng viên phát MỚI; metadata/ref của phiên đã cấp và câu đã gặp vẫn giữ cho resume/ôn/sửa.
  hs.cau=hs.cau.filter(c=>!chanMoi.has(c.qid))
  // β câu + dòng chiến dịch đầy đủ của động cơ (theo hồ sơ) đi CÙNG đợt với bước cổng khối dưới (đợt 18).
  const dongCo = som7.dongCo ?? docTruocDongCo(env, sbd, now)
  docTruocDongCoTheoHoSo(env, dongCo, hs)
  const chan = new Set([...baoVe,...btvn,...control.blocked,...goi.flatMap(g=>g.cau.filter(c=>c.hopLe===false).map(c=>c.qid))])
  if (control.types.length) for (const c of hs.cau) if (!c.dang || !control.types.includes(c.dang)) chan.add(c.qid)
  // CÂU NGHI SAI ĐÁP ÁN (lỗi 14/10 — thầy: "học sinh còn 1 câu nhưng app ko cho làm, sửa triệt để nhé"; đo D1 thật 21:40: 3 em 23/24, kế hoạch còn ĐÚNG 1 câu
  // ôn/sửa là câu nghi). Cổng phát câu (`chanKhacKhoiEm`) loại câu nghi, còn kế hoạch chỉ xét câu nghi cho câu gói CHƯA gặp ⇒ câu ôn / sửa / chữa đang nghi vẫn
  // vào kế hoạch (vừa đúng phần còn lại của mức) ⇒ mở chặng rỗng ⇒ "Em đã hoàn thành…". Nay chặn ngay ở kế hoạch, cùng phép quy mã gốc của cổng (`~` ⇒ gốc).
  if (nghi.size) for (const c of [...hs.cau, ...goi.flatMap(g => g.cau)]) if (nghi.has(c.qid.split('~')[0]!)) chan.add(c.qid)
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
    const quaCong = new Set((await chanKhacKhoiEm(env, 'goi7', { sbd, khoiEm }, coTheGiao, { cauCua: (c) => metaCua(c.qid), nghiSan: nghi })).map(c => c.qid))
    for (const c of ungGoi) if (!quaCong.has(c.qid)) chan.add(c.qid)
  }
  const nhom7 = new Map([...hs.meta].map(([qid,m])=>[qid,m.group]))
  const tang = tangCuaEm(hs.cau,hs.tt,nhom7)
  // Gói R 15/10: lịch kiểm tra riêng TẮT ⇒ mức hôm nay KHÔNG phụ thuộc động cơ (chỗ giữ ôn/sửa = 0) ⇒ chốt NGAY, SONG SONG với động cơ, qua đường ghi riêng
  // (`envGhiRieng`: D1 gốc, vẫn qua rào cổng; lệnh ghi tự nuốt lỗi như cũ, đọc lại dòng thắng qua cùng đường; không lượt đọc nào khác của lượt đọc bảng mức hôm nay)
  // — trước: nối tiếp SAU lô ghi của động cơ, hai đợt D1. Cùng đối số y hệt lời gọi cũ bên dưới. Lịch bật / cờ lỗi ⇒ chốt ở chỗ cũ như trước.
  const batKtSom = som(import('./kiem-tra-ca-nhan').then(m=>m.coKtCn(env)))
  const chotSom = batKtSom.then(bat => bat === false ? chotMucNgay7(envGhiRieng(env),sbd,ngay,tang,goi.reduce((n,g)=>n+g.quota,0),now,false,som7.mucSom,0,goi.some(g=>g.kiemNhe),goi.map(g=>g.id)) : null).catch(() => null)
  const engine = await dongCoHanhTrinh(env,sbd,now,hs,chan,true,dongCo,{ghiTruoc:ghiTre7,hoan})
  const sanSang = new Set(hs.cau.filter(c => !engine.chan.has(c.qid) && !chan.has(c.qid) && !chan.has(hs.meta.get(c.qid)?.group??'') && !hs.meta.get(c.qid)?.tuLuan).map(c => c.qid))
  const { daLam: daLamNgay, vuaLam, soVua, soDaLam, luot: luotNgay } = await daLamSom
  const [views,teacherCorrections]=await xemChuaSom
  const vuaXem=new Set(views.results.map(r=>r.qid)),daGap = new Set(goi.flatMap(g => [...g.daGap]))
  // Hồ sơ đọc tối đa 12 lịch kiểm trong query mốc đã có. Chỉ đổi thứ tự ôn/sửa, giữ nguyên quota câu mới.
  const kiemDenHan = new Set(hs.hoiThayDenHan ?? [])
  const uuTien=(a:{qid:string},b:{qid:string})=>soSanhOnHoiThay(a.qid,b.qid,kiemDenHan)||(engine.trongSo[b.qid]??0)-(engine.trongSo[a.qid]??0)||a.qid.localeCompare(b.qid)
  const sua = hs.cau.filter(c => !vuaXem.has(c.qid)&&['mo','cho_kiem'].includes(hs.loiV2?.get(c.qid)?.trangThai ?? '')).sort(uuTien).map(c => c.qid)
  const qidsGoi7 = new Set(qids) // 29/10: `qids.includes` trong vòng lặp từng câu ứng viên là O(câu × câu gói) — dùng Set
  const on = hs.cau.filter(c => !vuaXem.has(c.qid)&&(!qidsGoi7.has(c.qid)||daGap.has(c.qid)) && (kiemDenHan.has(c.qid) || hs.tt.get(c.qid)?.laMoi || (engine.hen.get(c.qid) ?? hs.tt.get(c.qid)?.henOn ?? '9999') <= ngay)).sort(uuTien).map(c => c.qid)
  const chua=goi.flatMap(g=>g.cau.filter(c=>g.choThay.has(c.qid)&&teacherCorrections.results.some(r=>r.goi_id===g.id&&r.qid===c.qid&&r.version===c.version)).map(c=>c.qid))
  const cau = [...new Map(goi.flatMap(g => g.cau).map(c => [c.qid,c])).values()]
  const quotaCon = goi.reduce((n,g) => n+Math.max(0,g.quota-g.gapNgay.size),0)
  // MỘT CON SỐ (thầy 12/10): mức hôm nay M = max(mức theo tầng, Σ câu mới theo lịch các gói) — chốt lần lập đầu tiên trong ngày, các lần sau đọc lại.
  // Kế hoạch đúng M − đã làm câu: câu mới theo lịch vẫn đứng đầu nhưng không vượt phần còn lại của M (`chiTrongMuc`).
  const batKt=await batKtSom
  // Câu VỪA LÀM (≤ 15 phút, kể cả gốc của bản ảo) `startGoi7` không phát lại ⇒ kế hoạch cũng không xếp vào sửa / ôn / chữa (lỗi 14/10: kế hoạch và lúc phát
  // phải cùng một luật, không thì phần còn lại của mức rơi vào câu không phát được). Mức hôm nay vẫn tính theo `daLamNgay` thật.
  const khongXep = vuaLam.size ? new Set([...daLamNgay, ...vuaLam]) : daLamNgay
  const eligible=(id:string)=>sanSang.has(id)&&!khongXep.has(id)&&!chan.has(id)
  const suaCan=batKt?sua.filter(id=>eligible(id)&&!chua.includes(id)).slice(0,4):[]
  const onCan=batKt?on.filter(id=>eligible(id)&&!suaCan.includes(id)&&!chua.includes(id)):[]
  const giuOn=batKt?Math.min(6,onCan.length):0
  const muc7 = (!batKt ? await chotSom : null) ?? await chotMucNgay7(env,sbd,ngay,tang,goi.reduce((n,g)=>n+g.quota,0),now,false,som7.mucSom,giuOn+suaCan.length,goi.some(g=>g.kiemNhe),goi.map(g=>g.id))
  let toiThieu = muc7.muc
  const kiemNhe=goi.some(g=>g.kiemNhe)
  // 12 chỗ của ngày kiểm tra giữ tiến độ bài đang trong hạn; nợ cũ vẫn ở hàng đợi.
  const nhomPhu=[...goi].sort((a,b)=>(kiemNhe?Number(a.han<ngay)-Number(b.han<ngay):0)||a.han.localeCompare(b.han)).map(g=>({qids:g.cau.map(c=>c.qid),quota:Math.max(0,g.quota-g.gapNgay.size)}))
  // ÔN SỚM (thầy 23/10 chọn "cả hai" — em báo «Hôm nay còn 3 câu chờ thầy bổ sung» ở 27/30): kho bài hết câu xếp được mà chưa đủ mức ⇒ lấp bằng câu em ĐÃ
  // làm (không câu mới, không câu chờ thầy dạy lại), câu sai lần cuối trước, sai nhiều trước, chưa thành thạo trước, gần lịch ôn trước. Chỉ CPU, không đọc D1.
  const vaoPlan: Parameters<typeof chonGoi7>[0] = { cau,daGap:vuaLam.size||luotNgay.size?new Set([...daGap,...vuaLam,...luotNgay]):daGap,daLamNgay:khongXep,quotaCon,sanSang,chan,sua,on:batKt?[...onCan,...on.filter(id=>!onCan.includes(id))]:on,chua,trongSo:engine.trongSo,nhomPhu,chiTrongMuc:true,giuOn }
  let plan = chonGoi7({ ...vaoPlan, mucTieuNgay:Math.max(0,toiThieu-soDaLam) })
  // Chỉ khi kế hoạch thường còn thiếu mức (hiếm) mới đọc thêm câu đã DÀNH cho Kiểm tra ôn tập sắp tới của em (một lệnh, chỉ mã câu) — ôn sớm không lấy
  // trước câu của đề kiểm tra; ngày thường không thêm lệnh D1 nào.
  if (soDaLam + plan.viec.length < toiThieu) {
    const daCo = new Set([...sua, ...on, ...chua])
    const deKt = await env.DB.prepare(`SELECT DISTINCT json_extract(c.value,'$.q.qid') qid FROM kiem_tra_ca_nhan k, json_each(k.json,'$.cau') c WHERE k.sbd=? AND k.ngay>=? AND k.trang_thai NOT IN ('da_nop','het_han')`)
      .bind(sbd, ngay).all<{ qid: string }>().then(r => new Set(r.results.map(x => String(x.qid))), () => null)
    // Đọc hỏng ⇒ không ôn sớm (không đoán) và cũng KHÔNG hạ mức bên dưới.
    if (deKt) {
      vaoPlan.onSom = hs.cau.filter(c => { const t = hs.tt.get(c.qid); return !!t && !t.laMoi && !t.catTia && !daCo.has(c.qid) && !vuaXem.has(c.qid) && !deKt.has(c.qid) })
        .sort((x, y) => { const a = hs.tt.get(x.qid)!, b = hs.tt.get(y.qid)!
          return Number(a.lanCuoiDung !== false) - Number(b.lanCuoiDung !== false) || b.lanSai - a.lanSai || Number(a.thanhThao) - Number(b.thanhThao) ||
            (a.henOn ?? '9999').localeCompare(b.henOn ?? '9999') || x.qid.localeCompare(y.qid) }).map(c => c.qid)
      plan = chonGoi7({ ...vaoPlan, mucTieuNgay:Math.max(0,toiThieu-soDaLam) })
    }
  }
  // HẾT CẢ ÔN SỚM (thầy 23/10 "cả hai"): còn thiếu mức mà không còn câu nào xếp được ⇒ mức hôm nay hạ đúng bằng số câu em làm được (đã làm + còn xếp được)
  // để ngày ấy tính ĐỦ MỨC — em không mất chuỗi Chăm vì kho thiếu. Chỉ khi không có câu nào trong cửa sổ "vừa làm" (câu ấy quay lại sau ≤ 15 phút) và mức
  // đã chốt; ghi đường riêng, nuốt lỗi; thầy vẫn thấy kho cần bổ sung (`canBoSung`, `thieuPhu` như cũ).
  const coThe = soDaLam + plan.viec.length
  if (coThe < toiThieu && vaoPlan.onSom && !vuaLam.size && soDaLam > 0 && hs.cau.length >= soDaLam && muc7.daChot) {
    toiThieu = coThe
    som(envGhiRieng(env).DB.prepare('UPDATE goi_bai_7_muc_ngay SET muc=? WHERE sbd=? AND ngay=? AND muc>?').bind(coThe, sbd, ngay, coThe).run())
      .catch((e: unknown) => console.error('[goi7] chưa hạ được mức hôm nay khi hết câu:', e instanceof Error ? e.message : e))
  }
  // DỰ PHÒNG KHI MỞ CHẶNG (lỗi 14/10, "còn 1 câu nhưng app ko cho làm"): kế hoạch xếp VỪA ĐÚNG phần còn lại của mức, nên một câu của nó lúc phát không còn phát
  // được (thầy vừa sửa / rút câu, đọc lại câu lỗi, cổng khối …) là đủ để chặng rỗng. `startGoi7` khi đó đi tiếp TOÀN BỘ hàng chờ theo CÙNG luật xếp (mới theo lịch
  // → chữa → sửa → ôn → mới → tiếp cận), bỏ câu đã có trong kế hoạch. Chỉ tính khi cần — CPU, không đọc D1.
  const duPhong = (): ViecGoi7[] => { const co = new Set(plan.viec.map(v => v.qid)); return chonGoi7({ ...vaoPlan, mucTieuNgay: cau.length + hs.cau.length }).viec.filter(v => !co.has(v.qid)) }
  // HỌC THÊM CÂU MỚI (thầy 29/10 17:36, ảnh «Em đã hoàn thành phần được xếp hôm nay…»: nút «Học thêm câu mới» của Lộ trình mở chặng RỖNG ⇒ em kẹt): em ĐÃ đủ mức hôm nay muốn học thêm ⇒ một
  // chặng (6 câu) toàn câu MỚI của các gói (theo lịch trước, rồi câu chưa gặp), không câu sửa / ôn. Không đổi mức đã chốt, chuỗi, số «đã làm» — câu học thêm chỉ cộng vào số đã làm. CPU thuần, chỉ tính khi gọi.
  const hocThem = (): ViecGoi7[] => chonGoi7({ ...vaoPlan, sua: [], on: [], chua: [], onSom: undefined, giuOn: 0, mucTieuNgay: CAU_MOT_BAI }).viec
  const kiem=await kiemSom
  const diemDaDo=kiem.results.filter(r=>diemConDungNguon7(json<Row>(r.json).cau,goi.find(g=>g.id===r.goi_id)?.cau.filter(c=>(c.maTo??c.maDe)===r.ma_de)??[])).map(r=>({goiId:str(r.goi_id),maDe:str(r.ma_de),diem:Number(r.diem),luc:str(r.nop_luc),cauMoi:Number(json<Row>(r.json).cauMoi??0),tong:Number(json<Row>(r.json).tong??0)}))
  const skills = new Map(old.results.map(r => [str(r.kn),r.trang_thai === 'vung']))
  const kienThucCu = { tong: skills.size, dat: [...skills.values()].filter(Boolean).length, tyLe: skills.size ? Math.round(1000*[...skills.values()].filter(Boolean).length/skills.size)/10 : null }
  // ĐỢT 19 (CHỈ-THÊM, không đọc thêm D1 — lỗi 13/10 "tab Hành trình: Chưa có danh sách bài" khi Gói 7 bật): tầng đang luyện của TỪNG bài trong gói, cùng
  // cổng mở tầng của động cơ (`tangCuaEm`) trên các câu của gói có trong hồ sơ vừa đọc. Gói không có câu nào mang mức độ trong hồ sơ ⇒ KHÔNG có tầng
  // (app không vẽ, không bịa).
  const tangGoi = new Map<string, TangHanhTrinh>()
  for (const g of goi) {
    const q = new Set(g.cau.map(c => c.qid)), ds = hs.cau.filter(c => q.has(c.qid))
    if (ds.some(c => tangCuaCau(c) !== null)) tangGoi.set(g.id, tangCuaEm(ds, hs.tt, nhom7))
  }
  return { goi, plan, hs, chan, control, kienThucCu, diemDaDo, toiThieu, daLamNgay:soDaLam, tang, tangGoi, vuaLam, nghi, duPhong, hocThem, daLamTap: daLamNgay as ReadonlySet<string>, soVua, pDung: engine.pDung ?? {} }
}

type LapGoi7 = NonNullable<Awaited<ReturnType<typeof lapGoi7>>>
/** Sảnh vừa lập xong ⇒ nhớ cho lượt mở chặng (thường là lượt mở TRƯỚC của app, ngay sau đó) dùng lại — xem goi-bai-7-nho.ts. */
export function nhoLapSanh7(env: Env, sbd: string, now: number, lap: LapGoi7): void {
  nhoKeHoach7(env.DB, sbd, { luc: now, lap, daLam: lap.daLamTap, vuaLam: lap.vuaLam, soVua: lap.soVua })
}
/** Lấy lại kế hoạch vừa lập trong 8 giây cho lượt Sảnh nếu dấu đã làm hôm nay vẫn khớp (trả null ĐỒNG BỘ khi không có bản nhớ để không lệch nhịp microtask). */
export function layLapSanhNho7(env: Env, sbd: string, now: number): Promise<LapGoi7 | null> | null {
  const nho = xemKeHoach7<LapGoi7>(env.DB, sbd, now)
  if (!nho || ngayVn7(nho.luc) !== ngayVn7(now)) return null
  return docDaLamVaVuaLam7(env, sbd, ngayVn7(now), now).then(
    (moi) => (moi && moi.soVua === nho.soVua && cungTap(moi.daLam, nho.daLam) && cungTap(moi.vuaLam, nho.vuaLam) ? nho.lap : null),
    () => null,
  )
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
  // ĐỢT 19 (CHỈ-THÊM): `tang` = tầng chung của em (đúng số `lapGoi7` dùng chốt mức hôm nay) · `goi[].tang` = tầng đang luyện của bài ấy. Vắng (tóm tắt
  // dựng tay, gói không có bằng chứng) ⇒ không gửi trường — app hiện thang 4 tầng trung tính.
  const tangGoi = lap.tangGoi as ReadonlyMap<string, TangHanhTrinh> | undefined
  return { bat: true, ngay: homNay, ...(lap.tang ? { tang: lap.tang } : {}), goi: lap.goi.map(g => {
    const qids = new Set(g.cau.map(c => c.qid)), tong = qids.size, daGap = Math.min(tong, [...g.daGap].filter(q => qids.has(q)).length)
    const tangBai = tangGoi?.get(g.id)
    return { id:g.id,ten:g.ten,batDau:g.batDau,han:g.han,tong,daGap,con:tong-daGap,nguonDayDu:g.nguonDayDu,...(tangBai ? { tang: tangBai } : {}),
      to:[...new Set(g.cau.map(c=>c.maTo??c.maDe).filter((m): m is string => typeof m === 'string' && m.trim().length > 0))],
      canBoSung:g.cau.filter(c=>c.hopLe===false).length,quota:dem7(g.quota),gapHomNay:[...g.gapNgay].filter(q => qids.has(q)).length,quaHan:homNay>g.han && (!g.nguonDayDu||daGap<tong) }
  }),
    tuLamCon:dem7(lap.plan.tuLam),tiepCanCon:dem7(lap.plan.tiepCan),thieuPhu:dem7(lap.plan.thieuPhu),thieuNgay:Math.max(0,lap.toiThieu-lap.daLamNgay-lap.plan.viec.length),kienThucCu:lap.kienThucCu,
    canHoTro:lap.plan.tuLam*2+lap.plan.tiepCan*3>60 || lap.plan.thieuPhu>0 || lap.daLamNgay+lap.plan.viec.length<lap.toiThieu,
    mucTieuDiem:7,diemDaDo:lap.diemDaDo.filter(laDiemDaDo7),toiThieu:lap.toiThieu,daLamHomNay:lap.daLamNgay }
}

const dangMoChang7 = new WeakMap<object, Map<string, Promise<Record<string, unknown> | null>>>()

/** Một đợt tối đa 6 câu; giữ các câu/phiên bản và vai ở máy chủ, không phát đáp án. */
/** `khongLuu` (SẴN SÀNG 27/10, san-sang.ts): lập đúng chặng như lượt thật nhưng KHÔNG lưu phiên — trả `chuanBi` {refs, questions, goi7, goiIds} để nơi gọi
 *  cất sẵn; phiên chỉ được lưu lúc em thật sự mở chặng (`moChangSanSang`). Không có kế hoạch / chặng rỗng ⇒ null. */
export function startGoi7(env: Env, sbd: string, now: number, gsSom?: Promise<{ results: Row[] }>, opts?: { khongLuu?: boolean; lapSan?: LapGoi7; coPhienMoi?: boolean }): Promise<Record<string,unknown> | null> {
  if (!opts?.khongLuu) {
    const goc = dbGoc(env.DB as object)
    let m = dangMoChang7.get(goc)
    if (!m) { m = new Map(); dangMoChang7.set(goc, m) }
    const dang = m.get(sbd)
    if (dang) return dang
    const p = startGoi7Thuc(env, sbd, now, gsSom, opts)
    m.set(sbd, p)
    p.then(() => { if (m!.get(sbd) === p) m!.delete(sbd) }, () => { if (m!.get(sbd) === p) m!.delete(sbd) })
    return p
  }
  return startGoi7Thuc(env, sbd, now, gsSom, opts)
}

async function startGoi7Thuc(env: Env, sbd: string, now: number, gsSom?: Promise<{ results: Row[] }>, opts?: { khongLuu?: boolean; lapSan?: LapGoi7; coPhienMoi?: boolean }): Promise<Record<string,unknown> | null> {
  // Đợt 17: khối em + đợt cũ (và câu đã trả lời của nó) đọc SONG SONG với lập kế hoạch — trước đây nối tiếp sau `lapGoi7`. Bảng gói chắc có trước (`damBaoGoi7`).
  const khoiSom = som(docKhoiEm(env,sbd))
  // Cờ «học kiểu Duolingo» (duolingo-bai-co.ts): đọc qua đệm, bắt đầu cùng đợt đầu — không thêm vòng chờ.
  const duoSom = som(duolingoChoEm(env,sbd,now))
  const cuSom = som(damBaoGoi7(env).then(async () => {
    const old = await env.DB.prepare(`SELECT id,json FROM game_v2_session WHERE sbd=? AND created_at>=? AND json_extract(json,'$.hocTap')=1 ORDER BY created_at DESC LIMIT 1`).bind(sbd,new Date(now-2*3600000).toISOString()).first<Row>()
    const answered = old ? await env.DB.prepare('SELECT qid FROM game_v2_attempt WHERE session=? AND sbd=? UNION SELECT qid FROM goi_bai_7_gap WHERE receipt LIKE ? AND sbd=?').bind(old.id,sbd,`${str(old.id)}|%`,sbd).all<{qid:string}>() : {results:[] as {qid:string}[]}
    return { old, answered }
  }))
  const hoan: D1PreparedStatement[] = []
  const nho = opts?.lapSan ? null : layKeHoach7<LapGoi7>(env.DB, sbd, now)
  const kiemNhoSom = nho && ngayVn7(nho.luc) === ngayVn7(now) ? som(docDaLamVaVuaLam7(env, sbd, ngayVn7(now), now)) : null
  let lapNho: LapGoi7 | null = opts?.lapSan ?? null
  if (nho && kiemNhoSom) {
    const moi = await kiemNhoSom.catch(() => null)
    if (moi && moi.soVua === nho.soVua && cungTap(moi.daLam, nho.daLam) && cungTap(moi.vuaLam, nho.vuaLam)) lapNho = nho.lap
  }
  // ĐƯỜNG TẮT MỞ TIẾP PHIÊN ĐANG DỞ (29/10 tối): khi em đang làm dở chặng (`coPhienMoi` + `old` còn câu chưa làm + có `tomTat7` & `goiIds`), kiểm tra quyền gói và
  // đọc thẳng các câu còn lại của phiên trong ~2 đợt D1 (< 30 ms) — không chạy lại `lapGoi7` (~25 lệnh D1). Nếu gói vừa đổi quyền hoặc câu không còn hợp lệ ⇒ rơi xuống `lapGoi7` như cũ.
  if (opts?.coPhienMoi && !opts?.khongLuu && !lapNho) {
    const [khoi0, { old: old0, answered: ans0 }] = await Promise.all([khoiSom, cuSom])
    const saved0 = old0 ? json<{ goi7?: number; questions: RefGoi7[]; tomTat7?: Record<string, unknown>; goiIds?: string[] }>(old0.json) : null
    const done0 = new Set(ans0.results.map(r => r.qid))
    if (old0 && saved0?.goi7 === 1 && saved0.tomTat7 && Array.isArray(saved0.goiIds) && saved0.goiIds.length && saved0.questions.some(r => !done0.has(r.qid) && !r.lamLaiCuoi)) {
      const [daLam0, baoVe0, btvn0, control0, nghi0, conQuyen] = await Promise.all([
        docDaLamVaVuaLam7(env, sbd, ngayVn7(now), now),
        protectedQuestions(env),
        docCauBtvnChuaNop(env, sbd),
        readGameScope(env, sbd),
        docCauNghiDem(env, now),
        env.DB.prepare(`SELECT 1 AS ok WHERE ${sqlCacGoiConNhan7('?', '?', sqlTenLopHs('h'))}`).bind(JSON.stringify(saved0.goiIds), sbd).first<Row>().catch(() => null),
      ])
      if (conQuyen?.ok && control0.enabled) {
        const vuaGoc0 = (qid: string) => daLam0.vuaLam.has(qid) || daLam0.vuaLam.has(tachSongSinh(qid).goc)
        const viec0 = saved0.questions.filter(r => !done0.has(r.qid) && !r.lamLaiCuoi && !vuaGoc0(r.qid) && !daLam0.daLam.has(r.qid)).map(r => ({ ...r, vai: r.vai ?? 'on', huongDan: r.huongDan ?? false }))
        if (viec0.length) {
          const qs0 = (await Promise.all(viec0.map(r => currentQuestion(env, r).then(q => ({ r, q }), () => null)))).filter((v): v is NonNullable<typeof v> => !!v)
          const quaKhoi0 = new Set(await chanKhacKhoiEm(env, 'goi7', { sbd, khoiEm: khoi0 }, qs0.map(v => v.q), { nghiSan: nghi0 }))
          const hopLe0 = qs0.filter(({ q }) => quaKhoi0.has(q) && q.reviewed && !laCauTuLuan(q) && !baoVe0.has(q.qid) && !baoVe0.has(q.group) && !btvn0.has(q.qid) && !control0.blocked.includes(q.qid) && (!control0.types.length || (!!q.dang && control0.types.includes(q.dang))))
          if (hopLe0.length === viec0.length) {
            const giao0 = hopLe0.map(({ r, q }) => apXaoTheoRef(q, r))
            const questions0 = giao0.map((qx, i) => ({ ...publicQuestion(qx), ...(hopLe0[i]!.r.goiY ? { goiY: hopLe0[i]!.r.goiY } : {}), vaiGoi7: hopLe0[i]!.r.vai, huongDan7: hopLe0[i]!.r.huongDan, coGoi7: true } as Record<string, unknown>))
            await ganNiemChoCau(env, sbd, questions0, giao0, true, now)
            return { ok: true, id: str(old0.id), questions: questions0, goi7: { ...saved0.tomTat7, daLamHomNay: daLam0.soDaLam } }
          }
        }
      }
    }
  }
  const lap = lapNho ?? (!nho ? await lapDungLai7(env, sbd, now) : null) ?? await lapGoi7(env,sbd,now,gsSom,hoan)
  const ghiDongCo = som((async () => { const db = envGhiRieng(env).DB; for (let i = 0; i < hoan.length; i += 30) await db.batch(hoan.slice(i, i + 30).map(st => lenhTrong(env.DB, st))) })())
  try {
  if (!lap) {
    await ghiDongCo
    if (opts?.khongLuu) return null
    // Bớt em chỉ ngừng cấp câu mới. Phiên đã cấp vẫn tiếp tục đúng payload/thứ tự, qua các cổng nguồn/khối/ca hiện hành.
    const [khoi,{old,answered},baoVe,btvn,control]=await Promise.all([khoiSom,cuSom,protectedQuestions(env),docCauBtvnChuaNop(env,sbd),readGameScope(env,sbd)])
    if (!old || !control.enabled) return null
    const saved=json<{goi7?:number;questions:RefGoi7[]}>(old.json)
    if (saved.goi7!==1) return null
    const done=new Set(answered.results.map(r=>r.qid)),refs=saved.questions.filter(r=>!done.has(r.qid)&&!r.lamLaiCuoi)
    const qs=(await Promise.all(refs.map(r=>currentQuestion(env,r).then(q=>({r,q}),()=>null)))).filter((v):v is NonNullable<typeof v>=>!!v)
    const quaKhoi=new Set(await chanKhacKhoiEm(env,'goi7',{sbd,khoiEm:khoi},qs.map(v=>v.q)))
    const questions0=qs.filter(({q})=>quaKhoi.has(q)&&q.reviewed&&!laCauTuLuan(q)&&!baoVe.has(q.qid)&&!baoVe.has(q.group)&&!btvn.has(q.qid)&&!control.blocked.includes(q.qid)&&(!control.types.length||!!q.dang&&control.types.includes(q.dang)))
    const giao=questions0.map(({r,q})=>apXaoTheoRef(q,r))
    const questions=giao.map((qx,i)=>({...publicQuestion(qx),...(questions0[i]!.r.goiY?{goiY:questions0[i]!.r.goiY}:{}),vaiGoi7:questions0[i]!.r.vai,huongDan7:questions0[i]!.r.huongDan,coGoi7:true} as Record<string,unknown>))
    await ganNiemChoCau(env,sbd,questions,giao,true) // TEM NIÊM PHONG (niem-cau.ts): dòng 1 «Kiểm tra» không phụ thuộc isolate
    return questions.length?{ok:true,id:str(old.id),questions}:null
  }
  if (!lapNho) nhoLapSanh7(env, sbd, now, lap)
  if (!lap.control.enabled) { await ghiDongCo; throw new Error('Thầy đang tạm dừng bài học cho em.') }
  const [khoi, { old, answered }] = await Promise.all([khoiSom, cuSom])
  const vuaLam = lap.vuaLam
  const saved = old ? json<{questions:RefGoi7[]}>(old.json) : null
  const done = new Set(answered.results.map(r => r.qid))
  const vuaLamGoc = (qid: string) => vuaLam.has(qid) || vuaLam.has(tachSongSinh(qid).goc)
  const viec = saved ? saved.questions.filter(r => !done.has(r.qid) && !r.lamLaiCuoi && !vuaLamGoc(r.qid) && !lap.daLamTap.has(r.qid)).map(r=>({...r,vai:r.vai??'on',huongDan:r.huongDan??false})) : []
  const refs: RefGoi7[] = [], questions: Record<string,unknown>[] = [], riengQ: PrivateQuestion[] = []
  const kiemHoiThay = new Set(lap.hs.hoiThayDenHan ?? [])
  const satHan = !(await duoSom) || lap.goi.some(g => g.quota > g.gapNgay.size && soNgayCon7(ngayVn7(now), g.han) <= 1) // cờ tắt ⇒ giữ thứ tự cũ
  const lanThu: (() => readonly (ViecGoi7 | RefGoi7)[])[] = [...(viec.length ? [() => viec] : []), () => xepBai6(lap.plan.viec, lap.pDung, { giuThuTu: satHan }), ...(lap.daLamNgay < lap.toiThieu ? [lap.duPhong] : [lap.hocThem])]
  const cauGoi = new Map(lap.goi.flatMap(g=>g.cau).map(c=>[c.qid,c] as const).reverse())
  const soCauChang = 6 - (lap.daLamNgay % 6)
  for (const lay of lanThu) { if (refs.length) break
    const ds = lay()
    const ung = ds.map(v => { const oldRef = saved?.questions.find(r=>r.qid===v.qid); return { v, oldRef, meta: oldRef ?? lap.hs.meta.get(v.qid) ?? cauGoi.get(v.qid) } })
      .filter(x => x.meta && !lap.chan.has(x.v.qid) && !lap.chan.has(x.meta.group) && (ds === viec || !vuaLamGoc(x.v.qid)))
    for (let i = 0; i < ung.length && refs.length < soCauChang;) {
    const lo = ung.slice(i, i + soCauChang - refs.length + 2); i += lo.length
    const daDoc = (await Promise.all(lo.map(x => currentQuestion(env, x.meta!).then(q => ({ ...x, q }), () => null)))).filter((x): x is NonNullable<typeof x> => !!x)
    const quaKhoi = new Set(await chanKhacKhoiEm(env,'goi7',{sbd,khoiEm:khoi},daDoc.map(x => x.q),{nghiSan:lap.nghi})) // CÙNG tập câu nghi với kế hoạch
    for (const x of daDoc) {
    if (refs.length >= soCauChang) break
    const v = x.v, oldRef = x.oldRef
    let q: PrivateQuestion = x.q
    if (!quaKhoi.has(q) || laCauTuLuan(q) || !q.reviewed || lap.control.types.length && (!q.dang || !lap.control.types.includes(q.dang))) continue
    let lamLai:LamLaiRef|undefined
    if(oldRef)q=apXaoTheoRef(q,oldRef)
    else if(v.vai==='sua'){
      const m=lap.hs.meta.get(q.qid)
      if(m){const x=(await apLamLaiKhac(env,lap.hs,[{q,m}],{sbd,nowMs:now,keHoach:lap.plan.viec.map(v=>v.qid)},new Set([...lap.chan,...refs.map(r=>r.qid)])))[0];if(x){q=x.q;lamLai=x.lamLai;const ss=tachSongSinh(q.qid);if(ss.songSinh!==null)lamLai={...lamLai,tc:ss.goc}}}
    }
    if (!oldRef && q.qid !== v.qid && vuaLamGoc(q.qid)) continue // bản làm lại (song sinh / anh em) của câu em vừa trả lời ⇒ không phát ngay
    const ref: RefGoi7 = {...oldRef,...lamLai,qid:q.qid,maDe:q.maDe,version:q.version,group:q.group,novel:lap.hs.tt.get(q.qid)?.laMoi ?? true,
      role:v.vai==='moi'?'cau_moi':v.vai==='sua'?'on_lai':'on_lai',vai:v.vai,huongDan:v.huongDan,
      ...(kiemHoiThay.has(q.qid)||kiemHoiThay.has(tachSongSinh(lamLai?.tc??oldRef?.tc??q.qid).goc)?{hoiThayKiem:true as const}:{})}
    refs.push(ref); riengQ.push(q); questions.push({...publicQuestion(q),...(ref.goiY?{goiY:ref.goiY}:{}),vaiGoi7:v.vai,huongDan7:v.huongDan,coGoi7:lap.goi.some(g=>g.cau.some(c=>c.qid===q.qid&&c.version===q.version))})
  } } }
  await ghiDongCo
  const niemSom = ganNiemChoCau(env, sbd, questions, riengQ, true, now, opts?.khongLuu ? HAN_NIEM_CHUAN_BI_MS : undefined) // TEM NIÊM PHONG (niem-cau.ts): song song phần còn lại; không bao giờ ném. Chặng LẬP SẴN: hạn dài, làm mới lúc mở (san-sang.ts)
  // Chặng RỖNG (em đã xong phần hôm nay) cũng lập sẵn được (28/10 chiều, thử tải): phản hồi y hệt, nơi dùng trả ngay không lập lại.
  const tomTat = tomTatGoi7(lap, now), goiIds = lap.goi.map(g => g.id)
  if (!refs.length) { const rong: Record<string,unknown> = {ok:true,questions:[],goi7:tomTat,message:lap.plan.thieuPhu&&lap.daLamNgay<lap.toiThieu?'Còn câu cần thầy bổ sung học liệu hoặc đang được giữ cho ca kiểm tra.':'Em đã hoàn thành phần được xếp hôm nay. Lỗi chưa kiểm chứng vẫn được giữ để học tiếp.'}; return opts?.khongLuu ? {ok:true,chuanBi:{rong}} : rong }
  const id = viec.length && refs.length === viec.length && refs.every(r => viec.some(v => v.qid === r.qid)) ? str(old!.id) : crypto.randomUUID()
  // Lập sẵn (không lưu): đợt cũ còn nguyên bộ câu ⇒ ghi lại mã đợt ấy (`phienCu`) để lượt mở thật trả ĐÚNG đợt đó như đường thường, không tạo đợt mới.
  if (opts?.khongLuu) { await niemSom; return {ok:true,chuanBi:{refs,questions,goi7:tomTat,goiIds,...(id === str(old?.id) ? {phienCu:id} : {})}} }
  if (id !== str(old?.id)) {
    const rs=await env.DB.prepare(`INSERT INTO game_v2_session(id,sbd,json,created_at) SELECT ?,?,?,? WHERE ${sqlCacGoiConNhan7('?','?',sqlTenLopHs('h'))}`)
      .bind(id,sbd,JSON.stringify({mode:'adventure',created:now,hoa2:1,hocTap:1,goi7:1,questions:refs,tomTat7:tomTat,goiIds}),new Date(now).toISOString(),JSON.stringify(goiIds),sbd).run()
    if(!Number(rs.meta.changes))throw new Error('Danh sách bài vừa thay đổi. Em cập nhật lại trước khi học tiếp; bài đang làm vẫn được giữ.')
  }
  await niemSom
  return {ok:true,id,questions,goi7:tomTat}
  } catch (e) { await ghiDongCo.catch(() => {}); throw e } // lối ra lỗi giữa chừng: lô ghi của động cơ vẫn xong trước (như thứ tự cũ: ghi trong lúc lập)
}
/**
 * GÓI BÀI CẢ NGÀY (thầy 29/10 22:05 «tìm mọi cách, cách khác hoàn toàn để app hs load tức thì ở mọi thời điểm»; goi-ngay.ts): lập MỘT lần các chặng còn lại của hôm nay —
 * cùng kế hoạch, cùng thứ tự (`xepBai6`), cùng mọi cổng phát câu của `startGoi7` (câu chặn / nghi / vừa làm / khối / tự luận / chưa duyệt / dạng thầy giới hạn, bản làm lại
 * của câu sửa) — tối đa `soCau` câu, KHÔNG lưu phiên. Em đủ mức ⇒ phần «học thêm câu mới». Trả ref RIÊNG (máy chủ niêm phong trước khi gửi) + đề công khai (có tem hạn dài).
 */
export async function xayGoiNgay7(env: Env, sbd: string, now: number, soCau: number): Promise<{ refs: RefGoi7[]; questions: Record<string, unknown>[]; goi7: unknown; goiIds: string[]; ngay: string } | null> {
  const cuSom = damBaoGoi7(env).then(async () => {
    const old = await env.DB.prepare(`SELECT id,json FROM game_v2_session WHERE sbd=? AND created_at>=? AND json_extract(json,'$.hocTap')=1 ORDER BY created_at DESC LIMIT 1`).bind(sbd, new Date(now - 2 * 3600000).toISOString()).first<Row>()
    const answered = old ? await env.DB.prepare('SELECT qid FROM game_v2_attempt WHERE session=? AND sbd=? UNION SELECT qid FROM goi_bai_7_gap WHERE receipt LIKE ? AND sbd=?').bind(old.id, sbd, `${str(old.id)}|%`, sbd).all<{ qid: string }>() : { results: [] as { qid: string }[] }
    return { old, answered }
  }).catch(() => ({ old: null, answered: { results: [] as { qid: string }[] } }))
  const [lap, khoi, duo, { old, answered }] = await Promise.all([lapDungLai7(env, sbd, now).then((x) => x ?? lapGoi7(env, sbd, now)), docKhoiEm(env, sbd), duolingoChoEm(env, sbd, now).catch(() => false), cuSom])
  if (!lap || !lap.control.enabled) return null
  // Gói lập lúc em vừa xong chặng: máy em nạp lại Sảnh cùng lúc (0 s / 4 s) ⇒ Sảnh dùng lại đúng kế hoạch này (8 s, đối chiếu «đã làm» mới), không lập lần nữa.
  nhoLapSanh7(env, sbd, now, lap)
  const vuaLamGoc = (qid: string) => lap.vuaLam.has(qid) || lap.vuaLam.has(tachSongSinh(qid).goc)
  const saved = old ? json<{ questions?: RefGoi7[] }>(old.json) : null
  const done = new Set(answered.results.map(r => r.qid))
  const viec = Array.isArray(saved?.questions) ? saved.questions.filter(r => !done.has(r.qid) && !r.lamLaiCuoi && !vuaLamGoc(r.qid) && !lap.daLamTap.has(r.qid)).map(r => ({ ...r, vai: r.vai ?? 'on', huongDan: r.huongDan ?? false })) : []
  const satHan = !duo || lap.goi.some(g => g.quota > g.gapNgay.size && soNgayCon7(ngayVn7(now), g.han) <= 1)
  const ds = [...viec, ...xepBai6(lap.plan.viec, lap.pDung, { giuThuTu: satHan }), ...(lap.daLamNgay < lap.toiThieu ? lap.duPhong() : lap.hocThem())]
  const cauGoi = new Map(lap.goi.flatMap(g=>g.cau).map(c=>[c.qid,c] as const).reverse())
  const kiemHoiThay = new Set(lap.hs.hoiThayDenHan ?? [])
  const refs: RefGoi7[] = [], questions: Record<string,unknown>[] = [], riengQ: PrivateQuestion[] = [], da = new Set<string>()
  const ung = ds.filter((v, i) => ds.findIndex((w) => w.qid === v.qid) === i).map(v => {
    const oldRef = saved?.questions?.find(r => r.qid === v.qid && !done.has(r.qid) && !r.lamLaiCuoi)
    return { v, oldRef, meta: oldRef ?? lap.hs.meta.get(v.qid) ?? cauGoi.get(v.qid) }
  }).filter(x => x.meta && !lap.chan.has(x.v.qid) && !lap.chan.has(x.meta.group) && (x.oldRef || (!vuaLamGoc(x.v.qid) && !lap.daLamTap.has(x.v.qid))))
  for (let i = 0; i < ung.length && refs.length < soCau;) {
    const lo = ung.slice(i, i + soCau - refs.length + 4); i += lo.length
    const daDoc = (await Promise.all(lo.map(x => currentQuestion(env, x.meta!).then(q => ({ ...x, q }), () => null)))).filter((x): x is NonNullable<typeof x> => !!x)
    const quaKhoi = new Set(await chanKhacKhoiEm(env,'goi7',{sbd,khoiEm:khoi},daDoc.map(x => x.q),{nghiSan:lap.nghi}))
    for (const x of daDoc) {
      if (refs.length >= soCau) break
      const v = x.v, oldRef = x.oldRef
      let q: PrivateQuestion = x.q
      if (!quaKhoi.has(q) || laCauTuLuan(q) || !q.reviewed || lap.control.types.length && (!q.dang || !lap.control.types.includes(q.dang))) continue
      let lamLai: LamLaiRef | undefined
      if (oldRef) q = apXaoTheoRef(q, oldRef)
      else if (v.vai === 'sua') {
        const m = lap.hs.meta.get(q.qid)
        if (m) { const y = (await apLamLaiKhac(env, lap.hs, [{ q, m }], { sbd, nowMs: now, keHoach: lap.plan.viec.map(w => w.qid) }, new Set([...lap.chan, ...refs.map(r => r.qid)])))[0]; if (y) { q = y.q; lamLai = y.lamLai; const ss = tachSongSinh(q.qid); if (ss.songSinh !== null) lamLai = { ...lamLai, tc: ss.goc } } }
      }
      if (!oldRef && q.qid !== v.qid && vuaLamGoc(q.qid)) continue
      if (da.has(q.qid)) continue
      da.add(q.qid)
      const ref: RefGoi7 = { ...oldRef, ...lamLai, qid: q.qid, maDe: q.maDe, version: q.version, group: q.group, novel: lap.hs.tt.get(q.qid)?.laMoi ?? true,
        role: v.vai === 'moi' ? 'cau_moi' : 'on_lai', vai: v.vai, huongDan: v.huongDan,
        ...(kiemHoiThay.has(q.qid) || kiemHoiThay.has(tachSongSinh(lamLai?.tc ?? oldRef?.tc ?? q.qid).goc) ? { hoiThayKiem: true as const } : {}) }
      refs.push(ref); riengQ.push(q)
      questions.push({ ...publicQuestion(q), ...(ref.goiY ? { goiY: ref.goiY } : {}), vaiGoi7: v.vai, huongDan7: v.huongDan, coGoi7: lap.goi.some(g => g.cau.some(c => c.qid === q.qid && c.version === q.version)) })
    }
  }
  await ganNiemChoCau(env, sbd, questions, riengQ, true, now, HAN_NIEM_CHUAN_BI_MS) // tem hạn DÀI — máy em không dùng trực tiếp; làm mới lúc mở phiên (goi-ngay.ts)
  return { refs, questions, goi7: tomTatGoi7(lap, now), goiIds: lap.goi.map(g => g.id), ngay: ngayVn7(now) }
}

export interface RefGoi7 extends LamLaiRef { qid:string; maDe:string; version:string; group:string; novel:boolean; role:string; vai:ViecGoi7['vai']; huongDan:boolean; goiY?:unknown; hoiThayKiem?:true
  /** 26/10: câu làm lại cuối chặng (câu anh em của câu em vừa sai) — luôn có hỗ trợ, không tính đóng lỗi, không mở thành chặng mới. */
  lamLaiCuoi?:true; lamLaiCua?:string }

/** Em chọn "Chưa tự làm được" là nộp yêu cầu học có hỗ trợ, không phải một câu làm đúng/sai. */
export async function gapHuongDan7(env: Env,sbd: string,b: Row,now: number) {
  if (b.chuaTuLam !== true) throw new Error('Em chọn cách học từng bước trước khi xem phần chữa.')
  const row = await env.DB.prepare('SELECT json FROM game_v2_session WHERE id=? AND sbd=?').bind(str(b.session),sbd).first<{json:string}>()
  if (!row) throw new Error('Không tìm thấy đợt học của em.')
  const s = json<{goi7?:number;created:number;questions:RefGoi7[]}>(row.json), ref = s.questions.find(q=>q.qid===b.qid)
  if (!s.goi7 || !ref || now-s.created>2*3600000) throw new Error('Đợt học đã hết hạn. Em mở đợt mới.')
  const [q,blocked,btvn,control,goi] = await Promise.all([currentQuestion(env,ref),protectedQuestions(env),docCauBtvnChuaNop(env,sbd),readGameScope(env,sbd),docGoiCuaEm7(env,sbd,now)])
  if (!control.enabled || blocked.has(q.qid) || blocked.has(q.group) || btvn.has(q.qid) || control.blocked.includes(q.qid) || control.types.length && (!q.dang || !control.types.includes(q.dang))) throw new Error('Câu này hiện chưa mở phần chữa. Em chuyển sang câu khác.')
  let gs: {id:string}[] = goi.filter(g=>g.cau.some(c=>c.qid===q.qid && c.version===q.version))
  if(!gs.length) {
    // Chỉ phần chữa của ref thuộc phiên gốc đã xác thực ở trên; không cho bớt em biến thành mất bài đang học.
    gs=(await env.DB.prepare(`SELECT g.id FROM goi_bai_7 g JOIN goi_bai_7_em e ON e.goi_id=g.id AND e.sbd=?
      JOIN goi_bai_7_cau c ON c.goi_id=g.id AND c.qid=? AND c.version=?`).bind(sbd,q.qid,q.version).all<{id:string}>()).results
  }
  if (!gs.length || !q.reviewed || laCauTuLuan(q) || !(await chanKhacKhoiEm(env,'goi7-chua',sbd,[q])).length) throw new Error('Câu không thuộc bài được giao cho em.')
  const chua = await env.DB.prepare('SELECT loi_go FROM goi_bai_7_chua WHERE qid=? AND version=? AND goi_id IN (SELECT value FROM json_each(?)) LIMIT 1').bind(q.qid,q.version,JSON.stringify(gs.map(g=>g.id))).first<{loi_go:string}>()
  const solution = chua?.loi_go && chua.loi_go!=='@loi-giai-goc' ? chua.loi_go : q.solution
  // LỖI 27/10 (vòng «Mục tiêu ngày» đứng 1/16): câu học cách giải không đi qua `answer` ⇒ chặng có nó không bao giờ «xong bài». Nay câu này vào `$.nt` của
  // phiên (có hỗ trợ, KHÔNG được tính — 0 nguyên tử, luật thưởng giữ nguyên) và nếu là câu cuối thì ghi `thuong_bai_xong` + đọc mục tiêu ngày CÙNG lô (0 vòng chờ thêm).
  const tt = tinhThuongHocCachGiai(s as unknown as PhienNt, q.qid, q, now)
  const ltt = tt ? lenhThuongTraLoi(env,{sbd,phien:str(b.session),receipt:str(b.session),ngay:ngayVnTt(now),luc:new Date(now).toISOString(),nowMs:now,ra:tt,gac:'EXISTS (SELECT 1 FROM game_v2_session WHERE id = ?)'}) : null
  // Phần thưởng lỗi (vd. bảng chưa có) ⇒ chạy lại lô KHÔNG có nó — thưởng không bao giờ làm hỏng lệnh học cách giải.
  const chayLo = async (ds: D1PreparedStatement[]): Promise<Record<string,unknown>> => {
    if (!ltt) { await env.DB.batch(ds); return {} }
    try { const kq = await env.DB.batch([...ds, ...ltt.lenh]); const mt = tt?.ketBai ? ltt.mucTieuTu(kq) : null; return tt?.ketBai ? { ketBai: { ...tt.ketBai, ...(mt ? { mucTieu: mt } : {}) } } : {} }
    catch { await env.DB.batch(ds); return {} }
  }
  if (!solution || typeof solution==='string' && !solution.trim()) {
    // Chỉ chứng nhận em đã gặp câu và cần thầy, không phát đáp án hay ghi đã hiểu.
    const them = await chayLo(gs.map(g=>env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)').bind(`${str(b.session)}|${q.qid}|${g.id}`,g.id,sbd,q.qid,q.version,'cho_thay',new Date(now).toISOString())))
    return {ok:true,choThay:true,correct:false,...them}
  }
  // Sau khi phần chữa đã mở, máy chủ buộc mọi lần nộp trong phiên này là có hỗ trợ.
  ref.goiY={cotLoi:'Đã học phần chữa'}
  const them = await chayLo([
    env.DB.prepare("UPDATE game_v2_session SET json=json_set(json,? ,json(?)) WHERE id=? AND sbd=? AND json_extract(json,?)=?").bind(`$.questions[${s.questions.indexOf(ref)}].goiY`,JSON.stringify(ref.goiY),str(b.session),sbd,`$.questions[${s.questions.indexOf(ref)}].qid`,q.qid),
    ...gs.map(g=>env.DB.prepare('INSERT OR IGNORE INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)').bind(`${str(b.session)}|${q.qid}|${g.id}`,g.id,sbd,q.qid,q.version,'co_ho_tro',new Date(now).toISOString())),
    env.DB.prepare('INSERT OR IGNORE INTO loi_giai_hoi(sbd,qid,luc) VALUES(?,?,?)').bind(sbd,q.qid,new Date(now).toISOString()),
  ])
  return {ok:true,correct:false,answer:q.correct,solution,solutionImages:q.hinhAnh.filter(h=>h.viTri==='sau_loi_giai'),hocCoHoTro:true,...them}
}
