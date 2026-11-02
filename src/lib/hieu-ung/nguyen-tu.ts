// ⚛ +NGUYÊN TỬ bay vào bộ đếm (bản trình diễn 02/11): 6–10 nguyên tử (hạt nhân + 3 quỹ đạo + electron, vệt đuôi) toả vòng quanh thẻ vừa đúng (lấy đà
// 0,2 s) rồi lao theo đường cong Bézier vào bộ đếm góc phải trên, so le; mỗi hạt chạm ⇒ bộ đếm nảy + 2 lấp lánh + tiếng «tích» cao dần (ngũ cung); hạt cuối
// ⇒ quầng + sóng xung rồi `onXong` (nơi gọi cộng số máy chủ gửi — không bịa số).
// Gọn (máy yếu): 2 nguyên tử bằng phần tử DOM (bản sao biểu tượng ⚛ của bộ đếm) bay bằng Web Animations — chạy ở luồng vẽ, KHÔNG canvas toàn màn.
// Tĩnh: không bay, gọi `onXong` ngay.
import type { DatNguyenTu } from './kieu'
import { soNguyenTuBay } from './dieu-kien'
import { bangMau, canvasSan, chon, heSoCo, khung, quang, rnd, themHat, type Hat, type Phien } from './bo-chay'
import { not, on_ } from './am-thanh-an-mung'

const NGU_CUNG = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
const TAU = Math.PI * 2

function veNguyenTu(c: CanvasRenderingContext2D, p: Hat, A: string, B: string, O: string, S: string) {
  const r = 12 * (p.s as number) * (p.sc as number), vet = p.vet as [number, number][], q = p.q as number
  for (let k = 0; k < vet.length; k++) {
    const t = vet[k]!, f = (k + 1) / vet.length
    c.globalAlpha = f * 0.35; c.fillStyle = B
    c.beginPath(); c.arc(t[0], t[1], r * 0.45 * f, 0, TAU); c.fill()
  }
  c.globalAlpha = 0.22; c.fillStyle = B; c.beginPath(); c.arc(p.x, p.y, r * 1.25, 0, TAU); c.fill()
  c.globalAlpha = 1; c.lineWidth = Math.max(1, 1.8 * (p.s as number) * (p.sc as number)); c.strokeStyle = A
  for (let m = 0; m < 3; m++) {
    const ph = q * 0.25 + m * 1.0472
    c.beginPath(); c.ellipse(p.x, p.y, r, r * 0.38, ph, 0, TAU); c.stroke()
    const th = q * 3 + m * 2.1, ex = Math.cos(th) * r, ey = Math.sin(th) * r * 0.38
    c.fillStyle = B; c.beginPath(); c.arc(p.x + ex * Math.cos(ph) - ey * Math.sin(ph), p.y + ex * Math.sin(ph) + ey * Math.cos(ph), r * 0.16, 0, TAU); c.fill()
  }
  c.fillStyle = O; c.beginPath(); c.arc(p.x, p.y, r * 0.36, 0, TAU); c.fill()
  c.fillStyle = S; c.globalAlpha = 0.7; c.beginPath(); c.arc(p.x - r * 0.1, p.y - r * 0.1, r * 0.12, 0, TAU); c.fill()
}

