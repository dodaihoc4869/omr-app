// OMNI 3 — CHỨNG CHỈ "SẴN SÀNG 8+" (K ∧ C ∧ M ∧ T). LÕI THUẦN.
// ⚠ STUB HỢP ĐỒNG: agent "Lõi thuần" hoàn thiện + test. Đặc tả mục 0 + 4.10.
//   K: mọi vi kỹ năng của phạm vi có P ≥ K_P_VKN · C: sEm ≤ C_SO_Y · M: duBao.p8 ≥ M_P8 · T: ca chốt (câu chưa gặp, đúng khung) ≥ T_CA_CHOT.
//   uocNgay = ⌈Σ lượt cần (ln((1−K)/(1−P))/ln(1−T·p̂)) / nhịp thật (câu/ngày)⌉; đạt ⇒ null.
import { THAM_SO_OMNI, type ChungChi, type DuBao, type HoSoOmniEm, type QCau, type ThamSoOmni } from './omni-kieu'

export function xetChungChi(hs: HoSoOmniEm, cauPhamVi: readonly QCau[], duBao: DuBao, caChot: { diem: number; ngay: string } | null, nhipNgay: number, ts: ThamSoOmni = THAM_SO_OMNI): ChungChi {
  void hs; void cauPhamVi; void caChot; void nhipNgay; void ts
  return { dat: false, doTin: duBao.p8, thieu: ['kien_thuc', 'can_than', 'mo_hinh', 'ca_chot'], conThieu: duBao.conThieu, uocNgay: null }
}
