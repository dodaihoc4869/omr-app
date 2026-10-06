import { docDongLop, gopDocD1 } from './doc-d1-theo-luot'
// THUẬT TOÁN 2.0 — LỚP D1 (đọc chiến dịch, sổ sự kiện; chốt kế hoạch ngày; số liệu Sảnh; Rương Bát Linh).
// Lõi thuần ở `srs2-loi.ts`. Công tắc `cau_hinh.game_hoa_2` (mặc định TẮT ⇒ mọi đường cũ giữ nguyên):
//   {"bat":true}                         ⇒ toàn trung tâm
//   {"bat":true,"lop":["12A1"]}          ⇒ chỉ các lớp này
//   {"bat":true,"sbd":["12001","12002"]} ⇒ chỉ các em này (chạy thử)
import { docNhipKenh, docThamSoEm, onVaoDaoRieng, tiLeNoRieng } from './ca-nhan-hoa-v2'
import { docThamSo } from './tu-hoan-thien'
import { apLuatChung, chonSongSinh, docBoTroLoi, docMocDocLoiGiai, docQidSaiV2 } from './hang-chua-loi'
import { canThanTu, nhanMocDuyTri } from './omni-can-than'
import { cacQidSongSinh, CHO_SONG_SINH, tachSongSinh, type KetQuaLoi } from './loi-hoc-luat'
import { laCuaSoLoi, lanLamTuDongTc, sqlQidHoacTc, SQL_TC, tiepBanKhacMoi } from './lam-lai-so'
import { songSinhDuDuLieu, type BoTro } from './cau-bo-tro'
import { docChuoiNgayHoc } from './chuoi-ngay-hoc'
import type { D1PreparedStatement, D1Result, Env } from './kieu'
import { docCauHinhDem } from './cau-hinh-dem'
import { chanMetaKhacKhoi, docCauNghiDem, docKhoiEmCong } from './chan-khac-khoi'
import { DemTTL } from './dem-chung'
import { chayDdlMotLan } from './ddl-mot-lan'
import {
  lapKeHoachNgay, laNo, nhanNo, khoiLuongCan, TRAN_NGAY, type NguonNhan, tranHuyetChienTheo, phatLaiCau, canGoiY, moDuocRuong, tiLeChienDich, ngayThanhThaoSomNhat, soNgayConLai,
  coLoThuSucThem, congNgay,
  gopThongKeDang, tinhHangTheoDang, soNgayGiua, HANG_MUC_DO, NGAY_DEM, phanLoaiDanXen,
  type CauSrs, type HangEm, type TuyChonKeHoach, type HoSoDangTho, type LanLam, type TrangThaiCau, type Phan,
} from './srs2-loi'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { protectedQuestions } from './game-v2-bank'
import { docCauTuJson, jsonLaTuLuan, laCauTuLuan } from './cam-tu-luan'
// OMNI 3 (05/10) — mọi hành vi mới CHỈ khi `omniBat(env, sbd)`; cờ tắt ⇒ mọi đường dưới đây y hệt trước (khoá: tests/omni-3-ke-hoach-co-tat.test.ts).
import type { PhamViLop } from './bai-da-day'
import type { ThuMuc } from './kho-thu-muc'
import { dangDaVung, theLucCho, tiLeOnBaiCu, trongSoCacCau } from './omni-ke-hoach'
import { KHOA_THE_LUC_LOP, SQL_LA_LAN_LAM, THAM_SO_OMNI, type QCau } from './omni-kieu'
// Mô-đun các làn khác (omni-d1, bai-da-day, kho-thu-muc, srs2-gv) nạp LƯỜI bằng import động: chúng import ngược srs2-d1 (srs2-gv → bi-a → srs2-game →
// omni-game → srs2-d1) — import tĩnh tạo vòng khiến `vi.mock(..., importOriginal)` của test làn khác nhận nhầm bản gốc; cờ tắt cũng không nạp gì thêm.
const lanOmniD1 = () => import('./omni-d1')
const lanBaiDaDay = () => import('./bai-da-day')
const lanThuMuc = () => import('./kho-thu-muc')
const lanGv = () => import('./srs2-gv')
/** OMNI áp cho em? (omni-d1 `omniBat`); lỗi ⇒ false. */
const omniBatEm = (env: Env, sbd: string): Promise<boolean> => lanOmniD1().then((m) => m.omniBat(env, sbd)).catch(() => false)

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const GIO_VN_MS = 7 * 3_600_000
export const ngayVnCua = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)
const parseMang = (v: unknown): string[] => {
  try {
    const a = JSON.parse(str(v) || '[]') as unknown
    return Array.isArray(a) ? a.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}

// ---------------------------------------------------------------- công tắc
export interface CoHoa2 { bat: boolean; lop: string[]; sbd: string[] }
export const KHOA_CO_HOA2 = 'game_hoa_2'
export function docCoHoa2Tu(giaTri: unknown): CoHoa2 {
  try {
    const o = typeof giaTri === 'string' ? (JSON.parse(giaTri) as Row) : ((giaTri ?? {}) as Row)
    return { bat: o.bat === true || o.bat === 1 || o.bat === '1', lop: parseMang(JSON.stringify(o.lop ?? [])), sbd: parseMang(JSON.stringify(o.sbd ?? [])) }
  } catch {
    return { bat: false, lop: [], sbd: [] }
  }
}
export async function docCoHoa2(env: Env): Promise<CoHoa2> {
  // Đệm 15 s trong isolate (cau-hinh-dem.ts): Sảnh/start/Đoàn/Bi-a đọc cờ này nhiều lần mỗi request.
  return docCoHoa2Tu(await docCauHinhDem(env, KHOA_CO_HOA2))
}
/** Em này đang ở chế độ Game Hóa 2.0? Lỗi đọc ⇒ `false` (đường cũ). */
export async function cheDo2(env: Env, sbd: string): Promise<boolean> {
  const co = await docCoHoa2(env)
  if (!co.bat) return false
  if (co.sbd.includes(sbd)) return true
  if (!co.lop.length && !co.sbd.length) return true
  if (!co.lop.length) return false
  const r = await docDongLop(env.DB, sbd).catch(() => null) // nhớ theo lượt (tối ưu 05/10): Sảnh/Bi-a/Đoàn hỏi lớp em nhiều lần mỗi request
  return !!r && co.lop.includes(str(r.lop))
}

// ---------------------------------------------------------------- chiến dịch
export interface ChienDich {
  id: string
  ten: string
  lop: string | null
  sbd: string[]
  maDe: string[]
  qids: string[]
  hanNop: string
  theLucNgay: number
  huyetChien: boolean
  maCa: string | null
  taoLuc: string
  trangThai: 'dang_chay' | 'da_dong' | 'da_huy'
  /** NGÀY BẮT ĐẦU (thầy 28/09, `YYYY-MM-DD` giờ VN). Không đặt ⇒ ngày tạo (hành vi cũ). */
  batDau: string
  /**
   * MỐC BẮT ĐẦU (ISO) = max(`tao_luc`, 00:00 VN của ngày bắt đầu) — thay `taoLuc` ở MỌI chỗ tính (số ngày, sức chứa, lần làm được tính,
   * nhịp lớp, thống kê). Không đặt ngày bắt đầu ⇒ đúng bằng `taoLuc`.
   */
  mocBatDau: string
  /**
   * RẢI ĐỀU CÂU MỚI THEO NGÀY (thầy chốt 30/09): bật ⇒ câu mới/ngày dừng đúng quota, lượt dư để ôn (srs2-loi `TuyChonKeHoach.raiDeu`).
   * Lưu ở bảng phụ `chien_dich_tuy_chon` (chỉ-thêm, tạo lúc chạy); KHÔNG có dòng (null) ⇒ BẬT — chiến dịch cũ đang chạy cũng bật.
   */
  raiDeu: boolean
  /**
   * Cờ rải đều CHƯA từng được thầy đặt (không có dòng ở `chien_dich_tuy_chon` — chiến dịch giao trước khi có công tắc): máy tự BẬT theo mặc định.
   * Phản biện vòng 2 #110: màn thầy hiện "Bật (mặc định)" để thầy biết cờ này không phải thầy tự bật. `tao` luôn ghi dòng ⇒ chiến dịch mới không mang nhãn này.
   */
  raiDeuMacDinh: boolean
}
/** 00:00 giờ VN của một ngày `YYYY-MM-DD`, dạng ISO (UTC) để so chuỗi với `tao_luc`/`luc`. */
export const dauNgayVn = (ngay: string): string => new Date(Date.parse(`${ngay}T00:00:00Z`) - GIO_VN_MS).toISOString()
const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/
/** Ngày bắt đầu + mốc bắt đầu từ `tao_luc` và `bat_dau` (có thể vắng). */
export function batDauCua(taoLuc: string, batDau: unknown): { batDau: string; mocBatDau: string } {
  const ms = Date.parse(taoLuc)
  const ngayTao = Number.isFinite(ms) ? ngayVnCua(ms) : taoLuc.slice(0, 10)
  const bd = str(batDau)
  if (!NGAY_RE.test(bd) || bd <= ngayTao) return { batDau: ngayTao, mocBatDau: taoLuc }
  const moc = dauNgayVn(bd)
  return { batDau: bd, mocBatDau: moc > taoLuc ? moc : taoLuc }
}
export const docChienDichTuDong = (r: Row): ChienDich => ({
  ...batDauCua(str(r.tao_luc), r.bat_dau),
  id: str(r.id), ten: str(r.ten), lop: r.lop == null ? null : str(r.lop), sbd: parseMang(r.sbd_json), maDe: parseMang(r.ma_de_json), qids: parseMang(r.qid_json),
  hanNop: str(r.han_nop), theLucNgay: Number(r.the_luc_ngay) || 40, huyetChien: Number(r.huyet_chien ?? 1) !== 0, maCa: r.ma_ca == null ? null : str(r.ma_ca),
  taoLuc: str(r.tao_luc), trangThai: (['dang_chay', 'da_dong', 'da_huy'].includes(str(r.trang_thai)) ? str(r.trang_thai) : 'dang_chay') as ChienDich['trangThai'],
  raiDeu: r.rai_deu == null ? true : Number(r.rai_deu) !== 0,
  raiDeuMacDinh: r.rai_deu == null,
})

// ---------------------------------------------------------------- ngày bắt đầu (thầy 28/09)
/** Bảng phụ tạo lúc chạy (CI không chạy migration; KHÔNG ALTER `chien_dich`). Không có dòng ⇒ bắt đầu = ngày tạo. */
export const LENH_TAO_BANG_BAT_DAU = 'CREATE TABLE IF NOT EXISTS chien_dich_bat_dau (id TEXT PRIMARY KEY, bat_dau TEXT NOT NULL)'
export async function ghiBatDau(env: Env, id: string, batDau: string): Promise<void> {
  await chayDdlMotLan(env, 'chien_dich_bat_dau', [LENH_TAO_BANG_BAT_DAU]) // một lần mỗi isolate (ddl-mot-lan.ts)
  await env.DB.prepare('INSERT INTO chien_dich_bat_dau (id, bat_dau) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET bat_dau = excluded.bat_dau').bind(id, batDau).run()
  xoaDemChienDich()
}
/** Ngày bắt đầu đã đặt của các chiến dịch. Bảng chưa có / lỗi đọc ⇒ rỗng (hành vi cũ). */
export async function docBatDauMap(env: Env, ids: readonly string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map()
  const r = await env.DB.prepare('SELECT id, bat_dau FROM chien_dich_bat_dau WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(ids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.id), str(x.bat_dau)]))
}
// ---------------------------------------------------------------- rải đều câu mới (thầy 30/09)
/** Bảng phụ tạo lúc chạy (như `chien_dich_bat_dau`; KHÔNG ALTER `chien_dich`). Không có dòng ⇒ rải đều BẬT. */
export const LENH_TAO_BANG_TUY_CHON = 'CREATE TABLE IF NOT EXISTS chien_dich_tuy_chon (id TEXT PRIMARY KEY, rai_deu INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)'
export async function ghiRaiDeu(env: Env, id: string, bat: boolean, nowMs: number): Promise<void> {
  await chayDdlMotLan(env, 'chien_dich_tuy_chon', [LENH_TAO_BANG_TUY_CHON])
  await env.DB.prepare('INSERT INTO chien_dich_tuy_chon (id, rai_deu, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET rai_deu = excluded.rai_deu, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(id, bat ? 1 : 0, new Date(nowMs).toISOString()).run()
  xoaDemChienDich()
}
/** Cờ rải đều đã đặt của các chiến dịch (0/1). Bảng chưa có / lỗi đọc ⇒ rỗng (= bật). */
export async function docRaiDeuMap(env: Env, ids: readonly string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map()
  const r = await env.DB.prepare('SELECT id, rai_deu FROM chien_dich_tuy_chon WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(ids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.id), Number(x.rai_deu)]))
}
/** Đọc dòng `chien_dich` kèm ngày bắt đầu + cờ rải đều (hai truy vấn phụ song song cho cả danh sách). */
export async function docChienDichKemBatDau(env: Env, rows: readonly Row[]): Promise<ChienDich[]> {
  const ids = rows.map((r) => str(r.id))
  const [bd, rd] = await Promise.all([docBatDauMap(env, ids), docRaiDeuMap(env, ids)])
  return rows.map((r) => docChienDichTuDong({ ...r, bat_dau: bd.get(str(r.id)) ?? null, rai_deu: rd.get(str(r.id)) ?? null }))
}
/** Chiến dịch chưa tới ngày bắt đầu? */
export const chuaBatDau = (cd: ChienDich, homNay: string): boolean => cd.batDau > homNay

/** Mọi chiến dịch (chưa huỷ) có em này, mới giao trước. */
/**
 * CAO ĐIỂM 20h–24h (29/09): danh sách chiến dịch chưa huỷ + ngày bắt đầu là dữ liệu CHUNG mọi em (bảng nhỏ) nhưng trước đây MỖI lệnh Sảnh / start / Đoàn của
 * MỖI em quét lại cả bảng và bung `sbd_json` của mọi chiến dịch (json_each) để lọc một em. Nay đọc CẢ danh sách một lần, đệm 15 s trong isolate (lượt đọc đang bay được
 * đợi bằng timer riêng, KHÔNG dùng chung Promise I/O), lọc em bằng tập sbd dựng sẵn. Thầy tạo / đóng / huỷ / sửa chiến dịch hay đặt ngày bắt đầu ⇒ `xoaDemChienDich()` ngay (isolate ấy); isolate khác trễ ≤ 15 s.
 * Lỗi đọc ⇒ rỗng như cũ và KHÔNG đệm.
 */
type DsChienDich = { ds: { row: Row; sbd: Set<string> }[]; bd: Map<string, string>; rd: Map<string, number> }
type OChienDich = { ds: DsChienDich | null; dangDoc: boolean }
const demChienDich = new DemTTL<OChienDich>(15_000, 2)
export function xoaDemChienDich(): void { demChienDich.xoa() }
async function docMoiChienDich(env: Env): Promise<DsChienDich> {
  const co = demChienDich.doc('ds', Date.now())
  for (let n = 0; co?.dangDoc && demChienDich.doc('ds', Date.now()) === co && n < 15; n++) await new Promise<void>(xong => setTimeout(xong, 16))
  const daXong = demChienDich.doc('ds', Date.now())
  if (daXong?.ds) return daXong.ds
  const o: OChienDich = { ds: null, dangDoc: true }
  demChienDich.ghi('ds', Date.now(), o)
  let loi = false
  // Không JOIN: bảng `chien_dich_bat_dau` tạo lúc chạy, có thể chưa có ⇒ lỗi riêng câu phụ, danh sách vẫn đúng (hành vi cũ).
  try {
    const giaTri = await Promise.all([
      env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' ORDER BY tao_luc DESC").all<Row>().catch(() => { loi = true; return { results: [] as Row[] } }),
      // bảng tạo lúc chạy: chưa có (chưa ai đặt ngày bắt đầu) là BÌNH THƯỜNG ⇒ rỗng, vẫn đệm (`ghiBatDau` xoá đệm khi tạo)
      env.DB.prepare("SELECT id, bat_dau FROM chien_dich_bat_dau WHERE id IN (SELECT id FROM chien_dich WHERE trang_thai <> 'da_huy')").all<Row>().catch(() => ({ results: [] as Row[] })),
      // rải đều (30/09): bảng tạo lúc chạy, chưa có = mọi chiến dịch BẬT ⇒ rỗng (`ghiRaiDeu` xoá đệm khi đổi)
      env.DB.prepare("SELECT id, rai_deu FROM chien_dich_tuy_chon WHERE id IN (SELECT id FROM chien_dich WHERE trang_thai <> 'da_huy')").all<Row>().catch(() => ({ results: [] as Row[] })),
    ]).then(([r, bd, rd]) => {
      if (loi && demChienDich.doc('ds', Date.now()) === o) demChienDich.xoaKhoa('ds')
      return {
        // đúng ngữ nghĩa `json_each(sbd_json) … value = ?`: chỉ phần tử CHUỖI trùng khớp tuyệt đối
        ds: (r.results ?? []).map((row) => { let a: unknown = []; try { a = JSON.parse(str(row.sbd_json) || '[]') } catch { /* sbd_json hỏng ⇒ không em nào */ } return { row, sbd: new Set((Array.isArray(a) ? a : []).filter((x): x is string => typeof x === 'string')) } }),
        bd: new Map((bd.results ?? []).map((x) => [str(x.id), str(x.bat_dau)])),
        rd: new Map((rd.results ?? []).map((x) => [str(x.id), Number(x.rai_deu)])),
      }
    })
    o.ds = loi ? null : giaTri
    return giaTri
  } finally { o.dangDoc = false; if (!o.ds && demChienDich.doc('ds', Date.now()) === o) demChienDich.xoaKhoa('ds') }
}
export async function docChienDichCuaEm(env: Env, sbd: string): Promise<ChienDich[]> {
  const { ds, bd, rd } = await docMoiChienDich(env)
  return ds.filter((x) => x.sbd.has(sbd)).map((x) => docChienDichTuDong({ ...x.row, bat_dau: bd.get(str(x.row.id)) ?? null, rai_deu: rd.get(str(x.row.id)) ?? null }))
}
/**
 * Dòng `chien_dich` THÔ (chưa huỷ, mới giao trước) của các chiến dịch có em — từ CÙNG danh sách đệm 15 s mà `docChienDichCuaEm` / `docHoSo2` vừa đọc ⇒ không thêm lượt D1
 * (trước: "Câu đã làm" đọc lại bảng `chien_dich` bằng một câu `json_each(sbd_json)` riêng, nối tiếp SAU hồ sơ — một đợt D1 thừa). Cùng ngữ nghĩa câu cũ
 * (`trang_thai <> 'da_huy'`, em là phần tử CHUỖI của `sbd_json`, `ORDER BY tao_luc DESC`). Lỗi đọc ⇒ rỗng như câu cũ (không bao giờ ném lỗi).
 */
export async function docChienDichThoCuaEm(env: Env, sbd: string): Promise<Row[]> {
  try {
    const { ds } = await docMoiChienDich(env)
    return ds.filter((x) => x.sbd.has(sbd)).map((x) => x.row)
  } catch {
    return []
  }
}
/**
 * SỬA CHIẾN DỊCH (thầy 28/09, `srs2-sua.ts`): em được THÊM vào chiến dịch đang chạy chỉ tính lần làm TỪ LÚC ĐƯỢC THÊM (như em giao từ đầu).
 * Bảng `chien_dich_em` (tạo lúc chạy, chỉ-thêm) có thể chưa có ⇒ rỗng: mốc = lúc giao chiến dịch như cũ.
 */
export async function docMocThemCuaEm(env: Env, sbd: string): Promise<Map<string, string>> {
  const r = await env.DB.prepare('SELECT chien_dich_id, them_luc FROM chien_dich_em WHERE sbd = ? AND them_luc IS NOT NULL').bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.chien_dich_id), str(x.them_luc)]))
}
/** Mốc được thêm của từng em trong MỘT chiến dịch (em giao từ đầu không có mốc). */
export async function docMocThemCaLop(env: Env, chienDichId: string): Promise<Map<string, string>> {
  const r = await env.DB.prepare('SELECT sbd, them_luc FROM chien_dich_em WHERE chien_dich_id = ? AND them_luc IS NOT NULL').bind(chienDichId).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.sbd), str(x.them_luc)]))
}
/** Mốc tính lần làm của em với một chiến dịch: lúc giao, hoặc lúc em được thêm nếu muộn hơn. */
export const mocTinhCua = (taoLuc: string, themLuc: string | undefined): string => (themLuc && themLuc > taoLuc ? themLuc : taoLuc)

