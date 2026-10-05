// BỘ SINH BIẾN THỂ THEO DẠNG (05/10) — PHẦN DÙNG CHUNG cho mọi họ đề tính toán (server/src/bien-the/ho-*.ts).
// Thuần, TẤT ĐỊNH: không Math.random, không đồng hồ, không mạng/LLM. Mọi số ngẫu nhiên đi qua `Rng` gieo bằng chuỗi hạt giống (FNV-1a + mulberry32,
// cùng thuật toán với omni-cau-nen-sinh.ts) ⇒ cùng hạt giống ⇒ cùng câu.
// Hằng số THỐNG NHẤT với omni-cau-nen-sinh.ts: nguyên tử khối SGK H 1 · C 12 · N 14 · O 16 · Na 23 · Mg 24 · Al 27 · S 32 · Cl 35,5 · K 39 · Ca 40 ·
// Fe 56 · Cu 64 · Zn 65 · Ag 108 · Ba 137; 1 mol khí ở điều kiện chuẩn (25 °C, 1 bar) chiếm 24,79 L (chương trình 2018); F = 96 500 C/mol.
// Công thức hoá học viết chỉ số Unicode (C₆H₁₂O₆, CO₂…) như kho; số viết dấu phẩy thập phân, không tách nghìn (riêng F viết "96 500" như kho).

export type Phan = 'I' | 'III'
export type MucDo = 'biet' | 'hieu' | 'van_dung'
export const CAC_MUC: readonly MucDo[] = ['biet', 'hieu', 'van_dung']

/** Một phương án nhiễu TỪ LỖI HAY GẶP: giá trị (câu số) hoặc chữ (câu chọn công thức / dãy số) + lỗi đã mắc (cụm động từ, vd "quên nhân hiệu suất 80%"). */
export interface Nhieu { giaTri?: number; chu?: string; viSao: string }

/** Kết quả một mẫu đề cho MỘT phần (I hoặc III) — bộ lắp ráp (bien-the-sinh.ts) thêm quy tắc làm tròn, phương án, lý do từng phương án. */
export interface BanSinh {
  /** Đề đầy đủ (bối cảnh + câu hỏi cuối), CHƯA có câu làm tròn. */
  de: string
  kieu: 'so' | 'chu'
  /** Đáp số CHÍNH XÁC (chưa làm tròn) khi kieu = 'so'. */
  giaTri?: number
  /** Đáp số đúng tuyệt đối (đếm số mol, Kc nguyên…) ⇒ Phần III không ghi câu làm tròn, viết nguyên giá trị. */
  chinhXac?: boolean
  /** Trần (không đạt tới) của đại lượng hỏi, vd hiệu suất < 100: nhiễu từ trần trở lên bị bỏ (không cho phương án vô lí như H = 100% hay 130%). */
  toiDa?: number
  /** Đáp án chữ khi kieu = 'chu' (dãy thứ tự "4132", công thức "C₄H₈O₂"). Phần III chỉ nhận dãy chữ số. */
  dapAnChu?: string
  /** Nhiễu theo THỨ TỰ ƯU TIÊN (Phần I lấy 3 cái đầu hợp lệ, khác nhau và khác đáp án). */
  nhieu: Nhieu[]
  /** Vì sao đáp án đúng (cụm ngắn, có phép tính chốt). */
  lyDoDung: string
  buoc: string[]
  /** Kiến thức chốt (≤ 20 từ). */
  chot: string
  kienThuc: string[]
}

/** Một mẫu đề: phục vụ các mã dạng `dang`, ở mức độ `muc`; `tuKhoa` dùng để chọn mẫu GẦN câu gốc nhất khi nơi gọi đưa chữ câu gốc. */
export interface MauDe {
  ma: string
  dang: readonly string[]
  muc: MucDo
  /** Mặc định cả hai phần. */
  phan?: readonly Phan[]
  tuKhoa?: RegExp
  sinh(r: Rng, phan: Phan): BanSinh | null
}

