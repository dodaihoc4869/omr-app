// KHUNG CHAT LUÔN HIỆN BÊN PHẢI MÁY THẦY (thầy duyệt bản vẽ 55–59 ngày 13/11: «thêm một khung chat bên phải luôn hiện để đọc tin nhắn của học sinh … không
// làm ảnh hưởng tới bố cục phần chiếu cho hs»). HÌNH HỌC, thuần: cột rộng `c` ở mép phải; phần chiếu (lớp phủ tờ, kín cửa sổ) THU ĐỀU hệ số `s` về góc
// trên-trái ⇒ tỉ lệ rộng / cao của bảng không đổi ⇒ `tiLe` tờ gửi máy em không đổi ⇒ máy em thấy y như khi không có cột. Dải cao `d` còn dư dưới phần chiếu
// chứa các thẻ chỉ thầy thấy (giơ tay, xin vào lại) để chúng không đè lên bảng.
/** Cửa sổ nhỏ hơn cỡ này ⇒ không dựng cột cố định (giữ cột nổi bấm M như cũ). 13/11 lần 2 (thầy «chưa thấy cột nhắn tin trên app thầy»): hạ ngưỡng từ
 *  1024 × 600 xuống 880 × 480 — cửa sổ trình duyệt trên máy xách tay (thanh công cụ, thanh dấu trang, thu phóng) thường thấp hơn 600 px. */
export const COT_MAN_RONG = 880, COT_MAN_CAO = 480
export interface HinhCot { /** bề ngang cột (px) */ c: number; /** hệ số thu phần chiếu */ s: number; /** bề cao dải dưới phần chiếu (px) */ d: number }
/** `x` = mép trái của lớp phủ tờ (thanh bên trái của app đang mở thì tờ không bắt đầu từ 0). */
export function hinhCot(w: number, h: number, x = 0): HinhCot | null {
  if (!(w >= COT_MAN_RONG) || !(h >= COT_MAN_CAO)) return null
  const c = Math.round(Math.min(340, Math.max(232, w * 0.2))), rong = Math.max(1, w - x), s = (rong - c) / rong
  return { c, s, d: Math.round(h - h * s) }
}
/** Vùng phần chiếu lúc này (LopNoiThay ghi `--lkc-w` / `--lkc-s` ở gốc trang khi cột đang dựng) — máy tính nổi và các lớp bám theo phần chiếu dùng. */
export function vungChieu(): { w: number; h: number } {
  const w = window.innerWidth, h = window.innerHeight, g = typeof document !== 'undefined' ? document.documentElement.style : null
  const c = parseFloat(g?.getPropertyValue('--lkc-w') ?? '') || 0, s = parseFloat(g?.getPropertyValue('--lkc-s') ?? '') || 1
  return c ? { w: w - c, h: h * s } : { w, h }
}
/** Sự kiện cửa sổ phát khi cột cố định vừa dựng / gỡ / đổi cỡ. */
export const SK_COT = 'ddh-lk-cot'
