// HỘP THẺ NHỚ 5 NGĂN (Leitner) của Lời giải Kính — skill ôn tập của thầy: «lặp lại ngắt quãng, hẹn 1 → 3 → 7 → 14 ngày, lưu trên máy em».
// Lưu trên máy (localStorage, bọc try/catch — không lưu được thì vẫn hiện thẻ, chỉ không hẹn lịch). Không gọi mạng, không thêm lệnh máy chủ.
import type { TheNho } from './kieu'

export const KHOANG_NGAY = [1, 3, 7, 14] as const // ngăn 1–4; ngăn 5 = đã thuộc
const KHOA = 'ddh.theNho.v1'
const NGAY_MS = 86_400_000

export interface TheTrongHop extends TheNho { id: string; qid: string; ngan: number; hen: number; tao: number }

function doc(): TheTrongHop[] {
  try { const v = JSON.parse(localStorage.getItem(KHOA) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] }
}
function ghi(ds: TheTrongHop[]): void {
  try { localStorage.setItem(KHOA, JSON.stringify(ds.slice(-600))) } catch { /* không lưu được: bỏ qua */ }
}

/** Thêm thẻ của một câu (một lần mỗi thẻ). Trả số thẻ MỚI thêm. Thẻ đã có giữ nguyên ngăn. */
export function themTheNho(qid: string, the: readonly TheNho[], bayGio = Date.now()): number {
  if (!qid || !the.length) return 0
  const ds = doc()
  const co = new Set(ds.map((t) => t.id))
  let moi = 0
  the.forEach((t, i) => {
    const id = `${qid}#${i}`
    if (co.has(id)) return
    ds.push({ ...t, id, qid, ngan: 1, hen: bayGio + NGAY_MS, tao: bayGio })
    moi++
  })
  if (moi) ghi(ds)
  return moi
}

/** Chấm một thẻ: nhớ ⇒ lên ngăn sau (hẹn theo khoảng), chưa nhớ ⇒ về ngăn 1 (hẹn ngày mai). Trả số ngày tới lần gặp sau (null = đã thuộc). */
export function chamTheNho(id: string, nho: boolean, bayGio = Date.now()): number | null {
  const ds = doc()
  const t = ds.find((x) => x.id === id)
  if (!t) return null
  t.ngan = nho ? Math.min(5, t.ngan + 1) : 1
  const ngay = t.ngan >= 5 ? null : KHOANG_NGAY[t.ngan - 1]!
  t.hen = ngay === null ? Number.MAX_SAFE_INTEGER : bayGio + ngay * NGAY_MS
  ghi(ds)
  return ngay
}

/** Thẻ đến lịch hôm nay (hẹn ≤ bây giờ), cũ trước. */
export function theDenLich(bayGio = Date.now()): TheTrongHop[] {
  return doc().filter((t) => t.ngan < 5 && t.hen <= bayGio).sort((a, b) => a.hen - b.hen)
}
/** Số thẻ từng ngăn [n1..n5]. */
export function demNgan(): number[] {
  const d = [0, 0, 0, 0, 0]
  for (const t of doc()) d[Math.min(5, Math.max(1, t.ngan)) - 1]!++
  return d
}
