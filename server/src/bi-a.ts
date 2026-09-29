// BI-A PHẢN ỨNG — lệnh máy chủ `bia-*` (đặc tả DAC-TA-BI-A-PHAN-UNG-2809.md mục 4, 5, 9; hợp đồng docs/hop-dong-bi-a.md).
// Không có bộ chấm/EXP/kế hoạch thứ hai: câu lấy từ đúng kế hoạch ngày đã chốt (`layKeHoachHomNay`), trả lời qua `answer` chung
// (phiên `mode:'bia'`, `hoa2:1`, `bia:1`), nên Thể lực, EXP (trần 120/ngày), lịch ôn, Câu đã làm tự khớp như Đảo và Đoàn.
// Trần Bi-a (thầy chốt 28/09): tối đa floor(40% phần Đoàn) + floor(40% phần Đảo) của kế hoạch hôm nay.
import type { Env, DongCa, DongLuot } from './kieu'
import { docCauHinhDem } from './cau-hinh-dem'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { publicQuestion } from '../../src/game/than-thu-v2/core'
import { protectedQuestions } from './game-v2-bank'
import { HANG_MUC_DO } from './srs2-loi'
import { cheDo2, docCoHoa2Tu, docNhanNo, layKeHoachHomNay, ngayVnCua, qidGoc, type HoSo2, type KeHoachDaChot, type MetaCau } from './srs2-d1'
import { cauDangGiu, DK_PHIEN_BIA_MO, DK_PHIEN_DAO_DOAN, goiYCho, napCau, type RefPhien } from './srs2-game'
import { quyetDinhVaoThi } from './luat-vao-thi'
import { docVe, kyVe } from './bi-a-ve'
import { biCuaGhe, chiaBi, giayCau } from '../../src/game/bi-a/luat'
import { laKiHieu } from '../../src/game/bi-a/nguyen-to'
import { ELO_DAU, type CauBi } from '../../src/game/bi-a/tran'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

export const LENH_BIA: ReadonlySet<string> = new Set(['bia-sanh', 'bia-xep-ban', 'bia-doi-cau', 'bia-ket-van', 'bia-tao-ban', 'bia-vao-ban', 'bia-moi', 'bia-loi-moi', 'bia-tra-loi-moi', 'bia-tra-loi'])
/** Khoá cờ riêng (không nhét vào `game_hoa_2` vì `coLuu` của nó ghi đè đúng 3 trường). Giá trị `{bat, lop[], sbd[]}`. */
export const KHOA_CO_BIA = 'bi_a'
export const TI_LE_TRAN_BIA = 0.4
export const TOI_DA_GIAO_HUU = 2
const HAN_PHIEN_MS = 2 * 3_600_000
const SO_BI_HOP_LE: ReadonlySet<number> = new Set([7, 4, 3])

export const LOI_BIA = {
  chua_bat: 'Bi-a Phản Ứng chưa mở cho em. Thầy sẽ mở sớm.',
  dang_co_ca: 'Đang có ca kiểm tra. Bi-a mở lại khi ca kết thúc.',
  chua_co_chien_dich: 'Hôm nay chưa có câu nào cho em. Thầy giao chiến dịch là bàn bi-a mở.',
  het_tran: 'Hết câu Bi-a hôm nay. Em sang Đoàn Hộ Tống và Bát Linh Đảo làm tiếp nhé.',
  xong_ke_hoach: 'Hôm nay em xong kế hoạch rồi. Em chơi Bàn giao hữu được (không câu, không EXP).',
  cau_dang_bao_ve: 'Các câu hôm nay đang dùng cho ca kiểm tra. Em quay lại sau khi ca kết thúc nhé.',
  giao_huu_chua_mo: 'Bàn giao hữu mở khi em xong kế hoạch hôm nay.',
  het_luot_giao_huu: `Hôm nay em đã chơi đủ ${TOI_DA_GIAO_HUU} ván giao hữu. Mai quay lại nhé.`,
} as const
export type LyDoKhoaBia = keyof typeof LOI_BIA

// ---------------------------------------------------------------- bảng (dựng tại chỗ)
/**
 * CI deploy KHÔNG tự chạy migration ⇒ dựng bảng CHỈ-THÊM ngay tại chỗ, y hệt `server/migration-2809-bi-a.sql`
 * (mẫu `ca-thi-them.ts`). `IF NOT EXISTS` nên chạy lại vô hại; không đụng bảng có sẵn. Mỗi CSDL một lần mỗi isolate.
 */
export const SQL_BANG_BIA: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS bi_a_van (id TEXT PRIMARY KEY, loai TEXT NOT NULL, che_do TEXT NOT NULL, ngay TEXT NOT NULL, chu_ban TEXT NOT NULL, trang_thai TEXT NOT NULL, doi_thang INTEGER, diem_0 INTEGER, diem_1 INTEGER, json TEXT, tao_luc TEXT NOT NULL, xong_luc TEXT)',
  'CREATE INDEX IF NOT EXISTS bi_a_van_chu_ngay ON bi_a_van(chu_ban, ngay)',
  'CREATE TABLE IF NOT EXISTS bi_a_ghe (van TEXT NOT NULL, ghe INTEGER NOT NULL, doi INTEGER NOT NULL, sbd TEXT, session TEXT, dung INTEGER NOT NULL DEFAULT 0, sai INTEGER NOT NULL DEFAULT 0, an INTEGER NOT NULL DEFAULT 0, vang INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (van, ghe))',
  'CREATE INDEX IF NOT EXISTS bi_a_ghe_sbd ON bi_a_ghe(sbd)',
  'CREATE TABLE IF NOT EXISTS bi_a_diem_ban (sbd TEXT PRIMARY KEY, diem INTEGER NOT NULL DEFAULT 1000, so_van INTEGER NOT NULL DEFAULT 0, cap_nhat TEXT)',
  'CREATE TABLE IF NOT EXISTS bi_a_moi (id TEXT PRIMARY KEY, tu_sbd TEXT NOT NULL, den_sbd TEXT NOT NULL, loai TEXT NOT NULL, van TEXT, ghe INTEGER, trang_thai TEXT NOT NULL, tao_luc TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS bi_a_moi_den ON bi_a_moi(den_sbd, trang_thai)',
  'CREATE TABLE IF NOT EXISTS bi_a_co_mat (sbd TEXT PRIMARY KEY, ten_lop TEXT, last_seen TEXT NOT NULL, con_tran INTEGER)',
  'CREATE INDEX IF NOT EXISTS bi_a_co_mat_lop ON bi_a_co_mat(ten_lop, last_seen)',
]
const bangDaDung = new WeakMap<object, Promise<void>>()
export function damBaoBangBia(env: Env): Promise<void> {
  const db = env.DB as unknown as object
  let p = bangDaDung.get(db)
  if (!p) {
    p = env.DB.batch(SQL_BANG_BIA.map((s) => env.DB.prepare(s)))
      // GĐ2 thêm cột (CHỈ THÊM): bảng đã dựng ở bản GĐ1 chưa có `con_tran` — ALTER một lần, "đã có cột" thì bỏ qua.
      .then(() => env.DB.prepare('ALTER TABLE bi_a_co_mat ADD COLUMN con_tran INTEGER').run().catch(() => undefined))
      .then(() => undefined)
    p.catch(() => bangDaDung.delete(db)) // lỗi ⇒ lượt sau thử lại
    bangDaDung.set(db, p)
  }
  return p
}

