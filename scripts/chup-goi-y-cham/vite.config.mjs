// BẢN BUILD RIÊNG ĐỂ CHỤP «Chạm để hiểu đề» + «Gợi ý 3 tầng» + lời giải sơ đồ (26/10) — khung giả kiểu màn Duo (màn thật chưa có trên main).
//   npx vite build --config scripts/chup-goi-y-cham/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-goi-y-cham/chup.mjs <thư mục tạm> docs/anh-goi-y-cham-2610
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-goi-y-cham'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { gyc: resolve(goc, 'scripts/chup-goi-y-cham/trang.html') } } },
})
