// LINH VẬT «LỬA» CHUYỂN ĐỘNG — hình «CÚ NGỌC» (thầy chốt 28/10 «Chốt build thay»: concept cú × Lửa màu chàm ngọc, bản vẽ duyệt
// ve-moi/linh-vat-moi/v4-cu-ngoc). Tên trên màn VẪN là «Lửa» (Cú Ngọc là tên concept) ⇒ không đổi chữ khắp app. Mảnh NẠP LƯỜI: chỉ Bi.tsx gọi import('./lua-dong').
// Hình: đầu to lông chàm viền chàm đậm, mặt kem, má hồng, mắt tròn hai điểm sáng; chỏm lửa hồng; kính bảo hộ ngọc lam ôm trán + viên lục giác chàm;
// tai nhọn lòng kem; blouse trắng viền chàm, ống nghiệm hồng túi trái, huy hiệu lục giác ngọn lửa ngực phải; đuôi xoăn to vệt ngọc; tay «cánh cú» xù.
// Khung xương LÒ XO: mọi tham số nội suy từ giá trị đang có ⇒ đổi cảm xúc không nhảy cóc, có lấy đà và quá đà; tai + đuôi + chỏm lửa trễ một nhịp.
// Góc nghiêng (tham số q) xoay đầu / mặt / kính / thân / đuôi; `goc` = 'phai' | 'trai' đứng nghiêng hẳn (trái = lật gương).
// MỘT vòng rAF chung cho mọi Lửa trên màn; ra khỏi khung nhìn / tab ẩn / bị màn con che ⇒ không tính, không vẽ. Máy yếu ⇒ vẽ một khung rồi đứng.
// Không màu thô: mọi màu là biến --cn-* (styles/cu-ngoc.css, nạp cùng mảnh này) pha từ token bảng «Chất chỉ thị» --tr-*.
import '../../styles/cu-ngoc.css'
export type TrangThaiLua = 'yen' | 'cuoi' | 'chao' | 'vui' | 'combo' | 'buon' | 'ngac' | 'nghi' | 'covu' | 'ngu' | 'choc' | 'doi' | 'gian' | 'caunhau'
export const TRANG_THAI_LUA: readonly TrangThaiLua[] = ['yen', 'cuoi', 'chao', 'vui', 'combo', 'buon', 'ngac', 'nghi', 'covu', 'ngu', 'choc', 'doi', 'gian', 'caunhau']
export type GocLua = 'truoc' | 'phai' | 'trai'
export interface TuyChonLua {
  /** Sau bao nhiêu ms thì tự chuyển sang `ve`. */
  sau?: number
  ve?: TrangThaiLua
  /** Êm: bỏ nhịp lấy đà / nảy khi vào trạng thái. */
  em?: boolean
}
export interface Lua {
  datTrangThai(t: TrangThaiLua, tc?: TuyChonLua): void
  /** Miệng mấp máy trong lúc chữ gõ ra (`msMoiChu` ms mỗi chữ). */
  noi(chu: string, msMoiChu?: number): void
  cham(): void
  readonly trangThai: TrangThaiLua
  readonly svg: SVGSVGElement
  /** Bước tay (bộ chụp / test): tiến `ms` mili giây rồi vẽ. */
  buoc(ms: number): void
  huy(): void
}

const NS = 'http://www.w3.org/2000/svg'
type So = Record<string, number>
type TT = Record<string, unknown>
type Khung = { d: number; k?: number; p?: TT }
type TrangThaiVe = { base?: TT; seq?: Khung[]; loop?: Khung[] }
type Diem = [number, number] | [number, number, number]
const f1 = (v: number) => Math.round(v * 10) / 10
const rad = (d: number) => (d * Math.PI) / 180
const M = (k: string) => `var(--cn-${k})`
function tao(tag: string, tt: Record<string, string | number> | null, cha?: Element | null): SVGElement {
  const e = document.createElementNS(NS, tag) as SVGElement
  if (tt) for (const k in tt) e.setAttribute(k, String(tt[k]))
  if (cha) cha.appendChild(e)
  return e
}
const to = (e: SVGElement, mau: string) => { e.style.fill = M(mau); return e }
const OUT = 5.5 // nét viền chàm đậm
const vien = (e: SVGElement, w = OUT, mau = 'vien') => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.style.paintOrder = 'stroke'; e.setAttribute('stroke-linejoin', 'round'); return e }
const net = (e: SVGElement, mau: string, w: number) => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.setAttribute('fill', 'none'); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); return e }
function dg(pts: Diem[]): string {
  let d = ''
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const p = pts[i]!, a = pts[(i + n - 1) % n]!, b = pts[(i + 1) % n]!, r = p[2] ?? 0
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]), ra = Math.min(r, da / 2), rb = Math.min(r, db / 2)
    d += (i ? 'L' : 'M') + f1(p[0] + ((a[0] - p[0]) * ra) / da) + ',' + f1(p[1] + ((a[1] - p[1]) * ra) / da) + 'Q' + f1(p[0]) + ',' + f1(p[1]) + ' ' + f1(p[0] + ((b[0] - p[0]) * rb) / db) + ',' + f1(p[1] + ((b[1] - p[1]) * rb) / db)
  }
  return d + 'Z'
}
const H = (c: Element, d: Diem[] | string, mau: string, tt?: Record<string, string | number>) => to(tao('path', { d: typeof d === 'string' ? d : dg(d), ...tt }, c), mau)
const E = (c: Element, cx: number, cy: number, rx: number, ry: number, mau: string, tt?: Record<string, string | number>) => to(tao('ellipse', { cx, cy, rx, ry, ...tt }, c), mau)
const R = (c: Element, x: number, y: number, w: number, h: number, r: number, mau: string, tt?: Record<string, string | number>) => to(tao('rect', { x, y, width: w, height: h, rx: r, ...tt }, c), mau)

// Gốc = mặt đất giữa hai chân, y hướng xuống. Đầu tâm (0, -196), rộng 224; thân 172 × 116; hình cao ≈ 352 / khung 391 (0,9).
export const VIEWBOX = '-170 -372 340 391' // 340 : 391 = 200 : 230 như Bi / Lửa cũ ⇒ mọi khung chứa giữ nguyên
const DAU_Y = -196

