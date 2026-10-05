// OMNI 3 · D1 — TỰ SINH CÂU NỀN: Trạm hồi phục luôn có câu gỡ ĐÚNG BƯỚC em vướng (ngân hàng `cau_nen`, nhãn TEN_NEN của thang-tu-go.ts).
// Bộ sinh THUẦN, TẤT ĐỊNH theo (nhãn, số thứ tự): không Math.random, không đọc đồng hồ, không gọi mạng/LLM. Mỗi nhãn có một KHÔNG GIAN TRƯỜNG HỢP
// liệt kê sẵn — chỉ giữ trường hợp đáp án DƯƠNG, HỮU HẠN, ≤ 3 chữ số thập phân, tính đúng bằng mã — rồi xáo bằng PRNG gieo theo nhãn ⇒ câu số k của
// một nhãn luôn là cùng một câu, nội dung không lặp tới khi dùng hết không gian. Đáp án được KIỂM CHÉO trong tests/omni-3-cau-nen-sinh.test.ts bằng một
// bộ giải ĐỘC LẬP đọc lại chính chữ đề (tự phân tích công thức, tự tính khối lượng mol, tự cân bằng) — không gọi lại hàm ở đây.
// Số liệu chuẩn: nguyên tử khối SGK H 1 · C 12 · N 14 · O 16 · Na 23 · Mg 24 · Al 27 · S 32 · Cl 35,5 · K 39 · Ca 40 · Fe 56 · Cu 64 · Zn 65 · Ag 108 ·
// Ba 137; thể tích mol khí ở điều kiện chuẩn (25 °C, 1 bar) 24,79 L/mol (chương trình 2018); F = 96 500 C/mol; E° theo SGK.
// 27 nhãn: 20 nhãn đầu + 6 bước tính toán thêm 05/10 (bảo toàn electron, lập hệ phương trình, công thức phân tử, hằng số cân bằng, biến thiên enthalpy,
// năng lượng liên kết) + bảo toàn điện tích (chỉ ghép ion CÙNG TỒN TẠI được; cô cạn không dùng HCO₃⁻, NH₄⁺, H⁺). Với 3 nhãn nhiệt / cân bằng: ΔfH°298, Eb, nồng độ (số mol) lúc cân bằng LUÔN IN TRONG ĐỀ (SGK các bộ lệch nhau) — không dùng
// hằng số ẩn; đề ghi rõ "ΔfH°298 của đơn chất bền bằng 0". Bảo toàn electron: sản phẩm khử duy nhất, axit dư (Fe ⇒ Fe³⁺). Trắc nghiệm công thức phân tử:
// cả 4 phương án là công thức hợp lệ (H chẵn, độ bất bão hoà nguyên ≥ 0), đúng một phương án khớp dữ kiện.
// Mã câu: `sinh.<nhãn>.<số>` — khớp /^[\w.-]{1,80}$/ của `locCauNen`; sổ ghi qid `nen:<id>`. Câu thầy nạp = id KHÔNG bắt đầu bằng "sinh." — không đụng tới.
// Đáp án số viết dấu phẩy thập phân như app đang chấm (`chamCauNen`/`docSo` của thang-tu-go.ts); `gia_tri_dung` là số chuẩn dấu chấm. ΔrH°298 / ΔfH°298
// có thể ÂM: `dap_an` viết "-1366,8" (dấu "-" như ô nhập của app), chữ đề / lời giải viết "−"; docSo đọc cả "-", "−", "–".
import type { D1PreparedStatement, Env } from './kieu'
import { damBaoBangCauNen } from './thang-tu-go'

type Obj = Record<string, unknown>
type ChuCai = 'A' | 'B' | 'C' | 'D'
const CHU_CAI: readonly ChuCai[] = ['A', 'B', 'C', 'D']

/** Một câu nền sinh ra (đúng cột bảng `cau_nen`, kèm bản đối tượng của pa/giai để dùng ngay). */
export interface CauNenSinh {
  id: string
  nhan: string
  muc: 1 | 2
  kieu: 'so' | 'tn'
  de: string
  pa: Record<ChuCai, string> | null
  pa_json: string | null
  dap_an: string
  gia_tri_dung: string
  giai: string[]
  giai_json: string
  meo: string
}
interface Nhap { muc: 1 | 2; kieu: 'so' | 'tn'; de: string; pa?: Record<ChuCai, string>; dapAn: string; giaTri: string; giai: string[]; meo: string }

/** Tiền tố mã câu sinh (khác mọi mã thầy nạp). */
export const TIEN_TO_SINH = 'sinh.'
/** Số câu thêm mỗi lần một nhãn thiếu câu. */
export const SO_CAU_THEM_MOI_LAN = 8
/** Ngưỡng mặc định: nhãn có ít hơn số câu này ⇒ sinh thêm. */
export const TOI_THIEU_CAU_NEN = 5

// ---------------------------------------------------------------- số học chính xác + định dạng

const lam = (x: number) => Math.round(x * 1e9) / 1e9
const chuoiChuan = (x: number) => lam(x).toFixed(9).replace(/0+$/, '').replace(/\.$/, '')
/** Số chữ số thập phân thật của x (sau khi bỏ nhiễu dấu phẩy động). */
const soLe = (x: number) => { const s = chuoiChuan(x); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1 }
/** Đáp án "đẹp": dương, hữu hạn, ≤ `toiDa` chữ số thập phân. */
const dep = (x: number, toiDa = 3) => Number.isFinite(x) && x > 0 && soLe(x) <= toiDa
/** Số viết kiểu Việt Nam (dấu phẩy thập phân, không tách nghìn): 6,1975 · 96500. */
const vn = (x: number) => chuoiChuan(x).replace('.', ',')
/** Thế điện cực: luôn 2 chữ số thập phân, có dấu (+0,34 · −0,76 · 0,00). */
const vnDau = (x: number) => (Math.abs(x) < 1e-12 ? '0,00' : `${x > 0 ? '+' : '−'}${Math.abs(x).toFixed(2).replace('.', ',')}`)
/** Hiệu điện thế viết đủ 2 chữ số thập phân như SGK (1,10 V). */
const vn2 = (x: number) => x.toFixed(2).replace('.', ',')

// ---------------------------------------------------------------- chất: công thức (chỉ số Unicode) + thành phần nguyên tố

const NTK: Readonly<Record<string, number>> = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 64, Zn: 65, Ag: 108, Ba: 137 }
type ThanhPhan = Readonly<Record<string, number>>
/** Thành phần nguyên tố viết tay của từng công thức. Test tự phân tích CHUỖI công thức để kiểm khớp (độc lập). */
const CHAT: Readonly<Record<string, ThanhPhan>> = {
  'H₂': { H: 2 }, 'O₂': { O: 2 }, 'N₂': { N: 2 }, 'Cl₂': { Cl: 2 },
  'Fe': { Fe: 1 }, 'Cu': { Cu: 1 }, 'Al': { Al: 1 }, 'Mg': { Mg: 1 }, 'Zn': { Zn: 1 }, 'Ag': { Ag: 1 }, 'Na': { Na: 1 }, 'Ca': { Ca: 1 },
  'H₂O': { H: 2, O: 1 }, 'CO₂': { C: 1, O: 2 }, 'CO': { C: 1, O: 1 }, 'SO₂': { S: 1, O: 2 }, 'SO₃': { S: 1, O: 3 }, 'NO₂': { N: 1, O: 2 }, 'NO': { N: 1, O: 1 }, 'NH₃': { N: 1, H: 3 }, 'H₂S': { H: 2, S: 1 },
  'CH₄': { C: 1, H: 4 }, 'C₂H₆': { C: 2, H: 6 }, 'C₃H₈': { C: 3, H: 8 }, 'C₄H₁₀': { C: 4, H: 10 }, 'C₅H₁₂': { C: 5, H: 12 }, 'C₂H₄': { C: 2, H: 4 }, 'C₃H₆': { C: 3, H: 6 },
  'C₄H₈': { C: 4, H: 8 }, 'C₂H₂': { C: 2, H: 2 }, 'C₃H₄': { C: 3, H: 4 }, 'C₄H₆': { C: 4, H: 6 }, 'C₆H₆': { C: 6, H: 6 }, 'C₇H₈': { C: 7, H: 8 }, 'C₈H₁₀': { C: 8, H: 10 }, 'C₆H₁₂': { C: 6, H: 12 },
  'C₂H₅OH': { C: 2, H: 6, O: 1 }, 'CH₃OH': { C: 1, H: 4, O: 1 }, 'CH₃COOH': { C: 2, H: 4, O: 2 }, 'CH₃COOC₂H₅': { C: 4, H: 8, O: 2 }, 'C₆H₁₂O₆': { C: 6, H: 12, O: 6 },
  'NaCl': { Na: 1, Cl: 1 }, 'KCl': { K: 1, Cl: 1 }, 'HCl': { H: 1, Cl: 1 }, 'NaOH': { Na: 1, O: 1, H: 1 }, 'KOH': { K: 1, O: 1, H: 1 }, 'H₂SO₄': { H: 2, S: 1, O: 4 }, 'HNO₃': { H: 1, N: 1, O: 3 },
  'CaCO₃': { Ca: 1, C: 1, O: 3 }, 'MgCO₃': { Mg: 1, C: 1, O: 3 }, 'Na₂CO₃': { Na: 2, C: 1, O: 3 }, 'NaHCO₃': { Na: 1, H: 1, C: 1, O: 3 }, 'CaO': { Ca: 1, O: 1 }, 'MgO': { Mg: 1, O: 1 },
  'CuO': { Cu: 1, O: 1 }, 'ZnO': { Zn: 1, O: 1 }, 'Al₂O₃': { Al: 2, O: 3 }, 'Fe₂O₃': { Fe: 2, O: 3 }, 'Fe₃O₄': { Fe: 3, O: 4 },
  'Ca(OH)₂': { Ca: 1, O: 2, H: 2 }, 'Ba(OH)₂': { Ba: 1, O: 2, H: 2 }, 'Cu(OH)₂': { Cu: 1, O: 2, H: 2 }, 'Fe(OH)₃': { Fe: 1, O: 3, H: 3 },
  'AgNO₃': { Ag: 1, N: 1, O: 3 }, 'KNO₃': { K: 1, N: 1, O: 3 }, 'NaNO₃': { Na: 1, N: 1, O: 3 }, 'Cu(NO₃)₂': { Cu: 1, N: 2, O: 6 }, 'Fe(NO₃)₃': { Fe: 1, N: 3, O: 9 }, 'Zn(NO₃)₂': { Zn: 1, N: 2, O: 6 },
  'NH₄NO₃': { N: 2, H: 4, O: 3 }, 'AgCl': { Ag: 1, Cl: 1 }, 'BaCl₂': { Ba: 1, Cl: 2 }, 'MgCl₂': { Mg: 1, Cl: 2 }, 'ZnCl₂': { Zn: 1, Cl: 2 }, 'CaCl₂': { Ca: 1, Cl: 2 },
  'FeCl₂': { Fe: 1, Cl: 2 }, 'FeCl₃': { Fe: 1, Cl: 3 }, 'AlCl₃': { Al: 1, Cl: 3 }, 'CuCl₂': { Cu: 1, Cl: 2 },
  'CuSO₄': { Cu: 1, S: 1, O: 4 }, 'FeSO₄': { Fe: 1, S: 1, O: 4 }, 'MgSO₄': { Mg: 1, S: 1, O: 4 }, 'Na₂SO₄': { Na: 2, S: 1, O: 4 }, 'K₂SO₄': { K: 2, S: 1, O: 4 }, 'BaSO₄': { Ba: 1, S: 1, O: 4 },
  'Al₂(SO₄)₃': { Al: 2, S: 3, O: 12 }, 'Fe₂(SO₄)₃': { Fe: 2, S: 3, O: 12 }, 'KClO₃': { K: 1, Cl: 1, O: 3 }, 'CaC₂': { Ca: 1, C: 2 },
  'FeS₂': { Fe: 1, S: 2 }, 'MnO₂': { Mn: 1, O: 2 }, 'MnCl₂': { Mn: 1, Cl: 2 }, 'H₂O₂': { H: 2, O: 2 },
}
const tpCua = (ct: string): ThanhPhan => { const t = CHAT[ct]; if (!t) throw new Error(`omni-cau-nen-sinh: thiếu thành phần của ${ct}`); return t }
/** Khối lượng mol từ thành phần (nguyên tố ngoài bảng NTK ⇒ NaN: chất đó chỉ dùng để cân bằng, không tính khối lượng). */
const mCua = (ct: string) => lam(Object.entries(tpCua(ct)).reduce((s, [e, k]) => s + (NTK[e] ?? Number.NaN) * k, 0))

// ---------------------------------------------------------------- phản ứng đã cân bằng (viết sẵn; test kiểm cân bằng bằng bộ đếm nguyên tử riêng)

export interface PhanUngSinh { trai: readonly (readonly [number, string])[]; phai: readonly (readonly [number, string])[]; mui?: '→' | '⇌' }
const pu = (trai: [number, string][], phai: [number, string][], mui: '→' | '⇌' = '→'): PhanUngSinh => ({ trai, phai, mui })
const vePhan = (ds: readonly (readonly [number, string])[], heSo?: readonly number[]) => ds.map(([h, c], i) => `${(heSo ? heSo[i]! : h) === 1 ? '' : heSo ? heSo[i] : h}${c}`).join(' + ')
/** Phương trình dạng chữ: "2Al + 6HCl → 2AlCl₃ + 3H₂". `heSo` (tuỳ chọn) thay hệ số theo thứ tự trái rồi phải. */
export function chuPhanUng(p: PhanUngSinh, heSo?: readonly number[]): string {
  const n = p.trai.length
  return `${vePhan(p.trai, heSo?.slice(0, n))} ${p.mui ?? '→'} ${vePhan(p.phai, heSo?.slice(n))}`
}
const heSoCua = (p: PhanUngSinh) => [...p.trai.map(([h]) => h), ...p.phai.map(([h]) => h)]
const chatCua = (p: PhanUngSinh) => [...p.trai.map(([, c]) => c), ...p.phai.map(([, c]) => c)]
/** Cân bằng (theo thành phần viết tay) với một bộ hệ số. */
function canBangVoi(p: PhanUngSinh, heSo: readonly number[]): boolean {
  const chat = chatCua(p), n = p.trai.length, dem = new Map<string, number>()
  chat.forEach((c, i) => { for (const [e, k] of Object.entries(tpCua(c))) dem.set(e, (dem.get(e) ?? 0) + (i < n ? 1 : -1) * heSo[i]! * k) })
  return [...dem.values()].every((v) => v === 0)
}
const ucln = (a: number, b: number): number => (b ? ucln(b, a % b) : a)

