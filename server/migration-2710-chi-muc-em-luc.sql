-- CHỈ THÊM (27/10/2026, thầy «App phải tức thì ở mọi khung giờ»). Bản sao của 2 dòng cuối CHI_MUC_CRON_DEM (server/src/chi-muc-luc-chay.ts) — cron 00:01 VN
-- tự dựng; tệp này để chạy tay ngoài giờ học nếu cần (workflow «Chạy migration chỉ-thêm»). IF NOT EXISTS ⇒ chạy lại vô hại.
CREATE INDEX IF NOT EXISTS idx_skh_em_luc ON su_kien_hoc(sbd, luc);
CREATE INDEX IF NOT EXISTS idx_lg_hoi_em_luc ON loi_giai_hoi(sbd, luc);
