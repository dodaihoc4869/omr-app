// THẺ "MỨC ĐỘ NHẬN THỨC" của báo cáo ca — CHỈ SỐ THẬT (thầy lệnh 28/09, soát docs/hs-lich-su-ca-2809/SOAT-BAO-CAO.md #11).
// Bản cũ lấy tổng cứng 12/12/10/6 rồi "đúng = tổng − số sai" ⇒ số bịa. Nay đếm trên MỌI câu em đã làm của ca
// (`/hs/cau-da-thi`, đã lọc luật công bố phía máy chủ): tổng = số câu mang mức ấy, đúng = số câu đúng TRỌN.
// Mức nào không có câu ⇒ bỏ; không câu nào có mức độ ⇒ [] và màn cha ẨN thẻ.

export type KhoaMucDo = 'biet' | 'hieu' | 'van_dung' | 'van_dung_cao'

export interface DongMucDo {
  khoa: KhoaMucDo
  ten: string
  moTa: string
  dung: number
  tong: number
  phanTram: number
}

const TEN: Record<KhoaMucDo, [string, string]> = {
  biet: ['Nhận biết', 'Lý thuyết cơ bản, công thức, khái niệm'],
  hieu: ['Thông hiểu', 'Bản chất hoá học, giải thích hiện tượng, phản ứng'],
  van_dung: ['Vận dụng', 'Tính toán, bảo toàn, bài tập tổng hợp'],
  van_dung_cao: ['Vận dụng cao', 'Biện luận, bài toán phân hoá'],
}
const THU_TU: KhoaMucDo[] = ['biet', 'hieu', 'van_dung', 'van_dung_cao']

/** Mức độ kho ('biet' | 'hieu' | 'van_dung' | 'van_dung_cao', hoặc NB/TH/VD/VDC) → khoá; lạ ⇒ null (không đoán). */
export function khoaMucDo(m: unknown): KhoaMucDo | null {
  const k = String(m ?? '').trim().toLowerCase().replace(/\s+/g, '_')
  if (['biet', 'nb', 'nhan_biet'].includes(k)) return 'biet'
  if (['hieu', 'th', 'thong_hieu'].includes(k)) return 'hieu'
  if (['van_dung', 'vd'].includes(k)) return 'van_dung'
  if (['van_dung_cao', 'vdc'].includes(k)) return 'van_dung_cao'
  return null
}

/** Đếm theo mức độ trên danh sách câu em đã làm (`{ mucDo, dungSai }`). Câu trùng qid chỉ đếm một lần. */
export function demMucDoNhanThuc(cau: readonly unknown[] | null | undefined): DongMucDo[] {
  if (!Array.isArray(cau)) return []
  const dem = new Map<KhoaMucDo, { dung: number; tong: number }>()
  const daGap = new Set<string>()
  for (const x of cau) {
    const o = (x ?? {}) as Record<string, unknown>
    const khoa = khoaMucDo(o.mucDo)
    if (!khoa) continue
    const id = `${String(o.maCa ?? '')}|${String(o.qid ?? '')}|${String(o.phan ?? '')}|${String(o.soCau ?? '')}`
    if (o.qid && daGap.has(id)) continue
    daGap.add(id)
    const d = dem.get(khoa) ?? { dung: 0, tong: 0 }
    d.tong++
    if (o.dungSai === true) d.dung++
    dem.set(khoa, d)
  }
  return THU_TU.flatMap((k) => {
    const d = dem.get(k)
    if (!d || d.tong === 0) return []
    return [{ khoa: k, ten: TEN[k][0], moTa: TEN[k][1], dung: d.dung, tong: d.tong, phanTram: Math.round((d.dung / d.tong) * 100) }]
  })
}
