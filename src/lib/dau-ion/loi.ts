// LÕI THUẦN «Đấu Nguyên Tử» — game bắn nhau của phòng chờ thi (thầy 30/10: «game bắn súng … học sinh chờ có thể bắn với nhau»).
// KHÔNG đụng DOM, mạng, đồng hồ thật: nhận `dt` (giây) từ ngoài, ngẫu nhiên là hạt giống nằm trong trận ⇒ tất định, test được.
// Dùng chung hai nơi: phòng đấu trên máy chủ (server/src/dau-ion-phong.ts — nơi QUYẾT trúng/hạ) và máy em (Tập với A.I chạy cục bộ,
// đoán trước bước đi của chính em khi đấu mạng). Đơn vị: sân vuông 600 × 600 đơn vị — cùng một sân cho điện thoại dọc, ngang, máy tính.

export const SAN = 600
export const R_NGUOI = 22
export const R_DAN = 7
export const TOC_DO = 210
export const TOC_DAN = 470
export const TAM_DAN = 560
/** Giây giữa hai viên khi giữ bắn; Xúc tác chia đôi. */
export const CHU_KY_BAN = 0.28
export const MAU_TOI_DA = 3
export const GIAY_HOI = 1.6
export const GIAY_KHIEN_HOI = 1.2
export const GIAY_VAT_PHAM = 12
export const GIAY_XUC_TAC = 5
/** Nhịp phòng đấu (giây). */
export const BUOC = 1 / 20

export type KieuTran = 'doi' | 'nhom' | 'ai'
export const LUAT: Record<KieuTran, { giay: number; haThang: number }> = { doi: { giay: 90, haThang: 5 }, nhom: { giay: 120, haThang: 7 }, ai: { giay: 90, haThang: 5 } }
/** Ký hiệu nguyên tố em chọn làm «áo» (màu theo quy ước CPK của mô hình phân tử, đặt ở lớp vẽ). */
export const NGUYEN_TO = ['Na', 'O', 'N', 'Cl', 'S', 'Fe', 'Ne'] as const
export const TEN_NGUYEN_TO = ['Sodium', 'Oxygen', 'Nitrogen', 'Chlorine', 'Sulfur', 'Iron', 'Neon'] as const

export type VatCan =
  | { k: 'tron'; x: number; y: number; r: number; ve: 'binh-cau' | 'binh-non' }
  | { k: 'cn'; x: number; y: number; w: number; h: number; ve: 'gia-ong' | 'coc' }
/** Vật che đối xứng tâm sân ⇒ hai góc xuất phát công bằng. */
export const VAT_CAN: readonly VatCan[] = [
  { k: 'tron', x: 300, y: 300, r: 46, ve: 'binh-cau' },
  { k: 'cn', x: 112, y: 150, w: 148, h: 28, ve: 'gia-ong' },
  { k: 'cn', x: 340, y: 422, w: 148, h: 28, ve: 'gia-ong' },
  { k: 'cn', x: 420, y: 128, w: 48, h: 48, ve: 'coc' },
  { k: 'cn', x: 132, y: 424, w: 48, h: 48, ve: 'coc' },
  { k: 'tron', x: 104, y: 300, r: 24, ve: 'binh-non' },
  { k: 'tron', x: 496, y: 300, r: 24, ve: 'binh-non' },
]
export const CHO_XUAT_PHAT: readonly (readonly [number, number])[] = [[70, 530], [530, 70], [70, 70], [530, 530]]
/** Chỗ vật phẩm hiện (giữa hai nửa sân, không trong vật che). */
const CHO_VAT_PHAM: readonly (readonly [number, number])[] = [[300, 196], [300, 404], [200, 300], [400, 300]]

