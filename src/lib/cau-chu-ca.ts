/** Câu báo khi thầy gõ mã ca mà máy chủ không có ca ấy (màn Chi tiết ca thi).
 *
 * Chỉ nhắc "danh sách ca thi bên dưới" khi bên dưới CÓ danh sách gợi ý — sau reset dữ liệu chưa có ca nào, câu ấy trỏ vào khoảng trống. */
export function loiKhongTimThayCa(ma: string, coDanhSachGoiY: boolean): string {
  return `Không tìm thấy ca kiểm tra #${ma.trim()}. Bạn hãy kiểm tra lại mã ca${coDanhSachGoiY ? ' hoặc chọn từ danh sách ca kiểm tra bên dưới' : ''}.`
}
