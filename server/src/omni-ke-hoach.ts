// OMNI 3 — ĐẦU VÀO KẾ HOẠCH NGÀY TỪ HỒ SƠ OMNI (trọng số câu, dạng đã vững, ôn bài cũ, chế độ chờ, đan xen). LÕI THUẦN.
// ⚠ STUB HỢP ĐỒNG: agent "Lõi thuần" hoàn thiện + test. Đặc tả mục 1 bước 3, 4.4, 6.
import { THAM_SO_OMNI, type HoSoOmniEm, type QCau, type ThamSoOmni } from './omni-kieu'

/** Trọng số mọi câu ứng viên (qid → số ≥ 0) = trongSoCau (du-bao-diem.ts). Kế hoạch xếp câu mới / ôn bài cũ theo số này (giảm dần). */
export function trongSoCacCau(hs: HoSoOmniEm, cau: readonly QCau[], ts: ThamSoOmni = THAM_SO_OMNI): Record<string, number> {
  void hs; void ts
  return Object.fromEntries(cau.map((c) => [c.qid, 1]))
}
/**
 * Dạng ĐÃ VỮNG của em trong phạm vi: mọi vi kỹ năng của dạng 'vung' (SPRT) ∧ nCau ≥ VUNG_SO_CAU ∧ nNgay ≥ VUNG_SO_NGAY ∧ nTroiChay ≥ VUNG_TROI_CHAY
 * (miễn khi chưa đo được tốc độ) ∧ nCauLaDung ≥ VUNG_CAU_LA ∧ không dayLai. Trả danh sách mã dạng.
 */
export function dangDaVung(hs: HoSoOmniEm, cau: readonly QCau[], ts: ThamSoOmni = THAM_SO_OMNI): string[] {
  void hs; void cau; void ts
  return []
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
