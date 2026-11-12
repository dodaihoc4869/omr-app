// VẼ MỘT KHUNG HÌNH của trò «Sinh Tồn» lên canvas — bản «2D CÓ CHIỀU SÂU» thầy chốt 12/11 tối (docs/ban-ve-sinh-ton-chieu-sau-1211/01-em-giao-tranh-1180.jpg):
// nắng từ trên-trái ⇒ bóng đổ về dưới-phải, tường / thùng có mặt trên + mặt trước, bé ma lơ lửng, đạn và trại đội hắt sáng lên sân. Bóng và quầng sáng
// là ẢNH NƯỚNG SẴN (sinh-ton-san.ts) — mỗi khung chỉ dán; máy yếu (`nhe`) bỏ hẳn bóng + ánh sáng + nền gạch. Không giữ trạng thái:
// nhận «cảnh» (bản đồ, tâm nhìn, danh sách nhân vật đã nội suy) và vẽ. Thứ tự: nền sân → trại → hộp tiếp tế → vòng an toàn → gốc bụi →
// tường / thùng / bé ma xếp theo chiều sâu → tán bụi → bé ma đang ẩn mà em thấy → đạn → tên + thanh máu. Chỉ vẽ thứ nằm trong khung nhìn.
import { DAN_BAY_MS, NHIP_BAN_MS, type BanDo, type ChuNhat, type Diem, type Vong } from '../../lib/live-khoi/sinh-ton-loi'
import { KHOP, SUNG_HE, SUNG_NONG, mau, pha, type Anh, type BangMau, type BoHinh, type Rgb } from './sinh-ton-hinh'
import { CAO_THUNG, CAO_TUONG, type BoSan } from './sinh-ton-san'

/** Cỡ bé ma trên sân (thầy 12/11 chiều: «cho con ma nhỏ hơn chút nữa»; trước là 0,86). */
export const K_NV = 0.74
const TAU = Math.PI * 2
const DEN: Rgb = [2, 8, 11]
/** Bé ma lơ lửng cách mặt sân chừng này (đơn vị hình). */
const LO_LUNG = 6
/** Ba path ngọn lửa — đúng `NgonLua` ở src/components/bpu/ManBinhPhanUng.tsx (viewBox 64 × 80). */
const LUA = ['M32 4C35 17 50 25 54 40c4 17-7 34-22 34S6 57 10 40c2-8 7-12 9-19 3 7 6 10 9 11-1-10 1-19 4-28z', 'M32 28c2 9 12 14 14 24 2 12-5 21-14 21s-16-9-14-21c1-5 4-9 6-13 1 4 3 7 6 8-1-7 0-13 2-19z', 'M32 47c2 6 8 9 8 16a8 8 0 0 1-16 0c0-7 6-10 8-16z']
let luaPath: Path2D[] | null = null
const lua = (): Path2D[] => (luaPath ??= typeof Path2D === 'function' ? LUA.map((d) => new Path2D(d)) : [])

export interface NvVe {
  id: string; x: number; y: number; mau: number; doi: number; cap: number
  /** Góc nòng súng (rad, 0 = phải). */ goc: number
  /** Đang bắn tới (dx, dy) — toạ độ sân của mục tiêu. */ ban: boolean; dx: number; dy: number
  may: boolean; toi: boolean
  /** Độ đậm 0..1 (bị hạ / mất kết nối thì mờ). */ mo: number
  ten: string
  /** Đang ẩn trong bụi mà em vẫn thấy (em hoặc đồng đội) ⇒ vẽ mờ, đè lên tán bụi. */ an: boolean
}
export interface SoBay { x: number; y: number; chu: string; luc: number }
export interface Canh {
  g: CanvasRenderingContext2D; W: number; H: number; dpr: number
  /** Điểm ảnh CSS cho một đơn vị sân, và tâm nhìn (toạ độ sân). */ ti: number; cx: number; cy: number
  bd: BanDo; bang: BangMau; hinh: BoHinh; san: BoSan
  /** Kiểu PHẲNG (máy yếu, «giảm chuyển động», hoặc máy vẽ không kịp nên tự hạ): bỏ bóng đổ, quầng sáng, nền gạch — về đúng mức vẽ của bản trước. */ nhe: boolean
  /** `luc` = đồng hồ khung hình (ms), `vong` = vòng an toàn lúc này. */ luc: number; vong: Vong
  nv: NvVe[]; hopCo: boolean; nghi: boolean
  /** Đường «chạm để tới» của em (đã gồm điểm đang đứng ở đầu) hoặc null. */ duong: Diem[] | null
  so: SoBay[]
}

