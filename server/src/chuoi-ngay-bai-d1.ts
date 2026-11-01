// B3 CHUỖI NGÀY THEO BÀI — phần D1 (hàm thuần ở chuoi-ngay-bai.ts). Bốn lượt ĐỌC độc lập đi CÙNG một đợt (Promise.all), nơi gọi bắt đầu sớm ⇒ không thêm vòng chờ.
//   1. sổ học `su_kien_hoc`: số câu khác nhau có kết quả theo ngày VN (chỉ mục idx_skh_em_ngay_qid) + câu tính mức (sổ ∪ học cách giải, từ 28/10)
//   2. `chua_loi_dot`: ngày em tự sửa xong (trang_thai_day = 'da_tu_sua', theo `dong_luc`)
//   3. điểm danh `buoi_hoc_diem_danh` 'co_phep' ⇒ ngày của buổi (theo `buoi_hoc.mo_luc`)
//   4. bình mua `chuoi_binh_mua` (bảng CHỈ-THÊM, tạo khi cộng bình lần đầu) + dòng đặt lại bình 27/10 (NGUON_DAT_LAI_BINH)
// Lượt 2–4 lỗi / bảng chưa có ⇒ coi như rỗng; lượt 1 lỗi ⇒ trả null (nơi gọi giữ số cũ, không bịa).
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { chuoiNgayCuaEm, ngayVn, NGAY_CHUOI_DU_MUC, SO_NGAY_DOC, SQL_CO_KET_QUA_HOAC_LUOT, SQL_COT_BINH_MUA, SQL_SO_CAU_MUC, type ChuoiNgay, type NhatKyChuoi } from './chuoi-ngay-bai'

