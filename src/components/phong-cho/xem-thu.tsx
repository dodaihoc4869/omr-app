// Hộp kiểm component thật với props mẫu; không nằm trong entry build và không gửi lệnh máy chủ.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-600.css'
import '@fontsource/be-vietnam-pro/vietnamese-700.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/latin-600.css'
import '@fontsource/be-vietnam-pro/latin-700.css'
import '../../styles/tokens.css'
import '../../index.css'
import PhongChoGame from '../PhongChoGame'
function XemThu() {
  const [batDau,setBatDau] = useState(false)
  const [loi,setLoi] = useState(false)
  return <>
    <div style={{display:'flex',gap:12,padding:8,fontSize:12,background:'var(--the)'}} data-dev>
      <button type="button" onClick={()=>document.documentElement.setAttribute('data-giao-dien',document.documentElement.getAttribute('data-giao-dien')==='toi'?'sang':'toi')}>Đổi nền</button>
      <button type="button" onClick={()=>setBatDau(!batDau)}>Thầy bắt đầu</button>
      <button type="button" onClick={()=>setLoi(!loi)}>Thử lỗi kết nối</button>
    </div>
    {batDau ? <h1 data-vao-bai>Đã chuyển vào bài làm</h1> : <PhongChoGame cho={{tenCa:'Ancol – Phenol',lop:'12A1',thoiGianPhut:50}} loiCho={loi?'Kết nối đang gián đoạn. App sẽ tự thử lại.':null} />}
  </>
}
createRoot(document.getElementById('root')!).render(<XemThu />)
