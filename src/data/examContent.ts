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

/**
 * Bảng số liệu / đồ thị đính kèm câu hỏi — được TÁI TẠO CHÍNH XÁC (không suy
 * đoán): bảng là dữ liệu thô do thầy gõ (dòng [BANG]...[/BANG] trong đề),
 * đồ thị/hình vẽ là ẢNH THẦY UPLOAD hiển thị nguyên vẹn — không có tính năng
 * nào "vẽ lại" đồ thị bằng AI vì không thể đảm bảo đúng 100% số liệu gốc.
 */
/** Vị trí nhúng ảnh trong thẻ câu: sau đề bài · sau phương án A-D (theo chữ
 * cái GỐC, đi theo phương án khi xáo) · sau ý a-d (Phần II) · cuối câu. */
export type ViTriHinh = 'sau_de' | 'sau_pa_A' | 'sau_pa_B' | 'sau_pa_C' | 'sau_pa_D' | 'sau_y_a' | 'sau_y_b' | 'sau_y_c' | 'sau_y_d' | 'cuoi_cau'

/** Ảnh cắt từ file đề gốc (200 DPI, nền trắng, mép 8px) cho 4 loại nội dung
 * KHÔNG render bằng KaTeX: sơ đồ phản ứng nhiều mũi tên, công thức cấu tạo,
 * bảng phức tạp (>5 cột/ô gộp), đồ thị/mô hình thí nghiệm. `src` là data
 * URL base64 — nằm trong IndexedDB máy thầy/máy em, không đi qua git. */
export interface HinhAnh {
  src: string
  viTri: ViTriHinh
  alt?: string
}

export interface QuestionMedia {
  table?: string[][] // hàng đầu là tiêu đề cột
  imageDataUrl?: string // (cũ) 1 ảnh đồ thị/hình vẽ, hiện sau đề bài — dữ liệu mới dùng hinhAnh
  hinhAnh?: HinhAnh[]
  /** Đọc bằng thị giác nhưng KHÔNG chắc chắn 100% (chữ mờ, công thức lạ...)
   * — set true qua luồng "Nhập đề đã xử lý sẵn (JSON)". Vẫn lưu vào ngân
   * hàng bình thường (không chặn), chỉ để đánh dấu thầy nên xem lại. */
  canXem?: boolean
}

/** `text`/`choices` là chữ đề (mhchem). `thanCauImg`/`choiceImgs` (cũ) là ảnh
 * cắt cả câu từ PDF — có ảnh thì ưu tiên hiện ảnh; dữ liệu mới từ pipeline
 * dùng chữ + HinhAnh nhúng đúng vị trí. `thanCauImg`/`choiceImgs` là ẢNH CẮT THẲNG từ trang PDF gốc
 * (200 DPI, đã nhị phân hoá nền trong suốt) — có ảnh thì LUÔN ưu tiên hiện
 * ảnh, vì lớp chữ PDF hay vỡ công thức mà vỡ ÂM THẦM (đọc vẫn hợp lý nhưng
 * sai đề). Đề gõ tay không có ảnh -> vẫn hiện bằng chữ như trước, không đổi. */
export interface McqQuestion extends QuestionMedia {
  id: string
  text: string
  choices: [string, string, string, string] // ứng A,B,C,D theo thứ tự GỐC (chưa xáo)
  thanCauImg?: string
  choiceImgs?: [string?, string?, string?, string?] // ứng A,B,C,D theo thứ tự GỐC — xáo cùng lúc với choices qua choicePerm, không cần đổi thuật toán xáo
}
/** Lời giải & tiêu đề ngắn (chủ đề) — CHỈ đi kèm dữ liệu CÓ đáp án (Teacher*),
 * không bao giờ vào PublicExamBank (mergeAndStrip không chọn 2 trường này) —
 * học sinh chỉ thấy sau khi nộp bài, qua đúng cơ chế keyBank đã có sẵn cho
 * "xem điểm ngay", không mở thêm đường lộ đề mới. Cả hai đều TUỲ CHỌN — nhiều
 * đề tải từ file gốc (đề thi thật) không có sẵn lời giải, thầy gõ thêm sau
 * nếu muốn học sinh xem lại. */
