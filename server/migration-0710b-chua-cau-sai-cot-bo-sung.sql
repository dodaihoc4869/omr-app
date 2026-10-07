-- Migration 0710b: bổ sung cột thiếu cho vòng chữa câu sai (07/10/2026).
-- CHỈ THÊM — không xóa, không đổi tên.
ALTER TABLE chua_loi_dot ADD COLUMN ly_do_thieu TEXT NOT NULL DEFAULT '';
ALTER TABLE chua_loi_item ADD COLUMN tieu_de TEXT NOT NULL DEFAULT '';
ALTER TABLE chua_loi_item ADD COLUMN muc_ho_tro_cao_nhat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE chua_loi_item ADD COLUMN cap_nhat_luc INTEGER NOT NULL DEFAULT 0;
