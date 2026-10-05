// OMNI 3 — ĐẦU VÀO KẾ HOẠCH NGÀY TỪ HỒ SƠ OMNI (trọng số câu, dạng đã vững, ôn bài cũ, chế độ chờ, đan xen). LÕI THUẦN.
// Đặc tả mục 1 bước 3, 4.4, 6.
import { THAM_SO_OMNI, type HoSoOmniEm, type QCau, type ThamSoOmni } from './omni-kieu'
import { trongSoCau } from './du-bao-diem'
import { vknCaCau, vknCuaY } from './omni-p-vkn'

/** Trọng số mọi câu ứng viên (qid → số ≥ 0) = trongSoCau (du-bao-diem.ts) với sơ ý riêng của em. Kế hoạch xếp câu mới / ôn bài cũ theo số này (giảm dần). */
export function trongSoCacCau(hs: HoSoOmniEm, cau: readonly QCau[], ts: ThamSoOmni = THAM_SO_OMNI): Record<string, number> {
  return Object.fromEntries(cau.map((c) => [c.qid, trongSoCau(hs, c, hs.sEm, ts)]))
}

/**
 * Dạng ĐÃ VỮNG của em trong phạm vi (mã dạng, sắp tăng). Vi kỹ năng của dạng = mọi vi kỹ năng câu của dạng trong phạm vi cần (vkn ∪ vknY).
 * Đạt khi MỌI vi kỹ năng ấy: 'vung' (SPRT) ∧ nCau ≥ VUNG_SO_CAU ∧ nNgay ≥ VUNG_SO_NGAY ∧ nTroiChay ≥ VUNG_TROI_CHAY ∧ nCauLaDung ≥ VUNG_CAU_LA ∧
 * không dayLai. Điều kiện trôi chảy được MIỄN khi hồ sơ chưa có lượt nào đo tốc độ: mọi vi kỹ năng của dạng có nTroiChay = 0 và em chưa có
 * mẫu τ (nTau = 0). Vi kỹ năng chưa có hồ sơ ⇒ dạng chưa vững.
 */
export function dangDaVung(hs: HoSoOmniEm, cau: readonly QCau[], ts: ThamSoOmni = THAM_SO_OMNI): string[] {
  const theoDang = new Map<string, Set<string>>()
  for (const c of cau) {
    if (!c.maDang) continue
    const ds = theoDang.get(c.maDang) ?? new Set<string>()
    for (const k of vknCaCau(c)) ds.add(k)
    if (c.phan === 'II') for (let i = 0; i < 4; i++) for (const k of vknCuaY(c, i)) ds.add(k)
    theoDang.set(c.maDang, ds)
  }
  const ra: string[] = []
  for (const [maDang, ds] of theoDang) {
    const hoSo = [...ds].map((k) => hs.vkn[k])
    if (!hoSo.length || hoSo.some((x) => !x)) continue
    const mienTroiChay = (hs.nTau ?? 0) === 0 && hoSo.every((x) => x!.nTroiChay === 0)
    const vung = hoSo.every((x) =>
      x!.trangThai === 'vung' && x!.nCau >= ts.VUNG_SO_CAU && x!.nNgay >= ts.VUNG_SO_NGAY &&
      (mienTroiChay || x!.nTroiChay >= ts.VUNG_TROI_CHAY) && x!.nCauLaDung >= ts.VUNG_CAU_LA && !x!.dayLai)
    if (vung) ra.push(maDang)
  }
  return ra.sort()
}
/** Tỉ lệ trần "ôn bài cũ" theo ngày thứ mấy của bài (1 = ngày giao): ngày 4–5 ⇒ DAN_XEN_TI_LE, còn lại ON_BAI_CU_TI_LE. */
export function tiLeOnBaiCu(ngayThuCuaBai: number | null, ts: ThamSoOmni = THAM_SO_OMNI): number {
  return ngayThuCuaBai != null && (ts.DAN_XEN_NGAY as readonly number[]).includes(ngayThuCuaBai) ? ts.DAN_XEN_TI_LE : ts.ON_BAI_CU_TI_LE
}
/** Thể lực ngày ở chế độ chờ bài mới: max(CHO_THE_LUC_SAN, round(CHO_THE_LUC_TI_LE × thể lực lớp)). */
export function theLucCho(theLucLop: number, ts: ThamSoOmni = THAM_SO_OMNI): number {
  return Math.max(ts.CHO_THE_LUC_SAN, Math.round(ts.CHO_THE_LUC_TI_LE * theLucLop))
}
/** Hạn bài tự tính (số ngày D tính cả hôm giao): D nhỏ nhất trong [HAN_BAI_MIN, HAN_BAI_MAX] sao cho luotCanTrungVi ≤ HAN_BAI_TI_LE × D × theLuc; không có ⇒ HAN_BAI_MAX. */
export function soNgayHanBai(luotCanTrungVi: number, theLuc: number, ts: ThamSoOmni = THAM_SO_OMNI): number {
  for (let d = ts.HAN_BAI_MIN; d <= ts.HAN_BAI_MAX; d++) if (luotCanTrungVi <= ts.HAN_BAI_TI_LE * d * theLuc) return d
  return ts.HAN_BAI_MAX
}
