-- ĐO LẠI LƯỢT CŨ (thầy 21/10: "phải tìm cách đo lại hết"): bảng ĐỆM dẫn xuất kích thước đề từng câu (số từ · có hình · phần). Bản sao `SQL_CAU_DOC_GIAY` (server/src/cau-doc-giay.ts).
-- CHỈ THÊM: một bảng mới; xoá đi thì cron mỗi phút tự lấp lại từ game_v2_question. Đường đọc lỗi/thiếu bảng ⇒ lượt cũ vẫn "Chưa có số đo".
CREATE TABLE IF NOT EXISTS cau_doc_giay(qid TEXT PRIMARY KEY, so_tu INTEGER NOT NULL, co_hinh INTEGER NOT NULL, phan TEXT NOT NULL, tinh_luc TEXT);
