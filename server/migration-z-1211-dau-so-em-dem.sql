-- H1 (12/11): DẤU «bảng so_em_dem đã nạp đủ» — câu đếm sổ `demSoDong` (server/src/omni-d1.ts) chỉ dùng bảng khi có dòng này.
-- CHỈ chạy SAU KHI migration-z-1211-a-so-em-dem.sql đã chạy TRỌN (trigger + nạp) và soát khớp, ví dụ câu sau trả 0 dòng:
--   SELECT s.sbd FROM (SELECT sbd, COUNT(*) n, MAX(COALESCE(received_at,0)) r FROM su_kien_hoc GROUP BY sbd) s
--     LEFT JOIN so_em_dem d ON d.sbd = s.sbd WHERE d.n IS NOT s.n OR d.r IS NOT s.r;
-- Gỡ dấu (về đường cũ ngay): DELETE FROM so_em_dem WHERE sbd = '*';
INSERT INTO so_em_dem (sbd, n, r) VALUES ('*', 0, 0) ON CONFLICT (sbd) DO NOTHING;
