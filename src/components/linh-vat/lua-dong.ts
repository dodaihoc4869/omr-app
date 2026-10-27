// LINH VẬT «LỬA» CHUYỂN ĐỘNG (thầy chốt 27/10 «Chọn Lửa build luôn nhé»): chó shiba khoác blouse trắng viền chàm, kính bảo hộ trên trán,
// ống nghiệm hồng trong túi, thẻ ĐĐH. Bản vẽ duyệt: ve-moi/linh-vat-moi/v3 (cùng họ phong cách 4 giám thị người). Mảnh NẠP LƯỜI: chỉ Bi.tsx gọi import('./lua-dong').
// Khung xương LÒ XO như giám thị: mọi tham số (dáng, tay, tai, mặt, miệng) nội suy từ giá trị đang có ⇒ đổi cảm xúc không nhảy cóc, có lấy đà và quá đà;
// tai + đuôi trễ một nhịp theo đà thân. Thân đầu liền khối, chân tay mập ngắn theo tỉ lệ cú Duo; mắt to hai điểm sáng; bóng hai tầng phẳng.
// MỘT vòng rAF chung cho mọi Lửa trên màn; Lửa ra khỏi khung nhìn / tab ẩn ⇒ không tính, không vẽ. Máy yếu ⇒ 30 khung/s, bỏ lấp lánh.
// Không màu thô: mọi màu là biến --lv-* (styles/lua.css) pha từ token bảng «Chất chỉ thị». Lông cam đất riêng, tách khỏi cam «chú ý / lửa chuỗi».
export type TrangThaiLua = 'yen' | 'cuoi' | 'chao' | 'vui' | 'combo' | 'buon' | 'ngac' | 'nghi' | 'covu' | 'ngu' | 'choc'
export const TRANG_THAI_LUA: readonly TrangThaiLua[] = ['yen', 'cuoi', 'chao', 'vui', 'combo', 'buon', 'ngac', 'nghi', 'covu', 'ngu', 'choc']
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
const M = (k: string) => `var(--lv-${k})`
function tao(tag: string, tt: Record<string, string | number> | null, cha?: Element | null): SVGElement {
  const e = document.createElementNS(NS, tag) as SVGElement
  if (tt) for (const k in tt) e.setAttribute(k, String(tt[k]))
  if (cha) cha.appendChild(e)
  return e
}
const to = (e: SVGElement, mau: string) => { e.style.fill = M(mau); return e }
const vien = (e: SVGElement, mau: string, w: number) => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.style.paintOrder = 'stroke'; e.setAttribute('stroke-linejoin', 'round'); return e }
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

// Hình: gốc = mặt đất giữa hai chân, y hướng xuống. Thân liền đầu (tỉ lệ cú Duo: cao/rộng ≈ 1,05 cho thân shiba tròn), mắt 0,25 bề ngang.
const W = 176, HH = 184, EY = -104, EX = 38, ERX = 22.5, ERY = 26.5, PR = 11.5, MY = -64
export const VIEWBOX = '-120 -238 240 276' // tỉ lệ 240 : 276 = 200 : 230 như Bi cũ ⇒ mọi khung chứa giữ nguyên

