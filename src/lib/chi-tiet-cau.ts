// CHI TIẾT TỪNG CÂU của một lượt thi (QUANLYCATHI.md mục 5) — dựng từ kết quả
// chấm (gradeFromKeyBank) + bank CÓ đáp án (để lấy chuyên đề, mức độ, đáp án
// đúng) + giây làm từng câu em gửi lúc nộp. Thuần logic, dùng chung cho máy
// thầy (màn Theo dõi) và máy em (khi ca công bố điểm). Không suy diễn: câu
// thiếu chuyên đề/mức độ để trống.
import type { TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { assignStudentQuestions } from './exam-assign'
import type { BaiGhiDiem, ChiTietCauRow } from './exam-api'
import type { AnswerRecord } from './exam-db'
import type { GradedSubmission } from './exam-grade'

type KeyBankLike = {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
}

/** Đếm số giây của một câu — làm tròn, không âm; thiếu → null (không ghi 0 giả). */
function giayCua(giayCau: Record<string, number> | null | undefined, qid: string): number | null {
  const v = giayCau?.[qid]
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null
  return Math.round(v)
}

export function taoChiTietCau(bank: KeyBankLike, maCa: string, sbd: string, answers: AnswerRecord, giayCau: Record<string, number> | null | undefined): ChiTietCauRow[] {
  const asg = assignStudentQuestions(bank, maCa, sbd)
  const rows: ChiTietCauRow[] = []
  const norm = (s: string) => s.trim().replace(',', '.')
  asg.phanI.forEach((a, i) => {
    const q = a.question as TeacherMcqQuestion
    const chon = answers.phanI[a.qid] ?? ''
    rows.push({ phan: 'I', soCau: i + 1, qid: a.qid, chuyenDe: q.chuyenDe ?? '', mucDo: q.mucDo ?? '', dapAnChon: chon, dapAnDung: q.correct, dungSai: chon ? chon === q.correct : false, giay: giayCua(giayCau, a.qid) })
  })
  asg.phanII.forEach((a, i) => {
    const q = a.question as TeacherTrueFalseQuestion
    const row = answers.phanII[a.qid] ?? [null, null, null, null]
    const chon = row.map((v) => v ?? '-').join('')
    const dung = q.correct.join('')
    rows.push({ phan: 'II', soCau: i + 1, qid: a.qid, chuyenDe: q.chuyenDe ?? '', mucDo: q.mucDo ?? '', dapAnChon: chon, dapAnDung: dung, dungSai: chon === dung, giay: giayCua(giayCau, a.qid) })
  })
  asg.phanIII.forEach((a, i) => {
    const q = a.question as TeacherShortAnswerQuestion
    const chon = answers.phanIII[a.qid] ?? ''
    rows.push({ phan: 'III', soCau: i + 1, qid: a.qid, chuyenDe: q.chuyenDe ?? '', mucDo: q.mucDo ?? '', dapAnChon: chon, dapAnDung: q.correct, dungSai: chon.trim() ? norm(chon) === norm(q.correct) : false, giay: giayCua(giayCau, a.qid) })
  })
  return rows
}

/** Gói 1 lượt để gửi ghiDiem: điểm từng phần + tổng (từ engine chấm) + chi tiết câu. */
export function taoBaiGhiDiem(
  bank: KeyBankLike,
  maCa: string,
  sbd: string,
  lanThu: number,
  answers: AnswerRecord,
  graded: GradedSubmission,
  giayCau: Record<string, number> | null | undefined,
  idThietBi?: string,
): BaiGhiDiem {
  return {
    sbd,
    lanThu,
    idThietBi,
    diem: { I: graded.score.phanIScore, II: graded.score.phanIIScore, III: graded.score.phanIIIScore, tong: graded.score.total },
    cau: taoChiTietCau(bank, maCa, sbd, answers, giayCau),
  }
}
