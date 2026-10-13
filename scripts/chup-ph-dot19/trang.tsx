// TRANG CHỤP ẢNH ĐỢT 19 · LÀN R — app phụ huynh THẬT (AppPhuHuynh) + máy chủ GIẢ ngay trong trang (thay `fetch`; không yêu cầu nào tới máy chủ thật,
// tên con là tên giả). Số theo bản vẽ thầy duyệt (gia.ts). `?cham=1` ⇒ mọi lệnh trả chậm 1,5 giây (xem khung chờ).
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-800.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/latin-800.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/components/m3'
import AppPhuHuynh from '../../src/components/ph-v3/AppPhuHuynh'
import { NAY, hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from './gia'

const thamSo = new URLSearchParams(location.search)
const cham = thamSo.get('cham') === '1' ? 1500 : 0
const tra = (o: unknown, status = 200) => new Promise<Response>((ok) => setTimeout(() => ok(new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } })), cham))
const goi: string[] = []
;(window as unknown as { __goi: string[] }).__goi = goi
window.fetch = async (input: RequestInfo | URL) => {
  const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, location.href)
  const d = u.pathname
  goi.push(d)
  if (d.endsWith('cau-hinh.json')) return tra({ mayChuMoi: 'https://may-chu-gia.example.com' })
  if (d.endsWith('/ph/nhip-hoc')) return tra(nhipGia())
  if (d.endsWith('/ph/con-tong-quan')) return tra(tongQuanGia())
  if (d.endsWith('/ph/tat-ca-ve-con')) return tra(tatCaGia())
  if (d.endsWith('/ph/hoc-2')) return tra(hoc2Gia())
  if (d.endsWith('/ph/loi-thay')) return tra(loiThayGia())
  if (d.endsWith('/ph/ho-so-thai-do')) return tra(thaiDoGia())
  if (d.endsWith('/ph/lich-su-lam-cau')) return tra(lichSuGia())
  return tra({ ok: true })
}
const dau = performance.now()
Date.now = () => NAY + (performance.now() - dau) // đồng hồ trang = 21:05 Thứ Tư 14/10/2026 giờ VN (khớp số giả)

createRoot(document.getElementById('root')!).render(h('div', { className: 'm3' }, h(AppPhuHuynh, { sbd: '12121212', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', onDoiSbd: () => {} })))
