// BỘ SINH BIẾN THỂ — CHƯƠNG CARBOHYDRATE (lớp 12): lên men rượu · thuỷ phân · tráng bạc · cellulose trinitrate/triacetate · gán số phản ứng chuyển hoá.
// Mỗi mẫu: số liệu đổi theo hạt giống (chất có thật, số kiểu đề thi), đáp số tính bằng mã, nhiễu Phần I từ LỖI HAY GẶP (quên/nhân ngược hiệu suất,
// quên hệ số, nhầm khối lượng mol, quên độ rượu/khối lượng riêng/hàm lượng…). Bộ giải độc lập ở tests/bien-the-sinh-0510.test.ts đọc lại chữ đề.
import { CHU_DKC, M, V_KHI, bang, hoi, lam, soHoc, soLe, vn, vnT, type BanSinh, type HoDe, type MauDe, type Nhieu, type Phan, type Rng } from './chung'

// ---------------------------------------------------------------- mã dạng
const LM_KL = 'CARBOHYDRATE.LEN_MEN.TINH_KHOI_LUONG'
const LM_TT = 'CARBOHYDRATE.LEN_MEN.TINH_THE_TICH'
const LM_HS = 'CARBOHYDRATE.LEN_MEN.TINH_HIEU_SUAT'
const LM_SS = 'CARBOHYDRATE.LEN_MEN.SO_SANH'
const TP_KL = 'CARBOHYDRATE.THUY_PHAN.TINH_KHOI_LUONG'
const TP_HS = 'CARBOHYDRATE.THUY_PHAN.TINH_HIEU_SUAT'
const TB_KL = 'CARBOHYDRATE.PHAN_UNG_TRANG_BAC.TINH_KHOI_LUONG'
const TB_SM = 'CARBOHYDRATE.PHAN_UNG_TRANG_BAC.TINH_SO_MOL'
const TB_PT = 'CARBOHYDRATE.PHAN_UNG_TRANG_BAC.TINH_PHAN_TRAM'
const UD_KL = 'CARBOHYDRATE.UNG_DUNG.TINH_KHOI_LUONG'
const UD_TT = 'CARBOHYDRATE.UNG_DUNG.TINH_THE_TICH'
const CT_KL = 'CARBOHYDRATE.CAU_TAO.TINH_KHOI_LUONG'

// ---------------------------------------------------------------- chất + số liệu
type Chat = 'glucose' | 'tinh_bot' | 'cellulose' | 'saccharose'
interface TtChat { ten: string; M: number; k: number }
/** k = số mol ethanol (cũng là số mol CO₂) từ 1 mol chất (1 mắt xích với polysaccharide). */
const CHAT: Readonly<Record<Chat, TtChat>> = {
  glucose: { ten: 'glucose', M: M('C₆H₁₂O₆'), k: 2 },
  tinh_bot: { ten: 'tinh bột', M: M('C₆H₁₀O₅'), k: 2 },
  cellulose: { ten: 'cellulose', M: M('C₆H₁₀O₅'), k: 2 },
  saccharose: { ten: 'saccharose', M: M('C₁₂H₂₂O₁₁'), k: 4 },
}
const ME = M('C₂H₅OH'), MG = M('C₆H₁₂O₆'), MCO2 = M('CO₂'), MCACO3 = M('CaCO₃'), MAG = M('Ag'), MTB = M('C₆H₁₀O₅'), MSAC = M('C₁₂H₂₂O₁₁')
const H_DEP = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95] as const
const SO_TRON = [10, 12, 15, 16, 18, 20, 24, 25, 27, 30, 32, 36, 40, 45, 48, 50, 54, 60, 64, 72, 75, 80, 81, 90, 96, 100, 108, 120, 125, 135, 144, 150,
  160, 162, 180, 200, 216, 225, 240, 250, 270, 300, 324, 342, 360, 400, 405, 450, 480, 500, 540, 600, 648, 684, 720, 750, 800, 900, 1000] as const
/** Khối lượng đề cho: nửa số lần là bội của M/100 (số mol tròn 0,01), nửa còn lại là số tròn như đề thật (đáp số phải làm tròn). */
function khoiLuong(r: Rng, Mc: number, lo: number, hi: number): number {
  const tron = SO_TRON.filter((x) => x >= lo && x <= hi)
  if (r.so() < 0.5 || !tron.length) return r.boi(lo, hi, lam(Mc / 100))
  return r.chon(tron)
}
interface NguyenLieu { chat: Chat; ten: string; p: readonly number[] }
const NGUYEN_LIEU: readonly NguyenLieu[] = [
  { chat: 'glucose', ten: 'quả nho chín', p: [10, 12, 15, 18, 20] },
  { chat: 'tinh_bot', ten: 'gạo', p: [70, 75, 80] },
  { chat: 'tinh_bot', ten: 'ngô hạt', p: [60, 65, 70] },
  { chat: 'tinh_bot', ten: 'sắn khô', p: [65, 70, 75] },
  { chat: 'tinh_bot', ten: 'khoai tây', p: [15, 20, 25] },
  { chat: 'cellulose', ten: 'mùn cưa', p: [40, 45, 50, 60] },
  { chat: 'saccharose', ten: 'rỉ đường', p: [50, 60, 70, 80] },
]
const DO_RUOU = [12, 13, 14, 29, 30, 35, 39, 40, 45, 46, 70, 90, 96] as const
const D_ETHANOL = [0.8, 0.789] as const
const loaiRuou = (x: number) => (x >= 70 ? 'cồn' : 'rượu')

/** Câu sơ đồ ghi SAU câu dữ kiện (glucose: không cần). */
function soDo(c: Chat): string {
  if (c === 'glucose') return ''
  if (c === 'saccharose') return ' Quá trình xảy ra theo sơ đồ: C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ (glucose) + C₆H₁₂O₆ (fructose); glucose và fructose đều lên men: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂.'
  return ' Quá trình xảy ra theo sơ đồ: (C₆H₁₀O₅)ₙ → C₆H₁₂O₆ → C₂H₅OH.'
}
const kyHieu = (c: Chat) => (c === 'glucose' ? 'C₆H₁₂O₆' : c === 'saccharose' ? 'C₁₂H₂₂O₁₁' : 'C₆H₁₀O₅')
const tenMol = (c: Chat) => (c === 'tinh_bot' || c === 'cellulose' ? `mắt xích C₆H₁₀O₅` : kyHieu(c))
const chotLenMen = (c: Chat) => (c === 'saccharose'
  ? 'Saccharose → glucose + fructose, cả hai lên men: 1 mol saccharose cho 4 mol C₂H₅OH và 4 mol CO₂.'
  : c === 'glucose' ? 'Lên men rượu: C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ — 1 mol glucose cho 2 mol ethanol.'
    : 'Mỗi mắt xích C₆H₁₀O₅ (M = 162) → 1 glucose → 2 C₂H₅OH + 2 CO₂.')
/** Nhiễu "sai hệ số" theo chất. */
function nhieuHeSo(c: Chat): { k: number; viSao: string } {
  if (c === 'saccharose') return { k: 2, viSao: 'chỉ tính glucose, quên fructose cũng lên men (lấy 1 mol saccharose cho 2 mol ethanol)' }
  return { k: 1, viSao: 'quên hệ số 2 (lấy 1 mol glucose cho 1 mol ethanol)' }
}
/** Nhiễu "nhầm khối lượng mol" theo chất. */
function nhieuM(c: Chat): { M: number; viSao: string } {
  if (c === 'glucose') return { M: 162, viSao: 'dùng nhầm M = 162 (mắt xích tinh bột) cho glucose' }
  if (c === 'saccharose') return { M: 180, viSao: 'dùng nhầm M = 180 (glucose) cho saccharose' }
  return { M: 180, viSao: 'dùng nhầm M = 180 (glucose) cho mắt xích C₆H₁₀O₅' }
}

// ================================================================ HỌ 1. LÊN MEN RƯỢU
const KT_LM = ['lên men rượu', 'hiệu suất phản ứng']

