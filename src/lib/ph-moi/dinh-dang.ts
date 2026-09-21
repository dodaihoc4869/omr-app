// Định dạng số, giờ, ngày cho app phụ huynh mới (màn chính + bảng "Mọi thứ về con"). Thuần, không phụ thuộc giờ máy: mọi mốc quy về GIỜ VIỆT NAM (UTC+7) bằng số học, kể cả máy phụ huynh đặt sai múi giờ.
const GIO_VN_MS = 7 * 3_600_000
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const hai = (n: number): string => String(n).padStart(2, '0')

/** Ngày giờ theo giờ VN từ chuỗi ISO / mốc ms; hỏng ⇒ null. */
export function tachVn(x: unknown): { y: number; m: number; d: number; h: number; p: number; thu: number } | null {
  const ms = typeof x === 'number' ? x : typeof x === 'string' ? Date.parse(x) : NaN
  if (!Number.isFinite(ms)) return null
  const t = new Date(ms + GIO_VN_MS)
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), p: t.getUTCMinutes(), thu: t.getUTCDay() }
}
/** "06:40" */
export const gioVn = (x: unknown): string => {
  const t = tachVn(x)
  return t ? `${hai(t.h)}:${hai(t.p)}` : ''
}
/** "21/09" */
export const ngayNganVn = (x: unknown): string => {
  const t = tachVn(x)
  return t ? `${hai(t.d)}/${hai(t.m)}` : ''
}
/** "Thứ Hai 21/09/2026" */
export const ngayDayDuVn = (x: unknown): string => {
  const t = tachVn(x)
  return t ? `${THU[t.thu]} ${hai(t.d)}/${hai(t.m)}/${t.y}` : ''
}
/** "Thứ Hai 21/09" */
export const thuNgayVn = (x: unknown): string => {
  const t = tachVn(x)
  return t ? `${THU[t.thu]} ${hai(t.d)}/${hai(t.m)}` : ''
}
/** Từ "YYYY-MM-DD" (ngày giờ VN của máy chủ) ⇒ "21/09". Sai dạng ⇒ "". */
export const ngayChuoiNgan = (s: unknown): string => {
  const m = typeof s === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null
  return m ? `${m[3]}/${m[2]}` : ''
}
/** "Thứ Hai" từ "YYYY-MM-DD". */
export const thuTuChuoiNgay = (s: unknown): string => {
  const m = typeof s === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(s) : null
  if (!m) return ''
  return THU[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()] ?? ''
}
/** Số kiểu Việt: 7,5 · 0,75 · 6,75 (tối đa 2 chữ số lẻ, bỏ số 0 thừa). */
export const soVn = (n: number): string => (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
/** "32 phút 10 giây" · "45 giây" · "7 phút". */
export function chuThoiGian(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  const p = Math.floor(g / 60)
  const s = g % 60
  if (p === 0) return `${s} giây`
  return s === 0 ? `${p} phút` : `${p} phút ${s} giây`
}
/** Tên viết tắt chữ cái đầu của TÊN (từ cuối) cho ảnh tròn: "Nguyễn Minh Khôi" ⇒ "K". */
export const chuCaiTen = (ten: string): string => {
  const tu = ten.trim().split(/\s+/).filter(Boolean)
  const cuoi = tu[tu.length - 1] ?? ''
  return cuoi ? cuoi.charAt(0).toLocaleUpperCase('vi') : ''
}
