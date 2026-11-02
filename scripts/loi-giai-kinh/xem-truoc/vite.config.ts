import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
// ?hop=1 vẽ hộp «Lời giải» thật (LoiGiaiKinhHs) ⇒ thay tai-san bằng gói giả (không gọi máy chủ).
export default defineConfig({ root: __dirname, base: './', plugins: [react()], build: { outDir: process.env.RA || 'dist', emptyOutDir: true },
  resolve: { alias: [{ find: /^.*\/lib\/loi-giai-kinh\/tai-san$/, replacement: path.join(__dirname, 'tai-san-gia.ts') }] } })
