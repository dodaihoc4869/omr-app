// Random chọn + xáo câu cho TỪNG học sinh từ ngân hàng câu hỏi đã gộp — mỗi
// em nhận một tập câu KHÁC NHAU (không chỉ đổi thứ tự của cùng 1 đề), có
// seed = hash(mãCa + SBD) nên tái tạo lại được y hệt khi cần phúc khảo/chấm
// lại (không cần lưu lại bộ câu đã gán cho từng em).
import { PHAN_I_NEED, PHAN_II_NEED, PHAN_III_NEED, type McqQuestion, type PublicExamBank, type ShortAnswerQuestion, type TrueFalseQuestion } from '../data/examContent'
import { hashSeed, seededPermutation } from './exam-shuffle'

export interface AssignedMcq {
  qid: string
  question: McqQuestion
  choicePerm: number[] // choicePerm[viTríHiểnThị] = chỉSốLựaChọnGốc(0..3)
}
export interface AssignedTrueFalse {
  qid: string
  question: TrueFalseQuestion
}
export interface AssignedShortAnswer {
  qid: string
  question: ShortAnswerQuestion
}

export interface StudentAssignment {
  phanI: AssignedMcq[]
  phanII: AssignedTrueFalse[]
  phanIII: AssignedShortAnswer[]
}

function pick<T extends { id: string }>(arr: T[], need: number, seedTag: string): T[] {
  const n = arr.length
  if (n === 0) return []
  const k = Math.min(need, n)
  const perm = seededPermutation(n, hashSeed(seedTag))
  return perm.slice(0, k).map((i) => arr[i])
}

/** Bank ở đây có thể là PublicExamBank (học sinh) hoặc TeacherExamSource đã gộp (thầy chấm lại) — chỉ cần đúng shape id/text/choices/ideas. */
export function assignStudentQuestions(bank: PublicExamBank, maCa: string, sbd: string): StudentAssignment {
  const base = `${maCa}:${sbd}`
  const phanIQs = pick(bank.phanI, PHAN_I_NEED, `${base}:phanI`)
  const phanIIQs = pick(bank.phanII, PHAN_II_NEED, `${base}:phanII`)
  const phanIIIQs = pick(bank.phanIII, PHAN_III_NEED, `${base}:phanIII`)

  return {
    phanI: phanIQs.map((q) => ({
      qid: q.id,
      question: q,
      choicePerm: seededPermutation(4, hashSeed(`choice:${base}:${q.id}`)),
    })),
    phanII: phanIIQs.map((q) => ({ qid: q.id, question: q })),
    phanIII: phanIIIQs.map((q) => ({ qid: q.id, question: q })),
  }
}