const LEN_MEN: MauDe[] = [
  {
    ma: 'len_men.biet.ethanol', dang: [LM_KL], muc: 'biet', tuKhoa: /ethanol|C₂H₅OH|rượu/,
    sinh(r, phan) {
      const a = khoiLuong(r, MG, 9, 360), n = a / MG, nE = 2 * n, x = nE * ME
      return soHoc(`Lên men ${vn(a)} gam glucose thành ethanol với hiệu suất 100%, thu được m gam C₂H₅OH. ${hoi(phan, 'm')}`, x, [
        { giaTri: n * ME, viSao: 'quên hệ số 2 trong C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂' },
        { giaTri: nE * MCO2, viSao: 'tính khối lượng CO₂ thay vì ethanol' },
        { giaTri: a / MTB * 2 * ME, viSao: 'dùng nhầm M = 162 (mắt xích tinh bột) cho glucose' },
        { giaTri: n * 4 * ME, viSao: 'dùng hệ số 4 (của saccharose) cho glucose' },
      ], `n(C₂H₅OH) = 2n(C₆H₁₂O₆) ⇒ m = 2 · ${vn(a)} : 180 · 46`, [
        `n(C₆H₁₂O₆) = ${vn(a)} : 180 ${bang(n)} mol.`,
        `C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ ⇒ n(C₂H₅OH) = 2 · ${vnT(n)} ${bang(nE)} mol.`,
        `m = ${vnT(nE)} · 46 ${bang(x)} gam.`,
      ], chotLenMen('glucose'), ['lên men rượu', 'tính theo phương trình hoá học'])
    },
  },
  {
    ma: 'len_men.biet.co2', dang: [LM_TT], muc: 'biet', tuKhoa: /CO₂|khí/,
    sinh(r, phan) {
      const a = khoiLuong(r, MG, 9, 360), n = a / MG, x = 2 * n * V_KHI
      return soHoc(`Lên men ${vn(a)} gam glucose thành ethanol với hiệu suất 100%, thu được V lít khí CO₂ ${CHU_DKC}. ${hoi(phan, 'V')}`, x, [
        { giaTri: n * V_KHI, viSao: 'quên hệ số 2 trong C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂' },
        { giaTri: 2 * n * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ) thay vì 24,79 L/mol ở đkc' },
        { giaTri: a / MTB * 2 * V_KHI, viSao: 'dùng nhầm M = 162 (mắt xích tinh bột) cho glucose' },
        { giaTri: 4 * n * V_KHI, viSao: 'dùng hệ số 4 (của saccharose) cho glucose' },
      ], `n(CO₂) = 2n(C₆H₁₂O₆) ⇒ V = 2 · ${vn(a)} : 180 · 24,79`, [
        `n(C₆H₁₂O₆) = ${vn(a)} : 180 ${bang(n)} mol ⇒ n(CO₂) = 2 · ${vnT(n)} ${bang(2 * n)} mol.`,
        `V = ${vnT(2 * n)} · 24,79 ${bang(x)} lít.`,
      ], 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂; ở đkc 1 mol khí chiếm 24,79 lít.', ['lên men rượu', 'thể tích khí ở đkc'])
    },
  },
  {
    ma: 'len_men.biet.can_glucose', dang: [LM_KL], muc: 'biet', tuKhoa: /cần|điều chế/,
    sinh(r, phan) {
      const b = khoiLuong(r, ME, 4.6, 184), nE = b / ME, n = nE / 2, x = n * MG
      return soHoc(`Để thu được ${vn(b)} gam ethanol bằng cách lên men glucose với hiệu suất 100%, cần dùng m gam glucose. ${hoi(phan, 'm')}`, x, [
        { giaTri: nE * 2 * MG, viSao: 'nhân 2 thay vì chia 2 khi đổi từ ethanol về glucose' },
        { giaTri: nE * MG, viSao: 'quên hệ số 2 (lấy 1 mol ethanol từ 1 mol glucose)' },
        { giaTri: n * MTB, viSao: 'dùng nhầm M = 162 (mắt xích tinh bột) cho glucose' },
        { giaTri: b / MCO2 / 2 * MG, viSao: 'dùng nhầm M = 44 (CO₂) cho ethanol' },
      ], `n(glucose) = n(C₂H₅OH) : 2 ⇒ m = ${vn(b)} : 46 : 2 · 180`, [
        `n(C₂H₅OH) = ${vn(b)} : 46 ${bang(nE)} mol.`,
        `C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ ⇒ n(C₆H₁₂O₆) = ${vnT(nE)} : 2 ${bang(n)} mol.`,
        `m = ${vnT(n)} · 180 ${bang(x)} gam.`,
      ], chotLenMen('glucose'), ['lên men rượu', 'tính ngược nguyên liệu'])
    },
  },
  {
    ma: 'len_men.biet.hieu_suat', dang: [LM_HS], muc: 'biet', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const a = r.boi(18, 360, 1.8), H = r.chon(H_DEP), lt = a / MG * 2 * ME, b = lam(lt * H / 100)
      if (soLe(b) > 2) return null
      return soHoc(`Lên men ${vn(a)} gam glucose, thu được ${vn(b)} gam ethanol. Hiệu suất của quá trình lên men là H%. ${hoi(phan, 'H')}`, b / lt * 100, [
        { giaTri: b / (a / MTB * 2 * ME) * 100, viSao: 'dùng nhầm M = 162 cho glucose khi tính lượng ethanol lí thuyết' },
        { giaTri: b / (a / MG * 2 * MCO2) * 100, viSao: 'dùng M = 44 (CO₂) khi tính khối lượng ethanol lí thuyết' },
        { giaTri: b / (a / MG * 4 * ME) * 100, viSao: 'dùng hệ số 4 (của saccharose) cho glucose' },
        { giaTri: 100 - H, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
        { giaTri: b / (a / MG * ME) * 100, viSao: 'quên hệ số 2 (lấy 1 mol glucose cho 1 mol ethanol)' },
      ], `H = m thực tế : m lí thuyết = ${vn(b)} : ${vnT(lt)} · 100%`, [
        `n(C₆H₁₂O₆) = ${vn(a)} : 180 ${bang(a / MG)} mol ⇒ n(C₂H₅OH) lí thuyết = ${vnT(2 * a / MG)} mol.`,
        `m(C₂H₅OH) lí thuyết = ${vnT(2 * a / MG)} · 46 ${bang(lt)} gam.`,
        `H = ${vn(b)} : ${vnT(lt)} · 100% ${bang(b / lt * 100)}%.`,
      ], 'Hiệu suất = lượng thực tế : lượng lí thuyết × 100%; lí thuyết tính theo C₆H₁₂O₆ → 2C₂H₅OH.', ['lên men rượu', 'tính hiệu suất'], { chinhXac: true, toiDa: 100 })
    },
  },
  {
    ma: 'len_men.hieu.ethanol', dang: [LM_KL], muc: 'hieu', tuKhoa: /ethanol|C₂H₅OH/,
    sinh(r, phan) {
      const c = r.chon<Chat>(['glucose', 'tinh_bot', 'saccharose']), t = CHAT[c], u = r.chon(['gam', 'kg'] as const), mol = u === 'kg' ? 'kmol' : 'mol'
      const a = khoiLuong(r, t.M, 10, u === 'kg' ? 1000 : 500), H = r.chon(H_DEP)
      const f = (o: { M?: number; k?: number; h?: number; ME?: number }) => a / (o.M ?? t.M) * (o.k ?? t.k) * (o.ME ?? ME) * (o.h ?? H / 100)
      const n = a / t.M, nLt = n * t.k, x = f({})
      const hs = c === 'glucose' ? `hiệu suất ${H}%` : `hiệu suất cả quá trình ${H}%`
      const sk = nhieuHeSo(c), sm = nhieuM(c)
      return soHoc(`Lên men ${vn(a)} ${u} ${t.ten} với ${hs}, thu được m ${u} ethanol.${soDo(c)} ${hoi(phan, 'm')}`, x, [
        { giaTri: f({ h: 1 }), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: f({ h: 100 / H }), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: f({ k: sk.k }), viSao: sk.viSao },
        { giaTri: f({ M: sm.M }), viSao: sm.viSao },
        { giaTri: f({ ME: MCO2 }), viSao: 'tính khối lượng CO₂ thay vì ethanol' },
      ], `m = ${vn(a)} : ${t.M} · ${t.k} · 46 · ${H}%`, [
        `n(${tenMol(c)}) = ${vn(a)} : ${t.M} ${bang(n)} ${mol}.`,
        `n(C₂H₅OH) lí thuyết = ${t.k} · ${vnT(n)} ${bang(nLt)} ${mol}; thực tế = ${vnT(nLt)} · ${H}% ${bang(nLt * H / 100)} ${mol}.`,
        `m = ${vnT(nLt * H / 100)} · 46 ${bang(x)} ${u}.`,
      ], chotLenMen(c), KT_LM)
    },
  },
  {
    ma: 'len_men.hieu.co2', dang: [LM_TT], muc: 'hieu', tuKhoa: /CO₂|khí/,
    sinh(r, phan) {
      const c = r.chon<Chat>(['glucose', 'tinh_bot', 'saccharose']), t = CHAT[c]
      const a = khoiLuong(r, t.M, 9, 400), H = r.chon(H_DEP)
      const f = (o: { M?: number; k?: number; h?: number; v?: number }) => a / (o.M ?? t.M) * (o.k ?? t.k) * (o.v ?? V_KHI) * (o.h ?? H / 100)
      const n = a / t.M, nC = n * t.k * H / 100, x = f({})
      const hs = c === 'glucose' ? `hiệu suất ${H}%` : `hiệu suất cả quá trình ${H}%`
      const sk = nhieuHeSo(c), sm = nhieuM(c)
      return soHoc(`Lên men ${vn(a)} gam ${t.ten} với ${hs}, thu được V lít khí CO₂ ${CHU_DKC}.${soDo(c)} ${hoi(phan, 'V')}`, x, [
        { giaTri: f({ h: 1 }), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: f({ h: 100 / H }), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: f({ v: 22.4 }), viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ) thay vì 24,79 L/mol ở đkc' },
        { giaTri: f({ k: sk.k }), viSao: sk.viSao.replace(/ethanol/g, 'CO₂') },
        { giaTri: f({ M: sm.M }), viSao: sm.viSao },
      ], `V = ${vn(a)} : ${t.M} · ${t.k} · ${H}% · 24,79`, [
        `n(${tenMol(c)}) = ${vn(a)} : ${t.M} ${bang(n)} mol ⇒ n(CO₂) = ${t.k} · ${vnT(n)} · ${H}% ${bang(nC)} mol.`,
        `V = ${vnT(nC)} · 24,79 ${bang(x)} lít.`,
      ], chotLenMen(c), [...KT_LM, 'thể tích khí ở đkc'])
    },
  },
  {
    ma: 'len_men.hieu.ket_tua', dang: [LM_KL], muc: 'hieu', tuKhoa: /Ca\(OH\)₂|kết tủa|CaCO₃/,
    sinh(r, phan) {
      const c = r.chon<Chat>(['glucose', 'tinh_bot', 'saccharose']), t = CHAT[c]
      const a = khoiLuong(r, t.M, 9, 400), H = r.chon(H_DEP)
      const f = (o: { M?: number; k?: number; h?: number; mk?: number }) => a / (o.M ?? t.M) * (o.k ?? t.k) * (o.h ?? H / 100) * (o.mk ?? MCACO3)
      const n = a / t.M, nC = n * t.k * H / 100, x = f({})
      const hs = c === 'glucose' ? `hiệu suất ${H}%` : `hiệu suất cả quá trình ${H}%`
      const sk = nhieuHeSo(c), sm = nhieuM(c)
      return soHoc(`Lên men ${vn(a)} gam ${t.ten} với ${hs}.${soDo(c)} Hấp thụ toàn bộ khí CO₂ sinh ra vào dung dịch Ca(OH)₂ dư, thu được m gam kết tủa. ${hoi(phan, 'm')}`, x, [
        { giaTri: f({ h: 1 }), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: f({ h: 100 / H }), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: f({ k: sk.k }), viSao: sk.viSao.replace(/ethanol/g, 'CO₂') },
        { giaTri: f({ mk: MCO2 }), viSao: 'tính khối lượng CO₂ (M = 44) thay vì CaCO₃ (M = 100)' },
        { giaTri: f({ M: sm.M }), viSao: sm.viSao },
      ], `n(CaCO₃) = n(CO₂) = ${vn(a)} : ${t.M} · ${t.k} · ${H}% ⇒ m = n · 100`, [
        `n(${tenMol(c)}) = ${vn(a)} : ${t.M} ${bang(n)} mol ⇒ n(CO₂) = ${t.k} · ${vnT(n)} · ${H}% ${bang(nC)} mol.`,
        `CO₂ + Ca(OH)₂ dư → CaCO₃ + H₂O ⇒ n(CaCO₃) = n(CO₂) ⇒ m = ${vnT(nC)} · 100 ${bang(x)} gam.`,
      ], `${chotLenMen(c)} Ca(OH)₂ dư ⇒ n(CaCO₃) = n(CO₂).`, [...KT_LM, 'CO₂ tác dụng với dung dịch kiềm dư'])
    },
  },
  {
    ma: 'len_men.hieu.tu_ket_tua', dang: [LM_KL], muc: 'hieu', tuKhoa: /Ca\(OH\)₂|kết tủa|CaCO₃/,
    sinh(r, phan) {
      const c = r.chon<Chat>(['glucose', 'tinh_bot']), t = CHAT[c]
      const ck = r.boi(5, 100, 2.5), H = r.chon(H_DEP)
      const f = (o: { M?: number; k?: number; h?: number }) => ck / MCACO3 / (o.k ?? t.k) / (o.h ?? H / 100) * (o.M ?? t.M)
      const nC = ck / MCACO3, n = nC / t.k, x = f({})
      const hs = c === 'glucose' ? `hiệu suất ${H}%` : `hiệu suất cả quá trình ${H}%`
      const sm = nhieuM(c)
      return soHoc(`Lên men m gam ${t.ten} với ${hs}.${soDo(c)} Hấp thụ toàn bộ khí CO₂ sinh ra vào dung dịch Ca(OH)₂ dư, thu được ${vn(ck)} gam kết tủa. ${hoi(phan, 'm')}`, x, [
        { giaTri: f({ h: (H / 100) ** -1 }) , viSao: `nhân hiệu suất ${H}% thay vì chia (tính ngược nguyên liệu phải chia)` },
        { giaTri: f({ h: 1 }), viSao: `quên chia hiệu suất ${H}%` },
        { giaTri: f({ k: 1 / t.k }), viSao: `nhân ${t.k} thay vì chia ${t.k} khi đổi từ CO₂ về ${t.ten}` },
        { giaTri: f({ M: sm.M }), viSao: sm.viSao },
      ], `n(CO₂) = n(CaCO₃) = ${vn(ck)} : 100; m = n(CO₂) : ${t.k} : ${H}% · ${t.M}`, [
        `n(CO₂) = n(CaCO₃) = ${vn(ck)} : 100 ${bang(nC)} mol.`,
        `n(${tenMol(c)}) phản ứng = ${vnT(nC)} : ${t.k} ${bang(n)} mol; cần dùng = ${vnT(n)} : ${H}% ${bang(n / (H / 100))} mol.`,
        `m = ${vnT(n / (H / 100))} · ${t.M} ${bang(x)} gam.`,
      ], `${chotLenMen(c)} Tính ngược lượng nguyên liệu thì CHIA cho hiệu suất.`, [...KT_LM, 'tính ngược nguyên liệu'])
    },
  },
  {
    ma: 'len_men.hieu.hieu_suat', dang: [LM_HS], muc: 'hieu', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const c = r.chon<Chat>(['glucose', 'tinh_bot', 'saccharose']), t = CHAT[c]
      const a = r.boi(t.M / 10, t.M * 2, lam(t.M / 100)), H = r.chon(H_DEP), n = a / t.M, ck = lam(n * t.k * H / 100 * MCACO3)
      if (soLe(ck) > 2) return null
      const lt = n * t.k, hsTt = ck / MCACO3 / lt * 100, sm = nhieuM(c)
      return soHoc(`Lên men ${vn(a)} gam ${t.ten}.${soDo(c)} Hấp thụ toàn bộ khí CO₂ sinh ra vào dung dịch Ca(OH)₂ dư, thu được ${vn(ck)} gam kết tủa. Hiệu suất của quá trình lên men là H%. ${hoi(phan, 'H')}`, hsTt, [
        { giaTri: ck / MCACO3 / n * 100, viSao: `quên hệ số ${t.k} (lấy 1 mol ${t.ten} cho 1 mol CO₂)` },
        { giaTri: ck / MCO2 / lt * 100, viSao: 'dùng M = 44 (CO₂) cho khối lượng kết tủa' },
        { giaTri: ck / MCACO3 / (a / sm.M * t.k) * 100, viSao: sm.viSao },
        { giaTri: hsTt / 2, viSao: `lấy 1 mol ${t.ten} cho ${2 * t.k} mol CO₂ (nhân đôi hệ số)` },
        { giaTri: 100 - hsTt, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
      ], `H = n(CO₂) thực tế : n(CO₂) lí thuyết = ${vnT(ck / MCACO3)} : ${vnT(lt)} · 100%`, [
        `n(CO₂) thực tế = n(CaCO₃) = ${vn(ck)} : 100 ${bang(ck / MCACO3)} mol.`,
        `n(CO₂) lí thuyết = ${t.k} · n(${tenMol(c)}) = ${t.k} · ${vn(a)} : ${t.M} ${bang(lt)} mol.`,
        `H = ${vnT(ck / MCACO3)} : ${vnT(lt)} · 100% ${bang(hsTt)}%.`,
      ], `${chotLenMen(c)} H = lượng thực tế : lượng lí thuyết × 100%.`, [...KT_LM, 'tính hiệu suất'], { chinhXac: true, toiDa: 100 })
    },
  },
  {
    ma: 'len_men.van_dung.the_tich_ruou', dang: [LM_TT], muc: 'van_dung', tuKhoa: /rượu|cồn|°/,
    sinh(r, phan) {
      const nl = r.chon(NGUYEN_LIEU), t = CHAT[nl.chat], p = r.chon(nl.p), A = r.chon([10, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500])
      const H = r.chon(H_DEP), x = r.chon(DO_RUOU), D = r.chon(D_ETHANOL), loai = loaiRuou(x)
      const f = (o: { p?: number; h?: number; k?: number; x?: number; D?: number }) => A * (o.p ?? p) / 100 / t.M * (o.k ?? t.k) * (o.h ?? H / 100) * ME / (o.D ?? D) / ((o.x ?? x) / 100)
      const mC = A * p / 100, n = mC / t.M, nE = n * t.k * H / 100, mE = nE * ME, vE = mE / D, kq = f({})
      const sk = nhieuHeSo(nl.chat)
      return soHoc(`Lên men ${vn(A)} kg ${nl.ten} (chứa ${p}% ${t.ten} về khối lượng, còn lại là tạp chất không lên men) để sản xuất ${loai} ${x}°.${soDo(nl.chat)} Biết hiệu suất cả quá trình là ${H}% và khối lượng riêng của ethanol là ${vn(D)} g/mL. Thể tích ${loai} ${x}° thu được là V lít. ${hoi(phan, 'V')}`, kq, [
        { giaTri: f({ h: 1 }), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: f({ p: 100 }), viSao: `quên hàm lượng ${p}% (coi cả ${vn(A)} kg ${nl.ten} là ${t.ten})` },
        { giaTri: f({ x: 100 }), viSao: `dừng ở thể tích ethanol nguyên chất, quên chia cho độ ${loai} ${x}°` },
        { giaTri: f({ x: 10000 / x }), viSao: `nhân với ${x}% thay vì chia cho độ ${loai}` },
        { giaTri: f({ D: 1 }), viSao: 'quên khối lượng riêng (coi 1 kg ethanol chiếm 1 lít)' },
        { giaTri: f({ k: sk.k }), viSao: sk.viSao },
      ], `V = ${vn(A)} · ${p}% : ${t.M} · ${t.k} · ${H}% · 46 : ${vn(D)} : ${x}%`, [
        `m(${t.ten}) = ${vn(A)} · ${p}% ${bang(mC)} kg ⇒ n(${tenMol(nl.chat)}) = ${vnT(mC)} : ${t.M} ${bang(n)} kmol.`,
        `n(C₂H₅OH) = ${t.k} · ${vnT(n)} · ${H}% ${bang(nE)} kmol ⇒ m(C₂H₅OH) = ${vnT(nE)} · 46 ${bang(mE)} kg.`,
        `V(C₂H₅OH) = ${vnT(mE)} : ${vn(D)} ${bang(vE)} lít ⇒ V(${loai} ${x}°) = ${vnT(vE)} : ${x}% ${bang(kq)} lít.`,
      ], `Độ ${loai} = % thể tích ethanol; V(ethanol) = m : D; ${chotLenMen(nl.chat)}`, [...KT_LM, 'độ rượu và khối lượng riêng'])
    },
  },
  {
    ma: 'len_men.van_dung.can_nguyen_lieu', dang: [LM_KL], muc: 'van_dung', tuKhoa: /cần|gạo|ngô|sắn|nho|mùn cưa|rỉ đường/,
    sinh(r, phan) {
      const nl = r.chon(NGUYEN_LIEU), t = CHAT[nl.chat], p = r.chon(nl.p), V = r.chon([5, 10, 15, 20, 25, 40, 50, 100, 120, 150, 200, 250, 500])
      const H = r.chon(H_DEP), x = r.chon(DO_RUOU), D = r.chon(D_ETHANOL), loai = loaiRuou(x)
      const f = (o: { p?: number; h?: number; k?: number; x?: number }) => V * (o.x ?? x) / 100 * D / ME / (o.k ?? t.k) / (o.h ?? H / 100) * t.M / ((o.p ?? p) / 100)
      const vE = V * x / 100, mE = vE * D, nE = mE / ME, n = nE / t.k, nCan = n / (H / 100), mC = nCan * t.M, kq = f({})
      return soHoc(`Để sản xuất ${vn(V)} lít ${loai} ${x}° cần dùng m kg ${nl.ten} (chứa ${p}% ${t.ten} về khối lượng, còn lại là tạp chất không lên men).${soDo(nl.chat)} Biết hiệu suất cả quá trình là ${H}% và khối lượng riêng của ethanol là ${vn(D)} g/mL. ${hoi(phan, 'm')}`, kq, [
        { giaTri: f({ h: (H / 100) ** -1 }), viSao: `nhân hiệu suất ${H}% thay vì chia (tính ngược nguyên liệu phải chia)` },
        { giaTri: f({ h: 1 }), viSao: `quên chia hiệu suất ${H}%` },
        { giaTri: f({ p: 100 }), viSao: `quên hàm lượng ${p}% (chỉ tính khối lượng ${t.ten})` },
        { giaTri: f({ x: 100 }), viSao: `coi ${vn(V)} lít ${loai} ${x}° là ethanol nguyên chất` },
        { giaTri: f({ k: 1 / t.k }), viSao: `nhân ${t.k} thay vì chia ${t.k} khi đổi từ ethanol về ${t.ten}` },
      ], `m = ${vn(V)} · ${x}% · ${vn(D)} : 46 : ${t.k} : ${H}% · ${t.M} : ${p}%`, [
        `V(C₂H₅OH) = ${vn(V)} · ${x}% ${bang(vE)} lít ⇒ m(C₂H₅OH) = ${vnT(vE)} · ${vn(D)} ${bang(mE)} kg ⇒ n ${bang(nE)} kmol.`,
        `n(${tenMol(nl.chat)}) phản ứng = ${vnT(nE)} : ${t.k} ${bang(n)} kmol; cần dùng = ${vnT(n)} : ${H}% ${bang(nCan)} kmol ⇒ m(${t.ten}) ${bang(mC)} kg.`,
        `m(${nl.ten}) = ${vnT(mC)} : ${p}% ${bang(kq)} kg.`,
      ], `Tính ngược nguyên liệu: chia hiệu suất và chia hàm lượng; ${chotLenMen(nl.chat)}`, [...KT_LM, 'độ rượu và khối lượng riêng', 'tính ngược nguyên liệu'])
    },
  },
  {
    ma: 'len_men.van_dung.hieu_suat', dang: [LM_HS], muc: 'van_dung', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const nl = r.chon(NGUYEN_LIEU), t = CHAT[nl.chat], p = r.chon(nl.p), A = r.chon([10, 20, 25, 50, 100, 150, 200, 250, 500])
      const H = r.chon(H_DEP), x = r.chon(DO_RUOU), D = r.chon(D_ETHANOL), loai = loaiRuou(x)
      const nLt = A * p / 100 / t.M * t.k, Vthat = nLt * H / 100 * ME / D / (x / 100)
      const V = lam(Math.round(Vthat * 10) / 10)
      if (V <= 0) return null
      const nTt = V * x / 100 * D / ME, kq = nTt / nLt * 100
      return soHoc(`Lên men ${vn(A)} kg ${nl.ten} (chứa ${p}% ${t.ten} về khối lượng, còn lại là tạp chất không lên men), thu được ${vn(V)} lít ${loai} ${x}°.${soDo(nl.chat)} Biết khối lượng riêng của ethanol là ${vn(D)} g/mL. Hiệu suất cả quá trình là H%. ${hoi(phan, 'H')}`, kq, [
        { giaTri: nTt / (A / t.M * t.k) * 100, viSao: `quên hàm lượng ${p}% khi tính lượng lí thuyết` },
        { giaTri: (V * x / 100 / ME) / nLt * 100, viSao: 'quên khối lượng riêng (coi 1 lít ethanol nặng 1 kg)' },
        { giaTri: (V * D / ME) / nLt * 100, viSao: `coi ${vn(V)} lít ${loai} là ethanol nguyên chất (quên độ ${loai})` },
        { giaTri: nTt / (nLt / t.k) * 100, viSao: `quên hệ số ${t.k} (lấy 1 mol ${t.ten} cho 1 mol ethanol)` },
        { giaTri: kq / 2, viSao: `lấy 1 mol ${t.ten} cho ${2 * t.k} mol ethanol (nhân đôi hệ số)` },
        { giaTri: nTt / (A * p / 100 / nhieuM(nl.chat).M * t.k) * 100, viSao: nhieuM(nl.chat).viSao },
      ], `H = n(C₂H₅OH) thu được : n(C₂H₅OH) lí thuyết = ${vnT(nTt)} : ${vnT(nLt)} · 100%`, [
        `n(C₂H₅OH) thu được = ${vn(V)} · ${x}% · ${vn(D)} : 46 ${bang(nTt)} kmol.`,
        `n(C₂H₅OH) lí thuyết = ${t.k} · ${vn(A)} · ${p}% : ${t.M} ${bang(nLt)} kmol.`,
        `H = ${vnT(nTt)} : ${vnT(nLt)} · 100% ${bang(kq)}%.`,
      ], `H = lượng thu được : lượng lí thuyết; ${chotLenMen(nl.chat)}`, [...KT_LM, 'độ rượu và khối lượng riêng', 'tính hiệu suất'], { toiDa: 100 })
    },
  },
  {
    ma: 'len_men.van_dung.hai_hieu_suat', dang: [LM_KL], muc: 'van_dung', tuKhoa: /thuỷ phân|thủy phân/,
    sinh(r, phan) {
      const c = r.chon<Chat>(['tinh_bot', 'cellulose']), t = CHAT[c], a = khoiLuong(r, MTB, 16, 1000)
      const H1 = r.chon(H_DEP), H2 = r.chon(H_DEP)
      const f = (o: { h1?: number; h2?: number; k?: number; M?: number }) => a / (o.M ?? MTB) * (o.h1 ?? H1 / 100) * (o.k ?? 2) * (o.h2 ?? H2 / 100) * ME
      const n = a / MTB, nG = n * H1 / 100, nE = nG * 2 * H2 / 100, kq = f({})
      return soHoc(`Thuỷ phân ${vn(a)} kg ${t.ten} với hiệu suất ${H1}%, toàn bộ glucose thu được đem lên men thành ethanol với hiệu suất ${H2}%. Khối lượng ethanol thu được là m kg. ${hoi(phan, 'm')}`, kq, [
        { giaTri: f({ h2: 1 }), viSao: `chỉ nhân hiệu suất thuỷ phân ${H1}%, quên hiệu suất lên men ${H2}%` },
        { giaTri: f({ h1: 1 }), viSao: `chỉ nhân hiệu suất lên men ${H2}%, quên hiệu suất thuỷ phân ${H1}%` },
        { giaTri: f({ k: 1 }), viSao: 'quên hệ số 2 trong C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂' },
        { giaTri: f({ M: MG }), viSao: 'dùng nhầm M = 180 (glucose) cho mắt xích C₆H₁₀O₅' },
        { giaTri: f({ h1: 1, h2: 1 }), viSao: 'quên cả hai hiệu suất' },
      ], `m = ${vn(a)} : 162 · ${H1}% · 2 · ${H2}% · 46`, [
        `n(C₆H₁₀O₅) = ${vn(a)} : 162 ${bang(n)} kmol ⇒ n(C₆H₁₂O₆) = ${vnT(n)} · ${H1}% ${bang(nG)} kmol.`,
        `n(C₂H₅OH) = 2 · ${vnT(nG)} · ${H2}% ${bang(nE)} kmol ⇒ m = ${vnT(nE)} · 46 ${bang(kq)} kg.`,
      ], 'Quá trình nhiều giai đoạn: nhân lần lượt hiệu suất từng giai đoạn; (C₆H₁₀O₅)ₙ → nC₆H₁₂O₆ → 2nC₂H₅OH.', [...KT_LM, 'hiệu suất nhiều giai đoạn'])
    },
  },
]

