// TẠM, KHÔNG commit: dựng Bảng tin SÀN trong vỏ app thầy với dữ liệu giả. ?gd=sang|toi  ?cd=1 (đồng hồ cố định 15:28:36)  ?bo=nhip,tia,tin (bỏ khối)  ?vo=0 (không vỏ)
import { createRoot } from 'react-dom/client'
import '/src/index.css'
import '/src/styles/tokens.css'
import '/src/styles/teacher-layout.css'
import '/src/styles/vo-thay.css'
import '/src/components/m3'
import { apDungGiaoDien, datGiaoDien } from '/src/lib/giao-dien-thay'
import BottomNav from '/src/components/BottomNav'
import ThanhBenTrai from '/src/components/ThanhBenTrai'
import { useAppStore } from '/src/store/appStore'
import BangTinSan from '/src/components/bang-tin-san/BangTinSan'
import { taoDuLieuGia, phatSuKienGia } from '/src/lib/bang-tin-san/mau-gia'
import { useEffect, useState } from 'react'

const q = new URLSearchParams(location.search)
history.replaceState(null, '', '/gv')
const gd = q.get('gd')
if (gd === 'sang' || gd === 'toi') datGiaoDien(gd)
else apDungGiaoDien('may')
useAppStore.getState().setScreen('examhub')
const NAY = Date.parse('2026-09-21T08:28:36.000Z') // 15:28:36 giờ VN
const t0 = Date.now()
const du = taoDuLieuGia(NAY)
const bo = (q.get('bo') || '').split(',')
if (bo.includes('nhip')) du.dungNhip = null
if (bo.includes('tia')) du.tia = null
if (bo.includes('tin')) du.tin = []

function Vo() {
  const [d, setD] = useState(du)
  useEffect(() => {
    if (!q.get('live')) return
    let k = 1
    const id = setInterval(() => setD((x) => phatSuKienGia(x, Date.now() + (NAY - t0), 100 + k++)), 1200)
    return () => clearInterval(id)
  }, [])
  const man = <BangTinSan du={d} nayMs={q.get('cd') === '0' || q.get('live') ? undefined : NAY} />
  if (q.get('vo') === '0') return man
  return (
    <div className="min-h-screen m3 m3-thay vo-thay">
      <ThanhBenTrai />
      <div className="khung-noi-dung">
        <div className="giua-noi-dung" data-teacher-screen="examhub">{man}</div>
      </div>
      <BottomNav />
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<Vo />)
