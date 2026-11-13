// TRANG CHẠY THỬ đợt 4 (dữ liệu giả, mã sản xuất thật): ?man=tu-do | sanh | thi-dua.
// Chạy: npx vite --port 5231 --strictPort rồi node docs/ban-ve-sinh-ton-v2-1311/that-dot4/chup.mjs
import '../../../src/styles/tokens.css'
import '../../../src/styles/trong-hs-mau.css'
import { createRoot } from 'react-dom/client'
import SanhSinhTon from '../../../src/components/phong-cho/SanhSinhTon'
import TuDoBeMa from '../../../src/components/phong-cho/TuDoBeMa'
import ThiDuaTuanThay from '../../../src/components/live-khoi/ThiDuaTuanThay'
import { docDuLieuTuDo } from '../../../src/components/phong-cho/tu-do-api'
import { MAC_TRONG } from '../../../src/lib/live-khoi/tu-do'

const DU = {
  ok: true, cap: 14, chuoi: 12, mo: ['mu-tot-nghiep', 'tai-nghe', 'ao-ke-o-li'], mac: { ...MAC_TRONG, mu: 'mu-tot-nghiep', ao: 'ao-ke-o-li' },
  thanhTich: { ha: 52, chuoiMax: 4, thuKhoa: 1, haThay: 0, van: 30 }, huyHieu: ['ha-10', 'ha-50', 'lien-3', 'tk-1'], doiKy: 1, danhHieu: ['tho-san'],
  thiDua: { chuTuan: '09/11 – 15/11', doi: [388, 412, 301, 276] },
}
const GV = {
  ok: true, chuTuan: '09/11 – 15/11', doi: [388, 412, 301, 276], soEm: 38,
  danhHieuTuanNay: [{ loai: 'tho-san', ten: 'Thợ săn tuần', nguoi: ['Gia Bảo'], so: 58 }, { loai: 'pha-tk', ten: 'Kẻ phá thủ khoa', nguoi: ['Minh Anh'], so: 6 }, { loai: 'ha-thay', ten: 'Hạ gục Thầy', nguoi: ['Gia Huy'], so: 3 }],
  danhHieuTuanTruoc: [{ loai: 'tho-san', ten: 'Thợ săn tuần', nguoi: ['Khánh Ngọc'], so: 47 }],
}
const goc = window.fetch.bind(window)
window.fetch = (async (u: RequestInfo | URL, o?: RequestInit) => {
  const s = String(u)
  if (s.includes('/hs/bpu/st-tu-do')) return new Response(JSON.stringify(DU))
  if (s.includes('/hs/bpu/st-mac')) return new Response(JSON.stringify({ ok: true, mac: JSON.parse(String(o?.body ?? '{}')).mac }))
  if (s.includes('/gv/bpu/st-thi-dua')) return new Response(JSON.stringify(GV))
  return goc(u, o)
}) as typeof fetch
document.documentElement.style.background = 'var(--tr-nen, var(--nen))'
document.body.style.margin = '0'
const man = new URLSearchParams(location.search).get('man') || 'sanh'
const r = createRoot(document.getElementById('goc')!)
if (man === 'tu-do') r.render(<TuDoBeMa du={docDuLieuTuDo(DU)!} xt={{ ve: 'v' }} onDong={() => {}} />)
else if (man === 'thi-dua') r.render(<ThiDuaTuanThay khoi={11} onDong={() => {}} />)
else r.render(
  <div style={{ padding: '16px', fontFamily: 'var(--sans)', color: 'var(--tr-chu, var(--muc))', maxWidth: 480, margin: '0 auto' }}>
    <p style={{ textAlign: 'center', margin: '8px 0 2px', fontSize: 15 }}>Em đã vào phòng chờ</p>
    <h1 style={{ textAlign: 'center', margin: '0 0 4px', fontSize: 24 }}>Đang chờ Thầy bấm bắt đầu</h1>
    <p style={{ textAlign: 'center', margin: '0 0 16px', fontSize: 15 }}>Ca kiểm tra: Kiểm tra Ancol – Phenol · Lớp 11A2</p>
    <SanhSinhTon maCa="123456" veDau="ve-ky" />
  </div>,
)
