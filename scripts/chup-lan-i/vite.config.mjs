// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH ĐỢT 18 LÀN I (câu chữ app phụ huynh + tấm Bài tập về nhà của em). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-lan-i/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-lan-i/chup.mjs <thư mục tạm> docs/anh-dot18
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-lan-i'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { lani: resolve(goc, 'scripts/chup-lan-i/trang.html') } } },
})
