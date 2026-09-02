// Trích văn bản thô từ file PDF/Word thầy tải lên — để đỡ phải tự mở file,
// bôi đen, copy, dán thủ công (chậm, hay đứt dòng). CHỈ trích XUẤT VĂN BẢN,
// KHÔNG tự suy đoán cấu trúc câu hỏi/đáp án đúng — thầy vẫn phải tự rà lại
// và thêm dấu * trước đáp án đúng, (Đ)/(S), [BANG]/[ANH] như khi dán tay,
// vì đoán sai đáp án đúng là lỗi nghiêm trọng nhất có thể xảy ra (đúng như
// nguyên tắc "tuyệt đối không bịa số liệu").
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export interface FileImportResult {
  text: string
  warnings: string[]
}

export async function extractTextFromPdf(file: File): Promise<FileImportResult> {
  const buf = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buf }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    // Nối các mảnh chữ trên cùng trang — pdf.js tách chữ theo từng đoạn nhỏ,
    // không theo dòng, nên ghép bằng khoảng trắng rồi để thầy tự xuống dòng lại.
    const text = content.items.map((it) => ('str' in it ? it.str : '')).join(' ')
    pages.push(text)
  }
  return {
    text: pages.join('\n\n'),
    warnings: [
      'Đã trích chữ từ PDF — PDF không giữ cấu trúc dòng/câu rõ ràng như Word nên chữ có thể dính liền nhau, cần thầy tự ngắt dòng lại theo từng câu.',
      'Công thức hoá dạng ảnh/ký tự đặc biệt trong PDF (chỉ số trên/dưới vẽ bằng hình) sẽ KHÔNG trích ra được — thầy tự gõ lại theo cú pháp của app (vd H2SO4, Na+, SO4^{2-}).',
      'Bảng số liệu và hình vẽ trong PDF KHÔNG tự trích ra được — thầy tự chèn bằng [BANG]...[/BANG] hoặc dán ảnh (Ctrl+V) như cách làm thường ngày.',
    ],
  }
}

export async function extractTextFromDocx(file: File): Promise<FileImportResult> {
  const buf = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buf })
  return {
    text: result.value,
    warnings: [
      'Đã trích chữ từ Word — công thức chèn bằng MathType/Equation Editor sẽ KHÔNG trích ra được (Word lưu dạng ảnh/công thức riêng), thầy tự gõ lại theo cú pháp của app (vd H2SO4, Na+, SO4^{2-}).',
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
