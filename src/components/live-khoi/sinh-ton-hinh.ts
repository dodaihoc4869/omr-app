// HÌNH của trò «Sinh Tồn · Trang vở» (bản 2 — thầy duyệt bản vẽ 13/11: docs/ban-ve-sinh-ton-v2-1311/02-bo-hinh-1366.jpg, 19-sau-khau-sung-1366.jpg; đặc tả
// docs/dac-ta-sinh-ton-v2-1311.md). Mọi thứ VẼ TAY bằng nét phấn (rung, hai lượt lệch nhau) và NƯỚNG SẴN thành ảnh MỘT lần theo (cỡ, hệ số `k` = điểm ảnh thiết
// bị cho một đơn vị sân); mỗi khung hình chỉ dán ảnh. Bé ma vô diện 2 khung nét rung (hoạt hình vẽ tay), 6 khẩu súng, đồ dùng học tập NỔI KHỐI 3D làm vật chặn
// (thước · bút chì · bút dạ · cục tẩy), bụi mây bút dạ có đáy, hộp tiếp tế giấy nhớ, vết mực, cục giấy vo, lửa trên đầu em, sao, chữ viết tay.
// KIỂU PHẲNG (máy yếu / máy tự hạ): bé ma 1 khung, vật chặn + bụi bỏ khối 3D và bóng đổ (vẫn đủ nét, đọc rõ).
// Màu: chỉ đọc biến CSS (--st-* nền luôn tối + token đội / trạng thái) — sắc phụ pha bằng `pha`, không mã màu thô.
import type { LoaiHop } from '../../lib/live-khoi/sinh-ton-loi'
export type Rgb = [number, number, number]
export type P = [number, number]
type G = CanvasRenderingContext2D

export interface BangMau {
  /** Mặt trang (--st-nen) · ngoài trang (--st-vien-2) · thẻ (--st-mat). */ giay: Rgb; ban: Rgb; mat: Rgb
  /** Dòng kẻ ô li (pha từ --st-vien) · lề đỏ đôi. */ ke: Rgb; le: Rgb
  /** Nét phấn (--st-chu). */ muc: Rgb
  /** Bóng đổ của đồ vật nằm trên trang. */ bong: Rgb; bongA: number
  /** Bốn đội: Na · K · Cu · Ca (token đội). */ doi: Rgb[]
  sao: Rgb; tin: Rgb; sai: Rgb; dung: Rgb; hs: Rgb
  phong: string
}
/** Năm biến nền LUÔN TỐI của trò (tokens.css, thầy 13/11: nền tối Duolingo mặc định luôn là nền này). */
export const BIEN_ST = ['--st-nen', '--st-mat', '--st-vien', '--st-vien-2', '--st-chu'] as const
/** Biến màu bốn đội — khớp DOI_BPU (src/lib/bpu/phong.ts). */
export const BIEN_DOI = ['--p-cam', '--p-tim-2', '--p-xanh', '--p-do'] as const
/** Phông viết tay (OFL, tệp ở src/assets/phong-sinh-ton/, khai ở tro-sinh-ton.css ⇒ chỉ đi theo mảnh lười TroSinhTon). */
export const PHONG_TAY = '"Patrick Hand", "Be Vietnam Pro", system-ui, sans-serif'
const DEN: Rgb = [0, 0, 0]

