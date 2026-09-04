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

/** Link để dán vào tin nhắn Zalo. `goc` là gốc app, ví dụ
 * `https://dodaihoc4869.github.io/omr-app/`. */
export function taoLinkPhieu(goc: string, ma: string): string {
  const g = goc.endsWith('/') ? goc : goc + '/'
  return `${g}p#${ma}`
}

/** Đọc mã từ phần hash của địa chỉ. Trả '' khi không phải mã hợp lệ — trang báo
 * cáo báo "link hỏng" chứ không hỏi máy chủ bằng rác. */
export function docMaTuHash(hash: string): string {
  const s = (hash || '').trim().replace(/^#/, '')
  return RE_MA_PHIEU.test(s) ? s : ''
}