/** Phản ứng dùng cho tỉ lệ mol / chất dư-hết / hiệu suất / bảo toàn khối lượng (mọi chất có khối lượng mol trong bảng). */
export const PHAN_UNG_TINH: readonly PhanUngSinh[] = [
  pu([[2, 'H₂'], [1, 'O₂']], [[2, 'H₂O']]),
  pu([[4, 'Al'], [3, 'O₂']], [[2, 'Al₂O₃']]),
  pu([[2, 'Mg'], [1, 'O₂']], [[2, 'MgO']]),
  pu([[2, 'Al'], [6, 'HCl']], [[2, 'AlCl₃'], [3, 'H₂']]),
  pu([[1, 'Fe'], [2, 'HCl']], [[1, 'FeCl₂'], [1, 'H₂']]),
  pu([[1, 'Zn'], [2, 'HCl']], [[1, 'ZnCl₂'], [1, 'H₂']]),
  pu([[1, 'Mg'], [2, 'HCl']], [[1, 'MgCl₂'], [1, 'H₂']]),
  pu([[1, 'CH₄'], [2, 'O₂']], [[1, 'CO₂'], [2, 'H₂O']]),
  pu([[1, 'C₂H₄'], [3, 'O₂']], [[2, 'CO₂'], [2, 'H₂O']]),
  pu([[1, 'C₃H₈'], [5, 'O₂']], [[3, 'CO₂'], [4, 'H₂O']]),
  pu([[2, 'Na'], [2, 'H₂O']], [[2, 'NaOH'], [1, 'H₂']]),
  pu([[1, 'Fe₂O₃'], [3, 'H₂']], [[2, 'Fe'], [3, 'H₂O']]),
  pu([[1, 'CuO'], [1, 'H₂']], [[1, 'Cu'], [1, 'H₂O']]),
  pu([[1, 'NaOH'], [1, 'HCl']], [[1, 'NaCl'], [1, 'H₂O']]),
  pu([[1, 'CaCO₃'], [2, 'HCl']], [[1, 'CaCl₂'], [1, 'CO₂'], [1, 'H₂O']]),
  pu([[1, 'Na₂CO₃'], [2, 'HCl']], [[2, 'NaCl'], [1, 'CO₂'], [1, 'H₂O']]),
  pu([[1, 'Cu'], [2, 'AgNO₃']], [[1, 'Cu(NO₃)₂'], [2, 'Ag']]),
  pu([[1, 'Fe'], [1, 'CuSO₄']], [[1, 'FeSO₄'], [1, 'Cu']]),
  pu([[1, 'BaCl₂'], [1, 'H₂SO₄']], [[1, 'BaSO₄'], [2, 'HCl']]),
  pu([[1, 'AgNO₃'], [1, 'NaCl']], [[1, 'AgCl'], [1, 'NaNO₃']]),
]
/** Phản ứng phân huỷ / lên men / ester hoá cho hiệu suất (một chất đầu tính được; chất kia nếu có thì dùng dư). */
export const PHAN_UNG_HIEU_SUAT: readonly { p: PhanUngSinh; dau: string; dong: string; viec: (khoiLuong: string) => string; ghiChu: string }[] = [
  { p: pu([[1, 'CaCO₃']], [[1, 'CaO'], [1, 'CO₂']]), dau: 'CaCO₃', dong: 'CaO', viec: (m) => `Nung ${m} CaCO₃`, ghiChu: '' },
  { p: pu([[2, 'KClO₃']], [[2, 'KCl'], [3, 'O₂']]), dau: 'KClO₃', dong: 'O₂', viec: (m) => `Nhiệt phân ${m} KClO₃`, ghiChu: '' },
  { p: pu([[2, 'Fe(OH)₃']], [[1, 'Fe₂O₃'], [3, 'H₂O']]), dau: 'Fe(OH)₃', dong: 'Fe₂O₃', viec: (m) => `Nung ${m} Fe(OH)₃`, ghiChu: '' },
  { p: pu([[1, 'Cu(OH)₂']], [[1, 'CuO'], [1, 'H₂O']]), dau: 'Cu(OH)₂', dong: 'CuO', viec: (m) => `Nung ${m} Cu(OH)₂`, ghiChu: '' },
  { p: pu([[2, 'NaHCO₃']], [[1, 'Na₂CO₃'], [1, 'CO₂'], [1, 'H₂O']]), dau: 'NaHCO₃', dong: 'Na₂CO₃', viec: (m) => `Nhiệt phân ${m} NaHCO₃`, ghiChu: '' },
  { p: pu([[1, 'C₆H₁₂O₆']], [[2, 'C₂H₅OH'], [2, 'CO₂']]), dau: 'C₆H₁₂O₆', dong: 'C₂H₅OH', viec: (m) => `Lên men ${m} C₆H₁₂O₆ (glucose)`, ghiChu: '' },
  { p: pu([[1, 'CH₃COOH'], [1, 'C₂H₅OH']], [[1, 'CH₃COOC₂H₅'], [1, 'H₂O']], '⇌'), dau: 'CH₃COOH', dong: 'CH₃COOC₂H₅',
    viec: (m) => `Đun nóng ${m} CH₃COOH với lượng dư C₂H₅OH (xúc tác H₂SO₄ đặc)`, ghiChu: ' (dùng lượng dư C₂H₅OH, xúc tác H₂SO₄ đặc)' },
]
/** Phản ứng hai chất đầu mà chất nào dư cũng không đổi sản phẩm (dùng cho chất dư – chất hết). */
const PHAN_UNG_DU_HET: readonly PhanUngSinh[] = [
  pu([[1, 'Fe'], [2, 'HCl']], [[1, 'FeCl₂'], [1, 'H₂']]),
  pu([[1, 'Zn'], [2, 'HCl']], [[1, 'ZnCl₂'], [1, 'H₂']]),
  pu([[1, 'Mg'], [2, 'HCl']], [[1, 'MgCl₂'], [1, 'H₂']]),
  pu([[2, 'Al'], [6, 'HCl']], [[2, 'AlCl₃'], [3, 'H₂']]),
  pu([[1, 'NaOH'], [1, 'HCl']], [[1, 'NaCl'], [1, 'H₂O']]),
  pu([[2, 'H₂'], [1, 'O₂']], [[2, 'H₂O']]),
  pu([[1, 'CuO'], [1, 'H₂']], [[1, 'Cu'], [1, 'H₂O']]),
  pu([[1, 'Fe'], [1, 'CuSO₄']], [[1, 'FeSO₄'], [1, 'Cu']]),
  pu([[1, 'BaCl₂'], [1, 'H₂SO₄']], [[1, 'BaSO₄'], [2, 'HCl']]),
  pu([[1, 'CaCO₃'], [2, 'HCl']], [[1, 'CaCl₂'], [1, 'CO₂'], [1, 'H₂O']]),
  pu([[1, 'AgNO₃'], [1, 'NaCl']], [[1, 'AgCl'], [1, 'NaNO₃']]),
  pu([[1, 'Cu'], [2, 'AgNO₃']], [[1, 'Cu(NO₃)₂'], [2, 'Ag']]),
]
/** Phản ứng cho câu cân bằng (hệ số nguyên tối giản ≤ 12). */
export const PHAN_UNG_CAN_BANG: readonly PhanUngSinh[] = [
  pu([[2, 'H₂'], [1, 'O₂']], [[2, 'H₂O']]),
  pu([[4, 'Al'], [3, 'O₂']], [[2, 'Al₂O₃']]),
  pu([[2, 'Al'], [6, 'HCl']], [[2, 'AlCl₃'], [3, 'H₂']]),
  pu([[3, 'Fe'], [2, 'O₂']], [[1, 'Fe₃O₄']]),
  pu([[1, 'CH₄'], [2, 'O₂']], [[1, 'CO₂'], [2, 'H₂O']]),
  pu([[1, 'C₃H₈'], [5, 'O₂']], [[3, 'CO₂'], [4, 'H₂O']]),
  pu([[2, 'C₂H₆'], [7, 'O₂']], [[4, 'CO₂'], [6, 'H₂O']]),
  pu([[2, 'C₂H₂'], [5, 'O₂']], [[4, 'CO₂'], [2, 'H₂O']]),
  pu([[1, 'C₂H₅OH'], [3, 'O₂']], [[2, 'CO₂'], [3, 'H₂O']]),
  pu([[2, 'Na'], [2, 'H₂O']], [[2, 'NaOH'], [1, 'H₂']]),
  pu([[2, 'KClO₃']], [[2, 'KCl'], [3, 'O₂']]),
  pu([[1, 'Fe₂O₃'], [3, 'H₂']], [[2, 'Fe'], [3, 'H₂O']]),
  pu([[1, 'Fe₂O₃'], [6, 'HCl']], [[2, 'FeCl₃'], [3, 'H₂O']]),
  pu([[1, 'Al₂O₃'], [6, 'HCl']], [[2, 'AlCl₃'], [3, 'H₂O']]),
  pu([[2, 'Al'], [3, 'CuSO₄']], [[1, 'Al₂(SO₄)₃'], [3, 'Cu']]),
  pu([[2, 'Al'], [3, 'H₂SO₄']], [[1, 'Al₂(SO₄)₃'], [3, 'H₂']]),
  pu([[4, 'NH₃'], [5, 'O₂']], [[4, 'NO'], [6, 'H₂O']]),
  pu([[4, 'FeS₂'], [11, 'O₂']], [[2, 'Fe₂O₃'], [8, 'SO₂']]),
  pu([[3, 'Cu'], [8, 'HNO₃']], [[3, 'Cu(NO₃)₂'], [2, 'NO'], [4, 'H₂O']]),
  pu([[1, 'Fe'], [4, 'HNO₃']], [[1, 'Fe(NO₃)₃'], [1, 'NO'], [2, 'H₂O']]),
  pu([[1, 'Cu'], [2, 'H₂SO₄']], [[1, 'CuSO₄'], [1, 'SO₂'], [2, 'H₂O']]),
  pu([[1, 'MnO₂'], [4, 'HCl']], [[1, 'MnCl₂'], [1, 'Cl₂'], [2, 'H₂O']]),
  pu([[2, 'Fe'], [6, 'H₂SO₄']], [[1, 'Fe₂(SO₄)₃'], [3, 'SO₂'], [6, 'H₂O']]),
  pu([[4, 'Zn'], [10, 'HNO₃']], [[4, 'Zn(NO₃)₂'], [1, 'NH₄NO₃'], [3, 'H₂O']]),
  pu([[2, 'H₂O₂']], [[2, 'H₂O'], [1, 'O₂']]),
  pu([[1, 'C₆H₁₂O₆']], [[2, 'C₂H₅OH'], [2, 'CO₂']]),
]

// ---------------------------------------------------------------- PRNG tất định (mulberry32) + băm FNV-1a

function bam32(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}
function prng(hat: number): () => number {
  let a = hat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function xao<T>(ds: readonly T[], hat: number): T[] {
  const r = prng(hat), a = [...ds]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!] }
  return a
}

// ---------------------------------------------------------------- tập số "đẹp"

const N_DEP = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.5, 2] as const
const N_MOT_LE = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2, 2.5, 3] as const
const T_DEP = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5] as const
const V_ML = [50, 100, 200, 250, 400, 500, 800] as const
const C_M = [0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2] as const
const V_KHI = 24.79
const F = 96500

const so = (muc: 1 | 2, de: string, dapAn: number, giai: string[], meo: string): Nhap => ({ muc, kieu: 'so', de, dapAn: vn(dapAn), giaTri: chuoiChuan(dapAn), giai, meo })
/** Nối danh sách kiểu tiếng Việt: "a", "a và b", "a, b và c". */
const noi = (ds: readonly string[]) => (ds.length <= 1 ? ds.join('') : `${ds.slice(0, -1).join(', ')} và ${ds[ds.length - 1]}`)

// ---------------------------------------------------------------- 1. Đổi số mol ↔ khối lượng
const CHAT_DOI_MOL = ['NaCl', 'H₂O', 'CO₂', 'CaCO₃', 'NaOH', 'HCl', 'H₂SO₄', 'Fe', 'Cu', 'Al', 'Mg', 'Zn', 'KCl', 'Fe₂O₃', 'CuO', 'MgO', 'Al₂O₃', 'NH₃', 'SO₂',
  'Na₂CO₃', 'KOH', 'AgNO₃', 'BaCl₂', 'CuSO₄', 'Ca(OH)₂', 'Al₂(SO₄)₃', 'FeCl₃', 'HNO₃', 'C₆H₁₂O₆', 'CH₃COOH', 'C₂H₅OH', 'CaO'] as const
