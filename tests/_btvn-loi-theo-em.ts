// Trợ giúp cho các test BTVN nâng đỡ sau khi "LÕI ĐÚNG BẬC" vào lõi (thầy chốt 21/09/2026): lõi CỦA EM (`BoCuaEm.loi`) có thể khác lõi của bài (`chonLoi`) ở dạng em ổn định.
import { BTVN_NANG_DO, maDangCua, type BoCuaEm, type CauGiao, type HoSoEmRut } from '../src/lib/btvn-nang-do'

/** Bậc hồ sơ của dạng ỔN ĐỊNH (đủ tin, không yếu, bậc ≥ Hiểu) — đúng định nghĩa của lõi; ngược lại null. */
export function bacOnDinh(hoSo: HoSoEmRut, ma: string): number | null {
  const d = hoSo.dang?.[ma]
  if (!d || d.soGap < BTVN_NANG_DO.SO_CAU_DU_TIN_DANG) return null
  if (d.tiLeKhacPhuc !== null && d.tiLeKhacPhuc < BTVN_NANG_DO.NGUONG_DANG_YEU) return null
  return d.bac >= 1 ? d.bac : null
}

/**
 * Lõi CỦA EM hợp lệ so với lõi của bài: cùng số câu, cùng số câu lõi ở MỖI dạng (độ phủ), và câu khác lõi gốc chỉ là câu THAY: dạng ổn định của em, câu bị thay mức < bậc, câu thay mức = bậc.
 * Trả '' khi hợp lệ, ngược lại một câu mô tả lỗi.
 */
export function kiemLoiTheoEm(cau: CauGiao[], loiBai: string[], bo: Pick<BoCuaEm, 'loi'>, hoSo: HoSoEmRut): string {
  const theoQid = new Map(cau.map((c) => [c.qid, c]))
  if (bo.loi.length !== loiBai.length) return `${bo.loi.length} câu lõi ≠ ${loiBai.length} của bài`
  const goc = new Set(loiBai)
  const cua = new Set(bo.loi)
  const boQua = loiBai.filter((q) => !cua.has(q))
  const them = bo.loi.filter((q) => !goc.has(q))
  const theoDang = (ds: string[]) => {
    const m = new Map<string, CauGiao[]>()
    for (const q of ds) {
      const c = theoQid.get(q)!
      m.set(maDangCua(c), [...(m.get(maDangCua(c)) ?? []), c])
    }
    return m
  }
  const a = theoDang(boQua)
  const b = theoDang(them)
  for (const ma of new Set([...a.keys(), ...b.keys()])) {
    if ((a.get(ma)?.length ?? 0) !== (b.get(ma)?.length ?? 0)) return `dạng ${ma}: số câu thay ≠ số câu bị thay`
    const bac = bacOnDinh(hoSo, ma)
    if (bac === null) return `dạng ${ma}: thay lõi khi dạng chưa ổn định`
    if ((a.get(ma) ?? []).some((c) => c.mucDo >= bac)) return `dạng ${ma}: câu bị thay không thấp hơn bậc ${bac}`
    if ((b.get(ma) ?? []).some((c) => c.mucDo !== bac)) return `dạng ${ma}: câu thay không đúng bậc ${bac}`
  }
  return ''
}
