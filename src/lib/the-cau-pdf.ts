// THẺ CÂU HỎI TRÊN PDF — mẫu thiết kế thầy chốt 04-09-2026.
//
// Mọi file PDF tải xuống dùng chung bộ khối trong file này, để đề bài, lời giải
// và mọi phiếu về sau nhìn là ra một nhà, không mỗi chỗ một kiểu.
//
// BỐN KHỐI:
//   1. `veDauPhan`   — dải mở phần: ô biểu tượng bo tròn + "PHẦN I — Trắc
//                      nghiệm (18 câu)" + dòng luật tính điểm.
//   2. `veTheCau`    — thẻ trắng bo góc, đổ bóng nhẹ, dải màu trên đầu mang số
//                      câu và tên chuyên đề. Phương án là từng hàng bo tròn;
//                      ở chế độ lời giải, phương án đúng nền xanh viền xanh.
//   3. Ý Phần II     — lưới 2 cột, mỗi ý một ô có huy hiệu ✓ / ✗ vẽ bằng nét
//                      (font không có glyph nào đủ đậm và cân).
//   4. `veOGiaiThich`— ô kem, vạch cam bên trái, chữ nghiêng màu nâu đất.
//
// HAI RÀNG BUỘC KỸ THUẬT:
//   · jsPDF KHÔNG có gradient. Dải màu vẽ bằng nhiều lát dọc rồi bo hai góc
//     trên bằng mẹo "vá góc": phủ ô vuông màu nền rồi chấm một hình tròn màu
//     dải đúng tâm góc.
//   · jsPDF KHÔNG có bóng đổ. Bóng là một hình bo góc xám rất nhạt vẽ lệch
//     0,7 mm xuống dưới, trước khi vẽ thẻ.
//
// Vì phải biết chiều cao TRƯỚC khi vẽ nền thẻ, mỗi khối có một hàm đo đi kèm
// (`doCaoThe`). Đo và vẽ dùng chung đúng một bộ hằng số, không chép số hai nơi.
import type { jsPDF } from 'jspdf'
import { doanCongThuc, type DoanChu } from './chu-hoa-hoc-pdf'
import { caoDoanChu, veDoanChu, type KieuChu } from './ve-chu-pdf'

export const MAU = {
  muc: [26, 35, 50],
  nhat: [107, 114, 128],
  mo: [156, 163, 175],
  vien: [229, 231, 235],
  chim: [243, 244, 246],
  trang: [255, 255, 255],
  nen: [247, 248, 250],
  bong: [231, 234, 240],
  oPa: [240, 242, 246],
  tim: [79, 70, 229],
  tim2: [124, 108, 246],
  xanhNen: [240, 253, 244],
  xanhVien: [134, 219, 175],
  xanhDam: [4, 150, 105],
  doNen: [254, 242, 242],
  doVien: [252, 165, 165],
  doDam: [220, 38, 38],
  kemNen: [255, 247, 237],
  kemVach: [234, 138, 30],
  kemChu: [146, 64, 14],
  cam: [217, 119, 6],
} as const

/** Màu dải đầu thẻ, xoay vòng theo số câu — nhìn lướt là biết đang ở câu nào,
 * và trang giấy không thành một khối tím đều tăm tắp. */
export const DAI_THE: readonly (readonly [readonly number[], readonly number[]])[] = [
  [
    [79, 70, 229],
    [124, 108, 246],
  ],
  [
    [217, 119, 6],
    [245, 178, 66],
  ],
  [
    [37, 99, 235],
    [96, 165, 250],
  ],
  [
    [13, 148, 136],
    [45, 199, 175],
  ],
  [
    [190, 24, 93],
    [236, 92, 145],
  ],
  [
    [109, 40, 217],
    [160, 100, 245],
  ],
]

export const TR = { rong: 210, cao: 297, le: 16, dayTrang: 276 }
export const RONG = TR.rong - TR.le * 2

