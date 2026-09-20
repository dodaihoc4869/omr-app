-- CHỈ THÊM (21/09/2026): BTVN "NÂNG ĐỠ" — mỗi em nhận bộ câu vừa sức chia theo chặng (docs/hop-dong-btvn-nang-do-2109.md).
-- Bài cũ và mọi bài `ca_nhan = 0` KHÔNG đổi một byte hành vi. Chạy MỘT lần (SQLite không có ADD COLUMN IF NOT EXISTS: chạy lại báo "duplicate column name", vô hại).
-- Máy chủ đã phòng vệ: chưa chạy migration thì giao `caNhan` báo lỗi bằng lời, bài cũ chạy như cũ.
-- Lùi: DROP TABLE btvn_cau; DROP TABLE btvn_em_cau; rồi ALTER TABLE … DROP COLUMN cho các cột thêm dưới đây.

ALTER TABLE btvn ADD COLUMN ca_nhan INTEGER NOT NULL DEFAULT 0;
ALTER TABLE btvn ADD COLUMN hat_giong TEXT;
ALTER TABLE btvn ADD COLUMN so_loi INTEGER;

-- CÂU CỦA BÀI + nhãn (ghi lúc giao bài `ca_nhan`). `loi` = câu lõi chung (chonLoi), `ghim` = thầy bắt buộc cả lớp.
CREATE TABLE IF NOT EXISTS btvn_cau (
  ma_btvn   TEXT NOT NULL,
  qid       TEXT NOT NULL,
  thu_tu    INTEGER NOT NULL,
  dang      TEXT,
  chuyen_de TEXT,
  muc_do    INTEGER NOT NULL DEFAULT 0,
  sao       INTEGER NOT NULL DEFAULT 0,
  phan      TEXT NOT NULL,
  loi       INTEGER NOT NULL DEFAULT 0,
  ghim      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ma_btvn, qid)
);

-- BỘ CÂU CHỐT CỦA TỪNG EM (một lần, lúc em mở bài hoặc kế hoạch ngày cần). `chang` 0-based; `nhan` = loi|khoi_dong|dang_yeu|cung_co|thu_thach|loi_cao.
CREATE TABLE IF NOT EXISTS btvn_em_cau (
  khoa     TEXT PRIMARY KEY,   -- ma_btvn|sbd|qid
  ma_btvn  TEXT NOT NULL,
  sbd      TEXT NOT NULL,
  qid      TEXT NOT NULL,
  chang    INTEGER NOT NULL,
  nhan     TEXT NOT NULL,
  thu_tu   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_btvn_em_cau_em ON btvn_em_cau(ma_btvn, sbd, chang, thu_tu);

ALTER TABLE btvn_em ADD COLUMN so_cau_em INTEGER;        -- |bộ của em| (NULL = chưa chốt); `so_cau` của dòng này là MẪU điểm (đã trừ câu thưởng sai)
ALTER TABLE btvn_em ADD COLUMN so_chang INTEGER;
ALTER TABLE btvn_em ADD COLUMN chot_luc TEXT;
ALTER TABLE btvn_em ADD COLUMN tom_tat_json TEXT;
ALTER TABLE btvn_em ADD COLUMN ngan_sach_json TEXT;
ALTER TABLE btvn_em ADD COLUMN chang_mo_json TEXT;       -- Đợt 2: mốc mở sớm từng chặng ("Em muốn làm thêm")
