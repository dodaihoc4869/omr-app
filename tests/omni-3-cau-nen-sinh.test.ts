// @vitest-environment node
// OMNI 3 · D1 — TỰ SINH CÂU NỀN (server/src/omni-cau-nen-sinh.ts): KIỂM CHÉO mọi đáp án bằng một bộ giải ĐỘC LẬP viết riêng ở đây.
// Bộ giải này ĐỌC LẠI CHỮ ĐỀ như học sinh (tự phân tích công thức có chỉ số Unicode, tự tính khối lượng mol bằng bảng nguyên tử khối riêng,
// tự cân bằng phương trình bằng vét cạn) — không gọi lại hàm nào của bộ sinh. Sai một số trong đề / một hệ số / một khối lượng mol ⇒ test đỏ.
// 6 nhãn thêm 05/10 có bảng RIÊNG ở đây (số e tính từ số oxi hoá trong công thức khí, hoá trị kim loại, 6 cân bằng Kc, bảng cấu tạo – liên kết tự kiểm
// bằng hoá trị, dạng bền của đơn chất) và được giải lại TOÀN BỘ không gian câu, không chỉ 50 câu đầu. Đã thử cố ý làm sai bộ sinh 13 kiểu (hoá trị Al,
// Fe²⁺/Fe³⁺, số e của N₂O, số liên kết C₂H₆/CO₂, dấu ΔrH, quên hệ số, quên mũ trong Kc, đổi số mol sai, khối lượng H₂O, nhiễu H lẻ, nhiễu k < 0) ⇒ test đều đỏ.
// Bảo toàn điện tích (05/10): bảng ion [điện tích, khối lượng] + bảng cấm cặp ion viết riêng; 9 kiểu làm sai (khối lượng SO₄, điện tích Al, cho Ba²⁺ + SO₄²⁻,
// CO₃²⁻ + Mg²⁺, HCO₃⁻ + Al³⁺, cô cạn có H⁺, bỏ luật H⁺ + Fe²⁺ + NO₃⁻, quên một ion khi cộng khối lượng, sai dấu điện tích) ⇒ test đều đỏ.
// 26 nhãn có trước được khoá bằng băm toàn bộ không gian câu (BAM_26_NHAN).
import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { chamCauNen, docSo, locCauNen } from '../server/src/thang-tu-go'
import { NHAN_CO_BO_SINH, coBoSinh, damBaoCauNenTuDong, damBaoMoiCauNenTuDong, sinhCauNen, sinhLoCauNen, soCauKhongGian, type CauNenSinh } from '../server/src/omni-cau-nen-sinh'
import { taoD1That } from './_d1-that'

// ---------------------------------------------------------------- bảng + bộ phân tích RIÊNG của test

/** Nguyên tử khối SGK (viết lại độc lập với bộ sinh). */
const NTK_T: Record<string, number> = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 64, Zn: 65, Ag: 108, Ba: 137, Br: 80, P: 31 }
const DUOI = '₀₁₂₃₄₅₆₇₈₉'
const veAscii = (s: string) => [...s].map((c) => (DUOI.includes(c) ? String(DUOI.indexOf(c)) : c)).join('')

/** "Al₂(SO₄)₃" ⇒ {Al:2, S:3, O:12}. Ngoặc lồng nhau được. Ký tự lạ ⇒ ném lỗi (đề viết sai công thức). */
function phanTichCongThuc(ct: string): Record<string, number> {
  const s = veAscii(ct)
  let i = 0
  const soSau = () => { const m = /^\d+/.exec(s.slice(i)); if (!m) return 1; i += m[0].length; return Number(m[0]) }
  const nhom = (): Record<string, number> => {
    const ra: Record<string, number> = {}
    const cong = (o: Record<string, number>, k: number) => { for (const [e, n] of Object.entries(o)) ra[e] = (ra[e] ?? 0) + n * k }
    while (i < s.length && s[i] !== ')') {
      if (s[i] === '(') {
        i++
        const con = nhom()
        if (s[i] !== ')') throw new Error(`thiếu ngoặc đóng: ${ct}`)
        i++
        cong(con, soSau())
      } else {
        const m = /^[A-Z][a-z]?/.exec(s.slice(i))
        if (!m) throw new Error(`công thức lạ: ${ct}`)
        i += m[0].length
        cong({ [m[0]]: 1 }, soSau())
      }
    }
    return ra
  }
  const kq = nhom()
  if (i !== s.length) throw new Error(`công thức thừa ký tự: ${ct}`)
  return kq
}
const M = (ct: string) => Object.entries(phanTichCongThuc(ct)).reduce((s, [e, n]) => {
  if (NTK_T[e] === undefined) throw new Error(`thiếu nguyên tử khối ${e}`)
  return s + NTK_T[e] * n
}, 0)

interface PtT { trai: [number, string][]; phai: [number, string][] }
function docPhuongTrinh(chu: string): PtT {
  const [a, b] = chu.split(/\s*[→⇌]\s*/)
  if (!a || !b) throw new Error(`phương trình lạ: ${chu}`)
  const ve = (x: string): [number, string][] => x.split(/\s\+\s/).map((t) => { const m = /^(\d*)(\S+)$/.exec(t.trim()); if (!m) throw new Error(`số hạng lạ: ${t}`); return [m[1] ? Number(m[1]) : 1, m[2]!] })
  return { trai: ve(a), phai: ve(b) }
}
function canBang(p: PtT): boolean {
  const dem: Record<string, number> = {}
  for (const [k, c] of p.trai) for (const [e, n] of Object.entries(phanTichCongThuc(c))) dem[e] = (dem[e] ?? 0) + k * n
  for (const [k, c] of p.phai) for (const [e, n] of Object.entries(phanTichCongThuc(c))) dem[e] = (dem[e] ?? 0) - k * n
  return Object.values(dem).every((v) => v === 0)
}
const ucln = (a: number, b: number): number => (b ? ucln(b, a % b) : a)
/** Vét cạn hệ số 1..12 cho sơ đồ (chưa cân bằng); trả bộ hệ số nguyên tối giản. */
function tuCanBang(trai: string[], phai: string[]): number[] {
  const chat = [...trai, ...phai], tp = chat.map(phanTichCongThuc), nguyenTo = [...new Set(tp.flatMap((o) => Object.keys(o)))]
  const h = new Array<number>(chat.length).fill(1)
  const thu = (i: number): boolean => {
    if (i === chat.length) return nguyenTo.every((e) => tp.reduce((s, o, j) => s + (j < trai.length ? 1 : -1) * h[j]! * (o[e] ?? 0), 0) === 0)
    for (let k = 1; k <= 12; k++) { h[i] = k; if (thu(i + 1)) return true }
    return false
  }
  if (!thu(0)) throw new Error('không cân bằng được trong 1..12')
  const g = h.reduce(ucln)
  return h.map((x) => x / g)
}

/** Số trong đề: "6,1975" · "−0,76" · "+0,34". */
const sv = (x: string) => Number(x.replace('−', '-').replace('+', '').replace(',', '.'))
const lam9 = (x: number) => Math.round(x * 1e9) / 1e9
const soLe = (x: number) => { const s = lam9(x).toFixed(9).replace(/0+$/, '').replace(/\.$/, ''); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1 }
const E0_T: Record<string, number> = { 'Mg²⁺/Mg': -2.37, 'Al³⁺/Al': -1.66, 'Zn²⁺/Zn': -0.76, 'Fe²⁺/Fe': -0.44, 'Ni²⁺/Ni': -0.26, 'Pb²⁺/Pb': -0.13, '2H⁺/H₂': 0, 'Cu²⁺/Cu': 0.34, 'Ag⁺/Ag': 0.8 }
const V_MOL = 24.79
const FARADAY = 96500
const TOKEN = '(\\S+?)(?=[,.\\s?]|$)'
const R = (s: string) => new RegExp(s)

// ---------------------------------------------------------------- bảng RIÊNG cho 6 nhãn mới (05/10) — không import gì từ tệp sinh