/** Hằng số bố cục — đo và vẽ đọc chung, không chép số. */
export const D = {
  bo: 4,
  dai: 13,
  chip: 8,
  demTren: 6,
  demDuoi: 6.5,
  demNgang: 6,
  cxDe: 10,
  cxPa: 9.5,
  cxGiai: 9,
  hangPa: 3.2,
  boPa: 3,
  keoPa: 2.4,
  cxNhan: 6.6,
} as const

export function to(doc: jsPDF, c: readonly number[]) {
  doc.setFillColor(c[0], c[1], c[2])
}
export function chu(doc: jsPDF, c: readonly number[]) {
  doc.setTextColor(c[0], c[1], c[2])
}
export function net(doc: jsPDF, c: readonly number[]) {
  doc.setDrawColor(c[0], c[1], c[2])
}

function pha(a: readonly number[], b: readonly number[], k: number): number[] {
  return [Math.round(a[0] + (b[0] - a[0]) * k), Math.round(a[1] + (b[1] - a[1]) * k), Math.round(a[2] + (b[2] - a[2]) * k)]
}

/** Dải màu chuyển sắc, bo hai góc TRÊN. jsPDF không có gradient nên vẽ bằng
 * lát dọc; bo góc bằng cách phủ ô vuông màu nền rồi chấm hình tròn màu dải. */
export function veDaiTron(doc: jsPDF, x: number, y: number, w: number, h: number, c1: readonly number[], c2: readonly number[], r: number, nen: readonly number[]) {
  const n = 64
  const bw = w / n
  for (let i = 0; i < n; i++) {
    const c = pha(c1, c2, i / (n - 1))
    doc.setFillColor(c[0], c[1], c[2])
    // Lát cuối KHÔNG nới thêm: nới là dải tràn khỏi thẻ, in ra thấy một vệt
    // màu thò ra bên phải.
    doc.rect(x + bw * i, y, i === n - 1 ? bw : bw + 0.35, h, 'F')
  }
  for (const trai of [true, false]) {
    const gx = trai ? x : x + w - r
    to(doc, nen)
    doc.rect(gx, y, r, r, 'F')
    const c = trai ? c1 : c2
    doc.setFillColor(c[0], c[1], c[2])
    doc.circle(trai ? x + r : x + w - r, y + r, r, 'F')
    doc.rect(trai ? x : x + w - r, y + r, r, 0.6, 'F')
  }
}

export function kieu(cx: number, mau: readonly number[], font: string, dam = false, giong = 1.45): KieuChu {
  return { cx, mau, dam, font, giong }
}

/** Dấu ✓ vẽ bằng hai nét — font không có glyph nào đủ đậm và cân ở cỡ 6 mm. */
function veTick(doc: jsPDF, x: number, y: number, s: number) {
  doc.setLineWidth(s * 0.16)
  doc.setLineCap('round')
  doc.line(x + s * 0.24, y + s * 0.52, x + s * 0.43, y + s * 0.71)
  doc.line(x + s * 0.43, y + s * 0.71, x + s * 0.77, y + s * 0.31)
}
function veCheo(doc: jsPDF, x: number, y: number, s: number) {
  doc.setLineWidth(s * 0.16)
  doc.setLineCap('round')
  doc.line(x + s * 0.29, y + s * 0.29, x + s * 0.71, y + s * 0.71)
  doc.line(x + s * 0.71, y + s * 0.29, x + s * 0.29, y + s * 0.71)
}

/** Vòng tròn có dấu ✓ ở giữa — biểu tượng mở đầu mỗi phần. */
export function veHuyHieuPhan(doc: jsPDF, x: number, y: number, s: number, mau: readonly number[]) {
  to(doc, mau)
  doc.roundedRect(x, y, s, s, s * 0.28, s * 0.28, 'F')
  net(doc, MAU.trang)
  doc.setLineWidth(s * 0.055)
  doc.circle(x + s / 2, y + s / 2, s * 0.29)
  veTick(doc, x + s * 0.22, y + s * 0.22, s * 0.56)
}

