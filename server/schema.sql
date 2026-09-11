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

-- Tra lượt theo (ca, em): dùng cho `/luu-tam` và `/nop` khi máy em gửi
-- `maCa`+`sbd` thay cho khoá. Không có chỉ mục này thì mỗi lượt lưu tạm phải
-- quét toàn bộ lượt của ca — 50 em × lưu tạm mỗi 30 giây là quét liên tục.
CREATE INDEX IF NOT EXISTS idx_luot_em ON luot(ma_ca, sbd, lan_thu);

-- ===========================================================================
-- ĐỢT 3 — chuyển NỐT đường nóng của máy em sang máy chủ mới.
--
-- Bốn lệnh em bắn trong một ca 45 phút: vào thi (1) · hỏi phòng chờ (mỗi 3 s
-- lúc chờ) · đẩy trạng thái (270) · lưu tạm (135) · nộp (1). Hai cái GIỮA mới
-- là khối lượng thật — 405 trên 407 lệnh. Không chuyển chúng thì chuyển vào thi
-- và nộp cũng gần như không đổi cảm giác nhanh chậm của em.
-- ===========================================================================

-- Ca cần thêm mấy cột của phòng chờ và của lớp.
ALTER TABLE ca ADD COLUMN lop             TEXT;
ALTER TABLE ca ADD COLUMN phong_cho       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ca ADD COLUMN bat_dau_thi_luc TEXT;
ALTER TABLE ca ADD COLUMN giu_de_doc      INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ca ADD COLUMN an_han_giay     INTEGER NOT NULL DEFAULT 0;

-- TRẠNG THÁI LÀM BÀI THỜI GIAN THỰC — mỗi em đúng một dòng, khoá theo SBD,
-- lần sau ghi đè lần trước. Khớp một-một cột sheet `TrangThai`.
CREATE TABLE IF NOT EXISTS trang_thai (
  sbd             TEXT PRIMARY KEY,
  ma_ca           TEXT,
  lop             TEXT,
  dang_lam        INTEGER NOT NULL DEFAULT 0,
  bat_dau_luc     TEXT,
  da_lam_cau_hoi  INTEGER NOT NULL DEFAULT 0,
  tong_cau_hoi    INTEGER NOT NULL DEFAULT 0,
  so_lan_roi_app  INTEGER NOT NULL DEFAULT 0,
  blocked         INTEGER NOT NULL DEFAULT 0,
  cap_nhat_luc    TEXT NOT NULL,
  da_day_sheet    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_trang_thai_ca ON trang_thai(ma_ca);

-- PHÒNG CHỜ — em qua cổng nhưng thầy chưa bấm Bắt đầu. Ghi tên để chế độ đề
-- riêng biết ai có phần lúc thầy bấm.
CREATE TABLE IF NOT EXISTS phong_cho (
  khoa    TEXT PRIMARY KEY,          -- ma_ca|sbd
  ma_ca   TEXT NOT NULL,
  sbd     TEXT NOT NULL,
  ho_ten  TEXT,
  ghi_luc TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_phong_cho_ca ON phong_cho(ma_ca);
