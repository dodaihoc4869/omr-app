// BẢN LÙI của bản đồ lớp: isometric Canvas 2D (khi không có WebGL / không tải được three.js). Cùng bố cục cột, màu và nhãn với bản 3D.
import type { LopSan } from './kieu'
import { boTriLop, mauTheoTiLe, tiLeLop, type ViTriNhan } from './ban-do-chung'

export interface MauIso {
  nen: string
  matNen: string
  vien: string
  do: string
  vang: string
  la: string
  xam: string
}

/** Vẽ nền + các cột (đã sắp từ xa tới gần) lên `ctx`; trả vị trí nhãn của từng lớp (theo thứ tự `lop`). `cao[i]` là chiều cao đã nội suy; `loe[i]` ∈ [0,1] làm sáng thêm cột vừa có câu mới. */
export function veIso(ctx: CanvasRenderingContext2D, w: number, h: number, lop: readonly LopSan[], cao: readonly number[], loe: readonly number[], mau: MauIso): ViTriNhan[] {
  const u = Math.min(w / 14.5, h / 9.6)
  const cx = w / 2
  const cy = h * 0.62
  const P = (x: number, y: number, z: number): [number, number] => [cx + (x - z) * 0.866 * u, cy + (x + z) * 0.5 * u - y * u * 0.95]
  const da = (ps: [number, number][], fill?: string, stroke?: string) => {
    ctx.beginPath()
    ps.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))
    ctx.closePath()
    if (fill) {
      ctx.fillStyle = fill
      ctx.fill()
    }
    if (stroke) {
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  da([P(-5, 0, -2.7), P(5, 0, -2.7), P(5, 0, 2.7), P(-5, 0, 2.7)], mau.matNen, mau.vien)
  ctx.strokeStyle = mau.vien
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.6
  for (let x = -4.5; x <= 4.6; x += 0.9) {
    const a = P(x, 0, -2.7)
    const b = P(x, 0, 2.7)
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.stroke()
  }
  for (let z = -1.8; z <= 1.9; z += 0.9) {
    const a = P(-5, 0, z)
    const b = P(5, 0, z)
    ctx.beginPath()
    ctx.moveTo(a[0], a[1])
    ctx.lineTo(b[0], b[1])
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const vt: ViTriNhan[] = lop.map(() => ({ x: 0, y: 0, w: 0, gan: 0 }))
  const vi = boTriLop(lop.length)
  const a = 0.75
  ;[...lop.keys()]
    .sort((p, q) => vi[p]!.x + vi[p]!.z - (vi[q]!.x + vi[q]!.z))
    .forEach((i) => {
      const l = lop[i]!
      const x = vi[i]!.x * 3
      const z = vi[i]!.z * 1.35
      const y = Math.max(0.05, cao[i] ?? 0)
      const tl = tiLeLop(l)
      const c = tl === null ? null : mauTheoTiLe(tl, mau.do, mau.vang, mau.la)
      const sang = 1 + (loe[i] ?? 0) * 0.35
      const to = (f: number) => (c ? `rgb(${c.map((v) => Math.min(255, Math.round(v * f * sang))).join(',')})` : mau.xam)
      da([P(x - a, 0, z + a), P(x + a, 0, z + a), P(x + a, y, z + a), P(x - a, y, z + a)], to(0.84))
      da([P(x + a, 0, z - a), P(x + a, 0, z + a), P(x + a, y, z + a), P(x + a, y, z - a)], to(0.66))
      da([P(x - a, y, z - a), P(x + a, y, z - a), P(x + a, y, z + a), P(x - a, y, z + a)], to(1.06))
      const dinh = P(x, y, z - a * 0.2)
      vt[i] = { x: dinh[0], y: dinh[1] - a * u * 0.5 - 2, w: 0, gan: (vi[i]!.x + vi[i]!.z + 4) * 10 }
    })
  return vt
}
