// Chỉ chạy trong harness Vite; API giả được Playwright chặn, không chạm dữ liệu thật.
import '../../../src/components/m3/m3-tuong-thich.css'
import '../../../src/components/bang-nhiem-vu/m3-theme.css'
import '../../../src/components/m3/m3.css'
import '../../../src/components/chien-dich/chien-dich.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '../../../src/styles/tokens.css'
import '../../../src/index.css'
import { createRoot } from 'react-dom/client'
import CanGiupHoiThay from '../../../src/components/chien-dich/CanGiupHoiThay'
createRoot(document.getElementById('goc')!).render(<main className="m3" style={{ padding: 16, maxWidth: 1040, margin: '0 auto' }}><CanGiupHoiThay /></main>)
