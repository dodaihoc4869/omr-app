// KINH TẾ GAME — MỘT NGUỒN cho máy chủ và giao diện. Cấm rải các số này ra chỗ khác.
//
// ══ LUẬT EXP v5 (THẦY ĐÃ CHỐT 29/09/2026 "build và đẩy luôn" — docs/DE-XUAT-EXP-V5-2909.md) ══
// · KHÔNG trần theo ngày ở cả kiếm lẫn nạp. Mọi câu đúng đều có EXP.
// · Lên cấp c cần ĐỦ HAI thứ: tổng EXP trong thú ≥ T(c) (`BANG_TONG_EXP_V5`) VÀ số ngày đạt nhiệm vụ ngày ≥ D(c) (`BANG_NGAY_CAP`).
//   Ngày nghỉ chung thầy đặt (`cau_hinh.ngay_nghi`) tính là ngày đạt cho mốc cấp (không cộng mảnh) — điểm chốt 2.
// · Thú đầy thanh mà chưa đủ ngày ⇒ phần EXP vượt là "EXP tràn", tự đổi thành vàng + mảnh khiên theo lợi suất giảm dần trong NGÀY VN (`vangTranNgay`, `manhTranNgay`).
// · Vàng thường: 1 vàng / `EXP_MOI_VANG` EXP VÀO THÚ (EXP tràn không tính vàng thường — nó đã có vàng tràn).
// · Khiên rèn: `MANH_REN_KHIEN` mảnh + `VANG_REN_KHIEN` vàng + số ngày đạt ≥ `ngayDatKhien(k)` cho khiên thứ k. Giữ tối đa 5 khiên chưa dùng.
// · Shop: giữ giá v4; bậc 4 cần thú cấp ≥ `CAP_MO_BAC_PHU_KIEN[4]`, bậc 5 cần cấp ≥ `CAP_MO_BAC_PHU_KIEN[5]`.
//
// Hai bảng số nguyên dưới đây VIẾT THẲNG (sinh từ công thức đóng, có test khoá `tests/exp-v5-2909.test.ts`), KHÔNG tính mũ lúc chạy:
//   p = ln(1200/21) / ln(119/9) ≈ 1,5669;  D(c) = ⌊21·((c−1)/9)^p⌋ (D(1) = 0);  T(c) = làmTròn10(S·(21·((c−1)/9)^p − ½)), S = `S_EXP_NGAY` (T(1) = 0).

/** Cấp tối đa của thần thú (trùng `CAP_TOI_DA` của hình thái; viết lại ở đây để tệp này không nhập giao diện). */
const CAP_CUOI = 120

/** S: EXP cho mỗi ngày đạt dùng để dựng đường T (90% EXP/ngày ổn định của em chăm, làm tròn xuống 10). */
export const S_EXP_NGAY = 570

/** `BANG_NGAY_CAP[c]` = số ngày đạt tối thiểu để thú lên cấp c (c = 1…120; chỉ số 0 không dùng). D(10) = 21, D(120) = 1 200. */
export const BANG_NGAY_CAP: readonly number[] = Object.freeze([
  0, 0, 0, 1, 3, 5, 8, 11, 14, 17, 21, 24, 28, 32, 37, 41, 46, 51, 56, 62, 67, 73, 79, 85, 91, 97, 104, 110, 117, 124,
  131, 138, 145, 153, 160, 168, 176, 184, 192, 200, 208, 217, 225, 234, 243, 252, 261, 270, 279, 289, 298, 308, 318, 327, 337, 347, 358, 368, 378, 389,
  399, 410, 421, 432, 442, 454, 465, 476, 487, 499, 510, 522, 534, 546, 558, 570, 582, 594, 606, 619, 631, 644, 656, 669, 682, 695, 708, 721, 734, 747,
  761, 774, 788, 801, 815, 829, 843, 857, 871, 885, 899, 913, 928, 942, 957, 971, 986, 1001, 1015, 1030, 1045, 1060, 1076, 1091, 1106, 1121, 1137, 1152, 1168, 1184,
  1200,
])

/** `BANG_TONG_EXP_V5[c]` = tổng EXP trong thú để ĐẠT cấp c (c = 1…120; chỉ số 0 không dùng). T(2) = 100, T(10) = 11 690, T(120) = 683 720. */
export const BANG_TONG_EXP_V5: readonly number[] = Object.freeze([
  0, 0, 100, 850, 1860, 3070, 4480, 6060, 7790, 9670, 11690, 13830, 16110, 18500, 21010, 23630, 26370, 29200, 32140, 35180,
  38310, 41540, 44870, 48280, 51780, 55370, 59050, 62810, 66660, 70580, 74590, 78670, 82830, 87070, 91390, 95780, 100240, 104780, 109390, 114070,
  118820, 123640, 128530, 133480, 138510, 143600, 148760, 153980, 159260, 164620, 170030, 175510, 181050, 186650, 192310, 198040, 203820, 209670, 215570, 221530,
  227560, 233640, 239770, 245970, 252220, 258530, 264890, 271310, 277790, 284320, 290900, 297540, 304240, 310990, 317790, 324640, 331550, 338500, 345520, 352580,
  359690, 366860, 374070, 381340, 388660, 396030, 403440, 410910, 418430, 425990, 433610, 441270, 448980, 456740, 464550, 472410, 480310, 488260, 496260, 504300,
  512390, 520530, 528710, 536940, 545220, 553540, 561910, 570320, 578770, 587280, 595820, 604420, 613050, 621730, 630460, 639220, 648030, 656890, 665790, 674730,
  683720,
])

