// RESET TOÀN APP — 00:01 giờ Việt Nam thứ Hai 21/09/2026, MỘT LẦN (thầy chốt 19/09: "reset toàn app xoá hết ca thi và toàn bộ dữ liệu vào 00:01 thứ 2
// để app mới hoàn toàn công bằng cho học sinh"; 0.Planer duyệt bảng phân loại 58 bảng).
//
// AN TOÀN, theo thứ tự:
//   · Hai danh sách CỐ ĐỊNH `BANG_XOA` / `BANG_GIU`: job CHỈ xoá bảng trong `BANG_XOA` (tên đi vào SQL chỉ từ hằng này, có kiểm định dạng). Bảng nào có trong D1 mà không
//     thuộc danh sách nào (`chuaPhanLoai`) thì KHÔNG bị đụng và được báo cáo; test khoá "mọi bảng của lược đồ phải được phân loại" nên thêm bảng mới là buộc phải quyết.
//   · Bảng trong danh sách mà chưa tồn tại (chưa chạy migration) thì BỎ QUA, không làm chết job. Bảng WITHOUT ROWID xoá bằng `DELETE FROM "t"` (không dùng rowid).
//   · AN TOÀN MẶC ĐỊNH: job CHỈ chạy (và cổng đóng băng CHỈ bật) khi `cau_hinh.reset_20260921_cho_phep` = true ("cờ lên đạn", do 0.Planer/thầy bật tối Chủ nhật sau khi sao lưu
//     và chạy thử khớp). Không có cờ ⇒ không xoá gì, không đóng băng gì. CỜ HUỶ `cau_hinh.reset_20260921_huy` THẮNG cờ cho phép.
//   · MỘT LẦN: khoá `cau_hinh.reset_20260921` giành bằng INSERT OR IGNORE (hai cron 17:01 UTC và mỗi phút không chạy đôi). Khoá `xong` thì không bao giờ chạy lại.
//   · HẠN TỰ CHẠY: cron chỉ được bắt đầu/tiếp tục trong [00:01, 01:00] giờ VN 21/09. Quá 01:00 mà chưa `xong` ⇒ `qua_gio`, KHÔNG tự chạy nữa, mở băng; chỉ lệnh của thầy
//     `/reset/chay-tiep` (mã bí mật) chạy tiếp được. (Job tự tiếp tục lúc 08:00 sẽ xoá bài các em vừa làm sáng thứ Hai.)
//   · NGÂN SÁCH TRUY VẤN: mỗi lượt gọi Worker ≤ TOI_DA_TRUY_VAN_MOI_LUOT (40, đúng cho cả gói Free 50) truy vấn D1; job CHIA BƯỚC, hết ngân sách thì ghi `cho_tiep` và lượt cron phút sau
//     tiếp tục NGAY. Mọi truy vấn đi qua bộ đếm; test đo độc lập.
//   · CHẠY THỬ: `resetDryRun` chỉ đếm, không ghi gì, ≤ 40 truy vấn.
//   · Sao lưu: trước khi xoá, khoá ghi `batDauLuc` (mốc D1 Time Travel) và `demTruoc` (số dòng từng bảng); tập mã đã dùng nạp vào `ma_da_dung` TRƯỚC khi xoá `ca`.
//     Ngoài job: bản export .sql tối Chủ nhật và R2 giữ nguyên (docs/reset-2109.md).
//   · KHÔNG đụng: tài khoản/mật khẩu/token (`hoc_sinh`), danh sách lớp, kho đề/câu hỏi, chỉ mục game, cấu hình thầy, cài đặt em, đăng ký push, thống kê dùng app, R2.
import type { D1PreparedStatement, Env } from './kieu'

