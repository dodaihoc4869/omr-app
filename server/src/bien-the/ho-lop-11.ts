// BỘ SINH BIẾN THỂ — LỚP 11: hằng số cân bằng Kc (từ nồng độ cân bằng, bảng biến thiên, cân bằng dị thể, tỉ khối, tính ngược lượng chất từ Kc) ·
// sulfuric acid (kim loại + H₂SO₄ loãng / đặc nóng / đặc nguội → thể tích khí, khối lượng muối).
// Nhiễu Phần I từ LỖI HAY GẶP: quên mũ hệ số, lấy nghịch đảo, dùng số mol thay nồng độ, dùng lượng ban đầu thay lượng cân bằng, đưa chất rắn vào biểu
// thức Kc, coi phản ứng xảy ra hoàn toàn; cho Fe lên Fe²⁺ trong H₂SO₄ đặc nóng, quên Al/Fe thụ động trong H₂SO₄ đặc nguội, dùng 22,4 L/mol…
// Bộ giải độc lập ở tests/bien-the-sinh-0510.test.ts (giải phương trình bậc hai bằng công thức nghiệm; bộ sinh ở đây giải bằng chia đôi khoảng).
import { CHU_DKC, M, NTK, V_KHI, bang, hoi, lam, noi, soHoc, soLe, vn, vnT, type HoDe, type MauDe, type Nhieu, type Rng } from './chung'

const KC_HS = 'CAN_BANG.HANG_SO_K.TINH_HANG_SO'
const KC_ND = 'CAN_BANG.HANG_SO_K.TINH_NONG_DO'
const KC_SM = 'CAN_BANG.HANG_SO_K.TINH_SO_MOL'
const KC_KL = 'CAN_BANG.HANG_SO_K.TINH_KHOI_LUONG'
const SA_TT = 'NITROGEN_SULFUR.SULFURIC_ACID.TINH_THE_TICH'
const SA_KL = 'NITROGEN_SULFUR.SULFURIC_ACID.TINH_KHOI_LUONG'

// ================================================================ HỌ 13. HẰNG SỐ CÂN BẰNG Kc
type Chat = readonly [number, string]
interface PuKc { trai: readonly Chat[]; phai: readonly Chat[] }
const PU_KC: readonly PuKc[] = [
  { trai: [[1, 'H₂'], [1, 'I₂']], phai: [[2, 'HI']] },
  { trai: [[1, 'N₂'], [3, 'H₂']], phai: [[2, 'NH₃']] },
  { trai: [[2, 'SO₂'], [1, 'O₂']], phai: [[2, 'SO₃']] },
  { trai: [[1, 'CO'], [1, 'H₂O']], phai: [[1, 'CO₂'], [1, 'H₂']] },
  { trai: [[1, 'N₂O₄']], phai: [[2, 'NO₂']] },
  { trai: [[1, 'PCl₅']], phai: [[1, 'PCl₃'], [1, 'Cl₂']] },
  { trai: [[1, 'CO'], [2, 'H₂']], phai: [[1, 'CH₃OH']] },
  { trai: [[1, 'PCl₃'], [1, 'Cl₂']], phai: [[1, 'PCl₅']] },
  { trai: [[1, 'N₂'], [1, 'O₂']], phai: [[2, 'NO']] },
]
const MU = ['', '', '²', '³'] as const
const veVe = (ds: readonly Chat[]) => ds.map(([k, c]) => `${k === 1 ? '' : k}${c}(g)`).join(' + ')
const chuPu = (p: PuKc) => `${veVe(p.trai)} ⇌ ${veVe(p.phai)}`
const tich = (ds: readonly Chat[], g: (c: string) => number, mu = true) => ds.reduce((s, [k, c]) => s * g(c) ** (mu ? k : 1), 1)
const veTich = (ds: readonly Chat[], f: (c: string) => string) => ds.map(([k, c]) => `${f(c)}${MU[k]}`).join(' · ')
const bieuThuc = (p: PuKc) => `${veTich(p.phai, (c) => `[${c}]`)} : ${p.trai.length > 1 ? `(${veTich(p.trai, (c) => `[${c}]`)})` : veTich(p.trai, (c) => `[${c}]`)}`
const thaySo = (p: PuKc, g: (c: string) => number) => `${veTich(p.phai, (c) => vnT(g(c)))} : ${p.trai.length > 1 ? `(${veTich(p.trai, (c) => vnT(g(c)))})` : veTich(p.trai, (c) => vnT(g(c)))}`
const ND_DEP = [0.01, 0.02, 0.04, 0.05, 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1, 1.2, 1.5, 2] as const
const CHOT_KC = 'Kc = tích nồng độ CÂN BẰNG của sản phẩm (mũ hệ số) : tích nồng độ cân bằng của chất phản ứng (mũ hệ số); [X] = n : V; chất rắn không có mặt trong Kc.'
const KT_KC = ['hằng số cân bằng', 'biểu thức Kc']
const kcTu = (p: PuKc, g: (c: string) => number) => tich(p.phai, g) / tich(p.trai, g)
const nhieuKcCoBan = (p: PuKc, g: (c: string) => number): Nhieu[] => [
  { giaTri: tich(p.phai, g, false) / tich(p.trai, g, false), viSao: 'quên luỹ thừa theo hệ số' },
  { giaTri: 1 / kcTu(p, g), viSao: 'lấy nghịch đảo (chất phản ứng chia sản phẩm)' },
  { giaTri: p.phai.reduce((s, [k, c]) => s * k * g(c), 1) / p.trai.reduce((s, [k, c]) => s * k * g(c), 1), viSao: 'nhân hệ số với nồng độ thay vì lấy luỹ thừa' },
]

/** Giải Kc(x) = K bằng chia đôi khoảng trên (0, tren) (Kc tăng theo lượng sản phẩm x). */
function giaiChiaDoi(kcCua: (x: number) => number, K: number, tren: number): number | null {
  let lo = 0, hi = tren
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (kcCua(mid) < K) lo = mid; else hi = mid }
  const x = (lo + hi) / 2
  return x > 1e-9 && x < tren - 1e-9 && Math.abs(kcCua(x) / K - 1) < 1e-9 ? x : null
}

/** Cân bằng A + B ⇌ … tính ngược từ Kc: x = lượng (mol) A đã phản ứng. */
interface CbNguoc { ten: string; p: PuKc; K: readonly number[]; a: readonly number[]; V: readonly number[] }
const CB_NGUOC: readonly CbNguoc[] = [
  { ten: 'HI', p: PU_KC[0]!, K: [16, 25, 36, 49, 50, 64], a: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2], V: [1, 2, 4, 5, 10] },
  { ten: 'CO', p: PU_KC[3]!, K: [0.25, 1, 2.25, 4, 9], a: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.5, 2], V: [1, 2, 5, 10] },
  { ten: 'PCl', p: PU_KC[7]!, K: [10, 20, 24, 49, 50], a: [0.25, 0.5, 0.75, 1, 1.5, 2], V: [1, 2, 4, 5, 8, 10] },
  { ten: 'NO', p: PU_KC[8]!, K: [0.01, 0.04, 0.1], a: [0.5, 1, 2, 3, 4], V: [1, 2, 5, 10] },
]
interface KetQuaNguoc { a: number; b: number; V: number; K: number; x: number; n: (c: string, x?: number) => number }
function canBangNguoc(r: Rng, cb: CbNguoc): KetQuaNguoc | null {
  const a = r.chon(cb.a), b = r.chon(cb.a), V = r.chon(cb.V), K = r.chon(cb.K)
  const [A, B] = [cb.p.trai[0]![1], cb.p.trai[1]![1]]
  const n = (c: string, x = 0) => (c === A ? a - x : c === B ? b - x : cb.p.phai.find(([, d]) => d === c)![0] * x)
  const kcCua = (x: number) => kcTu(cb.p, (c) => n(c, x) / V)
  const x = giaiChiaDoi(kcCua, K, Math.min(a, b))
  return x === null ? null : { a, b, V, K, x, n: (c, xx = x) => n(c, xx) }
}

