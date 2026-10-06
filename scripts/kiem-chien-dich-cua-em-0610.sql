-- MỌI CHIẾN DỊCH CỦA EM ĐÃ ĐƯỢC GIAO CHIẾN DỊCH "AMINE" ĐÃ HUỶ HÔM NAY (CHỈ ĐỌC, chỉ in SỐ ĐẾM + mã tờ đề — không in tên chiến dịch / mã em / mã câu).
-- Thầy 06/10: "Tôi hủy một chiến dịch amine. Nhưng học sinh Đỗ Đại Học vẫn làm câu của chiến dịch" — có chiến dịch KHÁC (chưa huỷ) cùng em cùng chương amine không? em làm bao nhiêu câu ở từng chiến dịch?
-- Em = các em của chiến dịch đã huỷ GẦN NHẤT (hôm nay). Mỗi hàng = một chiến dịch có em ấy (mọi trạng thái), xếp theo lúc giao.
--   ten_co_amin : tên có chữ "amin" (1/0) · ma_de : các tờ đề của chiến dịch (mã kho) · so_em / so_cau : cỡ chiến dịch
--   lan_tu_khi_giao : số lần làm (game) câu của chiến dịch kể từ lúc giao · lan_hom_nay : trong đó hôm nay (giờ UTC từ 00:00 ngày 06/10 = 07:00 giờ VN)
--   lan_sau_dong : số lần làm câu của chiến dịch SAU lúc huỷ/kết thúc (0 nếu chiến dịch còn chạy)
--   cau_to_trong_ke_hoach_nay : số câu thuộc đúng các tờ đề của chiến dịch đang nằm trong kế hoạch ngày 06/10 của em (bất kể qua chiến dịch nào / nợ / ôn bài cũ)
WITH b AS (
  SELECT sbd_json FROM chien_dich WHERE trang_thai = 'da_huy' AND json_valid(sbd_json) ORDER BY tao_luc DESC LIMIT 1
),
em AS (SELECT value AS sbd FROM b, json_each(b.sbd_json))
SELECT
  c.trang_thai AS trang_thai, c.tao_luc AS tao_luc, c.dong_luc AS dong_luc, c.han_nop AS han_nop,
  CASE WHEN lower(c.ten) LIKE '%amin%' THEN 1 ELSE 0 END AS ten_co_amin,
  (SELECT COUNT(*) FROM json_each(c.sbd_json)) AS so_em, (SELECT COUNT(*) FROM json_each(c.qid_json)) AS so_cau, c.ma_de_json AS ma_de,
  (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.nguon = 'game' AND s.sbd IN (SELECT sbd FROM em) AND s.luc >= c.tao_luc
      AND substr(s.qid, 1, instr(s.qid || '~', '~') - 1) IN (SELECT value FROM json_each(c.qid_json))) AS lan_tu_khi_giao,
  (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.nguon = 'game' AND s.sbd IN (SELECT sbd FROM em) AND s.luc >= '2026-10-06T00:00:00'
      AND substr(s.qid, 1, instr(s.qid || '~', '~') - 1) IN (SELECT value FROM json_each(c.qid_json))) AS lan_hom_nay,
  (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.nguon = 'game' AND s.sbd IN (SELECT sbd FROM em) AND c.dong_luc IS NOT NULL AND c.dong_luc <> '' AND s.luc > c.dong_luc
      AND substr(s.qid, 1, instr(s.qid || '~', '~') - 1) IN (SELECT value FROM json_each(c.qid_json))) AS lan_sau_dong,
  (SELECT COUNT(*) FROM srs2_ke_hoach k, json_each(k.dao_json) j WHERE k.sbd IN (SELECT sbd FROM em) AND k.ngay = '2026-10-06'
      AND substr(j.value, 1, instr(j.value || '#', '#') - 1) IN (SELECT q.value FROM json_each(c.qid_json) q))
  + (SELECT COUNT(*) FROM srs2_ke_hoach k, json_each(k.doan_json) j WHERE k.sbd IN (SELECT sbd FROM em) AND k.ngay = '2026-10-06'
      AND substr(j.value, 1, instr(j.value || '#', '#') - 1) IN (SELECT q.value FROM json_each(c.qid_json) q)) AS cau_cua_cd_trong_ke_hoach_nay
FROM chien_dich c
WHERE json_valid(c.sbd_json) AND json_valid(c.qid_json) AND EXISTS (SELECT 1 FROM json_each(c.sbd_json) j WHERE j.value IN (SELECT sbd FROM em))
ORDER BY c.tao_luc
