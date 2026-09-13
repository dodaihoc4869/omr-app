// BÀI TẬP VỀ NHÀ — dựng mới trọn trên máy chủ mới, 0% Apps Script.
//
// Đặc tả: `claude/PHAN-CONG-GIAO-BTVN.md`. Khác bản đặc tả một điểm, và thầy đã
// chốt: bản này KHÔNG ghi sang Apps Script nữa. Bài giao, bài nộp, đếm đã
// nộp/chưa nộp — tất cả ở D1.
//
// BA LUẬT CHỐT CỨNG, cả ba đều chặn ở MÁY CHỦ chứ không chỉ ẩn nút ở máy em:
//   1. Chỉ em CÓ LƯỢT trong ca ấy mới được giao.
//   2. Lấy TẤT CẢ câu của tờ đề, đúng thứ tự kho — không xáo, không lọc.
//   3. Hạn 48 giờ tính từ lúc thầy bấm Giao, chung cho cả lớp. Quá hạn thì máy
//      chủ từ chối, vì giờ trên máy em chỉnh được.
import type { CauHinhMayChu } from './cau-hinh-may-chu'

export interface KetQuaGiaoBtvn {
  maBtvn: string
  soEm: number
  soCau: number
  hanNop: string
  /** Số ca THẬT SỰ được giao — ca chưa em nào vào thi bị bỏ qua. */
  soCa?: number
  /** Những ca bị bỏ qua vì chưa em nào vào thi. */
  caRong?: string[]
}

export interface DongTheoDoiBtvn {
  maBtvn: string
  maCa: string
  maDe: string
  soCau: number
  giaoLuc: string
  hanNop: string
  quaHan: boolean
  tong: number
  daNop: number
  chuaNop: { sbd: string; hoTen: string }[]
}

async function goi<T>(ch: CauHinhMayChu, duong: string, than: unknown, mat?: string): Promise<T | null> {
  if (!ch.URL) return null
  const bo = new AbortController()
  const hen = setTimeout(() => bo.abort(), (ch.HAN_GIAY || 20) * 1000)
  try {
    const dau: Record<string, string> = { 'content-type': 'application/json' }
    if (mat) dau['x-ma-bi-mat'] = mat
    const res = await fetch(`${ch.URL}${duong}`, { method: 'POST', headers: dau, body: JSON.stringify(than), signal: bo.signal })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(hen)
  }
}

/** THẦY GIAO BÀI cho một ca đã thi (hoặc cho từng học sinh cụ thể). Ném lỗi có câu chữ để màn hình hiện thẳng. */
export async function giaoBtvn(
  ch: CauHinhMayChu,
  mat: string,
  dsMaCa: string[],
  dsMaDe: string[],
  dsSbd?: string[],
): Promise<KetQuaGiaoBtvn> {
  if (dsMaCa.length === 0) throw new Error('Chưa tick ca nào')
  if (dsMaDe.length === 0) throw new Error('Chưa tick tờ đề nào')
  if (dsSbd && dsSbd.length === 0) throw new Error('Chưa tick học sinh nào')
  const r = await goi<{ ok?: boolean; error?: string } & KetQuaGiaoBtvn>(
    ch,
    '/btvn/giao',
    { dsMaCa, dsMaDe, dsSbd: dsSbd && dsSbd.length > 0 ? dsSbd : undefined },
    mat,
  )
  if (!r) throw new Error('Máy chủ không trả lời')
  if (!r.ok) throw new Error(r.error || 'Không giao được bài tập')
  return { maBtvn: r.maBtvn, soEm: r.soEm, soCau: r.soCau, hanNop: r.hanNop, soCa: r.soCa, caRong: r.caRong }
}

/** THẦY THEO DÕI đã nộp / chưa nộp. */
export async function theoDoiBtvn(ch: CauHinhMayChu, mat: string, maCa = ''): Promise<DongTheoDoiBtvn[]> {
  const r = await goi<{ ok?: boolean; ds?: DongTheoDoiBtvn[] }>(ch, '/btvn/theo-doi', { maCa }, mat)
  return r?.ok && Array.isArray(r.ds) ? r.ds : []
}

/** EM MỞ BÀI TẬP — đường CÔNG KHAI, em chỉ có mã ca và số báo danh.
 *
 * Trả về cả `lyDo` khi bị từ chối, để màn hình hiện đúng câu chữ đã chốt
 * ("Bạn đã quá hạn nộp BTVN") thay vì một câu lỗi chung chung. */
export async function btvnCuaEm(
  ch: CauHinhMayChu,
  maCa: string,
  sbd: string,
): Promise<{ ok: boolean; lyDo?: string; error?: string; maBtvn?: string; hanNop?: string; daNop?: boolean; soCau?: number; de?: unknown }> {
  const r = await goi<{ ok?: boolean; lyDo?: string; error?: string; maBtvn?: string; hanNop?: string; daNop?: boolean; soCau?: number; de?: unknown }>(
    ch,
    '/btvn/cua-em',
    { maCa, sbd },
  )
  if (!r) return { ok: false, lyDo: 'mang', error: 'Không nối được máy chủ' }
  return { ...r, ok: r.ok === true }
}

/** EM NỘP BÀI TẬP. */
export async function nopBtvn(
  ch: CauHinhMayChu,
  d: { maBtvn: string; sbd: string; dapAn: unknown; soDung: number; soCau: number },
): Promise<{ ok: boolean; lyDo?: string; error?: string; nopLuc?: string; daNhan?: boolean }> {
  const r = await goi<{ ok?: boolean; lyDo?: string; error?: string; nopLuc?: string; daNhan?: boolean }>(ch, '/btvn/nop', d)
  if (!r) return { ok: false, lyDo: 'mang', error: 'Không nối được máy chủ' }
  return { ...r, ok: r.ok === true }
}
