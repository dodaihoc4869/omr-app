// ĐỒNG PHÂN THEO CÁCH CỦA THẦY (thầy 08/11 «từ giờ phần đồng phân phải qua skill này»: docs/skill-dong-phan-thay/SKILL.md) — LÕI THUẦN, không IO.
// Máy chủ + máy soạn dùng để TÍNH LẠI mọi con số của khối `dongPhan` trong Lời giải Kính; app dùng để vẽ cảnh + bàn «tự đặt».
//   Bước 1: K = (2C + 2 + N − H − X) / 2.
//   Bước 2: mạch đại số — mỗi khung carbon (mạch chính + nhánh thẳng) + các thứ cắm lên (răng giả / nối đôi / nối ba / nhóm CO / O chen giữa).
//   Mỗi tổ hợp vị trí: «thừa hoá trị» (C quá 4 gạch, enol, hai OH một C…) · «trùng» (đối xứng dịch ra là giống nhau) · «mới».
//   Hình học: nối đôi có MỖI đầu gắn hai nhóm khác nhau ⇒ cộng thêm 1 (luật thầy). Phần cố định (ester, amine, arene): bảng chia C × quy tắc nhân.
import type { BangDP, DatDP, DongPhanKinh, KhungDP, MachDP } from './kieu'

type Obj = Record<string, unknown>
const laObj = (x: unknown): x is Obj => x !== null && typeof x === 'object' && !Array.isArray(x)
const mang = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const s = (v: unknown, tran = 200): string => (typeof v === 'string' || typeof v === 'number' ? String(v).normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, tran) : '')
const nguyen = (v: unknown, a: number, b: number): number | null => (Number.isInteger(v) && Number(v) >= a && Number(v) <= b ? Number(v) : null)

export const DAT_DP: readonly DatDP[] = ['nhom', 'oh', 'doi', 'ba', 'xeton', 'chen']
const DAT_NGUYEN_TU: ReadonlySet<DatDP> = new Set(['nhom', 'oh', 'xeton'])
export const laDatNguyenTu = (d: DatDP) => DAT_NGUYEN_TU.has(d)

// ---------------------------------------------------------------- K
export function tinhK(n: { C: number; H: number; N?: number; X?: number }): number {
  return (2 * n.C + 2 + (n.N ?? 0) - n.H - (n.X ?? 0)) / 2
}

// ---------------------------------------------------------------- khung
export interface KhungDung {
  /** cha[i] = nguyên tử cha (−1: C1 mạch chính); 0..chinh−1 là mạch chính, sau đó lần lượt từng nhánh (gần mạch chính trước) */
  cha: number[]
  chinh: number
  /** nhãn từng nguyên tử: «C3» (mạch chính) · «nhánh C2» */
  ten: string[]
  /** nhánh: chỉ số nguyên tử trong mạch chính mà nhánh gắn vào, và danh sách nguyên tử của nhánh */
  nhanh: { o: number; nguyenTu: number[] }[]
}
export function dungKhung(k: KhungDP): KhungDung | null {
  const chinh = nguyen(k.chinh, 1, 12)
  if (!chinh) return null
  const cha: number[] = [], ten: string[] = []
  for (let i = 0; i < chinh; i++) { cha.push(i - 1); ten.push(`C${i + 1}`) }
  const nhanh: KhungDung['nhanh'] = []
  for (const n of mang(k.nhanh)) {
    if (!laObj(n)) return null
    const o = nguyen(n.o, 1, chinh), dai = nguyen(n.dai, 1, 5)
    if (!o || !dai) return null
    const ds: number[] = []
    for (let j = 0; j < dai; j++) { ds.push(cha.length); cha.push(j === 0 ? o - 1 : cha.length - 1); ten.push(`nhánh C${o}`) }
    nhanh.push({ o: o - 1, nguyenTu: ds })
  }
  if (cha.length > 14) return null
  const bac = new Array(cha.length).fill(0)
  cha.forEach((c, i) => { if (c >= 0) { bac[c]++; bac[i]++ } })
  if (bac.some((b) => b > 4)) return null
  return { cha, chinh, ten, nhanh }
}
const keCua = (cha: readonly number[]) => {
  const ke: number[][] = cha.map(() => [])
  cha.forEach((c, i) => { if (c >= 0) { ke[c]!.push(i); ke[i]!.push(c) } })
  return ke
}

