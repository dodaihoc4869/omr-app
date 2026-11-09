// Phép tính ĐẾM NGƯỢC ngày thi tốt nghiệp THPT 22/06/2027 (thẻ DemNguocThi.tsx) — theo NGÀY VIỆT NAM, đổi lúc 0 h giờ VN.
export const NGAY_THI_2027 = Date.UTC(2027, 5, 22)
/** Giả định ngày khai giảng năm học lớp 12 (chỉ dùng cho mực ống nghiệm «đã đi x % năm học»). */
export const KHAI_GIANG_2026 = Date.UTC(2026, 8, 5)
const NGAY_MS = 86_400_000

export type ChangDem = 'binh' | 'gap' | 'tuan' | 'thi'
export interface DemNguoc { con: number; phanTram: number; chang: ChangDem; tuan: number; cau: number }

/** Số ngày còn (theo ngày Việt Nam), phần trăm năm học, chặng. null = đã qua ngày thi. */
export function tinhDemNguoc(nowMs: number): DemNguoc | null {
  const homNay = Math.floor((nowMs + 7 * 3_600_000) / NGAY_MS) * NGAY_MS
  const con = Math.round((NGAY_THI_2027 - homNay) / NGAY_MS)
  if (con < 0) return null
  const phanTram = Math.max(0, Math.min(100, Math.round((100 * (homNay - KHAI_GIANG_2026)) / (NGAY_THI_2027 - KHAI_GIANG_2026))))
  const chang: ChangDem = con === 0 ? 'thi' : con <= 7 ? 'tuan' : con <= 30 ? 'gap' : 'binh'
  return { con, phanTram, chang, tuan: Math.floor(con / 7), cau: con * 28 }
}
