// LÕI CHẠY CHUNG của bộ hiệu ứng ăn mừng (bản trình diễn thầy duyệt 02/11 — scratchpad hieu-ung/hieu-ung.html, phần CORE + FX):
//  · MỘT lớp phủ `position: fixed` (pointer-events: none, contain: strict) dùng lại cho mọi hiệu ứng, TỰ GỠ khi không còn hiệu ứng nào;
//  · MỘT canvas hạt (một vòng rAF, tự dừng + gỡ canvas khi hết hạt). Bản đầy đủ: canvas phủ khung nhìn (dpr ≤ 2). Bản gọn (máy yếu): canvas NHỎ quanh
//    chỗ nổ (dpr 1), 30 khung/giây, hạt ≤ 1/4;
//  · lò xo tắt dần → khung hình Web Animations (transform / opacity — chạy ở luồng vẽ, không giữ luồng chính);
//  · KHÔNG BAO GIỜ làm rớt khung khi em bấm: chạm xuống (pointerdown) lúc hiệu ứng đang chạy ⇒ kết thúc ngay mọi hiệu ứng (về trạng thái cuối);
//    khung nào > 50 ms ⇒ bỏ bớt nửa số hạt.
// Màu: chỉ biến màu sẵn có của app học sinh (--tr-*), đọc lúc chạy.
import { thongSo, type CheDoAnMung, type ThongSoAnMung } from './dieu-kien'
import { duocPhanHoi } from '../rung'

export type Hop = { x: number; y: number; w: number; h: number }

// ───────────────────────────── màu (biến --tr-* của app; không mã màu thô)
export interface BangMau { hs: string; tin: string; sao: string; cam: string; sai: string; dung: string; nt: string; trang: string; phu: string; toi: boolean
  /** biến CSS cho SVG / lớp phủ (đổi theo sáng / tối) */ trangVar: string }
export function bangMau(): BangMau {
  const cs = getComputedStyle(document.documentElement)
  const du = getComputedStyle(document.body).color
  const v = (k: string) => cs.getPropertyValue(k).trim() || du
  let toi = false
  try { toi = window.matchMedia('(prefers-color-scheme: dark)').matches } catch { /* sáng */ }
  return { hs: v('--tr-hs'), tin: v('--tr-tin'), sao: v('--tr-sao'), cam: v('--tr-chu-y'), sai: v('--tr-sai'), dung: v('--tr-dung'), nt: v('--tr-nguyen-tu'),
    trang: v(toi ? '--tr-chu' : '--tr-mat'), phu: v('--tr-phu'), toi, trangVar: toi ? 'var(--tr-chu)' : 'var(--tr-mat)' }
}
function kenh(m: string): [number, number, number] | null {
  const s = m.trim()
  const h = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
  if (h) { let x = h[1]!; if (x.length === 3) x = [...x].map((c) => c + c).join(''); const n = parseInt(x, 16); return [n >> 16, (n >> 8) & 255, n & 255] }
  const r = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s)
  return r ? [Number(r[1]), Number(r[2]), Number(r[3])] : null
}
/** Màu `m` (biến đã đọc) với độ trong `a`. */
export const pha = (m: string, a: number): string => { const c = kenh(m); return c ? `rgba(${c[0]},${c[1]},${c[2]},${a})` : m }

export const rnd = (a: number, b: number) => a + Math.random() * (b - a)
export const chon = <T,>(a: readonly T[]): T => a[(Math.random() * a.length) | 0]!

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
  /** việc chắc chắn chạy một lần lúc kết thúc (hết giờ hoặc bị huỷ) */ khiXong(f: () => void): void
  /** kết thúc sau `ms` */ dong(ms: number): void
  huy(): void
}
const dangChay = new Set<Phien>()
const chamXuong = () => { for (const p of [...dangChay]) p.huy(); dungCanvas() }
function theoDoiCham(bat: boolean) {
  if (bat) window.addEventListener('pointerdown', chamXuong, { capture: true, passive: true })
  else window.removeEventListener('pointerdown', chamXuong, { capture: true })
}
function donLop() {
  if (dangChay.size || C.ds.length) return
  theoDoiCham(false)
  if (lop && !lop.childElementCount) lop.remove()
}

