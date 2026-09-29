// BI-A PHẢN ỨNG · VẼ BÀN + KHUNG HÌNH (chép từ bản vẽ). Bàn gỗ, nỉ có hoa văn vòng benzene mờ, 6 lỗ, chấm kim cương.
// Khi bàn nằm ngang: hình học vẽ theo toạ độ bàn (ma trận quay), còn BI, BÓNG BI, CHỮ vẽ theo toạ độ màn để đèn luôn góc trên trái.
import { datTFBan, raMan, type KhungBan } from './bo-cuc'
import { duDoan, type DuDoan } from './du-doan'
import { MAU_QH, type KiHieu, type QuanHe } from './nguyen-to'
import { taoBong, taoChu, toBi, type BangChu, type Bong } from './ve-bi'
import { DIEM_CHAN, H, LO, R, T, W, type Bi } from './vat-ly'
import type { VanBia } from './dieu-khien'

function goTron(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number): void {
  x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath()
}
/** Nền bàn (vẽ một lần mỗi cỡ). */
export function veNen(k: KhungBan, dpr: number, doc: Document = document): HTMLCanvasElement {
  const nen = doc.createElement('canvas')
  nen.width = Math.round(k.cw * dpr); nen.height = Math.round(k.ch * dpr)
  const x = nen.getContext('2d')
  if (!x) return nen
  datTFBan(x, k, dpr)
  const g = x.createLinearGradient(-T, -T, W + T, H + T)
  g.addColorStop(0, 'rgb(139,90,43)'); g.addColorStop(0.45, 'rgb(90,53,20)'); g.addColorStop(1, 'rgb(58,34,16)')
  goTron(x, -T, -T, W + 2 * T, H + 2 * T, 22); x.fillStyle = g; x.fill()
  x.save(); goTron(x, -T, -T, W + 2 * T, H + 2 * T, 22); x.clip(); x.globalAlpha = 0.07; x.strokeStyle = 'rgb(255,232,200)'; x.lineWidth = 1
  for (let i = 0; i < 46; i++) { const yy = -T + i * ((H + 2 * T) / 46); x.beginPath(); x.moveTo(-T, yy); x.bezierCurveTo(W * 0.3, yy + 8, W * 0.6, yy - 8, W + T, yy + 3); x.stroke() }
  x.restore()
  x.strokeStyle = 'rgba(255,255,255,.12)'; x.lineWidth = 1.2; goTron(x, -T + 2, -T + 2, W + 2 * T - 4, H + 2 * T - 4, 20); x.stroke()
  const f = x.createRadialGradient(W / 2, H * 0.45, 40, W / 2, H * 0.5, H * 0.7)
  f.addColorStop(0, 'rgb(27,145,124)'); f.addColorStop(0.6, 'rgb(14,107,92)'); f.addColorStop(1, 'rgb(9,74,64)')
  x.fillStyle = f; x.fillRect(0, 0, W, H)
  x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip(); x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 1
  const a = 22, hh = a * Math.sqrt(3)
  for (let row = -1; row < H / hh + 2; row++) for (let col = -1; col < W / (a * 3) + 2; col++) {
    const cx = col * a * 3 + (row % 2 ? a * 1.5 : 0), cy = row * hh / 2
    x.beginPath()
    for (let kk = 0; kk < 6; kk++) { const an = Math.PI / 3 * kk, px = cx + a * Math.cos(an), py = cy + a * Math.sin(an); if (kk) x.lineTo(px, py); else x.moveTo(px, py) }
    x.closePath(); x.stroke()
  }
  x.restore()
  // chữ trên nỉ: theo màn hình, không xoay theo bàn
  { const s = k.S * dpr, [cx, cy] = raMan(k, dpr, W / 2, H / 2); x.save(); x.setTransform(s, 0, 0, s, cx, cy); x.globalAlpha = 0.11; x.fillStyle = 'rgb(255,255,255)'; x.textAlign = 'center'
    x.font = "800 34px 'Baloo 2',sans-serif"; x.fillText('BI-A PHẢN ỨNG', 0, 10); x.font = "600 15px 'Be Vietnam Pro',sans-serif"; x.fillText('6,022 · 10²³', 0, 34); x.restore(); datTFBan(x, k, dpr) }
  x.save(); x.strokeStyle = 'rgba(255,255,255,.16)'; x.setLineDash([6, 8]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, H * 0.75); x.lineTo(W, H * 0.75); x.stroke(); x.restore()
  x.fillStyle = 'rgba(255,255,255,.28)'
  for (const p of [DIEM_CHAN, { x: W / 2, y: H * 0.75 }]) { x.beginPath(); x.arc(p.x, p.y, 3, 0, 7); x.fill() }
  const bong = (x0: number, y0: number, x1: number, y1: number) => { const gg = x.createLinearGradient(x0, y0, x1, y1); gg.addColorStop(0, 'rgba(0,0,0,.35)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); return gg }
  x.fillStyle = bong(0, 0, 0, 12); x.fillRect(0, 0, W, 12); x.fillStyle = bong(0, H, 0, H - 12); x.fillRect(0, H - 12, W, 12)
  x.fillStyle = bong(0, 0, 12, 0); x.fillRect(0, 0, 12, H); x.fillStyle = bong(W, 0, W - 12, 0); x.fillRect(W - 12, 0, 12, H)
  for (const P of LO) {
    const gg = x.createRadialGradient(P.x, P.y, 2, P.x, P.y, P.v)
    gg.addColorStop(0, 'rgb(0,0,0)'); gg.addColorStop(0.8, 'rgb(11,14,16)'); gg.addColorStop(1, 'rgb(29,34,36)')
    x.fillStyle = gg; x.beginPath(); x.arc(P.x, P.y, P.v, 0, 7); x.fill()
    x.strokeStyle = 'rgba(233,207,148,.55)'; x.lineWidth = 2.5; x.beginPath(); x.arc(P.x, P.y, P.v + 1, 0, 7); x.stroke()
  }
  x.fillStyle = 'rgb(233,207,148)'
  const kc = (cx: number, cy: number) => { x.beginPath(); x.moveTo(cx, cy - 4.5); x.lineTo(cx + 3, cy); x.lineTo(cx, cy + 4.5); x.lineTo(cx - 3, cy); x.closePath(); x.fill() }
  for (const kk of [1, 2, 3, 5, 6, 7]) { kc(-T / 2, H * kk / 8); kc(W + T / 2, H * kk / 8) }
  for (const kk of [1, 2, 3]) { kc(W * kk / 4, -T / 2); kc(W * kk / 4, H + T / 2) }
  return nen
}

/** Bộ vẽ một bàn: giữ ảnh đệm từng bi, bảng chiếu sáng, nền. */
export class BoVe {
  private bong: Bong | null = null
  private chu: BangChu | null = null
  private cache = new Map<string, { cv: HTMLCanvasElement; x: CanvasRenderingContext2D; img: ImageData; N: number; ver: number; xoay: boolean }>()
  private nen: HTMLCanvasElement | null = null
  private duDoanCu: { key: string; t: number; kq: DuDoan } = { key: '', t: 0, kq: { cue: [], obj: [] } }
  private nhip = 0
  /** Ảnh bóng đổ dưới bi (vẽ sẵn một lần mỗi cỡ, mỗi khung chỉ drawImage — không tạo gradient mỗi khung). */
  private bongDo: HTMLCanvasElement | null = null
  /** Dải màu cây cơ (tạo một lần, dịch bằng translate). */
  private gCo: CanvasGradient | null = null
  /** Toạ độ vẽ tạm (dùng lại, không cấp phát mỗi khung). */
  private readonly vt = { x: 0, y: 0 }
  k: KhungBan | null = null
  dpr = 1
  /** Máy yếu: bỏ quầng sáng (shadowBlur), bớt hạt hiệu ứng, giới hạn số ảnh bi tô lại mỗi khung. */
  nhe = false
  private doc: Document
  constructor(doc: Document = document) { this.doc = doc }
  /** Đổi cỡ: tính lại nền và bảng chiếu sáng. */
  datCo(k: KhungBan, dpr: number, nhe = this.nhe): void {
    this.k = k; this.dpr = dpr; this.nhe = nhe
    const Dr = Math.min(2, dpr), N = Math.max(16, Math.ceil(2 * R * k.S * Dr) + 2)
    this.bong = taoBong(N); (this.bong as Bong & { du: number }).du = N / (k.S * Dr)
    if (!this.chu) this.chu = taoChu(this.doc)
    this.cache.clear()
    this.nen = veNen(k, dpr, this.doc)
    this.bongDo = this.veBongDo(k.S * dpr)
  }
  /** Bóng đổ một bi: gradient tròn mờ, bán kính R·1,15 (điểm ảnh canvas). */
  private veBongDo(s: number): HTMLCanvasElement | null {
    const rr = R * 1.15 * s, n = Math.max(4, Math.ceil(2 * rr)), cv = this.doc.createElement('canvas')
    cv.width = cv.height = n
    const x = cv.getContext('2d')
    if (!x) return null
    const g = x.createRadialGradient(n / 2, n / 2, R * 0.2 * s, n / 2, n / 2, rr); g.addColorStop(0, 'rgba(0,0,0,.38)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = g; x.beginPath(); x.arc(n / 2, n / 2, rr, 0, 7); x.fill()
    return cv
  }
  /** Nạp lại chữ trên ô nhãn (sau khi phông tải xong). */
  napLaiChu(): void { this.chu = taoChu(this.doc); this.cache.clear(); if (this.k) this.nen = veNen(this.k, this.dpr, this.doc) }
  /** Số ảnh bi còn được tô lại trong khung này (máy yếu: tối đa 4, bi khác giữ ảnh cũ thêm một khung). */
  private conTo = Infinity
  private anhBi(b: Bi): HTMLCanvasElement | null {
    const B = this.bong
    if (!B || !this.chu || !this.k) return null
    let c = this.cache.get(b.id)
    if (c && c.N === B.N && c.ver === b.ver && c.xoay === this.k.xoay) return c.cv
    if (c && c.N === B.N && c.xoay === this.k.xoay && c.ver >= 0 && this.conTo <= 0) return c.cv
    this.conTo--
    if (!c || c.N !== B.N) {
      const cv = this.doc.createElement('canvas'); cv.width = cv.height = B.N
      const x = cv.getContext('2d')
      if (!x) return null
      c = { cv, x, img: x.createImageData(B.N, B.N), N: B.N, ver: -1, xoay: this.k.xoay }
      this.cache.set(b.id, c)
    }
    toBi(B, this.chu, b.id, b.q, this.k.xoay, c.img.data)
    c.x.putImageData(c.img, 0, 0); c.ver = b.ver; c.xoay = this.k.xoay
    return c.cv
  }
  /** Vẽ một khung hình của ván. `chi`: bi đang được chỉ (nhãn) và quan hệ. */
  ve(ctx: CanvasRenderingContext2D, v: VanBia, chi: { id: KiHieu; qh: QuanHe } | null, mtBat: boolean, keoBiCai: boolean): void {
    const k = this.k, B = this.bong as (Bong & { du: number }) | null
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    if (!k || !B || !this.nen) return
    const s = k.S * this.dpr, balls = v.st.balls, vt = this.vt, nhe = this.nhe
    this.conTo = nhe ? 4 : Infinity
    ctx.drawImage(this.nen, 0, 0)
    const bd = this.bongDo
    if (bd) for (let i = 0; i < balls.length; i++) {
      if (!balls[i]!.on) continue
      v.viTriVe(i, vt); this.man(vt.x, vt.y)
      ctx.drawImage(bd, vt.x + 3 * s - bd.width / 2, vt.y + 5 * s - bd.height / 2)
    }
    for (const r of v.roi) {
      const kk = Math.min(1, r.t / 0.28), rb = v.bi_(r.id), sp = this.anhBi(rb)
      if (!sp) continue
      const [p, q] = raMan(k, this.dpr, r.x + (r.px - r.x) * kk, r.y + (r.py - r.y) * kk), sz = B.du * (1 - 0.55 * kk) * s
      ctx.globalAlpha = 1 - kk; ctx.drawImage(sp, p - sz / 2, q - sz / 2, sz, sz); ctx.globalAlpha = 1
    }
    datTFBan(ctx, k, this.dpr)
    const nguoi = !v.ghe[v.cur]!.ai
    const nhin = ((v.pha === 'aim' && !v.sheet) || v.pha === 'ai-nham') && v.bi_('cue').on
    const mt = nguoi && ((v.matThan > 0 && mtBat) || (v.luonMT && v.cur === v.em)) // luôn bật Mắt thần: chỉ cú của chính em
    const info = nhin ? v.nham() : null
    if (info) {
      ctx.save(); ctx.lineCap = 'round'
      const sx = info.c.x + v.aim.x * R, sy = info.c.y + v.aim.y * R
      ctx.setLineDash([7, 7]); ctx.strokeStyle = mt ? 'rgba(255,224,130,.95)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(info.gx, info.gy); ctx.stroke(); ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(info.gx, info.gy, R, 0, 7); ctx.stroke()
      if (info.loai === 'bi') {
        const ok = v.hopLe(info.b.id)
        if (v.pha === 'ai-nham') { ctx.strokeStyle = 'rgba(255,224,130,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(info.b.x, info.b.y); ctx.lineTo(info.b.x + info.nx * (60 + 140 * info.cut), info.b.y + info.ny * (60 + 140 * info.cut)); ctx.stroke() }
        if (!ok) { ctx.strokeStyle = 'rgba(255,107,107,.95)'; ctx.lineWidth = 2.4; const d = 8; ctx.beginPath(); ctx.moveTo(info.gx - d, info.gy - d); ctx.lineTo(info.gx + d, info.gy + d); ctx.moveTo(info.gx + d, info.gy - d); ctx.lineTo(info.gx - d, info.gy + d); ctx.stroke() }
        ctx.strokeStyle = ok ? 'rgba(255,214,107,.9)' : 'rgba(255,107,107,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(info.b.x, info.b.y, R + 4, 0, 7); ctx.stroke()
      }
      if (mt && v.pha === 'aim') {
        const dd = this.duDoan(v)
        ctx.setLineDash([2, 7]); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.4; veDuong(ctx, dd.cue); ctx.setLineDash([])
        ctx.strokeStyle = 'rgba(255,214,107,.95)'; ctx.lineWidth = 2.8; veDuong(ctx, dd.obj)
        const e = dd.cue[dd.cue.length - 1]; if (e) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(e[0], e[1], R, 0, 7); ctx.stroke() }
        const o = dd.obj[dd.obj.length - 1]; if (o) { ctx.fillStyle = 'rgba(255,214,107,.95)'; ctx.beginPath(); ctx.arc(o[0], o[1], 5, 0, 7); ctx.fill() }
      }
      ctx.restore()
    }
    if (chi) { const i = balls.findIndex((b) => b.id === chi.id), b = balls[i]; if (b && b.on) { v.viTriVe(i, vt); ctx.save(); ctx.strokeStyle = MAU_QH[chi.qh]; ctx.lineWidth = 3.2; if (!nhe) { ctx.shadowColor = MAU_QH[chi.qh]; ctx.shadowBlur = 8 } ctx.beginPath(); ctx.arc(vt.x, vt.y, R + 6, 0, 7); ctx.stroke(); ctx.restore() } }
    this.nhip += 0.05
    const sz = B.du * s
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i]!
      if (!b.on) continue
      v.viTriVe(i, vt)
      if (b.id !== 'cue' && b.id !== 'C' && v.bi[b.id].vang) { datTFBan(ctx, k, this.dpr); ctx.save(); if (!nhe) { ctx.shadowColor = 'rgba(255,200,60,.95)'; ctx.shadowBlur = 10 + 4 * Math.sin(this.nhip * 3) } ctx.strokeStyle = 'rgb(255,214,107)'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.arc(vt.x, vt.y, R + 3, 0, 7); ctx.stroke(); ctx.restore() }
      const sp = this.anhBi(b)
      if (!sp) continue
      this.man(vt.x, vt.y)
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sp, vt.x - sz / 2, vt.y - sz / 2, sz, sz)
    }
    datTFBan(ctx, k, this.dpr)
    if (v.ballInHand && v.pha === 'aim' && nguoi && !v.sheet) {
      const c = v.bi_('cue')
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = keoBiCai ? 'rgb(255,214,107)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, R + 9, 0, 7); ctx.stroke(); ctx.restore()
      const [p, q] = raMan(k, this.dpr, c.x, c.y)
      ctx.setTransform(s, 0, 0, s, p, q); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = "600 13px 'Be Vietnam Pro',sans-serif"; ctx.textAlign = 'center'; ctx.fillText('Kéo để đặt', 0, R + 26); datTFBan(ctx, k, this.dpr)
    }
    if (info) {
      const c = info.c, an = Math.atan2(v.aim.y, v.aim.x), keo = 6 + v.power * 80
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(an + Math.PI)
      if (!nhe) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6 }
      const a0 = R + keo, L = 400
      ctx.translate(a0, 0)
      ctx.fillStyle = this.dayCo(ctx, L); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(L, -6.5); ctx.arcTo(L + 6, -6.5, L + 6, 0, 6); ctx.arcTo(L + 6, 6.5, L, 6.5, 6); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.restore()
    }
    for (let i = 0; i < v.fx.length; i++) {
      const f = v.fx[i]!
      if (f.t < 0 || (nhe && f.k !== 'vong' && i % 2)) continue // máy yếu: vẽ nửa số hạt
      const kk = f.t / f.life
      if (f.k === 'vong') { ctx.strokeStyle = `rgba(255,214,107,${1 - kk})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 8 + 60 * kk, 0, 7); ctx.stroke() }
      else if (f.k === 'hat') { ctx.globalAlpha = kk < 0.6 ? 1 : (1 - kk) / 0.4; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(f.x, f.y, f.s, 0, 7); ctx.fill(); ctx.globalAlpha = 1 }
      else { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.r + f.t * 5); ctx.globalAlpha = Math.min(1, (f.life - f.t) * 1.5); ctx.fillStyle = f.c; ctx.fillRect(-f.s, -f.s / 2, f.s * 2, f.s); ctx.restore(); ctx.globalAlpha = 1 }
    }
    for (const n of v.noi) {
      const kk = n.t / 1.2, [p, q] = raMan(k, this.dpr, n.x, n.y)
      ctx.setTransform(s, 0, 0, s, p, q); ctx.textAlign = 'center'; ctx.font = "800 28px 'Baloo 2',sans-serif"; ctx.globalAlpha = 1 - kk
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,20,0,.8)'; ctx.strokeText(n.chu, 0, -34 * kk); ctx.fillStyle = 'rgb(255,214,107)'; ctx.fillText(n.chu, 0, -34 * kk); ctx.globalAlpha = 1
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }
  /** Toạ độ bàn → điểm ảnh canvas, ghi vào this.vt (không tạo mảng mới mỗi bi mỗi khung). */
  private man(x: number, y: number): void {
    const k = this.k!, s = k.S * this.dpr
    if (k.xoay) { this.vt.x = s * (H + T - y); this.vt.y = s * (x + T) } else { this.vt.x = s * (x + T); this.vt.y = s * (y + T) }
  }
  private dayCo(ctx: CanvasRenderingContext2D, L: number): CanvasGradient {
    if (this.gCo) return this.gCo
    const g = ctx.createLinearGradient(0, 0, L, 0)
    g.addColorStop(0, 'rgb(46,123,214)'); g.addColorStop(0.012, 'rgb(244,238,220)'); g.addColorStop(0.04, 'rgb(244,238,220)'); g.addColorStop(0.041, 'rgb(232,201,143)'); g.addColorStop(0.62, 'rgb(200,153,90)'); g.addColorStop(0.63, 'rgb(255,214,107)'); g.addColorStop(0.645, 'rgb(58,33,18)'); g.addColorStop(1, 'rgb(30,18,10)')
    this.gCo = g
    return g
  }
  /** Mắt thần: tính lại tối đa ~16 lần/giây khi đổi hướng/lực/xoáy. */
  private duDoan(v: VanBia): DuDoan {
    const c = v.bi_('cue'), p = v.power > 0.02 ? v.power : 0.5
    const key = [v.aim.x.toFixed(4), v.aim.y.toFixed(4), p.toFixed(2), v.spin.x.toFixed(2), v.spin.y.toFixed(2), c.x.toFixed(1), c.y.toFixed(1)].join()
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (key === this.duDoanCu.key || now - this.duDoanCu.t < 60) return this.duDoanCu.kq
    this.duDoanCu = { key, t: now, kq: duDoan(v.st, v.aim, v.power, v.spin) }
    return this.duDoanCu.kq
  }
}
function veDuong(x: CanvasRenderingContext2D, pts: readonly [number, number][]): void {
  if (pts.length < 2) return
  x.beginPath(); x.moveTo(pts[0]![0], pts[0]![1])
  for (let i = 1; i < pts.length; i++) x.lineTo(pts[i]![0], pts[i]![1])
  x.stroke()
}
/** Vẽ một bi mẫu (Sảnh Bi-a, bảng nguyên tố). */
export function veBiMau(canvas: HTMLCanvasElement, id: KiHieu, q: [number, number, number, number], doc: Document = document): void {
  const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), N = Math.round(64 * dpr), x = canvas.getContext('2d')
  if (!x) return
  canvas.width = canvas.height = N
  const img = x.createImageData(N, N)
  toBi(taoBong(N), taoChu(doc), id, q, false, img.data)
  x.putImageData(img, 0, 0)
}
