// TRÒ «SINH TỒN» ở phòng chờ Live theo khối (thầy chốt 12/11; đặc tả docs/dac-ta-sinh-ton-1211.md mục 4; bản 2 thầy duyệt 13/11: sáu khẩu súng + sân ghép
// trang theo sĩ số — docs/dac-ta-sinh-ton-v2-1311.md) — LÕI THUẦN: không DOM, không đồng hồ, không ngẫu nhiên ẩn. Máy em tự mô phỏng bé ma của mình; phòng gom vị trí, tính máy bù chỗ và phát ảnh chụp mỗi 250 ms (hợp đồng ./kieu.ts).
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
/** SÁU KHẨU SÚNG (bản 2, thầy duyệt 13/11 — docs/dac-ta-sinh-ton-v2-1311.md): hạ được bạn ⇒ lên một cấp; bị hạ ⇒ về cấp 1. Mọi mảng theo cấp dài đúng 6. */
export const SUNG_TEN = ['Súng Hạt', 'Súng Đôi', 'Súng Bọt', 'Súng Sấm', 'Súng Lửa Màu', 'Pháo Sao'] as const
/** Máu mất mỗi giây theo cấp súng 1..6 của bên bắn (bản 1 bốn cấp: 36 · 48 · 60 · 72). */
export const SAT_THUONG_GIAY = [34, 42, 50, 58, 66, 74] as const
/** Nhịp bắn (ms giữa hai phát) theo cấp súng — hình đạn và tiếng súng theo số này; sát thương tính theo giây nên nhịp chỉ là hình.
 *  Bọt bay chậm, phát thưa hơn; Sấm nhanh; Pháo Sao chậm, nổ to (bản 1: 250 · 250 · 250 · 700). */
export const NHIP_BAN_MS = [250, 250, 340, 250, 280, 700] as const
/** Đạn bay từ nòng tới mục tiêu trong chừng này ms (luôn ngắn hơn nhịp bắn: đạn tới đích trước phát kế). */
export const DAN_BAY_MS = [170, 170, 260, 110, 200, 280] as const
/** Máy bù chỗ bắn yếu hơn người. */
const HE_MAY = 0.67
/** Hiệu ứng lan (đều NỬA sát thương, chỉ lên ĐỐI THỦ của bên bắn): cấp 3 «Súng Bọt» vỡ ra trúng bạn đứng sát mục tiêu (bán kính 40); cấp 4 «Súng Sấm» nảy sang
 *  MỘT đối thủ gần mục tiêu nhất (trong 90); cấp 6 «Pháo Sao» nổ lan quanh mục tiêu (bán kính 60). Cấp 5 «Súng Lửa Màu» không lan — trúng thẳng thì CHÁY. */
export const BOT_BK = 40
export const NAY_BK = 90
export const NO_BK = 60
/** Cấp 5: trúng thẳng ⇒ cháy thêm 2 giây kể từ phát trúng cuối, 8 máu / giây (bên bị bắn tự trừ — `nhanDon` ghi, `buocToi` / `buocMay` trừ). */
export const CHAY_MS = 2000
export const CHAY_MOI_GIAY = 8
export const CAP_TOI_DA = 6
/** Máy bù lên tối đa Súng Bọt. */
export const CAP_MAY_TOI_DA = 3
/** Hộp tiếp tế giữa sân: 20 giây một hộp. */
export const HOP_MS = 20_000
export const HOP_BK = 36
export const ANH_MS = 250
export const NHIP_GUI_MS = 250
export const NHIP_NHAC_MS = 2000
/** Cạnh ô lưới tìm đường. */
const O = 40

