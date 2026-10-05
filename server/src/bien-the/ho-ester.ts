// BỘ SINH BIẾN THỂ — CHƯƠNG ESTER – LIPID (lớp 12): xà phòng hoá ester đơn chức và chất béo · hiệu suất ester hoá · đốt cháy ester no đơn chức → CTPT ·
// chỉ số acid / chỉ số xà phòng hoá. Nhiễu Phần I từ LỖI HAY GẶP (quên hệ số 3 của chất béo, nhầm muối với acid, nhầm gốc acid – gốc alcohol, tính theo
// chất dư, quên trừ glycerol khi bảo toàn khối lượng, dùng M của NaOH thay KOH…). Bộ giải độc lập ở tests/bien-the-sinh-0510.test.ts.
import { CHU_DKC, M, V_KHI, bang, hoi, lam, soHoc, soLe, vn, vnT, type BanSinh, type HoDe, type MauDe, type Nhieu, type Phan, type Rng } from './chung'

const XP_KL = 'ESTER.THUY_PHAN_BASE.TINH_KHOI_LUONG'
const XP_TT = 'ESTER.THUY_PHAN_BASE.TINH_THE_TICH'
const UD_KL = 'ESTER.UNG_DUNG.TINH_KHOI_LUONG'
const EH_KL = 'ESTER.ESTER_HOA.TINH_KHOI_LUONG'
const EH_HS = 'ESTER.ESTER_HOA.TINH_HIEU_SUAT'
const DC_CT = 'ESTER.DOT_CHAY.XAC_DINH_CTPT'
const CS_CS = 'ESTER.CHI_SO_BEO.TINH_CHI_SO'
const CS_TT = 'ESTER.CHI_SO_BEO.TINH_THE_TICH'

const H_DEP = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95] as const
const MNAOH = M('NaOH'), MKOH = M('KOH'), MGLY = M('C₃H₅(OH)₃')

// ---------------------------------------------------------------- ester đơn chức (gốc acid – gốc alcohol có thật)
interface EsterDon { ct: string; ten: string; axit: string; muoi: string; tenMuoi: string; ancol: string; tenAncol: string; muoiSai: string | null }
const ESTER_DON: readonly EsterDon[] = [
  { ct: 'HCOOCH₃', ten: 'methyl formate', axit: 'HCOOH', muoi: 'HCOONa', tenMuoi: 'sodium formate', ancol: 'CH₃OH', tenAncol: 'methanol', muoiSai: 'CH₃COONa' },
  { ct: 'HCOOC₂H₅', ten: 'ethyl formate', axit: 'HCOOH', muoi: 'HCOONa', tenMuoi: 'sodium formate', ancol: 'C₂H₅OH', tenAncol: 'ethanol', muoiSai: 'C₂H₅COONa' },
  { ct: 'CH₃COOCH₃', ten: 'methyl acetate', axit: 'CH₃COOH', muoi: 'CH₃COONa', tenMuoi: 'sodium acetate', ancol: 'CH₃OH', tenAncol: 'methanol', muoiSai: null },
  { ct: 'CH₃COOC₂H₅', ten: 'ethyl acetate', axit: 'CH₃COOH', muoi: 'CH₃COONa', tenMuoi: 'sodium acetate', ancol: 'C₂H₅OH', tenAncol: 'ethanol', muoiSai: 'C₂H₅COONa' },
  { ct: 'C₂H₅COOCH₃', ten: 'methyl propanoate', axit: 'C₂H₅COOH', muoi: 'C₂H₅COONa', tenMuoi: 'sodium propanoate', ancol: 'CH₃OH', tenAncol: 'methanol', muoiSai: 'CH₃COONa' },
  { ct: 'C₂H₅COOC₂H₅', ten: 'ethyl propanoate', axit: 'C₂H₅COOH', muoi: 'C₂H₅COONa', tenMuoi: 'sodium propanoate', ancol: 'C₂H₅OH', tenAncol: 'ethanol', muoiSai: null },
]
/** Cặp đồng phân cùng M (bài hỗn hợp: số mol = khối lượng : M chung). */
const CAP_DONG_PHAN: readonly [EsterDon, EsterDon][] = [[ESTER_DON[1]!, ESTER_DON[2]!], [ESTER_DON[3]!, ESTER_DON[4]!]]

// ---------------------------------------------------------------- chất béo
interface ChatBeo { ten: string; ct: string; muoiNa: string; tenMuoiNa: string; muoiK: string; tenMuoiK: string; axit: string; tenAxit: string; no: boolean; esterMe: string; tenEsterMe: string }
const CHAT_BEO: readonly ChatBeo[] = [
  { ten: 'tristearin', ct: '(C₁₇H₃₅COO)₃C₃H₅', muoiNa: 'C₁₇H₃₅COONa', tenMuoiNa: 'sodium stearate', muoiK: 'C₁₇H₃₅COOK', tenMuoiK: 'potassium stearate', axit: 'C₁₇H₃₅COOH', tenAxit: 'stearic acid', no: true, esterMe: 'C₁₇H₃₅COOCH₃', tenEsterMe: 'methyl stearate' },
  { ten: 'tripalmitin', ct: '(C₁₅H₃₁COO)₃C₃H₅', muoiNa: 'C₁₅H₃₁COONa', tenMuoiNa: 'sodium palmitate', muoiK: 'C₁₅H₃₁COOK', tenMuoiK: 'potassium palmitate', axit: 'C₁₅H₃₁COOH', tenAxit: 'palmitic acid', no: true, esterMe: 'C₁₅H₃₁COOCH₃', tenEsterMe: 'methyl palmitate' },
  { ten: 'triolein', ct: '(C₁₇H₃₃COO)₃C₃H₅', muoiNa: 'C₁₇H₃₃COONa', tenMuoiNa: 'sodium oleate', muoiK: 'C₁₇H₃₃COOK', tenMuoiK: 'potassium oleate', axit: '', tenAxit: 'oleic acid', no: false, esterMe: '', tenEsterMe: '' },
  { ten: 'trilinolein', ct: '(C₁₇H₃₁COO)₃C₃H₅', muoiNa: 'C₁₇H₃₁COONa', tenMuoiNa: 'sodium linoleate', muoiK: '', tenMuoiK: '', axit: '', tenAxit: 'linoleic acid', no: false, esterMe: '', tenEsterMe: '' },
]
const CHOT_BEO = 'Chất béo (RCOO)₃C₃H₅ + 3NaOH → 3RCOONa + C₃H₅(OH)₃: 1 mol chất béo cần 3 mol NaOH, tạo 3 mol muối và 1 mol glycerol.'
const KT_XP = ['xà phòng hoá', 'tính theo phương trình hoá học']
const khoiLuongMol = (r: Rng, Mc: number, lo: number, hi: number) => r.boi(lo, hi, lam(Mc / 100))

