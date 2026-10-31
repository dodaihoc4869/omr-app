// LÕI THUẦN «Đấu Nguyên Tử 2» (thầy duyệt 31/10, docs/DE-XUAT-DAU-ION-V2-3110.md) — súng TỰ NGẮM bạn gần nhất và TỰ BẮN, em chỉ quyết hướng đi;
// nhặt electron để súng tiến hoá 5 cấp; Xúc tác lên ngay một cấp; Khiên chặn 3 viên; ván 60 giây, bị hạ thì súng xuống một cấp.
// KHÔNG đụng DOM, mạng, đồng hồ thật: nhận `dt` (giây) từ ngoài; ngẫu nhiên là hạt giống nằm trong trận ⇒ tất định, test được.
// Dùng chung hai nơi: phòng đấu trên máy chủ (server/src/dau-ion-phong.ts — nơi QUYẾT mọi thứ, kể cả tự ngắm) và máy em (Chơi với A.I tại máy;
// tự ngắm của chính em để vẽ đường ngắm ngay). Sân vuông 600 × 600 đơn vị — cùng một sân cho điện thoại dọc, ngang, máy tính.

export const SAN = 600
export const R = 18
export const TOC = 205
export const TOC_DAN = 460
export const TAM_DAN = 380
export const R_DAN = 5
export const TAM_NGAM = 320
export const MAU_MAX = 10
export const GIAY_HOI = 1.5
export const GIAY_CHE = 1.2
export const GIAY_VAN = 60
export const GIAY_NGHI = 6
const GIAY_HOI_MAU = 2.5
const NHIP_HOI_MAU = 0.5
/** Nhịp phòng đấu (giây). */
export const BUOC = 1 / 20
/** Tối đa người thật mỗi sân; A.I lấp cho đủ DU_AI. */
export const TOI_DA = 6
export const DU_AI = 4
export const NGUYEN_TO = ['Na', 'O', 'N', 'Cl', 'S', 'Fe', 'Ne'] as const
export const TEN_NGUYEN_TO = ['Sodium', 'Oxygen', 'Nitrogen', 'Chlorine', 'Sulfur', 'Iron', 'Neon'] as const

export interface Vien { g: number; l: number }
export interface Cap { nhip: number; vien: Vien[]; xich?: number; no?: number }
const xoe = (...g: number[]): Vien[] => g.map((x) => ({ g: x, l: 0 }))
/** 5 cấp súng (chỉ số 1…5): nhịp loạt (giây), các viên mỗi loạt (g: lệch góc, l: lệch ngang); cấp 4 nảy dây chuyền, cấp 5 nổ lan. */
export const CAP: readonly Cap[] = [
  { nhip: 1, vien: [] },
  { nhip: 0.34, vien: xoe(0) },
  { nhip: 0.34, vien: [{ g: 0, l: -6 }, { g: 0, l: 6 }] },
  { nhip: 0.36, vien: xoe(-0.16, 0, 0.16) },
  { nhip: 0.36, vien: xoe(-0.14, 0, 0.14), xich: 170 },
  { nhip: 0.4, vien: xoe(-0.28, -0.14, 0, 0.14, 0.28), no: 46 },
]
export const TEN_CAP = ['', 'Liên kết đơn', 'Liên kết đôi', 'Liên kết ba', 'Phản ứng dây chuyền', 'Phản ứng toả nhiệt'] as const
export const NGAN_CAP = ['', 'Đơn', 'Đôi', 'Ba', 'Dây chuyền', 'Toả nhiệt'] as const
/** Electron cần để lên cấp kế (cấp 1→2: 3, …, 4→5: 9). */
export const CAN_E = [0, 3, 5, 7, 9] as const

export type VatCan =
  | { k: 'tron'; x: number; y: number; r: number; ve: 'binh-cau' | 'binh-non'; mau?: number }
  | { k: 'cn'; x: number; y: number; w: number; h: number; ve: 'gia-ong' | 'coc'; mau?: number }