/** Hai nhãn có đáp án được phép ÂM (ΔrH°298, ΔfH°298). */
const NHAN_AM = ['bien_thien_enthalpy', 'nang_luong_lien_ket']
const NHAN_MOI = ['bao_toan_electron', 'lap_he_phuong_trinh', 'cong_thuc_phan_tu', 'hang_so_can_bang', 'bien_thien_enthalpy', 'nang_luong_lien_ket', 'bao_toan_dien_tich']
/** Ion: [điện tích, khối lượng] — bảng riêng (nhóm NO₃ 62, SO₄ 96, CO₃ 60, PO₄ 95, Cl 35,5 theo đặc tả); test "bảng ion" đối chiếu với công thức. */
const ION_T: Record<string, [number, number]> = {
  'Na⁺': [1, 23], 'K⁺': [1, 39], 'NH₄⁺': [1, 18], 'H⁺': [1, 1], 'Mg²⁺': [2, 24], 'Ca²⁺': [2, 40], 'Ba²⁺': [2, 137], 'Fe²⁺': [2, 56], 'Fe³⁺': [3, 56],
  'Cu²⁺': [2, 64], 'Zn²⁺': [2, 65], 'Al³⁺': [3, 27], 'Cl⁻': [-1, 35.5], 'NO₃⁻': [-1, 62], 'HCO₃⁻': [-1, 61], 'SO₄²⁻': [-2, 96], 'CO₃²⁻': [-2, 60], 'PO₄³⁻': [-3, 95],
}
/** Bảng cấm viết RIÊNG (liệt kê từng cặp): cặp ion dương – âm KHÔNG cùng tồn tại trong dung dịch (kết tủa, khí, thuỷ phân kép). */
const CAM_ION_T = new Set([
  'Ba²⁺|SO₄²⁻', 'Ba²⁺|CO₃²⁻', 'Ba²⁺|PO₄³⁻', 'Ca²⁺|SO₄²⁻', 'Ca²⁺|CO₃²⁻', 'Ca²⁺|PO₄³⁻', 'Mg²⁺|CO₃²⁻', 'Mg²⁺|PO₄³⁻',
  'Fe²⁺|CO₃²⁻', 'Fe²⁺|PO₄³⁻', 'Cu²⁺|CO₃²⁻', 'Cu²⁺|PO₄³⁻', 'Zn²⁺|CO₃²⁻', 'Zn²⁺|PO₄³⁻', 'Al³⁺|CO₃²⁻', 'Al³⁺|PO₄³⁻', 'Al³⁺|HCO₃⁻',
  'Fe³⁺|CO₃²⁻', 'Fe³⁺|PO₄³⁻', 'Fe³⁺|HCO₃⁻', 'H⁺|CO₃²⁻', 'H⁺|HCO₃⁻', 'H⁺|PO₄³⁻',
  // Thêm cho chắc (không có trong đề chuẩn): hydrogencarbonate của Fe²⁺, Cu²⁺, Zn²⁺.
  'Fe²⁺|HCO₃⁻', 'Cu²⁺|HCO₃⁻', 'Zn²⁺|HCO₃⁻',
])
/** Mọi ion trong đề đều CÙNG TỒN TẠI được; cô cạn thì không HCO₃⁻ / NH₄⁺ / H⁺. */
function kiemIonCungTonTai(ten: string[], coCan: boolean, de: string) {
  expect(new Set(ten).size, de).toBe(ten.length)
  for (const t of ten) expect(t, de).not.toMatch(/^Ag/)
  const duong = ten.filter((t) => ION_T[t]![0] > 0), am = ten.filter((t) => ION_T[t]![0] < 0)
  expect(duong.length >= 1 && am.length >= 1, de).toBe(true)
  for (const d of duong) for (const a of am) expect(CAM_ION_T.has(`${d}|${a}`), `${d} và ${a} không cùng tồn tại: ${de}`).toBe(false)
  expect(ten.includes('H⁺') && ten.includes('Fe²⁺') && ten.includes('NO₃⁻'), `H⁺ + Fe²⁺ + NO₃⁻ phản ứng oxi hoá – khử: ${de}`).toBe(false)
  if (coCan) for (const t of ['HCO₃⁻', 'NH₄⁺', 'H⁺']) expect(ten, `cô cạn có ${t}: ${de}`).not.toContain(t)
}
/** Băm (sha256, 16 ký tự) TOÀN BỘ không gian câu của 26 nhãn trước khi thêm bảo toàn điện tích (05/10) — mã sinh.<nhãn>.<số> đã cấp không được đổi nghĩa. */
const BAM_26_NHAN: Record<string, string> = {
  doi_mol_khoi_luong: '896:147f2b257e447d83',
  doi_mol_the_tich_khi: '533:19e616dec5fe1228',
  nong_do_mol: '2654:0f82ae53d3dddc33',
  nong_do_phan_tram: '1020:0b3176b2014eaa0d',
  khoi_luong_rieng: '324:2b51cb150b707866',
  ti_khoi_khi: '58:8a6a92ae01dcf020',
  ti_le_mol_phuong_trinh: '1568:074317456eae83c3',
  bao_toan_khoi_luong: '752:e2e147abdfd24e38',
  hieu_suat: '1344:5e0f64b8583558e8',
  chat_du_het: '2016:284f8edcab1df770',
  phan_tram_khoi_luong: '128:125656539cfd05ef',
  do_bat_bao_hoa: '456:52441f77b03d676c',
  ph_nong_do_ion: '122:68ad834d7ab61ec2',
  dung_dich_pha_loang: '2566:5a7df63e72ff6401',
  dien_phan_faraday: '660:81b60e9dd3d898cf',
  gia_tri_trung_binh: '738:4448a99d3f4a19e3',
  the_dien_cuc_pin: '87:4f75b19c397bf3ac',
  toc_do_phan_ung: '444:122ae9ca2412cdee',
  can_bang_phuong_trinh: '156:9df40c22cd2eba1e',
  bao_toan_nguyen_to: '330:51585b1a798e91d1',
  bao_toan_electron: '162:d6c6b395b06fdc3b',
  lap_he_phuong_trinh: '182:7282d85bd8dbc3a9',
  cong_thuc_phan_tu: '340:c842141c4e16dfd5',
  hang_so_can_bang: '1521:70b8a4504b63b6a0',
  bien_thien_enthalpy: '331:ade5a94d384a481f',
  nang_luong_lien_ket: '258:47c57a6a2f3fd134',
}
const bamKhongGian = (n: string) => `${soCauKhongGian(n)}:${createHash('sha256').update(JSON.stringify(sinhLoCauNen(n, 1, soCauKhongGian(n)))).digest('hex').slice(0, 16)}`
/** Sáu cân bằng pha khí của đặc tả (viết lại bằng tay). */
const CAN_BANG_KC_T = ['H₂ + I₂ ⇌ 2HI', 'N₂ + 3H₂ ⇌ 2NH₃', '2SO₂ + O₂ ⇌ 2SO₃', 'CO + H₂O ⇌ CO₂ + H₂', 'N₂O₄ ⇌ 2NO₂', 'PCl₅ ⇌ PCl₃ + Cl₂']
/** Số liên kết mỗi phân tử theo CÔNG THỨC CẤU TẠO (bảng riêng; test "bảng cấu tạo" kiểm lại bằng hoá trị + số nguyên tử). */
const LK_T: Record<string, Record<string, number>> = {
  'H₂': { 'H–H': 1 }, 'Cl₂': { 'Cl–Cl': 1 }, 'F₂': { 'F–F': 1 }, 'O₂': { 'O=O': 1 }, 'N₂': { 'N≡N': 1 }, 'HCl': { 'H–Cl': 1 }, 'HF': { 'H–F': 1 },
  'H₂O': { 'O–H': 2 }, 'NH₃': { 'N–H': 3 }, 'CO₂': { 'C=O': 2 }, 'CH₄': { 'C–H': 4 }, 'C₂H₆': { 'C–H': 6, 'C–C': 1 }, 'C₃H₈': { 'C–H': 8, 'C–C': 2 },
  'C₂H₄': { 'C–H': 4, 'C=C': 1 }, 'C₂H₂': { 'C–H': 2, 'C≡C': 1 }, 'CH₃Cl': { 'C–H': 3, 'C–Cl': 1 }, 'C₂H₅Cl': { 'C–H': 5, 'C–C': 1, 'C–Cl': 1 },
}
/** Dạng bền của đơn chất ở 25 °C, 1 bar (ΔfH°298 = 0). */
const DON_CHAT_BEN_T = new Set(['O₂|g', 'H₂|g', 'N₂|g', 'Cl₂|g', 'Fe|s', 'Al|s', 'Cu|s'])
/** "CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)" ⇒ [hệ số, công thức, thể]. Thiếu thể ⇒ ném lỗi. */
type ChatThe = [number, string, string]
interface PtThe { trai: ChatThe[]; phai: ChatThe[] }
function docPtThe(chu: string): PtThe {
  const ve = chu.split(/\s*[→⇌]\s*/)
  if (ve.length !== 2) throw new Error(`phương trình lạ: ${chu}`)
  const doc = (x: string): ChatThe[] => x.split(' + ').map((t) => {
    const m = /^(\d*)(.+)\((g|l|s)\)$/.exec(t.trim())
    if (!m) throw new Error(`số hạng thiếu thể: ${t}`)
    return [m[1] ? Number(m[1]) : 1, m[2]!, m[3]!]
  })
  return { trai: doc(ve[0]!), phai: doc(ve[1]!) }
}
const boTheT = (p: PtThe): PtT => ({ trai: p.trai.map(([k, c]) => [k, c]), phai: p.phai.map(([k, c]) => [k, c]) })
/** Số trong đề phải là số nguyên (sai số `sai`). */
const nguyenT = (x: number, ghi: string, sai = 1e-9) => { const r = Math.round(x); expect(Math.abs(x - r), `${ghi} ⇒ ${x}`).toBeLessThanOrEqual(sai); return r }

// ---------------------------------------------------------------- bộ giải độc lập theo nhãn (đọc chữ đề)

