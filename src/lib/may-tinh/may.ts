// MÁY TÍNH FX4869 — «BỘ NÃO»: trạng thái + xử lý từng phím (hàm thuần `bam`) + thứ hiện trên màn (`manHinh`). Mặt máy (React) chỉ vẽ `ManHinh`
// và báo phím; máy em nhận đúng `ManHinh` thầy gửi qua kênh lớp nên hai bên luôn giống nhau từng chữ.
import { giaiDaThuc, giaiHe, thongKe, type Nghiem } from './giai'
import { LoiTinh, bangKhong, cong, dinhDang, hienPs, hienSo, laPs, nguyen, soSanh, thuc, tru, chia, nhan, type CachHien, type Hien, type LoaiLoi, type So } from './so'
import { BIEN, tinh } from './tinh'

export interface PhimMay { ma: string; chu: string; /** chức năng SHIFT (chữ vàng) */ s?: string; /** chữ ALPHA (biến nhớ) */ a?: string; lop?: string }
export const PHIM_HAM: PhimMay[][] = [
  [{ ma: 'inv', chu: 'x⁻¹', s: 'x!' }, { ma: 'can', chu: '√▫', s: '∛▫' }, { ma: 'binh', chu: 'x²', s: 'x³' }, { ma: 'mu', chu: 'x▫', s: 'ʸ√▫' }, { ma: 'log', chu: 'log', s: '10ˣ' }, { ma: 'ln', chu: 'ln', s: 'eˣ' }],
  [{ ma: 'am', chu: '(−)', s: 'nPr', a: 'A' }, { ma: 'dms', chu: '° ′ ″', s: 'nCr', a: 'B' }, { ma: 'sin', chu: 'sin', s: 'sin⁻¹', a: 'C' }, { ma: 'cos', chu: 'cos', s: 'cos⁻¹', a: 'D' }, { ma: 'tan', chu: 'tan', s: 'tan⁻¹', a: 'E' }, { ma: 'sd', chu: 'S⇔D', s: 'a b/c', a: 'F' }],
  [{ ma: 'sto', chu: 'STO', s: 'RCL' }, { ma: 'eng', chu: 'ENG', s: 'π', a: 'e' }, { ma: 'mo', chu: '(', s: '%', a: 'x' }, { ma: 'dong', chu: ')', s: 'Abs', a: 'y' }, { ma: 'ps', chu: '▫/▫', s: 'hỗn số' }, { ma: 'mc', chu: 'M+', s: 'M−', a: 'M' }],
]
export const PHIM_SO: PhimMay[][] = [
  [{ ma: '7', chu: '7', lop: 'so' }, { ma: '8', chu: '8', lop: 'so' }, { ma: '9', chu: '9', lop: 'so' }, { ma: 'DEL', chu: 'DEL', lop: 'xoa' }, { ma: 'AC', chu: 'AC', lop: 'xoa' }],
  [{ ma: '4', chu: '4', lop: 'so' }, { ma: '5', chu: '5', lop: 'so' }, { ma: '6', chu: '6', lop: 'so' }, { ma: 'nhan', chu: '×', lop: 'pt' }, { ma: 'chia', chu: '÷', lop: 'pt' }],
  [{ ma: '1', chu: '1', lop: 'so' }, { ma: '2', chu: '2', lop: 'so' }, { ma: '3', chu: '3', lop: 'so' }, { ma: 'cong', chu: '+', lop: 'pt' }, { ma: 'tru', chu: '−', lop: 'pt' }],
  [{ ma: '0', chu: '0', lop: 'so' }, { ma: 'phay', chu: ',', lop: 'so' }, { ma: 'e10', chu: '×10ˣ', lop: 'pt' }, { ma: 'ans', chu: 'Ans', lop: 'pt' }, { ma: 'bang', chu: '=', lop: 'bang' }],
]
/** Mã phím ⇒ dãy mã chèn vào biểu thức: thường / SHIFT / ALPHA. */
const CHEN: Record<string, { c?: string[]; s?: string[]; a?: string[] }> = {
  phay: { c: [','] }, cong: { c: ['+'] }, tru: { c: ['-'] }, nhan: { c: ['×'] }, chia: { c: ['÷'] }, e10: { c: ['e10'] }, ans: { c: ['Ans'] },
  inv: { c: ['⁻¹'], s: ['!'] }, can: { c: ['can{', '}'], s: ['can3{', '}'] }, binh: { c: ['²'], s: ['³'] }, mu: { c: ['mu{', '}'], s: ['cany{', '|', '}'] },
  log: { c: ['log('], s: ['1', '0', 'mu{', '}'] }, ln: { c: ['ln('], s: ['e', 'mu{', '}'] },
  am: { c: ['neg'], s: ['nPr'], a: ['A'] }, dms: { c: ['°'], s: ['nCr'], a: ['B'] }, sin: { c: ['sin('], s: ['asin('], a: ['C'] }, cos: { c: ['cos('], s: ['acos('], a: ['D'] },
  tan: { c: ['tan('], s: ['atan('], a: ['E'] }, sd: { a: ['F'] }, eng: { s: ['pi'], a: ['e'] }, mo: { c: ['('], s: ['%'], a: ['x'] }, dong: { c: [')'], s: ['abs('], a: ['y'] },
  ps: { c: ['ps{', '|', '}'], s: ['hs{', '|', '|', '}'] }, mc: { a: ['M'] },
}
for (let k = 0; k <= 9; k += 1) CHEN[String(k)] = { c: [String(k)] }
/** Bấm ngay sau một kết quả ⇒ nối tiếp từ Ans. */
const NOI_ANS = new Set(['+', '-', '×', '÷', '²', '³', '⁻¹', '!', '%', 'mu{', 'nCr', 'nPr'])
const DON = new Set<string>([...BIEN, 'Ans', 'pi', 'e'])
const DAI_TOI_DA = 120
const CHI_SO = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']
const chiSo = (k: number): string => String(k).split('').map((c) => CHI_SO[+c]).join('')

