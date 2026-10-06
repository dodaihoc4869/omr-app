// NHÓM NỘI DUNG CỦA CÂU (06/10) — hai câu khác mã (qid) nhưng cùng `content_group` (băm nội dung, game-v2-bank.ts `contentGroup`) là MỘT câu.
// Dùng cho: `docDaGap` (câu đã gặp), kế hoạch ngày (`tamHoanCauKhoa`), rút đề ca (`nhomTrung` của src/lib/rut-de-v2.ts).
// Chỉ ĐỌC chỉ mục game. Câu không có bản ghi / nhóm rỗng ⇒ vắng trong kết quả = coi như KHÁC mọi câu (không đoán). Lỗi đọc ⇒ rỗng (như chưa biết nhóm nào).
import type { Env } from './kieu'

type Row = Record<string, unknown>
const CO_LO = 800 // một tham số JSON mỗi lượt, không để chuỗi phình vô hạn

/** qid → content_group (chỉ qid CÓ nhóm khác rỗng). Câu có ở nhiều tờ: lấy dòng đầu. Qid ảo (`~ss`, `~bt`, `~yd`) không có dòng ⇒ vắng. */
export async function docNhomTheoQid(env: Env, qids: readonly string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const xin = [...new Set(qids.filter((q) => q !== ''))]
  for (let i = 0; i < xin.length; i += CO_LO) {
    const r = await env.DB.prepare("SELECT qid, content_group AS nhom FROM game_v2_question WHERE content_group <> '' AND qid IN (SELECT value FROM json_each(?))")
      .bind(JSON.stringify(xin.slice(i, i + CO_LO))).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r.results ?? []) { const q = String(x.qid), g = String(x.nhom ?? ''); if (g && !ra.has(q)) ra.set(q, g) }
  }
  return ra
}

/** content_group → mọi qid cùng nhóm (kể cả bản ở tờ khác). Nhóm rỗng bị bỏ. */
export async function docQidCungNhom(env: Env, nhom: Iterable<string>): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  const xin = [...new Set([...nhom].filter((g) => g !== ''))]
  for (let i = 0; i < xin.length; i += CO_LO) {
    const r = await env.DB.prepare("SELECT DISTINCT content_group AS nhom, qid FROM game_v2_question WHERE content_group IN (SELECT value FROM json_each(?))")
      .bind(JSON.stringify(xin.slice(i, i + CO_LO))).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r.results ?? []) { const g = String(x.nhom ?? ''); if (g) ra.set(g, [...(ra.get(g) ?? []), String(x.qid)]) }
  }
  return ra
}
