// Bản vẽ riêng, dữ liệu giả; không service worker hoặc API thật.
import { resolve } from 'node:path'
import { realpathSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
export default defineConfig({
  root: resolve(import.meta.dirname, '../..'),
  cacheDir: '/tmp/vite-chup-tick-em-1410',
  plugins: [react()],
  optimizeDeps: { entries: ['scripts/chup-tick-em-1410/trang.html'] },
  server: { host: '127.0.0.1', port: 5197, strictPort: true, fs: { allow: [resolve(import.meta.dirname, '../..'), realpathSync(resolve(import.meta.dirname, '../../node_modules'))] } },
})
