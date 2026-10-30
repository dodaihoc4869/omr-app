// Khung dựng THẬT màn kiểm tra kiểu Duo để chụp ảnh nghiệm thu (đặc tả docs/dac-ta-kiem-tra-duo-3010.md mục 7). Không vào bản app.
//   npx vite build --config scripts/chup-kiem-tra-duo-3010/vite.config.ts  (ra $RA_CHUP_KT, mặc định <thư mục tạm>/dist-chup-kt — không vào repo)
import react from '@vitejs/plugin-react'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [react()],
  build: { outDir: process.env.RA_CHUP_KT || resolve(tmpdir(), 'dist-chup-kt'), emptyOutDir: true, assetsInlineLimit: 0, modulePreload: false },
})
