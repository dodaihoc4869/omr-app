// TRÒ «SINH TỒN» ở phòng chờ Live theo khối (thầy chốt 12/11; đặc tả docs/dac-ta-sinh-ton-1211.md mục 4) — LÕI THUẦN: không DOM, không đồng hồ, không
// ngẫu nhiên ẩn. Máy em tự mô phỏng bé ma của mình; phòng gom vị trí, tính máy bù chỗ và phát ảnh chụp mỗi 250 ms (hợp đồng ./kieu.ts).
// Sát thương do bên BỊ bắn tự tính từ ảnh chụp (ai khai `t` = mình) ⇒ không có gói «đạn»; đạn trên màn chỉ là hình vẽ.
import type { SinhTonDong } from './kieu'

/** Một ván = 2 phút chơi + 5 giây bảng kết quả (thầy 12/11 tối: «cho màn chơi nhiều thời gian hơn chút»; trước là 90 giây); `vanSo` = hạt giống chung cả phòng. */
export const VAN_CHOI_MS = 120_000
export const VAN_MS = 125_000
export const MAU_DAY = 100
/** TẦM NHÌN = tầm súng (thầy 12/11 chiều: «tự bắn khi thấy đối thủ gần nhất», không phải tới sát mới bắn): súng bắn đối thủ gần nhất nằm trong khung nhìn.
 *  Máy em truyền đúng khung màn hình của mình; không truyền (máy bù chỗ) thì dùng khung mặc định nửa rộng × nửa cao dưới đây — cỡ màn điện thoại ngang. */
export const TAM_NHIN_X = 500
export const TAM_NHIN_Y = 240
/** Xa hơn mức này thì chắc chắn không ai thấy ai (chặn gói khai mục tiêu sai). */
export const TAM_XA = 660
/** Khung nhìn trên sân: đối thủ phải nằm trong khung mới bị bắn. */
export interface KhungNhin { x0: number; y0: number; x1: number; y1: number }
/** Bán kính va chạm của một bé ma. */
export const BK_NV = 18
export const TOC_DO = 190
export const TOC_DO_MAY = 160
/** 3 giây không trúng đạn ⇒ hồi 15 máu mỗi giây. */
export const HOI_CHO_MS = 3000
const HOI_MOI_GIAY = 15
const NGOAI_VONG_MOI_GIAY = 8
export const HOI_SINH_MS = 3000
export const BAT_TU_MS = 2000
/** Đứng trong bụi: đối thủ tới gần dưới mức này mới thấy. */
export const LO_GAN = 70
/** Đứng yên trong bụi chừng này thì súng ngừng bắn (ẩn hẳn, máu hồi). */
export const AN_YEN_MS = 400
/** Máu mất mỗi giây theo cấp súng 1..4 của bên bắn. */
export const SAT_THUONG_GIAY = [30, 40, 50, 60] as const
/** Máy bù chỗ bắn yếu hơn người. */
const HE_MAY = 0.67
/** Cấp 3 «Súng Sấm»: nảy sang MỘT đối thủ gần mục tiêu; cấp 4 «Pháo Sao»: nổ lan quanh mục tiêu — đều nửa sát thương. */
const NAY_BK = 90
const NO_BK = 60
export const CAP_TOI_DA = 4
export const CAP_MAY_TOI_DA = 2
/** Hộp tiếp tế giữa sân: 20 giây một hộp. */
export const HOP_MS = 20_000
export const HOP_BK = 36
export const ANH_MS = 250
export const NHIP_GUI_MS = 250
export const NHIP_NHAC_MS = 2000
/** Cạnh ô lưới tìm đường. */
const O = 40
export const SUNG_TEN = ['Súng Hạt', 'Súng Đôi', 'Súng Sấm', 'Pháo Sao'] as const

