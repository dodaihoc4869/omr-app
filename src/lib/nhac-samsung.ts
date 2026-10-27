// NHẮC SAMSUNG INTERNET (27/10): trình duyệt Samsung Internet bật chế độ tối thì TỰ ÉP TỐI trang theo kiểu của nó, bỏ qua thiết kế tối riêng của app học sinh
// (nút ra navy, thanh tiến độ chìm). Không đo được trang có đang bị ép hay không ⇒ máy Samsung Internet thấy MỘT thẻ nhắc trên Lộ trình, MỘT lần.
// Nhớ «đã nhắc» ở localStorage; đọc / ghi bị chặn (chế độ riêng tư, dữ liệu trang bị xoá) ⇒ cờ trong bộ nhớ giữ «một lần trong phiên».
export const KHOA_NHAC_SAMSUNG = 'ddh.nhac-samsung-toi'

/** Máy đang mở bằng Samsung Internet (chuỗi nhận diện có `SamsungBrowser`). */
export function laSamsungInternet(ua?: string): boolean {
  try { return /SamsungBrowser/.test(ua ?? navigator.userAgent) } catch { return false }
}

type Kho = Pick<Storage, 'getItem' | 'setItem'> | null
const khoMay = (): Kho => { try { return localStorage } catch { return null } }
let daNhacPhien = false

/** Chưa nhắc lần nào (trên máy này, và trong phiên này). */
export function canNhacSamsung(kho: Kho = khoMay()): boolean {
  if (daNhacPhien) return false
  try { return kho?.getItem(KHOA_NHAC_SAMSUNG) !== '1' } catch { return true }
}

/** Ghi «đã nhắc»: luôn nhớ trong phiên; nhớ trên máy nếu ghi được. */
export function ghiDaNhacSamsung(kho: Kho = khoMay()): void {
  daNhacPhien = true
  try { kho?.setItem(KHOA_NHAC_SAMSUNG, '1') } catch { /* bị chặn: chỉ nhớ trong phiên */ }
}

/** Chỉ cho test: quên cờ trong phiên. */
export function _quenPhienNhacSamsung(): void { daNhacPhien = false }
