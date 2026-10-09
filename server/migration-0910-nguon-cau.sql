-- Nguồn câu dự phòng và nhu cầu bổ sung, không sửa bảng/dữ liệu đã có.
CREATE TABLE IF NOT EXISTS hanh_trinh_nguon_cau (
 sbd TEXT NOT NULL,ngay TEXT NOT NULL,chien_dich_id TEXT NOT NULL,du_phong_json TEXT NOT NULL,
 thieu_json TEXT NOT NULL,toi_thieu INTEGER NOT NULL,da_xep INTEGER NOT NULL,cap_nhat_luc INTEGER NOT NULL,
 PRIMARY KEY(sbd,ngay));