// ─────────── TƯ THẾ / CẢM XÚC ───────────
const CHUAN: So = { x: 0, y: 0, rot: 0, sq: 1, hr: 0, fx: 0, fy: 0, tai: 0, aT: 24, bT: 14, aP: 24, bP: 14, dT: 1, dP: 1, px: 0.1, py: 0.1, lt: 0, ltP: 0, lb: 0, la: 0, es: 1, by: 0, ba: 0, mw: 0, mc: 4, mt: 2.5, mb: 2.5, mk: 0, ma: 0.55, tho: 1 }
const ROI: Record<string, string | number> = { mat: 'mo', hT: 'nam', hP: 'nam', zT: 0, zP: 0, hieu: '' }
const MK = new Set(['px', 'py', 'lt', 'ltP', 'lb', 'la', 'es', 'by', 'ba', 'mw', 'mc', 'mt', 'mb', 'mk', 'ma'])
const A = (...d: TT[]): TT => Object.assign({}, ...d)
export const CAM_XUC_LUA: Record<TrangThaiLua, TrangThaiVe> = {
  yen: { base: {}, loop: [{ d: 1700, k: 22, p: { rot: -1.5, fx: -0.1 } }, { d: 1700, k: 22, p: { rot: 1.5, fx: 0.15 } }] },
  cuoi: { base: { mw: 3, mc: 6, mt: 1, mb: 5, ma: 0.9, tai: -4 }, loop: [{ d: 1700, k: 22, p: { rot: -1.5 } }, { d: 1700, k: 22, p: { rot: 1.5 } }] },
  chao: { base: { aP: 128, bP: 160, hP: 'xoe', zP: 1, mw: 3, mc: 6, mt: 1, mb: 6, ma: 0.9, rot: -3, fx: 0.15, px: 0.15, py: 0.15, tai: -4 }, loop: [{ d: 300, k: 260, p: { bP: 128 } }, { d: 300, k: 260, p: { bP: 168 } }] },
  vui: {
    base: { mat: 'cong', mw: 7, mc: 6, mt: -1, mb: 13, ma: 1, aP: 120, bP: 150, hP: 'xoe', zP: 1, tai: -6 },
    seq: [{ d: 80, k: 520, p: { y: 6, sq: 0.84, aP: 30, bP: 20 } }, { d: 260, k: 260, p: { y: -24, sq: 1.1, hieu: 'sao' } }, { d: 160, k: 320, p: { sq: 0.92 } }],
    loop: [{ d: 260, k: 300, p: { y: -10, sq: 1.05, bP: 120 } }, { d: 260, k: 300, p: { y: 0, sq: 0.95, bP: 165 } }],
  },
  combo: {
    base: { mat: 'cong', mw: 9, mc: 6, mt: -2, mb: 17, ma: 1.2, aT: 125, bT: 150, aP: 125, bP: 150, hT: 'xoe', hP: 'xoe', zT: 1, zP: 1, tai: -12 },
    seq: [{ d: 80, k: 560, p: { y: 8, sq: 0.8, aT: 30, bT: 20, aP: 30, bP: 20, mat: 'mo', es: 1.12, mt: -3, mb: 8 } }, { d: 300, k: 240, p: { y: -40, sq: 1.14, hieu: 'sao' } }, { d: 170, k: 320, p: { sq: 0.86 } }, { d: 300, k: 240, p: { y: -28, sq: 1.1, rot: 8 } }, { d: 170, k: 320, p: { sq: 0.88 } }],
    loop: [{ d: 280, k: 260, p: { y: -16, sq: 1.08, rot: -6, aT: 110, aP: 140 } }, { d: 280, k: 260, p: { y: 0, sq: 0.92, rot: 6, aT: 140, aP: 110 } }],
  },
  buon: {
    base: { lt: 0.42, la: -14, ba: -14, by: -2, mw: -1, mc: -6, mt: -3, mb: 1.5, py: 0.6, px: 0, ma: 0.3, sq: 0.9, tai: 34, aT: 4, bT: 0, aP: 4, bP: 0, hr: 3, fy: 4 },
    seq: [{ d: 110, k: 440, p: { y: -6, sq: 1.08, es: 1.15, by: -8, mt: -3, mb: 7, mc: 0, tai: -8, hieu: 'giot' } }],
    loop: [{ d: 1200, k: 50, p: {} }, { d: 1000, k: 40, p: { sq: 0.87, hr: 5, fy: 5 } }],
  },
  ngac: {
    base: { es: 1.16, by: -9, mw: -4, mc: 0, mt: -4, mb: 10, aT: 20, iT: [-34, -78], aP: 20, iP: [34, -78], hT: 'xoe', hP: 'xoe', zT: 1, zP: 1, tai: -14, ma: 0.9, y: -4 },
    seq: [{ d: 90, k: 520, p: { y: 4, sq: 0.86 } }, { d: 200, k: 300, p: { y: -14, sq: 1.1 } }],
    loop: [{ d: 600, k: 200, p: {} }, { d: 600, k: 200, p: { y: -2 } }],
  },
  nghi: {
    base: { aP: 30, iP: [14, -56], hP: 'nam', zP: 1, px: -0.6, py: -0.8, lt: 0.18, ba: 4, by: -2, mw: -3, mc: 1, mt: 0.6, mb: 0.6, mk: 2.4, rot: -4, hr: -6, fx: -0.25, hieu: 'hoi', tai: 6 },
    loop: [{ d: 800, k: 120, p: {} }, { d: 300, k: 300, p: { iP: [14, -60] } }, { d: 300, k: 300, p: {} }],
  },
  covu: {
    base: { lt: 1, ltP: 0, mw: 5, mc: 6, mt: 1, mb: 9, ma: 1, aP: 110, bP: 168, hP: 'nam', zP: 1, aT: 20, iT: [-14, -40], hT: 'nam', rot: 5, fx: 0.3, tai: -6 },
    seq: [{ d: 90, k: 500, p: { y: 4, sq: 0.88, aP: 40, bP: 40 } }],
    loop: [{ d: 220, k: 420, p: { bP: 150, aP: 96, y: -4 } }, { d: 220, k: 420, p: { y: 0 } }, { d: 1200, k: 200, p: {} }],
  },
  ngu: { base: { mat: 'nham', mw: -3, mc: 1, mt: 1.5, mb: 3.5, hr: 9, rot: 4, fy: 3, tai: 22, sq: 0.95, hieu: 'zzz', aT: 8, bT: -40, aP: 8, bP: -40, ma: 0.7 }, loop: [{ d: 1500, k: 30, p: { sq: 0.93 } }, { d: 1500, k: 30, p: { sq: 0.97 } }] },
  choc: { // bị chạm: nảy lên, mắt nhắm tịt, cười khúc khích
    seq: [{ d: 90, k: 520, p: { y: 5, sq: 0.82 } }, { d: 340, k: 300, p: { y: -16, sq: 1.12, aT: 120, bT: 150, aP: 120, bP: 150, zT: 1, zP: 1, hT: 'xoe', hP: 'xoe', mat: 'xoan', mw: 3, mc: 2, mt: -2, mb: 10, mk: 3, hr: -8, ma: 1.4, tai: -14 } },
      { d: 520, k: 240, p: { hr: 6, mat: 'cong', mw: 4, mc: 6, mt: 0, mb: 8, ma: 1.2 } }],
  },
}

