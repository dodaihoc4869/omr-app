-- KHÔI PHỤC CHUỖI MẤT OAN (02/11 — thầy: «Kiểm tra xem có học sinh nào làm đủ bị mất chuỗi không? Nếu có khôi phục chuỗi cho học sinh nhé»).
-- ⚠ GHI ĐÈ DỮ LIỆU THẬT: CHỈ chạy sau khi Boss soát, qua workflow .github/workflows/khoi-phuc-chuoi-0211.yml (ghi = co). Đẩy nhánh chỉ chạy phần ĐẾM.
--
-- VÌ SAO KHÔNG «UPDATE số chuỗi»: chuỗi KHÔNG lưu ở đâu cả — máy chủ tính lại mỗi lần từ sổ học + mức đã chốt (chuoiNgayCuaEm). Ngày oan = màn báo «Đủ x/y câu
-- hôm nay!» (sổ + câu học cách giải ≥ mức, hoặc máy chủ đã trả thưởng `tt|<ngày>|muc_tieu`) mà luật chuỗi (chỉ đếm sổ) báo thiếu. Cách khôi phục: HẠ MỨC
-- của đúng ngày oan ấy xuống ĐÚNG số câu luật chuỗi đếm được (c7 ≥ 1) ⇒ ngày ấy thành «đủ mức» ⇒ chuỗi tính lại lên đúng giá trị lẽ ra có (đã mô phỏng
-- trên dữ liệu thật bằng chính hàm máy chủ: scripts/kiem-chuoi-0211.ts — 98/98 em khớp, 0 em giảm). Hạ mức một ngày chỉ có thể biến ngày thiếu thành ngày
-- đủ ⇒ chuỗi chỉ TĂNG, bình chỉ còn nhiều hơn; dòng không thoả điều kiện (em không bị ảnh hưởng, ngày đã đạt) không bị đụng. Bảng thầy «Bài hằng ngày»
-- ngày ấy vẫn «đủ» (vốn đã đủ vì đếm cả câu học cách giải); số mức hiện = số câu em làm trong sổ.
--
-- Khung ngày: 28/10 (mốc luật «đủ mức») → 01/11. 28–30/10 là ngày bảo trì (không mất chuỗi) nhưng em đã đủ thì lẽ ra +1 lửa ⇒ cũng trả.
-- Điều kiện «em đủ theo màn» viết lại y SQL_CAU_TINH_MUC / SQL_CO_KET_QUA_HOAC_LUOT / sqlCauHocCachGiai (server/src/chuoi-ngay-bai.ts, bản 02/11).
-- Mỗi khối dưới đây là MỘT câu lệnh, mở bằng dòng «-- @@ TÊN». Workflow chạy: DEM_TRUOC → (ghi = co) GHI_1 → GHI_2 → GHI_3 → DEM_SAU → DEM_CON_LAI.
-- KHÔNG có SBD / tên trong kết quả in ra (repo công khai): chỉ ngày + số đếm.

