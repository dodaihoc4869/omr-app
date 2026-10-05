// @vitest-environment node
// BỘ SINH BIẾN THỂ THEO DẠNG (server/src/bien-the-sinh.ts + server/src/bien-the/*.ts) — KIỂM CHÉO bằng bộ giải ĐỘC LẬP viết riêng ở đây.
// Bộ giải đọc lại CHÍNH CHỮ ĐỀ như học sinh (tách số liệu, tự phân tích công thức có chỉ số Unicode, tự tính khối lượng mol bằng bảng nguyên tử khối
// riêng, tự suy hệ số từ công thức / phương trình trong đề, tự giải phương trình bậc hai bằng công thức nghiệm, tự xếp thế điện cực theo bảng E° riêng)
// — KHÔNG import hằng số hay hàm tính nào của bộ sinh. Chọn bộ giải theo họ (`bienThe.ho`), trong họ nhận mẫu bằng chữ đề.
// Mỗi họ ≥ 600 câu, mỗi câu một hạt giống (đủ mọi mã dạng × Phần I/III × 3 mức độ); kiểm sâu: BIEN_THE_SO_CAU=5000 (05/10 đã chạy: 14 × 5000 câu
// xanh). Phần III: đáp số = làm tròn theo ĐÚNG câu "Làm tròn …" trong đề, ≤ 4 kí tự, ổn định khi làm tròn trung gian ±0,05 %; Phần I: đúng 1
// phương án khớp, 4 phương án khác nhau, lý do từng phương án khớp chữ cái đúng; đề không chứa đáp án; số liệu hợp lí (hiệu suất 50–98 %…).
// ĐÃ THỬ LÀM HỎNG BỘ SINH (05/10, mỗi lần một chỗ, chạy lại tệp này, rồi trả nguyên) — 14/14 lần ĐỎ: M(ethanol) 46 → 44; saccharose cho 4 → 2
// ethanol; thể tích mol 24,79 → 24; F 96 500 → 96 000; E° Fe³⁺/Fe²⁺ 0,771 → 0,3; Kc giải với V = 1 (số mol thay nồng độ); xà phòng hoá quên trừ
// glycerol; M cellulose triacetate 288 → 297; bỏ cổng ổn định làm tròn; cho nhiễu trùng đáp án; Fe trong H₂SO₄ đặc nóng lên Fe²⁺; ester no đơn
// chức M = 14n + 30; tráng bạc glucose 1 : 1 Ag; đảo thứ tự tên trong câu gán số.
import { createHash } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { apBienThe, cacDangCoBoSinh, cacHoDe, coBoSinh, sinhBienThe, type CauBienThe } from '../server/src/bien-the-sinh'
import { grade, publicQuestion, type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { laCauTuLuan } from '../src/lib/cau-tu-luan'
import { khoiCuaCau } from '../src/lib/khoi-cau'
import { maTrongTuVung } from '../src/lib/tu-vung-dang'

// ---------------------------------------------------------------- bảng + bộ phân tích RIÊNG của test

const NTK_T: Record<string, number> = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 64, Zn: 65, Ag: 108, Ba: 137 }
const V_MOL = 24.79
const FARADAY = 96500
const DUOI = '₀₁₂₃₄₅₆₇₈₉'
const veAscii = (s: string) => [...s].map((c) => (DUOI.includes(c) ? String(DUOI.indexOf(c)) : c)).join('').replace(/ₙ/g, '')

