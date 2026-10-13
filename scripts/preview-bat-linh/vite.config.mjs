// Local Bát Linh preview: real components, fixture data, no service worker.
//   npx vite build --config scripts/preview-bat-linh/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/preview-bat-linh/check.mjs <preview origin> <screenshot directory>
import { resolve } from 'node:path'
import { realpathSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const goc = resolve(import.meta.dirname, '../..')
export default defineConfig({
  root: goc,
  plugins: [react()],
  server: { fs: { allow: [goc, realpathSync(resolve(goc, 'node_modules'))] } },
  define: { __PHIEN_BAN__: JSON.stringify('preview-bat-linh'), __SW_BUILT_AT__: 0 },
  build: { emptyOutDir: true, rolldownOptions: { input: { teacher: resolve(goc, 'scripts/preview-bat-linh/teacher.html'), app: resolve(goc, 'scripts/preview-bat-linh/trang.html') } } },
})
