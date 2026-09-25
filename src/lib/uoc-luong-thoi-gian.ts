// CNH-1.0 P02 §5.1 — ƯỚC LƯỢNG THỜI GIAN (hàm THUẦN, dùng chung client/máy chủ).
//
// §5.1 chốt nguyên văn:
//   baseSeconds(I,d)   = [75, 105, 150][d]
//   baseSeconds(II,d)  = [150, 210, 300][d]   # toàn bộ bốn ý
//   baseSeconds(III,d) = [120, 180, 240][d]
//   readingExtra      = min(120, max(0, ceil((visibleChars - 300) / 120)) * 10)
//   mediaExtra        = min(90, 30 * tableOrFigureCount)
//   base              = baseSeconds + readingExtra + mediaExtra
//   factor: n < 5 ⇒ 1; n ≥ 5 ⇒ clamp(median(activeSeconds/base), 0,75, 2)
//   solveSeconds    = ceil(base × factor)
//   feedbackSeconds = max(30, ceil(solveSeconds × 0,25))
//   taskSeconds     = solveSeconds + feedbackSeconds
//
// ⚠️ "Lấy 20 lần gần nhất trong 30 ngày, cùng part và difficulty, độc lập, đã nộp, không gián đoạn;
// thời gian hợp lệ 10–900 giây." ⇒ VIỆC CHỌN MẪU là của nơi gọi (đọc sổ); tệp này chỉ ĐO.
// Không đọc DB/đồng hồ/ngẫu nhiên. Đầu vào hỏng ⇒ NÉM (không bịa số).

export type Phan = 'I' | 'II' | 'III'
export type DoKho = 0 | 1 | 2

export class LoiUocLuong extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = 'LoiUocLuong'
  }
}

/** Thời gian NỀN (giây) theo phần + độ khó — nguyên văn §5.1. */
export const GIAY_NEN: Readonly<Record<Phan, readonly [number, number, number]>> = Object.freeze({
  I: Object.freeze([75, 105, 150] as const),
  II: Object.freeze([150, 210, 300] as const),
  III: Object.freeze([120, 180, 240] as const),
})

const TRONG_SO_DOC = 120
const NGUONG_CHU_MIEN_PHI = 300
const MOI_KHOI_DOC = 10
const TRAN_DOC = 120
const MOI_BANG_HINH = 30
const TRAN_MEDIA = 90
/** Thời gian hợp lệ 10–900 giây (§5.1) — mẫu ngoài khoảng này KHÔNG dùng. */
export const GIAY_HOP_LE_MIN = 10
export const GIAY_HOP_LE_MAX = 900
export const SO_MAU_TOI_THIEU = 5
export const HE_SO_MIN = 0.75
export const HE_SO_MAX = 2

const phanHopLe = (p: unknown): p is Phan => p === 'I' || p === 'II' || p === 'III'
const doKhoHopLe = (d: unknown): d is DoKho => d === 0 || d === 1 || d === 2

export function giayNen(phan: Phan, doKho: DoKho): number {
  if (!phanHopLe(phan)) throw new LoiUocLuong(`phần lạ: ${String(phan)}`)
  if (!doKhoHopLe(doKho)) throw new LoiUocLuong(`độ khó lạ: ${String(doKho)} (0=Biết, 1=Hiểu, 2=Vận dụng)`)
  return GIAY_NEN[phan][doKho]
}

/** `min(120, max(0, ceil((visibleChars − 300)/120)) × 10)`. */
export function themDocGiay(visibleChars: unknown): number {
  const n = Math.floor(Number(visibleChars))
  if (!Number.isFinite(n) || n < 0) throw new LoiUocLuong(`visibleChars phải >= 0, nhận ${String(visibleChars)}`)
  const khoi = Math.ceil(Math.max(0, n - NGUONG_CHU_MIEN_PHI) / TRONG_SO_DOC)
  return Math.min(TRAN_DOC, Math.max(0, khoi) * MOI_KHOI_DOC)
}

/** `min(90, 30 × tableOrFigureCount)`. */
export function themMediaGiay(tableOrFigureCount: unknown): number {
  const n = Math.floor(Number(tableOrFigureCount))
  if (!Number.isFinite(n) || n < 0) throw new LoiUocLuong(`tableOrFigureCount phải >= 0, nhận ${String(tableOrFigureCount)}`)
  return Math.min(TRAN_MEDIA, MOI_BANG_HINH * n)
}

export interface DauVaoNen {
  phan: Phan
  doKho: DoKho
  visibleChars: number
  tableOrFigureCount: number
}

/** `base = baseSeconds + readingExtra + mediaExtra`. */
export function giayNenTong(v: DauVaoNen): number {
  return giayNen(v.phan, v.doKho) + themDocGiay(v.visibleChars) + themMediaGiay(v.tableOrFigureCount)
}

/** Trung vị (không sửa mảng vào). */
export function trungVi(ds: readonly number[]): number {
  if (ds.length === 0) throw new LoiUocLuong('không có mẫu để lấy trung vị')
  const s = [...ds].sort((a, b) => a - b)
  const g = s.length >> 1
  return s.length % 2 === 1 ? s[g]! : (s[g - 1]! + s[g]!) / 2
}

const kep = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x))

/**
 * Hệ số theo lịch sử: `n < 5 ⇒ 1`; `n >= 5 ⇒ clamp(median(activeSeconds / base), 0,75, 2)`.
 * Bỏ mẫu ngoài 10–900 giây. `base <= 0` ⇒ hệ số 1 (không chia cho 0).
 */
export function heSoTheoLichSu(base: number, activeSeconds: readonly number[]): number {
  const hopLe = activeSeconds.filter((s) => Number.isFinite(s) && s >= GIAY_HOP_LE_MIN && s <= GIAY_HOP_LE_MAX)
  if (hopLe.length < SO_MAU_TOI_THIEU || base <= 0) return 1
  return kep(trungVi(hopLe.map((s) => s / base)), HE_SO_MIN, HE_SO_MAX)
}

export interface DauVaoSolve extends DauVaoNen {
  /** Thời gian hoạt động THẬT của các lần gần nhất (đã chọn mẫu ở nơi gọi). */
  activeSeconds?: readonly number[]
}

/** `solveSeconds = ceil(base × factor)`. */
export function solveSeconds(v: DauVaoSolve): number {
  const base = giayNenTong(v)
  return Math.ceil(base * heSoTheoLichSu(base, v.activeSeconds ?? []))
}

/** `feedbackSeconds = max(30, ceil(solveSeconds × 0,25))`. */
export const feedbackSeconds = (solve: number): number => Math.max(30, Math.ceil(solve * 0.25))

/** `taskSeconds = solveSeconds + feedbackSeconds`. */
export const taskSeconds = (solve: number): number => solve + feedbackSeconds(solve)
