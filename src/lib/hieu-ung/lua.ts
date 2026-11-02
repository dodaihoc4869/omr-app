// 🔥 LỬA CHUỖI NGÀY (bản trình diễn 02/11): ngọn lửa co lại lấy đà 200 ms rồi bùng lò xo quá đà; quầng cam, sóng xung, ~40 tàn lửa bay lên đung đưa
// (vàng · cam · đỏ, lõi sáng). Lật số do màn Chuỗi ngày lo (latSo, sẵn có). Gọn: 10 tàn lửa, 30 khung/giây. Tĩnh: nảy nhẹ.
import type { DatLua } from './kieu'
import { soHat, thoiGian } from './dieu-kien'
import { bangMau, chon, heSoCo, khung, quang, rnd, rungMay, type Phien } from './bo-chay'
import { not, on_ } from './am-thanh-an-mung'

export function lua(ph: Phien, d: DatLua): void {
  const el = d.goc as HTMLElement | null | undefined
  const che = ph.che, T = (ms: number) => thoiGian(ms, che)
  if (d.rung) rungMay([20, 40, 25])
  if (!el) { ph.huy(); return }
  if (che === 'tinh') {
    ph.ve(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' })
    ph.dong(320)
    return
  }
  const nen = ph.ve(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.05,.9)' }], { duration: T(200), easing: 'ease-in', fill: 'forwards' })
  on_(0, 0.5, { hz: 220, toi: 2600, q: 0.8, v: 0.28, a: 0.2 })
  ph.sau(T(200), () => {
    nen?.cancel() // bỏ thế co (fill: forwards) — lò xo bùng tiếp từ đúng thế ấy
    const M = bangMau(), s = heSoCo(), R = khung(el)
    ph.nay(el, (x) => ({ transform: `scale(${(2 - x).toFixed(4)},${x.toFixed(4)})` }), { tu: 0.9, den: 1, v: 3, k: 380, c: 13 })
    const fx = R.cx, fy = R.y + R.h * 0.62
    quang(ph, fx, fy - 20 * s, 260 * s, M.cam, 750, 0.6)
    on_(0, 0.3, { loc: 'lowpass', hz: 1100, v: 0.4 }); not(120, 0, 0.3, { toi: 55, v: 0.32 })
    not(523, 0.2, 0.2, { kieu: 'triangle', v: 0.13 }); not(784, 0.27, 0.32, { kieu: 'triangle', v: 0.13 })
    ph.hat({ kieu: 'vong', x: fx, y: fy, r0: 24 * s, r1: 125 * s, net: 6 * s, tho: 0.5, mau: M.cam })
    const mau = [M.sao, M.cam, M.sai]
    for (let i = 0, n = soHat(40, che); i < n; i++) ph.hat({ kieu: 'than', x: fx + rnd(-38, 38) * s, y: fy + rnd(-50, 10) * s, vx: rnd(-80, 80) * s, vy: rnd(-420, -170) * s, g: 90 * s, can: 0.975,
      dua: rnd(40, 90) * s, pha: rnd(0, 9), co: rnd(2.2, 4.4) * s, mau: chon(mau), loi: M.trang, tho: rnd(0.5, 0.85), cho: rnd(0, 0.28) })
  })
  ph.dong(T(1450))
}
