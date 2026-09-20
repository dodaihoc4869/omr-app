// "THÊM 5 PHÚT" — phía MÀN THI học sinh (docs/hop-dong-them-phut-2109.md mục 2, thầy duyệt 21/09).
// Máy chủ đặt hạn MỘT lượt (`het_gio_luc`); thầy bấm "Thêm 5 phút" ⇒ máy chủ cộng vào hạn của mọi lượt chưa nộp và trả hạn mới trong phản hồi
// `examStatus` (trường `hetGioLuc`, ISO). Máy em CHỈ được nhận khi hạn mới MUỘN HƠN hạn đang giữ ≥ 30 giây. Sớm hơn, bằng, sai kiểu, thiếu trường
// (máy chủ cũ) ⇒ BỎ QUA — đường này KHÔNG BAO GIỜ rút giờ của em. Hàm thuần: không đọc giờ máy, không chạm storage.
export const NGUONG_KEO_DAI_MS = 30_000
/** Dòng báo nhẹ tự tắt sau ngần này mili giây. */
export const MS_HIEN_BAO_THEM_GIO = 12_000

export interface HanKeoDai {
  /** Hạn mới, chuẩn ISO (cùng dạng `hetGioCua` trả). */
  han: string
  /** Số phút được thêm, làm tròn — luôn ≥ 1 vì chỉ nhận khi muộn hơn ≥ 30 s (0,5 phút làm tròn lên 1). Để nói "Thầy cho thêm N phút". */
  themPhut: number
}

const ms = (v: unknown): number | null => {
  if (typeof v !== 'string' || v.trim() === '') return null
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}

/** `hanDangGiu` = hạn máy đang dùng; `hanTuMayChu` = giá trị nhận từ máy chủ (kiểu bất kỳ). Trả null nếu KHÔNG được nhận. */
export function hanMoiNeuKeoDai(hanDangGiu: string, hanTuMayChu: unknown): HanKeoDai | null {
  const cu = ms(hanDangGiu)
  const moi = ms(hanTuMayChu)
  if (cu === null || moi === null) return null
  if (moi - cu < NGUONG_KEO_DAI_MS) return null
  return { han: new Date(moi).toISOString(), themPhut: Math.round((moi - cu) / 60_000) }
}

export const chuBaoThemGio = (themPhut: number): string => `Thầy cho thêm ${themPhut} phút`