// ================================================================ HỌ 6. XÀ PHÒNG HOÁ
const XA_PHONG_HOA: MauDe[] = [
  {
    ma: 'xa_phong.biet.ester_don', dang: [XP_KL], muc: 'biet', tuKhoa: /NaOH|muối|alcohol|xà phòng hoá/,
    sinh(r, phan) {
      const e = r.chon(ESTER_DON), Me = M(e.ct), a = khoiLuongMol(r, Me, Me / 20, Me * 2.5), n = a / Me, muoi = r.so() < 0.6
      const Mm = M(e.muoi), Ma = M(e.ancol)
      if (muoi) {
        const kq = n * Mm
        const nhieu: Nhieu[] = [
          { giaTri: n * M(e.axit), viSao: `tính khối lượng acid ${e.axit} thay vì muối ${e.muoi}` },
          ...(e.muoiSai ? [{ giaTri: n * M(e.muoiSai), viSao: `nhầm gốc acid với gốc alcohol (viết muối ${e.muoiSai})` }] : []),
          { giaTri: a + n * MNAOH, viSao: 'cộng khối lượng NaOH mà quên trừ khối lượng alcohol' },
          { giaTri: n * Ma, viSao: 'tính khối lượng alcohol thay vì muối' },
          { giaTri: 2 * n * Mm, viSao: 'lấy 1 mol ester tạo 2 mol muối' },
        ]
        return soHoc(`Xà phòng hoá hoàn toàn ${vn(a)} gam ${e.ten} (${e.ct}) bằng dung dịch NaOH vừa đủ, thu được m gam muối. ${hoi(phan, 'm')}`, kq, nhieu,
          `n(${e.muoi}) = n(ester) ⇒ m = ${vn(a)} : ${Me} · ${Mm}`, [
            `${e.ct} + NaOH → ${e.muoi} + ${e.ancol}.`,
            `n(${e.muoi}) = n(ester) = ${vn(a)} : ${Me} ${bang(n)} mol ⇒ m = ${vnT(n)} · ${Mm} ${bang(kq)} gam.`,
          ], `Ester RCOOR' + NaOH → RCOONa + R'OH (tỉ lệ 1 : 1); muối mang gốc ACID, alcohol mang gốc R'.`, KT_XP)
      }
      const kq = n * Ma
      return soHoc(`Xà phòng hoá hoàn toàn ${vn(a)} gam ${e.ten} (${e.ct}) bằng dung dịch NaOH vừa đủ, thu được muối và m gam alcohol. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * Mm, viSao: 'tính khối lượng muối thay vì alcohol' },
        { giaTri: n * (Ma === 32 ? 46 : 32), viSao: `nhầm alcohol tạo thành (dùng M = ${Ma === 32 ? 46 : 32})` },
        { giaTri: 2 * n * Ma, viSao: 'lấy 1 mol ester tạo 2 mol alcohol' },
        { giaTri: a - n * Mm, viSao: 'bảo toàn khối lượng nhưng quên cộng khối lượng NaOH' },
      ], `n(${e.ancol}) = n(ester) ⇒ m = ${vn(a)} : ${Me} · ${Ma}`, [
        `${e.ct} + NaOH → ${e.muoi} + ${e.ancol}.`,
        `n(${e.ancol}) = n(ester) = ${vn(a)} : ${Me} ${bang(n)} mol ⇒ m = ${vnT(n)} · ${Ma} ${bang(kq)} gam.`,
      ], `Ester RCOOR' + NaOH → RCOONa + R'OH (tỉ lệ 1 : 1); alcohol mang gốc R' (phần sau "COO").`, KT_XP)
    },
  },
  {
    ma: 'xa_phong.biet.the_tich_naoh', dang: [XP_TT], muc: 'biet', tuKhoa: /mL|thể tích|dung dịch NaOH/,
    sinh(r, phan) {
      const e = r.chon(ESTER_DON), Me = M(e.ct), c = r.chon([0.5, 1, 1.5, 2]), a = khoiLuongMol(r, Me, Me / 20, Me / 2), n = a / Me, kq = n / c * 1000
      return soHoc(`Để xà phòng hoá hoàn toàn ${vn(a)} gam ${e.ten} (${e.ct}) cần vừa đủ V mL dung dịch NaOH ${vn(c)} M. ${hoi(phan, 'V')}`, kq, [
        { giaTri: n * c * 1000, viSao: `nhân nồng độ ${vn(c)} M thay vì chia` },
        { giaTri: 2 * kq, viSao: 'lấy tỉ lệ ester : NaOH = 1 : 2' },
        { giaTri: 3 * kq, viSao: 'lấy tỉ lệ 1 : 3 như chất béo' },
        { giaTri: a / M(e.axit) / c * 1000, viSao: `dùng M của acid ${e.axit} cho ester` },
      ], `n(NaOH) = n(ester) = ${vn(a)} : ${Me} ⇒ V = n : ${vn(c)}`, [
        `n(NaOH) = n(ester) = ${vn(a)} : ${Me} ${bang(n)} mol.`,
        `V = ${vnT(n)} : ${vn(c)} ${bang(n / c)} lít ${bang(kq)} mL.`,
      ], `Ester đơn chức (không phải ester của phenol): n(NaOH) = n(ester); V = n : C(M).`, [...KT_XP, 'nồng độ mol'])
    },
  },
  {
    ma: 'xa_phong.biet.glycerol', dang: [XP_KL, UD_KL], muc: 'biet', tuKhoa: /glycerol|chất béo|tristearin|triolein|tripalmitin/,
    sinh(r, phan) {
      const b = r.chon(CHAT_BEO), Mb = M(b.ct), u = r.chon(['gam', 'kg'] as const), a = r.boi(Mb / 100, Mb * 1.2, lam(Mb / 100)), n = a / Mb, kq = n * MGLY
      return soHoc(`Xà phòng hoá hoàn toàn ${vn(a)} ${u} ${b.ten} bằng dung dịch NaOH vừa đủ, thu được m ${u} glycerol. ${hoi(phan, 'm')}`, kq, [
        { giaTri: 3 * kq, viSao: 'lấy n(glycerol) = n(NaOH) = 3n(chất béo)' },
        { giaTri: n * 3 * M(b.muoiNa), viSao: 'tính khối lượng muối thay vì glycerol' },
        { giaTri: kq / 3, viSao: 'chia 3 khi đổi từ chất béo sang glycerol' },
        { giaTri: a / 3, viSao: 'lấy một phần ba khối lượng chất béo' },
      ], `n(glycerol) = n(chất béo) ⇒ m = ${vn(a)} : ${Mb} · 92`, [
        `${b.ct} + 3NaOH → 3${b.muoiNa} + C₃H₅(OH)₃.`,
        `n(C₃H₅(OH)₃) = n(${b.ten}) = ${vn(a)} : ${Mb} ${bang(n)} ${u === 'kg' ? 'kmol' : 'mol'} ⇒ m = ${vnT(n)} · 92 ${bang(kq)} ${u}.`,
      ], CHOT_BEO, KT_XP)
    },
  },
  {
    ma: 'xa_phong.hieu.muoi_chat_beo', dang: [XP_KL, UD_KL], muc: 'hieu', tuKhoa: /muối|xà phòng|chất béo|tristearin|triolein|tripalmitin/,
    sinh(r, phan) {
      const b = r.chon(CHAT_BEO), Mb = M(b.ct), u = r.chon(['gam', 'kg'] as const), a = r.boi(Mb / 100, Mb * 1.2, lam(Mb / 100)), n = a / Mb
      const Mm = M(b.muoiNa), kq = 3 * n * Mm
      return soHoc(`Xà phòng hoá hoàn toàn ${vn(a)} ${u} ${b.ten} bằng dung dịch NaOH vừa đủ, thu được m ${u} muối ${b.tenMuoiNa}. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * Mm, viSao: 'quên hệ số 3 (lấy 1 mol chất béo tạo 1 mol muối)' },
        { giaTri: a + 3 * n * MNAOH, viSao: 'cộng khối lượng NaOH mà quên trừ khối lượng glycerol' },
        { giaTri: n * MGLY, viSao: 'tính khối lượng glycerol thay vì muối' },
        { giaTri: 3 * n * (Mm - 22), viSao: 'tính khối lượng acid béo thay vì muối sodium' },
      ], `n(muối) = 3n(chất béo) ⇒ m = 3 · ${vn(a)} : ${Mb} · ${Mm}`, [
        `${b.ct} + 3NaOH → 3${b.muoiNa} + C₃H₅(OH)₃.`,
        `n(${b.muoiNa}) = 3 · ${vn(a)} : ${Mb} ${bang(3 * n)} ${u === 'kg' ? 'kmol' : 'mol'} ⇒ m = ${vnT(3 * n)} · ${Mm} ${bang(kq)} ${u}.`,
      ], CHOT_BEO, KT_XP)
    },
  },
  {
    ma: 'xa_phong.hieu.the_tich_kiem_chat_beo', dang: [XP_TT], muc: 'hieu', tuKhoa: /chất béo|tristearin|triolein|tripalmitin|KOH/,
    sinh(r, phan) {
      const b = r.chon(CHAT_BEO), Mb = M(b.ct), kiem = r.chon(['NaOH', 'KOH']), c = r.chon([0.5, 1, 1.5, 2]), a = r.boi(Mb / 100, Mb / 4, lam(Mb / 100))
      const n = a / Mb, nK = 3 * n, kq = nK / c * 1000
      return soHoc(`Để xà phòng hoá hoàn toàn ${vn(a)} gam ${b.ten} cần vừa đủ V mL dung dịch ${kiem} ${vn(c)} M. ${hoi(phan, 'V')}`, kq, [
        { giaTri: kq / 3, viSao: `quên hệ số 3 (lấy 1 mol chất béo cần 1 mol ${kiem})` },
        { giaTri: nK * c * 1000, viSao: `nhân nồng độ ${vn(c)} M thay vì chia` },
        { giaTri: a / M(b.muoiNa) / c * 1000, viSao: 'dùng M của muối thay cho M của chất béo và quên hệ số 3' },
        { giaTri: 3 * a / 284 / c * 1000, viSao: 'dùng M = 284 (stearic acid) thay cho M của chất béo' },
      ], `n(${kiem}) = 3n(chất béo) = 3 · ${vn(a)} : ${Mb} ⇒ V = n : ${vn(c)}`, [
        `n(${b.ten}) = ${vn(a)} : ${Mb} ${bang(n)} mol ⇒ n(${kiem}) = 3 · ${vnT(n)} ${bang(nK)} mol.`,
        `V = ${vnT(nK)} : ${vn(c)} ${bang(nK / c)} lít ${bang(kq)} mL.`,
      ], (kiem === 'KOH' ? CHOT_BEO.replace(/NaOH/g, 'KOH').replace(/RCOONa/g, 'RCOOK') : CHOT_BEO), [...KT_XP, 'nồng độ mol'])
    },
  },
  {
    ma: 'xa_phong.van_dung.the_tich_hon_hop', dang: [XP_TT], muc: 'van_dung', tuKhoa: /hỗn hợp/,
    sinh(r, phan) {
      const [e1, e2] = r.chon(CAP_DONG_PHAN), Me = M(e1.ct), c = r.chon([0.5, 1, 1.5, 2]), a = khoiLuongMol(r, Me, Me / 20, Me / 2), n = a / Me, kq = n / c * 1000
      return soHoc(`Xà phòng hoá hoàn toàn ${vn(a)} gam hỗn hợp X gồm ${e1.ten} (${e1.ct}) và ${e2.ten} (${e2.ct}) cần vừa đủ V mL dung dịch NaOH ${vn(c)} M. ${hoi(phan, 'V')}`, kq, [
        { giaTri: kq / 2, viSao: `cộng khối lượng mol hai chất (${2 * Me}) làm khối lượng mol của hỗn hợp` },
        { giaTri: 2 * kq, viSao: 'tính như mỗi chất nặng bằng cả hỗn hợp rồi cộng lại' },
        { giaTri: n * c * 1000, viSao: `nhân nồng độ ${vn(c)} M thay vì chia` },
        { giaTri: a / M(e1.muoi) / c * 1000, viSao: `dùng M của muối ${e1.muoi} thay cho M của ester` },
      ], `Hai ester đồng phân cùng M = ${Me} ⇒ n(X) = ${vn(a)} : ${Me} = n(NaOH)`, [
        `${e1.ct} và ${e2.ct} là đồng phân (cùng công thức phân tử, M = ${Me}) ⇒ n(X) = ${vn(a)} : ${Me} ${bang(n)} mol.`,
        `n(NaOH) = n(X) ${bang(n)} mol ⇒ V = ${vnT(n)} : ${vn(c)} ${bang(n / c)} lít ${bang(kq)} mL.`,
      ], 'Hỗn hợp ester đồng phân: dùng chung M; ester đơn chức n(NaOH) = n(ester).', [...KT_XP, 'hỗn hợp đồng phân'])
    },
  },
  {
    ma: 'xa_phong.van_dung.bao_toan_khoi_luong', dang: [XP_KL], muc: 'van_dung', tuKhoa: /chất béo X|bảo toàn|glycerol/,
    sinh(r, phan) {
      const b = r.chon(CHAT_BEO), Mb = M(b.ct), c = r.chon([0.5, 1, 2]), nN = r.chon([0.03, 0.06, 0.09, 0.12, 0.15, 0.18, 0.21, 0.24, 0.3, 0.36])
      const V = lam(nN / c * 1000)
      if (soLe(V) > 1) return null
      const a = lam(nN / 3 * Mb), nG = nN / 3, kq = a + nN * MNAOH - nG * MGLY
      return soHoc(`Xà phòng hoá hoàn toàn ${vn(a)} gam chất béo X cần vừa đủ ${vn(V)} mL dung dịch NaOH ${vn(c)} M, thu được glycerol và m gam muối. ${hoi(phan, 'm')}`, kq, [
        { giaTri: a + nN * MNAOH, viSao: 'quên trừ khối lượng glycerol khi bảo toàn khối lượng' },
        { giaTri: a + nN * MNAOH - nN * MGLY, viSao: 'lấy n(glycerol) = n(NaOH) (quên chia 3)' },
        { giaTri: a + nN * MNAOH + nG * MGLY, viSao: 'cộng khối lượng glycerol thay vì trừ' },
        { giaTri: a - nG * MGLY, viSao: 'quên cộng khối lượng NaOH' },
      ], `m(muối) = m(X) + m(NaOH) − m(glycerol); n(glycerol) = n(NaOH) : 3`, [
        `n(NaOH) = ${vn(V)} · ${vn(c)} : 1000 = ${vn(nN)} mol ⇒ n(C₃H₅(OH)₃) = ${vn(nN)} : 3 = ${vn(lam(nG))} mol.`,
        `Bảo toàn khối lượng: m = ${vn(a)} + ${vn(nN)} · 40 − ${vn(lam(nG))} · 92 ${bang(kq)} gam.`,
      ], `${CHOT_BEO} Bảo toàn khối lượng: m(chất béo) + m(NaOH) = m(muối) + m(glycerol).`, [...KT_XP, 'bảo toàn khối lượng'])
    },
  },
  {
    ma: 'xa_phong.van_dung.xa_phong', dang: [UD_KL, XP_KL], muc: 'van_dung', tuKhoa: /xà phòng chứa|sản xuất xà phòng|xà phòng/,
    sinh(r, phan) {
      const b = r.chon(CHAT_BEO), Mb = M(b.ct), A = r.chon([50, 100, 150, 200, 250, 300, 400, 500]), p = r.chon([70, 75, 80, 85, 89, 90]), q = r.chon([60, 65, 70, 72, 75, 80])
      const H = r.chon(H_DEP), Mm = M(b.muoiNa), n = A * p / 100 / Mb, mM = 3 * n * Mm * H / 100, kq = mM / (q / 100)
      return soHoc(`Từ ${vn(A)} kg chất béo chứa ${p}% ${b.ten} về khối lượng (còn lại là tạp chất không phản ứng), người ta sản xuất xà phòng chứa ${q}% ${b.tenMuoiNa} về khối lượng; hiệu suất phản ứng xà phòng hoá là ${H}%. Khối lượng xà phòng thu được là m kg. ${hoi(phan, 'm')}`, kq, [
        { giaTri: mM * q / 100, viSao: `nhân ${q}% thay vì chia (xà phòng nặng hơn lượng muối chứa trong nó)` },
        { giaTri: mM, viSao: `dừng ở khối lượng muối, quên chia ${q}%` },
        { giaTri: kq / 3, viSao: 'quên hệ số 3 (lấy 1 mol chất béo tạo 1 mol muối)' },
        { giaTri: kq / (p / 100), viSao: `quên hàm lượng ${p}% ${b.ten}` },
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
      ], `m = ${vn(A)} · ${p}% : ${Mb} · 3 · ${Mm} · ${H}% : ${q}%`, [
        `n(${b.ten}) = ${vn(A)} · ${p}% : ${Mb} ${bang(n)} kmol ⇒ n(${b.muoiNa}) = 3 · ${vnT(n)} · ${H}% ${bang(3 * n * H / 100)} kmol.`,
        `m(muối) = ${vnT(3 * n * H / 100)} · ${Mm} ${bang(mM)} kg ⇒ m(xà phòng) = ${vnT(mM)} : ${q}% ${bang(kq)} kg.`,
      ], `${CHOT_BEO} Xà phòng chứa q% muối ⇒ m xà phòng = m muối : q%.`, [...KT_XP, 'hàm lượng chất trong sản phẩm', 'hiệu suất phản ứng'])
    },
  },
  {
    ma: 'xa_phong.van_dung.so_do', dang: [UD_KL, XP_KL], muc: 'van_dung', tuKhoa: /sơ đồ|→|chất Z|chất hữu cơ Z/,
    sinh(r, phan) {
      const b = r.chon(CHAT_BEO), Mb = M(b.ct), A = r.chon([50, 80, 100, 120, 150, 200, 250, 300]), H = r.chon(H_DEP)
      let sd: string, Z: string, tenZ: string, buocZ: string
      if (!b.no) {
        sd = `${b.ten} →(+H₂ dư, Ni, t°) X →(+NaOH, t°) Y →(+HCl) Z`
        Z = 'C₁₇H₃₅COOH'; tenZ = 'stearic acid'; buocZ = `X là tristearin, Y là C₁₇H₃₅COONa, Z là C₁₇H₃₅COOH (stearic acid, M = 284).`
      } else if (r.so() < 0.5) {
        sd = `${b.ten} →(+NaOH, t°) X →(+HCl) Z`
        Z = b.axit; tenZ = b.tenAxit; buocZ = `X là ${b.muoiNa}, Z là ${b.axit} (${b.tenAxit}, M = ${M(b.axit)}).`
      } else {
        sd = `${b.ten} →(+NaOH, t°) X →(+HCl) Y →(+CH₃OH, H₂SO₄ đặc, t°) Z`
        Z = b.esterMe; tenZ = b.tenEsterMe; buocZ = `X là ${b.muoiNa}, Y là ${b.axit}, Z là ${b.esterMe} (${b.tenEsterMe}, M = ${M(b.esterMe)}).`
      }
      const Mz = M(Z), n = A / Mb, kq = 3 * n * Mz * H / 100
      const Mmuoi = M(b.no ? b.muoiNa : 'C₁₇H₃₅COONa')
      return soHoc(`Từ ${vn(A)} kg ${b.ten} điều chế chất hữu cơ Z theo sơ đồ: ${sd}. Biết hiệu suất của toàn bộ quá trình là ${H}%, khối lượng Z thu được là m kg. ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq / 3, viSao: 'quên hệ số 3 (1 mol chất béo cho 3 mol gốc acid béo)' },
        { giaTri: 3 * n * Mmuoi * H / 100, viSao: 'dừng ở muối sodium (nhầm Z là muối)' },
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: kq * (H / 100) ** -2, viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: n * MGLY * H / 100, viSao: 'tính glycerol thay vì Z' },
      ], `Z là ${Z}; m = 3 · ${vn(A)} : ${Mb} · ${Mz} · ${H}%`, [
        buocZ,
        `n(${b.ten}) = ${vn(A)} : ${Mb} ${bang(n)} kmol ⇒ n(Z) = 3 · ${vnT(n)} · ${H}% ${bang(3 * n * H / 100)} kmol.`,
        `m(Z) = ${vnT(3 * n * H / 100)} · ${Mz} ${bang(kq)} kg.`,
      ], `${CHOT_BEO} Theo sơ đồ: 1 mol chất béo → 3 mol ${tenZ} (Z).`, [...KT_XP, 'chuỗi phản ứng chất béo', 'hiệu suất phản ứng'])
    },
  },
]

