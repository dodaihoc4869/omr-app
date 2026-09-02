// Parse đáp án dán tay theo đúng định dạng dòng bài đối chứng trong
// OMR-APP.md: P.I 18 chữ cái · P.II 4 cụm Đ/S · P.III 6 giá trị.
//
// Định dạng nhập (mỗi phần một dòng, nhãn không phân biệt hoa/thường,
// có dấu hai chấm hoặc không đều được):
//
//   Mã đề: 101
//   Phần I: ABCDABCDABCDABCDAB
//   Phần II: DSDS SDSD DDSS SSDD
//   Phần III: -0,87 12 3,5 100 -5 0,25
import type { AnswerKey, Choice, DS } from '../engine/score'

export interface ParseResult {
  ok: boolean
  errors: string[]
  key?: AnswerKey
}

function findLine(lines: string[], label: string): string | undefined {
  // Bọc alternation trong group không bắt (?:...) — thiếu group này khiến "|"
  // tách rời cả regex, có nhánh khớp được nhưng không có group bắt (.*) đi kèm.
  const re = new RegExp(`^(?:${label})\\s*:?\\s*(.*)$`, 'i')
  for (const l of lines) {
    const m = l.match(re)
    if (m) return (m[1] ?? '').trim()
  }
  return undefined
}

export function parseAnswerKeyText(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const errors: string[] = []

  const madeThi = findLine(lines, 'mã đề|ma de|made')
  const phanIRaw = findLine(lines, 'phần i|phan i|p\\.i')
  const phanIIRaw = findLine(lines, 'phần ii|phan ii|p\\.ii')
  const phanIIIRaw = findLine(lines, 'phần iii|phan iii|p\\.iii')

  if (!madeThi) errors.push('Thiếu dòng "Mã đề: <3 chữ số>"')
  if (!phanIRaw) errors.push('Thiếu dòng "Phần I: <18 chữ cái ABCD>"')
  if (!phanIIRaw) errors.push('Thiếu dòng "Phần II: <4 cụm 4 ký tự Đ/S>"')
  if (!phanIIIRaw) errors.push('Thiếu dòng "Phần III: <6 giá trị>"')

  if (errors.length > 0) return { ok: false, errors }

  const phanIChars = phanIRaw!.replace(/\s+/g, '').toUpperCase().split('')
  if (phanIChars.length !== 18 || phanIChars.some((c) => !['A', 'B', 'C', 'D'].includes(c))) {
    errors.push(`Phần I phải đúng 18 ký tự A/B/C/D, đang có ${phanIChars.length} ký tự`)
  }

  const phanIIGroups = phanIIRaw!
    .toUpperCase()
    .replace(/[ĐD]/g, 'D')
    .replace(/S/g, 'S')
    .split(/\s+/)
    .filter(Boolean)
  if (phanIIGroups.length !== 4 || phanIIGroups.some((g) => g.length !== 4 || g.split('').some((c) => c !== 'D' && c !== 'S'))) {
    errors.push('Phần II phải đúng 4 cụm, mỗi cụm 4 ký tự Đ(D)/S, ví dụ: DSDS SDSD DDSS SSDD')
  }

  const phanIIIValues = phanIIIRaw!.split(/\s+/).filter(Boolean)
  if (phanIIIValues.length !== 6) {
    errors.push(`Phần III phải đúng 6 giá trị, đang có ${phanIIIValues.length} giá trị`)
  }

  if (!/^\d{3}$/.test(madeThi!)) {
    errors.push('Mã đề phải đúng 3 chữ số')
  }

  if (errors.length > 0) return { ok: false, errors }

  const key: AnswerKey = {
    madeThi: madeThi!,
    phanI: phanIChars as Choice[],
    phanII: phanIIGroups.map((g) => g.split('') as DS[]),
    phanIII: phanIIIValues,
  }
  return { ok: true, errors: [], key }
}
