-- 12/11 (hoá đơn D1 — nhóm câu quét/đóng đợt chữa lỗi, tests/chua-gon-quet-1211.test.ts). CHỈ-THÊM, chạy lại vô hại.
-- Hai chỉ mục bộ phận đầu là BẢN SAO của CHI_MUC_CRON_DEM (server/src/chi-muc-luc-chay.ts, dựng 00:01 VN) — đưa vào migration để D1 mới / D1 giả trong test
-- có cùng kế hoạch truy vấn với D1 thật:
--  · idx_cld_mo_em: cron gói sửa mỗi phút (goi-sua-dem.ts SQL_EM_CAN_GOI) nhảy từng em có đợt mở; câu đóng đợt khi em mở danh sách (chua-gon.ts SQL_DONG_DA_DUNG_LAI).
--  · idx_cld_mo_cu: cron đêm đóng đợt cũ theo con trỏ id (chua-gon-dem.ts).
CREATE INDEX IF NOT EXISTS idx_cld_mo_em ON chua_loi_dot(sbd, cap_nhat_luc) WHERE dong_luc IS NULL AND trang_thai_day<>'da_tu_sua';
CREATE INDEX IF NOT EXISTS idx_cld_mo_cu ON chua_loi_dot(id, sai_cuoi_luc, mo_luc) WHERE dong_luc IS NULL AND trang_thai_day<>'da_tu_sua';
-- Hàng chiếu chữa trên lớp (chua-cau-sai-chieu.ts docHang): lọc `trang_thai='cho_thay'`, xếp theo `gui_luc` — bảng nhỏ, chỉ mục mới.
CREATE INDEX IF NOT EXISTS idx_clt_cho ON chua_loi_thay(trang_thai, gui_luc);
