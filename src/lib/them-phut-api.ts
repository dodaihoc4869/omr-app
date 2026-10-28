/** THÊM PHÚT CHO CẢ PHÒNG — lệnh THẦY `POST /ca/them-phut {maCa, phut}` (mã bí mật; hợp đồng docs/hop-dong-them-phut-2109.md, Code 3).
 *  Máy chủ cộng `phut` vào `thoi_gian_phut` của ca và vào hạn `het_gio_luc` của mọi lượt CHƯA nộp (chỉ cộng, trần 30 phút mỗi ca).
 *  Hàm này KHÔNG giả thành công: máy chủ chưa có lệnh (404), mất mạng, hay từ chối đều NÉM lỗi với câu nói thật — màn thầy hiện đúng câu đó. */
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

export const PHUT_MOI_LAN = 5

export interface KetQuaThemPhut {
  phut: number
  /** Lượt ĐANG LÀM được cộng giờ. */
  soLuotCong: number
  /** Lượt đang bị KHOÁ cũng được cộng (mở khoá sau đó không thiệt giờ). Máy chủ cũ chưa trả ⇒ 0. */
  soLuotKhoaCong: number
  thoiGianPhut: number
  themPhutTong: number
}

const HAN_GIAY = 15
/** Quá hạn chờ / đứt mạng giữa chừng: CHƯA CHẮC đã cộng. */
export const TRA_LOI_CHAM = 'Máy chủ trả lời chậm — CHƯA CHẮC đã cộng, bấm Làm mới để xem giờ rồi hãy quyết định bấm lại.'
export const MAT_MANG = 'Không nối được máy chủ — CHƯA CHẮC đã cộng, bấm Làm mới để xem giờ rồi hãy quyết định bấm lại.'

export async function themPhutCa(maCa: string, phut: number = PHUT_MOI_LAN): Promise<KetQuaThemPhut> {
  const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
  if (!ch.URL) throw new Error('Chưa kết nối được máy chủ — chưa cộng giờ cho em nào.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${ch.URL}/ca/them-phut`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' },
      body: JSON.stringify({ maCa, phut }),
      signal: dk.signal,
    })
  } catch (e) {
    // Yêu cầu có thể ĐÃ tới máy chủ trước khi bị huỷ/đứt — nói "chưa cộng" mà thầy bấm lại là thành 10 phút. Chỉ 404 (máy chủ không có lệnh) mới chắc là chưa cộng.
    if ((e as { name?: string })?.name === 'AbortError') throw new Error(TRA_LOI_CHAM)
    throw new Error(MAT_MANG)
  } finally {
    clearTimeout(hen)
  }
  if (res.status === 404) throw new Error('Máy chủ chưa có lệnh Thêm phút — chưa cộng giờ cho em nào.')
  let j: Record<string, unknown> = {}
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    throw new Error('Máy chủ trả lời không đọc được — chưa chắc đã cộng giờ, hãy bấm Làm mới để xem giờ hiện tại.')
  }
  if (!res.ok || j.ok !== true) {
    const goc = String(j.error || j.loi || 'Máy chủ không cho thêm phút.')
    // `thuLai`: có lệnh khác chen vào giữa lúc đọc và ghi — máy chủ KHÔNG đổi gì; nói rõ để thầy bấm lại được mà không lo cộng đôi.
    throw new Error(j.thuLai === true && !/bấm lại|thử lại/i.test(goc) ? `${goc} Chưa cộng gì — bấm Thêm ${phut} phút lần nữa.` : goc)
  }
  return {
    phut: Number(j.phut) || phut,
    soLuotCong: Number(j.soLuotCong) || 0,
    soLuotKhoaCong: Number(j.soLuotKhoaCong) || 0,
    thoiGianPhut: Number(j.thoiGianPhut) || 0,
    themPhutTong: Number(j.themPhutTong) || 0,
  }
}

/** Câu báo kết quả — nói đúng số máy chủ trả. */
export function cauKetQuaThemPhut(k: KetQuaThemPhut): string {
  const khoa = k.soLuotKhoaCong > 0 ? `${k.soLuotKhoaCong} em đang bị khoá` : ''
  if (k.soLuotCong > 0) return `Đã cộng ${k.phut} phút cho ${k.soLuotCong} em đang làm${khoa ? ` và ${khoa}` : ''}`
  return `Đã cộng ${k.phut} phút cho ca — hiện chưa có em nào đang làm${khoa ? `; ${khoa} cũng được cộng` : ''}`
}

/** "784817" → "784 817" (tách nhóm 3 số từ trái, cho dễ đọc từ xa). */
export function dinhDangMa(ma: string): string {
  return String(ma).replace(/\s+/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')
}
