// LỚP D1 CỦA EXP HỌC TẬP + MẢNH KHIÊN (DE-XUAT-EXP-MANH-KHIEN-1909.md, thầy chốt "Chốt. Quá thông minh").
//
// MỘT hàm gốc, `capNhatExp(env, sbd, now, tuyChon)`: đọc sổ `su_kien_hoc` + các bảng phụ, gọi hàm THUẦN `tinhExp`, ghi khoản MỚI vào `exp_so`/
// `manh_khien_so` (idempotent bằng khoá chính), rồi cộng phần chênh vào hồ sơ game bằng CAS. Không có đường EXP thứ hai: mọi nơi ghi sổ chỉ việc gọi
// hàm này sau khi ghi sổ; gọi lại bao nhiêu lần, gọi chồng nhau, cũng không cộng trùng (khoá) và không sót (tổng luỹ kế).
//
// CỜ (bảng `cau_hinh`, khoá `exp_moi`, JSON `{"tu":"<ISO>","dsSbd":["12121212"],"toanBo":false}`): KHÔNG có dòng cấu hình = TẮT với mọi em, hành vi y như
// trước. `dsSbd` bật riêng vài em (thầy 12121212 kiểm trước), `toanBo:true` mở cho mọi em. `tu` là MỐC chuyển tiếp: sự kiện trước `tu` giữ như đã trả
// theo luật cũ, không tính lại.
//
// KHÔNG BAO GIỜ NÉM LỖI: EXP hỏng thì lượt nộp bài vẫn thành công (sổ là nguồn sự thật, lần gọi sau tự bắt kịp).
import { emCoGhi } from './dem-ke-hoach'
import { LAN_MOI_LUOT } from './btvn-nang-do-chang'
import type { D1PreparedStatement, Env } from './kieu'
import { DemTTL } from './dem-chung'
import { gameIdentity } from './game-v2-auth'
import { chuyenTrangThaiTrongNgay } from './exp-chuyen-trang-thai'
import { EXP_MOI_TU, EXP_TIEP_SUC, MANH_MOI_KHIEN, SQL_KHIEN_MOC, SQL_SO_MANH_TINH, TIEP_SUC_TOI_DA_NGAY, bangGiaExp } from './exp-cau-hinh'
import { congManh, NGUON_EXP_CAU, tinhExp, type KhoanExp, type KhoanManh, type MetaCauExp, type VaoTinhExp } from './exp-hoc-tap'
import { congTongSoVaoHoSo, khienConLai, khienRenChuaDung, type DaCong, type HoSoGameExp } from './exp-ho-so-game'
import { NGAN_SACH_SAN, TOI_THIEU_CAU_SAN } from './ho-so-cau-hinh'
import type { SuKienDoc } from './ho-so-nam-kt'
import { traCuuTheoQid } from './ho-so-nam-kt'
import { docNgayNghi, hsKeHoachNgay, lapVaLuuKeHoach } from './ke-hoach-ngay-d1'
import { docHapThuChoEm, nhanExpGame } from './game-v2-hap-thu'
import type { Profile } from './game-v2'
import { tinhDatNhiemVuNgay } from '../../src/lib/dat-nhiem-vu-ngay'
import { cuaP08Mo, ghiManhQuaP08 } from './cnh-exp-adapter'
import type { ThieuDat } from '../../src/lib/dat-nhiem-vu-ngay'
import { ngayVn } from './su-kien-hoc'

const MOT_NGAY_MS = 86_400_000
/** Ca thi công bố muộn: chỉ dò lại các lượt nộp trong ngần này ngày (lượt điểm 0 không bao giờ sinh khoản nên không được dò mãi). */
const NGAY_DO_LAI_CA = 14
const DONG_MOI_LENH = 60

const json = (v: unknown) => JSON.stringify(v)
const themNgay = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) + n * MOT_NGAY_MS).toISOString().slice(0, 10)
const chunk = <T>(a: T[], n: number): T[][] => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))
const ms = (iso: string): number => Date.parse(iso) || 0

/** Chạy một truy vấn; bảng/cột chưa có (chưa chạy migration) → giá trị dự phòng; lỗi khác vẫn ghi log rồi dùng dự phòng. */
async function an<T>(f: () => Promise<T>, dpr: T): Promise<T> {
  try {
    return await f()
  } catch (e) {
    if (!/no such (table|column)/i.test(e instanceof Error ? e.message : String(e))) console.error('[exp] truy vấn lỗi:', e)
    return dpr
  }
}

// --- Cờ -----------------------------------------------------------------------------------------

export interface CauHinhExp {
  tu: string | null
  dsSbd: string[]
  toanBo: boolean
  /** Mốc RIÊNG của các em trong `dsSbd` (mặc định = `tu`): để em thử (12121212) giữ mốc sớm trong khi `toanBo` mở cho cả trường ở mốc `tu` muộn hơn. */
  tuDsSbd: string | null
}

const TAT: CauHinhExp = { tu: null, dsSbd: [], toanBo: false, tuDsSbd: null }

export async function docCauHinhExp(env: Env): Promise<CauHinhExp> {
  const r = await an(() => env.DB.prepare("SELECT gia_tri FROM cau_hinh WHERE khoa = 'exp_moi'").first<{ gia_tri: string }>(), null)
  if (!r) return EXP_MOI_TU ? { tu: EXP_MOI_TU, dsSbd: [], toanBo: true, tuDsSbd: null } : TAT
  try {
    const o = JSON.parse(String(r.gia_tri)) as Record<string, unknown>
    // Chuẩn hoá về ISO UTC: mọi chỗ so `luc >= tu` là so CHUỖI, nên `tu` viết kiểu `+07:00` sẽ so sai.
    const tu = typeof o.tu === 'string' && Number.isFinite(Date.parse(o.tu)) ? new Date(o.tu).toISOString() : null
    const ds = Array.isArray(o.dsSbd) ? o.dsSbd.map((x) => String(x).trim()).filter(Boolean) : []
    const tuDs = typeof o.tuDsSbd === 'string' && Number.isFinite(Date.parse(o.tuDsSbd)) ? new Date(o.tuDsSbd).toISOString() : null
    return { tu, dsSbd: ds, toanBo: o.toanBo === true, tuDsSbd: tuDs }
  } catch {
    return TAT // cấu hình hỏng → TẮT, không đoán
  }
}

/** Mốc `tu` nếu EXP mới đang BẬT cho em này lúc `nowMs`; ngược lại null. */
export function mocExpCuaEm(cfg: CauHinhExp, sbd: string, nowMs: number): string | null {
  const rieng = cfg.dsSbd.includes(sbd) ? (cfg.tuDsSbd ?? cfg.tu) : null
  if (rieng && ms(rieng) <= nowMs) return rieng
  if (cfg.toanBo && cfg.tu && ms(cfg.tu) <= nowMs) return cfg.tu
  return null
}

// --- Đọc đầu vào --------------------------------------------------------------------------------

interface DongSo extends SuKienDoc {
  maNguon: string
  lan: number
}

async function docSo(env: Env, sbd: string): Promise<DongSo[]> {
  const r = await an(
    () => env.DB.prepare(
      `SELECT khoa, qid, nguon, ma_nguon, lan, ket_qua, giay, luc, ngay_vn, ma_dang, chuyen_de FROM su_kien_hoc WHERE sbd = ? ORDER BY luc, khoa`,
    ).bind(sbd).all<Record<string, unknown>>(),
    null,
  )
  return (r?.results ?? []).map((x) => ({
    khoa: String(x.khoa), sbd, qid: String(x.qid), nguon: String(x.nguon), maNguon: String(x.ma_nguon), lan: Number.isFinite(Number(x.lan)) ? Number(x.lan) : 1, // 0 là chỉ số lô hợp lệ (btvn_lo: lan = chỉ số lô 0-based)
    ketQua: x.ket_qua === null || x.ket_qua === undefined ? null : Number(x.ket_qua) === 1 ? 1 : 0,
    giay: x.giay === null || x.giay === undefined ? null : Number(x.giay), luc: String(x.luc), ngayVn: String(x.ngay_vn),
    maDang: x.ma_dang ? String(x.ma_dang) : null, chuyenDe: String(x.chuyen_de ?? ''),
  }))
}

interface LuotCongBo {
  maCa: string
  tenCa: string
  lanThu: number
  nopLuc: string
  diem: number
}

/** Lượt ca thi ĐÃ CÔNG BỐ (đúng luật cũ trong `syncAcademic`): công bố ngay, hoặc công bố khi cả lớp xong / ca đã đóng. Lấy MỌI lượt (kể cả trước mốc): lịch sử vẫn cần cho phát lại hồ sơ. */
async function docLuotCongBo(env: Env, sbd: string): Promise<LuotCongBo[]> {
  const r = await an(
    () => env.DB.prepare(
      `SELECT l.ma_ca, c.ten_ca, l.lan_thu, l.nop_luc, l.diem_i, l.diem_ii, l.diem_iii FROM luot l JOIN ca c ON c.ma_ca = l.ma_ca
        WHERE l.sbd = ? AND l.trang_thai IN ('da_nop','khoa') AND c.trang_thai <> 'da_xoa'
          AND (c.cong_bo = 'ngay' OR (c.cong_bo = 'ca_lop_xong' AND (c.trang_thai = 'dong' OR NOT EXISTS (SELECT 1 FROM luot x WHERE x.ma_ca = c.ma_ca AND x.trang_thai <> 'da_nop'))))
        ORDER BY l.nop_luc`,
    ).bind(sbd).all<Record<string, unknown>>(),
    null,
  )
  return (r?.results ?? []).map((x) => ({
    maCa: String(x.ma_ca), tenCa: String(x.ten_ca ?? '').trim(), lanThu: Number(x.lan_thu) || 1, nopLuc: String(x.nop_luc),
    diem: Number(x.diem_i) + Number(x.diem_ii) + Number(x.diem_iii),
  }))
}

