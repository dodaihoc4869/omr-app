// MOL SỐNG ĐỘNG — PHẦN THUẦN (thầy chốt 02/11: «Chốt Mol sống động và hiệu ứng gắn luôn vào app, đảm bảo máy siêu yếu cũng hoạt động được»;
// bản trình diễn thầy duyệt: mô phỏng Rive bằng SVG + lò xo). Chỉ số và hàm thuần — không DOM — để test được và để mol-dong.ts (mảnh NẠP LƯỜI) dùng chung.
//   · Mỗi MẶT là một bộ số (mắt mở, mí trên / dưới, con ngươi, mày, miệng, má, giận, nút bấc, lửa, hiệu ứng, trọng số chuyển động riêng).
//     Đổi mặt ⇒ mọi số chạy về bộ số mới qua LÒ XO ⇒ chuyển trộn mượt (không cắt cảnh), chuyển động riêng của mặt cũng trộn theo trọng số.
//   · CHẾ ĐỘ: 'day-du' (máy thường) · 'gon' (máy yếu: 30 khung/giây, ≤ 1/3 hạt, mắt chỉ nhìn khi chạm, không kéo, không gradient đắt) ·
//     'tinh' (xin giảm chuyển động: chỉ chuyển mặt, không nảy / hạt / dõi mắt) · 'nho' (Mol < 64 px: mặt tĩnh + chớp CSS, KHÔNG vòng JS).
//   · VÒNG KHUNG chỉ chạy khi Mol đang hiện trên màn VÀ tab đang mở VÀ còn việc (lò xo chưa lắng, hạt, đang kéo, đang dõi tay) — nenChay().
import type { CheDoHieuUng } from '../../lib/hieu-ung-exp-cau'

/** Mặt vẽ được của Mol (4 mặt cuối là phương án, chưa gắn trạng thái). */
export type MatMol = 'vui' | 'khen' | 'chao' | 'nghi' | 'ngac' | 'buon' | 'ngu' | 'doi' | 'buc' | 'cau' | 'ratCau' | 'nguong' | 'me' | 'nhay' | 'tuTin'
export type CheDoMol = CheDoHieuUng | 'nho'
export type BoSo = Record<string, number>

/** Chọn chế độ: cỡ nhỏ trước (avatar / thẻ: không vòng JS); giảm chuyển động hoặc thiếu rAF ⇒ tĩnh; máy yếu ⇒ gọn. Cùng luật cheDoHieuUng của hiệu ứng EXP. */
export function cheDoMol(o: { mayYeu: boolean; giamChuyenDong: boolean; nho: boolean; coRaf?: boolean }): CheDoMol {
  if (o.nho) return 'nho'
  if (o.giamChuyenDong || o.coRaf === false) return 'tinh'
  return o.mayYeu ? 'gon' : 'day-du'
}

