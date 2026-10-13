// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH ĐỢT 18 LÀN L (12 bậc từ Lười đến Chăm ở 3 app + tờ chiếu điểm danh). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-lan-l/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-lan-l/chup.mjs <thư mục tạm> docs/anh-dot18
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-lan-l'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { lanl: resolve(goc, 'scripts/chup-lan-l/trang.html') } } },
})
