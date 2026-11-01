// MỘT NGUỒN cho luật «màn làm câu chia HAI CỘT» (đề trái · trả lời phải) — dùng chung cho CSS (styles/trong-chang-ngang.css, components/hoc-tap/hoc-tap.css)
// và JS (`chonBoCucLam` / `useBoCucLam` ở LamCau.tsx, thanh cuộn vẽ tay ThanhCuon.tsx). Test tests/chang-ngang-2-0111.test.ts khoá ba nơi khớp nhau.
// Thầy 01/11 tối (ảnh Galaxy Z Fold MỞ, chưa xoay — màn trong ~900×680 vẫn một cột, thừa nửa dưới): «Tối ưu cho máy gập khi mở cùng giao diện với xoay ngang nhé».
// Luật (Boss chốt): HAI CỘT khi
//   (a) rộng > cao VÀ rộng ≥ 640  — mọi máy xoay ngang, Fold mở tư thế tự nhiên (~880–910 × 690–760), máy tính bảng ngang, máy tính; hoặc
//   (b) rộng ≥ 700 VÀ cao ≤ 1,3 × rộng — Fold mở rồi xoay dọc (~760×884).
// MỘT CỘT (như cũ): điện thoại dọc, Fold gập (màn ngoài ~360×800), máy tính bảng dọc 768×1024 (cao/rộng 1,33).
// Bậc chiều cao (chỉ chỉnh cỡ chữ / đệm, không đổi số cột): thấp ≤ 500 · rất thấp ≤ 380 (bàn phím số hai hàng) · vừa 501–800 · cao > 800.

/** CSS @media của bố cục hai cột — CÙNG nghĩa với `haiCotLam` (rộng > cao ⇔ orientation: landscape; cao ≤ 1,3 rộng ⇔ aspect-ratio ≥ 10/13). */
export const MQ_HAI_COT = '(orientation: landscape) and (min-width: 640px), (min-width: 700px) and (min-aspect-ratio: 10/13)'
export const RONG_NGANG_MIN = 640
export const RONG_GAP_MIN = 700
/** Thuần: khung nhìn rộng × cao (px CSS) có chia hai cột không. Số nguyên hoá để khớp đúng biên của @media (aspect-ratio 10/13). */
export function haiCotLam(rong: number, cao: number): boolean {
  if (!(rong > 0) || !(cao > 0)) return false
  return (rong > cao && rong >= RONG_NGANG_MIN) || (rong >= RONG_GAP_MIN && cao * 10 <= rong * 13)
}
export type BacCao = 'rat-thap' | 'thap' | 'vua' | 'cao'
/** Bậc chiều cao (cỡ chữ / đệm). */
export function bacCao(cao: number): BacCao {
  return cao <= 380 ? 'rat-thap' : cao <= 500 ? 'thap' : cao <= 800 ? 'vua' : 'cao'
}