export const MA_RESET = 'reset_20260921'
export const KHOA_HUY = 'reset_20260921_huy'
/** CỜ LÊN ĐẠN: không có cờ này = true thì job không chạy và không đóng băng. */
export const KHOA_CHO_PHEP = 'reset_20260921_cho_phep'
/** 00:01 giờ VN thứ Hai 21/09/2026. */
export const MOC_RESET = '2026-09-20T17:01:00.000Z'
export const MOC_RESET_MS = Date.parse(MOC_RESET)
/** Giá trị máy khách nhận (`mocReset`) SAU KHI job xong. */
export const MOC_RESET_CHUOI = '2026-09-21'
export const MUA_MOI = { id: '2026-09-21-mua-1', startedAt: MOC_RESET }
/** Đóng băng ghi từ 00:00 tới khi `xong` HOẶC 01:00 giờ VN (không mở băng giữa chừng khi job đang xoá dở). */
export const DONG_BANG_TU_MS = Date.parse('2026-09-20T17:00:00.000Z')
/** HẠN TỰ CHẠY: 01:00 giờ VN. Quá hạn mà chưa xong ⇒ `qua_gio`, không tự chạy nữa. */
export const HAN_TU_CHAY_MS = Date.parse('2026-09-20T18:00:00.000Z')
/** Job coi là chết nếu quá ngần này không có nhịp tim (trạng thái `dang_chay`). Trạng thái `cho_tiep` (nhường) được tiếp tục ngay. */
export const QUA_HAN_DANG_CHAY_MS = 3 * 60_000
/** Trần truy vấn D1 mỗi lượt gọi Worker: 40 đúng cho cả gói Free (50). */
export const TOI_DA_TRUY_VAN_MOI_LUOT = 40
const DU_TRU_GHI_KHOA = 1
const CHI_PHI_NAP_MA = 12
const CHI_PHI_CHOT = 6
const XOA_MOI_LENH = 4000
/** Cron thôi hỏi khoá sau hạn này thêm ngần này (đủ để ghi `qua_gio`). */
const CRON_HOI_THEM_MS = 2 * 3_600_000
const COT_MOI_TRUY_VAN_DEM = 60

/** XOÁ — theo lệnh thầy. */
export const BANG_XOA: readonly string[] = [
  // Ca thi và lượt
  'ca', 'luot', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'chan_vao', 'trang_thai', 'phieu', 'kho_ca_them', 'nhan_xet', 'de_rieng', 'dong_bo', 'nop_khac_phuc',
  // BTVN, bài giao, luyện đề
  'btvn', 'btvn_em', 'btvn_em_lich_su', 'mom_bai', 'luyen_de_2026', 'yeu_cau_giao_bai', 'study_drafts',
  // Sổ học và hồ sơ
  'su_kien_hoc', 'nam_kt_cau', 'nam_kt_dang', 'ke_hoach_ngay', 'tien_do_hs', 'tien_do_ca', 'qid_da_lam', 'len_bang',
  // Trao đổi
  'tin_nhan', 'cau_hoi_em', 'student_notice', 'student_push_delivery',
  // Game, thần thú, EXP
  'game_v2_profile', 'game_v2_attempt', 'game_v2_reward', 'game_v2_room', 'game_v2_session', 'game_v2_task', 'than_thu', 'vo_dai_phong', 'vo_dai_moi', 'exp_so', 'manh_khien_so',
  // Đoàn Hộ Tống (bảng mới của Code 5; mùa 1 tính từ 21/09)
  'doan_chang', 'doan_luot', 'doan_tiep_suc',
  // Vinh danh, tin phụ huynh
  'daily_honors', 'parent_daily_news',
]

/** GIỮ — tài khoản, lớp, kho, cấu hình, cài đặt. `cau_hinh` và `game_v2_settings` chỉ bị GHI đúng vài dòng (xem `chayReset`), không bị xoá. */
export const BANG_GIU: readonly string[] = [
  'hoc_sinh', 'danh_sach', 'phu_huynh', 'de_kho', 'cau_hoi', 'game_v2_question', 'game_v2_index', 'cau_hinh', 'game_v2_settings', 'game_v2_scope',
  'study_preferences', 'student_push', 'app_presence', 'ma_da_dung',
]

const TEN_HOP_LE = /^[a-z][a-z0-9_]*$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const json = (v: unknown) => JSON.stringify(v)
const ms = (iso: string): number => Date.parse(iso) || 0

export type TrangThaiKhoa = 'dang_chay' | 'cho_tiep' | 'xong' | 'qua_gio'

export interface TrangThaiReset {
  trangThai: TrangThaiKhoa
  /** Bước đang làm: nạp mã đã dùng → xoá bảng → chốt. */
  buoc: 'nap_ma' | 'xoa' | 'chot'
  /** Chỉ số (trong BANG_XOA) bảng sẽ xoá tiếp. */
  bangTiep: number
  batDauLuc: string
  tiepTucLuc?: string
  soLanChay: number
  demTruoc: Record<string, number | null>
  muaCu?: string | null
  expMoiCu?: string | null
  chuaPhanLoai?: string[]
  maDaDung?: { ca: number; btvn: number; mom: number }
  demSau?: Record<string, number | null>
  xoaConDu?: Record<string, number>
  xongLuc?: string
  quaGioLuc?: string
  soEm?: number
  loi?: string
}

/**
 * Bọc D1 để ĐẾM mọi truy vấn của một lượt chạy. Job chỉ dùng prepare().first/all/run (không dùng batch) nên mỗi lời gọi = đúng một truy vấn D1.
 */
