// TRÌNH VẼ MỘT KHUNG của bản «Trang vở». Nhẹ: nền = MỘT ô mẫu 256 × 256 lặp (createPattern), vùng ngoài vòng = ô mẫu gạch chéo 24 × 24; mọi vật thể là
// ảnh nướng sẵn; KHÔNG shadowBlur, KHÔNG filter, KHÔNG gradient tạo mỗi khung, KHÔNG phủ 'lighter'.
import type { BanDo, Vong } from '../../src/lib/live-khoi/sinh-ton-loi'
import { mau, pha, type Bang } from './bang'
import { HINH_MA, MA_OX, MA_OY, SUNG_DAI, loaiTuong, mauHop, nuongBui, nuongGiayVo, nuongHop, nuongLua, nuongMa, nuongMaMuc, nuongSao, nuongSung, nuongVat, nuongVetMuc, nuongVuongMien, type KieuMa, type LoaiHop } from './hinh'
import { dat, duong, type Anh, type G } from './net'

export interface NvVe {
  id: string; x: number; y: number; doi: number; cap: number; mau: number; ten: string; goc: number
  toi?: boolean; may?: boolean; an?: boolean; ban?: boolean; truyNa?: boolean; danhHieu?: string; noi?: string; khien?: boolean; kieu?: KieuMa; to?: number
  /** Đang hiện ra (0..1): «dau» = vào trận đầu ván, «song» = sống lại. `batTu` = còn bất tử sau khi hiện. */
  hien?: { p: number; kieu: 'dau' | 'song' }; batTu?: boolean
}
export interface Dan { x1: number; y1: number; x2: number; y2: number; cap: number; doi: number; t: number }
export type Hieu =
  | { k: 'muc'; x: number; y: number; doi: number; bien: number; a: number }
  | { k: 'so'; x: number; y: number; chu: string; a: number; mau?: 'sai' | 'dung' | 'sao' }
  | { k: 'vo'; x: number; y: number; a: number }
export interface Canh {
  bd: BanDo; b: Bang; W: number; H: number; dpr: number; ti: number; camX: number; camY: number; luc: number
  nv: NvVe[]; dan: Dan[]; hieu: Hieu[]; vong: Vong; hop?: { loai: LoaiHop; x: number; y: number }; boss?: { x: number; y: number }
}

const MA_W_S = 70, MA_H_S = 84
/** Chỉ để ĐO: ?bo=trai,gach,ma,nen bỏ từng lớp xem lớp nào nặng. */
const BO = new Set((new URLSearchParams(location.search).get('bo') ?? '').split(','))
/** Bộ hình theo (bảng màu, k) — nướng lười từng hình lần đầu cần. */
export class BoHinh {
  private nho = new Map<string, Anh>()
  constructor(readonly b: Bang, readonly k: number) {}
  private lay(khoa: string, tao: () => Anh): Anh { let a = this.nho.get(khoa); if (!a) { a = tao(); this.nho.set(khoa, a) } return a }
  ma(doi: number, trai: boolean, khung: number, kieu: KieuMa = {}): Anh { return this.lay(`ma${doi}${+trai}${khung}${kieu.mu ?? ''}${kieu.ao ?? ''}${kieu.thay ? 't' : ''}`, () => nuongMa(this.b, this.k * (kieu.thay ? 2.2 : 1), doi, trai, khung, kieu)) }
  sung(doi: number, cap: number, butDo = false): Anh { return this.lay(`s${doi}${cap}${+butDo}`, () => nuongSung(this.b, this.k * (butDo ? 2.2 : 1), doi, cap, { butDo })) }
  vat(loai: string, w: number, h: number): Anh { return this.lay(`v${loai}${w}x${h}`, () => nuongVat(this.b, this.k, loai as never, w, h, w * 7 + h)) }
  bui(w: number, h: number): Anh { return this.lay(`b${w}x${h}`, () => nuongBui(this.b, this.k, w, h, w + h)) }
  hop(l: LoaiHop): Anh { return this.lay(`h${l}`, () => nuongHop(this.b, this.k, l)) }
  vet(doi: number, bien: number): Anh { return this.lay(`m${doi}${bien}`, () => nuongVetMuc(this.b, this.k, doi, bien * 2.3 + doi)) }
  vo(): Anh { return this.lay('vo', () => nuongGiayVo(this.b, this.k)) }
  lua(doi: number): Anh { return this.lay(`l${doi}`, () => nuongLua(this.b, this.k, doi)) }
  vuong(): Anh { return this.lay('vm', () => nuongVuongMien(this.b, this.k)) }
  sao(doi: number): Anh { return this.lay(`sao${doi}`, () => nuongSao(this.b, this.k, this.b.doi[doi])) }
  maMuc(khung: number): Anh { return this.lay(`mm${khung}`, () => nuongMaMuc(this.b, this.k, khung)) }
}

