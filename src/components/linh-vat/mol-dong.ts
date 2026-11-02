// LINH VẬT «MOL» — MẶT BÌNH CẦU SỐNG ĐỘNG (thầy chốt 02/11: «Chốt Mol sống động và hiệu ứng gắn luôn vào app, đảm bảo máy siêu yếu cũng hoạt động được,
// tải luôn hiệu ứng sẵn cho máy yếu nhé»; bản trình diễn thầy duyệt = chuẩn hình + chuyển động). Mảnh NẠP LƯỜI: chỉ Bi.tsx / TrongHs.tsx gọi import('./mol-dong').
//   · GIỮ hình 01/11 (docs/ban-ve-mol-v2-0111): bình cầu + cổ + vành, màu mịn từ token (styles/mol.css), 3 bộ màu theo ngày VN (data-mol-mau), «6,022·10²³» ở dung
//     dịch bụng (ẩn < 64 px), giận đổi sắc (cáu / rất cáu) + nút bấc bung trên ngọn lửa, khung tròn cắt sát mặt (vòng Mục tiêu).
//   · MỘT BỘ KHUNG SVG dựng một lần; mỗi khung hình chỉ đổi thuộc tính (S() nhớ giá trị cũ ⇒ không ghi lại cái không đổi). Đổi mặt = mọi số chạy về bộ số
//     mới qua LÒ XO (mol-lo-xo.ts) ⇒ chuyển trộn; chuyển động riêng từng mặt trộn theo trọng số. Phần chỉ một số mặt cần (lửa, sao, tim, nốt nhạc, z, lệ…)
//     dựng LẦN ĐẦU cần rồi giữ lại (mặt vui đứng yên ≤ 130 nút SVG — luật tốc độ 28/10).
//   · PIN + MÁY YẾU: vòng rAF CHỈ chạy khi Mol đang hiện trên màn (IntersectionObserver) VÀ tab đang mở (visibilitychange) VÀ còn việc — đổi mặt, chạm, kéo,
//     dõi tay, hạt bay; lò xo lắng ⇒ TẮT VÒNG, nhàn rỗi giao cho CSS (thở · chớp · đảo mắt · sóng dung dịch · bọt · hiệu ứng mặt — chỉ transform / opacity).
//     Lúc bật / tắt vòng, tư thế CSS đang dừng được đọc lại (getComputedStyle) và tắt dần ⇒ không giật.
//     Máy yếu ('gon'): 30 khung/giây, ≤ 1/3 hạt, mắt chỉ nhìn chỗ chạm vào Mol, không kéo, bỏ gradient; nhàn rỗi KHÔNG hoạt ảnh CSS (0 rAF nền), chỉ chớp
//     mắt thưa bằng hẹn giờ. Giảm chuyển động ('tinh'): chỉ chuyển mặt. Cỡ nhỏ ('nho', < 64 px): mặt tĩnh + chớp CSS, KHÔNG vòng JS, không nghe sự kiện.
import '../../styles/mol.css'
import { gioMayChu } from '../../lib/gio-may-chu'
import { boMauMol } from '../../lib/mau-mol-ngay'
import type { DungGian, GocLua, Lua, TrangThaiLua, TuyChonLua } from './lua-dong'
import {
  BI_KEO, CUOI, ER, L, Lo, MAT, R, THONG_SO, Y, bienSong, chuKySong, daLang, datDich, docBo, duongMieng, duongSong, em, f, f1, f3,
  kep, maTranBong, maTranThan, mucNuoc, nenChay, nhipTim, soHat, tachMaTran, taoBoLo, thanCss, tienLo, type BoSo, type CheDoMol, type MatMol, type ThongSoCheDo,
} from './mol-lo-xo'

export type { CheDoMol, MatMol } from './mol-lo-xo'
export const VIEWBOX_MOL = '0 -26 200 230'
/** KHUNG TRÒN (vòng Mục tiêu góc phải — Bi khung="tron"). Thầy 01/11 tối: «phóng to sát mặt, mặt mắt miệng đầy vào khung, bỏ luôn cổ đi» ⇒ khung nhìn VUÔNG
 *  cắt sát CỤM MẶT; vòng tròn nội tiếp (tâm 100,110 · bán kính 57) nằm trọn trong quả cầu ⇒ thân chỉ còn là nền màu (giận: đỏ sẫm). */
export const VIEWBOX_MOL_TRON = '43 53 114 114'
/** Trạng thái cũ của Lửa ⇒ mặt Mol (giữ API: Bi.tsx truyền đúng các trạng thái này). */
export const MAT_THEO_TRANG_THAI: Readonly<Record<TrangThaiLua, MatMol>> = {
  yen: 'vui', cuoi: 'khen', chao: 'chao', vui: 'vui', combo: 'khen', buon: 'buon', nghi: 'nghi', covu: 'khen', ngu: 'ngu', choc: 'ngac',
  doi: 'doi', caunhau: 'buc', gian: 'cau', giam: 'ratCau',
}
/** Cấp giận 2–5 (src/lib/lua-cam-xuc.ts) ⇒ mặt Mol; thắng trạng thái thường. */
export const MAT_THEO_CAP: Readonly<Record<number, MatMol>> = { 2: 'doi', 3: 'buc', 4: 'cau', 5: 'ratCau' }
/** Lớp màu giận đặt trên nhóm bọc cả hình (styles/mol.css .mol-g2 … .mol-g5; màu chuyển dần nhờ @property). */
const LOP_GIAN: Partial<Record<MatMol, string>> = { doi: 'mol-g2', buc: 'mol-g3', cau: 'mol-g4', ratCau: 'mol-g5' }

const NS = 'http://www.w3.org/2000/svg'
const PSAO = 'M0 -11 L3 -3 L11 0 L3 3 L0 11 L-3 3 L-11 0 L-3 -3Z'
const PTIM = 'M0 9 C-15 -1 -11 -14 0 -6 C11 -14 15 -1 0 9Z'
const PLUA1 = 'M0 -30 C6 -22 15 -17 13 -6 C12 2 6 5 0 5 C-6 5 -13 2 -13 -6 C-13 -13 -8 -16 -5 -22 C-3 -18 -2 -17 -1 -18 C-2 -22 -2 -26 0 -30 Z'
const PLUA2 = 'M0 -17 C4 -12 8 -9 7 -3 C7 1 3 3 0 3 C-3 3 -7 1 -7 -3 C-7 -8 -3 -11 0 -17 Z'
const PNOT = '<path d="M3 -1 V-19 Q10 -16 12 -10" class="m-net-not" stroke-width="3"/><ellipse cx="0" cy="0" rx="4.5" ry="3.5" class="m-not"/>'
const SAO_VT = [[28, 44, 1], [172, 54, 0.8], [160, 24, 0.55]] as const
const TIM_VT = [[28, 50, 0.9], [172, 40, 1.1], [158, 12, 0.65]] as const
const NOT_VT = [[159, 23], [35, 41]] as const
/** Bọt trong dung dịch (x, sâu dưới mặt nước, bán kính, lớp nhịp) — mặt thường 2, cáu 3, rất cáu 5 (như hình tĩnh). */
const BOT = [[54, 10, 3.6, 'b1'], [148, 12, 2.6, 'b3'], [86, 0, 3.6, 'b2'], [140, 2, 3.8, 'b3'], [62, 4, 3.4, 'b1']] as const
const SO_BOT: Partial<Record<MatMol, number>> = { cau: 3, ratCau: 5 }

type ElNho = Element & { _m?: Record<string, string> }
/** Ghi thuộc tính chỉ khi giá trị đổi (khung hình đứng yên ⇒ 0 lần ghi DOM). */
function S(el: Element, a: string, v0: string | number): void { const v = String(v0), e = el as ElNho, c = (e._m ??= {}); if (c[a] !== v) { c[a] = v; el.setAttribute(a, v) } }
const an = (el: Element, hien: boolean) => S(el, 'display', hien ? 'inline' : 'none')
type KieuNho = CSSStyleDeclaration & { _m?: Record<string, string> }
/** Ghi một thuộc tính kiểu (style) chỉ khi đổi; '' ⇒ gỡ. */
function SS(st: CSSStyleDeclaration, k: string, v: string): void { const e = st as KieuNho, c = (e._m ??= {}); if (c[k] !== v) { c[k] = v; if (v) st.setProperty(k, v); else st.removeProperty(k) } }
const gioMay = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
/** Mờ vào – giữ – mờ ra theo tiến độ e ∈ [0, 1]. */
const mo = (e: number, a: number, b: number) => (e < a ? e / a : e > b ? 1 - (e - b) / (1 - b) : 1)
/** Chèn chuỗi SVG vào `cha` (trước `truoc`), dựng qua một <svg> tạm ⇒ đúng không gian tên SVG. */
function chen(cha: Element, html: string, truoc: Node | null = null): void {
  const t = document.createElementNS(NS, 'svg')
  t.innerHTML = html
  while (t.firstChild) cha.insertBefore(t.firstChild, truoc)
}

// ───────── KHUNG SVG (dựng một lần) ─────────
const matKhung = (x: number, s: 'L' | 'R', u: string) =>
  `<g data-k="e${s}" class="mol-chop mol-chop-${s}"><g data-k="es${s}"><circle cx="${x}" cy="${Y}" r="${ER}" class="m-trong m-vien-n"/>` +
  `<g data-k="dao${s}" class="mol-dao"><g data-k="pu${s}"><circle r="14" class="m-muc"/><circle cx="5.32" cy="-5.88" r="5.88" class="m-t"/><circle cx="-6.3" cy="5.88" r="2.52" class="m-t"/></g></g>` +
  `<g clip-path="url(#${u}e${s})"><path data-k="mt${s}" class="m-mi" stroke-width="3" d="M0 0"/><path data-k="md${s}" class="m-mi" stroke-width="2.6" d="M0 0"/></g>` +
  `</g><path data-k="cung${s}" class="m-net" stroke-width="5.5" opacity="0" d="M0 0"/></g>`