// ---------------------------------------------------------------- cờ + khoá
export async function docCoBia(env: Env) {
  return docCoHoa2Tu(await docCauHinhDem(env, KHOA_CO_BIA)) // đệm 15 s trong isolate (cau-hinh-dem.ts)
}
/** Bi-a mở cho em khi: Game Hóa 2.0 mở cho em (Sảnh Bát Linh) VÀ cờ `bi_a` bật cho em (theo sbd, theo lớp, hoặc cả trường khi không liệt kê). Lỗi đọc ⇒ đóng. */
export async function biaMoCho(env: Env, sbd: string): Promise<boolean> {
  try {
    const co = await docCoBia(env)
    if (!co.bat) return false
    if (!(await cheDo2(env, sbd))) return false
    if (co.sbd.includes(sbd)) return true
    if (!co.lop.length && !co.sbd.length) return true
    if (!co.lop.length) return false
    const r = await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ lop: string }>().catch(() => null)
    return !!r && co.lop.includes(str(r.lop))
  } catch { return false }
}
/**
 * Em đang có ca kiểm tra mở (G9: Bi-a đóng hẳn). Dùng đúng luật cổng vào thi (`quyetDinhVaoThi`) trên ca `mo` của lớp em — cùng nguồn với `/hs/ca-dang-mo`,
 * nhưng KHÔNG xét phạm vi khối/danh sách chọn (chặt hơn một chút: ca của lớp đang mở là đóng Bi-a). Lỗi đọc ⇒ coi như không có ca.
 */
export async function coCaDangMo(env: Env, sbd: string, nowMs: number): Promise<boolean> {
  try {
    const em = await env.DB.prepare(`SELECT COALESCE(NULLIF(h.lop, ''), d.lop, '') AS lop FROM (SELECT ? AS sbd) x LEFT JOIN hoc_sinh h ON h.sbd = x.sbd LEFT JOIN danh_sach d ON d.sbd = x.sbd`)
      .bind(sbd).first<{ lop: string }>()
    const lop = str(em?.lop).trim()
    if (!lop) return false
    const r = await env.DB.prepare(`SELECT c.trang_thai, c.loai, c.bat_dau, c.het_han_vao, c.thoi_gian_phut, c.dong_bo_gio, c.bat_dau_thi_luc, c.han_nop,
        (SELECT l.trang_thai FROM luot l WHERE l.ma_ca = c.ma_ca AND l.sbd = ? ORDER BY l.lan_thu DESC LIMIT 1) AS luot_tt
        FROM ca c WHERE c.trang_thai = 'mo' AND COALESCE(c.loai, 'thi') = 'thi' AND TRIM(COALESCE(c.lop, '')) = ?`).bind(sbd, lop).all<Row>()
    for (const c of r.results ?? []) {
      const luot = c.luot_tt ? ({ trang_thai: str(c.luot_tt), lan_thu: 1, id_thiet_bi: '' } as unknown as DongLuot) : null
      if (quyetDinhVaoThi(c as unknown as DongCa, luot, '', nowMs).ok) return true
    }
    return false
  } catch { return false }
}

// ---------------------------------------------------------------- trần 40%
export interface TranBia { tranDoan: number; tranDao: number; tong: number; daDungDoan: number; daDungDao: number; conDoan: number; conDao: number; con: number }
/** Thuần: trần của từng phần theo kế hoạch đã chốt và số câu Bi-a đã dùng (đã trả lời hôm nay + đang giữ trên bàn). */
export function tinhTranBia(soKhoaDoan: number, soKhoaDao: number, daDungDoan: number, daDungDao: number): TranBia {
  const tranDoan = Math.floor(TI_LE_TRAN_BIA * soKhoaDoan)
  const tranDao = Math.floor(TI_LE_TRAN_BIA * soKhoaDao)
  const conDoan = Math.max(0, tranDoan - daDungDoan)
  const conDao = Math.max(0, tranDao - daDungDao)
  return { tranDoan, tranDao, tong: tranDoan + tranDao, daDungDoan, daDungDao, conDoan, conDao, con: conDoan + conDao }
}
const phanCua = (kh: KeHoachDaChot) => {
  const doan = new Set(kh.doan.map(qidGoc)), dao = new Set(kh.dao.map(qidGoc))
  return (qid: string): 'doan' | 'dao' | null => (doan.has(qid) ? 'doan' : dao.has(qid) ? 'dao' : null)
}
const dauNgayVn = (ngay: string): string => new Date(`${ngay}T00:00:00+07:00`).toISOString()

interface BoiCanh {
  kh: KeHoachDaChot
  hs: HoSo2
  tran: TranBia
  /** Câu không được đưa lên bàn: đang bảo vệ cho ca thi, đang giữ ở Đảo/Đoàn, đang giữ ở bàn Bi-a khác. */
  chan: Set<string>
  /** Khoá kế hoạch còn chưa làm, theo phần, đã lọc `chan`. */
  ungDoan: string[]
  ungDao: string[]
}
async function boiCanh(env: Env, sbd: string, nowMs: number): Promise<BoiCanh> {
  const { kh, hs } = await layKeHoachHomNay(env, sbd, nowMs)
  const phan = phanCua(kh)
  // Câu trả lời trong phiên Bi-a hôm nay (mỗi câu tính một lần).
  const da = await env.DB.prepare(`SELECT DISTINCT a.qid AS qid FROM game_v2_attempt a JOIN game_v2_session s ON s.id = a.session AND s.sbd = a.sbd
      WHERE a.sbd = ? AND a.created_at >= ? AND json_extract(s.json,'$.bia') = 1`).bind(sbd, dauNgayVn(kh.ngay)).all<Row>().catch(() => ({ results: [] as Row[] }))
  // Câu đang nằm trên bàn Bi-a còn mở (kể cả bàn đang chơi) mà chưa trả lời: đã giữ chỗ trong trần.
  const giuBia = await cauDangGiu(env, sbd, nowMs, DK_PHIEN_BIA_MO)
  let dDoan = 0, dDao = 0
  const dem = (qid: string) => { const p = phan(qid); if (p === 'doan') dDoan++; else if (p === 'dao') dDao++ }
  for (const x of da.results ?? []) dem(str(x.qid))
  for (const q of giuBia) dem(q)
  const tran = tinhTranBia(kh.doan.length, kh.dao.length, dDoan, dDao)
  const chan = await protectedQuestions(env)
  for (const q of await cauDangGiu(env, sbd, nowMs, DK_PHIEN_DAO_DOAN)) chan.add(q)
  for (const q of giuBia) chan.add(q)
  const loc = (ds: readonly string[]) => ds.filter((k) => !chan.has(qidGoc(k)))
  return { kh, hs, tran, chan, ungDoan: loc(kh.conDoan), ungDao: loc(kh.conDao) }
}