type Man = 'tinh' | 'menu' | 'cd' | 'fix' | 'pt-bac' | 'he-an' | 'nhap' | 'ra'
type Viec = '' | 'pt' | 'he' | 'bang' | 'tk'
interface DongRa { nhan: string; gt?: So; ng?: Nghiem; chu?: string }
export interface TrangThai {
  man: Man; viec: Viec
  /** biểu thức đang gõ + vị trí con trỏ (chỉ số trong mảng) */
  bt: string[]; ct: number
  kq: So | null; dang: 'tp' | 'ps' | 'hs'; loi: '' | LoaiLoi
  sh: boolean; al: boolean; cho: '' | 'sto' | 'rcl'; ghi: string
  goc: 'D' | 'R'; fix: number; nho: 1 | 2; eng: boolean
  ans: So; ansTp: boolean; bien: Record<string, So>
  /** các biểu thức đã tính (▲▼ gọi lại) */
  ls: string[][]; lsI: number
  bac: number; ten: string[]; gt: So[]; i: number; f: string[]
  ra: DongRa[]; raI: number
}
export const taoMay = (): TrangThai => ({
  man: 'tinh', viec: '', bt: [], ct: 0, kq: null, dang: 'ps', loi: '', sh: false, al: false, cho: '', ghi: '', goc: 'D', fix: -1, nho: 2, eng: false,
  ans: nguyen(0), ansTp: false, bien: {}, ls: [], lsI: 0, bac: 0, ten: [], gt: [], i: 0, f: [], ra: [], raI: 0,
})
const moiTruong = (t: TrangThai) => ({ goc: t.goc, ans: t.ans, bien: t.bien })
const coThapPhan = (t: TrangThai, v: So): boolean => !laPs(v) || t.bt.some((x) => x === ',' || x === 'e10') || (t.ansTp && t.bt.includes('Ans'))
const sachBt = (t: TrangThai): TrangThai => ({ ...t, bt: [], ct: 0, kq: null, loi: '' })

