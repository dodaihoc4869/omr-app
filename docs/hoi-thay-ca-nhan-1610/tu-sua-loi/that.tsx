// Chỉ dùng trong kiểm Chromium/API giả, không vào app phát hành.
import '../../../src/components/m3/m3-tuong-thich.css'
import '../../../src/components/bang-nhiem-vu/m3-theme.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '../../../src/styles/tokens.css'
import '../../../src/index.css'
import { createRoot } from 'react-dom/client'
import ManTuChua from '../../../src/components/hoc-tap/ManTuChua'
createRoot(document.getElementById('goc')!).render(<ManTuChua token="token-thu-giao-dien" onVe={() => {}} />)
