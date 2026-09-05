// LINK BÁO CÁO GỬI PHỤ HUYNH.
//
// Vì sao mã phiếu chứ không nhét dữ liệu vào link: bản đầu (04-09 sáng) nén cả
// phiếu vào sau dấu `#`, được 458 ký tự cho phiếu tóm tắt. Nhưng báo cáo đầy đủ
// có đề bài, đáp án và lời giải của từng câu sai thì link phình lên vài nghìn ký
// tự, dán vào Zalo thành một khối xanh khổng lồ và dễ đứt khi chuyển tiếp.
//
// Nay báo cáo nằm trên Apps Script, link chỉ mang MÃ 16 KÝ TỰ ngẫu nhiên
// (~96 bit, sinh bằng crypto.getRandomValues ở máy thầy). Đổi lại được đúng thứ
// cần: **thu hồi được** — thầy xoá mã là link đã gửi chết ngay.
//
// Mã vẫn đặt SAU DẤU `#`: phần sau `#` trình duyệt không gửi lên máy chủ, nên
// mã không rơi vào log của GitHub Pages lẫn bộ đọc link của Zalo. Chỉ đúng
// trang báo cáo đọc nó rồi hỏi Apps Script.

/** Định dạng mã phiếu — dùng chung cho cả bên sinh mã và bên đọc link. */
export const RE_MA_PHIEU = /^[A-Za-z0-9_-]{8,40}$/

/** SỐ CÂU GẮN VÀO LINK (thầy chốt 04-09 tối).
 *
 * Phụ huynh tự chọn con mình làm bao nhiêu câu, 10 đến 40. Phiếu trên máy chủ
 * chỉ cất MỘT bản đầy đủ; số câu đi kèm trong link sau dấu `~`, trang phiếu đọc
 * ra rồi lấy đúng bấy nhiêu câu đầu. Nhờ vậy đổi số câu KHÔNG phải ghi thêm
 * phiếu nào lên máy chủ — mà trang phiếu thì không có mã bí mật để ghi.
 *
 * Dấu `~` không nằm trong bảng chữ sinh mã nên không lẫn với mã. */
export const SO_CAU_MIN = 10
/** Thầy chốt 06/09: cho em tạo tới 60 câu khắc phục lỗi sai. */
export const SO_CAU_MAX = 60

export function chanSoCau(n: unknown): number {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return SO_CAU_MIN
  return Math.max(SO_CAU_MIN, Math.min(SO_CAU_MAX, v))
}

/** Link để dán vào tin nhắn Zalo. `goc` là gốc app, ví dụ
 * `https://dodaihoc4869.github.io/omr-app/`. */
export function taoLinkPhieu(goc: string, ma: string, soCau?: number | null, cheDo?: CheDoPhieu): string {
  const g = goc.endsWith('/') ? goc : goc + '/'
  return `${g}p#${ma}${soCau ? `~${chanSoCau(soCau)}${cheDo === 'de' ? 'd' : cheDo === 'giai' ? 'g' : ''}` : ''}`
}

/** HAI LINK CHO CON (thầy chốt 04-09 khuya): một link CHỈ CÓ ĐỀ để em tự làm,
 * một link CÓ LỜI GIẢI để em dò sau khi làm xong. Cùng một phiếu trên máy chủ,
 * khác nhau ở chữ cuối link: `~20d` là đề, `~20g` là lời giải. Link cũ chỉ có
 * `~20` (hoặc không có `~`) vẫn mở như trước: phiếu ôn gập sẵn lời giải. */
export type CheDoPhieu = 'de' | 'giai'

/** Đọc mã từ phần hash của địa chỉ. Trả '' khi không phải mã hợp lệ — trang báo
 * cáo báo "link hỏng" chứ không hỏi máy chủ bằng rác. */
export function docMaTuHash(hash: string): string {
  return docLinkPhieu(hash).ma
}

/** Đọc cả mã lẫn số câu. `soCau = null` nghĩa là link không ghi số — lấy trọn
 * phiếu như trước. */
export function docLinkPhieu(hash: string): { ma: string; soCau: number | null; cheDo: CheDoPhieu } {
  const s = (hash || '').trim().replace(/^#/, '')
  const i = s.indexOf('~')
  const ma = i >= 0 ? s.slice(0, i) : s
  const duoi = i >= 0 ? s.slice(i + 1) : ''
  if (!RE_MA_PHIEU.test(ma)) return { ma: '', soCau: null, cheDo: 'giai' }
  const m = /^(\d{1,3})([dg]?)$/.exec(duoi)
  if (!m) return { ma, soCau: null, cheDo: 'giai' }
  return { ma, soCau: chanSoCau(m[1]), cheDo: m[2] === 'd' ? 'de' : 'giai' }
}