type KetQua = number | string
const GIAI: Record<string, (c: CauNenSinh) => KetQua> = {
  doi_mol_khoi_luong: ({ de }) => {
    let m = /^Tính số mol của ([\d,]+) gam (\S+)\.$/.exec(de)
    if (m) return sv(m[1]!) / M(m[2]!)
    m = /^Tính khối lượng \(gam\) của ([\d,]+) mol (\S+)\.$/.exec(de)
    if (m) return sv(m[1]!) * M(m[2]!)
    throw new Error(de)
  },
  doi_mol_the_tich_khi: ({ de }) => {
    let m = /^Tính số mol của ([\d,]+) lít khí (\S+) ở điều kiện chuẩn \(25 °C, 1 bar\)\.$/.exec(de)
    if (m) { M(m[2]!); return sv(m[1]!) / V_MOL }
    m = /^Tính thể tích \(lít\) của ([\d,]+) mol khí (\S+) ở điều kiện chuẩn \(25 °C, 1 bar\)\.$/.exec(de)
    if (m) return sv(m[1]!) * V_MOL
    m = /^Tính thể tích \(lít\) của ([\d,]+) gam khí (\S+) ở điều kiện chuẩn \(25 °C, 1 bar\)\.$/.exec(de)
    if (m) return sv(m[1]!) / M(m[2]!) * V_MOL
    throw new Error(de)
  },
  nong_do_mol: ({ de }) => {
    let m = /^Hoà tan ([\d,]+) mol (\S+) vào nước được (\d+) mL dung dịch\. Tính nồng độ mol \(M\) của dung dịch\.$/.exec(de)
    if (m) return sv(m[1]!) / (Number(m[3]) / 1000)
    m = /^Tính số mol (\S+) có trong (\d+) mL dung dịch (\S+) ([\d,]+) M\.$/.exec(de)
    if (m) { expect(m[3]).toBe(m[1]); return sv(m[4]!) * Number(m[2]) / 1000 }
    m = /^Hoà tan ([\d,]+) gam (\S+) vào nước được (\d+) mL dung dịch\. Tính nồng độ mol \(M\) của dung dịch\.$/.exec(de)
    if (m) return sv(m[1]!) / M(m[2]!) / (Number(m[3]) / 1000)
    throw new Error(de)
  },
  nong_do_phan_tram: ({ de }) => {
    let m = /^Hoà tan ([\d,]+) gam (\S+) vào ([\d,]+) gam nước\. Tính nồng độ phần trăm \(C%\) của dung dịch thu được\.$/.exec(de)
    if (m) return sv(m[1]!) / (sv(m[1]!) + sv(m[3]!)) * 100
    m = /^Tính khối lượng \(gam\) (\S+) có trong ([\d,]+) gam dung dịch (\S+) ([\d,]+)%\.$/.exec(de)
    if (m) return sv(m[2]!) * sv(m[4]!) / 100
    m = /^Tính khối lượng \(gam\) dung dịch (\S+) ([\d,]+)% có chứa ([\d,]+) gam (\S+)\.$/.exec(de)
    if (m) return sv(m[3]!) * 100 / sv(m[2]!)
    throw new Error(de)
  },
  khoi_luong_rieng: ({ de }) => {
    let m = /^Một dung dịch có khối lượng riêng ([\d,]+) g\/mL\. Tính khối lượng \(gam\) của (\d+) mL dung dịch này\.$/.exec(de)
    if (m) return sv(m[1]!) * Number(m[2])
    m = /^Một chất lỏng có khối lượng riêng ([\d,]+) g\/mL\. Tính thể tích \(mL\) của ([\d,]+) gam chất lỏng này\.$/.exec(de)
    if (m) return sv(m[2]!) / sv(m[1]!)
    m = /^Tính khối lượng \(gam\) của ([\d,]+) lít một dung dịch có khối lượng riêng ([\d,]+) g\/mL\.$/.exec(de)
    if (m) return sv(m[1]!) * 1000 * sv(m[2]!)
    throw new Error(de)
  },
  ti_khoi_khi: ({ de }) => {
    let m = /^Tính tỉ khối của khí (\S+) so với (?:khí (\S+)|không khí)\.$/.exec(de)
    if (m) return M(m[1]!) / (m[2] ? M(m[2]) : 29)
    m = /^Khí X có tỉ khối so với (?:khí (\S+)|không khí) là ([\d,]+)\. Tính khối lượng mol \(g\/mol\) của X\.$/.exec(de)
    if (m) return sv(m[2]!) * (m[1] ? M(m[1]) : 29)
    throw new Error(de)
  },
  ti_le_mol_phuong_trinh: ({ de }) => {
    const m0 = /^Cho phản ứng: (.+?)\. (.+)$/.exec(de)!
    const p = docPhuongTrinh(m0[1]!)
    expect(canBang(p), m0[1]).toBe(true)
    const hs = (c: string, ve: 'trai' | 'phai' | 'bat') => { const t = (ve === 'bat' ? [...p.trai, ...p.phai] : p[ve]).find(([, x]) => x === c); if (!t) throw new Error(`${c} không ở ${ve}: ${de}`); return t[0] }
    let m = R(`^Tính số mol ${TOKEN} tạo thành khi có ([\\d,]+) mol ${TOKEN} phản ứng hết\\.$`).exec(m0[2]!)
    if (m) return sv(m[2]!) * hs(m[1]!, 'phai') / hs(m[3]!, 'trai')
    m = R(`^Tính số mol ${TOKEN} cần dùng để phản ứng vừa đủ với ([\\d,]+) mol ${TOKEN}\\.$`).exec(m0[2]!)
    if (m) return sv(m[2]!) * hs(m[1]!, 'trai') / hs(m[3]!, 'trai')
    m = R(`^Để thu được ([\\d,]+) mol ${TOKEN} thì cần ít nhất bao nhiêu mol ${TOKEN}\\?$`).exec(m0[2]!)
    if (m) return sv(m[1]!) * hs(m[3]!, 'trai') / hs(m[2]!, 'phai')
    throw new Error(de)
  },
  bao_toan_khoi_luong: ({ de }) => {
    const m0 = /^Cho phản ứng: (.+?)\. (.+)$/.exec(de)!
    const p = docPhuongTrinh(m0[1]!)
    expect(canBang(p), m0[1]).toBe(true)
    const biet = new Map<string, number>()
    for (const x of m0[2]!.matchAll(new RegExp(`([\\d,]+) gam ${TOKEN}`, 'g'))) biet.set(x[2]!, sv(x[1]!))
    const an = R(`(?:^|\\s)m gam ${TOKEN}`).exec(m0[2]!)![1]!
    const trai = p.trai.map(([, c]) => c), phai = p.phai.map(([, c]) => c)
    const tong = (ds: string[]) => ds.filter((c) => c !== an).reduce((s, c) => { if (!biet.has(c)) throw new Error(`thiếu khối lượng ${c}: ${de}`); return s + biet.get(c)! }, 0)
    const kq = trai.includes(an) ? tong(phai) - tong(trai) : tong(trai) - tong(phai)
    // Đề không tự mâu thuẫn: số mol "theo hệ số" của mọi chất bằng nhau (khối lượng khớp tỉ lệ phương trình).
    const tat = new Map(biet).set(an, kq)
    const nHs = [...p.trai, ...p.phai].map(([k, c]) => tat.get(c)! / (k * M(c)))
    for (const x of nHs) expect(Math.abs(x - nHs[0]!)).toBeLessThan(1e-9)
    return kq
  },
  hieu_suat: ({ de }) => {
    const m0 = /^Cho phản ứng: (.+?)\. (.+)$/.exec(de)!
    const p = docPhuongTrinh(m0[1]!)
    expect(canBang(p), m0[1]).toBe(true)
    const hs = (c: string) => { const t = [...p.trai, ...p.phai].find(([, x]) => x === c); if (!t) throw new Error(`${c}: ${de}`); return t[0] }
    const laTrai = (c: string) => p.trai.some(([, x]) => x === c)
    const kl = [...m0[2]!.matchAll(new RegExp(`([\\d,]+) gam ${TOKEN}`, 'g'))].map((x) => ({ m: sv(x[1]!), c: x[2]! }))
    const H = /hiệu suất (\d+)%/.exec(m0[2]!)
    if (/Tính hiệu suất phản ứng \(%\)\.$/.test(de)) {
      const [A, B] = kl as [{ m: number; c: string }, { m: number; c: string }]
      expect(laTrai(A.c) && !laTrai(B.c)).toBe(true)
      return B.m / (A.m / M(A.c) * hs(B.c) / hs(A.c) * M(B.c)) * 100
    }
    let m = R(`Tính khối lượng \\(gam\\) ${TOKEN} thu được\\.$`).exec(de)
    if (m && H) { const A = kl[0]!; return A.m / M(A.c) * hs(m[1]!) / hs(A.c) * M(m[1]!) * Number(H[1]) / 100 }
    m = R(`^Để thu được ([\\d,]+) gam ${TOKEN} với hiệu suất (\\d+)%, cần dùng bao nhiêu gam ${TOKEN}(?: \\(|\\?)`).exec(m0[2]!)
    if (m) return sv(m[1]!) * 100 / Number(m[3]) / M(m[2]!) * hs(m[4]!) / hs(m[2]!) * M(m[4]!)
    throw new Error(de)
  },
  chat_du_het: ({ de }) => {
    const m0 = /^Cho phản ứng: (.+?)\. Cho ([\d,]+) mol (\S+) phản ứng với ([\d,]+) mol (\S+) \(phản ứng xảy ra hoàn toàn\)\. (.+)$/.exec(de)
    if (!m0) throw new Error(de)
    const p = docPhuongTrinh(m0[1]!)
    expect(canBang(p), m0[1]).toBe(true)
    const hs = (c: string) => [...p.trai, ...p.phai].find(([, x]) => x === c)![0]
    const nA = sv(m0[2]!), A = m0[3]!, nB = sv(m0[4]!), B = m0[5]!
    const tA = nA / hs(A), tB = nB / hs(B), t = Math.min(tA, tB)
    expect(Math.abs(tA - tB)).toBeGreaterThan(1e-9)
    const m = R(`^Tính số mol ${TOKEN} tạo thành\\.$`).exec(m0[6]!)
    if (m) return t * hs(m[1]!)
    if (/^Tính số mol chất còn dư sau phản ứng\.$/.test(m0[6]!)) return tA > tB ? nA - t * hs(A) : nB - t * hs(B)
    throw new Error(de)
  },
  phan_tram_khoi_luong: ({ de }) => {
    let m = /^Tính phần trăm khối lượng của nguyên tố (\S+) trong (\S+)\.$/.exec(de)
    if (m) return (phanTichCongThuc(m[2]!)[m[1]!] ?? Number.NaN) * NTK_T[m[1]!]! / M(m[2]!) * 100
    m = /^Hỗn hợp X gồm ([\d,]+) mol (\S+) và ([\d,]+) mol (\S+)\. Tính phần trăm khối lượng của (\S+) trong X\.$/.exec(de)
    if (m) { const mA = sv(m[1]!) * M(m[2]!), mB = sv(m[3]!) * M(m[4]!); return (m[5] === m[2] ? mA : mB) / (mA + mB) * 100 }
    throw new Error(de)
  },
  do_bat_bao_hoa: ({ de }) => {
    const m = /công thức (\S+)\.$/.exec(de)
    if (!m) throw new Error(de)
    const t = phanTichCongThuc(m[1]!)
    return (2 * (t.C ?? 0) + 2 + (t.N ?? 0) - (t.H ?? 0) - (t.Cl ?? 0)) / 2
  },
  ph_nong_do_ion: ({ de }) => {
    const acid: Record<string, number> = { HCl: 1, 'HNO₃': 1, 'H₂SO₄': 2 }, base: Record<string, number> = { NaOH: 1, KOH: 1, 'Ba(OH)₂': 2 }
    const pH = (chat: string, C: number) => {
      const v = acid[chat] ? -Math.log10(C * acid[chat]) : 14 + Math.log10(C * base[chat]!)
      expect(Math.abs(v - Math.round(v))).toBeLessThan(1e-9) // pH nguyên như mục tiêu đặc tả
      return Math.round(v)
    }
    let m = /^Tính pH của dung dịch (\S+) ([\d,]+) M \(coi \S+ phân li hoàn toàn\)\.$/.exec(de)
    if (m) return pH(m[1]!, sv(m[2]!))
    m = /^Dung dịch (\S+) có pH = (\d+)\. Tính nồng độ mol \(M\) của \S+ \(coi \S+ phân li hoàn toàn\)\.$/.exec(de)
    if (m) { const p = Number(m[2]); return acid[m[1]!] ? 10 ** -p / acid[m[1]!]! : 10 ** -(14 - p) / base[m[1]!]! }
    m = /^Hoà tan ([\d,]+) mol (\S+) vào nước được ([\d,]+) lít dung dịch\. Tính pH của dung dịch/.exec(de)
    if (m) return pH(m[2]!, sv(m[1]!) / sv(m[3]!))
    throw new Error(de)
  },
  dung_dich_pha_loang: ({ de }) => {
    let m = /^Pha loãng (\d+) mL dung dịch (\S+) ([\d,]+) M bằng nước thành ([\d,]+) mL dung dịch\./.exec(de)
    if (m) return sv(m[3]!) * Number(m[1]) / sv(m[4]!)
    m = /^Cần lấy bao nhiêu mL dung dịch (\S+) ([\d,]+) M để pha loãng thành ([\d,]+) mL dung dịch (\S+) ([\d,]+) M\?$/.exec(de)
    if (m) return sv(m[5]!) * sv(m[3]!) / sv(m[2]!)
    m = /^Thêm ([\d,]+) mL nước vào (\d+) mL dung dịch (\S+) ([\d,]+) M \(coi thể tích dung dịch sau khi pha bằng tổng thể tích\)\./.exec(de)
    if (m) return sv(m[4]!) * Number(m[2]) / (Number(m[2]) + sv(m[1]!))
    m = /^Thêm ([\d,]+) gam nước vào (\d+) gam dung dịch (\S+) ([\d,]+)%\./.exec(de)
    if (m) return sv(m[4]!) * Number(m[2]) / (Number(m[2]) + sv(m[1]!))
    throw new Error(de)
  },
  dien_phan_faraday: ({ de }) => {
    const ion: Record<string, { kl: string; e: number }> = { 'CuSO₄': { kl: 'Cu', e: 2 }, 'CuCl₂': { kl: 'Cu', e: 2 }, 'AgNO₃': { kl: 'Ag', e: 1 } }
    let m = /^Điện phân dung dịch (\S+) \(điện cực trơ\) với cường độ dòng điện ([\d,]+) A trong (\d+) giây\. Tính khối lượng \(gam\) (\S+) bám vào cathode\. Cho F = 96 500 C\/mol\.$/.exec(de)
    if (m) { const x = ion[m[1]!]!; expect(m[4]).toBe(x.kl); return NTK_T[x.kl]! * sv(m[2]!) * Number(m[3]) / (x.e * FARADAY) }
    m = /^Điện phân dung dịch (\S+) \(điện cực trơ\) với cường độ dòng điện ([\d,]+) A\. Sau bao nhiêu giây thì thu được ([\d,]+) gam (\S+) ở cathode\? Cho F = 96 500 C\/mol\.$/.exec(de)
    if (m) { const x = ion[m[1]!]!; expect(m[4]).toBe(x.kl); return sv(m[3]!) * x.e * FARADAY / (NTK_T[x.kl]! * sv(m[2]!)) }
    throw new Error(de)
  },
  gia_tri_trung_binh: ({ de }) => {
    let m = /^Hỗn hợp khí X gồm ([\d,]+) mol (\S+) và ([\d,]+) mol (\S+)\. Tính khối lượng mol trung bình \(g\/mol\) của X\.$/.exec(de)
    if (m) return (sv(m[1]!) * M(m[2]!) + sv(m[3]!) * M(m[4]!)) / (sv(m[1]!) + sv(m[3]!))
    m = /^Hỗn hợp khí X gồm (\S+) và (\S+) có tỉ khối so với H₂ là ([\d,]+)\. Tính phần trăm số mol của (\S+) trong X\.$/.exec(de)
    if (m) { const A = m[4]!, B = A === m[1] ? m[2]! : m[1]!; return (sv(m[3]!) * 2 - M(B)) / (M(A) - M(B)) * 100 }
    throw new Error(de)
  },
  the_dien_cuc_pin: ({ de }) => {
    let m = /^Cho thế điện cực chuẩn: E°\(([^)]+)\) = ([+−]?[\d,]+) V; E°\(([^)]+)\) = ([+−]?[\d,]+) V\. Tính sức điện động chuẩn \(V\) của pin điện hoá tạo bởi hai cặp này\.$/.exec(de)
    if (m) {
      expect(sv(m[2]!)).toBe(E0_T[m[1]!]); expect(sv(m[4]!)).toBe(E0_T[m[3]!]) // E° in đúng SGK
      return Math.abs(sv(m[2]!) - sv(m[4]!))
    }
    m = /^Pin điện hoá tạo bởi hai cặp (\S+) và (\S+) có sức điện động chuẩn ([\d,]+) V\. Biết E°\(([^)]+)\) = ([+−]?[\d,]+) V và cặp (\S+) là cực dương\. Tính E°\(([^)]+)\) \(V\)\.$/.exec(de)
    if (m) {
      expect(sv(m[5]!)).toBe(E0_T[m[4]!]); expect(m[6]).toBe(m[7])
      const kq = sv(m[3]!) + sv(m[5]!)
      expect(Math.abs(kq - E0_T[m[7]!]!)).toBeLessThan(1e-9) // đáp án chính là E° SGK của cặp cực dương
      return kq
    }
    throw new Error(de)
  },
  toc_do_phan_ung: ({ de }) => {
    const m0 = /^Cho phản ứng: (.+?)\. (.+)$/.exec(de)!
    const p = docPhuongTrinh(m0[1]!)
    expect(canBang(p), m0[1]).toBe(true)
    const hs = (c: string) => [...p.trai, ...p.phai].find(([, x]) => x === c)![0]
    let m = /^Nồng độ ban đầu của (\S+) là ([\d,]+) M; sau (\d+) giây, nồng độ (\S+) còn ([\d,]+) M\./.exec(m0[2]!)
    if (m) return (sv(m[2]!) - sv(m[5]!)) / (hs(m[1]!) * Number(m[3]))
    m = /^Sau (\d+) giây, nồng độ (\S+) giảm từ ([\d,]+) M xuống ([\d,]+) M\./.exec(m0[2]!)
    if (m) return (sv(m[3]!) - sv(m[4]!)) / (hs(m[2]!) * Number(m[1]))
    m = /^Sau (\d+) giây, nồng độ (\S+) tăng từ 0 lên ([\d,]+) M\./.exec(m0[2]!)
    if (m) return sv(m[3]!) / (hs(m[2]!) * Number(m[1]))
    throw new Error(de)
  },
  can_bang_phuong_trinh: ({ de, pa }) => {
    if (/^Phương trình hoá học nào sau đây được cân bằng đúng/.test(de)) {
      const dung = (['A', 'B', 'C', 'D'] as const).filter((k) => canBang(docPhuongTrinh(pa![k])))
      expect(dung, JSON.stringify(pa)).toHaveLength(1) // đúng MỘT phương án cân bằng, ba phương án nhiễu lệch nguyên tử
      const p = docPhuongTrinh(pa![dung[0]!])
      expect([...p.trai, ...p.phai].map(([k]) => k).reduce(ucln)).toBe(1) // tối giản
      return dung[0]!
    }
    const m = /^Cho sơ đồ phản ứng: (.+?)\. Sau khi cân bằng với hệ số nguyên, tối giản, tổng hệ số của các chất trong phương trình là$/.exec(de)
    if (!m) throw new Error(de)
    const [a, b] = m[1]!.split(/\s*[→⇌]\s*/)
    const h = tuCanBang(a!.split(' + '), b!.split(' + '))
    const tong = h.reduce((s, x) => s + x, 0)
    const trung = (['A', 'B', 'C', 'D'] as const).filter((k) => Number(pa![k]) === tong)
    expect(trung).toHaveLength(1)
    return trung[0]!
  },
  bao_toan_nguyen_to: ({ de }) => {
    let m = /^Đốt cháy hoàn toàn m gam một hydrocarbon X, thu được ([\d,]+) mol CO₂ và ([\d,]+) mol H₂O\. Tính m\.$/.exec(de)
    if (m) return sv(m[1]!) * NTK_T.C! + sv(m[2]!) * 2 * NTK_T.H!
    m = /thu được ([\d,]+) mol CO₂ và ([\d,]+) mol H₂O\. Tính số mol O₂ đã phản ứng\.$/.exec(de)
    if (m) return (2 * sv(m[1]!) + sv(m[2]!)) / 2
    m = /^Đốt cháy hoàn toàn ([\d,]+) mol một hydrocarbon X, thu được ([\d,]+) mol CO₂ và ([\d,]+) mol H₂O\. Tính số nguyên tử hydrogen trong một phân tử X\.$/.exec(de)
    if (m) {
      const n = sv(m[1]!), x = lam9(sv(m[2]!) / n), y = lam9(2 * sv(m[3]!) / n)
      expect(Number.isInteger(x) && Number.isInteger(y) && y <= 2 * x + 2 && y % 2 === 0, de).toBe(true) // hydrocarbon có thật
      return y
    }
    throw new Error(de)
  },

  // ---------------------------------------------------------------- 6 nhãn mới (05/10)
  bao_toan_electron: ({ de }) => {
    const m = /^Hoà tan hoàn toàn (m|[\d,]+) gam (\S+) trong dung dịch (HNO₃|H₂SO₄) (loãng|đặc, nóng), dư, thu được (V|[\d,]+) lít khí (\S+) \(sản phẩm khử duy nhất của (N⁺⁵|S⁺⁶), ở điều kiện chuẩn 25 °C, 1 bar\)\. Tính (m|V)\.$/.exec(de)
    if (!m) throw new Error(de)
    const mKl = m[1]!, kl = m[2]!, axit = m[3]!, moiTruong = m[4]!, vKhi = m[5]!, khi = m[6]!, nguon = m[7]!, hoi = m[8]!
    // Hoá trị khi tan HẾT trong axit có tính oxi hoá mạnh, DƯ (Fe ⇒ Fe³⁺).
    const HOA_TRI_MAX: Record<string, number> = { Mg: 2, Al: 3, Zn: 2, Fe: 3, Cu: 2 }
    const z = HOA_TRI_MAX[kl]
    if (!z) throw new Error(`kim loại lạ: ${de}`)
    // Số electron 1 mol khí nhận, tính từ SỐ OXI HOÁ trong công thức khí (O = −2): N⁺⁵ / S⁺⁶ xuống số oxi hoá trong khí.
    const tp = phanTichCongThuc(khi), X = axit === 'HNO₃' ? 'N' : 'S', cao = axit === 'HNO₃' ? 5 : 6
    expect(Object.keys(tp).every((e) => e === X || e === 'O'), de).toBe(true)
    expect(nguon).toBe(axit === 'HNO₃' ? 'N⁺⁵' : 'S⁺⁶')
    const e = tp[X]! * cao - 2 * (tp.O ?? 0)
    expect(e, de).toBeGreaterThan(0)
    // Hoá học có thật: NO₂ ⇐ HNO₃ đặc, nóng; SO₂ ⇐ H₂SO₄ đặc, nóng; NO, N₂O, N₂ ⇐ HNO₃ loãng; Cu, Fe không cho N₂O, N₂.
    expect(moiTruong, de).toBe(khi === 'SO₂' || khi === 'NO₂' ? 'đặc, nóng' : 'loãng')
    if (kl === 'Cu' || kl === 'Fe') expect(['NO', 'NO₂', 'SO₂'], de).toContain(khi)
    if (hoi === 'V') { expect(vKhi).toBe('V'); return sv(mKl) / NTK_T[kl]! * z / e * V_MOL }
    expect(mKl).toBe('m')
    return sv(vKhi) / V_MOL * e / z * NTK_T[kl]!
  },
  lap_he_phuong_trinh: ({ de }) => {
    const m = /^Cho ([\d,]+) gam hỗn hợp X gồm (\S+) và (\S+) tác dụng hết với dung dịch (HCl dư|H₂SO₄ loãng, dư), thu được ([\d,]+) lít khí H₂ \(ở điều kiện chuẩn 25 °C, 1 bar\)\. Tính (khối lượng \(gam\)|phần trăm khối lượng) của (\S+) trong X\.$/.exec(de)
    if (!m) throw new Error(de)
    // Số mol H₂ do 1 mol kim loại sinh ra với axit KHÔNG có tính oxi hoá mạnh (Fe chỉ lên Fe²⁺).
    const H2_MOI_MOL: Record<string, number> = { Mg: 1, Zn: 1, Fe: 1, Al: 1.5 }
    const mX = sv(m[1]!), A = m[2]!, B = m[3]!, nH2 = sv(m[5]!) / V_MOL, hoi = m[7]!
    const a1 = NTK_T[A]!, b1 = NTK_T[B]!, a2 = H2_MOI_MOL[A]!, b2 = H2_MOI_MOL[B]!
    const D = a1 * b2 - a2 * b1
    expect(Math.abs(D), de).toBeGreaterThan(1e-9) // hệ có nghiệm duy nhất
    const x = (mX * b2 - nH2 * b1) / D, y = (a1 * nH2 - a2 * mX) / D
    expect(x > 1e-9 && y > 1e-9, `${de} ⇒ x = ${x}, y = ${y}`).toBe(true) // nghiệm dương
    expect([A, B]).toContain(hoi)
    const mHoi = hoi === A ? x * a1 : y * b1
    return m[6]!.startsWith('khối') ? mHoi : mHoi / mX * 100
  },
  cong_thuc_phan_tu: ({ de, pa }) => {
    let C: number, H: number, O: number
    let m = /^Đốt cháy hoàn toàn ([\d,]+) mol hydrocarbon X, thu được ([\d,]+) mol CO₂ và ([\d,]+) mol H₂O\. Công thức phân tử của X là$/.exec(de)
    if (m) {
      const n = sv(m[1]!)
      C = nguyenT(sv(m[2]!) / n, de); H = nguyenT(2 * sv(m[3]!) / n, de); O = 0
    } else if ((m = /^Đốt cháy hoàn toàn ([\d,]+) mol chất hữu cơ X \(phân tử gồm C, H, O\), thu được ([\d,]+) mol CO₂ và ([\d,]+) mol H₂O\. Biết khối lượng mol của X là (\d+) g\/mol\. Công thức phân tử của X là$/.exec(de))) {
      const n = sv(m[1]!), MX = Number(m[4])
      C = nguyenT(sv(m[2]!) / n, de); H = nguyenT(2 * sv(m[3]!) / n, de); O = nguyenT((MX - C * NTK_T.C! - H * NTK_T.H!) / NTK_T.O!, de)
      expect(O, de).toBeGreaterThanOrEqual(1)
    } else if ((m = /^Đốt cháy hoàn toàn ([\d,]+) gam chất hữu cơ X, thu được ([\d,]+) gam CO₂ và ([\d,]+) gam H₂O\. (?:Tỉ khối hơi của X so với H₂ là (\d+)|Khối lượng mol của X là (\d+) g\/mol)\. Công thức phân tử của X là$/.exec(de))) {
      const mX = sv(m[1]!), nC = sv(m[2]!) / M('CO₂'), nH = 2 * sv(m[3]!) / M('H₂O')
      const mO = mX - nC * NTK_T.C! - nH * NTK_T.H!
      expect(mO, de).toBeGreaterThanOrEqual(-1e-9) // không âm: dữ kiện không tự mâu thuẫn
      const MX = m[4] ? Number(m[4]) * M('H₂') : Number(m[5]), nX = mX / MX
      C = nguyenT(nC / nX, de); H = nguyenT(nH / nX, de); O = nguyenT(mO / NTK_T.O! / nX, de)
    } else if ((m = /^Chất hữu cơ X có thành phần khối lượng: ([\d,]+)% C; ([\d,]+)% H; còn lại là O\. Khối lượng mol của X là (\d+) g\/mol\. Công thức phân tử của X là$/.exec(de))) {
      const MX = Number(m[3])
      // % in đề đã làm tròn 2 chữ số ⇒ số nguyên tử lệch rất nhỏ khỏi số nguyên.
      C = nguyenT(MX * sv(m[1]!) / 100 / NTK_T.C!, de, 0.02); H = nguyenT(MX * sv(m[2]!) / 100 / NTK_T.H!, de, 0.05)
      O = nguyenT((MX - C * NTK_T.C! - H * NTK_T.H!) / NTK_T.O!, de)
      expect(O, de).toBeGreaterThanOrEqual(1)
    } else if ((m = /^Hydrocarbon X có ([\d,]+)% C về khối lượng\. Khối lượng mol của X là (\d+) g\/mol\. Công thức phân tử của X là$/.exec(de))) {
      const MX = Number(m[2])
      C = nguyenT(MX * sv(m[1]!) / 100 / NTK_T.C!, de, 0.02); H = nguyenT(MX - C * NTK_T.C!, de); O = 0
    } else throw new Error(de)
    // Bốn phương án đều là công thức HỢP LỆ (chỉ C, H, O; H chẵn; k = (2C + 2 − H) : 2 nguyên ≥ 0); đúng MỘT phương án khớp dữ kiện.
    const khop = (['A', 'B', 'C', 'D'] as const).filter((k) => {
      const t = phanTichCongThuc(pa![k]), c = t.C ?? 0, h = t.H ?? 0
      expect(Object.keys(t).every((e) => e === 'C' || e === 'H' || e === 'O') && c >= 1 && h >= 2, pa![k]).toBe(true)
      expect(h % 2, pa![k]).toBe(0)
      const kk = (2 * c + 2 - h) / 2
      expect(Number.isInteger(kk) && kk >= 0, pa![k]).toBe(true)
      return c === C && h === H && (t.O ?? 0) === O
    })
    expect(khop, `${de} | ${JSON.stringify(pa)} | cần C${C}H${H}O${O}`).toHaveLength(1)
    return khop[0]!
  },
  hang_so_can_bang: ({ de }) => {
    const m0 = /^Cho phản ứng: (.+?)\. (.+)$/.exec(de)
    if (!m0) throw new Error(de)
    const p = docPtThe(m0[1]!)
    expect([...p.trai, ...p.phai].every(([, , t]) => t === 'g'), de).toBe(true) // cân bằng pha khí
    expect(CAN_BANG_KC_T, de).toContain(m0[1]!.replace(/\(g\)/g, ''))
    expect(canBang(boTheT(p)), de).toBe(true)
    const C = new Map<string, number>()
    for (const x of m0[2]!.matchAll(/\[([^\]]+)\] = ([\d,]+) M/g)) C.set(x[1]!, sv(x[2]!))
    const V = /dung tích (\d+) lít/.exec(m0[2]!)
    if (V) for (const x of m0[2]!.matchAll(/([\d,]+) mol ([^\s,.]+)/g)) C.set(x[2]!, sv(x[1]!) / Number(V[1])) // số mol ⇒ nồng độ
    const tich = (ds: ChatThe[], f: (c: string) => number) => ds.reduce((s, [k, c]) => s * f(c) ** k, 1)
    const an = /Tính nồng độ mol \(M\) của (\S+) ở trạng thái cân bằng\.$/.exec(de)
    if (an) {
      const X = an[1]!, K = sv(/hằng số cân bằng Kc = ([\d,]+)\./.exec(de)![1]!)
      expect(C.has(X), de).toBe(false)
      const f = (c: string) => (c === X ? 1 : C.get(c)!)
      const A = tich(p.phai, f) / tich(p.trai, f)
      const laSp = p.phai.some(([, c]) => c === X), k = [...p.trai, ...p.phai].find(([, c]) => c === X)![0]
      return (laSp ? K / A : A / K) ** (1 / k)
    }
    expect(de).toMatch(/Tính hằng số cân bằng Kc của phản ứng ở nhiệt độ đó\.$/)
    for (const [, c] of [...p.trai, ...p.phai]) expect(C.has(c), `${de} — thiếu [${c}]`).toBe(true)
    return tich(p.phai, (c) => C.get(c)!) / tich(p.trai, (c) => C.get(c)!)
  },
  bien_thien_enthalpy: ({ de }) => {
    const dfDe = (s: string) => {
      const ra = new Map<string, number>()
      expect(s, de).toContain('ΔfH°298 của đơn chất bền bằng 0.')
      const m = /ΔfH°298 \(kJ\/mol\) của (.+?) (?:lần lượt là|là) (.+?); ΔfH°298 của đơn chất bền bằng 0\./.exec(s)
      if (m) {
        const chat = m[1]!.split(', '), gt = m[2]!.split('; ')
        expect(chat.length, de).toBe(gt.length)
        chat.forEach((c, i) => ra.set(c, sv(gt[i]!)))
      }
      return ra
    }
    const df = (biet: Map<string, number>, [, c, t]: ChatThe) => {
      if (Object.keys(phanTichCongThuc(c)).length === 1) { // đơn chất: phải ở dạng bền ⇒ 0
        expect(DON_CHAT_BEN_T.has(`${c}|${t}`), `${c}(${t}) không phải dạng bền: ${de}`).toBe(true)
        return 0
      }
      const v = biet.get(`${c}(${t})`)
      if (v === undefined) throw new Error(`đề thiếu ΔfH°298 của ${c}(${t}): ${de}`)
      return v
    }
    const luong = (p: PtThe, s: string) => {
      const x = /^(?:đốt cháy hoàn toàn |phân huỷ hoàn toàn )?(.+?)(?: phản ứng hết)?$/.exec(s)![1]!
      let ct: string, n: number, mm: RegExpExecArray | null
      if ((mm = /^([\d,]+) mol (\S+)$/.exec(x))) { ct = mm[2]!; n = sv(mm[1]!) }
      else if ((mm = /^([\d,]+) gam (\S+)$/.exec(x))) { ct = mm[2]!; n = sv(mm[1]!) / M(ct) }
      else if ((mm = /^([\d,]+) lít khí (\S+) \(ở điều kiện chuẩn 25 °C, 1 bar\)$/.exec(x))) { ct = mm[2]!; n = sv(mm[1]!) / V_MOL }
      else throw new Error(`lượng chất lạ: ${s}`)
      const chat = p.trai.find(([, c]) => c === ct)
      if (!chat) throw new Error(`${ct} không là chất phản ứng: ${de}`)
      if (/ lít khí /.test(x)) expect(chat[2], de).toBe('g')
      if (s.startsWith('đốt cháy')) expect(p.trai.some(([, c]) => c === 'O₂'), de).toBe(true)
      if (s.startsWith('phân huỷ')) expect(p.trai, de).toHaveLength(1)
      return { n, k: chat[0] }
    }
    // Thực tế: mọi phản ứng có O₂ tham gia trong bộ câu đều TOẢ nhiệt.
    const soatDau = (p: PtThe, dH: number) => { if (p.trai.some(([, c]) => c === 'O₂')) expect(dH, de).toBeLessThan(0) }
    let m = /^Cho phản ứng: (.+?)\. Biết (.+) Tính biến thiên enthalpy chuẩn ΔrH°298 \(kJ\) của phản ứng\.$/.exec(de)
    if (m) {
      const p = docPtThe(m[1]!), biet = dfDe(m[2]!)
      expect(canBang(boTheT(p)), de).toBe(true)
      const kq = p.phai.reduce((s, x) => s + x[0] * df(biet, x), 0) - p.trai.reduce((s, x) => s + x[0] * df(biet, x), 0)
      soatDau(p, kq)
      return kq
    }
    m = /^Cho phản ứng: (.+?), có ΔrH°298 = ([+−-]?[\d,]+) kJ\. Biết (.+) Tính ΔfH°298 \(kJ\/mol\) của (\S+)\.$/.exec(de)
    if (m) {
      const p = docPtThe(m[1]!), dH = sv(m[2]!), biet = dfDe(m[3]!), X = m[4]!
      expect(canBang(boTheT(p)), de).toBe(true)
      soatDau(p, dH)
      expect(biet.has(X), de).toBe(false)
      let k = 0, phia = 0, biet_ = 0
      for (const x of p.trai) { if (`${x[1]}(${x[2]})` === X) { k = x[0]; phia = -1 } else biet_ -= x[0] * df(biet, x) }
      for (const x of p.phai) { if (`${x[1]}(${x[2]})` === X) { k = x[0]; phia = 1 } else biet_ += x[0] * df(biet, x) }
      expect(k, de).toBeGreaterThan(0)
      return (dH - biet_) / (phia * k) // ΔrH = phần đã biết + phía · k · ΔfH(X)
    }
    m = /^Cho phương trình nhiệt hoá học: (.+?); ΔrH°298 = ([+−-]?[\d,]+) kJ\. Tính nhiệt lượng \(kJ\) (toả ra khi|cần cung cấp để) (.+)\.$/.exec(de)
    if (m) {
      const p = docPtThe(m[1]!), dH = sv(m[2]!)
      expect(canBang(boTheT(p)), de).toBe(true)
      soatDau(p, dH)
      expect(m[3] === 'toả ra khi', de).toBe(dH < 0)
      const { n, k } = luong(p, m[4]!)
      return Math.abs(dH) * n / k
    }
    m = /^Cho phản ứng: (.+?)\. Khi (.+) thì (toả ra|thu vào) ([\d,]+) kJ\. Tính biến thiên enthalpy chuẩn ΔrH°298 \(kJ\) của phản ứng theo phương trình trên\.$/.exec(de)
    if (m) {
      const p = docPtThe(m[1]!)
      expect(canBang(boTheT(p)), de).toBe(true)
      const { n, k } = luong(p, m[2]!)
      const kq = (m[3] === 'toả ra' ? -1 : 1) * sv(m[4]!) * k / n
      soatDau(p, kq)
      return kq
    }
    throw new Error(de)
  },
  nang_luong_lien_ket: ({ de }) => {
    const m = /^Cho phản ứng: (.+?)(?:, có ΔrH°298 = ([+−-]?\d+) kJ)?\. Biết năng lượng liên kết Eb \(kJ\/mol\): (.+?)\. Tính (.+)$/.exec(de)
    if (!m) throw new Error(de)
    const p = docPtThe(m[1]!)
    expect([...p.trai, ...p.phai].every(([, , t]) => t === 'g'), de).toBe(true) // mọi chất ở thể khí
    expect(canBang(boTheT(p)), de).toBe(true)
    const eb = new Map<string, number>()
    for (const x of m[3]!.split('; ')) { const y = /^(\S+) (\d+)$/.exec(x); if (!y) throw new Error(`Eb lạ: ${x}`); eb.set(y[1]!, Number(y[2])) }
    const dem = (ds: ChatThe[]) => {
      const d = new Map<string, number>()
      for (const [k, c] of ds) {
        const lk = LK_T[c]
        if (!lk) throw new Error(`test chưa có cấu tạo ${c}`)
        for (const [b, n] of Object.entries(lk)) d.set(b, (d.get(b) ?? 0) + k * n)
      }
      return d
    }
    const dT = dem(p.trai), dP = dem(p.phai)
    const gia = (b: string) => { const v = eb.get(b); if (v === undefined) throw new Error(`đề thiếu Eb(${b}): ${de}`); return v }
    if (m[4] === 'biến thiên enthalpy chuẩn ΔrH°298 (kJ) của phản ứng theo năng lượng liên kết.') {
      expect(m[2], de).toBeUndefined()
      const tong = (d: Map<string, number>) => [...d].reduce((s, [b, n]) => s + n * gia(b), 0)
      return tong(dT) - tong(dP)
    }
    const an = /^năng lượng liên kết Eb\((\S+)\) \(kJ\/mol\)\.$/.exec(m[4]!)
    if (!an || m[2] === undefined) throw new Error(de)
    const X = an[1]!, dH = sv(m[2])
    expect(eb.has(X), de).toBe(false)
    let biet = 0, c = 0
    for (const [b, n] of dT) { if (b === X) c += n; else biet += n * gia(b) }
    for (const [b, n] of dP) { if (b === X) c -= n; else biet -= n * gia(b) }
    expect(c, de).not.toBe(0)
    return (dH - biet) / c
  },
  bao_toan_dien_tich: ({ de }) => {
    const m0 = /^Dung dịch X chứa (.+?)\. (Tính x\.|Cô cạn dung dịch X thu được (m|[\d,]+) gam muối khan\. Tính (m|x|y)\.)$/.exec(de)
    if (!m0) throw new Error(de)
    const coCan = m0[2]!.startsWith('Cô cạn')
    const ds = m0[1]!.split(/, | và /).map((t) => {
      const m = /^([\d,]+|x|y) mol (\S+)$/.exec(t)
      if (!m || !ION_T[m[2]!]) throw new Error(`ion lạ "${t}": ${de}`)
      const [q, Mi] = ION_T[m[2]!]!
      return { ten: m[2]!, q, Mi, bien: m[1] === 'x' || m[1] === 'y' ? m[1] : '', n: m[1] === 'x' || m[1] === 'y' ? 0 : sv(m[1]!) }
    })
    kiemIonCungTonTai(ds.map((i) => i.ten), coCan, de)
    const biet = ds.filter((i) => !i.bien), an = ds.filter((i) => i.bien)
    const S = biet.reduce((s, i) => s + i.q * i.n, 0) // tổng điện tích đã biết (có dấu)
    const mBiet = biet.reduce((s, i) => s + i.Mi * i.n, 0)
    if (!coCan) { // (a) một ẩn: S + q·x = 0
      expect(an.map((i) => i.bien), de).toEqual(['x'])
      const x = -S / an[0]!.q
      expect(x, de).toBeGreaterThan(0)
      return x
    }
    if (m0[3] === 'm') { // (b) tìm ẩn (nếu có) rồi cộng khối lượng các ion
      expect(an.length, de).toBeLessThanOrEqual(1)
      if (!an.length) { expect(Math.abs(S), de).toBeLessThan(1e-9); return mBiet }
      const x = -S / an[0]!.q
      expect(x, de).toBeGreaterThan(0)
      return mBiet + x * an[0]!.Mi
    }
    // (c) hai ẩn: qA·x + qB·y = −S; MA·x + MB·y = m − m(ion đã biết)
    expect(an.map((i) => i.bien), de).toEqual(['x', 'y'])
    const A = an[0]!, B = an[1]!, R = sv(m0[3]!) - mBiet, D = A.q * B.Mi - B.q * A.Mi
    expect(Math.abs(D), de).toBeGreaterThan(1e-9)
    const x = (-S * B.Mi - B.q * R) / D, y = (A.q * R + A.Mi * S) / D
    expect(x > 1e-9 && y > 1e-9, `${de} ⇒ x = ${x}, y = ${y}`).toBe(true)
    return m0[4] === 'x' ? x : y
  },
}