interface KeHoachLuu {
  ngay: string
  mucTieuCau: number
  toiThieuCau: number
  soCauToiHan: number
  treNhip: boolean
  laNghi: boolean
  /** `btvn_lo:<ma>:<chiSo>` → hạn mềm (= mốc lô kế, hoặc hạn nộp nếu là lô cuối) trong bản kế hoạch ĐÃ LƯU. */
  hanMemLo: Map<string, string>
}

/** Kế hoạch ngày đã lưu của em trong vài ngày gần đây (mới nhất trước). */
async function docKeHoachLuu(env: Env, sbd: string, tuNgay: string): Promise<KeHoachLuu[]> {
  const r = await an(
    () => env.DB.prepare('SELECT ngay, ngan_sach_json, viec_json, la_ngay_nghi FROM ke_hoach_ngay WHERE sbd = ? AND ngay >= ? ORDER BY ngay DESC').bind(sbd, tuNgay).all<Record<string, unknown>>(),
    null,
  )
  const ra: KeHoachLuu[] = []
  for (const x of r?.results ?? []) {
    try {
      const ns = JSON.parse(String(x.ngan_sach_json)) as { mucTieuCau?: number; toiThieuCau?: number }
      const v = JSON.parse(String(x.viec_json)) as { viec?: { id?: string; hanMem?: string | null }[]; tienBo?: { soCauToiHan?: number; treNhip?: boolean } }
      const han = new Map<string, string>()
      for (const it of v.viec ?? []) if (typeof it.id === 'string' && it.id.startsWith('btvn_lo:') && typeof it.hanMem === 'string') han.set(it.id, it.hanMem)
      ra.push({
        ngay: String(x.ngay), mucTieuCau: Number(ns.mucTieuCau) || NGAN_SACH_SAN, toiThieuCau: Number(ns.toiThieuCau) || TOI_THIEU_CAU_SAN,
        soCauToiHan: Number(v.tienBo?.soCauToiHan) || 0, treNhip: v.tienBo?.treNhip === true, laNghi: Number(x.la_ngay_nghi) === 1, hanMemLo: han,
      })
    } catch { /* bản lưu hỏng: bỏ qua */ }
  }
  return ra
}

/** Chuỗi ngày đạt LIÊN TIẾP TRƯỚC `ngay` (đúng cách `docDauVao` dựng `lichSu`), để ngày này thành `chuỗi + 1`. */
/** Số ngày ĐẠT nhiệm vụ ngày liên tiếp TRƯỚC `ngay` (ngày nghỉ không đứt chuỗi), nhìn lại tối đa `soNgay` ngày (mặc định tối đa 10 năm; không cắt chuỗi ở cửa sổ 7 ngày điều chỉnh khối lượng). Cửa hàng phụ kiện đọc với cửa sổ dài hơn (điều kiện "cần chuỗi 14–30 ngày"). */
export async function docChuoiTruoc(env: Env, sbd: string, ngay: string, soNgay: number = 3660): Promise<number> {
  const tuNgay = themNgay(ngay, -soNgay)
  const nghi = await docNgayNghi(env)
  const r = await an(
    () => env.DB.prepare('SELECT ngay, ket_qua, la_ngay_nghi FROM ke_hoach_ngay WHERE sbd = ? AND ngay < ? AND ngay >= ? ORDER BY ngay DESC').bind(sbd, ngay, tuNgay).all<Record<string, unknown>>(),
    null,
  )
  const ketQua = new Map((r?.results ?? []).map(x => [String(x.ngay), x.ket_qua]))
  const ngayNghi = new Set([...nghi, ...(r?.results ?? []).filter(x=>Number(x.la_ngay_nghi)===1).map(x=>String(x.ngay))])
  let chuoi = 0
  for (let n = themNgay(ngay, -1); n >= tuNgay; n = themNgay(n, -1)) {
    if (ngayNghi.has(n)) continue
    if (ketQua.get(n) !== 'dat') break
    chuoi++
  }
  return chuoi
}

/** qid từng được thưởng theo LUẬT CŨ (`academic.seen`: `practice:<qid>` hoặc `exam:<ma_ca>:<qid>`), để ngày phát hành không trả đôi. */
async function docQidDaTraTheoLuatCu(env: Env, sbd: string): Promise<Set<string>> {
  const r = await an(() => env.DB.prepare("SELECT json_extract(json, '$.academic.seen') AS seen FROM game_v2_profile WHERE sbd = ?").bind(sbd).first<{ seen: string | null }>(), null)
  const ra = new Set<string>()
  if (!r?.seen) return ra
  try {
    for (const k of JSON.parse(r.seen) as unknown[]) {
      const s = String(k)
      if (s.startsWith('practice:')) ra.add(s.slice('practice:'.length))
      else if (s.startsWith('exam:')) ra.add(s.slice(s.lastIndexOf(':') + 1))
    }
  } catch { /* hồ sơ cũ hỏng: coi như chưa có khoá cũ */ }
  return ra
}

// HẠ TẢI D1 (Boss 22/09, đo Code 1: #4 tổng dòng đọc của /hs/ke-hoach-ngay — 1.917 lượt × 195 dòng). Phần/sao của MỘT
// qid gần như KHÔNG ĐỔI (chỉ đổi khi thầy sửa lại kho câu) — không phải dữ liệu an toàn/chống gian lận, sai lệch tạm
// thời chỉ làm EXP một câu tính theo phần/sao CŨ trong vài phút, tự sửa khi đệm hết hạn — ĐỆM THEO THỜI GIAN THUẦN,
// không cần móc bất hoạt. Đệm CẢ kết quả VẮNG (`null`) để qid không có phần hợp lệ không dội D1 mỗi lần.
const HAN_DEM_META_CAU_MS = 30 * 60_000
const demMetaCauTheoQid = new DemTTL<MetaCauExp | null>(HAN_DEM_META_CAU_MS, 30_000)

async function docMetaCau(env: Env, qids: string[]): Promise<Record<string, MetaCauExp>> {
  const ra: Record<string, MetaCauExp> = {}
  if (qids.length === 0) return ra
  const now = Date.now()
  const thieu = qids.filter((q) => { const c = demMetaCauTheoQid.doc(q, now); if (c === undefined) return true; if (c) ra[q] = c; return false })
  if (thieu.length === 0) return ra
  const r = await an(
    () => env.DB.prepare(
      `SELECT qid, MIN(json_extract(json, '$.phan')) AS phan, MIN(json_extract(json, '$.sao')) AS sao FROM game_v2_question
        WHERE qid IN (SELECT value FROM json_each(?)) GROUP BY qid`,
    ).bind(json(thieu)).all<Record<string, unknown>>(),
    null,
  )
  const co = new Map<string, MetaCauExp>()
  for (const x of r?.results ?? []) {
    const phan = x.phan === 'I' || x.phan === 'II' || x.phan === 'III' ? x.phan : null
    if (!phan) continue
    const sao = Number(x.sao)
    co.set(String(x.qid), { phan, sao: sao === 1 || sao === 2 ? sao : 0 })
  }
  for (const q of thieu) {
    const v = co.get(q) ?? null
    if (v) ra[q] = v
    demMetaCauTheoQid.ghi(q, now, v)
  }
  return ra
}

async function docTuNgayMua(env: Env): Promise<string> {
  const r = await an(() => env.DB.prepare("SELECT json FROM game_v2_settings WHERE key = 'season'").first<{ json: string }>(), null)
  try {
    const t = (JSON.parse(String(r?.json ?? '{}')) as { startedAt?: unknown }).startedAt
    return typeof t === 'string' && Number.isFinite(Date.parse(t)) ? t : ''
  } catch {
    return ''
  }
}

// --- Cập nhật -------------------------------------------------------------------------------------

/** Bản tóm tắt kế hoạch ngày VỪA LẬP (do `/hs/ke-hoach-ngay` truyền vào) — tươi hơn bản đã lưu. */
export interface KeHoachTom {
  nganSach: { mucTieuCau: number; toiThieuCau: number }
  tienBo: { soCauToiHan: number; treNhip: boolean }
  lanNghi: boolean
  chuoiDat: number
}

export interface TuyChonCapNhat {
  /** Ngày VN cần tính (mặc định hôm nay theo `now`). */
  ngay?: string
  kh?: KeHoachTom
}

