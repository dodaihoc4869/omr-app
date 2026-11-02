// 🎆 XONG CHẶNG (bản trình diễn 02/11): quầng vàng + hai sóng xung quanh khối giữa màn kết chặng, pháo giấy bắn từ HAI GÓC dưới (48 mỗi bên, lật hai mặt)
// + mưa giấy nhẹ từ trên (22), khối giữa bật lò xo, kèn hiệu ngắn. Gọn (máy yếu): KHÔNG pháo toàn màn — 24 giấy phun lên quanh khối giữa, một sóng xung,
// 30 khung/giây. Tĩnh: khối giữa nảy nhẹ.
import type { DatChang } from './kieu'
import { soHat, thoiGian } from './dieu-kien'
import { bangMau, chon, heSoCo, khung, quang, rnd, rungMay, type Phien } from './bo-chay'
import { not, on_ } from './am-thanh-an-mung'

export function chang(ph: Phien, d: DatChang): void {
  const el = d.goc as HTMLElement | null | undefined
  const che = ph.che
  if (d.rung) rungMay([30, 50, 30, 50, 60])
  if (!el) { ph.huy(); return }
  if (che === 'tinh') {
    ph.ve(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' })
    ph.dong(320)
    return
  }
  ph.sauVe(() => {
    const M = bangMau(), s = heSoCo(), W = window.innerWidth, H = window.innerHeight, C = khung(el)
    if (!C.w) return
    ph.nay(el, (v) => ({ transform: `translateY(${((1 - v) * 18).toFixed(2)}px) scale(${(0.85 + 0.15 * v).toFixed(4)})` }), { tu: 0, den: 1, k: 270, c: 14 })
    quang(ph, C.cx, C.cy, 380 * s, M.sao, 820, 0.55)
    ;[523, 659, 784].forEach((f, i) => not(f, i * 0.07, 0.16, { kieu: 'triangle', v: 0.16 }))
    not(1047, 0.21, 0.5, { kieu: 'triangle', v: 0.18 }); not(1319, 0.21, 0.5, { v: 0.07 })
    for (let i = 0; i < 4; i++) on_(i * 0.045, 0.04, { loc: 'highpass', hz: 2500, v: 0.22 })
    const mau = [M.hs, M.tin, M.cam, M.sai, M.dung, M.sao]
    if (che === 'gon') {
      ph.hat({ kieu: 'vong', x: C.cx, y: C.cy, r0: 30, r1: 170, net: 7, tho: thoiGian(550, che) / 1000, mau: M.sao, anh: 0.8 })
      for (let i = 0, n = soHat(96, che); i < n; i++) {
        const a = -Math.PI / 2 + rnd(-0.9, 0.9), v = rnd(380, 620)
        ph.hat({ kieu: 'giay', x: C.cx + rnd(-40, 40), y: C.cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 900, can: 0.96, w: rnd(5, 8), h: rnd(9, 13), mau: chon(mau), xoay: rnd(0, 6.3), vXoay: rnd(-9, 9), lat: rnd(0, 6.3), vLat: rnd(7, 14), tho: rnd(0.6, 0.75) })
      }
      return
    }
    ph.hat({ kieu: 'vong', x: C.cx, y: C.cy, r0: 30 * s, r1: 210 * s, net: 9 * s, tho: 0.55, mau: M.sao, anh: 0.8 })
    ph.hat({ kieu: 'vong', x: C.cx, y: C.cy, r0: 30 * s, r1: 250 * s, net: 4 * s, tho: 0.6, mau: M.tin, cho: 0.07, anh: 0.6 })
    for (const ben of [-1, 1]) for (let i = 0, n = soHat(48, che); i < n; i++) {
      const a = ((ben < 0 ? -67 : -113) * Math.PI) / 180 + rnd(-0.28, 0.28), v = rnd(1100, 1800) * s
      ph.hat({ kieu: 'giay', x: ben < 0 ? -4 : W + 4, y: H * 0.9, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 1300 * s, can: 0.968, w: rnd(5, 9) * s, h: rnd(9, 15) * s, tron: Math.random() < 0.18,
        mau: chon(mau), xoay: rnd(0, 6.3), vXoay: rnd(-11, 11), lat: rnd(0, 6.3), vLat: rnd(7, 16), tho: rnd(0.72, 0.84), cho: rnd(0, 0.06) })
    }
    for (let i = 0, m = soHat(22, che); i < m; i++) ph.hat({ kieu: 'giay', x: rnd(0.05, 0.95) * W, y: -12, vx: rnd(-40, 40) * s, vy: rnd(180, 420) * s, g: 500 * s, can: 0.97, w: rnd(5, 9) * s, h: rnd(9, 14) * s,
      mau: chon(mau), xoay: rnd(0, 6.3), vXoay: rnd(-8, 8), lat: rnd(0, 6.3), vLat: rnd(6, 12), tho: rnd(0.7, 0.8), cho: rnd(0, 0.12) })
  })
  ph.dong(thoiGian(1200, che))
}
