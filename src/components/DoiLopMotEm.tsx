import { useEffect, useRef, useState } from 'react'
import { doiLopMotEm, type LopThay } from '../lib/ten-lop-thay'

const NHAN: React.CSSProperties = { fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--nhat)', fontWeight: 700 }
const O: React.CSSProperties = { width: '100%', minHeight: 44, padding: '0 var(--k3)', borderRadius: 'var(--bo-1)', border: '1px solid var(--vien-dam)', background: 'var(--the-2)', color: 'var(--muc)', fontFamily: 'var(--sans)', fontSize: 'var(--cx-2)' }
const MOI = '__lop_moi'

/** HỘP "ĐỔI LỚP" MỘT EM (thầy lệnh 21/09): chọn một lớp có sẵn hoặc gõ tên lớp mới rồi "Chuyển lớp". Lệnh GHI `/gv/doi-lop-em` (lib/ten-lop-thay): máy chủ từ chối ⇒ hiện đúng lời máy chủ; chậm ⇒ CHƯA CHẮC.
 *  Chỉ đổi TÊN LỚP; khối (`lop`) và mọi dữ liệu học của em giữ nguyên. Nơi dùng chỉ dựng hộp này khi máy chủ ĐÃ có danh sách lớp. */
export default function DoiLopMotEm({ sbd, hoTen, lopHienTai, dsLop, onXong, onDong }: { sbd: string; hoTen: string; lopHienTai: string; dsLop: LopThay[]; onXong: (tenLop: string) => void; onDong: () => void }) {
  const [chon, setChon] = useState(dsLop.some((l) => l.tenLop === lopHienTai) ? lopHienTai : (dsLop[0]?.tenLop ?? MOI))
  const [moi, setMoi] = useState('')
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const oChon = useRef<HTMLSelectElement>(null)
  useEffect(() => {
    oChon.current?.focus()
    const phim = (e: KeyboardEvent) => e.key === 'Escape' && !dang && onDong()
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [dang, onDong])

  const ten = (chon === MOI ? moi : chon).trim()
  const khongDoi = ten === lopHienTai
  const chuyen = async () => {
    setDang(true)
    setLoi('')
    const r = await doiLopMotEm(sbd, ten)
    setDang(false)
    if (r.ok) onXong(r.du.tenLop)
    else setLoi(r.chu)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--phu)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div role="dialog" aria-modal="true" aria-label={`Đổi lớp của ${hoTen || `SBD ${sbd}`}`} style={{ width: '100%', maxWidth: 440, padding: 24, borderRadius: 22, background: 'var(--the)', color: 'var(--muc)', boxShadow: 'var(--bong-2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Đổi lớp của {hoTen || `SBD ${sbd}`}</h2>
        <p style={{ margin: 0, lineHeight: 1.6, fontSize: 14 }}>
          Em đang ở lớp <b>{lopHienTai || 'chưa xếp lớp'}</b>. Chỉ đổi tên lớp; khối và kết quả học của em giữ nguyên.
        </p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={NHAN}>Chuyển sang lớp</span>
          <select ref={oChon} value={chon} onChange={(e) => setChon(e.target.value)} style={O}>
            {dsLop.map((l) => (
              <option key={l.tenLop} value={l.tenLop}>
                {l.tenLop}
              </option>
            ))}
            <option value={MOI}>Lớp mới…</option>
          </select>
        </label>
        {chon === MOI && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={NHAN}>Tên lớp mới</span>
            <input type="text" value={moi} maxLength={40} onChange={(e) => setMoi(e.target.value)} placeholder="Ví dụ: 12 - Tinh Hoa" style={O} />
          </label>
        )}
        {khongDoi && ten !== '' && <p style={{ margin: 0, fontSize: 13, color: 'var(--nhat)' }}>Em đang ở lớp này rồi — chọn lớp khác để đổi.</p>}
        {loi && (
          <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--do)', lineHeight: 1.5 }}>
            {loi}
          </p>
        )}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button type="button" className="tap-target hs-nut-vien" disabled={dang} onClick={onDong}>
            Giữ nguyên
          </button>
          <button type="button" className="tap-target hs-nut-chinh" disabled={dang || ten === '' || khongDoi} onClick={() => void chuyen()}>
            {dang ? 'Đang chuyển…' : 'Chuyển lớp'}
          </button>
        </div>
      </div>
    </div>
  )
}