export interface KetQuaExp {
  /** EXP mới đang bật cho em này. false ⇒ KHÔNG làm gì, KHÔNG ghi gì. */
  bat: boolean
  /** Khoản EXP vừa ghi lần gọi này (thứ tự theo `luc`). */
  khoan: KhoanExp[]
  manh: KhoanManh[]
  /** Phần vừa cộng vào hồ sơ game; null = em chưa có hồ sơ game (khoản nằm chờ) hoặc cộng lỗi (lần sau tự bắt kịp). */
  daCong: DaCong | null
  /** Ngày này còn THIẾU GÌ để "đạt nhiệm vụ ngày" (để màn không nói "đã đủ" khi EXP đạt ngày chưa về). null = chưa có kế hoạch ngày đã lưu. */
  datNgay: TrangThaiDatNgay | null
}

export type { ThieuDat }

export interface TrangThaiDatNgay {
  /** Đủ điều kiện đạt (định nghĩa của chốt ngày). */
  dat: boolean
  thieu: ThieuDat[]
  daLam: number
  toiThieu: number
  /** Khoản `dat|<ngày>` đã nằm trong sổ EXP (đã trao +20). */
  daTrao: boolean
  laNghi: boolean
}

const KHONG_BAT: KetQuaExp = { bat: false, khoan: [], manh: [], daCong: null, datNgay: null }

/**
 * Gọi SAU khi ghi sổ ở một lệnh NỘP của em: cập nhật EXP rồi trả phần đính thêm vào phản hồi. Cờ tắt → `{}` (phản hồi y hệt cũ).
 * `laNopLo` (nộp chặng/lô BTVN): lập lại kế hoạch ngày trước để gỡ `treNhip` cũ (`capNhatExpSauNopLo`). Không ném lỗi.
 */
export async function expNhanSauNop(env: Env, sbd: string, nowMs: number, tuyChon: { laNopLo?: boolean } = {}): Promise<Record<string, unknown>> {
  const k = tuyChon.laNopLo ? await capNhatExpSauNopLo(env, sbd, nowMs) : await capNhatExp(env, sbd, nowMs)
  return k.bat ? { expNhan: expNhanCuaKetQua(k), manhNhan: manhNhanCuaKetQua(k) } : {}
}

/** EXP vừa nhận, dạng gửi cho máy em: `[{loai, exp, ghiChu}]` (chữ tiếng Việt in sẵn, kèm số). */
export const expNhanCuaKetQua = (k: KetQuaExp) => k.khoan.map((x) => ({ loai: x.loai, exp: x.exp, ghiChu: x.ghiChu }))
export const manhNhanCuaKetQua = (k: KetQuaExp) => k.manh.map((x) => ({ loai: x.loai, so: x.so, ghiChu: x.ghiChu }))
export const tongExpCuaKetQua = (k: KetQuaExp) => k.khoan.reduce((t, x) => t + x.exp, 0)

const CHEN_EXP = `INSERT OR IGNORE INTO exp_so (khoa, sbd, ngay_vn, loai, qid, ma_nguon, exp, luc, ghi_chu)
  SELECT json_extract(j.value,'$.k'), json_extract(j.value,'$.s'), json_extract(j.value,'$.n'), json_extract(j.value,'$.l'), json_extract(j.value,'$.q'),
         json_extract(j.value,'$.m'), json_extract(j.value,'$.e'), json_extract(j.value,'$.t'), json_extract(j.value,'$.c')
    FROM json_each(?) j`
const CHEN_MANH = `INSERT OR IGNORE INTO manh_khien_so (khoa, sbd, ngay_vn, loai, so, luc, ghi_chu)
  SELECT json_extract(j.value,'$.k'), json_extract(j.value,'$.s'), json_extract(j.value,'$.n'), json_extract(j.value,'$.l'), json_extract(j.value,'$.o'),
         json_extract(j.value,'$.t'), json_extract(j.value,'$.c')
    FROM json_each(?) j`

/**
 * Tính và ghi EXP + mảnh khiên của em cho ngày `ngay` (mặc định hôm nay) và cho các ngày trước có ca thi vừa được công bố.
 * Gọi SAU khi đã ghi sổ. Không ném lỗi.
 */
export async function capNhatExp(env: Env, sbd: string, nowMs: number, tuyChon: TuyChonCapNhat = {}): Promise<KetQuaExp> {
  try {
    const cfg = await docCauHinhExp(env)
    const tu = mocExpCuaEm(cfg, sbd, nowMs)
    if (!tu) return KHONG_BAT
    return await capNhatCoTu(env, sbd, nowMs, tu, tuyChon)
  } catch (e) {
    console.error('[exp] cập nhật lỗi (bỏ qua, lần gọi sau tự bắt kịp):', e instanceof Error ? e.message : e)
    return { bat: true, khoan: [], manh: [], daCong: null, datNgay: null }
  }
}

/**
 * `capNhatExp` cho lệnh NỘP CHẶNG BTVN (xong lô): LẬP LẠI kế hoạch ngày của em TRƯỚC, rồi tính EXP từ kế hoạch tươi.
 * Vì sao: `tienBo.treNhip` nằm trong kế hoạch đã lưu (lập lúc em mở nhiệm vụ). Em trễ nhịp buổi sáng, nộp bù xong mà kế hoạch cũ vẫn ghi "trễ nhịp"
 * ⇒ không đạt ngày ⇒ chốt 00:01 ra `mot_phan`, đứt chuỗi (Code 1 tìm ra, Boss 21/09). Chỉ chạy khi EXP mới đang bật cho em (cờ tắt ⇒ y như cũ, không tốn truy vấn).
 * Lập lại lỗi ⇒ tính như cũ bằng kế hoạch đã lưu; KHÔNG ném lỗi (nộp đã ghi sổ rồi).
 */
export async function capNhatExpSauNopLo(env: Env, sbd: string, nowMs: number): Promise<KetQuaExp> {
  try {
    const tu = mocExpCuaEm(await docCauHinhExp(env), sbd, nowMs)
    if (!tu) return KHONG_BAT
    const kh = (await lapVaLuuKeHoach(env, [sbd], nowMs)).get(sbd)
    if (!kh) return await capNhatExp(env, sbd, nowMs)
    return await capNhatExp(env, sbd, nowMs, { kh: { nganSach: kh.nganSach, tienBo: kh.tienBo, lanNghi: kh.lanNghi, chuoiDat: kh.chuoiDat } })
  } catch (e) {
    console.error('[exp] lập lại kế hoạch sau nộp chặng lỗi (tính bằng kế hoạch đã lưu):', e instanceof Error ? e.message : e)
    return capNhatExp(env, sbd, nowMs)
  }
}

