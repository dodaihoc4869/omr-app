// Câu nói khi em đã chạm TRẦN CÂU GAME trong ngày (Đảo + Đoàn dùng chung một trần; máy chủ `game-v2-luot.ts` TRAN_CAU_GAME_NGAY, thầy đã đổi 200 → 60).
// KHÔNG viết cứng con số trên màn: trần do máy chủ gửi (`tranNgay`, cùng `dailyUsed` ở lệnh `recommendations`); máy chủ cũ chưa gửi ⇒ câu KHÔNG số. THUẦN, không React.

export interface LuotCauNgay {
  /** `dailyUsed` của máy chủ: số LƯỢT trả lời game hôm nay (máy chủ đếm lượt, nên có thể hơn số câu em nhớ). */
  daDung?: number
  /** `tranNgay` của máy chủ: trần lượt/ngày. */
  tran?: number
}

const soNguyen = (v: unknown): number | undefined => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : undefined)

/** Đọc hai số máy chủ gửi (thiếu / hỏng ⇒ vắng từng số, không đoán). */
export function docLuotCauNgay(r: { dailyUsed?: unknown; tranNgay?: unknown } | null | undefined): LuotCauNgay {
  const tran = soNguyen(r?.tranNgay)
  return { daDung: soNguyen(r?.dailyUsed), tran: tran !== undefined && tran > 0 ? tran : undefined }
}

/** "60/60" khi máy chủ nói trần VÀ em đã chạm trần (đã dùng ≥ trần); còn lại ⇒ null (câu không số — không viết số sai). */
export function soDaChoiTrenTran(l: LuotCauNgay | null | undefined): string | null {
  if (!l || l.tran === undefined || l.tran <= 0 || l.daDung === undefined || l.daDung < l.tran) return null
  return `${l.tran}/${l.tran}`
}

/** Đoàn: "Hôm nay em đã chơi 60/60 câu game — mai mình đi tiếp nhé." / máy chủ cũ: "Em đã chơi đủ số câu game của hôm nay — mai mình đi tiếp nhé." */
export function chuHetLuotDoan(l?: LuotCauNgay | null): string {
  const so = soDaChoiTrenTran(l)
  return so ? `Hôm nay em đã chơi ${so} câu game — mai mình đi tiếp nhé.` : 'Em đã chơi đủ số câu game của hôm nay — mai mình đi tiếp nhé.'
}

/** Đảo: cùng ý, kết bằng chuyến mới của đảo. */
export function chuHetLuotDao(l?: LuotCauNgay | null): string {
  const so = soDaChoiTrenTran(l)
  return so ? `Hôm nay em đã chơi ${so} câu game. Mai đảo có chuyến mới.` : 'Em đã chơi đủ số câu game của hôm nay. Mai đảo có chuyến mới.'
}
