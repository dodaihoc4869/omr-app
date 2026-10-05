// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH OMNI 3 (không phải bản phát hành, không service worker). Dữ liệu GIẢ nằm trong trang.tsx.
//   npx vite build --config scripts/chup-omni-3/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-omni-3/chup.mjs <thư mục tạm> <thư mục ảnh>
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-omni-3'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { omni: resolve(goc, 'scripts/chup-omni-3/trang.html') } } },
})