/** Chiến dịch đang chạy của em (giao gần nhất, còn hạn, ĐÃ tới ngày bắt đầu). */
export const chienDichDangChay = (ds: readonly ChienDich[], homNay: string): ChienDich | null => ds.find((c) => c.trangThai === 'dang_chay' && c.hanNop >= homNay && !chuaBatDau(c, homNay)) ?? null
/**
 * OMNI 3 — NHIỀU BÀI SONG SONG: MỌI chiến dịch đang chạy của em (còn hạn, đã tới ngày bắt đầu), HẠN GẦN TRƯỚC (EDF); hoà hạn ⇒ bắt đầu sớm trước, rồi giao
 * gần nhất trước (thứ tự `ds`). Phần tử đầu là "chiến dịch hạn gần nhất" (HoSo2.chienDich khi OMNI bật).
 */
export const chienDichDangChayHet = (ds: readonly ChienDich[], homNay: string): ChienDich[] =>
  ds.map((c, i) => [c, i] as const)
    .filter(([c]) => c.trangThai === 'dang_chay' && c.hanNop >= homNay && !chuaBatDau(c, homNay))
    .sort(([a, i], [b, j]) => (a.hanNop < b.hanNop ? -1 : a.hanNop > b.hanNop ? 1 : a.batDau < b.batDau ? -1 : a.batDau > b.batDau ? 1 : i - j))
    .map(([c]) => c)
/** Chiến dịch SẮP bắt đầu gần nhất của em (chưa tới ngày bắt đầu) — Sảnh HS báo ngày, KHÔNG phát câu. */
export const chienDichSapBatDau = (ds: readonly ChienDich[], homNay: string): ChienDich | null =>
  ds.filter((c) => c.trangThai === 'dang_chay' && c.hanNop >= homNay && chuaBatDau(c, homNay)).sort((a, b) => (a.batDau < b.batDau ? -1 : a.batDau > b.batDau ? 1 : 0))[0] ?? null

// ---------------------------------------------------------------- câu và sổ
/** `sao`: số sao "cần chữa" của câu trong kho (`canChua.sao` → `sao` trong json câu game): 2 = vận dụng cao đánh dấu 2 sao. */
export interface MetaCau {
  qid: string; maDe: string; version: string; group: string; phan: Phan; mucDo: string | null; dang: string | null; tenDang: string | null; sao: number
  /**
   * CÂU TỰ LUẬN (luật chặt #107, 30/09) — MỘT chỗ dùng chung cho kế hoạch ngày / rương / Sảnh / Bi-a: ĐÚNG phép `laCauTuLuan` mà `napCau` dùng khi phát câu,
   * chạy trên CHÍNH câu trong chỉ mục (bỏ ảnh/lời giải, ảnh phương án thay bằng cờ có/không — `tuLuanTuMeta`). Câu tự luận KHÔNG vào kế hoạch,
   * không đếm vào thể lực/rương (sửa lỗi 30/09 "Chưa tải được câu hôm nay" + rương kẹt 48/49).
   */
  tuLuan: boolean
  /** Khối ghi THẲNG trong JSON câu (`lop`/`khoi`) — một nguồn khối của câu khi mã tờ không mang khối (luật thầy 05/10, `khoi-cau.ts`). Vắng ⇒ không có. */
  lop?: string | null
}
/**
 * Phần SQL đọc câu RÚT GỌN cho `tuLuanTuMeta` (bảng `game_v2_question`, cột `json`): câu bỏ trường nặng (ảnh, lời giải, bảng), ảnh phương án/ý thay bằng
 * mảng 0/1 cùng thứ tự, hình kèm câu thay bằng `{viTri, src: 'x'|''}`. Đủ MỌI trường `lyDoTuLuan` đọc ⇒ kết quả trùng `laCauTuLuan(câu đầy đủ)`
 * (phản biện #108: trước đây độn phương án bằng 'x' theo số lượng ⇒ phương án rỗng chữ lọt, kế hoạch đếm mà Đảo bỏ ⇒ rương vẫn kẹt).
 * CHÚ Ý: trong `json_each(...)` phải ghi `game_v2_question.json` — tên trần `json` bị hiểu là cột ẩn `json` của chính `json_each` (ra mảng rỗng).
 */
/** SQL: giá trị JSON (kiểu `t`, giá trị `v` của `json_each`) có "thật" theo JS `Boolean` không (null/false/''/0 ⇒ 0, còn lại — kể cả mảng/đối tượng rỗng — ⇒ 1). */
const THAT_JS = (v: string, t: string) => `(CASE ${t} WHEN 'null' THEN 0 WHEN 'false' THEN 0 WHEN 'text' THEN ${v} <> '' WHEN 'integer' THEN ${v} <> 0 WHEN 'real' THEN ${v} <> 0 ELSE 1 END)`
/** SQL: cờ 0/1 của MỘT phần tử mảng ảnh phương án/ý đúng như `CO_ANH` (src/lib/cau-tu-luan.ts): mảng ⇒ có phần tử "thật"; còn lại ⇒ `Boolean`. */
const CO_ANH_SQL = `CASE WHEN e.type = 'array' THEN EXISTS (SELECT 1 FROM json_each(e.value) f WHERE ${THAT_JS('f.value', 'f.type')}) ELSE ${THAT_JS('e.value', 'e.type')} END`
/** SQL: đường dẫn của khoá đầu tiên CÓ MẶT (kể cả JSON null) — đúng `lay(c, khoa1, khoa2)` (`!== undefined`). */
const KHOA_DAU = (a: string, b: string) => `(CASE WHEN json_type(game_v2_question.json,'$.${a}') IS NOT NULL THEN '$.${a}' ELSE '$.${b}' END)`
/** SQL: mảng cờ ảnh (chỉ khi giá trị là MẢNG — JS `Array.isArray(anh) ? anh : []`; chuỗi/đối tượng đơn ⇒ không có cờ nào). */
const CO_ANH_MANG = (a: string, b: string) =>
  `(SELECT json_group_array(${CO_ANH_SQL}) FROM json_each(game_v2_question.json, ${KHOA_DAU(a, b)}) e WHERE json_type(game_v2_question.json, ${KHOA_DAU(a, b)}) = 'array')`
/** SQL: "thật" của khoá `k` trong đối tượng `e.value` (khoá vắng/null ⇒ NULL để COALESCE sang khoá kế — đúng `??`). */
const THAT_KHOA = (k: string) => `CASE WHEN COALESCE(json_type(e.value,'$.${k}'),'null') = 'null' THEN NULL ELSE ${THAT_JS(`json_extract(e.value,'$.${k}')`, `json_type(e.value,'$.${k}')`)} END`
const SQL_CAU_GON = `json_remove(json,'$.imageDataUrl','$.thanCauImg','$.solution','$.table','$.choiceImgs','$.ideaImgs','$.hinhAnh','$.hinh','$.kienThuc','$.anhLuaChon','$.anhY') AS gon,
        ${CO_ANH_MANG('choiceImgs', 'anhLuaChon')} AS anh_pa,
        ${CO_ANH_MANG('ideaImgs', 'anhY')} AS anh_y,
        (SELECT json_group_array(json_object('viTri', COALESCE(json_extract(e.value,'$.viTri'), json_extract(e.value,'$.vi_tri')),
            'src', CASE WHEN COALESCE(${THAT_KHOA('src')}, ${THAT_KHOA('url')}, ${THAT_KHOA('data')}, 0) THEN 'x' ELSE '' END))
          FROM json_each(game_v2_question.json, ${KHOA_DAU('hinh', 'hinhAnh')}) e
          WHERE e.type = 'object' AND json_type(game_v2_question.json, ${KHOA_DAU('hinh', 'hinhAnh')}) = 'array') AS hinh_gon`
const mangJson = (v: unknown): unknown[] => {
  try { const a = JSON.parse(typeof v === 'string' ? v : '[]') as unknown; return Array.isArray(a) ? a : [] } catch { return [] }
}
/** Cờ tự luận của một dòng đọc bằng `SQL_CAU_GON`: dựng lại câu (ảnh = cờ) rồi hỏi ĐÚNG `laCauTuLuan` như lúc phát câu. JSON không đọc được ⇒ tự luận (không phục vụ). */
export function tuLuanTuMeta(x: Row): boolean {
  const c = docCauTuJson(x.gon)
  if (!c) return true
  const anhPa = mangJson(x.anh_pa), anhY = mangJson(x.anh_y), hinh = mangJson(x.hinh_gon)
  return laCauTuLuan({ ...c, ...(anhPa.length ? { choiceImgs: anhPa } : {}), ...(anhY.length ? { ideaImgs: anhY } : {}), ...(hinh.length ? { hinhAnh: hinh } : {}) })
}
/**
 * Siêu dữ liệu câu (không đáp án xuống máy em, không lời giải). Câu có ở nhiều tờ: ưu tiên tờ thuộc `uuTienMaDe`.
 * 30/09: bỏ dòng JSON hỏng (`json_valid`) hoặc JSON không mang đúng `qid`/`version` của cột (khoá nạp `maDe|qid|version` ở `napDayDuMem` không khớp ⇒ câu ấy
 * KHÔNG nạp được ⇒ coi như đã rút khỏi kho). `maDe` không so: chỉ mục chỉ có một đường ghi (`lapChiMucTo`) nên luôn khớp cột.
 */
export async function docMetaCau(env: Env, qids: readonly string[], uuTienMaDe: readonly string[] = [], maDeCua?: Map<string, Set<string>>): Promise<Map<string, MetaCau>> {
  if (!qids.length) return new Map<string, MetaCau>()
  return metaCauTuDong(await docMetaCauTho(env, qids), uuTienMaDe, maDeCua)
}
/** Phần ĐỌC của `docMetaCau` (câu SQL không phụ thuộc tờ ưu tiên) — tách ra để đọc sớm (tối ưu 05/10). `qids` khác rỗng. */
function docMetaCauTho(env: Env, qids: readonly string[]): Promise<Row[]> {
  return env.DB.prepare(`SELECT qid, ma_de, version, content_group, dang, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do, json_extract(json,'$.tenDang') AS ten_dang, json_extract(json,'$.sao') AS sao, COALESCE(json_extract(json,'$.lop'), json_extract(json,'$.khoi')) AS lop_json,
        ${SQL_CAU_GON}, json_extract(json,'$.qid') AS j_qid, json_extract(json,'$.version') AS j_version
      FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) AND json_valid(json)`).bind(JSON.stringify([...new Set(qids)])).all<Row>().then((r) => r.results ?? [])
}
/** Phần DỰNG của `docMetaCau` từ các dòng đã đọc (thuần, đúng thứ tự dòng). */
function metaCauTuDong(rows: readonly Row[], uuTienMaDe: readonly string[], maDeCua?: Map<string, Set<string>>): Map<string, MetaCau> {
  const ra = new Map<string, MetaCau>()
  const uuTien = new Set(uuTienMaDe)
  for (const x of rows) {
    const qid = str(x.qid)
    if (str(x.j_qid) !== qid || str(x.j_version) !== str(x.version)) continue // JSON lệch cột ⇒ không nạp được ⇒ như đã rút
    // OMNI 3 (chỉ-thêm): gom MỌI tờ (mã gốc) chứa câu — lọc phạm vi xét "có tờ DẠY HỌC trong phạm vi" chứ không chỉ tờ meta chọn.
    if (maDeCua) { let s = maDeCua.get(qid); if (!s) { s = new Set(); maDeCua.set(qid, s) } s.add(str(x.ma_de)) }
    const cu = ra.get(qid)
    if (cu && (uuTien.has(cu.maDe) || !uuTien.has(str(x.ma_de)))) continue
    const phan = (['I', 'II', 'III'].includes(str(x.phan)) ? str(x.phan) : 'I') as Phan
    ra.set(qid, { qid, maDe: str(x.ma_de), version: str(x.version), group: str(x.content_group), phan, mucDo: x.muc_do == null ? null : str(x.muc_do), dang: x.dang == null ? null : str(x.dang), tenDang: x.ten_dang == null ? null : str(x.ten_dang), sao: Number(x.sao) || 0, tuLuan: tuLuanTuMeta(x), ...(x.lop_json != null ? { lop: str(x.lop_json) } : {}) })
  }
  return ra
}

