// BI-A PHẢN ỨNG · VẼ BÀN + KHUNG HÌNH (chép từ bản vẽ). Bàn gỗ, nỉ có hoa văn vòng benzene mờ, 6 lỗ, chấm kim cương.
// Khi bàn nằm ngang: hình học vẽ theo toạ độ bàn (ma trận quay), còn BI, BÓNG BI, CHỮ vẽ theo toạ độ màn để đèn luôn góc trên trái.
import { datTFBan, raMan, type KhungBan } from './bo-cuc'
import { duongMatThan } from './du-doan'
import { KL, MAU_QH, PK, kieuBi, type KieuBi, type KiHieu, type QuanHe } from './nguyen-to'
import { KHUNG_ANH, MAU_BI_VANG, huongKhoiTao, taoAnhBi, taoBong, taoMatNa, toBiLan, type Bong, type MatNa } from './ve-bi'
import { DIEM_CHAN, H, LO, R, T, W, type Bi } from './vat-ly'
import type { Pha, VanBia } from './dieu-khien'

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

/** Chỉ bi (nhãn) đang hiện: bi và quan hệ với em. */
export interface ChiBi { id: KiHieu; qh: QuanHe }
/** Mã số pha cho dấu trạng thái vẽ. */
const PHA_SO: Readonly<Record<Pha, number>> = { aim: 0, moving: 1, xet: 2, cau: 3, cho: 4, ai: 5, 'ai-nham': 6, over: 7 }
/** Mã số quan hệ (màu vòng chỉ bi) cho cờ vòng của từng bi. */
const SO_QH: Readonly<Record<QuanHe, number>> = { em: 0, 'dong-doi': 1, 'doi-thu': 2, chot: 3 }
/** Vùng bẩn lớn hơn chừng này phần diện tích canvas ⇒ vẽ lại cả bàn (cắt không còn lợi). */
const TRAN_CAT = 0.55
/** Mỗi bi nhớ 9 số của khung đã vẽ: còn trên bàn, x, y (điểm ảnh canvas), bản ảnh bi đã vẽ, cờ vòng, hộp x0 y0 x1 y1. */
const SO_O = 9

/**
 * Bộ vẽ một bàn: giữ ảnh đệm từng bi, bảng chiếu sáng, nền.
 * TỐI ƯU MÁY YẾU (30/09, đo ở docs/do-toi-uu-bia-3009.md): canvas 2D trên máy yếu thường vẽ bằng CPU (không có tăng tốc GPU) — giá mỗi khung
 * tỉ lệ số điểm ảnh phải tô. Nên:
 *  · `canVe`: khung không đổi gì (bàn đứng yên, không kéo, không hiệu ứng) ⇒ KHÔNG vẽ lại, canvas giữ ảnh cũ, máy nghỉ.
 *  · Vẽ VÙNG BẨN: mỗi thứ vẽ trên bàn (bi, bóng bi, vòng, gậy, đường nhắm, Mắt thần, hạt, chữ) khai hộp bao của nó; chỉ tô lại hợp các hộp của
 *    khung trước + khung này (cắt bằng clip) — bi lăn, gậy xoay chỉ tô vài phần trăm bàn thay cho cả bàn. Vùng bẩn quá lớn ⇒ vẽ cả bàn như cũ.
 *  Hình vẽ ra GIỐNG HỆT vẽ cả bàn (cùng lệnh vẽ, cùng thứ tự; clip chỉ bỏ phần điểm ảnh không đổi).
 */