const khacChu = (u: string, lop: string, them = '') => `<text class="${lop}" font-size="14.4" text-anchor="middle"${them}><textPath href="#${u}kp" startOffset="50%">6,022·10<tspan dy="-5.4" font-size="9.4">23</tspan></textPath></text>`
function khungMol(u: string): string {
  // defs NẰM TRONG nhóm màu giận ⇒ điểm dừng gradient kế thừa biến của .mol-g4 / .mol-g5 (cả bình đổi sắc)
  return `<g data-k="nhom" class="mol-g0"><defs><clipPath id="${u}k"><circle cx="100" cy="120" r="76"/></clipPath>` +
    `<clipPath id="${u}eL"><circle cx="${L}" cy="${Y}" r="${ER}"/></clipPath><clipPath id="${u}eR"><circle cx="${R}" cy="${Y}" r="${ER}"/></clipPath>` +
    `<clipPath id="${u}mc"><path data-k="mclip" d="M0 0"/></clipPath>` +
    `<radialGradient id="${u}q" cx=".38" cy=".3" r=".78" fx=".33" fy=".25"><stop offset="0" class="s-sang"/><stop offset=".52" class="s-x"/><stop offset="1" class="s-toi"/></radialGradient>` +
    `<linearGradient id="${u}c" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="s-sang"/><stop offset=".5" class="s-x"/><stop offset="1" class="s-toi"/></linearGradient>` +
    `<linearGradient id="${u}l" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="s-nuoc-sang"/><stop offset=".35" class="s-nuoc"/><stop offset="1" class="s-nuoc-toi"/></linearGradient>` +
    `<radialGradient id="${u}h"><stop offset="0" class="s-bong-sang"/><stop offset="1" class="s-bong-sang0"/></radialGradient>` +
    `<radialGradient id="${u}m"><stop offset="0" class="s-ma"/><stop offset="1" class="s-ma0"/></radialGradient>` +
    `<path id="${u}kp" d="M56 172 A66 66 0 0 0 144 172" fill="none"/></defs>` +
    `<ellipse data-k="bong" cx="100" cy="199" rx="50" ry="5.5" class="m-bong"/>` +
    `<g data-k="root"><g data-k="dong" class="mol-dong"><g class="mol-tho"><g data-k="than" class="mol-than">` +
    `<rect x="80" y="12" width="40" height="44" rx="6" fill="url(#${u}c)" class="mol-co"/>` +
    `<g data-k="nut"><g class="mol-nut"><rect x="85" y="-6" width="30" height="18" rx="7" class="m-nut"/><rect x="88" y="-4" width="12" height="4" rx="2" class="m-nut-sang"/><circle cx="106" cy="3" r="1.6" class="m-nut-toi"/><circle cx="94" cy="6" r="1.3" class="m-nut-toi"/></g></g>` +
    `<rect x="73" y="8" width="54" height="13" rx="6.5" class="m-vanh"/><rect x="77" y="10" width="22" height="3" rx="1.5" class="m-sang"/>` +
    `<circle cx="100" cy="120" r="76" fill="url(#${u}q)" class="mol-cau"/>` +
    `<g clip-path="url(#${u}k)"><g data-k="nghieng"><g data-k="song" class="mol-song"><path data-k="nuoc" fill="url(#${u}l)" class="mol-nuoc-l" d="M0 0"/><path data-k="matnuoc" class="m-mat-nuoc" stroke-width="2.6" d="M0 0"/></g></g>` +
    BOT.map(([, , r, b], i) => `<circle data-k="bot${i}" r="${r}" class="m-bot mol-bot ${b}"/>`).join('') +
    `<path d="M152 162 A76 76 0 0 1 110 195" class="m-anh-vien" stroke-width="4"/></g>` +
    `<g class="mol-khac">${khacChu(u, 'm-khac-bong', ' transform="translate(0 1)"')}${khacChu(u, 'm-khac')}</g>` +
    `<g data-k="pc"><ellipse cx="62" cy="70" rx="22" ry="12" fill="url(#${u}h)" transform="rotate(-36 62 70)" class="mol-kinh"/><circle cx="48" cy="96" r="3.4" class="m-sang"/></g>` +
    `<g data-k="ma"><ellipse data-k="maL" cx="47" cy="130" rx="15" ry="9" fill="url(#${u}m)" class="mol-ma"/><ellipse data-k="maR" cx="153" cy="130" rx="15" ry="9" fill="url(#${u}m)" class="mol-ma"/></g>` +
    `<g data-k="mat">${matKhung(L, 'L', u)}${matKhung(R, 'R', u)}</g>` +
    `<g data-k="may"><path data-k="myL" class="m-net" d="M0 0" opacity="0"/><path data-k="myR" class="m-net" d="M0 0" opacity="0"/></g>` +
    `<g data-k="mui"><circle cx="100" cy="128" r="7" class="m-cam"/><circle cx="97.6" cy="125.6" r="2.2" class="m-camS"/></g>` +
    `<g data-k="mieng"><g class="mol-mieng"><path data-k="mi" class="m-mieng m-mieng-n" d="M0 0"/><g clip-path="url(#${u}mc)"><ellipse data-k="luoi" class="m-luoi" rx="1" ry="1" opacity="0"/></g></g></g>` +
    `</g></g></g><g data-k="hat"></g></g></g>`
}
/** Phần chỉ một số mặt cần — dựng lần đầu cần, giữ lại (ẩn khi không dùng). */
type Phan = 'lua' | 'glow' | 'tim' | 'sao' | 'timfx' | 'not' | 'hoi' | 'ngac' | 'nhiet' | 'z' | 'le' | 'puff' | 'ngma'
const PHAN_MAT: Readonly<Record<MatMol, readonly Phan[]>> = {
  vui: [], khen: ['sao'], chao: [], nghi: ['hoi'], ngac: ['ngac'], buon: ['le'], ngu: ['z'], doi: ['puff'], buc: [], cau: ['lua'], ratCau: ['lua', 'glow', 'nhiet'],
  nguong: ['sao', 'ngma'], me: ['tim', 'timfx'], nhay: ['sao', 'not'], tuTin: ['sao'],
}

// ───────── BỘ ĐIỀU PHỐI CHUNG (một vòng rAF cho mọi Mol đang thức; một bộ quan sát hiện / khuất; một bộ nghe tay) ─────────
const SONG = new Set<MayMol>()
const THUC = new Set<MayMol>()
let hen = 0
function henKhung(): void { if (!hen && THUC.size && typeof requestAnimationFrame === 'function') hen = requestAnimationFrame(chayKhung) }
function chayKhung(ms: number): void { hen = 0; for (const m of Array.from(THUC)) m.khung(ms); henKhung() }
/** Mol cuối cùng vừa ngủ / huỷ ⇒ bỏ luôn khung đã hẹn (không thừa một lượt rAF). */
function boKhungThua(): void { if (!THUC.size && hen) { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(hen); hen = 0 } }
let io: IntersectionObserver | null = null
const theoDoi = new Map<Element, MayMol>()
let ngheTab = false
const tay = { x: 0, y: 0, luc: -99, co: false, cuon: -99 }
let soCanTay = 0
function tayDi(e: PointerEvent): void {
  const t = gioMay()
  if (e.pointerType === 'touch' && t - tay.cuon < 0.3) return // đang vuốt cuộn: mắt không đuổi theo (không chen việc vào khung cuộn)
  tay.x = e.clientX; tay.y = e.clientY; tay.luc = t; tay.co = true
  for (const m of SONG) m.coTay(e.type === 'pointerdown')
}
const cuonTrang = () => { tay.cuon = gioMay(); tay.co = false }
const roiTay = () => { tay.co = false }
function ngheTay(bat: boolean): void {
  soCanTay = Math.max(0, soCanTay + (bat ? 1 : -1))
  const w = window, o = { passive: true } as const
  if (bat && soCanTay === 1) {
    w.addEventListener('pointermove', tayDi, o); w.addEventListener('pointerdown', tayDi, o); w.addEventListener('pointercancel', roiTay, o)
    w.addEventListener('scroll', cuonTrang, { passive: true, capture: true }); document.documentElement.addEventListener('pointerleave', roiTay)
  } else if (!bat && soCanTay === 0) {
    w.removeEventListener('pointermove', tayDi); w.removeEventListener('pointerdown', tayDi); w.removeEventListener('pointercancel', roiTay)
    w.removeEventListener('scroll', cuonTrang, { capture: true }); document.documentElement.removeEventListener('pointerleave', roiTay)
  }
}

interface Hat { el: SVGElement; loai: string; t0: number; song: number; dung: boolean; fn: (el: SVGElement, e: number) => void }
interface TuyChonMol { trangThai?: TrangThaiLua; tuyChon?: TuyChonLua; tinh?: boolean; goc?: GocLua; cheDo?: CheDoMol; keo?: boolean; mat?: MatMol }
const DE_KEO_GIAN: BoSo = { gazeW: 0.3 }

