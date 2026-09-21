-- BỘ NÃO (21/09/2026) — CHỈ THÊM, chạy lại nhiều lần không hại (IF NOT EXISTS). Hợp đồng: docs/hop-dong-bo-nao-2109.md.
-- Không đụng bảng nào đang chạy. Cờ cấu hình nằm ở `cau_hinh` khoá `bo_nao` (không cần bảng mới).

-- Thẻ / hồ sơ ngày của từng em (do `/ai/ho-so-ngay` dựng theo yêu cầu). `the_json` là ĐÚNG những gì AI được đọc về em ấy đêm đó (thẻ ngắn, hoặc hồ sơ đầy
-- đủ với em soi kỹ) — lúc nộp máy chủ kiểm lời nhắn / lý do / gợi ý bằng chính bộ số này. KHÔNG có tên em.
CREATE TABLE IF NOT EXISTS ai_ho_so_ngay (
  sbd          TEXT NOT NULL,
  ngay         TEXT NOT NULL,             -- YYYY-MM-DD giờ Việt Nam
  lop          TEXT NOT NULL DEFAULT '',
  luong        TEXT NOT NULL,             -- nhanh | sau | vang | bo_qua
  ly_do_luong  TEXT NOT NULL DEFAULT '[]',
  the_json     TEXT NOT NULL,
  tao_luc      TEXT NOT NULL,
  PRIMARY KEY (sbd, ngay)
);
CREATE INDEX IF NOT EXISTS idx_ai_ho_so_ngay ON ai_ho_so_ngay(ngay, luong);

-- Điều chỉnh bộ não đã qua kiểm khuôn (đã làm sạch). `che_do` = chế độ HIỆU LỰC của lớp em lúc nộp; `ap_dung` = 1 chỉ khi chế độ `that` và độ tin cậy ≥ 0,6.
-- `huy` = thầy bấm "Bỏ" hoặc bộ não TỰ GỠ (`tu_go`). `ket_qua` = kết quả chấm hôm sau (an_thua | khong_doi | xau_di | chua_du_du_lieu).
CREATE TABLE IF NOT EXISTS ai_dieu_chinh (
  sbd          TEXT NOT NULL,
  ngay         TEXT NOT NULL,
  json         TEXT NOT NULL,
  do_tin       REAL NOT NULL DEFAULT 0,
  che_do       TEXT NOT NULL DEFAULT 'bong',
  ap_dung      INTEGER NOT NULL DEFAULT 0,
  het_han      TEXT NOT NULL,             -- YYYY-MM-DD (= ngày + 3)
  huy          INTEGER NOT NULL DEFAULT 0,
  tu_go        INTEGER NOT NULL DEFAULT 0,
  ly_do_bo     TEXT NOT NULL DEFAULT '[]',
  ket_qua      TEXT,
  ket_qua_chu  TEXT,
  nop_luc      TEXT NOT NULL,
  PRIMARY KEY (sbd, ngay)
);
CREATE INDEX IF NOT EXISTS idx_ai_dieu_chinh_ngay ON ai_dieu_chinh(ngay, ap_dung, huy);

-- Bản tin sáng cho thầy (≤ 6 dòng) + số đếm của đêm.
CREATE TABLE IF NOT EXISTS ai_ban_tin (
  ngay           TEXT PRIMARY KEY,
  json           TEXT NOT NULL,
  che_do         TEXT NOT NULL DEFAULT 'bong',
  nop_luc        TEXT NOT NULL,
  so_em          INTEGER NOT NULL DEFAULT 0,
  so_nhanh       INTEGER NOT NULL DEFAULT 0,
  so_sau         INTEGER NOT NULL DEFAULT 0,
  so_vang        INTEGER NOT NULL DEFAULT 0,
  so_nhan        INTEGER NOT NULL DEFAULT 0,
  so_chi_ghi_so  INTEGER NOT NULL DEFAULT 0,
  so_bi_loai     INTEGER NOT NULL DEFAULT 0
);
