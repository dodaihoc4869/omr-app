// RESET TOÀN APP — 00:01 giờ Việt Nam thứ Hai 21/09/2026, MỘT LẦN (thầy chốt 19/09: "reset toàn app xoá hết ca thi và toàn bộ dữ liệu vào 00:01 thứ 2
// để app mới hoàn toàn công bằng cho học sinh"; 0.Planer duyệt bảng phân loại 58 bảng).
//
// AN TOÀN, theo thứ tự:
//   · Hai danh sách CỐ ĐỊNH `BANG_XOA` / `BANG_GIU`: job CHỈ xoá bảng trong `BANG_XOA` (tên đi vào SQL chỉ từ hằng này, có kiểm định dạng). Bảng nào có trong D1 mà không
//     thuộc danh sách nào (`chuaPhanLoai`) thì KHÔNG bị đụng và được báo cáo; test khoá "mọi bảng của lược đồ phải được phân loại" nên thêm bảng mới là buộc phải quyết.
//   · Bảng trong danh sách mà chưa tồn tại (chưa chạy migration) thì BỎ QUA, không làm chết job.
//   · MỘT LẦN: khoá `cau_hinh.reset_20260921` giành bằng INSERT OR IGNORE (hai cron 17:01 UTC và mỗi phút không chạy đôi). Khoá `xong` thì không bao giờ chạy lại. Đang chạy dở
//     quá QUA_HAN_DANG_CHAY_MS (chưa nhịp tim) thì lượt khác được TIẾP TỤC: mọi bước xoá đều lặp lại được.
//   · CỜ HUỶ `cau_hinh.reset_20260921_huy` = true → không chạy. CỜ CHẠY THỬ: `resetDryRun` chỉ đếm, không ghi gì.
//   · Sao lưu: trước khi xoá, khoá ghi `batDauLuc` (mốc D1 Time Travel) và `demTruoc` (số dòng từng bảng); tập mã đã dùng nạp vào `ma_da_dung` TRƯỚC khi xoá `ca`.
//     Ngoài job: bản export .sql tối Chủ nhật và R2 giữ nguyên (docs/reset-2109.md).
//   · KHÔNG đụng: tài khoản/mật khẩu/token (`hoc_sinh`), danh sách lớp, kho đề/câu hỏi, chỉ mục game, cấu hình thầy, cài đặt em, đăng ký push, thống kê dùng app, R2.
import type { Env } from './kieu'

export const MA_RESET = 'reset_20260921'
export const KHOA_HUY = 'reset_20260921_huy'
/** 00:01 giờ VN thứ Hai 21/09/2026. */
export const MOC_RESET = '2026-09-20T17:01:00.000Z'
export const MOC_RESET_MS = Date.parse(MOC_RESET)
/** Giá trị máy khách nhận (`mocReset`) SAU KHI job xong. */
export const MOC_RESET_CHUOI = '2026-09-21'
export const MUA_MOI = { id: '2026-09-21-mua-1', startedAt: MOC_RESET }
/** Cửa sổ đóng băng ghi: [00:00, 00:20] giờ VN. Job xong sớm thì mở băng ngay. */
export const DONG_BANG_TU_MS = Date.parse('2026-09-20T17:00:00.000Z')
export const DONG_BANG_DEN_MS = Date.parse('2026-09-20T17:20:00.000Z')
/** Job coi là chết nếu quá ngần này không có nhịp tim. */
export const QUA_HAN_DANG_CHAY_MS = 3 * 60_000
const XOA_MOI_LENH = 4000
/** Sau ngần này ngày kể từ mốc thì cron mỗi phút thôi hỏi khoá (đỡ tốn truy vấn). */
const NGAY_CRON_HOI_KHOA = 3

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

export interface TrangThaiReset {
  trangThai: 'dang_chay' | 'xong'
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
  soEm?: number
  loi?: string
}

async function docGiaTri(env: Env, khoa: string): Promise<string | null> {
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string | null }>()
    return r ? String(r.gia_tri ?? '') : null
  } catch {
    return null
  }
}

