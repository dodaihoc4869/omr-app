-- GHI DỮ LIỆU THẬT MỘT LẦN (21/09/2026 ~10:50, thầy lệnh qua Boss) — chạy SAU migration-2109-ten-lop.sql và SAU gan-2109-ten-lop-tinh-hoa.sql. KHÔNG nằm trong danh sách migration-*.sql.
-- Tách 15 em khỏi Lớp Thường thành lớp "12 - Nhóm 10 điểm". Chỉ ghi cột `ten_lop`; ràng buộc lop = '12'; KHÔNG ghi đè em đã thuộc "12 - Tinh Hoa" (đối chiếu: không em nào trùng).
-- Kiểm sau khi chạy: SELECT COUNT(*) FROM hoc_sinh WHERE ten_lop = '12 - Nhóm 10 điểm';  (mong 15)   ·   SELECT COUNT(*) FROM hoc_sinh WHERE ten_lop = '12 - Tinh Hoa';  (vẫn 42)   ·   POST /gv/lop ⇒ 3 lớp khối 12.
-- Lùi: UPDATE hoc_sinh SET ten_lop = NULL WHERE ten_lop = '12 - Nhóm 10 điểm';   (em về mặc định "12 - Lớp Thường")
UPDATE hoc_sinh SET ten_lop = '12 - Nhóm 10 điểm' WHERE lop = '12' AND COALESCE(ten_lop, '') <> '12 - Tinh Hoa' AND sbd IN (
  '12053', '12067', '12073', '12078', '12079', '12100', '12104', '12106',
  '12108', '12114', '12116', '12117', '12120', '12122', '12123'
);
