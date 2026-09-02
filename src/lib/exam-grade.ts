// Chấm bài kiểm tra tại lớp — TÁI TẠO lại đúng bộ câu đã gán cho từng học
// sinh (assignStudentQuestions với cùng mãCa+sbd luôn ra cùng 1 kết quả, xem
// exam-assign.ts), rồi dùng đúng engine/score.ts đang chấm OMR — không viết
// logic chấm điểm lần 2.
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import type { AnswerKey, Choice, DS, GradedItem, StudentAnswers } from '../engine/score'
import { scoreStudent, type ScoreResult } from '../engine/score'
import { assignStudentQuestions } from './exam-assign'
import type { AnswerRecord } from './exam-db'

function mergeTeacherSources(sources: TeacherExamSource[]) {
  return {
    phanI: sources.flatMap((s) => s.phanI),
    phanII: sources.flatMap((s) => s.phanII),
    phanIII: sources.flatMap((s) => s.phanIII),
  }
}

export interface GradedSubmission {
  score: ScoreResult
  key: AnswerKey
  studentAnswers: StudentAnswers
}

export function gradeSubmissionFull(
  teacherSources: TeacherExamSource[],
  maCa: string,
  sbd: string,
  submitted: AnswerRecord,
): GradedSubmission {
  const bank = mergeTeacherSources(teacherSources)
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
  return { score, key, studentAnswers }
}