/** "Al₂(SO₄)₃", "[C₆H₇O₂(ONO₂)₃]", "CH₂OH[CHOH]₄COONH₄" ⇒ thành phần nguyên tố. Kí tự lạ ⇒ ném lỗi. */
function thanhPhan(ct: string): Record<string, number> {
  const s = veAscii(ct)
  let i = 0
  const soSau = () => { const m = /^\d+/.exec(s.slice(i)); if (!m) return 1; i += m[0].length; return Number(m[0]) }
  const nhom = (dong: string): Record<string, number> => {
    const ra: Record<string, number> = {}
    const cong = (o: Record<string, number>, k: number) => { for (const [e, n] of Object.entries(o)) ra[e] = (ra[e] ?? 0) + n * k }
    while (i < s.length && s[i] !== dong) {
      if (s[i] === '(' || s[i] === '[') {
        const mo = s[i]!, dongMoi = mo === '(' ? ')' : ']'
        i++
        const con = nhom(dongMoi)
        if (s[i] !== dongMoi) throw new Error(`thiếu ngoặc đóng: ${ct}`)
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
  const kq = nhom('')
  if (i !== s.length) throw new Error(`công thức thừa kí tự: ${ct}`)
  return kq
}
const MT = (ct: string) => Object.entries(thanhPhan(ct)).reduce((s, [e, n]) => {
  if (NTK_T[e] === undefined) throw new Error(`thiếu nguyên tử khối ${e} (${ct})`)
  return s + NTK_T[e]! * n
}, 0)
/** Phương trình chữ ⇒ hai vế [hệ số, công thức] (bỏ thể (g)/(l)/(s), điều kiện trong ngoặc cuối; hệ số "6n", "n" ⇒ với n = 1). */
function docPt(pt: string): { trai: [number, string][]; phai: [number, string][] } {
  const bo = pt.replace(/\s*\([^()]*(enzyme|ánh sáng|H⁺|t°|xúc tác|H₂SO₄ đặc)[^()]*\)\s*$/, '')
  const [a, b] = bo.split(/\s*[→⇌]\s*/)
  if (!a || !b) throw new Error(`phương trình lạ: ${pt}`)
  const ve = (x: string): [number, string][] => x.split(/\s\+\s/).map((t) => {
    const m = /^(\d*)n?(\S+?)(?:\((?:g|l|s|aq)\))?$/.exec(t.trim())
    if (!m) throw new Error(`số hạng lạ: ${t}`)
    return [m[1] ? Number(m[1]) : 1, m[2]!]
  })
  return { trai: ve(a), phai: ve(b) }
}
function canBang(pt: string): boolean {
  const p = docPt(pt), dem: Record<string, number> = {}
  for (const [k, c] of p.trai) for (const [e, n] of Object.entries(thanhPhan(c))) dem[e] = (dem[e] ?? 0) + k * n
  for (const [k, c] of p.phai) for (const [e, n] of Object.entries(thanhPhan(c))) dem[e] = (dem[e] ?? 0) - k * n
  return Object.values(dem).every((v) => Math.abs(v) < 1e-9)
}

const so = (s: string) => Number(s.replace(/\s/g, '').replace(',', '.'))
const S = '(\\d+(?:,\\d+)?)'
const R = (s: string) => new RegExp(s)
const soLeT = (x: number) => { const s = (Math.round(x * 1e9) / 1e9).toFixed(9).replace(/0+$/, '').replace(/\.$/, ''); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1 }
const tron = (x: number, d: number) => Math.round(x * 10 ** d * (1 + 1e-12)) / 10 ** d
const vietCo = (x: number, d: number) => tron(x, d).toFixed(d).replace('.', ',')
const soLeChu = (s: string) => (s.includes(',') ? s.length - s.indexOf(',') - 1 : 0)
const soTrong = (s: string) => (s.match(/\d+(?:,\d+)?/g) ?? []).map((t) => Number(t.replace(',', '.')))
function khoang(x: number, lo: number, hi: number, ten: string) { expect(x >= lo && x <= hi, `${ten} = ${x} ngoài [${lo}, ${hi}]`).toBe(true) }
/** Cắt câu hỏi cuối + câu làm tròn. */
function boCauHoi(text: string): string {
  return text.replace(/ \(Làm tròn kết quả đến hàng [^)]*\.\)$/, '').replace(/ Giá trị của \S+ là( bao nhiêu\?)?$/, '')
}
/** Chỉ số dưới Unicode của số nguyên (bộ giải tự viết công thức CₙH₂ₙO₂). */
const chiSoT = (k: number) => (k === 1 ? '' : String(k).split('').map((d) => DUOI[Number(d)]).join(''))

interface KQ { so?: number; chu?: string }
type BoGiai = (text: string) => KQ
const khop = (re: RegExp, s: string) => re.exec(s)

// ================================================================ BỘ GIẢI 1. LÊN MEN
/** Số mol ethanol (= CO₂) từ 1 mol chất (1 mắt xích): số hexose sau thuỷ phân (C : 6) × 2 — tự suy từ công thức. */
const CT_CHAT: Record<string, string> = { glucose: 'C₆H₁₂O₆', fructose: 'C₆H₁₂O₆', 'tinh bột': 'C₆H₁₀O₅', cellulose: 'C₆H₁₀O₅', saccharose: 'C₁₂H₂₂O₁₁' }
const hexose = (ten: string) => thanhPhan(CT_CHAT[ten]!).C! / 6
const kLenMen = (ten: string) => 2 * hexose(ten)
const ME = () => MT('C₂H₅OH')
const NL_HAM_LUONG: Record<string, [number, number]> = { 'quả nho chín': [5, 25], 'gạo': [60, 85], 'ngô hạt': [55, 75], 'sắn khô': [60, 80], 'khoai tây': [10, 30], 'mùn cưa': [35, 65], 'rỉ đường': [40, 85], 'nước mía': [8, 20] }
const giaiLenMen: BoGiai = (text) => {
  const de = boCauHoi(text)
  const CH = '(glucose|tinh bột|cellulose|saccharose)'
  const hs = (s: string) => { const m = /hiệu suất(?: cả quá trình)? (\d+)%/.exec(s); if (!m) throw new Error(`thiếu hiệu suất: ${s}`); const H = Number(m[1]); khoang(H, 50, 95, 'H'); return H / 100 }
  let m = khop(R(`^Lên men ${S} gam glucose thành ethanol với hiệu suất 100%, thu được m gam C₂H₅OH\\.$`), de)
  if (m) return { so: so(m[1]!) / MT('C₆H₁₂O₆') * kLenMen('glucose') * ME() }
  m = khop(R(`^Lên men ${S} gam glucose thành ethanol với hiệu suất 100%, thu được V lít khí CO₂ \\(đkc\\)\\.$`), de)
  if (m) return { so: so(m[1]!) / MT('C₆H₁₂O₆') * kLenMen('glucose') * V_MOL }
  m = khop(R(`^Để thu được ${S} gam ethanol bằng cách lên men glucose với hiệu suất 100%, cần dùng m gam glucose\\.$`), de)
  if (m) return { so: so(m[1]!) / ME() / kLenMen('glucose') * MT('C₆H₁₂O₆') }
  m = khop(R(`^Lên men ${S} gam glucose, thu được ${S} gam ethanol\\. Hiệu suất của quá trình lên men là H%\\.$`), de)
  if (m) return { so: so(m[2]!) / (so(m[1]!) / MT('C₆H₁₂O₆') * 2 * ME()) * 100 }
  m = khop(R(`^Lên men ${S} (gam|kg) ${CH} với (hiệu suất(?: cả quá trình)? \\d+%), thu được m (gam|kg) ethanol\\.`), de)
  if (m) { expect(m[2]).toBe(m[5]); return { so: so(m[1]!) / MT(CT_CHAT[m[3]!]!) * kLenMen(m[3]!) * hs(m[4]!) * ME() } }
  m = khop(R(`^Lên men ${S} gam ${CH} với (hiệu suất(?: cả quá trình)? \\d+%), thu được V lít khí CO₂ \\(đkc\\)\\.`), de)
  if (m) return { so: so(m[1]!) / MT(CT_CHAT[m[2]!]!) * kLenMen(m[2]!) * hs(m[3]!) * V_MOL }
  m = khop(R(`^Lên men ${S} gam ${CH} với (hiệu suất(?: cả quá trình)? \\d+%)\\..* Hấp thụ toàn bộ khí CO₂ sinh ra vào dung dịch Ca\\(OH\\)₂ dư, thu được m gam kết tủa\\.$`), de)
  if (m) return { so: so(m[1]!) / MT(CT_CHAT[m[2]!]!) * kLenMen(m[2]!) * hs(m[3]!) * MT('CaCO₃') }
  m = khop(R(`^Lên men m gam ${CH} với (hiệu suất(?: cả quá trình)? \\d+%)\\..* Hấp thụ toàn bộ khí CO₂ sinh ra vào dung dịch Ca\\(OH\\)₂ dư, thu được ${S} gam kết tủa\\.$`), de)
  if (m) return { so: so(m[3]!) / MT('CaCO₃') / kLenMen(m[1]!) / hs(m[2]!) * MT(CT_CHAT[m[1]!]!) }
  m = khop(R(`^Lên men ${S} gam ${CH}\\..* Hấp thụ toàn bộ khí CO₂ sinh ra vào dung dịch Ca\\(OH\\)₂ dư, thu được ${S} gam kết tủa\\. Hiệu suất của quá trình lên men là H%\\.$`), de)
  if (m) return { so: so(m[3]!) / MT('CaCO₃') / (so(m[1]!) / MT(CT_CHAT[m[2]!]!) * kLenMen(m[2]!)) * 100 }
  const NL = `${S} kg (quả nho chín|gạo|ngô hạt|sắn khô|khoai tây|mùn cưa|rỉ đường) \\(chứa ${S}% ${CH} về khối lượng, còn lại là tạp chất không lên men\\)`
  const ruou = (loai: string, x: string) => { const d = so(x); khoang(d, 10, 96, 'độ rượu'); expect(loai).toBe(d >= 70 ? 'cồn' : 'rượu'); return d / 100 }
  const dE = (s: string) => { const D = so(s); khoang(D, 0.78, 0.81, 'D ethanol'); return D }
  m = khop(R(`^Lên men ${NL} để sản xuất (rượu|cồn) ${S}°\\..* Biết hiệu suất cả quá trình là (\\d+)% và khối lượng riêng của ethanol là ${S} g/mL\\. Thể tích (rượu|cồn) ${S}° thu được là V lít\\.$`), de)
  if (m) {
    const [A, nl, p, ch] = [so(m[1]!), m[2]!, so(m[3]!), m[4]!]
    khoang(p, ...NL_HAM_LUONG[nl]!, 'hàm lượng'); khoang(Number(m[7]), 50, 95, 'H')
    return { so: A * p / 100 / MT(CT_CHAT[ch]!) * kLenMen(ch) * Number(m[7]) / 100 * ME() / dE(m[8]!) / ruou(m[5]!, m[6]!) }
  }
  m = khop(R(`^Để sản xuất ${S} lít (rượu|cồn) ${S}° cần dùng m kg (quả nho chín|gạo|ngô hạt|sắn khô|khoai tây|mùn cưa|rỉ đường) \\(chứa ${S}% ${CH} về khối lượng, còn lại là tạp chất không lên men\\)\\..* Biết hiệu suất cả quá trình là (\\d+)% và khối lượng riêng của ethanol là ${S} g/mL\\.$`), de)
  if (m) {
    const [V, x, p, ch, H] = [so(m[1]!), ruou(m[2]!, m[3]!), so(m[5]!), m[6]!, Number(m[7])]
    khoang(p, ...NL_HAM_LUONG[m[4]!]!, 'hàm lượng'); khoang(H, 50, 95, 'H')
    return { so: V * x * dE(m[8]!) / ME() / kLenMen(ch) / (H / 100) * MT(CT_CHAT[ch]!) / (p / 100) }
  }
  m = khop(R(`^Lên men ${NL}, thu được ${S} lít (rượu|cồn) ${S}°\\..* Biết khối lượng riêng của ethanol là ${S} g/mL\\. Hiệu suất cả quá trình là H%\\.$`), de)
  if (m) {
    const [A, p, ch, V, x] = [so(m[1]!), so(m[3]!), m[4]!, so(m[5]!), ruou(m[6]!, m[7]!)]
    return { so: (V * x * dE(m[8]!) / ME()) / (A * p / 100 / MT(CT_CHAT[ch]!) * kLenMen(ch)) * 100 }
  }
  m = khop(R(`^Thuỷ phân ${S} kg (tinh bột|cellulose) với hiệu suất (\\d+)%, toàn bộ glucose thu được đem lên men thành ethanol với hiệu suất (\\d+)%\\. Khối lượng ethanol thu được là m kg\\.$`), de)
  if (m) { khoang(Number(m[3]), 50, 95, 'H1'); khoang(Number(m[4]), 50, 95, 'H2'); return { so: so(m[1]!) / MT('C₆H₁₀O₅') * Number(m[3]) / 100 * 2 * Number(m[4]) / 100 * ME() } }
  throw new Error(`lên men — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 2. THUỶ PHÂN
const giaiThuyPhan: BoGiai = (text) => {
  const de = boCauHoi(text), CH = '(tinh bột|cellulose|saccharose)'
  // 1 mắt xích / 1 saccharose cho đúng 1 glucose (saccharose cho thêm 1 fructose).
  const glu = (m: number, ch: string) => m / MT(CT_CHAT[ch]!) * MT('C₆H₁₂O₆')
  let m = khop(R(`^Thuỷ phân hoàn toàn ${S} (gam|kg) ${CH} \\(xúc tác acid, đun nóng\\), thu được (?:dung dịch chứa )?m (gam|kg) glucose\\.$`), de)
  if (m) { expect(m[2]).toBe(m[4]); return { so: glu(so(m[1]!), m[3]!) } }
  m = khop(R(`^Thuỷ phân ${S} (gam|kg) ${CH} \\(xúc tác acid, đun nóng\\), thu được ${S} (gam|kg) glucose\\. Hiệu suất của phản ứng thuỷ phân là H%\\.$`), de)
  if (m) return { so: so(m[4]!) / glu(so(m[1]!), m[3]!) * 100 }
  m = khop(R(`^Thuỷ phân ${S} (gam|kg) ${CH} với hiệu suất (\\d+)% \\(xúc tác acid, đun nóng\\), thu được m (gam|kg) glucose\\.$`), de)
  if (m) { khoang(Number(m[4]), 50, 95, 'H'); return { so: glu(so(m[1]!), m[3]!) * Number(m[4]) / 100 } }
  m = khop(R(`^Để thu được ${S} (gam|kg) glucose cần thuỷ phân m (gam|kg) ${CH} với hiệu suất (\\d+)%\\.$`), de)
  if (m) { khoang(Number(m[5]), 50, 95, 'H'); return { so: so(m[1]!) / MT('C₆H₁₂O₆') * MT(CT_CHAT[m[4]!]!) / (Number(m[5]) / 100) } }
  m = khop(R(`^Thuỷ phân ${S} kg (gạo|sắn khô|khoai tây|mùn cưa|nước mía) \\(chứa ${S}% ${CH} về khối lượng, còn lại là tạp chất không bị thuỷ phân\\) với hiệu suất (\\d+)%, thu được m kg glucose\\.$`), de)
  if (m) { khoang(so(m[3]!), ...NL_HAM_LUONG[m[2]!]!, 'hàm lượng'); return { so: glu(so(m[1]!) * so(m[3]!) / 100, m[4]!) * Number(m[5]) / 100 } }
  m = khop(R(`^Thuỷ phân ${S} kg (tinh bột|cellulose) với hiệu suất (\\d+)%, toàn bộ glucose thu được dùng để pha chế dung dịch glucose (\\d+)%\\. Khối lượng dung dịch glucose \\4% pha được là m kg\\.$`), de)
  if (m) return { so: glu(so(m[1]!), m[2]!) * Number(m[3]) / 100 / (Number(m[4]) / 100) }
  m = khop(R(`^Thuỷ phân ${S} kg (gạo|sắn khô|khoai tây|mùn cưa|nước mía) \\(chứa ${S}% ${CH} về khối lượng, còn lại là tạp chất không bị thuỷ phân\\), thu được ${S} kg glucose\\. Hiệu suất của phản ứng thuỷ phân là H%\\.$`), de)
  if (m) return { so: so(m[5]!) / glu(so(m[1]!) * so(m[3]!) / 100, m[4]!) * 100 }
  throw new Error(`thuỷ phân — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 3. TRÁNG BẠC
const TOL = 'lượng dư dung dịch AgNO₃ trong NH₃, đun nóng'
const AG_MOI_MONO = 2 // R-CHO + 2[Ag(NH₃)₂]⁺ → 2Ag; fructose chuyển thành glucose trong NH₃
const giaiTrangBac: BoGiai = (text) => {
  const de = boCauHoi(text), MAg = MT('Ag'), MG = MT('C₆H₁₂O₆'), MS = MT('C₁₂H₂₂O₁₁')
  let m = khop(R(`^Cho ${S} gam (glucose|fructose) tác dụng hoàn toàn với ${TOL}, thu được m gam Ag\\.$`), de)
  if (m) return { so: so(m[1]!) / MG * AG_MOI_MONO * MAg }
  m = khop(R(`^Để tráng một lớp bạc có khối lượng ${S} gam lên mặt kính, người ta cho m gam glucose tác dụng với ${TOL} \\(hiệu suất 100%\\)\\.$`), de)
  if (m) return { so: so(m[1]!) / MAg / AG_MOI_MONO * MG }
  m = khop(R(`^Cho ${S} mol (glucose|fructose) tác dụng hoàn toàn với ${TOL}\\. Số mol Ag thu được là x\\.$`), de)
  if (m) return { so: so(m[1]!) * AG_MOI_MONO }
  m = khop(R(`^Cho ${S} gam glucose tác dụng với ${TOL}\\. Biết hiệu suất phản ứng tráng bạc là (\\d+)%, khối lượng Ag thu được là m gam\\.$`), de)
  if (m) return { so: so(m[1]!) / MG * AG_MOI_MONO * Number(m[2]) / 100 * MAg }
  m = khop(R(`^Cho hỗn hợp gồm ${S} gam glucose và ${S} gam fructose tác dụng hoàn toàn với ${TOL}, thu được m gam Ag\\.$`), de)
  if (m) return { so: (so(m[1]!) + so(m[2]!)) / MG * AG_MOI_MONO * MAg }
  m = khop(R(`^Cho ${S} gam dung dịch glucose tác dụng hoàn toàn với ${TOL}, thu được ${S} gam Ag\\. Nồng độ phần trăm của glucose trong dung dịch là C%\\.$`), de)
  if (m) { const C = so(m[2]!) / MAg / AG_MOI_MONO * MG / so(m[1]!) * 100; khoang(C, 0.5, 40, 'C%'); return { so: C } }
  m = khop(R(`^Hỗn hợp X gồm ${S} mol glucose và ${S} mol saccharose\\. Thuỷ phân hoàn toàn X trong môi trường acid, trung hoà acid rồi cho toàn bộ dung dịch thu được tác dụng với ${TOL}\\. Số mol Ag tối đa thu được là x\\.$`), de)
  if (m) return { so: so(m[1]!) * AG_MOI_MONO + so(m[2]!) * hexose('saccharose') * AG_MOI_MONO }
  m = khop(R(`^Một xưởng tráng gương cần tráng bạc cho (\\d+) chiếc gương, mỗi chiếc cần ${S} gam Ag\\. Bạc được tạo ra bằng cách cho m gam glucose tác dụng với ${TOL}; hiệu suất phản ứng tráng bạc là (\\d+)%\\.$`), de)
  if (m) return { so: Number(m[1]) * so(m[2]!) / MAg / AG_MOI_MONO / (Number(m[3]) / 100) * MG }
  m = khop(R(`^Thuỷ phân ${S} gam saccharose với hiệu suất (\\d+)%, trung hoà acid rồi cho toàn bộ dung dịch thu được tác dụng với ${TOL}, thu được m gam Ag\\.$`), de)
  if (m) return { so: so(m[1]!) / MS * Number(m[2]) / 100 * hexose('saccharose') * AG_MOI_MONO * MAg }
  m = khop(R(`^Để tráng bạc (\\d+) tấm gương, mỗi tấm có diện tích ${S} m² và lớp bạc dày ${S} μm, người ta dùng m gam glucose tác dụng với ${TOL}\\. Biết hiệu suất phản ứng tráng bạc là (\\d+)% và khối lượng riêng của bạc là 10,49 g/cm³\\.$`), de)
  if (m) {
    const Vcm3 = Number(m[1]) * so(m[2]!) * 1e4 * so(m[3]!) * 1e-4 // m² → cm²; μm → cm
    return { so: Vcm3 * 10.49 / MAg / AG_MOI_MONO / (Number(m[4]) / 100) * MG }
  }
  m = khop(R(`^Hỗn hợp X gồm ${S} mol glucose và ${S} mol saccharose\\. Thuỷ phân X trong môi trường acid với hiệu suất thuỷ phân saccharose (\\d+)%, trung hoà acid rồi cho toàn bộ dung dịch thu được tác dụng với ${TOL}\\. Số mol Ag thu được là x\\.$`), de)
  if (m) return { so: so(m[1]!) * AG_MOI_MONO + so(m[2]!) * Number(m[3]) / 100 * hexose('saccharose') * AG_MOI_MONO }
  m = khop(R(`^Một xưởng cần tráng bạc (\\d+) m² kính với lượng bạc ${S} g/m²\\. Bạc được tạo ra từ saccharose theo sơ đồ: saccharose → glucose \\+ fructose \\(thuỷ phân, hiệu suất (\\d+)%\\) → Ag \\(tráng bạc, hiệu suất (\\d+)%\\)\\. Khối lượng saccharose cần dùng là m kg\\.$`), de)
  if (m) return { so: Number(m[1]) * so(m[2]!) / MAg / (hexose('saccharose') * AG_MOI_MONO) / (Number(m[3]) / 100) / (Number(m[4]) / 100) * MS / 1000 }
  throw new Error(`tráng bạc — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 4. CELLULOSE TRINITRATE / TRIACETATE (đọc phương trình trong đề)
function docPtCellulose(de: string): { Msp: number; Mthuoc: number; heSo: number; tenSp: string } {
  const m = /\[C₆H₇O₂\(OH\)₃\]ₙ \+ (\d)n([^\s.,;]+) → \[(C₆H₇O₂\([^\]]+)\]ₙ \+ (\d)n([^\s.,;]+)/.exec(de)
  if (!m) throw new Error(`thiếu phương trình cellulose: ${de}`)
  const pt = `C₆H₇O₂(OH)₃ + ${m[1]}${m[2]} → ${m[3]} + ${m[4]}${m[5]}`
  expect(canBang(pt), pt).toBe(true)
  const tenSp = m[3]!.includes('ONO₂') ? 'cellulose trinitrate' : 'cellulose triacetate'
  return { Msp: MT(m[3]!), Mthuoc: MT(m[2]!), heSo: Number(m[1]), tenSp }
}
const giaiCellulose: BoGiai = (text) => {
  const de = boCauHoi(text), pt = docPtCellulose(de), MCel = MT('C₆H₁₀O₅')
  let m = khop(R(`^Cho ${S} kg cellulose phản ứng hoàn toàn với lượng dư (nitric acid|acetic anhydride) theo phương trình: .*\\. Khối lượng (cellulose trinitrate|cellulose triacetate) thu được là m kg\\.$`), de)
  if (m) { expect(m[3]).toBe(pt.tenSp); return { so: so(m[1]!) / MCel * pt.Msp } }
  m = khop(R(`^Từ ${S} tấn cellulose sản xuất (cellulose trinitrate|cellulose triacetate) theo phương trình: .*\\. Biết hiệu suất phản ứng là (\\d+)% \\(tính theo cellulose\\), khối lượng \\2 thu được là m tấn\\.$`), de)
  if (m) { khoang(Number(m[3]), 50, 95, 'H'); return { so: so(m[1]!) / MCel * pt.Msp * Number(m[3]) / 100 } }
  m = khop(R(`^Để sản xuất ${S} (kg|tấn) (cellulose trinitrate|cellulose triacetate) theo phương trình: .* với hiệu suất (\\d+)% \\(tính theo (nitric acid|acetic anhydride)\\), khối lượng \\5 tối thiểu cần dùng là m \\2\\.$`), de)
  if (m) return { so: so(m[1]!) / pt.Msp * pt.heSo * pt.Mthuoc / (Number(m[4]) / 100) }
  m = khop(R(`^Cellulose trinitrate được điều chế theo phương trình: .*\\. Để điều chế ${S} kg cellulose trinitrate \\(coi hiệu suất phản ứng đạt 100%\\) cần dùng V lít dung dịch HNO₃ (\\d+)% \\(D = ${S} g/mL\\)\\.$`), de)
  if (m) return { so: so(m[1]!) / pt.Msp * pt.heSo * pt.Mthuoc / (Number(m[2]) / 100) / so(m[3]!) }
  m = khop(R(`^Để điều chế ${S} kg cellulose trinitrate theo phương trình: .* với hiệu suất (\\d+)% \\(tính theo nitric acid\\), cần V lít dung dịch HNO₃ (\\d+)% \\(D = ${S} g/mL\\)\\.$`), de)
  if (m) return { so: so(m[1]!) / pt.Msp * pt.heSo / (Number(m[2]) / 100) * pt.Mthuoc / (Number(m[3]) / 100) / so(m[4]!) }
  m = khop(R(`^Tơ acetate được sản xuất từ bông theo phương trình: .*\\. Từ ${S} tấn bông chứa (\\d+)% cellulose về khối lượng, với hiệu suất phản ứng (\\d+)% \\(tính theo cellulose\\), thu được m tấn tơ acetate chứa (\\d+)% cellulose triacetate về khối lượng \\(còn lại là phụ gia\\)\\.$`), de)
  if (m) return { so: so(m[1]!) * Number(m[2]) / 100 / MCel * pt.Msp * Number(m[3]) / 100 / (Number(m[4]) / 100) }
  throw new Error(`cellulose — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 5. GÁN SỐ PHẢN ỨNG CHUYỂN HOÁ (tự phân loại phản ứng theo chất đầu – sản phẩm)
function tenPhanUng(dau: string[], sau: string[]): string {
  const co = (ds: string[], c: string) => ds.includes(c)
  if (co(dau, 'CO₂') && co(sau, '(C₆H₁₀O₅)ₙ')) return 'quang hợp'
  if ((co(dau, '(C₆H₁₀O₅)ₙ') || co(dau, 'C₁₂H₂₂O₁₁')) && co(sau, 'C₆H₁₂O₆')) return 'thuỷ phân'
  if (co(dau, 'C₆H₁₂O₆') && co(sau, 'C₂H₅OH')) return 'lên men rượu'
  if (co(dau, 'C₂H₅OH') && co(sau, 'CH₃COOH') && !co(dau, 'CH₃COOH')) return 'lên men giấm'
  if (co(dau, 'C₆H₁₂O₆') && co(sau, 'CH₃CH(OH)COOH')) return 'lên men lactic'
  if (co(dau, 'C₆H₁₂O₆') && co(dau, 'O₂') && co(sau, 'CO₂')) return 'oxi hoá hoàn toàn'
  if (co(dau, '[Ag(NH₃)₂]OH') || co(sau, 'Ag')) return 'tráng bạc'
  if (co(dau, 'CH₃COOH') && co(sau, 'CH₃COOC₂H₅')) return 'ester hoá'
  throw new Error(`không phân loại được: ${dau.join(' + ')} → ${sau.join(' + ')}`)
}
const giaiGanSo: BoGiai = (text) => {
  const tenM = /theo tên gọi: (.+?) và sắp xếp theo trình tự đó thành dãy (ba|bốn) số\./.exec(text)
  if (!tenM) throw new Error(`gán số — thiếu tên gọi: ${text}`)
  const ten = tenM[1]!.split(', ')
  expect(ten.length, `số tên gọi ≠ độ dài dãy đề nêu: ${text}`).toBe(tenM[2] === 'ba' ? 3 : 4)
  const soCua = new Map<string, number>()
  const sd = /^Cho sơ đồ chuyển hoá: (.+?)\. Gán số/.exec(text)
  if (sd) {
    const phan = sd[1]!.split(/ →\((\d)\) /)
    // [chất0, "1", chất1, "2", chất2, …]
    for (let i = 1; i < phan.length; i += 2) soCua.set(tenPhanUng([phan[i - 1]!], [phan[i + 1]!]), Number(phan[i]))
  } else {
    const ds = /^Cho các phương trình hoá học: (.+?)\. Gán số/.exec(text)
    if (!ds) throw new Error(`gán số — không nhận ra mẫu: ${text}`)
    for (const muc of ds[1]!.split(/; (?=\(\d\) )/)) {
      const m = /^\((\d)\) (.+)$/.exec(muc)!
      expect(canBang(m[2]!), m[2]).toBe(true)
      const p = docPt(m[2]!)
      soCua.set(tenPhanUng(p.trai.map(([, c]) => c), p.phai.map(([, c]) => c)), Number(m[1]))
    }
  }
  expect(soCua.size, text).toBe(ten.length)
  return { chu: ten.map((t) => { const k = soCua.get(t); if (!k) throw new Error(`thiếu phản ứng ${t}: ${text}`); return String(k) }).join('') }
}

// ================================================================ BỘ GIẢI 6. XÀ PHÒNG HOÁ (đọc công thức ester RCOOR' trong đề ⇒ muối RCOONa, alcohol R'OH)
const GOC_BEO: Record<string, string> = { tristearin: 'C₁₇H₃₅', tripalmitin: 'C₁₅H₃₁', triolein: 'C₁₇H₃₃', trilinolein: 'C₁₇H₃₁' }
const MUOI_TEN: Record<string, string> = { 'sodium stearate': 'C₁₇H₃₅COONa', 'sodium palmitate': 'C₁₅H₃₁COONa', 'sodium oleate': 'C₁₇H₃₃COONa', 'sodium linoleate': 'C₁₇H₃₁COONa' }
const ctBeo = (ten: string) => `(${GOC_BEO[ten]}COO)₃C₃H₅`
const tachEster = (ct: string) => { const i = ct.indexOf('COO'); expect(i > 0, ct).toBe(true); return { R: ct.slice(0, i), R2: ct.slice(i + 3) } }
const giaiXaPhong: BoGiai = (text) => {
  const de = boCauHoi(text), MNaOH = MT('NaOH'), MGly = MT('C₃H₈O₃')
  const BEO = '(tristearin|tripalmitin|triolein|trilinolein)'
  let m = khop(R(`^Xà phòng hoá hoàn toàn ${S} gam [a-z ]+ \\((\\S+)\\) bằng dung dịch NaOH vừa đủ, thu được (m gam muối|muối và m gam alcohol)\\.$`), de)
  if (m) {
    const { R: r1, R2 } = tachEster(m[2]!), n = so(m[1]!) / MT(m[2]!)
    return { so: n * (m[3] === 'm gam muối' ? MT(`${r1}COONa`) : MT(`${R2}OH`)) }
  }
  m = khop(R(`^Để xà phòng hoá hoàn toàn ${S} gam [a-z ]+ \\((\\S+)\\) cần vừa đủ V mL dung dịch NaOH ${S} M\\.$`), de)
  if (m) return { so: so(m[1]!) / MT(m[2]!) / so(m[3]!) * 1000 }
  m = khop(R(`^Xà phòng hoá hoàn toàn ${S} (gam|kg) ${BEO} bằng dung dịch NaOH vừa đủ, thu được m \\2 glycerol\\.$`), de)
  if (m) return { so: so(m[1]!) / MT(ctBeo(m[3]!)) * MGly }
  m = khop(R(`^Xà phòng hoá hoàn toàn ${S} (gam|kg) ${BEO} bằng dung dịch NaOH vừa đủ, thu được m \\2 muối (sodium [a-z]+)\\.$`), de)
  if (m) { expect(MUOI_TEN[m[4]!]).toBe(`${GOC_BEO[m[3]!]}COONa`); return { so: so(m[1]!) / MT(ctBeo(m[3]!)) * 3 * MT(MUOI_TEN[m[4]!]!) } }
  m = khop(R(`^Để xà phòng hoá hoàn toàn ${S} gam ${BEO} cần vừa đủ V mL dung dịch (NaOH|KOH) ${S} M\\.$`), de)
  if (m) return { so: so(m[1]!) / MT(ctBeo(m[2]!)) * 3 / so(m[4]!) * 1000 }
  m = khop(R(`^Xà phòng hoá hoàn toàn ${S} gam hỗn hợp X gồm [a-z ]+ \\((\\S+)\\) và [a-z ]+ \\((\\S+)\\) cần vừa đủ V mL dung dịch NaOH ${S} M\\.$`), de)
  if (m) { expect(MT(m[2]!)).toBe(MT(m[3]!)); return { so: so(m[1]!) / MT(m[2]!) / so(m[4]!) * 1000 } }
  m = khop(R(`^Xà phòng hoá hoàn toàn ${S} gam chất béo X cần vừa đủ ${S} mL dung dịch NaOH ${S} M, thu được glycerol và m gam muối\\.$`), de)
  if (m) { const n = so(m[2]!) * so(m[3]!) / 1000; return { so: so(m[1]!) + n * MNaOH - n / 3 * MGly } }
  m = khop(R(`^Từ ${S} kg chất béo chứa (\\d+)% ${BEO} về khối lượng \\(còn lại là tạp chất không phản ứng\\), người ta sản xuất xà phòng chứa (\\d+)% (sodium [a-z]+) về khối lượng; hiệu suất phản ứng xà phòng hoá là (\\d+)%\\. Khối lượng xà phòng thu được là m kg\\.$`), de)
  if (m) {
    expect(MUOI_TEN[m[5]!]).toBe(`${GOC_BEO[m[3]!]}COONa`); khoang(Number(m[2]), 50, 100, 'hàm lượng'); khoang(Number(m[4]), 50, 90, '% muối')
    return { so: so(m[1]!) * Number(m[2]) / 100 / MT(ctBeo(m[3]!)) * 3 * MT(MUOI_TEN[m[5]!]!) * Number(m[6]) / 100 / (Number(m[4]) / 100) }
  }
  m = khop(R(`^Từ ${S} kg ${BEO} điều chế chất hữu cơ Z theo sơ đồ: \\2 (.+?)\\. Biết hiệu suất của toàn bộ quá trình là (\\d+)%, khối lượng Z thu được là m kg\\.$`), de)
  if (m) {
    // Đi theo sơ đồ: giữ gốc acid béo R; +H₂ dư ⇒ R no (C₁₇H₃₅ / C₁₅H₃₁); +NaOH ⇒ RCOONa; +HCl ⇒ RCOOH; +CH₃OH ⇒ RCOOCH₃.
    let R0 = GOC_BEO[m[2]!]!, dang = 'beo'
    for (const buoc of m[3]!.split(/ (?=→)/)) {
      if (buoc.includes('+H₂')) R0 = R0.startsWith('C₁₇') ? 'C₁₇H₃₅' : 'C₁₅H₃₁'
      else if (buoc.includes('+NaOH')) dang = 'muoi'
      else if (buoc.includes('+HCl')) dang = 'acid'
      else if (buoc.includes('+CH₃OH')) dang = 'ester'
      else throw new Error(`bước lạ: ${buoc}`)
    }
    const Z = dang === 'acid' ? `${R0}COOH` : dang === 'ester' ? `${R0}COOCH₃` : `${R0}COONa`
    return { so: so(m[1]!) / MT(ctBeo(m[2]!)) * 3 * MT(Z) * Number(m[4]) / 100 }
  }
  throw new Error(`xà phòng hoá — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 7. ESTER HOÁ (M ester = M acid + M alcohol − M H₂O)
const giaiEsterHoa: BoGiai = (text) => {
  const de = boCauHoi(text), MH2O = MT('H₂O')
  const Mes = (a: string, b: string) => MT(a) + MT(b) - MH2O
  let m = khop(R(`^Đun nóng ${S} gam [a-z ]+ \\((\\S+)\\) với lượng dư [a-z ]+ \\((\\S+)\\) có H₂SO₄ đặc làm xúc tác\\. Biết hiệu suất phản ứng ester hoá là (\\d+)%, khối lượng [a-z ]+ thu được là m gam\\.$`), de)
  if (m) return { so: so(m[1]!) / MT(m[2]!) * Mes(m[2]!, m[3]!) * Number(m[4]) / 100 }
  m = khop(R(`^Đun nóng ${S} gam [a-z ]+ \\((\\S+)\\) với lượng dư [a-z ]+ \\((\\S+)\\) có H₂SO₄ đặc làm xúc tác, thu được ${S} gam [a-z ]+\\. Hiệu suất phản ứng ester hoá là H%\\.$`), de)
  if (m) return { so: so(m[4]!) / (so(m[1]!) / MT(m[2]!) * Mes(m[2]!, m[3]!)) * 100 }
  m = khop(R(`^Đun nóng ${S} gam [a-z ]+ \\((\\S+)\\) với ${S} gam [a-z ]+ \\((\\S+)\\) có H₂SO₄ đặc làm xúc tác, thu được ${S} gam [a-z ]+\\. Hiệu suất phản ứng ester hoá là H%\\.$`), de)
  if (m) { const nMin = Math.min(so(m[1]!) / MT(m[2]!), so(m[3]!) / MT(m[4]!)); return { so: so(m[5]!) / (nMin * Mes(m[2]!, m[4]!)) * 100 } }
  m = khop(R(`^Đun nóng ${S} gam [a-z ]+ \\((\\S+)\\) với ${S} gam [a-z ]+ \\((\\S+)\\) có H₂SO₄ đặc làm xúc tác\\. Biết hiệu suất phản ứng ester hoá là (\\d+)%, khối lượng [a-z ]+ thu được là m gam\\.$`), de)
  if (m) { const nMin = Math.min(so(m[1]!) / MT(m[2]!), so(m[3]!) / MT(m[4]!)); return { so: nMin * Mes(m[2]!, m[4]!) * Number(m[5]) / 100 } }
  m = khop(R(`^Đun nóng ${S} mL [a-z ]+ \\((\\S+), D = ${S} g/mL\\) với ${S} mL [a-z ]+ \\((\\S+), D = ${S} g/mL\\) có H₂SO₄ đặc làm xúc tác, thu được ${S} mL [a-z ]+ \\(D = ${S} g/mL\\)\\. Hiệu suất phản ứng ester hoá là H%\\.$`), de)
  if (m) {
    for (const d of [m[3], m[6], m[8]]) khoang(so(d!), 0.7, 1.3, 'khối lượng riêng')
    const nA = so(m[1]!) * so(m[3]!) / MT(m[2]!), nB = so(m[4]!) * so(m[6]!) / MT(m[5]!), nE = so(m[7]!) * so(m[8]!) / Mes(m[2]!, m[5]!)
    return { so: nE / Math.min(nA, nB) * 100 }
  }
  m = khop(R(`^Methyl salicylate \\(C₈H₈O₃\\) dùng làm thuốc xoa bóp giảm đau, được điều chế theo phản ứng: HOC₆H₄COOH \\+ CH₃OH ⇌ HOC₆H₄COOCH₃ \\+ H₂O \\(H₂SO₄ đặc, t°\\)\\. Từ ${S} tấn salicylic acid \\(C₇H₆O₃\\) sản xuất được x triệu tuýp thuốc, mỗi tuýp chứa ${S} gam methyl salicylate\\. Biết hiệu suất phản ứng tính theo salicylic acid là (\\d+)%\\.$`), de)
  if (m) { expect(MT('C₈H₈O₃')).toBe(Mes('C₇H₆O₃', 'CH₄O')); return { so: so(m[1]!) * 1e6 / MT('C₇H₆O₃') * MT('C₈H₈O₃') * Number(m[3]) / 100 / so(m[2]!) / 1e6 } }
  throw new Error(`ester hoá — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 8. ĐỐT CHÁY ESTER NO, ĐƠN CHỨC (CₙH₂ₙO₂)
const giaiDotChay: BoGiai = (text) => {
  let n: number
  // CₙH₂ₙO₂ + O₂ → nCO₂ + nH₂O: n(CO₂) = n(H₂O) = n · n(X).
  let m = /^Đốt cháy hoàn toàn (\S+) mol ester X no, đơn chức, mạch hở, thu được (\S+) mol (?:CO₂|H₂O)\./.exec(text)
  if (m) n = so(m[2]!) / so(m[1]!)
  else if ((m = /^Đốt cháy hoàn toàn (\S+) gam ester X no, đơn chức, mạch hở, thu được (\S+) (lít khí CO₂ \(đkc\)|gam H₂O|gam CO₂)\./.exec(text))) {
    const nC = so(m[2]!) / (m[3]!.startsWith('lít') ? V_MOL : MT(m[3]!.endsWith('H₂O') ? 'H₂O' : 'CO₂')), mX = so(m[1]!); n = 32 * nC / (mX - 14 * nC)
  } else if ((m = /^Đốt cháy hoàn toàn (\S+) gam ester X no, đơn chức, mạch hở rồi hấp thụ hết sản phẩm cháy vào dung dịch Ca\(OH\)₂ dư, thu được (\S+) gam kết tủa\./.exec(text))) {
    const nC = so(m[2]!) / MT('CaCO₃'), mX = so(m[1]!); n = 32 * nC / (mX - 14 * nC)
  } else if ((m = /^Đốt cháy hoàn toàn (\S+) gam ester X no, đơn chức, mạch hở cần vừa đủ (\S+) lít khí O₂ \(đkc\)\./.exec(text))) {
    // CₙH₂ₙO₂ + (3n − 2)/2 O₂: m·(3n − 2) = 2·n(O₂)·(14n + 32) ⇒ n = (2m + 64·n(O₂)) : (3m − 28·n(O₂))
    const nO = so(m[2]!) / V_MOL, mX = so(m[1]!); n = (2 * mX + 64 * nO) / (3 * mX - 28 * nO)
  } else throw new Error(`đốt cháy — không nhận ra mẫu: ${text}`)
  expect(Math.abs(n - Math.round(n)), `${text} ⇒ n = ${n}`).toBeLessThan(1e-6)
  n = Math.round(n)
  khoang(n, 2, 7, 'số C')
  const ct = `C${chiSoT(n)}H${chiSoT(2 * n)}O₂`
  if (/Công thức phân tử của X là$/.test(text)) return { chu: ct }
  if (/Phân tử khối của X là bao nhiêu\?$/.test(text)) return { so: MT(ct) }
  if (/Số nguyên tử carbon trong một phân tử X là bao nhiêu\?$/.test(text)) return { so: thanhPhan(ct).C! }
  if (/Số nguyên tử hydrogen trong một phân tử X là bao nhiêu\?$/.test(text)) return { so: thanhPhan(ct).H! }
  throw new Error(`đốt cháy — câu hỏi lạ: ${text}`)
}

// ================================================================ BỘ GIẢI 9. CHỈ SỐ CHẤT BÉO
const giaiChiSo: BoGiai = (text) => {
  const de = boCauHoi(text), MKOH = MT('KOH')
  let m = khop(R(`Để trung hoà lượng acid béo tự do có trong ${S} gam một (?:loại chất béo|mẫu dầu thực vật) cần vừa đủ ${S} mL dung dịch (KOH|NaOH) ${S} M\\. Chỉ số acid của (?:chất béo|mẫu dầu) đó là x\\.$`), de)
  if (m) return { so: so(m[2]!) * so(m[4]!) * MKOH / so(m[1]!) } // mmol kiềm = mmol KOH tương đương; × 56 mg
  m = khop(R(`Một loại chất béo có chỉ số acid bằng ${S}\\. Để trung hoà lượng acid béo tự do có trong ${S} gam chất béo này cần vừa đủ V mL dung dịch KOH ${S} M\\.$`), de)
  if (m) return { so: so(m[1]!) * so(m[2]!) / MKOH / so(m[3]!) }
  m = khop(R(`Một loại chất béo chứa ${S}% [a-z ]+ \\((\\S+)\\) và ${S}% (tristearin|tripalmitin) về khối lượng, còn lại là tạp chất không phản ứng với KOH\\. Chỉ số xà phòng hoá của chất béo đó là x\\.$`), de)
  if (m) {
    expect(m[2]).toBe(`${GOC_BEO[m[4]!]}COOH`) // acid béo tự do cùng gốc với triglyceride
    return { so: (so(m[1]!) / 100 / MT(m[2]!) + 3 * so(m[3]!) / 100 / MT(ctBeo(m[4]!))) * MKOH * 1000 }
  }
  throw new Error(`chỉ số — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 10. ĐIỀU CHẾ KIM LOẠI
/** Điện tích ion kim loại trong chloride / oxide: (số Cl × 1 + số O × 2) : số nguyên tử kim loại. */
function dienTichKimLoai(ct: string, kl: string): number {
  const t = thanhPhan(ct)
  return ((t.Cl ?? 0) + 2 * (t.O ?? 0)) / t[kl]!
}
const giaiDieuChe: BoGiai = (text) => {
  const de = boCauHoi(text)
  let m = khop(R(`^Khử hoàn toàn ${S} gam (\\S+) bằng khí (CO|H₂) dư ở nhiệt độ cao, thu được m gam (\\S+)\\.$`), de)
  if (m) { const t = thanhPhan(m[2]!); return { so: so(m[1]!) / MT(m[2]!) * t[m[4]!]! * NTK_T[m[4]!]! } }
  m = khop(R(`^Khử ${S} gam (\\S+) bằng khí CO dư ở nhiệt độ cao, thu được ${S} gam (\\S+)\\. Hiệu suất của phản ứng khử là H%\\.$`), de)
  if (m) { const t = thanhPhan(m[2]!); return { so: so(m[3]!) / (so(m[1]!) / MT(m[2]!) * t[m[4]!]! * NTK_T[m[4]!]!) * 100 } }
  m = khop(R(`^Thể tích khí (CO|H₂) \\(đkc\\) tối thiểu cần dùng để khử hoàn toàn ${S} gam (\\S+) ở nhiệt độ cao là V lít\\.$`), de)
  if (m) return { so: so(m[2]!) / MT(m[3]!) * thanhPhan(m[3]!).O! * V_MOL }
  m = khop(R(`^Khử hoàn toàn ${S} gam hỗn hợp X gồm CuO và Fe₂O₃ bằng khí CO dư ở nhiệt độ cao\\. Dẫn toàn bộ khí thoát ra vào dung dịch Ca\\(OH\\)₂ dư, thu được ${S} gam kết tủa\\. Khối lượng kim loại thu được là m gam\\.$`), de)
  if (m) {
    const a = so(m[1]!), nO = so(m[2]!) / MT('CaCO₃')
    // Dữ kiện tự nhất quán: 80x + 160y = a; x + 3y = nO có nghiệm x, y > 0.
    const y = (a - 80 * nO) / (160 - 240), x = nO - 3 * y
    expect(x > 1e-9 && y > 1e-9, text).toBe(true)
    return { so: a - NTK_T.O! * nO }
  }
  m = khop(R(`^Điện phân nóng chảy ${S} tấn Al₂O₃ \\(có mặt cryolite\\) với hiệu suất (\\d+)%, thu được m tấn Al\\.$`), de)
  if (m) return { so: so(m[1]!) / MT('Al₂O₃') * thanhPhan('Al₂O₃').Al! * NTK_T.Al! * Number(m[2]) / 100 }
  m = khop(R(`^Từ ${S} tấn quặng (hematite|magnetite) chứa (\\d+)% (\\S+) về khối lượng \\(còn lại là tạp chất không chứa sắt\\), luyện được m tấn (gang|thép) chứa (\\d+)% Fe về khối lượng\\. Biết hiệu suất của cả quá trình là (\\d+)%\\.$`), de)
  if (m) {
    expect(m[4]).toBe(m[2] === 'hematite' ? 'Fe₂O₃' : 'Fe₃O₄'); khoang(Number(m[6]), 90, 99, '% Fe')
    return { so: so(m[1]!) * Number(m[3]) / 100 / MT(m[4]!) * thanhPhan(m[4]!).Fe! * NTK_T.Fe! * Number(m[7]) / 100 / (Number(m[6]) / 100) }
  }
  m = khop(R(`^Điện phân nóng chảy (NaCl|MgCl₂|Al₂O₃) với cường độ dòng điện (\\d+) A trong (\\d+) giờ; hiệu suất sử dụng dòng điện là (\\d+)%\\. Khối lượng (\\S+) thu được ở cathode là m kg\\. Cho F = 96 500 C/mol\\.$`), de)
  if (m) {
    const e = dienTichKimLoai(m[1]!, m[5]!), ne = Number(m[2]) * Number(m[3]) * 3600 * Number(m[4]) / 100 / FARADAY
    return { so: ne / e * NTK_T[m[5]!]! / 1000 }
  }
  m = khop(R(`^Điện phân nóng chảy (NaCl|MgCl₂|Al₂O₃) với cường độ dòng điện (\\d+) A trong (\\d+) giờ, thu được ${S} kg (\\S+) ở cathode\\. Hiệu suất sử dụng dòng điện là H%\\. Cho F = 96 500 C/mol\\.$`), de)
  if (m) {
    const e = dienTichKimLoai(m[1]!, m[5]!), lt = Number(m[2]) * Number(m[3]) * 3600 / FARADAY / e * NTK_T[m[5]!]! / 1000
    return { so: so(m[4]!) / lt * 100 }
  }
  throw new Error(`điều chế kim loại — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 11. ĐIỆN PHÂN DUNG DỊCH
/** Muối điện phân: kim loại + điện tích (từ gốc acid) + khí ở anode (Cl⁻ ⇒ Cl₂, còn lại H₂O ⇒ O₂). */
function muoiDp(ct: string): { kl: string; e: number; khi: 'Cl₂' | 'O₂' } {
  const t = thanhPhan(ct), kl = t.Cu ? 'Cu' : 'Ag'
  const goc = t.Cl ?? (t.S ? 2 * t.S : t.N ?? 0)
  return { kl, e: goc / t[kl]!, khi: t.Cl ? 'Cl₂' : 'O₂' }
}
const giaiDienPhan: BoGiai = (text) => {
  const de = boCauHoi(text)
  let m = khop(R(`^Điện phân dung dịch (\\S+) dư \\(điện cực trơ\\) với cường độ dòng điện ${S} A trong ${S} (giây|phút|giờ)\\. Khối lượng (\\S+) bám vào cathode là m gam\\. Cho F = 96 500 C/mol\\.$`), de)
  if (m) {
    const mu = muoiDp(m[1]!), t = so(m[3]!) * (m[4] === 'giờ' ? 3600 : m[4] === 'phút' ? 60 : 1)
    expect(m[5]).toBe(mu.kl)
    return { so: so(m[2]!) * t / FARADAY / mu.e * NTK_T[mu.kl]! }
  }
  m = khop(R(`^Điện phân dung dịch (\\S+) dư \\(điện cực trơ\\) với cường độ dòng điện ${S} A trong ${S} giây\\. Thể tích khí \\(đkc\\) thoát ra ở anode là V lít\\. Cho F = 96 500 C/mol\\.$`), de)
  if (m) { const mu = muoiDp(m[1]!), ne = so(m[2]!) * so(m[3]!) / FARADAY; return { so: ne / (mu.khi === 'Cl₂' ? 2 : 4) * V_MOL } }
  m = khop(R(`^Mạ (bạc|đồng) cho một vật bằng cách điện phân dung dịch (\\S+) với anode bằng (bạc|đồng) và cathode là vật cần mạ, cường độ dòng điện ${S} A trong (\\d+) phút; hiệu suất sử dụng dòng điện là (\\d+)%\\. Khối lượng (\\S+) bám vào vật là m gam\\. Cho F = 96 500 C/mol\\.$`), de)
  if (m) {
    const mu = muoiDp(m[2]!)
    expect(m[7]).toBe(mu.kl); expect(m[1]).toBe(m[3]); expect(mu.kl).toBe(m[1] === 'bạc' ? 'Ag' : 'Cu'); khoang(Number(m[6]), 80, 99, 'H dòng điện')
    return { so: so(m[4]!) * Number(m[5]) * 60 * Number(m[6]) / 100 / FARADAY / mu.e * NTK_T[mu.kl]! }
  }
  m = khop(R(`^Điện phân dung dịch NaCl bão hoà \\(điện cực trơ, có màng ngăn xốp\\) với cường độ dòng điện ${S} A trong ${S} giờ; hiệu suất sử dụng dòng điện là (\\d+)%\\. Khối lượng NaOH tạo thành là m gam\\. Cho F = 96 500 C/mol\\.$`), de)
  if (m) return { so: so(m[1]!) * so(m[2]!) * 3600 * Number(m[3]) / 100 / FARADAY * MT('NaOH') } // 2H₂O + 2e → H₂ + 2OH⁻
  m = khop(R(`^Điện phân dung dịch NaCl bão hoà \\(điện cực trơ, có màng ngăn xốp\\) với cường độ dòng điện ${S} A trong ${S} giờ; hiệu suất sử dụng dòng điện là (\\d+)%\\. Tổng thể tích khí \\(đkc\\) thoát ra ở hai điện cực là V lít\\. Cho F = 96 500 C/mol\\.$`), de)
  if (m) { const ne = so(m[1]!) * so(m[2]!) * 3600 * Number(m[3]) / 100 / FARADAY; return { so: (ne / 2 + ne / 2) * V_MOL } }
  throw new Error(`điện phân dung dịch — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 12. THỨ TỰ KHỬ Ở CATHODE (bảng E° riêng, V)
const E0_T: Record<string, number> = { 'Ag⁺/Ag': 0.8, 'Fe³⁺/Fe²⁺': 0.77, 'Cu²⁺/Cu': 0.34, 'H⁺/H₂': 0, 'Ni²⁺/Ni': -0.26, 'Fe²⁺/Fe': -0.44, 'Zn²⁺/Zn': -0.76 }
/** Ion có trong dung dịch theo muối (cation tan, cùng gốc acid): HCl/H₂SO₄ ⇒ H⁺. */
const CATION: Record<string, string> = { 'CuCl₂': 'Cu²⁺', 'CuSO₄': 'Cu²⁺', 'Cu(NO₃)₂': 'Cu²⁺', 'HCl': 'H⁺', 'H₂SO₄': 'H⁺', 'ZnCl₂': 'Zn²⁺', 'ZnSO₄': 'Zn²⁺', 'Zn(NO₃)₂': 'Zn²⁺',
  'NiSO₄': 'Ni²⁺', 'NiCl₂': 'Ni²⁺', 'Ni(NO₃)₂': 'Ni²⁺', 'Fe(NO₃)₂': 'Fe²⁺', 'FeCl₂': 'Fe²⁺', 'FeSO₄': 'Fe²⁺', 'FeCl₃': 'Fe³⁺', 'Fe₂(SO₄)₃': 'Fe³⁺', 'Fe(NO₃)₃': 'Fe³⁺', 'AgNO₃': 'Ag⁺' }
const giaiThuTu: BoGiai = (text) => {
  const m = /^Điện phân dung dịch hỗn hợp gồm (.+?) \(điện cực trơ\)\. Cho các quá trình có thể xảy ra tại cathode: (.+?)\. Liệt kê số thứ tự/.exec(text)
  if (!m) throw new Error(`thứ tự — không nhận ra mẫu: ${text}`)
  const muoi = m[1]!.split(', '), ion = new Set(muoi.map((x) => { const c = CATION[x]; if (!c) throw new Error(`muối lạ ${x}`); return c }))
  // Hoá học có thật: cùng một gốc acid (không có AgCl, không có HNO₃).
  const goc = new Set(muoi.map((x) => (x.includes('Cl') ? 'Cl' : x.includes('SO₄') ? 'SO₄' : 'NO₃')))
  expect(goc.size, text).toBe(1)
  if (ion.has('Ag⁺')) expect(goc.has('Cl'), text).toBe(false)
  if (ion.has('Fe³⁺')) ion.add('Fe²⁺')
  const qt = m[2]!.split('; ').map((x) => {
    const q = /^\((\d)\) (2?)(\S+?) \+ (\d)e → (\S+)$/.exec(x)
    if (!q) throw new Error(`quá trình lạ: ${x}`)
    const cap = `${q[3]}/${q[5]}`, E = E0_T[cap]
    if (E === undefined) throw new Error(`thiếu E° ${cap}`)
    expect(ion.has(q[3]!), `${q[3]} không có trong dung dịch: ${text}`).toBe(true)
    return { so: q[1]!, E }
  })
  expect(qt.length, text).toBe(ion.size)
  return { chu: [...qt].sort((a, b) => b.E - a.E).map((x) => x.so).join('') }
}

// ================================================================ BỘ GIẢI 13. HẰNG SỐ CÂN BẰNG Kc
const coHeSo = (chu: string) => docPt(chu.replace(/\(g\)|\(l\)/g, ''))
/** Biểu thức Kc theo map nồng độ (bỏ chất rắn (s)). */
function kcTheo(pt: string, nd: (c: string) => number): number {
  const ran = new Set((pt.match(/(\S+?)\(s\)/g) ?? []).map((x) => x.replace(/\(s\)$/, '').replace(/^\d+/, '')))
  const p = coHeSo(pt.replace(/\(s\)/g, ''))
  const tich = (ds: [number, string][]) => ds.filter(([, c]) => !ran.has(c)).reduce((s, [k, c]) => s * nd(c) ** k, 1)
  return tich(p.phai) / tich(p.trai)
}
const ndMap = (chu: string) => new Map([...chu.matchAll(/\[(\S+?)\] = (\S+) M/g)].map((x) => [x[1]!, so(x[2]!)] as const))
/** A + B ⇌ sản phẩm, tính ngược từ Kc bằng CÔNG THỨC NGHIỆM: P(x) = c₂x² + c₁x (thể tích đưa vào c₁ khi Δn ≠ 0). */
function nghiemCanBang(pt: string, a: number, b: number, V: number, K: number): number {
  const p = coHeSo(pt)
  const dn = p.phai.reduce((s, [k]) => s + k, 0) - p.trai.reduce((s, [k]) => s + k, 0)
  // Π([sp]^ν) = Π((ν·x)/V)^ν; Kc·[A][B] ⇒ nhân V²: Π(ν x)^ν · V^(−dn) = K (a − x)(b − x)
  const heTich = p.phai.reduce((s, [k]) => s * k ** k, 1), bac = p.phai.reduce((s, [k]) => s + k, 0)
  let c2 = 0, c1 = 0
  if (bac === 2) c2 = heTich * V ** -dn
  else if (bac === 1) c1 = heTich * V ** -dn
  else throw new Error(`bậc lạ ${pt}`)
  const A = c2 - K, B = c1 + K * (a + b), C = -K * a * b
  const ng = Math.abs(A) < 1e-12 ? [-C / B] : [(-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A), (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A)]
  const x = ng.find((t) => t > 0 && t < Math.min(a, b))
  if (x === undefined) throw new Error(`không có nghiệm hợp lệ: ${pt}`)
  return x
}
const giaiKc: BoGiai = (text) => {
  const de = boCauHoi(text)
  let m = khop(R(`^Cho cân bằng hoá học: (.+?)\\. Ở một nhiệt độ xác định, khi hệ đạt trạng thái cân bằng, nồng độ các chất là: (.+?)\\. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc\\.$`), de)
  if (m) { const nd = ndMap(m[2]!); return { so: kcTheo(m[1]!, (c) => nd.get(c)!) } }
  m = khop(R(`^Cho cân bằng hoá học: (.+?)\\. Ở một nhiệt độ xác định, hằng số cân bằng Kc = ${S}\\. Khi hệ đạt trạng thái cân bằng: (.+?)\\. Nồng độ mol của (\\S+) ở trạng thái cân bằng là x M\\.$`), de)
  if (m) {
    const nd = ndMap(m[3]!), X = m[4]!, K = so(m[2]!), p = coHeSo(m[1]!)
    const oPhai = p.phai.find(([, c]) => c === X), oTrai = p.trai.find(([, c]) => c === X)
    const ngoai = kcTheo(m[1]!, (c) => (c === X ? 1 : nd.get(c)!)) // Kc khi [X] = 1
    // Kc = ngoai · [X]^k (X ở vế phải) hoặc ngoai : [X]^k (X ở vế trái)
    return { so: oPhai ? (K / ngoai) ** (1 / oPhai[0]) : (ngoai / K) ** (1 / oTrai![0]) }
  }
  m = khop(R(`^Cho (.+?) vào một bình kín dung tích (\\d+) lít \\(ban đầu chưa có sản phẩm\\), giữ ở nhiệt độ không đổi\\. Xảy ra phản ứng: (.+?)\\. Khi phản ứng đạt trạng thái cân bằng, trong bình có ${S} mol (\\S+)\\. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc\\.$`), de)
  if (m) {
    const V = Number(m[2]), p = coHeSo(m[3]!), nP = so(m[4]!), P = m[5]!
    const dau = new Map([...m[1]!.matchAll(/(\S+) mol (\S+)/g)].map((x) => [x[2]!, so(x[1]!)] as const))
    const kP = p.phai.find(([, c]) => c === P)![0], xi = nP / kP
    const n = (c: string) => { const t = p.trai.find(([, d]) => d === c); if (t) return dau.get(c)! - t[0] * xi; return p.phai.find(([, d]) => d === c)![0] * xi }
    for (const [, c] of p.trai) expect(n(c) > 0, text).toBe(true)
    return { so: kcTheo(m[3]!, (c) => n(c) / V) }
  }
  m = khop(R(`^Cho cân bằng: (.+?)\\. (?:Trong một bình kín dung tích (\\d+) lít, ở nhiệt độ xác định|Ở một nhiệt độ xác định), khi hệ đạt cân bằng: (.+?)(?: và trong bình còn ${S} gam C)?\\. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc\\.$`), de)
  if (m) { const nd = ndMap(m[3]!.replace(/ và /g, '; ')); expect(/\(s\)/.test(m[1]!), text).toBe(true); return { so: kcTheo(m[1]!, (c) => nd.get(c)!) } }
  m = khop(R(`^Cho ${S} mol (\\S+) và ${S} mol (\\S+) vào một bình kín dung tích (\\d+) lít\\. Ở nhiệt độ xác định xảy ra phản ứng: (.+?) với hằng số cân bằng Kc = ${S}\\. Nồng độ mol của (\\S+) ở trạng thái cân bằng là x M\\.$`), de)
  if (m) {
    const [a, A, b, , V, pt, K, X] = [so(m[1]!), m[2]!, so(m[3]!), m[4]!, Number(m[5]), m[6]!, so(m[7]!), m[8]!]
    const x = nghiemCanBang(pt, a, b, V, K), p = coHeSo(pt)
    const nX = X === A ? a - x : p.phai.find(([, c]) => c === X)![0] * x
    return { so: nX / V }
  }
  m = khop(R(`^Trong một bình kín dung tích (\\d+) lít chứa ${S} mol (\\S+) và ${S} mol (\\S+)\\. Ở nhiệt độ xác định xảy ra phản ứng: (.+?) với hằng số cân bằng Kc = ${S}\\. Số mol (\\S+) có trong bình khi phản ứng đạt trạng thái cân bằng là n\\.$`), de)
  if (m) {
    const x = nghiemCanBang(m[6]!, so(m[2]!), so(m[4]!), Number(m[1]), so(m[7]!))
    return { so: coHeSo(m[6]!).phai.find(([, c]) => c === m![8])![0] * x }
  }
  m = khop(R(`^Cho ${S} gam [a-z ]+ \\((\\S+)\\) phản ứng với ${S} gam [a-z ]+ \\((\\S+)\\) có H₂SO₄ đặc làm xúc tác: .+? ⇌ .+?\\. Ở nhiệt độ phản ứng, hằng số cân bằng Kc = ${S} \\(coi thể tích hệ không đổi\\)\\. Khối lượng [a-z ]+ thu được khi hệ đạt trạng thái cân bằng là m gam\\.$`), de)
  if (m) {
    const nA = so(m[1]!) / MT(m[2]!), nB = so(m[3]!) / MT(m[4]!), K = so(m[5]!)
    // x² = K(nA − x)(nB − x) ⇒ (1 − K)x² + K(nA + nB)x − K·nA·nB = 0
    const A2 = 1 - K, B2 = K * (nA + nB), C2 = -K * nA * nB
    const x = [(-B2 + Math.sqrt(B2 * B2 - 4 * A2 * C2)) / (2 * A2), (-B2 - Math.sqrt(B2 * B2 - 4 * A2 * C2)) / (2 * A2)].find((t) => t > 0 && t < Math.min(nA, nB))!
    return { so: x * (MT(m[2]!) + MT(m[4]!) - MT('H₂O')) }
  }
  m = khop(R(`^Trong bình kín dung tích (\\d+) lít, ban đầu chỉ chứa ${S} mol N₂O₄\\. Đưa bình đến nhiệt độ T, xảy ra phản ứng: N₂O₄\\(g\\) ⇌ 2NO₂\\(g\\)\\. Khi phản ứng đạt trạng thái cân bằng, tỉ khối của hỗn hợp khí so với H₂ là ${S}\\. Hằng số cân bằng của phản ứng ở nhiệt độ T là Kc\\.$`), de)
  if (m) {
    const V = Number(m[1]), a = so(m[2]!), Mtb = so(m[3]!) * MT('H₂'), nT = a * MT('N₂O₄') / Mtb, x = nT - a
    expect(x > 0 && x < a, text).toBe(true)
    return { so: (2 * x / V) ** 2 / ((a - x) / V) }
  }
  throw new Error(`Kc — không nhận ra mẫu: ${text}`)
}

// ================================================================ BỘ GIẢI 14. SULFURIC ACID
/** Hoá trị: H₂SO₄ loãng (Fe → Fe²⁺), đặc nóng (Fe → Fe³⁺); Cu, Ag không tan trong H₂SO₄ loãng; Al, Fe thụ động trong H₂SO₄ đặc nguội. */
const TRI_LOANG: Record<string, number> = { Mg: 2, Zn: 2, Fe: 2, Al: 3 }
const TRI_DAC: Record<string, number> = { Mg: 2, Zn: 2, Fe: 3, Al: 3, Cu: 2, Ag: 1 }
const MSO4 = () => MT('SO₄')
const giaiSulfuric: BoGiai = (text) => {
  const de = boCauHoi(text)
  let m = khop(R(`^Hoà tan hoàn toàn ${S} gam (\\S+) trong dung dịch H₂SO₄ loãng, dư, thu được V lít khí H₂ \\(đkc\\)\\.$`), de)
  if (m) return { so: so(m[1]!) / NTK_T[m[2]!]! * TRI_LOANG[m[2]!]! / 2 * V_MOL }
  m = khop(R(`^Hoà tan hoàn toàn ${S} gam (\\S+) trong dung dịch H₂SO₄ loãng \\(vừa đủ\\)\\. Cô cạn dung dịch sau phản ứng, thu được m gam muối khan\\.$`), de)
  if (m) return { so: so(m[1]!) + so(m[1]!) / NTK_T[m[2]!]! * TRI_LOANG[m[2]!]! / 2 * MSO4() }
  m = khop(R(`^Cho ${S} gam (\\S+) tác dụng hết với dung dịch H₂SO₄ đặc, nóng, dư, thu được V lít khí SO₂ \\(sản phẩm khử duy nhất của S⁺⁶, đkc\\)\\.$`), de)
  if (m) return { so: so(m[1]!) / NTK_T[m[2]!]! * TRI_DAC[m[2]!]! / 2 * V_MOL }
  m = khop(R(`^Cho ${S} gam (\\S+) tác dụng hết với dung dịch H₂SO₄ đặc, nóng, dư \\(sản phẩm khử duy nhất là SO₂\\)\\. Khối lượng muối sulfate tạo thành là m gam\\.$`), de)
  if (m) return { so: so(m[1]!) + so(m[1]!) / NTK_T[m[2]!]! * TRI_DAC[m[2]!]! / 2 * MSO4() }
  m = khop(R(`^Cho ${S} gam hỗn hợp gồm Fe và Cu vào dung dịch H₂SO₄ loãng, dư, thu được ${S} lít khí H₂ \\(đkc\\) và còn lại chất rắn không tan\\. Cho toàn bộ chất rắn không tan đó tác dụng hết với dung dịch H₂SO₄ đặc, nóng, dư, thu được V lít khí SO₂ \\(sản phẩm khử duy nhất, đkc\\)\\.$`), de)
  if (m) { const nFe = so(m[2]!) / V_MOL / (TRI_LOANG.Fe! / 2), mCu = so(m[1]!) - nFe * NTK_T.Fe!; expect(mCu > 0, text).toBe(true); return { so: mCu / NTK_T.Cu! * TRI_DAC.Cu! / 2 * V_MOL } }
  m = khop(R(`^Cho ${S} gam hỗn hợp gồm (Al|Fe) và Cu \\(trong đó có ${S} gam \\2\\) vào dung dịch H₂SO₄ đặc, nguội, dư, thu được V lít khí SO₂ \\(sản phẩm khử duy nhất, đkc\\)\\.$`), de)
  if (m) { const mCu = so(m[1]!) - so(m[3]!); expect(mCu > 0, text).toBe(true); return { so: mCu / NTK_T.Cu! * TRI_DAC.Cu! / 2 * V_MOL } }
  m = khop(R(`^Hoà tan hoàn toàn ${S} gam hỗn hợp X gồm (\\S+) và (\\S+) trong dung dịch H₂SO₄ đặc, nóng, dư, thu được ${S} lít khí SO₂ \\(sản phẩm khử duy nhất, đkc\\)\\. Khối lượng muối sulfate tạo thành là m gam\\.$`), de)
  if (m) {
    const a = so(m[1]!), nS = so(m[4]!) / V_MOL, [k1, k2] = [m[2]!, m[3]!]
    // Dữ kiện tự nhất quán: A₁x + A₂y = a; (t₁x + t₂y)/2 = n(SO₂) có nghiệm x, y > 0.
    const [A1, A2, t1, t2] = [NTK_T[k1]!, NTK_T[k2]!, TRI_DAC[k1]!, TRI_DAC[k2]!], det = A1 * t2 - A2 * t1
    const x = (a * t2 - A2 * 2 * nS) / det, y = (A1 * 2 * nS - a * t1) / det
    expect(x > 1e-9 && y > 1e-9, text).toBe(true)
    return { so: a + nS * MSO4() }
  }
  throw new Error(`sulfuric — không nhận ra mẫu: ${text}`)
}

const BO_GIAI: Record<string, BoGiai> = {
  len_men: giaiLenMen, thuy_phan: giaiThuyPhan, trang_bac: giaiTrangBac, cellulose: giaiCellulose, gan_so_chuyen_hoa: giaiGanSo,
  xa_phong_hoa: giaiXaPhong, ester_hoa: giaiEsterHoa, dot_chay_ester: giaiDotChay, chi_so_chat_beo: giaiChiSo,
  dieu_che_kim_loai: giaiDieuChe, dien_phan_dung_dich: giaiDienPhan, thu_tu_cathode: giaiThuTu, hang_so_can_bang: giaiKc, sulfuric_acid: giaiSulfuric,
}

// ---------------------------------------------------------------- kiểm MỘT câu theo kết quả bộ giải độc lập

/** Số liệu hợp lí trong MỌI đề: số dương; hiệu suất 50–98 %; mọi phần trăm ≤ 100; khối lượng riêng 0,7–1,6 g/mL; không số nào quá 10⁶. */
function kiemSoLieu(text: string, ten: string): void {
  for (const t of soTrong(text)) { expect(t > 0, `số không dương ${t}: ${ten}`).toBe(true); expect(t < 1e6, `số quá lớn ${t}: ${ten}`).toBe(true) }
  for (const m of text.matchAll(/hiệu suất[^%\d]{0,40}?(\d+(?:,\d+)?)%/g)) { const h = so(m[1]!); if (h !== 100) khoang(h, 50, 98, `hiệu suất trong ${ten}`) }
  for (const m of text.matchAll(/(\d+(?:,\d+)?)%/g)) expect(so(m[1]!) <= 100, `phần trăm > 100: ${ten}`).toBe(true)
  for (const m of text.matchAll(/D = (\d+(?:,\d+)?) g\/mL/g)) khoang(so(m[1]!), 0.7, 1.6, `khối lượng riêng trong ${ten}`)
}

function kiemCau(c: CauBienThe, kq: KQ): void {
  const ten = `${c.bienThe.mau} | ${c.text}`
  kiemSoLieu(c.text, ten)
  expect(c.dang).toBe(c.bienThe.dang)
  expect(c.mucDo).toBe(c.bienThe.mucDo)
  expect(c.reviewed).toBe(true)
  expect(laCauTuLuan(c), ten).toBe(false)
  const lg = c.solution as { chot?: string; buoc?: string[]; tungPa?: Record<string, { dung: boolean; viSao: string }>; ketQua?: string }
  expect(typeof lg.chot === 'string' && lg.chot.length > 10, ten).toBe(true)
  expect(Array.isArray(lg.buoc) && lg.buoc.length >= 2, ten).toBe(true)
  if (c.phan === 'III') {
    expect(c.choices).toEqual([])
    expect(c.correct.length, ten).toBeLessThanOrEqual(4)
    expect(c.correct, ten).toMatch(/^\d+(,\d+)?$/)
    expect(lg.ketQua).toBe(c.correct)
    if (kq.chu !== undefined) {
      expect(c.correct, ten).toBe(kq.chu)
      expect((c.text.match(/\d+/g) ?? []).includes(c.correct), ten).toBe(false)
      return
    }
    const x = kq.so!
    expect(Number.isFinite(x) && x > 0, `${ten} ⇒ ${x}`).toBe(true)
    const lt = /\(Làm tròn kết quả đến hàng (đơn vị|phần mười|phần trăm)\.\)$/.exec(c.text)
    if (!lt) {
      expect(Math.abs(so(c.correct) - x), `${ten} | ${c.correct} ≠ ${x}`).toBeLessThan(1e-9 * Math.max(1, x))
      expect(soLeT(x), ten).toBeLessThanOrEqual(2)
    } else {
      const d = ['đơn vị', 'phần mười', 'phần trăm'].indexOf(lt[1]!)
      expect(c.correct, `${ten} | x = ${x}`).toBe(vietCo(x, d))
      // Ổn định: em làm tròn trung gian (±0,05 %) vẫn ra đúng đáp số.
      expect(vietCo(x * 0.9995, d), ten).toBe(c.correct)
      expect(vietCo(x * 1.0005, d), ten).toBe(c.correct)
    }
    expect(soTrong(c.text).some((t) => Math.abs(t - so(c.correct)) < 1e-9), `đề chứa đáp án: ${ten}`).toBe(false)
    return
  }
  expect(c.choices.length, ten).toBe(4)
  expect(new Set(c.choices).size, ten).toBe(4)
  expect(c.correct, ten).toMatch(/^[ABCD]$/)
  const i = 'ABCD'.indexOf(c.correct), dung = c.choices[i]!
  const tung = lg.tungPa!
  expect(Object.keys(tung).sort()).toEqual(['A', 'B', 'C', 'D'])
  for (const [k, v] of Object.entries(tung)) {
    expect(v.dung, `${ten} | ${k}`).toBe(k === c.correct)
    expect(v.viSao.startsWith(k === c.correct ? 'Chọn:' : 'Không chọn:')).toBe(true)
    expect(v.viSao.includes(c.choices['ABCD'.indexOf(k)]!), `${ten} | lý do ${k} không nhắc phương án`).toBe(true)
  }
  expect(lg.ketQua).toBe(dung)
  if (kq.chu !== undefined) {
    expect(dung, ten).toBe(kq.chu)
    expect(c.choices.filter((p) => p === kq.chu).length).toBe(1)
    expect(c.text.includes(kq.chu), `đề chứa đáp án: ${ten}`).toBe(false)
    return
  }
  const x = kq.so!
  expect(Number.isFinite(x) && x > 0, `${ten} ⇒ ${x}`).toBe(true)
  const d = soLeChu(dung)
  for (const p of c.choices) { expect(soLeChu(p), ten).toBe(d); expect(so(p) > 0, ten).toBe(true) }
  expect(dung, `${ten} | x = ${x}`).toBe(vietCo(x, d))
  expect(c.choices.filter((p) => p === vietCo(x, d)).length, ten).toBe(1)
  expect(soTrong(c.text).some((t) => Math.abs(t - so(dung)) < 1e-9), `đề chứa đáp án: ${ten}`).toBe(false)
}

// ---------------------------------------------------------------- sinh lô câu cho từng họ (đủ mã dạng × phần × mức độ, ≥ 300 câu/họ)

const HO = cacHoDe()
const MUC = ['biet', 'hieu', 'van_dung'] as const
const PHAN = ['I', 'III'] as const
/** Số câu mỗi họ (mặc định 600; kiểm sâu: BIEN_THE_SO_CAU=5000 npx vitest run tests/bien-the-sinh-0510.test.ts). */
const SO_CAU_MOI_HO = Math.max(600, Number(process.env.BIEN_THE_SO_CAU ?? 0) || 0)
/** Mọi câu của một họ (theo mã dạng của họ): ≥ 600 câu, MỖI câu một hạt giống riêng. */
function loCuaHo(ho: (typeof HO)[number]): CauBienThe[] {
  const toHop = ho.cacDang.length * PHAN.length * MUC.length, moi = Math.ceil(SO_CAU_MOI_HO / toHop)
  const ra: CauBienThe[] = []
  for (const dang of ho.cacDang) for (const phan of PHAN) for (const muc of MUC) for (let i = 0; i < moi; i++) {
    const c = sinhBienThe(dang, `kiem|${dang}|${phan}|${muc}|${i}`, phan, muc)
    expect(c, `${dang} ${phan} ${muc} ${i}`).not.toBeNull()
    ra.push(c!)
  }
  return ra
}
const LO = new Map(HO.map((h) => [h.ma, loCuaHo(h)] as const))

describe('Hằng số thống nhất với đặc tả / omni-cau-nen-sinh.ts', () => {
  it('nguyên tử khối SGK, 24,79 L/mol (đkc, chương trình 2018), F = 96 500 — bảng của bộ sinh trùng bảng riêng của test', async () => {
    const c = await import('../server/src/bien-the/chung')
    expect(c.NTK).toEqual(NTK_T)
    expect(c.V_KHI).toBe(V_MOL)
    expect(c.F).toBe(FARADAY)
  })
})

describe('Danh mục họ đề', () => {
  it('≥ 10 họ tính toán; mỗi mã dạng nằm trong từ vựng đóng của kho; coBoSinh đúng; mã lý thuyết không có bộ sinh', () => {
    expect(HO.length).toBeGreaterThanOrEqual(10)
    expect(Object.keys(BO_GIAI).sort()).toEqual(HO.map((h) => h.ma).sort())
    const tatCa = cacDangCoBoSinh()
    for (const h of HO) {
      expect(h.cacDang.length).toBeGreaterThan(0)
      for (const d of h.cacDang) { expect(maTrongTuVung(d), d).toBe(true); expect(coBoSinh(d), d).toBe(true); expect(tatCa).toContain(d) }
    }
    // Mã dạng thật của mẫu quét 29/09 mà đặc tả nêu tên.
    for (const d of ['CARBOHYDRATE.UNG_DUNG.TINH_KHOI_LUONG', 'CARBOHYDRATE.LEN_MEN.SO_SANH', 'CARBOHYDRATE.LEN_MEN.TINH_THE_TICH', 'CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG',
      'CARBOHYDRATE.CAU_TAO.TINH_KHOI_LUONG', 'ESTER.UNG_DUNG.TINH_KHOI_LUONG', 'KIM_LOAI.DIEU_CHE.TINH_KHOI_LUONG', 'CAN_BANG.HANG_SO_K.TINH_HANG_SO',
      'DIEN_PHAN.DIEN_PHAN_DD.SO_SANH', 'NITROGEN_SULFUR.SULFURIC_ACID.TINH_THE_TICH', 'CARBOHYDRATE.PHAN_UNG_TRANG_BAC.TINH_KHOI_LUONG']) expect(coBoSinh(d), d).toBe(true)
    for (const d of ['ESTER.CAU_TAO.CHON_PHAT_BIEU', 'CARBOHYDRATE.PHAN_UNG_MAU.CHON_PHAT_BIEU', '', 'XYZ', 'CARBOHYDRATE.LEN_MEN']) expect(coBoSinh(d), d).toBe(false)
    expect(sinhBienThe('ESTER.CAU_TAO.CHON_PHAT_BIEU', 'x', 'I')).toBeNull()
    expect(sinhBienThe('CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG', 'x', 'II' as 'I')).toBeNull()
  })
  it('mọi mã dạng × Phần I/III × mức độ đều sinh được câu; mức độ có mẫu thì biến thể GIỮ đúng mức độ câu gốc', () => {
    for (const h of HO) for (const d of h.cacDang) for (const phan of PHAN) for (const muc of MUC) {
      const coMuc = HO.some((x) => (x.mucTheoDang[d] ?? []).includes(muc))
      for (let i = 0; i < 5; i++) {
        const c = sinhBienThe(d, `muc-do-${i}`, phan, muc)
        expect(c, `${d} ${phan} ${muc}`).not.toBeNull()
        if (coMuc) expect(c!.mucDo, `${d} ${phan} ${muc}`).toBe(muc)
        else expect(MUC).toContain(c!.mucDo)
      }
    }
    // Ví dụ cụ thể: mức có mẫu ⇒ đúng mức.
    for (const muc of MUC) expect(sinhBienThe('CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG', 'h', 'III', muc)!.mucDo).toBe(muc)
    for (const muc of MUC) expect(sinhBienThe('DIEN_PHAN.DIEN_PHAN_DD.SO_SANH', 'h', 'I', muc)!.mucDo).toBe(muc)
  })
})

describe('Độ phủ kiểm chéo', () => {
  it('mỗi họ có ≥ 300 câu (hạt giống khác nhau) đi qua bộ giải độc lập, đủ Phần I và Phần III', () => {
    const dem = new Map<string, { I: number; III: number }>()
    for (const lo of LO.values()) for (const c of lo) { const d = dem.get(c.bienThe.ho) ?? { I: 0, III: 0 }; d[c.phan as 'I' | 'III']++; dem.set(c.bienThe.ho, d) }
    for (const h of HO) {
      const d = dem.get(h.ma)!
      expect(d.I + d.III, h.ma).toBeGreaterThanOrEqual(300)
      expect(Math.min(d.I, d.III), h.ma).toBeGreaterThanOrEqual(100)
    }
  })
})

describe.each(HO.map((h) => [h.ma]))('Kiểm chéo bộ giải độc lập — họ %s', (ma) => {
  it('≥ 600 câu: đáp án = bộ giải độc lập đọc lại chữ đề; Phần I đúng 1 phương án, 4 phương án khác nhau; đề không chứa đáp án', () => {
    const lo = LO.get(ma)!
    expect(lo.length).toBeGreaterThanOrEqual(600)
    for (const c of lo) {
      const giai = BO_GIAI[c.bienThe.ho]
      expect(giai, c.bienThe.ho).toBeDefined()
      kiemCau(c, giai!(c.text))
    }
  }, 600_000)
  it('đổi được số liệu: 600 hạt giống cho ≥ 360 đề khác nhau (không học thuộc được đáp án)', () => {
    const h = HO.find((x) => x.ma === ma)!, toHop = h.cacDang.length * PHAN.length * MUC.length, de = new Set<string>()
    for (const dang of h.cacDang) for (const phan of PHAN) for (const muc of MUC) for (let i = 0; i < Math.ceil(600 / toHop); i++) de.add(sinhBienThe(dang, `da-dang|${i}`, phan, muc)!.text)
    expect(de.size).toBeGreaterThanOrEqual(360)
  })
})

describe('Tất định + khoá băm chống trôi', () => {
  it('cùng (mã dạng, hạt giống, phần, mức độ) ⇒ cùng câu, kể cả khi nạp lại mô-đun', async () => {
    const lay = (f: typeof sinhBienThe) => JSON.stringify(HO.flatMap((h) => h.cacDang.flatMap((d) => PHAN.map((p) => f(d, 'tat-dinh', p, 'hieu')))))
    const truoc = lay(sinhBienThe)
    expect(lay(sinhBienThe)).toBe(truoc)
    vi.resetModules()
    const moi = await import('../server/src/bien-the-sinh')
    expect(lay(moi.sinhBienThe)).toBe(truoc)
    expect(sinhBienThe('CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG', 'a', 'I')).not.toEqual(sinhBienThe('CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG', 'b', 'I'))
  })
  /** 3 câu mẫu mỗi họ: (mã dạng đầu tiên của họ, hạt `bam-k`, Phần I/III/I, mức biet/hieu/van_dung). Đổi bộ sinh có chủ đích ⇒ cập nhật băm + ghi lý do. */
  const BAM: Record<string, string[]> = {
    len_men: ['85ada43de3b158e2', 'cb126c8855c250f3', '52bad6da49a5c1a3'],
    thuy_phan: ['c36e46e258af27a0', 'bc7f0196a59bba61', '371ab174cafb8a37'],
    trang_bac: ['355dcac9c5a882cc', 'cd8aeea2388fef57', 'e7e5909fbb108111'],
    cellulose: ['b3a512f39a9a77a1', 'cb56e5fcb231f659', '423844230815f382'],
    gan_so_chuyen_hoa: ['ebefc495ad95d421', 'ad0b00b2e51fc957', 'ccc5df166b350a97'],
    xa_phong_hoa: ['7ad8004ba7bcbe1a', 'c73c3120889e9e47', 'bfbdf063464ce86d'],
    ester_hoa: ['3ab8714bf9f9f600', '9fa5ae4d4d66bfae', '19e963d9f82dfc02'],
    dot_chay_ester: ['b4739799c5a1aac3', 'acf314d2c9d43980', 'a562108bb52fdeec'],
    chi_so_chat_beo: ['5ffd5fde641787a3', '136a1cb395c781ab', '4f014a531a8cce40'],
    dieu_che_kim_loai: ['bd136007bcb866d0', '3126b81be0843cf3', '6236e2d6a781c831'],
    dien_phan_dung_dich: ['09c19be7179ce3da', '3027a9a6ad5aeac4', '83bd615abbb7ad59'],
    thu_tu_cathode: ['4574223ca287c4ac', '995059756ef9de4f', 'b25b9bf363244544'],
    hang_so_can_bang: ['cc3ef608916ffe9c', 'f249877cbada14bc', 'e9c48babba95d40a'],
    sulfuric_acid: ['5bc692e38b79d028', 'c5071713ed71e9f4', '4815a6c7d645cf7d'],
  }
  it('băm 3 câu mẫu mỗi họ khớp bản đã chốt', () => {
    const thucTe: Record<string, string[]> = {}
    for (const h of HO) {
      thucTe[h.ma] = [0, 1, 2].map((k) => {
        const c = sinhBienThe(h.cacDang[0]!, `bam-${k}`, k === 1 ? 'III' : 'I', MUC[k])
        return createHash('sha256').update(JSON.stringify(c)).digest('hex').slice(0, 16)
      })
    }
    expect(thucTe).toEqual(BAM)
  })
})

describe('Khối của biến thể = khối câu gốc (cổng khối đọc được)', () => {
  const goc = (maDe: string, phan: 'I' | 'III', dang: string, mucDo = 'van_dung'): PrivateQuestion => ({
    qid: `${maDe}-${phan}-7`, maDe, version: 'v', group: 'g', phan, text: 'Câu gốc', choices: phan === 'I' ? ['1', '2', '3', '4'] : [], ideas: [], hinhAnh: [],
    dang, tenDang: 'Lên men — tính khối lượng', mucDo, sao: 2, kienThuc: ['lên men rượu'], correct: phan === 'I' ? 'A' : '12,5', solution: null, reviewed: true,
  })
  it('giữ nguyên maDe / lop / nhom của câu gốc; không đưa câu gốc ⇒ không rõ khối', () => {
    const c = sinhBienThe('CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG', 'k', 'III', 'hieu', { maDe: 'DH-12-C2-B6', tenDang: 'Tên của câu gốc', sao: 2 })!
    expect(c.maDe).toBe('DH-12-C2-B6')
    expect(khoiCuaCau(c)).toBe(12)
    expect(c.bienThe.khoiGoc).toBe(12)
    expect(c.tenDang).toBe('Tên của câu gốc')
    const c11 = sinhBienThe('CAN_BANG.HANG_SO_K.TINH_HANG_SO', 'k', 'I', 'hieu', { maDe: '11-C1-B1', lop: '11' })!
    expect(c11.maDe).toBe('11-C1-B1'); expect(c11.lop).toBe('11'); expect(khoiCuaCau(c11)).toBe(11)
    const tron = sinhBienThe('CAN_BANG.HANG_SO_K.TINH_HANG_SO', 'k', 'I', 'hieu')!
    expect(tron.maDe).toBe(''); expect(tron.bienThe.khoiGoc).toBeNull(); expect(khoiCuaCau(tron)).toBeNull()
    expect(tron.tenDang).toBe('Hằng số cân bằng — tính hằng số')
  })
  it('apBienThe: cùng khối ⇒ có câu (qid ảo, maDe gốc); khác khối / qid ảo lệch khối / Phần II / tự luận / không bộ sinh ⇒ null', () => {
    const g12 = goc('DH-12-C2-B6', 'III', 'CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG')
    const q = apBienThe(g12, `${g12.qid}~bt1`, 12)!
    expect(q.qid).toBe(`${g12.qid}~bt1`); expect(q.maDe).toBe(g12.maDe); expect(khoiCuaCau(q)).toBe(12)
    expect(q.text).not.toBe(g12.text); expect(q.mucDo).toBe('van_dung')
    expect(apBienThe(g12, `${g12.qid}~bt1`, 12)).toEqual(q) // chấm lại sinh lại đúng câu
    expect(apBienThe(g12, `${g12.qid}~bt1`, 11)).toBeNull() // em lớp 11 không nhận câu lớp 12
    expect(apBienThe(g12, 'DH-11-C1-B1-III-7~bt1', 12)).toBeNull() // qid ảo mang khối khác
    expect(apBienThe({ ...g12, phan: 'II' }, 'x~bt', 12)).toBeNull()
    expect(apBienThe({ ...g12, correct: 'CH₃COOC₂H₅' }, 'x~bt', 12)).toBeNull() // Phần III đáp án chữ = tự luận
    expect(apBienThe({ ...g12, dang: 'ESTER.CAU_TAO.CHON_PHAT_BIEU' }, 'x~bt', 12)).toBeNull()
    const g11 = goc('11-C1-B1', 'I', 'CAN_BANG.HANG_SO_K.TINH_HANG_SO', 'hieu')
    const q11 = apBienThe(g11, `${g11.qid}~bt0`, 11)!
    expect(khoiCuaCau(q11)).toBe(11)
    expect(apBienThe(g11, `${g11.qid}~bt0`, 10)).toBeNull() // em lớp 10 không nhận câu lớp 11
  })
  it('chọn mẫu GẦN câu gốc khi có chữ câu gốc (cùng cách giải): câu cellulose trinitrate ⇒ biến thể cellulose; câu tráng gương ⇒ biến thể tráng bạc', () => {
    for (let i = 0; i < 20; i++) {
      expect(sinhBienThe('CARBOHYDRATE.UNG_DUNG.TINH_KHOI_LUONG', `g${i}`, 'III', 'van_dung', { text: 'Từ 2 tấn cellulose sản xuất cellulose trinitrate (hiệu suất 60%)…' })!.bienThe.ho).toBe('cellulose')
      expect(sinhBienThe('CARBOHYDRATE.UNG_DUNG.TINH_KHOI_LUONG', `g${i}`, 'III', 'van_dung', { text: 'Một loại gương soi… độ dày lớp bạc 0,2 μm… tráng gương' })!.bienThe.ho).toBe('trang_bac')
    }
  })
})

describe('Đáp án không lộ + chấm được bằng hàm chấm của game', () => {
  it('publicQuestion bỏ đáp án/lời giải; grade chấm ĐÚNG đáp án, SAI phương án khác / số lệch 5 %', () => {
    let dem = 0
    for (const [ma, lo] of LO) for (const c of lo.slice(0, 40)) {
      const q = { ...c, qid: `goc~bt-${ma}-${dem++}` } as PrivateQuestion
      const pub = publicQuestion(q) as unknown as Record<string, unknown>
      expect('correct' in pub || 'solution' in pub).toBe(false)
      expect(JSON.stringify(pub)).not.toContain('"tungPa"')
      expect(grade(q, q.correct)).toBe(true)
      if (q.phan === 'I') for (const k of ['A', 'B', 'C', 'D'].filter((x) => x !== q.correct)) expect(grade(q, k)).toBe(false)
      else {
        const lech = (so(q.correct) * 1.05).toFixed(2).replace('.', ',')
        expect(grade(q, lech), `${q.correct} vs ${lech}`).toBe(false)
        expect(grade(q, q.correct.replace(',', '.')), `${q.correct} gõ dấu chấm`).toBe(true)
      }
    }
  })
})
