// Phân tích văn bản thuần (thầy soạn trong Word rồi dán vào, hoặc gõ trực
// tiếp) thành TeacherExamSource (có đáp án đúng). KHÔNG đọc được công thức
// MathType — công thức Hoá gõ lại bằng chữ thường (vd "H2SO4", "Fe^2+"), app
// tự hiển thị chỉ số dưới/số mũ khi render (xem chem-format.tsx), KHÔNG BAO
// GIỜ tự đoán sai — chỗ nào không chắc thì giữ nguyên chữ, không suy diễn.
// Số câu mỗi phần KHÔNG bắt buộc đúng 18/4/6 — thầy tải càng nhiều câu, ngân
// hàng càng đa dạng để random cho học sinh càng ít trùng nhau.
//
// Định dạng mong đợi:
//   MÃ ĐỀ: 132
//   PHẦN I
//   1) Đề bài câu 1...
//   A. Lựa chọn A
//   *B. Lựa chọn B      <- dấu * trước lựa chọn ĐÚNG
//   C. Lựa chọn C
//   D. Lựa chọn D
//   2) ...
//   PHẦN II
//   1) Đề bài câu 1 (có 4 ý a,b,c,d)...
//   a) Ý a (Đ)          <- (Đ) hoặc (S) sau mỗi ý
//   b) Ý b (S)
//   c) Ý c (Đ)
//   d) Ý d (S)
//   PHẦN III
//   1) Đề bài câu 1 (điền số, không có lựa chọn)...
//   => 12,5              <- dòng đáp án, bắt đầu bằng =>
//
// Bảng số liệu (tái tạo CHÍNH XÁC, không suy đoán): đặt giữa [BANG] và
// [/BANG], mỗi dòng 1 hàng, các cột cách nhau bằng "|":
//   [BANG]
//   Thời gian (phút) | Nồng độ (M)
//   0 | 1,0
//   5 | 0,5
//   [/BANG]
// Đồ thị/hình vẽ: KHÔNG thể gõ lại bằng chữ mà đảm bảo đúng 100% số liệu gốc
// — phải đính kèm ẢNH THẬT (chụp/scan) qua nút "Đính kèm ảnh" ở màn Soạn đề,
// app chèn tự động 1 dòng [ANH:mã-ảnh] vào đúng vị trí, hiển thị lại y
// nguyên ảnh đó cho học sinh — không có tính năng "vẽ lại" đồ thị bằng AI.
import {
  type TeacherExamSource,
  type TeacherMcqQuestion,
  type TeacherShortAnswerQuestion,
  type TeacherTrueFalseQuestion,
} from '../data/examContent'

const IMG_RE = /\[ANH:([A-Za-z0-9_-]+)\]/

/** Tách [BANG]...[/BANG] và [ANH:token] ra khỏi các dòng văn bản của 1 câu hỏi. */
function extractMedia(
  block: string[],
  imageMap: Record<string, string>,
): { lines: string[]; table?: string[][]; imageDataUrl?: string } {
  const lines: string[] = []
  let table: string[][] | undefined
  let imageDataUrl: string | undefined
  let inTable = false
  const tableRows: string[][] = []

  for (const raw of block) {
    const line = raw
    if (/^\s*\[BANG\]\s*$/i.test(line)) {
      inTable = true
      continue
    }
    if (/^\s*\[\/BANG\]\s*$/i.test(line)) {
      inTable = false
      if (tableRows.length > 0) table = tableRows.slice()
      continue
    }
    if (inTable) {
      tableRows.push(line.split('|').map((c) => c.trim()))
      continue
    }
    const imgMatch = line.match(IMG_RE)
    if (imgMatch) {
      const token = imgMatch[1]
      if (imageMap[token]) imageDataUrl = imageMap[token]
      const rest = line.replace(IMG_RE, '').trim()
      if (rest) lines.push(rest)
      continue
    }
    lines.push(line)
  }
  return { lines, table, imageDataUrl }
}

function findSectionBounds(lines: string[]): { maDe: string; p1Start: number; p2Start: number; p3Start: number } {
  const reMaDe = /^mã\s*đề\s*:?\s*(.+)$/i
  const reP1 = /^ph[aầ]n\s*i\b/i
  const reP2 = /^ph[aầ]n\s*ii\b/i
  const reP3 = /^ph[aầ]n\s*iii\b/i

  let maDe = ''
  let p1Start = -1
  let p2Start = -1
  let p3Start = -1
  lines.forEach((line, i) => {
    const t = line.trim()
    const mMaDe = t.match(reMaDe)
    if (mMaDe && !maDe) maDe = mMaDe[1].trim()
    if (reP1.test(t) && p1Start < 0) p1Start = i
    else if (reP2.test(t) && p2Start < 0) p2Start = i
    else if (reP3.test(t) && p3Start < 0) p3Start = i
  })
  return { maDe, p1Start, p2Start, p3Start }
}

function splitQuestionBlocks(lines: string[]): string[][] {
  const reNum = /^\s*\(?(\d+)[).]\s*/
  const blocks: string[][] = []
  let current: string[] | null = null
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (reNum.test(line)) {
      if (current) blocks.push(current)
      current = [line.replace(reNum, '')]
    } else if (current && line.trim().length > 0) {
      current.push(line)
    }
  }
  if (current) blocks.push(current)
  return blocks
}

