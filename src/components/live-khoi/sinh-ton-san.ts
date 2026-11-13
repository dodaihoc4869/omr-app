// SÂN «TRANG VỞ» của trò «Sinh Tồn» bản 2 (thầy duyệt 13/11: docs/ban-ve-sinh-ton-v2-1311/01-tran-844.jpg, 20-san-tu-lon-theo-si-so-1366.jpg).
// Cả sân là các trang vở ô li 1600 × 1000 ghép `ngang × doc` (lõi: BanDo.ngang / doc) trên nền Duolingo tối: lề đỏ đôi, gáy vở khâu chỉ giữa mỗi trang,
// công thức Hoá viết chì mờ ở mép trang, vòng benzen + bình tam giác bên lề, trại bốn đội vòng chì + tên.
// NHẸ (tác tử tốc độ 13/11): nền = MỘT ô mẫu 256 × 256 lặp, vùng ngoài vòng an toàn = ô mẫu gạch chéo 24 × 24 — cả hai NƯỚNG ĐÚNG CỠ ĐIỂM ẢNH THIẾT BỊ
// và tô bằng phép dời nguyên điểm ảnh (trình duyệt không phải co giãn mẫu mỗi khung; co giãn thì chỉ còn 24 khung / giây ở CPU ×4). Muốn vậy tỉ lệ
// sân phải làm tròn để 256 · ti · dpr là số nguyên (`lamTronTi`). Công thức / hình vẽ chơi / tên trại là ẢNH NƯỚNG SẴN (BoHinh.chu…), không vẽ chữ mỗi khung.
import type { BanDo } from '../../lib/live-khoi/sinh-ton-loi'
import { dat, loaiTuong, mau, type BangMau, type BoHinh, type LoaiVat } from './sinh-ton-hinh'

/** Cạnh ô mẫu nền (đơn vị sân). */
export const O_MAU = 256
const O_GACH = 24
/** Tỉ lệ sân làm tròn sao cho ô mẫu 256 đơn vị = SỐ NGUYÊN điểm ảnh thiết bị (ô mẫu không phải co giãn lúc tô). */
export function lamTronTi(ti: number, dpr: number): number {
  const n = Math.max(16, Math.round(O_MAU * ti * dpr))
  return n / (O_MAU * dpr)
}

export interface BoSan { nen: CanvasPattern | null; gach: CanvasPattern | null }
/** Hai ô mẫu theo hệ số `k` = ti · dpr (đã làm tròn bằng `lamTronTi`). */
export function taoBoSan(g: CanvasRenderingContext2D, b: BangMau, k: number): BoSan {
  const oNen = document.createElement('canvas'), n = Math.round(O_MAU * k)
  oNen.width = oNen.height = n
  const gn = oNen.getContext('2d')
  if (gn) {
    gn.scale(n / O_MAU, n / O_MAU)
    gn.fillStyle = mau(b.giay); gn.fillRect(0, 0, O_MAU, O_MAU)
    gn.beginPath(); for (let v = 32; v <= O_MAU; v += 32) { gn.moveTo(0, v - 0.5); gn.lineTo(O_MAU, v - 0.5); gn.moveTo(v - 0.5, 0); gn.lineTo(v - 0.5, O_MAU) }
    gn.strokeStyle = mau(b.ke); gn.lineWidth = 1; gn.stroke()
  }
  const oGach = document.createElement('canvas'), m = Math.max(4, Math.round(O_GACH * k))
  oGach.width = oGach.height = m
  const gg = oGach.getContext('2d')
  if (gg) {
    gg.scale(m / O_GACH, m / O_GACH)
    gg.fillStyle = mau(b.bong, 0.3); gg.fillRect(0, 0, O_GACH, O_GACH)
    gg.beginPath(); gg.moveTo(-2, O_GACH + 2); gg.lineTo(O_GACH + 2, -2); gg.moveTo(-2, 2); gg.lineTo(2, -2); gg.moveTo(O_GACH - 2, O_GACH + 2); gg.lineTo(O_GACH + 2, O_GACH - 2)
    gg.strokeStyle = mau(b.sai, 0.4); gg.lineWidth = 1.6; gg.stroke()
  }
  return { nen: gn ? g.createPattern(oNen, 'repeat') : null, gach: gg ? g.createPattern(oGach, 'repeat') : null }
}

