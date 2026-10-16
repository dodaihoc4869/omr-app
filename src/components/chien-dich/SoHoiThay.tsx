// SỔ HỎI THẦY (thầy 13/10 khuya: "truy vấn xem đã có bao nhiêu lượt hỏi rồi, từ những số báo danh nào, hỏi câu gì") — trong khối
// Cài đặt · Hỏi Thầy (AI). Chỉ tải khi thầy bấm "Xem sổ hỏi Thầy" (Cài đặt mở không chờ thêm lượt nào). Ba phần: số tổng · từng em
// (bấm một em ⇒ chỉ xem lượt của em ấy) · các lượt gần nhất (giờ, em, mã câu, câu em hỏi, câu Thầy trả lời rút gọn, trạng thái).
// Máy chủ `/gv/hoi-tro-ly/so` (chỉ đọc, sau cổng mã bí mật). Lỗi ⇒ hiện đúng lời máy chủ ngay dưới nút.
import { useEffect, useRef, useState } from 'react'
import { docSoHoiThay, type SoHoiThay as So } from '../../lib/hoi-thay-gv-api'
import { Nhan } from '../DesignSystem'
import CanGiupHoiThay from './CanGiupHoiThay'

const gio = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
}
const TIEU_DE_PHU = { fontSize: 'var(--cx-2)', fontWeight: 700, margin: '0 0 var(--k2)' } as const

export default function SoHoiThay() {
  const [so, setSo] = useState<So | null>(null)
  const [em, setEm] = useState('')
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const song = useRef(true), lanTai = useRef(0)
  useEffect(() => { song.current = true; return () => { song.current = false; lanTai.current++ } }, [])
  const tai = async (sbd = '') => {
    const lan = ++lanTai.current
    setDang(true); setLoi('')
    const r = await docSoHoiThay(sbd, sbd ? 200 : 100)
    if (!song.current || lan !== lanTai.current) return
    setDang(false)
    if (!r.ok) { setLoi(r.loi); return }
    setSo(r.du); setEm(sbd)
  }
  const emDangXem = em ? so?.theoEm.find((x) => x.sbd === em) : undefined
  return (
    <section aria-label="Sổ hỏi Thầy">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--k2) var(--k3)', marginBottom: 'var(--k3)' }}>
        <h3 style={{ ...TIEU_DE_PHU, margin: 0, flex: '1 1 auto' }}>Sổ hỏi Thầy</h3>
        {em && <button type="button" className="cd-chip" aria-pressed onClick={() => void tai('')} disabled={dang}>Đang xem SBD {em} · Xem tất cả</button>}
        <button type="button" className="m3-nut-chu m3-nut-vien" onClick={() => void tai(em)} disabled={dang} style={{ flex: 'none' }}>
          {dang ? 'Đang tải…' : so ? 'Tải lại' : 'Xem sổ hỏi Thầy'}
        </button>
      </div>
      {loi && <p className="cd-loi" role="alert" style={{ margin: '0 0 var(--k3)' }}>{loi}</p>}
      {so && (
        <>
          <div className="cd-kpi-hang" data-so-tong style={{ marginBottom: 'var(--k4)' }}>
            <div className="cd-kpi">
              <span className="cd-kpi-nhan">Số lượt hỏi{emDangXem ? ` của ${emDangXem.ten || em}` : ''}</span>
              <strong>{so.tong.luot}</strong>
              <span className="cd-kpi-phu">Thầy trả lời {so.tong.traLoi} · ngoài phạm vi {so.tong.ngoaiPhamVi} · lỗi {so.tong.loi}</span>
            </div>
            <div className="cd-kpi">
              <span className="cd-kpi-nhan">Số em đã hỏi</span>
              <strong>{so.tong.soEm}</strong>
              <span className="cd-kpi-phu">{so.tong.soCau} câu khác nhau</span>
            </div>
          </div>

          {!em && so.theoEm.length > 0 && (
            <>
              <h4 style={{ ...TIEU_DE_PHU, fontSize: 'var(--cx-1)' }}>Từng em (bấm một em để xem các lượt của em ấy)</h4>
              <div className="cd-cuon-ngang" style={{ marginBottom: 'var(--k4)' }}>
                <table className="cd-bang" data-so-em>
                  <thead><tr><th scope="col">Học sinh</th><th scope="col">SBD</th><th scope="col">Lớp</th><th scope="col">Lượt Thầy trả lời</th><th scope="col">Số câu</th><th scope="col">Lần gần nhất</th></tr></thead>
                  <tbody>
                    {so.theoEm.map((x) => (
                      <tr key={x.sbd}>
                        <td><button type="button" className="cd-nut-nho" onClick={() => void tai(x.sbd)} disabled={dang} aria-label={`Xem các lượt hỏi của ${x.ten || x.sbd}`}>{x.ten || '(chưa có tên)'}</button></td>
                        <td>{x.sbd}</td><td>{x.lop || '—'}</td><td>{x.soLuot}</td><td>{x.soCau}</td><td>{gio(x.ganNhat)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h4 style={{ ...TIEU_DE_PHU, fontSize: 'var(--cx-1)' }}>{em ? 'Các lượt của em này' : `${so.luot.length} lượt gần nhất`}</h4>
          {so.luot.length === 0 && <p className="cd-phu" style={{ margin: 0 }}>Chưa có lượt hỏi nào.</p>}
          <ol data-so-luot style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--k2)' }}>
            {so.luot.map((x, i) => (
              <li key={`${x.luc}-${i}`} style={{ padding: 'var(--k3)', borderRadius: 'var(--bo-2)', border: '1px solid var(--vien)', background: 'var(--m3-surface-container-low)', minWidth: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--k1) var(--k2)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
                  <span>{gio(x.luc)}</span>
                  <span>·</span>
                  <span><b style={{ color: 'var(--muc)' }}>{x.ten || '(chưa có tên)'}</b> {x.sbd}</span>
                  <span>·</span>
                  <span style={{ overflowWrap: 'anywhere' }}>{x.qid}</span>
                  <span style={{ marginLeft: 'auto' }}>
                    {x.loi ? <Nhan tone="do">Lỗi</Nhan> : x.ngoaiPhamVi ? <Nhan tone="xam">Ngoài phạm vi</Nhan> : <Nhan tone="xanh">Thầy trả lời</Nhan>}
                  </span>
                </div>
                <p style={{ margin: 'var(--k2) 0 0', fontWeight: 600, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{x.cauHoi}</p>
                {x.loi
                  ? <p className="cd-phu" style={{ margin: 'var(--k1) 0 0', overflowWrap: 'anywhere' }}>{x.loi}</p>
                  : x.traLoi && <p className="cd-phu" style={{ margin: 'var(--k1) 0 0', lineHeight: 1.5, whiteSpace: 'pre-line', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{x.traLoi}</p>}
              </li>
            ))}
          </ol>
        </>
      )}
      <CanGiupHoiThay />
    </section>
  )
}
