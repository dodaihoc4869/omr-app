// KHUNG CHAT LUÔN HIỆN BÊN PHẢI MÁY THẦY (thầy duyệt bản vẽ 55–59 ngày 13/11: «thêm một khung chat bên phải luôn hiện để đọc tin nhắn của học sinh … không
// làm ảnh hưởng tới bố cục phần chiếu cho hs»). HÌNH HỌC, thuần: cột rộng `c` ở mép phải; phần chiếu (lớp phủ tờ, kín cửa sổ) THU ĐỀU hệ số `s` về góc
// trên-trái ⇒ tỉ lệ rộng / cao của bảng không đổi ⇒ `tiLe` tờ gửi máy em không đổi ⇒ máy em thấy y như khi không có cột. Dải cao `d` còn dư dưới phần chiếu
// chứa các thẻ chỉ thầy thấy (giơ tay, xin vào lại) để chúng không đè lên bảng.
/** Cửa sổ nhỏ hơn cỡ này ⇒ không dựng cột cố định (giữ cột nổi bấm M như cũ). */
export const COT_MAN_RONG = 1024, COT_MAN_CAO = 600
export interface HinhCot { /** bề ngang cột (px) */ c: number; /** hệ số thu phần chiếu */ s: number; /** bề cao dải dưới phần chiếu (px) */ d: number }
export function hinhCot(w: number, h: number): HinhCot | null {
  if (!(w >= COT_MAN_RONG) || !(h >= COT_MAN_CAO)) return null
  const c = Math.round(Math.min(340, Math.max(248, w * 0.2))), s = (w - c) / w
  return { c, s, d: Math.round(h - h * s) }
}
/** Cột cố định đang dựng? (LopNoiThay gắn `data-lk-cot` ở gốc trang.) Vùng phần chiếu lúc này — máy tính nổi và các lớp bám theo phần chiếu dùng. */
export function vungChieu(): { w: number; h: number } {
  const w = window.innerWidth, h = window.innerHeight, g = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-lk-cot') ? hinhCot(w, h) : null
  return g ? { w: w - g.c, h: h * g.s } : { w, h }
}
/** Sự kiện cửa sổ phát khi cột cố định vừa dựng / gỡ / đổi cỡ. */
export const SK_COT = 'ddh-lk-cot'
