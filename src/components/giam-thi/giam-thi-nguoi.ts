// GIÁM THỊ HÌNH NGƯỜI (thầy chốt bản vẽ v3 27/10 «Chốt thay đi») — thay 4 giám thị dụng cụ cũ, GIỮ NGUYÊN API taoGiamThi / GiamThi của giam-thi-ve.ts.
//   nb trợ giảng trẻ (blouse xanh lá, kính bảo hộ trên trán, bình tam giác) · th chị nghiên cứu sinh (blouse tím, kính tròn, ống nghiệm)
//   vd chú kĩ thuật viên (tạp dề cam, kính ôm mắt, găng xanh, kẹp hồ sơ) · vdc bà giáo sư (blouse đỏ, tóc bạc búi cài bút chì, kính nửa vầng trăng, sổ ghi).
// Khối phẳng kiểu Duolingo, đầu to ~45 %, tay thuôn có khuỷu bo + bàn tay tròn viền, dáng nghiêng 3/4 khi chờ / đúng / càu nhàu.
// Khung xương LÒ XO: mọi tham số (dáng, mặt, miệng) nội suy bằng lò xo từ giá trị ĐANG CÓ ⇒ đổi tư thế không nhảy cóc, có quá đà (follow-through);
// mỗi động tác lớn mở bằng nhịp lấy đà (anticipation); tóc, vạt áo, đạo cụ trễ một nhịp theo lò xo phụ. Chỉ đổi transform / hình SVG, không bố cục.
// MÀU: không mã màu thô — mọi màu là biến --gn-* (giam-thi.css) pha color-mix từ bốn màu thân --gt-mau-* và biến --tr-* sẵn có.
// Tab ẩn / tamDung ⇒ dừng vòng rAF và hẹn giờ. Giảm chuyển động ⇒ tư thế tĩnh đổi theo cảm xúc. Máy yếu (html.may-yeu) ⇒ tư thế tĩnh như giảm chuyển động (27/10; trước: 30 khung/s).
import type { MucGT, TrangThaiGT } from './giam-thi-ve'
import { rung } from '../../lib/rung'

export interface GiamThi {
  readonly muc: MucGT
  readonly svg: SVGSVGElement
  datTrangThai(ten: TrangThaiGT, o?: { buoc?: number; xong?: () => void }): GiamThi
  trangThai(): TrangThaiGT
  nhin(nx: number, ny: number): GiamThi
  nhinVao(el: Element | null | undefined): GiamThi
  noi(chu: string | null | undefined, o?: { giu?: number }): GiamThi
  tamDung(dung: boolean): void
  huy(): void
}

const NS = 'http://www.w3.org/2000/svg'
const NAY = 'cubic-bezier(.34,1.56,.64,1)'
type Diem = [number, number] | [number, number, number]
type El = SVGElement
type So = Record<string, number>
type TT = Record<string, unknown>
type Khung = { d: number; k?: number; p?: TT }
type TrangThaiVe = { base?: TT; seq?: Khung[]; loop?: Khung[] }

const f1 = (v: number) => Math.round(v * 10) / 10
const rad = (d: number) => (d * Math.PI) / 180
const M = (k: string) => `var(--gn-${k})`
let soId = 0

function tao(tag: string, tt: Record<string, string | number> | null, cha?: Element | null): El {
  const e = document.createElementNS(NS, tag) as El
  if (tt) for (const k in tt) e.setAttribute(k, String(tt[k]))
  if (cha) cha.appendChild(e)
  return e
}
const to = (e: El, mau: string) => { e.style.fill = M(mau); return e }
const net = (e: El, mau: string, w: number) => { e.style.stroke = M(mau); e.setAttribute('stroke-width', String(w)); e.setAttribute('fill', 'none'); e.setAttribute('stroke-linecap', 'round'); e.setAttribute('stroke-linejoin', 'round'); return e }
// Đa giác bo góc — mọi khối hình dựng bằng hàm này: [[x, y, bánKínhGóc], …]
function dg(pts: Diem[]): string {
  let d = ''
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const p = pts[i]!, a = pts[(i + n - 1) % n]!, b = pts[(i + 1) % n]!, r = p[2] ?? 0
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1])
    const ra = Math.min(r, da / 2), rb = Math.min(r, db / 2)
    d += (i ? 'L' : 'M') + f1(p[0] + ((a[0] - p[0]) * ra) / da) + ',' + f1(p[1] + ((a[1] - p[1]) * ra) / da) + 'Q' + f1(p[0]) + ',' + f1(p[1]) + ' ' + f1(p[0] + ((b[0] - p[0]) * rb) / db) + ',' + f1(p[1] + ((b[1] - p[1]) * rb) / db)
  }
  return d + 'Z'
}
const H = (cha: Element, pts: Diem[] | string, mau: string, tt?: Record<string, string | number>) => to(tao('path', { d: typeof pts === 'string' ? pts : dg(pts), ...tt }, cha), mau)
const E = (cha: Element, cx: number, cy: number, rx: number, ry: number, mau: string, tt?: Record<string, string | number>) => to(tao('ellipse', { cx, cy, rx, ry, ...tt }, cha), mau)
const R = (cha: Element, x: number, y: number, w: number, h: number, r: number, mau: string, tt?: Record<string, string | number>) => to(tao('rect', { x, y, width: w, height: h, rx: r, ...tt }, cha), mau)

// ─────────────── ĐẠO CỤ (vẽ đứng thẳng, gốc = chỗ tay nắm) ───────────────
type Ve = (g: Element) => void
const binhTamGiac: Ve = (g) => {
  H(g, [[-4, -8, 1], [4, -8, 1], [4, 2, 0], [15, 26, 5], [-15, 26, 5], [-4, 2, 0]], 'kinh')
  H(g, [[-10.5, 15, 0], [10.5, 15, 0], [15, 26, 5], [-15, 26, 5]], 'tin')
  H(g, [[4, 13, 0], [10.5, 15, 0], [15, 26, 5], [7, 26, 2]], 'tinT')
  R(g, -6, -11, 12, 4, 2, 'nap'); E(g, -4, 9, 1.6, 4, 'trang'); E(g, -3, 20, 1.8, 1.8, 'tinS'); E(g, 3, 18, 1.2, 1.2, 'tinS')
}
const ongNghiem: Ve = (g0) => {
  const g = tao('g', { transform: 'translate(0,-12)' }, g0)
  R(g, -5.5, -16, 11, 36, 5.5, 'kinh'); H(g, 'M-5.5,2H5.5V14.5A5.5,5.5 0 0 1 -5.5,14.5Z', 'tim'); H(g, 'M1.5,2H5.5V14.5A5.5,5.5 0 0 1 1.5,19.5Z', 'timT')
  R(g, -7.5, -18, 15, 4.5, 2.2, 'nap'); R(g, -3, -12, 2.2, 11, 1.1, 'trang')
}
const kepHoSo: Ve = (g) => {
  R(g, -14, -6, 28, 36, 4, 'nau'); R(g, -11, -1, 22, 28, 2, 'trang'); R(g, -6, -9, 12, 6, 2.5, 'xam2')
  for (let i = 0; i < 3; i++) { R(g, -3, 4 + i * 8, 11, 2.6, 1.3, 'xam3'); net(tao('path', { d: `M-9,${5.5 + i * 8}l2,2l3.2,-4` }, g), i < 2 ? 'xanh' : 'do', 1.8) }
}
const soGhi: Ve = (g) => {
  R(g, -15, -4, 30, 36, 4, 'tinT'); R(g, -15, -4, 26, 36, 4, 'tin')
  for (const [c, h] of [[0, 0], [5, 0], [0, 1], [1, 1], [3, 1], [4, 1], [5, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2]] as const) R(g, -11 + c * 3.4, 4 + h * 3.4, 2.7, 2.7, 0.7, h === 0 || c > 2 ? 'trang' : 'tinN')
  R(g, -10, 20, 16, 2.6, 1.3, 'tinN'); R(g, -10, 25, 11, 2.6, 1.3, 'tinN')
}
const butViet: Ve = (g0) => {
  const g = tao('g', { transform: 'rotate(-25)' }, g0)
  R(g, -2.4, -20, 4.8, 24, 2.4, 'den'); R(g, -2.4, -20, 4.8, 7, 2.4, 'do'); H(g, 'M-2.2,3.5L0,9L2.2,3.5Z', 'xam3')
}