export class BoVe {
  /** Ảnh đệm từng kiểu bi (kiểu theo góc nhìn + kí hiệu + viền vàng — thầy chốt 30/09), vẽ MỘT lần mỗi cỡ bàn; mỗi khung chỉ drawImage. */
  private anh = new Map<string, (HTMLCanvasElement | null | undefined)[]>()
  private rAnh = 0
  /** Bi ĐANG LĂN: vẽ lăn từng điểm ảnh như bản cũ (kí hiệu, dải sọc chạy theo hướng lăn) — ảnh riêng từng bi, tô lại khi hướng quay đổi. */
  private bong: Bong | null = null
  private matNa = new Map<string, MatNa>()
  private lan = new Map<string, { cv: HTMLCanvasElement; x: CanvasRenderingContext2D; img: ImageData; ver: number; so: number }>()
  /** Số ảnh bi lăn còn được tô lại trong khung này (máy yếu: tối đa 4, bi khác giữ ảnh cũ thêm một khung). */
  private conTo = Infinity
  // LĂN THẬT (thầy 30/09): mọi bi (kể cả đầu ván — hướng khởi tạo `huongKhoiTao`) vẽ theo hướng quay 3D bền `b.q` (tích luỹ theo quãng lăn,
  // chỉ là hình ảnh cục bộ — không vào băm, không gửi qua mạng) — dừng thì kí hiệu nằm đâu GIỮ NGUYÊN đó. Bi đứng yên: ảnh đệm riêng của bi
  // chỉ tô lại khi hướng đổi (`b.ver`), mỗi khung chỉ drawImage. Không có canvas (test) ⇒ ảnh vẽ sẵn phẳng.
  private nen: HTMLCanvasElement | null = null
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
  /** Chỉ để kiểm (trang đo so ảnh): vẽ CẢ bàn và KHÔNG tô lại ảnh bi nào (giữ đúng ảnh bi của khung đang hiện). */
  kiemAnh = false
  /** Thống kê (kiểm, đo): số khung vẽ cả bàn / vẽ vùng bẩn / bỏ qua vì không đổi. */
  readonly dem = { ca: 0, cat: 0, bo: 0 }
  private doc: Document
  // ── dấu trạng thái khung đã vẽ + vùng bẩn
  private dau: unknown[] = []
  private dauMoi: unknown[] = []
  /** Buộc vẽ khung kế: vừa đổi cỡ / nạp lại chữ, ảnh bi còn nợ (máy yếu tô tối đa 4 bi mỗi khung), Mắt thần chưa kịp tính lại, khung trước lỗi. */
  private phaiVe = true
  /** Hộp (x0, y0, x1, y1 — điểm ảnh canvas) của lớp phủ + hiệu ứng khung trước / khung này. */
  private hopCu: number[] = []
  private hopMoi: number[] = []
  /** Khung trước đã vẽ trọn và các hộp của nó còn đúng (cùng cỡ canvas). */
  private hopDu = false
  private biCu = new Float64Array(0)
  private biMoi = new Float64Array(0)
  /** Vị trí vẽ từng bi khung này: toạ độ bàn (tx, ty) và điểm ảnh canvas (dx, dy). */
  private viTri = new Float64Array(0)
  private anhVe: (HTMLCanvasElement | null)[] = []
  private anhRoi: (HTMLCanvasElement | null)[] = []
  constructor(doc: Document = document) { this.doc = doc }
  /** Đổi cỡ: tính lại nền và bảng chiếu sáng. */
  datCo(k: KhungBan, dpr: number, nhe = this.nhe): void {
    this.k = k; this.dpr = dpr; this.nhe = nhe
    this.rAnh = R * k.S * dpr
    this.anh.clear(); this.lan.clear()
    this.bong = taoBong(Math.max(12, Math.ceil(2 * this.rAnh) + 2))
    this.ganMatNa()
    this.nen = veNen(k, dpr, this.doc)
    this.bongDo = this.veBongDo(k.S * dpr)
    this.boCu()
  }
  /** Quên khung đã vẽ ⇒ khung kế vẽ cả bàn. */
  private boCu(): void { this.phaiVe = true; this.hopDu = false; this.dau.length = 0 }
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
  /** Mặt nạ kí hiệu cho ảnh bi lăn: dựng sẵn lúc đặt cỡ (không để dồn vào khung đầu của cú phá bàn). */
  private ganMatNa(): void { for (const id of [...KL, ...PK, 'C'] as const) if (!this.matNa.has(id)) this.matNa.set(id, taoMatNa(this.doc, id)) }
  napLaiChu(): void { this.anh.clear(); this.lan.clear(); this.matNa.clear(); if (this.bong) this.ganMatNa(); if (this.k) this.nen = veNen(this.k, this.dpr, this.doc); this.boCu() }
  /** Chỉ số ảnh đệm theo kiểu + viền vàng (0 … 5, + 1 để khác "chưa có"): đổi ⇒ ô bi đó là vùng bẩn. */
  private soAnh(b: Bi, doiEm: 0 | 1): number {
    const kieu: KieuBi = kieuBi(b.id, doiEm), vang = b.id !== 'cue' && b.id !== 'C' && this.vangCua(b)
    return (kieu === 'ta' ? 0 : kieu === 'dich' ? 2 : 4) + (vang ? 1 : 0)
  }
  private vanDangVe: VanBia | null = null
  private vangCua(b: Bi): boolean { const v = this.vanDangVe; return !!v && b.id !== 'cue' && b.id !== 'C' && v.bi[b.id].vang }
  /** Có bảng chiếu sáng (máy vẽ được) ⇒ mọi bi vẽ 3D theo hướng quay bền. */
  private dangLan(_b: Bi): boolean {
    // Thầy 30/09: bi đầu ván cũng vẽ 3D thật (hướng khởi tạo ngẫu nhiên ổn định — huongKhoiTao), không còn dáng gốc phẳng.
    return !!this.bong
  }
  /** Số nhận dạng ảnh đang vẽ của bi (đổi ⇒ ô bi là vùng bẩn): bi lăn theo bản hướng quay, bi đứng yên theo kiểu + viền vàng. */
  private soAnhVe(b: Bi, doiEm: 0 | 1): number {
    if (this.dangLan(b)) { const e = this.lan.get(b.id); return 100 + (e ? e.ver : -1) }
    return this.soAnh(b, doiEm) + 1
  }
  /** Ảnh bi đang lăn: tô lại khi hướng quay đổi (trong ngân sách khung). Không có canvas ⇒ null. */
  private anhLan(b: Bi, doiEm: 0 | 1): HTMLCanvasElement | null {
    const B = this.bong!, kieu = kieuBi(b.id, doiEm), so = kieu === 'ta' ? 0 : kieu === 'dich' ? 1 : kieu === 'chot' ? 2 : 3
    let e = this.lan.get(b.id)
    if (!e || e.cv.width !== B.N) {
      const cv = this.doc.createElement('canvas'); cv.width = cv.height = B.N
      let x: CanvasRenderingContext2D | null = null
      try { x = cv.getContext('2d') } catch { x = null }
      if (!x) return null
      e = { cv, x, img: x.createImageData(B.N, B.N), ver: -1, so: -1 }
      this.lan.set(b.id, e)
    }
    if ((e.ver !== b.ver || e.so !== so) && (this.conTo > 0 || e.ver < 0)) {
      this.conTo--
      let m: MatNa | null = null
      if (b.id !== 'cue') { m = this.matNa.get(b.id) ?? null; if (!m) { m = taoMatNa(this.doc, b.id); this.matNa.set(b.id, m) } }
      toBiLan(B, kieu, m, b.q, !!this.k?.xoay, e.img.data)
      e.x.putImageData(e.img, 0, 0); e.ver = b.ver; e.so = so
    }
    return e.cv
  }
  /** Ảnh đệm của bi `b` theo góc nhìn phe `doiEm` (không cấp phát chuỗi khoá mỗi khung). */
  private anhBi(b: Bi, doiEm: 0 | 1): HTMLCanvasElement | null {
    if (this.dangLan(b)) { const a = this.anhLan(b, doiEm); if (a) return a }
    let ds = this.anh.get(b.id)
    if (!ds) { ds = []; this.anh.set(b.id, ds) }
    const i = this.soAnh(b, doiEm)
    let a = ds[i]
    if (a === undefined) { a = taoAnhBi(this.doc, kieuBi(b.id, doiEm), b.id === 'cue' ? '' : b.id, this.rAnh, (i & 1) === 1); ds[i] = a }
    return a
  }

