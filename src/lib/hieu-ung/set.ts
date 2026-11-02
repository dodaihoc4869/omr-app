// ⚡ SÉT ĐÁNH — đúng 5 câu liền (rồi 10, 15 …). Nhịp theo bản trình diễn: lấy đà (tối màn, quầng trên trời, ~190 ms) → tia gấp khúc 4 lớp vẽ từ trên
// xuống 85 ms (+ nhánh) → chạm (~275 ms): loé một khung, rung khung nội dung, quầng sáng, hai sóng xung, 40 tia lửa, băng chữ nảy quá đà → lấp lánh quanh
// chữ, màn sáng lại. Sét đánh XUỐNG THẺ VỪA ĐÚNG (không xuống nút «Tiếp tục»), màn tối không phủ dải kết quả.
// Gọn (máy yếu): 2 lớp nét, không nhánh, không tối / loé / rung màn, 10 tia lửa trên canvas nhỏ, 30 khung/giây, nhịp ×0,7. Tĩnh: chỉ băng chữ nảy nhẹ.
import type { DatSet } from './kieu'
import { mucSet, soHat, thoiGian } from './dieu-kien'
import { bangMau, canvasSan, chon, heSoCo, khung, loe, quang, rnd, rungMan, rungMay, themHat, toiMan, type Phien } from './bo-chay'
import { not, on_ } from './am-thanh-an-mung'

const NS = 'http://www.w3.org/2000/svg'

/** Tia gấp khúc: chia đôi đoạn thẳng rồi lệch ngẫu nhiên (midpoint displacement). */
function tia(x0: number, y0: number, x1: number, y1: number, lech: number, sau: number): [number, number][] {
  let ds: [number, number][] = [[x0, y0], [x1, y1]]
  for (let d = 0; d < sau; d++) {
    const moi: [number, number][] = [ds[0]!]
    for (let i = 0; i < ds.length - 1; i++) {
      const [ax, ay] = ds[i]!, [bx, by] = ds[i + 1]!
      moi.push([(ax + bx) / 2 + rnd(-1, 1) * lech, (ay + by) / 2 + rnd(-1, 1) * lech * 0.2], [bx, by])
    }
    ds = moi; lech *= 0.52
  }
  return ds
}