export interface Diem { x: number; y: number }
export interface ChuNhat { x: number; y: number; w: number; h: number }
export interface BanDo {
  cap: number; rong: number; cao: number
  tuong: ChuNhat[]; thung: ChuNhat[]; bui: ChuNhat[]
  /** Trại bốn đội (Natri trên-trái · Kali trên-phải · Đồng dưới-trái · Canxi dưới-phải). */ trai: Diem[]
  /** Vật chặn đạn + chặn đường = tường + thùng. */ chan: ChuNhat[]
  cot: number; hang: number
  /** 1 = ô không đi được (tâm ô nằm trong vật chặn đã nới bằng bán kính bé ma). */ luoi: Uint8Array
}
export interface Vong { cx: number; cy: number; rx: number; ry: number }
/** Một nhân vật như ảnh chụp cho thấy. */
export interface NhanVat { id: string; x: number; y: number; mau: number; doi: number; cap: number; t: string }
/** Bé ma của CHÍNH em. Mốc giờ theo giờ phòng (ms); 0 = không có. */
export interface Toi {
  x: number; y: number; mau: number; doi: number; cap: number
  /** > 0: đang bị hạ, hồi sinh lúc này. */ chetDen: number
  batTuDen: number
  /** Lần cuối trúng đạn / mất máu ngoài vòng. */ lucTrung: number
  /** Lần cuối di chuyển (để biết đang đứng yên trong bụi). */ lucDong: number
  van: number
  /** Đường đang tự chạy theo (chạm để tới). */ duong: Diem[]
}

export const laMay = (id: string): boolean => id.charCodeAt(0) === 126 // '~'
export const vanSo = (nay: number): number => Math.floor(nay / VAN_MS)
/** 5 giây cuối mỗi ván: bảng kết quả, không ai bắn ai. */
export const dangNghi = (nay: number): boolean => ((nay % VAN_MS) + VAN_MS) % VAN_MS >= VAN_CHOI_MS
export const conLai = (nay: number): number => Math.max(0, VAN_CHOI_MS - (((nay % VAN_MS) + VAN_MS) % VAN_MS))
export const hopSo = (nay: number): number => Math.floor(nay / HOP_MS)
/** Cỡ bản đồ theo số nhân vật trên sân: tới 24 ⇒ 0, tới 60 ⇒ 1, hơn ⇒ 2. */
export const capBanDo = (soNhanVat: number): number => (soNhanVat <= 24 ? 0 : soNhanVat <= 60 ? 1 : 2)
const kep = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)