export interface DauPhan {
  phan: 'I' | 'II' | 'III'
  soCau: number
  mau: readonly number[]
}

const TEN_PHAN: Record<string, string> = { I: 'Trắc nghiệm', II: 'Đúng / Sai', III: 'Trả lời ngắn' }
const LUAT_PHAN: Record<string, string> = {
  I: 'Mỗi câu chọn 1 phương án · 0,25 điểm/câu',
  II: 'Mỗi ý chọn đúng hoặc sai · Tối đa 1 điểm/câu',
  III: 'Viết đáp án ngắn · 0,25 điểm/câu',
}

export function veDauPhan(doc: jsPDF, p: DauPhan, y: number, font: string): number {
  const s = 11
  veHuyHieuPhan(doc, TR.le, y, s, p.mau)
  chu(doc, MAU.muc)
  doc.setFont(font, 'bold')
  doc.setFontSize(14)
  doc.text(`PHẦN ${p.phan} — ${TEN_PHAN[p.phan] ?? ''} (${p.soCau} câu)`, TR.le + s + 5, y + 5)
  chu(doc, MAU.nhat)
  doc.setFont(font, 'normal')
  doc.setFontSize(9)
  doc.text(LUAT_PHAN[p.phan] ?? '', TR.le + s + 5, y + 10.6)
  return y + s + 7
}

/** Ô kem có vạch cam — lời chốt/giải thích ngắn. */
export function veOGiaiThich(doc: jsPDF, ds: DoanChu[], x: number, y: number, w: number, font: string): number {
  const k = kieu(9, MAU.kemChu, font, false, 1.5)
  const h = caoDoanChu(doc, ds, w - 10, k) + 6
  to(doc, MAU.kemNen)
  doc.roundedRect(x, y, w, h, 2.4, 2.4, 'F')
  to(doc, MAU.kemVach)
  doc.rect(x, y + 0.6, 1.5, h - 1.2, 'F')
  veDoanChu(doc, ds, x + 6, y + 5.6, w - 10, k)
  return y + h
}

export function caoOGiaiThich(doc: jsPDF, ds: DoanChu[], w: number, font: string): number {
  return caoDoanChu(doc, ds, w - 10, kieu(9, MAU.kemChu, font, false, 1.5)) + 6
}

/** Một câu để vẽ — đúng những trường thẻ cần, không kéo theo kiểu dữ liệu của
 * kho đề, để phiếu nào cũng dựng được đầu vào này. */
export interface CauVe {
  phan: 'I' | 'II' | 'III'
  tieuDe: string
  text: string
  /** Phần I: 4 phương án. Phần II: 4 ý. Phần III: null. */
  luaChon: string[] | null
  /** Phần I: 'A'…'D'. Phần II: 'DSDS'. Phần III: chuỗi đáp án. */
  dapAn: string
  /** Câu chốt in trong ô kem ở chế độ lời giải. */
  chot?: string
}

const CHU_PA = ['A', 'B', 'C', 'D']
const CHU_Y = ['a', 'b', 'c', 'd']

function dungCua(c: CauVe, i: number): boolean {
  if (c.phan === 'I') return CHU_PA[i] === (c.dapAn || '').trim().toUpperCase()
  if (c.phan === 'II') return (c.dapAn || '')[i] === 'D'
  return false
}

export interface KieuThe {
  font: string
  /** true = tô đậm phương án đúng và in ô giải thích (bản lời giải). */
  hienDapAn: boolean
  /** Phần II ở bản đề bài: in ô tick Đ/S để em khoanh trên giấy. */
  oTick?: boolean
}

