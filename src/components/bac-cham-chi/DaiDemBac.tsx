// DẢI ĐẾM "SỐ EM MỖI BẬC" (thầy 13/10) — đầu danh sách Nhịp học của thầy + chú giải trên tờ chiếu điểm danh: 12 ô màu theo bậc, mỗi ô biểu tượng +
// "N em" (có đơn vị — khác chip bậc "biểu tượng + số bậc"). `coTen` (tờ chiếu, khổ rộng) ⇒ thêm tên bậc dưới số để cả lớp đọc được biểu tượng nào là bậc
// nào. Ô không có em nào ⇒ nền trơn, chữ mờ (vẫn đủ tương phản). Trình đọc màn hình nghe "3 em ở Bậc 1/12 · Lười Vô Cực". Chỉ để nhìn (không bấm).
import { BAC_CHAM_CHI, chuBac } from './bac'
import './bac-cham-chi.css'

export default function DaiDemBac({ dem, coTen = false }: { dem: readonly number[]; coTen?: boolean }) {
  return (
    <ol className="bcc-dem" data-co-ten={coTen ? '' : undefined} aria-label="Số em mỗi bậc, từ Lười đến Chăm">
      {BAC_CHAM_CHI.map((b, i) => {
        const n = dem[i] ?? 0
        return (
          <li key={b.so} className="bcc bcc-dem-o" data-bac={b.so} data-khong={n > 0 ? undefined : 'true'} title={`${chuBac(b)}: ${n} em`}>
            <span className="bcc-bt" aria-hidden="true">
              {b.bieuTuong}
            </span>
            <b>
              {n}
              <small> em</small>
            </b>
            {coTen && (
              <span className="bcc-dem-ten" aria-hidden="true">
                {b.ten}
              </span>
            )}
            <span className="sr-only"> ở {chuBac(b)}</span>
          </li>
        )
      })}
    </ol>
  )
}