function boDemTruyVan(env: Env): { env: Env; dem: () => number } {
  let n = 0
  const goc = env.DB
  const boc = (st: D1PreparedStatement): D1PreparedStatement => ({
    bind: (...v: unknown[]) => boc(st.bind(...v)),
    first: <T>(c?: string) => { n++; return st.first<T>(c) },
    run: <T>() => { n++; return st.run<T>() },
    all: <T>() => { n++; return st.all<T>() },
  })
  const DB = {
    prepare: (q: string) => boc(goc.prepare(q)),
    batch: () => { throw new Error('reset-toan-app không dùng batch') },
  } as unknown as Env['DB']
  return { env: { ...env, DB }, dem: () => n }
}

async function docGiaTri(env: Env, khoa: string): Promise<string | null> {
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string | null }>()
    return r ? String(r.gia_tri ?? '') : null
  } catch {
    return null
  }
}

function laCoBat(v: string | null, truong: string): boolean {
  if (v === null) return false
  const s = v.trim().toLowerCase()
  if (s === 'true' || s === '1') return true
  try {
    const o = JSON.parse(v) as unknown
    return o === true || (typeof o === 'object' && o !== null && (o as Record<string, unknown>)[truong] === true)
  } catch {
    return false
  }
}

/** Cờ HUỶ (thắng cờ cho phép). */
export async function laHuy(env: Env): Promise<boolean> {
  return laCoBat(await docGiaTri(env, KHOA_HUY), 'huy')
}
/** Cờ LÊN ĐẠN: chỉ khi `true` job mới chạy và cổng đóng băng mới bật. */
export async function laChoPhep(env: Env): Promise<boolean> {
  return laCoBat(await docGiaTri(env, KHOA_CHO_PHEP), 'choPhep')
}

export async function docTrangThaiReset(env: Env): Promise<TrangThaiReset | null> {
  const v = await docGiaTri(env, MA_RESET)
  if (!v) return null
  try {
    const o = JSON.parse(v) as TrangThaiReset
    return o && typeof o === 'object' ? o : null
  } catch {
    return null
  }
}

interface ThongTinBang {
  /** Bảng khai `WITHOUT ROWID` (không có `rowid`): xoá bằng `DELETE FROM` thẳng. */
  khongRowid: boolean
}

/** Bảng có thật (đọc `sqlite_master` THẬT, gồm cột `sql` để nhận ra WITHOUT ROWID): MỘT truy vấn. */
async function docBangHienCo(env: Env): Promise<Map<string, ThongTinBang>> {
  const r = await env.DB.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all<{ name: string; sql: string | null }>()
  return new Map((r.results ?? []).map((x) => [String(x.name), { khongRowid: /WITHOUT\s+ROWID/i.test(String(x.sql ?? '')) }]))
}

/** Số dòng từng bảng đã phân loại (bảng chưa tồn tại → null): GỘP bằng truy vấn scalar (D1 không cho compound SELECT dài), ≤ 60 bảng một truy vấn. */
export async function demCacBang(env: Env, hienCo: ReadonlyMap<string, unknown>): Promise<Record<string, number | null>> {
  const ra: Record<string, number | null> = {}
  const co: string[] = []
  for (const t of [...BANG_XOA, ...BANG_GIU]) {
    if (hienCo.has(t) && TEN_HOP_LE.test(t)) co.push(t)
    else ra[t] = null
  }
  for (let i = 0; i < co.length; i += COT_MOI_TRUY_VAN_DEM) {
    const nhom = co.slice(i, i + COT_MOI_TRUY_VAN_DEM)
    try {
      const r = await env.DB.prepare('SELECT ' + nhom.map((t) => `(SELECT COUNT(*) FROM "${t}") AS "${t}"`).join(', ')).first<Record<string, number>>()
      for (const t of nhom) ra[t] = Number(r?.[t]) || 0
    } catch {
      for (const t of nhom) ra[t] = null
    }
  }
  return ra
}

// --- Tập mã đã dùng ---------------------------------------------------------------------------------

/** Nơi giữ MÃ CA (mã ca xuất hiện ở đâu thì nạp từ đó). */
const NGUON_MA_CA: readonly string[] = [
  'ca', 'luot', 'phieu', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'kho_ca_them', 'btvn', 'tien_do_ca', 'nhan_xet', 'nop_khac_phuc', 'chan_vao', 'de_rieng',
]
/** D1 chỉ cho compound SELECT ngắn (5 vế chạy, 8 vế lỗi trên bản thật): gộp tối đa 5 bảng một truy vấn. */
const VE_MOI_COMPOUND = 5

