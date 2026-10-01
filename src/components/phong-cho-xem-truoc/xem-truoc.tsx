// BẢN XEM TRƯỚC RIÊNG: dữ liệu mẫu, chỉ chạy bằng Vite dev, không nối luồng thi.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Moon, Sun, FlaskConical, ArrowLeft, Play } from 'lucide-react'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../styles/tokens.css'
import LogoHocSinh from '../LogoHocSinh'
import ChuyenBay from './ChuyenBay'
import './phong-cho.css'

function XemTruoc() {
  const [toi, setToi] = useState(new URLSearchParams(location.search).get('nen') === 'toi')
  const [batDau, setBatDau] = useState(false)
  document.documentElement.setAttribute('data-giao-dien', toi ? 'toi' : 'sang')
  return <div className="pc-preview">
    <nav className="pc-preview-bar" aria-label="Điều khiển bản xem trước">
      <span><i /> BẢN XEM TRƯỚC <small>· dữ liệu mẫu</small></span>
      <button type="button" onClick={() => setToi(!toi)} aria-label={toi ? 'Xem nền sáng' : 'Xem nền tối'}>{toi ? <Sun size={18} /> : <Moon size={18} />}</button>
    </nav>
    <header className="pc-brand"><div><LogoHocSinh size={44} hienChu={false} /><span>AVOGADRO<small>Học một chút, tiến một bước.</small></span></div><span className="pc-room-label">Phòng chờ</span></header>
    <main className="pc-main">
      <div className="pc-wait"><span className="pc-status"><i /> Em đã vào phòng chờ</span><h1>Đang chờ Thầy bấm bắt đầu</h1><p>Em cứ thư giãn. Đề sẽ tự hiện khi Thầy bắt đầu.</p><div className="pc-session">Ca thi: Ancol – Phenol <span>·</span> Lớp 12A1 <span>·</span> 50 phút làm bài</div></div>
      {batDau ? <section className="pc-started"><FlaskConical size={40} /><h2>Thầy đã bắt đầu</h2><p>Game dừng để chuyển sang bài làm.</p><small>Đây là trạng thái mô phỏng của bản xem trước.</small><button type="button" onClick={() => setBatDau(false)}><ArrowLeft size={16} /> Xem lại phòng chờ</button></section> : <ChuyenBay key={toi ? 'toi' : 'sang'} />}
      <p className="pc-assurance">Điểm chơi chỉ để vui trong lúc chờ.</p>
    </main>
    <footer className="pc-preview-footer"><span>Xem mẫu trước khi ghép vào app</span><button type="button" onClick={() => setBatDau(!batDau)}><Play size={14} /> {batDau ? 'Xem lại game' : 'Thử lúc thầy bắt đầu'}</button></footer>
  </div>
}
createRoot(document.getElementById('root')!).render(<XemTruoc />)
