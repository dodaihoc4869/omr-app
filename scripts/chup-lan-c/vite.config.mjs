// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH ĐỢT 16 LÀN C (tấm Hồ sơ làm bài ba app + thẻ Nhịp học của con). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-lan-c/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-lan-c/chup.mjs <thư mục tạm> <thư mục ảnh>
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-lan-c'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { lanc: resolve(goc, 'scripts/chup-lan-c/trang.html') } } },
})
