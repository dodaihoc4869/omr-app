// Câu đếm sổ theo em (H1 12/11) — tách khỏi omni-d1.ts (cổng cỡ tệp). omni-d1.ts nhập + xuất lại.
/** Đếm sổ CŨ (đường lùi khi D1 chưa có bảng `so_em_dem`): đọc mọi dòng chỉ mục (sbd, received_at) của em. */
export const SQL_DEM_SO_CU = 'SELECT sbd, COUNT(*) AS n, MAX(COALESCE(received_at, 0)) AS r FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd'
// H1 (12/11, hoá đơn D1: câu cũ ~1,8 nghìn hàng × 23,6 nghìn lượt/ngày ≈ 42,5 triệu): đọc (n, r) TÍNH SẴN ở `so_em_dem` (trigger trên sổ giữ đúng =
// COUNT / MAX(COALESCE(received_at,0)) — server/migration-z-1211-a-so-em-dem.sql) khi có DẤU đã nạp (sbd '*'); chưa có dấu ⇒ CÙNG lệnh đếm thẳng từ sổ như cũ.
// Dấu nằm trong TẬP dò (`IN (… WHERE dấu)`): nhánh không dùng có tập rỗng ⇒ không đọc dòng nào. `n > 0` ⇒ em không còn dòng sổ vắng mặt như câu cũ.
const DAU_SO_EM = "EXISTS (SELECT 1 FROM so_em_dem WHERE sbd = '*')"
export const SQL_DEM_SO = `SELECT sbd, n, r FROM so_em_dem WHERE sbd IN (SELECT value FROM json_each(?1) WHERE ${DAU_SO_EM}) AND n > 0
  UNION ALL SELECT sbd, COUNT(*) AS n, MAX(COALESCE(received_at, 0)) AS r FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?1) WHERE NOT ${DAU_SO_EM}) GROUP BY sbd`
