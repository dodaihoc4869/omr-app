// TRANG CHỤP tấm "Hồ sơ làm bài" THẬT (HoSoLamCauEm) ở ba chế độ với lịch sử GIẢ có Mức làm 1–4 (gia/lich-su-muc-lam.ts, mức do hàm máy chủ thật tính).
// `?che=thay|hoc-sinh|phu-huynh[&chuaDo=1][&khongBeta=1]` — mỗi chế độ bọc đúng vỏ và CSS của app của nó (thầy: .m3.m3-thay.vo-thay · học sinh: .hs-ho-so-em · phụ huynh: .ph-ho-so-con).
import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/styles/vo-thay.css'
import '../../src/styles/gv-mau.css'
import '../../src/styles/teacher-modern.css'
import '../../src/components/chien-dich/gv-v2.css'
import '../../src/components/hoc-tap/ho-so-cua-em-hs.css'
import '../../src/components/ph-v3/ho-so-con.css'
import HoSoLamCauEm, { type CheDoHoSo, type NguonHoSo } from '../../src/components/chien-dich/HoSoLamCauEm'
import { hoSoThaiDoGia } from '../chup-v2/gia/bai-hang-ngay'
import { lichSuMucGia } from '../chup-v2/gia/lich-su-muc-lam'

const q = new URLSearchParams(location.search)
const che = (q.get('che') ?? 'thay') as CheDoHoSo
const SBD = '11010'
const td = hoSoThaiDoGia(SBD)
const nguon: NguonHoSo = {
  hoSoThaiDo: async () => ({ ok: true, du: td }),
  lichSu: async () => ({ ok: true, du: lichSuMucGia(SBD, td.em.hoTen, { cheDo: che === 'thay' ? 'thay' : 'em', chuaDo: q.get('chuaDo') === '1', khongBeta: q.get('khongBeta') === '1' }) }),
}
const tam = h(HoSoLamCauEm, { em: { sbd: SBD, ten: td.em.hoTen, khoi: '12' }, nguon, cheDo: che, onDong: () => {} })
const vo = che === 'thay' ? h('div', { className: 'm3 m3-thay vo-thay' }, tam) : che === 'hoc-sinh' ? h('div', { className: 'hs-ho-so-em', 'data-che-do': 'hoc-sinh' }, tam) : h('div', { className: 'ph-ho-so-con', 'data-che-do': 'phu-huynh' }, tam)
createRoot(document.getElementById('root')!).render(vo)
