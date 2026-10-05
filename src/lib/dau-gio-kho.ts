// KHO CÂU CHO KIỂM TRA ĐẦU GIỜ (29/09): câu em đã làm đúng có thể đến từ MỌI nhánh kho (ca kiểm tra, game, bài về nhà…), không chỉ cây Dạy học.
// Tra mã câu máy chủ (`<tờ gốc>-<phần>-<số>`, `qidMayChuCuaIdCau`) ⇒ câu trong kho để dựng tờ chiếu MỚI (`dungToChieuDayHoc`). Câu không có trong kho
// máy này ⇒ app không chọn (không chiếu được thì không gọi em lên với câu ấy).
import type { TeacherExamSource } from '../data/examContent'
import { cauTuDeChon, type CauDayHoc } from './day-hoc-len-bang'
import { khoaCau } from './khu-trung-cau'
import type { EmUngVien } from './dau-gio'

export function cauTheoQid(ds: readonly TeacherExamSource[]): Map<string, CauDayHoc> {
  const m = new Map<string, CauDayHoc>()
  for (const c of cauTuDeChon(ds, new Set(ds.map((s) => s.maDe)), false)) if (!m.has(c.qid)) m.set(c.qid, c)
  return m
}

/** Giữ ở mỗi em chỉ các câu CÓ trong kho (dựng tờ được) và KHÔNG tự luận (tự luận không có đúng/sai tự chấm — không phải "câu đã làm đúng"). */
export function locUngVienTheoKho(em: readonly EmUngVien[], kho: ReadonlyMap<string, CauDayHoc>): EmUngVien[] {
  return em.map((e) => ({ ...e, cau: e.cau.filter((c) => {
    const k = kho.get(c.qid)
    return !!k && !k.tuLuan
  }) }))
}

/** Khoá NỘI DUNG của câu theo qid (để một lượt / một buổi không chiếu hai câu trùng nội dung — thầy 05/10). Không có trong kho ⇒ undefined. */
export function khoaNoiDungTheoKho(kho: ReadonlyMap<string, CauDayHoc>): (qid: string) => string | undefined {
  return (qid) => {
    const q = kho.get(qid)?.q as { text?: string; choices?: string[]; ideas?: string[] } | undefined
    return q && String(q.text ?? '').trim() ? khoaCau({ text: String(q.text), choices: q.choices, ideas: q.ideas }) : undefined
  }
}