// ─────────────── 4 NHÂN VẬT ───────────────
// Toạ độ: gốc = mặt đất giữa hai chân, trục y xuống. Thân: gốc = hông. Đầu: gốc = cổ.
type Phan = Record<string, El>
type NV = {
  LH: number; dui: number; cang: number; hongX: number; chanW: number; TH: number; vaiX: number; vaiY: number; UA: number; FA: number; AW: number; tayR: number; kinhY: number
  ey: number; ex: number; erx: number; ery: number; pr: number; my: number; mw: number; bong: number; gang?: boolean
  mat: { lt: number; ba: number; mc: number }; vat: Ve; vat2?: Ve
  dau(P: Phan): void; than(P: Phan): void
}
const tai = (P: Phan, x: number, y0: number, y1: number) => { H(P.taiT!, [[-x - 8, y0, 6], [-x, y0, 6], [-x, y1, 6], [-x - 8, y1, 6]], 'da'); H(P.taiP!, [[x, y0, 6], [x + 8, y0, 6], [x + 8, y1, 6], [x, y1, 6]], 'da') }
const NV_NGUOI: Record<MucGT, NV> = {
  nb: {
    LH: 42, dui: 21, cang: 21, hongX: 12, chanW: 15, TH: 74, vaiX: 29, vaiY: 15, UA: 26, FA: 25, AW: 18, tayR: 1.22, kinhY: -72,
    ey: -38, ex: 14.5, erx: 11.5, ery: 13.5, pr: 7.4, my: -12, mw: 9, mat: { lt: 0, ba: 0, mc: 0 }, bong: 44, vat: binhTamGiac,
    dau(P) {
      tai(P, 42, -46, -26)
      H(P.dauHinh!, [[-45, -84, 34], [45, -84, 34], [45, 6, 30], [-45, 6, 30]], 'da')
      H(P.tocTruoc!, [[-48, -50, 5], [-47, -78, 22], [-26, -94, 18], [16, -98, 18], [42, -88, 16], [49, -66, 8], [48, -48, 4], [41, -56, 6], [22, -68, 12], [-8, -66, 12], [-38, -60, 8]], 'toc')
      H(P.tocNay!, [[-20, -90, 8], [2, -112, 12], [34, -116, 10], [50, -104, 8], [36, -96, 8], [16, -92, 8]], 'toc')
      H(P.tocNay!, [[14, -96, 6], [34, -112, 8], [48, -104, 6], [36, -96, 6]], 'tocT')
      E(P.tocTruoc!, -14, -86, 7, 3, 'trang', { opacity: 0.25, transform: 'rotate(-15 -14 -86)' })
      R(P.phuKien!, -48, -74, 96, 7, 3.5, 'tin')
      for (const s of [-1, 1]) { R(P.phuKien!, s * 15 - 13, -80, 26, 19, 8, 'tinT'); R(P.phuKien!, s * 15 - 10, -77, 20, 13, 5.5, 'tinN'); R(P.phuKien!, s * 15 - 7, -75.5, 4, 8, 2, 'trang') }
      E(P.mui!, 0, -21, 5, 4, 'daT'); E(P.mui!, -1.5, -22.5, 1.6, 1.2, 'trang', { opacity: 0.45 })
    },
    than(P) {
      H(P.thanTren!, [[-30, -74, 18], [30, -74, 18], [34, -24, 0], [-34, -24, 0]], 'ao')
      H(P.thanTren!, [[16, -74, 12], [30, -74, 18], [34, -24, 0], [23, -24, 0]], 'aoT')
      H(P.thanTren!, [[-12, -76, 3], [12, -76, 3], [0, -44, 4]], 'trang')
      H(P.thanTren!, [[-12, -76, 2], [-19, -74, 2], [-2, -42, 2]], 've'); H(P.thanTren!, [[12, -76, 2], [19, -74, 2], [2, -42, 2]], 've')
      R(P.thanTren!, -27, -50, 14, 11, 3, 'aoT'); R(P.thanTren!, -24, -56, 3, 8, 1.5, 'tin'); R(P.thanTren!, -19.5, -55, 3, 7, 1.5, 'do')
      H(P.vat!, [[-34, -27, 0], [34, -27, 0], [38, 6, 7], [-38, 6, 7]], 'ao'); H(P.vat!, [[23, -27, 0], [34, -27, 0], [38, 6, 7], [26, 6, 2]], 'aoT')
      R(P.vat!, -1, -27, 2, 33, 1, 'aoT'); E(P.vat!, -6, -32, 2.6, 2.6, 'trang'); E(P.vat!, -6, -14, 2.6, 2.6, 'trang')
    },
  },
  th: {
    LH: 42, dui: 21, cang: 21, hongX: 12, chanW: 14, TH: 70, vaiX: 25, vaiY: 15, UA: 25, FA: 24, AW: 17, tayR: 1.16, kinhY: -36,
    ey: -36, ex: 14.5, erx: 11.5, ery: 13.5, pr: 7.4, my: -11, mw: 8, mat: { lt: 0.06, ba: 2, mc: -0.5 }, bong: 46, vat: ongNghiem,
    dau(P) {
      E(P.tocSau!, 0, -96, 28, 25, 'toc'); E(P.tocSau!, 8, -101, 15, 10, 'tocT', { opacity: 0.7 }); E(P.tocSau!, -11, -108, 7, 4, 'trang', { opacity: 0.18, transform: 'rotate(-20 -11 -108)' })
      tai(P, 40, -42, -24); E(P.taiT!, -44, -20, 2.6, 2.6, 'sao'); E(P.taiP!, 44, -20, 2.6, 2.6, 'sao')
      H(P.dauHinh!, [[-43, -82, 38], [43, -82, 38], [43, 6, 34], [-43, 6, 34]], 'da')
      H(P.tocTruoc!, [[-46, -46, 8], [-45, -76, 30], [45, -76, 30], [46, -46, 8], [38, -56, 10], [10, -66, 18], [-12, -62, 14], [-38, -54, 10]], 'toc')
      R(P.tocTruoc!, -21, -86, 42, 10, 5, 'tim'); R(P.tocTruoc!, -21, -86, 42, 4, 2, 've')
      for (const s of [-1, 1]) { const c = tao('circle', { cx: s * 15, cy: -36, r: 16.5, 'fill-opacity': 0.12, 'stroke-width': 3.8 }, P.phuKien!); c.style.fill = M('trang'); c.style.stroke = M('gong') }
      R(P.phuKien!, -3, -40, 6, 3.4, 1.7, 'gong')
      E(P.mui!, 0, -20, 4.6, 3.6, 'daT')
    },
    than(P) {
      H(P.thanTren!, [[-25, -70, 15], [25, -70, 15], [33, -20, 0], [-33, -20, 0]], 'ao'); H(P.thanTren!, [[13, -70, 10], [25, -70, 15], [33, -20, 0], [22, -20, 0]], 'aoT')
      H(P.thanTren!, [[-11, -72, 3], [11, -72, 3], [0, -42, 4]], 'trang')
      H(P.thanTren!, [[-11, -72, 2], [-18, -70, 2], [-2, -38, 2]], 've'); H(P.thanTren!, [[11, -72, 2], [18, -70, 2], [2, -38, 2]], 've')
      H(P.vat!, [[-33, -23, 0], [33, -23, 0], [41, 22, 8], [-41, 22, 8]], 'ao'); H(P.vat!, [[22, -23, 0], [33, -23, 0], [41, 22, 8], [27, 22, 2]], 'aoT')
      R(P.vat!, -1, -23, 2, 45, 1, 'aoT'); R(P.vat!, -29, -6, 15, 12, 3, 'aoT'); E(P.vat!, -6, -30, 2.4, 2.4, 'khuy'); E(P.vat!, -6, -14, 2.4, 2.4, 'khuy')
    },
  },
  vd: {
    LH: 38, dui: 19, cang: 19, hongX: 14, chanW: 17, TH: 80, vaiX: 35, vaiY: 16, UA: 26, FA: 25, AW: 21, tayR: 1.3, kinhY: -36, gang: true,
    ey: -34, ex: 15, erx: 11, ery: 13, pr: 7, my: -8, mw: 9, mat: { lt: 0.16, ba: 5, mc: -1.5 }, bong: 50, vat: kepHoSo,
    dau(P) {
      tai(P, 44, -42, -22)
      H(P.dauHinh!, [[-47, -78, 26], [47, -78, 26], [47, 6, 24], [-47, 6, 24]], 'da')
      H(P.tocTruoc!, [[-50, -42, 4], [-49, -76, 14], [-40, -92, 9], [40, -92, 9], [49, -76, 14], [50, -42, 4], [43, -48, 4], [41, -66, 6], [-41, -66, 6], [-43, -48, 4]], 'toc')
      R(P.tocTruoc!, -32, -92, 64, 5, 2.5, 'trang', { opacity: 0.14 })
      H(P.tocTruoc!, [[-50, -62, 3], [-43, -62, 3], [-43, -46, 3], [-50, -42, 3]], 'bac'); H(P.tocTruoc!, [[43, -62, 3], [50, -62, 3], [50, -42, 3], [43, -46, 3]], 'bac')
      R(P.phuKien!, -51, -41, 16, 6, 3, 'den'); R(P.phuKien!, 35, -41, 16, 6, 3, 'den')
      const k = R(P.phuKien!, -37, -53, 74, 34, 15, 'kinh3', { 'fill-opacity': 0.28, 'stroke-width': 3 }); k.style.stroke = M('kinhV')
      H(P.phuKien!, 'M-25,-49L-17,-49L-31,-25L-35,-31Z', 'trang', { opacity: 0.4 })
      E(P.mui!, 0, -19, 6, 5, 'daT'); E(P.mui!, -2, -21, 1.8, 1.4, 'trang', { opacity: 0.45 })
      H(P.ria!, [[-17, -13, 6], [17, -13, 6], [14, -5, 5], [0, -8, 3], [-14, -5, 5]], 'toc')
    },
    than(P) {
      H(P.thanTren!, [[-39, -80, 20], [39, -80, 20], [40, -24, 0], [-40, -24, 0]], 'ao'); H(P.thanTren!, [[24, -80, 14], [39, -80, 20], [40, -24, 0], [28, -24, 0]], 'aoT')
      H(P.thanTren!, [[-12, -82, 2], [-1, -82, 2], [-6, -70, 2]], 'trang'); H(P.thanTren!, [[1, -82, 2], [12, -82, 2], [6, -70, 2]], 'trang')
      net(tao('path', { d: 'M-21,-62L-14,-82M21,-62L14,-82' }, P.thanTren!), 'cam', 5)
      H(P.thanTren!, [[-22, -64, 7], [22, -64, 7], [24, -24, 0], [-24, -24, 0]], 'cam'); H(P.thanTren!, [[12, -64, 6], [22, -64, 7], [24, -24, 0], [15, -24, 0]], 'camT')
      R(P.thanTren!, -12, -56, 24, 14, 4, 'camT'); R(P.thanTren!, -7, -60, 3, 7, 1.5, 'den'); R(P.thanTren!, -2, -59, 3, 6, 1.5, 'do')
      H(P.vat!, [[-40, -27, 0], [40, -27, 0], [40, 6, 8], [-40, 6, 8]], 'ao'); H(P.vat!, [[28, -27, 0], [40, -27, 0], [40, 6, 8], [30, 6, 2]], 'aoT')
      R(P.vat!, -42, -26, 84, 6, 3, 'camT')
      H(P.vat!, [[-26, -27, 0], [26, -27, 0], [33, 14, 7], [-33, 14, 7]], 'cam'); H(P.vat!, [[15, -27, 0], [26, -27, 0], [33, 14, 7], [20, 14, 2]], 'camT')
    },
  },
  vdc: {
    LH: 32, dui: 16, cang: 16, hongX: 13, chanW: 15, TH: 66, vaiX: 29, vaiY: 15, UA: 24, FA: 23, AW: 17.5, tayR: 1.16, kinhY: -24,
    ey: -34, ex: 14, erx: 11, ery: 12.5, pr: 7, my: -9, mw: 7, mat: { lt: 0.3, ba: 7, mc: -2.5 }, bong: 46, vat: soGhi, vat2: butViet,
    dau(P) {
      // búi tóc bạc RÕ ở 112 px: viền tông đậm, xoắn đậm, bút chì to hơn
      const bui = tao('g', null, P.tocSau!); bui.style.stroke = M('tocT'); bui.setAttribute('stroke-width', '3'); bui.style.paintOrder = 'stroke'
      E(bui, 0, -99, 20, 18, 'toc'); E(P.tocSau!, 6, -103, 9, 6, 'tocT')
      net(tao('path', { d: 'M-13,-96Q-9,-112 4,-110Q13,-105 6,-96' }, P.tocSau!), 'tocT', 3)
      const but = tao('g', { transform: 'rotate(32 0 -99)' }, P.tocSau!)
      R(but, -3.5, -130, 7, 36, 3.5, 'sao'); H(but, 'M-3.5,-130L0,-139L3.5,-130Z', 'daT'); R(but, -3.5, -98, 7, 5, 2, 'hong2')
      const toc = tao('g', null, P.tocSau!); toc.style.stroke = M('tocT'); toc.setAttribute('stroke-width', '3'); toc.style.paintOrder = 'stroke'
      H(toc, [[-52, -14, 16], [-52, -66, 34], [52, -66, 34], [52, -14, 16]], 'toc'); H(P.tocSau!, [[44, -40, 6], [52, -40, 10], [52, -14, 14], [44, -14, 6]], 'tocT')
      tai(P, 40, -40, -22); E(P.taiT!, -44, -18, 2.4, 2.4, 'trang'); E(P.taiP!, 44, -18, 2.4, 2.4, 'trang')
      H(P.dauHinh!, [[-44, -78, 36], [44, -78, 36], [44, 6, 38], [-44, 6, 38]], 'da')
      const mai = tao('g', null, P.tocTruoc!); mai.style.stroke = M('tocT'); mai.setAttribute('stroke-width', '2.4'); mai.style.paintOrder = 'stroke'
      H(mai, [[-48, -40, 6], [-47, -74, 30], [-10, -88, 30], [47, -74, 30], [48, -42, 6], [36, -58, 10], [10, -64, 14], [-6, -58, 8], [-22, -62, 12], [-40, -54, 8]], 'toc')
      E(P.tocTruoc!, -16, -80, 9, 3.4, 'trang', { transform: 'rotate(-12 -16 -80)' })
      // kính nửa vầng trăng: gọng ĐẬM 4,4 + tròng sáng hơn cho đọc rõ ở cỡ nhỏ; dây vàng
      for (const s of [-1, 1]) { const k = H(P.phuKien!, `M${s * 14 - 14},-28H${s * 14 + 14}A14,12 0 0 1 ${s * 14 - 14},-28Z`, 'trang', { 'fill-opacity': 0.32, 'stroke-width': 4.4, 'stroke-linejoin': 'round' }); k.style.stroke = M('den') }
      R(P.phuKien!, -4, -30.5, 8, 4.2, 2, 'den')
      const day = net(tao('path', { d: 'M-28,-27Q-42,-8 -30,10M28,-27Q42,-8 30,10', 'stroke-dasharray': '2 2.4' }, P.phuKien!), 'sao', 1.8); day.setAttribute('stroke-linecap', 'butt')
      E(P.mui!, 0, -19, 5, 4.4, 'daT')
    },
    than(P) {
      H(P.thanTren!, [[-29, -66, 18], [29, -66, 18], [37, -22, 0], [-37, -22, 0]], 'ao'); H(P.thanTren!, [[15, -66, 12], [29, -66, 18], [37, -22, 0], [25, -22, 0]], 'aoT')
      H(P.thanTren!, [[-12, -68, 3], [12, -68, 3], [0, -42, 4]], 'trang')
      H(P.thanTren!, [[-12, -69, 3], [-22, -66, 3], [-3, -38, 2]], 'trang'); H(P.thanTren!, [[12, -69, 3], [22, -66, 3], [3, -38, 2]], 'trang')
      E(P.thanTren!, 0, -58, 4, 4, 'sao')
      H(P.vat!, [[-37, -25, 0], [37, -25, 0], [42, 14, 10], [-42, 14, 10]], 'ao'); H(P.vat!, [[25, -25, 0], [37, -25, 0], [42, 14, 10], [29, 14, 3]], 'aoT')
      R(P.vat!, -1, -25, 2, 39, 1, 'aoT'); R(P.vat!, 14, -10, 16, 12, 3, 'aoT'); E(P.vat!, -6, -28, 2.5, 2.5, 'trang'); E(P.vat!, -6, -12, 2.5, 2.5, 'trang')
    },
  },
}
export const THU_TU_NGUOI: readonly MucGT[] = ['nb', 'th', 'vd', 'vdc']