-- @@ DEM_TRUOC — số dòng mức sẽ hạ theo ngày (phải khớp «số dòng mức sẽ hạ» của kiem-chuoi-0211: 28/10 14 · 29/10 30 · 30/10 28 · 31/10 17 · 01/11 42)
SELECT x.ngay AS ngay, COUNT(*) AS so_em, SUM(x.muc - x.c7) AS tong_cau_ha, SUM(x.c7 + x.k >= x.muc) AS du_nho_cau_hoc_cach_giai, SUM(x.c7 + x.k < x.muc) AS chi_co_thuong_dat_muc_tieu
FROM (
  SELECT m.sbd AS sbd, m.ngay AS ngay, m.muc AS muc,
    (SELECT COUNT(DISTINCT su_kien_hoc.qid) FROM su_kien_hoc WHERE su_kien_hoc.sbd = m.sbd AND su_kien_hoc.ngay_vn = m.ngay
      AND (ket_qua IS NOT NULL OR (nguon='game' AND purpose='luot'))
      AND ma_nguon NOT LIKE 'ktcn:%' AND COALESCE(nguon,'') NOT IN ('chua_loi','tu_luyen') AND COALESCE(json_extract(raw_json,'$.ll'),0)=0 AND ((nguon='game' AND purpose='luot') OR (COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND (c.cong_bo = 'ngay' OR (c.cong_bo = 'ca_lop_xong' AND (c.trang_thai = 'dong' OR ((SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) > 0 AND (SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) <= (SELECT COUNT(*) FROM luot cb_b WHERE cb_b.ma_ca = c.ma_ca AND cb_b.trang_thai = 'da_nop')))))))))
    ) AS c7,
    (SELECT COUNT(DISTINCT g.qid) FROM goi_bai_7_gap g WHERE g.sbd = m.sbd
      AND g.luc >= strftime('%Y-%m-%dT%H:%M:%fZ', m.ngay, '-7 hours') AND g.luc < strftime('%Y-%m-%dT%H:%M:%fZ', m.ngay, '+17 hours')
      AND NOT EXISTS (SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd = g.sbd AND su_kien_hoc.ngay_vn = date(g.luc, '+7 hours') AND su_kien_hoc.qid = g.qid
        AND (ket_qua IS NOT NULL OR (nguon='game' AND purpose='luot'))
        AND ma_nguon NOT LIKE 'ktcn:%' AND COALESCE(nguon,'') NOT IN ('chua_loi','tu_luyen') AND COALESCE(json_extract(raw_json,'$.ll'),0)=0 AND ((nguon='game' AND purpose='luot') OR (COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND (c.cong_bo = 'ngay' OR (c.cong_bo = 'ca_lop_xong' AND (c.trang_thai = 'dong' OR ((SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) > 0 AND (SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) <= (SELECT COUNT(*) FROM luot cb_b WHERE cb_b.ma_ca = c.ma_ca AND cb_b.trang_thai = 'da_nop')))))))))
      )) AS k,
    EXISTS (SELECT 1 FROM vang_so v WHERE v.sbd = m.sbd AND v.khoa_yeu_cau = 'tt|' || m.ngay || '|muc_tieu') AS th
  FROM goi_bai_7_muc_ngay m WHERE m.ngay BETWEEN '2026-10-28' AND '2026-11-01' AND m.muc > 0
) x
WHERE x.c7 >= 1 AND x.c7 < x.muc AND (x.c7 + x.k >= x.muc OR x.th = 1)
GROUP BY x.ngay ORDER BY x.ngay;

-- @@ GHI_1 — bảng sao lưu CHỈ-THÊM (giá trị cũ của đúng các dòng sẽ hạ; khoá (sbd, ngay) ⇒ chạy lại không ghi đè bản sao lưu đầu tiên)
CREATE TABLE IF NOT EXISTS chuoi_sao_luu_0211 (sbd TEXT NOT NULL, ngay TEXT NOT NULL, muc_cu INTEGER NOT NULL, muc_moi INTEGER NOT NULL, cau_so INTEGER NOT NULL,
  cau_hoc_cach_giai INTEGER NOT NULL, co_thuong INTEGER NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (sbd, ngay));

