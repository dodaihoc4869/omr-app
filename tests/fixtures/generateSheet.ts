// Sinh ảnh mức xám tổng hợp (đã coi như đã qua homography, đúng khung chuẩn
// 1654×2339) để test Module 2+3 (mask + threshold + phân loại) độc lập với
// OpenCV/WASM — phần Module 1 (anchor + homography) dùng thư viện OpenCV.js
// đã được cộng đồng kiểm chứng rộng rãi, không unit-test lại ở đây; phần rủi
// ro cao nhất là logic ngưỡng T_min/R/mask tự viết, nên test tập trung ở đó.
import { mmToPx, template, type Bubble } from '../../src/engine/template'
import type { GrayImage } from '../../src/engine/sampling'

export interface FillSpec {
  bubbleId: string
  /** 0 = tô đậm hết mức, 1 = trắng hoàn toàn. 0.55–0.7 mô phỏng vết tẩy mờ. */
  darkFactor: number
}

export interface GenerateOptions {
  brightnessScale?: number // 1 = giữ nguyên, 0.6 = giảm sáng 40%
  shadowLeftDarken?: number // 0..1, độ tối thêm tuyến tính từ phải sang trái mô phỏng bóng đổ
}

function paintCircle(img: GrayImage, cx: number, cy: number, rPx: number, gray: number) {
  const r2 = rPx * rPx
  const minX = Math.max(0, Math.floor(cx - rPx))
  const maxX = Math.min(img.width - 1, Math.ceil(cx + rPx))
  const minY = Math.max(0, Math.floor(cy - rPx))
  const maxY = Math.min(img.height - 1, Math.ceil(cy + rPx))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) {
        img.data[y * img.width + x] = gray
      }
    }
  }
}

export function generateSheet(fills: FillSpec[], byId: Map<string, Bubble>, opts: GenerateOptions = {}): GrayImage {
  const width = template.page.width_px
  const height = template.page.height_px
  const data = new Uint8ClampedArray(width * height).fill(255)
  const img: GrayImage = { data, width, height }

  const rPx = mmToPx(template.bubble_diameter_mm) / 2

  for (const f of fills) {
    const b = byId.get(f.bubbleId)
    if (!b) throw new Error(`Không tìm thấy bubble id ${f.bubbleId} trong template`)
    const gray = Math.round(255 * f.darkFactor)
    paintCircle(img, mmToPx(b.x_mm), mmToPx(b.y_mm), rPx * 0.9, gray)
  }

  if (opts.shadowLeftDarken) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = 1 - x / width // 1 ở mép trái, 0 ở mép phải
        const factor = 1 - opts.shadowLeftDarken * t
        const i = y * width + x
        data[i] = Math.round(data[i] * factor)
      }
    }
  }

  if (opts.brightnessScale && opts.brightnessScale !== 1) {
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.round(data[i] * opts.brightnessScale)
    }
  }

  return img
}

export function bubbleIndex(bubbles: Bubble[]): Map<string, Bubble> {
  const m = new Map<string, Bubble>()
  for (const b of bubbles) m.set(b.id, b)
  return m
}
