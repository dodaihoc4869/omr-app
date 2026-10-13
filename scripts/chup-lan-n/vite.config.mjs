// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH ĐỢT 19 LÀN N (Hành trình · Ôn & sửa · biểu tượng Tự sửa lỗi). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-lan-n/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-lan-n/chup.mjs <thư mục tạm> docs/anh-dot19
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-lan-n'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { lann: resolve(goc, 'scripts/chup-lan-n/trang.html') } } },
})
