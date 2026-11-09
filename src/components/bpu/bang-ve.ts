// BÌNH PHẢN ỨNG — VẼ CANVAS CỦA BẢNG CHIẾU (chép từ nguyên mẫu thầy duyệt, docs/ban-ve-binh-phan-ung-0611/nguyen-mau.html).
// Sân khấu toạ độ 1920×1080; bộ đệm canvas = 1920·k·dpr (vẽ lại theo đúng độ phân giải màn ⇒ máy chiếu 4K vẫn nét, không phóng ảnh).
// MÀU: chỉ đọc từ biến CSS sẵn có trên gốc bảng (getComputedStyle) — không mã màu thô trong mã. Máy yếu / giảm chuyển động ⇒ không hạt, không bọt, không phát sáng.

export type CanhBang =
  | { loai: 'trong' }
  | { loai: 'binh'; muc: number; con: number | null }
  | { loai: 'ong'; ong: OngVe[]; mo0: number }
  | { loai: 'lua'; giaTri: number[]; x: number[]; day: number; cao: number; nen: number }

/** top / day: miệng / đáy ống trên sân khấu (mặc định 150 / 640 — ống dài cũ). Ống «chibi» ngắn mập + Đúng–sai hai hàng (thầy 07/11). */
export interface OngVe { x: number; w: number; mau: string; dung: boolean; h: number; top?: number; day?: number }
export interface MauBang { tin: string; hs: string; dung: string; sao: string; chuY: string; vien: string; chu: string; mat: string; giay: string; doi: string[] }

type Hat = { t0: number; d: number; mau: string; vet: [number, number][]; p: number[]; xong?: () => void }
type Manh = { x: number; y: number; vx: number; vy: number; q: number; vq: number; s: number; tuoi: number; song: number; mau: string; nang: number }
type Bot = { x: number; y: number; r: number; v: number }
/** Lấp lánh (09/11 «hiệu ứng nộp câu bay lên bảng lung linh hơn»): sao bốn cánh nhỏ rắc dọc đường bay + toé khi tới bình. */
type Sao = { x: number; y: number; vx: number; vy: number; tuoi: number; song: number; s: number; mau: string; pha: number }
/** Gợn sóng sáng ở miệng bình khi một bài gửi tới. */
type Gon = { x: number; y: number; t0: number; mau: string }

export const BINH = { x: 1528, y: 470, r: 188, co: 46, mieng: 196 }
const kep = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const ghep = (a: number, b: number, t: number) => a + (b - a) * t
const deo = (t: number) => 1 - Math.pow(1 - t, 3)

/** Đọc màu từ chuỗi CSS (#rgb, #rrggbb, rgb(r g b) / rgb(r,g,b)). */
export function docRgb(c: string): [number, number, number] {
  const s = c.trim()
  if (s.startsWith('#')) {
    const m = s.slice(1), h = m.length === 3 ? m.split('').map((x) => x + x).join('') : m.slice(0, 6)
    const n = parseInt(h, 16)
    return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [128, 128, 128]
  }
  const so = s.match(/[\d.]+/g)?.map(Number) ?? []
  return so.length >= 3 ? [so[0]!, so[1]!, so[2]!] : [128, 128, 128]
}
export const moMau = (c: string, a: number) => { const [r, g, b] = docRgb(c); return `rgba(${r},${g},${b},${a})` }
export const tronMau = (a: string, b: string, t: number) => { const x = docRgb(a), y = docRgb(b); return `rgb(${x.map((v, k) => Math.round(ghep(v, y[k]!, t))).join(',')})` }

export function docMauBang(goc: Element): MauBang {
  const cs = getComputedStyle(goc), v = (n: string) => cs.getPropertyValue(n).trim() || cs.getPropertyValue('--tr-chu').trim()
  return { tin: v('--tr-tin'), hs: v('--tr-hs'), dung: v('--tr-dung'), sao: v('--tr-sao'), chuY: v('--tr-chu-y'), vien: v('--tr-vien-2'), chu: v('--tr-chu'), mat: v('--tr-mat'), giay: v('--giay'), doi: [v('--p-cam'), v('--p-tim-2'), v('--p-xanh'), v('--p-do')] }
}

