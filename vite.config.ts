import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Repo name dùng làm base path khi deploy GitHub Pages (project page, không phải user page).
// Đổi giá trị này đúng bằng tên repo GitHub của thầy trước khi deploy.
const REPO_BASE = '/omr-app/'

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? REPO_BASE : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Tự đăng ký service worker trong main.tsx (registerSW từ
      // 'virtual:pwa-register', immediate:true) để có bản mới TỰ TẢI LẠI
      // ngay, không cần thầy/học sinh xoá cache tay mới thấy sửa lỗi —
      // injectRegister:false để không đăng ký trùng 2 lần.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'icon-hs-192.png', 'icon-hs-512.png', 'icon-ph-192.png', 'icon-ph-512.png', 'manifest-hs.json', 'manifest-ph.json', '404.html', 'cau-hinh.json'],
      manifestFilename: 'manifest.json',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,data}'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        // 404.html chỉ là trang chuyển hướng link ngắn /t/<mã ca> — không để
        // service worker trả nó thay cho trang chính khi offline.
        navigateFallbackDenylist: [/\/t\//],
      },
      // Tên hiển thị "ĐỖ ĐẠI HỌC" (tên trung tâm); màu = --muc / --nen của
      // tokens.css. display:standalone + orientation:portrait chỉ có tác dụng
      // khi học sinh đã "Thêm vào màn hình chính" — app nhắc việc đó ở màn
      // vào thi (DaiNhacCaiApp).
      manifest: {
        name: 'ĐỖ ĐẠI HỌC',
        short_name: 'ĐỖ ĐẠI HỌC',
        description: 'Kiểm tra tại lớp, chấm bài và kết quả — trung tâm luyện thi Hoá Đỗ Đại Học',
        lang: 'vi',
        theme_color: '#1a2332',
        background_color: '#f7f8fa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  worker: {
    format: 'es',
  },
})
