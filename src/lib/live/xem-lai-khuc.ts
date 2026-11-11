// XEM LẠI LIVE — KHÚC TIẾNG 10 GIÂY (đặc tả docs/dac-ta-live-xem-lai-1011.md mục 4.2, 4.7). Thuần, không DOM. Máy ghi (máy thầy) ghi, máy chủ đọc.
// Một khúc = [4 byte 'DDK1'][u16 LE độ dài phần đầu][phần đầu JSON UTF-8][các khung MP3]. Khoá R2: `live/<buổi>/k/<phiên>-<stt>.bin`.
// Mọi mốc giờ trong khúc là mili-giây theo ĐỒNG HỒ MÁY THẦY (`Date.now()`); máy chủ đổi sang đồng hồ phòng bằng độ lệch đo qua tin `live-ghi`.
import { BYTE_MOI_KHUNG, MS_MOI_KHUNG } from './xem-lai-mp3'

export interface DauKhuc {
  v: 1
  /** Giờ máy thầy (ms) của MẪU ĐẦU trong khung MP3 đầu của khúc (đã trừ độ trễ bộ mã hoá). */
  t0: number
  /** Số khung MP3 trong khúc (mỗi khung 24 ms). */
  kh: number
  /** Giờ máy thầy (ms) của ô mức âm đầu tiên. */
  tm: number
  /** Mức âm mỗi 0,5 giây, 0..255 (`mucTuRms`). */
  muc: number[]
  /** Mốc giờ BẮT ĐẦU của các nét thầy viết: [mã nét, ms so với `t0` (có thể âm)]. */
  net: [string, number][]
}
export const MUC_MS = 500
/** Khúc dài nhất máy chủ nhận (10 giây ≈ 60 KB tiếng + phần đầu). */
export const KHUC_TOI_DA = 256 * 1024
const NET_TOI_DA = 120
const MA = [0x44, 0x44, 0x4b, 0x31]
const enc = new TextEncoder(), dec = new TextDecoder()

/** RMS 0..1 ⇒ 0..255 theo thang dB: 0 = từ −96 dBFS trở xuống, 255 = 0 dBFS. Ngưỡng lặng −45 dBFS ⇒ 135. */
export function mucTuRms(rms: number): number {
  if (!(rms > 0)) return 0
  const db = 20 * Math.log10(rms)
  return Math.max(0, Math.min(255, Math.round(((db + 96) / 96) * 255)))
}
export const mucTuDb = (db: number): number => Math.max(0, Math.min(255, Math.round(((db + 96) / 96) * 255)))

const b64 = (b: Uint8Array): string => { let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]!); return btoa(s) }
const tuB64 = (s: string): number[] => { try { const t = atob(s), ra: number[] = []; for (let i = 0; i < t.length; i++) ra.push(t.charCodeAt(i)); return ra } catch { return [] } }
const so = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : NaN)

/** Chuẩn hoá phần đầu (nhận cả dạng gọn `muc` là chuỗi base64). Sai dạng ⇒ null. */
export function chuanDauKhuc(v: unknown): DauKhuc | null {
  const x = (v ?? null) as Record<string, unknown> | null
  if (!x || typeof x !== 'object') return null
  const t0 = so(x.t0), kh = so(x.kh), tm = so(x.tm)
  if (!(t0 > 0) || !(kh >= 0) || kh > 5000) return null
  const muc = (typeof x.muc === 'string' ? tuB64(x.muc) : Array.isArray(x.muc) ? (x.muc as unknown[]).map((n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0)))) : []).slice(0, 400)
  const net: [string, number][] = []
  for (const m of Array.isArray(x.net) ? (x.net as unknown[]) : []) {
    if (net.length >= NET_TOI_DA) break
    if (Array.isArray(m) && typeof m[0] === 'string' && m[0].length <= 40 && Number.isFinite(Number(m[1]))) net.push([m[0], Math.round(Number(m[1]))])
  }
  return { v: 1, t0: Math.round(t0), kh: Math.round(kh), tm: Number.isFinite(tm) && tm > 0 ? Math.round(tm) : Math.round(t0), muc, net }
}
/** Phần đầu dạng GỌN (mức âm base64) — máy chủ cất vào siêu dữ liệu của tệp R2 để lúc chốt không phải mở từng khúc. `tranByte` ⇒ bớt mốc nét cho vừa. */
export function dauGon(d: DauKhuc, tranByte = 1800): string {
  let net = d.net
  for (;;) {
    const s = JSON.stringify({ t0: d.t0, kh: d.kh, tm: d.tm, muc: b64(Uint8Array.from(d.muc)), net })
    if (s.length <= tranByte || !net.length) return s
    net = net.slice(0, Math.floor(net.length / 2))
  }
}
export function docDauGon(s: unknown): DauKhuc | null {
  if (typeof s !== 'string' || !s) return null
  try { return chuanDauKhuc(JSON.parse(s)) } catch { return null }
}

/** Đóng một khúc. */
export function ghiKhuc(dau: DauKhuc, mp3: Uint8Array): Uint8Array<ArrayBuffer> {
  const d = enc.encode(JSON.stringify({ v: 1, t0: dau.t0, kh: dau.kh, tm: dau.tm, muc: b64(Uint8Array.from(dau.muc)), net: dau.net.slice(0, NET_TOI_DA) }))
  const ra = new Uint8Array(6 + d.length + mp3.length)
  ra.set(MA, 0); ra[4] = d.length & 255; ra[5] = d.length >> 8
  ra.set(d, 6); ra.set(mp3, 6 + d.length)
  return ra
}
/** Mở một khúc. Sai dấu / phần đầu hỏng / quá dài ⇒ null. `mp3` là khung nhìn trên `b` (không chép). */
export function docKhuc(b: Uint8Array): { dau: DauKhuc; mp3: Uint8Array } | null {
  if (b.length < 6 || b.length > KHUC_TOI_DA || b[0] !== MA[0] || b[1] !== MA[1] || b[2] !== MA[2] || b[3] !== MA[3]) return null
  const n = b[4]! | (b[5]! << 8)
  if (n < 2 || 6 + n > b.length) return null
  let dau: DauKhuc | null = null
  try { dau = chuanDauKhuc(JSON.parse(dec.decode(b.subarray(6, 6 + n)))) } catch { return null }
  if (!dau) return null
  return { dau, mp3: b.subarray(6 + n) }
}
/** Thời lượng khúc (ms) theo số khung. */
export const msKhuc = (d: Pick<DauKhuc, 'kh'>): number => d.kh * MS_MOI_KHUNG
export const byteTiengKhuc = (d: Pick<DauKhuc, 'kh'>): number => d.kh * BYTE_MOI_KHUNG
/** Mã phiên máy ghi (thầy tải lại trang ⇒ phiên mới): chữ thường + số, xếp theo thời gian. */
export const PHIEN_GHI = /^[a-z0-9]{1,16}$/
export const khoaKhuc = (buoi: string, phien: string, stt: number): string => `live/${buoi}/k/${phien}-${String(stt).padStart(5, '0')}.bin`