/** Loại câu cho luật THÀNH THẠO LẦN ĐẦU (thầy chốt 28/09): phần, mức độ, số sao (lớn nhất nếu câu có ở nhiều tờ). */
export interface LoaiCau { sao: number; phan: Phan; mucDo: string | null }
export async function docLoaiCau(env: Env, qids: readonly string[]): Promise<Map<string, LoaiCau>> {
  const ra = new Map<string, LoaiCau>()
  if (!qids.length) return ra
  const r = await env.DB.prepare(`SELECT qid, MAX(COALESCE(CAST(json_extract(json,'$.sao') AS INTEGER), 0)) AS sao, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do
      FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) GROUP BY qid`)
    .bind(JSON.stringify([...new Set(qids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const phan = (['I', 'II', 'III'].includes(str(x.phan)) ? str(x.phan) : 'I') as Phan
    ra.set(str(x.qid), { sao: Number(x.sao) || 0, phan, mucDo: x.muc_do == null ? null : str(x.muc_do) })
  }
  return ra
}

/** Lần làm của em với các câu (mọi nguồn). Bỏ sự kiện CHE (ca chưa công bố); bỏ trống tính là sai; `assistance='assisted'` ⇒ có gợi ý. */
export async function docLanLam(env: Env, sbd: string, qids: readonly string[], tuLuc = ''): Promise<LanLam[]> {
  if (!qids.length) return []
  // Vòng học v2 (02/10): lần làm câu SONG SINH ("<gốc>~ss0..3") là lần làm của chính câu gốc (cùng cách giải, đổi số) ⇒ đọc kèm, quy về gốc.
  // 05/10 (lam-lai-so.ts): dòng CÂU ANH EM làm thay cho câu gốc (`raw_json.tc = gốc`) đọc kèm, coi là lượt song sinh của câu gốc.
  const goc = [...new Set(qids)]
  const ds = JSON.stringify(goc.flatMap(cacQidSongSinh)), dsGoc = JSON.stringify(goc)
  let rows: Row[]
  try {
    // OMNI 3: bỏ cả dòng "đọc lời giải trước khi làm" lẫn dòng LƯỚT (`SQL_LA_LAN_LAM`) — lướt không phải một lần làm (chỉ có khi OMNI bật lúc làm).
    rows = (await env.DB.prepare(sqlQidHoacTc('qid, ngay_vn, luc, ket_qua, assistance, visibility, nguon', 'sbd = ?1', `luc >= ?4 AND ${SQL_LA_LAN_LAM}`)).bind(sbd, ds, dsGoc, tuLuc).all<Row>()).results ?? []
  } catch {
    rows = (await env.DB.prepare(`SELECT qid, ngay_vn, luc, ket_qua, nguon FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?)) AND luc >= ?`).bind(sbd, ds, tuLuc).all<Row>()).results ?? []
  }
  const tap = new Set(goc)
  return rows.filter((x) => str(x.visibility) !== 'embargoed').flatMap((x) => lanLamTuDongTc(x, lanLamTuDong, tap))
}
/** Một dòng sổ → lần làm (kèm `nguon` — chỉ-thêm 29/09: `dau_gio` Đạt ⇒ thành thạo ngay). */
export const lanLamTuDong = (x: Row): LanLam => ({
  qid: str(x.qid).replace(/~ss\d+$/, ''), ...(/~ss\d+$/.test(str(x.qid)) ? { songSinh: true as const } : {}), ngay: str(x.ngay_vn), luc: str(x.luc), dung: Number(x.ket_qua) === 1, coGoiY: str(x.assistance) === 'assisted',
  ...(x.nguon != null && str(x.nguon) ? { nguon: str(x.nguon) } : {}),
})

/**
 * HỢP ĐỒNG với Kiểm tra đầu giờ (docs/so-no-2909/HOP-DONG.md): thầy tích "Thầy đã chữa" cho MỘT em + MỘT câu ⇒ ghi một mốc dạy lại
 * (cùng bảng `srs2_day_lai` của nút "Chữa xong"): đếm sai về 0, bỏ cắt tỉa, câu quay lại kế hoạch NGÀY HÔM SAU. Chỉ-thêm; ghi lại
 * cùng (em, câu, lúc) không thêm dòng. `luc` ISO — ghi SAU sự kiện sổ của cùng lần chấm (mốc ≥ lúc sự kiện).
 */
export async function ghiMocDayLai(env: Env, sbd: string, qid: string, luc: string, chienDichId: string | null = null): Promise<void> {
  if (!sbd || !qid || !luc) throw new Error('Thiếu em, câu hoặc thời điểm chữa.')
  await chayDdlMotLan(env, 'srs2_day_lai', [LENH_TAO_BANG_DAY_LAI])
  await env.DB.prepare('INSERT OR IGNORE INTO srs2_day_lai (sbd, qid, luc, chien_dich_id) VALUES (?,?,?,?)').bind(sbd, qid, luc, chienDichId).run()
}
/** Bảng mốc dạy lại (đã có từ migration-2709-game-hoa-2.sql) — tạo lúc chạy nếu thiếu, CHỈ-THÊM. */
export const LENH_TAO_BANG_DAY_LAI = 'CREATE TABLE IF NOT EXISTS srs2_day_lai (sbd TEXT NOT NULL, qid TEXT NOT NULL, luc TEXT NOT NULL, chien_dich_id TEXT, PRIMARY KEY (sbd, qid, luc))'

/** Thời điểm thầy bấm "Chữa xong" cho từng câu của em. */
export async function docMocDayLai(env: Env, sbd: string): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  const r = await env.DB.prepare('SELECT qid, luc FROM srs2_day_lai WHERE sbd = ?').bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const k = str(x.qid)
    ra.set(k, [...(ra.get(k) ?? []), str(x.luc)])
  }
  return ra
}

export interface HoSo2 {
  chienDich: ChienDich | null
  /** Mọi câu trong phạm vi luyện, kèm nguồn. */
  cau: CauSrs[]
  meta: Map<string, MetaCau>
  tt: Map<string, TrangThaiCau>
  /** Trạng thái câu của chiến dịch đang chạy. */
  ttChienDich: TrangThaiCau[]
  /** Lần làm câu của chiến dịch đang chạy, từ lúc giao (chỉ-thêm 28/09 — để xếp hạng theo dạng khi bốc câu mới). */
  lanLamChienDich?: LanLam[]
  /** Câu vào hàng ôn CHỈ vì em sai/bỏ trống trong ca kiểm tra ĐÃ CÔNG BỐ (nguồn thứ 3 `ca_sai`, chỉ-thêm 28/09). */
  qidCaSai?: Set<string>
  /** Chiến dịch chưa tới ngày bắt đầu gần nhất (chỉ-thêm 28/09) — câu của nó KHÔNG vào kế hoạch. */
  sapBatDau?: ChienDich | null
  /** SỔ NỢ (29/09): câu vào sổ nợ vì em sai khi Lên bảng / Kiểm tra đầu giờ, KHÔNG thuộc chiến dịch hay ca nào. */
  qidSaiTaiLop?: Set<string>
  /** SỔ NỢ: câu nợ của chiến dịch ĐÃ ĐÓNG/hết hạn → tên + hạn (nhãn "Chiến dịch 'Tên' · 25/09"). */
  chienDichCuCuaCau?: Map<string, { ten: string; hanNop: string }>
  /** SỔ NỢ: trần lượt/ngày khi KHÔNG có chiến dịch = thể lực của chiến dịch vừa đóng gần nhất (mặc định 40). */
  theLucNoCu?: number
  /**
   * Câu KHÔNG phục vụ được (rút khỏi kho / tự luận — không có trong `cau`/`tt`) mà em CHƯA làm lần nào (tính từ mốc như `tt`) — chỉ-thêm 30/09:
   * lúc thay câu hỏng trong kế hoạch đã chốt biết câu hỏng là câu MỚI (thay bằng câu mới) hay câu ÔN (thay bằng câu ôn).
   */
  laMoiBo?: Set<string>
  /** VÒNG HỌC v2 (02/10): câu vào nợ nhờ NGUỒN THỨ 4 (sai tự làm ở mọi kênh từ 29/09). */
  qidSaiV2?: Set<string>
  /** Trạng thái theo luật đóng lỗi chung của các câu là lỗi. */
  loiV2?: Map<string, KetQuaLoi>
  /** Câu nên phục vụ bằng song sinh ở lượt tới ⇒ chỉ số song sinh (0 … TRAN_SONG_SINH − 1). */
  songSinhCho?: Map<string, number>
  /**
   * 05/10 "làm lại câu sai bằng bản khác" (cau-anh-em.ts, chỉ dùng khi khoá `lam_lai_khac` bật): chỉ số song sinh cho MỌI lượt trong cửa sổ lỗi
   * (`laCuaSoLoi`) — kể cả lượt chờ kiểm sau khi em đã đúng song sinh, lúc `songSinhCho` (luật 02/10) để câu gốc ra nguyên văn.
   * CHỈ có khoá khi có ít nhất một câu như vậy (hồ sơ không song sinh giữ nguyên khoá như trước — ảnh chụp omni-3-ke-hoach-co-tat).
   */
  songSinhLamLai?: Map<string, number>
  /**
   * 06/10 (ban-khac-ao.ts): với câu trong cửa sổ lỗi em ĐÃ làm bản khác bằng mã (`~bt`) / bằng bộ ý Đ–S mới (`~yd`) — số thứ tự KẾ TIẾP của từng loại (lớn nhất đã làm + 1),
   * đọc từ các lần làm quy về câu gốc (`LanLam.cauAnhEm`). Chỉ có khoá khi có ít nhất một câu như vậy (chưa làm bản nào ⇒ vắng ⇒ 0) — hồ sơ cũ giữ nguyên khoá.
   */
  banKhacTiep?: Map<string, { bt: number; yd: number }>
  /** Học liệu bổ trợ (song sinh, câu kiểm, nhãn nền) của các câu lỗi. */
  boTro?: Map<string, BoTro>
  // ------------------------------------------------------------ OMNI 3 (05/10) — CHỈ có khi `omniBat(env, sbd)`; cờ tắt ⇒ không khoá nào dưới đây.
  /** MỌI chiến dịch đang chạy (đã bắt đầu, hạn ≥ hôm nay), hạn gần trước; `chienDich` = phần tử đầu (chiến dịch hạn gần nhất). */
  chienDichHet?: ChienDich[]
  /**
   * Ứng viên ÔN BÀI CŨ (nguồn 'on_bai_cu'): câu các tờ DẠY HỌC trong phạm vi đã dạy của lớp, không thuộc chiến dịch đang chạy, không tự luận, chưa gặp hoặc
   * chưa thành thạo/cắt tỉa và chưa có trong `cau`. Trạng thái + siêu dữ liệu đã nằm trong `tt`/`meta` (game phục vụ được). Thứ tự: câu đã gặp tới lịch →
   * câu chưa gặp → câu đã gặp chưa tới lịch; trong mỗi nhóm bài gần nhất (vị trí lớn nhất) trước.
   */
  onBaiCu?: CauSrs[]
  /**
   * HỢP ĐỒNG (làn game đọc `hs.omni?.cheDoCho`): OMNI bật; chế độ chờ bài mới (không chiến dịch đang chạy và lớp đã có bài tick); số ứng viên ôn bài cũ.
   * `bat` LUÔN là `true` khi có khoá này (cờ tắt ⇒ không có khoá `omni`); khai kiểu `boolean` để mã làn game (`o.bat !== false`, srs2-game.ts) vẫn biên dịch.
   */
  omni?: { bat: boolean; cheDoCho: boolean; onBaiCuSo: number }
  /** Phạm vi đã dạy của em lúc đọc (null = lớp chưa tick bài ⇒ không lọc theo phạm vi, chỉ lọc TU LUYỆN). */
  phamVi?: PhamViLop | null
}

/** Thể lực/ngày của chiến dịch vừa đóng (hoặc hết hạn) gần nhất của em — trần kế hoạch ôn nợ khi không có chiến dịch. Không có ⇒ 40. */
export function theLucChienDichVuaDong(ds: readonly ChienDich[], homNay: string): number {
  const xong = ds.filter((c) => c.trangThai === 'da_dong' || (c.trangThai === 'dang_chay' && c.hanNop < homNay))
  xong.sort((a, b) => (a.hanNop > b.hanNop ? -1 : a.hanNop < b.hanNop ? 1 : a.taoLuc > b.taoLuc ? -1 : 1))
  return xong[0]?.theLucNgay || TRAN_NGAY
}

/**
 * SỔ NỢ (thầy chốt 29/09): câu em làm SAI khi Lên bảng (`len_bang`) hoặc Kiểm tra đầu giờ (`dau_gio`) ⇒ vào sổ nợ NGAY, kể cả câu không
 * thuộc chiến dịch nào. Trả qid → lúc sai SỚM NHẤT. Chỉ câu có trong kho game, không tự luận. Lỗi đọc ⇒ rỗng.
 */
export async function docQidSaiTaiLop(env: Env, sbd: string): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const rows = (await env.DB.prepare(`SELECT qid, MIN(luc) AS luc FROM su_kien_hoc WHERE sbd = ? AND nguon IN ('len_bang','dau_gio') AND ket_qua = 0 AND COALESCE(qid,'') <> '' GROUP BY qid`)
    .bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
  if (!rows.length) return ra
  const hopLe = await cauKhoKhongTuLuan(env, rows.map((x) => str(x.qid)))
  for (const x of rows) if (hopLe.has(str(x.qid))) ra.set(str(x.qid), str(x.luc))
  return ra
}
/** Câu có trong kho game và KHÔNG tự luận. */
async function cauKhoKhongTuLuan(env: Env, qids: readonly string[]): Promise<Set<string>> {
  const ra = new Set<string>()
  if (!qids.length) return ra
  const kho = await env.DB.prepare('SELECT qid, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(qids)])).all<Row>().catch(() => ({ results: [] as Row[] }))
  const tuLuan = new Set<string>()
  for (const x of kho.results ?? []) {
    if (jsonLaTuLuan(x.json)) tuLuan.add(str(x.qid))
    else ra.add(str(x.qid))
  }
  for (const q of tuLuan) ra.delete(q)
  return ra
}

/**
 * NGUỒN THỨ 3 — `ca_sai` (thầy chốt 28/09): câu em làm SAI hoặc BỎ TRỐNG trong ca kiểm tra ĐÃ CÔNG BỐ (sổ `su_kien_hoc` nguồn 'thi',
 * không bị che, ca chưa xoá, luật công bố `SQL_DA_CONG_BO`) ⇒ vào hàng ôn của Đoàn như câu ôn thường, KỂ CẢ câu không thuộc chiến dịch nào.
 * Trả qid → lúc làm SỚM NHẤT trong ca (mốc `tuLuc`: lần làm trong ca được tính). Câu tự luận (JSON kho) và câu đã rút khỏi kho bị bỏ.
 * Lỗi đọc (bảng/cột thiếu) ⇒ rỗng: không làm hỏng kế hoạch.
 */
export async function docQidSaiCaDaCongBo(env: Env, sbd: string): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const cau = (coVis: boolean) =>
    `SELECT s.qid, MIN(s.luc) AS luc FROM su_kien_hoc s JOIN ca c ON c.ma_ca = s.ma_nguon
      WHERE s.sbd = ? AND s.nguon = 'thi' AND COALESCE(s.ket_qua, 0) <> 1 AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}
        ${coVis ? "AND COALESCE(s.visibility, '') <> 'embargoed'" : ''}
      GROUP BY s.qid`
  let rows: Row[]
  try {
    rows = (await env.DB.prepare(cau(true)).bind(sbd).all<Row>()).results ?? []
  } catch {
    try {
      rows = (await env.DB.prepare(cau(false)).bind(sbd).all<Row>()).results ?? []
    } catch {
      return ra
    }
  }
  const qids = [...new Set(rows.map((x) => str(x.qid)).filter(Boolean))]
  if (!qids.length) return ra
  const kho = await env.DB.prepare('SELECT qid, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify(qids)).all<Row>().catch(() => ({ results: [] as Row[] }))
  const tuLuan = new Set<string>()
  const coKho = new Set<string>()
  for (const x of kho.results ?? []) {
    coKho.add(str(x.qid))
    if (jsonLaTuLuan(x.json)) tuLuan.add(str(x.qid))
  }
  for (const x of rows) {
    const q = str(x.qid)
    if (q && coKho.has(q) && !tuLuan.has(q)) ra.set(q, str(x.luc))
  }
  return ra
}

// ---------------------------------------------------------------- OMNI 3: phạm vi đã dạy + ôn bài cũ (chỉ khi `omniBat`)
/** Trần số câu phạm vi xét làm ứng viên ôn bài cũ mỗi lần đọc (bài gần nhất trước) — chặn chi phí đọc sổ/meta khi lớp đã học nhiều bài. */
export const TRAN_UNG_VIEN_ON_BAI_CU = 800
/** Câu hợp lệ của các tờ trong phạm vi (dùng chung mọi em của lớp, đổi chậm) — đệm 5 phút trong isolate; khoá = danh sách tờ theo thứ tự đọc. */
const demCauPhamVi = new DemTTL<string[]>(5 * 60_000, 64, 400_000)
async function cauCuaToPhamVi(env: Env, maDe: readonly string[]): Promise<string[]> {
  const khoa = maDe.join('|')
  const co = demCauPhamVi.doc(khoa, Date.now())
  if (co) return co
  const { qids } = await (await lanGv()).cauCuaToChiTiet(env, maDe)
  demCauPhamVi.ghi(khoa, Date.now(), qids, qids.length + 1)
  return qids
}
/** Thư mục của các tờ; lỗi đọc ⇒ luật lùi (mã "DH-" là DẠY HỌC, còn lại TU LUYỆN). */
async function thuMucAnToan(env: Env, maDe: readonly string[]): Promise<Map<string, ThuMuc>> {
  if (!maDe.length) return new Map()
  const m = await lanThuMuc()
  return m.thuMucCuaMaDe(env, maDe).catch(() => new Map(maDe.map((x) => [x, m.thuMucTheoMa(x)] as const)))
}
/**
 * Câu phạm vi xét làm ứng viên ÔN BÀI CŨ: câu hợp lệ (đã duyệt, không tự luận — `cauCuaToChiTiet`) của các tờ DẠY HỌC trong phạm vi, bài gần nhất trước,
 * bỏ câu của chiến dịch đang chạy; kèm thư mục các tờ phạm vi, siêu dữ liệu và TOÀN BỘ sổ của em trên các câu ấy (không mốc — ôn bài cũ không có hạn).
 */
async function docPhamViOnBaiCu(env: Env, sbd: string, phamVi: PhamViLop, dangChay: readonly ChienDich[]): Promise<{ thuMuc: Map<string, ThuMuc>; qids: string[]; meta: Map<string, MetaCau>; lanLam: LanLam[] }> {
  const viTri = (m: string) => phamVi.baiTheoMaDe.get(m)?.viTri ?? -1
  const toPhamVi = [...phamVi.maDe].sort((a, b) => viTri(b) - viTri(a) || (a < b ? -1 : a > b ? 1 : 0))
  // Thư mục và câu các tờ phạm vi đọc SONG SONG (một đợt); câu chỉ ở tờ không phải DẠY HỌC bị lọc sau theo mọi tờ chứa câu.
  const pThuMuc = thuMucAnToan(env, toPhamVi)
  const pCau = toPhamVi.length ? cauCuaToPhamVi(env, toPhamVi) : Promise.resolve([] as string[])
  // Tối ưu 05/10: ứng viên chỉ phụ thuộc câu phạm vi + chiến dịch đang chạy (KHÔNG phụ thuộc thư mục) ⇒ siêu dữ liệu + sổ của chúng bắt đầu ngay khi có câu phạm vi
  // (câu phạm vi có đệm 5 phút ⇒ thường CÙNG đợt với thư mục; trước: chờ thư mục xong). Thư mục chỉ chọn tờ ưu tiên + lọc sau như cũ; không tờ DẠY HỌC ⇒ bỏ kết quả.
  const chay = new Set(dangChay.flatMap((c) => c.qids))
  const pUng = pCau.then((cau) => cau.filter((q) => !chay.has(q)).slice(0, TRAN_UNG_VIEN_ON_BAI_CU))
  const pDoc = pUng.then((ung) => {
    if (!ung.length) return null
    const tho = docMetaCauTho(env, ung), lanLam = docLanLam(env, sbd, ung, '')
    tho.catch(() => {}); lanLam.catch(() => {})
    return { tho, lanLam }
  })
  pDoc.catch(() => {})
  const [thuMuc, cauPhamVi] = await Promise.all([pThuMuc, pCau])
  const dayHoc = new Set(toPhamVi.filter((m) => thuMuc.get(m) === 'DAY_HOC'))
  if (!dayHoc.size) return { thuMuc, qids: [], meta: new Map(), lanLam: [] }
  const ung = cauPhamVi.filter((q) => !chay.has(q)).slice(0, TRAN_UNG_VIEN_ON_BAI_CU)
  if (!ung.length) return { thuMuc, qids: [], meta: new Map(), lanLam: [] }
  const maDeCua = new Map<string, Set<string>>()
  const doc = (await pDoc)!
  const [meta, lanLam] = await Promise.all([doc.tho.then((rows) => metaCauTuDong(rows, [...dayHoc], maDeCua)), doc.lanLam])
  return { thuMuc, qids: ung.filter((q) => [...(maDeCua.get(q) ?? [])].some((m) => dayHoc.has(m))), meta, lanLam }
}

/**
 * Toàn bộ trạng thái luyện của em: chiến dịch đang chạy + nợ cũ + ôn duy trì của chiến dịch trước.
 * OMNI 3 (CHỈ khi `omniBat`; `omniSom` = lời hỏi cờ nơi gọi đã bắt đầu, dùng chung):
 *  - đọc MỌI chiến dịch đang chạy (hạn gần trước): câu mỗi chiến dịch mang hạn + mốc tính lần làm của CHÍNH nó, nguồn chien_dich, `cd`;
 *    `chienDich` = chiến dịch hạn gần nhất, `chienDichHet` = tất cả;
 *  - LỌC PHẠM VI: câu không có tờ nào DẠY HỌC (thư mục `de_kho_thu_muc`, luật lùi "DH-") — hoặc, khi lớp đã tick bài, không có tờ DẠY HỌC nào trong phạm
 *    vi đã dạy — KHÔNG vào `cau` (vẫn ở `meta`/`tt` để "Câu đã làm" hiện đủ). Không bao giờ có câu của bài chưa tick trong kế hoạch;
 *  - ÔN BÀI CŨ: `onBaiCu` (xem HoSo2), `omni` = { bat, cheDoCho, onBaiCuSo }.
 * CẨN THẬN (a) (omni-can-than.ts, đặc tả 4.6; chỉ-thêm): `canThanSom` = nơi gọi ĐÃ có hồ sơ OMNI (lúc LẬP kế hoạch ngày — `layKeHoachChot`) cho biết em có `canThan`
 * không; ĐÚNG ⇒ mốc kiểm duy trì của luật đóng lỗi × 0,7. Vắng / OMNI tắt / sai ⇒ mốc y hệt hôm nay (KHÔNG đọc thêm D1 ở đây).
 */
export async function docHoSo2(env: Env, sbd: string, homNay: string, omniSom?: Promise<boolean>, canThanSom?: Promise<boolean>, khiCoQids?: (qids: readonly string[]) => void): Promise<HoSo2> {
  env = { ...env, DB: gopDocD1(env.DB) }
  const omniP = omniSom ?? omniBatEm(env, sbd)
  const phamViP = omniP.then((bat) => (bat ? lanBaiDaDay().then((m) => m.phamViCuaEm(env, sbd)).catch(() => null) : null))
  // Tối ưu 28/09: câu sai của ca đã công bố (không phụ thuộc chiến dịch) đọc CÙNG ĐỢT với chiến dịch + mốc thêm.
  const [ds, mocThem, qidSaiCa, qidSaiLop, qidSaiMoiKenh, mocDoc, thamSoV2, omni, phamVi] = await Promise.all([docChienDichCuaEm(env, sbd), docMocThemCuaEm(env, sbd), docQidSaiCaDaCongBo(env, sbd), docQidSaiTaiLop(env, sbd), docQidSaiV2(env, sbd), docMocDocLoiGiai(env, sbd), Promise.all([docThamSoEm(env, sbd).catch(() => null), docThamSo(env)]).then(([em, chung]) => em ?? chung), omniP, phamViP])
  // OMNI 3: mọi chiến dịch đang chạy, hạn gần trước; cờ tắt ⇒ một chiến dịch (giao gần nhất) như cũ.
  const dsDangChay = omni ? chienDichDangChayHet(ds, homNay) : []
  const dangChay = omni ? (dsDangChay[0] ?? null) : chienDichDangChay(ds, homNay)
  const hanTheoQid = new Map<string, string>()
  // Thầy 28/09: "khi giao chiến dịch đầu tiên tất cả không có câu ôn, không được lấy câu ôn trước đó" ⇒ câu của một chiến dịch chỉ tính lần làm TỪ LÚC GIAO chiến dịch ấy.
  const tuLucTheoQid = new Map<string, string>()
  const nguonTheoQid = new Map<string, 'chien_dich' | 'cu'>()
  const cdTheoQid = new Map<string, string>()
  if (omni) {
    // Câu thuộc hai bài đang chạy ⇒ tính cho bài HẠN GẦN hơn (phải xong trước hạn ấy).
    for (const c of dsDangChay) for (const q of c.qids) if (!nguonTheoQid.has(q)) { hanTheoQid.set(q, c.hanNop); nguonTheoQid.set(q, 'chien_dich'); tuLucTheoQid.set(q, mocTinhCua(c.mocBatDau, mocThem.get(c.id))); cdTheoQid.set(q, c.id) }
  } else if (dangChay) for (const q of dangChay.qids) { hanTheoQid.set(q, dangChay.hanNop); nguonTheoQid.set(q, 'chien_dich'); tuLucTheoQid.set(q, mocTinhCua(dangChay.mocBatDau, mocThem.get(dangChay.id))) }
  const dangChaySet = new Set<ChienDich>(dsDangChay)
  const cdCuaQid = new Map<string, ChienDich>()
  for (const c of ds) {
    if (c === dangChay || dangChaySet.has(c) || chuaBatDau(c, homNay)) continue // chiến dịch chưa bắt đầu: không phát câu nào của nó
    for (const q of c.qids) if (!nguonTheoQid.has(q)) { hanTheoQid.set(q, c.hanNop); nguonTheoQid.set(q, 'cu'); tuLucTheoQid.set(q, mocTinhCua(c.mocBatDau, mocThem.get(c.id))); cdCuaQid.set(q, c) }
  }
  // Nguồn thứ 3 `ca_sai`: câu sai/bỏ trống trong ca ĐÃ CÔNG BỐ. Câu đã thuộc chiến dịch ⇒ GIỮ nguồn chiến dịch (không nhân đôi).
  const qidCaSai = new Set<string>()
  for (const [q, luc] of qidSaiCa) {
    if (nguonTheoQid.has(q)) continue
    nguonTheoQid.set(q, 'cu')
    tuLucTheoQid.set(q, luc)
    qidCaSai.add(q)
  }
  // SỔ NỢ (29/09): câu sai khi Lên bảng / Kiểm tra đầu giờ ngoài mọi chiến dịch và ca ⇒ nợ (tính lần làm từ lần sai đầu).
  const qidSaiTaiLop = new Set<string>()
  for (const [q, luc] of qidSaiLop) {
    if (nguonTheoQid.has(q)) continue
    nguonTheoQid.set(q, 'cu')
    tuLucTheoQid.set(q, luc)
    qidSaiTaiLop.add(q)
  }
  // VÒNG HỌC v2 — NGUỒN THỨ 4 (thầy 02/10: "đảm bảo tất cả các câu sai phải được xử lý triệt để", "chỉ tính từ 29/09"): câu sai TỰ LÀM ở
  // MỌI kênh từ 29/09 mà 3 nguồn trên chưa kéo ⇒ nợ. Câu không có trong kho game / tự luận bị `docMetaCau` loại như mọi nguồn.
  const qidSaiV2 = new Set<string>()
  for (const [q, luc] of qidSaiMoiKenh) {
    if (nguonTheoQid.has(q)) continue
    nguonTheoQid.set(q, 'cu')
    tuLucTheoQid.set(q, luc)
    qidSaiV2.add(q)
  }
  const qids = [...nguonTheoQid.keys()]
  // Nơi gọi (chỉ "Câu đã làm") biết tập câu từ đây ⇒ bắt đầu các lượt ĐỌC của riêng nó CÙNG đợt với meta/lần làm bên dưới (trước: nối tiếp sau cả hồ sơ). Lỗi của nó không làm hỏng hồ sơ.
  if (khiCoQids) { try { khiCoQids(qids) } catch { /* chỉ là tăng tốc */ } }
  const khoiEmP = docKhoiEmCong(env, sbd).catch(() => null) // LUẬT THẦY 05/10 (chan-khac-khoi.ts): khối em đọc CÙNG ĐỢT lượt đọc chính dưới (gopDocD1 gộp — không thêm vòng D1)
  // Sự kiện trước mốc sớm nhất vốn bị loại bên dưới: lọc ngay trong D1, giảm dữ liệu truyền/parse.
  // Vẫn xét mốc riêng từng câu sau khi đọc; có câu thiếu mốc thì giữ cận rỗng để không bỏ lịch sử.
  const tuLuc = qids.reduce((min, q) => { const luc = tuLucTheoQid.get(q) ?? ''; return luc < min ? luc : min }, tuLucTheoQid.get(qids[0]) ?? '')
  // OMNI 3: gom mọi tờ của câu (lọc phạm vi) + đọc ứng viên ôn bài cũ SONG SONG với lượt đọc chính.
  const maDeCua = omni ? new Map<string, Set<string>>() : undefined
  // "Bài cũ" = phần phạm vi ngoài bài đang luyện ⇒ cần lớp ĐÃ tick bài (hợp đồng bai-da-day: phạm vi khác null ⇔ có bài tick; phạm vi rỗng bài tick ⇒ không ôn bài cũ).
  const onBaiCuP = omni && phamVi && phamVi.baiDaTick.length > 0 ? docPhamViOnBaiCu(env, sbd, phamVi, dsDangChay).catch(() => null) : Promise.resolve(null)
  const [meta, lanLam, moc, boTro, phamViOn] = await Promise.all([docMetaCau(env, qids, dangChay?.maDe ?? [], maDeCua), docLanLam(env, sbd, qids, tuLuc), docMocDayLai(env, sbd), docBoTroLoi(env, [...qidSaiMoiKenh.keys()].filter((q) => nguonTheoQid.has(q))), onBaiCuP])
  // OMNI 3 — LỌC PHẠM VI: câu được vào kế hoạch khi có ÍT NHẤT một tờ DẠY HỌC (và, khi lớp đã tick bài, tờ ấy thuộc phạm vi đã dạy).
  let trongPhamVi: ((qid: string) => boolean) | null = null
  if (omni && maDeCua) {
    const thuMuc = new Map<string, ThuMuc>(phamViOn?.thuMuc ?? [])
    const can = new Set<string>()
    for (const tap of maDeCua.values()) for (const m of tap) if (!thuMuc.has(m)) can.add(m)
    if (can.size) for (const [k, v] of await thuMucAnToan(env, [...can])) thuMuc.set(k, v)
    // `thuMucAnToan` trả đủ mọi mã đã hỏi (thiếu dòng ⇒ luật lùi "DH-"); vắng khoá (không thể xảy ra) ⇒ coi là ngoài phạm vi.
    trongPhamVi = (q) => [...(maDeCua.get(q) ?? [])].some((m) => thuMuc.get(m) === 'DAY_HOC' && (!phamVi || phamVi.maDe.has(m)))
  }
  const theoQid = new Map<string, LanLam[]>()
  // Thêm tại chỗ: tránh sao chép cả lịch sử O(n²) cho câu đã luyện nhiều lần.
  for (const x of lanLam) if (x.luc >= (tuLucTheoQid.get(x.qid) ?? '')) {
    let ls = theoQid.get(x.qid)
    if (!ls) { ls = []; theoQid.set(x.qid, ls) }
    ls.push(x)
  }
  { const thayGiao = new Set([...ds.flatMap((c) => c.qids), ...qidSaiCa.keys()]); await chanMetaKhacKhoi(env, 'hoa2_ho_so', await khoiEmP, meta, (q) => thayGiao.has(q)) } // LUẬT THẦY 05/10: câu khác khối em ⇒ như đã rút khỏi kho của RIÊNG em (kế hoạch, Đảo/Đoàn/Bi-a, "Câu đã làm", báo cáo); em chưa rõ khối ⇒ chỉ giữ câu thầy giao trực tiếp (chiến dịch, câu sai ca thầy dựng)
  const thamSoDung = omni && canThanSom ? nhanMocDuyTri(thamSoV2, await canThanSom.catch(() => false)) : thamSoV2 // CẨN THẬN (a): em canThan ⇒ mốc × 0,7
  const tt = new Map<string, TrangThaiCau>()
  const cau: CauSrs[] = []
  const laMoiBo = new Set<string>()
  const loiV2 = new Map<string, KetQuaLoi>()
  const songSinhCho = new Map<string, number>(), songSinhLamLai = new Map<string, number>()
  const banKhacTiep = new Map<string, { bt: number; yd: number }>()
  for (const qid of qids) {
    const m = meta.get(qid)
    if (!m || m.tuLuan) { if (!theoQid.get(qid)?.length) laMoiBo.add(qid); continue } // câu đã rút khỏi kho / câu tự luận (30/09: không vào kế hoạch, không đếm thể lực; meta vẫn giữ để tra)
    const t0 = phatLaiCau(qid, theoQid.get(qid) ?? [], hanTheoQid.get(qid) ?? null, moc.get(qid) ?? [], { sao: m.sao, phan: m.phan, mucDo: m.mucDo })
    // VÒNG HỌC v2: câu từng sai tự làm từ 29/09 ⇒ LUẬT ĐÓNG LỖI CHUNG quyết thành thạo / hẹn; lượt làm lại ưu tiên câu song sinh.
    let t = t0
    if (qidSaiMoiKenh.has(qid)) {
      // Chỉ chỗ < CHO_SONG_SINH: qid ảo phát ra phải nằm trong danh sách đọc sổ (`cacQidSongSinh`), không thì lượt làm rơi khỏi lịch sử câu gốc.
      const ssDungDuoc = (boTro.get(qid)?.songSinh ?? []).flatMap((ss, i) => i < CHO_SONG_SINH && songSinhDuDuLieu(m.phan, ss) ? [i] : [])
      const soSS = ssDungDuoc.length
      const ap = apLuatChung(t0, theoQid.get(qid) ?? [], mocDoc.get(qid) ?? [], soSS > 0, homNay, thamSoDung)
      t = ap.t
      if (ap.loi.trangThai !== 'khong_loi') loiV2.set(qid, ap.loi)
      if (ap.loi.nenSongSinh && soSS > 0) songSinhCho.set(qid, ssDungDuoc[chonSongSinh(theoQid.get(qid) ?? [], soSS)]!)
      if (soSS > 0 && laCuaSoLoi(ap.loi.trangThai)) songSinhLamLai.set(qid, ssDungDuoc[chonSongSinh(theoQid.get(qid) ?? [], soSS)]!) // 05/10 bậc 1 (cau-anh-em.ts)
      if (laCuaSoLoi(ap.loi.trangThai)) { const tiep = tiepBanKhacMoi(theoQid.get(qid) ?? []); if (tiep.bt || tiep.yd) banKhacTiep.set(qid, tiep) } // 06/10 bậc biến thể bằng mã / ý Đ–S mới (ban-khac-ao.ts)
    }
    tt.set(qid, t)
    const nguon = nguonTheoQid.get(qid) === 'chien_dich' ? 'chien_dich' : t.thanhThao ? 'duy_tri' : t.laMoi ? null : 'no_cu'
    if (!nguon) continue // câu chiến dịch cũ em chưa từng gặp: không kéo sang
    if (trongPhamVi && !trongPhamVi(qid)) continue // OMNI 3 — ngoài phạm vi / chỉ ở TU LUYỆN: vẫn trong meta/tt, KHÔNG vào kế hoạch
    const cd = nguon === 'chien_dich' ? cdTheoQid.get(qid) : undefined
    cau.push({ qid, phan: m.phan, mucDo: m.mucDo, dang: m.dang, nguon, ...(m.sao ? { sao: m.sao } : {}), ...(cd ? { cd } : {}) })
  }
  // OMNI 3 — ÔN BÀI CŨ: ứng viên = câu phạm vi (không thuộc chiến dịch đang chạy, không tự luận) chưa gặp, hoặc chưa thành thạo/cắt tỉa và chưa có trong `cau`.
  // Câu đã có trạng thái (nguồn cũ) dùng trạng thái ấy; câu gặp lần đầu ở đây phát lại TOÀN BỘ sổ, không hạn. Trạng thái + meta thêm vào `tt`/`meta`.
  let onBaiCu: CauSrs[] = []
  if (phamViOn?.meta.size) await chanMetaKhacKhoi(env, 'hoa2_on_bai_cu', await khoiEmP, phamViOn.meta) // LUẬT THẦY 05/10: ôn bài cũ (máy tự rút trong phạm vi đã dạy) chỉ câu ĐÚNG khối em
  if (omni && phamViOn?.qids.length) {
    const trongCau = new Set(cau.map((c) => c.qid))
    const lanTheo = new Map<string, LanLam[]>()
    for (const x of phamViOn.lanLam) { let ls = lanTheo.get(x.qid); if (!ls) { ls = []; lanTheo.set(x.qid, ls) } ls.push(x) }
    const ung: { c: CauSrs; nhom: number; i: number }[] = []
    phamViOn.qids.forEach((q, i) => {
      if (trongCau.has(q)) return
      const m = meta.get(q) ?? phamViOn.meta.get(q)
      if (!m || m.tuLuan) return
      const t = tt.get(q) ?? phatLaiCau(q, lanTheo.get(q) ?? [], null, moc.get(q) ?? [], { sao: m.sao, phan: m.phan, mucDo: m.mucDo })
      if (!t.laMoi && (t.thanhThao || t.catTia)) return
      if (!tt.has(q)) tt.set(q, t)
      if (!meta.has(q)) meta.set(q, m)
      // câu đã gặp tới lịch → câu chưa gặp → câu đã gặp chưa tới lịch; trong nhóm giữ thứ tự bài gần nhất trước
      ung.push({ c: { qid: q, phan: m.phan, mucDo: m.mucDo, dang: m.dang, nguon: 'on_bai_cu', ...(m.sao ? { sao: m.sao } : {}) }, nhom: t.laMoi ? 1 : t.henOn && t.henOn <= homNay ? 0 : 2, i })
    })
    onBaiCu = ung.sort((a, b) => a.nhom - b.nhom || a.i - b.i).map((x) => x.c)
  }
  const chienDichCuCuaCau = new Map<string, { ten: string; hanNop: string }>()
  for (const [q, c] of cdCuaQid) if (c.trangThai === 'da_dong' || c.hanNop < homNay) chienDichCuCuaCau.set(q, { ten: c.ten, hanNop: c.hanNop })
  // Hạng theo dạng (bốc câu mới cá nhân): nhiều bài ⇒ lần làm câu của MỌI bài đang chạy (mỗi câu từ mốc của chính nó).
  const lanLamChienDich = omni && dsDangChay.length > 1
    ? [...new Set(dsDangChay.flatMap((c) => c.qids))].flatMap((q) => theoQid.get(q) ?? [])
    : dangChay ? dangChay.qids.flatMap((q) => theoQid.get(q) ?? []) : []
  return {
    chienDich: dangChay, cau, meta, tt, ttChienDich: dangChay ? dangChay.qids.map((q) => tt.get(q)).filter((x): x is TrangThaiCau => !!x) : [], lanLamChienDich, qidCaSai, sapBatDau: chienDichSapBatDau(ds, homNay), qidSaiTaiLop, chienDichCuCuaCau, theLucNoCu: theLucChienDichVuaDong(ds, homNay), laMoiBo, qidSaiV2, loiV2, songSinhCho, boTro, ...(songSinhLamLai.size ? { songSinhLamLai } : {}), ...(banKhacTiep.size ? { banKhacTiep } : {}),
    ...(omni ? { chienDichHet: dsDangChay, onBaiCu, omni: { bat: true, cheDoCho: !dangChay && !!phamVi && phamVi.baiDaTick.length > 0, onBaiCuSo: onBaiCu.length }, phamVi: phamVi ?? null } : {}),
  }
}

// ---------------------------------------------------------------- SỔ NỢ: lịch sử có nguồn + nhãn nợ (thầy chốt 29/09)
/** Một lần làm kèm nguồn đã phân loại (game tách Bi-a / Đoàn / Đảo theo phiên). */
export interface LanLamCoNguon { qid: string; ngay: string; luc: string; dung: boolean; nguon: NguonNhan }
const phanLoaiNguon = (nguon: string, bia: unknown, doan: unknown): NguonNhan =>
  nguon === 'thi' ? 'thi' : nguon === 'len_bang' ? 'len_bang' : nguon === 'dau_gio' ? 'dau_gio' : nguon !== 'game' ? 'khac' : Number(bia) === 1 ? 'bia' : doan != null ? 'doan' : 'dao'
/**
 * HỢP ĐỒNG (Kiểm tra đầu giờ đọc để hiện "Sai 20/09 (Ca) · Đúng 22/09 (Đoàn)"): TOÀN BỘ lịch sử làm các câu của em, theo giờ, bỏ lần bị che
 * (ca chưa công bố); bỏ trống tính là sai (như `docLanLam`). Lỗi đọc ⇒ `null`.
 */
export async function docLichSuCoNguon(env: Env, sbd: string, qids: readonly string[]): Promise<Map<string, LanLamCoNguon[]> | null> {
  const ra = new Map<string, LanLamCoNguon[]>()
  if (!qids.length) return ra
  const ds = JSON.stringify([...new Set(qids)])
  const sql = (coVis: boolean) => `SELECT s.qid, s.luc, s.ngay_vn, s.ket_qua, s.nguon, ${coVis ? 's.visibility' : 'NULL AS visibility'},
      COALESCE(json_extract(g.json, '$.bia'), 0) AS bia, json_extract(g.json, '$.doan') AS doan
    FROM su_kien_hoc s LEFT JOIN game_v2_session g ON s.nguon = 'game' AND g.id = s.ma_nguon
    WHERE s.sbd = ? AND s.qid IN (SELECT value FROM json_each(?)) ${coVis ? `AND ${SQL_LA_LAN_LAM.replace('purpose', 's.purpose')}` : ''} ORDER BY s.luc`
  const r = await env.DB.prepare(sql(true)).bind(sbd, ds).all<Row>().catch(() => env.DB.prepare(sql(false)).bind(sbd, ds).all<Row>()).catch(() => null)
  if (!r) return null
  for (const x of r.results ?? []) {
    if (str(x.visibility) === 'embargoed') continue
    const q = str(x.qid)
    ra.set(q, [...(ra.get(q) ?? []), { qid: q, luc: str(x.luc), ngay: str(x.ngay_vn), dung: Number(x.ket_qua) === 1, nguon: phanLoaiNguon(str(x.nguon), x.bia, x.doan) }])
  }
  return ra
}
/**
 * Gắn nguồn vào `lichSu` (phatLaiCau) của một câu: `lichSu` = ĐUÔI của lịch sử đầy đủ (cắt từ mốc chiến dịch) ⇒ ghép theo số lần cuối.
 * Lịch sử đầy đủ ngắn hơn (lệch dữ liệu) ⇒ `null` (không gắn).
 */
export function ganNguonDuoi<T extends object>(lichSu: readonly T[], day: readonly { nguon: NguonNhan }[] | undefined): (T & { nguon: NguonNhan })[] | null {
  const ns = day ?? []
  if (ns.length < lichSu.length) return null
  const duoi = ns.slice(ns.length - lichSu.length)
  return lichSu.map((l, i) => ({ ...l, nguon: duoi[i]!.nguon }))
}
/**
 * Nhãn nợ của các câu (chỉ câu đã làm mà chưa thành thạo, kể cả "Cần thầy dạy lại"): "Sai 2 lần · Ca 26/09 · Lên bảng 28/09 · …".
 * Một truy vấn sổ. Lỗi đọc ⇒ nhãn không có nguồn ("Sai 2 lần · Sai 26/09"). Câu không nợ ⇒ không có trong kết quả.
 */
/** Câu (trong `qids`) cần nhãn nợ: đã làm mà chưa thành thạo / cần thầy dạy lại — đúng tập `docNhanNo` đọc lịch sử. */
export function qidCanNhanNo(hs: HoSo2, qids: readonly string[]): string[] {
  return [...new Set(qids)].filter((q) => { const t = hs.tt.get(q); return !!t && (laNo(t) || t.catTia) })
}
/** `lsSom` (tối ưu 05/10): lịch sử có nguồn nơi gọi đã đọc SỚM cho một TẬP CHA của câu cần nhãn (lượt sắp phát, cùng lúc nạp câu) — mỗi câu một danh sách
 *  riêng, đọc tập cha cho đúng danh sách ấy ⇒ nhãn y hệt. Vắng ⇒ đọc như cũ. */
export async function docNhanNo(env: Env, sbd: string, hs: HoSo2, qids: readonly string[], lsSom?: Promise<Map<string, LanLamCoNguon[]> | null>): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const can = qidCanNhanNo(hs, qids)
  if (!can.length) return ra
  const ls = await (lsSom ?? docLichSuCoNguon(env, sbd, can)).catch(() => null)
  for (const q of can) {
    const t = hs.tt.get(q)!
    const lich = (ls && ganNguonDuoi(t.lichSu, ls.get(q))) ?? t.lichSu
    const n = nhanNo(lich, t.ngayChua ?? null, hs.chienDichCuCuaCau?.get(q) ?? null)
    if (n) ra.set(q, n)
  }
  return ra
}

// ---------------------------------------------------------------- SỔ NỢ cả lớp: ước lượt nợ cũ (Giao / Sửa chiến dịch, báo thầy)
/** Nợ cũ của một em: số câu nợ và số lượt tối thiểu còn cần (≈ 2 − cc lượt/câu, `khoiLuongCan`). */
export interface NoCuEm { soCau: number; luot: number }
/** Câu sai của NHIỀU em ngoài chiến dịch: ca ĐÃ CÔNG BỐ + Lên bảng / Kiểm tra đầu giờ. sbd → qid → lúc sai sớm nhất. Lỗi đọc ⇒ rỗng. */
async function docSaiNgoaiCaLop(env: Env, dsSbd: readonly string[]): Promise<Map<string, Map<string, string>>> {
  const ra = new Map<string, Map<string, string>>()
  const arr = JSON.stringify([...new Set(dsSbd)])
  const ca = (coVis: boolean) => `SELECT s.sbd, s.qid, MIN(s.luc) AS luc FROM su_kien_hoc s JOIN ca c ON c.ma_ca = s.ma_nguon
      WHERE s.sbd IN (SELECT value FROM json_each(?)) AND s.nguon = 'thi' AND COALESCE(s.ket_qua, 0) <> 1 AND c.trang_thai <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}
        ${coVis ? "AND COALESCE(s.visibility, '') <> 'embargoed'" : ''} GROUP BY s.sbd, s.qid`
  const rCa = await env.DB.prepare(ca(true)).bind(arr).all<Row>().catch(() => env.DB.prepare(ca(false)).bind(arr).all<Row>()).catch(() => ({ results: [] as Row[] }))
  const rLop = await env.DB.prepare(`SELECT sbd, qid, MIN(luc) AS luc FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND nguon IN ('len_bang','dau_gio') AND ket_qua = 0 AND COALESCE(qid,'') <> '' GROUP BY sbd, qid`)
    .bind(arr).all<Row>().catch(() => ({ results: [] as Row[] }))
  const rows = [...(rCa.results ?? []), ...(rLop.results ?? [])]
  const hopLe = await cauKhoKhongTuLuan(env, rows.map((x) => str(x.qid)))
  for (const x of rows) {
    const s = str(x.sbd), q = str(x.qid), luc = str(x.luc)
    if (!hopLe.has(q)) continue
    const m = ra.get(s) ?? new Map<string, string>()
    if (!m.has(q) || luc < m.get(q)!) m.set(q, luc)
    ra.set(s, m)
  }
  return ra
}
/**
 * NỢ CŨ của nhiều em (thầy chốt 29/09): câu đã làm mà chưa thành thạo, chưa cắt tỉa, NGOÀI câu `boQids` và chiến dịch `boChienDichId`
 * (chiến dịch đang giao/sửa) — từ mọi chiến dịch khác đã bắt đầu + câu sai ở ca đã công bố / lên bảng / đầu giờ. Cùng luật `docHoSo2`
 * (lần làm tính từ mốc chiến dịch; mốc em được thêm; mốc dạy lại). Dùng để "Tự tính", trần Quá tải, Huyết Chiến, tự nâng khi Sửa
 * TÍNH CẢ lượt nợ cũ, và để báo thầy "Em X còn N câu nợ cũ — cần ≈ K ngày". Lỗi đọc ⇒ em không có nợ (hành vi cũ).
 */
export async function noCuCaLop(env: Env, dsSbd: readonly string[], homNay: string, boQids: Iterable<string>, boChienDichId: string | null = null): Promise<Map<string, NoCuEm>> {
  const ra = new Map<string, NoCuEm>(dsSbd.map((s) => [s, { soCau: 0, luot: 0 }]))
  if (!dsSbd.length) return ra
  const arr = JSON.stringify([...new Set(dsSbd)])
  const bo = new Set(boQids)
  const [rCd, rThem, saiNgoai, rMoc] = await Promise.all([
    env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' AND EXISTS (SELECT 1 FROM json_each(chien_dich.sbd_json) WHERE value IN (SELECT value FROM json_each(?))) ORDER BY tao_luc DESC").bind(arr).all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare('SELECT sbd, chien_dich_id, them_luc FROM chien_dich_em WHERE sbd IN (SELECT value FROM json_each(?)) AND them_luc IS NOT NULL').bind(arr).all<Row>().catch(() => ({ results: [] as Row[] })),
    docSaiNgoaiCaLop(env, dsSbd).catch(() => new Map<string, Map<string, string>>()),
    env.DB.prepare('SELECT sbd, qid, luc FROM srs2_day_lai WHERE sbd IN (SELECT value FROM json_each(?))').bind(arr).all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const dsCd = (await docChienDichKemBatDau(env, rCd.results ?? [])).filter((c) => c.id !== boChienDichId && !chuaBatDau(c, homNay))
  const them = new Map((rThem.results ?? []).map((x) => [`${str(x.sbd)}|${str(x.chien_dich_id)}`, str(x.them_luc)]))
  const moc = new Map<string, string[]>()
  for (const x of rMoc.results ?? []) { const k = `${str(x.sbd)}|${str(x.qid)}`; moc.set(k, [...(moc.get(k) ?? []), str(x.luc)]) }
  // Phạm vi từng em: qid → (hạn, mốc tính).
  const phamVi = new Map<string, Map<string, { han: string | null; tu: string }>>()
  const tatCa = new Set<string>()
  for (const s of dsSbd) {
    const m = new Map<string, { han: string | null; tu: string }>()
    for (const c of dsCd) {
      if (!c.sbd.includes(s)) continue
      for (const q of c.qids) if (!bo.has(q) && !m.has(q)) m.set(q, { han: c.hanNop, tu: mocTinhCua(c.mocBatDau, them.get(`${s}|${c.id}`)) })
    }
    for (const [q, luc] of saiNgoai.get(s) ?? []) if (!bo.has(q) && !m.has(q)) m.set(q, { han: null, tu: luc })
    for (const q of m.keys()) tatCa.add(q)
    phamVi.set(s, m)
  }
  if (!tatCa.size) return ra
  const qs = JSON.stringify([...tatCa])
  const [rLan, loai] = await Promise.all([
    env.DB.prepare(`SELECT sbd, qid, ngay_vn, luc, ket_qua, assistance, visibility, nguon FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?)) AND ${SQL_LA_LAN_LAM}`).bind(arr, qs).all<Row>()
      .catch(() => env.DB.prepare(`SELECT sbd, qid, ngay_vn, luc, ket_qua, nguon FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))`).bind(arr, qs).all<Row>())
      .catch(() => ({ results: [] as Row[] })),
    docLoaiCau(env, [...tatCa]),
  ])
  const lan = new Map<string, LanLam[]>()
  for (const x of rLan.results ?? []) {
    if (str(x.visibility) === 'embargoed') continue
    const k = `${str(x.sbd)}|${str(x.qid)}`
    lan.set(k, [...(lan.get(k) ?? []), lanLamTuDong(x)])
  }
  for (const s of dsSbd) {
    const ds: TrangThaiCau[] = []
    for (const [q, pv] of phamVi.get(s)!) {
      const l = loai.get(q)
      if (!l) continue // câu đã rút khỏi kho
      const t = phatLaiCau(q, (lan.get(`${s}|${q}`) ?? []).filter((x) => x.luc >= pv.tu), pv.han, moc.get(`${s}|${q}`) ?? [], l)
      if (laNo(t)) ds.push(t)
    }
    ra.set(s, { soCau: ds.length, luot: khoiLuongCan(ds) })
  }
  return ra
}

// ---------------------------------------------------------------- hạng theo dạng (bốc câu mới cá nhân hoá, thầy 28/09)
/** Hồ sơ dạng (`nam_kt_dang`) của nhiều em. Lỗi đọc (bảng/cột thiếu) ⇒ rỗng: em coi như chưa có dữ liệu (L2 hoặc theo lần làm trong chiến dịch). */
export async function docHoSoDangCaLop(env: Env, dsSbd: readonly string[]): Promise<Map<string, HoSoDangTho[]>> {
  const ra = new Map<string, HoSoDangTho[]>()
  if (!dsSbd.length) return ra
  const arr = JSON.stringify([...new Set(dsSbd)])
  const r = await env.DB.prepare("SELECT sbd, ma_dang, so_gap, so_sai, cap_nhat_luc FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang NOT LIKE 'CD:%'").bind(arr).all<Row>()
    .catch(() => env.DB.prepare("SELECT sbd, ma_dang, so_gap, so_sai FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang NOT LIKE 'CD:%'").bind(arr).all<Row>())
    .catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const k = str(x.sbd)
    ra.set(k, [...(ra.get(k) ?? []), { maDang: str(x.ma_dang), soGap: Number(x.so_gap) || 0, soSai: Number(x.so_sai) || 0, capNhatLuc: x.cap_nhat_luc == null ? null : str(x.cap_nhat_luc) }])
  }
  return ra
}

/** Hạng theo dạng của MỘT em từ hồ sơ dạng + lần làm trong chiến dịch (bỏ lượt có gợi ý). Tính lại mỗi lần lập kế hoạch ⇒ tự cập nhật mỗi sáng. */
export function hangTuHoSo(hoSoDang: readonly HoSoDangTho[], lanLam: readonly LanLam[], meta: ReadonlyMap<string, MetaCau>, qidsChienDich: readonly string[], tuLuc = ''): { hangTheoDang: Record<string, HangEm>; hangChung: HangEm } {
  // 05/10: lượt câu anh em quy về câu gốc (`cauAnhEm`) mà câu anh em cũng thuộc chiến dịch ⇒ đã đếm dưới qid thật (cùng dạng) — bỏ bản quy về để không đếm đôi.
  const tapCd = new Set(qidsChienDich)
  const tk = gopThongKeDang(hoSoDang, lanLam.filter((x) => !x.cauAnhEm || !tapCd.has(x.cauAnhEm)).map((x) => ({ dang: meta.get(x.qid)?.dang ?? null, luc: x.luc, dung: x.dung, coGoiY: x.coGoiY })), tuLuc)
  const dangCan = [...new Set(qidsChienDich.map((q) => meta.get(q)?.dang).filter((d): d is string => !!d))]
  return tinhHangTheoDang(tk, dangCan)
}

/** Hạng theo dạng của em cho kế hoạch hôm nay (không chiến dịch ⇒ chỉ từ hồ sơ dạng). */
export async function docHangEm(env: Env, sbd: string, hs: HoSo2, hoSoDangSom?: Promise<Map<string, HoSoDangTho[]>>): Promise<{ hangTheoDang: Record<string, HangEm>; hangChung: HangEm } | null> {
  const cd = hs.chienDich
  // `hoSoDangSom` (tối ưu 05/10): nơi lập kế hoạch đã bắt đầu đọc hồ sơ dạng sớm (song song lượt đọc thứ hai của hồ sơ) ⇒ dùng lại, không đọc lần nữa.
  const hoSoDang = (await (hoSoDangSom ?? docHoSoDangCaLop(env, [sbd]))).get(sbd) ?? []
  // Không chiến dịch (Sổ nợ 29/09): vẫn cần hạng CHUNG để đan xen câu nợ theo sức em — chỉ từ hồ sơ dạng.
  if (!cd) return hangTuHoSo(hoSoDang, [], hs.meta, [], '')
  // OMNI 3 — nhiều bài song song: dạng của MỌI bài đang chạy; lần làm đã lọc theo mốc từng bài (`lanLamChienDich`), cận dưới = mốc sớm nhất.
  const ds = hs.chienDichHet && hs.chienDichHet.length > 1 ? hs.chienDichHet : null
  if (ds) return hangTuHoSo(hoSoDang, hs.lanLamChienDich ?? [], hs.meta, [...new Set(ds.flatMap((c) => c.qids))], ds.reduce((m, c) => (c.mocBatDau < m ? c.mocBatDau : m), ds[0]!.mocBatDau))
  return hangTuHoSo(hoSoDang, hs.lanLamChienDich ?? [], hs.meta, cd.qids, cd.mocBatDau)
}

// ---------------------------------------------------------------- kế hoạch ngày (chốt một lần)
export interface KeHoachDaChot {
  ngay: string
  chienDichId: string | null
  /** Khoá câu theo thứ tự phục vụ; `qid#2` = lần làm thứ 2 trong ngày (ngày cuối trước hạn). */
  dao: string[]
  doan: string[]
  huyetChien: boolean
  tong: number
  conDao: string[]
  conDoan: string[]
  /**
   * Câu còn lại TẠM HOÃN hôm nay (sửa lỗi 29/09 "Đảo báo nhầm ca kiểm tra", rương kẹt 42/46): đã bỏ khỏi `dao/doan/con*` và `tong`.
   * `ca` = đang bảo vệ cho ca kiểm tra chưa công bố (`protectedQuestions`), `kho` = đã rút khỏi kho / JSON không nạp được,
   * `tuLuan` (30/09) = chỉ mục nay xem là câu tự luận (không phục vụ, lặng lẽ bỏ), `nghi` (06/10) = đang NGHI sai đáp án (`cau_nghi_dap_an` — cổng cuối của em cũng không phát câu ấy,
   * nên bỏ khỏi kế hoạch để em không kẹt "còn N câu" / rương không mở được tới khi thầy chốt câu nghi). Vắng = không có câu nào.
   */
  tamHoan?: { ca: number; kho: number; tuLuan?: number; nghi?: number }
  /** OMNI 3 (chỉ khi OMNI bật): qid câu ÔN BÀI CŨ của kế hoạch hôm nay (bảng phụ `srs2_ke_hoach_omni`) — Sảnh đếm "Hôm nay ôn bài cũ: N câu". */
  onBaiCu?: string[]
}

/** Bỏ hậu tố lần-làm-trong-ngày (`qid#2`). */
export const qidGoc = (k: string): string => k.replace(/#\d+$/, '')
const lanThu = (k: string): number => Number(/#(\d+)$/.exec(k)?.[1] ?? 1)

/** Số lần em đã làm mỗi câu hôm nay trong game. */
async function docDemHomNay(env: Env, sbd: string, ngay: string): Promise<Map<string, number>> {
  // 05/10: đọc kèm `tc` (câu anh em làm THAY câu gốc — lam-lai-so.ts); CSDL chưa có cột raw_json ⇒ truy vấn cũ.
  const r = await env.DB.prepare(`SELECT qid, ${SQL_TC} AS tc, COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'game' GROUP BY qid, ${SQL_TC}`).bind(sbd, ngay).all<Row>()
    .catch(() => env.DB.prepare("SELECT qid, COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'game' GROUP BY qid").bind(sbd, ngay).all<Row>())
    .catch(() => ({ results: [] as Row[] }))
  // Kế hoạch giữ qid gốc, sổ giữ qid biến thể. Cộng vào cùng nhiệm vụ để làm xong
  // câu cuối thì hạ cầu ngay; không sửa lịch sử, điểm hay điều kiện thành thạo.
  const dem = new Map<string, number>()
  for (const x of r.results ?? []) {
    const q = tachSongSinh(str(x.qid)).goc, n = Number(x.n) || 0
    dem.set(q, (dem.get(q) ?? 0) + n)
    const tc = str(x.tc)
    if (tc && tc !== q) dem.set(tc, (dem.get(tc) ?? 0) + n) // câu anh em ⇒ tính cho nhiệm vụ của câu gốc nó thay
  }
  return dem
}

const hoanThien = (ngay: string, id: string | null, dao: string[], doan: string[], huyetChien: boolean, dem: ReadonlyMap<string, number>): KeHoachDaChot => {
  const chua = (k: string) => (dem.get(qidGoc(k)) ?? 0) < lanThu(k)
  return { ngay, chienDichId: id, dao, doan, huyetChien, tong: dao.length + doan.length, conDao: dao.filter(chua), conDoan: doan.filter(chua) }
}
const tuDong = (r: Row, ngay: string, dem: ReadonlyMap<string, number>) =>
  hoanThien(ngay, r.chien_dich_id == null ? null : str(r.chien_dich_id), parseMang(r.dao_json), parseMang(r.doan_json), Number(r.huyet_chien) === 1, dem)

/** Gắn hậu tố cho câu đã có trong kế hoạch (lần làm thứ n trong ngày). */
function themLanLam(cu: readonly string[], moi: readonly string[]): string[] {
  const n = new Map<string, number>()
  for (const k of cu) n.set(qidGoc(k), Math.max(n.get(qidGoc(k)) ?? 0, lanThu(k)))
  return moi.map((q) => {
    const k = (n.get(q) ?? 0) + 1
    n.set(q, k)
    return k === 1 ? q : `${q}#${k}`
  })
}

/**
 * CHỈ ĐỌC (app phụ huynh mới 28/09): kế hoạch hôm nay ĐÃ CHỐT của em, kèm câu còn lại. Chưa chốt (em chưa mở app hôm nay) ⇒ null.
 * KHÔNG lập, KHÔNG ghi — phụ huynh mở app không được chốt kế hoạch thay con (khác `layKeHoachHomNay`). Lỗi đọc ⇒ null.
 */
export async function docKeHoachDaChot(env: Env, sbd: string, nowMs: number): Promise<KeHoachDaChot | null> {
  const ngay = ngayVnCua(nowMs)
  const cu = await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  if (!cu) return null
  return tuDong(cu, ngay, await docDemHomNay(env, sbd, ngay))
}

/**
 * Kế hoạch HÔM NAY của em: lần mở đầu tiên trong ngày thì lập và CHỐT (bảng `srs2_ke_hoach`), các lần sau đọc lại —
 * Thể lực là con số thật, không nhảy. Ngoại lệ luật B.7: ngày cuối trước hạn, làm hết kế hoạch mà trần ngày còn chỗ và
 * có câu đến lịch lại trong ngày (câu vừa sai) thì BỔ SUNG, không vượt trần.
 */
/**
 * Kế hoạch hôm nay cho game/rương/thể lực: kế hoạch ĐÃ CHỐT (`layKeHoachChot`, không đổi bản ghi) trừ đi câu CÒN LẠI không làm được lúc này
 * (`tamHoanCauKhoa`): đang bảo vệ cho ca kiểm tra, hoặc đã rút khỏi kho. Nhờ vậy em không bị kẹt (Đảo rỗng, Đảo khoá chờ Đoàn, rương 42/46);
 * câu bảo vệ vẫn KHÔNG ra máy em. Ca công bố xong ⇒ câu tự quay lại kế hoạch hôm nay (không ghi gì vào `srs2_ke_hoach`).
 */
export async function layKeHoachHomNay(env: Env, sbd: string, nowMs: number, hs?: HoSo2, chanTruoc?: Promise<Set<string>>, omniTruoc?: Promise<boolean>): Promise<{ kh: KeHoachDaChot; hs: HoSo2 }> {
  // 29/09 (cao điểm 20h–24h): tập câu bảo vệ ca thi (dùng chung mọi em, đệm 5 s trong isolate) đọc SONG SONG với kế hoạch — trước: một đợt D1 nối tiếp sau kế hoạch.
  // `chanTruoc` (chỉ-thêm 30/09): nơi gọi đã bắt đầu đọc tập ấy (Sảnh cần lại cho Thử sức thêm) ⇒ dùng chung, không đọc hai lần.
  const chanSom = chanTruoc ?? protectedQuestions(env).catch(() => new Set<string>())
  const nghiSom = docCauNghiDem(env, nowMs) // 06/10: câu nghi đáp án — cùng đợt với kế hoạch (đệm 60 s trong isolate; không bao giờ ném)
  const r = await layKeHoachChot(env, sbd, nowMs, hs, chanSom, omniTruoc)
  return { kh: await tamHoanCauKhoa(env, r.kh, r.hs, chanSom, nghiSom), hs: r.hs }
}

/** Câu CÒN LẠI không phục vụ được vì kho: đã rút / JSON không nạp được (`kho`) hay chỉ mục nay xem là tự luận (`tuLuan`). Câu bị ca khoá KHÔNG tính ở đây. */
export const lyDoKhongPhucVu = (m: MetaCau | undefined): 'kho' | 'tuLuan' | null => (!m ? 'kho' : m.tuLuan ? 'tuLuan' : null)
/**
 * Bỏ câu CÒN LẠI đang bị ca khoá / đã rút khỏi kho / tự luận (30/09) khỏi kế hoạch (câu đã làm giữ nguyên) — thể lực, rương, trần Bi-a đều theo `tong` sau khi bỏ.
 * Lỗi đọc bảo vệ ⇒ không bỏ câu ca (nơi phát câu vẫn tự chặn). Không ghi gì vào `srs2_ke_hoach`.
 */
export async function tamHoanCauKhoa(env: Env, kh: KeHoachDaChot, hs: Pick<HoSo2, 'meta'>, chanSom?: Promise<Set<string>>, nghiSom?: Promise<ReadonlySet<string>>): Promise<KeHoachDaChot> {
  if (!kh.conDao.length && !kh.conDoan.length) return kh
  // 06/10: câu đang NGHI sai đáp án cũng tạm hoãn (cổng cuối của em không phát — chan-khac-khoi.ts): không bỏ khỏi kế hoạch thì "còn N câu" mãi, rương không mở. Đọc đệm 60 s, lỗi ⇒ rỗng.
  const [chan, nghi] = await Promise.all([chanSom ?? protectedQuestions(env).catch(() => new Set<string>()), nghiSom ?? docCauNghiDem(env)])
  let ca = 0, kho = 0, tuLuan = 0, nghiSo = 0
  const bo = new Set<string>()
  for (const k of [...kh.conDao, ...kh.conDoan]) {
    const q = qidGoc(k), m = hs.meta.get(q)
    const ly = lyDoKhongPhucVu(m)
    if (ly === 'kho') { bo.add(k); kho++ } else if (ly === 'tuLuan') { bo.add(k); tuLuan++ } else if (chan.has(q) || chan.has(m!.group)) { bo.add(k); ca++ } else if (nghi.has(tachSongSinh(q).goc)) { bo.add(k); nghiSo++ }
  }
  if (!bo.size) return kh
  const dao = kh.dao.filter((k) => !bo.has(k)), doan = kh.doan.filter((k) => !bo.has(k))
  return { ...kh, dao, doan, tong: dao.length + doan.length, conDao: kh.conDao.filter((k) => !bo.has(k)), conDoan: kh.conDoan.filter((k) => !bo.has(k)), tamHoan: { ca, kho, ...(tuLuan ? { tuLuan } : {}), ...(nghiSo ? { nghi: nghiSo } : {}) } }
}

/**
 * Ghi đè kế hoạch đã chốt CHỈ KHI bản ghi còn đúng bản đã đọc (`cu`: so `dao_json`/`doan_json`) — phản biện #108: em mở hai máy, máy đọc sớm không được
 * ghi đè kế hoạch máy kia vừa sửa. Trả `true` khi đã ghi.
 */
async function ghiKeHoachNeuChuaDoi(env: Env, sbd: string, ngay: string, cu: Row, cot: string, giaTri: unknown[]): Promise<boolean> {
  const r = await env.DB.prepare(`UPDATE srs2_ke_hoach SET ${cot} WHERE sbd = ? AND ngay = ? AND dao_json = ? AND doan_json = ?`)
    .bind(...giaTri, sbd, ngay, str(cu.dao_json), str(cu.doan_json)).run()
  return Number(r.meta?.changes ?? 0) > 0
}
/** Máy khác vừa ghi kế hoạch hôm nay ⇒ dùng bản ĐÃ CHỐT ấy (không có ⇒ bản đang cầm). */
async function docLaiKeHoach(env: Env, sbd: string, ngay: string, dem: ReadonlyMap<string, number>, duPhong: KeHoachDaChot): Promise<KeHoachDaChot> {
  const r = await env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  return r ? tuDong(r, ngay, dem) : duPhong
}
/**
 * THAY câu hỏng (tự luận / rút khỏi kho) của kế hoạch đã chốt — tại chỗ, cùng loại: câu MỚI thay bằng câu mới chưa có trong kế hoạch (quota ngày không đổi),
 * câu ÔN thay bằng câu ôn tới lịch chưa có trong kế hoạch (Đảo: ôn Đúng–sai; Đoàn: ôn phần I/III). Ứng viên theo thứ tự của `lapKeHoachNgay` (không trần,
 * đổ đầy — chỉ để xếp hàng ứng viên, KHÔNG dùng cờ rải đều hiện tại). Câu sai của ca vừa công bố KHÔNG kéo vào giữa ngày. Không thay được câu nào ⇒ `null`.
 * `chan` (câu/nhóm đang bảo vệ cho ca — phản biện vòng 2 #110): KHÔNG lấy làm câu thay (lấy vào thì `tamHoanCauKhoa` hoãn ngay, `tong` vẫn hụt 1
 * và em thấy "câu đang dùng cho ca kiểm tra" dù còn câu hợp lệ khác).
 */
export function thayCauHong(kh: KeHoachDaChot, hong: ReadonlySet<string>, hoSo: Pick<HoSo2, 'cau' | 'tt' | 'laMoiBo' | 'qidCaSai' | 'meta'>, tuyChon: TuyChonKeHoach, chan: ReadonlySet<string> = new Set()): { dao: string[]; doan: string[] } | null {
  const VO_HAN = 1_000_000
  // OMNI 3: nhiều bài (`chienDich`) / chế độ chờ cũng mở trần vô hạn, tắt rải đều ⇒ hàng ứng viên đủ dài như đường một chiến dịch.
  const omni: Partial<TuyChonKeHoach> = {
    ...(tuyChon.chienDich ? { chienDich: tuyChon.chienDich.map((c) => ({ ...c, theLucNgay: VO_HAN, raiDeu: false })) } : {}),
    ...(tuyChon.cheDoCho ? { cheDoCho: { theLuc: VO_HAN } } : {}),
  }
  const lap = lapKeHoachNgay(hoSo.cau.filter((c) => !hoSo.qidCaSai?.has(c.qid)), hoSo.tt, { ...tuyChon, raiDeu: false, tranNgay: VO_HAN, tranHuyetChien: VO_HAN, ...omni })
  const daCo = new Set([...kh.dao, ...kh.doan].map(qidGoc))
  const laMoi = (q: string) => hoSo.tt.get(q)?.laMoi ?? hoSo.laMoiBo?.has(q) ?? false
  const biChan = (q: string) => chan.has(q) || chan.has(hoSo.meta.get(q)?.group ?? '')
  const hang = (ds: readonly string[], moi: boolean) => ds.filter((q) => !daCo.has(q) && !biChan(q) && (hoSo.tt.get(q)?.laMoi ?? false) === moi)
  const ung = { daoMoi: hang(lap.dao, true), daoOn: hang(lap.dao, false), doanOn: hang(lap.doan, false) }
  let doi = 0
  const lay = (ds: string[]): string | null => {
    while (ds.length && daCo.has(ds[0]!)) ds.shift() // ứng viên đã được lấy cho câu hỏng trước (một câu có thể nằm ở hai hàng)
    const q = ds.shift() ?? null
    if (q) { daCo.add(q); doi++ }
    return q
  }
  const thayTrong = (ds: readonly string[], cuaDoan: boolean) =>
    ds.map((k) => (!hong.has(k) ? k : (cuaDoan ? lay(ung.doanOn) : laMoi(qidGoc(k)) ? lay(ung.daoMoi) : lay(ung.daoOn)) ?? k))
  const dao = thayTrong(kh.dao, false), doan = thayTrong(kh.doan, true)
  return doi ? { dao, doan } : null
}

// ---------------------------------------------------------------- OMNI 3: kế hoạch ngày nhiều bài + ôn bài cũ + chế độ chờ (chỉ khi `omniBat`)
/**
 * Bảng phụ CHỈ-THÊM, tạo lúc chạy (KHÔNG ALTER `srs2_ke_hoach`): mỗi (em, ngày) một dòng — `chien_dich_json` = TẬP id chiến dịch đã dùng lập kế hoạch hôm nay
 * (đổi giữa ngày, vd thầy vừa tick bài ⇒ lập lại giữ câu đã làm), `on_bai_cu_json` = qid câu ôn bài cũ trong kế hoạch, `met_gio` = em đã chọn "Để mai" /
 * "Làm luôn" ở gợi ý khung giờ hôm nay. Chỉ ghi khi OMNI bật cho em. Xoá bảng ⇒ lần mở kế tiếp tự dựng lại (tập = chiến dịch của bản ghi kế hoạch).
 */
export const LENH_TAO_BANG_KE_HOACH_OMNI = 'CREATE TABLE IF NOT EXISTS srs2_ke_hoach_omni (sbd TEXT NOT NULL, ngay TEXT NOT NULL, chien_dich_json TEXT, on_bai_cu_json TEXT, met_gio TEXT, cap_nhat_luc TEXT, PRIMARY KEY (sbd, ngay))'
export interface KeHoachOmniLuu { chienDich: string[] | null; onBaiCu: string[]; metGio: 'de_mai' | 'lam_luon' | null }
/** Dòng bảng phụ OMNI của (em, ngày); chưa có bảng / chưa có dòng / lỗi ⇒ null. */
export async function docKeHoachOmni(env: Env, sbd: string, ngay: string): Promise<KeHoachOmniLuu | null> {
  const r = await env.DB.prepare('SELECT chien_dich_json, on_bai_cu_json, met_gio FROM srs2_ke_hoach_omni WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  if (!r) return null
  const mg = str(r.met_gio)
  return { chienDich: r.chien_dich_json == null ? null : parseMang(r.chien_dich_json), onBaiCu: parseMang(r.on_bai_cu_json), metGio: mg === 'de_mai' || mg === 'lam_luon' ? mg : null }
}
/** Quyết định "Để mai" / "Làm luôn" của em hôm nay ở gợi ý khung giờ mệt (null ⇒ chưa chọn) — làn OMNI D1 đọc để không gợi ý lại trong ngày. */
export async function docQuyetMetGio(env: Env, sbd: string, nowMs: number): Promise<'de_mai' | 'lam_luon' | null> {
  return (await docKeHoachOmni(env, sbd, ngayVnCua(nowMs)))?.metGio ?? null
}
async function ghiKeHoachOmni(env: Env, sbd: string, ngay: string, chienDich: readonly string[], onBaiCu: readonly string[], nowMs: number): Promise<void> {
  await chayDdlMotLan(env, 'srs2_ke_hoach_omni', [LENH_TAO_BANG_KE_HOACH_OMNI])
  await lenhGhiKeHoachOmni(env, sbd, ngay, chienDich, onBaiCu, nowMs, false).run()
}
/** Câu ghi dòng bảng phụ OMNI. `sauInsertThang` (tối ưu 05/10): đặt NGAY sau câu INSERT kế hoạch trong cùng lô — chỉ ghi khi câu ấy vừa chèn được (`changes() = 1`). */
function lenhGhiKeHoachOmni(env: Env, sbd: string, ngay: string, chienDich: readonly string[], onBaiCu: readonly string[], nowMs: number, sauInsertThang: boolean): D1PreparedStatement {
  const nguon = sauInsertThang ? 'SELECT ?,?,?,?,? WHERE changes() = 1' : 'VALUES (?,?,?,?,?)'
  return env.DB.prepare(`INSERT INTO srs2_ke_hoach_omni (sbd, ngay, chien_dich_json, on_bai_cu_json, cap_nhat_luc) ${nguon}
      ON CONFLICT(sbd, ngay) DO UPDATE SET chien_dich_json = excluded.chien_dich_json, on_bai_cu_json = excluded.on_bai_cu_json, cap_nhat_luc = excluded.cap_nhat_luc`)
    .bind(sbd, ngay, JSON.stringify([...chienDich]), JSON.stringify([...onBaiCu]), new Date(nowMs).toISOString())
}
async function ghiQuyetMetGio(env: Env, sbd: string, ngay: string, quyet: 'de_mai' | 'lam_luon', nowMs: number): Promise<void> {
  await chayDdlMotLan(env, 'srs2_ke_hoach_omni', [LENH_TAO_BANG_KE_HOACH_OMNI])
  await env.DB.prepare(`INSERT INTO srs2_ke_hoach_omni (sbd, ngay, met_gio, cap_nhat_luc) VALUES (?,?,?,?)
      ON CONFLICT(sbd, ngay) DO UPDATE SET met_gio = excluded.met_gio, cap_nhat_luc = excluded.cap_nhat_luc`).bind(sbd, ngay, quyet, new Date(nowMs).toISOString()).run()
}
/** Hai tập id chiến dịch như nhau (không kể thứ tự). */
const cungTap = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i])
/** Thể lực lớp của em (`cau_hinh.the_luc_lop` theo `lopCuaEm`); vắng / lỗi ⇒ null (nơi gọi dùng THE_LUC_MAC_DINH = 40). */
export async function theLucLopCuaEm(env: Env, sbd: string): Promise<number | null> {
  const [lop, gt] = await Promise.all([lanBaiDaDay().then((m) => m.lopCuaEm(env, sbd)).catch(() => null), docCauHinhDem(env, KHOA_THE_LUC_LOP)])
  if (!lop || !gt) return null
  try {
    const n = Number((JSON.parse(gt) as Record<string, unknown> | null)?.[lop])
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null
  } catch { return null }
}
/** Phần ĐỒNG BỘ của tuỳ chọn kế hoạch OMNI: mọi chiến dịch đang chạy (thể lực = max, Huyết Chiến gấp đôi nếu có bài cho phép) + ứng viên ôn bài cũ. */
export function tuyChonGocOmni(hoSo: HoSo2, ngay: string): TuyChonKeHoach {
  const ds = hoSo.chienDichHet ?? (hoSo.chienDich ? [hoSo.chienDich] : [])
  const cd = hoSo.chienDich
  const theLuc = ds.length ? Math.max(...ds.map((c) => c.theLucNgay)) : (hoSo.theLucNoCu || TRAN_NGAY)
  return {
    homNay: ngay, hanNop: cd?.hanNop ?? null, tranNgay: theLuc,
    ...(ds.length ? { tranHuyetChien: ds.some((c) => c.huyetChien) ? tranHuyetChienTheo(theLuc) : theLuc, raiDeu: cd?.raiDeu ?? true } : {}),
    chienDich: ds.map((c) => ({ id: c.id, hanNop: c.hanNop, theLucNgay: c.theLucNgay, raiDeu: c.raiDeu, batDau: c.batDau })),
    onBaiCu: hoSo.onBaiCu ?? [],
  }
}
/**
 * Tuỳ chọn ĐẦY ĐỦ để LẬP kế hoạch OMNI (chỉ gọi khi thật sự lập): phần đồng bộ + nhịp/kênh riêng + hạng theo dạng (như đường cũ) + hồ sơ OMNI của em
 * (`hoSoOmniEm`) ⇒ ma trận Q (`qCuaCau`) của câu chiến dịch + ứng viên ôn bài cũ ⇒ `trongSoCacCau` (chỉ khi em đã có quan sát tự làm — chưa có P ⇒ thứ tự cũ)
 * và `dangDaVung`; tỉ lệ ôn bài cũ theo ngày thứ mấy của bài hạn gần nhất (`tiLeOnBaiCu`); chế độ chờ ⇒ `theLucCho(thể lực lớp)`. Lỗi phần OMNI ⇒ bỏ phần ấy.
 */
export async function tuyChonKeHoachOmni(env: Env, sbd: string, nowMs: number, hoSo: HoSo2, som?: DocLapSom | null): Promise<TuyChonKeHoach> {
  const ngay = ngayVnCua(nowMs)
  const rieng = async (): Promise<Partial<TuyChonKeHoach>> => {
    const nk = await (som?.nk ?? docNhipKenh(env, sbd, nowMs))
    if (!nk) return {}
    const noDenHan = hoSo.cau.filter((c) => c.nguon === 'no_cu' && (hoSo.tt.get(c.qid)?.henOn ?? '9') <= ngay).length
    return { tiLeNo: tiLeNoRieng(noDenHan, nk.nhipNgay), ...(onVaoDaoRieng(nk.luotDao, nk.luotDoan) ? { onVaoDao: true } : {}) }
  }
  const cauQ = [...hoSo.cau.filter((c) => (c.nguon ?? 'chien_dich') === 'chien_dich'), ...(hoSo.onBaiCu ?? [])]
  const [r, hang, hsOmni, q, theLucLop] = await Promise.all([
    rieng().catch(() => ({})),
    docHangEm(env, sbd, hoSo, som?.hd).catch(() => null),
    lanOmniD1().then((m) => m.hoSoOmniEm(env, sbd, nowMs)).catch(() => null),
    cauQ.length ? lanOmniD1().then((m) => m.qCuaCau(env, cauQ.map((c) => c.qid))).catch(() => null) : Promise.resolve(null),
    hoSo.omni?.cheDoCho ? theLucLopCuaEm(env, sbd).catch(() => null) : Promise.resolve(null),
  ])
  let trongSoCau: Record<string, number> | undefined
  let dangVung: string[] = []
  if (hsOmni && q?.size) {
    const ds: QCau[] = [...q.values()]
    try {
      if (Object.values(hsOmni.vkn).some((v) => v.nTuLam > 0)) trongSoCau = trongSoCacCau(hsOmni, ds)
      dangVung = dangDaVung(hsOmni, ds)
    } catch { trongSoCau = undefined; dangVung = [] }
  }
  const cd = hoSo.chienDich
  // Ôn bài cũ khi CHƯA có trọng số OMNI (prompt tick bài mục C): dạng yếu trước (hạng theo dạng L1 → L4), giữ thứ tự docHoSo2 (tới lịch → chưa gặp →
  // chưa tới lịch; bài gần nhất trước) trong cùng hạng.
  const hangSo = (c: CauSrs): number => ({ L1: 0, L2: 1, L3: 2, L4: 3 } as const)[hang?.hangTheoDang?.[c.dang ?? ''] ?? hang?.hangChung ?? 'L2']
  const onBaiCu = !trongSoCau && hang ? (hoSo.onBaiCu ?? []).map((c, i) => [c, i] as const).sort((a, b) => hangSo(a[0]) - hangSo(b[0]) || a[1] - b[1]).map(([c]) => c) : (hoSo.onBaiCu ?? [])
  return {
    ...tuyChonGocOmni(hoSo, ngay), ...r, ...(hang ?? {}),
    onBaiCu,
    ...(trongSoCau ? { trongSoCau } : {}),
    ...(dangVung.length ? { dangVung } : {}),
    tiLeOnBaiCu: tiLeOnBaiCu(cd ? soNgayGiua(cd.batDau, ngay) + 1 : null),
    ...(hoSo.omni?.cheDoCho ? { cheDoCho: { theLuc: theLucCho(theLucLop ?? THAM_SO_OMNI.THE_LUC_MAC_DINH) } } : {}),
  }
}
/**
 * Kế hoạch HÔM NAY khi OMNI bật — cùng luật chốt của đường cũ (lập một lần, đọc lại; câu hỏng thay tại chỗ; ngày hạn bổ sung câu sai trong ngày), khác:
 * nhiều bài song song + ôn bài cũ + chế độ chờ (`tuyChonKeHoachOmni`); kế hoạch đã chốt mà TẬP chiến dịch đổi (thầy vừa tick bài / bài hết hạn) ⇒ lập lại
 * GIỮ câu đã làm (như đổi `chien_dich_id`), quota câu mới trừ phần đã làm theo TỪNG bài; tập + câu ôn bài cũ lưu ở `srs2_ke_hoach_omni`.
 */
async function layKeHoachChotOmni(env: Env, sbd: string, nowMs: number, hoSo: HoSo2, dem: ReadonlyMap<string, number>, cu: Row | null, luu: KeHoachOmniLuu | null, chanSom?: Promise<Set<string>>, lapSom?: DocLapSom | null): Promise<{ kh: KeHoachDaChot; hs: HoSo2 }> {
  const ngay = ngayVnCua(nowMs)
  const cd = hoSo.chienDich
  const tapCd = (hoSo.chienDichHet ?? (cd ? [cd] : [])).map((c) => c.id)
  const ungVienOn = new Set((hoSo.onBaiCu ?? []).map((c) => c.qid))
  const kemOn = (kh: KeHoachDaChot, on: readonly string[]): KeHoachDaChot => ({ ...kh, onBaiCu: [...on] })
  if (cu) {
    let kh = tuDong(cu, ngay, dem)
    const onLuu = luu?.onBaiCu ?? []
    const tapLuu = luu?.chienDich ?? (kh.chienDichId ? [kh.chienDichId] : [])
    const onSaiLuat = kh.conDoan.some((k) => hoSo.tt.get(qidGoc(k))?.laMoi)
    if (!cungTap(tapLuu, tapCd) || (kh.chienDichId ?? null) !== (cd?.id ?? null) || onSaiLuat) {
      const xongDao = kh.dao.filter((k) => !kh.conDao.includes(k))
      const xongDoan = kh.doan.filter((k) => !kh.conDoan.includes(k))
      const xong = new Set([...xongDao, ...xongDoan].map(qidGoc))
      // Câu MỚI đã làm hôm nay (lần đầu rơi đúng hôm nay) ⇒ quota hôm nay của TỪNG bài trừ phần này.
      const moiHomNay = [...xong].filter((q) => hoSo.tt.get(q)?.lichSu[0]?.ngay === ngay)
      const cdCua = new Map(hoSo.cau.filter((c) => c.cd).map((c) => [c.qid, c.cd!] as const))
      const moiDaLamTheoCd: Record<string, number> = {}
      for (const q of moiHomNay) { const id = cdCua.get(q); if (id) moiDaLamTheoCd[id] = (moiDaLamTheoCd[id] ?? 0) + 1 }
      const tc = await tuyChonKeHoachOmni(env, sbd, nowMs, hoSo)
      const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, { ...tc, moiDaLamHomNay: moiHomNay.length, moiDaLamTheoCd, onBaiCu: (tc.onBaiCu ?? []).filter((c) => !xong.has(c.qid)) }, xongDao.length + xongDoan.length)
      const dao = [...xongDao, ...themLanLam([...xongDao, ...xongDoan], lap.dao)]
      const doan = [...xongDoan, ...themLanLam([...dao, ...xongDoan], lap.doan)]
      const on = [...new Set([...onLuu.filter((q) => xong.has(q)), ...(lap.onBaiCu ?? [])])]
      const ghi = await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu, 'chien_dich_id = ?, dao_json = ?, doan_json = ?, huyet_chien = ?, tong = ?',
        [cd?.id ?? null, JSON.stringify(dao), JSON.stringify(doan), lap.huyetChien ? 1 : 0, dao.length + doan.length])
      if (ghi) {
        await ghiKeHoachOmni(env, sbd, ngay, tapCd, on, nowMs).catch(() => undefined)
        return { kh: kemOn(hoanThien(ngay, cd?.id ?? null, dao, doan, lap.huyetChien, dem), on), hs: hoSo }
      }
      // Máy khác vừa ghi ⇒ dùng bản ĐÃ CHỐT ấy (và tập/câu ôn bài cũ nó đã ghi).
      const [lai, luuLai] = await Promise.all([docLaiKeHoach(env, sbd, ngay, dem, kh), docKeHoachOmni(env, sbd, ngay)])
      return { kh: kemOn(lai, luuLai?.onBaiCu ?? onLuu), hs: hoSo }
    }
    // Câu không phục vụ được (tự luận / rút khỏi kho) ⇒ thay tại chỗ như đường cũ (mới thay mới, ôn thay ôn); câu ôn bài cũ thay vào được ghi lại.
    let on = onLuu
    const hongCua = (x: KeHoachDaChot) => new Set([...x.conDao, ...x.conDoan].filter((k) => lyDoKhongPhucVu(hoSo.meta.get(qidGoc(k))) !== null))
    const hong = hongCua(kh)
    if (hong.size) {
      const chan = await (chanSom ?? protectedQuestions(env)).catch(() => new Set<string>())
      const thay = thayCauHong(kh, hong, hoSo, tuyChonGocOmni(hoSo, ngay), chan)
      if (thay) {
        const ghi = await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu, 'dao_json = ?, doan_json = ?, tong = ?', [JSON.stringify(thay.dao), JSON.stringify(thay.doan), thay.dao.length + thay.doan.length])
        if (ghi) {
          kh = hoanThien(ngay, kh.chienDichId, thay.dao, thay.doan, kh.huyetChien, dem)
          const trong = new Set([...thay.dao, ...thay.doan].map(qidGoc))
          const onMoi = [...new Set([...on.filter((q) => trong.has(q)), ...[...trong].filter((q) => ungVienOn.has(q))])]
          if (!cungTap(onMoi, on)) { on = onMoi; await ghiKeHoachOmni(env, sbd, ngay, luu?.chienDich ?? tapCd, on, nowMs).catch(() => undefined) }
        } else {
          kh = await docLaiKeHoach(env, sbd, ngay, dem, kh)
          on = (await docKeHoachOmni(env, sbd, ngay))?.onBaiCu ?? on
        }
      }
    }
    // Ngày hạn của bài hạn gần nhất, làm hết kế hoạch: bổ sung câu sai trong ngày như đường cũ — CHỈ câu của bài ấy + nợ (không câu mới bài khác, không ôn bài cũ).
    const soHong = kh.conDao.length + kh.conDoan.length ? hongCua(kh).size : 0
    if (cd && cd.hanNop === ngay && kh.conDao.length + kh.conDoan.length - soHong === 0) {
      const tc = await tuyChonKeHoachOmni(env, sbd, nowMs, hoSo)
      const cauBoSung = hoSo.cau.filter((c) => !hoSo.qidCaSai?.has(c.qid) && !(c.cd && c.cd !== cd.id && hoSo.tt.get(c.qid)?.laMoi))
      const them = lapKeHoachNgay(cauBoSung, hoSo.tt, { ...tc, chienDich: (tc.chienDich ?? []).filter((c) => c.id === cd.id), onBaiCu: [] }, kh.tong - soHong)
      if (them.dao.length + them.doan.length) {
        const dao = [...kh.dao, ...themLanLam([...kh.dao, ...kh.doan], them.dao)]
        const doan = [...kh.doan, ...themLanLam([...dao, ...kh.doan], them.doan)]
        const ghi = await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu, 'dao_json = ?, doan_json = ?, tong = ?', [JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length])
        kh = ghi ? hoanThien(ngay, kh.chienDichId, dao, doan, kh.huyetChien, dem) : await docLaiKeHoach(env, sbd, ngay, dem, kh)
      }
    }
    if (!luu || luu.chienDich == null) await ghiKeHoachOmni(env, sbd, ngay, tapCd, on, nowMs).catch(() => undefined) // bản ghi chốt trước khi bật OMNI / bảng phụ bị xoá ⇒ dựng lại dòng
    return { kh: kemOn(kh, on), hs: hoSo }
  }
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, await tuyChonKeHoachOmni(env, sbd, nowMs, hoSo, lapSom))
  // Hai yêu cầu song song: bản ghi thắng là bản CHỐT, đọc lại để cả hai trả cùng một kế hoạch. Tối ưu 05/10: ghi + đọc lại dòng chốt trong MỘT lô
  // (câu đọc không phụ thuộc bảng phụ OMNI ⇒ đọc trước khi ghi bảng phụ cho kết quả y hệt) — trước: ba đợt nối tiếp.
  const lenhKeHoach = () => [
    env.DB.prepare('INSERT OR IGNORE INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, huyet_chien, tong, tao_luc) VALUES (?,?,?,?,?,?,?,?)')
      .bind(sbd, ngay, cd?.id ?? null, JSON.stringify(lap.dao), JSON.stringify(lap.doan), lap.huyetChien ? 1 : 0, lap.dao.length + lap.doan.length, new Date(nowMs).toISOString()),
    env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay),
  ]
  // Tối ưu 05/10: dòng bảng phụ OMNI ghi CÙNG lô — CHỈ khi lô này thắng (`changes() = 1` nối với câu INSERT kế hoạch; câu SELECT xen giữa không đổi `changes()`),
  // y như trước (ghi riêng sau lô khi thắng). Bảng phụ chưa dựng được / lô gộp lỗi (lô huỷ trọn) ⇒ đường cũ y hệt.
  const coBangPhu = await chayDdlMotLan(env, 'srs2_ke_hoach_omni', [LENH_TAO_BANG_KE_HOACH_OMNI]).then(() => true, () => false)
  let kq: D1Result<Row>[] | null = null
  if (coBangPhu) {
    try { kq = await env.DB.batch<Row>([...lenhKeHoach(), lenhGhiKeHoachOmni(env, sbd, ngay, tapCd, lap.onBaiCu ?? [], nowMs, true)]) } catch { kq = null }
  }
  const gopOmni = !!kq
  const [moi, docLai] = kq ?? (await env.DB.batch<Row>(lenhKeHoach()))
  const thang = Number(moi?.meta?.changes ?? 0) > 0
  const chot = docLai?.results?.[0] ?? null
  const luuMoi = thang ? (gopOmni ? null : (await ghiKeHoachOmni(env, sbd, ngay, tapCd, lap.onBaiCu ?? [], nowMs).catch(() => undefined), null)) : await docKeHoachOmni(env, sbd, ngay)
  const on = thang ? (lap.onBaiCu ?? []) : (luuMoi?.onBaiCu ?? [])
  return { kh: kemOn(chot ? tuDong(chot, ngay, dem) : hoanThien(ngay, cd?.id ?? null, lap.dao, lap.doan, lap.huyetChien, dem), on), hs: hoSo }
}