export class VeBang {
  private c: CanvasRenderingContext2D
  private c2: CanvasRenderingContext2D
  private hat: Hat[] = []
  private manh: Manh[] = []
  private bot: Bot[] = []
  private sao: Sao[] = []
  private gon: Gon[] = []
  private mucHien = 0
  private luaHien: number[] = [0, 0, 0, 0]
  private ongHien: number[] = []
  private raf = 0
  private truoc = 0
  private tiLe = 1
  canh: CanhBang = { loai: 'trong' }
  mau: MauBang
  yeu: boolean
  phaoRoi = false

  private cv: HTMLCanvasElement
  private cvTren: HTMLCanvasElement
  constructor(cv: HTMLCanvasElement, cvTren: HTMLCanvasElement, goc: Element, yeu: boolean) {
    this.cv = cv
    this.cvTren = cvTren
    this.c = cv.getContext('2d')!
    this.c2 = cvTren.getContext('2d')!
    this.mau = docMauBang(goc)
    this.yeu = yeu
  }
  /** Bộ đệm theo độ phân giải thật (k = tỉ lệ sân khấu). */
  datCo(k: number): void {
    const dpr = Math.min(3, window.devicePixelRatio || 1), w = Math.max(1, Math.round(1920 * k * dpr)), h = Math.max(1, Math.round(1080 * k * dpr))
    for (const cv of [this.cv, this.cvTren]) if (cv.width !== w) { cv.width = w; cv.height = h }
    this.tiLe = w / 1920
  }
  chay(): void { if (!this.raf) { this.truoc = performance.now(); this.raf = requestAnimationFrame(this.khung) } }
  dung(): void { cancelAnimationFrame(this.raf); this.raf = 0 }

  bayHat(tu: { x: number; y: number }, den: { x: number; y: number }, mau: string, d = 900, xong?: () => void): void {
    if (this.yeu) { xong?.(); return }
    const lech = (tu.x - den.x) * 0.35
    // Rời ô tên: một chùm lấp lánh nhỏ; tới bình: toé sao + gợn sóng sáng (rồi mới gọi `xong` của nơi gọi).
    this.raoSao(tu.x, tu.y, 6, mau, 160)
    this.hat.push({ t0: performance.now(), d, mau, vet: [], p: [tu.x, tu.y, tu.x - lech, 520, den.x, BINH.mieng - 140, den.x, den.y], xong: () => { this.raoSao(den.x, den.y, 14, mau, 260); this.gon.push({ x: den.x, y: den.y, t0: performance.now(), mau }); xong?.() } })
  }
  private raoSao(x: number, y: number, n: number, mau: string, v: number): void {
    for (let k = 0; k < n; k++) { const g = Math.random() * Math.PI * 2, t = v * (0.35 + Math.random() * 0.65); this.sao.push({ x, y, vx: Math.cos(g) * t, vy: Math.sin(g) * t - 60, tuoi: 0, song: 0.6 + Math.random() * 0.6, s: 5 + Math.random() * 7, mau: Math.random() < 0.35 ? this.mau.giay : mau, pha: Math.random() * 6 }) }
    if (this.sao.length > 400) this.sao.splice(0, this.sao.length - 400)
  }
  bungManh(x: number, y: number, n: number, mau: string, luc = 1): void {
    if (this.yeu) return
    for (let k = 0; k < n; k++) {
      const g = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = (380 + Math.random() * 520) * luc
      this.manh.push({ x, y, vx: Math.cos(g) * v, vy: Math.sin(g) * v, q: Math.random() * 6, vq: (Math.random() - 0.5) * 14, s: 8 + Math.random() * 12, tuoi: 0, song: 1 + Math.random() * 0.8, mau: Math.random() < 0.3 ? this.mau.giay : mau, nang: 1 })
    }
  }
  mucBinh = () => ghep(BINH.y + BINH.r, BINH.y - BINH.r * 0.78, this.mucHien)

