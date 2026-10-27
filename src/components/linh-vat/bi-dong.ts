// BI CHUYỂN ĐỘNG (thầy 27/10: «vẽ linh vật chuyển động giống con cú Duo, học mọi hiệu ứng»). Mảnh nạp LƯỜI: chỉ Bi.tsx gọi import('./bi-dong').
// Khung xương SVG tách lớp: gốc (nhảy một lần) › lắc (vòng lặp) › tư thế (CSS transition) › thở › [hai tay, thân bình, dung dịch, bọt khí,
// mắt (tròng · con ngươi · mí), mày, miệng nhiều hình, má]. Cỗ máy trạng thái datTrangThai(ten): mỗi trạng thái khai báo tư thế ĐÍCH (CSS transition
// lo phần mượt) + hiệu ứng vào + vòng lặp riêng; rời trạng thái ⇒ vòng lặp cũ được trả về êm TỪ ĐÚNG CHỖ ĐANG DỞ (không giật cục).
// Hoá học hơn Duo: dung dịch đổi màu như chất chỉ thị theo cảm xúc, bọt khí sủi mạnh khi mừng, hơi bốc khi giận, mặt nước luôn nằm ngang khi Bi nghiêng.
// Không thư viện (CSS keyframes + Web Animations API). Không màu thô: màu là lớp CSS (bi.css + bi-dong.css, biến --tr-*).
// Tab ẩn / Bi ra khỏi khung nhìn ⇒ dừng mọi hoạt ảnh và bộ hẹn giờ sinh hạt. Giảm chuyển động ⇒ Bi.tsx không nạp mảnh này (Bi tĩnh).
import '../../styles/bi-dong.css'

export type TrangThaiBi = 'yen' | 'vui' | 'chao' | 'noi' | 'nghieng' | 'dung' | 'sai' | 'khoc' | 'gian' | 'ngu' | 'giat-minh' | 'cham' | 'chuoi' | 'cup' | 'nhay-mua'
export const TRANG_THAI_BI: readonly TrangThaiBi[] = ['yen', 'vui', 'chao', 'noi', 'nghieng', 'dung', 'sai', 'khoc', 'gian', 'ngu', 'giat-minh', 'cham', 'chuoi', 'cup', 'nhay-mua']
const BIET_DANH: Record<string, TrangThaiBi> = { buon: 'sai', mung: 'nhay-mua', 'xong-bai': 'nhay-mua', 'to-mo': 'nghieng', nghi: 'nghieng', doi: 'gian', 'bo-hoc': 'khoc', ngac: 'giat-minh', lua: 'chuoi' }
/** Trạng thái chỉ thoáng qua: xong thì về trạng thái nền trước đó. */
const THOANG = new Set<TrangThaiBi>(['cham', 'giat-minh'])

export interface TuyChonBi {
  /** Câu nói (trạng thái 'noi'). */
  chu?: string
  /** Sau bao nhiêu ms thì tự chuyển sang `ve`. */
  sau?: number
  ve?: TrangThaiBi
  /** Số lần vẫy (trạng thái 'chao') rồi về đứng yên. */
  lan?: number
  /** Số ngày trên ngọn lửa (trạng thái 'chuoi'). */
  so?: number
  /** Nhịp nói (ms mỗi chữ), mặc định 58. */
  nhip?: number
  /** Gọn: ngọn lửa nhỏ sát vai Bi, không tràn ra chữ bên cạnh (trạng thái 'chuoi' trong thẻ). */
  gon?: boolean
  /** Êm: bỏ màn vào (nhảy/lắc) — dùng khi quay lại trạng thái cũ. */
  em?: boolean
}
export interface BiDong {
  datTrangThai(t: TrangThaiBi | string, tc?: TuyChonBi): void
  noi(chu: string, tc?: TuyChonBi): void
  cham(): void
  nhin(dx: number, dy: number): void
  readonly trangThai: TrangThaiBi
  readonly svg: SVGSVGElement
  huy(): void
}

const NS = 'http://www.w3.org/2000/svg'
const THAN = 'M84 46 V77.2 A60 60 0 1 0 116 77.2 V46 Z'
// Miệng: MỌI hình cùng cấu trúc M · C · C · Z ⇒ CSS `d` nội suy mượt giữa các hình (mấp máy khi nói).
const MIENG: Record<string, string> = {
  cuoi: 'M89 157 C95 164 105 164 111 157 C105 167 95 167 89 157Z',
  cuoiTo: 'M86 155 C93 157 107 157 114 155 C111 177 89 177 86 155Z',
  a: 'M90 157 C95 155 105 155 110 157 C108 172 92 172 90 157Z',
  e: 'M87 158 C94 156 106 156 113 158 C110 166 90 166 87 158Z',
  o: 'M94 161 C94 154 106 154 106 161 C106 169 94 169 94 161Z',
  u: 'M96 162 C96 158 104 158 104 162 C104 166 96 166 96 162Z',
  meo: 'M88 166 C94 157 106 157 112 166 C106 161 94 161 88 166Z',
  khoc: 'M85 170 C89 151 111 151 115 170 C107 165 93 165 85 170Z',
  phung: 'M91 165 C96 160 104 160 109 165 C104 163 96 163 91 165Z',
  ha: 'M90 160 C90 146 110 146 110 160 C110 176 90 176 90 160Z',
  ngu: 'M95 162 C98 165 102 165 105 162 C102 166.5 98 166.5 95 162Z',
}
const CO_LUOI = new Set(['cuoiTo', 'a', 'khoc', 'ha'])
const MAY: Record<string, [string, string]> = {
  buon: ['translateY(-3px) rotate(-16deg)', 'translateY(-3px) rotate(16deg)'],
  gian: ['translateY(4px) rotate(18deg)', 'translateY(4px) rotate(-18deg)'],
  tomo: ['translateY(-8px) rotate(-6deg)', 'translateY(0px) rotate(5deg)'],
  ngac: ['translateY(-10px)', 'translateY(-10px)'],
}
const SAO = 'M0 -14 L4 -4.5 L14 -4 L6.5 2.5 L9 12.5 L0 7 L-9 12.5 L-6.5 2.5 L-14 -4 L-4 -4.5 Z'
const LAP = 'M0 -10 Q1.5 -1.5 10 0 Q1.5 1.5 0 10 Q-1.5 1.5 -10 0 Q-1.5 -1.5 0 -10Z'
const HOA = ['bi-f-sao', 'bi-f-tin', 'bi-f-dung', 'bd-f-sai', 'bi-f-lua']
const CAU_VONG = ['sao', 'lua', 'hong', 'tin', 'lam', 'chanh', 'dung']
const DAI_TAY = 28

