// Sinh PDF phiếu trả lời trắc nghiệm từ template2025.json — DÙNG CHUNG toạ độ
// với module đọc ảnh (src/engine/template.ts) nên in ra và quét lại không
// bao giờ lệch nhau. A4, scale in phải để nguyên 100% (không "fit to page").
import { jsPDF } from 'jspdf'
import {
  genMadeThiBubbles,
  genPhanIBubbles,
  genPhanIIBubbles,
  genPhanIIIBubbles,
  genSbdBubbles,
  template,
} from '../engine/template'

const BUBBLE_R = template.bubble_diameter_mm / 2

function drawAnchors(doc: jsPDF) {
  doc.setFillColor(0, 0, 0)
  for (const a of template.anchors) {
    doc.rect(a.x_mm, a.y_mm, a.size_mm, a.size_mm, 'F')
  }
}

function drawBubbleGroup(doc: jsPDF, bubbles: ReturnType<typeof genSbdBubbles>) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.15)
  doc.setFontSize(6)
  for (const b of bubbles) {
    doc.circle(b.x_mm, b.y_mm, BUBBLE_R, 'S')
    doc.text(b.value, b.x_mm, b.y_mm + 0.9, { align: 'center' })
  }
}

function drawDigitFieldLabel(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(label, x, y - 3)
  doc.setFont('helvetica', 'normal')
}

function drawQuestionNumbers(doc: jsPDF) {
  const t = template.phanI
  doc.setFontSize(7)
  for (let q = 0; q < t.questions; q++) {
    const block = Math.floor(q / t.questionsPerBlock)
    const rowInBlock = q % t.questionsPerBlock
    const x = t.blockOrigin_mm.x + block * t.blockSpacing_mm.x - 5
    const y = t.blockOrigin_mm.y + rowInBlock * t.pitch_mm.y + 1
    doc.text(String(q + 1), x, y)
  }
}

function drawPhanIILabels(doc: jsPDF) {
  const t = template.phanII
  doc.setFontSize(7)
  for (let q = 0; q < t.questions; q++) {
    const y = t.origin_mm.y + q * t.questionPitch_mm + 1
    doc.text(`Câu ${q + 1}`, t.origin_mm.x - 12, y)
    for (let idea = 0; idea < t.ideas; idea++) {
      const ideaX = t.origin_mm.x + idea * t.ideaSpacing_mm
      doc.text(`Ý${idea + 1}`, ideaX + 3, y - 3, { align: 'center' })
    }
  }
}

function drawPhanIIILabels(doc: jsPDF) {
  const t = template.phanIII
  doc.setFontSize(7)
  for (let q = 0; q < t.questions; q++) {
    const x = t.blockOrigin_mm.x + q * t.blockSpacing_mm.x
    doc.text(`Câu ${q + 1}`, x + 6, t.blockOrigin_mm.y - 3, { align: 'center' })
  }
}

export function buildAnswerSheetPdf(studentInfo?: { hoTen?: string; lop?: string }): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PHIẾU TRẢ LỜI TRẮC NGHIỆM', template.page.width_mm / 2, 18, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  if (studentInfo?.hoTen) doc.text(`Họ tên: ${studentInfo.hoTen}`, 45, 26)
  if (studentInfo?.lop) doc.text(`Lớp: ${studentInfo.lop}`, 140, 26)

  drawAnchors(doc)

  drawDigitFieldLabel(doc, template.sbd.label, template.sbd.origin_mm.x, template.sbd.origin_mm.y)
  drawBubbleGroup(doc, genSbdBubbles())

  drawDigitFieldLabel(doc, template.madeThi.label, template.madeThi.origin_mm.x, template.madeThi.origin_mm.y)
  drawBubbleGroup(doc, genMadeThiBubbles())

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(template.phanI.label, template.phanI.blockOrigin_mm.x, template.phanI.blockOrigin_mm.y - 8)
  doc.setFont('helvetica', 'normal')
  drawQuestionNumbers(doc)
  drawBubbleGroup(doc, genPhanIBubbles())

  doc.setFont('helvetica', 'bold')
  doc.text(template.phanII.label, template.phanII.origin_mm.x, template.phanII.origin_mm.y - 8)
  doc.setFont('helvetica', 'normal')
  drawPhanIILabels(doc)
  drawBubbleGroup(doc, genPhanIIBubbles())

  doc.setFont('helvetica', 'bold')
  doc.text(template.phanIII.label, template.phanIII.blockOrigin_mm.x, template.phanIII.blockOrigin_mm.y - 8)
  doc.setFont('helvetica', 'normal')
  drawPhanIIILabels(doc)
  drawBubbleGroup(doc, genPhanIIIBubbles())

  doc.setFontSize(7)
  doc.text(
    'Tô kín bằng bút chì 2B. In khổ A4, scale 100% (tắt "Fit to page") để khớp với ứng dụng quét.',
    template.page.width_mm / 2,
    template.page.height_mm - 6,
    { align: 'center' },
  )

  return doc
}

/**
 * Mở PDF ra tab mới để xem/in/lưu trực tiếp thay vì chỉ âm thầm tải xuống —
 * trên một số trình duyệt di động (đặc biệt PWA cài lên màn hình chính trên
 * iPhone), download bằng thẻ <a download> chạy "im lặng" không có bất kỳ
 * phản hồi nào, khiến người dùng tưởng nút bấm không hoạt động. Mở tab mới
 * cho thấy ngay kết quả, và người dùng có sẵn nút Chia sẻ/In/Tải của chính
 * trình duyệt.
 *
 * Trả về 'opened' nếu mở được tab xem PDF, 'downloaded' nếu trình duyệt chặn
 * popup và phải rơi về tải file trực tiếp, để màn hình gọi hàm này báo đúng
 * thông báo cho người dùng.
 */
export function openOrDownloadAnswerSheetPdf(
  studentInfo?: { hoTen?: string; lop?: string },
  fileName = 'PhieuTraLoi.pdf',
): 'opened' | 'downloaded' {
  const doc = buildAnswerSheetPdf(studentInfo)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)

  const win = window.open(url, '_blank')
  let result: 'opened' | 'downloaded' = 'opened'
  if (!win) {
    // Trình duyệt chặn popup (thường do không coi đây là hành động người dùng
    // trực tiếp) — rơi về tải file trực tiếp qua thẻ <a download>.
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    result = 'downloaded'
  }

  // Giữ blob URL đủ lâu để tab mới/trình xem PDF tải xong rồi mới thu hồi.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
  return result
}
