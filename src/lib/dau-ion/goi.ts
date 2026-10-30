// GÓI NHỊ PHÂN của «Đấu Nguyên Tử» — dùng chung máy em ↔ phòng đấu (server/src/dau-ion-phong.ts). Thuần, không DOM.
// Máy em → phòng: Ý ĐỊNH 8 byte (hướng đi, hướng ngắm, giữ bắn) ~12 lần/giây. Máy em KHÔNG gửi vị trí, Máu hay trúng/trượt — phòng quyết.
// Phòng → máy em: ẢNH TRẬN 20 lần/giây = đầu 6 byte + 9 byte mỗi ghế + sự kiện mới (đạn bắn ra, trúng, hạ…) ⇒ trận 1–1 ≈ 30–60 byte/gói.
import type { Ghe, LoaiVatPham, SuKien, YDinh } from './loi'

export const GOI_Y_DINH = 1
export const GOI_ANH = 2
const HAI_PI = Math.PI * 2
const goc16 = (a: number) => Math.round(((((a % HAI_PI) + HAI_PI) % HAI_PI) / HAI_PI) * 65535) & 0xffff
const tuGoc16 = (n: number) => (n / 65535) * HAI_PI
const toaDo = (v: number) => Math.max(0, Math.min(65535, Math.round(v * 100)))

/** 8 byte: [1, seq, dx, dy, ngắm(2), bắn, 0]. */
export function maYDinh(seq: number, yd: YDinh): Uint8Array {
  const b = new Uint8Array(8), v = new DataView(b.buffer)
  b[0] = GOI_Y_DINH; b[1] = seq & 0xff
  v.setInt8(2, Math.max(-100, Math.min(100, Math.round(yd.dx * 100))))
  v.setInt8(3, Math.max(-100, Math.min(100, Math.round(yd.dy * 100))))
  v.setUint16(4, goc16(yd.ngam), true)
  b[6] = yd.ban ? 1 : 0
  return b
}

export function docYDinh(buf: ArrayBuffer | Uint8Array): { seq: number; yd: YDinh } | null {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  if (b.length !== 8 || b[0] !== GOI_Y_DINH) return null
  const v = new DataView(b.buffer, b.byteOffset, 8)
  return { seq: b[1], yd: { dx: v.getInt8(2) / 100, dy: v.getInt8(3) / 100, ngam: tuGoc16(v.getUint16(4, true)), ban: b[6] === 1 } }
}

export interface GheAnh { id: number; x: number; y: number; ngam: number; mau: number; khien: boolean; xucTac: boolean; cho: boolean; giap: boolean; ha: number; biHa: number }
export interface Anh { tick: number; ack: number; con: number; ghe: GheAnh[]; su: SuKien[] }

const DAI_SU: Record<SuKien['t'], number> = { ban: 10, trung: 10, chan: 7, ha: 7, hoi: 2, vp: 6, nhat: 3 }
const MA_SU: Record<SuKien['t'], number> = { ban: 1, trung: 2, chan: 3, ha: 4, hoi: 5, vp: 6, nhat: 7 }