const song = (y: number) => {
  let d = `M-100 ${y}`
  for (let x = -100; x < 300; x += 80) d += ` Q${x + 20} ${y - 8} ${x + 40} ${y} Q${x + 60} ${y + 8} ${x + 80} ${y}`
  return d
}
const tay = (s: string, x: number, y: number) => {
  const p = `M${x} ${y} L${x} ${y + DAI_TAY}`
  return `<g class="bd-tay${s} bd-t" style="transform-origin:${x}px ${y}px"><g class="bd-tay${s}2" style="transform-origin:${x}px ${y}px">` +
    `<path d="${p}" class="bi-net" stroke-width="23" stroke-linecap="round"/><path d="${p}" class="bi-net-c" stroke-width="15.5" stroke-linecap="round"/></g></g>`
}
const mat = (id: string, s: string, x: number, y: number) => `<g>
<g class="bd-mat-mo bd-o"><ellipse cx="${x}" cy="${y}" rx="14" ry="16" class="bi-trang"/>
<g clip-path="url(#${id}-m${s})"><g class="bd-ngoi"><g class="bd-ngoi-co" style="transform-origin:${x + 1.5}px ${y + 2}px">
<circle cx="${x + 1.5}" cy="${y + 2}" r="9" class="bi-toi"/><circle cx="${x + 4.5}" cy="${y - 2}" r="3.6" class="bi-trang"/><circle cx="${x - 1}" cy="${y + 6}" r="1.4" class="bi-trang" opacity=".9"/></g></g>
<g class="bd-mi bd-m"><g class="bd-mi2"><rect x="${x - 16}" y="${y - 78}" width="32" height="62" class="bd-mi-f"/><path d="M${x - 15} ${y - 16} Q${x} ${y - 12} ${x + 15} ${y - 16}" class="bi-net" fill="none" stroke-width="3"/></g></g></g>
<ellipse cx="${x}" cy="${y}" rx="14" ry="16" class="bi-net" fill="none" stroke-width="3"/></g>
<path class="bd-mat-cuoi bd-o bi-net" opacity="0" d="M${x - 10} ${y + 3} Q${x} ${y - 11} ${x + 10} ${y + 3}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
<path class="bd-mat-nham bd-o bi-net" opacity="0" d="M${x - 10} ${y} Q${x} ${y + 8} ${x + 10} ${y}" fill="none" stroke-width="4" stroke-linecap="round"/>
<path class="bd-mat-sao bd-o bi-sao-mat bi-net" opacity="0" transform="translate(${x} ${y})" d="${SAO}" stroke-width="3" stroke-linejoin="round"/>
<path class="bd-may bi-net" opacity="0" style="transform-origin:${s === 'L' ? 77 : 123}px 110px" d="${s === 'L' ? 'M66 113 Q77 107 89 111' : 'M111 111 Q123 107 134 113'}" fill="none" stroke-width="4.5" stroke-linecap="round"/>
</g>`

function veSvg(id: string) {
  const s = song(108)
  return `<svg xmlns="${NS}" class="bd-svg" viewBox="-40 -30 280 270" aria-hidden="true" focusable="false" data-mau="dung">
<defs><clipPath id="${id}-c"><path d="${THAN}"/></clipPath>
<clipPath id="${id}-mL"><ellipse cx="78" cy="134" rx="14" ry="16"/></clipPath><clipPath id="${id}-mR"><ellipse cx="122" cy="134" rx="14" ry="16"/></clipPath>
<clipPath id="${id}-mo"><path class="bd-mieng" d="${MIENG.cuoi}"/></clipPath>
<linearGradient id="${id}-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="bi-g-sang"/><stop offset=".55" class="bi-g-chinh"/><stop offset="1" class="bi-g-dam"/></linearGradient>
<radialGradient id="${id}-k" cx=".35" cy=".3" r=".75"><stop offset="0" class="bi-g-kinh" stop-opacity=".95"/><stop offset="1" class="bi-g-kinh-2" stop-opacity=".9"/></radialGradient></defs>
<ellipse class="bd-bong bi-bong" cx="100" cy="212" rx="50" ry="7" opacity=".12" style="transform-origin:100px 212px"/>
<g class="bd-sau"></g>
<g class="bd-goc" style="transform-origin:100px 208px"><g class="bd-lac" style="transform-origin:100px 205px">
<ellipse cx="78" cy="198" rx="14" ry="9" class="bi-f-dam bi-net" stroke-width="4"/><ellipse cx="122" cy="198" rx="14" ry="9" class="bi-f-dam bi-net" stroke-width="4"/>
<g class="bd-tt bd-t" style="transform-origin:100px 205px"><g class="bd-tho" style="transform-origin:100px 205px">
${tay('L', 52, 138)}${tay('R', 148, 138)}
<path d="${THAN}" fill="url(#${id}-k)"/>
<g clip-path="url(#${id}-c)"><g class="bd-dd bd-m" style="transform-origin:100px 135px"><g class="bd-dd2" style="transform-origin:100px 135px"><g class="bd-muc bd-m"><g class="bd-sanh" style="transform-origin:100px 120px"><g class="bd-song">
<path d="${s} V330 H-100 Z" fill="url(#${id}-l)"/><path d="${s}" class="bi-s-trang" fill="none" stroke-opacity=".55" stroke-width="3"/></g></g></g></g></g><g class="bd-bot-trong"></g></g>
<rect x="78" y="38" width="44" height="12" rx="6" fill="url(#${id}-k)" class="bi-net" stroke-width="4.5"/>
<path d="${THAN}" class="bi-net bd-cham" fill="none" stroke-width="5" stroke-linejoin="round" pointer-events="all"/>
<path d="M58 104 Q64 92 76 86" class="bi-s-trang" fill="none" stroke-width="6" stroke-linecap="round" opacity=".9"/>
<circle cx="54" cy="116" r="3.2" class="bi-trang" opacity=".9"/><path d="M91 52 V74" class="bi-s-trang" stroke-width="4" stroke-linecap="round" opacity=".8"/>
<ellipse cx="62" cy="156" rx="9.5" ry="6" class="bi-ma bd-ma bd-o bd-dao"/><ellipse cx="138" cy="156" rx="9.5" ry="6" class="bi-ma bd-ma bd-o bd-dao"/>
${mat(id, 'L', 78, 134)}${mat(id, 'R', 122, 134)}
<path class="bd-mieng bi-mieng" d="${MIENG.cuoi}"/><g clip-path="url(#${id}-mo)"><ellipse class="bd-luoi bi-luoi bd-o" cx="100" cy="172" rx="9" ry="5.5" opacity="0"/></g>
<path class="bd-mieng bi-net" fill="none" stroke-width="3.5" stroke-linejoin="round" d="${MIENG.cuoi}"/>
<g transform="translate(117 24)"><circle class="bd-bong-ngu bd-dao bd-o bi-trang bi-net" r="10" stroke-width="2.5" fill-opacity=".7" opacity="0"/></g>
</g></g></g></g>
<g class="bd-truoc"></g>
<g transform="translate(162 16)"><g class="bd-hoi bd-dao bd-o" opacity="0"><circle r="17" class="bi-trang bi-net" stroke-width="3"/><path d="M-5 -5 Q-5 -11 0.5 -11 Q6 -11 6 -5.5 Q6 -1.5 1 1 V4" class="bi-s-tin" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cy="9.5" r="2.4" class="bi-f-tin"/></g></g>
<g transform="translate(150 4)"><g class="bd-than bd-dao bd-o" opacity="0"><path d="M0 -14 V4" class="bd-s-sai" stroke-width="7" stroke-linecap="round"/><circle cy="14" r="4" class="bd-f-sai"/></g></g>
<g transform="translate(168 98)"><path class="bd-mo-hoi bd-dao bd-o bi-giot bi-net" opacity="0" d="M0 -9 Q8 3 0 9 Q-8 3 0 -9Z" stroke-width="2.5"/></g>
<g class="bd-lua-vt" transform="translate(214 200)"><g class="bd-lua-o bd-dao bd-o" opacity="0"><g class="bd-lua"><g transform="scale(1.75) translate(-166 -57)"><path d="M160 52 C150 40 162 30 158 16 C172 26 180 40 172 54 C170 58 164 58 160 52Z" class="bi-f-lua bi-net" stroke-width="2.5"/><path d="M164 50 C160 44 166 40 165 33 C171 39 173 46 169 51Z" class="bi-f-sao"/></g></g><text class="bd-so bi-net" x="0" y="-14" text-anchor="middle" stroke-width="4" paint-order="stroke"></text></g></g>
<g transform="translate(158 76) scale(1.3)"><g class="bd-cup bd-dao bd-o" opacity="0"><path d="M-14 -10 Q-24 -10 -22 -2 Q-20 4 -12 4 M14 -10 Q24 -10 22 -2 Q20 4 12 4" fill="none" class="bi-net" stroke-width="3.5" stroke-linecap="round"/><path d="M-14 -16 H14 V-6 Q14 10 0 12 Q-14 10 -14 -6Z M-4 12 H4 V20 H-4Z M-11 20 H11 V26 H-11Z" class="bi-f-sao bi-net" stroke-width="2.8" stroke-linejoin="round"/><path transform="translate(0 -3) scale(.42)" d="${SAO}" class="bi-trang"/></g></g>
</svg>`
}