/** Mạch dài nhất (số C) của cây — thầy: mạch chính phải là mạch dài nhất. */
export function machDaiNhat(cha: readonly number[]): number {
  const ke = keCua(cha)
  const xa = (goc: number) => {
    const d = new Array(cha.length).fill(-1); d[goc] = 0
    const hang = [goc]
    for (let i = 0; i < hang.length; i++) for (const v of ke[hang[i]!]!) if (d[v] < 0) { d[v] = d[hang[i]!] + 1; hang.push(v) }
    let m = goc
    d.forEach((x, i) => { if (x > d[m]) m = i })
    return { m, d: d[m] as number }
  }
  return xa(xa(0).m).d + 1
}

// ---------------------------------------------------------------- dạng chuẩn của cây có nhãn (để biết hai chất có trùng không)
function dangChuan(nhan: readonly string[], ke: readonly (readonly number[])[]): string {
  const n = nhan.length
  if (n === 1) return nhan[0]!
  // tâm cây: tỉa lá dần
  const bac = ke.map((k) => k.length), con = new Set<number>(nhan.map((_, i) => i))
  let la = [...con].filter((i) => bac[i]! <= 1)
  while (con.size > 2) {
    const moi: number[] = []
    for (const l of la) { con.delete(l); for (const v of ke[l]!) if (con.has(v) && --bac[v]! === 1) moi.push(v) }
    la = moi
  }
  const ma = (u: number, p: number): string => nhan[u]! + '(' + ke[u]!.filter((v) => v !== p).map((v) => ma(v, u)).sort().join(',') + ')'
  return [...con].map((c) => ma(c, -1)).sort()[0]!
}
export const dangChuanKhung = (cha: readonly number[]) => dangChuan(cha.map(() => 'C'), keCua(cha))

// ---------------------------------------------------------------- vị trí + tổ hợp
export type ViTriDP = { loai: 'c'; a: number } | { loai: 'lk'; a: number; b: number }
export function viTriCua(kd: KhungDung, dat: DatDP): ViTriDP[] {
  if (laDatNguyenTu(dat)) return kd.cha.map((_, a) => ({ loai: 'c' as const, a }))
  return kd.cha.flatMap((c, b) => (c >= 0 ? [{ loai: 'lk' as const, a: c, b }] : []))
}

export type KetToHop = 'moi' | 'trung' | 'thua' | 'loai'
export interface ToHopDP {
  /** chỉ số 1.. theo thứ tự liệt kê (máy soạn dùng cho `chon`) */
  so: number
  viTri: ViTriDP[]
  ket: KetToHop
  /** thừa: vì sao không điền được · trùng: trùng tổ hợp số mấy */
  ly?: string
  trungVoi?: number
  /** chất thứ mấy (1..) khi `moi` */
  chat?: number
  /** công thức thu gọn kiểu SGK (khi hợp lệ) */
  gon?: string
  /** số nối đôi đủ điều kiện hình học của chất (khi hợp lệ) */
  hinhHoc?: number
  /** chi tiết hai đầu của từng nối đôi (cho cảnh hình học) */
  dau?: { trai: [string, string]; phai: [string, string]; co: boolean }[]
  dangChuan?: string
}

const NGUOC: Record<string, string> = { OH: 'HO', CHO: 'OHC', COOH: 'HOOC', NH2: 'H2N', NO2: 'O2N', CN: 'NC', COOCH3: 'CH3OOC', OCH3: 'CH3O' }
const nguocNhan = (t: string) => NGUOC[t] ?? t
const KY_LK: Record<string, string> = { doi: '=', ba: '≡' }
/** gom răng giả giống nhau: Cl, Cl ⇒ «Cl2»; OH, OH ⇒ «(OH)2» */
function gomThe(ds: readonly string[]): string {
  const dem = new Map<string, number>()
  for (const t of ds) dem.set(t, (dem.get(t) ?? 0) + 1)
  return [...dem].map(([t, r]) => (/^(F|Cl|Br|I)$/.test(t) ? t + (r > 1 ? r : '') : `(${t})${r > 1 ? r : ''}`)).join('')
}

