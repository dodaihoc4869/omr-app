// VẼ MỘT KHUNG HÌNH của trò «Sinh Tồn · Trang vở» (bản 2 — thầy duyệt 13/11: docs/ban-ve-sinh-ton-v2-1311/01-tran-844.jpg, 04-trung-ha-chuoi, 19-sau-khau-sung,
// 21-xuat-hien-dau-van, 22-song-lai). Không giữ trạng thái trò: nhận «cảnh» (bản đồ, tâm nhìn, nhân vật đã nội suy, hiệu ứng) và vẽ.
// NHẸ (cổng tốc độ của đặc tả mục 7): nền = ô mẫu tô theo ĐIỂM ẢNH THIẾT BỊ (sinh-ton-san.ts), mọi vật thể / chữ / bảng tên + vạch máu là ẢNH NƯỚNG SẴN
// (bảng tên nướng lại khi máu đổi bậc 10%); KHÔNG shadowBlur, KHÔNG filter, KHÔNG gradient tạo mỗi khung, KHÔNG phủ 'lighter'. Chỉ đạn (vài nét) và hiệu ứng
// xuất hiện (ngắn) vẽ nét mỗi khung. Thứ tự: ngoài trang → nền ô li → trang (lề, gáy, công thức, trại) → vết mực → hộp tiếp tế → đường chạm → bóng bé ma →
// vật chặn + bụi + bé ma xếp theo chiều sâu (mép dưới) → bé ma trong bụi mà em thấy → đạn → gạch chéo ngoài vòng + vòng nét đứt → bảng tên → số máu bay.
import { DAN_BAY_MS, NHIP_BAN_MS, capSung, type BanDo, type Diem, type LoaiHop, type Toi, type Vong } from '../../lib/live-khoi/sinh-ton-loi'
import type { SinhTonGui } from '../../lib/live-khoi/kieu'
import { HINH_MA, MA_H, MA_OX, MA_OY, MA_W, SUNG_DAI, dat, duong, loaiTuong, mau, mauHop, pha, type BangMau, type BoHinh, type P, type Rgb } from './sinh-ton-hinh'
import { lamTronTi, veTrang, type BoO, type BoSan } from './sinh-ton-san'

const TAU = Math.PI * 2
/** Thời gian hiệu ứng «hiện ra» (vào trận / sống lại), nằm trong thời gian bất tử thật. */
export const HIEN_MS = 800
/** Tuổi thọ hiệu ứng: vết mực · số máu bay. */
export const MUC_MS = 1400
export const SO_MS = 750

export interface NvVe {
  id: string; x: number; y: number; mau: number; doi: number; cap: number
  /** Góc nòng súng (rad, 0 = phải). */ goc: number
  /** Đang bắn tới (dx, dy) — toạ độ sân (chân) của mục tiêu. */ ban: boolean; dx: number; dy: number
  toi: boolean
  /** Cùng đội với em (gạch chân tên màu đội). */ dong: boolean
  /** Độ đậm 0..1 (mất kết nối / ẩn trong bụi thì mờ). */ mo: number
  ten: string
  /** Đứng trong bụi mà em vẫn thấy ⇒ vẽ SAU bụi. */ an: boolean
  /** Đang hiện ra: tiến độ 0..1 (âm = không); `song` = sống lại (cục giấy vo mở ra). */ hien: number; song: boolean
  /** Còn bất tử sau khi hiện (vòng nhấp nháy). */ batTu: boolean
  /** Bản 2 đợt 2: thủ khoa đang bị truy nã (vương miện + tên đỏ) · đang có khiên / chạy nhanh (hộp tiếp tế) · hướng chạy (rad, NaN = đứng) · biểu cảm ('' = không). */
  tk: boolean; khien: boolean; nhanh: boolean; gio: number; bc: string
}
/** Hiệu ứng ngắn: vết mực khi trúng · số máu / «+1» bay lên. */
export interface Hieu { k: 'muc' | 'so'; x: number; y: number; doi: number; luc: number; chu: string; mau: 'sai' | 'sao' | 'dung' }
export interface Canh {
  g: CanvasRenderingContext2D; W: number; H: number; dpr: number
  /** Điểm ảnh CSS cho một đơn vị sân (đã làm tròn `lamTronTi`), và tâm nhìn (toạ độ sân). */ ti: number; cx: number; cy: number
  bd: BanDo; bang: BangMau; hinh: BoHinh; san: BoSan; ten: BoTen
  /** Kiểu PHẲNG: bé ma 1 khung, không nhún, không khối 3D (ảnh do BoHinh nướng theo kiểu). */ phang: boolean
  /** Bản ÊM (phòng chờ ca kiểm tra): không chớp nòng, vòng bất tử không nhấp nháy. */ em: boolean
  /** `luc` = đồng hồ khung hình (ms), `vong` = vòng an toàn lúc này. */ luc: number; vong: Vong
  nv: NvVe[]; hopCo: boolean; nghi: boolean
  /** Loại hộp tiếp tế đang nằm giữa sân (`loaiHop(hopSo(nay))`). */ hopLoai: LoaiHop
  /** Đường «chạm để tới» của em (gồm điểm đang đứng ở đầu) hoặc null. */ duong: Diem[] | null
  hieu: Hieu[]
  /** Máy YẾU: bỏ công thức / hình vẽ chơi, ít hạt (giấy hoa, sao). */ yeu: boolean
  /** Ô nướng sẵn lớp dưới (null = vẽ thẳng); `ranh` = khung này còn dư sức để nướng trước ô kề. */ o: BoO | null; ranh: boolean
}