async function capNhatCoTu(env: Env, sbd: string, nowMs: number, tu: string, tuyChon: TuyChonCapNhat): Promise<KetQuaExp> {
  const homNay = tuyChon.ngay ?? ngayVn(nowMs)
  const soTho = await docSo(env, sbd)
  const luot = await docLuotCongBo(env, sbd)

  // Sự kiện ca thi CHỈ tính khi ca đã công bố (đúng luật cũ): chưa công bố mà có EXP theo từng câu là lộ câu nào đúng. NGOẠI LỆ (reset toàn app giữ sổ, xoá ca): sự kiện `thi` của ca
  // KHÔNG CÒN trong bảng `ca` coi là ĐÃ công bố — không bị ẩn vĩnh viễn khỏi lịch sử (lên bậc, khắc phục, dạng yếu). Không đọc được bảng `ca` thì coi mọi ca còn (đóng cửa, không lộ).
  const congBo = new Set(luot.map((l) => `${l.maCa}|${l.lanThu}`))
  const maCaThi = [...new Set(soTho.filter((e) => e.nguon === 'thi').map((e) => e.maNguon))]
  let caConTai = new Set<string>(maCaThi)
  if (maCaThi.length > 0) {
    const rc = await an(() => env.DB.prepare('SELECT ma_ca FROM ca WHERE ma_ca IN (SELECT value FROM json_each(?))').bind(json(maCaThi)).all<{ ma_ca: string }>(), null)
    if (rc) caConTai = new Set((rc.results ?? []).map((x) => String(x.ma_ca)))
  }
  const so = soTho.filter((e) => e.nguon !== 'thi' || !caConTai.has(e.maNguon) || congBo.has(`${e.maNguon}|${e.lan}`))

  // Ngày cần tính: ngày chính + ngày nộp của ca thi vừa được công bố muộn (chưa có khoản `diem|…`).
  const daCo = new Set<string>()
  const ngayCanTinh = new Set<string>([homNay])
  const gioiHanDoLai = new Date(nowMs - NGAY_DO_LAI_CA * MOT_NGAY_MS).toISOString()
  const cacNgay = [...ngayCanTinh]
  const khoaCu = await an(
    () => env.DB.prepare(
      `SELECT khoa FROM exp_so WHERE sbd = ? AND (ngay_vn IN (SELECT value FROM json_each(?)) OR loai IN ('lo','btvn','mom','khac_phuc','len_bang','diem_ca'))`,
    ).bind(sbd, json(cacNgay)).all<{ khoa: string }>(),
    null,
  )
  const tienTo = `${sbd}|`
  for (const x of khoaCu?.results ?? []) daCo.add(String(x.khoa).slice(tienTo.length))
  for (const l of luot) {
    if (l.nopLuc >= tu && l.nopLuc >= gioiHanDoLai && !daCo.has(`diem|${l.maCa}|${l.lanThu}`) && ngayVn(ms(l.nopLuc)) !== homNay) {
      ngayCanTinh.add(ngayVn(ms(l.nopLuc)))
    }
  }
  if (ngayCanTinh.size > 1) {
    // Đọc thêm khoá của các ngày phụ (các ngày tính thêm cần khoá `cau|…|ngày`, `bac|…|ngày`).
    const them = await an(
      () => env.DB.prepare('SELECT khoa FROM exp_so WHERE sbd = ? AND ngay_vn IN (SELECT value FROM json_each(?))').bind(sbd, json([...ngayCanTinh])).all<{ khoa: string }>(),
      null,
    )
    for (const x of them?.results ?? []) daCo.add(String(x.khoa).slice(tienTo.length))
  }
  const manhCu = await an(
    () => env.DB.prepare(`SELECT khoa FROM manh_khien_so WHERE sbd = ? AND (ngay_vn IN (SELECT value FROM json_each(?)) OR loai = 'dang')`).bind(sbd, json([...ngayCanTinh])).all<{ khoa: string }>(),
    null,
  )
  for (const x of manhCu?.results ?? []) daCo.add(String(x.khoa).slice(tienTo.length))

  const soDoc: SuKienDoc[] = so
  const tra = await traCuuTheoQid(env, [...new Set(so.filter((e) => !e.maDang || !e.chuyenDe).map((e) => e.qid))])

  // Kế hoạch ngày đã lưu (mục tiêu/tối thiểu/trễ nhịp, hạn mềm từng lô).
  const luuKh = await docKeHoachLuu(env, sbd, themNgay(homNay, -NGAY_DO_LAI_CA))
  const khHomNay = luuKh.find((k) => k.ngay === homNay)
  const kh = tuyChon.kh
  const mucTieuCau = kh?.nganSach.mucTieuCau ?? khHomNay?.mucTieuCau ?? NGAN_SACH_SAN
  const toiThieu = kh?.nganSach.toiThieuCau ?? khHomNay?.toiThieuCau
  const coKeHoach = kh !== undefined || khHomNay !== undefined
  const soCauToiHan = kh?.tienBo.soCauToiHan ?? khHomNay?.soCauToiHan ?? 0
  const treNhip = kh?.tienBo.treNhip ?? khHomNay?.treNhip ?? false
  const laNghi = kh?.lanNghi ?? khHomNay?.laNghi ?? false

  // Việc (không gắn ngày): lô BTVN xong, nộp cả bài, bài Mom xong, điểm ca. Nạp MỘT LẦN cho ngày chính; khoá chặn trả lại.
  const hanNopBtvn = new Map<string, string>()
  const maBtvnLo = [...new Set(so.filter((e) => e.nguon === 'btvn_lo' && e.ketQua !== null && e.luc >= tu).map((e) => e.maNguon))]
  const baiNopRaw = await an(
    () => env.DB.prepare(
      `SELECT be.ma_btvn, be.nop_luc, b.han_nop FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn
        WHERE be.sbd = ? AND be.nop_luc IS NOT NULL AND be.nop_luc >= ? AND b.da_xoa = 0`,
    ).bind(sbd, tu).all<Record<string, unknown>>(),
    null,
  )
  for (const x of baiNopRaw?.results ?? []) hanNopBtvn.set(String(x.ma_btvn), String(x.han_nop ?? ''))
  if (maBtvnLo.some((m) => !hanNopBtvn.has(m))) {
    const hn = await an(
      () => env.DB.prepare('SELECT ma_btvn, han_nop FROM btvn WHERE ma_btvn IN (SELECT value FROM json_each(?))').bind(json(maBtvnLo)).all<Record<string, unknown>>(),
      null,
    )
    for (const x of hn?.results ?? []) if (!hanNopBtvn.has(String(x.ma_btvn))) hanNopBtvn.set(String(x.ma_btvn), String(x.han_nop ?? ''))
  }
  const momRaw = await an(
    () => env.DB.prepare('SELECT id, submitted_at FROM mom_bai WHERE sbd = ? AND submitted_at IS NOT NULL AND submitted_at >= ?').bind(sbd, tu).all<Record<string, unknown>>(),
    null,
  )

  // Lô BTVN xong: một lô = các dòng sổ `btvn_lo` cùng (mã bài, chỉ số lô = lan) có ≥ 1 câu ĐÃ TRẢ LỜI. "Đúng nhịp" = xong trước hạn mềm của lô
  // trong bản kế hoạch đã lưu (hạn mềm = mốc lô kế); chưa từng có trong bản lưu nào thì so với hạn nộp cả bài (không bịa nhịp).
  // "Xong lô" CHỈ khi chặng ĐÃ XONG (chỉ số < `btvn_em.lo_da_xong`) — trước đây một câu đã trả lời là đủ ⇒ chặng đúng nhịp (nay 20 EXP + 1 vé Đoàn) bị trao từ câu ĐẦU TIÊN (Boss/Code 1 rà chéo W2b).
  // Không đọc được `lo_da_xong` (thiếu cột) ⇒ giữ hành vi cũ.
  const loDaXongCua = new Map<string, number>()
  let docDuocLoDaXong = false
  if (maBtvnLo.length > 0) {
    const rl = await an(() => env.DB.prepare('SELECT ma_btvn, COALESCE(lo_da_xong, 0) AS n FROM btvn_em WHERE sbd = ? AND ma_btvn IN (SELECT value FROM json_each(?))').bind(sbd, json(maBtvnLo)).all<Record<string, unknown>>(), null)
    if (rl) { docDuocLoDaXong = true; for (const x of rl.results ?? []) loDaXongCua.set(String(x.ma_btvn), Number(x.n) || 0) }
  }
  const loMap = new Map<string, { maBtvn: string; chiSo: number; luc: string }>()
  for (const e of so) {
    if (e.nguon !== 'btvn_lo' || e.ketQua === null || e.luc < tu) continue
    if (docDuocLoDaXong && (e.lan % LAN_MOI_LUOT) >= (loDaXongCua.get(e.maNguon) ?? 0)) continue // chặng CHƯA xong: chưa có khoản `lo`
    // Bài cá nhân hoá làm lại: `lan = chiSo + LAN_MOI_LUOT × (lượt − 1)` ⇒ cùng lô ở mọi lượt về CÙNG khoá EXP `lo|<bài>|<chỉ số>` (không cộng đôi). Bài cũ: lan < 1000, không đổi.
    const chiSo = e.lan % LAN_MOI_LUOT
    const k = `${e.maNguon}|${chiSo}`
    const cu = loMap.get(k)
    if (!cu || e.luc > cu.luc) loMap.set(k, { maBtvn: e.maNguon, chiSo, luc: e.luc })
  }
  const loXong = [...loMap.values()].map((l) => {
    const hanBai = hanNopBtvn.get(l.maBtvn)
    const han = luuKh.map((k) => k.hanMemLo.get(`btvn_lo:${l.maBtvn}:${l.chiSo}`)).find((h) => h !== undefined) ?? hanBai
    // CHỐT CỨNG (nộp trễ, Điều 4 = B): chặng xong SAU hạn nộp của bài không bao giờ "đúng nhịp", kể cả khi mốc lịch ảo của em chưa chốt vượt hạn.
    return { ...l, dungNhip: (han ? ms(l.luc) < ms(han) : true) && !(hanBai && ms(l.luc) > ms(hanBai)) }
  })
  const baiBtvnNop = (baiNopRaw?.results ?? []).map((x) => ({
    maBtvn: String(x.ma_btvn), luc: String(x.nop_luc), dungHan: !!x.han_nop && ms(String(x.nop_luc)) <= ms(String(x.han_nop)),
  }))
  // Bài Mom/daily_ xong: đã nộp VÀ có ≥ 1 câu trả lời trong sổ (nộp trống không được thưởng).
  const momCoTraLoi = new Set(so.filter((e) => e.nguon === 'mom' && e.ketQua !== null).map((e) => e.maNguon))
  const momXong = (momRaw?.results ?? []).filter((x) => momCoTraLoi.has(String(x.id))).map((x) => ({ id: String(x.id), luc: String(x.submitted_at) }))
  const diemCa = luot.filter((l) => l.nopLuc >= tu && Number.isFinite(l.diem)).map((l) => ({ maCa: l.maCa, lanThu: l.lanThu, diem: l.diem, luc: l.nopLuc }))

  const tuNgay = ngayVn(ms(tu))
  const daTraCu = tuNgay === homNay ? await docQidDaTraTheoLuatCu(env, sbd) : new Set<string>()

  // Đạt nhiệm vụ ngày: MỘT định nghĩa dùng chung với chốt ngày (`chotNgayCu`) và bảng thầy — hàm thuần `tinhDatNhiemVuNgay` (Code 1, src/lib/dat-nhiem-vu-ngay.ts).
  // Chưa có kế hoạch ngày đã lưu thì chưa xét (em chưa từng mở nhiệm vụ hôm nay). "Đã làm" đếm trên sổ CHƯA lọc, "lên bậc" trên sổ ĐÃ lọc ca chưa công bố.
  const chiTietDat = tinhDatNhiemVuNgay({ coKeHoach, toiThieu, laNghi, homNay, tu, tuNgay, soTho, so, treNhip, soCauToiHan })
  let datNgay: VaoTinhExp['datNgay'] = null
  if (chiTietDat?.dat) datNgay = { chuoi: (await docChuoiTruoc(env, sbd, homNay)) + 1, luc: chiTietDat.luc }

  const cacKhoan: KhoanExp[] = []
  const cacManh: KhoanManh[] = []
  // "Mừng em trở lại" (Điều 10, từ 22/09): ngày VN của khoản gần nhất đã ghi (1 lần / 14 ngày). Chỉ hỏi khi có ngày nào trong lần tính này dùng bảng giá mới.
  let troLaiGanNhat: string | null = null
  if ([...ngayCanTinh].some((n) => bangGiaExp(n).troLai > 0)) {
    const t = await an(() => env.DB.prepare("SELECT MAX(ngay_vn) AS m FROM exp_so WHERE sbd = ? AND loai = 'tro_lai'").bind(sbd).first<{ m: string | null }>(), null)
    troLaiGanNhat = t?.m ? String(t.m) : null
  }
  const metaTatCa = await docMetaCau(env, [...new Set(so.filter((e) => e.ketQua === 1 && NGUON_EXP_CAU.includes(e.nguon)).map((e) => e.qid))])
  for (const ngay of [...ngayCanTinh].sort()) {
    const chinh = ngay === homNay
    let suKien = so.filter((e) => e.ngayVn === ngay && e.luc >= tu).map((e) => ({ khoa: e.khoa, nguon: e.nguon, maNguon: e.maNguon, qid: e.qid, lan: e.lan, ketQua: e.ketQua, luc: e.luc }))
    if (ngay === tuNgay && daTraCu.size > 0) suKien = suKien.filter((e) => !(NGUON_EXP_CAU.includes(e.nguon) && daTraCu.has(e.qid)))
    const ct = chuyenTrangThaiTrongNgay(soDoc, tra, ngay, tu)
    const vao: VaoTinhExp = {
      ngay, suKien, metaCau: metaTatCa, mucTieuCau,
      lenBac: ct.lenBac, khacPhuc: ct.khacPhuc, dangRoiYeu: ct.dangRoiYeu,
      loXong: chinh ? loXong : [], baiBtvnNop: chinh ? baiBtvnNop : [], momXong: chinh ? momXong : [], diemCa: chinh ? diemCa : [],
      datNgay: chinh ? datNgay : null, daCoKhoa: daCo,
      ngayTruocGanNhat: soTho.reduce<string | null>((m, e) => (e.ngayVn < ngay && (m === null || e.ngayVn > m) ? e.ngayVn : m), null), troLaiGanNhat,
    }
    const ra = tinhExp(vao)
    if (ra.khoan.some((k) => k.loai === 'tro_lai')) troLaiGanNhat = ngay
    for (const k of ra.khoan) { cacKhoan.push(k); daCo.add(k.khoa) }
    for (const m of ra.manh) { cacManh.push(m); daCo.add(m.khoa) }
  }

  // Ca thi CÔNG BỐ MUỘN (nộp ở ngày trước, công bố hôm nay): khoản trao bù ghi rõ để em hiểu vì sao có EXP của bài cũ.
  const tenCa = new Map(luot.map((l) => [l.maCa, l.tenCa || l.maCa]))
  for (const k of cacKhoan) {
    if (k.loai === 'diem_ca' && k.maNguon && ngayVn(ms(k.luc)) !== k.ngay) k.ghiChu = `Ca ${tenCa.get(k.maNguon) ?? k.maNguon} vừa công bố. ${k.ghiChu}`
    else if (k.loai === 'cau' && k.ngay !== homNay && k.maNguon && tenCa.has(k.maNguon)) k.ghiChu = `${k.ghiChu} (ca ${tenCa.get(k.maNguon)} vừa công bố)`
  }

  // Ghi: một câu lệnh nhiều dòng (json_each), tối đa 25 câu lệnh mỗi batch.
  const lenh: D1PreparedStatement[] = []
  for (const g of chunk(cacKhoan, DONG_MOI_LENH)) {
    lenh.push(env.DB.prepare(CHEN_EXP).bind(json(g.map((k) => ({ k: `${sbd}|${k.khoa}`, s: sbd, n: k.ngay, l: k.loai, q: k.qid ?? null, m: k.maNguon ?? null, e: k.exp, t: k.luc, c: k.ghiChu })))))
  }
  for (const g of chunk(cacManh, DONG_MOI_LENH)) {
    lenh.push(env.DB.prepare(CHEN_MANH).bind(json(g.map((k) => ({ k: `${sbd}|${k.khoa}`, s: sbd, n: k.ngay, l: k.loai, o: k.so, t: k.luc, c: k.ghiChu })))))
  }
  for (const g of chunk(lenh, 25)) await env.DB.batch(g)

  // CNH-1.0 P08 (§7.1): CỬA P08 MỞ ⇒ ghi CÙNG các NGÀY ĐẠT sang SỔ MẢNH v1 (`cnh_exp_fragment_ledger`).
  // ⚠️ KHÔNG có bước này thì `cnh_exp_p08_state.fragment_balance` MÃI = 0 ⇒ KHÔNG BAO GIỜ đủ 21 mảnh đổi khiên.
  // Cửa ĐÓNG (mặc định) ⇒ KHÔNG chạm substrate P08. Lỗi ở nhánh này KHÔNG được làm hỏng đường EXP cũ
  // (em chưa chuyển đổi ⇒ `NOT_FOUND` là BÌNH THƯỜNG, bỏ qua im lặng).
  {
    const cuaP08 = await cuaP08Mo(env)
    if (cuaP08.choPhep) {
      for (const m of cacManh) {
        if (m.loai !== 'dat') continue // mảnh chỉ sinh từ NGÀY ĐẠT (§7.1). `dang`/`chuoi7` cũ KHÔNG cấp mảnh.
        try {
          await ghiManhQuaP08(env, '/game-v2/invest', { studentId: sbd, learningDay: m.ngay, requestId: `manh|${sbd}|${m.ngay}`, requestHash: `manh|${sbd}|${m.ngay}`, daDat: true })
        } catch (e) {
          const ma = (e as { ma?: string }).ma
          if (ma !== 'NOT_FOUND') console.error('[cnh-exp-p08] ghi mảnh P08 lỗi (bỏ qua, đường cũ vẫn đúng):', e instanceof Error ? e.message : e)
        }
      }
    }
  }

  const daCong = await congVaoHoSoGame(env, sbd, await docTuNgayMua(env))
  const trangThaiDat: TrangThaiDatNgay | null = chiTietDat
    ? { dat: chiTietDat.dat, thieu: chiTietDat.thieu, daLam: chiTietDat.daLam, toiThieu: chiTietDat.toiThieu, daTrao: daCo.has(`dat|${homNay}`), laNghi: chiTietDat.laNghi }
    : null
  return { bat: true, khoan: cacKhoan, manh: cacManh, daCong, datNgay: trangThaiDat }
}