async function docMaDaDung(env: Env, hienCo: ReadonlyMap<string, unknown>): Promise<{ ca: string[]; btvn: string[]; mom: string[] }> {
  const ca = new Set<string>()
  const co = NGUON_MA_CA.filter((t) => hienCo.has(t))
  for (let i = 0; i < co.length; i += VE_MOI_COMPOUND) {
    const nhom = co.slice(i, i + VE_MOI_COMPOUND)
    try {
      const r = await env.DB.prepare(nhom.map((t) => `SELECT ma_ca AS ma FROM "${t}" WHERE ma_ca IS NOT NULL AND ma_ca <> ''`).join(' UNION ')).all<{ ma: string }>()
      for (const x of r.results ?? []) ca.add(String(x.ma))
    } catch { /* một bảng không có cột ma_ca ở lược đồ này: bỏ cả nhóm này khỏi tập (báo bằng số đếm ở dryRun) */ }
  }
  const btvn: string[] = []
  if (hienCo.has('btvn')) {
    const r = await env.DB.prepare("SELECT DISTINCT ma_btvn AS ma FROM btvn WHERE ma_btvn IS NOT NULL AND ma_btvn <> ''").all<{ ma: string }>()
    for (const x of r.results ?? []) btvn.push(String(x.ma))
  }
  const mom: string[] = []
  if (hienCo.has('mom_bai')) {
    const r = await env.DB.prepare("SELECT DISTINCT id AS ma FROM mom_bai WHERE id IS NOT NULL AND id <> ''").all<{ ma: string }>()
    for (const x of r.results ?? []) if (!UUID.test(String(x.ma))) mom.push(String(x.ma)) // id UUID không bao giờ trùng nên khỏi giữ
  }
  return { ca: [...ca].sort(), btvn: btvn.sort(), mom: mom.sort() }
}

const CHEN_MA = `INSERT OR IGNORE INTO ma_da_dung (loai, ma, xoa_luc)
  SELECT ?, value, ? FROM json_each(?)`

async function napMaDaDung(env: Env, ma: { ca: string[]; btvn: string[]; mom: string[] }, luc: string): Promise<void> {
  for (const [loai, ds] of [['ca', ma.ca], ['btvn', ma.btvn], ['mom', ma.mom]] as const) {
    for (let i = 0; i < ds.length; i += 1000) await env.DB.prepare(CHEN_MA).bind(loai, luc, json(ds.slice(i, i + 1000))).run()
  }
}

/** Mã này ĐÃ TỪNG DÙNG (nằm trong tập nạp lúc reset)? Chưa có bảng → false (đường cũ chạy như trước). */
export async function maDaDung(env: Env, loai: 'ca' | 'btvn' | 'mom', ma: string): Promise<boolean> {
  if (!ma) return false
  try {
    return !!(await env.DB.prepare('SELECT 1 AS x FROM ma_da_dung WHERE loai = ? AND ma = ?').bind(loai, ma).first())
  } catch {
    return false
  }
}

/** Trong `dsMa`, những mã ĐÃ TỪNG DÙNG (một truy vấn). Chưa có bảng → tập rỗng. */
export async function maDaDungTrong(env: Env, loai: 'ca' | 'btvn' | 'mom', dsMa: string[]): Promise<Set<string>> {
  const xin = [...new Set(dsMa.filter(Boolean))]
  if (xin.length === 0) return new Set()
  try {
    const r = await env.DB.prepare('SELECT ma FROM ma_da_dung WHERE loai = ? AND ma IN (SELECT value FROM json_each(?))').bind(loai, json(xin)).all<{ ma: string }>()
    return new Set((r.results ?? []).map((x) => String(x.ma)))
  } catch {
    return new Set()
  }
}

// --- Chạy thử -----------------------------------------------------------------------------------------

export interface KetQuaDryRun {
  ok: true
  dryRun: true
  mocLuc: string
  hanTuChay: string
  /** Job sẵn sàng về KỸ THUẬT (đủ bảng/migration)? false thì `lyDo` nói thiếu gì — biết NGAY ở dryRun, đừng đợi tới 00:01. */
  sanSang: boolean
  lyDo: string[]
  /** Cờ lên đạn đã bật? Không bật thì job KHÔNG chạy và KHÔNG đóng băng. */
  choPhep: boolean
  huy: boolean
  daXong: boolean
  trangThaiKhoa: TrangThaiReset | null
  xoa: { bang: string; dong: number | null }[]
  giu: { bang: string; dong: number | null }[]
  khongCoBang: string[]
  chuaPhanLoai: string[]
  tongDongSeXoa: number
  tongDongGiu: number
  maSeGiuLai: { ca: number; btvn: number; mom: number }
  /** Số truy vấn D1 dryRun đã dùng (phải ≤ TOI_DA_TRUY_VAN_MOI_LUOT). */
  soTruyVan: number
}