// ---------------------------------------------------------------- câu công khai
type CauBia = Record<string, unknown>
const cauCongKhai = (q: PrivateQuestion, ref: RefPhien): CauBia => ({ ...publicQuestion(q), vai: ref.role, ...(ref.goiY ? { goiY: ref.goiY } : {}) })
function taoRef(q: PrivateQuestion, m: MetaCau, hs: HoSo2, sbd: string, ngay: string, laChot: boolean): RefPhien {
  const t = hs.tt.get(q.qid)
  const g = goiYCho(q, t, `${sbd}|${q.qid}|${ngay}`)
  return { qid: q.qid, maDe: m.maDe, version: m.version, group: m.group, novel: !!t?.laMoi, role: laChot ? 'trum' : t?.laMoi ? 'moi' : 'on_lai', ...(g ? { goiY: g } : {}) }
}
const hangMuc = (m: string | null | undefined): number => (m != null && m in HANG_MUC_DO ? HANG_MUC_DO[m]! : -1)
/**
 * G1: Câu chốt = câu Vận dụng (hạng ≥ 2) trong phần được phép, ưu tiên câu ÔN đang sai (cc = 0); không có câu Vận dụng thì câu khó nhất còn lại.
 * Trả thứ tự ứng viên (tốt nhất trước) để nạp thử lần lượt (câu rút khỏi kho / tự luận bị `napCau` bỏ).
 */
export function xepUngVienChot(khoa: readonly string[], hs: Pick<HoSo2, 'meta' | 'tt'>): string[] {
  const diem = (k: string) => {
    const q = qidGoc(k), m = hs.meta.get(q), t = hs.tt.get(q)
    const h = hangMuc(m?.mucDo)
    return (h >= 2 ? 1000 : 0) + (t && !t.laMoi && t.cc === 0 ? 100 : 0) + h
  }
  return khoa.map((k, i) => [k, i] as const).sort((a, b) => diem(b[0]) - diem(a[0]) || a[1] - b[1]).map(([k]) => k)
}

async function napMot(env: Env, hs: HoSo2, khoa: readonly string[], chan: ReadonlySet<string>) {
  // Tối ưu 28/09: napCau đã nạp theo lô (một truy vấn) và bỏ câu hỏng ⇒ không lặp từng câu (N+1). Kết quả y hệt: câu dùng được ĐẦU TIÊN.
  const [x] = await napCau(env, hs, khoa, 1, chan)
  return x ?? null
}

// ---------------------------------------------------------------- lệnh
export async function biaAction(env: Env, sbd: string, action: string, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  if (!(await biaMoCho(env, sbd))) return { ok: true, bat: false, lyDoKhoa: 'chua_bat', message: LOI_BIA.chua_bat }
  if (await coCaDangMo(env, sbd, nowMs)) return { ok: true, bat: true, lyDoKhoa: 'dang_co_ca', message: LOI_BIA.dang_co_ca }
  await damBaoBangBia(env)
  if (action === 'bia-sanh') return sanhBia(env, sbd, nowMs)
  if (action === 'bia-xep-ban') return xepBan(env, sbd, b, nowMs)
  if (action === 'bia-doi-cau') return doiCau(env, sbd, b, nowMs)
  if (action === 'bia-ket-van') return ketVan(env, sbd, b, nowMs)
  if (action === 'bia-tao-ban') return taoBanOnline(env, sbd, b, nowMs)
  if (action === 'bia-vao-ban') return vaoBanMa(env, sbd, b, nowMs)
  if (action === 'bia-moi') return moiBan(env, sbd, b, nowMs)
  if (action === 'bia-loi-moi') return loiMoi(env, sbd, b, nowMs)
  if (action === 'bia-tra-loi-moi') return traLoiMoi(env, sbd, b, nowMs)
  if (action === 'bia-tra-loi') return chiTraLoi(env, sbd, b, nowMs)
  return { ok: false, error: 'Lệnh không hợp lệ.' }
}

async function demGiaoHuuHomNay(env: Env, sbd: string, ngay: string): Promise<number> {
  const r = await env.DB.prepare(`SELECT COUNT(DISTINCT v.id) AS n FROM bi_a_van v JOIN bi_a_ghe g ON g.van = v.id WHERE g.sbd = ? AND v.ngay = ? AND v.loai = 'giao_huu'`)
    .bind(sbd, ngay).first<{ n: number }>().catch(() => null)
  return Number(r?.n) || 0
}

/** Tóm tắt cho màn Sảnh Bi-a (và cửa trên Sảnh Bát Linh). */
async function sanhBia(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  const c = await boiCanh(env, sbd, nowMs)
  const { kh, hs, tran } = c
  const conKeHoach = kh.conDao.length + kh.conDoan.length
  const coCau = Math.min(tran.conDoan, c.ungDoan.length) + Math.min(tran.conDao, c.ungDao.length)
  const xong = kh.tong > 0 && conKeHoach === 0
  const daGiaoHuu = xong ? await demGiaoHuuHomNay(env, sbd, kh.ngay) : 0
  const lyDoKhoa: LyDoKhoaBia | null = !kh.tong ? 'chua_co_chien_dich' : xong ? 'xong_ke_hoach' : coCau <= 0 ? (tran.con <= 0 ? 'het_tran' : 'cau_dang_bao_ve') : null
  const cd = hs.chienDich
  return {
    ok: true, bat: true, ngay: kh.ngay,
    ...(lyDoKhoa ? { lyDoKhoa, message: LOI_BIA[lyDoKhoa] } : {}),
    chienDich: cd ? { id: cd.id, ten: cd.ten, hanNop: cd.hanNop, tong: cd.qids.length } : null,
    theLuc: { con: conKeHoach, tong: kh.tong },
    doan: { con: kh.conDoan.length }, dao: { con: kh.conDao.length },
    tran: { con: coCau, tong: tran.tong, tranDoan: tran.tranDoan, tranDao: tran.tranDao, conDoan: Math.min(tran.conDoan, c.ungDoan.length), conDao: Math.min(tran.conDao, c.ungDao.length) },
    giaoHuu: { mo: xong && daGiaoHuu < TOI_DA_GIAO_HUU, con: xong ? Math.max(0, TOI_DA_GIAO_HUU - daGiaoHuu) : 0, toiDa: TOI_DA_GIAO_HUU },
    online: !!env.BAN_BIA,
    diemBan: await docDiemBan(env, sbd),
  }
}
async function docDiemBan(env: Env, sbd: string): Promise<{ diem: number; soVan: number }> {
  const r = await env.DB.prepare('SELECT diem, so_van FROM bi_a_diem_ban WHERE sbd = ?').bind(sbd).first<Row>().catch(() => null)
  return { diem: Number(r?.diem) || ELO_DAU, soVan: Number(r?.so_van) || 0 }
}

