// @vitest-environment node
// OMNI 3 · D1 — TỰ SINH CÂU NỀN (server/src/omni-cau-nen-sinh.ts): KIỂM CHÉO mọi đáp án bằng một bộ giải ĐỘC LẬP viết riêng ở đây.
// Bộ giải này ĐỌC LẠI CHỮ ĐỀ như học sinh (tự phân tích công thức có chỉ số Unicode, tự tính khối lượng mol bằng bảng nguyên tử khối riêng,
// tự cân bằng phương trình bằng vét cạn) — không gọi lại hàm nào của bộ sinh. Sai một số trong đề / một hệ số / một khối lượng mol ⇒ test đỏ.
import { describe, expect, it, vi } from 'vitest'
import { chamCauNen, docSo, locCauNen } from '../server/src/thang-tu-go'
import { NHAN_CO_BO_SINH, coBoSinh, damBaoCauNenTuDong, damBaoMoiCauNenTuDong, sinhCauNen, sinhLoCauNen, soCauKhongGian, type CauNenSinh } from '../server/src/omni-cau-nen-sinh'
import { taoD1That } from './_d1-that'

// ---------------------------------------------------------------- bảng + bộ phân tích RIÊNG của test

/** Nguyên tử khối SGK (viết lại độc lập với bộ sinh). */
const NTK_T: Record<string, number> = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 64, Zn: 65, Ag: 108, Ba: 137, Br: 80 }
const DUOI = '₀₁₂₃₄₅₆₇₈₉'
const veAscii = (s: string) => [...s].map((c) => (DUOI.includes(c) ? String(DUOI.indexOf(c)) : c)).join('')

/** "Al₂(SO₄)₃" ⇒ {Al:2, S:3, O:12}. Ngoặc lồng nhau được. Ký tự lạ ⇒ ném lỗi (đề viết sai công thức). */
function phanTichCongThuc(ct: string): Record<string, number> {
  const s = veAscii(ct)
  let i = 0
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
  const soSau = () => { const m = /^\d+/.exec(s.slice(i)); if (!m) return 1; i += m[0].length; return Number(m[0]) }
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
}

const SO_CAU = 50
const tatCa = new Map<string, CauNenSinh[]>(NHAN_CO_BO_SINH.map((n) => [n, sinhLoCauNen(n, 1, SO_CAU)]))

describe('Bộ sinh câu nền — danh mục', () => {
  it('đủ 20 nhãn tính toán của đặc tả, mỗi nhãn có bộ giải độc lập và ≥ 50 câu khác nội dung', () => {
    expect([...NHAN_CO_BO_SINH].sort()).toEqual(['bao_toan_khoi_luong', 'bao_toan_nguyen_to', 'can_bang_phuong_trinh', 'chat_du_het', 'dien_phan_faraday',
      'do_bat_bao_hoa', 'doi_mol_khoi_luong', 'doi_mol_the_tich_khi', 'dung_dich_pha_loang', 'gia_tri_trung_binh', 'hieu_suat', 'khoi_luong_rieng',
      'nong_do_mol', 'nong_do_phan_tram', 'ph_nong_do_ion', 'phan_tram_khoi_luong', 'the_dien_cuc_pin', 'ti_khoi_khi', 'ti_le_mol_phuong_trinh', 'toc_do_phan_ung'])
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
  it('đáp án = kết quả bộ giải độc lập (khớp tuyệt đối), dương, hữu hạn, ≤ 3 chữ số thập phân', () => {
    for (const c of ds) {
      const kq = GIAI[nhan]!(c)
      if (c.kieu === 'tn') { expect(c.dap_an, c.de).toBe(kq); continue }
      const so = kq as number
      expect(Number.isFinite(so) && so > 0, c.de).toBe(true)
      expect(soLe(so), `${c.de} ⇒ ${so}`).toBeLessThanOrEqual(3)
      expect(Math.abs(docSo(c.dap_an)! - so), `${c.de} | đáp án ${c.dap_an} ≠ ${so}`).toBeLessThanOrEqual(1e-9 * Math.max(1, so))
      expect(Math.abs(Number(c.gia_tri_dung) - so)).toBeLessThanOrEqual(1e-9 * Math.max(1, so))
      expect(c.dap_an).not.toContain('.') // dấu phẩy thập phân như app đang chấm
      expect(c.dap_an).toMatch(/^\d+(,\d{1,3})?$/)
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
