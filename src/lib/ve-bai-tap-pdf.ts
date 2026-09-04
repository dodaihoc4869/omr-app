// VẼ PHIẾU BÀI TẬP RA PDF.
//
// Dùng jsPDF đã có sẵn trong dự án nên không thêm thư viện.
//
// Font: Be Vietnam Pro đã cắt gọn (assets/fonts/be-vietnam-pro.ts) — thiết kế
// riêng cho tiếng Việt, dấu cân và chữ thoáng nên in ra cỡ nhỏ vẫn rõ.
//
// Công thức Hoá: KHÔNG in chuỗi thô. Mọi đoạn chữ đi qua doanCongThuc() rồi vẽ
// bằng veDoanChu() để chỉ số dưới, số mũ và mũi tên phản ứng ra đúng. Bản đầu
// in thẳng chuỗi thành `CH3COOC2H5 + NaOH ->[t^o] ...`; em đọc phiếu là học
// theo đúng cái sai đó.
//
// Bố cục câu hỏi và phương án bám theo màn làm bài của học sinh: ô số câu bo
// tròn, nhãn phần/chuyên đề/mức độ, mỗi phương án một hàng có ô chữ cái riêng.
import { jsPDF } from 'jspdf'
import { BVP_BOLD_B64, BVP_REGULAR_B64 } from '../assets/fonts/be-vietnam-pro'
import type { CauLuyen } from './bai-tap-pdf'
import { doanCongThuc } from './chu-hoa-hoc-pdf'
import { caoDoanChu, veDoanChu, type KieuChu } from './ve-chu-pdf'

const FONT = 'BeVietnamPro'
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

const TR = { rong: 210, cao: 297, le: 16, dayTrang: 279 }
const RONG = TR.rong - TR.le * 2

const TEN_MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }
const CHU_PA = ['A', 'B', 'C', 'D']
const CHU_Y = ['a', 'b', 'c', 'd']

export interface DuLieuBaiTapPdf {
  hoTen: string
  sbd: string
  lop: string
  ngay: Date
  chuyenDe: { ten: string; soCau: number; soSai: number }[]
  cau: CauLuyen[]
  lapLai: number
}

function kieu(cx: number, mau: readonly number[], dam = false, giong = 1.45): KieuChu {
  return { cx, mau, dam, font: FONT, giong }
}

function dungFont(doc: jsPDF) {
  doc.addFileToVFS('BeVietnamPro-Regular.ttf', BVP_REGULAR_B64)
  doc.addFont('BeVietnamPro-Regular.ttf', FONT, 'normal')
  doc.addFileToVFS('BeVietnamPro-Bold.ttf', BVP_BOLD_B64)
  doc.addFont('BeVietnamPro-Bold.ttf', FONT, 'bold')
  doc.setFont(FONT, 'normal')
}

function to(doc: jsPDF, c: readonly number[]) {
  doc.setFillColor(c[0], c[1], c[2])
}
function chu(doc: jsPDF, c: readonly number[]) {
  doc.setTextColor(c[0], c[1], c[2])
}
function net(doc: jsPDF, c: readonly number[]) {
  doc.setDrawColor(c[0], c[1], c[2])
}

/** Nhãn bo tròn. Trả bề rộng đã vẽ. */
function nhan(doc: jsPDF, s: string, x: number, y: number, nen: readonly number[], mauChu: readonly number[]): number {
  doc.setFont(FONT, 'bold')
  doc.setFontSize(6.8)
  const w = doc.getTextWidth(s) + 5.4
  to(doc, nen)
  doc.roundedRect(x, y - 3.5, w, 5.2, 2.6, 2.6, 'F')
  chu(doc, mauChu)
  doc.text(s, x + 2.7, y)
  return w
}

function chanTrang(doc: jsPDF, i: number, tong: number, ten: string) {
  chu(doc, MAU.mo)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(7.5)
  doc.text('Thầy Đỗ Đại Học', TR.le, TR.cao - 10)
  doc.text(ten, TR.rong / 2, TR.cao - 10, { align: 'center' })
  doc.text(`${i}/${tong}`, TR.rong - TR.le, TR.cao - 10, { align: 'right' })
}

function sangTrang(doc: jsPDF, y: number, can: number): number {
  if (y + can < TR.dayTrang) return y
  doc.addPage()
  return TR.le + 8
}