// ── Chữ trên màn: câu hô «hành trình thi cử» (đặc tả mục «Câu hô») ──
/** Câu chuỗi hạ: 2 · 3 · 4 · từ 5 lượt hạ liên tiếp (chưa bị hạ); dưới 2 ⇒ ''. */
export const cauChuoi = (n: number): string => (n >= 5 ? 'Không ai cản nổi!' : n === 4 ? 'Á khoa!' : n === 3 ? 'Đỗ đại học!' : n === 2 ? 'Đỗ tốt nghiệp!' : '')
/** Hạng đội cuối ván (theo số đội có lượt hạ CAO HƠN hẳn). */
export const XEP_DOI = ['Đỗ thủ khoa', 'Đỗ á khoa', 'Đỗ vớt', 'Thi lại ván sau'] as const
/** Đuôi thẻ «bị hạ»: bản êm (phòng chờ ca, ngay trước giờ kiểm tra thật) KHÔNG dùng chữ «trượt». */
export const duoiBiHa = (banEm: boolean): string => (banEm ? 'vừa hạ em' : 'vừa đánh trượt em')
/** Bốn nhãn biểu cảm cố định (chỉ số = `e` gửi phòng; không chữ tự do) + ký hiệu trên nhãn tròn. */
export const BIEU_CAM = ['Hay quá!', 'Cứu với!', 'Theo tớ!', 'Haha'] as const
export const KY_BIEU_CAM = ['♥', '!!', '→', 'ha'] as const
/** Thẻ báo khi EM nhặt hộp (ảnh 09): [tên đậm, phần giải thích]. */
export const THE_HOP: Record<LoaiHop, readonly [string, string]> = {
  mau: ['Hồi đầy máu', 'máu về 100'], khien: ['Khiên 5 giây', 'đạn không trúng được em'], nhanh: ['Chạy nhanh 6 giây', 'em chạy nhanh hơn các bạn'], sao: ['Pháo Sao 10 giây', 'súng tạm lên cấp 6'],
}

// ── Khung nhìn của máy em (dùng chung vòng vẽ, chạm để tới, chạm bé ma của em) ──
/** Nửa đường chéo khung nhìn tối đa (đơn vị sân) — hợp đồng «chỉ gửi gần» (kieu.ts): ≤ ~850 = 1100 − 250 trượt, rộng hơn thì góc màn thấy người hiện đột ngột. */
export const NUA_CHEO_TOI_DA = 840
/** Điểm ảnh CSS cho một đơn vị sân: máy thầy thấy cả sân; máy em thấy CÙNG diện tích sân (máy to không nhìn xa hơn máy nhỏ) nhưng không quá NUA_CHEO_TOI_DA. */
export function tiMan(W: number, H: number, dpr: number, xem: boolean, bd: BanDo): number {
  if (xem) return lamTronTi(Math.min(W / (bd.rong + 40), H / (bd.cao + 40)), dpr)
  const can = Math.hypot(W, H) / 2 / NUA_CHEO_TOI_DA
  let ti = lamTronTi(Math.max(0.5, can, Math.min(1.7, Math.sqrt((W * H) / (1000 * 520)))), dpr)
  if (ti < can) ti = (Math.round(256 * ti * dpr) + 1) / (256 * dpr)
  return ti
}
/** Tâm nhìn (toạ độ sân) khi em đứng ở (x, y): theo em, kẹp mép sân (lùi 40), sân lọt hẳn màn thì đặt giữa. */
export function camNhin(bd: BanDo, W: number, H: number, ti: number, x: number, y: number): Diem {
  let cx = Math.max(W / 2 / ti - 40, Math.min(bd.rong + 40 - W / 2 / ti, x)), cy = Math.max(H / 2 / ti - 40, Math.min(bd.cao + 40 - H / 2 / ti, y - 34))
  if (W / ti >= bd.rong + 80) cx = bd.rong / 2
  if (H / ti >= bd.cao + 80) cy = bd.cao / 2
  return { x: cx, y: cy }
}
/** Tâm thân bé ma của em (đứng ở (x, y) trên sân) theo toạ độ KHUNG (px). */
export const diemMaEm = (x: number, y: number, cam: Diem, ti: number, W: number, H: number): Diem => ({ x: (x - cam.x) * ti + W / 2, y: (y - 36 - cam.y) * ti + H / 2 })
/** Chạm (px, py — toạ độ khung) có trúng thân bé ma của em không — trúng ⇒ mở bốn nhãn biểu cảm thay vì «chạm để tới». Bán kính rộng ≥ 34 px. */
export const chamMaEm = (px: number, py: number, ma: Diem, ti: number): boolean => Math.hypot(px - ma.x, py - ma.y) <= Math.max(34, 40 * ti)
/** Gói gửi phòng: `p[3]` = cấp súng ĐANG DÙNG (`capSung`: đang Pháo Sao ⇒ 6), không phải cấp thật. */
export function taoGoi(tt: Toi, nay: number, chet: boolean, mucTieu: string): SinhTonGui {
  const goi: SinhTonGui = { p: [Math.round(tt.x), Math.round(tt.y), chet ? 0 : Math.max(1, Math.round(tt.mau)), capSung(tt, nay)] }
  if (mucTieu) goi.t = mucTieu
  return goi
}

export const bamSo = (id: string): number => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997; return h }
/** Độ nhún lơ lửng của bé ma (đơn vị sân) — bảng tên đi cùng. */
const loLung = (n: NvVe, luc: number, phang: boolean): number => (phang ? 0 : Math.sin(luc / 260 + bamSo(n.id)) * 3)

