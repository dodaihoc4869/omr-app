// Ô GHI CHÚ DƯỚI SỐ CÂU của câu THAY ở ca "Kiểm chứng câu đã đúng" (máy em; thay số / thay bằng câu cùng dạng, thầy 06/10): dòng đậm NGẮN + dòng phụ "nơi · dd/mm · mức",
// kèm nút nhỏ "Xem câu gốc" CÙNG Ô (thầy 07/10: "một nút nhỏ tinh tế … hiển thị câu gốc đã đúng để học sinh đối chiếu kiến thức của câu thay thế … rút gọn ý nghĩa của phần ghi chú").
// Câu em đã đúng giữ NGUYÊN VĂN không qua đây: vẫn là ô "Em đã làm đúng: <nơi · dd/mm · mức>" của TheCau (`DaiDaDung`, không đổi).
// Chữ lưu trong ca (`nhanThay`) và báo cáo của thầy giữ nguyên câu đầy đủ; máy em TÁCH nhãn (`tachNhanThay`) để hiện bản gọn — nhãn của ca đã mở trước đây vẫn tách được.
// CÂU GỐC CHỈ CÓ NỘI DUNG CÔNG KHAI: đề, phương án / ý, bảng, hình của đề — KHÔNG đáp án, KHÔNG lời giải (đáp án không xuống máy em trước khi nộp). Máy chủ chỉ phát cho đúng
// em có câu thay ấy (`/hs/cau-goc`). Nội dung tải khi em bấm lần đầu rồi nhớ trong phiên; mất mạng thì nói thật và cho bấm thử lại.
import { useId, useState } from 'react'
import { BookOpen, ChevronUp } from 'lucide-react'
import { chuNganNhanThay, tachNhanThay } from '../lib/rut-de-da-dung'
import { ChemText } from '../lib/chem-format'
import { tachDongTheoY } from '../lib/tach-dong-cau'
import type { CauGocCongKhai, LayCauGoc } from '../lib/cau-goc'
import { laChuGiuCho } from '../lib/anh-phuong-an'
import { BangSoLieu, HinhTaiViTri } from './QuestionMedia'
import './dai-cau-thay.css'

const CHU_PA = ['A', 'B', 'C', 'D'] as const
const CHU_Y = ['a', 'b', 'c', 'd'] as const

type TrangThai = 'dong' | 'dang_tai' | 'co' | 'khong_co' | 'loi'

