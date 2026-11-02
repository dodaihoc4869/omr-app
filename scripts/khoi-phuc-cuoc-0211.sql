-- HOÀN TINH THỂ CƯỢC CHUỖI THUA OAN (02/11 — thầy: «Khôi phục lại tinh thể đã cược cho học sinh nhé. Vì chuỗi đã khôi phục rồi»).
-- Bối cảnh: chuỗi mất oan 28/10–01/11 đã khôi phục lúc 02:55 VN 02/11 (workflow khoi-phuc-chuoi-0211, bảng chỉ-thêm chuoi_sao_luu_0211 = các ngày oan đã hạ mức).
-- Cron thưởng chốt cược lúc 00:10–00:59 VN (thuong-d1.ts, «Chốt cược»): duyệt từ tu_ngay, gặp NGÀY ĐẦU TIÊN không học ⇒ thua ngay ở lượt cron hôm sau.
-- ⇒ Ngày làm thua = ngày chốt − 1. Cược THUA OAN = ngày làm thua là một ngày oan đã khôi phục của chính em (ngày ấy nay đã «đủ mức»).
-- Cách hoàn: trả lại ĐÚNG số tinh thể đã đặt (cột dat, 50) — dòng vang_so 'doi' khoá `tt|cuoc|<id>|hoan` (INSERT OR IGNORE ⇒ chạy lại không cộng đôi).
-- Không sửa cuoc_chuoi, không xoá gì. Bảng chỉ-thêm cuoc_hoan_0211 ghi lại đúng các lượt đã hoàn (để soát / lùi).
-- Mỗi khối là MỘT câu lệnh, mở bằng dòng «-- @@ TÊN». In ra chỉ ngày + số đếm (repo công khai): không SBD, không tên.

-- @@ DEM_BOI_CANH — mọi cược THUA từ 28/10 theo ngày chốt: số cược · số em · số thua oan (ngày làm thua là ngày oan) · số có ngày oan trong khung nhưng không phải ngày làm thua
SELECT date(c.xong_luc, '+7 hours') AS ngay_chot, COUNT(*) AS so_thua, COUNT(DISTINCT c.em) AS so_em,
  SUM(EXISTS (SELECT 1 FROM chuoi_sao_luu_0211 b JOIN goi_bai_7_muc_ngay m ON m.sbd = b.sbd AND m.ngay = b.ngay AND m.muc = b.muc_moi
    WHERE b.sbd = c.em AND b.ngay = date(c.xong_luc, '+7 hours', '-1 day') AND b.ngay BETWEEN c.tu_ngay AND c.den_ngay)) AS thua_oan,
  SUM(NOT EXISTS (SELECT 1 FROM chuoi_sao_luu_0211 b WHERE b.sbd = c.em AND b.ngay = date(c.xong_luc, '+7 hours', '-1 day'))
    AND EXISTS (SELECT 1 FROM chuoi_sao_luu_0211 b WHERE b.sbd = c.em AND b.ngay BETWEEN c.tu_ngay AND c.den_ngay)) AS co_ngay_oan_khac
FROM cuoc_chuoi c WHERE c.trang_thai = 'thua' AND c.xong_luc >= '2026-10-27T17:00:00Z' GROUP BY 1 ORDER BY 1;

-- @@ DEM_TRUOC — cược thua oan CHƯA hoàn, theo ngày làm thua: số cược · số em · tổng tinh thể sẽ hoàn
SELECT b.ngay AS ngay_thua, COUNT(*) AS so_cuoc, COUNT(DISTINCT c.em) AS so_em, SUM(c.dat) AS tinh_the_hoan
FROM cuoc_chuoi c JOIN chuoi_sao_luu_0211 b ON b.sbd = c.em AND b.ngay = date(c.xong_luc, '+7 hours', '-1 day') AND b.ngay BETWEEN c.tu_ngay AND c.den_ngay
  JOIN goi_bai_7_muc_ngay m ON m.sbd = b.sbd AND m.ngay = b.ngay AND m.muc = b.muc_moi
