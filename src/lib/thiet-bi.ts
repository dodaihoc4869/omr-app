// ID THIẾT BỊ (QUANLYCATHI.md mục 1): sinh ngẫu nhiên 1 lần, lưu localStorage
// máy em — để máy chủ phân biệt "mở lại vì rớt mạng" (cùng id → khôi phục) với
// "mượn máy bạn thi hộ" (khác id → chặn). Không phải định danh cá nhân, không
// gửi kèm gì ngoài mã ca + SBD; xoá dữ liệu trình duyệt thì thành máy mới.
const KHOA = 'ddh_id_thiet_bi'

function sinhId(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  if (c && typeof c.getRandomValues === 'function') {
    const b = new Uint8Array(16)
    c.getRandomValues(b)
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function layIdThietBi(): string {
  try {
    const cu = localStorage.getItem(KHOA)
    if (cu) return cu
    const moi = sinhId()
    localStorage.setItem(KHOA, moi)
    return moi
  } catch {
    // localStorage bị chặn (chế độ riêng tư khắt khe) → id tạm cho phiên này
    return sinhId()
  }
}