export interface ThongSoCheDo {
  /** Khoảng tối thiểu giữa hai khung vẽ (ms): 0 = theo rAF (~60 khung/giây); 33 ⇒ 30 khung/giây. */
  khungMs: number
  /** Số hạt bay cùng lúc tối đa (máy yếu ≤ 1/3 máy thường). */
  hatToiDa: number
  /** Tỉ lệ số hạt mỗi lần bung so với máy thường. */
  tiLeHat: number
  /** Mắt dõi theo tay / chuột liên tục (false ⇒ chỉ nhìn chỗ vừa chạm vào Mol). */
  doiMat: boolean
  /** Cho kéo Mol (chỉ nơi Mol to bật). */
  keo: boolean
  /** Có vòng JS không (cỡ nhỏ: không). */
  vong: boolean
  /** Nhảy / nảy / rung (giảm chuyển động: không). */
  nay: boolean
  /** Chuyển động nhàn rỗi bằng CSS (thở, đảo mắt, sóng, bọt, hiệu ứng mặt). Máy yếu: không — trang được nghỉ hẳn (0 hoạt ảnh vô hạn, 0 rAF nền). */
  cssNhanRoi: boolean
  /** Chớp mắt thưa bằng HẸN GIỜ (đổi một thuộc tính, mở lại sau 130 ms — không rAF, không hoạt ảnh CSS): máy yếu vẫn thấy Mol sống mà trang vẫn nghỉ. */
  chopHen: boolean
}
const HAT_DAY_DU = 18
export const THONG_SO: Readonly<Record<CheDoMol, ThongSoCheDo>> = {
  'day-du': { khungMs: 0, hatToiDa: HAT_DAY_DU, tiLeHat: 1, doiMat: true, keo: true, vong: true, nay: true, cssNhanRoi: true, chopHen: false },
  gon: { khungMs: 33, hatToiDa: Math.floor(HAT_DAY_DU / 3), tiLeHat: 1 / 3, doiMat: false, keo: false, vong: true, nay: true, cssNhanRoi: false, chopHen: true },
  tinh: { khungMs: 33, hatToiDa: 0, tiLeHat: 0, doiMat: false, keo: false, vong: true, nay: false, cssNhanRoi: false, chopHen: false },
  nho: { khungMs: 0, hatToiDa: 0, tiLeHat: 0, doiMat: false, keo: false, vong: false, nay: false, cssNhanRoi: false, chopHen: false },
}
/** Số hạt của một lần bung theo chế độ (máy yếu: 1/3, ít nhất 1 nếu máy thường có). */
export const soHat = (n: number, cd: CheDoMol): number => (n <= 0 || THONG_SO[cd].tiLeHat <= 0 ? 0 : Math.max(1, Math.round(n * THONG_SO[cd].tiLeHat)))
/** Vòng khung có được chạy không: phải đang hiện trên màn, tab đang mở, chế độ có vòng, và còn việc để vẽ. */
export function nenChay(o: { hien: boolean; tabMo: boolean; cheDo: CheDoMol; conViec: boolean }): boolean {
  return o.hien && o.tabMo && THONG_SO[o.cheDo].vong && o.conViec
}
/** Khung rAF này có vẽ không (máy yếu 30 khung/giây: bỏ khung tới khi đủ ~33 ms; chừa 4 ms lệch nhịp màn). */
export const denLuotVe = (cd: CheDoMol, msNay: number, msVeTruoc: number): boolean => THONG_SO[cd].khungMs <= 0 || msNay - msVeTruoc >= THONG_SO[cd].khungMs - 4

// ───────── LÒ XO ─────────
export class Lo {
  v: number; t: number; vel = 0; k: number; z: number
  constructor(v: number, k: number, z: number) { this.v = v; this.t = v; this.k = k; this.z = z }
  /** Một bước Euler nửa ẩn `h` giây; `zMin` = độ tắt tối thiểu (giảm chuyển động ⇒ ≥ 1, không nảy). */
  buoc(h: number, zMin = 0): void {
    if (this.vel === 0 && this.v === this.t) return // đã chốt: bỏ qua (phần lớn số của mặt đứng yên khi chỉ mắt / thân động)
    const z = Math.max(this.z, zMin)
    this.vel += (this.k * (this.t - this.v) - 2 * z * Math.sqrt(this.k) * this.vel) * h
    this.v += this.vel * h
    if (Math.abs(this.t - this.v) < 1e-4 && Math.abs(this.vel) < 1e-3) { this.v = this.t; this.vel = 0 }
  }
  /** Đã lắng: sát đích và gần như đứng yên. */
  lang(sai = 0.01): boolean { return Math.abs(this.t - this.v) < sai && Math.abs(this.vel) < sai * 6 }
  chot(): void { this.v = this.t; this.vel = 0 }
}
/** Tiến cả bộ lò xo `giay` giây theo bước con ≤ 1/120 s (ổn định ở 30 khung/giây). */
export function tienLo(ds: readonly Lo[], giay: number, zMin = 0): void {
  const n = Math.max(1, Math.ceil(giay / (1 / 120))), h = giay / n
  for (let i = 0; i < n; i++) for (const l of ds) l.buoc(h, zMin)
}
export const daLang = (ds: readonly Lo[], sai = 0.01): boolean => ds.every((l) => l.lang(sai))

