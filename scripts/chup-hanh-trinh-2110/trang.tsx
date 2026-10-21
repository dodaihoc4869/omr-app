// TRANG CHỤP ẢNH MÀN THẬT "HÀNH TRÌNH MỘT TRANG 4 BƯỚC" + HỘP "BỔ SUNG BÀI HÔM NAY" (21/10) — component THẬT + máy chủ GIẢ (vite alias thay
// `goi-lenh-thay` và `exam-db`, xem vite.config.mjs; không yêu cầu nào tới máy chủ thật; tên em và số liệu là GIẢ). Tham số:
//   ?k=ht&mo=1|2|3|4   — Hành trình, bước mở sẵn (ghi phần nhớ bước của buổi trước khi vẽ)
//   ?k=hop             — hộp Bổ sung bài hôm nay (nền màn trống)
//   ?k=ht&chua=1       — chưa mở buổi (bước 1 mở)
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../src/components/m3/m3-tuong-thich.css'
import '../../src/components/bang-nhiem-vu/m3-theme.css'
import '../../src/components/m3/m3.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/screens/gv-hoa2.css'
import HanhTrinhV2 from '../../src/components/chien-dich/HanhTrinhV2'
import HopBoSungBai from '../../src/components/day-hoc/HopBoSungBai'
import { useSoDemGv } from '../../src/lib/so-dem-gv'

const q = new URLSearchParams(location.search)
const k = q.get('k') ?? 'ht'
const mo = q.get('mo')
if (mo) localStorage.setItem('ddh.hanhTrinh.buoc.BH-21', mo)
// Bước 3: buổi này đã chọn bài Amine (phần nhớ của bảng Dạy học) ⇒ danh sách câu hiện ngay.
localStorage.setItem('ddh.dayHoc.BH-21', JSON.stringify({ maChon: ['DH-12-C3-B12'], boCau: [], giao: {}, lopNhan: null, baiChon: null }))
useSoDemGv.setState({ canThayChua: 12 })
// Lệnh gọi thẳng `fetch` (bước cuối trên lớp, thẻ nút thắt): máy chủ giả trả "chưa bật" / rỗng.
window.fetch = async () => new Response(JSON.stringify({ ok: true, bat: false, ds: [], nhom: [], kemRieng: [] }), { headers: { 'content-type': 'application/json' } })

const goc = document.getElementById('root')!
goc.className = 'm3 gv2-trang'
goc.style.cssText = 'max-width:1360px;margin:0 auto;padding:24px 16px 48px;background:var(--gvm-nen);min-height:100dvh;box-sizing:border-box'
document.body.style.background = 'var(--gvm-nen)'
createRoot(goc).render(k === 'hop' ? h(HopBoSungBai, { onDong: () => {} }) : h(HanhTrinhV2, { theDau: q.get('the') ?? 'day-hoc' }))
