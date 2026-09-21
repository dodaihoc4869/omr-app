// Trang thử cho test Chromium THẬT của Bảng tin sàn (tests/bang-tin-san-chong-chu-trinh-duyet-2109.test.ts): dựng màn TRONG vỏ app thầy (ThanhBenTrai + BottomNav + đúng CSS của app), dữ liệu GIẢ, đồng hồ cố định.
// ?gd=sang|toi ép giao diện; ?vo=0 bỏ vỏ.
import { createRoot } from 'react-dom/client'
import '../../src/index.css'
import '../../src/styles/tokens.css'
import '../../src/styles/teacher-layout.css'
import '../../src/styles/vo-thay.css'
import '../../src/components/m3'
import { apDungGiaoDien, datGiaoDien } from '../../src/lib/giao-dien-thay'
import BottomNav from '../../src/components/BottomNav'
import ThanhBenTrai from '../../src/components/ThanhBenTrai'
import { useAppStore } from '../../src/store/appStore'
import BangTinSan from '../../src/components/bang-tin-san/BangTinSan'
import { taoDuLieuGia } from '../../src/lib/bang-tin-san/mau-gia'

const q = new URLSearchParams(location.search)
history.replaceState(null, '', '/gv')
const gd = q.get('gd')
if (gd === 'sang' || gd === 'toi') datGiaoDien(gd)
else apDungGiaoDien('may')
useAppStore.getState().setScreen('examhub')
const NAY = Date.parse('2026-09-21T08:28:36.000Z') // 15:28:36 giờ VN — đồng hồ CỐ ĐỊNH
// `window.__DU` (chỉ bản thử): dữ liệu ĐÃ ĐỌC qua docSan từ thân thật của máy chủ — để soi độ dài chữ thật (tên dài, tên lớp thật)
const duThat = (window as unknown as { __DU?: Parameters<typeof BangTinSan>[0]['du'] }).__DU
// `?may=tot|ban|nghen` (chỉ bản thử): chip "Máy chủ: …" ở thanh trên — soi chồng chữ với chip dài nhất ("đang bận")
const may = q.get('may')
const man = <BangTinSan du={duThat ?? taoDuLieuGia(NAY)} nayMs={duThat ? duThat.serverNow : NAY} sucKhoe={may === 'tot' || may === 'ban' || may === 'nghen' ? may : null} />

createRoot(document.getElementById('root')!).render(
  q.get('vo') === '0' ? (
    man
  ) : (
    <div className="min-h-screen m3 m3-thay vo-thay">
      <ThanhBenTrai />
      <div className="khung-noi-dung">
        <div className="giua-noi-dung" data-teacher-screen="examhub">{man}</div>
      </div>
      <BottomNav />
    </div>
  ),
)