const nguyenKhongAm = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? Math.max(0, Math.floor(x)) : 0)

/** Số ngày đạt tối thiểu để lên cấp `cap` (cấp ≤ 1 ⇒ 0; cấp > 120 ⇒ như 120). */
export const ngayDatCanChoCap = (cap: number): number => BANG_NGAY_CAP[Math.min(CAP_CUOI, Math.max(1, Math.round(Number(cap) || 1)))] ?? 0

/** Cấp cao nhất mà `soNgayDat` ngày đạt CHO PHÉP (chưa xét EXP): c lớn nhất có D(c) ≤ số ngày. */
export function capChoPhepTheoNgay(soNgayDat: number): number {
  const n = nguyenKhongAm(soNgayDat)
  let c = 1
  while (c < CAP_CUOI && (BANG_NGAY_CAP[c + 1] ?? Infinity) <= n) c++
  return c
}

/** 1 vàng cho mỗi chừng này EXP VÀO THÚ (đúc theo luỹ kế nên phần lẻ không mất). */
export const EXP_MOI_VANG = 5

/** EXP TRÀN → vàng trong MỘT ngày VN: ⌊(B/EXP_MOI_VANG)·ln(1 + tràn/B)⌋, B = `B_VANG_TRAN`. Vài EXP tràn đầu ≈ 1 vàng / 5 EXP, tới 300 EXP chỉ còn nửa giá. */
export const B_VANG_TRAN = 300
/** EXP TRÀN → mảnh khiên trong MỘT ngày VN: ⌊log₂(1 + tràn/B)⌋, B = `B_MANH_TRAN` (600 ⇒ 1 · 1 800 ⇒ 2 · 4 200 ⇒ 3 …). */
export const B_MANH_TRAN = 600
/** Tổng vàng tràn của một ngày có `tranNgay` EXP tràn (đúc phần chênh `vangTranNgay(tổng) − đã đúc hôm nay`). */
export const vangTranNgay = (tranNgay: number): number => Math.floor((B_VANG_TRAN / EXP_MOI_VANG) * Math.log(1 + nguyenKhongAm(tranNgay) / B_VANG_TRAN))
/** Tổng mảnh tràn của một ngày có `tranNgay` EXP tràn. */
export const manhTranNgay = (tranNgay: number): number => Math.floor(Math.log2(1 + nguyenKhongAm(tranNgay) / B_MANH_TRAN))

/** Khiên rèn: 36 mảnh + 2 600 vàng + ngày đạt ≥ `ngayDatKhien(k)`; giữ tối đa 5 khiên rèn chưa dùng. */
export const MANH_REN_KHIEN = 36
export const VANG_REN_KHIEN = 2600
export const KHIEN_REN_GIU_TOI_DA = 5
/** Khiên đầu cần 36 ngày đạt; mỗi khiên sau cần thêm ít nhất chừng này ngày đạt. */
export const NGAY_DAT_KHIEN_DAU = 36
export const NGAY_DAT_KHIEN_CACH = 18
/** Số ngày đạt tối thiểu để rèn khiên thứ `k` (k ≥ 1): 36 + 18·(k − 1). */
export const ngayDatKhien = (k: number): number => NGAY_DAT_KHIEN_DAU + NGAY_DAT_KHIEN_CACH * (Math.max(1, Math.floor(Number(k) || 1)) - 1)

/** Khoá cấp shop theo bậc (bậc 1–3 không khoá). Món bậc 4 cần thú cấp ≥ 10 (sớm nhất ngày 21), bậc 5 cần cấp ≥ 20 (sớm nhất ngày 67). */
export const CAP_MO_BAC_PHU_KIEN: Readonly<Record<1 | 2 | 3 | 4 | 5, number | null>> = Object.freeze({ 1: null, 2: null, 3: null, 4: 10, 5: 20 })

/**
 * Số vàng ĐÁNG ĐÚC tới giờ của một hồ sơ (luỹ kế, không bao giờ giảm):
 *   vàng thường = ⌊max(0, earned − mocVang − EXP tràn luỹ kế) / EXP_MOI_VANG⌋  (EXP đã kiếm trừ phần tràn = EXP vào thú, cộng EXP chờ mốc v4 đã đúc từ trước);
 *   + vàng tràn luỹ kế (`tranV5.tongVang`).
 * Hồ sơ chưa sang luật vàng tự động (thiếu `mocVang`) ⇒ 0. Hồ sơ v4 (chưa có `tranV5`) ⇒ y hệt công thức v4 (không đúc đôi, không hụt khi chuyển).
 */
export function vangDangDuc(p: { earned?: unknown; mocVang?: unknown; tranV5?: { tongExp?: unknown; tongVang?: unknown } | null }): number {
  if (typeof p.mocVang !== 'number' || !Number.isFinite(p.mocVang)) return 0
  const earned = nguyenKhongAm(p.earned)
  const tran = nguyenKhongAm(p.tranV5?.tongExp)
  const thuong = Math.floor(Math.max(0, earned - nguyenKhongAm(p.mocVang) - tran) / EXP_MOI_VANG)
  return thuong + nguyenKhongAm(p.tranV5?.tongVang)
}