  /**
   * Khung này có cần vẽ không. Không đổi gì so với khung đã vẽ (bàn đứng yên, không kéo gậy, không hiệu ứng) ⇒ false: canvas giữ nguyên ảnh cũ.
   * Luôn ghi lại dấu trạng thái (gọi đúng một lần mỗi khung, rồi `ve` nếu true).
   */
  canVe(v: VanBia, chi: ChiBi | null, mtBat: boolean, keoBiCai: boolean, mo = false): boolean {
    let ve = this.phaiVe || v.pha === 'moving' || v.pha === 'ai-nham' || v.fx.length > 0 || v.roi.length > 0 || v.noi.length > 0
    const d = this.dauMoi, balls = v.st.balls
    let i = 0
    d[i++] = PHA_SO[v.pha]; d[i++] = v.cur; d[i++] = v.em; d[i++] = v.sheet ? v.sheet.ma : -1; d[i++] = v.phienBan
    d[i++] = v.aim.x; d[i++] = v.aim.y; d[i++] = v.power; d[i++] = v.spin.x; d[i++] = v.spin.y
    d[i++] = v.matThan; d[i++] = mtBat; d[i++] = v.luonMT; d[i++] = v.ballInHand; d[i++] = v.isBreak; d[i++] = keoBiCai; d[i++] = mo
    d[i++] = chi ? chi.id : ''; d[i++] = chi ? chi.qh : ''
    for (let j = 0; j < balls.length; j++) {
      const b = balls[j]!, t = b.id !== 'cue' && b.id !== 'C' ? v.bi[b.id] : null
      d[i++] = b.x; d[i++] = b.y; d[i++] = b.on; d[i++] = b.ver
      d[i++] = t ? (t.vang ? 1 : 0) + (t.an ? 2 : 0) : 0
    }
    const c = this.dau
    if (!ve) { if (c.length !== i) ve = true; else for (let j = 0; j < i; j++) if (c[j] !== d[j]) { ve = true; break } }
    d.length = i
    this.dauMoi = c; this.dau = d
    if (!ve) this.dem.bo++
    return ve
  }