export interface HoDe {
  ma: string
  ten: string
  /** Khối của CHƯƠNG (chỉ để mô tả). Biến thể KHÔNG lấy khối từ đây: khối của biến thể = khối câu gốc (mã tờ câu gốc). */
  khoiChuong: 10 | 11 | 12
  tuKhoa: RegExp
  mau: readonly MauDe[]
}

/** Bỏ nhiễu dấu phẩy động (làm tròn 9 chữ số thập phân). */
export const lam = (x: number) => Math.round(x * 1e9) / 1e9

// ---------------------------------------------------------------- PRNG tất định (mulberry32) + băm FNV-1a (như omni-cau-nen-sinh.ts)

export function bam32(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}
function mulberry(hat: number): () => number {
  let a = hat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Nguồn số ngẫu nhiên TẤT ĐỊNH gieo bằng chuỗi. */
export class Rng {
  private readonly f: () => number
  constructor(hat: string) { this.f = mulberry(bam32(hat)) }
  so(): number { return this.f() }
  /** Số nguyên trong [a, b] (gồm hai đầu). */
  nguyen(a: number, b: number): number { return a + Math.floor(this.f() * (b - a + 1)) }
  chon<T>(ds: readonly T[]): T { return ds[Math.floor(this.f() * ds.length)]! }
  /** Bội số của `buoc` trong [a, b] — số "đẹp" như đề thi (không nhiễu dấu phẩy động). */
  boi(a: number, b: number, buoc: number): number { return lam(this.nguyen(Math.ceil(lam(a / buoc)), Math.floor(lam(b / buoc))) * buoc) }
  xao<T>(ds: readonly T[]): T[] {
    const a = [...ds]
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.f() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!] }
    return a
  }
}

// ---------------------------------------------------------------- số học + định dạng kiểu Việt Nam

const chuoiChuan = (x: number) => lam(x).toFixed(9).replace(/0+$/, '').replace(/\.$/, '')
/** Số chữ số thập phân thật. */
export const soLe = (x: number) => { const s = chuoiChuan(x); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1 }
/** Viết đúng giá trị, dấu phẩy thập phân: 6,1975 · 96500 · 0,8. */
export const vn = (x: number) => chuoiChuan(x).replace('.', ',')
/** Làm tròn nửa lên tới `d` chữ số thập phân (số dương). */
export function lamTron(x: number, d: number): number {
  const p = 10 ** d
  return Math.round(lam(x * p)) / p
}
/** Viết với ĐÚNG `d` chữ số thập phân (giữ số 0 cuối): 2,20. */
export const vnCo = (x: number, d: number) => lamTron(x, d).toFixed(d).replace('.', ',')
/** Giá trị trung gian trong lời giải: đúng ≤ 4 chữ số thập phân ⇒ "= 0,2"; dài hơn ⇒ "≈ 0,02339" (4 chữ số có nghĩa). */
export function bang(x: number): string {
  if (soLe(x) <= 4) return `= ${vn(x)}`
  return `≈ ${vnGan(x)}`
}
/** 4 chữ số có nghĩa (≥ 1000 ⇒ làm tròn hàng đơn vị). */
export function vnGan(x: number): string {
  if (x === 0) return '0'
  const mu = Math.floor(Math.log10(Math.abs(x)))
  const d = Math.max(0, 3 - mu)
  return vn(lamTron(x, Math.min(d, 9)))
}
/** Số trung gian viết trong phép tính của lời giải (đúng ≤ 4 chữ số thập phân ⇒ nguyên giá trị, dài hơn ⇒ 4 chữ số có nghĩa). */
export const vnT = (x: number) => (soLe(x) <= 4 ? vn(x) : vnGan(x))
/** "a và b", "a, b và c". */
export const noi = (ds: readonly string[]) => (ds.length <= 1 ? ds.join('') : `${ds.slice(0, -1).join(', ')} và ${ds[ds.length - 1]}`)