const HANG_SO_KC: MauDe[] = [
  {
    ma: 'kc.biet.nong_do_can_bang', dang: [KC_HS], muc: 'biet',
    sinh(r, phan) {
      const p = r.chon(PU_KC), chat = [...p.trai, ...p.phai], C = new Map(chat.map(([, c]) => [c, r.chon(ND_DEP)] as const)), g = (c: string) => C.get(c)!
      const Kc = kcTu(p, g)
      if (!(Kc >= 0.01 && Kc <= 999)) return null
      return soHoc(`Cho cân bằng hoá học: ${chuPu(p)}. Ở một nhiệt độ xác định, khi hệ đạt trạng thái cân bằng, nồng độ các chất là: ${chat.map(([, c]) => `[${c}] = ${vn(g(c))} M`).join('; ')}. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc. ${hoi(phan, 'Kc')}`, Kc, [
        ...nhieuKcCoBan(p, g),
        { giaTri: p.phai.reduce((s, [, c]) => s + g(c), 0) / p.trai.reduce((s, [, c]) => s + g(c), 0), viSao: 'cộng nồng độ thay vì nhân' },
      ], `Kc = ${bieuThuc(p)}`, [`Kc = ${bieuThuc(p)}.`, `Kc = ${thaySo(p, g)} ${bang(Kc)}.`], CHOT_KC, KT_KC, { chinhXac: soLe(lam(Kc)) <= 2 })
    },
  },
  {
    ma: 'kc.biet.tim_nong_do', dang: [KC_ND], muc: 'biet',
    sinh(r, phan) {
      const p = r.chon(PU_KC), chat = [...p.trai, ...p.phai], heSo1 = chat.filter(([k]) => k === 1)
      if (!heSo1.length) return null
      const an = r.chon(heSo1)[1], C = new Map(chat.map(([, c]) => [c, r.chon(ND_DEP)] as const)), g = (c: string) => C.get(c)!
      const Kc = lam(kcTu(p, g))
      if (!(Kc >= 0.01 && Kc <= 999) || soLe(Kc) > 3) return null
      const oPhai = p.phai.some(([, c]) => c === an), x = g(an)
      const A = tich(p.phai.filter(([, c]) => c !== an), g), B = tich(p.trai.filter(([, c]) => c !== an), g)
      const A1 = tich(p.phai.filter(([, c]) => c !== an), g, false), B1 = tich(p.trai.filter(([, c]) => c !== an), g, false)
      const khac = chat.filter(([, c]) => c !== an)
      return soHoc(`Cho cân bằng hoá học: ${chuPu(p)}. Ở một nhiệt độ xác định, hằng số cân bằng Kc = ${vn(Kc)}. Khi hệ đạt trạng thái cân bằng: ${khac.map(([, c]) => `[${c}] = ${vn(g(c))} M`).join('; ')}. Nồng độ mol của ${an} ở trạng thái cân bằng là x M. ${hoi(phan, 'x')}`, x, [
        { giaTri: oPhai ? A / (Kc * B) : Kc * B / A, viSao: `đặt [${an}] nhầm vế trong biểu thức Kc` },
        { giaTri: oPhai ? Kc * B1 / A1 : A1 / (Kc * B1), viSao: 'quên luỹ thừa theo hệ số của các chất còn lại' },
        { giaTri: oPhai ? B / (Kc * A) : Kc * A / B, viSao: 'chia cho Kc thay vì nhân (hoặc ngược lại) khi rút ẩn' },
        { giaTri: oPhai ? Kc * B * A : Kc * A * B, viSao: 'nhân tất cả các nồng độ còn lại với Kc' },
        { giaTri: x * Kc, viSao: 'nhân thêm Kc một lần khi rút ẩn' },
        { giaTri: x / Kc, viSao: 'chia thêm cho Kc một lần khi rút ẩn' },
        { giaTri: Math.sqrt(x), viSao: 'lấy căn bậc hai dù hệ số của chất cần tìm bằng 1' },
      ], `[${an}] = ${oPhai ? 'Kc · (tích chất phản ứng) : (tích sản phẩm còn lại)' : '(tích sản phẩm) : (Kc · tích chất phản ứng còn lại)'}`, [
        `Kc = ${bieuThuc(p)}.`,
        `⇒ [${an}] = ${oPhai
          ? `${vn(Kc)} · ${veTich(p.trai, (c) => vn(g(c)))}${p.phai.length > 1 ? ` : ${veTich(p.phai.filter(([, c]) => c !== an), (c) => vn(g(c)))}` : ''}`
          : `${veTich(p.phai, (c) => vn(g(c)))} : ${p.trai.length > 1 ? `(${vn(Kc)} · ${veTich(p.trai.filter(([, c]) => c !== an), (c) => vn(g(c)))})` : vn(Kc)}`} ${bang(x)} M.`,
      ], CHOT_KC, KT_KC, { chinhXac: soLe(x) <= 2 })
    },
  },
  {
    ma: 'kc.hieu.bang_bien_thien', dang: [KC_HS], muc: 'hieu', tuKhoa: /ban đầu|bình kín|dung tích|mol/,
    sinh(r, phan) {
      const p = r.chon(PU_KC.filter((x) => x.trai.length >= 1)), V = r.chon([1, 2, 4, 5, 10])
      const a0 = new Map(p.trai.map(([, c]) => [c, r.chon([0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2])] as const))
      const xiMax = Math.min(...p.trai.map(([k, c]) => a0.get(c)! / k)), xi = lam(r.chon([0.2, 0.25, 0.4, 0.5, 0.6, 0.75, 0.8]) * xiMax)
      const [kP, P] = p.phai[0]!, nP = lam(kP * xi)
      if (soLe(nP) > 3 || p.trai.some(([k, c]) => a0.get(c)! - k * xi <= 1e-9 || soLe(lam(a0.get(c)! - k * xi)) > 3)) return null
      const nCb = (c: string) => (a0.has(c) ? lam(a0.get(c)! - p.trai.find(([, d]) => d === c)![0] * xi) : lam(p.phai.find(([, d]) => d === c)![0] * xi))
      const g = (c: string) => nCb(c) / V, Kc = kcTu(p, g)
      if (!(Kc >= 0.01 && Kc <= 999)) return null
      const nDau = (c: string) => (a0.has(c) ? a0.get(c)! : nCb(c))
      const nSai = (c: string) => (a0.has(c) ? a0.get(c)! - nP : nCb(c))
      const kcSai = p.trai.every(([, c]) => nSai(c) > 1e-9) ? kcTu(p, (c) => nSai(c) / V) : Number.NaN
      const chatDau = noi(p.trai.map(([, c]) => `${vn(a0.get(c)!)} mol ${c}`))
      return soHoc(`Cho ${chatDau} vào một bình kín dung tích ${V} lít (ban đầu chưa có sản phẩm), giữ ở nhiệt độ không đổi. Xảy ra phản ứng: ${chuPu(p)}. Khi phản ứng đạt trạng thái cân bằng, trong bình có ${vn(nP)} mol ${P}. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc. ${hoi(phan, 'Kc')}`, Kc, [
        { giaTri: kcTu(p, nCb), viSao: `dùng số mol thay cho nồng độ (quên chia cho ${V} lít)` },
        { giaTri: kcTu(p, (c) => nDau(c) / V), viSao: 'dùng lượng ban đầu của chất phản ứng thay cho lượng lúc cân bằng' },
        ...(p.trai.some(([k]) => k !== kP) ? [{ giaTri: kcSai, viSao: `lấy lượng chất phản ứng đã dùng bằng lượng ${P} tạo thành (quên tỉ lệ hệ số)` }] : []),
        ...nhieuKcCoBan(p, g),
      ], `Kc = ${bieuThuc(p)} với nồng độ lúc cân bằng`, [
        `Lượng ${P} tạo thành ${vn(nP)} mol ⇒ ${p.trai.map(([k, c]) => `${c} phản ứng ${vn(lam(k * xi))} mol, còn ${vn(nCb(c))} mol`).join('; ')}${p.phai.length > 1 ? `; ${p.phai.slice(1).map(([, c]) => `${c} tạo thành ${vn(nCb(c))} mol`).join('; ')}` : ''}.`,
        `Nồng độ cân bằng (chia ${V} lít): ${[...p.trai, ...p.phai].map(([, c]) => `[${c}] ${bang(g(c))} M`).join('; ')}.`,
        `Kc = ${thaySo(p, g)} ${bang(Kc)}.`,
      ], CHOT_KC, [...KT_KC, 'bảng biến thiên số mol'])
    },
  },
  {
    ma: 'kc.hieu.di_the', dang: [KC_HS], muc: 'hieu', tuKhoa: /\(s\)|chất rắn|carbon|C\(s\)|FeO|Fe₂O₃/,
    sinh(r, phan) {
      const loai = r.nguyen(0, 2), V = r.chon([1, 2, 5, 10]), a = r.chon(ND_DEP), b = r.chon(ND_DEP)
      if (loai === 0) {
        const mC = r.chon([1.2, 2.4, 3.6, 4.8, 6, 12]), cC = mC / 12 / V, Kc = b * b / a
        if (!(Kc >= 0.01 && Kc <= 999)) return null
        return soHoc(`Cho cân bằng: CO₂(g) + C(s) ⇌ 2CO(g). Trong một bình kín dung tích ${V} lít, ở nhiệt độ xác định, khi hệ đạt cân bằng: [CO₂] = ${vn(a)} M, [CO] = ${vn(b)} M và trong bình còn ${vn(mC)} gam C. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc. ${hoi(phan, 'Kc')}`, Kc, [
          { giaTri: b * b / (a * cC), viSao: 'đưa nồng độ chất rắn C vào biểu thức Kc' },
          { giaTri: b / a, viSao: 'quên bình phương [CO]' },
          { giaTri: a / (b * b), viSao: 'lấy nghịch đảo' },
          { giaTri: 2 * b / a, viSao: 'nhân hệ số 2 thay vì lấy bình phương' },
        ], `Kc = [CO]² : [CO₂] (chất rắn không có mặt)`, [`C là chất rắn ⇒ Kc = [CO]² : [CO₂].`, `Kc = ${vn(b)}² : ${vn(a)} ${bang(Kc)}.`],
        CHOT_KC, [...KT_KC, 'cân bằng dị thể'], { chinhXac: soLe(lam(Kc)) <= 2 })
      }
      if (loai === 1) {
        const c = r.chon(ND_DEP), mC = r.chon([1.2, 2.4, 3.6, 6, 12]), cC = mC / 12 / V, Kc = b * c / a
        if (!(Kc >= 0.01 && Kc <= 999)) return null
        return soHoc(`Cho cân bằng: C(s) + H₂O(g) ⇌ CO(g) + H₂(g). Trong một bình kín dung tích ${V} lít, ở nhiệt độ xác định, khi hệ đạt cân bằng: [H₂O] = ${vn(a)} M, [CO] = ${vn(b)} M, [H₂] = ${vn(c)} M và trong bình còn ${vn(mC)} gam C. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc. ${hoi(phan, 'Kc')}`, Kc, [
          { giaTri: b * c / (a * cC), viSao: 'đưa nồng độ chất rắn C vào biểu thức Kc' },
          { giaTri: a / (b * c), viSao: 'lấy nghịch đảo' },
          { giaTri: (b + c) / a, viSao: 'cộng nồng độ sản phẩm thay vì nhân' },
          { giaTri: b * c * a, viSao: 'nhân cả nồng độ H₂O vào tử số' },
        ], `Kc = [CO] · [H₂] : [H₂O] (chất rắn không có mặt)`, [`C là chất rắn ⇒ Kc = [CO] · [H₂] : [H₂O].`, `Kc = ${vn(b)} · ${vn(c)} : ${vn(a)} ${bang(Kc)}.`],
        CHOT_KC, [...KT_KC, 'cân bằng dị thể'], { chinhXac: soLe(lam(Kc)) <= 2 })
      }
      const Kc = (b / a) ** 3
      if (!(Kc >= 0.01 && Kc <= 999)) return null
      return soHoc(`Cho cân bằng: Fe₂O₃(s) + 3CO(g) ⇌ 2Fe(s) + 3CO₂(g). Ở một nhiệt độ xác định, khi hệ đạt cân bằng: [CO] = ${vn(a)} M và [CO₂] = ${vn(b)} M. Hằng số cân bằng của phản ứng ở nhiệt độ đó là Kc. ${hoi(phan, 'Kc')}`, Kc, [
        { giaTri: b / a, viSao: 'quên luỹ thừa 3' },
        { giaTri: (a / b) ** 3, viSao: 'lấy nghịch đảo' },
        { giaTri: (b / a) ** 2, viSao: 'dùng số mũ 2 (hệ số của Fe) thay cho 3' },
        { giaTri: b ** 3 / a, viSao: 'chỉ lấy luỹ thừa 3 cho [CO₂], quên luỹ thừa của [CO]' },
      ], `Kc = [CO₂]³ : [CO]³ (chất rắn không có mặt)`, [`Fe₂O₃ và Fe là chất rắn ⇒ Kc = [CO₂]³ : [CO]³.`, `Kc = (${vn(b)} : ${vn(a)})³ ${bang(Kc)}.`],
      CHOT_KC, [...KT_KC, 'cân bằng dị thể'], { chinhXac: soLe(lam(Kc)) <= 2 })
    },
  },
  {
    ma: 'kc.hieu.tim_nong_do_binh_phuong', dang: [KC_ND], muc: 'hieu',
    sinh(r, phan) {
      const p = r.chon(PU_KC.filter((x) => x.phai.length === 1 && x.phai[0]![0] === 2)), [, X] = p.phai[0]!
      // Đáp số khác 1 (1² = 1 trùng nhiễu "quên căn") và khác mọi nồng độ in trong đề.
      const xX = r.chon(ND_DEP.filter((v) => v !== 1)), khac = ND_DEP.filter((v) => v !== xX)
      const C = new Map([...p.trai, ...p.phai].map(([, c]) => [c, c === X ? xX : r.chon(khac)] as const)), g = (c: string) => C.get(c)!
      const Kc = lam(kcTu(p, g))
      if (!(Kc >= 0.01 && Kc <= 999) || soLe(Kc) > 3) return null
      const B = tich(p.trai, g), x = g(X)
      return soHoc(`Cho cân bằng hoá học: ${chuPu(p)}. Ở một nhiệt độ xác định, hằng số cân bằng Kc = ${vn(Kc)}. Khi hệ đạt trạng thái cân bằng: ${p.trai.map(([, c]) => `[${c}] = ${vn(g(c))} M`).join('; ')}. Nồng độ mol của ${X} ở trạng thái cân bằng là x M. ${hoi(phan, 'x')}`, x, [
        { giaTri: Kc * B, viSao: `quên lấy căn bậc hai (dừng ở [${X}]²)` },
        { giaTri: Kc * B / 2, viSao: 'chia 2 thay vì lấy căn bậc hai' },
        { giaTri: Math.sqrt(B / Kc), viSao: 'chia cho Kc thay vì nhân' },
        { giaTri: Math.sqrt(Kc * tich(p.trai, g, false)), viSao: 'quên luỹ thừa theo hệ số của chất phản ứng' },
        { giaTri: 2 * x, viSao: `nhân thêm hệ số 2 của ${X} vào nồng độ` },
        { giaTri: x / 2, viSao: `chia nồng độ cho hệ số 2 của ${X}` },
      ], `[${X}]² = Kc · ${veTich(p.trai, (c) => `[${c}]`)} ⇒ [${X}] = √(${vn(Kc)} · ${vnT(B)})`, [
        `Kc = ${bieuThuc(p)} ⇒ [${X}]² = ${vn(Kc)} · ${veTich(p.trai, (c) => vn(g(c)))} ${bang(Kc * B)}.`,
        `[${X}] = √${vnT(Kc * B)} ${bang(x)} M.`,
      ], CHOT_KC, KT_KC, { chinhXac: soLe(x) <= 2 })
    },
  },
  {
    ma: 'kc.van_dung.nong_do', dang: [KC_ND], muc: 'van_dung', tuKhoa: /Kc|KC|hằng số cân bằng/,
    sinh(r, phan) {
      const cb = r.chon(CB_NGUOC), kq0 = canBangNguoc(r, cb)
      if (!kq0) return null
      const { a, b, V, K, x } = kq0, [A, B] = [cb.p.trai[0]![1], cb.p.trai[1]![1]], hoiSp = r.so() < 0.6
      const X = hoiSp ? cb.p.phai[0]![1] : A, kq = kq0.n(X) / V
      // Nhiễu: quên hệ số sản phẩm (giải lại với hệ số 1), dùng số mol thay nồng độ (giải lại với V = 1), coi phản ứng hoàn toàn.
      const pMot: PuKc = { trai: cb.p.trai, phai: cb.p.phai.map(([, c]) => [1, c] as const) }
      const x1 = giaiChiaDoi((t) => kcTu(pMot, (c) => (c === A ? a - t : c === B ? b - t : t) / V), K, Math.min(a, b))
      const xMol = giaiChiaDoi((t) => kcTu(cb.p, (c) => (c === A ? a - t : c === B ? b - t : cb.p.phai.find(([, d]) => d === c)![0] * t)), K, Math.min(a, b))
      const theo = (t: number | null) => (t === null ? Number.NaN : (hoiSp ? cb.p.phai[0]![0] * t : a - t) / V)
      const nhieu: Nhieu[] = [
        { giaTri: theo(Math.min(a, b) * (1 - 1e-12)), viSao: 'coi phản ứng xảy ra hoàn toàn (bỏ qua cân bằng)' },
        { giaTri: theo(x1), viSao: `quên hệ số của sản phẩm khi viết biểu thức Kc` },
        { giaTri: theo(xMol), viSao: 'thay số mol (không chia thể tích) vào biểu thức Kc' },
        { giaTri: hoiSp ? x / V : (a - 2 * x) / V, viSao: hoiSp ? 'lấy lượng sản phẩm bằng lượng chất phản ứng đã dùng (quên hệ số)' : 'trừ gấp đôi lượng đã phản ứng' },
        { giaTri: kq0.n(X), viSao: 'trả lời số mol thay vì nồng độ mol' },
      ]
      return soHoc(`Cho ${noi([`${vn(a)} mol ${A}`, `${vn(b)} mol ${B}`])} vào một bình kín dung tích ${V} lít. Ở nhiệt độ xác định xảy ra phản ứng: ${chuPu(cb.p)} với hằng số cân bằng Kc = ${vn(K)}. Nồng độ mol của ${X} ở trạng thái cân bằng là x M. ${hoi(phan, 'x')}`, kq, nhieu,
        `gọi lượng ${A} phản ứng là t mol, thay nồng độ lúc cân bằng vào Kc rồi giải ra t ${bang(x)}`, [
          `Gọi t (mol) là lượng ${A} phản ứng: cân bằng có ${A} ${vn(a)} − t; ${B} ${vn(b)} − t; ${cb.p.phai.map(([k, c]) => `${c} ${k === 1 ? '' : k}t`).join('; ')} (mol), thể tích ${V} lít.`,
          `Kc = ${bieuThuc(cb.p)} = ${vn(K)} ⇒ giải phương trình được t ${bang(x)} mol (0 < t < ${vn(Math.min(a, b))}).`,
          `[${X}] = ${vnT(kq0.n(X))} : ${V} ${bang(kq)} M.`,
        ], CHOT_KC, [...KT_KC, 'tính lượng chất lúc cân bằng từ Kc'])
    },
  },
  {
    ma: 'kc.van_dung.so_mol', dang: [KC_SM], muc: 'van_dung',
    sinh(r, phan) {
      const cb = r.chon(CB_NGUOC), kq0 = canBangNguoc(r, cb)
      if (!kq0) return null
      const { a, b, V, K, x } = kq0, [A, B] = [cb.p.trai[0]![1], cb.p.trai[1]![1]], [kX, X] = cb.p.phai[0]!, kq = kX * x
      const pMot: PuKc = { trai: cb.p.trai, phai: cb.p.phai.map(([, c]) => [1, c] as const) }
      const x1 = giaiChiaDoi((t) => kcTu(pMot, (c) => (c === A ? a - t : c === B ? b - t : t) / V), K, Math.min(a, b))
      return soHoc(`Trong một bình kín dung tích ${V} lít chứa ${vn(a)} mol ${A} và ${vn(b)} mol ${B}. Ở nhiệt độ xác định xảy ra phản ứng: ${chuPu(cb.p)} với hằng số cân bằng Kc = ${vn(K)}. Số mol ${X} có trong bình khi phản ứng đạt trạng thái cân bằng là n. ${hoi(phan, 'n')}`, kq, [
        { giaTri: kX * Math.min(a, b), viSao: 'coi phản ứng xảy ra hoàn toàn (bỏ qua cân bằng)' },
        { giaTri: x1 === null ? Number.NaN : kX * x1, viSao: 'quên hệ số của sản phẩm khi viết biểu thức Kc' },
        ...(kX > 1 ? [{ giaTri: x, viSao: `lấy số mol ${X} bằng lượng ${A} đã phản ứng (quên hệ số ${kX})` }] : []),
        { giaTri: kq / V, viSao: 'trả lời nồng độ mol thay vì số mol' },
        { giaTri: kX * x / 2, viSao: 'chia đôi kết quả' },
      ], `gọi lượng ${A} phản ứng là t, thay vào Kc giải được t ${bang(x)} ⇒ n(${X}) = ${kX === 1 ? '' : kX}t`, [
        `Gọi t (mol) là lượng ${A} phản ứng: cân bằng có ${A} ${vn(a)} − t; ${B} ${vn(b)} − t; ${cb.p.phai.map(([k, c]) => `${c} ${k === 1 ? '' : k}t`).join('; ')} (mol).`,
        `Kc = ${bieuThuc(cb.p)} = ${vn(K)} (nồng độ = số mol : ${V}) ⇒ t ${bang(x)} mol.`,
        `n(${X}) = ${kX === 1 ? '' : `${kX} · `}${vnT(x)} ${bang(kq)} mol.`,
      ], CHOT_KC, [...KT_KC, 'tính lượng chất lúc cân bằng từ Kc'])
    },
  },
  {
    ma: 'kc.van_dung.ester', dang: [KC_KL], muc: 'van_dung', tuKhoa: /ester|acid|alcohol|ethanol/,
    sinh(r, phan) {
      const e = r.chon([
        { axit: 'CH₃COOH', tenAxit: 'acetic acid', ancol: 'C₂H₅OH', tenAncol: 'ethanol', ester: 'CH₃COOC₂H₅', tenEster: 'ethyl acetate', K: 4 },
        { axit: 'C₂H₅COOH', tenAxit: 'propanoic acid', ancol: 'C₂H₅OH', tenAncol: 'ethanol', ester: 'C₂H₅COOC₂H₅', tenEster: 'ethyl propanoate', K: 7.5 },
        { axit: 'CH₃COOH', tenAxit: 'acetic acid', ancol: '(CH₃)₂CHCH₂CH₂OH', tenAncol: 'isoamyl alcohol', ester: 'CH₃COOCH₂CH₂CH(CH₃)₂', tenEster: 'isoamyl acetate', K: 4 },
      ])
      const nA = r.chon([0.1, 0.12, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 1]), nB = r.chon([0.1, 0.12, 0.15, 0.2, 0.3, 0.4, 0.5, 0.6, 1])
      const mA = lam(nA * M(e.axit)), mB = lam(nB * M(e.ancol)), Me = M(e.ester)
      if (soLe(mA) > 2 || soLe(mB) > 2) return null
      const kc = (t: number) => (t * t) / ((nA - t) * (nB - t)), x = giaiChiaDoi(kc, e.K, Math.min(nA, nB))
      if (x === null) return null
      const kq = x * Me
      const xSai = e.K / (1 + e.K) * Math.min(nA, nB)
      return soHoc(`Cho ${vn(mA)} gam ${e.tenAxit} (${e.axit}) phản ứng với ${vn(mB)} gam ${e.tenAncol} (${e.ancol}) có H₂SO₄ đặc làm xúc tác: ${e.axit}(l) + ${e.ancol}(l) ⇌ ${e.ester}(l) + H₂O(l). Ở nhiệt độ phản ứng, hằng số cân bằng Kc = ${vn(e.K)} (coi thể tích hệ không đổi). Khối lượng ${e.tenEster} thu được khi hệ đạt trạng thái cân bằng là m gam. ${hoi(phan, 'm')}`, kq, [
        { giaTri: Math.min(nA, nB) * Me, viSao: 'coi phản ứng xảy ra hoàn toàn (bỏ qua cân bằng)' },
        { giaTri: xSai * Me, viSao: `lấy lượng ester = Kc : (1 + Kc) · số mol chất ít hơn (chỉ đúng khi hai chất bằng mol và không có căn)` },
        { giaTri: Math.min(nA, nB) / 2 * Me, viSao: 'lấy một nửa lượng chất phản ứng' },
        { giaTri: x * M(e.axit), viSao: `dùng khối lượng mol của acid (${M(e.axit)}) cho ester` },
      ], `t² : ((${vn(nA)} − t)(${vn(nB)} − t)) = ${vn(e.K)} ⇒ t ${bang(x)} mol ⇒ m = t · ${Me}`, [
        `n(${e.axit}) = ${vn(mA)} : ${M(e.axit)} = ${vn(nA)} mol; n(${e.ancol}) = ${vn(mB)} : ${M(e.ancol)} = ${vn(nB)} mol.`,
        `Gọi t là số mol ester tạo thành: Kc = t² : ((${vn(nA)} − t)(${vn(nB)} − t)) = ${vn(e.K)} (thể tích triệt tiêu) ⇒ t ${bang(x)} mol.`,
        `m = ${vnT(x)} · ${Me} ${bang(kq)} gam.`,
      ], `${CHOT_KC} Ester hoá thuận nghịch: số mol ester lúc cân bằng giải từ Kc.`, [...KT_KC, 'cân bằng ester hoá'])
    },
  },
  {
    ma: 'kc.van_dung.ti_khoi', dang: [KC_HS], muc: 'van_dung', tuKhoa: /tỉ khối|N₂O₄|NO₂/,
    sinh(r, phan) {
      const a = r.chon([0.5, 1, 1.5, 2]), V = r.chon([1, 2, 4, 5]), d = r.chon([24, 25, 26, 27, 28, 28.75, 30, 32, 34.5, 36.8, 40, 42])
      const nT = 92 * a / (2 * d), x = nT - a
      if (x <= 0 || x >= a) return null
      const N2O4 = (a - x) / V, NO2 = 2 * x / V, Kc = NO2 * NO2 / N2O4
      return soHoc(`Trong bình kín dung tích ${V} lít, ban đầu chỉ chứa ${vn(a)} mol N₂O₄. Đưa bình đến nhiệt độ T, xảy ra phản ứng: N₂O₄(g) ⇌ 2NO₂(g). Khi phản ứng đạt trạng thái cân bằng, tỉ khối của hỗn hợp khí so với H₂ là ${vn(d)}. Hằng số cân bằng của phản ứng ở nhiệt độ T là Kc. ${hoi(phan, 'Kc')}`, Kc, [
        { giaTri: (x / V) ** 2 / N2O4, viSao: 'quên hệ số 2 (lấy n(NO₂) = lượng N₂O₄ phân li)' },
        { giaTri: NO2 / N2O4, viSao: 'quên bình phương [NO₂]' },
        { giaTri: N2O4 / (NO2 * NO2), viSao: 'lấy nghịch đảo' },
        { giaTri: (2 * x) ** 2 / (a - x), viSao: `dùng số mol thay cho nồng độ (quên chia ${V} lít)` },
        { giaTri: NO2 * NO2 / (a / V), viSao: 'dùng lượng N₂O₄ ban đầu thay cho lượng lúc cân bằng' },
      ], `M(hỗn hợp) = ${vn(lam(2 * d))} ⇒ n(hỗn hợp) = 92 · ${vn(a)} : ${vn(lam(2 * d))} ⇒ x ${bang(x)} mol N₂O₄ phân li`, [
        `M(hỗn hợp) = 2 · ${vn(d)} = ${vn(lam(2 * d))}; bảo toàn khối lượng: n(hỗn hợp) = 92 · ${vn(a)} : ${vn(lam(2 * d))} ${bang(nT)} mol.`,
        `Gọi x là số mol N₂O₄ phân li: n(hỗn hợp) = ${vn(a)} + x ⇒ x ${bang(x)} mol ⇒ [N₂O₄] ${bang(N2O4)} M; [NO₂] = 2x : ${V} ${bang(NO2)} M.`,
        `Kc = [NO₂]² : [N₂O₄] ${bang(Kc)}.`,
      ], `${CHOT_KC} Tỉ khối cho M trung bình ⇒ tổng số mol (khối lượng khí không đổi).`, [...KT_KC, 'tỉ khối hỗn hợp khí'])
    },
  },
]