export function moPhien(che: CheDoAnMung): Phien {
  const hen: number[] = [], hoat: Animation[] = [], nut: Element[] = [], ket: (() => void)[] = []
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
    khiXong(f) { ket.push(f) },
    dong(ms) { p.sau(ms, () => p.huy()) },
    huy() {
      if (xong) return
      xong = true
      dangChay.delete(p)
      for (const t of hen) t < 0 ? cancelAnimationFrame(-t) : window.clearTimeout(t)
      for (const a of hoat) { try { a.cancel() } catch { /* đã xong */ } }
      for (const n of nut) n.remove()
      for (const f of ket) { try { f() } catch { /* bỏ qua */ } }
      donLop()
    },
  }
  if (!dangChay.size) theoDoiCham(true)
  dangChay.add(p)
  return p
}

// ───────────────────────────── canvas hạt dùng chung
export type KieuHat = 'tia' | 'vong' | 'giay' | 'than' | 'sao' | 'rieng'
export interface Hat {
  kieu: KieuHat
  x: number; y: number; vx?: number; vy?: number
  /** trọng lực px/s² */ g?: number
  /** cản (mỗi khung 60 Hz) */ can?: number
  /** tuổi hiện tại (âm = đang chờ) / thọ (giây) / chờ (giây) */ tuoi?: number; tho: number; cho?: number
  co?: number; mau: string; loi?: string
  r0?: number; r1?: number; net?: number; anh?: number
  w?: number; h?: number; tron?: boolean; xoay?: number; vXoay?: number; lat?: number; vLat?: number
  dua?: number; pha?: number
  cap?: (p: Hat, dt: number) => void
  ve?: (c: CanvasRenderingContext2D, p: Hat, u: number) => void
  chet?: boolean
  [k: string]: unknown
}
const C = { cv: null as HTMLCanvasElement | null, c: null as CanvasRenderingContext2D | null, ds: [] as Hat[], raf: 0, truoc: 0, veLuc: 0,
  dpr: 1, hop: { x: 0, y: 0, w: 0, h: 0 } as Hop, ts: thongSo('day-du'), toiDa: 260, mauPhu: '' }

function khungNhin(): Hop { return { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight } }
function gop(a: Hop, b: Hop): Hop { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y } }
function cat(h: Hop): Hop { const k = khungNhin(), x = Math.max(0, h.x), y = Math.max(0, h.y); return { x, y, w: Math.max(1, Math.min(k.w, h.x + h.w) - x), h: Math.max(1, Math.min(k.h, h.y + h.h) - y) } }

/** Chuẩn bị canvas cho chế độ `che`. Gọn ⇒ chỉ phủ `vung` (gộp với vùng đang có). Tĩnh / không vẽ được ⇒ false (bỏ hạt). */
export function canvasSan(che: CheDoAnMung, vung?: Hop, mauPhu = ''): boolean {
  const ts = thongSo(che)
  if (ts.heSoHat <= 0) return false
  const can = ts.canvasToanMan ? khungNhin() : vung ? cat(vung) : null
  if (!can) return false
  if (!C.cv) {
    const cv = document.createElement('canvas')
    cv.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none'
    const c = cv.getContext('2d')
    if (!c) return false
    C.cv = cv; C.c = c
  }
  const hop = C.ds.length && !ts.canvasToanMan ? cat(gop(C.hop, can)) : can
  const dpr = Math.min(ts.dprToiDa, window.devicePixelRatio || 1)
  if (C.ts !== ts || hop.x !== C.hop.x || hop.y !== C.hop.y || hop.w !== C.hop.w || hop.h !== C.hop.h || dpr !== C.dpr || !C.cv.isConnected) {
    C.ts = ts; C.hop = hop; C.dpr = dpr; C.toiDa = ts.canvasToanMan ? 260 : 60
    C.cv.width = Math.round(hop.w * dpr); C.cv.height = Math.round(hop.h * dpr)
    C.cv.style.transform = `translate(${hop.x}px,${hop.y}px)`; C.cv.style.width = `${hop.w}px`; C.cv.style.height = `${hop.h}px`
    if (!C.cv.isConnected) layLop().appendChild(C.cv)
  }
  if (mauPhu) C.mauPhu = mauPhu
  return true
}

