// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH TẤM "HỒ SƠ LÀM BÀI" CÓ MỨC LÀM 1–4 (21/10; không phải bản phát hành, không service worker). Dữ liệu GIẢ: ../chup-v2/gia/lich-su-muc-lam.ts.
//   npx vite build --config scripts/chup-muc-lam-2110/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-muc-lam-2110/chup.mjs <thư mục tạm> [thư mục ảnh = docs/anh-muc-lam-ho-so-2110]
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-muc-lam'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { chup: resolve(goc, 'scripts/chup-muc-lam-2110/trang.html') } } },
})