export interface YDinh { dx: number; dy: number; ngam: number; ban: boolean }
export interface Ghe {
  id: number; nt: number; x: number; y: number; ngam: number
  mau: number; ha: number; biHa: number
  /** Giây còn chờ hồi lại; 0 = đang trên sân. */
  cho: number
  /** Giây còn được che sau khi hồi (đạn không làm mất Máu). */
  khien: number
  xucTac: number
  /** Khiên nhặt được: chặn trọn một viên. */
  giap: boolean
  nap: number; ban: number; trung: number; chuoi: number; chuoiMax: number
  yd: YDinh
}
export interface Dan { id: number; chu: number; x: number; y: number; vx: number; vy: number; con: number }
/** 0 = Xúc tác (bắn nhanh gấp đôi), 1 = Khiên (chặn một viên). */
export type LoaiVatPham = 0 | 1
export type SuKien =
  | { t: 'ban'; id: number; chu: number; x: number; y: number; ngam: number }
  | { t: 'trung'; id: number; ai: number; boi: number; mau: number; x: number; y: number }
  | { t: 'chan'; id: number; x: number; y: number }
  | { t: 'ha'; ai: number; boi: number; x: number; y: number }
  | { t: 'hoi'; ai: number }
  | { t: 'vp'; loai: LoaiVatPham; x: number; y: number }
  | { t: 'nhat'; ai: number; loai: LoaiVatPham }
export interface Tran {
  kieu: KieuTran; ghe: Ghe[]; dan: Dan[]
  vp: { loai: LoaiVatPham; x: number; y: number } | null
  henVp: number; con: number; xong: boolean
  /** id ghế thắng; null = hoà (chỉ có nghĩa khi xong). */
  thang: number | null
  idDan: number; su: SuKien[]; hat: number
}

const kep = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
/** Ngẫu nhiên tất định (mulberry32), trạng thái nằm trong trận. */
export function ngauNhien(tr: { hat: number }): number {
  let t = (tr.hat = (tr.hat + 0x6d2b79f5) | 0)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function taoGhe(id: number, nt: number, i: number): Ghe {
  const [x, y] = CHO_XUAT_PHAT[i % 4]
  return { id, nt: kep(nt | 0, 0, NGUYEN_TO.length - 1), x, y, ngam: Math.atan2(300 - y, 300 - x), mau: MAU_TOI_DA, ha: 0, biHa: 0, cho: 0, khien: GIAY_KHIEN_HOI, xucTac: 0, giap: false, nap: 0.4, ban: 0, trung: 0, chuoi: 0, chuoiMax: 0, yd: { dx: 0, dy: 0, ngam: Math.atan2(300 - y, 300 - x), ban: false } }
}

export function taoTran(kieu: KieuTran, ds: readonly { id: number; nt: number }[], hat = 1): Tran {
  return { kieu, ghe: ds.slice(0, 4).map((g, i) => taoGhe(g.id, g.nt, i)), dan: [], vp: null, henVp: GIAY_VAT_PHAM / 2, con: LUAT[kieu].giay, xong: false, thang: null, idDan: 1, su: [], hat: hat | 0 || 1 }
}

/** Điểm (x, y) bán kính r có lấn vật che nào không. */
export function dungVatCan(x: number, y: number, r: number): boolean {
  for (const v of VAT_CAN) {
    if (v.k === 'tron') { if ((x - v.x) ** 2 + (y - v.y) ** 2 < (v.r + r) ** 2) return true }
    else if ((x - kep(x, v.x, v.x + v.w)) ** 2 + (y - kep(y, v.y, v.y + v.h)) ** 2 < r * r) return true
  }
  return false
}

/** Đẩy hình tròn ra khỏi vật che và mép sân. */
function dayRa(p: { x: number; y: number }, r: number): void {
  for (const v of VAT_CAN) {
    if (v.k === 'tron') {
      const dx = p.x - v.x, dy = p.y - v.y, d = Math.hypot(dx, dy), m = v.r + r
      if (d < m) { const k = d > 0.001 ? m / d : 1; p.x = v.x + (d > 0.001 ? dx : 1) * k; p.y = v.y + (d > 0.001 ? dy : 0) * k }
    } else {
      const cx = kep(p.x, v.x, v.x + v.w), cy = kep(p.y, v.y, v.y + v.h)
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy)
      if (d < r) {
        if (d > 0.001) { p.x = cx + (dx / d) * r; p.y = cy + (dy / d) * r }
        else { // tâm lọt hẳn vào trong: ra theo cạnh gần nhất
          const trai = p.x - v.x, phai = v.x + v.w - p.x, tren = p.y - v.y, duoi = v.y + v.h - p.y, m = Math.min(trai, phai, tren, duoi)
          if (m === trai) p.x = v.x - r; else if (m === phai) p.x = v.x + v.w + r; else if (m === tren) p.y = v.y - r; else p.y = v.y + v.h + r
        }
      }
    }
  }
  p.x = kep(p.x, r, SAN - r); p.y = kep(p.y, r, SAN - r)
}

