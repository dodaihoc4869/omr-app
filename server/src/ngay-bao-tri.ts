// NGÀY BẢO TRÌ (thầy 27/10 tối: «App đang bảo trì. Tối nay các em không phải làm. Ngày mai vào làm bình thường… lưu lại mọi thứ cho học sinh làm tiếp»).
// Ngày VN trong danh sách = em KHÔNG bị thiệt vì không làm: em chưa đủ mức không mất chuỗi / không tiêu bình / không thăng hoa / không thua cược / không mất
// khiên / không bị tính «ngày không làm»; em ĐÃ đủ mức vẫn được tính bình thường (lửa +1, ngày đạt). Chỉ là LUẬT TÍNH — không ghi dữ liệu.
// Dùng ở: chuỗi ngày B3 (chuoi-ngay-bai.ts), cầu nối thưởng phạt (thăng hoa, cược), ngày nghỉ chung (`phanTichNgayNghi` ⇒ khiên, kế hoạch ngày, màn thầy,
// EXP), chốt kết quả kế hoạch ngày, nhịp học (Lười).
export const NGAY_BAO_TRI: readonly string[] = ['2026-10-27']
const TAP = new Set(NGAY_BAO_TRI)
export const laNgayBaoTri = (ngay: string): boolean => TAP.has(String(ngay).slice(0, 10))
/** Ngày bảo trì trong [tu, den] (gồm hai đầu). */
export const ngayBaoTriTrong = (tu: string, den: string): string[] => NGAY_BAO_TRI.filter((d) => d >= tu && d <= den)
