// Chữ ngày giờ cho Kiểm tra ôn tập (đợt 20, bản vẽ docs/ban-ve-dot20 thầy duyệt 13/10). Giờ Việt Nam, 24 giờ, theo chuẩn A1.6.
// CHỈ dùng trong thẻ / màn kiểm tra (nạp lười) ⇒ không thêm byte tải mở app.

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const VN = 7 * 3600_000
const hai = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' theo giờ Việt Nam của một mốc epoch ms. */
export const ngayVn = (ms: number) => new Date(ms + VN).toISOString().slice(0, 10)

/** "Thứ Bảy 17/10" từ ngày 'YYYY-MM-DD' (ngày lịch Việt Nam). */
export function thuNgay(ngay: string): string {
  const [y, m, d] = ngay.split('-').map(Number)
  if (!y || !m || !d) return ngay
  return `${THU[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${hai(d)}/${hai(m)}`
}

/** Phần thứ trên tờ lịch: "TH 7" · "CN". */
export function thuNgan(ngay: string): string {
  const [y, m, d] = ngay.split('-').map(Number)
  const t = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay()
  return t === 0 ? 'CN' : `TH ${t + 1}`
}

/** "15:42" theo giờ Việt Nam. */
export function gioVn(ms: number): string {
  const t = new Date(ms + VN)
  return `${hai(t.getUTCHours())}:${hai(t.getUTCMinutes())}`
}

/** Hạn nộp trong ngày kiểm tra: mốc đúng 00:00 của ngày sau ⇒ "24:00" (cùng ngày, dễ hiểu với em); khác thì giờ thật. */
export function gioHan(hanLuc: number, ngay: string): string {
  return gioVn(hanLuc) === '00:00' && ngayVn(hanLuc - 1) === ngay ? '24:00' : gioVn(hanLuc)
}

/** Số ngày lịch từ hôm nay (giờ máy chủ) tới ngày kiểm tra. */
export function soNgayToi(ngay: string, nowMs: number): number {
  return Math.round((Date.parse(`${ngay}T00:00:00Z`) - Date.parse(`${ngayVn(nowMs)}T00:00:00Z`)) / 86_400_000)
}

/** "9 giờ 18 phút" · "45 phút" · "dưới 1 phút". */
export function conLai(ms: number): string {
  const p = Math.floor(Math.max(0, ms) / 60_000)
  if (p < 1) return 'dưới 1 phút'
  const g = Math.floor(p / 60)
  return g ? `${g} giờ${p % 60 ? ` ${p % 60} phút` : ''}` : `${p} phút`
}

/** Đồng hồ chặng "7:42". */
export const dongHo = (giay: number) => `${Math.floor(giay / 60)}:${hai(giay % 60)}`

/** Điểm kiểu Việt Nam: 8.25 ⇒ "8,25"; 8 ⇒ "8". */
export const diemChu = (d: number) => String(Math.round(d * 100) / 100).replace('.', ',')
