-- GHI DỮ LIỆU THẬT MỘT LẦN (21/09/2026, thầy lệnh, Boss chốt) — chạy SAU migration-2109-ten-lop.sql. KHÔNG nằm trong danh sách migration-*.sql (test không nạp tệp này).
-- '12 - Tinh Hoa' = 41 em của danh sách ca 848875 (bảng phong_cho của bản sao lưu omr-d1-20260921-0225.sql, đủ 41 SBD, cả 41 đều khối 12) + SBD 12074 (Trần Triệu Bảo An) = 42 em.
-- Chỉ ghi cột mới `ten_lop`; ràng buộc lop = '12' để không dính nhầm em khối khác. Mọi em khối 12 còn lại KHÔNG cần ghi: mặc định của máy chủ là '12 - Lớp Thường'.
-- Kiểm sau khi chạy: SELECT COUNT(*) FROM hoc_sinh WHERE ten_lop = '12 - Tinh Hoa';  (mong 42; nếu thiếu, em đó không có dòng ở hoc_sinh — đối chiếu với btvn_em của '848875-muamnh60').
-- Lùi: UPDATE hoc_sinh SET ten_lop = NULL WHERE ten_lop = '12 - Tinh Hoa';
UPDATE hoc_sinh SET ten_lop = '12 - Tinh Hoa' WHERE lop = '12' AND sbd IN (
  '12021', '12022', '12027', '12033', '12066', '12068', '12069', '12070',
  '12071', '12072', '12074', '12075', '12076', '12077', '12080', '12081',
  '12082', '12083', '12085', '12086', '12087', '12088', '12089', '12090',
  '12091', '12092', '12093', '12094', '12095', '12096', '12097', '12098',
  '12101', '12102', '12103', '12105', '12107', '12109', '12110', '12111',
  '12112', '12115'
);
