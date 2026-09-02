// Trích văn bản thô từ file PDF/Word thầy tải lên — để đỡ phải tự mở file,
// bôi đen, copy, dán thủ công (chậm, hay đứt dòng). CHỈ trích XUẤT VĂN BẢN,
// KHÔNG tự suy đoán cấu trúc câu hỏi/đáp án đúng — thầy vẫn phải tự rà lại
// và thêm dấu * trước đáp án đúng, (Đ)/(S), [BANG]/[ANH] như khi dán tay,
// vì đoán sai đáp án đúng là lỗi nghiêm trọng nhất có thể xảy ra (đúng như
// nguyên tắc "tuyệt đối không bịa số liệu").
//
// QUAN TRỌNG: việc GIỮ ĐÚNG XUỐNG DÒNG của bản gốc là điều kiện sống còn để
// bước tự-chuẩn-hoá (exam-auto-structure.ts) và bộ phân tích đề
// (exam-parse.ts) nhận diện đúng "PHẦN I/II/III", số thứ tự câu, lựa chọn
// A/B/C/D — cả 2 đều dựa vào MỖI Ý Ở ĐẦU 1 DÒNG RIÊNG. Vì vậy 2 hàm dưới đây
// KHÔNG chỉ đơn giản nối chữ bằng dấu cách như trước (hay làm dính liền cả
// đoạn thành 1 dòng, khiến "Phần I" lọt vào giữa dòng, exam-parse.ts báo
// "không tìm thấy tiêu đề" dù chữ vẫn trích đúng), mà cố tái tạo lại đúng
// ranh giới dòng thật của file gốc.
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import mammoth from 'mammoth'
import JSZip from 'jszip'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export interface FileImportResult {
  text: string
  warnings: string[]
  /** Số ký tự trung bình/trang — chỉ có ở PDF, dùng để phân biệt PDF có lớp
   * chữ thật (đọc được) với PDF ảnh scan (không có chữ, phải đọc bằng ảnh). */
  avgCharsPerPage?: number
}

export type DocxKind = 'docx_omml' | 'docx_mathtype' | 'docx_chu'
export type PdfKind = 'pdf_chu' | 'pdf_scan'
export type FileKind = DocxKind | PdfKind

/** Ngưỡng phân biệt PDF có lớp chữ thật với PDF ảnh scan (không có chữ nào
 * trích được, chỉ là ảnh chụp/scan trang giấy). */
const PDF_SCAN_THRESHOLD_CHARS_PER_PAGE = 100

/** Xác định PDF là "có lớp chữ" hay "ảnh scan" dựa trên số ký tự trích được
 * trung bình mỗi trang — KHÔNG dựa vào tên file hay phần mở rộng. */
export function classifyPdf(avgCharsPerPage: number): PdfKind {
  return avgCharsPerPage > PDF_SCAN_THRESHOLD_CHARS_PER_PAGE ? 'pdf_chu' : 'pdf_scan'
}

/** Xác định file .docx thuộc loại nào để chọn đúng đường xử lý công thức:
 * - có thẻ <m:oMath> (công thức gõ bằng công cụ Equation gốc của Word, LƯU
 *   DẠNG CHỮ) -> trích được thẳng, sạch nhất.
 * - không có oMath nhưng có ảnh .wmf/.emf trong word/media (công thức
 *   MathType/Equation Editor cũ, LƯU DẠNG ẢNH) -> phải đọc lại bằng ảnh.
 * - không có cả hai -> file chữ thuần, không có công thức chèn kiểu đối tượng. */
export async function classifyDocx(buf: ArrayBuffer): Promise<DocxKind> {
  try {
    const zip = await JSZip.loadAsync(buf)
    const docXmlFile = zip.file('word/document.xml')
    const xml = docXmlFile ? await docXmlFile.async('text') : ''
    if (/<m:oMath[ >]/.test(xml)) return 'docx_omml'
    const hasMedia = Object.keys(zip.files).some((name) => /\.(wmf|emf)$/i.test(name))
    if (hasMedia) return 'docx_mathtype'
    return 'docx_chu'
  } catch {
    return 'docx_chu'
  }
}

interface PdfTextItemLike {
  str: string
  hasEOL?: boolean
  width?: number
  transform?: number[]
}

/** Trích 1 trang PDF thành text CÓ xuống dòng đúng như bản gốc — dùng
 * "hasEOL" do chính pdf.js tính (dựa trên bố cục thật của trang, kể cả công
 * thức có chỉ số trên/dưới) để biết chỗ nào là cuối 1 dòng hiển thị, và
 * khoảng cách ngang giữa 2 mảnh chữ để quyết định có cần thêm dấu cách hay
 * không (tránh dính liền chữ, hoặc chèn cách giữa các ký tự của cùng 1 từ). */