// ── Nền: ô mẫu trang vở ô li (sáng) / bảng phấn (tối) ──
const O_MAU = 256
function oMau(b: Bang, k: number): HTMLCanvasElement {
  const c = document.createElement('canvas'), n = Math.round(O_MAU * k)
  c.width = c.height = n
  const g = c.getContext('2d')!
  g.scale(n / O_MAU, n / O_MAU)
  g.fillStyle = mau(b.giay); g.fillRect(0, 0, O_MAU, O_MAU)
  if (!b.toi) {
    g.beginPath(); for (let y = 8; y <= O_MAU; y += 8) if (y % 32) { g.moveTo(0, y - 0.5); g.lineTo(O_MAU, y - 0.5) } g.strokeStyle = mau(b.ke); g.lineWidth = 0.7; g.stroke()
    g.beginPath(); for (let v = 32; v <= O_MAU; v += 32) { g.moveTo(0, v - 0.5); g.lineTo(O_MAU, v - 0.5); g.moveTo(v - 0.5, 0); g.lineTo(v - 0.5, O_MAU) } g.strokeStyle = mau(b.keDam); g.lineWidth = 1; g.stroke()
  } else {
    g.beginPath(); for (let v = 32; v <= O_MAU; v += 32) { g.moveTo(0, v - 0.5); g.lineTo(O_MAU, v - 0.5); g.moveTo(v - 0.5, 0); g.lineTo(v - 0.5, O_MAU) } g.strokeStyle = mau(v64(b)); g.lineWidth = 1; g.stroke()
  }
  return c
}
const v64 = (b: Bang) => b.ke
function oGach(b: Bang, k: number): HTMLCanvasElement {
  const c = document.createElement('canvas'), s = 24, n = Math.round(s * k)
  c.width = c.height = n
  const g = c.getContext('2d')!
  g.scale(n / s, n / s)
  g.fillStyle = mau(b.toi ? b.bong : b.muc, b.toi ? 0.3 : 0.05); g.fillRect(0, 0, s, s)
  g.beginPath(); g.moveTo(-2, s + 2); g.lineTo(s + 2, -2); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(s - 2, s + 2); g.lineTo(s + 2, s - 2)
  g.strokeStyle = mau(b.sai, b.toi ? 0.4 : 0.32); g.lineWidth = 1.6; g.stroke()
  return c
}

export class TrinhVe {
  readonly hinh: BoHinh
  private nen: CanvasPattern
  private gach: CanvasPattern
  private kNen: number
  constructor(private g: G, readonly b: Bang, readonly k: number) {
    this.hinh = new BoHinh(b, k)
    this.kNen = k
    this.nen = g.createPattern(oMau(b, k), 'repeat')!
    this.gach = g.createPattern(oGach(b, k), 'repeat')!
  }

