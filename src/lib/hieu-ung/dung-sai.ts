// ✅/❌ ĐÚNG – SAI trên thẻ đáp án (bản trình diễn 02/11). ĐÚNG: thẻ nảy lò xo quá đà (.95 → 1), dấu tròn bật xoay, vệt sáng chạy một vòng quanh thẻ,
// vành xanh lan ra (transform / opacity — không vẽ lại thẻ), ~12 lấp lánh ở hai mép. SAI: thẻ lắc ngang theo lò xo giảm chấn, dấu bật, vành đỏ. Thay nảy / lắc CSS cũ (hu-nay, hu-lac) — không chạy
// hai thứ chồng nhau. Tiếng + rung của đúng / sai do phanHoi() của màn làm câu lo (không kêu hai lần).
// Gọn (máy yếu): nảy + dấu bật + 3 lấp lánh, không viền chạy / vành (đỡ vẽ lại). Tĩnh: nảy rất nhẹ, không lắc.
import type { DatThe } from './kieu'
import { soHat, thoiGian } from './dieu-kien'
import { bangMau, chon, heSoCo, khung, loXo, rnd, vanhThe, type Phien } from './bo-chay'

const DAU = '.ht2-lam-pa-ma, .ht2-lam-chu-cai, .ht2-lam-y-ket svg'

/** Điểm ở phân số `t` (0…1) của chu vi hình chữ nhật bo góc bán kính r (bắt đầu giữa cạnh trên bên trái, chạy theo chiều kim đồng hồ). */
function diemVien(x: number, y: number, w: number, h: number, r: number, t: number): [number, number] {
  r = Math.max(0, Math.min(r, w / 2, h / 2))
  const a = w - 2 * r, b = h - 2 * r, q = (Math.PI * r) / 2, ds = [a, q, b, q, a, q, b, q]
  let l = ((t % 1) + 1) % 1 * ds.reduce((m, v) => m + v, 0)
  const goc = (cx: number, cy: number, a0: number, u: number): [number, number] => [cx + r * Math.cos(a0 + (u * Math.PI) / 2), cy + r * Math.sin(a0 + (u * Math.PI) / 2)]
  for (let i = 0; i < 8; i++) {
    const d = ds[i]!
    if (l > d && i < 7) { l -= d; continue }
    const u = d ? Math.min(1, l / d) : 0
    switch (i) {
      case 0: return [x + r + a * u, y]
      case 1: return goc(x + w - r, y + r, -Math.PI / 2, u)
      case 2: return [x + w, y + r + b * u]
      case 3: return goc(x + w - r, y + h - r, 0, u)
      case 4: return [x + w - r - a * u, y + h]
      case 5: return goc(x + r, y + h - r, Math.PI / 2, u)
      case 6: return [x, y + h - r - b * u]
      default: return goc(x + r, y + r, Math.PI, u)
    }
  }
  return [x + r, y]
}

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
      // viền sáng chạy một vòng quanh thẻ: «sao chổi» (đầu sáng + đuôi mờ) đi theo mép bo tròn, cách thẻ 6 px — chỉ transform / opacity (luồng vẽ;
      // bản trình diễn vẽ nét SVG chạy, đo CPU ×6 thấy vẽ lại mỗi khung)
      const bo = (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14) + 3, x0 = R.x - 6, y0 = R.y - 6, w = R.w + 12, h = R.h + 12
      for (const [co, tre, dinh] of [[16, 0, 1], [26, 45, 0.45], [34, 90, 0.22]] as const) {
        const e = ph.them(document.createElement('span'))
        e.style.cssText = `position:absolute;left:0;top:0;width:${co}px;height:${co}px;border-radius:50%;opacity:0;background:radial-gradient(circle, ${M.trangVar} 0 18%, var(--tr-dung) 34%, transparent 68%)`
        const kf: Keyframe[] = []
        for (let k = 0; k <= 32; k++) { const [px, py] = diemVien(x0, y0, w, h, bo, k / 32); kf.push({ offset: k / 32, transform: `translate(${(px - co / 2).toFixed(1)}px,${(py - co / 2).toFixed(1)}px)`, opacity: k > 26 ? dinh * (32 - k) / 6 : dinh }) }
        ph.ve(e, kf, { duration: 720, delay: tre, easing: 'cubic-bezier(.45,.1,.3,1)' })
      }
      vanhThe(ph, R, 'var(--tr-dung)', bo - 3, 14 * s)
    }
    for (let i = 0, n = soHat(d.nhe ? 5 : 12, che); i < n; i++) {
      const canh = Math.random(), tren = Math.random() < 0.5
      ph.hat({ kieu: 'sao', x: R.x + canh * R.w, y: tren ? R.y : R.y + R.h, vx: (canh - 0.5) * 120 * s, vy: (tren ? -1 : 1) * rnd(40, 120) * s, can: 0.9, co: rnd(5, 9) * s,
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
  if (che === 'day-du' && !d.nhe) ph.sauVe(() => {
    const R = khung(el)
    vanhThe(ph, R, 'var(--tr-sai)', (parseFloat(getComputedStyle(el).borderTopLeftRadius) || 14), 10 * heSoCo(), 450)
  })
  ph.dong(thoiGian(700, che))
}