class MayMol implements Lua {
  readonly svg: SVGSVGElement
  private k: Record<string, SVGElement> = {}
  private u: string
  private vb: number[]
  private cheDo: CheDoMol
  private ts: ThongSoCheDo
  private tt: TrangThaiLua
  private capGian = 0
  private matCo?: MatMol
  private matCu: MatMol
  private tamThoi: MatMol | null = null
  private nhinGoc: number
  private lo: Record<string, Lo>
  private dsLo: Lo[]
  private P: BoSo = {}
  // thân: vị trí (kéo), co giãn, xoay, mắt, mặt trượt theo mắt, nghiêng nước, mày giật, biên độ chuyển động riêng, trao tay từ CSS
  private posX = new Lo(0, 600, 0.8); private posY = new Lo(0, 600, 0.8); private sxS = new Lo(1, 260, 0.3); private syS = new Lo(1, 260, 0.3)
  private rotS = new Lo(0, 150, 0.32); private rotD = new Lo(0, 160, 0.4); private gx = new Lo(0, 340, 0.9); private gy = new Lo(0, 340, 0.9)
  private fsx = new Lo(0, 75, 0.78); private fsy = new Lo(0, 75, 0.78); private ang = new Lo(0, 40, 0.22); private bmay = new Lo(0, 300, 0.5)
  private amp = new Lo(0, 60, 1)
  private hX = new Lo(0, 90, 1); private hY = new Lo(0, 90, 1); private hR = new Lo(0, 90, 1); private hSX = new Lo(1, 90, 1); private hSY = new Lo(1, 90, 1)
  private hPx = new Lo(0, 120, 1); private hPy = new Lo(0, 120, 1)
  private dsThan: Lo[]
  private dsThanCung: Lo[]
  private jumpY = 0; private jumpV = 0; private waveA = 0
  private cuoi = 0; private cuoi0 = 0; private deCuoi: BoSo = CUOI; private chamDon: number[] = []
  private chop = { t0: -9, t1: -9, next: 0 }
  private keo: { id: number; x0: number; y0: number; bx: number; by: number; lx: number; ly: number; lt: number; vx: number; vy: number; dang: boolean } | null = null
  private boClick = 0
  private hien = true; private tabMo = true; private dangThuc = false
  private lanVe = -1e9; private tCu = 0; private lech = 0
  /** Khoảng tối thiểu giữa hai khung vẽ của RIÊNG Mol này (máy yếu 33; máy thường 0, tự lên 33 nếu khung thật chậm). */
  private khungMs = 0; private rafTruoc = 0; private khungCham = 0
  private khoaDich = ''; private khoaNuoc = ''; private coSlosh = false
  private hat: Hat[] = []
  private rect: DOMRect | null = null; private canRect = true; private rectX = 0; private rectY = 0
  private henSau = 0; private henNoi = 0; private henTam = 0; private henChop = 0; private henMo = 0
  private daPhan = new Set<Phan>()
  private hop: HTMLElement | null = null
  private nghe: [EventTarget, string, EventListener, AddEventListenerOptions?][] = []

  constructor(noiGan: HTMLElement, tc: TuyChonMol) {
    const svg = document.createElementNS(NS, 'svg')
    this.svg = svg
    const tron = noiGan.dataset.khung === 'tron'
    svg.setAttribute('viewBox', tron ? VIEWBOX_MOL_TRON : VIEWBOX_MOL) // khung tròn ⇒ cắt sát mặt
    this.vb = (tron ? VIEWBOX_MOL_TRON : VIEWBOX_MOL).split(' ').map(Number)
    svg.setAttribute('class', 'lua-svg mol-svg')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    this.cheDo = tc.cheDo ?? (tc.tinh ? 'tinh' : 'day-du')
    this.ts = THONG_SO[this.cheDo]
    this.khungMs = this.ts.khungMs
    svg.setAttribute('data-che-do', this.cheDo)
    if (this.cheDo === 'tinh') svg.setAttribute('data-tinh', '')
    this.u = `mol${++soMol}_`
    svg.innerHTML = khungMol(this.u)
    this.gom(svg)
    noiGan.appendChild(svg)
    // THÂN TRÊN THẺ CHỨA (đo CPU ×6: dời / xoay / co giãn nhóm SVG bắt trình duyệt dựng lại bố cục cả hình mỗi khung): lúc vòng JS chạy, nhảy / nảy / lắc / kéo
    // đặt bằng translate · rotate · scale của CSS trên thẻ chứa <span> (lớp riêng — bộ tổng hợp dời, không dựng lại SVG); nghỉ ⇒ trả về thuộc tính SVG như cũ
    // (ảnh tĩnh / biểu tượng tab chụp đúng tư thế). Ba thuộc tính này cộng với transform sẵn có của thẻ chứa (vd. Mol soi gương scaleX(-1)) — không đè.
    // Trình duyệt cũ chưa có translate / rotate / scale riêng ⇒ thuộc tính SVG suốt.
    this.hop = !tron && this.cheDo !== 'nho' && typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('translate', '1px') && CSS.supports('rotate', '1deg') && CSS.supports('scale', '1') ? noiGan : null
    if (this.hop) this.hop.style.transformOrigin = '50% 96.52%' // gốc thân (100, 196) của khung 0 −26 200 230
    this.nhinGoc = tc.goc === 'phai' ? 6 : tc.goc === 'trai' ? -6 : 0
    this.tt = tc.trangThai ?? 'chao'
    this.matCo = tc.mat
    this.matCu = this.matHT()
    this.lo = taoBoLo(this.matCu)
    this.dsLo = Object.values(this.lo)
    this.dsThan = [this.posX, this.posY, this.sxS, this.syS, this.rotS, this.rotD, this.gx, this.gy, this.fsx, this.fsy, this.ang, this.bmay, this.hX, this.hY, this.hR, this.hSX, this.hSY, this.hPx, this.hPy]
    this.dsThanCung = this.dsThan.filter((l) => l !== this.ang) // nước sánh (ang) lắng lâu: xét riêng với ngưỡng rộng hơn (lệch ≤ 1° không thấy)
    this.tCu = this.gio()
    this.chop.next = this.tCu + rnd(1.6, 3.5)
    SONG.add(this)
    if (this.ts.vong) this.ganNghe(tc.keo === true && this.ts.keo)
    this.datTinh(this.matCu)
    this.veTinh()
    if (tc.tuyChon?.sau && tc.tuyChon.ve) { const ve = tc.tuyChon.ve; this.henSau = window.setTimeout(() => this.datTrangThai(ve), tc.tuyChon.sau) }
    this.henChopThua()
  }
  private gio(): number { return gioMay() + this.lech }
  private gom(goc: Element): void { goc.querySelectorAll<SVGElement>('[data-k]').forEach((e) => { this.k[e.dataset.k!] = e }) }
  private matHT(): MatMol { return this.tamThoi ?? MAT_THEO_CAP[this.capGian] ?? this.matCo ?? MAT_THEO_TRANG_THAI[this.tt] ?? 'vui' }

  // ── nghe sự kiện (chỉ chế độ có vòng) ──
  private on(t: EventTarget, ten: string, fn: EventListener, o?: AddEventListenerOptions): void { t.addEventListener(ten, fn, o); this.nghe.push([t, ten, fn, o]) }
  private ganNghe(keo: boolean): void {
    const svg = this.svg
    if (keo) {
      svg.setAttribute('data-keo', '')
      this.on(svg, 'pointerdown', ((e: PointerEvent) => this.batKeo(e)) as EventListener)
      this.on(svg, 'pointermove', ((e: PointerEvent) => this.diKeo(e)) as EventListener)
      this.on(svg, 'pointerup', ((e: PointerEvent) => this.thaKeo(e)) as EventListener)
      this.on(svg, 'pointercancel', ((e: PointerEvent) => { tay.co = false; this.thaKeo(e) }) as EventListener) // trình duyệt nhận vuốt dọc để cuộn
      // vừa kéo xong ⇒ nuốt cú «click» kèm theo (không mở lại bong bóng / không tính là chạm)
      this.on(svg, 'click', ((e: Event) => { if (this.gio() < this.boClick) { e.stopPropagation(); e.preventDefault() } }) as EventListener, { capture: true })
    } else {
      this.on(svg, 'pointerdown', ((e: PointerEvent) => { if (!this.ts.doiMat) { tay.x = e.clientX; tay.y = e.clientY; tay.luc = this.gio() - this.lech; tay.co = true } }) as EventListener, { passive: true })
      this.on(svg, 'click', (() => this.cham()) as EventListener)
    }
    if (this.ts.doiMat) ngheTay(true)
    if (typeof IntersectionObserver === 'function') {
      io ??= new IntersectionObserver((ds) => { for (const d of ds) theoDoi.get(d.target)?.datHien(d.isIntersecting) }, { rootMargin: '48px' })
      theoDoi.set(svg, this)
      io.observe(svg)
    }
    if (!ngheTab && typeof document !== 'undefined') {
      ngheTab = true
      document.addEventListener('visibilitychange', () => { const moTab = !document.hidden; for (const m of SONG) m.datTab(moTab) })
    }
    this.tabMo = typeof document === 'undefined' || !document.hidden
  }
  datHien(h: boolean): void {
    if (this.hien === h) return
    this.hien = h
    if (h) { this.svg.removeAttribute('data-khuat'); this.henChopThua() } else { this.svg.setAttribute('data-khuat', ''); if (this.dangThuc) this.ngu() }
  }
  datTab(moTab: boolean): void { this.tabMo = moTab; if (!moTab && this.dangThuc) this.ngu(); if (moTab) this.henChopThua() }
  /** Tay / chuột vừa di (dõi mắt liên tục — chỉ máy thường). Chạm xuống chỗ khác ⇒ thức sau 90 ms (không chen vào khung phản hồi của nút vừa bấm). */
  coTay(xuong: boolean): void {
    if (!this.ts.doiMat || !this.hien || !this.tabMo) return
    if (xuong) { window.clearTimeout(this.henMo); this.henMo = window.setTimeout(() => { if (gioMay() - tay.cuon > 0.3) this.danhThuc() }, 90) } else this.danhThuc()
  }

