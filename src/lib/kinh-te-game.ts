// KINH TẾ GAME — MỘT NGUỒN cho máy chủ và giao diện (luật EXP mới, thầy chốt 29/09/2026: docs/DE-XUAT-EXP-2909.md). Cấm rải các số này ra chỗ khác.
//
// Nạp tự do: mọi EXP em kiếm vào thần thú NGAY lúc ghi sổ (bỏ ống nghiệm, bỏ nút nạp, bỏ trần hấp thụ 200/120/0).
// Vàng tự động: cứ `EXP_MOI_VANG` EXP em KIẾM được thì được 1 vàng; thần thú vẫn nhận đủ 100% EXP. Bỏ đổi tay EXP → vàng và bỏ mức giữ lại 400 EXP.

/** 1 vàng cho mỗi chừng này EXP em kiếm (vàng đúc = floor(EXP đã kiếm từ mốc / 5) − vàng đã đúc; phần lẻ không mất). */
export const EXP_MOI_VANG = 5
/** KHOÁ MỐC: thần thú chỉ lên được cấp `CAP_KHOA_MOC` khi em có ≥ `NGAY_DAT_MO_CAP_10` ngày đạt nhiệm vụ ngày. EXP vượt mốc để "chờ mốc", đủ ngày thì vào thú (không mất). */
export const CAP_KHOA_MOC = 10
export const NGAY_DAT_MO_CAP_10 = 21
/** Khiên rèn: 21 mảnh + 21 ngày đạt + 1 400 vàng; không cần cấp 10; giữ tối đa 5 khiên rèn chưa dùng. */
export const VANG_REN_KHIEN = 1400
export const MANH_REN_KHIEN = 21
export const KHIEN_REN_GIU_TOI_DA = 5

/** Số vàng ĐÁNG ĐÚC tới giờ của một hồ sơ: `floor(max(0, EXP đã kiếm − mốc vàng) / EXP_MOI_VANG)`. Hồ sơ chưa sang luật mới (thiếu `mocVang`) ⇒ 0. */
export function vangDangDuc(p: { earned?: unknown; mocVang?: unknown }): number {
  if (typeof p.mocVang !== 'number' || !Number.isFinite(p.mocVang)) return 0
  const earned = typeof p.earned === 'number' && Number.isFinite(p.earned) ? p.earned : 0
  return Math.floor(Math.max(0, Math.floor(earned) - Math.max(0, Math.floor(p.mocVang))) / EXP_MOI_VANG)
}
