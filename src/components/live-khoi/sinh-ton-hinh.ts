// HÌNH của trò «Sinh Tồn» (thầy duyệt bản vẽ 12/11: docs/ban-ve-sinh-ton-1211/02-bon-nhan-vat-1366.jpg, 11-bon-cap-sung-1366.jpg): bốn bé ma không mặt
// (mặt màu đội, áo choàng trắng kem viền màu đội, mỗi đội một kiểu mũ trùm) và bốn cấp súng đeo bên người. Toàn bộ là NÉT (Path2D), nướng sẵn ra ảnh
// MỘT lần cho mỗi (đội, máy) và (đội, cấp súng); mỗi khung chỉ dán ảnh. Màu đọc từ biến CSS của app (không mã màu thô).
export type Rgb = [number, number, number]
export interface BangMau {
  doi: Rgb[]; nen: Rgb; nen2: Rgb; vien: Rgb; chu: Rgb; chu2: Rgb; chu3: Rgb; sao: Rgb; tin: Rgb; dung: Rgb; sai: Rgb; muc: Rgb; trang: Rgb; phong: string
}
type Khoa = 'c' | 'sang' | 'toi' | 'ao' | 'day' | 'muc' | 'trang' | 'sao' | 'tin' | 'kim' | 'kim2' | 'chu2'
/** Một nét: [đường, màu tô, màu viền, bề dày viền, độ đậm]. */
type Net = [string, Khoa | '', (Khoa | '')?, number?, number?]
export interface Anh { cv: HTMLCanvasElement; x: number; y: number; w: number; h: number }

export const mau = (c: Rgb, a = 1): string => `rgba(${c[0]},${c[1]},${c[2]},${a})`
/** Pha hai màu: `t` = phần của `b`. */
export const pha = (a: Rgb, b: Rgb, t: number): Rgb => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]

const tron = (cx: number, cy: number, r: number): string => `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`
const elip = (cx: number, cy: number, rx: number, ry: number): string => `M${cx - rx},${cy}a${rx},${ry} 0 1,0 ${2 * rx},0a${rx},${ry} 0 1,0 ${-2 * rx},0Z`
const hop = (x: number, y: number, w: number, h: number, r: number): string =>
  `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${2 * r - w}a${r},${r} 0 0 1 ${-r},${-r}v${2 * r - h}a${r},${r} 0 0 1 ${r},${-r}Z`
const bong = (d: string): Net => [d, '', 'trang', 1.7, 0.85]
const loi = (x: number, y: number, r: number): Net[] => [[tron(x, y, r * 1.55), 'c', '', 0, 0.35], [tron(x, y, r), 'c', 'muc', 1.6], [tron(x - r * 0.3, y - r * 0.32, r * 0.3), 'trang']]

