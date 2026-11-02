// 🎁 MỞ RƯƠNG (bản trình diễn 02/11): rung lắc tăng dần + nén lấy đà (380 ms, tiếng lách cách) → bật: rương giãn lò xo, nắp bật, 12 tia sáng toả xoay,
// loé vàng, quầng, sóng xung, ~26 tia lửa bắn lên → lấp lánh quanh rương. Tia sáng là vành (giữa trong suốt) ⇒ nằm trên lớp phủ mà không che rương.
// Gọn (máy yếu): lắc ngắn, 8 tia sáng không xoay, không loé, 6 tia lửa + 4 lấp lánh trên canvas nhỏ, 30 khung/giây. Tĩnh: rương nảy nhẹ.
import type { DatRuong } from './kieu'
import { soHat, thoiGian } from './dieu-kien'
import { bangMau, canvasSan, chon, heSoCo, khung, loe, quang, rnd, rungMay, themHat, type Phien } from './bo-chay'
import { not, on_ } from './am-thanh-an-mung'

const NS = 'http://www.w3.org/2000/svg'
let soId = 0

export function ruong(ph: Phien, d: DatRuong): void {
  const el = d.goc as HTMLElement | null | undefined
  const nap = d.nap as SVGElement | HTMLElement | null | undefined
  const che = ph.che, T = (ms: number) => thoiGian(ms, che), lac = d.lac !== false
  if (!el) { ph.huy(); return }
  if (che === 'tinh') {
    ph.ve(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' })
    if (d.rung) rungMay(40)
    ph.dong(320)
    return
  }
  const lay = lac ? T(380) : 0
  let lacAn: Animation | null = null
  if (lac) {
    const goc = che === 'day-du' ? [0, -3, 3, -5, 5, -8, 8, -4, 0] : [0, -3, 3, -5, 5, 0]
    lacAn = ph.ve(el, goc.map((r, i) => { const q = i / (goc.length - 1); return { transform: `rotate(${r}deg) scale(${(1 + q * 0.07).toFixed(3)},${(1 - q * 0.1).toFixed(3)})` } }), { duration: lay, easing: 'linear', fill: 'forwards' })
    ;[0, 0.08, 0.15, 0.22, 0.28, 0.33].forEach((t, i) => on_(t, 0.035, { hz: 700 + i * 260, q: 3, v: 0.22 + i * 0.03 }))
    if (d.rung) rungMay([8, 60, 8, 50, 8, 40, 10])
  }
  ph.sau(lay, () => {
    const M = bangMau(), s = heSoCo(), C = khung(el), mx = C.cx, my = C.y + C.h * 0.45
    lacAn?.cancel() // bỏ thế nén (fill: forwards) — lò xo giãn tiếp từ đúng thế ấy
    if (lac) ph.nay(el, (v) => ({ transform: `scale(${(2 - v).toFixed(4)},${v.toFixed(4)})` }), { tu: 1.13, den: 1, k: 420, c: 12 })
    if (nap) {
      nap.style.transformBox = 'fill-box'; nap.style.transformOrigin = '0% 100%'
      ph.nay(nap, (v) => ({ transform: `translate(${(-4 * v).toFixed(2)}px,${(-10 * v).toFixed(2)}px) rotate(${(-24 * v).toFixed(2)}deg)` }), { tu: 0, den: 1, k: 250, c: 11 })
      ph.khiXong(() => { nap.style.transformBox = ''; nap.style.transformOrigin = '' })
    }
    // tia sáng toả: vành (giữa trong suốt) quanh rương
    const R = Math.max(C.w, C.h) * 1.35 + 40 * s, so = che === 'day-du' ? 12 : 8, id = `hu-tia-${++soId}`
    const svg = ph.them(document.createElementNS(NS, 'svg'))
    svg.setAttribute('viewBox', '-100 -100 200 200'); svg.setAttribute('width', String(R * 2)); svg.setAttribute('height', String(R * 2))
    svg.style.cssText = `position:absolute;left:${mx - R}px;top:${my - R}px;opacity:0`
    let tia = ''
    for (let k = 0; k < so; k++) {
      const a = (k * Math.PI * 2) / so, dd = 0.13, p = (t: number, r: number) => `${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`
      tia += `<path d="M${p(a, 22)}L${p(a - dd, 100)}L${p(a + dd, 100)}Z"/>`
    }
    svg.innerHTML = `<defs><radialGradient id="${id}"><stop offset=".2" style="stop-color:var(--tr-sao);stop-opacity:0"/><stop offset=".42" style="stop-color:var(--tr-sao);stop-opacity:.9"/><stop offset="1" style="stop-color:var(--tr-sao);stop-opacity:0"/></radialGradient></defs><g style="fill:url(#${id})">${tia}</g>`
    if (che === 'day-du') {
      ph.nay(svg, (v) => ({ opacity: Math.min(1, v) * 0.9, transform: `scale(${v.toFixed(4)}) rotate(${(v * 32).toFixed(2)}deg)` }), { tu: 0, den: 1, k: 190, c: 13 })
      ph.sau(T(600), () => ph.ve(svg, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 420, fill: 'forwards' }))
    } else ph.ve(svg, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 0.8, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.05)' }], { duration: T(900), easing: 'ease-out', fill: 'both' })
    loe(ph, 0.4, 150, 'var(--tr-sao)')
    quang(ph, mx, my, 300 * s, M.sao, 820, 0.75)
    if (d.rung) rungMay(40)
    not(200, 0, 0.16, { toi: 900, kieu: 'triangle', v: 0.25 }); on_(0, 0.12, { loc: 'highpass', hz: 1800, v: 0.3 })
    ;[1568, 2093, 2637, 3136].forEach((f, i) => not(f, 0.05 + i * 0.06, 0.5, { v: 0.06 }))
    if (!canvasSan(che, { x: mx - 170 * s, y: my - 300 * s, w: 340 * s, h: 380 * s }, M.phu)) return
    themHat({ kieu: 'vong', x: mx, y: my, r0: 20 * s, r1: 150 * s, net: 7 * s, tho: 0.5, mau: M.sao })
    for (let i = 0, n = soHat(26, che); i < n; i++) {
      const a = -Math.PI / 2 + rnd(-1.15, 1.15), v = rnd(300, 680) * s
      themHat({ kieu: 'tia', x: mx + rnd(-30, 30) * s, y: my, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1200 * s, can: 0.94, co: rnd(1.8, 3.4) * s, mau: chon([M.sao, M.trang, M.cam]), loi: M.trang, tho: rnd(0.4, 0.7) })
    }
    for (let i = 0, n = soHat(16, che); i < n; i++) themHat({ kieu: 'sao', x: mx + rnd(-58, 58) * s, y: my - rnd(0, 90) * s, co: rnd(4, 9) * s, mau: chon([M.sao, M.trang, M.tin]), tho: rnd(0.35, 0.55), cho: 0.16 + rnd(0, 0.4), xoay: rnd(0, 0.8) })
  })
  ph.dong(lay + T(1300))
}