// ── SỬA BIỂU THỨC ──
/** Vị trí '}' đóng nhóm mở tại `mo`. */
function dongCua(bt: readonly string[], mo: number): number {
  let sau = 0
  for (let k = mo; k < bt.length; k += 1) { if (bt[k].endsWith('{')) sau += 1; else if (bt[k] === '}') { sau -= 1; if (!sau) return k } }
  return bt.length - 1
}
function chen(t: TrangThai, ma: string[]): TrangThai {
  let bt = t.bt, ct = t.ct
  if (t.kq != null || t.loi) { bt = t.kq != null && NOI_ANS.has(ma[0]) ? ['Ans'] : []; ct = bt.length }
  if (bt.length + ma.length > DAI_TOI_DA) return t
  let them = ma, truoc = bt.slice(0, ct)
  if (ma[0] === 'ps{' && ct > 0) { // phân số: số / biến đứng ngay trước con trỏ thành TỬ, con trỏ xuống mẫu
    let j = ct
    while (j > 0 && /^[\d,]$/.test(bt[j - 1])) j -= 1
    if (j === ct && DON.has(bt[ct - 1])) j = ct - 1
    if (j < ct) { them = ['ps{', ...bt.slice(j, ct), '|', '}']; truoc = bt.slice(0, j); return { ...t, bt: [...truoc, ...them, ...bt.slice(ct)], ct: truoc.length + them.length - 1, kq: null, loi: '' } }
  }
  const mo = them.findIndex((x) => x.endsWith('{'))
  return { ...t, bt: [...truoc, ...them, ...bt.slice(ct)], ct: truoc.length + (mo < 0 ? them.length : mo + 1), kq: null, loi: '' }
}
function xoa(t: TrangThai): TrangThai {
  if (t.kq != null || t.loi) return { ...t, kq: null, loi: '', ct: t.bt.length }
  const { bt, ct } = t
  if (ct <= 0) return bt.length && !bt[0].endsWith('{') ? { ...t, bt: bt.slice(1) } : t
  const x = bt[ct - 1]
  if (x === '|' || x === '}') return { ...t, ct: ct - 1 }
  if (!x.endsWith('{')) return { ...t, bt: [...bt.slice(0, ct - 1), ...bt.slice(ct)], ct: ct - 1 }
  // xoá khung nhóm, giữ nội dung các ô
  const dong = dongCua(bt, ct - 1), ruot: string[] = []
  for (let k = ct, sau = 0; k < dong; k += 1) { if (bt[k].endsWith('{')) sau += 1; else if (bt[k] === '}') sau -= 1; if (bt[k] !== '|' || sau) ruot.push(bt[k]) }
  return { ...t, bt: [...bt.slice(0, ct - 1), ...ruot, ...bt.slice(dong + 1)], ct: ct - 1 }
}
function diChuyen(t: TrangThai, trai: boolean): TrangThai {
  if (t.kq != null || t.loi) return { ...t, kq: null, loi: '', ct: trai ? t.bt.length : 0 }
  const n = t.bt.length
  return { ...t, ct: trai ? (t.ct <= 0 ? n : t.ct - 1) : t.ct >= n ? 0 : t.ct + 1 }
}
/** Phím thuộc việc sửa biểu thức ⇒ trạng thái mới; không thuộc ⇒ null. */
function suaBt(t: TrangThai, ma: string, sh: boolean, al: boolean): TrangThai | null {
  if (ma === 'DEL') return xoa(t)
  if (ma === 'L' || ma === 'R') return diChuyen(t, ma === 'L')
  const c = CHEN[ma], day = c ? (al ? c.a : sh ? c.s : c.c) : undefined
  return day ? chen(t, day) : null
}

