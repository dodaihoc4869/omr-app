// Nhớ «em đang làm dở chặng nào» của Kiểm tra ôn tập trên máy, để tải lại app (hoặc Pages đổi bản) giữa chặng vẫn đưa em về đúng chặng.
// Lỗi 26/10 (em 12095, 12092): em bấm Làm chặng 1 rồi tải lại; màn kiểm tra là lớp phủ do `tab` giữ trong bộ nhớ nên tải lại là về trang chủ,
// đồng hồ chặng vẫn chạy ở máy chủ, em đi làm bài khác tới hết giờ ⇒ chặng 1 «mất» với 0 câu lưu. Chỉ NHỚ ý định mở lại, không đổi giờ, không ghi câu trả lời:
// mở lại vẫn qua `hoc-tap-ktcn-start` (INSERT OR IGNORE giữ nguyên giờ bắt đầu và hạn của chặng).
export const khoaKtcnDangLam = (sbd: string) => `ktcn:lam:${sbd}`

export interface KtcnDangLam { id: string; stt: number; han: number }

export function ghiKtcnDangLam(sbd: string, id: string, stt: number, han: number) {
  try { localStorage.setItem(khoaKtcnDangLam(sbd), JSON.stringify({ id, stt, han })) } catch { /* máy chặn bộ nhớ: chỉ mất tính năng tự quay lại */ }
}

export function xoaKtcnDangLam(sbd: string) {
  try { localStorage.removeItem(khoaKtcnDangLam(sbd)) } catch { /* như trên */ }
}

/** Chặng em đang làm dở của đúng bài `id` và CHƯA hết hạn theo giờ máy; không có / hỏng / hết hạn ⇒ null (hỏng hoặc hết hạn thì dọn luôn). */
export function docKtcnDangLam(sbd: string, id: string, bayGio: number): KtcnDangLam | null {
  try {
    const raw = localStorage.getItem(khoaKtcnDangLam(sbd))
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<KtcnDangLam> | null
    if (!v || v.id !== id) return null
    if (!Number.isInteger(v.stt) || typeof v.han !== 'number' || v.han <= bayGio) { xoaKtcnDangLam(sbd); return null }
    return { id, stt: v.stt as number, han: v.han }
  } catch { return null }
}
