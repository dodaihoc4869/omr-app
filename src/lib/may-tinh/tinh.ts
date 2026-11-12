// MÁY TÍNH FX4869 — TÍNH BIỂU THỨC. Biểu thức là DÃY PHÍM ĐÃ BẤM (mảng mã): chữ số, ',' , + - × ÷ , hàm có ngoặc mở sẵn ('sin(' …), hậu tố
// ('²' '³' '⁻¹' '!' '%' '°'), 'e10' (×10ⁿ, dính liền số như phím ×10ˣ của máy cầm tay), và NHÓM kiểu sách: mã kết thúc bằng '{' mở nhóm, '|' ngăn ô,
// '}' đóng — 'ps{' tử | mẫu '}', 'hs{' nguyên | tử | mẫu '}', 'can{' … '}', 'can3{' … '}', 'cany{' bậc | … '}', 'mu{' số mũ '}'.
// Thứ tự ưu tiên như máy cầm tay: hậu tố / luỹ thừa > dấu âm > nhân ngầm (2π, 3√2) > nCr nPr > × ÷ > + −.
import { LoiTinh, can, canBac, chia, chinhHop, cong, doi, giaiThua, kiem, laNguyen, laPs, luyThua, nguyen, nhan, ps, thuc, toHop, tru, tuChuoi, type So } from './so'

export interface MoiTruong { /** đơn vị góc: D = độ, R = radian */ goc: 'D' | 'R'; ans: So; bien: Record<string, So> }
export const BIEN = ['A', 'B', 'C', 'D', 'E', 'F', 'x', 'y', 'M'] as const
const HAM = new Set(['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(', 'log(', 'ln(', 'abs('])
const laSo = (t: string | undefined): boolean => t !== undefined && t.length === 1 && t >= '0' && t <= '9'
/** Mã bắt đầu một thừa số (để nhận phép nhân ngầm). */
const moDau = (t: string | undefined): boolean => t !== undefined && (laSo(t) || t === ',' || t === '(' || t === 'pi' || t === 'e' || t === 'Ans' || HAM.has(t) || (t.endsWith('{') && t !== 'mu{') || (BIEN as readonly string[]).includes(t))

const SIN_DO: Record<number, [number, number]> = { 0: [0, 1], 30: [1, 2], 90: [1, 1], 150: [1, 2], 180: [0, 1], 210: [-1, 2], 270: [-1, 1], 330: [-1, 2] }
const TAN_DO: Record<number, number> = { 0: 0, 45: 1, 135: -1, 180: 0, 225: 1, 315: -1 }
const mod360 = (a: So): number | null => (laNguyen(a) ? Number(((a.n % 360n) + 360n) % 360n) : null)
const sach = (x: number): number => (Math.abs(x) < 1e-14 ? 0 : x)

function luongGiac(ten: string, a: So, goc: 'D' | 'R'): So {
  const x = thuc(a), r = goc === 'D' ? (x * Math.PI) / 180 : x
  if (ten === 'sin(' || ten === 'cos(') {
    const g = goc === 'D' ? mod360(ten === 'cos(' ? cong(a, nguyen(90)) : a) : null, dung = g == null ? undefined : SIN_DO[g]
    if (dung) return ps(BigInt(dung[0]), BigInt(dung[1]))
    return kiem(sach(ten === 'sin(' ? Math.sin(r) : Math.cos(r)))
  }
  if (ten === 'tan(') {
    const g = goc === 'D' ? mod360(a) : null
    if (g != null && (g === 90 || g === 270)) throw new LoiTinh('toan')
    if (g != null && TAN_DO[g] !== undefined) return nguyen(TAN_DO[g])
    if (Math.abs(Math.cos(r)) < 1e-14) throw new LoiTinh('toan')
    return kiem(sach(Math.tan(r)))
  }
  if ((ten === 'asin(' || ten === 'acos(') && Math.abs(x) > 1) throw new LoiTinh('toan')
  const v = ten === 'asin(' ? Math.asin(x) : ten === 'acos(' ? Math.acos(x) : Math.atan(x)
  return kiem(sach(goc === 'D' ? (v * 180) / Math.PI : v))
}
function ham(ten: string, a: So, goc: 'D' | 'R'): So {
  if (ten === 'abs(') return laPs(a) ? (a.n < 0n ? doi(a) : a) : Math.abs(a)
  if (ten === 'log(' || ten === 'ln(') {
    const x = thuc(a)
    if (x <= 0) throw new LoiTinh('toan')
    if (ten === 'log(' && laPs(a)) { // log của 10ⁿ chính xác
      const s = a.d === 1n ? a.n.toString() : a.n === 1n ? a.d.toString() : ''
      if (/^10*$/.test(s)) return nguyen(a.d === 1n ? s.length - 1 : 1 - s.length)
    }
    return kiem(ten === 'log(' ? Math.log10(x) : Math.log(x))
  }
  return luongGiac(ten, a, goc)
}