  private khung = (now: number): void => {
    this.raf = requestAnimationFrame(this.khung)
    if (!this.c || !this.c2) return // trình duyệt không có canvas 2D (môi trường test) ⇒ chỉ phần chữ
    const dt = Math.min(0.05, (now - this.truoc) / 1000); this.truoc = now
    const c = this.c, c2 = this.c2, tl = this.tiLe
    c.setTransform(tl, 0, 0, tl, 0, 0); c2.setTransform(tl, 0, 0, tl, 0, 0)
    c.clearRect(0, 0, 1920, 1080); c2.clearRect(0, 0, 1920, 1080)
    const cn = this.canh, nhanh = this.yeu ? 1 : Math.min(1, dt * 4)
    if (cn.loai === 'binh') {
      this.mucHien += (cn.muc - this.mucHien) * nhanh
      if (!this.yeu) {
        if (Math.random() < 0.25 + this.mucHien * 0.6) this.bot.push({ x: BINH.x + (Math.random() - 0.5) * BINH.r * 1.4, y: BINH.y + BINH.r - 6, r: 2 + Math.random() * 5, v: 40 + Math.random() * 80 })
        const mY = this.mucBinh()
        this.bot.forEach((b) => { b.y -= b.v * dt; b.x += Math.sin(now * 0.004 + b.r) * 0.3 }); this.bot = this.bot.filter((b) => b.y > mY + 4)
      }
      this.veBinh(now, cn.con)
    } else if (cn.loai === 'ong') {
      const p = kep((now - cn.mo0) / 2600)
      if (!this.yeu && p < 0.3) this.veBinh(now, null, 1 - kep(p / 0.28), this.mucHien * (1 - kep(p / 0.5)))
      this.veOng(cn, now, dt)
    } else if (cn.loai === 'lua') {
      const max = Math.max(1, ...cn.giaTri)
      cn.giaTri.forEach((g, d) => {
        this.luaHien[d] = (this.luaHien[d] ?? 0) + (g - (this.luaHien[d] ?? 0)) * (this.yeu ? 1 : Math.min(1, dt * 2.2))
        const x = cn.x[d]!, h = cn.nen + (cn.cao * Math.max(0, this.luaHien[d]!)) / max
        c.fillStyle = moMau(this.mau.chu, 0.2); c.fillRect(x - 60, cn.day + 40, 120, 14)
        c.fillStyle = moMau(this.mau.chu, 0.5); c.fillRect(x - 13, cn.day, 26, 42)
        c.fillStyle = moMau(this.mau.chu, 0.75); c.fillRect(x - 18, cn.day - 6, 36, 8)
        this.veLua(cn.x[d]!, cn.day - 6, h, this.mau.doi[d]!, now, d)
      })
    }
    if (this.phaoRoi && !this.yeu && Math.random() < 0.5) {
      const m = [this.mau.dung, this.mau.tin, this.mau.sao, this.mau.hs][Math.floor(Math.random() * 4)]!
      this.manh.push({ x: Math.random() * 1920, y: -20, vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 120, q: Math.random() * 6, vq: (Math.random() - 0.5) * 4, s: 7 + Math.random() * 9, tuoi: 0, song: 7, mau: m, nang: 0.02 })
    }
    this.veHat(c2, now); this.veManh(c2, dt)
  }

