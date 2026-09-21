// TRANG XEM THỬ (chỉ `npm run dev`, KHÔNG vào bản build): /src/components/bang-nhiem-vu/xem-thu-the-cuoi-chang.html?som=duoc|chua|khong
// Dựng THẺ CUỐI CHẶNG với dữ liệu giả để nhìn dòng "mở sớm chặng" của Điều 6: duoc = được mở sớm · chua = mở 00:00 ngày mai · khong = không có gì đáng nói.
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
import '../m3'
import TheCuoiChang from './TheCuoiChang'
import { docKetQuaChang, theChangView } from '../../lib/btvn-ca-nhan-kieu'

const q = new URLSearchParams(location.search).get('som') ?? 'duoc'
const moSom = q === 'duoc' ? { duoc: true, lyDo: null } : q === 'chua' ? { duoc: false, lyDo: 'chua_du_ti_le' } : undefined
const soDung = q === 'chua' ? 6 : 9
const ket = docKetQuaChang({
  ok: true, ketQua: [], chuaLam: [], loDaXong: 1, chang: { chiSo: 0, soCau: 10, soDung, xong: true },
  tienBo: { soCauDungLai: 2, soCauMoiGap: 3, soDangMoi: 1, dangLenBac: [] }, exp: { homNay: 46, conLaiLenCap: 120 }, moSom,
})!
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="m3">
      <TheCuoiChang view={theChangView(ket, 5)!} dong={() => {}} veBang={() => {}} />
    </div>
  </StrictMode>,
)
