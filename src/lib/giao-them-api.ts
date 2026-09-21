// `POST /ph/giao-them` (Code 3, hợp đồng docs/hop-dong-ph-giao-them-2109.md mục 5). Danh tính: mã liên kết riêng `docPass()` nếu có, KHÔNG có thì SBD trần của con (app PH chấp nhận cả hai kiểu đăng nhập;
// máy chủ nhận cả `pass` lẫn `sbd`). Mã chỉ đọc qua `docPass()`; không hiển thị, không ghi console. KHÔNG ném lỗi.
// App PH chỉ còn MỘT đường giao bài (thầy lệnh 21/09): không còn "đường cũ" để lùi về — lỗi/thiếu lệnh ⇒ `loi` với LỜI THẬT của máy chủ (nếu có), hiện ngay dưới nút.
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docPass } from './ph-token'
import { docKetQuaGiaoThem, type KetQuaGiaoThem } from './giao-them-hien-thi'

const HAN_MS = 20_000
const CHU_LOI_CHUNG = 'Chưa giao được bài lúc này. Anh/chị chưa mất lượt nào, thử lại sau ít phút.'

export type PhanHoiGiaoThem = { kieu: 'ok'; kq: KetQuaGiaoThem } | { kieu: 'khong_co_lenh' } | { kieu: 'loi'; chu: string }

/** `chiXem = true` ⇒ chỉ đọc trạng thái nút (không ghi, không chọn câu, KHÔNG tính lượt). Ngược lại ⇒ GIAO (máy chủ đếm lượt, chống bấm đúp). */
export async function phGiaoThemApi(chiXem: boolean, sbd?: string): Promise<PhanHoiGiaoThem> {
  const pass = docPass()
  const danhTinh = pass ? { pass } : sbd && sbd.trim() ? { sbd: sbd.trim() } : null
  if (!danhTinh) return { kieu: 'khong_co_lenh' }
  try {
    const url = await layDiaChiMayChu()
    if (!url) return { kieu: 'khong_co_lenh' }
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), HAN_MS)
    try {
      const r = await fetch(`${String(url).replace(/\/+$/, '')}/ph/giao-them`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(chiXem ? { ...danhTinh, chiXem: true } : danhTinh),
        signal: bo.signal,
      })
      if (r.status === 404) return { kieu: 'khong_co_lenh' }
      const j = (await r.json().catch(() => null)) as unknown
      const kq = docKetQuaGiaoThem(j)
      if (kq) return { kieu: 'ok', kq }
      // `{ok:false, error}` = lỗi xác thực/hệ thống (không tính lượt): hiện LỜI THẬT của máy chủ nếu có (vd cần liên kết riêng của con); không có lời ⇒ câu chung. Đọc trạng thái cũng báo lỗi (không còn đường cũ để lùi).
      const loiMayChu = j && typeof j === 'object' && (j as { ok?: unknown }).ok === false && typeof (j as { error?: unknown }).error === 'string' ? String((j as { error: string }).error).replace(/\s+/g, ' ').trim() : ''
      if (loiMayChu && loiMayChu.length <= 240) return { kieu: 'loi', chu: loiMayChu }
      return { kieu: 'loi', chu: CHU_LOI_CHUNG }
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return { kieu: 'loi', chu: 'Chưa nối được máy chủ. Anh/chị chưa mất lượt nào, thử lại sau ít phút.' }
  }
}
