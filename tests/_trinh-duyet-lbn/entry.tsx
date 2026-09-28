// Khung dựng THẬT (React chạy trong Chromium) cho bố cục làm bài NGANG: `tests/cum-nop-ngang-trinh-duyet-2909.test.ts` đóng gói
// bằng rolldown rồi nhét vào trang thử. Bố cục ('ngang' | 'ngang-gon') và số giây còn lại đọc từ `window.__thu`.
import { createRoot } from 'react-dom/client'
import LamBaiNgang, { type CauPhieu } from '../../src/screens/LamBaiNgang'

const thu = (window as unknown as { __thu: { boCuc: 'ngang' | 'ngang-gon'; con: number } }).__thu
const cau: CauPhieu[] = [
  ...Array.from({ length: 18 }, (_, i) => ({ stt: i + 1, phan: 'I' as const, chon: i % 3 === 0 ? 1 : null, daLam: i % 3 === 0, danhDau: i === 4 })),
  ...Array.from({ length: 4 }, (_, i) => ({ stt: 19 + i, phan: 'II' as const, y: ['D', null, null, null] as ('D' | 'S' | null)[], daLam: true, danhDau: false })),
  ...Array.from({ length: 6 }, (_, i) => ({ stt: 23 + i, phan: 'III' as const, tl: '', daLam: false, danhDau: false })),
]
const mmss = (g: number) => `${String(Math.floor(g / 60)).padStart(2, '0')}:${String(g % 60).padStart(2, '0')}`

createRoot(document.getElementById('root')!).render(
  <LamBaiNgang
    boCuc={thu.boCuc}
    tenCa="Ca kiểm tra Hoá 12 · Tuần 4 tháng 9"
    cau={cau}
    onChonPa={() => {}}
    onGhiY={() => {}}
    onNhap={() => {}}
    oDapSo={(o) => <input value={o.value} onChange={(e) => o.onChange(e.target.value)} aria-label={o.ariaLabel} />}
    onDoiDau={() => {}}
    dongHo={mmss(thu.con)}
    chuThayDongHo="Bài tập"
    conGiay={thu.con}
    hetGioLuc="11:08"
    daLam={10}
    tong={28}
    nhanLuu="đã lưu"
    mayNgoaiMang={false}
    dangLuu={false}
    nhanNutNop="Nộp bài"
    khoaNop={false}
    onNop={() => {}}
    tatPhim={false}
    cauBatDau={1}
    onCauDangXem={() => {}}
  >
    {Array.from({ length: 28 }, (_, i) => (
      <div key={i} id={`cau-${i + 1}`} style={{ height: 240 }}>
        Câu {i + 1}
      </div>
    ))}
  </LamBaiNgang>,
)
