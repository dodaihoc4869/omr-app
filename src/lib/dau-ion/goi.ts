// GÓI NHỊ PHÂN của «Đấu Nguyên Tử 2» — dùng chung máy em ↔ phòng đấu (server/src/dau-ion-phong.ts). Thuần, không DOM.
// PHIÊN BẢN GIAO THỨC = 3 (bản vẽ 3 đấu 3, 01/11: sân 1040 × 520 ⇒ toạ độ × 50; gói `vao` mang `v: 3`; bản khác ⇒ phòng đóng sạch mã 4010, máy cũ được báo tải lại).
// Máy em → phòng: Ý ĐỊNH 8 byte [1, seq, dx, dy, 0, 0, 0, 0] ~12 lần/giây — CHỈ hướng đi. Ngắm, bắn, Máu, cấp: phòng quyết.
// Phòng → máy em: ẢNH TRẬN MÃ 4 (bản cũ mã 3 ⇒ không đọc lẫn) 20 lần/giây = đầu 10 byte + 10 byte mỗi ghế + sự kiện mới.
// Đầu: [4, tick, ack, giây còn, số ghế, số sự kiện, BƯỚC TRẬN (uint16 — mốc thời gian của phòng, 1 bước = 1/20 giây), tỉ số Bazơ, tỉ số Axit].
// Máy em nội suy theo BƯỚC TRẬN (đồng hồ của phòng), không theo giờ nhận gói ⇒ mạng rung không làm giật hình.
// Đạn: một sự kiện MỖI LOẠT (vị trí, góc, cấp); máy em tự sinh 1–5 viên theo cấp và cho bay. Trúng hay không thì phòng báo.
import { MAU_KHOI_DAU, MAU_MAX, SO_KHOI, type Ghe, type LoaiVp, type SuKien } from './loi'

// v4 (02/11 tối, thầy «Chốt hết build đi»): tháp · tường · tinh thể (đầu ảnh thêm 14 byte máu khối), ghế 11 byte (thêm khối đang ngắm), sự kiện kh / vo / tb / th;
// bỏ electron (byte `e` = số trúng tới cấp kế). Máy bản 3 vào phòng bản 4 ⇒ 4010, báo tải lại.
export const PHIEN_BAN = 4
export const GOI_Y_DINH = 1
export const GOI_ANH = 4
const HAI_PI = Math.PI * 2
const goc16 = (a: number) => Math.round(((((a % HAI_PI) + HAI_PI) % HAI_PI) / HAI_PI) * 65535) & 0xffff
const tuGoc16 = (n: number) => (n / 65535) * HAI_PI
/** Toạ độ × 50 (sân 1040 × 520 vừa 16 bit, sai số 0,02 đơn vị). */
const toaDo = (v: number) => Math.max(0, Math.min(65535, Math.round(v * 50)))
const so8 = (v: number) => Math.max(-100, Math.min(100, Math.round(v * 100)))
const LOAI_VP: readonly LoaiVp[] = ['e', 'xt', 'kh']

/** 8 byte: [1, seq, dx·100, dy·100, 0, 0, 0, 0] (giữ cỡ gói cũ; byte ngắm/bắn bỏ trống). */
export function maYDinh(seq: number, dx: number, dy: number): Uint8Array {
  const b = new Uint8Array(8), v = new DataView(b.buffer)
  b[0] = GOI_Y_DINH; b[1] = seq & 0xff
  v.setInt8(2, so8(dx)); v.setInt8(3, so8(dy))
  return b
}
export function docYDinh(buf: ArrayBuffer | Uint8Array): { seq: number; dx: number; dy: number } | null {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  if (b.length !== 8 || b[0] !== GOI_Y_DINH) return null
  const v = new DataView(b.buffer, b.byteOffset, 8)
  return { seq: b[1], dx: v.getInt8(2) / 100, dy: v.getInt8(3) / 100 }
}

export interface GheAnh { id: number; x: number; y: number; muc: number; mau: number; cap: number; cho: boolean; che: boolean; khien: number; vang: boolean; ha: number; e: number; mucK: number }
/** `buoc`: bước trận của phòng (uint16, quay vòng); `ti`: tỉ số hai phe [Bazơ, Axit]. */
export interface Anh { tick: number; ack: number; con: number; buoc: number; ti: [number, number]; ghe: GheAnh[]; su: SuKien[]; km: number[] }
const DAU = 10 + SO_KHOI
const CO_GHE = 11

