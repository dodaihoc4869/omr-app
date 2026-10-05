-- Nút X "Ai sai câu này" trên tờ chiếu (thầy 05/10, server/src/ai-sai-cau.ts) đọc sổ theo MÃ CÂU — CHỈ THÊM một chỉ mục.
-- Tên tệp xếp SAU migration-1909-su-kien-hoc.sql (bảng phải có trước khi tạo chỉ mục).
CREATE INDEX IF NOT EXISTS idx_skh_qid ON su_kien_hoc(qid);