interface DungToHop { ok: true; nhan: string[]; ke: number[][]; gon: string; hinhHoc: number; dau: NonNullable<ToHopDP['dau']> }
/** Dựng chất từ khung + các thứ cắm; trả lý do khi thừa hoá trị. */
function dungChat(kd: KhungDung, dat: readonly { loai: DatDP; nhan: string }[], viTri: readonly ViTriDP[]): DungToHop | { ok: false; ly: string } {
  const n = kd.cha.length, ke = keCua(kd.cha)
  const H = ke.map((k) => 4 - k.length)
  const pi = new Array(n).fill(0), oh = new Array(n).fill(0), xeton = new Array(n).fill(false)
  const the: string[][] = kd.cha.map(() => [])
  const canh = new Map<string, { loai: DatDP; nhan: string }>()
  const khoa = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  for (let i = 0; i < dat.length; i++) {
    const d = dat[i]!, v = viTri[i]!
    if (v.loai === 'c') {
      if (d.loai === 'xeton') {
        if (ke[v.a]!.length < 2) return { ok: false, ly: 'nhóm CO ở đầu mạch thì một đầu là H ⇒ thành anđehit, chứ không phải xeton' }
        H[v.a] -= 2; xeton[v.a] = true
      } else {
        if (d.loai === 'oh') { if (oh[v.a]) return { ok: false, ly: 'hai OH trên một C — không bền, không tính' }; oh[v.a]++ }
        H[v.a]--; the[v.a]!.push(d.nhan)
      }
    } else {
      const k = khoa(v.a, v.b)
      if (canh.has(k)) return { ok: false, ly: 'hai thứ cùng chen vào một liên kết' }
      canh.set(k, d)
      if (d.loai === 'doi') { H[v.a]--; H[v.b]--; pi[v.a]++; pi[v.b]++ }
      if (d.loai === 'ba') { H[v.a] -= 2; H[v.b] -= 2; pi[v.a] += 2; pi[v.b] += 2 }
    }
  }
  if (H.some((h) => h < 0)) return { ok: false, ly: 'C quá 4 gạch — không điền được' }
  for (let a = 0; a < n; a++) {
    if (oh[a] && (pi[a] || xeton[a])) return { ok: false, ly: 'OH chỉ cắm vào C no — OH gắn C nối đôi (enol) không tính' }
    if (xeton[a] && pi[a]) return { ok: false, ly: 'C của nhóm CO không mang thêm nối đôi' }
  }
  // cây có nhãn: C (+ số nhánh không cần), liên kết đặc biệt thành nút chen giữa, răng giả thành lá
  const nhan: string[] = kd.cha.map((_, a) => (xeton[a] ? 'C=O' : 'C'))
  const ke2: number[][] = kd.cha.map(() => [])
  const noi = (a: number, b: number) => { ke2[a]!.push(b); ke2[b]!.push(a) }
  kd.cha.forEach((c, b) => {
    if (c < 0) return
    const d = canh.get(khoa(c, b))
    if (!d) return noi(c, b)
    const m = nhan.length; nhan.push(d.loai === 'chen' ? `-${d.nhan}-` : KY_LK[d.loai]!); ke2.push([]); noi(c, m); noi(m, b)
  })
  the.forEach((ds, a) => ds.forEach((t) => { const m = nhan.length; nhan.push(t); ke2.push([]); noi(a, m) }))
  // công thức thu gọn: đi theo mạch chính, nhánh trong ngoặc
  function chuC(u: number): string { if (u >= n) return nhan[u]!; const h = H[u]!; return xeton[u] ? 'CO' : `C${h ? 'H' + (h > 1 ? h : '') : ''}` }
  function lk(u: number, v: number): string { // u, v có thể có nút chen giữa
    const d = u < n && v < n ? canh.get(khoa(u, v)) : undefined
    return d ? (d.loai === 'chen' ? `-${d.nhan}-` : KY_LK[d.loai]!) : '-'
  }
  function gonNhanh(v: number, tu: number): string {
    // v là nút kề của tu (không phải nút '=' của chính nối đôi đang xét): nhóm thế lá hoặc carbon / nút chen
    if (v >= n) {
      const ky = nhan[v]!
      if (ky === '=' || ky === '≡') { const sau = ke2[v]!.find((x) => x !== tu)!; return ky + gonNhanh(sau, v) }
      if (ky.startsWith('-')) { const sau = ke2[v]!.find((x) => x !== tu)!; return ky.slice(1) + gonNhanh(sau, v) }
      return ky
    }
    return viet(v, tu)
  }
  function viet(u: number, tu: number): string {
    // carbon u, đi tiếp các nhánh không quay về tu (trên cây C gốc)
    const conC = ke[u]!.filter((v) => v !== tu)
    const theU = the[u]!
    let chu = chuC(u)
    if (!conC.length && theU.length === 1) return chu + '-' + theU[0]
    chu += gomThe(theU)
    if (!conC.length) return chu
    const tiep = conC[conC.length - 1]!
    for (const v of conC.slice(0, -1)) chu += `(${lkNhanh(u, v)}${viet(v, u)})`
    return chu + lk(u, tiep) + viet(tiep, u)
  }
  function lkNhanh(u: number, v: number): string { const x = lk(u, v); return x === '-' ? '' : x.startsWith('-') ? x.slice(1) : x }
  function vietMach(): string {
    const parts: string[] = []
    for (let i = 0; i < kd.chinh; i++) {
      const u = i
      const conNhanh = ke[u]!.filter((v) => v >= kd.chinh)
      let chu = chuC(u)
      const theU = the[u]!
      if (i === 0 && theU.length === 1 && kd.chinh > 1) chu = nguocNhan(theU[0]!) + '-' + chu
      else if (i === kd.chinh - 1 && theU.length === 1 && kd.chinh > 1 && !conNhanh.length) chu = chu + '-' + theU[0]
      else if (kd.chinh === 1 && theU.length === 1 && !conNhanh.length) chu = chu + '-' + theU[0]
      else chu += gomThe(theU)
      for (const v of conNhanh) chu += `(${lkNhanh(u, v)}${viet(v, u)})`
      parts.push(chu)
      if (i < kd.chinh - 1) parts.push(lk(i, i + 1))
    }
    return parts.join('')
  }
  // hình học: mỗi đầu nối đôi — hai nhóm còn lại (H tính là một nhóm) phải khác nhau
  const ma = (u: number, p: number): string => nhan[u]! + '(' + ke2[u]!.filter((v) => v !== p).map((v) => ma(v, u)).sort().join(',') + ')'
  const dau: NonNullable<ToHopDP['dau']> = []
  let hinhHoc = 0
  for (const [k, d] of canh) {
    if (d.loai !== 'doi') continue
    const [a, b] = k.split('-').map(Number) as [number, number]
    const giua = ke2[a]!.find((v) => nhan[v] === '=' && ke2[v]!.includes(b))!
    const nhom = (x: number) => {
      const ds = ke2[x]!.filter((v) => v !== giua).map((v) => ({ ma: ma(v, x), chu: gonNhanh(v, x) }))
      for (let h = 0; h < H[x]!; h++) ds.push({ ma: 'H', chu: 'H' })
      return ds
    }
    const ta = nhom(a), tb = nhom(b)
    if (ta.length !== 2 || tb.length !== 2) continue
    const co = ta[0]!.ma !== ta[1]!.ma && tb[0]!.ma !== tb[1]!.ma
    if (co) hinhHoc++
    dau.push({ trai: [ta[0]!.chu, ta[1]!.chu], phai: [tb[0]!.chu, tb[1]!.chu], co })
  }
  return { ok: true, nhan, ke: ke2, gon: vietMach(), hinhHoc, dau }
}