// ── Bản đồ: một phần tư rồi lấy đối xứng hai trục ⇒ bốn đội công bằng. Cỡ lớn = cùng mẫu nhân hệ số. ──
const RONG = 1600
const CAO = 1000
const PT_TUONG: readonly (readonly number[])[] = [[262, 150, 44, 130], [110, 312, 130, 44], [450, 262, 170, 44], [650, 372, 44, 92], [650, 372, 112, 44], [778, 60, 44, 96]]
const PT_THUNG: readonly (readonly number[])[] = [[372, 424, 54, 54], [566, 104, 54, 54], [60, 473, 54, 54]]
const PT_BUI: readonly (readonly number[])[] = [[340, 150, 150, 92], [205, 452, 130, 96], [715, 190, 170, 86], [470, 620, 140, 90]]
const HE_CAP = [1, 1.5, 2]
function doiXung(ds: readonly (readonly number[])[], he: number): ChuNhat[] {
  const kq: ChuNhat[] = []
  for (const [x, y, w, h] of ds) {
    // Vật nằm đúng trên trục thì bản đối xứng trùng chính nó ⇒ chỉ giữ một.
    const thay = new Set<string>()
    for (const [a, b] of [[x, y], [RONG - x - w, y], [x, CAO - y - h], [RONG - x - w, CAO - y - h]]) {
      const khoa = `${a},${b}`
      if (thay.has(khoa)) continue
      thay.add(khoa)
      kq.push({ x: a * he, y: b * he, w: w * he, h: h * he })
    }
  }
  return kq
}
const trongHop = (c: ChuNhat, x: number, y: number, noi: number): boolean => x > c.x - noi && x < c.x + c.w + noi && y > c.y - noi && y < c.y + c.h + noi
const NHO_BAN_DO: (BanDo | undefined)[] = []
export function taoBanDo(cap: number): BanDo {
  const c = cap === 1 || cap === 2 ? cap : 0
  const co = NHO_BAN_DO[c]
  if (co) return co
  const he = HE_CAP[c], rong = RONG * he, cao = CAO * he
  const tuong = doiXung(PT_TUONG, he), thung = doiXung(PT_THUNG, he), chan = [...tuong, ...thung]
  const cot = Math.ceil(rong / O), hang = Math.ceil(cao / O), luoi = new Uint8Array(cot * hang)
  for (let j = 0; j < hang; j++) for (let i = 0; i < cot; i++) {
    const x = i * O + O / 2, y = j * O + O / 2
    if (chan.some((v) => trongHop(v, x, y, BK_NV + 2))) luoi[j * cot + i] = 1
  }
  const bd: BanDo = {
    cap: c, rong, cao, tuong, thung, bui: doiXung(PT_BUI, he), chan, cot, hang, luoi,
    trai: [[130, 122], [RONG - 130, 122], [130, CAO - 122], [RONG - 130, CAO - 122]].map(([x, y]) => ({ x: x * he, y: y * he })),
  }
  NHO_BAN_DO[c] = bd
  return bd
}
/** Bụi là hình bầu dục nội tiếp ô của nó. */
export function trongBui(bd: BanDo, x: number, y: number): boolean {
  for (const b of bd.bui) {
    const dx = (x - b.x - b.w / 2) / (b.w / 2), dy = (y - b.y - b.h / 2) / (b.h / 2)
    if (dx * dx + dy * dy <= 1) return true
  }
  return false
}
/** Vòng an toàn co dần suốt thời gian chơi của ván: từ kín sân về 42% bán trục. */
export function vong(bd: BanDo, nay: number): Vong {
  const t = kep((((nay % VAN_MS) + VAN_MS) % VAN_MS) / VAN_CHOI_MS, 0, 1)
  const he = Math.SQRT2 + (0.42 - Math.SQRT2) * t
  return { cx: bd.rong / 2, cy: bd.cao / 2, rx: (bd.rong / 2) * he, ry: (bd.cao / 2) * he }
}
export function ngoaiVong(v: Vong, x: number, y: number): boolean {
  const dx = (x - v.cx) / v.rx, dy = (y - v.cy) / v.ry
  return dx * dx + dy * dy > 1
}
/** Đoạn thẳng có cắt hình chữ nhật (đã nới `noi`) không — phép cắt theo tấm. */
function catHop(c: ChuNhat, x1: number, y1: number, x2: number, y2: number, noi: number): boolean {
  let t0 = 0, t1 = 1
  const dx = x2 - x1, dy = y2 - y1
  const tam: [number, number, number, number][] = [[-dx, x1 - (c.x - noi), dx, c.x + c.w + noi - x1], [-dy, y1 - (c.y - noi), dy, c.y + c.h + noi - y1]]
  for (const [p1, q1, p2, q2] of tam) for (const [p, q] of [[p1, q1], [p2, q2]]) {
    if (p === 0) { if (q < 0) return false; continue }
    const r = q / p
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r } else { if (r < t0) return false; if (r < t1) t1 = r }
  }
  return t0 <= t1
}
/** Tường / thùng chắn đường NGẮM giữa hai điểm? */
export const chanDuong = (bd: BanDo, x1: number, y1: number, x2: number, y2: number): boolean => bd.chan.some((c) => catHop(c, x1, y1, x2, y2, 0))
/** …chắn đường ĐI (vật chặn nới bằng bán kính bé ma)? */
const chanDi = (bd: BanDo, x1: number, y1: number, x2: number, y2: number): boolean => bd.chan.some((c) => catHop(c, x1, y1, x2, y2, BK_NV + 1))
const bi = (bd: BanDo, x: number, y: number): boolean => bd.chan.some((c) => trongHop(c, x, y, BK_NV))
/** Đi một bước, trượt dọc tường (tách hai trục), không ra khỏi sân. */
export function diChuyen(bd: BanDo, x: number, y: number, dx: number, dy: number): Diem {
  let nx = kep(x + dx, BK_NV, bd.rong - BK_NV)
  if (bi(bd, nx, y)) nx = x
  let ny = kep(y + dy, BK_NV, bd.cao - BK_NV)
  if (bi(bd, nx, ny)) ny = y
  return { x: nx, y: ny }
}

