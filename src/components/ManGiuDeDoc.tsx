// TẤM PHỦ "GIỮ ĐỂ ĐỌC" — GIUDEDOC.md mục 2.3.
//
// LUÔN Ở TRONG DOM, ẩn/hiện bằng ĐÚNG MỘT thuộc tính trên thẻ <html>
// (`data-giu-de-an`), không bằng state React. Lý do nằm ở mục 5 của đặc tả:
// bật cơ chế này không được làm tụt tốc độ cuộn, và cấm render lại danh sách
// câu. Một `setState` mỗi lần nhả tay là render lại cả màn thi 28 câu.
//
// Phủ từ dưới thanh trên xuống, KHÔNG phủ cả màn:
//   · thanh trên vẫn hiện — em phải biết còn bao nhiêu thời gian ngay cả lúc
//     đề đang tắt;
//   · vân tay bốn góc nằm ở lớp cao hơn nên vẫn in đè lên tấm phủ — ảnh chụp
//     lúc đề tắt vẫn truy được ra em nào.
//
// Nhận chạm (`pointer-events: auto`): chạm đầu tiên chỉ để mở lại đề, không
// lọt xuống nút đáp án bên dưới.
import { Hand } from 'lucide-react'
import { CHU_TAM_PHU } from '../lib/giu-de-doc'

/** Chiều cao thanh trên màn thi — cùng con số dải cảnh báo rời màn đang dùng. */
export const CAO_THANH_TREN = 56

export default function ManGiuDeDoc() {
  return (
    <div
      data-giu-de-phu
      aria-hidden="true"
      className="flex flex-col items-center justify-center text-center"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        top: CAO_THANH_TREN,
        bottom: 0,
        zIndex: 'var(--z-giu-de)' as unknown as number,
        background: 'var(--nen)',
        color: 'var(--muc)',
        gap: 'var(--k4)',
        padding: 'var(--k6)',
        touchAction: 'none',
      }}
    >
      <Hand size={40} style={{ color: 'var(--mo)' }} />
      <div className="font-bold" style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-3)' }}>
        {CHU_TAM_PHU}
      </div>
    </div>
  )
}
