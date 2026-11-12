-- G5 (12/11): DẤU «bảng cau_lam_cuoi đã nạp đủ» — câu đọc `docCauDaLamMoiNguon` (server/src/game-v2-cau-moi.ts) chỉ dùng bảng khi có dòng này.
-- CHỈ chạy SAU KHI migration-z-1211-cau-lam-cuoi.sql đã chạy TRỌN (trigger + nạp) và soát khớp, ví dụ hai số sau bằng nhau:
--   SELECT COUNT(*) FROM cau_lam_cuoi WHERE sbd <> '*';   SELECT COUNT(*) FROM (SELECT 1 FROM su_kien_hoc GROUP BY sbd, qid);
-- Gỡ dấu (về đường cũ ngay): DELETE FROM cau_lam_cuoi WHERE sbd = '*' AND qid = '*';
INSERT INTO cau_lam_cuoi (sbd, qid, luc) VALUES ('*', '*', '') ON CONFLICT (sbd, qid) DO NOTHING;
