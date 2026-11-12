// MÁY TÍNH «Đỗ Đại Học FX4869» (thầy duyệt bản vẽ 31–34, 12/11) — SỐ của máy: phân số CHÍNH XÁC (bigint) khi còn giữ được, số thực khi không
// (căn không khai được, log, lượng giác…). Kết quả hiện 10 chữ số có nghĩa như máy cầm tay; làm tròn bằng số nguyên lớn, không qua toFixed.
export type PhanSo = { n: bigint; d: bigint }
export type So = PhanSo | number
export type LoaiLoi = 'toan' | 'cu-phap'
export class LoiTinh extends Error {
  loai: LoaiLoi
  constructor(loai: LoaiLoi) { super(loai); this.loai = loai }
}

const tuyet = (a: bigint): bigint => (a < 0n ? -a : a)
const uoc = (a: bigint, b: bigint): bigint => { a = tuyet(a); b = tuyet(b); while (b) { [a, b] = [b, a % b] } return a }
const bit = (a: bigint): number => tuyet(a).toString(16).length * 4
const MUOI = (k: number): bigint => 10n ** BigInt(k)

export const laPs = (a: So): a is PhanSo => typeof a !== 'number'
export function ps(n: bigint, d: bigint = 1n): PhanSo {
  if (d === 0n) throw new LoiTinh('toan')
  if (d < 0n) { n = -n; d = -d }
  const u = uoc(n, d) || 1n
  return { n: n / u, d: d / u }
}
export const nguyen = (k: number): PhanSo => ps(BigInt(Math.round(k)))
export const laNguyen = (a: So): a is PhanSo => laPs(a) && a.d === 1n
export const thuc = (a: So): number => (laPs(a) ? (bit(a.n) > 900 || bit(a.d) > 900 ? Number(a.n / a.d) : Number(a.n) / Number(a.d)) : a)
/** Số thực hợp lệ của máy: hữu hạn, |x| < 10¹⁰⁰. */
export function kiem(x: number): number { if (!Number.isFinite(x) || Math.abs(x) >= 1e100) throw new LoiTinh('toan'); return x }
/** Phân số quá dài (tử / mẫu hơn ~120 chữ số) ⇒ về số thực; vượt 10¹⁰⁰ ⇒ lỗi toán học. */
function gon(a: PhanSo): So {
  if (bit(a.n) - bit(a.d) > 328 && tuyet(a.n) >= a.d * MUOI(100)) throw new LoiTinh('toan')
  return bit(a.n) > 400 || bit(a.d) > 400 ? kiem(thuc(a)) : a
}
export const bangKhong = (a: So): boolean => (laPs(a) ? a.n === 0n : a === 0)
export const dau = (a: So): number => (laPs(a) ? (a.n > 0n ? 1 : a.n < 0n ? -1 : 0) : Math.sign(a))
export const doi = (a: So): So => (laPs(a) ? { n: -a.n, d: a.d } : -a)
export const cong = (a: So, b: So): So => (laPs(a) && laPs(b) ? gon(ps(a.n * b.d + b.n * a.d, a.d * b.d)) : kiem(thuc(a) + thuc(b)))
export const tru = (a: So, b: So): So => cong(a, doi(b))
export const nhan = (a: So, b: So): So => (laPs(a) && laPs(b) ? gon(ps(a.n * b.n, a.d * b.d)) : kiem(thuc(a) * thuc(b)))
export function chia(a: So, b: So): So {
  if (bangKhong(b)) throw new LoiTinh('toan')
  return laPs(a) && laPs(b) ? gon(ps(a.n * b.d, a.d * b.n)) : kiem(thuc(a) / thuc(b))
}
export const soSanh = (a: So, b: So): number => (laPs(a) && laPs(b) ? Number((a.n * b.d > b.n * a.d ? 1n : 0n) - (a.n * b.d < b.n * a.d ? 1n : 0n)) : Math.sign(thuc(a) - thuc(b)))

