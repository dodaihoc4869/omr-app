// TRANG CHỤP «XEM LẠI LIVE — MÁY EM» (đợt X2, thầy chốt build 11/11). Thành phần THẬT; mọi lệnh máy chủ (`/hs/live-ds`, `/hs/live-buoi`, `/live-tep/…`)
// do chup.mjs trả lời bằng dữ liệu giả đúng hợp đồng (tests/_live-xem-lai-gia.ts). Không yêu cầu nào tới máy chủ thật, không dữ liệu học sinh thật.
//   ?man=them  tấm «Thêm» thật (MenuDocTrong) có dòng «Live»      ?man=ds    màn của app học sinh: danh sách → trang buổi → trình phát
//   ?man=buoi  điểm vào dùng chung mở thẳng một buổi (nguon=hs)    ?man=gv    như trên với nguon=gv (app thầy bấm «Mở»)
//   [&yeu=1 máy yếu]
// Thứ tự CSS theo src/main.tsx + cổng học sinh (như scripts/chup-bpu-de-chang-1011).
import './bat-trong'
import './../../src/components/m3/m3-tuong-thich.css'
import './../../src/components/bang-nhiem-vu/m3-theme.css'
import './../../src/components/m3/m3.css'
import './../../src/components/loi-giai/loi-giai.css'
import './../../src/components/o-so-tra-loi.css'
import './../../src/components/m3/khung-xem-phieu.css'
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import './../../src/styles/tokens.css'
import './../../src/styles/thang.css'
import './../../src/index.css'
import './../../src/styles/the-loc.css'
import './../../src/styles/may-yeu.css'
import './../../src/components/exp-cau/exp-cau.css'
import './../../src/components/bat-linh/bat-linh.css'
import './../../src/components/bat-linh/hoc-sinh.css'
import './../../src/components/bat-linh/che-do-toi.css'
import './../../src/styles/giao-dien-day-du.css'
import './../../src/components/logo-ddh.css'
import './../../src/components/m3/phieu-screen.css'
import './../../src/styles/trong.css'
import './../../src/components/m3/the-cau.css'
import './../../src/components/bang-nhiem-vu/sheet-m3.css'
import './../../src/components/hoc-tap/hoc-tap.css'
import './../../src/styles/trong-hs.css'
import './../../src/styles/trong-hs-ngang.css'
import './../../src/styles/trong-kinh.css'
import './../../src/styles/bong-mol.css'
import './../../src/styles/bo-cuc-hn.css'
import './../../src/styles/khong-xuong-hs.css'
import { createElement as h, createRef } from 'react'
import { createRoot } from 'react-dom/client'
import { MenuDocTrong } from '../../src/components/hoc-tap/TrongHs'
import { layDiaChiMayChu } from '../../src/lib/dia-chi-may-chu'
import XemBuoiLive, { ManLiveHs } from '../../src/screens/live-xem-lai/hs'

const ts = new URLSearchParams(location.search)
const man = ts.get('man') ?? 'ds'
const noop = () => {}

/** Nền «Hôm nay» giản lược phía sau tấm «Thêm» (chỉ để ảnh có ngữ cảnh — không phải màn thật). */
const nenHomNay = () =>
  h('main', { style: { maxWidth: 560, margin: '0 auto', padding: '20px 16px 140px' } },
    h('p', { style: { fontSize: 13.5, fontWeight: 600, color: 'var(--tr-chu-3)', margin: 0 } }, 'Thứ Tư 11/11 · 12A1'),
    h('h1', { style: { fontSize: 26, fontWeight: 800, margin: '0 0 14px' } }, 'Chào Minh Anh'),
    h('div', { style: { borderRadius: 26, padding: 18, background: 'var(--tr-mat)', boxShadow: 'inset 0 0 0 1px var(--tr-vien)' } },
      h('small', { style: { fontSize: 12.5, fontWeight: 800, letterSpacing: '.06em', color: 'var(--tr-chu-3)' } }, 'TỔNG CÂU HÔM NAY'),
      h('b', { style: { display: 'block', fontSize: 40, fontWeight: 800, lineHeight: 1.1 } }, '12/35 câu')))
const nut = createRef<HTMLButtonElement>()
const them = () =>
  h('div', { className: 'ht-app ht2', 'data-mot': '', 'data-nguon': 'hs' },
    h(MenuDocTrong, { muc: 'hom-nay', ds: [], onMuc: noop, coCa: false, onThi: noop, dangTai: false, onTaiLai: noop, chuDau: 'MA', moCuaEm: false, onCuaEm: noop, nutCuaEm: nut, token: 'tk-gia', moDiemDanh: false }),
    nenHomNay())

// Nhớ địa chỉ máy chủ GIẢ trước khi dựng màn (chup.mjs chặn mọi yêu cầu tới địa chỉ này và trả dữ liệu giả).
void layDiaChiMayChu('https://may-chu-gia.test').then(() => {
  const goc = createRoot(document.getElementById('root')!)
  if (man === 'them') goc.render(them())
  else if (man === 'buoi' || man === 'gv') goc.render(h(XemBuoiLive, { id: ts.get('id') ?? 'buoi-gia-1011', ve: 've-gia', nguon: man === 'gv' ? 'gv' : 'hs', dong: noop }))
  else goc.render(h(ManLiveHs, { token: 'tk-gia', dong: noop }))
})