// ───────── CẢM XÚC: mỗi mặt là một bộ số (bản trình diễn thầy duyệt) ─────────
export const L = 73, R = 127, Y = 98, ER = 26 // tâm hai mắt + bán kính tròng (khung 200 × 230)
export const GOC: Readonly<BoSo> = {
  eoL: 1, eoR: 1, arcL: 0, arcR: 0, alen: 15, lidL: -0.08, lidR: -0.08, ngL: 0, ngR: 0, lbL: 21, lbR: 21, pdx: 0, pdy: -1, psz: 14, heart: 0, glow: 0,
  boL: 0, boR: 0, bnL: 0, bnR: 0, bcL: 0, bcR: 0, bw: 4.6,
  mx: 100, my: 137, mw: 8.6, mt: 0, mu: 0, md: 6.3, mr: 0.667, msw: 2, mtg: 1,
  blush: 0.85, gian: 0, nut: 0, lua: 0, luaTo: 0, facex: 0, facey: 0, gazeW: 1,
  fSao: 0, fHoi: 0, fNgac: 0, fTim: 0, fNot: 0, fNuoc: 0, fNhiet: 0, fNgMa: 0, fPuff: 0, fZ: 0,
  wKhen: 0, wLac: 0, wNghi: 0, wBuon: 0, wNgu: 0, wDoi: 0, wBuc: 0, wCau: 0, wRat: 0, wMe: 0, wNhay: 0, wNguong: 0,
}
const MIENG_TO = { mx: 100, my: 135, mw: 14, mt: 0, mu: 0, md: 12.5, mr: 0.667, msw: 2, mtg: 1 }
const MAT_CUNG = { eoL: 0, eoR: 0, arcL: 1, arcR: 1, alen: 15, lbL: 42, lbR: 42 }
const MAY = (n: number, c: number, w = 4.6, chi?: 'R') => ({ boL: chi === 'R' ? 0 : 1, boR: 1, bnL: n, bnR: n, bcL: c, bcR: c, bw: w })
export const KHAC: Readonly<Record<MatMol, BoSo>> = {
  vui: {},
  khen: { ...MAT_CUNG, ...MIENG_TO, blush: 1.05, fSao: 1, wKhen: 1 },
  chao: { eoL: 1, eoR: 0, arcR: 0.9, pdx: 2, pdy: 0, lbL: 21, lbR: 42, ...MIENG_TO, wLac: 1, blush: 0.95 },
  nghi: { pdx: 6, pdy: -8, psz: 13, lbL: 19, lbR: 19, ...MAY(-0.6, 4, 4.6, 'R'), mx: 100.5, my: 142.3, mw: 7.5, mt: -0.75, mu: -1.4, md: -1.4, msw: 3.6, mtg: 0, fHoi: 1, wNghi: 1, gazeW: 0.25 },
  ngac: { psz: 9.5, pdy: 0, lbL: 42, lbR: 42, ...MAY(-0.2, 4), my: 143, mw: 6, mu: -7.5, md: 7.5, mr: 0, msw: 1.5, mtg: 0, fNgac: 1, gazeW: 0.6 },
  buon: { psz: 13, pdy: 7, lidL: 0.3, lidR: 0.3, ngL: -0.9, ngR: -0.9, lbL: 42, lbR: 42, ...MAY(-1.2, 1), my: 146, mw: 8, mu: -3.5, md: -3.5, msw: 3.8, mtg: 0, fNuoc: 1, wBuon: 1, gazeW: 0.35, blush: 0.7 },
  ngu: { eoL: 0, eoR: 0, arcL: -1, arcR: -1, lbL: 42, lbR: 42, my: 142, mw: 3.6, mu: -3, md: 3, mr: 0, msw: 1.2, mtg: 0, fZ: 1, wNgu: 1, gazeW: 0, blush: 0.75 },
  doi: { psz: 12.5, pdx: -8, pdy: 6, lidL: 0.46, lidR: 0.46, lbL: 42, lbR: 42, ...MAY(0.3, -1), my: 144.3, mw: 6, mt: 0.25, mu: -2.1, md: -2.1, msw: 3.6, mtg: 0, gian: 1, fPuff: 1, wDoi: 1, gazeW: 0.2, blush: 1.1, facex: -4 },
  buc: { psz: 12, pdy: 5, lidL: 0.36, lidR: 0.36, ngL: 0.7, ngR: 0.7, lbL: 18, lbR: 18, ...MAY(1, -2, 5), my: 143, mw: 6, mu: 0, md: 0, msw: 3.8, mtg: 0, gian: 2, wBuc: 1, gazeW: 0.5, blush: 1.15 },
  cau: { psz: 10, pdy: 5, lidL: 0.44, lidR: 0.44, ngL: 1.1, ngR: 1.1, lbL: 15, lbR: 15, ...MAY(1.5, -3, 5.4), my: 144.5, mw: 6.5, mu: -2, md: -2, msw: 4, mtg: 0, gian: 3, nut: 1, lua: 1, wCau: 1, gazeW: 0.5, blush: 1 },
  ratCau: { psz: 8, pdy: 5, lidL: 0.5, lidR: 0.5, ngL: 1.35, ngR: 1.35, lbL: 14, lbR: 14, ...MAY(1.9, -4, 5.8), my: 145, mw: 5.5, mu: -1.75, md: -1.75, msw: 4.4, mtg: 0, gian: 4, nut: 2, lua: 1.3, luaTo: 1, glow: 1, fNhiet: 1, wRat: 1, gazeW: 0.4, blush: 1 },
  nguong: { eoL: 0, eoR: 0, arcL: 0.78, arcR: 0.78, alen: 13, lbL: 42, lbR: 42, my: 141, mw: 6, mu: 2.75, md: 2.75, msw: 3.6, mtg: 0, blush: 1.45, fSao: 0.7, fNgMa: 1, wNguong: 1, facex: -5, facey: 2, gazeW: 0.3 },
  me: { heart: 1, lbL: 42, lbR: 42, ...MIENG_TO, blush: 1.25, fTim: 1, wMe: 1, gazeW: 0 },
  nhay: { ...MAT_CUNG, ...MIENG_TO, fSao: 0.8, fNot: 1, wNhay: 1, blush: 1.05 },
  // tự tin (phương án): con ngươi liếc phải, mí trên hơi sụp, chỉ mày phải nhướng, miệng nhếch một bên
  tuTin: { pdx: 5, pdy: 5, psz: 12.5, lidL: 0.42, lidR: 0.42, ngL: 0.15, ngR: 0.15, lbL: 42, lbR: 42, ...MAY(-0.5, 4, 4.6, 'R'), mx: 100.5, my: 141.5, mw: 8.5, mt: -1.75, mu: 2.6, md: 2.6, msw: 3.8, mtg: 0, fSao: 0.6, gazeW: 0.4, blush: 0.9 },
}
export const TEN_MAT = Object.keys(KHAC) as readonly MatMol[]
/** Bộ số đầy đủ của từng mặt (GOC đè bởi phần khác). */
export const MAT: Readonly<Record<MatMol, Readonly<BoSo>>> = Object.fromEntries(TEN_MAT.map((m) => [m, { ...GOC, ...KHAC[m] }])) as Record<MatMol, BoSo>
/** Cười khúc khích khi bị chạm (đè lên mặt hiện tại ~0,95 s). */
export const CUOI: Readonly<BoSo> = { ...MAT_CUNG, ...MIENG_TO, md: 13.5, heart: 0, lidL: -0.08, lidR: -0.08, ngL: 0, ngR: 0 }
/** Bị kéo: mắt tròn xoe, mày nhướng, miệng chữ O. */
export const BI_KEO: Readonly<BoSo> = { eoL: 1.12, eoR: 1.12, arcL: 0, arcR: 0, heart: 0, psz: 9.5, pdx: 0, pdy: 0, lidL: -0.08, lidR: -0.08, ngL: 0, ngR: 0, lbL: 42, lbR: 42, boL: 1, boR: 1, bnL: -0.25, bnR: -0.25, bcL: 5, bcR: 5, bw: 4.6, mx: 100, my: 143, mw: 6.5, mt: 0, mu: -8, md: 8, mr: 0, msw: 1.5, mtg: 0, gazeW: 0.3 }
/** Nhóm lò xo (độ cứng, độ tắt): mắt nhanh, mày / miệng vừa, màu giận chậm, nút bấc nảy nhiều. */
export const NHOM: Readonly<Record<string, readonly [number, number]>> = { mat: [380, 0.72], may: [210, 0.52], mieng: [250, 0.6], ma: [70, 1], mau: [22, 1], nut: [160, 0.38], lua: [55, 0.72], fx: [150, 0.58], dong: [50, 0.92], dau: [80, 0.85] }
export function nhomCua(k: string): string {
  if (/^(eo|arc|alen|lid|ng[LR]|lb|pd|psz|heart)/.test(k)) return 'mat'
  if (/^(bo|bn|bc|bw)/.test(k)) return 'may'
  if (/^m[xywtudr]$|^msw|^mtg/.test(k)) return 'mieng'
  if (k === 'blush' || k === 'glow') return 'ma'
  if (k === 'gian') return 'mau'
  if (k === 'nut') return 'nut'
  if (k === 'lua' || k === 'luaTo') return 'lua'
  if (/^f[A-Z]/.test(k)) return 'fx'
  if (/^w[A-Z]/.test(k)) return 'dong'
  return 'dau'
}
/** Bộ lò xo cho mọi số của mặt, đứng sẵn ở mặt `dau`. */
export function taoBoLo(dau: MatMol): Record<string, Lo> {
  const o: Record<string, Lo> = {}
  for (const k in GOC) { const [kk, z] = NHOM[nhomCua(k)]!; o[k] = new Lo(MAT[dau][k]!, kk, z) }
  return o
}
/** Đặt đích cho bộ lò xo: mặt `mat`, có thể đè thêm (cười khúc khích / bị kéo). */
export function datDich(lo: Record<string, Lo>, mat: MatMol, de?: Readonly<BoSo>): void {
  const m = MAT[mat]
  for (const k in lo) lo[k]!.t = de && de[k] !== undefined ? de[k]! : m[k]!
}
/** Đọc giá trị hiện tại của bộ lò xo thành bộ số. */
export function docBo(lo: Record<string, Lo>, ra: BoSo = {}): BoSo {
  for (const k in lo) ra[k] = lo[k]!.v
  return ra
}
/** Trộn thẳng hai mặt theo t ∈ [0, 1] (bản vẽ / test): t = 0 ⇒ a, t = 1 ⇒ b. */
export function tronMat(a: MatMol, b: MatMol, t: number): BoSo {
  const x = kep(t, 0, 1), o: BoSo = {}
  for (const k in GOC) o[k] = MAT[a][k]! + (MAT[b][k]! - MAT[a][k]!) * x
  return o
}

