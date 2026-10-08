import {startAppPresence} from './lib/app-presence'
import { batDocNhipDeNghi } from './lib/nhip-de-nghi'
import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
// THỨ TỰ CSS GIỮ NGUYÊN (05/10, tối ưu mở app học sinh — thầy: "giữ nguyên mọi màu sắc các lớp trong 3 app"). Gốc React nay nạp ĐỘNG
// theo đường vào (cuối tệp) nên mọi tờ CSS trước đây đi chung mảnh chính (do App.tsx + các mảnh dùng chung nhập) được nhập THẲNG ở đây,
// ĐÚNG thứ tự cũ: sáu tờ của mảnh dùng chung (trước đây là sáu thẻ <link> đứng trước tờ chính), rồi phông, tờ gốc, và các tờ App.tsx kéo theo
// (khối cuối). Cả ba app vẫn nhận đúng chuỗi luật CSS như trước, cùng một tệp, trước lượt vẽ đầu.
import './components/m3/m3-tuong-thich.css'
import './components/bang-nhiem-vu/m3-theme.css'
import './components/m3/m3.css'
import './components/loi-giai/loi-giai.css'
import './components/o-so-tra-loi.css'
import './components/m3/khung-xem-phieu.css'
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
import './styles/the-loc.css'
// Chế độ máy yếu (29/09): quy tắc chỉ có hiệu lực khi <html> mang lớp `may-yeu` (xem src/lib/may-yeu.ts).
import './styles/may-yeu.css'
// Hiệu ứng "+N EXP" dùng chung (luật v4 29/09): CSS nằm trong gói CSS vỏ để mảnh `ExpCau` (dùng ở bảng nhiệm vụ, BTVN, mọi game) không đẻ thêm một tệp CSS precache.
import './components/exp-cau/exp-cau.css'
// Các tờ trước đây đi theo App.tsx (vỏ Bát Linh, khung app thầy, logo, thanh bên, phiếu, bảng màu thầy) — đúng thứ tự cũ, xem đầu tệp.
import './components/bat-linh/bat-linh.css'
import './components/bat-linh/hoc-sinh.css'
import './components/bat-linh/phu-huynh.css'
import './components/bat-linh/game-toan-bo.css'
import './components/bat-linh/che-do-toi.css'
import './styles/teacher-layout.css'
import './styles/vo-thay.css'
import './components/logo-ddh.css'
import './components/chien-dich/thanh-ben-hoa2.css'
import './components/thanh-ben-gv2.css'
import './components/m3/phieu-screen.css'
import './styles/gv-mau.css'
import './styles/teacher-modern.css'
// Lớp V2 cuối cùng cho cả ba vai; chỉ đổi trình bày, không đổi nghiệp vụ.
import './styles/hanh-trinh-v2.css'
import { apDungGiaoDien } from './lib/giao-dien-thay'
// V2 đã được duyệt ở bảng màu sáng cho cả ba vai. Áp trước lần vẽ đầu,
// kể cả CSS màn con nạp muộn và thiết bị đang dùng chế độ tối.
document.documentElement.setAttribute('data-phong-cach', 'v2')
apDungGiaoDien('sang')
// KaTeX + katex.min.css NẠP LƯỜI qua `napKatex()` (src/lib/katex-goi.ts) — không còn trong lượt tải đầu.

import { chuanHoaDuongDan, docDuongVao, laLinkAppCu, nhoVaiDaDung } from './lib/vai-tro'
import { khoaVaiVaoUrl } from './lib/khoa-vai'
import { donPhienCu } from './lib/don-phien-cu'
import { batTuHoiBanMoi, daySangBanMoi, tuTaiLaiKhiDoiBan } from './lib/cap-nhat-app'
import { batBaoHiemBanMoi } from './lib/bao-hiem-ban-moi'
import { batSuKienCaiApp } from './lib/pwa-install'
import { batLoiThieuManh } from './lib/nap-manh'
import { napDiaChiMayChuMoiChoEm } from './lib/may-chu-moi'
import { batCheDoMayYeu } from './lib/may-yeu'

