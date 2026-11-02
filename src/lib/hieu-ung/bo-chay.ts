// LÕI CHẠY CHUNG của bộ hiệu ứng ăn mừng (bản trình diễn thầy duyệt 02/11 — scratchpad hieu-ung/hieu-ung.html, phần CORE + FX):
//  · MỘT lớp phủ `position: fixed` (pointer-events: none, contain: strict) dùng lại cho mọi hiệu ứng, TỰ GỠ khi không còn hiệu ứng nào;
//  · HẠT là phần tử nhỏ trong lớp phủ, quỹ đạo mô phỏng MỘT LẦN lúc bắn rồi giao Web Animations (chỉ transform / opacity ⇒ luồng vẽ). Bản trình diễn vẽ hạt
//    trên một canvas; đo CPU ×6 (02/11) thấy canvas giữ luồng chính mỗi khung (khung p95 33 → 50–83 ms lúc sét / nguyên tử) nên đổi cách vẽ, giữ hình.
//    Bản gọn (máy yếu): hạt ≤ 1/4, khung hình lấy mẫu 30 lần/giây (30 khung/giây thật), không pháo toàn màn;
//  · lò xo tắt dần → khung hình Web Animations;
//  · KHÔNG BAO GIỜ làm rớt khung khi em bấm: chạm xuống (pointerdown) lúc hiệu ứng đang chạy ⇒ kết thúc ngay mọi hiệu ứng (về trạng thái cuối);
//    lượt bắn lớn chia nhiều khung; khung trước > 50 ms ⇒ bỏ nửa số hạt còn chờ; tối đa 40 hạt bay cùng lúc (gọn: 10).
// Màu: chỉ biến màu sẵn có của app học sinh (--tr-*), đọc lúc chạy.
import { thongSo, type CheDoAnMung, type ThongSoAnMung } from './dieu-kien'
import { duocPhanHoi } from '../rung'

// ───────────────────────────── màu (biến --tr-* của app; không mã màu thô)
export interface BangMau { hs: string; tin: string; sao: string; cam: string; sai: string; dung: string; nt: string; trang: string; toi: boolean
  /** biến CSS cho SVG / lớp phủ (đổi theo sáng / tối) */ trangVar: string }
export function bangMau(): BangMau {
  const cs = getComputedStyle(document.documentElement)
  const du = getComputedStyle(document.body).color
  const v = (k: string) => cs.getPropertyValue(k).trim() || du
  let toi = false
  try { toi = window.matchMedia('(prefers-color-scheme: dark)').matches } catch { /* sáng */ }
  return { hs: v('--tr-hs'), tin: v('--tr-tin'), sao: v('--tr-sao'), cam: v('--tr-chu-y'), sai: v('--tr-sai'), dung: v('--tr-dung'), nt: v('--tr-nguyen-tu'),
    trang: v(toi ? '--tr-chu' : '--tr-mat'), toi, trangVar: toi ? 'var(--tr-chu)' : 'var(--tr-mat)' }
}

export const rnd = (a: number, b: number) => a + Math.random() * (b - a)
export const chon = <T,>(a: readonly T[]): T => a[(Math.random() * a.length) | 0]!
const f1 = (n: number) => n.toFixed(1)

// ───────────────────────────── lò xo tắt dần
export interface LoXo { tu?: number; den?: number; k?: number; c?: number; v?: number; eps?: number }
/** Lò xo khối lượng 1 (độ cứng k, giảm chấn c, vận tốc đầu v) ⇒ mảng giá trị 60 khung/giây. `yen` (giảm chuyển động) ⇒ tắt hẳn dao động. */
export function loXo(o: LoXo, yen = false): number[] {
  const den = o.den ?? 1, k = o.k ?? 200
  let c = o.c ?? 14, x = o.tu ?? 0, v = o.v ?? 0
  if (yen) c = Math.max(c, 2 * Math.sqrt(k))
  const span = Math.abs(den - x) || 1, eps = o.eps ?? span * 0.002, ra = [x], dt = 1 / 240
  for (let f = 1; f < 120; f++) {
    for (let i = 0; i < 4; i++) { v += (-k * (x - den) - c * v) * dt; x += v * dt }
    ra.push(x)
    if (f > 5 && Math.abs(x - den) < eps && Math.abs(v) < eps * 10) break
  }
  ra[ra.length - 1] = den
  return ra
}