// ── TÍNH ──
function thucHien(t: TrangThai, epTp = false): TrangThai {
  if (!t.bt.length) return t
  try {
    const v = tinh(t.bt, moiTruong(t)), tp = epTp || coThapPhan(t, v), khoa = t.bt.join(' ')
    const ls = [...t.ls.filter((b) => b.join(' ') !== khoa), t.bt].slice(-12)
    return { ...t, kq: v, ans: v, ansTp: tp, dang: tp ? 'tp' : 'ps', loi: '', eng: false, ls, lsI: ls.length - 1 }
  } catch (e) { return { ...t, kq: null, loi: e instanceof LoiTinh ? e.loai : 'toan' } }
}
function bamTinh(t: TrangThai, ma: string, sh: boolean, al: boolean): TrangThai {
  if (t.cho) {
    const b = CHEN[ma]?.a?.[0], cho = t.cho
    t = { ...t, cho: '' }
    if (!b || !(BIEN as readonly string[]).includes(b)) return t
    if (cho === 'rcl') return thucHien({ ...sachBt(t), bt: [b], ct: 1 })
    const r = t.kq != null ? t : thucHien(t)
    return r.kq == null ? r : { ...r, bien: { ...r.bien, [b]: r.kq }, ghi: `→${b}` }
  }
  if (ma === 'sto') return { ...t, cho: sh ? 'rcl' : 'sto' }
  if (ma === 'bang') return thucHien(t, sh)
  if (ma === 'AC') return sachBt(t)
  if (ma === 'mc' && !al) {
    const r = t.kq != null ? t : thucHien(t)
    if (r.kq == null) return r
    try { const m = r.bien.M ?? nguyen(0); return { ...r, bien: { ...r.bien, M: sh ? tru(m, r.kq) : cong(m, r.kq) }, ghi: sh ? 'M−' : 'M+' } } catch { return { ...r, kq: null, loi: 'toan' } }
  }
  if (ma === 'sd' && !al) {
    if (t.kq == null || !hienPs(t.kq)) return t
    return { ...t, dang: sh ? (t.dang === 'hs' ? 'ps' : 'hs') : t.dang === 'tp' ? 'ps' : 'tp' }
  }
  if (ma === 'eng' && !sh && !al) return t.kq == null ? t : { ...t, eng: !t.eng, dang: 'tp' }
  if (ma === 'U' || ma === 'D') {
    if (!t.ls.length) return t
    const i = t.kq == null && !t.loi && !t.bt.length ? t.ls.length - 1 : Math.max(0, Math.min(t.ls.length - 1, t.lsI + (ma === 'U' ? -1 : 1)))
    return { ...t, lsI: i, bt: t.ls[i], ct: t.ls[i].length, kq: null, loi: '' }
  }
  return suaBt(t, ma, sh, al) ?? t
}

