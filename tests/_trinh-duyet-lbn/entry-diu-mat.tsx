// Khung dựng THẬT cho nút "Dịu mắt" (tests/nut-diu-mat-trinh-duyet-2809.test.ts): dựng đúng như ExamTakeScreen — khung `.m3.man-lam-bai`
// mang data-diu-mat theo useDiuMat; dọc = ThanhTrenThiM3 + thẻ câu, ngang = LamBaiNgang với nút ở cạnh A−/A+. Bố cục đọc từ `window.__thu`.
import { createRoot } from 'react-dom/client'
import LamBaiNgang, { type CauPhieu } from '../../src/screens/LamBaiNgang'
import ThanhTrenThiM3 from '../../src/screens/ThanhTrenThiM3'
import NutDiuMat from '../../src/components/NutDiuMat'
import { useDiuMat } from '../../src/lib/diu-mat'

const thu = (window as unknown as { __thu: { boCuc: 'doc' | 'ngang' | 'ngang-gon' } }).__thu
const cau: CauPhieu[] = Array.from({ length: 12 }, (_, i) => ({ stt: i + 1, phan: 'I' as const, chon: i % 3 === 0 ? 1 : null, daLam: i % 3 === 0, danhDau: false }))

const TheCau = ({ n }: { n: number }) => (
  <div id={`cau-${n}`} className="the-cau-thu" style={{ margin: '12px 16px', padding: 16, borderRadius: 16, background: 'var(--the)', color: 'var(--muc)' }}>
    <p className="chu-de" style={{ margin: 0 }}>Câu {n}. Cho 5,6 gam Fe tác dụng với dung dịch HCl dư, thu được V lít khí H₂ (đktc). Giá trị của V là</p>
    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
      <span className="o-chon" data-da-chon="" style={{ padding: '6px 12px', borderRadius: 12, background: 'var(--m3-primary)', color: 'var(--m3-on-primary)' }}>A. 2,24</span>
      <span style={{ padding: '6px 12px', borderRadius: 12, background: 'var(--the-2)' }}>B. 3,36</span>
    </div>
  </div>
)

function Man() {
  const [diuMat, doi] = useDiuMat()
  const nut = <NutDiuMat bat={diuMat} onDoi={doi} />
  return (
    <div className="m3 man-lam-bai" data-diu-mat={diuMat ? 'bat' : undefined} style={{ minHeight: '100vh', background: 'var(--nen)', color: 'var(--muc)' }}>
      {thu.boCuc === 'doc' ? (
        <>
          <div style={{ position: 'sticky', top: 0, zIndex: 30 }}>
            <ThanhTrenThiM3 dongHo="38:12" chuThayDongHo="Bài tập" gap={false} tenCa="Ca kiểm tra Hoá 12 · Tuần 4" daLam={4} tong={12} nhanLuu="đã lưu" mayNgoaiMang={false} dangLuu={false} onMoLuoi={() => {}} nutPhu={nut} />
          </div>
          {cau.map((c) => (
            <TheCau key={c.stt} n={c.stt} />
          ))}
        </>
      ) : (
        <LamBaiNgang
          boCuc={thu.boCuc}
          tenCa="Ca kiểm tra Hoá 12 · Tuần 4 tháng 9"
          cau={cau}
          onChonPa={() => {}}
          onGhiY={() => {}}
          onNhap={() => {}}
          oDapSo={(o) => <input value={o.value} onChange={(e) => o.onChange(e.target.value)} aria-label={o.ariaLabel} />}
          onDoiDau={() => {}}
          dongHo="38:12"
          chuThayDongHo="Bài tập"
          conGiay={38 * 60 + 12}
          hetGioLuc="11:08"
          daLam={4}
          tong={12}
          nhanLuu="đã lưu"
          mayNgoaiMang={false}
          dangLuu={false}
          nhanNutNop="Nộp bài"
          khoaNop={false}
          onNop={() => {}}
          tatPhim={false}
          cauBatDau={1}
          onCauDangXem={() => {}}
          congCu={nut}
        >
          {cau.map((c) => (
            <TheCau key={c.stt} n={c.stt} />
          ))}
        </LamBaiNgang>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Man />)