// ================================================================ HỌ 2. THUỶ PHÂN CARBOHYDRATE
type ChatTp = 'tinh_bot' | 'cellulose' | 'saccharose'
const ttTp = (c: ChatTp) => CHAT[c]
const NL_TP: readonly { chat: ChatTp; ten: string; p: readonly number[] }[] = [
  { chat: 'tinh_bot', ten: 'gạo', p: [70, 75, 80] },
  { chat: 'tinh_bot', ten: 'sắn khô', p: [65, 70, 75] },
  { chat: 'tinh_bot', ten: 'khoai tây', p: [15, 20, 25] },
  { chat: 'cellulose', ten: 'mùn cưa', p: [40, 45, 50, 60] },
  { chat: 'saccharose', ten: 'nước mía', p: [12, 13, 14, 15] },
]
const chotTp = (c: ChatTp) => (c === 'saccharose'
  ? 'C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ (glucose) + C₆H₁₂O₆ (fructose): 342 gam saccharose cho 180 gam glucose.'
  : '(C₆H₁₀O₅)ₙ + nH₂O → nC₆H₁₂O₆: mỗi mắt xích 162 gam cho 180 gam glucose.')
const ptTp = (c: ChatTp) => (c === 'saccharose' ? 'C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ + C₆H₁₂O₆' : '(C₆H₁₀O₅)ₙ + nH₂O → nC₆H₁₂O₆')
/** Nhiễu riêng của thuỷ phân (tính theo hệ số khối lượng glucose / chất). */
function nhieuTp(c: ChatTp): { he: number; viSao: string }[] {
  if (c === 'saccharose') return [
    { he: 360 / MSAC, viSao: 'tính gộp cả fructose vào khối lượng glucose' },
    { he: 1, viSao: 'coi khối lượng glucose bằng khối lượng saccharose' },
    { he: 0.5, viSao: 'lấy một nửa khối lượng saccharose làm khối lượng glucose' },
  ]
  return [
    { he: 1, viSao: 'giữ nguyên khối lượng (quên H₂O cộng vào mỗi mắt xích: 162 → 180)' },
    { he: MTB / MG, viSao: 'đổi ngược tỉ lệ (nhân 162 : 180 thay vì 180 : 162)' },
    { he: 2 * MG / MTB, viSao: 'cho mỗi mắt xích tạo 2 glucose' },
  ]
}
const KT_TP = ['thuỷ phân carbohydrate', 'hiệu suất phản ứng']

