-- ĐOÀN HỘ TỐNG (bước 6, 21/09/2026) — sổ kết quả CÂU CHUNG của trùm, để thầy thấy "lớp yếu dạng nào". CHỈ THÊM, chạy lại được.
-- Không có tên em nào: câu chung không tạo bằng chứng cá nhân. Lùi: DROP TABLE doan_trum_cau;
CREATE TABLE IF NOT EXISTS doan_trum_cau (
  ma_chang TEXT NOT NULL,
  hiep     INTEGER NOT NULL,
  lop      TEXT NOT NULL DEFAULT '',
  ngay_vn  TEXT NOT NULL,
  ma_dang  TEXT,
  qid      TEXT NOT NULL,
  y_dung   INTEGER NOT NULL,
  so_ghe   INTEGER NOT NULL,
  PRIMARY KEY (ma_chang, hiep)
);
CREATE INDEX IF NOT EXISTS doan_trum_cau_lop ON doan_trum_cau(lop, ngay_vn);
