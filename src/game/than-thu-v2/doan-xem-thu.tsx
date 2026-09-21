// TRANG XEM THỬ (chỉ `npm run dev`, KHÔNG vào bản build): /src/game/than-thu-v2/doan-xem-thu.html?khoan=du|tran|cu
// Dựng màn KẾT CHUYẾN của Đoàn Hộ Tống với dữ liệu giả, bọc trong `.dh` như DoanHoTong thật: du = ba khoản EXP · tran = đủ trần 120/ngày (các khoản +0) · cu = máy chủ cũ (không expChang).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../styles/tokens.css'
import '../../index.css'
import './game.css'
import './doan.css'
import DoanKetChang from './DoanKetChang'

const q = new URLSearchParams(location.search).get('khoan') ?? 'du'
const expChang =
  q === 'du'
    ? [{ loai: 'doan_chang', exp: 15, ghiChu: '' }, { loai: 'doan_giap', exp: 6, ghiChu: '' }, { loai: 'tiepsuc', exp: 5, ghiChu: '' }, { loai: 'tiepsuc', exp: 5, ghiChu: '' }]
    : q === 'tran'
      ? [{ loai: 'doan_chang', exp: 0, ghiChu: '' }, { loai: 'doan_giap', exp: 0, ghiChu: '' }]
      : undefined
const ketChang = {
  thang: true, sao: 3, linhTam: { hp: 8, toiDa: 10 }, trumVoGiap: [true, true, false], quaiHaGuc: 14, soLienKich: 2, expChang,
  cuaEm: { soLanGiup: 2, soLanGiupThanhCong: 1 }, tienBo: { tuLamDung: 7, soCau: 9, lenBac: null, duocGiup: 0 }, doanLop: null, anThach: null, ban: [],
}
const xem = { ghe: [{ ghe: 0, ten: 'Em', pet: 0, cap: 5, laMay: false, roi: false, laEm: true, trangThai: 'san_sang', tinHieu: null }], ketChang } as never
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="dh" data-man="ket-chang">
      <DoanKetChang xem={xem} expNhan={q === 'cu' ? 26 : 0} ve={2} ban={false} onVe={() => {}} onDiTiep={() => {}} />
    </div>
  </StrictMode>,
)
