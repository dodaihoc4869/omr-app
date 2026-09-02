import { describe, it, expect } from 'vitest'
import {
  groupWordsIntoLines,
  filterContentLines,
  buildPositionedText,
  segmentImageQuestions,
  binarizeToTransparent,
  trimByAlpha,
  cropRaster,
  addTransparentMargin,
  stitchVertical,
  cleanupCrop,
  type WordBox,
  type RasterImage,
} from '../src/lib/exam-image-crop'

function w(text: string, page: number, x0: number, y0: number, x1: number, y1: number): WordBox {
  return { text, page, x0, y0, x1, y1 }
}

describe('groupWordsIntoLines', () => {
  it('gộp các từ cùng độ cao y thành 1 dòng, khác y thành dòng khác', () => {
    const words = [w('PHẦN', 1, 0, 0, 40, 12), w('I', 1, 45, 0, 55, 12), w('Câu', 1, 0, 20, 30, 32), w('1.', 1, 32, 20, 45, 32)]
    const lines = groupWordsIntoLines(words)
    expect(lines).toHaveLength(2)
    expect(lines[0].words.map((x) => x.text)).toEqual(['PHẦN', 'I'])
    expect(lines[1].words.map((x) => x.text)).toEqual(['Câu', '1.'])
  })

  it('không gộp 2 trang khác nhau vào cùng 1 dòng dù cùng toạ độ y', () => {
    const words = [w('a', 1, 0, 0, 10, 12), w('b', 2, 0, 0, 10, 12)]
    const lines = groupWordsIntoLines(words)
    expect(lines).toHaveLength(2)
    expect(lines[0].page).toBe(1)
    expect(lines[1].page).toBe(2)
  })
})

describe('filterContentLines', () => {
  it('loại dòng "Trang X/Y" ở gần đáy trang, giữ nguyên câu hỏi dù ở gần đỉnh/đáy', () => {
    const pageH = 1000
    const lines = groupWordsIntoLines([
      w('Trang', 1, 0, 970, 40, 985),
      w('1/4', 1, 45, 970, 70, 985),
      w('Câu', 1, 0, 900, 30, 915),
      w('18.', 1, 32, 900, 55, 915),
    ])
    const kept = filterContentLines(lines, pageH)
    const texts = kept.map((l) => l.words.map((x) => x.text).join(' '))
    expect(texts.some((t) => t.includes('Trang'))).toBe(false)
    expect(texts.some((t) => t.includes('Câu'))).toBe(true)
  })
})

describe('buildPositionedText + segmentImageQuestions', () => {
  it('định vị đúng vùng thân câu + 4 phương án cho 1 câu Phần I 1 trang', () => {
    const lines = groupWordsIntoLines([
      w('PHẦN', 1, 0, 0, 50, 14),
      w('I', 1, 55, 0, 65, 14),
      w('Câu', 1, 0, 30, 30, 44),
      w('1.', 1, 32, 30, 50, 44),
      w('Cho', 1, 55, 30, 80, 44),
      w('phản', 1, 85, 30, 115, 44),
      w('ứng', 1, 120, 30, 145, 44),
      w('A.', 1, 0, 60, 20, 74),
      w('chọn', 1, 25, 60, 55, 74),
      w('A', 1, 58, 60, 68, 74),
      w('B.', 1, 0, 90, 20, 104),
      w('chọn', 1, 25, 90, 55, 104),
      w('B', 1, 58, 90, 68, 104),
      w('C.', 1, 0, 120, 20, 134),
      w('chọn', 1, 25, 120, 55, 134),
      w('C', 1, 58, 120, 68, 134),
      w('D.', 1, 0, 150, 20, 164),
      w('chọn', 1, 25, 150, 55, 164),
      w('D', 1, 58, 150, 68, 164),
    ])
    const { text, refs } = buildPositionedText(lines)
    const qs = segmentImageQuestions(text, refs)
    expect(qs).toHaveLength(1)
    const q = qs[0]
    expect(q.phan).toBe('I')
    expect(q.so).toBe(1)
    expect(q.thanCauRegions).toHaveLength(1)
    // Vùng thân câu chỉ chứa "Cho phản ứng", không lấn sang mốc A.
    expect(q.thanCauRegions[0].x0).toBeCloseTo(55, 0)
    expect(q.paRegions).toHaveLength(4)
    expect(q.paRegions.map((p) => p.key)).toEqual(['A', 'B', 'C', 'D'])
    // Vùng phương án A chỉ chứa "chọn A", không lấn sang mốc B.
    expect(q.paRegions[0].regions[0].y0).toBeCloseTo(60, 0)
  })

  it('câu bị cắt ngang 2 trang -> vùng thân câu tách thành 2 rect theo từng trang', () => {
    const lines = groupWordsIntoLines([
      w('PHẦN', 1, 0, 0, 50, 14),
      w('I', 1, 55, 0, 65, 14),
      w('Câu', 1, 0, 900, 30, 914),
      w('2.', 1, 32, 900, 50, 914),
      w('Đầu', 1, 55, 900, 90, 914),
      w('câu', 2, 0, 0, 30, 14),
      w('A.', 2, 0, 30, 20, 44),
      w('x', 2, 25, 30, 35, 44),
      w('B.', 2, 0, 60, 20, 74),
      w('y', 2, 25, 60, 35, 74),
      w('C.', 2, 0, 90, 20, 104),
      w('z', 2, 25, 90, 35, 104),
      w('D.', 2, 0, 120, 20, 134),
      w('t', 2, 25, 120, 35, 134),
    ])
    const { text, refs } = buildPositionedText(lines)
    const qs = segmentImageQuestions(text, refs)
    expect(qs).toHaveLength(1)
    expect(qs[0].thanCauRegions.map((r) => r.page)).toEqual([1, 2])
  })

  it('Phần III không có mốc phương án -> cả câu là 1 vùng thân câu, không có paRegions', () => {
    const lines = groupWordsIntoLines([
      w('PHẦN', 1, 0, 0, 60, 14),
      w('III', 1, 65, 0, 85, 14),
      w('Câu', 1, 0, 30, 30, 44),
      w('1.', 1, 32, 30, 50, 44),
      w('Tính', 1, 55, 30, 85, 44),
      w('khối', 1, 90, 30, 120, 44),
      w('lượng', 1, 125, 30, 160, 44),
    ])
    const { text, refs } = buildPositionedText(lines)
    const qs = segmentImageQuestions(text, refs)
    expect(qs).toHaveLength(1)
    expect(qs[0].paRegions).toHaveLength(0)
    expect(qs[0].thanCauRegions).toHaveLength(1)
  })
})

