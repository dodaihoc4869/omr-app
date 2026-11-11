// BẢN BUILD RIÊNG ĐỂ CHỤP + ĐO «Xem lại Live — máy em» (đợt X2, 11/11) — không phải bản phát hành, không service worker.
// Thành phần THẬT (tấm «Thêm», danh sách, trang buổi, trình phát); máy chủ GIẢ do chup.mjs trả lời (dữ liệu giả tests/_live-xem-lai-gia.ts).
//   npx vite build --config scripts/chup-live-xem-lai-hs-1111/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-live-xem-lai-hs-1111/chup.mjs <thư mục tạm> docs/ban-ve-live-xem-lai-1011
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-live-xem-lai-hs-1111'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { xl: resolve(goc, 'scripts/chup-live-xem-lai-hs-1111/trang.html') } } },
})
