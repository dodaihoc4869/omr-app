// TẠM, KHÔNG commit: dựng riêng KhoiRutDe với kho giả để soi biểu tượng.
import { createRoot } from 'react-dom/client'
import '/src/index.css'
import '/src/styles/tokens.css'
import '/src/styles/teacher-layout.css'
import '/src/styles/vo-thay.css'
import '/src/components/m3'
import KhoiRutDe from '/src/components/KhoiRutDe'

const CD = ['Ester – lipid', 'Carbohydrate', 'Hợp chất chứa N']
const kho: any[] = [
  {
    maDe: 'KHO',
    phanI: Array.from({ length: 60 }, (_, i) => ({ id: `I${i}`, text: `TN ${i}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: CD[i % 3], mucDo: 'hieu' })),
    phanII: Array.from({ length: 12 }, (_, i) => ({ id: `II${i}`, text: `ĐS ${i}`, ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'], chuyenDe: CD[i % 3], mucDo: 'hieu' })),
    phanIII: Array.from({ length: 9 }, (_, i) => ({ id: `III${i}`, text: `TLN ${i}`, correct: '1', chuyenDe: CD[i % 3], mucDo: 'van_dung' })),
  },
]
createRoot(document.getElementById('root')!).render(
  <div className="m3" style={{ maxWidth: 480, padding: 12 }}>
    <KhoiRutDe nguon={kho} qidCaTruoc={[]} phutLamBai={45} onDoi={() => {}} onDoiPhutLamBai={() => {}} />
  </div>,
)