  // ── vòng khung ──
  private conViecDuoc(): boolean { return nenChay({ hien: this.hien, tabMo: this.tabMo, cheDo: this.cheDo, conViec: true }) }
  private danhThuc(): void {
    if (this.dangThuc || !this.conViecDuoc()) return
    if (this.cheDo === 'day-du' && document.documentElement.classList.contains('may-yeu')) this.doiCheDo('gon') // máy vừa bị đo là yếu giữa chừng
    this.dangThuc = true
    if (this.ts.cssNhanRoi) this.traoTayTuCss()
    this.svg.setAttribute('data-song', '')
    if (this.hop) this.hop.style.willChange = 'transform'
    this.tCu = this.gio()
    this.lanVe = -1e9
    this.chop.next = Math.max(this.chop.next, this.tCu + rnd(1.5, 4))
    this.amp.t = 1
    THUC.add(this)
    henKhung()
  }
  private doiCheDo(cd: CheDoMol): void { this.cheDo = cd; this.ts = THONG_SO[cd]; this.khungMs = this.ts.khungMs; this.svg.setAttribute('data-che-do', cd); if (!this.ts.doiMat) { ngheTay(false) } }
  /** Nhận lại tư thế CSS đang chạy (thân lắc / nhún, con ngươi đảo) để vòng JS đi tiếp từ đúng chỗ ấy rồi tắt dần. (Sóng nền: CSS trượt suốt, JS chỉ đổi hình.) */
  private traoTayTuCss(): void {
    try {
      const d = tachMaTran(getComputedStyle(this.k.dong!).transform), p = tachMaTran(getComputedStyle(this.k.daoL!).transform)
      this.hX.v = d.x; this.hY.v = d.y; this.hR.v = d.r; this.hSX.v = d.sx; this.hSY.v = d.sy
      this.hPx.v = p.x; this.hPy.v = p.y
    } catch { /* không đọc được: đi tiếp từ tư thế đứng */ }
  }
  khung(ms: number): void {
    const gap = ms - this.rafTruoc
    this.rafTruoc = ms
    // máy thường mà khung thật hay trễ (≥ ~12 % khung > 22 ms, trung bình trượt) ⇒ tự hạ 30 khung/giây cho Mol này (không giật thay vì cố 60)
    if (this.khungMs === 0 && gap > 0 && gap < 120) { this.khungCham = this.khungCham * 0.92 + (gap > 22 ? 1 : 0); if (this.khungCham > 0.6) this.khungMs = 33 }
    // chỉ còn mắt dõi tay (không đổi mặt / nảy / hạt / kéo) ⇒ 30 khung/giây là đủ mượt cho con ngươi
    const kms = this.chiNhin ? Math.max(33, this.khungMs) : this.khungMs
    if (kms > 0 && ms - this.lanVe < kms - 4) return
    const now = ms / 1000 + this.lech, dt = Math.min(0.05, Math.max(0.001, now - this.tCu))
    this.lanVe = ms; this.tCu = now
    this.buocMo(now, dt)
    this.xetNgu(now)
  }
  /** Hết việc (lò xo mặt lắng, không nhảy / hạt / kéo / dõi tay) ⇒ tắt dần biên độ chuyển động riêng; thân + nước lắng hẳn ⇒ tắt vòng. */
  private xetNgu(now: number): void {
    if (this.conViec(now)) { this.amp.t = 1; return }
    this.amp.t = 0
    if (this.amp.v < 0.03 && this.waveA < 0.3 && daLang(this.dsThanCung, 0.006) && Math.abs(this.ang.v - this.ang.t) < 0.02 && Math.abs(this.ang.vel) < 0.12) this.ngu()
  }
  private dangNhin(now: number): boolean { return tay.co && now - this.lech - tay.luc < (this.ts.doiMat ? 2.8 : 1.1) && now - this.lech - tay.cuon > 0.3 && (this.ts.doiMat || this.cheDo === 'gon') }
  private conViec(now: number): boolean {
    const khac = !!this.keo || now < this.cuoi || now < this.chop.t1 + 0.2 || now < this.chop.t0 + 0.2 || this.jumpY < 0 || this.jumpV < 0 || this.waveA > 0.3 ||
      this.hat.some((h) => h.dung) || !daLang(this.dsLo, 0.01)
    const nhin = this.dangNhin(now)
    this.chiNhin = nhin && !khac
    return khac || nhin
  }
  private chiNhin = false
  /** Tắt vòng: chốt mọi lò xo vào đích, vẽ tư thế đứng (sóng rộng cho CSS trượt), trả nhàn rỗi cho CSS. */
  private ngu(): void {
    THUC.delete(this)
    boKhungThua()
    this.dangThuc = false
    this.keo = null
    this.chotHet()
    this.ve(this.tCu, 0, true)
    for (const h of this.hat) if (h.dung) { h.dung = false; an(h.el, false) }
    this.svg.removeAttribute('data-song')
    if (this.hop) this.hop.style.willChange = ''
    this.henChopThua()
  }
  private chotHet(): void {
    const T = MAT[this.matHT()]
    datDich(this.lo, this.matHT()); this.khoaDich = ''
    this.posX.t = this.posY.t = this.rotD.t = this.gx.t = this.gy.t = 0; this.sxS.t = this.syS.t = 1
    this.fsx.t = T.facex!; this.fsy.t = T.facey!
    this.ang.t = -((this.nghiengTinh(T) * Math.PI) / 180) * 0.9
    for (const l of this.dsLo) l.chot()
    for (const l of this.dsThan) { l.t = l === this.hSX || l === this.hSY ? 1 : l.t; if (l === this.hX || l === this.hY || l === this.hR || l === this.hPx || l === this.hPy || l === this.rotS || l === this.bmay) l.t = 0; l.chot() }
    this.amp.t = 0; this.amp.chot()
    this.jumpY = this.jumpV = 0; this.waveA = 0
    docBo(this.lo, this.P)
  }
  /** Không vòng (cỡ nhỏ / đang khuất / tĩnh): vẽ thẳng tư thế đứng của mặt hiện tại. */
  private veTinh(): void { this.chotHet(); this.ve(this.tCu, 0, true) }
  /** Nghiêng tĩnh của thân theo mặt (nghĩ nghiêng đầu, ngủ gục, dỗi quay đi, buồn chùng). */
  private nghiengTinh(P: BoSo): number { return -7 * P.wNghi! + 2.5 * P.wBuon! + 5 * P.wNgu! - 5 * P.wDoi! + P.facex! * 0.7 }