// ── MENU: phương trình, hệ, bảng giá trị, thống kê ──
const quayLai = (t: TrangThai): TrangThai => ({ ...t, man: t.viec ? (t.ra.length ? 'ra' : 'nhap') : 'tinh' })
function batDau(t: TrangThai, viec: Viec, bac = 0): TrangThai {
  const chu = ['a', 'b', 'c', 'd', 'e']
  const ten = viec === 'pt' ? chu.slice(0, bac + 1) : viec === 'he' ? Array.from({ length: bac * (bac + 1) }, (_, k) => chu[k % (bac + 1)] + chiSo(Math.floor(k / (bac + 1)) + 1)) : viec === 'bang' ? ['f(x)', 'Bắt đầu', 'Kết thúc', 'Bước'] : []
  return { ...sachBt(t), man: 'nhap', viec, bac, ten, gt: [], i: 0, f: [], ra: [], raI: 0, dang: 'ps' }
}
function tinhRa(t: TrangThai): TrangThai {
  const cach: CachHien = { fix: t.fix, nho: t.nho }, ra: DongRa[] = []
  if (t.viec === 'pt') {
    const ng = giaiDaThuc(t.gt)
    ng.forEach((n, k) => ra.push(bangKhong(n.ao) ? { nhan: ng.length > 1 ? `x${chiSo(k + 1)} =` : 'x =', gt: n.thuc } : { nhan: `x${chiSo(k + 1)} =`, ng: n }))
  } else if (t.viec === 'he') {
    const n = t.bac, kq = giaiHe(Array.from({ length: n }, (_, r) => t.gt.slice(r * (n + 1), (r + 1) * (n + 1))))
    if (typeof kq === 'string') ra.push({ nhan: '', chu: kq === 'vo-nghiem' ? 'Vô nghiệm' : 'Vô số nghiệm' })
    else kq.forEach((v, k) => ra.push({ nhan: `${['x', 'y', 'z', 't'][k]} =`, gt: v }))
  } else if (t.viec === 'bang') {
    const [, dau_, cuoi, buoc] = t.gt
    if (bangKhong(buoc) || soSanh(tru(cuoi, dau_), nguyen(0)) * soSanh(buoc, nguyen(0)) < 0) throw new LoiTinh('toan')
    const so = Math.floor(thuc(chia(tru(cuoi, dau_), buoc)) + 1e-9) + 1
    if (so > 30) throw new LoiTinh('toan')
    for (let k = 0; k < so; k += 1) {
      const x = cong(dau_, nhan(nguyen(k), buoc)), nh = `f(${dinhDang(x, cach)}) =`
      try { ra.push({ nhan: nh, gt: tinh(t.f, { goc: t.goc, ans: t.ans, bien: { ...t.bien, x } }) }) } catch (e) { if (e instanceof LoiTinh && e.loai === 'cu-phap') throw e; ra.push({ nhan: nh, chu: 'Lỗi toán học' }) }
    }
  } else {
    const k = thongKe(t.gt)
    ra.push({ nhan: 'n =', gt: nguyen(k.n) }, { nhan: 'x̄ =', gt: k.tb }, { nhan: 'Σx =', gt: k.tong }, { nhan: 'Σx² =', gt: k.tongBinh }, { nhan: 'σx =', gt: k.sigma })
    if (k.s != null) ra.push({ nhan: 'sx =', gt: k.s })
    ra.push({ nhan: 'min =', gt: k.min }, { nhan: 'Med =', gt: k.trungVi }, { nhan: 'max =', gt: k.max })
  }
  return { ...sachBt(t), man: 'ra', ra, raI: 0, dang: 'ps' }
}
function bamNhap(t: TrangThai, ma: string, sh: boolean, al: boolean): TrangThai {
  if (ma === 'AC') return t.bt.length || t.loi ? sachBt(t) : batDau(t, t.viec, t.bac)
  if (ma === 'U') return t.viec === 'tk' ? (t.gt.length ? { ...sachBt(t), gt: t.gt.slice(0, -1) } : t) : { ...sachBt(t), i: Math.max(0, t.i - 1), gt: t.gt.slice(0, Math.max(0, t.i - 1)) }
  if (ma !== 'bang') return suaBt(t, ma, sh, al) ?? t
  try {
    if (t.viec === 'tk') {
      if (!t.bt.length) return t.gt.length ? tinhRa(t) : t
      if (t.gt.length >= 80) throw new LoiTinh('toan')
      return { ...sachBt(t), gt: [...t.gt, tinh(t.bt, moiTruong(t))] }
    }
    if (!t.bt.length) return t
    const sau = t.viec === 'bang' && t.i === 0 ? { ...sachBt(t), f: t.bt, gt: [nguyen(0)], i: 1 } : { ...sachBt(t), gt: [...t.gt.slice(0, t.i), tinh(t.bt, moiTruong(t))], i: t.i + 1 }
    return sau.i >= sau.ten.length ? tinhRa(sau) : sau
  } catch (e) { return { ...t, kq: null, loi: e instanceof LoiTinh ? e.loai : 'toan' } }
}
function bamRa(t: TrangThai, ma: string, sh: boolean): TrangThai {
  const n = t.ra.length
  if (ma === 'AC') return batDau(t, t.viec, t.bac)
  if (ma === 'bang' || ma === 'D' || ma === 'R') return { ...t, raI: (t.raI + 1) % n }
  if (ma === 'U' || ma === 'L') return { ...t, raI: (t.raI + n - 1) % n }
  if (ma === 'sd') return { ...t, dang: sh ? (t.dang === 'hs' ? 'ps' : 'hs') : t.dang === 'tp' ? 'ps' : 'tp' }
  return t
}
function bamMenu(t: TrangThai, ma: string): TrangThai {
  if (ma === 'AC') return t.man === 'pt-bac' || t.man === 'he-an' || t.man === 'fix' ? { ...t, man: t.man === 'fix' ? 'cd' : 'menu' } : quayLai(t)
  if (t.man === 'menu') {
    if (ma === '1') return { ...sachBt(t), man: 'tinh', viec: '', ra: [] }
    if (ma === '2') return { ...t, man: 'pt-bac' }
    if (ma === '3') return { ...t, man: 'he-an' }
    if (ma === '4') return batDau(t, 'bang')
    if (ma === '5') return batDau(t, 'tk')
    if (ma === '6') return { ...t, man: 'cd' }
  } else if (t.man === 'pt-bac' || t.man === 'he-an') {
    if (ma === '2' || ma === '3' || ma === '4') return batDau(t, t.man === 'pt-bac' ? 'pt' : 'he', +ma)
  } else if (t.man === 'cd') {
    if (ma === '1' || ma === '2') return quayLai({ ...t, goc: ma === '1' ? 'D' : 'R' })
    if (ma === '3') return { ...t, man: 'fix' }
    if (ma === '4') return quayLai({ ...t, fix: -1 })
    if (ma === '5' || ma === '6') return quayLai({ ...t, nho: ma === '5' ? 2 : 1 })
  } else if (/^\d$/.test(ma)) return quayLai({ ...t, man: 'cd', fix: +ma })
  return t
}

