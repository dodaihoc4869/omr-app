-- 12/11 ĐỢT 3 · NHÓM H2 (hoá đơn D1 hàng đọc — câu GỌI RẤT NHIỀU, mỗi lượt đọc vài chục–vài trăm hàng). CHỈ-THÊM, chạy lại vô hại.
-- Tên «z-» để D1 giả trong test (tests/_d1-that.ts nạp migration theo thứ tự tên) dựng SAU mọi bảng mà trigger bên dưới trỏ tới.
-- Test khoá: tests/h2-goi-nhieu-1211.test.ts.

-- (2) `SELECT COUNT(*) AS n FROM ca WHERE trang_thai='mo'` (goi-bai-7.ts dongBoThat7, 493 nghìn lượt × 41 hàng) và mọi `EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`
--     (chặn ghi khi có ca thi mở): bảng `ca` không có chỉ mục nào ngoài khoá chính ⇒ quét cả bảng. Nay SEARCH theo trạng thái (đọc đúng số ca đang mở).
CREATE INDEX IF NOT EXISTS idx_ca_trang_thai ON ca(trang_thai);
-- (3) caDangBaoVe (game-v2-bank.ts, 371 nghìn lượt × 41 hàng): chỉ mục BỘ PHẬN chỉ chứa ca CÓ THỂ còn bảo vệ đề — bỏ ca đã xoá và ca ĐÃ ĐÓNG đã công bố
--     (cong_bo ngay / ca_lop_xong — đúng nhánh `released` của bộ lọc JS, ca đóng thì canStillTest=false). Câu SQL chép NGUYÊN VĂN hai điều kiện này.
CREATE INDEX IF NOT EXISTS idx_ca_bao_ve ON ca(ma_ca) WHERE trang_thai<>'da_xoa' AND (trang_thai<>'dong' OR COALESCE(cong_bo,'') NOT IN ('ngay','ca_lop_xong'));

-- (4) ddl-mot-lan.ts: bản sao DÙNG CHUNG danh sách tên đối tượng lược đồ (một dòng) — thay cho mỗi isolate mới đọc cả sqlite_master (~760 hàng).
--     Cron mỗi 10 phút chép lại (`lamMoiTenDoiTuongChung`); chưa có dòng ⇒ đọc sqlite_master như cũ (không chép ở đây: D1 giả của test dựng bảng sau migration).
CREATE TABLE IF NOT EXISTS ddl_ten_chung (id INTEGER PRIMARY KEY CHECK (id = 1), ten_json TEXT NOT NULL, luc INTEGER NOT NULL);