const THUY_PHAN: MauDe[] = [
  {
    ma: 'thuy_phan.biet.glucose', dang: [TP_KL], muc: 'biet',
    sinh(r, phan) {
      const c = r.chon<ChatTp>(['tinh_bot', 'cellulose', 'saccharose']), t = ttTp(c), u = c === 'saccharose' ? 'gam' : r.chon(['gam', 'kg'] as const)
      const mol = u === 'kg' ? 'kmol' : 'mol', a = khoiLuong(r, t.M, 10, 500), n = a / t.M, kq = n * MG
      const sp = c === 'saccharose' ? `thu được dung dịch chứa m ${u} glucose` : `thu được m ${u} glucose`
      return soHoc(`Thuỷ phân hoàn toàn ${vn(a)} ${u} ${t.ten} (xúc tác acid, đun nóng), ${sp}. ${hoi(phan, 'm')}`, kq,
        nhieuTp(c).map((x) => ({ giaTri: a * x.he, viSao: x.viSao })),
        `n(glucose) = n(${tenMol(c)}) ⇒ m = ${vn(a)} : ${t.M} · 180`, [
          `${ptTp(c)}.`,
          `n(glucose) = n(${tenMol(c)}) = ${vn(a)} : ${t.M} ${bang(n)} ${mol} ⇒ m = ${vnT(n)} · 180 ${bang(kq)} ${u}.`,
        ], chotTp(c), ['thuỷ phân carbohydrate'])
    },
  },
  {
    ma: 'thuy_phan.biet.hieu_suat', dang: [TP_HS], muc: 'biet', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const c = r.chon<ChatTp>(['tinh_bot', 'cellulose', 'saccharose']), t = ttTp(c), a = r.boi(t.M / 10, t.M * 3, lam(t.M / 100))
      const H = r.chon(H_DEP), lt = a / t.M * MG, b = lam(lt * H / 100)
      if (soLe(b) > 2) return null
      return soHoc(`Thuỷ phân ${vn(a)} gam ${t.ten} (xúc tác acid, đun nóng), thu được ${vn(b)} gam glucose. Hiệu suất của phản ứng thuỷ phân là H%. ${hoi(phan, 'H')}`, b / lt * 100,
        [
          ...nhieuTp(c).map((x) => ({ giaTri: b / (a * x.he) * 100, viSao: x.viSao })),
          { giaTri: 100 - H, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
        ], `H = ${vn(b)} : ${vnT(lt)} · 100%`, [
          `m(glucose) lí thuyết = ${vn(a)} : ${t.M} · 180 ${bang(lt)} gam.`,
          `H = ${vn(b)} : ${vnT(lt)} · 100% ${bang(b / lt * 100)}%.`,
        ], `${chotTp(c)} H = thực tế : lí thuyết × 100%.`, [...KT_TP, 'tính hiệu suất'], { chinhXac: true, toiDa: 100 })
    },
  },
  {
    ma: 'thuy_phan.hieu.glucose', dang: [TP_KL], muc: 'hieu',
    sinh(r, phan) {
      const c = r.chon<ChatTp>(['tinh_bot', 'cellulose', 'saccharose']), t = ttTp(c), u = r.chon(['gam', 'kg'] as const), mol = u === 'kg' ? 'kmol' : 'mol'
      const a = khoiLuong(r, t.M, 10, 1000), H = r.chon(H_DEP), n = a / t.M, kq = n * MG * H / 100
      return soHoc(`Thuỷ phân ${vn(a)} ${u} ${t.ten} với hiệu suất ${H}% (xúc tác acid, đun nóng), thu được m ${u} glucose. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * MG, viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: n * MG / (H / 100), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        ...nhieuTp(c).map((x) => ({ giaTri: a * x.he * H / 100, viSao: x.viSao })),
      ], `m = ${vn(a)} : ${t.M} · 180 · ${H}%`, [
        `${ptTp(c)}.`,
        `n(glucose) = ${vn(a)} : ${t.M} · ${H}% ${bang(n * H / 100)} ${mol} ⇒ m = ${vnT(n * H / 100)} · 180 ${bang(kq)} ${u}.`,
      ], chotTp(c), KT_TP)
    },
  },
  {
    ma: 'thuy_phan.hieu.can_chat', dang: [TP_KL], muc: 'hieu', tuKhoa: /cần|để thu được/,
    sinh(r, phan) {
      const c = r.chon<ChatTp>(['tinh_bot', 'cellulose', 'saccharose']), t = ttTp(c), u = r.chon(['gam', 'kg'] as const), mol = u === 'kg' ? 'kmol' : 'mol'
      const b = khoiLuong(r, MG, 9, 900), H = r.chon(H_DEP), nG = b / MG, kq = nG * t.M / (H / 100)
      return soHoc(`Để thu được ${vn(b)} ${u} glucose cần thuỷ phân m ${u} ${t.ten} với hiệu suất ${H}%. ${hoi(phan, 'm')}`, kq, [
        { giaTri: nG * t.M * H / 100, viSao: `nhân hiệu suất ${H}% thay vì chia (tính ngược nguyên liệu phải chia)` },
        { giaTri: nG * t.M, viSao: `quên chia hiệu suất ${H}%` },
        ...(c === 'saccharose'
          ? [{ giaTri: b / 360 * t.M / (H / 100), viSao: 'tính gộp fructose, cho 1 mol saccharose tạo 2 mol glucose' }]
          : [{ giaTri: b * MG / MTB / (H / 100), viSao: 'đổi ngược tỉ lệ (nhân 180 : 162 thay vì 162 : 180)' }, { giaTri: b / (H / 100), viSao: 'coi khối lượng tinh bột bằng khối lượng glucose' }]),
      ], `m = ${vn(b)} : 180 · ${t.M} : ${H}%`, [
        `n(glucose) = ${vn(b)} : 180 ${bang(nG)} ${mol} ⇒ n(${tenMol(c)}) phản ứng = ${vnT(nG)} ${mol}.`,
        `m = ${vnT(nG)} · ${t.M} : ${H}% ${bang(kq)} ${u}.`,
      ], `${chotTp(c)} Tính ngược nguyên liệu thì chia hiệu suất.`, [...KT_TP, 'tính ngược nguyên liệu'])
    },
  },
  {
    ma: 'thuy_phan.hieu.hieu_suat', dang: [TP_HS], muc: 'hieu', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const c = r.chon<ChatTp>(['tinh_bot', 'cellulose', 'saccharose']), t = ttTp(c), A = r.chon([10, 20, 25, 50, 100, 150, 200, 250, 300, 400, 500])
      const H = r.chon(H_DEP), lt = A / t.M * MG, b = lam(Math.round(lt * H / 100 * 10) / 10)
      const kq = b / lt * 100
      return soHoc(`Thuỷ phân ${vn(A)} kg ${t.ten} (xúc tác acid, đun nóng), thu được ${vn(b)} kg glucose. Hiệu suất của phản ứng thuỷ phân là H%. ${hoi(phan, 'H')}`, kq,
        [
          ...nhieuTp(c).map((x) => ({ giaTri: b / (A * x.he) * 100, viSao: x.viSao })),
          { giaTri: 100 - kq, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
        ], `H = ${vn(b)} : ${vnT(lt)} · 100%`, [
          `m(glucose) lí thuyết = ${vn(A)} : ${t.M} · 180 ${bang(lt)} kg.`,
          `H = ${vn(b)} : ${vnT(lt)} · 100% ${bang(kq)}%.`,
        ], `${chotTp(c)} H = thực tế : lí thuyết × 100%.`, [...KT_TP, 'tính hiệu suất'], { toiDa: 100 })
    },
  },
  {
    ma: 'thuy_phan.van_dung.nguyen_lieu', dang: [TP_KL], muc: 'van_dung', tuKhoa: /gạo|sắn|khoai|mùn cưa|nước mía|chứa/,
    sinh(r, phan) {
      const nl = r.chon(NL_TP), t = ttTp(nl.chat), p = r.chon(nl.p), A = r.chon([10, 20, 25, 50, 100, 150, 200, 250, 300, 400, 500, 1000]), H = r.chon(H_DEP)
      const f = (o: { p?: number; h?: number; he?: number }) => A * (o.p ?? p) / 100 * (o.he ?? MG / t.M) * (o.h ?? H / 100)
      const mC = A * p / 100, n = mC / t.M, kq = f({})
      return soHoc(`Thuỷ phân ${vn(A)} kg ${nl.ten} (chứa ${p}% ${t.ten} về khối lượng, còn lại là tạp chất không bị thuỷ phân) với hiệu suất ${H}%, thu được m kg glucose. ${hoi(phan, 'm')}`, kq, [
        { giaTri: f({ p: 100 }), viSao: `quên hàm lượng ${p}% (coi cả ${vn(A)} kg ${nl.ten} là ${t.ten})` },
        { giaTri: f({ h: 1 }), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: f({ h: 100 / H }), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        ...nhieuTp(nl.chat).map((x) => ({ giaTri: f({ he: x.he }), viSao: x.viSao })),
      ], `m = ${vn(A)} · ${p}% : ${t.M} · 180 · ${H}%`, [
        `m(${t.ten}) = ${vn(A)} · ${p}% ${bang(mC)} kg ⇒ n(${tenMol(nl.chat)}) = ${vnT(mC)} : ${t.M} ${bang(n)} kmol.`,
        `n(glucose) = ${vnT(n)} · ${H}% ${bang(n * H / 100)} kmol ⇒ m = ${vnT(n * H / 100)} · 180 ${bang(kq)} kg.`,
      ], chotTp(nl.chat), [...KT_TP, 'hàm lượng chất trong nguyên liệu'])
    },
  },
  {
    ma: 'thuy_phan.van_dung.dung_dich', dang: [TP_KL], muc: 'van_dung', tuKhoa: /dung dịch|nồng độ|%/,
    sinh(r, phan) {
      const c = r.chon<ChatTp>(['tinh_bot', 'cellulose']), t = ttTp(c), a = r.chon([2, 4, 5, 8, 10, 12, 15, 16, 20, 25, 30, 40, 50]), H = r.chon(H_DEP), C = r.chon([5, 10, 15, 20, 25, 30, 40])
      const f = (o: { h?: number; c?: number; he?: number }) => a * (o.he ?? MG / MTB) * (o.h ?? H / 100) / ((o.c ?? C) / 100)
      const mG = a / MTB * MG * H / 100, kq = f({})
      return soHoc(`Thuỷ phân ${vn(a)} kg ${t.ten} với hiệu suất ${H}%, toàn bộ glucose thu được dùng để pha chế dung dịch glucose ${C}%. Khối lượng dung dịch glucose ${C}% pha được là m kg. ${hoi(phan, 'm')}`, kq, [
        { giaTri: mG * C / 100, viSao: `nhân ${C}% thay vì chia (đó là khối lượng chất tan nhân thêm một lần)` },
        { giaTri: f({ h: 1 }), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: f({ h: 100 / H }), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: f({ he: 1 }), viSao: 'giữ nguyên khối lượng (quên H₂O cộng vào mỗi mắt xích: 162 → 180)' },
        { giaTri: mG, viSao: 'dừng ở khối lượng glucose, quên chia nồng độ' },
      ], `m(dd) = m(glucose) : ${C}% = ${vn(a)} : 162 · 180 · ${H}% : ${C}%`, [
        `m(glucose) = ${vn(a)} : 162 · 180 · ${H}% ${bang(mG)} kg.`,
        `m(dung dịch) = ${vnT(mG)} : ${C}% ${bang(kq)} kg.`,
      ], `${chotTp(c)} m dung dịch = m chất tan : C%.`, [...KT_TP, 'nồng độ phần trăm'])
    },
  },
  {
    ma: 'thuy_phan.van_dung.hieu_suat', dang: [TP_HS], muc: 'van_dung', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const nl = r.chon(NL_TP), t = ttTp(nl.chat), p = r.chon(nl.p), A = r.chon([20, 25, 50, 100, 150, 200, 250, 300, 400, 500, 1000]), H = r.chon(H_DEP)
      const lt = A * p / 100 / t.M * MG, b = lam(Math.round(lt * H / 100 * 10) / 10), kq = b / lt * 100
      return soHoc(`Thuỷ phân ${vn(A)} kg ${nl.ten} (chứa ${p}% ${t.ten} về khối lượng, còn lại là tạp chất không bị thuỷ phân), thu được ${vn(b)} kg glucose. Hiệu suất của phản ứng thuỷ phân là H%. ${hoi(phan, 'H')}`, kq, [
        { giaTri: b / (A / t.M * MG) * 100, viSao: `quên hàm lượng ${p}% khi tính lượng lí thuyết` },
        ...nhieuTp(nl.chat).map((x) => ({ giaTri: b / (A * p / 100 * x.he) * 100, viSao: x.viSao })),
      ], `H = ${vn(b)} : ${vnT(lt)} · 100%`, [
        `m(glucose) lí thuyết = ${vn(A)} · ${p}% : ${t.M} · 180 ${bang(lt)} kg.`,
        `H = ${vn(b)} : ${vnT(lt)} · 100% ${bang(kq)}%.`,
      ], `${chotTp(nl.chat)} H = thực tế : lí thuyết × 100%.`, [...KT_TP, 'tính hiệu suất'], { toiDa: 100 })
    },
  },
]

// ================================================================ HỌ 3. PHẢN ỨNG TRÁNG BẠC
const TOLLENS = 'lượng dư dung dịch AgNO₃ trong NH₃, đun nóng'
const KT_TB = ['phản ứng tráng bạc', 'tính theo phương trình hoá học']
const CHOT_TB = 'Glucose (và fructose trong môi trường NH₃) tráng bạc: 1 mol → 2 mol Ag; saccharose phải thuỷ phân trước (1 mol → 4 mol Ag).'

const TRANG_BAC: MauDe[] = [
  {
    ma: 'trang_bac.biet.ag', dang: [TB_KL], muc: 'biet',
    sinh(r, phan) {
      const ten = r.chon(['glucose', 'fructose']), a = khoiLuong(r, MG, 4.5, 360), n = a / MG, kq = 2 * n * MAG
      return soHoc(`Cho ${vn(a)} gam ${ten} tác dụng hoàn toàn với ${TOLLENS}, thu được m gam Ag. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * MAG, viSao: `lấy 1 mol ${ten} cho 1 mol Ag` },
        { giaTri: 4 * n * MAG, viSao: `lấy 1 mol ${ten} cho 4 mol Ag (nhầm với saccharose đã thuỷ phân)` },
        { giaTri: a / MSAC * 2 * MAG, viSao: 'dùng nhầm M = 342 (saccharose)' },
        { giaTri: a / MTB * 2 * MAG, viSao: 'dùng nhầm M = 162 (mắt xích tinh bột)' },
      ], `n(Ag) = 2n(${ten}) ⇒ m = 2 · ${vn(a)} : 180 · 108`, [
        `n(${ten}) = ${vn(a)} : 180 ${bang(n)} mol ⇒ n(Ag) = 2 · ${vnT(n)} ${bang(2 * n)} mol.`,
        `m = ${vnT(2 * n)} · 108 ${bang(kq)} gam.`,
      ], CHOT_TB, KT_TB)
    },
  },
  {
    ma: 'trang_bac.biet.can_glucose', dang: [TB_KL, UD_KL], muc: 'biet', tuKhoa: /gương|kính|tráng/,
    sinh(r, phan) {
      const b = khoiLuong(r, 2 * MAG, 2.16, 216), nAg = b / MAG, n = nAg / 2, kq = n * MG
      return soHoc(`Để tráng một lớp bạc có khối lượng ${vn(b)} gam lên mặt kính, người ta cho m gam glucose tác dụng với ${TOLLENS} (hiệu suất 100%). ${hoi(phan, 'm')}`, kq, [
        { giaTri: nAg * 2 * MG, viSao: 'nhân 2 thay vì chia 2 khi đổi từ Ag về glucose' },
        { giaTri: nAg * MG, viSao: 'lấy 1 mol glucose cho 1 mol Ag' },
        { giaTri: nAg / 4 * MG, viSao: 'lấy 1 mol glucose cho 4 mol Ag' },
        { giaTri: n * MSAC, viSao: 'dùng nhầm M = 342 (saccharose)' },
      ], `n(glucose) = n(Ag) : 2 ⇒ m = ${vn(b)} : 108 : 2 · 180`, [
        `n(Ag) = ${vn(b)} : 108 ${bang(nAg)} mol ⇒ n(glucose) = ${vnT(nAg)} : 2 ${bang(n)} mol.`,
        `m = ${vnT(n)} · 180 ${bang(kq)} gam.`,
      ], CHOT_TB, [...KT_TB, 'tính ngược nguyên liệu'])
    },
  },
  {
    ma: 'trang_bac.biet.so_mol', dang: [TB_SM], muc: 'biet',
    sinh(r, phan) {
      const ten = r.chon(['glucose', 'fructose']), n = r.chon([0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5])
      return soHoc(`Cho ${vn(n)} mol ${ten} tác dụng hoàn toàn với ${TOLLENS}. Số mol Ag thu được là x. ${hoi(phan, 'x')}`, lam(2 * n), [
        { giaTri: n, viSao: `lấy 1 mol ${ten} cho 1 mol Ag` },
        { giaTri: 4 * n, viSao: `lấy 1 mol ${ten} cho 4 mol Ag` },
        { giaTri: n / 2, viSao: `chia 2 thay vì nhân 2` },
      ], `n(Ag) = 2n(${ten}) = 2 · ${vn(n)}`, [`${ten === 'fructose' ? 'Trong môi trường NH₃, fructose chuyển thành glucose; ' : ''}1 mol ${ten} khử 2 mol Ag⁺ ⇒ n(Ag) = 2 · ${vn(n)} = ${vn(lam(2 * n))} mol.`],
      CHOT_TB, KT_TB, { chinhXac: true })
    },
  },
  {
    ma: 'trang_bac.hieu.ag_hieu_suat', dang: [TB_KL], muc: 'hieu', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const a = khoiLuong(r, MG, 4.5, 360), H = r.chon(H_DEP), n = a / MG, kq = 2 * n * H / 100 * MAG
      return soHoc(`Cho ${vn(a)} gam glucose tác dụng với ${TOLLENS}. Biết hiệu suất phản ứng tráng bạc là ${H}%, khối lượng Ag thu được là m gam. ${hoi(phan, 'm')}`, kq, [
        { giaTri: 2 * n * MAG, viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: 2 * n / (H / 100) * MAG, viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: n * H / 100 * MAG, viSao: 'lấy 1 mol glucose cho 1 mol Ag' },
        { giaTri: 4 * n * H / 100 * MAG, viSao: 'lấy 1 mol glucose cho 4 mol Ag' },
      ], `m = 2 · ${vn(a)} : 180 · ${H}% · 108`, [
        `n(glucose) = ${vn(a)} : 180 ${bang(n)} mol ⇒ n(Ag) = 2 · ${vnT(n)} · ${H}% ${bang(2 * n * H / 100)} mol.`,
        `m = ${vnT(2 * n * H / 100)} · 108 ${bang(kq)} gam.`,
      ], CHOT_TB, [...KT_TB, 'hiệu suất phản ứng'])
    },
  },
  {
    ma: 'trang_bac.hieu.hon_hop', dang: [TB_KL], muc: 'hieu', tuKhoa: /fructose|hỗn hợp/,
    sinh(r, phan) {
      const a1 = khoiLuong(r, MG, 3.6, 180), a2 = khoiLuong(r, MG, 3.6, 180), n = (a1 + a2) / MG, kq = 2 * n * MAG
      return soHoc(`Cho hỗn hợp gồm ${vn(a1)} gam glucose và ${vn(a2)} gam fructose tác dụng hoàn toàn với ${TOLLENS}, thu được m gam Ag. ${hoi(phan, 'm')}`, kq, [
        { giaTri: 2 * a1 / MG * MAG, viSao: 'cho rằng fructose không tham gia phản ứng tráng bạc' },
        { giaTri: n * MAG, viSao: 'lấy 1 mol monosaccharide cho 1 mol Ag' },
        { giaTri: 2 * a2 / MG * MAG, viSao: 'chỉ tính fructose, bỏ sót glucose' },
        { giaTri: 4 * n * MAG, viSao: 'lấy 1 mol monosaccharide cho 4 mol Ag' },
      ], `n(Ag) = 2[n(glucose) + n(fructose)] = 2 · (${vn(a1)} + ${vn(a2)}) : 180`, [
        `Trong môi trường NH₃, fructose chuyển thành glucose nên cả hai đều tráng bạc theo tỉ lệ 1 : 2.`,
        `n(glucose) + n(fructose) = (${vn(a1)} + ${vn(a2)}) : 180 ${bang(n)} mol ⇒ n(Ag) ${bang(2 * n)} mol.`,
        `m = ${vnT(2 * n)} · 108 ${bang(kq)} gam.`,
      ], CHOT_TB, KT_TB)
    },
  },
  {
    ma: 'trang_bac.hieu.nong_do', dang: [TB_PT], muc: 'hieu', tuKhoa: /nồng độ|%/,
    sinh(r, phan) {
      const C = r.chon([2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20]), md = r.chon([50, 60, 75, 80, 90, 100, 120, 150, 200, 250, 300, 400, 500])
      const b = lam(md * C / 100 / MG * 2 * MAG)
      if (soLe(b) > 3) return null
      const nAg = b / MAG, n = nAg / 2, mG = n * MG, kq = mG / md * 100
      return soHoc(`Cho ${vn(md)} gam dung dịch glucose tác dụng hoàn toàn với ${TOLLENS}, thu được ${vn(b)} gam Ag. Nồng độ phần trăm của glucose trong dung dịch là C%. ${hoi(phan, 'C')}`, kq, [
        { giaTri: 2 * kq, viSao: 'lấy 1 mol glucose cho 1 mol Ag' },
        { giaTri: kq / 2, viSao: 'lấy 1 mol glucose cho 4 mol Ag' },
        { giaTri: kq * MSAC / MG, viSao: 'dùng nhầm M = 342 (saccharose) cho glucose' },
        { giaTri: b / md * 100, viSao: 'lấy khối lượng Ag chia khối lượng dung dịch' },
      ], `C% = ${vn(b)} : 108 : 2 · 180 : ${vn(md)} · 100%`, [
        `n(Ag) = ${vn(b)} : 108 ${bang(nAg)} mol ⇒ n(glucose) = ${vnT(nAg)} : 2 ${bang(n)} mol ⇒ m(glucose) ${bang(mG)} gam.`,
        `C% = ${vnT(mG)} : ${vn(md)} · 100% ${bang(kq)}%.`,
      ], `${CHOT_TB} C% = m chất tan : m dung dịch × 100%.`, [...KT_TB, 'nồng độ phần trăm'], { chinhXac: true, toiDa: 100 })
    },
  },
  {
    ma: 'trang_bac.hieu.so_mol_hon_hop', dang: [TB_SM], muc: 'hieu', tuKhoa: /saccharose|thuỷ phân|thủy phân/,
    sinh(r, phan) {
      const a = r.chon([0.01, 0.02, 0.03, 0.05, 0.1, 0.15, 0.2]), b = r.chon([0.01, 0.02, 0.04, 0.05, 0.1, 0.15, 0.25])
      return soHoc(`Hỗn hợp X gồm ${vn(a)} mol glucose và ${vn(b)} mol saccharose. Thuỷ phân hoàn toàn X trong môi trường acid, trung hoà acid rồi cho toàn bộ dung dịch thu được tác dụng với ${TOLLENS}. Số mol Ag tối đa thu được là x. ${hoi(phan, 'x')}`, lam(2 * a + 4 * b), [
        { giaTri: lam(2 * a + 2 * b), viSao: 'quên fructose (lấy 1 mol saccharose cho 2 mol Ag)' },
        { giaTri: lam(2 * a), viSao: 'cho rằng saccharose không tạo Ag dù đã thuỷ phân' },
        { giaTri: lam(4 * a + 4 * b), viSao: 'lấy cả glucose ban đầu cho 4 mol Ag' },
        { giaTri: lam(a + 2 * b), viSao: 'lấy tỉ lệ 1 mol monosaccharide cho 1 mol Ag' },
      ], `n(Ag) = 2n(glucose) + 4n(saccharose)`, [
        `Thuỷ phân: 1 saccharose → 1 glucose + 1 fructose ⇒ tổng monosaccharide = ${vn(a)} + 2 · ${vn(b)} = ${vn(lam(a + 2 * b))} mol.`,
        `Mỗi monosaccharide cho 2 Ag ⇒ n(Ag) = 2 · ${vn(lam(a + 2 * b))} = ${vn(lam(2 * a + 4 * b))} mol.`,
      ], CHOT_TB, [...KT_TB, 'thuỷ phân saccharose'], { chinhXac: true })
    },
  },
  {
    ma: 'trang_bac.hieu.guong', dang: [UD_KL, TB_KL], muc: 'hieu', tuKhoa: /gương|kính|tráng/,
    sinh(r, phan) {
      const N = r.chon([10, 20, 25, 40, 50, 100, 120, 150, 200, 250, 500]), q = r.chon([0.27, 0.54, 0.81, 1.08, 1.35, 1.62, 2.16, 2.7, 3.24]), H = r.chon(H_DEP)
      const mAg = N * q, nAg = mAg / MAG, n = nAg / 2, kq = n / (H / 100) * MG
      return soHoc(`Một xưởng tráng gương cần tráng bạc cho ${N} chiếc gương, mỗi chiếc cần ${vn(q)} gam Ag. Bạc được tạo ra bằng cách cho m gam glucose tác dụng với ${TOLLENS}; hiệu suất phản ứng tráng bạc là ${H}%. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * H / 100 * MG, viSao: `nhân hiệu suất ${H}% thay vì chia (tính ngược nguyên liệu phải chia)` },
        { giaTri: n * MG, viSao: `quên chia hiệu suất ${H}%` },
        { giaTri: nAg / (H / 100) * MG, viSao: 'lấy 1 mol glucose cho 1 mol Ag' },
        { giaTri: q / MAG / 2 / (H / 100) * MG, viSao: `chỉ tính cho 1 chiếc gương, quên nhân ${N}` },
      ], `m = ${N} · ${vn(q)} : 108 : 2 : ${H}% · 180`, [
        `m(Ag) = ${N} · ${vn(q)} ${bang(mAg)} gam ⇒ n(Ag) = ${vnT(mAg)} : 108 ${bang(nAg)} mol.`,
        `n(glucose) phản ứng = ${vnT(nAg)} : 2 ${bang(n)} mol; cần dùng = ${vnT(n)} : ${H}% ${bang(n / (H / 100))} mol.`,
        `m = ${vnT(n / (H / 100))} · 180 ${bang(kq)} gam.`,
      ], `${CHOT_TB} Tính ngược nguyên liệu thì chia hiệu suất.`, [...KT_TB, 'ứng dụng tráng gương'])
    },
  },
  {
    ma: 'trang_bac.van_dung.saccharose', dang: [TB_KL], muc: 'van_dung', tuKhoa: /saccharose|thuỷ phân|thủy phân/,
    sinh(r, phan) {
      const a = khoiLuong(r, MSAC, 6.84, 684), H = r.chon(H_DEP), n = a / MSAC, nAg = 4 * n * H / 100, kq = nAg * MAG
      return soHoc(`Thuỷ phân ${vn(a)} gam saccharose với hiệu suất ${H}%, trung hoà acid rồi cho toàn bộ dung dịch thu được tác dụng với ${TOLLENS}, thu được m gam Ag. ${hoi(phan, 'm')}`, kq, [
        { giaTri: 2 * n * H / 100 * MAG, viSao: 'quên fructose cũng tráng bạc (lấy 1 mol saccharose cho 2 mol Ag)' },
        { giaTri: 4 * n * MAG, viSao: `quên hiệu suất thuỷ phân ${H}% (saccharose còn dư không tráng bạc)` },
        { giaTri: 4 * n / (H / 100) * MAG, viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: a / MG * 2 * H / 100 * MAG, viSao: 'dùng M = 180 cho saccharose (coi như glucose)' },
      ], `n(Ag) = 4 · ${vn(a)} : 342 · ${H}% ⇒ m = n(Ag) · 108`, [
        `n(saccharose) = ${vn(a)} : 342 ${bang(n)} mol; bị thuỷ phân = ${vnT(n)} · ${H}% ${bang(n * H / 100)} mol (phần còn lại không tráng bạc).`,
        `Mỗi saccharose → 1 glucose + 1 fructose → 4 Ag ⇒ n(Ag) = 4 · ${vnT(n * H / 100)} ${bang(nAg)} mol.`,
        `m = ${vnT(nAg)} · 108 ${bang(kq)} gam.`,
      ], CHOT_TB, [...KT_TB, 'thuỷ phân saccharose', 'hiệu suất phản ứng'])
    },
  },
  {
    ma: 'trang_bac.van_dung.guong_day', dang: [UD_KL, TB_KL], muc: 'van_dung', tuKhoa: /gương|kính|μm|dày/,
    sinh(r, phan) {
      const N = r.chon([20, 50, 100, 200, 250, 400, 500, 540, 800, 1000]), S = r.chon([0.2, 0.25, 0.4, 0.5, 0.6, 0.8, 1, 1.2, 1.5, 2]), d = r.chon([0.1, 0.15, 0.2, 0.25, 0.3, 0.5])
      const H = r.chon(H_DEP), V = N * S * d, mAg = V * 10.49, nAg = mAg / MAG, n = nAg / 2, kq = n / (H / 100) * MG
      return soHoc(`Để tráng bạc ${N} tấm gương, mỗi tấm có diện tích ${vn(S)} m² và lớp bạc dày ${vn(d)} μm, người ta dùng m gam glucose tác dụng với ${TOLLENS}. Biết hiệu suất phản ứng tráng bạc là ${H}% và khối lượng riêng của bạc là 10,49 g/cm³. ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq * 10, viSao: 'đổi 1 μm = 10⁻³ cm (đúng là 10⁻⁴ cm)' },
        { giaTri: n * H / 100 * MG, viSao: `nhân hiệu suất ${H}% thay vì chia` },
        { giaTri: nAg / (H / 100) * MG, viSao: 'lấy 1 mol glucose cho 1 mol Ag' },
        { giaTri: n * MG, viSao: `quên chia hiệu suất ${H}%` },
        { giaTri: kq / N, viSao: `chỉ tính cho 1 tấm gương, quên nhân ${N}` },
      ], `V(Ag) = ${N} · ${vn(S)} · 10⁴ cm² · ${vn(d)} · 10⁻⁴ cm; m = V · 10,49 : 108 : 2 : ${H}% · 180`, [
        `Đổi: ${vn(S)} m² = ${vn(lam(S * 1e4))} cm²; ${vn(d)} μm = ${vn(d)} · 10⁻⁴ cm ⇒ V(Ag) = ${N} · ${vn(lam(S * 1e4))} · ${vn(d)} · 10⁻⁴ ${bang(V)} cm³.`,
        `m(Ag) = ${vnT(V)} · 10,49 ${bang(mAg)} gam ⇒ n(Ag) ${bang(nAg)} mol ⇒ n(glucose) phản ứng ${bang(n)} mol.`,
        `m = ${vnT(n)} : ${H}% · 180 ${bang(kq)} gam.`,
      ], `${CHOT_TB} m(Ag) = D · V; 1 m² = 10⁴ cm², 1 μm = 10⁻⁴ cm.`, [...KT_TB, 'ứng dụng tráng gương', 'đổi đơn vị'])
    },
  },
  {
    ma: 'trang_bac.van_dung.so_mol_hieu_suat', dang: [TB_SM], muc: 'van_dung', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const a = r.chon([0.02, 0.04, 0.05, 0.1, 0.15, 0.2, 0.25]), b = r.chon([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]), H = r.chon([50, 60, 75, 80, 90])
      const kq = lam(2 * a + 4 * b * H / 100)
      if (soLe(kq) > 2) return null
      return soHoc(`Hỗn hợp X gồm ${vn(a)} mol glucose và ${vn(b)} mol saccharose. Thuỷ phân X trong môi trường acid với hiệu suất thuỷ phân saccharose ${H}%, trung hoà acid rồi cho toàn bộ dung dịch thu được tác dụng với ${TOLLENS}. Số mol Ag thu được là x. ${hoi(phan, 'x')}`, kq, [
        { giaTri: lam(2 * a + 4 * b), viSao: `quên hiệu suất thuỷ phân ${H}%` },
        { giaTri: lam(2 * a + 2 * b * H / 100), viSao: 'quên fructose (lấy 1 mol saccharose bị thuỷ phân cho 2 mol Ag)' },
        { giaTri: lam((2 * a + 4 * b) * H / 100), viSao: `nhân hiệu suất ${H}% cho cả glucose ban đầu` },
        { giaTri: lam(4 * b * H / 100), viSao: 'bỏ sót glucose có sẵn trong X' },
      ], `n(Ag) = 2 · ${vn(a)} + 4 · ${vn(b)} · ${H}%`, [
        `Saccharose bị thuỷ phân = ${vn(b)} · ${H}% = ${vn(lam(b * H / 100))} mol ⇒ tạo ${vn(lam(b * H / 100))} mol glucose + ${vn(lam(b * H / 100))} mol fructose; saccharose dư không tráng bạc.`,
        `n(Ag) = 2 · (${vn(a)} + 2 · ${vn(lam(b * H / 100))}) = ${vn(kq)} mol.`,
      ], CHOT_TB, [...KT_TB, 'thuỷ phân saccharose', 'hiệu suất phản ứng'], { chinhXac: true })
    },
  },
  {
    ma: 'trang_bac.van_dung.guong_saccharose', dang: [UD_KL], muc: 'van_dung', tuKhoa: /saccharose|g\/m²|gương/,
    sinh(r, phan) {
      const S = r.chon([500, 1000, 2000, 2500, 4000, 5000, 8000, 10000, 20000]), q = r.chon([0.7, 0.75, 0.8, 0.9, 1, 1.2]), H1 = r.chon(H_DEP), H2 = r.chon(H_DEP)
      const mAg = S * q, nAg = mAg / MAG, n = nAg / 4 / (H1 / 100) / (H2 / 100), kq = n * MSAC / 1000
      return soHoc(`Một xưởng cần tráng bạc ${S} m² kính với lượng bạc ${vn(q)} g/m². Bạc được tạo ra từ saccharose theo sơ đồ: saccharose → glucose + fructose (thuỷ phân, hiệu suất ${H1}%) → Ag (tráng bạc, hiệu suất ${H2}%). Khối lượng saccharose cần dùng là m kg. ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq * 2, viSao: 'quên fructose (lấy 1 mol saccharose cho 2 mol Ag)' },
        { giaTri: kq * H2 / 100, viSao: `chỉ chia hiệu suất thuỷ phân ${H1}%, quên hiệu suất tráng bạc ${H2}%` },
        { giaTri: kq * H1 / 100, viSao: `chỉ chia hiệu suất tráng bạc ${H2}%, quên hiệu suất thuỷ phân ${H1}%` },
        { giaTri: kq * (H1 / 100) ** 2 * (H2 / 100) ** 2, viSao: 'nhân hai hiệu suất thay vì chia' },
        { giaTri: kq * 1000, viSao: 'quên đổi gam sang kg' },
      ], `m = ${S} · ${vn(q)} : 108 : 4 : ${H1}% : ${H2}% · 342 (gam)`, [
        `m(Ag) = ${S} · ${vn(q)} ${bang(mAg)} gam ⇒ n(Ag) ${bang(nAg)} mol.`,
        `1 saccharose → 4 Ag ⇒ n(saccharose) cần = ${vnT(nAg)} : 4 : ${H1}% : ${H2}% ${bang(n)} mol.`,
        `m = ${vnT(n)} · 342 ${bang(n * MSAC)} gam ${bang(kq)} kg.`,
      ], `${CHOT_TB} Nhiều giai đoạn: chia lần lượt từng hiệu suất khi tính ngược.`, [...KT_TB, 'ứng dụng tráng gương', 'hiệu suất nhiều giai đoạn'])
    },
  },
]

// ================================================================ HỌ 4. CELLULOSE TRINITRATE / TRIACETATE
const PT_NITRAT = '[C₆H₇O₂(OH)₃]ₙ + 3nHNO₃ → [C₆H₇O₂(ONO₂)₃]ₙ + 3nH₂O (xúc tác H₂SO₄ đặc, t°)'
const PT_AXETAT = '[C₆H₇O₂(OH)₃]ₙ + 3n(CH₃CO)₂O → [C₆H₇O₂(OOCCH₃)₃]ₙ + 3nCH₃COOH'
const MNIT = M('C₆H₇O₂(ONO₂)₃'), MAXT = M('C₆H₇O₂(OOCCH₃)₃'), MHNO3 = M('HNO₃'), MANH = M('(CH₃CO)₂O')
interface SpCellulose { ten: string; pt: string; M: number; thuoc: string; Mt: number; Msai: number; saiTen: string }
const SP_CEL: readonly SpCellulose[] = [
  { ten: 'cellulose trinitrate', pt: PT_NITRAT, M: MNIT, thuoc: 'nitric acid', Mt: MHNO3, Msai: 162 + 45, saiTen: 'cellulose mononitrate (M = 207)' },
  { ten: 'cellulose triacetate', pt: PT_AXETAT, M: MAXT, thuoc: 'acetic anhydride', Mt: MANH, Msai: 162 + 42, saiTen: 'cellulose monoacetate (M = 204)' },
]
const KT_CE = ['ứng dụng của cellulose', 'hiệu suất phản ứng']
const chotCe = (s: SpCellulose) => `Mỗi mắt xích C₆H₁₀O₅ (162) có 3 nhóm OH ⇒ 1 mắt xích ${s.ten} (M = ${s.M}) cần 3 phân tử ${s.thuoc}.`

const CELLULOSE: MauDe[] = [
  {
    ma: 'cellulose.biet.san_pham', dang: [UD_KL, CT_KL], muc: 'biet', tuKhoa: /trinitrate|triacetate|acetate|nitric/,
    sinh(r, phan) {
      const s = r.chon(SP_CEL), a = khoiLuong(r, MTB, 16.2, 1000), n = a / MTB, kq = n * s.M
      return soHoc(`Cho ${vn(a)} kg cellulose phản ứng hoàn toàn với lượng dư ${s.thuoc} theo phương trình: ${s.pt}. Khối lượng ${s.ten} thu được là m kg. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * s.Msai, viSao: `chỉ thế 1 nhóm OH (tính ra ${s.saiTen})` },
        { giaTri: a, viSao: 'coi khối lượng sản phẩm bằng khối lượng cellulose' },
        { giaTri: n * (162 + 3 * s.Mt), viSao: `cộng cả 3 phân tử ${s.thuoc} mà quên trừ sản phẩm phụ` },
        { giaTri: a / s.M * 162, viSao: 'đổi ngược tỉ lệ khối lượng mol' },
      ], `n(sản phẩm) = n(mắt xích) ⇒ m = ${vn(a)} : 162 · ${s.M}`, [
        `n(C₆H₁₀O₅) = ${vn(a)} : 162 ${bang(n)} kmol = n(${s.ten}).`,
        `m = ${vnT(n)} · ${s.M} ${bang(kq)} kg.`,
      ], chotCe(s), ['ứng dụng của cellulose'])
    },
  },
  {
    ma: 'cellulose.hieu.san_pham', dang: [UD_KL, CT_KL], muc: 'hieu', tuKhoa: /trinitrate|triacetate|acetate|nitric|hiệu suất/,
    sinh(r, phan) {
      const s = r.chon(SP_CEL), a = r.chon([0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 8, 10, 16.2, 32.4, 48.6, 81]), H = r.chon(H_DEP), n = a / MTB, kq = n * s.M * H / 100
      return soHoc(`Từ ${vn(a)} tấn cellulose sản xuất ${s.ten} theo phương trình: ${s.pt}. Biết hiệu suất phản ứng là ${H}% (tính theo cellulose), khối lượng ${s.ten} thu được là m tấn. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * s.M, viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: n * s.M / (H / 100), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: a * 162 / s.M * H / 100, viSao: 'đổi ngược tỉ lệ khối lượng mol (162 : M sản phẩm)' },
        { giaTri: n * s.Msai * H / 100, viSao: `chỉ thế 1 nhóm OH (tính ra ${s.saiTen})` },
      ], `m = ${vn(a)} · ${s.M} : 162 · ${H}%`, [
        `Cứ 162 tấn cellulose tạo ${s.M} tấn ${s.ten} (tỉ lệ mắt xích 1 : 1).`,
        `m lí thuyết = ${vn(a)} · ${s.M} : 162 ${bang(a * s.M / MTB)} tấn ⇒ m = ${vnT(a * s.M / MTB)} · ${H}% ${bang(kq)} tấn.`,
      ], chotCe(s), KT_CE)
    },
  },
  {
    ma: 'cellulose.hieu.thuoc_thu', dang: [UD_KL], muc: 'hieu', tuKhoa: /nitric acid|anhydride|HNO₃|cần/,
    sinh(r, phan) {
      const s = r.chon(SP_CEL), dv = r.chon(['kg', 'tấn'] as const)
      const b = r.chon(s.M === MNIT ? (dv === 'kg' ? [29.7, 59.4, 89.1, 118.8, 148.5, 297, 594] : [0.297, 0.594, 1.188, 2.97, 5.94])
        : (dv === 'kg' ? [28.8, 57.6, 86.4, 144, 288, 576] : [0.288, 0.576, 1.44, 2.88, 5.76])), H = r.chon(H_DEP)
      const lt = b * 3 * s.Mt / s.M, kq = lt / (H / 100)
      return soHoc(`Để sản xuất ${vn(b)} ${dv} ${s.ten} theo phương trình: ${s.pt} với hiệu suất ${H}% (tính theo ${s.thuoc}), khối lượng ${s.thuoc} tối thiểu cần dùng là m ${dv}. ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq / 3, viSao: 'quên hệ số 3 (lấy 1 mắt xích cần 1 phân tử)' },
        { giaTri: lt * H / 100, viSao: `nhân hiệu suất ${H}% thay vì chia` },
        { giaTri: lt, viSao: `quên chia hiệu suất ${H}%` },
        { giaTri: b * 3 * s.Mt / MTB / (H / 100), viSao: `dùng M = 162 (cellulose) thay cho M = ${s.M} của ${s.ten}` },
      ], `m = ${vn(b)} · 3 · ${s.Mt} : ${s.M} : ${H}%`, [
        `Theo phương trình: cứ ${s.M} ${dv} ${s.ten} cần 3 · ${s.Mt} = ${3 * s.Mt} ${dv} ${s.thuoc} (tỉ lệ mol mắt xích : ${s.thuoc} = 1 : 3).`,
        `m(${s.thuoc}) lí thuyết = ${vn(b)} · ${3 * s.Mt} : ${s.M} ${bang(lt)} ${dv} ⇒ cần dùng = ${vnT(lt)} : ${H}% ${bang(kq)} ${dv}.`,
      ], `${chotCe(s)} Tính chất cần dùng thì chia hiệu suất.`, [...KT_CE, 'tính ngược nguyên liệu'])
    },
  },
  {
    ma: 'cellulose.hieu.the_tich_acid', dang: [UD_TT], muc: 'hieu', tuKhoa: /nitric|HNO₃|thể tích|lít/,
    sinh(r, phan) {
      const [c, D] = r.chon([[63, 1.4], [65, 1.4], [68, 1.41]] as const), b = r.chon([29.7, 44.55, 59.4, 89.1, 118.8, 148.5, 178.2, 297])
      const n = b / MNIT, nT = 3 * n, mT = nT * MHNO3, mdd = mT / (c / 100), kq = mdd / D
      return soHoc(`Để điều chế ${vn(b)} kg cellulose trinitrate theo phương trình: ${PT_NITRAT}. Coi hiệu suất phản ứng đạt 100%, thể tích dung dịch HNO₃ ${c}% (D = ${vn(D)} g/mL) cần dùng là V lít. ${hoi(phan, 'V')}`, kq, [
        { giaTri: n * MHNO3 / (c / 100) / D, viSao: 'quên hệ số 3 (lấy 1 mắt xích cần 1 HNO₃)' },
        { giaTri: mT / (c / 100), viSao: 'dừng ở khối lượng dung dịch, quên chia khối lượng riêng' },
        { giaTri: mT / D, viSao: `quên chia nồng độ ${c}%` },
        { giaTri: mT * (c / 100) / D, viSao: `nhân nồng độ ${c}% thay vì chia` },
      ], `V = ${vn(b)} : 297 · 3 · 63 : ${c}% : ${vn(D)}`, [
        `n(cellulose trinitrate) = ${vn(b)} : 297 ${bang(n)} kmol ⇒ n(HNO₃) = 3 · ${vnT(n)} ${bang(nT)} kmol ⇒ m(HNO₃) ${bang(mT)} kg.`,
        `m(dung dịch) = ${vnT(mT)} : ${c}% ${bang(mdd)} kg ⇒ V = ${vnT(mdd)} : ${vn(D)} ${bang(kq)} lít.`,
      ], `${chotCe(SP_CEL[0]!)} V dung dịch = m chất tan : C% : D.`, ['ứng dụng của cellulose', 'nồng độ phần trăm và khối lượng riêng'])
    },
  },
  {
    ma: 'cellulose.van_dung.the_tich_acid', dang: [UD_TT], muc: 'van_dung', tuKhoa: /nitric|HNO₃|thể tích|lít|hiệu suất/,
    sinh(r, phan) {
      const [c, D] = r.chon([[63, 1.4], [65, 1.4], [68, 1.41]] as const), b = r.chon([29.7, 44.55, 59.4, 89.1, 118.8, 148.5, 178.2, 297]), H = r.chon(H_DEP)
      const n = b / MNIT, nT = 3 * n / (H / 100), mT = nT * MHNO3, mdd = mT / (c / 100), kq = mdd / D
      return soHoc(`Để điều chế ${vn(b)} kg cellulose trinitrate theo phương trình: ${PT_NITRAT} với hiệu suất ${H}% (tính theo nitric acid), cần V lít dung dịch HNO₃ ${c}% (D = ${vn(D)} g/mL). ${hoi(phan, 'V')}`, kq, [
        { giaTri: kq * (H / 100) ** 2, viSao: `nhân hiệu suất ${H}% thay vì chia` },
        { giaTri: kq * H / 100, viSao: `quên chia hiệu suất ${H}%` },
        { giaTri: kq / 3, viSao: 'quên hệ số 3 (lấy 1 mắt xích cần 1 HNO₃)' },
        { giaTri: mdd, viSao: 'dừng ở khối lượng dung dịch, quên chia khối lượng riêng' },
        { giaTri: mT / D, viSao: `quên chia nồng độ ${c}%` },
      ], `V = ${vn(b)} : 297 · 3 : ${H}% · 63 : ${c}% : ${vn(D)}`, [
        `n(cellulose trinitrate) = ${vn(b)} : 297 ${bang(n)} kmol ⇒ n(HNO₃) cần = 3 · ${vnT(n)} : ${H}% ${bang(nT)} kmol.`,
        `m(HNO₃) = ${vnT(nT)} · 63 ${bang(mT)} kg ⇒ m(dung dịch) = ${vnT(mT)} : ${c}% ${bang(mdd)} kg.`,
        `V = ${vnT(mdd)} : ${vn(D)} ${bang(kq)} lít.`,
      ], `${chotCe(SP_CEL[0]!)} Chia hiệu suất, chia C%, chia D.`, [...KT_CE, 'nồng độ phần trăm và khối lượng riêng'])
    },
  },
  {
    ma: 'cellulose.van_dung.to_acetate', dang: [UD_KL, CT_KL], muc: 'van_dung', tuKhoa: /tơ acetate|bông|triacetate/,
    sinh(r, phan) {
      const A = r.chon([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), p = r.chon([90, 92, 95, 96, 98, 99]), q = r.chon([85, 88, 90, 92, 95]), H = r.chon(H_DEP)
      const mC = A * p / 100, mT = mC / MTB * MAXT * H / 100, kq = mT / (q / 100)
      return soHoc(`Tơ acetate được sản xuất từ bông theo phương trình: ${PT_AXETAT}. Từ ${vn(A)} tấn bông chứa ${p}% cellulose về khối lượng, với hiệu suất phản ứng ${H}% (tính theo cellulose), thu được m tấn tơ acetate chứa ${q}% cellulose triacetate về khối lượng (còn lại là phụ gia). ${hoi(phan, 'm')}`, kq, [
        { giaTri: mT * q / 100, viSao: `nhân ${q}% thay vì chia (tơ nặng hơn lượng triacetate chứa trong nó)` },
        { giaTri: mT, viSao: `dừng ở khối lượng cellulose triacetate, quên chia ${q}%` },
        { giaTri: kq / (p / 100), viSao: `quên hàm lượng cellulose ${p}% trong bông` },
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: kq * (H / 100) ** -2, viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
      ], `m = ${vn(A)} · ${p}% : 162 · 288 · ${H}% : ${q}%`, [
        `m(cellulose) = ${vn(A)} · ${p}% ${bang(mC)} tấn ⇒ m(cellulose triacetate) = ${vnT(mC)} · 288 : 162 · ${H}% ${bang(mT)} tấn.`,
        `m(tơ acetate) = ${vnT(mT)} : ${q}% ${bang(kq)} tấn.`,
      ], `${chotCe(SP_CEL[1]!)} Sản phẩm chứa q% chất chính ⇒ m sản phẩm = m chất chính : q%.`, [...KT_CE, 'hàm lượng chất trong nguyên liệu'])
    },
  },
]

