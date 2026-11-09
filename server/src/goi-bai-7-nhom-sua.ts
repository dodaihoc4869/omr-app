// NHÓM LỖI NGÀY SỬA — khối B đợt 2 lát 3 (thầy 09/11 duyệt bản vẽ docs/ban-ve-moi-on-sua-0911 ảnh dt-sang-3, «làm hết sạch đẩy luôn lên bản sống»).
// Ngày Sửa: các câu sai chờ sửa trong kế hoạch hôm nay gom theo DẠNG (meta `dang`, tên `tenDang`); mỗi nhóm mang loại lỗi NẶNG NHẤT em đã chạm ở
// «Vì sao em sai?» (Hiểu nhầm > Chưa biết cách > Tính / đọc đề sai; chưa chạm ⇒ không gắn). Thuần CPU trên dữ liệu đã đọc (0 lệnh D1).
import type { LyDoSai } from './ly-do-sai'

export interface NhomSua7 { ten: string; loai?: LyDoSai; so: number }
const NANG: Record<LyDoSai, number> = { tinh: 1, cach: 2, nham: 3 }
/** qid câu song sinh / anh em ("<gốc>~ss0") ⇒ câu gốc. */
export const qidGocSua = (q: string): string => q.replace(/~.*$/, '')

/** Gom câu sửa (theo thứ tự trong kế hoạch) thành nhóm theo dạng; tối đa 8 nhóm (phần dư gộp vào nhóm cuối). */
export function nhomSua7(qids: readonly string[], meta: ReadonlyMap<string, { dang: string | null; tenDang: string | null }>, lyDo: ReadonlyMap<string, LyDoSai>): NhomSua7[] {
  const m = new Map<string, NhomSua7>()
  for (const q of qids) {
    const g = meta.get(q) ?? meta.get(qidGocSua(q))
    const ten = g?.tenDang?.trim() || ''
    const khoa = g?.dang || ten || ''
    let n = m.get(khoa)
    if (!n) { n = { ten: ten || 'Câu sai khác', so: 0 }; m.set(khoa, n) }
    n.so++
    const l = lyDo.get(q) ?? lyDo.get(qidGocSua(q))
    if (l && (!n.loai || NANG[l] > NANG[n.loai])) n.loai = l
  }
  const ds = [...m.values()]
  if (ds.length <= 8) return ds
  const du = ds.slice(7)
  return [...ds.slice(0, 7), { ten: 'Các dạng khác', so: du.reduce((s, n) => s + n.so, 0), ...(du.some(n => n.loai) ? { loai: du.reduce<LyDoSai | undefined>((a, n) => (n.loai && (!a || NANG[n.loai] > NANG[a]) ? n.loai : a), undefined) } : {}) }]
}