/** Tính dãy mã. Sai cú pháp / lỗi toán học ⇒ ném `LoiTinh`. */
export function tinh(bt: readonly string[], mt: MoiTruong): So {
  let i = 0
  const cu = (): never => { throw new LoiTinh('cu-phap') }
  const an = (t: string): void => { if (bt[i] !== t) cu(); i += 1 }
  const docSo = (): So => {
    let s = ''
    while (laSo(bt[i]) || bt[i] === ',') { s += bt[i]; i += 1 }
    let v: So = s ? tuChuoi(s) : nguyen(1)
    if (bt[i] === 'e10') {
      i += 1
      const am = bt[i] === 'neg' || bt[i] === '-'
      if (am || bt[i] === '+') i += 1
      let m = ''
      while (laSo(bt[i]) && m.length < 3) { m += bt[i]; i += 1 }
      if (!m) cu()
      v = nhan(v, luyThua(nguyen(10), nguyen(am ? -Number(m) : Number(m))))
    }
    // Độ – phút – giây: 12°30°15° (mỗi phần một dấu °)
    if (bt[i] === '°') {
      i += 1
      for (const mau of [60, 3600]) {
        const giu = i
        if (!laSo(bt[i]) && bt[i] !== ',') break
        let p = ''
        while (laSo(bt[i]) || bt[i] === ',') { p += bt[i]; i += 1 }
        if (bt[i] !== '°') { i = giu; break }
        i += 1
        v = cong(v, chia(tuChuoi(p), nguyen(mau)))
      }
    }
    return v
  }
  const goc = (): So => {
    const t = bt[i]
    if (t === undefined) return cu()
    if (laSo(t) || t === ',' || t === 'e10') return docSo()
    i += 1
    if (t === '(') { const v = bieuThuc(); if (bt[i] === ')') i += 1; return v }
    if (HAM.has(t)) { const v = bieuThuc(); if (bt[i] === ')') i += 1; return ham(t, v, mt.goc) }
    if (t === 'ps{') { const a = bieuThuc(); an('|'); const b = bieuThuc(); an('}'); return chia(a, b) }
    if (t === 'hs{') { const a = bieuThuc(); an('|'); const b = bieuThuc(); an('|'); const c = bieuThuc(); an('}'); const p = chia(b, c); return thuc(a) < 0 ? tru(a, p) : cong(a, p) }
    if (t === 'can{') { const a = bieuThuc(); an('}'); return can(a) }
    if (t === 'can3{') { const a = bieuThuc(); an('}'); return canBac(3, a) }
    if (t === 'cany{') { const k = bieuThuc(); an('|'); const a = bieuThuc(); an('}'); return laNguyen(k) && k.n >= 2n && k.n <= 1000n ? canBac(Number(k.n), a) : luyThua(a, chia(nguyen(1), k)) }
    if (t === 'pi') return Math.PI
    if (t === 'e') return Math.E
    if (t === 'Ans') return mt.ans
    if ((BIEN as readonly string[]).includes(t)) return mt.bien[t] ?? nguyen(0)
    return cu()
  }
  const hauTo = (): So => {
    let a = goc()
    for (;;) {
      const t = bt[i]
      if (t === '²') { i += 1; a = nhan(a, a) }
      else if (t === '³') { i += 1; a = nhan(a, nhan(a, a)) }
      else if (t === '⁻¹') { i += 1; a = chia(nguyen(1), a) }
      else if (t === 'mu{') { i += 1; const b = bieuThuc(); an('}'); a = luyThua(a, b) }
      else if (t === '!') { i += 1; a = giaiThua(a) }
      else if (t === '%') { i += 1; a = chia(a, nguyen(100)) }
      else return a
    }
  }
  const coDau = (): So => {
    if (bt[i] === 'neg' || bt[i] === '-') { i += 1; return doi(coDau()) }
    if (bt[i] === '+') { i += 1; return coDau() }
    return hauTo()
  }
  const ngam = (): So => { let a = coDau(); while (moDau(bt[i])) a = nhan(a, hauTo()); return a }
  const chon = (): So => {
    let a = ngam()
    while (bt[i] === 'nCr' || bt[i] === 'nPr') { const t = bt[i]; i += 1; const b = ngam(); a = t === 'nCr' ? toHop(a, b) : chinhHop(a, b) }
    return a
  }
  const tich = (): So => {
    let a = chon()
    while (bt[i] === '×' || bt[i] === '÷') { const t = bt[i]; i += 1; const b = chon(); a = t === '×' ? nhan(a, b) : chia(a, b) }
    return a
  }
  function bieuThuc(): So {
    let a = tich()
    while (bt[i] === '+' || bt[i] === '-') { const t = bt[i]; i += 1; const b = tich(); a = t === '+' ? cong(a, b) : tru(a, b) }
    return a
  }
  const v = bieuThuc()
  if (i < bt.length) cu()
  return v
}
