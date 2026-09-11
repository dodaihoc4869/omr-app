-- ĐỢT 1209-B — CẮT HẲN GOOGLE.
--
-- Thầy chốt 12/09 rạng sáng: "gỡ sạch google, toàn bộ app phải được chạy trên
-- máy chủ mới". Cổng `/goi` nhận NGUYÊN VẸN mọi lệnh cũ của app (`action: ...`)
-- và trả đúng dáng cũ, nên màn hình không phải viết lại. Ba bảng dưới là những
-- thứ Apps Script đang giữ hộ mà D1 chưa có chỗ chứa.

-- CẤU HÌNH CỦA THẦY — thay Script property. Một khoá một dòng.
CREATE TABLE IF NOT EXISTS cau_hinh (
  khoa         TEXT PRIMARY KEY,
  gia_tri      TEXT,
  cap_nhat_luc TEXT NOT NULL
);

-- SỔ PHIẾU. Nội dung phiếu nằm ở R2 (`phieu/<ma>.json`); bảng này để TRA:
-- phiếu nào của ca nào, của em nào, phụ huynh đã mở mấy lần.
CREATE TABLE IF NOT EXISTS phieu (
  ma          TEXT PRIMARY KEY,
  ma_ca       TEXT,
  sbd         TEXT,
  ho_ten      TEXT,
  loai        TEXT NOT NULL DEFAULT 'ketqua',
  so_lan_xem  INTEGER NOT NULL DEFAULT 0,
  thu_hoi     INTEGER NOT NULL DEFAULT 0,
  luu_luc     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_phieu_ca ON phieu(ma_ca, thu_hoi);
CREATE INDEX IF NOT EXISTS idx_phieu_em ON phieu(sbd, ma_ca);

-- ĐỀ RIÊNG TỪNG EM của một ca — bản đồ `sbd -> gói câu` thầy dựng trước giờ thi.
CREATE TABLE IF NOT EXISTS de_rieng (
  khoa     TEXT PRIMARY KEY,        -- ma_ca|sbd
  ma_ca    TEXT NOT NULL,
  sbd      TEXT NOT NULL,
  goi_json TEXT,
  luc      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dr_ca ON de_rieng(ma_ca);

-- KHO CÂU CỦA MỘT CA nối thêm (đề riêng): bank + keyBank bổ sung.
CREATE TABLE IF NOT EXISTS kho_ca_them (
  khoa     TEXT PRIMARY KEY,        -- ma_ca|qid
  ma_ca    TEXT NOT NULL,
  qid      TEXT NOT NULL,
  cau_json TEXT,
  dap_an   TEXT,
  luc      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_kct_ca ON kho_ca_them(ma_ca);
