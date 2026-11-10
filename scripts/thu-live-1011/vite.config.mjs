// BẢN BUILD RIÊNG ĐỂ THỬ LIVE BẢNG (10/11) — không phải bản phát hành, không service worker. Phòng thật chạy trong Node (may-chu.mjs).
// Cách chạy: xem đầu tệp scripts/thu-live-1011/thu.mjs
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('thu-live-1011'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { live: resolve(goc, 'scripts/thu-live-1011/trang.html') } } },
})
