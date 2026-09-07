// TÊN CA THI — chuẩn hoá trước khi ghi xuống ô Sheet.
//
// Thầy đặt tên ca lúc mở ca, nhưng tên đó theo ca suốt đời: nó in trong phiếu
// gửi phụ huynh, trong bảng điểm, trong hồ sơ em. Gõ vội một lần là sai mãi,
// nên phải sửa lại được — và chỗ sửa phải chặn đúng ba thứ dưới đây.
//
// 1. XUỐNG DÒNG VÀ KHOẢNG TRẮNG THỪA. Dán tên từ Zalo hay Word thường kèm
//    `\n`, tab, hai dấu cách liền. Ô Sheet nhận tuốt, rồi phiếu in ra thừa
//    khoảng trống giữa chữ.
// 2. Ô SHEET NUỐT CHUỖI MỞ ĐẦU BẰNG `=` `+` `@` THÀNH CÔNG THỨC. Đặt tên
//    "=Ca 1" là ô hiện `#NAME?`, mất luôn tên ca. Cắt các ký tự đó ở đầu.
// 3. DÀI VÔ HẠN. Tên tràn khỏi thẻ ca trên điện thoại và tràn khỏi ô phiếu.
//
// Cùng một luật này được chép sang `doiTenCa` trong Apps Script — máy chủ
// không tin chuỗi máy khách gửi lên.
export const TEN_CA_TOI_DA = 80

/** Dọn tên ca về dạng ghi được xuống Sheet. Trả chuỗi rỗng = xoá tên (ca quay
 * về hiển thị theo mã), đó là lựa chọn hợp lệ chứ không phải lỗi. */
export function chuanTenCa(v: unknown): string {
  let t = String(v == null ? '' : v)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  t = t.replace(/^[=+@]+\s*/, '').trim()
  if (t.length > TEN_CA_TOI_DA) t = t.slice(0, TEN_CA_TOI_DA).trim()
  return t
}

/** Tên hiện lên màn cho một ca: có tên thì dùng tên, không thì gọi theo mã.
 * Một chỗ duy nhất, để màn coi thi và lịch sử ca không gọi ca hai kiểu. */
export function tenHienCua(tenCa: string | null | undefined, maCa: string): string {
  const t = chuanTenCa(tenCa)
  return t || `Ca ${maCa}`
}
