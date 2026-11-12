// CHAT TRONG LIVE THEO KHỐI — CỘT «TIN NHẮN LỚP» MÁY THẦY (thầy chốt build 12/11; bản vẽ docs/ban-ve-live-moi-1211 ảnh 04 · 05).
// Cột kín chiều cao cha, luôn nền tối xanh than (biến --lc-* của chat.css) dù app thầy đang sáng. Phím M đóng / mở cột là việc của màn ghép.
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { chuanGui } from '../../lib/live-khoi/chat-loi'
import { CHAT_DAI, type ChatGui, type KenhLop } from '../../lib/live-khoi/kieu'
import { BieuTuongChat, DanhSachTin, useChatLop } from './ChatEm'
import './chat.css'

export function CotChatThay({ kenh, onDong }: { kenh: KenhLop | null; onDong?: () => void }) {
  const { ds, khoa, danhDauDoc } = useChatLop(kenh)
  const [chiHoi, setChiHoi] = useState(false)
  const [chu, setChu] = useState('')
  const [veCuoi, setVeCuoi] = useState(0)
  const dsHoi = useMemo(() => ds.filter((t) => t.hoi), [ds])

  // Cột đang hiện ⇒ tin tới là đã đọc.
  useEffect(() => { danhDauDoc() }, [ds, danhDauDoc])

  const khiGui = (e: FormEvent) => {
    e.preventDefault()
    const c = chuanGui(chu)
    if (!c || !kenh) return
    kenh.gui('chat', { c } satisfies ChatGui)
    setChu(''); setChiHoi(false); setVeCuoi((n) => n + 1)
  }
  const doiKhoa = () => kenh?.gui('chat', { tat: !khoa } satisfies ChatGui)

  return (
    <section className="lc-goc lc-khung lc-cot" aria-label="Tin nhắn lớp">
      <div className="lc-dau">
        <BieuTuongChat ten="chat" co={18} />
        <span className="lc-dau-ten">Tin nhắn lớp</span>
        <button type="button" className="lc-vien-bam" data-canh={khoa || undefined} disabled={!kenh} onClick={doiKhoa}><span>{khoa ? 'Mở nhắn tin' : 'Tắt nhắn tin'}</span></button>
        {onDong ? <button type="button" className="lc-o44" onClick={onDong} aria-label="Đóng cột tin nhắn"><BieuTuongChat ten="x" co={18} /></button> : <span style={{ width: 10 }} />}
      </div>
      <div className="lc-loc">
        <button type="button" className="lc-vien-bam" aria-pressed={!chiHoi} onClick={() => setChiHoi(false)}><span>Tất cả</span></button>
        <button type="button" className="lc-vien-bam" aria-pressed={chiHoi} onClick={() => setChiHoi(true)}><span>Câu hỏi · {dsHoi.length}</span></button>
      </div>
      <DanhSachTin ds={chiHoi ? dsHoi : ds} rong={chiHoi ? 'Chưa có câu hỏi nào' : 'Chưa có tin nhắn nào'} veCuoi={veCuoi} />
      {khoa && <p className="lc-bao" role="status" data-loai="khoa">Đang tắt nhắn tin của các em</p>}
      <form className="lc-nhap" onSubmit={khiGui}>
        <input value={chu} onChange={(e) => setChu(e.target.value)} maxLength={CHAT_DAI} disabled={!kenh} placeholder="Nhắn cả lớp…" aria-label="Nhắn cả lớp" enterKeyHint="send" autoComplete="off" />
        <button type="submit" className="lc-gui" disabled={!kenh || !chu.trim()} aria-label="Gửi tin"><BieuTuongChat ten="gui" co={18} /></button>
      </form>
    </section>
  )
}
