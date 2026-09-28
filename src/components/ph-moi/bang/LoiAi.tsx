// Khối "Lời Thầy Đỗ Đại Học gửi anh/chị" của bảng "Mọi thứ về con" kiểu Apple (mẫu docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html #muc-loi): thẻ "Anh/chị có thể làm gì".
// CHỈ dùng chữ máy chủ gửi (`phuHuynhLamGi`) — không tự bịa câu nào. Thư của Bộ não A.I đã GỠ cùng chức năng (thầy lệnh 28/09/2026); nhãn ký tên đổi thành "Thầy Đỗ Đại Học".
import type { PhMoi } from '../../../lib/ph-moi/du-lieu'

export function coLoiAi(pm: PhMoi): boolean {
  return (pm.phuHuynhLamGi ?? []).length > 0
}

export function LoiAi({ pm }: { pm: PhMoi }) {
  if (!coLoiAi(pm)) return null
  const goiY = (pm.phuHuynhLamGi ?? []).slice(0, 2)
  return (
    <section className="phm-muc" id="muc-loi" aria-label="Lời Thầy Đỗ Đại Học gửi anh/chị">
      <header className="phm-muc__dau">
        <h2>Lời Thầy Đỗ Đại Học gửi anh/chị</h2>
      </header>
      <div className="phm-the phm-the--dem">
        <p className="phm-nhan-muc">Anh/chị có thể làm gì</p>
        <ol className="phm-goi-y">
          {goiY.map((g, i) => (
            <li key={i}>
              <i aria-hidden="true">{i + 1}</i>
              <span>{g}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
