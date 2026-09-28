// BI-A PHẢN ỨNG · VẬT LÝ THẬT (đặc tả mục 7.1 — chép nguyên từ bản vẽ đã đo, số đo ở 7.2 là nghiệm thu).
// Tất định: bước cố định 1/240 giây, trong vòng mô phỏng chỉ + − × ÷ và Math.sqrt. `Math.pow` chỉ ở `tocDo` (một lần, trước mô phỏng).
// Trục: x sang phải, y xuống, z đâm vào mặt bàn; 1 đơn vị ≈ 2,54 mm ⇒ g ≈ 3862 đv/s². Bàn luôn là bàn DỌC 500 × 900 (màn rộng chỉ đổi phép vẽ).
// Mỗi bi có (vx, vy) và (wx, wy, wz). Vận tốc trượt ở điểm chạm nỉ: u = (vx + R·wy, vy − R·wx). u ≠ 0 ⇒ TRƯỢT (ma sát trượt kéo về lăn, còn 5/7 tốc độ);
// u = 0 ⇒ LĂN (ma sát lăn rất nhỏ). Xoáy ngang wz ⇒ đập băng bật lệch; bi va bi có ma sát ⇒ bi mục tiêu lệch nhẹ, truyền xoáy.
import { XEP, type KiHieu } from './nguyen-to'

export const W = 500, H = 900, R = 21, T = 26, D2 = (2 * R) * (2 * R), HS = 1 / 240, VMAX = 2600
const G0 = 3862, A_TRUOT = 0.2 * G0, A_LAN = 0.02 * G0, MU_BI = 0.06, MU_BANG = 0.2, GIAM_WZ = 24, E_BI = 0.95, KW = 5 / (2 * R)
const CM = 50, SM = 37, JR = 5
export interface Lo { x: number; y: number; r: number; v: number }
export const LO: readonly Lo[] = [{ x: -4, y: -4, r: 36, v: 31 }, { x: W + 4, y: -4, r: 36, v: 31 }, { x: -14, y: H / 2, r: 30, v: 27 }, { x: W + 14, y: H / 2, r: 30, v: 27 }, { x: -4, y: H + 4, r: 36, v: 31 }, { x: W + 4, y: H + 4, r: 36, v: 31 }]
const HAM: readonly (readonly [number, number])[] = [[-JR, CM], [CM, -JR], [W - CM, -JR], [W + JR, CM], [-JR, H - CM], [CM, H + JR], [W - CM, H + JR], [W + JR, H - CM], [-JR, H / 2 - SM], [-JR, H / 2 + SM], [W + JR, H / 2 - SM], [W + JR, H / 2 + SM]]
export const DIEM_CHAN = { x: W / 2, y: 270 }, DIEM_DAU = { x: W / 2, y: 720 }
/** Điểm ngắm vào 6 lỗ (A.I dùng). */
export const LO_NHAM = [{ x: 8, y: 8 }, { x: W - 8, y: 8 }, { x: -4, y: H / 2 }, { x: W + 4, y: H / 2 }, { x: 8, y: H - 8 }, { x: W - 8, y: H - 8 }] as const

export type MaBi = KiHieu | 'cue'
export type Quat = [number, number, number, number]
export interface Bi { id: MaBi; x: number; y: number; vx: number; vy: number; wx: number; wy: number; wz: number; on: boolean; q: Quat; ver: number }
export interface Ban { balls: Bi[] }
export interface SuKienCu { firstHit: KiHieu | null; potted: MaBi[]; cuePotted: boolean; rails: number }
export type Moc = (k: 'bi' | 'bang' | 'lo', a: Bi, b: Bi | Lo | null, v?: number) => void

