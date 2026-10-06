// CHI TIẾT TỪNG CÂU của một lượt thi (QUANLYCATHI.md mục 5) — dựng từ kết quả
// chấm (gradeFromKeyBank) + bank CÓ đáp án (để lấy chuyên đề, mức độ, đáp án
// đúng) + giây làm từng câu em gửi lúc nộp. Thuần logic, dùng chung cho máy
// thầy (màn Theo dõi) và máy em (khi ca công bố điểm). Không suy diễn: câu
// thiếu chuyên đề/mức độ để trống.
import type { TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../data/examContent'
import { khopPhanIII } from './cham-so'
import { assignStudentQuestions } from './exam-assign'
import type { BaiGhiDiem, ChiTietCauRow } from './exam-api'
import type { AnswerRecord } from './exam-db'
import type { GradedSubmission } from './exam-grade'
import type { SoCauMoiPhan } from './bo-cau-tu-bai-lam'
import { giaiBoCauEm, lamPhangBo, LoiBoCauError } from './bo-cau-chuan'

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

/**
 * BỘ CÂU + DÒNG CHI TIẾT của một em. MỘT NƠI quyết bộ câu (`giaiBoCauEm`, bo-cau-chuan.ts) — cùng bộ với chấm điểm, nên điểm và bảng chi tiết
 * không bao giờ dựng trên hai bộ câu khác nhau (bản cũ tự đổi sang "dựng từ bài làm" ngay tại đây khi bài làm lệch luật hash, còn điểm vẫn tính theo hash).
 *
 * `boCuaEm` do chỗ gọi đã CHỐT (máy em: đúng bộ câu vừa bày ra; máy thầy: bộ chuẩn đã dùng để chấm) thì dùng thẳng, không xét lại.
 * Ném `LoiBoCauError` khi bộ câu không khớp bài làm / thiếu câu trong kho: THÀ KHÔNG CÓ DÒNG còn hơn dòng sai.
 */
export function taoChiTietCauHoacLoi(
  bank: KeyBankLike,
  maCa: string,
  sbd: string,
  answers: AnswerRecord,
  giayCau: Record<string, number> | null | undefined,
  boCuaEm?: string[] | null,
): ChiTietCauRow[] {
  let qids: string[] | null = boCuaEm && boCuaEm.length > 0 ? boCuaEm : null
  if (!qids) {
    const boCau = giaiBoCauEm(bank as Parameters<typeof giaiBoCauEm>[0], maCa, sbd, { dapAn: answers, giayCau }, lamPhangBo(bank.boTheoEm)[sbd])
    if (boCau.loi) throw new LoiBoCauError(boCau.loi)
    qids = boCau.qids
  }
  const kho = qids ? { ...bank, boTheoEm: { [sbd]: qids }, soCau: bank.soCau ?? undefined } : { ...bank, soCau: bank.soCau ?? undefined }
  const asg = assignStudentQuestions(kho, maCa, sbd)
  const rows: ChiTietCauRow[] = []
  // MỘT NGUỒN SỰ THẬT: luật so đáp án Phần III là `khopPhanIII` (src/lib/cham-so.ts) — y hệt bộ chấm điểm.
  // Sáu bản sao rời nhau là sáu chỗ để lệch, và lệch ở đây nghĩa là chấm sai.
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
    rows.push({ phan: 'III', soCau: i + 1, qid: a.qid, chuyenDe: q.chuyenDe ?? '', mucDo: q.mucDo ?? '', dapAnChon: chon, dapAnDung: q.correct, dungSai: khopPhanIII(chon, q.correct), giay: giayCua(giayCau, a.qid) })
  })
  return rows
}

/** Như `taoChiTietCauHoacLoi` nhưng KHÔNG ném: bộ câu lỗi ⇒ trả MẢNG RỖNG (các chỗ gom báo cáo bỏ qua em ấy, không hỏng cả bảng). Chỗ GHI điểm phải dùng bản ném. */
export function taoChiTietCau(
  bank: KeyBankLike,
  maCa: string,
  sbd: string,
  answers: AnswerRecord,
  giayCau: Record<string, number> | null | undefined,
  boCuaEm?: string[] | null,
): ChiTietCauRow[] {
  try {
    return taoChiTietCauHoacLoi(bank, maCa, sbd, answers, giayCau, boCuaEm)
  } catch (e) {
    if (e instanceof LoiBoCauError) return []
    throw e
  }
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
    // Dùng bản NÉM LỖI: chấm xong mà không dựng được dòng chi tiết thì KHÔNG được gửi gói rỗng (máy chủ xoá dòng cũ rồi ghi lại — mất sạch chi tiết đã có).
    // Bộ câu mặc định = bộ chuẩn `graded` đã dùng để chấm ⇒ điểm và dòng chi tiết cùng một bộ.
    cau: taoChiTietCauHoacLoi(bank, maCa, sbd, answers, giayCau, boCuaEm ?? graded.boCau?.qids ?? null),
  }
}
