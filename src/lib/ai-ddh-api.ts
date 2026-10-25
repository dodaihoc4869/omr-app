// BONG BÓNG A.I ĐỖ ĐẠI HỌC — lớp nối app học sinh (thầy 24/10; server/src/ai-ddh.ts). Ba lệnh token của em: mở tấm · tin mới · gửi tin.
// Không ném lỗi: trả { ok:false, chu } với MỘT câu nói thật. Chỉ mảnh nạp lười BongBongAiDdh nhập tệp này (ngoài precache).
import { layDiaChiMayChu } from './dia-chi-may-chu'

export interface TinAiDdh {
  id: string
  ben: 'em' | 'vp'
  chu: string
  anh: number
  nguon: string
  chiGoiY: boolean
  trangUrl: string
  boDe: { ten?: string; moTa?: string; link?: string; soDe?: number } | null
  trangThai: string
  /** Tin văn phòng: mã tin em nó trả lời (25/10) — có ⇒ tin em ấy đã xong. */
  traLoiCho: string
  luc: number
}
export interface MoAiDdh { bat: boolean; khoa: 'kiem_tra' | null; vanPhongTruc: boolean; conLuot: number; tranLuot: number; tin: TinAiDdh[] }
type KQ<T> = { ok: true; du: T } | { ok: false; chu: string; khoa?: string }

const HAN_MS = 25_000
async function goi(duong: string, than: Record<string, unknown>): Promise<KQ<Record<string, unknown>>> {
  let url = ''
  try { url = String(await layDiaChiMayChu()).replace(/\/+$/, '') } catch { return { ok: false, chu: 'Chưa đọc được cấu hình máy chủ.' } }
  if (!url) return { ok: false, chu: 'Chưa kết nối được máy chủ.' }
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_MS)
  try {
    const r = await fetch(url + duong, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(than), signal: dk.signal })
    if (r.status === 404) return { ok: false, chu: 'Máy chủ chưa có A.I Đỗ Đại Học — thầy cần cập nhật máy chủ.' }
    const j = (await r.json()) as Record<string, unknown>
    if (j.ok !== true) return { ok: false, chu: String(j.error || 'Máy chủ không nhận tin.'), ...(typeof j.khoa === 'string' ? { khoa: j.khoa } : {}) }
    return { ok: true, du: j }
  } catch (e) {
    return { ok: false, chu: (e as { name?: string })?.name === 'AbortError' ? 'Mạng chậm, em thử lại nhé.' : 'Mất mạng.' }
  } finally {
    clearTimeout(hen)
  }
}

const docTin = (x: unknown): TinAiDdh | null => {
  const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : null
  if (!o || typeof o.id !== 'string' || (o.ben !== 'em' && o.ben !== 'vp')) return null
  const bd = o.boDe && typeof o.boDe === 'object' ? (o.boDe as TinAiDdh['boDe']) : null
  return {
    id: o.id, ben: o.ben, chu: typeof o.chu === 'string' ? o.chu : '', anh: Number(o.anh) || 0, nguon: typeof o.nguon === 'string' ? o.nguon : '',
    chiGoiY: o.chiGoiY === true, trangUrl: typeof o.trangUrl === 'string' && /^https:\/\//.test(o.trangUrl) ? o.trangUrl : '', boDe: bd,
    trangThai: typeof o.trangThai === 'string' ? o.trangThai : '', traLoiCho: typeof o.traLoiCho === 'string' ? o.traLoiCho : '', luc: Number(o.luc) || 0,
  }
}
const dsTin = (x: unknown) => (Array.isArray(x) ? x.map(docTin).filter((t): t is TinAiDdh => !!t) : [])

export async function moAiDdh(token: string): Promise<KQ<MoAiDdh>> {
  const r = await goi('/hs/ai-ddh/mo', { token })
  if (!r.ok) return r
  const j = r.du
  return { ok: true, du: { bat: j.bat === true, khoa: j.khoa === 'kiem_tra' ? 'kiem_tra' : null, vanPhongTruc: j.vanPhongTruc === true, conLuot: Number(j.conLuot) || 0, tranLuot: Number(j.tranLuot) || 50, tin: dsTin(j.tin) } }
}
export async function tinMoiAiDdh(token: string, sau: number): Promise<KQ<{ vanPhongTruc: boolean; tin: TinAiDdh[] }>> {
  const r = await goi('/hs/ai-ddh/tin', { token, sau })
  return r.ok ? { ok: true, du: { vanPhongTruc: r.du.vanPhongTruc === true, tin: dsTin(r.du.tin) } } : r
}
/** Gửi một tin; `them` = trả lời máy chủ trả NGAY (chào hỏi, cảm ơn — không chờ văn phòng). */
export async function guiAiDdh(token: string, maTin: string, chu: string, anh: string[]): Promise<KQ<{ tin: TinAiDdh | null; them: TinAiDdh[] }>> {
  const r = await goi('/hs/ai-ddh/gui', { token, maTin, chu, anh })
  return r.ok ? { ok: true, du: { tin: docTin(r.du.tin), them: dsTin(r.du.them) } } : r
}

/** Gộp tin mới vào danh sách: tin đã có thì thay, tin mới thì nối; tin văn phòng trả lời tin nào ⇒ tin em ấy chuyển «xong» (tắt «Thầy đang soạn»). */
export function gopTin(cu: TinAiDdh[], moi: TinAiDdh[]): TinAiDdh[] {
  if (!moi.length) return cu
  const xong = new Set(moi.filter((x) => x.ben === 'vp' && x.traLoiCho).map((x) => x.traLoiCho))
  const theoId = new Map(moi.map((x) => [x.id, x]))
  const co = new Set(cu.map((x) => x.id))
  return [...cu.map((x) => theoId.get(x.id) ?? x), ...moi.filter((x) => !co.has(x.id))].map((x) => (x.ben === 'em' && xong.has(x.id) && x.trangThai !== 'xong' ? { ...x, trangThai: 'xong' } : x))
}

/** Mã tin do máy em tạo (bấm lặp / gửi lại khi có mạng ⇒ cùng một tin). */
export const taoMaTin = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Ảnh đề ⇒ JPEG ≤ 1600 px cạnh dài (base64, không tiền tố). Ảnh lỗi ⇒ null. */
export async function nenAnh(tep: File): Promise<string | null> {
  try {
    const bm = await createImageBitmap(tep)
    const ti = Math.min(1, 1600 / Math.max(bm.width, bm.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bm.width * ti); c.height = Math.round(bm.height * ti)
    c.getContext('2d')!.drawImage(bm, 0, 0, c.width, c.height)
    bm.close?.()
    return c.toDataURL('image/jpeg', 0.82).split(',')[1] ?? null
  } catch { return null }
}

// ── Cờ «lớp em có A.I Đỗ Đại Học» giữ trên máy 6 giờ: mở app KHÔNG gọi lệnh nào; chỉ hỏi lại khi máy rảnh và cờ đã cũ. ──
const KHOA_CO = 'omr-ai-ddh-co'
export function docCoBat(sbd: string): { bat: boolean; luc: number } | null {
  try { const o = JSON.parse(localStorage.getItem(KHOA_CO) || 'null'); return o && o.sbd === sbd ? { bat: o.bat === true, luc: Number(o.luc) || 0 } : null } catch { return null }
}
export function ghiCoBat(sbd: string, bat: boolean) {
  try { localStorage.setItem(KHOA_CO, JSON.stringify({ sbd, bat, luc: Date.now() })) } catch { /* máy chặn lưu */ }
}
export const CO_CU_MS = 6 * 3600_000