const SO_CAU = 50
const tatCa = new Map<string, CauNenSinh[]>(NHAN_CO_BO_SINH.map((n) => [n, sinhLoCauNen(n, 1, SO_CAU)]))

describe('Bộ sinh câu nền — danh mục', () => {
  it('đủ 27 nhãn tính toán (20 nhãn đầu + 6 bước tính toán + bảo toàn điện tích thêm 05/10), mỗi nhãn có bộ giải độc lập và ≥ 50 câu khác nội dung', () => {
    expect(NHAN_CO_BO_SINH).toHaveLength(27)
    expect([...NHAN_CO_BO_SINH].sort()).toEqual(['bao_toan_khoi_luong', 'bao_toan_nguyen_to', 'can_bang_phuong_trinh', 'chat_du_het', 'dien_phan_faraday',
      'do_bat_bao_hoa', 'doi_mol_khoi_luong', 'doi_mol_the_tich_khi', 'dung_dich_pha_loang', 'gia_tri_trung_binh', 'hieu_suat', 'khoi_luong_rieng',
      'nong_do_mol', 'nong_do_phan_tram', 'ph_nong_do_ion', 'phan_tram_khoi_luong', 'the_dien_cuc_pin', 'ti_khoi_khi', 'ti_le_mol_phuong_trinh', 'toc_do_phan_ung',
      ...NHAN_MOI].sort())
    for (const n of NHAN_CO_BO_SINH) {
      expect(GIAI[n], n).toBeTypeOf('function')
      expect(soCauKhongGian(n), n).toBeGreaterThanOrEqual(SO_CAU)
    }
    expect(coBoSinh('tinh_chat_hoa_hoc')).toBe(false)
    expect(coBoSinh('lam_tron_ket_qua')).toBe(false)
    expect(sinhCauNen('tinh_chat_hoa_hoc', 1)).toBeNull()
    expect(sinhCauNen('hieu_suat', 0)).toBeNull()
  })
})