/** Một bước đi (dùng chung cho máy chủ và phần đoán trước của máy em). dx, dy ∈ [-1, 1]. */
export function diChuyen(x: number, y: number, dx: number, dy: number, dt: number): { x: number; y: number } {
  let l = Math.hypot(dx, dy)
  if (!(l > 0.05)) return { x, y }
  if (l > 1) { dx /= l; dy /= l; l = 1 }
  const p = { x: x + dx * TOC_DO * dt, y: y + dy * TOC_DO * dt }
  dayRa(p, R_NGUOI)
  return p
}

/** Đường thẳng giữa hai điểm có bị vật che chắn không (A.I dùng để biết có bắn trúng được không). */
export function thayNhau(ax: number, ay: number, bx: number, by: number): boolean {
  const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 14)
  for (let i = 1; i < n; i++) if (dungVatCan(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n, R_DAN - 2)) return false
  return true
}

/** Chỗ hồi xa kẻ địch gần nhất. */
function choHoi(tr: Tran, g: Ghe): readonly [number, number] {
  let tot = CHO_XUAT_PHAT[0], xa = -1
  for (const c of CHO_XUAT_PHAT) {
    let gan = 1e9
    for (const k of tr.ghe) if (k !== g && k.cho === 0) gan = Math.min(gan, Math.hypot(k.x - c[0], k.y - c[1]))
    if (gan > xa) { xa = gan; tot = c }
  }
  return tot
}

function ketThuc(tr: Tran): void {
  tr.xong = true
  let max = -1, ai: number | null = null
  for (const g of tr.ghe) { if (g.ha > max) { max = g.ha; ai = g.id } else if (g.ha === max) ai = null }
  tr.thang = ai
}

function trungNguoi(tr: Tran, d: Dan, g: Ghe): void {
  const boi = tr.ghe.find((k) => k.id === d.chu)
  if (g.khien > 0 || g.giap) {
    g.giap = g.khien > 0 ? g.giap : false
    tr.su.push({ t: 'chan', id: d.id, x: d.x, y: d.y })
    return
  }
  g.mau--
  if (boi) boi.trung++
  tr.su.push({ t: 'trung', id: d.id, ai: g.id, boi: d.chu, mau: g.mau, x: d.x, y: d.y })
  if (g.mau > 0) return
  g.cho = GIAY_HOI; g.biHa++; g.chuoi = 0; g.xucTac = 0; g.giap = false; g.yd.ban = false
  tr.su.push({ t: 'ha', ai: g.id, boi: d.chu, x: g.x, y: g.y })
  if (boi) {
    boi.ha++; boi.chuoi++; boi.chuoiMax = Math.max(boi.chuoiMax, boi.chuoi)
    if (boi.ha >= LUAT[tr.kieu].haThang) ketThuc(tr)
  }
}