/** Đo chiều cao thẻ trước khi vẽ nền. Dùng chung hằng số với `veTheCau`. */
export function doCaoThe(doc: jsPDF, c: CauVe, kt: KieuThe): number {
  const wB = RONG - D.demNgang * 2
  let h = D.dai + D.demTren
  h += caoDoanChu(doc, doanCongThuc(c.text), wB, kieu(D.cxDe, MAU.muc, kt.font)) + 3.4

  if (c.phan === 'II' && c.luaChon) {
    const wO = (wB - 4) / 2
    for (let i = 0; i < c.luaChon.length; i += 2) {
      const a = caoDoanChu(doc, doanCongThuc(c.luaChon[i]), wO - 14, kieu(D.cxPa, MAU.muc, kt.font))
      const b = c.luaChon[i + 1] ? caoDoanChu(doc, doanCongThuc(c.luaChon[i + 1]), wO - 14, kieu(D.cxPa, MAU.muc, kt.font)) : 0
      h += Math.max(a, b, 6) + D.hangPa + D.keoPa
    }
  } else if (c.luaChon) {
    for (const pa of c.luaChon) h += caoDoanChu(doc, doanCongThuc(pa), wB - 16, kieu(D.cxPa, MAU.muc, kt.font)) + D.hangPa + D.keoPa
  } else {
    h += kt.hienDapAn ? 10 : 12
  }

  if (kt.hienDapAn && c.chot) h += caoOGiaiThich(doc, doanCongThuc(c.chot), wB, kt.font) + 2.6
  return h + D.demDuoi
}

