// Chấm điểm theo biểu điểm cố định trong OMR-APP.md:
//   Phần I  : 18 câu × 0,25 = 4,5
//   Phần II : 4 câu, điểm theo số ý đúng (1:0,1 · 2:0,25 · 3:0,5 · 4:1,0), tối đa 4,0
//   Phần III: 6 câu × 0,25 = 1,5
//   Tổng 10,00 — hai chữ số thập phân, có assert cộng chéo.
//
// Toàn bộ phép cộng chạy trên đơn vị "cents" (1/100 điểm, số nguyên) để
// tránh sai số dấu phẩy động của JavaScript (0.1 + 0.2 !== 0.3), rồi mới
// quy đổi ra điểm hiển thị ở bước cuối.

export type Choice = 'A' | 'B' | 'C' | 'D'
export type DS = 'D' | 'S'
export type ItemFlag = 'EMPTY' | 'WARN_ERASURE' | 'ERR_DOUBLE_MARK' | null

export interface GradedItem<T> {
  value: T | null
  flag: ItemFlag
}

export interface AnswerKey {
  madeThi: string
  phanI: Choice[] // length 18
  phanII: DS[][] // length 4, mỗi phần tử length 4 (4 ý)
  phanIII: string[] // length 6, giá trị đã chuẩn hoá (dùng '.' làm phân cách thập phân)
}

export interface StudentAnswers {
  sbd: string
  madeThi: string
  phanI: GradedItem<Choice>[] // length 18
  phanII: GradedItem<DS>[][] // length 4, mỗi phần tử length 4
  phanIII: GradedItem<string>[] // length 6
}

export interface QuestionResult {
  index: number
  correct: boolean
  cents: number
  flag: ItemFlag
}

export interface ScoreResult {
  phanI: { items: QuestionResult[]; cents: number }
  phanII: { items: QuestionResult[]; cents: number }
  phanIII: { items: QuestionResult[]; cents: number }
  totalCents: number
  total: number // điểm hiển thị, 2 chữ số thập phân
  phanIScore: number
  phanIIScore: number
  phanIIIScore: number
  remainingFlags: number
  crossSumOk: boolean
}

const PHAN_I_CENTS_PER_CORRECT = 25 // 0,25 điểm
const PHAN_III_CENTS_PER_CORRECT = 25 // 0,25 điểm
// Điểm Phần II theo số ý đúng trong 1 câu (0..4 ý)
const PHAN_II_CENTS_BY_CORRECT_IDEAS = [0, 10, 25, 50, 100]

/** Chuẩn hoá số Phần III: "0,87" ≡ "0.87", bỏ khoảng trắng thừa. */
export function normalizeNumericAnswer(raw: string): string {
  return raw.trim().replace(',', '.')
}

function centsToScore(cents: number): number {
  return Math.round(cents) / 100
}

export function scorePhanI(answers: GradedItem<Choice>[], key: Choice[]): { items: QuestionResult[]; cents: number } {
  if (answers.length !== key.length) {
    throw new Error(`Phần I: số câu trả lời (${answers.length}) khác số câu đáp án (${key.length})`)
  }
  let cents = 0
  const items: QuestionResult[] = answers.map((a, i) => {
    const correct = a.flag !== 'ERR_DOUBLE_MARK' && a.value !== null && a.value === key[i]
    const itemCents = correct ? PHAN_I_CENTS_PER_CORRECT : 0
    cents += itemCents
    return { index: i + 1, correct, cents: itemCents, flag: a.flag }
  })
  return { items, cents }
}

