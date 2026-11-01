// KHUNG CHỤP ca thi kiểu Duo ở CHẾ ĐỘ TẬP TRUNG (thầy 01/11): dựng ĐÚNG các thành phần thật — ThiDuo (khung), TheCau, KhungCauM3, VanTay — trong lớp
// phủ giống cổng học sinh (có nút «Đóng phòng thi» nổi để thấy nó được cất). Dữ liệu GIẢ (tên, số báo danh, mã ca, đề minh hoạ). Kho giờ giả đứng yên ở
// ?gio=<giây> (mặc định 38:12); `window.__datGio(giây)` đẩy kho tới giây khác (cảnh lời báo). Chỉ để chụp ảnh nghiệm thu.
import '../../src/components/m3/m3-tuong-thich.css'
import '../../src/components/bang-nhiem-vu/m3-theme.css'
import '../../src/components/m3/m3.css'
import '../../src/components/loi-giai/loi-giai.css'
import '../../src/components/o-so-tra-loi.css'
import '@fontsource/noto-serif/latin-400.css'
import '@fontsource/noto-serif/vietnamese-400.css'
import '@fontsource/be-vietnam-pro/latin-400.css'
import '@fontsource/be-vietnam-pro/vietnamese-400.css'
import '../../src/styles/tokens.css'
import '../../src/styles/thang.css'
import '../../src/index.css'
import '../../src/styles/the-loc.css'
import '../../src/styles/may-yeu.css'
import '../../src/styles/giao-dien-day-du.css'
import '../../src/styles/trong.css'
import '../../src/styles/trong-hs.css'
import '../../src/styles/trong-lam-bai.css'
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ThiDuo from '../../src/components/kiem-tra-duo/ThiDuo'
import TheCau from '../../src/components/TheCau'
import VanTay from '../../src/components/VanTay'
import { KhungCauM3 } from '../../src/screens/DaiCauChuaLamM3'
import { dinhDangDongHo, useGiayConLai, type KhoGio } from '../../src/lib/dong-ho-thi'

type Phan = 'I' | 'II' | 'III'
const q = new URLSearchParams(location.search)
let giay = Number(q.get('gio') || 2292)
const ds = new Set<() => void>()
const kho: KhoGio = { conLai: () => giay, conLaiNgay: () => giay, dangKy: (f) => { ds.add(f); return () => { ds.delete(f) } } }
;(window as unknown as { __datGio: (x: number) => void }).__datGio = (x) => { giay = x; for (const f of Array.from(ds)) f() }
try { localStorage.removeItem('omr_bao_gio_thi') } catch { /* bỏ qua */ }

const TONG = 28
const PHAN: Phan[] = Array.from({ length: TONG }, (_, i) => (i < 18 ? 'I' : i < 22 ? 'II' : 'III'))
const DE = 'Chất nào sau đây là amine bậc hai?'
const PA: [string, string, string, string] = ['CH₃NH₂', 'C₆H₅NH₂', 'CH₃NHCH₃', '(CH₃)₃N']

function SoGio() {
  return <>{dinhDangDongHo(useGiayConLai(kho) ?? 0)}</>
}

function App() {
  const [pa, setPa] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const chuaLam = Array.from({ length: TONG }, (_, i) => i + 1).filter((n) => n >= 3)
  return (
    <div className="man-thi-phu" style={{ position: 'fixed', inset: 0, zIndex: 60, overflowY: 'auto' }}>
      <button type="button" aria-label="Đóng phòng thi, về cổng học sinh" style={{ position: 'fixed', top: 12, right: 12, zIndex: 61, width: 40, height: 40 }}>×</button>
      <div className="min-h-screen m3 man-lam-bai duo-kt-trang" style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--serif)' }}>
        <VanTay sbd="00000" hoTen="Nguyễn Minh Anh" maCa="KT-AMINE-0111" gio="20:41" />
        <ThiDuo tenCa="Kiểm tra Amine · 01/11" dongHo={<SoGio />} nhanDongHo="Thời gian còn lại" gap={false} daLam={TONG - chuaLam.length} tong={TONG}
          luu={{ nhan: 'đã lưu', tt: 'da' }} cauHien={3} onDenCau={() => {}} phan={PHAN}
          moTaPhan={(ph) => (ph === 'I' ? '18 câu · mỗi câu 0,25 điểm' : ph === 'II' ? '4 câu · mỗi câu tối đa 1 điểm' : '6 câu · mỗi câu 0,25 điểm')}
          moLuoi={false} onMoLuoi={() => {}} moNop={false} onMoNop={() => {}} chuaLam={chuaLam} danhDau={[]}
          nhanNutNop="Nộp bài" camNopSom={false} onNop={() => {}} onThoat={() => {}} tatPhim={false} gio={kho} luot="KT-AMINE-0111|2026-11-01T12:00:00.000Z">
          <KhungCauM3 soY={0} daDanhDau={false} onDoiDau={() => {}}>
            <TheCau cheDo="thi" stt={3} id="cau-3" onZoom={() => {}} phan="I" text={DE} choices={PA} choicePerm={[0, 1, 2, 3]} selected={pa} onSelect={setPa} />
          </KhungCauM3>
        </ThiDuo>
      </div>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
