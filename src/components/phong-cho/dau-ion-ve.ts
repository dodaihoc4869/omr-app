// LỚP VẼ «Đấu Nguyên Tử» — Canvas 2D thuần, không thư viện, không ảnh.
// Màu đọc từ biến CSS của game (--dn-*, pha từ token app học sinh trong dau-ion.css) lúc chạy ⇒ đổi sáng/tối là đọc lại và vẽ lại nền.
// Nhẹ cho máy yếu: nền (sàn lục giác, dụng cụ thí nghiệm) vẽ MỘT lần vào canvas phụ; nguyên tử và quầng sáng vẽ sẵn thành ảnh nhỏ (không shadowBlur);
// hiệu ứng có trần (160; máy yếu 40). Máy yếu: bỏ quầng sáng, vệt đạn, loé đầu nòng, rung màn, electron quay, đường ngắm của bạn khác.
// BẢN VẼ 3 ĐẤU 3 (01/11, docs/ban-ve-dau-ion-3v3-0111): vẽ trong KHUNG ĐÃ XOAY (dau-ion-xoay.ts — phe em ở trái / dưới); cả quả nguyên tử tô MÀU PHE
// (Bazơ xanh --dn-phe-0, Axit đỏ --dn-phe-1), ký hiệu nguyên tố ở giữa; vòng viền + thanh Máu màu phe; em có vòng trắng ngoài + nhãn «Em»;
// tên đồng đội / đối thủ chữ màu phe; đối thủ em đang ngắm có dấu ngắm nhỏ; đối thủ đang ngắm EM có vạch mờ báo. Hiệu ứng dịu (thầy: «vui nhưng dịu mắt»).
import { BE_PHE, CAP, MAU_MAX, NGUYEN_TO, R, type LoaiVp, type SuKien } from '../../lib/dau-ion/loi'
import { KHONG_XOAY, coSan, ra, vatRa, type VatVe, type Xoay } from './dau-ion-xoay'

type Rgb = readonly [number, number, number]
export interface GheVe { id: number; nt: number; phe: number; ai?: boolean; x: number; y: number; ngam: number; mau: number; cap: number; cho: number; che: number; khien: number; muc: number; ha: number; vang?: boolean }
export interface DanVe { nt: number; phe: number; cap: number; x: number; y: number; vx: number; vy: number }
export interface VpVe { id: number; k: LoaiVp; x: number; y: number; t0: number }
/** Cảnh để vẽ một khung (trận tại máy dùng thẳng Tran của lõi; trận mạng dựng từ ảnh trận). `t` = giây của trận. */
export interface Canh { t: number; ghe: GheVe[]; dan: DanVe[]; vp: VpVe[] }
export interface Bang {
  toi: boolean; nt: Rgb[]; cap: Rgb[]
  /** Màu hai phe [Bazơ, Axit] và chữ màu phe (đậm hơn, đọc được trên thẻ). */
  phe: [Rgb, Rgb]; pheChu: [Rgb, Rgb]
  san1: Rgb; san2: Rgb; luoi: Rgb; luoiDam: Rgb; kinh: Rgb; kinhVien: Rgb; chu: Rgb; the: Rgb; e: Rgb; xt: Rgb; kh: Rgb; dung: Rgb; sai: Rgb; sao: Rgb
  /** Sáng nhất / tối nhất của bảng (ánh bóng, chữ trên nền màu) — lấy từ token, không màu thô. */
  trang: Rgb; den: Rgb
  phong: string
}
interface View { x0: number; y0: number; w: number; h: number }
interface HieuUng { k: string; x: number; y: number; t0: number; mau: Rgb; goc?: number; chu?: string; co?: number; vien?: string; r0?: number; r1?: number; w?: number; dur?: number; theo?: number; lech?: number; d?: [number, number][] }

const PI2 = Math.PI * 2
const NT = ['na', 'o', 'n', 'cl', 's', 'fe', 'ne']
/** Màu lát sàn / dung dịch trung tính (Na tím, Cl lục, S vàng, Fe cam) — không đỏ / xanh để khỏi lẫn màu phe. */
const NT_TRUNG_TINH = [0, 3, 4, 5]
const doSang = (c: Rgb) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255
const tron = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as unknown as Rgb
const RGBA = new Map<number, string>()
/** Chuỗi rgba có đệm (không tạo chuỗi mới mỗi khung). */
export function rgba(c: Rgb, a = 1): string {
  a = Math.round(a * 50) / 50
  const k = c[0] * 1e6 + c[1] * 1e3 + c[2] + a / 10
  let s = RGBA.get(k)
  if (!s) { s = `rgba(${c[0]},${c[1]},${c[2]},${a})`; if (RGBA.size > 4000) RGBA.clear(); RGBA.set(k, s) }
  return s
}

/** Đọc bảng màu: gán `var(--x)` vào chữ của phần tử dò ⇒ trình duyệt tự tính (kể cả color-mix); vẽ 1 điểm ảnh để luôn ra [r, g, b]. */
export function docBang(goc: HTMLElement): Bang {
  const p = document.createElement('i')
  p.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
  goc.appendChild(p)
  let x: CanvasRenderingContext2D | null = null
  try { const c = document.createElement('canvas'); c.width = c.height = 1; x = c.getContext('2d', { willReadFrequently: true }) } catch { /* thiếu Canvas */ }
  const lay = (bien: string): Rgb => {
    p.style.color = ''; p.style.color = `var(--dn-${bien})`
    const v = getComputedStyle(p).color
    if (!x) { const m = /(\d+)\D+(\d+)\D+(\d+)/.exec(v); return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128] }
    x.clearRect(0, 0, 1, 1); x.fillStyle = v; x.fillRect(0, 0, 1, 1)
    const d = x.getImageData(0, 0, 1, 1).data
    return [d[0], d[1], d[2]]
  }
  const the = lay('mat'), chu = lay('chu'), nen = lay('nen')
  const [den, trang] = doSang(chu) < doSang(nen) ? [chu, nen] : [nen, chu]
  const b: Bang = {
    toi: doSang(the) < 0.4, nt: NT.map((k) => lay(k)), cap: [0, 1, 2, 3, 4, 5].map((i) => lay(`capm-${i || 1}`)),
    phe: [lay('phe-0'), lay('phe-1')], pheChu: [lay('phe-0-chu'), lay('phe-1-chu')],
    san1: lay('san-1'), san2: lay('san-2'), luoi: lay('luoi'), luoiDam: lay('hs'), kinh: lay('kinh'), kinhVien: lay('chu-3'),
    chu, the, e: lay('e'), xt: lay('sao'), kh: lay('nut'), dung: lay('dung'), sai: lay('sai'), sao: lay('sao'), trang, den,
    phong: getComputedStyle(goc).fontFamily || 'sans-serif',
  }
  p.remove()
  return b
}

const TUOI: Record<string, number> = { chop: 90, tia: 260, so: 700, bong: 760, vong: 420, hut: 220, set: 260, no: 380, sao: 560, puff: 170 }

