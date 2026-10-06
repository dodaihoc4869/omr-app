// OMNI 3 · D1 — A.I ĐỖ ĐẠI HỌC TỰ GẮN VI KỸ NĂNG (ma trận Q tự động) + TỰ KIỂM ĐỊNH Q HẰNG TUẦN theo dữ liệu. Thầy lệnh 05/10: "Làm luôn công cụ
// duyệt vi kỹ năng cho chương đang dạy, tự động chuẩn xác luôn… tôi chỉ chữa bài hs cần chữa". Ưu tiên ĐỘ CHÍNH XÁC: không chắc thì LÙI VỀ MỨC THÔ
// (chỉ vi kỹ năng của dạng), không gắn sai. Mọi luật là MÃ TẤT ĐỊNH chạy trên máy chủ (không gọi mạng, không LLM, không Math.random).
//
// MÃ VI KỸ NĂNG TOÀN HỆ (hợp đồng phiên điều phối): mỗi câu cần (cổng AND) = `dang:<ma_dang>` (khái niệm của dạng — LUÔN có; câu thiếu mã dạng ⇒
// `cd:<chuyên đề>`, không có nữa ⇒ `cau:<qid>`) ∪ vi kỹ năng của dạng khớp `kienThuc` (omni_vkn của dạng, khớp nguyên văn đã chuẩn hoá — như
// omni-q.ts `goiYQ`) ∪ `nen:<nhãn>` với nhãn thuộc TEN_NEN (thang-tu-go.ts), tối đa SO_NEN_TOI_DA nhãn.
// Nguồn nhãn nền, theo độ tin:
//   (i)  nhãn nền TỪNG BƯỚC đã soạn (`cau_bo_tro.nhan_nen_json`) — tin cậy nhất: theo thứ tự bước, bỏ trùng, ≤ 3; 'lam_tron_ket_qua' là kỹ năng phụ
//        nên KHÔNG vào cổng AND trừ khi là nhãn duy nhất; 'khac' / nhãn ngoài TEN_NEN bỏ. doTin 1.
//   (ii) không có nhãn bước ⇒ dò MẪU MẠNH trong đề + lời giải (bảng từ khoá + biểu thức, so trên chuỗi đã bỏ dấu, công thức hoá học đã "trung hoà"
//        chỉ số để không bị đọc như số liệu). Nhãn có từ khoá cũng hay gặp trong câu lý thuyết (hiệu suất, dư/hết, pH, ΔH, tốc độ phản ứng…) chỉ nhận
//        khi câu CÓ PHÉP TÍNH THẬT ("số op số … = số"). doTin 0,8.
//   (iii) Phần II: vknY[i] = [dạng] ∪ nhãn dò được trong Ý i (chữ ý + lời giải của ý); ý lý thuyết ⇒ chỉ dạng. Có nhãn bước ⇒ ý chỉ nhận nhãn
//        thuộc tập nhãn bước (giao), cả câu = dạng ∪ nhãn bước.
//   Câu chỉ-dạng ⇒ doTin 1. nguon luôn 'goi_y' (A.I gắn tự động); dòng thầy duyệt ('thay') KHÔNG bao giờ bị đè.
// Bảng chỉ-thêm của làn này (tự tạo lúc chạy; bản SQL: SQL_BANG_GAN_VKN): omni_q_gan (phiên bản gắn từng câu), omni_q_nhat_ky (nhật ký thay đổi Q
// của kiểm định tuần), omni_q_nghi (câu nghi của kiểm định tuần — KHÔNG ghi cau_nghi_dap_an để rút đề ca kiểm tra không bị bỏ câu). Ghi omni_q / omni_vkn đúng lược đồ migration-0510-omni-3.sql.
import type { D1PreparedStatement, Env } from './kieu'
import { SQL_LA_LAN_LAM, TEN_AI, type Phan, type QCau, type Vkn } from './omni-kieu'
import { SO_NEN_TOI_DA, chuanHoaNhan, vknMacDinh, vknNen } from './omni-q'
import { TEN_NEN } from './thang-tu-go'
import { bamCau, cauTrongGoi } from '../../src/lib/loi-giai-kiem'

type Row = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()
const laObj = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v)

/** Phiên bản bộ gắn — đổi luật ⇒ tăng số này để việc đêm gắn lại mọi câu. */
export const PHIEN_BAN_GAN = 'gan-vkn-0510-v1'
/** Khoá `cau_hinh`: con trỏ việc đêm gắn vi kỹ năng. */
export const KHOA_CON_TRO_GAN = 'omni_gan_con_tro'
/** Khoá `cau_hinh`: tuần đã chạy kiểm định Q (idempotent theo tuần). */
export const KHOA_KIEM_Q_TUAN = 'omni_kiem_q_tuan'
/**
 * Hằng số của làn (omni-kieu.ts là hợp đồng không sửa ở làn này ⇒ gom tại đây; phiên điều phối có thể dời vào THAM_SO_OMNI).
 * KIEM_Q: de la Torre (2008) rút gọn — câu ≥ 30 lượt tự làm; nhóm em vững mọi vi kỹ năng ≥ 10 em; nhóm vững đúng < 0,6 ⇒ tìm nhãn nền tách nhóm
 * vững tốt nhất (chênh ≥ 0,3, mỗi nhóm con ≥ 10 em).
 */
export const THAM_SO_GAN = Object.freeze({
  DO_TIN: Object.freeze({ BUOC: 1, MAU: 0.8, DANG: 1 }),
  NEN_TOI_DA: SO_NEN_TOI_DA,
  LO_LENH: 40,
  CAU_MOI_LUOT_DEM: 400,
  KIEM_Q: Object.freeze({ LUOT_TOI_THIEU: 30, EM_VUNG_TOI_THIEU: 10, NGUONG_DUNG_VUNG: 0.6, CHENH_TOI_THIEU: 0.3, EM_NHOM_TOI_THIEU: 10, CAU_TOI_DA: 400 }),
})

/** Nhãn nền → cụm danh từ dùng sau "vướng ở bước …" (Trạm hồi phục, Cần thầy chữa). Đủ mọi nhãn TEN_NEN. */
export const TEN_LOI_NEN: Readonly<Record<string, string>> = {
  doi_mol_khoi_luong: 'đổi khối lượng ra số mol', doi_mol_the_tich_khi: 'đổi thể tích khí ra số mol', nong_do_mol: 'tính nồng độ mol',
  nong_do_phan_tram: 'tính nồng độ phần trăm', khoi_luong_rieng: 'dùng khối lượng riêng', ti_khoi_khi: 'dùng tỉ khối chất khí',
  can_bang_phuong_trinh: 'cân bằng phương trình', ti_le_mol_phuong_trinh: 'lập tỉ lệ mol theo phương trình', bao_toan_khoi_luong: 'bảo toàn khối lượng',
  bao_toan_nguyen_to: 'bảo toàn nguyên tố', bao_toan_electron: 'bảo toàn electron', bao_toan_dien_tich: 'bảo toàn điện tích', hieu_suat: 'tính hiệu suất phản ứng',
  chat_du_het: 'xác định chất dư, chất hết', lap_he_phuong_trinh: 'lập hệ phương trình', gia_tri_trung_binh: 'dùng giá trị trung bình',
  cong_thuc_phan_tu: 'tìm công thức phân tử', phan_tram_khoi_luong: 'tính phần trăm khối lượng', do_bat_bao_hoa: 'tính độ bất bão hoà',
  ph_nong_do_ion: 'tính pH và nồng độ ion', hang_so_can_bang: 'tính hằng số cân bằng', bien_thien_enthalpy: 'tính biến thiên enthalpy',
  nang_luong_lien_ket: 'tính enthalpy từ năng lượng liên kết', dien_phan_faraday: 'tính theo định luật Faraday', the_dien_cuc_pin: 'dùng thế điện cực chuẩn',
  toc_do_phan_ung: 'tính tốc độ phản ứng', dung_dich_pha_loang: 'tính khi pha loãng dung dịch', tinh_chat_hoa_hoc: 'nhớ tính chất hoá học',
  lam_tron_ket_qua: 'làm tròn kết quả',
}
/** Nhãn "chung" — bài tính nào cũng hay cần, ít giá trị chẩn đoán ⇒ cắt trước khi vượt trần nhãn. */
const NHAN_CHUNG: ReadonlySet<string> = new Set(['doi_mol_khoi_luong', 'ti_le_mol_phuong_trinh', 'doi_mol_the_tich_khi', 'nong_do_mol'])
/** Nhãn phụ: không vào cổng AND trừ khi là nhãn duy nhất. */
const NHAN_PHU = 'lam_tron_ket_qua'
const laNhanNen = (n: string) => n !== 'khac' && Object.prototype.hasOwnProperty.call(TEN_NEN, n)

// ---------------------------------------------------------------- đầu vào thuần

/** Một câu cần gắn — nhận cả tên trường của kho (de, pa, y, loi_giai…) lẫn của chỉ mục game (text, choices, ideas, solution…). */
export interface CauCanGan {
  qid: string
  phan: Phan | string
  maDang?: string | null
  dang?: string | { ma?: string | null; ten?: string | null } | null
  tenDang?: string | null
  chuyenDe?: string | null
  mucDo?: string | null
  de?: string | null
  text?: string | null
  pa?: readonly string[] | Readonly<Record<string, string>> | null
  choices?: readonly string[] | null
  y?: readonly string[] | Readonly<Record<string, string>> | null
  ideas?: readonly string[] | null
  bang?: readonly (readonly unknown[])[] | null
  table?: readonly (readonly unknown[])[] | null
  /** Lời giải: chuỗi (bản cũ) hoặc đối tượng {chot, buoc[], tung_pa/tungPa, tung_y/tungY, ket_qua/ketQua, noi_dung}. */
  loiGiai?: unknown
  solution?: unknown
  /** Các bước lời giải (vd `cau_bo_tro.buoc_json`) — dùng khi lời giải không có bước. */
  buoc?: readonly string[] | null
  /** Nhãn nền từng bước đã soạn (`cau_bo_tro.nhan_nen_json`). */
  nhanNen?: readonly { buoc: number; nen: string }[] | null
  kienThuc?: readonly string[] | string | null
  /** Phần II: kienThuc riêng từng ý (nếu kho có). */
  kienThucY?: readonly (readonly string[])[] | null
}
export interface KetQuaGan {
  q: QCau
  doTin: number
  lyDo: string[]
  /** Nguồn nhãn nền: 'buoc' nhãn từng bước · 'mau' dò mẫu · 'dang' chỉ vi kỹ năng của dạng. */
  nguonNhan: 'buoc' | 'mau' | 'dang'
}
export interface TuyChonGan {
  /** Vi kỹ năng riêng của dạng (omni_vkn ma_dang = dạng) để khớp kienThuc. */
  vknDang?: readonly Vkn[]
  /** Vi kỹ năng kiểm định tuần đã THÊM theo dữ liệu (y −1 cả câu, 0..3 từng ý) — gắn lại không làm mất. */
  themNhan?: readonly { y: number; vkn: string }[]
}

// ---------------------------------------------------------------- chuẩn hoá chữ

const SO_DUOI = '₀₁₂₃₄₅₆₇₈₉'
const SO_TREN = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const veDuoi = (d: string) => [...d].map((c) => SO_DUOI[Number(c)]).join('')
const treneVeSo = (d: string) => [...d].map((c) => String(SO_TREN.indexOf(c))).join('')
/**
 * Chuỗi cho CỔNG PHÉP TÍNH và mẫu ký hiệu: chữ số ASCII đứng ngay sau chữ cái Latinh/ngoặc đóng là CHỈ SỐ công thức (H2O, Al2(SO4)3, \ce{CO2}) ⇒ đổi
 * sang chỉ số Unicode để không thành "số liệu"; mũ trên số (10⁻², 0,10²) ⇒ dạng ^; mũ sau chữ (điện tích Fe²⁺) giữ nguyên; dấu nhân/trừ thống nhất.
 */
