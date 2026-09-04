// VẼ PHIẾU BÀI TẬP RA PDF.
//
// Dùng jsPDF đã có sẵn trong dự án (phiếu trả lời trắc nghiệm cũng dùng nó) nên
// không thêm thư viện — chốt công nghệ, không đổi giữa chừng.
//
// Font: phải nhúng Roboto đã subset tiếng Việt. Font hệ thống của jsPDF chỉ có
// bảng mã WinAnsi, in tiếng Việt ra là "PHI¾U BÀI T¾P".
//
// Màu: jsPDF nhận số RGB chứ không nhận biến CSS, nên bảng màu chép tay ở đây
// và ĐẶT ĐÚNG MỘT CHỖ, lấy đúng giá trị của nhóm `--p-*` trong tokens.css để
// phiếu in ra cùng tông với báo cáo HTML.
import { jsPDF } from 'jspdf'
import { ROBOTO_VN_BOLD_B64, ROBOTO_VN_REGULAR_B64 } from '../assets/fonts/roboto-vn'
import { chuThuan, type CauLuyen } from './bai-tap-pdf'

const FONT = 'RobotoVN'
const MAU = {
  tim: [99, 102, 241],
  tim2: [139, 92, 246],
  muc: [26, 35, 50],
  nhat: [107, 114, 128],
  mo: [156, 163, 175],
  vien: [229, 231, 235],
  chim: [243, 244, 246],
  trang: [255, 255, 255],
  xanh: [16, 185, 129],
  do: [239, 68, 68],
  cam: [245, 158, 11],
} as const

const TRANG = { rong: 210, cao: 297, le: 16 }
const RONG = TRANG.rong - TRANG.le * 2

const TEN_MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }

export interface DuLieuBaiTapPdf {
  hoTen: string
  sbd: string
  lop: string
  ngay: Date
  /** Chuyên đề em đang yếu, để in phần "vì sao có phiếu này". */
  chuyenDe: { ten: string; soCau: number; soSai: number }[]
  cau: CauLuyen[]
  /** Số câu phải lấy lại từ câu em đã làm — in ra để thầy biết, không giấu. */
  lapLai: number
}

function dungFont(doc: jsPDF) {
  doc.addFileToVFS('RobotoVN-Regular.ttf', ROBOTO_VN_REGULAR_B64)
  doc.addFont('RobotoVN-Regular.ttf', FONT, 'normal')
  doc.addFileToVFS('RobotoVN-Bold.ttf', ROBOTO_VN_BOLD_B64)
  doc.addFont('RobotoVN-Bold.ttf', FONT, 'bold')
  doc.setFont(FONT, 'normal')
}

function mau(doc: jsPDF, loai: 'fill' | 'text' | 'draw', c: readonly number[]) {
  if (loai === 'fill') doc.setFillColor(c[0], c[1], c[2])
  else if (loai === 'text') doc.setTextColor(c[0], c[1], c[2])
  else doc.setDrawColor(c[0], c[1], c[2])
}

/** Viết một đoạn có xuống dòng tự động, trả về y mới. */
function viet(doc: jsPDF, chu: string, x: number, y: number, rong: number, cx: number, dam = false, giong = 1.42): number {
  doc.setFont(FONT, dam ? 'bold' : 'normal')
  doc.setFontSize(cx)
  const dong = doc.splitTextToSize(chuThuan(chu), rong) as string[]
  for (const d of dong) {
    doc.text(d, x, y)
    y += (cx * giong) / 2.84
  }
  return y
}

function caoCua(doc: jsPDF, chu: string, rong: number, cx: number, giong = 1.42): number {
  doc.setFontSize(cx)
  const dong = doc.splitTextToSize(chuThuan(chu), rong) as string[]
  return (dong.length * cx * giong) / 2.84
}

/** Nhãn bo tròn nhỏ (chuyên đề, mức độ). Trả về bề rộng đã vẽ. */
function nhan(doc: jsPDF, chu: string, x: number, y: number, nen: readonly number[], chuMau: readonly number[]): number {
  doc.setFont(FONT, 'bold')
  doc.setFontSize(7)
  const w = doc.getTextWidth(chu) + 5
  mau(doc, 'fill', nen)
  doc.roundedRect(x, y - 3.4, w, 5, 2.5, 2.5, 'F')
  mau(doc, 'text', chuMau)
  doc.text(chu, x + 2.5, y)
  return w
}

function chanTrang(doc: jsPDF, so: number, tong: number) {
  mau(doc, 'text', MAU.mo)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8)
  doc.text('Thầy Đỗ Đại Học', TRANG.le, TRANG.cao - 10)
  doc.text(`${so}/${tong}`, TRANG.rong - TRANG.le, TRANG.cao - 10, { align: 'right' })
}

/** Xuống trang mới khi không còn đủ chỗ. */
function canTrang(doc: jsPDF, y: number, can: number): number {
  if (y + can < TRANG.cao - 18) return y
  doc.addPage()
  return TRANG.le + 6
}