// ── Bảng tên + vạch máu NƯỚNG SẴN theo điểm ảnh màn (nướng lại khi tên / đội / máu đổi bậc 10%) ──
interface The { khoa: string; c: HTMLCanvasElement; w: number; h: number }
export class BoTen {
  private nho = new Map<string, The>()
  private doRong: CanvasRenderingContext2D | null = null
  private b: BangMau; private dpr: number
  /** Cỡ chữ (điểm ảnh CSS). */ readonly co: number
  constructor(b: BangMau, dpr: number, co: number) { this.b = b; this.dpr = dpr; this.co = co }
  lay(n: NvVe): The {
    const bac = Math.max(0, Math.min(10, Math.ceil(n.mau / 10))), khoa = `${n.ten}|${n.doi}|${+n.toi}|${+n.dong}|${+n.tk}|${bac}`
    const cu = this.nho.get(n.id)
    if (cu && cu.khoa === khoa) return cu
    if (this.nho.size > 240) this.nho.clear()
    const moi = this.nuong(n, bac, khoa)
    this.nho.set(n.id, moi)
    return moi
  }
  private nuong(n: NvVe, bac: number, khoa: string): The {
    // Thủ khoa đang bị truy nã: tên đỏ «… · Thủ khoa» (ảnh 07).
    const b = this.b, co = n.toi ? this.co + 2 : this.co, font = `${co}px ${b.phong}`, c = document.createElement('canvas'), ten = n.tk ? `${n.ten} · Thủ khoa` : n.ten
    this.doRong ??= document.createElement('canvas').getContext('2d')
    let tw = ten.length * co * 0.45
    if (this.doRong) { this.doRong.font = font; tw = this.doRong.measureText(ten).width }
    const bw = Math.round(co * 2.3), w = Math.ceil(Math.max(tw + 12, bw + 4)), h = Math.ceil(co + 13)
    c.width = Math.ceil(w * this.dpr); c.height = Math.ceil(h * this.dpr)
    const g = c.getContext('2d')
    if (g) {
      g.scale(this.dpr, this.dpr)
      const md = b.doi[n.doi] ?? b.muc
      if (n.toi) { g.fillStyle = mau(b.sao, 0.4); g.fillRect(w / 2 - tw / 2 - 4, 1, tw + 8, co + 2) }
      else if (n.dong) { g.fillStyle = mau(md, 0.85); g.fillRect(w / 2 - tw / 2, co + 2, tw, 1.6) }
      g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round'
      g.lineWidth = 3; g.strokeStyle = mau(b.giay, 0.85); g.strokeText(ten, w / 2, co)
      g.fillStyle = mau(n.tk ? b.sai : b.muc, 0.95); g.fillText(ten, w / 2, co)
      const bx = (w - bw) / 2, by = co + 5
      g.fillStyle = mau(b.giay, 0.9); g.fillRect(bx, by, bw, 5)
      g.fillStyle = mau(bac <= 3 ? b.sai : md); g.fillRect(bx, by, (bw * bac) / 10, 5)
      g.strokeStyle = mau(b.muc, 0.8); g.lineWidth = 1; g.strokeRect(bx, by, bw, 5)
    }
    return { khoa, c, w, h }
  }
  boNho(): number { let s = 0; for (const t of this.nho.values()) s += t.c.width * t.c.height * 4; return s }
}

/** Ô kê sắp xếp theo chiều sâu (dùng lại giữa các khung, không sinh rác). */
interface O { y: number; t: 0 | 1 | 2 | 3; i: number }
const ke: O[] = []

