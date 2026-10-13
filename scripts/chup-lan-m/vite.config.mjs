// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH ĐỢT 19 LÀN M (huy hiệu 12 bậc + tấm đủ 12 bậc + danh sách em theo bậc). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-lan-m/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-lan-m/chup.mjs <thư mục tạm> docs/anh-dot19
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-lan-m'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { lanm: resolve(goc, 'scripts/chup-lan-m/trang.html') } } },
})
