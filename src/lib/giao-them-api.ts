// `POST /ph/giao-them` (Code 3, hợp đồng docs/hop-dong-ph-giao-them-2109.md mục 5). Mã phụ huynh chỉ đọc qua `docPass()`; không hiển thị, không ghi console.
// KHÔNG ném lỗi: máy chủ chưa có lệnh (404/không JSON/ok≠true), mất mạng, thiếu mã ⇒ `null` ⇒ màn GIỮ đường giao bài cũ (Pages có thể đi trước Worker).
import { layDiaChiMayChu } from './dia-chi-may-chu'
import { docPass } from './ph-token'
import { docKetQuaGiaoThem, type KetQuaGiaoThem } from './giao-them-hien-thi'

const HAN_MS = 20_000

export type PhanHoiGiaoThem = { kieu: 'ok'; kq: KetQuaGiaoThem } | { kieu: 'khong_co_lenh' } | { kieu: 'loi'; chu: string }

/** `chiXem = true` ⇒ chỉ đọc trạng thái nút (không ghi, không chọn câu, KHÔNG tính lượt). Ngược lại ⇒ GIAO (máy chủ đếm lượt, chống bấm đúp). */
export async function phGiaoThemApi(chiXem: boolean): Promise<PhanHoiGiaoThem> {
  const pass = docPass()
  if (!pass) return { kieu: 'khong_co_lenh' }
  try {
    const url = await layDiaChiMayChu()
    if (!url) return { kieu: 'khong_co_lenh' }
    const bo = new AbortController()
    const hen = setTimeout(() => bo.abort(), HAN_MS)
    try {
      const r = await fetch(`${String(url).replace(/\/+$/, '')}/ph/giao-them`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(chiXem ? { pass, chiXem: true } : { pass }),
        signal: bo.signal,
      })
      if (r.status === 404) return { kieu: 'khong_co_lenh' }
      const j = (await r.json().catch(() => null)) as unknown
      const kq = docKetQuaGiaoThem(j)
      if (kq) return { kieu: 'ok', kq }
      // `{ok:false, error}` = lỗi xác thực/hệ thống (không tính lượt): chiXem thì coi như chưa có lệnh (giữ đường cũ); giao thật thì báo lỗi thật.
      if (!chiXem && j && typeof j === 'object' && (j as { ok?: unknown }).ok === false) return { kieu: 'loi', chu: 'Chưa giao được bài lúc này. Anh/chị chưa mất lượt nào, thử lại sau ít phút.' }
      return chiXem ? { kieu: 'khong_co_lenh' } : { kieu: 'loi', chu: 'Chưa giao được bài lúc này. Anh/chị chưa mất lượt nào, thử lại sau ít phút.' }
    } finally {
      clearTimeout(hen)
    }
  } catch {
    return chiXem ? { kieu: 'khong_co_lenh' } : { kieu: 'loi', chu: 'Chưa nối được máy chủ. Anh/chị chưa mất lượt nào, thử lại sau ít phút.' }
  }
}
