// HỎI THÊM THẦY (thầy 13/10): dưới lời giải của nút Hỏi thầy, em nhắn chỗ còn thắc mắc về CHÍNH câu này; máy chủ (server/src/hoi-tro-ly.ts)
// trả lời theo lời giải của Thầy, giọng Thầy Đỗ Đại Học. Máy chủ chặn ca kiểm tra, câu chưa công bố, câu hỏi ngoài phạm vi, trần câu hỏi mỗi ngày.
// `gon`: mở sẵn, không nút thu gọn. `hop`: nằm trong hộp thoại Hỏi Thầy (HopHoiThay) — lấp đầy hộp, không tiêu đề riêng.
import { useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { ChemText } from '../../lib/chem-format'
import { hoiThemThay } from '../../lib/hoi-them-thay-api'
import TraLoiThay, { chuHoa, docCauTruc, type CauTrucTraLoi } from './TraLoiThay'

/** `ct`: câu trả lời có cấu trúc (bản vẽ docs/ban-ve-hoi-thay-1310) — vắng ⇒ vẽ chữ phẳng như cũ. */
type Tin = { vai: 'em' | 'thay'; chu: string; ct?: CauTrucTraLoi | null }
export const TOI_DA_KY_TU = 500
const MA_DUNG_HAN = new Set(['het_luot', 'het_luot_cau', 'chua_bat', 'dang_kiem_tra', 'ca_chua_cong_bo', 'chua_mo'])

/** `onTraLoi`: gọi một lần khi Thầy trả lời được câu đầu (game tính câu này là "có trợ giúp", như khi mở lời giải).
 *  `dangLam`: em đang làm câu, chưa nộp ⇒ máy chủ chỉ cho Thầy gợi hướng, không nêu đáp án. */
export default function HoiThemThay({ qid, nguon, gon = false, hop = false, dangLam = false, onTraLoi }: { qid: string; nguon: string; gon?: boolean; hop?: boolean; dangLam?: boolean; onTraLoi?: () => void }) {
  const id = useId()
  const [mo, setMo] = useState(gon || hop)
  const [tin, setTin] = useState<Tin[]>([])
  const [chu, setChu] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')
  const [conLai, setConLai] = useState<number | null>(null)
  const [dung, setDung] = useState(false)
  const oRef = useRef<HTMLTextAreaElement>(null)
  // Ô gõ TỰ GIÃN theo chữ (một dòng lúc trống, tối đa ~5 dòng rồi cuộn) — không còn góc kéo cỡ.
  useLayoutEffect(() => {
    const o = oRef.current
    if (!o) return
    o.style.height = 'auto'
    o.style.height = `${Math.min(o.scrollHeight, 132)}px`
  }, [chu, mo])

  if (!mo) {
    return (
      <div className="lg-ht lg-ht--dong">
        <button type="button" className="lg-ht-mo" aria-expanded={false} onClick={() => { setMo(true); setTimeout(() => oRef.current?.focus(), 0) }}>
          Em còn chỗ chưa hiểu? Nhắn hỏi Thầy
        </button>
      </div>
    )
  }

  // `cauSan`: câu bấm từ nút "hỏi tiếp" dưới câu trả lời của Thầy ⇒ gửi ngay, không đụng chữ em đang gõ dở.
  const gui = async (e?: FormEvent, cauSan?: string) => {
    e?.preventDefault()
    const cau = (cauSan ?? chu).trim()
    if (cau.length < 2 || dangGui || dung) return
    setDangGui(true)
    setLoi('')
    setTin((t) => [...t, { vai: 'em', chu: cau }])
    if (cauSan === undefined) setChu('')
    const r = await hoiThemThay(qid, nguon, cau, '', dangLam)
    setDangGui(false)
    if (r.ok) {
      if (!r.ngoaiPhamVi && !tin.some((m) => m.vai === 'thay')) onTraLoi?.()
      setTin((t) => [...t, { vai: 'thay', chu: r.traLoi, ct: r.ngoaiPhamVi ? null : docCauTruc(r.cauTruc) }])
      setConLai(r.conLai)
      if (r.conLai <= 0) setDung(true)
      return
    }
    // Chưa gửi được ⇒ bỏ tin vừa nhắn khỏi khung, trả chữ lại ô nhập để em gửi lại.
    setTin((t) => t.slice(0, -1))
    if (cauSan === undefined) setChu(cau)
    setLoi(r.loi)
    if (r.conLai !== undefined) setConLai(r.conLai)
    if (MA_DUNG_HAN.has(r.ma)) setDung(true)
  }
  const phim = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void gui() }
  }

  return (
    <section className={hop ? 'lg-ht lg-ht--hop' : gon ? 'lg-ht lg-ht--gon' : 'lg-ht'} aria-label={hop ? 'Hỏi Thầy về câu này' : undefined} aria-labelledby={hop ? undefined : `${id}-t`}>
      {!hop && (
        <div className="lg-ht-dau">
          <h3 id={`${id}-t`} className="lg-ht-tieu-de">Hỏi thêm Thầy về câu này</h3>
          {!gon && <button type="button" className="lg-nut" aria-expanded={true} onClick={() => setMo(false)}>Thu gọn</button>}
        </div>
      )}
      <div className="lg-ht-log" role="log" aria-live="polite" aria-busy={dangGui}>
        {tin.map((m, i) => (m.vai === 'em' ? (
          <p key={i} className="lg-ht-em"><ChemText text={chuHoa(m.chu)} /></p>
        ) : m.ct ? (
          <TraLoiThay key={i} ct={m.ct} dangLam={dangLam} khoa={dangGui} onHoi={i === tin.length - 1 && !dung ? (q) => void gui(undefined, q) : undefined} />
        ) : (
          <div key={i} className="lg-ht-thay">
            <span className="lg-ht-nhan">Thầy Đỗ Đại Học</span>
            {m.chu.split('\n').map((d) => d.trim()).filter(Boolean).map((d, j) => <p key={j}><ChemText text={chuHoa(d)} /></p>)}
          </div>
        )))}
        {dangGui && <p className="lg-ht-cho">Thầy đang trả lời<span className="lg-ht-cham" aria-hidden="true"><i /><i /><i /></span></p>}
      </div>
      {loi && <p className="lg-ht-loi" role="alert">{loi}</p>}
      {/* Ô NHẮN (thầy 13/10 "chỉnh lại ô này cho thật đẹp, tinh tế, câu slogan ở dưới chỉnh vào giữa nổi bật"): một khung bo tròn chứa ô gõ tự
          giãn + hàng dưới (câu hỏi còn lại · số ký tự · nút gửi trong khung); khẩu hiệu căn giữa, chữ đậm màu nhấn. CSS: hop-hoi-thay.css (mảnh lười). */}
      <form className="lg-nh" onSubmit={gui}>
        <div className="lg-nh-khung" data-tat={dung || undefined}>
          <label htmlFor={`${id}-o`} className="sr-only">Chỗ em thắc mắc về câu này</label>
          <textarea
            id={`${id}-o`} ref={oRef} className="lg-nh-o" rows={1} maxLength={TOI_DA_KY_TU} value={chu} disabled={dung} autoFocus={hop}
            placeholder="Nhắn chỗ em còn thắc mắc…" onChange={(e) => setChu(e.target.value)} onKeyDown={phim}
          />
          <div className="lg-nh-chan">
            <span className="lg-nh-con">{conLai === null ? '' : `Còn ${conLai} câu hỏi hôm nay`}</span>
            <span className="lg-nh-dem" data-gan={chu.length > TOI_DA_KY_TU - 50 || undefined}>{chu.length}/{TOI_DA_KY_TU}</span>
            <button type="submit" className="lg-nh-gui" aria-label="Gửi" disabled={dangGui || dung || chu.trim().length < 2}>
              <SendHorizontal aria-hidden="true" size={19} strokeWidth={2.3} />
            </button>
          </div>
        </div>
        <p className="lg-nh-khau">KIÊN TRÌ là vũ khí tối thượng để chiến thắng mọi thứ</p>
      </form>
    </section>
  )
}