const MA: Partial<Record<SuKien['t'], number>> = { ban: 1, trung: 2, chan: 3, ha: 4, hoi: 5, vp: 6, nhat: 7, len: 8, xich: 9, no: 10, kh: 11, vo: 12, tb: 13, th: 14 }
const DAI = [0, 9, 9, 4, 8, 2, 7, 3, 3, 4, 6, 8, 2, 4, 5]

/** Thân ảnh trận (ack khác nhau từng em, ghi bằng `datAck`). Sự kiện `tat` chỉ có ở máy em ⇒ bỏ. */
export function maAnh(tick: number, con: number, ghe: readonly Ghe[], suVao: readonly SuKien[], buoc = 0, ti: readonly [number, number] = [0, 0], km: readonly number[] = MAU_KHOI_DAU): Uint8Array {
  const su = suVao.filter((k) => MA[k.t]).slice(0, 255)
  let dai = DAU + ghe.length * CO_GHE
  for (const k of su) dai += DAI[MA[k.t]!]
  const b = new Uint8Array(dai), v = new DataView(b.buffer)
  b[0] = GOI_ANH; b[1] = tick & 0xff; b[3] = Math.max(0, Math.min(255, Math.ceil(con))); b[4] = ghe.length; b[5] = su.length
  v.setUint16(6, buoc & 0xffff, true); b[8] = Math.min(255, ti[0]); b[9] = Math.min(255, ti[1])
  for (let i = 0; i < SO_KHOI; i++) b[10 + i] = Math.max(0, Math.min(255, km[i] ?? 0))
  let o = DAU
  for (const g of ghe) {
    b[o] = g.id; v.setUint16(o + 1, toaDo(g.x), true); v.setUint16(o + 3, toaDo(g.y), true); b[o + 5] = g.muc
    b[o + 6] = (Math.max(0, Math.min(15, g.mau)) & 15) | ((g.cap & 7) << 4)
    b[o + 7] = (g.cho > 0 ? 1 : 0) | (g.che > 0 ? 2 : 0) | (g.vang ? 4 : 0) | ((g.khien & 3) << 3)
    b[o + 8] = Math.min(255, g.ha); b[o + 9] = Math.min(255, g.e); b[o + 10] = g.mucK ?? 0
    o += CO_GHE
  }
  for (const k of su) {
    const m = MA[k.t]!
    b[o] = m
    switch (k.t) {
      case 'ban': b[o + 1] = k.chu; v.setUint16(o + 2, toaDo(k.x), true); v.setUint16(o + 4, toaDo(k.y), true); v.setUint16(o + 6, goc16(k.ngam), true); b[o + 8] = k.cap; break
      case 'trung': b[o + 1] = k.ai; b[o + 2] = k.boi; v.setUint16(o + 3, toaDo(k.x), true); v.setUint16(o + 5, toaDo(k.y), true); b[o + 7] = Math.max(0, k.mau); b[o + 8] = k.phu; break
      case 'chan': b[o + 1] = k.ai; b[o + 2] = k.boi; b[o + 3] = k.khien; break
      case 'ha': b[o + 1] = k.ai; b[o + 2] = k.boi; v.setUint16(o + 3, toaDo(k.x), true); v.setUint16(o + 5, toaDo(k.y), true); b[o + 7] = (k.capCu & 7) | (Math.min(31, k.chuoi) << 3); break
      case 'hoi': b[o + 1] = k.ai; break
      case 'vp': b[o + 1] = k.id; b[o + 2] = LOAI_VP.indexOf(k.k); v.setUint16(o + 3, toaDo(k.x), true); v.setUint16(o + 5, toaDo(k.y), true); break
      case 'nhat': b[o + 1] = k.id; b[o + 2] = k.ai; break
      case 'len': b[o + 1] = k.ai; b[o + 2] = (k.cap & 7) | (k.xt ? 8 : 0); break
      case 'xich': b[o + 1] = k.chu; b[o + 2] = k.a; b[o + 3] = k.b; break
      case 'no': b[o + 1] = k.chu; v.setUint16(o + 2, toaDo(k.x), true); v.setUint16(o + 4, toaDo(k.y), true); break
      case 'kh': b[o + 1] = k.k; b[o + 2] = Math.max(0, k.mau); b[o + 3] = k.chan ? 1 : 0; v.setUint16(o + 4, toaDo(k.x), true); v.setUint16(o + 6, toaDo(k.y), true); break
      case 'vo': b[o + 1] = k.k; break
      case 'tb': b[o + 1] = k.k; v.setUint16(o + 2, goc16(k.ngam), true); break
      case 'th': v.setUint16(o + 1, toaDo(k.x), true); v.setUint16(o + 3, toaDo(k.y), true); break
    }
    o += DAI[m]
  }
  return b
}

