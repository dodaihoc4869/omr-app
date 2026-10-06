-- EM CÒN LÀM CÂU CỦA CHIẾN DỊCH SAU KHI THẦY HUỶ? (CHỈ ĐỌC, chỉ in SỐ ĐẾM — không mã chiến dịch / tên em / mã câu / mã em) — thầy 06/10: "hủy một chiến dịch amine, học sinh vẫn làm câu của chiến dịch".
-- Mỗi hàng = MỘT chiến dịch đã huỷ từ 29/09 (xếp theo lúc giao). Số liệu trên D1 THẬT, cho biết đường nào đang rò (trước bản vá):
--   lan_lam_trong / cap_sai_trong   : lần làm / cặp (em, câu) SAI của câu chiến dịch, từ lúc giao đến lúc huỷ — phần "nợ do chiến dịch sinh ra" mà bản vá không cho quay lại
--   lan_lam_sau_huy / em_sau_huy    : lần làm câu của chiến dịch (nguồn game) SAU lúc huỷ, và số em làm — chính là điều thầy thấy
--   luot_cu / luot_moi              : tách theo lượt game: lượt MỞ TRƯỚC lúc huỷ (máy em đã tải câu — bản vá đóng bằng cờ thuHoiLuc) / lượt MỞ SAU lúc huỷ (kế hoạch + nợ phát câu — bản vá đóng bằng bộ lọc nợ)
--   luot_moi_dao / _doan / _bia     : lượt mới theo loại (Đoàn = trận do phòng quản, bản vá KHÔNG đánh cờ)
SELECT
  (SELECT COUNT(*) FROM json_each(c.sbd_json)) AS so_em,
  (SELECT COUNT(*) FROM json_each(c.qid_json)) AS so_cau,
  (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.nguon = 'game' AND s.luc >= c.tao_luc AND s.luc <= c.dong_luc
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS lan_lam_trong,
  (SELECT COUNT(*) FROM (SELECT DISTINCT s.sbd, s.qid FROM su_kien_hoc s WHERE s.ket_qua = 0 AND s.luc >= c.tao_luc
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json)))) AS cap_sai_trong,
  (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.nguon = 'game' AND s.luc > c.dong_luc
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS lan_lam_sau_huy,
  (SELECT COUNT(DISTINCT s.sbd) FROM su_kien_hoc s WHERE s.nguon = 'game' AND s.luc > c.dong_luc
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS em_sau_huy,
  (SELECT COUNT(*) FROM su_kien_hoc s JOIN game_v2_session g ON g.id = s.ma_nguon WHERE s.nguon = 'game' AND s.luc > c.dong_luc AND g.created_at <= c.dong_luc
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS luot_cu,
  (SELECT COUNT(*) FROM su_kien_hoc s JOIN game_v2_session g ON g.id = s.ma_nguon WHERE s.nguon = 'game' AND s.luc > c.dong_luc AND g.created_at > c.dong_luc
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS luot_moi,
  (SELECT COUNT(*) FROM su_kien_hoc s JOIN game_v2_session g ON g.id = s.ma_nguon WHERE s.nguon = 'game' AND s.luc > c.dong_luc AND g.created_at > c.dong_luc
      AND COALESCE(json_extract(g.json, '$.doan'), 0) = 0 AND COALESCE(json_extract(g.json, '$.bia'), 0) = 0
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS luot_moi_dao,
  (SELECT COUNT(*) FROM su_kien_hoc s JOIN game_v2_session g ON g.id = s.ma_nguon WHERE s.nguon = 'game' AND s.luc > c.dong_luc AND g.created_at > c.dong_luc
      AND COALESCE(json_extract(g.json, '$.doan'), 0) = 1
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS luot_moi_doan,
  (SELECT COUNT(*) FROM su_kien_hoc s JOIN game_v2_session g ON g.id = s.ma_nguon WHERE s.nguon = 'game' AND s.luc > c.dong_luc AND g.created_at > c.dong_luc
      AND COALESCE(json_extract(g.json, '$.bia'), 0) = 1
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS luot_moi_bia,
  (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.nguon <> 'game' AND s.luc > c.dong_luc
      AND s.sbd IN (SELECT value FROM json_each(c.sbd_json)) AND s.qid IN (SELECT value FROM json_each(c.qid_json))) AS lan_lam_sau_huy_kenh_khac
FROM chien_dich c
WHERE c.trang_thai = 'da_huy' AND COALESCE(c.dong_luc, '') >= '2026-09-29' AND json_valid(c.sbd_json) AND json_valid(c.qid_json)
ORDER BY c.tao_luc
