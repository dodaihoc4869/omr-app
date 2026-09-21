-- CHỈ THÊM (21/09/2026): TÊN LỚP cho học sinh (thầy lệnh; Boss chốt: KHÔNG đổi `lop` — `lop` vẫn là KHỐI '10'/'11'/'12', nhiều nơi dùng, kể cả cổng vào thi).
-- `ten_lop` = tên lớp thầy đặt, ví dụ '12 - Tinh Hoa'. NULL = chưa gán ⇒ máy chủ lấy mặc định theo khối (khối 12 ⇒ '12 - Lớp Thường'; khối khác ⇒ chính khối) — xem server/src/ten-lop.ts.
-- Chỉ có ở `hoc_sinh` (một nguồn duy nhất). Mọi lệnh ghi hồ sơ hiện có đều là INSERT … ON CONFLICT DO UPDATE / INSERT OR IGNORE nên KHÔNG ghi đè cột này.
-- Lùi: ALTER TABLE hoc_sinh DROP COLUMN ten_lop. Chưa chạy migration thì `/gv/lop` trả lyDoThieu, `/gv/doi-lop-em` báo bằng lời, các lệnh khác chạy như cũ (đọc bọc try/catch).
-- LƯU Ý: ALTER TABLE ADD COLUMN không chạy lại được (lỗi "duplicate column name") — chỉ chạy MỘT lần.
ALTER TABLE hoc_sinh ADD COLUMN ten_lop TEXT;