const ngau = (a: number, b: number) => a + Math.random() * (b - a)
type Than = { x?: number; y?: number; r?: number; sx?: number; sy?: number }
type TT = {
  mau: string; muc: number; mat: 'mo' | 'cuoi' | 'sao' | 'nham'; mi: number; may: string | null; mieng: string; tay: [number, number]
  than?: Than; nhin?: [number, number]; trong: number; ngoai: number; song: number; tho?: number; dao?: boolean; theo?: boolean; ma?: number
  vao?: (o: TuyChonBi) => void
}
type KF = Keyframe[]

/** Hình miệng theo chữ (tiếng Việt: bỏ dấu rồi xét nguyên âm). */
export function hinhMieng(c: string): string {
  const b = c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (!b.trim() || /[.,!?…:;–-]/.test(b)) return 'cuoi'
  if (b === 'a') return 'a'
  if (b === 'e' || b === 'i' || b === 'y') return 'e'
  if (b === 'o') return 'o'
  if (b === 'u') return 'u'
  if ('mbp'.includes(b)) return 'cuoi'
  return 'e'
}

export function taoBi(noiGan: HTMLElement, tc: { trangThai?: TrangThaiBi | string; tuyChon?: TuyChonBi; bong?: boolean; khiDoi?: (t: TrangThaiBi) => void } = {}): BiDong {
  const id = 'bd' + Math.random().toString(36).slice(2, 8)
  const tam = document.createElement('div')
  tam.innerHTML = veSvg(id)
  const svg = tam.firstElementChild as SVGSVGElement
  noiGan.appendChild(svg)
  let loi: HTMLDivElement | null = null
  if (tc.bong) { loi = document.createElement('div'); loi.className = 'bd-loi'; noiGan.appendChild(loi) }
  const q = <T extends Element = SVGGElement>(s: string) => svg.querySelector(s) as T
  const qa = <T extends Element = SVGGElement>(s: string) => [...svg.querySelectorAll(s)] as T[]
  const E = {
    goc: q('.bd-goc'), lac: q('.bd-lac'), tt: q('.bd-tt'), tho: q('.bd-tho'), bong: q('.bd-bong'),
    tayL: q('.bd-tayL'), tayL2: q('.bd-tayL2'), tayR: q('.bd-tayR'), tayR2: q('.bd-tayR2'),
    dd: q('.bd-dd'), dd2: q('.bd-dd2'), muc: q('.bd-muc'), sanh: q('.bd-sanh'), song: q('.bd-song'), botTrong: q('.bd-bot-trong'), truoc: q('.bd-truoc'),
    ngoi: qa('.bd-ngoi'), co: qa('.bd-ngoi-co'), mi: qa('.bd-mi'), mi2: qa('.bd-mi2'), matMo: qa('.bd-mat-mo'), matCuoi: qa('.bd-mat-cuoi'), matSao: qa('.bd-mat-sao'), matNham: qa('.bd-mat-nham'),
    may: qa('.bd-may'), ma: qa('.bd-ma'), mieng: qa<SVGPathElement>('.bd-mieng'), luoi: q('.bd-luoi'),
    hoi: q('.bd-hoi'), than: q('.bd-than'), moHoi: q('.bd-mo-hoi'), lua: q('.bd-lua-o'), so: q<SVGTextElement>('.bd-so'), cup: q('.bd-cup'), bongNgu: q('.bd-bong-ngu'),
  }
  const DAO = [E.hoi, E.than, E.moHoi, E.lua, E.cup, E.bongNgu]
  const coD = typeof CSS !== 'undefined' && !!CSS.supports?.('d', 'path("M0 0")')

  // ── hẹn giờ: `hens` xoá khi đổi trạng thái; `hensChung` sống suốt đời Bi
  const hens = new Set<number>(), hensChung = new Set<number>()
  const hen = (fn: () => void, ms: number, chung = false) => { const bo = chung ? hensChung : hens; const t = window.setTimeout(() => { bo.delete(t); fn() }, ms); bo.add(t); return t }
  const lapHen = (fn: () => void, ms: number) => { const t = window.setInterval(fn, ms); hens.add(t) }
  const xoaHen = (bo: Set<number>) => { bo.forEach((t) => { clearTimeout(t); clearInterval(t) }); bo.clear() }

  // ── tạm dừng khi tab ẩn / ra khỏi khung nhìn
  let trongKhung = true, an = false
  const tatCa = () => (svg.getAnimations ? svg.getAnimations({ subtree: true }) : [])
  const capNhatAn = () => {
    const moi = document.hidden || !trongKhung
    if (moi === an) return
    an = moi
    tatCa().forEach((a) => (an ? a.pause() : a.play()))
  }
  document.addEventListener('visibilitychange', capNhatAn)
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((ds) => { trongKhung = ds.some((d) => d.isIntersecting); capNhatAn() }) : null
  io?.observe(noiGan)

  // ── vòng lặp & một lần
  let laps: Animation[] = []
  const lap = (el: Element, kf: KF, o: KeyframeAnimationOptions) => { const a = el.animate(kf, { iterations: Infinity, ...o }); if (an) a.pause(); laps.push(a); return a }
  const dungLap = () => {
    laps.forEach((a) => {
      const el = a.effect && (a.effect as KeyframeEffect).target as Element | null
      const tfHt = el ? getComputedStyle(el).transform : 'none'
      a.cancel()
      if (el && tfHt && tfHt !== 'none') el.animate([{ transform: tfHt }, { transform: 'none' }], { duration: 320, easing: 'ease-out' })
    })
    laps = []
  }
  const dangChay = new Map<Element, Animation>()
  const motLan = (el: Element, kf: KF, o: number | KeyframeAnimationOptions) => {
    const cu = dangChay.get(el)
    if (cu && cu.playState === 'running') { const tfHt = getComputedStyle(el).transform; cu.cancel(); if (tfHt !== 'none') kf = [{ ...kf[0], transform: tfHt }, ...kf.slice(1)] }
    const a = el.animate(kf, o)
    if (an) a.pause()
    dangChay.set(el, a)
    return a
  }

  // ── đặt tư thế (CSS transition lo phần mượt)
  const tf = (el: Element, v: string) => { (el as SVGElement).style.transform = v }
  const op = (el: Element, v: number) => { (el as SVGElement).style.opacity = String(v) }
  let mucHt = 108, miHt = 0, matHt: TT['mat'] = 'mo'
  const datMau = (m: string) => svg.setAttribute('data-mau', m)
  const datMuc = (y: number) => { mucHt = y; tf(E.muc, `translateY(${y - 108}px)`) }
  const datMat = (k: TT['mat']) => { matHt = k; E.matMo.forEach((e) => op(e, k === 'mo' ? 1 : 0)); E.matCuoi.forEach((e) => op(e, k === 'cuoi' ? 1 : 0)); E.matSao.forEach((e) => op(e, k === 'sao' ? 1 : 0)); E.matNham.forEach((e) => op(e, k === 'nham' ? 1 : 0)) }
  const datMi = (v: number) => { miHt = v; E.mi.forEach((e) => tf(e, `translateY(${v * 31}px)`)) }
  const datMay = (k: string | null) => { const m = k ? MAY[k] : null; E.may.forEach((e, i) => { op(e, m ? 1 : 0); tf(e, m ? m[i]! : 'none') }) }
  const datMieng = (k: string) => {

    const d = MIENG[k] ?? MIENG.cuoi!
    E.mieng.forEach((e) => (coD ? e.style.setProperty('d', `path("${d}")`) : e.setAttribute('d', d)))
    op(E.luoi, CO_LUOI.has(k) ? 1 : 0)
  }
  const datTay = (l: number, r: number) => { tf(E.tayL, `rotate(${l}deg)`); tf(E.tayR, `rotate(${r}deg)`) }
  const datThan = ({ x = 0, y = 0, r = 0, sx = 1, sy = 1 }: Than = {}) => { tf(E.tt, `translate(${x}px,${y}px) rotate(${r}deg) scale(${sx},${sy})`); tf(E.dd, `rotate(${-r}deg)`) }
  const nhin = (dx: number, dy: number) => E.ngoi.forEach((n) => tf(n, `translate(${dx}px,${dy}px)`))
  const datMa = (v: number) => E.ma.forEach((m) => { op(m, Math.min(1, v)); tf(m, `scale(${v > 1 ? 1.25 : 1})`) })
  const hienDao = (el: Element) => { op(el, 1); tf(el, 'scale(1)'); motLan(el, [{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' }) }
  const anDao = () => DAO.forEach((el) => { dangChay.get(el)?.cancel(); op(el, 0); tf(el, 'scale(.4)') })

  // ── hạt: bọt khí, hơi, nước mắt, hoa giấy, lấp lánh, zzz, tim, giọt bắn
  const taoHat = (tag: string, attrs: Record<string, string | number>, cha: Element = E.truoc) => {
    const el = document.createElementNS(NS, tag)
    for (const k in attrs) el.setAttribute(k, String(attrs[k]))
    el.classList.add('bd-hat')
    cha.appendChild(el)
    return el
  }
  const bay = (el: Element, kf: KF, o: KeyframeAnimationOptions) => { const a = el.animate(kf, o); a.onfinish = () => el.remove(); a.oncancel = () => el.remove() }
  const botTrong = () => {
    const x = ngau(76, 124), y0 = ngau(184, 192), dy = mucHt + 6 - y0
    const c = taoHat('circle', { cx: x, cy: y0, r: ngau(1.8, 4.5).toFixed(1), class: 'bi-trang', opacity: 0.55 }, E.botTrong)
    bay(c, [{ transform: 'translate(0,0)' }, { transform: `translate(${ngau(-6, 6)}px,${dy * 0.5}px)` }, { transform: `translate(${ngau(-6, 6)}px,${dy}px)`, opacity: 1, offset: 0.9 }, { transform: `translate(0px,${dy}px) scale(1.7)`, opacity: 0 }],
      { duration: ngau(1200, 2000), easing: 'ease-in' })
  }
  const botNgoai = () => {
    const c = taoHat('circle', { cx: 100 + ngau(-8, 8), cy: 36, r: ngau(2.5, 6).toFixed(1), class: 'bi-f-sang bi-net', 'stroke-width': 2.2 })
    const h = ngau(50, 95), w = ngau(-22, 22)
    bay(c, [{ transform: 'translate(0,0) scale(.4)', opacity: 0 }, { transform: `translate(${w * 0.4}px,${-h * 0.4}px) scale(1)`, opacity: 1, offset: 0.3 }, { transform: `translate(${w}px,${-h}px) scale(1.1)`, opacity: 0 }],
      { duration: ngau(1100, 1700), easing: 'ease-out' })
  }
  const hoiNuoc = () => {
    const c = taoHat('circle', { cx: 100 + ngau(-10, 10), cy: 34, r: 7, class: 'bd-hoi-nuoc' }, svg.querySelector('.bd-sau')!)
    bay(c, [{ transform: 'translate(0,0) scale(.6)', opacity: 0.95 }, { transform: `translate(${ngau(-30, 30)}px,${-ngau(45, 75)}px) scale(2.6)`, opacity: 0 }], { duration: 1500, easing: 'ease-out' })
  }
  const nuocMat = (trai: boolean) => {
    const x = trai ? 65 : 135, y = 146
    const p = taoHat('path', { d: `M${x} ${y - 6} Q${x + 5} ${y + 2} ${x} ${y + 6} Q${x - 5} ${y + 2} ${x} ${y - 6}Z`, class: 'bi-giot bi-net', 'stroke-width': 2 })
    bay(p, [{ transform: 'translate(0,0) scale(.5)' }, { transform: `translate(${trai ? -3 : 3}px,6px) scale(1)`, offset: 0.2 }, { transform: `translate(${trai ? -10 : 10}px,58px) scale(.9)`, opacity: 0 }], { duration: 900, easing: 'ease-in' })
  }
  const hoaGiay = (x0 = 100, y0 = 60) => {
    const cls = HOA[Math.floor(Math.random() * HOA.length)]!
    const r = taoHat('rect', { x: x0 - 4, y: y0 - 2.5, width: 8, height: 5, rx: 1.5, class: cls })
    const vx = ngau(-120, 120), up = ngau(30, 90), rot = ngau(-540, 540)
    bay(r, [{ transform: 'translate(0,0) rotate(0deg)' }, { transform: `translate(${vx * 0.45}px,${-up}px) rotate(${rot / 2}deg)`, offset: 0.35, easing: 'ease-in' }, { transform: `translate(${vx}px,${170 - y0 + ngau(0, 30)}px) rotate(${rot}deg)`, opacity: 0 }],
      { duration: ngau(1300, 1900), easing: 'ease-out' })
  }
  const lapLanh = (x: number, y: number) => {
    const p = taoHat('path', { d: LAP, transform: `translate(${x} ${y})`, class: 'bi-f-sao' })
    bay(p, [{ transform: 'scale(0) rotate(0deg)' }, { transform: 'scale(1.2) rotate(45deg)', offset: 0.5 }, { transform: 'scale(0) rotate(90deg)' }], { duration: 700, easing: 'ease-in-out' })
  }
  const zzz = () => {
    const p = taoHat('path', { d: 'M126 34 H138 L126 47 H138', class: 'bi-s-tin', fill: 'none', 'stroke-width': 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    bay(p, [{ transform: 'translate(0,0) scale(.6)', opacity: 0 }, { transform: 'translate(12px,-16px) scale(1)', opacity: 1, offset: 0.3 }, { transform: 'translate(34px,-52px) scale(1.5) rotate(-12deg)', opacity: 0 }], { duration: 2400, easing: 'ease-out' })
  }
  const tim = () => {
    const x = 100 + ngau(-40, 40), y = 70
    const p = taoHat('path', { d: `M${x} ${y + 5} C${x - 9} ${y - 2} ${x - 5} ${y - 9} ${x} ${y - 4} C${x + 5} ${y - 9} ${x + 9} ${y - 2} ${x} ${y + 5}Z`, class: 'bd-f-hong bi-net', 'stroke-width': 2 })
    bay(p, [{ transform: 'translate(0,0) scale(.3)', opacity: 0 }, { transform: 'translate(0,-12px) scale(1.2)', opacity: 1, offset: 0.3 }, { transform: `translate(${ngau(-15, 15)}px,-50px) scale(1)`, opacity: 0 }], { duration: 1200, easing: 'ease-out' })
  }
  const giotBan = () => {
    const c = taoHat('circle', { cx: 100, cy: 40, r: ngau(3, 5).toFixed(1), class: 'bi-f-sang bi-net', 'stroke-width': 2 })
    const vx = ngau(-80, 80), up = ngau(30, 60)
    bay(c, [{ transform: 'translate(0,0)' }, { transform: `translate(${vx * 0.5}px,${-up}px)`, offset: 0.4, easing: 'ease-in' }, { transform: `translate(${vx}px,${60}px)`, opacity: 0 }], { duration: 850, easing: 'ease-out' })
  }

  // ── nhịp nền: bọt khí theo tốc độ trạng thái, chớp mắt, đảo mắt
  let tocTrong = 0.5, tocNgoai = 0
  const nhipBot = window.setInterval(() => {
    if (an) return
    if (Math.random() < tocTrong * 0.1) botTrong()
    if (Math.random() < tocNgoai * 0.1) botNgoai()
  }, 100)
  const chop = () => {
    if (!an && matHt === 'mo' && miHt < 0.8) {
      const kf = [{ transform: 'translateY(0)' }, { transform: `translateY(${(1 - miHt) * 31 + 2}px)`, offset: 0.45 }, { transform: 'translateY(0)' }]
      E.mi2.forEach((m) => m.animate(kf, { duration: 170, easing: 'ease-in-out' }))
      if (Math.random() < 0.22) hen(() => E.mi2.forEach((m) => m.animate(kf, { duration: 170 })), 260, true)
    }
    hen(chop, ngau(1800, 4800), true)
  }
  let luotTro = 0
  const daoMat = () => {
    if (!an && TTS[ten].dao && Date.now() - luotTro > 2000) {
      const [dx, dy] = Math.random() < 0.35 ? [0, 0] : [ngau(-5, 5), ngau(-4, 3)]
      nhin(dx, dy)
    }
    hen(daoMat, ngau(1200, 3200), true)
  }
  const theoTro = (e: PointerEvent) => {
    if (an || !TTS[ten].theo) return
    const b = svg.getBoundingClientRect()
    if (!b.width) return
    const vx = e.clientX - (b.left + b.width * 0.5), vy = e.clientY - (b.top + b.height * (164 / 270))
    const d = Math.hypot(vx, vy) || 1, k = Math.min(1, d / (b.width * 0.6))
    nhin((vx / d) * k * 5.5, (vy / d) * k * 4.5)
    luotTro = Date.now()
  }
  window.addEventListener('pointermove', theoTro, { passive: true })

  // ── các nhịp dùng lại
  const NHAY: KF = [{ transform: 'none', easing: 'ease-out' }, { transform: 'translateY(0) scale(1.12,.86)', offset: 0.16, easing: 'ease-out' }, { transform: 'translateY(-48px) scale(.93,1.09)', offset: 0.48, easing: 'ease-in' }, { transform: 'translateY(0) scale(1.1,.9)', offset: 0.82, easing: 'ease-out' }, { transform: 'none' }]
  const BONG_NHAY: KF = [{ transform: 'scale(1)' }, { transform: 'scale(1.1)', offset: 0.16 }, { transform: 'scale(.6)', opacity: 0.06, offset: 0.48 }, { transform: 'scale(1.1)', offset: 0.82 }, { transform: 'scale(1)' }]
  const hopNho = () => motLan(E.goc, [{ transform: 'none' }, { transform: 'translateY(-14px) scale(.97,1.04)', offset: 0.45 }, { transform: 'translateY(0) scale(1.05,.95)', offset: 0.8 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' })
  const sanh = (m = 1) => motLan(E.sanh, [{ transform: 'none' }, { transform: `rotate(${9 * m}deg) translateY(-4px)` }, { transform: `rotate(${-7 * m}deg)` }, { transform: `rotate(${4 * m}deg)` }, { transform: `rotate(${-2 * m}deg)` }, { transform: 'none' }], { duration: 1100, easing: 'ease-out' })
  const lapCuoi = (ms: number) => { let b = false; lapHen(() => { b = !b; datMieng(b ? 'e' : 'cuoiTo') }, 110); hen(() => datMieng(TTS[ten].mieng), ms) }

  let ten: TrangThaiBi = 'yen', nen: TrangThaiBi = 'yen', nenTc: TuyChonBi = {}
  const TTS: Record<TrangThaiBi, TT> = {
    yen: { mau: 'dung', muc: 108, mat: 'mo', mi: 0, may: null, mieng: 'cuoi', tay: [42, -42], trong: 0.6, ngoai: 0, song: 1, dao: true, theo: true,
      vao: () => lapHen(() => {
        const r = Math.random()
        if (r < 0.4) hopNho()
        else if (r < 0.7) { for (let i = 0; i < 3; i++) hen(botNgoai, i * 180); datMieng('o'); hen(() => datMieng('cuoi'), 520) }
        else { datMat('cuoi'); hen(() => datMat('mo'), 900) }
      }, 6500) },
    vui: { mau: 'dung', muc: 106, mat: 'cuoi', mi: 0, may: null, mieng: 'cuoiTo', tay: [60, -60], trong: 1, ngoai: 0.3, song: 1.2, theo: true, ma: 1,
      vao: () => lap(E.tho, [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }], { duration: 420, direction: 'alternate', easing: 'ease-in-out' }) },
    chao: { mau: 'dung', muc: 108, mat: 'mo', mi: 0, may: null, mieng: 'cuoiTo', tay: [42, -150], than: { r: 3 }, trong: 0.8, ngoai: 0, song: 1.2, theo: true,
      vao: (o) => {
        if (!o.em) hopNho()
        lap(E.tayR2, [{ transform: 'rotate(18deg)' }, { transform: 'rotate(-22deg)' }], { duration: 300, direction: 'alternate', easing: 'ease-in-out' })
        hen(() => datMat('cuoi'), 700); hen(() => datMat('mo'), 1500)
        if (o.lan) hen(() => datTrangThai('yen', { em: true }), o.lan * 600 + 300)
      } },
    noi: { mau: 'dung', muc: 108, mat: 'mo', mi: 0, may: null, mieng: 'cuoi', tay: [42, -80], trong: 0.6, ngoai: 0, song: 1, theo: true,
      vao: (o) => {
        lap(E.tayR2, [{ transform: 'none' }, { transform: 'rotate(-18deg)' }, { transform: 'none' }], { duration: 900, easing: 'ease-in-out' })
        noiChu(o.chu ?? '', o.nhip ?? 58, () => { if (!o.sau) hen(() => datTrangThai(nen === 'noi' ? 'yen' : nen, { ...nenTc, em: true }), 1300) })
      } },
    nghieng: { mau: 'tin', muc: 110, mat: 'mo', mi: 0, may: 'tomo', mieng: 'o', tay: [42, -42], than: { r: -12, x: -2 }, nhin: [4, -4], trong: 0.3, ngoai: 0, song: 0.7,
      vao: (o) => { hienDao(E.hoi); if (!o.em) sanh(-1); lap(E.lac, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(2.5deg)' }, { transform: 'rotate(0deg)' }], { duration: 2400, easing: 'ease-in-out' }) } },
    dung: { mau: 'chanh', muc: 100, mat: 'cuoi', mi: 0, may: null, mieng: 'cuoiTo', tay: [150, -150], trong: 4, ngoai: 3, song: 2.2, theo: true, ma: 1.2,
      vao: (o) => {
        if (!o.em) {
          motLan(E.goc, NHAY, { duration: 760, iterations: 2 }); motLan(E.bong, BONG_NHAY, { duration: 760, iterations: 2 }); sanh()
          for (let i = 0; i < 6; i++) hen(botNgoai, i * 90)
          ;[[30, 70], [170, 64], [150, 20], [50, 24]].forEach(([x, y], i) => hen(() => lapLanh(x!, y!), 200 + i * 160))
          lap(E.tayL2, [{ transform: 'none' }, { transform: 'rotate(-22deg)' }], { duration: 190, direction: 'alternate' })
          lap(E.tayR2, [{ transform: 'none' }, { transform: 'rotate(22deg)' }], { duration: 190, direction: 'alternate' })
        }
        hen(() => { dungLap(); tocNgoai = 0.8; tocTrong = 1.5; datTay(120, -120) }, o.em ? 0 : 1600)
      } },
    sai: { mau: 'sai', muc: 116, mat: 'mo', mi: 0.32, may: 'buon', mieng: 'meo', tay: [12, -12], than: { y: 5, sx: 1.03, sy: 0.95 }, nhin: [-1, 4], trong: 0, ngoai: 0, song: 0.45, tho: 0.7, ma: 0.5,
      vao: (o) => {
        if (!o.em) motLan(E.goc, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0deg)' }], { duration: 620, easing: 'ease-in-out' })
        hen(() => { hienDao(E.moHoi); motLan(E.moHoi, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(16px)', opacity: 0.2 }], { duration: 1600, delay: 450, fill: 'forwards' }) }, 300)
      } },
    khoc: { mau: 'lam', muc: 122, mat: 'mo', mi: 0.5, may: 'buon', mieng: 'khoc', tay: [8, -8], than: { y: 6, sx: 1.03, sy: 0.95 }, nhin: [0, 3], trong: 0, ngoai: 0, song: 0.5, ma: 0.6,
      vao: () => {
        lap(E.lac, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(2px) scale(1.02,.97)' }, { transform: 'translateY(0) scale(1,1)' }], { duration: 520, easing: 'ease-in-out' })
        lapHen(() => { if (!an) { nuocMat(true); nuocMat(false) } }, 300)
        let b = false; lapHen(() => { b = !b; datMieng(b ? 'meo' : 'khoc') }, 650)
      } },
    gian: { mau: 'do', muc: 104, mat: 'mo', mi: 0.38, may: 'gian', mieng: 'phung', tay: [75, -75], than: { r: 5, x: 4, sx: 0.97 }, nhin: [-5, 0], trong: 5, ngoai: 0, song: 3, ma: 1.2,
      vao: (o) => {
        const run: KF = [{ transform: 'translateX(0)', offset: 0 }]
        for (let i = 1; i <= 8; i++) run.push({ transform: `translateX(${i % 2 ? -2.5 : 2.5}px)`, offset: i * 0.05 })
        run.push({ transform: 'translateX(0)', offset: 0.45 }, { transform: 'translateX(0)', offset: 1 })
        lap(E.lac, run, { duration: 1200 })
        lapHen(() => { if (!an) hoiNuoc() }, 230)
        if (!o.em) motLan(E.goc, [{ transform: 'none' }, { transform: 'scale(1.08,.9)', offset: 0.3 }, { transform: 'none' }], { duration: 360 })
        if (o.chu && loi) noiChu(o.chu, 58, () => {})
      } },
    ngu: { mau: 'xam', muc: 118, mat: 'mo', mi: 0.6, may: null, mieng: 'ngu', tay: [20, -20], than: { y: 3, sy: 0.98 }, nhin: [0, 2], trong: 0, ngoai: 0, song: 0.3, tho: 0.55, ma: 0.45,
      vao: () => {
        hen(() => datMi(1), 700); hen(() => datMat('nham'), 1250)
        lap(E.lac, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(5deg) translateY(2px)', offset: 0.7 }, { transform: 'rotate(7deg) translateY(3px)', offset: 0.82 }, { transform: 'rotate(-1deg)', offset: 0.88 }, { transform: 'rotate(0deg)' }], { duration: 3600, easing: 'ease-in-out' })
        op(E.bongNgu, 1)
        lap(E.bongNgu, [{ transform: 'scale(.3)' }, { transform: 'scale(1.05)', offset: 0.7 }, { transform: 'scale(.3)' }], { duration: 3600, easing: 'ease-in-out' })
        lapHen(() => { if (!an) zzz() }, 1300)
      } },
    'giat-minh': { mau: 'tim', muc: 96, mat: 'mo', mi: 0, may: 'ngac', mieng: 'ha', tay: [115, -115], trong: 3, ngoai: 0, song: 3,
      vao: () => {
        E.co.forEach((c) => tf(c, 'scale(.55)'))
        motLan(E.goc, [{ transform: 'none' }, { transform: 'translateY(-34px) scale(.9,1.14)', offset: 0.22, easing: 'ease-out' }, { transform: 'translateY(-30px) scale(1,1)', offset: 0.45, easing: 'ease-in' }, { transform: 'translateY(0) scale(1.08,.92)', offset: 0.72 }, { transform: 'none' }], { duration: 760 })
        motLan(E.bong, BONG_NHAY, { duration: 760 })
        hienDao(E.than); sanh(1.4)
        for (let i = 0; i < 7; i++) hen(giotBan, 60 + i * 40)
      } },
    cham: { mau: 'hong', muc: 106, mat: 'cuoi', mi: 0, may: null, mieng: 'cuoiTo', tay: [100, -100], trong: 2, ngoai: 1, song: 2, theo: true, ma: 1.2,
      vao: () => {
        motLan(E.goc, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.16,.84)' }, { transform: 'scale(.9,1.12)' }, { transform: 'scale(1.06,.95)' }, { transform: 'scale(.98,1.02)' }, { transform: 'scale(1,1)' }], { duration: 650, easing: 'ease-out' })
        sanh(); tim(); hen(tim, 250); for (let i = 0; i < 3; i++) hen(botNgoai, i * 120)
        lapCuoi(900)
      } },
    chuoi: { mau: 'lua', muc: 106, mat: 'mo', mi: 0, may: null, mieng: 'cuoiTo', tay: [42, -95], than: { r: 4 }, nhin: [5, -1], trong: 1.5, ngoai: 0.6, song: 1.4,
      vao: (o) => {
        E.so.textContent = o.so ? String(o.so) : ''
        const [lx, ly] = o.gon ? [160, 64] : [214, 146]
        svg.querySelector('.bd-lua-vt')!.setAttribute('transform', o.gon ? 'translate(168 64) scale(.6)' : 'translate(214 200)')
        if (o.gon) { datTay(42, -140); nhin(3, -3) }
        hienDao(E.lua); if (!o.em) hopNho()
        hen(() => { nhin(0, 0); datMat('sao') }, 1100)
        lapHen(() => { if (!an) lapLanh(lx + ngau(-26, 26), ly + ngau(-30, 20)) }, 600)
      } },
    cup: { mau: 'sao', muc: 104, mat: 'sao', mi: 0, may: null, mieng: 'cuoiTo', tay: [140, -165], trong: 2, ngoai: 1.5, song: 1.6, ma: 1,
      vao: (o) => {
        hen(() => hienDao(E.cup), 180)
        if (!o.em) { hopNho(); for (let i = 0; i < 14; i++) hen(() => hoaGiay(), i * 30) }
        lap(E.tayL2, [{ transform: 'none' }, { transform: 'rotate(-25deg)' }], { duration: 350, direction: 'alternate', easing: 'ease-in-out' })
        lapHen(() => { if (!an) lapLanh(158 + ngau(-26, 26), 70 + ngau(-26, 20)) }, 500)
      } },
    'nhay-mua': { mau: 'sao', muc: 104, mat: 'sao', mi: 0, may: null, mieng: 'cuoiTo', tay: [140, -140], trong: 3, ngoai: 2, song: 2, ma: 1,
      vao: () => {
        lap(E.lac, [{ transform: 'translateY(0) rotate(-8deg)' }, { transform: 'translateY(-12px) rotate(0deg)' }, { transform: 'translateY(0) rotate(8deg)' }, { transform: 'translateY(-12px) rotate(0deg)' }, { transform: 'translateY(0) rotate(-8deg)' }], { duration: 1000, easing: 'ease-in-out' })
        lap(E.dd2, [{ transform: 'rotate(7deg)' }, { transform: 'rotate(0deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(0deg)' }, { transform: 'rotate(7deg)' }], { duration: 1000, delay: 120, easing: 'ease-in-out' })
        lap(E.bong, [{ transform: 'scale(1)' }, { transform: 'scale(.85)' }, { transform: 'scale(1)' }, { transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 1000 })
        lap(E.tayL2, [{ transform: 'none' }, { transform: 'rotate(-40deg)' }, { transform: 'none' }], { duration: 500 })
        lap(E.tayR2, [{ transform: 'rotate(40deg)' }, { transform: 'none' }, { transform: 'rotate(40deg)' }], { duration: 500 })
        lapHen(() => { if (!an) hoaGiay(100 + ngau(-60, 60), ngau(0, 40)) }, 180)
        let i = 0; lapHen(() => { i = (i + 1) % CAU_VONG.length; datMau(CAU_VONG[i]!) }, 650)
      } },
  }

  let thoAnim: Animation | null = null, songAnim: Animation | null = null
  thoAnim = E.tho.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(.99,1.025)' }], { duration: 1700, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' })
  songAnim = E.song.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-80px)' }], { duration: 2600, iterations: Infinity })

  // Nói: bong bóng gõ từng chữ, miệng đổi hình theo nguyên âm, đầu nhún nhẹ mỗi từ.
  function noiChu(chu: string, nhip: number, xong: () => void) {
    const ky = [...chu]
    let i = 0
    if (loi) { loi.textContent = ''; loi.classList.add('hien') }
    const buoc = () => {
      if (i >= ky.length) { datMieng(TTS[ten].mieng); xong(); return }
      const c = ky[i++]!
      if (loi) loi.textContent = ky.slice(0, i).join('')
      datMieng(hinhMieng(c))
      if (i === 1 || ky[i - 2] === ' ') motLan(E.goc, [{ transform: 'none' }, { transform: 'translateY(-3px) rotate(-1deg)' }, { transform: 'none' }], { duration: 220 })
      hen(buoc, /[,.!?…]/.test(c) ? 260 : nhip)
    }
    buoc()
  }

  function datTrangThai(t0: TrangThaiBi | string, o: TuyChonBi = {}) {
    const t = (BIET_DANH[t0] ?? t0) as TrangThaiBi
    const s = TTS[t]
    if (!s) return
    xoaHen(hens); dungLap(); anDao()
    if (loi && t !== 'noi' && !(t === 'gian' && o.chu)) loi.classList.remove('hien')
    E.co.forEach((c) => tf(c, ''))
    ten = t
    if (!THOANG.has(t) && t !== 'noi') { nen = t; nenTc = o }
    datMau(s.mau); datMuc(s.muc); datMat(s.mat); datMi(s.mi); datMay(s.may); datMieng(s.mieng); datTay(...s.tay); datThan(s.than); datMa(s.ma ?? 0.85)
    nhin(...(s.nhin ?? [0, 0]))
    tocTrong = s.trong; tocNgoai = s.ngoai
    songAnim?.updatePlaybackRate(s.song); thoAnim?.updatePlaybackRate(s.tho ?? 1)
    svg.setAttribute('data-trang-thai', t)
    s.vao?.(o)
    if (THOANG.has(t)) hen(() => datTrangThai(o.ve ?? nen, { ...nenTc, em: true }), t === 'cham' ? 1500 : 1700)
    else if (o.sau) hen(() => datTrangThai(o.ve ?? 'yen', { em: true }), o.sau)
    if (an) tatCa().forEach((a) => a.pause())
    tc.khiDoi?.(t)
  }

  // Chạm: ngủ ⇒ giật mình; chọc dồn 6 lần trong 3 giây ⇒ dỗi; còn lại nảy + cười khúc khích.
  let soCham: number[] = []
  const choc = () => {
    const luc = Date.now()
    soCham = soCham.filter((x) => luc - x < 3000); soCham.push(luc)
    if (ten === 'ngu') return datTrangThai('giat-minh')
    if (soCham.length >= 6) { soCham = []; return datTrangThai('gian', { chu: 'Đừng chọc nữa mà!', sau: 2600, ve: nen }) }
    datTrangThai('cham')
  }
  const vungCham = q('.bd-cham')
  vungCham.addEventListener('pointerdown', choc)

  hen(chop, ngau(1200, 3000), true)
  hen(daoMat, 1500, true)
  datTrangThai(tc.trangThai ?? 'yen', tc.tuyChon)

  return {
    datTrangThai,
    noi: (chu, o = {}) => datTrangThai('noi', { ...o, chu }),
    cham: choc,
    nhin: (dx, dy) => { luotTro = Date.now(); nhin(dx, dy) },
    get trangThai() { return ten },
    svg,
    huy() {
      xoaHen(hens); xoaHen(hensChung); clearInterval(nhipBot)
      window.removeEventListener('pointermove', theoTro)
      document.removeEventListener('visibilitychange', capNhatAn)
      vungCham.removeEventListener('pointerdown', choc)
      io?.disconnect()
      tatCa().forEach((a) => a.cancel())
      svg.remove(); loi?.remove()
    },
  }
}
