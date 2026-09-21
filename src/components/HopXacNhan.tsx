import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import './hop-xac-nhan.css'

/** HỘP XÁC NHẬN M3 của app giáo viên — thay `confirm()` / `prompt()` của trình duyệt (dọn dư thừa G9, Boss soát).
 *  - Nút xác nhận mang TÊN VIỆC ("Đặt lại mật khẩu", "Xoá khỏi danh sách"), không "OK/Cancel".
 *  - Tiêu điểm vào nút Huỷ (an toàn); việc nguy hiểm cần gõ đúng một giá trị (`yeuCauGo`) mới bật nút — tiêu điểm vào ô gõ.
 *  - Esc / bấm nền = Huỷ (trừ lúc đang làm); Tab quay vòng trong hộp; đóng xong trả tiêu điểm về nút đã mở hộp.
 *  Không in mật khẩu, không mã bí mật: chữ trong hộp do chỗ gọi đưa vào. */
export default function HopXacNhan({
  tieuDe,
  noiDung,
  nhanXacNhan,
  nhanHuy = 'Huỷ',
  nguyHiem = false,
  dangLam = false,
  nhanDangLam,
  yeuCauGo,
  onXacNhan,
  onHuy,
}: {
  tieuDe: string
  noiDung: ReactNode
  nhanXacNhan: string
  nhanHuy?: string
  nguyHiem?: boolean
  dangLam?: boolean
  /** Chữ trên nút xác nhận lúc đang làm (mặc định "Đang làm…"). */
  nhanDangLam?: string
  /** Bắt gõ đúng `giaTri` (so sau khi cắt khoảng trắng) mới bật nút xác nhận. `nhan` là câu dặn trên ô gõ. */
  yeuCauGo?: { nhan: string; giaTri: string }
  onXacNhan: () => void
  onHuy: () => void
}) {
  const id = useId()
  const goc = useRef<HTMLDivElement>(null)
  const nutHuy = useRef<HTMLButtonElement>(null)
  const oGo = useRef<HTMLInputElement>(null)
  const [go, setGo] = useState('')
  const khop = !yeuCauGo || go.trim() === yeuCauGo.giaTri
  const duocBam = khop && !dangLam

  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    ;(oGo.current ?? nutHuy.current)?.focus()
    return () => truoc?.focus?.()
  }, [])
  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dangLam) {
        e.preventDefault()
        onHuy()
        return
      }
      if (e.key !== 'Tab' || !goc.current) return
      const ds = Array.from(goc.current.querySelectorAll<HTMLElement>('input, button:not([disabled])'))
      const dau = ds[0]
      const cuoi = ds[ds.length - 1]
      if (e.shiftKey && document.activeElement === dau) {
        e.preventDefault()
        cuoi.focus()
      } else if (!e.shiftKey && document.activeElement === cuoi) {
        e.preventDefault()
        dau.focus()
      }
    }
    document.addEventListener('keydown', phim)
    return () => document.removeEventListener('keydown', phim)
  }, [onHuy, dangLam])

  return (
    <div className="hxn-nen" data-khoi="hop-xac-nhan">
      {/* Bấm nền = Huỷ (chuột/cảm ứng); ẩn khỏi trình đọc màn hình và ngoài vòng Tab vì đã có nút Huỷ và phím Esc */}
      <button type="button" className="hxn-man" aria-hidden="true" tabIndex={-1} disabled={dangLam} onClick={onHuy} />
      <div ref={goc} className="hxn-hop" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-n`}>
        <h2 id={`${id}-t`} className="hxn-tieu-de">
          {tieuDe}
        </h2>
        <div id={`${id}-n`} className="hxn-noi-dung">
          {noiDung}
        </div>
        {yeuCauGo && (
          <label className="hxn-go">
            <span>{yeuCauGo.nhan}</span>
            <input
              ref={oGo}
              value={go}
              autoComplete="off"
              inputMode="numeric"
              onChange={(e) => setGo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && duocBam) onXacNhan()
              }}
            />
          </label>
        )}
        <div className="hxn-nut-hang">
          <button ref={nutHuy} type="button" className="hxn-nut hxn-nut--chu" disabled={dangLam} onClick={onHuy}>
            {nhanHuy}
          </button>
          <button type="button" className={`hxn-nut hxn-nut--chinh${nguyHiem ? ' hxn-nut--nguy-hiem' : ''}`} disabled={!duocBam} onClick={onXacNhan}>
            {dangLam ? (nhanDangLam ?? 'Đang làm…') : nhanXacNhan}
          </button>
        </div>
      </div>
    </div>
  )
}