/** Hai lượt ĐỌC chỉ cần khi LẬP kế hoạch (nhịp/kênh riêng, hồ sơ dạng) — bắt đầu sớm khi biết hôm nay chưa chốt (tối ưu 05/10). Không bao giờ ném lỗi treo. */
interface DocLapSom { nk: Promise<Awaited<ReturnType<typeof docNhipKenh>>>; hd: Promise<Map<string, HoSoDangTho[]>> }
function batDauDocLap(env: Env, sbd: string, nowMs: number): DocLapSom {
  const nk = docNhipKenh(env, sbd, nowMs), hd = docHoSoDangCaLop(env, [sbd])
  nk.catch(() => {}); hd.catch(() => {})
  return { nk, hd }
}
async function layKeHoachChot(env: Env, sbd: string, nowMs: number, hs?: HoSo2, chanSom?: Promise<Set<string>>, omniTruoc?: Promise<boolean>): Promise<{ kh: KeHoachDaChot; hs: HoSo2 }> {
  const ngay = ngayVnCua(nowMs)
  // OMNI 3: hỏi cờ MỘT lần (dùng chung với docHoSo2); bật ⇒ đọc thêm bảng phụ kế hoạch OMNI CÙNG ĐỢT. Tắt ⇒ không thêm lượt đọc nào.
  // `omniTruoc` (chỉ-thêm, tối ưu 05/10): nơi gọi (Sảnh) đã hỏi đúng câu ấy ⇒ dùng chung lời hỏi.
  const omniSom = hs ? Promise.resolve(!!hs.omni?.bat) : (omniTruoc ?? omniBatEm(env, sbd))
  // Tối ưu 28/09: hồ sơ, số lần làm hôm nay và kế hoạch đã chốt là ba lượt ĐỌC độc lập ⇒ chạy SONG SONG (trước: ba đợt nối tiếp).
  const cuP = env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  // Tối ưu 05/10: hôm nay CHƯA chốt kế hoạch ⇒ đọc sẵn nhịp/kênh riêng và hồ sơ dạng (chỉ dùng khi LẬP) ngay khi biết, song song lượt đọc thứ hai
  // của hồ sơ — trước: hai đợt nối tiếp SAU hồ sơ. Đã chốt ⇒ không đọc gì thêm (như cũ).
  const lapSom: Promise<DocLapSom | null> = cuP.then((cu) => (cu ? null : batDauDocLap(env, sbd, nowMs)))
  // OMNI 3 (tối ưu 05/10): hôm nay CHƯA chốt + OMNI bật ⇒ hồ sơ OMNI của em (chỉ dùng khi LẬP — `tuyChonKeHoachOmni`) bắt đầu dựng NGAY khi biết (nhớ theo lượt
  // trong omni-d1.ts, cùng `nowMs`) — song song phần đọc hồ sơ 2.0 / ứng viên; trước: chờ hồ sơ 2.0 xong mới bắt đầu (4–6 đợt nối tiếp). Chỉ ĐỌC.
  const hsOmniSom = Promise.all([cuP, omniSom]).then(([cu, bat]) => (!cu && bat ? lanOmniD1().then((m) => m.hoSoOmniEm(env, sbd, nowMs)) : null)).catch(() => null)
  // CẨN THẬN (a): cùng lượt đọc hồ sơ trên cho biết `canThan` (S_em > 0,07) ⇒ `docHoSo2` nhân mốc duy trì × 0,7 — chỉ LÚC LẬP kế hoạch (hôm nay chưa chốt), không thêm lượt D1 nào.
  const canThanSom = hsOmniSom.then((h) => canThanTu(true, h))
  const [hoSo, dem, cu, luuOmni] = await Promise.all([
    hs ?? docHoSo2(env, sbd, ngay, omniSom, canThanSom),
    docDemHomNay(env, sbd, ngay),
    cuP,
    omniSom.then((bat) => (bat ? docKeHoachOmni(env, sbd, ngay) : null)),
  ])
  if (hoSo.omni?.bat) return layKeHoachChotOmni(env, sbd, nowMs, hoSo, dem, cu, luuOmni, chanSom, await lapSom)
  const cd = hoSo.chienDich
  // SỔ NỢ (29/09): không chiến dịch ⇒ trần = thể lực của chiến dịch vừa đóng gần nhất (mặc định 40).
  const tranNgay = cd?.theLucNgay ?? hoSo.theLucNoCu
  const tuyChonGoc = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(tranNgay ? { tranNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay, raiDeu: cd.raiDeu } : {}) }
  // Bốc câu mới cá nhân hoá (thầy 28/09): hạng theo dạng CHỈ đọc khi thật sự lập kế hoạch (kế hoạch đã chốt thì khỏi đọc).
  // Lỗi đọc hồ sơ ⇒ không có hạng ⇒ hành vi cũ (dễ trước), không làm hỏng kế hoạch.
  // CÁ NHÂN HOÁ (02/10): nhịp học riêng (tỉ lệ trần nợ) + kênh riêng (em không mở Đoàn ⇒ câu ôn vào Đảo) — ca-nhan-hoa-v2.ts.
  //   Chỉ đo khi THẬT SỰ lập kế hoạch (kế hoạch đã chốt hôm nay ⇒ không tốn truy vấn nào ở giờ cao điểm).
  const rieng = async (som?: DocLapSom | null): Promise<Partial<TuyChonKeHoach>> => {
    const nk = await (som?.nk ?? docNhipKenh(env, sbd, nowMs))
    if (!nk) return {}
    const noDenHan = hoSo.cau.filter((c) => c.nguon === 'no_cu' && (hoSo.tt.get(c.qid)?.henOn ?? '9') <= ngay).length
    return { tiLeNo: tiLeNoRieng(noDenHan, nk.nhipNgay), ...(onVaoDaoRieng(nk.luotDao, nk.luotDoan) ? { onVaoDao: true } : {}) }
  }
  // Tối ưu 05/10: nhịp/kênh và hạng theo dạng là hai lượt ĐỌC độc lập ⇒ song song (trước: nối tiếp); dùng phần đã đọc sẵn khi có.
  const tuyChonLap = async (som?: DocLapSom | null): Promise<TuyChonKeHoach> => {
    const [r, hang] = await Promise.all([rieng(som), docHangEm(env, sbd, hoSo, som?.hd).catch(() => null)])
    return { ...tuyChonGoc, ...r, ...(hang ?? {}) }
  }
  if (cu) {
    let kh = tuDong(cu, ngay, dem)
    // Thầy 28/09 ("đã giao chiến dịch test nhưng không bấm vào làm được"): kế hoạch chốt LÚC CHƯA CÓ chiến dịch (hoặc chiến dịch khác)
    // thì LẬP LẠI theo chiến dịch hiện tại — giữ các câu đã làm hôm nay (vẫn trừ vào thể lực), thêm câu mới của kế hoạch.
    // Kế hoạch đã chốt có câu ÔN (Đoàn) mà theo luật hiện tại là câu MỚI (thầy 28/09: bỏ câu ôn lấy từ lịch sử trước chiến dịch) ⇒ cũng lập lại.
    const onSaiLuat = kh.conDoan.some((k) => hoSo.tt.get(qidGoc(k))?.laMoi)
    if ((kh.chienDichId ?? null) !== (cd?.id ?? null) || onSaiLuat) {
      const xongDao = kh.dao.filter((k) => !kh.conDao.includes(k))
      const xongDoan = kh.doan.filter((k) => !kh.conDoan.includes(k))
      // Câu MỚI của kế hoạch hôm nay em đã làm: lần làm đầu tiên (từ mốc chiến dịch) rơi đúng hôm nay ⇒ quota rải đều hôm nay trừ đi phần này.
      const moiDaLamHomNay = new Set([...xongDao, ...xongDoan].map(qidGoc).filter((q) => hoSo.tt.get(q)?.lichSu[0]?.ngay === ngay)).size
      const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, { ...(await tuyChonLap()), moiDaLamHomNay }, xongDao.length + xongDoan.length)
      const dao = [...xongDao, ...themLanLam([...xongDao, ...xongDoan], lap.dao)]
      const doan = [...xongDoan, ...themLanLam([...dao, ...xongDoan], lap.doan)]
      const ghi = await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu, 'chien_dich_id = ?, dao_json = ?, doan_json = ?, huyet_chien = ?, tong = ?',
        [cd?.id ?? null, JSON.stringify(dao), JSON.stringify(doan), lap.huyetChien ? 1 : 0, dao.length + doan.length])
      return { kh: ghi ? hoanThien(ngay, cd?.id ?? null, dao, doan, lap.huyetChien, dem) : await docLaiKeHoach(env, sbd, ngay, dem, kh), hs: hoSo }
    }
    // 30/09 (sửa lỗi "Chưa tải được câu hôm nay", rương kẹt 48/49) — phản biện #108: kế hoạch chốt còn câu KHÔNG PHỤC VỤ ĐƯỢC (chỉ mục nay xem là tự luận /
    // đã rút khỏi kho) ⇒ CHỈ thay đúng các câu ấy (mới thay mới, ôn thay ôn, tối đa bằng số câu hỏng), giữ nguyên phần còn lại, thứ tự và Huyết Chiến đã chốt
    // — KHÔNG lập lại cả ngày theo cờ rải đều hiện tại. Không có câu thay ⇒ để nguyên bản ghi (`tamHoanCauKhoa` bỏ câu hỏng khỏi `tong` trong bộ nhớ).
    const hongCua = (x: KeHoachDaChot) => new Set([...x.conDao, ...x.conDoan].filter((k) => lyDoKhongPhucVu(hoSo.meta.get(qidGoc(k))) !== null))
    const hong = hongCua(kh)
    if (hong.size) {
      const chan = await (chanSom ?? protectedQuestions(env)).catch(() => new Set<string>())
      const thay = thayCauHong(kh, hong, hoSo, tuyChonGoc, chan)
      if (thay) {
        const ghi = await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu, 'dao_json = ?, doan_json = ?, tong = ?', [JSON.stringify(thay.dao), JSON.stringify(thay.doan), thay.dao.length + thay.doan.length])
        kh = ghi ? hoanThien(ngay, kh.chienDichId, thay.dao, thay.doan, kh.huyetChien, dem) : await docLaiKeHoach(env, sbd, ngay, dem, kh)
      }
    }
    // Ngày cuối: chỉ đếm câu CÒN PHỤC VỤ ĐƯỢC (phản biện vòng 2 #110 — câu hỏng không có câu thay nằm lại trong `conDao/conDoan` cho tới `tamHoanCauKhoa`,
    // trước đây chặn cả phần bổ sung "làm lại câu sai trong ngày"). Số đã làm = tong − câu còn lại (kể cả câu hỏng chưa làm).
    const soHong = kh.conDao.length + kh.conDoan.length ? hongCua(kh).size : 0
    if (cd && cd.hanNop === ngay && kh.conDao.length + kh.conDoan.length - soHong === 0) {
      // Bổ sung ngày cuối KHÔNG kéo câu `ca_sai` vào kế hoạch đã chốt: câu sai của ca vào từ lần lập kế hoạch kế tiếp (thầy 28/09).
      const them = lapKeHoachNgay(hoSo.cau.filter((c) => !hoSo.qidCaSai?.has(c.qid)), hoSo.tt, await tuyChonLap(), kh.tong - soHong)
      if (them.dao.length + them.doan.length) {
        const dao = [...kh.dao, ...themLanLam([...kh.dao, ...kh.doan], them.dao)]
        const doan = [...kh.doan, ...themLanLam([...dao, ...kh.doan], them.doan)]
        const ghi = await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu, 'dao_json = ?, doan_json = ?, tong = ?', [JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length])
        kh = ghi ? hoanThien(ngay, kh.chienDichId, dao, doan, kh.huyetChien, dem) : await docLaiKeHoach(env, sbd, ngay, dem, kh)
      }
    }
    return { kh, hs: hoSo }
  }
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, await tuyChonLap(await lapSom))
  // Hai yêu cầu song song: bản ghi thắng là bản CHỐT, đọc lại để cả hai trả cùng một kế hoạch. Tối ưu 05/10: ghi + đọc lại trong MỘT lô
  // (D1 chạy lô tuần tự trong một giao dịch ⇒ câu đọc thấy đúng dòng vừa ghi hoặc dòng đã có) — trước: hai đợt nối tiếp.
  const [, docLai] = await env.DB.batch<Row>([
    env.DB.prepare('INSERT OR IGNORE INTO srs2_ke_hoach (sbd, ngay, chien_dich_id, dao_json, doan_json, huyet_chien, tong, tao_luc) VALUES (?,?,?,?,?,?,?,?)')
      .bind(sbd, ngay, cd?.id ?? null, JSON.stringify(lap.dao), JSON.stringify(lap.doan), lap.huyetChien ? 1 : 0, lap.dao.length + lap.doan.length, new Date(nowMs).toISOString()),
    env.DB.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay),
  ])
  const chot = docLai?.results?.[0] ?? null
  return { kh: chot ? tuDong(chot, ngay, dem) : hoanThien(ngay, cd?.id ?? null, lap.dao, lap.doan, lap.huyetChien, dem), hs: hoSo }
}

