// Tách 1 file đề thi THPT dạng "đề tham khảo Bộ GD&ĐT" (có kèm bảng đáp án +
// hướng dẫn giải trong CÙNG 1 file PDF/Word) thành 3 vùng riêng biệt, và đọc
// đúng bảng đáp án — để thầy chỉ cần tải file lên là app tự biết đáp án đúng,
// không phải tự gõ tay dấu * hay (Đ)/(S) như trước.
//
// QUAN TRỌNG — không được trộn vùng: nhiều đề tham khảo lặp lại TOÀN BỘ đề
// gốc một lần nữa trong phần "HƯỚNG DẪN GIẢI" (kèm đáp án tô sẵn). Nếu vô
// tình đọc luôn phần lặp lại này làm đề thì số câu sẽ nhân đôi (vd 18 câu
// Phần I thành 36 câu) — đây là lỗi nghiêm trọng phải chặn tuyệt đối.

export interface ExamRegions {
  /** Vùng A — đề gốc: từ đầu file đến trước dòng "HẾT" đầu tiên. */
  vungA: string
  /** Vùng B — bảng đáp án: ngay sau "HẾT", trước "HƯỚNG DẪN GIẢI". */
  vungB: string
  /** Vùng C — hướng dẫn giải (đề lặp lại + lời giải): từ "HƯỚNG DẪN GIẢI" đến hết. Có thể rỗng nếu file không có. */
  vungC: string
}

/** Tách văn bản đã trích từ file thành 3 vùng A/B/C. Không có "HẾT" thì coi
 * toàn bộ file là vùng A (không có bảng đáp án/hướng dẫn giải đi kèm) —
 * KHÔNG báo lỗi, vì nhiều đề thầy gõ tay không có 2 phần này. */
export function splitExamRegions(text: string): ExamRegions {
  const hetMatch = /HẾT/.exec(text)
  if (!hetMatch) {
    return { vungA: text.trim(), vungB: '', vungC: '' }
  }
  const vungA = text.slice(0, hetMatch.index).trimEnd()
  const afterHet = text.slice(hetMatch.index + hetMatch[0].length)

  const guideMatch = /HƯỚNG\s*DẪN\s*GIẢI/.exec(afterHet)
  if (!guideMatch) {
    return { vungA, vungB: afterHet.trim(), vungC: '' }
  }
  const vungB = afterHet.slice(0, guideMatch.index).trim()
  const vungC = afterHet.slice(guideMatch.index).trim()
  return { vungA, vungB, vungC }
}

export interface AnswerKeyResult {
  /** Phần I: số câu -> 1 chữ cái đáp án đúng (A/B/C/D). */
  phanI: Record<number, string>
  /** Phần II: số câu -> chuỗi 4 ký tự Đ/S theo thứ tự a-b-c-d (vd "ĐĐSĐ"). */
  phanII: Record<number, string>
  /** Phần III: số câu -> đáp án số (giữ nguyên dấu phẩy thập phân như đề gốc). */
  phanIII: Record<number, string>
  warnings: string[]
}

function extractSection(vungB: string, startRe: RegExp, endRe: RegExp | null): string {
  const startMatch = startRe.exec(vungB)
  if (!startMatch) return ''
  const from = startMatch.index + startMatch[0].length
  if (!endRe) return vungB.slice(from)
  endRe.lastIndex = 0
  const rest = vungB.slice(from)
  const endMatch = endRe.exec(rest)
  return endMatch ? rest.slice(0, endMatch.index) : rest
}

/** Phần I — bảng có thể trình bày 1 hoặc 2 cột song song ("Câu Đáp án Câu
 * Đáp án" rồi "1 D 10 C"...). Thay vì đọc theo dòng/cột (dễ sai vì PDF hay
 * xuất bảng 2 cột theo thứ tự đọc lộn xộn), quét TOÀN BỘ đoạn tìm mọi cặp
 * "<số câu> <chữ cái A/B/C/D>" đứng sát nhau — số câu đọc được LUÔN đi kèm
 * đúng đáp án của chính nó trong cách trình bày này, nên ghép theo số câu
 * trích được, không ghép theo vị trí. */
function parsePhanI(section: string): { map: Record<number, string>; warnings: string[] } {
  const map: Record<number, string> = {}
  const re = /(\d{1,3})\s*[\r\n]?\s*([ABCD])(?![A-Za-zĐ0-9])/g
  let m: RegExpExecArray | null
  while ((m = re.exec(section))) {
    const cau = parseInt(m[1], 10)
    map[cau] = m[2]
  }
  return { map, warnings: [] }
}

/** Phần II — mỗi câu có 4 ý a/b/c/d Đúng/Sai. Đọc số câu từ dòng tiêu đề
 * "Câu 1 2 3 4", rồi gom MỌI token "x) Đúng/Sai" xuất hiện trong đoạn theo
 * đúng thứ tự xuất hiện, cứ 4 token liền nhau ghép thành đáp án của 1 câu
 * (đúng thứ tự a-b-c-d như đề gốc luôn liệt kê) — khớp với số câu theo đúng
 * thứ tự đã đọc được ở dòng tiêu đề. */
