// Câu nói khi em chạm TRẦN CÂU trong ngày. Thầy lệnh 19:30: trần Đoàn Hộ Tống (60 câu) và trần Đảo thần thú (36 câu) TÁCH RIÊNG hẳn — Đảo hết không ảnh hưởng Đoàn và ngược lại.
// KHÔNG viết cứng con số trên màn: trần + số đã dùng do máy chủ gửi (`tranNgay`, `dailyUsed`): `recommendations` = số của ĐẢO, `doan-sanh` = số của ĐOÀN; máy chủ cũ chưa gửi ⇒ câu KHÔNG số.
// `doan-sanh` còn gửi `changHomNay {daDi, toiDa}` (chặng/ngày, máy chủ chốt 6). THUẦN, không React.

export interface LuotCauNgay {
  /** `dailyUsed` của máy chủ: số LƯỢT trả lời hôm nay của ĐÚNG game đang xem (máy chủ đếm lượt, nên có thể hơn số câu em nhớ). */
  daDung?: number
  /** `tranNgay` của máy chủ: trần lượt/ngày của game ấy. */
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

/** Có đủ cả hai số VÀ đã chạm trần ⇒ hết lượt; thiếu số (máy chủ cũ) ⇒ false: màn KHÔNG tự khoá, máy chủ từ chối thì lỗi hiện cạnh nút. */
export const daChamTran = (l: LuotCauNgay | null | undefined): boolean => !!l && l.tran !== undefined && l.tran > 0 && l.daDung !== undefined && l.daDung >= l.tran

/** Đoàn: "Hôm nay em đã đi 60/60 câu Đoàn Hộ Tống — mai mình đi tiếp nhé." / máy chủ cũ (không số). */
export function chuHetLuotDoan(l?: LuotCauNgay | null): string {
  const so = soDaChoiTrenTran(l)
  return so ? `Hôm nay em đã đi ${so} câu Đoàn Hộ Tống — mai mình đi tiếp nhé.` : 'Em đã đi đủ số câu Đoàn Hộ Tống của hôm nay — mai mình đi tiếp nhé.'
}

/** Đảo: số của ĐẢO, kết bằng chuyến mới của đảo. */
export function chuHetLuotDao(l?: LuotCauNgay | null): string {
  const so = soDaChoiTrenTran(l)
  return so ? `Hôm nay em đã đi ${so} câu Đảo thần thú. Mai đảo có chuyến mới.` : 'Em đã đi đủ số câu Đảo thần thú của hôm nay. Mai đảo có chuyến mới.'
}

export interface ChangHomNay {
  /** Số chặng Đoàn em đã đi hôm nay. */
  daDi: number
  /** Trần chặng/ngày (máy chủ chốt; hiện 6). */
  toiDa: number
}

/** `changHomNay` của `doan-sanh`: chỉ nhận khi cả hai số nguyên hợp lệ và trần > 0; vắng / hỏng ⇒ null (máy chủ cũ hoặc thiếu bảng: không hiện số chặng). */
export function docChangHomNay(r: { changHomNay?: unknown } | null | undefined): ChangHomNay | null {
  const c = r?.changHomNay
  if (typeof c !== 'object' || c === null) return null
  const daDi = soNguyen((c as { daDi?: unknown }).daDi), toiDa = soNguyen((c as { toiDa?: unknown }).toiDa)
  return daDi !== undefined && toiDa !== undefined && toiDa > 0 ? { daDi, toiDa } : null
}

export const daHetChang = (c: ChangHomNay | null | undefined): boolean => !!c && c.daDi >= c.toiDa
/** "Đã đi 2/6 chặng hôm nay". */
export const chuChangHomNay = (c: ChangHomNay): string => `Đã đi ${Math.min(c.daDi, c.toiDa)}/${c.toiDa} chặng hôm nay`
/** Lý do khoá khi đủ chặng (số do máy chủ nói). */
export const chuHetChang = (c: ChangHomNay): string => `Hôm nay em đã đi đủ ${c.toiDa} chặng — mai mình đi tiếp nhé.`

/** Máy chủ báo `hetCauMoi`: hôm nay hết câu MỚI, bộ có câu em từng làm lâu rồi — máy nói thật. */
export const CHU_HET_CAU_MOI = 'Hôm nay hết câu mới cho em, có vài câu em từng làm lâu rồi.'