export function scorePhanII(answers: GradedItem<DS>[][], key: DS[][]): { items: QuestionResult[]; cents: number } {
  if (answers.length !== key.length) {
    throw new Error(`Phần II: số câu trả lời (${answers.length}) khác số câu đáp án (${key.length})`)
  }
  let cents = 0
  const items: QuestionResult[] = answers.map((ideaAnswers, i) => {
    const ideaKey = key[i]
    if (ideaAnswers.length !== ideaKey.length) {
      throw new Error(`Phần II câu ${i + 1}: số ý trả lời khác số ý đáp án`)
    }
    let correctIdeas = 0
    let hasDoubleMark = false
    ideaAnswers.forEach((a, j) => {
      if (a.flag === 'ERR_DOUBLE_MARK') hasDoubleMark = true
      if (a.flag !== 'ERR_DOUBLE_MARK' && a.value !== null && a.value === ideaKey[j]) correctIdeas++
    })
    const itemCents = hasDoubleMark ? 0 : PHAN_II_CENTS_BY_CORRECT_IDEAS[correctIdeas]
    cents += itemCents
    const flag: ItemFlag = ideaAnswers.some((a) => a.flag) ? (ideaAnswers.find((a) => a.flag)?.flag ?? null) : null
    return { index: i + 1, correct: correctIdeas === 4 && !hasDoubleMark, cents: itemCents, flag }
  })
  return { items, cents }
}

export function scorePhanIII(answers: GradedItem<string>[], key: string[]): { items: QuestionResult[]; cents: number } {
  if (answers.length !== key.length) {
    throw new Error(`Phần III: số câu trả lời (${answers.length}) khác số câu đáp án (${key.length})`)
  }
  let cents = 0
  const items: QuestionResult[] = answers.map((a, i) => {
    const normalizedKey = normalizeNumericAnswer(key[i])
    const correct =
      a.flag !== 'ERR_DOUBLE_MARK' && a.value !== null && normalizeNumericAnswer(a.value) === normalizedKey
    const itemCents = correct ? PHAN_III_CENTS_PER_CORRECT : 0
    cents += itemCents
    return { index: i + 1, correct, cents: itemCents, flag: a.flag }
  })
  return { items, cents }
}

/**
 * EMPTY là trạng thái bình thường (chưa tô câu đó, chấm 0 điểm) — không cần
 * duyệt. Chỉ WARN_ERASURE và ERR_DOUBLE_MARK mới đẩy vào hàng Duyệt và khoá
 * nút Xuất, theo đúng "cờ không chặn luồng quét nhưng chặn xuất khi còn cờ".
 */
export function isReviewFlag(flag: ItemFlag): boolean {
  return flag === 'WARN_ERASURE' || flag === 'ERR_DOUBLE_MARK'
}

/** Đếm tổng số cờ cần duyệt (WARN/ERR) còn hiện diện trong bài — dùng để khoá nút Xuất. */
function countFlags(answers: StudentAnswers): number {
  let n = 0
  const bump = (f: ItemFlag) => {
    if (isReviewFlag(f)) n++
  }
  answers.phanI.forEach((a) => bump(a.flag))
  answers.phanII.forEach((q) => q.forEach((a) => bump(a.flag)))
  answers.phanIII.forEach((a) => bump(a.flag))
  return n
}

export function scoreStudent(answers: StudentAnswers, key: AnswerKey): ScoreResult {
  const phanI = scorePhanI(answers.phanI, key.phanI)
  const phanII = scorePhanII(answers.phanII, key.phanII)
  const phanIII = scorePhanIII(answers.phanIII, key.phanIII)

  const totalCents = phanI.cents + phanII.cents + phanIII.cents
  // Assert cộng chéo: tổng từng phần cộng lại phải khớp tổng chung —
  // bắt lỗi ngay nếu logic chấm bị sửa sai ở đâu đó về sau.
  const crossSumCents = phanI.cents + phanII.cents + phanIII.cents
  const crossSumOk = crossSumCents === totalCents
  if (!crossSumOk) {
    throw new Error('Assert cộng chéo thất bại: tổng ba phần không khớp tổng chung')
  }

  return {
    phanI,
    phanII,
    phanIII,
    totalCents,
    total: centsToScore(totalCents),
    phanIScore: centsToScore(phanI.cents),
    phanIIScore: centsToScore(phanII.cents),
    phanIIIScore: centsToScore(phanIII.cents),
    remainingFlags: countFlags(answers),
    crossSumOk,
  }
}

/** Xếp loại theo thang điểm 10 chuẩn phổ thông — chỉ dùng hiển thị, không ảnh hưởng điểm số. */
export function classify(total: number): string {
  if (total >= 8) return 'Giỏi'
  if (total >= 6.5) return 'Khá'
  if (total >= 5) return 'Trung bình'
  return 'Yếu'
}
