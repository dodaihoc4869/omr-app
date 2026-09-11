-- MIGRATION 11/09/2026 (đợt 5B) — màn Ca thi đọc thẳng D1.
--
-- CHỈ THÊM. Không đổi tên, không xoá, không đụng cột đang có.
--
-- SQLite KHÔNG có `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, nên bốn câu ALTER
-- dưới đây chạy lần hai sẽ báo "duplicate column name" và DỪNG. Đó là hành vi
-- đúng và vô hại: cột đã có rồi. Chạy tiếp phần dưới bằng tay nếu cần.

ALTER TABLE ca ADD COLUMN mo_luc   TEXT;
ALTER TABLE ca ADD COLUMN pham_vi  TEXT;
ALTER TABLE ca ADD COLUMN len_bang INTEGER NOT NULL DEFAULT 1;
ALTER TABLE ca ADD COLUMN xoa_luc  TEXT;

-- DẤU ĐỒNG BỘ — cổng an toàn của cả đợt này.
--
-- Màn Ca thi CHỈ đọc D1 khi bảng này có dòng `ca_day_du` và dòng ấy ghi số ca
-- và số lượt KHỚP với bên Apps Script. Chưa khớp thì app đọc đường cũ y như
-- hôm nay. Nhờ vậy việc chuyển dữ liệu hỏng nửa chừng KHÔNG bao giờ biến thành
-- màn Ca thi hiện thiếu ca hay đếm sai số em.
CREATE TABLE IF NOT EXISTS dong_bo (
  ma      TEXT PRIMARY KEY,
  luc     TEXT NOT NULL,
  so_ca   INTEGER NOT NULL DEFAULT 0,
  so_luot INTEGER NOT NULL DEFAULT 0,
  ghi_chu TEXT
);
