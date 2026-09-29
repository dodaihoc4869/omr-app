// KHO CÂU CHO KIỂM TRA ĐẦU GIỜ (29/09): câu em đã làm đúng có thể đến từ MỌI nhánh kho (ca kiểm tra, game, bài về nhà…), không chỉ cây Dạy học.
// Tra mã câu máy chủ (`<tờ gốc>-<phần>-<số>`, `qidMayChuCuaIdCau`) ⇒ câu trong kho để dựng tờ chiếu MỚI (`dungToChieuDayHoc`). Câu không có trong kho
// máy này ⇒ app không chọn (không chiếu được thì không gọi em lên với câu ấy).
import type { TeacherExamSource } from '../data/examContent'
import { cauTuDeChon, type CauDayHoc } from './day-hoc-len-bang'
import type { EmUngVien } from './dau-gio'

export function cauTheoQid(ds: readonly TeacherExamSource[]): Map<string, CauDayHoc> {
  const m = new Map<string, CauDayHoc>()
  for (const c of cauTuDeChon(ds, new Set(ds.map((s) => s.maDe)))) if (!m.has(c.qid)) m.set(c.qid, c)
  return m
}

/** Giữ ở mỗi em chỉ các câu CÓ trong kho (dựng tờ được) và KHÔNG tự luận (tự luận không có đúng/sai tự chấm — không phải "câu đã làm đúng"). */
export function locUngVienTheoKho(em: readonly EmUngVien[], kho: ReadonlyMap<string, CauDayHoc>): EmUngVien[] {
  return em.map((e) => ({ ...e, cau: e.cau.filter((c) => {
    const k = kho.get(c.qid)
    return !!k && !k.tuLuan
  }) }))
}