/** Liệt kê mọi tổ hợp vị trí của một mạch (theo thứ tự) và phân loại; `chon` lọc theo điều kiện đề. */
export function lietKeMach(m: Pick<MachDP, 'khung' | 'dat' | 'chon'>): { kd: KhungDung; toHop: ToHopDP[]; soChat: number; hinhHoc: number } | null {
  const kd = dungKhung(m.khung)
  if (!kd || !m.dat.length || m.dat.length > 2) return null
  const vt = m.dat.map((d) => viTriCua(kd, d.loai))
  const ds: ViTriDP[][] = []
  if (m.dat.length === 1) for (const v of vt[0]!) ds.push([v])
  else {
    const cung = m.dat[0]!.loai === m.dat[1]!.loai && m.dat[0]!.nhan === m.dat[1]!.nhan
    vt[0]!.forEach((v, i) => vt[1]!.forEach((w, j) => {
      if (cung && (laDatNguyenTu(m.dat[0]!.loai) ? j < i : j <= i)) return
      ds.push([v, w])
    }))
  }
  if (ds.length > 400) return null
  const chon = m.chon && m.chon.length ? new Set(m.chon) : null
  const da = new Map<string, number>()
  let soChat = 0, hinhHoc = 0
  const toHop: ToHopDP[] = ds.map((viTri, i) => {
    const so = i + 1
    const c = dungChat(kd, m.dat, viTri)
    if (!c.ok) return { so, viTri, ket: 'thua', ly: c.ly }
    const dc = dangChuan(c.nhan, c.ke)
    const chung = { gon: c.gon, hinhHoc: c.hinhHoc, dau: c.dau, dangChuan: dc }
    if (chon && !chon.has(so)) return { so, viTri, ket: 'loai', ...chung }
    const truoc = da.get(dc)
    if (truoc) return { so, viTri, ket: 'trung', trungVoi: truoc, ...chung }
    da.set(dc, so); soChat++; hinhHoc += c.hinhHoc
    return { so, viTri, ket: 'moi', chat: soChat, ...chung }
  })
  return { kd, toHop, soChat, hinhHoc }
}