/** Đóng mọi ván Bi-a còn mở của em (G8: mỗi em một ván mở; vào ván mới là bỏ ván cũ — câu chưa trả lời tự về kế hoạch). */
async function dongVanCu(env: Env, sbd: string, nowMs: number, truVan = ''): Promise<void> {
  const luc = new Date(nowMs).toISOString()
  await env.DB.prepare(`UPDATE game_v2_session SET json = json_set(json, '$.dong', 1) WHERE sbd = ? AND json_extract(json,'$.bia') = 1 AND COALESCE(json_extract(json,'$.dong'),0) = 0 AND COALESCE(json_extract(json,'$.van'),'') <> ?`).bind(sbd, truVan).run()
  await env.DB.prepare(`UPDATE bi_a_van SET trang_thai = 'bo', xong_luc = ? WHERE chu_ban = ? AND trang_thai IN ('mo','cho') AND id <> ?`).bind(luc, sbd, truVan).run()
}

async function taoVan(env: Env, id: string, loai: 'ai' | 'giao_huu', cheDo: 'don' | 'doi', ngay: string, sbd: string, session: string | null, nowMs: number) {
  const luc = new Date(nowMs).toISOString()
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO bi_a_van (id, loai, che_do, ngay, chu_ban, trang_thai, tao_luc) VALUES (?,?,?,?,?, 'mo', ?)`).bind(id, loai, cheDo, ngay, sbd, luc),
    env.DB.prepare('INSERT INTO bi_a_ghe (van, ghe, doi, sbd, session) VALUES (?, 1, 0, ?, ?)').bind(id, sbd, session),
  ])
}

/** Kết quả chọn câu cho các bi của MỘT em (dùng chung cho ván A.I và ván online). */
type ChonCau =
  | { ok: false; kq: Record<string, unknown> }
  | { ok: true; session: string; cau: CauBia[]; qs: PrivateQuestion[]; chot: CauBia | null; chotQ: PrivateQuestion | null; tranCon: number; tranTong: number; kh: KeHoachDaChot }
/**
 * Chọn Câu chốt (G1) rồi tối đa `soBi` câu cho bi (phần Đoàn trước tới hết trần phần Đoàn, rồi phần Đảo; giữ thứ tự kế hoạch), tạo phiên
 * `{mode:'bia', hoa2:1, bia:1, van, cheDo, questions}`. Hết câu / hết trần ⇒ `ok:false` kèm lý do cho em.
 */
async function chonCauBan(env: Env, sbd: string, nowMs: number, soBi: number, van: string, cheDo: 'don' | 'doi', them: Record<string, unknown> = {}, coChot = true): Promise<ChonCau> {
  const c = await boiCanh(env, sbd, nowMs)
  const { kh, hs, tran } = c
  const conKeHoach = kh.conDao.length + kh.conDoan.length
  if (!kh.tong) return { ok: false, kq: { ok: true, lyDo: 'chua_co_chien_dich', message: LOI_BIA.chua_co_chien_dich } }
  if (conKeHoach === 0) return { ok: false, kq: { ok: true, lyDo: 'xong_ke_hoach', message: LOI_BIA.xong_ke_hoach } }
  let conDoan = Math.min(tran.conDoan, c.ungDoan.length), conDao = Math.min(tran.conDao, c.ungDao.length)
  if (conDoan + conDao <= 0) return { ok: false, kq: { ok: true, lyDo: tran.con <= 0 ? 'het_tran' : 'cau_dang_bao_ve', message: tran.con <= 0 ? LOI_BIA.het_tran : LOI_BIA.cau_dang_bao_ve, conDoan: kh.conDoan.length, conDao: kh.conDao.length } }
  // Câu chốt trước (G1), trong phần còn trần.
  const phepDoan = conDoan > 0 ? c.ungDoan : []
  const phepDao = conDao > 0 ? c.ungDao : []
  const chon = coChot ? await napMot(env, hs, xepUngVienChot([...phepDoan, ...phepDao], hs), c.chan) : null
  const daLay = new Set<string>()
  const refs: RefPhien[] = []
  const cau: CauBia[] = [], qs: PrivateQuestion[] = []
  let chot: CauBia | null = null
  if (chon) {
    const ref = taoRef(chon.q, chon.m, hs, sbd, kh.ngay, true)
    refs.push(ref); chot = cauCongKhai(chon.q, ref); daLay.add(chon.q.qid)
    if (c.ungDoan.some((k) => qidGoc(k) === chon.q.qid)) conDoan--; else conDao--
  }
  // Bi thường: câu ôn phần Đoàn trước (tới hết trần phần Đoàn), rồi phần Đảo; giữ thứ tự kế hoạch.
  const chanThem = new Set([...c.chan, ...daLay])
  const bi = [
    ...(conDoan > 0 ? await napCau(env, hs, c.ungDoan, Math.min(conDoan, soBi), chanThem) : []),
  ]
  for (const x of bi) chanThem.add(x.q.qid)
  if (bi.length < soBi && conDao > 0) bi.push(...(await napCau(env, hs, c.ungDao, Math.min(conDao, soBi - bi.length), chanThem)))
  for (const x of bi) {
    const ref = taoRef(x.q, x.m, hs, sbd, kh.ngay, false)
    refs.push(ref); cau.push(cauCongKhai(x.q, ref)); qs.push(x.q)
  }
  if (!refs.length) return { ok: false, kq: { ok: true, lyDo: 'cau_dang_bao_ve', message: LOI_BIA.cau_dang_bao_ve } }
  // Sổ nợ (29/09): nhãn nợ trên câu ôn ("Sai 2 lần · Ca 26/09 · …") — một truy vấn sổ; lỗi ⇒ không nhãn.
  const nhan = await docNhanNo(env, sbd, hs, refs.map((r) => r.qid)).catch(() => new Map<string, string>())
  for (const r of refs) { const n = nhan.get(r.qid); if (n) r.nhanNo = n }
  for (const x of [...cau, ...(chot ? [chot] : [])]) { const n = nhan.get(str(x.qid)); if (n) x.nhanNo = n }
  const session = crypto.randomUUID()
  await env.DB.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)')
    .bind(session, sbd, JSON.stringify({ mode: 'bia', created: nowMs, hoa2: 1, bia: 1, van, cheDo, ...them, questions: refs }), new Date(nowMs).toISOString()).run()
  return { ok: true, session, cau, qs, chot, chotQ: chon?.q ?? null, tranCon: Math.max(0, tran.con - refs.length), tranTong: tran.tong, kh }
}

async function xepBan(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  if (b.veGhe != null) return xepBanOnline(env, sbd, b, nowMs)
  const loai = str(b.loai) === 'giao_huu' ? 'giao_huu' : 'ai'
  const cheDo = str(b.cheDo) === 'doi' ? 'doi' : 'don'
  const soBi = SO_BI_HOP_LE.has(Number(b.soBi)) ? Number(b.soBi) : cheDo === 'doi' ? 4 : 7
  await dongVanCu(env, sbd, nowMs)
  const van = crypto.randomUUID()
  if (loai === 'giao_huu') {
    const { kh } = await layKeHoachHomNay(env, sbd, nowMs)
    if (!kh.tong) return { ok: true, lyDo: 'chua_co_chien_dich', message: LOI_BIA.chua_co_chien_dich }
    if (kh.conDao.length + kh.conDoan.length > 0) return { ok: true, lyDo: 'giao_huu_chua_mo', message: LOI_BIA.giao_huu_chua_mo }
    const n = await demGiaoHuuHomNay(env, sbd, kh.ngay)
    if (n >= TOI_DA_GIAO_HUU) return { ok: true, lyDo: 'het_luot_giao_huu', message: LOI_BIA.het_luot_giao_huu }
    await taoVan(env, van, 'giao_huu', cheDo, kh.ngay, sbd, null, nowMs)
    return { ok: true, van, loai, cheDo, bi: [], chot: null, giaoHuu: { con: Math.max(0, TOI_DA_GIAO_HUU - n - 1), toiDa: TOI_DA_GIAO_HUU } }
  }
  const r = await chonCauBan(env, sbd, nowMs, soBi, van, cheDo)
  if (!r.ok) return r.kq
  await taoVan(env, van, 'ai', cheDo, r.kh.ngay, sbd, r.session, nowMs)
  return {
    ok: true, van, session: r.session, loai, cheDo, soBi,
    bi: r.cau, trong: Math.max(0, soBi - r.cau.length), chot: r.chot,
    tran: { con: r.tranCon, tong: r.tranTong },
    theLuc: { con: r.kh.conDao.length + r.kh.conDoan.length, tong: r.kh.tong }, conDoan: r.kh.conDoan.length, conDao: r.kh.conDao.length,
  }
}

interface PhienBia { mode: string; created: number; bia?: number; dong?: number; van?: string; online?: number; questions: RefPhien[] }
async function docPhien(env: Env, sbd: string, id: string, nowMs: number): Promise<PhienBia> {
  const r = await env.DB.prepare('SELECT json FROM game_v2_session WHERE id = ? AND sbd = ?').bind(id, sbd).first<{ json: string }>()
  if (!r) throw new Error('Không tìm thấy ván Bi-a của em.')
  const p = JSON.parse(r.json) as PhienBia
  if (p.bia !== 1) throw new Error('Phiên này không phải ván Bi-a.')
  if (p.dong === 1) throw new Error('Ván Bi-a này đã kết thúc.')
  if (nowMs - p.created > HAN_PHIEN_MS) throw new Error('Ván Bi-a đã quá 2 giờ. Em vào ván mới.')
  return p
}

/** Bi sai ⇒ đổi sang câu khác CÙNG DẠNG trong phần còn trần (không có thì câu kế tiếp); hết trần ⇒ bi trống. Câu chốt sai ⇒ câu Vận dụng kế tiếp. */
async function doiCau(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const id = str(b.session), qidCu = str(b.qidCu), laChot = b.chot === true
  const p = await docPhien(env, sbd, id, nowMs)
  const cu = p.questions.find((q) => q.qid === qidCu)
  if (!cu) throw new Error('Câu không thuộc ván Bi-a này.')
  const daTl = await env.DB.prepare('SELECT 1 AS co FROM game_v2_attempt WHERE id = ? AND sbd = ?').bind(`${id}|${qidCu}`, sbd).first<Row>()
  if (!daTl) throw new Error('Em trả lời câu này trước rồi mới đổi câu.')
  const c = await boiCanh(env, sbd, nowMs)
  const { kh, hs, tran } = c
  for (const q of p.questions) c.chan.add(q.qid)
  const conDoan = Math.min(tran.conDoan, c.ungDoan.length), conDao = Math.min(tran.conDao, c.ungDao.length)
  const phep = [...(conDoan > 0 ? c.ungDoan : []), ...(conDao > 0 ? c.ungDao : [])]
  if (!phep.length) return { ok: true, trong: true, ...(await veTrong(env, p, sbd, b, nowMs)) }
  const dang = hs.meta.get(qidCu)?.dang ?? null
  const cungDang = phep.filter((k) => dang && hs.meta.get(qidGoc(k))?.dang === dang)
  const thu = laChot ? xepUngVienChot(phep, hs) : [...cungDang, ...phep.filter((k) => !cungDang.includes(k))]
  const x = await napMot(env, hs, thu, c.chan)
  if (!x) return { ok: true, trong: true, ...(await veTrong(env, p, sbd, b, nowMs)) }
  const ref = taoRef(x.q, x.m, hs, sbd, kh.ngay, laChot)
  p.questions.push(ref)
  await env.DB.prepare('UPDATE game_v2_session SET json = ? WHERE id = ? AND sbd = ?').bind(JSON.stringify(p), id, sbd).run()
  const cauMoi = cauCongKhai(x.q, ref)
  if (p.online === 1 && p.van && laKiHieu(b.ki)) {
    const ve = await kyVe(env, { k: 'cau', van: p.van, sbd, ki: b.ki, cau: cauBiCua(x.q), het: nowMs + HAN_VE_MS })
    return { ok: true, trong: false, cau: cauMoi, ve }
  }
  return { ok: true, trong: false, cau: cauMoi }
}

interface GheVao { ghe: number; doi: number; ai: boolean; dung: number; sai: number; an: number; vang: number }
const soNguyen = (v: unknown, lo: number, hi: number): number => Math.max(lo, Math.min(hi, Math.floor(Number(v) || 0)))

/** Kết thúc ván: ghi `bi_a_van` + `bi_a_ghe`, đóng phiên (câu chưa trả lời tự về kế hoạch). Số câu đúng/sai của em lấy từ `game_v2_attempt` (máy chủ), không tin máy. */
async function ketVan(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const van = str(b.van)
  const v = await env.DB.prepare('SELECT * FROM bi_a_van WHERE id = ? AND chu_ban = ?').bind(van, sbd).first<Row>()
  if (!v) throw new Error('Không tìm thấy ván Bi-a của em.')
  const kq = (b.ketQua && typeof b.ketQua === 'object' ? b.ketQua : {}) as Row
  const lyDo = ['thang', 'thua', 'bo'].includes(str(kq.lyDo)) ? str(kq.lyDo) : 'bo'
  const doiThang = kq.doiThang === 0 || kq.doiThang === 1 ? Number(kq.doiThang) : null
  const diem = Array.isArray(kq.diem) ? kq.diem : []
  const luc = new Date(nowMs).toISOString()
  const soGhe = str(v.che_do) === 'doi' ? 4 : 2
  const gheVao: GheVao[] = (Array.isArray(b.ghe) ? b.ghe : []).filter((g): g is Row => !!g && typeof g === 'object').map((g) => ({
    ghe: soNguyen(g.ghe, 1, soGhe), doi: soNguyen(g.doi, 0, 1), ai: g.ai === true,
    dung: soNguyen(g.dung, 0, 99), sai: soNguyen(g.sai, 0, 99), an: soNguyen(g.an, 0, 7), vang: soNguyen(g.vang, 0, 7),
  }))
  if (str(v.trang_thai) !== 'mo') return { ok: true, daGhiTruoc: true }
  const session = await env.DB.prepare('SELECT session FROM bi_a_ghe WHERE van = ? AND ghe = 1').bind(van).first<Row>()
  let dung = 0, sai = 0
  if (session?.session) {
    const r = await env.DB.prepare("SELECT json_extract(json,'$.attempt.correct') AS c FROM game_v2_attempt WHERE session = ? AND sbd = ?").bind(str(session.session), sbd).all<Row>()
    for (const x of r.results ?? []) { if (Number(x.c) === 1 || x.c === true) dung++; else sai++ }
  }
  const em = gheVao.find((g) => g.ghe === 1)
  const q = [
    env.DB.prepare(`UPDATE bi_a_van SET trang_thai = ?, doi_thang = ?, diem_0 = ?, diem_1 = ?, json = ?, xong_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
      .bind(lyDo === 'bo' ? 'bo' : 'xong', doiThang, soNguyen(diem[0], 0, 9999), soNguyen(diem[1], 0, 9999), JSON.stringify({ lyDo, soCu: soNguyen(b.soCu, 0, 999) }), luc, van),
    env.DB.prepare('UPDATE bi_a_ghe SET dung = ?, sai = ?, an = ?, vang = ? WHERE van = ? AND ghe = 1').bind(dung, sai, em?.an ?? 0, em?.vang ?? 0, van),
    ...gheVao.filter((g) => g.ghe !== 1 && g.ai).map((g) => env.DB.prepare('INSERT OR IGNORE INTO bi_a_ghe (van, ghe, doi, sbd, session, dung, sai, an, vang) VALUES (?,?,?,NULL,NULL,?,?,?,?)')
      .bind(van, g.ghe, g.doi, g.dung, g.sai, g.an, g.vang)),
  ]
  if (session?.session) q.push(env.DB.prepare(`UPDATE game_v2_session SET json = json_set(json, '$.dong', 1) WHERE id = ? AND sbd = ?`).bind(str(session.session), sbd))
  await env.DB.batch(q)
  const { kh } = await layKeHoachHomNay(env, sbd, nowMs)
  return { ok: true, van, dung, sai, theLuc: { con: kh.conDao.length + kh.conDoan.length, tong: kh.tong } }
}