export function veKhung(c: Canh): void {
  const { g, W, H, dpr, ti, bd, bang: b, hinh: h, luc, phang } = c
  const ox = W / 2 - c.cx * ti, oy = H / 2 - c.cy * ti
  const x0 = c.cx - W / 2 / ti, y0 = c.cy - H / 2 / ti, x1 = c.cx + W / 2 / ti, y1 = c.cy + H / 2 / ti
  const sanT = (): void => g.setTransform(dpr * ti, 0, 0, dpr * ti, dpr * ox, dpr * oy)
  const trong = (x: number, y: number, r: number): boolean => x > x0 - r && x < x1 + r && y > y0 - r && y < y1 + r
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.lineDashOffset = 0; g.lineCap = 'round'; g.lineJoin = 'round'
  // ── Ngoài trang (mặt bàn) + bóng tờ giấy: chỉ khi mép sân lọt vào màn ──
  const kinSan = x0 >= 0 && y0 >= 0 && x1 <= bd.rong && y1 <= bd.cao
  if (!kinSan) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = mau(b.ban); g.fillRect(0, 0, W, H)
    sanT(); g.fillStyle = mau(b.bong, b.bongA * 1.4); g.fillRect(8, 10, bd.rong, bd.cao)
  }
  // ── Nền ô li: ô mẫu tô theo ĐIỂM ẢNH THIẾT BỊ (chỉ dời nguyên điểm ảnh) ──
  const k = dpr * ti, px = Math.round(dpr * ox), py = Math.round(dpr * oy)
  // Ô nướng sẵn: lớp dưới (nền + trang, kiểu phẳng cả vật chặn) dán từ ô; không đủ trần bộ nhớ ⇒ vẽ thẳng như cũ.
  const tren = c.o ? c.o.ve(g, px, py, x0, y0, x1, y1, c.ranh) : false
  const gop = tren && phang
  if (!tren) {
    const ax = Math.max(0, Math.round(px + Math.max(0, x0) * k)), ay = Math.max(0, Math.round(py + Math.max(0, y0) * k))
    const bx = Math.min(Math.ceil(W * dpr), Math.round(px + Math.min(bd.rong, x1) * k)), by = Math.min(Math.ceil(H * dpr), Math.round(py + Math.min(bd.cao, y1) * k))
    g.setTransform(1, 0, 0, 1, px, py)
    g.fillStyle = c.san.nen ?? mau(b.giay); g.fillRect(ax - px, ay - py, bx - ax, by - ay)
  }
  sanT()
  if (!tren) veTrang(g, b, h, bd, x0, y0, x1, y1, !c.yeu)
  // ── Vết mực (dưới mọi thứ) ──
  for (const e of c.hieu) {
    if (e.k !== 'muc' || !trong(e.x, e.y, 30)) continue
    const t = (luc - e.luc) / MUC_MS
    if (t < 0 || t > 1) continue
    g.globalAlpha = 0.9 * (1 - t * t); dat(g, h.vet(e.doi, e.luc % 3), e.x, e.y)
  }
  g.globalAlpha = 1
  // ── Hộp tiếp tế (giấy nhớ) giữa sân + vòng nhặt nét đứt ──
  const hx = bd.rong / 2, hy = bd.cao / 2
  if (c.hopCo && trong(hx, hy, 80)) {
    const nhip = phang ? 0.3 : (luc / 600) % 1
    g.beginPath(); g.ellipse(hx, hy + 4, 36 + nhip * 6, 22 + nhip * 4, 0, 0, TAU); g.setLineDash([6, 6]); g.strokeStyle = mau(mauHop(b, c.hopLoai), 0.9 - nhip * 0.6); g.lineWidth = 2.4; g.stroke(); g.setLineDash([])
    dat(g, h.hop(c.hopLoai), hx, hy - 4 - (phang ? 0 : Math.sin(luc / 300) * 2))
  }
  // ── Đường «chạm để tới» của em ──
  if (c.duong && c.duong.length > 1) {
    g.beginPath(); g.moveTo(c.duong[0].x, c.duong[0].y)
    for (let i = 1; i < c.duong.length; i++) g.lineTo(c.duong[i].x, c.duong[i].y)
    g.setLineDash([2, 13]); g.lineWidth = 5; g.strokeStyle = mau(b.muc, 0.8); g.stroke(); g.setLineDash([])
    const d = c.duong[c.duong.length - 1]
    g.beginPath(); g.ellipse(d.x, d.y, 26, 10, 0, 0, TAU); g.lineWidth = 2.6; g.stroke()
  }
  // ── Bóng dưới bé ma (lơ lửng) ──
  const bong = h.bong()
  for (const n of c.nv) if (n.mau > 0 && n.hien < 0 && trong(n.x, n.y, 40)) { g.globalAlpha = n.mo; dat(g, bong, n.x, n.y + 2) }
  g.globalAlpha = 1
  // ── Vật chặn + bé ma theo chiều sâu (mép dưới) ──
  let m = 0
  const them = (y: number, t: 0 | 1 | 2 | 3, i: number): void => { const o = ke[m] ?? (ke[m] = { y: 0, t: 0, i: 0 }); o.y = y; o.t = t; o.i = i; m++ }
  if (!gop) for (let i = 0; i < bd.tuong.length; i++) { const t = bd.tuong[i]; if (trong(t.x + t.w / 2, t.y + t.h / 2, Math.max(t.w, t.h))) them(t.y + t.h, 0, i) }
  if (!gop) for (let i = 0; i < bd.thung.length; i++) { const t = bd.thung[i]; if (trong(t.x + t.w / 2, t.y + t.h / 2, t.w + 30)) them(t.y + t.h, 1, i) }
  for (let i = 0; i < c.nv.length; i++) { const n = c.nv[i]; if (!n.an && trong(n.x, n.y - 30, 70)) them(n.y, 2, i) }
  // Bụi cũng xếp theo mép dưới: bé ma đứng TRONG bụi (chân trên mép dưới) bị bụi che; đứng ngay dưới bụi thì nổi trước bụi.
  for (let i = 0; i < bd.bui.length; i++) { const t = bd.bui[i]; if (trong(t.x + t.w / 2, t.y + t.h / 2, Math.max(t.w, t.h))) them(t.y + t.h, 3, i) }
  const xep = ke.slice(0, m).sort((a, b2) => a.y - b2.y)
  for (const o of xep) {
    if (o.t === 0) { const t = bd.tuong[o.i]; dat(g, h.vat(loaiTuong(t.w, t.h, o.i), t.w, t.h), t.x, t.y) }
    else if (o.t === 1) { const t = bd.thung[o.i]; dat(g, h.vat('tay', t.w, t.h), t.x, t.y) }
    else if (o.t === 3) { const t = bd.bui[o.i]; dat(g, h.bui(t.w, t.h), t.x, t.y) }
    else veMa(c, c.nv[o.i])
  }
  // ── Bé ma trong bụi mà em vẫn thấy (em, đồng đội, đang bắn, máy thầy): vẽ lại SAU bụi ──
  for (const n of c.nv) if (n.an && trong(n.x, n.y - 30, 70)) veMa(c, n)
  // ── Đạn (vị trí tính từ đồng hồ, không lưu trạng thái) ──
  for (const n of c.nv) if (n.ban && n.mau > 0 && n.hien < 0 && (trong(n.x, n.y, 120) || trong(n.dx, n.dy, 120))) veDan(c, n)
  // ── Ngoài vòng an toàn: gạch chéo bút đỏ (tô theo điểm ảnh thiết bị) + viền nét đứt — bỏ hẳn khi cả khung nhìn nằm trong vòng ──
  const v = c.vong, trongV = (x: number, y: number): boolean => ((x - v.cx) / v.rx) ** 2 + ((y - v.cy) / v.ry) ** 2 <= 1
  if (!(trongV(x0, y0) && trongV(x1, y0) && trongV(x0, y1) && trongV(x1, y1))) {
    if (c.san.gach) {
      g.setTransform(1, 0, 0, 1, px, py); g.beginPath(); g.rect(-px, -py, Math.ceil(W * dpr), Math.ceil(H * dpr)); g.ellipse(v.cx * k, v.cy * k, v.rx * k, v.ry * k, 0, 0, TAU)
      g.fillStyle = c.san.gach; g.fill('evenodd')
    }
    sanT()
    g.beginPath(); g.ellipse(v.cx, v.cy, v.rx, v.ry, 0, 0, TAU); g.setLineDash([16, 9]); g.lineDashOffset = phang ? 0 : -luc / 60
    g.strokeStyle = mau(b.sai, 0.9); g.lineWidth = Math.max(3.2, 1.6 / ti); g.stroke(); g.setLineDash([]); g.lineDashOffset = 0
  }
  // ── Bong bóng biểu cảm (ảnh nướng; mũi đuôi trên đầu, lệch phải — cao hơn khi có vương miện / lửa của em) ──
  for (const n of c.nv) if (n.bc && n.mau > 0 && n.hien < 0 && trong(n.x, n.y - 70, 90)) dat(g, h.loi(n.bc), n.x + 10, n.y - (n.toi ? 92 : n.tk ? 88 : 66) + loLung(n, luc, phang))
  // ── Bảng tên + vạch máu (ảnh nướng theo điểm ảnh màn) ──
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  for (const n of c.nv) {
    if (!n.ten || n.mau <= 0 || !trong(n.x, n.y, 60)) continue
    const t = c.ten.lay(n), yg = n.y - 6 + loLung(n, luc, phang)
    g.globalAlpha = Math.max(0.6, n.mo)
    g.drawImage(t.c, (n.x - c.cx) * ti + W / 2 - t.w / 2, (yg + 3 - c.cy) * ti + H / 2, t.w, t.h)
  }
  g.globalAlpha = 1
  // ── Số máu vừa mất / «+1» bay lên ──
  const coSo = Math.max(14, Math.min(20, 24 * ti))
  g.font = `${coSo}px ${b.phong}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineWidth = 4
  for (const e of c.hieu) {
    if (e.k !== 'so') continue
    const t = (luc - e.luc) / SO_MS
    if (t < 0 || t > 1 || !trong(e.x, e.y, 40)) continue
    const sx = (e.x - c.cx) * ti + W / 2, sy = (e.y - c.cy) * ti + H / 2 - t * 22
    g.globalAlpha = 1 - t * t
    g.strokeStyle = mau(b.giay, 0.95); g.strokeText(e.chu, sx, sy)
    g.fillStyle = mau(e.mau === 'dung' ? b.dung : e.mau === 'sao' ? b.sao : b.sai); g.fillText(e.chu, sx, sy)
  }
  g.globalAlpha = 1; g.textAlign = 'start'
  g.setTransform(1, 0, 0, 1, 0, 0)
}

/** Một bé ma (đang ở hệ toạ độ sân). Bị hạ ⇒ cục giấy vo. */
function veMa(c: Canh, n: NvVe): void {
  const { g, bang: b, hinh: h, luc, phang } = c
  if (n.hien >= 0 && n.mau > 0) { hienRa(c, n); return }
  g.globalAlpha = n.mo
  if (n.mau <= 0) { dat(g, h.vo(), n.x, n.y - 8); g.globalAlpha = 1; return }
  const trai = Math.cos(n.goc) < 0, hs = bamSo(n.id), khung = Math.floor(luc / 150 + (hs & 1)) & 1, y = n.y - 6 + loLung(n, luc, phang)
  if (n.batTu) {
    const nhap = c.em || phang ? 0.75 : 0.55 + Math.sin(luc / 90) * 0.35
    g.beginPath(); g.ellipse(n.x, y - 30, 32, 38, 0, 0, TAU); g.setLineDash([4, 5]); g.lineDashOffset = phang ? 0 : luc / 40
    g.strokeStyle = mau(b.sao, nhap); g.lineWidth = 3; g.stroke(); g.setLineDash([]); g.lineDashOffset = 0
    dat(g, h.chu('Bất tử 2 giây', 14, b.sao, 1, true), n.x, y - 74)
  }
  // Chạy nhanh (hộp tiếp tế): ba vệt gió ngắn sau lưng, ngược hướng chạy.
  if (n.nhanh && !Number.isNaN(n.gio)) {
    const ux = Math.cos(n.gio), uy = Math.sin(n.gio), troi = phang ? 0 : (luc / 40) % 8
    g.beginPath(); for (const [ngang, dai] of [[-10, 14], [0, 20], [10, 14]]) { const x0 = n.x - ux * (24 + troi) - uy * ngang, y0 = y - 30 - uy * (24 + troi) + ux * ngang; g.moveTo(x0, y0); g.lineTo(x0 - ux * dai, y0 - uy * dai) }
    g.strokeStyle = mau(b.muc, 0.55); g.lineWidth = 2; g.stroke()
  }
  dat(g, h.ma(n.doi, trai, khung), n.x, y)
  // súng xoay theo hướng ngắm, gắn ở tay phía trước (chĩa trái thì lật dọc để súng không lộn ngược)
  g.save(); g.translate(n.x + (trai ? -12 : 12), y - 30); g.rotate(n.goc); if (trai) g.scale(1, -1)
  dat(g, h.sung(n.doi, n.cap), 0, 0)
  if (n.ban && !c.em && (luc + bamSo(n.id) * 37) % NHIP_BAN_MS[n.cap - 1] < 90) {
    const L = SUNG_DAI[n.cap - 1]
    g.beginPath(); for (const a of [-0.5, 0, 0.5]) { g.moveTo(L + 2, 0); g.lineTo(L + 9 + Math.cos(a) * 4, Math.sin(a) * 7) }
    g.strokeStyle = mau(b.sao); g.lineWidth = 2.4; g.stroke()
  }
  g.restore()
  if (n.toi) dat(g, h.lua(n.doi), n.x, y - 64)
  // Thủ khoa đang bị truy nã: vương miện trên đầu (của em thì trên ngọn lửa).
  if (n.tk) dat(g, h.vuong(), n.x, y - (n.toi ? 86 : 64))
  // Khiên (hộp tiếp tế): bong bóng nét đứt màu tin bao quanh bé ma — cả lớp thấy.
  if (n.khien) {
    g.beginPath(); g.ellipse(n.x, y - 30, 31, 36, 0, 0, TAU); g.fillStyle = mau(b.tin, 0.14); g.fill()
    g.setLineDash([7, 5]); g.lineDashOffset = phang ? 0 : luc / 50; g.strokeStyle = mau(b.tin, 0.95); g.lineWidth = 2.4; g.stroke(); g.setLineDash([]); g.lineDashOffset = 0
  }
  g.globalAlpha = 1
}

/** HIỆN RA kiểu «được vẽ ra từ nét bút» (vào trận) / «cục giấy vo mở ra rồi vẽ lại» (sống lại): nét chì chạy quanh viền → bút dạ quét màu → bung
 *  vòng mực + giấy hoa + sao + chữ «Vào trận!» / «Thi lại!». Kiểu phẳng: hiện mờ dần (một ảnh). */
function hienRa(c: Canh, n: NvVe): void {
  const { g, bang: b, hinh: h } = c, md = b.doi[n.doi] ?? b.muc, y = n.y - 6, ox = n.x - MA_OX, oy = y - MA_OY, trai = Math.cos(n.goc) < 0
  const chu = h.chu(n.song ? 'Thi lại!' : 'Vào trận!', n.toi ? 22 : 18, n.song ? b.sao : md, 1, true)
  if (c.phang) { g.globalAlpha = Math.min(1, n.hien * 1.5); dat(g, h.ma(n.doi, trai, 0), n.x, y); dat(g, chu, n.x, oy + 6); g.globalAlpha = 1; return }
  let p = n.hien
  if (n.song) {
    if (p < 0.25) { const q = p / 0.25; g.save(); g.translate(n.x, y - 24); g.rotate(q * 2.4); g.scale(1 + q * 1.5, 1 + q * 1.1); g.globalAlpha = 1 - q * 0.5; dat(g, h.vo(), 0, 0, 1.4); g.restore(); g.globalAlpha = 1 }
    p = (p - 0.2) / 0.8
  }
  if (p > 0) {
    const pts: P[] = HINH_MA.map(([x, yy]) => [ox + x, oy + yy] as P)
    if (p < 0.4) {
      const q = p / 0.4
      let dai = 0
      for (let i = 0; i < pts.length; i++) { const a = pts[i], e = pts[(i + 1) % pts.length]; dai += Math.hypot(e[0] - a[0], e[1] - a[1]) }
      duong(g, pts, true); g.setLineDash([dai * q, dai]); g.strokeStyle = mau(b.muc); g.lineWidth = 2.4; g.stroke(); g.setLineDash([])
      // cây bút chì nhỏ ở đầu nét
      let con = dai * q, tx = pts[0][0], ty = pts[0][1]
      for (let i = 0; i < pts.length; i++) { const a = pts[i], e = pts[(i + 1) % pts.length], d = Math.hypot(e[0] - a[0], e[1] - a[1]); if (con <= d) { tx = a[0] + ((e[0] - a[0]) * con) / d; ty = a[1] + ((e[1] - a[1]) * con) / d; break } con -= d }
      g.save(); g.translate(tx, ty); g.rotate(-0.8)
      g.fillStyle = mau(b.sao); g.fillRect(4, -3.5, 22, 7); g.fillStyle = mau(pha(b.sai, b.giay, 0.4)); g.fillRect(24, -3.5, 5, 7)
      g.beginPath(); g.moveTo(4, -3.5); g.lineTo(-4, 0); g.lineTo(4, 3.5); g.closePath(); g.fillStyle = mau(pha(b.sao, b.muc, 0.3)); g.fill()
      g.strokeStyle = mau(b.muc); g.lineWidth = 1.2; g.strokeRect(4, -3.5, 25, 7); g.restore()
    } else if (p < 0.75) {
      const q = (p - 0.4) / 0.35
      duong(g, pts, true); g.strokeStyle = mau(b.muc); g.lineWidth = 2.4; g.stroke()
      g.save(); g.beginPath(); g.rect(ox, oy, MA_W * q, MA_H); g.clip(); dat(g, h.ma(n.doi, trai, 0), n.x, y); g.restore()
      g.fillStyle = mau(md, 0.55); g.fillRect(ox + MA_W * q - 5, oy + 8, 10, 64)
      g.fillStyle = mau(b.sao, 0.6); g.fillRect(ox + MA_W * q - 1.5, oy + 10, 3, 60)
    } else {
      const q = (p - 0.75) / 0.25, bung = 1 + Math.sin(q * Math.PI) * 0.22, cy = y - 30
      dat(g, h.ma(n.doi, trai, 0), n.x, y, bung)
      g.beginPath(); g.ellipse(n.x, cy, 24 + q * 74, 16 + q * 50, 0, 0, TAU); g.setLineDash([10, 6]); g.strokeStyle = mau(md, 1 - q * 0.7); g.lineWidth = 7 * (1 - q) + 1.5; g.stroke(); g.setLineDash([])
      g.beginPath(); g.ellipse(n.x, cy, 14 + q * 44, 10 + q * 30, 0, 0, TAU); g.strokeStyle = mau(b.sao, 0.9 - q * 0.6); g.lineWidth = 3; g.stroke()
      const HOA: Rgb[] = [md, b.sao, b.tin, b.sai], nHoa = c.yeu ? 4 : 14, nSao = c.yeu ? 2 : 4
      for (let i = 0; i < nHoa; i++) {
        const a = (i / nHoa) * TAU + 0.3, r = 26 + q * 70
        g.save(); g.translate(n.x + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75 + q * q * 18); g.rotate(a + q * 6); g.fillStyle = mau(HOA[i % 4], 1 - q * 0.5); g.fillRect(-4, -2, 8, 4); g.restore()
      }
      const sao = h.sao(n.doi)
      for (let i = 0; i < nSao; i++) { const a = (i / nSao) * TAU + 0.8, r = 20 + q * 46; dat(g, sao, n.x + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7, 0.8) }
    }
  }
  dat(g, chu, n.x, oy + 6)
}

/** Sáu kiểu đạn (nét mỗi khung, rẻ; chỉ sao Pháo Sao là ảnh nướng). Mọi đạn có viền phấn để nổi trên nền. Chạm đích ⇒ vòng nổ ngắn (Bọt vỡ, Pháo Sao nổ lan to hơn). */
function veDan(c: Canh, n: NvVe): void {
  const { g, bang: b, hinh: h, luc } = c, cap = n.cap, md = b.doi[n.doi] ?? b.muc, m = b.muc
  const trai = Math.cos(n.goc) < 0, gx = n.x + (trai ? -12 : 12), gy = n.y - 36, L = SUNG_DAI[cap - 1]
  const xa = gx + Math.cos(n.goc) * L, ya = gy + Math.sin(n.goc) * L, xb = n.dx, yb = n.dy - 36
  const pha0 = (luc + bamSo(n.id) * 37) % NHIP_BAN_MS[cap - 1], t = pha0 / DAN_BAY_MS[cap - 1]
  if (t > 1.35) return
  if (t > 1) { // chạm đích
    const q = (t - 1) / 0.35, R = cap === 6 ? 60 : cap === 3 ? 40 : 12
    g.beginPath(); g.ellipse(xb, yb, 4 + q * R, (4 + q * R) * 0.8, 0, 0, TAU); g.strokeStyle = mau(cap === 6 ? b.sao : md, 0.9 * (1 - q)); g.lineWidth = cap === 6 || cap === 3 ? 3 : 2; g.stroke()
    return
  }
  const dx = xb - xa, dy = yb - ya, dai = Math.hypot(dx, dy) || 1, ux = dx / dai, uy = dy / dai, x = xa + dx * t, y = ya + dy * t
  const Pt = (lui: number, ngang = 0): P => [x - ux * lui - uy * ngang, y - uy * lui + ux * ngang]
  const net = (w: number, cm: Rgb, a = 1): void => { g.strokeStyle = mau(cm, a); g.lineWidth = w; g.stroke() }
  const tron = (p: P, r: number): void => { g.beginPath(); g.arc(p[0], p[1], r, 0, TAU) }
  if (cap === 1) { // Hạt mực: viên tròn + hai hạt kéo đuôi + vệt tốc độ
    g.beginPath(); for (const s of [-3, 3]) { g.moveTo(...Pt(7, s)); g.lineTo(...Pt(20, s)) } net(1.4, m, 0.35)
    tron(Pt(16), 1.6); g.fillStyle = mau(md, 0.35); g.fill(); tron(Pt(9), 2.3); g.fillStyle = mau(md, 0.6); g.fill()
    tron(Pt(0), 3.6); g.fillStyle = mau(md); g.fill(); net(1.4, m)
  } else if (cap === 2) { // Song tia: hai vạch song song + chấm lửa đầu tia
    g.beginPath(); for (const s of [-3.6, 3.6]) { g.moveTo(...Pt(14, s)); g.lineTo(...Pt(0, s)) } net(5, m); net(3, md)
    g.beginPath(); for (const s of [-3.6, 3.6]) { g.moveTo(...Pt(10, s)); g.lineTo(...Pt(2, s)) } net(1.2, b.giay, 0.8)
  } else if (cap === 3) { // Bọt khí: bọt to rung rinh + hai bọt con
    const r = 7 + Math.sin(luc / 70 + n.x) * 0.9
    for (const [lui, rr] of [[13, 2.6], [20, 1.7]]) { tron(Pt(lui, Math.sin(luc / 90 + lui) * 2), rr); g.fillStyle = mau(md, 0.25); g.fill(); net(1.1, md, 0.8) }
    g.beginPath(); g.ellipse(x, y, r * 1.08, r * 0.94, Math.atan2(uy, ux), 0, TAU); g.fillStyle = mau(md, 0.28); g.fill(); net(2.2, m); net(1.2, md)
    g.beginPath(); g.arc(x - 2.2, y - 2.2, r * 0.55, Math.PI * 1.05, Math.PI * 1.6); net(1.8, m, 0.9)
  } else if (cap === 4) { // Tia sấm gấp khúc có nhánh, tóe điện ở mũi
    const nhay = Math.floor(luc / 60) % 2 ? 1 : -1
    g.beginPath(); for (let i = 0; i <= 6; i++) { const p = Pt(i * 5, (i % 2 ? 4.6 : -4.6) * nhay); if (i) g.lineTo(...p); else g.moveTo(...p) }
    g.moveTo(...Pt(10, 4.6 * nhay)); g.lineTo(...Pt(15, 11 * nhay)); g.lineTo(...Pt(18, 8 * nhay))
    net(5, m); net(2.6, b.sao)
  } else if (cap === 5) { // Cầu lửa đúng màu thử ngọn lửa của nguyên tố đội (Na vàng · K tím · Cu xanh lục · Ca đỏ cam) + lõi vàng + tàn lửa
    const lo = Math.sin(luc / 45 + n.y) * 2
    g.beginPath(); g.moveTo(...Pt(-6)); g.quadraticCurveTo(...Pt(4, 9), ...Pt(18 + lo, 6)); g.quadraticCurveTo(...Pt(10, 2), ...Pt(24 - lo, 0)); g.quadraticCurveTo(...Pt(10, -2), ...Pt(18 + lo, -6)); g.quadraticCurveTo(...Pt(4, -9), ...Pt(-6))
    g.fillStyle = mau(md, 0.92); g.fill(); net(1.6, m, 0.9)
    tron(Pt(0), 3.6); g.fillStyle = mau(b.sao); g.fill()
    tron(Pt(26 + lo, 4), 1.4); g.fillStyle = mau(b.sao, 0.8); g.fill()
  } else { // Pháo Sao: sao lớn xoay + đuôi sao nhỏ
    const sao = h.sao(n.doi)
    for (const [lui, k2, a] of [[30, 0.4, 0.4], [20, 0.55, 0.55], [11, 0.75, 0.75]]) { g.globalAlpha = a; const p = Pt(lui, Math.sin(lui + luc / 80) * 3); dat(g, sao, p[0], p[1], k2) }
    g.globalAlpha = 1
    g.save(); g.translate(x, y); g.rotate(luc / 110); dat(g, sao, 0, 0, 1.25); g.restore()
  }
}

/** Bản đồ nhỏ trên tờ giấy nhớ (góc phải dưới): vật chặn, bụi, vòng an toàn, đồng đội (trong ảnh + chấm `dd` đồng đội ở xa), em, và SAO ĐỎ của thủ khoa
 *  đang bị truy nã (`tk`). Nét = màu nền trang (mực tối trên giấy vàng). */
export function veBanDoNho(g: CanvasRenderingContext2D, rong: number, cao: number, dpr: number, bd: BanDo, b: BangMau, v: Vong, nv: readonly NvVe[], doiToi: number, dd: readonly number[], tk: Diem | null): void {
  const ti = Math.min(rong / bd.rong, cao / bd.cao)
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, rong, cao)
  g.fillStyle = mau(b.giay, 0.5); for (const t of bd.chan) g.fillRect(t.x * ti, t.y * ti, Math.max(1, t.w * ti), Math.max(1, t.h * ti))
  g.fillStyle = mau(b.doi[2] ?? b.dung, 0.45); for (const t of bd.bui) g.fillRect(t.x * ti, t.y * ti, t.w * ti, t.h * ti)
  for (let d = 0; d < 4; d++) { g.beginPath(); g.arc(bd.trai[d].x * ti, bd.trai[d].y * ti, 4, 0, TAU); g.fillStyle = mau(b.doi[d] ?? b.muc, 0.5); g.fill() }
  g.beginPath(); g.ellipse(v.cx * ti, v.cy * ti, v.rx * ti, v.ry * ti, 0, 0, TAU); g.setLineDash([4, 3]); g.strokeStyle = mau(b.sai); g.lineWidth = 1.4; g.stroke(); g.setLineDash([])
  for (const n of nv) {
    if (n.doi !== doiToi || n.mau <= 0 || n.toi) continue
    g.beginPath(); g.arc(n.x * ti, n.y * ti, 2.4, 0, TAU); g.fillStyle = mau(b.doi[n.doi] ?? b.muc); g.fill()
  }
  if (dd.length > 1) { g.beginPath(); for (let i = 0; i + 1 < dd.length; i += 2) { g.moveTo(dd[i] * ti + 2.4, dd[i + 1] * ti); g.arc(dd[i] * ti, dd[i + 1] * ti, 2.4, 0, TAU) } g.fillStyle = mau(b.doi[doiToi] ?? b.muc); g.fill() }
  if (tk) {
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 2.4 : 5.6; g.lineTo(tk.x * ti + Math.cos(a) * r, tk.y * ti + Math.sin(a) * r) } g.closePath()
    g.fillStyle = mau(b.sai); g.fill(); g.strokeStyle = mau(b.giay); g.lineWidth = 1; g.stroke()
  }
  const toi = nv.find((n) => n.toi)
  if (toi) { g.beginPath(); g.arc(toi.x * ti, toi.y * ti, 3.6, 0, TAU); g.fillStyle = mau(b.doi[toi.doi] ?? b.muc); g.fill(); g.strokeStyle = mau(b.giay); g.lineWidth = 1.2; g.stroke() }
}