export interface Diem { x: number; y: number }
export interface ChuNhat { x: number; y: number; w: number; h: number }
export interface BanDo {
  cap: number; rong: number; cao: number
  /** Số trang 1600 × 1000 ghép theo chiều ngang / dọc. */ ngang: number; doc: number
  tuong: ChuNhat[]; thung: ChuNhat[]; bui: ChuNhat[]
  /** Trại bốn đội (Natri trên-trái · Kali trên-phải · Đồng dưới-trái · Canxi dưới-phải). */ trai: Diem[]
  /** Vật chặn đạn + chặn đường = tường + thùng. */ chan: ChuNhat[]
  cot: number; hang: number
  /** 1 = ô không đi được (tâm ô nằm trong vật chặn đã nới bằng bán kính bé ma). */ luoi: Uint8Array
  /** CHỈ MỤC THEO TRANG (nướng sẵn lúc `taoBanDo`): `chanTrang[j * ngang + i]` = vật chặn mà hộp nới `NOI_TRANG` chạm trang (i, j); `buiTrang` tương tự cho bụi.
   *  Phép thử va chạm chỉ quét các trang mà hộp bao của đoạn / điểm chạm tới (sân 4 × 4 có ~550 vật chặn, một trang ~35). */
  chanTrang: ChuNhat[][]; buiTrang: ChuNhat[][]
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
  /** Đang CHÁY (trúng Súng Lửa Màu) tới lúc này; 0 = không cháy. */ chayDen: number
  /** Kẻ châm lửa gần nhất — `buocToi` làm em hết máu khi đang cháy ⇒ giữ mã này để báo lượt hạ (chết vì vòng an toàn ⇒ ''). */ chayAi: string
}

export const laMay = (id: string): boolean => id.charCodeAt(0) === 126 // '~'
export const vanSo = (nay: number): number => Math.floor(nay / VAN_MS)
/** 5 giây cuối mỗi ván: bảng kết quả, không ai bắn ai. */
export const dangNghi = (nay: number): boolean => ((nay % VAN_MS) + VAN_MS) % VAN_MS >= VAN_CHOI_MS
export const conLai = (nay: number): number => Math.max(0, VAN_CHOI_MS - (((nay % VAN_MS) + VAN_MS) % VAN_MS))
export const hopSo = (nay: number): number => Math.floor(nay / HOP_MS)
/** Cỡ bản đồ theo số nhân vật trên sân (em thật + máy bù, mỗi đội ít nhất 4) — thầy 13/11: «Tùy theo số lượng hs thì bản đồ được mở rộng ra hơn để chơi cho thú vị»:
 * tới 20 ⇒ 0 (2 × 2 trang) · tới 36 ⇒ 1 (3 × 2) · tới 64 ⇒ 2 (3 × 3) · tới 96 ⇒ 3 (4 × 3) · hơn ⇒ 4 (4 × 4) (xem CO_SAN). Cỡ chỉ đổi ở ĐẦU VÁN. */
export const capBanDo = (soNhanVat: number): number => (soNhanVat <= 20 ? 0 : soNhanVat <= 36 ? 1 : soNhanVat <= 64 ? 2 : soNhanVat <= 96 ? 3 : 4)
const kep = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)

