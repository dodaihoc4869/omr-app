-- CHỈ THÊM (21/09/2026): `len_bang.giay_thuc` = GIÂY THẬT của một lượt lên bảng (hợp đồng docs/hop-dong-giay-thuc-len-bang-1909.md, Code 1 ↔ Code 3).
-- NULL mặc định, hàng cũ giữ NULL. Số của mô hình giờ ở máy thầy: KHÔNG đưa ra cổng học sinh / phụ huynh.
-- Chạy MỘT lần (SQLite không có ADD COLUMN IF NOT EXISTS: chạy lại báo "duplicate column name", vô hại). Máy chủ đã phòng vệ: cột chưa có thì `/len-bang` ghi như cũ.
-- Lùi: ALTER TABLE len_bang DROP COLUMN giay_thuc;
ALTER TABLE len_bang ADD COLUMN giay_thuc REAL;
