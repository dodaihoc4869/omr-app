// OMNI 3 — TICK BÀI ĐÃ DẠY (phạm vi đã dạy của lớp) → TỰ TẠO CHIẾN DỊCH THEO BÀI. Lệnh thầy `POST /gv/bai-da-day` (sau cổng `laThay`).
// Đặc tả: DAC-TA-BUILD-OMNI-3-0510.md mục 1 bước 1, 2, 3 (bai_da_day, pham_vi_lop); prompt-tick-bai-tu-giao.md mục A–B; hợp đồng docs/hop-dong-omni-3.md mục B.
// Bảng CHỈ-THÊM, tạo lúc chạy (CI không chạy migration; bản SQL ở server/migration-0510-omni-3.sql — câu tạo ở đây y hệt, test khoá):
//   bai_da_day  (id, lop, khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc, nguoi, chien_dich_id, bo_tick_luc)
//   pham_vi_lop (lop, khoa_bai, ten_bai, vi_tri, ma_de_json, nguon 'tick'|'truoc', cap_nhat_luc) PK (lop, khoa_bai)
// Thêm (chỉ-thêm, tạo lúc chạy): chỉ mục DUY NHẤT `bai_da_day_mot (lop, khoa_bai) WHERE bo_tick_luc IS NULL` ⇒ hai lượt tick đồng thời của cùng
// một bài không tạo hai chiến dịch.
//
// LUẬT (tick là KHAI BÁO phạm vi; chiến dịch suy ra từ phạm vi):
//   · Chiến dịch tạo bằng ĐÚNG đường có sẵn `gvChienDich({action:'tao'})` (srs2-gv.ts): tên "Bài N · Tên bài", danh sách em của lớp lúc tick,
//     Huyết Chiến bật, rải đều bật, bắt đầu hôm nay. Hạn vắng ⇒ D = soNgayHanBai(lượt cần của em trung vị — `suc-chua`, thể lực) ∈ [7, 14],
//     hạn = hôm nay + D − 1 (ngày VN). Thể lực vắng ⇒ `cau_hinh.the_luc_lop[lớp]` ⇒ 40.
//   · Tick lại bài còn hiệu lực ⇒ trả chiến dịch cũ (`daCo`). Bỏ tick ⇒ ghi `bo_tick_luc`; chiến dịch chưa có lượt làm nào ⇒ huỷ, có ⇒ đóng.
//   · Phạm vi đã dạy của lớp = bài đang tick ∪ mọi bài đứng TRƯỚC bài tick xa nhất (danh sách `phamVi` app thầy gửi lúc tick).
//   · Lớp của em: đúng nguồn màn Học sinh (`danh_sach` + `hoc_sinh.ten_lop`, tên lớp mặc định theo khối — ten-lop.ts), em đã khoá không tính.
import type { Env } from './kieu'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { dbGoc, docCauHinhDem } from './cau-hinh-dem'
import { DemTTL } from './dem-chung'
import { chayDdlMotLan } from './ddl-mot-lan'
import { laCauTuLuan } from './cam-tu-luan'
import { laMaDeTuLuan } from '../../src/lib/cau-tu-luan'
import { tenLopCuaEm } from './ten-lop'
import { cauCuaToChiTiet, gvChienDich, tachMaTo, THE_LUC_TOI_DA, trangThaiLop } from './srs2-gv'
import { docChienDichCuaEm, docChienDichKemBatDau, ngayVnCua, noCuCaLop } from './srs2-d1'
import { congNgay, khoiLuongCan, soNgayConLai, soNgayGiua } from './srs2-loi'
import { KHOA_THE_LUC_LOP, SQL_LA_LAN_LAM, THAM_SO_OMNI } from './omni-kieu'
import { soNgayHanBai } from './omni-ke-hoach'
import { hoSoOmniNhieuEm, omniBat, qCuaCau } from './omni-d1'
import { duBaoDiem } from './du-bao-diem'
import { xetChungChi } from './omni-chung-chi'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const mangChuoi = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.map(str).map((x) => x.trim()).filter(Boolean))] : [])
const docMang = (v: unknown): string[] => {
  try {
    const a = JSON.parse(str(v) || '[]') as unknown
    return Array.isArray(a) ? a.map(str).filter(Boolean) : []
  } catch {
    return []
  }
}
const NGAY = /^\d{4}-\d{2}-\d{2}$/
/**
 * LƯỚI AN TOÀN (thầy 05/10: "Khi tích chọn bạn chỉ lấy 3 phần trắc nghiệm, đúng sai trả lời ngắn làm tự động giao bỏ phần ví dụ minh họa và các dạng
 * trọng tâm nhé."): tờ mang nhãn mục dạy học / tự luận (-VD, -DT, -TL — `laMaDeTuLuan`; dạng dài -VDMH, -DTTT) KHÔNG BAO GIỜ vào bài tick lẫn phạm vi,
 * kể cả khi app cũ còn gửi. Cùng luật app thầy (`laMaToKhongGiao`, src/lib/bai-hom-nay.ts). Thuần.
 */
export const laMaToKhongGiao = (maDe: string): boolean => laMaDeTuLuan(maDe) || /(?:^|-)(?:VDMH|DTTT)(?:-|$)/i.test(String(maDe ?? ''))
export const CHU_BAI_CHUA_CO_TO_TU_GIAO = 'Bài này chưa có tờ Trắc nghiệm / Đúng sai / Trả lời ngắn.'
/** Trần số tờ của một bài và số bài `phamVi` mỗi lệnh (chặn thân lệnh vô lý). */
const TOI_DA_TO_MOI_BAI = 60
const TOI_DA_BAI_TRUOC = 300
/** Dòng tick đã giữ chỗ mà quá ngần này chưa gắn được chiến dịch (lượt trước chết giữa chừng) ⇒ coi là treo, lượt sau làm lại. */
const TREO_MS = 120_000

