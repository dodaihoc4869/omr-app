-- MIGRATION 11/09/2026 — chỉ phần MỚI so với lược đồ đã nằm trên D1 thật.
--
-- VÌ SAO KHÔNG CHẠY LẠI `schema.sql`: file ấy có bốn câu
-- `ALTER TABLE ca ADD COLUMN ...` KHÔNG có `IF NOT EXISTS` (SQLite không hỗ
-- trợ), nên chạy lần hai là báo "duplicate column name" và dừng giữa chừng.
--
-- File này chỉ chứa câu tạo-nếu-chưa-có, chạy bao nhiêu lần cũng vô hại.

CREATE TABLE IF NOT EXISTS danh_sach (
  sbd          TEXT PRIMARY KEY,
  ho_ten       TEXT,
  nam_sinh     TEXT,
  lop          TEXT,
  cap_nhat_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_danh_sach_lop ON danh_sach(lop);
