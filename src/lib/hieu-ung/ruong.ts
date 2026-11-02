// 🎁 MỞ RƯƠNG v2 (thầy 02/11 khuya «làm lại hiệu ứng mở rương siêu đẹp hơn nữa»): nén lấy đà + ánh vàng rỉ ra khe nắp → bật: CỘT SÁNG vàng phụt lên, nắp
// vút lên rồi rơi về thế mở, vòng 16 tia dài/ngắn xoay chậm, hai sóng xung, pháo sáng theo cột, sao lấp lánh đọng lại lần lượt; chuỗi chuông đi lên.
// (bản trước 02/11): rung lắc tăng dần + nén lấy đà (380 ms, tiếng lách cách) → bật: rương giãn lò xo, nắp bật, 12 tia sáng toả xoay,
// loé vàng, quầng, sóng xung, ~26 tia lửa bắn lên → lấp lánh quanh rương. Tia sáng là vành (giữa trong suốt) ⇒ nằm trên lớp phủ mà không che rương.
// Gọn (máy yếu): lắc ngắn, 8 tia sáng không xoay, không loé, 6 tia lửa + 4 lấp lánh, 30 khung/giây. Tĩnh: rương nảy nhẹ.
import type { DatRuong } from './kieu'
import { soHat, thoiGian } from './dieu-kien'
import { bangMau, chon, heSoCo, khung, loe, quang, rnd, rungMay, type Phien } from './bo-chay'
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
  const lay = lac ? T(che === 'day-du' ? 520 : 380) : 0
  let lacAn: Animation | null = null
  if (lac) {
    const goc = che === 'day-du' ? [0, -3, 3, -5, 5, -8, 8, -4, 0] : [0, -3, 3, -5, 5, 0]
    lacAn = ph.ve(el, goc.map((r, i) => { const q = i / (goc.length - 1); return { transform: `rotate(${r}deg) scale(${(1 + q * 0.07).toFixed(3)},${(1 - q * 0.1).toFixed(3)})` } }), { duration: lay, easing: 'linear', fill: 'forwards' })
    ;[0, 0.08, 0.15, 0.22, 0.28, 0.33].forEach((t, i) => on_(t, 0.035, { hz: 700 + i * 260, q: 3, v: 0.22 + i * 0.03 }))
    if (d.rung) rungMay([8, 60, 8, 50, 8, 40, 10])
    // ánh vàng rỉ ra từ khe nắp, mạnh dần theo nhịp lắc
    if (che === 'day-du') { const C0 = khung(el); quang(ph, C0.cx, C0.y + C0.h * 0.45, 120 * heSoCo(), bangMau().sao, lay + 120, 0.55) }
  }
  ph.sau(lay, () => {
    const M = bangMau(), s = heSoCo(), C = khung(el), mx = C.cx, my = C.y + C.h * 0.45, du = che === 'day-du'
    lacAn?.cancel() // bỏ thế nén (fill: forwards) — lò xo giãn tiếp từ đúng thế ấy
    if (lac) ph.nay(el, (v) => ({ transform: `translateY(${((v - 1) * -40).toFixed(2)}px) scale(${(2 - v).toFixed(4)},${v.toFixed(4)})` }), { tu: 1.15, den: 1, k: 380, c: 10 })
    if (nap) { // nắp bật vút lên rồi rơi về đúng thế mở của thẻ (khớp CSS [data-da-mo] .rg-nap)
      nap.style.transformBox = 'fill-box'; nap.style.transformOrigin = '0% 100%'
      ph.nay(nap, (v) => ({ transform: `translate(${(-4 * v).toFixed(2)}px,${(-10 * v).toFixed(2)}px) rotate(${(-24 * v).toFixed(2)}deg)` }), { tu: 0, den: 1, k: 200, c: 8 })
      ph.khiXong(() => { nap.style.transformBox = ''; nap.style.transformOrigin = '' })
    }
    // CỘT SÁNG vàng phụt lên từ miệng rương (lõi trắng + viền vàng, loe dần lên trên), giữ ngắn rồi tan
    const H = 300 * s, W = Math.max(C.w * 1.5, 90 * s), id = `hu-cot-${++soId}`
    const cot = ph.them(document.createElement('div'))
    cot.style.cssText = `position:absolute;left:${(mx - W / 2).toFixed(1)}px;top:${(my - H).toFixed(1)}px;width:${W.toFixed(1)}px;height:${H.toFixed(1)}px;opacity:0;transform-origin:50% 100%`
    cot.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%"><defs><linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--tr-sao);stop-opacity:.95"/><stop offset=".55" style="stop-color:var(--tr-sao);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--tr-sao);stop-opacity:0"/></linearGradient><linearGradient id="${id}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:${M.trangVar};stop-opacity:.95"/><stop offset=".7" style="stop-color:${M.trangVar};stop-opacity:0"/></linearGradient></defs><path d="M34 100L0 0H100L66 100Z" fill="url(#${id})"/><path d="M44 100L30 0H70L56 100Z" fill="url(#${id}l)"/></svg>`
    ph.ve(cot, [{ opacity: 0, transform: 'scaleY(.15)' }, { opacity: 1, transform: 'scaleY(1.06)', offset: 0.18 }, { opacity: 0.9, transform: 'scaleY(1)', offset: 0.5 }, { opacity: 0, transform: 'scaleY(1.02)' }], { duration: T(du ? 1300 : 800), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' })
    // VÒNG TIA toả quanh rương: tia dài / ngắn xen kẽ, xoay chậm (vành — giữa trong suốt, không che rương)
    const R = Math.max(C.w, C.h) * 1.5 + 50 * s, so = du ? 16 : 8, idT = `hu-tia-${soId}`
    const svg = ph.them(document.createElementNS(NS, 'svg'))
    svg.setAttribute('viewBox', '-100 -100 200 200'); svg.setAttribute('width', String(R * 2)); svg.setAttribute('height', String(R * 2))
    svg.style.cssText = `position:absolute;left:${mx - R}px;top:${my - R}px;opacity:0`
    let tia = ''
    for (let k = 0; k < so; k++) {
      const a = (k * Math.PI * 2) / so, dd = k % 2 ? 0.07 : 0.12, dai = k % 2 ? 74 : 100, p = (t: number, r: number) => `${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`
      tia += `<path d="M${p(a, 22)}L${p(a - dd, dai)}L${p(a + dd, dai)}Z"/>`
    }
    svg.innerHTML = `<defs><radialGradient id="${idT}"><stop offset=".2" style="stop-color:var(--tr-sao);stop-opacity:0"/><stop offset=".42" style="stop-color:var(--tr-sao);stop-opacity:.85"/><stop offset="1" style="stop-color:var(--tr-sao);stop-opacity:0"/></radialGradient></defs><g style="fill:url(#${idT})">${tia}</g>`
    if (du) {
      ph.nay(svg, (v) => ({ opacity: Math.min(1, v) * 0.85, transform: `scale(${v.toFixed(4)})` }), { tu: 0, den: 1, k: 170, c: 12 })
      ph.ve(svg, [{ rotate: '0deg' }, { rotate: '45deg' }], { duration: T(1700), easing: 'linear', composite: 'add' })
      ph.sau(T(900), () => ph.ve(svg, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 700, fill: 'forwards' }))
    } else ph.ve(svg, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 0.8, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.05)' }], { duration: T(900), easing: 'ease-out', fill: 'both' })
    loe(ph, 0.35, 170, 'var(--tr-sao)')
    quang(ph, mx, my, 340 * s, M.sao, 1100, 0.8)
    if (d.rung) rungMay([30, 40, 20])
    // tiếng: «bụp» trầm + xèo sáng + chuỗi chuông đi lên rồi một nốt ngân
    not(200, 0, 0.16, { toi: 900, kieu: 'triangle', v: 0.25 }); on_(0, 0.12, { loc: 'highpass', hz: 1800, v: 0.3 })
    ;[1047, 1319, 1568, 2093, 2637, 3136].forEach((f, i) => not(f, 0.04 + i * 0.055, 0.5, { v: 0.055 }))
    not(2093, 0.45, 1.1, { v: 0.05 })
    // hai sóng xung nối nhau
    ph.hat({ kieu: 'vong', x: mx, y: my, r0: 20 * s, r1: 150 * s, net: 7 * s, tho: 0.55, mau: M.sao })
    if (du) ph.hat({ kieu: 'vong', x: mx, y: my, r0: 16 * s, r1: 210 * s, net: 4 * s, tho: 0.8, cho: 0.14, mau: M.tin, anh: 0.7 })
    // pháo sáng phụt lên theo cột sáng (trần hạt chung 18 ⇒ chọn ít mà đẹp)
    for (let i = 0, n = soHat(9, che); i < n; i++) {
      const a = -Math.PI / 2 + rnd(-0.75, 0.75), v = rnd(380, 720) * s
      ph.hat({ kieu: 'tia', x: mx + rnd(-22, 22) * s, y: my, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1100 * s, can: 0.94, co: rnd(2, 3.6) * s, mau: chon([M.sao, M.trang, M.cam]), loi: M.trang, tho: rnd(0.5, 0.8) })
    }
    // lấp lánh đọng lại quanh rương, hiện lần lượt (sao 4 cánh)
    for (let i = 0, n = soHat(8, che); i < n; i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(46, 96) * s
      ph.hat({ kieu: 'sao', x: mx + Math.cos(a) * r, y: my - 20 * s + Math.sin(a) * r * 0.8, co: rnd(4, 8.5) * s, mau: chon([M.sao, M.trang, M.tin]), tho: rnd(0.45, 0.65), cho: 0.12 + i * 0.11, xoay: rnd(0, 0.8) })
    }
  })
  ph.dong(lay + T(1800))
}
