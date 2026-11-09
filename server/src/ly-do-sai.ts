// «VÌ SAO EM SAI?» phía máy chủ — khối B đợt 2 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911, «làm hết sạch đẩy luôn lên bản sống»).
// Máy em xếp hàng lý do (src/components/hoc-tap/vi-sao-sai.tsx) rồi gửi KÈM lệnh nộp câu kế: `ly: [[qid, 'tinh'|'cach'|'nham'], …]`.
// Ghi ở VIỆC PHỤ sau phản hồi (ctx.waitUntil của lệnh nộp, cùng chỗ ghi sổ) bằng MỘT câu lệnh cho mọi lý do của lượt ⇒ em bấm không chờ thêm;
// thân lệnh không có `ly` ⇒ 0 câu lệnh (đường nộp y như cũ). Đọc lại: gộp vào câu đọc mức ngày (goi-bai-7-loai-ngay.ts), không thêm lượt đọc.
import type { Env } from './kieu'

export type LyDoSai = 'tinh' | 'cach' | 'nham'
export const laLyDoSai = (x: unknown): x is LyDoSai => x === 'tinh' || x === 'cach' || x === 'nham'

/** Làm sạch `ly` của thân lệnh: tối đa 20 cặp [qid ≤ 120 ký tự, lý do hợp lệ]; trùng qid ⇒ giữ cặp sau. Sai kiểu ⇒ []. */
export function lySach(x: unknown): [string, LyDoSai][] {
  if (!Array.isArray(x)) return []
  const m = new Map<string, LyDoSai>()
  for (const c of x.slice(0, 20)) if (Array.isArray(c) && typeof c[0] === 'string' && c[0] && c[0].length <= 120 && laLyDoSai(c[1])) { m.delete(c[0]); m.set(c[0], c[1]) }
  return [...m]
}

/** Ghi lý do (lần cuối thắng) — MỘT câu lệnh cho cả lượt. Lỗi ⇒ ghi nhật ký, không ném (việc phụ sau phản hồi). */
export async function ghiLyDoSai(env: Env, sbd: string, ly: readonly [string, LyDoSai][], luc: string): Promise<void> {
  if (!ly.length || !sbd) return
  try {
    await env.DB.prepare(`INSERT INTO goi_bai_7_ly_do(sbd,qid,ly,luc) SELECT ?1,json_extract(value,'$[0]'),json_extract(value,'$[1]'),?2 FROM json_each(?3) WHERE true
      ON CONFLICT(sbd,qid) DO UPDATE SET ly=excluded.ly,luc=excluded.luc`).bind(sbd, luc, JSON.stringify(ly)).run()
  } catch (e) { console.error('[ly-do-sai] chưa ghi được:', e instanceof Error ? e.message : e) }
}

/** Đọc cột `ly` (json_group_array của [qid, lý do]) từ câu đọc mức ngày ⇒ Map qid → lý do. */
export function docCotLyDo(v: unknown): Map<string, LyDoSai> {
  const m = new Map<string, LyDoSai>()
  if (typeof v !== 'string' || !v) return m
  try { const a: unknown = JSON.parse(v); if (Array.isArray(a)) for (const c of a) if (Array.isArray(c) && typeof c[0] === 'string' && laLyDoSai(c[1])) m.set(c[0], c[1]) } catch { /* bỏ */ }
  return m
}
