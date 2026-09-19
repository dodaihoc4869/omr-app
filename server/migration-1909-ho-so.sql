-- GĐ 1 — HỒ SƠ NẮM KIẾN THỨC (DE-XUAT-CA-NHAN-HOA-1909.md mục 1.2).
--
-- Hai bảng này là BẢN DỰNG LẠI từ `su_kien_hoc` bằng `phatLaiSuKien` (hàm thuần,
-- phát lại hai lần ra cùng trạng thái). Mất là dựng lại được từ sổ, nên không
-- phải nguồn sự thật — nguồn sự thật là `su_kien_hoc`.
--
-- Chỉ THÊM bảng mới; không đụng bảng nào đang chạy. Chưa có phần nào của app đọc
-- hai bảng này ở GĐ 1 (kế hoạch ngày GĐ 2 mới đọc).
--
--   nam_kt_cau  khoa = sbd|qid          — một dòng một (em, câu)
--   nam_kt_dang khoa = sbd|ma_dang      — một dòng một (em, dạng); dạng thiếu mã rơi về 'CD:<chuyên đề>'
--   moc_on_ke   ngày Việt Nam YYYY-MM-DD; trang_thai ∈ moi_sai | dang_on | da_khac_phuc | chua_thay_sai
CREATE TABLE IF NOT EXISTS nam_kt_cau (
  khoa                TEXT PRIMARY KEY,
  sbd                 TEXT NOT NULL,
  qid                 TEXT NOT NULL,
  ma_dang             TEXT,
  chuyen_de           TEXT NOT NULL DEFAULT '',
  lan_gap             INTEGER NOT NULL,
  lan_sai             INTEGER NOT NULL,
  lan_trong           INTEGER NOT NULL,
  dung_lien_tiep      INTEGER NOT NULL,
  ngay_dung_khac_nhau INTEGER NOT NULL,
  ket_qua_cuoi        INTEGER,
  nguon_cuoi          TEXT NOT NULL,
  luc_cuoi            TEXT NOT NULL,
  moc_on_ke           TEXT,
  trang_thai          TEXT NOT NULL,
  can_day_lai         INTEGER NOT NULL DEFAULT 0,
  giay_tb             INTEGER,
  cap_nhat_luc        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nkc_em_moc ON nam_kt_cau(sbd, moc_on_ke);
CREATE INDEX IF NOT EXISTS idx_nkc_em_dang ON nam_kt_cau(sbd, ma_dang);

CREATE TABLE IF NOT EXISTS nam_kt_dang (
  khoa             TEXT PRIMARY KEY,
  sbd              TEXT NOT NULL,
  ma_dang          TEXT NOT NULL,
  so_gap           INTEGER NOT NULL,   -- số CÂU khác nhau đã gặp thuộc dạng này
  so_sai           INTEGER NOT NULL,   -- số câu TỪNG sai (lan_sai > 0)
  so_da_khac_phuc  INTEGER NOT NULL,
  so_moi_sai       INTEGER NOT NULL,
  so_chua_thay_sai INTEGER NOT NULL,
  bac              INTEGER NOT NULL,   -- 0 biết · 1 hiểu · 2 vận dụng
  moc_on_ke        TEXT,               -- sớm nhất trong các câu chưa khắc phục (moi_sai/dang_on)
  moc_moi_sai      TEXT,               -- sớm nhất trong các câu moi_sai
  cap_nhat_luc     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_nkd_em ON nam_kt_dang(sbd);