/** Tốc độ bi cái theo lực p (0–1). */
export const tocDo = (p: number): number => VMAX * (0.05 + 0.95 * Math.pow(p, 1.2))
/** Đánh bi cái: hướng (dx, dy), lực p, xoáy sx (ngang, phải +), sy (trên +); điểm chạm lệch tâm 0,5R·(sx, sy). */
export function danhBi(c: Bi, dx: number, dy: number, p: number, sx: number, sy: number): void { danhBiV(c, dx, dy, tocDo(p), sx, sy) }
/** Như `danhBi` nhưng nhận THẲNG tốc độ v (đấu online: máy người đánh gửi v đã tính, máy khác khỏi gọi `pow`). */
export function danhBiV(c: Bi, dx: number, dy: number, v: number, sx: number, sy: number): void {
  const k = 1.25 * v / R
  c.vx = dx * v; c.vy = dy * v; c.wx = k * sy * dy; c.wy = -k * sy * dx; c.wz = -k * sx
}
export function qMul(a: Quat, b: Quat): Quat {
  return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]]
}
export function qTruc(ax: number, ay: number, az: number, g: number): Quat { const s = Math.sin(g / 2); return [Math.cos(g / 2), ax * s, ay * s, az * s] }
/** Hướng ban đầu: ô nhãn hướng về người xem, lệch nhẹ ngẫu nhiên (chỉ để vẽ). */
export function qDau(rand: () => number = Math.random): Quat { return qMul(qTruc(0, 0, 1, (rand() - 0.5) * 1.4), qMul(qTruc(1, 0, 0, (rand() - 0.5) * 0.9), qTruc(0, 1, 0, Math.PI / 2))) }
/** Cập nhật hướng quay để vẽ (ô nhãn lăn theo bi) — KHÔNG ảnh hưởng vật lý, không vào băm trạng thái. */
export function quay(b: Bi, h: number): void {
  const wx = b.wx, wy = b.wy, wz = b.wz
  if (!wx && !wy && !wz) return
  const q = b.q
  const a0 = 0.5 * h * (-(wx * q[1] + wy * q[2] + wz * q[3])), a1 = 0.5 * h * (q[0] * wx + wy * q[3] - wz * q[2]), a2 = 0.5 * h * (q[0] * wy + wz * q[1] - wx * q[3]), a3 = 0.5 * h * (q[0] * wz + wx * q[2] - wy * q[1])
  q[0] += a0; q[1] += a1; q[2] += a2; q[3] += a3
  const n = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3])
  q[0] /= n; q[1] /= n; q[2] /= n; q[3] /= n; b.ver++
}
export const biMoi = (id: MaBi, x: number, y: number, rand?: () => number): Bi => ({ id, x, y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, q: qDau(rand), ver: 0 })
export function xepBan(rand?: () => number): Ban {
  const balls: Bi[] = [], gap = 2 * R + 1, dy = gap * Math.sqrt(3) / 2
  XEP.forEach((row, k) => row.forEach((id, i) => balls.push(biMoi(id, W / 2 + (i - (row.length - 1) / 2) * gap, DIEM_CHAN.y - k * dy, rand))))
  balls.push(biMoi('cue', DIEM_DAU.x, DIEM_DAU.y, rand))
  return { balls }
}
export const suKienMoi = (): SuKienCu => ({ firstHit: null, potted: [], cuePotted: false, rails: 0 })
export function dangChay(st: Ban): boolean {
  for (const b of st.balls) {
    if (!b.on) continue
    if (b.vx || b.vy) return true
    const ux = b.vx + R * b.wy, uy = b.vy - R * b.wx
    if (ux * ux + uy * uy > 1) return true
  }
  return false
}
function dapBang(b: Bi, Nx: number, Ny: number): boolean {
  const vn = b.vx * Nx + b.vy * Ny
  if (vn >= 0) return false
  const e = 0.86 - 0.1 * Math.min(1, -vn / 2500), Tx = -Ny, Ty = Nx
  b.vx -= (1 + e) * vn * Nx; b.vy -= (1 + e) * vn * Ny
  const wt = b.wx * Tx + b.wy * Ty
  b.wx -= 0.6 * wt * Tx; b.wy -= 0.6 * wt * Ty
  const s = b.vx * Tx + b.vy * Ty - R * b.wz, lim = MU_BANG * (1 + e) * (-vn), jt = Math.max(-lim, Math.min(lim, -s / 3.5))
  b.vx += jt * Tx; b.vy += jt * Ty; b.wz -= 2.5 * jt / R
  return true
}
/** Một bước mô phỏng HS giây. `hook` nhận va chạm để phát tiếng/hiệu ứng (null khi mô phỏng thử của A.I, Mắt thần). */
export function step(st: Ban, ev: SuKienCu, hook: Moc | null): void {
  const B = st.balls
  for (const b of B) { if (b.on && (b.vx || b.vy)) { b.x += b.vx * HS; b.y += b.vy * HS } }
  for (let i = 0; i < B.length; i++) {
    const a = B[i]!
    if (!a.on) continue
    for (let j = i + 1; j < B.length; j++) {
      const b = B[j]!
      if (!b.on) continue
      const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy
      if (d2 >= D2 || d2 === 0) continue
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ov = (2 * R - d) / 2
      a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov
      const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
      if (rv < 0) {
        const jn = -(1 + E_BI) * rv / 2
        a.vx -= jn * nx; a.vy -= jn * ny; b.vx += jn * nx; b.vy += jn * ny
        const tx = -ny, ty = nx, gt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty - R * (a.wz + b.wz), jt = Math.max(-MU_BI * jn, Math.min(MU_BI * jn, -gt / 7))
        b.vx += jt * tx; b.vy += jt * ty; a.vx -= jt * tx; a.vy -= jt * ty; a.wz -= 2.5 * jt / R; b.wz -= 2.5 * jt / R
        if (a.id === 'cue' || b.id === 'cue') { const o = a.id === 'cue' ? b : a; if (ev.firstHit === null && o.id !== 'cue') ev.firstHit = o.id }
        if (hook) hook('bi', a, b, -rv)
      }
    }
  }
  for (const b of B) { if (b.on) thanhBan(b, ev, hook) }
  for (const b of B) {
    if (!b.on) continue
    const ux = b.vx + R * b.wy, uy = b.vy - R * b.wx, us2 = ux * ux + uy * uy
    if (us2 > 1) {
      const us = Math.sqrt(us2)
      if (us <= 3.5 * A_TRUOT * HS) { const nvx = (5 * b.vx - 2 * R * b.wy) / 7, nvy = (5 * b.vy + 2 * R * b.wx) / 7; b.vx = nvx; b.vy = nvy; b.wx = nvy / R; b.wy = -nvx / R }
      else { const ex = ux / us, ey = uy / us; b.vx -= A_TRUOT * ex * HS; b.vy -= A_TRUOT * ey * HS; b.wx += KW * A_TRUOT * ey * HS; b.wy -= KW * A_TRUOT * ex * HS }
    } else if (b.vx || b.vy) {
      const s = Math.sqrt(b.vx * b.vx + b.vy * b.vy), ns = s - A_LAN * HS
      if (ns <= 2) { b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0 } else { const f = ns / s; b.vx *= f; b.vy *= f; b.wx = b.vy / R; b.wy = -b.vx / R }
    }
    if (b.wz) { const dz = GIAM_WZ * HS; b.wz = Math.abs(b.wz) <= dz ? 0 : b.wz - (b.wz > 0 ? dz : -dz) }
    if (!b.vx && !b.vy && us2 <= 1) { b.wx = 0; b.wy = 0 }
  }
}
function thanhBan(b: Bi, ev: SuKienCu, hook: Moc | null): void {
  const x = b.x, y = b.y
  let dap = false
  const m2b = (y < CM || y > H - CM || Math.abs(y - H / 2) < SM), m2d = (x < CM || x > W - CM)
  if (!m2b) { if (x < R) { b.x = R; dap = dapBang(b, 1, 0) || dap } else if (x > W - R) { b.x = W - R; dap = dapBang(b, -1, 0) || dap } }
  if (!m2d) { if (y < R) { b.y = R; dap = dapBang(b, 0, 1) || dap } else if (y > H - R) { b.y = H - R; dap = dapBang(b, 0, -1) || dap } }
  const gan = b.x < R + JR + 10 || b.x > W - R - JR - 10 || b.y < R + JR + 10 || b.y > H - R - JR - 10
  if (gan) {
    for (const J of HAM) {
      const dx = b.x - J[0], dy = b.y - J[1], d2 = dx * dx + dy * dy, rr = R + JR
      if (d2 < rr * rr && d2 > 0) { const d = Math.sqrt(d2), nx = dx / d, ny = dy / d; b.x = J[0] + nx * rr; b.y = J[1] + ny * rr; dap = dapBang(b, nx, ny) || dap }
    }
  }
  if (dap) { ev.rails++; if (hook) hook('bang', b, null) }
  if (gan || b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
    let best: Lo = LO[0]!, bd = 1e9
    for (const P of LO) {
      const dx = P.x - b.x, dy = P.y - b.y, d = Math.sqrt(dx * dx + dy * dy)
      if (d < bd) { bd = d; best = P }
      if (d < P.r) { roiLo(b, P, ev, hook); return }
    }
    if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
      const dx = best.x - b.x, dy = best.y - b.y, d = bd || 1
      b.vx += dx / d * 1800 * HS; b.vy += dy / d * 1800 * HS
      if (bd > 70) roiLo(b, best, ev, hook)
    }
  }
}
function roiLo(b: Bi, P: Lo, ev: SuKienCu, hook: Moc | null): void {
  b.on = false; ev.potted.push(b.id)
  if (b.id === 'cue') ev.cuePotted = true
  if (hook) hook('lo', b, P)
  b.vx = b.vy = b.wx = b.wy = b.wz = 0
}
/** Chạy hết một cú (tối đa `giay` giây) — dùng cho A.I, test, phòng đấu. */
export function chayHet(st: Ban, ev: SuKienCu, giay = 12, hook: Moc | null = null): number {
  let i = 0
  for (; i < 240 * giay; i++) { step(st, ev, hook); if (i % 8 === 0 && !dangChay(st)) break }
  return i
}
/** Băm trạng thái (vị trí, vận tốc, còn trên bàn) — so hai máy/hai lần chạy. Không gồm hướng quay (chỉ để vẽ). */
export function bamBan(st: Ban): string {
  let h = 2166136261 >>> 0
  const tron = (v: number) => { const s = v.toFixed(6); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } }
  for (const b of st.balls) { tron(b.on ? 1 : 0); tron(b.x); tron(b.y); tron(b.vx); tron(b.vy) }
  return h.toString(16)
}
/** Chỗ đặt bi hợp lệ (trong mặt nỉ, không đè bi khác). */
export function choHopLe(st: Ban, x: number, y: number, bo: MaBi): boolean {
  if (x < R || x > W - R || y < R || y > H - R) return false
  for (const o of st.balls) { if (!o.on || o.id === bo) continue; const dx = o.x - x, dy = o.y - y; if (dx * dx + dy * dy < (2 * R + 1) * (2 * R + 1)) return false }
  return true
}
/** Đặt bi ở chỗ hợp lệ gần (x, y) nhất (xoắn ốc ra ngoài). */
export function datCho(st: Ban, b: Bi, x: number, y: number): void {
  for (let r = 0; r < 400; r += 6) {
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r
      if (choHopLe(st, px, py, b.id)) { b.x = px; b.y = py; b.vx = b.vy = 0; return }
      if (r === 0) break
    }
  }
}
/** Đặt lại bi rơi lỗ ở chấm chân bàn (bi câu sai, bi phe đối thủ, phạm luật). */
export function datLaiChan(st: Ban, b: Bi): void { b.on = true; b.vx = b.vy = b.wx = b.wy = b.wz = 0; datCho(st, b, DIEM_CHAN.x, DIEM_CHAN.y) }
