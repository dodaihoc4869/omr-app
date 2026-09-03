import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'
import { batSuKienCaiApp } from './lib/pwa-install'
import { batTuHoiBanMoi } from './lib/cap-nhat-app'

// Bản deploy mới TỰ ÁP DỤNG ngay khi có (tự tải lại trang) — trước đây
// service worker chỉ đăng ký thụ động, tab đang mở (vd đang thi dở) sẽ giữ
// mãi bản JS/CSS cũ dù server đã có bản sửa lỗi, gây hiểu lầm "đã sửa mà
// sao vẫn thấy lỗi". An toàn để tự tải lại vì bài làm đã lưu liên tục vào
// IndexedDB (mất mạng/tải lại giữa chừng vẫn khôi phục đúng — xem exam-db.ts).
// Hỏi lại máy chủ mỗi khi quay lại app, mỗi khi có mạng lại, và mỗi 30 phút
// nếu app cứ mở — vì service worker chỉ tự hỏi lúc đăng ký, nên trước đây bản
// mới có khi phải mở app HAI lần mới thấy.
registerSW({
  immediate: true,
  onRegisteredSW(_url, dangKy) {
    if (dangKy) batTuHoiBanMoi(dangKy, {
      addEventListener: (t, f) => window.addEventListener(t, f),
      removeEventListener: (t, f) => window.removeEventListener(t, f),
      an: () => document.visibilityState === 'hidden',
    })
  },
})
// Bắt beforeinstallprompt TRƯỚC khi React mount (sự kiện chỉ bắn 1 lần) —
// để màn vào thi có nút "Cài đặt" 1 chạm (DaiNhacCaiApp).
batSuKienCaiApp()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