// ---------------------------------------------------------------- TRẢ LỜI CÂU HỎI (không cần chơi) — thầy lệnh 29/09
/** Số câu mỗi lượt của chế độ chỉ trả lời (làm hết lượt thì xin lượt sau; trần Bi-a vẫn là trần chung). */
export const SO_CAU_TRA_LOI = 10
/**
 * Chế độ "Trả lời câu hỏi": lấy ĐÚNG các câu Bi-a hôm nay của em — cùng `chonCauBan` (cùng nguồn kế hoạch, cùng trần 40%, cùng luật chặn câu
 * đang bảo vệ cho ca / đang giữ ở Đảo-Đoàn, `napCau` bỏ câu tự luận), không Câu chốt, KHÔNG đáp án (câu công khai). Phiên là phiên Bi-a
 * thường (`bia:1`, thêm `chiCau:1`) ⇒ chấm qua `answer` chung, sổ `su_kien_hoc` nguồn Bi-a, EXP v5, và câu đã trả lời ở đây tính vào
 * trần + không hỏi lại ở ván bi-a hôm đó. Không tạo dòng `bi_a_van` (không phải một ván). Vào lượt mới là đóng phiên Bi-a cũ (G8).
 */
async function chiTraLoi(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  // Em rời màn: đóng ĐÚNG phiên chỉ-trả-lời của em ⇒ câu chưa trả lời về lại kế hoạch ngay (không giữ chỗ 2 giờ).
  if (b.dong === true) {
    await env.DB.prepare(`UPDATE game_v2_session SET json = json_set(json, '$.dong', 1) WHERE id = ? AND sbd = ? AND json_extract(json,'$.bia') = 1 AND json_extract(json,'$.chiCau') = 1`).bind(str(b.session), sbd).run()
    return { ok: true, dong: true }
  }
  await dongVanCu(env, sbd, nowMs)
  // `van` riêng (không có dòng bi_a_van) để `dongVanCu` lần sau đóng được phiên này.
  const r = await chonCauBan(env, sbd, nowMs, SO_CAU_TRA_LOI, `tl-${crypto.randomUUID()}`, 'don', { chiCau: 1 }, false)
  if (!r.ok) return r.kq
  return { ok: true, session: r.session, cau: r.cau, tran: { con: r.tranCon, tong: r.tranTong }, theLuc: { con: r.kh.conDao.length + r.kh.conDoan.length, tong: r.kh.tong } }
}

