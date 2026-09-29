// ĐIỂM DANH BUỔI HỌC — lối vào trên app học sinh (bảng Dạy học của thầy, 28/09).
//  · Có buổi học ĐANG MỞ của lớp em mà em chưa điểm danh ⇒ thẻ nhỏ nổi trên Sảnh / Bảng nhiệm vụ: "Điểm danh buổi học" + ô nhập mã 6 số.
//  · Em quét QR trên máy chiếu bằng máy ảnh điện thoại ⇒ app mở với `?diem-danh=<mã>` ⇒ tự điểm danh, không phải gõ.
//  · Em chỉ điểm danh cho CHÍNH MÌNH (máy chủ lấy SBD từ token). Mã đổi mỗi phút — mã cũ bị từ chối bằng lời dễ hiểu.
//  · Hỏi máy chủ MỘT lần khi mở app + khi em quay lại tab (không vòng hỏi nền). Máy chủ chưa có lệnh ⇒ không hiện gì.
import { useCallback, useEffect, useRef, useState } from 'react'
import { buoiCuaEm, emDiemDanh, maTuDuongDan, type BuoiCuaEm } from '../../lib/buoi-hoc-api'
import './diem-danh-hs.css'

type TrangThai = { loai: 'an' } | { loai: 'cho'; buoi: BuoiCuaEm | null } | { loai: 'xong'; buoi: BuoiCuaEm }

function xoaMaKhoiDuongDan() {
  try {
    const u = new URL(window.location.href)
    if (!u.searchParams.has('diem-danh')) return
    u.searchParams.delete('diem-danh')
    window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}${u.hash}`)
  } catch {
    /* trình duyệt cũ: để nguyên đường dẫn */
  }
}

/** "Buổi học 29/09/2026" ⇒ "29/09"; tên thầy tự đặt thì giữ nguyên. */
export function ngayGon(ten: string): string {
  const m = /(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?/.exec(ten)
  return m && /^Buổi học\s/.test(ten) ? `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}` : ten
}

export default function TheDiemDanhHs({ token }: { token: string }) {
  const [tt, setTt] = useState<TrangThai>({ loai: 'an' })
  const [mo, setMo] = useState(false)
  const [ma, setMa] = useState('')
  const [loi, setLoi] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const oNhap = useRef<HTMLInputElement>(null)
  const daTuGui = useRef(false)

  const gui = useCallback(
    async (maGui: string) => {
      const m = maGui.replace(/\D/g, '')
      if (m.length !== 6) {
        setLoi('Mã điểm danh gồm 6 chữ số trên máy chiếu.')
        oNhap.current?.focus()
        return
      }
      setDangGui(true)
      setLoi('')
      const r = await emDiemDanh(token, m)
      setDangGui(false)
      if (r.ok) {
        setTt({ loai: 'xong', buoi: r.buoi })
        setMa('')
        setMo(false)
      } else {
        setLoi(r.chu)
        setMo(true)
        oNhap.current?.focus()
      }
    },
    [token],
  )

  const hoi = useCallback(async () => {
    const b = await buoiCuaEm(token).catch(() => null)
    setTt((cu) => {
      if (cu.loai === 'xong') return cu
      if (!b) return cu.loai === 'cho' && !cu.buoi ? cu : { loai: 'an' }
      // Đã điểm danh từ trước (mở lại app / đóng màn khác) ⇒ không làm phiền nữa; báo "đã điểm danh" chỉ ngay sau lượt em bấm.
      return b.daDiemDanh ? { loai: 'an' } : { loai: 'cho', buoi: b }
    })
  }, [token])

  useEffect(() => {
    // QUÉT QR: mã có sẵn trong đường dẫn ⇒ gửi ngay một lần rồi xoá khỏi đường dẫn (tải lại trang không gửi lại).
    const maUrl = typeof window !== 'undefined' ? maTuDuongDan(window.location.search) : ''
    if (maUrl && !daTuGui.current) {
      daTuGui.current = true
      xoaMaKhoiDuongDan()
      setTt({ loai: 'cho', buoi: null })
      void gui(maUrl)
    }
    void hoi()
    const hien = () => {
      if (document.visibilityState === 'visible') void hoi()
    }
    document.addEventListener('visibilitychange', hien)
    return () => document.removeEventListener('visibilitychange', hien)
  }, [gui, hoi])

  if (tt.loai === 'an') return null

  if (tt.loai === 'xong')
    return (
      <div className="dd-hs dd-hs--xong" role="status" data-khoi="diem-danh-hs">
        <span className="dd-hs-dau" aria-hidden="true">
          ✓
        </span>
        <span className="dd-hs-chu">
          <b>Em đã điểm danh</b>
          <span>{tt.buoi.ten}</span>
        </span>
        <button type="button" className="dd-hs-an" onClick={() => setTt({ loai: 'an' })} aria-label="Ẩn thông báo điểm danh">
          Ẩn
        </button>
      </div>
    )

  return (
    <section className={`dd-hs${mo ? ' dd-hs--mo' : ' dd-hs--gon'}`} aria-label="Điểm danh buổi học" data-khoi="diem-danh-hs">
      {!mo ? (
        // GỌN (29/09, thầy: "gọn và tinh tế"): một viên thuốc nhỏ giữa mép trên — chấm nhịp + "Điểm danh" + ngày buổi; bấm mở ô nhập mã.
        <button type="button" className="dd-hs-mo" onClick={() => setMo(true)} aria-label={`Điểm danh buổi học${tt.buoi ? ` · ${tt.buoi.ten}` : ''}`}>
          <span className="dd-hs-cham" aria-hidden="true" />
          <b className="dd-hs-gon-chu">Điểm danh</b>
          {tt.buoi && <span className="dd-hs-gon-phu">{ngayGon(tt.buoi.ten)}</span>}
          <span className="dd-hs-gon-mui" aria-hidden="true">›</span>
        </button>
      ) : (
        <form
          className="dd-hs-form"
          onSubmit={(e) => {
            e.preventDefault()
            void gui(ma)
          }}
        >
          <div className="dd-hs-dong">
            <h2>Điểm danh buổi học</h2>
            <button type="button" className="dd-hs-an" onClick={() => setMo(false)}>
              Thu gọn
            </button>
          </div>
          {tt.buoi && <p className="dd-hs-ten">{tt.buoi.ten}</p>}
          <label htmlFor="dd-hs-ma">Mã 6 số trên máy chiếu (hoặc quét mã QR bằng máy ảnh)</label>
          <div className="dd-hs-nhap">
            <input
              id="dd-hs-ma"
              ref={oNhap}
              value={ma}
              onChange={(e) => {
                setMa(e.target.value.replace(/\D/g, '').slice(0, 6))
                setLoi('')
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={7}
              placeholder="000 000"
              aria-invalid={!!loi}
              aria-describedby={loi ? 'dd-hs-loi' : undefined}
              autoFocus
            />
            <button type="submit" className="dd-hs-gui" disabled={dangGui || ma.length !== 6}>
              {dangGui ? 'Đang gửi…' : 'Điểm danh'}
            </button>
          </div>
          {loi && (
            <p id="dd-hs-loi" className="dd-hs-loi" role="alert">
              {loi}
            </p>
          )}
          <p className="dd-hs-phu">Mã đổi mỗi phút. Em chỉ điểm danh được cho chính mình.</p>
        </form>
      )}
    </section>
  )
}
