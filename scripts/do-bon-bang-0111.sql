-- HÔM NAY · 4 BẢNG — SOÁT TRÊN DỮ LIỆU THẬT (CHỈ ĐỌC, 01/11). Một câu SELECT, chỉ SỐ ĐẾM GỘP: không SBD, không tên (repo công khai).
-- Ngưỡng = src/lib/bon-bang-kieu.ts NGUONG_BANG: Học thật ≥ 75 và Đối phó < 30 · Đối phó ≥ 50 · Chăm ≥ 75 · Lười ≥ 60.
SELECT
  COUNT(*) AS so_em, MIN(ngay) AS ngay_som, MAX(ngay) AS ngay_muon,
  SUM(ht IS NULL) AS ht_chua_du_luot, SUM(ch IS NULL) AS ch_chua_du_ngay,
  SUM(ht >= 75 AND COALESCE(dp, 0) < 30) AS bang_hoc_that, SUM(dp >= 50) AS bang_doi_pho, SUM(ch >= 75) AS bang_cham, SUM(lu >= 60) AS bang_luoi,
  SUM(dp >= 50 AND ch >= 75) AS doi_pho_ma_cham, SUM(ht >= 75 AND lu >= 60) AS hoc_that_ma_luoi,
  ROUND(AVG(ht), 1) AS tb_ht, ROUND(AVG(dp), 1) AS tb_dp, ROUND(AVG(ch), 1) AS tb_ch, ROUND(AVG(lu), 1) AS tb_lu,
  SUM(dp < 10) AS dp_0_10, SUM(dp >= 10 AND dp < 30) AS dp_10_30, SUM(dp >= 30 AND dp < 50) AS dp_30_50, SUM(dp >= 50 AND dp < 70) AS dp_50_70, SUM(dp >= 70) AS dp_70_100,
  SUM(ht < 40) AS ht_0_40, SUM(ht >= 40 AND ht < 60) AS ht_40_60, SUM(ht >= 60 AND ht < 75) AS ht_60_75, SUM(ht >= 75) AS ht_75_100,
  SUM(ch < 25) AS ch_0_25, SUM(ch >= 25 AND ch < 50) AS ch_25_50, SUM(ch >= 50 AND ch < 75) AS ch_50_75, SUM(ch >= 75) AS ch_75_100,
  ROUND(AVG(so_luot), 0) AS tb_luot, MAX(so_luot) AS max_luot, SUM(so_luot = 0) AS em_0_luot
FROM bon_chi_so_em;
