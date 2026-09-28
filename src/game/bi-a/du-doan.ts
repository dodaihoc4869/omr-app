// BI-A PHẢN ỨNG · NHẮM + MẮT THẦN (đặc tả 3.7). Mắt thần mô phỏng trước bằng CHÍNH lõi vật lý (lực, xoáy đang chọn) ⇒ đường đi thật của
// bi cái (tới lần va thứ 2 hoặc 1,1 giây sau va đầu) và bi mục tiêu (0,9 giây). Không có Mắt thần: chỉ đường thẳng tới điểm va + bóng bi ma.
import type { KiHieu } from './nguyen-to'
import { D2, H, R, W, danhBi, dangChay, step, suKienMoi, type Ban, type Bi } from './vat-ly'

export type NhamInfo =
  | { loai: 'bi'; c: Bi; gx: number; gy: number; b: Bi & { id: KiHieu }; nx: number; ny: number; cut: number }
  | { loai: 'bang'; c: Bi; gx: number; gy: number }
/** Điểm va đầu tiên theo hướng nhắm (bóng bi ma), hoặc điểm chạm băng. */
export function nhamInfo(st: Ban, aim: { x: number; y: number }): NhamInfo | null {
  const c = st.balls.find((b) => b.id === 'cue')
  if (!c || !c.on) return null
  const dx = aim.x, dy = aim.y
  let tb = Infinity, hb: Bi | null = null
  for (const b of st.balls) {
    if (!b.on || b.id === 'cue') continue
    const fx = c.x - b.x, fy = c.y - b.y, bq = fx * dx + fy * dy, cq = fx * fx + fy * fy - D2, disc = bq * bq - cq
    if (disc < 0) continue
    const t = -bq - Math.sqrt(disc)
    if (t > 0 && t < tb) { tb = t; hb = b }
  }
  let tr = Infinity
  if (dx > 0) tr = Math.min(tr, (W - R - c.x) / dx)
  if (dx < 0) tr = Math.min(tr, (R - c.x) / dx)
  if (dy > 0) tr = Math.min(tr, (H - R - c.y) / dy)
  if (dy < 0) tr = Math.min(tr, (R - c.y) / dy)
  if (hb && tb < tr) {
    const gx = c.x + dx * tb, gy = c.y + dy * tb, nx = (hb.x - gx) / (2 * R), ny = (hb.y - gy) / (2 * R)
    return { loai: 'bi', c, gx, gy, b: hb as Bi & { id: KiHieu }, nx, ny, cut: dx * nx + dy * ny }
  }
  return { loai: 'bang', c, gx: c.x + dx * tr, gy: c.y + dy * tr }
}
export interface DuDoan { cue: [number, number][]; obj: [number, number][] }
/** Mô phỏng trước (không đụng `st`). Chưa kéo lực thì mô phỏng ở lực 50%. */
export function duDoan(st: Ban, aim: { x: number; y: number }, luc: number, xoay: { x: number; y: number }): DuDoan {
  const p = luc > 0.02 ? luc : 0.5
  const balls: Bi[] = st.balls.filter((b) => b.on).map((b) => ({ ...b, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, q: [...b.q] as Bi['q'] }))
  const cc = balls.find((b) => b.id === 'cue')
  if (!cc) return { cue: [], obj: [] }
  danhBi(cc, aim.x, aim.y, p, xoay.x, xoay.y)
  const thu: Ban = { balls }, ev = suKienMoi(), pc: [number, number][] = [[cc.x, cc.y]], po: [number, number][] = []
  let ob: Bi | null = null, tva = -1, lanVa = 0
  for (let i = 0; i < 240 * 2.4; i++) {
    step(thu, ev, (k, a, b) => { if (k === 'bi' && b && 'id' in b && (a.id === 'cue' || b.id === 'cue')) lanVa++ })
    if (!ob && ev.firstHit !== null) { ob = balls.find((b) => b.id === ev.firstHit) ?? null; tva = i; if (ob) po.push([ob.x, ob.y]) }
    if (i % 4 === 0) { if (cc.on) pc.push([cc.x, cc.y]); if (ob && ob.on && i - tva < 240 * 0.9) po.push([ob.x, ob.y]) }
    if (lanVa >= 2 || (tva >= 0 && i - tva > 240 * 1.1) || !dangChay(thu)) break
  }
  if (cc.on) pc.push([cc.x, cc.y])
  return { cue: pc, obj: po }
}