/** Ghi seq ý định cuối phòng đã áp cho đúng em nhận gói (byte 2). */
export function datAck(b: Uint8Array, ack: number): Uint8Array { b[2] = ack & 0xff; return b }

export function docAnh(buf: ArrayBuffer | Uint8Array): Anh | null {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  if (b.length < DAU || b[0] !== GOI_ANH) return null
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const nGhe = b[4], nSu = b[5]
  let o = DAU
  if (b.length < o + nGhe * CO_GHE) return null
  const xy = (p: number) => [v.getUint16(p, true) / 50, v.getUint16(p + 2, true) / 50] as const
  const ghe: GheAnh[] = []
  for (let i = 0; i < nGhe; i++, o += CO_GHE) {
    const [x, y] = xy(o + 1), c = b[o + 7]
    ghe.push({ id: b[o], x, y, muc: b[o + 5], mau: Math.min(MAU_MAX, b[o + 6] & 15), cap: (b[o + 6] >> 4) & 7, cho: !!(c & 1), che: !!(c & 2), vang: !!(c & 4), khien: (c >> 3) & 3, ha: b[o + 8], e: b[o + 9], mucK: b[o + 10] })
  }
  const su: SuKien[] = []
  for (let i = 0; i < nSu; i++) {
    const m = b[o]
    if (!(m >= 1 && m <= 14) || o + DAI[m] > b.length) return null
    switch (m) {
      case 1: { const [x, y] = xy(o + 2); su.push({ t: 'ban', chu: b[o + 1], x, y, ngam: tuGoc16(v.getUint16(o + 6, true)), cap: b[o + 8] }); break }
      case 2: { const [x, y] = xy(o + 3); su.push({ t: 'trung', ai: b[o + 1], boi: b[o + 2], x, y, mau: b[o + 7], phu: b[o + 8] }); break }
      case 3: su.push({ t: 'chan', ai: b[o + 1], boi: b[o + 2], khien: b[o + 3] }); break
      case 4: { const [x, y] = xy(o + 3); su.push({ t: 'ha', ai: b[o + 1], boi: b[o + 2], x, y, capCu: b[o + 7] & 7, chuoi: b[o + 7] >> 3 }); break }
      case 5: su.push({ t: 'hoi', ai: b[o + 1] }); break
      case 6: { const [x, y] = xy(o + 3); su.push({ t: 'vp', id: b[o + 1], k: LOAI_VP[b[o + 2]] ?? 'e', x, y }); break }
      case 7: su.push({ t: 'nhat', id: b[o + 1], ai: b[o + 2], k: 'e', x: 0, y: 0 }); break
      case 8: su.push({ t: 'len', ai: b[o + 1], cap: b[o + 2] & 7, xt: !!(b[o + 2] & 8) }); break
      case 9: su.push({ t: 'xich', chu: b[o + 1], a: b[o + 2], b: b[o + 3] }); break
      case 10: { const [x, y] = xy(o + 2); su.push({ t: 'no', chu: b[o + 1], x, y }); break }
      case 11: { const [x, y] = xy(o + 4); su.push({ t: 'kh', k: b[o + 1], mau: b[o + 2], chan: !!b[o + 3], x, y }); break }
      case 12: su.push({ t: 'vo', k: b[o + 1] }); break
      case 13: su.push({ t: 'tb', k: b[o + 1], ngam: tuGoc16(v.getUint16(o + 2, true)) }); break
      case 14: { const [x, y] = xy(o + 1); su.push({ t: 'th', x, y }); break }
    }
    o += DAI[m]
  }
  return { tick: b[1], ack: b[2], con: b[3], buoc: v.getUint16(6, true), ti: [b[8], b[9]], ghe, su, km: Array.from(b.subarray(10, 10 + SO_KHOI)) }
}