// ───────────────────────────── hạt: phần tử DOM + Web Animations dựng sẵn từ mô phỏng vật lý
export type KieuHat = 'tia' | 'vong' | 'giay' | 'than' | 'sao'
export interface Hat {
  kieu: KieuHat
  x: number; y: number; vx?: number; vy?: number
  /** trọng lực px/s² */ g?: number
  /** cản (nhân vận tốc mỗi khung 60 Hz) */ can?: number
  /** thọ / chờ (giây) */ tho: number; cho?: number
  co?: number; mau: string; loi?: string
  r0?: number; r1?: number; net?: number; anh?: number
  w?: number; h?: number; tron?: boolean; xoay?: number; vXoay?: number; lat?: number; vLat?: number
  dua?: number; pha?: number
}
const kho: HTMLElement[] = []
/** Hạt đang bay (mọi hiệu ứng cộng lại) — trần TRAN_HAT: nhiều hiệu ứng chồng nhau (sét + Bi + dải kết quả) không đẻ quá nhiều lớp vẽ cùng lúc. */
const song = new Set<HTMLElement>()
const TRAN_HAT = { 'day-du': 40, gon: 10, tinh: 0 } as const
function traNut(e: HTMLElement) {
  try { for (const a of e.getAnimations?.() ?? []) a.cancel() } catch { /* trình duyệt cũ */ }
  e.remove()
  if (song.delete(e) && kho.length < 160) kho.push(e)
}
const SAO = 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)'

/** Mô phỏng một hạt (60 Hz) ⇒ kích thước, kiểu tĩnh và khung hình lấy mẫu 30 lần/giây (gọn: giữ nguyên giữa hai mẫu ⇒ đúng 30 khung/giây). */
export function dungHat(p: Hat, gon: boolean): { w: number; h: number; css: string; kf: Keyframe[] } {
  let x = p.x, y = p.y, vx = p.vx ?? 0, vy = p.vy ?? 0, xoay = p.xoay ?? 0, lat = p.lat ?? 0
  const co = p.co ?? 3, buoc = Math.max(2, Math.round(p.tho * 60)), kf: Keyframe[] = []
  const L0 = Math.max(5, Math.hypot(vx, vy) * 0.028)
  let w = co, h = co, css = ''
  switch (p.kieu) {
    case 'tia': w = L0; h = co; css = `border-radius:${f1(co)}px;transform-origin:0 0;background:linear-gradient(to left, ${p.loi ?? p.mau}, ${p.mau} 40%, transparent)`; break
    case 'vong': w = h = 2 * (p.r1 ?? 60); css = `border-radius:50%;box-sizing:border-box;border:${f1(Math.max(1.5, (p.net ?? 4) * 0.6))}px solid ${p.mau}`; break
    case 'giay': w = p.w ?? 7; h = p.h ?? 12; css = `background:${p.mau};border-radius:${p.tron ? '50%' : '1.5px'}`; break
    case 'than': w = h = co * 5.2; css = `border-radius:50%;background:radial-gradient(circle, ${p.loi ?? p.mau} 0 18%, ${p.mau} 30%, transparent 70%)`; break
    case 'sao': w = h = 2 * co; css = `background:${p.mau};clip-path:${SAO};-webkit-clip-path:${SAO}`; break
  }
  const dr = p.can ?? 1, dt = 1 / 60
  for (let f = 0; f <= buoc; f++) {
    const t = f * dt, u = Math.min(1, t / p.tho)
    if (f % 2 === 0 || f === buoc) {
      let k: Keyframe
      switch (p.kieu) {
        case 'tia': { const L = Math.max(1, Math.hypot(vx, vy) * 0.028); k = { transform: `translate(${f1(x)}px,${f1(y)}px) rotate(${Math.atan2(vy, vx).toFixed(3)}rad) scaleX(${(L / L0).toFixed(3)}) translate(-100%,-50%)`, opacity: +(1 - u * u).toFixed(3) }; break }
        case 'vong': { const r1 = p.r1 ?? 60, r0 = p.r0 ?? 4, e = 1 - Math.pow(1 - u, 3); k = { transform: `translate(${f1(x - r1)}px,${f1(y - r1)}px) scale(${((r0 + (r1 - r0) * e) / r1).toFixed(3)})`, opacity: +((1 - u) * (p.anh ?? 1)).toFixed(3) }; break }
        case 'giay': k = { transform: `translate(${f1(x - w / 2)}px,${f1(y - h / 2)}px) rotate(${xoay.toFixed(3)}rad) scaleY(${Math.cos(lat).toFixed(3)})`, opacity: u > 0.7 ? +((1 - u) / 0.3).toFixed(3) : 1 }; break
        case 'than': k = { transform: `translate(${f1(x - w / 2)}px,${f1(y - h / 2)}px) scale(${(1 - u * 0.6).toFixed(3)})`, opacity: +Math.max(0, (1 - u) * (0.65 + 0.35 * Math.sin(t * 28 + (p.pha ?? 0)))).toFixed(3) }; break
        default: k = { transform: `translate(${f1(x - co)}px,${f1(y - co)}px) rotate(${xoay.toFixed(3)}rad) scale(${Math.max(0.001, Math.sin(Math.PI * Math.min(1, u * 1.15))).toFixed(3)})`, opacity: 1 }
      }
      k.offset = +(f / buoc).toFixed(4)
      if (gon) k.easing = 'step-end'
      kf.push(k)
    }
    vx *= dr; vy = vy * dr + (p.g ?? 0) * dt
    x += vx * dt; y += vy * dt
    if (p.vXoay) xoay += p.vXoay * dt
    if (p.kieu === 'giay') lat += (p.vLat ?? 8) * 0.016
    if (p.dua) x += Math.sin(t * 7 + (p.pha ?? 0)) * p.dua * dt
  }
  return { w, h, css, kf }
}