/** Câu hỏi cuối theo kí hiệu đã định nghĩa trong đề. */
export const hoi = (phan: Phan, k: string) => (phan === 'I' ? `Giá trị của ${k} là` : `Giá trị của ${k} là bao nhiêu?`)

// ---------------------------------------------------------------- hằng số + khối lượng mol (thành phần viết tay; test tự phân tích công thức để đối chiếu)

export const NTK: Readonly<Record<string, number>> = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 64, Zn: 65, Ag: 108, Ba: 137 }
export const V_KHI = 24.79
export const F = 96500
/** Chữ hằng số dùng trong đề. */
export const CHU_DKC = '(đkc)'
export const CHU_F = 'Cho F = 96 500 C/mol.'

type ThanhPhan = Readonly<Record<string, number>>
const TP: Readonly<Record<string, ThanhPhan>> = {
  'C₆H₁₂O₆': { C: 6, H: 12, O: 6 }, 'C₁₂H₂₂O₁₁': { C: 12, H: 22, O: 11 }, 'C₆H₁₀O₅': { C: 6, H: 10, O: 5 }, 'C₂H₅OH': { C: 2, H: 6, O: 1 },
  'CO₂': { C: 1, O: 2 }, 'H₂O': { H: 2, O: 1 }, 'CaCO₃': { Ca: 1, C: 1, O: 3 }, 'Ag': { Ag: 1 }, 'CH₃COOH': { C: 2, H: 4, O: 2 },
  'C₆H₇O₂(ONO₂)₃': { C: 6, H: 7, O: 11, N: 3 }, 'C₆H₇O₂(OOCCH₃)₃': { C: 12, H: 16, O: 8 }, 'HNO₃': { H: 1, N: 1, O: 3 }, '(CH₃CO)₂O': { C: 4, H: 6, O: 3 },
  'NaOH': { Na: 1, O: 1, H: 1 }, 'KOH': { K: 1, O: 1, H: 1 }, 'C₃H₅(OH)₃': { C: 3, H: 8, O: 3 },
  '(C₁₇H₃₅COO)₃C₃H₅': { C: 57, H: 110, O: 6 }, '(C₁₇H₃₃COO)₃C₃H₅': { C: 57, H: 104, O: 6 }, '(C₁₅H₃₁COO)₃C₃H₅': { C: 51, H: 98, O: 6 }, '(C₁₇H₃₁COO)₃C₃H₅': { C: 57, H: 98, O: 6 },
  'C₁₇H₃₅COONa': { C: 18, H: 35, O: 2, Na: 1 }, 'C₁₇H₃₃COONa': { C: 18, H: 33, O: 2, Na: 1 }, 'C₁₅H₃₁COONa': { C: 16, H: 31, O: 2, Na: 1 }, 'C₁₇H₃₁COONa': { C: 18, H: 31, O: 2, Na: 1 },
  'C₁₇H₃₅COOK': { C: 18, H: 35, O: 2, K: 1 }, 'C₁₇H₃₃COOK': { C: 18, H: 33, O: 2, K: 1 }, 'C₁₅H₃₁COOK': { C: 16, H: 31, O: 2, K: 1 },
  'C₁₇H₃₅COOH': { C: 18, H: 36, O: 2 }, 'C₁₅H₃₁COOH': { C: 16, H: 32, O: 2 }, 'C₁₇H₃₅COOCH₃': { C: 19, H: 38, O: 2 }, 'C₁₅H₃₁COOCH₃': { C: 17, H: 34, O: 2 },
  'HCOOCH₃': { C: 2, H: 4, O: 2 }, 'HCOOC₂H₅': { C: 3, H: 6, O: 2 }, 'CH₃COOCH₃': { C: 3, H: 6, O: 2 }, 'CH₃COOC₂H₅': { C: 4, H: 8, O: 2 }, 'C₂H₅COOCH₃': { C: 4, H: 8, O: 2 },
  'C₂H₅COOC₂H₅': { C: 5, H: 10, O: 2 }, 'CH₃COOCH₂CH₂CH(CH₃)₂': { C: 7, H: 14, O: 2 },
  'HCOONa': { C: 1, H: 1, O: 2, Na: 1 }, 'CH₃COONa': { C: 2, H: 3, O: 2, Na: 1 }, 'C₂H₅COONa': { C: 3, H: 5, O: 2, Na: 1 },
  'HCOOH': { C: 1, H: 2, O: 2 }, 'C₂H₅COOH': { C: 3, H: 6, O: 2 }, 'CH₃OH': { C: 1, H: 4, O: 1 }, '(CH₃)₂CHCH₂CH₂OH': { C: 5, H: 12, O: 1 },
  'Fe₂O₃': { Fe: 2, O: 3 }, 'Fe₃O₄': { Fe: 3, O: 4 }, 'CuO': { Cu: 1, O: 1 }, 'ZnO': { Zn: 1, O: 1 }, 'Al₂O₃': { Al: 2, O: 3 }, 'NaCl': { Na: 1, Cl: 1 }, 'MgCl₂': { Mg: 1, Cl: 2 },
  'Fe': { Fe: 1 }, 'Cu': { Cu: 1 }, 'Zn': { Zn: 1 }, 'Al': { Al: 1 }, 'Na': { Na: 1 }, 'Mg': { Mg: 1 },
  'CuSO₄': { Cu: 1, S: 1, O: 4 }, 'CuCl₂': { Cu: 1, Cl: 2 }, 'AgNO₃': { Ag: 1, N: 1, O: 3 }, 'Cu(NO₃)₂': { Cu: 1, N: 2, O: 6 },
  'H₂SO₄': { H: 2, S: 1, O: 4 }, 'SO₂': { S: 1, O: 2 }, 'H₂': { H: 2 }, 'O₂': { O: 2 }, 'Cl₂': { Cl: 2 },
  'FeSO₄': { Fe: 1, S: 1, O: 4 }, 'ZnSO₄': { Zn: 1, S: 1, O: 4 }, 'MgSO₄': { Mg: 1, S: 1, O: 4 }, 'Al₂(SO₄)₃': { Al: 2, S: 3, O: 12 }, 'Fe₂(SO₄)₃': { Fe: 2, S: 3, O: 12 },
  'Ag₂SO₄': { Ag: 2, S: 1, O: 4 },
  'C₇H₆O₃': { C: 7, H: 6, O: 3 }, 'C₈H₈O₃': { C: 8, H: 8, O: 3 }, 'C₃H₆O₃': { C: 3, H: 6, O: 3 },
}
/** Khối lượng mol theo công thức (chất ngoài bảng ⇒ ném lỗi: bộ sinh viết sai tên chất). */
export function M(ct: string): number {
  const t = TP[ct]
  if (!t) throw new Error(`bien-the: thiếu thành phần của ${ct}`)
  return lam(Object.entries(t).reduce((s, [e, k]) => s + NTK[e]! * k, 0))
}

/** Dựng kết quả câu SỐ của một mẫu (Phần I + Phần III dùng chung). */
export function soHoc(de: string, giaTri: number, nhieu: Nhieu[], lyDoDung: string, buoc: string[], chot: string, kienThuc: string[],
  o: { chinhXac?: boolean; toiDa?: number } = {}): BanSinh {
  return { de, kieu: 'so', giaTri, chinhXac: o.chinhXac ?? false, toiDa: o.toiDa, nhieu, lyDoDung, buoc, chot, kienThuc }
}

/** Phần trăm viết như đề: 80%. */
export const pt = (h: number) => `${vn(h)}%`
