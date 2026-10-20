-- ĐO D1 CHO ĐẶC TẢ TỰ SỬA LỖI (20/10/2026) — CHỈ SELECT, chỉ ra SỐ ĐẾM, không SBD, không tên.
-- Dùng cho mục 6 điểm 0 của docs/dac-ta-tu-sua-y-nghia-2010.md. Đã chạy thử cú pháp trên sqlite với dữ liệu giả (không phải số thật).
-- Chạy từng câu: npx wrangler d1 execute omr --remote --command "<một câu SELECT>"  (hoặc POST /accounts/<id>/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query).
-- "Cần sửa" = đúng luật `nhomMucChua` / lệnh `danh-sach` (chua-cau-sai.ts:899): đếm MỌI hàng của em, không lọc dong_luc; cột dang_mo ở (1) để kiểm hàng đã đóng mà chưa 'da_tu_sua'.
-- "Làm được hôm nay" = luật 4.4 của đặc tả: can_chan_doan / dang_chua_buoc / dang_ghep_bai / dang_kiem_chung, hoặc cho_gap_lai_2 đã tới hạn.
-- (1) Đếm câu theo trang_thai_day (mọi hàng, như lệnh danh-sach đang đếm); dang_mo = số hàng dong_luc IS NULL
SELECT trang_thai_day AS trang_thai, COUNT(*) AS so_cau, SUM(dong_luc IS NULL) AS dang_mo
FROM chua_loi_dot GROUP BY trang_thai_day ORDER BY so_cau DESC;
-- (2a) Như (1) nhưng chỉ em có >= 100 câu cần sửa (nhóm 'can' theo luật thẻ Hôm nay)
WITH muc AS (
  SELECT sbd, trang_thai_day AS tt,
    CASE WHEN trang_thai_day='da_tu_sua' THEN 'xong'
         WHEN trang_thai_day='cho_gap_lai_2' AND (julianday(den_han) IS NULL OR julianday(den_han)>julianday('now')) THEN 'cho'
         ELSE 'can' END AS nhom
  FROM chua_loi_dot),
em AS (SELECT sbd, COUNT(*) AS tong, SUM(nhom='can') AS can FROM muc GROUP BY sbd)
SELECT m.tt AS trang_thai, COUNT(*) AS so_cau, COUNT(DISTINCT m.sbd) AS so_em
FROM muc m JOIN em ON em.sbd=m.sbd WHERE em.can>=100 GROUP BY m.tt ORDER BY so_cau DESC;
-- (2b) Mỗi em >= 100 câu có mấy câu LÀM ĐƯỢC hôm nay (can_chan_doan / dang_chua_buoc / dang_ghep_bai / dang_kiem_chung / cho_gap_lai_2 đã tới hạn)
WITH muc AS (
  SELECT sbd,
    CASE WHEN trang_thai_day='da_tu_sua' THEN 'xong'
         WHEN trang_thai_day='cho_gap_lai_2' AND (julianday(den_han) IS NULL OR julianday(den_han)>julianday('now')) THEN 'cho'
         ELSE 'can' END AS nhom,
    CASE WHEN trang_thai_day IN ('can_chan_doan','dang_chua_buoc','dang_ghep_bai','dang_kiem_chung') THEN 1
         WHEN trang_thai_day='cho_gap_lai_2' AND julianday(den_han)<=julianday('now') THEN 1 ELSE 0 END AS lam_duoc
  FROM chua_loi_dot),
em AS (SELECT sbd, COUNT(*) AS tong, SUM(nhom='can') AS can, SUM(lam_duoc) AS lam_duoc FROM muc GROUP BY sbd),
x AS (SELECT 'can>=100' AS nguong, can, lam_duoc FROM em WHERE can>=100
      UNION ALL SELECT 'tong>=100', can, lam_duoc FROM em WHERE tong>=100)
SELECT nguong, CASE WHEN lam_duoc=0 THEN '0 câu' WHEN lam_duoc<3 THEN '1-2 câu' ELSE '>=3 câu' END AS cau_lam_duoc,
  COUNT(*) AS so_em, SUM(can) AS tong_can, SUM(lam_duoc) AS tong_lam_duoc
FROM x GROUP BY nguong, 2 ORDER BY nguong, 2;
-- (3a) Câu CHƯA xong có học liệu du_dung (nối theo qid_chuan, như chua-cau-sai-hoc-lieu.ts:252 và loi-giai.ts:774)
SELECT d.trang_thai_day AS trang_thai, COUNT(*) AS chua_xong,
  SUM(EXISTS(SELECT 1 FROM chua_loi_hoc_lieu h WHERE h.qid_chuan=d.qid_chuan AND h.trang_thai='du_dung')) AS co_hoc_lieu
FROM chua_loi_dot d WHERE d.trang_thai_day<>'da_tu_sua' GROUP BY d.trang_thai_day ORDER BY chua_xong DESC;
-- (3b) Như (3a) nhưng chỉ em có >= 100 câu cần sửa
WITH em AS (SELECT sbd FROM chua_loi_dot
  GROUP BY sbd HAVING SUM(CASE WHEN trang_thai_day='da_tu_sua' THEN 0
    WHEN trang_thai_day='cho_gap_lai_2' AND (julianday(den_han) IS NULL OR julianday(den_han)>julianday('now')) THEN 0 ELSE 1 END)>=100)
SELECT d.trang_thai_day AS trang_thai, COUNT(*) AS chua_xong,
  SUM(EXISTS(SELECT 1 FROM chua_loi_hoc_lieu h WHERE h.qid_chuan=d.qid_chuan AND h.trang_thai='du_dung')) AS co_hoc_lieu
FROM chua_loi_dot d WHERE d.trang_thai_day<>'da_tu_sua' AND d.sbd IN (SELECT sbd FROM em)
GROUP BY d.trang_thai_day ORDER BY chua_xong DESC;