export function pageItemsToText(items: PdfTextItemLike[]): string {
  let out = ''
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    out += it.str
    if (it.hasEOL) {
      out += '\n'
      continue
    }
    const next = items[i + 1]
    if (!next || !next.str) continue
    const endX = (it.transform?.[4] ?? 0) + (it.width ?? 0)
    const nextX = next.transform?.[4] ?? endX
    const gap = nextX - endX
    const avgCharWidth = (it.width ?? 5) / Math.max(it.str.length, 1)
    const alreadySpaced = it.str.endsWith(' ') || next.str.startsWith(' ')
    if (!alreadySpaced && gap > avgCharWidth * 0.35) out += ' '
  }
  return out.replace(/\n+$/, '').replace(/^\n+/, '')
}

export async function extractTextFromPdf(file: File): Promise<FileImportResult> {
  const buf = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buf }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const items = content.items.filter((it) => 'str' in it) as unknown as PdfTextItemLike[]
    pages.push(pageItemsToText(items))
  }
  const totalChars = pages.reduce((sum, p) => sum + p.length, 0)
  const avgCharsPerPage = doc.numPages > 0 ? totalChars / doc.numPages : 0
  return {
    text: pages.join('\n\n'),
    avgCharsPerPage,
    warnings: [
      'Đã trích chữ từ PDF và tự tái tạo xuống dòng theo đúng bố cục trang gốc — nếu PDF là ảnh scan (không phải PDF chữ thật) thì sẽ KHÔNG trích được chữ nào, phải gõ tay hoặc dán ảnh.',
      'Công thức hoá dạng ảnh vẽ riêng trong PDF (không phải chữ) sẽ KHÔNG trích ra được — thầy tự gõ lại theo cú pháp của app (vd H2SO4, Na+, SO4^{2-}).',
      'Bảng số liệu và hình vẽ trong PDF KHÔNG tự trích ra được — thầy tự chèn bằng [BANG]...[/BANG] hoặc dán ảnh (Ctrl+V) như cách làm thường ngày.',
    ],
  }
}

/** Đổi HTML (do mammoth chuyển từ .docx) thành text theo đúng dòng thật:
 * mỗi <p>/<li>/<tr>/<h1-6> là 1 dòng riêng, <br> (xuống dòng thủ công bằng
 * Shift+Enter trong Word — RẤT hay dùng để gõ đề) cũng tách dòng. QUAN
 * TRỌNG NHẤT: danh sách đánh số/đánh chữ TỰ ĐỘNG của Word (Câu 1, 2, 3...
 * hoặc A, B, C, D...) không có số/chữ nằm trong text (Word vẽ số bằng CSS
 * counter, không phải ký tự thật) — nếu bỏ qua, cả khối câu hỏi/lựa chọn sẽ
 * mất hết số thứ tự. Hàm này tự đánh lại đúng số/chữ theo thứ tự Word hiển
 * thị (kiểu numbering + start attribute) rồi mới xuất ra text. */
export function htmlToLines(html: string): string {
  const dom = new DOMParser().parseFromString(html, 'text/html')
  const lines: string[] = []
  let current = ''
  const listStack: { counter: number; type: string }[] = []

  const letterFor = (n: number, upper: boolean) => String.fromCharCode((upper ? 65 : 97) + ((n - 1) % 26))

  const flush = () => {
    if (current.trim()) lines.push(current.trim())
    current = ''
  }

  // 'td'/'th' PHẢI có trong danh sách này: đề Hoá rất hay trình bày 4 lựa
  // chọn A/B/C/D theo bảng 2x2 (2 lựa chọn/hàng) để căn cột cho đẹp. Nếu
  // không tách dòng ở biên mỗi ô, 2 lựa chọn cùng hàng (vd "A." và "B.")
  // dính vào chung 1 dòng — app chỉ nhận diện được lựa chọn đứng đầu dòng
  // (A) còn lựa chọn dính sau (B) bị báo "thiếu nội dung" hàng loạt, dù chữ
  // vẫn còn nguyên trong file gốc.
  const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'td', 'th', 'div'])

  const walk = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      current += node.textContent ?? ''
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    const tag = el.tagName.toLowerCase()

    if (tag === 'br') {
      flush()
      return
    }
    if (tag === 'ol') {
      const startAttr = parseInt(el.getAttribute('start') || '1', 10)
      const typeAttr = el.getAttribute('type') || '1'
      listStack.push({ counter: Number.isNaN(startAttr) ? 1 : startAttr, type: typeAttr })
      Array.from(el.childNodes).forEach(walk)
      listStack.pop()
      return
    }
    if (tag === 'ul') {
      listStack.push({ counter: -1, type: 'bullet' })
      Array.from(el.childNodes).forEach(walk)
      listStack.pop()
      return
    }
    if (tag === 'li') {
      flush()
      const ctx = listStack[listStack.length - 1]
      if (ctx && ctx.type !== 'bullet') {
        const n = ctx.counter++
        if (ctx.type === 'a') current += `${letterFor(n, false)}) `
        else if (ctx.type === 'A') current += `${letterFor(n, true)}) `
        else current += `${n}) `
      }
      Array.from(el.childNodes).forEach(walk)
      flush()
      return
    }
    if (BLOCK_TAGS.has(tag)) {
      flush()
      Array.from(el.childNodes).forEach(walk)
      flush()
      return
    }
    Array.from(el.childNodes).forEach(walk)
  }

  Array.from(dom.body.childNodes).forEach(walk)
  flush()
  return lines.join('\n')
}