const bamSo = (id: string): number => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997; return h }

export function veKhung(c: Canh): void {
  const { g, W, H, ti, bd, bang, nhe, luc, san } = c
  const X = (x: number): number => (x - c.cx) * ti + W / 2, Y = (y: number): number => (y - c.cy) * ti + H / 2
  const trongKhung = (x: number, y: number, le: number): boolean => { const a = X(x), b = Y(y), l = le * ti; return a > -l && b > -l && a < W + l && b < H + l }
  const hopBo = (x: number, y: number, w: number, h: number, r: number): void => { g.beginPath(); if (g.roundRect) g.roundRect(X(x), Y(y), w * ti, h * ti, r * ti); else g.rect(X(x), Y(y), w * ti, h * ti) }
  const tron = (x: number, y: number, r: number): void => { g.beginPath(); g.arc(X(x), Y(y), r * ti, 0, TAU) }
  const elip = (x: number, y: number, rx: number, ry: number): void => { g.beginPath(); g.ellipse(X(x), Y(y), rx * ti, ry * ti, 0, 0, TAU) }
  /** Dán một ảnh nướng sẵn có gốc tại (x, y) của sân. */
  const dan = (a: Anh, x: number, y: number): void => { g.drawImage(a.cv, X(x + a.x), Y(y + a.y), a.w * ti, a.h * ti) }
  /** Quầng sáng (cộng sáng) tâm (x, y), bán kính rx × ry đơn vị sân. */
  const sang = (loai: number, x: number, y: number, rx: number, ry: number, dam: number): void => { g.globalAlpha = dam; g.drawImage(san.quang(loai), X(x - rx), Y(y - ry), rx * 2 * ti, ry * 2 * ti) }
  const bongTron = (x: number, y: number, rx: number, ry: number, dam: number): void => { g.globalAlpha = dam; g.drawImage(san.bongTron, X(x - rx), Y(y - ry), rx * 2 * ti, ry * 2 * ti); g.globalAlpha = 1 }
  g.setTransform(c.dpr, 0, 0, c.dpr, 0, 0)
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([])
  // ── Nền sân lát gạch hai tông; ngoài sân chỉ tô khi mép sân lọt vào màn. Nắng chéo + viền tối quanh màn là lớp CSS `.st-phu` (không tốn lượt vẽ canvas) ──
  const kinSan = X(0) <= 0 && Y(0) <= 0 && X(bd.rong) >= W && Y(bd.cao) >= H
  if (!kinSan) {
    g.fillStyle = mau(bang.nen2); g.fillRect(0, 0, W, H)
    if (!nhe) { hopBo(6, 14, bd.rong, bd.cao, 36); g.lineWidth = 10 * ti; g.strokeStyle = mau(DEN, 0.5); g.stroke() }
  }
  const nenSan = nhe ? bang.nen : pha(bang.nen, bang.tin, 0.05)
  hopBo(0, 0, bd.rong, bd.cao, 36); g.fillStyle = mau(nhe ? nenSan : pha(nenSan, bang.trang, 0.025)); g.fill()
  if (!nhe) {
    // Gạch hai tông bằng màu ĐẶC (không pha trong suốt ⇒ rẻ): một nửa số ô tô sẫm trong MỘT đường vẽ, rồi mạch gạch.
    const x0 = Math.max(0, Math.floor((c.cx - W / 2 / ti) / 80)), y0 = Math.max(0, Math.floor((c.cy - H / 2 / ti) / 80))
    const x1 = Math.min(Math.ceil(bd.rong / 80), Math.ceil((c.cx + W / 2 / ti) / 80)), y1 = Math.min(Math.ceil(bd.cao / 80), Math.ceil((c.cy + H / 2 / ti) / 80))
    g.beginPath()
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) if ((i + j) % 2) g.rect(X(i * 80), Y(j * 80), 80 * ti, 80 * ti)
    g.fillStyle = mau(pha(nenSan, DEN, 0.11)); g.fill()
    g.beginPath()
    for (let i = x0; i <= x1; i++) { g.moveTo(X(i * 80), Y(y0 * 80)); g.lineTo(X(i * 80), Y(y1 * 80)) }
    for (let j = y0; j <= y1; j++) { g.moveTo(X(x0 * 80), Y(j * 80)); g.lineTo(X(x1 * 80), Y(j * 80)) }
    g.lineWidth = 1.5; g.strokeStyle = mau(pha(nenSan, bang.chu, 0.07)); g.stroke()
  }
  if (!kinSan) { hopBo(0, 0, bd.rong, bd.cao, 36); g.lineWidth = Math.max(1.5, 5 * ti); g.strokeStyle = mau(pha(bang.vien, bang.chu3, 0.2)); g.stroke() }
  // ── Vòng an toàn: ngoài vòng tối và lạnh, mép vòng phát sáng ──
  const v = c.vong
  if (!nhe) {
    g.beginPath(); g.rect(0, 0, W, H); g.ellipse(X(v.cx), Y(v.cy), v.rx * ti, v.ry * ti, 0, 0, TAU)
    g.fillStyle = mau(pha(DEN, bang.tin, 0.16), 0.52); g.fill('evenodd')
    elip(v.cx, v.cy, v.rx, v.ry); g.lineWidth = 20 * ti; g.strokeStyle = mau(bang.tin, 0.2); g.stroke()
  }
  elip(v.cx, v.cy, v.rx, v.ry); g.setLineDash([14 * ti, 12 * ti]); g.lineWidth = Math.max(1.5, 4 * ti); g.strokeStyle = mau(pha(bang.tin, bang.trang, 0.45), 0.95); g.stroke(); g.setLineDash([])
  // ── Trại bốn đội: bệ sáng màu đội, hắt sáng ra sân ──
  const ngon = lua()
  for (let d = 0; d < 4; d++) {
    const p = bd.trai[d], md = bang.doi[d]
    if (!trongKhung(p.x, p.y, 240)) continue
    if (!nhe) { sang(d, p.x, p.y, 200, 150, 0.42); g.globalAlpha = 1; elip(p.x, p.y + 5, 90, 62); g.fillStyle = mau(DEN, 0.35); g.fill() }
    elip(p.x, p.y, 88, 60); g.fillStyle = mau(pha(bang.nen, md, nhe ? 0.16 : 0.34)); g.fill()
    if (!nhe) { g.globalCompositeOperation = 'lighter'; sang(d, p.x, p.y, 88, 60, 0.5); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1 }
    elip(p.x, p.y, 88, 60); g.lineWidth = Math.max(1.5, 3.5 * ti); g.strokeStyle = mau(md, 0.95); g.stroke()
    elip(p.x, p.y, 76, 50); g.setLineDash([3 * ti, 9 * ti]); g.lineWidth = Math.max(1, 1.6 * ti); g.strokeStyle = mau(md, 0.7); g.stroke(); g.setLineDash([])
    if (ngon.length) {
      if (!nhe) { g.globalCompositeOperation = 'lighter'; sang(d, p.x, p.y - 34, 46, 46, 1); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1 }
      const k = 0.7 * ti
      g.save(); g.translate(X(p.x) - 32 * k, Y(p.y) - 62 * ti); g.scale(k, k)
      g.fillStyle = mau(md); g.fill(ngon[0]); g.fillStyle = mau(pha(md, bang.sao, 0.6)); g.fill(ngon[1]); g.fillStyle = mau(pha(bang.trang, bang.sao, 0.4)); g.fill(ngon[2])
      g.restore()
    }
  }
  // ── Bóng đổ của tường, thùng, bụi (ảnh nướng sẵn) ──
  const tuongThay: ChuNhat[] = [], thungThay: ChuNhat[] = [], buiThay: ChuNhat[] = []
  for (const t of bd.tuong) if (trongKhung(t.x + t.w / 2, t.y + t.h / 2, Math.max(t.w, t.h) + 40)) tuongThay.push(t)
  for (const t of bd.thung) if (trongKhung(t.x + t.w / 2, t.y + t.h / 2, t.w + 40)) thungThay.push(t)
  for (const b of bd.bui) if (trongKhung(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) + 30)) buiThay.push(b)
  if (!nhe) {
    for (const t of tuongThay) dan(san.bongKhoi(t.w, t.h, CAO_TUONG + 10), t.x, t.y)
    for (const t of thungThay) dan(san.bongKhoi(t.w, t.h, CAO_THUNG + 8), t.x, t.y)
    for (const b of buiThay) dan(san.bongBui(b.w, b.h), b.x, b.y)
  }
  // ── Hộp tiếp tế giữa sân ──
  const hx = bd.rong / 2, hy = bd.cao / 2
  if (trongKhung(hx, hy, 160)) {
    if (c.hopCo && !nhe) { sang(4, hx, hy, 130, 130, 0.42); g.globalAlpha = 1 }
    tron(hx, hy, 66); g.setLineDash([2 * ti, 9 * ti]); g.lineWidth = Math.max(1.2, 2.5 * ti); g.strokeStyle = mau(bang.sao, c.hopCo ? 0.8 : 0.3); g.stroke(); g.setLineDash([])
    if (c.hopCo) {
      const nhun = nhe ? 0 : Math.sin(luc / 260) * 2.5
      if (!nhe) bongTron(hx + 13, hy + 20, 30, 11, 0.6)
      hopBo(hx - 21, hy - 14, 42, 30, 7); g.fillStyle = mau(pha(bang.dung, bang.nen2, 0.55)); g.fill()
      hopBo(hx - 21, hy - 30 - nhun, 42, 34, 7); g.fillStyle = mau(pha(bang.dung, bang.vien, 0.12)); g.fill(); g.lineWidth = Math.max(1, 2 * ti); g.strokeStyle = mau(bang.muc); g.stroke()
      hopBo(hx - 23, hy - 40 - nhun, 46, 16, 7); g.fillStyle = mau(pha(bang.dung, bang.trang, 0.5)); g.fill(); g.stroke()
      g.beginPath(); g.moveTo(X(hx), Y(hy - 20 - nhun)); g.lineTo(X(hx), Y(hy - 5 - nhun)); g.moveTo(X(hx - 7.5), Y(hy - 12.5 - nhun)); g.lineTo(X(hx + 7.5), Y(hy - 12.5 - nhun))
      g.lineWidth = Math.max(2, 5.4 * ti); g.strokeStyle = mau(bang.trang); g.stroke()
    }
  }
  // ── Chớp nòng hắt sáng lên sân ──
  const k = K_NV * ti
  const thay: NvVe[] = []
  for (const n of c.nv) if (trongKhung(n.x, n.y - 40, 110)) thay.push(n)
  if (!nhe) {
    g.globalCompositeOperation = 'lighter'
    for (const n of thay) if (n.ban && (luc + bamSo(n.id) * 37) % NHIP_BAN_MS[n.cap - 1] < 110) sang(4, n.x + Math.cos(n.goc) * 52, n.y - 20 + Math.sin(n.goc) * 52, 74, 74, 0.7)
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
  }
  // ── Gốc bụi ──
  for (const b of buiThay) dan(san.buiDuoi(b.w, b.h), b.x, b.y)
  // ── Đường «chạm để tới» của em ──
  if (c.duong && c.duong.length > 1) {
    g.beginPath(); g.moveTo(X(c.duong[0].x), Y(c.duong[0].y))
    for (let i = 1; i < c.duong.length; i++) g.lineTo(X(c.duong[i].x), Y(c.duong[i].y))
    g.setLineDash([2 * ti, 13 * ti]); g.lineWidth = Math.max(2, 5 * ti); g.strokeStyle = mau(bang.trang, 0.85); g.stroke(); g.setLineDash([])
    const d = c.duong[c.duong.length - 1]
    elip(d.x, d.y, 28, 10); g.lineWidth = Math.max(1.5, 3 * ti); g.stroke()
    elip(d.x, d.y, 15, 5.5); g.fillStyle = mau(bang.trang, 0.5); g.fill()
  }
  // ── Tường, thùng, bé ma: xếp theo chiều sâu (mép dưới) ──
  const veNv = (n: NvVe): void => {
    const px = X(n.x), py = Y(n.y), trai = Math.cos(n.goc) < 0, ben = trai ? -1 : 1
    // bóng tách khỏi thân (bé ma lơ lửng) + quầng sáng màu đội dưới chân
    if (nhe) { g.globalAlpha = n.mo; g.beginPath(); g.ellipse(px, py + 2 * k, 24 * k, 7 * k, 0, 0, TAU); g.fillStyle = mau(bang.nen2, 0.55); g.fill() }
    else {
      g.globalAlpha = 0.55 * n.mo; g.drawImage(san.bongTron, px + (14 - 30) * k, py + (6 - 10) * k, 60 * k, 20 * k)
      g.globalAlpha = 0.4 * n.mo; g.drawImage(san.bongTron, px + (3 - 17) * k, py + (-1 - 5.5) * k, 34 * k, 11 * k)
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * n.mo; g.drawImage(san.quang(n.doi), px - 46 * k, py - 18 * k, 92 * k, 32 * k); g.globalCompositeOperation = 'source-over'
    }
    g.globalAlpha = n.mo
    if (n.toi) {
      g.beginPath(); g.ellipse(px, py + 2 * k, 34 * k, 11.5 * k, 0, 0, TAU)
      g.fillStyle = mau(bang.doi[n.doi], 0.28); g.fill(); g.lineWidth = Math.max(1.5, 2.6 * k); g.strokeStyle = mau(bang.trang); g.stroke()
    }
    const than = c.hinh.than(n.doi, n.may, trai), sung = c.hinh.sung(n.doi, n.cap, trai), ks = k * SUNG_HE
    // Bé ma bay lơ lửng: nhún nhẹ (máy yếu thì đứng yên).
    const bay = (nhe ? 0 : Math.sin(luc / 320 + bamSo(n.id)) * 1.6 - LO_LUNG) * k
    g.drawImage(than.cv, px + than.x * k, py + bay + than.y * k, than.w * k, than.h * k)
    g.save(); g.translate(px + ben * KHOP.x * k, py + KHOP.y * k + bay); g.rotate(n.goc); if (trai) g.scale(1, -1)
    if (n.ban && !nhe) {
      const nong = SUNG_NONG[n.cap - 1] * ks, nhay = (luc + bamSo(n.id) * 37) % NHIP_BAN_MS[n.cap - 1] < 90
      if (nhay) { g.beginPath(); g.arc(nong + 4 * ks, 0, 8 * ks, 0, TAU); g.fillStyle = mau(bang.sao, 0.75); g.fill(); g.beginPath(); g.arc(nong + 2 * ks, 0, 4 * ks, 0, TAU); g.fillStyle = mau(bang.trang); g.fill() }
    }
    g.drawImage(sung.cv, sung.x * ks, sung.y * ks, sung.w * ks, sung.h * ks)
    g.restore()
    g.globalAlpha = 1
  }
  type Vat = { y: number; ve: () => void }
  const vat: Vat[] = []
  for (const t of tuongThay) vat.push({ y: t.y + t.h, ve: () => dan(san.tuong(t.w, t.h), t.x, t.y) })
  for (const t of thungThay) vat.push({ y: t.y + t.h, ve: () => dan(san.thung(t.w, t.h), t.x, t.y) })
  for (const n of thay) if (!n.an) vat.push({ y: n.y, ve: () => veNv(n) })
  vat.sort((a, b) => a.y - b.y)
  for (const o of vat) o.ve()
  // ── Tán bụi (phủ lên bé ma đứng trong bụi) ──
  g.globalAlpha = 0.86
  for (const b of buiThay) dan(san.buiTren(b.w, b.h), b.x, b.y)
  g.globalAlpha = 1
  for (const n of thay) if (n.an) veNv(n)
  // ── Đạn theo cấp súng (không lưu trạng thái: vị trí tính từ đồng hồ); đạn tự phát sáng, in bóng mờ xuống sân ──
  /** Quầng sáng quanh đầu đạn + bóng đạn. */
  const sangDan = (loai: number, x: number, y: number, r: number, dam: number): void => {
    if (nhe) return
    bongTron(x + 10, y + 30, r > 60 ? 14 : 8, r > 60 ? 5 : 3, 0.45)
    g.globalCompositeOperation = 'lighter'; sang(loai, x, y + 8, r, r, dam); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1
  }
  for (const n of thay) {
    if (!n.ban) continue
    const trai = Math.cos(n.goc) < 0, md = bang.doi[n.doi], dai = SUNG_NONG[n.cap - 1] * SUNG_HE * K_NV
    const x0 = n.x + (trai ? -1 : 1) * KHOP.x * K_NV + Math.cos(n.goc) * dai, y0 = n.y + (KHOP.y - LO_LUNG) * K_NV + Math.sin(n.goc) * dai
    const x1 = n.dx, y1 = n.dy - 34, kc = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / kc, uy = (y1 - y0) / kc
    const chuKy = NHIP_BAN_MS[n.cap - 1], bay = DAN_BAY_MS[n.cap - 1], pha0 = (luc + bamSo(n.id) * 37) % chuKy, f = pha0 / bay
    if (n.cap === 3) {
      // Tia sét: loé 120 ms mỗi nhịp, gãy khúc đổi mỗi 50 ms.
      if (pha0 > 120) continue
      sangDan(n.doi, x1, y1, 60, 0.8)
      const hat = Math.floor(luc / 50) + bamSo(n.id), khuc = Math.max(3, Math.round(kc / 34))
      g.beginPath(); g.moveTo(X(x0), Y(y0))
      for (let i = 1; i < khuc; i++) { const t = i / khuc, lech = (((hat * (i + 3) * 7919) % 17) - 8) * 1.3; g.lineTo(X(x0 + ux * kc * t - uy * lech), Y(y0 + uy * kc * t + ux * lech)) }
      g.lineTo(X(x1), Y(y1))
      g.lineWidth = Math.max(3, 9 * ti); g.strokeStyle = mau(md, 0.5); g.stroke(); g.lineWidth = Math.max(1.2, 3 * ti); g.strokeStyle = mau(bang.trang); g.stroke()
      continue
    }
    if (f > 1.15) continue
    if (f >= 1) { sangDan(n.doi, x1, y1, 46, 0.9); tron(x1, y1, 15 * (f - 0.85) * 4); g.lineWidth = Math.max(1.2, 2.5 * ti); g.strokeStyle = mau(md, 0.8); g.stroke(); tron(x1, y1, 5); g.fillStyle = mau(bang.trang); g.fill(); continue }
    const bx = x0 + ux * kc * f, by = y0 + uy * kc * f
    if (n.cap === 4) {
      sangDan(n.doi, bx, by, 86, 0.95)
      if (!nhe) { g.globalCompositeOperation = 'lighter'; sang(4, bx, by, 40, 40, 1); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1 }
      g.beginPath(); g.moveTo(X(bx - ux * 52), Y(by - uy * 52)); g.lineTo(X(bx - uy * 11), Y(by + ux * 11)); g.lineTo(X(bx + uy * 11), Y(by - ux * 11)); g.closePath(); g.fillStyle = mau(md, 0.5); g.fill()
      tron(bx, by, 13); g.fillStyle = mau(md); g.fill(); tron(bx, by, 8.6); g.fillStyle = mau(bang.sao); g.fill(); tron(bx, by, 4.2); g.fillStyle = mau(bang.trang); g.fill()
      continue
    }
    sangDan(n.doi, bx, by, 42, 0.8)
    const lech = n.cap === 2 ? [-6.5, 6.5] : [0]
    for (const l of lech) {
      const ax = bx - uy * l, ay = by + ux * l
      g.beginPath(); g.moveTo(X(ax - ux * 30), Y(ay - uy * 30)); g.lineTo(X(ax), Y(ay)); g.lineWidth = Math.max(1.5, 4.5 * ti); g.strokeStyle = mau(md, 0.35); g.stroke()
      if (n.cap === 2) { g.beginPath(); g.moveTo(X(ax - ux * 14), Y(ay - uy * 14)); g.lineTo(X(ax), Y(ay)); g.lineWidth = Math.max(2, 7 * ti); g.strokeStyle = mau(md); g.stroke(); tron(ax, ay, 2.2); g.fillStyle = mau(bang.trang); g.fill() }
      else { tron(ax, ay, 6.5); g.fillStyle = mau(md); g.fill(); tron(ax, ay, 2.8); g.fillStyle = mau(bang.trang); g.fill() }
    }
  }
  // ── Tên + thanh máu; bé ma của em có ngọn lửa đội trên đầu ──
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'
  const coChu = Math.max(11, Math.min(14, 15.5 * ti))
  for (const n of thay) {
    if (!n.ten || n.mau <= 0) continue
    const px = X(n.x), py = Y(n.y) - ((n.may ? 106 : 98) + (nhe ? 0 : LO_LUNG)) * k - 4, rong = n.toi ? 52 : 42, cao = n.toi ? 6 : 5
    g.globalAlpha = Math.max(0.75, n.mo)
    g.font = `${n.may ? 700 : 800} ${coChu}px ${bang.phong}`
    g.lineWidth = 3.5; g.strokeStyle = mau(bang.nen2); g.strokeText(n.ten, px, py - 6)
    g.fillStyle = mau(n.may ? bang.chu2 : bang.chu); g.fillText(n.ten, px, py - 6)
    g.beginPath(); if (g.roundRect) g.roundRect(px - rong / 2 - 2, py - 1, rong + 4, cao + 4, (cao + 4) / 2); else g.rect(px - rong / 2 - 2, py - 1, rong + 4, cao + 4)
    g.fillStyle = mau(bang.nen2); g.fill()
    const phan = Math.max(0, Math.min(1, n.mau / 100))
    g.beginPath(); if (g.roundRect) g.roundRect(px - rong / 2, py + 1, rong * phan, cao, cao / 2); else g.rect(px - rong / 2, py + 1, rong * phan, cao)
    g.fillStyle = mau(n.mau > 55 ? bang.dung : n.mau > 25 ? bang.sao : bang.sai); g.fill()
    if (n.toi && ngon.length) {
      const kl = 26 / 80
      g.save(); g.translate(px - 32 * kl, py - 21 - 26 + (nhe ? 0 : Math.sin(luc / 180) * 0.8)); g.scale(kl, kl)
      g.lineWidth = 5; g.strokeStyle = mau(bang.nen2); g.stroke(ngon[0])
      g.fillStyle = mau(bang.doi[n.doi]); g.fill(ngon[0]); g.fillStyle = mau(pha(bang.doi[n.doi], bang.sao, 0.6)); g.fill(ngon[1]); g.fillStyle = mau(pha(bang.trang, bang.sao, 0.4)); g.fill(ngon[2])
      g.restore()
    }
  }
  g.globalAlpha = 1
  // ── Số máu vừa mất bay lên ──
  g.font = `800 ${Math.max(12, Math.min(15, 17 * ti))}px ${bang.phong}`
  for (const s of c.so) {
    const t = (luc - s.luc) / 700
    if (t < 0 || t > 1) continue
    g.globalAlpha = 1 - t * t
    const px = X(s.x), py = Y(s.y) - t * 22
    g.lineWidth = 4; g.strokeStyle = mau(bang.nen2); g.strokeText(s.chu, px, py)
    g.fillStyle = mau(bang.sao); g.fillText(s.chu, px, py)
  }
  g.globalAlpha = 1
}