/** Thử một tổ hợp bất kỳ (bàn «tự đặt»): trả kết quả so với các chất đã có. */
export function thuToHop(m: Pick<MachDP, 'khung' | 'dat'>, viTri: ViTriDP[]): { ok: false; ly: string } | { ok: true; dangChuan: string; gon: string } {
  const kd = dungKhung(m.khung)
  if (!kd) return { ok: false, ly: 'khung hỏng' }
  const c = dungChat(kd, m.dat, viTri)
  if (!c.ok) return c
  return { ok: true, dangChuan: dangChuan(c.nhan, c.ke), gon: c.gon }
}

// ---------------------------------------------------------------- mọi khung carbon n nguyên tử (để biết có quên mạch đại số nào)
const KHUNG_NHO = new Map<number, number[][]>()
export function moiKhung(n: number): number[][] {
  if (n < 1 || n > 9) return []
  const co = KHUNG_NHO.get(n)
  if (co) return co
  let lop: number[][] = [[-1]]
  for (let k = 2; k <= n; k++) {
    const moi = new Map<string, number[]>()
    for (const cha of lop) {
      const bac = new Array(cha.length).fill(0)
      cha.forEach((c, i) => { if (c >= 0) { bac[c]++; bac[i]++ } })
      for (let a = 0; a < cha.length; a++) if (bac[a] < 4) { const x = [...cha, a]; const d = dangChuanKhung(x); if (!moi.has(d)) moi.set(d, x) }
    }
    lop = [...moi.values()]
  }
  KHUNG_NHO.set(n, lop)
  return lop
}

// ---------------------------------------------------------------- phần cố định: số gốc no C_nH_2n+1 (n = 0 là H)
export const SO_GOC = [1, 1, 1, 2, 4, 8, 17] as const
const toHopLap = (g: number, r: number) => { let t = 1; for (let i = 0; i < r; i++) t = (t * (g + i)) / (i + 1); return Math.round(t) }
const tich = (a: readonly number[]) => a.reduce((x, y) => x * y, 1)

/** Kiểm một dòng bảng; trả lỗi hoặc null. */
function kiemHang(loai: BangDP['loai'], h: BangDP['hang'][number]): string | null {
  if (loai === 'khac') return h.tich === tich(h.soCach) ? null : `dòng ${h.phan.join('–')}: tích ${tich(h.soCach)} chứ không phải ${h.tich}`
  if (h.ghi) return h.tich === tich(h.soCach) || loai === 'aren' ? null : `dòng ${h.phan.join('–')}: tích sai`
  const g = h.phan.map((c) => SO_GOC[c])
  if (g.some((x) => x === undefined)) return null // gốc dài quá bảng: không kiểm
  if (loai === 'este') {
    if (h.phan.length !== 2 || h.phan[1]! < 1) return 'dòng ester phải có R (được là H) và R′ (không là H)'
    if (h.soCach[0] !== g[0] || h.soCach[1] !== g[1]) return `dòng ${h.phan.join('–')}: số gốc phải là ${g.join(' × ')}`
    return h.tich === g[0]! * g[1]! ? null : `dòng ${h.phan.join('–')}: ${g.join(' × ')} = ${g[0]! * g[1]!}`
  }
  // amine / arene: gốc cùng số C đổi chỗ không nhân thêm
  const dem = new Map<number, number>()
  for (const c of h.phan) dem.set(c, (dem.get(c) ?? 0) + 1)
  if (h.soCach.some((x, i) => x !== g[i])) return `dòng ${h.phan.join('–')}: số gốc phải là ${g.join(', ')}`
  let t = 1
  for (const [c, r] of dem) t *= toHopLap(SO_GOC[c]!, r)
  if (loai === 'aren') {
    const nh = h.phan.length, lap = [...dem.values()]
    if (nh === 2) t *= 3
    if (nh === 3) { if ([...dem.keys()].some((c) => SO_GOC[c]! > 1)) return null; t = lap.length === 1 ? 3 : lap.length === 2 ? 6 : 10 }
  }
  return h.tich === t ? null : `dòng ${h.phan.join('–')}: phải ra ${t}`
}