// ================================================================ HỌ 5. GÁN SỐ PHẢN ỨNG CHUYỂN HOÁ (CARBOHYDRATE.LEN_MEN.SO_SANH — câu "gán số thứ tự phương trình theo tên gọi")
interface PuTen { ten: string; pt: string }
const PU: Readonly<Record<string, PuTen>> = {
  quang_hop: { ten: 'quang hợp', pt: '6nCO₂ + 5nH₂O → (C₆H₁₀O₅)ₙ + 6nO₂ (ánh sáng, chlorophyll)' },
  thuy_phan: { ten: 'thuỷ phân', pt: '(C₆H₁₀O₅)ₙ + nH₂O → nC₆H₁₂O₆ (enzyme)' },
  thuy_phan_sac: { ten: 'thuỷ phân', pt: 'C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ + C₆H₁₂O₆ (H⁺, t°)' },
  len_men_ruou: { ten: 'lên men rượu', pt: 'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ (enzyme)' },
  len_men_giam: { ten: 'lên men giấm', pt: 'C₂H₅OH + O₂ → CH₃COOH + H₂O (enzyme)' },
  len_men_lactic: { ten: 'lên men lactic', pt: 'C₆H₁₂O₆ → 2CH₃CH(OH)COOH (enzyme)' },
  oxi_hoa: { ten: 'oxi hoá hoàn toàn', pt: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O (enzyme)' },
  trang_bac: { ten: 'tráng bạc', pt: 'C₆H₁₂O₆ + 2[Ag(NH₃)₂]OH → CH₂OH[CHOH]₄COONH₄ + 2Ag + 3NH₃ + H₂O (t°)' },
  ester_hoa: { ten: 'ester hoá', pt: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O (H₂SO₄ đặc, t°)' },
}
/** Chuỗi chuyển hoá: mỗi mũi tên là MỘT phản ứng không nhập nhằng. */
const CHUOI: readonly { chat: readonly string[]; pu: readonly string[] }[] = [
  { chat: ['CO₂', '(C₆H₁₀O₅)ₙ', 'C₆H₁₂O₆', 'C₂H₅OH', 'CH₃COOH'], pu: ['quang_hop', 'thuy_phan', 'len_men_ruou', 'len_men_giam'] },
  { chat: ['(C₆H₁₀O₅)ₙ', 'C₆H₁₂O₆', 'C₂H₅OH', 'CH₃COOH', 'CH₃COOC₂H₅'], pu: ['thuy_phan', 'len_men_ruou', 'len_men_giam', 'ester_hoa'] },
  { chat: ['CO₂', '(C₆H₁₀O₅)ₙ', 'C₆H₁₂O₆', 'CH₃CH(OH)COOH'], pu: ['quang_hop', 'thuy_phan', 'len_men_lactic'] },
  { chat: ['C₁₂H₂₂O₁₁', 'C₆H₁₂O₆', 'C₂H₅OH', 'CH₃COOH'], pu: ['thuy_phan_sac', 'len_men_ruou', 'len_men_giam'] },
  { chat: ['C₆H₁₂O₆', 'C₂H₅OH', 'CH₃COOH', 'CH₃COOC₂H₅'], pu: ['len_men_ruou', 'len_men_giam', 'ester_hoa'] },
  { chat: ['C₁₂H₂₂O₁₁', 'C₆H₁₂O₆', 'C₂H₅OH', 'CH₃COOH', 'CH₃COOC₂H₅'], pu: ['thuy_phan_sac', 'len_men_ruou', 'len_men_giam', 'ester_hoa'] },
  { chat: ['CO₂', '(C₆H₁₀O₅)ₙ', 'C₆H₁₂O₆', 'Ag'], pu: ['quang_hop', 'thuy_phan', 'trang_bac'] },
]
/** Cặp tên hay nhầm (nhiễu Phần I = đổi chỗ hai số của cặp). */
const NHAM: readonly [string, string][] = [
  ['lên men rượu', 'lên men giấm'], ['lên men rượu', 'lên men lactic'], ['thuỷ phân', 'quang hợp'], ['lên men giấm', 'ester hoá'],
  ['oxi hoá hoàn toàn', 'lên men rượu'], ['tráng bạc', 'oxi hoá hoàn toàn'], ['thuỷ phân', 'lên men rượu'], ['quang hợp', 'oxi hoá hoàn toàn'],
]
const CHU_SO = ['', '', '', 'ba', 'bốn'] as const

/** Đáp án + nhiễu cho câu gán số: `soCua[ten]` = số thứ tự phản ứng mang tên đó; `tenHoi` = thứ tự tên đề hỏi. */
function lapGanSo(de: string, tenHoi: readonly string[], soCua: ReadonlyMap<string, number>, buoc: string[]): BanSinh {
  const dap = tenHoi.map((t) => soCua.get(t)!).join('')
  const nhieu: Nhieu[] = []
  const doi = (i: number, j: number) => { const a = [...dap]; [a[i], a[j]] = [a[j]!, a[i]!]; return a.join('') }
  for (const [x, y] of NHAM) {
    const i = tenHoi.indexOf(x), j = tenHoi.indexOf(y)
    if (i >= 0 && j >= 0) nhieu.push({ chu: doi(i, j), viSao: `nhầm phản ứng ${x} với phản ứng ${y}` })
  }
  const tuNhien = tenHoi.map((_, i) => String(i + 1)).join('')
  if (tuNhien !== dap) nhieu.push({ chu: tuNhien, viSao: 'ghi số theo thứ tự trong sơ đồ thay vì theo thứ tự tên gọi đề cho' })
  nhieu.push({ chu: [...dap].reverse().join(''), viSao: 'viết dãy số theo chiều ngược lại' })
  for (let i = 0; i + 1 < dap.length; i++) nhieu.push({ chu: doi(i, i + 1), viSao: `đổi chỗ số của phản ứng ${tenHoi[i]} và ${tenHoi[i + 1]}` })
  return {
    de, kieu: 'chu', dapAnChu: dap, nhieu: nhieu.filter((x) => x.chu !== dap),
    lyDoDung: tenHoi.map((t) => `${t} là (${soCua.get(t)})`).join(', '),
    buoc: [...buoc, `Viết theo thứ tự tên gọi đề cho: ${tenHoi.map((t) => `${t} → ${soCua.get(t)}`).join('; ')} ⇒ ${dap}.`],
    chot: 'Quang hợp tạo tinh bột; thuỷ phân tạo glucose; lên men rượu tạo C₂H₅OH + CO₂; lên men giấm tạo CH₃COOH; lên men lactic tạo lactic acid.',
    kienThuc: ['chuyển hoá carbohydrate', 'tên gọi các quá trình lên men'],
  }
}
const cauHoiGanSo = (phan: Phan, k: number) => (phan === 'I' ? `Dãy ${CHU_SO[k]} chữ số thu được là` : `Viết dãy ${CHU_SO[k]} chữ số đó.`)

/** Chọn k phương trình KHÁC TÊN (không lấy cùng lúc hai phản ứng thuỷ phân). */
function phuongTrinhKhacTen(r: Rng, k: number): string[] {
  const ma: string[] = [], daCo = new Set<string>()
  for (const x of r.xao(Object.keys(PU))) {
    if (daCo.has(PU[x]!.ten)) continue
    daCo.add(PU[x]!.ten); ma.push(x)
    if (ma.length === k) break
  }
  return ma
}
/** Dạng "sơ đồ chuyển hoá" (đánh số theo mũi tên). */
function ganSoSoDo(r: Rng, phan: Phan, chat: readonly string[], pu: readonly string[]): BanSinh {
  const k = pu.length, so = new Map(pu.map((p, i) => [PU[p]!.ten, i + 1] as const)), tenHoi = r.xao(pu.map((p) => PU[p]!.ten))
  const sd = chat.map((c, i) => (i === 0 ? c : `→(${i}) ${c}`)).join(' ')
  return lapGanSo(`Cho sơ đồ chuyển hoá: ${sd}. Gán số thứ tự của các phản ứng theo tên gọi: ${tenHoi.join(', ')} rồi viết các số theo đúng thứ tự tên gọi đó thành một dãy ${CHU_SO[k]} chữ số. ${cauHoiGanSo(phan, k)}`,
    tenHoi, so, pu.map((p, i) => `(${i + 1}) ${chat[i]} → ${chat[i + 1]}: ${PU[p]!.ten}.`))
}
/** Dạng "danh sách phương trình" (đánh số ngẫu nhiên). */
function ganSoPhuongTrinh(r: Rng, phan: Phan, ma: readonly string[]): BanSinh {
  const k = ma.length, ds = r.xao(ma), so = new Map(ds.map((x, i) => [PU[x]!.ten, i + 1] as const)), tenHoi = r.xao(ds.map((x) => PU[x]!.ten))
  return lapGanSo(`Cho các phương trình hoá học: ${ds.map((x, i) => `(${i + 1}) ${PU[x]!.pt}`).join('; ')}. Gán số thứ tự phương trình hoá học theo tên gọi: ${tenHoi.join(', ')} rồi viết các số theo đúng thứ tự tên gọi đó thành một dãy ${CHU_SO[k]} chữ số. ${cauHoiGanSo(phan, k)}`,
    tenHoi, so, ds.map((x, i) => `(${i + 1}) là phản ứng ${PU[x]!.ten}.`))
}

const GAN_SO: MauDe[] = [
  {
    ma: 'gan_so.biet.ba_phan_ung', dang: [LM_SS], muc: 'biet',
    sinh(r, phan) {
      if (r.so() < 0.5) return ganSoPhuongTrinh(r, phan, phuongTrinhKhacTen(r, 3))
      const ch = r.chon(CHUOI), bat = r.nguyen(0, ch.pu.length - 3)
      return ganSoSoDo(r, phan, ch.chat.slice(bat, bat + 4), ch.pu.slice(bat, bat + 3))
    },
  },
  {
    ma: 'gan_so.hieu.chuoi_bon', dang: [LM_SS], muc: 'hieu',
    sinh(r, phan) {
      const ch = r.chon(CHUOI.filter((c) => c.pu.length === 4))
      return r.so() < 0.5 ? ganSoSoDo(r, phan, ch.chat, ch.pu) : ganSoPhuongTrinh(r, phan, ch.pu)
    },
  },
  {
    ma: 'gan_so.van_dung.phuong_trinh', dang: [LM_SS], muc: 'van_dung',
    sinh: (r, phan) => ganSoPhuongTrinh(r, phan, phuongTrinhKhacTen(r, 4)),
  },
]

export const HO_CARBOHYDRATE: readonly HoDe[] = [
  { ma: 'len_men', ten: 'Lên men rượu (glucose, tinh bột, cellulose, saccharose) → ethanol, CO₂, kết tủa, rượu x°', khoiChuong: 12, tuKhoa: /lên men|ethanol|rượu|cồn/, mau: LEN_MEN },
  { ma: 'thuy_phan', ten: 'Thuỷ phân tinh bột, cellulose, saccharose → glucose', khoiChuong: 12, tuKhoa: /thuỷ phân|thủy phân/, mau: THUY_PHAN },
  { ma: 'trang_bac', ten: 'Phản ứng tráng bạc (glucose, fructose, saccharose sau thuỷ phân) → Ag; tráng gương', khoiChuong: 12, tuKhoa: /tráng bạc|tráng gương|Ag|AgNO₃|Tollens/, mau: TRANG_BAC },
  { ma: 'cellulose', ten: 'Cellulose trinitrate, cellulose triacetate (tơ acetate)', khoiChuong: 12, tuKhoa: /cellulose|trinitrate|acetate|piroxilin|thuốc súng/, mau: CELLULOSE },
  { ma: 'gan_so_chuyen_hoa', ten: 'Gán số thứ tự phản ứng chuyển hoá carbohydrate theo tên gọi', khoiChuong: 12, tuKhoa: /gán số|dãy bốn|dãy ba|sơ đồ/, mau: GAN_SO },
]
