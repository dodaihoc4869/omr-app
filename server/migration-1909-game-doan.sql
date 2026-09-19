-- ĐOÀN HỘ TỐNG (bước 2, 19/09/2026) — CHỈ THÊM, chạy lại nhiều lần được. Không đụng bảng học tập nào.
-- Máy chủ có phòng vệ: chưa chạy tệp này thì mọi lệnh /game-v2/doan-* trả lời bằng lời tiếng Việt, phần còn lại của game chạy như cũ.
-- Lùi: DROP TABLE doan_tiep_suc; DROP TABLE doan_luot; DROP TABLE doan_chang; (không bảng nào khác tham chiếu tới).

-- Một chặng = một dòng; `json` là trạng thái phòng (lõi thuần doan-core + bài đã chốt của hiệp đang chạy), khoá lạc quan bằng `revision`.
CREATE TABLE IF NOT EXISTS doan_chang (
  ma         TEXT PRIMARY KEY,
  revision   INTEGER NOT NULL DEFAULT 0,
  json       TEXT NOT NULL,
  chu        TEXT NOT NULL,
  trang_thai TEXT NOT NULL DEFAULT 'sanh',   -- sanh | dang_di | xong | huy
  tao_luc    TEXT NOT NULL,
  ket_luc    TEXT
);
CREATE INDEX IF NOT EXISTS doan_chang_tao ON doan_chang(tao_luc);

-- Sổ lượt đi của từng em (bước 5 đọc: chặng đầu ngày miễn phí, trạm Đoàn lớp, chuỗi ngày). Khoá chính chống ghi trùng.
CREATE TABLE IF NOT EXISTS doan_luot (
  ma_chang           TEXT NOT NULL,
  sbd                TEXT NOT NULL,
  ngay_vn            TEXT NOT NULL,
  lop                TEXT NOT NULL DEFAULT '',
  ghe                INTEGER NOT NULL,
  thang              INTEGER,
  sao                INTEGER,
  so_cau             INTEGER,
  so_dung            INTEGER,
  so_tu_lam_dung     INTEGER,
  so_giup            INTEGER,
  so_giup_thanh_cong INTEGER,
  so_duoc_giup       INTEGER,
  vao_luc            TEXT NOT NULL,
  ket_luc            TEXT,
  PRIMARY KEY (ma_chang, sbd)
);
CREATE INDEX IF NOT EXISTS doan_luot_em ON doan_luot(sbd, ngay_vn);
CREATE INDEX IF NOT EXISTS doan_luot_lop ON doan_luot(lop, ngay_vn);

-- Lượt tiếp sức (bước 4 ghi; bước 6 đọc cho "ai giúp ai" và "Người tiếp sức của tuần"). Mỗi hiệp một em nhận tối đa một thẻ.
CREATE TABLE IF NOT EXISTS doan_tiep_suc (
  ma_chang   TEXT NOT NULL,
  hiep       INTEGER NOT NULL,
  den_sbd    TEXT NOT NULL,
  tu_sbd     TEXT NOT NULL,
  the        TEXT NOT NULL DEFAULT '',
  thanh_cong INTEGER,
  luc        TEXT NOT NULL,
  PRIMARY KEY (ma_chang, hiep, den_sbd)
);
CREATE INDEX IF NOT EXISTS doan_tiep_suc_tu ON doan_tiep_suc(tu_sbd, luc);
