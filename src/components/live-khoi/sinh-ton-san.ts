// VẬT TRÊN SÂN của trò «Sinh Tồn» NƯỚNG SẴN thành ảnh (thầy chốt bản vẽ «2D có chiều sâu» 12/11 tối: docs/ban-ve-sinh-ton-chieu-sau-1211/01-em-giao-tranh-1180.jpg):
// tường / thùng có mặt trên sáng + mặt trước sẫm, bụi là các khối tròn sáng phía nắng, bóng đổ mềm về dưới-phải (nắng từ trên-trái), quầng sáng màu đội.
// Mọi chuyển sắc và làm mềm bóng chỉ tính MỘT lần lúc nướng; mỗi khung hình chỉ DÁN ảnh ⇒ không chậm hơn bản vẽ nét cũ. Cùng cỡ thì dùng chung một ảnh
// (bản đồ đối xứng: 6 cỡ tường, 1 cỡ thùng, 4 cỡ bụi). Màu lấy từ bảng màu của app (không mã màu thô).
import { mau, pha, type Anh, type BangMau, type Rgb } from './sinh-ton-hinh'

/** Độ cao (đơn vị sân) của tường và thùng — mặt trên vẽ lùi lên chừng này. */
export const CAO_TUONG = 24
export const CAO_THUNG = 20
const TAU = Math.PI * 2
const DEN: Rgb = [2, 8, 11]

export interface BoSan {
  tuong(w: number, h: number): Anh
  thung(w: number, h: number): Anh
  /** Bóng đổ của một khối cỡ w × h cao `cao`. */ bongKhoi(w: number, h: number, cao: number): Anh
  buiDuoi(w: number, h: number): Anh
  buiTren(w: number, h: number): Anh
  bongBui(w: number, h: number): Anh
  /** Quầng sáng tròn: 0..3 = màu đội, 4 = vàng (chớp nòng, hộp tiếp tế), 5 = xanh lơ. Vẽ bằng phép cộng sáng. */ quang(loai: number): HTMLCanvasElement
  /** Bóng tròn mềm (bé ma, viên đạn, hộp). */ bongTron: HTMLCanvasElement
}
interface La { x: number; y: number; r: number }
/** Một bụi = chín đốm lá quanh + một đốm giữa (toạ độ tính từ góc trên-trái ô của bụi). */
export function laBui(w: number, h: number): La[] {
  const nho = Math.min(w, h), la: La[] = []
  for (let i = 0; i < 9; i++) {
    const t = (i / 9) * TAU, r = (0.62 + 0.1 * Math.sin(i * 2.4)) * 1.15
    la.push({ x: w / 2 + Math.cos(t) * w * 0.34 * r, y: h / 2 + Math.sin(t) * h * 0.3 * r, r: nho * (0.3 + 0.05 * Math.cos(i * 1.7)) })
  }
  la.push({ x: w / 2, y: h / 2, r: nho * 0.42 })
  return la
}
function vai(x: number, y: number, w: number, h: number, doPhan: number): [Anh, CanvasRenderingContext2D | null] {
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.ceil(w * doPhan)); cv.height = Math.max(1, Math.ceil(h * doPhan))
  const g = cv.getContext('2d')
  if (g) { g.setTransform(doPhan, 0, 0, doPhan, -x * doPhan, -y * doPhan); g.lineCap = 'round'; g.lineJoin = 'round' }
  return [{ cv, x, y, w, h }, g]
}
const hopBo = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h) }
/** Làm mềm mép bóng mà không cần bộ lọc: vẽ chồng 14 lần hình bóng lệch quanh một vòng nhỏ, mỗi lần rất nhạt. */
function bongMem(g: CanvasRenderingContext2D, ve: () => void, mo: number, dam: number): void {
  const n = 14
  g.fillStyle = mau(DEN, 1 - Math.pow(1 - dam, 1 / n))
  for (let i = 0; i < n; i++) {
    const t = (i / n) * TAU, r = i % 2 ? mo : mo * 0.5
    g.save(); g.translate(Math.cos(t) * r, Math.sin(t) * r); ve(); g.restore()
  }
}
function quangTron(c: Rgb, dam: number): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128
  const g = cv.getContext('2d')
  if (g) {
    const q = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    q.addColorStop(0, mau(c, dam)); q.addColorStop(0.4, mau(c, dam * 0.37)); q.addColorStop(1, mau(c, 0))
    g.fillStyle = q; g.fillRect(0, 0, 128, 128)
  }
  return cv
}

