-- GAME HÓA 2.0 (thầy chốt 27/09/2026) — migration CHỈ-THÊM. Không sửa, không xoá bảng nào đang có.
-- Lùi: DROP TABLE ruong_bat_linh; DROP TABLE srs2_day_lai; DROP TABLE srs2_ke_hoach; DROP TABLE chien_dich;
--      DELETE FROM cau_hinh WHERE khoa = 'game_hoa_2';
--
-- chien_dich   — một đợt luyện có hạn nộp, giao cho một lớp hoặc danh sách em; thay dần cau_hinh.kho_de_giao.
--                han_nop = ngày VN YYYY-MM-DD (hết hạn lúc 23:59 ngày đó). qid_json = câu đã lọc (bỏ tự luận).
-- srs2_ke_hoach — kế hoạch ngày CHỐT lần mở đầu tiên của em trong ngày (Thể lực không nhảy). Chỉ đệm: xoá thì ngày
--                 hôm đó lập lại từ sổ su_kien_hoc.
-- srs2_day_lai — thầy bấm "Chữa xong" ở buổi chữa: đếm sai của câu về 0, câu quay lại Đoàn Hộ Tống hôm sau.
-- ruong_bat_linh — Rương Bát Linh mở trong ngày (xong trọn kế hoạch). qua_json = phần quà đã phát.
CREATE TABLE IF NOT EXISTS chien_dich (
  id            TEXT PRIMARY KEY,
  ten           TEXT NOT NULL,
  lop           TEXT,
  sbd_json      TEXT NOT NULL,
  ma_de_json    TEXT NOT NULL,
  qid_json      TEXT NOT NULL,
  han_nop       TEXT NOT NULL,
  the_luc_ngay  INTEGER NOT NULL DEFAULT 40,
  huyet_chien   INTEGER NOT NULL DEFAULT 1,
  ma_ca         TEXT,
  tao_luc       TEXT NOT NULL,
  dong_luc      TEXT,
  trang_thai    TEXT NOT NULL DEFAULT 'dang_chay'
);
CREATE INDEX IF NOT EXISTS idx_chien_dich_trang_thai ON chien_dich(trang_thai, han_nop);

CREATE TABLE IF NOT EXISTS srs2_ke_hoach (
  sbd            TEXT NOT NULL,
  ngay           TEXT NOT NULL,
  chien_dich_id  TEXT,
  dao_json       TEXT NOT NULL,
  doan_json      TEXT NOT NULL,
  huyet_chien    INTEGER NOT NULL DEFAULT 0,
  tong           INTEGER NOT NULL,
  tao_luc        TEXT NOT NULL,
  PRIMARY KEY (sbd, ngay)
);

CREATE TABLE IF NOT EXISTS srs2_day_lai (
  sbd            TEXT NOT NULL,
  qid            TEXT NOT NULL,
  luc            TEXT NOT NULL,
  chien_dich_id  TEXT,
  PRIMARY KEY (sbd, qid, luc)
);

CREATE TABLE IF NOT EXISTS ruong_bat_linh (
  sbd       TEXT NOT NULL,
  ngay      TEXT NOT NULL,
  mo_luc    TEXT NOT NULL,
  qua_json  TEXT NOT NULL,
  PRIMARY KEY (sbd, ngay)
);
