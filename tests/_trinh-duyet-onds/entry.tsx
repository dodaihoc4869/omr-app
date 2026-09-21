// Khung dựng THẬT (React chạy trong Chromium) cho ONhapDapSo: được `tests/o-nhap-dap-so-trinh-duyet-2109.test.ts` đóng gói bằng rolldown rồi nhét vào trang thử.
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import ONhapDapSo from '../../src/components/ONhapDapSo'

function App() {
  const [v, setV] = useState('')
  const [nop, setNop] = useState(0)
  ;(window as unknown as { __nop: number }).__nop = nop
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); setNop((n) => n + 1) }}>
        <ONhapDapSo id="o" value={v} onChange={setV} ariaLabel="Đáp số" placeholder="Đáp số" maxLength={12} />
      </form>
      <output id="gia-tri">{v}</output>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