/** MỘT LẦN BẤM PHÍM. `ma`: mã phím trong PHIM_HAM / PHIM_SO, hoặc SHIFT · ALPHA · MENU · ON · L R U D (nút điều hướng). */
export function bam(truoc: TrangThai, ma: string): TrangThai {
  if (ma === 'SHIFT') return { ...truoc, sh: !truoc.sh, al: false }
  if (ma === 'ALPHA') return { ...truoc, al: !truoc.al, sh: false }
  const { sh, al } = truoc, t: TrangThai = { ...truoc, sh: false, al: false, ghi: '' }
  if (ma === 'ON') return { ...taoMay(), goc: t.goc, fix: t.fix, nho: t.nho, bien: t.bien, ans: t.ans, ansTp: t.ansTp }
  if (ma === 'MENU') return { ...t, man: 'menu', cho: '' }
  if (t.man === 'tinh') return bamTinh(t, ma, sh, al)
  if (t.man === 'nhap') return bamNhap(t, ma, sh, al)
  if (t.man === 'ra') return bamRa(t, ma, sh)
  return bamMenu(t, ma)
}

// ── MÀN HÌNH ──
export interface ManHinh {
  /** đèn báo hàng trên: S, A, STO, D / R, FIX2, M, tên việc… */ den: string[]
  /** góc phải hàng trên («Ans = 0,25», «2/3») */ phai: string
  kieu: 'tinh' | 'ds'
  /** nhãn trước dòng biểu thức («a =», «x₁ =») */ nhan: string
  bt: string[]; /** −1 = không hiện con trỏ */ ct: number
  kq: Hien | null; loi: '' | LoaiLoi
  /** màn danh sách: tiêu đề + các dòng */ tieuDe: string; ds: string[]
}
const TEN_VIEC: Record<Viec, string> = { '': '', pt: 'PT', he: 'HỆ', bang: 'BẢNG', tk: 'TK' }
const DANG_PT = ['', '', 'ax²+bx+c=0', 'ax³+bx²+cx+d=0', 'ax⁴+bx³+cx²+dx+e=0']
function chuPhuc(n: Nghiem, c: CachHien): string {
  const ao = dinhDang(n.ao, c), i = ao === '1' ? 'i' : `${ao}i`
  return bangKhong(n.thuc) ? `${n.am ? '-' : ''}${i}` : `${dinhDang(n.thuc, c)} ${n.am ? '−' : '+'} ${i}`
}
export function manHinh(t: TrangThai): ManHinh {
  const c: CachHien = { fix: t.fix, nho: t.nho, eng: t.eng }
  const den = [t.sh ? 'S' : '', t.al ? 'A' : '', t.cho === 'sto' ? 'STO' : t.cho === 'rcl' ? 'RCL' : '', t.goc, t.fix >= 0 ? `FIX${t.fix}` : '', t.bien.M && !bangKhong(t.bien.M) ? 'M' : '', t.man === 'nhap' || t.man === 'ra' ? TEN_VIEC[t.viec] : '', t.ghi].filter(Boolean)
  const nen: ManHinh = { den, phai: '', kieu: 'tinh', nhan: '', bt: [], ct: -1, kq: null, loi: '', tieuDe: '', ds: [] }
  if (t.man === 'menu') return { ...nen, kieu: 'ds', tieuDe: 'MENU', ds: ['1 Tính toán', '2 Phương trình', '3 Hệ phương trình', '4 Bảng giá trị', '5 Thống kê', '6 Cài đặt'] }
  if (t.man === 'pt-bac') return { ...nen, kieu: 'ds', tieuDe: 'Phương trình bậc mấy?', ds: ['2 Bậc hai', '3 Bậc ba', '4 Bậc bốn'] }
  if (t.man === 'he-an') return { ...nen, kieu: 'ds', tieuDe: 'Hệ mấy ẩn?', ds: ['2 Hai ẩn', '3 Ba ẩn', '4 Bốn ẩn'] }
  if (t.man === 'cd') return { ...nen, kieu: 'ds', tieuDe: 'Cài đặt', ds: ['1 Độ (D)', '2 Radian (R)', '3 Làm tròn Fix', '4 Bỏ làm tròn', '5 Hiện 0,005', '6 Hiện 5×10⁻³'] }
  if (t.man === 'fix') return { ...nen, kieu: 'ds', tieuDe: 'Giữ mấy chữ số thập phân?', ds: ['Bấm một phím 0 – 9'] }
  if (t.man === 'ra') {
    const d = t.ra[t.raI]
    return { ...nen, phai: `${t.raI + 1}/${t.ra.length}`, nhan: d.nhan, kq: d.gt != null ? hienSo(d.gt, t.dang, c) : { kieu: 'so', chu: d.ng ? chuPhuc(d.ng, c) : d.chu ?? '' } }
  }
  const nhan_ = t.man !== 'nhap' ? '' : t.viec === 'tk' ? `x${chiSo(t.gt.length + 1)} =` : `${t.ten[t.i]} =`
  const phai = t.man === 'nhap' ? (t.viec === 'pt' ? DANG_PT[t.bac] : t.viec === 'tk' ? `n = ${t.gt.length}` : t.viec === 'he' ? `${t.bac} ẩn` : '') : (() => { const a = dinhDang(t.ans, { fix: t.fix, nho: t.nho }); return a.length <= 12 ? `Ans = ${a}` : '' })()
  return { ...nen, phai, nhan: nhan_, bt: t.bt, ct: t.kq != null || t.loi ? -1 : t.ct, kq: t.kq != null ? hienSo(t.kq, t.dang, c) : null, loi: t.loi }
}
/** Đổi số của máy ra chuỗi (cho test và lời mô tả). */
export const chuKq = (h: Hien | null): string => (!h ? '' : h.kieu === 'so' ? h.chu : `${h.am ? '-' : ''}${h.nguyen ? h.nguyen + ' ' : ''}${h.tu}/${h.mau}`)
