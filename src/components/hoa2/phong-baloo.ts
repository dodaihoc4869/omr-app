/**
 * Phông tiêu đề Game Hóa 2.0 — 'Baloo 2' (gói @fontsource/baloo-2, tự lưu trữ, KHÔNG gọi Google Fonts).
 * Chỉ nạp ở mảnh game / Sảnh 2.0 (SanhBanDo, DoanHoTong) — không vào index.html, nên phông không đi chung vỏ app.
 * Hai bộ chữ: vietnamese + latin (có unicode-range ⇒ trình duyệt chỉ tải bộ cần); hai độ đậm game đang dùng: 700, 800.
 * Mọi @font-face của fontsource đã có `font-display: swap` ⇒ chữ hiện ngay bằng Be Vietnam Pro rồi đổi sang Baloo khi tải xong.
 * Tệp woff2 bị loại khỏi precache (vite.config.ts `globIgnores`), đi kho chạy-lúc /assets/*.woff2 của src/sw.ts.
 */
import '@fontsource/baloo-2/vietnamese-700.css'
import '@fontsource/baloo-2/vietnamese-800.css'
import '@fontsource/baloo-2/latin-700.css'
import '@fontsource/baloo-2/latin-800.css'
