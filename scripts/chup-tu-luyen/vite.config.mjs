// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH TU LUYỆN (không phải bản phát hành, không service worker). Dữ liệu GIẢ nằm trong trang.tsx.
//   npx vite build --config scripts/chup-tu-luyen/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-tu-luyen/chup.mjs <thư mục tạm> <thư mục ảnh>
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-tu-luyen'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { tl: resolve(goc, 'scripts/chup-tu-luyen/trang.html') } } },
})
