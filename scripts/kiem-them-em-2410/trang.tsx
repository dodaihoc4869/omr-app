import { createRoot } from 'react-dom/client'
import '../../src/styles/tokens.css'
import '../../src/index.css'
import '../../src/styles/gv-mau.css'
import { BuocDiemDanh, useDiemDanhBuoi } from '../../src/components/day-hoc/DiemDanhBuoi'
function Khung() {
  const dd = useDiemDanhBuoi()
  return <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="bd-b1" thanh onSangDauGio={() => {}} />
}
createRoot(document.getElementById('root')!).render(<div className="m3 m3-thay vo-thay" style={{ padding: 16 }}><Khung /></div>)