/** Một bước của trận. Sự kiện mới được ĐẨY vào `tr.su` — nơi gọi lấy rồi xoá (`laySuKien`). */
export function buocTran(tr: Tran, dt: number): void {
  if (tr.xong || !(dt > 0)) return
  tr.con = Math.max(0, tr.con - dt)
  // Vật phẩm: một cái trên sân, hiện lại sau GIAY_VAT_PHAM kể từ khi được nhặt.
  if (!tr.vp) {
    tr.henVp -= dt
    if (tr.henVp <= 0) {
      const [x, y] = CHO_VAT_PHAM[Math.floor(ngauNhien(tr) * CHO_VAT_PHAM.length)]
      const loai: LoaiVatPham = ngauNhien(tr) < 0.55 ? 0 : 1
      tr.vp = { loai, x, y }; tr.su.push({ t: 'vp', loai, x, y })
    }
  }
  for (const g of tr.ghe) {
    if (g.cho > 0) {
      g.cho = Math.max(0, g.cho - dt)
      if (g.cho === 0) {
        const [x, y] = choHoi(tr, g)
        g.x = x; g.y = y; g.mau = MAU_TOI_DA; g.khien = GIAY_KHIEN_HOI; g.nap = 0.3
        tr.su.push({ t: 'hoi', ai: g.id })
      }
      continue
    }
    const p = diChuyen(g.x, g.y, g.yd.dx, g.yd.dy, dt)
    g.x = p.x; g.y = p.y
    if (Number.isFinite(g.yd.ngam)) g.ngam = g.yd.ngam
    g.khien = Math.max(0, g.khien - dt); g.xucTac = Math.max(0, g.xucTac - dt); g.nap -= dt
    if (g.yd.ban && g.nap <= 0) {
      g.nap = CHU_KY_BAN / (g.xucTac > 0 ? 2 : 1)
      const c = Math.cos(g.ngam), s = Math.sin(g.ngam)
      const d: Dan = { id: tr.idDan, chu: g.id, x: g.x + c * (R_NGUOI + 6), y: g.y + s * (R_NGUOI + 6), vx: c * TOC_DAN, vy: s * TOC_DAN, con: TAM_DAN }
      tr.idDan = (tr.idDan % 65535) + 1
      g.ban++
      tr.dan.push(d); tr.su.push({ t: 'ban', id: d.id, chu: g.id, x: d.x, y: d.y, ngam: g.ngam })
    } else if (g.nap < 0) g.nap = 0
    if (tr.vp && Math.hypot(g.x - tr.vp.x, g.y - tr.vp.y) < R_NGUOI + 16) {
      if (tr.vp.loai === 0) g.xucTac = GIAY_XUC_TAC; else g.giap = true
      tr.su.push({ t: 'nhat', ai: g.id, loai: tr.vp.loai })
      tr.vp = null; tr.henVp = GIAY_VAT_PHAM
    }
  }
  // Hai em không chồng lên nhau.
  for (let i = 0; i < tr.ghe.length; i++) for (let j = i + 1; j < tr.ghe.length; j++) {
    const a = tr.ghe[i], b = tr.ghe[j]
    if (a.cho || b.cho) continue
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = R_NGUOI * 2
    if (d < m && d > 0.001) { const k = (m - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; b.x += dx * k; b.y += dy * k; dayRa(a, R_NGUOI); dayRa(b, R_NGUOI) }
  }
  // Đạn: chia bước nhỏ (≤ 12 đơn vị) để không xuyên vật che mỏng.
  for (let i = tr.dan.length - 1; i >= 0; i--) {
    const d = tr.dan[i]
    const n = Math.max(1, Math.ceil((TOC_DAN * dt) / 12))
    let mat = false
    for (let k = 0; k < n && !mat; k++) {
      d.x += (d.vx * dt) / n; d.y += (d.vy * dt) / n; d.con -= (TOC_DAN * dt) / n
      if (d.con <= 0 || d.x < 0 || d.y < 0 || d.x > SAN || d.y > SAN || dungVatCan(d.x, d.y, R_DAN - 2)) {
        tr.su.push({ t: 'chan', id: d.id, x: kep(d.x, 0, SAN), y: kep(d.y, 0, SAN) }); mat = true; break
      }
      for (const g of tr.ghe) {
        if (g.id === d.chu || g.cho > 0) continue
        if ((g.x - d.x) ** 2 + (g.y - d.y) ** 2 < (R_NGUOI + R_DAN) ** 2) { trungNguoi(tr, d, g); mat = true; break }
      }
    }
    if (mat) tr.dan.splice(i, 1)
    if (tr.xong) break
  }
  if (!tr.xong && tr.con <= 0) ketThuc(tr)
}

/** Lấy sự kiện đã dồn và xoá khỏi trận. */
export function laySuKien(tr: Tran): SuKien[] { const s = tr.su; tr.su = []; return s }

/** Ý định của A.I (Tập với A.I). `muc` 0 = dễ, 1 = vừa. */
export function yDinhAI(tr: Tran, g: Ghe, muc: 0 | 1): YDinh {
  if (g.cho > 0) return { dx: 0, dy: 0, ngam: g.ngam, ban: false }
  let dich: Ghe | null = null, gan = 1e9
  for (const k of tr.ghe) if (k !== g && k.cho === 0) { const d = Math.hypot(k.x - g.x, k.y - g.y); if (d < gan) { gan = d; dich = k } }
  // Nhặt vật phẩm nếu gần hơn kẻ địch.
  let mx = 300, my = 300
  if (tr.vp && Math.hypot(tr.vp.x - g.x, tr.vp.y - g.y) < 170) { mx = tr.vp.x; my = tr.vp.y }
  else if (dich) {
    const huong = Math.atan2(g.y - dich.y, g.x - dich.x)
    const ne = Math.sin(tr.con * (muc ? 1.3 : 0.8) + g.id) > 0 ? 1 : -1
    const giu = muc ? 210 : 250
    mx = dich.x + Math.cos(huong) * giu + Math.cos(huong + Math.PI / 2) * 90 * ne
    my = dich.y + Math.sin(huong) * giu + Math.sin(huong + Math.PI / 2) * 90 * ne
  }
  let dx = mx - g.x, dy = my - g.y
  const l = Math.hypot(dx, dy)
  if (l < 14) { dx = 0; dy = 0 } else { dx /= l; dy /= l }
  // Bị vật che chặn đường ⇒ lách sang bên.
  if ((dx || dy) && dungVatCan(g.x + dx * 30, g.y + dy * 30, R_NGUOI)) { const t = dx; dx = -dy; dy = t }
  if (!dich) return { dx, dy, ngam: g.ngam, ban: false }
  const lech = (ngauNhien(tr) - 0.5) * (muc ? 0.2 : 0.42)
  // Đón đầu một phần đường đi của mục tiêu.
  const tg = (gan / TOC_DAN) * (muc ? 0.6 : 0.25)
  const ngam = Math.atan2(dich.y + dich.yd.dy * TOC_DO * tg - g.y, dich.x + dich.yd.dx * TOC_DO * tg - g.x) + lech
  return { dx: dx * (muc ? 0.95 : 0.8), dy: dy * (muc ? 0.95 : 0.8), ngam, ban: gan < 470 && thayNhau(g.x, g.y, dich.x, dich.y) }
}

export interface DongKet { id: number; ha: number; biHa: number; ban: number; trung: number; chuoiMax: number }
export function bangKet(tr: Tran): DongKet[] {
  return tr.ghe.map((g) => ({ id: g.id, ha: g.ha, biHa: g.biHa, ban: g.ban, trung: g.trung, chuoiMax: g.chuoiMax })).sort((a, b) => b.ha - a.ha || a.biHa - b.biHa)
}
