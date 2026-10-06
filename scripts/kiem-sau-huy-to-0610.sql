-- SAU KHI HUỶ, EM (chiến dịch đã huỷ có đúng 1 em) LÀM CÂU GÌ? (CHỈ ĐỌC, chỉ in SỐ ĐẾM theo TỜ ĐỀ — không mã em / mã chiến dịch / mã câu). Mỗi hàng = một tờ đề em làm sau lúc huỷ chiến dịch đã huỷ SỚM NHẤT (từ 29/09).
--   lan            : số lần làm (nguồn game) câu của tờ ấy sau lúc huỷ
--   to_cua_cd_huy  : 1 nếu tờ ấy là tờ của CHÍNH chiến dịch đã huỷ (ma_de_json), 0 nếu tờ khác
--   trong_cd_chay  : số lần làm mà câu nằm trong một chiến dịch ĐANG CHẠY có em ấy (kế hoạch bình thường — không phải rò)
--   lan_sai        : số lần sai
-- Cho biết 186 lần làm sau huỷ đến từ đâu (tờ đã huỷ / chiến dịch khác đang chạy / nợ & ôn tập).
WITH huy AS (
  SELECT id, sbd_json, ma_de_json, dong_luc FROM chien_dich WHERE trang_thai = 'da_huy' AND COALESCE(dong_luc, '') >= '2026-09-29' AND json_valid(sbd_json) AND json_valid(ma_de_json) ORDER BY tao_luc LIMIT 1
),
lam AS (
  SELECT s.sbd, s.qid, s.ket_qua, substr(s.qid, 1, instr(s.qid || '~', '~') - 1) AS goc
  FROM su_kien_hoc s, huy
  WHERE s.nguon = 'game' AND s.luc > huy.dong_luc AND s.sbd IN (SELECT value FROM json_each(huy.sbd_json))
)
SELECT
  COALESCE(h.ma_de, '(không có trong kho)') AS to_de,
  COUNT(*) AS lan,
  MAX(CASE WHEN h.ma_de IN (SELECT value FROM json_each((SELECT ma_de_json FROM huy))) THEN 1 ELSE 0 END) AS to_cua_cd_huy,
  SUM(CASE WHEN EXISTS (SELECT 1 FROM chien_dich d WHERE d.trang_thai <> 'da_huy' AND json_valid(d.sbd_json) AND json_valid(d.qid_json)
        AND EXISTS (SELECT 1 FROM json_each(d.sbd_json) x WHERE x.value = l.sbd) AND EXISTS (SELECT 1 FROM json_each(d.qid_json) y WHERE y.value = l.goc)) THEN 1 ELSE 0 END) AS trong_cd_chay,
  SUM(CASE WHEN l.ket_qua = 0 THEN 1 ELSE 0 END) AS lan_sai
FROM lam l LEFT JOIN cau_hoi h ON h.qid = l.goc
GROUP BY h.ma_de
ORDER BY lan DESC
LIMIT 14
