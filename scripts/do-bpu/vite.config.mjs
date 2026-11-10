// BẢN BUILD RIÊNG ĐỂ ĐO TỐC ĐỘ BÌNH PHẢN ỨNG (không phát hành): thay hai cổng IO bằng bộ giả. `npx vite build --config scripts/do-bpu/vite.config.mjs --outDir <thư mục>`
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
const goc = resolve(import.meta.dirname, '../..')
const GIA = resolve(import.meta.dirname, 'gia')
const DOI = { [resolve(goc, 'src/lib/goi-lenh-thay.ts')]: resolve(GIA, 'goi-lenh-thay.ts'), [resolve(goc, 'src/lib/dia-chi-may-chu.ts')]: resolve(GIA, 'dia-chi-may-chu.ts') }
const giaThay = {
  name: 'gia-thay', enforce: 'pre',
  async resolveId(source, importer, opts) {
    if (!importer || importer.startsWith(GIA) || !/goi-lenh-thay|dia-chi-may-chu/.test(source)) return null
    const r = await this.resolve(source, importer, { ...opts, skipSelf: true })
    return r && DOI[r.id] ? DOI[r.id] : null
  },
}
export default defineConfig({
  root: goc, plugins: [giaThay, react()],
  define: { __PHIEN_BAN__: JSON.stringify('do-bpu'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { bpu: resolve(import.meta.dirname, 'trang.html') } } },
})