function parseMcqBlock(block: string[], id: string, imageMap: Record<string, string>): TeacherMcqQuestion {
  const { lines, table, imageDataUrl } = extractMedia(block, imageMap)
  const reChoice = /^\s*(\*?)([A-Da-d])[).]\s*(.*)$/
  const textLines: string[] = []
  const choices: Record<string, string> = {}
  let correct: 'A' | 'B' | 'C' | 'D' | '' = ''
  for (const line of lines) {
    const m = line.match(reChoice)
    if (m) {
      const letter = m[2].toUpperCase() as 'A' | 'B' | 'C' | 'D'
      choices[letter] = m[3].trim()
      if (m[1] === '*') correct = letter
    } else {
      textLines.push(line.trim())
    }
  }
  return {
    id,
    text: textLines.join(' ').trim(),
    choices: [choices.A ?? '', choices.B ?? '', choices.C ?? '', choices.D ?? ''],
    correct: correct || 'A',
    table,
    imageDataUrl,
  }
}

function parseTrueFalseBlock(block: string[], id: string, imageMap: Record<string, string>): TeacherTrueFalseQuestion {
  const { lines, table, imageDataUrl } = extractMedia(block, imageMap)
  const reIdea = /^\s*([a-dA-D])[).]\s*(.*?)\s*\(\s*([ĐĐ]|D|[Ss]|S)\s*\)\s*$/i
  const reIdeaNoMark = /^\s*([a-dA-D])[).]\s*(.*)$/
  const textLines: string[] = []
  const ideas: Record<string, string> = {}
  const marks: Record<string, 'D' | 'S'> = {}
  for (const line of lines) {
    const m = line.match(reIdea)
    if (m) {
      const letter = m[1].toLowerCase()
      ideas[letter] = m[2].trim()
      const markRaw = m[3].toUpperCase()
      marks[letter] = markRaw === 'D' || markRaw === 'Đ' ? 'D' : 'S'
      continue
    }
    const m2 = line.match(reIdeaNoMark)
    if (m2) {
      ideas[m2[1].toLowerCase()] = m2[2].trim()
    } else {
      textLines.push(line.trim())
    }
  }
  return {
    id,
    text: textLines.join(' ').trim(),
    ideas: [ideas.a ?? '', ideas.b ?? '', ideas.c ?? '', ideas.d ?? ''],
    correct: [marks.a ?? 'S', marks.b ?? 'S', marks.c ?? 'S', marks.d ?? 'S'],
    table,
    imageDataUrl,
  }
}

function parseShortAnswerBlock(block: string[], id: string, imageMap: Record<string, string>): TeacherShortAnswerQuestion {
  const { lines, table, imageDataUrl } = extractMedia(block, imageMap)
  const reAnswer = /^\s*=>\s*(.+)$/
  const textLines: string[] = []
  let correct = ''
  for (const line of lines) {
    const m = line.match(reAnswer)
    if (m) correct = m[1].trim()
    else textLines.push(line.trim())
  }
  return { id, text: textLines.join(' ').trim(), correct, table, imageDataUrl }
}

export interface ParseExamResult {
  source: TeacherExamSource | null
  errors: string[]
  warnings: string[]
}

export function parseExamText(raw: string, imageMap: Record<string, string> = {}): ParseExamResult {
  const lines = raw.split(/\r?\n/)
  const { maDe, p1Start, p2Start, p3Start } = findSectionBounds(lines)
  const errors: string[] = []

  if (!maDe) errors.push('Không tìm thấy dòng "Mã đề: ..." ở đầu văn bản')
  if (p1Start < 0) errors.push('Không tìm thấy tiêu đề "Phần I"')
  if (p2Start < 0) errors.push('Không tìm thấy tiêu đề "Phần II"')
  if (p3Start < 0) errors.push('Không tìm thấy tiêu đề "Phần III"')
  if (errors.length > 0) return { source: null, errors, warnings: [] }

  const p1Lines = lines.slice(p1Start + 1, p2Start)
  const p2Lines = lines.slice(p2Start + 1, p3Start)
  const p3Lines = lines.slice(p3Start + 1)

  const p1Blocks = splitQuestionBlocks(p1Lines)
  const p2Blocks = splitQuestionBlocks(p2Lines)
  const p3Blocks = splitQuestionBlocks(p3Lines)

  if (p1Blocks.length === 0) errors.push('Phần I: không đọc được câu nào')
  if (p2Blocks.length === 0) errors.push('Phần II: không đọc được câu nào')
  if (p3Blocks.length === 0) errors.push('Phần III: không đọc được câu nào')
  if (errors.length > 0) return { source: null, errors, warnings: [] }

  const source: TeacherExamSource = {
    maDe,
    phanI: p1Blocks.map((b, i) => parseMcqBlock(b, `${maDe}-p1-${i}`, imageMap)),
    phanII: p2Blocks.map((b, i) => parseTrueFalseBlock(b, `${maDe}-p2-${i}`, imageMap)),
    phanIII: p3Blocks.map((b, i) => parseShortAnswerBlock(b, `${maDe}-p3-${i}`, imageMap)),
  }

  const warnings: string[] = []
  source.phanI.forEach((q, i) => {
    if (!q.choices.every((c) => c)) warnings.push(`Phần I câu ${i + 1}: thiếu 1 hoặc nhiều lựa chọn A/B/C/D`)
  })
  source.phanIII.forEach((q, i) => {
    if (!q.correct) warnings.push(`Phần III câu ${i + 1}: chưa có dòng đáp án "=> ..."`)
  })

  return { source, errors: [], warnings }
}