/** Bộ ảnh vật trên sân ở độ phân giải `doPhan` (điểm ảnh cho một đơn vị sân), nướng dần theo nhu cầu. Đổi cỡ màn / đổi màu ⇒ tạo bộ mới. */
export function taoBoSan(bang: BangMau, doPhan: number): BoSan {
  const nho = new Map<string, Anh>(), nhoQuang: (HTMLCanvasElement | undefined)[] = []
  const lay = (khoa: string, tao: () => Anh): Anh => { let a = nho.get(khoa); if (!a) { a = tao(); nho.set(khoa, a) } return a }
  const xanh = bang.doi[2] ?? bang.dung, sangNhe = (g: CanvasRenderingContext2D, w: number, cao: number, h: number): void => {
    // mép trên và mép trái bắt nắng
    g.beginPath(); g.moveTo(9, -cao + 2); g.lineTo(w - 9, -cao + 2); g.moveTo(2, -cao + 9); g.lineTo(2, -cao + h - 9)
    g.lineWidth = 2.4; g.strokeStyle = mau(bang.trang, 0.42); g.stroke()
  }
  const veTuong = (w: number, h: number): Anh => {
    const [a, g] = vai(-3, -CAO_TUONG - 3, w + 6, h + CAO_TUONG + 6, doPhan)
    if (!g) return a
    const truoc = g.createLinearGradient(0, h - CAO_TUONG - 6, 0, h)
    truoc.addColorStop(0, mau(pha(bang.nen2, bang.vien, 0.95))); truoc.addColorStop(1, mau(pha(bang.nen2, bang.vien, 0.45)))
    hopBo(g, 0, 0, w, h, 9); g.fillStyle = truoc; g.fill()
    hopBo(g, 0, h - 5, w, 5, 2.5); g.fillStyle = mau(DEN, 0.35); g.fill()
    const tren = g.createLinearGradient(0, -CAO_TUONG, w, h - CAO_TUONG)
    tren.addColorStop(0, mau(pha(bang.vien, bang.chu3, 0.62))); tren.addColorStop(0.55, mau(pha(bang.vien, bang.chu3, 0.38))); tren.addColorStop(1, mau(pha(bang.vien, bang.chu3, 0.22)))
    hopBo(g, 0, -CAO_TUONG, w, h, 9); g.fillStyle = tren; g.fill()
    hopBo(g, 1, -CAO_TUONG + 1, w - 2, h - 2, 8); g.lineWidth = 2; g.strokeStyle = mau(bang.trang, 0.2); g.stroke()
    sangNhe(g, w, CAO_TUONG, h)
    hopBo(g, 6, -CAO_TUONG + 6, w - 12, h - 12, 5); g.fillStyle = mau(bang.trang, 0.05); g.fill()
    return a
  }
  const veThung = (w: number, h: number): Anh => {
    const [a, g] = vai(-3, -CAO_THUNG - 3, w + 6, h + CAO_THUNG + 6, doPhan)
    if (!g) return a
    const go = pha(bang.vien, bang.sao, 0.72), goToi = pha(bang.nen2, bang.sao, 0.42)
    const truoc = g.createLinearGradient(0, h - CAO_THUNG - 6, 0, h)
    truoc.addColorStop(0, mau(pha(bang.nen2, bang.sao, 0.52))); truoc.addColorStop(1, mau(pha(bang.nen2, bang.sao, 0.28)))
    hopBo(g, 0, 0, w, h, 6); g.fillStyle = truoc; g.fill()
    g.beginPath(); g.moveTo(4, h - 10); g.lineTo(w - 4, h - 10); g.lineWidth = 2; g.strokeStyle = mau(DEN, 0.4); g.stroke()
    hopBo(g, 0, h - 5, w, 5, 2.5); g.fillStyle = mau(DEN, 0.35); g.fill()
    const tren = g.createLinearGradient(0, -CAO_THUNG, w, h - CAO_THUNG)
    tren.addColorStop(0, mau(pha(go, bang.trang, 0.16))); tren.addColorStop(0.6, mau(go)); tren.addColorStop(1, mau(pha(go, bang.nen2, 0.18)))
    hopBo(g, 0, -CAO_THUNG, w, h, 6); g.fillStyle = tren; g.fill(); g.lineWidth = 2; g.strokeStyle = mau(goToi); g.stroke()
    g.beginPath(); g.moveTo(5, -CAO_THUNG + h / 3); g.lineTo(w - 5, -CAO_THUNG + h / 3); g.moveTo(5, -CAO_THUNG + (h * 2) / 3); g.lineTo(w - 5, -CAO_THUNG + (h * 2) / 3)
    g.lineWidth = 1.4; g.strokeStyle = mau(goToi, 0.4); g.stroke()
    g.beginPath(); g.moveTo(9, -CAO_THUNG + 9); g.lineTo(w - 9, -CAO_THUNG + h - 9); g.moveTo(w - 9, -CAO_THUNG + 9); g.lineTo(9, -CAO_THUNG + h - 9)
    g.lineWidth = 6; g.strokeStyle = mau(goToi); g.stroke()
    for (const [x, y] of [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]]) {
      g.beginPath(); g.arc(x, -CAO_THUNG + y, 2.4, 0, TAU); g.fillStyle = mau(pha(goToi, bang.nen2, 0.3)); g.fill()
      g.beginPath(); g.arc(x - 0.6, -CAO_THUNG + y - 0.7, 0.9, 0, TAU); g.fillStyle = mau(pha(go, bang.trang, 0.5)); g.fill()
    }
    g.beginPath(); g.moveTo(7, -CAO_THUNG + 2); g.lineTo(w - 7, -CAO_THUNG + 2); g.lineWidth = 2; g.strokeStyle = mau(bang.trang, 0.45); g.stroke()
    return a
  }
  const veBongKhoi = (w: number, h: number, cao: number): Anh => {
    const dx = cao * 0.75, dy = cao * 0.9, [a, g] = vai(-14, -14, w + dx + 28, h + dy + 28, doPhan)
    if (!g) return a
    bongMem(g, () => {
      g.beginPath(); g.moveTo(4, h); g.lineTo(dx, h + dy); g.lineTo(w + dx, h + dy); g.lineTo(w + dx, dy); g.lineTo(w, 4); g.lineTo(w, h); g.closePath(); g.fill()
      hopBo(g, -3, -3, w + 6, h + 8, 10); g.fill()
    }, 7, 0.5)
    return a
  }
  const veBuiDuoi = (w: number, h: number): Anh => {
    const [a, g] = vai(-18, -36, w + 36, h + 68, doPhan), la = laBui(w, h)
    if (!g) return a
    g.fillStyle = mau(pha(xanh, bang.nen2, 0.64)); for (const l of la) { g.beginPath(); g.arc(l.x, l.y, l.r, 0, TAU); g.fill() }
    g.fillStyle = mau(pha(xanh, bang.nen2, 0.48)); for (const l of la) { g.beginPath(); g.arc(l.x - 1, l.y - 3, l.r * 0.9, 0, TAU); g.fill() }
    return a
  }
  const veBuiTren = (w: number, h: number): Anh => {
    const [a, g] = vai(-18, -36, w + 36, h + 68, doPhan), la = laBui(w, h)
    if (!g) return a
    const sang = pha(xanh, bang.trang, 0.22), giua = pha(xanh, bang.nen, 0.22), toi = pha(xanh, bang.nen2, 0.6)
    for (const l of la) {
      // mỗi đốm lá là một khối tròn: sáng phía nắng, sẫm phía khuất
      const r = l.r * 0.74, q = g.createRadialGradient(l.x - r * 0.32, l.y - 10 - r * 0.44, r * 0.05, l.x, l.y - 10, r * 1.2)
      q.addColorStop(0, mau(sang)); q.addColorStop(0.5, mau(giua)); q.addColorStop(1, mau(toi))
      g.beginPath(); g.arc(l.x, l.y - 10, r, 0, TAU); g.fillStyle = q; g.fill()
    }
    g.fillStyle = mau(pha(xanh, bang.trang, 0.7), 0.55)
    for (let i = 0; i < 7; i++) { const l = la[i]; g.beginPath(); g.arc(l.x - l.r * 0.26, l.y - 10 - l.r * 0.3, l.r * (i % 2 ? 0.16 : 0.11), 0, TAU); g.fill() }
    return a
  }
  const veBongBui = (w: number, h: number): Anh => {
    const [a, g] = vai(-10, -20, w + 60, h + 76, doPhan), la = laBui(w, h)
    if (!g) return a
    bongMem(g, () => { g.beginPath(); for (const l of la) { g.moveTo(l.x + 14 + l.r * 0.95, l.y + 18); g.arc(l.x + 14, l.y + 18, l.r * 0.95, 0, TAU) } g.fill() }, 7, 0.5)
    return a
  }
  return {
    tuong: (w, h) => lay(`t${w}x${h}`, () => veTuong(w, h)),
    thung: (w, h) => lay(`h${w}x${h}`, () => veThung(w, h)),
    bongKhoi: (w, h, cao) => lay(`b${w}x${h}x${cao}`, () => veBongKhoi(w, h, cao)),
    buiDuoi: (w, h) => lay(`d${w}x${h}`, () => veBuiDuoi(w, h)),
    buiTren: (w, h) => lay(`l${w}x${h}`, () => veBuiTren(w, h)),
    bongBui: (w, h) => lay(`u${w}x${h}`, () => veBongBui(w, h)),
    quang: (loai) => (nhoQuang[loai] ??= quangTron(loai === 4 ? pha(bang.sao, bang.trang, 0.3) : loai === 5 ? bang.tin : bang.doi[loai] ?? bang.chu, loai === 4 ? 0.75 : 0.7)),
    bongTron: quangTron(DEN, 0.9),
  }
}
