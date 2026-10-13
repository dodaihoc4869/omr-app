// HỎI THÊM THẦY (thầy 13/10): dưới lời giải của nút Hỏi thầy, em nhắn chỗ còn thắc mắc về CHÍNH câu này; máy chủ (server/src/hoi-tro-ly.ts)
// trả lời theo lời giải của Thầy, giọng Thầy Đỗ Đại Học. Máy chủ chặn ca kiểm tra, câu chưa công bố, câu hỏi ngoài phạm vi, trần câu hỏi mỗi ngày.
// `gon`: dạng nằm ngay trong trang (câu chưa có lời giải từng bước) — mở sẵn, không nút thu gọn.
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ChemText } from '../../lib/chem-format'
import { chiSoRo } from '../../lib/chi-so-ro'
import { hoiThemThay } from '../../lib/loi-giai-api'

type Tin = { vai: 'em' | 'thay'; chu: string }
export const TOI_DA_KY_TU = 500
const MA_DUNG_HAN = new Set(['het_luot', 'het_luot_cau', 'chua_bat', 'dang_kiem_tra', 'ca_chua_cong_bo', 'chua_mo'])

/** `onTraLoi`: gọi một lần khi Thầy trả lời được câu đầu (game tính câu này là "có trợ giúp", như khi mở lời giải). */
export default function HoiThemThay({ qid, nguon, gon = false, onTraLoi }: { qid: string; nguon: string; gon?: boolean; onTraLoi?: () => void }) {
  const id = useId()
  const [mo, setMo] = useState(gon)
  const [tin, setTin] = useState<Tin[]>([])
  const [chu, setChu] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')
  const [conLai, setConLai] = useState<number | null>(null)
  const [dung, setDung] = useState(false)
  const oRef = useRef<HTMLTextAreaElement>(null)

  if (!mo) {
    return (
      <div className="lg-ht lg-ht--dong">
        <button type="button" className="lg-ht-mo" aria-expanded={false} onClick={() => { setMo(true); setTimeout(() => oRef.current?.focus(), 0) }}>
          Em còn chỗ chưa hiểu? Nhắn hỏi Thầy
        </button>
      </div>
    )
  }

  const gui = async (e?: FormEvent) => {
    e?.preventDefault()
    const cau = chu.trim()
    if (cau.length < 2 || dangGui || dung) return
    setDangGui(true)
    setLoi('')
    setTin((t) => [...t, { vai: 'em', chu: cau }])
    setChu('')
    const r = await hoiThemThay(qid, nguon, cau)
    setDangGui(false)
    if (r.ok) {
      if (!r.ngoaiPhamVi && !tin.some((m) => m.vai === 'thay')) onTraLoi?.()
      setTin((t) => [...t, { vai: 'thay', chu: r.traLoi }])
      setConLai(r.conLai)
      if (r.conLai <= 0) setDung(true)
      return
    }
    // Chưa gửi được ⇒ bỏ tin vừa nhắn khỏi khung, trả chữ lại ô nhập để em gửi lại.
    setTin((t) => t.slice(0, -1))
    setChu(cau)
    setLoi(r.loi)
    if (r.conLai !== undefined) setConLai(r.conLai)
    if (MA_DUNG_HAN.has(r.ma)) setDung(true)
  }
  const phim = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void gui() }
  }

  return (
    <section className={gon ? 'lg-ht lg-ht--gon' : 'lg-ht'} aria-labelledby={`${id}-t`}>
      <div className="lg-ht-dau">
        <h3 id={`${id}-t`} className="lg-ht-tieu-de">Hỏi thêm Thầy về câu này</h3>
        {!gon && <button type="button" className="lg-nut" aria-expanded={true} onClick={() => setMo(false)}>Thu gọn</button>}
      </div>
      <div className="lg-ht-log" role="log" aria-live="polite" aria-busy={dangGui}>
        {tin.length === 0 && <p className="lg-ht-goi-y">Em nhắn đúng chỗ em vướng ở câu này, ví dụ: “Vì sao bước 2 lại lấy số mol muối bằng số mol ester?”</p>}
        {tin.map((m, i) => (m.vai === 'em' ? (
          <p key={i} className="lg-ht-em">{m.chu}</p>
        ) : (
          <div key={i} className="lg-ht-thay">
            <span className="lg-ht-nhan">Thầy Đỗ Đại Học</span>
            {m.chu.split('\n').map((d) => d.trim()).filter(Boolean).map((d, j) => <p key={j}><ChemText text={chiSoRo(d)} /></p>)}
          </div>
        )))}
        {dangGui && <p className="lg-ht-cho">Thầy đang trả lời…</p>}
      </div>
      {loi && <p className="lg-ht-loi" role="alert">{loi}</p>}
      <form className="lg-ht-nhap" onSubmit={gui}>
        <div className="lg-ht-dem">
          <span>{conLai === null ? '' : `Còn ${conLai} câu hỏi hôm nay`}</span>
          <span>{chu.length}/{TOI_DA_KY_TU} ký tự</span>
        </div>
        <div className="lg-ht-hang">
          <label htmlFor={`${id}-o`} className="sr-only">Chỗ em thắc mắc về câu này</label>
          <textarea
            id={`${id}-o`} ref={oRef} className="lg-ht-o" rows={2} maxLength={TOI_DA_KY_TU} value={chu} disabled={dung}
            placeholder="Nhắn chỗ em còn thắc mắc…" onChange={(e) => setChu(e.target.value)} onKeyDown={phim}
          />
          <button type="submit" className="lg-ht-gui" disabled={dangGui || dung || chu.trim().length < 2}>Gửi</button>
        </div>
        <p className="lg-ht-phu">Trả lời tự động theo lời giải của Thầy. Chỗ nào chưa chắc em hỏi Thầy trên lớp.</p>
      </form>
    </section>
  )
}
