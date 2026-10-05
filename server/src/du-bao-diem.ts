// OMNI 3 — DỰ BÁO ĐIỂM THEO MA TRẬN ĐỀ (PMF tích chập chính xác) + ĐIỂM CÒN LẤY ĐƯỢC + TRỌNG SỐ CÂU. LÕI THUẦN.
// ⚠ STUB HỢP ĐỒNG: agent "Lõi thuần" thay bằng bản thật (đúng hàm `phanBoDe` của docs/omni-0510/mo-phong-chac-8.mjs) + test vàng:
//   phanBoDiem({pI:0.9,pY:0.9,pIII:0.9}) ⇒ kyVong 8,66 ± 0,01 · p8 0,88 ± 0,01 (P = 1, S = 0,10).
import { THAM_SO_OMNI, type DuBao, type HoSoOmniEm, type KhungDe, type PhanBoDiem, type QCau, type ThamSoOmni, type XacSuatPhan } from './omni-kieu'

/** PMF điểm (bước 0,05) của đề khung `khung` với xác suất đúng trung bình từng phần; Phần II theo số ý đúng (0/0,1/0,25/0,5/1). */
export function phanBoDiem(p: XacSuatPhan, khung: KhungDe = THAM_SO_OMNI.KHUNG_DE, ts: ThamSoOmni = THAM_SO_OMNI): PhanBoDiem {
  const eII = (y: number) => y ** 4 + 4 * y ** 3 * (1 - y) * 0.5 + 6 * y * y * (1 - y) ** 2 * 0.25 + 4 * y * (1 - y) ** 3 * 0.1
  const kyVong = khung.I * ts.DIEM_CAU.I * p.pI + khung.II * eII(p.pY) + khung.III * ts.DIEM_CAU.III * p.pIII
  return { kyVong, p8: kyVong >= 8 ? 1 : 0, saiSo: 0, pmf: [] }
}
/** Xác suất đúng trung bình từng phần trên phạm vi: P(đúng câu) = pAnd(K)(1−s) + (1−pAnd)·G; Phần II tính theo ý trên vknY (vắng ⇒ vkn). */
export function xacSuatPhan(hs: Pick<HoSoOmniEm, 'vkn'>, cauPhamVi: readonly QCau[], sEm: number, ts: ThamSoOmni = THAM_SO_OMNI): XacSuatPhan {
  void hs; void cauPhamVi; void ts
  return { pI: 1 - sEm, pY: 1 - sEm, pIII: 1 - sEm }
}
/** Dự báo đầy đủ: PMF + con đường rẻ nhất + vi kỹ năng/ý còn thiếu + tập câu khả thi trong THOI_GIAN_THI_GIAY theo tốc độ riêng. */
export function duBaoDiem(hs: HoSoOmniEm, cauPhamVi: readonly QCau[], tuy: { khung?: KhungDe; mucTieu?: number; khaThi?: KhungDe } = {}, ts: ThamSoOmni = THAM_SO_OMNI): DuBao {
  const pb = phanBoDiem(xacSuatPhan(hs, cauPhamVi, hs.sEm, ts), tuy.khaThi ?? tuy.khung ?? ts.KHUNG_DE, ts)
  return { ...pb, conDuong: null, conThieu: { vkn: [], soY: 0 }, soBangChung: 0 }
}
/** Điểm còn lấy được của MỘT câu = điểm câu × (1 − P(đúng)) × hệ số vùng học (VUNG_HOC). Dùng làm trọng số xếp câu mới / ôn bài cũ. */
export function trongSoCau(hs: Pick<HoSoOmniEm, 'vkn'>, cau: QCau, sEm: number, ts: ThamSoOmni = THAM_SO_OMNI): number {
  void hs; void cau; void sEm; void ts
  return 1
}
