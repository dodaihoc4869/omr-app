-- KẾ HOẠCH NGÀY CỦA EM TRONG CHIẾN DỊCH ĐÃ HUỶ SỚM NHẤT (CHỈ ĐỌC, chỉ in SỐ ĐẾM — không mã em / mã chiến dịch / mã câu). Mỗi hàng = một ngày kế hoạch (mới nhất trước) của em nằm trong chiến dịch ấy.
--   dang_gan_cd_huy : 1 nếu bản ghi kế hoạch còn ghi mã chiến dịch ĐÃ HUỶ (chưa lập lại sau huỷ)
--   khong_cd        : 1 nếu kế hoạch ghi KHÔNG chiến dịch (đã lập lại sau huỷ, hoặc lập khi chưa có chiến dịch)
--   dau_sua         : 1 nếu mã có hậu tố "#…" (đánh dấu lập lại)
--   lap_sau_khi_huy : 1 nếu bản ghi kế hoạch được LẬP sau lúc huỷ
--   dao_thuoc_cd_huy / doan_thuoc_cd_huy : số câu của kế hoạch (Đảo / Đoàn) nằm trong tập câu của chiến dịch đã huỷ
--   cd_trong_phu    : số chiến dịch trong bảng phụ OMNI (nếu có); cd_huy_trong_phu: bảng phụ còn nhắc chiến dịch đã huỷ
WITH huy AS (
  SELECT id, sbd_json, qid_json, dong_luc FROM chien_dich WHERE trang_thai = 'da_huy' AND COALESCE(dong_luc, '') >= '2026-09-29' AND json_valid(sbd_json) AND json_valid(qid_json) ORDER BY tao_luc LIMIT 1
)
SELECT
  k.ngay AS ngay,
  CASE WHEN k.chien_dich_id = (SELECT id FROM huy) THEN 1 ELSE 0 END AS dang_gan_cd_huy,
  CASE WHEN k.chien_dich_id IS NULL THEN 1 ELSE 0 END AS khong_cd,
  CASE WHEN k.chien_dich_id LIKE '%#%' THEN 1 ELSE 0 END AS dau_sua,
  CASE WHEN k.tao_luc > (SELECT dong_luc FROM huy) THEN 1 ELSE 0 END AS lap_sau_khi_huy,
  k.tong AS tong,
  (SELECT COUNT(*) FROM json_each(k.dao_json)) AS so_dao,
  (SELECT COUNT(*) FROM json_each(k.doan_json)) AS so_doan,
  (SELECT COUNT(*) FROM json_each(k.dao_json) j WHERE substr(j.value, 1, instr(j.value || '#', '#') - 1) IN (SELECT value FROM json_each((SELECT qid_json FROM huy)))) AS dao_thuoc_cd_huy,
  (SELECT COUNT(*) FROM json_each(k.doan_json) j WHERE substr(j.value, 1, instr(j.value || '#', '#') - 1) IN (SELECT value FROM json_each((SELECT qid_json FROM huy)))) AS doan_thuoc_cd_huy,
  (SELECT json_array_length(o.chien_dich_json) FROM srs2_ke_hoach_omni o WHERE o.sbd = k.sbd AND o.ngay = k.ngay AND json_valid(o.chien_dich_json)) AS cd_trong_phu,
  (SELECT CASE WHEN instr(o.chien_dich_json, (SELECT id FROM huy)) > 0 THEN 1 ELSE 0 END FROM srs2_ke_hoach_omni o WHERE o.sbd = k.sbd AND o.ngay = k.ngay) AS cd_huy_trong_phu
FROM srs2_ke_hoach k
WHERE k.sbd IN (SELECT value FROM json_each((SELECT sbd_json FROM huy)))
ORDER BY k.ngay DESC
LIMIT 6