/**
 * Cộng phần chênh SUM(sổ) − đã cộng vào hồ sơ game bằng CAS theo `revision` (thử tối đa 3 lần). Em chưa có hồ sơ game → null, khoản nằm chờ.
 * `since` = ngày bắt đầu mùa game (hồ sơ mùa mới không nhận khoản của mùa cũ).
 */
export async function congVaoHoSoGame(env: Env, sbd: string, since: string): Promise<DaCong | null> {
  // CNH-1.0 P08 (Cline 25/09): CỔNG P08 MỞ ⇒ phần EXP vừa cộng vào ví hồ sơ cũng phải GƯƠNG sang
  // `cnh_exp_account.wallet_exp`. KHÔNG có bước này thì ví P08 ĐỨNG YÊN ở số của đợt cutover trong khi em
  // kiếm EXP mỗi ngày vào sổ cũ ⇒ bật cờ là màn em đọc ví P08 SAI (EXP em vừa kiếm không hiện ra).
  // Kiểm cờ MỘT lần cho cả vòng (không đệm: tắt cờ là ngừng gương ngay). Cờ TẮT (mặc định) ⇒ không truy vấn thêm.
  const moP08 = (await cuaP08Mo(env).catch(() => ({ choPhep: false }))).choPhep
  for (let lan = 0; lan < 3; lan++) {
    const row = await an(() => env.DB.prepare('SELECT revision, json FROM game_v2_profile WHERE sbd = ?').bind(sbd).first<{ revision: number; json: string }>(), null)
    if (!row) return null
    let p: HoSoGameExp & Record<string, unknown>
    try { p = JSON.parse(row.json) as HoSoGameExp & Record<string, unknown> } catch { return null }
    const t = await an(
      () => env.DB.prepare(
        `SELECT (SELECT COALESCE(SUM(exp), 0) FROM exp_so WHERE sbd = ? AND luc >= ?) AS e,
                (SELECT COALESCE(SUM(${SQL_SO_MANH_TINH}), 0) FROM manh_khien_so WHERE sbd = ? AND luc >= ? AND ngay_vn >= ${SQL_KHIEN_MOC}) AS m,
                (SELECT COUNT(*) FROM manh_khien_so WHERE sbd = ? AND loai = 'dat' AND luc >= ? AND ngay_vn >= ${SQL_KHIEN_MOC}) AS d`,
      ).bind(sbd, since, sbd, since, sbd, since).first<{ e: number; m: number; d: number }>(),
      null,
    )
    if (!t) return null
    const tongExp = Number(t.e) || 0
    const tongManh = Number(t.m) || 0
    const ngayDat = Number(t.d) || 0
    if (tongExp === (p.expMoi?.daCong ?? 0) && tongManh === (p.expMoi?.manhDaTinh ?? 0) && ngayDat === (p.expMoi?.ngayDat ?? 0)) return { exp: 0, manh: 0, khienMoi: 0 }
    const ra = congTongSoVaoHoSo(p, tongExp, tongManh, ngayDat)
    const lenh: D1PreparedStatement[] = [
      env.DB.prepare('UPDATE game_v2_profile SET json = ?, revision = revision + 1 WHERE sbd = ? AND revision = ?').bind(json(p), sbd, row.revision),
    ]
    // GƯƠNG ví P08: `changes() = 1` buộc câu này CHỈ chạy khi câu trên vừa thắng CAS ⇒ hai sổ cùng đổi hoặc
    // cùng không. Hàng ví chưa có (em chưa chuyển đổi) ⇒ 0 dòng, vô hại.
    if (moP08 && ra.exp > 0) {
      lenh.push(
        env.DB.prepare(
          `UPDATE cnh_exp_account
              SET wallet_exp = wallet_exp + ?, earned_exp = earned_exp + ?, revision = revision + 1, cap_nhat_luc = datetime('now')
            WHERE student_id = ? AND changes() = 1`,
        ).bind(ra.exp, ra.exp, sbd),
      )
    }
    let daDoi = 0
    if (lenh.length > 1) {
      const r = await env.DB.batch(lenh)
      daDoi = Number(r[0]?.meta.changes ?? 0)
    } else {
      const r = await lenh[0]!.run()
      daDoi = Number(r.meta.changes ?? 0)
    }
    if (daDoi) return ra
  }
  return null
}

