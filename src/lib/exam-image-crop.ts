// Cắt đề PDF thành ẢNH riêng từng câu/phương án thay vì hiển thị lại bằng
// chữ trích ra. LÝ DO: lớp chữ PDF hay vỡ công thức Hoá, và vỡ ÂM THẦM —
// "80% FeS2" có thể bị trích lệch thành "280% FeS" mà vẫn trông hợp lý, học
// sinh và cả thầy đều khó phát hiện nếu chỉ nhìn chữ. Ảnh cắt thẳng từ trang
// gốc không có rủi ro này.
//
// NGUYÊN TẮC: lớp chữ (toạ độ từ pdf.js) CHỈ dùng để ĐỊNH VỊ vùng cắt + lưu
// ẩn phục vụ tìm kiếm/gắn nhãn — KHÔNG dùng để hiển thị cho học sinh.
//
// Cách định vị: dùng LẠI nguyên các mốc regex đã có (CAU_RE/PHAN_RE/
// optionMarkerRe trong exam-question-split.ts) — nhưng chạy trên một chuỗi
// "chữ có gắn toạ độ" (mỗi từ biết chính xác nó nằm ở đâu trên trang) thay vì
// chuỗi chữ thuần. Nhờ vậy 2 bộ tách (bằng chữ và bằng ảnh) LUÔN khớp nhau —
// không có 2 quy tắc tách câu lệch nhau theo thời gian.
import * as pdfjsLib from 'pdfjs-dist'
import { CAU_RE, PHAN_RE, optionMarkerRe, KEYS } from './exam-question-split'

export interface WordBox {
  text: string
  page: number // 1-based
  x0: number
  y0: number // px, gốc (0,0) ở mép TRÊN-TRÁI trang — cùng hệ toạ độ với canvas đã render trang đó
  x1: number
  y1: number
}

export interface Line {
  page: number
  y0: number
  y1: number
  words: WordBox[]
}

/** Gộp các "word" rời rạc (pdf.js trả theo từng mảnh chữ, không phải theo
 * dòng) thành từng DÒNG dựa vào toạ độ y thực tế — không dựa vào cờ hasEOL
 * của lớp chữ vì cờ đó có thể sai với PDF trình bày lạ. Không bao giờ gộp 2
 * trang khác nhau vào cùng 1 dòng. */
export function groupWordsIntoLines(words: WordBox[]): Line[] {
  const byPage = new Map<number, WordBox[]>()
  for (const w of words) {
    if (!byPage.has(w.page)) byPage.set(w.page, [])
    byPage.get(w.page)!.push(w)
  }
  const lines: Line[] = []
  const pages = [...byPage.keys()].sort((a, b) => a - b)
  for (const page of pages) {
    const sorted = [...byPage.get(page)!].sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
    for (const w of sorted) {
      const h = Math.max(w.y1 - w.y0, 1)
      const cy = (w.y0 + w.y1) / 2
      const last = lines[lines.length - 1]
      if (last && last.page === page && Math.abs((last.y0 + last.y1) / 2 - cy) <= h * 0.6) {
        last.words.push(w)
        last.y0 = Math.min(last.y0, w.y0)
        last.y1 = Math.max(last.y1, w.y1)
      } else {
        lines.push({ page, y0: w.y0, y1: w.y1, words: [w] })
      }
    }
  }
  for (const l of lines) {
    l.words.sort((a, b) => a.x0 - b.x0)
    // Chừa biên phải mỗi từ KHÔNG được lấn sang từ kế tiếp cùng dòng — công
    // thức quy đổi bề rộng chữ từ pdf.js chỉ là XẤP XỈ, có thể hơi rộng hơn
    // thật. Không kẹp lại thì khi nhiều phương án nằm CHUNG 1 dòng (vd "A.
    // (a) và (c).   B. (a) và (d).   C. ...   D. ..."), vùng cắt của A sẽ
    // "tràn" chụp luôn cả B/C/D phía sau — cắt ảnh phương án dính nhau đúng
    // điều cấm kỵ nhất của yêu cầu này.
    for (let j = 0; j < l.words.length - 1; j++) {
      if (l.words[j].x1 > l.words[j + 1].x0) l.words[j].x1 = l.words[j + 1].x0
    }
  }
  return lines
}

const HEADER_FOOTER_LINE_RE = [
  /^\s*Trang\s+\d+\s*\/\s*\d+/i,
  /^\s*M[aã]\s*đ[ềe]\s*(?:thi)?\s*:?\s*\d+\s*$/i,
  /^\s*Họ,?\s*t[êe]n\s*th[íi]\s*sinh/i,
  /^\s*S[ốo]\s*b[áa]o\s*danh/i,
]

