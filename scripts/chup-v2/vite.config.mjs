// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH BẢN DUYỆT V2 (không phải bản phát hành, không service worker). Dữ liệu GIẢ: trang.tsx + gia/ (V2) + chup-omni-3/gia.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-v2/chup.mjs <thư mục tạm> <thư mục ảnh>
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
const GIA_V2 = resolve(goc, 'scripts/chup-v2/gia')
const GIA_OMNI = resolve(goc, 'scripts/chup-omni-3/gia')
// App thầy: chuyển hướng HAI cổng IO (gọi lệnh máy chủ, IndexedDB kho đề) sang bộ giả — CHỈ trong bản build chụp ảnh này.
const DOI = { [resolve(goc, 'src/lib/goi-lenh-thay.ts')]: resolve(GIA_V2, 'goi-lenh-thay.ts'), [resolve(goc, 'src/lib/exam-db.ts')]: resolve(GIA_OMNI, 'exam-db.ts') }
const giaThay = {
  name: 'gia-thay',
  enforce: 'pre',
  async resolveId(source, importer, opts) {
    if (!importer || importer.startsWith(GIA_V2) || importer.startsWith(GIA_OMNI) || !/goi-lenh-thay|exam-db/.test(source)) return null
    const r = await this.resolve(source, importer, { ...opts, skipSelf: true })
    return r && DOI[r.id] ? DOI[r.id] : null
  },
}
export default defineConfig({
  root: goc,
  plugins: [giaThay, react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-v2'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { v2: resolve(goc, 'scripts/chup-v2/trang.html') } } },
})
