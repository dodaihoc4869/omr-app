/** NGÀY / THÁNG / NĂM + GIỜ : PHÚT, 24 GIỜ — phần THUẦN của ô `ONgayGio24` (thầy yêu cầu 21/09: không phụ thuộc máy hiện AM/PM hay mm/dd, đồng bộ mọi nơi).
 *
 *  Giá trị ra GIỮ NGUYÊN dạng các hàm cũ đang nhận: 'YYYY-MM-DDTHH:mm' (như `<input type="datetime-local">`) hoặc 'YYYY-MM-DD' (như `type="date"`).
 *  Ô CHỈ ghép/kiểm chữ; múi giờ do NGƯỜI DÙNG giá trị quyết (`hanNhapVietNam` đọc là giờ VN, `new Date(local)` đọc là giờ máy) — ô chỉ cần biết "bây giờ" ở múi nào để
 *  báo "đã qua" và tính nút nhanh. Không IO, không thư viện. */

export interface TruongNgayGio {
  d: string
  m: string
  y: string
  h: string
  p: string
}
export const TRONG: TruongNgayGio = { d: '', m: '', y: '', h: '', p: '' }

export type MuiGio = 'vn' | 'may'

const hai = (n: number) => String(n).padStart(2, '0')

export function laNamNhuan(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}
export function soNgayTrongThang(m: number, y: number): number {
  if (m === 2) return laNamNhuan(y) ? 29 : 28
  return [4, 6, 9, 11].includes(m) ? 30 : 31
}

/** 'YYYY-MM-DDTHH:mm' | 'YYYY-MM-DD' → các trường chữ. Chuỗi lạ ⇒ rỗng. */
export function tachGiaTri(v: string): TruongNgayGio {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(v ?? '').trim())
  if (!m) return { ...TRONG }
  return { y: m[1], m: m[2], d: m[3], h: m[4] ?? '', p: m[5] ?? '' }
}

export interface KetQuaGhep {
  /** Giá trị hợp lệ ('' khi chưa đủ / không có thật). */
  gia: string
  /** Lời báo lỗi bằng chữ; '' khi hợp lệ hoặc khi CHƯA nhập gì. */
  loi: string
  /** Đã nhập một phần (có ít nhất một ô) — để biết "chưa đủ" khác "để trống". */
  daNhap: boolean
}

/** Ghép + kiểm. `coGio=false` ⇒ chỉ ngày ('YYYY-MM-DD'). Không kiểm "đã qua" ở đây (xem `daQua`). */
export function ghepGiaTri(f: TruongNgayGio, coGio: boolean): KetQuaGhep {
  const cacO = coGio ? [f.d, f.m, f.y, f.h, f.p] : [f.d, f.m, f.y]
  const daNhap = cacO.some((x) => x !== '')
  if (!daNhap) return { gia: '', loi: '', daNhap: false }
  if (cacO.some((x) => x === '') || f.y.length !== 4) return { gia: '', loi: coGio ? 'Nhập đủ ngày, tháng, năm (4 số), giờ và phút.' : 'Nhập đủ ngày, tháng, năm (4 số).', daNhap: true }
  const d = Number(f.d)
  const m = Number(f.m)
  const y = Number(f.y)
  if (m < 1 || m > 12) return { gia: '', loi: `Tháng ${f.m} không có thật — tháng từ 1 đến 12.`, daNhap: true }
  if (y < 2000 || y > 2100) return { gia: '', loi: `Năm ${f.y} không hợp lý — nhập năm từ 2000 đến 2100.`, daNhap: true }
  if (d < 1 || d > soNgayTrongThang(m, y)) return { gia: '', loi: `Ngày ${hai(d)}/${hai(m)}/${y} không có thật${m === 2 && d === 29 ? ' (năm ' + y + ' không nhuận)' : ''}.`, daNhap: true }
  const ngay = `${y}-${hai(m)}-${hai(d)}`
  if (!coGio) return { gia: ngay, loi: '', daNhap: true }
  const h = Number(f.h)
  const p = Number(f.p)
  if (h < 0 || h > 23 || p < 0 || p > 59) return { gia: '', loi: 'Giờ phải từ 00 đến 23 và phút từ 00 đến 59 (đồng hồ 24 giờ).', daNhap: true }
  return { gia: `${ngay}T${hai(h)}:${hai(p)}`, loi: '', daNhap: true }
}