/** Kết quả đối chiếu lời giải tự giải (pipeline Nạp đề) với đáp án in trong
 * đề — NAPDETUDONG.md B3. Chấm điểm LUÔN theo `correct` (đáp án đề);
 * `nghi_dap_an_sai` chỉ gắn nhãn cảnh báo cho học sinh và lọc cho thầy quyết. */
export type TrangThaiLoiGiai = 'khop' | 'lech_co_hd' | 'nghi_dap_an_sai' | 'thieu_dap_an'

export interface LoiGiaiMeta {
  loiGiaiTrangThai?: TrangThaiLoiGiai
  /** Đáp án pipeline tự giải ra (khác `correct` khi nghi đề sai). */
  dapAnTuGiai?: string
  ghiChuLoiGiai?: string
}

export interface TeacherMcqQuestion extends McqQuestion, LoiGiaiMeta {
  correct: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  tieuDe?: string
}

export interface TrueFalseQuestion extends QuestionMedia {
  id: string
  text: string
  ideas: [string, string, string, string] // ý a,b,c,d theo thứ tự GỐC, KHÔNG xáo
  thanCauImg?: string
  ideaImgs?: [string?, string?, string?, string?]
}
export interface TeacherTrueFalseQuestion extends TrueFalseQuestion, LoiGiaiMeta {
  correct: ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S']
  explanation?: string
  tieuDe?: string
}

export interface ShortAnswerQuestion extends QuestionMedia {
  id: string
  text: string
  thanCauImg?: string
}
export interface TeacherShortAnswerQuestion extends ShortAnswerQuestion, LoiGiaiMeta {
  correct: string
  explanation?: string
  tieuDe?: string
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
  /** Tên file gốc + thời điểm pipeline nạp — để đồng bộ từ Apps Script biết
   * đề nào mới/đã đổi (so `ngayNap`), không tải lại tất cả mỗi lần. */
  nguon?: string
  ngayNap?: string
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
    phanI: sources.flatMap((s) =>
      s.phanI.map(({ id, text, choices, table, imageDataUrl, hinhAnh, thanCauImg, choiceImgs, canXem }) => ({ id, text, choices, table, imageDataUrl, hinhAnh, thanCauImg, choiceImgs, canXem })),
    ),
    phanII: sources.flatMap((s) =>
      s.phanII.map(({ id, text, ideas, table, imageDataUrl, hinhAnh, thanCauImg, ideaImgs, canXem }) => ({ id, text, ideas, table, imageDataUrl, hinhAnh, thanCauImg, ideaImgs, canXem })),
    ),
    phanIII: sources.flatMap((s) => s.phanIII.map(({ id, text, table, imageDataUrl, hinhAnh, thanCauImg, canXem }) => ({ id, text, table, imageDataUrl, hinhAnh, thanCauImg, canXem }))),
  }
}

/**
 * Gộp nhiều đề nhưng GIỮ NGUYÊN đáp án — chỉ dùng khi thầy chủ động bật "xem
 * điểm ngay sau khi nộp" (kèm cảnh báo đánh đổi rủi ro lộ đề). KHÁC với
 * mergeAndStrip: không publish trực tiếp lên phần bank công khai của ca.
 */
export function mergeKeepAnswers(sources: TeacherExamSource[]): {
  phanI: TeacherMcqQuestion[]
  phanII: TeacherTrueFalseQuestion[]
  phanIII: TeacherShortAnswerQuestion[]
} {
  return {
    phanI: sources.flatMap((s) => s.phanI),
    phanII: sources.flatMap((s) => s.phanII),
    phanIII: sources.flatMap((s) => s.phanIII),
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