/** KaTeX nạp lười qua chem-format (mảnh chung của các màn có công thức) — nạp ĐỘNG để màn đầu của em không phải tải chem-format trước khi hiện. */
const napKatex = () => import('./lib/chem-format').then((m) => m.napKatex())

// Dọn thiết lập cũ nếu cấu trúc dữ liệu đã đổi. Chạy trước mọi logic khác;
// KHÔNG đụng id thiết bị và IndexedDB (xem don-phien-cu.ts).
donPhienCu()

// `nhipDeNghi` của máy chủ (Code 3, M3): CHỈ ĐỌC header `x-nhip-de-nghi` để các vòng hỏi nền tự giãn nhịp khi máy chủ bận. Không đụng thân phản hồi; chưa có header ⇒ không làm gì.
batDocNhipDeNghi()

// Đổi /gv và /t/<mã ca> thành tham số truy vấn — việc mà public/404.html vẫn
// làm, nhưng 404.html không chạy trên máy đã cài app (service worker trả thẳng
// index.html). Sau bước này cả app chỉ thấy MỘT dạng URL.
chuanHoaDuongDan(import.meta.env.BASE_URL)

// Xoá tham số _moi nếu có (dùng để ép nạp bản mới vượt Service Worker cache)
if (typeof window !== 'undefined' && location.search.includes('_moi')) {
  try {
    const u = new URL(location.href)
    u.searchParams.delete('_moi')
    history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash)
  } catch {}
}

// KHOÁ VAI VÀO ĐƯỜNG DẪN — thầy chốt 14/09: "đảm bảo 100% không nhảy lẫn lộn".
//
// `chuanHoaDuongDan` ở trên gom mọi thứ về tham số truy vấn. Riêng VAI thì đi
// ngược lại: đẩy ra ĐƯỜNG DẪN (`/gv`, `/hs`, `/ph`). Tham số bị Zalo hay trình
// rút gọn cắt mất thì `?vai=gv` thành `/` trần; đường dẫn thì không mất. Sau
// dòng này thanh địa chỉ luôn nói rõ đang ở app nào, và mọi lượt tải lại —
// kể cả lượt service worker trả trang — đều giữ nguyên vai.
//
// Chạy SAU `chuanHoaDuongDan` để không phải tranh nhau ghi địa chỉ, và TRƯỚC
// khi React dựng để màn đầu tiên đã thấy đường đúng.
khoaVaiVaoUrl(import.meta.env.BASE_URL)

// GỐC REACT THEO ĐƯỜNG VÀO (05/10, tối ưu mở app học sinh): cổng học sinh dựng vỏ RIÊNG `AppHocSinh` (màn đăng nhập nhẹ, KHÔNG kéo App.tsx
// của thầy); mọi đường khác dựng App.tsx như cũ. Bắt đầu tải NGAY (index.html đã nạp trước đúng nhóm mảnh của đường vào — vite.config.ts
// `napTruocManEm`), dựng React khi mảnh về. Tính SAU khi chuẩn hoá + khoá vai vào đường dẫn ⇒ cùng kết luận với App.tsx. Mảnh gốc tải hỏng
// thì thử lại một lần; thiếu mảnh vì đang mở bản cũ thì `batLoiThieuManh()` (dưới) tự tải lại trang.
type GocApp = { default: ComponentType; huaManEmSom: () => Promise<unknown> | null }
const thuLai = <T,>(nap: () => Promise<T>): Promise<T> => nap().catch(() => new Promise<void>((r) => setTimeout(r, 800)).then(nap))
// Link riêng CŨ (`/hs/<token>?vai=hocsinh`…) App.tsx chặn bằng màn "link đã ngừng dùng" TRƯỚC nhánh cổng ⇒ đi App.tsx như cũ.
const laCongHocSinh = docDuongVao(location.search, location.pathname).vai === 'hocsinh' && !laLinkAppCu(location.search, location.pathname)
const napGoc: Promise<GocApp> = laCongHocSinh ? thuLai(() => import('./AppHocSinh')) : thuLai(() => import('./App'))
/** Lượt tải mảnh màn em (màn thi / cổng học sinh) của gốc vừa chọn — KaTeX tải NỐI SAU nó. */
const huaManEmSom = () => napGoc.then((g) => g.huaManEmSom())