// ── Bản đồ: một phần tư rồi lấy đối xứng hai trục ⇒ một TRANG 1600 × 1000, bốn đội công bằng. Mọi cỡ sân (bản 2, thầy duyệt 13/11) = GHÉP các trang cạnh
//    nhau, không phóng: 2 × 2 · 3 × 2 · 3 × 3 · 4 × 3 · 4 × 4 (mật độ vật chặn giữ nguyên). Trang tự đối xứng ⇒ ghép bao nhiêu trang sân vẫn đối xứng hai trục. ──
const RONG = 1600
const CAO = 1000
/** Hộp vật chặn nới chừng này khi xếp vào trang — phải ≥ mọi `noi` dùng khi thử va chạm (đi: BK_NV + 1). */
const NOI_TRANG = BK_NV + 2
const PT_TUONG: readonly (readonly number[])[] = [[262, 150, 44, 130], [110, 312, 130, 44], [450, 262, 170, 44], [650, 372, 44, 92], [650, 372, 112, 44], [778, 60, 44, 96]]
const PT_THUNG: readonly (readonly number[])[] = [[372, 424, 54, 54], [566, 104, 54, 54], [60, 473, 54, 54]]
const PT_BUI: readonly (readonly number[])[] = [[340, 150, 150, 92], [205, 452, 130, 96], [715, 190, 170, 86], [470, 620, 140, 90]]
/** Năm cỡ sân: [hệ số phóng, số trang ngang, số trang dọc] — 3200 × 2000 · 4800 × 2000 · 4800 × 3000 · 6400 × 3000 · 6400 × 4000 (thay hẳn thang bản 1). */
const CO_SAN: readonly (readonly [number, number, number])[] = [[1, 2, 2], [1, 3, 2], [1, 3, 3], [1, 4, 3], [1, 4, 4]]
export const SO_CO_SAN = CO_SAN.length
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
  const c = Number.isInteger(cap) && cap > 0 && cap < CO_SAN.length ? cap : 0
  const co = NHO_BAN_DO[c]
  if (co) return co
  const [he, ngang, doc] = CO_SAN[c], rk = RONG * he, ck = CAO * he, rong = rk * ngang, cao = ck * doc
  // Một khu rồi chép sang các ô ngang × dọc (khu tự đối xứng ⇒ chép tịnh tiến là đủ).
  const ghep = (ds: readonly (readonly number[])[]): ChuNhat[] => {
    const mot = doiXung(ds, he)
    if (ngang === 1 && doc === 1) return mot
    const kq: ChuNhat[] = []
    for (let j = 0; j < doc; j++) for (let i = 0; i < ngang; i++) for (const v of mot) kq.push({ x: v.x + i * rk, y: v.y + j * ck, w: v.w, h: v.h })
    return kq
  }
  const tuong = ghep(PT_TUONG), thung = ghep(PT_THUNG), chan = [...tuong, ...thung]
  const cot = Math.ceil(rong / O), hang = Math.ceil(cao / O), luoi = new Uint8Array(cot * hang)
  // Mỗi vật chặn chỉ xét các ô quanh nó (±1 ô cho chắc), phép thử vẫn là `trongHop` ⇒ kết quả y hệt quét cả lưới × cả vật chặn (sân ghép 4800 × 3000 có ~290 vật × 9000 ô).
  const NOI = BK_NV + 2
  for (const v of chan) {
    const i0 = Math.max(0, Math.floor((v.x - NOI) / O) - 1), i1 = Math.min(cot - 1, Math.ceil((v.x + v.w + NOI) / O) + 1)
    const j0 = Math.max(0, Math.floor((v.y - NOI) / O) - 1), j1 = Math.min(hang - 1, Math.ceil((v.y + v.h + NOI) / O) + 1)
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (trongHop(v, i * O + O / 2, j * O + O / 2, NOI)) luoi[j * cot + i] = 1
  }
  const bui = ghep(PT_BUI)
  // Chỉ mục theo trang: mỗi vật xếp vào mọi trang mà hộp nới của nó chạm — dùng ĐÚNG hàm chia trang của phép thử (`trangDau` / `trangCuoi`) ⇒ điểm nào
  // nằm trong hộp nới của vật thì trang của điểm đó chắc chắn có vật trong danh sách (cùng kết quả với quét hết, test so ≥ 20 000 truy vấn mỗi cỡ).
  const xepTrang = (ds: ChuNhat[], noi: number): ChuNhat[][] => {
    const kq: ChuNhat[][] = Array.from({ length: ngang * doc }, () => [])
    for (const v of ds) {
      const i0 = trangDau(v.x - noi, rk, ngang), i1 = trangCuoi(v.x + v.w + noi, rk, ngang), j0 = trangDau(v.y - noi, ck, doc), j1 = trangCuoi(v.y + v.h + noi, ck, doc)
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) kq[j * ngang + i].push(v)
    }
    return kq
  }
  const bd: BanDo = {
    cap: c, rong, cao, ngang, doc, tuong, thung, bui, chan, cot, hang, luoi, chanTrang: xepTrang(chan, NOI_TRANG), buiTrang: xepTrang(bui, 1),
    // Trại bốn đội ở bốn góc NGOÀI của cả sân.
    trai: [[130 * he, 122 * he], [rong - 130 * he, 122 * he], [130 * he, cao - 122 * he], [rong - 130 * he, cao - 122 * he]].map(([x, y]) => ({ x, y })),
  }
  NHO_BAN_DO[c] = bd
  return bd
}
/** Trang chứa toạ độ `v` (cạnh trang `co`, `n` trang), kẹp vào sân. Toạ độ hỏng (NaN) ⇒ trang ĐẦU cho mép dưới, trang CUỐI cho mép trên ⇒ quét cả sân. */
function trangDau(v: number, co: number, n: number): number { const t = Math.floor(v / co); return t > 0 ? (t < n ? t : n - 1) : 0 }
function trangCuoi(v: number, co: number, n: number): number { const t = Math.floor(v / co); return t < n - 1 ? (t > 0 ? t : 0) : n - 1 }
/** Dải trang mà hộp [x0, x1] × [y0, y1] chạm — ghi vào biến của mô-đun (không cấp phát; phép thử chặn được gọi hàng trăm nghìn lần mỗi giây). */
let I0 = 0, I1 = 0, J0 = 0, J1 = 0
function dai(bd: BanDo, x0: number, y0: number, x1: number, y1: number): void {
  const rk = bd.rong / bd.ngang, ck = bd.cao / bd.doc
  I0 = trangDau(x0, rk, bd.ngang); I1 = trangCuoi(x1, rk, bd.ngang); J0 = trangDau(y0, ck, bd.doc); J1 = trangCuoi(y1, ck, bd.doc)
}
const trongBauDuc = (b: ChuNhat, x: number, y: number): boolean => {
  const dx = (x - b.x - b.w / 2) / (b.w / 2), dy = (y - b.y - b.h / 2) / (b.h / 2)
  return dx * dx + dy * dy <= 1
}
/** Bụi là hình bầu dục nội tiếp ô của nó (chỉ thử bụi của trang chứa điểm). */
export function trongBui(bd: BanDo, x: number, y: number): boolean {
  dai(bd, x, y, x, y)
  for (let j = J0; j <= J1; j++) for (let i = I0; i <= I1; i++) { const t = bd.buiTrang[j * bd.ngang + i]; for (let k = 0; k < t.length; k++) if (trongBauDuc(t[k], x, y)) return true }
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
/** Đoạn thẳng có cắt hình chữ nhật (đã nới `noi`) không — phép cắt theo tấm. Không cấp phát mảng: sân ghép có tới 300 vật chặn, bước kéo thẳng đường gọi hàm này hàng trăm nghìn lần. */
let T0 = 0, T1 = 1
function tam(p: number, q: number): boolean {
  if (p === 0) return q >= 0
  const r = q / p
  if (p < 0) { if (r > T1) return false; if (r > T0) T0 = r } else { if (r < T0) return false; if (r < T1) T1 = r }
  return true
}
function catHop(c: ChuNhat, x1: number, y1: number, x2: number, y2: number, noi: number): boolean {
  const xa = c.x - noi, xb = c.x + c.w + noi, ya = c.y - noi, yb = c.y + c.h + noi
  // Cả hai đầu cùng một phía ngoài hộp ⇒ không cắt (loại nhanh, cùng kết quả với phép cắt theo tấm).
  if ((x1 < xa && x2 < xa) || (x1 > xb && x2 > xb) || (y1 < ya && y2 < ya) || (y1 > yb && y2 > yb)) return false
  T0 = 0; T1 = 1
  const dx = x2 - x1, dy = y2 - y1
  return tam(-dx, x1 - xa) && tam(dx, xb - x1) && tam(-dy, y1 - ya) && tam(dy, yb - y1) && T0 <= T1
}
/** Đoạn cắt vật chặn nào (nới `noi` < NOI_TRANG)? Chỉ thử vật chặn của các trang mà hộp bao của đoạn chạm: điểm cắt nằm trên đoạn (⇒ trong hộp bao)
 *  và trong hộp nới `noi` của vật (⇒ vật đã được xếp vào trang của điểm đó, vì lúc xếp đã nới NOI_TRANG lớn hơn). */
function catChan(bd: BanDo, x1: number, y1: number, x2: number, y2: number, noi: number): boolean {
  dai(bd, Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2))
  const i0 = I0, i1 = I1, j1 = J1
  for (let j = J0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const t = bd.chanTrang[j * bd.ngang + i]
    for (let k = 0; k < t.length; k++) if (catHop(t[k], x1, y1, x2, y2, noi)) return true
  }
  return false
}
/** Tường / thùng chắn đường NGẮM giữa hai điểm? */
export const chanDuong = (bd: BanDo, x1: number, y1: number, x2: number, y2: number): boolean => catChan(bd, x1, y1, x2, y2, 0)
/** …chắn đường ĐI (vật chặn nới bằng bán kính bé ma)? */
export const chanDi = (bd: BanDo, x1: number, y1: number, x2: number, y2: number): boolean => catChan(bd, x1, y1, x2, y2, BK_NV + 1)
/** Điểm (tâm bé ma) đè vật chặn? Chỉ thử vật chặn của trang chứa điểm. */
export function bi(bd: BanDo, x: number, y: number): boolean {
  dai(bd, x, y, x, y)
  const i0 = I0, i1 = I1, j1 = J1
  for (let j = J0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const t = bd.chanTrang[j * bd.ngang + i]
    for (let k = 0; k < t.length; k++) if (trongHop(t[k], x, y, BK_NV)) return true
  }
  return false
}
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
/** Bộ nhớ tìm đường dùng lại cho từng bản đồ (sân 4 × 4 có 16 000 ô — không cấp phát 4 mảng mỗi lần gọi): ô nào có `luot[o] !== lan` coi như chưa chạm. */
interface NhoTim { lan: number; luot: Uint32Array; g: Float32Array; cha: Int32Array; dong: Uint32Array; dong0: number; heapO: number[]; heapF: number[] }
const NHO_TIM = new WeakMap<BanDo, NhoTim>()
function nhoTim(bd: BanDo): NhoTim {
  let m = NHO_TIM.get(bd)
  if (!m) { const n = bd.cot * bd.hang; m = { lan: 0, luot: new Uint32Array(n), g: new Float32Array(n), cha: new Int32Array(n), dong: new Uint32Array(n), dong0: 0, heapO: [], heapF: [] }; NHO_TIM.set(bd, m) }
  return m
}
/** Đống nhị phân nhỏ nhất theo f (hai mảng song song); bằng f ⇒ phần tử vào trước ra trước không bảo đảm (đường vẫn ngắn nhất). */
function dayVao(h: NhoTim, o: number, f: number): void {
  const O_ = h.heapO, F = h.heapF
  let i = O_.length
  O_.push(o); F.push(f)
  while (i > 0) { const p = (i - 1) >> 1; if (F[p] <= f) break; O_[i] = O_[p]; F[i] = F[p]; i = p }
  O_[i] = o; F[i] = f
}
function layRa(h: NhoTim): number {
  const O_ = h.heapO, F = h.heapF, top = O_[0], o = O_.pop()!, f = F.pop()!, n = O_.length
  if (n) {
    let i = 0
    for (;;) {
      const a = 2 * i + 1, b = a + 1
      let k = i, fk = f
      if (a < n && F[a] < fk) { k = a; fk = F[a] }
      if (b < n && F[b] < fk) { k = b; fk = F[b] }
      if (k === i) break
      O_[i] = O_[k]; F[i] = F[k]; i = k
    }
    O_[i] = o; F[i] = f
  }
  return top
}
export function timDuong(bd: BanDo, x1: number, y1: number, x2: number, y2: number): Diem[] {
  const dau = oTrongGan(bd, oCua(bd, x1, y1)), dichGoc = oCua(bd, x2, y2), dich = oTrongGan(bd, dichGoc)
  const h = nhoTim(bd), { luot, g, cha, dong } = h, cot = bd.cot, luoi = bd.luoi
  // Lượt mới: tăng số lượt (tràn sau 4 tỉ lần ⇒ xoá sạch một lần).
  if (++h.lan >= 0xffffffff) { h.lan = 1; luot.fill(0); dong.fill(0) }
  const lan = h.lan, di0 = dich % cot, dj0 = Math.floor(dich / cot)
  // Ước lượng «tám hướng» (đi chéo √2): sát chi phí thật hơn đường chim bay ⇒ ít ô phải mở hơn trên sân lớn; nhân 1,001 để phá thế hoà (đường dài hơn
  // tối ưu nhiều nhất 0,1%, không thấy được).
  const uoc = (o: number): number => {
    const i = o % cot, a = i > di0 ? i - di0 : di0 - i, j = (o - i) / cot, b = j > dj0 ? j - dj0 : dj0 - j
    return (a + b + (Math.SQRT2 - 2) * (a < b ? a : b)) * 1.001
  }
  h.heapO.length = 0; h.heapF.length = 0
  luot[dau] = lan; g[dau] = 0; cha[dau] = -1
  dayVao(h, dau, uoc(dau))
  let toi = -1
  while (h.heapO.length) {
    const o = layRa(h)
    if (o === dich) { toi = o; break }
    if (dong[o] === lan) continue
    dong[o] = lan
    const i0 = o % cot, j0 = (o - i0) / cot
    for (let k = 0; k < 8; k++) {
      const di = HUONG[k][0], dj = HUONG[k][1], i = i0 + di, j = j0 + dj
      if (i < 0 || j < 0 || i >= cot || j >= bd.hang) continue
      const q = j * cot + i
      if (luoi[q] || dong[q] === lan || (di && dj && (luoi[j0 * cot + i] || luoi[j * cot + i0]))) continue
      const moi = g[o] + (di && dj ? Math.SQRT2 : 1)
      if (luot[q] === lan && moi >= g[q]) continue
      luot[q] = lan; g[q] = moi; cha[q] = o
      dayVao(h, q, moi + uoc(q))
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
/** Máu `toi` mất trong `giay` giây theo ảnh chụp `ds` (những nhân vật KHÁC). `ai` = mã kẻ gây nhiều nhất (để báo lượt hạ). `chay` = mã kẻ cầm
 *  Súng Lửa Màu (cấp 5) đang bắn THẲNG vào `toi` ('' = không) — đưa vào `nhanDon(…, chay)` để châm lửa. Đồng đội không bao giờ gây sát thương. */
export function satThuong(toi: { id: string; x: number; y: number; doi: number }, ds: readonly NhanVat[], giay: number): { tong: number; ai: string; chay: string } {
  let tong = 0, ai = '', nhat = 0, chay = ''
  for (const e of ds) {
    if (e.doi === toi.doi || e.mau <= 0 || !e.t || e.id === toi.id) continue
    const cap = kep(Math.round(e.cap), 1, CAP_TOI_DA)
    let he = 0
    if (e.t === toi.id) {
      he = Math.hypot(e.x - toi.x, e.y - toi.y) <= TAM_XA ? 1 : 0
      if (he && cap === 5 && !chay) chay = e.id
    } else if (cap === 3 || cap === 4 || cap === 6) {
      // Hiệu ứng lan quanh MỤC TIÊU của `e` (mục tiêu phải là đối thủ còn máu của `e`).
      const mt = ds.find((n) => n.id === e.t)
      if (!mt || mt.doi === e.doi || mt.mau <= 0) continue
      const d = Math.hypot(mt.x - toi.x, mt.y - toi.y)
      if (cap === 3) he = d <= BOT_BK ? 0.5 : 0
      else if (cap === 6) he = d <= NO_BK ? 0.5 : 0
      else if (d <= NAY_BK && !ds.some((n) => n.id !== mt.id && n.id !== toi.id && n.doi !== e.doi && n.mau > 0 && Math.hypot(mt.x - n.x, mt.y - n.y) < d)) he = 0.5
    }
    if (!he) continue
    const mat = satThuongCua(e) * he * giay
    tong += mat
    if (mat > nhat) { nhat = mat; ai = e.id }
  }
  return { tong, ai, chay }
}
/** Máu mất vì CHÁY trong khoảng (nay − dtMs, nay] khi cháy tới `chayDen` (không kẹp dtMs ⇒ tổng sau phát trúng cuối luôn đúng 16 máu). */
export const matChay = (chayDen: number, nay: number, dtMs: number): number => (chayDen > nay - dtMs ? (CHAY_MOI_GIAY * (Math.min(nay, chayDen) - Math.max(nay - dtMs, chayDen - CHAY_MS))) / 1000 : 0)

// ── Bé ma của chính em ──
/** Chỗ hồi sinh quanh trại đội, lệch theo `hat` (0..1) để cả đội không chồng lên nhau. Có `nay` và trại đã nằm NGOÀI vòng an toàn (nửa sau ván — sân lớn
 *  thì đường về vòng dài gấp mấy lần) ⇒ hồi sinh ngay mép trong của vòng, trên đường từ trại về giữa sân, né vật chặn. */
export function choTrai(bd: BanDo, doi: number, hat: number, nay?: number): Diem {
  const t = bd.trai[kep(Math.floor(doi), 0, 3)], goc = hat * Math.PI * 2
  let x = t.x + Math.cos(goc) * 66, y = t.y + Math.sin(goc) * 44
  if (nay === undefined) return { x, y }
  const v = vong(bd, nay)
  if (!ngoaiVong(v, x, y)) return { x, y }
  const r = 0.9 / Math.hypot((x - v.cx) / v.rx, (y - v.cy) / v.ry)
  x = v.cx + (x - v.cx) * r; y = v.cy + (y - v.cy) * r
  for (let i = 0; i < 24 && bi(bd, x, y); i++) { x += (v.cx - x) * 0.06; y += (v.cy - y) * 0.06 }
  return { x, y }
}
export function taoToi(bd: BanDo, doi: number, nay: number, hat = 0): Toi {
  const p = choTrai(bd, doi, hat, nay)
  return { x: p.x, y: p.y, mau: MAU_DAY, doi: kep(Math.floor(doi), 0, 3), cap: 1, chetDen: 0, batTuDen: nay + BAT_TU_MS, lucTrung: 0, lucDong: nay, van: vanSo(nay), duong: [], chayDen: 0, chayAi: '' }
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
  let lucTrung = kq.lucTrung, chayAi = kq.chayAi
  if (!dangNghi(nay)) {
    // Cháy (Súng Lửa Màu): trừ theo đúng khoảng thời gian đã trôi (không kẹp 100 ms như bước đi ⇒ tab chậm vẫn đủ 16 máu); bất tử thì không cháy.
    const chay = nay >= kq.batTuDen ? matChay(kq.chayDen, nay, dtMs) : 0
    if (chay > 0) { mau -= chay; lucTrung = nay }
    const vongMat = ngoaiVong(vong(bd, nay), x, y) && nay >= kq.batTuDen
    if (vongMat) { mau -= NGOAI_VONG_MOI_GIAY * dt; lucTrung = nay }
    else if (!chay && mau < MAU_DAY && nay - lucTrung >= HOI_CHO_MS) mau = Math.min(MAU_DAY, mau + HOI_MOI_GIAY * dt)
    if (mau <= 0 && !chay) chayAi = ''
  }
  if (mau <= 0) return { ...kq, x, y, mau: 0, duong: [], lucDong, lucTrung, chetDen: nay + HOI_SINH_MS, chayDen: 0, chayAi }
  return { ...kq, x, y, mau, duong, lucDong, lucTrung }
}
/** Trúng đạn `mat` máu; `chay` = mã kẻ cầm Súng Lửa Màu bắn thẳng (từ `satThuong`) ⇒ châm lửa 2 giây kể từ lúc này. Đang bị hạ / vừa hồi sinh / đang nghỉ
 *  giữa ván ⇒ không mất, không cháy. Hết máu ⇒ bị hạ, hồi sinh sau 3 giây (hết cháy). */
export function nhanDon(tt: Toi, mat: number, nay: number, chay = ''): Toi {
  if (mat <= 0 || tt.chetDen > nay || nay < tt.batTuDen || dangNghi(nay)) return tt
  const mau = tt.mau - mat
  if (mau <= 0) return { ...tt, mau: 0, duong: [], lucTrung: nay, chetDen: nay + HOI_SINH_MS, chayDen: 0 }
  return chay ? { ...tt, mau, lucTrung: nay, chayDen: nay + CHAY_MS, chayAi: chay } : { ...tt, mau, lucTrung: nay }
}
/** Súng của em đang ngừng bắn để ẩn: đứng yên trong bụi. */
export const dangAn = (bd: BanDo, tt: Toi, nay: number): boolean => nay - tt.lucDong >= AN_YEN_MS && trongBui(bd, tt.x, tt.y)
/** Đọc một dòng ảnh chụp thành nhân vật (dòng hỏng ⇒ null). */
export function docDong(id: string, d: SinhTonDong | undefined): NhanVat | null {
  if (!Array.isArray(d) || d.length < 5 || !d.slice(0, 5).every((v) => typeof v === 'number' && Number.isFinite(v))) return null
  return { id, x: d[0], y: d[1], mau: d[2], doi: kep(Math.floor(d[3]), 0, 3), cap: kep(Math.round(d[4]), 1, CAP_TOI_DA), t: typeof d[5] === 'string' ? d[5] : '' }
}
