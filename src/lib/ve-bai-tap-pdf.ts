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
// TỪ 04-09-2026 dùng bộ khối chung `the-cau-pdf.ts` (mẫu thầy chốt): dải mở
// phần, thẻ câu bo góc có dải màu, phương án bo tròn, ô giải thích kem. Mọi PDF
// tải xuống về sau lấy đúng bộ khối đó, không ai vẽ lại kiểu riêng.
import { jsPDF } from 'jspdf'
import { BVP_BOLD_B64, BVP_REGULAR_B64 } from '../assets/fonts/be-vietnam-pro'
import type { CauLuyen } from './bai-tap-pdf'
import { doanCongThuc } from './chu-hoa-hoc-pdf'
import { caoDoanChu, veDoanChu } from './ve-chu-pdf'
import { chu, doCaoThe, kieu, mauCua, net, to, veDauPhan, veTheCau, MAU, RONG, TR, type CauVe, type KieuThe } from './the-cau-pdf'

const FONT = 'BeVietnamPro'

const TEN_MUC: Record<string, string> = { biet: 'Nhận biết', hieu: 'Thông hiểu', van_dung: 'Vận dụng' }
const CHU_Y = ['a', 'b', 'c', 'd']
const PHAN_DE = ['I', 'II', 'III'] as const

export interface DuLieuBaiTapPdf {
  hoTen: string
  sbd: string
  lop: string
  ngay: Date
  chuyenDe: { ten: string; soCau: number; soSai: number }[]
  cau: CauLuyen[]
  lapLai: number
}

function dungFont(doc: jsPDF) {
  doc.addFileToVFS('BeVietnamPro-Regular.ttf', BVP_REGULAR_B64)
  doc.addFont('BeVietnamPro-Regular.ttf', FONT, 'normal')
  doc.addFileToVFS('BeVietnamPro-Bold.ttf', BVP_BOLD_B64)
  doc.addFont('BeVietnamPro-Bold.ttf', FONT, 'bold')
  doc.setFont(FONT, 'normal')
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
  return TR.le + 6
}

function veDauTrang(doc: jsPDF, tieuDe: string, phu: string) {
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
  doc.text(tieuDe, TR.le, 23)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(9.5)
  doc.text(phu, TR.le, 30)
}

