// LÕI THUẦN «Đấu Nguyên Tử» — súng TỰ NGẮM và TỰ BẮN, em chỉ quyết hướng đi; nhặt electron để súng tiến hoá 5 cấp; Xúc tác lên ngay một cấp;
// Khiên chặn 3 viên; ván 60 giây. KHÔNG đụng DOM, mạng, đồng hồ thật: nhận `dt` (giây) từ ngoài; ngẫu nhiên là hạt giống nằm trong trận ⇒ tất định.
// Dùng chung hai nơi: phòng đấu trên máy chủ (server/src/dau-ion-phong.ts — nơi QUYẾT mọi thứ) và máy em (chơi tại máy; tự ngắm của em để vẽ ngay).
// BẢN VẼ 3 ĐẤU 3 (thầy 01/11 tối, docs/ban-ve-dau-ion-3v3-0111/DAC-TA.md — CHƯA DUYỆT, chưa phát hành):
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
/** Tầm đạn ≥ đường chéo sân (1163): đạn bay hết sân. */
export const TAM_DAN = 1180
export const R_DAN = 5
/** Tầm ngắm = cả sân (chỉ vật che mới chặn). */
export const TAM_NGAM = 1200
export const MAU_MAX = 10
/** Hồi sinh nhanh (thân thiện). */
export const GIAY_HOI = 1.2
/** Khiên hồi sinh. */
export const GIAY_CHE = 1.5
/** Khiên của em MỚI vào sân giữa ván (vào thay A.I). */
export const GIAY_CHE_MOI = 3
export const GIAY_VAN = 60
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

export type VatCan =
  | { k: 'tron'; x: number; y: number; r: number; ve: 'binh-cau' | 'binh-non'; mau?: number }
  | { k: 'cn'; x: number; y: number; w: number; h: number; ve: 'gia-ong' | 'coc'; mau?: number; phe?: number }
/** SÂN CHIẾN THUẬT 3 ĐẤU 3 (1040 × 520) — đối xứng GƯƠNG cả hai trục (x ↔ 1040 − x, y ↔ 520 − y) ⇒ hai phe nhận đúng như nhau.
 *  · Bình cầu lớn ở tâm: chặn đường bắn thẳng từ căn cứ này sang căn cứ kia.
 *  · Hai bình nón trên / dưới bình cầu: tách hai HÀNH LANG CÁNH (mép trên, mép dưới) khỏi ngõ giữa (khe 57 vừa một nguyên tử).
 *  · Tường chắn căn cứ (giá ống nghiệm dựng đứng) trước bệ giữa mỗi phe: vừa hồi sinh không bị bắn thẳng từ giữa sân.
 *  · Bốn cốc ở nửa đường hai hành lang cánh + hai bình nón nhỏ ở ngõ giữa, XEN KẼ (x 300 · 400 · 520 · 640 · 740): tiến / lùi luôn có chỗ nấp kế tiếp.
 *  Dung dịch trong dụng cụ màu TRUNG TÍNH (lục, vàng, tím, cam) — không đỏ / xanh để khỏi lẫn với màu hai phe. */
export const VAT_CAN: readonly VatCan[] = [
  { k: 'tron', x: 520, y: 260, r: 46, ve: 'binh-cau', mau: 3 },
  { k: 'tron', x: 520, y: 135, r: 22, ve: 'binh-non', mau: 4 },
  { k: 'tron', x: 520, y: 385, r: 22, ve: 'binh-non', mau: 4 },
  { k: 'tron', x: 400, y: 260, r: 20, ve: 'binh-non', mau: 0 },
  { k: 'tron', x: 640, y: 260, r: 20, ve: 'binh-non', mau: 0 },
  { k: 'cn', x: 136, y: 200, w: 22, h: 120, ve: 'gia-ong', phe: 0 },
  { k: 'cn', x: 882, y: 200, w: 22, h: 120, ve: 'gia-ong', phe: 1 },
  { k: 'cn', x: 278, y: 74, w: 44, h: 44, ve: 'coc', mau: 5 },
  { k: 'cn', x: 278, y: 402, w: 44, h: 44, ve: 'coc', mau: 5 },
  { k: 'cn', x: 718, y: 74, w: 44, h: 44, ve: 'coc', mau: 5 },
  { k: 'cn', x: 718, y: 402, w: 44, h: 44, ve: 'coc', mau: 5 },
]
/** Ba bệ xuất phát mỗi phe ở đầu sân của phe: [cánh trên, giữa (sau tường chắn), cánh dưới] — bệ thứ i của hai phe đối xứng tâm. */
export const BE_PHE: readonly (readonly (readonly [number, number])[])[] = [
  [[76, 96], [62, 260], [76, 424]],
  [[964, 424], [978, 260], [964, 96]],
]
/** Sáu bệ (0…2 Bazơ, 3…5 Axit) — để vẽ nền. */
export const CHO_RA: readonly (readonly [number, number])[] = [...BE_PHE[0], ...BE_PHE[1]]
/** Xúc tác: giữa hai hành lang cánh (tranh chấp, cách đều hai căn cứ). Khiên: trước tường chắn mỗi căn cứ. */
export const CHO_XT: readonly (readonly [number, number])[] = [[520, 58], [520, 462]]
export const CHO_KH: readonly (readonly [number, number])[] = [[200, 260], [840, 260]]

