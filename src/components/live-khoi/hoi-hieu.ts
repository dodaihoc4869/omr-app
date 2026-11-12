// HỎI NHANH «Hiểu chưa?» (phím /) — gói tin trên kênh lớp `k: 'hieu'` + phép xếp đốm sáng (thuần, có test).
/** Thầy → mọi máy em: mở (kèm số lượt hỏi `n`) / đóng. Máy thầy nhắc lại mỗi NHAC_MS cho em vào muộn. */
export interface TinHoiHieu { mo: boolean; n: number }
/** Em → phòng → CHỈ máy thầy: 1 = hiểu, 2 = chưa hiểu. */
export interface TinTraLoiHieu { v: 1 | 2; n: number }
export const NHAC_MS = 4000, HET_HAN_MS = 13000
export function docHoi(x: unknown): TinHoiHieu | null {
  const j = x as { mo?: unknown; n?: unknown } | null
  return j && typeof j === 'object' && typeof j.mo === 'boolean' && typeof j.n === 'number' && Number.isFinite(j.n) ? { mo: j.mo, n: j.n } : null
}
export function docTraLoi(x: unknown): TinTraLoiHieu | null {
  const j = x as { v?: unknown; n?: unknown } | null
  return j && typeof j === 'object' && (j.v === 1 || j.v === 2) && typeof j.n === 'number' ? { v: j.v, n: j.n } : null
}
/** Số giả-ngẫu-nhiên cố định theo chuỗi (0–1) — để mỗi em luôn có cùng cỡ / hướng bay, không nhảy khi vẽ lại. */
export function bam01(s: string, muoi = 0): number {
  let h = 2166136261 ^ muoi
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 10000) / 10000
}
/** Chỗ đứng của đốm thứ `i` trong cụm (xoắn ốc góc vàng): toạ độ % của bầu trời, quanh tâm cụm `a` (trái) / `b` (phải). */
export function choDom(ben: 'a' | 'b', i: number): { x: number; y: number } {
  const goc = i * 2.39996, r = Math.min(1, Math.sqrt(i + 0.6) / 5.4), tam = ben === 'a' ? 27 : 73
  return { x: tam + Math.cos(goc) * r * 19, y: 54 + Math.sin(goc) * r * 13 }
}