// NHỚ VAI MÁY NÀY DÙNG — để lần sau mở `/` trần (biểu tượng trên màn hình chính
// luôn mở `/` trần vì `start_url` của manifest là `./`) app biết đưa em vào màn
// thi thay vì màn quản lý của thầy. Xem ghi chú dài ở `laManThayQuanLy`.
// Chỉ ghi khi đường vào NÓI RÕ vai; `/` trần không tự ghi gì.
{
  const dv = docDuongVao(location.search, location.pathname)
  if (dv.vai === 'gv') nhoVaiDaDung('gv')
  else if (dv.maCa || dv.vai === 'diem') nhoVaiDaDung('hs')
  else if (dv.vai === 'hocsinh') nhoVaiDaDung('hs')
  else if (dv.vai === 'phuhuynh') nhoVaiDaDung('ph')
  // CHẾ ĐỘ MÁY YẾU (thầy 29/09): máy em / phụ huynh ít RAM, ít lõi, xin giảm chuyển động hay tiết kiệm dữ liệu ⇒ gắn lớp
  // `may-yeu` lên <html> TRƯỚC khi React dựng (tắt kính mờ, bớt hoạt ảnh trang trí, bớt hạt/thị sai). Máy thầy không đụng.
  if (dv.vai === 'hocsinh' || dv.vai === 'phuhuynh' || dv.vai === 'diem' || dv.vai === 'phieu' || !!dv.maCa) batCheDoMayYeu()
  // KaTeX: đường vào có công thức ngay (màn thi, xem điểm, cổng học sinh, phiếu) ⇒ tải NGAY, song song với
  // mảnh màn; đường khác (màn khoá thầy, cổng phụ huynh) ⇒ tải lúc rảnh sau khi trang đã hiện.
  const canCongThucNgay = !!dv.maCa || dv.vai === 'diem' || dv.vai === 'hocsinh' || dv.vai === 'phieu'
  // MÁY YẾU / 3G (29/09): vào thi (`/t/<mã ca>`) và cổng học sinh thì màn ĐẦU (ô số báo danh, đăng nhập) không có công thức ⇒
  // KaTeX (~83 KB gzip) tải NGAY SAU mảnh màn thay vì giành đường truyền với nó (đo Fast 3G: màn đầu hiện sớm hơn). Xem điểm /
  // phiếu có công thức ngay ⇒ vẫn tải liền như cũ.
  const noiSauManEm = (!!dv.maCa && dv.vai !== 'diem') || dv.vai === 'hocsinh'
  const huaMan = noiSauManEm ? huaManEmSom() : null
  if (huaMan) void huaMan.then(napKatex, napKatex).catch(() => {})
  else if (canCongThucNgay) void napKatex().catch(() => {})
  else {
    const khiRanh = () => {
      const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => void }
      if (w.requestIdleCallback) w.requestIdleCallback(() => void napKatex().catch(() => {}), { timeout: 4000 })
      else setTimeout(() => void napKatex().catch(() => {}), 1500)
    }
    if (document.readyState === 'complete') khiRanh()
    else window.addEventListener('load', khiRanh, { once: true })
  }
}

// beforeinstallprompt chỉ bắn MỘT LẦN và bắn trước khi React kịp mount — phải
// nghe từ đây, không nghe được trong component. Có nó thì thẻ "Cài app lên màn
// hình chính" ở màn Kiểm tra cài được 1 chạm.
batSuKienCaiApp()

