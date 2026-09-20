// TỰ HIỆU CHỈNH THỜI GIAN LÊN BẢNG TỪ GIÂY THẬT (M6, 21/09/2026) — phần THUẦN, tất định.
//
// Mô hình `thoiGianCau` (M1) là ƯỚC TÍNH từ độ khó × độ dài × em. Mỗi lần thầy bấm Đạt / Chưa đạt trên tờ chiếu, tờ báo:
//   · `giay`   — giây THẬT từ lúc đợt bắt đầu LÀM BÀI tới lúc bấm;
//   · `duTinh` — T dự tính của đúng khoảng ấy: LÀM của đợt + Σ CHỮA của các ô đã bấm tới lúc này (kể cả ô này), theo mô hình CHƯA hiệu chỉnh.
// Hệ số của một (phần, sao) = TRUNG VỊ của giây/duTinh trên các mẫu hợp lệ, khi có từ `GIAY_THUC.SO_MAU_TOI_THIEU` mẫu, kẹp
// `HE_SO_THAP`..`HE_SO_CAO`. Trung vị (không phải trung bình) để vài lần thầy nói dài / bỏ quên tờ không kéo lệch cả hệ số.
// Cùng tập mẫu ⇒ cùng hệ số (không phụ thuộc thứ tự mẫu, không đọc đồng hồ).
//
// Chỗ lưu (IndexedDB máy thầy) ở `exam-db.ts` (`themMauGiayThuc`); máy chủ nhận thêm cột `len_bang.giay_thuc` theo
// `docs/hop-dong-giay-thuc-len-bang-1909.md` nhưng việc hiệu chỉnh KHÔNG phụ thuộc vào cột ấy.
import { GIAY_THUC } from './len-bang-cau-hinh'

export type PhanMau = 'I' | 'II' | 'III'

export interface MauGiayThuc {
  phan: PhanMau
  sao: 0 | 1 | 2
  /** Giây thật, đã làm tròn 0,1 s, trong `GIAY_THUC.TOI_THIEU`..`TOI_DA`. */
  giay: number
  /** T dự tính (mô hình chưa hiệu chỉnh) của cùng khoảng thời gian, > 0. */
  duTinh: number
  /** Lúc ghi (ISO) — chỉ để giữ các mẫu MỚI NHẤT khi vượt số mẫu tối đa. */
  luc: string
}

/** Giây thật hợp lệ (20..1800) → số làm tròn 0,1; ngoài khoảng / không phải số hữu hạn → `null` (BỎ, không kẹp). */
export function chuanGiayThuc(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null
  if (v < GIAY_THUC.TOI_THIEU || v > GIAY_THUC.TOI_DA) return null
  return Math.round(v * 10) / 10
}

/** T dự tính hợp lệ: số hữu hạn dương, không vượt hai lần giới hạn giây thật (đề phòng số rác từ khung tờ chiếu). */
export function chuanDuTinh(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v > GIAY_THUC.TOI_DA * 2) return null
  return Math.round(v * 10) / 10
}

/** Dựng mẫu từ dữ liệu lạ (IndexedDB / khung tờ chiếu); thiếu hoặc sai kiểu ⇒ `null`. */
export function chuanMau(v: unknown): MauGiayThuc | null {
  if (!v || typeof v !== 'object') return null
  const m = v as Record<string, unknown>
  const giay = chuanGiayThuc(m.giay)
  const duTinh = chuanDuTinh(m.duTinh)
  if (giay === null || duTinh === null) return null
  if (m.phan !== 'I' && m.phan !== 'II' && m.phan !== 'III') return null
  if (m.sao !== 0 && m.sao !== 1 && m.sao !== 2) return null
  return { phan: m.phan, sao: m.sao, giay, duTinh, luc: typeof m.luc === 'string' ? m.luc : '' }
}

/** Khoá của một (phần, sao) trong bảng hệ số. */
export const khoaHeSo = (phan: string, sao: number | undefined): string => `${phan}|${sao ?? 0}`

/** Thêm một mẫu vào danh sách; danh sách đọc từ máy được lọc lại, giữ `SO_MAU_GIU_TOI_DA` mẫu MỚI NHẤT (theo thứ tự ghi). */
export function themMau(ds: unknown, mau: MauGiayThuc): MauGiayThuc[] {
  const cu = (Array.isArray(ds) ? ds : []).map(chuanMau).filter((x): x is MauGiayThuc => x !== null)
  const moi = [...cu, mau]
  return moi.length > GIAY_THUC.SO_MAU_GIU_TOI_DA ? moi.slice(moi.length - GIAY_THUC.SO_MAU_GIU_TOI_DA) : moi
}

/** Trung vị (mảng rỗng ⇒ NaN — nơi gọi không bao giờ đưa mảng rỗng). */
export function trungVi(xs: number[]): number {
  const a = [...xs].sort((x, y) => x - y)
  const n = a.length
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2
}

/** BẢNG HỆ SỐ theo (phần, sao) từ danh sách mẫu (dữ liệu lạ được lọc). Chỉ có khoá cho nhóm ĐỦ mẫu; nhóm khác không có khoá (= không hiệu chỉnh). */
export function heSoHieuChinh(ds: unknown): Record<string, number> {
  const nhom = new Map<string, number[]>()
  for (const v of Array.isArray(ds) ? ds : []) {
    const m = chuanMau(v)
    if (!m) continue
    const k = khoaHeSo(m.phan, m.sao)
    const a = nhom.get(k)
    const r = m.giay / m.duTinh
    if (a) a.push(r)
    else nhom.set(k, [r])
  }
  const ra: Record<string, number> = {}
  for (const [k, a] of nhom) {
    if (a.length < GIAY_THUC.SO_MAU_TOI_THIEU) continue
    const h = Math.min(GIAY_THUC.HE_SO_CAO, Math.max(GIAY_THUC.HE_SO_THAP, trungVi(a)))
    ra[k] = Math.round(h * 1000) / 1000
  }
  return ra
}

/** Hệ số của một câu (`undefined` = không hiệu chỉnh). */
export function heSoCua(bang: Record<string, number> | null | undefined, phan: string, sao: number | undefined): number | undefined {
  const h = bang?.[khoaHeSo(phan, sao)]
  return typeof h === 'number' && Number.isFinite(h) && h > 0 ? h : undefined
}
