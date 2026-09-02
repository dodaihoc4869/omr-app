// Nguồn sự thật DUY NHẤT cho toạ độ phiếu — dùng chung cho in (PrintSheetView)
// và đọc (ScanEngine). Không khai toạ độ bubble ở bất kỳ nơi nào khác.
import rawTemplate from '../data/template2025.json'

export interface Point { x: number; y: number }

export interface Bubble {
  /** id duy nhất trong toàn phiếu, dùng để tra kết quả sau khi phân loại */
  id: string
  /** giá trị bubble này đại diện (chữ cái, chữ số, ký hiệu...) */
  value: string
  x_mm: number
  y_mm: number
}

export interface TemplateT {
  version: string
  page: { width_mm: number; height_mm: number; dpi: number; width_px: number; height_px: number }
  anchors: { id: string; x_mm: number; y_mm: number; size_mm: number }[]
  timingMarks: { enabled: boolean; note: string }
  bubble_diameter_mm: number
  sbd: {
    label: string; digits: number; choices: string[]
    origin_mm: Point; pitch_mm: { x: number; y: number }
  }
  madeThi: {
    label: string; digits: number; choices: string[]
    origin_mm: Point; pitch_mm: { x: number; y: number }
  }
  phanI: {
    label: string; questions: number; choices: string[]
    blockCols: number; questionsPerBlock: number
    blockOrigin_mm: Point; blockSpacing_mm: { x: number }
    pitch_mm: { x: number; y: number }
  }
  phanII: {
    label: string; questions: number; ideas: number; choices: string[]
    origin_mm: Point; questionPitch_mm: number; ideaSpacing_mm: number; choiceSpacing_mm: number
  }
  phanIII: {
    label: string; questions: number; cols: number; rows: number; rowSymbols: string[]
    blockOrigin_mm: Point; blockSpacing_mm: { x: number }
    pitch_mm: { x: number; y: number }
  }
}

export const template = rawTemplate as unknown as TemplateT

export const mmToPx = (mm: number): number => (mm * template.page.dpi) / 25.4

/** Lưới số/chữ (dùng cho SBD và Mã đề): mỗi cột là 1 chữ số, mỗi hàng là 1 lựa chọn. */
function genDigitGrid(cfg: {
  digits: number; choices: string[]; origin_mm: Point; pitch_mm: { x: number; y: number }
}, prefix: string): Bubble[] {
  const out: Bubble[] = []
  for (let col = 0; col < cfg.digits; col++) {
    for (let row = 0; row < cfg.choices.length; row++) {
      out.push({
        id: `${prefix}.${col}.${cfg.choices[row]}`,
        value: cfg.choices[row],
        x_mm: cfg.origin_mm.x + col * cfg.pitch_mm.x,
        y_mm: cfg.origin_mm.y + row * cfg.pitch_mm.y,
      })
    }
  }
  return out
}

export function genSbdBubbles(): Bubble[] {
  return genDigitGrid(template.sbd, 'sbd')
}

export function genMadeThiBubbles(): Bubble[] {
  return genDigitGrid(template.madeThi, 'made')
}

/** Phần I: chia thành blockCols khối, mỗi khối questionsPerBlock câu × 4 lựa chọn ABCD. */
export function genPhanIBubbles(): Bubble[] {
  const t = template.phanI
  const out: Bubble[] = []
  for (let q = 0; q < t.questions; q++) {
    const block = Math.floor(q / t.questionsPerBlock)
    const rowInBlock = q % t.questionsPerBlock
    const originX = t.blockOrigin_mm.x + block * t.blockSpacing_mm.x
    const originY = t.blockOrigin_mm.y
    for (let c = 0; c < t.choices.length; c++) {
      out.push({
        id: `phanI.${q + 1}.${t.choices[c]}`,
        value: t.choices[c],
        x_mm: originX + c * t.pitch_mm.x,
        y_mm: originY + rowInBlock * t.pitch_mm.y,
      })
    }
  }
  return out
}

/** Phần II: mỗi câu 4 ý, mỗi ý 2 lựa chọn Đ/S đặt cạnh nhau. */
export function genPhanIIBubbles(): Bubble[] {
  const t = template.phanII
  const out: Bubble[] = []
  for (let q = 0; q < t.questions; q++) {
    const y = t.origin_mm.y + q * t.questionPitch_mm
    for (let idea = 0; idea < t.ideas; idea++) {
      const ideaX = t.origin_mm.x + idea * t.ideaSpacing_mm
      for (let c = 0; c < t.choices.length; c++) {
        out.push({
          id: `phanII.${q + 1}.${idea + 1}.${t.choices[c]}`,
          value: t.choices[c],
          x_mm: ideaX + c * t.choiceSpacing_mm,
          y_mm: y,
        })
      }
    }
  }
  return out
}

/** Phần III: 6 khối câu, mỗi khối 4 cột (vị trí ký tự) × 12 hàng (ký hiệu có thể chọn). */
export function genPhanIIIBubbles(): Bubble[] {
  const t = template.phanIII
  const out: Bubble[] = []
  for (let q = 0; q < t.questions; q++) {
    const originX = t.blockOrigin_mm.x + q * t.blockSpacing_mm.x
    const originY = t.blockOrigin_mm.y
    for (let col = 0; col < t.cols; col++) {
      for (let row = 0; row < t.rows; row++) {
        out.push({
          id: `phanIII.${q + 1}.${col}.${t.rowSymbols[row]}`,
          value: t.rowSymbols[row],
          x_mm: originX + col * t.pitch_mm.x,
          y_mm: originY + row * t.pitch_mm.y,
        })
      }
    }
  }
  return out
}

export function genAllBubbles(): Bubble[] {
  return [
    ...genSbdBubbles(),
    ...genMadeThiBubbles(),
    ...genPhanIBubbles(),
    ...genPhanIIBubbles(),
    ...genPhanIIIBubbles(),
  ]
}
