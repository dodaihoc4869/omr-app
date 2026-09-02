// Ngân hàng câu hỏi: thầy tải lên BAO NHIÊU đề tuỳ ý (mỗi đề có thể nhiều câu
// hơn mức cần dùng), app GỘP lại thành 1 ngân hàng rồi RANDOM CHỌN + xáo thứ
// tự cho từng học sinh — mỗi em nhận một tập câu khác nhau hoàn toàn, không
// chỉ đổi thứ tự của cùng 1 đề.
//
// Phân biệt 2 dạng dữ liệu quan trọng vì lý do an toàn:
//   - "Teacher*" (có đáp án đúng) — CHỈ lưu trên máy thầy (IndexedDB), không
//     bao giờ publish lên server/gửi cho học sinh.
//   - "Public*" (KHÔNG có đáp án) — dạng duy nhất được gửi lên Apps Script /
//     tải xuống máy học sinh.

export interface McqQuestion {
  id: string
  text: string
  choices: [string, string, string, string] // ứng A,B,C,D theo thứ tự GỐC (chưa xáo)
}
export interface TeacherMcqQuestion extends McqQuestion {
  correct: 'A' | 'B' | 'C' | 'D'
}

export interface TrueFalseQuestion {
  id: string
  text: string
  ideas: [string, string, string, string] // ý a,b,c,d theo thứ tự GỐC, KHÔNG xáo
}
export interface TeacherTrueFalseQuestion extends TrueFalseQuestion {
  correct: ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']
}

export interface ShortAnswerQuestion {
  id: string
  text: string
}
export interface TeacherShortAnswerQuestion extends ShortAnswerQuestion {
  correct: string
}

export interface PublicExamBank {
  phanI: McqQuestion[]
  phanII: TrueFalseQuestion[]
  phanIII: ShortAnswerQuestion[]
}

/** Đề thầy soạn (1 lần tải lên = 1 TeacherExamSource), có đáp án — chỉ ở máy thầy. */
export interface TeacherExamSource {
  maDe: string // tên/định danh đề gốc thầy đặt, dùng để ghép id câu hỏi cho không trùng giữa các đề
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
}

export const PHAN_I_NEED = 18
export const PHAN_II_NEED = 4
export const PHAN_III_NEED = 6

export function validateTeacherSource(c: TeacherExamSource): string[] {
  const errors: string[] = []
  if (!c.maDe.trim()) errors.push('Thiếu tên/mã đề')
  if (c.phanI.length === 0) errors.push('Phần I: chưa có câu nào')
  if (c.phanII.length === 0) errors.push('Phần II: chưa có câu nào')
  if (c.phanIII.length === 0) errors.push('Phần III: chưa có câu nào')
  c.phanI.forEach((q, i) => {
    if (!q.text.trim()) errors.push(`Phần I câu ${i + 1}: thiếu đề bài`)
    q.choices.forEach((ch, j) => {
      if (!ch.trim()) errors.push(`Phần I câu ${i + 1} lựa chọn ${'ABCD'[j]}: thiếu nội dung`)
    })
    if (!q.correct) errors.push(`Phần I câu ${i + 1}: chưa đánh dấu đáp án đúng (đặt * trước lựa chọn đúng)`)
  })
  c.phanII.forEach((q, i) => {
    if (!q.text.trim()) errors.push(`Phần II câu ${i + 1}: thiếu đề bài`)
    q.ideas.forEach((idea, j) => {
      if (!idea.trim()) errors.push(`Phần II câu ${i + 1} ý ${'abcd'[j]}: thiếu nội dung`)
    })
    if (q.correct.some((v) => !v)) errors.push(`Phần II câu ${i + 1}: chưa đánh dấu đủ Đ/S cho cả 4 ý`)
  })
  c.phanIII.forEach((q, i) => {
    if (!q.text.trim()) errors.push(`Phần III câu ${i + 1}: thiếu đề bài`)
    if (!q.correct.trim()) errors.push(`Phần III câu ${i + 1}: chưa có đáp án (thêm dòng "=> đáp án")`)
  })
  return errors
}

/** Gộp nhiều đề đã tải + xoá đáp án — đây mới là thứ được publish lên server. */
export function mergeAndStrip(sources: TeacherExamSource[]): PublicExamBank {
  return {
    phanI: sources.flatMap((s) => s.phanI.map(({ id, text, choices }) => ({ id, text, choices }))),
    phanII: sources.flatMap((s) => s.phanII.map(({ id, text, ideas }) => ({ id, text, ideas }))),
    phanIII: sources.flatMap((s) => s.phanIII.map(({ id, text }) => ({ id, text }))),
  }
}

export function bankSizeWarning(sources: TeacherExamSource[]): string | null {
  const totalI = sources.reduce((n, s) => n + s.phanI.length, 0)
  const totalII = sources.reduce((n, s) => n + s.phanII.length, 0)
  const totalIII = sources.reduce((n, s) => n + s.phanIII.length, 0)
  const problems: string[] = []
  if (totalI < PHAN_I_NEED) problems.push(`Phần I chỉ có ${totalI}/${PHAN_I_NEED} câu trong ngân hàng đã chọn`)
  if (totalII < PHAN_II_NEED) problems.push(`Phần II chỉ có ${totalII}/${PHAN_II_NEED} câu trong ngân hàng đã chọn`)
  if (totalIII < PHAN_III_NEED) problems.push(`Phần III chỉ có ${totalIII}/${PHAN_III_NEED} câu trong ngân hàng đã chọn`)
  if (problems.length === 0) return null
  return `${problems.join('; ')} — mỗi học sinh vẫn thi được nhưng sẽ trùng bớt câu với nhau vì không đủ để random hết khác nhau. Tải thêm đề để tăng độ đa dạng.`
}