export const mau = (c: Rgb, a = 1): string => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`
/** Pha hai màu: `t` = phần của `b`. */
export const pha = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

/** Bảng màu của trò từ hàm đọc biến CSS (`doc(biến, mặc định)`): nền / thẻ / kẻ / chữ đọc --st-* (KHÔNG đọc --tr-nen: trò luôn tối kể cả máy để sáng),
 *  bốn đội đọc token đội, sao / tin / sai / đúng / tím đọc token trạng thái. `chuGoc` = màu chữ của khung (dự phòng khi thiếu biến). */
export function taoBangMau(doc: (bien: string, macDinh: Rgb) => Rgb, chuGoc: Rgb = [128, 128, 128]): BangMau {
  const muc = doc('--st-chu', chuGoc)
  const giay = doc('--st-nen', pha(muc, DEN, 0.9)), vien = doc('--st-vien', pha(giay, muc, 0.18))
  const sai = doc('--tr-sai', muc)
  return {
    giay, ban: doc('--st-vien-2', pha(giay, DEN, 0.2)), mat: doc('--st-mat', pha(giay, muc, 0.08)), ke: pha(giay, vien, 0.34), le: pha(giay, sai, 0.42), muc,
    bong: DEN, bongA: 0.32, doi: BIEN_DOI.map((b) => doc(b, muc)), sao: doc('--tr-sao', muc), tin: doc('--tr-tin', muc), sai, dung: doc('--tr-dung', muc), hs: doc('--tr-hs', muc),
    phong: PHONG_TAY,
  }
}

// ── Nét vẽ tay (chỉ chạy lúc NƯỚNG) ──
/** Số ngẫu nhiên có hạt giống: cùng hạt ⇒ cùng nét ⇒ ảnh ổn định giữa các lần nướng. */
function rng(hat: number): () => number {
  let s = (hat * 2654435761) >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}
export const elip = (cx: number, cy: number, rx: number, ry: number, n = 28): P[] => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P })
function hcn(x: number, y: number, w: number, h: number, r = 0): P[] {
  if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
  const p: P[] = [], goc = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) } }
  goc(x + w - r, y + r, -Math.PI / 2); goc(x + w - r, y + h - r, 0); goc(x + r, y + h - r, Math.PI / 2); goc(x + r, y + r, Math.PI)
  return p
}
/** Chia lại đường thành các điểm cách nhau ~`buoc`. */
function chia(pts: P[], kin: boolean, buoc: number): P[] {
  const ra: P[] = [], n = pts.length, het = kin ? n : n - 1
  for (let i = 0; i < het; i++) {
    const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(d / buoc))
    for (let j = 0; j < k; j++) ra.push([a[0] + ((b[0] - a[0]) * j) / k, a[1] + ((b[1] - a[1]) * j) / k])
  }
  if (!kin) ra.push(pts[n - 1])
  return ra
}
/** Rung: lệch mỗi điểm một khoảng nhỏ, lọc mượt (tay người run chậm, không răng cưa). */
function rungDiem(pts: P[], bien: number, r: () => number): P[] {
  let dx = 0, dy = 0
  return pts.map(([x, y]) => { dx = dx * 0.6 + (r() - 0.5) * bien; dy = dy * 0.6 + (r() - 0.5) * bien; return [x + dx, y + dy] as P })
}
/** Đường cong mượt qua các điểm (trung điểm + quadratic). */
export function duong(g: G, pts: readonly P[], kin: boolean): void {
  const n = pts.length
  if (n < 2) return
  g.beginPath()
  if (kin) {
    g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2)
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }
    g.closePath()
  } else {
    g.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < n - 1; i++) { const a = pts[i], b = pts[i + 1]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2) }
    g.lineTo(pts[n - 1][0], pts[n - 1][1])
  }
}
interface Net { mau: Rgb; day: number; bien?: number; hat: number; a?: number; kin?: boolean }
/** Nét phấn: lượt chính (có kẽ hở nhỏ như phấn trên bảng) + lượt phụ mảnh lệch. */
function netTay(g: G, pts: P[], o: Net): void {
  const kin = o.kin ?? true, bien = o.bien ?? 1.6, r = rng(o.hat), a = o.a ?? 1, goc = chia(pts, kin, 5)
  g.lineCap = 'round'; g.lineJoin = 'round'
  g.setLineDash([7 + r() * 5, 1.4, 3, 1.2])
  duong(g, rungDiem(goc, bien, r), kin); g.strokeStyle = mau(o.mau, a); g.lineWidth = o.day; g.stroke()
  duong(g, rungDiem(goc, bien * 1.5, r), kin); g.strokeStyle = mau(o.mau, a * 0.45); g.lineWidth = o.day * 0.55; g.stroke()
  g.setLineDash([])
}
function to(g: G, pts: P[], c: Rgb, a = 1): void { duong(g, pts, true); g.fillStyle = mau(c, a); g.fill() }
/** Tô gạch chéo kiểu bút dạ trong hình. */
function gach(g: G, pts: P[], c: Rgb, a: number, khoang: number, goc: number, day: number, hat: number): void {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), dai = Math.hypot(x1 - x0, y1 - y0)
  const r = rng(hat), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ux = Math.cos(goc), uy = Math.sin(goc)
  g.save(); duong(g, pts, true); g.clip()
  g.strokeStyle = mau(c, a); g.lineWidth = day; g.lineCap = 'round'
  g.beginPath()
  for (let t = -dai / 2; t <= dai / 2; t += khoang) { const lx = cx - uy * t + (r() - 0.5) * 2, ly = cy + ux * t; g.moveTo(lx - ux * dai, ly - uy * dai); g.lineTo(lx + ux * dai, ly + uy * dai) }
  g.stroke(); g.restore()
}
/** Nét nguệch ngoạc phủ kín hình — kiểu tô bằng bút dạ cho nhanh. */
function nguech(g: G, pts: P[], c: Rgb, a: number, buoc: number, day: number, hat: number): void {
  const ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]), r = rng(hat)
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  g.save(); duong(g, pts, true); g.clip()
  g.beginPath(); g.strokeStyle = mau(c, a); g.lineWidth = day; g.lineJoin = 'round'
  let len = true
  g.moveTo(x0 - 4, y0)
  for (let y = y0; y <= y1 + buoc; y += buoc) { g.lineTo(len ? x1 + 4 : x0 - 4, y + (r() - 0.5) * buoc * 0.8); len = !len }
  g.stroke(); g.restore()
}

/** Ảnh nướng sẵn: canvas cỡ (w, h) đơn vị sân × hệ số k, điểm neo (ox, oy). */
export interface Anh { c: HTMLCanvasElement; w: number; h: number; ox: number; oy: number }
function nuong(w: number, h: number, k: number, ox: number, oy: number, ve: (g: G) => void): Anh {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w * k)); c.height = Math.max(1, Math.ceil(h * k))
  const g = typeof Path2D === 'function' ? c.getContext('2d') : null
  if (g) { g.scale(k, k); ve(g) }
  return { c, w, h, ox, oy }
}
/** Dán ảnh có điểm neo tại (x, y) theo phép biến đổi hiện hành (hệ toạ độ sân). */
export function dat(g: G, a: Anh, x: number, y: number, s = 1): void { g.drawImage(a.c, x - a.ox * s, y - a.oy * s, a.w * s, a.h * s) }

// ── Bé ma vô diện (hộp 70 × 84, neo ở điểm chạm đất (35, 72); thân tâm ~ (35, 36)) ──
export const MA_W = 70, MA_H = 84, MA_OX = 35, MA_OY = 72
function hinhMa(): P[] {
  const cx = 35, cy = 30, R = 17, p: P[] = []
  for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; p.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]) }
  p.push([cx + R + 1, 44]); p.push([cx + R + 1, 51])
  for (let s = 0; s < 3; s++) { const xc = cx + R + 1 - 6 - 12 * s; for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI; p.push([xc + Math.cos(a) * 6, 51 + Math.sin(a) * 7]) } }
  p.push([cx - R - 1, 44])
  return p
}
/** Đường viền bé ma (hệ của hộp hình) — hiệu ứng «vẽ ra từ nét bút» chạy theo đường này. */
export const HINH_MA = hinhMa()
/** Chỏm riêng từng đội: Na túm lửa · K hai tai · Cu ăng-ten có quả cầu · Ca nơ. */
function chom(g: G, b: BangMau, doi: number, c: Rgb, nhat: Rgb, hat: number): void {
  const m = b.muc
  if (doi === 0) { const p: P[] = [[35, 14], [31, 10], [32, 5], [35, 8], [37, 1], [40, 7], [39, 12]]; to(g, p, c); netTay(g, p, { mau: m, day: 1.6, hat, bien: 0.8 }) }
  else if (doi === 1) for (const s of [-1, 1]) { const p: P[] = [[35 + s * 5, 15], [35 + s * 12, 3], [35 + s * 14, 16]]; to(g, p, nhat); netTay(g, p, { mau: m, day: 1.6, hat: hat + s, bien: 0.8 }) }
  else if (doi === 2) {
    netTay(g, [[36, 14], [38, 8], [41, 4]], { mau: m, day: 1.6, hat, kin: false, bien: 0.6 })
    const q = elip(42, 3, 3.6, 3.6, 12); to(g, q, c); netTay(g, q, { mau: m, day: 1.4, hat: hat + 3, bien: 0.5 })
  } else {
    for (const s of [-1, 1]) { const p: P[] = [[44, 15], [44 + s * 8, 9], [44 + s * 8, 19]]; to(g, p, c); netTay(g, p, { mau: m, day: 1.4, hat: hat + s, bien: 0.6 }) }
    const q = elip(44, 14, 2.4, 2.4, 10); to(g, q, nhat); netTay(g, q, { mau: m, day: 1.2, hat, bien: 0.3 })
  }
}
function nuongMa(b: BangMau, k: number, doi: number, trai: boolean, khung: number): Anh {
  const c = b.doi[doi] ?? b.muc, ao = pha(c, b.giay, 0.18), hat = doi * 31 + khung * 7 + (trai ? 3 : 0)
  return nuong(MA_W, MA_H, k, MA_OX, MA_OY, (g) => {
    if (trai) { g.translate(MA_W, 0); g.scale(-1, 1) }
    for (const [x, y] of [[16, 40], [54, 38]] as P[]) { const q = elip(x, y, 4.2, 3.4, 12); to(g, q, ao); netTay(g, q, { mau: b.muc, day: 1.4, hat: hat + x, bien: 0.5 }) }
    to(g, HINH_MA, ao)
    // bóng dạ ở vạt dưới bên trái
    g.save(); duong(g, HINH_MA, true); g.clip(); gach(g, elip(24, 50, 14, 9, 16), pha(c, b.muc, 0.35), 0.28, 3.6, -0.85, 1.1, hat); g.restore()
    // mặt vô diện màu đội (lệch về phía nhìn)
    const mat = elip(38, 30, 10.5, 8.6, 22); to(g, mat, c)
    gach(g, mat, pha(c, b.muc, 0.3), 0.25, 3.2, 0.7, 0.9, hat + 5)
    netTay(g, mat, { mau: b.muc, day: 1.3, hat: hat + 9, bien: 0.5 })
    netTay(g, [[29, 25], [32, 23]], { mau: b.giay, day: 1.8, hat: hat + 4, kin: false, bien: 0.2, a: 0.9 })
    netTay(g, HINH_MA, { mau: b.muc, day: 2, hat, bien: 1.3 })
    chom(g, b, doi, c, pha(c, b.giay, 0.5), hat + 11)
  })
}

// ── Sáu khẩu súng (thầy 13/11 «cho tới 6 khẩu súng nhé, thiết kế đẹp vào, đạn cũng xịn nữa»): hướng phải, neo ở tay cầm (6, 15) ──
/** Đầu nòng (đơn vị sân, tính từ tay cầm) theo cấp — chỗ chớp lửa và nơi đạn bay ra. */
export const SUNG_DAI = [30, 38, 41, 46, 48, 51] as const
function saoP(cx: number, cy: number, r1: number, r2: number): P[] { const p: P[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? r2 : r1; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) } return p }
function nuongSung(b: BangMau, k: number, doi: number, cap: number): Anh {
  const c = b.doi[doi] ?? b.muc, than = pha(c, b.muc, 0.3), dam = pha(c, DEN, 0.32), m = b.muc, hat = doi * 13 + cap * 5
  const sat = pha(b.giay, m, 0.35), sang = pha(b.giay, m, 0.85)
  return nuong(60, 34, k, 6, 15, (g) => {
    g.translate(0, 2)
    const ve = (p: P[], f: Rgb, h: number, a = 1) => { to(g, p, f, a); netTay(g, p, { mau: m, day: 1.4, hat: hat + h, bien: 0.45 }) }
    const bong = (x: number, y: number, w: number) => netTay(g, [[x, y], [x + w, y]], { mau: sang, day: 1.6, hat: hat + 30, kin: false, bien: 0.2, a: 0.75 })
    ve([[6, 15], [12, 15], [11, 26], [5, 26]], dam, 1) // báng cầm
    if (cap === 1) { // Súng Hạt: gọn, một nòng, kính ngắm tròn
      ve(hcn(19, 7, 11, 5, 2), sat, 2); ve(hcn(2, 4, 19, 11, 4), than, 3); ve(hcn(5, 7.5, 11, 3.5, 1.5), c, 4); ve(elip(13, 3, 3, 2.4, 10), sat, 5); bong(5, 5.6, 9)
    } else if (cap === 2) { // Súng Đôi: hai nòng song song, khe tản nhiệt
      ve(hcn(21, 3.5, 17, 4, 1.5), sat, 2); ve(hcn(21, 10.5, 17, 4, 1.5), sat, 3); ve(hcn(2, 2, 21, 15, 4), than, 4)
      for (const x of [6, 10, 14]) ve(hcn(x, 5, 2, 9, 1), dam, 5 + x)
      ve(hcn(17, 6, 4, 7, 1), c, 6); bong(4, 3.6, 14)
    } else if (cap === 3) { // Súng Bọt: bình bọt khí trên lưng, loa phun
      ve([[23, 8], [35, 4], [41, 6], [41, 18], [35, 20], [23, 16]], sat, 2); ve(hcn(2, 7, 23, 11, 4), than, 3)
      ve(elip(13, 2, 8, 6.5, 18), pha(c, b.giay, 0.72), 4, 0.9)
      for (const [x, y, r] of [[10, 3, 1.8], [15, 0, 1.3], [14, 5, 1.1], [17, 3, 0.9]] as [number, number, number][]) netTay(g, elip(x, y, r, r, 8), { mau: c, day: 1, hat: hat + x, bien: 0.1 })
      for (const x of [38, 41]) netTay(g, elip(x, 12, 2, 2, 8), { mau: c, day: 1, hat: hat + x, bien: 0.1, a: 0.7 })
      bong(5, 9.4, 14)
    } else if (cap === 4) { // Súng Sấm: cuộn dây ba vòng, ăng-ten tóe điện
      ve(hcn(22, 7.5, 24, 4.5, 1.5), sat, 2)
      for (const x of [27, 33, 39]) netTay(g, elip(x, 9.7, 2.6, 6.4, 12), { mau: b.sao, day: 2.2, hat: hat + x, bien: 0.25 })
      ve(hcn(1, 2, 23, 15, 5), than, 3); ve([[10, 4], [6.5, 10.5], [11, 10.5], [8, 16], [16, 8.5], [11.5, 8.5], [13.5, 4]], b.sao, 4)
      netTay(g, [[18, 2], [21, -4]], { mau: m, day: 1.4, hat, kin: false, bien: 0.2 }); ve(elip(21.5, -5, 2, 2, 8), b.sao, 5)
      bong(4, 3.8, 6)
    } else if (cap === 5) { // Súng Lửa Màu: bình nhiên liệu, vòi phun, ngọn lửa mồi đúng màu thử ngọn lửa của nguyên tố đội
      ve(hcn(22, 6, 18, 7, 2), sat, 2); ve([[39, 4], [47, 1.5], [47, 17.5], [39, 15]], dam, 3)
      ve(hcn(2, 3, 22, 13, 5), than, 4); ve(hcn(9, 15, 15, 8, 3), c, 5); bong(11, 17, 8)
      const lua: P[] = [[48, 9.5], [53, 4], [52, 8], [57, 6], [54, 11], [57, 14], [52, 13], [53, 16]]; to(g, lua, c); to(g, [[49, 9.5], [52, 7.5], [53.5, 10], [52, 12]], b.sao)
      netTay(g, lua, { mau: m, day: 1.1, hat: hat + 40, bien: 0.3, a: 0.8 })
      ve([[7, 6], [5, 10], [8, 9], [7, 13], [11, 8], [8.5, 8.5]], b.sao, 6); bong(13, 5, 8)
    } else { // Pháo Sao: nòng loe ba vòng đai, sao lớn giữa thân, đinh tán
      ve([[31, 1], [49, -3], [51, 9.5], [49, 22], [31, 18]], pha(c, b.giay, 0.35), 2)
      for (const x of [35, 41, 47]) netTay(g, [[x, -1 + (x - 35) * -0.2], [x, 20 + (x - 35) * 0.2]], { mau: m, day: 1.3, hat: hat + x, kin: false, bien: 0.2, a: 0.7 })
      ve(hcn(0, -1, 33, 21, 8), c, 3); ve(saoP(16, 9.5, 7.5, 3.2), b.sao, 4)
      for (const [x, y] of [[4, 2], [28, 2], [4, 17], [28, 17]] as P[]) to(g, elip(x, y, 1.3, 1.3, 6), m)
      bong(5, 1.6, 20)
    }
  })
}

// ── Vật chặn = đồ dùng học tập NỔI KHỐI 3D (thầy 13/11 «vẫn là 2d nhưng vẽ đổ bóng 3d»): mặt trên nâng lên, mặt trước tối hơn, bóng đổ từ chân khối ──
export type LoaiVat = 'thuoc' | 'butChi' | 'butDa' | 'tay'
export function loaiTuong(w: number, h: number, i: number): LoaiVat {
  const r = Math.max(w, h) / Math.min(w, h)
  return r >= 2.4 ? (i % 2 ? 'butChi' : 'thuoc') : 'butDa'
}
const BONG = 10
/** Chiều cao khối nổi (đơn vị sân). */
export const CAO_VAT = 16
function nuongVat(b: BangMau, k: number, loai: LoaiVat, w: number, h: number, hat: number, phang: boolean): Anh {
  const doc = h > w, cao = loai === 'tay' ? 20 : CAO_VAT, m = b.muc
  const chinh = loai === 'thuoc' ? pha(b.giay, b.tin, 0.32) : loai === 'butChi' ? b.sao : loai === 'butDa' ? pha(b.giay, b.tin, 0.5) : pha(b.giay, b.tin, 0.55)
  return nuong(w + BONG + 8, h + cao + BONG + 8, k, 2, 2 + cao, (g) => {
    g.translate(2, 2)
    if (phang) g.translate(0, cao) // kiểu phẳng: mặt trên nằm đúng chỗ chặn, không khối
    else {
      to(g, hcn(BONG * 0.45, cao + BONG * 0.45, w, h, 6), b.bong, b.bongA * 0.75); to(g, hcn(BONG, cao + BONG, w, h, 9), b.bong, b.bongA * 0.5)
      const truoc = hcn(0, h * 0.4, w, h * 0.6 + cao, 6); to(g, truoc, pha(chinh, DEN, 0.42))
      g.save(); duong(g, truoc, true); g.clip(); g.beginPath(); for (let x = 7; x < w; x += 9) { g.moveTo(x, h); g.lineTo(x - 3, h + cao) } g.strokeStyle = mau(DEN, 0.18); g.lineWidth = 1.2; g.stroke(); g.restore()
      netTay(g, truoc, { mau: m, day: 1.8, hat: hat + 20, bien: 0.8 })
    }
    if (doc) { g.translate(w, 0); g.rotate(Math.PI / 2) }
    const L = doc ? h : w, R = doc ? w : h
    const net = (p: P[], d = 1.8, h2 = 0) => netTay(g, p, { mau: m, day: d, hat: hat + h2, bien: 0.9 })
    if (loai === 'thuoc') {
      const p = hcn(0, 0, L, R, 3); to(g, p, chinh, 0.94)
      g.beginPath(); for (let x = 6; x < L - 3; x += 6) { const dai = x % 30 < 6 ? R * 0.42 : R * 0.22; g.moveTo(x, 0); g.lineTo(x, dai) } g.strokeStyle = mau(m, 0.55); g.lineWidth = 1; g.stroke()
      g.fillStyle = mau(m, 0.5); g.font = `${Math.round(R * 0.26)}px ${b.phong}`; for (let x = 30, n = 1; x < L - 8; x += 30, n++) g.fillText(String(n), x - 3, R * 0.78)
      net(p)
    } else if (loai === 'butChi') {
      const than = hcn(R * 0.9, 0, L - R * 1.9, R, 2); to(g, than, b.sao)
      g.beginPath(); g.moveTo(R * 0.9, R / 3); g.lineTo(L - R, R / 3); g.moveTo(R * 0.9, (R * 2) / 3); g.lineTo(L - R, (R * 2) / 3); g.strokeStyle = mau(pha(b.sao, m, 0.35), 0.7); g.lineWidth = 1.2; g.stroke()
      const tay = hcn(0, 2, R * 0.62, R - 4, 5); to(g, tay, pha(b.sai, b.giay, 0.45)); net(tay, 1.6, 1)
      const dai = hcn(R * 0.55, 0, R * 0.4, R, 1); to(g, dai, pha(b.giay, m, 0.3)); net(dai, 1.4, 2)
      const go: P[] = [[L - R, 0], [L - R * 0.18, R / 2], [L - R, R]]; to(g, go, pha(b.sao, m, 0.15)); net(go, 1.6, 3)
      to(g, [[L - R * 0.42, R * 0.34], [L - R * 0.05, R / 2], [L - R * 0.42, R * 0.66]], pha(m, b.giay, 0.4))
      net(than, 1.8, 4)
    } else if (loai === 'butDa') {
      const than = hcn(0, 0, L * 0.72, R, 8); to(g, than, chinh)
      const nap = hcn(L * 0.68, 1, L * 0.32, R - 2, 7); to(g, nap, b.tin); gach(g, nap, pha(b.tin, m, 0.4), 0.3, 3.5, 0.9, 1, hat)
      g.beginPath(); g.moveTo(L * 0.74, R * 0.5); g.lineTo(L * 0.96, R * 0.5); g.strokeStyle = mau(m, 0.5); g.lineWidth = 2; g.stroke()
      net(than, 1.8, 5); net(nap, 1.6, 6)
    } else {
      const p = hcn(0, 0, L, R, 7); to(g, p, b.giay)
      to(g, hcn(0, 0, L * 0.58, R, 7), chinh)
      const bao = hcn(L * 0.34, -1, L * 0.3, R + 2, 1); to(g, bao, pha(b.giay, b.sao, 0.35)); netTay(g, bao, { mau: m, day: 1.2, hat: hat + 8, bien: 0.5, a: 0.7 })
      net(p, 1.8, 7)
    }
    netTay(g, [[4, 2.5], [(doc ? h : w) - 6, 2.5]], { mau: m, day: 1.6, hat: hat + 21, kin: false, bien: 0.3, a: 0.45 })
  })
}
/** Bụi = mây nguệch ngoạc bút dạ xanh có ĐÁY (khối thấp) + bóng đổ; kiểu phẳng chỉ còn mặt mây. */
function nuongBui(b: BangMau, k: number, w: number, h: number, hat: number, phang: boolean): Anh {
  const xanh = b.doi[2] ?? b.dung, cx = w / 2 + 4, cy = h / 2 + 4, p: P[] = []
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, r = 1 + 0.09 * Math.sin(a * 7 + hat) + 0.05 * Math.sin(a * 3); p.push([cx + Math.cos(a) * (w / 2) * r, cy + Math.sin(a) * (h / 2) * r]) }
  return nuong(w + 18, h + 30, k, 4, 4, (g) => {
    if (!phang) {
      to(g, p.map(([x, y]) => [x + 7, y + 16] as P), b.bong, b.bongA * 0.8)
      const day = p.map(([x, y]) => [x, y + 11] as P); to(g, day, pha(xanh, DEN, 0.45)); netTay(g, day, { mau: xanh, day: 2, hat: hat + 2, bien: 1.2, a: 0.8 })
    }
    to(g, p, pha(xanh, b.giay, 0.4))
    nguech(g, p, xanh, 0.45, 5, 2.2, hat)
    netTay(g, p, { mau: xanh, day: 2.2, hat: hat + 1, bien: 1.4 })
  })
}
/** HỘP TIẾP TẾ 4 LOẠI (bản 2 đợt 2, thầy duyệt 13/11 — ảnh 09): khối giấy nhớ màu theo loại, mặt trước tối, góc gấp, băng dính, hình vẽ giữa mặt:
 *  + (hồi đầy máu) · khiên · tia chớp (chạy nhanh) · sao (Pháo Sao). Nướng một lần mỗi loại. */
export const mauHop = (b: BangMau, l: LoaiHop): Rgb => (l === 'mau' ? b.dung : l === 'khien' ? b.tin : l === 'nhanh' ? b.sao : b.sai)
const HINH_HOP: Record<LoaiHop, readonly (readonly number[])[]> = {
  mau: [[-3, -9], [3, -9], [3, -3], [9, -3], [9, 3], [3, 3], [3, 9], [-3, 9], [-3, 3], [-9, 3], [-9, -3], [-3, -3]],
  khien: [[0, -10], [9, -6], [8, 3], [0, 10], [-8, 3], [-9, -6]],
  nhanh: [[2, -11], [-7, 1], [-1, 1], [-3, 11], [7, -2], [1, -2]],
  sao: saoP(0, 0, 10.5, 4.5),
}
function nuongHop(b: BangMau, k: number, l: LoaiHop): Anh {
  const c = mauHop(b, l)
  return nuong(52, 56, k, 26, 30, (g) => {
    to(g, hcn(12, 20, 40, 34, 2), b.bong, b.bongA * 1.3)
    const truoc = hcn(6, 30, 40, 22, 2); to(g, truoc, pha(c, DEN, 0.42)); netTay(g, truoc, { mau: b.muc, day: 1.6, hat: 6, bien: 0.6 })
    const p = hcn(6, 6, 40, 38, 2)
    to(g, p, c); gach(g, p, pha(c, b.muc, 0.25), 0.18, 4, 0.8, 1, 3)
    to(g, [[34, 44], [46, 44], [46, 32]], pha(c, b.giay, 0.45))
    netTay(g, p, { mau: b.muc, day: 1.8, hat: 5, bien: 0.7 })
    const bang = hcn(16, 0, 20, 10, 1); to(g, bang, pha(b.giay, b.sao, 0.3), 0.75); netTay(g, bang, { mau: b.muc, day: 1, hat: 9, bien: 0.4, a: 0.5 })
    const hinh = HINH_HOP[l].map(([x, y]) => [26 + x * 1.05, 25 + y * 1.05] as P)
    to(g, hinh, b.giay); netTay(g, hinh, { mau: b.muc, day: 1.9, hat: 11, bien: 0.5 })
  })
}
/** Vương miện của THỦ KHOA đang bị truy nã (ảnh 07): hộp 34 × 24, neo giữa mép dưới. */
function nuongVuong(b: BangMau, k: number): Anh {
  return nuong(34, 24, k, 17, 22, (g) => {
    const p: P[] = [[4, 20], [3, 6], [10, 13], [17, 3], [24, 13], [31, 6], [30, 20]]
    to(g, p, b.sao); gach(g, p, pha(b.sao, b.muc, 0.3), 0.25, 3, 0.8, 1, 2); netTay(g, p, { mau: b.muc, day: 1.6, hat: 8, bien: 0.5 })
    for (const x of [10, 17, 24]) to(g, elip(x, 16, 1.8, 1.8, 8), b.sai)
  })
}
/** Bong bóng biểu cảm (ảnh 06): khung tròn góc giấy trắng phấn + đuôi chỉ xuống trái, chữ viết tay. Neo ở mũi đuôi. */
function nuongLoi(b: BangMau, k: number, chu: string): Anh {
  const co = 15, doRong = document.createElement('canvas').getContext('2d')
  let tw = chu.length * co * 0.48
  if (doRong) { doRong.font = `${co}px ${b.phong}`; tw = doRong.measureText(chu).width }
  const w = Math.ceil(tw + 20), h = 28
  return nuong(w + 4, h + 14, k, 10, h + 12, (g) => {
    const p = hcn(2, 2, w, h, 10)
    to(g, p, b.mat); to(g, [[12, h], [22, h], [8, h + 11]], b.mat)
    netTay(g, p, { mau: b.muc, day: 1.6, hat: 4, bien: 0.4 }); netTay(g, [[12, h + 2], [8, h + 11], [22, h + 2]], { mau: b.muc, day: 1.6, hat: 6, kin: false, bien: 0.3 })
    g.font = `${co}px ${b.phong}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = mau(b.muc); g.fillText(chu, 2 + w / 2, 2 + h / 2 + co * 0.35)
  })
}
function nuongVetMuc(b: BangMau, k: number, doi: number, hat: number): Anh {
  const p: P[] = [], c = b.doi[doi] ?? b.muc
  for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2, r = 11 + Math.sin(a * 5 + hat) * 3.5 + Math.sin(a * 9 + hat * 2) * 1.6; p.push([22 + Math.cos(a) * r, 22 + Math.sin(a) * r]) }
  return nuong(44, 44, k, 22, 22, (g) => {
    to(g, p, c, 0.55)
    for (let i = 0; i < 4; i++) { const a = hat + i * 1.7; to(g, elip(22 + Math.cos(a) * 18, 22 + Math.sin(a) * 18, 2.2, 2.2, 8), c, 0.5) }
  })
}
function nuongGiayVo(b: BangMau, k: number): Anh {
  return nuong(30, 30, k, 15, 15, (g) => {
    const p = elip(15, 15, 11, 10, 14).map(([x, y], i) => [x + (i % 2 ? 1.6 : -1.2), y + (i % 3 ? 1 : -1.4)] as P)
    to(g, p, b.giay); netTay(g, p, { mau: b.muc, day: 1.5, hat: 3, bien: 0.5 })
    netTay(g, [[9, 10], [15, 16], [21, 12]], { mau: b.muc, day: 1, hat: 4, kin: false, a: 0.6, bien: 0.3 })
    netTay(g, [[12, 21], [17, 17]], { mau: b.muc, day: 1, hat: 5, kin: false, a: 0.6, bien: 0.3 })
  })
}
function nuongLua(b: BangMau, k: number, doi: number): Anh {
  return nuong(20, 28, k, 10, 26, (g) => {
    const p: P[] = [[10, 26], [3, 18], [5, 10], [8, 13], [9, 3], [14, 11], [16, 8], [17, 18]]
    to(g, p, b.doi[doi] ?? b.sao); to(g, [[10, 24], [7, 19], [10, 13], [13, 19]], b.sao)
    netTay(g, p, { mau: b.muc, day: 1.5, hat: 7, bien: 0.5 })
  })
}
function nuongSao(b: BangMau, k: number, c: Rgb): Anh {
  return nuong(24, 24, k, 12, 12, (g) => { const p = saoP(12, 12, 10, 4.2); to(g, p, c); netTay(g, p, { mau: b.muc, day: 1.4, hat: 2, bien: 0.3 }) })
}
/** Chữ viết tay nướng sẵn (công thức, tên trại, «Thi lại!», «Bất tử 2 giây»…): `co` = cỡ chữ (đơn vị sân), neo ở GIỮA đường chân chữ (hoặc đầu dòng). */
function nuongChu(b: BangMau, k: number, chu: string, co: number, c: Rgb, a: number, vien: boolean, giua: boolean): Anh {
  const doRong = document.createElement('canvas').getContext('2d')
  let w = chu.length * co * 0.5
  if (doRong) { doRong.font = `${co}px ${b.phong}`; w = doRong.measureText(chu).width }
  const le = vien ? 4 : 2, rong = w + le * 2, cao = co * 1.5
  return nuong(rong, cao, k, giua ? rong / 2 : le, co * 1.1, (g) => {
    g.font = `${co}px ${b.phong}`; g.textBaseline = 'alphabetic'
    if (vien) { g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = mau(b.giay); g.strokeText(chu, le, co * 1.1) }
    g.fillStyle = mau(c, a); g.fillText(chu, le, co * 1.1)
  })
}
/** Hình vẽ chơi bên lề: vòng benzen · bình tam giác có bọt. */
function nuongBenzen(b: BangMau, k: number): Anh {
  return nuong(50, 50, k, 25, 25, (g) => {
    g.strokeStyle = mau(b.muc, 0.18); g.lineWidth = 1.6
    g.beginPath(); for (let i = 0; i <= 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3, x = 25 + Math.cos(a) * 22, y = 25 + Math.sin(a) * 22; if (i) g.lineTo(x, y); else g.moveTo(x, y) } g.stroke()
    g.beginPath(); g.arc(25, 25, 12, 0, Math.PI * 2); g.stroke()
  })
}
function nuongBinh(b: BangMau, k: number): Anh {
  return nuong(50, 48, k, 25, 38, (g) => {
    g.strokeStyle = mau(b.muc, 0.18); g.lineWidth = 1.6; g.lineJoin = 'round'
    g.beginPath(); g.moveTo(19, 4); g.lineTo(19, 22); g.lineTo(3, 46); g.lineTo(47, 46); g.lineTo(31, 22); g.lineTo(31, 4); g.stroke()
    g.beginPath(); g.moveTo(10, 36); g.lineTo(40, 36); g.stroke()
    for (const [dx, dy] of [[-4, -8], [5, -12], [0, -22]]) { g.beginPath(); g.arc(25 + dx, 38 + dy, 2.4, 0, Math.PI * 2); g.stroke() }
  })
}
/** Bóng mờ dưới bé ma (bé ma lơ lửng). */
function nuongBong(b: BangMau, k: number): Anh {
  return nuong(32, 12, k, 16, 6, (g) => { g.beginPath(); g.ellipse(16, 6, 15, 5, 0, 0, Math.PI * 2); g.fillStyle = mau(b.bong, b.bongA * 1.3); g.fill() })
}