  private duongBinh(): void {
    const c = this.c, { x, y, r, co } = BINH, dy = Math.sqrt(r * r - co * co)
    c.beginPath(); c.moveTo(x - co, BINH.mieng); c.lineTo(x - co, y - dy); c.arc(x, y, r, Math.atan2(-dy, -co), Math.atan2(-dy, co), true); c.lineTo(x + co, BINH.mieng)
  }
  private veBinh(now: number, con: number | null, alpha = 1, muc = this.mucHien): void {
    const c = this.c, b = BINH, M = this.mau
    c.save(); c.globalAlpha = alpha
    if (con != null) {
      const a0 = -Math.PI / 2 + 0.36, a1 = -Math.PI / 2 - 0.36 + Math.PI * 2
      c.lineCap = 'round'; c.lineWidth = 12; c.strokeStyle = moMau(M.vien, 0.6)
      c.beginPath(); c.arc(b.x, b.y, b.r + 30, a0, a1); c.stroke()
      c.strokeStyle = M.tin
      if (!this.yeu) { c.shadowColor = M.tin; c.shadowBlur = 18 }
      c.beginPath(); c.arc(b.x, b.y, b.r + 30, a0, ghep(a0, a1, kep(con))); c.stroke(); c.shadowBlur = 0
    }
    this.duongBinh(); c.closePath(); c.save(); c.clip()
    c.fillStyle = moMau(M.mat, 0.5); c.fillRect(b.x - b.r, b.mieng, b.r * 2, b.r * 2 + 120)
    const dayY = b.y + b.r, mY = ghep(dayY, b.y - b.r * 0.78, kep(muc))
    const g = c.createLinearGradient(0, mY, 0, dayY); g.addColorStop(0, M.tin); g.addColorStop(1, M.hs)
    c.fillStyle = g; c.beginPath(); c.moveTo(b.x - b.r - 4, dayY + 4)
    for (let xx = b.x - b.r - 4; xx <= b.x + b.r + 4; xx += 8) c.lineTo(xx, mY + (this.yeu ? 0 : Math.sin(xx * 0.03 + now * 0.0025) * 6 + Math.sin(xx * 0.071 - now * 0.0017) * 3))
    c.lineTo(b.x + b.r + 4, dayY + 4); c.closePath(); c.fill()
    if (!this.yeu) for (const bt of this.bot) { c.fillStyle = moMau(M.giay, 0.55); c.beginPath(); c.arc(bt.x, bt.y, bt.r, 0, Math.PI * 2); c.fill() }
    c.restore()
    c.lineJoin = 'round'; c.lineWidth = 7; c.strokeStyle = moMau(M.chu, 0.75); this.duongBinh(); c.stroke()
    c.lineWidth = 9; c.beginPath(); c.moveTo(b.x - b.co - 14, b.mieng); c.lineTo(b.x + b.co + 14, b.mieng); c.stroke()
    c.lineWidth = 6; c.strokeStyle = moMau(M.giay, 0.35); c.beginPath(); c.arc(b.x, b.y, b.r - 24, Math.PI * 0.95, Math.PI * 1.32); c.stroke()
    c.restore()
  }
  private veOng(cn: Extract<CanhBang, { loai: 'ong' }>, now: number, dt: number): void {
    const c = this.c, M = this.mau, p = this.yeu ? 1 : kep((now - cn.mo0) / 2600)
    cn.ong.forEach((o, i) => {
      const dich = this.yeu || p > 0.35 ? o.h : 0
      this.ongHien[i] = (this.ongHien[i] ?? 0) + (dich - (this.ongHien[i] ?? 0)) * (this.yeu ? 1 : Math.min(1, dt * 3))
      const rise = this.yeu ? 1 : deo(kep((p - 0.05) / 0.3))
      const top = (o.top ?? 150) + (1 - rise) * 120, day = (o.day ?? 640) + (1 - rise) * 120, w = o.w, x = o.x
      const doi = this.yeu ? 1 : kep((p - 0.7) / 0.14), hien = o.dung && (this.yeu || p > 0.7)
      const mau = o.dung ? tronMau(o.mau, M.dung, doi) : p > 0.7 || this.yeu ? tronMau(o.mau, M.vien, doi * 0.75) : o.mau
      c.save(); c.globalAlpha = rise
      c.save(); c.beginPath(); c.moveTo(x - w / 2, top); c.lineTo(x - w / 2, day - w / 2); c.arc(x, day - w / 2, w / 2, Math.PI, 0, true); c.lineTo(x + w / 2, top); c.closePath(); c.clip()
      const h = this.ongHien[i]! * (day - top - 24) * 0.9
      if (h > 0) {
        c.fillStyle = mau; c.fillRect(x - w / 2, day - h, w, h + 2)
        c.fillStyle = moMau(M.giay, 0.35); c.fillRect(x - w / 2, day - h, w, 5)
      }
      c.restore()
      c.lineWidth = hien ? 7 : 5; c.strokeStyle = hien ? M.dung : moMau(M.chu, 0.7)
      if (hien && !this.yeu) { c.shadowColor = M.dung; c.shadowBlur = 26 }
      c.beginPath(); c.moveTo(x - w / 2 - 8, top); c.lineTo(x - w / 2, top + 8); c.lineTo(x - w / 2, day - w / 2); c.arc(x, day - w / 2, w / 2, Math.PI, 0, true); c.lineTo(x + w / 2, top + 8); c.lineTo(x + w / 2 + 8, top); c.stroke()
      c.shadowBlur = 0; c.restore()
    })
  }
  private veLua(x: number, y: number, h: number, mau: string, now: number, k: number): void {
    const c = this.c, rung = this.yeu ? 1 : 1 + Math.sin(now * 0.012 + k) * 0.04 + Math.sin(now * 0.027 + k * 2) * 0.03
    const H = h * rung, W = Math.min(120, 50 + h * 0.13)
    c.save(); if (!this.yeu) { c.shadowColor = mau; c.shadowBlur = 50 }
    const g = c.createLinearGradient(0, y - H, 0, y); g.addColorStop(0, moMau(mau, 0)); g.addColorStop(0.28, moMau(mau, 0.8)); g.addColorStop(0.82, mau); g.addColorStop(1, this.mau.giay)
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y - H)
    c.bezierCurveTo(x + W * 0.25, y - H * 0.6, x + W * 0.62, y - H * 0.3, x + W * 0.5, y - H * 0.08); c.quadraticCurveTo(x + W * 0.4, y, x, y)
    c.quadraticCurveTo(x - W * 0.4, y, x - W * 0.5, y - H * 0.08); c.bezierCurveTo(x - W * 0.62, y - H * 0.3, x - W * 0.25, y - H * 0.6, x, y - H); c.fill()
    c.shadowBlur = 0
    const g2 = c.createLinearGradient(0, y - H * 0.45, 0, y); g2.addColorStop(0, moMau(this.mau.giay, 0)); g2.addColorStop(1, moMau(this.mau.giay, 0.85))
    c.fillStyle = g2; c.beginPath(); c.moveTo(x, y - H * 0.45); c.quadraticCurveTo(x + W * 0.22, y - H * 0.12, x, y); c.quadraticCurveTo(x - W * 0.22, y - H * 0.12, x, y - H * 0.45); c.fill()
    c.restore()
    if (!this.yeu && Math.random() < 0.5) this.manh.push({ x: x + (Math.random() - 0.5) * W * 0.5, y: y - H * 0.7, vx: (Math.random() - 0.5) * 40, vy: -120 - Math.random() * 120, q: 0, vq: 3, s: 4 + Math.random() * 4, tuoi: 0, song: 0.9, mau, nang: -0.1 })
  }
  private veHat(c: CanvasRenderingContext2D, now: number): void {
    for (let k = this.hat.length - 1; k >= 0; k--) {
      const h = this.hat[k]!, t = (now - h.t0) / h.d
      if (t < 0) continue
      if (t >= 1) { this.hat.splice(k, 1); h.xong?.(); continue }
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, u = 1 - e, p = h.p
      const x = u * u * u * p[0]! + 3 * u * u * e * p[2]! + 3 * u * e * e * p[4]! + e * e * e * p[6]!
      const y = u * u * u * p[1]! + 3 * u * u * e * p[3]! + 3 * u * e * e * p[5]! + e * e * e * p[7]!
      h.vet.push([x, y]); if (h.vet.length > 22) h.vet.shift()
      // SAO CHỔI màu đội: đuôi thuôn cộng sáng (lighter — chồng lên nhau thành dải sáng mịn), đầu là lõi trắng + quầng màu.
      c.save(); c.globalCompositeOperation = 'lighter'
      const n = h.vet.length
      for (let j = 0; j < n; j++) { const [vx, vy] = h.vet[j]!, q = (j + 1) / n; c.fillStyle = moMau(h.mau, q * 0.32); c.beginPath(); c.arc(vx, vy, 2 + q * 11, 0, Math.PI * 2); c.fill() }
      c.fillStyle = moMau(h.mau, 0.35); c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.fill()
      c.fillStyle = moMau(h.mau, 0.6); c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill()
      c.restore()
      c.fillStyle = this.mau.giay; c.beginPath(); c.arc(x, y, 6.5, 0, Math.PI * 2); c.fill()
      if (Math.random() < 0.55) this.sao.push({ x: x + (Math.random() - 0.5) * 14, y: y + (Math.random() - 0.5) * 14, vx: (Math.random() - 0.5) * 50, vy: 20 + Math.random() * 40, tuoi: 0, song: 0.45 + Math.random() * 0.4, s: 3 + Math.random() * 5, mau: Math.random() < 0.5 ? this.mau.giay : h.mau, pha: Math.random() * 6 })
    }
    this.veSao(c, now)
  }
  /** Sao bốn cánh lấp lánh (nhấp nháy theo pha) + gợn sóng sáng ở miệng bình. */
  private veSao(c: CanvasRenderingContext2D, now: number): void {
    const dt = 1 / 60
    c.save(); c.globalCompositeOperation = 'lighter'
    for (let k = this.sao.length - 1; k >= 0; k--) {
      const m = this.sao[k]!; m.tuoi += dt
      if (m.tuoi > m.song) { this.sao.splice(k, 1); continue }
      m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= 0.96; m.vy = m.vy * 0.96 + 30 * dt
      const a = (1 - m.tuoi / m.song) * (0.6 + 0.4 * Math.sin(now * 0.025 + m.pha)), r = m.s * (0.7 + 0.3 * Math.sin(now * 0.02 + m.pha))
      c.fillStyle = moMau(m.mau, a)
      c.beginPath(); c.moveTo(m.x, m.y - r); c.quadraticCurveTo(m.x, m.y, m.x + r, m.y); c.quadraticCurveTo(m.x, m.y, m.x, m.y + r); c.quadraticCurveTo(m.x, m.y, m.x - r, m.y); c.quadraticCurveTo(m.x, m.y, m.x, m.y - r); c.fill()
    }
    for (let k = this.gon.length - 1; k >= 0; k--) {
      const g = this.gon[k]!, t = (now - g.t0) / 700
      if (t >= 1) { this.gon.splice(k, 1); continue }
      c.strokeStyle = moMau(g.mau, (1 - t) * 0.7); c.lineWidth = 6 * (1 - t) + 1
      c.beginPath(); c.ellipse(g.x, g.y, 30 + t * 120, 10 + t * 34, 0, 0, Math.PI * 2); c.stroke()
    }
    c.restore()
  }
  private veManh(c: CanvasRenderingContext2D, dt: number): void {
    for (let k = this.manh.length - 1; k >= 0; k--) {
      const m = this.manh[k]!; m.tuoi += dt
      if (m.tuoi > m.song) { this.manh.splice(k, 1); continue }
      m.vy += 900 * dt * m.nang; m.x += m.vx * dt; m.y += m.vy * dt; m.q += m.vq * dt
      c.save(); c.translate(m.x, m.y); c.rotate(m.q); c.globalAlpha = 1 - m.tuoi / m.song
      c.fillStyle = m.mau; c.beginPath(); c.moveTo(0, -m.s); c.lineTo(m.s * 0.62, 0); c.lineTo(0, m.s); c.lineTo(-m.s * 0.62, 0); c.closePath(); c.fill()
      c.fillStyle = moMau(this.mau.giay, 0.6); c.beginPath(); c.moveTo(0, -m.s); c.lineTo(m.s * 0.62, 0); c.lineTo(0, 0); c.closePath(); c.fill()
      c.restore()
    }
    if (this.manh.length > 600) this.manh.splice(0, this.manh.length - 600)
  }
}