// ── Bé ma (gốc toạ độ = mặt đất dưới chân; súng đeo bên PHẢI — chĩa trái thì lật cả hình) ──
const GAU = 'q5,9 10,0 q5,9 10,0 q5,9 10,0 q5,9 10,0 q5,9 10,0 q5,9 10,0'
const AO: Net[] = [
  [`M0,-85 C-19,-85 -25,-69 -25,-53 C-25,-40 -28,-25 -30,-13 ${GAU} C28,-25 25,-40 25,-53 C25,-69 19,-85 0,-85Z`, 'ao', 'muc', 1.8],
  ['M-27,-22 q4.6,7 9,0 q4.6,7 9,0 q4.6,7 9,0 q4.6,7 9,0 q4.6,7 9,0 q4.6,7 9,0', '', 'c', 3.4],
  ['M-14,-18 v6 M0,-18 v7 M14,-18 v6', '', 'muc', 1.3, 0.28],
  ['M-24,-46 C-26,-38 -28,-33 -30,-29 q7.5,8 15,0 q7.5,8 15,0 q7.5,8 15,0 q7.5,8 15,0 C28,-33 26,-38 24,-46Z', 'sang', 'muc', 1.6],
  ['M-12,-80 C-4,-84 4,-84 12,-80', '', 'trang', 2.4, 0.9],
  [elip(0, -59, 19, 18), 'toi', 'muc', 1.6], [elip(0, -58, 16.5, 15.6), 'c'],
  ['M-11,-67 Q-6,-72 2,-72', '', 'trang', 2, 0.45],
  [elip(-6.6, -58, 3.5, 5), 'muc'], [elip(6.6, -58, 3.5, 5), 'muc'], [tron(-5.4, -60, 1.5), 'trang'], [tron(7.8, -60, 1.5), 'trang'],
  [elip(-11.6, -50.5, 3.3, 2.1), 'sang', '', 0, 0.8], [elip(11.6, -50.5, 3.3, 2.1), 'sang', '', 0, 0.8],
  [tron(0, -38.5, 4.6), 'sao', 'muc', 1.5], [tron(-1.2, -39.8, 1.3), 'trang'],
]
/** Mũ trùm riêng từng đội (vẽ SAU lưng áo): chỏm xoáy · tai mèo · (mầm lá vẽ sau cùng) · hai búi tròn. */
const MU: Net[][] = [
  [['M-7,-80 C-9,-97 3,-105 14,-98 C7,-97 6,-91 9,-80Z', 'ao', 'muc', 1.8], [tron(13, -98.5, 4), 'c', 'muc', 1.8]],
  [['M-23,-68 L-24,-97 L-5,-82Z', 'ao', 'muc', 1.8], ['M23,-68 L24,-97 L5,-82Z', 'ao', 'muc', 1.8], ['M-20,-76 L-20.6,-90 L-11,-82Z', 'c'], ['M20,-76 L20.6,-90 L11,-82Z', 'c']],
  [],
  [[tron(-17, -80, 8.6), 'ao', 'muc', 1.8], [tron(17, -80, 8.6), 'ao', 'muc', 1.8], [tron(-17, -80, 3.8), 'c'], [tron(17, -80, 3.8), 'c']],
]
const MAM: Net[] = [
  ['M0,-84 V-93', '', 'muc', 4.6], ['M0,-84 V-93', '', 'c', 2],
  ['M0,-93 C-5,-104 -16,-104 -19,-96 C-13,-90 -5,-90 0,-93Z', 'c', 'muc', 1.8], ['M0,-93 C5,-104 16,-104 19,-96 C13,-90 5,-90 0,-93Z', 'c', 'muc', 1.8],
]
const QUAI: Net[] = [['M-13,-45 Q4,-34 25,-27', '', 'muc', 5.4], ['M-13,-45 Q4,-34 25,-27', '', 'day', 2.6]]
const ANG_TEN: Net[] = [['M-14,-80 L-21,-97', '', 'muc', 4.4], ['M-14,-80 L-21,-97', '', 'chu2', 2], [tron(-21.6, -99, 5), 'tin', 'muc', 1.6]]
const netThan = (doi: number, may: boolean): Net[] => [[tron(-27, -29, 5.6), 'ao', 'muc', 1.6], ...MU[doi], ...AO, ...(doi === 2 ? MAM : []), ...QUAI, ...(may ? ANG_TEN : [])]

