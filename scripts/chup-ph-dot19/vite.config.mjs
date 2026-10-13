// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH ĐỢT 19 LÀN R (app phụ huynh "Hôm nay của con"). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-ph-dot19/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-ph-dot19/chup.mjs <thư mục tạm> docs/anh-dot19
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-ph-dot19'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { phdot19: resolve(goc, 'scripts/chup-ph-dot19/trang.html') } } },
})
