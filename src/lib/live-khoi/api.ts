// LIVE THEO KHỐI — lệnh máy chủ (server/src/live-khoi.ts). Thầy: `/gv/bpu/khoi-*` (sau mã bí mật); em: `/hs/bpu/khoi-*` (token em).
import { goiLenh, type KetQuaLenh } from '../goi-lenh-thay'
import { layDiaChiMayChu } from '../dia-chi-may-chu'
import type { KhoiLive, LichLive, LiveCuaEm } from './kieu'

const CHUA_CO = 'Máy chủ chưa có Live theo khối.'
const KHOI = new Set([10, 11, 12])
function docLich(v: unknown): LichLive | null {
  const o = (v ?? {}) as Record<string, unknown>, khoi = Number(o.khoi), batDau = Number(o.batDau), tt = String(o.trangThai ?? '')
  if (typeof o.id !== 'string' || !o.id || !KHOI.has(khoi) || !Number.isFinite(batDau) || !['hen', 'cho', 'dang', 'xong'].includes(tt)) return null
  return { id: o.id, khoi: khoi as KhoiLive, batDau, ten: typeof o.ten === 'string' ? o.ten : '', trangThai: tt as LichLive['trangThai'], ...(typeof o.buoiId === 'string' && o.buoiId ? { buoiId: o.buoiId } : {}) }
}
export interface DsLichLive { lich: LichLive[]; /** Số em đang học của từng khối. */ soEm: Record<KhoiLive, number> }
const docDs = (du: Record<string, unknown>): DsLichLive => {
  const s = (du.soEm ?? {}) as Record<string, unknown>
  return { lich: (Array.isArray(du.lich) ? du.lich : []).map(docLich).filter((x): x is LichLive => !!x), soEm: { 10: Number(s['10']) || 0, 11: Number(s['11']) || 0, 12: Number(s['12']) || 0 } }
}
const lenhDs = async (duong: string, body: unknown): Promise<KetQuaLenh<DsLichLive>> => { const r = await goiLenh(duong, body, CHUA_CO); return r.ok ? { ok: true, du: docDs(r.du) } : r }
/** Lịch chưa xong (hẹn, phòng chờ, đang live) + sĩ số từng khối. */
export const taiLichLive = () => lenhDs('/gv/bpu/khoi-ds', {})
export const henLichLive = (o: { khoi: KhoiLive; batDau: number; ten: string }) => lenhDs('/gv/bpu/khoi-hen', o)
export const suaLichLive = (id: string, o: { khoi: KhoiLive; batDau: number; ten: string }) => lenhDs('/gv/bpu/khoi-hen', { id, ...o })
export const huyLichLive = (id: string) => lenhDs('/gv/bpu/khoi-huy', { id })
/** Mở PHÒNG CHỜ cho khối (mở ngay, hoặc mở buổi đã hẹn khi có `id`). Máy chủ tự mở buổi học của khối và trả `buoiId` để bảng nối phòng. */
export async function moLiveKhoi(o: { khoi: KhoiLive; id?: string; ten?: string }): Promise<KetQuaLenh<{ lich: LichLive; buoiId: string; ma: string }>> {
  let r = await goiLenh('/gv/bpu/khoi-mo', o, CHUA_CO)
  // Máy chủ trả lời chậm (thầy 12/11): lệnh có thể ĐÃ chạy xong phía máy chủ ⇒ hỏi lại lịch; phòng của khối đã mở thì vào lại ĐÚNG phòng đó (không mở phòng thứ hai).
  if (!r.ok && r.loai === 'cham') {
    const d = await taiLichLive(), l = d.ok ? d.du.lich.find((x) => x.khoi === o.khoi && (x.trangThai === 'cho' || x.trangThai === 'dang') && x.buoiId) : undefined
    if (l) r = await goiLenh('/gv/bpu/khoi-mo', { khoi: o.khoi, id: l.id }, CHUA_CO)
  }
  if (!r.ok) return r
  const lich = docLich(r.du.lich)
  if (!lich || typeof r.du.buoiId !== 'string') return { ok: false, loai: 'khong_doc_duoc', chu: 'Máy chủ trả lời lạ. Thầy thử lại.' }
  return { ok: true, du: { lich, buoiId: r.du.buoiId, ma: typeof r.du.ma === 'string' ? r.du.ma : '' } }
}
/** Thầy bấm «Bắt đầu live» / «Kết thúc live». */
export const batDauLiveKhoi = (id: string) => lenhDs('/gv/bpu/khoi-bat-dau', { id })
export const xongLiveKhoi = (id: string) => lenhDs('/gv/bpu/khoi-xong', { id })

async function goiEm(duong: string, token: string): Promise<Record<string, unknown>> {
  const c = new AbortController(), hen = setTimeout(() => c.abort(), 15_000)
  try {
    const goc = await layDiaChiMayChu('')
    const r = await fetch(`${goc}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }), signal: c.signal })
    const j = (await r.json().catch(() => null)) as Record<string, unknown> | null
    return j && typeof j === 'object' ? j : { ok: false }
  } catch { return { ok: false, mang: true } } finally { clearTimeout(hen) }
}
/** Thẻ Live trang chủ em. Lỗi / máy chủ cũ ⇒ `khong`. */
export async function liveCuaEm(token: string): Promise<LiveCuaEm> {
  const j = await goiEm('/hs/bpu/khoi-cua-em', token), tt = String(j.trangThai ?? '')
  if (j.ok !== true || !['hen', 'cho', 'dang'].includes(tt)) return { trangThai: 'khong' }
  return { trangThai: tt as LiveCuaEm['trangThai'], ...(KHOI.has(Number(j.khoi)) ? { khoi: Number(j.khoi) as KhoiLive } : {}), ...(typeof j.ten === 'string' ? { ten: j.ten } : {}), ...(Number.isFinite(Number(j.batDau)) ? { batDau: Number(j.batDau) } : {}) }
}
/** Em bấm «Tham gia»: máy chủ kiểm khối, ghi em vào buổi, trả `buoiId` để mở màn phòng. */
export async function vaoLiveKhoi(token: string): Promise<{ ok: true; buoiId: string } | { ok: false; chu: string }> {
  const j = await goiEm('/hs/bpu/khoi-vao', token)
  if (j.ok === true && typeof j.buoiId === 'string' && j.buoiId) return { ok: true, buoiId: j.buoiId }
  return { ok: false, chu: typeof j.error === 'string' && j.error ? j.error : j.mang ? 'Chưa kết nối được máy chủ. Em kiểm tra mạng rồi thử lại.' : 'Chưa vào được live. Em thử lại.' }
}