/** Căn bậc k NGUYÊN của số nguyên không âm; không khai được chính xác ⇒ null. */
function canNguyen(n: bigint, k: number): bigint | null {
  if (n < 0n) return null
  if (n < 2n) return n
  if (bit(n) > 900) return null
  const uocLuong = BigInt(Math.round(Math.pow(Number(n), 1 / k)))
  for (const r of [uocLuong - 1n, uocLuong, uocLuong + 1n]) if (r >= 0n && r ** BigInt(k) === n) return r
  return null
}
export function canBac(k: number, a: So): So {
  if (!Number.isInteger(k) || k < 2) return luyThua(a, chia(nguyen(1), k))
  const am = dau(a) < 0
  if (am && k % 2 === 0) throw new LoiTinh('toan')
  if (laPs(a)) {
    const t = canNguyen(tuyet(a.n), k), m = canNguyen(a.d, k)
    if (t != null && m != null) return ps(am ? -t : t, m)
  }
  const x = Math.abs(thuc(a)), r = k === 2 ? Math.sqrt(x) : k === 3 ? Math.cbrt(x) : Math.pow(x, 1 / k)
  return kiem(am ? -r : r)
}
export const can = (a: So): So => canBac(2, a)

export function luyThua(a: So, b: So): So {
  if (laPs(a) && laNguyen(b)) {
    if (tuyet(b.n) > 100000n) { if (tuyet(a.n) === a.d) return b.n % 2n === 0n ? nguyen(1) : a }
    else {
      const e = Number(b.n), k = Math.abs(e)
      if (a.n === 0n) { if (e <= 0) throw new LoiTinh('toan'); return nguyen(0) }
      if (bit(a.n) * k <= 700 && bit(a.d) * k <= 700) { const t = a.n ** BigInt(k), m = a.d ** BigInt(k); return gon(e >= 0 ? ps(t, m) : ps(m, t)) }
    }
  }
  // Mũ là phân số mẫu nhỏ: thử khai căn chính xác trước (8^(2/3) = 4); cơ số âm chỉ nhận mẫu lẻ.
  if (laPs(b) && b.d !== 1n && b.d <= 12n && tuyet(b.n) <= 64n) {
    const q = Number(b.d)
    if (dau(a) < 0 && q % 2 === 0) throw new LoiTinh('toan')
    const r = canBac(q, a)
    return luyThua(r, ps(b.n))
  }
  const x = thuc(a), y = thuc(b)
  if (x === 0 && y <= 0) throw new LoiTinh('toan')
  if (x < 0) {
    if (!Number.isInteger(y)) throw new LoiTinh('toan')
    return kiem(Math.pow(x, y))
  }
  return kiem(Math.pow(x, y))
}
export function giaiThua(a: So): So {
  if (!laNguyen(a) || a.n < 0n || a.n > 69n) throw new LoiTinh('toan')
  let r = 1n
  for (let i = 2n; i <= a.n; i += 1n) r *= i
  return ps(r)
}
function demChon(n: So, r: So, chia_: boolean): So {
  if (!laNguyen(n) || !laNguyen(r) || r.n < 0n || r.n > n.n || n.n > 10n ** 10n) throw new LoiTinh('toan')
  const k = chia_ && r.n * 2n > n.n ? n.n - r.n : r.n
  if (k > 3000n) throw new LoiTinh('toan')
  let t = 1n, m = 1n
  for (let i = 0n; i < k; i += 1n) { t *= n.n - i; if (chia_) m *= i + 1n }
  return gon(ps(t, m))
}
export const toHop = (n: So, r: So): So => demChon(n, r, true)
export const chinhHop = (n: So, r: So): So => demChon(n, r, false)

/** Chuỗi thập phân đã nhập («12,5», «,5», «3») ⇒ phân số chính xác. */
export function tuChuoi(s: string): PhanSo {
  const [a, b = '', thua] = s.split(',')
  if (thua !== undefined || !/^\d*$/.test(a) || !/^\d*$/.test(b) || !(a + b)) throw new LoiTinh('cu-phap')
  return ps(BigInt((a || '0') + b), MUOI(b.length))
}
/** Số thực ⇒ phân số thập phân 15 chữ số có nghĩa (chỉ để LÀM TRÒN khi hiện, không dùng để tính tiếp). */
function tuThuc(x: number): PhanSo {
  if (x === 0) return ps(0n)
  const [m, e] = x.toExponential(14).split('e'), mu = Number(e) - 14, so = BigInt(m.replace('.', ''))
  return mu >= 0 ? ps(so * MUOI(mu)) : ps(so, MUOI(-mu))
}
const chiaTron = (t: bigint, m: bigint): bigint => (2n * t + m) / (2n * m) // làm tròn nửa lên, t ≥ 0, m > 0