function lineText(line: Line): string {
  return line.words.map((w) => w.text).join(' ')
}

/** Loại DÒNG đầu trang/chân trang (số trang, mã đề lặp lại, khung họ tên/SBD)
 * — chỉ xét dải 15% trên/dưới mỗi trang KẾT HỢP nội dung khớp mẫu, để không
 * lỡ loại một câu hỏi nào đó tình cờ có chữ "Trang" giữa bài. */
export function filterContentLines(lines: Line[], pageHeightPx: number): Line[] {
  const topBand = pageHeightPx * 0.15
  const bottomBand = pageHeightPx * 0.85
  return lines.filter((l) => {
    const nearEdge = l.y0 < topBand || l.y1 > bottomBand
    if (!nearEdge) return true
    return !HEADER_FOOTER_LINE_RE.some((re) => re.test(lineText(l)))
  })
}

interface WordRef {
  word: WordBox
  start: number
  end: number
}

/** Ghép TOÀN BỘ dòng nội dung (đã lọc đầu/chân trang) thành 1 chuỗi duy nhất
 * — giữ đúng ranh giới dòng (\n) và trang (\n\n) như pageItemsToText() để
 * CAU_RE/PHAN_RE (đều neo `^` theo dòng) hoạt động y hệt bộ tách bằng chữ.
 * Trả kèm bảng "offset trong chuỗi -> word gốc" để sau khi regex tìm được vị
 * trí mốc, suy ra đúng toạ độ pixel cần cắt. */
export function buildPositionedText(linesByDoc: Line[]): { text: string; refs: WordRef[] } {
  let text = ''
  const refs: WordRef[] = []
  let prevPage: number | null = null
  for (const line of linesByDoc) {
    if (prevPage === null) {
      // dòng đầu tiên
    } else if (line.page !== prevPage) {
      text += '\n\n'
    } else {
      text += '\n'
    }
    prevPage = line.page
    for (let i = 0; i < line.words.length; i++) {
      const w = line.words[i]
      if (i > 0) text += ' '
      const start = text.length
      text += w.text
      refs.push({ word: w, start, end: text.length })
    }
  }
  return { text, refs }
}

function wordRefsInRange(refs: WordRef[], start: number, end: number): WordBox[] {
  return refs.filter((r) => r.end > start && r.start < end).map((r) => r.word)
}

function bboxOfWords(words: WordBox[]): { x0: number; y0: number; x1: number; y1: number } | null {
  if (words.length === 0) return null
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const w of words) {
    x0 = Math.min(x0, w.x0)
    y0 = Math.min(y0, w.y0)
    x1 = Math.max(x1, w.x1)
    y1 = Math.max(y1, w.y1)
  }
  return { x0, y0, x1, y1 }
}

export interface CropRegion {
  page: number
  x0: number
  y0: number
  x1: number
  y1: number
}

/** 1 vùng chữ có thể trải trên NHIỀU trang (câu bị cắt ngang trang) -> tách
 * theo trang, mỗi trang 1 rect riêng, để ghép ảnh dọc sau khi cắt từng trang. */
function regionsPerPage(words: WordBox[]): CropRegion[] {
  const byPage = new Map<number, WordBox[]>()
  for (const w of words) {
    if (!byPage.has(w.page)) byPage.set(w.page, [])
    byPage.get(w.page)!.push(w)
  }
  const out: CropRegion[] = []
  for (const [page, ws] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
    const bb = bboxOfWords(ws)
    if (bb) out.push({ page, ...bb })
  }
  return out
}

export interface ImageQuestion {
  phan: 'I' | 'II' | 'III'
  so: number
  thanCauRegions: CropRegion[]
  /** rỗng nếu không tìm đủ 4 mốc phương án hợp lệ (Phần III, hoặc trích lỗi) */
  paRegions: { key: 'A' | 'B' | 'C' | 'D'; regions: CropRegion[] }[]
}

/** Dùng LẠI nguyên mốc regex của bộ tách bằng chữ, chạy trên chuỗi có gắn
 * toạ độ, để suy ra vùng ẢNH cần cắt cho từng câu/phương án. */
