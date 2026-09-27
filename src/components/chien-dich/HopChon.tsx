// HỘP CHỌN của màn chiến dịch (em có mặt, thêm tờ đề) — cùng khung M3 với `HopXacNhan` (lớp `hxn-*`), nhưng là hộp THƯỜNG
// (role="dialog"): bên trong có danh sách để tích. Esc / bấm nền = Đóng; tiêu điểm vào hộp khi mở, trả về nút đã mở khi đóng.
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import '../hop-xac-nhan.css'

export default function HopChon({
  tieuDe,
  moTa,
  children,
  nhanXacNhan,
  xacNhanDuoc = true,
  onXacNhan,
  onDong,
  rong = 420,
}: {
  tieuDe: string
  moTa?: ReactNode
  children: ReactNode
  nhanXacNhan: string
  xacNhanDuoc?: boolean
  onXacNhan: () => void
  onDong: () => void
  rong?: number
}) {
  const id = useId()
  const hop = useRef<HTMLDivElement>(null)
  // Giữ hàm đóng mới nhất trong ref: nơi gọi truyền hàm viết tại chỗ, không được làm hộp giật tiêu điểm mỗi lần vẽ lại.
  const dong = useRef(onDong)
  useLayoutEffect(() => {
    dong.current = onDong
  })
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    hop.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dong.current()
      }
    }
    document.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('keydown', phim)
      truoc?.focus?.()
    }
  }, [])

  return (
    <div className="hxn-nen" data-khoi="hop-chon-chien-dich">
      <button type="button" className="hxn-man" aria-hidden="true" tabIndex={-1} onClick={onDong} />
      <div ref={hop} tabIndex={-1} className="hxn-hop" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} style={{ width: `min(${rong}px, 100%)` }}>
        <h2 id={`${id}-t`} className="hxn-tieu-de">
          {tieuDe}
        </h2>
        {moTa && <div className="hxn-noi-dung">{moTa}</div>}
        {children}
        <div className="hxn-nut-hang">
          <button type="button" className="hxn-nut hxn-nut--chu" onClick={onDong}>
            Đóng
          </button>
          <button type="button" className="hxn-nut hxn-nut--chinh" disabled={!xacNhanDuoc} onClick={onXacNhan}>
            {nhanXacNhan}
          </button>
        </div>
      </div>
    </div>
  )
}