export async function laHuy(env: Env): Promise<boolean> {
  const v = await docGiaTri(env, KHOA_HUY)
  if (v === null) return false
  const s = v.trim().toLowerCase()
  if (s === 'true' || s === '1') return true
  try {
    const o = JSON.parse(v) as unknown
    return o === true || (typeof o === 'object' && o !== null && (o as { huy?: unknown }).huy === true)
  } catch {
    return false
  }
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

async function tenBangHienCo(env: Env): Promise<Set<string>> {
  const r = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all<{ name: string }>()
  return new Set((r.results ?? []).map((x) => String(x.name)))
}

async function demMotBang(env: Env, ten: string): Promise<number | null> {
  if (!TEN_HOP_LE.test(ten)) return null
  try {
    const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM "${ten}"`).first<{ n: number }>()
    return Number(r?.n) || 0
  } catch {
    return null
  }
}

/** Số dòng từng bảng đã phân loại (bảng chưa tồn tại → null). */
export async function demCacBang(env: Env, hienCo: Set<string>): Promise<Record<string, number | null>> {
  const ra: Record<string, number | null> = {}
  for (const t of [...BANG_XOA, ...BANG_GIU]) ra[t] = hienCo.has(t) ? await demMotBang(env, t) : null
  return ra
}

// --- Tập mã đã dùng ---------------------------------------------------------------------------------

/** Nơi giữ MÃ CA (mã ca xuất hiện ở đâu thì nạp từ đó). */
const NGUON_MA_CA: readonly string[] = [
  'ca', 'luot', 'phieu', 'chi_tiet_cau', 'ban_do_sai', 'phong_cho', 'kho_ca_them', 'btvn', 'tien_do_ca', 'nhan_xet', 'nop_khac_phuc', 'chan_vao', 'de_rieng',
]

async function docMaDaDung(env: Env, hienCo: Set<string>): Promise<{ ca: string[]; btvn: string[]; mom: string[] }> {
  const ca = new Set<string>()
  for (const t of NGUON_MA_CA) {
    if (!hienCo.has(t)) continue
    try {
      const r = await env.DB.prepare(`SELECT DISTINCT ma_ca AS ma FROM "${t}" WHERE ma_ca IS NOT NULL AND ma_ca <> ''`).all<{ ma: string }>()
      for (const x of r.results ?? []) ca.add(String(x.ma))
    } catch { /* bảng không có cột ma_ca ở lược đồ này: bỏ */ }
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
    for (let i = 0; i < ds.length; i += 500) await env.DB.prepare(CHEN_MA).bind(loai, luc, json(ds.slice(i, i + 500))).run()
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

// --- Chạy thử -----------------------------------------------------------------------------------------

export interface KetQuaDryRun {
  ok: true
  dryRun: true
  mocLuc: string
  daXong: boolean
  huy: boolean
  trangThaiKhoa: TrangThaiReset | null
  xoa: { bang: string; dong: number | null }[]
  giu: { bang: string; dong: number | null }[]
  khongCoBang: string[]
  chuaPhanLoai: string[]
  tongDongSeXoa: number
  tongDongGiu: number
  maSeGiuLai: { ca: number; btvn: number; mom: number }
}

/** CHẠY THỬ: chỉ ĐẾM, không ghi gì. Cho biết job sẽ xoá bảng nào, bao nhiêu dòng, giữ bảng nào, và bảng nào chưa được phân loại. */
export async function resetDryRun(env: Env): Promise<KetQuaDryRun> {
  const hienCo = await tenBangHienCo(env)
  const dem = await demCacBang(env, hienCo)
  const phanLoai = new Set([...BANG_XOA, ...BANG_GIU])
  const ma = await docMaDaDung(env, hienCo)
  const xoa = BANG_XOA.map((bang) => ({ bang, dong: dem[bang] ?? null }))
  const giu = BANG_GIU.map((bang) => ({ bang, dong: dem[bang] ?? null }))
  return {
    ok: true,
    dryRun: true,
    mocLuc: MOC_RESET,
    daXong: (await docTrangThaiReset(env))?.trangThai === 'xong',
    huy: await laHuy(env),
    trangThaiKhoa: await docTrangThaiReset(env),
    xoa,
    giu,
    khongCoBang: [...phanLoai].filter((t) => !hienCo.has(t)).sort(),
    chuaPhanLoai: [...hienCo].filter((t) => !phanLoai.has(t)).sort(),
    tongDongSeXoa: xoa.reduce((t, x) => t + (x.dong ?? 0), 0),
    tongDongGiu: giu.reduce((t, x) => t + (x.dong ?? 0), 0),
    maSeGiuLai: { ca: ma.ca.length, btvn: ma.btvn.length, mom: ma.mom.length },
  }
}

// --- Chạy thật ------------------------------------------------------------------------------------------

async function xoaMotBang(env: Env, ten: string): Promise<number> {
  // Phòng thủ hai lớp: tên phải nằm trong danh sách XOÁ và đúng định dạng — không bao giờ ghép tên từ nguồn khác vào SQL.
  if (!BANG_XOA.includes(ten) || !TEN_HOP_LE.test(ten)) throw new Error(`Bảng "${ten}" không nằm trong danh sách XOÁ`)
  let tong = 0
  for (;;) {
    const r = await env.DB.prepare(`DELETE FROM "${ten}" WHERE rowid IN (SELECT rowid FROM "${ten}" LIMIT ${XOA_MOI_LENH})`).run()
    const n = Number(r.meta?.changes) || 0
    tong += n
    if (n < XOA_MOI_LENH) return tong
  }
}

async function ghiKhoa(env: Env, st: TrangThaiReset, nowMs: number): Promise<void> {
  await env.DB.prepare('UPDATE cau_hinh SET gia_tri = ?, cap_nhat_luc = ? WHERE khoa = ?').bind(json(st), new Date(nowMs).toISOString(), MA_RESET).run()
}

export interface KetQuaChayReset {
  chay: boolean
  lyDo?: 'huy' | 'chua_toi_gio' | 'da_xong' | 'dang_chay' | 'loi'
  trangThai?: TrangThaiReset
}

/**
 * CHẠY JOB (cron). Chỉ chạy khi: không huỷ, đã tới mốc, chưa xong, và giành được khoá. Không ném lỗi ra ngoài: lỗi ghi vào khoá và lần cron sau (mỗi phút)
 * tiếp tục sau QUA_HAN_DANG_CHAY_MS.
 */
export async function chayReset(env: Env, nowMs: number): Promise<KetQuaChayReset> {
  if (nowMs < MOC_RESET_MS) return { chay: false, lyDo: 'chua_toi_gio' }
  if (await laHuy(env)) return { chay: false, lyDo: 'huy' }
  const cu = await docTrangThaiReset(env)
  if (cu?.trangThai === 'xong') return { chay: false, lyDo: 'da_xong', trangThai: cu }

  const hienCo = await tenBangHienCo(env)
  let st: TrangThaiReset
  if (!cu) {
    // Giành khoá: chỉ MỘT lượt chạy nhận được `changes = 1`.
    const demTruoc = await demCacBang(env, hienCo)
    const muaCu = hienCo.has('game_v2_settings') ? await env.DB.prepare("SELECT json FROM game_v2_settings WHERE key = 'season'").first<{ json: string }>().then((r) => r?.json ?? null).catch(() => null) : null
    const expMoiCu = await docGiaTri(env, 'exp_moi')
    st = { trangThai: 'dang_chay', batDauLuc: new Date(nowMs).toISOString(), tiepTucLuc: new Date(nowMs).toISOString(), soLanChay: 1, demTruoc, muaCu, expMoiCu }
    const g = await env.DB.prepare('INSERT OR IGNORE INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?)').bind(MA_RESET, json(st), st.batDauLuc).run()
    if (!g.meta?.changes) return { chay: false, lyDo: 'dang_chay' }
  } else {
    // Đã có khoá đang chạy: chỉ tiếp tục khi nhịp tim quá cũ, và giành bằng CAS trên đúng chuỗi cũ.
    const nhip = ms(cu.tiepTucLuc ?? cu.batDauLuc)
    if (nowMs - nhip < QUA_HAN_DANG_CHAY_MS) return { chay: false, lyDo: 'dang_chay', trangThai: cu }
    const giaTriCu = await docGiaTri(env, MA_RESET)
    st = { ...cu, tiepTucLuc: new Date(nowMs).toISOString(), soLanChay: (cu.soLanChay || 1) + 1, loi: undefined }
    const g = await env.DB.prepare('UPDATE cau_hinh SET gia_tri = ?, cap_nhat_luc = ? WHERE khoa = ? AND gia_tri = ?').bind(json(st), st.tiepTucLuc, MA_RESET, giaTriCu).run()
    if (!g.meta?.changes) return { chay: false, lyDo: 'dang_chay' }
  }

  try {
    const phanLoai = new Set([...BANG_XOA, ...BANG_GIU])
    st.chuaPhanLoai = [...hienCo].filter((t) => !phanLoai.has(t)).sort()

    // 1) Nạp tập MÃ ĐÃ DÙNG trước khi xoá `ca`/`btvn`/`mom_bai` (INSERT OR IGNORE: lặp lại được; chưa có bảng `ma_da_dung` thì DỪNG — không xoá khi chưa giữ được mã).
    if (!hienCo.has('ma_da_dung')) throw new Error('Chưa chạy migration-1909-ma-da-dung.sql — DỪNG, chưa xoá gì')
    const ma = await docMaDaDung(env, hienCo)
    await napMaDaDung(env, ma, st.batDauLuc)
    st.maDaDung = { ca: ma.ca.length, btvn: ma.btvn.length, mom: ma.mom.length }
    await ghiKhoa(env, st, nowMs)

    // 2) Xoá theo lô, từng bảng; sau mỗi bảng ghi nhịp tim. Bảng chưa tồn tại thì bỏ qua.
    for (const ten of BANG_XOA) {
      if (!hienCo.has(ten)) continue
      await xoaMotBang(env, ten)
      st.tiepTucLuc = new Date().toISOString()
      await ghiKhoa(env, st, Date.now())
    }

    // 3) Mùa game mới + EXP mới cho MỌI em từ đúng mốc (bỏ cờ riêng dsSbd/tuDsSbd: mọi em cùng vạch xuất phát).
    if (hienCo.has('game_v2_settings')) {
      await env.DB.prepare("INSERT INTO game_v2_settings (key, json) VALUES ('season', ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json").bind(json(MUA_MOI)).run()
    }
    await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
      .bind('exp_moi', json({ tu: MOC_RESET, toanBo: true }), new Date().toISOString()).run()

    // 4) Đếm lại, ghi kết quả; MỞ BĂNG ngay khi khoá `xong`.
    const hienCoSau = await tenBangHienCo(env)
    st.demSau = await demCacBang(env, hienCoSau)
    const conDu: Record<string, number> = {}
    for (const t of BANG_XOA) if ((st.demSau[t] ?? 0) > 0) conDu[t] = st.demSau[t] as number
    if (Object.keys(conDu).length) st.xoaConDu = conDu // bảng XOÁ còn dòng do em/thầy ghi trong lúc chạy; báo, không coi là lỗi
    st.soEm = st.demTruoc.hoc_sinh ?? 0
    st.xongLuc = new Date().toISOString()
    st.trangThai = 'xong'
    await ghiKhoa(env, st, Date.now())
    boNhoDong.delete(env.DB) // mở băng và bật `mocReset` NGAY trong isolate này (isolate khác chờ tối đa vài giây của bộ nhớ đệm)
    boNhoMoc.delete(env.DB)
    return { chay: true, trangThai: st }
  } catch (e) {
    st.loi = e instanceof Error ? e.message : String(e)
    console.error('[reset] LỖI (lần cron sau sẽ tiếp tục):', st.loi)
    try { await ghiKhoa(env, st, nowMs) } catch { /* khoá không ghi được thì thôi */ }
    return { chay: false, lyDo: 'loi', trangThai: st }
  }
}

/** Cho cron: bỏ qua rất nhanh khi chưa tới mốc hoặc đã quá lâu sau mốc. Không ném lỗi. */
export async function chayResetNeuDenGio(env: Env, nowMs: number): Promise<KetQuaChayReset> {
  if (nowMs < MOC_RESET_MS) return { chay: false, lyDo: 'chua_toi_gio' }
  if (nowMs > MOC_RESET_MS + NGAY_CRON_HOI_KHOA * 86_400_000) return { chay: false, lyDo: 'da_xong' }
  try {
    return await chayReset(env, nowMs)
  } catch (e) {
    console.error('[reset] lỗi ngoài dự kiến:', e instanceof Error ? e.message : e)
    return { chay: false, lyDo: 'loi' }
  }
}

// --- Đóng băng và mốc cho máy khách ---------------------------------------------------------------------------

const boNhoDong = new WeakMap<object, { at: number; dong: boolean }>()
const boNhoMoc = new WeakMap<object, { at: number; giaTri: string | null }>()

/**
 * Đang ĐÓNG BĂNG GHI? Chỉ trong cửa sổ [00:00, 00:20] giờ VN, chưa huỷ, và job CHƯA `xong` (xong sớm thì mở ngay). Ngoài cửa sổ: không truy vấn gì.
 * Lỗi đọc khoá → không đóng băng (đừng làm cả trường kẹt vì một lần D1 chập chờn).
 */
export async function dangLamMoi(env: Env, nowMs: number): Promise<boolean> {
  if (nowMs < DONG_BANG_TU_MS || nowMs > DONG_BANG_DEN_MS) return false
  const c = boNhoDong.get(env.DB)
  if (c && nowMs - c.at < 2000 && nowMs >= c.at) return c.dong
  let dong = true
  try {
    if (await laHuy(env)) dong = false
    else if ((await docTrangThaiReset(env))?.trangThai === 'xong') dong = false
  } catch {
    dong = false
  }
  boNhoDong.set(env.DB, { at: nowMs, dong })
  return dong
}

export const LOI_DANG_LAM_MOI = { ok: false, error: 'Hệ thống đang làm mới, thử lại sau 1 phút', dangLamMoi: true } as const

/**
 * `mocReset` cho máy khách: "2026-09-21" CHỈ SAU KHI job đã `xong`; trước đó là null (VẮNG trường). Gửi sớm là máy khách dọn nháp bài của học sinh ngay tối Chủ nhật.
 * Đã xong thì nhớ mãi trong isolate; chưa xong thì nhớ 5 giây.
 */
export async function docMocReset(env: Env, nowMs: number = Date.now()): Promise<string | null> {
  if (nowMs < MOC_RESET_MS) return null // trước mốc không thể có job xong: không tốn truy vấn nào trên các đường hay gọi (/hs/ca-dang-mo…)
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
