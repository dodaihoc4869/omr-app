// CHIP BẬC — 12 bậc từ Lười đến Chăm (thầy 13/10). Dùng chung 3 app: biểu tượng + "Bậc N/12 · Tên", màu riêng từng bậc (bac-cham-chi.css).
//   · Bản thường: chữ đầy đủ (trình đọc màn hình đọc đúng chữ ấy; biểu tượng ẩn khỏi cây truy cập).
//   · Bản `nho` (dòng em ở Nhịp học của thầy): chỉ biểu tượng + số bậc; tên đầy đủ trong title + aria-label.
// Số bậc không hợp lệ ⇒ không vẽ gì (không bịa).
import { chuBac, motBac } from './bac'
import './bac-cham-chi.css'

export default function ChipBac({ bac, nho = false }: { bac: number; nho?: boolean }) {
  const b = motBac(bac)
  if (!b) return null
  const chu = chuBac(b)
  if (nho)
    return (
      <span className="bcc bcc-chip" data-bac={b.so} data-nho="" role="img" aria-label={chu} title={chu}>
        <span className="bcc-bt" aria-hidden="true">
          {b.bieuTuong}
        </span>
        {b.so}
      </span>
    )
  return (
    <span className="bcc bcc-chip" data-bac={b.so}>
      <span className="bcc-bt" aria-hidden="true">
        {b.bieuTuong}
      </span>
      {chu}
    </span>
  )
}