/** Năm công thức đã soát (đặc tả mục «Hướng mỹ thuật»): vị trí theo phần của trang + chữ. Giữ đúng chỉ số dưới. */
export const CONG_THUC: readonly (readonly [number, number, string])[] = [
  [0.085, 0.045, '2Na + 2H₂O → 2NaOH + H₂↑'], [0.6, 0.045, '2K + 2H₂O → 2KOH + H₂↑'], [0.085, 0.975, 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag'],
  [0.6, 0.975, 'Ca + 2H₂O → Ca(OH)₂ + H₂↑'], [0.32, 0.975, 'CaCO₃ → CaO + CO₂↑ (t°)'],
]
const TEN_TRAI = ['Trại Đội Natri', 'Trại Đội Kali', 'Trại Đội Đồng', 'Trại Đội Canxi']

/** Vẽ phần TRANG (lề, gáy, viền trang, công thức, hình vẽ chơi, trại) trong hệ toạ độ sân; chỉ thứ lọt khung nhìn [x0, x1] × [y0, y1]. */
export function veTrang(g: CanvasRenderingContext2D, b: BangMau, h: BoHinh, bd: BanDo, x0: number, y0: number, x1: number, y1: number, chiTiet = true): void {
  const khuW = bd.rong / Math.max(1, bd.ngang), khuH = bd.cao / Math.max(1, bd.doc)
  const ya = Math.max(0, y0), yb = Math.min(bd.cao, y1)
  // lề đỏ đôi (mỗi nửa trang một lề)
  g.beginPath()
  for (let kx = 0; kx < bd.rong; kx += khuW) for (const t of [0.06, 0.56]) { const x = kx + khuW * t; if (x > x0 - 10 && x < x1 + 10) { g.moveTo(x, ya); g.lineTo(x, yb); g.moveTo(x + 5, ya); g.lineTo(x + 5, yb) } }
  g.strokeStyle = mau(b.le, 0.85); g.lineWidth = 1.4; g.stroke()
  // gáy vở khâu chỉ giữa mỗi trang
  for (let kx = 0; kx < bd.rong; kx += khuW) {
    const x = kx + khuW / 2
    if (x < x0 - 40 || x > x1 + 40) continue
    g.fillStyle = mau(b.bong, b.bongA * 0.55); g.fillRect(x - 14, ya, 28, yb - ya)
    g.fillStyle = mau(b.bong, b.bongA * 0.7); g.fillRect(x - 4, ya, 8, yb - ya)
    g.beginPath(); for (let ky = 0; ky < bd.cao; ky += khuH) for (let y = ky + 60; y < ky + khuH - 40; y += 90) if (y > y0 - 30 && y < y1 + 20) { g.moveTo(x - 3, y); g.lineTo(x + 3, y + 22) }
    g.strokeStyle = mau(b.muc, 0.45); g.lineWidth = 2; g.stroke()
  }
  g.strokeStyle = mau(b.muc, 0.35); g.lineWidth = 2; g.strokeRect(0, 0, bd.rong, bd.cao)
  // công thức viết chì mờ + hình vẽ chơi (ảnh nướng sẵn); máy yếu bỏ (nét mờ 16%, mắt gần như không thấy)
  if (chiTiet) for (let kx = 0; kx < bd.rong; kx += khuW) for (let ky = 0; ky < bd.cao; ky += khuH) {
    for (const [fx, fy, s] of CONG_THUC) {
      const x = kx + fx * khuW, y = ky + fy * khuH
      if (x > x0 - 320 && x < x1 + 10 && y > y0 - 10 && y < y1 + 30) dat(g, h.chu(s, 20, b.muc, 0.16, false, false), x, y)
    }
    const bx = kx + khuW * 0.47, by = ky + khuH * 0.13, fx = kx + khuW * 0.53, fy = ky + khuH * 0.86
    if (bx > x0 - 40 && bx < x1 + 40 && by > y0 - 40 && by < y1 + 40) dat(g, h.benzen(), bx, by)
    if (fx > x0 - 40 && fx < x1 + 40 && fy > y0 - 50 && fy < y1 + 40) dat(g, h.binh(), fx, fy)
  }
  // trại bốn đội: vòng chì nét đứt + tên
  for (let i = 0; i < 4; i++) {
    const t = bd.trai[i], c = b.doi[i]
    if (!c || t.x < x0 - 130 || t.x > x1 + 130 || t.y < y0 - 130 || t.y > y1 + 130) continue
    g.beginPath(); g.ellipse(t.x, t.y, 92, 64, 0, 0, Math.PI * 2); g.fillStyle = mau(c, 0.09); g.fill()
    g.setLineDash([3, 5]); g.strokeStyle = mau(c, 0.75); g.lineWidth = 2.2; g.stroke(); g.setLineDash([])
    dat(g, h.chu(TEN_TRAI[i], 19, c, 0.9), t.x, t.y + (t.y < bd.cao / 2 ? 86 : -76))
  }
}

// ── Ô NƯỚNG SẴN lớp dưới (tác tử tốc độ 13/11, máy yếu): nền ô li + trang + (kiểu phẳng) vật chặn nướng vào các ô 512 × 512 đơn vị sân, giữ LRU có trần byte;
// mỗi khung chỉ dán vài ô thay vì tô mẫu + vẽ từng vật. Ô chưa nướng thì vẽ thẳng (cắt đúng ô) và mỗi khung nướng thêm tối đa 1 ô ⇒ khung đầu không phình.
export const CANH_O = 512
interface OAnh { c: HTMLCanvasElement; luc: number }
export class BoO {
  /** Cạnh ô (điểm ảnh thiết bị) — số nguyên nhờ `lamTronTi`. */ readonly n: number
  private o = new Map<number, OAnh>()
  private khung = 0
  private readonly tran: number
  private b: BangMau; private h: BoHinh; private bd: BanDo; private san: BoSan; readonly k: number; private gopVat: boolean; private chiTiet: boolean
  constructor(b: BangMau, h: BoHinh, bd: BanDo, san: BoSan, k: number, gopVat: boolean, chiTiet: boolean, tranByte: number) {
    this.b = b; this.h = h; this.bd = bd; this.san = san; this.k = k; this.gopVat = gopVat; this.chiTiet = chiTiet
    this.n = Math.round(CANH_O * k)
    this.tran = Math.floor(tranByte / (this.n * this.n * 4))
  }
  /** Bộ nhớ ảnh đang giữ (byte). */
  boNho(): number { return this.o.size * this.n * this.n * 4 }
  huy(): void { for (const a of this.o.values()) { a.c.width = 0; a.c.height = 0 } this.o.clear() }
  /** Vẽ một ô (hoặc phần ô lọt trang) vào `t` tại điểm ảnh (ox, oy) rộng sw × sh. */
  private veO(t: CanvasRenderingContext2D, ox: number, oy: number, i: number, j: number, sw: number, sh: number): void {
    const { k, bd } = this, x0 = i * CANH_O, y0 = j * CANH_O, x1 = x0 + CANH_O, y1 = y0 + CANH_O
    t.save()
    t.setTransform(1, 0, 0, 1, ox, oy)
    t.beginPath(); t.rect(0, 0, sw, sh); t.clip()
    t.fillStyle = this.san.nen ?? mau(this.b.giay); t.fillRect(0, 0, sw, sh)
    t.setTransform(k, 0, 0, k, ox - x0 * k, oy - y0 * k)
    veTrang(t, this.b, this.h, bd, x0, y0, x1, y1, this.chiTiet)
    if (this.gopVat) {
      const ke: { y: number; v: BanDo['tuong'][number]; l: LoaiVat }[] = []
      for (let q = 0; q < bd.tuong.length; q++) { const v = bd.tuong[q]; if (v.x < x1 + 20 && v.x + v.w > x0 - 20 && v.y < y1 + 20 && v.y + v.h > y0 - 40) ke.push({ y: v.y + v.h, v, l: loaiTuong(v.w, v.h, q) }) }
      for (const v of bd.thung) if (v.x < x1 + 20 && v.x + v.w > x0 - 20 && v.y < y1 + 20 && v.y + v.h > y0 - 40) ke.push({ y: v.y + v.h, v, l: 'tay' })
      ke.sort((a, c) => a.y - c.y)
      for (const e of ke) dat(t, this.h.vat(e.l, e.v.w, e.v.h), e.v.x, e.v.y)
    }
    t.restore()
  }
  private nuong(i: number, j: number): OAnh | null {
    const c = document.createElement('canvas'), n = this.n
    c.width = c.height = n
    const t = c.getContext('2d', { alpha: false })
    if (!t) return null
    t.lineCap = 'round'; t.lineJoin = 'round'
    const han = this.h.han; this.h.han = 0 // ô nướng xong là giữ mãi ⇒ không được bỏ sót hình
    this.veO(t, 0, 0, i, j, n, n)
    this.h.han = han
    const a = { c, luc: this.khung }
    this.o.set(i * 4096 + j, a)
    return a
  }
  private nhuong(): boolean {
    if (this.o.size < this.tran) return true
    let tk = -1, ml = Infinity
    for (const [k, a] of this.o) if (a.luc < ml) { ml = a.luc; tk = k }
    if (tk < 0 || ml >= this.khung) return false
    const a = this.o.get(tk)
    if (a) { a.c.width = 0; a.c.height = 0 }
    this.o.delete(tk)
    return true
  }
  /** Vẽ lớp dưới cho khung nhìn [x0, x1] × [y0, y1] (toạ độ sân); (px, py) = điểm ảnh của gốc sân. `false` = không đủ trần bộ nhớ ⇒ người gọi tự vẽ thẳng.
   *  `ranh` = khung này còn dư sức ⇒ nướng trước thêm 1 ô kề khung nhìn (hướng em đang chạy). */
  ve(g: CanvasRenderingContext2D, px: number, py: number, x0: number, y0: number, x1: number, y1: number, ranh: boolean): boolean {
    const { bd, n, k } = this
    const i0 = Math.max(0, Math.floor(x0 / CANH_O)), i1 = Math.min(Math.ceil(bd.rong / CANH_O) - 1, Math.floor(x1 / CANH_O))
    const j0 = Math.max(0, Math.floor(y0 / CANH_O)), j1 = Math.min(Math.ceil(bd.cao / CANH_O) - 1, Math.floor(y1 / CANH_O))
    if (i1 < i0 || j1 < j0) return true
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > this.tran - 1) return false
    this.khung++
    g.setTransform(1, 0, 0, 1, 0, 0)
    // Hai khung đầu vẽ thẳng hết (khung đầu không phình thêm việc nướng ô).
    let nuong = this.khung > 2 ? 1 : 0
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const sw = Math.round(Math.min(CANH_O, bd.rong - i * CANH_O) * k), sh = Math.round(Math.min(CANH_O, bd.cao - j * CANH_O) * k)
      const ox = px + i * n, oy = py + j * n
      let a = this.o.get(i * 4096 + j) ?? null
      if (!a && nuong > 0 && this.nhuong()) { nuong--; a = this.nuong(i, j) }
      if (a) { a.luc = this.khung; g.drawImage(a.c, 0, 0, sw, sh, ox, oy, sw, sh) } else this.veO(g, ox, oy, i, j, sw, sh)
    }
    if (ranh && nuong > 0) {
      // ô kề khung nhìn (nửa ô mỗi phía) chưa có ⇒ nướng trước một ô
      const a0 = Math.max(0, Math.floor((x0 - 300) / CANH_O)), a1 = Math.min(Math.ceil(bd.rong / CANH_O) - 1, Math.floor((x1 + 300) / CANH_O))
      const c0 = Math.max(0, Math.floor((y0 - 300) / CANH_O)), c1 = Math.min(Math.ceil(bd.cao / CANH_O) - 1, Math.floor((y1 + 300) / CANH_O))
      for (let j = c0; j <= c1; j++) for (let i = a0; i <= a1; i++) {
        if (this.o.has(i * 4096 + j)) continue
        if (this.nhuong()) this.nuong(i, j)
        return true
      }
    }
    return true
  }
}
