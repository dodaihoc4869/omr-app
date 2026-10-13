// HỘP HỎI THẦY (thầy 13/10): thẻ bo tròn nảy lên giữa nền mờ (điện thoại: sát đáy), đầu thẻ "Hỏi Thầy · Câu n", đề câu trong ô gấp/mở được,
// hội thoại hỏi Thầy (HoiThemThay) ở dưới. Esc / nút đóng để thoát (bấm nền KHÔNG đóng: tránh mất câu đang gõ); tiêu điểm trả về chỗ đã mở.
// `onMoLoiGiai`: nơi chỉ có MỘT nút Hỏi thầy (phiếu bài làm) ⇒ thêm lối sang lời giải từng bước ngay trong hộp.
// `dangLam`: em đang làm câu, chưa nộp ⇒ một dòng báo Thầy chỉ gợi hướng; không có lối sang lời giải.
// Vẽ qua portal vào <body>: thẻ câu trong game/màn cuộn có transform ⇒ `position: fixed` lệch khỏi màn nếu nằm trong thẻ.
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { BookOpenText, MessageCircleQuestion, X } from 'lucide-react'
import type { CauChoKhung } from '../../lib/loi-giai-api'
import HoiThemThay from './HoiThemThay'
import './loi-giai.css'

export default function HopHoiThay({ cau, nguon, onDong, onTraLoi, onMoLoiGiai, dangLam = false }: { cau: CauChoKhung; nguon: string; onDong: () => void; onTraLoi?: () => void; onMoLoiGiai?: () => void; dangLam?: boolean }) {
  const id = useId()
  const dongRef = useRef(onDong)
  dongRef.current = onDong
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') dongRef.current() }
    window.addEventListener('keydown', phim)
    return () => { window.removeEventListener('keydown', phim); truoc?.focus?.() }
  }, [])
  const y = Object.entries(cau.y)
  return createPortal(
    <div className="lg-hh-nen m3">
      <div className="lg-hh" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
        <header className="lg-hh-dau">
          <span className="lg-hh-hinh" aria-hidden="true"><MessageCircleQuestion size={22} strokeWidth={2.2} /></span>
          <div className="lg-hh-ten">
            <h2 id={`${id}-t`} className="lg-hh-tieu-de">Hỏi Thầy</h2>
            <p className="lg-hh-phu">{cau.so}{cau.chuong ? ` · ${cau.chuong}` : ''}</p>
          </div>
          <button type="button" className="lg-hh-dong" onClick={onDong} aria-label="Đóng"><X size={20} strokeWidth={2.2} aria-hidden="true" /></button>
        </header>
        <details className="lg-hh-de" open>
          <summary>Đề câu</summary>
          <div className="lg-hh-de-than">
            {/* `cau.de`, chữ từng ý: máy chủ dựng từ chữ kho đã thoát HTML (như khung lời giải) — KHÔNG có đáp án */}
            <div className="lg-chu-de" dangerouslySetInnerHTML={{ __html: cau.de }} />
            {y.length > 0 && (
              <ul className="lg-chu-y">
                {y.map(([k, t]) => <li key={k}><b>{k}.</b> <span dangerouslySetInnerHTML={{ __html: t }} /></li>)}
              </ul>
            )}
          </div>
        </details>
        {dangLam && <p className="lg-hh-goi">Em đang làm câu này nên Thầy gợi hướng, chưa nói đáp án.</p>}
        {onMoLoiGiai && !dangLam && (
          <button type="button" className="lg-nut-loi-giai lg-hh-sang-giai" onClick={onMoLoiGiai}>
            <BookOpenText aria-hidden="true" size={18} strokeWidth={2} />
            <span>Xem lời giải từng bước</span>
          </button>
        )}
        <HoiThemThay qid={cau.qid} nguon={nguon} hop dangLam={dangLam} onTraLoi={onTraLoi} />
      </div>
    </div>,
    document.body,
  )
}