// ---------------------------------------------------------------- màn Sảnh
export const LOI_KHOA_DAO = 'Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!'

export async function sanh2(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  // Tối ưu 28/09: rương hôm nay (khoá theo ngày VN, không phụ thuộc kế hoạch) đọc SONG SONG với kế hoạch.
  const chanSom = protectedQuestions(env).catch(() => new Set<string>())
  // OMNI 3 (tối ưu 05/10): phần ĐỌC của ô OMNI không phụ thuộc kế hoạch (chiến dịch của em, chứng chỉ, vé tuần, đề thử hôm nay) bắt đầu CÙNG lúc kế hoạch
  // khi OMNI bật cho em (cùng hàm hỏi cờ với kế hoạch) — trước: chờ kế hoạch ghi xong. `omniChoSanh` vẫn tự hỏi cờ như cũ.
  const omniSom = omniBatEm(env, sbd)
  const omniSanhSom = omniSom.then((bat) => (bat ? lanOmniD1().then((m) => m.docSomChoSanh(env, sbd, nowMs)) : null)).catch(() => null)
  // 01/10: chuỗi ngày học (sổ `su_kien_hoc`) đọc SONG SONG — kế hoạch ngày cũ không còn chốt 'dat' khi Hoá 2.0 bật.
  const [{ kh, hs }, ruong, chuoiNgay] = await Promise.all([
    layKeHoachHomNay(env, sbd, nowMs, undefined, chanSom, omniSom),
    docRuongHomNay(env, sbd, ngayVnCua(nowMs)),
    docChuoiNgayHoc(env, sbd, nowMs),
  ])
  const cd = hs.chienDich
  const tl = tiLeChienDich(hs.ttChienDich)
  const conLai = kh.conDao.length + kh.conDoan.length
  const thuSuc = tinhThuSucThem(kh, hs, !!ruong, await chanSom)
  const ra: Record<string, unknown> = {
    ok: true,
    cheDo2: true,
    ngay: kh.ngay,
    // Chiến dịch chưa tới ngày bắt đầu (thầy 28/09): chỉ báo tên + ngày, KHÔNG lộ câu.
    sapBatDau: hs.sapBatDau ? { id: hs.sapBatDau.id, ten: hs.sapBatDau.ten, batDau: hs.sapBatDau.batDau, hanNop: hs.sapBatDau.hanNop } : null,
    chienDich: cd ? { id: cd.id, ten: cd.ten, hanNop: cd.hanNop, D: soNgayConLai(kh.ngay, cd.hanNop), tong: tl.tong, coXat: tl.coXat, thanhThao: tl.thanhThao, canDayLai: tl.canDayLai, thanhThaoTangTu: tl.thanhThao ? null : ngayThanhThaoSomNhat(hs.ttChienDich) } : null,
    theLuc: { con: conLai, tong: kh.tong },
    huyetChien: kh.huyetChien,
    doan: { con: kh.conDoan.length },
    dao: { con: kh.conDao.length },
    khoaDao: kh.conDoan.length > 0,
    ...(kh.conDoan.length > 0 ? { loiKhoaDao: LOI_KHOA_DAO } : {}),
    ruong: { daLam: kh.tong - conLai, tong: kh.tong, moDuoc: moDuocRuong(kh.tong, kh.tong - conLai), daMo: !!ruong, ...(ruong ? { qua: JSON.parse(str(ruong.qua_json) || '{}') } : {}) },
    // 30/09: số câu CÒN LẠI đang tạm giữ vì ca kiểm tra mở — CHỈ số, không qid/mã ca (Sảnh báo rõ thay vì "chưa có câu").
    ...((kh.tamHoan?.ca ?? 0) > 0 ? { tamGiu: { ca: kh.tamHoan!.ca } } : {}),
    // THỬ SỨC THÊM (thầy 30/09): nút "Thử sức thêm (không bắt buộc)" — CHỈ cờ + cỡ lô sẽ thêm, không lộ qid.
    thuSucThem: { duoc: thuSuc.duoc, soCau: thuSuc.duoc ? thuSuc.soCau : 0 },
    // Chuỗi N ngày trên Sảnh: số ngày VN liên tiếp em có làm ≥ 1 câu (hôm nay chưa làm ⇒ giữ tới hôm qua).
    chuoiNgay,
  }
  if (!hs.omni?.bat) return ra
  // OMNI 3: phần thêm của Sảnh (làn OMNI D1 dựng): tổng/còn của kế hoạch, chiến dịch hạn gần nhất, số câu ôn bài cũ của kế hoạch hôm nay, chế độ chờ.
  const trongKh = new Set([...kh.dao, ...kh.doan].map(qidGoc))
  const onBaiCu = (kh.onBaiCu ?? []).filter((q) => trongKh.has(q)).length
  const som = await omniSanhSom
  const omni = await lanOmniD1().then((m) => m.omniChoSanh(env, sbd, nowMs, { tong: kh.tong, con: conLai, chienDichId: cd?.id ?? null, onBaiCu, cheDoCho: hs.omni!.cheDoCho }, som)).catch(() => null)
  return omni ? { ...ra, omni } : ra
}

