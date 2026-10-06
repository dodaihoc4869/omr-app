-- SAU KHI HUỶ, EM LÀM CÂU GÌ? (CHỈ ĐỌC, chỉ in SỐ ĐẾM theo TỜ ĐỀ — không mã em / mã chiến dịch / mã câu). Với TỪNG chiến dịch đã huỷ từ 29/09 (stt = thứ tự lúc giao) và các em của nó:
-- các lần làm (nguồn game) SAU lúc huỷ, gom theo tờ đề. Cột:
--   lan            : số lần làm câu của tờ ấy sau lúc huỷ
--   to_cua_cd_huy  : 1 nếu tờ ấy là tờ của CHÍNH chiến dịch đã huỷ (ma_de_json)
--   cau_cua_cd_huy : số lần làm mà CÂU (kể cả bản khác ~) nằm trong tập câu của chiến dịch đã huỷ — phần rò thật
--   trong_cd_chay  : số lần làm mà câu nằm trong chiến dịch CHƯA HUỶ còn trong hạn (kế hoạch bình thường)
--   trong_cd_het_han : câu nằm trong chiến dịch chưa huỷ nhưng ĐÃ QUÁ HẠN (chờ buổi chữa / nợ)
--   lan_sai        : số lần sai
WITH huy AS (
  SELECT row_number() OVER (ORDER BY tao_luc) AS stt, id, sbd_json, qid_json, ma_de_json, dong_luc
  FROM chien_dich WHERE trang_thai = 'da_huy' AND COALESCE(dong_luc, '') >= '2026-09-29' AND json_valid(sbd_json) AND json_valid(qid_json) AND json_valid(ma_de_json)
),
lam AS (
  SELECT h.stt, h.qid_json, h.ma_de_json, s.sbd, s.ket_qua, substr(s.qid, 1, instr(s.qid || '~', '~') - 1) AS goc
  FROM huy h JOIN su_kien_hoc s ON s.nguon = 'game' AND s.luc > h.dong_luc AND s.sbd IN (SELECT value FROM json_each(h.sbd_json))
)
SELECT
  l.stt AS stt,
  COALESCE(c.ma_de, '(không có trong kho)') AS to_de,
  COUNT(*) AS lan,
  MAX(CASE WHEN c.ma_de IN (SELECT value FROM json_each(l.ma_de_json)) THEN 1 ELSE 0 END) AS to_cua_cd_huy,
  SUM(CASE WHEN l.goc IN (SELECT value FROM json_each(l.qid_json)) THEN 1 ELSE 0 END) AS cau_cua_cd_huy,
  SUM(CASE WHEN EXISTS (SELECT 1 FROM chien_dich d WHERE d.trang_thai = 'dang_chay' AND d.han_nop >= '2026-10-06' AND json_valid(d.sbd_json) AND json_valid(d.qid_json)
        AND EXISTS (SELECT 1 FROM json_each(d.sbd_json) x WHERE x.value = l.sbd) AND EXISTS (SELECT 1 FROM json_each(d.qid_json) y WHERE y.value = l.goc)) THEN 1 ELSE 0 END) AS trong_cd_chay,
  SUM(CASE WHEN EXISTS (SELECT 1 FROM chien_dich d WHERE d.trang_thai <> 'da_huy' AND (d.trang_thai <> 'dang_chay' OR d.han_nop < '2026-10-06') AND json_valid(d.sbd_json) AND json_valid(d.qid_json)
        AND EXISTS (SELECT 1 FROM json_each(d.sbd_json) x WHERE x.value = l.sbd) AND EXISTS (SELECT 1 FROM json_each(d.qid_json) y WHERE y.value = l.goc)) THEN 1 ELSE 0 END) AS trong_cd_het_han,
  SUM(CASE WHEN l.ket_qua = 0 THEN 1 ELSE 0 END) AS lan_sai
FROM lam l LEFT JOIN cau_hoi c ON c.qid = l.goc
GROUP BY l.stt, c.ma_de
ORDER BY l.stt DESC, lan DESC
LIMIT 24