/** Thời điểm "bây giờ" theo múi của giá trị, dạng 'YYYY-MM-DDTHH:mm' (VN = UTC+7 cố định, không DST). */
export function bayGio(nayMs: number, mui: MuiGio): string {
  if (mui === 'vn') return new Date(nayMs + 7 * 3_600_000).toISOString().slice(0, 16)
  const d = new Date(nayMs)
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}T${hai(d.getHours())}:${hai(d.getMinutes())}`
}

/** Giá trị đã QUA so với bây giờ (so từng phút; giá trị chỉ-ngày tính hết ngày 23:59). */
export function daQua(gia: string, nayMs: number, mui: MuiGio): boolean {
  if (!gia) return false
  const chuan = gia.length === 10 ? `${gia}T23:59` : gia
  return chuan < bayGio(nayMs, mui)
}

/** Ngày (hôm nay + `them` ngày) theo múi, dạng 'YYYY-MM-DD'. */
export function ngayCong(nayMs: number, them: number, mui: MuiGio): string {
  return bayGio(nayMs + them * 86_400_000, mui).slice(0, 10)
}

export interface NutNhanh {
  id: string
  nhan: string
  gia: string
}
/** Bốn nút nhanh của hạn nộp: "Hôm nay 23:59 · Mai 23:59 · +3 ngày · +7 ngày" (mỗi nút đặt 23:59 của ngày ấy; `coGio=false` ⇒ chỉ ngày). */
export function nutNhanh(nayMs: number, mui: MuiGio, coGio: boolean): NutNhanh[] {
  const dat = (them: number) => (coGio ? `${ngayCong(nayMs, them, mui)}T23:59` : ngayCong(nayMs, them, mui))
  return [
    { id: 'hom-nay', nhan: 'Hôm nay 23:59', gia: dat(0) },
    { id: 'mai', nhan: 'Mai 23:59', gia: dat(1) },
    { id: '3-ngay', nhan: '+3 ngày', gia: dat(3) },
    { id: '7-ngay', nhan: '+7 ngày', gia: dat(7) },
  ]
}

/** Bước lên/xuống một ô (mũi tên): d 1..số ngày của tháng (vòng), m 1..12 (vòng), y ±1 (2000..2100), h 0..23 (vòng), p 0..59 (vòng). Ô trống ⇒ lấy từ `moc`. */
export function buocO(truong: keyof TruongNgayGio, hienTai: TruongNgayGio, huong: 1 | -1, moc: TruongNgayGio): string {
  const so = (x: string, mac: string) => (x === '' ? Number(mac) : Number(x))
  const vong = (v: number, tu: number, den: number) => (v < tu ? den : v > den ? tu : v)
  switch (truong) {
    case 'd': {
      const y = so(hienTai.y, moc.y)
      const m = so(hienTai.m, moc.m)
      return hai(vong(so(hienTai.d, moc.d) + huong, 1, soNgayTrongThang(m >= 1 && m <= 12 ? m : 1, y)))
    }
    case 'm':
      return hai(vong(so(hienTai.m, moc.m) + huong, 1, 12))
    case 'y':
      return String(Math.min(2100, Math.max(2000, so(hienTai.y, moc.y) + huong)))
    case 'h':
      return hai(vong(so(hienTai.h, moc.h) + huong, 0, 23))
    default:
      return hai(vong(so(hienTai.p, moc.p) + huong, 0, 59))
  }
}

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

/** "HH:mm · Thứ Sáu 25/09/2026" từ MỘT giá trị đã ghép ('YYYY-MM-DDTHH:mm'); giá trị chỉ-ngày ('YYYY-MM-DD') ⇒ "Thứ Sáu 25/09/2026" (không giờ). Sai ⇒ ''. */
export function hienGiaTri(gia: string): string {
  const f = tachGiaTri(gia)
  const k = ghepGiaTri(f, gia.length > 10)
  if (!k.gia) return ''
  const t = THU[new Date(Date.UTC(Number(f.y), Number(f.m) - 1, Number(f.d))).getUTCDay()]
  return gia.length > 10 ? `${f.h}:${f.p} · ${t} ${f.d}/${f.m}/${f.y}` : `${t} ${f.d}/${f.m}/${f.y}`
}

/** "HH:mm · Thứ Sáu 25/09/2026" của một MỐC THỜI GIAN (ISO / ms) theo GIỜ VIỆT NAM. Sai ⇒ `khiSai`. Dùng cho mọi chỗ HIỆN hạn nộp ở app giáo viên. */
export function gioDayDu(moc: unknown, khiSai = 'Chưa có hạn hợp lệ'): string {
  const ms = typeof moc === 'number' ? moc : typeof moc === 'string' && moc.trim() ? Date.parse(moc) : NaN
  if (!Number.isFinite(ms)) return khiSai
  return hienGiaTri(bayGio(ms, 'vn'))
}
