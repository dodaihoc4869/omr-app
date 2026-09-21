-- CHỈ THÊM (21/09/2026): BẢNG LƯU cho việc GỠ em khỏi danh sách theo cách KHÔI PHỤC ĐƯỢC (thầy lệnh; Boss: "không DELETE trắng").
-- Gỡ = chép nguyên dòng sang bảng lưu RỒI mới xoá dòng gốc (xem server/go-2109-em-chua-mo-app.sql); khôi phục = chép ngược (server/go-2109-em-chua-mo-app-lui.sql).
-- Bảng lưu giữ ĐỦ cột của hoc_sinh / danh_sach (kể cả token, mật khẩu, tên lớp) + `go_luc`, `ly_do`. Không ai đọc bảng này trong lệnh của app; reset toàn app giữ nguyên.
-- Lùi: DROP TABLE hoc_sinh_da_go; DROP TABLE danh_sach_da_go (chỉ khi đã khôi phục hết).
CREATE TABLE IF NOT EXISTS hoc_sinh_da_go (
  sbd          TEXT PRIMARY KEY,
  ho_ten       TEXT,
  nam_sinh     TEXT,
  lop          TEXT,
  sdt          TEXT,
  trang_thai   TEXT,
  token        TEXT,
  mat_khau     TEXT,
  tao_luc      TEXT,
  cap_nhat_luc TEXT,
  ten_lop      TEXT,
  go_luc       TEXT NOT NULL,
  ly_do        TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS danh_sach_da_go (
  sbd          TEXT PRIMARY KEY,
  ho_ten       TEXT,
  nam_sinh     TEXT,
  lop          TEXT,
  cap_nhat_luc TEXT,
  go_luc       TEXT NOT NULL,
  ly_do        TEXT NOT NULL
);
