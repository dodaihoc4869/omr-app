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
/** Số câu MẶC ĐỊNH khi chưa biết em sai mấy câu. KHÔNG còn là sàn cứng — xem
 * `sanSoCau`. */
export const SO_CAU_MIN = 10
/** Thầy chốt 06/09: cho em tạo tới 60 câu khắc phục lỗi sai. */
export const SO_CAU_MAX = 60
/** Sàn tuyệt đối của link. Dưới 1 câu thì phiếu rỗng. */
export const SO_CAU_SAN = 1

/** SÀN CỦA THANH KÉO — thầy chốt 07/09:
 *
 *   "tất cả các thanh kéo đều phải cho chọn tối thiểu bằng với số câu sai
 *    trong ca thi… em sai 3 câu thì cho kéo tối thiểu 3 câu khắc phục"
 *
 * Em sai 3 câu thì ít nhất phải có 3 câu khắc phục, mỗi câu sai một câu. Sàn 10
 * cứng của bản cũ bắt em sai 3 câu vẫn phải nhận 10 câu, và bắt em sai 16 câu
 * nhận được tối thiểu chỉ 10 — thiếu 6 câu sai không ai chữa.
 *
 * Kho không đủ hàng thì sàn tụt theo `coSan`: không hứa cái không có. */
export function sanSoCau(soCauSai: number, coSan: number): number {
  const sai = Math.max(0, Math.floor(Number(soCauSai) || 0))
  const co = Math.max(0, Math.floor(Number(coSan) || 0))
  if (co <= 0) return SO_CAU_SAN
  return Math.max(SO_CAU_SAN, Math.min(sai || SO_CAU_MIN, co))
}

/** Chặn số câu vào khoảng cho phép. `san` là sàn động của màn đang gọi; thiếu
 * thì lấy `SO_CAU_SAN` vì hàm này còn dùng để ĐỌC LINK, mà link do máy khác
 * sinh ra có thể mang số nhỏ hơn 10 một cách hợp lệ. */
export function chanSoCau(n: unknown, san: number = SO_CAU_SAN): number {
  const s = Math.max(SO_CAU_SAN, Math.floor(Number(san) || SO_CAU_SAN))
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return Math.max(s, Math.min(SO_CAU_MAX, SO_CAU_MIN))
  return Math.max(s, Math.min(SO_CAU_MAX, v))
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