  ve(c: Canh): void {
    const { g, b } = this, { W, H, dpr, ti, camX, camY, bd, luc } = c
    const ox = W / 2 - camX * ti, oy = H / 2 - camY * ti
    const the = (x: number, y: number) => g.setTransform(dpr * ti, 0, 0, dpr * ti, dpr * (ox + x * ti), dpr * (oy + y * ti))
    // ngoài trang: mặt bàn tối hơn
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.fillStyle = mau(b.ban); g.fillRect(0, 0, W, H)
    the(0, 0)
    const x0 = camX - W / 2 / ti, y0 = camY - H / 2 / ti, x1 = camX + W / 2 / ti, y1 = camY + H / 2 / ti
    // bóng tờ giấy + nền ô li
    g.fillStyle = mau(b.bong, b.bongA * 1.4); g.fillRect(8, 10, bd.rong, bd.cao)
    // Nền ô mẫu tô theo ĐIỂM ẢNH THIẾT BỊ (ô mẫu đã nướng đúng cỡ, chỉ dời nguyên điểm ảnh ⇒ trình duyệt không phải co giãn mẫu mỗi khung — lớp này
    // từng chiếm phần lớn thời gian vẽ: CPU ×4 từ 24 lên 55 khung / giây khi bỏ hẳn).
    {
      const k = dpr * ti, px = Math.round(dpr * ox), py = Math.round(dpr * oy)
      g.setTransform(1, 0, 0, 1, 0, 0)
      this.nen.setTransform(new DOMMatrix([1, 0, 0, 1, px, py]))
      const ax = Math.max(0, Math.round(px + Math.max(0, x0) * k)), ay = Math.max(0, Math.round(py + Math.max(0, y0) * k))
      const bx = Math.min(W * dpr, Math.round(px + Math.min(bd.rong, x1) * k)), by = Math.min(H * dpr, Math.round(py + Math.min(bd.cao, y1) * k))
      g.fillStyle = this.nen; if (!BO.has('nen')) g.fillRect(ax, ay, bx - ax, by - ay)
      the(0, 0)
    }
    // lề đỏ hai trang + gáy vở ở giữa mỗi khu 1600 × 1000
    const khuW = bd.rong / Math.max(1, Math.round(bd.rong / (bd.cap === 1 ? 2400 : 1600))), khuH = bd.cao / Math.max(1, Math.round(bd.cao / (bd.cap === 1 ? 1500 : 1000)))
    g.beginPath()
    for (let kx = 0; kx < bd.rong; kx += khuW) for (const t of [0.06, 0.56]) { const x = kx + khuW * t; if (x > x0 - 10 && x < x1 + 10) { g.moveTo(x, Math.max(0, y0)); g.lineTo(x, Math.min(bd.cao, y1)); g.moveTo(x + 5, Math.max(0, y0)); g.lineTo(x + 5, Math.min(bd.cao, y1)) } }
    g.strokeStyle = mau(b.le, 0.85); g.lineWidth = 1.4; g.stroke()
    for (let kx = 0; kx < bd.rong; kx += khuW) {
      const x = kx + khuW / 2
      if (x < x0 - 40 || x > x1 + 40) continue
      g.fillStyle = mau(b.bong, b.bongA * 0.55); g.fillRect(x - 14, Math.max(0, y0), 28, Math.min(bd.cao, y1) - Math.max(0, y0))
      g.fillStyle = mau(b.bong, b.bongA * 0.7); g.fillRect(x - 4, Math.max(0, y0), 8, Math.min(bd.cao, y1) - Math.max(0, y0))
      g.beginPath(); for (let ky = 0; ky < bd.cao; ky += khuH) for (let y = ky + 60; y < ky + khuH - 40; y += 90) if (y > y0 - 20 && y < y1 + 20) { g.moveTo(x - 3, y); g.lineTo(x + 3, y + 22) }
      g.strokeStyle = mau(b.muc, 0.45); g.lineWidth = 2; g.stroke()
    }
    g.strokeStyle = mau(b.muc, 0.35); g.lineWidth = 2; g.strokeRect(0, 0, bd.rong, bd.cao)
    if (!BO.has('trai')) this.trai(bd, x0, y0, x1, y1, khuW, khuH)

    const trong = (x: number, y: number, r: number) => x > x0 - r && x < x1 + r && y > y0 - r && y < y1 + r
    const h = this.hinh
    // vết mực (dưới mọi thứ)
    for (const e of c.hieu) if (e.k === 'muc' && trong(e.x, e.y, 30)) { g.globalAlpha = e.a; dat(g, h.vet(e.doi, e.bien), e.x, e.y); g.globalAlpha = 1 }
    // vật chặn (kèm bóng nướng sẵn)
    const vat: [number, () => void][] = []
    bd.tuong.forEach((t, i) => { if (trong(t.x + t.w / 2, t.y + t.h / 2, Math.max(t.w, t.h))) vat.push([t.y + t.h, () => dat(g, h.vat(loaiTuong(t.w, t.h, i), t.w, t.h), t.x, t.y)]) })
    for (const t of bd.thung) if (trong(t.x + t.w / 2, t.y + t.h / 2, t.w)) vat.push([t.y + t.h, () => dat(g, h.vat('tay', t.w, t.h), t.x, t.y)])
    vat.sort((a, c2) => a[0] - c2[0]); for (const [, f] of vat) f()
    // hộp tiếp tế + vòng nhặt nhấp nháy bằng nét đứt
    if (c.hop) {
      const nhip = (luc / 600) % 1
      g.beginPath(); g.ellipse(c.hop.x, c.hop.y + 4, 36 + nhip * 6, 22 + nhip * 4, 0, 0, Math.PI * 2); g.setLineDash([6, 6]); g.strokeStyle = mau(mauHop(b, c.hop.loai), 0.9 - nhip * 0.6); g.lineWidth = 2.4; g.stroke(); g.setLineDash([])
      dat(g, h.hop(c.hop.loai), c.hop.x, c.hop.y - 4 - Math.sin(luc / 300) * 2)
    }
    if (c.boss) { g.beginPath(); g.ellipse(c.boss.x, c.boss.y, 92, 26, 0, 0, Math.PI * 2); g.fillStyle = mau(b.bong, b.bongA * 1.6); g.fill(); dat(g, h.maMuc(Math.floor(luc / 160) % 2), c.boss.x, c.boss.y - 8 - Math.sin(luc / 400) * 4) }
    // bóng dưới bé ma (lơ lửng)
    for (const n of c.nv) if (trong(n.x, n.y, 40) && n.mau > 0) { const s = n.to ?? 1; g.beginPath(); g.ellipse(n.x, n.y + 2, 15 * s, 5 * s, 0, 0, Math.PI * 2); g.fillStyle = mau(b.bong, b.bongA * 1.3); g.fill() }
    // đạn
    for (const d of c.dan) this.dan(d, luc)
    // bé ma (bị hạ ⇒ cục giấy vo)
    const tg = [...c.nv].sort((a, b2) => a.y - b2.y)
    if (!BO.has('ma')) for (const n of tg) if (trong(n.x, n.y, 60 * (n.to ?? 1))) { if (n.hien) this.hienRa(n, luc); else this.ma(n, luc, false) }
    // bụi phủ lên trên (bé ma trốn trong bụi bị che)
    for (const t of bd.bui) if (trong(t.x + t.w / 2, t.y + t.h / 2, Math.max(t.w, t.h))) dat(g, h.bui(t.w, t.h), t.x, t.y)
    // em đang trốn trong bụi: vẽ lại mờ để em vẫn thấy mình
    for (const n of tg) if (n.toi && n.an) this.ma(n, luc, true)
    // ngoài vòng an toàn: gạch chéo bút đỏ + viền nét đứt
    const v = c.vong
    { // gạch chéo ngoài vòng: cũng tô theo điểm ảnh thiết bị (đường elip đổi sang toạ độ màn)
      const k = dpr * ti, px = Math.round(dpr * ox), py = Math.round(dpr * oy)
      g.setTransform(1, 0, 0, 1, 0, 0); g.beginPath(); g.rect(0, 0, W * dpr, H * dpr); g.ellipse(px + v.cx * k, py + v.cy * k, v.rx * k, v.ry * k, 0, 0, Math.PI * 2)
      this.gach.setTransform(new DOMMatrix([1, 0, 0, 1, px, py])); g.fillStyle = this.gach; if (!BO.has('gach')) g.fill('evenodd')
      the(0, 0)
    }
    g.beginPath(); g.ellipse(v.cx, v.cy, v.rx, v.ry, 0, 0, Math.PI * 2); g.setLineDash([16, 9]); g.lineDashOffset = -luc / 60; g.strokeStyle = mau(b.sai, 0.9); g.lineWidth = 3.2; g.stroke(); g.setLineDash([])
    // chữ nổi: số máu mất, «+1», cục giấy vo
    g.textAlign = 'center'
    for (const e of c.hieu) {
      if (e.k === 'vo' && trong(e.x, e.y, 30)) { g.globalAlpha = e.a; dat(g, h.vo(), e.x, e.y); g.globalAlpha = 1 }
      if (e.k === 'so' && trong(e.x, e.y, 40)) {
        const cm = e.mau === 'dung' ? b.dung : e.mau === 'sao' ? b.sao : b.sai
        g.font = `${e.chu.length > 4 ? 20 : 24}px "Patrick Hand", sans-serif`; g.lineWidth = 4; g.strokeStyle = mau(b.giay, 0.95 * e.a); g.strokeText(e.chu, e.x, e.y)
        g.fillStyle = mau(cm, e.a); g.fillText(e.chu, e.x, e.y)
      }
    }
    g.textAlign = 'start'
    g.setTransform(1, 0, 0, 1, 0, 0)
  }

