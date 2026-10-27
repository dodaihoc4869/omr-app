-- 28/10 — CHỈ-THÊM (đã chạy --remote 28/10). Câu DẤU của Sảnh / Mở chặng (server/src/san-sang.ts) chỉ đọc DÒNG CUỐI của em theo (sbd, mốc giờ):
-- `SELECT cap_nhat_luc FROM chua_loi_dot WHERE sbd=? ORDER BY cap_nhat_luc DESC LIMIT 1`. Không có chỉ mục ⇒ đọc hết dòng của em rồi sắp (TEMP B-TREE).
-- Chỉ mục cùng loại của goi_bai_7_gap (bảng tạo lúc chạy) nằm ở SQL_GOI7 (server/src/goi-bai-7-schema.ts). Bản sao trong CHI_MUC_CRON_DEM.
CREATE INDEX IF NOT EXISTS idx_cld_em_cap_nhat ON chua_loi_dot(sbd, cap_nhat_luc);
