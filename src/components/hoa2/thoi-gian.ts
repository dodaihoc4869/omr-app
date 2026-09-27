// Ngày giờ của Game Hóa 2.0 — luật 6 bảng từ chuẩn: "còn 3 ngày 5 giờ (tới 23:59 Thứ Năm 24/09)", giờ Việt Nam (UTC+7), 24 giờ.
// Máy chủ gửi ngày dạng 'YYYY-MM-DD' (ngày Việt Nam). Hàm thuần, không đọc đồng hồ máy: `nowMs` do nơi gọi đưa vào.

const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const LECH_VN = 7 * 3600_000

function tach(ngay: string): [number, number, number] | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay || '')
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/** '2026-10-04' → 'Chủ Nhật'. Sai định dạng ⇒ ''. */
export function thuCua(ngay: string): string {
  const t = tach(ngay)
  if (!t) return ''
  return THU[new Date(Date.UTC(t[0], t[1] - 1, t[2])).getUTCDay()]!
}

/** '2026-10-04' → '04/10'. */
export function ngayThang(ngay: string): string {
  const t = tach(ngay)
  return t ? `${String(t[2]).padStart(2, '0')}/${String(t[1]).padStart(2, '0')}` : ''
}

/** '2026-10-05' → 'Thứ Hai 05/10'. */
export function thuNgayThang(ngay: string): string {
  const thu = thuCua(ngay)
  return thu ? `${thu} ${ngayThang(ngay)}` : ''
}

/** Mốc 23:59:59 giờ Việt Nam của ngày `ngay`, tính bằng ms. */
export function mocHetNgay(ngay: string): number | null {
  const t = tach(ngay)
  if (!t) return null
  return Date.UTC(t[0], t[1] - 1, t[2], 23, 59, 59) - LECH_VN
}

/**
 * Chữ hạn nộp đủ nhãn: "còn 4 ngày 9 giờ (tới 23:59 Chủ Nhật 04/10)".
 * Còn dưới 1 ngày: "còn 5 giờ (…)"; dưới 1 giờ: "còn dưới 1 giờ (…)"; đã qua: "đã hết hạn (23:59 Chủ Nhật 04/10)".
 */
export function chuHanNop(hanNop: string, nowMs: number): string {
  const moc = mocHetNgay(hanNop)
  if (moc === null) return ''
  const toi = `23:59 ${thuNgayThang(hanNop)}`
  const con = moc - nowMs
  if (con <= 0) return `đã hết hạn (${toi})`
  const ngay = Math.floor(con / 86_400_000)
  const gio = Math.floor((con % 86_400_000) / 3_600_000)
  const phan = ngay > 0 ? `${ngay} ngày${gio > 0 ? ` ${gio} giờ` : ''}` : gio > 0 ? `${gio} giờ` : 'dưới 1 giờ'
  return `còn ${phan} (tới ${toi})`
}

/** Ngày hôm sau của 'YYYY-MM-DD'. */
export function ngaySau(ngay: string): string {
  const t = tach(ngay)
  if (!t) return ''
  const d = new Date(Date.UTC(t[0], t[1] - 1, t[2] + 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

/** Giờ:phút + thứ ngày/tháng của một mốc ms theo giờ Việt Nam: "20:12 Chủ Nhật 04/10". */
export function gioThuNgay(ms: number): string {
  const d = new Date(ms + LECH_VN)
  const ngay = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} ${thuNgayThang(ngay)}`
}
