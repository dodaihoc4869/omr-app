// ✅/❌ ĐÚNG – SAI trên thẻ đáp án (bản trình diễn 02/11). ĐÚNG: thẻ nảy lò xo quá đà (.95 → 1), dấu tròn bật xoay, viền sáng chạy một vòng quanh thẻ,
// quầng xanh lan ra, ~12 lấp lánh ở hai mép. SAI: thẻ lắc ngang theo lò xo giảm chấn, dấu bật, quầng đỏ. Thay nảy / lắc CSS cũ (hu-nay, hu-lac) — không chạy
// hai thứ chồng nhau. Tiếng + rung của đúng / sai do phanHoi() của màn làm câu lo (không kêu hai lần).
// Gọn (máy yếu): nảy + dấu bật + 3 lấp lánh trên canvas nhỏ, không viền chạy / quầng (đỡ vẽ lại). Tĩnh: nảy rất nhẹ, không lắc.
import type { DatThe } from './kieu'
import { soHat, thoiGian } from './dieu-kien'
import { bangMau, canvasSan, chon, heSoCo, khung, loXo, pha, rnd, themHat, type Phien } from './bo-chay'

const NS = 'http://www.w3.org/2000/svg'
const DAU = '.ht2-lam-pa-ma, .ht2-lam-chu-cai, .ht2-lam-y-ket svg'

export function dung(ph: Phien, d: DatThe): void {
  const el = d.the as HTMLElement | null | undefined
  if (!el?.style) return
  el.style.animation = 'none' // tắt nảy CSS cũ — thẻ phản hồi được dựng mới mỗi câu nên không cần trả lại
  const che = ph.che
  if (che === 'tinh') {
    ph.ve(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' })
    ph.dong(300)
    return
  }
  ph.nay(el, (v) => ({ transform: `scale(${v.toFixed(4)})` }), { tu: 0.95, den: 1, v: 2.4, k: 380, c: 13 })
  ph.nay(el.querySelector(DAU), (v) => ({ transform: `scale(${v.toFixed(4)}) rotate(${((1 - v) * -40).toFixed(1)}deg)` }), { tu: 0.3, den: 1, k: 520, c: 14, tre: 40 })
  ph.sauVe(() => {
    const M = bangMau(), s = heSoCo(), R = khung(el)
    if (!R.w) return
    if (che === 'day-du' && !d.nhe) {
      // viền sáng chạy một vòng quanh thẻ (lớp phủ, không bị thẻ cắt)
      const w = R.w + 12, h = R.h + 12, bo = (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14) + 3
      const svg = ph.them(document.createElementNS(NS, 'svg'))
      svg.setAttribute('width', String(w)); svg.setAttribute('height', String(h)); svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      svg.style.cssText = `position:absolute;left:${R.x - 6}px;top:${R.y - 6}px;overflow:visible`
      for (const [mau, net, dai, lech] of [['var(--tr-dung)', 4, 0.24, 0], [M.trangVar, 1.6, 0.1, -0.07]] as const) {
        const r = document.createElementNS(NS, 'rect')
        r.setAttribute('x', '2'); r.setAttribute('y', '2'); r.setAttribute('width', String(w - 4)); r.setAttribute('height', String(h - 4)); r.setAttribute('rx', String(bo)); r.setAttribute('pathLength', '1')
        r.setAttribute('style', `fill:none;stroke:${mau};stroke-width:${net};stroke-linecap:round;stroke-dasharray:${dai} ${1 - dai};stroke-dashoffset:${lech}`)
        svg.appendChild(r)
        ph.ve(r, [{ strokeDashoffset: lech }, { strokeDashoffset: lech - 1 }], { duration: 700, easing: 'cubic-bezier(.45,.1,.3,1)', fill: 'forwards' })
      }
      ph.ve(svg, [{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 760, fill: 'forwards' })
      ph.ve(el, [{ boxShadow: `0 0 0 0 ${pha(M.dung, 0.55)}` }, { boxShadow: `0 0 0 ${(14 * s).toFixed(1)}px ${pha(M.dung, 0)}` }], { duration: 520, easing: 'ease-out' })
    }
    if (!canvasSan(che, { x: R.x - 60, y: R.y - 60, w: R.w + 120, h: R.h + 120 }, M.phu)) return
    for (let i = 0, n = soHat(d.nhe ? 5 : 12, che); i < n; i++) {
      const canh = Math.random(), tren = Math.random() < 0.5
      themHat({ kieu: 'sao', x: R.x + canh * R.w, y: tren ? R.y : R.y + R.h, vx: (canh - 0.5) * 120 * s, vy: (tren ? -1 : 1) * rnd(40, 120) * s, can: 0.9, co: rnd(5, 9) * s,
        mau: chon([M.dung, M.sao, M.tin]), tho: rnd(0.35, 0.55), cho: rnd(0, 0.15) })
    }
  })
  ph.dong(thoiGian(900, che))
}

export function sai(ph: Phien, d: DatThe): void {
  const el = d.the as HTMLElement | null | undefined
  if (!el?.style) return
  el.style.animation = 'none' // tắt lắc CSS cũ (hu-lac)
  const che = ph.che
  if (che === 'tinh') {
    ph.ve(el, [{ transform: 'scale(1)' }, { transform: 'scale(.98)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' })
    ph.dong(300)
    return
  }
  const xs = loXo({ tu: 0, den: 0, v: d.nhe ? 260 : 430, k: 1100, c: 18, eps: 0.35 })
  ph.ve(el, xs.map((x) => ({ transform: `translateX(${x.toFixed(2)}px)` })), { duration: ((xs.length - 1) * 1000) / 60, easing: 'linear' })
  ph.nay(el.querySelector(DAU), (v) => ({ transform: `scale(${v.toFixed(4)})` }), { tu: 0.3, den: 1, k: 520, c: 16 })
  if (che === 'day-du') ph.sauVe(() => {
    const M = bangMau()
    ph.ve(el, [{ boxShadow: `0 0 0 0 ${pha(M.sai, 0.45)}` }, { boxShadow: `0 0 0 ${(10 * heSoCo()).toFixed(1)}px ${pha(M.sai, 0)}` }], { duration: 450, easing: 'ease-out' })
  })
  ph.dong(thoiGian(700, che))
}