describe.each(NHAN_CO_BO_SINH.map((n) => [n]))('Kiểm chéo 50 câu — %s', (nhan) => {
  const ds = tatCa.get(nhan)!
  it('đáp án = kết quả bộ giải độc lập (khớp tuyệt đối), hữu hạn, ≤ 3 chữ số thập phân; dương (riêng ΔrH°298 / ΔfH°298 được âm, khác 0)', () => {
    const coAm = NHAN_AM.includes(nhan)
    for (const c of ds) {
      const kq = GIAI[nhan]!(c)
      if (c.kieu === 'tn') { expect(c.dap_an, c.de).toBe(kq); continue }
      const so = kq as number
      expect(Number.isFinite(so) && (coAm ? Math.abs(so) > 1e-9 : so > 0), c.de).toBe(true)
      expect(soLe(so), `${c.de} ⇒ ${so}`).toBeLessThanOrEqual(3)
      expect(Math.abs(docSo(c.dap_an)! - so), `${c.de} | đáp án ${c.dap_an} ≠ ${so}`).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(so)))
      expect(Math.abs(Number(c.gia_tri_dung) - so)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(so)))
      expect(c.dap_an).not.toContain('.') // dấu phẩy thập phân như app đang chấm
      expect(c.dap_an).toMatch(coAm ? /^-?\d+(,\d{1,3})?$/ : /^\d+(,\d{1,3})?$/)
    }
  })
  it('chamCauNen chấm ĐÚNG đáp án và chấm SAI đáp án lệch 5 % (trắc nghiệm: chấm sai chữ cái khác)', () => {
    for (const c of ds) {
      const dong = { kieu: c.kieu, dap_an: c.dap_an, gia_tri_dung: c.gia_tri_dung }
      expect(chamCauNen(dong, c.dap_an), c.de).toBe(true)
      if (c.kieu === 'tn') {
        for (const k of ['A', 'B', 'C', 'D'].filter((x) => x !== c.dap_an)) expect(chamCauNen(dong, k)).toBe(false)
      } else {
        const g = Number(c.gia_tri_dung)
        expect(chamCauNen(dong, String(lam9(g * 1.05)).replace('.', ','))).toBe(false)
        expect(chamCauNen(dong, String(lam9(g * 0.95)).replace('.', ','))).toBe(false)
        expect(chamCauNen(dong, String(g))).toBe(true) // gõ dấu chấm cũng được
      }
    }
  })
  it('mã sinh.<nhãn>.<số> không trùng, khớp /^[\\w.-]{1,80}$/, qua được locCauNen; khuôn câu đủ trường', () => {
    const ids = ds.map((c) => c.id)
    expect(new Set(ids).size).toBe(ds.length)
    expect(new Set(ds.map((c) => `${c.de}|${c.pa_json ?? ''}`)).size).toBe(ds.length) // 50 câu đầu không lặp nội dung
    ds.forEach((c, i) => {
      expect(c.id).toBe(`sinh.${nhan}.${i + 1}`)
      expect(c.id).toMatch(/^[\w.-]{1,80}$/)
      expect(c.nhan).toBe(nhan)
      expect([1, 2]).toContain(c.muc)
      expect(c.giai.length).toBeGreaterThanOrEqual(2)
      expect(c.giai.length).toBeLessThanOrEqual(4)
      expect(JSON.parse(c.giai_json)).toEqual(c.giai)
      expect(c.meo.length).toBeGreaterThan(10)
      // \bNaN\b: không bắt nhầm công thức NaNO₃.
      expect(c.de).not.toMatch(/undefined|\bNaN\b|null|\[object/)
      expect(c.giai.join(' ')).not.toMatch(/undefined|\bNaN\b|null|\[object/)
      if (c.kieu === 'tn') {
        expect(c.pa && Object.keys(c.pa)).toEqual(['A', 'B', 'C', 'D'])
        expect(new Set(Object.values(c.pa!)).size).toBe(4)
        expect(JSON.parse(c.pa_json!)).toEqual(c.pa)
      } else expect(c.pa).toBeNull()
      const tho = { id: c.id, nhan: c.nhan, muc: c.muc, kieu: c.kieu, de: c.de, pa: c.pa, dap_an: c.dap_an, gia_tri_dung: c.gia_tri_dung, giai: c.giai, meo: c.meo }
      const loc = locCauNen(tho)
      expect(loc, c.id).not.toBeNull()
      expect(loc!.id).toBe(c.id)
    })
  })
})

