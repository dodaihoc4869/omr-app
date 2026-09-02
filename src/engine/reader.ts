// Ghép sampling.ts + classify.ts + template.ts thành một bước duy nhất: từ
// ảnh mức xám đã warp về khung chuẩn → StudentAnswers. Thuần TypeScript, có
// thể unit test bằng ảnh tổng hợp mà không cần OpenCV/WASM.
import { classifyExclusiveGroup, type ClassifyThresholds, DEFAULT_THRESHOLDS } from './classify'
import { readBubble, type GrayImage } from './sampling'
import type { Choice, DS, GradedItem, ItemFlag } from './score'
import {
  genMadeThiBubbles,
  genPhanIBubbles,
  genPhanIIBubbles,
  genPhanIIIBubbles,
  genSbdBubbles,
  mmToPx,
  template,
  type Bubble,
} from './template'

export interface ReaderOptions {
  thresholds: ClassifyThresholds
  maskFraction: number
}

export const DEFAULT_READER_OPTIONS: ReaderOptions = {
  thresholds: DEFAULT_THRESHOLDS,
  maskFraction: 0.825,
}

/** Gom danh sách bubble theo tiền tố id (bỏ đoạn cuối) — mỗi nhóm là 1 lựa chọn loại trừ lẫn nhau. */
function groupByPrefix(bubbles: Bubble[]): Map<string, Bubble[]> {
  const groups = new Map<string, Bubble[]>()
  for (const b of bubbles) {
    const key = b.id.slice(0, b.id.lastIndexOf('.'))
    const arr = groups.get(key) ?? []
    arr.push(b)
    groups.set(key, arr)
  }
  return groups
}

function classifyGroupOnImage(
  img: GrayImage,
  bubbles: Bubble[],
  rPx: number,
  opts: ReaderOptions,
): GradedItem<string> {
  const readings = bubbles.map((b) =>
    readBubble(img, mmToPx(b.x_mm), mmToPx(b.y_mm), rPx, b.value, opts.maskFraction),
  )
  return classifyExclusiveGroup(readings, opts.thresholds)
}

function mostSevereFlag(flags: ItemFlag[]): ItemFlag {
  if (flags.includes('ERR_DOUBLE_MARK')) return 'ERR_DOUBLE_MARK'
  if (flags.includes('WARN_ERASURE')) return 'WARN_ERASURE'
  if (flags.every((f) => f === 'EMPTY')) return flags.length > 0 ? 'EMPTY' : null
  return null
}

export interface DigitFieldResult {
  value: string // chuỗi số cuối cùng, '?' ở vị trí không đọc được
  flag: ItemFlag // cờ nặng nhất trong các cột
  complete: boolean // true nếu mọi cột đều đọc được rõ ràng (không EMPTY/cờ)
}

function readDigitField(img: GrayImage, bubbles: Bubble[], digits: number, rPx: number, opts: ReaderOptions): DigitFieldResult {
  const groups = groupByPrefix(bubbles)
  const flags: ItemFlag[] = []
  let value = ''
  for (let col = 0; col < digits; col++) {
    const key = `${bubbles[0].id.split('.')[0]}.${col}`
    const g = groups.get(key) ?? []
    const result = classifyGroupOnImage(img, g, rPx, opts)
    flags.push(result.flag)
    value += result.value ?? '?'
  }
  const flag = mostSevereFlag(flags)
  return { value, flag, complete: !flags.some((f) => f !== null) }
}

export interface ReadSheetResult {
  sbd: DigitFieldResult
  madeThi: DigitFieldResult
  phanI: GradedItem<Choice>[]
  phanII: GradedItem<DS>[][]
  phanIII: GradedItem<string>[]
}

/** Đọc toàn bộ phiếu từ ảnh mức xám đã warp về đúng 1654×2339 (theo template2025.json). */
export function readSheet(img: GrayImage, opts: ReaderOptions = DEFAULT_READER_OPTIONS): ReadSheetResult {
  const rPx = mmToPx(template.bubble_diameter_mm) / 2

  const sbd = readDigitField(img, genSbdBubbles(), template.sbd.digits, rPx, opts)
  const madeThi = readDigitField(img, genMadeThiBubbles(), template.madeThi.digits, rPx, opts)

  // Phần I: 18 nhóm độc lập, mỗi nhóm 4 lựa chọn ABCD
  const phanIGroups = groupByPrefix(genPhanIBubbles())
  const phanI: GradedItem<Choice>[] = []
  for (let q = 1; q <= template.phanI.questions; q++) {
    const g = phanIGroups.get(`phanI.${q}`) ?? []
    const r = classifyGroupOnImage(img, g, rPx, opts)
    phanI.push({ value: (r.value as Choice) ?? null, flag: r.flag })
  }

  // Phần II: 4 câu × 4 ý, mỗi ý 1 nhóm 2 lựa chọn Đ/S
  const phanIIGroups = groupByPrefix(genPhanIIBubbles())
  const phanII: GradedItem<DS>[][] = []
  for (let q = 1; q <= template.phanII.questions; q++) {
    const ideas: GradedItem<DS>[] = []
    for (let idea = 1; idea <= template.phanII.ideas; idea++) {
      const g = phanIIGroups.get(`phanII.${q}.${idea}`) ?? []
      const r = classifyGroupOnImage(img, g, rPx, opts)
      ideas.push({ value: (r.value as DS) ?? null, flag: r.flag })
    }
    phanII.push(ideas)
  }

  // Phần III: 6 câu × 4 cột, mỗi cột 1 nhóm 12 ký hiệu — ghép 4 cột thành 1 chuỗi.
  const phanIIIGroups = groupByPrefix(genPhanIIIBubbles())
  const phanIII: GradedItem<string>[] = []
  for (let q = 1; q <= template.phanIII.questions; q++) {
    const flags: ItemFlag[] = []
    let str = ''
    for (let col = 0; col < template.phanIII.cols; col++) {
      const g = phanIIIGroups.get(`phanIII.${q}.${col}`) ?? []
      const r = classifyGroupOnImage(img, g, rPx, opts)
      flags.push(r.flag)
      if (r.value !== null) str += r.value // cột EMPTY hợp lệ (số có thể ngắn hơn 4 ký tự) — bỏ qua, không phải lỗi
    }
    const flag = mostSevereFlag(flags.filter((f) => f !== 'EMPTY'))
    phanIII.push({ value: str.length > 0 ? str : null, flag: str.length === 0 ? 'EMPTY' : flag })
  }

  return { sbd, madeThi, phanI, phanII, phanIII }
}
