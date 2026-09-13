// CHI TIẾT TỪNG CÂU của một lượt thi (QUANLYCATHI.md mục 5) — dựng từ kết quả
// chấm (gradeFromKeyBank) + bank CÓ đáp án (để lấy chuyên đề, mức độ, đáp án
// đúng) + giây làm từng câu em gửi lúc nộp. Thuần logic, dùng chung cho máy
// thầy (màn Theo dõi) và máy em (khi ca công bố điểm). Không suy diễn: câu
// thiếu chuyên đề/mức độ để trống.
import type { TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { normalizeNumericAnswer } from '../engine/score'
import { assignStudentQuestions } from './exam-assign'
import type { BaiGhiDiem, ChiTietCauRow } from './exam-api'
import type { AnswerRecord } from './exam-db'
import type { GradedSubmission } from './exam-grade'
import { boCauTuBaiLam, type SoCauMoiPhan } from './bo-cau-tu-bai-lam'

type KeyBankLike = {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
  /** Ca đề riêng từng em: sbd → qid, hoặc dạng gói { bo: { sbd: qid[] } }.
   * THIẾU TRƯỜNG NÀY LÀ DỰNG SAI BẢNG — em nhận bộ câu theo bản đồ mà máy dựng lại
   * bằng luật hash thì ra câu của người khác. Thiếu ⇒ dựng lại từ bài làm hoặc
   * cắt theo luật hash như mọi ca thường. */
  boTheoEm?: Record<string, unknown>
  soCau?: SoCauMoiPhan
}

/** Đếm số giây của một câu — làm tròn, không âm; thiếu → null (không ghi 0 giả). */
function giayCua(giayCau: Record<string, number> | null | undefined, qid: string): number | null {
  const v = giayCau?.[qid]
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return null
  return Math.round(v)
}

export function taoChiTietCau(
  bank: KeyBankLike,
  maCa: string,
  sbd: string,
  answers: AnswerRecord,
  giayCau: Record<string, number> | null | undefined,
  boCuaEm?: string[] | null,
): ChiTietCauRow[] {
  let bo = boCuaEm
  if (!bo || bo.length === 0) {
    const rawBo = bank.boTheoEm as Record<string, unknown> | undefined
    const boMap = (rawBo && typeof rawBo === 'object' && rawBo.bo && typeof rawBo.bo === 'object' && !Array.isArray(rawBo.bo)
      ? rawBo.bo
      : rawBo) as Record<string, string[]> | undefined
    const rieng = boMap?.[sbd] ?? (bank.boTheoEm as Record<string, string[]> | undefined)?.[sbd]
    if (rieng && rieng.length > 0) {
      bo = rieng
    } else {
      // Kiểm tra xem bài làm có câu nào nằm ngoài bộ câu mặc định của assignStudentQuestions không
      const asgMacDinh = assignStudentQuestions({ ...bank, soCau: bank.soCau ?? undefined }, maCa, sbd)
      const qidMacDinh = new Set([
        ...asgMacDinh.phanI.map((x) => x.qid),
        ...asgMacDinh.phanII.map((x) => x.qid),
        ...asgMacDinh.phanIII.map((x) => x.qid),
      ])
      const coDau =
        (answers &&
          (Object.keys(answers.phanI || {}).length > 0 ||
            Object.keys(answers.phanII || {}).length > 0 ||
            Object.keys(answers.phanIII || {}).length > 0)) ||
        (giayCau && Object.keys(giayCau).length > 0)
      if (coDau) {
        const dauVet = [
          ...Object.keys(answers?.phanI || {}),
          ...Object.keys(answers?.phanII || {}),
          ...Object.keys(answers?.phanIII || {}),
          ...Object.keys(giayCau || {}),
        ]
        const coCauNgoai = dauVet.some((q) => !qidMacDinh.has(q))
        if (coCauNgoai) {
          bo = boCauTuBaiLam(bank, maCa, sbd, answers, giayCau, bank.soCau)
        }
      }
    }
  }

  const kho = bo && bo.length > 0 ? { ...bank, boTheoEm: { [sbd]: bo }, soCau: bank.soCau ?? undefined } : { ...bank, soCau: bank.soCau ?? undefined }
  const asg = assignStudentQuestions(kho, maCa, sbd)
  const rows: ChiTietCauRow[] = []
  // MỘT NGUỒN SỰ THẬT: luật so đáp án Phần III sống ở `normalizeNumericAnswer`.
  // Sáu bản sao rời nhau là sáu chỗ để lệch, và lệch ở đây nghĩa là chấm sai.
  const norm = normalizeNumericAnswer
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
  boCuaEm?: string[] | null,
): BaiGhiDiem {
  return {
    sbd,
    lanThu,
    idThietBi,
    diem: { I: graded.score.phanIScore, II: graded.score.phanIIScore, III: graded.score.phanIIIScore, tong: graded.score.total },
    cau: taoChiTietCau(bank, maCa, sbd, answers, giayCau, boCuaEm),
  }
}
