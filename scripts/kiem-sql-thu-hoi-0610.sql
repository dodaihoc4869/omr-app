-- KIỂM CÂU SQL CỦA "HUỶ CHIẾN DỊCH ⇒ THU HỒI" TRÊN D1 THẬT (CHỈ ĐỌC, chỉ in SỐ ĐẾM — không mã chiến dịch / tên em / mã câu).
-- Máy chủ chạy hai câu GHI mới lúc huỷ (đánh cờ `thuHoiLuc` vào lượt game đang mở; nhả dấu tick) và hai câu ĐỌC mới (đệm chiến dịch kèm chiến dịch đã huỷ; câu đọc ở `answer`).
-- Câu GHI nuốt lỗi (huỷ vẫn thành công) nên nếu D1 từ chối cú pháp thì chỉ thấy "0 lượt đã thu hồi" — không phân biệt được "không có lượt" với "câu hỏng". Tệp này chạy phần ĐỌC TƯƠNG ĐƯƠNG
-- (cùng hàm json_each / json_set / instr / substr / EXISTS tương quan, tham số thay bằng hằng) để D1 thật báo lỗi nếu có. Mỗi cột là MỘT con số; lỗi cú pháp ⇒ cả lệnh thất bại (thấy ngay).
SELECT
  -- a) điều kiện chọn lượt cần đánh cờ (WHERE của câu UPDATE `danhCoLuotDangMo`): em giả + câu giả ⇒ 0
  (SELECT COUNT(*) FROM game_v2_session
     WHERE sbd IN (SELECT value FROM json_each('["ZZ-KHONG-CO"]')) AND created_at >= '2026-10-06T00:00:00.000Z' AND json_valid(json) AND COALESCE(json_extract(json, '$.doan'), 0) = 0
       AND EXISTS (SELECT 1 FROM json_each(game_v2_session.json, '$.questions') j
                    WHERE COALESCE(json_extract(j.value, '$.tc'), substr(json_extract(j.value, '$.qid'), 1, instr(json_extract(j.value, '$.qid') || '~', '~') - 1)) IN (SELECT value FROM json_each('["ZZ-CAU-KHONG-CO"]')))) AS a_luot_khop,
  -- b) biểu thức đặt cờ: giữ lúc SỚM NHẤT (SET của câu UPDATE) — phải ra "T" (chưa có cờ) và "S" (đã có cờ "S")
  (SELECT json_extract(json_set('{"a":1}', '$.thuHoiLuc', COALESCE(json_extract('{"a":1}', '$.thuHoiLuc'), 'T')), '$.thuHoiLuc')) AS b_co_moi,
  (SELECT json_extract(json_set('{"thuHoiLuc":"S"}', '$.thuHoiLuc', COALESCE(json_extract('{"thuHoiLuc":"S"}', '$.thuHoiLuc'), 'T')), '$.thuHoiLuc')) AS b_co_giu_som,
  -- c) đệm chiến dịch: câu đọc mới (chưa huỷ HOẶC huỷ từ 29/09) — số chiến dịch mỗi loại
  (SELECT COUNT(*) FROM chien_dich WHERE trang_thai <> 'da_huy') AS c_chua_huy,
  (SELECT COUNT(*) FROM chien_dich WHERE trang_thai = 'da_huy' AND COALESCE(dong_luc, '') >= '2026-09-29') AS c_da_huy_tu_2909,
  (SELECT COUNT(*) FROM chien_dich WHERE trang_thai = 'da_huy' AND COALESCE(dong_luc, '') < '2026-09-29') AS c_da_huy_truoc_2909,
  -- d) câu đọc ở `answer` / `resume` / `complete` (qidThuHoiTrongLuot) — em giả + câu giả ⇒ 0; lỗi nếu có chiến dịch huỷ mà JSON hỏng (json_each ném lỗi)
  (SELECT COUNT(*) FROM chien_dich c, json_each(c.qid_json) q
     WHERE c.trang_thai = 'da_huy' AND COALESCE(c.dong_luc, '') >= '2026-09-29' AND json_valid(c.qid_json) AND json_valid(c.sbd_json)
       AND EXISTS (SELECT 1 FROM json_each(c.sbd_json) s WHERE s.value = 'ZZ-KHONG-CO') AND q.value IN (SELECT value FROM json_each('["ZZ-CAU-KHONG-CO"]'))) AS d_khop_huy,
  -- e) mọi chiến dịch đã huỷ có sbd_json / qid_json hợp lệ? (số hàng hỏng — phải 0)
  (SELECT COUNT(*) FROM chien_dich WHERE trang_thai = 'da_huy' AND (NOT json_valid(qid_json) OR NOT json_valid(sbd_json))) AS e_json_huy_hong,
  -- f) bảng tick: có bảng; số dòng tick còn hiệu lực gắn chiến dịch (điều kiện của câu UPDATE `nhaTickKhiHuy`)
  (SELECT COUNT(*) FROM bai_da_day WHERE chien_dich_id IS NOT NULL AND bo_tick_luc IS NULL) AS f_tick_con_hieu_luc,
  -- g) số lượt game đã có cờ thuHoiLuc (0 trước lần huỷ đầu tiên sau khi phát hành)
  (SELECT COUNT(*) FROM game_v2_session WHERE json_valid(json) AND json_extract(json, '$.thuHoiLuc') IS NOT NULL) AS g_luot_co_co
