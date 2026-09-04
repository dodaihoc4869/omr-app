// VẼ CHỮ CÓ CÔNG THỨC HOÁ HỌC LÊN PDF.
//
// jsPDF chỉ biết vẽ một chuỗi phẳng ở một cỡ chữ. Công thức thì cần ba cỡ trên
// cùng một dòng (chữ thường, chỉ số dưới, số mũ) và mũi tên phản ứng vẽ bằng
// nét. File này lo đúng việc đó, kèm xuống dòng tự động.
//
// Tách riêng khỏi ve-bai-tap-pdf.ts để đo được bằng test mà không phải dựng cả
// tờ phiếu.
import type { jsPDF } from 'jspdf'
import type { DoanChu } from './chu-hoa-hoc-pdf'

export interface KieuChu {
  /** Cỡ chữ (pt). */
  cx: number
  dam?: boolean
  /** Màu chữ RGB. */
  mau: readonly number[]
  /** Tên font đã nạp vào jsPDF. */
  font: string
  /** Giãn dòng, nhân với cỡ chữ. */
  giong?: number
}

const PT_MM = 1 / 2.835
/** Bề rộng chừa cho mũi tên vẽ tay, tính theo cỡ chữ. */
const RONG_MUI = 1.9

type Nguyen = { t: DoanChu['t']; v: string; w: number; trang: boolean }

function cỡ(t: DoanChu['t'], cx: number): number {
  return t === 'sub' || t === 'sup' ? cx * 0.72 : cx
}

function doNguyen(doc: jsPDF, ds: DoanChu[], k: KieuChu): Nguyen[] {
  const ra: Nguyen[] = []
  for (const d of ds) {
    if (d.t === 'mui') {
      ra.push({ t: 'mui', v: d.v, w: k.cx * PT_MM * RONG_MUI, trang: false })
      continue
    }
    if (d.t !== 'chu') {
      doc.setFont(k.font, 'normal')
      doc.setFontSize(cỡ(d.t, k.cx))
      ra.push({ t: d.t, v: d.v, w: doc.getTextWidth(d.v), trang: false })
      continue
    }
    doc.setFont(k.font, k.dam ? 'bold' : 'normal')
    doc.setFontSize(k.cx)
    for (const m of d.v.split(/(\s+)/)) {
      if (!m) continue
      ra.push({ t: 'chu', v: m, w: doc.getTextWidth(m), trang: /^\s+$/.test(m) })
    }
  }
  return ra
}

/** Gom nguyên tố thành TỪ: các nguyên tố dính nhau không được tách khi xuống
 * dòng (chỉ số dưới phải đi cùng nguyên tử của nó). */
function gomTu(ns: Nguyen[]): Nguyen[][] {
  const tu: Nguyen[][] = []
  let hienTai: Nguyen[] = []
  for (const n of ns) {
    if (n.trang) {
      if (hienTai.length) tu.push(hienTai)
      hienTai = []
      tu.push([n])
      continue
    }
    if (n.t === 'mui') {
      if (hienTai.length) tu.push(hienTai)
      hienTai = []
      tu.push([n])
      continue
    }
    hienTai.push(n)
  }
  if (hienTai.length) tu.push(hienTai)
  return tu
}

function xepDong(tu: Nguyen[][], rong: number): Nguyen[][][] {
  const dong: Nguyen[][][] = []
  let hienTai: Nguyen[][] = []
  let w = 0
  for (const t of tu) {
    const wt = t.reduce((s, n) => s + n.w, 0)
    // Khoảng trắng đầu dòng thì bỏ, không đẩy chữ thụt vào vô cớ.
    if (t[0].trang && hienTai.length === 0) continue
    if (w + wt > rong && hienTai.length > 0) {
      // Bỏ khoảng trắng thừa ở cuối dòng.
      while (hienTai.length && hienTai[hienTai.length - 1][0].trang) hienTai.pop()
      dong.push(hienTai)
      hienTai = t[0].trang ? [] : [t]
      w = t[0].trang ? 0 : wt
      continue
    }
    hienTai.push(t)
    w += wt
  }
  while (hienTai.length && hienTai[hienTai.length - 1][0].trang) hienTai.pop()
  if (hienTai.length) dong.push(hienTai)
  return dong
}

/** Mũi tên phản ứng vẽ bằng nét: thân + đầu nhọn. `→` một chiều, `⇌` hai nửa. */
function veMui(doc: jsPDF, ch: string, x: number, y: number, w: number, cx: number, mau: readonly number[]) {
  const than = w * 0.82
  const x0 = x + w * 0.09
  const yGiua = y - cx * PT_MM * 0.32
  doc.setDrawColor(mau[0], mau[1], mau[2])
  doc.setFillColor(mau[0], mau[1], mau[2])
  doc.setLineWidth(cx * PT_MM * 0.07)
  const dau = (xd: number, huong: 1 | -1, yy: number) => {
    const d = cx * PT_MM * 0.28
    doc.triangle(xd, yy, xd - huong * d, yy - d * 0.55, xd - huong * d, yy + d * 0.55, 'F')
  }
  if (ch === '⇌') {
    const cach = cx * PT_MM * 0.22
    doc.line(x0, yGiua - cach, x0 + than, yGiua - cach)
    dau(x0 + than, 1, yGiua - cach)
    doc.line(x0, yGiua + cach, x0 + than, yGiua + cach)
    dau(x0, -1, yGiua + cach)
    return
  }
  doc.line(x0, yGiua, x0 + than, yGiua)
  if (ch === '←') dau(x0, -1, yGiua)
  else dau(x0 + than, 1, yGiua)
}

/** Vẽ một khối chữ có công thức, tự xuống dòng. Trả về y sau khối. */
export function veDoanChu(doc: jsPDF, ds: DoanChu[], x: number, y: number, rong: number, k: KieuChu): number {
  const cao = k.cx * (k.giong ?? 1.45) * PT_MM
  const dong = xepDong(gomTu(doNguyen(doc, ds, k)), rong)
  for (const d of dong) {
    let cx = x
    for (const tu of d) {
      for (const n of tu) {
        if (n.t === 'mui') {
          veMui(doc, n.v, cx, y, n.w, k.cx, k.mau)
          cx += n.w
          continue
        }
        doc.setTextColor(k.mau[0], k.mau[1], k.mau[2])
        doc.setFont(k.font, n.t === 'chu' && k.dam ? 'bold' : 'normal')
        doc.setFontSize(cỡ(n.t, k.cx))
        const dy = n.t === 'sub' ? k.cx * PT_MM * 0.22 : n.t === 'sup' ? -k.cx * PT_MM * 0.32 : 0
        doc.text(n.v, cx, y + dy)
        cx += n.w
      }
    }
    y += cao
  }
  return y
}

/** Đo chiều cao khối chữ mà không vẽ — để biết còn đủ chỗ trên trang không. */
export function caoDoanChu(doc: jsPDF, ds: DoanChu[], rong: number, k: KieuChu): number {
  const cao = k.cx * (k.giong ?? 1.45) * PT_MM
  return xepDong(gomTu(doNguyen(doc, ds, k)), rong).length * cao
}