// ─────────────── TƯ THẾ ───────────────
// Góc tay/chân: 0 = buông xuống, dương = mở ra ngoài, 180 = giơ thẳng lên, âm = vắt vào trong thân. T = bên TRÁI màn hình, P = bên PHẢI (phía đề).
// iT/iP = điểm bàn tay cần chạm (khung xương tự tính góc); [x, y, 'd'] = toạ độ đầu. q = quay 3/4 (dương = quay về phía đề).
export const CHUAN: So = {
  x: 0, y: 0, rot: 0, sq: 1, tr: 0, hx: 0, hy: 0, hr: 0, fx: 0.22, fy: 0, vai: 0, q: 0, toc: 0,
  aT: 9, bT: 5, aP: 9, bP: 5, dT: 1, dP: 1, l1T: 3, l2T: 0, l1P: 3, l2P: 0, fT: 0, fP: 0,
  px: 0.25, py: 0, ltT: 0, ltP: 0, lbT: 0, lbP: 0, la: 0, es: 1,
  byT: 0, byP: 0, baT: 0, baP: 0, mw: 0, mc: 3, mt: 2.4, mb: 2.4, mk: 0, hong: 0.45, vs: 1, vs2: 0, tho: 1, dh: 0,
}
const ROI: Record<string, string | number> = { mat: 'mo', hT: 'nam', hP: 'nam', zT: 0, zP: 0, khoa: 0 }
const MAT_KEY = new Set(['px', 'py', 'ltT', 'ltP', 'lbT', 'lbP', 'la', 'es', 'byT', 'byP', 'baT', 'baP', 'mw', 'mc', 'mt', 'mb', 'mk', 'hong'])
const A = (...ds: TT[]): TT => Object.assign({}, ...ds)