export class Ve {
  private ctx: CanvasRenderingContext2D
  private nen: HTMLCanvasElement | null = null
  private hat: HTMLCanvasElement[] = []
  private qs = new Map<string, HTMLCanvasElement>()
  hu: HieuUng[] = []
  private rung: { t0: number; dur: number; m: number } | null = null
  private doLuc = -1e9
  private s = 1
  private dpr = 1
  private view: View
  private goc = new Map<number, number>()
  private loe = new Map<number, number>()
  private giat = new Map<number, number>()
  private rongTen = new Map<string, number>()
  private soLuc = new Map<number, number>()
  /** Lúc đạn CỦA EM chạm (tại máy) từng đối thủ — để «trung» của phòng không nháy lần hai. */
  private chamLuc = new Map<number, number>()
  private nayCu = 0
  /** Khung xoay + phe em (phe em ở trái / dưới khung vẽ). */
  private xoay: Xoay = KHONG_XOAY
  private pheEm = 0
  private vw: number
  private vh: number
  private vat: VatVe[] = vatRa(KHONG_XOAY, 0)
  /** Điểm đến (chạm một điểm / rê chuột) — vòng nét đứt (toạ độ vẽ). */
  diToi: { x: number; y: number } | null = null

  private cv: HTMLCanvasElement
  b: Bang
  yeu: boolean
  constructor(cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D, b: Bang, yeu: boolean) {
    this.cv = cv; this.ctx = ctx; this.b = b; this.yeu = yeu
    const c = coSan(this.xoay); this.vw = c.w; this.vh = c.h; this.view = { x0: 0, y0: 0, w: c.w, h: c.h }
  }

