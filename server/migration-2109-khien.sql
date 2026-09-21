-- CHỈ THÊM (21/09/2026): GÓI KHIÊN — thầy lệnh "lên độ khó của khiên, RESET lại hết mảnh khiên và mốc ban đầu cho công bằng" + "mất chuỗi bao nhiêu ngày sẽ bị mất 1 khiên".
-- Tài liệu: DE-XUAT-EXP-MANH-KHIEN-1909.md mục 4; thứ tự chạy: docs/chay-that-2109-khien-thu-tu.md. Lùi: DROP TABLE khien_mat_so; DROP TABLE khien_truoc_reset_2109 (chỉ sau khi đã chạy tệp lùi dữ liệu).
-- `khien_truoc_reset_2109`: BẢN CHÉP hồ sơ khiên của từng em TRƯỚC khi đặt lại (để lùi được). Mỗi em một dòng (INSERT OR IGNORE: chạy lại KHÔNG ghi đè bản gốc).
CREATE TABLE IF NOT EXISTS khien_truoc_reset_2109 (
  sbd               TEXT PRIMARY KEY,
  manh              INTEGER NOT NULL,   -- khienRen.manh trước reset
  da_ren            INTEGER NOT NULL,   -- khienRen.daRen trước reset
  da_dung           INTEGER NOT NULL,   -- shields.used (không đổi ở reset)
  exp_manh_da_tinh  INTEGER NOT NULL,   -- expMoi.manhDaTinh trước reset
  exp_ngay_dat      INTEGER,            -- expMoi.ngayDat trước reset (thường NULL)
  cap               INTEGER NOT NULL,   -- cấp thần thú lúc chép (không đổi ở reset)
  da_ren_moi        INTEGER NOT NULL,   -- khienRen.daRen SAU reset (đã trừ phần khiên rèn CHƯA dùng)
  revision          INTEGER,
  chep_luc          TEXT NOT NULL
);
-- `khien_mat_so`: SỔ khiên bị trừ vì vắng nhiệm vụ ngày liên tiếp (cron 00:01). Khoá `khien|mat|<sbd>|<ngày VN>` ⇒ chạy lại không trừ đôi; ghi để đối soát/lùi.
CREATE TABLE IF NOT EXISTS khien_mat_so (
  khoa           TEXT PRIMARY KEY,
  sbd            TEXT NOT NULL,
  ngay_vn        TEXT NOT NULL,
  so_ngay_vang   INTEGER NOT NULL,      -- số ngày vắng liên tiếp lúc trừ
  tu             TEXT NOT NULL,         -- ren (khiên rèn chưa dùng) | qua (khiên quà tiến hoá)
  luc            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_khien_mat_so_em ON khien_mat_so(sbd, ngay_vn);
CREATE INDEX IF NOT EXISTS idx_khien_mat_so_ngay ON khien_mat_so(ngay_vn);
