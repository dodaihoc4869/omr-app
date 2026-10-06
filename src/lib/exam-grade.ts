// Chấm bài kiểm tra tại lớp — TÁI TẠO lại đúng bộ câu đã gán cho từng học
// sinh (assignStudentQuestions với cùng mãCa+sbd luôn ra cùng 1 kết quả, xem
// exam-assign.ts), rồi dùng đúng engine/score.ts đang chấm OMR — không viết
// logic chấm điểm lần 2.
import type { SoCauMoiPhan, TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import type { AnswerKey, Choice, DS, GradedItem, StudentAnswers } from '../engine/score'
import { scoreStudent, type ScoreResult } from '../engine/score'
import { assignStudentQuestions } from './exam-assign'
import { giaiBoCauEm, lamPhangBo, LoiBoCauError, type BoCauChuan } from './bo-cau-chuan'
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
  /** Bộ câu CHUẨN đã dùng để chấm (nguồn + cảnh báo). Có khi chấm qua `gradeSubmissionFull`; chỗ dựng chi tiết câu dùng lại đúng `qids` này để điểm và bảng chi tiết cùng một bộ câu. */
  boCau?: BoCauChuan
}

type KeyBankLike = {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
  /** Số câu mỗi phần của ca (màn Rút đề ghi). Thiếu ⇒ luật 18/4/6 cũ. */
  soCau?: SoCauMoiPhan
  /** Ca đề riêng từng em: sbd → qid (hoặc dạng gói `{ bo: { sbd: qid[] } }`). Thiếu ⇒ cắt theo luật hash như cũ. */
  boTheoEm?: Record<string, string[]> | Record<string, unknown>
}

/** BỘ CÂU CỦA EM — nguồn sự thật cho cả chấm điểm lẫn màn xem lại.
 *
 * Trả về danh sách qid ĐÃ PHÁT cho em. Thiếu (bên gọi không có) thì
 * `gradeFromKeyBank` rơi về `keyBank.boTheoEm`, cuối cùng mới tới luật hash cũ. */
export type BoCauCuaEm = string[] | null | undefined

/** Lõi chấm điểm — nhận thẳng bank đã gộp CÓ đáp án (dùng cho cả 2 nơi: máy
 * thầy chấm lại từ TeacherExamSource[], và máy học sinh chấm ngay từ keyBank
 * server trả về sau khi nộp).
 *
 * `boCuaEm` LÀ THAM SỐ QUAN TRỌNG NHẤT, dù nó không bắt buộc (thầy bắt được
 * 10/09 tối, ca 234641).
 *
 * Không truyền nó thì hàm này rơi về `assignStudentQuestions`, tức RÚT LẠI bộ
 * câu bằng `hash(mãCa + SBD)` trên kho hiện tại. Với ca đề riêng — rút 8 câu từ
 * kho 26 câu — bộ rút lại KHÁC HẲN bộ em đã làm, nên máy chấm em theo những câu
 * em chưa từng thấy. Điểm ra thấp mà vẫn trông như điểm thật:
 *
 *     Trần Minh Đăng  đúng 5,69  ·  máy em tự chấm ra 2,56
 *     Lưu Ngọc Tuân   đúng 7,56  ·  máy em tự chấm ra 1,88
 *
 * `keyBank` máy chủ trả về sau khi nộp KHÔNG kèm `boTheoEm`, nên máy em không
 * có đường nào tự biết — bên gọi phải đưa vào. Xem `boCauTuBaiLam`. */
export function gradeFromKeyBank(bank: KeyBankLike, maCa: string, sbd: string, submitted: AnswerRecord, boCuaEm?: BoCauCuaEm): GradedSubmission {
  // assignStudentQuestions chỉ cần {id, text, choices/ideas} — TeacherExamSource là
  // superset đúng shape đó nên dùng thẳng được, không cần tách riêng phiên bản Public.
  const assignment = assignStudentQuestions(
    boCuaEm && boCuaEm.length > 0 ? { ...bank, boTheoEm: { ...(bank.boTheoEm ?? {}), [sbd]: boCuaEm } } : bank,
    maCa,
    sbd,
  )

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

  // Câu sai lấy từ chính kết quả chấm. scoreStudent đã dùng
  // normalizeNumericAnswer cho Phần III; so lại tại đây dễ lệch với điểm.
  const sai = (items: ScoreResult['phanI']['items']) => items.filter((x) => !x.correct).map((x) => x.index)
  const wrongPhanI = sai(score.phanI.items)
  const wrongPhanII = sai(score.phanII.items)
  const wrongPhanIII = sai(score.phanIII.items)

  return { score, key, studentAnswers, wrongPhanI, wrongPhanII, wrongPhanIII }
}

export function gradeSubmissionFull(
  teacherSources: TeacherExamSource[],
  maCa: string,
  sbd: string,
  submitted: AnswerRecord,
  soCau?: SoCauMoiPhan,
  /** CA ĐỀ RIÊNG TỪNG EM: bản đồ sbd → qid của ca. Thiếu ⇒ cắt câu theo luật
   * hash như mọi ca thường, không đổi một chữ nào của ca cũ. Truyền nhầm bản
   * đồ của ca khác là chấm sai, nên chỗ gọi phải lấy đúng bản cất theo mã ca. */
  boTheoEm?: Record<string, string[]> | Record<string, unknown>,
  /** Giây từng câu của lượt — dấu vết em ĐÃ XEM câu nào, để kiểm bộ câu khớp bài làm. Thiếu thì chỉ xét câu đã trả lời. */
  giayCau?: Record<string, number> | null,
): GradedSubmission {
  const bank = { ...mergeTeacherSources(teacherSources, soCau), boTheoEm }
  // MỘT NƠI quyết bộ câu của em (bo-cau-chuan.ts): có bản ghi thì dùng đúng nó và KHÔNG bù câu lạ; bản ghi không khớp bài làm
  // hoặc thiếu câu trong kho ⇒ ném `LoiBoCauError` (chỗ gọi giữ điểm cũ, không ghi đè bằng số đoán).
  const boCau = giaiBoCauEm(bank, maCa, sbd, { dapAn: submitted, giayCau }, lamPhangBo(boTheoEm)[sbd])
  if (boCau.loi) throw new LoiBoCauError(boCau.loi)
  return { ...gradeFromKeyBank(bank, maCa, sbd, submitted, boCau.qids), boCau }
}