WHERE c.trang_thai = 'thua' AND c.dat > 0 AND NOT EXISTS (SELECT 1 FROM vang_so v WHERE v.sbd = c.em AND v.khoa_yeu_cau = 'tt|cuoc|' || c.id || '|hoan')
GROUP BY b.ngay ORDER BY b.ngay;

-- @@ GHI_1 — bảng chỉ-thêm ghi các lượt hoàn (khoá id cược ⇒ chạy lại không ghi đè)
CREATE TABLE IF NOT EXISTS cuoc_hoan_0211 (id TEXT PRIMARY KEY, em TEXT NOT NULL, dat INTEGER NOT NULL, ngay_thua TEXT NOT NULL, luc TEXT NOT NULL);

-- @@ GHI_2 — chép đúng các cược thua oan chưa hoàn vào bảng chỉ-thêm
INSERT OR IGNORE INTO cuoc_hoan_0211 (id, em, dat, ngay_thua, luc)
SELECT c.id, c.em, c.dat, b.ngay, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM cuoc_chuoi c JOIN chuoi_sao_luu_0211 b ON b.sbd = c.em AND b.ngay = date(c.xong_luc, '+7 hours', '-1 day') AND b.ngay BETWEEN c.tu_ngay AND c.den_ngay
  JOIN goi_bai_7_muc_ngay m ON m.sbd = b.sbd AND m.ngay = b.ngay AND m.muc = b.muc_moi
WHERE c.trang_thai = 'thua' AND c.dat > 0 AND NOT EXISTS (SELECT 1 FROM vang_so v WHERE v.sbd = c.em AND v.khoa_yeu_cau = 'tt|cuoc|' || c.id || '|hoan');

-- @@ GHI_3 — cộng lại tinh thể đã cược (một dòng mỗi cược, khoá duy nhất ⇒ không cộng đôi)
INSERT OR IGNORE INTO vang_so (sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc)
SELECT h.em, 'doi', h.dat, 0, 'tt-cuoc-hoan', 'tt|cuoc|' || h.id || '|hoan', h.luc FROM cuoc_hoan_0211 h
WHERE h.dat > 0 AND NOT EXISTS (SELECT 1 FROM vang_so v WHERE v.sbd = h.em AND v.khoa_yeu_cau = 'tt|cuoc|' || h.id || '|hoan');

-- @@ DEM_SAU — theo ngày làm thua: số lượt đã ghi bảng hoàn · số đã có dòng tinh thể · tổng tinh thể đã hoàn
SELECT h.ngay_thua AS ngay_thua, COUNT(*) AS so_cuoc, SUM(EXISTS (SELECT 1 FROM vang_so v WHERE v.sbd = h.em AND v.khoa_yeu_cau = 'tt|cuoc|' || h.id || '|hoan')) AS da_cong,
  (SELECT SUM(v.so_vang) FROM vang_so v WHERE v.ma_mon = 'tt-cuoc-hoan' AND v.khoa_yeu_cau IN (SELECT 'tt|cuoc|' || x.id || '|hoan' FROM cuoc_hoan_0211 x WHERE x.ngay_thua = h.ngay_thua)) AS tinh_the
FROM cuoc_hoan_0211 h GROUP BY h.ngay_thua ORDER BY h.ngay_thua;

-- @@ LUI — CHỈ khi cần trả lại như cũ (workflow KHÔNG chạy khối này): ghi dòng âm khoá `…|hoan|lui` cho từng dòng hoàn.
-- INSERT OR IGNORE INTO vang_so (sbd, loai, so_vang, exp_tru, ma_mon, khoa_yeu_cau, luc) SELECT h.em, 'mua', -h.dat, 0, 'tt-cuoc-hoan-lui', 'tt|cuoc|' || h.id || '|hoan|lui', strftime('%Y-%m-%dT%H:%M:%fZ', 'now') FROM cuoc_hoan_0211 h;
