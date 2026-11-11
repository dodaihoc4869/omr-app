// XEM LẠI LIVE — MÁY EM: thứ nhớ TRÊN MÁY (đặc tả mục 3, 4.9). Không ghi D1: buổi đã mở («N buổi mới»), đoạn đã xem («Đã xem x/y đoạn»),
// danh sách lần tải gần nhất (mất mạng vẫn hiện). Mọi lần đọc / ghi bọc try/catch (iPhone chế độ riêng tư, máy hết chỗ ⇒ chỉ là không nhớ).
// Khoá theo EM (băm ngắn của token — không lưu token, không lưu số báo danh): hai em dùng chung máy không thấy danh sách của nhau.
import type { TraLiveDsHs } from '../../../lib/live/xem-lai-kieu'

const doc = <T>(k: string, macDinh: T): T => { try { const s = localStorage.getItem(k); return s ? (JSON.parse(s) as T) : macDinh } catch { return macDinh } }
const ghi = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* máy chặn lưu */ } }

/** Băm ngắn (djb2) của token ⇒ hậu tố khoá. */
export function khoaEm(token: string): string {
  let h = 5381
  for (let i = 0; i < token.length; i++) h = ((h << 5) + h + token.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
const K_MO = 'ddh.live.mo.', K_XEM = 'ddh.live.xem.', K_DS = 'ddh.live.ds.'
const TRAN_MO = 300

/** Các buổi em ĐÃ MỞ trang (để đếm «N buổi mới»). */
export function docDaMo(khoa: string): string[] { const v = doc<unknown>(K_MO + khoa, []); return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [] }
export function danhDauMo(khoa: string, id: string): void {
  const ds = docDaMo(khoa)
  if (ds.includes(id)) return
  ds.push(id)
  ghi(K_MO + khoa, ds.slice(-TRAN_MO))
}

type SoXem = Record<string, { ban: number; doan: number[] }>
const docSoXem = (khoa: string): SoXem => { const v = doc<unknown>(K_XEM + khoa, {}); return v && typeof v === 'object' && !Array.isArray(v) ? (v as SoXem) : {} }
/** Số thứ tự các đoạn em đã xem của một buổi. Buổi dựng lại (`ban` khác) ⇒ coi như chưa xem (đoạn đã đổi). */
export function docDaXem(khoa: string, id: string, ban: number): number[] {
  const m = docSoXem(khoa)[id]
  return m && m.ban === ban && Array.isArray(m.doan) ? m.doan.filter((x) => typeof x === 'number') : []
}
export function danhDauXem(khoa: string, id: string, ban: number, stt: number): number[] {
  const so = docSoXem(khoa), cu = so[id] && so[id]!.ban === ban ? so[id]!.doan : []
  if (cu.includes(stt)) return cu
  const moi = cu.concat(stt)
  so[id] = { ban, doan: moi }
  ghi(K_XEM + khoa, so)
  return moi
}
/** «Chưa xem» · «Đã xem 4/6 đoạn» · «Đã xem hết 4 đoạn». */
export function chuDaXem(daXem: number, soDoan: number): string {
  if (soDoan <= 0) return ''
  if (daXem <= 0) return 'Chưa xem'
  return daXem >= soDoan ? `Đã xem hết ${soDoan} đoạn` : `Đã xem ${daXem}/${soDoan} đoạn`
}

/** Danh sách lần tải gần nhất — cất KHÔNG kèm vé (vé có hạn; mất mạng thì cũng không phát được). */
export function luuDs(khoa: string, d: TraLiveDsHs): void {
  ghi(K_DS + khoa, { luc: Date.now(), buoi: d.buoi.map((b) => ({ ...b, ve: null })) })
}
export function docDsLuu(khoa: string): TraLiveDsHs | null {
  const v = doc<{ buoi?: unknown } | null>(K_DS + khoa, null)
  return v && Array.isArray(v.buoi) ? ({ buoi: v.buoi } as TraLiveDsHs) : null
}
