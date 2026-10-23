// BẢN BUILD RIÊNG ĐỂ CHỤP BẢN VẼ «MÀN CHIẾU ĐIỂM DANH» 23/10 (quy trình 4 bước, bước 2 — CHƯA build vào app). Không phải bản phát hành.
//   npx vite build --config scripts/ban-ve-chieu-dd-2310/vite.config.mjs --outDir <tạm> && node scripts/ban-ve-chieu-dd-2310/chup.mjs <tạm>
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('ban-ve-chieu-dd-2310'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { ve: resolve(goc, 'scripts/ban-ve-chieu-dd-2310/trang.html') } } },
})