function ngayVN(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
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

/** Phần II lưu đáp án dạng "DDSS" — chữ của máy. Viết ra thành từng ý. */
function dapAnChu(c: CauLuyen): string {
  if (c.phan === 'II' && /^[DS]{2,4}$/.test(c.dapAn)) {
    return c.dapAn
      .split('')
      .map((k, i) => `${CHU_Y[i]} ${k === 'D' ? 'Đúng' : 'Sai'}`)
      .join(' · ')
  }
  return c.dapAn || '—'
}

/** Tiêu đề trên dải màu của thẻ: chuyên đề + mức độ, cắt cho vừa một dòng. */
function tieuDeThe(c: CauLuyen): string {
  const p = [c.chuyenDe, c.mucDo ? (TEN_MUC[c.mucDo] ?? c.mucDo) : ''].filter(Boolean).join(' · ')
  return p.length > 62 ? p.slice(0, 61) + '…' : p
}

function sangCauVe(c: CauLuyen, hienChot: boolean): CauVe {
  return {
    phan: c.phan,
    tieuDe: tieuDeThe(c),
    text: c.text,
    luaChon: c.luaChon,
    dapAn: c.dapAn,
    chot: hienChot ? c.chot || '' : '',
  }
}

/** Nhãn nhỏ in hoa mở đầu một mục trong lời giải. */
function nhanNho(doc: jsPDF, s: string, x: number, y: number): number {
  chu(doc, MAU.mo)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(6.6)
  doc.text(s, x, y)
  return y + 4.4
}

/** Phần giải chi tiết in NGAY DƯỚI thẻ câu: vì sao từng phương án, các bước,
 * kết quả. Thầy chốt lời giải phải định hướng rồi mới đi từng bước, nên ba mục
 * này giữ nguyên dù thẻ đã có ô kem "hướng làm". */
function veGiaiChiTiet(doc: jsPDF, c: CauLuyen, y: number): number {
  const x = TR.le + 6
  const w = RONG - 12

  if (c.lyDo && c.lyDo.length > 0) {
    y = sangTrang(doc, y, 12)
    y = nhanNho(doc, c.phan === 'II' ? 'VÌ SAO TỪNG Ý' : 'VÌ SAO TỪNG PHƯƠNG ÁN', x, y)
    for (const l of c.lyDo) {
      const ly = doanCongThuc(l.ly)
      const k = kieu(9, MAU.nhat, FONT)
      const h = caoDoanChu(doc, ly, w - 9, k)
      y = sangTrang(doc, y, h + 4)
      chu(doc, l.dung ? MAU.xanhDam : MAU.doDam)
      doc.setFont(FONT, 'bold')
      doc.setFontSize(9)
      doc.text(`${l.khoa}.`, x + 1.5, y)
      veDoanChu(doc, ly, x + 9, y, w - 9, k)
      y += h + 1.2
    }
    y += 1.2
  }

  const buoc = c.buoc ?? []
  if (buoc.length > 0) {
    y = sangTrang(doc, y, 12)
    y = nhanNho(doc, 'LÀM TỪNG BƯỚC', x, y)
    buoc.forEach((b, i) => {
      const bb = doanCongThuc(b)
      const k = kieu(9, MAU.muc, FONT)
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
    const kK = kieu(9.5, MAU.xanhDam, FONT, true)
    const h = caoDoanChu(doc, kq, w - 26, kK)
    y = sangTrang(doc, y, h + 9)
    to(doc, MAU.xanhNen)
    net(doc, MAU.xanhVien)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, y - 4.6, Math.min(w, 96), h + 4.6, 2.4, 2.4, 'FD')
    chu(doc, MAU.xanhDam)
    doc.setFont(FONT, 'bold')
    doc.setFontSize(7)
    doc.text('KẾT QUẢ', x + 4, y)
    veDoanChu(doc, kq, x + 24, y, w - 26, kK)
    y += h + 2.6
  }
  return y
}

/** Vẽ một dãy câu theo từng phần, mỗi phần một dải mở đầu. */
function veDaySoCau(doc: jsPDF, ds: CauLuyen[], y: number, kt: KieuThe, giaiChiTiet: boolean): number {
  let stt = 0
  for (const p of PHAN_DE) {
    const trong = ds.filter((c) => c.phan === p)
    if (trong.length === 0) continue
    y = sangTrang(doc, y, 34)
    y = veDauPhan(doc, { phan: p, soCau: trong.length, mau: mauCua(PHAN_DE.indexOf(p) * 2)[0] }, y, FONT)
    for (const c of trong) {
      stt += 1
      const cv = sangCauVe(c, kt.hienDapAn)
      const h = doCaoThe(doc, cv, kt)
      y = sangTrang(doc, y, Math.min(h + 4, 200))
      y = veTheCau(doc, cv, stt, y, kt, mauCua(stt - 1)) + 5
      if (giaiChiTiet) y = veGiaiChiTiet(doc, c, y + 1) + 5
    }
    y += 3
  }
  return y
}

export function veBaiTapPdf(d: DuLieuBaiTapPdf): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  dungFont(doc)
  const ten = d.hoTen || `SBD ${d.sbd}`
  const phu = `${ten}${d.sbd ? ` · SBD ${d.sbd}` : ''}${d.lop ? ` · Lớp ${d.lop}` : ''} · ${ngayVN(d.ngay)}`

  veDauTrang(doc, 'Phiếu bài tập riêng', phu)
  let y = 46
  y = veViSao(doc, d, y)
  y = veDaySoCau(doc, d.cau, y, { font: FONT, hienDapAn: false }, false)

  // LỜI GIẢI sang trang mới: em làm hết đề rồi mới lật.
  doc.addPage()
  y = TR.le + 6
  chu(doc, MAU.tim)
  doc.setFont(FONT, 'bold')
  doc.setFontSize(16)
  doc.text('Lời giải', TR.le, y + 4)
  chu(doc, MAU.mo)
  doc.setFont(FONT, 'normal')
  doc.setFontSize(8.5)
  doc.text('Em làm hết đề rồi mới xem phần này.', TR.le, y + 10)
  y += 19

  y = veDaySoCau(doc, d.cau, y, { font: FONT, hienDapAn: true }, true)

  const tong = doc.getNumberOfPages()
  for (let i = 1; i <= tong; i++) {
    doc.setPage(i)
    chanTrang(doc, i, tong, ten)
  }
  return doc
}

/** Dùng lại ở nơi khác cần in đáp án Phần II ra chữ. */
export { dapAnChu }
