// Sinh PDF phiếu trả lời trắc nghiệm từ template2025.json — DÙNG CHUNG toạ độ
// với module đọc ảnh (src/engine/template.ts) nên in ra và quét lại không
// bao giờ lệch nhau. A5, scale in phải để nguyên 100% (không "fit to page").
import { jsPDF } from 'jspdf'
import { ROBOTO_VN_BOLD_B64, ROBOTO_VN_REGULAR_B64 } from '../assets/fonts/roboto-vn'
import {
  genMadeThiBubbles,
  genPhanIBubbles,
  genPhanIIBubbles,
  genPhanIIIBubbles,
  genSbdBubbles,
  template,
} from '../engine/template'

const BUBBLE_R = template.bubble_diameter_mm / 2
const FONT = 'RobotoVN'

/**
 * Font hệ thống của jsPDF (helvetica/times/courier) chỉ có bảng mã WinAnsi,
 * KHÔNG có ký tự tiếng Việt có dấu — in ra sẽ lỗi kiểu "PHI¾U TR¢ LÜI"
 * (mojibake). Nhúng font Roboto (đã subset chỉ giữ Latin cơ bản + dấu tiếng
 * Việt, ~27KB/file) vào PDF để hiển thị đúng chữ có dấu.
 */
function registerVietnameseFont(doc: jsPDF) {
  doc.addFileToVFS('RobotoVN-Regular.ttf', ROBOTO_VN_REGULAR_B64)
  doc.addFont('RobotoVN-Regular.ttf', FONT, 'normal')
  doc.addFileToVFS('RobotoVN-Bold.ttf', ROBOTO_VN_BOLD_B64)
  doc.addFont('RobotoVN-Bold.ttf', FONT, 'bold')
  doc.setFont(FONT, 'normal')
}

function drawAnchors(doc: jsPDF) {
  doc.setFillColor(0, 0, 0)
  for (const a of template.anchors) {
    doc.rect(a.x_mm, a.y_mm, a.size_mm, a.size_mm, 'F')
  }
}

function drawBubbleGroup(doc: jsPDF, bubbles: ReturnType<typeof genSbdBubbles>) {
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.12)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(4.3)
  for (const b of bubbles) {
    doc.circle(b.x_mm, b.y_mm, BUBBLE_R, 'S')
    doc.text(b.value, b.x_mm, b.y_mm + 0.75, { align: 'center' })
  }
}

function drawDigitFieldLabel(doc: jsPDF, label: string, x: number, y: number) {
  doc.setFontSize(7.5)
  doc.setFont(FONT, 'bold')
  doc.text(label, x, y - 2.5)
  doc.setFont(FONT, 'normal')
}

function drawQuestionNumbers(doc: jsPDF) {
  const t = template.phanI
  doc.setFontSize(6)
  for (let q = 0; q < t.questions; q++) {
    const block = Math.floor(q / t.questionsPerBlock)
    const rowInBlock = q % t.questionsPerBlock
    const x = t.blockOrigin_mm.x + block * t.blockSpacing_mm.x - 4.5
    const y = t.blockOrigin_mm.y + rowInBlock * t.pitch_mm.y + 1
    doc.text(String(q + 1), x, y)
  }
}

function drawPhanIILabels(doc: jsPDF) {
  const t = template.phanII
  doc.setFontSize(6)
  for (let q = 0; q < t.questions; q++) {
    const y = t.origin_mm.y + q * t.questionPitch_mm + 1
    doc.text(`Câu ${q + 1}`, t.origin_mm.x - 10, y)
    for (let idea = 0; idea < t.ideas; idea++) {
      const ideaX = t.origin_mm.x + idea * t.ideaSpacing_mm
      doc.text(`Ý${idea + 1}`, ideaX + 2.5, y - 2.5, { align: 'center' })
    }
  }
}

