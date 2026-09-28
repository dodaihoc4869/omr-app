-- BUỔI HỌC + ĐIỂM DANH (bảng DẠY HỌC của mục Lên bảng, thầy lệnh 28/09/2026). CHỈ-THÊM: hai bảng mới, không đụng bảng cũ.
-- Máy chủ tự tạo lúc chạy (server/src/buoi-hoc.ts, SQL_TAO_BANG) — tệp này để chạy tay/đối chiếu, IF NOT EXISTS nên chạy lại vô hại.
-- Reset toàn app: hai bảng thuộc BANG_XOA (cùng họ với len_bang).
CREATE TABLE IF NOT EXISTS buoi_hoc (id TEXT PRIMARY KEY, ten TEXT NOT NULL, lop TEXT NOT NULL DEFAULT '', bi_mat TEXT NOT NULL, mo_luc TEXT NOT NULL, het_han TEXT NOT NULL, dong_luc TEXT, cap_nhat_luc TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS buoi_hoc_diem_danh (buoi_id TEXT NOT NULL, sbd TEXT NOT NULL, luc TEXT NOT NULL, cach TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT 'co_mat', cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (buoi_id, sbd));
