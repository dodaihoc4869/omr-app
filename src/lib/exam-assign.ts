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
  /** XÁO BỐN Ý PHẦN II — `yPerm[viTríHiểnThị] = chỉSốÝGốc(0..3)`.
   *
   * Cùng một cơ chế với `choicePerm` của Phần I, và cùng một chốt an toàn: đáp
   * án em chọn LUÔN được cất theo THỨ TỰ Ý GỐC, chỉ chỗ HIỆN RA mới xáo. Nhờ
   * vậy `correct` (đánh theo thứ tự gốc), `taoChiTietCau`, và toàn bộ đường chấm
   * điểm KHÔNG phải đổi một dòng nào — đây là chỗ sai một tí là chấm sai cả lớp.
   *
   * Ca cũ mở trước bản này không có trường ⇒ chỗ vẽ rơi về `[0,1,2,3]`, tức
   * đúng hành vi cũ, không đổi điểm ca đã gửi phụ huynh. */
  yPerm: number[]
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

export function pick<T extends { id: string }>(arr: T[], need: number, seedTag: string): T[] {
  const n = arr.length
  if (n === 0) return []
  const k = Math.min(need, n)
  const perm = seededPermutation(n, hashSeed(seedTag))
  return perm.slice(0, k).map((i) => arr[i])
}

function soDuong(v: unknown, macDinh: number): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : macDinh
}

/** Bank ở đây có thể là PublicExamBank (học sinh) hoặc TeacherExamSource đã gộp (thầy chấm lại) — chỉ cần đúng shape id/text/choices/ideas.
 *
 * Số câu lấy: `bank.soCau` do màn Rút đề ghi vào lúc mở ca. Ca cũ không có
 * trường này nên rơi về hằng số 18/4/6 như trước — đổi thẳng sang "lấy hết" là
 * mọi ca cũ có kho lớn hơn 28 câu đột nhiên đổi số câu, tức là chấm lại ra điểm
 * khác điểm đã gửi phụ huynh. */
export function assignStudentQuestions(bank: PublicExamBank, maCa: string, sbd: string): StudentAssignment {
  const base = `${maCa}:${sbd}`
  const can = bank.soCau

  // CA CHẨN ĐOÁN — bộ câu của em ĐÃ ĐƯỢC CHỌN sẵn theo hồ sơ em ấy, không cắt
  // lại theo seed. Cắt lại là hỏng cả mục đích: câu cũ phải đúng chuyên đề đến
  // hạn đo, còn lõi chung phải giống hệt nhau ở mọi em mới tính được doChum.
  // Em không có tên trong bảng (vào muộn, ngoài danh sách) rơi về cách cũ.
  const rawBo = bank.boTheoEm as Record<string, unknown> | undefined
  const boMap = (rawBo && typeof rawBo === 'object' && rawBo.bo && typeof rawBo.bo === 'object' && !Array.isArray(rawBo.bo)
    ? rawBo.bo
    : rawBo) as Record<string, string[]> | undefined
  const rieng = boMap?.[sbd] ?? (bank.boTheoEm as Record<string, string[]> | undefined)?.[sbd]
  if (rieng && rieng.length) {
    const cua = new Set(rieng)
    // BÙ CHO ĐỦ CHỈ TIÊU TỪNG PHẦN (thầy bắt được 14/09: đặt 8 trắc nghiệm mà
    // màn làm bài hiện "PHẦN I — Trắc nghiệm (4 câu)").
    //
    // Bản trước chỉ LỌC gói đề theo bản đồ `boTheoEm` rồi trả về luôn. Bản đồ
    // thiếu câu nào — câu ấy không nằm trong gói đề đã phát, hoặc lúc dựng bản
    // đồ kho còn thiếu — thì em nhận thiếu đúng chừng ấy câu, và máy không nói
    // một tiếng. Đó là "lặng lẽ sai": em làm bài 4 câu trong khi thầy ra 8, còn
    // biểu điểm trên màn thì lại chia theo 4.
    //
    // Luật đúng của thầy: câu KHẮC PHỤC LỖI SAI vào trước (30% số câu em sai ở
    // ca trước), chưa đủ chỉ tiêu thì RÚT TIẾP CÂU MỚI ngay trong gói đề của ca
    // — tức chính kho thầy đã tick. Không đi kho khác, không bịa câu.
    //
    // Hai chốt an toàn:
    //   · Ca KHÔNG ghi `soCau` (ca mở trước bản có trường này) thì KHÔNG bù, giữ
    //     nguyên từng câu của ca cũ — chấm lại lệch là điểm đã gửi phụ huynh hoá
    //     sai.
    //   · Kho ít hơn chỉ tiêu thì trả đúng những gì có. Thiếu thì thiếu, cấm lấy
    //     lại câu đã có cho tròn con số.
    // Phần bù bốc theo seed riêng từng em nên chấm lại ra đúng bộ cũ, và hai em
    // không nhận cùng một phần bù.
    const buChoDu = <T extends { id: string }>(ds: T[], canPhan: unknown, tag: string): T[] => {
      const trong = ds.filter((q) => cua.has(q.id))
      const k = Number(canPhan)
      if (!Number.isFinite(k) || k <= 0 || trong.length >= k) return trong
      const con = ds.filter((q) => !cua.has(q.id))
      const them = new Set(pick(con, k - trong.length, `${base}:bu:${tag}`).map((q) => q.id))
      // GIỮ THỨ TỰ KHO. Nối thẳng câu bù vào sau là dồn hết câu khắc phục lên
      // đầu đề — em nhìn một cái là biết bốn câu đầu chính là bốn câu mình sai
      // buổi trước, và như thế thì không còn là bài kiểm tra nữa.
      return ds.filter((q) => cua.has(q.id) || them.has(q.id))
    }
    return {
      phanI: buChoDu(bank.phanI, can?.I, 'I').map((q) => ({ qid: q.id, question: q, choicePerm: seededPermutation(4, hashSeed(`choice:${base}:${q.id}`)) })),
      phanII: buChoDu(bank.phanII, can?.II, 'II').map((q) => ({ qid: q.id, question: q, yPerm: seededPermutation(4, hashSeed(`y:${base}:${q.id}`)) })),
      phanIII: buChoDu(bank.phanIII, can?.III, 'III').map((q) => ({ qid: q.id, question: q })),
    }
  }

  const phanIQs = pick(bank.phanI, soDuong(can?.I, PHAN_I_NEED), `${base}:phanI`)
  const phanIIQs = pick(bank.phanII, soDuong(can?.II, PHAN_II_NEED), `${base}:phanII`)
  const phanIIIQs = pick(bank.phanIII, soDuong(can?.III, PHAN_III_NEED), `${base}:phanIII`)

  return {
    phanI: phanIQs.map((q) => ({
      qid: q.id,
      question: q,
      choicePerm: seededPermutation(4, hashSeed(`choice:${base}:${q.id}`)),
    })),
    phanII: phanIIQs.map((q) => ({ qid: q.id, question: q, yPerm: seededPermutation(4, hashSeed(`y:${base}:${q.id}`)) })),
    phanIII: phanIIIQs.map((q) => ({ qid: q.id, question: q })),
  }
}
