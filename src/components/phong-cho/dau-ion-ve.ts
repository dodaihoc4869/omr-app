// LỚP VẼ «Đấu Nguyên Tử» — Canvas 2D thuần, không thư viện. Màu đọc từ biến CSS của phòng chờ (ban-nguyen-to.css) lúc chạy ⇒ đổi sáng/tối là vẽ lại.
// Nhẹ cho máy yếu: nền (sàn, lưới, đồ thí nghiệm) vẽ MỘT lần vào canvas phụ; hạt nhân từng nguyên tố vẽ sẵn thành ảnh nhỏ; hiệu ứng có trần;
// chế độ giảm hiệu ứng (máy yếu / giảm chuyển động) bỏ quầng sáng, tia vụn, bong bóng và vòng quay.
import { CHO_XUAT_PHAT, NGUYEN_TO, R_NGUOI, SAN, VAT_CAN, type SuKien } from '../../lib/dau-ion/loi'

export interface Bang {
  sanTren: string; sanDuoi: string; luoi: string; vatCan: string; vatCanVien: string; dungDich: string
  chu: string; chuNhat: string; the: string; vang: string; nhan: string; nguyenTo: string[]; toi: boolean; phong: string
}
export interface HienGhe { id: number; nt: number; ten: string; x: number; y: number; ngam: number; mau: number; khien: boolean; xucTac: boolean; giap: boolean; cho: boolean; laEm: boolean }
export interface HienDan { x: number; y: number; vx: number; vy: number; nt: number }
export interface Canh { ghe: HienGhe[]; dan: HienDan[]; vp: { loai: 0 | 1; x: number; y: number } | null; ngamEm: boolean }

interface HieuUng { k: 0 | 1 | 2 | 3 | 4; x: number; y: number; t0: number; mau: string; chu?: string; goc: number }
const TUOI = [700, 900, 220, 650, 90]
const TRAN_HIEU_UNG = 40