// ---------------------------------------------------------------- đọc + kiểm khối dongPhan
export interface KetDongPhan {
  dp: DongPhanKinh | null
  /** lỗi khuôn / lỗi số (máy chủ: đánh lệch để máy soạn sửa) */
  loi: string | null
}
export function docDongPhan(x: unknown): KetDongPhan {
  const hong = (loi: string): KetDongPhan => ({ dp: null, loi })
  if (!laObj(x)) return hong('dongPhan không phải đối tượng')
  const ctpt = s(x.ctpt, 30)
  const nt = laObj(x.nguyenTu) ? x.nguyenTu : {}
  const C = nguyen(nt.C, 1, 40), H = nguyen(nt.H, 0, 90)
  const N = nt.N === undefined ? 0 : nguyen(nt.N, 0, 6), X = nt.X === undefined ? 0 : nguyen(nt.X, 0, 6), O = nt.O === undefined ? 0 : nguyen(nt.O, 0, 12)
  if (!ctpt || C === null || H === null || N === null || X === null || O === null) return hong('thiếu công thức phân tử / số nguyên tử')
  const nguyenTu = { C, H, ...(N ? { N } : {}), ...(X ? { X } : {}), ...(O ? { O } : {}) }
  const K = tinhK(nguyenTu)
  if (!Number.isInteger(K) || K < 0) return hong(`K = ${K} không phải số nguyên không âm — kiểm lại công thức`)
  if (Number(x.K) !== K) return hong(`K = (2·${C} + 2${N ? ` + ${N}` : ''} − ${H}${X ? ` − ${X}` : ''}) / 2 = ${K} chứ không phải ${s(x.K, 6)}`)
  const hoi = x.hoi === 'dong-phan' ? 'dong-phan' : x.hoi === 'cau-tao' ? 'cau-tao' : null
  if (!hoi) return hong('thiếu hoi: cau-tao (chỉ đếm cấu tạo) | dong-phan (tính cả hình học)')
  // mạch đại số
  const mach: MachDP[] = []
  let tongMach = 0, tongHH = 0
  const khungDa = new Map<string, string>()
  for (const [i, mt] of mang(x.mach).entries()) {
    if (!laObj(mt)) return hong(`mạch ${i + 1} hỏng`)
    const so = s(mt.so, 20).replace(/\s/g, '')
    const k = laObj(mt.khung) ? mt.khung : {}
    const khung: KhungDP = { chinh: Number(k.chinh), nhanh: mang(k.nhanh).map((n) => (laObj(n) ? { o: Number(n.o), dai: Number(n.dai) } : { o: 0, dai: 0 })) }
    const dat = mang(mt.dat).map((d) => (laObj(d) && (DAT_DP as readonly string[]).includes(String(d.loai)) ? { loai: d.loai as DatDP, nhan: s(d.nhan, 12) || (d.loai === 'doi' ? 'C=C' : d.loai === 'ba' ? 'C≡C' : d.loai === 'xeton' ? 'CO' : '') } : null))
    if (!dat.length || dat.length > 2 || dat.some((d) => !d || !d.nhan)) return hong(`mạch ${so || i + 1}: dat phải có 1–2 thứ cắm (nhom/oh/doi/ba/xeton/chen + nhan)`)
    const chon = mt.chon === undefined ? undefined : mang(mt.chon).map(Number).filter((v) => Number.isInteger(v) && v > 0)
    const m: MachDP = { so, khung, dat: dat as MachDP['dat'], ...(chon && chon.length ? { chon } : {}), ...(s(mt.loc, 140) ? { loc: s(mt.loc, 140) } : {}), soChat: Number(mt.soChat) }
    const kd = dungKhung(khung)
    if (!kd) return hong(`mạch ${so || i + 1}: khung hỏng (chinh 1–12, nhánh o trong mạch chính, C ≤ 4 liên kết)`)
    // phép tính mạch đại số = mạch chính + các nhánh, mạch chính là mạch dài nhất
    const phan = so.split('+').map(Number)
    const nhanhDai = kd.nhanh.map((n) => n.nguyenTu.length).sort((a, b) => b - a)
    if (phan.some((v) => !Number.isInteger(v) || v < 1) || phan[0] !== kd.chinh || phan.slice(1).sort((a, b) => b - a).join('+') !== nhanhDai.join('+')) return hong(`mạch ${so}: phép tính phải là ${[kd.chinh, ...nhanhDai].join('+')}`)
    if (machDaiNhat(kd.cha) !== kd.chinh) return hong(`mạch ${so}: nhánh dài bằng hoặc hơn phần mạch chính còn lại — mạch chính chưa phải mạch dài nhất`)
    const kq = lietKeMach(m)
    if (!kq) return hong(`mạch ${so}: quá nhiều tổ hợp hoặc thứ cắm hỏng`)
    if (m.chon && m.chon.some((c) => kq.toHop[c - 1]?.ket === 'thua' || !kq.toHop[c - 1])) return hong(`mạch ${so}: chon có tổ hợp thừa hoá trị / không có`)
    if (m.soChat !== kq.soChat) return hong(`mạch ${so}: đếm lại được ${kq.soChat} chất chứ không phải ${s(mt.soChat, 6)}`)
    const kyDat = m.dat.map((d) => `${d.loai}:${d.nhan}`).join('|')
    const dc = dangChuanKhung(kd.cha) + '#' + kyDat + '#' + (m.loc ?? '')
    if (khungDa.has(dc)) return hong(`mạch ${so}: trùng khung với mạch ${khungDa.get(dc)}`)
    khungDa.set(dc, so)
    mach.push(m); tongMach += kq.soChat; tongHH += kq.hinhHoc
  }
  if (mach.length > 12) return hong('quá 12 khung')
  // quên mạch: mỗi nhóm (cùng số C, cùng thứ cắm, không lọc) phải đủ mọi khung còn điền được
  const nhom = new Map<string, MachDP[]>()
  for (const m of mach) { if (m.chon) continue; const kd = dungKhung(m.khung)!; const ky = `${kd.cha.length}#${m.dat.map((d) => `${d.loai}:${d.nhan}`).join('|')}`; nhom.set(ky, [...(nhom.get(ky) ?? []), m]) }
  for (const [ky, ds] of nhom) {
    const n = Number(ky.split('#')[0])
    const co = new Set(ds.map((m) => dangChuanKhung(dungKhung(m.khung)!.cha)))
    for (const cha of moiKhung(n)) {
      if (co.has(dangChuanKhung(cha))) continue
      // khung này còn điền được chất nào không? (vd 3+1+1 với nối đôi: không điền được ⇒ được bỏ)
      const thu = khungTuCha(cha)
      const kq = thu && lietKeMach({ khung: thu, dat: ds[0]!.dat })
      if (kq && kq.soChat > 0) return hong(`quên mạch ${[thu!.chinh, ...thu!.nhanh.map((h) => h.dai).sort((a, b) => b - a)].join('+')} (còn ${kq.soChat} chất)`)
    }
  }
  // bảng phần cố định
  let bang: BangDP | undefined, tongBang = 0
  if (x.bang !== undefined && x.bang !== null) {
    const b = laObj(x.bang) ? x.bang : {}
    const loai = (['este', 'amin', 'aren', 'khac'] as const).find((l) => l === b.loai)
    const hang = mang(b.hang).map((h) => (laObj(h) ? { phan: mang(h.phan).map(Number), soCach: mang(h.soCach).map(Number), tich: Number(h.tich), ...(s(h.ghi, 100) ? { ghi: s(h.ghi, 100) } : {}) } : null))
    const cot = mang(b.cot).map((c) => s(c, 40)).filter(Boolean).slice(0, 4)
    if (!loai || !hang.length || hang.length > 10 || hang.some((h) => !h || !h.soCach.length || h.soCach.some((v) => !Number.isInteger(v) || v < 0) || h.phan.some((v) => !Number.isInteger(v) || v < 0) || !Number.isInteger(h.tich))) return hong('bảng phần cố định hỏng (loai este/amin/aren/khac, mỗi dòng phan + soCach + tich)')
    for (const h of hang) { const l = kiemHang(loai, h!); if (l) return hong(`bảng: ${l}`) }
    bang = { loai, tieuDe: s(b.tieuDe, 80) || 'Phần cố định, chia C còn lại', cot, hang: hang as BangDP['hang'] }
    tongBang = hang.reduce((a, h) => a + h!.tich, 0)
  }
  if (!mach.length && !bang) return hong('cần ít nhất một mạch đại số hoặc một bảng phần cố định')
  const tong = tongMach + tongBang + (hoi === 'dong-phan' ? tongHH : 0)
  if (Number(x.tong) !== tong) return hong(`cộng lại được ${tong}${hoi === 'dong-phan' && tongHH ? ` (có ${tongHH} hình học)` : ''} chứ không phải ${s(x.tong, 6)}`)
  return { dp: { ctpt, nguyenTu, K, ...(s(x.tachK, 160) ? { tachK: s(x.tachK, 160) } : {}), hoi, ...(mach.length ? { mach } : {}), ...(bang ? { bang } : {}), tong }, loi: null }
}