// ── Bốn cấp súng (chĩa sang phải, gốc = khớp đeo bên hông) ──
const N = 'muc' as const
const SUNG: Net[][] = [
  // cấp 1 · Súng Hạt
  [
    ['M-13,-5.5 h-7 q-2,0 -2,2 v6 q0,2 2,2 h7', 'toi', N, 1.6], ['M-3,-10 l5,-6.5 h9 l-2.5,6.5Z', 'toi', N, 1.6],
    [hop(16, -6.5, 24, 12, 4.5), 'toi', N, 1.6], bong('M21,-3.4 H34'),
    [hop(-14, -10.5, 35, 20, 9), 'kim', N, 1.6], ['M-9,5 H15 Q13,9 9,9 H-5 Q-8,9 -9,5Z', 'kim2'], bong('M-7,-6.6 H10'),
    ...loi(3.5, -0.5, 5.4),
    [hop(37, -9, 7.5, 17, 3.4), 'muc'], [hop(39.6, -5, 2.6, 9, 1.3), 'c'],
  ],
  // cấp 2 · Súng Đôi
  [
    ['M-12,-14 L-4,-25 L12,-14Z', 'toi', N, 1.6],
    [hop(18, -13, 33, 10, 4), 'toi', N, 1.6], [hop(18, 3, 33, 10, 4), 'toi', N, 1.6], bong('M24,-10 H42'), bong('M24,6 H42'),
    [hop(47, -15, 7, 14, 3), 'muc'], [hop(47, 1, 7, 14, 3), 'muc'], [hop(49.4, -11.5, 2.4, 7, 1.2), 'c'], [hop(49.4, 4.5, 2.4, 7, 1.2), 'c'],
    ['M-15,-15 H15 Q25,-15 25,-6 V6 Q25,15 15,15 H-15 Q-20,15 -20,10 V-10 Q-20,-15 -15,-15Z', 'kim', N, 1.6], ['M-16,9 H22 Q20,13.4 15,13.4 H-14 Q-16,13 -16,9Z', 'kim2'],
    ['M-10,-15 h8 v30 h-8Z', 'c', N, 1.6], bong('M2,-11 H17'),
    ...loi(11, -6.5, 3.6), ...loi(11, 6.5, 3.6),
    ['M-17,-5 h4 M-17,0 h4 M-17,5 h4', '', N, 1.6],
  ],
  // cấp 3 · Súng Sấm
  [
    [hop(-29, -8, 11, 16, 4), 'c', N, 1.6], ['M-26,-3 h5 M-26,3 h5', '', 'trang', 1.5, 0.8],
    ['M53,-5.5 L70,-14 L70,-8 L58,-1.5Z', 'toi', N, 1.6], ['M53,5.5 L70,14 L70,8 L58,1.5Z', 'toi', N, 1.6],
    [hop(14, -6, 44, 12, 4.5), 'kim', N, 1.6], bong('M18,-2.8 H54'),
    ...[22, 33.5, 45].flatMap((x): Net[] => [[hop(x - 1.5, -12, 9.5, 24, 4.7), 'c', '', 0, 0.3], [hop(x, -10, 6.5, 20, 3.2), 'c', N, 1.6], [`M${x + 2},-6.5 v5`, '', 'trang', 1.5, 0.85]]),
    ['M-18,-14 H10 L20,-7 V7 L10,14 H-18 Q-22,14 -22,9 V-9 Q-22,-14 -18,-14Z', 'toi', N, 1.6],
    ['M-14,-9 H6.5 L13,-4 V4 L6.5,9 H-14Z', 'kim', N, 1.2], ['M-14,4.5 H12.4 L6.5,9 H-14Z', 'kim2'],
    ['M1.6,-7.4 L-6,1.2 H-1 L-3.2,7.4 L5.6,-1.4 H.6Z', 'sao', N, 1.1],
    ['M62,-6 l3.4,3.8 -5,2.2 3.8,4.6', '', 'c', 4.5, 0.5], ['M62,-6 l3.4,3.8 -5,2.2 3.8,4.6', '', 'trang', 1.8],
  ],
  // cấp 4 · Pháo Sao
  [
    ['M-23,-13 L-36,-21 V-5Z', 'toi', N, 1.6], ['M-23,13 L-36,21 V5Z', 'toi', N, 1.6], ['M-36,-13 l-6,3 6,2 M-36,13 l-6,-3 6,-2', '', 'sao', 2],
    [hop(-12, -27, 26, 10, 4.5), 'toi', N, 1.6], [tron(10, -22, 2.4), 'sao'],
    ['M17,-12 H44 L61,-20.5 V20.5 L44,12 H17Z', 'toi', N, 1.6], bong('M22,-8 H42 L55,-14'),
    [hop(25, -14.5, 7, 29, 3.5), 'kim', N, 1.6], [hop(37.5, -14.5, 7, 29, 3.5), 'kim', N, 1.6],
    [hop(57, -25, 12, 50, 6), 'sao', '', 0, 0.3], [hop(58, -23, 8, 46, 4), 'muc'], [hop(60.7, -15.5, 2.6, 31, 1.3), 'sao'],
    [hop(-26, -18, 47, 36, 13), 'c', N, 1.8],
    [hop(-20, -12.5, 33, 25, 9), 'kim', N, 1.6], ['M-17,6 H10 Q8,12.5 4,12.5 H-11 Q-15,12.5 -17,6Z', 'kim2'], bong('M-13,-9 H5'),
    [tron(-3.5, 0, 12), 'sao', '', 0, 0.3], [tron(-3.5, 0, 8.8), 'muc'], [tron(-3.5, 0, 6.4), 'sao'],
    ['M-3.5,-5.4 L-2,-1.5 L1.9,0 L-2,1.5 L-3.5,5.4 L-5,1.5 L-8.9,0 L-5,-1.5Z', 'trang'],
    [tron(-21, -12, 1.4), 'muc'], [tron(15, -12, 1.4), 'muc'], [tron(-21, 12, 1.4), 'muc'], [tron(15, 12, 1.4), 'muc'],
  ],
]
const netSung = (cap: number): Net[] => [[tron(0, 0, 6.2), 'muc'], ...SUNG[cap - 1], [tron(0, 0, 5), 'ao', 'muc', 1.6]]
/** Đầu nòng (x, hệ của súng) theo cấp — chỗ chớp lửa và nơi đạn bay ra. */
export const SUNG_NONG = [46, 55, 71, 67] as const
/** Cỡ súng so với nét vẽ gốc (thầy 12/11 chiều: «súng nhỏ hơn phù hợp với con ma»; trước là 1,12). */
export const SUNG_HE = 0.9
/** Khớp đeo súng trong hệ của bé ma (bên phải; chĩa trái thì đổi dấu x). */
export const KHOP = { x: 27, y: -25 } as const
/** Khung bao của hình bé ma và của súng (hệ riêng từng hình). */
const KHUNG_THAN = [-40, -112, 80, 116] as const
const KHUNG_SUNG = [-46, -32, 122, 64] as const

