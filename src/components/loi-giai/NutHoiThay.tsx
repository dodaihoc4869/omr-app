// NÚT "HỎI THẦY" (thầy lệnh 29/09: "bất kể câu nào học sinh làm trừ lúc học sinh kiểm tra có một nút Hỏi thầy, bấm vào là hiển thị luôn lời giải kiểu mới").
// Đặt ở MỌI chỗ em làm câu ngoài giờ kiểm tra. KHÔNG đặt trong màn thi (ExamTakeScreen), Gọi lên bảng, lúc đang làm bài kiểm tra cá nhân;
// máy chủ còn chặn thêm: em đang có ca kiểm tra mở, hoặc câu thuộc đề của ca chưa công bố ⇒ trả lời lý do, không trả lời giải.
// THẦY 13/10: hai nút. "Hỏi thầy" (nổi bật) ⇒ hộp hỏi Thầy (HopHoiThay, AI theo lời giải của Thầy); "Lời giải từng bước" ⇒ khung lời giải như cũ.
// THẦY 13/10 "nút hỏi bài ở tất cả các câu… dễ nhìn thấy… hỏi bài thầy mọi lúc": TheCau vẽ nút ngay dưới phần trả lời, có cả lúc đang làm.
// `dangLam` (em chưa trả lời/nộp): CHỈ nút Hỏi thầy; máy chủ trả đề không đáp án, Thầy gợi hướng (lời giải từng bước vẫn chỉ có sau khi làm — lệnh 30/09).
// `chi`: 'hoi' | 'giai' — chỉ vẽ một nút (màn đã có nút kia ở chỗ khác).
// Phần hỏi Thầy chưa bật cho em ⇒ "Hỏi thầy" mở lời giải như cũ (không có nút chết). Câu chưa có hồ sơ từng bước ⇒ báo "thầy đang soạn".
// `onHoi`: gọi khi em nhận được trợ giúp (mở lời giải, hoặc Thầy trả lời câu hỏi đầu tiên) — game tính câu này là "có trợ giúp", không nhận thưởng.
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { BookOpenText, MessageCircleQuestion } from 'lucide-react'
import { CHU_LAM_XONG, docTokenHs, hoiThay, type CauChoKhung, type HoSoLoiGiai, type KiemKhung } from '../../lib/loi-giai-api'
import './loi-giai.css'

// LUẬT TỐC ĐỘ (thầy 13/10): nút nằm ở MỌI thẻ câu (mảnh tải lúc mở app) ⇒ hộp hỏi Thầy, khung lời giải, nút chữa từng bước tách mảnh,
// chỉ tải khi em bấm — tải SONG SONG với lượt hỏi máy chủ (Promise.all) nên em không chờ thêm.
const napHop = () => import('./HopHoiThay')
const napKhung = () => import('./KhungLoiGiai')
const HopHoiThay = lazy(napHop)
const KhungLoiGiai = lazy(napKhung)
const NutChuaTungBuoc = lazy(() => import('../chua-cau-sai/NutChuaTungBuoc'))

// TỐC ĐỘ (thầy 13/10: "Tốc độ bấm vào hỏi thầy hơi chậm tối ưu lại tốc độ nhanh nhất"):
//  · mảnh hộp Hỏi Thầy tải sẵn lúc máy RẢNH (một lần cho cả app, sau khi màn đã vẽ xong — không cộng vào lượt mở app);
//  · bấm là hộp nảy lên NGAY, đề câu tới sau (máy chủ nay 5 đợt D1 thay 12, lần sau 2 thay 6) — máy chủ từ chối thì hộp đóng, báo đúng lý do như cũ.
let daNapSan = false
function napSanHop() {
  if (daNapSan) return
  daNapSan = true
  const chay = () => { void napHop().catch(() => { daNapSan = false }) }
  const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(chay, { timeout: 4000 })
  else setTimeout(chay, 1500)
}

export const CHU_DANG_SOAN = 'Thầy đang soạn lời giải từng bước cho câu này. Em chờ một chút rồi bấm lại nhé.'
export { CHU_LAM_XONG }

