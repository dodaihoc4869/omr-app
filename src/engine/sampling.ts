// Đọc mức xám trung bình trong vùng mask tròn của một bubble, và vùng nền
// giấy trắng lân cận để hiệu chỉnh bóng đổ cục bộ. Thuần TypeScript, không
// phụ thuộc OpenCV — nhận vào một buffer mức xám (0 = đen, 255 = trắng) đã
// warp về khung chuẩn 1654×2339, để có thể unit test độc lập với WASM.

export interface GrayImage {
  data: Uint8ClampedArray // 1 kênh, độ dài = width*height
  width: number
  height: number
}

/** Mean mức xám trong hình tròn bán kính rPx quanh (cx,cy), giới hạn theo maskFraction. */
export function circleMean(img: GrayImage, cx: number, cy: number, rPx: number, maskFraction: number): number {
  const r = rPx * maskFraction
  const r2 = r * r
  let sum = 0
  let count = 0
  const minX = Math.max(0, Math.floor(cx - r))
  const maxX = Math.min(img.width - 1, Math.ceil(cx + r))
  const minY = Math.max(0, Math.floor(cy - r))
  const maxY = Math.min(img.height - 1, Math.ceil(cy + r))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r2) {
        sum += img.data[y * img.width + x]
        count++
      }
    }
  }
  if (count === 0) return 255
  return sum / count
}

/**
 * Mean mức xám của vùng giấy trắng lân cận (ring ngoài bubble, cùng hàng),
 * dùng làm nền tham chiếu để hiệu chỉnh bóng đổ cục bộ thay vì dùng một
 * ngưỡng tuyệt đối cho cả trang.
 */
export function localBackgroundMean(img: GrayImage, cx: number, cy: number, rPx: number): number {
  // Lấy vành khuyên cách tâm bubble 2.2–3.2 lần bán kính — đủ xa để không dính mực
  // của bubble kế bên trong lưới thông thường, đủ gần để phản ánh đúng ánh sáng cục bộ.
  const rInner = rPx * 2.2
  const rOuter = rPx * 3.2
  const rInner2 = rInner * rInner
  const rOuter2 = rOuter * rOuter
  let sum = 0
  let count = 0
  const minX = Math.max(0, Math.floor(cx - rOuter))
  const maxX = Math.min(img.width - 1, Math.ceil(cx + rOuter))
  const minY = Math.max(0, Math.floor(cy - rOuter))
  const maxY = Math.min(img.height - 1, Math.ceil(cy + rOuter))
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - cx
      const dy = y - cy
      const d2 = dx * dx + dy * dy
      if (d2 >= rInner2 && d2 <= rOuter2) {
        const v = img.data[y * img.width + x]
        // Bỏ pixel quá tối (khả năng dính mực bubble khác) khỏi tham chiếu nền trắng.
        if (v > 140) {
          sum += v
          count++
        }
      }
    }
  }
  if (count === 0) return 255
  return sum / count
}

export interface DarknessReading {
  value: string
  bubbleMean: number
  bgMean: number
  /** Độ tối tương đối so với nền: (bg - bubble) / bg. Ngưỡng đánh dấu = T_min. */
  darkness: number
  /** Tỷ số tương phản nền/mực: bg / bubble. Ngưỡng đánh dấu = R. */
  contrast: number
}

export function readBubble(
  img: GrayImage,
  cx: number,
  cy: number,
  rPx: number,
  value: string,
  maskFraction: number,
): DarknessReading {
  const bubbleMean = circleMean(img, cx, cy, rPx, maskFraction)
  const bgMean = localBackgroundMean(img, cx, cy, rPx)
  const darkness = bgMean > 0 ? (bgMean - bubbleMean) / bgMean : 0
  const contrast = bubbleMean > 0 ? bgMean / bubbleMean : 0
  return { value, bubbleMean, bgMean, darkness, contrast }
}
