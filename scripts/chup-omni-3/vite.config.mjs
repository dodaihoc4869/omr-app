// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH OMNI 3 (không phải bản phát hành, không service worker). Dữ liệu GIẢ nằm trong trang.tsx.
//   npx vite build --config scripts/chup-omni-3/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-omni-3/chup.mjs <thư mục tạm> <thư mục ảnh>
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
// App thầy: chuyển hướng HAI cổng IO (gọi lệnh máy chủ, IndexedDB kho đề) sang bộ giả gia/ — CHỈ trong bản build chụp ảnh này.
const GIA = resolve(goc, 'scripts/chup-omni-3/gia')
const DOI = { [resolve(goc, 'src/lib/goi-lenh-thay.ts')]: resolve(GIA, 'goi-lenh-thay.ts'), [resolve(goc, 'src/lib/exam-db.ts')]: resolve(GIA, 'exam-db.ts') }
const giaThay = {
  name: 'gia-thay',
  enforce: 'pre',
  async resolveId(source, importer, opts) {
    if (!importer || importer.startsWith(GIA) || !/goi-lenh-thay|exam-db/.test(source)) return null
    const r = await this.resolve(source, importer, { ...opts, skipSelf: true })
    return r && DOI[r.id] ? DOI[r.id] : null
  },
}
export default defineConfig({
  root: goc,
  plugins: [giaThay, react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-omni-3'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { omni: resolve(goc, 'scripts/chup-omni-3/trang.html') } } },
})