  private buocMo(now: number, dt: number): void {
    const ts = this.ts, am = ts.nay ? 1 : 0.25, PI = Math.PI, P = this.P
    const mat = this.matHT(), T = MAT[mat], keo = this.keo?.dang, cuoi = now < this.cuoi
    const khoa = `${mat}|${keo ? 'k' : cuoi ? `c${this.cuoi0}` : ''}`
    if (khoa !== this.khoaDich) { this.khoaDich = khoa; datDich(this.lo, mat, keo ? (T.gian! >= 2 ? DE_KEO_GIAN : BI_KEO) : cuoi ? this.deCuoi : undefined) }
    // mắt dõi theo tay / chuột (máy yếu: chỉ chỗ vừa chạm vào Mol)
    let tx = 0, ty = 0
    if (this.dangNhin(now)) {
      if (this.canRect || !this.rect) { this.rect = (this.svg.parentElement ?? this.svg).getBoundingClientRect(); this.canRect = false; this.rectX = this.dongF.X; this.rectY = this.dongF.Y }
      const q = this.rect, s = q.width / this.vb[2]!
      if (s > 0) {
        // thân trên thẻ chứa: khung đo đã gồm phần dời lúc đo ⇒ chỉ cộng phần dời thêm từ đó
        const bx = this.hop ? this.dongF.X - this.rectX : this.posX.v, by = this.hop ? this.dongF.Y - this.rectY : this.posY.v + this.jumpY
        const px = this.vb[0]! + (tay.x - q.left) / s, py = this.vb[1]! + (tay.y - q.top) / s
        const dx = px - (100 + bx), dy = py - (98 + by), d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / 105)
        tx = (dx / d) * m; ty = (dy / d) * m * 0.9
      }
    } else this.canRect = true
    this.gx.t = tx; this.gy.t = ty
    if (now >= this.chop.next && ts.nay) this.datChop(now, Math.random() < 0.2)
    // kéo: nghiêng theo quán tính + giãn theo hướng kéo
    const k = this.keo
    if (k?.dang) {
      k.vx *= Math.exp(-dt * 7); k.vy *= Math.exp(-dt * 7)
      this.rotD.t = kep(k.vx * 0.035, -26, 26)
      const sp = Math.hypot(k.vx, k.vy), st = Math.min(0.13, sp * 0.00016), ax = Math.abs(k.vx) / (sp || 1), ay = Math.abs(k.vy) / (sp || 1)
      this.sxS.t = 1 + st * ax - st * 0.5 * ay; this.syS.t = 1 + st * ay - st * 0.5 * ax
    } else { this.rotD.t = 0; this.sxS.t = 1; this.syS.t = 1 }
    // nhảy: rơi tự do, đáp đất bẹp (thạch)
    if (this.jumpY < 0 || this.jumpV < 0) {
      this.jumpV += 1500 * dt; this.jumpY += this.jumpV * dt
      if (this.jumpY >= 0) { const v = this.jumpV; this.jumpY = 0; this.jumpV = 0; this.syS.vel -= v * 0.011 * am; this.sxS.vel += v * 0.009 * am; this.waveA += v * 0.012 }
    }
    const zMin = ts.nay ? 0 : 1
    tienLo(this.dsLo, dt, zMin); tienLo(this.dsThan, dt, zMin); tienLo([this.amp], dt)
    docBo(this.lo, P)
    this.fsx.t = this.gx.v * 5 * P.gazeW! + P.facex!; this.fsy.t = this.gy.v * 3.2 * P.gazeW! + P.facey!
    // chuyển động riêng từng mặt: phần TĨNH (nghiêng, chùng) theo trọng số; phần LẶP × biên độ (tắt dần trước khi trả cho CSS)
    const ts0 = now - this.tTT, A = this.amp.v * am
    let y = 0, r = 0, sx = 1, sy = 1, shx = 0, shy = 0
    y += 7 * P.wBuon!; sy *= 1 - 0.035 * P.wBuon!; sx *= 1 + 0.02 * P.wBuon!
    y += 3 * P.wNgu!; sy *= 1 - 0.025 * P.wNguong!; y += 2 * P.wNguong!
    r += this.nghiengTinh(P) - P.facex! * 0.7
    if (A > 0.002) {
      if (P.wKhen! > 0.002) { const ph = (ts0 * 1.15) % 1, air = ph < 0.62 ? Math.sin((PI * ph) / 0.62) : 0, land = ph >= 0.62 && ph < 0.86 ? Math.sin((PI * (ph - 0.62)) / 0.24) : 0, w = P.wKhen! * A; y -= 17 * air * w; sy *= 1 + w * (0.05 * air - 0.08 * land); sx *= 1 + w * (-0.03 * air + 0.07 * land) }
      r += 7 * Math.sin((ts0 * 2 * PI) / 1.3) * P.wLac! * A; y -= 2.5 * Math.abs(Math.sin((ts0 * 2 * PI) / 1.3)) * P.wLac! * A
      r += 1.5 * Math.sin(now * 1.4) * A * P.wNghi! + 1.2 * Math.sin(now * 0.9) * A * P.wNgu! + Math.sin(now * 2) * A * P.wDoi!
      if (P.wBuc! > 0.002) { const ph = (ts0 / 1.5) % 1, s = ph < 0.14 ? Math.sin((PI * ph) / 0.14) : 0; y -= 5 * s * P.wBuc! * A; if (ph > 0.14 && ph < 0.34) shx += Math.sin(now * 60) * 1.4 * P.wBuc! * A }
      r += 2.3 * Math.sin((now * 2 * PI) / 0.5) * P.wCau! * A; shx += 0.5 * Math.sin(now * 37) * P.wCau! * A
      shx += (Math.sin(now * 71) * 1.6 + Math.sin(now * 53) * 1.1) * P.wRat! * A; shy += Math.sin(now * 61) * 1.1 * P.wRat! * A; r += 1.4 * Math.sin(now * 47) * P.wRat! * A
      r += 4 * Math.sin(now * 1.7) * P.wMe! * A; y -= 3 * Math.abs(Math.sin(now * 1.7)) * P.wMe! * A
      if (P.wNhay! > 0.002) { const ph = (ts0 * 2) % 1, up = Math.sin(PI * ph), w = P.wNhay! * A, c = (1 - up) ** 6; y -= 13 * up * w; sy *= 1 - 0.08 * c * w + 0.03 * up * w; sx *= 1 + 0.07 * c * w - 0.02 * up * w; r += 7 * Math.sin(PI * ts0 * 2) * w }
      r += 3 * Math.sin(now * 2.2) * P.wNguong! * A
    }
    if (now < this.cuoi) { const e = now - this.cuoi0, d = Math.max(0, 1 - e / 0.95); r += Math.sin(e * 2 * PI * 8) * 3.5 * d * am; y -= Math.abs(Math.sin(e * 2 * PI * 4)) * 3 * d * am }
    const lun = Math.max(0, this.posY.v); sy *= 1 - lun * 0.006; sx *= 1 + lun * 0.005
    const nghieng = this.rotD.v + this.rotS.v + r + this.hR.v
    this.ang.t = -((nghieng * PI) / 180) * 0.9 - (k?.dang ? k.vx * 0.0005 : 0)
    this.waveA *= Math.exp(-dt * 1.9); if (this.waveA > 9) this.waveA = 9
    this.dongF = { X: this.posX.v + shx + this.hX.v, Y: Math.min(this.posY.v, 0) + this.jumpY + y + shy + this.hY.v, r: this.rotS.v + r + this.fsx.v * 0.7 + this.hR.v, sx: this.sxS.v * sx * this.hSX.v, sy: this.syS.v * sy * this.hSY.v }
    this.ve(now, this.blinkLuc(now), false)
    // hạt CHỈ bung theo sự kiện (đổi mặt, chạm) — z / lệ / tim / nốt nhạc / hơi nóng lặp bằng CSS ⇒ vòng không bị hạt giữ thức mãi
    this.chayHat(now)
  }
  private dongF = { X: 0, Y: 0, r: 0, sx: 1, sy: 1 }
  private tTT = 0
  private blinkLuc(now: number): number {
    const bc = (e: number) => (e < 0 || e > 0.17 ? 0 : e < 0.065 ? em(0, 1, e / 0.065) : 1 - em(0, 1, (e - 0.065) / 0.105))
    return Math.max(bc(now - this.chop.t0), bc(now - this.chop.t1))
  }
  private datChop(now: number, doi: boolean): void { this.chop.t0 = now; this.chop.t1 = doi ? now + 0.24 : -9; this.chop.next = now + rnd(2.2, 5.5) }
  /** Máy yếu nhàn rỗi: chớp mắt thưa bằng hẹn giờ (đổi một thuộc tính, mở lại sau 130 ms) — không rAF, không hoạt ảnh CSS. */
  private henChopThua(): void {
    if (!this.ts.chopHen || this.henChop) return
    const lan = () => {
      this.henChop = 0
      if (!this.hien || !this.tabMo || !SONG.has(this) || !this.ts.chopHen) return
      const m = MAT[this.matHT()]
      if (!this.dangThuc && m.eoL! > 0.5) { this.svg.setAttribute('data-chop', ''); window.setTimeout(() => this.svg.removeAttribute('data-chop'), 130) }
      this.henChop = window.setTimeout(lan, rnd(3200, 6200))
    }
    this.henChop = window.setTimeout(lan, rnd(2400, 5200))
  }

  // ── VẼ một khung (nghi = tư thế đứng: sóng rộng cho CSS trượt) ──
  private ve(now: number, blink: number, nghi: boolean): void {
    const k = this.k, p = this.P, t = now
    const F = nghi ? { X: 0, Y: 2 * p.wNguong! + 7 * p.wBuon! + 3 * p.wNgu!, r: this.nghiengTinh(p), sx: 1 + 0.02 * p.wBuon!, sy: (1 - 0.035 * p.wBuon!) * (1 - 0.025 * p.wNguong!) } : this.dongF
    if (nghi) this.dongF = F
    const nang = Math.max(0, -F.Y), sb = kep(1 - nang / 170, 0.35, 1.15), hop = this.hop
    if (hop && !nghi) {
      const c = thanCss(F.X, F.Y, this.rotD.v, F.r), st = hop.style, sx = f3(F.sx), sy = f3(F.sy)
      SS(st, 'translate', `${f(c.tx / 2)}% ${f(c.ty / 2.3)}%`); SS(st, 'rotate', `${f1(c.rot)}deg`); SS(st, 'scale', `${sx} ${sy}`)
      S(k.root!, 'transform', 'translate(0 0)'); S(k.than!, 'transform', 'translate(0 0)')
      const m = maTranBong(maTranThan(f(c.tx / 2) * 2, f(c.ty / 2.3) * 2.3, f1(c.rot), sx, sy), F.X, F.sx, sb)
      S(k.bong!, 'transform', `matrix(${m.map((x) => Math.round(x * 1000) / 1000).join(' ')})`)
    } else {
      if (hop) { const st = hop.style; SS(st, 'translate', ''); SS(st, 'rotate', ''); SS(st, 'scale', '') }
      S(k.root!, 'transform', `translate(${f1(F.X)} ${f1(F.Y)})`)
      S(k.than!, 'transform', `translate(100 120) rotate(${f1(this.rotD.v)}) translate(0 76) rotate(${f1(F.r)}) scale(${f3(F.sx)} ${f3(F.sy)}) translate(-100 -196)`)
      S(k.bong!, 'transform', `translate(${f1(F.X + 100)} 199) scale(${f3(sb * F.sx)} ${f3(sb)}) translate(-100 -199)`)
    }
    S(k.bong!, 'opacity', f(kep(1 - nang / 230, 0.3, 1)))
    const gx = this.fsx.v, gy = this.fsy.v
    S(k.mat!, 'transform', `translate(${f1(gx)} ${f1(gy)})`)
    if (k.nuocmat) S(k.nuocmat, 'transform', `translate(${f1(gx)} ${f1(gy)})`)
    S(k.may!, 'transform', `translate(${f1(gx * 1.05)} ${f1(gy * 1.25)})`)
    S(k.mui!, 'transform', `translate(${f1(gx * 1.4)} ${f1(gy * 1.3)})`)
    S(k.mieng!, 'transform', `translate(${f1(gx * 1.18)} ${f1(gy * 1.12)})`)
    S(k.ma!, 'transform', `translate(${f1(gx * 0.8)} ${f1(gy * 0.8)})`)
    S(k.pc!, 'transform', `translate(${f1(-gx * 0.45)} ${f1(-gy * 0.35)})`)
    // MẮT
    const beat = !nghi && p.heart! > 0.02 ? 1 + 0.16 * nhipTim(t) : 1
    for (const [x, ben, s] of [[L, -1, 'L'], [R, 1, 'R']] as const) {
      const eo0 = p['eo' + s]!, eo = eo0 * (1 - blink), es = k['es' + s]!
      if (eo < 0.13) an(es, false)
      else { an(es, true); S(es, 'transform', `translate(0 ${Y}) scale(1 ${f3(eo)}) translate(0 ${-Y})`); S(es, 'opacity', f(em(0.13, 0.34, eo))) }
      const h = kep(p.heart!, 0, 1.2), ps = p.psz!, moR = Math.max(0, ER - ps - 1.5)
      let ox = p.pdx! + this.nhinGoc * p.gazeW! + this.gx.v * moR * p.gazeW! + this.hPx.v, oy = p.pdy! + this.gy.v * moR * p.gazeW! + this.hPy.v
      if (!nghi && this.ts.nay && p.fNgac! > 0.02) { ox += 0.35 * p.fNgac! * Math.sin(t * 41); oy += 0.3 * p.fNgac! * Math.sin(t * 37) }
      const ol = Math.hypot(ox, oy)
      if (ol > moR && ol > 0) { ox *= moR / ol; oy *= moR / ol }
      const sp = kep(1 - h, 0, 1), pu = k['pu' + s]!
      if (sp < 0.02) an(pu, false)
      else { an(pu, true); S(pu, 'transform', `translate(${f1(x - ben * 2 + ox)} ${f1(Y + oy)}) scale(${f(((sp * ps) / 14))})`) }
      const tm = k['tim' + s], th = k['timh' + s]
      if (tm && th) {
        if (h < 0.02) { an(tm, false); S(th, 'opacity', '0') }
        else { an(tm, true); S(tm, 'transform', `translate(${f1(x + ox * 0.25)} ${f1(Y + 1 + oy * 0.25)}) scale(${f(1.45 * h * beat)})`); S(th, 'opacity', f(kep(h, 0, 1))) }
      }
      const sau = p['lid' + s]!, ng = p['ng' + s]!, mt = k['mt' + s]!
      if (sau < -0.06 && Math.abs(ng) < 0.04) S(mt, 'd', 'M0 0')
      else {
        const yTB = Y - ER + 2 * ER * sau, yN = yTB - ng * 9, yT = yTB + ng * 9
        const [y1, y2] = ben < 0 ? [yN, yT] : [yT, yN]
        S(mt, 'd', `M${x - ER - 2} ${Y - ER - 14}H${x + ER + 2}V${f1(y2)}L${x - ER - 2} ${f1(y1)}Z`)
      }
      const d = p['lb' + s]!, md = k['md' + s]!
      S(md, 'd', d > 39 ? 'M0 0' : `M${x - ER - 2} ${Y + ER + 2}V${f1(Y + d)}Q${x} ${f1(Y + d - 11)} ${x + ER + 2} ${f1(Y + d)}V${Y + ER + 2}Z`)
      const ao = 1 - em(0.12, 0.38, eo), cu = k['cung' + s]!
      if (ao < 0.01) S(cu, 'opacity', '0')
      else {
        const a = p['arc' + s]! + (-0.4 - p['arc' + s]!) * blink * kep(eo0, 0, 1), len = p.alen!
        const e = Y + 2 + 2 * a, c = e - (a > 0 ? 19 * a : 12 * a)
        S(cu, 'opacity', f(ao)); S(cu, 'd', `M${f1(x - len)} ${f1(e)}Q${x} ${f1(c)} ${f1(x + len)} ${f1(e)}`)
      }
      const gl = k['glow' + s]
      if (gl) S(gl, 'opacity', f(kep(p.glow!, 0, 1)))
      // MÀY
      const bo = p['bo' + s]!, my = k['my' + s]!
      if (bo < 0.02) S(my, 'opacity', '0')
      else {
        const n = p['bn' + s]!, c = p['bc' + s]! + this.bmay.v, yN = Y - 34 - c - n * 4, yT = Y - 34 - c + n * 4
        S(my, 'opacity', f(kep(bo, 0, 1)))
        S(my, 'd', `M${x + ben * 12} ${f1(yN)}Q${x} ${f1((yN + yT) / 2 - 3)} ${x - ben * 12} ${f1(yT)}`)
        S(my, 'stroke-width', f1(p.bw!))
      }
    }
    // MIỆNG (một hình kín nội suy: cười to ⇄ chữ O ⇄ nét ngang ⇄ mếu)
    const dm = duongMieng(p.mx!, p.my!, p.mw!, p.mt!, p.mu!, p.md!, kep(p.mr!, 0, 1))
    S(k.mi!, 'd', dm); S(k.mclip!, 'd', dm); S(k.mi!, 'stroke-width', f1(p.msw!))
    const mo2 = p.md! - p.mu!, tg = kep(p.mtg!, 0, 1) * em(3, 7, mo2), lu = k.luoi!
    if (tg < 0.02) S(lu, 'opacity', '0')
    else { S(lu, 'opacity', f(tg)); S(lu, 'cx', f1(p.mx!)); S(lu, 'cy', f1(p.my! + p.md! * 0.98)); S(lu, 'rx', f1(p.mw! * 0.58)); S(lu, 'ry', f1(Math.max(1.6, mo2 * 0.27))) }
    // MÁ
    const bl = Math.max(0, p.blush!), sc = 0.84 + 0.2 * bl
    for (const e of [k.maL!, k.maR!]) { S(e, 'rx', f1(15 * sc)); S(e, 'ry', f1(9 * sc)); S(e, 'opacity', f(kep(bl, 0, 1))) }
    if (k.ngma) S(k.ngma, 'opacity', f(kep(p.fNgMa!, 0, 1)))
    // DUNG DỊCH: sóng nền là một đường sin RỘNG, CSS trượt ngang suốt (cả lúc vòng chạy — không trao tay pha); JS chỉ dựng lại hình khi mực / biên độ
    // đổi (giận dâng nước) hoặc đang sánh (gợn dội sau chạm / đáp đất); nước giữ thăng bằng khi thân nghiêng = xoay nhóm `nghieng` (một thuộc tính).
    const S0 = mucNuoc(p.gian!), A0 = bienSong(p.gian!), wa = nghi ? 0 : this.waveA * (this.ts.nay ? 1 : 0.4)
    S(k.nghieng!, 'transform', `rotate(${f1((kep(this.ang.v, -0.5, 0.5) * 180) / Math.PI)} 100 ${f1(S0)})`)
    const khoaN = `${f1(S0)}|${f(A0)}`
    if (wa > 0.05 || this.coSlosh || khoaN !== this.khoaNuoc) {
      const w = duongSong(S0, A0, wa > 0.05 ? wa : 0, t)
      S(k.nuoc!, 'd', w.khoi); S(k.matnuoc!, 'd', w.mat)
      this.khoaNuoc = khoaN; this.coSlosh = wa > 0.05
    }
    // NÚT BẤC (bung theo giận) + LỬA (lắc bằng CSS)
    const nn = p.nut!
    let tx, ty, rr
    if (nn <= 1) { const q = Math.max(-0.08, nn); tx = -4 * q; ty = -22 * q; rr = -14 * q } else { const q = Math.min(1.3, nn - 1); tx = -4 + 10 * q; ty = -22 - 10 * q; rr = -14 + 32 * q }
    ty -= kep((1 - F.sy) * 34, -2, 4) * (1 - kep(nn, 0, 1))
    S(k.nut!, 'transform', `translate(${f1(tx)} ${f1(ty)}) rotate(${f1(rr)} 100 3)`)
    if (k.lua) {
      const l = p.lua!
      if (l < 0.03) an(k.lua, false)
      else { an(k.lua, true); S(k.lua, 'transform', `translate(100 15) scale(${f(l)})`); S(k.luaTo!, 'opacity', f(kep(p.luaTo!, 0, 1))) }
    }
    // HIỆU ỨNG THEO MẶT (lặp bằng CSS; vòng JS chỉ phóng / thu theo trọng số)
    const fx = (nhom: SVGElement | undefined, w: number, fn?: () => void) => { if (!nhom) return; if (w < 0.02) an(nhom, false); else { an(nhom, true); fn?.() } }
    fx(k.fsao, p.fSao!, () => SAO_VT.forEach(([x, yy, s], i) => S(k['sao' + i]!, 'transform', `translate(${x} ${yy}) scale(${f(s * p.fSao!)})`)))
    fx(k.fhoi, p.fHoi!, () => S(k.fhoi!, 'transform', `translate(168 46) scale(${f(p.fHoi!)})`))
    fx(k.fngac, p.fNgac!, () => { S(k.fngac!, 'opacity', f(kep(p.fNgac!, 0, 1))); S(k.fngac!, 'transform', `translate(100 52) scale(${f(p.fNgac!)}) translate(-100 -52)`) })
    fx(k.ftim, p.fTim!, () => TIM_VT.forEach(([x, yy, s], i) => S(k['ti' + i]!, 'transform', `translate(${x} ${yy}) scale(${f(s * p.fTim!)})`)))
    fx(k.fnot, p.fNot!, () => NOT_VT.forEach(([x, yy], i) => S(k['no' + i]!, 'transform', `translate(${x} ${yy}) scale(${f(p.fNot!)})`)))
    fx(k.fnhiet, p.fNhiet!, () => S(k.fnhiet!, 'opacity', f(kep(p.fNhiet!, 0, 1))))
    fx(k.fz, p.fZ!, () => S(k.fz!, 'opacity', f(kep(p.fZ!, 0, 1))))
    if (k.puff) S(k.puff, 'opacity', f(kep(p.fPuff!, 0, 1)))
    if (k.nuocmat) S(k.nuocmat, 'opacity', f(kep(p.fNuoc!, 0, 1)))
  }

  // ── ĐỔI MẶT ──
  /** Đặt các thứ RỜI RẠC theo mặt mới: lớp màu giận, data-mat (nhịp CSS), đảo mắt, số bọt + chỗ bọt, phần phải dựng. */
  private datTinh(m: MatMol): void {
    const svg = this.svg, T = MAT[m]
    for (const ph of PHAN_MAT[m]) this.dung(ph)
    S(this.k.nhom!, 'class', LOP_GIAN[m] ?? 'mol-g0')
    svg.setAttribute('data-mat', m)
    svg.setAttribute('data-mol-mau', String(boMauMol(gioMayChu()))) // bộ màu của NGÀY VN (qua 0h ⇒ lần đổi mặt kế tiếp đổi)
    const g = T.gazeW!
    if (g >= 0.9) svg.setAttribute('data-dao', 'du'); else if (g >= 0.35) svg.setAttribute('data-dao', 'nua'); else svg.removeAttribute('data-dao')
    if (this.capGian) svg.setAttribute('data-cap-ve', String(this.capGian)); else svg.removeAttribute('data-cap-ve')
    ;(this.k.song as SVGElement).style.animationDuration = `${chuKySong(T.gian!)}s` // sóng nhanh dần theo giận
    const S0 = mucNuoc(T.gian!), n = SO_BOT[m] ?? 2
    BOT.forEach(([x, sau], i) => { const b = this.k['bot' + i]!; an(b, i < n); S(b, 'cx', String(x)); S(b, 'cy', f(S0 + sau)) })
  }
  /** Mặt hiệu lực đổi ⇒ cú hích mở màn (bẹp, sóng, nhảy, hạt) rồi thức vòng; không vòng được ⇒ vẽ thẳng mặt mới. */
  private doiMat(em2 = false): void {
    const m = this.matHT(), cu = this.matCu
    if (m === cu) return
    this.matCu = m
    this.tTT = this.gio()
    this.datTinh(m)
    if (!this.ts.vong || !this.conViecDuoc()) { this.veTinh(); return }
    const am = this.ts.nay && !em2 ? 1 : 0
    this.syS.vel -= 1.5 * am; this.sxS.vel += 1.1 * am; this.waveA += 1.6 * am
    const now = this.gio()
    if (am && Math.random() < 0.6 && MAT[m].eoL! > 0.5) this.datChop(now, false)
    if (am) {
      if (m === 'ngac') { this.nhayLen(250); this.syS.vel += 3.6; this.sxS.vel -= 2 }
      else if (m === 'khen') this.hatSao(8)
      else if (m === 'me') { this.hatTim(false); this.hatTim(true) }
      else if (m === 'ratCau') { this.rotS.vel += 110; this.waveA += 4; for (let i = 0; i < 3; i++) this.hatHoi() }
      else if (m === 'cau') { this.waveA += 2.5; if (cu !== 'ratCau') this.nhayLen(90) }
      else if (m === 'buon') this.syS.vel -= 1.2
      else if (m === 'nhay') this.nhayLen(60)
    }
    this.danhThuc()
  }
  private nhayLen(v: number): void { if (!this.ts.nay) return; this.jumpV = Math.min(this.jumpV, -v); if (this.jumpY >= 0) this.jumpY = -0.01 }
  datTrangThai(t: TrangThaiLua, tuy?: TuyChonLua): void {
    this.tt = t
    this.matCo = undefined
    window.clearTimeout(this.henSau)
    if (tuy?.sau && tuy.ve) { const ve = tuy.ve; this.henSau = window.setTimeout(() => this.datTrangThai(ve), tuy.sau) }
    this.doiMat(tuy?.em)
  }
  datCap(c: number, _dung?: DungGian): void {
    const n = c >= 2 ? Math.min(5, Math.round(c)) : 0
    if (n === this.capGian) return
    this.capGian = n
    if (n) this.svg.setAttribute('data-cap-ve', String(n)); else this.svg.removeAttribute('data-cap-ve')
    this.doiMat()
  }
  get cap(): number { return this.capGian }
  get trangThai(): TrangThaiLua { return this.tt }
  /** CHẠM: nảy co giãn + cười khúc khích + «hì»; đang giận ⇒ lắc đầu, mày giật; đang ngủ ⇒ giật mình thức rồi ngủ lại; chọc 6 lần liền ⇒ dỗi 3 giây. */
  cham(): void {
    const now = this.gio(), T = MAT[this.matHT()], am = this.ts.nay ? 1 : 0
    if (!this.ts.vong) return
    if (this.matHT() === 'ngu' && !this.capGian) { this.tamThoiMat('ngac', 1500); return }
    if (am) { this.syS.vel -= 3.4; this.sxS.vel += 2.6; this.waveA += 5; this.nhayLen(110) }
    if (T.gian! >= 2) { this.rotS.vel += (Math.random() < 0.5 ? -1 : 1) * 90 * am; this.bmay.vel -= 30; this.danhThuc(); return }
    this.cuoi = now + 0.95; this.cuoi0 = now
    this.deCuoi = { ...CUOI, blush: T.blush! + 0.5, wNhay: 0, wKhen: 0 }
    if (am) this.hatHi()
    this.chamDon = this.chamDon.filter((x) => now - x < 2.6); this.chamDon.push(now)
    if (this.chamDon.length >= 6) { this.chamDon = []; this.cuoi = 0; this.tamThoiMat('doi', 3000) }
    this.danhThuc()
  }
  private tamThoiMat(m: MatMol, ms: number): void {
    this.tamThoi = m
    window.clearTimeout(this.henTam)
    this.henTam = window.setTimeout(() => { this.tamThoi = null; this.doiMat() }, ms)
    this.doiMat()
  }
  noi(chu: string, msMoiChu = 40): void {
    this.svg.classList.add('mol-noi')
    window.clearTimeout(this.henNoi)
    this.henNoi = window.setTimeout(() => this.svg.classList.remove('mol-noi'), Math.min(6000, Math.max(400, chu.length * msMoiChu)))
  }
  /** Bước tay (bộ chụp / test): tiến `ms` mili giây theo bước 16,7 ms rồi vẽ — chạy cả khi không có rAF. */
  buoc(ms: number): void {
    for (let con = ms; con > 0; con -= 16.7) {
      const h = Math.min(16.7, con) / 1000
      this.lech += h
      const now = this.gio()
      this.buocMo(now, h); this.tCu = now
    }
    if (this.dangThuc) this.xetNgu(this.gio())
  }

  // ── KÉO (chỉ chỗ Mol to — Lộ trình; máy thường) ──
  private batKeo(e: PointerEvent): void {
    const tg = e.target as Element | null
    if (!tg?.closest?.('[data-k="than"]')) return
    try { this.svg.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ }
    tay.x = e.clientX; tay.y = e.clientY; tay.luc = gioMay(); tay.co = true
    this.keo = { id: e.pointerId, x0: e.clientX, y0: e.clientY, bx: this.posX.t, by: this.posY.t, lx: e.clientX, ly: e.clientY, lt: this.gio(), vx: 0, vy: 0, dang: false }
  }
  private diKeo(e: PointerEvent): void {
    const k = this.keo
    if (!k || e.pointerId !== k.id) return
    const dx = e.clientX - k.x0, dy = e.clientY - k.y0, now = this.gio()
    if (!k.dang && Math.hypot(dx, dy) > 7) { k.dang = true; this.posX.k = this.posY.k = 620; this.posX.z = this.posY.z = 0.78; this.danhThuc() }
    if (!k.dang) return
    const u = this.vb[2]! / Math.max(1, (this.svg.parentElement ?? this.svg).getBoundingClientRect().width), dt = Math.max(0.008, now - k.lt)
    this.posX.t = kep(k.bx + dx * u, -125, 125); this.posY.t = kep(k.by + dy * u, -130, 50)
    k.vx += (((e.clientX - k.lx) * u) / dt - k.vx) * 0.35; k.vy += (((e.clientY - k.ly) * u) / dt - k.vy) * 0.35
    k.lx = e.clientX; k.ly = e.clientY; k.lt = now
  }
  private thaKeo(e: PointerEvent): void {
    const k = this.keo
    if (!k || e.pointerId !== k.id) return
    this.keo = null
    if (!k.dang) { if (e.type === 'pointerup') this.cham(); return }
    this.boClick = this.gio() + 0.4
    this.posX.t = 0; this.posY.t = 0; this.posX.k = this.posY.k = 150; this.posX.z = 0.3; this.posY.z = 0.34
    this.posX.vel += k.vx * 0.3; this.posY.vel += k.vy * 0.3
    if (MAT[this.matHT()].gian! < 2) { const now = this.gio(); this.cuoi = now + 0.75; this.cuoi0 = now; this.deCuoi = { ...CUOI, blush: MAT[this.matHT()].blush! + 0.5, wNhay: 0, wKhen: 0 } }
    this.danhThuc()
  }

  // ── PHẦN DỰNG LẦN ĐẦU CẦN ──
  private dung(ph: Phan): void {
    if (this.daPhan.has(ph)) return
    this.daPhan.add(ph)
    const k = this.k, u = this.u
    switch (ph) {
      case 'lua': chen(k.than!, `<g data-k="lua" display="none"><g class="mol-lua-c"><g data-k="luaTo" opacity="0"><path transform="translate(-9 0) rotate(-24) scale(.66)" d="${PLUA1}" class="m-lua1"/><path transform="translate(9 0) rotate(24) scale(.66)" d="${PLUA1}" class="m-lua1"/></g><path d="${PLUA1}" class="m-lua1"/><path d="${PLUA2}" class="m-lua2"/></g></g>`, k.nut!); break
      case 'glow':
        chen(this.svg.querySelector('defs')!, `<radialGradient id="${u}g"><stop offset=".55" class="s-anh"/><stop offset="1" class="s-anh0"/></radialGradient>`)
        chen(k.mat!, `<circle data-k="glowL" cx="${L}" cy="${Y + 2}" r="${ER + 9}" fill="url(#${u}g)" class="mol-glow" opacity="0"/>`, k.eL!)
        chen(k.mat!, `<circle data-k="glowR" cx="${R}" cy="${Y + 2}" r="${ER + 9}" fill="url(#${u}g)" class="mol-glow" opacity="0"/>`, k.eR!)
        break
      case 'tim':
        for (const [x, s] of [[L, 'L'], [R, 'R']] as const) {
          chen(k['dao' + s]!, `<g data-k="tim${s}" display="none"><path d="${PTIM}" class="m-tim"/></g>`)
          chen(k['es' + s]!, `<circle data-k="timh${s}" cx="${x - 5}" cy="${Y - 5}" r="3" class="m-t" opacity="0"/>`, k['es' + s]!.lastChild)
        }
        break
      case 'sao': chen(k.than!, `<g data-k="fsao" display="none">${SAO_VT.map((_, i) => `<g data-k="sao${i}"><path d="${PSAO}" class="m-sao mol-lap l${i}"/></g>`).join('')}</g>`); break
      case 'timfx': chen(k.than!, `<g data-k="ftim" display="none">${TIM_VT.map((_, i) => `<g data-k="ti${i}"><path d="${PTIM}" class="m-tim mol-dap l${i}"/></g>`).join('')}</g>`); break
      case 'not': chen(k.than!, `<g data-k="fnot" display="none">${NOT_VT.map((_, i) => `<g data-k="no${i}"><g class="mol-not-nhay l${i}">${PNOT}</g></g>`).join('')}</g>`); break
      case 'hoi': chen(k.than!, `<g data-k="fhoi" display="none"><text class="m-cam mol-chu mol-hoi" font-size="30" text-anchor="middle">?</text></g>`); break
      case 'ngac': chen(k.than!, `<g data-k="fngac" display="none"><path d="M38 36 L46 46 M30 58 L42 60 M162 36 L154 46 M170 58 L158 60" class="m-net-cam mol-ngac" stroke-width="3.6"/></g>`); break
      case 'nhiet': chen(k.than!, `<g data-k="fnhiet" display="none"><path d="M14 104 q-5 9 0 18 M186 104 q5 9 0 18 M6 98 q-6 13 0 28 M194 98 q6 13 0 28" class="m-net-do mol-nhiet" stroke-width="3"/></g>`); break
      case 'z': chen(k.than!, `<g data-k="fz" display="none"><text x="148" y="40" class="m-vien mol-chu mol-z z1" font-size="22">z</text><text x="164" y="22" class="m-vien mol-chu mol-z z2" font-size="15">z</text></g>`); break
      case 'le': chen(k.than!, `<g data-k="nuocmat" opacity="0"><path d="M${L - 17} ${Y + 18} q-6 10 0 14 q6 -4 0 -14z" class="m-nuoc mol-le"/></g>`); break
      case 'puff': chen(k.mieng!, `<circle data-k="puff" cx="113" cy="140" r="2.6" class="m-hoi mol-phi" opacity="0"/>`); break
      case 'ngma': chen(k.ma!, `<path data-k="ngma" d="M42 124 l-4 6 M48 124 l-4 6 M156 124 l-4 6 M162 124 l-4 6" class="m-net-ma" stroke-width="2.4" opacity="0"/>`); break
    }
    this.gom(this.svg)
  }

  // ── HẠT BAY (bung theo sự kiện; máy yếu ≤ 1/3) — kho phần tử dùng lại, không thêm / gỡ nút mỗi lần ──
  private layHat(loai: string, tao: () => SVGElement): SVGElement | null {
    const ranh = this.hat.find((h) => !h.dung && h.loai === loai)
    if (ranh) return ranh.el
    if (this.hat.length >= this.ts.hatToiDa) return null
    const el = tao()
    this.k.hat!.appendChild(el)
    this.hat.push({ el, loai, t0: 0, song: 1, dung: false, fn: () => {} })
    return el
  }
  private them(loai: string, tao: () => SVGElement, song: number, fn: Hat['fn']): void {
    if (!this.dangThucDuoc()) return
    const el = this.layHat(loai, tao)
    if (!el) return
    const h = this.hat.find((x) => x.el === el)!
    h.dung = true; h.t0 = this.gio(); h.song = song; h.fn = fn
    an(el, true); fn(el, 0)
  }
  private dangThucDuoc(): boolean { return this.ts.hatToiDa > 0 && this.conViecDuoc() }
  private chayHat(now: number): void {
    for (const h of this.hat) {
      if (!h.dung) continue
      const e = (now - h.t0) / h.song
      if (e >= 1) { h.dung = false; an(h.el, false) } else h.fn(h.el, e)
    }
  }
  private taoEl(tag: string, attrs: Record<string, string>, cls: string, chu?: string): () => SVGElement {
    return () => { const e = document.createElementNS(NS, tag); for (const a in attrs) e.setAttribute(a, attrs[a]!); e.setAttribute('class', cls); if (chu) e.textContent = chu; return e }
  }
  private hatSao(n: number): void {
    const so = soHat(n, this.cheDo)
    for (let i = 0; i < so; i++) {
      const a = (i / so) * Math.PI * 2 + rnd(-0.3, 0.3), d1 = rnd(92, 118), s0 = rnd(0.45, 0.8)
      this.them('sao', this.taoEl('path', { d: PSAO }, 'm-sao'), 0.9, (el, e) => { const q = 1 - (1 - e) ** 3, d = 52 + (d1 - 52) * q; S(el, 'transform', `translate(${f(100 + Math.cos(a) * d)} ${f(105 + Math.sin(a) * d * 0.9)}) rotate(${f(e * 180)}) scale(${f3(s0 * (1 - e * 0.8))})`); S(el, 'opacity', f3(mo(e, 0.05, 0.6))) })
    }
  }
  private hatTim(phai: boolean): void {
    if (this.cheDo === 'gon' && this.hat.some((h) => h.dung && h.loai === 'tim')) return
    const x0 = phai ? rnd(146, 172) : rnd(28, 54), y0 = rnd(62, 92), s0 = rnd(0.55, 0.9), ph = rnd(0, 6)
    this.them('tim', this.taoEl('path', { d: PTIM }, 'm-tim'), 2.2, (el, e) => { S(el, 'transform', `translate(${f(x0 + 7 * Math.sin(e * 6 + ph))} ${f(y0 - 75 * e)}) scale(${f3(s0 * (0.4 + 0.6 * em(0, 0.25, e)))})`); S(el, 'opacity', f3(mo(e, 0.1, 0.55))) })
  }
  private hatHoi(): void {
    if (this.cheDo === 'gon' && this.hat.filter((h) => h.dung && h.loai === 'hoi').length >= 1) return
    const x0 = 100 + rnd(-34, 34), y0 = rnd(-6, 8), ph = rnd(0, 6)
    this.them('hoi', this.taoEl('path', { d: 'M0 0 q-4 -6 0 -12 q4 -6 0 -12', 'stroke-width': '2.6' }, 'm-net-do'), 1.3, (el, e) => { S(el, 'transform', `translate(${f(x0 + 5 * Math.sin(e * 5 + ph))} ${f(y0 - 46 * e)}) scale(${f3(0.8 + 0.5 * e)})`); S(el, 'opacity', f3(0.8 * mo(e, 0.15, 0.4))) })
  }
  private hatHi(): void {
    const ds = ([[150, 58, 1], [44, 64, -1]] as const).slice(0, soHat(2, this.cheDo))
    ds.forEach(([x0, y0, b], i) => this.them('hi', this.taoEl('text', { x: '0', y: '0', 'font-size': '17', 'text-anchor': 'middle' }, 'm-hi mol-chu', 'hì'), 0.95 + i * 0.1, (el, e) => {
      const pop = e < 0.2 ? 0.4 + 0.8 * (e / 0.2) : 1.2 - 0.2 * em(0.2, 0.5, e)
      S(el, 'transform', `translate(${f(x0 + b * 10 * e)} ${f(y0 - 34 * e)}) rotate(${f(b * 12)}) scale(${f3(pop)})`); S(el, 'opacity', f3(mo(e, 0.08, 0.6)))
    }))
  }

  huy(): void {
    window.clearTimeout(this.henSau); window.clearTimeout(this.henNoi); window.clearTimeout(this.henTam); window.clearTimeout(this.henChop); window.clearTimeout(this.henMo)
    this.henChop = 0
    THUC.delete(this); SONG.delete(this); MOL_DANG_SONG.delete(this)
    boKhungThua()
    for (const [t, ten, fn, o] of this.nghe) t.removeEventListener(ten, fn, o)
    this.nghe = []
    if (this.ts.vong && this.ts.doiMat) ngheTay(false)
    io?.unobserve(this.svg); theoDoi.delete(this.svg)
    this.svg.remove()
    if (this.hop) { const st = this.hop.style; for (const k of ['translate', 'rotate', 'scale', 'will-change', 'transform-origin']) st.removeProperty(k) }
  }
}
let soMol = 0