// ================================================================ HỌ 7. HIỆU SUẤT ESTER HOÁ
interface CapEster { axit: string; tenAxit: string; Da: number; ancol: string; tenAncol: string; Db: number; ester: string; tenEster: string; De: number }
const CAP_ESTER: readonly CapEster[] = [
  { axit: 'CH₃COOH', tenAxit: 'acetic acid', Da: 1.05, ancol: 'C₂H₅OH', tenAncol: 'ethanol', Db: 0.79, ester: 'CH₃COOC₂H₅', tenEster: 'ethyl acetate', De: 0.9 },
  { axit: 'CH₃COOH', tenAxit: 'acetic acid', Da: 1.05, ancol: 'CH₃OH', tenAncol: 'methanol', Db: 0.79, ester: 'CH₃COOCH₃', tenEster: 'methyl acetate', De: 0.93 },
  { axit: 'HCOOH', tenAxit: 'formic acid', Da: 1.22, ancol: 'C₂H₅OH', tenAncol: 'ethanol', Db: 0.79, ester: 'HCOOC₂H₅', tenEster: 'ethyl formate', De: 0.92 },
  { axit: 'C₂H₅COOH', tenAxit: 'propanoic acid', Da: 0.99, ancol: 'C₂H₅OH', tenAncol: 'ethanol', Db: 0.79, ester: 'C₂H₅COOC₂H₅', tenEster: 'ethyl propanoate', De: 0.89 },
  { axit: 'CH₃COOH', tenAxit: 'acetic acid', Da: 1.05, ancol: '(CH₃)₂CHCH₂CH₂OH', tenAncol: 'isoamyl alcohol', Db: 0.81, ester: 'CH₃COOCH₂CH₂CH(CH₃)₂', tenEster: 'isoamyl acetate', De: 0.88 },
]
const ptEster = (c: CapEster) => `${c.axit} + ${c.ancol} ⇌ ${c.ester} + H₂O`
const CHOT_EH = 'Ester hoá: RCOOH + R\'OH ⇌ RCOOR\' + H₂O (H₂SO₄ đặc, t°), tỉ lệ 1 : 1; hiệu suất tính theo chất phản ứng HẾT (số mol nhỏ hơn).'
const KT_EH = ['phản ứng ester hoá', 'hiệu suất phản ứng']
/** Số mol hai chất đầu (khác nhau rõ) + khối lượng tương ứng (≤ 2 chữ số thập phân). */
function haiChat(r: Rng, c: CapEster): { nA: number; nB: number; a: number; b: number } | null {
  const nA = r.chon([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5]), nB = r.chon([0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6])
  if (Math.abs(nA - nB) < 0.05) return null
  const a = lam(nA * M(c.axit)), b = lam(nB * M(c.ancol))
  return soLe(a) > 2 || soLe(b) > 2 ? null : { nA, nB, a, b }
}

