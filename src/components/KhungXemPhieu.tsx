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
// iframe `srcDoc` cùng nguồn với trang cha nên kịch bản trong phiếu chạy bình
// thường: gập mở lời giải, lọc theo phần, và HAI NÚT IN ("In đề" / "In kèm
// lời giải") nằm ngay trên thanh của phiếu.
//
// Cố ý KHÔNG đặt thêm nút In ở thanh ngoài này: hai nút in đã nằm trong phiếu,
// thêm nút thứ ba ở ngoài là thầy phải đoán nút nào in ra bản nào. Nhờ vậy bản
// xem trong app và tệp HTML tải về hành xử giống hệt nhau.
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download } from 'lucide-react'

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
  /** Nội dung dựng sẵn tại máy. Dùng cho phiếu bài tập và đề ca. */
  html?: string
  /** Địa chỉ trang có sẵn, vd link báo cáo gửi phụ huynh. Dùng khi cần xem
   * ĐÚNG thứ người nhận sẽ thấy chứ không phải bản dựng lại. */
  src?: string
  /** Tiêu đề trên thanh, vd "Báo cáo gửi phụ huynh". */
  ten?: string
  /** Tên tệp khi thầy bấm Tải tệp, vd "phieu-Nguyen-Van-A.html". */
  tenTep?: string
  dong: () => void
}

export default function KhungXemPhieu({ html, src, ten, tenTep = 'phieu.html', dong }: KhungXemPhieuProps) {
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
        {ten && (
          <div className="font-bold truncate" style={{ flex: 1, minWidth: 0, fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', color: 'var(--p-nhat)' }}>
            {ten}
          </div>
        )}
        {!ten && <div style={{ flex: 1 }} />}
        {/* Chỉ tải được thứ dựng tại máy. Trang lấy từ máy chủ thì tệp nằm ở
            máy chủ, nút Tải tệp ở đây sẽ tải ra tệp rỗng — thà không có nút. */}
        {html && (
          <button type="button" onClick={() => taiTepHtml(html, tenTep)} className="tap-target" style={NUT} title="Tải tệp HTML về máy để gửi Zalo">
            <Download size={16} />
            Tải tệp
          </button>
        )}
      </div>
      <iframe
        title={ten || 'Phiếu bài tập'}
        {...(html ? { srcDoc: html } : { src })}
        style={{ flex: 1, width: '100%', border: 0, background: 'var(--p-giay)' }}
      />
    </div>,
    document.body,
  )
}
