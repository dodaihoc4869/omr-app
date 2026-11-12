// CHAT TRONG LIVE THEO KHỐI — CỘT «TIN NHẮN LỚP» MÁY THẦY (thầy chốt build 12/11; bản vẽ docs/ban-ve-live-moi-1211 ảnh 04 · 05).
// Cột kín chiều cao cha, luôn nền tối xanh than (biến --lc-* của chat.css) dù app thầy đang sáng. Phím M đóng / mở cột là việc của màn ghép.
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { chuanGui } from '../../lib/live-khoi/chat-loi'
import { CHAT_DAI, type ChatGui, type KenhLop } from '../../lib/live-khoi/kieu'
import { BieuTuongChat, DanhSachTin, useChatLop } from './ChatEm'
import './chat.css'

export function CotChatThay({ kenh }: { kenh: KenhLop | null }) {
  const { ds, khoa, danhDauDoc } = useChatLop(kenh)
  const [chiHoi, setChiHoi] = useState(false)
  // Thầy 12/11: «ẩn tin nhắn lớp, tắt tin nhắn, tất cả, câu hỏi vào 1 thẻ nhỏ» ⇒ cột chỉ còn danh sách + ô nhập; ba lựa chọn nằm trong thẻ nhỏ mở từ nút ba chấm.
  const [moThe, setMoThe] = useState(false)
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
      <DanhSachTin ds={chiHoi ? dsHoi : ds} rong={chiHoi ? 'Chưa có câu hỏi nào' : 'Chưa có tin nhắn nào'} veCuoi={veCuoi} />
      {khoa && <p className="lc-bao" role="status" data-loai="khoa">Đang tắt nhắn tin của các em</p>}
      {moThe ? (
        <div className="lc-the-nho" role="menu" aria-label="Tuỳ chọn tin nhắn">
          <button type="button" role="menuitemradio" aria-checked={!chiHoi} onClick={() => { setChiHoi(false); setMoThe(false) }}>Tất cả tin</button>
          <button type="button" role="menuitemradio" aria-checked={chiHoi} onClick={() => { setChiHoi(true); setMoThe(false) }}>Chỉ câu hỏi · {dsHoi.length}</button>
          <button type="button" role="menuitem" data-canh={khoa || undefined} disabled={!kenh} onClick={() => { doiKhoa(); setMoThe(false) }}>{khoa ? 'Mở nhắn tin cho các em' : 'Tắt nhắn tin của các em'}</button>
        </div>
      ) : null}
      <form className="lc-nhap" onSubmit={khiGui}>
        <button type="button" className="lc-ba-cham" aria-haspopup="menu" aria-expanded={moThe} aria-label="Tuỳ chọn tin nhắn" title="Lọc câu hỏi, tắt nhắn tin" onClick={() => setMoThe((c) => !c)}><i /><i /><i />{chiHoi || khoa ? <em aria-hidden="true" /> : null}</button>
        <input value={chu} onChange={(e) => setChu(e.target.value)} maxLength={CHAT_DAI} disabled={!kenh} placeholder="Nhắn cả lớp…" aria-label="Nhắn cả lớp" enterKeyHint="send" autoComplete="off" />
        <button type="submit" className="lc-gui" disabled={!kenh || !chu.trim()} aria-label="Gửi tin"><BieuTuongChat ten="gui" co={18} /></button>
      </form>
    </section>
  )
}