export type LoaiVp = 'e' | 'xt' | 'kh'
export interface VatPham { id: number; k: LoaiVp; x: number; y: number; t0: number }
export interface Ghe {
  id: number; nt: number; ai: boolean
  /** Phe: 0 = Bazơ, 1 = Axit. */
  phe: number
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
  /** Thống kê cho HUY HIỆU hết ván: electron đã nhặt, số lần góp sức hạ (trúng đối thủ ≤ 4 giây trước khi đồng đội hạ), giây sống liền lâu nhất. */
  nhatE: number; hoTro: number; song: number; songMax: number
  /** id người bắn ⇒ giây trận lần cuối trúng ghế này (tính góp sức). */
  boiLuc: Record<number, number>
  /** Ghế vắng (không gửi ý định quá 3 giây): không tự bắn, không bị ngắm. */
  vang: boolean
  yd: { dx: number; dy: number }
  // Trạng thái đi của A.I.
  ne: number; doiNe: number; aiT: number; aiX: number; aiY: number
}
export interface Dan { chu: number; nt: number; phe: number; cap: number; x: number; y: number; vx: number; vy: number; con: number }
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
  /** Em vào thay ghế A.I (chỉ ở máy em, từ gói JSON `thay`): A.I biến đi bằng bong bóng. */
  | { t: 'thay'; ai: number }
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
  p.x = kep(p.x, r, SAN_W - r); p.y = kep(p.y, r, SAN_H - r)
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

const doiPhe = (a: { phe?: number }, b: { phe?: number }) => (a.phe ?? 0) !== (b.phe ?? 0)