  // ───── hộp bao (điểm ảnh canvas) ─────
  private hop(x0: number, y0: number, x1: number, y1: number): void { this.hopMoi.push(x0 - 2, y0 - 2, x1 + 2, y1 + 2) }
  /** Hộp quanh một điểm của bàn, bán kính r điểm ảnh canvas. */
  private hopDiem(x: number, y: number, r: number): void { this.man(x, y); this.hop(this.vt.x - r, this.vt.y - r, this.vt.x + r, this.vt.y + r) }
  /** Hộp cho đoạn thẳng trên bàn (a → b), nửa bề rộng `nua` điểm ảnh canvas; đoạn dài chia khúc ≤ 48 đơn vị để hộp không phình. */
  private hopDoan(ax: number, ay: number, bx: number, by: number, nua: number, duoi = 0): void {
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 48)), vt = this.vt
    this.man(ax, ay)
    let px = vt.x, py = vt.y
    for (let i = 1; i <= n; i++) {
      this.man(ax + (bx - ax) * i / n, ay + (by - ay) * i / n)
      this.hop(Math.min(px, vt.x) - nua, Math.min(py, vt.y) - nua, Math.max(px, vt.x) + nua, Math.max(py, vt.y) + nua + duoi)
      px = vt.x; py = vt.y
    }
  }


  /** Vẽ một khung hình của ván. `chi`: bi đang được chỉ (nhãn) và quan hệ. */
  /** `mo`: ngón đang ở vùng "Huỷ" của thanh lực ⇒ gậy + đường ngắm mờ đi (em biết thả là không đánh). */
  ve(ctx: CanvasRenderingContext2D, v: VanBia, chi: ChiBi | null, mtBat: boolean, keoBiCai: boolean, mo = false): void {
    const k = this.k
    this.vanDangVe = v
    const duTruoc = this.hopDu
    this.phaiVe = true; this.hopDu = false // khung lỗi giữa chừng ⇒ khung sau vẽ lại CẢ bàn
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (!k || !this.nen) { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); this.hopDu = false; return }
    const s = k.S * this.dpr, balls = v.st.balls, vt = this.vt, nhe = this.nhe, cw = ctx.canvas.width, ch = ctx.canvas.height, n = balls.length
    const doiEm = v.ghe[v.em]!.doi
    this.conTo = nhe ? 4 : Infinity
    const nguoi = !v.ghe[v.cur]!.ai
    const nhin = ((v.pha === 'aim' && !v.sheet) || v.pha === 'ai-nham') && v.bi_('cue').on
    const mt = nguoi && ((v.matThan > 0 && mtBat) || (v.luonMT && v.cur === v.em)) // luôn bật Mắt thần: chỉ cú của chính em
    const info = nhin ? v.nham() : null
    // Mắt thần đơn giản (bản vẽ thử): hình học thuần từ điểm va — đường bi đích (dài khi có Mắt thần) + hướng bi cái đi tiếp (chỉ khi có Mắt thần)
    const dd = info && nguoi && v.pha === 'aim' ? duongMatThan(info, v.aim, mt) : null
    const datBi = v.ballInHand && v.pha === 'aim' && nguoi && !v.sheet
    const sz = Math.max(8, Math.ceil(this.rAnh * KHUNG_ANH)), bd = this.bongDo, nuaBong = bd ? bd.width / 2 : 0
    // ── 1. ảnh bi (tô lại trong ngân sách, cùng thứ tự như trước: bi rơi rồi bi trên bàn) + vị trí vẽ
    if (this.viTri.length !== n * 4) { this.viTri = new Float64Array(n * 4); this.biCu = new Float64Array(n * SO_O); this.biMoi = new Float64Array(n * SO_O); this.anhVe = new Array<HTMLCanvasElement | null>(n).fill(null); this.hopDu = false }
    const roi = v.roi
    this.anhRoi.length = roi.length
    for (let j = 0; j < roi.length; j++) this.anhRoi[j] = this.anhBi(v.bi_(roi[j]!.id), doiEm)
    const no = false // ảnh bi vẽ sẵn: không còn ảnh nợ
    for (let i = 0; i < n; i++) {
      const b = balls[i]!
      if (!b.on) { this.anhVe[i] = null; continue }
      v.viTriVe(i, vt); this.viTri[4 * i] = vt.x; this.viTri[4 * i + 1] = vt.y
      this.man(vt.x, vt.y); this.viTri[4 * i + 2] = vt.x; this.viTri[4 * i + 3] = vt.y
      this.anhVe[i] = this.anhBi(b, doiEm)
    }
    // ── 2. vùng bẩn: bi đổi (vị trí / ảnh / vòng) + mọi lớp phủ, hiệu ứng của khung trước và khung này
    this.hopMoi.length = 0
    const chiI = chi ? balls.findIndex((b) => b.id === chi.id) : -1
    const rChi = ((R + 6) + 1.6) * s + (nhe ? 1 : 18)
    const bm = this.biMoi, bc = this.biCu
    for (let i = 0; i < n; i++) {
      const b = balls[i]!, o = i * SO_O, t = b.id !== 'cue' && b.id !== 'C' ? v.bi[b.id] : null
      const vang = !!t && t.vang, co = (vang ? 1 : 0) + (i === chiI && chi ? 2 + 4 * SO_QH[chi.qh] : 0)
      bm[o] = b.on ? 1 : 0
      if (bm[o]) {
        const x = this.viTri[4 * i + 2]!, y = this.viTri[4 * i + 3]!, r = Math.max(sz / 2, i === chiI ? rChi : 0)
        bm[o + 1] = x; bm[o + 2] = y; bm[o + 3] = this.soAnhVe(b, doiEm); bm[o + 4] = co
        bm[o + 5] = Math.min(x - r, x + 3 * s - nuaBong) - 2; bm[o + 6] = Math.min(y - r, y + 5 * s - nuaBong) - 2
        bm[o + 7] = Math.max(x + r, x + 3 * s + nuaBong) + 2; bm[o + 8] = Math.max(y + r, y + 5 * s + nuaBong) + 2
      }
      const doi = bm[o] !== bc[o] || (bm[o] && (bm[o + 1] !== bc[o + 1] || bm[o + 2] !== bc[o + 2] || bm[o + 3] !== bc[o + 3] || bm[o + 4] !== bc[o + 4]))
      if (doi) {
        if (bc[o]) this.hopMoi.push(bc[o + 5]!, bc[o + 6]!, bc[o + 7]!, bc[o + 8]!)
        if (bm[o]) this.hopMoi.push(bm[o + 5]!, bm[o + 6]!, bm[o + 7]!, bm[o + 8]!)
      }
    }
    const soHopBi = this.hopMoi.length
    for (let j = 0; j < roi.length; j++) {
      const r = roi[j]!, kk = Math.min(1, r.t / 0.28)
      this.hopDiem(r.x + (r.px - r.x) * kk, r.y + (r.py - r.y) * kk, sz * (1 - 0.55 * kk) / 2 + 1)
    }
    if (info) {
      const sx = info.c.x + v.aim.x * R, sy = info.c.y + v.aim.y * R
      this.hopDoan(sx, sy, info.gx, info.gy, 1.5 * s)
      this.hopDiem(info.gx, info.gy, (R + 1.6) * s)
      if (info.loai === 'bi') {
        this.hopDiem(info.b.x, info.b.y, (R + 5.5) * s)
        if (v.pha === 'ai-nham') this.hopDoan(info.b.x, info.b.y, info.b.x + info.nx * (60 + 140 * info.cut), info.b.y + info.ny * (60 + 140 * info.cut), 1.5 * s)
      }
      if (dd) { this.hopDoan(dd.dich.x0, dd.dich.y0, dd.dich.x1, dd.dich.y1, 2 * s); if (dd.tiep) this.hopDoan(dd.tiep.x0, dd.tiep.y0, dd.tiep.x1, dd.tiep.y1, 2 * s) }
      // cây cơ: từ R + kéo lùi, dài 406 đơn vị, dày 13; bóng đổ lệch 6 điểm ảnh xuống, mờ 8
      const c = info.c, a0 = R + 6 + v.power * 80, ux = -v.aim.x, uy = -v.aim.y
      this.hopDoan(c.x + ux * a0, c.y + uy * a0, c.x + ux * (a0 + 406), c.y + uy * (a0 + 406), 6.5 * s + (nhe ? 1 : 18), nhe ? 0 : 6)
    }
    if (datBi) {
      const c = v.bi_('cue')
      this.hopDiem(c.x, c.y, (R + 10) * s)
      this.man(c.x, c.y); this.hop(vt.x - 60 * s, vt.y + (R + 12) * s, vt.x + 60 * s, vt.y + (R + 32) * s)
    }
    for (let j = 0; j < v.fx.length; j++) {
      const f = v.fx[j]!
      if (f.t < 0) continue
      const r = f.k === 'vong' ? (8 + 60 * (f.t / f.life) + 2) * s : f.k === 'hat' ? (f.s + 1) * s : (f.s * 1.2 + 1) * s
      this.hopDiem(f.x, f.y, r + 1)
    }
    for (const q of v.noi) { const kk = q.t / 1.2; this.man(q.x, q.y); this.hop(vt.x - 55 * s, vt.y + (-34 * kk - 34) * s, vt.x + 55 * s, vt.y + (-34 * kk + 12) * s) }
    // hộp lớp phủ khung trước (bi đã tính ở trên theo từng bi)
    const hopPhu = this.hopMoi.slice(soHopBi)
    const vung = this.hopMoi
    for (const x of this.hopCu) vung.push(x)
    let cat = !this.kiemAnh && duTruoc
    if (cat) {
      let dt = 0
      for (let j = 0; j < vung.length; j += 4) dt += Math.max(0, Math.min(cw, vung[j + 2]!) - Math.max(0, vung[j]!)) * Math.max(0, Math.min(ch, vung[j + 3]!) - Math.max(0, vung[j + 1]!))
      if (dt > TRAN_CAT * cw * ch) cat = false
      else if (dt === 0) { this.xongKhung(hopPhu, no); this.dem.bo++; return } // không điểm ảnh nào đổi
    }
    // ── 3. vẽ (y như vẽ cả bàn; khi cắt, clip bỏ các điểm ảnh ngoài vùng bẩn)
    if (cat) {
      ctx.save(); ctx.beginPath()
      for (let j = 0; j < vung.length; j += 4) { const x0 = Math.max(0, Math.floor(vung[j]!)), y0 = Math.max(0, Math.floor(vung[j + 1]!)), x1 = Math.min(cw, Math.ceil(vung[j + 2]!)), y1 = Math.min(ch, Math.ceil(vung[j + 3]!)); if (x1 > x0 && y1 > y0) ctx.rect(x0, y0, x1 - x0, y1 - y0) }
      ctx.clip()
      this.dem.cat++
    } else this.dem.ca++
    ctx.clearRect(0, 0, cw, ch)
    ctx.drawImage(this.nen, 0, 0)
    if (bd) for (let i = 0; i < n; i++) {
      if (!balls[i]!.on) continue
      ctx.drawImage(bd, this.viTri[4 * i + 2]! + 3 * s - bd.width / 2, this.viTri[4 * i + 3]! + 5 * s - bd.height / 2)
    }
    for (let j = 0; j < roi.length; j++) {
      const r = roi[j]!, kk = Math.min(1, r.t / 0.28), sp = this.anhRoi[j]
      if (!sp) continue
      const [p, q] = raMan(k, this.dpr, r.x + (r.px - r.x) * kk, r.y + (r.py - r.y) * kk), z = sz * (1 - 0.55 * kk)
      ctx.globalAlpha = 1 - kk; ctx.drawImage(sp, p - z / 2, q - z / 2, z, z); ctx.globalAlpha = 1
    }
    datTFBan(ctx, k, this.dpr)
    if (info) {
      ctx.save(); ctx.lineCap = 'round'; if (mo) ctx.globalAlpha = 0.3
      const sx = info.c.x + v.aim.x * R, sy = info.c.y + v.aim.y * R
      ctx.setLineDash([7, 7]); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(info.gx, info.gy); ctx.stroke(); ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(info.gx, info.gy, R, 0, 7); ctx.stroke()
      if (info.loai === 'bi') {
        const ok = v.hopLe(info.b.id)
        if (v.pha === 'ai-nham') { ctx.strokeStyle = 'rgba(255,224,130,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(info.b.x, info.b.y); ctx.lineTo(info.b.x + info.nx * (60 + 140 * info.cut), info.b.y + info.ny * (60 + 140 * info.cut)); ctx.stroke() }
        if (!ok) { ctx.strokeStyle = 'rgba(255,107,107,.95)'; ctx.lineWidth = 2.4; const d = 8; ctx.beginPath(); ctx.moveTo(info.gx - d, info.gy - d); ctx.lineTo(info.gx + d, info.gy + d); ctx.moveTo(info.gx + d, info.gy - d); ctx.lineTo(info.gx - d, info.gy + d); ctx.stroke() }
        ctx.strokeStyle = ok ? 'rgba(255,255,255,.95)' : 'rgba(255,107,107,.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(info.b.x, info.b.y, R + 4, 0, 7); ctx.stroke() // bi đích hợp lệ: vòng TRẮNG (vàng chỉ dành cho bi đã giải trước)
      }
      if (dd && info.loai === 'bi') {
        const ok = v.hopLe(info.b.id)
        ctx.strokeStyle = ok ? 'rgba(255,255,255,.9)' : 'rgba(255,93,93,.95)'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(dd.dich.x0, dd.dich.y0); ctx.lineTo(dd.dich.x1, dd.dich.y1); ctx.stroke()
        if (dd.tiep) { ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.setLineDash([6, 7]); ctx.beginPath(); ctx.moveTo(dd.tiep.x0, dd.tiep.y0); ctx.lineTo(dd.tiep.x1, dd.tiep.y1); ctx.stroke(); ctx.setLineDash([]) }
      }
      ctx.restore()
    }
    if (chiI >= 0 && balls[chiI]!.on && chi) { ctx.save(); ctx.strokeStyle = MAU_QH[chi.qh]; ctx.lineWidth = 3.2; if (!nhe) { ctx.shadowColor = MAU_QH[chi.qh]; ctx.shadowBlur = 8 } ctx.beginPath(); ctx.arc(this.viTri[4 * chiI]!, this.viTri[4 * chiI + 1]!, R + 6, 0, 7); ctx.stroke(); ctx.restore() }
    for (let i = 0; i < n; i++) {
      const b = balls[i]!
      if (!b.on) continue
      const sp = this.anhVe[i]
      if (!sp) continue
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(sp, this.viTri[4 * i + 2]! - sp.width / 2, this.viTri[4 * i + 3]! - sp.height / 2)
      // bi lăn đã giải trước: viền vàng mảnh vẽ thẳng (ảnh lăn không kèm viền)
      if (b.id !== 'cue' && b.id !== 'C' && v.bi[b.id].vang && this.bong) { ctx.strokeStyle = MAU_BI_VANG; ctx.lineWidth = this.rAnh * 0.16; ctx.beginPath(); ctx.arc(this.viTri[4 * i + 2]!, this.viTri[4 * i + 3]!, this.rAnh * 1.12, 0, 7); ctx.stroke() }
    }
    datTFBan(ctx, k, this.dpr)
    if (datBi) {
      const c = v.bi_('cue')
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = keoBiCai ? 'rgb(255,214,107)' : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, R + 9, 0, 7); ctx.stroke(); ctx.restore()
      const [p, q] = raMan(k, this.dpr, c.x, c.y)
      ctx.setTransform(s, 0, 0, s, p, q); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = "600 13px 'Be Vietnam Pro',sans-serif"; ctx.textAlign = 'center'; ctx.fillText('Kéo để đặt', 0, R + 26); datTFBan(ctx, k, this.dpr)
    }
    if (info) {
      const c = info.c, an = Math.atan2(v.aim.y, v.aim.x), keo = 6 + v.power * 80
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(an + Math.PI); if (mo) ctx.globalAlpha = 0.3
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
    for (const q of v.noi) {
      const kk = q.t / 1.2, [p, r] = raMan(k, this.dpr, q.x, q.y)
      ctx.setTransform(s, 0, 0, s, p, r); ctx.textAlign = 'center'; ctx.font = "800 28px 'Baloo 2',sans-serif"; ctx.globalAlpha = 1 - kk
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,20,0,.8)'; ctx.strokeText(q.chu, 0, -34 * kk); ctx.fillStyle = 'rgb(255,214,107)'; ctx.fillText(q.chu, 0, -34 * kk); ctx.globalAlpha = 1
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (cat) ctx.restore()
    this.xongKhung(hopPhu, no)
  }
  /** Khung đã vẽ xong: nhớ hộp + trạng thái bi làm "khung trước"; còn ảnh bi nợ / Mắt thần chưa tính lại ⇒ buộc vẽ khung kế. */
  private xongKhung(hopPhu: number[], no: boolean): void {
    this.hopCu = hopPhu
    const t = this.biCu; this.biCu = this.biMoi; this.biMoi = t
    this.hopDu = true
    this.phaiVe = no
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
}
/** Vẽ một bi mẫu (Sảnh Bi-a: chú giải "Bi của em · Bi đối thủ · Bi chốt"), đúng hàm vẽ bi của bàn. */
export function veBiMau(canvas: HTMLCanvasElement, kieu: KieuBi, kiHieu: string, doc: Document = document): void {
  const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), N = Math.round(44 * dpr), x = canvas.getContext('2d')
  if (!x) return
  canvas.width = canvas.height = N
  // Bi 3D thật như trên bàn (thầy 30/09): hướng ngẫu nhiên ổn định theo kí hiệu, vẽ bằng đúng đường vẽ lăn.
  const B = taoBong(N), img = x.createImageData(N, N)
  toBiLan(B, kieu, kieu === 'cai' ? null : taoMatNa(doc, kiHieu), huongKhoiTao(`sanh|${kiHieu}`), false, img.data)
  x.putImageData(img, 0, 0)
}
