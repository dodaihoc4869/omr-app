// BÌNH PHẢN ỨNG — BA DÒNG «VÌ SAO CHỌN EM» LÊN BẢNG (thầy 06/11: «gọi 1 học sinh phù hợp nhất … dựa vào toàn bộ lịch sử làm bài trên app … ghi rõ lý do»).
// Em được chọn bằng lõi thầy đã chốt 21/10 (src/lib/ung-vien-chieu.ts → chon-em-phan-tang.ts: tầng theo khả năng đúng chính câu ấy, ghép theo mức độ câu,
// ưu tiên em lâu chưa lên bảng). Lý do CHỈ dựng từ dữ liệu thật của lệnh `/gv/ung-vien-chieu` (đã đúng / đã sai câu này, ước lượng vừa sức, sổ lên bảng 14 ngày)
// + việc của em ở lượt này. KHÔNG BAO GIỜ đưa tên tầng («Cần kèm», «Khá»…) hay xác suất lên màn chiếu (luật 7 — không nhãn năng lực).

export interface EmLyDo {
  loai: 'da_dung' | 'du_bao' | 'chua_co'
  soSai?: number
  soLan14?: number
  lanCuoiLenBang?: string | null
  /** (10/11) Lý do bộ chọn theo toàn bộ lịch sử trả về (src/lib/bpu/chon-em-bpu.ts) — đủ 2 dòng thì dùng thẳng, thiếu ⇒ ba dòng chung dưới. */
  lyDoBpu?: readonly string[]
}
const NGAY_MS = 86_400_000

export function chuMucDo(mucDo: string | null | undefined): string {
  const m = String(mucDo ?? '').toLowerCase()
  if (/vận|van|vd/.test(m)) return 'vận dụng'
  if (/thông|thong|th/.test(m)) return 'thông hiểu'
  if (/nhận|nhan|nb|biết|biet/.test(m)) return 'nhận biết'
  return ''
}

export function lyDoLenBang(e: EmLyDo, o: { mucDo?: string | null; giayGui?: number | null; nowMs: number }): string[] {
  if ((e.lyDoBpu?.length ?? 0) >= 2) return e.lyDoBpu!.slice(0, 3)
  const muc = chuMucDo(o.mucDo)
  const ra: string[] = []
  if (e.loai === 'da_dung') ra.push('Em đã tự làm đúng câu này trên app: lên giảng lại cho cả lớp.')
  else if ((e.soSai ?? 0) > 0) ra.push(`Em từng làm sai câu này ${e.soSai} lần trên app: lên bảng gỡ cùng thầy.`)
  else if (e.loai === 'du_bao') ra.push(`Theo lịch sử làm bài trên app, câu ${muc || 'này'}${muc ? ' này' : ''} vừa sức em.`)
  else ra.push('Câu này mới với em trên app: lên thử sức trước lớp.')
  if (o.giayGui != null && Number.isFinite(o.giayGui)) ra.push(`Lượt này em gửi đáp án sau ${Math.max(1, Math.round(o.giayGui))} giây.`)
  const t = e.lanCuoiLenBang ? Date.parse(e.lanCuoiLenBang) : NaN
  const ngay = Number.isFinite(t) ? Math.max(0, Math.floor((o.nowMs - t) / NGAY_MS)) : null
  if ((e.soLan14 ?? 0) === 0) ra.push(ngay !== null && ngay >= 14 ? `${ngay} ngày chưa lên bảng.` : 'Chưa lên bảng trong 14 ngày qua.')
  else if (ngay !== null && ngay > 0) ra.push(`${ngay} ngày chưa lên bảng.`)
  else ra.push(`Đã lên bảng ${e.soLan14} lần trong 14 ngày, thầy mời thêm lượt này.`)
  return ra.slice(0, 3)
}
