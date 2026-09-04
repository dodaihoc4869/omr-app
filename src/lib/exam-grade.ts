// Chấm bài kiểm tra tại lớp — TÁI TẠO lại đúng bộ câu đã gán cho từng học
// sinh (assignStudentQuestions với cùng mãCa+sbd luôn ra cùng 1 kết quả, xem
// exam-assign.ts), rồi dùng đúng engine/score.ts đang chấm OMR — không viết
// logic chấm điểm lần 2.
import type { SoCauMoiPhan, TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import type { AnswerKey, Choice, DS, GradedItem, StudentAnswers } from '../engine/score'
import { scoreStudent, type ScoreResult } from '../engine/score'
import { assignStudentQuestions } from './exam-assign'
import type { AnswerRecord } from './exam-db'

function mergeTeacherSources(sources: TeacherExamSource[], soCau?: SoCauMoiPhan) {
  return {
    soCau,
    phanI: sources.flatMap((s) => s.phanI),
    phanII: sources.flatMap((s) => s.phanII),
    phanIII: sources.flatMap((s) => s.phanIII),
  }
}

export interface GradedSubmission {
  score: ScoreResult
  key: AnswerKey
  studentAnswers: StudentAnswers
  // Đúng/sai từng câu theo đúng thứ tự hiển thị cho em (displayIdx) — dùng
  // để hiện popup điểm ngay, KHÔNG suy diễn lý do sai, chỉ nêu đúng dữ kiện.
  wrongPhanI: number[]
  wrongPhanII: number[]
  wrongPhanIII: number[]
}

type KeyBankLike = {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
  /** Số câu mỗi phần của ca (màn Rút đề ghi). Thiếu ⇒ luật 18/4/6 cũ. */
  soCau?: SoCauMoiPhan
}

/** Lõi chấm điểm — nhận thẳng bank đã gộp CÓ đáp án (dùng cho cả 2 nơi: máy
 * thầy chấm lại từ TeacherExamSource[], và máy học sinh chấm ngay từ keyBank
 * server trả về sau khi nộp). */
export function gradeFromKeyBank(bank: KeyBankLike, maCa: string, sbd: string, submitted: AnswerRecord): GradedSubmission {
  // assignStudentQuestions chỉ cần {id, text, choices/ideas} — TeacherExamSource là
  // superset đúng shape đó nên dùng thẳng được, không cần tách riêng phiên bản Public.
  const assignment = assignStudentQuestions(bank, maCa, sbd)

  const key: AnswerKey = {
    madeThi: maCa,
    phanI: assignment.phanI.map((a) => (a.question as TeacherMcqQuestion).correct),
    phanII: assignment.phanII.map((a) => (a.question as TeacherTrueFalseQuestion).correct),
    phanIII: assignment.phanIII.map((a) => (a.question as TeacherShortAnswerQuestion).correct),
  }

  const phanI: GradedItem<Choice>[] = assignment.phanI.map((a) => ({
    value: (submitted.phanI[a.qid] as Choice | undefined) ?? null,
    flag: null,
  }))
  const phanII: GradedItem<DS>[][] = assignment.phanII.map((a) => {
    const row = submitted.phanII[a.qid] ?? [null, null, null, null]
    return row.map((v) => ({ value: (v as DS | null) ?? null, flag: null }))
  })
  const phanIII: GradedItem<string>[] = assignment.phanIII.map((a) => ({
    value: submitted.phanIII[a.qid] ?? null,
    flag: null,
  }))

  const studentAnswers: StudentAnswers = { sbd, madeThi: maCa, phanI, phanII, phanIII }
  const score = scoreStudent(studentAnswers, key)

  const wrongPhanI = phanI.map((it, i) => (it.value !== key.phanI[i] ? i + 1 : -1)).filter((n) => n > 0)
  const wrongPhanII = phanII
    .map((row, i) => (row.some((it, j) => it.value !== key.phanII[i][j]) ? i + 1 : -1))
    .filter((n) => n > 0)
  const norm = (s: string) => s.trim().replace(',', '.')
  const wrongPhanIII = phanIII
    .map((it, i) => (norm(it.value ?? '') !== norm(key.phanIII[i]) ? i + 1 : -1))
    .filter((n) => n > 0)

  return { score, key, studentAnswers, wrongPhanI, wrongPhanII, wrongPhanIII }
}

export function gradeSubmissionFull(
  teacherSources: TeacherExamSource[],
  maCa: string,
  sbd: string,
  submitted: AnswerRecord,
  soCau?: SoCauMoiPhan,
): GradedSubmission {
  return gradeFromKeyBank(mergeTeacherSources(teacherSources, soCau), maCa, sbd, submitted)
}
