// Hàm thuần DÙNG CHUNG của các khối Ca · Dạng · Bài tập về nhà · Lịch ôn · 14 ngày · Lời A.I (Agent C, bảng "Mọi thứ về con" kiểu Apple): ngày chuỗi "YYYY-MM-DD" ⇒ chữ, mốc "bây giờ" của máy chủ, "còn N ngày N giờ".
// Không gọi mạng, không đọc giờ máy (mọi ngày quy về giờ VN bằng số học như lib/ph-moi/dinh-dang.ts). Nguồn chữ: docs/ban-ve-ph-apple-2109/ph-d-bang-day-du.html.
import { ngayChuoiNgan, tachVn, thuTuChuoiNgay } from '../../../lib/ph-moi/dinh-dang'
import type { PhMoi } from '../../../lib/ph-moi/du-lieu'

const hai = (n: number): string => String(n).padStart(2, '0')
const MOT_NGAY_MS = 86_400_000
const THU_NGAN: Record<string, string> = { 'Chủ nhật': 'CN', 'Thứ Hai': 'T2', 'Thứ Ba': 'T3', 'Thứ Tư': 'T4', 'Thứ Năm': 'T5', 'Thứ Sáu': 'T6', 'Thứ Bảy': 'T7' }

export const laNgayChuoi = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)

/** Mốc "bây giờ" theo máy chủ; thiếu ⇒ giờ máy (chỉ để không ném lỗi). */
export const mocMay = (pm: Pick<PhMoi, 'serverNow'>): number => pm.serverNow ?? Date.now()

/** Ngày giờ VN của một mốc ms ⇒ "YYYY-MM-DD" ("" nếu hỏng). */
export function ngayVnChuoi(ms: number): string {
  const t = tachVn(ms)
  return t ? `${t.y}-${hai(t.m)}-${hai(t.d)}` : ''
}

/** Cộng/trừ ngày trên chuỗi "YYYY-MM-DD" ("" nếu sai dạng). */
export function congNgay(s: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return ''
  const t = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + n * MOT_NGAY_MS)
  return `${t.getUTCFullYear()}-${hai(t.getUTCMonth() + 1)}-${hai(t.getUTCDate())}`
}

/** "T3" từ "2026-09-22". */
export const thuNgan = (s: string): string => THU_NGAN[thuTuChuoiNgay(s)] ?? ''
/** "T3 22" từ "2026-09-22". */
export const nhanThuNgay = (s: string): string => `${thuNgan(s)} ${s.slice(8, 10)}`.trim()
/** "Thứ Ba 22/09/2026" từ "2026-09-22". */
export const ngayDayDuChuoi = (s: string): string => (laNgayChuoi(s) ? `${thuTuChuoiNgay(s)} ${ngayChuoiNgan(s)}/${s.slice(0, 4)}` : '')
/** "Thứ Sáu 18/09" từ "2026-09-18". */
export const thuNgayChuoi = (s: string): string => (laNgayChuoi(s) ? `${thuTuChuoiNgay(s)} ${ngayChuoiNgan(s)}` : '')

/** "còn 3 ngày 15 giờ" · "còn 5 giờ" · "còn 20 phút" · "đã qua hạn" (nguồn: KhoiBtvn của bảng cũ). */
export function chuConLai(denMs: number, nayMs: number): string {
  const ms = denMs - nayMs
  if (!(ms > 0)) return 'đã qua hạn'
  const gio = Math.floor(ms / 3_600_000)
  const ngay = Math.floor(gio / 24)
  return ngay > 0 ? `còn ${ngay} ngày ${gio % 24} giờ` : gio > 0 ? `còn ${gio} giờ` : `còn ${Math.max(1, Math.floor(ms / 60_000))} phút`
}
