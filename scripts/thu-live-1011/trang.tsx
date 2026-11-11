// TRANG THỬ LIVE BẢNG (10/11, đợt 1B) — component THẬT (ManBinhPhanUng + LopLive · tờ chiếu thật + phần nối live của app thầy) nói chuyện với phòng THẬT
// chạy trong Node (scripts/thu-live-1011/may-chu.mjs). Không máy chủ thật, không dữ liệu học sinh thật.
//   ?vai=em&sbd=S1 [&yeu=1 máy yếu]      — máy em
//   ?vai=thay [&giay=toi] [&noi=1]        — tờ chiếu trong khung + cửa sổ app (mic, phòng); noi=1: tờ có cầu nối (mã phiên thu1111)
// Cách chạy: xem đầu tệp scripts/thu-live-1011/thu.mjs
import '../chup-bpu-de-chang-1011/bat-trong'
import '../../src/components/m3/m3-tuong-thich.css'
import '../../src/components/bang-nhiem-vu/m3-theme.css'
import '../../src/components/m3/m3.css'
import '../../src/components/loi-giai/loi-giai.css'
import '../../src/components/o-so-tra-loi.css'
import '../../src/components/m3/khung-xem-phieu.css'
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/styles/the-loc.css'
import '../../src/styles/may-yeu.css'
import '../../src/components/exp-cau/exp-cau.css'
import '../../src/components/bat-linh/bat-linh.css'
import '../../src/components/bat-linh/hoc-sinh.css'
import '../../src/components/bat-linh/che-do-toi.css'
import '../../src/styles/giao-dien-day-du.css'
import '../../src/components/logo-ddh.css'
import '../../src/components/m3/phieu-screen.css'
import '../../src/styles/trong.css'
import '../../src/components/m3/the-cau.css'
import '../../src/components/bang-nhiem-vu/sheet-m3.css'
import '../../src/components/hoc-tap/hoc-tap.css'
import '../../src/styles/trong-hs.css'
import '../../src/styles/trong-hs-ngang.css'
import '../../src/styles/trong-kinh.css'
import '../../src/styles/bong-mol.css'
import '../../src/styles/bo-cuc-hn.css'
import '../../src/styles/khong-xuong-hs.css'
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import ManBinhPhanUng from '../../src/components/bpu/ManBinhPhanUng'
import { noiLive } from '../../src/components/bpu/cau-live'
import { layDiaChiMayChu } from '../../src/lib/dia-chi-may-chu'
import { taoHtmlMayChieu } from '../../src/lib/html-may-chieu'

// KHÔNG yêu cầu nào ra máy chủ thật: mọi lệnh (fetch) và mọi WebSocket của app đều đổi về máy chủ thử đang phục vụ trang này.
const fetchGoc = window.fetch.bind(window)
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
  if (u.origin === location.origin) return fetchGoc(input, init)
  if (input instanceof Request) return Promise.resolve(new Response('{"ok":false}', { status: 200, headers: { 'content-type': 'application/json' } }))
  return fetchGoc(location.origin + u.pathname + u.search, init)
}
const WsGoc = window.WebSocket
window.WebSocket = class extends WsGoc {
  constructor(url: string | URL, p?: string | string[]) { const u = new URL(String(url), location.href); super(`${location.origin.replace(/^http/, 'ws')}${u.pathname}${u.search}`, p) }
}

const ts = new URLSearchParams(location.search)
const vai = ts.get('vai') ?? 'em'
const noop = () => {}
const goc = document.getElementById('root')!

if (vai === 'em') {
  void layDiaChiMayChu(location.origin).then(() => {
    createRoot(goc).render(h(ManBinhPhanUng, { token: `tk-${ts.get('sbd') ?? 'S1'}`, buoiId: 'b1', onDong: noop }))
  })
} else {
  // Tờ chiếu thật, hai đợt (hai câu) — mã câu trùng câu bộ thử mở lượt.
  const cau = (id: string, text: string, luaChon: string[]) => ({ phan: 'I', id, maDe: '', chuyenDe: 'Alcohol', dang: 'Bậc alcohol', sao: 2, mucDo: '', text, luaChon, dapAn: 'B', chot: 'Bậc alcohol = bậc của C mang nhóm –OH.', lyDo: [{ khoa: 'B', ly: 'C mang –OH nối với 2 C khác.' }], buoc: ['Tìm C mang –OH.', 'Đếm số C nối với nó.'] })
  const o = (sbd: string, hoTen: string, c: unknown, soCau: number) => ({ sbd, hoTen, qid: 'Q' + soCau, soCau, sao: 2, cau: c, bacUoc: 2, lop: '12A1', lanLenBang: 3 })
  const html = taoHtmlMayChieu([
    o('S1', 'Nguyễn Thị Hà', cau('Q1', 'Alcohol nào sau đây là alcohol bậc II?', ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH']), 1),
    o('S2', 'Lê Gia Huy', cau('Q2', 'Phenol (C₆H₅OH) tác dụng được với dung dịch nào sau đây?', ['NaCl', 'NaOH', 'HCl', 'NaHCO₃']), 2),
  // ?noi=1 (bộ thử thanh đáy 11/11): tờ có cầu nối ⇒ đủ nút «Ai sai», «Thầy chữa», «Đạt», «Không đạt» như tờ thật trong app thầy; bộ thử gửi tin kết nối thay app.
  ] as never, (ts.get('noi') === '1' ? { tenBuoi: 'Buổi chữa 11/11', cauNoi: { maPhien: 'thu1111' } } : { tenBuoi: 'Buổi chữa 10/11', nutAiSai: false }) as never)
  const khung = document.createElement('iframe')
  khung.setAttribute('title', 'Tờ chiếu')
  khung.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0'
  if (ts.get('giay') === 'toi') khung.addEventListener('load', () => { khung.contentDocument?.documentElement.setAttribute('data-projector', 'dark') })
  khung.srcdoc = html
  document.body.style.margin = '0'
  document.body.appendChild(khung)
  const noi = () => {
    const w = new WebSocket(`${location.origin.replace(/^http/, 'ws')}/bpu/phong?ve=gv`)
    noiLive(w, 'gv', location.origin)
    w.onopen = () => w.send('{"t":"chao"}')
    w.onclose = () => setTimeout(noi, 800)
    ;(window as unknown as { __ws: WebSocket }).__ws = w // bộ thử đóng vai bảng Bình Phản Ứng: gửi lệnh «gọi em lên bảng»
  }
  noi()
}
document.documentElement.dataset.trong = vai === 'em' ? 'hs' : 'gv'
if (vai === 'em') document.documentElement.setAttribute('data-ht2', '')
if (ts.get('yeu') === '1') document.documentElement.classList.add('may-yeu')
try { localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tk-gia' })) } catch { /* chặn lưu */ }
