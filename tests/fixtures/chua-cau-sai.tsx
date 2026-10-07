// Chỉ dùng bởi Playwright trên Vite dev; không phải điểm vào bundle phát hành.
import { useCallback, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { saveCauHinhMayChu } from '../../src/lib/exam-db'
import { chuanHoaMayChu } from '../../src/lib/cau-hinh-may-chu'
import ManChuaCauSai from '../../src/components/chua-cau-sai/ManChuaCauSai'
import KhungChua from '../../src/components/chua-cau-sai/KhungChua'
import KhungXemPhieu from '../../src/components/KhungXemPhieu'
import { useGhiToChieu } from '../../src/components/chien-dich/ghi-to-chieu'
import { oChuaCuoi } from '../../src/lib/chua-cau-sai-chieu'
import { khoaToChieu } from '../../src/lib/to-chieu-cau-noi'
import type { NhomChuaTrenLop } from '../../server/src/chua-cau-sai-chieu-kieu'
import '../../src/index.css'
await saveCauHinhMayChu(chuanHoaMayChu({ BAT: true, URL: 'https://chua.test' }))
function ThuToChieu() {
  const [html, setHtml] = useState(''),
    [so, setSo] = useState(0)
  const thay = useCallback(async () => {
    setSo((x) => x + 1)
    return { ok: true as const }
  }, [])
  const { moPhien, ganO, dongPhien } = useGhiToChieu(
    'fixture-chua-cuoi',
    undefined,
    thay,
  )
  const mo = async () => {
    const g: NhomChuaTrenLop = {
      id: 'fixture-nhom',
      qid: 'Q',
      lop: '12A1',
      buocId: 'm',
      tieuDe: 'Khối lượng mol',
      maLoi: null,
      diemVuong: '',
      guiLuc: 1,
      cauGoc: {
        phan: 'III',
        text: 'Tính khối lượng mol Ca(OH)2. Cho Ca = 40, O = 16, H = 1.',
      },
      buoc: [
        {
          id: 'm',
          tieuDe: 'Khối lượng mol',
          hoTro: [
            {
              muc: 3,
              noiDung:
                'Chỉ số ngoài ngoặc nhân cả nhóm OH: M = 40 + 2 × (16 + 1) = 74 g/mol.',
            },
          ],
        },
      ],
      em: [
        {
          dotId: 'd',
          sbd: 'HS1',
          hoTen: 'Tên riêng của học sinh',
          traLoi: '57',
          hoi: 'Câu riêng của học sinh',
          revision: 1,
          daHieu: [],
          soVongHoTro: 2,
        },
      ],
    }
    const ma = moPhien(),
      o = oChuaCuoi(g, 1),
      { taoHtmlMayChieu } = await import('../../src/lib/html-may-chieu')
    ganO(
      ma,
      new Map([
        [
          khoaToChieu(o.sbd, o.qid!),
          { sbd: o.sbd, qid: o.qid!, hoTen: 'Chữa chung', chuyenDe: '' },
        ],
      ]),
    )
    setHtml(
      taoHtmlMayChieu([o], {
        tenBuoi: 'Câu cần chữa',
        cauNoi: { maPhien: ma },
        nutAiSai: false,
      }),
    )
  }
  return (
    <>
      <button onClick={() => void mo()}>Mở tờ chữa chung</button>
      <p role="status">Đã ghi chữa chung: {so}</p>
      {html && (
        <KhungXemPhieu
          html={html}
          ten="Tờ chữa chung"
          dong={() => {
            dongPhien()
            setHtml('')
          }}
        />
      )}
    </>
  )
}
function App() {
  const [mo, setMo] = useState(false)
  return (
    <>
      <button onClick={() => setMo(true)}>Mở câu cần chữa</button>
      <button>Nút nền ngoài khung</button>
      <ThuToChieu />
      {mo && (
        <KhungChua onDong={() => setMo(false)}>
          <ManChuaCauSai
            token="token-du-lieu-gia"
            qid="Q"
            onVe={() => setMo(false)}
          />
        </KhungChua>
      )}
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