/** Phạm vi đã dạy của một lớp: mọi tờ (mã gốc, không hậu tố -TN/-DS/-TLN) thuộc bài đã tick ∪ bài đứng trước bài tick xa nhất. */
export interface PhamViLop {
  lop: string
  /** Mã tờ GỐC trong phạm vi. */
  maDe: Set<string>
  /** Mã tờ gốc → bài (khoá, tên, vị trí trong cây SGK). */
  baiTheoMaDe: Map<string, { khoaBai: string; tenBai: string; viTri: number }>
  /** Bài đã tick (đang luyện hoặc đã luyện) theo vị trí tăng dần, kèm chiến dịch tạo ra. */
  baiDaTick: { khoaBai: string; tenBai: string; viTri: number; chienDichId: string | null; tickLuc: string }[]
}

// ---------------------------------------------------------------- bảng (tạo lúc chạy)
/** Câu tạo bảng — y hệt các dòng tương ứng trong server/migration-0510-omni-3.sql (test khoá). */
export const SQL_BANG_BAI_DA_DAY: readonly string[] = [
  'CREATE TABLE IF NOT EXISTS bai_da_day ( id TEXT PRIMARY KEY, lop TEXT NOT NULL, khoa_bai TEXT NOT NULL, ten_bai TEXT NOT NULL, vi_tri INTEGER NOT NULL, ma_to_json TEXT NOT NULL, tick_luc TEXT NOT NULL, nguoi TEXT, chien_dich_id TEXT, bo_tick_luc TEXT )',
  'CREATE INDEX IF NOT EXISTS bai_da_day_lop ON bai_da_day(lop, vi_tri)',
  'CREATE TABLE IF NOT EXISTS pham_vi_lop ( lop TEXT NOT NULL, khoa_bai TEXT NOT NULL, ten_bai TEXT NOT NULL, vi_tri INTEGER NOT NULL, ma_de_json TEXT NOT NULL, nguon TEXT NOT NULL, cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (lop, khoa_bai) )',
]
/** Chỉ-thêm (tạo lúc chạy, không có trong bản SQL): mỗi (lớp, bài) tối đa MỘT dòng còn hiệu lực. */
export const SQL_CHI_MUC_MOT_TICK = 'CREATE UNIQUE INDEX IF NOT EXISTS bai_da_day_mot ON bai_da_day(lop, khoa_bai) WHERE bo_tick_luc IS NULL'
export function damBaoBangBaiDaDay(env: Env): Promise<void> {
  return chayDdlMotLan(env, 'bai_da_day', [...SQL_BANG_BAI_DA_DAY, SQL_CHI_MUC_MOT_TICK])
}

// ---------------------------------------------------------------- lớp của em (nguồn màn Học sinh) — đệm 30 s
interface EmLop { lop: string; ten: string }
export const DEM_LOP_MS = 30_000
const demLop = new DemTTL<{ db: object; v: Map<string, EmLop> }>(DEM_LOP_MS, 2)

/**
 * sbd → {tên lớp, họ tên} của MỌI em đang học. Cùng nguồn màn Học sinh (`danh_sach`, tên lớp = `hoc_sinh.ten_lop` đã gán, chưa gán ⇒ mặc định
 * theo khối — `tenLopCuaEm`), cộng em chỉ có hồ sơ `hoc_sinh` (như `/gv/lop`). Em `hoc_sinh.trang_thai = 'khoa'` không tính.
 * Đệm DEM_LOP_MS trong isolate (khoá theo D1 gốc). Lỗi đọc ⇒ bảng rỗng, không đệm.
 */
async function bangLopCacEm(env: Env, nowMs = Date.now()): Promise<Map<string, EmLop>> {
  const db = dbGoc(env.DB as unknown as object)
  const o = demLop.doc('bang', nowMs)
  if (o && o.db === db) return o.v
  const hoi = async (sql: string): Promise<Row[] | null> => {
    try {
      return (await env.DB.prepare(sql).all<Row>()).results ?? []
    } catch {
      return null
    }
  }
  const [hsCo, ds] = await Promise.all([
    hoi('SELECT sbd, ho_ten, lop, ten_lop, trang_thai FROM hoc_sinh'),
    hoi('SELECT sbd, ho_ten, lop FROM danh_sach'),
  ])
  const hs = hsCo ?? (await hoi('SELECT sbd, ho_ten, lop, NULL AS ten_lop, trang_thai FROM hoc_sinh')) // chưa có cột ten_lop (Worker lên trước migration)
  const v = new Map<string, EmLop>()
  if (!hs && !ds) return v
  const hsTheo = new Map((hs ?? []).map((x) => [str(x.sbd).trim(), x]))
  const khoa = new Set((hs ?? []).filter((x) => str(x.trang_thai) === 'khoa').map((x) => str(x.sbd).trim()))
  for (const x of ds ?? []) {
    const sbd = str(x.sbd).trim()
    if (!sbd || khoa.has(sbd) || v.has(sbd)) continue
    const h = hsTheo.get(sbd)
    v.set(sbd, { lop: tenLopCuaEm(x.lop, h?.ten_lop), ten: str(h?.ho_ten).trim() || str(x.ho_ten).trim() || sbd })
  }
  for (const x of hs ?? []) {
    const sbd = str(x.sbd).trim()
    if (!sbd || khoa.has(sbd) || v.has(sbd)) continue
    v.set(sbd, { lop: tenLopCuaEm(x.lop, x.ten_lop), ten: str(x.ho_ten).trim() || sbd })
  }
  demLop.ghi('bang', nowMs, { db, v }, 1)
  return v
}

/** Lớp của em (chuỗi tên lớp như chien_dich.lop / danh sách học sinh), null nếu không rõ. */
export async function lopCuaEm(env: Env, sbd: string): Promise<string | null> {
  const s = str(sbd).trim()
  if (!s) return null
  try {
    return (await bangLopCacEm(env)).get(s)?.lop ?? null
  } catch {
    return null
  }
}

