// LÕI THUẦN «Đấu Nguyên Tử» — súng TỰ NGẮM và TỰ BẮN, em chỉ quyết hướng đi; nhặt electron để súng tiến hoá 5 cấp; Xúc tác lên ngay một cấp;
// Khiên chặn 3 viên; ván 60 giây. KHÔNG đụng DOM, mạng, đồng hồ thật: nhận `dt` (giây) từ ngoài; ngẫu nhiên là hạt giống nằm trong trận ⇒ tất định.
// Dùng chung hai nơi: phòng đấu trên máy chủ (server/src/dau-ion-phong.ts — nơi QUYẾT mọi thứ) và máy em (chơi tại máy; tự ngắm của em để vẽ ngay).
// 3 ĐẤU 3 (thầy 01/11 tối, duyệt bản vẽ «Chốt build đi nhé» — docs/ban-ve-dau-ion-3v3-0111/DAC-TA.md):
//  · Hai phe theo giấy quỳ: Bazơ (0, căn cứ ĐẦU TRÁI) và Axit (1, căn cứ ĐẦU PHẢI). Máy em xoay khi vẽ để phe em luôn ở trái (ngang) / dưới (dọc).
//  · Sân CHỮ NHẬT NGANG 1040 × 520 (2 : 1, khớp điện thoại xoay ngang — «màn hình chơi to thoải mái xoay ngang to tràn»), đối xứng gương hai trục.
//  · Tự ngắm ĐỐI THỦ gần nhất trên CẢ SÂN mà đường bắn không bị che; đạn bay hết sân; không bắn / không trúng đồng đội.
//  · Thân thiện trước giờ thi: bị hạ KHÔNG tụt cấp súng (chỉ mất electron đang gom dở), hồi sinh 1,2 giây, A.I bắn chậm hơn người 25 %.

/** Sân chữ nhật ngang (đơn vị sân). */
export const SAN_W = 1040
export const SAN_H = 520
export const TAM_X = SAN_W / 2
export const TAM_Y = SAN_H / 2
export const R = 18
export const TOC = 225
export const TOC_DAN = 520
/** Tầm đạn (v4, thầy 02/11 tối — sân trống không chướng ngại): khớp tầm ngắm, đạn không bay xuyên sân. */
export const TAM_DAN = 460
export const R_DAN = 5
/** Tầm ngắm NGUYÊN TỬ ≈ 40 % sân (v4): sân không còn chỗ nấp, bắn xuyên sân thì rối — đánh nhau quanh tháp, phải chạy lên mới bắn được. */
export const TAM_NGAM = 420
/** Tầm ngắm THÁP / TƯỜNG / TINH THỂ: ngắn hơn vùng tháp (180 / 205) ⇒ muốn bắn tháp phải bước vào vùng tháp bắn. */
export const TAM_KHOI = 150
export const MAU_MAX = 10
/** Hồi sinh nhanh (thân thiện). */
export const GIAY_HOI = 1.2
/** Khiên hồi sinh. */
export const GIAY_CHE = 1.5
/** Khiên của em MỚI vào sân giữa ván (vào thay A.I). */
export const GIAY_CHE_MOI = 3
export const GIAY_VAN = 120
export const GIAY_NGHI = 6
const GIAY_HOI_MAU = 2.5
const NHIP_HOI_MAU = 0.5
/** A.I bắn chậm hơn người (nhịp × 1,25) — chơi hơi yếu hơn em. */
const AI_CHAM = 1.25
/** Nhịp phòng đấu (giây). */
export const BUOC = 1 / 20
/** Sáu ghế mỗi sân = 3 đấu 3 (thầy 01/11 tối: thiếu người thì A.I ngồi ghế, em vào là A.I nhường chỗ). */
export const TOI_DA = 6
export const MOI_PHE = 3
/** Hai phe theo giấy quỳ: 0 = Bazơ (OH⁻, xanh), 1 = Axit (H⁺, đỏ). */
export const PHE = ['Bazơ', 'Axit'] as const
export const ION_PHE = ['OH⁻', 'H⁺'] as const
export const PHE_BAZO = 0
export const PHE_AXIT = 1
/** (Cũ) sân chỉ người thật cần 2 em mới chạy; 3 đấu 3 có A.I lấp ghế nên không còn chờ. */
export const TOI_THIEU = 2
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

// ─── THÁP · TƯỜNG · TINH THỂ (v4, thầy 02/11 tối: «mỗi bên một tinh thể, bên nào tinh thể bị bắn vỡ trước là thua» · «chướng ngại vật biến thành tháp bảo vệ
// tinh thể, tự bắn khi bị xâm phạm lãnh thổ … bỏ hết chướng ngại» · «tinh thể có lớp tường chắn nhưng tường này có thể bị phá») — bảng số: DAC-TA mục THÁP + TƯỜNG.
// Mỗi phe 7 KHỐI, đối xứng TÂM (x ↔ 1040 − x, y ↔ 520 − y): 2 tháp cánh, 1 tháp lớn giữ cửa, 3 mảnh tường kính hình cung liền nhau ôm tinh thể tới sát mép sân, tinh thể.
// BẢO HỘ (bịt chỗ bắn tỉa an toàn): mảnh tường cánh chỉ trúng được khi tháp cánh CÙNG BÊN đã vỡ; mảnh giữa khi tháp lớn đã vỡ; tháp lớn khi đã vỡ ít nhất một tháp
// cánh; tinh thể chỉ trúng được qua chỗ tường đã vỡ (tường kín, không khe). Đạn phe mình bay xuyên khối phe mình; khối phe kia hứng đạn.
export type LoaiKhoi = 'thap' | 'thap-lon' | 'tuong' | 'tt'
export interface Khoi {
  k: LoaiKhoi; phe: number
  /** Cánh: 0 = cánh A, 1 = giữa, 2 = cánh B (tháp cánh và mảnh tường cùng cánh bảo hộ nhau). */
  canh: number
  x: number; y: number; r: number; max: number
  /** Tường: tâm cung = tinh thể (x, y), bán kính TUONG_R, góc [a0, a1] (radian). */
  a0?: number; a1?: number
  /** Tháp: bán kính vùng tự bắn, nhịp bắn (giây). */
  vung?: number; nhip?: number
}
export const R_TT = 22
export const TUONG_R = 68
/** Nửa bề dày tường (va chạm). */
export const TUONG_DAY = 6
export const TOC_DAN_THAP = 360
const D2R = Math.PI / 180
const doiXung = (x: number, y: number) => [SAN_W - x, SAN_H - y] as const
function khoiPhe(phe: number): Khoi[] {
  const P = (x: number, y: number) => (phe ? doiXung(x, y) : ([x, y] as const)), q = phe ? Math.PI : 0
  const [tx, ty] = P(44, 260)
  const thap = (canh: number, x: number, y: number, lon: boolean): Khoi => { const [a, b] = P(x, y); return lon ? { k: 'thap-lon', phe, canh, x: a, y: b, r: 25, max: 30, vung: 205, nhip: 0.45 } : { k: 'thap', phe, canh, x: a, y: b, r: 20, max: 20, vung: 180, nhip: 0.6 } }
  const tuong = (canh: number, g0: number, g1: number): Khoi => ({ k: 'tuong', phe, canh, x: tx, y: ty, r: TUONG_R, max: 8, a0: g0 * D2R + q, a1: g1 * D2R + q })
  return [thap(0, 330, 120, false), thap(2, 330, 400, false), thap(1, 210, 260, true), tuong(0, -125, -42), tuong(1, -42, 42), tuong(2, 42, 125), { k: 'tt', phe, canh: 1, x: tx, y: ty, r: R_TT, max: 24 }]
}
/** 14 khối: 0…6 Bazơ, 7…13 Axit (thứ tự: tháp cánh A, tháp cánh B, tháp lớn, tường A, tường giữa, tường B, tinh thể). */
export const KHOI: readonly Khoi[] = [...khoiPhe(0), ...khoiPhe(1)]
export const MAU_KHOI_DAU: readonly number[] = KHOI.map((k) => k.max)
export const SO_KHOI = KHOI.length
/** Chỉ số tinh thể của phe. */
export const TT_CUA = [6, 13] as const
/** Ba bệ xuất phát mỗi phe — trong vùng tháp lớn, ngoài tường: [cánh A, giữa, cánh B]; bệ thứ i hai phe đối xứng tâm. */
export const BE_PHE: readonly (readonly (readonly [number, number])[])[] = [
  [[110, 140], [140, 260], [110, 380]],
  [[930, 380], [900, 260], [930, 140]],
]
/** Sáu bệ (0…2 Bazơ, 3…5 Axit) — để vẽ nền. */
export const CHO_RA: readonly (readonly [number, number])[] = [...BE_PHE[0], ...BE_PHE[1]]
/** Xúc tác: hai cánh giữa sân (tranh chấp). Khiên: tâm sân. */
export const CHO_XT: readonly (readonly [number, number])[] = [[520, 110], [520, 410]]
export const CHO_KH: readonly (readonly [number, number])[] = [[520, 260]]

