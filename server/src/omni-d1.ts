// OMNI 3 — LỚP D1: công tắc, bảng đệm, đọc sổ → hồ sơ OMNI (phát lại tất định), ma trận Q, β câu, chứng chỉ, vé, nhật ký, phần thêm cho Sảnh/PH, việc đêm.
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md mục 0, 1, 3, 4, 5, 9 · Hợp đồng: docs/hop-dong-omni-3.md · Kiểu: omni-kieu.ts · Chữ: src/lib/omni-chu.ts.
//
// NGUỒN SỰ THẬT = `su_kien_hoc` (+ `omni_xac_nhan` thầy xác nhận, `omni_q`/`omni_vkn` ma trận Q thầy duyệt, `omni_ca_chot`, điểm `luot`).
// Bảng ĐỆM (`omni_em`, `omni_p_vkn`, `omni_beta_cau`) xoá đi dựng lại 100 % từ sổ:
//   · HỒ SƠ TRỰC TIẾP (`hoSoOmniEm`) = `phatLaiEm` trên TOÀN BỘ sổ của em — KHÔNG đọc `omni_em`/`omni_p_vkn` (đệm 60 s trong isolate).
//   · ẢNH CHỤP ĐÊM (`omni_em`/`omni_p_vkn`, `chayOmniDem`) = hồ sơ THÔ (prior P0) trên sổ TIẾP NHẬN TRƯỚC 00:00 VN của ngày chụp; dấu `cap_nhat_luc`
//     = 00:00 VN ngày chụp (không phải giờ chạy) ⇒ chạy lại cùng ngày ra y hệt. Ảnh chụp là nguồn PRIOR LỚP (mean P của bạn cùng lớp đang bật OMNI,
//     ≥ PRIOR_LOP_TOI_THIEU em có quan sát, không tính chính em). Thiếu ảnh ⇒ tính lại hồ sơ thô của bạn từ sổ CÙNG mốc cắt (cùng số) — vì vậy xoá
//     bảng đệm không đổi hồ sơ (test). Không vòng lặp: prior chỉ đọc hồ sơ THÔ, hồ sơ thô không dùng prior.
//   · β câu (`omni_beta_cau`) = trung vị thời gian lượt đúng tự làm 60 ngày (việc đêm). Thiếu ⇒ ước lượng theo phần × mức (omni-toc-do.ts).
// Mọi đường đọc của em/PH: lỗi ⇒ trả giá trị an toàn (hồ sơ rỗng / null), KHÔNG làm hỏng Sảnh, trả lời, PH.
import type { Env } from './kieu'
import {
  CAC_KHUNG_GIO, KHOA_CO_OMNI, KHOA_THAM_SO_OMNI, MUC_DICH_LUOT, PHIEN_BAN_OMNI, THAM_SO_OMNI,
  coOmniApCho, docCoOmniTu, khungGioCua,
  type CoOmni, type HoSoOmniEm, type HoSoVkn, type KhungDe, type KhungGio, type NhanTocDo, type Phan, type PhOmni, type QCau, type SanhOmni,
  type SuKienOmni, type ThamSoOmni, type TuTin, type Vkn, type XacNhanThay,
} from './omni-kieu'
import { phatLaiEm } from './omni-p-vkn'
import { duBaoDiem, trongSoCau } from './du-bao-diem'
import { xetChungChi } from './omni-chung-chi'
import { dangDaVung } from './omni-ke-hoach'
import { xetMetGio } from './omni-met-gio'
import { canThanTu } from './omni-can-than'
import { goiYQ, qMacDinh, vknMacDinh, vknNen } from './omni-q'
import { nhanQidChanDoan } from './lam-lai-so'
import { betaTuMau, msKyVong } from './omni-toc-do'
import { lopCuaEm, phamViCuaEm, type PhamViLop } from './bai-da-day'
import { cheDo2, chuaBatDau, dauNgayVn, docChienDichCuaEm, docChienDichKemBatDau, docCoHoa2, docHoSo2, docKeHoachDaChot, docQuyetMetGio, ngayVnCua, qidGoc, type ChienDich, type CoHoa2, type HoSo2 } from './srs2-d1'
import { congNgay, soNgayGiua } from './srs2-loi'
import { ngayVn, phanTuQid } from './su-kien-hoc'
import { cacQidSongSinh, tachSongSinh } from './loi-hoc-luat'
import { docCauHinhDem } from './cau-hinh-dem'
import { DemTTL } from './dem-chung'
import { daNho, laBanGop, nhoTheoLuot } from './doc-d1-theo-luot'
import { chayDdlMotLan } from './ddl-mot-lan'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { boTroTheoQid } from './song-sinh-game'
import { damBaoBangTuHoanThien } from './tu-hoan-thien'
import { TEN_NEN } from './thang-tu-go'
import { phanTram, soP } from '../../src/lib/omni-chu'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const dsJson = (ds: Iterable<string>): string => JSON.stringify([...new Set(ds)])
const lam2 = (x: number): number => Math.round(x * 100) / 100
const PHAN: readonly Phan[] = ['I', 'II', 'III']
const laPhan = (v: unknown): v is Phan => (PHAN as readonly string[]).includes(str(v))
const NHAN_TOC_DO: ReadonlySet<string> = new Set(['troi_chay', 'thuong', 'cham', 'luot'])
const MOT_NGAY_MS = 86_400_000
/** Một tập 0..N lệnh ghi đi một `batch` (D1 nhận tối đa ~100 lệnh/gói một cách an toàn). */
const LENH_MOI_GOI = 80
/** Việc đêm: tối đa số em chụp hồ sơ mỗi lượt cron (cron mỗi phút gọi tiếp tới khi xong). Tham số vận hành, không phải tham số mô hình. */
export const SO_EM_MOT_LUOT_DEM = 40
/** Khoá `cau_hinh` của con trỏ việc đêm `{ngay, buoc, sbdCuoi, xong, loi}`. */
export const KHOA_CON_TRO_DEM = 'omni_dem_con_tro'
/** Cửa sổ lấy mẫu β câu (ngày) — đặc tả "≥ BETA_MAU_TOI_THIEU lượt đúng tự làm có thời lượng trong 60 ngày". */
const CUA_SO_BETA_NGAY = 60
/** Cửa sổ đo NHỊP THẬT của em (câu/ngày) cho `uocNgay` = độ dài tối đa của một bài (HAN_BAI_MAX = 14 ngày). */
const CUA_SO_NHIP_NGAY = THAM_SO_OMNI.HAN_BAI_MAX
/**
 * "ĐỦ DỮ LIỆU" cho các số hiện ra (sơ ý, khoảng cách tới 8, số dạng để chạm 8): số quan sát THẬT ≥ số lượt ẢO của co Bayes sơ ý (S_AO = 10)
 * — từ đó ước lượng do dữ liệu của em quyết định nhiều hơn prior. Lấy từ THAM_SO_OMNI (không rải số).
 */
const duDuLieu = (n: number, ts: ThamSoOmni): boolean => n >= ts.S_AO