/** Bệ hồi sinh của phe: bệ xa ĐỐI THỦ đang trên sân nhất (gần bằng nhau ⇒ bệ giữa, có tường chắn). */
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
  Object.assign(g, { x, y, vx: 0, vy: 0, ngam: Math.atan2(TAM_Y - y, TAM_X - x), mau: MAU_MAX, cap: 1, e: 0, capMax: 1, ha: 0, biHa: 0, chuoi: 0, chuoiMax: 0, cho: 0, che: GIAY_CHE, khien: 0, nap: 0.6 + o * 0.07 + g.phe * 0.035, muc: 0, biTrungLuc: -9, hoiLuc: 0, ban: 0, trung: 0, nhatE: 0, hoTro: 0, song: 0, songMax: 0, boiLuc: {}, yd: { dx: 0, dy: 0 }, aiT: 0, aiX: TAM_X, aiY: TAM_Y })
}
/** Phe ít ghế hơn (bằng nhau ⇒ Bazơ). */
function pheIt(tr: Tran): number { const n = [0, 0]; for (const g of tr.ghe) n[g.phe & 1]++; return n[1] < n[0] ? 1 : 0 }
function taoGhe(tr: Tran, d: { id: number; nt: number; ai?: boolean; phe?: number }): Ghe {
  const phe = d.phe === 0 || d.phe === 1 ? d.phe : pheIt(tr)
  const o = tr.ghe.filter((k) => k.phe === phe).length
  const g = { id: d.id, nt: kep(d.nt | 0, 0, NGUYEN_TO.length - 1), ai: !!d.ai, phe, vang: false, ne: o % 2 ? 1 : -1, doiNe: 1 + (o + phe * 3) * 0.3 } as Ghe
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
function datE(tr: Tran, x: number, y: number): void {
  const v: VatPham = { id: idVpMoi(tr), k: 'e', x, y, t0: tr.t }
  tr.vp.push(v); tr.su.push({ t: 'vp', id: v.id, k: 'e', x, y })
}
const choETrong = (tr: Tran, px: number, py: number) => !dungVatCan(px, py, 16) && !tr.ghe.some((g) => g.cho <= 0 && xa(g.x, g.y, px, py) < 60) && !tr.vp.some((v) => xa(v.x, v.y, px, py) < 26)
/** Electron: có toạ độ (rơi khi bị hạ) ⇒ một viên tại chỗ; không ⇒ rải THEO CẶP đối xứng tâm (hai phe như nhau). */
function themE(tr: Tran, x?: number, y?: number): void {
  if (x !== undefined && y !== undefined) { datE(tr, x, y); return }
  for (let k = 0; k < 24; k++) {
    const px = 36 + ngauNhien(tr) * (SAN_W - 72), py = 36 + ngauNhien(tr) * (SAN_H - 72)
    if (xa(px, py, TAM_X, TAM_Y) < 30 || !choETrong(tr, px, py) || !choETrong(tr, SAN_W - px, SAN_H - py)) continue
    datE(tr, px, py); datE(tr, SAN_W - px, SAN_H - py); return
  }
}
/** Xúc tác / Khiên: hiện CÙNG LÚC ở mọi chỗ đặt (đối xứng) còn trống. */
function themVp(tr: Tran, k: 'xt' | 'kh'): void {
  for (const [x, y] of k === 'xt' ? CHO_XT : CHO_KH) {
    if (tr.ghe.some((g) => g.cho <= 0 && xa(g.x, g.y, x, y) < 50)) continue
    const v: VatPham = { id: idVpMoi(tr), k, x, y, t0: tr.t }
    tr.vp.push(v); tr.su.push({ t: 'vp', id: v.id, k, x, y })
  }
}

/** Trận mới với danh sách ghế (tối đa 6; không ghi phe ⇒ vào phe ít ghế hơn, xen kẽ). */
export function taoTran(ds: readonly { id: number; nt: number; ai?: boolean; phe?: number }[], hat = 1): Tran {
  const tr: Tran = { t: 0, con: GIAY_VAN, xong: false, ghe: [], dan: [], vp: [], su: [], hat: hat | 0 || 1, idVp: 0, henE: 0, henXt: 9, henKh: 6 }
  ds.slice(0, TOI_DA).forEach((d) => tr.ghe.push(taoGhe(tr, d)))
  for (let i = 0; i < 8; i++) themE(tr)
  return tr
}

/** Ván mới cùng những ghế đang có: mọi người về Cấp 1, vật phẩm rải lại. */
export function vanMoi(tr: Tran): void {
  tr.t = 0; tr.con = GIAY_VAN; tr.xong = false; tr.dan = []; tr.vp = []; tr.su = []; tr.henE = 0; tr.henXt = 9; tr.henKh = 6
  const n = [0, 0]
  for (const g of tr.ghe) datLai(g, n[g.phe & 1]++)
  for (let i = 0; i < 8; i++) themE(tr)
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
function themEChoGhe(tr: Tran, g: Ghe, n: number): void {
  if (g.cap >= 5) { g.mau = Math.min(MAU_MAX, g.mau + n); return }
  g.e += n
  while (g.cap < 5 && g.e >= CAN_E[g.cap]) { g.e -= CAN_E[g.cap]; lenCap(tr, g, false) }
  if (g.cap >= 5) g.e = 0
}
function nhat(tr: Tran, g: Ghe, v: VatPham): void {
  tr.su.push({ t: 'nhat', id: v.id, ai: g.id, k: v.k, x: v.x, y: v.y })
  if (v.k === 'e') { g.nhatE++; themEChoGhe(tr, g, 1) }
  else if (v.k === 'xt') { if (g.cap < 5) lenCap(tr, g, true); else g.mau = MAU_MAX }
  else g.khien = 3
}

/** Ghế tối thiểu để tự ngắm (máy chủ dùng Ghe; máy em dùng ghế đang vẽ). */
export interface GheNgam { id: number; x: number; y: number; cho: number; che: number; vang?: boolean; muc: number; phe?: number }
/** Tự ngắm: ĐỐI THỦ (khác phe) gần nhất trên CẢ SÂN, còn trên sân, hết khiên hồi sinh, không vắng, đường bắn không bị vật che;
 *  giữ mục tiêu cũ tới khi có đối thủ gần hơn hẳn (25 %). Mọi đối thủ đều nấp ⇒ null (không bắn; nòng dõi theo `doiTheo`). */
export function chonMuc<G extends GheNgam>(ds: readonly G[], g: G): G | null {
  let tot: G | null = null, gan = TAM_NGAM
  const duoc = (k: G) => k !== g && doiPhe(k, g) && k.cho <= 0 && k.che <= 0 && !k.vang
  for (const k of ds) { if (!duoc(k)) continue; const d = xa(g.x, g.y, k.x, k.y); if (d < gan && thayNhau(g.x, g.y, k.x, k.y)) { gan = d; tot = k } }
  const cu = g.muc ? gheId(ds, g.muc) : undefined
  if (cu && cu !== tot && duoc(cu)) { const d = xa(g.x, g.y, cu.x, cu.y); if (d < TAM_NGAM && d < gan * 1.25 && thayNhau(g.x, g.y, cu.x, cu.y)) return cu }
  return tot
}
/** Đối thủ gần nhất KỂ CẢ đang nấp (chỉ để nòng dõi theo, không bắn). */
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
  g.mau--; g.biTrungLuc = tr.t; g.boiLuc[boi] = tr.t
  const b = gheId(tr.ghe, boi)
  if (b) b.trung++
  tr.su.push({ t: 'trung', ai: g.id, boi, x, y, mau: g.mau, phu })
  if (g.mau <= 0) biHa(tr, g, b)
  return true
}
/** Bị hạ: chờ 1,2 giây rồi hồi ở bệ phe mình. THÂN THIỆN (đề xuất 01/11): KHÔNG tụt cấp súng, chỉ mất electron đang gom dở. */
function biHa(tr: Tran, g: Ghe, b: Ghe | undefined): void {
  g.cho = GIAY_HOI; g.biHa++; g.chuoi = 0; g.khien = 0; g.muc = 0; g.vx = g.vy = 0; g.song = 0
  const capCu = g.cap
  g.e = 0
  // Góp sức: ai (khác người hạ) trúng ghế này trong 4 giây trước ⇒ +1.
  for (const [id, luc] of Object.entries(g.boiLuc)) { const k = gheId(tr.ghe, Number(id)); if (k && k !== b && tr.t - luc <= 4) k.hoTro++ }
  g.boiLuc = {}
  tr.su.push({ t: 'ha', ai: g.id, boi: b ? b.id : 0, x: g.x, y: g.y, capCu, chuoi: b ? b.chuoi + 1 : 0 })
  for (let i = 0; i < 2; i++) {
    const a = ngauNhien(tr) * PI2, r = 16 + ngauNhien(tr) * 24, p = { x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r }
    dayRa(p, 8); themE(tr, p.x, p.y)
  }
  if (b) { b.ha++; b.chuoi++; b.chuoiMax = Math.max(b.chuoiMax, b.chuoi); themEChoGhe(tr, b, 2) }
}
function hoiSinh(tr: Tran, g: Ghe): void {
  const [x, y] = choHoi(tr, g)
  g.x = x; g.y = y; g.vx = g.vy = 0; g.mau = MAU_MAX; g.che = GIAY_CHE; g.cho = 0; g.nap = 0.3; g.hoiLuc = 0
  tr.su.push({ t: 'hoi', ai: g.id })
}

export interface DongKet { id: number; nt: number; phe: number; ai: boolean; ha: number; biHa: number; capMax: number; chuoiMax: number; cap: number; nhatE: number; hoTro: number; trung: number; songMax: number }
/** Bảng ván (thứ tự hạ nhiều ⇒ ít bị hạ ⇒ cấp cao — chỉ để chọn huy hiệu; màn hết ván KHÔNG in thứ hạng). */
export function xepBang(tr: Tran): DongKet[] {
  return tr.ghe.map((g) => ({ id: g.id, nt: g.nt, phe: g.phe, ai: g.ai, ha: g.ha, biHa: g.biHa, capMax: g.capMax, chuoiMax: g.chuoiMax, cap: g.cap, nhatE: g.nhatE, hoTro: g.hoTro, trung: g.trung, songMax: Math.round(g.songMax) }))
    .sort((a, b) => b.ha - a.ha || a.biHa - b.biHa || b.capMax - a.capMax)
}

/** HUY HIỆU VUI hết ván (thầy 01/11: «không bêu ai đứng chót … em nào cũng có lời khen»): mỗi em THẬT một huy hiệu, chia đều — huy hiệu
 *  đi theo thứ tự, mỗi cái về em CHƯA có huy hiệu mà chỉ số cao nhất (> 0); ai còn thiếu nhận «Hăng hái». A.I không nhận huy hiệu. */
export const HUY_HIEU = {
  'xa-thu': 'Xạ thủ',
  'cuu-nguy': 'Đồng đội cứu nguy',
  electron: 'Nhặt electron giỏi',
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
    ['xa-thu', (d) => d.ha, (d) => `hạ ${d.ha} lần`],
    ['cuu-nguy', (d) => d.hoTro, (d) => `góp sức ${d.hoTro} lần hạ`],
    ['electron', (d) => d.nhatE, (d) => `nhặt ${d.nhatE} electron`],
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

/** Một bước của trận (máy chủ 20 lần/giây; máy em 60). Sự kiện ĐẨY vào `tr.su` — nơi gọi lấy rồi xoá (`laySuKien`). */
export function buocTran(tr: Tran, dt: number): void {
  if (tr.xong || !(dt > 0)) return
  tr.t += dt; tr.con = Math.max(0, tr.con - dt)
  tr.henE -= dt
  // Electron rải THEO CẶP mỗi 2 giây (≈ 60 viên / ván + electron rơi khi bị hạ): đa số lên Cấp 4–5 ở nửa sau ván (số đo: DAC-TA mục 4).
  if (tr.henE <= 0) { tr.henE = 2; if (tr.vp.filter((v) => v.k === 'e').length < 12) themE(tr) }
  if (!tr.vp.some((v) => v.k === 'xt')) { tr.henXt -= dt; if (tr.henXt <= 0) { tr.henXt = 14; themVp(tr, 'xt') } }
  if (!tr.vp.some((v) => v.k === 'kh')) { tr.henKh -= dt; if (tr.henKh <= 0) { tr.henKh = 11; themVp(tr, 'kh') } }
  // CÔNG BẰNG HAI PHE: bước 1 mọi ghế đi xong rồi bước 2 mới ngắm / bắn / nhặt (không ai ngắm vào vị trí cũ của đối thủ chưa kịp đi);
  // thứ tự bước 2 đảo chiều mỗi nhịp (ai đứng trước trong danh sách không được lợi khi cùng nhặt một vật phẩm).
  for (const g of tr.ghe) {
    if (g.cho > 0) { g.cho -= dt; if (g.cho <= 0) hoiSinh(tr, g); continue }
    buocDi(g, g.yd.dx, g.yd.dy, dt)
  }
  const n = tr.ghe.length, dao = Math.round(tr.t / dt) % 2 === 1
  for (let k = 0; k < n; k++) {
    const g = tr.ghe[dao ? n - 1 - k : k]
    if (g.cho > 0) continue
    g.song += dt; if (g.song > g.songMax) g.songMax = g.song
    g.che = Math.max(0, g.che - dt); g.nap -= dt
    if (g.mau < MAU_MAX && tr.t - g.biTrungLuc > GIAY_HOI_MAU) { g.hoiLuc += dt; if (g.hoiLuc >= NHIP_HOI_MAU) { g.hoiLuc = 0; g.mau++ } } else g.hoiLuc = 0
    const m = g.vang ? null : chonMuc(tr.ghe, g)
    g.muc = m ? m.id : 0
    // Có đối thủ lộ ⇒ ngắm + bắn; mọi đối thủ đều nấp ⇒ nòng vẫn dõi đối thủ gần nhất nhưng KHÔNG bắn.
    const dt2 = m || g.vang ? null : doiTheo(tr.ghe, g)
    if (m) g.ngam = Math.atan2(m.y - g.y, m.x - g.x)
    else if (dt2) g.ngam = Math.atan2(dt2.y - g.y, dt2.x - g.x)
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
      if (d.x < 0 || d.y < 0 || d.x > SAN_W || d.y > SAN_H || dungVatCan(d.x, d.y, R_DAN - 1)) { mat = true; tr.su.push({ t: 'tat', x: kep(d.x, 0, SAN_W), y: kep(d.y, 0, SAN_H), nt: d.nt, phe: d.phe }); break }
      for (const g of tr.ghe) {
        // Đạn bay XUYÊN đồng đội (không trúng, không mất viên).
        if (g.id === d.chu || g.cho > 0 || g.phe === d.phe) continue
        if ((g.x - d.x) ** 2 + (g.y - d.y) ** 2 >= (R + R_DAN) ** 2) continue
        mat = true
        const ok = biTrung(tr, g, d.chu, d.x, d.y, 0), c = CAP[d.cap]
        if (ok && c.xich) { // phản ứng dây chuyền: nảy sang bạn gần nhất
          let k2: Ghe | null = null, gan = c.xich
          for (const k of tr.ghe) { if (k.id === d.chu || k === g || k.cho > 0 || k.phe === d.phe) continue; const dd = xa(k.x, k.y, g.x, g.y); if (dd < gan && thayNhau(g.x, g.y, k.x, k.y)) { gan = dd; k2 = k } }
          if (k2) { tr.su.push({ t: 'xich', chu: d.chu, a: g.id, b: k2.id }); biTrung(tr, k2, d.chu, k2.x, k2.y, 1) }
        }
        if (ok && c.no) { // phản ứng toả nhiệt: nổ lan
          tr.su.push({ t: 'no', chu: d.chu, x: d.x, y: d.y })
          for (const k of tr.ghe) { if (k.id === d.chu || k === g || k.cho > 0 || k.phe === d.phe) continue; if (xa(k.x, k.y, d.x, d.y) < c.no + R) biTrung(tr, k, d.chu, k.x, k.y, 2) }
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

/** Điểm nấp gần nhất: sau một vật che, phía khuất so với đối thủ `d` (đối thủ không thấy điểm đó). */
function choNap(g: Ghe, d: Ghe): { x: number; y: number } | null {
  let tot: { x: number; y: number } | null = null, gan = 1e9
  for (const v of VAT_CAN) {
    const cx = v.k === 'tron' ? v.x : v.x + v.w / 2, cy = v.k === 'tron' ? v.y : v.y + v.h / 2
    const rr = (v.k === 'tron' ? v.r : Math.max(v.w, v.h) / 2) + R + 8
    const a = Math.atan2(cy - d.y, cx - d.x), px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr
    if (px < R || py < R || px > SAN_W - R || py > SAN_H - R || dungVatCan(px, py, R) || thayNhau(px, py, d.x, d.y)) continue
    const l = xa(g.x, g.y, px, py)
    if (l < gan) { gan = l; tot = { x: px, y: py } }
  }
  return tot
}
/** A.I CHỈ quyết hướng đi (súng tự ngắm như mọi người): nhặt vật phẩm, giữ khoảng cách với đối thủ, yếu Máu thì chạy ra sau vật che. */
function aiNghi(tr: Tran, g: Ghe): void {
  let dich: Ghe | null = null, gan = 1e9
  for (const k of tr.ghe) if (doiPhe(k, g) && k.cho <= 0 && !k.vang) { const d = xa(k.x, k.y, g.x, g.y); if (d < gan) { gan = d; dich = k } }
  let vp: VatPham | null = null, diem = -1e9
  for (const v of tr.vp) {
    const gia = v.k === 'xt' ? (g.cap < 5 ? 520 : 160) : v.k === 'kh' ? (g.khien ? 0 : 300) : g.cap < 5 ? 150 : g.mau < MAU_MAX ? 110 : 10
    const d = gia - xa(v.x, v.y, g.x, g.y)
    if (d > diem) { diem = d; vp = v }
  }
  let tx = TAM_X, ty = TAM_Y
  const lo = !!dich && thayNhau(g.x, g.y, dich.x, dich.y)
  const nap = dich && lo && g.mau <= 4 ? choNap(g, dich) : null
  if (nap) { tx = nap.x; ty = nap.y }
  else if (vp && (diem > -60 || !dich || gan > 420)) { tx = vp.x; ty = vp.y }
  else if (dich) { const a = Math.atan2(g.y - dich.y, g.x - dich.x) + g.ne * 0.9; tx = dich.x + Math.cos(a) * 300; ty = dich.y + Math.sin(a) * 300 }
  g.aiX = kep(tx, 30, SAN_W - 30); g.aiY = kep(ty, 30, SAN_H - 30)
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
    if (!dungVatCan(px, py, R) && px > R && px < SAN_W - R && py > R && py < SAN_H - R) { dx = Math.cos(a); dy = Math.sin(a); break }
  }
  const t = Math.min(1, l / 40) * 0.92
  return { dx: dx * t, dy: dy * t }
}
