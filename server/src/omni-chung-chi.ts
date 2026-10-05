// OMNI 3 — CHỨNG CHỈ "SẴN SÀNG 8+" (K ∧ C ∧ M ∧ T). LÕI THUẦN.
// Đặc tả mục 0 + 4.10:
//   K: mọi vi kỹ năng của phạm vi (vkn ∪ vknY) có P ≥ K_P_VKN · C: sEm ≤ C_SO_Y · M: duBao.p8 ≥ M_P8 · T: ca chốt (câu chưa gặp, đúng khung) ≥ T_CA_CHOT.
//   uocNgay = ⌈Σ lượt cần (ln((1−K)/(1−P))/ln(1−T·p̂)) / nhịp thật (câu/ngày)⌉ trên các vi kỹ năng còn dưới K; đạt ⇒ null.
import { THAM_SO_OMNI, type ChungChi, type DuBao, type HoSoOmniEm, type LyDoChungChi, type QCau, type ThamSoOmni } from './omni-kieu'
import { conThieuCua, luotCan, pHatTheoVkn, vknCuaPhamVi } from './du-bao-diem'

/**
 * Ước số ngày còn cần theo nhịp thật của em: ⌈Σ_k luotCan(P_k → K_P_VKN, p̂_k, T) / nhipNgay⌉ (tối thiểu 1) trên vi kỹ năng phạm vi còn dưới K.
 * null khi: nhịp ≤ 0 / không hữu hạn · tổng không hữu hạn · tổng = 0 (kiến thức đã đủ — phần còn thiếu là cẩn thận/mô hình/ca chốt, công thức
 * lượt học không ước được).
 */
export function uocNgayChungChi(hs: Pick<HoSoOmniEm, 'vkn' | 'sEm'>, cauPhamVi: readonly QCau[], nhipNgay: number, ts: ThamSoOmni = THAM_SO_OMNI): number | null {
  if (!(Number.isFinite(nhipNgay) && nhipNgay > 0)) return null
  const pHat = pHatTheoVkn(hs, cauPhamVi, hs.sEm, ts)
  let tong = 0
  for (const k of vknCuaPhamVi(cauPhamVi)) {
    const p = hs.vkn[k]?.p ?? ts.P0
    if (p < ts.K_P_VKN) tong += luotCan(p, ts.K_P_VKN, pHat.get(k) ?? 0, ts.T)
  }
  if (!Number.isFinite(tong) || tong <= 0) return null
  return Math.max(1, Math.ceil(tong / nhipNgay - 1e-9))
}

/**
 * Xét chứng chỉ "Sẵn sàng 8+" của một phạm vi (bài): đạt ⇔ K ∧ C ∧ M ∧ T. `thieu` liệt kê đúng điều kiện trượt theo thứ tự
 * kien_thuc · can_than · mo_hinh · ca_chot. Phạm vi không có vi kỹ năng nào ⇒ K trượt (không có gì để chứng nhận).
 * doTin = duBao.p8 (chữ hiển thị tự kẹp 99 %). conThieu tính lại từ hồ sơ + phạm vi (cùng luật `conThieuCua` của dự báo).
 */
export function xetChungChi(hs: HoSoOmniEm, cauPhamVi: readonly QCau[], duBao: DuBao, caChot: { diem: number; ngay: string } | null, nhipNgay: number, ts: ThamSoOmni = THAM_SO_OMNI): ChungChi {
  const conThieu = conThieuCua(hs, cauPhamVi, ts)
  const thieu: LyDoChungChi[] = []
  if (!vknCuaPhamVi(cauPhamVi).length || conThieu.vkn.length > 0) thieu.push('kien_thuc')
  if (!(hs.sEm <= ts.C_SO_Y)) thieu.push('can_than')
  if (!(duBao.p8 >= ts.M_P8)) thieu.push('mo_hinh')
  if (!caChot || !(caChot.diem >= ts.T_CA_CHOT)) thieu.push('ca_chot')
  const dat = thieu.length === 0
  return { dat, doTin: duBao.p8, thieu, conThieu, uocNgay: dat ? null : uocNgayChungChi(hs, cauPhamVi, nhipNgay, ts) }
}
