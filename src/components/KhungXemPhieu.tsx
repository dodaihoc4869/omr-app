// XEM PHIẾU / BÁO CÁO NGAY TRONG APP, KHÔNG NHẢY SANG TRANG MỚI.
//
// LỖI ĐÃ DÍNH 04-09: bấm "Xem phiếu", app dựng xong rồi mở blob URL ra thẻ
// mới, và thầy nhận trang trắng của Chrome "Không thể truy cập vào tệp của
// bạn". App đã CÀI VÀO MÀN HÌNH CHÍNH chạy ở chế độ standalone — cửa sổ riêng,
// không có thẻ. Ở đó `window.open` một blob URL không mở nổi.
//
// Nay nội dung hiện thẳng trong một lớp phủ, nằm trong iframe. Chạy giống nhau
// ở mọi chỗ: trình duyệt máy tính, app đã cài, điện thoại, và cả khi mất mạng.
//
// KHÔNG CÓ THANH CÔNG CỤ (thầy chốt 04-09 tối). Bản trước có một dải "Đóng" ở
// đầu; mở phiếu bài tập từ trong báo cáo là ra HAI dải chồng nhau, cùng chữ
// Đóng, chiếm mất hai dòng đầu màn hình. Nay đóng bằng đúng thứ người dùng đã
// quen:
//   · vuốt quay lại / nút back của trình duyệt — mở lớp phủ có ĐẨY MỘT MỤC vào
//     lịch sử, nên back là đóng chứ không thoát app;
//   · phím Esc trên máy tính;
//   · nút X nhỏ nổi ở góc, để người chưa biết hai cách trên không bị kẹt.
//
// Các nút "In đề" / "In kèm lời giải" / "Tải tệp" nằm trên thanh của CHÍNH
// phiếu (html-phieu.ts), nên bản xem trong app và tệp HTML tải về giống hệt
// nhau, và không có nút nào phải đoán nghĩa.
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface KhungXemPhieuProps {
  /** Nội dung dựng sẵn tại máy. Dùng cho phiếu bài tập và đề ca. */
  html?: string
  /** Địa chỉ trang có sẵn, vd link báo cáo gửi phụ huynh. Dùng khi cần xem
   * ĐÚNG thứ người nhận sẽ thấy chứ không phải bản dựng lại. */
  src?: string
  /** Nhãn cho trình đọc màn hình. Không hiện thành chữ trên màn. */
  ten?: string
  dong: () => void
}

export default function KhungXemPhieu({ html, src, ten, dong }: KhungXemPhieuProps) {
  useEffect(() => {
    // ĐẨY MỘT MỤC LỊCH SỬ để vuốt quay lại (và nút back) đóng lớp phủ thay vì
    // thoát khỏi app.
    let cuaMinh = true
    try {
      history.pushState({ khungXemPhieu: Date.now() }, '')
    } catch {
      cuaMinh = false
    }
    const quayLai = () => {
      // back đã tiêu mục của mình rồi, đừng gọi back thêm lần nữa lúc dọn.
      cuaMinh = false
      dong()
    }
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('popstate', quayLai)
    window.addEventListener('keydown', phim)

    // Khoá cuộn trang nền — không thì cuộn trong phiếu tới cuối là trang phía
    // sau cuộn theo, nhìn như phiếu bị trôi.
    const cuonCu = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('popstate', quayLai)
      window.removeEventListener('keydown', phim)
      document.body.style.overflow = cuonCu
      // Đóng bằng Esc hoặc nút X thì mục lịch sử vẫn còn — gỡ ra, không thì
      // lần sau bấm back thành một nhịp thừa không làm gì.
      if (cuaMinh) {
        try {
          history.back()
        } catch {
          /* trình duyệt chặn thì thôi */
        }
      }
    }
  }, [dong])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={ten || 'Phiếu bài tập'} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'var(--p-giay)' }}>
      <iframe
        title={ten || 'Phiếu bài tập'}
        {...(html ? { srcDoc: html } : { src })}
        style={{ display: 'block', width: '100%', height: '100%', border: 0, background: 'var(--p-giay)' }}
      />
      {/* Nút thoát NHỎ, nổi góc trên phải. Không phải một dải chiếm hết bề
          ngang: dải đó chồng lên nhau khi mở phiếu từ trong báo cáo. */}
      <button
        type="button"
        onClick={dong}
        aria-label="Đóng"
        title="Đóng (Esc, hoặc vuốt quay lại)"
        style={{
          position: 'fixed',
          top: 'calc(10px + env(safe-area-inset-top))',
          right: 10,
          zIndex: 61,
          width: 34,
          height: 34,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(15,23,42,.55)',
          color: 'var(--p-trang)',
          cursor: 'pointer',
          WebkitBackdropFilter: 'blur(6px)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <X size={18} />
      </button>
    </div>,
    document.body,
  )
}
