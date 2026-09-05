import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
// PHÔNG CÓ DẤU TIẾNG VIỆT — tự chứa trong app, KHÔNG gọi Google Fonts.
// Charter (phông cũ) thiếu dấu tiếng Việt nên trình duyệt phải nhặt dấu từ
// phông khác và dấu rơi khỏi chữ. Nạp thẳng từ node_modules, chỉ hai subset
// latin + vietnamese và đúng các nét đang dùng, để service worker cache được
// và app vẫn đúng dấu khi mất mạng.
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/latin-700.css'
import '@fontsource/noto-serif/latin-400-italic.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/noto-serif/vietnamese-700.css'
import '@fontsource/noto-serif/vietnamese-400-italic.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import './styles/tokens.css'
import './index.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'

import { chuanHoaDuongDan } from './lib/vai-tro'
import { donPhienCu } from './lib/don-phien-cu'
import { batTuHoiBanMoi, batTuTaiLaiKhiDoiBan, daySangBanMoi } from './lib/cap-nhat-app'
import { batSuKienCaiApp } from './lib/pwa-install'
import { batLoiThieuManh } from './lib/nap-manh'

// Dọn thiết lập cũ nếu cấu trúc dữ liệu đã đổi. Chạy trước mọi logic khác;
// KHÔNG đụng id thiết bị và IndexedDB (xem don-phien-cu.ts).
donPhienCu()

// Đổi /gv và /t/<mã ca> thành tham số truy vấn — việc mà public/404.html vẫn
// làm, nhưng 404.html không chạy trên máy đã cài app (service worker trả thẳng
// index.html). Sau bước này cả app chỉ thấy MỘT dạng URL.
chuanHoaDuongDan(import.meta.env.BASE_URL)

// beforeinstallprompt chỉ bắn MỘT LẦN và bắn trước khi React kịp mount — phải
// nghe từ đây, không nghe được trong component. Có nó thì thẻ "Cài app lên màn
// hình chính" ở màn Kiểm tra cài được 1 chạm.
batSuKienCaiApp()

// MÁY ĐANG MỞ SẴN BẢN CŨ thì mọi mảnh mã tải sau (phiếu, bộ dựng đề) đi xin
// đúng tên tệp của bản cũ — tên đó đã bị xoá khỏi máy chủ khi đẩy bản mới lên.
// Bắt đúng lỗi ấy rồi tự tải lại một lần, thay vì để thầy nhìn dòng lỗi tiếng
// Anh và tưởng hỏng app. Xem nap-manh.ts.
batLoiThieuManh()

// BẢN MỚI PHẢI VỀ NGAY LẦN MỞ ĐẦU. Ba lớp cùng lo việc này:
//   1. sw.js tự gọi skipWaiting + clientsClaim lúc cài (vite.config.ts) — bản
//      mới chiếm quyền ngay thay vì nằm chờ tới khi đóng hết app.
//   2. daySangBanMoi() đẩy bản đang nằm chờ, cứu máy còn giữ sw cũ.
//   3. batTuHoiBanMoi() hỏi lại khi quay lại app, khi có mạng lại và mỗi 30
//      phút; hoãn khi em đang làm bài.
// An toàn để tự tải lại vì bài làm đã lưu liên tục vào IndexedDB (mất mạng
// hoặc tải lại giữa chừng vẫn khôi phục đúng — xem exam-db.ts).
// Bản mới chiếm quyền thì TẢI LẠI TRANG ngay. Ba lớp trên chỉ lo tải bản mới
// về và cho nó chiếm quyền; trang đang mở vẫn chạy mã cũ tới khi tải lại — đó
// là lý do thầy sửa xong mở app vẫn thấy y lỗi cũ. Xem cap-nhat-app.ts.
batTuTaiLaiKhiDoiBan()

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
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