export function tuThe(muc: MucGT): Record<string, TrangThaiVe> {
  const C = NV_NGUOI[muc], m = THU_TU_NGUOI.indexOf(muc) + 1
  const k = [0, 0, 0.35, 0.7, 1][m]! // độ khó tính
  const TH = C.TH, S: Record<string, TrangThaiVe> = {}
  const hongT = { aT: 50, bT: -40 }, hongP = { aP: 50, bP: -40 }
  const khoanh = { aT: -6, iT: [25, -TH + 47], aP: -6, iP: [-26, -TH + 39], hT: 'nam', hP: 'nam', vs: 0, vs2: 0 }
  const cam = m === 4 ? { aT: 14, iT: [-10, -TH + 44], hT: 'cam', aP: 20, iP: [12, -TH + 40], hP: 'cam', vs2: 1 } : { aT: 14, iT: [-10, -TH + 43], hT: 'cam', aP: 11, bP: 3 }
  const yen = A(cam, { rot: -1.2, tr: 1.5, hr: 4, l1T: 7, l1P: 1 })
  const yenLoop: Khung[] = [{ d: 1800, k: 22, p: { rot: -2, hr: 5.5, tr: 2.5 } }, { d: 1800, k: 22, p: { rot: 0.5, hr: 2, tr: 0.5 } }]
  S.yen = { base: yen, loop: yenLoop }
  // đọc đề: liếc sang bong bóng đề, môi mấp máy nhẹ — chuyển động NHỎ (em đang đọc)
  S.doc = { base: A(yen, { px: 0.9, py: -0.15, hr: 6, fx: 0.4 }), seq: [{ d: 300, p: { mt: 1, mb: 3 } }, { d: 300, p: { mt: 2, mb: 2.4 } }, { d: 300, p: { mt: 1, mb: 3.5 } }, { d: 300, p: {} }, { d: 300, p: { mt: 1, mb: 3 } }, { d: 400, p: {} }], loop: yenLoop }
  const choMat = { px: 0.65, py: -0.1, ltT: 0.32, ltP: 0.32, mw: -2, mc: 0, mt: 0.6, mb: 0.6, mk: 1.6, baT: 2, baP: -3, byP: -2 }
  S.cho = {
    base: A(khoanh, choMat, { q: -0.55, rot: -2.5, tr: 3, hr: -9, hx: -2, l1T: 12, l2T: 3, l1P: -1 }),
    seq: [{ d: 140, k: 300, p: { y: 2, sq: 0.95, aT: 10, iT: null, bT: -30, aP: 10, iP: null, bP: -30 } }],
    loop: [
      { d: 180, k: 420, p: { fT: 26 } }, { d: 180, k: 420, p: {} }, { d: 180, k: 420, p: { fT: 26 } }, { d: 180, k: 420, p: {} }, { d: 180, k: 420, p: { fT: 26 } }, { d: 180, k: 420, p: {} },
      { d: 1300, p: { px: 0.05, py: 0.1, hr: -5, mk: 2.4 } },
    ],
  }
  const xemGio = A(hongP, { aT: 16, iT: [-23, -2, 'd'], hT: 'nam', zT: 1, dh: 1, vs: 0, vs2: 0, rot: -1.5, tr: 2, hr: -11, hx: -3, hy: 3, fx: -0.25, px: -0.75, py: 0.85, byT: -4, byP: -4, mw: -3, mc: 0, mt: -1.5, mb: 4, khoa: 1 })
  S['dong-ho'] = {
    base: xemGio, seq: [{ d: 140, k: 300, p: { aT: 24, iT: null, bT: -60, y: 1 } }],
    loop: [{ d: 1300, p: {} }, { d: 240, k: 320, p: { iT: [-26, 4, 'd'] } }, { d: 240, k: 320, p: {} },
      { d: 1500, p: { iT: [-30, 18, 'd'], hr: 3, hx: 0, hy: 1, fx: 0.3, px: 0.15, py: 0, ltT: 0.4, ltP: 0.4, byT: 0, byP: 0, baT: 3, baP: 3, mw: -1, mc: -1, mt: 0.6, mb: 0.6, mk: 1.6, vai: 2, khoa: 0 } }],
  }
  const kinh = (dy: number) => ({ aP: 14, iP: [5, C.kinhY + dy, 'd'] })
  // soi (giữ một lựa chọn lâu): nheo một mắt, đẩy kính, nghiêng nhẹ về đề — biên độ NHỎ
  S.soi = {
    base: A(hongT, kinh(19), { hP: 'chi', zP: 1, vs: 0, vs2: 0, rot: 2, tr: 3, hr: 7, hx: 2, fx: 0.45, l1T: 8, l1P: 2, px: 0.55, py: 0.45, ltT: 0.55, ltP: 0.05, baT: 5, baP: -4, byP: -3, mw: -2, mc: 0.6, mt: 0.6, mb: 0.6, mk: 2.4 }),
    seq: [{ d: 120, k: 320, p: { rot: -1, hr: -2, y: 1, iP: null, aP: 20, bP: -60 } }],
    loop: [{ d: 220, k: 400, p: kinh(13) }, { d: 220, k: 400, p: {} }, { d: 1600, p: { ltT: 0.62 } }],
  }
  // nghi ngờ (bấm Kiểm tra quá nhanh): xoa cằm, liếc, nhướng một bên mày
  S['nghi-ngo'] = {
    base: A(hongT, { aP: 22, iP: [6, 6, 'd'], hP: 'nam', zP: 1, vs: 0, vs2: 0, rot: -2.5, tr: -2, hr: -6, q: 0.25, px: 0.95, py: 0.1, ltT: 0.5, ltP: 0.45, baT: 7, baP: -6, byP: -5, mw: -2, mc: -0.5, mt: 0.4, mb: 0.6, mk: 2.6, khoa: 1 }),
    seq: [{ d: 110, k: 340, p: { y: 2, sq: 0.95 } }],
    loop: [{ d: 260, k: 300, p: { iP: [3, 9, 'd'] } }, { d: 260, k: 300, p: {} }, { d: 1200, p: {} }],
  }
  // nộp: cúi nhìn ô đã chọn
  S.nop = { base: A(yen, { hy: 3, hr: 3, tr: 3, px: 0.35, py: 0.95, fy: 1.5, ltT: 0.18, ltP: 0.18, mw: -2, mc: 1, mt: 1, mb: 1, khoa: 1 }), loop: [] }

  // ĐÚNG — nhịp lấy đà 80 ms rồi bật lên, tay vung rộng, lấp lánh quanh đầu
  const nhay = (y: number) => ({ y, sq: 1.12, aT: 132, bT: 150, aP: 132, bP: 150, zT: 1, zP: 1, hT: 'xoe', hP: 'xoe', vs: 0, vs2: 0, mat: 'cong', mw: 6, mc: 6, mt: -1, mb: 15, byT: -6, byP: -6, hong: 1, l1T: 14, l2T: -12, l1P: 14, l2P: -12, fx: 0, hr: 0, q: 0.3 })
  const lay: Khung = { d: 80, k: 520, p: { y: 7, sq: 0.8, aT: 30, bT: 20, aP: 30, bP: 20, hT: 'xoe', hP: 'xoe', vs: 0, vs2: 0, ltT: 0.3, ltP: 0.3, l1T: 18, l2T: -8, l1P: 18, l2P: -8, hy: 4 } }
  const vo = (y: number) => ({ aT: 24, iT: [-2, -TH + 30], aP: 24, iP: [2, -TH + 30], zT: 0, zP: 0, y })
  const voMo = { iT: [-19, -TH + 25], iP: [19, -TH + 25], y: -3 }
  const ngonCai = A(hongT, { aP: 56, bP: 166, hP: 'cai', zP: 1, vs: 0, vs2: 0, rot: -2.5, tr: -2, hr: -10, q: 0.4, ltT: 1, ltP: 0, lbP: 0.2, mw: 4, mc: 6, mt: 1, mb: 6.5, mk: -1, byP: -4, baP: -3, hong: 0.9 })
  if (m === 1) S.dung = { base: nhay(0), seq: [lay, { d: 280, k: 260, p: A(nhay(-32), { hieu: 'sao' }) }, { d: 170, k: 320, p: { sq: 0.9 } }], loop: [{ d: 270, k: 260, p: { y: -14, sq: 1.06, aT: 120, aP: 145, hr: -6 } }, { d: 270, k: 260, p: { y: 0, sq: 0.94, aT: 145, aP: 120, hr: 6 } }] }
  if (m === 2) S.dung = { base: A(nhay(0), vo(0), { mb: 13 }), seq: [lay, { d: 280, k: 260, p: A(nhay(-28), { hieu: 'sao' }) }, { d: 170, k: 320, p: { sq: 0.9 } }], loop: [{ d: 150, k: 520, p: voMo }, { d: 150, k: 520, p: {} }, { d: 150, k: 520, p: voMo }, { d: 150, k: 520, p: {} }, { d: 450, p: { hr: 6, y: -2 } }] }
  if (m === 3) S.dung = { base: ngonCai, seq: [{ d: 80, k: 480, p: { y: 5, sq: 0.86, aP: 18, bP: 10, hr: 4, hP: 'nam' } }, { d: 260, k: 260, p: { y: -14, sq: 1.08, hieu: 'sao' } }], loop: [{ d: 420, k: 300, p: { aP: 60, bP: 172 } }, { d: 420, k: 300, p: { aP: 54, bP: 160, hr: -7 } }] }
  if (m === 4) S.dung = { // gật gù + giơ ngón cái + nháy mắt, nhếch mép
    base: A(ngonCai, { q: 0.25, mat: 'mo', mw: 1, mc: 5, mt: 2, mb: 2.6, mk: 3.4, lbP: 0.28, hong: 0.8, rot: -1 }),
    seq: [{ d: 200, k: 260, p: { aP: 12, bP: 4, hP: 'nam', ltT: 0.4, ltP: 0.4, hy: 7, fy: 4, hr: 2 } }, { d: 200, k: 260, p: { aP: 12, bP: 4, hP: 'nam', ltT: 0.4, ltP: 0.4, hy: -1, fy: -1 } }, { d: 200, k: 260, p: { aP: 12, bP: 4, hP: 'nam', ltT: 0.4, ltP: 0.4, hy: 7, fy: 4, hieu: 'sao' } }, { d: 220, k: 300, p: {} }],
    loop: [{ d: 600, k: 260, p: {} }, { d: 600, k: 260, p: { hr: -6, aP: 60, bP: 170 } }],
  }

  // SAI — giật mình nhẹ rồi xị: ôm trán / úp mặt, vai rũ, giọt mồ hôi
  const buon = { khoa: 1, mat: 'mo', ltT: 0.42, ltP: 0.42, la: -12, baT: -11, baP: -11, byT: -3, byP: -3, mw: -1, mc: -5.5, mt: -2.5, mb: 1.5, py: 0.55, px: 0.1, hong: 0.2, vai: 6, sq: 0.9, vs: 0, vs2: 0 }
  const giat: Khung = { d: 110, k: 440, p: { y: -7, sq: 1.08, es: 1.15, byT: -8, byP: -8, mw: -3, mc: 0, mt: -3, mb: 7, aT: 40, bT: 34, aP: 40, bP: 34, iT: null, iP: null, vs: 0, vs2: 0, hT: 'xoe', hP: 'xoe', hieu: 'giot' } }
  if (m === 1) S.sai = { base: A(buon, { aP: 40, iP: [27, -54, 'd'], hP: 'xoe', zP: 1, aT: 6, bT: 2, hy: 7, hr: 12, hx: 2, rot: 1.5, tr: -2, ltP: 0.6, l1T: 4, l1P: 6 }), seq: [giat], loop: [{ d: 1100, k: 60, p: {} }, { d: 900, k: 40, p: { hr: 15, hy: 9, sq: 0.88, vai: 7 } }] }
  if (m === 2) S.sai = { base: A(buon, { aT: 18, iT: [-13, C.ey + 15, 'd'], aP: 18, iP: [13, C.ey + 15, 'd'], hT: 'xoe', hP: 'xoe', zT: 1, zP: 1, hy: 10, hr: 6, sq: 0.88, tr: 3, mat: 'nham', mc: -6, mw: -2, mt: -3, mb: 0 }), seq: [giat], loop: [{ d: 300, k: 200, p: { hr: 2 } }, { d: 300, k: 200, p: { hr: 9 } }, { d: 300, k: 200, p: { hr: 2 } }, { d: 1100, k: 60, p: { sq: 0.85, vai: 8 } }] }
  if (m === 3) S.sai = { base: A(buon, { aP: 24, iP: [4, C.ey + 8, 'd'], hP: 'xoe', zP: 1, aT: 4, bT: -2, hT: 'nam', hy: 11, hr: 3, tr: 4, rot: 2, sq: 0.86, mat: 'nham', baT: -6, baP: -6, mc: -5.5, mw: 0, mt: -2, mb: 1, vai: 8, l1T: 6, l1P: 7 }), seq: [giat], loop: [{ d: 420, k: 120, p: { hr: -4, hx: -2 } }, { d: 420, k: 120, p: { hr: 9, hx: 2 } }, { d: 420, k: 120, p: { hr: -4, hx: -2 } }, { d: 1000, k: 60, p: {} }] }
  const cauMat = { ltT: 0.5, ltP: 0.5, baT: 10, baP: 10, mw: -2, mc: -3, mt: 0, mb: 0.5, py: 0, hy: 0, fy: 0, khoa: 1 }
  const ghi = { aT: 14, iT: [-9, -TH + 45], aP: 24, iP: [11, -TH + 39], hT: 'cam', hP: 'cam', vs: 1, vs2: 1, hr: 4, hy: 4, fy: 2, px: -0.2, py: 0.85, khoa: 1, ltT: 0.45, ltP: 0.45, baT: 6, baP: 6, mw: -2, mc: -2.5, mt: 0, mb: 0.5, mk: -1.2 }
  const lacGhi: TrangThaiVe = { // khoanh tay lắc đầu rồi gạch sổ
    base: ghi,
    seq: [{ d: 160, k: 300, p: A(khoanh, cauMat, { px: 0.2, hr: 0 }) }, ...[-1, 1, -1, 1].map((s) => ({ d: 210, k: 300, p: A(khoanh, cauMat, { hr: s * 12, fx: s * 0.55, px: s * 0.6 }) })), { d: 260, k: 260, p: A(khoanh, cauMat, { hr: 0, fx: 0.2 }) }],
    loop: [{ d: 120, k: 600, p: { iP: [3, -TH + 43] } }, { d: 120, k: 600, p: { iP: [16, -TH + 37] } }, { d: 120, k: 600, p: { iP: [4, -TH + 46] } }, { d: 120, k: 600, p: { iP: [15, -TH + 40] } }, { d: 800, p: { hr: 2 } }],
  }
  if (m === 4) S.sai = lacGhi
  // CHƯA TÍNH: lắc ngón tay (Kíp: lắc đầu ghi sổ)
  const g = 0.45 + k * 0.55
  S['chua-tinh'] = m === 4 ? lacGhi : {
    base: A(hongT, { aP: 40, bP: 172, hP: 'chi', zP: 1, vs: 0, vs2: 0, rot: 2, tr: 2, hr: 6, q: 0.35, px: 0.5, mw: -1, mc: -2.5, mt: 0, mb: 1, baT: 7 * g, baP: 7 * g, ltT: 0.2, ltP: 0.2, la: 6 * g, khoa: 1 }),
    seq: [{ d: 110, k: 380, p: { y: 2, sq: 0.94, aP: 20, bP: 10, hP: 'nam' } }],
    loop: [{ d: 150, k: 480, p: { bP: 156 } }, { d: 150, k: 480, p: { bP: 188, hr: 3 } }, { d: 150, k: 480, p: { bP: 156 } }, { d: 150, k: 480, p: { bP: 186, hr: 3 } }, { d: 700, p: {} }],
  }
  // COMBO (theo sét): giật mình tóc dựng → hò reo; Kíp «không tệ» vỗ tay chậm
  const reo = (y: number) => A(nhay(y), { toc: 1, mb: 18, mw: 8, es: 1.1, q: 0 })
  S.combo = m === 4
    ? { base: A(vo(0), { hT: 'xoe', hP: 'xoe', vs: 0, vs2: 0, toc: 0.5, ltT: 0.36, ltP: 0.36, lbT: 0.26, lbP: 0.26, mw: 1, mc: 5, mt: 2, mb: 2.6, mk: 3.4, baT: -3, baP: -3, byP: -3, hong: 0.9, px: 0.15, q: 0.2 }),
        seq: [{ d: 120, k: 420, p: { toc: 1, es: 1.15, byT: -6, byP: -6, y: -4 } }, { d: 300, k: 260, p: { hy: 6, fy: 3.5, hieu: 'sao' } }, { d: 260, k: 260, p: {} }],
        loop: [{ d: 320, k: 260, p: voMo }, { d: 320, k: 260, p: {} }, { d: 320, k: 260, p: voMo }, { d: 320, k: 260, p: {} }, { d: 900, p: { hr: 4, hy: 2, fy: 1 } }] }
    : { base: reo(0), seq: [{ d: 110, k: 480, p: A(lay.p!, { toc: 1, es: 1.18, mat: 'mo', byT: -8, byP: -8, mt: -3, mb: 8 }) }, { d: 300, k: 240, p: A(reo(-40), { hieu: 'sao' }) }, { d: 170, k: 320, p: { sq: 0.86 } }, { d: 300, k: 240, p: reo(-26) }, { d: 170, k: 320, p: { sq: 0.9 } }],
        loop: [{ d: 270, k: 260, p: { y: -16, sq: 1.08, aT: 118, aP: 148, hr: -8 } }, { d: 270, k: 260, p: { y: 0, sq: 0.92, aT: 148, aP: 118, hr: 8 } }] }
  S.xong = m === 4 ? { base: S.combo.base, seq: S.combo.seq, loop: S.combo.loop } : { base: reo(0), seq: [lay, { d: 300, k: 240, p: A(reo(-38), { hieu: 'sao' }) }, { d: 170, k: 320, p: { sq: 0.86 } }], loop: S.combo.loop }
  // BỊ CHỌC: nảy lên, mắt nhắm tịt «><», miệng méo buồn cười; Kíp: phùng má «Hừ!»
  S.choc = m === 4
    ? { seq: [{ d: 90, k: 520, p: { y: 4, sq: 0.84 } }, { d: 380, k: 300, p: A(khoanh, { y: -8, sq: 1.08, es: 1.2, byT: -7, byP: -3, baT: 9, baP: 9, mw: -3, mc: -1, mt: -2, mb: 6, hong: 1.6, hr: -10, q: -0.3, khoa: 1 }) }, { d: 500, k: 260, p: A(khoanh, { hr: 8, mat: 'xoan', mw: 0, mc: -2, mt: 0, mb: 2, mk: 3, hong: 1.4, khoa: 1 }) }] }
    : { seq: [{ d: 90, k: 520, p: { y: 5, sq: 0.82 } }, { d: 360, k: 300, p: { y: -16, sq: 1.12, aT: 120, bT: 150, aP: 120, bP: 150, zT: 1, zP: 1, hT: 'xoe', hP: 'xoe', vs: 0, vs2: 0, mat: 'xoan', mw: 3, mc: 2, mt: -2, mb: 10, mk: 3, hr: -12, hong: 1.4, toc: 0.6 } },
        { d: 520, k: 240, p: { hr: 8, mat: 'cong', mw: 4, mc: 6, mt: 0, mb: 8, hong: 1.2, aT: 20, iT: [-4, -TH + 40], aP: 20, iP: [4, -TH + 40], hT: 'xoe', hP: 'xoe', vs: 0, vs2: 0 } }] }
  // ĐỘNG TÁC VẶT lúc đứng yên (8–15 s một lần): chỉnh kính · lắc đạo cụ · ngáp · gãi đầu
  S['phu-kinh'] = { seq: [{ d: 120, k: 320, p: A(yen, { iP: null, aP: 20, bP: -60 }) }, { d: 260, k: 380, p: A(yen, kinh(19), { hP: 'chi', zP: 1, ltT: 0.4 }) }, { d: 200, k: 380, p: A(yen, kinh(13), { hP: 'chi', zP: 1, ltT: 0.4 }) }, { d: 400, k: 200, p: A(yen, kinh(19), { hP: 'chi', zP: 1 }) }, { d: 300, k: 200, p: yen }] }
  S['phu-lac'] = { seq: [0, 1, 2, 3, 4, 5].map((i) => ({ d: 140, k: 520, p: A(yen, { iT: [-10 + (i % 2 ? 7 : -5), -TH + 43 + (i % 2 ? -3 : 3)], px: -0.4, py: 0.6, khoa: 1 }) })).concat([{ d: 300, k: 200, p: yen }]) }
  S['phu-ngap'] = { seq: [{ d: 260, k: 160, p: A(yen, { hy: -2, hr: -6, aP: 22, iP: [8, C.my + 2, 'd'], hP: 'xoe', zP: 1, mat: 'nham', mw: -1, mc: 0, mt: -6, mb: 12, es: 1, khoa: 1 }) }, { d: 900, k: 120, p: A(yen, { hy: -3, hr: -8, aP: 22, iP: [8, C.my + 2, 'd'], hP: 'xoe', zP: 1, mat: 'nham', mw: -1, mc: 0, mt: -7, mb: 14, khoa: 1 }) }, { d: 300, k: 200, p: A(yen, { ltT: 0.5, ltP: 0.5 }) }, { d: 300, k: 200, p: yen }] }
  S['phu-gai'] = { seq: [{ d: 240, k: 260, p: A(yen, { aP: 60, iP: [34, -64, 'd'], hP: 'nam', zP: 1, hr: 7, ltP: 0.55, mk: 2.4, mw: -2, mc: 1, mt: 0.6, mb: 0.6, px: 0.1, py: -0.6, khoa: 1 }) }, ...[0, 1, 2, 3].map((i) => ({ d: 130, k: 520, p: A(yen, { aP: 60, iP: [34 + (i % 2) * 4, -64 - (i % 2) * 5, 'd'], hP: 'nam', zP: 1, hr: 7, ltP: 0.55, mk: 2.4, mw: -2, mc: 1, mt: 0.6, mb: 0.6, px: 0.1, py: -0.6, khoa: 1 }) })), { d: 300, k: 200, p: yen }] }
  return S
}
const PHU = ['phu-kinh', 'phu-lac', 'phu-ngap', 'phu-gai']
/** Các giám thị đang sống (bộ chụp / máy quay video bản build điều khiển trạng thái qua đây). */
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
export const GT_DANG_SONG = new Set<GiamThi>()

