-- MÁY CHỦ MỚI — lược đồ D1 (MAY-CHU-MOI.md mục 4.1).
--
-- Tên cột khớp MỘT-MỘT với cột sheet `LuotThi` để hàm đồng bộ không phải dịch
-- tên. Đổi tên ở đây là mở đường cho lệch dữ liệu giữa hai nơi.
--
-- Chạy:  npx wrangler d1 execute omr --file=server/schema.sql --remote

CREATE TABLE IF NOT EXISTS ca (
  ma_ca            TEXT PRIMARY KEY,
  ten_ca           TEXT,
  trang_thai       TEXT NOT NULL,          -- mo | dong | da_xoa
  bat_dau          TEXT,
  het_han_vao      TEXT,
  thoi_gian_phut   INTEGER,
  loai             TEXT,                   -- thi | baitap
  han_nop          TEXT,
  cong_bo          TEXT,                   -- khong | ngay | ca_lop_xong
  nguong_lan       INTEGER,
  nguong_giay      INTEGER,
  bank_r2          TEXT,                   -- khoá đối tượng R2, KHÔNG phải gói đề
  so_cau_json      TEXT,
  bo_theo_em_json  TEXT,
  cap_nhat_luc     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS luot (
  khoa              TEXT PRIMARY KEY,      -- ma_ca|sbd|lan_thu
  ma_ca             TEXT NOT NULL,
  sbd               TEXT NOT NULL,
  lan_thu           INTEGER NOT NULL,
  ma_de             TEXT,
  id_thiet_bi       TEXT,
  vao_luc           TEXT NOT NULL,
  het_gio_luc       TEXT,
  nop_luc           TEXT,
  trang_thai        TEXT NOT NULL,         -- dang_lam | da_nop | khoa
  dap_an_json       TEXT,
  giay_cau_json     TEXT,
  integrity_json    TEXT,
  so_lan_roi_man    INTEGER NOT NULL DEFAULT 0,
  tong_giay_roi_man INTEGER NOT NULL DEFAULT 0,
  ghi_chu           TEXT,
  cap_nhat_luc      TEXT NOT NULL,
  da_day_sheet      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_luot_ca       ON luot(ma_ca);
CREATE INDEX IF NOT EXISTS idx_luot_chua_day ON luot(da_day_sheet, ma_ca);