const ESTER_HOA: MauDe[] = [
  {
    ma: 'ester_hoa.biet.khoi_luong', dang: [EH_KL], muc: 'biet',
    sinh(r, phan) {
      const c = r.chon(CAP_ESTER), Ma = M(c.axit), Me = M(c.ester), a = r.boi(Ma / 10, Ma * 2, lam(Ma / 100)), H = r.chon(H_DEP), n = a / Ma, kq = n * Me * H / 100
      return soHoc(`Đun nóng ${vn(a)} gam ${c.tenAxit} (${c.axit}) với lượng dư ${c.tenAncol} (${c.ancol}) có H₂SO₄ đặc làm xúc tác. Biết hiệu suất phản ứng ester hoá là ${H}%, khối lượng ${c.tenEster} thu được là m gam. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * Me, viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: n * Me / (H / 100), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: n * (Ma + M(c.ancol)) * H / 100, viSao: 'quên tách H₂O khi tính M ester (lấy M acid + M alcohol)' },
        { giaTri: a * H / 100, viSao: 'lấy khối lượng ester bằng khối lượng acid' },
      ], `n(ester) = n(acid) · ${H}% ⇒ m = ${vn(a)} : ${Ma} · ${Me} · ${H}%`, [
        `${ptEster(c)}; alcohol dư nên tính theo acid.`,
        `n(${c.axit}) = ${vn(a)} : ${Ma} ${bang(n)} mol ⇒ n(ester) = ${vnT(n)} · ${H}% ${bang(n * H / 100)} mol.`,
        `m = ${vnT(n * H / 100)} · ${Me} ${bang(kq)} gam.`,
      ], CHOT_EH, KT_EH)
    },
  },
  {
    ma: 'ester_hoa.biet.hieu_suat', dang: [EH_HS], muc: 'biet',
    sinh(r, phan) {
      const c = r.chon(CAP_ESTER), Ma = M(c.axit), Me = M(c.ester), a = r.boi(Ma / 10, Ma * 2, lam(Ma / 100)), H = r.chon(H_DEP), lt = a / Ma * Me, b = lam(lt * H / 100)
      if (soLe(b) > 2) return null
      const kq = b / lt * 100
      return soHoc(`Đun nóng ${vn(a)} gam ${c.tenAxit} (${c.axit}) với lượng dư ${c.tenAncol} (${c.ancol}) có H₂SO₄ đặc làm xúc tác, thu được ${vn(b)} gam ${c.tenEster}. Hiệu suất phản ứng ester hoá là H%. ${hoi(phan, 'H')}`, kq, [
        { giaTri: b / (a / Ma * (Ma + M(c.ancol))) * 100, viSao: 'quên tách H₂O khi tính M ester (lấy M acid + M alcohol)' },
        { giaTri: b / a * 100, viSao: 'lấy khối lượng ester chia khối lượng acid' },
        { giaTri: 100 - kq, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
        { giaTri: kq / 2, viSao: 'lấy 1 mol acid tạo 2 mol ester' },
      ], `H = ${vn(b)} : ${vnT(lt)} · 100%`, [
        `m(ester) lí thuyết = ${vn(a)} : ${Ma} · ${Me} ${bang(lt)} gam (alcohol dư, tính theo acid).`,
        `H = ${vn(b)} : ${vnT(lt)} · 100% ${bang(kq)}%.`,
      ], CHOT_EH, [...KT_EH, 'tính hiệu suất'], { chinhXac: true, toiDa: 100 })
    },
  },
  {
    ma: 'ester_hoa.hieu.hieu_suat', dang: [EH_HS], muc: 'hieu',
    sinh(r, phan) {
      const c = r.chon(CAP_ESTER.slice(0, 4)), d = haiChat(r, c)
      if (!d) return null
      const Me = M(c.ester), H = r.chon(H_DEP), nMin = Math.min(d.nA, d.nB), nMax = Math.max(d.nA, d.nB), e = lam(nMin * H / 100 * Me)
      if (soLe(e) > 2) return null
      const kq = e / (nMin * Me) * 100, tenHet = d.nA < d.nB ? c.tenAxit : c.tenAncol
      return soHoc(`Đun nóng ${vn(d.a)} gam ${c.tenAxit} (${c.axit}) với ${vn(d.b)} gam ${c.tenAncol} (${c.ancol}) có H₂SO₄ đặc làm xúc tác, thu được ${vn(e)} gam ${c.tenEster}. Hiệu suất phản ứng ester hoá là H%. ${hoi(phan, 'H')}`, kq, [
        { giaTri: e / (nMax * Me) * 100, viSao: `tính hiệu suất theo chất dư (${d.nA < d.nB ? c.tenAncol : c.tenAxit})` },
        { giaTri: e / (nMin * (M(c.axit) + M(c.ancol))) * 100, viSao: 'quên tách H₂O khi tính M ester' },
        { giaTri: e / ((d.nA + d.nB) * Me) * 100, viSao: 'lấy tổng số mol hai chất đầu làm số mol ester lí thuyết' },
        { giaTri: 100 - kq, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
      ], `Tính theo ${tenHet} (hết): H = ${vn(e)} : (${vn(nMin)} · ${Me}) · 100%`, [
        `n(${c.axit}) = ${vn(d.a)} : ${M(c.axit)} = ${vn(d.nA)} mol; n(${c.ancol}) = ${vn(d.b)} : ${M(c.ancol)} = ${vn(d.nB)} mol ⇒ ${tenHet} hết, tính theo ${tenHet}.`,
        `m(ester) lí thuyết = ${vn(nMin)} · ${Me} = ${vn(lam(nMin * Me))} gam ⇒ H = ${vn(e)} : ${vn(lam(nMin * Me))} · 100% ${bang(kq)}%.`,
      ], CHOT_EH, [...KT_EH, 'chất dư – chất hết'], { chinhXac: true, toiDa: 100 })
    },
  },
  {
    ma: 'ester_hoa.hieu.khoi_luong', dang: [EH_KL], muc: 'hieu',
    sinh(r, phan) {
      const c = r.chon(CAP_ESTER.slice(0, 4)), d = haiChat(r, c)
      if (!d) return null
      const Me = M(c.ester), H = r.chon(H_DEP), nMin = Math.min(d.nA, d.nB), nMax = Math.max(d.nA, d.nB), kq = nMin * H / 100 * Me
      const tenHet = d.nA < d.nB ? c.tenAxit : c.tenAncol
      return soHoc(`Đun nóng ${vn(d.a)} gam ${c.tenAxit} (${c.axit}) với ${vn(d.b)} gam ${c.tenAncol} (${c.ancol}) có H₂SO₄ đặc làm xúc tác. Biết hiệu suất phản ứng ester hoá là ${H}%, khối lượng ${c.tenEster} thu được là m gam. ${hoi(phan, 'm')}`, kq, [
        { giaTri: nMax * H / 100 * Me, viSao: `tính theo chất dư (${d.nA < d.nB ? c.tenAncol : c.tenAxit})` },
        { giaTri: nMin * Me, viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: nMin * Me / (H / 100), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: (d.nA + d.nB) * H / 100 * Me, viSao: 'cộng số mol hai chất đầu làm số mol ester' },
      ], `Tính theo ${tenHet} (hết): m = ${vn(nMin)} · ${H}% · ${Me}`, [
        `n(${c.axit}) = ${vn(d.nA)} mol; n(${c.ancol}) = ${vn(d.nB)} mol ⇒ ${tenHet} hết.`,
        `n(ester) = ${vn(nMin)} · ${H}% ${bang(nMin * H / 100)} mol ⇒ m = ${vnT(nMin * H / 100)} · ${Me} ${bang(kq)} gam.`,
      ], CHOT_EH, [...KT_EH, 'chất dư – chất hết'])
    },
  },
  {
    ma: 'ester_hoa.van_dung.the_tich', dang: [EH_HS], muc: 'van_dung', tuKhoa: /mL|khối lượng riêng|D =|isoamyl/,
    sinh(r, phan) {
      const c = r.chon(CAP_ESTER), Ma = M(c.axit), Mb = M(c.ancol), Me = M(c.ester)
      const Va = r.chon([3, 4, 5, 6, 8, 10, 12, 15]), Vb = r.chon([3, 4, 5, 6, 8, 10, 12, 15, 20]), H = r.chon(H_DEP)
      const nA = Va * c.Da / Ma, nB = Vb * c.Db / Mb
      if (Math.abs(nA - nB) / Math.max(nA, nB) < 0.15) return null
      const nMin = Math.min(nA, nB), Ve = lam(Math.round(nMin * H / 100 * Me / c.De * 100) / 100)
      if (Ve <= 0) return null
      const nE = Ve * c.De / Me, kq = nE / nMin * 100, nMax = Math.max(nA, nB), tenHet = nA < nB ? c.tenAxit : c.tenAncol
      return soHoc(`Đun nóng ${vn(Va)} mL ${c.tenAxit} (${c.axit}, D = ${vn(c.Da)} g/mL) với ${vn(Vb)} mL ${c.tenAncol} (${c.ancol}, D = ${vn(c.Db)} g/mL) có H₂SO₄ đặc làm xúc tác, thu được ${vn(Ve)} mL ${c.tenEster} (D = ${vn(c.De)} g/mL). Hiệu suất phản ứng ester hoá là H%. ${hoi(phan, 'H')}`, kq, [
        { giaTri: nE / nMax * 100, viSao: `tính hiệu suất theo chất dư (${nA < nB ? c.tenAncol : c.tenAxit})` },
        { giaTri: (Ve / Me) / Math.min(Va / Ma, Vb / Mb) * 100, viSao: 'quên khối lượng riêng (coi 1 mL nặng 1 gam)' },
        { giaTri: (Ve / Me * c.De) / Math.min(Va / Ma, Vb / Mb) * 100, viSao: 'chỉ nhân khối lượng riêng của ester, quên khối lượng riêng của chất đầu' },
        { giaTri: Ve / (nA < nB ? Va : Vb) * 100, viSao: 'lấy tỉ lệ thể tích ester : thể tích chất đầu' },
        { giaTri: nE / (nA + nB) * 100, viSao: 'lấy tổng số mol hai chất đầu làm lượng lí thuyết' },
      ], `H = n(ester) : n(${tenHet}) · 100%`, [
        `n(${c.axit}) = ${vn(Va)} · ${vn(c.Da)} : ${Ma} ${bang(nA)} mol; n(${c.ancol}) = ${vn(Vb)} · ${vn(c.Db)} : ${Mb} ${bang(nB)} mol ⇒ ${tenHet} hết.`,
        `n(ester) = ${vn(Ve)} · ${vn(c.De)} : ${Me} ${bang(nE)} mol.`,
        `H = ${vnT(nE)} : ${vnT(nMin)} · 100% ${bang(kq)}%.`,
      ], `${CHOT_EH} Đổi thể tích ra khối lượng: m = D · V.`, [...KT_EH, 'khối lượng riêng', 'chất dư – chất hết'], { toiDa: 100 })
    },
  },
  {
    ma: 'ester_hoa.van_dung.methyl_salicylate', dang: [EH_KL], muc: 'van_dung', tuKhoa: /salicyl|tuýp|thuốc/,
    sinh(r, phan) {
      const a = r.chon([2.76, 4.14, 5.52, 6.9, 8.28, 9.66, 11.04, 13.8, 18.63, 20.7, 27.6]), q = r.chon([1.8, 2.4, 2.7, 3, 3.6, 4.5, 5.4]), H = r.chon(H_DEP)
      const n = a / 138, mE = n * 152 * H / 100, kq = mE / q
      return soHoc(`Methyl salicylate (C₈H₈O₃) dùng làm thuốc xoa bóp giảm đau, được điều chế theo phản ứng: HOC₆H₄COOH + CH₃OH ⇌ HOC₆H₄COOCH₃ + H₂O (H₂SO₄ đặc, t°). Từ ${vn(a)} tấn salicylic acid (C₇H₆O₃) sản xuất được x triệu tuýp thuốc, mỗi tuýp chứa ${vn(q)} gam methyl salicylate. Biết hiệu suất phản ứng tính theo salicylic acid là ${H}%. ${hoi(phan, 'x')}`, kq, [
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: kq * (H / 100) ** -2, viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: a * H / 100 / q, viSao: 'lấy khối lượng sản phẩm bằng khối lượng salicylic acid' },
        { giaTri: n * 170 * H / 100 / q, viSao: 'quên tách H₂O (lấy M sản phẩm = 138 + 32)' },
      ], `x = ${vn(a)} : 138 · 152 · ${H}% : ${vn(q)}`, [
        `${vn(a)} tấn = ${vn(a)} · 10⁶ gam ⇒ n(C₇H₆O₃) = ${vn(a)} · 10⁶ : 138 ${bang(n)} · 10⁶ mol.`,
        `m(C₈H₈O₃) = ${vnT(n)} · 10⁶ · 152 · ${H}% ${bang(mE)} · 10⁶ gam.`,
        `Số tuýp = ${vnT(mE)} · 10⁶ : ${vn(q)} ${bang(kq)} triệu tuýp.`,
      ], 'Ester hoá tỉ lệ 1 : 1; khối lượng sản phẩm = số mol acid × hiệu suất × M ester.', [...KT_EH, 'ứng dụng ester'])
    },
  },
]

// ================================================================ HỌ 8. ĐỐT CHÁY ESTER NO, ĐƠN CHỨC, MẠCH HỞ → CÔNG THỨC PHÂN TỬ
const SO_DUOI = '₀₁₂₃₄₅₆₇₈₉'
const chiSo = (k: number) => (k === 1 ? '' : String(k).split('').map((d) => SO_DUOI[Number(d)]).join(''))
const ctEster = (n: number, h = 2 * n) => `C${chiSo(n)}H${chiSo(h)}O₂`
const CHOT_DC = 'Ester no, đơn chức, mạch hở CₙH₂ₙO₂ (n ≥ 2): n(CO₂) = n(H₂O); số C = n(CO₂) : n(ester); M = 14n + 32.'
const KT_DC = ['đốt cháy ester', 'công thức phân tử']
/** Hỏi Phần III: phân tử khối / số nguyên tử C / số nguyên tử H (luân phiên). */
function hoiCtpt(r: Rng, phan: Phan, n: number): { cau: string; giaTri: number; ten: string } {
  if (phan === 'I') return { cau: 'Công thức phân tử của X là', giaTri: n, ten: '' }
  const k = r.chon(['M', 'C', 'H'] as const)
  if (k === 'M') return { cau: 'Phân tử khối của X là bao nhiêu?', giaTri: 14 * n + 32, ten: 'phân tử khối' }
  if (k === 'C') return { cau: 'Số nguyên tử carbon trong một phân tử X là bao nhiêu?', giaTri: n, ten: 'số nguyên tử carbon' }
  return { cau: 'Số nguyên tử hydrogen trong một phân tử X là bao nhiêu?', giaTri: 2 * n, ten: 'số nguyên tử hydrogen' }
}
/** Phần I: 4 công thức hợp lệ (ester đồng đẳng, ester không no cùng số C); Phần III: đáp số nguyên. */
function lapCtpt(de: string, n: number, h: { cau: string; giaTri: number; ten: string }, buoc: string[], lyDo: string): BanSinh {
  const nhieu: Nhieu[] = []
  for (const k of [n + 1, n - 1, n + 2, n - 2]) if (k >= 2 && k <= 9) nhieu.push({ chu: ctEster(k), viSao: `lấy số nguyên tử C bằng ${k} (sai khi chia số mol)` })
  if (n >= 3) nhieu.splice(1, 0, { chu: ctEster(n, 2 * n - 2), viSao: 'coi X là ester không no (CₙH₂ₙ₋₂O₂), trong khi ester no, đơn chức có n(H₂O) = n(CO₂)' })
  const ketLuan = `X là ${ctEster(n)}${h.ten ? ` ⇒ ${h.ten} = ${h.giaTri}` : ''}.`
  if (h.ten) return { de: `${de} ${h.cau}`, kieu: 'so', giaTri: h.giaTri, chinhXac: true, nhieu: [], lyDoDung: lyDo, buoc: [...buoc, ketLuan], chot: CHOT_DC, kienThuc: KT_DC }
  return { de: `${de} ${h.cau}`, kieu: 'chu', dapAnChu: ctEster(n), nhieu, lyDoDung: lyDo, buoc: [...buoc, ketLuan], chot: CHOT_DC, kienThuc: KT_DC }
}
/** Số mol ester đề cho: bội 0,01 (số mol CO₂ = n · nX có ≤ 2 chữ số thập phân). */
const nEster = (r: Rng, lo: number, hi: number) => r.boi(lo, hi, 0.01)
const DOT_CHAY: MauDe[] = [
  {
    ma: 'dot_chay.biet.so_mol', dang: [DC_CT], muc: 'biet',
    sinh(r, phan) {
      const n = r.nguyen(2, 7), nX = nEster(r, 0.01, 0.5), nC = lam(n * nX)
      const h = hoiCtpt(r, phan, n)
      const sp = r.so() < 0.5 ? `${vn(nC)} mol CO₂` : `${vn(nC)} mol H₂O`
      return lapCtpt(`Đốt cháy hoàn toàn ${vn(nX)} mol ester X no, đơn chức, mạch hở, thu được ${sp}.`, n, h,
        [`Ester no, đơn chức, mạch hở CₙH₂ₙO₂ cháy cho n(CO₂) = n(H₂O) = n · n(X).`, `Số nguyên tử C = ${vn(nC)} : ${vn(nX)} = ${n} ⇒ X là ${ctEster(n)}.`],
        `số C = ${vn(nC)} : ${vn(nX)} = ${n}`)
    },
  },
  {
    ma: 'dot_chay.hieu.khoi_luong_the_tich', dang: [DC_CT], muc: 'hieu',
    sinh(r, phan) {
      const n = r.nguyen(2, 7), nX = nEster(r, 0.01, 0.25), m = lam(nX * (14 * n + 32)), nC = lam(n * nX)
      const loai = r.nguyen(0, 2)
      const sp = loai === 0 ? `${vn(lam(nC * V_KHI))} lít khí CO₂ ${CHU_DKC}` : loai === 1 ? `${vn(lam(nC * 18))} gam H₂O` : `${vn(lam(nC * 44))} gam CO₂`
      const doi = loai === 0 ? `n(CO₂) = ${vn(lam(nC * V_KHI))} : 24,79` : loai === 1 ? `n(H₂O) = ${vn(lam(nC * 18))} : 18` : `n(CO₂) = ${vn(lam(nC * 44))} : 44`
      const h = hoiCtpt(r, phan, n)
      return lapCtpt(`Đốt cháy hoàn toàn ${vn(m)} gam ester X no, đơn chức, mạch hở, thu được ${sp}.`, n, h, [
        `${doi} = ${vn(nC)} mol; ester no, đơn chức CₙH₂ₙO₂ có n(CO₂) = n(H₂O) ⇒ n(X) = ${vn(nC)} : n.`,
        `m(X) = (${vn(nC)} : n) · (14n + 32) = ${vn(m)} ⇒ n = 32 · ${vn(nC)} : (${vn(m)} − 14 · ${vn(nC)}) = ${n}.`,
      ], `n = 32 · n(CO₂) : (m − 14 · n(CO₂)) = ${n}`)
    },
  },
  {
    ma: 'dot_chay.van_dung.ket_tua', dang: [DC_CT], muc: 'van_dung', tuKhoa: /Ca\(OH\)₂|kết tủa|bình/,
    sinh(r, phan) {
      const n = r.nguyen(2, 7), nX = nEster(r, 0.01, 0.2), m = lam(nX * (14 * n + 32)), nC = lam(n * nX), k = lam(nC * 100)
      const h = hoiCtpt(r, phan, n)
      return lapCtpt(`Đốt cháy hoàn toàn ${vn(m)} gam ester X no, đơn chức, mạch hở rồi hấp thụ hết sản phẩm cháy vào dung dịch Ca(OH)₂ dư, thu được ${vn(k)} gam kết tủa.`, n, h, [
        `n(CO₂) = n(CaCO₃) = ${vn(k)} : 100 = ${vn(nC)} mol.`,
        `X là CₙH₂ₙO₂: (${vn(nC)} : n) · (14n + 32) = ${vn(m)} ⇒ n = 32 · ${vn(nC)} : (${vn(m)} − 14 · ${vn(nC)}) = ${n}.`,
      ], `n(CO₂) = ${vn(nC)} mol ⇒ n = ${n}`)
    },
  },
  {
    ma: 'dot_chay.van_dung.oxygen', dang: [DC_CT], muc: 'van_dung', tuKhoa: /O₂|oxygen/,
    sinh(r, phan) {
      const n = r.nguyen(2, 7), nX = r.boi(0.02, 0.2, 0.02), m = lam(nX * (14 * n + 32)), nO = lam(nX * (3 * n - 2) / 2), V = lam(nO * V_KHI)
      const h = hoiCtpt(r, phan, n)
      return lapCtpt(`Đốt cháy hoàn toàn ${vn(m)} gam ester X no, đơn chức, mạch hở cần vừa đủ ${vn(V)} lít khí O₂ ${CHU_DKC}.`, n, h, [
        `n(O₂) = ${vn(V)} : 24,79 = ${vn(nO)} mol. CₙH₂ₙO₂ + (3n − 2)/2 O₂ → nCO₂ + nH₂O.`,
        `${vn(m)} : (14n + 32) · (3n − 2) : 2 = ${vn(nO)} ⇒ n = ${n}.`,
      ], `giải ${vn(m)} : (14n + 32) · (3n − 2) : 2 = ${vn(nO)} được n = ${n}`)
    },
  },
]

// ================================================================ HỌ 9. CHỈ SỐ ACID / CHỈ SỐ XÀ PHÒNG HOÁ
const DN_ACID = 'Chỉ số acid của chất béo là số miligam KOH cần để trung hoà hết lượng acid béo tự do có trong 1 gam chất béo.'
const DN_XP = 'Chỉ số xà phòng hoá là số miligam KOH cần để xà phòng hoá hết triglyceride và trung hoà hết acid béo tự do có trong 1 gam chất béo.'
const KT_CS = ['chỉ số chất béo', 'phản ứng trung hoà']
const CAP_BEO_ACID: readonly { tg: ChatBeo; axit: string; tenAxit: string }[] = [
  { tg: CHAT_BEO[0]!, axit: 'C₁₇H₃₅COOH', tenAxit: 'stearic acid' },
  { tg: CHAT_BEO[1]!, axit: 'C₁₅H₃₁COOH', tenAxit: 'palmitic acid' },
]
const CHI_SO: MauDe[] = [
  {
    ma: 'chi_so.biet.acid_koh', dang: [CS_CS], muc: 'biet',
    sinh(r, phan) {
      const m = r.chon([2, 2.5, 4, 5, 8, 10, 14, 20]), V = r.chon([2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15]), c = r.chon([0.05, 0.1, 0.2]), mmol = V * c, kq = mmol * MKOH / m
      return soHoc(`${DN_ACID} Để trung hoà lượng acid béo tự do có trong ${vn(m)} gam một loại chất béo cần vừa đủ ${vn(V)} mL dung dịch KOH ${vn(c)} M. Chỉ số acid của chất béo đó là x. ${hoi(phan, 'x')}`, kq, [
        { giaTri: mmol * 40 / m, viSao: 'dùng M = 40 (của NaOH) thay cho M = 56 của KOH' },
        { giaTri: 3 * kq, viSao: 'nhân 3 như khi xà phòng hoá triglyceride' },
        { giaTri: mmol * MKOH / V, viSao: 'chia cho thể tích dung dịch thay vì khối lượng chất béo' },
        { giaTri: mmol * MKOH, viSao: 'quên chia cho khối lượng chất béo' },
      ], `x = ${vn(V)} · ${vn(c)} · 56 : ${vn(m)}`, [
        `n(KOH) = ${vn(V)} · ${vn(c)} = ${vn(lam(mmol))} mmol ⇒ m(KOH) = ${vn(lam(mmol))} · 56 = ${vn(lam(mmol * MKOH))} mg.`,
        `Chỉ số acid = ${vn(lam(mmol * MKOH))} : ${vn(m)} ${bang(kq)}.`,
      ], 'Chỉ số acid = số mg KOH trung hoà acid béo tự do trong 1 gam chất béo (mL × M = mmol).', KT_CS)
    },
  },
  {
    ma: 'chi_so.hieu.acid_naoh', dang: [CS_CS], muc: 'hieu', tuKhoa: /NaOH/,
    sinh(r, phan) {
      const m = r.chon([2, 4, 5, 8, 10, 14, 20, 25]), V = r.chon([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]), c = r.chon([0.05, 0.1, 0.2]), mmol = V * c, kq = mmol * MKOH / m
      return soHoc(`${DN_ACID} Để trung hoà lượng acid béo tự do có trong ${vn(m)} gam một mẫu dầu thực vật cần vừa đủ ${vn(V)} mL dung dịch NaOH ${vn(c)} M. Chỉ số acid của mẫu dầu đó là x. ${hoi(phan, 'x')}`, kq, [
        { giaTri: mmol * MNAOH / m, viSao: 'tính số mg NaOH, quên quy ra số mg KOH tương đương' },
        { giaTri: 3 * kq, viSao: 'nhân 3 như khi xà phòng hoá triglyceride' },
        { giaTri: mmol * MKOH / V, viSao: 'chia cho thể tích dung dịch thay vì khối lượng mẫu dầu' },
        { giaTri: kq / 2, viSao: 'lấy tỉ lệ acid béo : kiềm = 2 : 1' },
      ], `n(KOH tương đương) = n(NaOH) ⇒ x = ${vn(V)} · ${vn(c)} · 56 : ${vn(m)}`, [
        `n(NaOH) = ${vn(V)} · ${vn(c)} = ${vn(lam(mmol))} mmol = n(KOH) tương đương (cùng trung hoà 1 : 1).`,
        `m(KOH) = ${vn(lam(mmol))} · 56 = ${vn(lam(mmol * MKOH))} mg ⇒ chỉ số acid = ${vn(lam(mmol * MKOH))} : ${vn(m)} ${bang(kq)}.`,
      ], 'Chỉ số acid tính theo KOH (M = 56) kể cả khi chuẩn độ bằng NaOH: quy số mmol NaOH ra số mmol KOH.', KT_CS)
    },
  },
  {
    ma: 'chi_so.hieu.the_tich_koh', dang: [CS_TT], muc: 'hieu',
    sinh(r, phan) {
      const x = r.chon([2.8, 4.2, 5.6, 7, 8.4, 11.2, 14]), m = r.chon([5, 10, 20, 25, 40, 50, 100]), c = r.chon([0.05, 0.1, 0.2, 0.5]), mg = x * m, kq = mg / MKOH / c
      return soHoc(`${DN_ACID} Một loại chất béo có chỉ số acid bằng ${vn(x)}. Để trung hoà lượng acid béo tự do có trong ${vn(m)} gam chất béo này cần vừa đủ V mL dung dịch KOH ${vn(c)} M. ${hoi(phan, 'V')}`, kq, [
        { giaTri: mg / MKOH * c, viSao: `nhân nồng độ ${vn(c)} M thay vì chia` },
        { giaTri: mg / 40 / c, viSao: 'dùng M = 40 (NaOH) cho KOH' },
        { giaTri: x / MKOH / c, viSao: `quên nhân khối lượng ${vn(m)} gam chất béo` },
        { giaTri: 3 * kq, viSao: 'nhân 3 như khi xà phòng hoá triglyceride' },
      ], `V = ${vn(x)} · ${vn(m)} : 56 : ${vn(c)}`, [
        `m(KOH) = ${vn(x)} · ${vn(m)} ${bang(mg)} mg ⇒ n(KOH) = ${vnT(mg)} : 56 ${bang(mg / MKOH)} mmol.`,
        `V = ${vnT(mg / MKOH)} : ${vn(c)} ${bang(kq)} mL.`,
      ], 'Chỉ số acid × khối lượng chất béo (g) = số mg KOH cần dùng.', KT_CS)
    },
  },
  {
    ma: 'chi_so.van_dung.xa_phong_hoa', dang: [CS_CS], muc: 'van_dung', tuKhoa: /xà phòng hoá|xà phòng hóa|chỉ số ester/,
    sinh(r, phan) {
      const k = r.chon(CAP_BEO_ACID), p1 = r.chon([1.42, 2.13, 2.84, 3.55, 4.26, 5.68, 7.1]), p2 = r.chon([80, 85, 88, 89, 90, 92])
      const Ma = M(k.axit), Mt = M(k.tg.ct), nA = p1 / 100 / Ma, nT = p2 / 100 / Mt, kq = (nA + 3 * nT) * MKOH * 1000
      return soHoc(`${DN_XP} Một loại chất béo chứa ${vn(p1)}% ${k.tenAxit} (${k.axit}) và ${p2}% ${k.tg.ten} về khối lượng, còn lại là tạp chất không phản ứng với KOH. Chỉ số xà phòng hoá của chất béo đó là x. ${hoi(phan, 'x')}`, kq, [
        { giaTri: (nA + nT) * MKOH * 1000, viSao: 'quên hệ số 3 khi xà phòng hoá triglyceride' },
        { giaTri: 3 * nT * MKOH * 1000, viSao: 'bỏ sót lượng KOH trung hoà acid béo tự do' },
        { giaTri: (nA + 3 * nT) * 40 * 1000, viSao: 'dùng M = 40 (NaOH) thay cho M = 56 của KOH' },
        { giaTri: nA * MKOH * 1000, viSao: 'chỉ tính chỉ số acid (quên phần triglyceride)' },
      ], `x = (${vn(p1)}% : ${Ma} + 3 · ${p2}% : ${Mt}) · 56 · 1000`, [
        `Trong 1 gam chất béo: n(${k.axit}) = ${vn(p1 / 100)} : ${Ma} ${bang(nA)} mol; n(${k.tg.ten}) = ${vn(p2 / 100)} : ${Mt} ${bang(nT)} mol.`,
        `n(KOH) = ${vnT(nA)} + 3 · ${vnT(nT)} ${bang(nA + 3 * nT)} mol ⇒ m(KOH) ${bang(kq)} mg ⇒ chỉ số xà phòng hoá ${bang(kq)}.`,
      ], '1 mol acid béo tự do cần 1 mol KOH; 1 mol triglyceride cần 3 mol KOH; chỉ số = mg KOH cho 1 gam chất béo.', [...KT_CS, 'xà phòng hoá'])
    },
  },
]

export const HO_ESTER: readonly HoDe[] = [
  { ma: 'xa_phong_hoa', ten: 'Xà phòng hoá ester đơn chức và chất béo → muối, alcohol, glycerol, xà phòng; bảo toàn khối lượng', khoiChuong: 12, tuKhoa: /xà phòng|NaOH|KOH|chất béo|glycerol|tristearin|triolein|tripalmitin/, mau: XA_PHONG_HOA },
  { ma: 'ester_hoa', ten: 'Hiệu suất phản ứng ester hoá (chất dư – chất hết, khối lượng riêng)', khoiChuong: 12, tuKhoa: /ester hoá|ester hóa|H₂SO₄ đặc|isoamyl|salicyl/, mau: ESTER_HOA },
  { ma: 'dot_chay_ester', ten: 'Đốt cháy ester no, đơn chức, mạch hở → công thức phân tử', khoiChuong: 12, tuKhoa: /đốt cháy|CO₂|O₂/, mau: DOT_CHAY },
  { ma: 'chi_so_chat_beo', ten: 'Chỉ số acid, chỉ số xà phòng hoá của chất béo', khoiChuong: 12, tuKhoa: /chỉ số/, mau: CHI_SO },
]
