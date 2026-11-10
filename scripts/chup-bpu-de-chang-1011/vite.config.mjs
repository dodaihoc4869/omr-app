// BẢN BUILD RIÊNG ĐỂ CHỤP «đề Bình Phản Ứng giống chặng» (10/11) — không phải bản phát hành, không service worker. Dữ liệu GIẢ trong trang.tsx.
//   npx vite build --config scripts/chup-bpu-de-chang-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-bpu-de-chang-1011/chup.mjs <thư mục tạm> docs/ban-ve-bpu-1011 [truoc|sau]
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-bpu-de-chang-1011'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { bpu: resolve(goc, 'scripts/chup-bpu-de-chang-1011/trang.html') } } },
})
