-- CHỈ-THÊM (30/09, quét tối ưu lần cuối). Worker tự dựng trong cron 00:01 VN (CHI_MUC_CRON_DEM, chi-muc-luc-chay.ts) — tệp này chỉ để chạy tay nếu cần:
--   npx wrangler d1 execute <DB> --remote --file=server/migration-3009-chi-muc-quet-cuoi.sql
-- EXPLAIN trước: "SCAN game_v2_reward" / "SCAN bi_a_moi" / "SCAN bi_a_van"; sau: SEARCH … USING INDEX. Đo: tests/do-quet-cuoi-3009.test.ts.
CREATE INDEX IF NOT EXISTS idx_game_v2_reward_sbd ON game_v2_reward(sbd, created_at);
CREATE INDEX IF NOT EXISTS bi_a_moi_tu ON bi_a_moi(tu_sbd, tao_luc);
CREATE INDEX IF NOT EXISTS bi_a_van_cho ON bi_a_van(trang_thai, tao_luc);
