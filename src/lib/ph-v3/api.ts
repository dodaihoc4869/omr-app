// Gọi ba lệnh chỉ-đọc mới của app phụ huynh (server/src/ph-bao-cao-moi.ts). Danh tính như src/lib/ph-moi/api.ts: mã liên kết riêng (`docPass()`) nếu có, không thì SBD trần.
// KHÔNG ném lỗi: mất mạng / máy chủ cũ chưa có lệnh (404) / lỗi ⇒ `{ kieu: 'loi', chu }` kèm câu cho người đọc; màn hiện "Thử lại".
import { layDiaChiMayChu } from '../dia-chi-may-chu'
import { docPass } from '../ph-token'
import { docBaoCaoCa, docHoc2, docLoiThay, type BaoCaoCa, type Hoc2, type NhanXetCa } from './du-lieu'

const HAN_MS = 20_000
export const CHU_MANG = 'Chưa kết nối được máy chủ. Anh/chị kiểm tra mạng rồi thử lại.'
export type KetQua<T> = { kieu: 'ok'; v: T } | { kieu: 'loi'; chu: string }

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
    return { status: r.status, j: (await r.json().catch(() => null)) as unknown }
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

async function tai<T>(duong: string, them: Record<string, unknown>, sbd: string, doc: (j: unknown) => T | null, chuChung: string): Promise<KetQua<T>> {
  const r = await goi(duong, them, sbd)
  if (!r) return { kieu: 'loi', chu: CHU_MANG }
  const v = doc(r.j)
  if (v !== null) return { kieu: 'ok', v }
  return { kieu: 'loi', chu: (r.status !== 404 && loiTuMayChu(r.j)) || chuChung }
}

export const taiBaoCaoCa = (sbd: string, maCa: string): Promise<KetQua<BaoCaoCa>> =>
  tai('/ph/bao-cao-ca', { maCa }, sbd, docBaoCaoCa, 'Chưa xem được báo cáo ca này. Anh/chị thử lại sau ít phút.')
export const taiLoiThay = (sbd: string): Promise<KetQua<NhanXetCa[]>> =>
  tai('/ph/loi-thay', {}, sbd, docLoiThay, 'Chưa xem được nhận xét của thầy. Anh/chị thử lại sau ít phút.')
export const taiHoc2 = (sbd: string): Promise<KetQua<Hoc2>> =>
  tai('/ph/hoc-2', {}, sbd, docHoc2, 'Chưa xem được tiến độ chiến dịch của con. Anh/chị thử lại sau ít phút.')