function NoiDungCauGoc({ cau }: { cau: CauGocCongKhai }) {
  const ha = cau.hinhAnh
  return (
    <>
      {cau.thanCauImg ? (
        <img decoding="async" loading="lazy" src={cau.thanCauImg} alt="Đề bài của câu gốc" className="thi-thay-hinh" />
      ) : (
        <div className="thi-thay-de">
          <ChemText text={tachDongTheoY(cau.text)} />
        </div>
      )}
      <BangSoLieu table={cau.table} />
      {cau.imageDataUrl && <img decoding="async" loading="lazy" src={cau.imageDataUrl} alt="Hình của câu gốc" className="thi-thay-hinh" />}
      <HinhTaiViTri hinhAnh={ha} viTri="sau_de" nhan="câu gốc" />
      {cau.phan === 'I' && (cau.choices?.length ?? 0) > 0 && (
        <ol className="thi-thay-pa">
          {cau.choices!.slice(0, 4).map((c, i) => {
            const chu = CHU_PA[i]!
            const anhO = cau.choiceImgs?.[i]
            const anhSau = (ha ?? []).filter((h) => h.viTri === `sau_pa_${chu}`)
            // ô chỉ có chữ giữ chỗ "(xem hình …)" ⇒ ảnh sau phương án vào TRONG ô, bỏ chữ (như thẻ câu ở màn thi)
            const gop = !anhO && anhSau.length > 0 && laChuGiuCho(c)
            return (
              <li key={i}>
                <span className="thi-thay-ma" aria-hidden="true">{chu}</span>
                <span className="thi-thay-pa-chu">
                  {anhO ? (
                    <img decoding="async" loading="lazy" src={anhO} alt={`Phương án ${chu}`} className="thi-thay-anh-o" />
                  ) : gop ? (
                    anhSau.map((h, k) => <img key={k} decoding="async" loading="lazy" src={h.src} alt={h.alt ?? `Phương án ${chu}`} className="thi-thay-anh-o" />)
                  ) : (
                    <ChemText text={c} />
                  )}
                  {!gop && <HinhTaiViTri hinhAnh={ha} viTri={`sau_pa_${chu}`} nhan={`câu gốc — phương án ${chu}`} />}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      {cau.phan === 'II' && (cau.ideas?.length ?? 0) > 0 && (
        <ol className="thi-thay-pa">
          {cau.ideas!.slice(0, 4).map((c, i) => {
            const chu = CHU_Y[i]!
            const anhO = cau.ideaImgs?.[i]
            return (
              <li key={i}>
                <span className="thi-thay-ma" aria-hidden="true">{chu})</span>
                <span className="thi-thay-pa-chu">
                  {anhO ? <img decoding="async" loading="lazy" src={anhO} alt={`Ý ${chu}`} className="thi-thay-anh-o" /> : <ChemText text={c} />}
                  <HinhTaiViTri hinhAnh={ha} viTri={`sau_y_${chu}`} nhan={`câu gốc — ý ${chu}`} />
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <HinhTaiViTri hinhAnh={ha} viTri="cuoi_cau" nhan="câu gốc" />
    </>
  )
}

export default function DaiCauThay({ nhan, gocQid, layCauGoc }: { nhan: string; gocQid?: string; layCauGoc?: LayCauGoc }) {
  const idBang = useId()
  const [tt, setTt] = useState<TrangThai>('dong')
  const [cau, setCau] = useState<CauGocCongKhai | null>(null)
  const [mo, setMo] = useState(false)
  const t = tachNhanThay(nhan)

  // Chỉ dành cho nhãn câu THAY; câu em đã đúng giữ NGUYÊN VĂN vẫn là `DaiDaDung` của TheCau ("Em đã làm đúng: …", không đổi). Nhãn khác ⇒ không vẽ gì.
  if (!t) return null

  const coNut = !!gocQid && !!layCauGoc
  // `tt` đổi sang 'dang_tai' ngay trong cùng sự kiện bấm nên không đường nào gọi `tai` hai lần trước khi vẽ lại; chỉ 'dong' và 'loi' mới (lại) hỏi máy chủ.
  const tai = () => {
    if (!gocQid || !layCauGoc) return
    setTt('dang_tai')
    layCauGoc(gocQid)
      .then((c) => {
        setCau(c)
        setTt(c ? 'co' : 'khong_co')
      })
      .catch(() => setTt('loi'))
  }
  const bam = () => {
    const moi = !mo
    setMo(moi)
    if (moi && (tt === 'dong' || tt === 'loi')) tai()
  }

  return (
    <div data-da-dung="1" data-thay={t.kieu} className="thi-thay">
      <div className="thi-thay-chu">
        <span className="thi-thay-loai">{chuNganNhanThay(t)}</span>
        {t.noi && <span className="thi-thay-noi">{t.noi}</span>}
      </div>
      {coNut && (
        <button type="button" className="thi-thay-nut" aria-expanded={mo} aria-controls={idBang} onClick={bam}>
          {mo ? <ChevronUp size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />}
          <span>{mo ? 'Ẩn câu gốc' : 'Xem câu gốc'}</span>
        </button>
      )}
      {coNut && mo && (
        <div id={idBang} className="thi-thay-goc" role="region" aria-label="Câu gốc em đã làm đúng" data-trang-thai={tt}>
          <div className="thi-thay-goc-tieu">Câu gốc em đã làm đúng</div>
          {tt === 'dang_tai' && <div className="thi-thay-goc-bao" role="status">Đang tải câu gốc…</div>}
          {tt === 'khong_co' && <div className="thi-thay-goc-bao">Chưa có câu gốc để xem ở lúc này. Em cứ làm câu bên dưới.</div>}
          {tt === 'loi' && (
            <div className="thi-thay-goc-bao" role="alert">
              Chưa tải được câu gốc lúc này.{' '}
              <button type="button" className="thi-thay-thu-lai" onClick={tai}>
                Tải lại
              </button>
            </div>
          )}
          {tt === 'co' && cau && (
            <>
              <NoiDungCauGoc cau={cau} />
              <div className="thi-thay-goc-chan">Chỉ để đối chiếu, không tính điểm.</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