describe('Hoá học có thật (không chỉ đúng số học)', () => {
  // Độ tan ở 20 °C (SGK/sổ tay): không sinh dung dịch quá bão hoà. Bảng viết riêng ở test.
  const TRAN_PT: Record<string, number> = { NaCl: 26.4, KCl: 25.4, 'KNO₃': 24, 'CuSO₄': 17.1, 'Na₂CO₃': 17.7, HCl: 37 }
  const TRAN_M: Record<string, number> = { 'CuSO₄': 1.29, 'Na₂SO₄': 1.37, 'BaCl₂': 1.72, 'Na₂CO₃': 2.03, NaCl: 6.1, KCl: 4.5, 'KNO₃': 3.1 }
  const CAP_PHAN_UNG = [['NH₃', 'H₂S'], ['NH₃', 'Cl₂'], ['NH₃', 'SO₂'], ['NH₃', 'CO₂'], ['H₂S', 'SO₂'], ['H₂S', 'Cl₂'], ['Cl₂', 'C₂H₂'], ['Cl₂', 'C₂H₄'], ['Cl₂', 'H₂'], ['Cl₂', 'CH₄']]
  it('dung dịch không vượt độ tan; hỗn hợp khí không gồm hai khí phản ứng với nhau', () => {
    for (const n of ['nong_do_phan_tram', 'dung_dich_pha_loang', 'nong_do_mol']) {
      for (const c of sinhLoCauNen(n, 1, soCauKhongGian(n))) {
        for (const m of c.de.matchAll(/dung dịch (\S+) ([\d,]+)%/g)) expect(sv(m[2]!), c.de).toBeLessThanOrEqual(TRAN_PT[m[1]!] ?? 50)
        for (const m of c.de.matchAll(/dung dịch (\S+) ([\d,]+) M/g)) expect(sv(m[2]!), c.de).toBeLessThanOrEqual(TRAN_M[m[1]!] ?? 3)
        const ht = /^Hoà tan ([\d,]+) gam (\S+) vào ([\d,]+) gam nước/.exec(c.de)
        if (ht) expect(sv(ht[1]!) / (sv(ht[1]!) + sv(ht[3]!)) * 100, c.de).toBeLessThanOrEqual(TRAN_PT[ht[2]!] ?? 50)
        const htm = /^Hoà tan ([\d,]+) (mol|gam) (\S+) vào nước được (\d+) mL/.exec(c.de)
        if (htm) expect((htm[2] === 'mol' ? sv(htm[1]!) : sv(htm[1]!) / M(htm[3]!)) / (Number(htm[4]) / 1000), c.de).toBeLessThanOrEqual(TRAN_M[htm[3]!] ?? 3)
      }
    }
    for (const c of sinhLoCauNen('gia_tri_trung_binh', 1, soCauKhongGian('gia_tri_trung_binh'))) {
      const m = /Hỗn hợp khí X gồm (?:[\d,]+ mol )?(\S+) và (?:[\d,]+ mol )?(\S+?)(?: có|\.)/.exec(c.de)!
      for (const [a, b] of CAP_PHAN_UNG) expect([m[1], m[2]].sort().join('|'), c.de).not.toBe([a, b].sort().join('|'))
    }
  })
})

