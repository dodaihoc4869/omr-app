/** ĐỔI TÊN MỘT HỌC SINH — lệnh THẦY `POST /hoc-sinh/doi-ten {sbd, hoTen}` (mã bí mật; hợp đồng docs/hop-dong-doi-ten-hoc-sinh-2109.md, Code 3).
 *  Máy chủ đổi CHỈ cột tên ở danh_sach · hoc_sinh · luot · btvn_em · phong_cho theo đúng SBD (không đụng phiếu/nhật ký đã phát, điểm, lớp, năm sinh, mật khẩu).
 *  Máy chủ chưa có lệnh / mất mạng / từ chối ⇒ NÉM lỗi với câu nói thật; màn KHÔNG tự đổi riêng ở máy thầy (tránh hai nơi lệch tên). */
import { layCauHinhMayChu } from './may-chu-moi'
import { loadTeacherSecret } from './exam-db'

export const TEN_TOI_THIEU = 2
export const TEN_TOI_DA = 60

const KY_TU_DIEU_KHIEN = /[\x00-\x1f\x7f]/

/** Cùng luật chuẩn hoá với máy chủ: cắt khoảng trắng đầu/cuối, gộp khoảng trắng liền nhau, 2..60 ký tự, không ký tự điều khiển. */
export function chuanHoaTen(vao: string): { ok: true; ten: string } | { ok: false; loi: string } {
  if (KY_TU_DIEU_KHIEN.test(vao.replace(/\s/g, ' '))) return { ok: false, loi: 'Tên có ký tự không hợp lệ.' }
  const ten = vao.replace(/\s+/g, ' ').trim()
  if (ten.length < TEN_TOI_THIEU || ten.length > TEN_TOI_DA) return { ok: false, loi: `Tên phải từ ${TEN_TOI_THIEU} đến ${TEN_TOI_DA} ký tự.` }
  return { ok: true, ten }
}

export interface KetQuaDoiTen {
  sbd: string
  tenCu: string
  tenMoi: string
  /** Máy chủ báo tên mới TRÙNG tên cũ — không ghi gì. */
  khongDoi: boolean
  soDong: Record<string, number>
}

const HAN_GIAY = 15

export async function doiTenHocSinh(sbd: string, hoTen: string): Promise<KetQuaDoiTen> {
  const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
  if (!ch.URL) throw new Error('Chưa kết nối được máy chủ — chưa đổi tên.')
  const dk = new AbortController()
  const hen = setTimeout(() => dk.abort(), HAN_GIAY * 1000)
  let res: Response
  try {
    res = await fetch(`${ch.URL}/hoc-sinh/doi-ten`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' },
      body: JSON.stringify({ sbd, hoTen }),
      signal: dk.signal,
    })
  } catch (e) {
    // Yêu cầu có thể ĐÃ tới máy chủ. Đổi tên lặp lại vô hại (cùng tên → máy chủ báo trùng), nên chỉ dặn kiểm tra rồi lưu lại.
    if ((e as { name?: string })?.name === 'AbortError') throw new Error('Máy chủ trả lời chậm — chưa chắc đã đổi tên. Mở lại hồ sơ để xem tên hiện tại, hoặc bấm Lưu lần nữa.')
    throw new Error('Không nối được máy chủ — chưa chắc đã đổi tên. Mở lại hồ sơ để xem tên hiện tại, hoặc bấm Lưu lần nữa.')
  } finally {
    clearTimeout(hen)
  }
  if (res.status === 404) throw new Error('Máy chủ chưa có lệnh Đổi tên — chưa đổi tên ở đâu cả.')
  let j: Record<string, unknown> = {}
  try {
    j = (await res.json()) as Record<string, unknown>
  } catch {
    throw new Error('Máy chủ trả lời không đọc được — chưa chắc đã đổi tên. Mở lại hồ sơ để xem tên hiện tại.')
  }
  if (!res.ok || j.ok !== true) throw new Error(String(j.error || j.loi || 'Máy chủ không cho đổi tên.'))
  const soDong: Record<string, number> = {}
  for (const [k, v] of Object.entries((j.soDong ?? {}) as Record<string, unknown>)) soDong[k] = Number(v) || 0
  return { sbd: String(j.sbd ?? sbd), tenCu: String(j.tenCu ?? ''), tenMoi: String(j.tenMoi ?? hoTen), khongDoi: j.khongDoi === true, soDong }
}
