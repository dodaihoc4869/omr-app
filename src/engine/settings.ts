// Một nguồn sự thật cho mọi ngưỡng cấu hình — màn Cài đặt đọc/ghi đúng object
// này (IndexedDB), không hard-code T_min/R/mask/kích thước ở bất kỳ đâu khác.
import { DEFAULT_THRESHOLDS, type ClassifyThresholds } from './classify'
import { template } from './template'

export interface AppSettings {
  thresholds: ClassifyThresholds
  /** Mask tròn phủ 80–85% đường kính bubble khi lấy mẫu mức xám. */
  maskFraction: number
  /** Kích thước khung chuẩn sau homography — khớp template2025.json. */
  targetWidthPx: number
  targetHeightPx: number
  /** Ngưỡng phương sai Laplacian tối thiểu để coi ảnh đủ nét trước khi tự chụp. */
  sharpnessMin: number
  /** Tỷ lệ pixel cháy sáng (>250) tối đa cho phép trên vùng giấy trước khi từ chối chụp. */
  overexposureMaxRatio: number
  /** Số mili-giây phải giữ đủ 4 anchor ổn định liên tục trước khi tự chụp. */
  stableMsBeforeCapture: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  thresholds: DEFAULT_THRESHOLDS,
  maskFraction: 0.825, // giữa 80% và 85% theo spec
  targetWidthPx: template.page.width_px,
  targetHeightPx: template.page.height_px,
  sharpnessMin: 60,
  overexposureMaxRatio: 0.15,
  stableMsBeforeCapture: 500,
}

const STORAGE_KEY = 'omr.settings.v1'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
