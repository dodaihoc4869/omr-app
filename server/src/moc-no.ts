// MỐC TÍNH NỢ của "Dồn về đích" (thầy lệnh 21/09 15:52: "Còn lại những ngày trước trong thẻ về đích chỉ cho tính từ 12h trưa hôm nay thôi, những ngày trước đó không tính").
// Mốc = NGÀY VN của `cau_hinh.bang_tin_tu` (mốc của Bảng tin); khoá riêng `cau_hinh.ve_dich_tu` (ISO hoặc YYYY-MM-DD) nếu có thì THẮNG; vắng / hỏng cả hai ⇒ hằng `NGAY_MOC_NO_MAC_DINH`.
// Món nợ (chặng bài tập về nhà theo mốc GỐC, câu ôn quá lịch, gói gia đình) có `ngay` < mốc ⇒ không phải nợ. Việc của đúng ngày mốc VẪN tính.
const ngayVnCuaMs = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

/** Mốc HIỂN THỊ chung của ba app (thầy chốt 21/09 16:10: mọi con số hiển thị chỉ tính từ 12:00 trưa 21/09). Đọc: `hien_thi_tu` ⇒ `ve_dich_tu` (riêng cho Dồn về đích) ⇒ `bang_tin_tu` ⇒ hằng. */
export const KHOA_HIEN_THI_TU = 'hien_thi_tu'
export const KHOA_VE_DICH_TU = 've_dich_tu'
export const KHOA_MOC_BANG_TIN_NO = 'bang_tin_tu'
export const NGAY_MOC_NO_MAC_DINH = '2026-09-21'
/** Mốc mặc định theo GIỜ: 12:00 trưa 21/09 giờ VN. */
export const MOC_HIEN_THI_MAC_DINH_ISO = '2026-09-21T05:00:00.000Z'

/** Một giá trị cấu hình → ngày VN `YYYY-MM-DD`: ISO có giờ ⇒ ngày VN của mốc; đã là ngày hợp lệ ⇒ chính nó; khác ⇒ null. */
export function ngayCuaCauHinh(v: unknown): string | null {
  const t = (v === null || v === undefined ? '' : String(v)).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return Number.isFinite(Date.parse(`${t}T00:00:00Z`)) ? t : null
  if (t.includes('T')) {
    const ms = Date.parse(t)
    return Number.isFinite(ms) ? ngayVnCuaMs(ms) : null
  }
  return null
}

/** MỘT hàm đọc mốc dùng chung: nhận các giá trị cấu hình THEO THỨ TỰ ƯU TIÊN (`hien_thi_tu`, `ve_dich_tu`, `bang_tin_tu`) → mốc đầu tiên hợp lệ, vắng hết ⇒ mặc định. Trả ms của mốc (ISO có giờ giữ nguyên giờ; `YYYY-MM-DD` = 00:00 giờ VN). */
export function docMocHienThiMs(...uuTien: unknown[]): number {
  for (const v of uuTien) {
    const t = (v === null || v === undefined ? '' : String(v)).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(t) && Number.isFinite(Date.parse(`${t}T00:00:00Z`))) return Date.parse(`${t}T00:00:00+07:00`)
    if (t.includes('T') && Number.isFinite(Date.parse(t))) return Date.parse(t)
  }
  return Date.parse(MOC_HIEN_THI_MAC_DINH_ISO)
}

/** Ngày VN của mốc tính nợ (theo ngày: việc của đúng ngày mốc VẪN tính). Tham số theo thứ tự ưu tiên như `docMocHienThiMs`. */
export function docMocNo(...uuTien: unknown[]): string {
  return ngayVnCuaMs(docMocHienThiMs(...uuTien))
}

/** 00:00 giờ VN của ngày mốc, tính bằng ms. */
export const dauNgayMocMs = (ngayMoc: string): number => Date.parse(`${ngayMoc}T00:00:00+07:00`)

/**
 * Bài giao lúc `giaoLuc` có thuộc diện "từ ngày mốc" không (thầy nói rõ 21/09 15:55: bài giao TRƯỚC ngày mốc không hiện trong thẻ, không nợ, không mở nộp trễ).
 * `giaoLuc` vắng / hỏng ⇒ `khiHong` (mặc định `true`: không giấu bài vì thiếu dữ liệu; CỔNG NỘP TRỄ truyền `false`: hỏng = coi là bài cũ, đóng chặt hơn).
 */
export function baiTuNgayMoc(giaoLuc: unknown, ngayMoc: string, khiHong = true): boolean {
  const g = Date.parse((giaoLuc === null || giaoLuc === undefined ? '' : String(giaoLuc)).trim())
  return Number.isFinite(g) ? g >= dauNgayMocMs(ngayMoc) : khiHong
}

/** Mốc HIỂN THỊ đã giải: `iso` (lọc `luc >= mốc`), `ms`, `ngayVn` (lọc `ngay_vn >= ngày mốc`). */
export interface MocHienThi { iso: string; ms: number; ngayVn: string }

/** Giải mốc từ các giá trị cấu hình THEO THỨ TỰ ƯU TIÊN (thuần, không IO). */
export function giaiMocHienThi(...uuTien: unknown[]): MocHienThi {
  const ms = docMocHienThiMs(...uuTien)
  return { iso: new Date(ms).toISOString(), ms, ngayVn: ngayVnCuaMs(ms) }
}

/**
 * MỘT hàm đọc mốc dùng chung ở máy chủ (thầy chốt 21/09 16:10): `cau_hinh.hien_thi_tu` ⇒ `cau_hinh.ve_dich_tu` ⇒ `cau_hinh.bang_tin_tu` ⇒ hằng `2026-09-21T05:00:00.000Z` (12:00 trưa 21/09 giờ VN). MỘT truy vấn `cau_hinh`;
 * lỗi đọc / thiếu bảng ⇒ mặc định (không ném). Nơi đã có sẵn truy vấn `cau_hinh` thì đọc ba khoá đó rồi gọi `giaiMocHienThi` thay vì gọi hàm này (đỡ một truy vấn).
 */
export async function docMocHienThi(env: { DB: { prepare(q: string): { bind(...a: unknown[]): { all<T>(): Promise<{ results?: T[] }> } } } }): Promise<MocHienThi> {
  try {
    const r = await env.DB.prepare('SELECT khoa, gia_tri FROM cau_hinh WHERE khoa IN (?, ?, ?)').bind(KHOA_HIEN_THI_TU, KHOA_VE_DICH_TU, KHOA_MOC_BANG_TIN_NO).all<{ khoa?: unknown; gia_tri?: unknown }>()
    const c = new Map((r.results ?? []).map((x) => [String(x.khoa ?? ''), x.gia_tri]))
    return giaiMocHienThi(c.get(KHOA_HIEN_THI_TU), c.get(KHOA_VE_DICH_TU), c.get(KHOA_MOC_BANG_TIN_NO))
  } catch {
    return giaiMocHienThi()
  }
}