// ─────────── TƯ THẾ / CẢM XÚC ───────────
const CHUAN: So = { x: 0, y: 0, rot: 0, sq: 1, hr: 0, hy: 0, q: 0, tai: 0, aT: 22, bT: 10, dT: 1, aP: 22, bP: 10, dP: 1, px: 0, py: 0, lt: 0, ltP: 0, la: 0, es: 1, may: 0, ba: 0, mw: 2, mc: 5, mt: -1, mb: 11, mk: 0, ma: 0.9, lua: 1, tho: 1 }
const ROI: Record<string, string | number> = { mat: 'mo', hT: 'nam', hP: 'nam', zT: 0, zP: 0, hieu: '' }
const MK = new Set(['px', 'py', 'lt', 'ltP', 'la', 'es', 'may', 'ba', 'mw', 'mc', 'mt', 'mb', 'mk', 'ma'])
const A = (...d: TT[]): TT => Object.assign({}, ...d)
export const CAM_XUC_LUA: Record<TrangThaiLua, TrangThaiVe> = {
  yen: { base: {}, loop: [{ d: 1700, k: 22, p: { rot: -1.5, hr: 2 } }, { d: 1700, k: 22, p: { rot: 1.5, hr: -1 } }] },
  cuoi: { base: { mat: 'cong', mw: 4, mc: 6, mt: -1, mb: 13, tai: -4 }, loop: [{ d: 1700, k: 22, p: { rot: -1.5, hr: 2 } }, { d: 1700, k: 22, p: { rot: 1.5, hr: -1 } }] },
  chao: { // vẫy tay DÀI: cánh tay vươn ra ngoài rồi lên (như dáng chính ảnh thầy), mắt híp cười, vạch «!» hồng
    base: { aP: 95, bP: 125, dP: 1.4, hP: 'xoe', zP: 1, mat: 'cong', mw: 5, mc: 6, mt: -1, mb: 15, hr: -5, rot: -2, tai: -4, hieu: 'nhay' },
    loop: [{ d: 300, k: 260, p: { bP: 108 } }, { d: 300, k: 260, p: { bP: 142 } }],
  },
  vui: { // đúng: lấy đà 80 ms rồi nảy, cười híp, lấp lánh
    base: { mat: 'cong', mw: 5, mc: 6, mt: -1, mb: 14, aP: 120, bP: 150, hP: 'xoe', zP: 1, tai: -6 },
    seq: [{ d: 80, k: 520, p: { y: 6, sq: 0.84, aP: 30, bP: 20 } }, { d: 260, k: 260, p: { y: -22, sq: 1.1, hieu: 'sao' } }, { d: 160, k: 320, p: { sq: 0.92 } }],
    loop: [{ d: 260, k: 300, p: { y: -9, sq: 1.05, bP: 125 } }, { d: 260, k: 300, p: { y: 0, sq: 0.95, bP: 165 } }],
  },
  combo: { // nhảy cao, hai tay giơ, chỏm lửa bùng
    base: { mat: 'cong', mw: 7, mc: 6, mt: -2, mb: 17, aT: 130, bT: 155, aP: 130, bP: 155, hT: 'xoe', hP: 'xoe', zT: 1, zP: 1, tai: -12, lua: 1.5 },
    seq: [{ d: 80, k: 560, p: { y: 8, sq: 0.8, aT: 30, bT: 20, aP: 30, bP: 20, mat: 'mo', es: 1.12, mt: -3, mb: 8 } }, { d: 300, k: 240, p: { y: -40, sq: 1.14, hieu: 'sao' } }, { d: 170, k: 320, p: { sq: 0.86 } }, { d: 300, k: 240, p: { y: -28, sq: 1.1, rot: 8 } }, { d: 170, k: 320, p: { sq: 0.88 } }],
    loop: [{ d: 280, k: 260, p: { y: -14, sq: 1.08, rot: -6, aT: 115, aP: 145 } }, { d: 280, k: 260, p: { y: 0, sq: 0.92, rot: 6, aT: 145, aP: 115 } }],
  },
  buon: { // sai: giật mình, tai cụp, xị, giọt mồ hôi
    base: { lt: 0.38, ltP: 0.38, la: -16, may: 1, ba: -16, mw: -3, mc: -6, mt: -2, mb: 2, py: 0.6, ma: 0.5, sq: 0.92, tai: 30, aT: 4, bT: 0, aP: 4, bP: 0, hr: 4, hy: 4, lua: 0.75 },
    seq: [{ d: 110, k: 440, p: { y: -6, sq: 1.08, es: 1.12, mt: -3, mb: 8, mc: 0, tai: -8, lua: 1.1, ma: 0.9, may: 0, hieu: 'giot' } }],
    loop: [{ d: 1200, k: 50, p: {} }, { d: 1000, k: 40, p: { sq: 0.89, hr: 6, hy: 5 } }],
  },
  ngac: { // ngạc nhiên: mắt to, mày nhướng, miệng chữ O, hai cánh áp má
    base: { es: 1.14, may: 1, ba: -10, mw: -5, mc: 0, mt: -4, mb: 10, aT: 150, iT: [-66, -150], aP: 150, iP: [66, -150], hT: 'xoe', hP: 'xoe', zT: 1, zP: 1, tai: -14, y: -4 },
    seq: [{ d: 90, k: 520, p: { y: 4, sq: 0.86 } }, { d: 200, k: 300, p: { y: -14, sq: 1.1 } }],
    loop: [{ d: 600, k: 200, p: {} }, { d: 600, k: 200, p: { y: -2 } }],
  },
  nghi: { // suy nghĩ: cánh chống cằm, mắt liếc lên, miệng mím, dấu ?
    base: { aP: 150, iP: [26, -120], hP: 'nam', zP: 1, px: -0.5, py: -0.7, lt: 0.12, may: 1, ba: -4, mw: -5, mc: 0, mt: 1, mb: 1, mk: 2, hr: 7, tai: 4, hieu: 'hoi' },
    loop: [{ d: 900, k: 120, p: {} }, { d: 280, k: 320, p: { iP: [26, -125] } }, { d: 280, k: 320, p: {} }],
  },
  covu: { // cổ vũ (chuỗi ngày): nháy mắt, đấm tay lên
    base: { lt: 1, mw: 5, mc: 6, mt: -1, mb: 12, aP: 112, bP: 168, hP: 'nam', zP: 1, aT: 20, iT: [-30, -60], hT: 'nam', zT: 1, rot: 4, q: 0.2, tai: -6 },
    seq: [{ d: 90, k: 500, p: { y: 4, sq: 0.88, aP: 40, bP: 40 } }],
    loop: [{ d: 220, k: 420, p: { bP: 150, aP: 98, y: -4 } }, { d: 220, k: 420, p: { y: 0 } }, { d: 1200, k: 200, p: {} }],
  },
  ngu: { base: { mat: 'nham', mw: -4, mc: 1, mt: 2, mb: 4, hr: 10, rot: 4, hy: 3, tai: 20, sq: 0.95, lua: 0.6, aT: 8, bT: -30, aP: 8, bP: -30, ma: 0.7, hieu: 'zzz' }, loop: [{ d: 1500, k: 30, p: { sq: 0.93 } }, { d: 1500, k: 30, p: { sq: 0.97 } }] },
  choc: { // bị chạm: nảy lên, mắt nhắm tịt, cười khúc khích
    seq: [{ d: 90, k: 520, p: { y: 5, sq: 0.82 } }, { d: 340, k: 300, p: { y: -16, sq: 1.12, aT: 120, bT: 150, aP: 120, bP: 150, zT: 1, zP: 1, hT: 'xoe', hP: 'xoe', mat: 'xoan', mw: 3, mc: 2, mt: -2, mb: 10, mk: 3, hr: -8, ma: 1.3, tai: -14, lua: 1.3 } },
      { d: 520, k: 240, p: { hr: 6, mat: 'cong', mw: 4, mc: 6, mt: 0, mb: 10, ma: 1.1 } }],
  },
  doi: { // dỗi: khoanh tay, nghiêng đầu, liếc ngang, môi chu
    base: { aT: -6, iT: [34, -58], aP: -6, iP: [-34, -66], zT: 1, zP: 1, q: -0.45, hr: -8, px: 0.7, py: 0.1, lt: 0.35, ltP: 0.35, la: 10, may: 1, ba: 14, mw: -6, mc: -2, mt: 1, mb: 3, mk: 1.5, ma: 1.2, tai: 10 },
    seq: [{ d: 110, k: 420, p: { y: 3, sq: 0.94 } }],
    loop: [{ d: 1400, k: 60, p: {} }, { d: 260, k: 300, p: { hr: -12 } }, { d: 260, k: 300, p: {} }],
  },
  gian: { // tức giận: mày xếch, mắt dữ, nắm tay trước bụng, khói hồng
    base: { aT: 14, iT: [-36, -46], aP: 14, iP: [36, -46], zT: 1, zP: 1, lt: 0.3, ltP: 0.3, la: 22, may: 1, ba: 24, mw: -2, mc: -5, mt: -2, mb: 4, ma: 1.3, sq: 0.95, tai: -6, hieu: 'khoi' },
    seq: [{ d: 100, k: 480, p: { y: -6, sq: 1.08 } }],
    loop: [{ d: 120, k: 600, p: { x: -2 } }, { d: 120, k: 600, p: { x: 2 } }, { d: 120, k: 600, p: { x: -2 } }, { d: 900, k: 200, p: {} }],
  },
  caunhau: { // càu nhàu: nhắm một mắt, miệng méo lẩm bẩm, cánh giơ, vạch tiếng hồng
    base: { aP: 100, bP: 150, hP: 'xoe', zP: 1, lt: 1, ltP: 0.4, la: 6, may: 1, ba: 8, mw: -3, mc: -2, mt: 0, mb: 4, mk: 2.5, hr: 6, tai: 4, hieu: 'lam' },
    loop: [{ d: 200, k: 400, p: { bP: 135, mb: 6 } }, { d: 200, k: 400, p: { mb: 2 } }, { d: 200, k: 400, p: { bP: 135, mb: 6 } }, { d: 700, k: 200, p: {} }],
  },
}