/** Cây khung bất kỳ ⇒ khung mạch chính + nhánh thẳng (null nếu nhánh phân nhánh — chỉ gặp từ C10). */
export function khungTuCha(cha: readonly number[]): KhungDP | null {
  const ke = keCua(cha), n = cha.length
  const bfs = (g: number) => { const d = new Array(n).fill(-1), tr = new Array(n).fill(-1); d[g] = 0; const q = [g]; for (let i = 0; i < q.length; i++) for (const v of ke[q[i]!]!) if (d[v] < 0) { d[v] = d[q[i]!] + 1; tr[v] = q[i]; q.push(v) } return { d, tr } }
  const a = bfs(0).d.reduce((m: number, x: number, i: number, d: number[]) => (x > d[m]! ? i : m), 0)
  const { d, tr } = bfs(a)
  const b = d.reduce((m: number, x: number, i: number) => (x > d[m]! ? i : m), 0)
  const duong: number[] = []
  for (let u = b; u >= 0; u = tr[u]) duong.push(u)
  const trong = new Set(duong)
  const nhanh: { o: number; dai: number }[] = []
  for (const [i, u] of duong.entries()) for (const v of ke[u]!) {
    if (trong.has(v)) continue
    let dai = 1, truoc = u, cur = v
    for (;;) { const tiep = ke[cur]!.filter((w) => w !== truoc); if (tiep.length > 1) return null; if (!tiep.length) break; truoc = cur; cur = tiep[0]!; dai++ }
    nhanh.push({ o: i + 1, dai })
  }
  return { chinh: duong.length, nhanh }
}