function veDauTrang(doc: jsPDF, d: DuLieuBaiTapPdf) {
  const cao = 36
  const lat = 72
  for (let i = 0; i < lat; i++) {
    const k = i / (lat - 1)
    doc.setFillColor(
      Math.round(MAU.tim[0] + (MAU.tim2[0] - MAU.tim[0]) * k),
      Math.round(MAU.tim[1] + (MAU.tim2[1] - MAU.tim[1]) * k),
      Math.round(MAU.tim[2] + (MAU.tim2[2] - MAU.tim[2]) * k),
    )
    doc.rect((TR.rong / lat) * i, 0, TR.rong / lat + 0.4, cao, 'F')
  }
  chu(doc, MAU.trang)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(7.5)
  doc.text('T H Ầ Y   Đ Ỗ   Đ Ạ I   H Ọ C', TR.le, 12.5)
  doc.setFontSize(21)
  doc.text('Phiếu bài tập riêng', TR.le, 23)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9.5)
  const ng = `${String(d.ngay.getDate()).padStart(2, '0')}/${String(d.ngay.getMonth() + 1).padStart(2, '0')}/${d.ngay.getFullYear()}`
  doc.text(`${d.hoTen || `SBD ${d.sbd}`}${d.sbd ? ` · SBD ${d.sbd}` : ''}${d.lop ? ` · Lớp ${d.lop}` : ''} · ${ng}`, TR.le, 30)
}

function veViSao(doc: jsPDF, d: DuLieuBaiTapPdf, y: number): number {
  const sai = d.chuyenDe.filter((c) => c.soSai > 0).slice(0, 4)
  const cao = 14.5 + sai.length * 5.2 + (d.lapLai > 0 ? 5.2 : 0)
  to(doc, MAU.chim)
  doc.roundedRect(TR.le, y, RONG, cao, 3.5, 3.5, 'F')
  to(doc, MAU.tim)
  doc.roundedRect(TR.le, y, 1.8, cao, 0.9, 0.9, 'F')

  chu(doc, MAU.nhat)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(7)
  doc.text('VÌ SAO EM NHẬN PHIẾU NÀY', TR.le + 6.5, y + 7)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9.5)
  chu(doc, MAU.muc)
  let yy = y + 12.8
  for (const c of sai) {
    const pt = Math.round((c.soSai / Math.max(1, c.soCau)) * 100)
    doc.text(`${c.ten}: sai ${c.soSai}/${c.soCau} câu (${pt}%)`, TR.le + 6.5, yy)
    yy += 5.2
  }
  if (d.lapLai > 0) {
    chu(doc, MAU.cam)
    doc.setFontSize(8.5)
    doc.text(`Kho đề hết câu mới, ${d.lapLai} câu trong phiếu em đã từng làm.`, TR.le + 6.5, yy)
  }
  return y + cao + 9
}

function tieuMuc(doc: jsPDF, s: string, y: number): number {
  chu(doc, MAU.nhat)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(7.5)
  doc.text(s, TR.le, y)
  const w = doc.getTextWidth(s)
  net(doc, MAU.vien)
  doc.setLineWidth(0.4)
  doc.line(TR.le + w + 4, y - 1.2, TR.rong - TR.le, y - 1.2)
  return y + 8
}