/** Vẽ trọn một thẻ câu. Trả về y ngay dưới thẻ. */
export function veTheCau(doc: jsPDF, c: CauVe, stt: number, y: number, kt: KieuThe, mauDai: readonly [readonly number[], readonly number[]]): number {
  const h = doCaoThe(doc, c, kt)
  const x = TR.le
  const w = RONG

  to(doc, MAU.bong)
  doc.roundedRect(x + 0.35, y + 0.75, w, h, D.bo, D.bo, 'F')
  to(doc, MAU.trang)
  doc.roundedRect(x, y, w, h, D.bo, D.bo, 'F')
  veDaiTron(doc, x, y, w, D.dai, mauDai[0], mauDai[1], D.bo, MAU.trang)

  // Số câu trong ô mờ trên dải, rồi tên chuyên đề.
  const cy = y + (D.dai - D.chip) / 2
  doc.setFillColor(255, 255, 255)
  doc.setGState(new (doc as unknown as { GState: new (o: object) => object }).GState({ opacity: 0.22 }))
  doc.roundedRect(x + 5, cy, D.chip, D.chip, 2.4, 2.4, 'F')
  doc.setGState(new (doc as unknown as { GState: new (o: object) => object }).GState({ opacity: 1 }))
  chu(doc, MAU.trang)
  doc.setFont(kt.font, 'bold')
  doc.setFontSize(9)
  doc.text(String(stt), x + 5 + D.chip / 2, cy + D.chip / 2 + 1.5, { align: 'center' })
  doc.setFontSize(9.5)
  if (c.tieuDe) doc.text(c.tieuDe, x + 5 + D.chip + 5, cy + D.chip / 2 + 1.4)

  const xB = x + D.demNgang
  const wB = w - D.demNgang * 2
  let yy = y + D.dai + D.demTren

  const kDe = kieu(D.cxDe, MAU.muc, kt.font)
  yy = veDoanChu(doc, doanCongThuc(c.text), xB, yy + 3.2, wB, kDe) + 3.4

  if (c.phan === 'II' && c.luaChon) {
    const wO = (wB - 4) / 2
    for (let i = 0; i < c.luaChon.length; i += 2) {
      let cao = 6
      for (const j of [i, i + 1]) {
        if (!c.luaChon[j]) continue
        cao = Math.max(cao, caoDoanChu(doc, doanCongThuc(c.luaChon[j]), wO - 14, kieu(D.cxPa, MAU.muc, kt.font)))
      }
      const hO = cao + D.hangPa
      for (const j of [i, i + 1]) {
        if (!c.luaChon[j]) continue
        const xO = xB + (j % 2) * (wO + 4)
        const dung = dungCua(c, j)
        const to1 = kt.hienDapAn ? (dung ? MAU.xanhNen : MAU.doNen) : MAU.oPa
        const vien = kt.hienDapAn ? (dung ? MAU.xanhVien : MAU.doVien) : MAU.oPa
        to(doc, to1)
        net(doc, vien)
        doc.setLineWidth(0.4)
        doc.roundedRect(xO, yy - 2.6, wO, hO, D.boPa, D.boPa, 'FD')
        if (kt.hienDapAn) {
          to(doc, dung ? MAU.xanhDam : MAU.doDam)
          doc.roundedRect(xO + 3, yy - 0.6, 6, 6, 2, 2, 'F')
          net(doc, MAU.trang)
          if (dung) veTick(doc, xO + 3, yy - 0.6, 6)
          else veCheo(doc, xO + 3, yy - 0.6, 6)
        } else {
          net(doc, MAU.mo)
          doc.setLineWidth(0.35)
          doc.rect(xO + 3, yy - 0.6, 6, 6)
        }
        veDoanChu(doc, doanCongThuc(`${CHU_Y[j]}) ${c.luaChon[j]}`), xO + 12, yy + 2.4, wO - 14, kieu(D.cxPa, MAU.muc, kt.font))
      }
      yy += hO + D.keoPa
    }
  } else if (c.luaChon) {
    for (let i = 0; i < c.luaChon.length; i++) {
      const pa = doanCongThuc(c.luaChon[i])
      const dung = kt.hienDapAn && dungCua(c, i)
      const kPa = kieu(D.cxPa, dung ? MAU.muc : MAU.muc, kt.font, dung)
      const hP = caoDoanChu(doc, pa, wB - 16, kPa) + D.hangPa
      to(doc, dung ? MAU.xanhNen : MAU.oPa)
      net(doc, dung ? MAU.xanhVien : MAU.oPa)
      doc.setLineWidth(0.4)
      doc.roundedRect(xB, yy - 2.6, wB, hP, D.boPa, D.boPa, 'FD')
      chu(doc, dung ? MAU.xanhDam : MAU.nhat)
      doc.setFont(kt.font, 'bold')
      doc.setFontSize(D.cxPa)
      doc.text(`${CHU_PA[i]}.`, xB + 5, yy + 2.4)
      veDoanChu(doc, pa, xB + 14, yy + 2.4, wB - 16, kPa)
      yy += hP + D.keoPa
    }
  } else {
    if (kt.hienDapAn) {
      to(doc, MAU.xanhNen)
      net(doc, MAU.xanhVien)
      doc.setLineWidth(0.4)
      doc.roundedRect(xB, yy - 2.6, Math.min(wB, 92), 9, D.boPa, D.boPa, 'FD')
      chu(doc, MAU.xanhDam)
      doc.setFont(kt.font, 'bold')
      doc.setFontSize(D.cxPa)
      doc.text('Đáp án:', xB + 5, yy + 2.8)
      veDoanChu(doc, doanCongThuc(c.dapAn || '—'), xB + 24, yy + 2.8, Math.min(wB, 92) - 26, kieu(D.cxPa, MAU.xanhDam, kt.font, true))
      yy += 10
    } else {
      to(doc, MAU.oPa)
      doc.roundedRect(xB, yy - 2.6, Math.min(wB, 92), 11, D.boPa, D.boPa, 'F')
      chu(doc, MAU.mo)
      doc.setFont(kt.font, 'normal')
      doc.setFontSize(D.cxPa)
      doc.text('Đáp án:', xB + 5, yy + 3.4)
      yy += 12
    }
  }

  if (kt.hienDapAn && c.chot) yy = veOGiaiThich(doc, doanCongThuc(c.chot), xB, yy - 0.6, wB, kt.font) + 2.6

  return y + h
}

export function mauCua(i: number): readonly [readonly number[], readonly number[]] {
  return DAI_THE[i % DAI_THE.length] as readonly [readonly number[], readonly number[]]
}