describe('Tất định', () => {
  it('cùng hạt giống (nhãn, số) ⇒ cùng câu — kể cả khi nạp lại mô-đun (đệm dựng lại từ đầu)', async () => {
    const truoc = JSON.stringify(NHAN_CO_BO_SINH.map((n) => sinhLoCauNen(n, 1, SO_CAU)))
    expect(JSON.stringify(NHAN_CO_BO_SINH.map((n) => sinhLoCauNen(n, 1, SO_CAU)))).toBe(truoc)
    vi.resetModules()
    const moi = await import('../server/src/omni-cau-nen-sinh')
    expect(JSON.stringify(moi.NHAN_CO_BO_SINH.map((n) => moi.sinhLoCauNen(n, 1, SO_CAU)))).toBe(truoc)
    expect(sinhCauNen('hieu_suat', 7)).toEqual(sinhLoCauNen('hieu_suat', 7, 1)[0])
  })
  it('mọi phản ứng viết sẵn trong bộ sinh đều cân bằng (bộ đếm nguyên tử riêng của test)', async () => {
    const m = await import('../server/src/omni-cau-nen-sinh')
    for (const p of [...m.PHAN_UNG_TINH, ...m.PHAN_UNG_CAN_BANG, ...m.PHAN_UNG_HIEU_SUAT.map((x) => x.p)]) {
      const chu = m.chuPhanUng(p)
      expect(canBang(docPhuongTrinh(chu)), chu).toBe(true)
    }
    for (const [cap, e] of Object.entries(m.E0_SGK)) expect(E0_T[cap], cap).toBe(e)
    // Phương trình của 3 nhãn nhiệt / cân bằng (có ghi thể): đủ thể, cân bằng.
    expect(m.PHAN_UNG_MOI_CHU.length).toBeGreaterThanOrEqual(6 + 20 + 15)
    for (const chu of m.PHAN_UNG_MOI_CHU) expect(canBang(boTheT(docPtThe(chu))), chu).toBe(true)
  })
})

describe('Bảy nhãn thêm 05/10 — TOÀN BỘ không gian câu qua bộ giải độc lập (không chỉ 50 câu đầu)', () => {
  it.each(NHAN_MOI.map((n) => [n]))('%s', (nhan) => {
    const ds = sinhLoCauNen(nhan, 1, soCauKhongGian(nhan))
    expect(ds.length).toBeGreaterThanOrEqual(SO_CAU)
    expect(new Set(ds.map((c) => `${c.de}|${c.pa_json ?? ''}`)).size).toBe(ds.length)
    for (const c of ds) {
      const kq = GIAI[nhan]!(c)
      if (c.kieu === 'tn') { expect(c.dap_an, c.de).toBe(kq); continue }
      const so = kq as number
      expect(Number.isFinite(so) && Math.abs(so) > 1e-9, c.de).toBe(true)
      if (!NHAN_AM.includes(nhan)) expect(so, c.de).toBeGreaterThan(0)
      expect(soLe(so), `${c.de} ⇒ ${so}`).toBeLessThanOrEqual(3)
      expect(Math.abs(docSo(c.dap_an)! - so), `${c.de} | đáp án ${c.dap_an} ≠ ${so}`).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(so)))
      expect([1, 2]).toContain(c.muc)
      expect(c.giai.length >= 2 && c.giai.length <= 4, c.id).toBe(true)
    }
  })
  it('đề cho sẵn mọi hằng số: ΔfH°298 + câu "đơn chất bền bằng 0", Eb, nồng độ / số mol cân bằng; khí đo ở 25 °C, 1 bar', () => {
    for (const c of sinhLoCauNen('bien_thien_enthalpy', 1, soCauKhongGian('bien_thien_enthalpy'))) {
      if (/ΔfH°298/.test(c.de)) expect(c.de, c.id).toContain('ΔfH°298 của đơn chất bền bằng 0.')
      if (/ lít khí /.test(c.de)) expect(c.de, c.id).toContain('ở điều kiện chuẩn 25 °C, 1 bar')
    }
    for (const c of sinhLoCauNen('nang_luong_lien_ket', 1, soCauKhongGian('nang_luong_lien_ket'))) expect(c.de, c.id).toContain('Biết năng lượng liên kết Eb (kJ/mol): ')
    for (const n of ['bao_toan_electron', 'lap_he_phuong_trinh']) for (const c of sinhLoCauNen(n, 1, soCauKhongGian(n))) expect(c.de, c.id).toContain('ở điều kiện chuẩn 25 °C, 1 bar')
  })
})

describe('Số âm (ΔrH°298 / ΔfH°298): docSo + chamCauNen của thang-tu-go.ts', () => {
  it('chấm ĐÚNG khi em gõ "-" (ASCII), "−" (U+2212), "–", có khoảng trắng, dấu chấm; chấm SAI khi mất dấu / dấu "+" / lệch 5 %', () => {
    const am = NHAN_AM.flatMap((n) => sinhLoCauNen(n, 1, soCauKhongGian(n))).filter((c) => Number(c.gia_tri_dung) < 0)
    expect(am.length).toBeGreaterThan(50)
    for (const c of am) {
      expect(c.dap_an, c.id).toMatch(/^-\d+(,\d{1,3})?$/)
      const dong = { kieu: c.kieu, dap_an: c.dap_an, gia_tri_dung: c.gia_tri_dung }, tri = c.dap_an.slice(1)
      for (const go of [c.dap_an, `-${tri}`, `−${tri}`, `– ${tri}`, ` − ${tri} `, `-${tri.replace(',', '.')}`]) expect(chamCauNen(dong, go), `${c.id}: ${go}`).toBe(true)
      for (const go of [tri, `+${tri}`]) expect(chamCauNen(dong, go), `${c.id}: ${go}`).toBe(false)
      const g = Number(c.gia_tri_dung)
      expect(chamCauNen(dong, String(lam9(g * 1.05)).replace('.', ','))).toBe(false)
      expect(chamCauNen(dong, String(lam9(g * 0.95)).replace('.', ','))).toBe(false)
    }
    expect(docSo('−890,3')).toBe(-890.3)
    expect(docSo('-890,3')).toBe(-890.3)
    expect(docSo('– 890,3')).toBe(-890.3)
    // Đáp án thầy nạp tay viết "−" (U+2212) cũng chấm được.
    expect(chamCauNen({ kieu: 'so', dap_an: '−92,3', gia_tri_dung: '-92.3' }, '-92,3')).toBe(true)
    expect(chamCauNen({ kieu: 'so', dap_an: '−92,3', gia_tri_dung: '-92.3' }, '92,3')).toBe(false)
  })
})