/** Thân ảnh trận (không có ack — ack khác nhau từng em, ghi bằng `datAck`). */
export function maAnh(tick: number, con: number, ghe: readonly Ghe[], su: readonly SuKien[]): Uint8Array {
  const s = su.slice(0, 255)
  let dai = 6 + ghe.length * 9
  for (const k of s) dai += DAI_SU[k.t]
  const b = new Uint8Array(dai), v = new DataView(b.buffer)
  b[0] = GOI_ANH; b[1] = tick & 0xff; b[2] = 0; b[3] = Math.max(0, Math.min(255, Math.ceil(con))); b[4] = ghe.length; b[5] = s.length
  let o = 6
  for (const g of ghe) {
    b[o] = g.id; v.setUint16(o + 1, toaDo(g.x), true); v.setUint16(o + 3, toaDo(g.y), true); b[o + 5] = goc16(g.ngam) >> 8
    b[o + 6] = (Math.max(0, g.mau) & 3) | (g.khien > 0 ? 4 : 0) | (g.xucTac > 0 ? 8 : 0) | (g.cho > 0 ? 16 : 0) | (g.giap ? 32 : 0)
    b[o + 7] = Math.min(255, g.ha); b[o + 8] = Math.min(255, g.biHa)
    o += 9
  }
  for (const k of s) {
    b[o] = MA_SU[k.t]
    switch (k.t) {
      case 'ban': v.setUint16(o + 1, k.id, true); b[o + 3] = k.chu; v.setUint16(o + 4, toaDo(k.x), true); v.setUint16(o + 6, toaDo(k.y), true); v.setUint16(o + 8, goc16(k.ngam), true); break
      case 'trung': v.setUint16(o + 1, k.id, true); b[o + 3] = k.ai; b[o + 4] = k.boi; b[o + 5] = Math.max(0, k.mau); v.setUint16(o + 6, toaDo(k.x), true); v.setUint16(o + 8, toaDo(k.y), true); break
      case 'chan': v.setUint16(o + 1, k.id, true); v.setUint16(o + 3, toaDo(k.x), true); v.setUint16(o + 5, toaDo(k.y), true); break
      case 'ha': b[o + 1] = k.ai; b[o + 2] = k.boi; v.setUint16(o + 3, toaDo(k.x), true); v.setUint16(o + 5, toaDo(k.y), true); break
      case 'hoi': b[o + 1] = k.ai; break
      case 'vp': b[o + 1] = k.loai; v.setUint16(o + 2, toaDo(k.x), true); v.setUint16(o + 4, toaDo(k.y), true); break
      case 'nhat': b[o + 1] = k.ai; b[o + 2] = k.loai; break
    }
    o += DAI_SU[k.t]
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
  if (b.length < o + nGhe * 9) return null
  const ghe: GheAnh[] = []
  for (let i = 0; i < nGhe; i++, o += 9) {
    const co = b[o + 6]
    ghe.push({ id: b[o], x: v.getUint16(o + 1, true) / 100, y: v.getUint16(o + 3, true) / 100, ngam: tuGoc16(b[o + 5] << 8), mau: co & 3, khien: !!(co & 4), xucTac: !!(co & 8), cho: !!(co & 16), giap: !!(co & 32), ha: b[o + 7], biHa: b[o + 8] })
  }
  const su: SuKien[] = []
  const xy = (p: number) => [v.getUint16(p, true) / 100, v.getUint16(p + 2, true) / 100] as const
  for (let i = 0; i < nSu && o < b.length; i++) {
    const m = b[o]
    if (m === 1) { const [x, y] = xy(o + 4); su.push({ t: 'ban', id: v.getUint16(o + 1, true), chu: b[o + 3], x, y, ngam: tuGoc16(v.getUint16(o + 8, true)) }); o += 10 }
    else if (m === 2) { const [x, y] = xy(o + 6); su.push({ t: 'trung', id: v.getUint16(o + 1, true), ai: b[o + 3], boi: b[o + 4], mau: b[o + 5], x, y }); o += 10 }
    else if (m === 3) { const [x, y] = xy(o + 3); su.push({ t: 'chan', id: v.getUint16(o + 1, true), x, y }); o += 7 }
    else if (m === 4) { const [x, y] = xy(o + 3); su.push({ t: 'ha', ai: b[o + 1], boi: b[o + 2], x, y }); o += 7 }
    else if (m === 5) { su.push({ t: 'hoi', ai: b[o + 1] }); o += 2 }
    else if (m === 6) { const [x, y] = xy(o + 2); su.push({ t: 'vp', loai: (b[o + 1] ? 1 : 0) as LoaiVatPham, x, y }); o += 6 }
    else if (m === 7) { su.push({ t: 'nhat', ai: b[o + 1], loai: (b[o + 2] ? 1 : 0) as LoaiVatPham }); o += 3 }
    else return null
  }
  return { tick: b[1], ack: b[2], con: b[3], ghe, su }
}