function veDauTrang(doc: jsPDF, d: DuLieuBaiTapPdf) {
  // Dải màu: vẽ nhiều lát mỏng để ra hiệu ứng chuyển màu, jsPDF không có gradient.
  const cao = 34
  const lat = 60
  for (let i = 0; i < lat; i++) {
    const k = i / (lat - 1)
    doc.setFillColor(
      Math.round(MAU.tim[0] + (MAU.tim2[0] - MAU.tim[0]) * k),
      Math.round(MAU.tim[1] + (MAU.tim2[1] - MAU.tim[1]) * k),
      Math.round(MAU.tim[2] + (MAU.tim2[2] - MAU.tim[2]) * k),
    )
    doc.rect((TRANG.rong / lat) * i, 0, TRANG.rong / lat + 0.4, cao, 'F')
  }
  mau(doc, 'text', MAU.trang)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text('T H Ầ Y   Đ Ỗ   Đ Ạ I   H Ọ C', TRANG.le, 12)
  doc.setFontSize(20)
  doc.text('Phiếu bài tập riêng', TRANG.le, 22)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9.5)
  const ngay = `${String(d.ngay.getDate()).padStart(2, '0')}/${String(d.ngay.getMonth() + 1).padStart(2, '0')}/${d.ngay.getFullYear()}`
  doc.text(`${d.hoTen || `SBD ${d.sbd}`}${d.sbd ? ` · SBD ${d.sbd}` : ''}${d.lop ? ` · Lớp ${d.lop}` : ''} · ${ngay}`, TRANG.le, 29)
}

function veViSao(doc: jsPDF, d: DuLieuBaiTapPdf, y: number): number {
  const sai = d.chuyenDe.filter((c) => c.soSai > 0).slice(0, 4)
  const cao = 15 + sai.length * 5.4 + (d.lapLai > 0 ? 5 : 0)
  mau(doc, 'fill', MAU.chim)
  doc.roundedRect(TRANG.le, y, RONG, cao, 3, 3, 'F')
  mau(doc, 'fill', MAU.tim)
  doc.rect(TRANG.le, y, 1.6, cao, 'F')

  mau(doc, 'text', MAU.nhat)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(7.5)
  doc.text('VÌ SAO EM NHẬN PHIẾU NÀY', TRANG.le + 6, y + 7)
  mau(doc, 'text', MAU.muc)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9.5)
  let yy = y + 13
  for (const c of sai) {
    const pt = Math.round((c.soSai / Math.max(1, c.soCau)) * 100)
    doc.text(`${c.ten}: sai ${c.soSai}/${c.soCau} câu (${pt}%)`, TRANG.le + 6, yy)
    yy += 5.4
  }
  if (d.lapLai > 0) {
    mau(doc, 'text', MAU.cam)
    doc.setFontSize(8.5)
    doc.text(`Kho đề hết câu mới, ${d.lapLai} câu trong phiếu em đã từng làm.`, TRANG.le + 6, yy)
  }
  return y + cao + 8
}

function veMotCau(doc: jsPDF, c: CauLuyen, stt: number, y: number): number {
  const xNoi = TRANG.le + 9
  const rongNoi = RONG - 9

  let can = caoCua(doc, c.text, rongNoi, 10) + 12
  if (c.luaChon) can += c.luaChon.reduce((s, t) => s + caoCua(doc, t, rongNoi - 7, 9.5) + 1.5, 0)
  else can += 12
  y = canTrang(doc, y, Math.min(can, 90))

  // Số câu trong ô tròn
  mau(doc, 'fill', MAU.tim)
  doc.circle(TRANG.le + 3.4, y - 1.4, 3.4, 'F')
  mau(doc, 'text', MAU.trang)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(String(stt), TRANG.le + 3.4, y + 0.5, { align: 'center' })

  // Nhãn phần + chuyên đề + mức độ
  let xn = xNoi
  xn += nhan(doc, TEN_PHAN[c.phan] ?? c.phan, xn, y - 1, MAU.tim, MAU.trang) + 2
  if (c.chuyenDe) xn += nhan(doc, c.chuyenDe, xn, y - 1, MAU.vien, MAU.nhat) + 2
  if (c.mucDo) nhan(doc, TEN_MUC[c.mucDo] ?? c.mucDo, xn, y - 1, MAU.vien, MAU.nhat)
  y += 6

  mau(doc, 'text', MAU.muc)
  y = viet(doc, c.text, xNoi, y, rongNoi, 10)
  y += 1.5

  if (c.luaChon && c.phan === 'I') {
    for (let i = 0; i < c.luaChon.length; i++) {
      y = canTrang(doc, y, 10)
      mau(doc, 'text', MAU.nhat)
      doc.setFont(FONT, 'bold')
      doc.setFontSize(9.5)
      doc.text(`${['A', 'B', 'C', 'D'][i]}.`, xNoi + 2, y)
      mau(doc, 'text', MAU.muc)
      y = viet(doc, c.luaChon[i], xNoi + 9, y, rongNoi - 9, 9.5)
      y += 1
    }
  } else if (c.luaChon && c.phan === 'II') {
    for (let i = 0; i < c.luaChon.length; i++) {
      y = canTrang(doc, y, 10)
      mau(doc, 'text', MAU.nhat)
      doc.setFont(FONT, 'bold')
      doc.setFontSize(9.5)
      doc.text(`${['a', 'b', 'c', 'd'][i]})`, xNoi + 2, y)
      mau(doc, 'text', MAU.muc)
      const yTruoc = y
      y = viet(doc, c.luaChon[i], xNoi + 9, y, rongNoi - 34, 9.5)
      // Hai ô vuông Đúng / Sai để em tick ngay trên giấy
      mau(doc, 'draw', MAU.mo)
      doc.setLineWidth(0.3)
      doc.rect(TRANG.rong - TRANG.le - 22, yTruoc - 3.2, 4, 4)
      doc.rect(TRANG.rong - TRANG.le - 9, yTruoc - 3.2, 4, 4)
      mau(doc, 'text', MAU.mo)
      doc.setFont(FONT, 'normal')
      doc.setFontSize(7)
      doc.text('Đ', TRANG.rong - TRANG.le - 17, yTruoc)
      doc.text('S', TRANG.rong - TRANG.le - 4, yTruoc)
      mau(doc, 'text', MAU.muc)
      y += 1
    }
  } else {
    y = canTrang(doc, y, 12)
    mau(doc, 'draw', MAU.vien)
    doc.setLineWidth(0.3)
    doc.roundedRect(xNoi, y - 2, 52, 9, 2, 2)
    mau(doc, 'text', MAU.mo)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(8)
    doc.text('Đáp án:', xNoi + 3, y + 3.6)
    mau(doc, 'text', MAU.muc)
    y += 10
  }
  return y + 5
}

