// BỘ MÀU MOL ĐỔI MỖI NGÀY (thầy 01/11 tối: «Chốt bình cầu, chọn cả 3 bộ màu thay đổi mỗi ngày»). HÀM THUẦN, tất định theo NGÀY VIỆT NAM (UTC+7):
// cùng ngày ⇒ mọi máy, mọi màn cùng một bộ; qua 00:00 giờ VN đổi bộ (không đổi giữa lúc đang mở — lần vẽ kế tiếp là được).
// Bộ = (số ngày VN kể từ 01/01/1970) mod 3: 0 chàm sáng + ngọc lam · 1 ngọc lam + hồng · 2 chàm nhạt + cam (styles/mol.css, .mol-svg[data-mol-mau]).
// Truyền giờ máy chủ đã chỉnh (`gioMayChu()`) ⇒ máy lệch giờ vẫn cùng màu với cả lớp.
export type BoMauMol = 0 | 1 | 2
const NGAY = 86_400_000, LECH_VN = 7 * 3_600_000
export function boMauMol(ms: number): BoMauMol {
  const n = Math.floor((ms + LECH_VN) / NGAY)
  return (((n % 3) + 3) % 3) as BoMauMol
}