// NHƯỜNG KHUNG CHO LƯỢT CHẠM (27/10 MƯỢT, đo scripts/do-muot-hs.mjs): có pointerdown / keydown ⇒ linh vật nghỉ 140 ms (đồng hồ lò xo vẫn tính).
let nhuongDen = 0
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const chamNhuong = () => { nhuongDen = performance.now() + 140 }
  window.addEventListener('pointerdown', chamNhuong, { capture: true, passive: true })
  window.addEventListener('keydown', chamNhuong, { capture: true, passive: true })
}
const dangNhuongKhung = (now: number): boolean => now < nhuongDen
// ─────────── MỘT VÒNG rAF CHUNG ───────────
// Vòng chỉ chạy khi CÓ Lửa đang được nhìn thấy (IntersectionObserver; Lộ trình `inert` dưới màn con ⇒ <html class="sanh-bi-che">). ~30 khung/s.
type Song = { tich(dt: number): void; ve(): void; hien: boolean; svg: SVGSVGElement }
const dangSong = new Set<Song>()
let raf = 0, lan = 0, tichLuy = 0
const mayYeu = () => document.documentElement.classList.contains('may-yeu')
const biChe = (s: Song) => document.documentElement.classList.contains('sanh-bi-che') && !!s.svg.closest('[inert]')
const dangThay = () => [...dangSong].filter((s) => s.hien && !biChe(s))
function lap(now: number) {
  raf = 0
  if (document.hidden || !dangSong.size) { lan = 0; return }
  const ds = dangThay()
  if (!ds.length) { lan = 0; return }
  if (dangNhuongKhung(now)) { raf = requestAnimationFrame(lap); return }
  const dtms = lan ? Math.min(100, now - lan) : 16
  lan = now; tichLuy += dtms
  if (tichLuy >= 30 || mayYeu()) {
    let con = tichLuy; tichLuy = 0
    while (con > 0) { const dt = Math.min(con, 8); for (const s of ds) s.tich(dt / 1000); con -= dt }
    for (const s of ds) s.ve()
  }
  if (mayYeu()) { lan = 0; return }
  raf = requestAnimationFrame(lap)
}
const chay = () => { if (!raf && !document.hidden && dangSong.size) { lan = 0; raf = requestAnimationFrame(lap) } }
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', chay)
  if (typeof MutationObserver !== 'undefined') new MutationObserver(chay).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

