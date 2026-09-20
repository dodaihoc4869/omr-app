/** THÊM PHÚT CHO CẢ PHÒNG — lệnh THẦY `POST /ca/them-phut {maCa, phut}` (mã bí mật; hợp đồng docs/hop-dong-them-phut-2109.md, Code 3).
 *  Máy chủ cộng `phut` vào `thoi_gian_phut` của ca và vào hạn `het_gio_luc` của mọi lượt CHƯA nộp (chỉ cộng, trần 30 phút mỗi ca).
 *  Hàm này KHÔNG giả thành công: máy chủ chưa có lệnh (404), mất mạng, hay từ chối đều NÉM lỗi với câu nói thật — màn thầy hiện đúng câu đó. */
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

export const PHUT_MOI_LAN = 5

export interface KetQuaThemPhut {
  phut: number
  soLuotCong: number
  thoiGianPhut: number
  themPhutTong: number
}

const HAN_GIAY = 15

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
  } catch {
    throw new Error('Không nối được máy chủ — chưa cộng giờ cho em nào.')
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
  if (!res.ok || j.ok !== true) throw new Error(String(j.error || j.loi || 'Máy chủ không cho thêm phút.'))
  return {
    phut: Number(j.phut) || phut,
    soLuotCong: Number(j.soLuotCong) || 0,
    thoiGianPhut: Number(j.thoiGianPhut) || 0,
    themPhutTong: Number(j.themPhutTong) || 0,
  }
}

/** Câu báo kết quả — nói đúng số máy chủ trả. */
export function cauKetQuaThemPhut(k: KetQuaThemPhut): string {
  return k.soLuotCong > 0 ? `Đã cộng ${k.phut} phút cho ${k.soLuotCong} em đang làm` : `Đã cộng ${k.phut} phút cho ca — hiện chưa có em nào đang làm`
}

/** "784817" → "784 817" (tách nhóm 3 số từ trái, cho dễ đọc từ xa). */
export function dinhDangMa(ma: string): string {
  return String(ma).replace(/\s+/g, '').replace(/(\d{3})(?=\d)/g, '$1 ')
}
