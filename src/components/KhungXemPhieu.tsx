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
//
// TRÊN MÀN RỘNG chỉ phủ NỬA PHẢI, chừa thanh điều hướng bên trái (xem
// `.lop-xem-phieu` trong index.css). Phiếu co đúng theo bề rộng nửa phải, nên
// thầy vẫn đổi được màn khác mà không phải đóng phiếu; kéo hẹp/rộng cột trái
// là phiếu co theo ngay.
import { useEffect, useLayoutEffect, useState } from 'react'
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
  // ĐO THẲNG mép phải của thanh điều hướng, không trông vào CSS.
  //
  // Bản trước để CSS lo bằng `body:has(.ben-trai)`. Luật đó đúng và chạy được,
  // nhưng thầy vẫn gặp một chỗ phủ kín màn — mà đo bằng JS thì không còn chỗ
  // cho khác biệt: lấy đúng con số trình duyệt đang bố cục, mọi lối vào đều ra
  // một kết quả. Thanh trái ẩn (màn hẹp, hoặc màn làm bài không dựng thanh) thì
  // ra 0, tức phủ kín — đúng như mong muốn.
  const [meTrai, setMeTrai] = useState(0)
  useLayoutEffect(() => {
    const thanh = document.querySelector('.ben-trai') as HTMLElement | null
    const do_ = () => {
      if (!thanh || getComputedStyle(thanh).display === 'none') return setMeTrai(0)
      setMeTrai(Math.round(thanh.getBoundingClientRect().right))
    }
    do_()
    window.addEventListener('resize', do_)
    // Thầy kéo chỉnh bề rộng cột trong lúc đang mở phiếu thì phiếu co theo ngay.
    const theoDoi = thanh && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(do_) : null
    if (thanh && theoDoi) theoDoi.observe(thanh)
    return () => {
      window.removeEventListener('resize', do_)
      theoDoi?.disconnect()
    }
  }, [])

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
    <div className="lop-xem-phieu" role="dialog" aria-modal="true" aria-label={ten || 'Phiếu bài tập'} style={{ left: meTrai }}>
      <iframe
        title={ten || 'Phiếu bài tập'}
        {...(html ? { srcDoc: html } : { src })}
        style={{ display: 'block', width: '100%', height: '100%', border: 0, background: 'var(--p-giay)' }}
      />
      {/* Nút thoát NHỎ, nổi góc trên phải. Không phải một dải chiếm hết bề
          ngang: dải đó chồng lên nhau khi mở phiếu từ trong báo cáo. */}
      <button className="nut-dong-phieu" type="button" onClick={dong} aria-label="Đóng" title="Đóng (Esc, hoặc vuốt quay lại)">
        <X size={18} />
      </button>
    </div>,
    document.body,
  )
}
