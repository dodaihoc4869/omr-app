// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH "VIỆC HÔM NAY" CỦA TỰ SỬA LỖI (20/10). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-tu-sua-2010/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-tu-sua-2010/chup.mjs <thư mục tạm> docs/ban-ve-tu-sua-2010/anh-that
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-tu-sua-2010'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { tusua: resolve(goc, 'scripts/chup-tu-sua-2010/trang.html') } } },
})
