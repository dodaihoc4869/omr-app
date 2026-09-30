// BI-A PHẢN ỨNG · NHẮM + MẮT THẦN (đặc tả 3.7). Từ 30/09 (thầy chốt bản vẽ thử) màn vẽ dùng Mắt thần ĐƠN GIẢN `duongMatThan` (hình học thuần);
// `duDoan` (mô phỏng bằng lõi vật lý) giữ lại cho công cụ đo, màn chơi không gọi.
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
/**
 * ĐƯỜNG MẮT THẦN ĐƠN GIẢN (thầy 30/09, đúng bản vẽ thử — màn vẽ KHÔNG còn mô phỏng vật lý): hình học thuần từ điểm va, rẻ cho máy yếu.
 * `dich`: đoạn LIỀN từ mép bi đích theo hướng bi đích sẽ chạy (tâm bi ma → tâm bi đích), dài 190 khi có Mắt thần, 55 khi không.
 * `tiep`: đoạn đứt theo hướng bi cái đi tiếp sau va (tiếp tuyến, vuông góc hướng bi đích), dài 120 — chỉ khi có Mắt thần và va không thẳng tâm.
 */
export interface DuongMatThan { dich: { x0: number; y0: number; x1: number; y1: number }; tiep: { x0: number; y0: number; x1: number; y1: number } | null }
export const DAI_DICH_MT = 190, DAI_DICH = 55, DAI_TIEP_MT = 120
export function duongMatThan(info: NhamInfo | null, aim: { x: number; y: number }, coMatThan: boolean): DuongMatThan | null {
  if (!info || info.loai !== 'bi') return null
  const ux = info.nx, uy = info.ny, L = coMatThan ? DAI_DICH_MT : DAI_DICH, b = info.b
  const dich = { x0: b.x + ux * R, y0: b.y + uy * R, x1: b.x + ux * (R + L), y1: b.y + uy * (R + L) }
  let tiep: DuongMatThan['tiep'] = null
  if (coMatThan) {
    const dot = aim.x * ux + aim.y * uy, tx = aim.x - dot * ux, ty = aim.y - dot * uy, tl = Math.hypot(tx, ty)
    if (tl > 0.05) tiep = { x0: info.gx, y0: info.gy, x1: info.gx + tx / tl * DAI_TIEP_MT, y1: info.gy + ty / tl * DAI_TIEP_MT }
  }
  return { dich, tiep }
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
