// Chỉ dùng bởi Playwright trên Vite dev; không phải điểm vào bundle phát hành.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { saveCauHinhMayChu } from '../../src/lib/exam-db'
import { chuanHoaMayChu } from '../../src/lib/cau-hinh-may-chu'
import ManChuaCauSai from '../../src/components/chua-cau-sai/ManChuaCauSai'
import KhungChua from '../../src/components/chua-cau-sai/KhungChua'
import '../../src/index.css'
await saveCauHinhMayChu(chuanHoaMayChu({ BAT: true, URL: 'https://chua.test' }))
function App() {
  const [mo, setMo] = useState(false)
  return (
    <>
      <button onClick={() => setMo(true)}>Mở câu cần chữa</button>
      <button>Nút nền ngoài khung</button>
      {mo && (
        <KhungChua onDong={() => setMo(false)}>
          <ManChuaCauSai
            token="token-du-lieu-gia"
            qid="Q"
            onVe={() => setMo(false)}
          />
        </KhungChua>
      )}
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
