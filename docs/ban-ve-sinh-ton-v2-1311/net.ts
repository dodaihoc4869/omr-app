// NÉT VẼ TAY — hàm thuần vẽ nét «bút bi / phấn» (rung nhẹ, hai lượt nét lệch nhau). Chỉ chạy lúc NƯỚNG hình (một lần), không chạy mỗi khung.
import { mau, type Bang, type Rgb } from './bang'

export type P = [number, number]
export type G = CanvasRenderingContext2D

/** Bộ số ngẫu nhiên có hạt giống (cùng hạt ⇒ cùng nét ⇒ ảnh ổn định giữa các lần nướng). */
export function rng(hat: number): () => number {
  let s = (hat * 2654435761) >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}

export const elip = (cx: number, cy: number, rx: number, ry: number, n = 28): P[] => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] })
export function hcn(x: number, y: number, w: number, h: number, r = 0): P[] {
  if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
  const p: P[] = [], goc = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) } }
  goc(x + w - r, y + r, -Math.PI / 2); goc(x + w - r, y + h - r, 0); goc(x + r, y + h - r, Math.PI / 2); goc(x + r, y + r, Math.PI)
  return p
}

/** Chia lại đường thành các điểm cách nhau ~`buoc`. */
function chia(pts: P[], kin: boolean, buoc: number): P[] {
  const ra: P[] = [], n = pts.length, het = kin ? n : n - 1
  for (let i = 0; i < het; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(d / buoc))
    for (let j = 0; j < k; j++) ra.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k])
  }
  if (!kin) ra.push(pts[n - 1])
  return ra
}
/** Rung: lệch mỗi điểm một khoảng nhỏ, lọc mượt (tay người run chậm, không răng cưa). */
function rungDiem(pts: P[], bien: number, r: () => number): P[] {
  let dx = 0, dy = 0
  return pts.map(([x, y]) => { dx = dx * 0.6 + (r() - 0.5) * bien; dy = dy * 0.6 + (r() - 0.5) * bien; return [x + dx, y + dy] as P })
}
/** Vẽ đường cong mượt qua các điểm (trung điểm + quadratic). */
export function duong(g: G, pts: P[], kin: boolean): void {
  const n = pts.length
  if (n < 2) return
  g.beginPath()
  if (kin) {
    const m0: P = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2]
    g.moveTo(m0[0], m0[1])
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }
    g.closePath()
  } else {
    g.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < n - 1; i++) { const a = pts[i], b = pts[i + 1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }
    g.lineTo(pts[n - 1][0], pts[n - 1][1])
  }
}

export interface Net { mau: Rgb; day: number; bien?: number; hat: number; a?: number; kin?: boolean }
/** Nét vẽ tay: lượt chính + lượt phụ mảnh lệch (bút bi tô lại), nền tối thì nét phấn có kẽ hở nhỏ. */
export function netTay(g: G, b: Bang, pts: P[], o: Net): void {
  const kin = o.kin ?? true, bien = o.bien ?? 1.6, r = rng(o.hat), a = o.a ?? 1
  const goc = chia(pts, kin, 5)
  g.lineCap = 'round'; g.lineJoin = 'round'
  if (b.toi) g.setLineDash([7 + r() * 5, 1.4, 3, 1.2])
  duong(g, rungDiem(goc, bien, r), kin); g.strokeStyle = mau(o.mau, a); g.lineWidth = o.day; g.stroke()
  duong(g, rungDiem(goc, bien * 1.5, r), kin); g.strokeStyle = mau(o.mau, a * 0.45); g.lineWidth = o.day * 0.55; g.stroke()
  g.setLineDash([])
}
export function to(g: G, pts: P[], c: Rgb, a = 1): void { duong(g, pts, true); g.fillStyle = mau(c, a); g.fill() }
/** Tô gạch chéo kiểu bút dạ trong hình (cắt theo hình). */
export function gach(g: G, pts: P[], c: Rgb, a: number, khoang: number, goc: number, day: number, hat: number): void {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), dai = Math.hypot(x1 - x0, y1 - y0)
  const r = rng(hat), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ux = Math.cos(goc), uy = Math.sin(goc)
  g.save(); duong(g, pts, true); g.clip()
  g.strokeStyle = mau(c, a); g.lineWidth = day; g.lineCap = 'round'
  g.beginPath()
  for (let t = -dai / 2; t <= dai / 2; t += khoang) {
    const lx = cx - uy * t + (r() - 0.5) * 2, ly = cy + ux * t
    g.moveTo(lx - ux * dai, ly - uy * dai); g.lineTo(lx + ux * dai, ly + uy * dai)
  }
  g.stroke(); g.restore()
}
/** Nét nguệch ngoạc (zig-zag) phủ kín hình — kiểu tô bằng bút dạ cho nhanh. */
export function nguech(g: G, pts: P[], c: Rgb, a: number, buoc: number, day: number, hat: number): void {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), r = rng(hat)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  g.save(); duong(g, pts, true); g.clip()
  g.beginPath(); g.strokeStyle = mau(c, a); g.lineWidth = day; g.lineJoin = 'round'
  let len = true
  g.moveTo(x0 - 4, y0)
  for (let y = y0; y <= y1 + buoc; y += buoc) { g.lineTo(len ? x1 + 4 : x0 - 4, y + (r() - 0.5) * buoc * 0.8); len = !len }
  g.stroke(); g.restore()
}

/** Ảnh nướng sẵn: canvas cỡ (w, h) đơn vị sân × hệ số k (= tỉ lệ sân × dpr), điểm neo (ox, oy). */
export interface Anh { c: HTMLCanvasElement; w: number; h: number; ox: number; oy: number }
export function nuong(w: number, h: number, k: number, ox: number, oy: number, ve: (g: G) => void): Anh {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w * k)); c.height = Math.max(1, Math.ceil(h * k))
  const g = c.getContext('2d')!
  g.scale(k, k); ve(g)
  return { c, w, h, ox, oy }
}
export function dat(g: G, a: Anh, x: number, y: number, s = 1): void { g.drawImage(a.c, x - a.ox * s, y - a.oy * s, a.w * s, a.h * s) }
