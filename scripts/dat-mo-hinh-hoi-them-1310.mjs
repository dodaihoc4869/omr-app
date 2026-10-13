// Claude 13/10 18:25 (thầy gửi ảnh "Bản mới vẫn bị lỗi" — Hỏi thêm Thầy): Google trả HTTP 404 "models/gemini-2.5-flash is no longer available to new
// users. Please update your code to use models/gemini-3.8-flash" (cột loi bảng hoi_tro_ly, 4/5 lượt hôm nay). Mô hình đọc từ cau_hinh.hoi_tro_ly
// (đệm 30 giây, không cần phát hành) ⇒ đặt mô hình Google chỉ định. thinkingBudget 6144 chỉ để nâng maxOutputTokens (= 2048 + thinkingBudget) lên 8192:
// mã hiện chỉ gửi thinkingConfig cho mô hình 2.5, mô hình 3.x tự suy nghĩ mặc định — trần 3072 cũ dễ cắt cụt câu trả lời JSON.
import { query } from './kiem-phat-hanh-chua.mjs'
const gt = JSON.stringify({ model: 'gemini-3.8-flash', thinkingBudget: 6144 })
const luc = new Date().toISOString()
await query(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('hoi_tro_ly','${gt}','${luc}') ON CONFLICT(khoa) DO UPDATE SET gia_tri=excluded.gia_tri,cap_nhat_luc=excluded.cap_nhat_luc`)
console.log('cauHinhHoiThem', JSON.stringify(await query(`SELECT gia_tri,cap_nhat_luc FROM cau_hinh WHERE khoa='hoi_tro_ly'`)))