export type LoaiVp = 'e' | 'xt' | 'kh'
export interface VatPham { id: number; k: LoaiVp; x: number; y: number; t0: number }
export interface Ghe {
  id: number; nt: number; ai: boolean
  /** Phe: 0 = Bazơ, 1 = Axit. */
  phe: number
  x: number; y: number; vx: number; vy: number; ngam: number
  /** `e`: bộ đếm TRÚNG tới cấp kế (v4 bỏ electron — thầy 02/11: súng lên cấp theo số lần bắn trúng; giữ tên trường cho gói tin). */
  mau: number; cap: number; e: number; capMax: number
  ha: number; biHa: number; chuoi: number; chuoiMax: number
  /** Giây còn chờ hồi lại; 0 = đang trên sân. */
  cho: number
  /** Giây còn khiên hồi sinh (đạn không làm mất Máu, chưa tự bắn, không bị ngắm). */
  che: number
  /** Khiên nhặt được: số viên còn chặn (0…3). */
  khien: number
  nap: number
  /** id mục tiêu tự ngắm (nguyên tử); 0 = không có. */
  muc: number
  /** Khối đang ngắm (chỉ số + 1; 0 = không). */
  mucK: number
  biTrungLuc: number; hoiLuc: number; ban: number; trung: number
  /** Thống kê cho HUY HIỆU hết ván: sát thương vào khối phe kia, số tháp phá, số lần hạ gần tinh thể phe mình, góp sức hạ, giây sống liền lâu nhất. */
  danhKhoi: number; phaThap: number; hoVe: number; hoTro: number; song: number; songMax: number
  /** id người bắn ⇒ giây trận lần cuối trúng ghế này (tính góp sức). */
  boiLuc: Record<number, number>
  /** Ghế vắng (không gửi ý định quá 3 giây): không tự bắn, không bị ngắm. */
  vang: boolean
  yd: { dx: number; dy: number }
  // Trạng thái đi của A.I.
  ne: number; doiNe: number; aiT: number; aiX: number; aiY: number
  /** A.I: giây đã chờ bạn trước vùng tháp (quá 5 giây ⇒ vào luôn, không đứng chờ mãi). */
  aiCho: number
}
/** Đạn: `chu` = id người bắn (0 = tháp — khi đó `k` là chỉ số tháp); `toc` = tốc độ (đạn tháp chậm hơn, né được). */
export interface Dan { chu: number; nt: number; phe: number; cap: number; x: number; y: number; vx: number; vy: number; con: number; toc?: number; k?: number }
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
  | { t: 'tat'; x: number; y: number; nt: number; phe?: number }
  /** Đổi người ở một ghế (chỉ ở máy em, từ gói JSON `thay`): ghế `ai` tan thành bong bóng. */
  | { t: 'thay'; ai: number; moi?: number; laAI?: boolean; tenCu?: string }
  /** Đạn CỦA EM chạm đối thủ tại máy (chỉ hình, phòng vẫn quyết trúng): nháy ngay không chờ mạng. */
  | { t: 'cham'; ai: number; boi: number; x: number; y: number }
  /** Khối `k` trúng đạn: `mau` còn lại; `chan` = đang được bảo hộ (đạn mất, không trừ máu). */
  | { t: 'kh'; k: number; mau: number; chan: boolean; x: number; y: number }
  /** Khối `k` vỡ (tháp vỡ ⇒ cả phe kia +1 cấp — kèm sự kiện `len`). */
  | { t: 'vo'; k: number }
  /** Tháp `k` bắn một viên về góc `ngam`. */
  | { t: 'tb'; k: number; ngam: number }
  /** Hai viên đạn khác phe chạm nhau giữa đường ⇒ trung hoà (H⁺ + OH⁻ → H₂O). */
  | { t: 'th'; x: number; y: number }
