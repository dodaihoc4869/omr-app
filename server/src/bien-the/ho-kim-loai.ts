// BỘ SINH BIẾN THỂ — KIM LOẠI + ĐIỆN HOÁ (lớp 12): điều chế kim loại (nhiệt luyện, điện phân nóng chảy, luyện gang) · điện phân dung dịch / mạ điện
// (định luật Faraday m = A·I·t : (n·F)) · thứ tự khử ở cathode khi điện phân dung dịch hỗn hợp (câu "liệt kê thành dãy số").
// Nhiễu Phần I từ LỖI HAY GẶP: quên hệ số trong oxide (Fe₂O₃ → 2Fe), nhầm số electron trao đổi, quên đổi giờ/phút ra giây, quên hiệu suất dòng điện,
// O₂ ở anode lấy 2 mol e/mol thay vì 4, dùng 22,4 L/mol (điều kiện cũ), xếp E° ngược chiều… Bộ giải độc lập ở tests/bien-the-sinh-0510.test.ts.
import { CHU_DKC, CHU_F, F, M, NTK, V_KHI, bang, hoi, lam, soHoc, soLe, vn, vnT, type BanSinh, type HoDe, type MauDe, type Nhieu, type Phan } from './chung'

const DC_KL = 'KIM_LOAI.DIEU_CHE.TINH_KHOI_LUONG'
const DC_TT = 'KIM_LOAI.DIEU_CHE.TINH_THE_TICH'
const DC_HS = 'KIM_LOAI.DIEU_CHE.TINH_HIEU_SUAT'
const NC_KL = 'DIEN_PHAN.DIEN_PHAN_NC.TINH_KHOI_LUONG'
const NC_HS = 'DIEN_PHAN.DIEN_PHAN_NC.TINH_HIEU_SUAT'
const DD_KL = 'DIEN_PHAN.DIEN_PHAN_DD.TINH_KHOI_LUONG'
const DD_TT = 'DIEN_PHAN.DIEN_PHAN_DD.TINH_THE_TICH'
const DD_SS = 'DIEN_PHAN.DIEN_PHAN_DD.SO_SANH'
const MA_KL = 'DIEN_PHAN.MA_TINH_LUYEN.TINH_KHOI_LUONG'

const H_DEP = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95] as const
const H_DIEN = [80, 85, 90, 92, 95, 98] as const

// ================================================================ HỌ 10. ĐIỀU CHẾ KIM LOẠI
interface Oxide { ct: string; kl: string; k: number; o: number }
/** k = số nguyên tử kim loại, o = số nguyên tử O trong 1 phân tử oxide. */
const OXIDE: readonly Oxide[] = [
  { ct: 'Fe₂O₃', kl: 'Fe', k: 2, o: 3 }, { ct: 'Fe₃O₄', kl: 'Fe', k: 3, o: 4 }, { ct: 'CuO', kl: 'Cu', k: 1, o: 1 }, { ct: 'ZnO', kl: 'Zn', k: 1, o: 1 },
]
const CHAT_KHU = ['CO', 'H₂'] as const
const KT_DC = ['điều chế kim loại', 'phương pháp nhiệt luyện']
const chotNhietLuyen = 'Nhiệt luyện: oxide kim loại (sau Al) bị CO, H₂, C khử ở nhiệt độ cao; mỗi nguyên tử O trong oxide lấy đi 1 phân tử CO (hoặc H₂).'
/** Kim loại điều chế bằng điện phân nóng chảy: muối/oxide, số e trao đổi, khí ở anode. */
const NONG_CHAY: readonly { chat: string; kl: string; e: number; I: readonly number[]; ten: string }[] = [
  { chat: 'NaCl', kl: 'Na', e: 1, I: [10000, 20000, 30000, 40000, 50000], ten: 'sodium' },
  { chat: 'MgCl₂', kl: 'Mg', e: 2, I: [10000, 20000, 30000, 40000, 50000], ten: 'magnesium' },
  { chat: 'Al₂O₃', kl: 'Al', e: 3, I: [50000, 100000, 120000, 150000, 200000], ten: 'aluminium' },
]

