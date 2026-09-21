-- CHỈ THÊM (21/09/2026) — gói W2 "Thần thú mỗi ngày" Đợt 2 (prompt-than-thu-moi-ngay-2109.md): BẢNG ĐỆM "phần LỚP đã học".
-- `lop_da_hoc(ten_lop, dang)` = các dạng (mã dạng con) lớp đã học: có trong bài tập về nhà đã giao cho lớp + trong ca kiểm tra lớp đã làm (ca đã đóng/đã công bố). Máy chủ NẠP LƯỜI ≤ 1 lần / 6 giờ / lớp
-- (mốc nạp ở cau_hinh `lop_da_hoc|<tên lớp>`); vắng bảng ⇒ máy chủ coi như chưa có dạng lớp (game rút như cũ theo bằng chứng của em). Lùi: DROP TABLE lop_da_hoc.
CREATE TABLE IF NOT EXISTS lop_da_hoc (
  ten_lop      TEXT NOT NULL,
  dang         TEXT NOT NULL,
  cap_nhat_luc TEXT NOT NULL,
  PRIMARY KEY (ten_lop, dang)
);