function chuoiToan(s: string): string {
  return s.normalize('NFC')
    .replace(/([A-Za-z)\]])(\d+)/g, (_m, a: string, d: string) => a + veDuoi(d))
    .replace(/(\d)([⁺⁻]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_m, d: string, dau: string, so: string) => `${d}^${dau === '⁻' ? '-' : dau === '⁺' ? '+' : ''}${treneVeSo(so)}`)
    .replace(/[−–—]/g, '-')
    .replace(/[×·⋅∙✕]/g, '*')
    // Cách viết khoa học "4,10.10⁻⁴" là MỘT số, không phải phép nhân ⇒ "4,10e-4".
    .replace(/(\d)\s*[.*]\s*10\^([-+]?\d+)/g, '$1e$2')
}
/**
 * Chuỗi bỏ dấu, viết thường (đ ⇒ d), mũ trên ⇒ ASCII (cm³ ⇒ cm3, s⁻¹ ⇒ s-1). Đổi TỪNG KÝ TỰ, giữ đúng độ dài (dấu kết hợp lẻ ⇒ khoảng trắng) để
 * vị trí khớp trên chuỗi bỏ dấu cắt được đoạn trích đúng chỗ trên chuỗi gốc.
 */
function boDau(toan: string): string {
  let ra = ''
  for (const ch of toan) {
    let b = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    b = b === 'đ' || b === 'Đ' ? 'd' : b.toLowerCase()
    const tren = b.length === 1 ? SO_TREN.indexOf(b) : -1
    if (tren >= 0) b = String(tren)
    else if (b === '⁺') b = '+'
    else if (b === '⁻') b = '-'
    if (b.length !== ch.length) b = `${b}  `.slice(0, ch.length)
    ra += b
  }
  return ra
}