// --- Hàm cho game "Đoàn Hộ Tống" (docs/hop-dong-exp-cho-game-1909.md) ----------------------------------

export interface KetQuaTiepSuc {
  /** false = EXP mới chưa bật cho em này: KHÔNG ghi gì. */
  bat: boolean
  /** EXP vừa cộng lần này (0 khi đã đủ số lần trong ngày hoặc lượt này đã ghi rồi). */
  exp: number
  /** Lần tiếp sức thứ mấy trong ngày (1..TIEP_SUC_TOI_DA_NGAY); 0 khi đã đủ. */
  lanThu: number
  conLai: number
  /** Lượt này (`idLuot`) đã được ghi từ trước — gọi lại không cộng thêm. */
  daGhiTruoc: boolean
}

/**
 * Tiếp sức đồng đội: +EXP_TIEP_SUC mỗi lần, tối đa TIEP_SUC_TOI_DA_NGAY lần mỗi ngày VN. Khoá `tiepsuc|<ngày>|<n>` trong sổ của em (khoá đầy đủ
 * `<sbd>|tiepsuc|<ngày>|<n>`). `idLuot` (mã lượt của game) làm gọi lại cùng lượt KHÔNG cộng đôi. Không ném lỗi. Game gọi hàm này sau khi tự xác thực em.
 */
export async function ghiTiepSuc(env: Env, sbd: string, nowMs: number, idLuot: string | null = null): Promise<KetQuaTiepSuc> {
  const khong: KetQuaTiepSuc = { bat: false, exp: 0, lanThu: 0, conLai: 0, daGhiTruoc: false }
  try {
    const tu = mocExpCuaEm(await docCauHinhExp(env), sbd, nowMs)
    if (!tu) return khong
    const ngay = ngayVn(nowMs)
    const luc = new Date(nowMs).toISOString()
    for (let thu = 0; thu < TIEP_SUC_TOI_DA_NGAY + 1; thu++) {
      const r = await env.DB.prepare("SELECT khoa, ma_nguon FROM exp_so WHERE sbd = ? AND ngay_vn = ? AND loai = 'tiepsuc'").bind(sbd, ngay).all<{ khoa: string; ma_nguon: string | null }>()
      const co = r.results ?? []
      if (idLuot && co.some((x) => x.ma_nguon === idLuot)) { await congVaoHoSoGame(env, sbd, await docTuNgayMua(env)); return { bat: true, exp: 0, lanThu: 0, conLai: Math.max(0, TIEP_SUC_TOI_DA_NGAY - co.length), daGhiTruoc: true } }
      if (co.length >= TIEP_SUC_TOI_DA_NGAY) return { bat: true, exp: 0, lanThu: 0, conLai: 0, daGhiTruoc: false }
      const n = co.length + 1
      // ĐIỀU 9: tiếp sức là EXP sinh trong game ⇒ qua cửa trần 120 EXP/ngày (quá trần ghi khoản 0 EXP, vẫn tính là một lần tiếp sức).
      const k: KhoanGame = { khoa: `tiepsuc|${ngay}|${n}`, loai: 'tiepsuc', exp: EXP_TIEP_SUC, ngay, luc, maNguon: idLuot, ghiChu: `Tiếp sức đồng đội lần ${n}` }
      const w = await ghiGameNguyenTu(env, sbd, k)
      if (w.ghi) {
        await congVaoHoSoGame(env, sbd, await docTuNgayMua(env))
        emCoGhi(sbd)
        return { bat: true, exp: w.exp, lanThu: n, conLai: TIEP_SUC_TOI_DA_NGAY - n, daGhiTruoc: false }
      }
      // Ô số n vừa bị lượt khác giữ chỗ: đọc lại và thử ô kế.
    }
    return { bat: true, exp: 0, lanThu: 0, conLai: 0, daGhiTruoc: false }
  } catch (e) {
    console.error('[exp] tiếp sức lỗi (bỏ qua):', e instanceof Error ? e.message : e)
    return khong
  }
}

export interface KhoanGame {
  /** Khoá KHÔNG gồm sbd (ví dụ `thuthach|<qid>`, `doan_chang|<mã chặng>`); ghi vào sổ là `<sbd>|<khoa>` — trùng khoá ⇒ không cộng đôi. */
  khoa: string
  loai: string
  exp: number
  ngay: string
  luc: string
  ghiChu: string
  maNguon?: string | null
  qid?: string | null
}

/**
 * Ghi MỘT khoản EXP sinh trong game (thử thách/Lượt trùm, kết chặng Đoàn, vỡ giáp…) cùng hạn mức 120/ngày trong một giao dịch, rồi cộng phần chênh sổ vào ống nghiệm. Idempotent theo `khoa`.
 * Quá trần ⇒ ghi khoản 0 EXP (đánh dấu đã xét, không tự cộng lại khi sang ngày). EXP mới TẮT cho em ⇒ không ghi gì. Không ném lỗi.
 */
export async function ghiKhoanExpGame(env: Env, sbd: string, k: KhoanGame, nowMs: number): Promise<{ bat: boolean; exp: number; daGhiTruoc: boolean }> {
  try {
    if (!mocExpCuaEm(await docCauHinhExp(env), sbd, nowMs)) return { bat: false, exp: 0, daGhiTruoc: false }
    const khoa = `${sbd}|${k.khoa}`
    if (await env.DB.prepare('SELECT 1 AS x FROM exp_so WHERE khoa = ?').bind(khoa).first()) { await congVaoHoSoGame(env, sbd, await docTuNgayMua(env)); return { bat: true, exp: 0, daGhiTruoc: true } }
    const w = await ghiGameNguyenTu(env, sbd, k)
    if (!w.ghi) return { bat: true, exp: 0, daGhiTruoc: true }
    const nhan = w.exp
    await congVaoHoSoGame(env, sbd, await docTuNgayMua(env))
    emCoGhi(sbd) // EXP game vừa ghi ⇒ đệm kế hoạch ngày của em hết hiệu lực
    return { bat: true, exp: nhan, daGhiTruoc: false }
  } catch (e) {
    console.error('[exp] ghi khoản game lỗi (bỏ qua):', e instanceof Error ? e.message : e)
    return { bat: false, exp: 0, daGhiTruoc: false }
  }
}

/** Ledger và hạn mức cùng một giao dịch D1: retry không tiêu thêm hạn mức.
 * Guard revision ngay trên INSERT; changes() nối UPDATE với đúng INSERT vừa thắng.
 */