/** "rgb(a, b, c)" / "rgba(a, b, c, x)" ⇒ cùng màu với độ trong a. Không đọc được ⇒ trả nguyên. */
export function trongSuot(mau: string, a: number): string {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(mau)
  return m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})` : mau
}
/** Pha màu với màu khác theo tỉ lệ t (0 = giữ nguyên). */
export function pha(a: string, b: string, t: number): string {
  const x = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(a), y = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(b)
  if (!x || !y) return a
  const c = (i: number) => Math.round(+x[i] + (+y[i] - +x[i]) * t)
  return `rgb(${c(1)}, ${c(2)}, ${c(3)})`
}

/** Đọc bảng màu: gán `var(--x)` vào thuộc tính chữ của một phần tử dò ⇒ trình duyệt tự tính ra rgb() (kể cả color-mix). Không được ⇒ biến dự phòng. */
export function docBang(goc: HTMLElement): Bang {
  const do_ = document.createElement('i')
  do_.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
  goc.appendChild(do_)
  // Chrome trả color-mix() dưới dạng `color(srgb …)` ⇒ vẽ 1 điểm ảnh rồi đọc lại để luôn có `rgb(r, g, b)` (trongSuot / pha cần dạng này).
  let mot: CanvasRenderingContext2D | null = null
  try { const c = document.createElement('canvas'); c.width = c.height = 1; mot = c.getContext('2d', { willReadFrequently: true }) } catch { /* thiếu Canvas */ }
  const rgb = (v: string) => {
    if (!mot || /^rgb\(/.test(v)) return v
    mot.clearRect(0, 0, 1, 1); mot.fillStyle = v; mot.fillRect(0, 0, 1, 1)
    const d = mot.getImageData(0, 0, 1, 1).data
    return `rgb(${d[0]}, ${d[1]}, ${d[2]})`
  }
  const lay = (bien: string, duPhong: string) => {
    do_.style.color = ''
    do_.style.color = `var(${bien}, var(${duPhong}))`
    const v = getComputedStyle(do_).color
    return rgb(v && v !== 'rgba(0, 0, 0, 0)' ? v : getComputedStyle(goc).color)
  }
  const b: Bang = {
    sanTren: lay('--di-san-tren', '--pc-sky'), sanDuoi: lay('--di-san-duoi', '--pc-sky-bottom'), luoi: lay('--di-luoi', '--pc-line'),
    vatCan: lay('--di-vat-can', '--pc-card'), vatCanVien: lay('--di-vat-can-vien', '--pc-bn-binh-vien'), dungDich: lay('--di-dung-dich', '--pc-accent'),
    chu: lay('--pc-ink', '--pc-ink'), chuNhat: lay('--pc-muted', '--pc-muted'), the: lay('--pc-card', '--pc-card'), vang: lay('--pc-bn-dan', '--pc-bn-vang'),
    nhan: lay('--pc-accent', '--pc-accent'), phong: getComputedStyle(goc).fontFamily || 'sans-serif',
    nguyenTo: ['na', 'o', 'n', 'cl', 's', 'fe', 'ne'].map((k, i) => lay(`--di-${k}`, ['--pc-bn-hong', '--pc-bn-hong', '--pc-bn-xanh-duong', '--pc-bn-luc', '--pc-bn-vang', '--pc-bn-dan', '--pc-bn-xanh-duong'][i])),
    toi: getComputedStyle(goc).getPropertyValue('--pc-night').trim() === '1',
  }
  do_.remove()
  return b
}

export class VeSan {
  private ctx: CanvasRenderingContext2D
  private nen = document.createElement('canvas')
  private hat: HTMLCanvasElement[] = []
  private k = 1
  private dpr = 1
  private hu: HieuUng[] = []
  private rongTen = new Map<string, number>()
  bang: Bang
  private cv: HTMLCanvasElement
  private giam: boolean

  constructor(cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D, bang: Bang, giam: boolean) {
    this.cv = cv; this.ctx = ctx; this.bang = bang; this.giam = giam
  }

  /** Cỡ sân trên màn (px CSS) + mật độ điểm ảnh. */
  datCo(canh: number, dpr: number): void {
    if (!(canh > 0)) return
    this.k = canh / SAN; this.dpr = dpr
    this.cv.width = Math.round(canh * dpr); this.cv.height = Math.round(canh * dpr)
    this.veNen(); this.veHat()
  }
  datBang(b: Bang): void { this.bang = b; this.rongTen.clear(); this.veNen(); this.veHat() }
  datGiam(g: boolean): void { this.giam = g }
  /** Đổi 1 px màn ⇒ đơn vị sân. */
  private px(n: number): number { return n / this.k }

  private veNen(): void {
    const c = this.nen, b = this.bang, s = this.k * this.dpr
    c.width = this.cv.width; c.height = this.cv.height
    const x = c.getContext('2d')
    if (!x || !c.width) return
    x.setTransform(s, 0, 0, s, 0, 0)
    const g = x.createLinearGradient(0, 0, SAN, SAN); g.addColorStop(0, b.sanTren); g.addColorStop(1, b.sanDuoi)
    x.fillStyle = g; x.beginPath(); x.roundRect(0, 0, SAN, SAN, 26); x.fill()
    x.save(); x.clip()
    // Giấy kẻ ô như vở thí nghiệm.
    for (let i = 40; i < SAN; i += 40) {
      x.strokeStyle = trongSuot(b.luoi, i % 200 === 0 ? 0.9 : 0.45); x.lineWidth = i % 200 === 0 ? 1.6 : 1
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i, SAN); x.moveTo(0, i); x.lineTo(SAN, i); x.stroke()
    }
    // Vòng benzene mờ quanh bình cầu giữa sân.
    x.strokeStyle = trongSuot(b.luoi, 0.9); x.lineWidth = 2; x.setLineDash([8, 8])
    x.beginPath(); for (let i = 0; i <= 6; i++) { const a = (i * Math.PI) / 3 + Math.PI / 6; const px = 300 + Math.cos(a) * 92, py = 300 + Math.sin(a) * 92; if (i) x.lineTo(px, py); else x.moveTo(px, py) } x.stroke()
    // Bệ xuất phát ở bốn góc.
    CHO_XUAT_PHAT.forEach(([cx, cy]) => { x.fillStyle = trongSuot(b.the, 0.45); x.beginPath(); x.arc(cx, cy, 30, 0, Math.PI * 2); x.fill(); x.stroke() })
    x.setLineDash([])
    x.restore()
    for (const v of VAT_CAN) this.veVatCan(x, v)
    x.strokeStyle = trongSuot(b.vatCanVien, 0.35); x.lineWidth = 3; x.beginPath(); x.roundRect(1.5, 1.5, SAN - 3, SAN - 3, 25); x.stroke()
  }

  private veVatCan(x: CanvasRenderingContext2D, v: (typeof VAT_CAN)[number]): void {
    const b = this.bang
    x.save(); x.lineJoin = 'round'; x.lineWidth = 3
    x.fillStyle = trongSuot(b.chu, b.toi ? 0.3 : 0.1)
    if (v.k === 'tron') { x.beginPath(); x.ellipse(v.x + 4, v.y + 7, v.r, v.r * 0.92, 0, 0, Math.PI * 2); x.fill() }
    else { x.beginPath(); x.roundRect(v.x + 4, v.y + 6, v.w, v.h, 10); x.fill() }
    x.fillStyle = b.vatCan; x.strokeStyle = b.vatCanVien
    if (v.ve === 'binh-cau') {
      // Bình cầu nhìn từ trên: thân tròn, dung dịch, cổ bình.
      x.beginPath(); x.arc(v.x, v.y, v.r, 0, Math.PI * 2); x.fill(); x.stroke()
      x.save(); x.beginPath(); x.arc(v.x, v.y, v.r - 5, 0, Math.PI * 2); x.clip()
      x.fillStyle = trongSuot(b.dungDich, 0.55); x.beginPath(); x.moveTo(v.x - v.r, v.y + 2)
      for (let i = 0; i <= 8; i++) x.lineTo(v.x - v.r + (i * v.r) / 4, v.y + 2 + Math.sin(i * 1.4) * 3)
      x.lineTo(v.x + v.r, v.y + v.r); x.lineTo(v.x - v.r, v.y + v.r); x.fill(); x.restore()
      x.beginPath(); x.arc(v.x, v.y, 15, 0, Math.PI * 2); x.fill(); x.stroke()
      x.fillStyle = trongSuot(b.vatCanVien, 0.25); x.beginPath(); x.arc(v.x, v.y, 9, 0, Math.PI * 2); x.fill()
      x.strokeStyle = trongSuot(b.the, 0.8); x.lineWidth = 4; x.beginPath(); x.arc(v.x, v.y, v.r - 12, Math.PI * 1.1, Math.PI * 1.45); x.stroke()
    } else if (v.ve === 'binh-non') {
      x.beginPath(); x.arc(v.x, v.y, v.r, 0, Math.PI * 2); x.fill(); x.stroke()
      x.fillStyle = trongSuot(b.vang, 0.6); x.beginPath(); x.arc(v.x, v.y, v.r - 7, 0, Math.PI * 2); x.fill()
      x.fillStyle = b.vatCan; x.beginPath(); x.arc(v.x, v.y, 8, 0, Math.PI * 2); x.fill(); x.stroke()
    } else if (v.k === 'cn' && v.ve === 'gia-ong') {
      x.beginPath(); x.roundRect(v.x, v.y, v.w, v.h, 10); x.fill(); x.stroke()
      for (let i = 0; i < 5; i++) {
        const cx = v.x + 18 + (i * (v.w - 36)) / 4, cy = v.y + v.h / 2
        x.fillStyle = b.the; x.beginPath(); x.arc(cx, cy, 9, 0, Math.PI * 2); x.fill(); x.stroke()
        x.fillStyle = trongSuot(b.nguyenTo[(i * 3 + 1) % b.nguyenTo.length], 0.85); x.beginPath(); x.arc(cx, cy, 5, 0, Math.PI * 2); x.fill()
      }
    } else if (v.k === 'cn') {
      x.beginPath(); x.roundRect(v.x, v.y, v.w, v.h, 12); x.fill(); x.stroke()
      x.fillStyle = trongSuot(b.dungDich, 0.45); x.beginPath(); x.roundRect(v.x + 6, v.y + 6, v.w - 12, v.h - 12, 8); x.fill()
      x.strokeStyle = trongSuot(b.vatCanVien, 0.7); x.lineWidth = 2
      for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(v.x + 6, v.y + 14 + i * 9); x.lineTo(v.x + 16, v.y + 14 + i * 9); x.stroke() }
    }
    x.restore()
  }

  /** Hạt nhân từng nguyên tố vẽ sẵn (gradient + ký hiệu) — mỗi khung chỉ còn drawImage. */
  private veHat(): void {
    const s = this.k * this.dpr, r = 16, d = Math.ceil((r + 2) * 2 * s)
    this.hat = this.bang.nguyenTo.map((mau, i) => {
      const c = document.createElement('canvas'); c.width = d; c.height = d
      const x = c.getContext('2d')
      if (!x) return c
      x.setTransform(s, 0, 0, s, 0, 0); x.translate(r + 2, r + 2)
      const g = x.createRadialGradient(-4, -5, 1, 0, 0, r)
      g.addColorStop(0, pha(mau, this.bang.the, 0.45)); g.addColorStop(1, mau)
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.fill()
      x.strokeStyle = pha(mau, this.bang.chu, 0.35); x.lineWidth = 1.5; x.stroke()
      x.fillStyle = this.bang.toi ? this.bang.chu : this.bang.the
      x.font = `800 ${NGUYEN_TO[i].length > 1 ? 13 : 15}px ${this.bang.phong}`; x.textAlign = 'center'; x.textBaseline = 'middle'
      x.fillText(NGUYEN_TO[i], 0, 0.8)
      return c
    })
  }

  /** Thêm hiệu ứng theo sự kiện của trận. */
  them(su: SuKien, ntCua: (id: number) => number, nay: number): void {
    if (this.hu.length >= TRAN_HIEU_UNG) this.hu.shift()
    const mau = (id: number) => this.bang.nguyenTo[ntCua(id)] ?? this.bang.vang
    const goc = Math.random() * Math.PI
    if (su.t === 'trung') this.hu.push({ k: 0, x: su.x, y: su.y, t0: nay, mau: mau(su.ai), chu: '−1', goc })
    else if (su.t === 'ha') this.hu.push({ k: 1, x: su.x, y: su.y, t0: nay, mau: mau(su.ai), chu: 'Hạ!', goc })
    else if (su.t === 'chan') this.hu.push({ k: 2, x: su.x, y: su.y, t0: nay, mau: this.bang.chuNhat, goc })
    else if (su.t === 'nhat') this.hu.push({ k: 3, x: 0, y: 0, t0: nay, mau: this.bang.vang, chu: su.loai === 0 ? 'Xúc tác!' : 'Khiên!', goc: su.ai })
    else if (su.t === 'ban' && !this.giam) this.hu.push({ k: 4, x: su.x, y: su.y, t0: nay, mau: mau(su.chu), goc })
  }

  private chu(x: number, y: number, s: string, coPx: number, mau: string, nen?: string): void {
    const c = this.ctx
    c.font = `800 ${this.px(coPx)}px ${this.bang.phong}`; c.textAlign = 'center'; c.textBaseline = 'middle'
    if (nen) { c.lineWidth = this.px(3.5); c.strokeStyle = nen; c.lineJoin = 'round'; c.strokeText(s, x, y) }
    c.fillStyle = mau; c.fillText(s, x, y)
  }

  private veNguoi(g: HienGhe, nay: number, coTen = true): void {
    const c = this.ctx, b = this.bang, mau = b.nguyenTo[g.nt] ?? b.nhan, R = R_NGUOI
    const quay = this.giam ? 0 : nay / 900
    c.save(); c.translate(g.x, g.y)
    if (b.toi && !this.giam) { const q = c.createRadialGradient(0, 0, 4, 0, 0, R + 16); q.addColorStop(0, trongSuot(mau, 0.42)); q.addColorStop(1, trongSuot(mau, 0)); c.fillStyle = q; c.beginPath(); c.arc(0, 0, R + 16, 0, Math.PI * 2); c.fill() }
    else { c.fillStyle = trongSuot(b.chu, b.toi ? 0.35 : 0.13); c.beginPath(); c.ellipse(2, R * 0.85, R * 0.95, R * 0.34, 0, 0, Math.PI * 2); c.fill() }
    if (g.laEm) { c.strokeStyle = trongSuot(mau, 0.55); c.lineWidth = 2.5; c.setLineDash([5, 5]); c.beginPath(); c.arc(0, 0, R + 15, quay, quay + Math.PI * 2); c.stroke(); c.setLineDash([]) }
    // Nòng súng ion.
    c.rotate(g.ngam)
    c.fillStyle = pha(mau, b.chu, 0.3); c.beginPath(); c.roundRect(4, -6, R + 12, 12, 6); c.fill()
    c.fillStyle = b.the; c.beginPath(); c.arc(R + 14, 0, 3.6, 0, Math.PI * 2); c.fill()
    c.rotate(-g.ngam)
    // Ba vỏ electron = ba Máu; vỏ đã mất vẽ mờ đứt nét.
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI) / 3 + quay * 0.6, con = i < g.mau
      c.save(); c.rotate(a)
      c.strokeStyle = con ? mau : trongSuot(mau, 0.22); c.lineWidth = con ? 2.2 : 1.3
      if (!con) c.setLineDash([3, 4])
      c.beginPath(); c.ellipse(0, 0, R + 4, (R + 4) * 0.4, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([])
      if (con) { const e = quay * 3 + i * 2.1; c.fillStyle = b.toi ? b.chu : pha(mau, b.chu, 0.45); c.beginPath(); c.arc(Math.cos(e) * (R + 4), Math.sin(e) * (R + 4) * 0.4, 2.6, 0, Math.PI * 2); c.fill() }
      c.restore()
    }
    const h = this.hat[g.nt]
    if (h) { const d = h.width / (this.k * this.dpr); c.drawImage(h, -d / 2, -d / 2, d, d) }
    if (g.khien) { c.strokeStyle = trongSuot(b.the, 0.95); c.lineWidth = 3; c.setLineDash([6, 5]); c.beginPath(); c.arc(0, 0, R + 10, -quay * 2, -quay * 2 + Math.PI * 2); c.stroke(); c.setLineDash([]) }
    if (g.giap) { c.strokeStyle = b.vang; c.lineWidth = 2.6; c.beginPath(); for (let i = 0; i <= 6; i++) { const a = (i * Math.PI) / 3; const px = Math.cos(a) * (R + 11), py = Math.sin(a) * (R + 11); if (i) c.lineTo(px, py); else c.moveTo(px, py) } c.stroke() }
    if (g.xucTac) { c.fillStyle = b.vang; const a = quay * 5; c.beginPath(); c.arc(Math.cos(a) * (R + 8), Math.sin(a) * (R + 8), 3.5, 0, Math.PI * 2); c.fill() }
    c.restore()
    if (!coTen) return
    // Thẻ tên (cỡ chữ theo px màn, không theo đơn vị sân).
    const co = 11, ten = g.laEm ? 'Em' : g.ten
    let w = this.rongTen.get(ten + this.k)
    if (w === undefined) { c.font = `700 ${this.px(co)}px ${b.phong}`; w = c.measureText(ten).width + this.px(12); this.rongTen.set(ten + this.k, w) }
    const ty = g.y - R - this.px(14)
    c.fillStyle = trongSuot(g.laEm ? mau : b.the, g.laEm ? 0.95 : 0.88); c.beginPath(); c.roundRect(g.x - w / 2, ty - this.px(9), w, this.px(18), this.px(9)); c.fill()
    c.font = `700 ${this.px(co)}px ${b.phong}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = g.laEm ? b.the : b.chu; c.fillText(ten, g.x, ty + this.px(0.5))
  }

  ve(canh: Canh, nay: number): void {
    const c = this.ctx, b = this.bang, s = this.k * this.dpr
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height)
    if (this.nen.width) c.drawImage(this.nen, 0, 0)
    c.setTransform(s, 0, 0, s, 0, 0)
    // Vật phẩm.
    if (canh.vp) {
      const { x, y, loai } = canh.vp, n = this.giam ? 0 : Math.sin(nay / 260) * 3
      c.save(); c.translate(x, y + n)
      c.fillStyle = trongSuot(b.vang, 0.22); c.beginPath(); c.arc(0, 0, 21, 0, Math.PI * 2); c.fill()
      c.fillStyle = b.the; c.strokeStyle = b.vang; c.lineWidth = 3
      if (loai === 0) { // vòng benzene = Xúc tác
        c.beginPath(); for (let i = 0; i <= 6; i++) { const a = (i * Math.PI) / 3 + Math.PI / 6; if (i) c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); else c.moveTo(Math.cos(a) * 14, Math.sin(a) * 14) } c.fill(); c.stroke()
        c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 6.5, 0, Math.PI * 2); c.stroke()
      } else { // khiên
        c.beginPath(); c.moveTo(0, -15); c.quadraticCurveTo(12, -12, 13, -9); c.quadraticCurveTo(12, 8, 0, 15); c.quadraticCurveTo(-12, 8, -13, -9); c.quadraticCurveTo(-12, -12, 0, -15); c.fill(); c.stroke()
      }
      c.restore()
      this.chu(x, y + 31, loai === 0 ? 'Xúc tác' : 'Khiên', 10.5, b.chu, trongSuot(b.the, 0.9))
    }
    // Đạn ion.
    for (const d of canh.dan) {
      const mau = b.nguyenTo[d.nt] ?? b.vang
      c.strokeStyle = trongSuot(mau, 0.35); c.lineWidth = 7; c.lineCap = 'round'
      c.beginPath(); c.moveTo(d.x - d.vx * 0.05, d.y - d.vy * 0.05); c.lineTo(d.x, d.y); c.stroke()
      if (b.toi && !this.giam) { c.fillStyle = trongSuot(mau, 0.3); c.beginPath(); c.arc(d.x, d.y, 10, 0, Math.PI * 2); c.fill() }
      c.fillStyle = mau; c.beginPath(); c.arc(d.x, d.y, 7.5, 0, Math.PI * 2); c.fill()
      c.fillStyle = b.the; c.beginPath(); c.arc(d.x, d.y, 3.2, 0, Math.PI * 2); c.fill()
    }
    // Vạch ngắm của em.
    const em = canh.ghe.find((g) => g.laEm && !g.cho)
    if (em && canh.ngamEm) {
      c.strokeStyle = trongSuot(b.nguyenTo[em.nt] ?? b.nhan, 0.55); c.lineWidth = 2.5; c.setLineDash([3, 9]); c.lineCap = 'round'
      c.beginPath(); c.moveTo(em.x + Math.cos(em.ngam) * (R_NGUOI + 18), em.y + Math.sin(em.ngam) * (R_NGUOI + 18)); c.lineTo(em.x + Math.cos(em.ngam) * 150, em.y + Math.sin(em.ngam) * 150); c.stroke(); c.setLineDash([])
    }
    for (const g of canh.ghe) if (!g.cho) this.veNguoi(g, nay)
    // Hiệu ứng.
    for (let i = this.hu.length - 1; i >= 0; i--) {
      const h = this.hu[i], t = (nay - h.t0) / TUOI[h.k]
      if (t >= 1 || t < 0) { this.hu.splice(i, 1); continue }
      if (h.k === 3) { const g = canh.ghe.find((x) => x.id === h.goc); if (g) { h.x = g.x; h.y = g.y } }
      c.save(); c.globalAlpha = 1 - t
      if (h.k === 0) {
        c.strokeStyle = h.mau; c.lineWidth = 3; c.beginPath(); c.arc(h.x, h.y, 8 + t * 22, 0, Math.PI * 2); c.stroke()
        if (!this.giam) for (let j = 0; j < 7; j++) { const a = h.goc + (j * Math.PI * 2) / 7, r1 = 10 + t * 18, r2 = r1 + 9 * (1 - t); c.beginPath(); c.moveTo(h.x + Math.cos(a) * r1, h.y + Math.sin(a) * r1); c.lineTo(h.x + Math.cos(a) * r2, h.y + Math.sin(a) * r2); c.stroke() }
        this.chu(h.x, h.y - 26 - t * 26, h.chu!, 16, h.mau, b.the)
      } else if (h.k === 1) {
        if (!this.giam) for (let j = 0; j < 10; j++) { const a = h.goc + (j * Math.PI * 2) / 10, r = 6 + t * (34 + (j % 3) * 10); c.strokeStyle = h.mau; c.lineWidth = 2.5; c.beginPath(); c.arc(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r, 4 + (j % 3) * 2.5, 0, Math.PI * 2); c.stroke() }
        else { c.strokeStyle = h.mau; c.lineWidth = 3; c.beginPath(); c.arc(h.x, h.y, 26, 0, Math.PI * 2); c.stroke() }
        this.chu(h.x, h.y - 10 - t * 30, h.chu!, 24, h.mau, b.the)
      } else if (h.k === 2) {
        c.strokeStyle = h.mau; c.lineWidth = 2
        for (let j = 0; j < 4; j++) { const a = h.goc + (j * Math.PI) / 2, r = 3 + t * 12; c.beginPath(); c.moveTo(h.x + Math.cos(a) * r, h.y + Math.sin(a) * r); c.lineTo(h.x + Math.cos(a) * (r + 5), h.y + Math.sin(a) * (r + 5)); c.stroke() }
      } else if (h.k === 3) {
        c.strokeStyle = h.mau; c.lineWidth = 3; c.beginPath(); c.arc(h.x, h.y, 20 + t * 26, 0, Math.PI * 2); c.stroke()
        this.chu(h.x, h.y - 40 - t * 16, h.chu!, 14, h.mau, b.the)
      } else {
        c.fillStyle = trongSuot(h.mau, 0.7); c.beginPath(); c.arc(h.x, h.y, 9 * (1 - t) + 3, 0, Math.PI * 2); c.fill()
      }
      c.restore()
    }
  }

  /** Ảnh bìa nhỏ ở Sảnh đấu: hai nguyên tử đấu nhau qua bình cầu (vẽ một lần, không vòng lặp). */
  static veBia(cv: HTMLCanvasElement, bang: Bang, rong: number, cao: number, dpr: number): void {
    const c = cv.getContext('2d')
    if (!c || !(rong > 0) || !(cao > 0)) return
    const v = new VeSan(cv, c, bang, true)
    v.k = cao / 150; v.dpr = dpr
    cv.width = Math.round(rong * dpr); cv.height = Math.round(cao * dpr)
    v.veHat()
    const s = v.k * dpr, w = rong / v.k, h = 150, giua = w / 2
    c.setTransform(s, 0, 0, s, 0, 0)
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, bang.sanTren); g.addColorStop(1, bang.sanDuoi)
    c.fillStyle = g; c.fillRect(0, 0, w, h)
    c.strokeStyle = trongSuot(bang.luoi, 0.45); c.lineWidth = 1
    for (let i = 20; i < w; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke() }
    for (let i = 20; i < h; i += 40) { c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke() }
    v.veVatCan(c, { k: 'tron', x: giua, y: h / 2 + 4, r: 34, ve: 'binh-cau' })
    for (const d of [{ x: giua - 78, y: h / 2 + 12, vx: 470, vy: -40, nt: 0 }, { x: giua + 80, y: h / 2 - 22, vx: -470, vy: -20, nt: 1 }]) {
      const m = bang.nguyenTo[d.nt]
      c.strokeStyle = trongSuot(m, 0.35); c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(d.x - d.vx * 0.045, d.y - d.vy * 0.045); c.lineTo(d.x, d.y); c.stroke()
      c.fillStyle = m; c.beginPath(); c.arc(d.x, d.y, 6, 0, Math.PI * 2); c.fill(); c.fillStyle = bang.the; c.beginPath(); c.arc(d.x, d.y, 2.6, 0, Math.PI * 2); c.fill()
    }
    const mau: HienGhe = { id: 1, nt: 0, ten: '', x: giua - 128, y: h / 2 + 18, ngam: -0.12, mau: 3, khien: false, xucTac: false, giap: false, cho: false, laEm: false }
    v.veNguoi(mau, 0, false)
    v.veNguoi({ ...mau, id: 2, nt: 1, x: giua + 128, y: h / 2 - 16, ngam: Math.PI + 0.1, mau: 2 }, 0, false)
  }
}