// ─────────────── BỘ MÁY LÒ XO ───────────────
export function taoGiamThi(khung: HTMLElement, o: { muc: MucGT; tinh?: boolean; xam?: boolean; mo?: boolean; trangThai?: TrangThaiGT; buoc?: number; loiVao?: HTMLElement | null }): GiamThi {
  const muc = o.muc, C = NV_NGUOI[muc], id = 'gtn' + ++soId, TTV = tuThe(muc)
  const tinh = !!o.tinh
  // 27/10 (thầy: «Máy yếu bị lag»): máy yếu cũng dùng tư thế tĩnh đổi theo cảm xúc — KHÔNG chạy vòng rAF lò xo (đo CPU×6: ~120 lượt rAF/giây suốt lúc làm bài).
  const giam = !tinh && ((typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('may-yeu'))
  const mayYeu = () => document.documentElement.classList.contains('may-yeu')
  khung.innerHTML = ''
  if (tinh) khung.classList.add('gt-tinh')
  if (o.xam) khung.classList.add('gt-xam')
  if (o.mo) khung.classList.add('gt-mo-nhat')
  const svg = tao('svg', { viewBox: '-110 -240 220 254', class: 'gtv gtn', 'data-muc': muc, 'aria-hidden': 'true', focusable: 'false' }, khung) as SVGSVGElement
  const defs = tao('defs', null, svg)
  const P: Phan = {}
  const g = (ten: string, cha: Element) => (P[ten] = tao('g', null, cha))
  P.bong = E(svg, 0, 4, C.bong, 8, 'bong')
  g('goc', svg)
  const chan = [-1, 1].map((s) => {
    const cg = tao('g', null, P.goc!)
    const ong = net(tao('path', null, cg), 'quan', C.chanW)
    const giay = tao('g', null, cg)
    H(giay, [[-8, -6, 6], [5, -7, 7], [14, 0, 7], [14, 8, 4], [-9, 8, 4]], 'giay'); H(giay, [[-9, 4.5, 0], [14, 4.5, 0], [14, 8, 3], [-9, 8, 3]], 'giayT')
    return { ong, giay, s }
  })
  g('than', P.goc!); g('thanHinh', P.than!); g('vat', P.thanHinh!); g('thanTren', P.thanHinh!)
  C.than(P)
  E(P.thanTren!, 0, -C.TH + 3, 22, 7, 'aoT') // bóng dưới cằm
  g('lopSau', P.than!); g('dau', P.than!); g('tocSau', P.dau!); g('taiT', P.dau!); g('taiP', P.dau!); g('dauHinh', P.dau!); g('mat', P.dau!)
  g('hong', P.mat!); g('mui', P.mat!); g('ria', P.mat!); g('tocTruoc', P.dau!); g('tocNay', P.tocTruoc!); g('phuKien', P.dau!); g('hieu', P.dau!); g('lopTruoc', P.than!)
  E(P.hong!, -28, C.ey + 18, 7, 4.5, 'hong'); E(P.hong!, 28, C.ey + 18, 7, 4.5, 'hong')
  // mắt
  const mat2 = [-1, 1].map((s) => {
    const mg = tao('g', null, null); P.mat!.insertBefore(mg, P.mui!)
    const cid = `${id}e${s + 1}`
    E(tao('clipPath', { id: cid }, defs), 0, 0, C.erx, C.ery, 'trang')
    const tron = tao('g', null, mg)
    E(tron, 0, 0, C.erx, C.ery, 'trang')
    const trong = tao('g', { 'clip-path': `url(#${cid})` }, tron)
    const nguoi = tao('g', null, trong)
    E(nguoi, 0, 0, C.pr * 0.92, C.pr, 'den'); E(nguoi, -C.pr * 0.32, -C.pr * 0.42, C.pr * 0.34, C.pr * 0.34, 'trang')
    const miT = R(trong, -C.erx - 4, 0, 2 * C.erx + 8, 3 * C.ery, 0, 'da')
    const miD = E(trong, 0, 0, C.erx * 1.7, C.ery, 'da')
    const nham = net(tao('path', { d: `M${-C.erx + 1},1Q0,${C.ery * 0.55} ${C.erx - 1},1` }, mg), 'den', 3.4)
    const cong = net(tao('path', { d: `M${-C.erx + 1},4Q0,${-C.ery * 0.9} ${C.erx - 1},4` }, mg), 'den', 3.8)
    const xoan = net(tao('path', { d: s < 0 ? `M${-C.erx + 2},-7L${C.erx - 3},0L${-C.erx + 2},7` : `M${C.erx - 2},-7L${-C.erx + 3},0L${C.erx - 2},7` }, mg), 'den', 3.8)
    const may = R(P.mat!, -10, -3.5, 20, 7, 3.5, 'may')
    return { mg, tron, nguoi, miT, miD, nham, cong, xoan, may, s }
  })
  // miệng (một đường khép kín nội suy liên tục: góc trái / phải + điều khiển mép trên / dưới)
  const mieng = tao('g', null, null); P.mat!.insertBefore(mieng, P.ria!)
  const mcp = tao('path', null, tao('clipPath', { id: id + 'mi' }, defs))
  const miengHinh = H(mieng, '', 'mieng', { 'stroke-width': 3.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }); miengHinh.style.stroke = M('mieng')
  const mtr = tao('g', { 'clip-path': `url(#${id}mi)` }, mieng)
  const rang = R(mtr, -14, 0, 28, 5, 2, 'trang'), luoi = E(mtr, 0, 0, 8, 6, 'luoi')
  C.dau(P)
  for (const e of mat2) P.mat!.appendChild(e.may)
  // hiệu ứng: lấp lánh quanh đầu, giọt mồ hôi
  const sao = ([[-60, -74, 1], [58, -92, 0.8], [-44, -116, 0.7], [56, -40, 0.75]] as const).map(([x, y, s]) => {
    const e = H(P.hieu!, 'M0,-10Q1.6,-1.6 10,0Q1.6,1.6 0,10Q-1.6,1.6 -10,0Q-1.6,-1.6 0,-10Z', 'sao'); e.style.display = 'none'
    return { e, x, y, s }
  })
  const giot = H(P.hieu!, 'M48,-80Q56,-66 48,-60Q40,-66 48,-80Z', 'giot'); giot.style.display = 'none'
  // tay: thuôn (vai to → cổ tay nhỏ), khuỷu bo tròn, viền cùng tông; bàn tay tròn có viền
  const tay = [-1, 1].map((s) => {
    const tg0 = tao('g', null, P.lopSau!)
    const ong = H(tg0, '', 'ao', { 'stroke-width': 3, 'stroke-linejoin': 'round' }); ong.style.stroke = M('aoV'); ong.style.paintOrder = 'stroke'
    const co = net(tao('path', null, tg0), C.gang ? 'gang' : 'coTay', 1); co.setAttribute('stroke-linecap', C.gang ? 'round' : 'butt')
    let dh: El | null = null
    if (s < 0) { dh = tao('g', null, tg0); E(dh, 0, 0, C.AW * 0.5, 3.6, 'den'); const c = tao('circle', { r: 4.6, 'stroke-width': 2 }, dh); c.style.fill = M('trang'); c.style.stroke = M('den'); net(tao('path', { d: 'M0,0V-2.8M0,0H2' }, dh), 'den', 1.2) }
    const ban = tao('g', null, tg0), vat = tao('g', null, ban)
    if (s < 0) C.vat(vat)
    if (s > 0 && C.vat2) C.vat2(vat)
    const mau = C.gang ? 'gang' : 'da', toi = C.gang ? 'gangT' : 'daV'
    const kieu: Record<string, El> = {}
    const k1 = (ten: string) => { const h = (kieu[ten] = tao('g', { transform: `scale(${C.tayR})`, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, ban)); h.style.stroke = M(toi); h.style.paintOrder = 'stroke'; return h }
    const vach = (h: El, d: string) => { const p = net(tao('path', { d }, h), toi, 1.4); p.style.paintOrder = 'normal'; return p }
    let h = k1('nam'); E(h, 0, 8, 8.6, 8.8, mau); E(h, -6.4, 4, 3.4, 4.6, mau, { transform: 'rotate(28 -6.4 4)' })
    h = k1('cam'); E(h, 0, 8, 8.6, 8.8, mau); E(h, -6.5, 4, 3.4, 5.6, mau, { transform: 'rotate(40 -6.5 4)' })
    h = k1('xoe'); H(h, [[-8, 0, 6], [8, 0, 6], [9, 20, 8], [-8, 20, 8]], mau); E(h, -9.5, 6, 3.4, 6.6, mau, { transform: 'rotate(55 -9.5 6)' }); vach(h, 'M-3,13V18.5M2,13V18.5')
    h = k1('chi'); R(h, -1.5, 8, 6.4, 17, 3.2, mau); E(h, 0, 7, 8.4, 8, mau); E(h, -6, 4.5, 3.4, 4.6, mau, { transform: 'rotate(28 -6 4.5)' })
    h = k1('cai'); R(h, -4.6, 6, 7, 17, 3.5, mau); E(h, 0, 6, 9.6, 9, mau); vach(h, 'M3,2.5H8M3,7H9M3,11.5H8')
    return { tg0, ong, co, dh, ban, vat, kieu, s, z: 0, cho: null as number | null, kieuHien: '' }
  })

  // ── trạng thái số ──
  const v: So = { ...CHUAN }, van: So = {}, dich: So = { ...CHUAN }
  for (const key in v) van[key] = 0
  let roi: Record<string, string | number> = { ...ROI }
  let ten: TrangThaiGT = 'yen', tenVe = 'yen', khung2: TrangThaiVe | null = null, iK = 0, tK = 0, kK = 170, giaiDoan: 'seq' | 'loop' | 'xong' = 'seq'
  let t = 0, nhayMat = 0, henNhay = 1800 + Math.random() * 2500, henPhu = 9000 + Math.random() * 6000, fxSao = -1e9, fxGiot = -1e9, noiDen = 0
  let xongCb: (() => void) | null = null, truocChoc: TrangThaiGT = 'yen'
  let nhinXY: [number, number] | null = null
  const phu = { x: 0, v: 0, y: 0, vy: 0 }
  let truoc = { hr: 0, rot: 0, tr: 0, y: 0, x: 0 }
  const tichNhin = () => {
    if (!nhinXY || roi.khoa) return
    dich.px = nhinXY[0]; dich.py = nhinXY[1]
  }
  function apKhung(f: Khung) {
    const tt = A(khung2?.base ?? {}, f.p ?? {})
    for (const key in CHUAN) { const x = tt[key]; dich[key] = typeof x === 'number' ? x : CHUAN[key]! }
    if (tt.hieu === 'sao' && !mayYeu()) fxSao = t
    if (tt.hieu === 'giot' && !mayYeu()) fxGiot = t
    dich.ltT = Math.min(1, dich.ltT! + (dich.ltT! < 0.9 ? C.mat.lt : 0)); dich.ltP = Math.min(1, dich.ltP! + (dich.ltP! < 0.9 ? C.mat.lt : 0))
    dich.baT! += C.mat.ba; dich.baP! += C.mat.ba; dich.mc! += C.mat.mc
    // tay chạm đích: giữ góc cánh tay trên nếu tư thế cho sẵn, tính cẳng tay (co giãn nhẹ kiểu hoạt hình)
    for (const [s, T] of [[-1, 'T'], [1, 'P']] as const) {
      const di = tt['i' + T] as (number | string)[] | null | undefined
      if (!di) continue
      let x = di[0] as number, y = di[1] as number
      if (di[2] === 'd') {
        const gg = rad(dich.hr!), px = x + (dich.fx! + dich.q! * 0.85) * 7
        x = dich.hx! + px * Math.cos(gg) - y * Math.sin(gg)
        y = -C.TH + dich.hy! + px * Math.sin(gg) + y * Math.cos(gg)
      }
      const Sx = s * C.vaiX, Sy = -C.TH + C.vaiY + dich.vai!
      const X = s * (x - Sx), Y = y - Sy, D = Math.hypot(X, Y) || 1
      let a: number
      if (('a' + T) in tt) a = rad(dich['a' + T]!)
      else {
        const goc = Math.atan2(X, Y), c = (C.UA * C.UA + D * D - C.FA * C.FA) / (2 * C.UA * D), al = Math.acos(Math.max(-1, Math.min(1, c)))
        a = Math.cos(goc + al) > Math.cos(goc - al) ? goc + al : goc - al
      }
      const Ex = C.UA * Math.sin(a), Ey = C.UA * Math.cos(a)
      dich['a' + T] = (a * 180) / Math.PI
      dich['b' + T] = (Math.atan2(X - Ex, Y - Ey) * 180) / Math.PI
      dich['d' + T] = Math.max(0.6, Math.min(2.2, Math.hypot(X - Ex, Y - Ey) / C.FA))
    }
    const r: Record<string, string | number> = {}
    for (const key in ROI) { const x = tt[key]; r[key] = x == null ? ROI[key]! : (x as string | number) }
    for (const [i, kk] of [[0, 'zT'], [1, 'zP']] as const) {
      const ty = tay[i]!
      if (r[kk]) { ty.cho = null; if (!ty.z) { P.lopTruoc!.appendChild(ty.tg0); ty.z = 1 } } else if (ty.z) ty.cho = 260
    }
    roi = r; kK = f.k ?? 170
    tichNhin()
  }
  function batDau(tenMoi: string) {
    tenVe = TTV[tenMoi] ? tenMoi : 'yen'; khung2 = TTV[tenVe]!; iK = 0; tK = 0
    if (!['dung', 'combo', 'xong', 'choc'].includes(tenVe)) fxSao = -1e9
    if (tenVe !== 'sai') fxGiot = -1e9
    giaiDoan = khung2.seq?.length ? 'seq' : 'loop'
    const ds = giaiDoan === 'seq' ? khung2.seq! : khung2.loop
    if (ds?.length) apKhung(ds[0]!); else { apKhung({ d: 0, p: {} }); giaiDoan = 'xong' }
    if (tinh || giam) { for (const key in dich) { v[key] = dich[key]!; van[key] = 0 } ve() }
  }
  function hetSeq() {
    const cb = xongCb; xongCb = null
    if (tenVe === 'choc') { batDau(truocChoc); cb?.(); return }
    if (PHU.includes(tenVe)) { batDau('yen'); return }
    cb?.()
  }
  function tichPhan(dt: number) {
    t += dt * 1000
    if (khung2 && giaiDoan !== 'xong') {
      tK += dt * 1000
      const ds = giaiDoan === 'seq' ? khung2.seq! : khung2.loop!
      if (tK >= ds[iK]!.d) {
        tK = 0; iK++
        if (iK >= ds.length) {
          if (giaiDoan === 'seq') { iK = 0; if (khung2.loop?.length) giaiDoan = 'loop'; else { giaiDoan = 'xong'; apKhung({ d: 0, p: {}, k: 170 }) } hetSeq() }
          else iK = 0
        }
        if (giaiDoan !== 'xong' && khung2) apKhung((giaiDoan === 'seq' ? khung2.seq! : khung2.loop!)[iK]!)
      }
    }
    for (const ty of tay) if (ty.cho != null) { ty.cho -= dt * 1000; if (ty.cho <= 0) { ty.cho = null; P.lopSau!.appendChild(ty.tg0); ty.z = 0 } }
    // động tác vặt khi đứng yên lâu
    if (ten === 'yen' && tenVe === 'yen' && t > henPhu) { henPhu = t + 8000 + Math.random() * 7000; if (!mayYeu()) batDau(PHU[(Math.random() * PHU.length) | 0]!) }
    for (const key in v) {
      const mk = MAT_KEY.has(key), K = mk ? Math.max(kK, 380) : kK, z = mk ? 0.85 : 0.62
      van[key]! += (K * (dich[key]! - v[key]!) - 2 * Math.sqrt(K) * z * van[key]!) * dt
      v[key]! += van[key]! * dt
    }
    // lò xo phụ: tóc, vạt áo, đạo cụ trễ một nhịp theo đà thân
    const dhr = (v.hr! + v.rot! + v.tr! - (truoc.hr + truoc.rot + truoc.tr)) / dt, dy = (v.y! - truoc.y) / dt, dx = (v.x! + v.hx! - truoc.x) / dt
    truoc = { hr: v.hr!, rot: v.rot!, tr: v.tr!, y: v.y!, x: v.x! + v.hx! }
    const dichPhu = Math.max(-16, Math.min(16, -dhr * 0.05 - dx * 0.06))
    phu.v += (60 * (dichPhu - phu.x) - 2 * Math.sqrt(60) * 0.28 * phu.v) * dt; phu.x += phu.v * dt
    const dichY = Math.max(-0.14, Math.min(0.14, dy * 0.0016))
    phu.vy += (90 * (dichY - phu.y) - 2 * Math.sqrt(90) * 0.25 * phu.vy) * dt; phu.y += phu.vy * dt
    henNhay -= dt * 1000
    if (henNhay <= 0) { nhayMat = 1; henNhay = 2200 + Math.random() * 3200 }
    if (nhayMat > 0) nhayMat = Math.max(0, nhayMat - (dt * 1000) / 150)
  }
  // ghi thuộc tính chỉ khi đổi (đỡ việc cho trình duyệt mỗi khung)
  const cu = new WeakMap<Element, Record<string, string>>()
  const dat = (e: Element, k: string, val: string) => { let m = cu.get(e); if (!m) cu.set(e, (m = {})); if (m[k] !== val) { m[k] = val; if (k === 'display') (e as El).style.display = val; else e.setAttribute(k, val) } }
  const tf = (e: Element, s: string) => dat(e, 'transform', s)
  const thoang = (e: number, dai: number) => (e < 0 || e > dai ? -1 : e / dai)
  function ve() {
    const th = tinh || giam ? 0 : Math.sin((t / 3400) * Math.PI * 2) * v.tho!
    const sx = 1 + (1 - v.sq!) * 0.55, q = v.q!, aq = Math.abs(q)
    tf(P.goc!, `translate(${f1(v.x!)},${f1(v.y!)}) rotate(${f1(v.rot!)}) scale(${f1(sx * 100) / 100},${f1(v.sq! * 1000) / 1000})`)
    dat(P.bong!, 'rx', String(f1(C.bong * (1 + Math.min(0, v.y!) / 120))))
    dat(P.bong!, 'opacity', String(f1(1 + Math.min(0, v.y!) / 90)))
    for (const c of chan) {
      const s = c.s, T = s < 0 ? 'T' : 'P', xa = Math.max(0, s * q)
      const hx = s * C.hongX * (1 - 0.35 * xa) + q * 2, hy = -C.LH
      const a1 = rad(v['l1' + T]!), a2 = rad(v['l1' + T]! + v['l2' + T]!)
      const kx = hx + s * C.dui * Math.sin(a1), ky = hy + C.dui * Math.cos(a1)
      const ax = kx + s * C.cang * Math.sin(a2), ay = ky + C.cang * Math.cos(a2)
      dat(c.ong, 'd', `M${f1(hx)},${f1(hy - 6)}L${f1(hx)},${f1(hy)}L${f1(kx)},${f1(ky)}L${f1(ax)},${f1(ay - 2)}`)
      tf(c.giay, `translate(${f1(ax)},${f1(ay - 4)}) scale(${f1(s * (1 - 0.18 * xa) * 100) / 100},1) rotate(${f1(-v['f' + T]!)})`)
    }
    const tho = 1 + th * 0.016
    tf(P.than!, `translate(0,${-C.LH}) rotate(${f1(v.tr!)})`)
    tf(P.thanHinh!, `translate(${f1(q * 3)},0) scale(${f1((2 - tho) * (1 - 0.1 * aq) * 1000) / 1000},${f1(tho * 1000) / 1000})`)
    tf(P.vat!, `translate(0,-24) skewX(${f1(-phu.x * 0.7)}) translate(0,24)`)
    tf(P.dau!, `translate(${f1(v.hx! + q * 2)},${f1(-C.TH * tho + v.hy!)}) rotate(${f1(v.hr!)})`)
    const fxm = v.fx! + q * 0.85
    tf(P.mat!, `translate(${f1(fxm * 7)},${f1(v.fy!)})`)
    tf(P.phuKien!, `translate(${f1(fxm * 6)},${f1(v.fy! * 0.8)})`)
    for (const [e, s] of [[P.taiT!, -1], [P.taiP!, 1]] as const) { const xa = Math.max(0, s * q), gan = Math.max(0, -s * q); tf(e, `translate(${f1(-v.fx! * 2.5 - s * xa * 11 + s * gan * 2)},${f1(v.fy! * 0.4)})`) }
    const dung = 1 + Math.max(0, v.toc!) * 0.22
    tf(P.tocTruoc!, `translate(${f1(fxm * 2.5 + q * 2)},${f1(-58 * (dung - 1) * 0.35)}) translate(0,-60) scale(1,${f1(dung * 1000) / 1000}) translate(0,60)`)
    tf(P.tocNay!, `translate(10,-92) rotate(${f1(phu.x * 0.9)}) scale(1,${f1((1 - phu.y) * 1000) / 1000}) translate(-10,92)`)
    tf(P.tocSau!, `translate(${f1(-fxm * 2)},${f1(-Math.max(0, v.toc!) * 8)}) rotate(${f1(phu.x * 0.8)} 0 -80) translate(0,${f1(phu.y * 40)})`)
    // mắt
    const ns = Math.sin(nhayMat * Math.PI)
    for (const e of mat2) {
      const s = e.s, T = s < 0 ? 'T' : 'P', md = roi.mat
      tf(e.mg, `translate(${f1(s * C.ex)},${C.ey}) scale(${f1(v.es! * 100) / 100})`)
      const lt = Math.min(1, Math.max(0, Math.max(v['lt' + T]!, ns)))
      const thuong = md === 'mo'
      dat(e.tron, 'display', thuong && lt <= 0.9 ? '' : 'none')
      dat(e.cong, 'display', md === 'cong' ? '' : 'none')
      dat(e.xoan, 'display', md === 'xoan' ? '' : 'none')
      dat(e.nham, 'display', md === 'nham' || (thuong && lt > 0.9) ? '' : 'none')
      tf(e.nguoi, `translate(${f1(v.px! * C.erx * 0.42)},${f1(v.py! * C.ery * 0.38)})`)
      const yb = -C.ery + lt * 2 * C.ery
      dat(e.miT, 'y', String(f1(yb - 3 * C.ery)))
      tf(e.miT, `rotate(${f1(-s * v.la!)} 0 ${f1(yb)})`)
      dat(e.miD, 'cy', String(f1(2 * C.ery - Math.max(0, v['lb' + T]!) * 2 * C.ery + 2)))
      tf(e.may, `translate(${f1(s * C.ex)},${f1(C.ey - C.ery - 9 + v['by' + T]! - (md === 'cong' ? 3 : 0))}) rotate(${f1(-s * v['ba' + T]!)})`)
    }
    dat(P.hong!, 'opacity', String(f1(Math.min(1, v.hong!))))
    // miệng — mấp máy đúng lúc chữ càu nhàu gõ ra
    const dangNoi = t < noiDen && !giam, nhip = dangNoi ? Math.floor(t / 90) % 3 : 0
    const w = C.mw + v.mw! - (dangNoi ? 1.5 : 0), yl = -v.mc! + v.mk!, yr = -v.mc! - v.mk!, ym = (yl + yr) / 2
    const mt = ym + v.mt! - (dangNoi ? 1 : 0), mb = Math.max(mt, ym + v.mb! + (dangNoi ? [6, 2, 4][nhip]! : 0))
    const d = `M${f1(-w)},${f1(yl)}Q0,${f1(mt * 2 - ym)} ${f1(w)},${f1(yr)}Q0,${f1(mb * 2 - ym)} ${f1(-w)},${f1(yl)}Z`
    dat(miengHinh, 'd', d); dat(mcp, 'd', d)
    tf(mieng, `translate(${f1(v.fx! * 1.5 + q * 3)},${C.my})`)
    dat(rang, 'y', String(f1(Math.min(yl, yr, mt) - 3)))
    dat(rang, 'display', mb - mt > 4 ? '' : 'none')
    dat(luoi, 'cy', String(f1(mb + 3))); dat(luoi, 'rx', String(f1(Math.max(3, w * 0.6))))
    // tay
    const vaiY = -C.TH * tho + C.vaiY + v.vai!
    for (const ty of tay) {
      const s = ty.s, T = s < 0 ? 'T' : 'P', xa = Math.max(0, s * q)
      const a = rad(v['a' + T]!), b = rad(v['b' + T]!), dd = v['d' + T]!
      const Sx = s * C.vaiX * (1 - 0.2 * xa) + q * 2, Sy = vaiY
      const Ex = Sx + s * C.UA * Math.sin(a), Ey = Sy + C.UA * Math.cos(a)
      const Hx = Ex + s * C.FA * dd * Math.sin(b), Hy = Ey + C.FA * dd * Math.cos(b)
      dat(ty.ong, 'd', ongTay(Sx, Sy, Ex, Ey, Hx, Hy, C.AW * 1.08, C.AW * 0.96, C.AW * 0.78))
      const ux = s * Math.sin(b), uy = Math.cos(b), lc = C.gang ? 12 : 5
      dat(ty.co, 'd', `M${f1(Hx - ux * lc)},${f1(Hy - uy * lc)}L${f1(Hx)},${f1(Hy)}`)
      dat(ty.co, 'stroke-width', String(f1(C.AW * 0.78 + (C.gang ? 3 : 1.5))))
      if (ty.dh) { tf(ty.dh, `translate(${f1(Hx - ux * 9)},${f1(Hy - uy * 9)}) rotate(${f1(-s * v['b' + T]!)}) scale(${f1(Math.max(0, v.dh!) * 100) / 100})`); dat(ty.dh, 'display', v.dh! < 0.05 ? 'none' : '') }
      tf(ty.ban, `translate(${f1(Hx)},${f1(Hy)}) scale(${s},1) rotate(${f1(-v['b' + T]!)})`)
      const kh = String(roi['h' + T])
      if (ty.kieuHien !== kh) { for (const n in ty.kieu) ty.kieu[n]!.style.display = n === kh ? '' : 'none'; ty.kieuHien = kh }
      const vs = Math.max(0, s < 0 ? v.vs! : v.vs2!)
      tf(ty.vat, `translate(0,7) rotate(${f1(v['b' + T]!)}) scale(${s},1) rotate(${f1(phu.x * 0.6)}) scale(${f1(vs * 100) / 100})`)
      dat(ty.vat, 'display', vs < 0.03 ? 'none' : '')
    }
    // lấp lánh (2 nhịp) + giọt mồ hôi
    for (const [i, sv] of sao.entries()) {
      const e = t - fxSao - i * 110, k = e < 0 || e > 1500 ? -1 : (e % 750) / 750
      if (k < 0) { dat(sv.e, 'display', 'none'); continue }
      const sc = (k < 0.4 ? (k / 0.4) * 1.2 : 1.2 * (1 - (k - 0.4) / 0.6)) * sv.s
      dat(sv.e, 'display', ''); tf(sv.e, `translate(${sv.x},${sv.y}) rotate(${f1(k * 90)}) scale(${f1(sc * 100) / 100})`)
    }
    const kg = thoang(t - fxGiot - 120, 1500)
    dat(giot, 'display', kg < 0 ? 'none' : ''); if (kg >= 0) { tf(giot, `translate(${f1(fxm * 4)},${f1(kg * 16)})`); dat(giot, 'opacity', String(f1(kg < 0.15 ? kg / 0.15 : kg > 0.75 ? (1 - kg) / 0.25 : 1))) }
  }
  function ongTay(Sx: number, Sy: number, Ex: number, Ey: number, Hx: number, Hy: number, w1: number, w2: number, w3: number): string {
    const L1 = Math.hypot(Ex - Sx, Ey - Sy) || 1, L2 = Math.hypot(Hx - Ex, Hy - Ey) || 1
    const u1 = [(Ex - Sx) / L1, (Ey - Sy) / L1] as const, u2 = [(Hx - Ex) / L2, (Hy - Ey) / L2] as const
    const n1 = [-u1[1], u1[0]] as const, n2 = [-u2[1], u2[0]] as const
    const r = Math.min(7, L1 * 0.45, L2 * 0.45), dot = n1[0] * n2[0] + n1[1] * n2[1], mi = 1 / Math.max(0.45, 1 + dot)
    const ben = (k: number) => {
      const a = [Sx + k * n1[0] * w1 / 2, Sy + k * n1[1] * w1 / 2], p1 = [Ex + k * n1[0] * w2 / 2 - u1[0] * r, Ey + k * n1[1] * w2 / 2 - u1[1] * r]
      const c = [Ex + k * (n1[0] + n2[0]) * mi * w2 / 2, Ey + k * (n1[1] + n2[1]) * mi * w2 / 2], p2 = [Ex + k * n2[0] * w2 / 2 + u2[0] * r, Ey + k * n2[1] * w2 / 2 + u2[1] * r]
      const b = [Hx + k * n2[0] * w3 / 2, Hy + k * n2[1] * w3 / 2]
      return { a, p1, c, p2, b }
    }
    const A1 = ben(1), B1 = ben(-1), P = (p: number[]) => `${f1(p[0]!)},${f1(p[1]!)}`
    const tip = [Hx + u2[0] * w3 / 2, Hy + u2[1] * w3 / 2], goc = [Sx - u1[0] * w1 / 2, Sy - u1[1] * w1 / 2]
    return `M${P(A1.a)}L${P(A1.p1)}Q${P(A1.c)} ${P(A1.p2)}L${P(A1.b)}Q${P([A1.b[0]! + u2[0] * w3 / 2, A1.b[1]! + u2[1] * w3 / 2])} ${P(tip)}Q${P([B1.b[0]! + u2[0] * w3 / 2, B1.b[1]! + u2[1] * w3 / 2])} ${P(B1.b)}` +
      `L${P(B1.p2)}Q${P(B1.c)} ${P(B1.p1)}L${P(B1.a)}Q${P([B1.a[0]! - u1[0] * w1 / 2, B1.a[1]! - u1[1] * w1 / 2])} ${P(goc)}Q${P([A1.a[0]! - u1[0] * w1 / 2, A1.a[1]! - u1[1] * w1 / 2])} ${P(A1.a)}Z`
  }

  // ── vòng lặp (dừng khi tab ẩn / tamDung) ──
  // 27/10 MƯỢT: giám thị ra khỏi khung nhìn (em cuộn đề dài) ⇒ vòng rAF ngủ; vào lại ⇒ chạy tiếp (IntersectionObserver, không đo bố cục mỗi khung).
  let raf = 0, lan = 0, dung = false, tichLuy = 0, khuat = false
  const lap = (now: number) => {
    raf = 0
    if (dung || khuat || document.hidden) { lan = 0; return }
    if (dangNhuongKhung(now)) { raf = requestAnimationFrame(lap); return } // em vừa chạm: nhường khung cho phản hồi nút 
    const dtms = lan ? Math.min(100, now - lan) : 16
    lan = now
    tichLuy += dtms
    if (!mayYeu() || tichLuy >= 30) { let con = tichLuy; tichLuy = 0; while (con > 0) { const dt = Math.min(con, 8); tichPhan(dt / 1000); con -= dt } ve() }
    raf = requestAnimationFrame(lap)
  }
  const chay = () => { if (!raf && !tinh && !giam && !dung && !khuat) { lan = 0; raf = requestAnimationFrame(lap) } }
  const quan = !tinh && !giam && typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver((ds) => { khuat = !ds.some((x) => x.isIntersecting); if (!khuat) chay() }) : null
  quan?.observe(svg)
  const hienLai = () => { if (!document.hidden) chay() }
  document.addEventListener('visibilitychange', hienLai)
  // bấm vào giám thị ⇒ bị chọc
  const choc = () => {
    if (tinh) return
    try { rung('chon') } catch { /* máy không rung */ }
    if (tenVe !== 'choc') truocChoc = ten
    batDau('choc')
  }
  if (!tinh) { svg.addEventListener('click', choc); svg.style.cursor = 'pointer' }

  // bong bóng càu nhàu: giữ nguyên cách cũ (gõ từng chữ, mũi nhọn chĩa xuống đầu), thêm miệng mấp máy theo chữ
  let loiHen: number[] = []
  const gt: GiamThi = {
    muc, svg,
    datTrangThai(tenMoi, oo = {}) {
      ten = tenMoi; xongCb = oo.xong ?? null
      batDau(tenMoi)
      if (giaiDoan !== 'seq' && xongCb) { const cb = xongCb; xongCb = null; window.setTimeout(cb, 0) }
      if (giam && xongCb) { const cb = xongCb; xongCb = null; window.setTimeout(cb, 0) }
      chay()
      return gt
    },
    trangThai: () => ten,
    nhin(nx, ny) { nhinXY = [Math.max(-1, Math.min(1, +nx || 0)), Math.max(-1, Math.min(1, +ny || 0))]; tichNhin(); if (giam) { v.px = dich.px!; v.py = dich.py!; ve() } return gt },
    nhinVao(el) {
      if (!el) return gt.nhin(0, 0)
      const r1 = svg.getBoundingClientRect(), r2 = el.getBoundingClientRect()
      const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2), dy = r2.top + r2.height / 2 - (r1.top + r1.height * 0.33)
      const dd = Math.hypot(dx, dy) || 1, kk = Math.min(1, dd / 120)
      return gt.nhin((dx / dd) * kk, (dy / dd) * kk)
    },
    noi(chu, oo = {}) {
      loiHen.forEach((x) => { clearTimeout(x); clearInterval(x) }); loiHen = []
      const vao = o.loiVao ?? khung
      vao.querySelectorAll(':scope > .gt-loi').forEach((e) => e.remove())
      if (!chu) { noiDen = 0; return gt }
      const el = document.createElement('div'); el.className = 'gt-loi'; el.setAttribute('role', 'status'); el.dataset.muc = muc
      const da = document.createElement('span'), con = document.createElement('span'); con.className = 'an'
      el.append(da, con)
      const lech = vao === khung ? 0 : khung.getBoundingClientRect().left - vao.getBoundingClientRect().left
      el.style.setProperty('--gt-loi-duoi', Math.max(14, lech + khung.clientWidth * 0.5 - 7).toFixed(1) + 'px')
      vao.appendChild(el)
      if (tinh || giam || dung) { da.textContent = chu; if (tinh) return gt } else con.textContent = chu
      if (typeof el.animate === 'function') el.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.05)', offset: 0.65 }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: NAY })
      if (!giam && !dung) {
        noiDen = t + chu.length * 34 + 60
        let i = 0
        const go = window.setInterval(() => { i++; da.textContent = chu.slice(0, i); con.textContent = chu.slice(i); if (i >= chu.length) clearInterval(go) }, 34)
        loiHen.push(go)
      }
      loiHen.push(window.setTimeout(() => { if (typeof el.animate !== 'function') { el.remove(); return } const an = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px) scale(.96)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' }); an.onfinish = () => el.remove() }, chu.length * 34 + (oo.giu ?? 1900)))
      return gt
    },
    tamDung(d) {
      if (d === dung || tinh) return
      dung = d
      khung.classList.toggle('gt-dung', d)
      if (d) { if (raf) cancelAnimationFrame(raf); raf = 0 } else chay()
    },
    huy() {
      if (raf) cancelAnimationFrame(raf); raf = 0; dung = true
      quan?.disconnect()
      document.removeEventListener('visibilitychange', hienLai)
      svg.removeEventListener('click', choc)
      o.loiVao?.querySelectorAll(':scope > .gt-loi').forEach((e) => e.remove())
      loiHen.forEach((x) => { clearTimeout(x); clearInterval(x) })
      khung.innerHTML = ''; khung.classList.remove('gt-tinh', 'gt-xam', 'gt-mo-nhat', 'gt-dung')
      GT_DANG_SONG.delete(gt)
    },
  }
  GT_DANG_SONG.add(gt)
  batDau(o.trangThai ?? 'yen'); ten = o.trangThai ?? 'yen'
  for (const key in dich) { v[key] = dich[key]!; van[key] = 0 }
  ve()
  chay()
  return gt
}
