import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles/tokens.css'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'
import { batSuKienCaiApp, datManifestTheoVai } from './lib/pwa-install'
import { docDuongVao } from './lib/vai-tro'
import { batTuHoiBanMoi, daySangBanMoi } from './lib/cap-nhat-app'

// BẢN MỚI PHẢI VỀ NGAY LẦN MỞ ĐẦU. Ba lớp cùng lo việc này:
//   1. sw.js tự gọi skipWaiting + clientsClaim lúc cài (vite.config.ts) — bản
//      mới chiếm quyền ngay thay vì nằm chờ tới khi đóng hết app.
//   2. daySangBanMoi() đẩy bản đang nằm chờ, cứu máy còn giữ sw cũ.
//   3. batTuHoiBanMoi() hỏi lại khi quay lại app, khi có mạng lại và mỗi 30
//      phút; hoãn khi em đang làm bài.
// An toàn để tự tải lại vì bài làm đã lưu liên tục vào IndexedDB (mất mạng
// hoặc tải lại giữa chừng vẫn khôi phục đúng — xem exam-db.ts).
registerSW({
  immediate: true,
  onRegisteredSW(_url, dangKy) {
    if (!dangKy) return
    // Máy đang giữ service worker cũ có thể đã tải xong bản mới nhưng để nó
    // nằm chờ — đẩy sang ngay lúc mở app.
    daySangBanMoi(dangKy)
    batTuHoiBanMoi(dangKy, {
      addEventListener: (t, f) => window.addEventListener(t, f),
      removeEventListener: (t, f) => window.removeEventListener(t, f),
      an: () => document.visibilityState === 'hidden',
    })
  },
})
// Bắt beforeinstallprompt TRƯỚC khi React mount (sự kiện chỉ bắn 1 lần) —
// để màn vào thi có nút "Cài đặt" 1 chạm (DaiNhacCaiApp).
batSuKienCaiApp()

// ĐẶT MANIFEST THEO VAI NGAY, trước khi React mount. Chrome đọc thẻ
// <link rel="manifest"> rất sớm để quyết định bắn beforeinstallprompt và cài
// app nào; đổi thẻ sau khi React chạy là ăn may. Đặt sớm thì em bấm Cài đặt
// được đúng "ĐĐH Học sinh" / "ĐĐH Phụ huynh".
datManifestTheoVai(docDuongVao(location.search, location.pathname).vai)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
