// NÚT BÓNG ĐÈN «TRỢ GIÚP» CỦA MÀN DUO (thầy 27/10, hai ảnh: ba viên «Hỏi thầy · Bắt đầu từ đâu? · Học cách giải» dưới KIỂM TRA «rối quá, thiết kế ẩn
// đi, bấm vào mới hiện cho tinh tế» ⇒ «Cho chỗ khoanh vào cái bóng đèn luôn nhé»). Thanh đáy chỉ còn KIỂM TRA; MỌI trợ giúp gom vào nút bóng đèn ở góc
// phải dòng lệnh («Chọn đáp án đúng»). Bấm ⇒ tấm nhỏ bật xuống ngay dưới bóng đèn, mỗi dòng biểu tượng + chữ; chạm ra ngoài / Esc / chọn một mục ⇒
// đóng. Câu không có trợ giúp nào ⇒ ẩn bóng đèn. Có gợi ý thật (không tính «Hỏi thầy») mà em chưa mở tấm lần nào ở câu này ⇒ chấm nhỏ màu chú ý.
// Các mục là CHÍNH các nút cũ (màn cha đưa vào `children`, kể cả ô portal của «Bắt đầu từ đâu?») ⇒ hành vi, đánh dấu «có hỗ trợ», aria giữ nguyên.
// Màn cha gắn `key` theo câu ⇒ câu mới thì chấm «chưa xem» hiện lại. Tờ trình bày: tro-giup-duo.css, nạp qua @import trong styles/trong-lam-bai.css
// (chỉ giao diện «Trong»). Tấm luôn nằm trong DOM (ẩn bằng `hidden`) để ô portal và nút «Hỏi thầy» không bị dựng lại khi đóng / mở.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Lightbulb } from 'lucide-react'
import { phanHoi } from '../../lib/phan-hoi'

export function TroGiupDuo({ children }: { children: ReactNode }) {
  const [mo, setMo] = useState(false)
  const [co, setCo] = useState(false)
  const [daXem, setDaXem] = useState(false)
  // chấm «chưa xem» chỉ đếm trợ giúp THẬT của câu (Bắt đầu từ đâu? · Gợi ý · Học cách giải); «Hỏi thầy» câu nào cũng có ⇒ không tính
  const [coGoi, setCoGoi] = useState(false)
  const goc = useRef<HTMLDivElement>(null)
  const tam = useRef<HTMLDivElement>(null)
  const nutTg = useRef<HTMLButtonElement>(null)
  const id = useId()
  // Có trợ giúp nào không (nút cắm qua portal / nút Hỏi thầy chỉ hiện khi có phiên ⇒ đếm nút thật trong tấm). Lời báo lỗi của một mục (.lg-loi) vừa
  // xuất hiện khi tấm đang đóng ⇒ mở tấm cho em đọc được.
  useLayoutEffect(() => {
    const t = tam.current
    if (!t) return
    let coLoi = false
    const xet = () => {
      setCo(!!t.querySelector('button'))
      setCoGoi(!!t.querySelector('button:not(.lg-nut-hoi-thay)'))
      const l = !!t.querySelector('.lg-loi')
      if (l && !coLoi) setMo(true)
      coLoi = l
    }
    xet()
    if (typeof MutationObserver === 'undefined') return
    const qs = new MutationObserver(xet)
    qs.observe(t, { childList: true, subtree: true })
    return () => qs.disconnect()
  }, [])
  // Mở: đưa tiêu điểm vào mục đầu (bàn phím / trình đọc màn hình). Chạm ra ngoài ⇒ đóng; Esc ⇒ đóng và trả tiêu điểm cho bóng đèn (Esc KHÔNG đi tiếp
  // tới màn — không mở tấm giữ chân / không thoát).
  useEffect(() => {
    if (!mo) return
    setDaXem(true)
    tam.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus({ preventScroll: true })
    const ngoai = (e: PointerEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false) }
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault(); e.stopPropagation()
      setMo(false); nutTg.current?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', ngoai, true)
    window.addEventListener('keydown', esc, true)
    return () => { document.removeEventListener('pointerdown', ngoai, true); window.removeEventListener('keydown', esc, true) }
  }, [mo])
  return (
    <div ref={goc} className="duo-tg" hidden={!co}>
      <button ref={nutTg} type="button" className="duo-den" aria-label={coGoi && !daXem ? 'Trợ giúp, có gợi ý chưa xem' : 'Trợ giúp'} aria-expanded={mo} aria-controls={id}
        data-moi={(coGoi && !daXem) || undefined} onClick={() => { phanHoi('chon'); setMo((v) => !v) }}>
        <Lightbulb size={22} aria-hidden="true" />
      </button>
      {/* chọn một mục ⇒ mục chạy việc của nó (cùng lượt sự kiện) rồi tấm đóng */}
      <div ref={tam} id={id} className="duo-tg-tam" role="group" aria-label="Trợ giúp của câu này" hidden={!mo}
        onClick={(e) => { if ((e.target as HTMLElement).closest('button')) setMo(false) }}>
        {children}
      </div>
    </div>
  )
}