/** Một câu trong phần ĐỀ BÀI. */
function veCau(doc: jsPDF, c: CauLuyen, stt: number, y: number): number {
  const xN = TR.le + 10
  const wN = RONG - 10
  const de = doanCongThuc(c.text)
  const kDe = kieu(10, MAU.muc)
  y = sangTrang(doc, y, Math.min(caoDoanChu(doc, de, wN, kDe) + 16, 70))

  to(doc, MAU.tim)
  doc.roundedRect(TR.le, y - 4.6, 7, 7, 2, 2, 'F')
  chu(doc, MAU.trang)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(String(stt), TR.le + 3.5, y, { align: 'center' })

  let xn = xN
  xn += nhan(doc, TEN_PHAN[c.phan] ?? c.phan, xn, y - 1.2, MAU.tim, MAU.trang) + 2
  if (c.chuyenDe) xn += nhan(doc, c.chuyenDe, xn, y - 1.2, MAU.vien, MAU.nhat) + 2
  if (c.mucDo) nhan(doc, TEN_MUC[c.mucDo] ?? c.mucDo, xn, y - 1.2, MAU.vien, MAU.nhat)
  y += 6.5

  y = veDoanChu(doc, de, xN, y, wN, kDe) + 2

  if (c.luaChon && c.phan === 'I') {
    for (let i = 0; i < c.luaChon.length; i++) {
      const pa = doanCongThuc(c.luaChon[i])
      const kPa = kieu(9.5, MAU.muc)
      const h = caoDoanChu(doc, pa, wN - 11, kPa)
      y = sangTrang(doc, y, h + 6)
      net(doc, MAU.vien)
      doc.setLineWidth(0.3)
      doc.roundedRect(xN, y - 4.4, wN, h + 3.4, 2.4, 2.4)
      to(doc, MAU.chim)
      doc.roundedRect(xN + 2, y - 3.6, 5.4, 5.4, 1.6, 1.6, 'F')
      chu(doc, MAU.nhat)
      doc.setFont(FONT, 'bold')
      doc.setFontSize(7.5)
      doc.text(CHU_PA[i], xN + 4.7, y, { align: 'center' })
      veDoanChu(doc, pa, xN + 10, y, wN - 12, kPa)
      y += h + 2.4
    }
  } else if (c.luaChon && c.phan === 'II') {
    for (let i = 0; i < c.luaChon.length; i++) {
      const yy = doanCongThuc(c.luaChon[i])
      const kY = kieu(9.5, MAU.muc)
      const h = caoDoanChu(doc, yy, wN - 34, kY)
      y = sangTrang(doc, y, h + 6)
      net(doc, MAU.vien)
      doc.setLineWidth(0.3)
      doc.roundedRect(xN, y - 4.4, wN, h + 3.4, 2.4, 2.4)
      to(doc, MAU.chim)
      doc.roundedRect(xN + 2, y - 3.6, 5.4, 5.4, 1.6, 1.6, 'F')
      chu(doc, MAU.nhat)
      doc.setFont(FONT, 'bold')
      doc.setFontSize(7.5)
      doc.text(CHU_Y[i], xN + 4.7, y, { align: 'center' })
      veDoanChu(doc, yy, xN + 10, y, wN - 34, kY)
      // Ô tick Đúng / Sai ngay trên giấy, chừa 3mm khỏi mép ô cho khỏi chạm viền
      const xO = TR.rong - TR.le - 24
      net(doc, MAU.mo)
      doc.setLineWidth(0.3)
      doc.rect(xO, y - 3.6, 4.2, 4.2)
      doc.rect(xO + 11, y - 3.6, 4.2, 4.2)
      chu(doc, MAU.mo)
      doc.setFont(FONT, 'normal')
      doc.setFontSize(6.8)
      doc.text('Đ', xO + 5.4, y - 0.4)
      doc.text('S', xO + 16.4, y - 0.4)
      y += h + 2.4
    }
  } else {
    y = sangTrang(doc, y, 12)
    net(doc, MAU.vien)
    doc.setLineWidth(0.3)
    doc.roundedRect(xN, y - 3.4, 58, 9.5, 2.4, 2.4)
    chu(doc, MAU.mo)
    doc.setFont(FONT, 'normal')
    doc.setFontSize(8)
    doc.text('Đáp án:', xN + 3.4, y + 2.4)
    y += 9.5
  }
  return y + 5.5
}

