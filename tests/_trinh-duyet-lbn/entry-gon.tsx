// Khung dựng THẬT cho bố cục điện thoại xoay ngang (tests/lam-bai-ngang-gon-trinh-duyet-2909.test.ts): LamBaiNgang + thẻ câu giả
// ĐÚNG khuôn TheCau (#cau-N.the-cau > [đầu thẻ, thân > [đề, khối lựa chọn]]) trong khung `.m3.man-lam-bai`. Tham số đọc từ `window.__thu`.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import LamBaiNgang, { type CauPhieu } from '../../src/screens/LamBaiNgang'
import NutDiuMat from '../../src/components/NutDiuMat'
import { useBoCuc } from '../../src/lib/lam-bai-ngang'
import { useDiuMat } from '../../src/lib/diu-mat'

const thu = (window as unknown as { __thu: { con: number; cau: number } }).__thu
const DAI = 'Tiến hành thí nghiệm theo các bước sau. Bước 1: cho vào ống nghiệm 2 ml dung dịch CuSO4 5% và 1 ml dung dịch NaOH 10%, lắc nhẹ. '
const cau: CauPhieu[] = [
  { stt: 1, phan: 'I', chon: null, daLam: false, danhDau: false },
  { stt: 2, phan: 'I', chon: null, daLam: false, danhDau: false },
  { stt: 3, phan: 'II', y: [null, null, null, null], daLam: false, danhDau: false },
  { stt: 4, phan: 'III', tl: '', daLam: false, danhDau: false },
]
const hang: React.CSSProperties = { display: 'block', width: '100%', minHeight: 44, margin: '0 0 8px', textAlign: 'left' }

function The({ n, onChon, chon }: { n: number; chon: number | null; onChon: (v: number) => void }) {
  const de = n === 1 ? 'Kim loại nào sau đây tác dụng được với dung dịch HCl loãng?' : DAI.repeat(n === 4 ? 3 : 6)
  return (
    <div className="thi-cau-boc">
      <div id={`cau-${n}`} className="the-cau" style={{ background: 'var(--the)', borderRadius: 16 }}>
        <div style={{ height: 40 }}>Câu {n}</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="cau-de" style={{ fontSize: 'var(--cx-3)', lineHeight: 1.6 }}>
            {de}
          </div>
          {n === 4 ? (
            <div className="ond" style={{ display: 'flex' }}>
              <input aria-label="Đáp số câu 4" style={{ height: 48, flex: 1 }} />
            </div>
          ) : (
            <div>
              {[0, 1, 2, 3].map((i) =>
                n === 3 ? (
                  <div key={i} className="y-hang" style={hang}>
                    {'abcd'[i]}) Ý {i + 1} của câu Đúng–sai khá dài để xuống dòng trong cột hẹp
                  </div>
                ) : (
                  <button key={i} type="button" className="pa-hang" aria-pressed={chon === i} style={hang} onClick={() => onChon(i)}>
                    {'ABCD'[i]}. Phương án {i + 1}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Man() {
  const boCuc = useBoCuc()
  const [diuMat, doi] = useDiuMat()
  const [chon, setChon] = useState<Record<number, number>>({})
  const mmss = `${String(Math.floor(thu.con / 60)).padStart(2, '0')}:${String(thu.con % 60).padStart(2, '0')}`
  return (
    <div className="m3 man-lam-bai" data-diu-mat={diuMat ? 'bat' : undefined} style={{ minHeight: '100vh', background: 'var(--nen)', color: 'var(--muc)' }}>
      {boCuc === 'doc' ? (
        <div data-doc="">dọc</div>
      ) : (
        <LamBaiNgang
          boCuc={boCuc}
          tenCa="Ca kiểm tra Hoá 12"
          cau={cau.map((c) => (c.phan === 'I' ? { ...c, chon: chon[c.stt] ?? null, daLam: chon[c.stt] !== undefined } : c))}
          onChonPa={(n, v) => setChon((x) => ({ ...x, [n]: v }))}
          onGhiY={() => {}}
          onNhap={() => {}}
          oDapSo={(o) => <input value={o.value} onChange={(e) => o.onChange(e.target.value)} aria-label={o.ariaLabel} />}
          onDoiDau={() => {}}
          dongHo={mmss}
          chuThayDongHo="Bài tập"
          conGiay={thu.con}
          hetGioLuc="11:08"
          daLam={Object.keys(chon).length}
          tong={4}
          nhanLuu="đã lưu"
          mayNgoaiMang={false}
          dangLuu={false}
          nhanNutNop="Nộp bài"
          khoaNop={false}
          onNop={() => {}}
          tatPhim={false}
          cauBatDau={thu.cau}
          onCauDangXem={() => {}}
          congCu={<NutDiuMat bat={diuMat} onDoi={doi} chiBieuTuong={boCuc === 'ngang-gon'} />}
        >
          {cau.map((c) => (
            <The key={c.stt} n={c.stt} chon={chon[c.stt] ?? null} onChon={(v) => setChon((x) => ({ ...x, [c.stt]: v }))} />
          ))}
        </LamBaiNgang>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Man />)