function parsePhanII(section: string): { map: Record<number, string>; warnings: string[] } {
  const warnings: string[] = []
  const map: Record<number, string> = {}

  const headerMatch = /Câu\b([^\n]*)/.exec(section)
  const cauNumbers = headerMatch ? [...headerMatch[1].matchAll(/\d+/g)].map((x) => parseInt(x[0], 10)) : []

  const tokens = [...section.matchAll(/[abcd]\)\s*(Đúng|Sai)/gi)].map((mm) =>
    mm[1].toLowerCase().startsWith('đ') ? 'Đ' : 'S',
  )

  if (cauNumbers.length === 0) {
    if (tokens.length > 0) warnings.push('Phần II: không đọc được số thứ tự câu từ dòng tiêu đề "Câu ..." dù có thấy đáp án a)/b)/c)/d) — thầy kiểm tra lại vùng đáp án.')
    return { map, warnings }
  }

  for (let i = 0; i < cauNumbers.length; i++) {
    const chunk = tokens.slice(i * 4, i * 4 + 4)
    if (chunk.length === 4) map[cauNumbers[i]] = chunk.join('')
    else warnings.push(`Phần II câu ${cauNumbers[i]}: chỉ đọc được ${chunk.length}/4 ý Đúng/Sai — thầy kiểm tra lại.`)
  }
  return { map, warnings }
}

/** Phần III — trả lời ngắn dạng số, không có phương án. Đọc số câu từ dòng
 * "Câu 1 2 3 4 5 6", đọc đáp án từ dòng "Đáp án ..." theo đúng thứ tự xuất
 * hiện (giữ nguyên dấu phẩy thập phân, KHÔNG đổi thành dấu chấm). */
function parsePhanIII(section: string): { map: Record<number, string>; warnings: string[] } {
  const warnings: string[] = []
  const map: Record<number, string> = {}

  const headerMatch = /Câu\b([^\n]*)/.exec(section)
  const cauNumbers = headerMatch ? [...headerMatch[1].matchAll(/\d+/g)].map((x) => parseInt(x[0], 10)) : []

  const answerLineMatch = /Đáp\s*án\b([\s\S]*)/.exec(section)
  const answerValues = answerLineMatch
    ? [...answerLineMatch[1].matchAll(/-?\d+(?:,\d+)?/g)].map((x) => x[0])
    : []

  if (cauNumbers.length === 0) {
    if (answerValues.length > 0) warnings.push('Phần III: không đọc được số thứ tự câu từ dòng tiêu đề "Câu ..." dù có thấy đáp án số — thầy kiểm tra lại vùng đáp án.')
    return { map, warnings }
  }

  for (let i = 0; i < cauNumbers.length; i++) {
    if (i < answerValues.length) map[cauNumbers[i]] = answerValues[i]
    else warnings.push(`Phần III câu ${cauNumbers[i]}: không đọc được đáp án số.`)
  }
  return { map, warnings }
}

/** Đọc bảng đáp án (vùng B) — trả về đáp án của cả 3 phần. Không đoán: phần
 * nào không có trong file thì trả về rỗng (không lỗi), phần nào đọc được
 * nhưng thiếu/lệch số câu thì báo rõ trong warnings để thầy tự kiểm tra,
 * TUYỆT ĐỐI không tự gán đáp án mặc định. */
export function parseAnswerKey(vungB: string): AnswerKeyResult {
  const warnings: string[] = []
  if (!vungB.trim()) {
    return { phanI: {}, phanII: {}, phanIII: {}, warnings: ['Không tìm thấy bảng đáp án trong file (không có vùng B) — thầy tự nhập đáp án bằng tay như cách làm thường ngày.'] }
  }

  const secI = extractSection(vungB, /Ph[aầ]n\s*I\b(?!I)[^\n]*/i, /Ph[aầ]n\s*II\b/i)
  const secII = extractSection(vungB, /Ph[aầ]n\s*II\b(?!I)[^\n]*/i, /Ph[aầ]n\s*III\b/i)
  const secIII = extractSection(vungB, /Ph[aầ]n\s*III\b[^\n]*/i, null)

  const rI = parsePhanI(secI)
  const rII = parsePhanII(secII)
  const rIII = parsePhanIII(secIII)
  warnings.push(...rI.warnings, ...rII.warnings, ...rIII.warnings)

  // Kiểm tra Phần I: đủ số câu liên tục 1..N, không trùng không thiếu.
  const nums = Object.keys(rI.map).map(Number).sort((a, b) => a - b)
  if (nums.length > 0) {
    const max = nums[nums.length - 1]
    const missing: number[] = []
    for (let i = 1; i <= max; i++) if (!(i in rI.map)) missing.push(i)
    if (missing.length > 0) warnings.push(`Phần I: thiếu đáp án câu ${missing.join(', ')} (đọc được ${nums.length}/${max} câu).`)
  }

  return { phanI: rI.map, phanII: rII.map, phanIII: rIII.map, warnings }
}
