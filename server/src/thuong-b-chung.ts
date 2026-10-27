// THƯỞNG PHẠT — PHẦN B (giải tuần · học cùng bạn · thầy/phụ huynh), thầy chốt 26/10. Đặc tả docs/ban-ve-thuong-phat-2610/DAC-TA-THUONG-PHAT-2610.md §4.
// Tệp này: hằng số + hàm dùng chung của phần B (tuần giải, công tắc, ghi tinh thể, ghi vào bảng của phần A).
//
// GHI VÀO BẢNG CỦA PHẦN A (migration-2610-thuong-phat.sql — KHÔNG tạo ở đây): `thong_bao_thuong`, `huy_hieu_em`. Mọi câu ghi vào hai bảng ấy nằm DUY NHẤT
// ở `cauThongBao` / `cauHuyHieu` dưới đây (đối chiếu tên cột khi gộp). Ghi theo lô RIÊNG, best-effort (`ghiBangPhanA`): bảng chưa có ⇒ chỉ ghi log,
// không làm hỏng phần đã ghi của B. Khoá chính do B đặt (tất định) ⇒ ghi lại không trùng.
//
// TINH THỂ = sổ `vang_so` (đặc tả §4.2). `vang_so.loai` có CHECK (loai IN ('doi','mua','hoan')) từ migration 2109 — đổi CHECK phải dựng lại bảng
// (KHÔNG chỉ-thêm) ⇒ theo ĐÚNG quy ước của phần A (thuong-luat.ts `MA_TT`): khoản cộng ghi `loai = 'doi'`, `exp_tru = 0`, LOẠI THẬT ở `ma_mon`
// ('tt-len-hang' | 'tt-moc-chuoi-doi') và khoá `tt|<loại>|…` (UNIQUE(sbd, khoa_yeu_cau) chống cộng đôi). Số dư = SUM(so_vang) không đổi luật.
import type { D1PreparedStatement, Env } from './kieu'
import { ngayVn } from './su-kien-hoc'
import { themNgay } from './ho-so-nam-kt'

export type Row = Record<string, unknown>
export const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim()
export const num = (v: unknown): number => Number(v) || 0

// ───────────────────────── HẠNG GIẢI ─────────────────────────
export const HANG = ['sat', 'dong', 'bac', 'vang', 'bachkim', 'kimcuong'] as const
export type Hang = (typeof HANG)[number]
export const laHang = (v: unknown): v is Hang => (HANG as readonly string[]).includes(str(v))
export const chuanHang = (v: unknown): Hang => (laHang(v) ? (str(v) as Hang) : 'sat')
export const hangTren = (h: Hang): Hang => HANG[Math.min(HANG.length - 1, HANG.indexOf(h) + 1)]!
export const hangDuoi = (h: Hang): Hang => HANG[Math.max(0, HANG.indexOf(h) - 1)]!
/** Tinh thể khi LÊN hạng, theo hạng MỚI (đặc tả §4.2: 20/30/40/50/60). */
export const TINH_THE_LEN_HANG: Readonly<Record<Hang, number>> = { sat: 0, dong: 20, bac: 30, vang: 40, bachkim: 50, kimcuong: 60 }
export const SO_LEN = 5
export const SO_ROI = 4
export const SO_QUAN_QUAN = 3
export const CO_NHOM = 20

// ───────────────────────── TUẦN GIẢI (giờ VN) ─────────────────────────
/** Thứ Hai (YYYY-MM-DD) của tuần chứa ngày VN `ngay`. */
export function tuanCuaNgay(ngay: string): string {
  const thu = new Date(`${ngay}T00:00:00Z`).getUTCDay() // 0 = CN
  return themNgay(ngay, -((thu + 6) % 7))
}
export const tuanCua = (nowMs: number): string => tuanCuaNgay(ngayVn(nowMs))
/** Tuần mở T2 00:00 VN … đóng CN 22:00 VN (đặc tả LUAT «Giải tuần»). */
export const batDauTuanMs = (tuan: string): number => Date.parse(`${tuan}T00:00:00+07:00`)
export const ketThucTuanMs = (tuan: string): number => Date.parse(`${themNgay(tuan, 6)}T22:00:00+07:00`)
export const hetHanGiayCua = (tuan: string, nowMs: number): number => Math.max(0, Math.floor((ketThucTuanMs(tuan) - nowMs) / 1000))

// ───────────────────────── CÔNG TẮC (cau_hinh; A làm lệnh bật/tắt) ─────────────────────────
export const KHOA_GIAI = 'thuong_giai_tuan'
export const KHOA_BAN = 'thuong_ban_be'
/** Mặc định BẬT; chỉ 'tat' (kể cả dạng JSON "\"tat\"") mới tắt. */
export const congTacBat = (giaTri: unknown): boolean => str(giaTri).replace(/^"|"$/g, '').toLowerCase() !== 'tat'
export const sqlCongTac = (env: Env): D1PreparedStatement =>
  env.DB.prepare(`SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN ('${KHOA_GIAI}', '${KHOA_BAN}')`)
export function docCongTacTuDong(rows: Row[] | undefined): { giai: boolean; banBe: boolean } {
  const m = new Map((rows ?? []).map((x) => [str(x.khoa), x.gia_tri] as const))
  return { giai: congTacBat(m.get(KHOA_GIAI)), banBe: congTacBat(m.get(KHOA_BAN)) }
}

