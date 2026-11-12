// LIVE THEO KHỐI — chữ ngày giờ dùng ở bảng «Live» của thầy và thẻ Live trang chủ em. Thuần (không DOM), theo giờ của máy đang mở.
const hai = (n: number) => String(n).padStart(2, '0')
const chuThu = (d: Date) => (d.getDay() === 0 ? 'CN' : `Th ${d.getDay() + 1}`)
export const chuGio = (d: Date) => `${hai(d.getHours())}:${hai(d.getMinutes())}`
/** «Th 5 12/11 · 19:30» theo giờ máy thầy. */
export const chuNgayGio = (ms: number): string => { const d = new Date(ms); return `${chuThu(d)} ${hai(d.getDate())}/${hai(d.getMonth() + 1)} · ${chuGio(d)}` }
export const oNgay = (d: Date) => `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
export const cungNgay = (a: number, b: number) => oNgay(new Date(a)) === oNgay(new Date(b))
/** Ghép ô ngày «YYYY-MM-DD» + ô giờ «HH:MM» (giờ máy thầy) thành mốc ms; thiếu / sai ⇒ null. */
export function mocTuO(ngay: string, gio: string): number | null {
  const n = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngay), g = /^(\d{2}):(\d{2})/.exec(gio)
  if (!n || !g) return null
  const ms = new Date(Number(n[1]), Number(n[2]) - 1, Number(n[3]), Number(g[1]), Number(g[2]), 0, 0).getTime()
  return Number.isFinite(ms) ? ms : null
}


/** «Live 19:30 hôm nay» / «Live 19:30 ngày 14/11» theo giờ máy em. */
export function chuGioLive(batDau: number, nay: number): string {
  const d = new Date(batDau), n = new Date(nay), gio = `${hai(d.getHours())}:${hai(d.getMinutes())}`
  const homNay = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
  return homNay ? `Live ${gio} hôm nay` : `Live ${gio} ngày ${hai(d.getDate())}/${hai(d.getMonth() + 1)}`
}
/** «còn 2 giờ 15 phút» · «còn 3 ngày 4 giờ» · «còn chưa tới 1 phút» · đã tới giờ ⇒ «sắp bắt đầu». */
export function chuConLai(batDau: number, nay: number): string {
  const ms = batDau - nay
  if (ms <= 0) return 'sắp bắt đầu'
  const phut = Math.floor(ms / 60_000)
  if (phut < 1) return 'còn chưa tới 1 phút'
  const ngay = Math.floor(phut / 1440), gio = Math.floor((phut % 1440) / 60), le = phut % 60
  if (ngay > 0) return gio > 0 ? `còn ${ngay} ngày ${gio} giờ` : `còn ${ngay} ngày`
  if (gio > 0) return le > 0 ? `còn ${gio} giờ ${le} phút` : `còn ${gio} giờ`
  return `còn ${le} phút`
}
