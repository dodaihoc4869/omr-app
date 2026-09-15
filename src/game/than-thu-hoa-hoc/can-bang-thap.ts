/**
 * CÂN BẰNG THÁP 999 TẦNG.
 *
 * Thầy chốt 15-09: *"nâng tầng tháp lên 999 tầng, diệt bot cũng lên 999 con
 * bot"*.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * VÌ SAO KHÔNG CHỈ ĐỔI MỘT CON SỐ. Đo bằng đúng công thức cũ, kéo thẳng lên
 * 999 tầng / 120 cấp thì tháp VỠ ở hai chỗ:
 *
 *   cấp  12 · tầng  25 → công 786   · máu trùm    532 → hạ trùm bằng 1 CÂU
 *   cấp  60 · tầng 500 → công 3 090 · máu trùm  9 082 → 3 câu
 *   cấp 120 · tầng 999 → công 5 970 · máu trùm 18 064 → 4 câu
 *
 * Tức là từ tầng ~25 trở đi, đúng một câu đúng là xong một tầng: tháp mất hết
 * sức nặng, và em cày một buổi tối là hết 999 tầng.
 *
 * Và EXP còn tệ hơn: leo hết 999 tầng với `30 + 6×tầng` cho 3 026 970 EXP —
 * gấp 200 lần cả đường 12 cấp cũ. Tháp thành máy in EXP.
 *
 * BẢN NÀY sửa cả hai:
 *   · máu trùm BÁM THEO SỨC THÚ ở cấp em thường có tại tầng ấy ⇒ tầng nào
 *     cũng tốn ~5 câu đúng, từ tầng 1 tới tầng 999;
 *   · EXP lần đầu hạ một tầng mới mới trả đủ, leo lại tầng cũ chỉ 12%
 *     (xem `NGUON_EXP.leoThapLai`).
 */

import { CAP_TOI_DA } from './hinh-thai'
import { DS_HE, TEN_HE_NGAN, type HeNguyenTo } from './tuong-khac'

export const TANG_TOI_DA = 999

/** Số câu đúng cần để hạ một tầng. Giữ nguyên ở mọi tầng — đây là điểm chốt. */
export const SO_CAU_HA_TRUM = 5
/** Máu trùm = SO_CAU_HA_TRUM × công, trừ hao một chút cho tương khắc. */
const HE_SO_MAU = 4.2

/**
 * Em thường ở cấp nào khi tới tầng N.
 *
 * ~1 cấp mỗi 8,4 tầng: tầng 999 ứng cấp 120. Đây là GIẢ ĐỊNH để định máu trùm,
 * không phải luật — em học chăm thì cấp cao hơn tầng, và trùm sẽ dễ đi, đúng
 * như phần thưởng cho việc học.
 */
export function capTheoTang(tang: number): number {
  const t = Math.max(1, Math.min(TANG_TOI_DA, Math.round(tang)))
  return Math.max(1, Math.min(CAP_TOI_DA, Math.round(1 + (t - 1) / 8.4)))
}

/**
 * HỆ SỐ TIẾN HOÁ dùng cho chỉ số thú.
 *
 * Cũ là `1 + (cap − 1) × 0,25`: đúng với 12 cấp (×3,75) nhưng với 120 cấp ra
 * ×30,75 — thú một phát giết mọi trùm. Nay dùng luỹ thừa 0,85 để đường cong
 * thoải dần: cấp 12 ra ×1,45, cấp 60 ra ×2,9, cấp 120 ra ×4,3.
 */
export function heSoTienHoa(capTienHoa: number): number {
  const c = Math.max(1, Math.min(CAP_TOI_DA, Math.round(capTienHoa)))
  return 1 + Math.pow(c - 1, 0.85) * 0.055
}

/** Công thú ở một cấp, KHÔNG tính hệ số học tập — dùng để định máu trùm. */
export function congNenTheoCap(capDo: number): number {
  const c = Math.max(1, Math.min(CAP_TOI_DA, Math.round(capDo)))
  // 1,6 là hệ số học tập trung bình (điểm 7,5 + nộp đủ bài); dùng làm mốc để
  // định máu trùm, chứ chỉ số thật của em vẫn tính riêng trong `tinhLucChienPet`.
  return Math.round((30 + c * 6) * 1.6 * heSoTienHoa(c))
}

