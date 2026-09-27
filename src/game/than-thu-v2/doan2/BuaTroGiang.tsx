// ĐOÀN HỘ TỐNG · GAME HÓA 2.0 — dải "Bùa Trợ giảng" trên thẻ câu ôn (bản vẽ Moi-DoanTran): máy chủ đã chọn gợi ý M3 cho câu này.
// Gạch = các phương án SAI "cháy thành tro" (không bao giờ là đáp án); Cốt lõi = ô Kiến thức cốt lõi mở trước. Không bịa số lần sai.
import { ChemText } from '../../../lib/chem-format'
import type { GoiYM3 } from './kieu2'

/** Ngôi sao lấp lánh — biểu tượng tĩnh, luôn đi kèm chữ. */
const LAP_LANH = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z" /><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
  </svg>
)

export default function BuaTroGiang({ goiY }: { goiY: GoiYM3 }) {
  const soGach = goiY.gach?.length ?? 0
  return (
    <div className="dh2-bua" role="note" data-vung="bua-tro-giang">
      <i>{LAP_LANH}</i>
      <span>
        <b>Bùa Trợ giảng:</b>{' '}
        {soGach > 0 ? <>{soGach} phương án sai đã cháy thành tro.</>
          : <>Kiến thức cốt lõi của câu này — <ChemText text={goiY.cotLoi ?? ''} /></>}
        <small>Câu có bùa chưa tính Thành thạo.</small>
      </span>
    </div>
  )
}
