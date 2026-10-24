// Trang kiểm «Thêm em tay» 24/10 (KHÔNG phát hành): bước Điểm danh THẬT + máy chủ giả.
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react(), {
    name: 'may-chu-gia', enforce: 'pre',
    async resolveId(id, tu, o) {
      if (!/goi-lenh-thay/.test(id)) return null
      const r = await this.resolve(id, tu, { ...o, skipSelf: true })
      return r && /src[\\/]lib[\\/]goi-lenh-thay\.ts$/.test(r.id) ? resolve(import.meta.dirname, 'gia-lenh.ts') : r
    },
  }],
  define: { __PHIEN_BAN__: JSON.stringify('kiem-them-em'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { k: resolve(goc, 'scripts/kiem-them-em-2410/trang.html') } } },
})