function veLoiGiai(doc: jsPDF, c: CauLuyen, stt: number, y: number): number {
  y = canTrang(doc, y, 32)
  mau(doc, 'fill', MAU.chim)
  doc.circle(TRANG.le + 3.4, y - 1.4, 3.4, 'F')
  mau(doc, 'text', MAU.tim)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(String(stt), TRANG.le + 3.4, y + 0.5, { align: 'center' })

  const x = TRANG.le + 9
  const rong = RONG - 9
  mau(doc, 'text', MAU.xanh)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(9.5)
  doc.text(`Đáp án: ${c.dapAn || '—'}`, x, y)
  y += 6

  if (c.chot) {
    mau(doc, 'text', MAU.muc)
    y = viet(doc, c.chot, x, y, rong, 9.5, true)
    y += 1.5
  }
  for (const l of c.lyDo ?? []) {
    y = canTrang(doc, y, 10)
    mau(doc, 'text', l.dung ? MAU.xanh : MAU.do)
    doc.setFont(FONT, 'bold')
    doc.setFontSize(9)
    doc.text(`${l.khoa}.`, x + 2, y)
    mau(doc, 'text', MAU.nhat)
    y = viet(doc, l.ly, x + 8, y, rong - 8, 9)
    y += 0.8
  }
  for (const b of c.buoc ?? []) {
    y = canTrang(doc, y, 10)
    mau(doc, 'fill', MAU.tim)
    doc.circle(x + 2, y - 1.2, 0.9, 'F')
    mau(doc, 'text', MAU.nhat)
    y = viet(doc, b, x + 6, y, rong - 6, 9)
    y += 0.8
  }
  if (c.ketQua) {
    mau(doc, 'text', MAU.muc)
    y = viet(doc, `Kết quả: ${c.ketQua}`, x, y, rong, 9, true)
  }
  return y + 6
}

/** Dựng cả file PDF. Trả về jsPDF để bên gọi tự quyết định tải hay chia sẻ. */
export function veBaiTapPdf(d: DuLieuBaiTapPdf): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  dungFont(doc)

  veDauTrang(doc, d)
  let y = 44
  y = veViSao(doc, d, y)

  mau(doc, 'text', MAU.nhat)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(`ĐỀ BÀI · ${d.cau.length} CÂU`, TRANG.le, y)
  mau(doc, 'draw', MAU.vien)
  doc.setLineWidth(0.4)
  doc.line(TRANG.le + 30, y - 1.2, TRANG.rong - TRANG.le, y - 1.2)
  y += 8

  d.cau.forEach((c, i) => {
    y = veMotCau(doc, c, i + 1, y)
  })

  // LỜI GIẢI sang trang mới: em làm hết đề rồi mới lật, không nhìn thấy đáp án
  // trong lúc đang làm.
  doc.addPage()
  y = TRANG.le + 6
  mau(doc, 'text', MAU.tim)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(15)
  doc.text('Lời giải', TRANG.le, y)
  mau(doc, 'text', MAU.mo)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8.5)
  doc.text('Em làm hết đề rồi mới xem phần này.', TRANG.le, y + 6)
  y += 14

  d.cau.forEach((c, i) => {
    y = veLoiGiai(doc, c, i + 1, y)
  })

  const tong = doc.getNumberOfPages()
  for (let i = 1; i <= tong; i++) {
    doc.setPage(i)
    chanTrang(doc, i, tong)
  }
  return doc
}