export function segmentImageQuestions(text: string, refs: WordRef[]): ImageQuestion[] {
  const phanRe = new RegExp(PHAN_RE.source, PHAN_RE.flags)
  const phanMarkers: { index: number; ten: 'I' | 'II' | 'III' }[] = []
  let m: RegExpExecArray | null
  while ((m = phanRe.exec(text))) {
    const ten = m[1].toUpperCase()
    if (ten === 'I' || ten === 'II' || ten === 'III') phanMarkers.push({ index: m.index, ten })
  }
  if (phanMarkers.length === 0) return []

  const out: ImageQuestion[] = []
  for (let i = 0; i < phanMarkers.length; i++) {
    const ten = phanMarkers[i].ten
    const blockStart = phanMarkers[i].index
    const blockEnd = i + 1 < phanMarkers.length ? phanMarkers[i + 1].index : text.length

    const cauRe = new RegExp(CAU_RE.source, CAU_RE.flags)
    const cauMarkers: { index: number; markerEnd: number; so: number }[] = []
    cauRe.lastIndex = blockStart
    while ((m = cauRe.exec(text)) && m.index < blockEnd) {
      cauMarkers.push({ index: m.index, markerEnd: m.index + m[0].length, so: parseInt(m[1], 10) })
    }

    for (let j = 0; j < cauMarkers.length; j++) {
      const from = cauMarkers[j].markerEnd
      const realTo = j + 1 < cauMarkers.length ? cauMarkers[j + 1].index : blockEnd

      const optRe = ten !== 'III' ? optionMarkerRe(ten) : null
      const paMarkers: { index: number; markerEnd: number; key: 'A' | 'B' | 'C' | 'D' }[] = []
      if (optRe) {
        optRe.lastIndex = from
        let expectIdx = 0
        let mm: RegExpExecArray | null
        while ((mm = optRe.exec(text)) && mm.index < realTo) {
          if (mm[1].toUpperCase() === KEYS[expectIdx]) {
            paMarkers.push({ index: mm.index, markerEnd: mm.index + mm[0].length, key: KEYS[expectIdx] })
            expectIdx += 1
            if (expectIdx >= KEYS.length) break
          }
        }
      }

      const thanCauEnd = paMarkers.length >= 2 ? paMarkers[0].index : realTo
      const thanCauWords = wordRefsInRange(refs, from, thanCauEnd)
      const paRegions: { key: 'A' | 'B' | 'C' | 'D'; regions: CropRegion[] }[] = []
      if (paMarkers.length >= 2) {
        for (let k = 0; k < paMarkers.length; k++) {
          const pFrom = paMarkers[k].markerEnd
          const pTo = k + 1 < paMarkers.length ? paMarkers[k + 1].index : realTo
          paRegions.push({ key: paMarkers[k].key, regions: regionsPerPage(wordRefsInRange(refs, pFrom, pTo)) })
        }
      }

      out.push({ phan: ten, so: cauMarkers[j].so, thanCauRegions: regionsPerPage(thanCauWords), paRegions })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Xử lý ảnh điểm ảnh (pixel) — thuần, test được không cần canvas thật.
// ---------------------------------------------------------------------------

export interface RasterImage {
  width: number
  height: number
  data: Uint8ClampedArray // RGBA
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Nhị phân hoá nhẹ: pixel tối (chữ) -> đen đục, pixel sáng (nền) -> TRONG
 * SUỐT hoàn toàn — để ảnh hiện đẹp trên cả nền sáng lẫn nền tối của app. */
export function binarizeToTransparent(img: RasterImage, threshold = 180): RasterImage {
  const out = new Uint8ClampedArray(img.data.length)
  for (let i = 0; i < img.data.length; i += 4) {
    const r = img.data[i]
    const g = img.data[i + 1]
    const b = img.data[i + 2]
    const a = img.data[i + 3]
    const lum = luminance(r, g, b)
    if (a > 10 && lum < threshold) {
      out[i + 3] = 255
    } else {
      out[i + 3] = 0
    }
  }
  return { width: img.width, height: img.height, data: out }
}

/** Cắt sát viền theo alpha (ảnh đã nhị phân hoá) — không còn khoảng trắng
 * thừa quanh chữ. Ảnh trống hoàn toàn trả về nguyên khung để không vỡ pipeline. */
export function trimByAlpha(img: RasterImage): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = img.width
  let y0 = img.height
  let x1 = 0
  let y1 = 0
  let found = false
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const a = img.data[(y * img.width + x) * 4 + 3]
      if (a > 10) {
        found = true
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (!found) return { x0: 0, y0: 0, x1: img.width, y1: img.height }
  return { x0, y0, x1: x1 + 1, y1: y1 + 1 }
}

export function cropRaster(img: RasterImage, rect: { x0: number; y0: number; x1: number; y1: number }): RasterImage {
  const w = Math.max(1, rect.x1 - rect.x0)
  const h = Math.max(1, rect.y1 - rect.y0)
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = rect.x0 + x
      const sy = rect.y0 + y
      if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) continue
      const si = (sy * img.width + sx) * 4
      const di = (y * w + x) * 4
      out[di] = img.data[si]
      out[di + 1] = img.data[si + 1]
      out[di + 2] = img.data[si + 2]
      out[di + 3] = img.data[si + 3]
    }
  }
  return { width: w, height: h, data: out }
}

/** Chừa mép trong suốt quanh ảnh — đỡ chữ dính sát cạnh khi hiện trên app. */
export function addTransparentMargin(img: RasterImage, marginPx: number): RasterImage {
  const w = img.width + marginPx * 2
  const h = img.height + marginPx * 2
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const si = (y * img.width + x) * 4
      const di = ((y + marginPx) * w + (x + marginPx)) * 4
      out[di] = img.data[si]
      out[di + 1] = img.data[si + 1]
      out[di + 2] = img.data[si + 2]
      out[di + 3] = img.data[si + 3]
    }
  }
  return { width: w, height: h, data: out }
}