  /** Đổi khung xoay / phe em (vào trận, xoay máy) ⇒ vẽ lại nền. Trả về cỡ sân vẽ. */
  datSan(xoay: Xoay, pheEm: number): { w: number; h: number } {
    const c = coSan(xoay)
    if (xoay.doc !== this.xoay.doc || xoay.lat !== this.xoay.lat || pheEm !== this.pheEm) {
      this.xoay = xoay; this.pheEm = pheEm; this.vw = c.w; this.vh = c.h; this.vat = vatRa(xoay, pheEm); this.nen = null; this.goc.clear()
    }
    return c
  }
  datCo(w: number, h: number, dpr: number, view?: View): void {
    this.view = view || { x0: 0, y0: 0, w: this.vw, h: this.vh }; this.dpr = dpr
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr); this.s = (w / this.view.w) * dpr
    this.rongTen.clear(); this.qs.clear(); this.taoHat(); this.nen = null
    if (!view) this.taoNen()
  }
  datBang(b: Bang): void { this.b = b; this.rongTen.clear(); this.qs.clear(); this.taoHat(); if (this.nen) this.taoNen() }
  private px(n: number): number { return (n * this.dpr) / this.s }
  private taoNen(): void {
    const c = document.createElement('canvas'); c.width = this.cv.width; c.height = this.cv.height
    const x = c.getContext('2d')
    if (!x) return
    x.setTransform(this.s, 0, 0, this.s, 0, 0); this.veSan(x); this.nen = c
  }

  private veSan(x: CanvasRenderingContext2D, coVat = true): void {
    const b = this.b, W = this.vw, H = this.vh, doc = this.xoay.doc
    const pheEm = this.pheEm, pheKia = 1 - pheEm
    x.save()
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, rgba(b.san1)); g.addColorStop(1, rgba(b.san2))
    x.fillStyle = g; x.beginPath(); x.roundRect(0, 0, W, H, 28); x.fill(); x.clip()
    // Hai nửa sân loang màu hai phe (nửa của em: trái khi ngang, dưới khi dọc).
    const [ex, ey] = ra(...BE_PHE[pheEm][1], this.xoay), [kx, ky] = ra(...BE_PHE[pheKia][1], this.xoay), rr = Math.max(W, H) * 0.62
    for (const [cx, cy, c] of [[ex, ey, b.phe[pheEm]], [kx, ky, b.phe[pheKia]]] as const) {
      const q = x.createRadialGradient(cx, cy, 0, cx, cy, rr); q.addColorStop(0, rgba(c, b.toi ? 0.26 : 0.17)); q.addColorStop(1, rgba(c, 0))
      x.fillStyle = q; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2)
    }
    // Lưới lục giác (vòng benzene); vài ô tô màu trung tính.
    const a = 26, h = a * Math.sqrt(3)
    const luc = (cx: number, cy: number, r: number) => { x.beginPath(); for (let k = 0; k <= 6; k++) { const an = (k * Math.PI) / 3; if (k) x.lineTo(cx + r * Math.cos(an), cy + r * Math.sin(an)); else x.moveTo(cx + r * Math.cos(an), cy + r * Math.sin(an)) } }
    let dem = 0
    const moiO = (f: (cx: number, cy: number, col: number, row: number) => void) => { for (let col = 0; col * 1.5 * a < W + a; col++) for (let row = -1; row * h < H + h; row++) f(col * 1.5 * a, row * h + (col % 2 ? h / 2 : 0), col, row) }
    moiO((cx, cy, col, row) => { if ((col * 7 + row * 13) % 23 === 0) { luc(cx, cy, a - 3); x.fillStyle = rgba(b.nt[NT_TRUNG_TINH[dem++ % 4]], b.toi ? 0.16 : 0.14); x.fill() } })
    x.strokeStyle = rgba(b.luoi); x.lineWidth = 1.3; x.beginPath()
    moiO((cx, cy) => { for (let k = 0; k <= 3; k++) { const an = (k * Math.PI) / 3 - Math.PI / 3, px = cx + a * Math.cos(an), py = cy + a * Math.sin(an); if (k) x.lineTo(px, py); else x.moveTo(px, py) } })
    x.stroke()
    // Vạch giữa sân + vòng giữa (nét đứt).
    x.setLineDash([10, 10]); x.lineWidth = 2.5; x.strokeStyle = rgba(b.luoiDam, 0.32); x.beginPath()
    if (doc) { x.moveTo(0, H / 2); x.lineTo(W, H / 2) } else { x.moveTo(W / 2, 0); x.lineTo(W / 2, H) }
    x.stroke(); x.beginPath(); x.arc(W / 2, H / 2, 112, 0, PI2); x.stroke()
    // Bệ xuất phát: lục giác màu phe.
    x.setLineDash([6, 6]); x.lineWidth = 2
    for (const p of [pheEm, pheKia]) for (const [bx, by] of BE_PHE[p]) {
      const [cx, cy] = ra(bx, by, this.xoay)
      luc(cx, cy, 27); x.fillStyle = rgba(b.phe[p], b.toi ? 0.22 : 0.18); x.fill(); x.strokeStyle = rgba(b.phe[p], 0.75); x.stroke()
    }
    x.setLineDash([])
    x.restore()
    if (coVat) for (const v of this.vat) this.veVat(x, v)
    x.strokeStyle = rgba(b.luoiDam, b.toi ? 0.45 : 0.35); x.lineWidth = 3; x.beginPath(); x.roundRect(1.5, 1.5, W - 3, H - 3, 27); x.stroke()
  }

  private veVat(x: CanvasRenderingContext2D, v: VatVe): void {
    const b = this.b, liq = v.mau !== undefined ? b.nt[v.mau] : b.e
    x.save(); x.lineJoin = 'round'
    x.fillStyle = rgba(b.chu, b.toi ? 0.4 : 0.12)
    x.beginPath()
    if (v.k === 'tron') x.ellipse(v.x + 4, v.y + 7, v.r, v.r * 0.92, 0, 0, PI2); else x.roundRect(v.x + 4, v.y + 6, v.w, v.h, 10)
    x.fill()
    x.lineWidth = 2.5; x.strokeStyle = rgba(b.kinhVien, 0.9); x.fillStyle = rgba(b.kinh, 0.95)
    if (v.k === 'tron') {
      x.beginPath(); x.arc(v.x, v.y, v.r, 0, PI2); x.fill(); x.stroke()
      x.save(); x.beginPath(); x.arc(v.x, v.y, v.r - 4, 0, PI2); x.clip()
      const muc = v.ve === 'binh-cau' ? v.y - 4 : v.y - v.r * 0.2
      const g = x.createLinearGradient(0, muc, 0, v.y + v.r); g.addColorStop(0, rgba(tron(liq, b.trang, 0.3))); g.addColorStop(1, rgba(liq))
      x.fillStyle = g; x.beginPath(); x.moveTo(v.x - v.r, muc)
      for (let i = 0; i <= 8; i++) x.lineTo(v.x - v.r + (i * v.r) / 4, muc + Math.sin(i * 1.3) * 3)
      x.lineTo(v.x + v.r, v.y + v.r); x.lineTo(v.x - v.r, v.y + v.r); x.fill()
      x.fillStyle = rgba(b.trang, 0.65)
      for (const [bx, by, br] of [[-0.3, 0.35, 0.1], [0.2, 0.55, 0.07], [0.4, 0.2, 0.06], [-0.1, 0.7, 0.05]]) { x.beginPath(); x.arc(v.x + bx * v.r, v.y + by * v.r, br * v.r + 1, 0, PI2); x.fill() }
      x.restore()
      x.fillStyle = rgba(b.kinh); x.strokeStyle = rgba(b.kinhVien, 0.9); x.lineWidth = 2.5
      const co = v.ve === 'binh-cau' ? 13 : 8
      x.beginPath(); x.arc(v.x, v.y, co, 0, PI2); x.fill(); x.stroke()
      x.fillStyle = rgba(liq, 0.55); x.beginPath(); x.arc(v.x, v.y, co * 0.55, 0, PI2); x.fill()
      x.strokeStyle = rgba(b.trang, 0.85); x.lineWidth = v.r > 30 ? 4 : 3; x.lineCap = 'round'; x.beginPath(); x.arc(v.x, v.y, v.r - (v.r > 30 ? 9 : 6), Math.PI * 1.08, Math.PI * 1.42); x.stroke()
    } else if (v.ve === 'gia-ong') {
      // Giá ống nghiệm = tường chắn căn cứ: ống chứa dung dịch MÀU PHE của căn cứ đó.
      const c = b.phe[v.cuaEm ? this.pheEm : 1 - this.pheEm], dung = v.h > v.w, dai = dung ? v.h : v.w
      x.beginPath(); x.roundRect(v.x, v.y, v.w, v.h, 10); x.fill(); x.stroke()
      for (let i = 0; i < 5; i++) {
        const t = 16 + (i * (dai - 32)) / 4, cx = dung ? v.x + v.w / 2 : v.x + t, cy = dung ? v.y + t : v.y + v.h / 2
        x.fillStyle = rgba(b.kinh); x.strokeStyle = rgba(b.kinhVien, 0.9); x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, 9, 0, PI2); x.fill(); x.stroke()
        x.fillStyle = rgba(c); x.beginPath(); x.arc(cx, cy, 5.5, 0, PI2); x.fill()
        x.fillStyle = rgba(b.trang, 0.8); x.beginPath(); x.arc(cx - 1.8, cy - 1.8, 1.6, 0, PI2); x.fill()
      }
    } else {
      x.beginPath(); x.roundRect(v.x, v.y, v.w, v.h, 12); x.fill(); x.stroke()
      const g = x.createLinearGradient(0, v.y + 8, 0, v.y + v.h); g.addColorStop(0, rgba(tron(liq, b.trang, 0.3))); g.addColorStop(1, rgba(liq))
      x.fillStyle = g; x.beginPath(); x.roundRect(v.x + 6, v.y + 12, v.w - 12, v.h - 18, 7); x.fill()
      x.strokeStyle = rgba(b.kinhVien, 0.75); x.lineWidth = 2
      for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(v.x + 6, v.y + 10 + i * 8); x.lineTo(v.x + 15, v.y + 10 + i * 8); x.stroke() }
    }
    x.restore()
  }

  /** Nguyên tử vẽ sẵn theo (phe, nguyên tố): cầu bóng MÀU PHE + ký hiệu nguyên tố — mỗi khung chỉ còn drawImage. */
  private taoHat(): void {
    const b = this.b, s = this.s, d = Math.ceil((R + 2) * 2 * s)
    this.hat = []
    for (let p = 0; p < 2; p++) for (let i = 0; i < NGUYEN_TO.length; i++) {
      const c = b.phe[p], cv = document.createElement('canvas'); cv.width = cv.height = d
      this.hat.push(cv)
      const x = cv.getContext('2d')
      if (!x) continue
      x.setTransform(s, 0, 0, s, 0, 0); x.translate(R + 2, R + 2)
      const g = x.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.08, 0, 0, R)
      g.addColorStop(0, rgba(tron(c, b.trang, 0.55))); g.addColorStop(0.55, rgba(c)); g.addColorStop(1, rgba(tron(c, b.den, 0.3)))
      x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, PI2); x.fill()
      x.fillStyle = rgba(b.trang, 0.5); x.beginPath(); x.ellipse(-R * 0.36, -R * 0.46, R * 0.3, R * 0.17, -0.6, 0, PI2); x.fill()
      x.font = `800 ${NGUYEN_TO[i].length > 1 ? 13 : 15}px ${b.phong}`; x.textAlign = 'center'; x.textBaseline = 'middle'
      // Chữ tối trên màu phe (Bazơ, Axit đều đủ sáng) ⇒ tương phản ≥ 4,5.
      x.fillStyle = doSang(c) > 0.2 ? rgba(tron(c, b.den, 0.85)) : rgba(b.trang); x.fillText(NGUYEN_TO[i], 0, 1.2)
    }
  }
  /** Quầng sáng vẽ sẵn theo màu (không dùng shadowBlur trong vòng vẽ). */
  private quang(x: CanvasRenderingContext2D, c: Rgb, cx: number, cy: number, r: number, a: number): void {
    const k = c.join()
    let q = this.qs.get(k)
    if (!q) {
      q = document.createElement('canvas'); q.width = q.height = 64
      const y = q.getContext('2d')
      if (y) { const g = y.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, rgba(c, 0.85)); g.addColorStop(0.35, rgba(c, 0.35)); g.addColorStop(1, rgba(c, 0)); y.fillStyle = g; y.fillRect(0, 0, 64, 64) }
      this.qs.set(k, q)
    }
    x.globalAlpha = a; x.drawImage(q, cx - r, cy - r, r * 2, r * 2); x.globalAlpha = 1
  }
  private chu(x: CanvasRenderingContext2D, cx: number, cy: number, s: string, coPx: number, mau: string, vien?: string, dam = 800): void {
    x.font = `${dam} ${this.px(coPx)}px ${this.b.phong}`; x.textAlign = 'center'; x.textBaseline = 'middle'
    if (vien) { x.lineWidth = this.px(4); x.strokeStyle = vien; x.lineJoin = 'round'; x.strokeText(s, cx, cy) }
    x.fillStyle = mau; x.fillText(s, cx, cy)
  }

  /** Sự kiện trận (toạ độ VẼ) ⇒ hiệu ứng. `nay` = đồng hồ vẽ (ms). Hiệu ứng dịu: rung nhẹ, không chớp dồn dập. */
  them(su: SuKien, nay: number, emId: number, canh: Canh): void {
    const b = this.b, gId = (id: number) => canh.ghe.find((g) => g.id === id)
    const mauCua = (id: number) => { const g = gId(id); return g ? b.phe[g.phe & 1] : b.sao }
    const pu = (h: Omit<HieuUng, 't0'>) => { this.hu.push({ ...h, t0: nay }); const tran = this.yeu ? 40 : 160; if (this.hu.length > tran) this.hu.splice(0, this.hu.length - tran) }
    const coEm = 'ai' in su && (su.ai === emId || ('boi' in su && su.boi === emId))
    const den = (a: number) => rgba(b.den, a)
    switch (su.t) {
      case 'ban': this.giat.set(su.chu, nay); if (!this.yeu) pu({ k: 'chop', x: su.x, y: su.y, mau: mauCua(su.chu), goc: su.ngam }); break
      // Đạn của em chạm đối thủ TẠI MÁY: nháy ngay (phòng xác nhận sau bằng «trung» ⇒ chỉ thêm «−1», không nháy lần hai).
      case 'cham': this.loe.set(su.ai, nay); this.chamLuc.set(su.ai, nay); pu({ k: 'tia', x: su.x, y: su.y, mau: mauCua(su.boi), goc: Math.random() * PI2 }); break
      case 'trung':
        if (!(su.boi === emId && nay - (this.chamLuc.get(su.ai) ?? -1e9) < 600)) { this.loe.set(su.ai, nay); pu({ k: 'tia', x: su.x, y: su.y, mau: mauCua(su.boi), goc: Math.random() * PI2 }) }
        // «−1» hiện BÊN PHẢI nguyên tử (không đè nhãn tên).
        if (coEm && su.mau > 0 && nay - (this.soLuc.get(su.ai) ?? -1e9) > 300) { this.soLuc.set(su.ai, nay); const g = gId(su.ai); pu({ k: 'so', x: (g ? g.x : su.x) + R + 16, y: (g ? g.y : su.y) + 4, chu: '−1', co: su.ai === emId ? 15 : 17, mau: su.ai === emId ? b.sai : b.sao }) }
        if (su.ai === emId) { this.rung = { t0: nay, dur: 120, m: 1.5 }; this.doLuc = nay }
        break
      case 'chan': { const g = gId(su.ai); if (!g) break; pu({ k: 'vong', x: g.x, y: g.y, mau: b.kh, r0: 6, r1: 26, w: 3, dur: 260, theo: g.id }); if (coEm) pu({ k: 'so', x: g.x, y: g.y - 30, chu: 'Chặn', co: 13, mau: b.kh }); break }
      case 'tat': if (!this.yeu) pu({ k: 'puff', x: su.x, y: su.y, mau: b.phe[(su.phe ?? 0) & 1] }); break
      case 'ha': {
        const c = mauCua(su.ai)
        pu({ k: 'bong', x: su.x, y: su.y, mau: c, goc: Math.random() * PI2 })
        pu({ k: 'vong', x: su.x, y: su.y, mau: c, r0: 10, r1: 60, w: 4, dur: 460 })
        pu({ k: 'so', x: su.x, y: su.y - 8, chu: 'Hạ!', co: su.boi === emId ? 20 : 14, mau: su.boi === emId ? b.sao : b.the, vien: su.boi === emId ? den(0.55) : rgba(b.chu, 0.6), dur: su.boi === emId ? 900 : 600 })
        if (coEm) this.rung = { t0: nay, dur: 200, m: su.boi === emId ? 3 : 2.5 }
        break
      }
      case 'hoi': { const g = gId(su.ai); if (g) pu({ k: 'vong', x: g.x, y: g.y, mau: b.phe[g.phe & 1], r0: 40, r1: 14, w: 3, dur: 380, theo: g.id }); break }
      // Em vào thay A.I: A.I tan thành bong bóng màu phe, vòng sáng thu về chỗ em.
      case 'thay': {
        const g = gId(su.ai); if (!g) break
        const c = b.phe[g.phe & 1]
        pu({ k: 'bong', x: g.x, y: g.y, mau: c, goc: Math.random() * PI2, dur: 900 })
        pu({ k: 'vong', x: g.x, y: g.y, mau: b.trang, r0: 56, r1: 16, w: 4, dur: 520, theo: g.id })
        pu({ k: 'vong', x: g.x, y: g.y, mau: c, r0: 70, r1: 22, w: 3, dur: 700, theo: g.id })
        break
      }
      case 'len': {
        const g = gId(su.ai); if (!g) break
        const c = b.cap[su.cap]
        pu({ k: 'vong', x: g.x, y: g.y, mau: c, r0: 18, r1: 70, w: 6, dur: 520, theo: g.id })
        pu({ k: 'vong', x: g.x, y: g.y, mau: b.trang, r0: 10, r1: 46, w: 3, dur: 360, theo: g.id })
        pu({ k: 'sao', x: g.x, y: g.y, mau: c, goc: Math.random() * PI2, theo: g.id })
        if (su.ai === emId) pu({ k: 'so', x: g.x, y: g.y + 46, chu: `Cấp ${su.cap}`, co: 17, mau: c, vien: den(0.6), theo: g.id, lech: 46, dur: 1000 })
        break
      }
      case 'nhat':
        if (su.k === 'e') { pu({ k: 'hut', x: su.x, y: su.y, mau: b.e, theo: su.ai }); if (su.ai === emId) pu({ k: 'so', x: su.x, y: su.y - 12, chu: '+1', co: 13, mau: b.e, vien: den(0.5) }) }
        else if (su.k === 'xt') { pu({ k: 'vong', x: su.x, y: su.y, mau: b.xt, r0: 8, r1: 80, w: 7, dur: 560 }); pu({ k: 'sao', x: su.x, y: su.y, mau: b.xt, goc: 0 }); if (su.ai !== emId) pu({ k: 'so', x: su.x, y: su.y - 26, chu: 'Xúc tác!', co: 13, mau: b.xt, vien: den(0.6), dur: 800 }) }
        else { pu({ k: 'vong', x: su.x, y: su.y, mau: b.kh, r0: 8, r1: 50, w: 5, dur: 460, theo: su.ai }); if (su.ai === emId) pu({ k: 'so', x: su.x, y: su.y - 26, chu: 'Khiên', co: 16, mau: b.kh, vien: rgba(b.trang, 0.8), dur: 900 }) }
        break
      case 'xich': {
        const p = gId(su.a), q = gId(su.b)
        if (!p || !q) break
        const d: [number, number][] = [], n = 7, nx = -(q.y - p.y), ny = q.x - p.x, l = Math.hypot(nx, ny) || 1
        for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 || i === n ? 0 : (Math.random() - 0.5) * 18; d.push([p.x + (q.x - p.x) * t + (nx / l) * j, p.y + (q.y - p.y) * t + (ny / l) * j]) }
        pu({ k: 'set', x: p.x, y: p.y, mau: b.cap[4], d })
        break
      }
      case 'no': pu({ k: 'no', x: su.x, y: su.y, mau: b.cap[5], goc: Math.random() * PI2 }); break
    }
  }

  /** Vẽ một khung (cảnh đã xoay về khung vẽ). `nay` = đồng hồ vẽ (ms); `ten` = tên trên thẻ. */
  ve(c: Canh, emId: number, nay: number, ten: (id: number) => string, o: { tinh?: boolean; anNgamKhac?: boolean } = {}): void {
    const x = this.ctx, b = this.b, s = this.s, v = this.view
    const dtVe = Math.min(0.1, Math.max(0, (nay - this.nayCu) / 1000)); this.nayCu = nay
    const gId = (id: number) => c.ghe.find((g) => g.id === id)
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, this.cv.width, this.cv.height)
    let ox = 0, oy = 0
    if (this.rung && !this.yeu) { const t = (nay - this.rung.t0) / this.rung.dur; if (t >= 0 && t < 1) { const m = this.rung.m * (1 - t); ox = Math.sin(nay * 0.13) * m; oy = Math.cos(nay * 0.17) * m } else if (t >= 1) this.rung = null }
    if (this.nen) x.drawImage(this.nen, ox * s, oy * s)
    x.setTransform(s, 0, 0, s, (ox - v.x0) * s, (oy - v.y0) * s)
    if (!this.nen) this.veSan(x, false)
    const em = gId(emId)
    const pheEm = em ? em.phe & 1 : this.pheEm
    // Điểm đến khi chạm một chỗ / rê chuột.
    if (this.diToi && em && em.cho <= 0) { x.strokeStyle = rgba(b.phe[pheEm], 0.7); x.lineWidth = this.px(2); x.setLineDash([this.px(4), this.px(4)]); x.beginPath(); x.arc(this.diToi.x, this.diToi.y, 10, 0, PI2); x.stroke(); x.setLineDash([]) }
    // Vật phẩm.
    for (const it of c.vp) {
      const vao = Math.max(0, Math.min(1, (c.t - it.t0) / 0.25)), bob = this.yeu ? 0 : Math.sin(nay / 300 + it.id) * 1.6
      x.save(); x.translate(it.x, it.y + bob); x.scale(vao, vao)
      if (it.k === 'e') {
        if (!this.yeu) this.quang(x, b.e, 0, 0, 14, b.toi ? 0.95 : 0.6)
        x.fillStyle = rgba(b.e); x.beginPath(); x.arc(0, 0, 4.4, 0, PI2); x.fill()
        x.fillStyle = rgba(b.trang, 0.95); x.beginPath(); x.arc(-1.3, -1.3, 1.7, 0, PI2); x.fill()
        if (!this.yeu) { x.strokeStyle = rgba(b.e, 0.6); x.lineWidth = 1; x.beginPath(); x.ellipse(0, 0, 9.5, 3.6, nay / 520 + it.id, 0, PI2); x.stroke() }
      } else if (it.k === 'xt') {
        if (!this.yeu) this.quang(x, b.xt, 0, 0, 30, b.toi ? 0.9 : 0.7)
        x.rotate(this.yeu ? 0 : nay / 900)
        x.fillStyle = rgba(b.the); x.strokeStyle = rgba(b.xt); x.lineWidth = 3.4
        x.beginPath(); for (let k = 0; k <= 6; k++) { const a = (k * Math.PI) / 3 + Math.PI / 6; if (k) x.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); else x.moveTo(Math.cos(a) * 14, Math.sin(a) * 14) } x.fill(); x.stroke()
        x.lineWidth = 2.4; x.beginPath(); x.arc(0, 0, 7, 0, PI2); x.stroke()
      } else {
        if (!this.yeu) this.quang(x, b.kh, 0, 0, 26, b.toi ? 0.8 : 0.5)
        x.fillStyle = rgba(b.kh); x.strokeStyle = rgba(tron(b.kh, b.den, 0.35)); x.lineWidth = 2
        x.beginPath(); x.moveTo(0, -14); x.quadraticCurveTo(11, -11, 12, -8); x.quadraticCurveTo(11, 8, 0, 14); x.quadraticCurveTo(-11, 8, -12, -8); x.quadraticCurveTo(-11, -11, 0, -14); x.fill(); x.stroke()
        x.strokeStyle = rgba(b.trang, 0.85); x.lineWidth = 2; x.beginPath(); x.moveTo(-4, 0); x.lineTo(-1, 4); x.lineTo(5, -4); x.stroke()
      }
      x.restore()
      if (it.k !== 'e' && vao >= 1) this.chu(x, it.x, it.y + 25, it.k === 'xt' ? 'Xúc tác' : 'Khiên', 10.5, rgba(b.chu), rgba(b.the, 0.9), 700)
    }
    // Đường ngắm: của EM rõ (nét chạy tới đối thủ, kể cả ở xa); đối thủ đang ngắm em: vạch chấm mờ màu phe họ (biết mà nấp). Bạn khác: không vẽ cho đỡ rối.
    for (const g of c.ghe) {
      if (g.cho > 0 || !g.muc) continue
      const m = gId(g.muc); if (!m || m.cho > 0) continue
      const laEm = g.id === emId, ngamEm = g.muc === emId && g.phe !== pheEm
      if (!laEm && (!ngamEm || this.yeu || o.anNgamKhac)) continue
      const an = Math.atan2(m.y - g.y, m.x - g.x)
      x.strokeStyle = rgba(b.phe[g.phe & 1], laEm ? 0.85 : b.toi ? 0.4 : 0.32); x.lineWidth = this.px(laEm ? 2.4 : 1.6); x.lineCap = 'round'
      x.setLineDash(laEm ? [this.px(7), this.px(6)] : [this.px(2), this.px(7)]); x.lineDashOffset = laEm && !this.yeu ? -nay / 25 : 0
      x.beginPath(); x.moveTo(g.x + Math.cos(an) * (R + 14), g.y + Math.sin(an) * (R + 14)); x.lineTo(m.x - Math.cos(an) * (R + 12), m.y - Math.sin(an) * (R + 12)); x.stroke()
    }
    x.setLineDash([]); x.lineDashOffset = 0
    // Đạn (màu phe người bắn).
    for (const d of c.dan) {
      const cl = b.phe[d.phe & 1], sp = Math.hypot(d.vx, d.vy) || 1, ux = d.vx / sp, uy = d.vy / sp, r = d.cap >= 5 ? 7.5 : d.cap >= 3 ? 6.4 : 6
      if (!this.yeu) {
        const dai = d.cap >= 5 ? 38 : d.cap >= 3 ? 28 : 24
        x.lineCap = 'round'; x.strokeStyle = rgba(d.cap >= 5 ? b.cap[5] : cl, d.cap >= 5 ? 0.6 : 0.42); x.lineWidth = r * 1.7
        x.beginPath(); x.moveTo(d.x - ux * dai, d.y - uy * dai); x.lineTo(d.x, d.y); x.stroke()
        if (b.toi || d.cap >= 4) this.quang(x, d.cap >= 5 ? b.cap[5] : cl, d.x, d.y, r * 3, b.toi ? 0.9 : 0.5)
      }
      x.fillStyle = rgba(cl)
      if (d.cap === 3 || d.cap === 4) {
        x.save(); x.translate(d.x, d.y); x.rotate(Math.atan2(uy, ux)); x.beginPath(); x.roundRect(-r * 1.7, -r * 0.85, r * 3.4, r * 1.7, r * 0.85); x.fill()
        if (!b.toi) { x.strokeStyle = rgba(b.den, 0.28); x.lineWidth = 1; x.stroke() }
        x.fillStyle = rgba(b.trang, 0.95); x.beginPath(); x.roundRect(-r * 0.9, -r * 0.35, r * 1.8, r * 0.7, r * 0.35); x.fill(); x.restore()
      } else {
        x.beginPath(); x.arc(d.x, d.y, r, 0, PI2); x.fill()
        if (!b.toi) { x.strokeStyle = rgba(b.den, 0.28); x.lineWidth = 1; x.stroke() }
        x.fillStyle = d.cap >= 5 ? rgba(tron(b.cap[5], b.trang, 0.5)) : rgba(b.trang, 0.95); x.beginPath(); x.arc(d.x, d.y, r * 0.48, 0, PI2); x.fill()
      }
      if (d.cap === 4 && !this.yeu) { x.strokeStyle = rgba(b.cap[4], 0.9); x.lineWidth = 1.6; x.beginPath(); x.moveTo(d.x - ux * 8 - uy * 5, d.y - uy * 8 + ux * 5); x.lineTo(d.x - ux * 13 + uy * 4, d.y - uy * 13 - ux * 4); x.lineTo(d.x - ux * 19 - uy * 4, d.y - uy * 19 + ux * 4); x.stroke() }
    }
    // Nguyên tử (xếp theo y cho có chiều sâu).
    const ds = c.ghe.filter((g) => g.cho <= 0).sort((p, q) => p.y - q.y)
    for (const g of ds) {
      let goc = this.goc.get(g.id)
      if (goc === undefined || o.tinh) goc = g.ngam
      else { let dd = g.ngam - goc; while (dd > Math.PI) dd -= PI2; while (dd < -Math.PI) dd += PI2; goc += dd * Math.min(1, dtVe * 14) }
      this.goc.set(g.id, goc)
      if (g.vang) x.globalAlpha = 0.45
      this.veNguyenTu(x, g, nay, goc, g.id === emId)
      x.globalAlpha = 1
    }
    for (const g of ds) this.veTen(x, g, g.id === emId ? 'Em' : ten(g.id), g.id === emId)
    // Dấu ngắm NHỎ trên đối thủ em đang ngắm.
    if (em && em.cho <= 0 && em.muc) {
      const m = gId(em.muc)
      if (m && m.cho <= 0) {
        x.save(); x.translate(m.x, m.y); x.rotate(this.yeu ? 0 : nay / 500); x.strokeStyle = rgba(b.phe[pheEm]); x.lineWidth = this.px(2.4); x.lineCap = 'round'
        for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; x.beginPath(); x.arc(0, 0, R + 9, a - 0.3, a + 0.3); x.stroke() }
        x.restore()
      }
    }
    // Hiệu ứng.
    for (let i = this.hu.length - 1; i >= 0; i--) {
      const h = this.hu[i], t = (nay - h.t0) / (h.dur || TUOI[h.k])
      if (t >= 1 || t < 0) { if (t >= 1) this.hu.splice(i, 1); continue }
      if (h.theo && h.k !== 'hut') { const g = gId(h.theo); if (g && g.cho <= 0) { h.x = g.x; h.y = g.y + (h.lech || 0) } }
      this.veHieuUng(x, h, t, c)
    }
    // Viền đỏ rất nhẹ khi em trúng đạn (dịu mắt).
    const t2 = (nay - this.doLuc) / 240
    if (t2 >= 0 && t2 < 1 && !this.yeu) { const cx = v.x0 + v.w / 2, cy = v.y0 + v.h / 2, rr = Math.max(v.w, v.h) * 0.6; const g = x.createRadialGradient(cx, cy, rr * 0.55, cx, cy, rr); g.addColorStop(0, rgba(b.sai, 0)); g.addColorStop(1, rgba(b.sai, 0.26 * (1 - t2))); x.fillStyle = g; x.fillRect(v.x0, v.y0, v.w, v.h) }
  }

  private veHieuUng(x: CanvasRenderingContext2D, h: HieuUng, t: number, c: Canh): void {
    const b = this.b, cl = h.mau, e = 1 - t, goc = h.goc ?? 0
    switch (h.k) {
      case 'chop': x.fillStyle = rgba(cl, e); x.beginPath(); x.arc(h.x, h.y, 3 + 6 * e, 0, PI2); x.fill(); x.fillStyle = rgba(b.trang, e); x.beginPath(); x.arc(h.x, h.y, 2 + 3 * e, 0, PI2); x.fill(); break
      case 'tia':
        x.strokeStyle = rgba(cl, e); x.lineWidth = 2.6; x.lineCap = 'round'
        for (let j = 0; j < 7; j++) { const a = goc + (j * PI2) / 7, r1 = 6 + t * 20, r2 = r1 + 9 * e; x.beginPath(); x.moveTo(h.x + Math.cos(a) * r1, h.y + Math.sin(a) * r1); x.lineTo(h.x + Math.cos(a) * r2, h.y + Math.sin(a) * r2); x.stroke() }
        x.fillStyle = rgba(b.trang, e * 0.7); x.beginPath(); x.arc(h.x, h.y, 7 * e, 0, PI2); x.fill(); break
      case 'so': { const n = t < 0.15 ? 0.7 + t * 2.4 : 1.06 - (t - 0.15) * 0.07; x.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1; this.chu(x, h.x, h.y - t * 26, h.chu!, h.co! * n, rgba(cl), h.vien || rgba(b.the, 0.9)); x.globalAlpha = 1; break }
      case 'bong':
        for (let j = 0; j < 11; j++) {
          const a = goc + j * 2.39, sp = (26 + (j % 4) * 13) * Math.sqrt(t) * 1.6, rr = 3 + (j % 3) * 2.6 + t * 4, px = h.x + Math.cos(a) * sp, py = h.y + Math.sin(a) * sp - t * 10
          x.strokeStyle = rgba(cl, e); x.lineWidth = 2.2; x.beginPath(); x.arc(px, py, rr, 0, PI2); x.stroke()
          if (j % 3 === 0) { x.fillStyle = rgba(b.trang, e * 0.7); x.beginPath(); x.arc(px - rr * 0.3, py - rr * 0.3, rr * 0.3, 0, PI2); x.fill() }
        }
        if (t < 0.25) { x.fillStyle = rgba(cl, (0.25 - t) * 3); x.beginPath(); x.arc(h.x, h.y, R * (1 + t * 2), 0, PI2); x.fill() }
        break
      case 'vong': x.strokeStyle = rgba(cl, e); x.lineWidth = h.w! * e + 0.5; x.beginPath(); x.arc(h.x, h.y, h.r0! + (h.r1! - h.r0!) * (1 - e * e), 0, PI2); x.stroke(); break
      case 'hut': { const g = c.ghe.find((k) => k.id === h.theo), tx = g ? g.x : h.x, ty = g ? g.y : h.y, k = t * t; x.fillStyle = rgba(cl, 1 - k * 0.5); x.beginPath(); x.arc(h.x + (tx - h.x) * k, h.y + (ty - h.y) * k, 4.4 * (1 - k * 0.5), 0, PI2); x.fill(); break }
      case 'set':
        x.lineJoin = 'round'; x.lineCap = 'round'
        for (const [w, col] of [[6, rgba(cl, e * 0.55)], [2.2, rgba(b.trang, e)]] as const) { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); h.d!.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.stroke() }
        break
      case 'no': { const r = 10 + 40 * (1 - e * e); x.fillStyle = rgba(cl, 0.5 * e); x.beginPath(); x.arc(h.x, h.y, r, 0, PI2); x.fill(); x.fillStyle = rgba(b.trang, 0.5 * e * e); x.beginPath(); x.arc(h.x, h.y, r * 0.45, 0, PI2); x.fill(); x.strokeStyle = rgba(cl, e); x.lineWidth = 3 * e + 0.5; x.beginPath(); x.arc(h.x, h.y, r + 4, 0, PI2); x.stroke(); break }
      case 'sao':
        for (let j = 0; j < 8; j++) {
          const a = goc + (j * PI2) / 8, r = 20 + t * 34 + (j % 2) * 8, px = h.x + Math.cos(a) * r, py = h.y + Math.sin(a) * r, z = 4.5 * e
          x.fillStyle = rgba(j % 2 ? b.trang : cl, e); x.beginPath(); x.moveTo(px, py - z); x.lineTo(px + z * 0.3, py - z * 0.3); x.lineTo(px + z, py); x.lineTo(px + z * 0.3, py + z * 0.3); x.lineTo(px, py + z); x.lineTo(px - z * 0.3, py + z * 0.3); x.lineTo(px - z, py); x.lineTo(px - z * 0.3, py - z * 0.3); x.fill()
        }
        break
      case 'puff': x.fillStyle = rgba(cl, 0.5 * e); x.beginPath(); x.arc(h.x, h.y, 3 + 7 * t, 0, PI2); x.fill(); break
    }
  }

  private veNguyenTu(x: CanvasRenderingContext2D, g: GheVe, nay: number, goc: number, laEm: boolean): void {
    const b = this.b, p = g.phe & 1, c = b.phe[p], cc = b.cap[g.cap] ?? b.cap[1]
    const loe = (nay - (this.loe.get(g.id) ?? -1e9)) / 140, giat = (nay - (this.giat.get(g.id) ?? -1e9)) / 90
    const quay = this.yeu ? 0 : nay / 1000
    x.save(); x.translate(g.x, g.y)
    if (b.toi && !this.yeu) this.quang(x, c, 0, 0, R + 20, 0.7)
    else { x.fillStyle = rgba(b.chu, b.toi ? 0.4 : 0.16); x.beginPath(); x.ellipse(2, R * 0.9, R * 0.95, R * 0.36, 0, 0, PI2); x.fill() }
    // Em: vòng TRẮNG ngoài (viền tối mảnh để nổi cả trên sàn sáng).
    if (laEm) {
      x.strokeStyle = rgba(b.den, b.toi ? 0.5 : 0.28); x.lineWidth = 7; x.beginPath(); x.arc(0, 0, R + 9, 0, PI2); x.stroke()
      x.strokeStyle = rgba(b.trang); x.lineWidth = 4; x.beginPath(); x.arc(0, 0, R + 9, 0, PI2); x.stroke()
    }
    // Hào quang theo cấp súng.
    if (g.cap >= 2) {
      x.save(); x.rotate(quay * (g.cap >= 4 ? 1.6 : 0.6))
      x.strokeStyle = rgba(cc, 0.9); x.lineWidth = g.cap >= 5 ? 3 : 2.4
      if (g.cap === 4) x.setLineDash([7, 5])
      x.beginPath(); x.arc(0, 0, R + (laEm ? 13.5 : 8), 0, PI2); x.stroke(); x.setLineDash([])
      if (g.cap >= 3) {
        x.fillStyle = rgba(cc)
        const n = g.cap >= 5 ? 6 : 3, rg = laEm ? R + 11.5 : R + 6
        for (let k = 0; k < n; k++) {
          x.save(); x.rotate((k * PI2) / n); x.beginPath()
          if (g.cap >= 5) { const f = this.yeu ? 1 : 0.8 + 0.35 * Math.sin(nay / 70 + k * 1.7); x.moveTo(rg, -4); x.quadraticCurveTo(rg + 6 + 7 * f, 0, rg, 4) }
          else { x.moveTo(rg + 5, 0); x.lineTo(rg, -3.5); x.lineTo(rg, 3.5) }
          x.fill(); x.restore()
        }
      }
      x.restore()
    }
    // Khiên hồi sinh: bong bóng.
    if (g.che > 0) { x.fillStyle = rgba(b.the, b.toi ? 0.12 : 0.35); x.strokeStyle = rgba(b.toi ? b.chu : b.kh, 0.75); x.lineWidth = 2; x.setLineDash([5, 4]); x.beginPath(); x.arc(0, 0, R + 12, 0, PI2); x.fill(); x.stroke(); x.setLineDash([]) }
    // Quỹ đạo: số electron quay = cấp súng.
    x.save(); x.rotate(g.id * 0.9 + quay * 0.4)
    x.strokeStyle = rgba(c, b.toi ? 0.6 : 0.5); x.lineWidth = 1.2; x.beginPath(); x.ellipse(0, 0, R + 6, (R + 6) * 0.42, 0, 0, PI2); x.stroke()
    for (let i = 0; i < g.cap; i++) { const a = quay * 4.5 + (i * PI2) / g.cap; x.fillStyle = rgba(g.cap >= 2 ? cc : b.chu); x.beginPath(); x.arc(Math.cos(a) * (R + 6), Math.sin(a) * (R + 6) * 0.42, 2.5, 0, PI2); x.fill() }
    x.restore()
    // Nòng súng: hình theo cấp; giật lùi khi bắn.
    x.save(); x.rotate(goc); if (giat >= 0 && giat < 1) x.translate(-(1 - giat) * 3, 0)
    this.veNong(x, g.cap, c, cc)
    x.restore()
    // Thân MÀU PHE (méo nhẹ + loé trắng khi trúng) + vòng viền màu phe đậm.
    const ep = loe >= 0 && loe < 1 ? 1 - loe : 0
    if (ep) x.scale(1 + ep * 0.12, 1 - ep * 0.1)
    const h = this.hat[p * NGUYEN_TO.length + g.nt]
    if (h) { const d = h.width / this.s; x.drawImage(h, -d / 2, -d / 2, d, d) }
    x.strokeStyle = rgba(tron(c, b.den, 0.35)); x.lineWidth = 2.6; x.beginPath(); x.arc(0, 0, R + 0.5, 0, PI2); x.stroke()
    if (ep) { x.fillStyle = rgba(b.trang, ep * 0.6); x.beginPath(); x.arc(0, 0, R, 0, PI2); x.fill() }
    x.restore()
    // Khiên vật phẩm: 3 cung = chặn 3 viên.
    if (g.khien > 0) {
      x.save(); x.translate(g.x, g.y); x.lineCap = 'round'
      for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k * PI2) / 3 + quay; x.strokeStyle = rgba(b.kh, k < g.khien ? 0.95 : 0.2); x.lineWidth = 4; x.beginPath(); x.arc(0, 0, R + 15, a + 0.25, a + PI2 / 3 - 0.25); x.stroke() }
      x.restore()
    }
    // Thanh Máu MÀU PHE dưới chân.
    const w = this.px(32), hb = this.px(5), yb = g.y + R + this.px(laEm ? 11 : 7), tl = Math.max(0, g.mau) / MAU_MAX
    x.fillStyle = rgba(b.chu, b.toi ? 0.5 : 0.2); x.beginPath(); x.roundRect(g.x - w / 2, yb, w, hb, hb / 2); x.fill()
    x.fillStyle = rgba(c); x.beginPath(); x.roundRect(g.x - w / 2, yb, w * tl, hb, hb / 2); x.fill()
  }

  private veNong(x: CanvasRenderingContext2D, cap: number, c: Rgb, cc: Rgb): void {
    const b = this.b
    x.fillStyle = rgba(tron(c, b.toi ? b.trang : b.den, b.toi ? 0.15 : 0.35))
    x.beginPath()
    if (cap === 1) { x.roundRect(R - 6, -4, 17, 8, 4); x.fill() }
    else if (cap === 2) { x.roundRect(R - 6, -8, 17, 6, 3); x.roundRect(R - 6, 2, 17, 6, 3); x.fill() }
    else if (cap === 3) { for (const a of [-0.3, 0, 0.3]) { x.save(); x.rotate(a); x.beginPath(); x.roundRect(R - 7, -3, 18, 6, 3); x.fill(); x.restore() } }
    else if (cap === 4) { x.roundRect(R - 6, -4.5, 19, 9, 4.5); x.fill(); x.strokeStyle = rgba(cc); x.lineWidth = 2; for (const p of [R + 2, R + 8]) { x.beginPath(); x.ellipse(p, 0, 2, 6.5, 0, 0, PI2); x.stroke() } }
    else { x.moveTo(R - 6, -5); x.lineTo(R + 13, -10); x.quadraticCurveTo(R + 16, 0, R + 13, 10); x.lineTo(R - 6, 5); x.closePath(); x.fill(); x.strokeStyle = rgba(cc); x.lineWidth = 2.4; x.beginPath(); x.moveTo(R + 13, -9); x.quadraticCurveTo(R + 16, 0, R + 13, 9); x.stroke() }
    x.fillStyle = rgba(cap >= 2 ? cc : b.trang); x.beginPath(); x.arc(R + (cap >= 5 ? 14 : 11), 0, 2.2, 0, PI2); x.fill()
  }

  /** Nhãn tên: EM = viên đặc màu phe chữ trắng «Em»; người khác = thẻ sáng viền + CHỮ màu phe (A.I ghi «A.I …»). Huy hiệu cấp súng bên trái. */
  private veTen(x: CanvasRenderingContext2D, g: GheVe, ten: string, laEm: boolean): void {
    const b = this.b, p = g.phe & 1, c = b.phe[p], k = ten + this.s
    x.font = `${laEm ? 800 : 700} ${this.px(11)}px ${b.phong}`
    let w = this.rongTen.get(k)
    if (w === undefined) { w = x.measureText(ten).width + this.px(12); this.rongTen.set(k, w) }
    const bd = this.px(16), ty = g.y - R - this.px(laEm ? 19 : 15), tx = g.x + bd / 2
    if (g.vang) x.globalAlpha = 0.5
    x.fillStyle = laEm ? rgba(c) : rgba(b.the, 0.92); x.beginPath(); x.roundRect(tx - w / 2, ty - this.px(9), w, this.px(18), this.px(9)); x.fill()
    x.strokeStyle = laEm ? rgba(b.trang) : rgba(c, 0.85); x.lineWidth = this.px(laEm ? 2 : 1.5); x.stroke()
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = laEm ? (doSang(c) > 0.2 ? rgba(b.den) : rgba(b.trang)) : rgba(b.pheChu[p]); x.fillText(ten, tx, ty + this.px(0.5))
    const bx = tx - w / 2 - bd / 2 + this.px(2), cc = b.cap[g.cap] ?? b.cap[1]
    x.fillStyle = rgba(cc); x.beginPath(); x.arc(bx, ty, bd / 2, 0, PI2); x.fill(); x.strokeStyle = rgba(b.the); x.lineWidth = this.px(1.5); x.stroke()
    x.font = `800 ${this.px(10)}px ${b.phong}`; x.fillStyle = doSang(cc) > 0.55 ? rgba(b.den) : rgba(b.trang); x.fillText(String(g.cap), bx, ty + this.px(0.5))
    x.globalAlpha = 1
  }

  /** Ảnh bìa ở sảnh: một cảnh 3 đấu 3 nhỏ vẽ MỘT lần (không vòng lặp) — phe Bazơ (em) trái, phe Axit phải. */
  static veBia(cv: HTMLCanvasElement, b: Bang, nt: number): void {
    const r = cv.getBoundingClientRect(), ctx = cv.getContext('2d')
    if (!ctx || !(r.width > 0) || !(r.height > 0)) return
    // Giữ trọn chiều cao cảnh (236 đơn vị); thẻ rộng thì thấy thêm hai đầu sân.
    const h = 236, w = (h * r.width) / r.height
    const v = new Ve(cv, ctx, b, false)
    v.datCo(r.width, r.height, Math.min(2, devicePixelRatio || 1), { x0: 520 - w / 2, y0: 262 - h / 2, w, h })
    const g = (id: number, phe: number, nt_: number, x: number, y: number, cap: number, muc: number, mau = MAU_MAX): GheVe => ({ id, phe, nt: nt_, x, y, ngam: 0, mau, cap, cho: 0, che: 0, khien: 0, muc, ha: 0 })
    const ghe = [g(1, 0, nt, 404, 324, 3, 3), g(2, 0, nt === 4 ? 2 : 4, 336, 214, 2, 4), g(3, 1, 1, 640, 340, 4, 1, 6), g(4, 1, 5, 676, 214, 2, 2)]
    for (const k of ghe) { const m = ghe.find((q) => q.id === k.muc)!; k.ngam = Math.atan2(m.y - k.y, m.x - k.x) }
    const dan: DanVe[] = []
    for (const [k, n] of [[ghe[0], 1], [ghe[0], 3], [ghe[1], 2], [ghe[2], 2], [ghe[3], 1]] as const) {
      const cs = Math.cos(k.ngam), sn = Math.sin(k.ngam)
      for (const vi of CAP[k.cap].vien) { const an = k.ngam + vi.g, dd = R + 18 + n * 40; dan.push({ nt: k.nt, phe: k.phe, cap: k.cap, x: k.x + Math.cos(an) * dd - sn * vi.l, y: k.y + Math.sin(an) * dd + cs * vi.l, vx: Math.cos(an), vy: Math.sin(an) }) }
    }
    const vp: VpVe[] = [[452, 248], [470, 380], [596, 300]].map(([x, y], i) => ({ id: i + 1, k: 'e' as const, x, y, t0: -1 }))
    v.ve({ t: 2, ghe, dan, vp }, 1, 2000, (id) => (['', 'Em', 'A.I Sulfur', 'Quốc Bảo', 'Ngọc Trâm'][id] ?? ''), { tinh: true })
  }
}