export const SQL_CHUOI_BINH = [
  'CREATE TABLE IF NOT EXISTS chuoi_binh_mua (id TEXT PRIMARY KEY, sbd TEXT NOT NULL, so INTEGER NOT NULL, nguon TEXT NOT NULL, luc TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS idx_chuoi_binh_mua_sbd ON chuoi_binh_mua (sbd, luc)',
] as const
type Row = Record<string, unknown>
const lui = (ngay: string, n: number) => new Date(Date.parse(`${ngay}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)
const rongNeuLoi = (p: Promise<{ results?: Row[] }>) => p.then((r) => r.results ?? [], () => [] as Row[])

export async function docNhatKyChuoi(env: Env, sbd: string, nowMs: number): Promise<NhatKyChuoi> {
  const homNay = ngayVn(nowMs), tu = lui(homNay, SO_NGAY_DOC), tuIso = `${lui(tu, 1)}T00:00:00Z`
  const [sk, sua, phep, mua, muc] = await Promise.all([
    // c7 (02/11): câu tính mức = sổ + câu HỌC CÁCH GIẢI chưa có trong sổ (SQL_SO_CAU_MUC) — đúng số «Đủ x/y câu» của Lộ trình. Chỉ ngày từ mốc mới đọc thêm.
    env.DB.prepare(`SELECT ngay_vn AS n, COUNT(DISTINCT CASE WHEN ket_qua IS NOT NULL THEN qid END) AS c, CASE WHEN ngay_vn >= ? THEN ${SQL_SO_CAU_MUC} ELSE 0 END AS c7
        FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND ngay_vn <= ? AND ${SQL_CO_KET_QUA_HOAC_LUOT} GROUP BY ngay_vn`)
      .bind(NGAY_CHUOI_DU_MUC, sbd, tu, homNay).all<Row>(),
    rongNeuLoi(env.DB.prepare("SELECT DISTINCT date(dong_luc, '+7 hours') AS n FROM chua_loi_dot WHERE sbd = ? AND trang_thai_day = 'da_tu_sua' AND dong_luc >= ?").bind(sbd, tuIso).all<Row>()),
    rongNeuLoi(env.DB.prepare("SELECT DISTINCT date(b.mo_luc, '+7 hours') AS n FROM buoi_hoc_diem_danh d JOIN buoi_hoc b ON b.id = d.buoi_id WHERE d.sbd = ? AND d.trang_thai = 'co_phep' AND b.mo_luc >= ?").bind(sbd, tuIso).all<Row>()),
    rongNeuLoi(env.DB.prepare(`SELECT ${SQL_COT_BINH_MUA} FROM chuoi_binh_mua m WHERE m.sbd = ? AND m.luc >= ? GROUP BY n`).bind(sbd, tuIso).all<Row>()),
    // (28/10) mức câu đã chốt từng ngày — luật chuỗi «đủ mức hôm nay». Cùng đợt (song song), không thêm vòng chờ.
    rongNeuLoi(env.DB.prepare('SELECT ngay AS n, muc AS m FROM goi_bai_7_muc_ngay WHERE sbd = ? AND ngay >= ? AND ngay <= ?').bind(sbd, NGAY_CHUOI_DU_MUC, homNay).all<Row>()),
  ])
  const ngay = (x: Row) => String(x.n ?? '')
  return {
    soCau: new Map((sk.results ?? []).map((x) => [ngay(x), Number(x.c) || 0] as const)),
    tuSua: new Set(sua.map(ngay).filter(Boolean)),
    phep: new Set(phep.map(ngay).filter(Boolean)),
    mua: new Map(mua.map((x) => [ngay(x), Number(x.s) || 0] as const)),
    soCau7: new Map((sk.results ?? []).filter((x) => ngay(x) >= NGAY_CHUOI_DU_MUC).map((x) => [ngay(x), Number(x.c7) || 0] as const)),
    muc: new Map(muc.filter((x) => Number(x.m) > 0).map((x) => [ngay(x), Number(x.m)] as const)),
    datLai: new Set(mua.filter((x) => Number(x.r) === 1).map(ngay).filter(Boolean)),
  }
}

/** Chuỗi theo bài của một em; lỗi đọc sổ ⇒ null. */
export async function docChuoiNgayBai(env: Env, sbd: string, nowMs: number = Date.now(), thang = false): Promise<ChuoiNgay | null> {
  try { return chuoiNgayCuaEm(await docNhatKyChuoi(env, sbd, nowMs), ngayVn(nowMs), thang) } catch { return null }
}

/**
 * CỘNG BÌNH GIỮ CHUỖI (mua bằng tinh thể — giá và trừ ví thuộc đặc tả điểm thưởng của Code app 1; hàm này chỉ ghi bình). `id` là khoá chống trùng do nơi gọi
 * đặt (vd mã giao dịch ví) ⇒ gọi lại không cộng đôi. Sức chứa vẫn chặn ở hàm thuần (mua vượt sức chứa không thành bình thêm).
 */
export async function congBinh(env: Env, sbd: string, so: number, nguon: string, id: string, nowMs: number = Date.now()): Promise<boolean> {
  const n = Math.floor(Number(so))
  if (!sbd || !id || !Number.isFinite(n) || n < 1 || n > 3) throw new Error('Số bình không hợp lệ.')
  await chayDdlMotLan(env, 'chuoi_binh_mua', SQL_CHUOI_BINH)
  const r = await env.DB.prepare('INSERT OR IGNORE INTO chuoi_binh_mua (id, sbd, so, nguon, luc) VALUES (?, ?, ?, ?, ?)').bind(id, sbd, n, nguon.slice(0, 40), new Date(nowMs).toISOString()).run()
  return Number(r.meta.changes) > 0
}

/** Bắt đầu SỚM (song song lượt đọc khác): cờ `duolingo_bai` bật cho em ⇒ chuỗi theo bài; tắt / lỗi ⇒ null (giữ định nghĩa cũ). Không bao giờ ném. */
/** `thang` (CHỈ-THÊM 26/10, /hs/thuong): kèm `lich30` + `daiNhat` — cùng nhật ký, không đọc thêm. */
export function chuoiBaiNeuBat(env: Env, sbd: string, nowMs: number = Date.now(), envDoc: Env = env, thang = false): Promise<ChuoiNgay | null> {
  return import('./duolingo-bai-co').then((m) => m.duolingoChoEm(env, sbd, nowMs)).then((bat) => (bat ? docChuoiNgayBai(envDoc, sbd, nowMs, thang) : null)).catch(() => null)
}