  /** Trại bốn đội (vòng chì + tên) và công thức hoá học viết chì mờ trên trang — đúng chất vở Hoá. */
  private trai(bd: BanDo, x0: number, y0: number, x1: number, y1: number, khuW: number, khuH: number): void {
    const { g, b } = this
    const TEN = ['Trại Đội Natri', 'Trại Đội Kali', 'Trại Đội Đồng', 'Trại Đội Canxi']
    bd.trai.forEach((t, i) => {
      if (t.x < x0 - 120 || t.x > x1 + 120 || t.y < y0 - 120 || t.y > y1 + 120) return
      g.beginPath(); g.ellipse(t.x, t.y, 92, 64, 0, 0, Math.PI * 2); g.fillStyle = mau(b.doi[i], 0.09); g.fill()
      g.setLineDash([3, 5]); g.strokeStyle = mau(b.doi[i], 0.75); g.lineWidth = 2.2; g.stroke(); g.setLineDash([])
      g.font = '19px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.fillStyle = mau(b.doi[i], 0.9); g.fillText(TEN[i], t.x, t.y + (t.y < bd.cao / 2 ? 86 : -76)); g.textAlign = 'start'
    })
    const CT: [number, number, string][] = [[0.085, 0.045, '2Na + 2H₂O → 2NaOH + H₂↑'], [0.6, 0.045, '2K + 2H₂O → 2KOH + H₂↑'], [0.085, 0.975, 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag'], [0.6, 0.975, 'Ca + 2H₂O → Ca(OH)₂ + H₂↑'], [0.32, 0.975, 'CaCO₃ → CaO + CO₂↑ (t°)']]
    g.font = '20px "Patrick Hand", sans-serif'; g.fillStyle = mau(b.muc, b.toi ? 0.16 : 0.2)
    for (let kx = 0; kx < bd.rong; kx += khuW) for (let ky = 0; ky < bd.cao; ky += khuH) for (const [fx, fy, s] of CT) {
      const x = kx + fx * khuW, y = ky + fy * khuH
      if (x > x0 - 300 && x < x1 + 20 && y > y0 - 20 && y < y1 + 30) g.fillText(s, x, y)
    }
    // hình vẽ chơi bên lề: vòng benzen + bình tam giác + chùm sao
    g.strokeStyle = mau(b.muc, b.toi ? 0.18 : 0.22); g.lineWidth = 1.6
    for (let kx = 0; kx < bd.rong; kx += khuW) for (let ky = 0; ky < bd.cao; ky += khuH) {
      const bx = kx + khuW * 0.47, by = ky + khuH * 0.13, fx = kx + khuW * 0.53, fy = ky + khuH * 0.86
      if (bx > x0 - 40 && bx < x1 + 40 && by > y0 - 40 && by < y1 + 40) {
        g.beginPath(); for (let i = 0; i <= 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; const px = bx + Math.cos(a) * 22, py = by + Math.sin(a) * 22; if (i) g.lineTo(px, py); else g.moveTo(px, py) } g.stroke()
        g.beginPath(); g.arc(bx, by, 12, 0, Math.PI * 2); g.stroke()
      }
      if (fx > x0 - 40 && fx < x1 + 40 && fy > y0 - 60 && fy < y1 + 40) {
        g.beginPath(); g.moveTo(fx - 6, fy - 34); g.lineTo(fx - 6, fy - 16); g.lineTo(fx - 22, fy + 8); g.lineTo(fx + 22, fy + 8); g.lineTo(fx + 6, fy - 16); g.lineTo(fx + 6, fy - 34); g.stroke()
        g.beginPath(); g.moveTo(fx - 15, fy - 2); g.lineTo(fx + 15, fy - 2); g.stroke()
        for (const [dx, dy] of [[-4, -8], [5, -12], [0, -22]]) { g.beginPath(); g.arc(fx + dx, fy + dy, 2.4, 0, Math.PI * 2); g.stroke() }
      }
    }
  }

  /** Sáu kiểu đạn — vẽ bằng nét mỗi khung (rẻ), chỉ sao Pháo Sao là ảnh nướng sẵn. Mọi đạn có viền mực để nổi trên nền. */
  private dan(d: Dan, luc: number): void {
    const { g, b } = this, x = d.x1 + (d.x2 - d.x1) * d.t, y = d.y1 + (d.y2 - d.y1) * d.t
    const dx = d.x2 - d.x1, dy = d.y2 - d.y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, c = b.doi[d.doi], m = b.muc
    const P = (lui: number, ngang = 0): [number, number] => [x - ux * lui - uy * ngang, y - uy * lui + ux * ngang]
    const net = (w: number, cm: Parameters<typeof mau>[0], a = 1) => { g.strokeStyle = mau(cm, a); g.lineWidth = w; g.stroke() }
    const tron = (p: [number, number], r: number) => { g.beginPath(); g.arc(p[0], p[1], r, 0, Math.PI * 2) }
    g.lineCap = 'round'; g.lineJoin = 'round'
    if (d.cap === 1) { // Hạt mực: viên tròn + hai hạt kéo đuôi + vệt tốc độ
      for (const s of [-3, 3]) { g.beginPath(); g.moveTo(...P(7, s)); g.lineTo(...P(20, s)); net(1.4, m, 0.35) }
      for (const [lui, r, a] of [[16, 1.6, 0.35], [9, 2.3, 0.6]]) { tron(P(lui), r); g.fillStyle = mau(c, a); g.fill() }
      tron(P(0), 3.6); g.fillStyle = mau(c); g.fill(); net(1.4, m); tron(P(0.8, -1.2), 1.1); g.fillStyle = mau(b.giay, 0.9); g.fill()
    } else if (d.cap === 2) { // Song tia: hai vạch sáng song song + chấm lửa đầu tia
      for (const s of [-3.6, 3.6]) { g.beginPath(); g.moveTo(...P(14, s)); g.lineTo(...P(0, s)); net(5, m); net(3, c); g.beginPath(); g.moveTo(...P(10, s)); g.lineTo(...P(2, s)); net(1.2, b.giay, 0.8); tron(P(-1, s), 1.6); g.fillStyle = mau(b.sao); g.fill() }
    } else if (d.cap === 3) { // Bọt khí: bọt to rung rinh, ánh sáng bóng, hai bọt con theo sau
      const r = 7 + Math.sin(luc / 70 + d.x1) * 0.9
      for (const [lui, rr] of [[13, 2.6], [20, 1.7]]) { tron(P(lui, Math.sin(luc / 90 + lui) * 2), rr); g.fillStyle = mau(c, 0.25); g.fill(); net(1.1, c, 0.8) }
      g.beginPath(); g.ellipse(x, y, r * 1.08, r * 0.94, Math.atan2(uy, ux), 0, Math.PI * 2); g.fillStyle = mau(c, 0.28); g.fill(); net(2.2, m); net(1.2, c)
      g.beginPath(); g.arc(x - 2.2, y - 2.2, r * 0.55, Math.PI * 1.05, Math.PI * 1.6); net(1.8, b.giay, 0.95)
    } else if (d.cap === 4) { // Tia sấm: đường gấp khúc có nhánh, tóe điện ở mũi
      const nhay = Math.floor(luc / 60) % 2 ? 1 : -1
      g.beginPath(); for (let i = 0; i <= 6; i++) { const p = P(i * 5, (i % 2 ? 4.6 : -4.6) * nhay); if (i) g.lineTo(...p); else g.moveTo(...p) }
      net(5.4, m); net(3, b.sao); net(1, b.giay, 0.9)
      g.beginPath(); g.moveTo(...P(10, 4.6 * nhay)); g.lineTo(...P(15, 11 * nhay)); g.lineTo(...P(18, 8 * nhay)); net(3.4, m); net(1.6, b.sao)
      for (const a of [-0.9, 0, 0.9]) { g.beginPath(); g.moveTo(...P(-2)); g.lineTo(x + Math.cos(Math.atan2(uy, ux) + a) * 7, y + Math.sin(Math.atan2(uy, ux) + a) * 7); net(1.6, b.sao) }
    } else if (d.cap === 5) { // Cầu lửa màu: đầu tròn màu ngọn lửa của nguyên tố đội, lõi vàng, ba lưỡi lửa lập loè, tàn lửa
      const lo = Math.sin(luc / 45 + d.y1) * 2
      g.beginPath(); g.moveTo(...P(-6)); g.quadraticCurveTo(...P(4, 9), ...P(18 + lo, 6)); g.quadraticCurveTo(...P(10, 2), ...P(24 - lo, 0)); g.quadraticCurveTo(...P(10, -2), ...P(18 + lo, -6)); g.quadraticCurveTo(...P(4, -9), ...P(-6))
      g.fillStyle = mau(c, 0.92); g.fill(); net(1.6, m, 0.9)
      tron(P(0), 3.6); g.fillStyle = mau(b.sao); g.fill(); tron(P(-0.5, -1), 1.3); g.fillStyle = mau(b.giay); g.fill()
      for (const [lui, ng] of [[26, 4], [31, -3]]) { tron(P(lui + lo, ng), 1.4); g.fillStyle = mau(b.sao, 0.8); g.fill() }
    } else { // Pháo Sao: sao lớn xoay + đuôi sao nhỏ + vòng lấp lánh
      const s = this.hinh.sao(d.doi)
      for (const [lui, k2, a] of [[30, 0.4, 0.4], [20, 0.55, 0.55], [11, 0.75, 0.75]]) { g.globalAlpha = a; const p = P(lui, Math.sin(lui + luc / 80) * 3); dat(g, s, p[0], p[1], k2); g.globalAlpha = 1 }
      g.save(); g.translate(x, y); g.rotate(luc / 110); dat(g, s, 0, 0, 1.25); g.restore()
      for (let i = 0; i < 4; i++) { const a = luc / 200 + (i * Math.PI) / 2; g.beginPath(); g.moveTo(x + Math.cos(a) * 15, y + Math.sin(a) * 15); g.lineTo(x + Math.cos(a) * 19, y + Math.sin(a) * 19); net(1.8, b.sao) }
    }
    g.lineCap = 'butt'
  }

  /** HIỆN RA kiểu «được vẽ ra từ nét bút» (vào trận) / «giấy vo mở ra rồi vẽ lại» (sống lại):
   *  nét chì chạy quanh viền → bút dạ quét màu → bung vòng mực + giấy hoa + sao. Toàn nét vẽ mỗi khung, không ảnh mới. */
  private hienRa(n: NvVe, luc: number): void {
    const { g, b } = this, h = this.hinh, s = n.to ?? 1, c = b.doi[n.doi], hr = n.hien!
    const y = n.y - 6, ox = n.x - MA_OX * s, oy = y - MA_OY * s
    let p = hr.p
    if (hr.kieu === 'song') {
      if (p < 0.25) { const q = p / 0.25; g.save(); g.translate(n.x, y - 24); g.rotate(q * 2.4); g.scale(1 + q * 1.5, 1 + q * 1.1); g.globalAlpha = 1 - q * 0.5; dat(g, h.vo(), 0, 0, 1.4); g.restore() }
      p = (p - 0.2) / 0.8
    }
    if (p <= 0) return
    const pts = HINH_MA.map(([x, yy]) => [ox + x * s, oy + yy * s] as [number, number])
    let dai = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], bb = pts[(i + 1) % pts.length]; dai += Math.hypot(bb[0] - a[0], bb[1] - a[1]) }
    const buChi = (q: number) => { // cây bút chì nhỏ ở đầu nét
      let con = dai * q, i = 0
      for (; i < pts.length; i++) { const a = pts[i], bb = pts[(i + 1) % pts.length], d = Math.hypot(bb[0] - a[0], bb[1] - a[1]); if (con <= d) { const t = con / d; return [a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t] as [number, number] } con -= d }
      return pts[0]
    }
    const veButChi = (x: number, yy: number) => {
      g.save(); g.translate(x, yy); g.rotate(-0.8)
      g.fillStyle = mau(b.sao); g.fillRect(4, -3.5, 22, 7); g.fillStyle = mau(pha(b.sai, b.giay, 0.4)); g.fillRect(24, -3.5, 5, 7)
      g.beginPath(); g.moveTo(4, -3.5); g.lineTo(-4, 0); g.lineTo(4, 3.5); g.closePath(); g.fillStyle = mau(pha(b.sao, b.muc, 0.3)); g.fill()
      g.strokeStyle = mau(b.muc); g.lineWidth = 1.2; g.strokeRect(4, -3.5, 25, 7); g.stroke(); g.restore()
    }
    if (p < 0.4) {
      const q = p / 0.4
      duong(g, pts, true); g.setLineDash([dai * q, dai]); g.strokeStyle = mau(b.muc); g.lineWidth = 2.4; g.stroke(); g.setLineDash([])
      const tip = buChi(q); veButChi(tip[0], tip[1])
      for (let i = 0; i < 3; i++) { const a = luc / 80 + i * 2; g.fillStyle = mau(b.muc, 0.5); g.fillRect(tip[0] + Math.cos(a) * 6, tip[1] + Math.sin(a) * 6, 1.6, 1.6) }
    } else if (p < 0.75) {
      const q = (p - 0.4) / 0.35, w = MA_W_S * s
      duong(g, pts, true); g.strokeStyle = mau(b.muc); g.lineWidth = 2.4; g.stroke()
      g.save(); g.beginPath(); g.rect(ox, oy, w * q, MA_H_S * s); g.clip(); dat(g, h.ma(n.doi, Math.cos(n.goc) < 0, 0, n.kieu), n.x, y, s); g.restore()
      g.fillStyle = mau(c, 0.55); g.fillRect(ox + w * q - 5, oy + 8 * s, 10, 64 * s)
      g.fillStyle = mau(b.sao, 0.6); g.fillRect(ox + w * q - 1.5, oy + 10 * s, 3, 60 * s)
    } else {
      const q = (p - 0.75) / 0.25, bung = 1 + Math.sin(q * Math.PI) * 0.22
      dat(g, h.ma(n.doi, Math.cos(n.goc) < 0, 0, n.kieu), n.x, y, s * bung)
      g.beginPath(); g.ellipse(n.x, y - 30 * s, (24 + q * 74) * s, (16 + q * 50) * s, 0, 0, Math.PI * 2); g.setLineDash([10, 6]); g.strokeStyle = mau(c, 1 - q * 0.7); g.lineWidth = 7 * (1 - q) + 1.5; g.stroke(); g.setLineDash([])
      g.beginPath(); g.ellipse(n.x, y - 30 * s, (14 + q * 44) * s, (10 + q * 30) * s, 0, 0, Math.PI * 2); g.strokeStyle = mau(b.sao, 0.9 - q * 0.6); g.lineWidth = 3; g.stroke()
      const MAU_HOA = [c, b.sao, b.tin, b.sai]
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + 0.3, r = (26 + q * 70) * s; g.save(); g.translate(n.x + Math.cos(a) * r, y - 30 * s + Math.sin(a) * r * 0.75 + q * q * 18); g.rotate(a + q * 6); g.fillStyle = mau(MAU_HOA[i % 4], 1 - q * 0.5); g.fillRect(-4, -2, 8, 4); g.restore() }
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.8, r = (20 + q * 46) * s; dat(g, h.sao(n.doi), n.x + Math.cos(a) * r, y - 30 * s + Math.sin(a) * r * 0.7, 0.8) }
    }
    const chu = hr.kieu === 'song' ? 'Thi lại!' : 'Vào trận!'
    g.font = `${n.toi ? 22 : 18}px "Patrick Hand", sans-serif`; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = mau(b.giay); g.strokeText(chu, n.x, oy - 6); g.fillStyle = mau(hr.kieu === 'song' ? b.sao : c); g.fillText(chu, n.x, oy - 6); g.textAlign = 'start'
    g.font = `${n.toi ? 17 : 15}px "Patrick Hand", sans-serif`; g.textAlign = 'center'; g.fillStyle = mau(b.muc, 0.95); g.fillText(n.ten, n.x, y + 14 * s); g.textAlign = 'start'
  }

  private ma(n: NvVe, luc: number, moTrongBui: boolean): void {
    const { g, b } = this, h = this.hinh, s = n.to ?? 1
    if (n.mau <= 0) { dat(g, h.vo(), n.x, n.y - 8); return }
    const trai = Math.cos(n.goc) < 0, khung = Math.floor(luc / 150 + (n.id.charCodeAt(n.id.length - 1) % 2)) % 2
    const lo = Math.sin(luc / 260 + n.x) * 3
    if (moTrongBui) g.globalAlpha = 0.5
    else if (n.an) return
    const y = n.y - 6 + lo
    if (n.batTu) { const nhap = 0.55 + Math.sin(luc / 90) * 0.35; g.beginPath(); g.ellipse(n.x, y - 30 * s, 32 * s, 38 * s, 0, 0, Math.PI * 2); g.setLineDash([4, 5]); g.lineDashOffset = luc / 40; g.strokeStyle = mau(b.sao, nhap); g.lineWidth = 3; g.stroke(); g.setLineDash([]); g.font = '14px "Patrick Hand", sans-serif'; g.textAlign = 'center'; g.fillStyle = mau(b.sao); g.fillText('Bất tử 2 giây', n.x, y - 74 * s); g.textAlign = 'start' }
    if (n.khien) { g.beginPath(); g.ellipse(n.x, y - 30 * s, 30 * s, 34 * s, 0, 0, Math.PI * 2); g.fillStyle = mau(b.tin, 0.14); g.fill(); g.setLineDash([7, 5]); g.strokeStyle = mau(b.tin, 0.95); g.lineWidth = 2.4; g.stroke(); g.setLineDash([]) }
    dat(g, h.ma(n.doi, trai, khung, n.kieu), n.x, y, s)
    // súng xoay theo hướng ngắm, gắn ở tay phía trước
    const sung = h.sung(n.doi, n.cap, !!n.kieu?.thay), tx = n.x + (trai ? -12 : 12) * s, ty = y - 30 * s
    g.save(); g.translate(tx, ty); g.rotate(n.goc); if (trai) g.scale(1, -1)
    dat(g, sung, 0, 0, s)
    if (n.ban && (luc / 90) % 2 < 1) { const L = SUNG_DAI[n.cap - 1] * s; g.beginPath(); for (const a of [-0.5, 0, 0.5]) { g.moveTo(L + 2, 0); g.lineTo(L + 9 + Math.cos(a) * 4, Math.sin(a) * 7) } g.strokeStyle = mau(b.sao); g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke() }
    g.restore()
    if (n.toi) dat(g, h.lua(n.doi), n.x, y - 64 * s)
    if (n.truyNa) dat(g, h.vuong(), n.x, y - (n.toi ? 84 : 66) * s)
    // bảng tên + vạch máu
    const ty2 = y + 14 * s
    g.font = `${n.toi ? 17 : 15}px "Patrick Hand", sans-serif`; g.textAlign = 'center'
    const ten = n.ten + (n.danhHieu ? ` · ${n.danhHieu}` : ''), w = g.measureText(ten).width
    if (n.toi) { g.fillStyle = mau(b.sao, b.toi ? 0.4 : 0.55); g.fillRect(n.x - w / 2 - 4, ty2 - 13, w + 8, 17) }
    else if (n.doi === 0) { g.fillStyle = mau(b.doi[n.doi], 0.85); g.fillRect(n.x - w / 2, ty2 + 3, w, 1.6) }
    g.fillStyle = mau(n.truyNa ? b.sai : b.muc, 0.95); g.fillText(ten, n.x, ty2)
    const bw = 34 * Math.min(s, 1.6), by = ty2 + 6
    g.fillStyle = mau(b.giay, 0.9); g.fillRect(n.x - bw / 2, by, bw, 5)
    g.fillStyle = mau(n.mau < 35 ? b.sai : b.doi[n.doi]); g.fillRect(n.x - bw / 2, by, (bw * Math.max(0, Math.min(100, n.mau))) / 100, 5)
    g.strokeStyle = mau(b.muc, 0.8); g.lineWidth = 1; g.strokeRect(n.x - bw / 2, by, bw, 5)
    if (n.noi) {
      g.font = '15px "Patrick Hand", sans-serif'; const nw = g.measureText(n.noi).width + 16, nx = n.x + 18, ny = y - 78 * s
      g.beginPath(); g.roundRect(nx, ny - 18, nw, 26, 10); g.moveTo(nx + 8, ny + 8); g.lineTo(nx + 2, ny + 16); g.lineTo(nx + 16, ny + 8)
      g.fillStyle = mau(b.giay); g.fill(); g.strokeStyle = mau(b.muc); g.lineWidth = 1.6; g.stroke()
      g.fillStyle = mau(b.muc); g.textAlign = 'start'; g.fillText(n.noi, nx + 8, ny)
    }
    g.textAlign = 'start'; g.globalAlpha = 1
    void MA_OY
  }
}

