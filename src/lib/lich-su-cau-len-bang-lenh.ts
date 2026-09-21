// PHẦN NỐI MÁY của "em đã làm câu này chưa" (Code 1, 21/09/2026): gọi lệnh chỉ-đọc `/gv/lich-su-cau-cua-em`, chia lô ≤ 200 cặp. Không ném lỗi.
// Máy chủ chưa có lệnh (404) / mất mạng / chậm / trả sai dạng ⇒ KHÔNG có nhãn (trả null hoặc thiếu cặp), không bao giờ bịa "chưa làm".
import { goiLenh } from './goi-lenh-thay'
import { chiaLoCap, docLichSuCauEm, type CapEmCau, type LichSuCauEm } from './lich-su-cau-len-bang'

/** Chờ tối đa ngần này mili giây: tờ chiếu / bảng phân công KHÔNG được đứng đợi lịch sử — quá hạn chờ ⇒ mở không nhãn. */
export const HAN_CHO_LICH_SU_MS = 4000

/** Lịch sử của mọi cặp (em, câu) đã cho. Có ít nhất một lô đọc được ⇒ bản đồ theo khoá `sbd|qid` (cặp của lô hỏng thì vắng); không lô nào đọc được ⇒ null. */
export async function layLichSuCau(cap: readonly CapEmCau[], tuyChon: { hanChoMs?: number } = {}): Promise<Map<string, LichSuCauEm> | null> {
  const lo = chiaLoCap(cap)
  if (lo.length === 0) return new Map()
  const han = tuyChon.hanChoMs ?? HAN_CHO_LICH_SU_MS
  const goiTatCa = Promise.all(
    lo.map(async (l) => {
      const r = await goiLenh('/gv/lich-su-cau-cua-em', { cap: l }, 'Máy chủ chưa có lệnh lịch sử câu — thẻ tên không hiện nhãn "đã làm câu này chưa".')
      return r.ok ? docLichSuCauEm(r.du) : null
    }),
  )
  let hen: ReturnType<typeof setTimeout> | undefined
  const cho = new Promise<null>((xong) => { hen = setTimeout(() => xong(null), han) })
  try {
    const kq = await Promise.race([goiTatCa, cho])
    if (!kq) return null
    const ra = new Map<string, LichSuCauEm>()
    let coLoDuoc = false
    for (const m of kq) {
      if (!m) continue
      coLoDuoc = true
      for (const [k, v] of m) ra.set(k, v)
    }
    return coLoDuoc ? ra : null
  } catch {
    return null
  } finally {
    if (hen) clearTimeout(hen)
  }
}
