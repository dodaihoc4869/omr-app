// KHUNG CHỤP màn kiểm tra kiểu Duo (30/10): dựng ĐÚNG các thành phần thật — ThiDuo (khung), TheCau (thẻ câu dùng chung với màn thi), KhungCauM3,
// VanTay, bảng nhập số — với dữ liệu GIẢ sát thực tế (minh hoạ, không phải đề thật). Cảnh chọn bằng ?canh=a|b|c2|c3|d|e. Chỉ để chụp ảnh nghiệm thu.
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

type Phan = 'I' | 'II' | 'III'
const q = new URLSearchParams(location.search)
const canh = q.get('canh') || 'a'
if (q.get('yeu') === '1') document.documentElement.classList.add('may-yeu')

const TONG = 28
const PHAN: Phan[] = Array.from({ length: TONG }, (_, i) => (i < 18 ? 'I' : i < 22 ? 'II' : 'III'))
const CAU_HIEN: Record<string, number> = { a: 3, b: 3, e: 7, c2: 20, c3: 25, d: 28 }
const DE_NGAN = 'Chất nào sau đây là amine bậc hai?'
const PA_NGAN: [string, string, string, string] = ['CH₃NH₂', 'C₆H₅NH₂', 'CH₃NHCH₃', '(CH₃)₃N']
const DE_DAI = 'Cho 0,1 mol hỗn hợp X gồm hai amine no, đơn chức, mạch hở, kế tiếp nhau trong dãy đồng đẳng tác dụng vừa đủ với dung dịch HCl, thu được 8,15 gam muối. Mặt khác, đốt cháy hoàn toàn lượng X trên bằng O₂ dư, dẫn toàn bộ sản phẩm cháy qua bình đựng dung dịch H₂SO₄ đặc thấy khối lượng bình tăng m gam. Giá trị của m là'
const PA_DAI: [string, string, string, string] = ['8,10', '9,00', '7,65', '10,35']
const DE_DS = 'Cho các phát biểu sau về aniline (C₆H₅NH₂):'
const Y_DS: [string, string, string, string] = ['Aniline là chất lỏng, ít tan trong nước.', 'Dung dịch aniline làm quỳ tím chuyển sang màu xanh.', 'Aniline tác dụng với nước bromine tạo kết tủa trắng.', 'Aniline có tính base mạnh hơn ammonia.']
const DE_TLN = 'Đốt cháy hoàn toàn 4,5 gam ethylamine (C₂H₅NH₂) bằng O₂ dư. Thể tích khí N₂ (đkc) thu được là bao nhiêu lít? (Làm tròn đến hàng phần trăm.)'

function App() {
  const hien = CAU_HIEN[canh] ?? 3
  const [cau, setCau] = useState(hien)
  const [pa, setPa] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | null>>({})
  const [ds, setDs] = useState<Array<'D' | 'S' | null>>(canh === 'c2' ? ['D', 'S', null, null] : [null, null, null, null])
  const [so, setSo] = useState('')
  const [moNop, setMoNop] = useState(canh === 'd')
  // câu đã làm: mọi câu trước câu đang xem (trừ 2 câu chừa lại ở cảnh nộp bài)
  const chuaLam = Array.from({ length: TONG }, (_, i) => i + 1).filter((n) => (canh === 'd' ? n === 11 || n === 24 : n >= hien))
  const daLam = TONG - chuaLam.length
  const the = (n: number) => {
    const ph = PHAN[n - 1]!
    const chung = { cheDo: 'thi' as const, stt: n, id: `cau-${n}`, onZoom: () => {} }
    if (ph === 'I') {
      const dai = n === 7
      return <TheCau key={n} {...chung} phan="I" text={dai ? DE_DAI : DE_NGAN} choices={dai ? PA_DAI : PA_NGAN} choicePerm={[0, 1, 2, 3]}
        selected={pa[n] ?? null} onSelect={(o) => setPa((x) => ({ ...x, [n]: o }))} />
    }
    if (ph === 'II') return <TheCau key={n} {...chung} phan="II" text={DE_DS} ideas={Y_DS} selected={ds} onSelect={(i, v) => setDs((x) => x.map((y, k) => (k === i ? v : y)))} />
    return <TheCau key={n} {...chung} phan="III" text={DE_TLN} selected={so} onChange={setSo} soO={4} />
  }
  const soCau = [3, 7, 20, 25, 28]
  return (
    <div className="min-h-screen m3 man-lam-bai duo-kt-trang" style={{ background: 'var(--nen)', color: 'var(--muc)', fontFamily: 'var(--serif)' }}>
      <VanTay sbd="00000" hoTen="Học sinh Mẫu" maCa="KT-AMINE-3010" gio="20:41" />
      <ThiDuo tenCa="Kiểm tra Amine · 30/10" dongHo="38:12" nhanDongHo="Thời gian còn lại" gap={false} daLam={daLam} tong={TONG}
        luu={{ nhan: 'đã lưu', tt: 'da' }} cauHien={cau} onDenCau={(n) => setCau(soCau.includes(n) ? n : hien)} phan={PHAN}
        moTaPhan={(ph) => (ph === 'I' ? '18 câu · mỗi câu 0,25 điểm' : ph === 'II' ? '4 câu · mỗi câu tối đa 1 điểm' : '6 câu · mỗi câu 0,25 điểm')}
        moLuoi={false} onMoLuoi={() => {}} moNop={moNop} onMoNop={setMoNop} chuaLam={chuaLam} danhDau={canh === 'd' ? [15] : []}
        nhanNutNop="Nộp bài" camNopSom={false} onNop={() => setMoNop(false)} onThoat={() => {}} tatPhim={false}>
        {soCau.map((n) => <KhungCauM3 key={n} soY={0} daDanhDau={false} onDoiDau={() => {}}>{the(n)}</KhungCauM3>)}
      </ThiDuo>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
