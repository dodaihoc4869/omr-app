// Khung dựng THẬT màn ca thi kiểu Duo ở chế độ tập trung (thầy 01/11) để chụp ảnh nghiệm thu. Không vào bản app.
//   npx vite build --config scripts/chup-thi-tap-trung-0111/vite.config.ts  (ra $RA_CHUP_TT, mặc định <thư mục tạm>/dist-chup-tt — không vào repo)
import react from '@vitejs/plugin-react'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [react()],
  build: { outDir: process.env.RA_CHUP_TT || resolve(tmpdir(), 'dist-chup-tt'), emptyOutDir: true, assetsInlineLimit: 0, modulePreload: false },
})