// MÁY ĐANG MỞ SẴN BẢN CŨ thì mọi mảnh mã tải sau (phiếu, bộ dựng đề) đi xin
// đúng tên tệp của bản cũ — tên đó đã bị xoá khỏi máy chủ khi đẩy bản mới lên.
// Bắt đúng lỗi ấy rồi tự tải lại một lần, thay vì để thầy nhìn dòng lỗi tiếng
// Anh và tưởng hỏng app. Xem nap-manh.ts.
batLoiThieuManh()

// ĐỊA CHỈ MÁY CHỦ MỚI CHO MÁY EM. Máy học sinh không mở được màn Cài đặt của
// thầy nên không có cấu hình nào trong IndexedDB; nạp một lần ở đây từ
// `public/cau-hinh.json` rồi cất lại, để đường nóng lúc thi chỉ đọc IndexedDB.
// Không chờ: hỏng thì em đi Apps Script như cũ.
void napDiaChiMayChuMoiChoEm()

// BẢN MỚI PHẢI VỀ NGAY LẦN MỞ ĐẦU. Ba lớp cùng lo việc này:
//   1. sw.js tự gọi skipWaiting + clientsClaim lúc cài (vite.config.ts) — bản
//      mới chiếm quyền ngay thay vì nằm chờ tới khi đóng hết app.
//   2. daySangBanMoi() đẩy bản đang nằm chờ, cứu máy còn giữ sw cũ.
//   3. batTuHoiBanMoi() hỏi lại khi quay lại app, khi có mạng lại và mỗi 30
//      phút; hoãn khi em đang làm bài.
// An toàn để tự tải lại vì bài làm đã lưu liên tục vào IndexedDB (mất mạng
// hoặc tải lại giữa chừng vẫn khôi phục đúng — xem exam-db.ts).
// Bản mới chiếm quyền thì TỰ TẢI LẠI trang — nếu không, máy đã cầm bản mới mà
// màn hình vẫn chạy mã cũ. Đăng ký trước `registerSW` để không bỏ lỡ lần đổi
// bản đầu tiên.
tuTaiLaiKhiDoiBan()

const dangKySW = () =>
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
// MÁY EM MỞ CỔNG HỌC SINH LẦN ĐẦU (chưa có service worker điều khiển trang — 05/10, tối ưu mở app học sinh): ĐĂNG KÝ SAU khi Sảnh đã vẽ
// (sự kiện `ddh-sanh-da-ve` của hoa2/api.ts) hoặc sau 30 giây nếu em chưa vào Sảnh. Lượt cài precache (~3 MB, tất-cả-hoặc-không) nhờ thế
// không giành đường truyền với màn đăng nhập, mảnh cổng và lệnh đăng nhập/Sảnh trên mạng yếu. Lần đầu chưa có bản cũ nào để thay ⇒ không
// chậm việc nhận bản mới. Máy đã có service worker (mở lại, cập nhật bản) và MỌI đường khác (màn thi, phụ huynh, thầy) ⇒ đăng ký NGAY như cũ.
if (laCongHocSinh && typeof navigator !== 'undefined' && navigator.serviceWorker && !navigator.serviceWorker.controller) {
  let daDangKy = false
  const dangKyMotLan = () => {
    if (daDangKy) return
    daDangKy = true
    dangKySW()
  }
  window.addEventListener('ddh-sanh-da-ve', dangKyMotLan, { once: true })
  setTimeout(dangKyMotLan, 30_000)
} else dangKySW()
// LỚP BẢO HIỂM 4 (P1 21/09): ba lớp trên đều trông vào service worker cài được bản mới; máy nào cài hỏng (mạng yếu rớt một tệp precache) thì kẹt bản cũ mãi.
// Lớp này tự hỏi sw-version.json rồi so với giờ dựng đóng trong gói; mới hơn mà 20 giây sau chưa tự lên thì xoá kho SW + nạp lại. Rào: không ép lúc em làm bài;
// mỗi bản tối đa 2 lần; không đụng IndexedDB/localStorage. Xem bao-hiem-ban-moi.ts.
batBaoHiemBanMoi()

const goc = createRoot(document.getElementById('root')!)
void napGoc.then(({ default: App }) =>
  goc.render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)

startAppPresence()
