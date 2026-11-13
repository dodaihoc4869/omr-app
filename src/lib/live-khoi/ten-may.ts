// TÊN MÁY BÙ CHỖ của trò «Sinh Tồn» bản 2 (thầy duyệt 13/11; đặc tả docs/dac-ta-sinh-ton-v2-1311.md mục «Máy bù mang tên như học sinh») — thuần, không DOM.
// Máy bù mang tên gọi như một bạn trong lớp (không có nhãn «Máy» trên màn). Mã máy `~<chỉ số tên>-<số thứ tự>`: MÁY CHỦ chọn chỉ số lúc tạo máy
// (sinh-ton-may.ts `khopMay`), tránh tên em thật trong phòng / danh sách lớp, không trùng giữa các máy cùng phòng; chỉ số giữ nguyên suốt ván.
// Máy em chỉ cần `tenMay(id)` để hiện tên — không gửi thêm byte nào trong ảnh chụp.

/** Kho tên gọi 2 chữ (không trùng nhau). Chỉ THÊM vào cuối, không xoá / đổi chỗ (chỉ số nằm trong mã máy của ván đang chạy). */
export const KHO_TEN = [
  'Bảo Ngọc', 'Quốc Huy', 'Thu Trang', 'Tuấn Kiệt', 'Hải Yến', 'Đăng Khoa', 'Minh Châu', 'Gia Bảo', 'Khánh Linh', 'Đức Anh',
  'Phương Thảo', 'Hoàng Nam', 'Ngọc Ánh', 'Trung Kiên', 'Mai Anh', 'Thành Đạt', 'Thuỳ Dương', 'Văn Hiếu', 'Diệu Linh', 'Quang Minh',
  'Hà My', 'Nhật Minh', 'Thanh Hằng', 'Bảo Long', 'Kim Ngân', 'Hữu Phước', 'Lan Chi', 'Đình Phong', 'Tú Anh', 'Mạnh Cường',
  'Yến Nhi', 'Công Vinh', 'Thảo Vy', 'Anh Quân', 'Bích Ngọc', 'Hoài Nam', 'Như Quỳnh', 'Tiến Dũng', 'Cẩm Tú', 'Phúc Lâm',
  'Hồng Nhung', 'Minh Khang', 'Thu Hà', 'Xuân Trường', 'Ngọc Hân', 'Đức Thịnh', 'Quỳnh Anh', 'Bá Hùng', 'Tường Vi', 'Khải Hoàn',
  'Hải Đăng', 'Mỹ Duyên', 'Trọng Nghĩa', 'Vân Khánh', 'Duy Mạnh', 'Thanh Tâm', 'Gia Huy', 'Phương Linh', 'Hoàng Long', 'Kiều Oanh',
  'Minh Triết', 'Thu Uyên', 'Quốc Bảo', 'Ngân Hà', 'Tấn Phát', 'Hạnh Dung', 'Đông Quân', 'Bảo Trâm', 'Việt Hoàng', 'Thanh Trúc',
  'Nhật Hào', 'Khánh Vy', 'Huy Hoàng', 'Lệ Quyên', 'Sơn Tùng', 'Mai Phương', 'An Khang', 'Thiên Kim', 'Đắc Lộc', 'Hương Giang',
  'Trí Dũng', 'Ngọc Diệp', 'Thế Vinh', 'Bảo Châu', 'Hiền Thục', 'Quang Vinh',
] as const

/** Chuẩn hoá để so tên: NFC, chữ thường, một khoảng trắng. */
export const chuanTen = (ten: string): string => ten.normalize('NFC').toLowerCase().trim().split(/\s+/).join(' ')
/** Tên gọi như màn trò hiện (hai chữ cuối, đã chuẩn hoá) — tên em thật đem so với kho phải qua đây. */
export const tenGoi = (ten: string): string => chuanTen(ten).split(' ').slice(-2).join(' ')
let khoGoi: string[] | null = null
/** `tenGoi` của từng tên trong kho (tính một lần). */
export const khoTenGoi = (): readonly string[] => (khoGoi ??= KHO_TEN.map(tenGoi))

const MA = /^~(\d{1,4})-(\d{1,4})$/
/** Mã máy mang chỉ số tên ⇒ tên gọi của máy; mã không hợp lệ (không phải máy, sai dạng, chỉ số ngoài kho) ⇒ null. */
export function tenMay(id: string): string | null {
  const k = typeof id === 'string' ? MA.exec(id) : null
  if (!k) return null
  const i = Number(k[1])
  return i < KHO_TEN.length ? KHO_TEN[i] : null
}
/** Chỉ số tên trong mã máy (mã sai dạng ⇒ -1). */
export const chiSoTen = (id: string): number => { const k = MA.exec(id); return k ? Number(k[1]) : -1 }
/** Số thứ tự trong mã máy (mã sai dạng ⇒ -1). */
export const soThuTuMay = (id: string): number => { const k = MA.exec(id); return k ? Number(k[2]) : -1 }
/** Dựng mã máy từ chỉ số tên + số thứ tự. */
export const maMay = (chiSo: number, so: number): string => `~${chiSo}-${so}`