export interface Tran {
  t: number; con: number; xong: boolean
  /** Tỉ số hai phe [Bazơ, Axit] = số lần hạ của cả phe trong ván (giữ nguyên khi ghế đổi người / A.I). */
  ti: [number, number]
  ghe: Ghe[]; dan: Dan[]; vp: VatPham[]; su: SuKien[]
  hat: number; idVp: number; henXt: number; henKh: number
  /** Máu 14 khối (KHOI). */
  km: number[]
  /** Tháp: giây tới lượt bắn kế; id người vừa đánh tháp (ưu tiên ngắm) + lúc đánh. */
  napK: number[]; danhK: number[]; danhLuc: number[]
  /** Hết ván: phe thắng (0 / 1), 2 = hoà, -1 = chưa; lý do: 'vo' tinh thể vỡ, 'gio' hết giờ. */
  thang: number; lyDo: '' | 'vo' | 'gio'
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

/** Khối `i` còn đứng (máu > 0). `km` không truyền ⇒ mọi khối nguyên vẹn. */
const con = (km: readonly number[] | undefined, i: number) => (km ? km[i] > 0 : true)
/** Góc `a` (radian) nằm trong cung [a0, a1] (cùng vòng). */
function trongCung(a: number, a0: number, a1: number): boolean {
  let d = a - a0
  d -= Math.floor(d / PI2) * PI2
  let w = a1 - a0
  w -= Math.floor(w / PI2) * PI2
  return d <= w
}
/** Điểm (x, y) bán kính r chạm khối `i` không (tường: dải cung dày 2·TUONG_DAY + hai đầu tròn). */
export function chamKhoi(i: number, x: number, y: number, r: number): boolean {
  const k = KHOI[i]
  if (k.k !== 'tuong') return (x - k.x) ** 2 + (y - k.y) ** 2 < (k.r + r) ** 2
  const dx = x - k.x, dy = y - k.y, d = Math.hypot(dx, dy)
  if (Math.abs(d - k.r) < TUONG_DAY + r && trongCung(Math.atan2(dy, dx), k.a0!, k.a1!)) return true
  for (const a of [k.a0!, k.a1!]) { const ex = k.x + Math.cos(a) * k.r, ey = k.y + Math.sin(a) * k.r; if ((x - ex) ** 2 + (y - ey) ** 2 < (TUONG_DAY + r) ** 2) return true }
  return false
}
/** Điểm (x, y) bán kính r có lấn khối nào còn đứng không (mọi phe — va chạm đi lại / tầm nhìn). `bo` = chỉ số khối bỏ qua. */
export function dungVatCan(x: number, y: number, r: number, km?: readonly number[], bo = -1): boolean {
  for (let i = 0; i < SO_KHOI; i++) if (i !== bo && con(km, i) && chamKhoi(i, x, y, r)) return true
  return false
}

/** Đẩy hình tròn ra khỏi khối còn đứng và mép sân. */
export function dayRa(p: { x: number; y: number }, r: number, km?: readonly number[]): void {
  for (let i = 0; i < SO_KHOI; i++) {
    if (!con(km, i)) continue
    const k = KHOI[i]
    if (k.k !== 'tuong') {
      const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy), m = k.r + r
      if (d < m) { const s = d > 0.001 ? m / d : 1; p.x = k.x + (d > 0.001 ? dx : 1) * s; p.y = k.y + (d > 0.001 ? dy : 0) * s }
      continue
    }
    const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx)
    if (Math.abs(d - k.r) < TUONG_DAY + r && trongCung(a, k.a0!, k.a1!)) {
      const toi = d < k.r ? k.r - TUONG_DAY - r : k.r + TUONG_DAY + r
      p.x = k.x + Math.cos(a) * toi; p.y = k.y + Math.sin(a) * toi
      continue
    }
    for (const g of [k.a0!, k.a1!]) {
      const ex = k.x + Math.cos(g) * k.r, ey = k.y + Math.sin(g) * k.r, ddx = p.x - ex, ddy = p.y - ey, dd = Math.hypot(ddx, ddy), m = TUONG_DAY + r
      if (dd < m && dd > 0.001) { p.x = ex + (ddx / dd) * m; p.y = ey + (ddy / dd) * m }
    }
  }
  p.x = kep(p.x, r, SAN_W - r); p.y = kep(p.y, r, SAN_H - r)
}

/** Đường bắn giữa hai điểm có bị khối còn đứng chắn không (`bo` = khối đích, không tính là vật chắn). */
export function thayNhau(ax: number, ay: number, bx: number, by: number, km?: readonly number[], bo = -1): boolean {
  const n = Math.ceil(xa(ax, ay, bx, by) / 10)
  for (let i = 1; i < n; i++) if (dungVatCan(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n, R_DAN - 2, km, bo)) return false
  return true
}

/** BẢO HỘ: khối `i` đang trúng được chưa (tháp cánh: luôn; tháp lớn: khi đã vỡ một tháp cánh cùng phe; tường cánh: khi tháp cánh cùng cánh đã vỡ;
 *  tường giữa: khi tháp lớn đã vỡ; tinh thể: luôn — nhưng tường kín che hết, chỉ trúng qua chỗ tường vỡ). */
export function danhDuoc(km: readonly number[], i: number): boolean {
  if (km[i] <= 0) return false
  const k = KHOI[i], b = k.phe * 7
  if (k.k === 'thap' || k.k === 'tt') return true
  if (k.k === 'thap-lon') return km[b] <= 0 || km[b + 1] <= 0
  return k.canh === 1 ? km[b + 2] <= 0 : km[b + (k.canh === 0 ? 0 : 1)] <= 0
}
/** Điểm ngắm của khối (tường: giữa cung). */
export function diemKhoi(i: number): readonly [number, number] {
  const k = KHOI[i]
  if (k.k !== 'tuong') return [k.x, k.y]
  const a = (k.a0! + k.a1!) / 2
  return [k.x + Math.cos(a) * k.r, k.y + Math.sin(a) * k.r]
}

/** Một bước đi có quán tính nhẹ (dùng chung máy chủ và phần đoán trước của máy em). Hệ số không phụ thuộc nhịp (20 hay 60 lần/giây). */
export function buocDi(g: { x: number; y: number; vx: number; vy: number }, dx: number, dy: number, dt: number, km?: readonly number[]): void {
  const l = Math.hypot(dx, dy)
  if (l > 1) { dx /= l; dy /= l }
  const k = 1 - Math.exp(-dt * 16)
  g.vx += (dx * TOC - g.vx) * k; g.vy += (dy * TOC - g.vy) * k
  const p = { x: g.x + g.vx * dt, y: g.y + g.vy * dt }
  dayRa(p, R, km)
  g.x = p.x; g.y = p.y
}

const gheId = <G extends { id: number }>(ds: readonly G[], id: number): G | undefined => ds.find((g) => g.id === id)

const doiPhe = (a: { phe?: number }, b: { phe?: number }) => (a.phe ?? 0) !== (b.phe ?? 0)

/** Bệ hồi sinh của phe: bệ xa ĐỐI THỦ đang trên sân nhất (gần bằng nhau ⇒ bệ giữa, sau tháp lớn). */
function choHoi(tr: Tran, g: Ghe): readonly [number, number] {
  const ds = BE_PHE[g.phe] ?? BE_PHE[0]
  let tot = ds[1], xaNhat = -1
  for (const c of [ds[1], ds[0], ds[2]]) {
    let gan = 1e9
    for (const k of tr.ghe) if (k !== g && k.cho <= 0 && doiPhe(k, g)) gan = Math.min(gan, xa(k.x, k.y, c[0], c[1]))
    if (gan > xaNhat + 40) { xaNhat = gan; tot = c }
  }
  return tot
}