/** Dạng khoa học: `cs` = đúng `chuSo` chữ số có nghĩa (đã làm tròn), giá trị = c,sss… × 10^mu. */
export function khoaHoc(a: So, chuSo: number): { am: boolean; cs: string; mu: number } {
  const p = laPs(a) ? a : tuThuc(a)
  if (p.n === 0n) return { am: false, cs: '0'.repeat(chuSo), mu: 0 }
  const t = tuyet(p.n)
  let mu = t.toString().length - p.d.toString().length
  for (let lan = 0; lan < 4; lan += 1) {
    const s = chuSo - 1 - mu, q = s >= 0 ? chiaTron(t * MUOI(s), p.d) : chiaTron(t, p.d * MUOI(-s)), dai = q.toString().length
    if (dai > chuSo) mu += 1
    else if (dai < chuSo) mu -= 1
    else return { am: p.n < 0n, cs: q.toString(), mu }
  }
  throw new LoiTinh('toan')
}
/** Làm tròn tới `le` chữ số thập phân ⇒ chuỗi «123,450» (Fix). */
function coDinh(a: So, le: number): string {
  const p = laPs(a) ? a : tuThuc(a), q = chiaTron(tuyet(p.n) * MUOI(le), p.d), s = q.toString().padStart(le + 1, '0')
  return (p.n < 0n && q !== 0n ? '-' : '') + s.slice(0, s.length - le) + (le ? ',' + s.slice(-le) : '')
}
export interface CachHien { /** số chữ số thập phân cố định, −1 = không */ fix: number; /** 1: số nhỏ hơn 0,01 hiện ×10ⁿ · 2: giữ dạng 0,000… tới 10⁻⁹ */ nho: 1 | 2; /** dạng kĩ thuật (mũ chia hết cho 3) */ eng?: boolean }
const botKhong = (s: string): string => (s.includes(',') ? s.replace(/0+$/, '').replace(/,$/, '') : s)
/** Số ⇒ chuỗi hiện trên màn (dấu phẩy thập phân, «E» ngăn phần ×10ⁿ: «6,02E23»). */
export function dinhDang(a: So, o: CachHien): string {
  if (bangKhong(a)) return o.fix > 0 ? '0,' + '0'.repeat(o.fix) : '0'
  const { am, cs, mu } = khoaHoc(a, 10), d = am ? '-' : ''
  if (o.eng) {
    const e3 = Math.floor(mu / 3) * 3, k = mu - e3 + 1
    return d + botKhong(cs.slice(0, k) + ',' + cs.slice(k)) + 'E' + e3
  }
  if (mu >= 10 || mu < (o.nho === 1 ? -2 : -9)) return d + botKhong(cs[0] + ',' + cs.slice(1)) + 'E' + mu
  if (o.fix >= 0) return coDinh(a, Math.min(o.fix, 9))
  return d + (mu >= 0 ? botKhong(cs.slice(0, mu + 1) + ',' + cs.slice(mu + 1)) : botKhong('0,' + '0'.repeat(-mu - 1) + cs))
}
/** Phân số hiện được kiểu sách: mẫu khác 1, tử + mẫu không quá 9 chữ số. */
export const hienPs = (a: So): a is PhanSo => laPs(a) && a.d !== 1n && tuyet(a.n).toString().length + a.d.toString().length <= 9
export type Hien = { kieu: 'so'; chu: string } | { kieu: 'ps'; am: boolean; nguyen: string; tu: string; mau: string }
/** Kết quả ⇒ thứ hiện ở dòng dưới: `dang` = 'ps' phân số · 'hs' hỗn số · 'tp' thập phân. */
export function hienSo(a: So, dang: 'tp' | 'ps' | 'hs', o: CachHien): Hien {
  if (dang !== 'tp' && hienPs(a)) {
    const t = tuyet(a.n), hon = dang === 'hs' && t > a.d
    return { kieu: 'ps', am: a.n < 0n, nguyen: hon ? (t / a.d).toString() : '', tu: (hon ? t % a.d : t).toString(), mau: a.d.toString() }
  }
  return { kieu: 'so', chu: dinhDang(a, o) }
}