/** Các Mol đang sống (bộ chụp / test điều khiển qua đây) — cùng vai trò `LUA_DANG_SONG` của hình cũ. */
export const MOL_DANG_SONG = new Set<Lua>()
export function taoLua(noiGan: HTMLElement, tc: TuyChonMol = {}): Lua {
  const m = new MayMol(noiGan, tc)
  MOL_DANG_SONG.add(m)
  return m
}
/** Đếm cho test / đo: số Mol đang sống, số Mol đang chạy vòng khung, có hẹn khung rAF không. */
export function _demMol(): { song: number; thuc: number; henRaf: boolean } { return { song: SONG.size, thuc: THUC.size, henRaf: hen !== 0 } }
/** SVG trọn một mặt Mol ở tư thế đứng (bản vẽ / test / ảnh tĩnh). Cần `document`. */
export function svgMol(mat: MatMol, goc: GocLua = 'truoc'): string {
  const o = document.createElement('span')
  const m = new MayMol(o, { mat, goc, cheDo: 'nho' })
  const s = m.svg.innerHTML
  m.huy()
  return s
}

// ── BIỂU TƯỢNG TAB TRÌNH DUYỆT (giữ luật 31/10): cấp 4–5 ⇒ mặt Mol cáu / rất cáu (dung dịch đỏ sôi), chụp từ CHÍNH Mol đang vẽ trên trang (màu token đã quy ra —
// không tệp ảnh mới, không mã màu thô); hạ cấp / rời Lộ trình ⇒ về logo cũ (đúng href / type ban đầu). Lộ trình truyền hàm chụp SVG (`anhSvg` của
// khung-tinh-hs) vào để mảnh này không kéo theo mô-đun ấy. Máy chặn canvas / ảnh ⇒ giữ logo, không ném lỗi.
let iconGoc: { el: HTMLLinkElement; href: string; type: string }[] | null = null
let lanIcon = 0
export async function datIconTabMol(cap: number, anh: (svg: SVGSVGElement) => { src: string } | null): Promise<void> {
  const ma = ++lanIcon
  if (cap < 4) { if (iconGoc) for (const g of iconGoc) { g.el.type = g.type; g.el.href = g.href } iconGoc = null; return }
  try {
    // ưu tiên Mol đứng thẳng (vòng Mục tiêu ngày / bong bóng) đã vẽ xong đúng cấp; thiếu thì Mol cạnh đường
    const duoi = `[data-cap="${cap}"] > svg.mol-svg[data-cap-ve="${cap}"]`
    const svg = document.querySelector<SVGSVGElement>(`.bi.lua:not([data-goc])${duoi}`) ?? document.querySelector<SVGSVGElement>(`.bi.lua${duoi}`)
    const a = svg && anh(svg)
    if (!a) return
    const img = new Image()
    img.src = a.src.replace(/width='[^']*' height='[^']*'/, "width='200' height='230'") // khung vẽ đúng cỡ gốc 200 × 230
    await img.decode()
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const x = c.getContext('2d')
    if (!x || ma !== lanIcon) return
    x.drawImage(img, 5, 32, 190, 190, 0, 0, 64, 64) // cổ bình + đầu tròn: x 5…195, y 6…196 của khung vẽ
    const url = c.toDataURL('image/png')
    if (ma !== lanIcon || !url.startsWith('data:image/png')) return
    iconGoc ??= [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')].map((el) => ({ el, href: el.getAttribute('href') ?? '', type: el.type }))
    for (const g of iconGoc) { g.el.type = 'image/png'; g.el.href = url }
  } catch { /* giữ logo */ }
}
