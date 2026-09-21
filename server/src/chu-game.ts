// APP PHỤ HUYNH KHÔNG CÒN GÌ CỦA GAME (thầy lệnh 21/09, prompt-ph-giao-them-bai-2109.md mục B): tin/thư cho phụ huynh do MÁY CHỦ sinh (bài tin `parent-news`, nhắc nộp, thông báo, lời Bộ não A.I cho phụ huynh
// và thư tuần) CẤM nhắc thần thú, EXP, khiên, mảnh khiên, game, Đoàn Hộ Tống, Đảo thần thú, Võ đài. Đây là LỚP PHÒNG THỦ ở máy chủ (khuôn của Code 1 cũng chặn từ cấm lúc nộp); test quét mọi mẫu chữ.
// Điều KHÔNG cấm (giữ): điểm, số câu, lên bậc, dạng con vấp, lịch ôn, bài tập về nhà, hạn nộp, "Vinh danh hôm nay".
const MAU: readonly RegExp[] = [
  /thần\s*thú/i,
  /\bEXP\b/,
  /khiên/i,
  /mảnh\s*khiên/i,
  /\bgame\b/i,
  /trò\s*chơi/i,
  /đoàn\s*hộ\s*tống/i,
  /đảo\s*thần/i,
  /võ\s*đài/i,
]

/** Các cụm chữ game xuất hiện trong `chu` (rỗng = sạch). */
export function chuGameTrong(chu: string): string[] {
  const ra: string[] = []
  for (const m of MAU) {
    const k = m.exec(chu)
    if (k) ra.push(k[0])
  }
  return ra
}

export const coChuGame = (chu: string): boolean => chuGameTrong(chu).length > 0