async function ghiGameNguyenTu(env: Env, sbd: string, k: KhoanGame): Promise<{ ghi: boolean; exp: number }> {
  for (let lan = 0; lan < 8; lan++) {
    const row = await env.DB.prepare('SELECT revision, json FROM game_v2_profile WHERE sbd = ?').bind(sbd).first<{ revision: number; json: string }>()
    if (!row) {
      // Thử thách học tập có thể hoàn tất trước lần đầu em mở thần thú.
      // Khởi tạo cùng đường chuẩn rồi mới ghi, để khoản thưởng không bị mất.
      const { loadProfile } = await import('./game-v2')
      await loadProfile(env, sbd)
      continue
    }
    const p = JSON.parse(row.json) as Profile
    const exp = nhanExpGame(p, k.ngay, k.exp)
    const khoa = `${sbd}|${k.khoa}`
    const ketQua = await env.DB.batch([
      env.DB.prepare(`INSERT OR IGNORE INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu)
        SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM game_v2_profile WHERE sbd=? AND revision=?)
        AND (? <> 'tiepsuc' OR (
          (SELECT COUNT(*) FROM exp_so WHERE sbd=? AND ngay_vn=? AND loai='tiepsuc') < ?
          AND (? IS NULL OR NOT EXISTS(SELECT 1 FROM exp_so WHERE sbd=? AND ngay_vn=? AND loai='tiepsuc' AND ma_nguon=?))))`)
        .bind(khoa,sbd,k.ngay,k.loai,k.qid??null,k.maNguon??null,exp,k.luc,k.ghiChu,sbd,row.revision,
          k.loai,sbd,k.ngay,TIEP_SUC_TOI_DA_NGAY,k.maNguon??null,sbd,k.ngay,k.maNguon??null),
      env.DB.prepare('UPDATE game_v2_profile SET json=?, revision=revision+1 WHERE sbd=? AND revision=? AND changes()=1')
        .bind(json(p),sbd,row.revision),
    ])
    if (ketQua[0]?.meta.changes) return { ghi: true, exp }
    if (await env.DB.prepare('SELECT 1 AS x FROM exp_so WHERE khoa=?').bind(khoa).first()) return { ghi: false, exp: 0 }
    if (k.loai === 'tiepsuc' && k.maNguon && await env.DB.prepare("SELECT 1 AS x FROM exp_so WHERE sbd=? AND ngay_vn=? AND loai='tiepsuc' AND ma_nguon=?").bind(sbd,k.ngay,k.maNguon).first()) return { ghi: false, exp: 0 }
  }
  throw new Error('Hồ sơ đang cập nhật. Phần thưởng cần được thử lại.')
}

export interface ThanhTichNgay {
  bat: boolean
  ngay: string
  /** Đã có khoản "đạt nhiệm vụ ngày" (`dat|<ngày>`) trong sổ EXP. */
  datNgay: boolean
  /** Lô BTVN xong ĐÚNG NHỊP đã ghi sổ trong ngày (khoá `lo|<mã bài>|<chỉ số lô>`). */
  loDungNhip: { maBtvn: string; chiSo: number; khoa: string }[]
}

/**
 * ĐỌC-CHỈ cho game phát vé: hôm nay em này đã có khoá `dat|<ngày>` và những khoá `lo|…` đúng nhịp nào. Không ghi gì, không tính lại — muốn số mới nhất thì gọi
 * `capNhatExp` trước. Cờ tắt → `bat:false`, rỗng. Không ném lỗi.
 */
export async function docThanhTichNgay(env: Env, sbd: string, nowMs: number, ngay: string = ngayVn(nowMs)): Promise<ThanhTichNgay> {
  const rong: ThanhTichNgay = { bat: false, ngay, datNgay: false, loDungNhip: [] }
  try {
    if (!mocExpCuaEm(await docCauHinhExp(env), sbd, nowMs)) return rong
    const r = await an(
      () => env.DB.prepare("SELECT khoa, loai, exp, ma_nguon FROM exp_so WHERE sbd = ? AND ngay_vn = ? AND loai IN ('dat_ngay','lo') ORDER BY luc, khoa").bind(sbd, ngay).all<Record<string, unknown>>(),
      null,
    )
    const ra: ThanhTichNgay = { bat: true, ngay, datNgay: false, loDungNhip: [] }
    const tienTo = `${sbd}|`
    for (const x of r?.results ?? []) {
      const khoa = String(x.khoa).slice(tienTo.length)
      if (x.loai === 'dat_ngay') ra.datNgay = true
      // ĐÚNG NHỊP = khoản `lo` có EXP CAO HƠN giá trễ nhịp của NGÀY ấy (10 > 4 trước 22/09; 20 > 8 từ 22/09) — không so cứng một con số, để đổi bảng giá không làm lệch vé của game.
      else if (Number(x.exp) > bangGiaExp(ngay).loTreNhip) ra.loDungNhip.push({ maBtvn: String(x.ma_nguon ?? ''), chiSo: Number(khoa.split('|')[2]), khoa })
    }
    return ra
  } catch (e) {
    console.error('[exp] đọc thành tích ngày lỗi (bỏ qua):', e instanceof Error ? e.message : e)
    return rong
  }
}

// --- Cron 00:01: chốt EXP của ngày vừa qua -----------------------------------------------------------

const TOI_DA_EM_CHOT_MOT_LUOT = 40

/**
 * Sau khi `chayCaLop` chốt ngày cũ: em nào có ngày hôm qua `ket_qua = 'dat'` mà sổ EXP chưa có khoản `dat|<ngày>` (làm bằng đường chưa gọi `capNhatExp`)
 * thì tính lại đúng ngày đó. Chỉ xét em đang bật cờ; tối đa 40 em mỗi lượt để không vượt trần truy vấn của một lượt chạy.
 */
export async function chotExpNgayQua(env: Env, nowMs: number): Promise<{ soEm: number; daTinh: number }> {
  const lo = await chotMotLoNgayQua(env, nowMs, '', TOI_DA_EM_CHOT_MOT_LUOT)
  return lo ? { soEm: lo.soEm, daTinh: lo.daTinh } : { soEm: 0, daTinh: 0 }
}

/** MỘT lô (≤ `toiDa` em, xếp theo sbd, chỉ em có sbd > `sbdSau`). `null` = EXP mới chưa bật cho ai (không có gì để chốt). `conNua` = lô đầy ⇒ có thể còn em sau `sbdCuoi`. */
async function chotMotLoNgayQua(env: Env, nowMs: number, sbdSau: string, toiDa: number): Promise<{ soEm: number; daTinh: number; sbdCuoi: string; conNua: boolean } | null> {
  const cfg = await docCauHinhExp(env)
  const tuToanBo = cfg.toanBo && cfg.tu && ms(cfg.tu) <= nowMs
  const mocRieng = cfg.tuDsSbd ?? cfg.tu
  const tuRieng = cfg.dsSbd.length > 0 && mocRieng && ms(mocRieng) <= nowMs
  if (!tuToanBo && !tuRieng) return null
  const homQua = themNgay(ngayVn(nowMs), -1)
  const loc = tuToanBo ? '' : 'AND k.sbd IN (SELECT value FROM json_each(?))'
  const lenh = env.DB.prepare(
    `SELECT k.sbd FROM ke_hoach_ngay k WHERE k.ngay = ? AND k.ket_qua = 'dat'
        AND NOT EXISTS (SELECT 1 FROM exp_so e WHERE e.khoa = k.sbd || '|dat|' || k.ngay) AND k.sbd > ? ${loc} ORDER BY k.sbd LIMIT ${Math.max(1, Math.floor(toiDa))}`,
  )
  const r = await an(() => (tuToanBo ? lenh.bind(homQua, sbdSau) : lenh.bind(homQua, sbdSau, json(cfg.dsSbd))).all<{ sbd: string }>(), null)
  let daTinh = 0
  const ds = r?.results ?? []
  for (const x of ds) {
    const k = await capNhatExp(env, String(x.sbd), nowMs, { ngay: homQua })
    if (k.bat) daTinh++
  }
  return { soEm: ds.length, daTinh, sbdCuoi: ds.length ? String(ds[ds.length - 1]!.sbd) : sbdSau, conNua: ds.length >= Math.max(1, Math.floor(toiDa)) }
}

const KHOA_CHOT_NGAY = 'chot_exp_ngay_qua'

/** Còn em ĐANG HỌC (không bị khoá, có trong `hoc_sinh` — đúng tập `chayCaLop` chốt) có dòng kế hoạch ngày `ngay` chưa chốt (`ket_qua` NULL, không phải ngày nghỉ)? Lỗi truy vấn ⇒ coi là CÒN (không xong nhầm). */
async function conKeHoachChuaChot(env: Env, ngay: string): Promise<boolean> {
  const r = await an(
    () => env.DB.prepare(
      `SELECT 1 AS con FROM ke_hoach_ngay k WHERE k.ngay = ? AND k.ket_qua IS NULL AND k.la_ngay_nghi = 0
          AND k.sbd IN (SELECT h.sbd FROM hoc_sinh h WHERE COALESCE(h.trang_thai, '') <> 'khoa') LIMIT 1`,
    ).bind(ngay).first<{ con: number }>(),
    undefined,
  )
  return r === undefined || r !== null
}