/** Em của một lớp (theo `bangLopCacEm`), xếp theo SBD. */
export async function emCuaLopBai(env: Env, lop: string, nowMs = Date.now()): Promise<{ sbd: string; ten: string }[]> {
  const l = str(lop).trim()
  return [...(await bangLopCacEm(env, nowMs))].filter(([, e]) => e.lop === l).map(([sbd, e]) => ({ sbd, ten: e.ten })).sort((a, b) => a.sbd.localeCompare(b.sbd))
}

/** Thể lực mặc định của lớp: `cau_hinh.the_luc_lop` (`{"12A1":40}`, đệm 15 s) ⇒ vắng/hỏng ⇒ 40. Kẹp [1, 500]. */
export async function theLucCuaLop(env: Env, lop: string, nowMs = Date.now()): Promise<number> {
  try {
    const o = JSON.parse((await docCauHinhDem(env, KHOA_THE_LUC_LOP, nowMs)) ?? 'null') as Record<string, unknown> | null
    const n = Math.floor(Number(o && typeof o === 'object' ? o[lop] : NaN))
    if (Number.isFinite(n) && n >= 1) return Math.min(THE_LUC_TOI_DA, n)
  } catch {
    // giá trị hỏng ⇒ mặc định
  }
  return THAM_SO_OMNI.THE_LUC_MAC_DINH
}

/**
 * Gọi lệnh chiến dịch có sẵn (`gvChienDich`) và quy MỌI lỗi về `{ ok:false, error }`: vài action (`tao`, `suc-chua`, `dong`, `huy`) trả thẳng
 * promise ra khỏi `try` của nó nên lỗi đi ra dưới dạng promise bị từ chối, không phải `{ ok:false }`.
 */