/** Bản đồ nhỏ (vẽ trên tờ giấy nhớ). */
export function veBanDoNho(g: G, b: Bang, bd: BanDo, v: Vong, nv: NvVe[], rong: number, cao: number, dpr: number, them?: { boss?: { x: number; y: number } }): void {
  const ti = Math.min(rong / bd.rong, cao / bd.cao)
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, rong, cao)
  g.fillStyle = mau(b.muc, 0.5); for (const t of bd.chan) g.fillRect(t.x * ti, t.y * ti, Math.max(1, t.w * ti), Math.max(1, t.h * ti))
  g.fillStyle = mau(b.doi[2], 0.35); for (const t of bd.bui) g.fillRect(t.x * ti, t.y * ti, t.w * ti, t.h * ti)
  g.beginPath(); g.ellipse(v.cx * ti, v.cy * ti, v.rx * ti, v.ry * ti, 0, 0, Math.PI * 2); g.setLineDash([4, 3]); g.strokeStyle = mau(b.sai); g.lineWidth = 1.4; g.stroke(); g.setLineDash([])
  if (them?.boss) { g.beginPath(); g.arc(them.boss.x * ti, them.boss.y * ti, 6, 0, Math.PI * 2); g.fillStyle = mau(pha(b.hs, b.muc, 0.4)); g.fill() }
  for (const n of nv) {
    if (n.mau <= 0 || (n.an && !n.toi)) continue
    if (n.truyNa) { g.font = '13px sans-serif'; g.fillStyle = mau(b.sai); g.fillText('★', n.x * ti - 5, n.y * ti + 5); continue }
    if (!n.toi && n.doi !== 0 && !n.kieu?.thay) continue
    g.beginPath(); g.arc(n.x * ti, n.y * ti, n.toi ? 3.6 : n.kieu?.thay ? 5 : 2.4, 0, Math.PI * 2); g.fillStyle = mau(n.kieu?.thay ? b.hs : b.doi[n.doi]); g.fill()
    if (n.toi) { g.strokeStyle = mau(b.muc); g.lineWidth = 1.2; g.stroke() }
  }
}