/** Ghế thứ `o` của phe ⇒ bệ: giữa, trái, phải. */
const BE_THU = [1, 0, 2]
function datLai(g: Ghe, o: number): void {
  const [x, y] = (BE_PHE[g.phe] ?? BE_PHE[0])[BE_THU[o % 3]]
  Object.assign(g, { x, y, vx: 0, vy: 0, ngam: Math.atan2(TAM_Y - y, TAM_X - x), mau: MAU_MAX, cap: 1, e: 0, capMax: 1, ha: 0, biHa: 0, chuoi: 0, chuoiMax: 0, cho: 0, che: GIAY_CHE, khien: 0, nap: 0.6 + o * 0.07, muc: 0, mucK: 0, biTrungLuc: -9, hoiLuc: 0, ban: 0, trung: 0, danhKhoi: 0, phaThap: 0, hoVe: 0, hoTro: 0, song: 0, songMax: 0, boiLuc: {}, yd: { dx: 0, dy: 0 }, aiT: 0, aiX: TAM_X, aiY: TAM_Y, aiCho: 0 })
}
/** Phe ít ghế hơn (bằng nhau ⇒ Bazơ). */
function pheIt(tr: Tran): number { const n = [0, 0]; for (const g of tr.ghe) n[g.phe & 1]++; return n[1] < n[0] ? 1 : 0 }
function taoGhe(tr: Tran, d: { id: number; nt: number; ai?: boolean; phe?: number }): Ghe {
  const phe = d.phe === 0 || d.phe === 1 ? d.phe : pheIt(tr)
  const o = tr.ghe.filter((k) => k.phe === phe).length
  const g = { id: d.id, nt: kep(d.nt | 0, 0, NGUYEN_TO.length - 1), ai: !!d.ai, phe, vang: false, ne: o % 2 ? 1 : -1, doiNe: 1 + o * 0.3 } as Ghe
  datLai(g, o)
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
/** Xúc tác / Khiên: hiện CÙNG LÚC ở mọi chỗ đặt (đối xứng) còn trống. */
function themVp(tr: Tran, k: 'xt' | 'kh'): void {
  for (const [x, y] of k === 'xt' ? CHO_XT : CHO_KH) {
    if (tr.ghe.some((g) => g.cho <= 0 && xa(g.x, g.y, x, y) < 50)) continue
    const v: VatPham = { id: idVpMoi(tr), k, x, y, t0: tr.t }
    tr.vp.push(v); tr.su.push({ t: 'vp', id: v.id, k, x, y })
  }
}
function datKhoi(tr: Tran): void {
  tr.km = [...MAU_KHOI_DAU]; tr.napK = KHOI.map((_, i) => 1 + (i % 7) * 0.1); tr.danhK = KHOI.map(() => 0); tr.danhLuc = KHOI.map(() => -9)
  tr.thang = -1; tr.lyDo = ''
}

/** Trận mới với danh sách ghế (tối đa 6; không ghi phe ⇒ vào phe ít ghế hơn, xen kẽ). */
export function taoTran(ds: readonly { id: number; nt: number; ai?: boolean; phe?: number }[], hat = 1): Tran {
  const tr = { t: 0, con: GIAY_VAN, xong: false, ti: [0, 0], ghe: [], dan: [], vp: [], su: [], hat: hat | 0 || 1, idVp: 0, henXt: 9, henKh: 6 } as unknown as Tran
  datKhoi(tr)
  ds.slice(0, TOI_DA).forEach((d) => tr.ghe.push(taoGhe(tr, d)))
  return tr
}

/** Ván mới cùng những ghế đang có: mọi người về Cấp 1, tháp / tường / tinh thể dựng lại nguyên vẹn. */
export function vanMoi(tr: Tran): void {
  tr.t = 0; tr.con = GIAY_VAN; tr.xong = false; tr.ti = [0, 0]; tr.dan = []; tr.vp = []; tr.su = []; tr.henXt = 9; tr.henKh = 6
  datKhoi(tr)
  const n = [0, 0]
  for (const g of tr.ghe) datLai(g, n[g.phe & 1]++)
}

/** Ghế vào giữa ván: vào phe ít ghế hơn (hoặc phe chỉ định), hiện ở bệ phe mình xa đối thủ nhất, khiên 3 giây (em mới vào). */
export function themGhe(tr: Tran, d: { id: number; nt: number; ai?: boolean; phe?: number }): Ghe {
  const g = taoGhe(tr, d)
  const [x, y] = choHoi(tr, g)
  g.x = x; g.y = y; g.ngam = Math.atan2(TAM_Y - y, TAM_X - x); g.che = GIAY_CHE_MOI
  tr.ghe.push(g)
  return g
}
export function boGhe(tr: Tran, id: number): void {
  tr.ghe = tr.ghe.filter((g) => g.id !== id)
  tr.dan = tr.dan.filter((d) => d.chu !== id)
  for (const g of tr.ghe) if (g.muc === id) g.muc = 0
}

function lenCap(tr: Tran, g: Ghe, xt: boolean): void { g.cap++; g.capMax = Math.max(g.capMax, g.cap); tr.su.push({ t: 'len', ai: g.id, cap: g.cap, xt }) }
/** Cộng `n` lần TRÚNG cho ghế (v4: thay electron) — đủ CAN_E[cấp] ⇒ lên cấp; cấp 5 ⇒ hồi máu. */
function themTrung(tr: Tran, g: Ghe, n: number): void {
  if (g.cap >= 5) { g.mau = Math.min(MAU_MAX, g.mau + n); return }
  g.e += n
  while (g.cap < 5 && g.e >= CAN_E[g.cap]) { g.e -= CAN_E[g.cap]; lenCap(tr, g, false) }
  if (g.cap >= 5) g.e = 0
}
function nhat(tr: Tran, g: Ghe, v: VatPham): void {
  tr.su.push({ t: 'nhat', id: v.id, ai: g.id, k: v.k, x: v.x, y: v.y })
  if (v.k === 'xt') { if (g.cap < 5) lenCap(tr, g, true); else g.mau = MAU_MAX }
  else if (v.k === 'kh') g.khien = 3
}

/** Ghế tối thiểu để tự ngắm (máy chủ dùng Ghe; máy em dùng ghế đang vẽ). */
export interface GheNgam { id: number; x: number; y: number; cho: number; che: number; vang?: boolean; muc: number; phe?: number }
/** Tự ngắm: ĐỐI THỦ (khác phe) gần nhất trong TẦM NGẮM (420), còn trên sân, hết khiên hồi sinh, không vắng, đường bắn không bị khối chắn;
 *  giữ mục tiêu cũ tới khi có đối thủ gần hơn hẳn (25 %). Không có ai ⇒ null (súng chuyển sang khối — `chonKhoi`). */
export function chonMuc<G extends GheNgam>(ds: readonly G[], g: G, km?: readonly number[]): G | null {
  let tot: G | null = null, gan = TAM_NGAM
  const duoc = (k: G) => k !== g && doiPhe(k, g) && k.cho <= 0 && k.che <= 0 && !k.vang
  for (const k of ds) { if (!duoc(k)) continue; const d = xa(g.x, g.y, k.x, k.y); if (d < gan && thayNhau(g.x, g.y, k.x, k.y, km)) { gan = d; tot = k } }
  const cu = g.muc ? gheId(ds, g.muc) : undefined
  if (cu && cu !== tot && duoc(cu)) { const d = xa(g.x, g.y, cu.x, cu.y); if (d < TAM_NGAM && d < gan * 1.25 && thayNhau(g.x, g.y, cu.x, cu.y, km)) return cu }
  return tot
}
/** Khối PHE KIA gần nhất trong TAM_KHOI (150) đang trúng được (bảo hộ) và thấy được (tinh thể: chỉ qua chỗ tường vỡ). Trả chỉ số khối hoặc -1. */
export function chonKhoi(km: readonly number[], g: { x: number; y: number; phe?: number }): number {
  let tot = -1, gan = TAM_KHOI
  for (let i = 0; i < SO_KHOI; i++) {
    if (KHOI[i].phe === (g.phe ?? 0) || !danhDuoc(km, i)) continue
    const [x, y] = diemKhoi(i), d = xa(g.x, g.y, x, y) - (KHOI[i].k === 'tuong' ? 0 : KHOI[i].r)
    if (d < gan && thayNhau(g.x, g.y, x, y, km, i)) { gan = d; tot = i }
  }
  return tot
}
/** Đối thủ gần nhất KỂ CẢ đang khuất (chỉ để nòng dõi theo, không bắn). */
export function doiTheo<G extends GheNgam>(ds: readonly G[], g: G): G | null {
  let tot: G | null = null, gan = 1e9
  for (const k of ds) { if (k === g || !doiPhe(k, g) || k.cho > 0 || k.vang) continue; const d = xa(g.x, g.y, k.x, k.y); if (d < gan) { gan = d; tot = k } }
  return tot
}

function banLoat(tr: Tran, g: Ghe): void {
  const c = CAP[g.cap], cs = Math.cos(g.ngam), sn = Math.sin(g.ngam)
  g.nap = c.nhip * (g.ai ? AI_CHAM : 1); g.ban++
  for (const b of c.vien) {
    const a = g.ngam + b.g
    tr.dan.push({ chu: g.id, nt: g.nt, phe: g.phe, cap: g.cap, x: g.x + cs * (R + 6) - sn * b.l, y: g.y + sn * (R + 6) + cs * b.l, vx: Math.cos(a) * TOC_DAN, vy: Math.sin(a) * TOC_DAN, con: TAM_DAN })
  }
  tr.su.push({ t: 'ban', chu: g.id, cap: g.cap, x: g.x + cs * (R + 12), y: g.y + sn * (R + 12), ngam: g.ngam })
}
function biTrung(tr: Tran, g: Ghe, boi: number, x: number, y: number, phu: number): boolean {
  if (g.cho > 0) return false
  if (g.che > 0) { tr.su.push({ t: 'chan', ai: g.id, boi, khien: g.khien }); return false }
  if (g.khien > 0) { g.khien--; tr.su.push({ t: 'chan', ai: g.id, boi, khien: g.khien }); return false }
  g.mau--; g.biTrungLuc = tr.t; if (boi) g.boiLuc[boi] = tr.t
  const b = boi ? gheId(tr.ghe, boi) : undefined
  if (b) { b.trung++; themTrung(tr, b, 1) }
  tr.su.push({ t: 'trung', ai: g.id, boi, x, y, mau: g.mau, phu })
  if (g.mau <= 0) biHa(tr, g, b)
  return true
}
/** Bị hạ: chờ 1,2 giây rồi hồi ở bệ phe mình. THÂN THIỆN: KHÔNG tụt cấp súng, chỉ mất số trúng đang gom dở. `b` không có ⇒ tháp hạ. */
function biHa(tr: Tran, g: Ghe, b: Ghe | undefined): void {
  g.cho = GIAY_HOI; g.biHa++; g.chuoi = 0; g.khien = 0; g.muc = 0; g.mucK = 0; g.vx = g.vy = 0; g.song = 0
  const capCu = g.cap
  g.e = 0
  // Góp sức: ai (khác người hạ) trúng ghế này trong 4 giây trước ⇒ +1.
  for (const [id, luc] of Object.entries(g.boiLuc)) { const k = gheId(tr.ghe, Number(id)); if (k && k !== b && tr.t - luc <= 4) k.hoTro++ }
  g.boiLuc = {}
  tr.su.push({ t: 'ha', ai: g.id, boi: b ? b.id : 0, x: g.x, y: g.y, capCu, chuoi: b ? b.chuoi + 1 : 0 })
  if (b) {
    tr.ti[b.phe & 1]++; b.ha++; b.chuoi++; b.chuoiMax = Math.max(b.chuoiMax, b.chuoi); themTrung(tr, b, 2)
    const t = KHOI[TT_CUA[b.phe & 1]]
    if (xa(g.x, g.y, t.x, t.y) < 300) b.hoVe++ // hạ kẻ lấn gần tinh thể phe mình ⇒ «Hộ vệ»
  }
}
function hoiSinh(tr: Tran, g: Ghe): void {
  const [x, y] = choHoi(tr, g)
  g.x = x; g.y = y; g.vx = g.vy = 0; g.mau = MAU_MAX; g.che = GIAY_CHE; g.cho = 0; g.nap = 0.3; g.hoiLuc = 0
  tr.su.push({ t: 'hoi', ai: g.id })
}
/** Đạn trúng khối `i`: bảo hộ ⇒ đạn mất, không trừ máu; vỡ tháp ⇒ cả phe kia +1 cấp; vỡ tinh thể ⇒ hết ván, phe kia thắng. */
function trungKhoi(tr: Tran, i: number, chu: number, x: number, y: number): void {
  const k = KHOI[i]
  if (!danhDuoc(tr.km, i)) { tr.su.push({ t: 'kh', k: i, mau: tr.km[i], chan: true, x, y }); return }
  tr.km[i]--
  const b = chu ? gheId(tr.ghe, chu) : undefined
  if (b) { b.danhKhoi++; tr.danhK[i] = b.id; tr.danhLuc[i] = tr.t }
  tr.su.push({ t: 'kh', k: i, mau: tr.km[i], chan: false, x, y })
  if (tr.km[i] > 0) return
  tr.su.push({ t: 'vo', k: i })
  if (k.k === 'thap' || k.k === 'thap-lon') {
    if (b) b.phaThap++
    for (const g of tr.ghe) if (g.phe !== k.phe) { if (g.cap < 5) lenCap(tr, g, true); else g.mau = MAU_MAX }
  }
  if (k.k === 'tt') { tr.xong = true; tr.thang = 1 - k.phe; tr.lyDo = 'vo' }
}

export interface DongKet { id: number; nt: number; phe: number; ai: boolean; ha: number; biHa: number; capMax: number; chuoiMax: number; cap: number; danhKhoi: number; hoTro: number; trung: number; songMax: number; phaThap: number; hoVe: number }
/** Bảng ván (thứ tự hạ nhiều ⇒ ít bị hạ ⇒ cấp cao — chỉ để chọn huy hiệu; màn hết ván KHÔNG in thứ hạng). */
export function xepBang(tr: Tran): DongKet[] {
  return tr.ghe.map((g) => ({ id: g.id, nt: g.nt, phe: g.phe, ai: g.ai, ha: g.ha, biHa: g.biHa, capMax: g.capMax, chuoiMax: g.chuoiMax, cap: g.cap, danhKhoi: g.danhKhoi, hoTro: g.hoTro, trung: g.trung, songMax: Math.round(g.songMax), phaThap: g.phaThap, hoVe: g.hoVe }))
    .sort((a, b) => b.ha - a.ha || a.biHa - b.biHa || b.capMax - a.capMax)
}

/** HUY HIỆU VUI hết ván (thầy 01/11: «không bêu ai đứng chót … em nào cũng có lời khen»): mỗi em THẬT một huy hiệu, chia đều — huy hiệu
 *  đi theo thứ tự, mỗi cái về em CHƯA có huy hiệu mà chỉ số cao nhất (> 0); ai còn thiếu nhận «Hăng hái». A.I không nhận huy hiệu.
 *  v4 (tinh thể, thầy 02/11 tối): thêm «Phá tinh thể» (bắn trúng khối phe kia nhiều nhất), «Phá tháp», «Hộ vệ»; bỏ «Nhặt electron giỏi». */
export const HUY_HIEU = {
  'pha-tt': 'Phá tinh thể',
  'pha-thap': 'Phá tháp',
  'ho-ve': 'Hộ vệ',
  'xa-thu': 'Xạ thủ',
  'cuu-nguy': 'Đồng đội cứu nguy',
  'ben-bi': 'Bền bỉ',
  'ban-trung': 'Bắn trúng nhiều',
  'cap-cao': 'Súng cấp cao',
  'hang-hai': 'Hăng hái',
} as const
export type LoaiHuyHieu = keyof typeof HUY_HIEU
export interface HuyHieu { k: LoaiHuyHieu; ten: string; ghi: string }
export function huyHieu(bang: readonly DongKet[]): Map<number, HuyHieu> {
  const kq = new Map<number, HuyHieu>()
  const nguoi = bang.filter((d) => !d.ai)
  const ds: [LoaiHuyHieu, (d: DongKet) => number, (d: DongKet) => string][] = [
    ['pha-tt', (d) => d.danhKhoi, (d) => `bắn trúng tháp / tường ${d.danhKhoi} lần`],
    ['pha-thap', (d) => d.phaThap, (d) => `phá ${d.phaThap} tháp`],
    ['ho-ve', (d) => d.hoVe, (d) => `chặn ${d.hoVe} lần gần tinh thể`],
    ['xa-thu', (d) => d.ha, (d) => `hạ ${d.ha} lần`],
    ['cuu-nguy', (d) => d.hoTro, (d) => `góp sức ${d.hoTro} lần hạ`],
    ['ben-bi', (d) => d.songMax, (d) => `trụ liền ${d.songMax} giây`],
    ['ban-trung', (d) => d.trung, (d) => `trúng ${d.trung} viên`],
    ['cap-cao', (d) => d.capMax - 1, (d) => `súng lên Cấp ${d.capMax}`],
  ]
  for (const [k, so, ghi] of ds) {
    let tot: DongKet | null = null
    for (const d of nguoi) if (!kq.has(d.id) && so(d) > 0 && (!tot || so(d) > so(tot))) tot = d
    if (tot) kq.set(tot.id, { k, ten: HUY_HIEU[k], ghi: ghi(tot) })
  }
  for (const d of nguoi) if (!kq.has(d.id)) kq.set(d.id, { k: 'hang-hai', ten: HUY_HIEU['hang-hai'], ghi: 'chơi trọn ván' })
  return kq
}
/** Tỉ số hai phe = tổng số lần hạ của cả phe: [Bazơ, Axit]. */
export function tiSo(ds: readonly { phe?: number; ha: number }[]): [number, number] {
  const t: [number, number] = [0, 0]
  for (const g of ds) t[(g.phe ?? 0) & 1] += g.ha
  return t
}

/** Tháp tự bắn: kẻ phe kia trong vùng — ưu tiên người vừa đánh tháp này (≤ 2 giây), không thì người gần nhất; đạn chậm (né được). */
function thapBan(tr: Tran, dt: number): void {
  for (let i = 0; i < SO_KHOI; i++) {
    const k = KHOI[i]
    if ((k.k !== 'thap' && k.k !== 'thap-lon') || tr.km[i] <= 0) continue
    tr.napK[i] -= dt
    let tot: Ghe | null = null, gan = k.vung!
    for (const g of tr.ghe) {
      if (g.phe === k.phe || g.cho > 0 || g.che > 0 || g.vang) continue
      const d = xa(g.x, g.y, k.x, k.y)
      if (d >= k.vung!) continue
      if (tr.danhK[i] === g.id && tr.t - tr.danhLuc[i] <= 2) { tot = g; break }
      if (d < gan && thayNhau(k.x, k.y, g.x, g.y, tr.km, i)) { gan = d; tot = g }
    }
    if (!tot || tr.napK[i] > 0) { if (tr.napK[i] < 0) tr.napK[i] = 0; continue }
    tr.napK[i] = k.nhip!
    const a = Math.atan2(tot.y - k.y, tot.x - k.x)
    tr.dan.push({ chu: 0, k: i, nt: -1, phe: k.phe, cap: 1, x: k.x + Math.cos(a) * (k.r + 6), y: k.y + Math.sin(a) * (k.r + 6), vx: Math.cos(a) * TOC_DAN_THAP, vy: Math.sin(a) * TOC_DAN_THAP, con: k.vung! + 40, toc: TOC_DAN_THAP })
    tr.su.push({ t: 'tb', k: i, ngam: a })
  }
}

/** Một bước của trận (máy chủ 20 lần/giây; máy em 60). Sự kiện ĐẨY vào `tr.su` — nơi gọi lấy rồi xoá (`laySuKien`). */
export function buocTran(tr: Tran, dt: number): void {
  if (tr.xong || !(dt > 0)) return
  tr.t += dt; tr.con = Math.max(0, tr.con - dt)
  if (!tr.vp.some((v) => v.k === 'xt')) { tr.henXt -= dt; if (tr.henXt <= 0) { tr.henXt = 14; themVp(tr, 'xt') } }
  if (!tr.vp.some((v) => v.k === 'kh')) { tr.henKh -= dt; if (tr.henKh <= 0) { tr.henKh = 11; themVp(tr, 'kh') } }
  // CÔNG BẰNG HAI PHE: bước 1 mọi ghế đi xong rồi bước 2 mới ngắm / bắn / nhặt (không ai ngắm vào vị trí cũ của đối thủ chưa kịp đi);
  // thứ tự bước 2 đảo chiều mỗi nhịp (ai đứng trước trong danh sách không được lợi khi cùng nhặt một vật phẩm).
  for (const g of tr.ghe) {
    if (g.cho > 0) { g.cho -= dt; if (g.cho <= 0) hoiSinh(tr, g); continue }
    buocDi(g, g.yd.dx, g.yd.dy, dt, tr.km)
  }
  const n = tr.ghe.length, dao = Math.round(tr.t / dt) % 2 === 1
  for (let k = 0; k < n; k++) {
    const g = tr.ghe[dao ? n - 1 - k : k]
    if (g.cho > 0) continue
    g.song += dt; if (g.song > g.songMax) g.songMax = g.song
    g.che = Math.max(0, g.che - dt); g.nap -= dt
    if (g.mau < MAU_MAX && tr.t - g.biTrungLuc > GIAY_HOI_MAU) { g.hoiLuc += dt; if (g.hoiLuc >= NHIP_HOI_MAU) { g.hoiLuc = 0; g.mau++ } } else g.hoiLuc = 0
    // Ngắm: nguyên tử phe kia trong tầm trước; không có ⇒ khối phe kia trong TAM_KHOI (đứng trong vùng tháp mới bắn được tháp).
    // Đứng trước khe tường vỡ, tinh thể phe kia trong tầm ⇒ ƯU TIÊN bắn tinh thể (mục tiêu của ván), kể cả khi có người canh.
    const k0 = g.vang ? -1 : chonKhoi(tr.km, g)
    const uuTT = k0 >= 0 && KHOI[k0].k === 'tt'
    const m = g.vang || uuTT ? null : chonMuc(tr.ghe, g, tr.km)
    g.muc = m ? m.id : 0
    const kk = m || g.vang ? -1 : k0
    g.mucK = kk + 1
    const dt2 = m || kk >= 0 || g.vang ? null : doiTheo(tr.ghe, g)
    if (m) g.ngam = Math.atan2(m.y - g.y, m.x - g.x)
    else if (kk >= 0) { const [x, y] = diemKhoi(kk); g.ngam = Math.atan2(y - g.y, x - g.x) }
    else if (dt2) g.ngam = Math.atan2(dt2.y - g.y, dt2.x - g.x)
    else if (Math.hypot(g.vx, g.vy) > 40) g.ngam = Math.atan2(g.vy, g.vx)
    if ((m || kk >= 0) && g.nap <= 0 && g.che <= 0) banLoat(tr, g)
    if (g.nap < 0) g.nap = 0
    for (let i = tr.vp.length - 1; i >= 0; i--) {
      const v = tr.vp[i], rr = R + 16
      if (tr.t - v.t0 > 0.25 && (v.x - g.x) ** 2 + (v.y - g.y) ** 2 < rr * rr) { tr.vp.splice(i, 1); nhat(tr, g, v) }
    }
  }
  thapBan(tr, dt)
  // Hai nguyên tử không chồng lên nhau.
  for (let i = 0; i < tr.ghe.length; i++) for (let j = i + 1; j < tr.ghe.length; j++) {
    const a = tr.ghe[i], b = tr.ghe[j]
    if (a.cho > 0 || b.cho > 0) continue
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = R * 2
    if (d < m && d > 0.001) { const k = (m - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; dayRa(a, R, tr.km); dayRa(b, R, tr.km) }
  }
  // Đạn: chia bước ≤ 12 đơn vị để không xuyên tường mỏng.
  for (let i = tr.dan.length - 1; i >= 0; i--) {
    const d = tr.dan[i], toc = d.toc ?? TOC_DAN, n = Math.max(1, Math.ceil((toc * dt) / 12))
    let mat = false
    for (let s = 0; s < n && !mat; s++) {
      d.x += (d.vx * dt) / n; d.y += (d.vy * dt) / n; d.con -= (toc * dt) / n
      if (d.con <= 0) { mat = true; break }
      if (d.x < 0 || d.y < 0 || d.x > SAN_W || d.y > SAN_H) { mat = true; tr.su.push({ t: 'tat', x: kep(d.x, 0, SAN_W), y: kep(d.y, 0, SAN_H), nt: d.nt, phe: d.phe }); break }
      // Khối PHE KIA hứng đạn (đạn phe mình bay xuyên khối phe mình).
      for (let j = 0; j < SO_KHOI; j++) {
        if (tr.km[j] <= 0 || KHOI[j].phe === d.phe || !chamKhoi(j, d.x, d.y, R_DAN - 1)) continue
        mat = true
        if (d.chu) trungKhoi(tr, j, d.chu, d.x, d.y) // đạn tháp không đánh khối
        break
      }
      if (mat) break
      for (const g of tr.ghe) {
        // Đạn bay XUYÊN đồng đội (không trúng, không mất viên).
        if (g.id === d.chu || g.cho > 0 || g.phe === d.phe) continue
        if ((g.x - d.x) ** 2 + (g.y - d.y) ** 2 >= (R + R_DAN) ** 2) continue
        mat = true
        const ok = biTrung(tr, g, d.chu, d.x, d.y, 0), c = CAP[d.cap]
        if (ok && d.chu && c.xich) { // phản ứng dây chuyền: nảy sang bạn gần nhất (chỉ nguyên tử)
          let k2: Ghe | null = null, gan = c.xich
          for (const k of tr.ghe) { if (k.id === d.chu || k === g || k.cho > 0 || k.phe === d.phe) continue; const dd = xa(k.x, k.y, g.x, g.y); if (dd < gan && thayNhau(g.x, g.y, k.x, k.y, tr.km)) { gan = dd; k2 = k } }
          if (k2) { tr.su.push({ t: 'xich', chu: d.chu, a: g.id, b: k2.id }); biTrung(tr, k2, d.chu, k2.x, k2.y, 1) }
        }
        if (ok && d.chu && c.no) { // phản ứng toả nhiệt: nổ lan (chỉ nguyên tử)
          tr.su.push({ t: 'no', chu: d.chu, x: d.x, y: d.y })
          for (const k of tr.ghe) { if (k.id === d.chu || k === g || k.cho > 0 || k.phe === d.phe) continue; if (xa(k.x, k.y, d.x, d.y) < c.no + R) biTrung(tr, k, d.chu, k.x, k.y, 2) }
        }
        break
      }
    }
    if (mat) tr.dan.splice(i, 1)
  }
  // TRUNG HOÀ (thầy chốt 02/11): hai viên khác phe chạm nhau giữa đường ⇒ cùng mất (H⁺ + OH⁻ → H₂O). Xét khoảng cách GẦN NHẤT trên cả quãng bay
  // của bước (hai viên đối đầu bay 26 + 26 đơn vị mỗi bước — so điểm cuối thì nhảy qua nhau).
  for (let i = tr.dan.length - 1; i >= 0; i--) {
    const a = tr.dan[i]
    for (let j = i - 1; j >= 0; j--) {
      const b = tr.dan[j]
      if (a.phe === b.phe) continue
      const rx0 = a.x - a.vx * dt - (b.x - b.vx * dt), ry0 = a.y - a.vy * dt - (b.y - b.vy * dt), vx = a.vx - b.vx, vy = a.vy - b.vy, v2 = vx * vx + vy * vy
      const tt = v2 > 0 ? kep(-(rx0 * vx + ry0 * vy) / v2, 0, dt) : dt
      if ((rx0 + vx * tt) ** 2 + (ry0 + vy * tt) ** 2 >= (R_DAN * 2) ** 2) continue
      const lui = dt - tt
      tr.su.push({ t: 'th', x: (a.x + b.x - (a.vx + b.vx) * lui) / 2, y: (a.y + b.y - (a.vy + b.vy) * lui) / 2 })
      tr.dan.splice(i, 1); tr.dan.splice(j, 1); i--
      break
    }
  }
  if (tr.xong) return
  if (tr.con <= 0) {
    // Hết giờ: phe còn nhiều máu tinh thể hơn thắng; bằng ⇒ hoà.
    const a = tr.km[TT_CUA[0]], b = tr.km[TT_CUA[1]]
    tr.xong = true; tr.lyDo = 'gio'; tr.thang = a > b ? 0 : b > a ? 1 : 2
  }
}

/** Lấy sự kiện đã dồn và xoá khỏi trận. */
export function laySuKien(tr: Tran): SuKien[] { const s = tr.su; tr.su = []; return s }

/** Tháp phe mình còn đứng gần nhất (A.I lùi về đây khi yếu máu). */
function thapNha(tr: Tran, g: Ghe): Khoi | null {
  let tot: Khoi | null = null, gan = 1e9
  for (let i = 0; i < SO_KHOI; i++) { const k = KHOI[i]; if (k.phe !== g.phe || (k.k !== 'thap' && k.k !== 'thap-lon') || tr.km[i] <= 0) continue; const d = xa(g.x, g.y, k.x, k.y); if (d < gan) { gan = d; tot = k } }
  return tot
}
/** Khối phe kia A.I nhắm phá: trúng được (bảo hộ), ưu tiên cánh của mình (ne), rồi gần nhất. */
function khoiDich(tr: Tran, g: Ghe): number {
  let tot = -1, diem = -1e9
  for (let i = 0; i < SO_KHOI; i++) {
    const k = KHOI[i]
    if (k.phe === g.phe || !danhDuoc(tr.km, i)) continue
    const [x, y] = diemKhoi(i)
    if (k.k === 'tt' && tr.km.slice(k.phe * 7 + 3, k.phe * 7 + 6).every((m) => m > 0)) continue // tường còn kín ⇒ chưa nhắm tinh thể
    const canh = k.canh === 1 ? 0 : (k.canh === 0) === (g.ne < 0) ? 120 : -80
    const d = canh - xa(g.x, g.y, x, y) * 0.5 + (k.k === 'tt' ? 300 : 0)
    if (d > diem) { diem = d; tot = i }
  }
  return tot
}
/** A.I CHỈ quyết hướng đi (súng tự ngắm như mọi người). Mỗi phe một A.I GIỮ NHÀ (A.I số hiệu nhỏ nhất, khi phe có ≥ 2 ghế A.I);
 *  A.I khác ĐI PHÁ: tới khối phe kia đang trúng được; cấp thấp đi một mình thì chờ bạn ngoài vùng tháp (quá 5 giây ⇒ vào luôn); yếu máu ⇒ lùi về tháp nhà. */
function aiNghi(tr: Tran, g: Ghe, dtNghi: number): void {
  let dich: Ghe | null = null, gan = 1e9
  for (const k of tr.ghe) if (doiPhe(k, g) && k.cho <= 0 && !k.vang) { const d = xa(k.x, k.y, g.x, g.y); if (d < gan) { gan = d; dich = k } }
  const aiPhe = tr.ghe.filter((k) => k.ai && k.phe === g.phe).sort((a, b) => a.id - b.id)
  const giuNha = aiPhe.length >= 2 && aiPhe[0] === g
  const tt = KHOI[TT_CUA[g.phe & 1]], huong = g.phe ? -1 : 1
  let tx = TAM_X, ty = TAM_Y
  const nha = g.mau <= 3 ? thapNha(tr, g) : null
  let vp: VatPham | null = null, diem = -1e9
  for (const v of tr.vp) { const d = (v.k === 'xt' ? (g.cap < 5 ? 420 : 120) : g.khien ? -1e9 : 240) - xa(v.x, v.y, g.x, g.y); if (d > diem) { diem = d; vp = v } }
  const iDich = giuNha ? -1 : khoiDich(tr, g), danhTT = iDich >= 0 && KHOI[iDich].k === 'tt' && g.mau > 4
  if (nha) { tx = nha.x - huong * 40; ty = nha.y }
  else if (giuNha) {
    const lan = dich && xa(dich.x, dich.y, tt.x, tt.y) < 340
    if (lan && dich) { const a = Math.atan2(g.y - dich.y, g.x - dich.x) + g.ne * 0.6; tx = dich.x + Math.cos(a) * 200; ty = dich.y + Math.sin(a) * 200 }
    else { tx = tt.x + huong * 150; ty = tt.y + g.ne * 70 }
  } else if (dich && gan < 260 && !danhTT) { const a = Math.atan2(g.y - dich.y, g.x - dich.x) + g.ne * 0.9; tx = dich.x + Math.cos(a) * 230; ty = dich.y + Math.sin(a) * 230 }
  else if (vp && diem > 40) { tx = vp.x; ty = vp.y }
  else {
    const i = iDich
    if (i >= 0) {
      const k = KHOI[i], [x, y] = diemKhoi(i)
      const ban = tr.ghe.some((b) => b !== g && b.phe === g.phe && b.cho <= 0 && xa(b.x, b.y, x, y) < 260)
      const coVung = (k.k === 'thap' || k.k === 'thap-lon') && tr.km[i] > 8
      const choBan = coVung && g.cap < 3 && !ban && g.aiCho < 5
      if (choBan) g.aiCho += dtNghi; else if (!coVung) g.aiCho = 0
      const xaDung = choBan ? k.vung! + 30 : 120
      let a = Math.atan2(g.y - y, g.x - x)
      if (k.k === 'tt') { // tinh thể: đứng trước KHE tường đã vỡ (giữa cung mảnh vỡ) ⇒ có đường bắn
        const b = k.phe * 7
        let vo = -1, gv = 1e9
        for (let j = 3; j < 6; j++) if (tr.km[b + j] <= 0) { const w = KHOI[b + j], am = (w.a0! + w.a1!) / 2, d = xa(g.x, g.y, w.x + Math.cos(am) * 120, w.y + Math.sin(am) * 120); if (d < gv) { gv = d; vo = j } }
        if (vo >= 0) { const w = KHOI[b + vo]; a = (w.a0! + w.a1!) / 2 }
      }
      tx = x + Math.cos(a) * xaDung; ty = y + Math.sin(a) * xaDung
    }
  }
  g.aiX = kep(tx, 30, SAN_W - 30); g.aiY = kep(ty, 30, SAN_H - 30)
}
export function aiDi(tr: Tran, g: Ghe, dt: number): { dx: number; dy: number } {
  if (g.cho > 0) return { dx: 0, dy: 0 }
  g.aiT -= dt; if (g.aiT <= 0) { const d = 0.16 + ngauNhien(tr) * 0.12; g.aiT = d; aiNghi(tr, g, d) }
  g.doiNe -= dt; if (g.doiNe <= 0) { g.doiNe = 1.4 + ngauNhien(tr) * 2; g.ne = -g.ne }
  let dx = g.aiX - g.x, dy = g.aiY - g.y
  const l = Math.hypot(dx, dy)
  if (l < 8) return { dx: 0, dy: 0 }
  const a0 = Math.atan2(dy, dx)
  for (const x of [0, 0.7, -0.7, 1.4, -1.4, 2.2, -2.2]) {
    const a = a0 + x * g.ne, px = g.x + Math.cos(a) * 34, py = g.y + Math.sin(a) * 34
    if (!dungVatCan(px, py, R, tr.km) && px > R && px < SAN_W - R && py > R && py < SAN_H - R) { dx = Math.cos(a); dy = Math.sin(a); break }
  }
  const t = Math.min(1, l / 40) * 0.92
  return { dx: dx * t, dy: dy * t }
}
