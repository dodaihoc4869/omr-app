/** GỌI LỆNH THẦY dùng chung (Bộ não `/ai/*`, Hôm nay v2 `/gv/*`…): POST + mã bí mật, KHÔNG ném lỗi — trả `KetQuaLenh` với MỘT câu nói thật vì sao không có số (màn hiện đúng câu ấy).
 *  404 ⇒ "máy chủ chưa có lệnh" (câu do nơi gọi đặt); quá hạn chờ ⇒ 'cham'; mất mạng ⇒ 'mang'; máy chủ từ chối ⇒ giữ NGUYÊN lời của máy chủ. */
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

/** Kết quả một lệnh: hoặc có số thật, hoặc MỘT câu nói thật vì sao không có (màn hiện đúng câu ấy). */
export type KetQuaLenh<T> = { ok: true; du: T } | { ok: false; loai: 'chua_co_lenh' | 'mang' | 'cham' | 'tu_choi' | 'khong_doc_duoc'; chu: string }

const HAN_GIAY = 20

export type Thoat = { ok: false; loai: 'chua_co_lenh' | 'mang' | 'cham' | 'tu_choi' | 'khong_doc_duoc'; chu: string }
const thoat = (loai: Thoat['loai'], chu: string): Thoat => ({ ok: false, loai, chu })

/** Gọi một lệnh thầy `/ai/...` (POST + mã bí mật). Không ném lỗi: trả `KetQuaLenh`. `chuKhongCoLenh` là câu nói thật khi máy chủ chưa có lệnh (404). */
export async function goiLenh(duong: string, body: unknown, chuKhongCoLenh: string, chuCham = 'Máy chủ trả lời chậm — thử lại sau ít phút.'): Promise<KetQuaLenh<Record<string, unknown>>> {
  let ch: { URL?: string }
  let mat: string | null
  try {
    ;[ch, mat] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
  } catch {
    return thoat('mang', 'Chưa đọc được cấu hình máy chủ.')
  }
  if (!ch.URL) return thoat('mang', 'Chưa kết nối được máy chủ.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ma-bi-mat': mat || '' }, body: JSON.stringify(body ?? {}), signal: dk.signal })
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return thoat('cham', chuCham)
    return thoat('mang', 'Không nối được máy chủ.')
  } finally {
    clearTimeout(hen)
  }
  if (res.status === 404) return thoat('chua_co_lenh', chuKhongCoLenh)
  let j: Record<string, unknown>
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    return thoat('khong_doc_duoc', 'Máy chủ trả lời không đọc được.')
  }
  if (!res.ok || j.ok !== true) return thoat('tu_choi', String(j.error || j.loi || 'Máy chủ không đồng ý lệnh này.'))
  return { ok: true, du: j }
}