const DIEU_CHE: MauDe[] = [
  {
    ma: 'dieu_che.biet.nhiet_luyen', dang: [DC_KL], muc: 'biet',
    sinh(r, phan) {
      const ox = r.chon(OXIDE), Mo = M(ox.ct), A = NTK[ox.kl]!, khu = r.chon(CHAT_KHU), a = r.boi(Mo / 20, Mo * 2, lam(Mo / 100)), n = a / Mo, kq = n * ox.k * A
      return soHoc(`Khử hoàn toàn ${vn(a)} gam ${ox.ct} bằng khí ${khu} dư ở nhiệt độ cao, thu được m gam ${ox.kl}. ${hoi(phan, 'm')}`, kq, [
        ...(ox.k > 1 ? [{ giaTri: n * A, viSao: `quên hệ số ${ox.k} (1 phân tử ${ox.ct} có ${ox.k} nguyên tử ${ox.kl})` }] : []),
        { giaTri: a - kq, viSao: `tính khối lượng O trong oxide thay vì khối lượng ${ox.kl}` },
        { giaTri: n * ox.o * A, viSao: `lấy số nguyên tử ${ox.kl} bằng số nguyên tử O (${ox.o})` },
        ...(ox.kl === 'Fe' ? [{ giaTri: a / M(ox.ct === 'Fe₂O₃' ? 'Fe₃O₄' : 'Fe₂O₃') * ox.k * A, viSao: `dùng nhầm khối lượng mol của ${ox.ct === 'Fe₂O₃' ? 'Fe₃O₄' : 'Fe₂O₃'}` }] : []),
        { giaTri: 2 * kq, viSao: 'nhân đôi số mol kim loại' },
      ], `n(${ox.kl}) = ${ox.k} · n(${ox.ct}) ⇒ m = ${ox.k} · ${vn(a)} : ${Mo} · ${A}`, [
        `n(${ox.ct}) = ${vn(a)} : ${Mo} ${bang(n)} mol ⇒ n(${ox.kl}) = ${ox.k} · ${vnT(n)} ${bang(n * ox.k)} mol.`,
        `m = ${vnT(n * ox.k)} · ${A} ${bang(kq)} gam.`,
      ], chotNhietLuyen, KT_DC)
    },
  },
  {
    ma: 'dieu_che.biet.hieu_suat', dang: [DC_HS], muc: 'biet', tuKhoa: /hiệu suất/,
    sinh(r, phan) {
      const ox = r.chon(OXIDE.filter((x) => x.ct !== 'Fe₃O₄')), Mo = M(ox.ct), A = NTK[ox.kl]!, a = r.boi(Mo / 10, Mo * 2, lam(Mo / 100)), H = r.chon(H_DEP)
      const lt = a / Mo * ox.k * A, b = lam(lt * H / 100)
      if (soLe(b) > 2) return null
      const kq = b / lt * 100
      return soHoc(`Khử ${vn(a)} gam ${ox.ct} bằng khí CO dư ở nhiệt độ cao, thu được ${vn(b)} gam ${ox.kl}. Hiệu suất của phản ứng khử là H%. ${hoi(phan, 'H')}`, kq, [
        { giaTri: b / a * 100, viSao: `lấy khối lượng ${ox.kl} chia khối lượng oxide` },
        ...(ox.k > 1 ? [{ giaTri: kq * ox.k, viSao: `quên hệ số ${ox.k} khi tính lượng ${ox.kl} lí thuyết` }] : []),
        { giaTri: 100 - kq, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
        { giaTri: kq / 2, viSao: `nhân đôi lượng ${ox.kl} lí thuyết` },
      ], `H = ${vn(b)} : ${vnT(lt)} · 100%`, [
        `m(${ox.kl}) lí thuyết = ${ox.k} · ${vn(a)} : ${Mo} · ${A} ${bang(lt)} gam.`,
        `H = ${vn(b)} : ${vnT(lt)} · 100% ${bang(kq)}%.`,
      ], chotNhietLuyen, [...KT_DC, 'tính hiệu suất'], { chinhXac: true, toiDa: 100 })
    },
  },
  {
    ma: 'dieu_che.hieu.the_tich_khi_khu', dang: [DC_TT], muc: 'hieu', tuKhoa: /thể tích|lít|CO|H₂/,
    sinh(r, phan) {
      const ox = r.chon(OXIDE), Mo = M(ox.ct), khu = r.chon(CHAT_KHU), a = r.boi(Mo / 20, Mo * 2, lam(Mo / 100)), n = a / Mo, nK = n * ox.o, kq = nK * V_KHI
      return soHoc(`Thể tích khí ${khu} ${CHU_DKC} tối thiểu cần dùng để khử hoàn toàn ${vn(a)} gam ${ox.ct} ở nhiệt độ cao là V lít. ${hoi(phan, 'V')}`, kq, [
        { giaTri: n * V_KHI, viSao: `lấy n(${khu}) = n(${ox.ct}) (quên ${ox.o} nguyên tử O)` },
        { giaTri: nK * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ) thay vì 24,79 L/mol ở đkc' },
        { giaTri: n * ox.k * V_KHI, viSao: `lấy n(${khu}) = n(${ox.kl}) tạo thành` },
        { giaTri: nK / 2 * V_KHI, viSao: `chia đôi số mol ${khu}` },
      ], `n(${khu}) = n(O trong oxide) = ${ox.o} · ${vn(a)} : ${Mo}`, [
        `${ox.ct} + ${ox.o}${khu} → ${ox.k > 1 ? ox.k : ''}${ox.kl} + ${ox.o}${khu === 'CO' ? 'CO₂' : 'H₂O'}.`,
        `n(${khu}) = ${ox.o} · ${vn(a)} : ${Mo} ${bang(nK)} mol ⇒ V = ${vnT(nK)} · 24,79 ${bang(kq)} lít.`,
      ], chotNhietLuyen, [...KT_DC, 'thể tích khí ở đkc'])
    },
  },
  {
    ma: 'dieu_che.hieu.hon_hop_oxide', dang: [DC_KL], muc: 'hieu', tuKhoa: /hỗn hợp|kết tủa|Ca\(OH\)₂/,
    sinh(r, phan) {
      const x = r.chon([0.02, 0.04, 0.05, 0.06, 0.08, 0.1, 0.12, 0.15]), y = r.chon([0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1])
      const a = lam(80 * x + 160 * y), nO = lam(x + 3 * y), k = lam(100 * nO), kq = a - 16 * nO
      return soHoc(`Khử hoàn toàn ${vn(a)} gam hỗn hợp X gồm CuO và Fe₂O₃ bằng khí CO dư ở nhiệt độ cao. Dẫn toàn bộ khí thoát ra vào dung dịch Ca(OH)₂ dư, thu được ${vn(k)} gam kết tủa. Khối lượng kim loại thu được là m gam. ${hoi(phan, 'm')}`, kq, [
        { giaTri: a - 44 * nO, viSao: 'trừ khối lượng CO₂ thay vì khối lượng O bị lấy đi' },
        { giaTri: a - 28 * nO, viSao: 'trừ khối lượng CO thay vì khối lượng O' },
        { giaTri: a - 32 * nO, viSao: 'tính khối lượng O bằng 32 · n (nhầm O₂)' },
        { giaTri: a + 16 * nO, viSao: 'cộng khối lượng O thay vì trừ' },
      ], `n(O bị lấy) = n(CO₂) = n(CaCO₃) ⇒ m = ${vn(a)} − 16 · ${vn(nO)}`, [
        `CO + [O] → CO₂ ⇒ n(O trong oxide bị lấy đi) = n(CO₂) = n(CaCO₃) = ${vn(k)} : 100 = ${vn(nO)} mol.`,
        `m(kim loại) = m(X) − m(O) = ${vn(a)} − 16 · ${vn(nO)} ${bang(kq)} gam.`,
      ], `${chotNhietLuyen} m(kim loại) = m(oxide) − m(O); n(O) = n(CO₂).`, [...KT_DC, 'bảo toàn nguyên tố O'])
    },
  },
  {
    ma: 'dieu_che.hieu.dien_phan_al2o3', dang: [NC_KL, DC_KL], muc: 'hieu', tuKhoa: /Al₂O₃|nhôm|aluminium|cryolite/,
    sinh(r, phan) {
      const a = r.chon([1.02, 2.04, 5.1, 10.2, 20.4, 51, 100, 150, 200, 250, 300]), H = r.chon(H_DEP), n = a / 102, kq = 2 * n * 27 * H / 100
      return soHoc(`Điện phân nóng chảy ${vn(a)} tấn Al₂O₃ (có mặt cryolite) với hiệu suất ${H}%, thu được m tấn Al. ${hoi(phan, 'm')}`, kq, [
        { giaTri: n * 27 * H / 100, viSao: 'quên hệ số 2 (1 Al₂O₃ có 2 nguyên tử Al)' },
        { giaTri: 2 * n * 27, viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: 2 * n * 27 / (H / 100), viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: 1.5 * n * 27 * H / 100, viSao: 'nhầm tỉ lệ (lấy 4Al : 3O₂ thành Al : Al₂O₃ = 3 : 2)' },
      ], `m = ${vn(a)} · 54 : 102 · ${H}%`, [
        `2Al₂O₃ → 4Al + 3O₂ (điện phân nóng chảy): cứ 102 tấn Al₂O₃ cho 54 tấn Al.`,
        `m(Al) = ${vn(a)} · 54 : 102 · ${H}% ${bang(kq)} tấn.`,
      ], 'Điện phân nóng chảy Al₂O₃: 2Al₂O₃ → 4Al + 3O₂; 1 mol Al₂O₃ cho 2 mol Al.', ['điện phân nóng chảy', 'hiệu suất phản ứng'])
    },
  },
  {
    ma: 'dieu_che.van_dung.luyen_gang', dang: [DC_KL], muc: 'van_dung', tuKhoa: /quặng|gang|thép|hematite|magnetite/,
    sinh(r, phan) {
      const quang = r.chon([{ ten: 'hematite', ox: OXIDE[0]! }, { ten: 'magnetite', ox: OXIDE[1]! }]), Mo = M(quang.ox.ct)
      const A = r.chon([50, 100, 150, 200, 250, 400, 500, 800]), p = r.chon([60, 64, 70, 75, 80, 84, 90]), q = r.chon([93, 94, 95, 96, 98]), H = r.chon(H_DEP)
      const loai = q >= 98 ? 'thép' : 'gang'
      const mFe = A * p / 100 / Mo * quang.ox.k * 56 * H / 100, kq = mFe / (q / 100)
      return soHoc(`Từ ${vn(A)} tấn quặng ${quang.ten} chứa ${p}% ${quang.ox.ct} về khối lượng (còn lại là tạp chất không chứa sắt), luyện được m tấn ${loai} chứa ${q}% Fe về khối lượng. Biết hiệu suất của cả quá trình là ${H}%. ${hoi(phan, 'm')}`, kq, [
        { giaTri: mFe * q / 100, viSao: `nhân ${q}% thay vì chia (${loai} nặng hơn lượng Fe chứa trong nó)` },
        { giaTri: mFe, viSao: `dừng ở khối lượng Fe, quên chia ${q}%` },
        { giaTri: kq / quang.ox.k, viSao: `quên hệ số ${quang.ox.k} (1 ${quang.ox.ct} có ${quang.ox.k} nguyên tử Fe)` },
        { giaTri: kq / (p / 100), viSao: `quên hàm lượng ${p}% ${quang.ox.ct} trong quặng` },
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
      ], `m = ${vn(A)} · ${p}% · ${quang.ox.k * 56} : ${Mo} · ${H}% : ${q}%`, [
        `m(${quang.ox.ct}) = ${vn(A)} · ${p}% ${bang(A * p / 100)} tấn; cứ ${Mo} tấn ${quang.ox.ct} chứa ${quang.ox.k * 56} tấn Fe.`,
        `m(Fe) = ${vnT(A * p / 100)} · ${quang.ox.k * 56} : ${Mo} · ${H}% ${bang(mFe)} tấn.`,
        `m(${loai}) = ${vnT(mFe)} : ${q}% ${bang(kq)} tấn.`,
      ], 'Bảo toàn Fe: m(Fe) = m(oxide) · (k · 56 : M oxide) · H; sản phẩm chứa q% Fe ⇒ m sản phẩm = m(Fe) : q%.', [...KT_DC, 'luyện gang thép', 'hàm lượng chất trong quặng'])
    },
  },
  {
    ma: 'dieu_che.van_dung.dien_phan_dong_dien', dang: [NC_KL, DC_KL], muc: 'van_dung', tuKhoa: /điện phân nóng chảy|cường độ|ampe|\bA\b|Downs/,
    sinh(r, phan) {
      const k = r.chon(NONG_CHAY), I = r.chon(k.I), t = r.chon([1, 2, 4, 5, 6, 8, 10, 12, 24]), H = r.chon(H_DIEN), A = NTK[k.kl]!
      const q = I * t * 3600, ne = q * H / 100 / F, kq = ne / k.e * A / 1000
      const sai = k.e === 1 ? 2 : k.e === 2 ? 1 : 2
      return soHoc(`Điện phân nóng chảy ${k.chat} với cường độ dòng điện ${I} A trong ${t} giờ; hiệu suất sử dụng dòng điện là ${H}%. Khối lượng ${k.kl} thu được ở cathode là m kg. ${CHU_F} ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq * k.e / sai, viSao: `dùng số electron trao đổi bằng ${sai} cho ion ${k.kl} (đúng là ${k.e})` },
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: kq * (H / 100) ** -2, viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
        { giaTri: kq / 60, viSao: 'đổi giờ ra giây nhưng chỉ nhân 60' },
        { giaTri: kq * 1000, viSao: 'quên đổi gam sang kg' },
      ], `m = ${A} · ${I} · ${t} · 3600 · ${H}% : (${k.e} · 96 500) gam`, [
        `t = ${t} giờ = ${t * 3600} giây ⇒ q = ${I} · ${t * 3600} = ${vn(q)} C; n(e) = ${vn(q)} · ${H}% : 96 500 ${bang(ne)} mol.`,
        `${k.kl}${k.e === 1 ? '⁺' : k.e === 2 ? '²⁺' : '³⁺'} + ${k.e}e → ${k.kl} ⇒ n(${k.kl}) = ${vnT(ne)} : ${k.e} ${bang(ne / k.e)} mol.`,
        `m = ${vnT(ne / k.e)} · ${A} ${bang(ne / k.e * A)} gam ${bang(kq)} kg.`,
      ], 'Faraday: n(e) = I · t : F (t tính bằng giây); m = A · n(e) : n; nhân thêm hiệu suất dòng điện.', ['điện phân nóng chảy', 'định luật Faraday'])
    },
  },
  {
    ma: 'dieu_che.van_dung.hieu_suat_dong_dien', dang: [NC_HS, DC_HS], muc: 'van_dung', tuKhoa: /hiệu suất|điện phân nóng chảy/,
    sinh(r, phan) {
      const k = r.chon(NONG_CHAY), I = r.chon(k.I), t = r.chon([1, 2, 4, 5, 8, 10, 12, 24]), H = r.chon(H_DIEN), A = NTK[k.kl]!
      const lt = I * t * 3600 / F / k.e * A / 1000, b = lam(Math.round(lt * H / 100 * 10) / 10)
      if (b <= 0) return null
      const kq = b / lt * 100
      return soHoc(`Điện phân nóng chảy ${k.chat} với cường độ dòng điện ${I} A trong ${t} giờ, thu được ${vn(b)} kg ${k.kl} ở cathode. Hiệu suất sử dụng dòng điện là H%. ${CHU_F} ${hoi(phan, 'H')}`, kq, [
        { giaTri: kq * A / M(k.chat), viSao: `dùng khối lượng mol của ${k.chat} thay cho ${k.kl} khi tính lượng lí thuyết` },
        ...(k.e > 1 ? [{ giaTri: kq * (k.e - 1) / k.e, viSao: `dùng ${k.e - 1} electron trao đổi cho ion ${k.kl} (đúng là ${k.e})` }] : []),
        { giaTri: kq * (k.e + 1) / k.e, viSao: `dùng ${k.e + 1} electron trao đổi cho ion ${k.kl} (đúng là ${k.e})` },
        { giaTri: 100 - kq, viSao: 'lấy phần hao hụt (100% − H) thay cho hiệu suất' },
        { giaTri: kq / 2, viSao: 'nhân đôi khối lượng lí thuyết' },
      ], `H = ${vn(b)} : m lí thuyết · 100%`, [
        `m lí thuyết = ${A} · ${I} · ${t * 3600} : (${k.e} · 96 500) ${bang(lt * 1000)} gam ${bang(lt)} kg.`,
        `H = ${vn(b)} : ${vnT(lt)} · 100% ${bang(kq)}%.`,
      ], 'H = khối lượng thu được : khối lượng tính theo Faraday (m = A · I · t : (n · F)).', ['điện phân nóng chảy', 'định luật Faraday', 'tính hiệu suất'], { toiDa: 100 })
    },
  },
]

// ================================================================ HỌ 11. ĐIỆN PHÂN DUNG DỊCH / MẠ ĐIỆN (định luật Faraday)
interface MuoiDp { ct: string; kl: string; e: number; khi: 'O₂' | 'Cl₂'; ionKl: string }
const MUOI_DP: readonly MuoiDp[] = [
  { ct: 'CuSO₄', kl: 'Cu', e: 2, khi: 'O₂', ionKl: 'Cu²⁺' }, { ct: 'Cu(NO₃)₂', kl: 'Cu', e: 2, khi: 'O₂', ionKl: 'Cu²⁺' }, { ct: 'CuCl₂', kl: 'Cu', e: 2, khi: 'Cl₂', ionKl: 'Cu²⁺' },
  { ct: 'AgNO₃', kl: 'Ag', e: 1, khi: 'O₂', ionKl: 'Ag⁺' },
]
const I_DEP = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] as const
const KT_DP = ['điện phân dung dịch', 'định luật Faraday']
const CHOT_F = 'Faraday: n(e) = I · t : F (t đổi ra giây); ở cathode Mⁿ⁺ + ne → M ⇒ m = A · n(e) : n.'
const nuaAnode = (m: MuoiDp) => (m.khi === 'O₂' ? '2H₂O → O₂ + 4H⁺ + 4e' : '2Cl⁻ → Cl₂ + 2e')

const DIEN_PHAN_DD: MauDe[] = [
  {
    ma: 'dien_phan_dd.biet.khoi_luong', dang: [DD_KL], muc: 'biet',
    sinh(r, phan) {
      const mu = r.chon(MUOI_DP), I = r.chon(I_DEP), t = r.chon([193, 386, 482.5, 965, 1158, 1544, 1930, 2895, 3860, 4825, 5790]), A = NTK[mu.kl]!
      const ne = I * t / F, kq = ne / mu.e * A
      return soHoc(`Điện phân dung dịch ${mu.ct} dư (điện cực trơ) với cường độ dòng điện ${vn(I)} A trong ${vn(t)} giây. Khối lượng ${mu.kl} bám vào cathode là m gam. ${CHU_F} ${hoi(phan, 'm')}`, kq, [
        { giaTri: mu.e === 2 ? ne * A : ne / 2 * A, viSao: `dùng số electron trao đổi bằng ${mu.e === 2 ? 1 : 2} cho ion ${mu.ionKl}` },
        { giaTri: ne * mu.e * A, viSao: `nhân ${mu.e} thay vì chia ${mu.e}` },
        { giaTri: ne / (mu.khi === 'O₂' ? 4 : 2) * (mu.khi === 'O₂' ? 32 : 71), viSao: `tính khối lượng khí ${mu.khi} ở anode thay vì kim loại ở cathode` },
        { giaTri: ne / mu.e * M(mu.ct), viSao: `tính khối lượng muối ${mu.ct} bị điện phân thay vì kim loại` },
      ], `m = ${A} · ${vn(I)} · ${vn(t)} : (${mu.e} · 96 500)`, [
        `n(e) = I · t : F = ${vn(I)} · ${vn(t)} : 96 500 ${bang(ne)} mol.`,
        `${mu.ionKl} + ${mu.e}e → ${mu.kl} ⇒ n(${mu.kl}) = ${vnT(ne)} : ${mu.e} ${bang(ne / mu.e)} mol ⇒ m = ${vnT(ne / mu.e)} · ${A} ${bang(kq)} gam.`,
      ], CHOT_F, KT_DP)
    },
  },
  {
    ma: 'dien_phan_dd.hieu.khoi_luong_phut', dang: [DD_KL, MA_KL], muc: 'hieu', tuKhoa: /phút|giờ|mạ/,
    sinh(r, phan) {
      const mu = r.chon(MUOI_DP), I = r.chon(I_DEP), gio = r.so() < 0.5, t = gio ? r.chon([0.5, 1, 1.5, 2, 2.5, 3]) : r.chon([10, 16, 20, 25, 30, 32, 40, 45, 50, 60, 64])
      const A = NTK[mu.kl]!, ts = t * (gio ? 3600 : 60), ne = I * ts / F, kq = ne / mu.e * A, dv = gio ? 'giờ' : 'phút'
      return soHoc(`Điện phân dung dịch ${mu.ct} dư (điện cực trơ) với cường độ dòng điện ${vn(I)} A trong ${vn(t)} ${dv}. Khối lượng ${mu.kl} bám vào cathode là m gam. ${CHU_F} ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq / (gio ? 3600 : 60), viSao: `quên đổi ${dv} sang giây` },
        { giaTri: gio ? kq / 60 : kq * 10 / 6, viSao: gio ? 'đổi giờ ra giây nhưng chỉ nhân 60' : 'đổi phút ra giây nhân 100' },
        { giaTri: mu.e === 2 ? ne * A : ne / 2 * A, viSao: `dùng số electron trao đổi bằng ${mu.e === 2 ? 1 : 2} cho ion ${mu.ionKl}` },
        { giaTri: ne * mu.e * A, viSao: `nhân ${mu.e} thay vì chia ${mu.e}` },
      ], `t = ${vn(ts)} giây; m = ${A} · ${vn(I)} · ${vn(ts)} : (${mu.e} · 96 500)`, [
        `t = ${vn(t)} ${dv} = ${vn(ts)} giây ⇒ n(e) = ${vn(I)} · ${vn(ts)} : 96 500 ${bang(ne)} mol.`,
        `n(${mu.kl}) = ${vnT(ne)} : ${mu.e} ${bang(ne / mu.e)} mol ⇒ m = ${vnT(ne / mu.e)} · ${A} ${bang(kq)} gam.`,
      ], CHOT_F, [...KT_DP, 'đổi đơn vị thời gian'])
    },
  },
  {
    ma: 'dien_phan_dd.hieu.the_tich_anode', dang: [DD_TT], muc: 'hieu', tuKhoa: /anode|khí|thể tích|lít/,
    sinh(r, phan) {
      const mu = r.chon(MUOI_DP), I = r.chon(I_DEP), t = r.chon([965, 1930, 2895, 3860, 4825, 5790, 7720, 9650]), ne = I * t / F
      const chia = mu.khi === 'O₂' ? 4 : 2, nK = ne / chia, kq = nK * V_KHI
      return soHoc(`Điện phân dung dịch ${mu.ct} dư (điện cực trơ) với cường độ dòng điện ${vn(I)} A trong ${vn(t)} giây. Thể tích khí ${CHU_DKC} thoát ra ở anode là V lít. ${CHU_F} ${hoi(phan, 'V')}`, kq, [
        { giaTri: mu.khi === 'O₂' ? ne / 2 * V_KHI : ne / 4 * V_KHI, viSao: mu.khi === 'O₂' ? 'lấy 2 mol electron cho 1 mol O₂ (đúng là 4)' : 'lấy 4 mol electron cho 1 mol Cl₂ (đúng là 2)' },
        { giaTri: nK * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ) thay vì 24,79 L/mol ở đkc' },
        { giaTri: ne * V_KHI, viSao: 'lấy số mol khí bằng số mol electron' },
        { giaTri: ne / mu.e * V_KHI, viSao: 'lấy số mol khí bằng số mol kim loại ở cathode' },
      ], `${nuaAnode(mu)} ⇒ n(${mu.khi}) = n(e) : ${chia}`, [
        `n(e) = ${vn(I)} · ${vn(t)} : 96 500 ${bang(ne)} mol.`,
        `Anode: ${nuaAnode(mu)} ⇒ n(${mu.khi}) = ${vnT(ne)} : ${chia} ${bang(nK)} mol ⇒ V = ${vnT(nK)} · 24,79 ${bang(kq)} lít.`,
      ], `${CHOT_F} Anode trơ: Cl⁻ bị oxi hoá trước (2 mol e/mol Cl₂); không có Cl⁻ thì H₂O bị oxi hoá (4 mol e/mol O₂).`, [...KT_DP, 'thể tích khí ở đkc'])
    },
  },
  {
    ma: 'dien_phan_dd.van_dung.hieu_suat_dong_dien', dang: [DD_KL, MA_KL], muc: 'van_dung', tuKhoa: /hiệu suất|mạ/,
    sinh(r, phan) {
      const mu = r.chon(MUOI_DP), I = r.chon(I_DEP), t = r.chon([20, 30, 40, 45, 50, 60, 80, 90, 120]), H = r.chon(H_DIEN), A = NTK[mu.kl]!
      const ts = t * 60, ne = I * ts / F * H / 100, kq = ne / mu.e * A
      const vat = mu.kl === 'Ag' ? 'Mạ bạc cho một vật bằng cách điện phân dung dịch AgNO₃ với anode bằng bạc và cathode là vật cần mạ'
        : `Mạ đồng cho một vật bằng cách điện phân dung dịch ${mu.ct === 'CuCl₂' ? 'CuSO₄' : mu.ct} với anode bằng đồng và cathode là vật cần mạ`
      return soHoc(`${vat}, cường độ dòng điện ${vn(I)} A trong ${t} phút; hiệu suất sử dụng dòng điện là ${H}%. Khối lượng ${mu.kl} bám vào vật là m gam. ${CHU_F} ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: kq / 60, viSao: 'quên đổi phút sang giây' },
        { giaTri: mu.e === 2 ? kq * 2 : kq / 2, viSao: `dùng số electron trao đổi bằng ${mu.e === 2 ? 1 : 2} cho ion ${mu.ionKl}` },
        { giaTri: kq * (H / 100) ** -2, viSao: `chia cho hiệu suất ${H}% thay vì nhân` },
      ], `m = ${A} · ${vn(I)} · ${ts} · ${H}% : (${mu.e} · 96 500)`, [
        `t = ${t} phút = ${ts} giây ⇒ n(e) = ${vn(I)} · ${ts} · ${H}% : 96 500 ${bang(ne)} mol.`,
        `n(${mu.kl}) = ${vnT(ne)} : ${mu.e} ${bang(ne / mu.e)} mol ⇒ m = ${vnT(ne / mu.e)} · ${A} ${bang(kq)} gam.`,
      ], `${CHOT_F} Hiệu suất dòng điện H ⇒ n(e) có ích = I · t · H : F.`, [...KT_DP, 'mạ điện'])
    },
  },
  {
    ma: 'dien_phan_dd.van_dung.naoh', dang: [DD_KL], muc: 'van_dung', tuKhoa: /NaCl|NaOH|màng ngăn/,
    sinh(r, phan) {
      const I = r.chon([2, 2.5, 4, 5, 8, 10, 20]), t = r.chon([0.5, 1, 1.5, 2, 2.5, 3, 4]), H = r.chon(H_DIEN), ts = t * 3600, ne = I * ts / F * H / 100, kq = ne * 40
      return soHoc(`Điện phân dung dịch NaCl bão hoà (điện cực trơ, có màng ngăn xốp) với cường độ dòng điện ${vn(I)} A trong ${vn(t)} giờ; hiệu suất sử dụng dòng điện là ${H}%. Khối lượng NaOH tạo thành là m gam. ${CHU_F} ${hoi(phan, 'm')}`, kq, [
        { giaTri: kq / 2, viSao: 'lấy n(NaOH) = n(e) : 2 (nhầm với số mol H₂)' },
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: ne * 58.5, viSao: 'tính khối lượng NaCl bị điện phân thay vì NaOH' },
        { giaTri: kq * 2, viSao: 'lấy 2 mol NaOH cho mỗi mol electron' },
      ], `n(NaOH) = n(OH⁻) = n(e) = ${vn(I)} · ${vn(ts)} · ${H}% : 96 500`, [
        `2NaCl + 2H₂O → 2NaOH + H₂ + Cl₂ (có màng ngăn); cathode: 2H₂O + 2e → H₂ + 2OH⁻ ⇒ n(OH⁻) = n(e).`,
        `n(e) = ${vn(I)} · ${vn(ts)} · ${H}% : 96 500 ${bang(ne)} mol ⇒ m(NaOH) = ${vnT(ne)} · 40 ${bang(kq)} gam.`,
      ], 'Điện phân NaCl có màng ngăn: cathode 2H₂O + 2e → H₂ + 2OH⁻ ⇒ n(NaOH) = n(e).', [...KT_DP, 'sản xuất NaOH'])
    },
  },
  {
    ma: 'dien_phan_dd.van_dung.hai_khi', dang: [DD_TT], muc: 'van_dung', tuKhoa: /NaCl|màng ngăn|hai điện cực/,
    sinh(r, phan) {
      const I = r.chon([2, 2.5, 4, 5, 8, 10]), t = r.chon([0.5, 1, 1.5, 2, 2.5, 3]), H = r.chon(H_DIEN), ts = t * 3600, ne = I * ts / F * H / 100, kq = ne * V_KHI
      return soHoc(`Điện phân dung dịch NaCl bão hoà (điện cực trơ, có màng ngăn xốp) với cường độ dòng điện ${vn(I)} A trong ${vn(t)} giờ; hiệu suất sử dụng dòng điện là ${H}%. Tổng thể tích khí ${CHU_DKC} thoát ra ở hai điện cực là V lít. ${CHU_F} ${hoi(phan, 'V')}`, kq, [
        { giaTri: kq / 2, viSao: 'chỉ tính khí ở một điện cực' },
        { giaTri: kq / (H / 100), viSao: `quên nhân hiệu suất ${H}%` },
        { giaTri: kq * 2, viSao: 'lấy số mol mỗi khí bằng số mol electron' },
        { giaTri: ne * 22.4, viSao: 'dùng 22,4 L/mol (điều kiện tiêu chuẩn cũ) thay vì 24,79 L/mol ở đkc' },
        { giaTri: kq / 60, viSao: 'đổi giờ ra giây nhưng chỉ nhân 60' },
      ], `n(H₂) = n(Cl₂) = n(e) : 2 ⇒ n(khí) = n(e)`, [
        `Cathode: 2H₂O + 2e → H₂ + 2OH⁻; anode: 2Cl⁻ → Cl₂ + 2e ⇒ n(H₂) = n(Cl₂) = n(e) : 2.`,
        `n(e) = ${vn(I)} · ${vn(ts)} · ${H}% : 96 500 ${bang(ne)} mol ⇒ tổng số mol khí = n(e) ⇒ V = ${vnT(ne)} · 24,79 ${bang(kq)} lít.`,
      ], 'Điện phân NaCl có màng ngăn: mỗi mol electron cho 0,5 mol H₂ (cathode) và 0,5 mol Cl₂ (anode).', [...KT_DP, 'thể tích khí ở đkc'])
    },
  },
]

// ================================================================ HỌ 12. THỨ TỰ KHỬ Ở CATHODE (DIEN_PHAN.DIEN_PHAN_DD.SO_SANH)
interface QuaTrinh { chu: string; ion: string; E: number }
/** Bán phản ứng ở cathode + thế điện cực chuẩn (V) để xếp thứ tự (dãy điện hoá SGK). */
const QT: Readonly<Record<string, QuaTrinh>> = {
  ag: { chu: 'Ag⁺ + 1e → Ag', ion: 'Ag⁺', E: 0.799 },
  fe3: { chu: 'Fe³⁺ + 1e → Fe²⁺', ion: 'Fe³⁺', E: 0.771 },
  cu: { chu: 'Cu²⁺ + 2e → Cu', ion: 'Cu²⁺', E: 0.34 },
  h: { chu: '2H⁺ + 2e → H₂', ion: 'H⁺', E: 0 },
  ni: { chu: 'Ni²⁺ + 2e → Ni', ion: 'Ni²⁺', E: -0.257 },
  fe2: { chu: 'Fe²⁺ + 2e → Fe', ion: 'Fe²⁺', E: -0.44 },
  zn: { chu: 'Zn²⁺ + 2e → Zn', ion: 'Zn²⁺', E: -0.763 },
}
/** Muối tan theo gốc acid (một hỗn hợp chỉ dùng MỘT gốc: không có AgCl, Ag₂SO₄ ít tan, không thêm HNO₃). */
const MUOI_GOC: Readonly<Record<'Cl' | 'SO4' | 'NO3', Readonly<Record<string, string>>>> = {
  Cl: { cu: 'CuCl₂', h: 'HCl', ni: 'NiCl₂', fe2: 'FeCl₂', zn: 'ZnCl₂', fe3: 'FeCl₃' },
  SO4: { cu: 'CuSO₄', h: 'H₂SO₄', ni: 'NiSO₄', fe2: 'FeSO₄', zn: 'ZnSO₄', fe3: 'Fe₂(SO₄)₃' },
  NO3: { ag: 'AgNO₃', cu: 'Cu(NO₃)₂', ni: 'Ni(NO₃)₂', fe2: 'Fe(NO₃)₂', zn: 'Zn(NO₃)₂', fe3: 'Fe(NO₃)₃' },
}
/**
 * Hỗn hợp theo mức: biết = 3 cation thường; hiểu = 4 cation thường, hoặc Fe³⁺ + Cu²⁺ + 1 cation (Fe³⁺ kéo theo Fe²⁺ + 2e → Fe);
 * vận dụng = Fe³⁺ + (Ag⁺ hoặc H⁺: cặp dễ nhầm) + 1 cation. Có Fe³⁺ thì không thêm muối Fe²⁺ (trùng quá trình).
 */
function honHop(r: import('./chung').Rng, muc: 'biet' | 'hieu' | 'van_dung'): { muoi: string[]; qt: string[] } | null {
  const goc = r.chon(['Cl', 'SO4', 'NO3'] as const), bang = MUOI_GOC[goc], thuong = Object.keys(bang).filter((k) => k !== 'fe3')
  let ion: string[]
  if (muc === 'biet') ion = r.xao(thuong).slice(0, 3)
  else if (muc === 'hieu') ion = r.so() < 0.5 ? r.xao(thuong).slice(0, 4) : ['fe3', 'cu', r.chon(thuong.filter((k) => !['cu', 'fe2', 'ag'].includes(k)))]
  else {
    const kho = goc === 'NO3' ? 'ag' : 'h'
    ion = ['fe3', kho, r.chon(thuong.filter((k) => ![kho, 'fe2'].includes(k)))]
  }
  if (new Set(ion).size !== ion.length) return null
  const qt = ion.includes('fe3') ? [...ion, 'fe2'] : ion
  return { muoi: r.xao(ion).map((k) => bang[k]!), qt }
}
const SO_CHU = ['', '', '', 'ba', 'bốn'] as const

function thuTuCathode(r: import('./chung').Rng, phan: Phan, muc: 'biet' | 'hieu' | 'van_dung'): BanSinh | null {
  const hh = honHop(r, muc)
  if (!hh) return null
  const ds = r.xao(hh.qt), k = ds.length
  const so = new Map(ds.map((q, i) => [q, i + 1] as const))
  const dung = [...ds].sort((a, b) => QT[b]!.E - QT[a]!.E), dap = dung.map((q) => so.get(q)).join('')
  const nhieu: Nhieu[] = [{ chu: [...dap].reverse().join(''), viSao: 'xếp ngược chiều (ion có tính oxi hoá YẾU bị khử trước)' }]
  if (ds.includes('fe3')) {
    const sai = dung.filter((q) => q !== 'fe3'), viTri = sai.indexOf('cu') >= 0 ? sai.indexOf('cu') + 1 : sai.indexOf('h') + 1
    sai.splice(viTri, 0, 'fe3')
    nhieu.push({ chu: sai.map((q) => so.get(q)).join(''), viSao: 'cho Fe³⁺ bị khử sau Cu²⁺/H⁺ (nhầm Fe³⁺ có tính oxi hoá yếu)' })
    const sai2 = dung.filter((q) => q !== 'fe2')
    sai2.splice(sai2.indexOf('fe3') + 1, 0, 'fe2')
    nhieu.push({ chu: sai2.map((q) => so.get(q)).join(''), viSao: 'cho Fe²⁺ bị khử ngay sau khi tạo thành từ Fe³⁺' })
  }
  if (ds.includes('h')) {
    const sai = dung.filter((q) => q !== 'h')
    sai.push('h')
    nhieu.push({ chu: sai.map((q) => so.get(q)).join(''), viSao: 'cho H⁺ bị khử sau cùng (sau cả các ion kim loại đứng trước H trong dãy điện hoá)' })
  }
  const tuNhien = ds.map((_, i) => String(i + 1)).join('')
  if (tuNhien !== dap) nhieu.push({ chu: tuNhien, viSao: 'giữ nguyên thứ tự đề liệt kê' })
  const theoDien = [...ds].sort((a, b) => (QT[b]!.ion.includes('³') ? 3 : QT[b]!.ion.includes('²') ? 2 : 1) - (QT[a]!.ion.includes('³') ? 3 : QT[a]!.ion.includes('²') ? 2 : 1) || QT[b]!.E - QT[a]!.E)
  nhieu.push({ chu: theoDien.map((q) => so.get(q)).join(''), viSao: 'xếp theo điện tích ion giảm dần thay vì theo thế điện cực' })
  for (let i = 0; i + 1 < k; i++) { const a = [...dap]; [a[i], a[i + 1]] = [a[i + 1]!, a[i]!]; nhieu.push({ chu: a.join(''), viSao: `đổi chỗ hai quá trình (${a[i]}) và (${a[i + 1]})` }) }
  const de = `Điện phân dung dịch hỗn hợp gồm ${hh.muoi.join(', ')} (điện cực trơ). Cho các quá trình có thể xảy ra tại cathode: ${ds.map((q, i) => `(${i + 1}) ${QT[q]!.chu}`).join('; ')}. Liệt kê số thứ tự các quá trình theo đúng thứ tự xảy ra tại cathode thành một dãy ${SO_CHU[k]} chữ số. ${phan === 'I' ? `Dãy ${SO_CHU[k]} chữ số đó là` : `Viết dãy ${SO_CHU[k]} chữ số đó.`}`
  return {
    de, kieu: 'chu', dapAnChu: dap, nhieu: nhieu.filter((x) => x.chu !== dap),
    lyDoDung: `xếp theo E° giảm dần: ${dung.map((q) => `(${so.get(q)}) ${QT[q]!.ion}`).join(' > ')}`,
    buoc: [
      'Ở cathode, chất oxi hoá mạnh hơn (thế điện cực chuẩn lớn hơn) bị khử trước.',
      `Thứ tự E° giảm dần: ${dung.map((q) => `${QT[q]!.chu} (${vn(QT[q]!.E).replace('-', '−')} V)`).join(' > ')}.`,
      `Dãy số: ${dap}.`,
    ],
    chot: 'Điện phân dung dịch: ở cathode ion có tính oxi hoá mạnh hơn bị khử trước (Ag⁺ > Fe³⁺ > Cu²⁺ > H⁺ > Ni²⁺ > Fe²⁺ > Zn²⁺).',
    kienThuc: ['điện phân dung dịch', 'dãy điện hoá'],
  }
}
const THU_TU: MauDe[] = (['biet', 'hieu', 'van_dung'] as const).map((muc) => ({
  ma: `thu_tu_cathode.${muc}`, dang: [DD_SS], muc, sinh: (r, phan) => thuTuCathode(r, phan, muc),
}))

export const HO_KIM_LOAI: readonly HoDe[] = [
  { ma: 'dieu_che_kim_loai', ten: 'Điều chế kim loại: nhiệt luyện, luyện gang thép, điện phân nóng chảy (Faraday + hiệu suất)', khoiChuong: 12, tuKhoa: /điều chế|nhiệt luyện|quặng|gang|thép|nóng chảy|khử/, mau: DIEU_CHE },
  { ma: 'dien_phan_dung_dich', ten: 'Điện phân dung dịch, mạ điện — định luật Faraday (khối lượng ở cathode, khí ở anode)', khoiChuong: 12, tuKhoa: /điện phân dung dịch|mạ|cường độ|Faraday|điện cực trơ/, mau: DIEN_PHAN_DD },
  { ma: 'thu_tu_cathode', ten: 'Thứ tự khử ở cathode khi điện phân dung dịch hỗn hợp (dãy số)', khoiChuong: 12, tuKhoa: /thứ tự|liệt kê|dãy/, mau: THU_TU },
]