-- @@ GHI_2 — chép giá trị cũ (muc_cu) + giá trị mới (muc_moi = số câu luật chuỗi đếm) vào bảng sao lưu
INSERT OR IGNORE INTO chuoi_sao_luu_0211 (sbd, ngay, muc_cu, muc_moi, cau_so, cau_hoc_cach_giai, co_thuong, luc)
SELECT x.sbd, x.ngay, x.muc, x.c7, x.c7, x.k, x.th, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM (
  SELECT m.sbd AS sbd, m.ngay AS ngay, m.muc AS muc,
    (SELECT COUNT(DISTINCT su_kien_hoc.qid) FROM su_kien_hoc WHERE su_kien_hoc.sbd = m.sbd AND su_kien_hoc.ngay_vn = m.ngay
      AND (ket_qua IS NOT NULL OR (nguon='game' AND purpose='luot'))
      AND ma_nguon NOT LIKE 'ktcn:%' AND COALESCE(nguon,'') NOT IN ('chua_loi','tu_luyen') AND COALESCE(json_extract(raw_json,'$.ll'),0)=0 AND ((nguon='game' AND purpose='luot') OR (COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND (c.cong_bo = 'ngay' OR (c.cong_bo = 'ca_lop_xong' AND (c.trang_thai = 'dong' OR ((SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) > 0 AND (SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) <= (SELECT COUNT(*) FROM luot cb_b WHERE cb_b.ma_ca = c.ma_ca AND cb_b.trang_thai = 'da_nop')))))))))
    ) AS c7,
    (SELECT COUNT(DISTINCT g.qid) FROM goi_bai_7_gap g WHERE g.sbd = m.sbd
      AND g.luc >= strftime('%Y-%m-%dT%H:%M:%fZ', m.ngay, '-7 hours') AND g.luc < strftime('%Y-%m-%dT%H:%M:%fZ', m.ngay, '+17 hours')
      AND NOT EXISTS (SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd = g.sbd AND su_kien_hoc.ngay_vn = date(g.luc, '+7 hours') AND su_kien_hoc.qid = g.qid
        AND (ket_qua IS NOT NULL OR (nguon='game' AND purpose='luot'))
        AND ma_nguon NOT LIKE 'ktcn:%' AND COALESCE(nguon,'') NOT IN ('chua_loi','tu_luyen') AND COALESCE(json_extract(raw_json,'$.ll'),0)=0 AND ((nguon='game' AND purpose='luot') OR (COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot', 'chan_doan', 'chua_buoc') AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND (c.cong_bo = 'ngay' OR (c.cong_bo = 'ca_lop_xong' AND (c.trang_thai = 'dong' OR ((SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) > 0 AND (SELECT COUNT(*) FROM luot cb_a WHERE cb_a.ma_ca = c.ma_ca) <= (SELECT COUNT(*) FROM luot cb_b WHERE cb_b.ma_ca = c.ma_ca AND cb_b.trang_thai = 'da_nop')))))))))
      )) AS k,
    EXISTS (SELECT 1 FROM vang_so v WHERE v.sbd = m.sbd AND v.khoa_yeu_cau = 'tt|' || m.ngay || '|muc_tieu') AS th
  FROM goi_bai_7_muc_ngay m WHERE m.ngay BETWEEN '2026-10-28' AND '2026-11-01' AND m.muc > 0
) x
WHERE x.c7 >= 1 AND x.c7 < x.muc AND (x.c7 + x.k >= x.muc OR x.th = 1);

-- @@ GHI_3 — hạ mức ĐÚNG các dòng đã sao lưu, chỉ khi mức hiện tại vẫn bằng giá trị cũ đã chép (không ai sửa xen giữa) và mức mới nhỏ hơn (chỉ hạ, ≥ 1)
UPDATE goi_bai_7_muc_ngay SET muc = (SELECT b.muc_moi FROM chuoi_sao_luu_0211 b WHERE b.sbd = goi_bai_7_muc_ngay.sbd AND b.ngay = goi_bai_7_muc_ngay.ngay)
WHERE ngay BETWEEN '2026-10-28' AND '2026-11-01' AND EXISTS (SELECT 1 FROM chuoi_sao_luu_0211 b WHERE b.sbd = goi_bai_7_muc_ngay.sbd AND b.ngay = goi_bai_7_muc_ngay.ngay
  AND b.muc_moi >= 1 AND b.muc_moi < b.muc_cu AND goi_bai_7_muc_ngay.muc = b.muc_cu);

-- @@ DEM_SAU — theo ngày: số dòng sao lưu · đã hạ (mức = muc_moi) · chưa hạ (mức vẫn = muc_cu)
SELECT b.ngay AS ngay, COUNT(*) AS sao_luu, SUM(m.muc = b.muc_moi) AS da_ha, SUM(m.muc = b.muc_cu) AS chua_ha
FROM chuoi_sao_luu_0211 b LEFT JOIN goi_bai_7_muc_ngay m ON m.sbd = b.sbd AND m.ngay = b.ngay GROUP BY b.ngay ORDER BY b.ngay;

-- @@ DEM_CON_LAI — sau khi ghi, chạy lại DEM_TRUOC: phải RỖNG (không còn ngày oan nào trong khung).

-- @@ LUI — CHỈ khi cần trả lại như cũ (workflow KHÔNG chạy khối này; chạy tay sau khi Boss quyết):
-- UPDATE goi_bai_7_muc_ngay SET muc = (SELECT b.muc_cu FROM chuoi_sao_luu_0211 b WHERE b.sbd = goi_bai_7_muc_ngay.sbd AND b.ngay = goi_bai_7_muc_ngay.ngay)
-- WHERE EXISTS (SELECT 1 FROM chuoi_sao_luu_0211 b WHERE b.sbd = goi_bai_7_muc_ngay.sbd AND b.ngay = goi_bai_7_muc_ngay.ngay AND goi_bai_7_muc_ngay.muc = b.muc_moi);
