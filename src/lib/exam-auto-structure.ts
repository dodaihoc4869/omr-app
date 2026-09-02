// Biến văn bản THÔ (trích từ PDF/Word của thầy, không theo đúng khuôn của
// app) thành đúng định dạng exam-parse.ts đọc được — để thầy chỉ cần tải file
// lên, không phải tự gõ lại "MÃ ĐỀ:", "PHẦN I/II/III", dấu * v.v.
//
// NGUYÊN TẮC BẮT BUỘC: chỉ làm những việc CHẮC CHẮN đúng —
//   - Đổi cách đánh số/đề mục về đúng cú pháp (không đổi nội dung chữ).
//   - Tự đánh dấu đáp án đúng Phần I CHỈ KHI tìm thấy bảng "ĐÁP ÁN" riêng ở
//     cuối file — đây là TRÍCH XUẤT dữ liệu có sẵn trong file (thầy đã ghi
///    sẵn đáp án), KHÔNG PHẢI đoán. Nếu không có bảng đáp án, hoặc số câu
//     không khớp, KHÔNG tự đánh dấu — để nguyên, exam-parse.ts sẽ cảnh báo
//     rõ câu nào thiếu dấu * để thầy tự bổ sung, không bao giờ âm thầm chọn
//     bừa 1 đáp án.
//   - "Đoán vị trí Phần I/II/III" (khi file dính liền dòng, xem hàm
//     guessGluedHeaders bên dưới) chỉ chạy khi KHÔNG tìm thấy cả 3 tiêu đề ở
//     đầu dòng riêng — và LUÔN báo rõ đây là "độ tin cậy thấp", bắt thầy tự
//     kiểm tra lại, không bao giờ âm thầm coi như chắc chắn đúng.
export interface AutoStructureReport {
  text: string
  notes: string[]
}

const NUMBERED_LINE = /^\s*(?:Câu|CÂU|Bài|BÀI|Question)?\s*\(?(\d{1,3})\)?[.\):]\s+/
const OPTION_LINE = /^\s*\*?\s*([A-Da-d])\s*[.\):]\s+/
const IDEA_LINE = /^\s*([a-dA-D])\s*[.\):]\s+/

const RE_P1 = /ph[aầ]n\s*(?:i|1)\b/i
const RE_P2 = /ph[aầ]n\s*(?:ii|2)\b/i
const RE_P3 = /ph[aầ]n\s*(?:iii|3)\b/i

function canonicalizeHeaders(text: string): string {
  return text
    .replace(/^(\s*ph[aầ]n\s*)1\b/gim, '$1I')
    .replace(/^(\s*ph[aầ]n\s*)2\b/gim, '$1II')
    .replace(/^(\s*ph[aầ]n\s*)3\b/gim, '$1III')
}

/** Vị trí tiêu đề Phần I/II/III khi nó thực sự nằm ở ĐẦU 1 DÒNG RIÊNG (độ
 * tin cậy cao — đây là cách nhận diện chính, giống hệt exam-parse.ts). */
function anchoredHeaderIndex(text: string, re: RegExp): number {
  const anchored = new RegExp(`^\\s*${re.source}`, 'im')
  const m = text.match(anchored)
  return m && m.index !== undefined ? m.index : -1
}

/** Tìm cụm "Phần I/II/III" ở BẤT KỲ ĐÂU trong văn bản (không cần đầu dòng),
 * bắt đầu tìm từ vị trí `from` trở đi — dùng cho trường hợp xấu nhất: file
 * gốc bị dính liền hết thành 1-2 dòng (không giữ được xuống dòng thật). */
function looseHeaderIndex(text: string, re: RegExp, from: number): number {
  const g = new RegExp(re.source, 'gi')
  g.lastIndex = from
  const m = g.exec(text)
  return m ? m.index : -1
}

/** Khi anchoredHeaderIndex KHÔNG tìm thấy CẢ 3 tiêu đề (nghĩa là file coi
 * như mất hết xuống dòng thật) — thử đoán theo ĐÚNG THỨ TỰ xuất hiện trong
 * văn bản (Phần I phải đứng trước Phần II, Phần II phải đứng trước Phần
 * III), rồi cưỡng bức chèn xuống dòng ngay trước mỗi vị trí đó. Đây là suy
 * đoán ĐỘ TIN CẬY THẤP (có thể trúng nhầm câu giới thiệu kiểu "đề gồm 3
 * phần: Phần I ... Phần II ... Phần III ..." ở đầu đề) — LUÔN phải báo rõ
 * cho thầy tự kiểm tra lại, không bao giờ coi là chắc chắn đúng. */
