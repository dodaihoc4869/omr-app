// Phép đổi thứ tự GỐC của `TheCau` (choicePerm / yPerm, đáp án và câu em chọn theo chữ gốc) ⇒ thứ tự HIỆN mà `LoiGiaiKinhHs` cần.
// Hàm thuần (KinhTheCau.tsx dùng; test: tests/loi-giai-kinh-man-hs-0211.test.tsx).
import type { PhanKinh } from './kieu'

/** Phần của TheCauProps mà phép đổi cần (khai lỏng để test thuần, khỏi kéo cả TheCau). */
export interface TheCauChoKinh {
  phan: PhanKinh
  choices?: readonly string[]
  choicePerm?: readonly number[]
  ideas?: readonly string[]
  yPerm?: readonly number[]
  selected?: unknown
  correct?: unknown
}

export interface KinhTheoHien { choices?: string[]; ideas?: string[]; dapAn: string; em?: string | Array<string | null> }

const hoan = (p: readonly number[] | undefined): number[] => (p && p.length === 4 && new Set(p).size === 4 && p.every((i) => i >= 0 && i < 4) ? [...p] : [0, 1, 2, 3])

/** Đổi dữ liệu TheCau (thứ tự gốc) ⇒ thứ tự HIỆN cho Kính. Không đủ đáp án ⇒ null (vẽ lời giải cũ). */
export function kinhTheoHien(t: TheCauChoKinh): KinhTheoHien | null {
  if (t.phan === 'I') {
    const perm = hoan(t.choicePerm)
    const goc = typeof t.correct === 'string' ? 'ABCD'.indexOf(t.correct) : -1
    if (goc < 0 || !t.choices || t.choices.length < 4) return null
    const hien = (chu: unknown) => { const g = typeof chu === 'string' ? 'ABCD'.indexOf(chu) : -1; return g < 0 ? '' : 'ABCD'[perm.indexOf(g)] ?? '' }
    return { choices: perm.map((i) => t.choices![i] ?? ''), dapAn: hien(t.correct), em: hien(t.selected) || undefined }
  }
  if (t.phan === 'II') {
    const thuTu = hoan(t.yPerm)
    const dung = Array.isArray(t.correct) ? (t.correct as unknown[]) : []
    if (!t.ideas || t.ideas.length < 4 || thuTu.some((i) => dung[i] !== 'D' && dung[i] !== 'S')) return null
    const chon = Array.isArray(t.selected) ? (t.selected as unknown[]) : []
    return {
      ideas: thuTu.map((i) => t.ideas![i] ?? ''),
      dapAn: thuTu.map((i) => dung[i]).join(''),
      em: thuTu.map((i) => (chon[i] === 'D' || chon[i] === 'S' ? (chon[i] as string) : null)),
    }
  }
  const dapAn = typeof t.correct === 'string' ? t.correct.trim() : ''
  if (!dapAn) return null
  return { dapAn, em: typeof t.selected === 'string' && t.selected.trim() ? t.selected.trim() : undefined }
}

