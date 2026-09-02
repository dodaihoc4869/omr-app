// Cổng chất lượng chạy TRƯỚC khi nhả chụp: đủ 4 anchor + đủ nét + không cháy
// sáng. Không đạt thì giữ khung chờ, không tự chụp — luồng zero-tap không có
// bước "chụp lại thủ công".
import type { GrayImage } from './sampling'

export interface QualityResult {
  sharpness: number
  overexposureRatio: number
  sharpOk: boolean
  exposureOk: boolean
  passed: boolean
}

/** Phương sai của toán tử Laplacian — ảnh càng nét, phương sai càng cao. */
export function laplacianVariance(img: GrayImage): number {
  const { data, width, height } = img
  if (width < 3 || height < 3) return 0
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const lap =
        4 * data[i] - data[i - 1] - data[i + 1] - data[i - width] - data[i + width]
      sum += lap
      sumSq += lap * lap
      n++
    }
  }
  if (n === 0) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

/** Tỷ lệ pixel cháy sáng (>250) trong toàn ảnh — báo hiệu loá đèn/nắng gắt. */
export function overexposureRatio(img: GrayImage): number {
  let over = 0
  for (let i = 0; i < img.data.length; i++) {
    if (img.data[i] > 250) over++
  }
  return img.data.length > 0 ? over / img.data.length : 0
}

export function checkQuality(
  img: GrayImage,
  sharpnessMin: number,
  overexposureMaxRatio: number,
): QualityResult {
  const sharpness = laplacianVariance(img)
  const expRatio = overexposureRatio(img)
  const sharpOk = sharpness >= sharpnessMin
  const exposureOk = expRatio <= overexposureMaxRatio
  return { sharpness, overexposureRatio: expRatio, sharpOk, exposureOk, passed: sharpOk && exposureOk }
}