/** CHẠY THỬ: chỉ ĐẾM, không ghi gì, ≤ 40 truy vấn. Cho biết job sẽ xoá bảng nào, bao nhiêu dòng, giữ bảng nào, bảng nào chưa phân loại, và job đã sẵn sàng chưa. */
export async function resetDryRun(envGoc: Env): Promise<KetQuaDryRun> {
  const { env, dem } = boDemTruyVan(envGoc)
  const hienCo = await docBangHienCo(env)
  const demBang = await demCacBang(env, hienCo)
  const phanLoai = new Set([...BANG_XOA, ...BANG_GIU])
  const ma = await docMaDaDung(env, hienCo)
  const khoa = await docTrangThaiReset(env)
  const lyDo: string[] = []
  if (!hienCo.has('ma_da_dung')) lyDo.push('Chưa chạy migration-1909-ma-da-dung.sql (bảng ma_da_dung): job sẽ DỪNG, không xoá gì')
  if (!hienCo.has('cau_hinh')) lyDo.push('Thiếu bảng cau_hinh (khoá, cờ)')
  const xoa = BANG_XOA.map((bang) => ({ bang, dong: demBang[bang] ?? null }))
  const giu = BANG_GIU.map((bang) => ({ bang, dong: demBang[bang] ?? null }))
  const ra: KetQuaDryRun = {
    ok: true,
    dryRun: true,
    mocLuc: MOC_RESET,
    hanTuChay: new Date(HAN_TU_CHAY_MS).toISOString(),
    sanSang: lyDo.length === 0,
    lyDo,
    choPhep: await laChoPhep(env),
    huy: await laHuy(env),
    daXong: khoa?.trangThai === 'xong',
    trangThaiKhoa: khoa,
    xoa,
    giu,
    khongCoBang: [...phanLoai].filter((t) => !hienCo.has(t)).sort(),
    chuaPhanLoai: [...hienCo.keys()].filter((t) => !phanLoai.has(t)).sort(),
    tongDongSeXoa: xoa.reduce((t, x) => t + (x.dong ?? 0), 0),
    tongDongGiu: giu.reduce((t, x) => t + (x.dong ?? 0), 0),
    maSeGiuLai: { ca: ma.ca.length, btvn: ma.btvn.length, mom: ma.mom.length },
    soTruyVan: 0,
  }
  ra.soTruyVan = dem()
  return ra
}

// --- Chạy thật ------------------------------------------------------------------------------------------

/** Xoá MỘT lô của một bảng (một truy vấn). Bảng WITHOUT ROWID: xoá thẳng cả bảng. */
async function xoaMotLo(env: Env, ten: string, khongRowid: boolean): Promise<number> {
  // Phòng thủ hai lớp: tên phải nằm trong danh sách XOÁ và đúng định dạng — không bao giờ ghép tên từ nguồn khác vào SQL.
  if (!BANG_XOA.includes(ten) || !TEN_HOP_LE.test(ten)) throw new Error(`Bảng "${ten}" không nằm trong danh sách XOÁ`)
  const sql = khongRowid ? `DELETE FROM "${ten}"` : `DELETE FROM "${ten}" WHERE rowid IN (SELECT rowid FROM "${ten}" LIMIT ${XOA_MOI_LENH})`
  const r = await env.DB.prepare(sql).run()
  return Number(r.meta?.changes) || 0
}

async function ghiKhoa(env: Env, st: TrangThaiReset): Promise<void> {
  await env.DB.prepare('UPDATE cau_hinh SET gia_tri = ?, cap_nhat_luc = ? WHERE khoa = ?').bind(json(st), new Date().toISOString(), MA_RESET).run()
}

export interface KetQuaChayReset {
  chay: boolean
  lyDo?: 'huy' | 'khong_cho_phep' | 'chua_toi_gio' | 'da_xong' | 'dang_chay' | 'cho_tiep' | 'qua_gio' | 'loi'
  trangThai?: TrangThaiReset
  /** Số truy vấn D1 lượt này đã dùng (≤ TOI_DA_TRUY_VAN_MOI_LUOT). */
  soTruyVan: number
}