/**
 * CHỐT "ĐẠT NGÀY" ĐẦY ĐỦ cho MỌI em (vá lỗ: `chotExpNgayQua` cũ chỉ chạy MỘT lần và chỉ 40 em ⇒ em đạt mà không mở app lại mất mảnh/EXP ngày ấy). Mỗi lượt gọi làm MỘT lô (≤ `toiDa`, mặc định 40) rồi ghi CON TRỎ
 * `cau_hinh.chot_exp_ngay_qua = {ngay, sbdCuoi, xong}`; cron mỗi phút gọi tiếp cho tới khi `xong` (con trỏ chạy hết danh sách, KHÔNG dựa vào "còn thiếu khoản" vì em có thể không tạo khoản dù kế hoạch chốt 'dat').
 * Idempotent: `capNhatExp` có khoá sổ; chạy lại một em không cộng đôi. `xong` cũng đúng khi EXP mới chưa bật cho ai.
 */
export async function chotExpNgayQuaDayDu(env: Env, nowMs: number, tuyChon: { toiDa?: number } = {}): Promise<{ soEm: number; daTinh: number; xong: boolean; ngay: string }> {
  const ngay = themNgay(ngayVn(nowMs), -1)
  const r = await an(() => env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_CHOT_NGAY).first<{ gia_tri: string }>(), null)
  let tt: { ngay?: string; sbdCuoi?: string; xong?: boolean } = {}
  try { tt = r?.gia_tri ? (JSON.parse(r.gia_tri) as typeof tt) : {} } catch { tt = {} }
  const cungNgay = tt.ngay === ngay
  if (cungNgay && tt.xong === true) return { soEm: 0, daTinh: 0, xong: true, ngay }
  const lo = await chotMotLoNgayQua(env, nowMs, cungNgay ? String(tt.sbdCuoi ?? '') : '', tuyChon.toiDa ?? TOI_DA_EM_CHOT_MOT_LUOT)
  const moi = { ngay, sbdCuoi: lo?.sbdCuoi ?? '', xong: lo ? !lo.conNua : true }
  // KẼ HỞ (Boss soát 5759cc8): cron mỗi phút có thể tới khi `chayCaLop` (00:01) CHƯA chốt xong `ket_qua` của mọi lô ⇒ em chốt 'dat' SAU lượt quét này sẽ không bao giờ được trao mảnh,
  // và trừ khiên chạy sớm. Còn dòng kế hoạch hôm qua chưa chốt (em đang học, không ngày nghỉ) ⇒ CHƯA xong: đặt con trỏ về đầu để lượt sau quét lại (idempotent nhờ NOT EXISTS + khoá sổ).
  if (lo && moi.xong && (await conKeHoachChuaChot(env, ngay))) { moi.xong = false; moi.sbdCuoi = '' }
  await env.DB.prepare("INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc")
    .bind(KHOA_CHOT_NGAY, json(moi), new Date(nowMs).toISOString()).run()
  return { soEm: lo?.soEm ?? 0, daTinh: lo?.daTinh ?? 0, xong: moi.xong, ngay }
}

// --- Đọc cho màn hình -----------------------------------------------------------------------------

const TEN_LOAI: Record<string, string> = {
  cau: 'câu đúng', lo: 'lô BTVN', btvn: 'nộp bài BTVN đúng hạn', mom: 'bài được giao', len_bac: 'câu ôn lên bậc', khac_phuc: 'câu khắc phục xong',
  len_bang: 'lần lên bảng', diem_ca: 'ca thi có điểm', dat_ngay: 'lần đạt nhiệm vụ ngày', chuoi: 'chuỗi ngày đạt', tiepsuc: 'lượt tiếp sức', dau_ngay: 'câu đúng đầu tiên trong ngày', tro_lai: 'lần mừng em trở lại', thu_thach: 'câu thử thách đúng', doan_chang: 'chặng Đoàn thắng', doan_giap: 'lần vỡ giáp trùm',
}

export interface ExpHomNay {
  /** Đợt 1 thần thú mỗi ngày (chỉ-thêm; vắng khi em chưa có thú/hồ sơ chưa chuyển): EXP thú còn thiếu để lên cấp (KHÔNG trừ ống), ống nghiệm, hôm nay thú còn ăn được. */
  expConThieu?: number
  ongNghiem?: number
  hapThuConLaiHomNay?: number
  homNay: number
  chiTietHomNay: { loai: string; exp: number; ghiChu: string; soKhoan: number }[]
  manhKhien: { manh: number; moiKhien: number; khienRen: number; khienConLai: number; choCongVaoHoSo: boolean }
}

/** EXP hôm nay (gộp theo loại) + mảnh khiên hiện có. Không ném lỗi. */
export async function docExpHomNay(env: Env, sbd: string, nowMs: number): Promise<ExpHomNay> {
  const ngay = ngayVn(nowMs)
  const r = await an(
    () => env.DB.prepare('SELECT loai, exp, ghi_chu FROM exp_so WHERE sbd = ? AND ngay_vn = ? ORDER BY luc, khoa').bind(sbd, ngay).all<Record<string, unknown>>(),
    null,
  )
  const nhom = new Map<string, { exp: number; ghiChu: string; n: number }>()
  for (const x of r?.results ?? []) {
    const k = String(x.loai)
    const cu = nhom.get(k)
    if (cu) { cu.exp += Number(x.exp) || 0; cu.n++ } else nhom.set(k, { exp: Number(x.exp) || 0, ghiChu: String(x.ghi_chu ?? ''), n: 1 })
  }
  const game = await an(() => env.DB.prepare("SELECT COALESCE(SUM(amount),0) AS e, COUNT(*) AS n FROM game_v2_reward WHERE sbd=? AND created_at>=? AND created_at<? AND amount>0")
    .bind(sbd, new Date(`${ngay}T00:00:00+07:00`).toISOString(), new Date(`${themNgay(ngay, 1)}T00:00:00+07:00`).toISOString()).first<{ e: number; n: number }>(), null)
  if (game && game.n > 0) nhom.set('game_mastery', { exp: Number(game.e) || 0, n: game.n, ghiChu: 'Thưởng nấc học trong game' })
  const chiTiet = [...nhom].map(([loai, v]) => ({
    loai, exp: v.exp, soKhoan: v.n, ghiChu: v.n === 1 ? v.ghiChu : `${v.n} ${TEN_LOAI[loai] ?? loai}: +${v.exp}`,
  }))
  const pr = await an(() => env.DB.prepare('SELECT json FROM game_v2_profile WHERE sbd = ?').bind(sbd).first<{ json: string }>(), null)
  let p: (HoSoGameExp & Record<string, unknown>) | null = null
  try { p = pr ? (JSON.parse(pr.json) as HoSoGameExp & Record<string, unknown>) : null } catch { p = null }
  let manh = 0, khienRen = 0, cho = false
  if (p) {
    manh = p.khienRen?.manh ?? 0
    khienRen = khienRenChuaDung(p)
    const t = await an(() => env.DB.prepare(`SELECT COALESCE(SUM(${SQL_SO_MANH_TINH}), 0) AS m FROM manh_khien_so WHERE sbd = ? AND ngay_vn >= ${SQL_KHIEN_MOC}`).bind(sbd).first<{ m: number }>(), null)
    cho = (Number(t?.m) || 0) > (p.expMoi?.manhDaTinh ?? 0)
  } else {
    const t = await an(() => env.DB.prepare(`SELECT COALESCE(SUM(${SQL_SO_MANH_TINH}), 0) AS m FROM manh_khien_so WHERE sbd = ? AND ngay_vn >= ${SQL_KHIEN_MOC}`).bind(sbd).first<{ m: number }>(), null)
    manh = congManh({ manh: 0, daRen: 0 }, Number(t?.m) || 0, 0).manh
    cho = (Number(t?.m) || 0) > 0
  }
  return {
    homNay: chiTiet.reduce((t, x) => t + x.exp, 0), chiTietHomNay: chiTiet,
    manhKhien: { manh, moiKhien: MANH_MOI_KHIEN, khienRen, khienConLai: p ? khienConLai(p) : 0, choCongVaoHoSo: cho },
    ...(await docHapThuChoEm(env, sbd, nowMs) ?? {}),
  }
}

/**
 * `POST /hs/ke-hoach-ngay` có EXP: lập kế hoạch như cũ, rồi (chỉ khi EXP mới bật cho em) tính EXP từ kế hoạch VỪA LẬP và đính `exp` + `expNhan` +
 * `manhNhan`. Tắt cờ → phản hồi y hệt bản cũ, từng chữ.
 */
export async function hsKeHoachNgayCoExp(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const r = await hsKeHoachNgay(env, b)
  if (r.ok !== true) return r
  const sbd = typeof r.sbd === 'string' ? r.sbd : b.token ? await gameIdentity(env, b).catch(() => '') : String(b.sbd ?? '').trim()
  if (!sbd) return r
  const now = Date.now()
  const k = await capNhatExp(env, sbd, now, {
    kh: {
      nganSach: r.nganSach as KeHoachTom['nganSach'], tienBo: r.tienBo as KeHoachTom['tienBo'], lanNghi: r.lanNghi === true, chuoiDat: Number(r.chuoiDat) || 0,
    },
  })
  if (!k.bat) return r
  return { ...r, exp: { ...(await docExpHomNay(env, sbd, now)), datNgay: k.datNgay }, expNhan: expNhanCuaKetQua(k), manhNhan: manhNhanCuaKetQua(k) }
}
