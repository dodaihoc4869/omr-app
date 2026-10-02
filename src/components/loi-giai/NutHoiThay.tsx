// NÚT "HỎI THẦY" (thầy lệnh 29/09: "bất kể câu nào học sinh làm trừ lúc học sinh kiểm tra có một nút Hỏi thầy, bấm vào là hiển thị luôn lời giải kiểu mới").
// Đặt ở MỌI chỗ em làm câu ngoài giờ kiểm tra. KHÔNG đặt trong màn thi (ExamTakeScreen); máy chủ còn chặn thêm: em đang có ca kiểm tra mở,
// hoặc câu thuộc đề của ca chưa công bố ⇒ trả lời lý do, không trả lời giải. Có hồ sơ từng bước ⇒ mở khung; chưa có ⇒ báo "thầy đang soạn" (thầy chốt 29/09: không hiện lời giải ngắn).
// `onHoi`: gọi khi lời giải đã mở (game dùng để tính câu này là "có trợ giúp" — không nhận thưởng).
import { useState } from 'react'
import { docTokenHs, hoiThay, type CauChoKhung, type HoSoLoiGiai } from '../../lib/loi-giai-api'
import KhungLoiGiai from './KhungLoiGiai'
import './loi-giai.css'

export const CHU_DANG_SOAN = 'Thầy đang soạn lời giải từng bước cho câu này. Em chờ một chút rồi bấm lại nhé.'

export default function NutHoiThay({ qid, nguon, onHoi, gon = false }: { qid?: string | null; nguon: string; onHoi?: () => void; gon?: boolean }) {
  const [dangTai, setDangTai] = useState(false)
  const [loi, setLoi] = useState('')
  const [mo, setMo] = useState<{ cau: CauChoKhung; hoSo: HoSoLoiGiai } | null>(null)
  if (!qid || !docTokenHs()) return null
  const bam = async () => {
    setDangTai(true)
    setLoi('')
    const r = await hoiThay(qid, nguon)
    setDangTai(false)
    if (!r.ok) { setLoi(r.loi); return }
    // Thầy chốt 29/09: câu CHƯA có lời giải từng bước ⇒ KHÔNG hiện lời giải ngắn của kho, chỉ báo đang soạn (không tính "có trợ giúp").
    if (!r.hoSo) { setLoi(CHU_DANG_SOAN); return }
    setMo({ cau: r.cau, hoSo: r.hoSo })
    onHoi?.()
  }
  return (
    <div className={gon ? 'lg-nut-hang lg-nut-hang--gon' : 'lg-nut-hang'}>
      <button type="button" className="lg-nut lg-nut--hoi" onClick={bam} disabled={dangTai} aria-label="Hỏi thầy: xem lời giải câu này">
        {dangTai ? 'Đang mở…' : 'Hỏi thầy'}
      </button>
      {loi && <span className="lg-loi" role="status">{loi}</span>}
      {mo && <KhungLoiGiai hoSo={mo.hoSo} cau={mo.cau} nguon={nguon} onDong={() => setMo(null)} />}
    </div>
  )
}
