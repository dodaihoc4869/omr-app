// Ô TRẢ LỜI NGẮN (phần III): bàn phím SỐ của điện thoại không có dấu âm và dấu phẩy (thầy 06/09, 07/09, và lệnh 21/09 "thêm 2 ô dấu âm và dấu phẩy bên cạnh các ô trả lời ngắn, quét mọi chỗ mọi app").
// Hai nút "−" và "," là NÚT HỖ TRỢ: chỉ sửa chuỗi em đang gõ, KHÔNG chuẩn hoá (em gõ gì gửi nấy; máy chủ chuẩn hoá). Mọi phép ở đây THUẦN (không React, không DOM) để test kỹ và dùng chung cho tờ phiếu HTML.
// Quy ước: dấu âm là "-" (U+002D) ở ĐẦU số (bỏ qua khoảng trắng đầu); dấu thập phân "," chèn TẠI CON TRỎ, chỉ MỘT dấu (tính cả "." em dán từ nơi khác, ví dụ "0.54").

export const DAU_AM = '-'
export const DAU_PHAY = ','

/** Kết quả một phép sửa: chuỗi mới + vị trí con trỏ mới. `null` = không đổi gì (không gọi onChange). */
export interface KetQuaSua {
  value: string
  caret: number
}

/** Đáp án đang mang dấu âm chưa (bỏ khoảng trắng đầu vì em hay gõ lỡ). */
export function laAm(v: string | null | undefined): boolean {
  return String(v ?? '').trimStart().startsWith(DAU_AM)
}

/** Đáp án đã có dấu thập phân ("," hoặc ".") chưa. */
export function coPhay(v: string | null | undefined): boolean {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('.')
}

/** ĐỔI DẤU (bật/tắt "-" ở đầu số). Ô trống ⇒ "-" (em bấm dấu trước rồi gõ số cũng được). Giữ khoảng trắng đầu. */
export function doiDau(v: string): string {
  const s = String(v ?? '')
  const dau = s.match(/^\s*/)?.[0] ?? ''
  const than = s.slice(dau.length)
  return than.startsWith(DAU_AM) ? dau + than.slice(1) : dau + DAU_AM + than
}

/** Nối "," vào CUỐI (giữ cho tương thích): đã có dấu thập phân thì không thêm — `1,,5` không phải số. */
export function themPhay(v: string): string {
  const s = String(v ?? '')
  return coPhay(s) ? s : s + DAU_PHAY
}

const kep = (n: number, max: number) => Math.max(0, Math.min(max, Number.isFinite(n) ? n : max))

/**
 * Bật/tắt dấu âm ở đầu số và đưa con trỏ theo: thêm "-" ⇒ con trỏ dịch +1 (nếu đứng sau chỗ chèn), bỏ "-" ⇒ −1 (nếu đứng sau dấu).
 * Không đổi được (ô đã đúng dạng) hoặc thêm dấu mà vượt `maxLength` ⇒ null. Bỏ dấu không bao giờ vượt.
 */
export function suaDoiDau(v: string, _tu: number, den: number, maxLength?: number): KetQuaSua | null {
  const s = String(v ?? '')
  const value = doiDau(s)
  if (value === s) return null
  if (maxLength !== undefined && value.length > maxLength) return null
  const chen = s.match(/^\s*/)?.[0].length ?? 0 // vị trí dấu âm nằm (hoặc sẽ nằm)
  const d = kep(den, s.length)
  const caret = value.length < s.length ? (d > chen ? d - 1 : d) : d >= chen ? d + 1 : d
  return { value, caret: kep(caret, value.length) }
}

/**
 * Chèn "," TẠI CON TRỎ (thay vùng đang chọn). Chỉ MỘT dấu thập phân: nếu chuỗi còn lại (sau khi bỏ vùng chọn) đã có "," hoặc "." thì không chèn (null).
 * Vượt `maxLength` ⇒ null. Không tự chèn số 0 đứng đầu — em gõ gì gửi nấy.
 */
export function suaChenPhay(v: string, tu: number, den: number, maxLength?: number): KetQuaSua | null {
  const s = String(v ?? '')
  const a = kep(Math.min(tu, den), s.length), b = kep(Math.max(tu, den), s.length)
  const truoc = s.slice(0, a), sau = s.slice(b)
  if (coPhay(truoc + sau)) return null
  const value = truoc + DAU_PHAY + sau
  if (maxLength !== undefined && value.length > maxLength) return null
  return { value, caret: a + 1 }
}

/** Nút "," có bấm được không: chưa có dấu thập phân ngoài vùng đang chọn và còn chỗ (maxLength). */
export function choPhepPhay(v: string, tu: number, den: number, maxLength?: number): boolean {
  return suaChenPhay(v, tu, den, maxLength) !== null
}
