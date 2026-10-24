// CÀI ĐẶT · A.I ĐỖ ĐẠI HỌC TRONG APP HỌC SINH (thầy 24/10): công tắc Tắt / Thử theo lớp / Bật (`/gv/ai-ddh/che-do`) + đèn văn phòng trực.
// Bật cho em mới thấy bong bóng (máy em giữ cờ tối đa 6 giờ). Văn phòng trực = Mac mini đã hỏi hàng chờ trong 60 giây qua.
import { useEffect, useState } from 'react'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { TheNoiDung } from '../DesignSystem'

type CheDo = 'tat' | 'thu' | 'bat'
const TEN: Record<CheDo, string> = { tat: 'Tắt', thu: 'Thử theo lớp', bat: 'Bật cho mọi em' }
const NUT = (chon: boolean) => ({ minHeight: 44, padding: '0 16px', borderRadius: 999, border: `1px solid ${chon ? 'var(--muc)' : 'var(--vien)'}`, background: chon ? 'var(--muc)' : 'var(--the)', color: chon ? 'var(--the)' : 'var(--muc)', fontWeight: 600, cursor: 'pointer' }) as const

export default function CongTacAiDdh() {
  const [cheDo, setCheDo] = useState<CheDo | null>(null)
  const [lop, setLop] = useState('')
  const [truc, setTruc] = useState<boolean | null>(null)
  const [loi, setLoi] = useState('')
  const [dang, setDang] = useState(false)
  const doc = (r: Awaited<ReturnType<typeof goiLenh>>) => {
    if (!r.ok) { setLoi(r.chu); return }
    const v = r.du.cheDo
    setCheDo(v === 'bat' || v === 'thu' ? v : 'tat')
    setLop(Array.isArray(r.du.lop) ? (r.du.lop as unknown[]).map(String).join(', ') : '')
    setTruc(r.du.vanPhongTruc === true)
    setLoi('')
  }
  useEffect(() => { void goiLenh('/gv/ai-ddh/che-do', {}, 'Máy chủ chưa có A.I Đỗ Đại Học — cần đẩy bản máy chủ mới.').then(doc) }, [])
  const luu = async (v: CheDo) => {
    setDang(true)
    doc(await goiLenh('/gv/ai-ddh/che-do', { cheDo: v, lop: lop.split(/[,;\n]/).map((x) => x.trim()).filter(Boolean) }, 'Máy chủ chưa có A.I Đỗ Đại Học.'))
    setDang(false)
  }
  return (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, margin: '0 0 var(--k2)' }}>A.I Đỗ Đại Học trong app học sinh</h2>
      <p style={{ margin: '0 0 var(--k3)', color: 'var(--mo)', lineHeight: 1.5 }}>
        Bong bóng hỏi bài của văn phòng: em gửi đề, văn phòng giải đúng như tin Zalo. Tự khoá khi em đang làm bài kiểm tra.
        {truc !== null && <> Văn phòng: <b style={{ color: truc ? 'var(--xanh)' : 'var(--cam)' }}>{truc ? 'đang trực' : 'đang nghỉ (Mac chưa hỏi hàng chờ)'}</b>.</>}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--k2)' }} role="group" aria-label="Chế độ A.I Đỗ Đại Học">
        {(['tat', 'thu', 'bat'] as const).map((v) => <button key={v} type="button" style={NUT(cheDo === v)} aria-pressed={cheDo === v} disabled={dang || cheDo === null} onClick={() => void luu(v)}>{TEN[v]}</button>)}
      </div>
      <label style={{ display: 'grid', gap: 6, marginTop: 'var(--k3)' }}>
        <span style={{ fontWeight: 600 }}>Lớp chạy thử (chế độ «Thử theo lớp»), cách nhau dấu phẩy</span>
        <input value={lop} onChange={(e) => setLop(e.target.value)} placeholder="12A1, 12A2" style={{ minHeight: 44, borderRadius: 12, border: '1px solid var(--vien)', padding: '0 12px', background: 'var(--the)', color: 'var(--muc)' }} />
      </label>
      {cheDo === 'thu' && <button type="button" style={{ ...NUT(false), marginTop: 'var(--k2)' }} disabled={dang} onClick={() => void luu('thu')}>Lưu danh sách lớp</button>}
      {loi && <p role="alert" style={{ color: 'var(--do)', margin: 'var(--k2) 0 0' }}>{loi}</p>}
    </TheNoiDung>
  )
}
