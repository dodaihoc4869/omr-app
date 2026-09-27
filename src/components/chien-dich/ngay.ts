// NGÀY GIỜ CỦA CHIẾN DỊCH — thuần, theo GIỜ VIỆT NAM (UTC+7), một kiểu chữ: "23:59 · Chủ Nhật 04/10/2026".
// Ngày trao đổi với máy chủ là `YYYY-MM-DD`; hạn nộp hết lúc 23:59 ngày ấy (hợp đồng Game Hóa 2.0).

const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const LECH_VN_MS = 7 * 3_600_000
const NGAY_MS = 86_400_000
const NGAY = /^(\d{4})-(\d{2})-(\d{2})$/

const hai = (n: number) => String(n).padStart(2, '0')

export const laNgay = (s: unknown): s is string => typeof s === 'string' && NGAY.test(s)

/** Ngày Việt Nam `YYYY-MM-DD` của một mốc (ms). */
export function ngayVn(nowMs: number): string {
  const d = new Date(nowMs + LECH_VN_MS)
  return `${d.getUTCFullYear()}-${hai(d.getUTCMonth() + 1)}-${hai(d.getUTCDate())}`
}

/** Cộng `n` ngày vào ngày `YYYY-MM-DD`. Ngày hỏng ⇒ trả nguyên. */
export function congNgay(ngay: string, n: number): string {
  const m = NGAY.exec(ngay)
  if (!m) return ngay
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + n * NGAY_MS)
  return `${d.getUTCFullYear()}-${hai(d.getUTCMonth() + 1)}-${hai(d.getUTCDate())}`
}

/** "Chủ Nhật 04/10/2026" — `coNam = false` ⇒ "Chủ Nhật 04/10". */
export function hienNgay(ngay: string, coNam = true): string {
  const m = NGAY.exec(ngay)
  if (!m) return ''
  const thu = THU[new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).getUTCDay()]
  return coNam ? `${thu} ${m[3]}/${m[2]}/${m[1]}` : `${thu} ${m[3]}/${m[2]}`
}

/** "23:59 · Chủ Nhật 04/10/2026" — mốc hết hạn nộp. */
export function hienHanNop(ngay: string, coNam = true): string {
  const t = hienNgay(ngay, coNam)
  return t ? `23:59 · ${t}` : ''
}

/** Mốc (ms) hết hạn nộp: 23:59:59 giờ Việt Nam của ngày `hanNop`. */
export function mocHetHan(hanNop: string): number {
  const m = NGAY.exec(hanNop)
  if (!m) return NaN
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59) - LECH_VN_MS
}

/** "còn 1 ngày 5 giờ" / "còn 3 giờ" / "còn dưới 1 giờ"; đã qua ⇒ "đã hết hạn nộp". */
export function conLai(hanNop: string, nowMs: number): string {
  const het = mocHetHan(hanNop)
  if (!Number.isFinite(het)) return ''
  const con = het - nowMs
  if (con <= 0) return 'đã hết hạn nộp'
  const ngay = Math.floor(con / NGAY_MS)
  const gio = Math.floor((con % NGAY_MS) / 3_600_000)
  if (ngay > 0) return gio > 0 ? `còn ${ngay} ngày ${gio} giờ` : `còn ${ngay} ngày`
  return gio > 0 ? `còn ${gio} giờ` : 'còn dưới 1 giờ'
}

/** "85%" — tỉ lệ 0–1 (có thể > 1). Không phải số ⇒ "—". */
export function phanTram(x: number | null | undefined): string {
  return typeof x === 'number' && Number.isFinite(x) ? `${Math.round(x * 100)}%` : '—'
}