export function set(ph: Phien, d: DatSet): void {
  const che = ph.che, T = (ms: number) => thoiGian(ms, che)
  const chu = d.chu as HTMLElement | null | undefined
  if (d.rung) rungMay([22, 40, 30])
  if (che === 'tinh') {
    ph.nay(chu, (v) => ({ transform: `translate(-50%,-50%) scale(${v.toFixed(4)})` }), { tu: 0.9, den: 1, k: 300, c: 30 })
    ph.dong(600)
    return
  }
  // đo SAU khi dải kết quả đã vẽ (không ép bố cục trong lượt bấm «Kiểm tra»)
  ph.sauVe(() => {
    const M = bangMau(), s = heSoCo(), W = window.innerWidth, H = window.innerHeight
    const day = d.day ? Math.min(H, d.day.getBoundingClientRect().top) : H
    const r = d.dich ? khung(d.dich) : null
    const ix = r && r.w ? r.cx : W * rnd(0.35, 0.65)
    const iy = Math.max(H * 0.2, Math.min(r && r.w ? r.cy : day - 60, day - 24))
    const sx = Math.max(16, Math.min(W - 16, ix + rnd(-0.2, 0.2) * W))
    const muc = mucSet(d.chuoi), day_du = che === 'day-du'
    if (!canvasSan(che, { x: ix - 170 * s, y: iy - 170 * s, w: 340 * s, h: 340 * s }, M.phu)) return
    // Nhịp 1 · lấy đà
    const sangLai = toiMan(ph, 0.5, 180, H - day)
    ph.sau(T(110), () => quang(ph, sx, 0, 150 * s, M.hs, 260, 0.7))
    on_(0, 0.2, { hz: 300, toi: 3200, q: 4, v: 0.14, a: 0.16 })
    // Nhịp 2 · tia vẽ từ trên xuống
    ph.sau(T(190), () => {
      const svg = ph.them(document.createElementNS(NS, 'svg'))
      svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H)); svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible'
      const g = document.createElementNS(NS, 'g')
      const chinh = tia(sx, -12, ix, iy, W * 0.22, day_du ? 5 : 4)
      const ds = [chinh]
      if (day_du) for (const i of muc >= 2 ? [6, 12, 19, 25] : [6, 12, 19]) {
        const p = chinh[Math.min(i, chinh.length - 2)]!, huong = p[0] < ix ? -1 : 1
        ds.push(tia(p[0], p[1], p[0] + huong * rnd(28, 64) * s, p[1] + rnd(36, 74) * s, 14 * s, 3))
      }
      const lopNet: [number, string, number][] = day_du ? [[28, 'var(--tr-tin)', 0.22], [13, 'var(--tr-hs)', 0.45], [6, 'var(--tr-hs)', 1], [2.8, M.trangVar, 1]] : [[10, 'var(--tr-hs)', 0.5], [3, M.trangVar, 1]]
      const duong = (p: [number, number][]) => 'M' + p.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')
      ds.forEach((p, nh) => lopNet.forEach(([w, mau, a]) => {
        const e = document.createElementNS(NS, 'path')
        e.setAttribute('d', duong(p)); e.setAttribute('pathLength', '1')
        e.setAttribute('style', `fill:none;stroke:${mau};stroke-opacity:${a};stroke-width:${(w * s * (nh ? 0.5 : 1)).toFixed(2)};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1`)
        g.appendChild(e)
        ph.ve(e, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: nh ? 70 : 85, delay: nh ? 45 : 0, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'forwards' })
      }))
      svg.appendChild(g)
      ph.ve(g, [{ opacity: 1 }, { opacity: 0.25, offset: 0.1 }, { opacity: 1, offset: 0.2 }, { opacity: 0.45, offset: 0.34 }, { opacity: 1, offset: 0.44 }, { opacity: 0 }],
        { duration: T(640), delay: 85, fill: 'forwards' })
      on_(0, 0.06, { loc: 'highpass', hz: 3500, v: 0.3 })
    })
    // Va chạm
    ph.sau(T(275), () => {
      loe(ph, 0.9, 75, M.trangVar)
      rungMan(ph, d.goc, 9 * s, 340)
      quang(ph, ix, iy, (day_du ? 260 : 160) * s, M.hs, 700, 0.75)
      if (day_du) quang(ph, ix, iy, 120 * s, M.trang, 380, 0.9)
      themHat({ kieu: 'vong', x: ix, y: iy, r0: 6 * s, r1: 95 * s, net: 7 * s, tho: 0.42, mau: M.tin })
      if (day_du) themHat({ kieu: 'vong', x: ix, y: iy, r0: 10 * s, r1: 150 * s, net: 4 * s, tho: 0.6, mau: M.hs, cho: 0.05 })
      const mau = [M.trang, M.tin, M.hs, M.sao]
      for (let i = 0, n = soHat(muc >= 3 ? 52 : 40, che); i < n; i++) {
        const a = rnd(0, Math.PI * 2), v = rnd(260, 700) * s
        themHat({ kieu: 'tia', x: ix, y: iy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120 * s, g: 1300 * s, can: 0.93, co: rnd(1.6, 3.4) * s, mau: chon(mau), loi: Math.random() < 0.5 ? M.trang : undefined, tho: rnd(0.32, 0.62) })
      }
      ph.nay(chu, (v) => ({ transform: `translate(-50%,-50%) scale(${v.toFixed(4)}) rotate(${((1 - v) * 14).toFixed(2)}deg)` }), { tu: 0.15, den: 1, k: 330, c: 12 })
      on_(0, 0.4, { loc: 'highpass', hz: 1500, v: 0.5 }); on_(0.05, 0.05, { loc: 'highpass', hz: 4000, v: 0.35 }); on_(0.11, 0.04, { loc: 'highpass', hz: 5000, v: 0.3 })
      not(150, 0, 0.45, { toi: 38, v: 0.55 })
      not(1047, 0.14, 0.25, { kieu: 'triangle', v: 0.12 }); not(1568, 0.2, 0.4, { kieu: 'triangle', v: 0.1 })
    })
    // Quá đà rồi lắng: lấp lánh quanh băng chữ, màn sáng lại
    ph.sau(T(470), () => {
      const t = chu ? khung(chu) : null
      if (!t || !t.w) return
      canvasSan(che, { x: t.x - 40, y: t.y - 40, w: t.w + 80, h: t.h + 80 })
      for (let i = 0, n = soHat(9, che); i < n; i++) themHat({ kieu: 'sao', x: t.x + rnd(0, t.w), y: t.y + rnd(-0.2, 1.2) * t.h, co: rnd(4, 8) * s, mau: chon([M.sao, M.trang, M.tin]), tho: rnd(0.35, 0.55), cho: rnd(0, 0.2), xoay: rnd(0, 0.8) })
    })
    ph.sau(T(540), () => sangLai(460))
  })
  ph.dong(T(1200))
}
