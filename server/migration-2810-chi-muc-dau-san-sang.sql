-- 28/10 — CHỈ-THÊM. Câu DẤU của Sảnh / Mở chặng (server/src/san-sang.ts) chỉ đọc DÒNG CUỐI của em theo (sbd, mốc giờ):
-- `SELECT luc FROM goi_bai_7_gap WHERE sbd=? ORDER BY luc DESC LIMIT 1`, `SELECT cap_nhat_luc FROM chua_loi_dot WHERE sbd=? ORDER BY cap_nhat_luc DESC LIMIT 1`.
-- Không có hai chỉ mục này ⇒ đọc hết dòng của em rồi sắp (TEMP B-TREE). Bản sao trong CHI_MUC_CRON_DEM (server/src/chi-muc-luc-chay.ts).
CREATE INDEX IF NOT EXISTS goi_bai_7_gap_sbd_luc ON goi_bai_7_gap(sbd, luc);
CREATE INDEX IF NOT EXISTS idx_cld_em_cap_nhat ON chua_loi_dot(sbd, cap_nhat_luc);