// ───────────────────────── GHI ─────────────────────────
export const LOAI_VANG_CONG = 'doi'
/** `ma_mon` của khoản tinh thể phần B — trùng `MA_TT.lenHang` / `MA_TT.mocChuoiDoi` của phần A (thuong-luat.ts). */
export const MA_MON_B = { len_hang: 'tt-len-hang', moc_doi: 'tt-moc-chuoi-doi' } as const
/** Một dòng cộng tinh thể (INSERT OR IGNORE theo UNIQUE(sbd, khoa_yeu_cau) ⇒ chống lặp). Khoá `tt|<loại>|<khoá>`. */
export function cauTinhThe(env: Env, sbd: string, loaiTp: keyof typeof MA_MON_B, so: number, khoa: string, luc: string): D1PreparedStatement {
  return env.DB.prepare(
    `INSERT OR IGNORE INTO vang_so (sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc) VALUES (?, '${LOAI_VANG_CONG}', ?, 0, ?, ?, ?)`,
  ).bind(sbd, Math.max(0, Math.round(so)), MA_MON_B[loaiTp], `tt|${loaiTp}|${khoa}`, luc)
}

export type LoaiThongBaoB = 'cuoi_tuan' | 'moc_doi' | 'go_cua' | 'moi_ban' | 'huy_hieu'
/**
 * Bảng của A (migration-2610-thuong-phat.sql): thong_bao_thuong(em, ma, loai, du_lieu, luc, da_xem, PRIMARY KEY(em, ma)).
 * `ma` tất định theo em ⇒ INSERT OR IGNORE chống lặp. Phần A đọc `WHERE em = ? AND da_xem IS NULL` và đánh dấu qua /hs/thuong/da-xem.
 */
export const cauThongBao = (env: Env, ma: string, em: string, loai: LoaiThongBaoB, duLieu: Row, luc: string): D1PreparedStatement =>
  env.DB.prepare('INSERT OR IGNORE INTO thong_bao_thuong (em, ma, loai, du_lieu, luc) VALUES (?, ?, ?, ?, ?)').bind(em, ma, loai, JSON.stringify(duLieu), luc)
/** Bảng của A: huy_hieu_em(em, ma, ngay, du_lieu, luc, PRIMARY KEY(em, ma)) — trao một lần. */
export const cauHuyHieu = (env: Env, em: string, ma: string, ngay: string, luc: string, duLieu?: Row): D1PreparedStatement =>
  env.DB.prepare('INSERT OR IGNORE INTO huy_hieu_em (em, ma, ngay, du_lieu, luc) VALUES (?, ?, ?, ?, ?)').bind(em, ma, ngay, duLieu ? JSON.stringify(duLieu) : null, luc)

/** Lô ghi vào bảng của A — best-effort, KHÔNG ném (bảng chưa có ⇒ log). Trả true khi ghi được. */
export async function ghiBangPhanA(env: Env, cau: D1PreparedStatement[], nhan: string): Promise<boolean> {
  if (cau.length === 0) return true
  try {
    for (let i = 0; i < cau.length; i += 50) await env.DB.batch(cau.slice(i, i + 50))
    return true
  } catch (e) {
    console.error(`[thuong-b] ghi bảng phần A (${nhan}) lỗi — bỏ qua:`, e instanceof Error ? e.message : e)
    return false
  }
}

/** Bảng/cột chưa có ⇒ giá trị mặc định; lỗi khác vẫn ném. */
export async function tat<T>(f: () => Promise<T>, mac: T): Promise<T> {
  try {
    return await f()
  } catch (e) {
    if (/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) return mac
    throw e
  }
}

/** Mã công khai của một em = rowid của `hoc_sinh` (base36, tiền tố 'e'): không lộ số báo danh, tra theo rowid là chỉ mục sẵn. */
export const maCongKhai = (rowid: unknown): string => `e${Math.max(0, Math.floor(num(rowid))).toString(36)}`
export function rowidTuMa(ma: unknown): number | null {
  const m = /^e([0-9a-z]{1,10})$/.exec(str(ma))
  if (!m) return null
  const n = parseInt(m[1]!, 36)
  return Number.isSafeInteger(n) && n > 0 ? n : null
}

/** Tên bạn trong hệ thưởng (Học cùng bạn: tìm / mời / danh sách / lời mời / gõ cửa / mốc đôi · Giải tuần · khối «học cùng» của PH): ĐỦ HỌ TÊN đúng thứ tự
 *  tiếng Việt như danh sách lớp, chỉ gọn khoảng trắng — thầy 27/10 «Cho hiện đủ tên nhé, chuẩn tên nhé» (trước: `tenRutGon` «Minh Đức L.»). Rỗng ⇒ «Bạn học».
 *  Chỉ họ tên — không thêm SBD hay thông tin riêng nào khác. */
export const tenDayDu = (hoTen: unknown): string => (typeof hoTen === 'string' ? hoTen.trim().split(/\s+/).filter(Boolean).join(' ') : '') || 'Bạn học'

/** Tên lớp hiệu lực tính trong SQL (đúng luật `tenLopCuaEm` của ten-lop.ts). `h` = bí danh bảng hoc_sinh. */
export const SQL_TEN_LOP = (h: string) =>
  `CASE WHEN TRIM(COALESCE(${h}.ten_lop, '')) <> '' THEN TRIM(${h}.ten_lop) WHEN TRIM(COALESCE(${h}.lop, '')) = '12' THEN '12 - Lớp Thường' WHEN TRIM(COALESCE(${h}.lop, '')) <> '' THEN TRIM(${h}.lop) ELSE 'Chưa xếp lớp' END`
