// Máy chủ từ chối `answer` GIỮA lượt vì em đã chạm TRẦN CÂU game trong ngày (Đảo 36 / Đoàn 60 — tách riêng, thầy lệnh 19:30): lời "Em đã hoàn thành 36 câu hôm nay".
// Thầy 20:28: em chơi Đảo "không nộp được bài" — lời lỗi chỉ hiện ở ĐẦU màn, em đang ở cuối màn bấm nộp không thấy gì. Màn nay hiện lỗi NGAY TRÊN nút nộp và, khi đúng là hết trần,
// thay nút nộp bằng thẻ rõ ràng + "Về đảo" (nút nộp bấm mãi cũng vô ích). Code 3 sẽ thêm mã `het_tran`; trước đó nhận theo LỜI ("N câu … hôm nay"). THUẦN.

export const MA_HET_TRAN = 'het_tran'
export const CHU_HET_TRAN_DAO = 'Hôm nay em đã chơi đủ câu ở Đảo. Mai đảo có chuyến mới.'
export const CHU_HET_TRAN_GAME = 'Hôm nay em đã chơi đủ câu game. Mai mình chơi tiếp nhé.'

/** Lời / mã lỗi này là "hết trần câu trong ngày" chưa. Mã `het_tran` (khi máy chủ có) thắng; không có mã ⇒ nhận theo lời "<số> câu … hôm nay". */
export function laLoiHetTran(loi: string | null | undefined, ma?: string | null): boolean {
  if (ma === MA_HET_TRAN) return true
  return /\d+\s*câu(\s+game)?\s+hôm nay/i.test(String(loi ?? ''))
}

/** Mã lỗi (nếu máy chủ gửi) mà lớp gọi mạng gắn vào Error; không có ⇒ ''. */
export function maCuaLoi(e: unknown): string {
  const ma = (e as { ma?: unknown } | null)?.ma
  return typeof ma === 'string' ? ma : ''
}
