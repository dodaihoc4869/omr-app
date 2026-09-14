/**
 * ĐỊA CHỈ MÁY CHỦ GAME.
 *
 * Đây KHÔNG phải bí mật — chỉ là tên miền công khai của Worker. Không có khoá,
 * không có token nào trong tệp này, và tầng đỏ cấm nhúng bí mật vào máy khách.
 *
 * Cho phép ghi đè bằng localStorage để thầy thử máy chủ tạm mà không phải dựng
 * lại app.
 */
const MAC_DINH = 'https://omr-game.ttadodaihoc.workers.dev'
const KHOA = 'gcc_dia_chi_may_chu'

export function diaChiMayChu(): string {
  try {
    const cu = localStorage.getItem(KHOA)
    if (cu && /^https?:\/\//.test(cu)) return cu.replace(/\/+$/, '')
  } catch { /* chế độ ẩn danh */ }
  return MAC_DINH
}

export function datDiaChiMayChu(u: string): void {
  try {
    if (u.trim() === '') localStorage.removeItem(KHOA)
    else localStorage.setItem(KHOA, u.trim().replace(/\/+$/, ''))
  } catch { /* chế độ ẩn danh */ }
}