/** `dapAnEm` (v3, 15/10): bài em đã nộp ("DSSD", "B", "8,2") ⇒ Thầy so bài em với lời giải, câu Đúng/Sai ghi "Em: …" từng ý. */
type Props = {
  qid?: string | null; nguon: string; onHoi?: () => void; gon?: boolean; dangLam?: boolean; chi?: 'hoi' | 'giai'; dapAnEm?: string; luotId?: string; soCau?: number
}
// Mỗi câu/lượt có hộp và vòng chờ riêng; phản hồi cũ không được mở sang câu mới.
export default function NutHoiThay(props: Props) {
  return <NutHoiThayCau key={`${props.qid}\n${props.nguon}\n${props.luotId ?? ''}\n${!!props.dangLam}`} {...props} />
}
function NutHoiThayCau({ qid, nguon, onHoi, gon = false, dangLam = false, chi, dapAnEm, luotId, soCau }: Props) {
  const [dangTai, setDangTai] = useState<'' | 'hoi' | 'giai'>('')
  const [loi, setLoi] = useState('')
  const [mo, setMo] = useState<{ cau: CauChoKhung; hoSo: HoSoLoiGiai; kiem?: KiemKhung } | null>(null)
  const [hop, setHop] = useState<{ cau: CauChoKhung | null; dangLam: boolean; em?: unknown } | null>(null)
  const luot = useRef(0) // lượt bấm hiện tại: em đóng hộp trong lúc chờ ⇒ phản hồi đến muộn không mở lại hộp
  useEffect(() => () => { luot.current++ }, [])
  const coPhien = !!qid && !!docTokenHs()
  const coHoi = chi !== 'giai'
  useEffect(() => { if (coPhien && coHoi) napSanHop() }, [coPhien, coHoi])
  if (!qid || !coPhien) return null
  const coGiai = chi !== 'hoi' && !dangLam
  const ban = dangTai !== ''
  const bam = async (kieu: 'hoi' | 'giai') => {
    const so = ++luot.current
    setDangTai(kieu)
    setLoi('')
    if (kieu === 'hoi') setHop({ cau: null, dangLam })
    // Thẻ «Em và câu này» chỉ xin khi mở hộp Hỏi Thầy (bấm Lời giải từng bước không đọc thêm gì).
    const [r] = await Promise.all([hoiThay(qid, nguon, dangLam, luotId, kieu === 'hoi'), (kieu === 'hoi' ? napHop() : napKhung()).catch(() => null)])
    if (so !== luot.current) return
    setDangTai('')
    if (!r.ok) { setHop(null); setLoi(r.loi); return }
    if (soCau) r.cau = { ...r.cau, so: `Câu ${soCau}` }
    if (kieu === 'hoi' && r.hoiThem) { setHop({ cau: r.cau, dangLam, em: r.emVaCau ?? null }); return }
    setHop(null)
    if (dangLam || 'chiHoi' in r) { setLoi(CHU_LAM_XONG); return }
    // Thầy chốt 29/09: câu CHƯA có lời giải từng bước ⇒ KHÔNG hiện lời giải ngắn của kho, chỉ báo đang soạn (không tính "có trợ giúp").
    if (!r.hoSo) { setLoi(CHU_DANG_SOAN); return }
    setMo({ cau: r.cau, hoSo: r.hoSo, kiem: r.kiem })
    onHoi?.()
  }
  const lop = gon ? 'lg-nut-hang lg-nut-hang--gon m3' : 'lg-nut-hang m3'
  return (
    <div className={lop}>
      {coHoi && (
        <button type="button" className="lg-nut-hoi-thay" onClick={() => void bam('hoi')} disabled={ban} aria-haspopup="dialog">
          <MessageCircleQuestion aria-hidden="true" size={20} strokeWidth={2.2} />
          <span>{dangTai === 'hoi' ? 'Đang mở…' : 'Hỏi thầy'}</span>
        </button>
      )}
      {coGiai && (
        <button type="button" className="lg-nut-loi-giai" onClick={() => void bam('giai')} disabled={ban}>
          <BookOpenText aria-hidden="true" size={18} strokeWidth={2} />
          <span>{dangTai === 'giai' ? 'Đang mở…' : 'Lời giải từng bước'}</span>
        </button>
      )}
      {coGiai && <Suspense fallback={null}><NutChuaTungBuoc qid={luotId ? qid.replace(/~\d+$/, '') : qid} /></Suspense>}
      {loi && <span className="lg-loi" role="status">{loi}</span>}
      <Suspense fallback={null}>
        {hop && <HopHoiThay cau={hop.cau} em={hop.em} qid={qid} luotId={luotId} nguon={nguon} dangLam={hop.dangLam} dapAnEm={dapAnEm} onTraLoi={onHoi} onDong={() => { luot.current++; setDangTai(''); setHop(null) }} />}
        {mo && <KhungLoiGiai hoSo={mo.hoSo} cau={mo.cau} kiem={mo.kiem} nguon={nguon} onDong={() => setMo(null)} />}
      </Suspense>
    </div>
  )
}