/** Phần `bia` trả kèm `hoa2-sanh` để Sảnh Bát Linh vẽ cửa thứ ba. Cờ tắt ⇒ `{ bat:false }` (không vẽ cửa). Lỗi ⇒ `{ bat:false }`. */
export async function biaChoSanh(env: Env, sbd: string, nowMs: number): Promise<Record<string, unknown>> {
  try {
    if (!(await biaMoCho(env, sbd))) return { bat: false }
    if (await coCaDangMo(env, sbd, nowMs)) return { bat: true, lyDoKhoa: 'dang_co_ca', con: 0, tong: 0, giaoHuu: { mo: false, con: 0 } }
    const s = await sanhBia(env, sbd, nowMs)
    const t = s.tran as { con: number; tong: number }, g = s.giaoHuu as { mo: boolean; con: number }
    return { bat: true, con: t.con, tong: t.tong, giaoHuu: { mo: g.mo, con: g.con }, ...(s.lyDoKhoa ? { lyDoKhoa: s.lyDoKhoa } : {}) }
  } catch { return { bat: false } }
}

/** Ngày VN hiện tại — xuất lại cho test. */
export const ngayBia = (nowMs: number): string => ngayVnCua(nowMs)

// ---------------------------------------------------------------- ĐẤU VỚI BẠN (GĐ2, đặc tả 6.2, 6.3, 8.2)
// Sảnh chỉ làm việc "giấy tờ" (tạo bàn, mã bàn, mời, có mặt, xếp câu cho ghế) rồi cấp VÉ KÝ; mọi thứ trong ván do phòng đấu `BanBiA` giữ.
const HAN_VE_MS = 2 * 3_600_000
const GIAY_CO_MAT = 20
const GIAY_MOI = 60
const loaiBan = (x: unknown): 'ban' | 'giao_huu' => (x === 'giao_huu' ? 'giao_huu' : 'ban')
const cheDoBan = (x: unknown): 'don' | 'doi' => (x === 'doi' ? 'doi' : 'don')
const cauBiCua = (q: PrivateQuestion): CauBi => ({ qid: q.qid, muc: q.mucDo ?? 'NB', giay: giayCau(q.phan) })
const truocGiay = (nowMs: number, giay: number) => new Date(nowMs - giay * 1000).toISOString()
async function emCua(env: Env, sbd: string): Promise<{ ten: string; lop: string }> {
  const r = await env.DB.prepare(`SELECT COALESCE(NULLIF(h.ho_ten, ''), d.ho_ten, x.sbd) AS ten, COALESCE(NULLIF(h.lop, ''), d.lop, '') AS lop
      FROM (SELECT ? AS sbd) x LEFT JOIN hoc_sinh h ON h.sbd = x.sbd LEFT JOIN danh_sach d ON d.sbd = x.sbd`).bind(sbd).first<Row>()
  return { ten: str(r?.ten) || sbd, lop: str(r?.lop).trim() }
}
/** Em vào được bàn loại này không: bàn tính câu cần còn trần Bi-a; Bàn giao hữu cần đã xong kế hoạch và còn lượt (G2). */
async function kiemVaoOnline(env: Env, sbd: string, loai: 'ban' | 'giao_huu', nowMs: number): Promise<void> {
  if (!env.BAN_BIA) throw new Error('Đấu với bạn chưa mở.')
  const s = await sanhBia(env, sbd, nowMs)
  const gh = s.giaoHuu as { mo: boolean }, tran = s.tran as { con: number }
  if (loai === 'giao_huu') { if (!gh.mo) throw new Error(s.lyDoKhoa === 'xong_ke_hoach' ? LOI_BIA.het_luot_giao_huu : LOI_BIA.giao_huu_chua_mo); return }
  if (s.lyDoKhoa || !(tran.con > 0)) throw new Error(str(s.message) || LOI_BIA.het_tran)
}
async function maBanMoi(env: Env, nowMs: number): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const ma = String(1000 + Math.floor(Math.random() * 9000))
    const trung = await env.DB.prepare("SELECT 1 AS co FROM bi_a_van WHERE trang_thai = 'cho' AND json_extract(json,'$.ma') = ? AND tao_luc >= ?").bind(ma, new Date(nowMs - HAN_VE_MS).toISOString()).first<Row>()
    if (!trung) return ma
  }
  throw new Error('Chưa cấp được mã bàn. Em thử lại.')
}
async function veSanh(env: Env, o: { van: string; sbd: string; cheDo: 'don' | 'doi'; loai: 'ban' | 'giao_huu'; chu: boolean; ma: string | null }, nowMs: number): Promise<string> {
  const em = await emCua(env, o.sbd)
  return kyVe(env, { k: 'sanh', ...o, ten: em.ten, het: nowMs + HAN_VE_MS })
}
/** Tạo bàn (chủ bàn ngồi ghế 1, Phe Kim loại, phá bàn). Trả mã bàn 4 chữ số + vé vào phòng. */
async function taoBanOnline(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const cheDo = cheDoBan(b.cheDo), loai = loaiBan(b.loai)
  await kiemVaoOnline(env, sbd, loai, nowMs)
  await dongVanCu(env, sbd, nowMs)
  const van = crypto.randomUUID(), ma = await maBanMoi(env, nowMs)
  await env.DB.prepare(`INSERT INTO bi_a_van (id, loai, che_do, ngay, chu_ban, trang_thai, json, tao_luc) VALUES (?,?,?,?,?, 'cho', ?, ?)`)
    .bind(van, loai, cheDo, ngayVnCua(nowMs), sbd, JSON.stringify({ ma, online: 1 }), new Date(nowMs).toISOString()).run()
  return { ok: true, van, ma, cheDo, loai, ve: await veSanh(env, { van, sbd, cheDo, loai, chu: true, ma }, nowMs) }
}
/** Nhập mã bàn (bạn ngồi cạnh). */
async function vaoBanMa(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const ma = str(b.ma).replace(/\D/g, '')
  if (!/^\d{4}$/.test(ma)) throw new Error('Mã bàn gồm 4 chữ số.')
  const v = await env.DB.prepare("SELECT id, loai, che_do, chu_ban FROM bi_a_van WHERE trang_thai = 'cho' AND json_extract(json,'$.ma') = ? AND tao_luc >= ? ORDER BY tao_luc DESC LIMIT 1")
    .bind(ma, new Date(nowMs - HAN_VE_MS).toISOString()).first<Row>()
  if (!v) throw new Error('Không thấy bàn có mã này. Bàn đã đóng hoặc đã bắt đầu.')
  const loai = loaiBan(v.loai), cheDo = cheDoBan(v.che_do), laChu = str(v.chu_ban) === sbd
  if (!laChu) await kiemVaoOnline(env, sbd, loai, nowMs)
  return { ok: true, van: str(v.id), ma, cheDo, loai, ve: await veSanh(env, { van: str(v.id), sbd, cheDo, loai, chu: laChu, ma }, nowMs) }
}
/** Chủ bàn mời một bạn cùng lớp đang ở Sảnh Bi-a (thấy trong 20 giây). Lời mời hết hạn sau 60 giây. */
async function moiBan(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const van = str(b.van), den = str(b.den)
  const v = await env.DB.prepare('SELECT loai, chu_ban, trang_thai FROM bi_a_van WHERE id = ?').bind(van).first<Row>()
  if (!v || str(v.chu_ban) !== sbd || str(v.trang_thai) !== 'cho') throw new Error('Bàn không còn chờ người.')
  if (!den || den === sbd) throw new Error('Em chọn một bạn để mời.')
  const em = await emCua(env, sbd)
  const co = await env.DB.prepare('SELECT 1 AS co FROM bi_a_co_mat WHERE sbd = ? AND ten_lop = ? AND last_seen >= ?').bind(den, em.lop, truocGiay(nowMs, GIAY_CO_MAT)).first<Row>()
  if (!co) throw new Error('Bạn này không còn ở Sảnh Bi-a.')
  const cu = await env.DB.prepare("SELECT id FROM bi_a_moi WHERE van = ? AND den_sbd = ? AND trang_thai = 'cho' AND tao_luc >= ?").bind(van, den, truocGiay(nowMs, GIAY_MOI)).first<Row>()
  if (cu) return { ok: true, id: str(cu.id) }
  const id = crypto.randomUUID()
  await env.DB.prepare("INSERT INTO bi_a_moi (id, tu_sbd, den_sbd, loai, van, ghe, trang_thai, tao_luc) VALUES (?,?,?,?,?, NULL, 'cho', ?)").bind(id, sbd, den, loaiBan(v.loai), van, new Date(nowMs).toISOString()).run()
  return { ok: true, id }
}
/**
 * Hỏi mỗi 6 giây, CHỈ khi em đang ở Sảnh Bi-a (đặc tả 6.2): ghi "có mặt" (kèm số câu Bi-a còn của em để bạn thấy), trả bạn cùng lớp đang ở Sảnh,
 * lời mời đang chờ em, và bạn đã trả lời lời mời của em. Một lô D1 (1 ghi + 3 đọc).
 */