function doiMolKhoiLuong(): Nhap[] {
  const ra: Nhap[] = []
  for (const ct of CHAT_DOI_MOL) {
    const M = mCua(ct)
    for (const n of N_DEP) {
      const m = lam(n * M)
      if (!dep(m)) continue
      ra.push(so(1, `Tính số mol của ${vn(m)} gam ${ct}.`, n, [`M(${ct}) = ${vn(M)} g/mol.`, `n = m : M = ${vn(m)} : ${vn(M)} = ${vn(n)} mol.`],
        'Số mol n = m : M; M là khối lượng mol (tổng nguyên tử khối), đơn vị g/mol.'))
      ra.push(so(1, `Tính khối lượng (gam) của ${vn(n)} mol ${ct}.`, m, [`M(${ct}) = ${vn(M)} g/mol.`, `m = n · M = ${vn(n)} · ${vn(M)} = ${vn(m)} gam.`],
        'Khối lượng m = n · M.'))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 2. Đổi số mol ↔ thể tích khí (điều kiện chuẩn 25 °C, 1 bar)
const KHI = ['O₂', 'N₂', 'CO₂', 'H₂', 'Cl₂', 'CH₄', 'NH₃', 'SO₂', 'C₂H₄', 'C₂H₂', 'NO₂', 'H₂S', 'C₃H₈'] as const
const DKC = 'ở điều kiện chuẩn (25 °C, 1 bar)'
const MEO_DKC = 'Ở điều kiện chuẩn (25 °C, 1 bar), 1 mol khí chiếm 24,79 lít: n = V : 24,79; V = n · 24,79.'
function doiMolTheTichKhi(): Nhap[] {
  const ra: Nhap[] = []
  for (const ct of KHI) {
    const M = mCua(ct)
    for (const n of [...N_DEP, 1]) {
      const V = lam(n * V_KHI)
      ra.push(so(1, `Tính số mol của ${vn(V)} lít khí ${ct} ${DKC}.`, n, ['Ở điều kiện chuẩn, 1 mol khí chiếm 24,79 lít.', `n = V : 24,79 = ${vn(V)} : 24,79 = ${vn(n)} mol.`], MEO_DKC))
    }
    for (const n of N_MOT_LE) {
      const V = lam(n * V_KHI)
      if (!dep(V)) continue
      ra.push(so(1, `Tính thể tích (lít) của ${vn(n)} mol khí ${ct} ${DKC}.`, V, ['Ở điều kiện chuẩn, 1 mol khí chiếm 24,79 lít.', `V = n · 24,79 = ${vn(n)} · 24,79 = ${vn(V)} lít.`], MEO_DKC))
      const m = lam(n * M)
      if (dep(m)) ra.push(so(2, `Tính thể tích (lít) của ${vn(m)} gam khí ${ct} ${DKC}.`, V,
        [`n = m : M = ${vn(m)} : ${vn(M)} = ${vn(n)} mol.`, `V = n · 24,79 = ${vn(n)} · 24,79 = ${vn(V)} lít.`], MEO_DKC))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 3. Nồng độ mol
const CHAT_TAN_MOL = ['NaOH', 'HCl', 'H₂SO₄', 'NaCl', 'KOH', 'HNO₃', 'CuSO₄', 'KCl', 'Na₂CO₃', 'AgNO₃', 'BaCl₂', 'MgCl₂', 'Na₂SO₄', 'KNO₃'] as const
const MEO_CM = 'Nồng độ mol CM = n : V, với V tính bằng lít (1000 mL = 1 L).'
/** Trần nồng độ mol theo độ tan ở 20 °C (không sinh dung dịch quá bão hoà: CuSO₄ ≈ 1,3 M; Na₂SO₄ ≈ 1,4 M; BaCl₂ ≈ 1,7 M; Na₂CO₃ ≈ 2 M). Vắng ⇒ 2 M. */
const TRAN_CM: Readonly<Record<string, number>> = { 'CuSO₄': 1, 'Na₂SO₄': 1, 'BaCl₂': 1, 'Na₂CO₃': 1 }
function nongDoMol(): Nhap[] {
  const ra: Nhap[] = []
  for (const ct of CHAT_TAN_MOL) {
    const M = mCua(ct)
    for (const V of V_ML) for (const C of C_M) {
      if (C > (TRAN_CM[ct] ?? 2)) continue
      const n = lam(C * V / 1000), L = vn(V / 1000)
      if (dep(n, 5)) ra.push(so(1, `Hoà tan ${vn(n)} mol ${ct} vào nước được ${V} mL dung dịch. Tính nồng độ mol (M) của dung dịch.`, C,
        [`V = ${V} mL = ${L} L.`, `CM = n : V = ${vn(n)} : ${L} = ${vn(C)} M.`], MEO_CM))
      if (dep(n)) ra.push(so(1, `Tính số mol ${ct} có trong ${V} mL dung dịch ${ct} ${vn(C)} M.`, n,
        [`V = ${V} mL = ${L} L.`, `n = CM · V = ${vn(C)} · ${L} = ${vn(n)} mol.`], MEO_CM))
      const m = lam(n * M)
      if (dep(m, 4)) ra.push(so(2, `Hoà tan ${vn(m)} gam ${ct} vào nước được ${V} mL dung dịch. Tính nồng độ mol (M) của dung dịch.`, C,
        [`n = m : M = ${vn(m)} : ${vn(M)} = ${vn(n)} mol.`, `V = ${V} mL = ${L} L.`, `CM = n : V = ${vn(n)} : ${L} = ${vn(C)} M.`], MEO_CM))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 4. Nồng độ phần trăm
const CHAT_TAN_PT = ['NaCl', 'NaOH', 'KOH', 'H₂SO₄', 'HCl', 'CuSO₄', 'KNO₃', 'C₆H₁₂O₆', 'KCl', 'Na₂CO₃'] as const
const M_DD = [50, 80, 100, 120, 150, 200, 250, 300, 400, 500] as const
const C_PT = [2, 4, 5, 8, 10, 12, 15, 16, 20, 25, 30, 40] as const
const MEO_CPT = 'C% = m chất tan : m dung dịch × 100%; m dung dịch = m chất tan + m nước.'
/** Trần C% theo độ tan ở 20 °C (NaCl ≈ 26 %, KCl ≈ 25 %, KNO₃ ≈ 24 %, CuSO₄ ≈ 17 %, Na₂CO₃ ≈ 18 %, HCl đặc ≈ 37 %). Vắng ⇒ 40 %. */
const TRAN_CPT: Readonly<Record<string, number>> = { NaCl: 25, KCl: 25, 'KNO₃': 20, 'CuSO₄': 15, 'Na₂CO₃': 15, HCl: 30 }
function nongDoPhanTram(): Nhap[] {
  const ra: Nhap[] = []
  CHAT_TAN_PT.forEach((ct, k) => {
    for (const mdd of M_DD) for (const C of C_PT) {
      if (C > (TRAN_CPT[ct] ?? 40)) continue
      const mct = lam(mdd * C / 100), mn = lam(mdd - mct)
      if (!dep(mct, 2)) continue
      // Mỗi chất chỉ nhận một phần lưới để ba dạng câu cân đối (không gian vẫn > 50 câu mỗi dạng).
      const vt = (mdd + C + k) % 3
      if (vt === 0) ra.push(so(1, `Hoà tan ${vn(mct)} gam ${ct} vào ${vn(mn)} gam nước. Tính nồng độ phần trăm (C%) của dung dịch thu được.`, C,
        [`m dung dịch = ${vn(mct)} + ${vn(mn)} = ${vn(mdd)} gam.`, `C% = ${vn(mct)} : ${vn(mdd)} × 100% = ${vn(C)}%.`], MEO_CPT))
      if (vt === 1) ra.push(so(1, `Tính khối lượng (gam) ${ct} có trong ${vn(mdd)} gam dung dịch ${ct} ${vn(C)}%.`, mct,
        ['C% = m chất tan : m dung dịch × 100% ⇒ m chất tan = m dung dịch · C% : 100.', `m chất tan = ${vn(mdd)} · ${vn(C)} : 100 = ${vn(mct)} gam.`], MEO_CPT))
      if (vt === 2) ra.push(so(2, `Tính khối lượng (gam) dung dịch ${ct} ${vn(C)}% có chứa ${vn(mct)} gam ${ct}.`, mdd,
        ['C% = m chất tan : m dung dịch × 100% ⇒ m dung dịch = m chất tan · 100 : C%.', `m dung dịch = ${vn(mct)} · 100 : ${vn(C)} = ${vn(mdd)} gam.`], MEO_CPT))
    }
  })
  return ra
}

// ---------------------------------------------------------------- 5. Khối lượng riêng
const D_DEP = [0.8, 0.9, 1.05, 1.1, 1.12, 1.2, 1.25, 1.3, 1.4, 1.5, 1.6, 1.84] as const
const V_DEP = [10, 20, 25, 40, 50, 100, 150, 200, 250, 500] as const
const V_LIT = [0.1, 0.2, 0.25, 0.5, 1, 1.5, 2] as const
const MEO_D = 'Khối lượng riêng D = m : V ⇒ m = D · V và V = m : D (D tính bằng g/mL thì V tính bằng mL; 1 L = 1000 mL).'
function khoiLuongRieng(): Nhap[] {
  const ra: Nhap[] = []
  for (const D of D_DEP) {
    for (const V of V_DEP) {
      const m = lam(D * V)
      if (!dep(m)) continue
      ra.push(so(1, `Một dung dịch có khối lượng riêng ${vn(D)} g/mL. Tính khối lượng (gam) của ${V} mL dung dịch này.`, m,
        ['D = m : V ⇒ m = D · V.', `m = ${vn(D)} · ${V} = ${vn(m)} gam.`], MEO_D))
      ra.push(so(1, `Một chất lỏng có khối lượng riêng ${vn(D)} g/mL. Tính thể tích (mL) của ${vn(m)} gam chất lỏng này.`, V,
        ['D = m : V ⇒ V = m : D.', `V = ${vn(m)} : ${vn(D)} = ${V} mL.`], MEO_D))
    }
    for (const L of V_LIT) {
      const m = lam(D * L * 1000)
      if (dep(m)) ra.push(so(2, `Tính khối lượng (gam) của ${vn(L)} lít một dung dịch có khối lượng riêng ${vn(D)} g/mL.`, m,
        [`V = ${vn(L)} L = ${vn(L * 1000)} mL.`, `m = D · V = ${vn(D)} · ${vn(L * 1000)} = ${vn(m)} gam.`], MEO_D))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 6. Tỉ khối chất khí
const KHI_TI_KHOI = ['H₂', 'CH₄', 'NH₃', 'C₂H₂', 'N₂', 'C₂H₄', 'O₂', 'H₂S', 'CO₂', 'C₃H₈', 'NO₂', 'SO₂', 'Cl₂', 'C₄H₁₀'] as const
const MEO_TK = 'Tỉ khối của A so với B: d = M(A) : M(B); không khí có M = 29 g/mol.'
function tiKhoiKhi(): Nhap[] {
  const ra: Nhap[] = []
  const moc: { ten: string; M: number; chu: string }[] = [
    { ten: 'H₂', M: mCua('H₂'), chu: 'khí H₂' }, { ten: 'O₂', M: mCua('O₂'), chu: 'khí O₂' }, { ten: 'N₂', M: mCua('N₂'), chu: 'khí N₂' },
    { ten: 'CH₄', M: mCua('CH₄'), chu: 'khí CH₄' }, { ten: 'kk', M: 29, chu: 'không khí' },
  ]
  for (const A of KHI_TI_KHOI) {
    const MA = mCua(A)
    for (const B of moc) {
      if (B.ten === A) continue
      const d = lam(MA / B.M)
      if (!dep(d)) continue
      ra.push(so(1, `Tính tỉ khối của khí ${A} so với ${B.chu}.`, d,
        [`M(${A}) = ${vn(MA)} g/mol; M(${B.ten === 'kk' ? 'không khí' : B.ten}) = ${vn(B.M)} g/mol.`, `d = ${vn(MA)} : ${vn(B.M)} = ${vn(d)}.`], MEO_TK))
      ra.push(so(1, `Khí X có tỉ khối so với ${B.chu} là ${vn(d)}. Tính khối lượng mol (g/mol) của X.`, MA,
        [`d = M(X) : M(${B.ten === 'kk' ? 'không khí' : B.ten}) ⇒ M(X) = d · M(${B.ten === 'kk' ? 'không khí' : B.ten}).`, `M(X) = ${vn(d)} · ${vn(B.M)} = ${vn(MA)} g/mol.`], MEO_TK))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 7. Tỉ lệ mol theo phương trình
const MEO_TL = 'Theo phương trình, tỉ lệ số mol các chất bằng tỉ lệ hệ số: n(B) = n(A) · b : a.'
function tiLeMolPhuongTrinh(): Nhap[] {
  const ra: Nhap[] = []
  for (const p of PHAN_UNG_TINH) {
    const pt = chuPhanUng(p)
    for (const [a, A] of p.trai) {
      for (const t of T_DEP) {
        const nA = lam(a * t)
        for (const [b, B] of p.phai) ra.push(so(1, `Cho phản ứng: ${pt}. Tính số mol ${B} tạo thành khi có ${vn(nA)} mol ${A} phản ứng hết.`, lam(b * t),
          [`Tỉ lệ hệ số ${A} : ${B} = ${a} : ${b}.`, `n(${B}) = ${vn(nA)} · ${b} : ${a} = ${vn(b * t)} mol.`], MEO_TL))
        for (const [b, B] of p.trai) if (B !== A) ra.push(so(1, `Cho phản ứng: ${pt}. Tính số mol ${B} cần dùng để phản ứng vừa đủ với ${vn(nA)} mol ${A}.`, lam(b * t),
          [`Tỉ lệ hệ số ${A} : ${B} = ${a} : ${b}.`, `n(${B}) = ${vn(nA)} · ${b} : ${a} = ${vn(b * t)} mol.`], MEO_TL))
        for (const [b, B] of p.phai) ra.push(so(2, `Cho phản ứng: ${pt}. Để thu được ${vn(b * t)} mol ${B} thì cần ít nhất bao nhiêu mol ${A}?`, nA,
          [`Tỉ lệ hệ số ${B} : ${A} = ${b} : ${a}.`, `n(${A}) = ${vn(b * t)} · ${a} : ${b} = ${vn(nA)} mol.`], MEO_TL))
      }
    }
  }
  return ra
}

// ---------------------------------------------------------------- 8. Bảo toàn khối lượng
const MEO_BTKL = 'Định luật bảo toàn khối lượng: tổng khối lượng các chất tham gia bằng tổng khối lượng các chất sản phẩm.'
function baoToanKhoiLuong(): Nhap[] {
  const ra: Nhap[] = []
  const dsPu: { p: PhanUngSinh; motChat?: (m: string) => string }[] = [
    ...PHAN_UNG_TINH.filter((p) => !p.trai.some(([, c]) => c === 'Na')).map((p) => ({ p })),
    ...PHAN_UNG_HIEU_SUAT.filter((x) => x.p.trai.length === 1).map((x) => ({ p: x.p, motChat: (m: string) => `${x.viec(m)} hoàn toàn` })),
  ]
  for (const { p, motChat } of dsPu) {
    const pt = chuPhanUng(p), chat = chatCua(p), heSo = heSoCua(p), n = p.trai.length
    if (chat.some((c) => !Number.isFinite(mCua(c)))) continue
    for (const t of T_DEP) {
      const m = chat.map((c, i) => lam(heSo[i]! * t * mCua(c)))
      if (!m.every((x) => dep(x))) continue
      chat.forEach((an, k) => {
        const kg = (i: number) => (i === k ? `m gam ${an}` : `${vn(m[i]!)} gam ${chat[i]}`)
        const trai = chat.slice(0, n).map((_, i) => kg(i)), phai = chat.slice(n).map((_, i) => kg(n + i))
        let de: string
        if (n === 1 && motChat) de = `Cho phản ứng: ${pt}. ${motChat(trai[0]!)}, thu được ${noi(phai)}. Tính m.`
        else if (k < n) {
          const khac = trai.filter((_, i) => i !== k)
          de = `Cho phản ứng: ${pt}. Cho ${noi(khac)} phản ứng vừa đủ với m gam ${an}, thu được ${noi(phai)}. Tính m.`
        } else de = `Cho phản ứng: ${pt}. Cho ${noi(trai)} phản ứng vừa đủ, thu được ${noi(phai)}. Tính m.`
        const tongTrai = lam(m.slice(0, n).reduce((s2, x) => s2 + x, 0)), tongPhai = lam(m.slice(n).reduce((s2, x) => s2 + x, 0))
        const giai = [`Bảo toàn khối lượng: tổng khối lượng chất tham gia = tổng khối lượng sản phẩm.`,
          k < n ? `m = ${vn(tongPhai)} − ${vn(lam(tongTrai - m[k]!))} = ${vn(m[k]!)} gam.` : `m = ${vn(tongTrai)} − ${vn(lam(tongPhai - m[k]!))} = ${vn(m[k]!)} gam.`]
        ra.push(so(chat.length <= 3 ? 1 : 2, de, m[k]!, giai, MEO_BTKL))
      })
    }
  }
  return ra
}

// ---------------------------------------------------------------- 9. Hiệu suất phản ứng
const H_DEP = [50, 60, 70, 75, 80, 85, 90, 95] as const
const MEO_H = 'Hiệu suất H = lượng thực tế : lượng lí thuyết × 100%. Tính sản phẩm thì nhân H; tính ngược nguyên liệu thì chia H.'
function hieuSuat(): Nhap[] {
  const ra: Nhap[] = []
  for (const { p, dau, dong, viec, ghiChu } of PHAN_UNG_HIEU_SUAT) {
    const pt = chuPhanUng(p)
    const a = p.trai.find(([, c]) => c === dau)![0], b = p.phai.find(([, c]) => c === dong)![0]
    const MA = mCua(dau), MB = mCua(dong)
    for (const t of T_DEP) for (const H of H_DEP) {
      const nA = lam(a * t), mA = lam(nA * MA), mLt = lam(b * t * MB), mTt = lam(mLt * H / 100)
      if (!dep(mA) || !dep(mLt) || !dep(mTt)) continue
      ra.push(so(1, `Cho phản ứng: ${pt}. ${viec(`${vn(mA)} gam`)}, thu được ${vn(mTt)} gam ${dong}. Tính hiệu suất phản ứng (%).`, H,
        [`n(${dau}) = ${vn(mA)} : ${vn(MA)} = ${vn(nA)} mol ⇒ n(${dong}) lí thuyết = ${vn(nA)} · ${b} : ${a} = ${vn(b * t)} mol.`,
          `m(${dong}) lí thuyết = ${vn(b * t)} · ${vn(MB)} = ${vn(mLt)} gam.`, `H = ${vn(mTt)} : ${vn(mLt)} × 100% = ${H}%.`], MEO_H))
      ra.push(so(1, `Cho phản ứng: ${pt}. ${viec(`${vn(mA)} gam`)} với hiệu suất ${H}%. Tính khối lượng (gam) ${dong} thu được.`, mTt,
        [`n(${dau}) = ${vn(mA)} : ${vn(MA)} = ${vn(nA)} mol ⇒ n(${dong}) lí thuyết = ${vn(nA)} · ${b} : ${a} = ${vn(b * t)} mol.`,
          `m(${dong}) lí thuyết = ${vn(b * t)} · ${vn(MB)} = ${vn(mLt)} gam.`, `m thực tế = ${vn(mLt)} · ${H} : 100 = ${vn(mTt)} gam.`], MEO_H))
      ra.push(so(2, `Cho phản ứng: ${pt}. Để thu được ${vn(mTt)} gam ${dong} với hiệu suất ${H}%, cần dùng bao nhiêu gam ${dau}${ghiChu}?`, mA,
        [`m(${dong}) lí thuyết = ${vn(mTt)} · 100 : ${H} = ${vn(mLt)} gam ⇒ n(${dong}) = ${vn(b * t)} mol.`,
          `n(${dau}) = ${vn(b * t)} · ${a} : ${b} = ${vn(nA)} mol ⇒ m = ${vn(nA)} · ${vn(MA)} = ${vn(mA)} gam.`], MEO_H))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 10. Chất dư, chất hết
const MEO_DU = 'So sánh n(A) : a và n(B) : b; chất có tỉ số nhỏ hơn phản ứng hết, mọi tính toán sản phẩm theo chất hết.'
function chatDuHet(): Nhap[] {
  const ra: Nhap[] = []
  for (const p of PHAN_UNG_DU_HET) {
    const pt = chuPhanUng(p)
    const [[a, A], [b, B]] = p.trai as [readonly [number, string], readonly [number, string]]
    for (const t1 of T_DEP) for (const t2 of T_DEP) {
      if (t1 === t2) continue
      const nA = lam(a * t1), nB = lam(b * t2), tHet = Math.min(t1, t2)
      const het = t1 < t2 ? A : B, du = t1 < t2 ? B : A, heSoDu = t1 < t2 ? b : a, conDu = lam(heSoDu * Math.abs(t1 - t2))
      for (const [c, C] of p.phai) ra.push(so(1, `Cho phản ứng: ${pt}. Cho ${vn(nA)} mol ${A} phản ứng với ${vn(nB)} mol ${B} (phản ứng xảy ra hoàn toàn). Tính số mol ${C} tạo thành.`,
        lam(c * tHet), [`So sánh: ${vn(nA)} : ${a} = ${vn(t1)} và ${vn(nB)} : ${b} = ${vn(t2)} ⇒ ${het} hết, ${du} dư.`, `n(${C}) = ${vn(tHet)} · ${c} = ${vn(c * tHet)} mol.`], MEO_DU))
      ra.push(so(2, `Cho phản ứng: ${pt}. Cho ${vn(nA)} mol ${A} phản ứng với ${vn(nB)} mol ${B} (phản ứng xảy ra hoàn toàn). Tính số mol chất còn dư sau phản ứng.`,
        conDu, [`So sánh: ${vn(nA)} : ${a} = ${vn(t1)} và ${vn(nB)} : ${b} = ${vn(t2)} ⇒ ${het} hết, ${du} dư.`,
          `n(${du}) dư = ${vn(t1 < t2 ? nB : nA)} − ${vn(tHet)} · ${heSoDu} = ${vn(conDu)} mol.`], MEO_DU))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 11. Phần trăm khối lượng
const CHAT_PHAN_TRAM = ['CaCO₃', 'Fe₂O₃', 'CuO', 'SO₂', 'SO₃', 'NaOH', 'MgO', 'CH₄', 'C₂H₆', 'CH₃OH', 'CuSO₄', 'NH₄NO₃', 'C₆H₁₂O₆', 'CH₃COOH', 'MgSO₄',
  'Fe₂(SO₄)₃', 'CaC₂', 'Fe₃O₄', 'H₂O', 'CO₂', 'NaCl', 'MgCO₃', 'Al₂O₃', 'KOH', 'C₃H₈', 'C₂H₄'] as const
const CAP_HON_HOP: readonly [string, string][] = [['Fe', 'Cu'], ['Mg', 'Al'], ['Mg', 'Fe'], ['Zn', 'Cu'], ['Al', 'Fe'], ['Mg', 'Cu'], ['MgO', 'CuO'], ['CaCO₃', 'MgCO₃'],
  ['NaCl', 'KCl'], ['Fe', 'Fe₂O₃'], ['CuO', 'Fe₂O₃'], ['Al', 'Cu'], ['Fe', 'Zn'], ['CH₄', 'C₂H₄']]
const MEO_PT = '%m(X) = m(X) : m(cả hỗn hợp hoặc cả phân tử) × 100%.'
function phanTramKhoiLuong(): Nhap[] {
  const ra: Nhap[] = []
  for (const ct of CHAT_PHAN_TRAM) {
    const M = mCua(ct)
    for (const [e, k] of Object.entries(tpCua(ct))) {
      const pt = lam(k * NTK[e]! / M * 100)
      if (dep(pt)) ra.push(so(1, `Tính phần trăm khối lượng của nguyên tố ${e} trong ${ct}.`, pt,
        [`M(${ct}) = ${vn(M)} g/mol; khối lượng ${e} trong 1 mol là ${k} · ${vn(NTK[e]!)} = ${vn(k * NTK[e]!)} gam.`, `%m(${e}) = ${vn(k * NTK[e]!)} : ${vn(M)} × 100% = ${vn(pt)}%.`], MEO_PT))
    }
  }
  for (const [A, B] of CAP_HON_HOP) {
    const MA = mCua(A), MB = mCua(B)
    for (const nA of T_DEP) for (const nB of T_DEP) {
      const mA = lam(nA * MA), mB = lam(nB * MB), pt = lam(mA / (mA + mB) * 100)
      if (dep(pt) && dep(mA) && dep(mB)) ra.push(so(2, `Hỗn hợp X gồm ${vn(nA)} mol ${A} và ${vn(nB)} mol ${B}. Tính phần trăm khối lượng của ${A} trong X.`, pt,
        [`m(${A}) = ${vn(nA)} · ${vn(MA)} = ${vn(mA)} gam; m(${B}) = ${vn(nB)} · ${vn(MB)} = ${vn(mB)} gam.`, `%m(${A}) = ${vn(mA)} : ${vn(mA + mB)} × 100% = ${vn(pt)}%.`], MEO_PT))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 12. Độ bất bão hoà
const SO_DUOI = '₀₁₂₃₄₅₆₇₈₉'
const chiSo = (k: number) => (k === 1 ? '' : String(k).split('').map((d) => SO_DUOI[Number(d)]).join(''))
function doBatBaoHoa(): Nhap[] {
  const ra: Nhap[] = []
  for (let c = 2; c <= 10; c++) for (let k = 0; k <= 5; k++) for (const o of [0, 1, 2]) for (const nTo of [0, 1]) for (const cl of [0, 1]) {
    if (k > c) continue
    const h = 2 * c + 2 + nTo - cl - 2 * k
    if (h < 2) continue
    const ct = `C${chiSo(c)}H${chiSo(h)}${cl ? `Cl${chiSo(cl)}` : ''}${nTo ? `N${chiSo(nTo)}` : ''}${o ? `O${chiSo(o)}` : ''}`
    const congThuc = `k = (2·${c} + 2${nTo ? ` + ${nTo}` : ''} − ${h}${cl ? ` − ${cl}` : ''}) : 2 = ${k}`
    ra.push(so(k <= 2 && !nTo && !cl ? 1 : 2, `Tính độ bất bão hoà k (tổng số liên kết π và số vòng) của phân tử có công thức ${ct}.`, k,
      [`k = (2C + 2 + N − H − X) : 2 (X là số nguyên tử halogen; O không ảnh hưởng).`, `${congThuc}.`],
      'Độ bất bão hoà k = (2C + 2 + N − H − X) : 2 = số liên kết π + số vòng.'))
  }
  // k = 0 cho độ bất bão hoà bằng 0: đáp án phải DƯƠNG ⇒ bỏ các câu đó (giữ không gian ≥ 50 câu).
  return ra.filter((x) => Number(x.giaTri) > 0)
}

// ---------------------------------------------------------------- 13. pH và nồng độ ion (acid/base mạnh, nồng độ 10^−k, pH nguyên)
const MEO_PH = 'pH = −lg[H⁺]; [H⁺] = 10^(−pH). Base: pOH = −lg[OH⁻], pH = 14 − pOH. H₂SO₄ cho 2H⁺, Ba(OH)₂ cho 2OH⁻.'
function phNongDoIon(): Nhap[] {
  const ra: Nhap[] = []
  const acid: readonly [string, 1 | 2][] = [['HCl', 1], ['HNO₃', 1], ['H₂SO₄', 2]]
  const base: readonly [string, 1 | 2][] = [['NaOH', 1], ['KOH', 1], ['Ba(OH)₂', 2]]
  for (const [ct, h] of acid) for (let p = 1; p <= 4; p++) {
    const C = lam(10 ** -p / h)
    ra.push(so(h === 1 ? 1 : 2, `Tính pH của dung dịch ${ct} ${vn(C)} M (coi ${ct} phân li hoàn toàn).`, p,
      [`[H⁺] = ${h === 2 ? `2 · ${vn(C)} = ` : ''}${vn(10 ** -p)} M.`, `pH = −lg(${vn(10 ** -p)}) = ${p}.`], MEO_PH))
    if (dep(C)) ra.push(so(h === 1 ? 1 : 2, `Dung dịch ${ct} có pH = ${p}. Tính nồng độ mol (M) của ${ct} (coi ${ct} phân li hoàn toàn).`, C,
      [`[H⁺] = 10^(−${p}) = ${vn(10 ** -p)} M.`, `C(${ct}) = ${vn(10 ** -p)}${h === 2 ? ' : 2' : ''} = ${vn(C)} M.`], MEO_PH))
    for (const V of [0.1, 0.2, 0.5, 1, 2, 5, 10]) {
      const n = lam(10 ** -p * V / h)
      if (dep(n, 5)) ra.push(so(2, `Hoà tan ${vn(n)} mol ${ct} vào nước được ${vn(V)} lít dung dịch. Tính pH của dung dịch (coi ${ct} phân li hoàn toàn).`, p,
        [`[H⁺] = ${h === 2 ? '2 · ' : ''}${vn(n)} : ${vn(V)} = ${vn(10 ** -p)} M.`, `pH = −lg(${vn(10 ** -p)}) = ${p}.`], MEO_PH))
    }
  }
  for (const [ct, h] of base) for (let q = 1; q <= 4; q++) {
    const C = lam(10 ** -q / h), pH = 14 - q
    ra.push(so(h === 1 ? 1 : 2, `Tính pH của dung dịch ${ct} ${vn(C)} M (coi ${ct} phân li hoàn toàn).`, pH,
      [`[OH⁻] = ${h === 2 ? `2 · ${vn(C)} = ` : ''}${vn(10 ** -q)} M ⇒ pOH = ${q}.`, `pH = 14 − ${q} = ${pH}.`], MEO_PH))
    if (dep(C)) ra.push(so(h === 1 ? 1 : 2, `Dung dịch ${ct} có pH = ${pH}. Tính nồng độ mol (M) của ${ct} (coi ${ct} phân li hoàn toàn).`, C,
      [`pOH = 14 − ${pH} = ${q} ⇒ [OH⁻] = ${vn(10 ** -q)} M.`, `C(${ct}) = ${vn(10 ** -q)}${h === 2 ? ' : 2' : ''} = ${vn(C)} M.`], MEO_PH))
  }
  return ra
}

// ---------------------------------------------------------------- 14. Pha loãng dung dịch
const MEO_PL = 'Pha loãng bằng nước: số mol (khối lượng) chất tan không đổi ⇒ C₁V₁ = C₂V₂ (hoặc C₁% · m₁ = C₂% · m₂).'
function phaLoang(): Nhap[] {
  const ra: Nhap[] = []
  const chat = ['HCl', 'NaOH', 'H₂SO₄', 'NaCl', 'KOH', 'HNO₃'] as const
  chat.forEach((ct, k) => {
    for (const C1 of [0.4, 0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]) for (const V1 of [10, 20, 25, 50, 100]) for (const f of [2, 2.5, 4, 5, 8, 10]) {
      if ((V1 + f * 10 + k) % 2) continue // mỗi chất nửa lưới, đủ đa dạng
      const V2 = lam(V1 * f), C2 = lam(C1 / f)
      if (!dep(C2) || !Number.isInteger(V2)) continue
      ra.push(so(1, `Pha loãng ${V1} mL dung dịch ${ct} ${vn(C1)} M bằng nước thành ${vn(V2)} mL dung dịch. Tính nồng độ mol (M) của dung dịch sau khi pha loãng.`, C2,
        [`n(${ct}) = ${vn(C1)} · ${vn(V1 / 1000)} = ${vn(C1 * V1 / 1000)} mol (không đổi khi pha loãng).`, `C₂ = ${vn(C1 * V1 / 1000)} : ${vn(V2 / 1000)} = ${vn(C2)} M.`], MEO_PL))
      ra.push(so(1, `Cần lấy bao nhiêu mL dung dịch ${ct} ${vn(C1)} M để pha loãng thành ${vn(V2)} mL dung dịch ${ct} ${vn(C2)} M?`, V1,
        ['Số mol chất tan không đổi khi pha loãng: C₁V₁ = C₂V₂.', `V₁ = ${vn(C2)} · ${vn(V2)} : ${vn(C1)} = ${V1} mL.`], MEO_PL))
      const Vn = lam(V2 - V1)
      if (Vn > 0) ra.push(so(2, `Thêm ${vn(Vn)} mL nước vào ${V1} mL dung dịch ${ct} ${vn(C1)} M (coi thể tích dung dịch sau khi pha bằng tổng thể tích). Tính nồng độ mol (M) của dung dịch thu được.`, C2,
        [`V sau = ${V1} + ${vn(Vn)} = ${vn(V2)} mL.`, `C₂ = ${vn(C1)} · ${V1} : ${vn(V2)} = ${vn(C2)} M.`], MEO_PL))
    }
    for (const C1 of [10, 12, 15, 20, 24, 25, 30, 40]) for (const m1 of [50, 80, 100, 120, 150, 200]) for (const f of [2, 4, 5, 8]) {
      if ((m1 + C1 + k) % 3 || C1 > (TRAN_CPT[ct] ?? 40)) continue
      const C2 = lam(C1 / f), mn = lam(m1 * (f - 1))
      if (dep(C2)) ra.push(so(2, `Thêm ${vn(mn)} gam nước vào ${m1} gam dung dịch ${ct} ${vn(C1)}%. Tính nồng độ phần trăm (C%) của dung dịch thu được.`, C2,
        [`m chất tan = ${m1} · ${vn(C1)} : 100 = ${vn(m1 * C1 / 100)} gam (không đổi).`, `C% = ${vn(m1 * C1 / 100)} : ${vn(m1 + mn)} × 100% = ${vn(C2)}%.`], MEO_PL))
    }
  })
  return ra
}

// ---------------------------------------------------------------- 15. Điện phân (định luật Faraday)
const MEO_F = 'Định luật Faraday: n(e) = I · t : F (F = 96 500 C/mol); m = A · n(e) : n, với n là số electron trao đổi của ion kim loại.'
function dienPhan(): Nhap[] {
  const ra: Nhap[] = []
  const muoi: readonly { ct: string; kl: string; e: 1 | 2 }[] = [{ ct: 'CuSO₄', kl: 'Cu', e: 2 }, { ct: 'CuCl₂', kl: 'Cu', e: 2 }, { ct: 'AgNO₃', kl: 'Ag', e: 1 }]
  const I_DEP = [0.5, 1, 1.93, 2, 2.5, 3.86, 4, 5, 9.65, 10]
  const NE = [0.01, 0.02, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]
  for (const { ct, kl, e } of muoi) for (const I of I_DEP) for (const ne of NE) {
    const t = lam(ne * F / I)
    if (!Number.isInteger(t) || t > 20000) continue
    const A = NTK[kl]!, m = lam(A * ne / e)
    if (!dep(m)) continue
    ra.push(so(1, `Điện phân dung dịch ${ct} (điện cực trơ) với cường độ dòng điện ${vn(I)} A trong ${t} giây. Tính khối lượng (gam) ${kl} bám vào cathode. Cho F = 96 500 C/mol.`, m,
      [`n(e) = I · t : F = ${vn(I)} · ${t} : 96 500 = ${vn(ne)} mol.`, `m(${kl}) = ${A} · ${vn(ne)} : ${e} = ${vn(m)} gam.`], MEO_F))
    ra.push(so(2, `Điện phân dung dịch ${ct} (điện cực trơ) với cường độ dòng điện ${vn(I)} A. Sau bao nhiêu giây thì thu được ${vn(m)} gam ${kl} ở cathode? Cho F = 96 500 C/mol.`, t,
      [`n(e) = ${e} · ${vn(m)} : ${A} = ${vn(ne)} mol.`, `t = n(e) · F : I = ${vn(ne)} · 96 500 : ${vn(I)} = ${t} giây.`], MEO_F))
  }
  return ra
}

// ---------------------------------------------------------------- 16. Giá trị trung bình
/** Khí trộn được với nhau ở điều kiện thường (bỏ NH₃, H₂S, Cl₂ — chúng phản ứng với nhau hoặc với khí khác trong danh sách). */
const KHI_TB = ['H₂', 'CH₄', 'C₂H₂', 'N₂', 'C₂H₄', 'O₂', 'CO₂', 'C₃H₈', 'SO₂'] as const
const MEO_TB = 'Khối lượng mol trung bình M = tổng khối lượng : tổng số mol; M luôn nằm giữa M nhỏ nhất và M lớn nhất.'
function giaTriTrungBinh(): Nhap[] {
  const ra: Nhap[] = []
  for (let i = 0; i < KHI_TB.length; i++) for (let j = 0; j < KHI_TB.length; j++) {
    if (i === j) continue
    const A = KHI_TB[i]!, B = KHI_TB[j]!, MA = mCua(A), MB = mCua(B)
    if (MA === MB) continue
    for (const a of T_DEP) for (const b of T_DEP) {
      if ((Math.round(a * 100 + b * 100) + i + j) % 4) continue // một phần tư lưới — đủ đa dạng, tránh lặp
      const Mtb = lam((a * MA + b * MB) / (a + b))
      if (dep(Mtb) && i < j) ra.push(so(1, `Hỗn hợp khí X gồm ${vn(a)} mol ${A} và ${vn(b)} mol ${B}. Tính khối lượng mol trung bình (g/mol) của X.`, Mtb,
        [`m(X) = ${vn(a)} · ${vn(MA)} + ${vn(b)} · ${vn(MB)} = ${vn(a * MA + b * MB)} gam; n(X) = ${vn(a + b)} mol.`, `M = ${vn(a * MA + b * MB)} : ${vn(a + b)} = ${vn(Mtb)} g/mol.`], MEO_TB))
    }
    for (const x of [20, 25, 40, 50, 60, 75, 80]) {
      const Mtb = lam(x / 100 * MA + (1 - x / 100) * MB), d = lam(Mtb / 2)
      if (dep(d)) ra.push(so(2, `Hỗn hợp khí X gồm ${A} và ${B} có tỉ khối so với H₂ là ${vn(d)}. Tính phần trăm số mol của ${A} trong X.`, x,
        [`M(X) = ${vn(d)} · 2 = ${vn(Mtb)} g/mol.`, `Gọi phần mol ${A} là a: ${vn(MA)}a + ${vn(MB)}(1 − a) = ${vn(Mtb)} ⇒ a = ${vn(x / 100)} ⇒ ${x}%.`], MEO_TB))
    }
  }
  return ra
}

// ---------------------------------------------------------------- 17. Thế điện cực, pin điện (E° SGK)
const CAP_OXH: readonly { cap: string; e: number; kl: string }[] = [
  { cap: 'Mg²⁺/Mg', e: -2.37, kl: 'Mg' }, { cap: 'Al³⁺/Al', e: -1.66, kl: 'Al' }, { cap: 'Zn²⁺/Zn', e: -0.76, kl: 'Zn' }, { cap: 'Fe²⁺/Fe', e: -0.44, kl: 'Fe' },
  { cap: 'Ni²⁺/Ni', e: -0.26, kl: 'Ni' }, { cap: 'Pb²⁺/Pb', e: -0.13, kl: 'Pb' }, { cap: '2H⁺/H₂', e: 0, kl: 'H₂' }, { cap: 'Cu²⁺/Cu', e: 0.34, kl: 'Cu' },
  { cap: 'Ag⁺/Ag', e: 0.8, kl: 'Ag' },
]
/** E° SGK dùng để sinh câu (test có bảng riêng để đối chiếu). */
export const E0_SGK: Readonly<Record<string, number>> = Object.fromEntries(CAP_OXH.map((x) => [x.cap, x.e]))
const MEO_PIN = 'Sức điện động chuẩn E°pin = E°(cathode) − E°(anode) = E° lớn − E° nhỏ (luôn dương).'
function theDienCucPin(): Nhap[] {
  const ra: Nhap[] = []
  for (let i = 0; i < CAP_OXH.length; i++) for (let j = 0; j < CAP_OXH.length; j++) {
    if (i === j) continue
    const X = CAP_OXH[i]!, Y = CAP_OXH[j]!
    const lon = X.e > Y.e ? X : Y, nho = X.e > Y.e ? Y : X, E = lam(lon.e - nho.e)
    ra.push(so(1, `Cho thế điện cực chuẩn: E°(${X.cap}) = ${vnDau(X.e)} V; E°(${Y.cap}) = ${vnDau(Y.e)} V. Tính sức điện động chuẩn (V) của pin điện hoá tạo bởi hai cặp này.`, E,
      [`Cặp ${lon.cap} có E° lớn hơn là cực dương (cathode); cặp ${nho.cap} là cực âm (anode).`, `E°pin = ${vnDau(lon.e)} − (${vnDau(nho.e)}) = ${vn2(E)} V.`], MEO_PIN))
  }
  for (const cat of CAP_OXH.filter((x) => x.e > 0)) for (const an of CAP_OXH.filter((x) => x.e < cat.e)) {
    const E = lam(cat.e - an.e)
    ra.push(so(2, `Pin điện hoá tạo bởi hai cặp ${an.cap} và ${cat.cap} có sức điện động chuẩn ${vn2(E)} V. Biết E°(${an.cap}) = ${vnDau(an.e)} V và cặp ${cat.cap} là cực dương. Tính E°(${cat.cap}) (V).`, cat.e,
      [`E°pin = E°(${cat.cap}) − E°(${an.cap}).`, `E°(${cat.cap}) = ${vn2(E)} + (${vnDau(an.e)}) = ${vn2(cat.e)} V.`], MEO_PIN))
  }
  return ra
}

// ---------------------------------------------------------------- 18. Tốc độ phản ứng
const MEO_V = 'Tốc độ trung bình v = −(1/a) · ΔC(chất đầu) : Δt = (1/b) · ΔC(sản phẩm) : Δt (a, b là hệ số trong phương trình).'
function tocDoPhanUng(): Nhap[] {
  const ra: Nhap[] = []
  const pu1: readonly { pt: string; A: string }[] = [{ pt: 'Br₂ + HCOOH → 2HBr + CO₂', A: 'Br₂' }, { pt: 'C₄H₉Cl + H₂O → C₄H₉OH + HCl', A: 'C₄H₉Cl' },
    { pt: 'CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH', A: 'NaOH' }]
  const pu2: readonly { pt: string; A: string; a: number; B: string; b: number }[] = [{ pt: '2N₂O₅ → 4NO₂ + O₂', A: 'N₂O₅', a: 2, B: 'O₂', b: 1 },
    { pt: '2H₂O₂ → 2H₂O + O₂', A: 'H₂O₂', a: 2, B: 'O₂', b: 1 }, { pt: '2N₂O₅ → 4NO₂ + O₂', A: 'N₂O₅', a: 2, B: 'NO₂', b: 4 }]
  const DC = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.24, 0.3, 0.4, 0.5]
  const TG = [10, 20, 25, 30, 40, 50, 60, 80, 100, 120, 200]
  for (const { pt, A } of pu1) for (const dC of DC) for (const t of TG) {
    const v = lam(dC / t)
    const C1 = lam(dC + [0.1, 0.2, 0.5][Math.round(dC * 100 + t) % 3]!)
    if (dep(v) && v >= 0.001) ra.push(so(1, `Cho phản ứng: ${pt}. Nồng độ ban đầu của ${A} là ${vn(C1)} M; sau ${t} giây, nồng độ ${A} còn ${vn(C1 - dC)} M. Tính tốc độ trung bình (M/s) của phản ứng trong khoảng thời gian đó.`, v,
      [`ΔC(${A}) = ${vn(C1)} − ${vn(C1 - dC)} = ${vn(dC)} M.`, `v = ${vn(dC)} : ${t} = ${vn(v)} M/s.`], MEO_V))
  }
  for (const { pt, A, a, B, b } of pu2) for (const dC of DC) for (const t of TG) {
    if (B === 'O₂' && a === 2) {
      const v = lam(dC / (a * t)), C1 = lam(dC + 0.5)
      if (dep(v) && v >= 0.001) ra.push(so(2, `Cho phản ứng: ${pt}. Sau ${t} giây, nồng độ ${A} giảm từ ${vn(C1)} M xuống ${vn(C1 - dC)} M. Tính tốc độ trung bình (M/s) của phản ứng trong khoảng thời gian đó.`, v,
        [`ΔC(${A}) = ${vn(dC)} M; hệ số của ${A} là ${a}.`, `v = ${vn(dC)} : (${a} · ${t}) = ${vn(v)} M/s.`], MEO_V))
    }
    const v2 = lam(dC / (b * t))
    if (dep(v2) && v2 >= 0.001) ra.push(so(2, `Cho phản ứng: ${pt}. Sau ${t} giây, nồng độ ${B} tăng từ 0 lên ${vn(dC)} M. Tính tốc độ trung bình (M/s) của phản ứng trong khoảng thời gian đó.`, v2,
      [`ΔC(${B}) = ${vn(dC)} M; hệ số của ${B} là ${b}.`, `v = ${vn(dC)} : (${b} · ${t}) = ${vn(v2)} M/s.`], MEO_V))
  }
  return ra
}

// ---------------------------------------------------------------- 19. Cân bằng phương trình (trắc nghiệm 4 phương án)
const MEO_CB = 'Đếm số nguyên tử mỗi nguyên tố ở hai vế; hệ số phải là số nguyên dương tối giản.'
/** Ba bộ hệ số SAI (không cân bằng, khác nhau, không tỉ lệ với bộ đúng) đổi từ bộ đúng — tất định theo `hat`. */
function heSoNhieu(p: PhanUngSinh, hat: number): number[][] {
  const dung = heSoCua(p), ung: number[][] = []
  for (let i = 0; i < dung.length; i++) for (const d of [1, -1, 2]) {
    const x = [...dung]; x[i] = x[i]! + d
    if (x[i]! >= 1) ung.push(x)
  }
  for (let i = 0; i < dung.length; i++) for (let j = i + 1; j < dung.length; j++) if (dung[i] !== dung[j]) { const x = [...dung]; [x[i], x[j]] = [x[j]!, x[i]!]; ung.push(x) }
  const khoa = new Set<string>([dung.join(',')]), ra: number[][] = []
  for (const x of xao(ung, hat)) {
    const k = x.join(',')
    if (khoa.has(k) || canBangVoi(p, x)) continue
    khoa.add(k); ra.push(x)
    if (ra.length === 3) break
  }
  return ra
}
function canBangPhuongTrinh(): Nhap[] {
  const ra: Nhap[] = []
  PHAN_UNG_CAN_BANG.forEach((p, ip) => {
    const dung = heSoCua(p)
    if (!canBangVoi(p, dung) || dung.reduce(ucln) !== 1) return
    for (let bien = 0; bien < 3; bien++) {
      const hat = bam32(`cb|${ip}|${bien}`)
      const nhieu = heSoNhieu(p, hat)
      if (nhieu.length < 3) continue
      const thuTu = xao([0, 1, 2, 3], hat ^ 0x9e3779b9)
      const ds = [dung, ...nhieu]
      const pa = Object.fromEntries(CHU_CAI.map((k, i) => [k, chuPhanUng(p, ds[thuTu[i]!])])) as Record<ChuCai, string>
      const dapAn = CHU_CAI[thuTu.indexOf(0)]!
      ra.push({ muc: 1, kieu: 'tn', de: 'Phương trình hoá học nào sau đây được cân bằng đúng (hệ số nguyên, tối giản)?', pa, dapAn, giaTri: '',
        giai: [`Phương trình đúng: ${chuPhanUng(p)}.`, 'Đếm lại từng nguyên tố ở hai vế: mọi nguyên tố đều bằng nhau; các phương án còn lại lệch số nguyên tử.'], meo: MEO_CB })
      const tong = dung.reduce((s, x) => s + x, 0)
      const saiTong = xao([...new Set(nhieu.map((x) => x.reduce((s, y) => s + y, 0)).concat([tong - 2, tong - 1, tong + 1, tong + 2, tong + 3]))]
        .filter((x) => x > 0 && x !== tong), hat ^ 0x85ebca6b).slice(0, 3)
      if (saiTong.length < 3) continue
      const dsTong = [tong, ...saiTong]
      const pa2 = Object.fromEntries(CHU_CAI.map((k, i) => [k, String(dsTong[thuTu[i]!])])) as Record<ChuCai, string>
      ra.push({ muc: 2, kieu: 'tn', de: `Cho sơ đồ phản ứng: ${chatCua(p).slice(0, p.trai.length).join(' + ')} ${p.mui ?? '→'} ${chatCua(p).slice(p.trai.length).join(' + ')}. Sau khi cân bằng với hệ số nguyên, tối giản, tổng hệ số của các chất trong phương trình là`,
        pa: pa2, dapAn: CHU_CAI[thuTu.indexOf(0)]!, giaTri: String(tong),
        giai: [`Phương trình cân bằng: ${chuPhanUng(p)}.`, `Tổng hệ số = ${dung.join(' + ')} = ${tong}.`], meo: MEO_CB })
    }
  })
  return ra
}

// ---------------------------------------------------------------- 20. Bảo toàn nguyên tố (đốt cháy hydrocarbon)
const HYDROCARBON = ['CH₄', 'C₂H₆', 'C₃H₈', 'C₄H₁₀', 'C₅H₁₂', 'C₂H₄', 'C₃H₆', 'C₄H₈', 'C₂H₂', 'C₃H₄', 'C₄H₆', 'C₆H₆', 'C₇H₈', 'C₈H₁₀', 'C₆H₁₂'] as const
const MEO_BTNT = 'Bảo toàn nguyên tố: n(C) = n(CO₂); n(H) = 2n(H₂O); n(O₂) phản ứng = n(CO₂) + n(H₂O) : 2.'
function baoToanNguyenTo(): Nhap[] {
  const ra: Nhap[] = []
  for (const ct of HYDROCARBON) {
    const { C: x = 0, H: y = 0 } = tpCua(ct)
    for (const n of T_DEP) {
      const nCO2 = lam(x * n), nH2O = lam(y / 2 * n)
      const m = lam(12 * nCO2 + 2 * nH2O), nO2 = lam(nCO2 + nH2O / 2)
      if (dep(m)) ra.push(so(1, `Đốt cháy hoàn toàn m gam một hydrocarbon X, thu được ${vn(nCO2)} mol CO₂ và ${vn(nH2O)} mol H₂O. Tính m.`, m,
        [`Bảo toàn C, H: n(C) = ${vn(nCO2)} mol; n(H) = 2 · ${vn(nH2O)} = ${vn(2 * nH2O)} mol.`, `m = 12 · ${vn(nCO2)} + 1 · ${vn(2 * nH2O)} = ${vn(m)} gam.`], MEO_BTNT))
      if (dep(nO2)) ra.push(so(1, `Đốt cháy hoàn toàn một hydrocarbon X bằng O₂ vừa đủ, thu được ${vn(nCO2)} mol CO₂ và ${vn(nH2O)} mol H₂O. Tính số mol O₂ đã phản ứng.`, nO2,
        [`Bảo toàn O: 2n(O₂) = 2n(CO₂) + n(H₂O) = ${vn(2 * nCO2)} + ${vn(nH2O)} = ${vn(2 * nO2)} mol.`, `n(O₂) = ${vn(nO2)} mol.`], MEO_BTNT))
      ra.push(so(2, `Đốt cháy hoàn toàn ${vn(n)} mol một hydrocarbon X, thu được ${vn(nCO2)} mol CO₂ và ${vn(nH2O)} mol H₂O. Tính số nguyên tử hydrogen trong một phân tử X.`, y,
        [`Bảo toàn H: n(H) = 2 · ${vn(nH2O)} = ${vn(2 * nH2O)} mol.`, `Số nguyên tử H = ${vn(2 * nH2O)} : ${vn(n)} = ${y}.`], MEO_BTNT))
    }
  }
  return ra
}

// ---------------------------------------------------------------- số có dấu (ΔrH°298, ΔfH°298 có thể ÂM)

/** Số có dấu trong chữ đề / lời giải: "−890,3" (dấu trừ U+2212 như SGK). Đáp án `dap_an` vẫn là "-890,3" (`vn`, dấu "-" như ô nhập của app); docSo đọc cả hai. */
const vnS = (x: number) => (x < 0 ? `−${vn(-x)}` : vn(x))
/** ΔfH°298 in kèm dấu như SGK: "+52,4" · "−74,8". */
const vnDauS = (x: number) => (x > 0 ? `+${vn(x)}` : vnS(x))
/** Số âm trong phép tính đặt trong ngoặc: 2 · (−285,8). */
const ngoac = (x: number) => (x < 0 ? `(${vnS(x)})` : vn(x))
/** Đáp án có dấu: khác 0, hữu hạn, ≤ 3 chữ số thập phân. */
const depCoDau = (x: number) => Number.isFinite(x) && Math.abs(x) > 1e-9 && soLe(x) <= 3
type DsChat = readonly (readonly [number, string])[]
/** Gắn thể khí "(g)" cho từng chất. */
const theKhi = (ds: DsChat): DsChat => ds.map(([k, c]) => [k, `${c}(g)`] as const)

// ---------------------------------------------------------------- 21. Bảo toàn electron (kim loại + HNO₃ / H₂SO₄ đặc, nóng — sản phẩm khử duy nhất)
const KL_OXH: readonly { kl: string; z: number; ion: string; khi: readonly string[] }[] = [
  { kl: 'Mg', z: 2, ion: 'Mg²⁺', khi: ['NO', 'NO₂', 'N₂O', 'N₂', 'SO₂'] },
  { kl: 'Al', z: 3, ion: 'Al³⁺', khi: ['NO', 'NO₂', 'N₂O', 'N₂', 'SO₂'] },
  { kl: 'Zn', z: 2, ion: 'Zn²⁺', khi: ['NO', 'NO₂', 'N₂O', 'N₂', 'SO₂'] },
  // Fe tan hết trong axit có tính oxi hoá mạnh, DƯ ⇒ Fe³⁺. Fe, Cu chỉ đi với NO / NO₂ / SO₂ như đề chuẩn.
  { kl: 'Fe', z: 3, ion: 'Fe³⁺', khi: ['NO', 'NO₂', 'SO₂'] },
  { kl: 'Cu', z: 2, ion: 'Cu²⁺', khi: ['NO', 'NO₂', 'SO₂'] },
]
/** Số mol electron mỗi mol khí nhận + môi trường tạo ra khí (NO₂ cần HNO₃ đặc, nóng; SO₂ cần H₂SO₄ đặc, nóng — Al, Fe thụ động khi nguội). */
const SP_KHU: Readonly<Record<string, { e: number; axit: string; nguon: string; ban: string }>> = {
  'NO': { e: 3, axit: 'HNO₃ loãng', nguon: 'N⁺⁵', ban: 'N⁺⁵ + 3e → N⁺² (NO)' },
  'NO₂': { e: 1, axit: 'HNO₃ đặc, nóng', nguon: 'N⁺⁵', ban: 'N⁺⁵ + 1e → N⁺⁴ (NO₂)' },
  'N₂O': { e: 8, axit: 'HNO₃ loãng', nguon: 'N⁺⁵', ban: '2N⁺⁵ + 8e → 2N⁺¹ (N₂O)' },
  'N₂': { e: 10, axit: 'HNO₃ loãng', nguon: 'N⁺⁵', ban: '2N⁺⁵ + 10e → N₂⁰' },
  'SO₂': { e: 2, axit: 'H₂SO₄ đặc, nóng', nguon: 'S⁺⁶', ban: 'S⁺⁶ + 2e → S⁺⁴ (SO₂)' },
}
const MEO_BTE = 'Bảo toàn electron: tổng số mol electron kim loại nhường = tổng số mol electron chất oxi hoá nhận. Mỗi mol khí nhận: NO 3 mol e; NO₂ 1; N₂O 8; N₂ 10; SO₂ 2. Fe tan hết trong axit có tính oxi hoá mạnh, dư ⇒ Fe³⁺.'
function baoToanElectron(): Nhap[] {
  const ra: Nhap[] = []
  for (const k of KL_OXH) {
    const M = NTK[k.kl]!
    for (const khi of k.khi) {
      const s = SP_KHU[khi]!
      for (const nKhi of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]) {
        const nKl = lam(nKhi * s.e / k.z), m = lam(nKl * M), V = lam(nKhi * V_KHI)
        if (!dep(nKl) || !dep(m, 2) || !dep(V) || m < 1 || m > 40) continue
        const vao = `trong dung dịch ${s.axit}, dư, thu được`
        const sp = `khí ${khi} (sản phẩm khử duy nhất của ${s.nguon}, ở điều kiện chuẩn 25 °C, 1 bar)`
        const qt = `Quá trình: ${k.kl} → ${k.ion} + ${k.z}e; ${s.ban}.`
        ra.push(so(1, `Hoà tan hoàn toàn ${vn(m)} gam ${k.kl} ${vao} V lít ${sp}. Tính V.`, V, [
          `n(${k.kl}) = ${vn(m)} : ${M} = ${vn(nKl)} mol. ${qt}`,
          `Bảo toàn electron: ${k.z} · ${vn(nKl)} = ${s.e} · n(${khi}) ⇒ n(${khi}) = ${vn(nKhi)} mol.`,
          `V = ${vn(nKhi)} · 24,79 = ${vn(V)} lít.`], MEO_BTE))
        ra.push(so(2, `Hoà tan hoàn toàn m gam ${k.kl} ${vao} ${vn(V)} lít ${sp}. Tính m.`, m, [
          `n(${khi}) = ${vn(V)} : 24,79 = ${vn(nKhi)} mol. ${qt}`,
          `Bảo toàn electron: ${k.z} · n(${k.kl}) = ${s.e} · ${vn(nKhi)} ⇒ n(${k.kl}) = ${vn(nKl)} mol.`,
          `m = ${vn(nKl)} · ${M} = ${vn(m)} gam.`], MEO_BTE))
      }
    }
  }
  return ra
}

// ---------------------------------------------------------------- 22. Lập hệ phương trình (hỗn hợp hai kim loại + HCl / H₂SO₄ loãng, dư)
/** Hoá trị khi tan trong axit KHÔNG có tính oxi hoá mạnh (Fe chỉ lên Fe²⁺). */
const KL_AXIT_LOANG: readonly { kl: string; hoa: number }[] = [{ kl: 'Mg', hoa: 2 }, { kl: 'Al', hoa: 3 }, { kl: 'Zn', hoa: 2 }, { kl: 'Fe', hoa: 2 }]
const AXIT_LOANG = ['HCl dư', 'H₂SO₄ loãng, dư'] as const
const N_HE = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3] as const
const MEO_HE = 'Đặt ẩn là số mol từng kim loại, lập 2 phương trình: khối lượng hỗn hợp và bảo toàn electron với H₂ (2n(H₂) = 2n(Mg) + 3n(Al) + 2n(Zn) + 2n(Fe); trong HCl, H₂SO₄ loãng Fe chỉ lên Fe²⁺) rồi giải hệ.'
function lapHePhuongTrinh(): Nhap[] {
  const ra: Nhap[] = []
  for (let i = 0; i < KL_AXIT_LOANG.length; i++) for (let j = i + 1; j < KL_AXIT_LOANG.length; j++) {
    const A = KL_AXIT_LOANG[i]!, B = KL_AXIT_LOANG[j]!, MA = NTK[A.kl]!, MB = NTK[B.kl]!
    N_HE.forEach((x, ix) => N_HE.forEach((y, iy) => {
      const m = lam(x * MA + y * MB), nH2 = lam((A.hoa * x + B.hoa * y) / 2), V = lam(nH2 * V_KHI)
      if (!dep(m, 2) || !dep(V)) return
      const dau = `Cho ${vn(m)} gam hỗn hợp X gồm ${A.kl} và ${B.kl} tác dụng hết với dung dịch ${AXIT_LOANG[(ix + iy) % 2]}, thu được ${vn(V)} lít khí H₂ (ở điều kiện chuẩn 25 °C, 1 bar).`
      const he = [`Đặt n(${A.kl}) = x mol, n(${B.kl}) = y mol ⇒ ${MA}x + ${MB}y = ${vn(m)}.`,
        `n(H₂) = ${vn(V)} : 24,79 = ${vn(nH2)} mol; bảo toàn electron: ${A.hoa}x + ${B.hoa}y = 2 · ${vn(nH2)} = ${vn(lam(2 * nH2))}.`,
        `Giải hệ: x = ${vn(x)}; y = ${vn(y)}.`]
      const mA = lam(x * MA), mB = lam(y * MB)
      ra.push(so(1, `${dau} Tính khối lượng (gam) của ${A.kl} trong X.`, mA, [...he, `m(${A.kl}) = ${vn(x)} · ${MA} = ${vn(mA)} gam.`], MEO_HE))
      ra.push(so(1, `${dau} Tính khối lượng (gam) của ${B.kl} trong X.`, mB, [...he, `m(${B.kl}) = ${vn(y)} · ${MB} = ${vn(mB)} gam.`], MEO_HE))
      for (const [kl, mk] of [[A.kl, mA], [B.kl, mB]] as const) {
        const p = lam(mk / m * 100)
        if (dep(p, 2)) ra.push(so(2, `${dau} Tính phần trăm khối lượng của ${kl} trong X.`, p, [...he, `%m(${kl}) = ${vn(mk)} : ${vn(m)} · 100% = ${vn(p)}%.`], MEO_HE))
      }
    }))
  }
  return ra
}

// ---------------------------------------------------------------- 23. Tìm công thức phân tử (trắc nghiệm; 4 phương án đều là công thức HỢP LỆ)
type Cho = readonly [number, number, number]
const ctCho = ([c, h, o]: Cho) => `C${chiSo(c)}H${chiSo(h)}${o ? `O${chiSo(o)}` : ''}`
const mCho = ([c, h, o]: Cho) => 12 * c + h + 16 * o
/** CxHyOz hợp lệ: số H chẵn, độ bất bão hoà k = (2x + 2 − y) : 2 nguyên ≥ 0, số O ≤ số C + 2. */
const hopLeCho = ([c, h, o]: Cho) => c >= 1 && h >= 2 && h % 2 === 0 && h <= 2 * c + 2 && o >= 0 && o <= c + 2
/** Chất có thật: hydrocarbon và hợp chất chứa C, H, O (đáp án luôn là một chất có thật). */
const HC_THAT: readonly Cho[] = [[1, 4, 0], [2, 6, 0], [3, 8, 0], [4, 10, 0], [5, 12, 0], [6, 14, 0], [2, 4, 0], [3, 6, 0], [4, 8, 0], [5, 10, 0], [6, 12, 0],
  [2, 2, 0], [3, 4, 0], [4, 6, 0], [6, 6, 0], [7, 8, 0], [8, 10, 0], [8, 8, 0]]
const HCO_THAT: readonly Cho[] = [[1, 4, 1], [2, 6, 1], [3, 8, 1], [4, 10, 1], [1, 2, 1], [2, 4, 1], [3, 6, 1], [4, 8, 1], [3, 4, 1], [6, 6, 1], [7, 8, 1],
  [1, 2, 2], [2, 4, 2], [3, 6, 2], [4, 8, 2], [5, 10, 2], [3, 4, 2], [4, 6, 2], [2, 6, 2], [3, 8, 2], [7, 6, 2], [2, 4, 3], [3, 6, 3], [3, 8, 3],
  [2, 2, 4], [4, 4, 4], [4, 6, 4], [6, 12, 6]]
const MEO_CTPT = 'X là CxHyOz: x = n(CO₂) : n(X); y = 2n(H₂O) : n(X); z = (M − 12x − y) : 16. Kiểm tra lại: số H chẵn, độ bất bão hoà k = (2x + 2 − y) : 2 là số nguyên ≥ 0.'
/** Ba phương án nhiễu HỢP LỆ, khác đáp án (mỗi cái sai với dữ kiện): ưu tiên bẫy quên/thừa O, lệch H, cùng khối lượng mol, đồng đẳng, gấp đôi. */
function nhieuCho(dung: Cho, loai: 'hc' | 'o' | 'tuy', hat: number): Cho[] {
  const [C, H, O] = dung, M = mCho(dung), ung: Cho[] = []
  const cungM = (gan: boolean) => {
    for (let c = 1; c <= 12; c++) if (c !== C && (Math.abs(c - C) <= 1) === gan) for (let o = 0; o <= 6; o++) ung.push([c, M - 12 * c - 16 * o, o])
  }
  if (loai !== 'hc') ung.push([C, H, O + 1], [C, H, O - 1])
  ung.push([C, H - 2, O], [C, H + 2, O])
  cungM(true)
  ung.push([C + 1, H + 2, O], [C - 1, H - 2, O], [2 * C, 2 * H, 2 * O], [C + 1, H, O], [C - 1, H, O])
  cungM(false)
  const da = new Set([ctCho(dung)]), tot: Cho[] = []
  for (const x of ung) {
    if (!hopLeCho(x) || (loai === 'hc' && x[2] !== 0) || (loai === 'o' && x[2] < 1)) continue
    const k = ctCho(x)
    if (da.has(k)) continue
    da.add(k); tot.push(x)
  }
  return xao(tot.slice(0, 5), hat).slice(0, 3)
}
function tnCho(muc: 1 | 2, de: string, dung: Cho, loai: 'hc' | 'o' | 'tuy', giai: string[]): Nhap | null {
  const hat = bam32(de), nhieu = nhieuCho(dung, loai, hat)
  if (nhieu.length < 3) return null
  const thuTu = xao([0, 1, 2, 3], hat ^ 0x9e3779b9), ds = [dung, ...nhieu]
  const pa = Object.fromEntries(CHU_CAI.map((k, i) => [k, ctCho(ds[thuTu[i]!]!)])) as Record<ChuCai, string>
  return { muc, kieu: 'tn', de, pa, dapAn: CHU_CAI[thuTu.indexOf(0)]!, giaTri: '', giai, meo: MEO_CTPT }
}
function congThucPhanTu(): Nhap[] {
  const ra: Nhap[] = []
  const day = (x: Nhap | null) => { if (x) ra.push(x) }
  const CTPT = 'Công thức phân tử của X là'
  for (const X of HC_THAT) {
    const [C, H] = X
    for (const n of [0.05, 0.1, 0.15, 0.2]) {
      const nCO2 = lam(C * n), nH2O = lam(H / 2 * n)
      day(tnCho(1, `Đốt cháy hoàn toàn ${vn(n)} mol hydrocarbon X, thu được ${vn(nCO2)} mol CO₂ và ${vn(nH2O)} mol H₂O. ${CTPT}`, X, 'hc', [
        `Số C = n(CO₂) : n(X) = ${vn(nCO2)} : ${vn(n)} = ${C}; số H = 2n(H₂O) : n(X) = ${vn(lam(2 * nH2O))} : ${vn(n)} = ${H}.`,
        `${CTPT} ${ctCho(X)}.`]))
    }
  }
  for (const X of HCO_THAT) {
    const [C, H, O] = X, M = mCho(X)
    for (const n of [0.05, 0.1, 0.2]) {
      const nCO2 = lam(C * n), nH2O = lam(H / 2 * n)
      day(tnCho(2, `Đốt cháy hoàn toàn ${vn(n)} mol chất hữu cơ X (phân tử gồm C, H, O), thu được ${vn(nCO2)} mol CO₂ và ${vn(nH2O)} mol H₂O. Biết khối lượng mol của X là ${M} g/mol. ${CTPT}`, X, 'o', [
        `Số C = ${vn(nCO2)} : ${vn(n)} = ${C}; số H = 2 · ${vn(nH2O)} : ${vn(n)} = ${H}.`,
        `Số O = (${M} − 12 · ${C} − ${H}) : 16 = ${O}.`,
        `${CTPT} ${ctCho(X)}.`]))
    }
  }
  for (const X of [...HC_THAT, ...HCO_THAT]) {
    const [C, H, O] = X, M = mCho(X)
    ;[0.05, 0.1, 0.2].forEach((n, i) => {
      const mX = lam(n * M), mCO2 = lam(44 * C * n), mH2O = lam(9 * H * n), nC = lam(C * n), nH = lam(H * n)
      const quaTiKhoi = i % 2 === 0
      day(tnCho(2, `Đốt cháy hoàn toàn ${vn(mX)} gam chất hữu cơ X, thu được ${vn(mCO2)} gam CO₂ và ${vn(mH2O)} gam H₂O. ${quaTiKhoi ? `Tỉ khối hơi của X so với H₂ là ${M / 2}.` : `Khối lượng mol của X là ${M} g/mol.`} ${CTPT}`, X, 'tuy', [
        `n(C) = n(CO₂) = ${vn(mCO2)} : 44 = ${vn(nC)} mol; n(H) = 2n(H₂O) = 2 · ${vn(mH2O)} : 18 = ${vn(nH)} mol.`,
        O ? `m(O) = ${vn(mX)} − 12 · ${vn(nC)} − ${vn(nH)} = ${vn(lam(16 * O * n))} gam ⇒ n(O) = ${vn(lam(O * n))} mol.`
          : `m(C) + m(H) = 12 · ${vn(nC)} + ${vn(nH)} = ${vn(mX)} gam = m(X) ⇒ X không chứa O.`,
        `M(X) = ${quaTiKhoi ? `${M / 2} · 2 = ` : ''}${M} g/mol ⇒ n(X) = ${vn(mX)} : ${M} = ${vn(n)} mol ⇒ số C = ${C}, số H = ${H}${O ? `, số O = ${O}` : ''}.`,
        `${CTPT} ${ctCho(X)}.`]))
    })
  }
  for (const X of [...HC_THAT, ...HCO_THAT]) {
    const [C, H, O] = X, M = mCho(X)
    const pC = Math.round(1200 * C / M * 100) / 100, pH = Math.round(100 * H / M * 100) / 100
    const de = O
      ? `Chất hữu cơ X có thành phần khối lượng: ${vn(pC)}% C; ${vn(pH)}% H; còn lại là O. Khối lượng mol của X là ${M} g/mol. ${CTPT}`
      : `Hydrocarbon X có ${vn(pC)}% C về khối lượng. Khối lượng mol của X là ${M} g/mol. ${CTPT}`
    day(tnCho(1, de, X, O ? 'o' : 'hc', [
      `Số C = ${M} · ${vn(pC)} : 1200 ≈ ${C}; số H = ${O ? `${M} · ${vn(pH)} : 100 ≈ ${H}` : `${M} − 12 · ${C} = ${H}`}.`,
      ...(O ? [`Số O = (${M} − 12 · ${C} − ${H}) : 16 = ${O}.`] : []),
      `${CTPT} ${ctCho(X)}.`]))
  }
  return ra
}

// ---------------------------------------------------------------- 24. Hằng số cân bằng Kc (nồng độ / số mol lúc cân bằng CHO SẴN trong đề)
interface PuKc { trai: DsChat; phai: DsChat; mien: readonly (readonly number[])[] }
/** Sáu cân bằng pha khí của đặc tả; `mien` = các nồng độ cân bằng (M) thử cho từng chất (thứ tự: chất đầu rồi sản phẩm). */
const PU_KC: readonly PuKc[] = [
  { trai: [[1, 'H₂'], [1, 'I₂']], phai: [[2, 'HI']], mien: [[0.1, 0.2, 0.25, 0.5], [0.1, 0.2, 0.25, 0.5], [0.2, 0.4, 0.5, 0.8, 1, 1.6]] },
  { trai: [[1, 'N₂'], [3, 'H₂']], phai: [[2, 'NH₃']], mien: [[0.1, 0.2, 0.25, 0.5, 1], [0.1, 0.2, 0.5, 1], [0.01, 0.02, 0.04, 0.05, 0.1, 0.2, 0.4]] },
  { trai: [[2, 'SO₂'], [1, 'O₂']], phai: [[2, 'SO₃']], mien: [[0.1, 0.2, 0.4, 0.5], [0.05, 0.1, 0.2, 0.25, 0.5], [0.2, 0.4, 0.5, 0.8, 1]] },
  { trai: [[1, 'CO'], [1, 'H₂O']], phai: [[1, 'CO₂'], [1, 'H₂']], mien: [[0.1, 0.2, 0.5], [0.1, 0.2, 0.5], [0.1, 0.2, 0.4], [0.1, 0.2, 0.4]] },
  { trai: [[1, 'N₂O₄']], phai: [[2, 'NO₂']], mien: [[0.01, 0.02, 0.04, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 1], [0.01, 0.02, 0.04, 0.05, 0.06, 0.08, 0.1, 0.2, 0.3, 0.4]] },
  { trai: [[1, 'PCl₅']], phai: [[1, 'PCl₃'], [1, 'Cl₂']], mien: [[0.1, 0.2, 0.5, 1], [0.05, 0.1, 0.2, 0.4], [0.05, 0.1, 0.2, 0.4]] },
]
const MU = ['', '', '²', '³'] as const
/** "H₂(g) + I₂(g) ⇌ 2HI(g)" */
const chuKc = (p: PuKc) => `${vePhan(theKhi(p.trai))} ⇌ ${vePhan(theKhi(p.phai))}`
const tichKc = (ds: DsChat, f: (c: string) => string) => ds.map(([k, c]) => `${f(c)}${MU[k] ?? `^${k}`}`).join(' · ')
const boNgoac = (ds: DsChat, s: string) => (ds.length > 1 ? `(${s})` : s)
function tichDescartes(mien: readonly (readonly number[])[]): number[][] {
  let ra: number[][] = [[]]
  for (const ds of mien) ra = ra.flatMap((x) => ds.map((v) => [...x, v]))
  return ra
}
const MEO_KC = 'Kc = tích nồng độ lúc cân bằng của sản phẩm (mũ hệ số) : tích nồng độ lúc cân bằng của chất phản ứng (mũ hệ số). Dùng nồng độ mol lúc cân bằng [X] = n : V, không dùng số mol.'
function hangSoCanBang(): Nhap[] {
  const ra: Nhap[] = []
  for (const p of PU_KC) {
    const chat = [...p.trai, ...p.phai], soTrai = p.trai.length, pt = chuKc(p)
    const tenNd = (c: string) => `[${c}]`
    const bieuThuc = `${tichKc(p.phai, tenNd)} : ${boNgoac(p.trai, tichKc(p.trai, tenNd))}`
    tichDescartes(p.mien).forEach((C, ic) => {
      const gt = new Map(chat.map(([, c], i) => [c, C[i]!] as const))
      const g = (c: string) => gt.get(c)!, sg = (c: string) => vn(g(c))
      const tich = (ds: DsChat) => ds.reduce((s, [k, c]) => s * g(c) ** k, 1)
      const Kc = lam(tich(p.phai) / tich(p.trai))
      if (!dep(Kc) || Kc < 0.01 || Kc > 1000) return
      const thaySo = `${tichKc(p.phai, sg)} : ${boNgoac(p.trai, tichKc(p.trai, sg))}`
      ra.push(so(1, `Cho phản ứng: ${pt}. Ở một nhiệt độ xác định, khi phản ứng đạt trạng thái cân bằng: ${chat.map(([, c]) => `[${c}] = ${sg(c)} M`).join('; ')}. Tính hằng số cân bằng Kc của phản ứng ở nhiệt độ đó.`, Kc,
        [`Kc = ${bieuThuc}.`, `Kc = ${thaySo} = ${vn(Kc)}.`], MEO_KC))
      // Ẩn nồng độ một chất có hệ số 1 (xoay vòng theo bộ số) — đáp án chính là nồng độ đã chọn.
      const heSo1 = chat.map(([k, c], i) => ({ k, c, trai: i < soTrai })).filter((x) => x.k === 1)
      const an = heSo1[ic % heSo1.length]!
      const khacTrai = p.trai.filter(([, c]) => c !== an.c), khacPhai = p.phai.filter(([, c]) => c !== an.c)
      const rut = (f: (c: string) => string, K: string) => (an.trai
        ? `${tichKc(p.phai, f)} : ${khacTrai.length ? `(${K} · ${tichKc(khacTrai, f)})` : K}`
        : `${K} · ${boNgoac(p.trai, tichKc(p.trai, f))}${khacPhai.length ? ` : ${boNgoac(khacPhai, tichKc(khacPhai, f))}` : ''}`)
      ra.push(so(2, `Cho phản ứng: ${pt}. Ở một nhiệt độ xác định, phản ứng có hằng số cân bằng Kc = ${vn(Kc)}. Khi cân bằng: ${chat.filter(([, c]) => c !== an.c).map(([, c]) => `[${c}] = ${sg(c)} M`).join('; ')}. Tính nồng độ mol (M) của ${an.c} ở trạng thái cân bằng.`, g(an.c),
        [`Kc = ${bieuThuc} ⇒ [${an.c}] = ${rut(tenNd, 'Kc')}.`, `[${an.c}] = ${rut(sg, vn(Kc))} = ${sg(an.c)} M.`], MEO_KC))
      // Cho SỐ MOL trong bình V lít ⇒ phải đổi ra nồng độ trước khi thay vào Kc.
      const V = [2, 4, 5, 10][ic % 4]!
      const mol = chat.map(([, c]) => lam(g(c) * V))
      if (mol.every((x) => dep(x))) ra.push(so(2, `Cho phản ứng: ${pt}. Trong một bình kín dung tích ${V} lít, ở một nhiệt độ xác định, khi phản ứng đạt trạng thái cân bằng có ${noi(chat.map(([, c], i) => `${vn(mol[i]!)} mol ${c}`))}. Tính hằng số cân bằng Kc của phản ứng ở nhiệt độ đó.`, Kc,
        [`Nồng độ lúc cân bằng: ${chat.map(([, c], i) => `[${c}] = ${vn(mol[i]!)} : ${V} = ${sg(c)} M`).join('; ')}.`, `Kc = ${bieuThuc} = ${thaySo} = ${vn(Kc)}.`], MEO_KC))
    })
  }
  return ra
}

// ---------------------------------------------------------------- 25. Biến thiên enthalpy (ΔfH°298 CHO SẴN trong đề; đơn chất bền = 0)
/** ΔfH°298 (kJ/mol) hay gặp (bộ A) — LUÔN in trong đề (SGK các bộ lệch nhau vài kJ; học sinh không phải nhớ). */
const DF_298: Readonly<Record<string, number>> = {
  'CH₄(g)': -74.8, 'C₂H₆(g)': -84, 'C₃H₈(g)': -103.8, 'C₂H₄(g)': 52.4, 'C₂H₂(g)': 227.4, 'C₂H₅OH(l)': -277.6, 'CH₃OH(l)': -239.2, 'C₆H₁₂O₆(s)': -1273.3,
  'CO₂(g)': -393.5, 'CO(g)': -110.5, 'H₂O(l)': -285.8, 'H₂O(g)': -241.8, 'H₂S(g)': -20.6, 'SO₂(g)': -296.8, 'SO₃(g)': -395.7, 'HCl(g)': -92.3,
  'NH₃(g)': -45.9, 'NO(g)': 91.3, 'NO₂(g)': 33.2, 'N₂O₄(g)': 11.1, 'CaCO₃(s)': -1207.6, 'CaO(s)': -634.9, 'Ca(OH)₂(s)': -985.2,
  'NaHCO₃(s)': -950.8, 'Na₂CO₃(s)': -1130.7, 'Fe₂O₃(s)': -824.2, 'Al₂O₃(s)': -1675.7, 'CuO(s)': -157.3,
}
/** Bộ B: số liệu của tài liệu khác (lệch vài kJ) — chỉ dùng cho câu tính ΔrH°298 / ΔfH°298, đề vẫn in đủ số. */
const DF_298_B: Readonly<Record<string, number>> = {
  ...DF_298, 'CH₄(g)': -74.6, 'C₂H₆(g)': -84.7, 'C₃H₈(g)': -104.7, 'C₂H₄(g)': 52.5, 'C₂H₂(g)': 226.7, 'C₂H₅OH(l)': -277.7, 'CH₃OH(l)': -238.7,
  'C₆H₁₂O₆(s)': -1274.4, 'NH₃(g)': -46.1, 'NO(g)': 90.3, 'N₂O₄(g)': 9.2, 'CaCO₃(s)': -1206.9, 'CaO(s)': -635.1, 'Ca(OH)₂(s)': -986.1,
  'NaHCO₃(s)': -947.7, 'CuO(s)': -155.2,
}
/** Đơn chất bền ở điều kiện chuẩn: ΔfH°298 = 0 (đề ghi rõ). */
const DON_CHAT_BEN: ReadonlySet<string> = new Set(['O₂(g)', 'H₂(g)', 'N₂(g)', 'Cl₂(g)', 'Fe(s)', 'Al(s)', 'Cu(s)'])
interface PuNhiet { p: PhanUngSinh; viec: 'chay' | 'phan_huy' | 'pu' }
const PU_NHIET: readonly PuNhiet[] = [
  { p: pu([[1, 'CH₄(g)'], [2, 'O₂(g)']], [[1, 'CO₂(g)'], [2, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[1, 'CH₄(g)'], [2, 'O₂(g)']], [[1, 'CO₂(g)'], [2, 'H₂O(g)']]), viec: 'chay' },
  { p: pu([[2, 'C₂H₆(g)'], [7, 'O₂(g)']], [[4, 'CO₂(g)'], [6, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[1, 'C₂H₄(g)'], [3, 'O₂(g)']], [[2, 'CO₂(g)'], [2, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[2, 'C₂H₂(g)'], [5, 'O₂(g)']], [[4, 'CO₂(g)'], [2, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[1, 'C₃H₈(g)'], [5, 'O₂(g)']], [[3, 'CO₂(g)'], [4, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[1, 'C₂H₅OH(l)'], [3, 'O₂(g)']], [[2, 'CO₂(g)'], [3, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[2, 'CH₃OH(l)'], [3, 'O₂(g)']], [[2, 'CO₂(g)'], [4, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[1, 'C₆H₁₂O₆(s)'], [6, 'O₂(g)']], [[6, 'CO₂(g)'], [6, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[2, 'H₂S(g)'], [3, 'O₂(g)']], [[2, 'SO₂(g)'], [2, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[2, 'CO(g)'], [1, 'O₂(g)']], [[2, 'CO₂(g)']]), viec: 'chay' },
  { p: pu([[2, 'H₂(g)'], [1, 'O₂(g)']], [[2, 'H₂O(l)']]), viec: 'chay' },
  { p: pu([[1, 'CaCO₃(s)']], [[1, 'CaO(s)'], [1, 'CO₂(g)']]), viec: 'phan_huy' },
  { p: pu([[2, 'NaHCO₃(s)']], [[1, 'Na₂CO₃(s)'], [1, 'CO₂(g)'], [1, 'H₂O(g)']]), viec: 'phan_huy' },
  { p: pu([[1, 'N₂(g)'], [3, 'H₂(g)']], [[2, 'NH₃(g)']]), viec: 'pu' },
  { p: pu([[2, 'SO₂(g)'], [1, 'O₂(g)']], [[2, 'SO₃(g)']]), viec: 'pu' },
  { p: pu([[1, 'Fe₂O₃(s)'], [3, 'CO(g)']], [[2, 'Fe(s)'], [3, 'CO₂(g)']]), viec: 'pu' },
  { p: pu([[4, 'NH₃(g)'], [5, 'O₂(g)']], [[4, 'NO(g)'], [6, 'H₂O(g)']]), viec: 'pu' },
  { p: pu([[2, 'NO(g)'], [1, 'O₂(g)']], [[2, 'NO₂(g)']]), viec: 'pu' },
  { p: pu([[2, 'NO₂(g)']], [[1, 'N₂O₄(g)']]), viec: 'pu' },
  { p: pu([[1, 'C₂H₄(g)'], [1, 'H₂(g)']], [[1, 'C₂H₆(g)']]), viec: 'pu' },
  { p: pu([[1, 'C₂H₂(g)'], [2, 'H₂(g)']], [[1, 'C₂H₆(g)']]), viec: 'pu' },
  { p: pu([[2, 'Al(s)'], [1, 'Fe₂O₃(s)']], [[1, 'Al₂O₃(s)'], [2, 'Fe(s)']]), viec: 'pu' },
  { p: pu([[1, 'CaO(s)'], [1, 'H₂O(l)']], [[1, 'Ca(OH)₂(s)']]), viec: 'pu' },
  { p: pu([[1, 'CuO(s)'], [1, 'H₂(g)']], [[1, 'Cu(s)'], [1, 'H₂O(g)']]), viec: 'pu' },
  { p: pu([[1, 'CH₄(g)'], [1, 'H₂O(g)']], [[1, 'CO(g)'], [3, 'H₂(g)']]), viec: 'pu' },
  { p: pu([[1, 'H₂(g)'], [1, 'Cl₂(g)']], [[2, 'HCl(g)']]), viec: 'pu' },
]
const dfTheo = (bo: Readonly<Record<string, number>>, c: string): number => {
  if (DON_CHAT_BEN.has(c)) return 0
  const v = bo[c]
  if (v === undefined) throw new Error(`omni-cau-nen-sinh: thiếu ΔfH°298 của ${c}`)
  return v
}
const boThe = (c: string) => c.replace(/\((?:g|l|s)\)$/, '')
const MEO_DH = 'ΔrH°298 = Σ(hệ số × ΔfH°298) sản phẩm − Σ(hệ số × ΔfH°298) chất đầu; đơn chất bền có ΔfH°298 = 0. ΔrH°298 < 0: phản ứng toả nhiệt; > 0: thu nhiệt. Nhiệt lượng tỉ lệ với số mol chất phản ứng theo hệ số.'
function bienThienEnthalpy(): Nhap[] {
  const ra: Nhap[] = []
  const CT = 'ΔrH°298 = Σ(hệ số · ΔfH°298) sản phẩm − Σ(hệ số · ΔfH°298) chất đầu; đơn chất bền có ΔfH°298 = 0.'
  PU_NHIET.forEach(({ p, viec }, ip) => {
    const pt = chuPhanUng(p)
    const hopChat = [...p.trai, ...p.phai].filter(([, c]) => !DON_CHAT_BEN.has(c))
    let dHA = 0
    for (const bo of [DF_298, DF_298_B]) {
      const df = (c: string) => dfTheo(bo, c)
      const tong = (ds: DsChat) => lam(ds.reduce((s, [k, c]) => s + k * df(c), 0))
      const bieu = (ds: DsChat) => { const t = ds.filter(([, c]) => !DON_CHAT_BEN.has(c)); return t.length ? t.map(([k, c]) => `${k} · ${ngoac(df(c))}`).join(' + ') : '0' }
      const dsDf = (ds: DsChat) => (ds.length ? `ΔfH°298 (kJ/mol) của ${ds.map(([, c]) => c).join(', ')} ${ds.length > 1 ? 'lần lượt là' : 'là'} ${ds.map(([, c]) => vnDauS(df(c))).join('; ')}; ` : '')
      const sP = tong(p.phai), sT = tong(p.trai), dH = lam(sP - sT)
      if (bo === DF_298) dHA = dH
      if (!depCoDau(dH)) continue
      // (1) Tính ΔrH°298 từ ΔfH°298 cho sẵn.
      ra.push(so(hopChat.length <= 3 ? 1 : 2, `Cho phản ứng: ${pt}. Biết ${dsDf(hopChat)}ΔfH°298 của đơn chất bền bằng 0. Tính biến thiên enthalpy chuẩn ΔrH°298 (kJ) của phản ứng.`, dH,
        [CT, `Σ sản phẩm = ${bieu(p.phai)} = ${vnS(sP)} kJ; Σ chất đầu = ${bieu(p.trai)} = ${vnS(sT)} kJ.`, `ΔrH°298 = ${vnS(sP)} − ${ngoac(sT)} = ${vnS(dH)} kJ.`], MEO_DH))
      // (2) Biết ΔrH°298 ⇒ tìm ΔfH°298 của một hợp chất.
      for (const [k, X] of hopChat) {
        const x = df(X), oTrai = p.trai.some(([, c]) => c === X), kx = lam(k * x)
        const sPk = tong(p.phai.filter(([, c]) => c !== X)), sTk = tong(p.trai.filter(([, c]) => c !== X))
        const trai = `${k === 1 ? '' : `${k} · `}ΔfH°298(${X})`, donVi = k === 1 ? 'kJ/mol' : 'kJ'
        const buoc = oTrai
          ? `${trai} = Σ sản phẩm − Σ chất đầu còn lại − ΔrH°298 = ${vnS(sP)} − ${ngoac(sTk)} − ${ngoac(dH)} = ${vnS(kx)} ${donVi}.`
          : `${trai} = ΔrH°298 + Σ chất đầu − Σ sản phẩm còn lại = ${vnS(dH)} + ${ngoac(sT)} − ${ngoac(sPk)} = ${vnS(kx)} ${donVi}.`
        ra.push(so(2, `Cho phản ứng: ${pt}, có ΔrH°298 = ${vnS(dH)} kJ. Biết ${dsDf(hopChat.filter(([, c]) => c !== X))}ΔfH°298 của đơn chất bền bằng 0. Tính ΔfH°298 (kJ/mol) của ${X}.`, x,
          [CT, buoc, ...(k === 1 ? [] : [`ΔfH°298(${X}) = ${vnS(kx)} : ${k} = ${vnS(x)} kJ/mol.`])], MEO_DH))
      }
    }
    // (3) Nhiệt lượng theo lượng chất; (4) ngược lại: biết nhiệt lượng ⇒ ΔrH°298 (có dấu). ΔrH°298 in sẵn trong đề (bộ A).
    const dH = dHA
    if (!depCoDau(dH)) return
    const [k0, X0] = p.trai[0]!, ct0 = boThe(X0), M0 = mCua(ct0), toa = dH < 0, nhiet = toa ? 'toả ra' : 'thu vào'
    ;[0.1, 0.2, 0.5].forEach((n, iN) => {
      const Q = lam(Math.abs(dH) * n / k0)
      if (!dep(Q)) return
      const cach: { luong: string; buoc: string[] }[] = [{ luong: `${vn(n)} mol ${ct0}`, buoc: [] }]
      const m = lam(n * M0), V = lam(n * V_KHI)
      if (dep(m, 2)) cach.push({ luong: `${vn(m)} gam ${ct0}`, buoc: [`n(${ct0}) = ${vn(m)} : ${vn(M0)} = ${vn(n)} mol.`] })
      if (X0.endsWith('(g)') && dep(V)) cach.push({ luong: `${vn(V)} lít khí ${ct0} (ở điều kiện chuẩn 25 °C, 1 bar)`, buoc: [`n(${ct0}) = ${vn(V)} : 24,79 = ${vn(n)} mol.`] })
      const viecVoi = (luong: string) => (viec === 'chay' ? `đốt cháy hoàn toàn ${luong}` : viec === 'phan_huy' ? `phân huỷ hoàn toàn ${luong}` : `${luong} phản ứng hết`)
      const c3 = cach[(iN + ip) % cach.length]!, c4 = cach[(iN + ip + 1) % cach.length]!
      ra.push(so(1, `Cho phương trình nhiệt hoá học: ${pt}; ΔrH°298 = ${vnS(dH)} kJ. Tính nhiệt lượng (kJ) ${toa ? `toả ra khi ${viecVoi(c3.luong)}` : `cần cung cấp để ${viecVoi(c3.luong)}`}.`, Q,
        [...c3.buoc, `Theo phương trình: ${k0} mol ${ct0} phản ứng thì ${nhiet} ${vn(Math.abs(dH))} kJ.`,
          `Q = ${vn(n)} · ${vn(Math.abs(dH))}${k0 === 1 ? '' : ` : ${k0}`} = ${vn(Q)} kJ.`], MEO_DH))
      ra.push(so(2, `Cho phản ứng: ${pt}. Khi ${viecVoi(c4.luong)} thì ${nhiet} ${vn(Q)} kJ. Tính biến thiên enthalpy chuẩn ΔrH°298 (kJ) của phản ứng theo phương trình trên.`, dH,
        [...c4.buoc, `Theo hệ số phương trình, ${k0} mol ${ct0} phản ứng thì ${nhiet} ${vn(Q)} · ${k0} : ${vn(n)} = ${vn(Math.abs(dH))} kJ.`,
          `Phản ứng ${toa ? 'toả nhiệt nên ΔrH°298 < 0' : 'thu nhiệt nên ΔrH°298 > 0'}: ΔrH°298 = ${vnS(dH)} kJ.`], MEO_DH))
    })
  })
  return ra
}

// ---------------------------------------------------------------- 26. ΔrH°298 theo năng lượng liên kết (mọi chất ở thể khí; Eb CHO SẴN trong đề)
/** Số liên kết của mỗi phân tử, đếm theo CÔNG THỨC CẤU TẠO (test kiểm lại bằng hoá trị). */
const LIEN_KET: Readonly<Record<string, Readonly<Record<string, number>>>> = {
  'H₂': { 'H–H': 1 }, 'Cl₂': { 'Cl–Cl': 1 }, 'F₂': { 'F–F': 1 }, 'HCl': { 'H–Cl': 1 }, 'HF': { 'H–F': 1 }, 'O₂': { 'O=O': 1 }, 'H₂O': { 'O–H': 2 },
  'N₂': { 'N≡N': 1 }, 'NH₃': { 'N–H': 3 }, 'CH₄': { 'C–H': 4 }, 'C₂H₆': { 'C–C': 1, 'C–H': 6 }, 'C₃H₈': { 'C–C': 2, 'C–H': 8 },
  'C₂H₄': { 'C=C': 1, 'C–H': 4 }, 'C₂H₂': { 'C≡C': 1, 'C–H': 2 }, 'CO₂': { 'C=O': 2 }, 'CH₃Cl': { 'C–H': 3, 'C–Cl': 1 },
  'C₂H₅Cl': { 'C–C': 1, 'C–H': 5, 'C–Cl': 1 },
}
/** Eb (kJ/mol): hai bộ số SGK / sổ tay thường gặp — đề luôn in đúng số đã dùng. */
const EB: Readonly<Record<string, readonly [number, number]>> = {
  'H–H': [436, 432], 'Cl–Cl': [243, 242], 'H–Cl': [432, 431], 'F–F': [159, 158], 'H–F': [565, 567], 'O=O': [498, 494], 'O–H': [467, 464],
  'C–H': [413, 414], 'C–C': [347, 346], 'C=C': [614, 611], 'C≡C': [839, 837], 'C=O': [799, 803], 'N≡N': [945, 946], 'N–H': [391, 390], 'C–Cl': [339, 330],
}
const PU_LIEN_KET: readonly PhanUngSinh[] = [
  pu([[1, 'H₂'], [1, 'Cl₂']], [[2, 'HCl']]), pu([[1, 'H₂'], [1, 'F₂']], [[2, 'HF']]), pu([[1, 'N₂'], [3, 'H₂']], [[2, 'NH₃']]),
  pu([[2, 'H₂'], [1, 'O₂']], [[2, 'H₂O']]), pu([[2, 'NH₃'], [3, 'Cl₂']], [[1, 'N₂'], [6, 'HCl']]), pu([[4, 'NH₃'], [3, 'O₂']], [[2, 'N₂'], [6, 'H₂O']]),
  pu([[1, 'CH₄'], [2, 'O₂']], [[1, 'CO₂'], [2, 'H₂O']]), pu([[1, 'C₂H₄'], [3, 'O₂']], [[2, 'CO₂'], [2, 'H₂O']]),
  pu([[2, 'C₂H₂'], [5, 'O₂']], [[4, 'CO₂'], [2, 'H₂O']]), pu([[2, 'C₂H₆'], [7, 'O₂']], [[4, 'CO₂'], [6, 'H₂O']]),
  pu([[1, 'C₃H₈'], [5, 'O₂']], [[3, 'CO₂'], [4, 'H₂O']]), pu([[1, 'C₂H₄'], [1, 'H₂']], [[1, 'C₂H₆']]), pu([[1, 'C₂H₂'], [2, 'H₂']], [[1, 'C₂H₆']]),
  pu([[1, 'C₂H₂'], [1, 'H₂']], [[1, 'C₂H₄']]), pu([[1, 'CH₄'], [1, 'Cl₂']], [[1, 'CH₃Cl'], [1, 'HCl']]),
  pu([[1, 'C₂H₆'], [1, 'Cl₂']], [[1, 'C₂H₅Cl'], [1, 'HCl']]), pu([[1, 'C₂H₄'], [1, 'HCl']], [[1, 'C₂H₅Cl']]),
]
const MEO_LK = 'ΔrH°298 = ΣEb(chất đầu) − ΣEb(sản phẩm) (dùng khi mọi chất ở thể khí). Đếm liên kết theo công thức cấu tạo rồi nhân hệ số: CH₄ có 4 C–H; C₂H₆ có 1 C–C và 6 C–H; C₂H₄ có 1 C=C và 4 C–H; C₂H₂ có 1 C≡C và 2 C–H; CO₂ có 2 C=O; H₂O có 2 O–H; NH₃ có 3 N–H.'
function nangLuongLienKet(): Nhap[] {
  const ra: Nhap[] = []
  for (const p of PU_LIEN_KET) {
    const pt = `${vePhan(theKhi(p.trai))} → ${vePhan(theKhi(p.phai))}`
    const demVe = (ds: DsChat) => {
      const d = new Map<string, number>()
      for (const [k, c] of ds) for (const [b, n] of Object.entries(LIEN_KET[c]!)) d.set(b, (d.get(b) ?? 0) + k * n)
      return d
    }
    const dT = demVe(p.trai), dP = demVe(p.phai)
    const lk = [...new Set([...dT.keys(), ...dP.keys()])]
    const coCacbon = lk.some((b) => b.split(/[–=≡]/).includes('C'))
    const dem = `Đếm liên kết theo cấu tạo: ${[...p.trai, ...p.phai].map(([k, c]) => `${k === 1 ? '' : k}${c}: ${Object.entries(LIEN_KET[c]!).map(([b, n]) => `${k * n} ${b}`).join(' + ')}`).join('; ')}.`
    for (let v = 0; v < 3; v++) {
      const eb = new Map(lk.map((b, i) => [b, EB[b]![v < 2 ? v : i % 2]] as const))
      const tongVe = (d: Map<string, number>) => [...d].reduce((s, [b, n]) => s + n * eb.get(b)!, 0)
      const bieuVe = (d: Map<string, number>) => [...d].map(([b, n]) => (n === 1 ? `${eb.get(b)}` : `${n} · ${eb.get(b)}`)).join(' + ')
      const dsEb = (bo?: string) => lk.filter((b) => b !== bo).map((b) => `${b} ${eb.get(b)}`).join('; ')
      const sT = tongVe(dT), sP = tongVe(dP), dH = sT - sP
      if (dH === 0) continue
      ra.push(so(coCacbon ? 2 : 1, `Cho phản ứng: ${pt}. Biết năng lượng liên kết Eb (kJ/mol): ${dsEb()}. Tính biến thiên enthalpy chuẩn ΔrH°298 (kJ) của phản ứng theo năng lượng liên kết.`, dH,
        [dem, `ΣEb(chất đầu) = ${bieuVe(dT)} = ${sT} kJ; ΣEb(sản phẩm) = ${bieuVe(dP)} = ${sP} kJ.`, `ΔrH°298 = ΣEb(chất đầu) − ΣEb(sản phẩm) = ${sT} − ${sP} = ${vnS(dH)} kJ.`], MEO_LK))
      for (const b of lk) {
        const c = (dT.get(b) ?? 0) - (dP.get(b) ?? 0), x = eb.get(b)!
        if (c === 0) continue // liên kết triệt tiêu hai vế ⇒ không tìm được từ ΔrH
        const K = dH - c * x // phần đã biết: ΣEb(chất đầu) − ΣEb(sản phẩm) không kể liên kết b
        const tinh = c === 1 ? `Eb(${b}) = ${vnS(dH)} − ${ngoac(K)} = ${x} kJ/mol.`
          : c === -1 ? `Eb(${b}) = ${vnS(K)} − ${ngoac(dH)} = ${x} kJ/mol.`
            : `Eb(${b}) = (${vnS(dH)} − ${ngoac(K)}) : ${ngoac(c)} = ${x} kJ/mol.`
        ra.push(so(2, `Cho phản ứng: ${pt}, có ΔrH°298 = ${vnS(dH)} kJ. Biết năng lượng liên kết Eb (kJ/mol): ${dsEb(b)}. Tính năng lượng liên kết Eb(${b}) (kJ/mol).`, x,
          [dem, `ΔrH°298 = ΣEb(chất đầu) − ΣEb(sản phẩm) ⇒ ${vnS(dH)} = ${vnS(K)} ${c > 0 ? '+' : '−'} ${Math.abs(c) === 1 ? '' : `${Math.abs(c)} · `}Eb(${b}).`, tinh], MEO_LK))
      }
    }
  }
  return ra
}

// ---------------------------------------------------------------- 27. Bảo toàn điện tích (dung dịch chỉ gồm các ion CÙNG TỒN TẠI được)
interface IonDT { ten: string; q: number; m: number }
/** Ion, điện tích, khối lượng (nguyên tử khối SGK; nhóm NH₄ 18, NO₃ 62, HCO₃ 61, SO₄ 96, CO₃ 60, PO₄ 95, Cl 35,5). */
const ION_DT: readonly IonDT[] = [
  { ten: 'Na⁺', q: 1, m: 23 }, { ten: 'K⁺', q: 1, m: 39 }, { ten: 'NH₄⁺', q: 1, m: 18 }, { ten: 'H⁺', q: 1, m: 1 },
  { ten: 'Mg²⁺', q: 2, m: 24 }, { ten: 'Ca²⁺', q: 2, m: 40 }, { ten: 'Ba²⁺', q: 2, m: 137 }, { ten: 'Fe²⁺', q: 2, m: 56 },
  { ten: 'Cu²⁺', q: 2, m: 64 }, { ten: 'Zn²⁺', q: 2, m: 65 }, { ten: 'Al³⁺', q: 3, m: 27 }, { ten: 'Fe³⁺', q: 3, m: 56 },
  { ten: 'Cl⁻', q: -1, m: 35.5 }, { ten: 'NO₃⁻', q: -1, m: 62 }, { ten: 'HCO₃⁻', q: -1, m: 61 }, { ten: 'SO₄²⁻', q: -2, m: 96 },
  { ten: 'CO₃²⁻', q: -2, m: 60 }, { ten: 'PO₄³⁻', q: -3, m: 95 },
]
/** Cặp tạo kết tủa ngoài các luật nhóm bên dưới: BaSO₄, CaSO₄. */
const CAP_KHONG_CUNG: ReadonlySet<string> = new Set(['Ba²⁺|SO₄²⁻', 'Ca²⁺|SO₄²⁻'])
/** CO₃²⁻, PO₄³⁻ chỉ đi với Na⁺, K⁺, NH₄⁺ (với H⁺ ⇒ khí / axit yếu; với ion kim loại khác ⇒ kết tủa). */
const VOI_CO3_PO4: ReadonlySet<string> = new Set(['Na⁺', 'K⁺', 'NH₄⁺'])
/** HCO₃⁻: không H⁺ (CO₂ bay ra), không Al³⁺/Fe³⁺ (thuỷ phân kép); giữ chắc chỉ các ion của nước cứng / kiềm. */
const VOI_HCO3: ReadonlySet<string> = new Set(['Na⁺', 'K⁺', 'NH₄⁺', 'Mg²⁺', 'Ca²⁺', 'Ba²⁺'])
/** Cô cạn thì phân huỷ / bay hơi ⇒ không dùng ở dạng cô cạn. */
const MAT_KHI_CO_CAN: ReadonlySet<string> = new Set(['HCO₃⁻', 'NH₄⁺', 'H⁺'])
const cungTonTai = (duong: string, am: string) => !CAP_KHONG_CUNG.has(`${duong}|${am}`)
  && (am !== 'CO₃²⁻' && am !== 'PO₄³⁻' || VOI_CO3_PO4.has(duong)) && (am !== 'HCO₃⁻' || VOI_HCO3.has(duong))
/** Mọi cặp ion dương – âm cùng tồn tại; không có bộ ba H⁺ + Fe²⁺ + NO₃⁻ (oxi hoá – khử). */
function boIonHopLe(ds: readonly IonDT[]): boolean {
  const co = (t: string) => ds.some((i) => i.ten === t)
  return ds.filter((i) => i.q > 0).every((d) => ds.filter((i) => i.q < 0).every((a) => cungTonTai(d.ten, a.ten))) && !(co('H⁺') && co('Fe²⁺') && co('NO₃⁻'))
}
function toHop<T>(ds: readonly T[], k: number): T[][] {
  if (k === 0) return [[]]
  const ra: T[][] = []
  ds.forEach((x, i) => { for (const r of toHop(ds.slice(i + 1), k - 1)) ra.push([x, ...r]) })
  return ra
}
const N_DT = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4] as const
const MEO_DT = 'Bảo toàn điện tích: Σ(số mol × điện tích) các ion dương = Σ(số mol × điện tích) các ion âm. Cô cạn dung dịch: m muối khan = tổng khối lượng các ion (Cl 35,5; NO₃ 62; SO₄ 96; CO₃ 60; PO₄ 95).'
function baoToanDienTich(): Nhap[] {
  const ra: Nhap[] = []
  const DUONG = ION_DT.filter((i) => i.q > 0), AM = ION_DT.filter((i) => i.q < 0)
  const bo: IonDT[][] = []
  for (const [nd, na] of [[2, 2], [2, 1], [1, 2]] as const) for (const d of toHop(DUONG, nd)) for (const a of toHop(AM, na)) if (boIonHopLe([...d, ...a])) bo.push([...d, ...a])
  bo.forEach((ds, ib) => {
    const r = prng(bam32(`bao-toan-dien-tich|${ds.map((i) => i.ten).join(',')}`))
    const chon = () => N_DT[Math.floor(r() * N_DT.length)]!
    const duong = ds.filter((i) => i.q > 0), am = ds.filter((i) => i.q < 0)
    const coCan = !ds.some((i) => MAT_KHI_CO_CAN.has(i.ten))
    /** Vế điện tích: "n(Na⁺) + 2n(Mg²⁺)". */
    const veN = (ve: readonly IonDT[]) => ve.map((i) => `${Math.abs(i.q) === 1 ? '' : Math.abs(i.q)}n(${i.ten})`).join(' + ')
    /** Vế điện tích thay số; ẩn viết "2x". */
    const veSo = (ve: readonly IonDT[], n: Map<string, number>, an: Map<string, string>) => ve.map((i) => {
      const k = Math.abs(i.q), bien = an.get(i.ten)
      return bien ? `${k === 1 ? '' : k}${bien}` : `${k === 1 ? '' : `${k} · `}${vn(n.get(i.ten)!)}`
    }).join(' + ')
    const dong = (n: Map<string, number>, an: Map<string, string>) => noi(ds.map((i) => `${an.get(i.ten) ?? vn(n.get(i.ten)!)} mol ${i.ten}`))
    const khoiLuong = (n: Map<string, number>) => lam(ds.reduce((s, i) => s + n.get(i.ten)! * i.m, 0))
    /** Thử tối đa 40 bộ số mol cho các ion đã biết; ẩn tính từ bảo toàn điện tích, phải dương, ≤ 2 chữ số thập phân, ≤ 0,6 mol. */
    const timBo = (an: IonDT) => {
      for (let t = 0; t < 40; t++) {
        const n = new Map<string, number>(ds.filter((i) => i !== an).map((i) => [i.ten, chon()] as const))
        const S = lam(ds.filter((i) => i !== an).reduce((s, i) => s + i.q * n.get(i.ten)!, 0)) // tổng điện tích đã biết (có dấu)
        const x = lam(-S / an.q)
        if (x > 0 && x <= 0.6 && dep(x, 2)) { n.set(an.ten, x); return n }
      }
      return null
    }
    // (a) Tìm số mol một ion.
    const anA = ds[ib % ds.length]!, nA = timBo(anA)
    if (nA) {
      const bien = new Map([[anA.ten, 'x']])
      ra.push(so(1, `Dung dịch X chứa ${dong(nA, bien)}. Tính x.`, nA.get(anA.ten)!,
        [`Bảo toàn điện tích: ${veN(duong)} = ${veN(am)}.`, `${veSo(duong, nA, bien)} = ${veSo(am, nA, bien)} ⇒ x = ${vn(nA.get(anA.ten)!)}.`], MEO_DT))
    }
    if (!coCan) return
    // (b) Tìm x bằng bảo toàn điện tích rồi tính khối lượng muối khan.
    const anB = ds[(ib + 1) % ds.length]!, nB = timBo(anB)
    if (nB) {
      const bien = new Map([[anB.ten, 'x']]), m = khoiLuong(nB)
      if (dep(m)) ra.push(so(1, `Dung dịch X chứa ${dong(nB, bien)}. Cô cạn dung dịch X thu được m gam muối khan. Tính m.`, m,
        [`Bảo toàn điện tích: ${veN(duong)} = ${veN(am)} ⇒ ${veSo(duong, nB, bien)} = ${veSo(am, nB, bien)} ⇒ x = ${vn(nB.get(anB.ten)!)}.`,
          `m muối khan = tổng khối lượng các ion = ${ds.map((i) => `${vn(nB.get(i.ten)!)} · ${vn(i.m)}`).join(' + ')} = ${vn(m)} gam.`], MEO_DT))
    }
    // (c) Hai ẩn cùng dấu: bảo toàn điện tích + khối lượng muối khan ⇒ hệ hai phương trình.
    const cap = am.length === 2 && (duong.length < 2 || ib % 2 === 0) ? am : duong.length === 2 ? duong : null
    if (!cap) return
    const [A, B] = cap as [IonDT, IonDT]
    for (let t = 0; t < 40; t++) {
      const n = new Map<string, number>(ds.filter((i) => i !== B).map((i) => [i.ten, chon()] as const))
      const S = lam(ds.filter((i) => i !== B).reduce((s, i) => s + i.q * n.get(i.ten)!, 0))
      const y = lam(-S / B.q)
      if (!(y > 0 && y <= 0.6 && dep(y, 2))) continue
      n.set(B.ten, y)
      const m = khoiLuong(n), x = n.get(A.ten)!
      if (!dep(m)) continue
      const bien = new Map([[A.ten, 'x'], [B.ten, 'y']])
      const kA = Math.abs(A.q), kB = Math.abs(B.q)
      // Hai ẩn là TẤT CẢ ion cùng dấu ⇒ các ion còn lại đều trái dấu: kA·x + kB·y = Σ(điện tích × số mol) của chúng.
      const conLai = ds.filter((i) => i !== A && i !== B)
      const qBiet = lam(conLai.reduce((s, i) => s + Math.abs(i.q) * n.get(i.ten)!, 0))
      const mBiet = lam(conLai.reduce((s, i) => s + n.get(i.ten)! * i.m, 0)), mConLai = lam(m - mBiet)
      const hoi = ib % 4 < 2 ? 'x' : 'y'
      ra.push(so(2, `Dung dịch X chứa ${dong(n, bien)}. Cô cạn dung dịch X thu được ${vn(m)} gam muối khan. Tính ${hoi}.`, hoi === 'x' ? x : y,
        [`Bảo toàn điện tích: ${veN(duong)} = ${veN(am)} ⇒ ${kA === 1 ? '' : kA}x + ${kB === 1 ? '' : kB}y = ${vn(qBiet)}.`,
          `Khối lượng muối: ${vn(A.m)}x + ${vn(B.m)}y = ${vn(m)} − ${conLai.length > 1 ? `(${conLai.map((i) => `${vn(n.get(i.ten)!)} · ${vn(i.m)}`).join(' + ')})` : conLai.map((i) => `${vn(n.get(i.ten)!)} · ${vn(i.m)}`).join('')} = ${vn(mConLai)}.`,
          `Giải hệ: x = ${vn(x)}; y = ${vn(y)}.`], MEO_DT))
      break
    }
  })
  return ra
}

/** Chữ mọi phương trình viết sẵn của 3 nhãn nhiệt / cân bằng (test kiểm cân bằng bằng bộ đếm nguyên tử riêng). */
export const PHAN_UNG_MOI_CHU: readonly string[] = [
  ...PU_KC.map(chuKc), ...PU_NHIET.map(({ p }) => chuPhanUng(p)), ...PU_LIEN_KET.map((p) => `${vePhan(theKhi(p.trai))} → ${vePhan(theKhi(p.phai))}`),
]

// ---------------------------------------------------------------- danh mục bộ sinh

const BO_SINH: Readonly<Record<string, () => Nhap[]>> = {
  doi_mol_khoi_luong: doiMolKhoiLuong, doi_mol_the_tich_khi: doiMolTheTichKhi, nong_do_mol: nongDoMol, nong_do_phan_tram: nongDoPhanTram,
  khoi_luong_rieng: khoiLuongRieng, ti_khoi_khi: tiKhoiKhi, ti_le_mol_phuong_trinh: tiLeMolPhuongTrinh, bao_toan_khoi_luong: baoToanKhoiLuong,
  hieu_suat: hieuSuat, chat_du_het: chatDuHet, phan_tram_khoi_luong: phanTramKhoiLuong, do_bat_bao_hoa: doBatBaoHoa, ph_nong_do_ion: phNongDoIon,
  dung_dich_pha_loang: phaLoang, dien_phan_faraday: dienPhan, gia_tri_trung_binh: giaTriTrungBinh, the_dien_cuc_pin: theDienCucPin,
  toc_do_phan_ung: tocDoPhanUng, can_bang_phuong_trinh: canBangPhuongTrinh, bao_toan_nguyen_to: baoToanNguyenTo,
  bao_toan_electron: baoToanElectron, lap_he_phuong_trinh: lapHePhuongTrinh, cong_thuc_phan_tu: congThucPhanTu,
  hang_so_can_bang: hangSoCanBang, bien_thien_enthalpy: bienThienEnthalpy, nang_luong_lien_ket: nangLuongLienKet,
  bao_toan_dien_tich: baoToanDienTich,
}
/** Mọi nhãn có bộ sinh (thứ tự cố định). 'tinh_chat_hoa_hoc', 'lam_tron_ket_qua'… không có bộ sinh. */
export const NHAN_CO_BO_SINH: readonly string[] = Object.keys(BO_SINH)
export const coBoSinh = (nhan: string): boolean => Object.prototype.hasOwnProperty.call(BO_SINH, nhan)

const demKhongGian = new Map<string, readonly Nhap[]>()
/** Không gian câu của nhãn, đã xáo tất định theo nhãn (đệm trong isolate). */
function khongGian(nhan: string): readonly Nhap[] {
  let ds = demKhongGian.get(nhan)
  if (!ds) {
    const tao = BO_SINH[nhan]
    const da = new Set<string>()
    // Hai trường hợp cùng chữ đề (vd khí X ẩn danh có cùng M) ⇒ giữ một: không phục vụ hai câu giống hệt nhau.
    const duyNhat = (tao ? tao() : []).filter((x) => { const k = `${x.de}|${x.pa ? JSON.stringify(x.pa) : ''}`; if (da.has(k)) return false; da.add(k); return true })
    ds = xao(duyNhat, bam32(`omni-cau-nen|${nhan}`))
    demKhongGian.set(nhan, ds)
  }
  return ds
}
/** Số câu KHÁC NỘI DUNG mà bộ sinh của nhãn tạo được (0 ⇒ không có bộ sinh). */
export const soCauKhongGian = (nhan: string): number => khongGian(nhan).length

/** Câu nền số `so` (≥ 1) của nhãn — tất định (cùng nhãn, cùng số ⇒ cùng câu). Không có bộ sinh / số không hợp lệ ⇒ null. */
export function sinhCauNen(nhan: string, so: number): CauNenSinh | null {
  const ds = khongGian(nhan)
  if (!ds.length || !Number.isInteger(so) || so < 1) return null
  const x = ds[(so - 1) % ds.length]!
  const giai = x.giai.slice(0, 4)
  return {
    id: `${TIEN_TO_SINH}${nhan}.${so}`, nhan, muc: x.muc, kieu: x.kieu, de: x.de,
    pa: x.pa ?? null, pa_json: x.pa ? JSON.stringify(x.pa) : null,
    dap_an: x.dapAn, gia_tri_dung: x.giaTri, giai, giai_json: JSON.stringify(giai), meo: x.meo,
  }
}
/** `soLuong` câu liên tiếp từ số `tu` (≥ 1). */
export function sinhLoCauNen(nhan: string, tu: number, soLuong: number): CauNenSinh[] {
  const ra: CauNenSinh[] = []
  for (let i = 0; i < soLuong; i++) { const c = sinhCauNen(nhan, tu + i); if (c) ra.push(c) }
  return ra
}

// ---------------------------------------------------------------- D1: bảo đảm mỗi nhãn đủ câu nền

const soCuaIdSinh = (nhan: string, id: string): number => {
  const tien = `${TIEN_TO_SINH}${nhan}.`
  if (!id.startsWith(tien)) return 0
  const k = Number(id.slice(tien.length))
  return Number.isInteger(k) && k > 0 ? k : 0
}
async function themCauSinh(env: Env, nhan: string, nowMs: number): Promise<number> {
  const r = await env.DB.prepare('SELECT id FROM cau_nen WHERE nhan = ? AND id LIKE ?').bind(nhan, `${TIEN_TO_SINH}${nhan}.%`).all<Obj>()
  const lonNhat = (r.results ?? []).reduce((m, x) => Math.max(m, soCuaIdSinh(nhan, String(x.id ?? ''))), 0)
  const nay = new Date(nowMs).toISOString()
  const lenh: D1PreparedStatement[] = sinhLoCauNen(nhan, lonNhat + 1, SO_CAU_THEM_MOI_LAN).map((c) => env.DB.prepare(
    `INSERT OR IGNORE INTO cau_nen (id, nhan, muc, kieu, de, pa_json, dap_an, gia_tri_dung, giai_json, meo, cap_nhat_luc) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(c.id, c.nhan, c.muc, c.kieu, c.de, c.pa_json, c.dap_an, c.gia_tri_dung || null, c.giai_json, c.meo, nay))
  if (!lenh.length) return 0
  const kq = await env.DB.batch(lenh)
  return kq.reduce((s, x) => s + Number(x?.meta?.changes ?? 0), 0)
}

/**
 * Nhãn có < `toiThieu` câu trong `cau_nen` ⇒ INSERT OR IGNORE thêm 8 câu sinh (số tiếp theo sau câu sinh lớn nhất của nhãn). KHÔNG sửa/xoá câu nào
 * (câu thầy nạp — id không bắt đầu "sinh." — giữ nguyên). Nhãn không có bộ sinh (vd 'tinh_chat_hoa_hoc') ⇒ 0. Trả số câu đã thêm.
 */
export async function damBaoCauNenTuDong(env: Env, nhan: string, toiThieu = TOI_THIEU_CAU_NEN, nowMs = Date.now()): Promise<number> {
  if (!coBoSinh(nhan)) return 0
  await damBaoBangCauNen(env)
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM cau_nen WHERE nhan = ?').bind(nhan).first<Obj>()
  if (Number(r?.n ?? 0) >= toiThieu) return 0
  return themCauSinh(env, nhan, nowMs)
}

/** Việc đêm: chạy `damBaoCauNenTuDong` cho mọi nhãn có bộ sinh (một truy vấn đếm chung). Lỗi một nhãn không chặn nhãn khác; không bao giờ ném lỗi. */
export async function damBaoMoiCauNenTuDong(env: Env, nowMs = Date.now()): Promise<{ soThem: number; theoNhan: Record<string, number>; loi?: string }> {
  const theoNhan: Record<string, number> = {}
  let soThem = 0
  try {
    await damBaoBangCauNen(env)
    const r = await env.DB.prepare('SELECT nhan, COUNT(*) AS n FROM cau_nen GROUP BY nhan').all<Obj>()
    const dem = new Map((r.results ?? []).map((x) => [String(x.nhan ?? ''), Number(x.n ?? 0)]))
    for (const nhan of NHAN_CO_BO_SINH) {
      if ((dem.get(nhan) ?? 0) >= TOI_THIEU_CAU_NEN) continue
      try {
        const n = await themCauSinh(env, nhan, nowMs)
        if (n) { theoNhan[nhan] = n; soThem += n }
      } catch { /* nhãn này để lượt sau */ }
    }
    return { soThem, theoNhan }
  } catch (e) {
    return { soThem, theoNhan, loi: String((e as Error)?.message ?? e).slice(0, 200) }
  }
}