export interface TuyChonChayReset {
  /** Lệnh TAY của thầy (`/reset/chay-tiep`): bỏ qua hạn 01:00; vẫn phải có cờ cho phép và không có cờ huỷ. */
  tay?: boolean
}

/** Mở băng và bật `mocReset` NGAY trong isolate này (isolate khác trễ tối đa vài giây của bộ nhớ đệm). */
function boNhoLai(envGoc: Env): void {
  boNhoDong.delete(envGoc.DB)
  boNhoMoc.delete(envGoc.DB)
}

/**
 * CHẠY JOB (cron), CHIA BƯỚC. Mỗi lượt gọi dùng ≤ TOI_DA_TRUY_VAN_MOI_LUOT truy vấn D1; hết ngân sách thì ghi `cho_tiep` và lượt cron phút sau tiếp tục NGAY.
 * Chỉ chạy khi: có cờ cho phép, không huỷ, đã tới mốc, còn trong hạn 01:00 (trừ lệnh tay), chưa xong, và giành/nhận được khoá. Không ném lỗi ra ngoài.
 */
export async function chayReset(envGoc: Env, nowMs: number, tuyChon: TuyChonChayReset = {}): Promise<KetQuaChayReset> {
  const { env, dem } = boDemTruyVan(envGoc)
  const kq = (r: Omit<KetQuaChayReset, 'soTruyVan'>): KetQuaChayReset => ({ ...r, soTruyVan: dem() })
  const tay = tuyChon.tay === true
  if (nowMs < MOC_RESET_MS) return kq({ chay: false, lyDo: 'chua_toi_gio' })
  if (await laHuy(env)) return kq({ chay: false, lyDo: 'huy' })
  if (!(await laChoPhep(env))) return kq({ chay: false, lyDo: 'khong_cho_phep' })
  const cu = await docTrangThaiReset(env)
  if (cu?.trangThai === 'xong') return kq({ chay: false, lyDo: 'da_xong', trangThai: cu })
  if (!tay && nowMs > HAN_TU_CHAY_MS) {
    // Quá 01:00 mà chưa xong: KHÔNG tự chạy nữa (chạy lúc 08:00 là xoá bài các em vừa làm). Ghi `qua_gio` một lần, mở băng.
    if (cu && cu.trangThai !== 'qua_gio') {
      const st: TrangThaiReset = { ...cu, trangThai: 'qua_gio', quaGioLuc: new Date(nowMs).toISOString() }
      await ghiKhoa(env, st)
      boNhoLai(envGoc)
      return kq({ chay: false, lyDo: 'qua_gio', trangThai: st })
    }
    return kq({ chay: false, lyDo: 'qua_gio', trangThai: cu ?? undefined })
  }

  const hienCo = await docBangHienCo(env)
  let st: TrangThaiReset
  if (!cu) {
    // Giành khoá: chỉ MỘT lượt chạy nhận được `changes = 1`.
    const demTruoc = await demCacBang(env, hienCo)
    const muaCu = hienCo.has('game_v2_settings') ? await env.DB.prepare("SELECT json FROM game_v2_settings WHERE key = 'season'").first<{ json: string }>().then((r) => r?.json ?? null).catch(() => null) : null
    const expMoiCu = await docGiaTri(env, 'exp_moi')
    const luc = new Date(nowMs).toISOString()
    st = { trangThai: 'dang_chay', buoc: 'nap_ma', bangTiep: 0, batDauLuc: luc, tiepTucLuc: luc, soLanChay: 1, demTruoc, muaCu, expMoiCu }
    const g = await env.DB.prepare('INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)').bind(MA_RESET, json(st), luc).run()
    if (!g.meta?.changes) return kq({ chay: false, lyDo: 'dang_chay' })
  } else {
    // `cho_tiep` (đã nhường) và `qua_gio` (lệnh tay) tiếp tục NGAY; `dang_chay` chỉ khi nhịp tim đã cũ (chết). Giành bằng CAS trên đúng chuỗi cũ.
    const nhip = ms(cu.tiepTucLuc ?? cu.batDauLuc)
    if (cu.trangThai === 'dang_chay' && nowMs - nhip < QUA_HAN_DANG_CHAY_MS) return kq({ chay: false, lyDo: 'dang_chay', trangThai: cu })
    const giaTriCu = await docGiaTri(env, MA_RESET)
    st = { ...cu, trangThai: 'dang_chay', tiepTucLuc: new Date(nowMs).toISOString(), soLanChay: (cu.soLanChay || 1) + 1, loi: undefined }
    const g = await env.DB.prepare('UPDATE cau_hinh SET gia_tri = ?, cap_nhat_luc = ? WHERE khoa = ? AND gia_tri = ?').bind(json(st), st.tiepTucLuc, MA_RESET, giaTriCu).run()
    if (!g.meta?.changes) return kq({ chay: false, lyDo: 'dang_chay' })
  }

  const conNganSach = (chiPhi: number) => dem() + chiPhi + DU_TRU_GHI_KHOA <= TOI_DA_TRUY_VAN_MOI_LUOT
  const nhuong = async (): Promise<KetQuaChayReset> => {
    st.trangThai = 'cho_tiep'
    st.tiepTucLuc = new Date(nowMs).toISOString()
    await ghiKhoa(env, st)
    return kq({ chay: true, lyDo: 'cho_tiep', trangThai: st })
  }
  try {
    const phanLoai = new Set([...BANG_XOA, ...BANG_GIU])
    st.chuaPhanLoai = [...hienCo.keys()].filter((t) => !phanLoai.has(t)).sort()
    for (;;) {
      if (st.buoc === 'nap_ma') {
        // Nạp tập MÃ ĐÃ DÙNG trước khi xoá `ca`/`btvn`/`mom_bai` (lặp lại được: INSERT OR IGNORE). Chưa có bảng `ma_da_dung` thì DỪNG — không xoá khi chưa giữ được mã.
        if (!hienCo.has('ma_da_dung')) throw new Error('Chưa chạy migration-1909-ma-da-dung.sql — DỪNG, chưa xoá gì')
        if (!conNganSach(CHI_PHI_NAP_MA)) return await nhuong()
        const ma = await docMaDaDung(env, hienCo)
        await napMaDaDung(env, ma, st.batDauLuc)
        st.maDaDung = { ca: ma.ca.length, btvn: ma.btvn.length, mom: ma.mom.length }
        st.buoc = 'xoa'
        st.bangTiep = 0
        continue
      }
      if (st.buoc === 'xoa') {
        while (st.bangTiep < BANG_XOA.length && !hienCo.has(BANG_XOA[st.bangTiep]!)) st.bangTiep++
        if (st.bangTiep >= BANG_XOA.length) { st.buoc = 'chot'; continue }
        if (!conNganSach(1)) return await nhuong()
        const ten = BANG_XOA[st.bangTiep]!
        const khongRowid = hienCo.get(ten)!.khongRowid
        const n = await xoaMotLo(env, ten, khongRowid)
        if (khongRowid || n < XOA_MOI_LENH) st.bangTiep++ // lô cuối (ít hơn một lô) = bảng đã sạch
        continue
      }
      // Chốt: mùa game mới + EXP mới cho MỌI em từ đúng mốc (bỏ cờ riêng dsSbd/tuDsSbd), đếm lại, ghi `xong`.
      if (!conNganSach(CHI_PHI_CHOT)) return await nhuong()
      if (hienCo.has('game_v2_settings')) {
        await env.DB.prepare("INSERT INTO game_v2_settings (key, json) VALUES ('season', ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json").bind(json(MUA_MOI)).run()
      }
      await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
        .bind('exp_moi', json({ tu: MOC_RESET, toanBo: true }), new Date(nowMs).toISOString()).run()
      st.demSau = await demCacBang(env, await docBangHienCo(env))
      const conDu: Record<string, number> = {}
      for (const t of BANG_XOA) if ((st.demSau[t] ?? 0) > 0) conDu[t] = st.demSau[t] as number
      if (Object.keys(conDu).length) st.xoaConDu = conDu // bảng XOÁ còn dòng do em/thầy ghi trong lúc chạy; báo, không coi là lỗi
      st.soEm = st.demTruoc.hoc_sinh ?? 0
      st.xongLuc = new Date(nowMs).toISOString()
      st.trangThai = 'xong'
      await ghiKhoa(env, st)
      boNhoLai(envGoc)
      return kq({ chay: true, trangThai: st })
    }
  } catch (e) {
    st.loi = e instanceof Error ? e.message : String(e)
    console.error('[reset] LỖI (lần cron sau sẽ tiếp tục):', st.loi)
    try { await ghiKhoa(env, st) } catch { /* khoá không ghi được thì thôi */ }
    return kq({ chay: false, lyDo: 'loi', trangThai: st })
  }
}