const MOT_LUOT = 28
type Cho = { p: Hat; t0: number }
/** Dựng các hạt đang chờ — tối đa MOT_LUOT mỗi khung (lượt bắn lớn chia nhiều khung, không thành một tác vụ dài); khung trước chậm > 50 ms ⇒ bỏ nửa số còn chờ. */
function boBan(hang: Cho[], gon: boolean, them: (e: HTMLElement) => void, conSong: () => boolean): void {
  const tran = TRAN_HAT[gon ? 'gon' : 'day-du']
  let truoc = 0
  const xa = (now?: number) => {
    if (!conSong() || !hang.length) return
    if (truoc && now && now - truoc > 50 && hang.length > 8) hang.splice(0, hang.length, ...hang.filter((_, i) => i % 2 === 0))
    truoc = now ?? performance.now()
    const cha = layLop(), luc = performance.now()
    for (const { p, t0 } of hang.splice(0, MOT_LUOT)) {
      if (song.size >= tran) { hang.length = 0; break } // quá trần ⇒ bỏ phần còn lại (hạt đến muộn còn tệ hơn thiếu hạt)
      const { w, h, css, kf } = dungHat(p, gon)
      const e = kho.pop() ?? document.createElement('i')
      e.style.cssText = `position:absolute;left:0;top:0;width:${f1(w)}px;height:${f1(h)}px;opacity:0;will-change:transform,opacity;${css}`
      cha.appendChild(e); them(e); song.add(e)
      try {
        const a = e.animate(kf, { duration: p.tho * 1000, delay: Math.max(0, (p.cho ?? 0) * 1000 - (luc - t0)), easing: 'linear', fill: 'none' })
        a.onfinish = () => traNut(e)
      } catch { traNut(e) }
    }
    if (hang.length) requestAnimationFrame(xa)
  }
  queueMicrotask(() => xa())
}

/** Hâm nóng lúc nạp trước (máy rảnh): dịch sẵn mã dựng hạt, cất sẵn phần tử hạt + lớp phủ ⇒ hiệu ứng ĐẦU TIÊN không chậm hơn các lần sau (đo CPU ×6: câu
 *  đầu chặng chậm hơn các câu sau một-hai khung). Không gắn gì vào trang. */
export function hamNong(): void {
  for (const kieu of ['tia', 'vong', 'giay', 'than', 'sao'] as const) dungHat({ kieu, x: 0, y: 0, vx: 100, vy: -100, g: 900, can: 0.95, tho: 0.3, mau: '' }, false)
  while (kho.length < 48) kho.push(document.createElement('i'))
  layLop().remove()
}

// ───────────────────────────── lớp phủ + phiên
let lop: HTMLDivElement | null = null
function layLop(): HTMLDivElement {
  if (!lop) {
    lop = document.createElement('div')
    lop.className = 'hu-lop'
    lop.setAttribute('aria-hidden', 'true')
    lop.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:72;contain:strict'
  }
  if (!lop.isConnected) document.body.appendChild(lop)
  return lop
}