describe('Bảo toàn điện tích — ion cùng tồn tại, bảng ion, 26 nhãn cũ không đổi', () => {
  const ds = sinhLoCauNen('bao_toan_dien_tich', 1, soCauKhongGian('bao_toan_dien_tich'))
  it('MỌI câu: mọi cặp ion trong đề cùng tồn tại được (bảng cấm riêng); cô cạn không có HCO₃⁻, NH₄⁺, H⁺; đủ 3 dạng', () => {
    const dem = { a: 0, b: 0, c: 0 }
    for (const c of ds) {
      const ten = [...c.de.matchAll(/(?:[\d,]+|x|y) mol (\S+?)(?=,| và |\.)/g)].map((m) => m[1]!)
      expect(ten.length, c.de).toBeGreaterThanOrEqual(3)
      kiemIonCungTonTai(ten, c.de.includes('Cô cạn'), c.de)
      // Lời giải kết thúc đúng bằng đáp án (không chỉ đáp án đúng mà các bước cũng đúng số).
      const cuoi = c.giai[c.giai.length - 1]!
      if (/Tính m\.$/.test(c.de)) { dem.b++; expect(cuoi, c.id).toMatch(new RegExp(`= ${c.dap_an} gam\\.$`)) }
      else if (c.de.includes('Cô cạn')) {
        dem.c++
        expect(c.muc).toBe(2)
        const hoi = /Tính ([xy])\.$/.exec(c.de)![1]!
        expect(cuoi, c.id).toContain(`${hoi} = ${c.dap_an}${hoi === 'x' ? ';' : '.'}`)
        // Bước 1, 2 khớp bộ giải: vế phải phương trình điện tích = Σ điện tích ion đã biết; phương trình khối lượng = m − m(ion đã biết).
        const biet = [...c.de.matchAll(/([\d,]+) mol (\S+?)(?=,| và |\.)/g)].map((m) => ({ n: sv(m[1]!), ion: m[2]! }))
        expect(sv(/= ([\d,]+)\.$/.exec(c.giai[0]!)![1]!), c.id).toBeCloseTo(Math.abs(biet.reduce((s, i) => s + ION_T[i.ion]![0] * i.n, 0)), 9)
        const mMuoi = sv(/thu được ([\d,]+) gam/.exec(c.de)![1]!)
        expect(sv(/= ([\d,]+)\.$/.exec(c.giai[1]!)![1]!), c.id).toBeCloseTo(mMuoi - biet.reduce((s, i) => s + ION_T[i.ion]![1] * i.n, 0), 9)
      } else { dem.a++; expect(c.muc).toBe(1); expect(cuoi, c.id).toMatch(new RegExp(`x = ${c.dap_an}\\.$`)) }
    }
    expect(dem.a, JSON.stringify(dem)).toBeGreaterThanOrEqual(50)
    expect(dem.b, JSON.stringify(dem)).toBeGreaterThanOrEqual(50)
    expect(dem.c, JSON.stringify(dem)).toBeGreaterThanOrEqual(50)
  })
  it('bảng ion của test khớp chính công thức ion: điện tích đọc từ chỉ số trên, khối lượng từ nguyên tử khối SGK', () => {
    const TREN = '⁰¹²³⁴⁵⁶⁷⁸⁹'
    for (const [ion, [q, Mi]] of Object.entries(ION_T)) {
      const m = /^(.+?)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])$/.exec(ion)!
      const doLon = m[2] ? Number([...m[2]].map((c) => TREN.indexOf(c)).join('')) : 1
      expect(q, ion).toBe((m[3] === '⁺' ? 1 : -1) * doLon)
      expect(M(m[1]!), ion).toBe(Mi)
    }
    expect([M('NO₃'), M('SO₄'), M('CO₃'), M('PO₄'), NTK_T.Cl]).toEqual([62, 96, 60, 95, 35.5])
  })
  it('26 nhãn có trước sinh Y HỆT bản trước (băm toàn bộ không gian câu)', () => {
    expect(Object.keys(BAM_26_NHAN)).toHaveLength(26)
    for (const [n, bam] of Object.entries(BAM_26_NHAN)) expect(bamKhongGian(n), n).toBe(bam)
  })
})

describe('Bảng cấu tạo của test (năng lượng liên kết) tự kiểm bằng hoá trị', () => {
  it('mỗi phân tử: tổng bậc liên kết quanh mỗi nguyên tố = hoá trị × số nguyên tử; số liên kết = số nguyên tử − 1 (không vòng)', () => {
    const HOA_TRI: Record<string, number> = { C: 4, H: 1, O: 2, N: 3, Cl: 1, F: 1 }
    const BAC: Record<string, number> = { '–': 1, '=': 2, '≡': 3 }
    for (const [ct, lk] of Object.entries(LK_T)) {
      const tp = phanTichCongThuc(ct), quanh: Record<string, number> = {}
      for (const [b, n] of Object.entries(lk)) {
        const m = /^([A-Z][a-z]?)([–=≡])([A-Z][a-z]?)$/.exec(b)!
        quanh[m[1]!] = (quanh[m[1]!] ?? 0) + BAC[m[2]!]! * n
        quanh[m[3]!] = (quanh[m[3]!] ?? 0) + BAC[m[2]!]! * n
      }
      for (const [e, so] of Object.entries(tp)) expect(quanh[e], `${ct}: ${e}`).toBe(HOA_TRI[e]! * so)
      expect(Object.keys(quanh).every((e) => tp[e]), ct).toBe(true)
      expect(Object.values(lk).reduce((s, n) => s + n, 0), ct).toBe(Object.values(tp).reduce((s, n) => s + n, 0) - 1)
    }
  })
})

describe('D1 — damBaoCauNenTuDong / damBaoMoiCauNenTuDong', () => {
  const nap = (d: ReturnType<typeof taoD1That>, id: string, nhan: string) => d.sql.prepare(
    `INSERT INTO cau_nen (id, nhan, muc, kieu, de, pa_json, dap_an, gia_tri_dung, giai_json, meo, cap_nhat_luc) VALUES (?,?,1,'so','Câu thầy',NULL,'1','1','[]','',?)`,
  ).run(id, nhan, '2026-10-01T00:00:00.000Z')

  it('nhãn thiếu câu ⇒ thêm 8 câu sinh; KHÔNG đụng câu thầy đã nạp; đủ rồi ⇒ không thêm; nhãn không có bộ sinh ⇒ 0', async () => {
    const d = taoD1That()
    nap(d, 'hieu_suat-01', 'hieu_suat'); nap(d, 'hieu_suat-02', 'hieu_suat')
    const thayTruoc = JSON.stringify(d.sql.prepare("SELECT * FROM cau_nen WHERE id NOT LIKE 'sinh.%' ORDER BY id").all())
    expect(await damBaoCauNenTuDong(d.env, 'hieu_suat', 5, Date.parse('2026-10-05T17:00:00Z'))).toBe(8)
    expect(d.dem('cau_nen', "nhan = 'hieu_suat'")).toBe(10)
    expect(JSON.stringify(d.sql.prepare("SELECT * FROM cau_nen WHERE id NOT LIKE 'sinh.%' ORDER BY id").all())).toBe(thayTruoc)
    const ids = (d.sql.prepare("SELECT id FROM cau_nen WHERE id LIKE 'sinh.%' ORDER BY id").all() as { id: string }[]).map((x) => x.id).sort()
    expect(ids).toEqual(Array.from({ length: 8 }, (_, i) => `sinh.hieu_suat.${i + 1}`).sort())
    expect(await damBaoCauNenTuDong(d.env, 'hieu_suat')).toBe(0) // 10 ≥ 5
    expect(await damBaoCauNenTuDong(d.env, 'hieu_suat', 12)).toBe(8) // nâng ngưỡng ⇒ số tiếp theo 9..16, không ghi đè
    expect(d.dem('cau_nen', "id LIKE 'sinh.hieu_suat.%'")).toBe(16)
    expect(d.dem('cau_nen', "id = 'sinh.hieu_suat.16'")).toBe(1)
    expect(await damBaoCauNenTuDong(d.env, 'tinh_chat_hoa_hoc')).toBe(0)
    expect(d.dem('cau_nen', "nhan = 'tinh_chat_hoa_hoc'")).toBe(0)
    // Dòng đã ghi chấm được bằng chính chamCauNen của app.
    for (const x of d.sql.prepare("SELECT * FROM cau_nen WHERE id LIKE 'sinh.%'").all() as Record<string, string>[]) {
      expect(chamCauNen({ kieu: x.kieu!, dap_an: x.dap_an!, gia_tri_dung: x.gia_tri_dung }, x.dap_an)).toBe(true)
      expect(locCauNen({ ...x, pa: x.pa_json ? JSON.parse(x.pa_json) : null, giai: JSON.parse(x.giai_json!) })).not.toBeNull()
    }
  })

  it('việc đêm: mọi nhãn có bộ sinh đủ ≥ 5 câu; chạy lại không thêm gì (idempotent); câu thầy đã đủ thì giữ nguyên', async () => {
    const d = taoD1That()
    for (let i = 1; i <= 6; i++) nap(d, `nong_do_mol-0${i}`, 'nong_do_mol')
    const r = await damBaoMoiCauNenTuDong(d.env, Date.parse('2026-10-05T17:01:00Z'))
    expect(r.loi).toBeUndefined()
    expect(r.theoNhan.nong_do_mol).toBeUndefined()
    expect(r.soThem).toBe(8 * (NHAN_CO_BO_SINH.length - 1))
    for (const n of NHAN_CO_BO_SINH) expect(d.dem('cau_nen', `nhan = '${n}'`), n).toBeGreaterThanOrEqual(5)
    expect(d.dem('cau_nen', "nhan = 'nong_do_mol' AND id LIKE 'sinh.%'")).toBe(0)
    const chup = d.chup('cau_nen')
    expect((await damBaoMoiCauNenTuDong(d.env, Date.parse('2026-10-06T17:01:00Z'))).soThem).toBe(0)
    expect(d.chup('cau_nen')).toBe(chup)
  })
})