/** Câu bị cắt ngang 2 trang -> ghép ảnh 2 trang theo chiều dọc, căn giữa theo
 * chiều ngang nếu 2 ảnh không cùng bề rộng. */
export function stitchVertical(a: RasterImage, b: RasterImage, gapPx = 4): RasterImage {
  const w = Math.max(a.width, b.width)
  const h = a.height + gapPx + b.height
  const out = new Uint8ClampedArray(w * h * 4)
  const paste = (src: RasterImage, yOff: number) => {
    const xOff = Math.floor((w - src.width) / 2)
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const si = (y * src.width + x) * 4
        const di = ((y + yOff) * w + (x + xOff)) * 4
        out[di] = src.data[si]
        out[di + 1] = src.data[si + 1]
        out[di + 2] = src.data[si + 2]
        out[di + 3] = src.data[si + 3]
      }
    }
  }
  paste(a, 0)
  paste(b, a.height + gapPx)
  return { width: w, height: h, data: out }
}

/** Bước làm sạch chuẩn cho mọi ảnh cắt: nhị phân hoá + nền trong suốt -> cắt
 * sát viền -> chừa mép 6px. */
export function cleanupCrop(raw: RasterImage, marginPx = 6, threshold = 180): RasterImage {
  const bin = binarizeToTransparent(raw, threshold)
  const bounds = trimByAlpha(bin)
  const trimmed = cropRaster(bin, bounds)
  return addTransparentMargin(trimmed, marginPx)
}

// ---------------------------------------------------------------------------
// Điều phối thật (đụng DOM/pdf.js) — không test unit trực tiếp được, chỉ gọi
// các hàm thuần ở trên.
// ---------------------------------------------------------------------------

interface PdfWordItemLike {
  str: string
  width?: number
  transform?: number[]
}

/** Quy đổi 1 "item" chữ pdf.js (toạ độ hệ PDF) sang bbox pixel trong hệ toạ độ
 * của canvas đã render trang đó (dùng viewport.transform để quy đổi, đúng
 * cách pdf.js tự dùng khi vẽ text layer). Chừa thêm biên trên/dưới rộng rãi
 * cho dấu tiếng Việt (ư, ệ, ạ...) hay nằm ngoài khung chữ latin thường. */
export function itemToWordBox(item: PdfWordItemLike, viewportTransform: number[], pageNum: number): WordBox | null {
  if (!item.transform || !item.str || !item.str.trim()) return null
  const tx = pdfjsLib.Util.transform(viewportTransform, item.transform) as number[]
  const fontHeight = Math.hypot(tx[2], tx[3]) || Math.hypot(tx[0], tx[1]) * 0.9
  const width = Math.hypot(tx[0], tx[1]) * (item.width ?? 0)
  const x0 = tx[4]
  const baselineY = tx[5]
  return {
    text: item.str,
    page: pageNum,
    x0,
    y0: baselineY - fontHeight,
    x1: x0 + Math.max(width, 1),
    y1: baselineY + fontHeight * 0.2,
  }
}

export interface PdfImageExtractionResult {
  /** key = `${phan}-${so}` (vd "I-5") */
  images: Map<string, { thanCauImg: string; paImgs?: Partial<Record<'A' | 'B' | 'C' | 'D', string>> }>
  warnings: string[]
}

