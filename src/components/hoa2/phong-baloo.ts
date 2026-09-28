/**
 * Phông tiêu đề Game Hóa 2.0 — 'Baloo 2' (gói @fontsource/baloo-2, tự lưu trữ, KHÔNG gọi Google Fonts).
 * Chỉ nạp ở mảnh game / Sảnh 2.0 (SanhBanDo, DoanHoTong) — không vào index.html, nên phông không đi chung vỏ app.
 * Nạp tệp CSS THEO ĐỘ ĐẬM (`700.css`, `800.css`) — mỗi @font-face trong đó CÓ `unicode-range` (vietnamese / latin / latin-ext /
 *   devanagari) ⇒ trình duyệt chọn đúng bộ con cho từng ký tự và chỉ tải bộ cần (thường chỉ latin + vietnamese).
 * KHÔNG dùng lại tệp theo bộ con (`vietnamese-800.css`, `latin-800.css`…): các tệp đó KHÔNG có unicode-range ⇒ hai mặt cùng tên
 *   cùng độ đậm phủ nhau, Chromium lấy mặt khai sau (latin) cho mọi chữ, tự tách "Ổ" thành Ô + dấu móc ⇒ chữ HOA có dấu vẽ méo
 *   (lỗi "PHÁ 3 Ổ PHỤC KÍCH" 28/09, lúc đúng lúc sai theo thứ tự nạp CSS). Kiểm chống tái phát: `node scripts/kiem-phong-hoa.mjs`.
 * Mọi @font-face của fontsource đã có `font-display: swap` ⇒ chữ hiện ngay bằng Be Vietnam Pro rồi đổi sang Baloo khi tải xong.
 * Tệp woff2 bị loại khỏi precache (vite.config.ts `globIgnores`, mẫu baloo-2-*.woff2), đi kho chạy-lúc /assets/*.woff2 của src/sw.ts.
 */
import '@fontsource/baloo-2/700.css'
import '@fontsource/baloo-2/800.css'
