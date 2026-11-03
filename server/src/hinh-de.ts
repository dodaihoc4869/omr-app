// HÌNH CỦA ĐỀ — VẼ LẠI (thầy 03/11: «chỉ cần đề có hình là vẽ lại màu mè đẹp như thế này… hình vẽ mới là một thẻ riêng ở phía dưới»).
// Bước 1 (chỉ đọc): đếm câu kho đang dùng có hình theo VỊ TRÍ để định phạm vi — chỉ vẽ lại hình của ĐỀ (sau_de / cuoi_cau / imageDataUrl);
// KHÔNG đụng hình lời giải (sau_loi_giai — có đáp số), hình phương án / ý (bị xáo theo em), ảnh cả thân câu (thanCauImg — đề là ảnh).
import type { Env } from './kieu'

type Obj = Record<string, unknown>
const TU = `FROM game_v2_question q JOIN de_kho d ON d.ma_de = q.ma_de JOIN game_v2_index g ON g.ma_de = d.ma_de AND g.source_version = d.cap_nhat_luc WHERE COALESCE(d.da_xoa, 0) = 0`

export async function demHinhDe(env: Env) {
  const [viTri, rieng, nhom] = await Promise.all([
    env.DB.prepare(`SELECT json_extract(h.value, '$.viTri') AS vi_tri, COUNT(*) AS anh, COUNT(DISTINCT q.qid) AS cau ${TU.replace('WHERE', ", json_each(q.json, '$.hinhAnh') h WHERE")} GROUP BY 1 ORDER BY 2 DESC`).all<Obj>(),
    env.DB.prepare(`SELECT SUM(CASE WHEN json_extract(q.json, '$.thanCauImg') IS NOT NULL AND json_extract(q.json, '$.thanCauImg') <> '' THEN 1 ELSE 0 END) AS than_cau,
      SUM(CASE WHEN json_extract(q.json, '$.imageDataUrl') IS NOT NULL AND json_extract(q.json, '$.imageDataUrl') <> '' THEN 1 ELSE 0 END) AS anh_de,
      SUM(CASE WHEN json_array_length(json_extract(q.json, '$.choiceImgs')) > 0 THEN 1 ELSE 0 END) AS anh_pa,
      SUM(CASE WHEN json_array_length(json_extract(q.json, '$.ideaImgs')) > 0 THEN 1 ELSE 0 END) AS anh_y, COUNT(*) AS tong ${TU}`).first<Obj>(),
    env.DB.prepare(`SELECT COUNT(DISTINCT q.content_group) AS nhom_noi_dung, COUNT(DISTINCT q.qid) AS cau ${TU.replace('WHERE', ", json_each(q.json, '$.hinhAnh') h WHERE")}
      AND json_extract(h.value, '$.viTri') IN ('sau_de', 'cuoi_cau', 'de')`).first<Obj>(),
  ])
  return { ok: true, theoViTri: viTri.results ?? [], rieng, hinhDe: nhom }
}
