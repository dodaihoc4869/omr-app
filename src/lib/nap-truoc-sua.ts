// NẠP TRƯỚC CÂU SỬA KẾ TIẾP (thầy 29/10, video 08:25 «Mở câu quá lâu»: «Đang mở câu…» ~3,3 s mỗi lần bấm một câu ở Tự sửa lỗi).
// Việc hôm nay đã biết câu CHƯA XONG kế tiếp ⇒ lúc em còn đang xem danh sách / đang làm câu trước, máy em đã mở sẵn câu ấy ở máy chủ (cùng lệnh `mo-dot` kèm bản làm lại như khi bấm thật).
// Bấm vào ⇒ dùng ngay kết quả đã về (hoặc đang về), không còn màn chờ.
// An toàn: `mo-dot` là lệnh MỞ (không chấm, không ghi tiến độ của em — chỉ giao đợt nếu chưa có, đã có thì không đổi gì); đề về chỉ là đề công khai, đáp án vẫn chỉ ra sau khi nộp.
// Dùng MỘT lần rồi bỏ (lần mở lại sau khi làm / lần «Thử lại» luôn hỏi tươi ⇒ số «lần làm» không bao giờ cũ); quá hạn HAN_NAP_TRUOC_MS ⇒ bỏ. Chỉ nạp kết quả `ok` — lỗi không nằm lại.
// Nơi gọi: màn Tự sửa lỗi (câu kế của Việc hôm nay, loại câu đang mở) và Lộ trình (câu đầu tiên chưa xong). Mảnh nạp lười — không cộng byte lượt mở cổng.
import { apiMoDot } from './chua-cau-sai-api'

type KetQuaMo = Awaited<ReturnType<typeof apiMoDot>>
/** Tuổi tối đa của kết quả nạp trước (ms) — bằng hạn đệm câu của máy chủ (server/src/chua-gon-nho.ts). */
export const HAN_NAP_TRUOC_MS = 3 * 60_000
/** Số câu nạp trước giữ cùng lúc. */
const TOI_DA = 3
const KHO = new Map<string, { p: Promise<KetQuaMo>; luc: number; kq?: KetQuaMo }>()
const khoa = (token: string, qid: string) => `${token}|${qid}`

/** Bắt đầu mở sẵn câu `qid` (không chờ). Đã có bản còn mới ⇒ không làm gì. */
export function napTruocCauSua(token: string, qid: string, nayMs = Date.now()): void {
  if (!token || !qid) return
  const k = khoa(token, qid)
  const co = KHO.get(k)
  if (co && nayMs - co.luc < HAN_NAP_TRUOC_MS) return
  const p = apiMoDot(token, qid, undefined, false, true).catch((): KetQuaMo => ({ ok: false }))
  KHO.delete(k)
  KHO.set(k, { p, luc: nayMs })
  while (KHO.size > TOI_DA) KHO.delete(KHO.keys().next().value as string)
  // Kết quả lỗi không nằm lại: lần bấm thật sẽ hỏi tươi. Kết quả tốt được giữ kèm bản ĐÃ VỀ (`kq`) để màn sửa câu dựng thẳng ở lần vẽ đầu (xem `layNapTruocCauSuaNgay`).
  void p.then((r) => { const e = KHO.get(k); if (e?.p !== p) return; if (r.ok) e.kq = r; else KHO.delete(k) })
}

/** Kết quả nạp trước ĐÃ VỀ và còn mới ⇒ trả ĐỒNG BỘ (và bỏ); chưa về / hết hạn ⇒ null (nơi gọi dùng `layNapTruocCauSua`). Màn sửa câu dựng ngay ở lần vẽ đầu — không khung chờ (29/10, video 11:00 «khựng chỗ mở câu»). */
export function layNapTruocCauSuaNgay(token: string, qid: string, nayMs = Date.now()): KetQuaMo | null {
  const k = khoa(token, qid)
  const co = KHO.get(k)
  if (!co?.kq || nayMs - co.luc >= HAN_NAP_TRUOC_MS) return null
  KHO.delete(k)
  return co.kq
}

/** Lấy (và bỏ) kết quả nạp trước của câu `qid` còn mới; không có ⇒ null (nơi gọi hỏi tươi). Có thể còn đang về — chờ `await`. */
export function layNapTruocCauSua(token: string, qid: string, nayMs = Date.now()): Promise<KetQuaMo> | null {
  const k = khoa(token, qid)
  const co = KHO.get(k)
  if (!co) return null
  KHO.delete(k)
  return nayMs - co.luc < HAN_NAP_TRUOC_MS ? co.p : null
}

/** Bỏ mọi kết quả nạp trước (em vừa làm xong một câu / đổi tài khoản / test). */
export function xoaNapTruocCauSua(): void { KHO.clear() }
