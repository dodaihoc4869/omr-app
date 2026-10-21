// BẢN BUILD RIÊNG ĐỂ CHỤP ẢNH MÀN THẬT HÀNH TRÌNH 4 BƯỚC + HỘP BỔ SUNG BÀI (21/10). Không phải bản phát hành, không service worker.
//   npx vite build --config scripts/chup-hanh-trinh-2110/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-hanh-trinh-2110/chup.mjs <thư mục tạm> docs/ban-ve-hanh-trinh-2110/anh-that
// Máy chủ giả: mọi lối nhập `goi-lenh-thay` ⇒ gia-goi-lenh.ts; `exam-db` ⇒ gia-exam-db.ts (tệp giả tự nhập bản thật bằng hậu tố `?that`).
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
const GIA = { 'src/lib/goi-lenh-thay': 'scripts/chup-hanh-trinh-2110/gia-goi-lenh.ts', 'src/lib/exam-db': 'scripts/chup-hanh-trinh-2110/gia-exam-db.ts' }
const thayMayChu = {
  name: 'may-chu-gia',
  enforce: 'pre',
  async resolveId(id, tu, o) {
    if (id.endsWith('?that')) return this.resolve(id.slice(0, -5), tu, { ...o, skipSelf: true })
    const r = await this.resolve(id, tu, { ...o, skipSelf: true })
    if (!r) return null
    for (const [that, gia] of Object.entries(GIA)) if (r.id.replace(/\.(ts|tsx)$/, '') === resolve(goc, that) && !tu?.endsWith(gia)) return resolve(goc, gia)
    return null
  },
}
export default defineConfig({
  root: goc,
  plugins: [thayMayChu, react()],
  define: { __PHIEN_BAN__: JSON.stringify('chup-hanh-trinh-2110'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { hanhtrinh: resolve(goc, 'scripts/chup-hanh-trinh-2110/trang.html') } } },
})
