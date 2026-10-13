// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH ĐỢT 20 (Kiểm tra ôn tập — thẻ + màn làm bài THẬT, máy chủ GIẢ trong trang). Không phải bản phát hành.
//   npx vite build --config scripts/chup-ktcn-dot20/vite.config.mjs --outDir <thư mục tạm> && node scripts/chup-ktcn-dot20/chup.mjs <thư mục tạm> docs/anh-dot20
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-ktcn-dot20'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { ktcn20: resolve(goc, 'scripts/chup-ktcn-dot20/trang.html') } } },
})