// ================================================================ HỌ 14. SULFURIC ACID: KIM LOẠI + H₂SO₄
interface KimLoai { kl: string; tri: number; muoiLoang: string | null; kL: number; muoiDac: string; kD: number }
/** tri = hoá trị trong muối (đặc nóng: Fe lên 3); kL/kD = số mol muối từ 1 mol kim loại (loãng/đặc). */
const KL_SA: Readonly<Record<string, KimLoai>> = {
  Mg: { kl: 'Mg', tri: 2, muoiLoang: 'MgSO₄', kL: 1, muoiDac: 'MgSO₄', kD: 1 },
  Zn: { kl: 'Zn', tri: 2, muoiLoang: 'ZnSO₄', kL: 1, muoiDac: 'ZnSO₄', kD: 1 },
  Fe: { kl: 'Fe', tri: 3, muoiLoang: 'FeSO₄', kL: 1, muoiDac: 'Fe₂(SO₄)₃', kD: 0.5 },
  Al: { kl: 'Al', tri: 3, muoiLoang: 'Al₂(SO₄)₃', kL: 0.5, muoiDac: 'Al₂(SO₄)₃', kD: 0.5 },
  Cu: { kl: 'Cu', tri: 2, muoiLoang: null, kL: 0, muoiDac: 'CuSO₄', kD: 1 },
  Ag: { kl: 'Ag', tri: 1, muoiLoang: null, kL: 0, muoiDac: 'Ag₂SO₄', kD: 0.5 },
}
/** Hoá trị khi tác dụng H₂SO₄ LOÃNG (Fe chỉ lên 2). */
const triLoang = (k: KimLoai) => (k.kl === 'Fe' ? 2 : k.tri)
/** Số mol kim loại đề cho: bội 0,01 trong [0,02; 0,5]. */
const N_KL: readonly number[] = Array.from({ length: 49 }, (_, i) => lam((i + 2) / 100))
const KT_SA = ['sulfuric acid', 'bảo toàn electron']
const CHOT_LOANG = 'H₂SO₄ loãng: kim loại đứng trước H → muối (Fe lên Fe²⁺) + H₂; n(H₂) = hoá trị · n(kim loại) : 2; Cu, Ag không phản ứng.'
const CHOT_DAC = 'H₂SO₄ đặc, nóng, dư: kim loại lên hoá trị cao nhất (Fe → Fe³⁺); S⁺⁶ + 2e → S⁺⁴ ⇒ n(SO₂) = hoá trị · n(kim loại) : 2.'
const khoiLuongKl = (r: Rng, kl: string) => lam(r.chon(N_KL) * NTK[kl]!)

