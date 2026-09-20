-- CHỈ THÊM (21/09/2026): `ca.them_phut_tong` = tổng số phút thầy đã THÊM cho ca đang chạy (lệnh `/ca/them-phut`, hợp đồng docs/hop-dong-them-phut-2109.md).
-- INTEGER mặc định 0, ca cũ giữ 0. Trần 30 phút mỗi ca do máy chủ giữ. Chạy MỘT lần (SQLite không có ADD COLUMN IF NOT EXISTS; chạy lại báo "duplicate column name", vô hại).
-- Máy chủ đã phòng vệ: chưa có cột thì `/ca/them-phut` báo lỗi bằng lời, còn `/ca/chi-tiet` và `examStatus` chạy như cũ.
-- Lùi: ALTER TABLE ca DROP COLUMN them_phut_tong;
ALTER TABLE ca ADD COLUMN them_phut_tong INTEGER NOT NULL DEFAULT 0;