export interface Phien {
  che: CheDoAnMung
  ts: ThongSoAnMung
  /** hẹn giờ (tự huỷ khi phiên kết thúc) */ sau(ms: number, f: () => void): void
  /** sau lần vẽ kế tiếp (đo khung SAU khi dải kết quả đã hiện — không ép bố cục trong lượt bấm) */ sauVe(f: () => void): void
  /** Web Animations có theo dõi */ ve(el: Element | null | undefined, kf: Keyframe[], o: KeyframeAnimationOptions): Animation | null
  /** lò xo → hoạt ảnh */ nay(el: Element | null | undefined, map: (v: number) => Keyframe, o: LoXo & { tre?: number }): Animation | null
  /** phần tử tạm trong lớp phủ (gỡ khi phiên kết thúc) */ them<T extends Element>(e: T, cha?: Element): T
  /** bắn một hạt (chế độ tĩnh: bỏ qua) */ hat(p: Hat): void
  /** việc chắc chắn chạy một lần lúc kết thúc (hết giờ hoặc bị huỷ) */ khiXong(f: () => void): void
  /** kết thúc sau `ms` */ dong(ms: number): void
  huy(): void
}
const dangChay = new Set<Phien>()
const chamXuong = () => { for (const p of [...dangChay]) p.huy() }
function theoDoiCham(bat: boolean) {
  if (bat) window.addEventListener('pointerdown', chamXuong, { capture: true, passive: true })
  else window.removeEventListener('pointerdown', chamXuong, { capture: true })
}
function donLop() {
  if (dangChay.size) return
  theoDoiCham(false)
  if (lop && !lop.childElementCount) lop.remove()
}

export function moPhien(che: CheDoAnMung): Phien {
  const hen: number[] = [], hoat: Animation[] = [], nut: Element[] = [], ket: (() => void)[] = [], nutHat: HTMLElement[] = [], hang: Cho[] = []
  let xong = false
  const yen = che === 'tinh'
  const p: Phien = {
    che, ts: thongSo(che),
    sau(ms, f) { if (!xong) hen.push(window.setTimeout(() => { if (!xong) f() }, Math.max(0, ms))) },
    sauVe(f) { const id = requestAnimationFrame(() => p.sau(0, f)); hen.push(-id) },
    ve(el, kf, o) {
      if (xong || !el || typeof (el as HTMLElement).animate !== 'function') return null
      try { const a = (el as HTMLElement).animate(kf, o); hoat.push(a); return a } catch { return null }
    },
    nay(el, map, o) {
      const ds = loXo(o, yen)
      return p.ve(el, ds.map(map), { duration: ((ds.length - 1) * 1000) / 60, delay: o.tre ?? 0, easing: 'linear', fill: 'backwards' })
    },
    them(e, cha) { (cha ?? layLop()).appendChild(e); nut.push(e); return e },
    hat(h) {
      if (xong || p.ts.heSoHat <= 0 || typeof Element.prototype.animate !== 'function') return
      if (!hang.length) boBan(hang, che === 'gon', (e) => nutHat.push(e), () => !xong)
      hang.push({ p: h, t0: performance.now() })
    },
    khiXong(f) { ket.push(f) },
    dong(ms) { p.sau(ms, () => p.huy()) },
    huy() {
      if (xong) return
      xong = true
      dangChay.delete(p)
      for (const t of hen) t < 0 ? cancelAnimationFrame(-t) : window.clearTimeout(t)
      for (const a of hoat) { try { a.cancel() } catch { /* đã xong */ } }
      for (const n of nut) n.remove()
      hang.length = 0
      for (const e of nutHat) traNut(e)
      for (const f of ket) { try { f() } catch { /* bỏ qua */ } }
      donLop()
    },
  }
  if (!dangChay.size) theoDoiCham(true)
  dangChay.add(p)
  return p
}

