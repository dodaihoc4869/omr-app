// Dựng gói MỘT TỆP cho trình soạn Worker trên dashboard Cloudflare.
//
// Dashboard chỉ cho dán một tệp, mà mã nguồn chia ba mô-đun TypeScript. Dùng
// chính Vite đã có trong kho — máy này không ra được internet nên không cài
// thêm được gì.
//
// Chạy:  npx vite build --config server/goi/vite.goi.ts
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  // KHÔNG chép `public/` sang đây: thư mục này chỉ chứa ĐÚNG một tệp gói.
  publicDir: false,
  build: {
    lib: { entry: resolve(__dirname, '../src/index.ts'), formats: ['es'], fileName: () => 'worker.js' },
    outDir: resolve(__dirname),
    emptyOutDir: false,
    // RÚT GỌN. Bản đầy đủ 24 KB, rút gọn còn 19 KB — và quan trọng hơn, nén lại
    // chỉ 6,6 KB, vừa đủ để đẩy thẳng lên Cloudflare bằng một lượt gọi API thay
    // vì dán tay vào trình soạn trên dashboard. Mã gốc đọc ở `server/src/*.ts`.
    minify: true,
    target: 'es2022',
  },
})