function guessGluedHeaders(text: string): { text: string; guessed: boolean } {
  if (anchoredHeaderIndex(text, RE_P1) >= 0 || anchoredHeaderIndex(text, RE_P2) >= 0 || anchoredHeaderIndex(text, RE_P3) >= 0) {
    // Ít nhất 1 tiêu đề đã ở đúng đầu dòng — không phải trường hợp mất hết
    // xuống dòng, không đoán (để lỗi thật hiện ra rõ ràng nếu 1-2 phần vẫn
    // thiếu, thay vì che bằng suy đoán).
    return { text, guessed: false }
  }
  const idx1 = looseHeaderIndex(text, RE_P1, 0)
  const idx2 = idx1 >= 0 ? looseHeaderIndex(text, RE_P2, idx1 + 1) : -1
  const idx3 = idx2 >= 0 ? looseHeaderIndex(text, RE_P3, idx2 + 1) : -1
  if (idx1 < 0 || idx2 < 0 || idx3 < 0) return { text, guessed: false }

  let out = text
  for (const pos of [idx3, idx2, idx1]) {
    if (out[pos - 1] !== '\n') out = `${out.slice(0, pos)}\n${out.slice(pos)}`
  }
  return { text: out, guessed: true }
}

function ensureMaDe(text: string, fallbackName: string): string {
  if (/^\s*mã\s*đề\s*:?/im.test(text)) return text
  const slug = fallbackName
    .replace(/\.(pdf|docx)$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .slice(0, 40)
  return `MÃ ĐỀ: ${slug || 'de-' + Date.now()}\n${text}`
}

/** Chuẩn hoá số thứ tự câu ("Câu 5:", "Câu 5.") về đúng "5)" — không đổi nội dung. */
function normalizeNumbering(line: string): string {
  const m = line.match(NUMBERED_LINE)
  if (!m) return line
  return `${m[1]}) ${line.slice(m[0].length)}`
}

/** Chuẩn hoá lựa chọn ("A)", "A:") về đúng "A." — giữ nguyên dấu * nếu có sẵn. */
function normalizeOption(line: string): string {
  const m = line.match(OPTION_LINE)
  if (!m) return line
  const star = /^\s*\*/.test(line) ? '*' : ''
  return `${star}${m[1].toUpperCase()}. ${line.slice(m[0].length)}`
}

function normalizeIdea(line: string): string {
  const m = line.match(IDEA_LINE)
  if (!m) return line
  return `${m[1].toLowerCase()}) ${line.slice(m[0].length)}`
}

/** Tìm bảng "ĐÁP ÁN" riêng ở cuối file (rất phổ biến trong đề in sẵn của
 * giáo viên) — trả về map số câu -> chữ cái đúng, và phần thân đã cắt bỏ
 * khối đáp án đó (để không lẫn vào nội dung câu hỏi). Bắt buộc cả dòng gần
 * như CHỈ có chữ "Đáp án" (cho phép dấu ":") — để không nhầm với câu hỏi có
 * chứa cụm "...chọn đáp án đúng..." ở giữa câu. */
function extractAnswerKeyBlock(text: string): { body: string; key: Record<number, string> } {
  const m = text.match(/(^|\n)[ \t]*(?:ĐÁP ÁN|DAP AN|Đáp án|BẢNG ĐÁP ÁN)[ \t]*:?[ \t]*(?=\n|$)/i)
  if (!m || m.index === undefined) return { body: text, key: {} }
  const cutAt = m.index
  const body = text.slice(0, cutAt)
  const keyBlock = text.slice(cutAt)
  const key: Record<number, string> = {}
  const re = /(\d{1,3})\s*[\.\-:]\s*([A-Da-d])\b/g
  let mm: RegExpExecArray | null
  while ((mm = re.exec(keyBlock))) {
    key[Number(mm[1])] = mm[2].toUpperCase()
  }
  return { body, key }
}

export function autoStructureRawExam(raw: string, fileName: string): AutoStructureReport {
  const notes: string[] = []
  let text = raw.replace(/\r\n/g, '\n').replace(/ /g, ' ')

  const { body, key: answerKey } = extractAnswerKeyBlock(text)
  if (Object.keys(answerKey).length > 0) {
    notes.push(`Tìm thấy bảng "ĐÁP ÁN" ở cuối file với ${Object.keys(answerKey).length} câu — sẽ đối chiếu để tự đánh dấu đáp án đúng Phần I.`)
  }
  text = body

  text = canonicalizeHeaders(text)
  text = ensureMaDe(text, fileName)

  const { text: guessedText, guessed } = guessGluedHeaders(text)
  text = canonicalizeHeaders(guessedText)
  if (guessed) {
    notes.push(
      'CẢNH BÁO ĐỘ TIN CẬY THẤP: file gốc không có "Phần I/II/III" nằm ở đầu dòng riêng (có thể do file bị dính liền chữ) — app đã tự ĐOÁN ranh giới 3 phần theo đúng thứ tự xuất hiện trong văn bản. Thầy BẮT BUỘC kiểm tra kỹ lại đúng câu nào thuộc phần nào trước khi dùng đề này, rất có thể sai nếu đề có đoạn giới thiệu nhắc tên cả 3 phần ở đầu bài.',
    )
  }

  const lines = text.split('\n')
  const reP1Line = /^ph[aầ]n\s*i\b/i
  const reP2Line = /^ph[aầ]n\s*ii\b/i
  const reP3Line = /^ph[aầ]n\s*iii\b/i
  let section: 'none' | 'p1' | 'p2' | 'p3' = 'none'
  let p1QuestionIdx = 0
  let p2QuestionCount = 0
  let p3QuestionCount = 0
  const unmatchedP1: number[] = []

  const out: string[] = []
  for (const raw of lines) {
    const line = raw.trimEnd()
    const t = line.trim()
    if (reP1Line.test(t)) {
      section = 'p1'
      out.push(line)
      continue
    }
    if (reP2Line.test(t)) {
      section = 'p2'
      out.push(line)
      continue
    }
    if (reP3Line.test(t)) {
      section = 'p3'
      out.push(line)
      continue
    }

    if (section === 'p1') {
      if (NUMBERED_LINE.test(line)) {
        p1QuestionIdx += 1
        out.push(normalizeNumbering(line))
        continue
      }
      if (OPTION_LINE.test(line)) {
        let opt = normalizeOption(line)
        const alreadyStarred = /^\*/.test(opt)
        if (!alreadyStarred && answerKey[p1QuestionIdx]) {
          const letter = opt.match(/^([A-D])\./)?.[1]
          if (letter === answerKey[p1QuestionIdx]) opt = `*${opt}`
        }
        out.push(opt)
        continue
      }
      out.push(line)
    } else if (section === 'p2') {
      if (NUMBERED_LINE.test(line)) {
        p2QuestionCount += 1
        out.push(normalizeNumbering(line))
      } else if (IDEA_LINE.test(line)) out.push(normalizeIdea(line))
      else out.push(line)
    } else if (section === 'p3') {
      if (NUMBERED_LINE.test(line)) {
        p3QuestionCount += 1
        out.push(normalizeNumbering(line))
      } else out.push(line)
    } else {
      out.push(line)
    }
  }

  // Báo cáo câu nào Phần I có đáp án trong bảng đáp án nhưng KHÔNG khớp được vào đúng lựa chọn
  // (vd bảng đáp án ghi câu này đúng "B" nhưng lựa chọn B không có trong câu — sai lệch cần thầy xem lại).
  if (Object.keys(answerKey).length > 0) {
    for (let i = 1; i <= p1QuestionIdx; i++) {
      if (answerKey[i]) continue
      unmatchedP1.push(i)
    }
    if (unmatchedP1.length > 0) {
      notes.push(`Bảng đáp án KHÔNG có câu ${unmatchedP1.join(', ')} (Phần I) — các câu này vẫn cần thầy tự đánh dấu * trước lựa chọn đúng.`)
    }
  } else if (p1QuestionIdx > 0) {
    notes.push('Không tìm thấy bảng "ĐÁP ÁN" riêng trong file — thầy cần tự thêm dấu * trước lựa chọn đúng của TỪNG câu Phần I.')
  }

  // Minh bạch khi 1 phần được tìm thấy tiêu đề nhưng KHÔNG nhận diện được
  // câu nào bên trong — rất có thể nội dung phần đó vẫn bị dính liền dòng
  // (app không tự đoán ranh giới câu vì dễ đoán sai) — báo rõ để thầy tự
  // xuống dòng thủ công trước từng câu trong phần đó.
  const hasP1Header = /^ph[aầ]n\s*i\b/im.test(text)
  const hasP2Header = /^ph[aầ]n\s*ii\b/im.test(text)
  const hasP3Header = /^ph[aầ]n\s*iii\b/im.test(text)
  if (hasP1Header && p1QuestionIdx === 0) {
    notes.push('Phần I: tìm thấy tiêu đề nhưng KHÔNG nhận diện được câu nào bên trong — nội dung có thể vẫn bị dính liền dòng, thầy tự xuống dòng (Enter) trước mỗi "Câu ..." rồi bấm Phân tích đề lại.')
  }
  if (hasP2Header && p2QuestionCount === 0) {
    notes.push('Phần II: tìm thấy tiêu đề nhưng KHÔNG nhận diện được câu nào bên trong — nội dung có thể vẫn bị dính liền dòng, thầy tự xuống dòng (Enter) trước mỗi "Câu ..." rồi bấm Phân tích đề lại.')
  }
  if (hasP3Header && p3QuestionCount === 0) {
    notes.push('Phần III: tìm thấy tiêu đề nhưng KHÔNG nhận diện được câu nào bên trong — nội dung có thể vẫn bị dính liền dòng, thầy tự xuống dòng (Enter) trước mỗi "Câu ..." rồi bấm Phân tích đề lại.')
  }
  if (!hasP1Header || !hasP2Header || !hasP3Header) {
    const missing = [!hasP1Header && 'Phần I', !hasP2Header && 'Phần II', !hasP3Header && 'Phần III'].filter(Boolean).join(', ')
    notes.push(`Vẫn KHÔNG tìm thấy tiêu đề ${missing} — kiểm tra xem file gốc có ghi đúng cụm "Phần I"/"Phần II"/"Phần III" (hoặc "Phần 1/2/3") không, hoặc dán trực tiếp đoạn đó vào ô soạn đề rồi tự thêm tiêu đề còn thiếu.`)
  }

  const finalText = out.join('\n')

  return { text: finalText, notes }
}
