// XEM PHIẾU NGAY TRONG APP, KHÔNG MỞ THẺ MỚI.
//
// LỖI ĐÃ DÍNH 04-09: bấm "Xem phiếu", app dựng xong rồi mở blob URL ra thẻ
// mới, và thầy nhận trang trắng của Chrome "Không thể truy cập vào tệp của
// bạn". App đã CÀI VÀO MÀN HÌNH CHÍNH chạy ở chế độ standalone — cửa sổ riêng,
// không có thẻ. Ở đó `window.open` một blob URL không mở nổi, và đường dự
// phòng tải tệp về rồi nhờ Chrome mở lại càng hỏng: tệp tạm bị dọn là ra đúng
// màn hình trên.
//
// Nay phiếu hiện thẳng trong một lớp phủ, nội dung nằm trong iframe `srcDoc`.
// Chạy giống nhau ở mọi chỗ: trình duyệt máy tính, app đã cài, điện thoại, và
// cả khi mất mạng. Đúng cách trang báo cáo phụ huynh vẫn dùng và vẫn chạy.
//
// iframe `srcDoc` cùng nguồn với trang cha nên kịch bản gập mở lời giải trong
// phiếu chạy bình thường, và `contentWindow.print()` gọi được từ ngoài.
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X, Download } from 'lucide-react'

/** Tải chuỗi HTML về máy thành tệp. Giữ lại làm đường thoát: thầy muốn gửi
 * nguyên tệp qua Zalo cho em thay vì gửi link. */
export function taiTepHtml(html: string, ten: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ten
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 8000)
}

const NUT: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minHeight: 38,
  padding: '0 14px',
  borderRadius: 999,
  border: '1px solid var(--p-vien)',
  background: 'var(--p-giay)',
  color: 'var(--p-muc)',
  fontFamily: 'var(--sans)',
  fontSize: 'var(--cx-1)',
  fontWeight: 700,
  cursor: 'pointer',
}

export interface KhungXemPhieuProps {
  html: string
  /** Tên tệp khi thầy bấm Tải tệp, vd "phieu-Nguyen-Van-A.html". */
  tenTep?: string
  dong: () => void
}

export default function KhungXemPhieu({ html, tenTep = 'phieu.html', dong }: KhungXemPhieuProps) {
  const khung = useRef<HTMLIFrameElement>(null)

  // Esc để đóng, và khoá cuộn trang nền — không thì cuộn trong phiếu tới cuối
  // là trang phía sau cuộn theo, nhìn như phiếu bị trôi.
  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', phim)
    const cuCu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', phim)
      document.body.style.overflow = cuCu
    }
  }, [dong])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Phiếu bài tập"
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', flexDirection: 'column', background: 'var(--p-nen)' }}
    >
      <div
        className="flex items-center"
        style={{
          gap: 'var(--k2)',
          padding: 'var(--k2) var(--k3)',
          paddingTop: 'calc(var(--k2) + env(safe-area-inset-top))',
          background: 'var(--p-giay)',
          borderBottom: '1px solid var(--p-vien)',
        }}
      >
        <button type="button" onClick={dong} className="tap-target" style={{ ...NUT, paddingLeft: 10, paddingRight: 14 }}>
          <X size={16} />
          Đóng
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => taiTepHtml(html, tenTep)} className="tap-target" style={NUT} title="Tải tệp HTML về máy để gửi Zalo">
          <Download size={16} />
          Tải tệp
        </button>
        <button
          type="button"
          onClick={() => {
            khung.current?.contentWindow?.focus()
            khung.current?.contentWindow?.print()
          }}
          className="tap-target"
          style={{ ...NUT, background: 'var(--p-tim)', borderColor: 'transparent', color: 'var(--p-giay)' }}
        >
          <Printer size={16} />
          In / Lưu PDF
        </button>
      </div>
      <iframe ref={khung} title="Phiếu bài tập" srcDoc={html} style={{ flex: 1, width: '100%', border: 0, background: 'var(--p-giay)' }} />
    </div>,
    document.body,
  )
}
