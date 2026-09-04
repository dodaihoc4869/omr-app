// ĐƯA PHIẾU RA KHỎI APP: MỞ THẺ MỚI, IN, TẢI TỆP.
//
// Việc dựng chuỗi HTML nằm trọn ở `html-phieu.ts` (thuần chuỗi, test được
// không cần trình duyệt). File này chỉ lo phần phải có trình duyệt mới làm
// được: mở blob, gọi hộp in, tải tệp.
//
// ĐÃ BỎ HAI THỨ, cùng lý do:
//   · XUẤT PDF BẰNG CHỤP ẢNH (thầy chốt 04-09 tối): chữ thành ảnh nên KHÔNG
//     NÉT, không bôi đen chọn được, tệp nặng, chụp lệch nửa pixel là ô lệch
//     theo. Nay muốn PDF thì mở phiếu rồi bấm In → "Lưu thành PDF": bản đó là
//     chữ vector, nét hơn hẳn.
//   · CẮT TRANG A4 BẰNG CÁCH ĐO TRONG IFRAME: phiếu nay là trang web co theo
//     máy, không còn khổ giấy cứng, nên không phải đo gì. Bỏ luôn được cả
//     iframe ẩn lẫn vòng chờ ảnh tải.
import type { CauLuyen } from './bai-tap-pdf'
import { dungPhieu, type ThongTinPhieu } from './html-phieu'

/** Dựng trọn tài liệu HTML của phiếu. Giữ tên cũ vì bốn màn đang gọi; nay là
 * hàm THUẦN, trả thẳng chuỗi. */
export function dungPhieuHtml(t: ThongTinPhieu, cau: CauLuyen[]): string {
  return dungPhieu(t, cau)
}

/** Mở hộp in của trình duyệt để thầy chọn "Lưu thành PDF" — bản CHỮ NÉT, chọn
 * và tìm kiếm được, tệp nhỏ. Bản in tự mở sẵn mọi lời giải (xem @media print
 * trong `html-phieu.ts`) vì trên giấy không bấm được. */
export function inPhieu(html: string): void {
  const f = document.createElement('iframe')
  // Để NGOÀI màn hình chứ không `display:none`: ẩn hẳn thì trình duyệt không
  // bố cục, in ra trang trắng.
  f.setAttribute('aria-hidden', 'true')
  f.style.position = 'fixed'
  f.style.left = '-10000px'
  f.style.top = '0'
  f.style.width = '794px'
  f.style.height = '1123px'
  f.style.border = '0'
  document.body.appendChild(f)
  const d = f.contentDocument
  if (!d) {
    f.remove()
    return
  }
  d.open()
  d.write(html)
  d.close()
  setTimeout(() => {
    try {
      f.contentWindow?.focus()
      f.contentWindow?.print()
    } finally {
      setTimeout(() => f.remove(), 60000)
    }
  }, 300)
}

/** Mở phiếu ra một thẻ mới để xem và in. Dùng blob URL nên KHÔNG cần máy chủ,
 * mở được cả khi mất mạng. Thẻ mới bị chặn (trình duyệt di động chặn cửa sổ tự
 * mở) thì thay bằng tải về đúng tệp HTML đó — vẫn mở được bằng một chạm. */
export function moHtml(html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'noopener')
  if (!w) {
    taiTep(blob, 'phieu.html')
    URL.revokeObjectURL(url)
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

export function taiTep(blob: Blob, ten: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = ten
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