const SULFURIC: MauDe[] = [
  {
    ma: 'sulfuric.biet.h2', dang: [SA_TT], muc: 'biet', tuKhoa: /loãng|H₂/,
    sinh(r, phan) {
      const k = KL_SA[r.chon(['Mg', 'Zn', 'Fe', 'Al'])]!, A = NTK[k.kl]!, a = khoiLuongKl(r, k.kl), n = a / A, t = triLoang(k), nH = t * n / 2, kq = nH * V_KHI
      return soHoc(`Hoà tan hoàn toàn ${vn(a)} gam ${k.kl} trong dung dịch H₂SO₄ loãng, dư, thu được V lít khí H₂ ${CHU_DKC}. ${hoi(phan, 'V')}`, kq, [
        ...(k.kl === 'Fe' ? [{ giaTri: 1.5 * n * V_KHI, viSao: 'cho Fe lên Fe³⁺ (trong H₂SO₄ loãng Fe chỉ lên Fe²⁺)' }] : []),
        ...(k.kl === 'Al' ? [{ giaTri: n * V_KHI, viSao: 'lấy n(H₂) = n(Al) (quên hoá trị 3)' }, { giaTri: 3 * n * V_KHI, viSao: 'lấy n(H₂) = 3n(Al) (quên chia 2)' }] : []),
        ...(k.kl === 'Mg' || k.kl === 'Zn' ? [{ giaTri: n / 2 * V_KHI, viSao: `lấy n(H₂) = n(${k.kl}) : 2` }] : []),
        { giaTri: nH * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ) thay vì 24,79 L/mol ở đkc' },
        { giaTri: 2 * nH * V_KHI, viSao: 'nhân đôi số mol H₂' },
        { giaTri: nH / 2 * V_KHI, viSao: 'chia đôi số mol H₂' },
      ], `n(H₂) = ${t} · n(${k.kl}) : 2 ⇒ V = n(H₂) · 24,79`, [
        `n(${k.kl}) = ${vn(a)} : ${A} ${bang(n)} mol; ${k.kl} → ${k.kl}${t === 3 ? '³⁺' : '²⁺'} + ${t}e; 2H⁺ + 2e → H₂ ⇒ n(H₂) = ${t} · ${vnT(n)} : 2 ${bang(nH)} mol.`,
        `V = ${vnT(nH)} · 24,79 ${bang(kq)} lít.`,
      ], CHOT_LOANG, [...KT_SA, 'thể tích khí ở đkc'])
    },
  },
  {
    ma: 'sulfuric.biet.muoi_loang', dang: [SA_KL], muc: 'biet', tuKhoa: /loãng|muối/,
    sinh(r, phan) {
      const k = KL_SA[r.chon(['Mg', 'Zn', 'Fe', 'Al'])]!, A = NTK[k.kl]!, a = khoiLuongKl(r, k.kl), n = a / A, Mm = M(k.muoiLoang!), kq = n * k.kL * Mm, nH = triLoang(k) * n / 2
      return soHoc(`Hoà tan hoàn toàn ${vn(a)} gam ${k.kl} trong dung dịch H₂SO₄ loãng (vừa đủ). Cô cạn dung dịch sau phản ứng, thu được m gam muối khan. ${hoi(phan, 'm')}`, kq, [
        ...(k.kl === 'Fe' ? [{ giaTri: n / 2 * M('Fe₂(SO₄)₃'), viSao: 'cho Fe lên Fe³⁺ (muối Fe₂(SO₄)₃)' }] : []),
        ...(k.kl === 'Al' ? [{ giaTri: n * Mm, viSao: 'lấy n(Al₂(SO₄)₃) = n(Al) (quên chia 2)' }] : []),
        { giaTri: a + 98 * nH, viSao: 'cộng khối lượng H₂SO₄ (98) thay vì gốc SO₄ (96)' },
        { giaTri: a + 96 * n, viSao: `lấy n(SO₄²⁻) = n(${k.kl})` },
        { giaTri: n * k.kL * (Mm - 96 + 98), viSao: 'tính khối lượng muối với M sai (cộng nhầm 2H)' },
        { giaTri: a + 96 * 2 * nH, viSao: 'lấy n(SO₄²⁻) = 2n(H₂)' },
      ], `m = m(kim loại) + 96 · n(H₂) = ${vn(a)} + 96 · ${vnT(nH)}`, [
        `n(${k.kl}) = ${vn(a)} : ${A} ${bang(n)} mol ⇒ n(${k.muoiLoang}) = ${k.kL === 1 ? '' : `${vn(k.kL)} · `}${vnT(n)} ${bang(n * k.kL)} mol.`,
        `m = ${vnT(n * k.kL)} · ${Mm} ${bang(kq)} gam (kiểm tra: ${vn(a)} + 96 · ${vnT(nH)} ${bang(a + 96 * nH)}).`,
      ], `${CHOT_LOANG} m(muối) = m(kim loại) + 96 · n(H₂).`, [...KT_SA, 'bảo toàn khối lượng'])
    },
  },
  {
    ma: 'sulfuric.hieu.so2', dang: [SA_TT], muc: 'hieu', tuKhoa: /đặc|SO₂/,
    sinh(r, phan) {
      const k = KL_SA[r.chon(['Cu', 'Fe', 'Zn', 'Mg', 'Al', 'Ag'])]!, A = NTK[k.kl]!, a = khoiLuongKl(r, k.kl), n = a / A, nS = k.tri * n / 2, kq = nS * V_KHI
      return soHoc(`Cho ${vn(a)} gam ${k.kl} tác dụng hết với dung dịch H₂SO₄ đặc, nóng, dư, thu được V lít khí SO₂ (sản phẩm khử duy nhất của S⁺⁶, ${CHU_DKC.slice(1, -1)}). ${hoi(phan, 'V')}`, kq, [
        ...(k.kl === 'Fe' ? [{ giaTri: n * V_KHI, viSao: 'cho Fe lên Fe²⁺ (trong H₂SO₄ đặc, nóng, dư Fe lên Fe³⁺)' }] : []),
        ...(k.tri !== 2 ? [{ giaTri: n * V_KHI, viSao: `lấy n(SO₂) = n(${k.kl})` }] : [{ giaTri: 2 * n * V_KHI, viSao: `lấy n(SO₂) = 2n(${k.kl}) theo hệ số H₂SO₄` }]),
        { giaTri: nS * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ) thay vì 24,79 L/mol ở đkc' },
        { giaTri: k.tri * n * V_KHI, viSao: 'lấy số mol SO₂ bằng số mol electron' },
        { giaTri: nS / 2 * V_KHI, viSao: 'chia đôi số mol SO₂' },
      ], `bảo toàn electron: 2n(SO₂) = ${k.tri} · n(${k.kl})`, [
        `n(${k.kl}) = ${vn(a)} : ${A} ${bang(n)} mol; ${k.kl} → ${k.kl}${['', '⁺', '²⁺', '³⁺'][k.tri]} + ${k.tri}e; S⁺⁶ + 2e → S⁺⁴ (SO₂).`,
        `n(SO₂) = ${k.tri} · ${vnT(n)} : 2 ${bang(nS)} mol ⇒ V = ${vnT(nS)} · 24,79 ${bang(kq)} lít.`,
      ], CHOT_DAC, [...KT_SA, 'H₂SO₄ đặc có tính oxi hoá mạnh'])
    },
  },
  {
    ma: 'sulfuric.hieu.muoi_dac', dang: [SA_KL], muc: 'hieu', tuKhoa: /đặc|muối/,
    sinh(r, phan) {
      const k = KL_SA[r.chon(['Cu', 'Fe', 'Zn', 'Mg', 'Al', 'Ag'])]!, A = NTK[k.kl]!, a = khoiLuongKl(r, k.kl), n = a / A, Mm = M(k.muoiDac), kq = n * k.kD * Mm, nS = k.tri * n / 2
      return soHoc(`Cho ${vn(a)} gam ${k.kl} tác dụng hết với dung dịch H₂SO₄ đặc, nóng, dư (sản phẩm khử duy nhất là SO₂). Khối lượng muối sulfate tạo thành là m gam. ${hoi(phan, 'm')}`, kq, [
        ...(k.kl === 'Fe' ? [{ giaTri: n * M('FeSO₄'), viSao: 'cho Fe lên Fe²⁺ (muối FeSO₄)' }] : []),
        ...(k.kD === 0.5 ? [{ giaTri: n * Mm, viSao: `lấy n(${k.muoiDac}) = n(${k.kl}) (quên chia 2)` }] : []),
        { giaTri: a + 98 * nS, viSao: 'cộng khối lượng H₂SO₄ (98) thay vì gốc SO₄ (96)' },
        { giaTri: a + 96 * 2 * nS, viSao: 'lấy n(SO₄²⁻ trong muối) = 2n(SO₂)' },
        { giaTri: a + 64 * nS, viSao: 'cộng khối lượng SO₂ thay vì gốc SO₄' },
      ], `m = m(kim loại) + 96 · n(SO₂) = ${vn(a)} + 96 · ${vnT(nS)}`, [
        `n(${k.kl}) = ${vn(a)} : ${A} ${bang(n)} mol ⇒ n(${k.muoiDac}) = ${k.kD === 1 ? '' : '0,5 · '}${vnT(n)} ${bang(n * k.kD)} mol.`,
        `m = ${vnT(n * k.kD)} · ${Mm} ${bang(kq)} gam (kiểm tra: n(SO₂) ${bang(nS)} mol; ${vn(a)} + 96 · ${vnT(nS)} ${bang(a + 96 * nS)}).`,
      ], `${CHOT_DAC} n(SO₄²⁻ trong muối) = n(SO₂).`, [...KT_SA, 'bảo toàn khối lượng'])
    },
  },
  {
    ma: 'sulfuric.van_dung.hai_buoc', dang: [SA_TT], muc: 'van_dung', tuKhoa: /hỗn hợp|chất rắn không tan|Cu/,
    sinh(r, phan) {
      const x = r.boi(0.02, 0.3, 0.01), y = r.boi(0.02, 0.3, 0.01), a = lam(56 * x + 64 * y), V1 = lam(x * V_KHI), kq = y * V_KHI
      return soHoc(`Cho ${vn(a)} gam hỗn hợp gồm Fe và Cu vào dung dịch H₂SO₄ loãng, dư, thu được ${vn(V1)} lít khí H₂ ${CHU_DKC} và còn lại chất rắn không tan. Cho toàn bộ chất rắn không tan đó tác dụng hết với dung dịch H₂SO₄ đặc, nóng, dư, thu được V lít khí SO₂ (sản phẩm khử duy nhất, đkc). ${hoi(phan, 'V')}`, kq, [
        { giaTri: (1.5 * x + y) * V_KHI, viSao: 'tính cả Fe vào phản ứng với H₂SO₄ đặc (Fe đã tan hết ở bước đầu)' },
        { giaTri: (a / 64) * V_KHI, viSao: 'coi cả hỗn hợp là Cu' },
        { giaTri: y * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ)' },
        { giaTri: 2 * y * V_KHI, viSao: 'lấy n(SO₂) = 2n(Cu) theo hệ số H₂SO₄' },
        { giaTri: (a - 56 * x) / 56 * V_KHI, viSao: 'chia khối lượng Cu cho M của Fe' },
      ], `n(Fe) = n(H₂); n(Cu) = (m − 56n(Fe)) : 64 = n(SO₂)`, [
        `Cu không tan trong H₂SO₄ loãng ⇒ n(Fe) = n(H₂) = ${vn(V1)} : 24,79 = ${vn(x)} mol ⇒ m(Cu) = ${vn(a)} − 56 · ${vn(x)} = ${vn(lam(64 * y))} gam ⇒ n(Cu) = ${vn(y)} mol.`,
        `Cu + 2H₂SO₄ (đặc) → CuSO₄ + SO₂ + 2H₂O ⇒ n(SO₂) = ${vn(y)} mol ⇒ V = ${vn(y)} · 24,79 ${bang(kq)} lít.`,
      ], `${CHOT_LOANG} ${CHOT_DAC}`, [...KT_SA, 'hỗn hợp kim loại'])
    },
  },
  {
    ma: 'sulfuric.van_dung.thu_dong', dang: [SA_TT], muc: 'van_dung', tuKhoa: /nguội|thụ động/,
    sinh(r, phan) {
      const kl = r.chon(['Al', 'Fe']), A = NTK[kl]!, x = r.boi(0.02, 0.3, 0.01), y = r.boi(0.02, 0.3, 0.01), a = lam(A * x + 64 * y), kq = y * V_KHI
      return soHoc(`Cho ${vn(a)} gam hỗn hợp gồm ${kl} và Cu (trong đó có ${vn(lam(A * x))} gam ${kl}) vào dung dịch H₂SO₄ đặc, nguội, dư, thu được V lít khí SO₂ (sản phẩm khử duy nhất, đkc). ${hoi(phan, 'V')}`, kq, [
        { giaTri: (1.5 * x + y) * V_KHI, viSao: `quên ${kl} bị thụ động trong H₂SO₄ đặc, nguội (tính cả ${kl} phản ứng)` },
        { giaTri: (x + y) * V_KHI, viSao: `tính cả ${kl} phản ứng với tỉ lệ 1 : 1` },
        { giaTri: a / 64 * V_KHI, viSao: 'coi cả hỗn hợp là Cu' },
        { giaTri: y * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ)' },
      ], `${kl} thụ động trong H₂SO₄ đặc, nguội ⇒ chỉ Cu phản ứng: n(SO₂) = n(Cu)`, [
        `${kl} bị thụ động hoá trong H₂SO₄ đặc, nguội ⇒ chỉ Cu phản ứng. m(Cu) = ${vn(a)} − ${vn(lam(A * x))} = ${vn(lam(64 * y))} gam ⇒ n(Cu) = ${vn(y)} mol.`,
        `n(SO₂) = n(Cu) = ${vn(y)} mol ⇒ V = ${vn(y)} · 24,79 ${bang(kq)} lít.`,
      ], 'Al, Fe, Cr bị thụ động hoá trong H₂SO₄ đặc, nguội (không phản ứng); Cu + 2H₂SO₄ đặc → CuSO₄ + SO₂ + 2H₂O.', [...KT_SA, 'thụ động hoá'])
    },
  },
  {
    ma: 'sulfuric.van_dung.muoi_hon_hop', dang: [SA_KL], muc: 'van_dung', tuKhoa: /hỗn hợp|muối/,
    sinh(r, phan) {
      const [k1, k2] = r.chon([['Mg', 'Zn'], ['Mg', 'Cu'], ['Zn', 'Cu'], ['Al', 'Cu'], ['Fe', 'Cu'], ['Mg', 'Fe']] as const).map((k) => KL_SA[k]!)
      const x = r.boi(0.02, 0.4, 0.02), y = r.boi(0.02, 0.4, 0.02), a = lam(NTK[k1.kl]! * x + NTK[k2.kl]! * y), nS = lam((k1.tri * x + k2.tri * y) / 2), V = lam(nS * V_KHI), kq = a + 96 * nS
      if (soLe(V) > 4) return null
      return soHoc(`Hoà tan hoàn toàn ${vn(a)} gam hỗn hợp X gồm ${k1.kl} và ${k2.kl} trong dung dịch H₂SO₄ đặc, nóng, dư, thu được ${vn(V)} lít khí SO₂ (sản phẩm khử duy nhất, đkc). Khối lượng muối sulfate tạo thành là m gam. ${hoi(phan, 'm')}`, kq, [
        { giaTri: a + 98 * nS, viSao: 'cộng khối lượng H₂SO₄ (98) thay vì gốc SO₄ (96)' },
        { giaTri: a + 96 * 2 * nS, viSao: 'lấy n(SO₄²⁻ trong muối) = 2n(SO₂)' },
        { giaTri: a + 64 * nS, viSao: 'cộng khối lượng SO₂ thay vì gốc SO₄' },
        { giaTri: a + 96 * nS / 2, viSao: 'lấy n(SO₄²⁻ trong muối) = n(SO₂) : 2' },
      ], `m = m(X) + 96 · n(SO₂)`, [
        `n(SO₂) = ${vn(V)} : 24,79 ${bang(nS)} mol; bảo toàn electron: n(e nhường) = 2n(SO₂) = điện tích dương của ion kim loại ⇒ n(SO₄²⁻ trong muối) = n(SO₂).`,
        `m = ${vn(a)} + 96 · ${vnT(nS)} ${bang(kq)} gam.`,
      ], `${CHOT_DAC} m(muối) = m(kim loại) + 96 · n(SO₂).`, [...KT_SA, 'bảo toàn khối lượng', 'bảo toàn electron'])
    },
  },
]

export const HO_LOP_11: readonly HoDe[] = [
  { ma: 'hang_so_can_bang', ten: 'Hằng số cân bằng Kc (nồng độ cân bằng, bảng biến thiên, cân bằng dị thể, tỉ khối, tính ngược lượng chất)', khoiChuong: 11, tuKhoa: /cân bằng|Kc|KC|⇌/, mau: HANG_SO_KC },
  { ma: 'sulfuric_acid', ten: 'Kim loại + H₂SO₄ loãng / đặc nóng / đặc nguội → thể tích khí, khối lượng muối', khoiChuong: 11, tuKhoa: /H₂SO₄|sulfuric/, mau: SULFURIC },
]