// NHƯỜNG KHUNG CHO LƯỢT CHẠM (27/10 MƯỢT, đo scripts/do-muot-hs.mjs): một khung linh vật vẽ lại vài chục hình SVG (~6–10 ms ở CPU ×4) — chen đúng giữa
// lượt chạm và lần vẽ phản hồi (nút lún, ô được chọn) là phản hồi chậm thêm một khung. Có pointerdown / keydown ⇒ linh vật nghỉ 140 ms (đồng hồ lò xo
// vẫn tính, chạy tiếp mượt). Viết tại chỗ (không tệp chung) để không sinh thêm mảnh precache.
let nhuongDen = 0
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const chamNhuong = () => { nhuongDen = performance.now() + 140 }
  window.addEventListener('pointerdown', chamNhuong, { capture: true, passive: true })
  window.addEventListener('keydown', chamNhuong, { capture: true, passive: true })
}
const dangNhuongKhung = (now: number): boolean => now < nhuongDen
// ─────────── MỘT VÒNG rAF CHUNG ───────────
// 27/10 MƯỢT (scripts/do-muot-hs.mjs): vòng chỉ chạy khi CÓ Lửa đang được nhìn thấy — Lửa ngoài khung nhìn (IntersectionObserver) hoặc nằm dưới
// màn con che kín (Lộ trình `inert` khi đang làm chặng, <html class="sanh-bi-che">) ⇒ không tính, không vẽ, và KHÔNG xin khung nữa (trước: vòng
// rAF 60 lượt/giây chạy suốt, kể cả khi mọi Lửa đều khuất). Lửa hiện lại (IO / lớp che gỡ) ⇒ chạy tiếp đúng tư thế cũ.
type Song = { tich(dt: number): void; ve(): void; hien: boolean; svg: SVGSVGElement }
const dangSong = new Set<Song>()
let raf = 0, lan = 0, tichLuy = 0
const mayYeu = () => document.documentElement.classList.contains('may-yeu')
/** Lửa này đang nằm dưới một màn con che kín (Lộ trình bị `inert` khi màn làm chặng / màn con mở đè). */
const biChe = (s: Song) => document.documentElement.classList.contains('sanh-bi-che') && !!s.svg.closest('[inert]')
const dangThay = () => [...dangSong].filter((s) => s.hien && !biChe(s))
function lap(now: number) {
  raf = 0
  if (document.hidden || !dangSong.size) { lan = 0; return }
  const ds = dangThay()
  if (!ds.length) { lan = 0; return } // không Lửa nào đang thấy ⇒ ngủ; IO / lớp che đổi sẽ gọi `chay`
  if (dangNhuongKhung(now)) { raf = requestAnimationFrame(lap); return } // em vừa chạm: nhường khung cho phản hồi nút
  const dtms = lan ? Math.min(100, now - lan) : 16
  lan = now; tichLuy += dtms
  // 28/10 MƯỢT: ~30 khung/s trên mọi máy (như giám thị — nửa số khung rảnh hẳn cho chạm); máy yếu: vẽ MỘT khung rồi ngủ (Lửa đứng yên, điều phối
  // vòng 4: «Lửa dừng rAF ở chế độ yếu»), IO / lớp che / tab hiện lại gọi `chay` thì vẽ lại một khung.
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
  // Màn con đóng (gỡ lớp `sanh-bi-che` trên <html>) ⇒ Lửa của Lộ trình chạy lại. Chỉ theo dõi thuộc tính class của <html> (rẻ).
  if (typeof MutationObserver !== 'undefined') new MutationObserver(chay).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

/** Các Lửa đang sống (bộ chụp / máy quay video bản build điều khiển trạng thái qua đây). */
export const LUA_DANG_SONG = new Set<Lua>()
let soId = 0
export function taoLua(noiGan: HTMLElement, tc: { trangThai?: TrangThaiLua; tuyChon?: TuyChonLua; tinh?: boolean; tay?: boolean } = {}): Lua {
  const id = 'lua' + ++soId, tinh = !!tc.tinh
  const svg = tao('svg', { viewBox: VIEWBOX, class: 'lua-svg', 'aria-hidden': 'true', focusable: 'false' }, null) as SVGSVGElement
  const defs = tao('defs', null, svg)
  const P: Record<string, SVGElement> = {}
  const g = (k: string, c: Element) => (P[k] = tao('g', null, c))
  const bong = E(svg, 0, 4, W * 0.46, 9, 'bong')
  g('goc', svg); g('duoi', P.goc!)
  const chan = [-1, 1].map((s) => { const c = tao('g', null, P.goc!); vien(E(c, 0, 0, W * 0.085, 9, 'kem'), 'tayV', 2.2); return { c, s } })
  g('than', P.goc!); g('tai', P.than!)
  // tai tam giác dựng, lòng kem
  const taiGoc: [number, number, number][] = [[-W * 0.27, -HH + 8, -16], [W * 0.27, -HH + 8, 16]]
  const tai = [-1, 1].map(() => { const t = tao('g', null, P.tai!); H(t, [[-22, 6, 8], [22, 6, 8], [6, -40, 7]], 'long'); H(t, [[-12, 2, 5], [12, 2, 5], [4, -26, 5]], 'tai'); return t })
  // đuôi xoăn sau lưng
  const du = tao('g', { transform: `translate(${W * 0.4},-62)` }, P.duoi!)
  to(tao('circle', { cx: 18, cy: -22, r: 24 }, du), 'long'); to(tao('circle', { cx: 16, cy: -24, r: 13 }, du), 'kem'); to(tao('circle', { cx: 20, cy: -20, r: 6 }, du), 'long')
  // thân + bóng 2 tầng (mảng tối phải-dưới, mảng sáng trên-trái), cắt theo thân
  const thanD = dg([[-W * 0.32, -HH, 50], [W * 0.32, -HH, 50], [W * 0.5, -HH * 0.55, 60], [W * 0.45, -4, 42], [-W * 0.45, -4, 42], [-W * 0.5, -HH * 0.55, 60]])
  vien(H(P.than!, thanD, 'long'), 'longT', 3.4) // viền tông đậm mảnh: tách thân khỏi nền cam (thẻ chuỗi ngày)
  H(tao('clipPath', { id: id + 't' }, defs), thanD, 'long')
  const cat = tao('g', { 'clip-path': `url(#${id}t)` }, P.than!)
  H(cat, `M${W * 0.5},${-HH * 1.1}Q${W * 0.3},${-HH * 0.5} ${W * 0.22},0H${W}V${-HH * 1.1}Z`, 'longT')
  E(cat, -W * 0.28, -HH * 0.86, W * 0.16, HH * 0.07, 'longS', { transform: `rotate(-18 ${-W * 0.28} ${-HH * 0.86})` })
  // má trắng (urajiro) + mõm kem
  H(cat, 'M-74,-96Q-60,-110 -42,-100Q-20,-88 0,-86Q20,-88 42,-100Q60,-110 74,-96Q80,-52 40,-42Q20,-38 0,-40Q-20,-38 -40,-42Q-80,-52 -74,-96Z', 'kem')
  // ÁO BLOUSE: cổ chữ V, viền chàm, khuy, túi + ống nghiệm hồng, thẻ ĐĐH
  const ao = tao('g', null, cat), yc = MY + 14, yv = yc + 34
  const coAo = `M${-W},${yc - 10}Q${-W * 0.3},${yc - 8} ${-W * 0.15},${yc}L0,${yv}L${W * 0.15},${yc}Q${W * 0.3},${yc - 8} ${W},${yc - 10}`
  H(ao, coAo + `V40H${-W}Z`, 'trang')
  H(ao, `M${W * 0.5},${-HH * 0.6}Q${W * 0.3},${-HH * 0.3} ${W * 0.24},0H${W}Z`, 'aoT')
  net(tao('path', { d: coAo }, ao), 'cham', 4.5)
  net(tao('path', { d: `M0,${yv}V2`, opacity: 0.5 }, ao), 'cham', 2.5)
  E(ao, -7, yv + 16, 3.4, 3.4, 'cham'); E(ao, -7, yv + 36, 3.4, 3.4, 'cham')
  const tui = tao('g', { transform: `translate(${-W * 0.28},${yc + 24})` }, ao), ong = tao('g', { transform: 'rotate(-8)' }, tui)
  vien(R(ong, -7, -30, 14, 38, 7, 'thuyTinh'), 'thuyTinhV', 2.2)
  H(ong, 'M-5.5,-14H5.5V1A5.5,5.5 0 0 1 -5.5,1Z', 'hong'); R(ong, -3.5, -26, 2.6, 10, 1.3, 'trang')
  vien(R(tui, -16, -4, 32, 18, 6, 'trang'), 'cham', 3).style.paintOrder = 'normal'
  const the = tao('g', { transform: `translate(${W * 0.27},${yc + 20})` }, ao)
  R(the, -17, -9, 34, 18, 5, 'cham')
  const chu = to(tao('text', { x: 0, y: 4.6, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 900, 'letter-spacing': '0.3' }, the), 'trang'); chu.textContent = 'ĐĐH'
  // dây kính cắt theo đầu
  const ky = -HH + 26
  R(cat, -W, ky - 3.5, 2 * W, 7, 3.5, 'chamS')
  // mặt
  g('mat', P.than!)
  const ma = [-1, 1].map((s) => E(P.mat!, s * (EX + 12), EY + 34, 13, 8, 'ma'))
  const mats = [-1, 1].map((s) => {
    const mg = tao('g', null, P.mat!), ci = `${id}e${s + 1}`
    E(tao('clipPath', { id: ci }, defs), 0, 0, ERX, ERY, 'trang')
    const tron = tao('g', null, mg)
    E(tron, 0, 0, ERX, ERY, 'trang')
    const tr = tao('g', { 'clip-path': `url(#${ci})` }, tron), ng = tao('g', null, tr)
    E(ng, 0, 2, PR, PR * 1.22, 'den'); E(ng, -PR * 0.32, -PR * 0.38, PR * 0.42, PR * 0.46, 'trang'); E(ng, PR * 0.42, PR * 0.62, PR * 0.18, PR * 0.18, 'trang')
    const miT = R(tr, -ERX - 4, 0, 2 * ERX + 8, 3 * ERY, 0, 'long'), miD = E(tr, 0, 0, ERX * 1.7, ERY, 'long')
    const nham = net(tao('path', { d: `M${-ERX + 2},2Q0,${ERY * 0.55} ${ERX - 2},2` }, mg), 'den', 4)
    const cong = net(tao('path', { d: `M${-ERX + 2},6Q0,${-ERY * 0.8} ${ERX - 2},6` }, mg), 'den', 4.5)
    const xoan = net(tao('path', { d: s < 0 ? `M${-ERX + 4},-8L${ERX - 4},0L${-ERX + 4},8` : `M${ERX - 4},-8L${-ERX + 4},0L${ERX - 4},8` }, mg), 'den', 4.5)
    const may = E(P.mat!, 0, 0, 9, 5.5, 'kem') // hai chấm lông mày trắng đặc trưng shiba
    return { mg, tron, ng, miT, miD, nham, cong, xoan, may, s }
  })
  const mui = tao('g', null, P.mat!); E(mui, 0, -78, 9, 6.5, 'mui'); E(mui, -3, -80, 3, 1.8, 'trang', { opacity: 0.55 })
  const mq = tao('g', null, P.mat!)
  const mcp = tao('path', null, tao('clipPath', { id: id + 'm' }, defs))
  const mh = H(mq, '', 'mieng', { 'stroke-width': 3.6, 'stroke-linejoin': 'round' }); mh.style.stroke = M('mieng')
  const luoi = E(tao('g', { 'clip-path': `url(#${id}m)` }, mq), 0, 0, 8, 6, 'luoi')
  // kính bảo hộ trên trán (nhỏ hơn mắt, sát đỉnh — không thành «bốn mắt»)
  g('kinh', P.than!)
  for (const s of [-1, 1]) { R(P.kinh!, s * 20 - 16, ky - 11, 32, 22, 10, 'kinhV'); R(P.kinh!, s * 20 - 12, ky - 7.5, 24, 15, 7, 'kinh'); R(P.kinh!, s * 20 - 8, ky - 5, 5, 9, 2.5, 'trang') }
  // tay: tay áo trắng thuôn có khuỷu bo + cổ tay chàm + bàn tay tròn có viền
  const tay = [-1, 1].map((s) => {
    const tg = tao('g', null, null)
    const ongT = vien(H(tg, '', 'trang'), 'tayAoV', 2.4)
    const co = net(tao('path', null, tg), 'cham', 18); co.setAttribute('stroke-linecap', 'butt')
    const ban = tao('g', null, tg), kieu: Record<string, SVGElement> = {}
    const k1 = (t: string) => { const h = tao('g', { 'stroke-width': 2.4 }, ban); h.style.stroke = M('tayV'); h.style.paintOrder = 'stroke'; kieu[t] = h; return h }
    let h = k1('nam'); E(h, 0, 8, 10, 10, 'long'); E(h, -7.5, 4, 4, 5.5, 'long', { transform: 'rotate(28 -7.5 4)' })
    h = k1('xoe'); H(h, [[-9, 0, 7], [9, 0, 7], [10, 21, 9], [-9, 21, 9]], 'long'); E(h, -11, 6, 4, 7, 'long', { transform: 'rotate(55 -11 6)' })
    P.goc!.insertBefore(tg, P.than!)
    return { tg, ongT, co, ban, kieu, s, z: 0, kh: '' }
  })
  // hiệu ứng: lấp lánh, giọt mồ hôi, dấu hỏi, zzz
  g('hieu', svg)
  const sao = ([[-96, -200, 1], [92, -230, 0.8], [-70, -268, 0.7], [104, -150, 0.75]] as const).map(([x, y, s]) => { const e = H(P.hieu!, 'M0,-10Q1.6,-1.6 10,0Q1.6,1.6 0,10Q-1.6,1.6 -10,0Q-1.6,-1.6 0,-10Z', 'sao'); e.style.display = 'none'; return { e, x, y, s } })
  const giot = H(P.hieu!, 'M70,-170Q80,-152 70,-144Q60,-152 70,-170Z', 'giot'); giot.style.display = 'none'
  const hoi = tao('g', null, P.hieu!); hoi.style.display = 'none'
  vien(to(tao('circle', { cx: 86, cy: -214, r: 17 }, hoi), 'trang'), 'cham', 3.5).style.paintOrder = 'normal'
  net(tao('path', { d: 'M80,-219Q80,-225 86,-225Q92,-225 92,-220Q92,-216 86.5,-213V-210' }, hoi), 'cham', 3.6); E(hoi, 86.5, -204, 2.2, 2.2, 'cham')
  const zzz = tao('g', null, P.hieu!); zzz.style.display = 'none'
  const zs = ([[70, -190, 13], [92, -218, 17], [118, -250, 21]] as const).map(([x, y, s]) => { const t = to(tao('text', { x, y, 'font-size': s, 'font-weight': 900 }, zzz), 'chamS'); t.textContent = 'z'; return t })
  noiGan.appendChild(svg)

  // ── khung xương lò xo ──
  const v: So = { ...CHUAN }, van: So = {}, dich: So = { ...CHUAN }
  for (const k in v) van[k] = 0
  let roi: Record<string, string | number> = { ...ROI }, cx: TrangThaiVe = CAM_XUC_LUA.yen, iK = 0, tK = 0, kK = 170, gd: 'seq' | 'loop' | 'xong' = 'loop'
  let t = 0, nhay = 0, hen = 2000 + Math.random() * 2000, tSao = -1e9, tGiot = -1e9, noiDen = 0, ten: TrangThaiLua = 'yen', truocChoc: TrangThaiLua = 'yen', henVe = 0, ve2: TrangThaiLua | null = null
  const phu = { x: 0, v: 0 }
  let truoc = { rot: 0, y: 0 }
  const SHO = (s: number): [number, number] => [s * W * 0.44, -HH * 0.5]
  function ap(f: Khung) {
    const tt = A(cx.base ?? {}, f.p ?? {})
    for (const k in CHUAN) { const x = tt[k]; dich[k] = typeof x === 'number' ? x : CHUAN[k]! }
    for (const [s, T] of [[-1, 'T'], [1, 'P']] as const) {
      const di = tt['i' + T] as number[] | null | undefined
      if (!di) continue
      const [Sx, Sy] = SHO(s), X = s * (di[0]! - Sx), Y = di[1]! - Sy, a = rad(dich['a' + T]!), Ex = 22 * Math.sin(a), Ey = 22 * Math.cos(a)
      dich['b' + T] = (Math.atan2(X - Ex, Y - Ey) * 180) / Math.PI
      dich['d' + T] = Math.max(0.6, Math.min(2.2, Math.hypot(X - Ex, Y - Ey) / 20))
    }
    const r: Record<string, string | number> = {}
    for (const k in ROI) { const x = tt[k]; r[k] = x == null ? ROI[k]! : (x as string | number) }
    if (r.hieu === 'sao' && !mayYeu()) tSao = t
    if (r.hieu === 'giot' && !mayYeu()) tGiot = t
    for (const [i, kk] of [[0, 'zT'], [1, 'zP']] as const) { const ty = tay[i]!; if (r[kk] && !ty.z) { P.goc!.appendChild(ty.tg); ty.z = 1 } else if (!r[kk] && ty.z) { P.goc!.insertBefore(ty.tg, P.than!); ty.z = 0 } }
    roi = r; kK = f.k ?? 170
  }
  function batDau(tm: TrangThaiLua, o: TuyChonLua = {}) {
    ten = CAM_XUC_LUA[tm] ? tm : 'yen'; cx = CAM_XUC_LUA[ten]; iK = 0; tK = 0
    if (!['vui', 'combo', 'covu', 'choc'].includes(ten)) tSao = -1e9
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
    const dv = ((v.rot! - truoc.rot) * 0.06 + (v.y! - truoc.y) * 0.05) / dt
    truoc = { rot: v.rot!, y: v.y! }
    const dp = Math.max(-18, Math.min(18, -dv * 0.9))
    phu.v += (70 * (dp - phu.x) - 2 * Math.sqrt(70) * 0.25 * phu.v) * dt; phu.x += phu.v * dt
    hen -= dt * 1000
    if (hen <= 0) { nhay = 1; hen = 2400 + Math.random() * 2600 }
    if (nhay > 0) nhay = Math.max(0, nhay - (dt * 1000) / 150)
  }
  const cu = new WeakMap<Element, Record<string, string>>()
  const dat = (e: Element, k: string, val: string) => { let m = cu.get(e); if (!m) cu.set(e, (m = {})); if (m[k] !== val) { m[k] = val; if (k === 'display') (e as SVGElement).style.display = val; else e.setAttribute(k, val) } }
  const tf = (e: Element, s: string) => dat(e, 'transform', s)
  function ve() {
    const th = tinh ? 0 : Math.sin((t / 2400) * Math.PI * 2) * v.tho! * 0.02
    const sq = v.sq! * (1 + th * 0.5), sx = 1 + (1 - sq) * 0.6
    tf(P.goc!, `translate(${f1(v.x!)},${f1(v.y!)}) rotate(${f1(v.rot!)}) scale(${f1(sx * 1000) / 1000},${f1(sq * 1000) / 1000})`)
    dat(bong, 'rx', String(f1(W * 0.46 * (1 + Math.min(0, v.y!) / 120)))); dat(bong, 'opacity', String(f1(1 + Math.min(0, v.y!) / 90)))
    for (const { c, s } of chan) tf(c, `translate(${f1(s * W * 0.22)},-2)`)
    tf(P.than!, `rotate(${f1(v.hr!)})`)
    tf(P.mat!, `translate(${f1(v.fx! * 9)},${f1(v.fy!)})`)
    tf(P.kinh!, `translate(${f1(v.fx! * 6)},${f1(v.fy! * 0.5)})`)
    tf(P.duoi!, `rotate(${f1(phu.x * 0.6 + v.rot! * 0.5)} ${W * 0.4} -40)`)
    tai.forEach((e, i) => { const [x, y, r] = taiGoc[i]!, s = i ? 1 : -1; tf(e, `translate(${x},${y}) rotate(${f1(r + s * v.tai! + phu.x * (i ? 1 : 0.8))})${i ? '' : ' scale(-1,1)'}`) })
    const ns = Math.sin(nhay * Math.PI)
    for (const e of mats) {
      const s = e.s, md = roi.mat
      tf(e.mg, `translate(${s * EX},${EY}) scale(${f1(v.es! * 100) / 100})`)
      const lt = Math.min(1, Math.max(s < 0 ? v.lt! : v.ltP!, tinh ? 0 : ns)), thuong = md === 'mo'
      dat(e.tron, 'display', thuong && lt <= 0.9 ? '' : 'none')
      dat(e.cong, 'display', md === 'cong' ? '' : 'none')
      dat(e.xoan, 'display', md === 'xoan' ? '' : 'none')
      dat(e.nham, 'display', md === 'nham' || (thuong && lt > 0.9) ? '' : 'none')
      tf(e.ng, `translate(${f1(v.px! * ERX * 0.4)},${f1(v.py! * ERY * 0.36)})`)
      const yb = -ERY + lt * 2 * ERY
      dat(e.miT, 'y', String(f1(yb - 3 * ERY))); tf(e.miT, `rotate(${f1(-s * v.la!)} 0 ${f1(yb)})`)
      dat(e.miD, 'cy', String(f1(2 * ERY - v.lb! * 2 * ERY + 2)))
      tf(e.may, `translate(${s * 36},${f1(EY - ERY - 12 + v.by! - (md === 'cong' ? 3 : 0))}) rotate(${f1(-s * v.ba!)})`)
    }
    for (const m of ma) dat(m, 'opacity', String(f1(Math.min(1, v.ma!))))
    // miệng — mấp máy khi đang nói
    const dangNoi = t < noiDen, nhip = dangNoi ? Math.floor(t / 90) % 3 : 0
    const w = 9 + v.mw! - (dangNoi ? 1.5 : 0), yl = -v.mc! + v.mk!, yr = -v.mc! - v.mk!, ym = (yl + yr) / 2
    const mt = ym + v.mt! - (dangNoi ? 1 : 0), mb = Math.max(mt, ym + v.mb! + (dangNoi ? [6, 2, 4][nhip]! : 0))
    const d = `M${f1(-w)},${f1(yl)}Q0,${f1(mt * 2 - ym)} ${f1(w)},${f1(yr)}Q0,${f1(mb * 2 - ym)} ${f1(-w)},${f1(yl)}Z`
    dat(mh, 'd', d); dat(mcp, 'd', d); tf(mq, `translate(0,${MY})`)
    dat(luoi, 'cy', String(f1(mb + 3))); dat(luoi, 'rx', String(f1(Math.max(3, w * 0.6))))
    for (const ty of tay) {
      const s = ty.s, T = s < 0 ? 'T' : 'P', [Sx, Sy] = SHO(s), a = rad(v['a' + T]!), b = rad(v['b' + T]!), dd = v['d' + T]!
      const Ex = Sx + s * 22 * Math.sin(a), Ey = Sy + 22 * Math.cos(a), Hx = Ex + s * 20 * dd * Math.sin(b), Hy = Ey + 20 * dd * Math.cos(b)
      dat(ty.ongT, 'd', ongTay(Sx, Sy, Ex, Ey, Hx, Hy, 22, 19, 16))
      const ux = s * Math.sin(b), uy = Math.cos(b)
      dat(ty.co, 'd', `M${f1(Hx - ux * 5)},${f1(Hy - uy * 5)}L${f1(Hx)},${f1(Hy)}`)
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
    const kg = t - tGiot - 120
    dat(giot, 'display', kg < 0 || kg > 1600 ? 'none' : '')
    if (kg >= 0 && kg <= 1600) { tf(giot, `translate(0,${f1(kg / 100)})`); dat(giot, 'opacity', String(f1(kg < 200 ? kg / 200 : kg > 1200 ? (1600 - kg) / 400 : 1))) }
    dat(hoi, 'display', roi.hieu === 'hoi' ? '' : 'none')
    if (roi.hieu === 'hoi') tf(hoi, `translate(0,${f1(Math.sin(t / 300) * 3)}) rotate(${f1(Math.sin(t / 400) * 6)} 86 -214)`)
    dat(zzz, 'display', roi.hieu === 'zzz' ? '' : 'none')
    if (roi.hieu === 'zzz') zs.forEach((z, i) => { const k = (t / 1800 + i / 3) % 1; dat(z, 'opacity', String(f1(tinh ? 1 : k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8))); tf(z, `translate(${f1(tinh ? 0 : k * 10)},${f1(tinh ? 0 : -k * 16)})`) })
  }
  function ongTay(Sx: number, Sy: number, Ex: number, Ey: number, Hx: number, Hy: number, w1: number, w2: number, w3: number): string {
    const L1 = Math.hypot(Ex - Sx, Ey - Sy) || 1, L2 = Math.hypot(Hx - Ex, Hy - Ey) || 1
    const u1 = [(Ex - Sx) / L1, (Ey - Sy) / L1] as const, u2 = [(Hx - Ex) / L2, (Hy - Ey) / L2] as const, n1 = [-u1[1], u1[0]] as const, n2 = [-u2[1], u2[0]] as const
    const r = Math.min(7, L1 * 0.45, L2 * 0.45), mi = 1 / Math.max(0.45, 1 + n1[0] * n2[0] + n1[1] * n2[1])
    const ben = (k: number) => ({ a: [Sx + k * n1[0] * w1 / 2, Sy + k * n1[1] * w1 / 2], p1: [Ex + k * n1[0] * w2 / 2 - u1[0] * r, Ey + k * n1[1] * w2 / 2 - u1[1] * r], c: [Ex + k * (n1[0] + n2[0]) * mi * w2 / 2, Ey + k * (n1[1] + n2[1]) * mi * w2 / 2], p2: [Ex + k * n2[0] * w2 / 2 + u2[0] * r, Ey + k * n2[1] * w2 / 2 + u2[1] * r], b: [Hx + k * n2[0] * w3 / 2, Hy + k * n2[1] * w3 / 2] })
    const A1 = ben(1), B1 = ben(-1), Q = (p: number[]) => `${f1(p[0]!)},${f1(p[1]!)}`
    const tip = [Hx + u2[0] * w3 / 2, Hy + u2[1] * w3 / 2], goc = [Sx - u1[0] * w1 / 2, Sy - u1[1] * w1 / 2]
    return `M${Q(A1.a)}L${Q(A1.p1)}Q${Q(A1.c)} ${Q(A1.p2)}L${Q(A1.b)}Q${Q([A1.b[0]! + u2[0] * w3 / 2, A1.b[1]! + u2[1] * w3 / 2])} ${Q(tip)}Q${Q([B1.b[0]! + u2[0] * w3 / 2, B1.b[1]! + u2[1] * w3 / 2])} ${Q(B1.b)}L${Q(B1.p2)}Q${Q(B1.c)} ${Q(B1.p1)}L${Q(B1.a)}Q${Q([B1.a[0]! - u1[0] * w1 / 2, B1.a[1]! - u1[1] * w1 / 2])} ${Q(goc)}Q${Q([A1.a[0]! - u1[0] * w1 / 2, A1.a[1]! - u1[1] * w1 / 2])} ${Q(A1.a)}Z`
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