export function themHat(p: Hat): void {
  if (!C.c || C.ds.length >= C.toiDa) return
  p.tuoi = -(p.cho ?? 0); p.vx ??= 0; p.vy ??= 0
  C.ds.push(p)
  if (!C.raf) { C.truoc = C.veLuc = performance.now(); C.raf = requestAnimationFrame(nhip) }
}

function nhip(now: number) {
  C.raf = 0
  const c = C.c, cv = C.cv
  if (!c || !cv) return
  // 30 khung/giây ở bản gọn: lượt rAF giữa hai lần vẽ không làm gì
  if (C.ts.khungMs && now - C.veLuc < C.ts.khungMs - 2) { C.raf = requestAnimationFrame(nhip); return }
  const gap = now - C.truoc
  const dt = Math.min(0.05, gap / 1000)
  C.truoc = C.veLuc = now
  // khung vừa rồi quá chậm (máy bận, em đang thao tác) ⇒ bớt nửa số hạt
  if (gap > 50 && C.ds.length > 8) C.ds = C.ds.filter((_, i) => i % 2 === 0)
  c.setTransform(C.dpr, 0, 0, C.dpr, -C.hop.x * C.dpr, -C.hop.y * C.dpr)
  c.clearRect(C.hop.x, C.hop.y, C.hop.w, C.hop.h)
  const L = C.ds
  for (let i = L.length - 1; i >= 0; i--) {
    const p = L[i]!
    p.tuoi! += dt
    if (p.tuoi! < 0) continue
    if (p.tuoi! >= p.tho || p.chet) { L.splice(i, 1); continue }
    if (p.cap) p.cap(p, dt)
    else {
      const dr = Math.pow(p.can ?? 1, dt * 60)
      p.vx! *= dr; p.vy = p.vy! * dr + (p.g ?? 0) * dt
      p.x += p.vx! * dt; p.y += p.vy * dt
      if (p.vXoay) p.xoay = (p.xoay ?? 0) + p.vXoay * dt
      if (p.dua) p.x += Math.sin(p.tuoi! * 7 + (p.pha ?? 0)) * p.dua * dt
    }
    veHat(c, p, p.tuoi! / p.tho)
  }
  c.globalAlpha = 1
  if (L.length) C.raf = requestAnimationFrame(nhip)
  else dungCanvas()
}

/** Dừng vòng vẽ, gỡ canvas (giải phóng bộ nhớ đệm hình). */
export function dungCanvas(): void {
  if (C.raf) cancelAnimationFrame(C.raf)
  C.raf = 0; C.ds = []
  if (C.cv) { C.cv.width = C.cv.height = 0; C.cv.remove(); C.hop = { x: 0, y: 0, w: 0, h: 0 } }
  donLop()
}