/** Số hình học (tổng các chất mới) của các mạch — app dùng cho cảnh. */
export function hinhHocCua(dp: DongPhanKinh): { gon: string; dau: NonNullable<ToHopDP['dau']>; them: number }[] {
  const ra: { gon: string; dau: NonNullable<ToHopDP['dau']>; them: number }[] = []
  for (const m of dp.mach ?? []) {
    if (!m.dat.some((d) => d.loai === 'doi')) continue
    const kq = lietKeMach(m)
    for (const t of kq?.toHop ?? []) if (t.ket === 'moi' && t.dau?.length) ra.push({ gon: t.gon ?? '', dau: t.dau, them: t.hinhHoc ?? 0 })
  }
  return ra
}

/** Bản tin cho máy soạn (`node dong-phan.mjs`): liệt kê tổ hợp + phân loại của từng mạch, tổng tính lại. */
export function banTinDongPhan(x: unknown): string {
  const dong: string[] = []
  const o = laObj(x) ? x : {}
  for (const mt of mang(o.mach)) {
    if (!laObj(mt)) continue
    const k = laObj(mt.khung) ? mt.khung : {}
    const m = { khung: { chinh: Number(k.chinh), nhanh: mang(k.nhanh).map((n) => (laObj(n) ? { o: Number(n.o), dai: Number(n.dai) } : { o: 0, dai: 0 })) }, dat: mang(mt.dat).filter(laObj).map((d) => ({ loai: d.loai as DatDP, nhan: s(d.nhan, 12) || 'X' })), chon: mt.chon === undefined ? undefined : mang(mt.chon).map(Number) }
    const kq = lietKeMach(m)
    dong.push(`MẠCH ${s(mt.so, 20)} (khai ${s(mt.soChat, 6)} chất):`)
    if (!kq) { dong.push('  khung / thứ cắm hỏng'); continue }
    for (const t of kq.toHop) {
      const vt = t.viTri.map((v) => (v.loai === 'c' ? kq.kd.ten[v.a] : `${kq.kd.ten[v.a]}–${kq.kd.ten[v.b]}`)).join(' + ')
      dong.push(`  #${t.so} ${vt}: ${t.ket === 'moi' ? `CHẤT ${t.chat} ${t.gon}${t.hinhHoc ? ` (hình học +${t.hinhHoc})` : ''}` : t.ket === 'trung' ? `trùng #${t.trungVoi} (${t.gon})` : t.ket === 'loai' ? `loại theo điều kiện (${t.gon})` : `thừa: ${t.ly}`}`)
    }
    dong.push(`  ⇒ ${kq.soChat} chất${kq.hinhHoc ? `, ${kq.hinhHoc} nối đôi có hình học` : ''}`)
  }
  const k = docDongPhan(x)
  dong.push(k.loi ? `LỖI: ${k.loi}` : `ĐẠT: tổng ${k.dp!.tong}`)
  return dong.join('\n')
}
