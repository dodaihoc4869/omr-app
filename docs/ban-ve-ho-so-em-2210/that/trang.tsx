// TRANG CHỤP HIỆN TRẠNG (22/10) — LINH KIỆN THẬT, dữ liệu GIẢ (minh hoạ). Chỉ dùng cho `node scripts/chup-ban-ve-ho-so-em-2210.mjs` (vite dev, cấu hình riêng).
//   ?man=ho-so&che=thay|hoc-sinh|phu-huynh  ⇒ tấm "Hồ sơ làm bài" (HoSoLamCauEm) bọc đúng vỏ + CSS của từng app (như scripts/chup-muc-lam-2110/trang.tsx)
//   ?man=toan-canh                            ⇒ trang "Toàn cảnh một em" của thầy (ToanCanhEmScreen); lệnh /gv/em-toan-canh do `goi-lenh-thay-gia.ts` trả (bí danh trong cấu hình vite của script)
//   &du=6muc                                  ⇒ (bước 4, màn BUILD thật) dữ liệu 6 mức scripts/chup-v2/gia/lich-su-6-muc.ts; &t=tai|loi|mang|rong|cu ⇒ các trạng thái của đặc tả mục 3
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
import { lichSu6MucGia } from '../../../scripts/chup-v2/gia/lich-su-6-muc'
import type { KetQuaLichSuLamCau } from '../../../server/src/lich-su-lam-cau-kieu'

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
  const sau = q.get('du') === '6muc'
  const t = q.get('t') ?? 'dl'
  const tdSau = { ...td, nhomNhip: 'chua-deu' as const, coDoiPho: true }
  let lanGoi = 0
  const ls6 = (): KetQuaLichSuLamCau => {
    const kq = lichSu6MucGia(SBD, td.em.hoTen, che, { cu: t === 'cu' })
    if (t !== 'rong') return kq
    return { ...kq, lan: [], cauSai: [], tong: { soLuot: 0, soDung: 0, soSai: 0, soBoTrong: 0, soCau: 0, soCauSai: 0, giayTb: null, tongGiay: 0 }, mucLam: undefined, mucLam6: undefined }
  }
  const nguon: NguonHoSo = sau
    ? {
        hoSoThaiDo: async () => ({ ok: true, du: tdSau }),
        lichSu: async () => {
          lanGoi++
          if (t === 'tai') return new Promise(() => {})
          if (t === 'loi') return { ok: false, loai: 'cham', chu: 'Máy chủ trả lời chậm — thử lại sau ít phút.' }
          if (t === 'mang' && lanGoi > 1) return { ok: false, loai: 'mang', chu: 'Failed to fetch' }
          return { ok: true, du: ls6() }
        },
      }
    : {
        hoSoThaiDo: async () => ({ ok: true, du: td }),
        lichSu: async () => ({ ok: true, du: lichSuMucGia(SBD, td.em.hoTen, { cheDo: che === 'thay' ? 'thay' : 'em' }) }),
      }
  const ve = (khoa: number) => {
    const tam = h(HoSoLamCauEm, { key: khoa, em: { sbd: SBD, ten: sau ? 'Lý Quang Minh' : td.em.hoTen, khoi: '12', lop: '12A1' }, nguon, cheDo: che, onDong: () => {} })
    const vo =
      che === 'thay'
        ? h('div', { className: 'm3 m3-thay vo-thay' }, tam)
        : che === 'hoc-sinh'
          ? h('div', { className: 'hs-ho-so-em', 'data-che-do': 'hoc-sinh' }, tam)
          : h('div', { className: 'ph-ho-so-con', 'data-che-do': 'phu-huynh' }, tam)
    goc.render(vo)
  }
  ve(0)
  // Mất mạng: mở lần hai trong 5 phút ⇒ vẽ ngay bản trong bộ nhớ, đọc mới NỀN hỏng ⇒ dải "Đang xem bản đã tải lúc …".
  if (sau && t === 'mang') setTimeout(() => ve(1), 400)
}
