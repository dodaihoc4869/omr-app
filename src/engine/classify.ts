// Quyết định EMPTY / WARN_ERASURE / ERR_DOUBLE_MARK / giá trị đã tô cho một
// nhóm bubble (ví dụ 4 lựa chọn A/B/C/D của một câu). Ngưỡng T_min và R lấy
// từ Cài đặt (xem engine/settings.ts) — cấm hard-code lại ở nơi khác.
import type { DarknessReading } from './sampling'
import type { GradedItem, ItemFlag } from './score'

export interface ClassifyThresholds {
  /** Ngưỡng độ tối tối thiểu để coi là có tô — mặc định 0,35 theo spec gốc. */
  tMin: number
  /** Tỷ số tương phản nền/mực tối thiểu — mặc định 2,2 theo spec gốc. */
  contrastR: number
  /** Biên an toàn phía trên T_min: trong khoảng [tMin, tMin+margin) vẫn nhận nhưng gắn cờ WARN_ERASURE. */
  warnMargin: number
  /** Biên dưới T_min mà vẫn có vết mờ đáng ngờ (tẩy dở) — gắn cờ thay vì lặng lẽ báo EMPTY. */
  erasureResidueMin: number
}

export const DEFAULT_THRESHOLDS: ClassifyThresholds = {
  tMin: 0.35,
  contrastR: 2.2,
  warnMargin: 0.08,
  erasureResidueMin: 0.15,
}

function isMarked(r: DarknessReading, th: ClassifyThresholds): boolean {
  return r.darkness >= th.tMin && r.contrast >= th.contrastR
}

/**
 * Phân loại một nhóm bubble loại trừ lẫn nhau (1 câu, N lựa chọn — chọn tối
 * đa 1). Dùng cho SBD, Mã đề, Phần I, mỗi ý của Phần II, mỗi cột của Phần III.
 */
export function classifyExclusiveGroup(
  readings: DarknessReading[],
  th: ClassifyThresholds = DEFAULT_THRESHOLDS,
): GradedItem<string> {
  const marked = readings.filter((r) => isMarked(r, th))

  if (marked.length === 0) {
    // Không có ô nào đạt ngưỡng — nhưng nếu có vết mờ đáng ngờ (tẩy dở), không
    // được lặng lẽ trả về EMPTY: phải cờ hoá để thầy tự kiểm tra ảnh phóng to.
    const residue = readings.find((r) => r.darkness >= th.erasureResidueMin)
    if (residue) {
      return { value: null, flag: 'WARN_ERASURE' }
    }
    return { value: null, flag: 'EMPTY' }
  }

  if (marked.length > 1) {
    return { value: null, flag: 'ERR_DOUBLE_MARK' }
  }

  const only = marked[0]
  if (only.darkness < th.tMin + th.warnMargin) {
    // Tô đạt ngưỡng nhưng rất sát biên — nhiều khả năng là vết tẩy chưa sạch
    // hẳn hoặc tô quá nhạt, vẫn nhận giá trị nhưng đẩy vào hàng duyệt.
    return { value: only.value, flag: 'WARN_ERASURE' as ItemFlag }
  }
  return { value: only.value, flag: null }
}
