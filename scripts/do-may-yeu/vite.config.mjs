// BẢN BUILD RIÊNG ĐỂ ĐO MÁY YẾU (không phải bản phát hành): dựng các trang đo màn học tập HS/PH ở chế độ
// production (React bản build, đúng như máy em chạy) vào một thư mục tạm, rồi `node scripts/do-may-yeu.mjs --preview=<thư mục>`.
//
//   npx vite build --config scripts/do-may-yeu/vite.config.mjs --outDir /tmp/do-may-yeu-hoc-tap
//
// Không có PWA, không service worker; dữ liệu giả nằm ngay trong từng trang xem thử (không gọi máy chủ thật).
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  define: { __PHIEN_BAN__: JSON.stringify('do-may-yeu'), __SW_BUILT_AT__: 0 },
  build: {
    emptyOutDir: true,
    target: ['es2020', 'safari14', 'ios14'],
    rolldownOptions: {
      input: {
        man: resolve(goc, 'scripts/do-may-yeu/trang-do.html'),
      },
    },
  },
})