function bangDoi(b: BangMau, doi: number): Record<Khoa, Rgb> {
  const c = b.doi[doi] ?? b.chu
  return {
    c, sang: pha(c, b.trang, 0.62), toi: pha(c, b.muc, 0.32), ao: pha(c, b.trang, 0.91), day: pha(c, b.muc, 0.55),
    muc: b.muc, trang: b.trang, sao: b.sao, tin: b.tin, kim: pha(b.chu, b.vien, 0.06), kim2: pha(b.chu, b.vien, 0.36), chu2: b.chu2,
  }
}
function nuong(net: readonly Net[], bang: Record<Khoa, Rgb>, khung: readonly [number, number, number, number], doPhan: number): Anh {
  const [x, y, w, h] = khung, cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.ceil(w * doPhan)); cv.height = Math.max(1, Math.ceil(h * doPhan))
  const g = cv.getContext('2d')
  if (g && typeof Path2D === 'function') {
    g.setTransform(doPhan, 0, 0, doPhan, -x * doPhan, -y * doPhan)
    g.lineCap = 'round'; g.lineJoin = 'round'
    for (const [d, to, vien, day, dam] of net) {
      const p = new Path2D(d)
      g.globalAlpha = dam ?? 1
      if (to) { g.fillStyle = mau(bang[to]); g.fill(p) }
      if (vien) { g.strokeStyle = mau(bang[vien]); g.lineWidth = day ?? 1.6; g.stroke(p) }
    }
  }
  return { cv, x, y, w, h }
}
export interface BoHinh { than(doi: number, may: boolean): Anh; sung(doi: number, cap: number): Anh }
/** Bộ hình nướng dần theo nhu cầu ở độ phân giải `doPhan` (điểm ảnh cho một đơn vị hình). Đổi cỡ màn / đổi màu ⇒ tạo bộ mới. */
export function taoBoHinh(bang: BangMau, doPhan: number): BoHinh {
  const nho = new Map<string, Anh>()
  const lay = (khoa: string, tao: () => Anh): Anh => { let a = nho.get(khoa); if (!a) { a = tao(); nho.set(khoa, a) } return a }
  return {
    than: (doi, may) => lay(`t${doi}${may ? 1 : 0}`, () => nuong(netThan(doi, may), bangDoi(bang, doi), KHUNG_THAN, doPhan)),
    sung: (doi, cap) => lay(`s${doi}${cap}`, () => nuong(netSung(cap), bangDoi(bang, doi), KHUNG_SUNG, doPhan * SUNG_HE)),
  }
}