/** Dụng cụ thí nghiệm che đạn, đối xứng tâm sân. */
export const VAT_CAN: readonly VatCan[] = [
  { k: 'tron', x: 300, y: 300, r: 42, ve: 'binh-cau', mau: 1 },
  { k: 'tron', x: 172, y: 300, r: 20, ve: 'binh-non', mau: 4 },
  { k: 'tron', x: 428, y: 300, r: 20, ve: 'binh-non', mau: 3 },
  { k: 'cn', x: 140, y: 128, w: 124, h: 24, ve: 'gia-ong' },
  { k: 'cn', x: 336, y: 448, w: 124, h: 24, ve: 'gia-ong' },
  { k: 'cn', x: 404, y: 168, w: 40, h: 40, ve: 'coc', mau: 6 },
  { k: 'cn', x: 156, y: 392, w: 40, h: 40, ve: 'coc', mau: 0 },
]
/** Sáu bệ xuất phát. */
export const CHO_RA: readonly (readonly [number, number])[] = [[300, 52], [518, 176], [518, 424], [300, 548], [82, 424], [82, 176]]
const CHO_XT: readonly (readonly [number, number])[] = [[300, 206], [300, 394], [212, 212], [388, 388]]
const CHO_KH: readonly (readonly [number, number])[] = [[100, 300], [500, 300], [300, 120], [300, 480]]

export type LoaiVp = 'e' | 'xt' | 'kh'
export interface VatPham { id: number; k: LoaiVp; x: number; y: number; t0: number }
export interface Ghe {
  id: number; nt: number; ai: boolean
  x: number; y: number; vx: number; vy: number; ngam: number
  mau: number; cap: number; e: number; capMax: number
  ha: number; biHa: number; chuoi: number; chuoiMax: number
  /** Giây còn chờ hồi lại; 0 = đang trên sân. */
  cho: number
  /** Giây còn khiên hồi sinh (đạn không làm mất Máu, chưa tự bắn, không bị ngắm). */
  che: number
  /** Khiên nhặt được: số viên còn chặn (0…3). */
  khien: number
  nap: number
  /** id mục tiêu tự ngắm; 0 = không có. */
  muc: number
  biTrungLuc: number; hoiLuc: number; ban: number; trung: number
  /** Ghế vắng (không gửi ý định quá 3 giây): không tự bắn, không bị ngắm. */
  vang: boolean
  yd: { dx: number; dy: number }
  // Trạng thái đi của A.I.
  ne: number; doiNe: number; aiT: number; aiX: number; aiY: number
}
export interface Dan { chu: number; nt: number; cap: number; x: number; y: number; vx: number; vy: number; con: number }
export type SuKien =
  | { t: 'ban'; chu: number; cap: number; x: number; y: number; ngam: number }
  /** phu: 0 = viên thường, 1 = dây chuyền, 2 = nổ lan. */
  | { t: 'trung'; ai: number; boi: number; x: number; y: number; mau: number; phu: number }
  | { t: 'chan'; ai: number; boi: number; khien: number }
  | { t: 'ha'; ai: number; boi: number; x: number; y: number; capCu: number; chuoi: number }
  | { t: 'hoi'; ai: number }
  | { t: 'vp'; id: number; k: LoaiVp; x: number; y: number }
  /** k, x, y: để vẽ hiệu ứng nhặt (gói tin chỉ mang id + ai; máy em tra lại từ danh sách vật phẩm đang có). */
  | { t: 'nhat'; id: number; ai: number; k: LoaiVp; x: number; y: number }
  | { t: 'len'; ai: number; cap: number; xt: boolean }
  | { t: 'xich'; chu: number; a: number; b: number }
  | { t: 'no'; chu: number; x: number; y: number }
  /** Đạn tắt vào vật che / mép sân (chỉ hiệu ứng ở máy em, không gửi qua mạng). */
  | { t: 'tat'; x: number; y: number; nt: number }
export interface Tran {
  t: number; con: number; xong: boolean
  ghe: Ghe[]; dan: Dan[]; vp: VatPham[]; su: SuKien[]
  hat: number; idVp: number; henE: number; henXt: number; henKh: number
}

