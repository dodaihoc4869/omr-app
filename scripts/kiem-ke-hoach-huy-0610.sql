-- KẾ HOẠCH NGÀY CỦA EM TRONG TỪNG CHIẾN DỊCH ĐÃ HUỶ (CHỈ ĐỌC, chỉ in SỐ ĐẾM + giờ giao/huỷ — không mã em / mã chiến dịch / mã câu). Mỗi hàng = (chiến dịch đã huỷ từ 29/09 xếp theo lúc giao) × (ngày kế hoạch từ 04/10 của em trong chiến dịch ấy).
--   stt / tao_luc / dong_luc : thứ tự, lúc giao, lúc huỷ của chiến dịch
--   dang_gan_cd_huy : 1 nếu bản ghi kế hoạch còn ghi mã chiến dịch ĐÃ HUỶ (chưa lập lại sau huỷ)
--   lap_sau_khi_huy : 1 nếu bản ghi kế hoạch được LẬP sau lúc huỷ
--   dao_thuoc_cd_huy / doan_thuoc_cd_huy : số câu của kế hoạch (Đảo / Đoàn) nằm trong tập câu của chiến dịch đã huỷ
--   cd_huy_trong_phu: bảng phụ OMNI còn nhắc chiến dịch đã huỷ
WITH huy AS (
  SELECT row_number() OVER (ORDER BY tao_luc) AS stt, id, sbd_json, qid_json, tao_luc, dong_luc
  FROM chien_dich WHERE trang_thai = 'da_huy' AND COALESCE(dong_luc, '') >= '2026-09-29' AND json_valid(sbd_json) AND json_valid(qid_json)
)
SELECT
  h.stt AS stt, h.tao_luc AS tao_luc, h.dong_luc AS dong_luc, k.ngay AS ngay,
  CASE WHEN k.chien_dich_id = h.id THEN 1 ELSE 0 END AS dang_gan_cd_huy,
  CASE WHEN k.chien_dich_id IS NULL THEN 1 ELSE 0 END AS khong_cd,
  CASE WHEN k.tao_luc > h.dong_luc THEN 1 ELSE 0 END AS lap_sau_khi_huy,
  k.tong AS tong,
  (SELECT COUNT(*) FROM json_each(k.dao_json)) AS so_dao,
  (SELECT COUNT(*) FROM json_each(k.doan_json)) AS so_doan,
  (SELECT COUNT(*) FROM json_each(k.dao_json) j WHERE substr(j.value, 1, instr(j.value || '#', '#') - 1) IN (SELECT value FROM json_each(h.qid_json))) AS dao_thuoc_cd_huy,
  (SELECT COUNT(*) FROM json_each(k.doan_json) j WHERE substr(j.value, 1, instr(j.value || '#', '#') - 1) IN (SELECT value FROM json_each(h.qid_json))) AS doan_thuoc_cd_huy,
  (SELECT CASE WHEN instr(o.chien_dich_json, h.id) > 0 THEN 1 ELSE 0 END FROM srs2_ke_hoach_omni o WHERE o.sbd = k.sbd AND o.ngay = k.ngay) AS cd_huy_trong_phu
FROM huy h JOIN srs2_ke_hoach k ON k.sbd IN (SELECT value FROM json_each(h.sbd_json)) AND k.ngay >= '2026-10-04'
ORDER BY h.stt, k.ngay DESC
