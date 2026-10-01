-- CHỈ THÊM (01/10/2026): BÀI BỔ SUNG — đáp án máy em gửi tới SAU KHI lượt đã đóng (máy chủ chốt hộ / thầy khoá), chờ thầy duyệt.
-- Worker cũng tự tạo bảng lần đầu dùng (server/src/bai-bo-sung.ts). Lùi: DROP TABLE bai_bo_sung;
CREATE TABLE IF NOT EXISTS bai_bo_sung (
  khoa TEXT PRIMARY KEY, ma_ca TEXT NOT NULL, sbd TEXT NOT NULL, lan_thu INTEGER NOT NULL,
  dap_an_json TEXT NOT NULL, giay_cau_json TEXT, so_cau_moi INTEGER NOT NULL DEFAULT 0,
  gui_luc TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'cho', xu_ly_luc TEXT);
CREATE INDEX IF NOT EXISTS idx_bai_bo_sung_ca ON bai_bo_sung (ma_ca, trang_thai);