function veGiai(doc: jsPDF, c: CauLuyen, stt: number, y: number): number {
  y = sangTrang(doc, y, 30)
  to(doc, MAU.chim)
  doc.roundedRect(TR.le, y - 4.6, 7, 7, 2, 2, 'F')
  chu(doc, MAU.tim)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(8)
  doc.text(String(stt), TR.le + 3.5, y, { align: 'center' })

  const x = TR.le + 10
  const w = RONG - 10
  // Phần II: "DDSS" là chữ của máy. Viết ra thành từng ý cho em đọc được.
  const dapAnChu =
    c.phan === 'II' && /^[DS]{2,4}$/.test(c.dapAn)
      ? c.dapAn
          .split('')
          .map((k, i) => `${CHU_Y[i]} ${k === 'D' ? 'Đúng' : 'Sai'}`)
          .join(' · ')
      : c.dapAn || '—'
  const dapAn = doanCongThuc(dapAnChu)
  chu(doc, MAU.xanh)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(9.5)
  doc.text('Đáp án: ', x, y)
  const wNhan = doc.getTextWidth('Đáp án: ')
  veDoanChu(doc, dapAn, x + wNhan, y, w - wNhan, kieu(9.5, MAU.xanh, true))
  y += 6.2

  // HƯỚNG LÀM — câu chốt của kho đề: bài này đi đường nào. Em đọc dòng này là
  // biết phải nghĩ theo hướng gì trước khi lao vào tính.
  if (c.chot) {
    y = nhanNho(doc, 'HƯỚNG LÀM', x, y)
    y = veDoanChu(doc, doanCongThuc(c.chot), x, y, w, kieu(9.5, MAU.muc, true)) + 2.4
  }

  // VÌ SAO TỪNG PHƯƠNG ÁN — in ĐỦ cả bốn, kể cả phương án đúng, để em biết vì
  // sao ba cái kia sai chứ không chỉ nhớ mỗi chữ cái đúng.
  if (c.lyDo && c.lyDo.length > 0) {
    y = nhanNho(doc, c.phan === 'II' ? 'VÌ SAO TỪNG Ý' : 'VÌ SAO TỪNG PHƯƠNG ÁN', x, y)
    for (const l of c.lyDo) {
      const ly = doanCongThuc(l.ly)
      const k = kieu(9, MAU.nhat)
      const h = caoDoanChu(doc, ly, w - 9, k)
      y = sangTrang(doc, y, h + 4)
      chu(doc, l.dung ? MAU.xanh : MAU.do)
      doc.setFont(FONT, 'bold')
      doc.setFontSize(9)
      doc.text(`${l.khoa}.`, x + 1.5, y)
      veDoanChu(doc, ly, x + 9, y, w - 9, k)
      y += h + 1.2
    }
    y += 1.2
  }

  // CÁC BƯỚC — đánh số để em làm theo đúng thứ tự, không nhảy cóc.
  const buoc = c.buoc ?? []
  if (buoc.length > 0) {
    y = nhanNho(doc, 'LÀM TỪNG BƯỚC', x, y)
    buoc.forEach((b, i) => {
      const bb = doanCongThuc(b)
      const k = kieu(9, MAU.muc)
      const h = caoDoanChu(doc, bb, w - 10, k)
      y = sangTrang(doc, y, h + 4)
      to(doc, MAU.chim)
      doc.circle(x + 2.6, y - 1.3, 2.4, 'F')
      chu(doc, MAU.tim)
      doc.setFont(FONT, 'bold')
      doc.setFontSize(6.6)
      doc.text(String(i + 1), x + 2.6, y - 0.1, { align: 'center' })
      veDoanChu(doc, bb, x + 10, y, w - 10, k)
      y += h + 1.4
    })
    y += 1
  }

  if (c.ketQua) {
    const kq = doanCongThuc(c.ketQua)
    const kK = kieu(9.5, MAU.xanh, true)
    const h = caoDoanChu(doc, kq, w - 24, kK)
    y = sangTrang(doc, y, h + 8)
    to(doc, MAU.chim)
    doc.roundedRect(x, y - 4.6, Math.min(w, 90), h + 4.4, 2.4, 2.4, 'F')
    chu(doc, MAU.nhat)
    doc.setFont(FONT, 'bold')
    doc.setFontSize(7)
    doc.text('KẾT QUẢ', x + 3.4, y)
    veDoanChu(doc, kq, x + 22, y, w - 24, kK)
    y += h + 2.4
  }
  return y + 6
}

/** Nhãn nhỏ in hoa mở đầu một mục trong lời giải. */
function nhanNho(doc: jsPDF, s: string, x: number, y: number): number {
  chu(doc, MAU.mo)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(6.6)
  doc.text(s, x, y)
  return y + 4.4
}

export function veBaiTapPdf(d: DuLieuBaiTapPdf): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  dungFont(doc)
  const ten = d.hoTen || `SBD ${d.sbd}`

  veDauTrang(doc, d)
  let y = 46
  y = veViSao(doc, d, y)
  y = tieuMuc(doc, `ĐỀ BÀI · ${d.cau.length} CÂU`, y)
  d.cau.forEach((c, i) => {
    y = veCau(doc, c, i + 1, y)
  })

  // LỜI GIẢI sang trang mới: em làm hết đề rồi mới lật.
  doc.addPage()
  y = TR.le + 8
  chu(doc, MAU.tim)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(16)
  doc.text('Lời giải', TR.le, y)
  chu(doc, MAU.mo)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8.5)
  doc.text('Em làm hết đề rồi mới xem phần này.', TR.le, y + 6)
  y += 15

  d.cau.forEach((c, i) => {
    y = veGiai(doc, c, i + 1, y)
  })

  const tong = doc.getNumberOfPages()
  for (let i = 1; i <= tong; i++) {
    doc.setPage(i)
    chanTrang(doc, i, tong, ten)
  }
  return doc
}