// ---------------------------------------------------------------- bảng (chỉ-thêm, khớp server/migration-0510-omni-3.sql)
/** Mọi lệnh tạo bảng/chỉ mục của migration-0510 (test khoá: lược đồ dựng từ đây = lược đồ dựng từ tệp SQL). */
export const LENH_TAO_BANG_OMNI: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS bai_da_day (id TEXT PRIMARY KEY, lop TEXT NOT NULL, khoa_bai TEXT NOT NULL, ten_bai TEXT NOT NULL, vi_tri INTEGER NOT NULL, ma_to_json TEXT NOT NULL, tick_luc TEXT NOT NULL, nguoi TEXT, chien_dich_id TEXT, bo_tick_luc TEXT)`,
  `CREATE INDEX IF NOT EXISTS bai_da_day_lop ON bai_da_day(lop, vi_tri)`,
  // Một tick ĐANG HIỆU LỰC cho mỗi (lớp, bài) — làn B1 (bai-da-day.ts `SQL_CHI_MUC_MOT_TICK`), chép nguyên chuỗi.
  'CREATE UNIQUE INDEX IF NOT EXISTS bai_da_day_mot ON bai_da_day(lop, khoa_bai) WHERE bo_tick_luc IS NULL',
  `CREATE TABLE IF NOT EXISTS pham_vi_lop (lop TEXT NOT NULL, khoa_bai TEXT NOT NULL, ten_bai TEXT NOT NULL, vi_tri INTEGER NOT NULL, ma_de_json TEXT NOT NULL, nguon TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (lop, khoa_bai))`,
  `CREATE TABLE IF NOT EXISTS de_kho_thu_muc (ma_de TEXT PRIMARY KEY, thu_muc TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS omni_vkn (id TEXT PRIMARY KEY, ma_dang TEXT NOT NULL, ten TEXT NOT NULL, ten_loi TEXT, nhan_nen TEXT, thu_tu INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS omni_vkn_dang ON omni_vkn(ma_dang, thu_tu)`,
  `CREATE TABLE IF NOT EXISTS omni_q (qid TEXT NOT NULL, y INTEGER NOT NULL DEFAULT -1, vkn_json TEXT NOT NULL, nguon TEXT NOT NULL, duyet_luc TEXT, PRIMARY KEY (qid, y))`,
  `CREATE TABLE IF NOT EXISTS omni_em (sbd TEXT PRIMARY KEY, n_vung INTEGER NOT NULL DEFAULT 0, n_sai_vung INTEGER NOT NULL DEFAULT 0, s_uoc REAL NOT NULL, tau REAL NOT NULL DEFAULT 0, n_tau INTEGER NOT NULL DEFAULT 0, khung_gio_json TEXT, gio_hoc TEXT, muc_tieu REAL NOT NULL DEFAULT 8, cursor TEXT, phien_ban TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS omni_p_vkn (sbd TEXT NOT NULL, vkn_id TEXT NOT NULL, p REAL NOT NULL, n_tu_lam INTEGER NOT NULL, n_cau INTEGER NOT NULL DEFAULT 0, n_ngay INTEGER NOT NULL, n_troi_chay INTEGER NOT NULL DEFAULT 0, n_cau_la_dung INTEGER NOT NULL DEFAULT 0, diem_sprt REAL NOT NULL DEFAULT 0, trang_thai TEXT NOT NULL, day_lai INTEGER NOT NULL DEFAULT 0, phien_ban TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (sbd, vkn_id))`,
  `CREATE TABLE IF NOT EXISTS omni_beta_cau (qid TEXT PRIMARY KEY, beta REAL NOT NULL, n INTEGER NOT NULL, cap_nhat_luc TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS omni_du_bao (sbd TEXT NOT NULL, pham_vi TEXT NOT NULL, ky_vong REAL NOT NULL, p8 REAL NOT NULL, sai_so REAL NOT NULL, s_dung REAL NOT NULL, con_duong TEXT, con_thieu_json TEXT, so_bang_chung INTEGER NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (sbd, pham_vi))`,
  // Kế hoạch nhiều bài (làn A2, srs2-d1.ts `LENH_TAO_BANG_KE_HOACH_OMNI`): chép NGUYÊN chuỗi — không tham chiếu hằng của srs2-d1 lúc nạp mô-đun (vòng import).
  'CREATE TABLE IF NOT EXISTS srs2_ke_hoach_omni (sbd TEXT NOT NULL, ngay TEXT NOT NULL, chien_dich_json TEXT, on_bai_cu_json TEXT, met_gio TEXT, cap_nhat_luc TEXT, PRIMARY KEY (sbd, ngay))',
  `CREATE TABLE IF NOT EXISTS omni_chung_chi (sbd TEXT NOT NULL, chien_dich_id TEXT NOT NULL, cap_luc TEXT NOT NULL, do_tin REAL NOT NULL, diem_ca_chot REAL, ma_ca TEXT, PRIMARY KEY (sbd, chien_dich_id))`,
  `CREATE TABLE IF NOT EXISTS omni_xac_nhan (sbd TEXT NOT NULL, ma_dang TEXT NOT NULL, ket TEXT NOT NULL, luc TEXT NOT NULL, nguoi TEXT, PRIMARY KEY (sbd, ma_dang, luc))`,
  `CREATE TABLE IF NOT EXISTS omni_ca_chot (chien_dich_id TEXT NOT NULL, ma_ca TEXT NOT NULL, luc TEXT NOT NULL, qid_la_json TEXT, PRIMARY KEY (chien_dich_id, ma_ca))`,
  `CREATE TABLE IF NOT EXISTS omni_lo_dien (qid TEXT NOT NULL, ngay_vn TEXT NOT NULL, so_em INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (qid, ngay_vn))`,
  `CREATE TABLE IF NOT EXISTS omni_ve (sbd TEXT NOT NULL, tuan TEXT NOT NULL, da_dung INTEGER NOT NULL DEFAULT 0, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (sbd, tuan))`,
  `CREATE TABLE IF NOT EXISTS omni_de_thu (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, qid_json TEXT NOT NULL, tao_luc TEXT NOT NULL, het_luc TEXT NOT NULL, nop_luc TEXT, diem REAL)`,
  `CREATE INDEX IF NOT EXISTS omni_de_thu_em ON omni_de_thu(sbd, tao_luc)`,
]
/** Tạo mọi bảng omni_* (IF NOT EXISTS), một lần mỗi isolate (một `batch`). Lỗi ⇒ ném (nơi gọi ghi tự bắt). */
export async function damBaoBangOmni(env: Env): Promise<void> {
  await chayDdlMotLan(env, 'omni_3_0510', LENH_TAO_BANG_OMNI)
}

// ---------------------------------------------------------------- đệm trong isolate
/** Hồ sơ trực tiếp: khoá (sbd, ngày, số dòng sổ + mốc tiếp nhận cuối, tham số, phiên bản đệm). */
const demHoSo = new DemTTL<HoSoOmniEm>(60_000, 400)
/** Hồ sơ THÔ của bạn cùng lớp cho prior lớp: khoá (lớp, ngày, tham số). Giá trị của một ngày là bất biến theo mốc cắt ⇒ đệm dài. */
const demTho = new DemTTL<Map<string, Map<string, { p: number; n: number }>>>(6 * 3_600_000, 64)
/** Ma trận Q và siêu dữ liệu câu (đổi khi thầy duyệt Q / nạp kho) — 10 phút; isolate duyệt Q xoá ngay. */
const demQ = new DemTTL<QCau>(10 * 60_000, 8_000)
const demKho = new DemTTL<CauKho | null>(10 * 60_000, 8_000)
const demTenDang = new DemTTL<string>(10 * 60_000, 4_000)
const demHieuChuan = new DemTTL<HieuChuan>(10 * 60_000, 4)
/** Nhật ký hôm nay: Sảnh mở lại nhiều lần sau khi xong kế hoạch ⇒ đệm 60 s theo (em, ngày, số dòng sổ). */
const demNhatKy = new DemTTL<string[]>(60_000, 400)
let phienBanDem = 0
/** Bỏ mọi đệm OMNI của isolate (sau khi thầy duyệt Q, xác nhận dạng, đổi tham số). */
export function xoaDemOmni(): void {
  demHoSo.xoa(); demTho.xoa(); demQ.xoa(); demKho.xoa(); demTenDang.xoa(); demHieuChuan.xoa(); demSo.xoa(); demNhatKy.xoa()
  phienBanDem++
}

// ---------------------------------------------------------------- công tắc + tham số
/** Công tắc `cau_hinh.omni` (đệm 15 s — cau-hinh-dem.ts). Lỗi đọc ⇒ TẮT. */
export async function docCoOmni(env: Env): Promise<CoOmni> {
  try {
    return docCoOmniTu(await docCauHinhDem(env, KHOA_CO_OMNI))
  } catch {
    return { bat: false, lop: [], sbd: [] }
  }
}
async function lopTuHocSinh(env: Env, sbd: string): Promise<string | null> {
  const r = await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<Row>().catch(() => null)
  return r && str(r.lop).trim() ? str(r.lop).trim() : null
}
/** OMNI áp cho em? = Hoá 2.0 áp cho em (`cheDo2`) ∧ cờ omni áp (theo lớp/SBD). `lop` vắng ⇒ `lopCuaEm` (tick bài), lùi về `hoc_sinh.lop`. Lỗi ⇒ false. */
export async function omniBat(env: Env, sbd: string, lop?: string | null): Promise<boolean> {
  try {
    if (!sbd) return false
    const co = await docCoOmni(env)
    if (!co.bat) return false // cờ tắt: không tốn thêm truy vấn nào (đường cũ y hệt)
    if (!(await cheDo2(env, sbd))) return false
    if (co.sbd.includes(sbd) || (!co.lop.length && !co.sbd.length)) return true
    if (!co.lop.length) return false
    const l = lop ?? (await lopCuaEm(env, sbd).catch(() => null)) ?? (await lopTuHocSinh(env, sbd))
    return coOmniApCho(co, sbd, l)
  } catch {
    return false
  }
}
/** Cờ Hoá 2.0 + cờ OMNI áp cho (em, lớp) — THUẦN (đúng luật `cheDo2` ∧ `coOmniApCho`), dùng khi duyệt cả danh sách em. */
export function apDungOmniCho(coHoa2: CoHoa2, coOmni: CoOmni, sbd: string, lop: string | null): boolean {
  if (!coHoa2.bat || !coOmni.bat) return false
  const hoa2 = coHoa2.sbd.includes(sbd) || (!coHoa2.lop.length && !coHoa2.sbd.length) || (!!coHoa2.lop.length && !!lop && coHoa2.lop.includes(lop))
  return hoa2 && coOmniApCho(coOmni, sbd, lop)
}
/** Tham số đã hiệu chỉnh tuần (`cau_hinh.omni_tham_so`): chỉ S0 và T chung được ghi đè (trong ràng buộc); còn lại = THAM_SO_OMNI. */
export async function docThamSoOmni(env: Env): Promise<ThamSoOmni> {
  try {
    return thamSoTu(await docCauHinhDem(env, KHOA_THAM_SO_OMNI))
  } catch {
    return THAM_SO_OMNI
  }
}
/** Thuần: dựng ThamSoOmni từ JSON đã lưu. S0 ∈ (0; 0,5) (1 − S ≥ G mọi phần) · T ∈ [T_MIN; T_MAX]; ngoài khoảng ⇒ giữ mặc định. */
export function thamSoTu(v: unknown): ThamSoOmni {
  let o: unknown = v
  if (typeof o === 'string') { try { o = JSON.parse(o) } catch { return THAM_SO_OMNI } }
  if (!o || typeof o !== 'object') return THAM_SO_OMNI
  const r = o as Row
  const S0 = Number(r.S0), T = Number(r.T)
  const gMax = Math.max(THAM_SO_OMNI.G.I, THAM_SO_OMNI.G.Y, THAM_SO_OMNI.G.III)
  const s0Hop = Number.isFinite(S0) && S0 > 0 && S0 < 0.5 && 1 - S0 >= gMax
  const tHop = Number.isFinite(T) && T >= THAM_SO_OMNI.T_MIN && T <= THAM_SO_OMNI.T_MAX
  if (!s0Hop && !tHop) return THAM_SO_OMNI
  // `ThamSoOmni` (omni-kieu.ts, hợp đồng) mang kiểu HẰNG của Object.freeze (S0: 0.08) ⇒ ép kiểu; giá trị vẫn là số trong ràng buộc đã kiểm ở trên.
  return { ...THAM_SO_OMNI, ...(s0Hop ? { S0 } : {}), ...(tHop ? { T } : {}) } as unknown as ThamSoOmni
}
const khoaTs = (ts: ThamSoOmni): string => `${ts.S0}|${ts.T}`

// ---------------------------------------------------------------- siêu dữ liệu câu (kho game, rút gọn — không đáp án, không lời giải)
export interface CauKho {
  qid: string
  maDe: string
  /** Mọi tờ chứa câu (câu có thể ở nhiều tờ). */
  maDeDs: string[]
  group: string
  phan: Phan
  dang: string | null
  tenDang: string | null
  mucDo: string | null
  chuyenDe: string | null
  kienThuc: string[]
  kienThucY: string[][] | null
  tuLuan: boolean
  reviewed: boolean
}
const mangChuoi = (v: unknown): string[] => {
  try {
    const a = typeof v === 'string' ? (JSON.parse(v) as unknown) : v
    return Array.isArray(a) ? a.map((x) => str(x).trim()).filter(Boolean) : []
  } catch {
    return []
  }
}
const mangMang = (v: unknown): string[][] | null => {
  try {
    const a = typeof v === 'string' ? (JSON.parse(v) as unknown) : v
    if (!Array.isArray(a) || !a.length) return null
    return a.map((x) => mangChuoi(x))
  } catch {
    return null
  }
}
/** Chuyên đề của câu: trường `chuyenDe` của kho nếu có (bỏ chữ điền tạm "Hoá học"), không thì đoạn đầu của mã dạng (`ESTER.CAU_TAO.X` ⇒ `ESTER`). */
export function chuyenDeCua(dang: string | null | undefined, chuyenDe?: string | null): string | null {
  const cd = str(chuyenDe).trim()
  if (cd && cd !== 'Hoá học' && cd !== 'Hóa học') return cd
  const d = str(dang).trim()
  return d ? d.split('.')[0]! : null
}
const SQL_CAU_KHO = `SELECT ma_de, qid, content_group, dang, json_extract(json,'$.phan') AS phan, json_extract(json,'$.mucDo') AS muc_do,
    json_extract(json,'$.tenDang') AS ten_dang, json_extract(json,'$.chuyenDe') AS chuyen_de, json_extract(json,'$.kienThuc') AS kien_thuc,
    json_extract(json,'$.kienThucY') AS kien_thuc_y, json_extract(json,'$.tuLuan') AS tu_luan, json_extract(json,'$.reviewed') AS reviewed
  FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?)) AND json_valid(json) ORDER BY qid, ma_de`
const cauKhoTuDong = (x: Row): CauKho => {
  const dang = str(x.dang).trim() || null
  return {
    qid: str(x.qid), maDe: str(x.ma_de), maDeDs: [str(x.ma_de)], group: str(x.content_group), phan: laPhan(x.phan) ? (str(x.phan) as Phan) : 'I',
    dang, tenDang: str(x.ten_dang).trim() || null, mucDo: str(x.muc_do).trim() || null, chuyenDe: chuyenDeCua(dang, str(x.chuyen_de)),
    kienThuc: mangChuoi(x.kien_thuc), kienThucY: mangMang(x.kien_thuc_y), tuLuan: Number(x.tu_luan) === 1 || x.tu_luan === true, reviewed: Number(x.reviewed) === 1 || x.reviewed === true,
  }
}
/** Siêu dữ liệu rút gọn của các câu (đệm 10 phút theo qid; câu không có trong kho ⇒ vắng). */
export async function docCauKho(env: Env, qids: readonly string[]): Promise<Map<string, CauKho>> {
  const ra = new Map<string, CauKho>()
  const now = Date.now()
  const can: string[] = []
  for (const q of new Set(qids.filter(Boolean))) {
    const c = demKho.doc(q, now)
    if (c === undefined) can.push(q)
    else if (c) ra.set(q, c)
  }
  for (let i = 0; i < can.length; i += 800) {
    const lo = can.slice(i, i + 800)
    const r = await env.DB.prepare(SQL_CAU_KHO).bind(JSON.stringify(lo)).all<Row>().catch(() => null)
    if (!r) continue // lỗi đọc: không đệm (lượt sau thử lại)
    const moi = new Map<string, CauKho>()
    for (const x of r.results ?? []) {
      const q = str(x.qid)
      const cu = moi.get(q)
      if (cu) { if (!cu.maDeDs.includes(str(x.ma_de))) cu.maDeDs.push(str(x.ma_de)); continue }
      moi.set(q, cauKhoTuDong(x))
    }
    for (const q of lo) {
      const c = moi.get(q) ?? null
      demKho.ghi(q, now, c)
      if (c) ra.set(q, c)
    }
  }
  return ra
}

// ---------------------------------------------------------------- ma trận Q
/** Gợi ý từ dòng sổ cho câu KHÔNG có trong kho game (vd câu ca kiểm tra): phần, dạng, mức, chuyên đề. */
export interface GoiYCau { phan?: Phan; maDang?: string | null; mucDo?: string | null; chuyenDe?: string | null }
async function docDongQ(env: Env, qids: readonly string[]): Promise<Map<string, { thay: Map<number, string[]>; goiY: Map<number, string[]> }>> {
  const ra = new Map<string, { thay: Map<number, string[]>; goiY: Map<number, string[]> }>()
  if (!qids.length) return ra
  const r = await env.DB.prepare('SELECT qid, y, vkn_json, nguon FROM omni_q WHERE qid IN (SELECT value FROM json_each(?))').bind(dsJson(qids)).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const nguon = str(x.nguon)
    if (nguon !== 'thay' && nguon !== 'goi_y') continue
    const vkn = mangChuoi(x.vkn_json)
    const y = Number(x.y)
    if (!vkn.length || !Number.isInteger(y) || y < -1 || y > 3) continue
    const q = str(x.qid)
    const o = ra.get(q) ?? { thay: new Map<number, string[]>(), goiY: new Map<number, string[]>() }
    ;(nguon === 'thay' ? o.thay : o.goiY).set(y, vkn)
    ra.set(q, o)
  }
  return ra
}
/** Thuần: QCau từ các dòng omni_q của MỘT nguồn (y −1 = cả câu; 0..3 = từng ý Phần II). Không bao giờ trả `vkn` rỗng. */
export function qTuDongQ(qid: string, phan: Phan, maDang: string | null, mucDo: string | null, dong: ReadonlyMap<number, readonly string[]>, nguon: 'thay' | 'goi_y', chuyenDe?: string | null): QCau {
  const ca = [...(dong.get(-1) ?? [])]
  const y = [0, 1, 2, 3].map((i) => [...(dong.get(i) ?? [])])
  const coY = phan === 'II' && y.some((a) => a.length > 0)
  let vkn = ca.length ? ca : [...new Set(y.flat())]
  if (!vkn.length) vkn = [vknMacDinh(maDang, chuyenDe, qid)]
  return { qid, phan, maDang, mucDo, vkn, ...(coY ? { vknY: y.map((a) => (a.length ? a : vkn)) } : {}), nguon }
}
/** Danh mục vi kỹ năng theo dạng (omni_vkn), thứ tự `thu_tu`. */
export async function docVknTheoDang(env: Env, dangs: readonly string[]): Promise<Map<string, Vkn[]>> {
  const ra = new Map<string, Vkn[]>()
  const ds = [...new Set(dangs.filter(Boolean))]
  if (!ds.length) return ra
  const r = await env.DB.prepare('SELECT id, ma_dang, ten, ten_loi, nhan_nen, thu_tu FROM omni_vkn WHERE ma_dang IN (SELECT value FROM json_each(?)) ORDER BY ma_dang, thu_tu, id')
    .bind(JSON.stringify(ds)).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const v = vknTuDong(x)
    ra.set(v.maDang, [...(ra.get(v.maDang) ?? []), v])
  }
  return ra
}
const vknTuDong = (x: Row): Vkn => ({
  id: str(x.id), maDang: str(x.ma_dang), ten: str(x.ten), tenLoi: x.ten_loi == null || str(x.ten_loi) === '' ? null : str(x.ten_loi),
  nhanNen: x.nhan_nen == null || str(x.nhan_nen) === '' ? null : str(x.nhan_nen), thuTu: Number(x.thu_tu) || 0,
})
/** Nhãn nền từng bước của câu (`cau_bo_tro.nhan_nen_json`): theo băm nội dung (loi_giai_cau), lùi theo `qid_mau`. */
async function docNhanNen(env: Env, qids: readonly string[]): Promise<Map<string, { buoc: number; nen: string }[]>> {
  const ra = new Map<string, { buoc: number; nen: string }[]>()
  if (!qids.length) return ra
  const bt = await boTroTheoQid(env, qids).catch(() => new Map())
  for (const [q, b] of bt) if (b.nhanNen?.length) ra.set(q, b.nhanNen)
  const thieu = qids.filter((q) => !ra.has(q))
  if (thieu.length) {
    const r = await env.DB.prepare('SELECT qid_mau, nhan_nen_json FROM cau_bo_tro WHERE qid_mau IN (SELECT value FROM json_each(?))').bind(dsJson(thieu)).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r.results ?? []) {
      let a: unknown = []
      try { a = JSON.parse(str(x.nhan_nen_json) || '[]') } catch { a = [] }
      const nn = (Array.isArray(a) ? a : []).filter((v): v is Row => !!v && typeof v === 'object' && Number.isInteger((v as Row).buoc) && typeof (v as Row).nen === 'string')
        .map((v) => ({ buoc: Number(v.buoc), nen: str(v.nen) }))
      if (nn.length && !ra.has(str(x.qid_mau))) ra.set(str(x.qid_mau), nn)
    }
  }
  return ra
}
/** Q của các câu (qid GỐC) khi đã có siêu dữ liệu kho; câu kho ⇒ đệm 10 phút. */
async function qTuKho(env: Env, qids: readonly string[], kho: ReadonlyMap<string, CauKho>, goiY?: ReadonlyMap<string, GoiYCau>): Promise<Map<string, QCau>> {
  const ra = new Map<string, QCau>()
  const now = Date.now()
  const can: string[] = []
  for (const q of new Set(qids)) {
    const c = kho.has(q) ? demQ.doc(q, now) : undefined
    if (c) ra.set(q, c)
    else can.push(q)
  }
  if (!can.length) return ra
  const dong = await docDongQ(env, can)
  const chuaCo = can.filter((q) => !dong.has(q) && kho.has(q))
  const [vknDang, nhanNen] = await Promise.all([
    docVknTheoDang(env, chuaCo.map((q) => kho.get(q)!.dang ?? '').filter(Boolean)),
    docNhanNen(env, chuaCo),
  ])
  for (const q of can) {
    const c = kho.get(q)
    const h = goiY?.get(q)
    const phan: Phan = c?.phan ?? h?.phan ?? (phanTuQid(q, 'I') as Phan)
    const maDang = c?.dang ?? h?.maDang ?? null
    const mucDo = c?.mucDo ?? h?.mucDo ?? null
    const chuyenDe = c ? c.chuyenDe : chuyenDeCua(maDang, h?.chuyenDe)
    const d = dong.get(q)
    let qc: QCau
    // 06/10 (chan-doan-buoc-sai.ts): câu CHẨN ĐOÁN sinh bằng mã `nen:sinh.<nhãn>.<số>` kiểm ĐÚNG MỘT vi kỹ năng `nen:<nhãn>` ⇒ quan sát của nó cập nhật P của bước ấy.
    const nhanCd = nhanQidChanDoan(q)
    if (nhanCd) qc = { qid: q, phan, maDang, mucDo, vkn: [vknNen(nhanCd)], nguon: 'mac_dinh' }
    else if (d && d.thay.size) qc = qTuDongQ(q, phan, maDang, mucDo, d.thay, 'thay', chuyenDe)
    else if (d && d.goiY.size) qc = qTuDongQ(q, phan, maDang, mucDo, d.goiY, 'goi_y', chuyenDe)
    else if (c) qc = goiYQ({ qid: q, phan, maDang, mucDo, chuyenDe, kienThuc: c.kienThuc, ...(c.kienThucY ? { kienThucY: c.kienThucY } : {}), ...(nhanNen.get(q) ? { nhanNen: nhanNen.get(q) } : {}) }, (maDang && vknDang.get(maDang)) || [], TEN_NEN)
    else qc = qMacDinh(q, phan, maDang, mucDo, chuyenDe)
    if (!qc.vkn?.length) qc = { ...qc, vkn: [vknMacDinh(maDang, chuyenDe, q)] } // hợp đồng QCau: không bao giờ rỗng
    qc = { ...qc, contentGroup: c?.group || null }
    ra.set(q, qc)
    if (c) demQ.ghi(q, now, qc)
  }
  return ra
}
/**
 * Ma trận Q của các câu (qid gốc; qid song sinh được quy về gốc, khoá trả lại đúng chuỗi đã hỏi). Ưu tiên: dòng `omni_q` nguồn 'thay' (thầy duyệt) ⇒
 * 'goi_y' ⇒ A.I gợi từ nhãn kho (`goiYQ`: kienThuc[], nhãn nền từng bước, danh mục vi kỹ năng của dạng) ⇒ `qMacDinh`. Không bao giờ thiếu khoá.
 * `goiY` (tuỳ chọn): phần/dạng/mức từ sổ cho câu không có trong kho game.
 */
export async function qCuaCau(env: Env, qids: readonly string[], goiY?: ReadonlyMap<string, GoiYCau>): Promise<Map<string, QCau>> {
  const ra = new Map<string, QCau>()
  const goc = [...new Set(qids.map((q) => tachSongSinh(q).goc).filter(Boolean))]
  let theoGoc = new Map<string, QCau>()
  try {
    theoGoc = await qTuKho(env, goc, await docCauKho(env, goc), goiY)
  } catch { /* lỗi đọc ⇒ lùi mặc định bên dưới */ }
  for (const q of qids) {
    const g = tachSongSinh(q).goc
    const h = goiY?.get(g)
    ra.set(q, theoGoc.get(g) ?? qMacDinh(g, h?.phan ?? (phanTuQid(g, 'I') as Phan), h?.maDang ?? null, h?.mucDo ?? null, h?.chuyenDe ?? null))
  }
  return ra
}

// ---------------------------------------------------------------- danh mục vi kỹ năng + tên dạng
/** Tên hiển thị của các mã dạng (trường `tenDang` của kho; đệm 10 phút). Không có ⇒ vắng. */
export async function tenCuaDang(env: Env, dangs: readonly string[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>()
  const now = Date.now()
  const can: string[] = []
  for (const d of new Set(dangs.filter(Boolean))) {
    const t = demTenDang.doc(d, now)
    if (t !== undefined) { if (t) ra.set(d, t) } else can.push(d)
  }
  if (can.length) {
    const r = await env.DB.prepare(`SELECT dang, MIN(json_extract(json,'$.tenDang')) AS ten FROM game_v2_question
        WHERE dang IN (SELECT value FROM json_each(?)) AND json_valid(json) AND COALESCE(json_extract(json,'$.tenDang'), '') <> '' GROUP BY dang`)
      .bind(JSON.stringify(can)).all<Row>().catch(() => null)
    if (r) {
      const m = new Map((r.results ?? []).map((x) => [str(x.dang), str(x.ten)]))
      for (const d of can) { const t = m.get(d) ?? ''; demTenDang.ghi(d, now, t); if (t) ra.set(d, t) }
    }
  }
  return ra
}
/**
 * Danh mục vi kỹ năng theo id (tên, tên lỗi, nhãn nền). Mã vi kỹ năng toàn hệ (thầy 05/10: A.I tự gắn): mỗi câu = `dang:<ma_dang>` (khái niệm dạng) ∪
 * `nen:<nhãn>` (nhãn kiến thức nền `TEN_NEN`). Đọc `omni_vkn` TRƯỚC; id chưa có dòng ⇒ tổng hợp: `dang:<ma>` tên = tên dạng · `nen:<nhãn>` tên = TEN_NEN
 * (tên lỗi = tên viết thường, nhãn nền = nhãn) · `cd:<x>` tên chuyên đề · id lạ ⇒ tên = id.
 */
export async function vknTheoId(env: Env, ids: readonly string[]): Promise<Map<string, Vkn>> {
  const ra = new Map<string, Vkn>()
  const ds = [...new Set(ids.filter(Boolean))]
  if (!ds.length) return ra
  const [r, ten] = await Promise.all([
    env.DB.prepare('SELECT id, ma_dang, ten, ten_loi, nhan_nen, thu_tu FROM omni_vkn WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ds)).all<Row>().catch(() => ({ results: [] as Row[] })),
    tenCuaDang(env, ds.filter((id) => id.startsWith('dang:')).map((id) => id.slice(5))).catch(() => new Map<string, string>()),
  ])
  const coDong = new Map((r.results ?? []).map((x) => [str(x.id), vknTuDong(x)]))
  ds.forEach((id, i) => {
    const v = coDong.get(id)
    if (v) { ra.set(id, v); return }
    if (id.startsWith('dang:')) { const ma = id.slice(5); ra.set(id, { id, maDang: ma, ten: ten.get(ma) ?? ma, thuTu: 0 }); return }
    if (id.startsWith('nen:')) {
      const nhan = id.slice(4)
      const t = TEN_NEN[nhan] ?? nhan
      ra.set(id, { id, maDang: '', ten: t, tenLoi: t.toLocaleLowerCase('vi'), nhanNen: nhan, thuTu: 0 })
      return
    }
    if (id.startsWith('cd:')) { ra.set(id, { id, maDang: '', ten: id.slice(3), thuTu: 0 }); return }
    ra.set(id, { id, maDang: id.includes('#') ? id.slice(0, id.indexOf('#')) : '', ten: id, thuTu: i })
  })
  return ra
}

// ---------------------------------------------------------------- đọc sổ ⇒ SuKienOmni
const COT_SO_CU = 'khoa, sbd, qid, nguon, ma_nguon, ket_qua, luc, ngay_vn, ma_dang, muc_do, chuyen_de'
const COT_SO_MOI = `${COT_SO_CU}, received_at, assistance, purpose, visibility, raw_json, subitem_json`
/** Đếm sổ của em (khoá đệm): số dòng + mốc tiếp nhận lớn nhất (chỉ mục phủ `idx_skh_tiep_nhan(sbd, received_at, khoa)`). */
interface DemSo { n: number; r: number }
/**
 * ĐỆM DÒNG SỔ theo em (giờ cao điểm: mỗi câu trả lời thêm MỘT dòng ⇒ khỏi đọc lại cả sổ): khớp (n, r) ⇒ dùng lại; sổ chỉ THÊM dòng mới hơn ⇒ đọc phần
 * `received_at ≥ r` rồi kiểm tổng số dòng (lệch — vd dòng tới muộn mang mốc cũ — ⇒ đọc lại cả sổ). Trần 50 000 dòng mỗi isolate, 5 phút.
 * Dòng SỬA tại chỗ (chấm lại ca, công bố đổi `visibility`) không đổi (n, r) ⇒ trễ tối đa 5 phút ở isolate đã đệm (như mọi đệm hồ sơ).
 */
const demSo = new DemTTL<{ rows: Row[] } & DemSo>(5 * 60_000, 100, 50_000)
const maxNhan = (rows: readonly Row[]): number => rows.reduce((m, x) => Math.max(m, Number(x.received_at) || 0), 0)
async function docDongSoTho(env: Env, sbds: readonly string[], tuNhan?: number): Promise<Row[]> {
  const ds = dsJson(sbds)
  const them = tuNhan != null ? ' AND received_at >= ?' : ''
  const bien = tuNhan != null ? [ds, tuNhan] : [ds]
  try {
    return (await env.DB.prepare(`SELECT ${COT_SO_MOI} FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?))${them}`).bind(...bien).all<Row>()).results ?? []
  } catch (e) {
    if (tuNhan != null) throw e // đọc phần thêm lỗi ⇒ nơi gọi đọc lại cả sổ
    return (await env.DB.prepare(`SELECT ${COT_SO_CU} FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?))`).bind(ds).all<Row>()).results ?? []
  }
}
/**
 * Dòng sổ của MỘT em ĐỌC ĐOÁN TRƯỚC (tối ưu 05/10), CÙNG đợt với `demSoDong`: đệm dòng sổ đang có ⇒ phần tiếp nhận từ mốc đệm (`tu`), chưa có ⇒ cả sổ (`tu` null).
 * `docDongSo` CHỈ dùng khi đó đúng là lượt đọc nó sẽ tự chạy (cùng em, cùng câu SQL, cùng tham số); không khớp ⇒ đọc như cũ. Lỗi ⇒ null (đọc như cũ).
 */
interface SoDoan { sbd: string; tu: number | null; p: Promise<Row[] | null> }
function docSoDoan(env: Env, s: string): SoDoan {
  const cu = demSo.doc(s, Date.now())
  const tu = cu && cu.r > 0 ? cu.r : null
  return { sbd: s, tu, p: (tu != null ? docDongSoTho(env, [s], tu) : docDongSoTho(env, [s])).then((x) => x, () => null) }
}
/** Dòng sổ của các em (một truy vấn `sbd IN (…)`). D1 cũ thiếu cột CNH-1.0 ⇒ lùi câu SQL không có cột mới (như `docLanLam`). `dem` (số đếm vừa đọc) ⇒ dùng đệm dòng sổ.
 *  `soDoan` (chỉ-thêm, tối ưu 05/10): dòng sổ một em đã đọc đoán trước — dùng thay lượt đọc giống hệt. */
async function docDongSo(env: Env, sbds: readonly string[], dem?: ReadonlyMap<string, DemSo>, soDoan?: SoDoan): Promise<Row[]> {
  if (!sbds.length) return []
  if (!dem) return docDongSoTho(env, sbds)
  const now = Date.now()
  const ra: Row[] = []
  const can: string[] = []
  const doan = async (s: string, tu: number | null): Promise<Row[] | null> => (soDoan && soDoan.sbd === s && soDoan.tu === tu ? soDoan.p : null)
  // Tối ưu 05/10: phần thêm của MỌI em có đệm bắt đầu CÙNG lúc (trước: chờ từng em một — Bảng bài 40 em có thể thành 40 đợt nối tiếp); ghép kết quả đúng thứ tự cũ.
  type Buoc = { s: string; rows: Row[] } | { s: string; cu: { rows: Row[]; n: number; r: number }; d: DemSo; p: Promise<Row[]> } | { s: string }
  const buoc: Buoc[] = sbds.map((s) => {
    const d = dem.get(s) ?? { n: 0, r: 0 }
    const cu = demSo.doc(s, now)
    if (cu && cu.n === d.n && cu.r === d.r) return { s, rows: cu.rows }
    if (cu && cu.r > 0 && d.n > cu.n && d.r >= cu.r) {
      const p = doan(s, cu.r).then((x) => x ?? docDongSoTho(env, [s], cu.r))
      p.catch(() => {})
      return { s, cu, d, p }
    }
    return { s }
  })
  for (const b of buoc) {
    if ('rows' in b) { ra.push(...b.rows); continue }
    if ('p' in b) {
      try {
        const daCo = new Set(b.cu.rows.map((x) => str(x.khoa)))
        const moi = (await b.p).filter((x) => !daCo.has(str(x.khoa)))
        if (b.cu.n + moi.length === b.d.n) {
          const rows = [...b.cu.rows, ...moi]
          demSo.ghi(b.s, now, { rows, n: rows.length, r: maxNhan(rows) }, rows.length)
          ra.push(...rows)
          continue
        }
      } catch { /* đọc lại cả sổ của em bên dưới */ }
    }
    can.push(b.s)
  }
  if (can.length) {
    const rows = (can.length === 1 ? await doan(can[0]!, null) : null) ?? (await docDongSoTho(env, can))
    const theo = new Map<string, Row[]>(can.map((s) => [s, []]))
    for (const x of rows) theo.get(str(x.sbd))?.push(x)
    for (const [s, a] of theo) {
      if (a.length && a.every((x) => x.received_at !== undefined)) demSo.ghi(s, now, { rows: a, n: a.length, r: maxNhan(a) }, a.length)
      ra.push(...a)
    }
  }
  return ra
}
/** Kết quả từng ý Phần II từ `subitem_json`: mảng 4 phần tử 1/0/null (true/false cũng nhận) hoặc `{y:[…]}`; lạ ⇒ null. Thuần. */
export function docYTuSubitem(v: unknown): (0 | 1 | null)[] | null {
  let o: unknown = v
  if (typeof o === 'string') {
    if (!o.trim()) return null
    try { o = JSON.parse(o) } catch { return null }
  }
  if (o && typeof o === 'object' && !Array.isArray(o)) o = (o as Row).y
  if (!Array.isArray(o) || o.length !== 4) return null
  const ra: (0 | 1 | null)[] = []
  for (const x of o) {
    if (x === 1 || x === true) ra.push(1)
    else if (x === 0 || x === false) ra.push(0)
    else if (x === null) ra.push(null)
    else return null
  }
  return ra
}
/** `{ms, tt, td}` của `raw_json` (chỉ có khi OMNI bật lúc làm). ms ngoài [0, MS_TOI_DA] ⇒ null; tt/td lạ ⇒ null. Thuần. */
export function docRawOmni(v: unknown): { msLam: number | null; tuTin: TuTin | null; nhanTocDo: NhanTocDo | null } {
  let o: unknown = v
  if (typeof o === 'string') { try { o = JSON.parse(o) } catch { o = null } }
  const r = (o && typeof o === 'object' && !Array.isArray(o) ? o : {}) as Row
  const ms = typeof r.ms === 'number' ? r.ms : typeof r.ms === 'string' && r.ms.trim() ? Number(r.ms) : NaN
  return {
    msLam: Number.isFinite(ms) && ms >= 0 && ms <= THAM_SO_OMNI.MS_TOI_DA ? ms : null,
    tuTin: r.tt === 'chac' || r.tt === 'chua_chac' ? r.tt : null,
    nhanTocDo: NHAN_TOC_DO.has(str(r.td)) ? (str(r.td) as NhanTocDo) : null,
  }
}
const thoiDiemTiepNhan = (x: Row): number => {
  const r = Number(x.received_at)
  return Number.isFinite(r) && r > 0 ? r : Date.parse(str(x.luc)) || 0
}
/**
 * Một dòng sổ ⇒ SuKienOmni (thuần). qid gốc qua `tachSongSinh`; phần/dạng/mức theo siêu dữ liệu câu (lùi: cột sổ, `phanTuQid`);
 * `y` từ `subitem_json` (chỉ Phần II); msLam/tuTin/nhanTocDo từ `raw_json {ms, tt, td}`. Dòng lướt (purpose 'luot', ket_qua NULL) GIỮ NGUYÊN — lõi tự lọc.
 */
export function dongSangSuKien(x: Row, meta?: Pick<CauKho, 'phan' | 'dang' | 'mucDo' | 'group'> | null, khoaBai?: string | null): SuKienOmni {
  const t = tachSongSinh(str(x.qid))
  const luc = str(x.luc)
  const kq = x.ket_qua == null || x.ket_qua === '' ? null : Number(x.ket_qua) === 1 ? 1 : 0
  const as = str(x.assistance)
  const phan: Phan = meta?.phan ?? (phanTuQid(t.goc, 'I') as Phan)
  const raw = docRawOmni(x.raw_json)
  return {
    khoa: str(x.khoa), sbd: str(x.sbd), qid: t.goc, songSinh: t.songSinh !== null, nguon: str(x.nguon),
    ketQua: kq, luc, ngayVn: str(x.ngay_vn) || ngayVn(luc), receivedAt: thoiDiemTiepNhan(x),
    assistance: as === 'assisted' ? 'assisted' : as === 'unknown' ? 'unknown' : 'none',
    purpose: x.purpose == null || str(x.purpose) === '' ? null : str(x.purpose),
    phan, maDang: meta?.dang ?? (str(x.ma_dang).trim() || null), mucDo: meta?.mucDo ?? (str(x.muc_do).trim() || null),
    contentGroup: meta?.group || null,
    y: phan === 'II' ? docYTuSubitem(x.subitem_json) : null,
    msLam: raw.msLam, tuTin: raw.tuTin, nhanTocDo: raw.nhanTocDo,
    khoaBai: khoaBai ?? null,
  }
}
const sapSuKien = (a: SuKienOmni, b: SuKienOmni): number => a.receivedAt - b.receivedAt || (a.khoa < b.khoa ? -1 : a.khoa > b.khoa ? 1 : 0)
/** Bài (khoá) của câu theo phạm vi đã dạy của em (tờ gốc của câu ∈ phạm vi). */
const khoaBaiCua = (m: CauKho | undefined, pv: PhamViLop | null): string | null => {
  if (!m || !pv) return null
  for (const md of m.maDeDs) { const b = pv.baiTheoMaDe.get(md); if (b) return b.khoaBai }
  return null
}
async function docPhamViNhieuEm(env: Env, sbds: readonly string[]): Promise<Map<string, PhamViLop | null>> {
  const ds = await Promise.all(sbds.map((s) => phamViCuaEm(env, s).catch(() => null)))
  return new Map(sbds.map((s, i) => [s, ds[i] ?? null]))
}
interface SoVaMeta { suKien: Map<string, SuKienOmni[]>; kho: Map<string, CauKho>; goiY: Map<string, GoiYCau>; phamVi: Map<string, PhamViLop | null>; baiCuaQid: Map<string, Map<string, string>> }
/** Câu (qid gốc) có thời lượng làm (`raw_json.ms`) trong sổ — ĐÚNG thứ tự `dungHoSoNoi` duyệt `suKien` (em theo `sbds`, sự kiện theo (tiếp nhận, khoá)). Thuần. */
function cauCoMsTuDong(sbds: readonly string[], theoEm: ReadonlyMap<string, readonly Row[]>): string[] {
  const ra = new Set<string>()
  for (const s of sbds) {
    const ds = (theoEm.get(s) ?? []).map((x) => ({ khoa: str(x.khoa), receivedAt: thoiDiemTiepNhan(x), qid: tachSongSinh(str(x.qid)).goc, ms: docRawOmni(x.raw_json).msLam }))
    ds.sort((a, b) => a.receivedAt - b.receivedAt || (a.khoa < b.khoa ? -1 : a.khoa > b.khoa ? 1 : 0)) // = sapSuKien
    for (const e of ds) if (e.ms != null) ra.add(e.qid)
  }
  return [...ra]
}
/** Sổ của nhiều em ⇒ SuKienOmni (bỏ dòng che — ca chưa công bố), kèm siêu dữ liệu câu. `truocMs` ⇒ chỉ dòng TIẾP NHẬN trước mốc (ảnh chụp đêm).
 *  Tối ưu 05/10 (chỉ-thêm): `som` = dòng sổ / phạm vi đã đọc đoán trước; `khiCoMs` = báo NGAY khi có dòng sổ danh sách câu có thời lượng (để β câu đọc sớm).
 *  Siêu dữ liệu câu bắt đầu ngay khi có dòng sổ (trước: chờ cả phạm vi bài). Kết quả y hệt. */
async function docSoVaMeta(env: Env, sbds: readonly string[], truocMs?: number, dem?: ReadonlyMap<string, DemSo>, som?: { so?: SoDoan; phamVi?: Promise<Map<string, PhamViLop | null>> }, khiCoMs?: (coMs: string[]) => void): Promise<SoVaMeta> {
  const pPhamVi = som?.phamVi ?? docPhamViNhieuEm(env, sbds)
  const rows = await docDongSo(env, sbds, dem, som?.so)
  const theoEm = new Map<string, Row[]>()
  const goiY = new Map<string, GoiYCau>()
  for (const x of rows) {
    if (str(x.visibility) === 'embargoed') continue
    if (truocMs != null && !(thoiDiemTiepNhan(x) < truocMs)) continue
    const s = str(x.sbd)
    let a = theoEm.get(s)
    if (!a) { a = []; theoEm.set(s, a) }
    a.push(x)
    const g = tachSongSinh(str(x.qid)).goc
    if (!goiY.has(g)) goiY.set(g, { phan: phanTuQid(g, 'I') as Phan, maDang: str(x.ma_dang).trim() || null, mucDo: str(x.muc_do).trim() || null, chuyenDe: str(x.chuyen_de).trim() || null })
  }
  if (khiCoMs) khiCoMs(cauCoMsTuDong(sbds, theoEm))
  const [kho, phamVi] = await Promise.all([docCauKho(env, [...goiY.keys()]), pPhamVi])
  const suKien = new Map<string, SuKienOmni[]>()
  const baiCuaQid = new Map<string, Map<string, string>>()
  for (const s of sbds) {
    const pv = phamVi.get(s) ?? null
    const bai = new Map<string, string>()
    const ds = (theoEm.get(s) ?? []).map((x) => {
      const g = tachSongSinh(str(x.qid)).goc
      const m = kho.get(g)
      const kb = khoaBaiCua(m, pv)
      if (kb) bai.set(g, kb)
      return dongSangSuKien(x, m, kb)
    })
    ds.sort(sapSuKien)
    suKien.set(s, ds)
    baiCuaQid.set(s, bai)
  }
  return { suKien, kho, goiY, phamVi, baiCuaQid }
}
/** Sổ của các em ⇒ SuKienOmni[] (đã sắp (receivedAt, khoa), bỏ dòng ca chưa công bố). `truocMs` ⇒ chỉ dòng tiếp nhận trước mốc. */
export async function docSuKienOmni(env: Env, sbds: readonly string[], tuy: { truocMs?: number } = {}): Promise<Map<string, SuKienOmni[]>> {
  return (await docSoVaMeta(env, [...new Set(sbds.filter(Boolean))], tuy.truocMs)).suKien
}

// ---------------------------------------------------------------- β câu, xác nhận thầy, lớp
/** β câu (thời gian chuẩn) — nhớ theo lượt; `docSomOmniTraLoi` (omni-game.ts) đọc sớm câu đang trả lời. */
export const docBetaCau = (env: Env, qids: readonly string[]): Promise<Map<string, number>> => docBeta(env, qids)
async function docBeta(env: Env, qids: readonly string[]): Promise<Map<string, number>> {
  if (!qids.length) return new Map<string, number>()
  // Nhớ theo lượt (tối ưu 05/10): cùng danh sách câu trong MỘT request (đọc sớm lúc trả lời / hai lượt dựng hồ sơ) ⇒ một lượt đọc. Nơi gọi không sửa Map trả về.
  const ds = dsJson(qids)
  return nhoTheoLuot(env.DB, `omni_beta|${ds}`, async () => {
    const ra = new Map<string, number>()
    const r = await env.DB.prepare('SELECT qid, beta FROM omni_beta_cau WHERE qid IN (SELECT value FROM json_each(?))').bind(ds).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r.results ?? []) if (x.beta != null && Number.isFinite(Number(x.beta))) ra.set(str(x.qid), Number(x.beta))
    return ra
  }, ['omni_beta_cau'])
}
async function docXacNhan(env: Env, sbds: readonly string[]): Promise<Map<string, XacNhanThay[]>> {
  const ra = new Map<string, XacNhanThay[]>()
  if (!sbds.length) return ra
  const r = await env.DB.prepare('SELECT sbd, ma_dang, ket, luc FROM omni_xac_nhan WHERE sbd IN (SELECT value FROM json_each(?)) ORDER BY luc, ma_dang')
    .bind(dsJson(sbds)).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const ket = str(x.ket)
    if (ket !== 'vung' && ket !== 'day_lai') continue
    const s = str(x.sbd)
    ra.set(s, [...(ra.get(s) ?? []), { sbd: s, maDang: str(x.ma_dang), ket, luc: str(x.luc) }])
  }
  return ra
}
/** Lớp của nhiều em: `lopCuaEm` (tick bài) trước, lùi về `hoc_sinh.lop`. */
async function lopCuaNhieuEm(env: Env, sbds: readonly string[]): Promise<Map<string, string | null>> {
  const ra = new Map<string, string | null>()
  const tuLane = await Promise.all(sbds.map((s) => lopCuaEm(env, s).catch(() => null)))
  const thieu: string[] = []
  sbds.forEach((s, i) => { const l = tuLane[i]; if (l) ra.set(s, l); else thieu.push(s) })
  if (thieu.length) {
    const r = await env.DB.prepare('SELECT sbd, lop FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(dsJson(thieu)).all<Row>().catch(() => ({ results: [] as Row[] }))
    const m = new Map((r.results ?? []).map((x) => [str(x.sbd), str(x.lop).trim() || null]))
    for (const s of thieu) ra.set(s, m.get(s) ?? null)
  }
  return ra
}

// ---------------------------------------------------------------- dựng hồ sơ (phát lại)
/** Lượt đọc của bước dựng hồ sơ MỘT em bắt đầu ĐOÁN TRƯỚC (tối ưu 05/10, `hoSoOmniNhieuEm`): cùng đợt với lượt đếm sổ. Không promise nào bị từ chối. */
interface DocSomHoSo { so: SoDoan; xacNhan: Promise<Map<string, XacNhanThay[]>>; phamVi: Promise<Map<string, PhamViLop | null>>; prior: Promise<Map<string, Map<string, number>>> }
function batDauDocHoSo(env: Env, sbd: string, homNay: string, tsP: Promise<ThamSoOmni>): DocSomHoSo {
  return { so: docSoDoan(env, sbd), xacNhan: docXacNhan(env, [sbd]), phamVi: docPhamViNhieuEm(env, [sbd]), prior: tsP.then((ts) => priorChoNhieuEm(env, [sbd], homNay, ts)) }
}
interface TuyDung { truocMs?: number; coPrior: boolean; homNay: string; ts: ThamSoOmni; dem?: ReadonlyMap<string, DemSo>; som?: DocSomHoSo }
interface KetQuaDung { hs: HoSoOmniEm; p0: ReadonlyMap<string, number>; suKien: SuKienOmni[] }
async function dungHoSoNoi(env: Env, sbdsVao: readonly string[], tuy: TuyDung): Promise<Map<string, KetQuaDung>> {
  const ra = new Map<string, KetQuaDung>()
  const sbds = [...new Set(sbdsVao.filter(Boolean))]
  if (!sbds.length) return ra
  // Tối ưu 05/10: prior lớp + xác nhận của thầy KHÔNG phụ thuộc sổ của em ⇒ bắt đầu NGAY (trước: prior chờ cả sổ + siêu dữ liệu câu); β câu bắt đầu ngay
  // khi có dòng sổ (trước: chờ thêm siêu dữ liệu + phạm vi). Cùng tham số, cùng thứ tự ⇒ kết quả y hệt. `som` chỉ dùng khi đúng MỘT em ấy.
  const som = tuy.som && sbds.length === 1 && tuy.som.so.sbd === sbds[0] && tuy.truocMs == null && tuy.coPrior ? tuy.som : undefined
  const pPrior = tuy.coPrior ? (som?.prior ?? priorChoNhieuEm(env, sbds, tuy.homNay, tuy.ts)) : Promise.resolve(new Map<string, Map<string, number>>())
  const beta: { p: Promise<Map<string, number>> | null } = { p: null }
  const [so, xn] = await Promise.all([
    docSoVaMeta(env, sbds, tuy.truocMs, tuy.dem, som, (coMs) => { beta.p = docBeta(env, coMs) }),
    som?.xacNhan ?? docXacNhan(env, sbds),
  ])
  const qids = [...so.goiY.keys()]
  const [q, betaCau, prior] = await Promise.all([
    qTuKho(env, qids, so.kho, so.goiY),
    beta.p ?? docBeta(env, []),
    pPrior,
  ])
  const catIso = tuy.truocMs != null ? new Date(tuy.truocMs).toISOString() : null
  for (const s of sbds) {
    const suKien = so.suKien.get(s) ?? []
    const xacNhan = (xn.get(s) ?? []).filter((v) => !catIso || v.luc < catIso)
    const p0 = prior.get(s) ?? new Map<string, number>()
    const hs = phatLaiEm(s, { suKien, q, beta: betaCau, xacNhan, p0, homNay: tuy.homNay, baiCuaQid: so.baiCuaQid.get(s) ?? new Map(), ts: tuy.ts })
    ra.set(s, { hs, p0, suKien })
  }
  return ra
}
const hoSoRong = (sbd: string, homNay: string, ts: ThamSoOmni = THAM_SO_OMNI): HoSoOmniEm => phatLaiEm(sbd, { suKien: [], q: new Map(), homNay, ts })

// ---------------------------------------------------------------- prior lớp (ảnh chụp đêm của bạn cùng lớp; thiếu ⇒ tính lại cùng mốc cắt)
type ThoLop = Map<string, Map<string, { p: number; n: number }>>
/** Thuần: prior của một em = trung bình P THÔ của bạn cùng lớp có quan sát ở vi kỹ năng ấy (không tính chính em), khi ≥ PRIOR_LOP_TOI_THIEU bạn; cộng theo thứ tự SBD (tất định). */
export function gopPrior(tho: ReadonlyMap<string, ReadonlyMap<string, { p: number; n: number }>>, boSbd: string, ts: ThamSoOmni = THAM_SO_OMNI): Map<string, number> {
  const tong = new Map<string, { sum: number; n: number }>()
  for (const s of [...tho.keys()].sort()) {
    if (s === boSbd) continue
    for (const [k, v] of tho.get(s)!) {
      if (!(v.n > 0) || !Number.isFinite(v.p)) continue
      const t = tong.get(k) ?? { sum: 0, n: 0 }
      t.sum += v.p
      t.n++
      tong.set(k, t)
    }
  }
  const ra = new Map<string, number>()
  for (const [k, t] of [...tong].sort((a, b) => (a[0] < b[0] ? -1 : 1))) if (t.n >= ts.PRIOR_LOP_TOI_THIEU) ra.set(k, t.sum / t.n)
  return ra
}
/** Em (đang bật OMNI) của một lớp, theo SBD. Lỗi đọc ⇒ NÉM (nơi gọi bỏ prior lượt này, không đệm kết quả rỗng). */
async function emBatOmniCuaLop(env: Env, lop: string): Promise<string[]> {
  const [coO, coH, r] = await Promise.all([
    docCoOmni(env), docCoHoa2(env),
    env.DB.prepare("SELECT sbd FROM hoc_sinh WHERE COALESCE(lop, '') = ? AND COALESCE(trang_thai, '') <> 'khoa' ORDER BY sbd").bind(lop).all<Row>(),
  ])
  return (r.results ?? []).map((x) => str(x.sbd)).filter((s) => s && apDungOmniCho(coH, coO, s, lop))
}
const hoSoThoTuHs = (hs: HoSoOmniEm): Map<string, { p: number; n: number }> =>
  new Map(Object.entries(hs.vkn).map(([k, v]) => [k, { p: v.p, n: v.nTuLam }]))
async function thoCuaLop(env: Env, lop: string, homNay: string, ts: ThamSoOmni): Promise<ThoLop> {
  const khoa = `${lop}|${homNay}|${khoaTs(ts)}|${phienBanDem}`
  const co = demTho.doc(khoa, Date.now())
  if (co) return co
  const ra: ThoLop = new Map()
  const ban = await emBatOmniCuaLop(env, lop)
  if (ban.length >= ts.PRIOR_LOP_TOI_THIEU) {
    const moc = dauNgayVn(homNay)
    const [emAnh, pAnh] = await Promise.all([
      env.DB.prepare('SELECT sbd FROM omni_em WHERE sbd IN (SELECT value FROM json_each(?)) AND cap_nhat_luc = ? AND phien_ban = ?').bind(JSON.stringify(ban), moc, PHIEN_BAN_OMNI).all<Row>().catch(() => ({ results: [] as Row[] })),
      env.DB.prepare('SELECT sbd, vkn_id, p, n_tu_lam FROM omni_p_vkn WHERE sbd IN (SELECT value FROM json_each(?)) AND cap_nhat_luc = ? AND phien_ban = ?').bind(JSON.stringify(ban), moc, PHIEN_BAN_OMNI).all<Row>().catch(() => ({ results: [] as Row[] })),
    ])
    const coAnh = new Set((emAnh.results ?? []).map((x) => str(x.sbd)))
    for (const s of coAnh) ra.set(s, new Map())
    for (const x of pAnh.results ?? []) ra.get(str(x.sbd))?.set(str(x.vkn_id), { p: Number(x.p), n: Number(x.n_tu_lam) || 0 })
    const thieu = ban.filter((s) => !coAnh.has(s))
    if (thieu.length) {
      const tinh = await dungHoSoNoi(env, thieu, { truocMs: Date.parse(moc), coPrior: false, homNay, ts })
      for (const [s, k] of tinh) ra.set(s, hoSoThoTuHs(k.hs))
    }
  }
  demTho.ghi(khoa, Date.now(), ra)
  return ra
}
async function priorChoNhieuEm(env: Env, sbds: readonly string[], homNay: string, ts: ThamSoOmni): Promise<Map<string, Map<string, number>>> {
  const ra = new Map<string, Map<string, number>>()
  const lop = await lopCuaNhieuEm(env, sbds)
  const theoLop = new Map<string, string[]>()
  for (const s of sbds) { const l = lop.get(s); if (l) theoLop.set(l, [...(theoLop.get(l) ?? []), s]) }
  for (const [l, ems] of theoLop) {
    const tho = await thoCuaLop(env, l, homNay, ts).catch(() => new Map() as ThoLop)
    for (const s of ems) ra.set(s, gopPrior(tho, s, ts))
  }
  return ra
}

// ---------------------------------------------------------------- hồ sơ trực tiếp (đệm 60 s)
const khoaDemSo = (sbds: readonly string[]): string => `omni_dem_so|${dsJson(sbds)}`
async function demSoDong(env: Env, sbds: readonly string[]): Promise<Map<string, DemSo>> {
  const ra = new Map<string, DemSo>()
  if (!sbds.length) return ra
  const ds = dsJson(sbds)
  // Nhớ theo lượt (tối ưu 05/10): MỘT request hỏi số đếm sổ của cùng (các) em nhiều lần (đoán trước lúc trả lời, Sảnh: lập kế hoạch rồi phần OMNI) ⇒ một lượt đọc;
  // lượt ghi `su_kien_hoc` của chính request ⇒ đếm lại.
  const rows = await nhoTheoLuot(env.DB, khoaDemSo(sbds), async () => {
    try {
      return (await env.DB.prepare('SELECT sbd, COUNT(*) AS n, MAX(COALESCE(received_at, 0)) AS r FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd').bind(ds).all<Row>()).results ?? []
    } catch {
      // D1 cũ chưa có `received_at`: khoá theo số dòng + giờ học lớn nhất (đệm dòng sổ không dùng — r âm không bao giờ khớp)
      const cu = (await env.DB.prepare('SELECT sbd, COUNT(*) AS n, MAX(luc) AS l FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd').bind(ds).all<Row>()).results ?? []
      for (const x of cu) x.r = -(Date.parse(str(x.l)) || 1)
      return cu
    }
  }, ['su_kien_hoc'])
  for (const x of rows) ra.set(str(x.sbd), { n: Number(x.n) || 0, r: Number(x.r) || 0 })
  return ra
}
/** Hồ sơ OMNI của nhiều em một lượt (một truy vấn sổ `sbd IN (…)`; đệm 60 s theo (em, ngày, số dòng sổ)). Lỗi ⇒ hồ sơ rỗng (prior). */
export async function hoSoOmniNhieuEm(env: Env, dsSbd: readonly string[], nowMs: number): Promise<Map<string, HoSoOmniEm>> {
  const sbds = [...new Set(dsSbd.filter(Boolean))]
  const homNay = ngayVnCua(nowMs)
  const ra = new Map<string, HoSoOmniEm>()
  let ts: ThamSoOmni = THAM_SO_OMNI
  try {
    // Tối ưu 05/10: lượt đếm sổ KHÔNG cần tham số ⇒ bắt đầu cùng lượt đọc tham số (trước: chờ tham số xong). Thứ tự `await` như cũ (tham số trước).
    // MỘT em, lượt hỏi ĐẦU TIÊN của request (bản gộp đọc của lệnh game): các lượt đọc của bước dựng (sổ, xác nhận của thầy, phạm vi bài, prior lớp) cũng bắt đầu
    // CÙNG đợt. Đệm hồ sơ trúng ⇒ bỏ chúng (chỉ phí vài câu đọc nhỏ cùng lô); trượt ⇒ dùng đúng chúng (trước: 3–6 đợt nối tiếp sau lượt đếm).
    const tsP = docThamSoOmni(env)
    const som = sbds.length === 1 && laBanGop(env.DB) && !daNho(env.DB, khoaDemSo(sbds)) ? batDauDocHoSo(env, sbds[0]!, homNay, tsP) : undefined
    const demP = demSoDong(env, sbds)
    demP.catch(() => {})
    ts = await tsP
    const dem = await demP
    const khoa = (s: string) => `${s}|${homNay}|${dem.get(s)?.n ?? 0}|${dem.get(s)?.r ?? 0}|${khoaTs(ts)}|${phienBanDem}`
    const thieu: string[] = []
    for (const s of sbds) {
      const v = demHoSo.doc(khoa(s), nowMs)
      if (v) ra.set(s, v)
      else thieu.push(s)
    }
    if (thieu.length) {
      const moi = await dungHoSoNoi(env, thieu, { coPrior: true, homNay, ts, dem, som })
      for (const [s, k] of moi) { ra.set(s, k.hs); demHoSo.ghi(khoa(s), nowMs, k.hs) }
    }
  } catch { /* lỗi ⇒ hồ sơ rỗng cho em còn thiếu */ }
  for (const s of sbds) if (!ra.has(s)) ra.set(s, hoSoRong(s, homNay, ts))
  return new Map(dsSbd.map((s) => [s, ra.get(s) ?? hoSoRong(s, homNay, ts)]))
}
/** Hồ sơ OMNI của em tại `nowMs` (phát lại TOÀN BỘ sổ + Q + β + xác nhận + prior lớp + bài của câu; đệm 60 s). Lỗi ⇒ hồ sơ rỗng (prior). */
export async function hoSoOmniEm(env: Env, sbd: string, nowMs: number): Promise<HoSoOmniEm> {
  // Nhớ theo lượt (tối ưu 05/10): `answer` hỏi hồ sơ HAI lần song song (thời gian kỳ vọng + hồ sơ) và đoán trước lúc vào lệnh ⇒ MỘT lần dựng (trước: dựng hai lần).
  // Không khai bảng ⇒ MỌI lệnh ghi của request xoá mục này (hỏi sau lệnh ghi ⇒ dựng lại như cũ). Hồ sơ trả về dùng chung (như đệm 60 s) — nơi gọi không sửa.
  return nhoTheoLuot(env.DB, `omni_ho_so|${sbd}|${ngayVnCua(nowMs)}`, async () => (await hoSoOmniNhieuEm(env, [sbd], nowMs)).get(sbd)!)
}
/** Thời gian kỳ vọng riêng (ms) của em cho câu: e^{β câu − τ em} (omni-toc-do.ts `msKyVong`; β vắng ⇒ ước lượng theo phần × mức). */
export async function kyVongMsCau(env: Env, sbd: string, q: { qid: string; phan: 'I' | 'II' | 'III'; mucDo: string | null }, nowMs: number): Promise<number> {
  const goc = tachSongSinh(q.qid).goc
  try {
    const [beta, hs] = await Promise.all([docBeta(env, [goc]), hoSoOmniEm(env, sbd, nowMs)])
    return msKyVong(beta.get(goc) ?? null, hs.tau, q.phan, q.mucDo)
  } catch {
    return msKyVong(null, 0, q.phan, q.mucDo)
  }
}
/** Số lượt lướt hôm nay của em (dòng purpose 'luot' ngày VN hôm nay). Lỗi / D1 cũ ⇒ 0. */
export async function soLuotHomNay(env: Env, sbd: string, nowMs: number): Promise<number> {
  const ngay = ngayVnCua(nowMs)
  // Nhớ theo lượt (tối ưu 05/10): đọc đoán trước lúc vào lệnh trả lời dùng lại; lệnh ghi sổ của chính request ⇒ đọc lại.
  return nhoTheoLuot(env.DB, `omni_luot|${sbd}|${ngay}`, async () => {
    const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND purpose = ?').bind(sbd, ngay, MUC_DICH_LUOT).first<Row>().catch(() => null)
    return Number(r?.n) || 0
  }, ['su_kien_hoc'])
}

// ---------------------------------------------------------------- tiện ích phạm vi / dự báo
/** Thuần: chia `tong` theo trọng số (phần dư lớn nhất; hoà ⇒ chỉ số nhỏ trước). Tổng kết quả = tong (khi có trọng số dương). */
export function chiaTheoTiLe(tong: number, trongSo: readonly number[]): number[] {
  const w = trongSo.map((x) => (Number.isFinite(x) && x > 0 ? x : 0))
  const S = w.reduce((a, b) => a + b, 0)
  if (!(tong > 0) || S <= 0) return w.map(() => 0)
  const tho = w.map((x) => (x * tong) / S)
  const ra = tho.map((x) => Math.floor(x))
  let con = tong - ra.reduce((a, b) => a + b, 0)
  const thu = tho.map((x, i) => ({ du: x - Math.floor(x), i, w: w[i]! })).filter((o) => o.w > 0).sort((a, b) => b.du - a.du || a.i - b.i)
  for (let j = 0; con > 0 && thu.length; j = (j + 1) % thu.length, con--) ra[thu[j]!.i]!++
  return ra
}
/**
 * Khung đề của phạm vi bài (ca chốt): 18 + 4 + 6 (CA_CHOT); phần KHÔNG có câu nào trong phạm vi ⇒ số câu của phần ấy chia cho các phần có câu theo tỉ lệ số câu
 * của phạm vi (tổng giữ 28). Phạm vi rỗng ⇒ đủ khung. Thuần.
 */
export function khungTheoPhamVi(cau: readonly Pick<QCau, 'phan'>[], ts: ThamSoOmni = THAM_SO_OMNI): KhungDe {
  const goc: KhungDe = { I: ts.CA_CHOT.I, II: ts.CA_CHOT.II, III: ts.CA_CHOT.III }
  const dem: KhungDe = { I: 0, II: 0, III: 0 }
  for (const c of cau) if (laPhan(c.phan)) dem[c.phan]++
  const co = PHAN.filter((p) => dem[p] > 0)
  if (!co.length || co.length === PHAN.length) return goc
  const du = PHAN.filter((p) => !dem[p]).reduce((s, p) => s + goc[p], 0)
  const them = chiaTheoTiLe(du, co.map((p) => dem[p]))
  const ra: KhungDe = { I: 0, II: 0, III: 0 }
  co.forEach((p, i) => { ra[p] = goc[p] + them[i]! })
  return ra
}
const dsDang = (cau: readonly QCau[]): string[] => [...new Set(cau.map((c) => c.maDang ?? '').filter(Boolean))]
const vknCuaCau = (c: QCau): string[] => [...new Set([...c.vkn, ...(c.vknY ?? []).flat()])]
/** Hồ sơ giả định: mọi vi kỹ năng của các câu `cau` đạt ngưỡng K (để đếm "còn N dạng để chạm 8"). Thuần, không sửa đầu vào. */
function nangDang(hs: HoSoOmniEm, cau: readonly QCau[], ts: ThamSoOmni): HoSoOmniEm {
  const vkn: Record<string, HoSoVkn> = { ...hs.vkn }
  for (const k of new Set(cau.flatMap(vknCuaCau))) {
    const cu = vkn[k]
    vkn[k] = cu
      ? { ...cu, p: Math.max(cu.p, ts.K_P_VKN), trangThai: 'vung' }
      : { vkn: k, p: ts.K_P_VKN, nTuLam: 0, nCau: 0, nNgay: 0, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'vung', ngayCuoi: null, dayLai: false }
  }
  return { ...hs, vkn }
}
/** Số dạng chưa vững còn kéo dự báo ca chốt dưới mốc (tham lam theo điểm còn lấy được); < S_AO quan sát ⇒ null. Thuần. */
export function demDangDe8(hs: HoSoOmniEm, cau: readonly QCau[], vung: readonly string[], ts: ThamSoOmni = THAM_SO_OMNI): number | null {
  if (!cau.length) return null
  const khung = khungTheoPhamVi(cau, ts)
  const db = duBaoDiem(hs, cau, { khung, mucTieu: ts.MUC_TIEU }, ts)
  if (!duDuLieu(db.soBangChung, ts)) return null
  if (db.kyVong >= ts.MUC_TIEU) return 0
  const chua = dsDang(cau).filter((d) => !vung.includes(d))
  const diem = new Map(chua.map((d) => [d, cau.filter((c) => c.maDang === d).reduce((s, c) => s + trongSoCau(hs, c, hs.sEm, ts), 0)]))
  chua.sort((a, b) => diem.get(b)! - diem.get(a)! || (a < b ? -1 : 1))
  let gia = hs
  for (let i = 0; i < chua.length; i++) {
    gia = nangDang(gia, cau.filter((c) => c.maDang === chua[i]), ts)
    if (duBaoDiem(gia, cau, { khung, mucTieu: ts.MUC_TIEU }, ts).kyVong >= ts.MUC_TIEU) return i + 1
  }
  return chua.length
}
/** Chiến dịch ĐANG LUYỆN của em (đang chạy, còn hạn, đã tới ngày bắt đầu), hạn gần trước. */
export function chienDichDangLuyen(ds: readonly ChienDich[], homNay: string): ChienDich[] {
  return ds.filter((c) => c.trangThai === 'dang_chay' && c.hanNop >= homNay && !chuaBatDau(c, homNay))
    .sort((a, b) => (a.hanNop < b.hanNop ? -1 : a.hanNop > b.hanNop ? 1 : a.taoLuc < b.taoLuc ? -1 : a.taoLuc > b.taoLuc ? 1 : 0))
}
/** Thứ Hai (YYYY-MM-DD) của tuần chứa ngày VN `ngay`. Thuần. */
export function thuHaiCua(ngay: string): string {
  const dow = new Date(`${ngay}T00:00:00Z`).getUTCDay() // 0 = Chủ nhật
  return congNgay(ngay, -((dow + 6) % 7))
}
/** Nhãn khung giờ (24 giờ, giờ VN; app phụ huynh đọc chặt dạng HH:MM–HH:MM, giờ ≤ 23 ⇒ khung cuối ngày ghi tới 23:59). */
const NHAN_GIO: Record<KhungGio, string> = { truoc18: '06:00–18:00', '18_20': '18:00–20:00', '20_22': '20:00–22:00', '22_24': '22:00–23:59', sau24: '00:00–06:00' }
/** Khung giờ em học nhiều nhất (theo lượt thật của hồ sơ); chưa có lượt ⇒ null. Thuần. */
export function gioHocTu(hs: Pick<HoSoOmniEm, 'khungGio'>): string | null {
  let tot: KhungGio | null = null
  for (const k of CAC_KHUNG_GIO) if ((hs.khungGio?.[k]?.n ?? 0) > 0 && (!tot || hs.khungGio[k].n > hs.khungGio[tot].n)) tot = k
  return tot ? NHAN_GIO[tot] : null
}

// ---------------------------------------------------------------- vé, đề thử, chứng chỉ (đọc)
async function docVeDaDung(env: Env, sbd: string, homNay: string): Promise<number> {
  const r = await env.DB.prepare('SELECT da_dung FROM omni_ve WHERE sbd = ? AND tuan = ?').bind(sbd, thuHaiCua(homNay)).first<Row>().catch(() => null)
  return Math.max(0, Number(r?.da_dung) || 0)
}
async function coDeThuHomNay(env: Env, sbd: string, homNay: string): Promise<boolean> {
  const r = await env.DB.prepare('SELECT 1 AS c FROM omni_de_thu WHERE sbd = ? AND tao_luc >= ? AND tao_luc < ? LIMIT 1').bind(sbd, dauNgayVn(homNay), dauNgayVn(congNgay(homNay, 1))).first<Row>().catch(() => null)
  return !!r
}
interface ChungChiDoc { chienDichId: string; ten: string; doTin: number; ngay: string; diem: number | null; maCa: string | null }
async function docChungChiEm(env: Env, sbd: string): Promise<ChungChiDoc[]> {
  const r = await env.DB.prepare(`SELECT c.chien_dich_id, c.cap_luc, c.do_tin, c.diem_ca_chot, c.ma_ca, d.ten FROM omni_chung_chi c LEFT JOIN chien_dich d ON d.id = c.chien_dich_id
      WHERE c.sbd = ? ORDER BY c.cap_luc DESC, c.chien_dich_id`).bind(sbd).all<Row>().catch(() => ({ results: [] as Row[] }))
  return (r.results ?? []).map((x) => ({
    chienDichId: str(x.chien_dich_id), ten: str(x.ten) || 'Bài đã luyện', doTin: Math.max(0, Math.min(1, Number(x.do_tin) || 0)), ngay: ngayVn(str(x.cap_luc)) || str(x.cap_luc).slice(0, 10),
    diem: x.diem_ca_chot == null || !Number.isFinite(Number(x.diem_ca_chot)) ? null : Number(x.diem_ca_chot), maCa: x.ma_ca == null ? null : str(x.ma_ca),
  }))
}
/** Còn câu MỚI (chưa từng làm) của bài đang luyện trong phần còn lại của kế hoạch hôm nay (đã chốt)? — để gợi ý "Để mai". */
async function conCauMoiChuaLam(env: Env, sbd: string, nowMs: number, dangLuyen: readonly ChienDich[]): Promise<boolean> {
  const kh = await docKeHoachDaChot(env, sbd, nowMs).catch(() => null)
  if (!kh) return false
  const cdQ = new Set(dangLuyen.flatMap((c) => c.qids))
  const ung = [...new Set([...kh.conDao, ...kh.conDoan].map(qidGoc).filter((q) => cdQ.has(q)))]
  if (!ung.length) return false
  const r = await env.DB.prepare('SELECT DISTINCT qid FROM su_kien_hoc WHERE sbd = ? AND qid IN (SELECT value FROM json_each(?))')
    .bind(sbd, JSON.stringify(ung.flatMap(cacQidSongSinh))).all<Row>().catch(() => null)
  if (!r) return false
  const da = new Set((r.results ?? []).map((x) => tachSongSinh(str(x.qid)).goc))
  return ung.some((q) => !da.has(q))
}

// ---------------------------------------------------------------- Sảnh
/** Lượt ĐỌC của ô OMNI trên Sảnh KHÔNG phụ thuộc kế hoạch hôm nay (tối ưu 05/10): `sanh2` bắt đầu chúng cùng lúc lập/đọc kế hoạch rồi đưa vào `omniChoSanh`.
 *  Lỗi được "đánh dấu đã bắt" (không thành lỗi treo); nơi dùng vẫn nhận đúng lỗi ở chỗ `await` cũ. */
export interface DocSomSanhOmni { ds: Promise<ChienDich[]>; chungChi: Promise<ChungChiDoc[]>; veDaDung: Promise<number>; daThu: Promise<boolean> }
export function docSomChoSanh(env: Env, sbd: string, nowMs: number): DocSomSanhOmni {
  const homNay = ngayVnCua(nowMs)
  const som = <T>(p: Promise<T>): Promise<T> => { p.catch(() => {}); return p }
  return { ds: som(docChienDichCuaEm(env, sbd)), chungChi: som(docChungChiEm(env, sbd)), veDaDung: som(docVeDaDung(env, sbd, homNay)), daThu: som(coDeThuHomNay(env, sbd, homNay)) }
}
/** Phần OMNI thêm vào `hoa2-sanh` (null khi OMNI tắt cho em hoặc lỗi — Sảnh cũ không bao giờ hỏng vì OMNI). `som` (chỉ-thêm): lượt đọc `docSomChoSanh` đã bắt đầu. */
export async function omniChoSanh(env: Env, sbd: string, nowMs: number, ngu: { tong: number; con: number; chienDichId: string | null; onBaiCu?: number; cheDoCho?: boolean }, som?: DocSomSanhOmni | null): Promise<SanhOmni | null> {
  try {
    if (!(await omniBat(env, sbd))) return null
    const ts = await docThamSoOmni(env)
    const homNay = ngayVnCua(nowMs)
    const [ds, hs, chungChi, veDaDung, daThu] = await Promise.all([
      som?.ds ?? docChienDichCuaEm(env, sbd), hoSoOmniEm(env, sbd, nowMs), som?.chungChi ?? docChungChiEm(env, sbd), som?.veDaDung ?? docVeDaDung(env, sbd, homNay), som?.daThu ?? coDeThuHomNay(env, sbd, homNay),
    ])
    const dangLuyen = chienDichDangLuyen(ds, homNay)
    const gan = dangLuyen[0] ?? null
    const cau = gan ? [...(await qCuaCau(env, gan.qids)).values()] : []
    const dangCo = dsDang(cau)
    const vung = gan ? dangDaVung(hs, cau, ts).filter((d) => dangCo.includes(d)) : []
    const met = xetMetGio(hs, khungGioCua(nowMs), ts)
    // Em đã bấm "Để mai"/"Làm luôn" hôm nay (srs2_ke_hoach_omni.met_gio) ⇒ không gợi ý đổi thứ tự lần nữa trong ngày.
    const daQuyet = met && met.kichHoat ? await docQuyetMetGio(env, sbd, nowMs).catch(() => null) : null
    const metGio = met && met.kichHoat ? { khung: met.khung, tiLe: met.tiLe, tiLeTot: met.tiLeTot, coTheDoi: !daQuyet && (await conCauMoiChuaLam(env, sbd, nowMs, dangLuyen)) } : null
    const nhatKy = ngu.con === 0 && ngu.tong > 0 ? await nhatKyHomNay(env, sbd, nowMs) : []
    return {
      bat: true,
      baiDangLuyen: dangLuyen.map((c) => ({ id: c.id, ten: c.ten, hanNop: c.hanNop })),
      dangVung: { a: vung.length, b: dangCo.length },
      conDangDe8: gan ? demDangDe8(hs, cau, vung, ts) : null,
      sEm: duDuLieu(hs.nVung, ts) ? hs.sEm : null,
      sMucTieu: ts.C_SO_Y,
      chungChi: chungChi.map((c) => ({ ten: c.ten, doTin: c.doTin, ngay: c.ngay })),
      ve: { con: Math.max(0, ts.VE_MOI_TUAN - veDaDung), tong: ts.VE_MOI_TUAN },
      choBaiMoi: ngu.cheDoCho === true,
      onBaiCu: Math.max(0, Math.floor(Number(ngu.onBaiCu) || 0)),
      metGio,
      nhatKy: nhatKy.length ? nhatKy : null,
      deThu: { duoc: !!gan && soNgayGiua(gan.batDau, homNay) >= ts.DE_THU.ngayTu - 1 && !daThu, soCau: ts.DE_THU.soCau, phut: ts.DE_THU.phut },
      ...(canThanTu(true, hs, ts) ? { canThan: true } : {}), // CẨN THẬN (omni-can-than.ts): chỉ-thêm, CHỈ khi Sơ ý (số `sEm` ở trên) > ngưỡng — vắng ⇒ app em y hệt
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- nhật ký "Hôm nay em tiến thêm gì"
/**
 * 2–5 dòng SỰ THẬT BẰNG SỐ từ sổ hôm nay + hồ sơ (trước hôm nay ↔ bây giờ): số câu / đúng · vi kỹ năng lên nhiều nhất "Tên: 0,41 → 0,78 (9 câu)" ·
 * câu nền đúng · sơ ý · đúng nhưng chậm (thêm "câu gặp lần đầu" khi chỉ có một dòng). Không nhãn năng lực, không so với bạn. Không làm câu nào ⇒ [].
 */
export async function nhatKyHomNay(env: Env, sbd: string, nowMs: number): Promise<string[]> {
  try {
    const ts = await docThamSoOmni(env)
    const homNay = ngayVnCua(nowMs)
    const dem = await demSoDong(env, [sbd])
    const khoa = `${sbd}|${homNay}|${dem.get(sbd)?.n ?? 0}|${dem.get(sbd)?.r ?? 0}|${khoaTs(ts)}|${phienBanDem}`
    const co = demNhatKy.doc(khoa, nowMs)
    if (co) return [...co]
    const dong = await dungNhatKy(env, sbd, homNay, ts, dem)
    demNhatKy.ghi(khoa, nowMs, dong)
    return [...dong]
  } catch {
    return []
  }
}
async function dungNhatKy(env: Env, sbd: string, homNay: string, ts: ThamSoOmni, dem: ReadonlyMap<string, DemSo>): Promise<string[]> {
  {
    const moc = Date.parse(dauNgayVn(homNay))
    const [nay, truoc] = await Promise.all([
      dungHoSoNoi(env, [sbd], { coPrior: true, homNay, ts, dem }).then((m) => m.get(sbd)),
      dungHoSoNoi(env, [sbd], { truocMs: moc, coPrior: true, homNay, ts, dem }).then((m) => m.get(sbd)),
    ])
    if (!nay) return []
    const laLam = (e: SuKienOmni) => e.ketQua !== null && e.purpose !== 'xem_loi_giai' && e.purpose !== MUC_DICH_LUOT
    const homNayLam = nay.suKien.filter((e) => e.ngayVn === homNay && laLam(e))
    if (!homNayLam.length) return []
    const dau = new Map<string, SuKienOmni>()
    for (const e of homNayLam) if (!dau.has(e.qid)) dau.set(e.qid, e)
    const dauDs = [...dau.values()]
    const dong: string[] = [`Hôm nay em làm ${dau.size} câu, đúng ${dauDs.filter((e) => e.ketQua === 1).length} câu.`]
    // vi kỹ năng lên nhiều nhất
    const hsNay = nay.hs, hsTruoc = truoc?.hs
    let tot: { k: string; a: number; b: number; n: number } | null = null
    for (const [k, v] of Object.entries(hsNay.vkn)) {
      const cu = hsTruoc?.vkn[k]
      const n = v.nTuLam - (cu?.nTuLam ?? 0)
      if (n <= 0) continue
      const a = cu?.p ?? truoc?.p0.get(k) ?? nay.p0.get(k) ?? ts.P0
      const d = v.p - a
      if (d > 0.005 && (!tot || d > tot.b - tot.a || (d === tot.b - tot.a && k < tot.k))) tot = { k, a, b: v.p, n }
    }
    if (tot) {
      const k = tot.k
      const [tenMap, qMap] = await Promise.all([vknTheoId(env, [k]).catch(() => new Map<string, Vkn>()), qCuaCau(env, [...dau.keys()]).catch(() => new Map<string, QCau>())])
      // số CÂU hôm nay chạm vi kỹ năng ấy (câu Đúng–sai nhiều ý vẫn là một câu); không tra được Q ⇒ số quan sát
      const soCau = [...dau.keys()].filter((q) => { const c = qMap.get(q); return !!c && vknCuaCau(c).includes(k) }).length || tot.n
      dong.push(`${tenMap.get(k)?.ten ?? k}: ${soP(tot.a)} → ${soP(tot.b)} (${soCau} câu)`)
    }
    const nen = new Set(homNayLam.filter((e) => e.nguon === 'nen' && e.ketQua === 1).map((e) => e.qid)).size
    if (nen > 0) dong.push(`Câu nền làm đúng hôm nay: ${nen} câu.`)
    const dV = hsNay.nVung - (hsTruoc?.nVung ?? 0)
    if (dV > 0 && hsTruoc) dong.push(`Sơ ý: ${phanTram(hsTruoc.sEm)} → ${phanTram(hsNay.sEm)} (${dV} lượt ở câu em đã vững).`)
    const cham = dauDs.filter((e) => e.ketQua === 1 && e.nhanTocDo === 'cham').length
    if (cham > 0) dong.push(`Đúng nhưng chậm: ${cham} câu — mai gặp câu tương tự để làm nhanh hơn.`)
    if (dong.length < 2) {
      const truocHomNay = new Set(nay.suKien.filter((e) => e.ngayVn < homNay && laLam(e)).map((e) => e.qid))
      const moi = [...dau.keys()].filter((q) => !truocHomNay.has(q)).length
      if (moi > 0) dong.push(`Câu em gặp lần đầu hôm nay: ${moi} câu.`)
    }
    return dong.slice(0, 5)
  }
}

// ---------------------------------------------------------------- hiệu chuẩn (dự báo ca chốt vs điểm thật)
export interface HieuChuan { soCaChot: number; du: boolean; mae: number | null; thienLech: number | null; soCap: number }
/** Cặp (dự báo lúc gán ca chốt, điểm lượt nộp đầu) trên mọi ca chốt; đủ khi ≥ HIEU_CHUAN.soCaChot ca và MAE ≤ maeToiDa. Đệm 10 phút. */
export async function docHieuChuan(env: Env, ts: ThamSoOmni = THAM_SO_OMNI): Promise<HieuChuan> {
  const co = demHieuChuan.doc('hc', Date.now())
  if (co) return co
  const r = await env.DB.prepare(`SELECT d.pham_vi, d.ky_vong,
        (SELECT l.tong FROM luot l WHERE l.ma_ca = substr(d.pham_vi, 9) AND l.sbd = d.sbd AND COALESCE(l.nop_luc, '') <> '' AND l.tong IS NOT NULL ORDER BY l.lan_thu LIMIT 1) AS tong
      FROM omni_du_bao d WHERE d.pham_vi LIKE 'ca_chot:%'`).all<Row>().catch(() => null)
  const cap = (r?.results ?? []).filter((x) => x.tong != null && Number.isFinite(Number(x.tong)) && Number.isFinite(Number(x.ky_vong)))
  const ca = new Set(cap.map((x) => str(x.pham_vi)))
  const mae = cap.length ? cap.reduce((s, x) => s + Math.abs(Number(x.ky_vong) - Number(x.tong)), 0) / cap.length : null
  const thienLech = cap.length ? cap.reduce((s, x) => s + (Number(x.ky_vong) - Number(x.tong)), 0) / cap.length : null
  const hc: HieuChuan = { soCaChot: ca.size, du: ca.size >= ts.HIEU_CHUAN.soCaChot && mae != null && mae <= ts.HIEU_CHUAN.maeToiDa, mae, thienLech, soCap: cap.length }
  if (r) demHieuChuan.ghi('hc', Date.now(), hc)
  return hc
}

// ---------------------------------------------------------------- phụ huynh
/** Phần OMNI thêm vào `/ph/hoc-2` (null khi tắt / lỗi). `hs2` (tuỳ chọn) = hồ sơ srs2 phụ huynh đã đọc (đếm câu cắt tỉa khỏi đọc lại). CHỈ ĐỌC. */
/** `hs2` (chỉ-thêm, tối ưu 05/10): có thể là Promise (hồ sơ srs2 nơi gọi ĐANG đọc) — phần OMNI bắt đầu cùng lúc, chỉ chờ nó ở chỗ cần (số câu cắt tỉa).
 *  `batSan`: lời hỏi `omniBat` nơi gọi đã bắt đầu (dùng chung). */
export async function omniChoPh(env: Env, sbd: string, nowMs: number, hs2?: Pick<HoSo2, 'tt'> | Promise<Pick<HoSo2, 'tt'>>, batSan?: Promise<boolean>): Promise<PhOmni | null> {
  try {
    if (!(await (batSan ?? omniBat(env, sbd)))) return null
    const ts = await docThamSoOmni(env)
    const homNay = ngayVnCua(nowMs)
    // Tối ưu 05/10: Q các câu của bài đang luyện bắt đầu ngay khi có danh sách chiến dịch (trước: chờ thêm hồ sơ OMNI + các lượt đọc khác). Lỗi tới đúng chỗ cũ.
    const pDs = docChienDichCuaEm(env, sbd)
    const pCau = pDs.then((ds) => { const g = chienDichDangLuyen(ds, homNay)[0] ?? null; return g ? qCuaCau(env, g.qids).then((m) => [...m.values()]) : [] })
    pCau.catch(() => {})
    const [ds, hs, hc, cc, nutThat, tt] = await Promise.all([
      pDs, hoSoOmniEm(env, sbd, nowMs), docHieuChuan(env, ts), docChungChiEm(env, sbd),
      env.DB.prepare("SELECT COUNT(*) AS n FROM nut_that WHERE sbd = ? AND trang_thai = 'cho'").bind(sbd).first<Row>().then((r) => Number(r?.n) || 0).catch(() => 0),
      hs2 ? Promise.resolve(hs2).then((h) => h.tt) : docHoSo2(env, sbd, homNay).then((h) => h.tt).catch(() => new Map<string, never>()),
    ])
    const gan = chienDichDangLuyen(ds, homNay)[0] ?? null
    const cau = gan ? await pCau : []
    let khoangCach8: number | null = null
    if (gan && hc.du && cau.length) {
      const db = duBaoDiem(hs, cau, { khung: khungTheoPhamVi(cau, ts), mucTieu: ts.MUC_TIEU }, ts)
      if (duDuLieu(db.soBangChung, ts)) khoangCach8 = lam2(ts.MUC_TIEU - db.kyVong)
    }
    const vung = gan ? dangDaVung(hs, cau, ts) : []
    const chua = dsDang(cau).filter((d) => !vung.includes(d))
    const soCauDang = new Map(chua.map((d) => [d, cau.filter((c) => c.maDang === d).length]))
    chua.sort((a, b) => soCauDang.get(b)! - soCauDang.get(a)! || (a < b ? -1 : 1))
    const ten = await tenCuaDang(env, chua).catch(() => new Map<string, string>())
    const catTia = [...tt.values()].filter((t) => t.catTia && !t.thanhThao).length
    return {
      khoangCach8,
      hieuChuan: { soCaChot: hc.soCaChot, du: hc.du },
      dangCanVung: chua.slice(0, 6).map((d) => ten.get(d) ?? 'Dạng chưa đặt tên'),
      sEm: duDuLieu(hs.nVung, ts) ? hs.sEm : null,
      chungChi: cc.map((c) => ({ ten: c.ten, doTin: c.doTin, ngay: c.ngay, diem: c.diem })),
      gioHoc: gioHocTu(hs),
      canThayChua: catTia + nutThat,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- chứng chỉ (ghi, chỉ-thêm)
async function docChienDichTheoId(env: Env, id: string): Promise<ChienDich | null> {
  if (!id) return null
  const r = await env.DB.prepare('SELECT * FROM chien_dich WHERE id = ?').bind(id).first<Row>().catch(() => null)
  return r ? ((await docChienDichKemBatDau(env, [r]))[0] ?? null) : null
}
export { docChienDichTheoId }
/** Điểm ca chốt của em: lượt NỘP ĐẦU (lan_thu nhỏ nhất) mỗi ca, ca ĐÃ công bố, chưa xoá; nhiều ca ⇒ ca nộp muộn nhất. */
export async function diemCaChot(env: Env, maCa: readonly string[], sbds: readonly string[]): Promise<Map<string, { diem: number; ngay: string; nopLuc: string; maCa: string }>> {
  const ra = new Map<string, { diem: number; ngay: string; nopLuc: string; maCa: string }>()
  if (!maCa.length || !sbds.length) return ra
  const r = await env.DB.prepare(`SELECT l.sbd, l.ma_ca, l.tong, l.nop_luc, l.lan_thu FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca
      WHERE l.ma_ca IN (SELECT value FROM json_each(?)) AND l.sbd IN (SELECT value FROM json_each(?)) AND COALESCE(l.nop_luc, '') <> '' AND l.tong IS NOT NULL
        AND COALESCE(c.trang_thai, '') <> 'da_xoa' AND ${SQL_DA_CONG_BO('c')}
      ORDER BY l.sbd, l.ma_ca, l.lan_thu`).bind(dsJson(maCa), dsJson(sbds)).all<Row>().catch(() => ({ results: [] as Row[] }))
  const dau = new Map<string, Row>()
  for (const x of r.results ?? []) { const k = `${str(x.sbd)}|${str(x.ma_ca)}`; if (!dau.has(k)) dau.set(k, x) }
  for (const x of dau.values()) {
    const s = str(x.sbd), nop = str(x.nop_luc)
    const cu = ra.get(s)
    if (!cu || nop > cu.nopLuc) ra.set(s, { diem: Number(x.tong), ngay: ngayVn(nop) || nop.slice(0, 10), nopLuc: nop, maCa: str(x.ma_ca) })
  }
  return ra
}
/** Nhịp thật (câu/ngày) của từng em trên CUA_SO_NHIP_NGAY ngày gần nhất (tối thiểu 1). */
async function nhipNgayNhieuEm(env: Env, sbds: readonly string[], nowMs: number): Promise<Map<string, number>> {
  const ra = new Map<string, number>()
  if (!sbds.length) return ra
  const tu = congNgay(ngayVnCua(nowMs), -CUA_SO_NHIP_NGAY)
  const cau = (moi: boolean) => `SELECT sbd, COUNT(*) AS n FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn > ? AND ket_qua IS NOT NULL
      ${moi ? "AND COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot') AND COALESCE(visibility, '') <> 'embargoed'" : ''} GROUP BY sbd`
  let rows: Row[]
  try { rows = (await env.DB.prepare(cau(true)).bind(dsJson(sbds), tu).all<Row>()).results ?? [] } catch {
    rows = (await env.DB.prepare(cau(false)).bind(dsJson(sbds), tu).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
  }
  for (const x of rows) ra.set(str(x.sbd), Math.max(1, (Number(x.n) || 0) / CUA_SO_NHIP_NGAY))
  return ra
}
/**
 * CHỨNG CHỈ "Sẵn sàng 8+" của một chiến dịch (bài): mỗi em chưa có chứng chỉ mà đã có điểm ca chốt (ca đã công bố) ⇒ K∧C∧M từ hồ sơ + T từ điểm ca chốt
 * (`xetChungChi`); đạt ⇒ INSERT OR IGNORE `omni_chung_chi` (chỉ-thêm — đã cấp không thu lại). `cap_luc` = lúc nộp ca chốt (tất định).
 * Gọi lười ở Bảng bài của thầy và ở việc đêm.
 */
export async function capNhatChungChi(env: Env, chienDichId: string, nowMs: number, cdSan?: ChienDich | null): Promise<{ ok: boolean; soEm: number; daCap: number; error?: string }> {
  await damBaoBangOmni(env)
  // `cdSan` (chỉ-thêm, tối ưu 05/10): chiến dịch nơi gọi (Bảng bài) VỪA đọc ⇒ khỏi đọc lại (trước: hai đợt).
  const cd = cdSan && cdSan.id === chienDichId ? cdSan : await docChienDichTheoId(env, chienDichId)
  if (!cd) return { ok: false, soEm: 0, daCap: 0, error: 'Không tìm thấy chiến dịch.' }
  const ca = await env.DB.prepare('SELECT ma_ca FROM omni_ca_chot WHERE chien_dich_id = ? ORDER BY luc').bind(cd.id).all<Row>().catch(() => ({ results: [] as Row[] }))
  const maCa = (ca.results ?? []).map((x) => str(x.ma_ca)).filter(Boolean)
  if (!maCa.length) return { ok: true, soEm: 0, daCap: 0 }
  const [diem, daCo] = await Promise.all([
    diemCaChot(env, maCa, cd.sbd),
    env.DB.prepare('SELECT sbd FROM omni_chung_chi WHERE chien_dich_id = ?').bind(cd.id).all<Row>().then((r) => new Set((r.results ?? []).map((x) => str(x.sbd)))).catch(() => new Set<string>()),
  ])
  const ung = cd.sbd.filter((s) => diem.has(s) && !daCo.has(s))
  if (!ung.length) return { ok: true, soEm: 0, daCap: 0 }
  const ts = await docThamSoOmni(env)
  const [hsMap, qMap, nhip] = await Promise.all([hoSoOmniNhieuEm(env, ung, nowMs), qCuaCau(env, cd.qids), nhipNgayNhieuEm(env, ung, nowMs)])
  const cau = [...qMap.values()]
  const khung = khungTheoPhamVi(cau, ts)
  const lenh: ReturnType<Env['DB']['prepare']>[] = []
  for (const s of ung) {
    const hs = hsMap.get(s)!
    const d = diem.get(s)!
    const db = duBaoDiem(hs, cau, { khung, mucTieu: ts.MUC_TIEU }, ts)
    const k = xetChungChi(hs, cau, db, { diem: d.diem, ngay: d.ngay }, nhip.get(s) ?? 1, ts)
    if (!k.dat) continue
    lenh.push(env.DB.prepare('INSERT OR IGNORE INTO omni_chung_chi (sbd, chien_dich_id, cap_luc, do_tin, diem_ca_chot, ma_ca) VALUES (?,?,?,?,?,?)')
      .bind(s, cd.id, d.nopLuc, Math.max(0, Math.min(1, k.doTin)), d.diem, d.maCa))
  }
  let daCap = 0
  for (let i = 0; i < lenh.length; i += LENH_MOI_GOI) for (const r of await env.DB.batch(lenh.slice(i, i + LENH_MOI_GOI))) daCap += Number(r.meta?.changes ?? 0)
  return { ok: true, soEm: ung.length, daCap }
}

// ---------------------------------------------------------------- việc đêm
interface ConTroDem { ngay: string; buoc: 'beta' | 'em' | 'chung_chi' | 'xong'; sbdCuoi: string; xong: boolean; loi: number }
async function docConTro(env: Env): Promise<ConTroDem | null> {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CON_TRO_DEM).first<Row>().catch(() => null)
  if (!r) return null
  try {
    const o = JSON.parse(str(r.gia_tri)) as Partial<ConTroDem>
    const buoc = (['beta', 'em', 'chung_chi', 'xong'] as const).includes(o.buoc as ConTroDem['buoc']) ? (o.buoc as ConTroDem['buoc']) : 'beta'
    return { ngay: str(o.ngay), buoc, sbdCuoi: str(o.sbdCuoi), xong: o.xong === true, loi: Number(o.loi) || 0 }
  } catch {
    return null
  }
}
async function ghiConTro(env: Env, ct: ConTroDem, nowMs: number): Promise<void> {
  await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(KHOA_CON_TRO_DEM, JSON.stringify(ct), new Date(nowMs).toISOString()).run()
}
/** β mọi câu: trung vị thời gian các lượt ĐÚNG tự làm có `raw_json.ms` trong 60 ngày (≥ BETA_MAU_TOI_THIEU mẫu — `betaTuMau`). Thay TOÀN BỘ bảng đệm. */
export async function tinhBetaMoiCau(env: Env, nowMs: number, ts: ThamSoOmni = THAM_SO_OMNI): Promise<number> {
  const tu = new Date(nowMs - CUA_SO_BETA_NGAY * MOT_NGAY_MS).toISOString()
  const r = await env.DB.prepare(`SELECT qid, CASE WHEN json_valid(raw_json) THEN json_extract(raw_json, '$.ms') END AS ms FROM su_kien_hoc
      WHERE luc >= ? AND ket_qua = 1 AND COALESCE(assistance, 'none') IN ('none', '') AND COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot')
        AND COALESCE(visibility, '') <> 'embargoed' AND raw_json LIKE '%"ms"%'`).bind(tu).all<Row>()
  const theoQid = new Map<string, number[]>()
  for (const x of r.results ?? []) {
    const ms = Number(x.ms)
    if (x.ms == null || !Number.isFinite(ms) || ms <= 0 || ms > ts.MS_TOI_DA) continue
    const g = tachSongSinh(str(x.qid)).goc
    let a = theoQid.get(g)
    if (!a) { a = []; theoQid.set(g, a) }
    a.push(ms)
  }
  const moc = new Date(nowMs).toISOString().slice(0, 10)
  const lenh: ReturnType<Env['DB']['prepare']>[] = [env.DB.prepare('DELETE FROM omni_beta_cau')]
  let so = 0
  for (const g of [...theoQid.keys()].sort()) {
    const ds = theoQid.get(g)!.sort((a, b) => a - b)
    const b = betaTuMau(ds, ts)
    if (b == null || !Number.isFinite(b)) continue
    lenh.push(env.DB.prepare('INSERT OR REPLACE INTO omni_beta_cau (qid, beta, n, cap_nhat_luc) VALUES (?,?,?,?)').bind(g, b, ds.length, moc))
    so++
  }
  // Một giao dịch cho mỗi gói; gói đầu có DELETE ⇒ bảng không bao giờ "rỗng giữa chừng" lâu hơn một gói.
  for (let i = 0; i < lenh.length; i += LENH_MOI_GOI) await env.DB.batch(lenh.slice(i, i + LENH_MOI_GOI))
  return so
}
/** Em đang bật OMNI (theo SBD tăng dần) sau `sau`, tối đa `n`. */
async function loEmBatOmni(env: Env, sau: string, n: number): Promise<{ ds: string[]; conNua: boolean }> {
  const [coO, coH, r] = await Promise.all([
    docCoOmni(env), docCoHoa2(env),
    env.DB.prepare("SELECT sbd, lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'").all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const lop = new Map((r.results ?? []).map((x) => [str(x.sbd), str(x.lop).trim() || null]))
  for (const s of [...coO.sbd, ...coH.sbd]) if (!lop.has(s)) lop.set(s, null)
  const tat = [...lop.keys()].filter((s) => s && apDungOmniCho(coH, coO, s, lop.get(s) ?? null)).sort()
  const sauDo = tat.filter((s) => s > sau)
  return { ds: sauDo.slice(0, n), conNua: sauDo.length > n }
}
/** Chụp hồ sơ THÔ (prior P0, sổ tiếp nhận trước 00:00 VN ngày `homNay`) của một lô em vào `omni_em`/`omni_p_vkn` (giá trị bind trực tiếp — không lệch số thực). */
export async function chupHoSoTho(env: Env, sbds: readonly string[], homNay: string, ts: ThamSoOmni = THAM_SO_OMNI): Promise<number> {
  if (!sbds.length) return 0
  const moc = dauNgayVn(homNay)
  const m = await dungHoSoNoi(env, sbds, { truocMs: Date.parse(moc), coPrior: false, homNay, ts })
  const lenh: ReturnType<Env['DB']['prepare']>[] = [
    env.DB.prepare('DELETE FROM omni_p_vkn WHERE sbd IN (SELECT value FROM json_each(?))').bind(dsJson(sbds)),
    env.DB.prepare('DELETE FROM omni_em WHERE sbd IN (SELECT value FROM json_each(?))').bind(dsJson(sbds)),
  ]
  for (const s of sbds) {
    const hs = m.get(s)?.hs ?? hoSoRong(s, homNay, ts)
    lenh.push(env.DB.prepare(`INSERT OR REPLACE INTO omni_em (sbd, n_vung, n_sai_vung, s_uoc, tau, n_tau, khung_gio_json, gio_hoc, muc_tieu, cursor, phien_ban, cap_nhat_luc)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(s, hs.nVung, hs.nSaiVung, hs.sEm, hs.tau, hs.nTau, JSON.stringify(hs.khungGio), gioHocTu(hs), ts.MUC_TIEU, hs.cursor || null, hs.phienBan || PHIEN_BAN_OMNI, moc))
    for (const k of Object.keys(hs.vkn).sort()) {
      const v = hs.vkn[k]!
      lenh.push(env.DB.prepare(`INSERT OR REPLACE INTO omni_p_vkn (sbd, vkn_id, p, n_tu_lam, n_cau, n_ngay, n_troi_chay, n_cau_la_dung, diem_sprt, trang_thai, day_lai, phien_ban, cap_nhat_luc)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(s, k, v.p, v.nTuLam, v.nCau, v.nNgay, v.nTroiChay, v.nCauLaDung, v.diemSprt, v.trangThai, v.dayLai ? 1 : 0, hs.phienBan || PHIEN_BAN_OMNI, moc))
    }
  }
  for (let i = 0; i < lenh.length; i += LENH_MOI_GOI) await env.DB.batch(lenh.slice(i, i + LENH_MOI_GOI))
  return sbds.length
}
/**
 * Việc đêm (cron 00:01 VN; cron mỗi phút gọi tiếp tới khi `xong`): (1) β mọi câu ⇒ `omni_beta_cau`; (2) chụp hồ sơ THÔ các em đang bật OMNI theo lô
 * ≤ SO_EM_MOT_LUOT_DEM em/lượt (con trỏ `cau_hinh.omni_dem_con_tro`); (3) chứng chỉ lười của các chiến dịch có ca chốt 30 ngày qua.
 * Idempotent theo ngày (đã xong ⇒ trả ngay; chạy lại cùng ngày ra cùng bảng). KHÔNG BAO GIỜ ném lỗi (lỗi 3 lần/ngày ⇒ dừng tới đêm sau).
 */
export async function chayOmniDem(env: Env, nowMs: number): Promise<{ soEm: number; soBeta: number; xong: boolean }> {
  const homNay = ngayVnCua(nowMs)
  let ct: ConTroDem = { ngay: homNay, buoc: 'beta', sbdCuoi: '', xong: false, loi: 0 }
  try {
    // Công tắc tắt ⇒ KHÔNG ghi gì (kể cả con trỏ, bảng): máy chủ y hệt khi chưa có OMNI. Cờ đọc qua đệm 15 s.
    if (!(await docCoOmni(env)).bat) return { soEm: 0, soBeta: 0, xong: true }
    const cu = await docConTro(env)
    if (cu && cu.ngay === homNay) {
      if (cu.xong) return { soEm: 0, soBeta: 0, xong: true }
      ct = cu
    }
    await damBaoBangOmni(env)
    const ts = await docThamSoOmni(env)
    let soBeta = 0, soEm = 0
    if (ct.buoc === 'beta') {
      soBeta = await tinhBetaMoiCau(env, nowMs, ts)
      ct = { ...ct, buoc: 'em', sbdCuoi: '' }
      xoaDemOmni()
    }
    if (ct.buoc === 'em') {
      const lo = await loEmBatOmni(env, ct.sbdCuoi, SO_EM_MOT_LUOT_DEM)
      if (lo.ds.length) { soEm = await chupHoSoTho(env, lo.ds, homNay, ts); ct = { ...ct, sbdCuoi: lo.ds[lo.ds.length - 1]! } }
      if (!lo.conNua) ct = { ...ct, buoc: 'chung_chi', sbdCuoi: '' }
      await ghiConTro(env, ct, nowMs) // giữ tiến độ lô vừa chụp dù bước sau lỗi
    }
    // Chứng chỉ chạy NGAY trong lượt chụp xong lô cuối (cron chỉ gọi một lần/đêm vẫn đủ ba bước khi ≤ SO_EM_MOT_LUOT_DEM em).
    if (ct.buoc === 'chung_chi') {
      const tu = new Date(nowMs - 30 * MOT_NGAY_MS).toISOString()
      const r = await env.DB.prepare('SELECT DISTINCT chien_dich_id FROM omni_ca_chot WHERE luc >= ? ORDER BY chien_dich_id').bind(tu).all<Row>().catch(() => ({ results: [] as Row[] }))
      for (const x of r.results ?? []) await capNhatChungChi(env, str(x.chien_dich_id), nowMs).catch(() => null)
      ct = { ...ct, buoc: 'xong', xong: true }
    }
    await ghiConTro(env, ct, nowMs)
    return { soEm, soBeta, xong: ct.xong }
  } catch (e) {
    console.error('[omni-dem] lỗi:', e instanceof Error ? e.message : String(e))
    try {
      const loi = (ct.ngay === homNay ? ct.loi : 0) + 1
      await ghiConTro(env, { ...ct, loi, ...(loi >= 3 ? { buoc: 'xong' as const, xong: true } : {}) }, nowMs)
    } catch { /* không ném */ }
    return { soEm: 0, soBeta: 0, xong: false }
  }
}

// ---------------------------------------------------------------- hiệu chỉnh tuần
/**
 * Thuần: T theo dạng từ chuỗi quan sát (mỗi em, mỗi dạng, lần làm đầu mỗi câu mỗi ngày, tự làm): tỉ lệ "sai ⇒ lượt kế ĐÚNG", kẹp [T_MIN, T_MAX];
 * dạng < 30 lượt sai ⇒ không đề xuất. T chung = gộp mọi dạng (≥ 100 lượt sai), không thì null.
 */
export function uocTTheoDang(quanSat: readonly { sbd: string; maDang: string; dung: boolean; thuTu: number }[], ts: ThamSoOmni = THAM_SO_OMNI): { theoDang: Record<string, number>; chung: number | null; nSai: number } {
  const chuoi = new Map<string, { dung: boolean; thuTu: number }[]>()
  for (const q of quanSat) { const k = `${q.sbd}|${q.maDang}`; chuoi.set(k, [...(chuoi.get(k) ?? []), q]) }
  const dem = new Map<string, { sai: number; saiDung: number }>()
  for (const [k, ds] of chuoi) {
    const d = k.slice(k.indexOf('|') + 1)
    ds.sort((a, b) => a.thuTu - b.thuTu)
    for (let i = 0; i + 1 < ds.length; i++) {
      if (ds[i]!.dung) continue
      const o = dem.get(d) ?? { sai: 0, saiDung: 0 }
      o.sai++
      if (ds[i + 1]!.dung) o.saiDung++
      dem.set(d, o)
    }
  }
  const kep = (x: number) => Math.min(ts.T_MAX, Math.max(ts.T_MIN, x))
  const theoDang: Record<string, number> = {}
  let sai = 0, saiDung = 0
  for (const [d, o] of [...dem].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    sai += o.sai; saiDung += o.saiDung
    if (o.sai >= 30) theoDang[d] = lam2(kep(o.saiDung / o.sai))
  }
  return { theoDang, chung: sai >= 100 ? lam2(kep(saiDung / sai)) : null, nSai: sai }
}
/**
 * Hiệu chỉnh tuần (đêm thứ Hai): S0 gộp từ lượt vững của ảnh chụp hồ sơ (co về S0 cũ 50 lượt ảo, trong (0; 0,5) và 1 − S ≥ G) · T theo dạng (tỉ lệ sai ⇒ đúng
 * ở lượt kế, 7 ngày, kẹp [T_MIN, T_MAX]) · MAE + thiên lệch dự báo ca chốt. Ghi `cau_hinh.omni_tham_so` + một dòng `v2_hieu_chinh` (tuan = 'omni:' + thứ Hai).
 * Idempotent theo tuần; công tắc OMNI tắt ⇒ không làm gì. Không ném lỗi.
 */
export async function hieuChinhOmniTuan(env: Env, nowMs: number): Promise<Record<string, unknown>> {
  const thuHai = thuHaiCua(ngayVnCua(nowMs))
  const tuan = `omni:${thuHai}`
  try {
    if (!(await docCoOmni(env)).bat) return { ok: true, tuan, boQua: 'omni_tat' } // công tắc tắt ⇒ không ghi tham số, không thêm dòng nhật ký
    await damBaoBangTuHoanThien(env)
    await damBaoBangOmni(env)
    const daCo = await env.DB.prepare('SELECT 1 AS c FROM v2_hieu_chinh WHERE tuan = ?').bind(tuan).first<Row>().catch(() => null)
    if (daCo) return { ok: true, tuan, boQua: 'da_chay' }
    const rCu = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_THAM_SO_OMNI).first<Row>().catch(() => null)
    const tsCu = thamSoTu(rCu?.gia_tri)
    let cu: Row = {}
    try { cu = rCu?.gia_tri ? (JSON.parse(str(rCu.gia_tri)) as Row) : {} } catch { cu = {} }
    // S0 gộp từ lượt vững (ảnh chụp mới nhất của mỗi em)
    const s = await env.DB.prepare('SELECT COALESCE(SUM(n_vung), 0) AS v, COALESCE(SUM(n_sai_vung), 0) AS sv FROM omni_em WHERE phien_ban = ?').bind(PHIEN_BAN_OMNI).first<Row>().catch(() => null)
    const nVung = Number(s?.v) || 0, nSaiVung = Number(s?.sv) || 0
    const gMax = Math.max(THAM_SO_OMNI.G.I, THAM_SO_OMNI.G.Y, THAM_SO_OMNI.G.III)
    let S0 = tsCu.S0
    if (nVung >= 100) S0 = Math.round(Math.min(0.49, 1 - gMax, Math.max(0.01, (nSaiVung + tsCu.S0 * 50) / (nVung + 50))) * 10_000) / 10_000
    // T theo dạng (7 ngày gần nhất, em đang bật OMNI)
    const tu = congNgay(ngayVnCua(nowMs), -7)
    let rows: Row[] = []
    try {
      rows = (await env.DB.prepare(`SELECT sbd, qid, ma_dang, ket_qua, ngay_vn, received_at, luc, khoa FROM su_kien_hoc
          WHERE ngay_vn >= ? AND ket_qua IS NOT NULL AND COALESCE(ma_dang, '') <> '' AND COALESCE(assistance, 'none') IN ('none', '')
            AND COALESCE(purpose, '') NOT IN ('xem_loi_giai', 'luot') AND COALESCE(visibility, '') <> 'embargoed'`).bind(tu).all<Row>()).results ?? []
    } catch { rows = [] }
    const [coO, coH] = await Promise.all([docCoOmni(env), docCoHoa2(env)])
    const lopR = await env.DB.prepare('SELECT sbd, lop FROM hoc_sinh').all<Row>().catch(() => ({ results: [] as Row[] }))
    const lop = new Map((lopR.results ?? []).map((x) => [str(x.sbd), str(x.lop).trim() || null]))
    const daThay = new Set<string>()
    const quanSat: { sbd: string; maDang: string; dung: boolean; thuTu: number }[] = []
    rows.sort((a, b) => thoiDiemTiepNhan(a) - thoiDiemTiepNhan(b) || (str(a.khoa) < str(b.khoa) ? -1 : 1))
    rows.forEach((x, i) => {
      const sb = str(x.sbd)
      if (!apDungOmniCho(coH, coO, sb, lop.get(sb) ?? null)) return
      const k = `${sb}|${tachSongSinh(str(x.qid)).goc}|${str(x.ngay_vn)}`
      if (daThay.has(k)) return // một quan sát / câu / ngày
      daThay.add(k)
      quanSat.push({ sbd: sb, maDang: str(x.ma_dang), dung: Number(x.ket_qua) === 1, thuTu: i })
    })
    const t = uocTTheoDang(quanSat, tsCu)
    const hc = await docHieuChuan(env, tsCu).catch(() => null)
    const moi = {
      S0, ...(t.chung != null ? { T: t.chung } : cu.T != null ? { T: tsCu.T } : {}), tTheoDang: t.theoDang,
      mae: hc?.mae != null ? lam2(hc.mae) : null, thienLech: hc?.thienLech != null ? lam2(hc.thienLech) : null, soCaChot: hc?.soCaChot ?? 0,
      tuan: thuHai, luc: new Date(nowMs).toISOString(),
    }
    const luc = new Date(nowMs).toISOString()
    await env.DB.batch([
      env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
        .bind(KHOA_THAM_SO_OMNI, JSON.stringify(moi), luc),
      env.DB.prepare('INSERT OR IGNORE INTO v2_hieu_chinh (tuan, n_kiem, n_sai_lai, ty_le, tham_so_cu, tham_so_moi, luc) VALUES (?,?,?,?,?,?,?)')
        .bind(tuan, nVung, nSaiVung, S0, JSON.stringify({ S0: tsCu.S0, T: tsCu.T, tTheoDang: cu.tTheoDang ?? {} }), JSON.stringify(moi), luc),
    ])
    xoaDemOmni()
    return { ok: true, tuan, S0, T: moi.T ?? tsCu.T, tTheoDang: t.theoDang, nVung, nSaiVung, nSai: t.nSai, mae: moi.mae, thienLech: moi.thienLech, soCaChot: moi.soCaChot }
  } catch (e) {
    return { ok: false, tuan, error: e instanceof Error ? e.message : String(e) }
  }
}