/** Các Lửa đang sống (bộ chụp / máy quay video bản build điều khiển trạng thái qua đây). */
export const LUA_DANG_SONG = new Set<Lua>()
let soId = 0
export function taoLua(noiGan: HTMLElement, tc: { trangThai?: TrangThaiLua; tuyChon?: TuyChonLua; tinh?: boolean; tay?: boolean; goc?: GocLua } = {}): Lua {
  const id = 'lua' + ++soId, tinh = !!tc.tinh, qGoc = tc.goc && tc.goc !== 'truoc' ? 0.8 : 0
  const svg = tao('svg', { viewBox: VIEWBOX, class: 'lua-svg', 'aria-hidden': 'true', focusable: 'false' }, null) as SVGSVGElement
  const defs = tao('defs', null, svg)
  const P: Record<string, SVGElement> = {}
  const g = (k: string, c: Element) => (P[k] = tao('g', null, c))
  const lat = tao('g', tc.goc === 'trai' ? { transform: 'scale(-1,1)' } : null, svg) // nghiêng trái = gương của nghiêng phải
  const bong = E(lat, 0, 6, 92, 12, 'bong')
  g('goc', lat); g('duoi', P.goc!)
  // ĐUÔI xoăn to: khối chàm + mảng tối + vệt ngọc lưỡi liềm + lõi xoáy
  const du = tao('g', { transform: 'translate(-100,-62)' }, P.duoi!)
  vien(E(du, 0, 0, 50, 46, 'long'))
  H(du, 'M44,-14C54,18 30,46 -2,46C-28,46 -46,30 -50,8C-38,30 -8,40 14,30C34,22 44,4 44,-14Z', 'longT')
  H(du, 'M-4,-34C-30,-30 -40,-4 -30,16C-26,24 -18,28 -12,30C-24,14 -24,-12 -4,-34Z', 'ngoc')
  H(du, 'M-10,-26C-22,-18 -26,-6 -24,4C-20,-8 -16,-16 -10,-26Z', 'ngocS')
  E(du, 8, 4, 13, 12, 'longT')
  // CHÂN
  const chan = [-1, 1].map((s) => { const c = tao('g', null, P.goc!); vien(E(c, 0, -4, 27, 14, 'longS')); return { c, s } })
  g('lopSau', P.goc!)
  // THÂN + ÁO BLOUSE
  g('than', P.goc!)
  const thanD = dg([[-64, -118, 40], [64, -118, 40], [86, -50, 46], [70, -2, 26], [-70, -2, 26], [-86, -50, 46]])
  H(P.than!, thanD, 'long')
  H(tao('clipPath', { id: id + 't' }, defs), thanD, 'long')
  const cat = tao('g', { 'clip-path': `url(#${id}t)` }, P.than!)
  H(cat, 'M-120,-112L-30,-112L0,-64L30,-112L120,-112V20H-120Z', 'trang')
  H(cat, 'M40,-112L120,-112V20H52Q66,-40 40,-112Z', 'aoT')
  const ao = g('ao', P.than!)
  net(tao('path', { d: 'M-46,-112L0,-58L46,-112' }, ao), 'vien', 4.5)
  vien(H(ao, 'M-46,-113L-30,-113L0,-64L-6,-56Z', 'trang'), 3.6)
  vien(H(ao, 'M46,-113L30,-113L0,-64L6,-56Z', 'trang'), 3.6)
  net(tao('path', { d: 'M0,-58V-4' }, ao), 'vien', 3.6)
  const tui = tao('g', { transform: 'translate(-40,-46)' }, ao), ong = tao('g', { transform: 'rotate(-6)' }, tui)
  vien(R(ong, -8, -34, 16, 42, 8, 'thuyTinh'), 3.2)
  H(ong, 'M-6.4,-14H6.4V0A6.4,6.4 0 0 1 -6.4,0Z', 'hong'); R(ong, -3.6, -28, 3, 11, 1.5, 'trang')
  vien(R(tui, -20, -4, 40, 26, 6, 'trang'), 4).style.paintOrder = 'normal'
  const hh = tao('g', { transform: 'translate(40,-58)' }, ao)
  vien(H(hh, 'M0,-21L18.2,-10.5V10.5L0,21L-18.2,10.5V-10.5Z', 'lucGiac'), 3.4)
  H(hh, 'M0,-12C6,-6 9,-1 8,5C7,10 3,13 0,13C-4,13 -8,10 -8,5C-8,1 -6,-2 -3,-5C-3,-1 -1,1 1,1C2,-3 1,-7 0,-12Z', 'trang')
  vien(tao('path', { d: thanD, fill: 'none' }, P.than!)) // nét viền thân phủ trên áo
  // TAY: tay áo trắng hai đốt (khuỷu bo) + bàn tay «cánh cú» xù chàm
  const tay = [-1, 1].map((s) => {
    const tg = tao('g', null, P.lopSau!)
    const ongT = vien(H(tg, '', 'trang'), 4.5)
    const ban = tao('g', null, tg), kieu: Record<string, SVGElement> = {}
    const k1 = (t: string) => (kieu[t] = tao('g', null, ban))
    let h = k1('nam'); vien(H(h, 'M-15,-4C-20,8 -18,24 -6,30Q0,34 6,30C18,24 20,8 15,-4Z', 'long')); net(tao('path', { d: 'M-4,22L-2,28M4,22L4,29' }, h), 'vien', 2.6)
    h = k1('xoe'); vien(H(h, 'M-15,-4C-21,12 -18,30 -11,40Q-6,47 -2,40Q2,50 7,41Q13,47 15,35C21,20 19,6 15,-4Z', 'long')); H(h, 'M2,8C8,14 10,24 8,32C5,24 2,18 2,8Z', 'longS')
    return { tg, ongT, ban, kieu, s, z: 0, kh: '' }
  })
  // ĐẦU (gốc nhóm = tâm đầu)
  g('dau', P.goc!); g('tai', P.dau!)
  const tai = [-1, 1].map(() => { const t = tao('g', null, P.tai!); vien(H(t, [[-34, 34, 10], [30, 18, 10], [-4, -46, 8]], 'long')); H(t, [[-20, 22, 6], [16, 12, 6], [-4, -26, 5]], 'kem'); return t })
  g('lua', P.dau!)
  vien(H(P.lua!, 'M0,0C-18,-2 -26,-18 -18,-34C-14,-24 -8,-22 -6,-26C-10,-38 -4,-52 8,-58C4,-44 12,-40 16,-34C22,-26 24,-10 14,-2C10,0 4,1 0,0Z', 'hong'), 4.5)
  H(P.lua!, 'M2,-6C-6,-8 -10,-16 -6,-24C-2,-18 4,-20 4,-26C10,-20 12,-12 8,-7C6,-6 4,-6 2,-6Z', 'hongS')
  const dauD = dg([[-70, -90, 52], [70, -90, 52], [110, -10, 56], [112, 30, 10], [100, 42, 4], [108, 52, 14], [70, 88, 40], [-70, 88, 40], [-108, 52, 14], [-100, 42, 4], [-112, 30, 10], [-110, -10, 56]])
  H(P.dau!, dauD, 'long')
  H(tao('clipPath', { id: id + 'd' }, defs), dauD, 'long')
  const catD = tao('g', { 'clip-path': `url(#${id}d)` }, P.dau!)
  H(catD, 'M60,-120Q120,-40 96,100H140V-120Z', 'longT')
  E(catD, -50, -66, 34, 14, 'longS', { transform: 'rotate(-20 -50 -66)', opacity: 0.8 })
  g('mat', P.dau!); g('mask', P.mat!)
  H(P.mask!, 'M-104,26C-106,-20 -78,-30 -50,-28C-28,-26 -12,-18 0,-2C12,-18 28,-26 50,-28C78,-30 106,-20 104,26C102,64 64,86 0,86C-64,86 -102,64 -104,26Z', 'kem')
  E(P.mask!, -44, -40, 9, 6, 'kem'); E(P.mask!, 44, -40, 9, 6, 'kem') // chấm lông mày kem
  vien(tao('path', { d: dauD, fill: 'none' }, P.dau!))
  const ma = [-1, 1].map((s) => E(P.mat!, s * 72, 40, 17, 10.5, 'ma'))
  const mats = [-1, 1].map((s) => {
    const mg = tao('g', null, P.mat!), ci = `${id}e${s + 1}`
    tao('circle', { r: 27 }, tao('clipPath', { id: ci }, defs))
    const tron = tao('g', null, mg)
    to(tao('circle', { r: 27 }, tron), 'den')
    const tr = tao('g', { 'clip-path': `url(#${ci})` }, tron), ng = tao('g', null, tr)
    to(tao('circle', { cx: 8, cy: -9, r: 9.5 }, ng), 'trang'); to(tao('circle', { cx: -10, cy: 9, r: 4 }, ng), 'trang')
    const miT = R(tr, -32, 0, 64, 80, 0, 'kem')
    const nham = net(tao('path', { d: 'M-18,0Q0,14 18,0' }, mg), 'den', 5)
    const cong = net(tao('path', { d: 'M-18,6Q0,-16 18,6' }, mg), 'den', 5.5)
    const xoan = net(tao('path', { d: s < 0 ? 'M-14,-10L14,0L-14,10' : 'M14,-10L-14,0L14,10' }, mg), 'den', 5.5)
    const may = net(tao('path', { d: 'M-14,0H14' }, P.mat!), 'vien', 6)
    return { mg, tron, ng, miT, nham, cong, xoan, may, s }
  })
  H(P.mat!, 'M-11,19Q0,14 11,19Q8,29 0,31Q-8,29 -11,19Z', 'den') // mũi
  const mq = tao('g', { transform: 'translate(0,44)' }, P.mat!)
  const mcp = tao('path', null, tao('clipPath', { id: id + 'm' }, defs))
  const mh = vien(H(mq, '', 'mieng'), 3.6)
  const luoi = E(tao('g', { 'clip-path': `url(#${id}m)` }, mq), 0, 0, 9, 6, 'luoi')
  // KÍNH BẢO HỘ: dải ngọc cong ôm trán (cắt theo đầu) + hai tròng + viên lục giác chàm
  // dải cắt theo đầu nằm NGOÀI nhóm kính (nhóm kính trượt theo góc nghiêng — vùng cắt phải đứng yên với đầu, không thì dải lòi ra ngoài)
  const daiK = tao('g', null, tao('g', { 'clip-path': `url(#${id}d)` }, P.dau!))
  g('kinh', P.dau!)
  vien(H(daiK, 'M-130,-34Q0,-118 130,-34V-14Q0,-98 -130,-14Z', 'ngoc'), 4)
  const trong = [-1, 1].map(() => {
    const k = tao('g', null, P.kinh!)
    vien(R(k, -31, -20, 62, 40, 16, 'ngoc'), 4.5)
    R(k, -23, -13, 46, 26, 11, 'ngocS'); H(k, 'M-16,-9H-4L-12,7H-20Z', 'trang', { opacity: 0.9 }); to(tao('circle', { cx: 10, cy: -7, r: 3, opacity: 0.8 }, k), 'trang')
    return k
  })
  vien(H(P.kinh!, 'M0,-80L10,-74V-62L0,-56L-10,-62V-74Z', 'lucGiac'), 3)
  g('lopTruoc', P.goc!)
  // HIỆU ỨNG (ngoài nhóm lật ⇒ chữ «?» / «z» không bị gương)
  g('hieu', svg)
  const sao = ([[-150, -250, 1.2], [140, -280, 0.9], [-120, -320, 0.8], [152, -190, 0.8]] as const).map(([x, y, s]) => { const e = H(P.hieu!, 'M0,-12Q2,-2 12,0Q2,2 0,12Q-2,2 -12,0Q-2,-2 0,-12Z', 'sao'); e.style.display = 'none'; return { e, x, y, s } })
  const nhay = tao('g', null, P.hieu!); nhay.style.display = 'none'
  net(tao('path', { d: 'M120,-276L134,-300M138,-262L162,-276' }, nhay), 'hong', 6)
  const hoi = tao('g', null, P.hieu!); hoi.style.display = 'none'
  net(tao('path', { d: 'M104,-296Q104,-312 120,-312Q136,-312 136,-298Q136,-288 121,-282V-272' }, hoi), 'lucGiac', 7); to(tao('circle', { cx: 121, cy: -258, r: 4.6 }, hoi), 'lucGiac')
  const khoi = tao('g', null, P.hieu!); khoi.style.display = 'none'
  for (const s of [-1, 1]) { const k = tao('g', { transform: `translate(${s * 120},-300)` }, khoi); for (const [x, y, r] of [[0, 0, 16], [14, -8, 12], [-12, -8, 11], [4, -18, 11]] as const) to(tao('circle', { cx: x, cy: y, r }, k), 'khoi') }
  const lam = tao('g', null, P.hieu!); lam.style.display = 'none'
  net(tao('path', { d: 'M140,-240Q156,-226 146,-208M154,-252Q176,-228 162,-200' }, lam), 'hong', 5)
  const giot = vien(H(P.hieu!, 'M108,-250Q120,-228 108,-218Q96,-228 108,-250Z', 'giot'), 3); giot.style.display = 'none'
  const zzz = tao('g', null, P.hieu!); zzz.style.display = 'none'
  const zs = ([[96, -250, 18], [120, -280, 24], [148, -316, 30]] as const).map(([x, y, s]) => { const t = to(tao('text', { x, y, 'font-size': s, 'font-weight': 900 }, zzz), 'longT'); t.textContent = 'z'; return t })
  noiGan.appendChild(svg)

  // ── khung xương lò xo ──
  const v: So = { ...CHUAN }, van: So = {}, dich: So = { ...CHUAN }
  for (const k in v) van[k] = 0
  let roi: Record<string, string | number> = { ...ROI }, cx: TrangThaiVe = CAM_XUC_LUA.yen, iK = 0, tK = 0, kK = 170, gd: 'seq' | 'loop' | 'xong' = 'loop'
  let t = 0, nhayMat = 0, hen = 2000 + Math.random() * 2000, tSao = -1e9, tGiot = -1e9, noiDen = 0, ten: TrangThaiLua = 'yen', truocChoc: TrangThaiLua = 'yen', henVe = 0, ve2: TrangThaiLua | null = null
  const phu = { x: 0, v: 0 }
  let truoc = { rot: 0, y: 0, hr: 0 }
  const SHO = (s: number): [number, number] => [s * 74, -98]
  function ap(f: Khung) {
    const tt = A(cx.base ?? {}, f.p ?? {})
    for (const k in CHUAN) { const x = tt[k]; dich[k] = typeof x === 'number' ? x : CHUAN[k]! }
    dich.q! += qGoc
    for (const [s, T] of [[-1, 'T'], [1, 'P']] as const) {
      const di = tt['i' + T] as number[] | null | undefined
      if (!di) continue
      const [Sx, Sy] = SHO(s), X = s * (di[0]! - Sx), Y = di[1]! - Sy, a = rad(dich['a' + T]!), Ex = 24 * Math.sin(a), Ey = 24 * Math.cos(a)
      dich['b' + T] = (Math.atan2(X - Ex, Y - Ey) * 180) / Math.PI
      dich['d' + T] = Math.max(0.5, Math.min(2.2, Math.hypot(X - Ex, Y - Ey) / 22))
    }
    const r: Record<string, string | number> = {}
    for (const k in ROI) { const x = tt[k]; r[k] = x == null ? ROI[k]! : (x as string | number) }
    if (r.hieu === 'sao' && !mayYeu()) tSao = t
    if (r.hieu === 'giot' && !mayYeu()) tGiot = t
    for (const [i, kk] of [[0, 'zT'], [1, 'zP']] as const) { const ty = tay[i]!; if (r[kk] && !ty.z) { P.lopTruoc!.appendChild(ty.tg); ty.z = 1 } else if (!r[kk] && ty.z) { P.lopSau!.appendChild(ty.tg); ty.z = 0 } }
    roi = r; kK = f.k ?? 170
  }
  function batDau(tm: TrangThaiLua, o: TuyChonLua = {}) {
    ten = CAM_XUC_LUA[tm] ? tm : 'yen'; cx = CAM_XUC_LUA[ten]; iK = 0; tK = 0
    if (!['vui', 'combo', 'choc'].includes(ten)) tSao = -1e9
    if (ten !== 'buon') tGiot = -1e9
    let seq = cx.seq
    if (o.em && seq) seq = seq.filter((k) => !(k.p && (k.p.y as number) > 0)) // êm: bỏ nhịp nén lấy đà
    gd = seq?.length ? 'seq' : 'loop'
    cx = { ...cx, seq }
    const ds = gd === 'seq' ? cx.seq! : cx.loop
    if (ds?.length) ap(ds[0]!); else { ap({ d: 0, p: {} }); gd = 'xong' }
    ve2 = o.ve ?? null; henVe = o.sau != null ? t + o.sau : 0
    if (tinh) { for (const k in dich) { v[k] = dich[k]!; van[k] = 0 } ve() }
  }
  function tich(dt: number) {
    t += dt * 1000
    if (gd !== 'xong') {
      tK += dt * 1000
      const ds = gd === 'seq' ? cx.seq! : cx.loop!
      if (tK >= ds[iK]!.d) {
        tK = 0; iK++
        if (iK >= ds.length) {
          iK = 0
          if (gd === 'seq') {
            if (ten === 'choc') { batDau(truocChoc, { em: true }); return }
            gd = cx.loop?.length ? 'loop' : 'xong'
          }
        }
        if (gd !== 'xong') ap((gd === 'seq' ? cx.seq! : cx.loop!)[iK]!)
      }
    }
    if (henVe && t >= henVe && ve2) { const x = ve2; henVe = 0; ve2 = null; batDau(x, { em: true }) }
    for (const k in v) { const mk = MK.has(k), K = mk ? Math.max(kK, 380) : kK, z = mk ? 0.85 : 0.6; van[k]! += (K * (dich[k]! - v[k]!) - 2 * Math.sqrt(K) * z * van[k]!) * dt; v[k]! += van[k]! * dt }
    const dv = ((v.rot! - truoc.rot) * 0.06 + (v.hr! - truoc.hr) * 0.06 + (v.y! - truoc.y) * 0.05) / dt
    truoc = { rot: v.rot!, y: v.y!, hr: v.hr! }
    const dp = Math.max(-18, Math.min(18, -dv * 0.9))
    phu.v += (70 * (dp - phu.x) - 2 * Math.sqrt(70) * 0.25 * phu.v) * dt; phu.x += phu.v * dt
    hen -= dt * 1000
    if (hen <= 0) { nhayMat = 1; hen = 2400 + Math.random() * 2600 }
    if (nhayMat > 0) nhayMat = Math.max(0, nhayMat - (dt * 1000) / 150)
  }
  const cu = new WeakMap<Element, Record<string, string>>()
  const dat = (e: Element, k: string, val: string) => { let m = cu.get(e); if (!m) cu.set(e, (m = {})); if (m[k] !== val) { m[k] = val; if (k === 'display') (e as SVGElement).style.display = val; else e.setAttribute(k, val) } }
  const tf = (e: Element, s: string) => dat(e, 'transform', s)
  function ve() {
    const th = tinh ? 0 : Math.sin((t / 2400) * Math.PI * 2) * v.tho! * 0.018
    const sq = v.sq! * (1 + th * 0.5), sx = 1 + (1 - sq) * 0.6, q = v.q!, aq = Math.abs(q)
    tf(P.goc!, `translate(${f1(v.x!)},${f1(v.y!)}) rotate(${f1(v.rot!)}) scale(${f1(sx * 1000) / 1000},${f1(sq * 1000) / 1000})`)
    dat(bong, 'rx', String(f1(92 * (1 + Math.min(0, v.y!) / 120)))); dat(bong, 'opacity', String(f1(1 + Math.min(0, v.y!) / 90)))
    for (const { c, s } of chan) tf(c, `translate(${f1(s * 40 + q * 10)},0)`)
    tf(P.duoi!, `translate(${f1(-q * 36)},0) rotate(${f1(phu.x * 0.7 + v.rot! * 0.5)} -60 -40)`)
    tf(P.than!, `translate(${f1(q * 8)},0) scale(${f1(1 - 0.08 * aq)},1)`)
    tf(P.ao!, `translate(${f1(q * 18)},0)`)
    tf(P.dau!, `translate(${f1(q * 12)},${f1(DAU_Y + v.hy! - th * 120)}) rotate(${f1(v.hr!)})`)
    tai.forEach((e, i) => {
      const s = i ? 1 : -1, xa = Math.max(0, s * q)
      tf(e, `translate(${f1(s * 62 - q * 18 - s * xa * 22)},-92) rotate(${f1(s * 20 + s * v.tai! + phu.x * (i ? 1 : 0.8))}) scale(${f1(s * 1.12 * (1 - 0.35 * xa))},1.12)`)
    })
    tf(P.lua!, `translate(${f1(q * 20)},-88) rotate(${f1(phu.x * 1.2)}) scale(${f1(0.9 + 0.1 * v.lua!)},${f1(v.lua!)})`)
    tf(P.mat!, `translate(${f1(q * 32)},0)`)
    tf(P.mask!, `scale(${f1(1 - 0.15 * aq)},1)`)
    tf(P.kinh!, `translate(${f1(q * 26)},0)`); tf(daiK, `translate(${f1(q * 22)},0)`)
    trong.forEach((k, i) => { const s = i ? 1 : -1, xa = Math.max(0, s * q); tf(k, `translate(${f1(s * 44 * (1 - 0.3 * xa))},-62) rotate(${s * 13}) scale(${f1(0.9 * (1 - 0.35 * xa))},0.9)`) })
    const ns = Math.sin(nhayMat * Math.PI)
    for (const e of mats) {
      const s = e.s, md = roi.mat, xa = Math.max(0, s * q), x0 = s * 46 * (1 - 0.25 * xa)
      tf(e.mg, `translate(${f1(x0)},8) scale(${f1(v.es! * (1 - 0.3 * xa) * 100) / 100},${f1(v.es! * 100) / 100})`)
      const lt = Math.min(1, Math.max(s < 0 ? v.lt! : v.ltP!, tinh ? 0 : ns)), thuong = md === 'mo'
      dat(e.tron, 'display', thuong && lt <= 0.92 ? '' : 'none')
      dat(e.cong, 'display', md === 'cong' ? '' : 'none')
      dat(e.xoan, 'display', md === 'xoan' ? '' : 'none')
      dat(e.nham, 'display', md === 'nham' || (thuong && lt > 0.92) ? '' : 'none')
      tf(e.ng, `translate(${f1(v.px! * 6)},${f1(v.py! * 5)})`)
      const yb = -27 + lt * 54
      dat(e.miT, 'y', String(f1(yb - 80))); tf(e.miT, `rotate(${f1(-s * v.la!)} 0 ${f1(yb)})`)
      dat(e.may, 'display', v.may! > 0.3 ? '' : 'none')
      tf(e.may, `translate(${f1(x0)},${f1(-28 + (1 - v.may!) * 6)}) rotate(${f1(-s * v.ba!)})`)
    }
    for (const m of ma) dat(m, 'opacity', String(f1(Math.min(1, v.ma!))))
    // miệng — mấp máy khi đang nói
    const dangNoi = t < noiDen, nhip = dangNoi ? Math.floor(t / 90) % 3 : 0
    const w = 13 + v.mw! - (dangNoi ? 2 : 0), yl = -v.mc! + v.mk!, yr = -v.mc! - v.mk!, ym = (yl + yr) / 2
    const mt = ym + v.mt! - (dangNoi ? 1 : 0), mb = Math.max(mt, ym + v.mb! + (dangNoi ? [6, 1, 4][nhip]! - 4 : 0))
    const d = `M${f1(-w)},${f1(yl)}Q0,${f1(mt * 2 - ym)} ${f1(w)},${f1(yr)}Q0,${f1(mb * 2 - ym)} ${f1(-w)},${f1(yl)}Z`
    dat(mh, 'd', d); dat(mcp, 'd', d)
    dat(luoi, 'cy', String(f1(mb + 3))); dat(luoi, 'rx', String(f1(Math.max(4, w * 0.6))))
    for (const ty of tay) {
      const s = ty.s, T = s < 0 ? 'T' : 'P', [Sx0, Sy] = SHO(s), Sx = Sx0 + q * 8 - (s * q > 0 ? s * q * 16 : 0), a = rad(v['a' + T]!), b = rad(v['b' + T]!), dd = v['d' + T]!
      const Ex = Sx + s * 24 * Math.sin(a), Ey = Sy + 24 * Math.cos(a), Hx = Ex + s * 22 * dd * Math.sin(b), Hy = Ey + 22 * dd * Math.cos(b)
      dat(ty.ongT, 'd', ongTay(Sx, Sy, Ex, Ey, Hx, Hy, 30, 27, 25))
      tf(ty.ban, `translate(${f1(Hx)},${f1(Hy)}) scale(${s},1) rotate(${f1(-v['b' + T]!)})`)
      const kh = String(roi['h' + T])
      if (ty.kh !== kh) { for (const n in ty.kieu) ty.kieu[n]!.style.display = n === kh ? '' : 'none'; ty.kh = kh }
    }
    for (const [i, sv] of sao.entries()) {
      const e = t - tSao - i * 110, k = e < 0 || e > 1500 ? -1 : (e % 750) / 750
      if (k < 0) { dat(sv.e, 'display', 'none'); continue }
      const sc = (k < 0.4 ? (k / 0.4) * 1.3 : 1.3 * (1 - (k - 0.4) / 0.6)) * sv.s
      dat(sv.e, 'display', ''); tf(sv.e, `translate(${sv.x},${sv.y}) rotate(${f1(k * 90)}) scale(${f1(sc * 100) / 100})`)
    }
    const hien = (e: SVGElement, ok: boolean, s?: string) => { dat(e, 'display', ok ? '' : 'none'); if (ok && s) tf(e, tinh ? '' : s) }
    const nh = (t % 600) / 600, kk = (t / 900) % 1
    hien(nhay, roi.hieu === 'nhay', `translate(${f1(Math.sin(nh * Math.PI) * 4)},${f1(-Math.sin(nh * Math.PI) * 4)})`)
    hien(hoi, roi.hieu === 'hoi', `translate(0,${f1(Math.sin(t / 300) * 4)})`)
    hien(khoi, roi.hieu === 'khoi', `translate(0,${f1(-kk * 14)}) scale(${f1(0.85 + kk * 0.3)})`)
    hien(lam, roi.hieu === 'lam', `translate(${f1(Math.sin(t / 120) * 3)},0)`)
    const kg = t - tGiot - 120
    dat(giot, 'display', kg < 0 || kg > 1600 ? 'none' : '')
    if (kg >= 0 && kg <= 1600) { tf(giot, `translate(0,${f1(kg / 100)})`); dat(giot, 'opacity', String(f1(kg < 200 ? kg / 200 : kg > 1200 ? (1600 - kg) / 400 : 1))) }
    dat(zzz, 'display', roi.hieu === 'zzz' ? '' : 'none')
    if (roi.hieu === 'zzz') zs.forEach((z, i) => { const k = (t / 1800 + i / 3) % 1; dat(z, 'opacity', String(f1(tinh ? 1 : k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8))); tf(z, `translate(${f1(tinh ? 0 : k * 10)},${f1(tinh ? 0 : -k * 16)})`) })
  }
  function ongTay(Sx: number, Sy: number, Ex: number, Ey: number, Hx: number, Hy: number, w1: number, w2: number, w3: number): string {
    const L1 = Math.hypot(Ex - Sx, Ey - Sy) || 1, L2 = Math.hypot(Hx - Ex, Hy - Ey) || 1
    const u1 = [(Ex - Sx) / L1, (Ey - Sy) / L1] as const, u2 = [(Hx - Ex) / L2, (Hy - Ey) / L2] as const, n1 = [-u1[1], u1[0]] as const, n2 = [-u2[1], u2[0]] as const
    const r = Math.min(7, L1 * 0.45, L2 * 0.45), mi = 1 / Math.max(0.45, 1 + n1[0] * n2[0] + n1[1] * n2[1])
    const ben = (k: number) => ({ a: [Sx + k * n1[0] * w1 / 2, Sy + k * n1[1] * w1 / 2], p1: [Ex + k * n1[0] * w2 / 2 - u1[0] * r, Ey + k * n1[1] * w2 / 2 - u1[1] * r], c: [Ex + k * (n1[0] + n2[0]) * mi * w2 / 2, Ey + k * (n1[1] + n2[1]) * mi * w2 / 2], p2: [Ex + k * n2[0] * w2 / 2 + u2[0] * r, Ey + k * n2[1] * w2 / 2 + u2[1] * r], b: [Hx + k * n2[0] * w3 / 2, Hy + k * n2[1] * w3 / 2] })
    const A1 = ben(1), B1 = ben(-1), Q = (p: number[]) => `${f1(p[0]!)},${f1(p[1]!)}`
    const goc = [Sx - u1[0] * w1 / 2, Sy - u1[1] * w1 / 2]
    return `M${Q(A1.a)}L${Q(A1.p1)}Q${Q(A1.c)} ${Q(A1.p2)}L${Q(A1.b)}L${Q(B1.b)}L${Q(B1.p2)}Q${Q(B1.c)} ${Q(B1.p1)}L${Q(B1.a)}Q${Q([B1.a[0]! - u1[0] * w1 / 2, B1.a[1]! - u1[1] * w1 / 2])} ${Q(goc)}Q${Q([A1.a[0]! - u1[0] * w1 / 2, A1.a[1]! - u1[1] * w1 / 2])} ${Q(A1.a)}Z`
  }

  const song: Song = { tich, ve, hien: true, svg }
  let quan: IntersectionObserver | null = null
  if (!tinh && !tc.tay) {
    dangSong.add(song)
    if (typeof IntersectionObserver !== 'undefined') { quan = new IntersectionObserver((ds) => { song.hien = ds.some((x) => x.isIntersecting); if (song.hien) chay() }); quan.observe(svg) }
  }
  const choc = () => { if (tinh || ten === 'choc') return; truocChoc = ten; batDau('choc'); chay() }
  if (!tinh) svg.addEventListener('pointerdown', choc)
  batDau(tc.trangThai ?? 'yen', { ...tc.tuyChon, em: true })
  for (const k in dich) { v[k] = dich[k]!; van[k] = 0 }
  ve()
  chay()
  const lua: Lua = {
    svg,
    get trangThai() { return ten },
    datTrangThai(x, o) { batDau(x, o); chay() },
    noi(chuNoi, ms = 40) { if (!tinh) noiDen = t + chuNoi.length * ms + 60 },
    cham: choc,
    buoc(ms) { let c = ms; while (c > 0) { const dt = Math.min(c, 8); tich(dt / 1000); c -= dt } ve() },
    huy() { dangSong.delete(song); LUA_DANG_SONG.delete(lua); quan?.disconnect(); svg.removeEventListener('pointerdown', choc); svg.remove() },
  }
  LUA_DANG_SONG.add(lua)
  return lua
}
