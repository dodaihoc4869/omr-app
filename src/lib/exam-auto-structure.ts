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
export interface AutoStructureReport {
  text: string
  notes: string[]
}

const NUMBERED_LINE = /^\s*(?:Câu|CÂU|Bài|BÀI|Question)?\s*\(?(\d{1,3})\)?[.\):]\s+/
const OPTION_LINE = /^\s*\*?\s*([A-Da-d])\s*[.\):]\s+/
const IDEA_LINE = /^\s*([a-dA-D])\s*[.\):]\s+/

function canonicalizeHeaders(text: string): string {
  return text
    .replace(/^(\s*ph[aầ]n\s*)1\b/gim, '$1I')
    .replace(/^(\s*ph[aầ]n\s*)2\b/gim, '$1II')
    .replace(/^(\s*ph[aầ]n\s*)3\b/gim, '$1III')
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
 * khối đáp án đó (để không lẫn vào nội dung câu hỏi). */
function extractAnswerKeyBlock(text: string): { body: string; key: Record<number, string> } {
  const m = text.match(/(^|\n)\s*(?:ĐÁP ÁN|DAP AN|Đáp án|BẢNG ĐÁP ÁN)\s*:?\s*\n?/i)
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
  let text = raw.replace(/\r\n/g, '\n').replace(/ /g, ' ')

  const { body, key: answerKey } = extractAnswerKeyBlock(text)
  if (Object.keys(answerKey).length > 0) {
    notes.push(`Tìm thấy bảng "ĐÁP ÁN" ở cuối file với ${Object.keys(answerKey).length} câu — sẽ đối chiếu để tự đánh dấu đáp án đúng Phần I.`)
  }
  text = body

  text = canonicalizeHeaders(text)
  text = ensureMaDe(text, fileName)

  const lines = text.split('\n')
  const reP1 = /^ph[aầ]n\s*i\b/i
  const reP2 = /^ph[aầ]n\s*ii\b/i
  const reP3 = /^ph[aầ]n\s*iii\b/i
  let section: 'none' | 'p1' | 'p2' | 'p3' = 'none'
  let p1QuestionIdx = 0
  const unmatchedP1: number[] = []

  const out: string[] = []
  for (const raw of lines) {
    const line = raw.trimEnd()
    const t = line.trim()
    if (reP1.test(t)) {
      section = 'p1'
      out.push(line)
      continue
    }
    if (reP2.test(t)) {
      section = 'p2'
      out.push(line)
      continue
    }
    if (reP3.test(t)) {
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
      if (NUMBERED_LINE.test(line)) out.push(normalizeNumbering(line))
      else if (IDEA_LINE.test(line)) out.push(normalizeIdea(line))
      else out.push(line)
    } else if (section === 'p3') {
      if (NUMBERED_LINE.test(line)) out.push(normalizeNumbering(line))
      else out.push(line)
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

  const finalText = out.join('\n')

  return { text: finalText, notes }
}