/** Cho cron: bỏ qua rất nhanh (0 truy vấn) khi chưa tới mốc hoặc đã quá lâu sau hạn. Không ném lỗi. */
export async function chayResetNeuDenGio(env: Env, nowMs: number): Promise<KetQuaChayReset> {
  if (nowMs < MOC_RESET_MS) return { chay: false, lyDo: 'chua_toi_gio', soTruyVan: 0 }
  if (nowMs > HAN_TU_CHAY_MS + CRON_HOI_THEM_MS) return { chay: false, lyDo: 'qua_gio', soTruyVan: 0 }
  try {
    return await chayReset(env, nowMs)
  } catch (e) {
    console.error('[reset] lỗi ngoài dự kiến:', e instanceof Error ? e.message : e)
    return { chay: false, lyDo: 'loi', soTruyVan: 0 }
  }
}

/** Lệnh TAY của thầy (`/reset/chay-tiep`): làm MỘT lượt (≤ 40 truy vấn), bỏ qua hạn 01:00. Gọi lặp tới khi `trangThai.trangThai === 'xong'`. */
export async function chayTiepTay(env: Env, nowMs: number): Promise<KetQuaChayReset> {
  try {
    return await chayReset(env, nowMs, { tay: true })
  } catch (e) {
    return { chay: false, lyDo: 'loi', soTruyVan: 0, trangThai: undefined }
  }
}