async function loiMoi(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const em = await emCua(env, sbd)
  const con = Math.max(0, Math.min(999, Math.floor(Number(b.con) || 0)))
  const luc = new Date(nowMs).toISOString(), hanMoi = truocGiay(nowMs, GIAY_MOI)
  const [, ban, moi, phanHoi] = await env.DB.batch<Row>([
    env.DB.prepare('INSERT INTO bi_a_co_mat (sbd, ten_lop, last_seen, con_tran) VALUES (?,?,?,?) ON CONFLICT(sbd) DO UPDATE SET ten_lop = excluded.ten_lop, last_seen = excluded.last_seen, con_tran = excluded.con_tran').bind(sbd, em.lop, luc, con),
    env.DB.prepare(`SELECT c.sbd, c.con_tran, COALESCE(NULLIF(h.ho_ten, ''), c.sbd) AS ten FROM bi_a_co_mat c LEFT JOIN hoc_sinh h ON h.sbd = c.sbd
        WHERE c.ten_lop = ? AND c.ten_lop <> '' AND c.sbd <> ? AND c.last_seen >= ? ORDER BY ten LIMIT 40`).bind(em.lop, sbd, truocGiay(nowMs, GIAY_CO_MAT)),
    env.DB.prepare(`SELECT m.id, m.loai, m.tao_luc, v.che_do, COALESCE(NULLIF(h.ho_ten, ''), m.tu_sbd) AS ten FROM bi_a_moi m JOIN bi_a_van v ON v.id = m.van LEFT JOIN hoc_sinh h ON h.sbd = m.tu_sbd
        WHERE m.den_sbd = ? AND m.trang_thai = 'cho' AND m.tao_luc >= ? AND v.trang_thai = 'cho' ORDER BY m.tao_luc DESC LIMIT 3`).bind(sbd, hanMoi),
    env.DB.prepare(`SELECT m.id, m.trang_thai, COALESCE(NULLIF(h.ho_ten, ''), m.den_sbd) AS ten FROM bi_a_moi m LEFT JOIN hoc_sinh h ON h.sbd = m.den_sbd
        WHERE m.tu_sbd = ? AND m.trang_thai IN ('tu_choi', 'nhan') AND m.tao_luc >= ?`).bind(sbd, hanMoi),
  ])
  return {
    ok: true,
    ban: (ban?.results ?? []).map((x) => ({ sbd: str(x.sbd), ten: str(x.ten), conTran: Math.max(0, Number(x.con_tran) || 0) })),
    moi: (moi?.results ?? []).map((x) => ({ id: str(x.id), tu: str(x.ten), cheDo: cheDoBan(x.che_do), loai: loaiBan(x.loai), conGiay: Math.max(0, Math.round((Date.parse(str(x.tao_luc)) + GIAY_MOI * 1000 - nowMs) / 1000)) })),
    phanHoi: (phanHoi?.results ?? []).map((x) => ({ id: str(x.id), ten: str(x.ten), nhan: str(x.trang_thai) === 'nhan' })),
  }
}
async function traLoiMoi(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const m = await env.DB.prepare(`SELECT m.id, m.van, m.trang_thai, m.tao_luc, v.loai, v.che_do, v.trang_thai AS vtt, v.json AS vjson FROM bi_a_moi m JOIN bi_a_van v ON v.id = m.van WHERE m.id = ? AND m.den_sbd = ?`)
    .bind(str(b.id), sbd).first<Row>()
  if (!m || str(m.trang_thai) !== 'cho' || str(m.tao_luc) < truocGiay(nowMs, GIAY_MOI)) throw new Error('Lời mời đã hết hạn.')
  if (b.nhan !== true) { await env.DB.prepare("UPDATE bi_a_moi SET trang_thai = 'tu_choi' WHERE id = ?").bind(str(m.id)).run(); return { ok: true, tuChoi: true } }
  if (str(m.vtt) !== 'cho') throw new Error('Bàn đã bắt đầu hoặc đã đóng.')
  const loai = loaiBan(m.loai), cheDo = cheDoBan(m.che_do)
  await kiemVaoOnline(env, sbd, loai, nowMs)
  await env.DB.prepare("UPDATE bi_a_moi SET trang_thai = 'nhan' WHERE id = ?").bind(str(m.id)).run()
  let ma: string | null = null
  try { ma = str((JSON.parse(str(m.vjson)) as Row).ma) || null } catch { ma = null }
  return { ok: true, van: str(m.van), cheDo, loai, ma, ve: await veSanh(env, { van: str(m.van), sbd, cheDo, loai, chu: false, ma }, nowMs) }
}
/**
 * Phòng đấu đã Bắt đầu và cấp vé ghế ⇒ xếp câu cho ĐÚNG các bi của ghế đó (đấu đơn 7; đánh đôi người 1 của phe 4, người 2 của phe 3 — G11),
 * trả câu công khai theo kí hiệu bi + vé trận (câu của từng bi, Câu chốt, phiên) để em đưa lại cho phòng.
 */
