// VẼ BÉ MA MẶC ĐỒ cho tủ đồ + thẻ sảnh (đợt 4). Thân bé ma nướng bằng ĐÚNG hàm của trò (src/components/live-khoi/sinh-ton-hinh.ts — CHỈ nhập, không sửa);
// trang phục vẽ CHỒNG lên trong tệp này (hàm nướng của trò chưa có tham số đồ). Bước ghép gọi `veDoTrenMa` ngay sau khi nướng thân (cùng toạ độ hộp 70 × 84).
// Màu chỉ đọc biến CSS (--st-* nền luôn tối, token đội / trạng thái) — không mã màu thô.
import { BoHinh, HINH_MA, MA_OX, MA_OY, PHONG_TAY, dat, mau, pha, taoBangMau, type BangMau, type Rgb } from '../live-khoi/sinh-ton-hinh'
import type { BoMac } from '../../lib/live-khoi/tu-do'

type G = CanvasRenderingContext2D
/** Khung vẽ (đơn vị sân): bé ma neo ở (45, 86) — chừa 14 đơn vị phía trên cho mũ cao. */
export const KHUNG_W = 90, KHUNG_H = 100
const NEO_X = 45, NEO_Y = 86

function tachMau(chuoi: string, macDinh: Rgb): Rgb {
  const so = chuoi.match(/-?\d*\.?\d+(?:e-?\d+)?/g)
  if (!so || so.length < 3) return macDinh
  const he = chuoi.startsWith('color(') ? 255 : 1
  const v = so.slice(0, 3).map((x) => Math.max(0, Math.min(255, Math.round(Number(x) * he))))
  return [v[0]!, v[1]!, v[2]!]
}
/** Bảng màu đọc tại chỗ khung đứng (cùng cách trò đọc). */
export function docBang(goc: HTMLElement): BangMau {
  const que = document.createElement('span')
  que.style.display = 'none'
  goc.appendChild(que)
  const doc = (bien: string, macDinh: Rgb): Rgb => { que.style.color = ''; que.style.color = `var(${bien})`; return que.style.color ? tachMau(getComputedStyle(que).color, macDinh) : macDinh }
  const b = taoBangMau(doc, tachMau(getComputedStyle(goc).color, [128, 128, 128]))
  que.remove()
  return b
}

function da(g: G, pts: readonly [number, number][]): void { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath() }
function to(g: G, c: Rgb, vien: Rgb, day = 1.4): void { g.fillStyle = mau(c); g.fill(); g.strokeStyle = mau(vien); g.lineWidth = day; g.lineJoin = 'round'; g.stroke() }
/** Thân bé ma trừ mặt (vùng tô áo) — hệ toạ độ hộp 70 × 84. */
function catThan(g: G): void {
  g.beginPath(); HINH_MA.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath()
  g.ellipse(38, 30, 11, 9, 0, 0, Math.PI * 2)
  g.clip('evenodd')
}

