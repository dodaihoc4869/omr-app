// DẢI ĐẾM "SỐ EM MỖI BẬC" (thầy 13/10) — đầu danh sách Nhịp học của thầy + chú giải trên tờ chiếu điểm danh: 12 ô màu theo bậc, mỗi ô huy hiệu +
// "N em" (có đơn vị — khác chip bậc "huy hiệu + số bậc"). `coTen` (tờ chiếu, khổ rộng) ⇒ thêm tên bậc dưới số để cả lớp đọc được huy hiệu nào là bậc
// nào. Ô không có em nào ⇒ nền trơn, chữ mờ (vẫn đủ tương phản). Trình đọc màn hình nghe "3 em ở Bậc 1/12 · Lười Vô Cực".
// 13/10 đợt 19: emoji ⇒ huy hiệu vẽ riêng. Có `onChon` (Nhịp học của thầy — thầy: "bấm vào từng bậc sẽ hiện ra danh sách … từng học sinh") ⇒ ô CÓ em
// là MỘT nút cả ô (≥ 44 px) báo bậc + chính nút ấy (để trả tiêu điểm khi đóng tấm); ô 0 em không bấm được. Tờ chiếu không truyền ⇒ chỉ để nhìn.
import { BAC_CHAM_CHI, chuBac } from './bac'
import HuyHieuBac from './HuyHieuBac'
import './bac-cham-chi.css'

export default function DaiDemBac({ dem, coTen = false, onChon }: { dem: readonly number[]; coTen?: boolean; onChon?: (bac: number, nut: HTMLButtonElement) => void }) {
  return (
    <ol className="bcc-dem" data-co-ten={coTen ? '' : undefined} aria-label="Số em mỗi bậc, từ Lười đến Chăm">
      {BAC_CHAM_CHI.map((b, i) => {
        const n = dem[i] ?? 0
        const bam = !!onChon && n > 0
        const noiDung = (
          <>
            <HuyHieuBac bac={b.so} co={28} className="bcc-bt" />
            <b>
              {n}
              <small> em</small>
            </b>
            {coTen && (
              <span className="bcc-dem-ten" aria-hidden="true">
                {b.ten}
              </span>
            )}
            <span className="sr-only">
              {' '}
              ở {chuBac(b)}
              {bam ? ' — xem danh sách em' : ''}
            </span>
          </>
        )
        return (
          <li key={b.so} className="bcc bcc-dem-o" data-bac={b.so} data-khong={n > 0 ? undefined : 'true'} data-nut={bam ? '' : undefined} title={`${chuBac(b)}: ${n} em`}>
            {bam ? (
              <button type="button" className="bcc-dem-nut" aria-haspopup="dialog" onClick={(ev) => onChon!(b.so, ev.currentTarget)}>
                {noiDung}
              </button>
            ) : (
              noiDung
            )}
          </li>
        )
      })}
    </ol>
  )
}