function renderRegionsToCanvas(regions: CropRegion[], canvases: Map<number, HTMLCanvasElement>): HTMLCanvasElement | null {
  if (regions.length === 0) return null
  const rasters: RasterImage[] = []
  for (const r of regions) {
    const srcCanvas = canvases.get(r.page)
    if (!srcCanvas) continue
    const ctx = srcCanvas.getContext('2d')
    if (!ctx) continue
    const pad = 4
    const x0 = Math.max(0, Math.floor(r.x0) - pad)
    const y0 = Math.max(0, Math.floor(r.y0) - pad)
    const x1 = Math.min(srcCanvas.width, Math.ceil(r.x1) + pad)
    const y1 = Math.min(srcCanvas.height, Math.ceil(r.y1) + pad)
    const w = Math.max(1, x1 - x0)
    const h = Math.max(1, y1 - y0)
    const imgData = ctx.getImageData(x0, y0, w, h)
    rasters.push({ width: w, height: h, data: imgData.data })
  }
  if (rasters.length === 0) return null
  let merged = rasters[0]
  for (let i = 1; i < rasters.length; i++) merged = stitchVertical(merged, rasters[i])
  const cleaned = cleanupCrop(merged)
  const out = document.createElement('canvas')
  out.width = cleaned.width
  out.height = cleaned.height
  const octx = out.getContext('2d')
  if (!octx) return null
  octx.putImageData(new ImageData(new Uint8ClampedArray(cleaned.data), cleaned.width, cleaned.height), 0, 0)
  return out
}

/** Điểm vào chính: render PDF ở 200 DPI, định vị toạ độ từng câu/phương án
 * bằng lớp chữ, cắt + làm sạch thành ảnh riêng cho từng phần. Best-effort —
 * câu nào không xác định đủ mốc thì bỏ qua (không có trong `images`), để màn
 * Duyệt câu giữ nguyên chế độ chữ + cờ vàng như trước cho câu đó. */
export async function extractPdfQuestionImages(file: File, dpi = 200): Promise<PdfImageExtractionResult> {
  const buf = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buf }).promise
  const scale = dpi / 72
  const allWords: WordBox[] = []
  const canvases = new Map<number, HTMLCanvasElement>()
  const pageHeights: number[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    await page.render({ canvasContext: ctx, viewport }).promise
    canvases.set(i, canvas)
    pageHeights.push(viewport.height)

    const content = await page.getTextContent()
    for (const raw of content.items as unknown as PdfWordItemLike[]) {
      const wb = itemToWordBox(raw, viewport.transform as unknown as number[], i)
      if (wb) allWords.push(wb)
    }
  }

  const lines = groupWordsIntoLines(allWords)
  const maxPageHeight = pageHeights.length ? Math.max(...pageHeights) : 0
  const contentLines = filterContentLines(lines, maxPageHeight)
  const { text, refs } = buildPositionedText(contentLines)
  const questions = segmentImageQuestions(text, refs)

  const images = new Map<string, { thanCauImg: string; paImgs?: Partial<Record<'A' | 'B' | 'C' | 'D', string>> }>()
  const warnings: string[] = []
  for (const q of questions) {
    const thanCauCanvas = renderRegionsToCanvas(q.thanCauRegions, canvases)
    if (!thanCauCanvas) {
      warnings.push(`Không xác định được vùng ảnh cho câu ${q.so} (Phần ${q.phan}) — giữ chế độ chữ, cần thầy kiểm tra tay.`)
      continue
    }
    const entry: { thanCauImg: string; paImgs?: Partial<Record<'A' | 'B' | 'C' | 'D', string>> } = {
      thanCauImg: thanCauCanvas.toDataURL('image/png'),
    }
    if (q.paRegions.length === 4) {
      const paImgs: Partial<Record<'A' | 'B' | 'C' | 'D', string>> = {}
      let ok = true
      for (const pa of q.paRegions) {
        const c = renderRegionsToCanvas(pa.regions, canvases)
        if (!c) {
          ok = false
          break
        }
        paImgs[pa.key] = c.toDataURL('image/png')
      }
      if (ok) entry.paImgs = paImgs
      else warnings.push(`Câu ${q.so} (Phần ${q.phan}): cắt được đề bài nhưng thiếu ảnh 1 vài phương án — cần thầy kiểm tra tay.`)
    }
    images.set(`${q.phan}-${q.so}`, entry)
  }
  return { images, warnings }
}