async function xepBanOnline(env: Env, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const v = await docVe(env, b.veGhe, 'ghe', nowMs)
  if (v.sbd !== sbd) throw new Error('Vé ghế không phải của em.')
  const kis = biCuaGhe(chiaBi(v.cheDo), v.ghe)
  const ve = (bi: Record<string, CauBi>, chot: CauBi | null, session: string | null) => kyVe(env, { k: 'tran', van: v.van, ghe: v.ghe, sbd, session, bi, chot, het: nowMs + HAN_VE_MS })
  if (v.loai === 'giao_huu') {
    await kiemVaoOnline(env, sbd, 'giao_huu', nowMs)
    return { ok: true, van: v.van, ghe: v.ghe, loai: v.loai, cheDo: v.cheDo, session: null, bi: kis.map((ki) => ({ ki, cau: null })), chot: null, veTran: await ve({}, null, null) }
  }
  await dongVanCu(env, sbd, nowMs, v.van)
  const r = await chonCauBan(env, sbd, nowMs, kis.length, v.van, v.cheDo, { online: 1, ghe: v.ghe })
  if (!r.ok) return r.kq
  const bi: Record<string, CauBi> = {}
  r.qs.forEach((q, i) => { if (kis[i]) bi[kis[i]!] = cauBiCua(q) })
  return {
    ok: true, van: v.van, ghe: v.ghe, loai: v.loai, cheDo: v.cheDo, session: r.session,
    bi: kis.map((ki, i) => ({ ki, cau: r.cau[i] ?? null })), chot: r.chot, tran: { con: r.tranCon, tong: r.tranTong },
    veTran: await ve(bi, r.chotQ ? cauBiCua(r.chotQ) : null, r.session),
  }
}
/** Câu thay trống (hết trần) ở ván online: vẫn cấp vé để phòng biết bi thành bi trống. */
async function veTrong(env: Env, p: PhienBia, sbd: string, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  if (p.online !== 1 || !p.van || !laKiHieu(b.ki)) return {}
  return { ve: await kyVe(env, { k: 'cau', van: p.van, sbd, ki: b.ki, cau: null, het: nowMs + HAN_VE_MS }) }
}