// ── Tìm đường (chạm để tới, máy bù chỗ): A* tám hướng trên lưới ô 40, không cắt góc, rồi kéo thẳng các khúc không vướng. ──
const oCua = (bd: BanDo, x: number, y: number): number => kep(Math.floor(y / O), 0, bd.hang - 1) * bd.cot + kep(Math.floor(x / O), 0, bd.cot - 1)
function oTrongGan(bd: BanDo, o: number): number {
  if (!bd.luoi[o]) return o
  const i0 = o % bd.cot, j0 = Math.floor(o / bd.cot)
  for (let r = 1; r < 8; r++) for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) {
    if (i < 0 || j < 0 || i >= bd.cot || j >= bd.hang || (Math.abs(i - i0) !== r && Math.abs(j - j0) !== r)) continue
    if (!bd.luoi[j * bd.cot + i]) return j * bd.cot + i
  }
  return o
}
const HUONG: readonly (readonly [number, number])[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
/** Đường từ (x1, y1) tới (x2, y2): danh sách điểm phải qua (không gồm điểm đầu). Đích trong tường ⇒ tới ô trống gần nhất. Không có đường ⇒ []. */
export function timDuong(bd: BanDo, x1: number, y1: number, x2: number, y2: number): Diem[] {
  const dau = oTrongGan(bd, oCua(bd, x1, y1)), dichGoc = oCua(bd, x2, y2), dich = oTrongGan(bd, dichGoc)
  const n = bd.cot * bd.hang, g = new Float32Array(n).fill(Infinity), f = new Float32Array(n).fill(Infinity), cha = new Int32Array(n).fill(-1), dong = new Uint8Array(n)
  const uoc = (o: number): number => Math.hypot((o % bd.cot) - (dich % bd.cot), Math.floor(o / bd.cot) - Math.floor(dich / bd.cot))
  const mo: number[] = [dau]
  g[dau] = 0; f[dau] = uoc(dau)
  let toi = -1
  while (mo.length) {
    let k = 0
    for (let i = 1; i < mo.length; i++) if (f[mo[i]] < f[mo[k]]) k = i
    const o = mo[k]
    mo[k] = mo[mo.length - 1]; mo.pop()
    if (o === dich) { toi = o; break }
    if (dong[o]) continue
    dong[o] = 1
    const i0 = o % bd.cot, j0 = Math.floor(o / bd.cot)
    for (const [di, dj] of HUONG) {
      const i = i0 + di, j = j0 + dj
      if (i < 0 || j < 0 || i >= bd.cot || j >= bd.hang) continue
      const q = j * bd.cot + i
      if (bd.luoi[q] || dong[q] || (di && dj && (bd.luoi[j0 * bd.cot + i] || bd.luoi[j * bd.cot + i0]))) continue
      const moi = g[o] + (di && dj ? Math.SQRT2 : 1)
      if (moi >= g[q]) continue
      g[q] = moi; f[q] = moi + uoc(q); cha[q] = o
      mo.push(q)
    }
  }
  if (toi < 0) return []
  const tho: Diem[] = []
  for (let o = toi; o !== dau && o >= 0; o = cha[o]) tho.push({ x: (o % bd.cot) * O + O / 2, y: Math.floor(o / bd.cot) * O + O / 2 })
  tho.reverse()
  // Đích thật nằm ở ô trống ⇒ điểm cuối là đúng chỗ chạm.
  if (dich === dichGoc && !bi(bd, x2, y2)) { if (tho.length) tho[tho.length - 1] = { x: x2, y: y2 }; else tho.push({ x: x2, y: y2 }) }
  const kq: Diem[] = []
  let gx = x1, gy = y1, i = 0
  while (i < tho.length) {
    let xa = i
    for (let j = tho.length - 1; j > i; j--) if (!chanDi(bd, gx, gy, tho[j].x, tho[j].y)) { xa = j; break }
    kq.push(tho[xa]); gx = tho[xa].x; gy = tho[xa].y; i = xa + 1
  }
  return kq
}

// ── Ngắm và sát thương ──
/** Nhân vật `nv` có đang ẩn với người đứng ở (x, y) thuộc đội `doi` không: khác đội + trong bụi + không bắn + ở xa. */
export function anVoi(bd: BanDo, nv: NhanVat, x: number, y: number, doi: number): boolean {
  return nv.doi !== doi && !nv.t && trongBui(bd, nv.x, nv.y) && Math.hypot(nv.x - x, nv.y - y) > LO_GAN
}
/** Súng tự chọn: đối thủ GẦN NHẤT còn máu, nằm trong khung nhìn, không ẩn trong bụi, không bị tường chắn. '' = không thấy ai. */
export function chonMucTieu(bd: BanDo, toi: { x: number; y: number; doi: number }, ds: readonly NhanVat[], khung?: KhungNhin): string {
  const k = khung ?? { x0: toi.x - TAM_NHIN_X, y0: toi.y - TAM_NHIN_Y, x1: toi.x + TAM_NHIN_X, y1: toi.y + TAM_NHIN_Y }
  let gan = TAM_XA, id = ''
  for (const nv of ds) {
    if (nv.doi === toi.doi || nv.mau <= 0 || nv.x < k.x0 || nv.x > k.x1 || nv.y < k.y0 || nv.y > k.y1) continue
    const d = Math.hypot(nv.x - toi.x, nv.y - toi.y)
    if (d >= gan || anVoi(bd, nv, toi.x, toi.y, toi.doi) || chanDuong(bd, toi.x, toi.y, nv.x, nv.y)) continue
    gan = d; id = nv.id
  }
  return id
}
const satThuongCua = (nv: NhanVat): number => SAT_THUONG_GIAY[kep(Math.round(nv.cap), 1, CAP_TOI_DA) - 1] * (laMay(nv.id) ? HE_MAY : 1)
/** Máu `toi` mất trong `giay` giây theo ảnh chụp `ds` (những nhân vật KHÁC). `ai` = mã kẻ gây nhiều nhất (để báo lượt hạ). */
export function satThuong(toi: { id: string; x: number; y: number; doi: number }, ds: readonly NhanVat[], giay: number): { tong: number; ai: string } {
  let tong = 0, ai = '', nhat = 0
  for (const e of ds) {
    if (e.doi === toi.doi || e.mau <= 0 || !e.t || e.id === toi.id) continue
    let he = 0
    if (e.t === toi.id) he = Math.hypot(e.x - toi.x, e.y - toi.y) <= TAM_XA ? 1 : 0
    else if (e.cap >= 3) {
      const mt = ds.find((n) => n.id === e.t)
      if (!mt || mt.doi === e.doi || mt.mau <= 0) continue
      const d = Math.hypot(mt.x - toi.x, mt.y - toi.y)
      if (e.cap >= 4) he = d <= NO_BK ? 0.5 : 0
      else if (d <= NAY_BK && !ds.some((n) => n.id !== mt.id && n.id !== toi.id && n.doi !== e.doi && n.mau > 0 && Math.hypot(mt.x - n.x, mt.y - n.y) < d)) he = 0.5
    }
    if (!he) continue
    const mat = satThuongCua(e) * he * giay
    tong += mat
    if (mat > nhat) { nhat = mat; ai = e.id }
  }
  return { tong, ai }
}

// ── Bé ma của chính em ──
/** Chỗ hồi sinh quanh trại đội, lệch theo `hat` (0..1) để cả đội không chồng lên nhau. */
export function choTrai(bd: BanDo, doi: number, hat: number): Diem {
  const t = bd.trai[kep(Math.floor(doi), 0, 3)], goc = hat * Math.PI * 2
  return { x: t.x + Math.cos(goc) * 66, y: t.y + Math.sin(goc) * 44 }
}
export function taoToi(bd: BanDo, doi: number, nay: number, hat = 0): Toi {
  const p = choTrai(bd, doi, hat)
  return { x: p.x, y: p.y, mau: MAU_DAY, doi: kep(Math.floor(doi), 0, 3), cap: 1, chetDen: 0, batTuDen: nay + BAT_TU_MS, lucTrung: 0, lucDong: nay, van: vanSo(nay), duong: [] }
}
export const dangChet = (tt: Toi, nay: number): boolean => tt.chetDen > nay
/** Một khung hình: hồi sinh, đi (theo tay hoặc theo đường chạm), hồi máu, mất máu ngoài vòng. `dx, dy` trong [-1, 1]. */
export function buocToi(bd: BanDo, tt: Toi, vao: { dx: number; dy: number }, dtMs: number, nay: number, hat = 0): Toi {
  if (tt.chetDen > nay) return tt
  let kq = tt
  if (tt.chetDen) kq = { ...taoToi(bd, tt.doi, nay, hat), van: tt.van }
  const dt = Math.min(dtMs, 100) / 1000
  let { x, y, mau, duong } = kq, lucDong = kq.lucDong
  const dai = Math.hypot(vao.dx, vao.dy)
  if (dai > 0.01) {
    const he = (Math.min(1, dai) / dai) * TOC_DO * dt, p = diChuyen(bd, x, y, vao.dx * he, vao.dy * he)
    if (p.x !== x || p.y !== y) lucDong = nay
    x = p.x; y = p.y; duong = duong.length ? [] : duong
  } else if (duong.length) {
    const d = duong[0], kc = Math.hypot(d.x - x, d.y - y), buoc = TOC_DO * dt
    if (kc <= buoc) { x = d.x; y = d.y; duong = duong.slice(1) } else { const p = diChuyen(bd, x, y, ((d.x - x) / kc) * buoc, ((d.y - y) / kc) * buoc); if (p.x === x && p.y === y) duong = []; x = p.x; y = p.y }
    lucDong = nay
  }
  let lucTrung = kq.lucTrung
  if (!dangNghi(nay)) {
    if (ngoaiVong(vong(bd, nay), x, y) && nay >= kq.batTuDen) { mau -= NGOAI_VONG_MOI_GIAY * dt; lucTrung = nay }
    else if (mau < MAU_DAY && nay - lucTrung >= HOI_CHO_MS) mau = Math.min(MAU_DAY, mau + HOI_MOI_GIAY * dt)
  }
  if (mau <= 0) return { ...kq, x, y, mau: 0, duong: [], lucDong, lucTrung, chetDen: nay + HOI_SINH_MS }
  return { ...kq, x, y, mau, duong, lucDong, lucTrung }
}
/** Trúng đạn `mat` máu. Đang bị hạ / vừa hồi sinh / đang nghỉ giữa ván ⇒ không mất. Hết máu ⇒ bị hạ, hồi sinh sau 3 giây. */
export function nhanDon(tt: Toi, mat: number, nay: number): Toi {
  if (mat <= 0 || tt.chetDen > nay || nay < tt.batTuDen || dangNghi(nay)) return tt
  const mau = tt.mau - mat
  return mau <= 0 ? { ...tt, mau: 0, duong: [], lucTrung: nay, chetDen: nay + HOI_SINH_MS } : { ...tt, mau, lucTrung: nay }
}
/** Súng của em đang ngừng bắn để ẩn: đứng yên trong bụi. */
export const dangAn = (bd: BanDo, tt: Toi, nay: number): boolean => nay - tt.lucDong >= AN_YEN_MS && trongBui(bd, tt.x, tt.y)
/** Đọc một dòng ảnh chụp thành nhân vật (dòng hỏng ⇒ null). */
export function docDong(id: string, d: SinhTonDong | undefined): NhanVat | null {
  if (!Array.isArray(d) || d.length < 5 || !d.slice(0, 5).every((v) => typeof v === 'number' && Number.isFinite(v))) return null
  return { id, x: d[0], y: d[1], mau: d[2], doi: kep(Math.floor(d[3]), 0, 3), cap: kep(Math.round(d[4]), 1, CAP_TOI_DA), t: typeof d[5] === 'string' ? d[5] : '' }
}