const PI2 = Math.PI * 2
const kep = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const xa = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay)
/** Ngẫu nhiên tất định (mulberry32), trạng thái nằm trong trận. */
export function ngauNhien(tr: { hat: number }): number {
  let t = (tr.hat = (tr.hat + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Điểm (x, y) bán kính r có lấn vật che nào không. */
export function dungVatCan(x: number, y: number, r: number): boolean {
  for (const v of VAT_CAN) {
    if (v.k === 'tron') { if ((x - v.x) ** 2 + (y - v.y) ** 2 < (v.r + r) ** 2) return true }
    else if ((x - kep(x, v.x, v.x + v.w)) ** 2 + (y - kep(y, v.y, v.y + v.h)) ** 2 < r * r) return true
  }
  return false
}

/** Đẩy hình tròn ra khỏi vật che và mép sân. */
export function dayRa(p: { x: number; y: number }, r: number): void {
  for (const v of VAT_CAN) {
    if (v.k === 'tron') {
      const dx = p.x - v.x, dy = p.y - v.y, d = Math.hypot(dx, dy), m = v.r + r
      if (d < m) { const k = d > 0.001 ? m / d : 1; p.x = v.x + (d > 0.001 ? dx : 1) * k; p.y = v.y + (d > 0.001 ? dy : 0) * k }
    } else {
      const cx = kep(p.x, v.x, v.x + v.w), cy = kep(p.y, v.y, v.y + v.h), dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy)
      if (d < r) {
        if (d > 0.001) { p.x = cx + (dx / d) * r; p.y = cy + (dy / d) * r }
        else {
          const a = p.x - v.x, b = v.x + v.w - p.x, c = p.y - v.y, e = v.y + v.h - p.y, m = Math.min(a, b, c, e)
          if (m === a) p.x = v.x - r; else if (m === b) p.x = v.x + v.w + r; else if (m === c) p.y = v.y - r; else p.y = v.y + v.h + r
        }
      }
    }
  }
  p.x = kep(p.x, r, SAN - r); p.y = kep(p.y, r, SAN - r)
}

/** Đường bắn giữa hai điểm có bị vật che chắn không. */
export function thayNhau(ax: number, ay: number, bx: number, by: number): boolean {
  const n = Math.ceil(xa(ax, ay, bx, by) / 16)
  for (let i = 1; i < n; i++) if (dungVatCan(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n, R_DAN - 2)) return false
  return true
}

/** Một bước đi có quán tính nhẹ (dùng chung máy chủ và phần đoán trước của máy em). Hệ số không phụ thuộc nhịp (20 hay 60 lần/giây). */
export function buocDi(g: { x: number; y: number; vx: number; vy: number }, dx: number, dy: number, dt: number): void {
  const l = Math.hypot(dx, dy)
  if (l > 1) { dx /= l; dy /= l }
  const k = 1 - Math.exp(-dt * 16)
  g.vx += (dx * TOC - g.vx) * k; g.vy += (dy * TOC - g.vy) * k
  const p = { x: g.x + g.vx * dt, y: g.y + g.vy * dt }
  dayRa(p, R)
  g.x = p.x; g.y = p.y
}

const gheId = <G extends { id: number }>(ds: readonly G[], id: number): G | undefined => ds.find((g) => g.id === id)

/** Bệ xa người đang trên sân nhất (vào giữa ván, hồi sinh). */
function choXaNhat(tr: Tran, g: Ghe | null): readonly [number, number] {
  let tot = CHO_RA[0], xaNhat = -1
  for (const c of CHO_RA) {
    let gan = 1e9
    for (const k of tr.ghe) if (k !== g && k.cho <= 0) gan = Math.min(gan, xa(k.x, k.y, c[0], c[1]))
    if (gan > xaNhat) { xaNhat = gan; tot = c }
  }
  return tot
}

function datLai(g: Ghe, i: number): void {
  const [x, y] = CHO_RA[i % 6]
  Object.assign(g, { x, y, vx: 0, vy: 0, ngam: Math.atan2(300 - y, 300 - x), mau: MAU_MAX, cap: 1, e: 0, capMax: 1, ha: 0, biHa: 0, chuoi: 0, chuoiMax: 0, cho: 0, che: GIAY_CHE, khien: 0, nap: 0.6 + i * 0.07, muc: 0, biTrungLuc: -9, hoiLuc: 0, ban: 0, trung: 0, yd: { dx: 0, dy: 0 }, aiT: 0, aiX: 300, aiY: 300 })
}
function taoGhe(d: { id: number; nt: number; ai?: boolean }, i: number): Ghe {
  const g = { id: d.id, nt: kep(d.nt | 0, 0, NGUYEN_TO.length - 1), ai: !!d.ai, vang: false, ne: i % 2 ? 1 : -1, doiNe: 1 + i * 0.3 } as Ghe
  datLai(g, i)
  return g
}

/** id vật phẩm 1…250, bỏ qua id đang dùng (gói tin ghi 1 byte). */
function idVpMoi(tr: Tran): number {
  for (let k = 0; k < 250; k++) {
    tr.idVp = (tr.idVp % 250) + 1
    if (!tr.vp.some((v) => v.id === tr.idVp)) return tr.idVp
  }
  return tr.idVp
}
function themE(tr: Tran, x?: number, y?: number): void {
  if (x === undefined || y === undefined) {
    for (let k = 0; k < 24; k++) {
      const px = 36 + ngauNhien(tr) * 528, py = 36 + ngauNhien(tr) * 528
      if (dungVatCan(px, py, 16) || tr.ghe.some((g) => g.cho <= 0 && xa(g.x, g.y, px, py) < 60) || tr.vp.some((v) => xa(v.x, v.y, px, py) < 26)) continue
      x = px; y = py; break
    }
    if (x === undefined || y === undefined) return
  }
  const v: VatPham = { id: idVpMoi(tr), k: 'e', x, y, t0: tr.t }
  tr.vp.push(v); tr.su.push({ t: 'vp', id: v.id, k: 'e', x, y })
}
function themVp(tr: Tran, k: 'xt' | 'kh'): void {
  const ds = (k === 'xt' ? CHO_XT : CHO_KH).filter(([x, y]) => !tr.ghe.some((g) => g.cho <= 0 && xa(g.x, g.y, x, y) < 50))
  if (!ds.length) return
  const [x, y] = ds[Math.floor(ngauNhien(tr) * ds.length)]
  const v: VatPham = { id: idVpMoi(tr), k, x, y, t0: tr.t }
  tr.vp.push(v); tr.su.push({ t: 'vp', id: v.id, k, x, y })
}

/** Trận mới với danh sách ghế (tối đa 6). */
export function taoTran(ds: readonly { id: number; nt: number; ai?: boolean }[], hat = 1): Tran {
  const tr: Tran = { t: 0, con: GIAY_VAN, xong: false, ghe: [], dan: [], vp: [], su: [], hat: hat | 0 || 1, idVp: 0, henE: 0, henXt: 9, henKh: 6 }
  ds.slice(0, TOI_DA).forEach((d, i) => tr.ghe.push(taoGhe(d, i)))
  for (let i = 0; i < 12; i++) themE(tr)
  return tr
}

/** Ván mới cùng những ghế đang có: mọi người về Cấp 1, vật phẩm rải lại. */
export function vanMoi(tr: Tran): void {
  tr.t = 0; tr.con = GIAY_VAN; tr.xong = false; tr.dan = []; tr.vp = []; tr.su = []; tr.henE = 0; tr.henXt = 9; tr.henKh = 6
  tr.ghe.forEach((g, i) => datLai(g, i))
  for (let i = 0; i < 12; i++) themE(tr)
}

/** Ghế vào giữa ván: hiện ở bệ xa địch nhất, có khiên hồi sinh. */
export function themGhe(tr: Tran, d: { id: number; nt: number; ai?: boolean }): Ghe {
  const g = taoGhe(d, tr.ghe.length)
  const [x, y] = choXaNhat(tr, null)
  g.x = x; g.y = y; g.ngam = Math.atan2(300 - y, 300 - x)
  tr.ghe.push(g)
  return g
}
export function boGhe(tr: Tran, id: number): void {
  tr.ghe = tr.ghe.filter((g) => g.id !== id)
  tr.dan = tr.dan.filter((d) => d.chu !== id)
  for (const g of tr.ghe) if (g.muc === id) g.muc = 0
}

function lenCap(tr: Tran, g: Ghe, xt: boolean): void { g.cap++; g.capMax = Math.max(g.capMax, g.cap); tr.su.push({ t: 'len', ai: g.id, cap: g.cap, xt }) }
function themEChoGhe(tr: Tran, g: Ghe, n: number): void {
  if (g.cap >= 5) { g.mau = Math.min(MAU_MAX, g.mau + n); return }
  g.e += n
  while (g.cap < 5 && g.e >= CAN_E[g.cap]) { g.e -= CAN_E[g.cap]; lenCap(tr, g, false) }
  if (g.cap >= 5) g.e = 0
}
function nhat(tr: Tran, g: Ghe, v: VatPham): void {
  tr.su.push({ t: 'nhat', id: v.id, ai: g.id, k: v.k, x: v.x, y: v.y })
  if (v.k === 'e') themEChoGhe(tr, g, 1)
  else if (v.k === 'xt') { if (g.cap < 5) lenCap(tr, g, true); else g.mau = MAU_MAX }
  else g.khien = 3
}

/** Ghế tối thiểu để tự ngắm (máy chủ dùng Ghe; máy em dùng ghế đang vẽ). */
export interface GheNgam { id: number; x: number; y: number; cho: number; che: number; vang?: boolean; muc: number }
/** Tự ngắm: bạn gần nhất còn trên sân, hết khiên hồi sinh, không vắng, trong tầm 320, không bị vật che; giữ mục tiêu cũ tới khi có bạn gần hơn hẳn (25 %). */
export function chonMuc<G extends GheNgam>(ds: readonly G[], g: G): G | null {
  let tot: G | null = null, gan = TAM_NGAM
  const duoc = (k: G) => k !== g && k.cho <= 0 && k.che <= 0 && !k.vang
  for (const k of ds) { if (!duoc(k)) continue; const d = xa(g.x, g.y, k.x, k.y); if (d < gan && thayNhau(g.x, g.y, k.x, k.y)) { gan = d; tot = k } }
  const cu = g.muc ? gheId(ds, g.muc) : undefined
  if (cu && cu !== tot && duoc(cu)) { const d = xa(g.x, g.y, cu.x, cu.y); if (d < TAM_NGAM && d < gan * 1.25 && thayNhau(g.x, g.y, cu.x, cu.y)) return cu }
  return tot
}

function banLoat(tr: Tran, g: Ghe): void {
  const c = CAP[g.cap], cs = Math.cos(g.ngam), sn = Math.sin(g.ngam)
  g.nap = c.nhip; g.ban++
  for (const b of c.vien) {
    const a = g.ngam + b.g
    tr.dan.push({ chu: g.id, nt: g.nt, cap: g.cap, x: g.x + cs * (R + 6) - sn * b.l, y: g.y + sn * (R + 6) + cs * b.l, vx: Math.cos(a) * TOC_DAN, vy: Math.sin(a) * TOC_DAN, con: TAM_DAN })
  }
  tr.su.push({ t: 'ban', chu: g.id, cap: g.cap, x: g.x + cs * (R + 12), y: g.y + sn * (R + 12), ngam: g.ngam })
}
function biTrung(tr: Tran, g: Ghe, boi: number, x: number, y: number, phu: number): boolean {
  if (g.cho > 0) return false
  if (g.che > 0) { tr.su.push({ t: 'chan', ai: g.id, boi, khien: g.khien }); return false }
  if (g.khien > 0) { g.khien--; tr.su.push({ t: 'chan', ai: g.id, boi, khien: g.khien }); return false }
  g.mau--; g.biTrungLuc = tr.t
  const b = gheId(tr.ghe, boi)
  if (b) b.trung++
  tr.su.push({ t: 'trung', ai: g.id, boi, x, y, mau: g.mau, phu })
  if (g.mau <= 0) biHa(tr, g, b)
  return true
}
function biHa(tr: Tran, g: Ghe, b: Ghe | undefined): void {
  g.cho = GIAY_HOI; g.biHa++; g.chuoi = 0; g.khien = 0; g.muc = 0; g.vx = g.vy = 0
  const capCu = g.cap
  g.cap = Math.max(1, g.cap - 1); g.e = 0
  tr.su.push({ t: 'ha', ai: g.id, boi: b ? b.id : 0, x: g.x, y: g.y, capCu, chuoi: b ? b.chuoi + 1 : 0 })
  for (let i = 0; i < 3; i++) {
    const a = ngauNhien(tr) * PI2, r = 16 + ngauNhien(tr) * 24, p = { x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r }
    dayRa(p, 8); themE(tr, p.x, p.y)
  }
  if (b) { b.ha++; b.chuoi++; b.chuoiMax = Math.max(b.chuoiMax, b.chuoi); themEChoGhe(tr, b, 2) }
}
function hoiSinh(tr: Tran, g: Ghe): void {
  const [x, y] = choXaNhat(tr, g)
  g.x = x; g.y = y; g.vx = g.vy = 0; g.mau = MAU_MAX; g.che = GIAY_CHE; g.cho = 0; g.nap = 0.3; g.hoiLuc = 0
  tr.su.push({ t: 'hoi', ai: g.id })
}

export interface DongKet { id: number; nt: number; ha: number; biHa: number; capMax: number; chuoiMax: number; cap: number }
/** Xếp hạng: hạ nhiều nhất; bằng nhau thì ít bị hạ hơn; rồi cấp cao nhất. */
export function xepBang(tr: Tran): DongKet[] {
  return tr.ghe.map((g) => ({ id: g.id, nt: g.nt, ha: g.ha, biHa: g.biHa, capMax: g.capMax, chuoiMax: g.chuoiMax, cap: g.cap }))
    .sort((a, b) => b.ha - a.ha || a.biHa - b.biHa || b.capMax - a.capMax)
}

/** Một bước của trận (máy chủ 20 lần/giây; máy em 60). Sự kiện ĐẨY vào `tr.su` — nơi gọi lấy rồi xoá (`laySuKien`). */
export function buocTran(tr: Tran, dt: number): void {
  if (tr.xong || !(dt > 0)) return
  tr.t += dt; tr.con = Math.max(0, tr.con - dt)
  tr.henE -= dt
  if (tr.henE <= 0) { tr.henE = 0.7; if (tr.vp.filter((v) => v.k === 'e').length < 14) themE(tr) }
  if (!tr.vp.some((v) => v.k === 'xt')) { tr.henXt -= dt; if (tr.henXt <= 0) { tr.henXt = 14; themVp(tr, 'xt') } }
  if (!tr.vp.some((v) => v.k === 'kh')) { tr.henKh -= dt; if (tr.henKh <= 0) { tr.henKh = 11; themVp(tr, 'kh') } }
  for (const g of tr.ghe) {
    if (g.cho > 0) { g.cho -= dt; if (g.cho <= 0) hoiSinh(tr, g); continue }
    buocDi(g, g.yd.dx, g.yd.dy, dt)
    g.che = Math.max(0, g.che - dt); g.nap -= dt
    if (g.mau < MAU_MAX && tr.t - g.biTrungLuc > GIAY_HOI_MAU) { g.hoiLuc += dt; if (g.hoiLuc >= NHIP_HOI_MAU) { g.hoiLuc = 0; g.mau++ } } else g.hoiLuc = 0
    const m = g.vang ? null : chonMuc(tr.ghe, g)
    g.muc = m ? m.id : 0
    if (m) g.ngam = Math.atan2(m.y - g.y, m.x - g.x)
    else if (Math.hypot(g.vx, g.vy) > 40) g.ngam = Math.atan2(g.vy, g.vx)
    if (m && g.nap <= 0 && g.che <= 0) banLoat(tr, g)
    if (g.nap < 0) g.nap = 0
    for (let i = tr.vp.length - 1; i >= 0; i--) {
      const v = tr.vp[i], rr = v.k === 'e' ? R + 22 : R + 16
      if (tr.t - v.t0 > 0.25 && (v.x - g.x) ** 2 + (v.y - g.y) ** 2 < rr * rr) { tr.vp.splice(i, 1); nhat(tr, g, v) }
    }
  }
  // Hai nguyên tử không chồng lên nhau.
  for (let i = 0; i < tr.ghe.length; i++) for (let j = i + 1; j < tr.ghe.length; j++) {
    const a = tr.ghe[i], b = tr.ghe[j]
    if (a.cho > 0 || b.cho > 0) continue
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = R * 2
    if (d < m && d > 0.001) { const k = (m - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; dayRa(a, R); dayRa(b, R) }
  }
  // Đạn: chia bước ≤ 12 đơn vị để không xuyên vật che mỏng.
  for (let i = tr.dan.length - 1; i >= 0; i--) {
    const d = tr.dan[i], n = Math.max(1, Math.ceil((TOC_DAN * dt) / 12))
    let mat = false
    for (let s = 0; s < n && !mat; s++) {
      d.x += (d.vx * dt) / n; d.y += (d.vy * dt) / n; d.con -= (TOC_DAN * dt) / n
      if (d.con <= 0) { mat = true; break }
      if (d.x < 0 || d.y < 0 || d.x > SAN || d.y > SAN || dungVatCan(d.x, d.y, R_DAN - 1)) { mat = true; tr.su.push({ t: 'tat', x: kep(d.x, 0, SAN), y: kep(d.y, 0, SAN), nt: d.nt }); break }
      for (const g of tr.ghe) {
        if (g.id === d.chu || g.cho > 0) continue
        if ((g.x - d.x) ** 2 + (g.y - d.y) ** 2 >= (R + R_DAN) ** 2) continue
        mat = true
        const ok = biTrung(tr, g, d.chu, d.x, d.y, 0), c = CAP[d.cap]
        if (ok && c.xich) { // phản ứng dây chuyền: nảy sang bạn gần nhất
          let k2: Ghe | null = null, gan = c.xich
          for (const k of tr.ghe) { if (k.id === d.chu || k === g || k.cho > 0) continue; const dd = xa(k.x, k.y, g.x, g.y); if (dd < gan && thayNhau(g.x, g.y, k.x, k.y)) { gan = dd; k2 = k } }
          if (k2) { tr.su.push({ t: 'xich', chu: d.chu, a: g.id, b: k2.id }); biTrung(tr, k2, d.chu, k2.x, k2.y, 1) }
        }
        if (ok && c.no) { // phản ứng toả nhiệt: nổ lan
          tr.su.push({ t: 'no', chu: d.chu, x: d.x, y: d.y })
          for (const k of tr.ghe) { if (k.id === d.chu || k === g || k.cho > 0) continue; if (xa(k.x, k.y, d.x, d.y) < c.no + R) biTrung(tr, k, d.chu, k.x, k.y, 2) }
        }
        break
      }
    }
    if (mat) tr.dan.splice(i, 1)
  }
  if (tr.con <= 0) tr.xong = true
}

/** Lấy sự kiện đã dồn và xoá khỏi trận. */
export function laySuKien(tr: Tran): SuKien[] { const s = tr.su; tr.su = []; return s }

/** A.I CHỈ quyết hướng đi (súng tự ngắm như mọi người): nhặt vật phẩm, giữ khoảng cách, đi vòng, yếu Máu thì lùi. */
function aiNghi(tr: Tran, g: Ghe): void {
  let dich: Ghe | null = null, gan = 1e9
  for (const k of tr.ghe) if (k !== g && k.cho <= 0 && !k.vang) { const d = xa(k.x, k.y, g.x, g.y); if (d < gan) { gan = d; dich = k } }
  let vp: VatPham | null = null, diem = -1e9
  for (const v of tr.vp) {
    const gia = v.k === 'xt' ? (g.cap < 5 ? 520 : 160) : v.k === 'kh' ? (g.khien ? 0 : 300) : g.cap < 5 ? 150 : g.mau < MAU_MAX ? 110 : 10
    const d = gia - xa(v.x, v.y, g.x, g.y)
    if (d > diem) { diem = d; vp = v }
  }
  let tx = 300, ty = 300
  if (g.mau <= 3 && dich && gan < 230) { const a = Math.atan2(g.y - dich.y, g.x - dich.x) + g.ne * 0.5; tx = g.x + Math.cos(a) * 170; ty = g.y + Math.sin(a) * 170 }
  else if (vp && (diem > -60 || !dich || gan > 260)) { tx = vp.x; ty = vp.y }
  else if (dich) { const a = Math.atan2(g.y - dich.y, g.x - dich.x) + g.ne * 0.9; tx = dich.x + Math.cos(a) * 190; ty = dich.y + Math.sin(a) * 190 }
  g.aiX = kep(tx, 30, 570); g.aiY = kep(ty, 30, 570)
}
export function aiDi(tr: Tran, g: Ghe, dt: number): { dx: number; dy: number } {
  if (g.cho > 0) return { dx: 0, dy: 0 }
  g.aiT -= dt; if (g.aiT <= 0) { g.aiT = 0.16 + ngauNhien(tr) * 0.12; aiNghi(tr, g) }
  g.doiNe -= dt; if (g.doiNe <= 0) { g.doiNe = 1.4 + ngauNhien(tr) * 2; g.ne = -g.ne }
  let dx = g.aiX - g.x, dy = g.aiY - g.y
  const l = Math.hypot(dx, dy)
  if (l < 8) return { dx: 0, dy: 0 }
  const a0 = Math.atan2(dy, dx)
  for (const x of [0, 0.7, -0.7, 1.4, -1.4, 2.2, -2.2]) {
    const a = a0 + x * g.ne, px = g.x + Math.cos(a) * 34, py = g.y + Math.sin(a) * 34
    if (!dungVatCan(px, py, R) && px > R && px < SAN - R && py > R && py < SAN - R) { dx = Math.cos(a); dy = Math.sin(a); break }
  }
  const t = Math.min(1, l / 40) * 0.92
  return { dx: dx * t, dy: dy * t }
}
