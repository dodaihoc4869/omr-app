// Gọi hai lệnh của app phụ huynh mới. Danh tính: mã liên kết riêng (`docPass()`) nếu có, KHÔNG có thì SBD trần của con (máy chủ nhận cả hai; token sai KHÔNG rơi xuống SBD trần — do máy chủ).
// KHÔNG ném lỗi. Máy chủ chưa có lệnh (404) / lỗi / mất mạng ⇒ `loi` kèm câu cho người đọc; màn hiện "Thử lại".
import { layDiaChiMayChu } from '../dia-chi-may-chu'
import { docPass } from '../ph-token'
import { docChiTietCau, docTatCaVeCon, type ChiTietCau, type PhMoi } from './du-lieu'

const HAN_MS = 20_000
export type PhanHoiTatCa = { kieu: 'ok'; pm: PhMoi } | { kieu: 'loi'; chu: string }
export type PhanHoiChiTiet = { kieu: 'ok'; ct: ChiTietCau } | { kieu: 'loi'; chu: string }
const CHU_MANG = 'Chưa kết nối được máy chủ. Anh/chị kiểm tra mạng rồi thử lại.'

async function goi(duong: string, them: Record<string, unknown>, sbd: string): Promise<{ status: number; j: unknown } | null> {
  const pass = docPass()
  const danhTinh = pass ? { pass } : sbd.trim() ? { sbd: sbd.trim() } : null
  if (!danhTinh) return null
  const url = await layDiaChiMayChu().catch(() => '')
  if (!url) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), HAN_MS)
  try {
    const r = await fetch(`${String(url).replace(/\/+$/, '')}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...danhTinh, ...them }), signal: bo.signal })
    const j = (await r.json().catch(() => null)) as unknown
    return { status: r.status, j }
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

const loiTuMayChu = (j: unknown): string => {
  const e = j && typeof j === 'object' && typeof (j as { error?: unknown }).error === 'string' ? String((j as { error: string }).error).replace(/\s+/g, ' ').trim() : ''
  return e && e.length <= 240 ? e : ''
}

export async function taiTatCaVeCon(sbd: string): Promise<PhanHoiTatCa> {
  const r = await goi('/ph/tat-ca-ve-con', {}, sbd)
  if (!r) return { kieu: 'loi', chu: CHU_MANG }
  const pm = docTatCaVeCon(r.j)
  if (pm) return { kieu: 'ok', pm }
  return { kieu: 'loi', chu: (r.status !== 404 && loiTuMayChu(r.j)) || 'Chưa xem được dữ liệu của con lúc này. Anh/chị thử lại sau ít phút.' }
}

export async function taiChiTietCau(sbd: string, qid: string): Promise<PhanHoiChiTiet> {
  const r = await goi('/ph/chi-tiet-cau-ve-con', { qid }, sbd)
  if (!r) return { kieu: 'loi', chu: CHU_MANG }
  const ct = docChiTietCau(r.j)
  return ct ? { kieu: 'ok', ct } : { kieu: 'loi', chu: 'Chưa xem được lời giải của câu này. Anh/chị thử lại sau ít phút.' }
}
