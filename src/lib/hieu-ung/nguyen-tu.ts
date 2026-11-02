// ⚛ +NGUYÊN TỬ bay vào bộ đếm (bản trình diễn 02/11): 3–8 nguyên tử theo N (bản sao biểu tượng ⚛ của bộ đếm, xoay tròn, chấm đuôi) toả vòng quanh thẻ vừa
// đúng (lấy đà 0,2 s, nảy quá đà) rồi lao theo đường cong Bézier vào bộ đếm góc phải trên, so le; mỗi hạt chạm ⇒ bộ đếm nảy + 2 lấp lánh + tiếng «tích» cao
// dần (ngũ cung); hạt cuối ⇒ quầng + sóng xung rồi `onXong` (nơi gọi cộng số máy chủ gửi — không bịa số).
// Đường bay dựng sẵn thành khung hình Web Animations (luồng vẽ, không vẽ lại mỗi khung trên luồng chính — đo CPU ×6 02/11).
// Gọn (máy yếu): 2 nguyên tử, không toả vòng, không đuôi, 30 khung/giây. Tĩnh: không bay, gọi `onXong` ngay.
import type { DatNguyenTu } from './kieu'
import { soNguyenTuBay } from './dieu-kien'
import { bangMau, chon, heSoCo, khung, quang, rnd, type Phien } from './bo-chay'
import { not, on_ } from './am-thanh-an-mung'

const NGU_CUNG = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
const TAU = Math.PI * 2
const f1 = (n: number) => n.toFixed(1)

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
    const ox = P.cx, oy = P.cy, tx = D.x + Math.min(D.w, D.h) * 0.62, ty = D.cy, gon = che === 'gon'
    // mọi việc lúc hạt chạm bộ đếm DỰNG SẴN ngay từ đầu (một hoạt ảnh nảy cho bộ đếm, lấp lánh có giờ chờ, tiếng hẹn trước trên Web Audio) — không chạy
    // mã gì mỗi lần một hạt chạm; chỉ hạt cuối gọi `onXong`
    const toi: number[] = []
    on_(0, 0.08, { hz: 1800, q: 2, v: 0.2 })
    const hinh = dem.querySelector('svg'), co = Math.round(22 * s)
    for (let i = 0; i < n; i++) {
      // điểm toả ra quanh thẻ + hai điểm uốn của đường cong (bản trình diễn)
      const a = (i / n) * TAU + rnd(-0.2, 0.2), r = rnd(26, 46) * s
      const sx = gon ? ox : ox + Math.cos(a) * r * 1.5, sy = gon ? oy : oy + Math.sin(a) * r
      const c1x = sx + Math.cos(a) * 70 * s, c1y = sy - 110 * s, c2x = tx + rnd(-90, -20) * s, c2y = ty + rnd(80, 150) * s
      const cho = gon ? 0.06 + i * 0.09 : Math.max(0.2, 0.17 + i * 0.032), bay = gon ? 0.52 : 0.42, lay = gon ? 0 : 0.2, tong = cho + bay
      const kf: Keyframe[] = []
      const diem = (t: number, x: number, y: number, k: number, op = 1) => {
        const f: Keyframe = { offset: +(t / tong).toFixed(4), transform: `translate(${f1(x - co / 2)}px,${f1(y - co / 2)}px) rotate(${(t * 9).toFixed(2)}rad) scale(${Math.max(0.001, k).toFixed(3)})`, opacity: op }
        if (gon) f.easing = 'step-end'
        kf.push(f)
      }
      if (lay) {
        for (let k = 0; k <= 6; k++) { const t = (k / 6) * lay, u = t / lay, e = 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2); diem(t, ox + (sx - ox) * e, oy + (sy - oy) * e, e) }
        diem(cho, sx, sy, 1)
      } else { diem(0, sx, sy, 1, 0); diem(cho, sx, sy, 1) }
      for (let k = 1; k <= 12; k++) {
        const u = k / 12, e = u * u * (1.6 - 0.6 * u), m = 1 - e
        diem(cho + u * bay, m * m * m * sx + 3 * m * m * e * c1x + 3 * m * e * e * c2x + e * e * e * tx, m * m * m * sy + 3 * m * m * e * c1y + 3 * m * e * e * c2y + e * e * e * ty, 1 - 0.5 * e)
      }
      const nut = (lop: number) => {
        const e = ph.them(document.createElement('span'))
        if (lop === 0) {
          e.style.cssText = `position:absolute;left:0;top:0;width:${co}px;height:${co}px;color:var(--tr-nguyen-tu);opacity:0;will-change:transform,opacity`
          if (hinh) { const b = hinh.cloneNode(true) as SVGElement; b.setAttribute('width', String(co)); b.setAttribute('height', String(co)); e.appendChild(b) }
        } else {
          const r0 = 21
          e.style.cssText = `position:absolute;left:0;top:0;width:${co}px;height:${co}px;opacity:0;will-change:transform,opacity;border-radius:50%;background:radial-gradient(circle, var(--tr-tin) 0 ${r0}%, transparent ${r0 + 4}%)`
        }
        const k2 = lop === 0 ? kf : kf.map((f) => ({ ...f, opacity: (f.opacity as number) * 0.35 }))
        ph.ve(e, k2, { duration: tong * 1000, delay: lop * 35, easing: 'linear', fill: 'none' })
      }
      nut(0)
      if (!gon) nut(1)
      toi.push(tong)
    }
    const cuoi = Math.max(...toi)
    // bộ đếm nảy ở mỗi lần chạm (1,25 → 1 trong 160 ms, chồng thì lấy đỉnh cao hơn) — một hoạt ảnh duy nhất, luồng vẽ
    const kfDem: Keyframe[] = [], buocDem = Math.ceil((cuoi + 0.2) * 30)
    for (let k = 0; k <= buocDem; k++) {
      const t = k / 30, v = toi.reduce((m, ti) => (t >= ti && t < ti + 0.16 ? Math.max(m, 1 + 0.25 * (1 - (t - ti) / 0.16)) : m), 1)
      kfDem.push({ offset: k / buocDem, transform: `scale(${v.toFixed(3)})` })
    }
    ph.ve(dem, kfDem, { duration: (buocDem / 30) * 1000, easing: 'linear' })
    toi.forEach((ti, i) => {
      not(880 * Math.pow(2, NGU_CUNG[Math.min(i + 1, 10)]! / 12), ti, 0.09, { v: 0.13 })
      if (!gon) for (let j = 0; j < 2; j++) ph.hat({ kieu: 'sao', x: tx + rnd(-16, 16) * s, y: ty + rnd(-14, 14) * s, co: rnd(4, 7) * s, mau: chon([M.sao, M.tin]), tho: 0.3, cho: ti })
    })
    if (!gon) ph.hat({ kieu: 'vong', x: tx, y: ty, r0: 10 * s, r1: 44 * s, net: 4 * s, tho: 0.35, mau: M.nt, cho: cuoi })
    ph.sau(cuoi * 1000, () => { quang(ph, tx, ty, 90 * s, M.nt, 420, 0.6); xong(); ph.dong(500) })
  })
  ph.dong(3000)
}
