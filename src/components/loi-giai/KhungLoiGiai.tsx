// KHUNG LỜI GIẢI TỪNG BƯỚC — hộp toàn màn chứa trang tĩnh `public/loi-giai/khung.html` trong iframe sandbox="allow-scripts"
// (KHÔNG allow-same-origin: khung không đọc được phiên đăng nhập, không gọi mạng — CSP của khung chặn thêm một lớp).
// Dữ liệu đi một chiều qua postMessage khi khung báo "khung-san-sang". Esc / nút Đóng để thoát; tiêu điểm trả về nút đã mở.
import { useEffect, useId, useRef } from 'react'
import type { CauChoKhung, HoSoLoiGiai } from '../../lib/loi-giai-api'
import './loi-giai.css'

export const DUONG_KHUNG = `${import.meta.env.BASE_URL}loi-giai/khung.html`

export default function KhungLoiGiai({ hoSo, cau, thay = false, onDong }: { hoSo: HoSoLoiGiai; cau: CauChoKhung; thay?: boolean; onDong: () => void }) {
  const khung = useRef<HTMLIFrameElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const id = useId()
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    const nghe = (e: MessageEvent) => {
      if (e.source !== khung.current?.contentWindow) return
      if ((e.data as { loai?: string })?.loai === 'khung-san-sang') khung.current?.contentWindow?.postMessage({ loai: 'loi-giai', hoSo, cau, thay }, '*')
    }
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') onDong() }
    window.addEventListener('message', nghe)
    window.addEventListener('keydown', phim)
    return () => {
      window.removeEventListener('message', nghe)
      window.removeEventListener('keydown', phim)
      truoc?.focus?.()
    }
  }, [hoSo, cau, thay, onDong])
  return (
    <div className="lg-nen m3" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
      <div className="lg-thanh">
        <h2 id={`${id}-t`} className="lg-tieu-de">Lời giải từng bước · {cau.so}</h2>
        <button ref={nutDong} type="button" className="lg-nut" onClick={onDong}>Đóng</button>
      </div>
      <iframe ref={khung} className="lg-khung" title={`Lời giải từng bước ${cau.so}`} src={DUONG_KHUNG} sandbox="allow-scripts" referrerPolicy="no-referrer" />
    </div>
  )
}