const TAU = Math.PI * 2
function veHat(c: CanvasRenderingContext2D, p: Hat, u: number) {
  c.globalAlpha = 1
  switch (p.kieu) {
    case 'tia': { // tia lửa có đuôi
      const k = 0.028
      c.globalAlpha = 1 - u * u; c.lineCap = 'round'
      c.strokeStyle = p.mau; c.lineWidth = p.co ?? 2
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx! * k, p.y - p.vy! * k); c.stroke()
      if (p.loi) { c.strokeStyle = p.loi; c.lineWidth = (p.co ?? 2) * 0.45; c.stroke() }
      break
    }
    case 'vong': { // sóng xung
      const e = 1 - Math.pow(1 - u, 3)
      c.globalAlpha = (1 - u) * (p.anh ?? 1)
      c.strokeStyle = p.mau; c.lineWidth = (p.net ?? 4) * (1 - u) + 0.5
      c.beginPath(); c.arc(p.x, p.y, (p.r0 ?? 4) + ((p.r1 ?? 60) - (p.r0 ?? 4)) * e, 0, TAU); c.stroke()
      break
    }
    case 'giay': { // pháo giấy lật hai mặt
      p.lat = (p.lat ?? 0) + (p.vLat ?? 8) * 0.016
      const s = Math.cos(p.lat), w = p.w ?? 7, h = p.h ?? 12
      c.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1
      c.save(); c.translate(p.x, p.y); c.rotate(p.xoay ?? 0); c.scale(1, s)
      c.fillStyle = p.mau
      if (p.tron) { c.beginPath(); c.arc(0, 0, w * 0.5, 0, TAU); c.fill() } else c.fillRect(-w / 2, -h / 2, w, h)
      if (s < 0 && C.mauPhu) { c.globalAlpha *= 0.45; c.fillStyle = C.mauPhu; c.fillRect(-w / 2, -h / 2, w, h) }
      c.restore()
      break
    }
    case 'than': { // tàn lửa có quầng
      const r = (p.co ?? 3) * (1 - u * 0.6), fl = 0.65 + 0.35 * Math.sin(p.tuoi! * 28 + (p.pha ?? 0))
      c.globalAlpha = (1 - u) * fl * 0.35; c.fillStyle = p.mau
      c.beginPath(); c.arc(p.x, p.y, r * 2.6, 0, TAU); c.fill()
      c.globalAlpha = (1 - u) * fl; c.fillStyle = p.loi ?? p.mau
      c.beginPath(); c.arc(p.x, p.y, r, 0, TAU); c.fill()
      break
    }
    case 'sao': { // lấp lánh bốn cánh
      const r = (p.co ?? 6) * Math.sin(Math.PI * Math.min(1, u * 1.15))
      if (r <= 0) break
      c.fillStyle = p.mau
      c.save(); c.translate(p.x, p.y); c.rotate(p.xoay ?? 0)
      c.beginPath(); c.moveTo(0, -r); c.quadraticCurveTo(0, 0, r, 0); c.quadraticCurveTo(0, 0, 0, r); c.quadraticCurveTo(0, 0, -r, 0); c.quadraticCurveTo(0, 0, 0, -r); c.fill()
      c.restore()
      break
    }
    case 'rieng': p.ve?.(c, p, u); break
  }
}

// ───────────────────────────── lớp hiệu ứng DOM nhỏ (quầng sáng, loé, tối màn, rung màn)
/** Quầng sáng tròn mờ (một div, chỉ opacity / transform). */
export function quang(ph: Phien, x: number, y: number, co: number, mau: string, ms = 600, dinh = 0.7): void {
  if (ph.che === 'tinh') return
  const g = ph.them(document.createElement('div'))
  g.style.cssText = `position:absolute;left:${x - co / 2}px;top:${y - co / 2}px;width:${co}px;height:${co}px;border-radius:50%;background:radial-gradient(closest-side, ${mau}, transparent)`
  ph.ve(g, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: dinh, transform: 'scale(1)', offset: 0.25 }, { opacity: 0, transform: 'scale(1.15)' }], { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' })
}
/** Loé cả màn một khung (chỉ bản đầy đủ). `nen` = biến CSS. */
export function loe(ph: Phien, dinh: number, ms: number, nen: string): void {
  if (!ph.ts.loeRungMan) return
  const f = ph.them(document.createElement('div'))
  f.style.cssText = `position:absolute;inset:0;opacity:0;background:${nen}`
  ph.ve(f, [{ opacity: 0 }, { opacity: dinh, offset: 0.2 }, { opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'both' })
}
/** Tối màn (trừ dải dưới cao `chuaDuoi` px — nút «Tiếp tục» luôn sáng). Trả hàm sáng lại. */
export function toiMan(ph: Phien, dinh: number, ms: number, chuaDuoi = 0): (ms: number) => void {
  if (!ph.ts.loeRungMan) return () => {}
  const d = ph.them(document.createElement('div'))
  d.style.cssText = `position:absolute;left:0;right:0;top:0;bottom:${Math.max(0, chuaDuoi)}px;opacity:0;background:var(--tr-phu)`
  ph.ve(d, [{ opacity: 0 }, { opacity: dinh }], { duration: ms, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' })
  return (ms2) => { ph.ve(d, [{ opacity: dinh }, { opacity: 0 }], { duration: ms2, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' }) }
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