async function goiChienDich(env: Env, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  try {
    return await gvChienDich(env, b, nowMs)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Tên chiến dịch theo bài: "Bài 6. Tinh bột và cellulose" ⇒ "Bài 6 · Tinh bột và cellulose" (tên khác dáng giữ nguyên). Thuần. */
export function tenChienDichBai(tenBai: string): string {
  const t = str(tenBai).replace(/\s+/g, ' ').trim()
  const m = /^Bài\s+(\d+[A-Za-z]?)\s*[.:·\-–—]\s*(.+)$/u.exec(t)
  return (m ? `Bài ${m[1]} · ${m[2]!.trim()}` : t).slice(0, 120)
}

// ---------------------------------------------------------------- phạm vi đã dạy
/** Đệm phạm vi theo lớp (30 s, khoá theo D1 gốc); tick / bỏ tick xoá khoá của lớp ngay. */
const demPhamVi = new DemTTL<{ db: object; v: PhamViLop | null }>(30_000, 200)
export function xoaDemPhamVi(lop?: string): void {
  if (lop) demPhamVi.xoaKhoa(lop)
  else demPhamVi.xoa()
}

/**
 * Dựng phạm vi từ dòng tick còn hiệu lực + dòng `pham_vi_lop` của lớp. Thuần.
 * Không có dòng tick ⇒ null (lớp chưa tick bài nào ⇒ không lọc). Bài trong phạm vi = mọi bài đang tick ∪ bài `pham_vi_lop` có vị trí
 * NHỎ HƠN bài tick xa nhất (bài đã bỏ tick đứng sau bài tick xa nhất thì rời phạm vi).
 */
export function dungPhamVi(lop: string, dongTick: readonly Row[], dongPhamVi: readonly Row[]): PhamViLop | null {
  const tick = dongTick.map((r) => ({
    khoaBai: str(r.khoa_bai), tenBai: str(r.ten_bai), viTri: Number(r.vi_tri) || 0, chienDichId: str(r.chien_dich_id) || null, tickLuc: str(r.tick_luc), maDe: docMang(r.ma_to_json),
  })).filter((b) => b.khoaBai)
  if (!tick.length) return null
  const viTriMax = Math.max(...tick.map((b) => b.viTri))
  const daTick = new Set(tick.map((b) => b.khoaBai))
  const truoc = dongPhamVi
    .map((r) => ({ khoaBai: str(r.khoa_bai), tenBai: str(r.ten_bai), viTri: Number(r.vi_tri) || 0, maDe: docMang(r.ma_de_json) }))
    .filter((b) => b.khoaBai && !daTick.has(b.khoaBai) && b.viTri < viTriMax)
  const bai = [...tick, ...truoc].sort((a, b) => a.viTri - b.viTri)
  const maDe = new Set<string>()
  const baiTheoMaDe = new Map<string, { khoaBai: string; tenBai: string; viTri: number }>()
  for (const b of bai) for (const m of b.maDe) {
    const g = tachMaTo(m).goc
    if (!g) continue
    maDe.add(g)
    if (!baiTheoMaDe.has(g)) baiTheoMaDe.set(g, { khoaBai: b.khoaBai, tenBai: b.tenBai, viTri: b.viTri })
  }
  const baiDaTick = tick.sort((a, b) => a.viTri - b.viTri || a.tickLuc.localeCompare(b.tickLuc)).map(({ maDe: _bo, ...b }) => b)
  return { lop, maDe, baiTheoMaDe, baiDaTick }
}

/** Phạm vi đã dạy của LỚP (null ⇒ lớp chưa tick bài nào ⇒ OMNI không lọc theo phạm vi — giữ hành vi cũ). Đệm ngắn trong isolate. Không sửa đối tượng trả về (dùng chung trong đệm). */
export async function phamViLop(env: Env, lop: string): Promise<PhamViLop | null> {
  const l = str(lop).trim()
  if (!l) return null
  const db = dbGoc(env.DB as unknown as object)
  const now = Date.now()
  const o = demPhamVi.doc(l, now)
  if (o && o.db === db) return o.v
  try {
    const [tick, pv] = await Promise.all([
      env.DB.prepare('SELECT khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc, chien_dich_id FROM bai_da_day WHERE lop = ? AND bo_tick_luc IS NULL ORDER BY vi_tri, tick_luc').bind(l).all<Row>(),
      env.DB.prepare('SELECT khoa_bai, ten_bai, vi_tri, ma_de_json FROM pham_vi_lop WHERE lop = ? ORDER BY vi_tri').bind(l).all<Row>(),
    ])
    const v = dungPhamVi(l, tick.results ?? [], pv.results ?? [])
    demPhamVi.ghi(l, now, { db, v })
    return v
  } catch (e) {
    if (/no such table/i.test(String(e))) demPhamVi.ghi(l, now, { db, v: null }) // chưa ai tick bài nào ⇒ bảng chưa có
    return null
  }
}

/** Phạm vi đã dạy của EM (theo lớp của em: lớp trong danh sách học sinh / chiến dịch gần nhất của em). null ⇒ không lọc. */
export async function phamViCuaEm(env: Env, sbd: string): Promise<PhamViLop | null> {
  const s = str(sbd).trim()
  if (!s) return null
  try {
    const lop = await lopCuaEm(env, s)
    if (lop) {
      const pv = await phamViLop(env, lop)
      if (pv) return pv
    }
    // Lùi: lớp ghi trên chiến dịch gần nhất có em (chiến dịch tick bài mang đúng tên lớp lúc tick — em đổi lớp sau vẫn theo bài đang luyện).
    const daXet = new Set<string>(lop ? [lop] : [])
    for (const cd of await docChienDichCuaEm(env, s)) {
      const l = str(cd.lop).trim()
      if (!l || daXet.has(l)) continue
      daXet.add(l)
      const pv = await phamViLop(env, l)
      if (pv) return pv
      if (daXet.size >= 4) break
    }
    return null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- đầu vào chung
interface BaiTruoc { khoaBai: string; tenBai: string; viTri: number; maDe: string[] }
interface DauVaoBai {
  lop: string
  khoaBai: string
  tenBai: string
  viTri: number
  maDe: string[]
  /** Em được giao: thầy chọn (`sbd`, đã lọc) hoặc cả lớp. */
  em: { sbd: string; ten: string }[]
  /** Số em của lớp (cả lớp, theo danh sách học sinh). */
  soEmLop: number
  theLuc: number
  hanNop: string | null
  nguoi: string | null
  phamVi: BaiTruoc[]
}

async function docDauVaoBai(env: Env, b: Row, nowMs: number, canBai: boolean): Promise<DauVaoBai | { loi: string }> {
  const lop = str(b.lop).trim()
  if (!lop) return { loi: 'Chưa chọn lớp.' }
  const khoaBai = str(b.khoaBai).trim()
  const tenBai = str(b.tenBai).replace(/\s+/g, ' ').trim()
  const viTriSo = Number(b.viTri)
  if (canBai && !khoaBai) return { loi: 'Chưa chọn bài.' }
  if (canBai && !tenBai) return { loi: 'Thiếu tên bài.' }
  if (canBai && (b.viTri == null || b.viTri === '' || !Number.isFinite(viTriSo))) return { loi: 'Thiếu vị trí của bài trong cây.' }
  const maDe = mangChuoi(b.maDe).filter((m) => !laMaToKhongGiao(m))
  if (!maDe.length) return { loi: CHU_BAI_CHUA_CO_TO_TU_GIAO }
  if (maDe.length > TOI_DA_TO_MOI_BAI) return { loi: `Một bài tối đa ${TOI_DA_TO_MOI_BAI} tờ.` }
  const hanNop = str(b.hanNop).trim() || null
  if (hanNop && !NGAY.test(hanNop)) return { loi: 'Hạn nộp phải là ngày dạng YYYY-MM-DD.' }
  if (hanNop && hanNop < ngayVnCua(nowMs)) return { loi: 'Hạn nộp đã qua.' }
  const tlVao = Math.floor(Number(b.theLucNgay))
  const theLuc = Number.isFinite(tlVao) && tlVao >= 1 ? Math.min(THE_LUC_TOI_DA, tlVao) : await theLucCuaLop(env, lop, nowMs)
  // Em được giao (thầy 05/10: chọn em khi tick bài). Vắng `sbd` ⇒ cả lớp lúc tick (nguồn màn Học sinh). Có `sbd` (mảng) ⇒ đúng các em thầy chọn:
  // bỏ trùng, bỏ SBD không có trong danh sách học sinh hoặc đã khoá (bangLopCacEm không chứa em khoá); còn 0 em ⇒ từ chối.
  const emLop = await emCuaLopBai(env, lop, nowMs)
  let em = emLop
  if (Array.isArray(b.sbd)) {
    const bang = await bangLopCacEm(env, nowMs)
    em = mangChuoi(b.sbd).filter((s) => bang.has(s)).sort((a, c) => a.localeCompare(c)).map((s) => ({ sbd: s, ten: bang.get(s)!.ten }))
    if (!em.length) return { loi: 'Chưa chọn em nào hợp lệ.' }
  }
  const phamVi: BaiTruoc[] = []
  for (const x of (Array.isArray(b.phamVi) ? b.phamVi : []).slice(0, TOI_DA_BAI_TRUOC)) {
    const o = (x && typeof x === 'object' ? x : {}) as Row
    const k = str(o.khoaBai).trim()
    const v = Number(o.viTri)
    if (!k || k === khoaBai || !Number.isFinite(v)) continue
    phamVi.push({ khoaBai: k, tenBai: str(o.tenBai).replace(/\s+/g, ' ').trim() || k, viTri: Math.floor(v), maDe: mangChuoi(o.maDe).filter((m) => !laMaToKhongGiao(m)).slice(0, TOI_DA_TO_MOI_BAI) })
  }
  return { lop, khoaBai, tenBai, viTri: Number.isFinite(viTriSo) ? Math.floor(viTriSo) : 0, maDe, em, soEmLop: emLop.length, theLuc, hanNop, nguoi: str(b.nguoi).trim().slice(0, 60) || null, phamVi }
}

/**
 * Hạn nộp: thầy đặt ⇒ D = số ngày còn lại tính cả hôm nay; vắng ⇒ D = soNgayHanBai(lượt cần của em trung vị, thể lực), hạn = hôm nay + D − 1.
 * Lượt cần lấy từ ĐÚNG đồng hồ sức chứa của màn giao (`gvChienDich` action `suc-chua`, câu mới × 2 + lượt nợ cũ) — với chiến dịch mới,
 * lượt cần không phụ thuộc hạn nên gọi với hạn tạm = hôm nay + HAN_BAI_MAX − 1.
 */
async function tinhHan(env: Env, dv: DauVaoBai, nowMs: number): Promise<{ hanNop: string; D: number; luotCan: number } | { loi: string }> {
  const homNay = ngayVnCua(nowMs)
  const sc = await goiChienDich(env, {
    action: 'suc-chua', lop: dv.lop, sbd: dv.em.map((e) => e.sbd), maDe: dv.maDe,
    hanNop: dv.hanNop ?? congNgay(homNay, THAM_SO_OMNI.HAN_BAI_MAX - 1), theLucNgay: dv.theLuc,
  }, nowMs)
  if (sc.ok !== true) return { loi: str(sc.error) || 'Chưa tính được sức chứa của lớp.' }
  const luotCan = Number(sc.khoiLuongTrungVi) || 0
  if (dv.hanNop) return { hanNop: dv.hanNop, D: soNgayConLai(homNay, dv.hanNop), luotCan }
  const D = soNgayHanBai(luotCan, dv.theLuc)
  return { hanNop: congNgay(homNay, D - 1), D, luotCan }
}

/** Đếm câu TỰ LUẬN đã bị bỏ (câu đã duyệt) + nhãn kiến thức của các câu dùng được, theo đúng phần của tờ đã tách. */
async function docCauBai(env: Env, maDe: readonly string[]): Promise<{ soTuLuan: number; kienThuc: string[] }> {
  const goc = [...new Set(maDe.map((m) => tachMaTo(m).goc))]
  const r = await env.DB.prepare('SELECT ma_de, qid, json FROM game_v2_question WHERE ma_de IN (SELECT value FROM json_each(?)) ORDER BY rowid').bind(JSON.stringify(goc)).all<Row>()
  const theoGoc = new Map<string, { qid: string; q: PrivateQuestion }[]>()
  for (const x of r.results ?? []) {
    let q: PrivateQuestion
    try { q = JSON.parse(str(x.json)) as PrivateQuestion } catch { continue }
    if (!q.reviewed) continue
    const k = str(x.ma_de)
    theoGoc.set(k, [...(theoGoc.get(k) ?? []), { qid: str(x.qid), q }])
  }
  const tuLuan = new Set<string>(), daXet = new Set<string>(), kienThuc = new Set<string>()
  for (const m of maDe) {
    const { goc: g, phan } = tachMaTo(m)
    for (const c of theoGoc.get(g) ?? []) {
      if ((phan && str(c.q.phan) !== phan) || daXet.has(c.qid)) continue
      daXet.add(c.qid)
      if (laCauTuLuan(c.q)) { tuLuan.add(c.qid); continue }
      for (const k of Array.isArray(c.q.kienThuc) ? c.q.kienThuc : []) if (str(k).trim()) kienThuc.add(str(k).trim())
    }
  }
  return { soTuLuan: tuLuan.size, kienThuc: [...kienThuc] }
}

/**
 * Số em ĐỦ LƯỢT để dự báo ca chốt ≥ 8 trong D ngày (OMNI): em có `xetChungChi(...).dat` hoặc `uocNgay ≤ D`, với nhịp = thể lực ngày của bài
 * (lượt tối đa kế hoạch giao mỗi ngày ⇒ "đủ lượt" ⟺ Σ lượt cần ≤ D × thể lực). Chỉ xét em OMNI bật; không em nào bật ⇒ null. Lỗi ⇒ null.
 */
async function demDuDiem8(env: Env, dv: DauVaoBai, qids: readonly string[], D: number, nowMs: number): Promise<number | null> {
  try {
    const bat = await Promise.all(dv.em.map((e) => omniBat(env, e.sbd, dv.lop).catch(() => false)))
    const emBat = dv.em.filter((_, i) => bat[i]).map((e) => e.sbd)
    if (!emBat.length) return null
    const [hoSo, q] = await Promise.all([hoSoOmniNhieuEm(env, emBat, nowMs), qCuaCau(env, qids)])
    const cau = qids.map((x) => q.get(x)).filter((x): x is NonNullable<typeof x> => !!x)
    let n = 0
    for (const s of emBat) {
      const hs = hoSo.get(s)
      if (!hs) continue
      const cc = xetChungChi(hs, cau, duBaoDiem(hs, cau), null, dv.theLuc)
      if (cc.dat || (cc.uocNgay != null && cc.uocNgay <= D)) n++
    }
    return n
  } catch {
    return null
  }
}

// ---------------------------------------------------------------- các action
async function xemTruoc(env: Env, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const dv = await docDauVaoBai(env, b, nowMs, false)
  if ('loi' in dv) return { ok: false, error: dv.loi }
  if (!dv.em.length) return { ok: false, error: `Lớp ${dv.lop} chưa có học sinh nào.` }
  const homNay = ngayVnCua(nowMs)
  const [han, ct, cb] = await Promise.all([tinhHan(env, dv, nowMs), cauCuaToChiTiet(env, dv.maDe), docCauBai(env, dv.maDe)])
  if ('loi' in han) return { ok: false, error: han.loi }
  // Lượt cần TỪNG em — cùng công thức đồng hồ sức chứa (khoiLuongCan của câu chiến dịch mới + lượt nợ cũ ngoài các câu này).
  const sbd = dv.em.map((e) => e.sbd)
  const [tt, noCu] = await Promise.all([trangThaiLop(env, sbd, ct.qids, han.hanNop, new Date(nowMs).toISOString()), noCuCaLop(env, sbd, homNay, ct.qids)])
  const sucChua = han.D * dv.theLuc
  const quaTai = dv.em.filter((e) => khoiLuongCan(tt.get(e.sbd)?.values() ?? []) + (noCu.get(e.sbd)?.luot ?? 0) > sucChua).map((e) => ({ sbd: e.sbd, ten: e.ten }))
  return {
    ok: true,
    soCau: ct.qids.length, soTuLuan: cb.soTuLuan,
    hanNop: han.hanNop, D: han.D,
    luotCan: han.luotCan, sucChua,
    // "Giao N em" = soEmChon (em được giao sau lọc); tongEm = số em của lớp. duLuot / quaTai / duDiem8 tính trên em được giao.
    soEmChon: dv.em.length, duLuot: dv.em.length - quaTai.length, tongEm: dv.soEmLop,
    duDiem8: await demDuDiem8(env, dv, ct.qids, han.D, nowMs),
    quaTai, theLucNgay: dv.theLuc,
  }
}

/** Dòng tick còn hiệu lực của (lớp, bài). */
async function dongConHieuLuc(env: Env, lop: string, khoaBai: string): Promise<Row | null> {
  return env.DB.prepare('SELECT * FROM bai_da_day WHERE lop = ? AND khoa_bai = ? AND bo_tick_luc IS NULL ORDER BY tick_luc DESC LIMIT 1').bind(lop, khoaBai).first<Row>()
}
async function hanCuaChienDich(env: Env, id: string): Promise<string | null> {
  if (!id) return null
  const r = await env.DB.prepare('SELECT han_nop FROM chien_dich WHERE id = ?').bind(id).first<Row>().catch(() => null)
  return r ? str(r.han_nop) || null : null
}
const traDaCo = async (env: Env, r: Row) => ({ ok: true, chienDichId: str(r.chien_dich_id) || null, hanNop: await hanCuaChienDich(env, str(r.chien_dich_id)), daCo: true })

/** Ghi `pham_vi_lop`: bài tick nguồn 'tick' (đè dòng 'truoc' cũ nếu có); mỗi bài trong `phamVi` nguồn 'truoc', KHÔNG đè dòng 'tick'. */
async function ghiPhamVi(env: Env, dv: DauVaoBai, luc: string): Promise<void> {
  const lenh = [env.DB.prepare(`INSERT INTO pham_vi_lop (lop, khoa_bai, ten_bai, vi_tri, ma_de_json, nguon, cap_nhat_luc) VALUES (?,?,?,?,?,'tick',?)
      ON CONFLICT(lop, khoa_bai) DO UPDATE SET ten_bai = excluded.ten_bai, vi_tri = excluded.vi_tri, ma_de_json = excluded.ma_de_json, nguon = 'tick', cap_nhat_luc = excluded.cap_nhat_luc`)
    .bind(dv.lop, dv.khoaBai, dv.tenBai, dv.viTri, JSON.stringify(dv.maDe), luc)]
  for (const p of dv.phamVi) {
    lenh.push(env.DB.prepare(`INSERT INTO pham_vi_lop (lop, khoa_bai, ten_bai, vi_tri, ma_de_json, nguon, cap_nhat_luc) VALUES (?,?,?,?,?,'truoc',?)
        ON CONFLICT(lop, khoa_bai) DO UPDATE SET ten_bai = excluded.ten_bai, vi_tri = excluded.vi_tri, ma_de_json = excluded.ma_de_json, cap_nhat_luc = excluded.cap_nhat_luc
        WHERE pham_vi_lop.nguon <> 'tick'`).bind(dv.lop, p.khoaBai, p.tenBai, p.viTri, JSON.stringify(p.maDe), luc))
  }
  await env.DB.batch(lenh)
}

/**
 * `learner_scope` 'taught' nguồn 'thay' cho mọi em của lớp × nhãn kiến thức của bài (prompt A6 — CHỈ GHI, không bật cờ CNH-1.0).
 * Một câu lệnh (json_each × json_each). Không hạ/đè dòng đã 'taught' hoặc 'revoked'. Bảng chưa có / lỗi ⇒ bỏ qua (không chặn tick).
 */
async function ghiDaDayChoEm(env: Env, sbd: readonly string[], kienThuc: readonly string[], bangChung: string, luc: string): Promise<void> {
  if (!sbd.length || !kienThuc.length) return
  try {
    await env.DB.prepare(`INSERT INTO learner_scope (sbd, skill_id, state, source, evidence_ref, revision, cap_nhat_luc)
        SELECT e.value, k.value, 'taught', 'thay', ?, 1, ? FROM json_each(?) e, json_each(?) k WHERE true
        ON CONFLICT(sbd, skill_id) DO UPDATE SET state = 'taught', source = excluded.source, evidence_ref = excluded.evidence_ref,
          revision = learner_scope.revision + 1, cap_nhat_luc = excluded.cap_nhat_luc
        WHERE learner_scope.state NOT IN ('taught', 'revoked')`).bind(bangChung, luc, JSON.stringify(sbd), JSON.stringify(kienThuc)).run()
  } catch {
    // CNH-1.0 chưa có bảng ⇒ thôi
  }
}

async function tick(env: Env, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const dv = await docDauVaoBai(env, b, nowMs, true)
  if ('loi' in dv) return { ok: false, error: dv.loi }
  await damBaoBangBaiDaDay(env)
  // Idempotent: bài còn hiệu lực của lớp ⇒ trả chiến dịch cũ (dòng giữ chỗ còn mới ⇒ một lượt khác đang tạo).
  const cu = await dongConHieuLuc(env, dv.lop, dv.khoaBai)
  const treo = !!cu && !str(cu.chien_dich_id) && !(nowMs - Date.parse(str(cu.tick_luc)) < TREO_MS)
  if (cu && !treo) return traDaCo(env, cu)
  if (!dv.em.length) return { ok: false, error: `Lớp ${dv.lop} chưa có học sinh nào.` }
  const homNay = ngayVnCua(nowMs)
  const [han, cb] = await Promise.all([dv.hanNop ? Promise.resolve({ hanNop: dv.hanNop }) : tinhHan(env, dv, nowMs), docCauBai(env, dv.maDe).catch(() => ({ soTuLuan: 0, kienThuc: [] as string[] }))])
  if ('loi' in han) return { ok: false, error: han.loi }
  const luc = new Date(nowMs).toISOString()
  // GIỮ CHỖ trước khi tạo chiến dịch: chỉ mục duy nhất ⇒ lượt tick đồng thời thứ hai rơi vào nhánh `daCo`, không tạo chiến dịch thứ hai.
  let id = cu ? str(cu.id) : ''
  if (!cu) {
    id = crypto.randomUUID()
    try {
      await env.DB.prepare(`INSERT INTO bai_da_day (id, lop, khoa_bai, ten_bai, vi_tri, ma_to_json, tick_luc, nguoi, chien_dich_id, bo_tick_luc)
          VALUES (?,?,?,?,?,?,?,?,NULL,NULL)`).bind(id, dv.lop, dv.khoaBai, dv.tenBai, dv.viTri, JSON.stringify(dv.maDe), luc, dv.nguoi).run()
    } catch (e) {
      const lai = await dongConHieuLuc(env, dv.lop, dv.khoaBai)
      if (lai) return traDaCo(env, lai)
      throw e
    }
  }
  const t = await goiChienDich(env, {
    action: 'tao', ten: tenChienDichBai(dv.tenBai), lop: dv.lop, sbd: dv.em.map((e) => e.sbd), maDe: dv.maDe,
    hanNop: han.hanNop, theLucNgay: dv.theLuc, huyetChien: true, raiDeu: true, batDau: homNay,
  }, nowMs)
  if (t.ok !== true) {
    // Hoàn lại dòng giữ chỗ VỪA ghi ở lượt này (chưa gắn chiến dịch) để thầy tick lại được ngay.
    if (!cu) await env.DB.prepare('DELETE FROM bai_da_day WHERE id = ? AND chien_dich_id IS NULL').bind(id).run().catch(() => null)
    return { ok: false, error: str(t.error) || 'Chưa tạo được chiến dịch cho bài này.' }
  }
  const chienDichId = str(t.id)
  const gan = await env.DB.prepare('UPDATE bai_da_day SET chien_dich_id = ?, ten_bai = ?, vi_tri = ?, ma_to_json = ?, tick_luc = ?, nguoi = ? WHERE id = ? AND chien_dich_id IS NULL AND bo_tick_luc IS NULL')
    .bind(chienDichId, dv.tenBai, dv.viTri, JSON.stringify(dv.maDe), luc, dv.nguoi, id).run()
  if (!Number(gan.meta?.changes ?? 0)) {
    // Dòng treo vừa được lượt khác gắn chiến dịch / bỏ tick trong lúc lượt này tạo ⇒ huỷ chiến dịch thừa của lượt này (chưa em nào làm).
    await goiChienDich(env, { action: 'huy', id: chienDichId }, nowMs)
    const lai = await dongConHieuLuc(env, dv.lop, dv.khoaBai)
    return lai ? traDaCo(env, lai) : { ok: false, error: 'Bài này vừa được bỏ tick ở lượt khác. Thầy tick lại nếu cần.' }
  }
  await ghiPhamVi(env, dv, luc)
  xoaDemPhamVi(dv.lop)
  await ghiDaDayChoEm(env, dv.em.map((e) => e.sbd), cb.kienThuc, `bai_da_day:${id}`, luc)
  return { ok: true, chienDichId, hanNop: han.hanNop, daCo: false }
}

/** Chiến dịch đã có lượt làm nào (của em trong chiến dịch, câu của chiến dịch — kể cả câu song sinh) kể từ lúc tạo? Lỗi đọc ⇒ coi như CÓ (đóng an toàn hơn huỷ). */
async function coLuotLam(env: Env, cd: { sbd: string[]; qids: string[]; taoLuc: string }): Promise<boolean> {
  if (!cd.sbd.length || !cd.qids.length) return false
  const qids = JSON.stringify(cd.qids.flatMap((q) => [q, `${q}~ss0`, `${q}~ss1`]))
  const sbd = JSON.stringify(cd.sbd)
  const goc = 'SELECT 1 AS co FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?)) AND luc >= ?'
  try {
    return !!(await env.DB.prepare(`${goc} AND ${SQL_LA_LAN_LAM} AND COALESCE(visibility, '') <> 'embargoed' LIMIT 1`).bind(sbd, qids, cd.taoLuc).first<Row>())
  } catch {
    try {
      return !!(await env.DB.prepare(`${goc} LIMIT 1`).bind(sbd, qids, cd.taoLuc).first<Row>()) // D1 cũ chưa có cột purpose/visibility
    } catch {
      return true
    }
  }
}

async function boTick(env: Env, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const lop = str(b.lop).trim(), khoaBai = str(b.khoaBai).trim()
  if (!lop || !khoaBai) return { ok: false, error: 'Thiếu lớp hoặc bài.' }
  await damBaoBangBaiDaDay(env)
  const cu = await dongConHieuLuc(env, lop, khoaBai)
  if (!cu) return { ok: true, chienDich: null }
  const r = await env.DB.prepare('UPDATE bai_da_day SET bo_tick_luc = ? WHERE id = ? AND bo_tick_luc IS NULL').bind(new Date(nowMs).toISOString(), str(cu.id)).run()
  xoaDemPhamVi(lop)
  if (!Number(r.meta?.changes ?? 0)) return { ok: true, chienDich: null } // lượt khác vừa bỏ tick
  const cdId = str(cu.chien_dich_id)
  const dong = cdId ? await env.DB.prepare('SELECT * FROM chien_dich WHERE id = ?').bind(cdId).first<Row>() : null
  if (!dong) return { ok: true, chienDich: null }
  const [cd] = await docChienDichKemBatDau(env, [dong])
  if (cd!.trangThai !== 'dang_chay') return { ok: true, chienDich: cd!.trangThai }
  const co = await coLuotLam(env, cd!)
  const kq = await goiChienDich(env, { action: co ? 'dong' : 'huy', id: cdId }, nowMs)
  if (kq.ok !== true) return { ok: false, error: str(kq.error) || 'Đã bỏ tick nhưng chưa đóng được chiến dịch.' }
  return { ok: true, chienDich: co ? 'da_dong' : 'da_huy' }
}

/** Số chứng chỉ Sẵn sàng 8+ đã cấp theo chiến dịch (bảng `omni_chung_chi` có thể chưa có ⇒ 0). */
async function demChungChi(env: Env, ids: readonly string[]): Promise<Map<string, number>> {
  if (!ids.length) return new Map()
  const r = await env.DB.prepare('SELECT chien_dich_id, COUNT(*) AS n FROM omni_chung_chi WHERE chien_dich_id IN (SELECT value FROM json_each(?)) GROUP BY chien_dich_id')
    .bind(JSON.stringify(ids)).all<Row>().catch(() => ({ results: [] as Row[] }))
  return new Map((r.results ?? []).map((x) => [str(x.chien_dich_id), Number(x.n) || 0]))
}

async function danhSach(env: Env, b: Row, nowMs: number): Promise<Record<string, unknown>> {
  const lop = str(b.lop).trim()
  if (!lop) return { ok: false, error: 'Chưa chọn lớp.' }
  await damBaoBangBaiDaDay(env)
  const rows = (await env.DB.prepare('SELECT * FROM bai_da_day WHERE lop = ? AND bo_tick_luc IS NULL ORDER BY vi_tri, tick_luc').bind(lop).all<Row>()).results ?? []
  const ids = [...new Set(rows.map((r) => str(r.chien_dich_id)).filter(Boolean))]
  const cdRows = ids.length ? (await env.DB.prepare('SELECT * FROM chien_dich WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ids)).all<Row>()).results ?? [] : []
  const [dsCd, dat] = await Promise.all([docChienDichKemBatDau(env, cdRows), demChungChi(env, ids)])
  const cds = new Map(dsCd.map((c) => [c.id, c]))
  const homNay = ngayVnCua(nowMs)
  const bai = rows.map((r) => {
    const cd = cds.get(str(r.chien_dich_id)) ?? null
    const dangLuyen = !!cd && cd.trangThai === 'dang_chay' && cd.hanNop >= homNay
    return {
      khoaBai: str(r.khoa_bai), tenBai: str(r.ten_bai), viTri: Number(r.vi_tri) || 0, tickLuc: str(r.tick_luc),
      chienDichId: str(r.chien_dich_id) || null,
      trangThai: dangLuyen ? 'dang_luyen' : 'da_day',
      hanNop: cd?.hanNop ?? null,
      conNgay: dangLuyen ? soNgayConLai(homNay, cd!.hanNop) : null,
      chungChi: { dat: cd ? dat.get(cd.id) ?? 0 : 0, tong: cd?.sbd.length ?? 0 },
    }
  })
  // Chờ bài mới: không còn bài đang luyện ⇒ số ngày từ hạn của bài gần nhất (chiến dịch chưa huỷ).
  const hanGanNhat = dsCd.filter((c) => c.trangThai !== 'da_huy').map((c) => c.hanNop).filter((h) => NGAY.test(h)).sort().pop()
  const choBaiMoi = !bai.some((x) => x.trangThai === 'dang_luyen') && hanGanNhat ? { soNgay: Math.max(0, soNgayGiua(hanGanNhat, homNay)) } : null
  return { ok: true, bai, choBaiMoi }
}

/**
 * `POST /gv/bai-da-day` — action:
 *   danh-sach {lop}                                  ⇒ { ok, bai: [{khoaBai, tenBai, viTri, tickLuc, chienDichId, trangThai:'dang_luyen'|'da_day', hanNop, conNgay, chungChi:{dat,tong}}], choBaiMoi: {soNgay}|null }
 *   (maDe[] và phamVi[].maDe: mã -VD / -DT / -TL bị bỏ trước khi tính / giao — `laMaToKhongGiao`; còn 0 tờ ⇒ { ok:false, error: CHU_BAI_CHUA_CO_TO_TU_GIAO })
 *   xem-truoc {lop, khoaBai, tenBai, viTri, maDe[], theLucNgay?, hanNop?} ⇒ { ok, soCau, soTuLuan, hanNop, D, luotCan, sucChua, duLuot, tongEm, duDiem8, quaTai:[{sbd,ten}], theLucNgay }
 *   tick {lop, khoaBai, tenBai, viTri, maDe[], phamVi:[{khoaBai,tenBai,viTri,maDe[]}], hanNop?, theLucNgay?, nguoi?} ⇒ { ok, chienDichId, hanNop, daCo }
 *   bo-tick {lop, khoaBai}                          ⇒ { ok, chienDich: 'da_huy'|'da_dong'|null }
 * Chọn em được giao (thầy 05/10): `sbd[]` ở xem-truoc/tick — bỏ trùng, bỏ SBD không có trong danh sách học sinh hoặc đã khoá; còn 0 em ⇒
 * { ok:false, error:'Chưa chọn em nào hợp lệ.' }; vắng `sbd` ⇒ cả lớp. xem-truoc trả thêm `soEmChon` (số em được giao); `tongEm` = số em của lớp;
 * duLuot / quaTai / duDiem8 tính trên em được giao. Tick lại bài còn hiệu lực (kể cả với danh sách em khác) ⇒ `daCo`, KHÔNG tạo chiến dịch mới
 * (sửa em qua màn Sửa chiến dịch sẵn có). `learner_scope` chỉ ghi cho em được giao.
 * `conNgay` = số ngày còn lại tính cả hôm nay (null khi không đang luyện).
 */
export async function gvBaiDaDay(env: Env, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  const action = str(b.action)
  try {
    if (action === 'danh-sach') return await danhSach(env, b, nowMs)
    if (action === 'xem-truoc') return await xemTruoc(env, b, nowMs)
    if (action === 'tick') return await tick(env, b, nowMs)
    if (action === 'bo-tick') return await boTick(env, b, nowMs)
    return { ok: false, error: 'Hành động không hợp lệ.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