// ───────── HÌNH HỌC THUẦN ─────────
export const kep = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)
/** Chuyển êm (smoothstep) từ a tới b. */
export const em = (a: number, b: number, v: number): number => { const t = kep((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
export const f = (n: number): number => Math.round(n * 100) / 100
/** Làm tròn 0,1 đơn vị khung vẽ (≈ 0,05 px ở Mol 104 px): lò xo gần lắng thôi ghi DOM mỗi khung. */
export const f1 = (n: number): number => Math.round(n * 10) / 10
export const f3 = (n: number): number => Math.round(n * 1000) / 1000
/** Miệng là MỘT hình kín nội suy được: cười to ⇄ chữ O ⇄ nét ngang ⇄ mếu (u = cong mép trên, d = cong mép dưới, r = độ tròn, tilt = nghiêng). */
export function duongMieng(cx: number, cy: number, w: number, tilt: number, u: number, d: number, r: number): string {
  const xl = cx - w, xr = cx + w, yl = cy - tilt, yr = cy + tilt, hu = cy + (u * 4) / 3, hd = cy + (d * 4) / 3, dx = r * w
  return `M${f(xl)} ${f(yl)}C${f(xl + dx)} ${f(hu)} ${f(xr - dx)} ${f(hu)} ${f(xr)} ${f(yr)}C${f(xr - dx)} ${f(hd)} ${f(xl + dx)} ${f(hd)} ${f(xl)} ${f(yl)}Z`
}
/** Nhịp tim đập đôi (mặt «mê»). */
export function nhipTim(t: number): number { const a = Math.max(0, Math.sin(t * 7.4)), b = Math.max(0, Math.sin(t * 7.4 - 1.1)); return a ** 10 + 0.6 * b ** 10 }
/** Mực dung dịch theo độ giận (cáu dâng 14, rất cáu dâng 26 — như hình tĩnh). */
export const mucNuoc = (gian: number): number => 166 + (gian <= 2 ? 0 : gian <= 3 ? -14 * (gian - 2) : -14 - 12 * Math.min(1.3, gian - 3))

// ───────── SÓNG DUNG DỊCH (cùng một hàm cho vòng JS và CSS nhàn rỗi ⇒ trao tay không giật) ─────────
/** Bước sóng nền (đơn vị khung vẽ) và biên độ theo độ giận. */
export const SONG_K = 0.075
export const SONG_LAMBDA = (2 * Math.PI) / SONG_K
export const bienSong = (gian: number): number => 1.3 + gian * 0.55
/** Chu kỳ CSS (giây) của sóng nền theo mặt — tốc độ pha 28 · (1 + 0,45 · giận). mol.css dùng đúng các số này (data-song-nhip). */
export const chuKySong = (gian: number): number => Math.round((SONG_LAMBDA / (28 * (1 + gian * 0.45))) * 100) / 100
/** Đường sóng RỘNG thêm một bước sóng (CSS trượt ngang −λ … 0 suốt, cả lúc vòng JS chạy): y = S0 + A·sin(k·x) [+ gợn dội wa·sin(0,09x − 8,5t) khi vừa chạm /
 *  đáp đất], x từ −30 tới 232 + λ, đáy 280 (đủ phủ quả cầu cả khi nhóm nước xoay giữ thăng bằng ±0,5 rad). Trả mặt nước (đường) và khối nước (kín). */
export function duongSong(S0: number, A: number, wa = 0, t = 0): { mat: string; khoi: string } {
  const x0 = -30, x1 = 232 + SONG_LAMBDA, buoc = 9, y = (x: number) => S0 + A * Math.sin(SONG_K * x) + (wa ? wa * Math.sin(x * 0.09 - t * 8.5) : 0)
  let d = `M${x0} ${f1(y(x0))}`, px = x0, py = y(x0)
  for (let x = x0 + buoc; x <= x1 + buoc; x += buoc) { const xx = Math.min(x, x1), yy = y(xx); d += `Q${px} ${f1(py)} ${f1((px + xx) / 2)} ${f1((py + yy) / 2)}`; px = xx; py = yy; if (xx >= x1) break }
  d += `L${f(px)} ${f1(py)}`
  return { mat: d, khoi: `${d}V280H${x0}Z` }
}
/** Sóng nền đứng yên (tư thế nghỉ). */
export const duongSongRong = (S0: number, A: number): { mat: string; khoi: string } => duongSong(S0, A)

/** Ma trận biến hình (CSS `matrix(a, b, c, d, e, f)`) ⇒ dời, xoay (độ), co giãn — để vòng JS nhận lại đúng tư thế CSS đang dừng (trao tay không giật). */
export function tachMaTran(s: string | null | undefined): { x: number; y: number; r: number; sx: number; sy: number } {
  const m = /matrix\(([^)]+)\)/.exec(s || '')
  if (!m) return { x: 0, y: 0, r: 0, sx: 1, sy: 1 }
  const [a = 1, b = 0, c = 0, d = 1, e = 0, g = 0] = m[1]!.split(',').map((x) => parseFloat(x))
  const sx = Math.hypot(a, b) || 1
  return { x: e, y: g, r: (Math.atan2(b, a) * 180) / Math.PI, sx, sy: (a * d - b * c) / sx }
}

// ───────── THÂN TRÊN THẺ CHỨA (lớp riêng, bộ tổng hợp dời) ─────────
/** Ma trận 2D (a, b, c, d, e, f) như SVG / CSS. */
export type MaTran = readonly [number, number, number, number, number, number]
export const nhanMT = (m: MaTran, n: MaTran): MaTran => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]
export function nghichMT(m: MaTran): MaTran {
  const det = m[0] * m[3] - m[1] * m[2] || 1
  return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det]
}
const quanh = (cx: number, cy: number, m: MaTran): MaTran => nhanMT(nhanMT([1, 0, 0, 1, cx, cy], m), [1, 0, 0, 1, -cx, -cy])
/** Thân Mol (đơn vị khung vẽ): dời (X, Y) · nghiêng kéo rd quanh (100, 120) · xoay r + co giãn quanh gốc thân (100, 196) — viết lại thành MỘT phép
 *  «dời (tx, ty) · xoay (rd + r) · co giãn» quanh gốc thân ⇒ đặt được bằng translate / rotate / scale của CSS trên thẻ chứa (gốc 50% 96,52%). */
export function thanCss(X: number, Y: number, rd: number, r: number): { tx: number; ty: number; rot: number } {
  const a = (rd * Math.PI) / 180
  return { tx: X - 76 * Math.sin(a), ty: Y - 76 * (1 - Math.cos(a)), rot: rd + r }
}
/** Ma trận thân tương ứng thanCss (để tính phép bù cho bóng nằm trong SVG). */
export function maTranThan(tx: number, ty: number, rot: number, sx: number, sy: number): MaTran {
  const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a)
  return nhanMT([1, 0, 0, 1, tx, ty], quanh(100, 196, [c * sx, s * sx, -s * sy, c * sy, 0, 0]))
}
/** Bóng dưới đáy khi thân nằm trên thẻ chứa: bù ngược biến hình thân rồi đặt bóng đúng chỗ (theo X, co theo độ cao nhảy) ⇒ bóng không bay theo thân. */
export function maTranBong(than: MaTran, X: number, sx: number, sb: number): MaTran {
  return nhanMT(nghichMT(than), nhanMT([1, 0, 0, 1, X, 0], quanh(100, 199, [sb * sx, 0, 0, sb, 0, 0])))
}