/** Rương Bát Linh hôm nay của em (đã mở ⇒ dòng; chưa ⇒ null). Lỗi đọc ⇒ null. */
const docRuongHomNay = (env: Env, sbd: string, ngay: string): Promise<Row | null> =>
  env.DB.prepare('SELECT mo_luc, qua_json FROM ruong_bat_linh WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)

// ---------------------------------------------------------------- THỬ SỨC THÊM (thầy chốt 30/09)
export type LyDoKhongThuSuc = 'chua_co_chien_dich' | 'het_ngay' | 'chua_xong' | 'tam_giu_ca' | 'chua_mo_ruong' | 'du_tran' | 'het_cau_moi'
export const LOI_THU_SUC: Record<LyDoKhongThuSuc, string> = {
  chua_co_chien_dich: 'Thầy chưa giao chiến dịch nào đang chạy cho em.',
  het_ngay: 'Hôm nay là hạn nộp của chiến dịch, không còn câu của ngày mai để lấy trước.',
  chua_xong: 'Em làm xong kế hoạch hôm nay rồi mới thử sức thêm được nhé.',
  tam_giu_ca: 'Còn câu hôm nay đang tạm giữ vì lớp có ca kiểm tra. Em thử sức thêm sau khi ca kết thúc nhé.',
  chua_mo_ruong: 'Em mở Rương Bát Linh hôm nay trước, rồi thử sức thêm nhé.',
  du_tran: 'Hôm nay em đã nhận đủ số câu tối đa trong ngày.',
  het_cau_moi: 'Em đã nhận hết câu mới của chiến dịch.',
}
/** Trần lượt HÔM NAY của kế hoạch — đúng `tran` của `lapKeHoachNgay`: ngày Huyết Chiến theo trần Huyết Chiến hiện hành, ngày thường = thể lực/ngày. */
export const tranKeHoachHomNay = (cd: ChienDich, huyetChien: boolean): number => (huyetChien && cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay)

/**
 * THỬ SỨC THÊM (thầy chốt 30/09): em làm xong kế hoạch hôm nay thì được lấy TRƯỚC một lô câu MỚI của ngày mai (không bắt buộc); bấm nhiều lần được,
 * mỗi lần một lô, tới trần hôm nay thì thôi. Điều kiện (MỌI điều): có chiến dịch đang chạy và còn ngày mai trong chiến dịch; kế hoạch hôm nay (đã chốt)
 * CÒN LẠI 0 và không câu nào đang tạm giữ vì ca kiểm tra; còn câu mới chưa làm.
 * RƯƠNG (cách chọn: đơn giản, an toàn): CHỈ cho khi Rương Bát Linh hôm nay ĐÃ MỞ — hoặc kế hoạch hôm nay rỗng (không có rương để khoá). Rương là một dòng/ngày ⇒
 * `tong` tăng vì lô mới KHÔNG khoá lại rương đã mở (Sảnh đọc `daMo`), cũng không cho mở rương lần hai; làm xong lô là xong kế hoạch như thường.
 * Cỡ lô = `coLoThuSucThem` (quota câu mới NGÀY MAI theo rải đều, trần − tong), không quá số câu mới lấy được NGAY: bỏ câu tự luận / đã rút khỏi kho (vốn
 * không có trong `hs.cau`, soát lại theo `meta`), câu đang bảo vệ cho ca (`chan`: qid hoặc nhóm), câu sai của ca (chưa tới lượt), câu đã có trong kế hoạch hôm nay.
 */
export function tinhThuSucThem(kh: KeHoachDaChot, hs: Pick<HoSo2, 'chienDich' | 'cau' | 'tt' | 'meta' | 'qidCaSai'>, daMo: boolean, chan: ReadonlySet<string>): { duoc: boolean; soCau: number; lyDo: LyDoKhongThuSuc | null; ung: CauSrs[] } {
  const khong = (lyDo: LyDoKhongThuSuc) => ({ duoc: false, soCau: 0, lyDo, ung: [] as CauSrs[] })
  const cd = hs.chienDich
  if (!cd) return khong('chua_co_chien_dich')
  if (congNgay(kh.ngay, 1) > cd.hanNop) return khong('het_ngay')
  if (kh.conDao.length + kh.conDoan.length > 0) return khong('chua_xong')
  if ((kh.tamHoan?.ca ?? 0) > 0) return khong('tam_giu_ca')
  if (kh.tong > 0 && !daMo) return khong('chua_mo_ruong')
  // Câu mới còn lại — ĐÚNG tập `moi` mà `lapKeHoachNgay` ngày mai thấy (câu chiến dịch chưa làm, còn trong kho, không tự luận).
  const moi = hs.cau.filter((c) => (c.nguon ?? 'chien_dich') === 'chien_dich' && hs.tt.get(c.qid)?.laMoi === true && !hs.tt.get(c.qid)!.catTia)
  if (!moi.length) return khong('het_cau_moi')
  const lo = coLoThuSucThem(moi.length, kh.ngay, cd.hanNop, kh.tong, tranKeHoachHomNay(cd, kh.huyetChien))
  if (lo <= 0) return khong('du_tran')
  const daCo = new Set([...kh.dao, ...kh.doan].map(qidGoc))
  const ung = moi.filter((c) => {
    const m = hs.meta.get(c.qid)
    return !daCo.has(c.qid) && !hs.qidCaSai?.has(c.qid) && lyDoKhongPhucVu(m) === null && !chan.has(c.qid) && !chan.has(m!.group)
  })
  if (!ung.length) return khong('het_cau_moi')
  return { duoc: true, soCau: Math.min(lo, ung.length), lyDo: null, ung }
}

/** Hai mảng khoá kế hoạch giống hệt (cùng thứ tự). */
const cungMang = (a: readonly string[], b: readonly string[]): boolean => a.length === b.length && a.every((x, i) => x === b[i])

/**
 * Lệnh `hoa2-thu-suc-them`: thêm MỘT lô câu mới của ngày mai vào kế hoạch HÔM NAY (Đảo). Chọn câu bằng đúng bộ lọc kế hoạch (`lapKeHoachNgay` nhìn từ NGÀY MAI:
 * dễ → khó / hạng cá nhân theo dạng, đan xen theo sức em) trên tập ứng viên của `tinhThuSucThem`. Ghi so-khớp-rồi-ghi (như #110): bản ghi đổi từ lúc đọc
 * (máy khác vừa thêm lô / vừa sửa kế hoạch) ⇒ KHÔNG ghi, trả `them: 0` để máy em tải lại Sảnh — hai lần bấm cùng lúc chỉ thêm MỘT lô.
 * Không đổi lược đồ: lô nằm ngay trong `dao_json`, `tong` cập nhật theo.
 */
export async function thuSucThem(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const ngay = ngayVnCua(nowMs)
  const chanSom = protectedQuestions(env).catch(() => new Set<string>())
  const nghiSom = docCauNghiDem(env, nowMs) // 06/10: câu nghi đáp án — cùng đợt với kế hoạch
  const [goc, ruong] = await Promise.all([layKeHoachChot(env, sbd, nowMs, undefined, chanSom), docRuongHomNay(env, sbd, ngay)])
  const hs = goc.hs
  const kh = await tamHoanCauKhoa(env, goc.kh, hs, chanSom, nghiSom)
  const t = tinhThuSucThem(kh, hs, !!ruong, await chanSom)
  if (!t.duoc) return { ok: false, ma: t.lyDo, error: LOI_THU_SUC[t.lyDo!] }
  const cd = hs.chienDich!
  const hang = await docHangEm(env, sbd, hs).catch(() => null)
  // Chỉ đưa câu MỚI ứng viên vào ⇒ không nợ / củng cố / duy trì; `raiDeu: false` + trần = cỡ lô ⇒ lấy ĐÚNG `soCau` câu theo thứ tự của ngày mai.
  const lap = lapKeHoachNgay(t.ung, hs.tt, { homNay: congNgay(ngay, 1), hanNop: cd.hanNop, tranNgay: t.soCau, tranHuyetChien: t.soCau, raiDeu: false, ...(hang ?? {}) })
  const lo = [...lap.dao, ...lap.doan].slice(0, t.soCau)
  if (!lo.length) return { ok: false, ma: 'het_cau_moi', error: LOI_THU_SUC.het_cau_moi }
  const cu = await env.DB.prepare('SELECT dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
  if (!cu || !cungMang(parseMang(cu.dao_json), goc.kh.dao) || !cungMang(parseMang(cu.doan_json), goc.kh.doan)) return { ok: true, them: 0, lapLai: true }
  const dao = [...goc.kh.dao, ...themLanLam([...goc.kh.dao, ...goc.kh.doan], lo)]
  const ghi = await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu, 'dao_json = ?, tong = ?', [JSON.stringify(dao), dao.length + goc.kh.doan.length])
  return ghi ? { ok: true, them: lo.length } : { ok: true, them: 0, lapLai: true }
}

/** Gợi ý M3 cho lần phục vụ tới của câu. */
export const coGoiY = (t: TrangThaiCau | undefined): boolean => !!t && canGoiY(t)

/** CHẨN ĐOÁN (thầy, CHỈ ĐỌC — không ghi kế hoạch): máy chủ thấy gì với một em hôm nay. Dùng khi Sảnh báo "chưa có câu nào". */
export async function chanDoanEm(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const ngay = ngayVnCua(nowMs)
  const hoSo = await docHoSo2(env, sbd, ngay)
  const cd = hoSo.chienDich
  const dsCd = await docChienDichCuaEm(env, sbd)
  const hang = await docHangEm(env, sbd, hoSo).catch(() => null)
  const tranNgay = cd?.theLucNgay ?? hoSo.theLucNoCu
  const tuyChonCu = { homNay: ngay, hanNop: cd?.hanNop ?? null, ...(tranNgay ? { tranNgay } : {}), ...(cd ? { tranHuyetChien: cd.huyetChien ? tranHuyetChienTheo(cd.theLucNgay) : cd.theLucNgay, raiDeu: cd.raiDeu } : {}), ...(hang ?? {}) }
  // OMNI 3: em bật OMNI ⇒ chẩn đoán đúng tuỳ chọn kế hoạch OMNI (nhiều bài, ôn bài cũ, chế độ chờ).
  const tuyChon: TuyChonKeHoach = hoSo.omni?.bat ? await tuyChonKeHoachOmni(env, sbd, nowMs, hoSo).catch(() => tuyChonGocOmni(hoSo, ngay)) : tuyChonCu
  const lap = lapKeHoachNgay(hoSo.cau, hoSo.tt, tuyChon)
  const cu = await env.DB.prepare('SELECT chien_dich_id, tong, tao_luc, dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch((e) => ({ loi: String(e) }) as Row)
  const cauCd = hoSo.cau.filter((c) => c.nguon === 'chien_dich')
  return {
    ok: true, ngay, sbd,
    coHoa2: await cheDo2(env, sbd),
    chienDichCuaEm: dsCd.map((c) => ({ id: c.id, ten: c.ten, trangThai: c.trangThai, hanNop: c.hanNop, batDau: c.batDau, soCau: c.qids.length })),
    chienDichDangChay: cd ? { id: cd.id, hanNop: cd.hanNop, theLucNgay: cd.theLucNgay, soQid: cd.qids.length, raiDeu: cd.raiDeu, raiDeuMacDinh: cd.raiDeuMacDinh } : null,
    soMetaTimThay: hoSo.meta.size,
    soCauTuLuanBiBo: [...hoSo.meta.values()].filter((m) => m.tuLuan).length,
    soCauTrongHoSo: hoSo.cau.length,
    soCauChienDich: cauCd.length,
    soCauMoi: cauCd.filter((c) => hoSo.tt.get(c.qid)?.laMoi).length,
    keHoachDaChot: cu ? { chienDichId: cu.chien_dich_id ?? null, tong: cu.tong ?? null, taoLuc: cu.tao_luc ?? null, loi: (cu as Row).loi ?? null } : null,
    lapLaiSeRa: { dao: lap.dao.length, doan: lap.doan.length, huyetChien: lap.huyetChien, raiDeu: lap.raiDeu },
    hangTheoDang: hang?.hangTheoDang ?? null,
    hangChung: hang?.hangChung ?? null,
    ...(hoSo.omni?.bat ? {
      omni: {
        chienDichDangChay: (hoSo.chienDichHet ?? []).map((c) => ({ id: c.id, hanNop: c.hanNop, batDau: c.batDau, theLucNgay: c.theLucNgay, raiDeu: c.raiDeu, soQid: c.qids.length })),
        cheDoCho: hoSo.omni.cheDoCho,
        soUngVienOnBaiCu: hoSo.omni.onBaiCuSo,
        phamVi: hoSo.phamVi ? { soTo: hoSo.phamVi.maDe.size, soBaiDaTick: hoSo.phamVi.baiDaTick.length } : null,
        lapLaiSeRa: { onBaiCu: lap.onBaiCu?.length ?? 0, moiTheoCd: lap.moiTheoCd ?? {}, tran: lap.tran, coTrongSo: !!tuyChon.trongSoCau, dangVung: tuyChon.dangVung ?? [], cheDoCho: tuyChon.cheDoCho ?? null, tiLeOnBaiCu: tuyChon.tiLeOnBaiCu ?? null },
      },
    } : {}),
  }
}

// ---------------------------------------------------------------- OMNI 3: hồ sơ mệt — đổi thứ tự kế hoạch đã chốt
/**
 * Em bấm "Để mai" / "Làm luôn" ở dòng gợi ý khung giờ (Sảnh). 'de_mai' ⇒ bỏ khỏi kế hoạch HÔM NAY các câu MỚI chưa làm có mức Vận dụng trở lên
 * (chúng quay về quỹ câu mới, quota ngày mai tính lại), đưa câu ôn nhẹ lên trước; ghi lại bằng `ghiKeHoachNeuChuaDoi` (so bản cũ). 'lam_luon' ⇒ chỉ ghi
 * nhận (không gợi ý lại hôm nay). Trả tóm tắt kế hoạch mới { ok, theLuc:{con,tong}, dao:{con}, doan:{con} }. OMNI tắt ⇒ { ok:false }.
 * Chi tiết (làn A2): chỉ dời câu mới của bài mà NGÀY MAI vẫn là ngày giao câu mới (D_mai > 3) — không bao giờ đẩy câu mới qua mốc hạn − 3; câu ôn bài cũ chưa
 * gặp mức Vận dụng trở lên cũng dời được (không bắt buộc). "Nhẹ" = câu ôn không khó (`phanLoaiDanXen`: không 2 sao, dưới Vận dụng, sai < 2 lần). Câu đã làm giữ
 * nguyên. Quyết định ghi `srs2_ke_hoach_omni.met_gio` (`docQuyetMetGio`). Máy khác vừa đổi kế hoạch ⇒ không ghi đè, trả bản mới nhất.
 */
export async function doiThuTuMetGio(env: Env, sbd: string, nowMs: number, quyet: 'de_mai' | 'lam_luon'): Promise<Record<string, unknown>> {
  if (quyet !== 'de_mai' && quyet !== 'lam_luon') return { ok: false, error: 'Lựa chọn không hợp lệ.' }
  const ngay = ngayVnCua(nowMs)
  const chanSom = protectedQuestions(env).catch(() => new Set<string>())
  const goc = await layKeHoachChot(env, sbd, nowMs, undefined, chanSom)
  const hs = goc.hs
  if (!hs.omni?.bat) return { ok: false }
  let kh = goc.kh
  if (quyet === 'de_mai') {
    const mai = congNgay(ngay, 1)
    const hanCua = new Map((hs.chienDichHet ?? []).map((c) => [c.id, c.hanNop] as const))
    const onBaiCu = new Set(kh.onBaiCu ?? [])
    const conLai = new Set([...kh.conDao, ...kh.conDoan])
    const cauCua = new Map(hs.cau.map((c) => [c.qid, c] as const))
    const doiDuoc = (k: string): boolean => {
      if (!conLai.has(k)) return false
      const q = qidGoc(k), t = hs.tt.get(q), m = hs.meta.get(q)
      if (!t?.laMoi || !m || (HANG_MUC_DO[m.mucDo ?? ''] ?? 0) < 2) return false
      if (onBaiCu.has(q)) return true
      const c = cauCua.get(q)
      const han = c?.cd ? hanCua.get(c.cd) : hs.chienDich?.hanNop
      return !!han && soNgayConLai(mai, han) > NGAY_DEM
    }
    const nhe = (k: string): boolean => { const q = qidGoc(k), t = hs.tt.get(q); return !!t && !t.laMoi && !phanLoaiDanXen(q, t, hs.meta.get(q)).kho }
    const xep = (ds: readonly string[]): string[] => {
      const con = ds.filter((k) => !doiDuoc(k))
      const cho = con.filter((k) => conLai.has(k))
      return [...con.filter((k) => !conLai.has(k)), ...cho.filter(nhe), ...cho.filter((k) => !nhe(k))]
    }
    const dao = xep(kh.dao), doan = xep(kh.doan)
    if (!cungMang(dao, kh.dao) || !cungMang(doan, kh.doan)) {
      const cu = await env.DB.prepare('SELECT dao_json, doan_json FROM srs2_ke_hoach WHERE sbd = ? AND ngay = ?').bind(sbd, ngay).first<Row>().catch(() => null)
      const dungBan = !!cu && cungMang(parseMang(cu.dao_json), kh.dao) && cungMang(parseMang(cu.doan_json), kh.doan)
      if (dungBan && await ghiKeHoachNeuChuaDoi(env, sbd, ngay, cu!, 'dao_json = ?, doan_json = ?, tong = ?', [JSON.stringify(dao), JSON.stringify(doan), dao.length + doan.length])) {
        const trong = new Set([...dao, ...doan].map(qidGoc))
        kh = { ...kh, dao, doan, tong: dao.length + doan.length, conDao: dao.filter((k) => conLai.has(k)), conDoan: doan.filter((k) => conLai.has(k)), onBaiCu: (kh.onBaiCu ?? []).filter((q) => trong.has(q)) }
      } else {
        kh = (await layKeHoachChot(env, sbd, nowMs, hs, chanSom)).kh
      }
    }
  }
  await ghiQuyetMetGio(env, sbd, ngay, quyet, nowMs).catch(() => undefined)
  const hien = await tamHoanCauKhoa(env, kh, hs, chanSom)
  return { ok: true, theLuc: { con: hien.conDao.length + hien.conDoan.length, tong: hien.tong }, dao: { con: hien.conDao.length }, doan: { con: hien.conDoan.length } }
}