/** Bộ hình nướng LƯỜI theo (bảng màu, k, kiểu phẳng): mỗi hình nướng lần đầu cần rồi giữ. Đổi cỡ màn / màu / kiểu ⇒ tạo bộ mới. */
export class BoHinh {
  private nho = new Map<string, Anh>()
  readonly b: BangMau; readonly k: number; readonly phang: boolean
  constructor(b: BangMau, k: number, phang: boolean) { this.b = b; this.k = k; this.phang = phang }
  /** Hạn nướng của khung này (`performance.now`): quá hạn thì hình CHƯA nướng được bỏ qua khung này (hiện ở khung kế) — khung đầu ở máy yếu không dồn cả chục lần nướng. 0 = không hạn. */
  han = 0
  private trong: Anh | null = null
  private lay(khoa: string, tao: () => Anh): Anh {
    let a = this.nho.get(khoa)
    if (!a) {
      if (this.han && performance.now() > this.han) return this.trong ??= { c: document.createElement('canvas'), w: 0, h: 0, ox: 0, oy: 0 }
      a = tao(); this.nho.set(khoa, a)
    }
    return a
  }
  /** Bé ma: `khung` 0 / 1 = hai lượt nét rung (kiểu phẳng luôn khung 0). */
  ma(doi: number, trai: boolean, khung: number): Anh { const kh = this.phang ? 0 : khung; return this.lay(`m${doi}${+trai}${kh}`, () => nuongMa(this.b, this.k, doi, trai, kh)) }
  sung(doi: number, cap: number): Anh { return this.lay(`s${doi}${cap}`, () => nuongSung(this.b, this.k, doi, cap)) }
  vat(loai: LoaiVat, w: number, h: number): Anh { return this.lay(`v${loai}${w}x${h}`, () => nuongVat(this.b, this.k, loai, w, h, w * 7 + h, this.phang)) }
  bui(w: number, h: number): Anh { return this.lay(`b${w}x${h}`, () => nuongBui(this.b, this.k, w, h, w + h, this.phang)) }
  hop(l: LoaiHop): Anh { return this.lay(`h${l}`, () => nuongHop(this.b, this.k, l)) }
  vuong(): Anh { return this.lay('w', () => nuongVuong(this.b, this.k)) }
  /** Bong bóng biểu cảm (khoá = chữ). */
  loi(chu: string): Anh { return this.lay(`i${chu}`, () => nuongLoi(this.b, this.k, chu)) }
  vet(doi: number, bien: number): Anh { return this.lay(`e${doi}${bien}`, () => nuongVetMuc(this.b, this.k, doi, bien * 2.3 + doi)) }
  vo(): Anh { return this.lay('o', () => nuongGiayVo(this.b, this.k)) }
  lua(doi: number): Anh { return this.lay(`l${doi}`, () => nuongLua(this.b, this.k, doi)) }
  sao(doi: number): Anh { return this.lay(`a${doi}`, () => nuongSao(this.b, this.k, this.b.doi[doi] ?? this.b.sao)) }
  bong(): Anh { return this.lay('g', () => nuongBong(this.b, this.k)) }
  benzen(): Anh { return this.lay('z', () => nuongBenzen(this.b, this.k)) }
  binh(): Anh { return this.lay('n', () => nuongBinh(this.b, this.k)) }
  /** Ảnh chữ viết tay (khoá = nội dung + kiểu). */
  chu(chu: string, co: number, c: Rgb, a = 1, vien = false, giua = true): Anh { return this.lay(`c${co}|${c.join()}|${a}|${+vien}|${+giua}|${chu}`, () => nuongChu(this.b, this.k, chu, co, c, a, vien, giua)) }
  /** Byte ảnh đang giữ (đo trần bộ nhớ). */
  boNho(): number { let s = 0; for (const a of this.nho.values()) s += a.c.width * a.c.height * 4; return s }
}
