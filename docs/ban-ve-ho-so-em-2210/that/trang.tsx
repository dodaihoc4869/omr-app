// TRANG CHỤP HIỆN TRẠNG (22/10) — LINH KIỆN THẬT, dữ liệu GIẢ (minh hoạ). Chỉ dùng cho `node scripts/chup-ban-ve-ho-so-em-2210.mjs` (vite dev, cấu hình riêng).
//   ?man=ho-so&che=thay|hoc-sinh|phu-huynh  ⇒ tấm "Hồ sơ làm bài" (HoSoLamCauEm) bọc đúng vỏ + CSS của từng app (như scripts/chup-muc-lam-2110/trang.tsx)
//   ?man=toan-canh                            ⇒ trang "Toàn cảnh một em" của thầy (ToanCanhEmScreen); lệnh /gv/em-toan-canh do `goi-lenh-thay-gia.ts` trả (bí danh trong cấu hình vite của script)
// Không vào bản build app. Không sửa src/.
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../../src/styles/tokens.css'
import '../../../src/styles/thang.css'
import '../../../src/index.css'
import '../../../src/styles/vo-thay.css'
import '../../../src/styles/gv-mau.css'
import '../../../src/styles/teacher-modern.css'
import '../../../src/styles/teacher-layout.css'
import '../../../src/components/chien-dich/gv-v2.css'
import '../../../src/components/hoc-tap/ho-so-cua-em-hs.css'
import '../../../src/components/ph-v3/ho-so-con.css'
import HoSoLamCauEm, { type CheDoHoSo, type NguonHoSo } from '../../../src/components/chien-dich/HoSoLamCauEm'
import ToanCanhEmScreen from '../../../src/screens/ToanCanhEmScreen'
import { hoSoThaiDoGia } from '../../../scripts/chup-v2/gia/bai-hang-ngay'
import { lichSuMucGia } from '../../../scripts/chup-v2/gia/lich-su-muc-lam'

const q = new URLSearchParams(location.search)
const goc = createRoot(document.getElementById('root')!)
if (q.get('man') === 'toan-canh') {
  // Trang thầy: nạp thêm đúng chuỗi CSS toàn cục của app thầy (src/main.tsx) — chip lọc, khung trang.
  await Promise.all([
    import('../../../src/components/m3/m3-tuong-thich.css'),
    import('../../../src/components/bang-nhiem-vu/m3-theme.css'),
    import('../../../src/components/m3/m3.css'),
    import('../../../src/styles/the-loc.css'),
    import('../../../src/styles/giao-dien-day-du.css'),
  ])
  // Vỏ gần đúng khung app thầy: vùng nội dung là khối rộng hết màn (trong app là <main data-teacher-screen> của App.tsx).
  goc.render(
    h('div', { className: 'm3 m3-thay vo-thay', style: { minHeight: '100dvh', display: 'block', background: 'var(--m3-surface, var(--gvm-nen))' } },
      h('main', { 'data-teacher-screen': '', style: { display: 'block', width: '100%' } }, h(ToanCanhEmScreen, { sbdHoSo: '11010' }))),
  )
} else {
  const che = (q.get('che') ?? 'thay') as CheDoHoSo
  const SBD = '11010'
  const td = hoSoThaiDoGia(SBD)
  const nguon: NguonHoSo = {
    hoSoThaiDo: async () => ({ ok: true, du: td }),
    lichSu: async () => ({ ok: true, du: lichSuMucGia(SBD, td.em.hoTen, { cheDo: che === 'thay' ? 'thay' : 'em' }) }),
  }
  const tam = h(HoSoLamCauEm, { em: { sbd: SBD, ten: td.em.hoTen, khoi: '12' }, nguon, cheDo: che, onDong: () => {} })
  const vo =
    che === 'thay'
      ? h('div', { className: 'm3 m3-thay vo-thay' }, tam)
      : che === 'hoc-sinh'
        ? h('div', { className: 'hs-ho-so-em', 'data-che-do': 'hoc-sinh' }, tam)
        : h('div', { className: 'ph-ho-so-con', 'data-che-do': 'phu-huynh' }, tam)
  goc.render(vo)
}
