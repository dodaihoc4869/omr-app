// TRANG THỬ HỎI THẦY bằng LINH KIỆN THẬT (NutHoiThay → HopHoiThay → HoiThemThay → TraLoiThay) + đúng chuỗi CSS của app (src/main.tsx).
// Chỉ dùng cho `node scripts/chup-hoi-thay-that-1310.mjs` (vite dev; mạng /hs/* do Playwright chặn và trả dữ liệu mẫu). Không vào bản build.
import '../../../src/components/m3/m3-tuong-thich.css'
import '../../../src/components/bang-nhiem-vu/m3-theme.css'
import '../../../src/components/m3/m3.css'
import '../../../src/components/loi-giai/loi-giai.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/noto-serif/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '../../../src/styles/tokens.css'
import '../../../src/index.css'
import { createRoot } from 'react-dom/client'
import NutHoiThay from '../../../src/components/loi-giai/NutHoiThay'

const q = new URLSearchParams(location.search)
createRoot(document.getElementById('goc')!).render(
  <main className="m3" style={{ padding: 16 }}>
    <NutHoiThay qid={q.get('qid') || 'Q'} nguon="luyen_de" dangLam={q.get('dangLam') === '1'} />
  </main>,
)
