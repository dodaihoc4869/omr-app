// BẢN BUILD RIÊNG ĐỂ ĐO MÁY GHI «XEM LẠI LIVE» (11/11) — không phải bản phát hành, không service worker. Cách chạy: đầu tệp do-ghi.mjs.
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  base: './',
  worker: { format: 'es' },
  build: { emptyOutDir: true, rolldownOptions: { input: { ghi: resolve(goc, 'scripts/thu-live-xem-lai-1111/ghi.html') } } },
})
