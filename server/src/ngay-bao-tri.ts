// NGÀY BẢO TRÌ (thầy 27/10 tối: «App đang bảo trì. Tối nay các em không phải làm. Ngày mai vào làm bình thường… lưu lại mọi thứ cho học sinh làm tiếp»).
// Ngày VN trong danh sách = em KHÔNG bị thiệt vì không làm: em chưa đủ mức không mất chuỗi / không tiêu bình / không thăng hoa / không thua cược / không mất
// khiên / không bị tính «ngày không làm»; em ĐÃ đủ mức vẫn được tính bình thường (lửa +1, ngày đạt). Chỉ là LUẬT TÍNH — không ghi dữ liệu.
// Dùng ở: chuỗi ngày B3 (chuoi-ngay-bai.ts), cầu nối thưởng phạt (thăng hoa, cược), ngày nghỉ chung (`phanTichNgayNghi` ⇒ khiên, kế hoạch ngày, màn thầy,
// EXP), chốt kết quả kế hoạch ngày, nhịp học (Lười).
// 30/10 (thầy «khôi phục chuỗi cho học sinh bị mất hôm qua và hôm kia» · «khôi phục cả ngày 27/10 nữa»): 28/10 và 29/10 — giờ cao điểm app lag / «Máy chủ đang bận»
// (exceededMemory 19–22h) — em không làm được đủ mức không bị thiệt, như tối bảo trì 27/10.
// 30/10 (thầy 22:20 «báo app bảo trì luôn đi»): tối 30/10 máy chủ nghẽn giờ cao điểm, app tạm đóng — như 27/10.
const NGAY_BAO_TRI_GOC: readonly string[] = ['2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30']
// `let` + gán lại trong `datNgayBaoTriChoTest`: liên kết sống của ES module ⇒ nơi nhập luôn thấy danh sách hiện hành.
export let NGAY_BAO_TRI: readonly string[] = NGAY_BAO_TRI_GOC
let TAP = new Set(NGAY_BAO_TRI)
export const laNgayBaoTri = (ngay: string): boolean => TAP.has(String(ngay).slice(0, 10))
/** Ngày bảo trì trong [tu, den] (gồm hai đầu). */
export const ngayBaoTriTrong = (tu: string, den: string): string[] => NGAY_BAO_TRI.filter((d) => d >= tu && d <= den)
/** Danh sách cho SQL `IN(…)` (chỉ ngày đúng mẫu YYYY-MM-DD, hằng trong mã). */
const sqlDs = (ds: readonly string[]): string => ds.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).map((d) => `'${d}'`).join(',') || "''"
export let SQL_DS_BAO_TRI: string = sqlDs(NGAY_BAO_TRI)
/** CHỈ CHO TEST: ghim lịch bảo trì (test luật chuỗi / khiên dùng ngày mẫu cuối tháng 10 — không phụ thuộc lịch vận hành); không đối số ⇒ về lịch thật. */
export function datNgayBaoTriChoTest(ds: readonly string[] = NGAY_BAO_TRI_GOC): void { NGAY_BAO_TRI = ds; TAP = new Set(ds); SQL_DS_BAO_TRI = sqlDs(ds) }
/** Kiểm tra cá nhân (Boss 27/10): loại bài ngày bảo trì đã quá hạn mà em chưa nộp (bí danh bảng `a`) — không hiện «Đã lỡ», không giữ câu, không tính. */
export const sqlKhongBaoTriBo = (a: string, now: number): string =>
  `NOT(${a}.ngay IN(${SQL_DS_BAO_TRI}) AND ${a}.nop_luc IS NULL AND ${a}.han_luc<=${Math.floor(Number(now) || 0)})`
