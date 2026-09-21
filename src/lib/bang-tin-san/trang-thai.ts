// MỘT nguồn trạng thái cho mọi khối của Bảng tin sàn: `chotSo` gom các con số và ÉP KHỚP nhau —
//   · "Câu đã làm" = tổng số câu các lớp (nếu có bảng theo lớp) · "Em đã học" = số ô nhiệt có câu (nếu có bản đồ nhiệt) · "Chưa học hôm nay" = sĩ số − đã học.
// Khối thiếu ⇒ dùng số của khối còn lại; không có khối nào ⇒ số gốc của máy chủ. `kiemTraKhop` liệt kê chỗ máy chủ trả lệch (kiểm thử / cảnh báo).
import type { DuLieuSan } from './kieu'

export interface SoLieuSan {
  soEmHoc: number
  tongEm: number
  chuaHoc: number
  soCau: number
  soCauDung: number
  /** Tỉ lệ đúng cả ngày (%, số thực); null khi chưa có câu nào. */
  tiLeDung: number | null
}

const tong = (ds: readonly number[]): number => ds.reduce((t, x) => t + x, 0)
const nguyen = (v: number): number => (Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0)

export function chotSo(du: DuLieuSan): SoLieuSan {
  const tl = du.theoLop && du.theoLop.length > 0 ? du.theoLop : null
  const nh = du.nhiet && du.nhiet.length > 0 ? du.nhiet : null
  const soCau = tl ? tong(tl.map((l) => l.soCau)) : nguyen(du.soCau)
  const soCauDung = Math.min(soCau, tl ? tong(tl.map((l) => l.soCauDung)) : nguyen(du.soCauDung))
  const tongEm = nh ? nh.length : tl ? tong(tl.map((l) => l.siSo)) : nguyen(du.tongEm)
  const soEmHoc = Math.min(tongEm, nh ? nh.filter((e) => e.soCau > 0).length : tl ? tong(tl.map((l) => l.daHoc)) : nguyen(du.soEmHoc))
  return { soEmHoc, tongEm, chuaHoc: tongEm - soEmHoc, soCau, soCauDung, tiLeDung: soCau > 0 ? (soCauDung / soCau) * 100 : null }
}

/** Chỗ máy chủ trả các khối LỆCH nhau (rỗng = khớp). Chỉ so những cặp cùng có mặt. */
export function kiemTraKhop(du: DuLieuSan): string[] {
  const loi: string[] = []
  const tl = du.theoLop && du.theoLop.length > 0 ? du.theoLop : null
  const nh = du.nhiet && du.nhiet.length > 0 ? du.nhiet : null
  if (tl && tong(tl.map((l) => l.soCau)) !== nguyen(du.soCau)) loi.push('tổng câu các lớp ≠ "Câu đã làm"')
  if (tl && tong(tl.map((l) => l.soCauDung)) !== nguyen(du.soCauDung)) loi.push('tổng câu đúng các lớp ≠ số câu đúng')
  if (nh && nh.filter((e) => e.soCau > 0).length !== nguyen(du.soEmHoc)) loi.push('số ô nhiệt đã học ≠ "Em đã học"')
  if (nh && nh.length !== nguyen(du.tongEm)) loi.push('số ô nhiệt ≠ sĩ số')
  if (tl && nh && tong(tl.map((l) => l.daHoc)) !== nh.filter((e) => e.soCau > 0).length) loi.push('tổng "đã học" các lớp ≠ số ô nhiệt đã học')
  if (tl && tong(tl.map((l) => l.siSo)) !== nguyen(du.tongEm)) loi.push('tổng sĩ số các lớp ≠ sĩ số')
  return loi
}

/** Chênh lệch `phut` phút gần nhất của một chuỗi 60 điểm (cuối − điểm cách `phut` phút); thiếu điểm ⇒ null. */
export function chenhLech(tia: readonly number[] | null | undefined, phut = 10): number | null {
  if (!tia || tia.length <= phut) return null
  const a = tia[tia.length - 1]
  const b = tia[tia.length - 1 - phut]
  return Number.isFinite(a) && Number.isFinite(b) ? a! - b! : null
}

const hai = (n: number): string => String(n).padStart(2, '0')
/** HH:MM:SS giờ Việt Nam của một mốc ms (không lệ thuộc múi giờ máy). */
export function gioGiayVN(ms: number): string {
  const d = new Date(ms + 7 * 3_600_000)
  return `${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())}:${hai(d.getUTCSeconds())}`
}
const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
/** "Từ 12:00 · Thứ Hai 21/09/2026" — chip mốc hiển thị. */
export function chuMoc(mocMs: number): string {
  const d = new Date(mocMs + 7 * 3_600_000)
  return `Từ ${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())} · ${THU[d.getUTCDay()]} ${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

/** HH:MM giờ Việt Nam của một mốc ms. */
export function gioPhutMs(ms: number): string {
  const d = new Date(ms + 7 * 3_600_000)
  return `${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())}`
}

/** "mm:ss" còn lại đến `denMs` (không âm). */
export function conLai(denMs: number, nowMs: number): string {
  const s = Math.max(0, Math.floor((denMs - nowMs) / 1000))
  return `${hai(Math.floor(s / 60))}:${hai(s % 60)}`
}

/** Số thực → "84,5" (dấu phẩy Việt Nam, `k` chữ số thập phân). */
export const phay = (n: number, k = 1): string => n.toFixed(k).replace('.', ',')
