// TÓM TẮT THAY ĐỔI KHI SỬA CHIẾN DỊCH (thầy 28/09) — MỘT nguồn cho hộp "Chỉnh sửa" của app thầy và dòng nhật ký máy chủ.
// Ví dụ: "+2 đề, +3 em, −1 em, hạn 30/09 → 05/10". Không có thay đổi ⇒ chuỗi rỗng.

export interface ThayDoiChienDich {
  /** Số tờ đề thêm vào. */
  themDe: number
  themEm: number
  botEm: number
  /** Hạn cũ `YYYY-MM-DD`. */
  hanCu: string
  /** Hạn mới (`null` = giữ hạn cũ). */
  hanMoi: string | null
  /** Số câu/ngày (thể lực) cũ → mới; vắng hoặc bằng nhau = không đổi. */
  theLucCu?: number
  theLucMoi?: number | null
}

const NGAY = /^(\d{4})-(\d{2})-(\d{2})$/
/** "2026-09-30" → "30/09". */
export function ngayNgan(ngay: string): string {
  const m = NGAY.exec(ngay)
  return m ? `${m[3]}/${m[2]}` : ngay
}

export function chuTomTatSua(t: ThayDoiChienDich): string {
  const phan: string[] = []
  if (t.themDe > 0) phan.push(`+${t.themDe} đề`)
  if (t.themEm > 0) phan.push(`+${t.themEm} em`)
  if (t.botEm > 0) phan.push(`−${t.botEm} em`)
  if (t.hanMoi && t.hanMoi !== t.hanCu) phan.push(`hạn ${ngayNgan(t.hanCu)} → ${ngayNgan(t.hanMoi)}`)
  if (t.theLucMoi != null && t.theLucCu != null && t.theLucMoi !== t.theLucCu) phan.push(`số câu/ngày ${t.theLucCu} → ${t.theLucMoi}`)
  return phan.join(', ')
}
