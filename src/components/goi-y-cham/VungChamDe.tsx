// KHE CẮM «CHẠM ĐỂ HIỆN GIẢI THÍCH + TÔ MÀU GỢI Ý» (kiểu Duolingo) — phiên Code app 3 đang thiết kế, CHỜ THẦY DUYỆT. Đây chỉ là khe sẵn:
//   • <VungChamDe q onGiaiThich>{đề như hiện nay}</VungChamDe> bọc thân đề ở màn làm chặng (ManLamBaiTap, nhánh Duo). Bản này trả lại children
//     nguyên vẹn (không thêm thẻ DOM ⇒ bố cục dọc / ngang / máy tính không đổi).
//   • <TamGiaiThich> = chỗ đặt tấm giải thích: cùng kiểu tấm trượt từ đáy với tấm kết quả (duo-day duo-ket, data-tt="giai"), thế chỗ thanh đáy khi mở,
//     đóng ⇒ thanh đáy cũ trở lại.
// Phần ruột thật (dò từ/đơn vị được chạm, tô màu, nội dung giải thích) sẽ thay trong thư mục này và PHẢI nạp lười (import() khi em chạm lần đầu) —
// tệp này nằm trong mảnh lười của màn làm bài, không vào nhóm mở app. Đáp án không xuống máy trước khi nộp: giải thích chỉ được dùng dữ liệu có sẵn TRƯỚC khi nộp.
import type { ReactNode } from 'react'
import { X as XIcon } from 'lucide-react'
import type { Question } from '../../game/than-thu-v2/core'

/** Một tấm giải thích khi em chạm vào một chỗ trong đề. */
export interface GiaiThichCham { tieuDe: string; noiDung: ReactNode }

export interface PropsVungChamDe {
  q: Question
  /** Gọi khi em chạm một chỗ có giải thích (null = đóng). Màn làm chặng giữ trạng thái và vẽ <TamGiaiThich>. */
  onGiaiThich?: (g: GiaiThichCham | null) => void
  children: ReactNode
}

/** Bản hiện tại: chưa có hành vi chạm — trả lại đề y nguyên. */
export function VungChamDe({ children }: PropsVungChamDe) {
  return <>{children}</>
}

/** Tấm giải thích trượt từ đáy (cùng kiểu tấm kết quả). */
export function TamGiaiThich({ g, onDong }: { g: GiaiThichCham; onDong: () => void }) {
  return <section className="duo-day duo-ket" data-tt="giai" role="dialog" aria-label={g.tieuDe}><div className="duo-giua">
    <div className="duo-kq">
      <div className="duo-kq-chu"><h2>{g.tieuDe}</h2><div className="duo-mo">{g.noiDung}</div></div>
      <button type="button" className="duo-dong" aria-label="Đóng giải thích" onClick={onDong}><XIcon size={24} aria-hidden="true" /></button>
    </div>
  </div></section>
}

export default VungChamDe
