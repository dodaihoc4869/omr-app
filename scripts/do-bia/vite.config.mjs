// BẢN BUILD RIÊNG ĐỂ ĐO BI-A (không phải bản phát hành): trang xem thử Bi-a THẬT (BiaGame + máy chủ GIẢ trong trang), React bản
// production, không PWA. `import.meta.env.DEV = true` CHỈ để trang đo đọc được `window.__biaVan` (pha ván) — không bật gì khác
// (Bi-a chỉ dùng cờ này cho đúng một dòng đó, ManChoi.tsx).
//
//   npx vite build --config scripts/do-bia/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/do-bia/do-client.mjs --dist=<thư mục tạm> --ra=<kq.json>
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('do-bia'), __SW_BUILT_AT__: 0, 'import.meta.env.DEV': 'true' },
  build: {
    emptyOutDir: true,
    minify: process.env.KHONG_NEN !== '1', // KHONG_NEN=1 ⇒ giữ tên hàm để đọc hồ sơ CPU (--hoso)
    target: ['es2020', 'safari14', 'ios14'],
    rolldownOptions: { input: { bia: resolve(goc, 'src/game/bi-a/xem-thu.html') } },
  },
})
