// GÓI NHỊ PHÂN của «Đấu Nguyên Tử 2» — dùng chung máy em ↔ phòng đấu (server/src/dau-ion-phong.ts). Thuần, không DOM.
// PHIÊN BẢN GIAO THỨC = 3 (bản vẽ 3 đấu 3, 01/11: sân 1040 × 520 ⇒ toạ độ × 50; gói `vao` mang `v: 3`; bản khác ⇒ phòng đóng sạch mã 4010, máy cũ được báo tải lại).
// Máy em → phòng: Ý ĐỊNH 8 byte [1, seq, dx, dy, 0, 0, 0, 0] ~12 lần/giây — CHỈ hướng đi. Ngắm, bắn, Máu, cấp: phòng quyết.
// Phòng → máy em: ẢNH TRẬN MÃ 4 (bản cũ mã 3 ⇒ không đọc lẫn) 20 lần/giây = đầu 6 byte + 10 byte mỗi ghế + sự kiện mới.
// Đạn: một sự kiện MỖI LOẠT (vị trí, góc, cấp); máy em tự sinh 1–5 viên theo cấp và cho bay. Trúng hay không thì phòng báo.
import { MAU_MAX, type Ghe, type LoaiVp, type SuKien } from './loi'

export const PHIEN_BAN = 3
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

export interface GheAnh { id: number; x: number; y: number; muc: number; mau: number; cap: number; cho: boolean; che: boolean; khien: number; vang: boolean; ha: number; e: number }
export interface Anh { tick: number; ack: number; con: number; ghe: GheAnh[]; su: SuKien[] }

const MA: Partial<Record<SuKien['t'], number>> = { ban: 1, trung: 2, chan: 3, ha: 4, hoi: 5, vp: 6, nhat: 7, len: 8, xich: 9, no: 10 }
const DAI = [0, 9, 9, 4, 8, 2, 7, 3, 3, 4, 6]

/** Thân ảnh trận (ack khác nhau từng em, ghi bằng `datAck`). Sự kiện `tat` chỉ có ở máy em ⇒ bỏ. */
export function maAnh(tick: number, con: number, ghe: readonly Ghe[], suVao: readonly SuKien[]): Uint8Array {
  const su = suVao.filter((k) => MA[k.t]).slice(0, 255)
  let dai = 6 + ghe.length * 10
  for (const k of su) dai += DAI[MA[k.t]!]
  const b = new Uint8Array(dai), v = new DataView(b.buffer)
  b[0] = GOI_ANH; b[1] = tick & 0xff; b[3] = Math.max(0, Math.min(255, Math.ceil(con))); b[4] = ghe.length; b[5] = su.length
  let o = 6
  for (const g of ghe) {
    b[o] = g.id; v.setUint16(o + 1, toaDo(g.x), true); v.setUint16(o + 3, toaDo(g.y), true); b[o + 5] = g.muc
    b[o + 6] = (Math.max(0, Math.min(15, g.mau)) & 15) | ((g.cap & 7) << 4)
    b[o + 7] = (g.cho > 0 ? 1 : 0) | (g.che > 0 ? 2 : 0) | (g.vang ? 4 : 0) | ((g.khien & 3) << 3)
    b[o + 8] = Math.min(255, g.ha); b[o + 9] = Math.min(255, g.e)
    o += 10
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
    }
    o += DAI[m]
  }
  return b
}

/** Ghi seq ý định cuối phòng đã áp cho đúng em nhận gói (byte 2). */
export function datAck(b: Uint8Array, ack: number): Uint8Array { b[2] = ack & 0xff; return b }

export function docAnh(buf: ArrayBuffer | Uint8Array): Anh | null {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  if (b.length < 6 || b[0] !== GOI_ANH) return null
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const nGhe = b[4], nSu = b[5]
  let o = 6
  if (b.length < o + nGhe * 10) return null
  const xy = (p: number) => [v.getUint16(p, true) / 50, v.getUint16(p + 2, true) / 50] as const
  const ghe: GheAnh[] = []
  for (let i = 0; i < nGhe; i++, o += 10) {
    const [x, y] = xy(o + 1), c = b[o + 7]
    ghe.push({ id: b[o], x, y, muc: b[o + 5], mau: Math.min(MAU_MAX, b[o + 6] & 15), cap: (b[o + 6] >> 4) & 7, cho: !!(c & 1), che: !!(c & 2), vang: !!(c & 4), khien: (c >> 3) & 3, ha: b[o + 8], e: b[o + 9] })
  }
  const su: SuKien[] = []
  for (let i = 0; i < nSu; i++) {
    const m = b[o]
    if (!(m >= 1 && m <= 10) || o + DAI[m] > b.length) return null
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
    }
    o += DAI[m]
  }
  return { tick: b[1], ack: b[2], con: b[3], ghe, su }
}