/** Bản đồ nhỏ góc phải dưới: vật chặn, vòng an toàn, trại, đồng đội và em. */
export function veBanDoNho(g: CanvasRenderingContext2D, rong: number, cao: number, dpr: number, bd: BanDo, bang: BangMau, v: Vong, nv: readonly NvVe[], doiToi: number): void {
  const ti = rong / bd.rong
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.fillStyle = mau(bang.nen2); g.fillRect(0, 0, rong, cao)
  g.fillStyle = mau(bang.vien)
  for (const t of bd.chan) g.fillRect(t.x * ti, t.y * ti, Math.max(1, t.w * ti), Math.max(1, t.h * ti))
  for (let d = 0; d < 4; d++) { g.beginPath(); g.arc(bd.trai[d].x * ti, bd.trai[d].y * ti, 5, 0, TAU); g.fillStyle = mau(bang.doi[d], 0.45); g.fill() }
  g.beginPath(); g.ellipse(v.cx * ti, v.cy * ti, v.rx * ti, v.ry * ti, 0, 0, TAU); g.setLineDash([4, 3]); g.lineWidth = 1.3; g.strokeStyle = mau(bang.tin); g.stroke(); g.setLineDash([])
  for (const n of nv) {
    if (n.doi !== doiToi || n.mau <= 0 || n.toi) continue
    g.beginPath(); g.arc(n.x * ti, (n.y - 30) * ti, 2.6, 0, TAU); g.fillStyle = mau(bang.doi[n.doi]); g.fill()
  }
  const toi = nv.find((n) => n.toi)
  if (toi) { g.beginPath(); g.arc(toi.x * ti, (toi.y - 30) * ti, 3.2, 0, TAU); g.fillStyle = mau(bang.doi[toi.doi]); g.fill(); g.lineWidth = 1.4; g.strokeStyle = mau(bang.trang); g.stroke() }
}