/** Máu trùm tầng N — bám theo sức thú, nên tầng nào cũng tốn ~5 câu. */
export function mauTrumTang(tang: number): number {
  const t = Math.max(1, Math.min(TANG_TOI_DA, Math.round(tang)))
  const co = laTangCanh(t) ? HE_SO_MAU * 1.6 : HE_SO_MAU
  return Math.round(co * congNenTheoCap(capTheoTang(t)))
}

/** Cứ mỗi 50 tầng là một TẦNG CANH: trùm dày máu hơn, thưởng gấp đôi. */
export function laTangCanh(tang: number): boolean {
  const t = Math.round(tang)
  return t > 0 && t % 50 === 0
}

/**
 * Sát thương trùm giáng lên thú khi em trả lời sai.
 *
 * Cũ là `28 + tầng × 3`: tầng 999 ra 3 025 sát thương một đòn, thú cấp 120 chỉ
 * có ~4 800 máu ⇒ sai hai câu là chết. Nay cũng bám theo sức thú: mỗi đòn ăn
 * ~18% máu tối đa, tức sai 5 câu là kiệt sức, ở mọi tầng.
 */
export function satThuongTrum(tang: number, mauToiDaThu: number): number {
  const co = laTangCanh(tang) ? 0.24 : 0.18
  return Math.max(1, Math.round(mauToiDaThu * co))
}

/**
 * HỆ CỦA TRÙM TẦNG N — chạy đủ SÁU hệ.
 *
 * Bản cũ chỉ có bốn: `['khi','kiem','axit','hoa']`. Nghĩa là trùm hệ Điện hoá
 * và hệ Hữu cơ CHƯA TỪNG xuất hiện lần nào trong cả cái tháp — em chọn Lôi Kim
 * Thú hay Mộc Tinh thì mất hẳn một nửa vòng tương khắc.
 */
export function heTrumTang(tang: number): HeNguyenTo {
  const t = Math.max(1, Math.round(tang))
  return DS_HE[(t - 1) % DS_HE.length]!
}

/** Mười hai BẬC trùm, mỗi bậc ~83 tầng. */
export const TEN_BAC_TRUM: readonly string[] = [
  'Quái Hoá Hắc Ám', 'Tà Linh Phản Ứng', 'Ác Quỷ Kết Tủa', 'Hung Thần Ăn Mòn',
  'Bạo Chúa Xúc Tác', 'Ma Vương Điện Phân', 'Cổ Thần Trùng Hợp', 'Tử Thần Oxi Hoá',
  'Hủy Diệt Giả Hạt Nhân', 'Thiên Kiếp Nguyên Tố', 'Vô Cực Chi Chủ', 'Chúa Tể Nguyên Tố',
] as const

export function bacTrum(tang: number): number {
  const t = Math.max(1, Math.min(TANG_TOI_DA, Math.round(tang)))
  return Math.min(TEN_BAC_TRUM.length, Math.floor((t - 1) / (TANG_TOI_DA / TEN_BAC_TRUM.length)) + 1)
}

/**
 * Tên trùm tầng N. 12 bậc × 6 hệ = **72 tên khác nhau**, cộng nhãn tầng canh —
 * không phải một cái tên lặp 999 lần.
 */
export function tenTrumTang(tang: number): string {
  const b = bacTrum(tang)
  const ten = `${TEN_BAC_TRUM[b - 1]} hệ ${TEN_HE_NGAN[heTrumTang(tang)]}`
  return laTangCanh(tang) ? `⚔ ${ten} (Tầng Canh)` : ten
}

/** VÙNG SAO của tầng: 0 sao ở đáy, 2 sao ở đỉnh. Trả về mục tiêu 0…2 liên tục. */
export function saoMucTieuTheoTang(tang: number): number {
  const t = Math.max(1, Math.min(TANG_TOI_DA, Math.round(tang)))
  return ((t - 1) / (TANG_TOI_DA - 1)) * 2
}
