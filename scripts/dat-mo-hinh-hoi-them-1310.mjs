// Claude 13/10 18:21 đặt cau_hinh.hoi_tro_ly = gemini-3.8-flash vì Google trả HTTP 404 cho gemini-2.5-flash. Cùng lúc, PR271 (phiên Heisenberg) đã đổi
// mặc định sang gemini-3.5-flash-lite và chạy được: nhật ký hoi_tro_ly 18:19–18:20 trả lời 1,4–1,7 s; bản 3.8-flash do Claude ép mất 7,6–13 s, token ra
// gấp > 10 lần ⇒ GỠ dòng cấu hình Claude đã thêm (chỉ xoá đúng giá trị Claude ghi) để dùng mặc định nhanh của làn Hỏi thầy.
import { query } from './kiem-phat-hanh-chua.mjs'
await query(`DELETE FROM cau_hinh WHERE khoa='hoi_tro_ly' AND gia_tri='{"model":"gemini-3.8-flash","thinkingBudget":6144}'`)
console.log('cauHinhHoiThem', JSON.stringify(await query(`SELECT gia_tri,cap_nhat_luc FROM cau_hinh WHERE khoa='hoi_tro_ly'`)))