export function nguyenTu(ph: Phien, d: DatNguyenTu): void {
  let daXong = false
  const xong = () => { if (daXong) return; daXong = true; d.onXong?.() }
  ph.khiXong(xong)
  const che = ph.che, n = soNguyenTuBay(d.N, che)
  if (!n || !d.tu || !d.dich) { xong(); ph.huy(); return }
  const dem = d.dich as HTMLElement
  ph.sauVe(() => {
    const M = bangMau(), s = heSoCo(), P = khung(d.tu!), D = khung(dem)
    if (!P.w || !D.w) { xong(); ph.huy(); return }
    const ox = P.cx, oy = P.cy, tx = D.x + Math.min(D.w, D.h) * 0.62, ty = D.cy
    let toi = 0
    const cham = () => {
      toi++
      ph.nay(dem, (v) => ({ transform: `scale(${v.toFixed(4)})` }), { tu: 1.32, den: 1, k: 560, c: 14 })
      not(880 * Math.pow(2, NGU_CUNG[Math.min(toi, 10)]! / 12), 0, 0.09, { v: 0.13 })
      if (che === 'day-du') for (let i = 0; i < 2; i++) themHat({ kieu: 'sao', x: tx + rnd(-16, 16) * s, y: ty + rnd(-14, 14) * s, co: rnd(4, 7) * s, mau: chon([M.sao, M.tin]), tho: 0.3 })
      if (toi < n) return
      quang(ph, tx, ty, 90 * s, M.nt, 420, 0.6)
      if (che === 'day-du') themHat({ kieu: 'vong', x: tx, y: ty, r0: 10 * s, r1: 44 * s, net: 4 * s, tho: 0.35, mau: M.nt })
      xong()
      ph.dong(500)
    }
    on_(0, 0.08, { hz: 1800, q: 2, v: 0.2 })
    if (che === 'gon') {
      // 2 hạt DOM bay theo đường cong bằng Web Animations (luồng vẽ) — máy yếu không phải vẽ canvas mỗi khung
      const hinh = dem.querySelector('svg')
      for (let i = 0; i < n; i++) {
        const h = ph.them(document.createElement('span'))
        h.style.cssText = `position:absolute;left:0;top:0;width:20px;height:20px;color:var(--tr-nguyen-tu);will-change:transform`
        if (hinh) h.appendChild(hinh.cloneNode(true))
        const a = (i / n) * TAU, sx = ox + Math.cos(a) * 30, sy = oy + Math.sin(a) * 22
        const c1x = sx + 60, c1y = sy - 110, c2x = tx - 50, c2y = ty + 110
        const kf: Keyframe[] = []
        for (let k = 0; k <= 8; k++) {
          const e = k / 8, m = 1 - e
          const x = m * m * m * sx + 3 * m * m * e * c1x + 3 * m * e * e * c2x + e * e * e * tx, y = m * m * m * sy + 3 * m * m * e * c1y + 3 * m * e * e * c2y + e * e * e * ty
          kf.push({ transform: `translate(${(x - 10).toFixed(1)}px,${(y - 10).toFixed(1)}px) scale(${(1 - 0.4 * e).toFixed(2)})`, opacity: k === 0 ? 0 : 1 })
        }
        const an = ph.ve(h, kf, { duration: 520, delay: 60 + i * 90, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'both' })
        if (an) an.onfinish = () => { h.remove(); cham() }
        else cham()
      }
      return
    }
    if (!canvasSan(che, undefined, M.phu)) { xong(); return }
    const bay: Hat[] = []
    ph.khiXong(() => { for (const p of bay) p.chet = true }) // bị huỷ (bấm «Tiếp tục») ⇒ hạt đang bay biến mất cùng lúc
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd(-0.2, 0.2), r = rnd(26, 46) * s
      const sx = ox + Math.cos(a) * r * 1.5, sy = oy + Math.sin(a) * r
      const c1x = sx + Math.cos(a) * 70 * s, c1y = sy - 110 * s, c2x = tx + rnd(-90, -20) * s, c2y = ty + rnd(80, 150) * s
      const fs = 0.17 + i * 0.032
      const p: Hat = {
        kieu: 'rieng', x: ox, y: oy, tho: 3, mau: M.nt, s, sc: 0, q: rnd(0, 6), vet: [],
        cap(p, dt) {
          const t = p.tuoi!; p.q = (p.q as number) + dt * 9
          if (t < 0.2) { const u = t / 0.2, e = 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2); p.x = ox + (sx - ox) * e; p.y = oy + (sy - oy) * e; p.sc = e }
          else if (t < fs) { p.x = sx; p.y = sy + Math.sin(t * 14 + i) * 1.5 * s; p.sc = 1 }
          else {
            const u = Math.min(1, (t - fs) / 0.42), e = u * u * (1.6 - 0.6 * u), m = 1 - e
            p.x = m * m * m * sx + 3 * m * m * e * c1x + 3 * m * e * e * c2x + e * e * e * tx
            p.y = m * m * m * sy + 3 * m * m * e * c1y + 3 * m * e * e * c2y + e * e * e * ty
            p.sc = 1 - 0.5 * e
            const vet = p.vet as [number, number][]
            vet.push([p.x, p.y]); if (vet.length > 7) vet.shift()
            if (u >= 1) { p.chet = true; cham() }
          }
        },
        ve(c, p) { veNguyenTu(c, p, M.nt, M.tin, M.cam, M.trang) },
      }
      bay.push(p); themHat(p)
    }
  })
  ph.dong(3000)
}