function raster(w: number, h: number, fill: (x: number, y: number) => [number, number, number, number]): RasterImage {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = fill(x, y)
      const i = (y * w + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a
    }
  }
  return { width: w, height: h, data }
}

describe('binarizeToTransparent + trimByAlpha + cropRaster', () => {
  it('nền trắng -> trong suốt, chữ tối -> đen đục', () => {
    const img = raster(4, 4, (x) => (x === 1 || x === 2 ? [10, 10, 10, 255] : [255, 255, 255, 255]))
    const bin = binarizeToTransparent(img)
    expect(bin.data[(0 * 4 + 0) * 4 + 3]).toBe(0) // nền trong suốt
    expect(bin.data[(0 * 4 + 1) * 4 + 3]).toBe(255) // chữ đục
    expect(bin.data[(0 * 4 + 1) * 4]).toBe(0) // chữ màu đen
  })

  it('cắt sát viền theo alpha, bỏ khoảng trắng thừa quanh chữ', () => {
    const img = raster(6, 6, (x, y) => (x === 3 && y === 3 ? [0, 0, 0, 255] : [0, 0, 0, 0]))
    const bounds = trimByAlpha(img)
    expect(bounds).toEqual({ x0: 3, y0: 3, x1: 4, y1: 4 })
    const cropped = cropRaster(img, bounds)
    expect(cropped.width).toBe(1)
    expect(cropped.height).toBe(1)
    expect(cropped.data[3]).toBe(255)
  })

  it('ảnh trống hoàn toàn (không có gì để cắt) trả về nguyên khung, không vỡ pipeline', () => {
    const img = raster(5, 5, () => [0, 0, 0, 0])
    const bounds = trimByAlpha(img)
    expect(bounds).toEqual({ x0: 0, y0: 0, x1: 5, y1: 5 })
  })
})

describe('addTransparentMargin', () => {
  it('chừa đúng số px mép trong suốt quanh ảnh', () => {
    const img = raster(2, 2, () => [1, 2, 3, 255])
    const out = addTransparentMargin(img, 3)
    expect(out.width).toBe(8)
    expect(out.height).toBe(8)
    // Góc trên-trái vẫn trong suốt (thuộc phần mép mới thêm).
    expect(out.data[3]).toBe(0)
    // Điểm ảnh gốc dịch đúng 3px vào giữa.
    const centerIdx = (3 * 8 + 3) * 4
    expect(out.data[centerIdx + 3]).toBe(255)
  })
})

describe('stitchVertical', () => {
  it('ghép 2 ảnh theo chiều dọc, căn giữa ảnh hẹp hơn theo chiều ngang', () => {
    const a = raster(4, 2, () => [1, 1, 1, 255])
    const b = raster(2, 2, () => [2, 2, 2, 255])
    const out = stitchVertical(a, b, 0)
    expect(out.width).toBe(4)
    expect(out.height).toBe(4)
    // Ảnh b (hẹp hơn) được căn giữa: cột 0 của b nằm ở cột 1 của ảnh ghép.
    const rowBIdx = (2 * 4 + 1) * 4
    expect(out.data[rowBIdx]).toBe(2)
  })
})

describe('cleanupCrop', () => {
  it('nhị phân hoá + cắt sát viền + chừa mép cho ra ảnh gọn quanh đúng vùng chữ', () => {
    const img = raster(10, 10, (x, y) => (x >= 4 && x <= 5 && y >= 4 && y <= 5 ? [0, 0, 0, 255] : [255, 255, 255, 255]))
    const out = cleanupCrop(img, 2)
    // Vùng chữ 2x2 + mép 2px mỗi bên = 6x6.
    expect(out.width).toBe(6)
    expect(out.height).toBe(6)
  })
})
