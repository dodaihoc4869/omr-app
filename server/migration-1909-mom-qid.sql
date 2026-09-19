-- CHỈ THÊM (19/09/2026, GĐ 5): danh sách mã câu của từng bài Mom/daily_, để kế hoạch ngày không giao lại
-- ở việc "ôn lại" đúng những câu đang nằm trong một bài Mom CHƯA NỘP của em (một câu hai nơi).
-- JSON mảng qid THẬT (bỏ 'cau_N' do app tự đánh số). Bài cũ (trước migration) để NULL: không chống trùng, không hỏng gì.
-- Mã cũ chạy trước migration vẫn ổn: `mom.ts` và `ke-hoach-ngay-d1.ts` có đường dự phòng khi thiếu cột.
ALTER TABLE mom_bai ADD COLUMN qid_json TEXT;