/** Trang phục chồng lên bé ma (hệ hộp 70 × 84 của sinh-ton-hinh: thân tâm ~ (35, 30), đỉnh đầu y ≈ 13). */
function veMu(g: G, b: BangMau, ma: string): void {
  if (ma === 'mu-tot-nghiep') {
    const den = pha(b.giay, b.muc, 0.32)
    da(g, [[27, 14], [43, 14], [43, 19], [27, 19]]); to(g, pha(den, b.giay, 0.3), b.muc, 1.2)
    da(g, [[17, 12], [35, 5], [53, 12], [35, 18]]); to(g, den, b.muc)
    g.beginPath(); g.moveTo(35, 11.5); g.lineTo(49, 13); g.lineTo(50, 23); g.strokeStyle = mau(b.sao); g.lineWidth = 1.8; g.lineCap = 'round'; g.stroke()
    g.beginPath(); g.arc(50, 24, 1.8, 0, Math.PI * 2); g.fillStyle = mau(b.sao); g.fill()
  } else if (ma === 'tai-nghe') {
    g.beginPath(); g.arc(35, 31, 20, Math.PI * 1.06, Math.PI * 1.94); g.strokeStyle = mau(b.muc); g.lineWidth = 2.6; g.lineCap = 'round'; g.stroke()
    for (const x of [15.5, 54.5]) { g.beginPath(); g.ellipse(x, 31, 3.8, 5.6, 0, 0, Math.PI * 2); to(g, b.sai, b.muc, 1.3) }
  } else if (ma === 'mu-phu-thuy') {
    const tim = pha(b.hs, b.giay, 0.5)
    da(g, [[23, 15], [31, -9], [47, 15]]); to(g, tim, b.muc)
    g.beginPath(); g.ellipse(35, 15, 17, 3.4, 0, 0, Math.PI * 2); to(g, pha(tim, b.giay, 0.3), b.muc, 1.3)
    g.beginPath(); g.arc(36, 5, 1.8, 0, Math.PI * 2); g.fillStyle = mau(b.sao); g.fill()
  }
}
function veAo(g: G, b: BangMau, ma: string): void {
  g.save(); catThan(g)
  if (ma === 'ao-ke-o-li') {
    g.strokeStyle = mau(b.tin, 0.6); g.lineWidth = 0.9; g.beginPath()
    for (let x = 14; x <= 58; x += 5.5) { g.moveTo(x, 10); g.lineTo(x, 62) }
    for (let y = 14; y <= 62; y += 5.5) { g.moveTo(14, y); g.lineTo(58, y) }
    g.stroke()
  } else if (ma === 'ao-sao-dem') {
    g.fillStyle = mau(b.giay, 0.62); g.fillRect(10, 8, 52, 56)
    g.fillStyle = mau(b.sao)
    for (const [x, y, r] of [[22, 22, 1.2], [27, 44, 1], [45, 48, 1.3], [51, 38, 0.9], [20, 52, 1.1], [33, 55, 0.8], [48, 21, 0.9]] as const) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill() }
  }
  g.restore()
}
/** Vệt đạn / hiệu ứng khi hạ — ô của hai ngăn này chỉ vẽ hiệu ứng (không vẽ bé ma). Hệ khung 90 × 100. */
function veHieuUng(g: G, b: BangMau, ma: string): void {
  if (ma === 'dan-cau-vong') {
    const mauVet = [b.doi[3]!, b.doi[0]!, b.sao, b.doi[2]!, b.tin, b.doi[1]!]
    g.lineCap = 'round'
    mauVet.forEach((c, i) => { g.beginPath(); g.moveTo(10, 74 + i * 3.2); g.quadraticCurveTo(40, 66 + i * 3.2, 66, 44 + i * 2.2); g.strokeStyle = mau(c, 0.9); g.lineWidth = 3; g.stroke() })
    g.beginPath(); g.arc(72, 46, 6, 0, Math.PI * 2); to(g, b.muc, b.giay, 1.2)
  } else if (ma === 'phao-giay') {
    const mauGiay = [b.doi[0]!, b.doi[1]!, b.doi[2]!, b.doi[3]!, b.sao]
    for (let i = 0; i < 16; i++) {
      const x = 18 + ((i * 37) % 56), y = 22 + ((i * 53) % 60), q = (i * 0.9) % Math.PI
      g.save(); g.translate(x, y); g.rotate(q); g.fillStyle = mau(mauGiay[i % mauGiay.length]!); g.fillRect(-3.4, -1.8, 6.8, 3.6); g.restore()
    }
  } else if (ma === 'diem-10-do') {
    g.beginPath(); g.ellipse(45, 52, 27, 25, -0.08, 0, Math.PI * 2); g.strokeStyle = mau(b.sai, 0.95); g.lineWidth = 3.4; g.stroke()
    g.fillStyle = mau(b.sai); g.font = `700 34px ${PHONG_TAY}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10', 45, 54)
  }
}

/** BƯỚC GHÉP dùng: vẽ áo rồi mũ của bộ đồ lên bé ma, trong HỆ HỘP 70 × 84 của sinh-ton-hinh (gọi trong hàm nướng, sau khi vẽ thân, trước khi lật hướng nếu có). */
export function veDoTrenMa(g: G, b: BangMau, mac: Partial<BoMac>): void {
  if (mac.ao) veAo(g, b, mac.ao)
  if (mac.mu) veMu(g, b, mac.mu)
}
/** Vệt đạn / hiệu ứng khi hạ của bộ đồ (hệ khung 90 × 100) — bước ghép thay bằng hiệu ứng trên sân. */
export { veHieuUng }

export interface VeBeMa { doi: number; mac: Partial<BoMac>; /** Ô của ngăn vệt đạn / khi hạ: chỉ vẽ hiệu ứng này. */ hieuUng?: string | null; /** Ô đang khoá ⇒ mờ. */ mo?: boolean }
/** Vẽ vào canvas (cỡ CSS `w × h` px, đã gắn trong DOM để đọc màu). Trả false nếu máy không có canvas 2D. */
export function veBeMaMac(c: HTMLCanvasElement, o: VeBeMa): boolean {
  const w = c.clientWidth || KHUNG_W, dpr = Math.min(2, window.devicePixelRatio || 1), k = (w / KHUNG_W) * dpr
  c.width = Math.ceil(KHUNG_W * k); c.height = Math.ceil(KHUNG_H * k)
  const g = c.getContext('2d')
  if (!g) return false
  const b = docBang(c.parentElement ?? c)
  g.setTransform(k, 0, 0, k, 0, 0)
  if (o.hieuUng) veHieuUng(g, b, o.hieuUng)
  else {
    g.beginPath(); g.ellipse(NEO_X, NEO_Y + 6, 20, 4.6, 0, 0, Math.PI * 2); g.fillStyle = mau(b.bong, 0.35); g.fill()
    dat(g, new BoHinh(b, k, false).ma(Math.max(0, Math.min(3, o.doi | 0)), false, 0), NEO_X, NEO_Y)
    g.save(); g.translate(NEO_X - MA_OX, NEO_Y - MA_OY)
    veDoTrenMa(g, b, o.mac)
    g.restore()
  }
  if (o.mo) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = mau(b.giay, 0.55); g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'source-over' }
  return true
}
