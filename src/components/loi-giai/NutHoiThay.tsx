// NÚT "HỎI THẦY" (thầy lệnh 29/09: "bất kể câu nào học sinh làm trừ lúc học sinh kiểm tra có một nút Hỏi thầy, bấm vào là hiển thị luôn lời giải kiểu mới").
// Đặt ở MỌI chỗ em làm câu ngoài giờ kiểm tra. KHÔNG đặt trong màn thi (ExamTakeScreen), Gọi lên bảng, lúc đang làm bài kiểm tra cá nhân;
// máy chủ còn chặn thêm: em đang có ca kiểm tra mở, hoặc câu thuộc đề của ca chưa công bố ⇒ trả lời lý do, không trả lời giải.
// THẦY 13/10: hai nút. "Hỏi thầy" (nổi bật) ⇒ hộp hỏi Thầy (HopHoiThay, AI theo lời giải của Thầy); "Lời giải từng bước" ⇒ khung lời giải như cũ.
// THẦY 13/10 "nút hỏi bài ở tất cả các câu… dễ nhìn thấy… hỏi bài thầy mọi lúc": TheCau vẽ nút ngay dưới phần trả lời, có cả lúc đang làm.
// `dangLam` (em chưa trả lời/nộp): CHỈ nút Hỏi thầy; máy chủ trả đề không đáp án, Thầy gợi hướng (lời giải từng bước vẫn chỉ có sau khi làm — lệnh 30/09).
// `chi`: 'hoi' | 'giai' — chỉ vẽ một nút (màn đã có nút kia ở chỗ khác).
// Phần hỏi Thầy chưa bật cho em ⇒ "Hỏi thầy" mở lời giải như cũ (không có nút chết). Câu chưa có hồ sơ từng bước ⇒ báo "thầy đang soạn".
// `onHoi`: gọi khi em nhận được trợ giúp (mở lời giải, hoặc Thầy trả lời câu hỏi đầu tiên) — game tính câu này là "có trợ giúp", không nhận thưởng.
import NutChuaTungBuoc from '../chua-cau-sai/NutChuaTungBuoc'
import { useState } from 'react'
import { BookOpenText, MessageCircleQuestion } from 'lucide-react'
import { CHU_LAM_XONG, docTokenHs, hoiThay, type CauChoKhung, type HoSoLoiGiai, type KiemKhung } from '../../lib/loi-giai-api'
import KhungLoiGiai from './KhungLoiGiai'
import HopHoiThay from './HopHoiThay'
import './loi-giai.css'

export const CHU_DANG_SOAN = 'Thầy đang soạn lời giải từng bước cho câu này. Em chờ một chút rồi bấm lại nhé.'
export { CHU_LAM_XONG }

export default function NutHoiThay({ qid, nguon, onHoi, gon = false, dangLam = false, chi }: {
  qid?: string | null; nguon: string; onHoi?: () => void; gon?: boolean; dangLam?: boolean; chi?: 'hoi' | 'giai'
}) {
  const [dangTai, setDangTai] = useState<'' | 'hoi' | 'giai'>('')
  const [loi, setLoi] = useState('')
  const [mo, setMo] = useState<{ cau: CauChoKhung; hoSo: HoSoLoiGiai; kiem?: KiemKhung } | null>(null)
  const [hop, setHop] = useState<{ cau: CauChoKhung; dangLam: boolean } | null>(null)
  if (!qid || !docTokenHs()) return null
  const coHoi = chi !== 'giai'
  const coGiai = chi !== 'hoi' && !dangLam
  const bam = async (kieu: 'hoi' | 'giai') => {
    setDangTai(kieu)
    setLoi('')
    const r = await hoiThay(qid, nguon, dangLam)
    setDangTai('')
    if (!r.ok) { setLoi(r.loi); return }
    if (kieu === 'hoi' && r.hoiThem) { setHop({ cau: r.cau, dangLam }); return }
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
        <button type="button" className="lg-nut-hoi-thay" onClick={() => void bam('hoi')} disabled={dangTai !== ''} aria-haspopup="dialog">
          <MessageCircleQuestion aria-hidden="true" size={20} strokeWidth={2.2} />
          <span>{dangTai === 'hoi' ? 'Đang mở…' : 'Hỏi thầy'}</span>
        </button>
      )}
      {coGiai && (
        <button type="button" className="lg-nut-loi-giai" onClick={() => void bam('giai')} disabled={dangTai !== ''}>
          <BookOpenText aria-hidden="true" size={18} strokeWidth={2} />
          <span>{dangTai === 'giai' ? 'Đang mở…' : 'Lời giải từng bước'}</span>
        </button>
      )}
      {coGiai && <NutChuaTungBuoc qid={qid} />}
      {loi && <span className="lg-loi" role="status">{loi}</span>}
      {hop && <HopHoiThay cau={hop.cau} nguon={nguon} dangLam={hop.dangLam} onTraLoi={onHoi} onDong={() => setHop(null)} />}
      {mo && <KhungLoiGiai hoSo={mo.hoSo} cau={mo.cau} kiem={mo.kiem} nguon={nguon} onDong={() => setMo(null)} />}
    </div>
  )
}
