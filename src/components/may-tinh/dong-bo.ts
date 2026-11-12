// MÁY TÍNH FX4869 — gói tin đồng bộ thầy → em qua kênh lớp (`k: 'mt'`). Thầy gửi NGUYÊN thứ đang hiện (`ManHinh`), máy em chỉ vẽ lại.
import type { ManHinh } from '../../lib/may-tinh/may'

export interface TinMayTinh {
  /** false = thầy vừa ẩn máy tính */ mo: boolean
  /** tâm máy tính theo phần của màn thầy (0–1) */ x?: number; y?: number
  /** bề ngang máy tính theo phần bề ngang màn thầy */ w?: number
  mh?: ManHinh
  /** phím thầy vừa bấm + số thứ tự lần bấm (để máy em nháy viền đúng một lần) */ p?: string; n?: number
}
/** Thầy im quá lâu (mất nối, đóng trang) ⇒ máy em tự cất máy tính. Thầy gửi nhắc lại mỗi NHAC_MS. */
export const NHAC_MS = 4000, HET_HAN_MS = 13000
const so = (v: unknown, tu: number, den: number): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? Math.min(den, Math.max(tu, v)) : undefined)
const chuoi = (v: unknown, dai: number): string => (typeof v === 'string' ? v.slice(0, dai) : '')
const mang = (v: unknown, n: number, dai: number): string[] => (Array.isArray(v) ? v.slice(0, n).map((x) => chuoi(x, dai)) : [])
/** Tin từ mạng ⇒ gói sạch (sai dạng ⇒ null). Mọi chuỗi cắt ngắn, mọi số kẹp khoảng. */
export function docTin(x: unknown): TinMayTinh | null {
  if (!x || typeof x !== 'object') return null
  const j = x as Record<string, unknown>
  if (j.mo !== true) return j.mo === false ? { mo: false } : null
  const m = j.mh as Record<string, unknown> | null | undefined
  if (!m || typeof m !== 'object') return null
  const k = m.kq as Record<string, unknown> | null | undefined
  const kq: ManHinh['kq'] = !k || typeof k !== 'object' ? null : k.kieu === 'ps' ? { kieu: 'ps', am: k.am === true, nguyen: chuoi(k.nguyen, 12), tu: chuoi(k.tu, 12), mau: chuoi(k.mau, 12) } : { kieu: 'so', chu: chuoi(k.chu, 60) }
  return {
    mo: true, x: so(j.x, 0, 1) ?? 0.8, y: so(j.y, 0, 1) ?? 0.5, w: so(j.w, 0.05, 1) ?? 0.25, p: chuoi(j.p, 8), n: so(j.n, 0, 1e9) ?? 0,
    mh: { den: mang(m.den, 10, 8), phai: chuoi(m.phai, 24), kieu: m.kieu === 'ds' ? 'ds' : 'tinh', nhan: chuoi(m.nhan, 16), bt: mang(m.bt, 140, 6), ct: so(m.ct, -1, 200) ?? -1, kq, loi: m.loi === 'toan' || m.loi === 'cu-phap' ? m.loi : '', tieuDe: chuoi(m.tieuDe, 40), ds: mang(m.ds, 8, 30) },
  }
}
