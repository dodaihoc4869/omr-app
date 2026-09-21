// SỨC KHOẺ MÁY CHỦ đo TRONG BỘ NHỚ (kế hoạch KE-HOACH-MAY-CHU-GIO-CAO-DIEM-2109.md, M3): thời gian trả lời từng lệnh trong cửa sổ 2 phút ⇒ p50/p95 ⇒ mức tốt / bận / nghẽn ⇒ HỆ SỐ NHỊP mà máy khách nhân vào nhịp hỏi nền của mình.
// KHÔNG chạm D1, không tốn truy vấn nào. Mỗi isolate của Worker có một bộ đo riêng (số đo của chính isolate đang trả lời) — máy khách nên lấy MAX của vài phản hồi gần nhất. Hợp đồng: docs/hop-dong-suc-khoe-may-chu-2109.md.
export type MucMay = 'tot' | 'ban' | 'nghen'
export interface DoLenh { duong: string; soLuot: number; p50Ms: number; p95Ms: number }
export interface SucKhoeMay { muc: MucMay; heSo: 1 | 2 | 4; p50Ms: number; p95Ms: number; soLuot: number; cuaSoGiay: number; theoLenh: DoLenh[] }

export const CUA_SO_MS = 120_000
export const TOI_DA_MAU = 800
/** p95 > 1,5 giây ⇒ bận (nhịp ×2); p95 > 3,5 giây ⇒ nghẽn (nhịp ×4). Dưới 20 mẫu thì coi là tốt (chưa đủ số liệu để kết tội). */
export const NGUONG_BAN_MS = 1500
export const NGUONG_NGHEN_MS = 3500
export const TOI_THIEU_MAU = 20
const DUONG_KHONG_DO = new Set(['/gv/suc-khoe-may-chu', '/khoe', '/do-tai'])

interface Mau { at: number; ms: number; duong: string }
let vong: Mau[] = []
let nho: { at: number; v: SucKhoeMay } | null = null

/** Tên lệnh để gom: bỏ query, gộp mọi mã dài/số đứng sau (`/phieu/<mã>` ⇒ `/phieu/*`); lệnh game giữ tên hành động (`/game-v2/answer`). */
export function tenLenh(pathname: string): string {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (/^\/(phieu|de|t|d)\//.test(p)) return `/${p.split('/')[1]}/*`
  return p.length > 60 ? p.slice(0, 60) : p
}

/** Ghi thời gian trả lời (ms) của một lượt. Lượt lệnh tự hỏi sức khoẻ và lệnh OPTIONS không được ghi (ở nơi gọi). */
export function ghiDoLenh(duong: string, ms: number, nowMs: number = Date.now()): void {
  if (DUONG_KHONG_DO.has(duong) || !Number.isFinite(ms) || ms < 0) return
  vong.push({ at: nowMs, ms, duong })
  nho = null
  if (vong.length > TOI_DA_MAU || (vong[0] && nowMs - vong[0].at > CUA_SO_MS * 2)) vong = vong.filter((x) => nowMs - x.at <= CUA_SO_MS).slice(-TOI_DA_MAU)
}
export function xoaSucKhoe(): void { vong = []; nho = null }

const phanVi = (da: number[], p: number): number => (da.length === 0 ? 0 : da[Math.min(da.length - 1, Math.floor(p * da.length))]!)

/** Sức khoẻ hiện tại (đệm 2 giây để mỗi phản hồi không phải sắp xếp lại). */
export function sucKhoeMay(nowMs: number = Date.now()): SucKhoeMay {
  if (nho && nowMs >= nho.at && nowMs - nho.at < 2000) return nho.v
  const mau = vong.filter((x) => nowMs - x.at >= 0 && nowMs - x.at <= CUA_SO_MS)
  const ms = mau.map((x) => x.ms).sort((a, b) => a - b)
  const p50Ms = Math.round(phanVi(ms, 0.5)), p95Ms = Math.round(phanVi(ms, 0.95))
  const muc: MucMay = mau.length < TOI_THIEU_MAU ? 'tot' : p95Ms > NGUONG_NGHEN_MS ? 'nghen' : p95Ms > NGUONG_BAN_MS ? 'ban' : 'tot'
  const theo = new Map<string, number[]>()
  for (const x of mau) theo.set(x.duong, [...(theo.get(x.duong) ?? []), x.ms])
  const theoLenh: DoLenh[] = [...theo.entries()].map(([duong, ds]) => { ds.sort((a, b) => a - b); return { duong, soLuot: ds.length, p50Ms: Math.round(phanVi(ds, 0.5)), p95Ms: Math.round(phanVi(ds, 0.95)) } })
    .sort((a, b) => b.soLuot - a.soLuot || a.duong.localeCompare(b.duong)).slice(0, 8)
  const v: SucKhoeMay = { muc, heSo: muc === 'nghen' ? 4 : muc === 'ban' ? 2 : 1, p50Ms, p95Ms, soLuot: mau.length, cuaSoGiay: CUA_SO_MS / 1000, theoLenh }
  nho = { at: nowMs, v }
  return v
}
/** Trường `nhipDeNghi` gắn vào MỌI phản hồi JSON: máy khách nhân `heSo` vào nhịp hỏi nền gốc của mình. */
export function nhipDeNghi(nowMs: number = Date.now()): { heSo: 1 | 2 | 4; muc: MucMay } {
  const s = sucKhoeMay(nowMs)
  return { heSo: s.heSo, muc: s.muc }
}
