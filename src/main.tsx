import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'

// Bản deploy mới TỰ ÁP DỤNG ngay khi có (tự tải lại trang) — trước đây
// service worker chỉ đăng ký thụ động, tab đang mở (vd đang thi dở) sẽ giữ
// mãi bản JS/CSS cũ dù server đã có bản sửa lỗi, gây hiểu lầm "đã sửa mà
// sao vẫn thấy lỗi". An toàn để tự tải lại vì bài làm đã lưu liên tục vào
// IndexedDB (mất mạng/tải lại giữa chừng vẫn khôi phục đúng — xem exam-db.ts).
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