// --- Đóng băng và mốc cho máy khách ---------------------------------------------------------------------------

const boNhoDong = new WeakMap<object, { at: number; dong: boolean }>()
const boNhoMoc = new WeakMap<object, { at: number; giaTri: string | null }>()

/**
 * Đang ĐÓNG BĂNG GHI? Chỉ trong [00:00, 01:00] giờ VN, và chỉ khi CÓ cờ cho phép, KHÔNG huỷ, job CHƯA `xong`/`qua_gio` (xong sớm thì mở ngay; đang xoá dở thì KHÔNG mở giữa chừng).
 * Ngoài cửa sổ: không truy vấn gì. Lỗi đọc khoá → không đóng băng (đừng làm cả trường kẹt vì một lần D1 chập chờn).
 */
export async function dangLamMoi(env: Env, nowMs: number): Promise<boolean> {
  if (nowMs < DONG_BANG_TU_MS || nowMs > HAN_TU_CHAY_MS) return false
  const c = boNhoDong.get(env.DB)
  if (c && nowMs - c.at < 2000 && nowMs >= c.at) return c.dong
  let dong = false
  try {
    if (await laChoPhep(env) && !(await laHuy(env))) {
      const t = (await docTrangThaiReset(env))?.trangThai
      dong = t !== 'xong' && t !== 'qua_gio'
    }
  } catch {
    dong = false
  }
  boNhoDong.set(env.DB, { at: nowMs, dong })
  return dong
}

export const LOI_DANG_LAM_MOI = { ok: false, error: 'Hệ thống đang làm mới, thử lại sau 1 phút', dangLamMoi: true } as const

/**
 * `mocReset` cho máy khách: "2026-09-21" CHỈ SAU KHI job đã `xong`; trước đó là null (VẮNG trường). Gửi sớm là máy khách dọn nháp bài của học sinh ngay tối Chủ nhật.
 * Đã xong thì nhớ mãi trong isolate; chưa xong thì nhớ 5 giây. Trước mốc: không truy vấn nào.
 */
export async function docMocReset(env: Env, nowMs: number = Date.now()): Promise<string | null> {
  if (nowMs < MOC_RESET_MS) return null
  const c = boNhoMoc.get(env.DB)
  if (c && (c.giaTri !== null || (nowMs - c.at < 5000 && nowMs >= c.at))) return c.giaTri
  let giaTri: string | null = null
  try {
    const st = await docTrangThaiReset(env)
    if (st?.trangThai === 'xong' && st.xongLuc) giaTri = MOC_RESET_CHUOI
  } catch { /* không đọc được: coi như chưa xong */ }
  boNhoMoc.set(env.DB, { at: nowMs, giaTri })
  return giaTri
}

// --- Đo giới hạn truy vấn D1 mỗi lượt gọi (chẩn đoán, chỉ đọc) -------------------------------------------------

/** Chạy `SELECT 1` liên tiếp trong MỘT lượt gọi cho tới khi D1/Worker từ chối (hoặc tới `toiDa`): cho biết giới hạn thật của gói đang dùng (Free 50 / Paid 1000). */
export async function doGioiHanTruyVan(env: Env, toiDa = 1100): Promise<{ ok: true; soTruyVanThanhCong: number; biTuChoi: boolean; loi: string | null }> {
  let n = 0
  try {
    for (; n < toiDa; n++) await env.DB.prepare('SELECT 1 AS x').first()
    return { ok: true, soTruyVanThanhCong: n, biTuChoi: false, loi: null }
  } catch (e) {
    return { ok: true, soTruyVanThanhCong: n, biTuChoi: true, loi: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200) }
  }
}