// ───────────────────────────── lớp hiệu ứng DOM nhỏ (quầng sáng, loé, tối màn, vành, rung màn)
/** Quầng sáng tròn mờ (một div, chỉ opacity / transform). */
export function quang(ph: Phien, x: number, y: number, co: number, mau: string, ms = 600, dinh = 0.7): void {
  if (ph.che === 'tinh') return
  const g = ph.them(document.createElement('div'))
  g.style.cssText = `position:absolute;left:${f1(x - co / 2)}px;top:${f1(y - co / 2)}px;width:${f1(co)}px;height:${f1(co)}px;border-radius:50%;opacity:0;background:radial-gradient(closest-side, ${mau}, transparent)`
  ph.ve(g, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: dinh, transform: 'scale(1)', offset: 0.25 }, { opacity: 0, transform: 'scale(1.15)' }], { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)' })
}
/** Loé cả màn một khung (chỉ bản đầy đủ). `nen` = biến CSS. */
export function loe(ph: Phien, dinh: number, ms: number, nen: string): void {
  if (!ph.ts.loeRungMan) return
  const f = ph.them(document.createElement('div'))
  f.style.cssText = `position:absolute;inset:0;opacity:0;background:${nen}`
  ph.ve(f, [{ opacity: 0 }, { opacity: dinh, offset: 0.2 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' })
}
/** Tối màn (trừ dải dưới cao `chuaDuoi` px — nút «Tiếp tục» luôn sáng). Trả hàm sáng lại. */
export function toiMan(ph: Phien, dinh: number, ms: number, chuaDuoi = 0): (ms: number) => void {
  if (!ph.ts.loeRungMan) return () => {}
  const d = ph.them(document.createElement('div'))
  d.style.cssText = `position:absolute;left:0;right:0;top:0;bottom:${Math.max(0, chuaDuoi)}px;opacity:0;background:var(--tr-phu)`
  const vao = ph.ve(d, [{ opacity: 0 }, { opacity: dinh }], { duration: ms, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' })
  return (ms2) => { vao?.cancel(); ph.ve(d, [{ opacity: dinh }, { opacity: 0 }], { duration: ms2, easing: 'cubic-bezier(.3,0,.2,1)' }) }
}
/** Vành sáng lan ra quanh thẻ (thay quầng box-shadow: chỉ transform / opacity ⇒ luồng vẽ, không vẽ lại thẻ mỗi khung). `mau` = biến CSS. */
export function vanhThe(ph: Phien, R: { x: number; y: number; w: number; h: number }, mau: string, bo: number, xa: number, ms = 520): void {
  if (!R.w || !R.h) return
  const v = ph.them(document.createElement('div'))
  v.style.cssText = `position:absolute;left:${f1(R.x)}px;top:${f1(R.y)}px;width:${f1(R.w)}px;height:${f1(R.h)}px;box-sizing:border-box;border-radius:${f1(bo)}px;border:3px solid ${mau};opacity:0`
  ph.ve(v, [{ transform: 'scale(1)', opacity: 0.75 }, { transform: `scale(${(1 + (2 * xa) / R.w).toFixed(4)},${(1 + (2 * xa) / R.h).toFixed(4)})`, opacity: 0 }], { duration: ms, easing: 'ease-out' })
}
/** Rung khung nội dung tắt dần (chỉ bản đầy đủ). */
export function rungMan(ph: Phien, el: Element | null | undefined, bien: number, ms = 300): void {
  if (!ph.ts.loeRungMan || !el) return
  const n = 16, kf: Keyframe[] = []
  for (let i = 0; i <= n; i++) {
    const d = Math.pow(1 - i / n, 1.7)
    kf.push({ transform: i === 0 || i === n ? 'none' : `translate(${(rnd(-1, 1) * bien * d).toFixed(2)}px,${(rnd(-1, 1) * bien * 0.7 * d).toFixed(2)}px) rotate(${(rnd(-1, 1) * 0.5 * d).toFixed(2)}deg)` })
  }
  ph.ve(el, kf, { duration: ms, easing: 'linear' })
}
/** Rung máy ngắn — tôn trọng công tắc «Rung» của menu (ddh.rung) và luật trình duyệt (chỉ sau lần chạm đầu). */
export function rungMay(mau: number | number[]): void {
  if (!duocPhanHoi('ddh.rung')) return
  try {
    const n = navigator as Navigator & { vibrate?: (m: number | number[]) => boolean; userActivation?: { hasBeenActive: boolean } }
    if (typeof n.vibrate === 'function' && n.userActivation?.hasBeenActive !== false) n.vibrate(Array.isArray(mau) ? mau.map((v, i) => (i % 2 ? v : Math.max(v, 35))) : Math.max(mau, 35))
  } catch { /* máy không rung được */ }
}

/** Tâm + khung phần tử theo khung nhìn. */
export const khung = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 } }
/** Hệ số cỡ theo bề ngang màn (bản trình diễn vẽ ở 360 px). */
export const heSoCo = () => Math.max(0.85, Math.min(1.3, window.innerWidth / 390))