function drawPhanIIILabels(doc: jsPDF) {
  const t = template.phanIII
  doc.setFontSize(6)
  const blockCenter = ((t.cols - 1) * t.pitch_mm.x) / 2
  for (let q = 0; q < t.questions; q++) {
    const x = t.blockOrigin_mm.x + q * t.blockSpacing_mm.x + blockCenter
    doc.text(`Câu ${q + 1}`, x, t.blockOrigin_mm.y - 1.8, { align: 'center' })
  }
}

export function buildAnswerSheetPdf(studentInfo?: { hoTen?: string; lop?: string }): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' })
  registerVietnameseFont(doc)

  doc.setFontSize(11.5)
  doc.setFont(FONT, 'bold')
  doc.text('PHIẾU TRẢ LỜI TRẮC NGHIỆM', template.page.width_mm / 2, 14.5, { align: 'center' })
  doc.setFont(FONT, 'normal')
  doc.setFontSize(7.5)
  if (studentInfo?.hoTen) doc.text(`Họ tên: ${studentInfo.hoTen}`, 20, 21)
  if (studentInfo?.lop) doc.text(`Lớp: ${studentInfo.lop}`, 100, 21)

  drawAnchors(doc)

  drawDigitFieldLabel(doc, template.sbd.label, template.sbd.origin_mm.x, template.sbd.origin_mm.y)
  drawBubbleGroup(doc, genSbdBubbles())

  drawDigitFieldLabel(doc, template.madeThi.label, template.madeThi.origin_mm.x, template.madeThi.origin_mm.y)
  drawBubbleGroup(doc, genMadeThiBubbles())

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(template.phanI.label, template.phanI.blockOrigin_mm.x, template.phanI.blockOrigin_mm.y - 5)
  doc.setFont(FONT, 'normal')
  drawQuestionNumbers(doc)
  drawBubbleGroup(doc, genPhanIBubbles())

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(template.phanII.label, template.phanII.origin_mm.x, template.phanII.origin_mm.y - 5)
  doc.setFont(FONT, 'normal')
  drawPhanIILabels(doc)
  drawBubbleGroup(doc, genPhanIIBubbles())

  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(template.phanIII.label, template.phanIII.blockOrigin_mm.x, template.phanIII.blockOrigin_mm.y - 5)
  doc.setFont(FONT, 'normal')
  drawPhanIIILabels(doc)
  drawBubbleGroup(doc, genPhanIIIBubbles())

  doc.setFontSize(5.5)
  doc.text(
    'Tô kín bằng bút chì 2B. In khổ A5, scale 100% (tắt "Fit to page") để khớp với ứng dụng quét.',
    template.page.width_mm / 2,
    template.page.height_mm - 5,
    { align: 'center' },
  )

  return doc
}

/**
 * Tải PDF trực tiếp qua thẻ <a download> (blob) — CỐ Ý không dùng
 * window.open() ở BƯỚC NÀY: nếu hàm này chạy sau một setTimeout/rAF (để
 * nhường UI thread vẽ trạng thái "Đang tạo…" trước khi build PDF nặng — xem
 * PrintSheetScreen), lệnh gọi không còn nằm trong đúng user-gesture đồng bộ
 * nữa, và Chrome/Safari di động có thể âm thầm chặn window.open() như popup —
 * trông y hệt "bấm không phản hồi". Tải bằng thẻ <a download> không bị giới
 * hạn này.
 *
 * Trả về blob URL của PDF vừa tạo — màn hình giữ lại để hiện nút "Xem PDF vừa
 * tạo": lúc đó người dùng bấm trực tiếp vào nút đó (user-gesture mới, đồng
 * bộ), nên window.open lúc ấy mở tin cậy, không bị chặn như khi gọi tự động.
 * Gọi objectUrlToRevoke trước đó (nếu có) để giải phóng blob URL của lần tạo
 * trước, tránh rò rỉ bộ nhớ khi người dùng tạo phiếu nhiều lần liên tiếp.
 */
export function downloadAnswerSheetPdfBlob(
  studentInfo?: { hoTen?: string; lop?: string },
  fileName = 'PhieuTraLoi.pdf',
  objectUrlToRevoke?: string,
): string {
  if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke)

  const doc = buildAnswerSheetPdf(studentInfo)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  return url
}