/** Đếm số công thức chèn kiểu đối tượng (MathType/Equation Editor — cả bản
 * mới dùng OMML `<m:oMath>` lẫn bản cũ nhúng OLE `<o:OLEObject>`) có trong
 * word/document.xml của file .docx — KHÔNG đếm chữ, đếm đúng số đối tượng
 * công thức thật sự tồn tại trong file, để chỉ cảnh báo khi file THỰC SỰ có
 * công thức bị mất (mammoth không hỗ trợ chuyển các đối tượng này thành
 * chữ, và thường không hề báo warning khi bỏ qua chúng — nên không thể dựa
 * vào result.messages của mammoth để biết). Đọc lỗi (file hỏng, không phải
 * zip hợp lệ...) thì coi như không đếm được, KHÔNG chặn luồng chính. */
export async function countEmbeddedEquations(buf: ArrayBuffer): Promise<number> {
  try {
    const zip = await JSZip.loadAsync(buf)
    const docXmlFile = zip.file('word/document.xml')
    if (!docXmlFile) return 0
    const xml = await docXmlFile.async('text')
    const oMathCount = (xml.match(/<m:oMath[ >]/g) || []).length
    const oleCount = (xml.match(/<o:OLEObject[ >]/g) || []).length
    return oMathCount + oleCount
  } catch {
    return 0
  }
}

export async function extractTextFromDocx(file: File): Promise<FileImportResult> {
  const buf = await file.arrayBuffer()
  // convertToHtml (thay vì extractRawText cũ) để giữ được ranh giới đoạn/dòng
  // thật — extractRawText từng làm mất xuống dòng thủ công (Shift+Enter)
  // trong Word, khiến "Phần I" hay dính liền vào câu trước, app báo nhầm
  // "không tìm thấy tiêu đề" dù chữ vẫn trích đúng.
  const result = await mammoth.convertToHtml({ arrayBuffer: buf })
  const text = htmlToLines(result.value)
  const usedAutoNumberedList = /<ol[\s>]/i.test(result.value)
  const equationCount = await countEmbeddedEquations(buf)
  return {
    text,
    warnings: [
      'Đã trích chữ từ Word và tự tái tạo xuống dòng + số thứ tự theo đúng bố cục file gốc (kể cả khi thầy dùng đánh số tự động của Word cho Câu 1,2,3... hoặc A,B,C,D...).',
      ...(usedAutoNumberedList
        ? ['File có dùng danh sách đánh số/đánh chữ tự động của Word — app đã tự đánh lại đúng thứ tự, thầy rà nhanh xem số câu/số lựa chọn có khớp bản gốc không.']
        : []),
      equationCount > 0
        ? `Phát hiện ${equationCount} công thức chèn kiểu MathType/Equation Editor trong file — các công thức này KHÔNG trích ra được (Word lưu dạng ảnh/đối tượng riêng, không phải chữ), vị trí tương ứng trong bài trích ra sẽ bị TRỐNG hoặc thiếu. Thầy tìm đúng những chỗ trống đó, gõ lại bằng cú pháp app (vd "H2SO4", "Na+", "SO4^{2-}") — gõ xong sẽ hiển thị đẹp y như công thức thật cho học sinh.`
        : 'Không phát hiện công thức chèn kiểu MathType/Equation Editor trong file.',
      'Bảng và hình trong file Word KHÔNG tự trích ra được — thầy tự chèn bằng [BANG]...[/BANG] hoặc dán ảnh (Ctrl+V) như cách làm thường ngày.',
      ...(result.messages.length > 0 ? [`Word báo ${result.messages.length} cảnh báo khi đọc file (định dạng lạ) — kiểm tra kỹ nội dung trích ra.`] : []),
    ],
  }
}

export async function extractTextFromFile(file: File): Promise<FileImportResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return extractTextFromPdf(file)
  if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    return extractTextFromDocx(file)
  throw new Error('Chỉ nhận file .pdf hoặc .docx')
}