interface ChuDo { toan: string; thuong: string; bd: string; coA: boolean; coB: boolean }
/** Ký tự của một BIỂU THỨC SỐ thuần: số, dấu phẩy/chấm, ngoặc, phép tính, khoảng trắng, ẩn một chữ x y z a b (56x + 24y = 8). */
const KY_TU_BIEU_THUC = /[\d,.\s()+\-*/:^xyzab]/
const SO_OP_SO = /\d\s*[xyzab]?\s*\)?\s*[*/:.+^-]\s*\(?\s*-?\s*\d/
/** Phép lấy logarit có số: "pH = −lg(0,01) = 2", "−log[H⁺] = 3". */
const CO_LOG = /=\s*-?\s*l(?:o)?g\s*\(?\s*[\d[]|l(?:o)?g\s*\(?\s*[\d,\s]+\)?\s*=\s*-?\s*\d/
/**
 * Cổng A — có PHÉP TÍNH THẬT: sát trước một dấu "=" là biểu thức số thuần có phép tính và sau "=" là số ("5,6 : 56 = 0,1"), hoặc sát sau "=" là
 * biểu thức số thuần có phép tính ("Kc = 0,10²/0,50"). Chữ xen giữa không tính ("câu 17 – 18: … pH = 14" không phải phép tính); công thức hoá học đã
 * trung hoà chỉ số nên "N₂ + 3H₂ ⇌ 2NH₃; ΔH = −92 kJ" không lọt.
 */
function coPhepTinh(toan: string): boolean {
  if (CO_LOG.test(toan)) return true
  // Dấu "=" và dấu so sánh (so sánh tỉ lệ "0,1/1 < 0,3/2" cũng là phép tính).
  for (const dau of toan.matchAll(/[=<>≤≥]/g)) {
    const i = dau.index!
    let a = i
    while (a > 0 && i - a < 60 && KY_TU_BIEU_THUC.test(toan[a - 1]!)) a--
    let b = i + 1
    while (b < toan.length && b - i < 60 && KY_TU_BIEU_THUC.test(toan[b]!)) b++
    const truoc = toan.slice(a, i), sau = toan.slice(i + 1, b)
    if (SO_OP_SO.test(truoc) && /^\s*[-(]?\s*\d/.test(sau)) return true
    if (SO_OP_SO.test(sau) && /^\s*-?\s*\(?\s*\d/.test(sau)) return true
  }
  return false
}
/** Cổng B — có số liệu: "= số" hoặc số kèm đơn vị hoá học. */
const CONG_B1 = /=\s*[-+]?\s*\(?\s*\d/
const CONG_B2 = /\d\s*(?:mol|gam|g|kg|mg|tấn|lít|l|L|ml|mL|M|kJ|J|%)(?![\p{L}\p{N}_])/u
function taoChuDo(phan: readonly string[]): ChuDo {
  const toan = chuoiToan(phan.filter(Boolean).join(' \n '))
  const coA = coPhepTinh(toan)
  return { toan, thuong: toan.toLowerCase(), bd: boDau(toan), coA, coB: coA || CONG_B1.test(toan) || CONG_B2.test(toan) }
}

// ---------------------------------------------------------------- luật dò mẫu mạnh

interface Khop { vt: number; doan: string }
type Cong = 'A' | 'B' | '-'
type Noi = 'bd' | 'toan' | 'thuong'
interface LuatNen { nhan: string; cong: Cong; mau: readonly (readonly [RegExp, Noi])[]; them?: (c: ChuDo) => Khop | null }
const CAT = 56
const gon = (s: string) => s.replace(/\s+/g, ' ').trim()
const khopDau = (c: ChuDo, mau: readonly (readonly [RegExp, Noi])[]): Khop | null => {
  let tot: Khop | null = null
  for (const [re, noi] of mau) {
    const m = re.exec(c[noi])
    if (m && (!tot || m.index < tot.vt)) tot = { vt: m.index, doan: gon(c.toan.slice(m.index, m.index + Math.min(Math.max(m[0].length, 8), CAT))) }
  }
  return tot
}
/** "Khối lượng (gam) + số mol" cùng có mặt ⇒ phải đổi qua lại; hoặc viết thẳng n = m/M · m = n·M. */
function moKhoiLuongMol(c: ChuDo): Khop | null {
  const congThuc = /(?<![\p{L}\p{N}])n\s*(?:\([^)\n]{1,15}\))?\s*=\s*m\s*(?:\([^)\n]{1,15}\))?\s*[/:]\s*M(?![\p{L}\p{N}])|(?<![\p{L}\p{N}])m\s*(?:\([^)\n]{1,15}\))?\s*=\s*n\s*(?:\([^)\n]{1,15}\))?\s*[*.]?\s*M(?![\p{L}\p{N}])/u.exec(c.toan)
  if (congThuc) return { vt: congThuc.index, doan: congThuc[0] }
  const kl = /(?<![\d,])\d+(?:,\d+)?\s?(?:gam|g|kg|mg|tan)(?![a-z0-9₀-₉/])(?!\s?\/\s?(?:mol|ml|l\b|lit|cm))(?!\s?[*.]?\s?(?:ml|cm[3₃]?|l|lit|mol)\s?-\s?\d)/.exec(c.bd)
  const mol = /(?<![\d,])\d+(?:,\d+)?\s?mol(?![a-z/])(?!\s?\/\s?(?:l\b|lit))(?!\s?l\s?-\s?1)/.exec(c.bd)
  if (!kl || !mol) return null
  const vt = Math.min(kl.index, mol.index)
  return { vt, doan: `${gon(c.toan.slice(kl.index, kl.index + kl[0].length + 8))} … ${gon(c.toan.slice(mol.index, mol.index + mol[0].length))}` }
}
/** Hiệu suất kèm con số KHÁC 100 % (hiệu suất 100 % = không phải điều chỉnh gì ⇒ không cần kỹ năng hiệu suất). */
function moHieuSuat(c: ChuDo): Khop | null {
  let tot: Khop | null = null
  const nhan = (vt: number, dai: number, so: string | undefined) => {
    if (!so || Number(so.replace(',', '.')) === 100) return
    if (!tot || vt < tot.vt) tot = { vt, doan: gon(c.toan.slice(vt, vt + Math.min(Math.max(dai, 8), CAT))) }
  }
  for (const m of c.bd.matchAll(/hieu suat[^.;\n]{0,40}?(\d+(?:,\d+)?) ?%|(\d+(?:,\d+)?) ?% ?hieu suat|hieu suat[^.;\n]{0,30}?\b(?:la|bang|dat|chi dat)\s*(\d+(?:,\d+)?)/g)) nhan(m.index!, m[0].length, m[1] ?? m[2] ?? m[3])
  for (const m of c.toan.matchAll(/(?<![\p{L}\p{N}Δ])H\s*%?\s*=([^;\n]{0,60})/gu)) {
    // Mọi "số %" trong cửa sổ, bỏ số đứng ngay sau dấu nhân/chia (× 100% là hệ số đổi, không phải hiệu suất).
    for (const p of m[1]!.matchAll(/(^|[^\d,])(\d+(?:,\d+)?)\s*%/g)) if (!/[*/:]\s*$/.test(m[1]!.slice(0, p.index! + p[1]!.length))) nhan(m.index!, m[0].length, p[2])
  }
  return tot
}
/** ≥ 2 phương trình (có dấu =) cùng chứa hai ẩn x và y ⇒ hệ phương trình. */
function moHeXY(c: ChuDo): Khop | null {
  const an = (k: 'x' | 'y') => new RegExp(`(?<![\\p{L}])\\d*,?\\d*\\s?${k}(?![\\p{L}₀-₉(])`, 'u')
  const doan = c.toan.split(/[;\n]|\.\s/).filter((d) => d.includes('=') && an('x').test(d) && an('y').test(d))
  if (doan.length < 2) return null
  const vt = c.toan.indexOf(doan[0]!)
  return { vt: Math.max(0, vt), doan: gon(doan[0]!).slice(0, CAT) }
}

const LUAT_NEN: readonly LuatNen[] = [
  { nhan: 'bao_toan_khoi_luong', cong: '-', mau: [[/\bbtkl\b|bao toan khoi luong/, 'bd']] },
  { nhan: 'bao_toan_nguyen_to', cong: '-', mau: [[/\bbtnt\b|bao toan (?:nguyen to|nguyen tu)\b|\bbao toan (?:c|h|o|n|s|na|k|ca|fe|cu|al|cl|ba|mg|zn|ag|p|br)\b|\bbt (?:c|h|o|n|s)\b/, 'bd']] },
  { nhan: 'bao_toan_electron', cong: '-', mau: [[/\bbte\b|\bbt ?e\b|bao toan (?:e|electron|so mol electron|mol electron)\b|\bn ?e ?(?:nhuong|nhan) ?=|so mol (?:e|electron) (?:nhuong|nhan)\b[^.;\n]{0,30}= ?(?:tong )?so mol (?:e|electron) (?:nhuong|nhan)/, 'bd']] },
  { nhan: 'bao_toan_dien_tich', cong: '-', mau: [[/\bbtdt\b|bao toan dien tich/, 'bd']] },
  { nhan: 'hieu_suat', cong: 'A', mau: [[/hieu suat\s*=\s*\d|(?:nhan|chia)(?: voi| cho)? hieu suat/, 'bd'], [/(?<![\p{L}\p{N}Δ])H ?% ?=/u, 'toan']], them: moHieuSuat },
  { nhan: 'nong_do_phan_tram', cong: 'A', mau: [[/\bc ?%|nong do phan tram|nong do ?\d+(?:,\d+)? ?%|dung dich [^.;\n%]{1,30}? \d+(?:,\d+)? ?%(?! ?(?:ve )?(?:so mol|the tich))/, 'bd']] },
  {
    nhan: 'nong_do_mol', cong: 'A', mau: [
      [/(?<![\p{L}\p{N}])C_?M\s*(?:\([^)\n]{1,15}\))?\s*=|[\d)]\s*[/:]\s*\(?\s*\d[\d,]*\s*\)?\s*=\s*\d[\d,]*\s?M(?![\p{L}\p{N}])(?!\s*[/*.]\s*s\b)/u, 'toan'],
      [/\bc ?m ?= ?n ?\/ ?v\b|\bn ?= ?c ?m? ?[*.]? ?v\b/, 'bd'],
    ],
    // Nồng độ CHO SẴN (vd [CO₂] = 0,50 M trong câu Kc) không cần kỹ năng này; cần khi có cả số mol, thể tích và nồng độ.
    them: (c) => {
      const nd = /nong do mol|mol ?\/ ?(?:l|lit)\b/.exec(c.bd) ?? /(?<![\w,.])(?:\d+,\d+|\d+)\s?M(?![\p{L}\p{N}_(⁺⁻+-])(?!\s*[+→⇌=])(?!\s*[/*.]\s*s\b)/u.exec(c.toan)
      if (!nd) return null
      const coMol = /(?<![\d,])\d+(?:,\d+)?\s?mol(?![a-z/])(?!\s?\/\s?(?:l\b|lit))/.test(c.bd)
      const coTheTich = /(?<![\d,])\d+(?:,\d+)?\s?(?:lit|l|ml|dm3|dm₃)\b/.test(c.bd)
      return coMol && coTheTich ? { vt: nd.index, doan: gon(c.toan.slice(nd.index, nd.index + 16)) } : null
    },
  },
  { nhan: 'khoi_luong_rieng', cong: 'A', mau: [[/khoi luong rieng|\d ?g ?\/ ?(?:ml|cm[3₃])\b|\d ?g ?[*.]? ?(?:ml ?-1|cm ?-3)\b|kg ?\/ ?(?:m[3₃]|l|lit)\b|\bd ?= ?\d+(?:,\d+)? ?g ?\/ ?(?:ml|cm[3₃])/, 'bd']] },
  { nhan: 'ti_khoi_khi', cong: '-', mau: [[/ti khoi|ty khoi|\bd ?(?:\(|_)? ?[a-z0-9₀-₉]{1,8} ?\/ ?(?:h₂|h2|kk|khong khi|he|o₂|o2|n₂|n2|ch₄|ch4)\)? ?=/, 'bd']] },
  {
    nhan: 'doi_mol_the_tich_khi', cong: '-', mau: [[/(?<![\d,])24[,.]79(?!\d)|[/:*.] ?22,4(?![\d,])|(?<![\d,])22,4(?![\d,]) ?(?:l|lit|dm3|dm₃)\b/, 'bd']],
    them: (c) => {
      const dk = /\b(?:dkc|dktc)\b/.exec(c.bd)
      return dk && /\d\s?(?:l|lit|ml|dm3|dm₃|cm3|cm₃)\b/.test(c.bd) ? { vt: dk.index, doan: c.toan.slice(dk.index, dk.index + 8).trim() } : null
    },
  },
  { nhan: 'can_bang_phuong_trinh', cong: '-', mau: [[/can bang phuong trinh|he so can bang|tong (?:cac )?he so (?!(?:cua )?(?:cac )?(?:chat )?khi\b)(?![^.;\n]{0,25}\b(?:hai|moi|2) ve\b)(?:\(|\d|nguyen|toi gian|cua (?:cac chat|phuong trinh)|cac chat|trong phuong trinh|la\b|bang \d)|he so (?:nguyen,? ?)?toi gian|he so nguyen\b(?! tu)|thang bang electron|can bang (?:cac )?(?:pthh|phuong trinh hoa hoc)/, 'bd']] },
  {
    nhan: 'ti_le_mol_phuong_trinh', cong: 'A', mau: [[/ti le mol|ty le mol|theo (?:pthh|pt|phuong trinh)\b(?!(?: hoa hoc| phan ung)? ?(?:sau|tren|duoi|:))|theo ti le ?\d+ ?: ?\d+|(?<![\d,])\d+ mol [^.;\n]{1,30}?\b(?:cho|tao ra|tao|thu duoc|sinh ra|can|phan ung voi|tac dung voi)(?: vua du)? \d+(?:,\d+)? mol\b/, 'bd']],
  },
  {
    nhan: 'chat_du_het', cong: 'A', mau: [
      [/(?<![\p{L}])chất (?:còn )?(?:dư|hết)(?![\p{L}])|(?<![\p{L}\p{N}])n ?\([^)\n]{1,15}\) ?(?:còn )?dư(?![\p{L}])|(?<![\p{L}])dư ?= ?-?\d|số mol [^\s.;,]{1,15}(?: còn)? dư(?![\p{L}])|(?<![\p{L}])(?:còn )?dư ?\d+(?:,\d+)? ?mol(?![\p{L}])|tính theo [^.;\n]{1,25}(?:vì|do) [^.;\n]{0,30}(?:hết|thiếu)(?![\p{L}])|so sánh tỉ lệ|(?<![\d,])\d+(?:,\d+)? ?\/ ?\d+ ?[<>] ?\d+(?:,\d+)? ?\/ ?\d+/u, 'thuong'],
      [/(?<![\p{L}])\p{Lu}[\p{L}₀-₉()]{0,12} (?:phản ứng )?hết, ?(?:còn )?\p{Lu}[\p{L}₀-₉()]{0,12} (?:còn )?dư(?![\p{L}])|(?<![\p{L}])\p{Lu}[\p{L}₀-₉()]{0,12} (?:còn )?dư, ?\p{Lu}[\p{L}₀-₉()]{0,12} (?:phản ứng )?hết(?![\p{L}])/u, 'toan'],
    ],
  },
  { nhan: 'lap_he_phuong_trinh', cong: 'A', mau: [[/he phuong trinh|\blap he\b|\bgiai he\b|ta co he\b|\bhe ?:|\b(?:goi|dat)(?! ten) [^.;\n]{0,60}?\b(?:x|a)\b ?(?:,|va) ?\b(?:y|b)\b/, 'bd']], them: moHeXY },
  {
    nhan: 'gia_tri_trung_binh', cong: 'B', mau: [
      [/(?:khoi luong mol|phan tu khoi|nguyen tu khoi|so (?:nguyen tu )?(?:c|carbon|h|hydrogen)|so lien ket (?:π|pi)) trung binh|\bm ?(?:trung binh|tb)\b|\bc ?(?:trung binh|tb)\b|\bmtb\b/, 'bd'],
      [/M\u0304|C\u0304|\bM ?tb\b/, 'toan'],
    ],
  },
  { nhan: 'cong_thuc_phan_tu', cong: 'A', mau: [[/(?:tim|xac dinh|lap|suy ra) (?:duoc )?(?:cong thuc phan tu|ctpt)|(?:cong thuc phan tu|ctpt) (?:cua [^.;:\n,]{1,25} )?(?:la|bang) ?(?:$|[.:?\n])|cong thuc don gian nhat|\bctdgn\b/, 'bd']] },
  { nhan: 'phan_tram_khoi_luong', cong: 'B', mau: [[/% ?(?:ve )?khoi luong|phan tram (?:ve )?khoi luong|% ?m ?\(|% ?m ?[a-z]{1,2}[₀-₉]? ?=/, 'bd']] },
  { nhan: 'do_bat_bao_hoa', cong: '-', mau: [[/do bat bao hoa|\bk ?= ?\(? ?2 ?\*? ?(?:c|x|n|a)\b|(?:π|pi) ?\+ ?v(?:ong)?\b|so lien ket (?:π|pi) (?:\+|va) (?:so )?vong|\(? ?2c ?\+ ?2 ?- ?h/, 'bd']] },
  { nhan: 'ph_nong_do_ion', cong: 'A', mau: [[/(?<![\p{L}\p{N}])pH\s*=\s*-?\s*(?:\d|log|lg)|(?<![\p{L}\p{N}])pOH(?![\p{L}\p{N}])|-\s*l(?:o)?g\s*\[|\[\s*(?:H|OH|H₃O)\s*[+⁺\-⁻]\s*\]\s*=/u, 'toan']] },
  { nhan: 'hang_so_can_bang', cong: 'A', mau: [[/(?<![\p{L}\p{N}])K_?[CcPp](?![\p{L}\p{N}])|hằng số cân bằng/u, 'toan']] },
  {
    nhan: 'bien_thien_enthalpy', cong: 'A', mau: [
      [/Δ\s*_?\s*f\s*_?\s*H|Σ\s*Δ/u, 'toan'],
      [/(?:enthalpy|nhiet) tao thanh|tao thanh chuan|nhiet luong (?:toa|thu)(?: ra| vao)?[^.;\n]{0,50}?\d+(?:,\d+)? ?kj|\d+(?:,\d+)? ?kj[^.;\n]{0,50}?nhiet luong/, 'bd'],
    ],
  },
  { nhan: 'nang_luong_lien_ket', cong: 'A', mau: [[/nang luong lien ket|(?:δ|delta) ?_? ?r? ?h[^.;\n]{0,60}\blien ket|\blien ket[^.;\n]{0,60}(?:δ|delta) ?_? ?r? ?h|enthalpy[^.;\n]{0,40}\blien ket/, 'bd'], [/\bE\s*_?\s*b\s*\(|\bEb\b|\bE_b\b|Σ\s*E\s*_?\s*b/, 'toan']] },
  { nhan: 'dien_phan_faraday', cong: '-', mau: [[/faraday|96 ?500\b|\bi ?[*.]? ?t ?\/ ?(?:n ?[*.]? ?)?f\b|\bq ?= ?i ?[*.]? ?t\b/, 'bd']] },
  { nhan: 'dien_phan_faraday', cong: 'A', mau: [[/cuong do dong dien/, 'bd']] },
  { nhan: 'the_dien_cuc_pin', cong: 'A', mau: [[/E\s*[°⁰]|\bE\s*_?\s*pin\b|\bE\s*\^?\s*o\s*(?:\(|pin)/u, 'toan'], [/suat dien dong|suc dien dong|the dien cuc/, 'bd']] },
  {
    nhan: 'toc_do_phan_ung', cong: 'A', mau: [
      [/toc do (?:trung binh )?(?:cua )?phan ung|(?:δ|delta) ?c ?\/ ?(?:δ|delta) ?t|mol ?\/ ?\(? ?l ?[*.]? ?s ?\)?|\bm ?\/ ?s\b|\bm ?[*.]? ?s ?-1\b|mol ?l ?-1 ?s ?-1/, 'bd'],
      [/\bv\s*=\s*-?\s*(?:\d\s*\/\s*\d\s*\*?\s*)?\(?\s*Δ/u, 'toan'],
    ],
  },
  { nhan: 'dung_dich_pha_loang', cong: 'A', mau: [[/pha loang|c[1₁] ?[*.]? ?v[1₁] ?= ?c[2₂] ?[*.]? ?v[2₂]|v[1₁] ?[*.]? ?c[1₁] ?=/, 'bd']] },
  { nhan: 'doi_mol_khoi_luong', cong: 'B', mau: [], them: moKhoiLuongMol },
]

interface NhanDo { nhan: string; vt: number; doan: string }
/** Dò nhãn nền trong một khối chữ. Nhãn cổng A cần phép tính thật; cổng B cần số liệu. */
function doNhan(c: ChuDo): NhanDo[] {
  const ra = new Map<string, NhanDo>()
  for (const l of LUAT_NEN) {
    if ((l.cong === 'A' && !c.coA) || (l.cong === 'B' && !c.coB)) continue
    const a = khopDau(c, l.mau), b = l.them ? l.them(c) : null
    const k = a && b ? (a.vt <= b.vt ? a : b) : a ?? b
    if (!k) continue
    const cu = ra.get(l.nhan)
    if (!cu || k.vt < cu.vt) ra.set(l.nhan, { nhan: l.nhan, vt: k.vt, doan: k.doan })
  }
  return [...ra.values()].sort((x, y) => x.vt - y.vt)
}
/** Bỏ trùng, xếp theo vị trí; vượt trần ⇒ cắt nhãn chung từ cuối trước, rồi cắt theo vị trí. */
function chonNhan(ds: readonly NhanDo[], lyDo: string[], noi: string): string[] {
  const motLan = new Map<string, NhanDo>()
  for (const x of ds) { const cu = motLan.get(x.nhan); if (!cu || x.vt < cu.vt) motLan.set(x.nhan, x) }
  const xep = [...motLan.values()].sort((a, b) => a.vt - b.vt)
  while (xep.length > THAM_SO_GAN.NEN_TOI_DA) {
    let i = -1
    for (let j = xep.length - 1; j >= 0; j--) if (NHAN_CHUNG.has(xep[j]!.nhan)) { i = j; break }
    const bo = xep.splice(i >= 0 ? i : xep.length - 1, 1)[0]!
    lyDo.push(`${noi}: vượt ${THAM_SO_GAN.NEN_TOI_DA} nhãn ⇒ bỏ ${bo.nhan}${i >= 0 ? ' (nhãn chung)' : ''}`)
  }
  return xep.map((x) => x.nhan)
}

// ---------------------------------------------------------------- đọc chữ của câu

const mangChuoi = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => (laObj(x) ? str(x.t ?? x.text ?? x.noi_dung) : str(x))) : typeof v === 'string' ? [v] : [])
const giaTriTheo = (v: unknown, khoa: readonly string[]): string[] => {
  if (Array.isArray(v)) return khoa.map((_, i) => { const x = v[i]; return laObj(x) ? str(x.t ?? x.text ?? x.noi_dung) : str(x) })
  if (laObj(v)) return khoa.map((k) => { const x = v[k] ?? v[k.toUpperCase()] ?? v[k.toLowerCase()]; return laObj(x) ? str(x.t ?? x.text ?? x.noi_dung) : str(x) })
  return khoa.map(() => '')
}
const lyDoCua = (x: unknown): string => (laObj(x) ? str(x.viSao ?? x.vi_sao ?? x.ly_do) : str(x))
interface ChuLoiGiai { chung: string[]; theoY: string[] }
/** Chữ lời giải: phần chung (chốt, bước, kết quả, lý do từng phương án) + lý do từng ý (Phần II). Chuỗi cũ "a) … b) …" ⇒ tách theo ý. */
function chuLoiGiai(lg: unknown, buocNgoai: readonly string[]): ChuLoiGiai {
  const theoY = ['', '', '', '']
  if (typeof lg === 'string') {
    const vt = ['a', 'b', 'c', 'd'].map((k) => lg.search(new RegExp(`(?:^|\\s)${k}[).:]\\s`)))
    if (vt.every((v, i) => v >= 0 && (i === 0 || v > vt[i - 1]!))) vt.forEach((v, i) => { theoY[i] = lg.slice(v, i < 3 ? vt[i + 1] : undefined) })
    return { chung: [lg, ...buocNgoai], theoY }
  }
  if (!laObj(lg)) return { chung: [...buocNgoai], theoY }
  const buoc = mangChuoi(lg.buoc)
  const tungPa = laObj(lg.tungPa) ? lg.tungPa : laObj(lg.tung_pa) ? lg.tung_pa : {}
  const tungY = laObj(lg.tungY) ? lg.tungY : laObj(lg.tung_y) ? lg.tung_y : {}
  ;(['a', 'b', 'c', 'd'] as const).forEach((k, i) => { theoY[i] = lyDoCua(tungY[k]) })
  return {
    chung: [str(lg.chot), str(lg.noi_dung), ...(buoc.length ? buoc : buocNgoai), str(lg.ketQua ?? lg.ket_qua), ...Object.values(tungPa).map(lyDoCua)].filter(Boolean),
    theoY,
  }
}
const maDangCua = (c: CauCanGan): string | null => {
  const d = c.maDang ?? (laObj(c.dang) ? c.dang.ma : c.dang)
  return str(d) || null
}
/** Chuyên đề dùng cho `cd:` — bỏ chữ điền tạm "Hoá học". */
const chuyenDeSach = (cd: string | null | undefined): string | null => { const s = str(cd); return s && s !== 'Hoá học' && s !== 'Hóa học' ? s : null }

/** Vi kỹ năng của dạng khớp kienThuc (chuẩn hoá bằng ten hoặc nhanNen; như omni-q.ts goiYQ). */
function khopKienThuc(kt: readonly string[], vknDang: readonly Vkn[] | undefined): string[] {
  if (!kt.length || !vknDang?.length) return []
  const muc = new Set(kt.map(chuanHoaNhan).filter(Boolean))
  return vknDang.filter((v) => v?.id && (muc.has(chuanHoaNhan(v.ten)) || (!!v.nhanNen && muc.has(chuanHoaNhan(v.nhanNen)))))
    .sort((a, b) => (a.thuTu ?? 0) - (b.thuTu ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).map((v) => v.id)
}
const hop = (...ds: readonly (readonly string[])[]): string[] => [...new Set(ds.flat())]

/** Nhãn nền từng bước đã soạn: theo thứ tự bước, trong TEN_NEN, bỏ trùng; lam_tron_ket_qua chỉ giữ khi là nhãn duy nhất; ≤ trần. */
export function nhanTuBuoc(nhanNen: readonly { buoc: number; nen: string }[] | null | undefined): { nhan: string[]; boPhu: boolean } {
  const ds = (nhanNen ?? [])
    .map((x, i) => ({ buoc: Number.isFinite(Number(x?.buoc)) ? Number(x.buoc) : Number.POSITIVE_INFINITY, i, nen: str(x?.nen) }))
    .filter((x) => laNhanNen(x.nen))
    .sort((a, b) => a.buoc - b.buoc || a.i - b.i)
  const tat = [...new Set(ds.map((x) => x.nen))]
  const chinh = tat.filter((n) => n !== NHAN_PHU)
  if (!chinh.length) return { nhan: tat.slice(0, 1), boPhu: false }
  return { nhan: chinh.slice(0, THAM_SO_GAN.NEN_TOI_DA), boPhu: tat.includes(NHAN_PHU) }
}

/** Số dạng khoá so khớp: bỏ dấu, bỏ số 0 thừa sau dấu phẩy; chỉ nhận số có ≥ 3 chữ số có nghĩa (tránh trùng ngẫu nhiên kiểu 0,1 · 2). */
function khoaSo(s: string): string | null {
  let t = s.replace(/^0+(?=\d)/, '')
  if (t.includes(',')) t = t.replace(/0+$/, '').replace(/,$/, '')
  return t.replace(',', '').replace(/^0+/, '').length >= 3 ? t : null
}
/** Các số đứng ngay sau dấu "=" trong lời giải chung (kết quả được TÍNH ra). */
function soDuocTinh(chung: readonly string[]): Set<string> {
  const ra = new Set<string>()
  for (const m of chuoiToan(chung.join(' \n ')).matchAll(/=\s*[-+]?\s*(\d+(?:,\d+)?)(?![\d^e])/g)) { const k = khoaSo(m[1]!); if (k) ra.add(k) }
  return ra
}
/** Số đầu tiên trong chữ của ý có mặt trong tập số được tính. */
function soChung(chu: string, soTinh: ReadonlySet<string>): string | null {
  if (!soTinh.size) return null
  for (const m of chuoiToan(chu).matchAll(/(?<![\d,])(\d+(?:,\d+)?)(?![\d^e])/g)) { const k = khoaSo(m[1]!); if (k && soTinh.has(k)) return m[1]! }
  return null
}

// ---------------------------------------------------------------- gắn một câu (THUẦN)

/**
 * Gắn ma trận Q cho MỘT câu — hàm thuần, tất định. Không bao giờ trả vkn rỗng; Phần II luôn có đúng 4 vknY.
 * nguon = 'goi_y'. doTin: 1 nhãn bước · 0,8 dò mẫu · 1 chỉ dạng.
 */
export function ganVknCau(cau: CauCanGan, tuy: TuyChonGan = {}): KetQuaGan {
  const phan: Phan = cau.phan === 'II' || cau.phan === 'III' ? cau.phan : 'I'
  const maDang = maDangCua(cau)
  const lyDo: string[] = []
  const dang = vknMacDinh(maDang, chuyenDeSach(cau.chuyenDe), cau.qid)
  if (!maDang) lyDo.push(`Thiếu mã dạng ⇒ vi kỹ năng gốc ${dang}`)
  const kienThuc = mangChuoi(cau.kienThuc)
  const ktDang = khopKienThuc(kienThuc, tuy.vknDang)
  if (ktDang.length) lyDo.push(`kienThuc khớp vi kỹ năng của dạng: ${ktDang.join(', ')}`)
  const lg = chuLoiGiai(cau.loiGiai ?? cau.solution, mangChuoi(cau.buoc))
  const de = str(cau.de ?? cau.text)
  const bang = (cau.bang ?? cau.table ?? []).flatMap((r) => (Array.isArray(r) ? r.map((x) => str(x)) : [])).join(' | ')
  const themY = (y: number) => (tuy.themNhan ?? []).filter((t) => t.y === y && !!t.vkn).map((t) => t.vkn)
  const tuBuoc = nhanTuBuoc(cau.nhanNen)
  let nguonNhan: KetQuaGan['nguonNhan'] = 'dang'
  let nenCa: string[]
  if (tuBuoc.nhan.length) {
    nguonNhan = 'buoc'
    nenCa = tuBuoc.nhan
    lyDo.push(`Nhãn nền từng bước đã soạn: ${nenCa.join(', ')}`)
    if (tuBuoc.boPhu) lyDo.push('Bỏ lam_tron_ket_qua khỏi cổng AND (kỹ năng phụ)')
  } else {
    const chuCa = taoChuDo([de, ...(phan === 'I' ? giaTriTheo(cau.pa ?? cau.choices, ['A', 'B', 'C', 'D']) : []), bang, ...lg.chung, ...(phan === 'II' ? [] : kienThuc)])
    const ds = doNhan(chuCa)
    nenCa = chonNhan(ds, lyDo, 'Cả câu')
    if (nenCa.length) { nguonNhan = 'mau'; for (const x of ds.filter((d) => nenCa.includes(d.nhan))) lyDo.push(`Dò mẫu: ${x.nhan} ← «${x.doan}»`) }
    else if (phan !== 'II') lyDo.push(chuCa.coA ? 'Có phép tính nhưng chưa dò chắc kiến thức nền nào ⇒ chỉ gắn dạng' : 'Câu không có phép tính ⇒ chỉ gắn dạng')
  }
  let vknY: string[][] | undefined
  if (phan === 'II') {
    const y = giaTriTheo(cau.y ?? cau.ideas, ['a', 'b', 'c', 'd'])
    const nhanChung = [...nenCa]
    const soTinh = soDuocTinh(lg.chung)
    const nenY = [0, 1, 2, 3].map((i) => {
      const ds = doNhan(taoChuDo([y[i]!, lg.theoY[i]!]))
      let nhan = chonNhan(ds, lyDo, `Ý ${'abcd'[i]}`)
      if (tuBuoc.nhan.length) nhan = nhan.filter((n) => tuBuoc.nhan.includes(n))
      for (const x of ds) if (nhan.includes(x.nhan)) lyDo.push(`Ý ${'abcd'[i]} dò mẫu: ${x.nhan} ← «${x.doan}»`)
      // Ý nêu một con số mà lời giải chung TÍNH RA (≥ 3 chữ số có nghĩa), và lời giải chung chỉ dùng MỘT kiến thức nền ⇒ ý cần đúng kiến thức đó.
      if (nhanChung.length === 1 && !nhan.includes(nhanChung[0]!)) {
        const so = soChung(`${y[i]} ${lg.theoY[i]}`, soTinh)
        if (so) {
          nhan = chonNhan([...nhan.map((n, k) => ({ nhan: n, vt: k, doan: '' })), { nhan: nhanChung[0]!, vt: 50, doan: '' }], lyDo, `Ý ${'abcd'[i]}`)
          lyDo.push(`Ý ${'abcd'[i]}: kế thừa nhãn duy nhất của lời giải chung ${nhanChung[0]} (số ${so} được tính ở lời giải)`)
        }
      }
      return nhan
    })
    nenY.forEach((ds, i) => lyDo.push(`Ý ${'abcd'[i]}: ${ds.length ? ds.join(', ') : 'chỉ dạng (ý lý thuyết hoặc chưa dò chắc)'}`))
    if (!tuBuoc.nhan.length) {
      // Hợp các ý (ý a trước, trong ý theo vị trí) rồi tới nhãn của lời giải chung.
      const gop = chonNhan([...nenY.flatMap((ds, i) => ds.map((nhan, k) => ({ nhan, vt: i * 10 + k, doan: '' }))), ...nenCa.map((nhan, k) => ({ nhan, vt: 100 + k, doan: '' }))],
        lyDo, 'Cả câu (hợp các ý)')
      nenCa = gop
      if (nenY.some((ds) => ds.length)) nguonNhan = 'mau'
    }
    vknY = nenY.map((ds, i) => hop([dang], khopKienThuc(cau.kienThucY?.[i] ? [...cau.kienThucY[i]!] : [], tuy.vknDang), ds.map(vknNen), themY(i)))
  }
  const vkn = hop([dang], ktDang, nenCa.map(vknNen), themY(-1))
  if (themY(-1).length || [0, 1, 2, 3].some((i) => themY(i).length)) lyDo.push('Giữ vi kỹ năng kiểm định tuần đã thêm theo dữ liệu')
  if (nguonNhan === 'dang' && (ktDang.length || themY(-1).length)) nguonNhan = 'mau'
  const doTin = nguonNhan === 'buoc' ? THAM_SO_GAN.DO_TIN.BUOC : nguonNhan === 'mau' ? THAM_SO_GAN.DO_TIN.MAU : THAM_SO_GAN.DO_TIN.DANG
  return { q: { qid: cau.qid, phan, maDang, mucDo: str(cau.mucDo) || null, vkn, ...(vknY ? { vknY } : {}), nguon: 'goi_y' }, doTin, lyDo, nguonNhan }
}

// ---------------------------------------------------------------- D1: bảng

/** Bảng của làn (CHỈ-THÊM). omni_vkn/omni_q đúng lược đồ migration-0510-omni-3.sql; ba bảng phụ omni_q_gan / omni_q_nhat_ky / omni_q_nghi. */
export const SQL_BANG_GAN_VKN: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS omni_vkn (id TEXT PRIMARY KEY, ma_dang TEXT NOT NULL, ten TEXT NOT NULL, ten_loi TEXT, nhan_nen TEXT, thu_tu INTEGER NOT NULL DEFAULT 0)',
  'CREATE INDEX IF NOT EXISTS omni_vkn_dang ON omni_vkn(ma_dang, thu_tu)',
  'CREATE TABLE IF NOT EXISTS omni_q (qid TEXT NOT NULL, y INTEGER NOT NULL DEFAULT -1, vkn_json TEXT NOT NULL, nguon TEXT NOT NULL, duyet_luc TEXT, PRIMARY KEY (qid, y))',
  'CREATE TABLE IF NOT EXISTS omni_q_gan (qid TEXT PRIMARY KEY, phien_ban TEXT NOT NULL, ban_cau TEXT, nguon_nhan TEXT NOT NULL, do_tin REAL NOT NULL, ly_do_json TEXT, luc TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS omni_q_nhat_ky (id INTEGER PRIMARY KEY AUTOINCREMENT, qid TEXT NOT NULL, y INTEGER NOT NULL DEFAULT -1, luc TEXT NOT NULL, loai TEXT NOT NULL, cu TEXT, moi TEXT, vkn_them TEXT, ly_do TEXT, ban_cau TEXT)',
  'CREATE INDEX IF NOT EXISTS omni_q_nhat_ky_qid ON omni_q_nhat_ky(qid, loai)',
  'CREATE TABLE IF NOT EXISTS omni_q_nghi (qid TEXT PRIMARY KEY, so_lan INTEGER NOT NULL, so_sai INTEGER NOT NULL, ty_le_sai REAL NOT NULL, ghi_chu TEXT, luc TEXT NOT NULL)',
]
const daTaoBang = new WeakMap<object, Promise<void>>()
export function damBaoBangGanVkn(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTaoBang.get(k)
  if (!p) {
    p = env.DB.batch(SQL_BANG_GAN_VKN.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTaoBang.delete(k))
    daTaoBang.set(k, p)
  }
  return p
}
const dsJson = (a: readonly unknown[]) => JSON.stringify([...new Set(a)])
async function chayLo(env: Env, lenh: readonly D1PreparedStatement[]): Promise<number> {
  let doi = 0
  for (let i = 0; i < lenh.length; i += THAM_SO_GAN.LO_LENH) {
    const kq = await env.DB.batch(lenh.slice(i, i + THAM_SO_GAN.LO_LENH) as D1PreparedStatement[])
    for (const r of kq) doi += Number(r?.meta?.changes ?? 0)
  }
  return doi
}
const docMang = (v: unknown): unknown[] => { try { const a = JSON.parse(str(v) || '[]'); return Array.isArray(a) ? a : [] } catch { return [] } }
const mangVkn = (v: unknown): string[] => docMang(v).map((x) => str(x)).filter(Boolean)
const ngayVnCua = (ms: number) => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)
/** Mã tờ đã tách phần `<gốc>-TN|-DS|-TLN` ⇒ mã gốc (khoá game_v2_question.ma_de) + phần (như srs2-gv.ts tachMaTo). */
function tachMaTo(maDe: string): { goc: string; phan: Phan | null } {
  const m = maDe.trim().match(/^(.*)-(TN|DS|TLN)$/)
  return m ? { goc: m[1]!, phan: ({ TN: 'I', DS: 'II', TLN: 'III' } as const)[m[2] as 'TN' | 'DS' | 'TLN'] } : { goc: maDe.trim(), phan: null }
}

// ---------------------------------------------------------------- D1: đọc câu + nhãn bước

/** Bỏ trường nặng (ảnh) khi đọc câu để gắn; ảnh chỉ đọc lại khi cần băm nội dung. */
const SQL_CAU_GON = `json_remove(json,'$.imageDataUrl','$.thanCauImg','$.choiceImgs','$.ideaImgs','$.hinhAnh','$.hinh','$.anhLuaChon','$.anhY')`
interface CauDoc { maDe: string; qid: string; version: string; dang: string | null; json: Row; rid: number }
async function docCauTheoTo(env: Env, maDe: readonly string[]): Promise<CauDoc[]> {
  const to = maDe.map(tachMaTo).filter((t) => t.goc)
  if (!to.length) return []
  const r = await env.DB.prepare(`SELECT ma_de, qid, version, dang, ${SQL_CAU_GON} AS gon, rowid AS rid FROM game_v2_question
    WHERE ma_de IN (SELECT value FROM json_each(?)) AND json_valid(json) ORDER BY rowid`).bind(dsJson(to.map((t) => t.goc))).all<Row>()
  const ra: CauDoc[] = [], da = new Set<string>()
  for (const t of to) {
    for (const x of r.results ?? []) {
      if (str(x.ma_de) !== t.goc) continue
      let j: Row
      try { const v = JSON.parse(str(x.gon)); if (!laObj(v)) continue; j = v } catch { continue }
      if (t.phan && str(j.phan) !== t.phan) continue
      const qid = str(x.qid)
      if (!qid || da.has(qid)) continue
      da.add(qid)
      ra.push({ maDe: t.goc, qid, version: str(x.version), dang: str(x.dang) || null, json: j, rid: Number(x.rid) || 0 })
    }
  }
  return ra
}
interface BoTroGan { nhanNen: { buoc: number; nen: string }[]; buoc: string[]; nguon: 'bam' | 'bam_tinh' | 'qid_mau' }
const boTroTuDong = (x: Row, nguon: BoTroGan['nguon']): BoTroGan => ({
  nhanNen: docMang(x.nhan_nen_json).filter((v): v is Row => laObj(v) && Number.isInteger(v.buoc) && typeof v.nen === 'string').map((v) => ({ buoc: Number(v.buoc), nen: str(v.nen) })),
  buoc: docMang(x.buoc_json).map((v) => str(v)).filter(Boolean),
  nguon,
})
/** Câu kho dựng lại từ JSON chỉ mục game (để băm như `bamCau`). Hỏng ⇒ null. */
function cauKhoTuGame(maDe: string, j: Row): Parameters<typeof bamCau>[0] | null {
  const tho = { qid: j.qid, phan: j.phan, de: j.text, pa: j.phan === 'I' ? j.choices : undefined, y: j.phan === 'II' ? j.ideas : undefined, dap_an: j.correct, bang: j.table, hinh: j.hinhAnh }
  return cauTrongGoi(maDe, { cau: [tho] })[0] ?? null
}
/**
 * Nhãn bước của các câu (cau_bo_tro theo BĂM nội dung câu):
 *   (1) câu có dòng loi_giai_cau ⇒ băm HIỆN TẠI của câu = loi_giai_cau.bam ⇒ chỉ dùng cau_bo_tro của băm đó (không có ⇒ không có nhãn bước:
 *       dòng qid_mau cũ có thể là nội dung trước khi sửa câu);
 *   (2) câu chưa có dòng loi_giai_cau (tờ nạp trước khi có bảng) ⇒ tự băm lại nội dung câu đúng như `bamCau` lúc nạp đề (đọc kèm ảnh, từng lô 20 câu);
 *   (3) vẫn không thấy ⇒ dòng cau_bo_tro có qid_mau = qid. Bảng chưa có ⇒ rỗng.
 */
async function docBoTroGan(env: Env, cau: readonly CauDoc[]): Promise<Map<string, BoTroGan>> {
  const ra = new Map<string, BoTroGan>()
  if (!cau.length) return ra
  const co = (x: BoTroGan) => x.nhanNen.length > 0 || x.buoc.length > 0
  const r1 = await env.DB.prepare(`SELECT l.qid AS qid, b.nhan_nen_json, b.buoc_json, b.bam AS co_bo_tro FROM loi_giai_cau l LEFT JOIN cau_bo_tro b ON b.bam = l.bam
    WHERE l.qid IN (SELECT value FROM json_each(?))`).bind(dsJson(cau.map((c) => c.qid))).all<Row>().catch(() => ({ results: [] as Row[] }))
  const coBam = new Set<string>()
  for (const x of r1.results ?? []) {
    coBam.add(str(x.qid))
    if (x.co_bo_tro == null) continue
    const b = boTroTuDong(x, 'bam')
    if (co(b)) ra.set(str(x.qid), b)
  }
  const chuaBam = cau.filter((c) => !coBam.has(c.qid)).map((c) => c.qid)
  if (!chuaBam.length) return ra
  const coBang = await env.DB.prepare('SELECT 1 AS co FROM cau_bo_tro LIMIT 1').first<Row>().catch(() => null)
  if (!coBang) return ra
  const bamQ = new Map<string, string>()
  for (let i = 0; i < chuaBam.length; i += 20) {
    const day = await env.DB.prepare('SELECT ma_de, qid, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) AND json_valid(json)')
      .bind(JSON.stringify(chuaBam.slice(i, i + 20))).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of day.results ?? []) {
      const qid = str(x.qid)
      if (bamQ.has(qid)) continue
      try {
        const j = JSON.parse(str(x.json))
        const k = laObj(j) ? cauKhoTuGame(str(x.ma_de), j) : null
        if (k) bamQ.set(qid, await bamCau(k))
      } catch { /* câu hỏng: bỏ */ }
    }
  }
  if (bamQ.size) {
    const r2 = await env.DB.prepare('SELECT bam, nhan_nen_json, buoc_json FROM cau_bo_tro WHERE bam IN (SELECT value FROM json_each(?))').bind(dsJson([...bamQ.values()])).all<Row>().catch(() => ({ results: [] as Row[] }))
    const theoBam = new Map((r2.results ?? []).map((x) => [str(x.bam), boTroTuDong(x, 'bam_tinh')]))
    for (const [q, b] of bamQ) { const v = theoBam.get(b); if (v && co(v)) ra.set(q, v) }
  }
  const conThieu = chuaBam.filter((q) => !ra.has(q))
  if (conThieu.length) {
    const r3 = await env.DB.prepare('SELECT qid_mau, nhan_nen_json, buoc_json FROM cau_bo_tro WHERE qid_mau IN (SELECT value FROM json_each(?))').bind(dsJson(conThieu)).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r3.results ?? []) { const b = boTroTuDong(x, 'qid_mau'); if (co(b) && !ra.has(str(x.qid_mau))) ra.set(str(x.qid_mau), b) }
  }
  return ra
}
async function docVknDang(env: Env, dangs: readonly string[]): Promise<Map<string, Vkn[]>> {
  const ra = new Map<string, Vkn[]>()
  const ds = [...new Set(dangs.filter(Boolean))]
  if (!ds.length) return ra
  const r = await env.DB.prepare('SELECT id, ma_dang, ten, ten_loi, nhan_nen, thu_tu FROM omni_vkn WHERE ma_dang IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ds)).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const v: Vkn = { id: str(x.id), maDang: str(x.ma_dang), ten: str(x.ten), tenLoi: str(x.ten_loi) || null, nhanNen: str(x.nhan_nen) || null, thuTu: Number(x.thu_tu) || 0 }
    ra.set(v.maDang, [...(ra.get(v.maDang) ?? []), v])
  }
  return ra
}

// ---------------------------------------------------------------- D1: gắn + ghi

export interface KetQuaGanD1 { soCau: number; soGhi: number; theoNguon: Record<string, number> }
const capCauGan = (c: CauDoc, bt: BoTroGan | undefined): CauCanGan => ({
  qid: c.qid, phan: str(c.json.phan), maDang: c.dang ?? (str(c.json.dang) || null), tenDang: str(c.json.tenDang) || null, chuyenDe: str(c.json.chuyenDe) || null,
  mucDo: str(c.json.mucDo) || null, text: str(c.json.text), choices: mangChuoi(c.json.choices), ideas: mangChuoi(c.json.ideas),
  table: Array.isArray(c.json.table) ? (c.json.table as unknown[][]) : null, solution: c.json.solution ?? c.json.loiGiai ?? null,
  buoc: bt?.buoc ?? null, nhanNen: bt?.nhanNen ?? null, kienThuc: mangChuoi(c.json.kienThuc),
  kienThucY: Array.isArray(c.json.kienThucY) ? (c.json.kienThucY as unknown[]).map((x) => mangChuoi(x)) : null,
})
/** Gắn + ghi cho một danh sách câu đã đọc. Không đè dòng 'thay'; chỉ ghi dòng đổi; luôn ghi omni_q_gan (đánh dấu đã xử lý). */
async function ganVaGhi(env: Env, cau: readonly CauDoc[], nowMs: number): Promise<KetQuaGanD1> {
  const theoNguon: Record<string, number> = {}
  if (!cau.length) return { soCau: 0, soGhi: 0, theoNguon }
  const qids = cau.map((c) => c.qid)
  const [boTro, vknDang, cu, them] = await Promise.all([
    docBoTroGan(env, cau),
    docVknDang(env, cau.map((c) => c.dang ?? '')),
    env.DB.prepare('SELECT qid, y, vkn_json, nguon FROM omni_q WHERE qid IN (SELECT value FROM json_each(?))').bind(dsJson(qids)).all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare(`SELECT qid, y, vkn_them, ban_cau FROM omni_q_nhat_ky WHERE loai = 'them_nhan' AND qid IN (SELECT value FROM json_each(?))`).bind(dsJson(qids)).all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const dongCu = new Map<string, { vkn: string; nguon: string }>()
  const coThay = new Set<string>()
  for (const x of cu.results ?? []) {
    dongCu.set(`${str(x.qid)}|${Number(x.y)}`, { vkn: JSON.stringify(mangVkn(x.vkn_json)), nguon: str(x.nguon) })
    if (str(x.nguon) === 'thay') coThay.add(str(x.qid))
  }
  const banCau = new Map(cau.map((c) => [c.qid, c.version]))
  const themTheoQ = new Map<string, { y: number; vkn: string }[]>()
  for (const x of them.results ?? []) {
    const q = str(x.qid)
    if (str(x.ban_cau) !== banCau.get(q) || !str(x.vkn_them)) continue // câu đã đổi nội dung ⇒ bằng chứng cũ hết hiệu lực
    themTheoQ.set(q, [...(themTheoQ.get(q) ?? []), { y: Number(x.y), vkn: str(x.vkn_them) }])
  }
  const nay = new Date(nowMs).toISOString()
  const lenhQ: D1PreparedStatement[] = [], lenhPhu: D1PreparedStatement[] = []
  const nhanDung = new Set<string>()
  for (const c of cau) {
    if (coThay.has(c.qid)) {
      theoNguon.thay = (theoNguon.thay ?? 0) + 1
      lenhPhu.push(env.DB.prepare(`INSERT INTO omni_q_gan (qid, phien_ban, ban_cau, nguon_nhan, do_tin, ly_do_json, luc) VALUES (?,?,?,?,?,?,?)
        ON CONFLICT(qid) DO UPDATE SET phien_ban = excluded.phien_ban, ban_cau = excluded.ban_cau, nguon_nhan = excluded.nguon_nhan, do_tin = excluded.do_tin, ly_do_json = excluded.ly_do_json, luc = excluded.luc`)
        .bind(c.qid, PHIEN_BAN_GAN, c.version, 'thay', 1, JSON.stringify(['Thầy đã duyệt ma trận Q của câu — giữ nguyên']), nay))
      continue
    }
    let kq: KetQuaGan
    try {
      kq = ganVknCau(capCauGan(c, boTro.get(c.qid)), { vknDang: vknDang.get(c.dang ?? '') ?? [], themNhan: themTheoQ.get(c.qid) })
    } catch (e) {
      // Không gắn được ⇒ LÙI VỀ MỨC THÔ (một vi kỹ năng = dạng) để câu không treo trong hàng chờ việc đêm.
      theoNguon.loi = (theoNguon.loi ?? 0) + 1
      lenhQ.push(env.DB.prepare(`INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?,?,?,'goi_y',?)
        ON CONFLICT(qid, y) DO UPDATE SET vkn_json = excluded.vkn_json, nguon = 'goi_y', duyet_luc = excluded.duyet_luc WHERE omni_q.nguon <> 'thay'`)
        .bind(c.qid, -1, JSON.stringify([vknMacDinh(c.dang ?? (str(c.json.dang) || null), chuyenDeSach(str(c.json.chuyenDe)), c.qid)]), nay))
      lenhPhu.push(env.DB.prepare(`INSERT INTO omni_q_gan (qid, phien_ban, ban_cau, nguon_nhan, do_tin, ly_do_json, luc) VALUES (?,?,?,?,?,?,?)
        ON CONFLICT(qid) DO UPDATE SET phien_ban = excluded.phien_ban, ban_cau = excluded.ban_cau, nguon_nhan = excluded.nguon_nhan, do_tin = excluded.do_tin, ly_do_json = excluded.ly_do_json, luc = excluded.luc`)
        .bind(c.qid, PHIEN_BAN_GAN, c.version, 'loi', 0, JSON.stringify([`Lỗi gắn: ${String((e as Error)?.message ?? e).slice(0, 120)}`]), nay))
      continue
    }
    theoNguon[kq.nguonNhan] = (theoNguon[kq.nguonNhan] ?? 0) + 1
    const dong: [number, string[]][] = [[-1, kq.q.vkn], ...(kq.q.vknY ?? []).map((v, i) => [i, v] as [number, string[]])]
    for (const [y, vkn] of dong) {
      for (const v of vkn) if (v.startsWith('nen:')) nhanDung.add(v.slice(4))
      const moi = JSON.stringify(vkn), truoc = dongCu.get(`${c.qid}|${y}`)
      if (truoc && truoc.nguon === 'goi_y' && truoc.vkn === moi) continue
      lenhQ.push(env.DB.prepare(`INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?,?,?,'goi_y',?)
        ON CONFLICT(qid, y) DO UPDATE SET vkn_json = excluded.vkn_json, nguon = 'goi_y', duyet_luc = excluded.duyet_luc WHERE omni_q.nguon <> 'thay'`).bind(c.qid, y, moi, nay))
    }
    lenhPhu.push(env.DB.prepare(`INSERT INTO omni_q_gan (qid, phien_ban, ban_cau, nguon_nhan, do_tin, ly_do_json, luc) VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(qid) DO UPDATE SET phien_ban = excluded.phien_ban, ban_cau = excluded.ban_cau, nguon_nhan = excluded.nguon_nhan, do_tin = excluded.do_tin, ly_do_json = excluded.ly_do_json, luc = excluded.luc`)
      .bind(c.qid, PHIEN_BAN_GAN, c.version, kq.nguonNhan, kq.doTin, JSON.stringify(kq.lyDo.slice(0, 24)), nay))
  }
  const thuTu = Object.keys(TEN_NEN)
  for (const n of nhanDung) {
    lenhPhu.push(env.DB.prepare('INSERT OR IGNORE INTO omni_vkn (id, ma_dang, ten, ten_loi, nhan_nen, thu_tu) VALUES (?,?,?,?,?,?)')
      .bind(vknNen(n), '', TEN_NEN[n] ?? n, TEN_LOI_NEN[n] ?? null, n, Math.max(0, thuTu.indexOf(n))))
  }
  const soGhi = await chayLo(env, lenhQ)
  await chayLo(env, lenhPhu)
  return { soCau: cau.length, soGhi, theoNguon }
}

/**
 * Gắn vi kỹ năng cho mọi câu của các tờ (mã gốc hoặc mã tách phần -TN/-DS/-TLN) và GHI omni_q (y −1 cả câu; y 0..3 Phần II) nguon 'goi_y' —
 * KHÔNG đè dòng 'thay' — cùng omni_vkn cho mọi `nen:<nhãn>` (INSERT OR IGNORE: không đè dòng thầy sửa). Lô ≤ 40 lệnh. Gọi khi nạp đề / tick bài.
 */
export async function ganVknChoMaDe(env: Env, maDe: readonly string[], nowMs = Date.now()): Promise<KetQuaGanD1> {
  await damBaoBangGanVkn(env)
  const cau = await docCauTheoTo(env, maDe.map(str).filter(Boolean))
  return ganVaGhi(env, cau, nowMs)
}

// ---------------------------------------------------------------- D1: việc đêm

interface ConTroGan { pb: string; ngay: string; xong: boolean; viTri: number; soTo: number; luc: string }
async function docConTro(env: Env): Promise<ConTroGan | null> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CON_TRO_GAN).first<Row>().catch(() => null)
  try { const v = JSON.parse(str(r?.gia_tri)); return laObj(v) ? (v as unknown as ConTroGan) : null } catch { return null }
}
const ghiConTro = (env: Env, ct: ConTroGan) => env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
  .bind(KHOA_CON_TRO_GAN, JSON.stringify(ct), ct.luc).run()
/**
 * Tờ cần gắn theo THỨ TỰ ƯU TIÊN: tờ của bài tick gần nhất (bai_da_day chưa bỏ tick, mới trước) → phạm vi đã dạy (pham_vi_lop, cập nhật mới trước)
 * → mọi tờ DẠY HỌC còn lại (de_kho_thu_muc 'DAY_HOC'; tờ chưa có dòng thư mục mà mã bắt đầu "DH-"; tờ có dòng 'TU_LUYEN' thì không).
 */
async function toDayHocUuTien(env: Env): Promise<string[]> {
  const [tick, pv, tm, kho] = await Promise.all([
    env.DB.prepare('SELECT ma_to_json FROM bai_da_day WHERE bo_tick_luc IS NULL ORDER BY tick_luc DESC, vi_tri DESC').all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare('SELECT ma_de_json FROM pham_vi_lop ORDER BY cap_nhat_luc DESC, vi_tri DESC').all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare('SELECT ma_de, thu_muc FROM de_kho_thu_muc').all<Row>().catch(() => ({ results: [] as Row[] })),
    env.DB.prepare('SELECT DISTINCT ma_de FROM game_v2_question').all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const ra: string[] = [], da = new Set<string>()
  const them = (m: string) => { const s = str(m); if (s && !da.has(s)) { da.add(s); ra.push(s) } }
  for (const x of tick.results ?? []) docMang(x.ma_to_json).forEach((m) => them(str(m)))
  for (const x of pv.results ?? []) docMang(x.ma_de_json).forEach((m) => them(str(m)))
  const thuMuc = new Map<string, string>()
  for (const x of tm.results ?? []) thuMuc.set(str(x.ma_de), str(x.thu_muc))
  const gocCoDong = new Set([...thuMuc.keys()].map((m) => tachMaTo(m).goc))
  for (const [m, t] of [...thuMuc].sort((a, b) => (a[0] < b[0] ? -1 : 1))) if (t === 'DAY_HOC') them(m)
  // Thiếu dòng thư mục ⇒ luật lùi mã "DH-" (kho-thu-muc.ts thuMucTheoMa) — xét TỪNG mã: cả tờ, hoặc từng phần chưa có dòng khi tờ đã có dòng tách phần.
  for (const g of (kho.results ?? []).map((x) => str(x.ma_de)).sort()) {
    if (!g.toUpperCase().startsWith('DH-') || thuMuc.has(g)) continue
    if (!gocCoDong.has(g)) them(g)
    else for (const h of ['TN', 'DS', 'TLN']) if (!thuMuc.has(`${g}-${h}`)) them(`${g}-${h}`)
  }
  return ra
}
/**
 * Việc đêm: gắn mọi câu thuộc tờ DẠY HỌC chưa có dòng omni_q hoặc gắn bằng phiên bản cũ (PHIEN_BAN_GAN) / nội dung câu đã đổi (version), ưu tiên tờ của
 * bài tick gần nhất; ≤ 400 câu/lượt cron; con trỏ ở cau_hinh 'omni_gan_con_tro' (xong trong ngày ⇒ lượt sau trả ngay). Idempotent; KHÔNG BAO GIỜ ném lỗi.
 */
export async function chayGanVknDem(env: Env, nowMs = Date.now(), tuy: { toiDa?: number } = {}): Promise<{ ok: boolean; soTo: number; soCau: number; soGhi: number; xong: boolean; boQua?: string; loi?: string }> {
  try {
    await damBaoBangGanVkn(env)
    const ngay = ngayVnCua(nowMs), luc = new Date(nowMs).toISOString()
    const ct = await docConTro(env)
    if (ct && ct.pb === PHIEN_BAN_GAN && ct.ngay === ngay && ct.xong) return { ok: true, soTo: 0, soCau: 0, soGhi: 0, xong: true, boQua: 'da_xong_hom_nay' }
    const toiDa = Math.max(1, Math.floor(tuy.toiDa ?? THAM_SO_GAN.CAU_MOI_LUOT_DEM))
    const dsTo = await toDayHocUuTien(env)
    const to = dsTo.map(tachMaTo)
    const r = to.length ? await env.DB.prepare(`SELECT q.ma_de AS ma_de, q.qid AS qid, json_extract(q.json,'$.phan') AS phan, q.rowid AS rid FROM game_v2_question q
        LEFT JOIN omni_q_gan g ON g.qid = q.qid
        LEFT JOIN omni_q o ON o.qid = q.qid AND o.y = -1
        WHERE q.ma_de IN (SELECT value FROM json_each(?)) AND json_valid(q.json)
          AND (g.qid IS NULL OR g.phien_ban <> ? OR COALESCE(g.ban_cau, '') <> q.version OR o.qid IS NULL)`)
      .bind(dsJson(to.map((t) => t.goc)), PHIEN_BAN_GAN).all<Row>() : { results: [] as Row[] }
    // Xếp câu chờ theo tờ ưu tiên (tờ đầu tiên phủ câu), rồi thứ tự câu trong tờ.
    const cho = (r.results ?? []).map((x) => {
      const vt = to.findIndex((t) => t.goc === str(x.ma_de) && (!t.phan || t.phan === str(x.phan)))
      return { maDe: str(x.ma_de), qid: str(x.qid), vt, rid: Number(x.rid) || 0 }
    }).filter((x) => x.vt >= 0).sort((a, b) => a.vt - b.vt || a.rid - b.rid)
    const chon: typeof cho = [], da = new Set<string>()
    for (const x of cho) { if (da.has(x.qid)) continue; da.add(x.qid); chon.push(x); if (chon.length >= toiDa) break }
    const conCho = new Set(cho.map((x) => x.qid)).size - chon.length
    let soGhi = 0
    if (chon.length) {
      const dsQ = new Set(chon.map((x) => x.qid))
      const maDeChon = [...new Set(chon.map((x) => x.maDe))]
      const cau = (await docCauTheoTo(env, maDeChon)).filter((c) => dsQ.has(c.qid))
      soGhi = (await ganVaGhi(env, cau, nowMs)).soGhi
    }
    const xong = conCho <= 0
    const viTri = chon.length ? chon[chon.length - 1]!.vt : dsTo.length
    await ghiConTro(env, { pb: PHIEN_BAN_GAN, ngay, xong, viTri, soTo: dsTo.length, luc })
    return { ok: true, soTo: new Set(chon.map((x) => x.maDe)).size, soCau: chon.length, soGhi, xong }
  } catch (e) {
    return { ok: false, soTo: 0, soCau: 0, soGhi: 0, xong: false, loi: String((e as Error)?.message ?? e).slice(0, 200) }
  }
}

// ---------------------------------------------------------------- D1: kiểm định Q hằng tuần (de la Torre 2008, rút gọn)

/** Kết quả từng ý Phần II từ subitem_json: [1,0,null,1] · {y:[…]} · [{correct|dung}]. Lạ ⇒ null. */
function docYSubitem(v: unknown): (0 | 1 | null)[] | null {
  let o: unknown = v
  if (typeof o === 'string') { if (!o.trim()) return null; try { o = JSON.parse(o) } catch { return null } }
  if (laObj(o)) o = o.y
  if (!Array.isArray(o) || o.length !== 4) return null
  const ra: (0 | 1 | null)[] = []
  for (const x of o) {
    const g = laObj(x) ? (x.correct ?? x.dung ?? null) : x
    if (g === 1 || g === true) ra.push(1)
    else if (g === 0 || g === false) ra.push(0)
    else if (g === null || g === undefined) ra.push(null)
    else return null
  }
  return ra
}
const tuanCua = (ngay: string) => { const d = new Date(`${ngay}T00:00:00Z`); const thu = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - thu * 86_400_000).toISOString().slice(0, 10) }
export interface QuanSat { sbd: string; o: 0 | 1 }
type QuyetDinhQ = XetQ & { y: number }
/** Thuần: một câu (hoặc một ý) — quyết định giữ / thêm nhãn / nghi. `vung` = tập vi kỹ năng VỮNG của từng em. */
export interface XetQ { loai: 'giu' | 'thieu' | 'them_nhan' | 'nghi'; soVung: number; tiLeVung: number; vkn?: string; chenh?: number; r1?: number; r0?: number; n1?: number; n0?: number }
export function xetMotQ(qs: readonly QuanSat[], vkn: readonly string[], vung: ReadonlyMap<string, ReadonlySet<string>>, nhanUngVien: readonly string[]): XetQ {
  const K = THAM_SO_GAN.KIEM_Q
  const M = qs.filter((x) => vkn.every((k) => vung.get(x.sbd)?.has(k)))
  const tl = (ds: readonly QuanSat[]) => (ds.length ? ds.reduce((s, x) => s + x.o, 0) / ds.length : 0)
  const pM = tl(M)
  if (M.length < K.EM_VUNG_TOI_THIEU) return { loai: 'thieu', soVung: M.length, tiLeVung: pM }
  if (pM >= K.NGUONG_DUNG_VUNG) return { loai: 'giu', soVung: M.length, tiLeVung: pM }
  let tot: { vkn: string; chenh: number; r1: number; r0: number; n1: number; n0: number } | null = null
  for (const n of nhanUngVien) {
    const id = vknNen(n)
    if (vkn.includes(id)) continue
    const G1 = M.filter((x) => vung.get(x.sbd)?.has(id)), G0 = M.filter((x) => !vung.get(x.sbd)?.has(id))
    if (G1.length < K.EM_NHOM_TOI_THIEU || G0.length < K.EM_NHOM_TOI_THIEU) continue
    const r1 = tl(G1), r0 = tl(G0), chenh = r1 - r0
    if (chenh >= K.CHENH_TOI_THIEU && r1 > pM && (!tot || chenh > tot.chenh + 1e-12)) tot = { vkn: id, chenh, r1, r0, n1: G1.length, n0: G0.length }
  }
  if (tot) return { loai: 'them_nhan', vkn: tot.vkn, soVung: M.length, tiLeVung: pM, chenh: tot.chenh, r1: tot.r1, r0: tot.r0, n1: tot.n1, n0: tot.n0 }
  return { loai: 'nghi', soVung: M.length, tiLeVung: pM }
}
const pt = (x: number) => `${Math.round(x * 100)} %`
/**
 * Tự kiểm định ma trận Q hằng tuần: câu ≥ 30 lượt tự làm (bỏ đọc lời giải/lướt/hỗ trợ) — lượt CUỐI của mỗi em — nhóm em VỮNG mọi vi kỹ năng đã gắn
 * (omni_p_vkn 'vung', ≥ 10 em) đúng < 60 % ⇒ thêm nhãn nền tách nhóm vững tốt nhất (chênh ≥ 0,3, mỗi nhóm ≥ 10 em) vào Q (nguon 'goi_y', ghi lý do);
 * không có ⇒ đánh dấu câu nghi (bảng riêng omni_q_nghi — không đụng cau_nghi_dap_an). Phần II xét TỪNG Ý (subitem_json); thiếu kết quả từng ý ⇒ bỏ qua.
 * Không bao giờ xoá vi kỹ năng; câu thầy duyệt Q ⇒ chỉ ghi gợi ý vào nhật ký. Thiếu dữ liệu ⇒ không đổi gì. Idempotent theo tuần.
 */
export async function kiemDinhQTuan(env: Env, nowMs = Date.now()): Promise<Record<string, unknown>> {
  try {
    await damBaoBangGanVkn(env)
    const K = THAM_SO_GAN.KIEM_Q
    const tuan = tuanCua(ngayVnCua(nowMs)), nay = new Date(nowMs).toISOString()
    const daChay = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_KIEM_Q_TUAN).first<Row>().catch(() => null)
    if (str(daChay?.gia_tri) === tuan) return { ok: true, chay: false, lyDo: 'da_chay_tuan_nay', tuan }
    const LOC = `ket_qua IS NOT NULL AND ${SQL_LA_LAN_LAM} AND COALESCE(assistance, '') <> 'assisted' AND COALESCE(visibility, '') <> 'embargoed' AND qid NOT LIKE 'nen:%' AND instr(qid, '~ss') = 0 AND instr(qid, '~bt') = 0 AND instr(qid, '~yd') = 0`
    const ung = await env.DB.prepare(`SELECT qid, COUNT(*) AS n FROM su_kien_hoc WHERE ${LOC} GROUP BY qid HAVING COUNT(*) >= ? ORDER BY n DESC, qid LIMIT ?`)
      .bind(K.LUOT_TOI_THIEU, K.CAU_TOI_DA).all<Row>().catch(() => ({ results: [] as Row[] }))
    const qids = (ung.results ?? []).map((x) => str(x.qid))
    const xong = async (kq: Record<string, unknown>) => {
      await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc').bind(KHOA_KIEM_Q_TUAN, tuan, nay).run()
      return { ok: true, chay: true, tuan, ...kq }
    }
    if (!qids.length) return xong({ soCauXet: 0, soThemNhan: 0, soGoiYThay: 0, soNghi: 0, chiTiet: [] })
    const [qRows, meta] = await Promise.all([
      env.DB.prepare('SELECT qid, y, vkn_json, nguon FROM omni_q WHERE qid IN (SELECT value FROM json_each(?))').bind(dsJson(qids)).all<Row>().catch(() => ({ results: [] as Row[] })),
      env.DB.prepare(`SELECT qid, version, json_extract(json,'$.phan') AS phan FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))`).bind(dsJson(qids)).all<Row>().catch(() => ({ results: [] as Row[] })),
    ])
    const Q = new Map<string, { nguon: string; dong: Map<number, string[]> }>()
    for (const x of qRows.results ?? []) {
      const q = str(x.qid), ng = str(x.nguon)
      if (ng !== 'thay' && ng !== 'goi_y') continue
      const cu = Q.get(q)
      if (cu && cu.nguon === 'thay' && ng !== 'thay') continue
      const o = cu && cu.nguon === ng ? cu : { nguon: ng, dong: new Map<number, string[]>() }
      o.dong.set(Number(x.y), mangVkn(x.vkn_json))
      Q.set(q, o)
    }
    const phanQ = new Map<string, { phan: string; version: string }>()
    for (const x of meta.results ?? []) if (!phanQ.has(str(x.qid))) phanQ.set(str(x.qid), { phan: str(x.phan), version: str(x.version) })
    // Lượt cuối của mỗi em (thứ tự tiếp nhận) — gần trạng thái vững hiện tại nhất (bảo thủ: không khai oan câu).
    const cuoi = new Map<string, Map<string, { o: 0 | 1; y: (0 | 1 | null)[] | null }>>()
    const coQ = qids.filter((q) => Q.has(q))
    for (let i = 0; i < coQ.length; i += 50) {
      const lo = coQ.slice(i, i + 50)
      const r = await env.DB.prepare(`SELECT qid, sbd, ket_qua, subitem_json FROM su_kien_hoc WHERE ${LOC} AND qid IN (SELECT value FROM json_each(?)) ORDER BY qid, sbd, COALESCE(received_at, 0), luc, khoa`)
        .bind(JSON.stringify(lo)).all<Row>().catch(() => ({ results: [] as Row[] }))
      for (const x of r.results ?? []) {
        const q = str(x.qid), m = cuoi.get(q) ?? new Map()
        m.set(str(x.sbd), { o: Number(x.ket_qua) === 1 ? 1 : 0, y: docYSubitem(x.subitem_json) })
        cuoi.set(q, m)
      }
    }
    const tatEm = [...new Set([...cuoi.values()].flatMap((m) => [...m.keys()]))]
    const vung = new Map<string, Set<string>>()
    for (let i = 0; i < tatEm.length; i += 90) {
      const r = await env.DB.prepare(`SELECT sbd, vkn_id FROM omni_p_vkn WHERE trang_thai = 'vung' AND sbd IN (SELECT value FROM json_each(?))`).bind(JSON.stringify(tatEm.slice(i, i + 90))).all<Row>().catch(() => ({ results: [] as Row[] }))
      for (const x of r.results ?? []) { const s = str(x.sbd); vung.set(s, (vung.get(s) ?? new Set()).add(str(x.vkn_id))) }
    }
    const ungVien = Object.keys(TEN_NEN).filter((n) => n !== NHAN_PHU)
    const lenh: D1PreparedStatement[] = [], chiTiet: Record<string, unknown>[] = []
    const dsNghi: { q: string; soVung: number; soSai: number; tyLe: number; ghiChu: string }[] = []
    let soThemNhan = 0, soGoiYThay = 0, soNghi = 0, soCauXet = 0
    for (const q of coQ) {
      const qq = Q.get(q)!, em = cuoi.get(q)
      if (!em) continue
      const phan = phanQ.get(q)?.phan || ([...qq.dong.keys()].some((y) => y >= 0) ? 'II' : 'I'), ver = phanQ.get(q)?.version ?? ''
      const vknCa = qq.dong.get(-1) ?? [...new Set([0, 1, 2, 3].flatMap((y) => qq.dong.get(y) ?? []))]
      if (!vknCa.length) continue
      const quyet: QuyetDinhQ[] = []
      if (phan === 'II') {
        const coY = [...em.entries()].filter(([, v]) => v.y)
        if (coY.length < K.LUOT_TOI_THIEU) { chiTiet.push({ qid: q, ket: 'phan_ii_thieu_ket_qua_tung_y' }); continue }
        soCauXet++
        for (let i = 0; i < 4; i++) {
          const qs = coY.filter(([, v]) => v.y![i] !== null).map(([sbd, v]) => ({ sbd, o: v.y![i] as 0 | 1 }))
          const d = xetMotQ(qs, qq.dong.get(i) ?? vknCa, vung, ungVien)
          if (d.loai === 'them_nhan' || d.loai === 'nghi') quyet.push({ ...d, y: i })
        }
      } else {
        soCauXet++
        const d = xetMotQ([...em.entries()].map(([sbd, v]) => ({ sbd, o: v.o })), vknCa, vung, ungVien)
        if (d.loai === 'them_nhan' || d.loai === 'nghi') quyet.push({ ...d, y: -1 })
      }
      for (const d of quyet) {
        if (d.loai === 'them_nhan' && d.vkn) {
          const cu = qq.dong.get(d.y) ?? vknCa, moi = [...cu, d.vkn]
          const lyDo = `Kiểm định tuần ${tuan}: ${d.soVung} em vững mọi vi kỹ năng đã gắn nhưng chỉ đúng ${pt(d.tiLeVung)}; em vững thêm ${d.vkn} đúng ${pt(d.r1!)} (${d.n1} em), chưa vững đúng ${pt(d.r0!)} (${d.n0} em)`
          if (qq.nguon === 'thay') {
            // Gợi ý cho câu thầy duyệt: ghi MỘT lần cho mỗi (câu, ý, nhãn, phiên bản câu) — tuần sau không ghi lặp.
            lenh.push(env.DB.prepare(`INSERT INTO omni_q_nhat_ky (qid, y, luc, loai, cu, moi, vkn_them, ly_do, ban_cau) SELECT ?,?,?,'goi_y_thay',?,?,?,?,?
              WHERE NOT EXISTS (SELECT 1 FROM omni_q_nhat_ky WHERE qid = ? AND y = ? AND loai = 'goi_y_thay' AND vkn_them = ? AND COALESCE(ban_cau, '') = ?)`)
              .bind(q, d.y, nay, JSON.stringify(cu), JSON.stringify(moi), d.vkn, `${lyDo} — câu thầy đã duyệt Q nên chỉ gợi ý, chưa áp`, ver, q, d.y, d.vkn, ver))
          } else {
            const dongMoi: [number, string[]][] = [[d.y, moi]]
            if (d.y >= 0) { const ca = qq.dong.get(-1) ?? vknCa; if (!ca.includes(d.vkn)) dongMoi.push([-1, [...ca, d.vkn]]) }
            for (const [y, v] of dongMoi) lenh.push(env.DB.prepare(`INSERT INTO omni_q (qid, y, vkn_json, nguon, duyet_luc) VALUES (?,?,?,'goi_y',?)
              ON CONFLICT(qid, y) DO UPDATE SET vkn_json = excluded.vkn_json, nguon = 'goi_y', duyet_luc = excluded.duyet_luc WHERE omni_q.nguon <> 'thay'`).bind(q, y, JSON.stringify(v), nay))
            lenh.push(env.DB.prepare('INSERT INTO omni_q_nhat_ky (qid, y, luc, loai, cu, moi, vkn_them, ly_do, ban_cau) VALUES (?,?,?,?,?,?,?,?,?)').bind(q, d.y, nay, 'them_nhan', JSON.stringify(cu), JSON.stringify(moi), d.vkn, lyDo, ver))
            const n = d.vkn.slice(4)
            lenh.push(env.DB.prepare('INSERT OR IGNORE INTO omni_vkn (id, ma_dang, ten, ten_loi, nhan_nen, thu_tu) VALUES (?,?,?,?,?,?)').bind(d.vkn, '', TEN_NEN[n] ?? n, TEN_LOI_NEN[n] ?? null, n, Math.max(0, Object.keys(TEN_NEN).indexOf(n))))
          }
          if (qq.nguon === 'thay') soGoiYThay++
          else soThemNhan++
          chiTiet.push({ qid: q, y: d.y, ket: qq.nguon === 'thay' ? 'goi_y_thay' : 'them_nhan', vkn: d.vkn, tiLeVung: d.tiLeVung, chenh: d.chenh })
        }
      }
      const nghi = quyet.filter((d) => d.loai === 'nghi')
      if (nghi.length) {
        const d = nghi.reduce((a, b) => (b.tiLeVung < a.tiLeVung ? b : a))
        const soSai = Math.round(d.soVung * (1 - d.tiLeVung))
        const ghiChu = `${TEN_AI} kiểm ma trận Q (tuần ${tuan})${d.y >= 0 ? `, ý ${'abcd'[d.y]}` : ''}: ${d.soVung} em đã vững mọi kỹ năng của câu nhưng chỉ đúng ${pt(d.tiLeVung)} — nghi đáp án, hoặc câu cần kỹ năng chưa gắn.`
        dsNghi.push({ q, soVung: d.soVung, soSai, tyLe: 1 - d.tiLeVung, ghiChu })
        lenh.push(env.DB.prepare(`INSERT INTO omni_q_nhat_ky (qid, y, luc, loai, cu, moi, vkn_them, ly_do, ban_cau) SELECT ?,?,?,'nghi',?,?,NULL,?,? WHERE NOT EXISTS (SELECT 1 FROM omni_q_nhat_ky WHERE qid = ? AND loai = 'nghi' AND COALESCE(ban_cau, '') = ?)`)
          .bind(q, d.y, nay, JSON.stringify(vknCa), JSON.stringify(vknCa), ghiChu, ver, q, ver))
        soNghi++
        chiTiet.push({ qid: q, y: d.y, ket: 'nghi', tiLeVung: d.tiLeVung, soVung: d.soVung })
      }
    }
    await chayLo(env, lenh)
    // Câu nghi CHỈ vào bảng riêng omni_q_nghi (điều phối 05/10). KHÔNG ghi cau_nghi_dap_an: bảng đó làm khâu rút đề ca kiểm tra tạm bỏ câu, mà
    // "ma trận Q chưa giải thích được" KHÔNG có nghĩa đáp án sai — luật nghi đáp án đã có ở tu-hoan-thien.ts với ngưỡng riêng.
    for (const n of dsNghi) {
      await env.DB.prepare('INSERT INTO omni_q_nghi (qid, so_lan, so_sai, ty_le_sai, ghi_chu, luc) VALUES (?,?,?,?,?,?) ON CONFLICT(qid) DO NOTHING')
        .bind(n.q, n.soVung, n.soSai, n.tyLe, n.ghiChu, nay).run().catch(() => undefined)
    }
    return xong({ soCauXet, soThemNhan, soGoiYThay, soNghi, chiTiet: chiTiet.slice(0, 100) })
  } catch (e) {
    return { ok: false, chay: false, loi: String((e as Error)?.message ?? e).slice(0, 200) }
  }
}
