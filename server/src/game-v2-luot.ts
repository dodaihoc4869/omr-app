// ĐỢT 2 "THẦN THÚ MỖI NGÀY" — MÁY CHỦ (prompt-than-thu-moi-ngay-2109.md; DE-XUAT-THAN-THU-MOI-NGAY-2109.md Điều 3, 4, 5): kho rút câu = phần LỚP đã học, quota lượt/ngày ở máy chủ, chặn câu bài tập về nhà CHƯA nộp.
// Hàm thuần chọn lượt (`chooseLuotMoi`, `luotHomNay`) của Code 1 ở src/game/than-thu-v2/core.ts; ở đây chỉ ĐỌC dữ liệu và đóng gói. Mọi đọc bọc try/catch: thiếu bảng/cột (Worker lên trước migration) ⇒ giá trị an toàn, KHÔNG ném lỗi.
import type { Env } from './kieu'
import type { Mastery } from '../../src/game/than-thu-v2/core'
import type { DauVaoLuot, KetQuaLuot } from '../../src/game/than-thu-v2/core'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { tenLopCuaEm } from './ten-lop'

/** Cờ LÙI NHANH: `cau_hinh.game_luot_moi = 'tat'` ⇒ game rút câu bằng đường CŨ (chooseSessionWithRoles). Vắng / khác ⇒ BẬT. */
export const KHOA_GAME_LUOT_MOI = 'game_luot_moi'
/** Trần cứng toàn game mỗi ngày VN (hạ từ 200): 36 câu Đảo + 24 câu Đoàn. */
export const TRAN_CAU_GAME_NGAY = 60
export const MOT_NGAY_MS = 86_400_000
const SAU_GIO_MS = 6 * 3_600_000
const KHOA_MOC_LOP = (ten: string): string => `lop_da_hoc|${ten}`

const batDauNgay = (ngay: string): string => new Date(`${ngay}T00:00:00+07:00`).toISOString()
const hetNgay = (ngay: string): string => new Date(Date.parse(batDauNgay(ngay)) + MOT_NGAY_MS).toISOString()
const so = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0)

export async function luotMoiBat(env: Env): Promise<boolean> {
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_GAME_LUOT_MOI).first<{ gia_tri: string }>()
    return String(r?.gia_tri ?? '').trim().toLowerCase() !== 'tat'
  } catch {
    return true
  }
}

/** Tên lớp hiệu lực của em (đã gán, không thì theo khối). Thiếu cột `ten_lop` ⇒ theo khối. Không có em ⇒ ''. */
async function tenLopEm(env: Env, sbd: string): Promise<string> {
  try {
    const r = await env.DB.prepare('SELECT lop, ten_lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ lop: string | null; ten_lop: string | null }>()
    return r ? tenLopCuaEm(r.lop, r.ten_lop) : ''
  } catch {
    try {
      const r = await env.DB.prepare('SELECT lop FROM hoc_sinh WHERE sbd = ?').bind(sbd).first<{ lop: string | null }>()
      return r ? tenLopCuaEm(r.lop, null) : ''
    } catch {
      return ''
    }
  }
}

/** Các dạng LỚP đã học, tính lại từ D1 (bài tập về nhà giao cho lớp: cá nhân hoá qua `btvn_cau`, bài thường qua tờ đề; ca lớp đã làm và ĐÃ ĐÓNG hoặc ĐÃ CÔNG BỐ). Mỗi nguồn bọc riêng: thiếu nguồn nào bỏ nguồn ấy. */
async function tinhDangLop(env: Env, tenLop: string): Promise<string[]> {
  const rHs = await env.DB.prepare("SELECT sbd, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'").all<{ sbd: string; lop: string | null; ten_lop?: string | null }>().catch(async () => env.DB.prepare("SELECT sbd, lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'").all<{ sbd: string; lop: string | null; ten_lop?: string | null }>())
  const ds = (rHs.results ?? []).filter((h) => tenLopCuaEm(h.lop, h.ten_lop ?? null) === tenLop).map((h) => String(h.sbd))
  if (ds.length === 0) return []
  const arr = JSON.stringify(ds)
  const ra = new Set<string>()
  const lay = async (q: string, ...tham: unknown[]): Promise<void> => {
    try {
      const r = await env.DB.prepare(q).bind(...tham).all<{ dang: string | null }>()
      for (const x of r.results ?? []) if (x.dang) ra.add(String(x.dang))
    } catch { /* thiếu bảng/cột nguồn này: bỏ nguồn */ }
  }
  await lay("SELECT DISTINCT q.dang AS dang FROM btvn b JOIN btvn_em be ON be.ma_btvn = b.ma_btvn JOIN game_v2_question q ON q.ma_de = b.ma_de WHERE b.da_xoa = 0 AND COALESCE(b.ca_nhan, 0) = 0 AND be.sbd IN (SELECT value FROM json_each(?)) AND q.dang IS NOT NULL", arr)
  await lay('SELECT DISTINCT bc.dang AS dang FROM btvn_cau bc JOIN btvn b ON b.ma_btvn = bc.ma_btvn JOIN btvn_em be ON be.ma_btvn = b.ma_btvn WHERE b.da_xoa = 0 AND be.sbd IN (SELECT value FROM json_each(?)) AND bc.dang IS NOT NULL', arr)
  await lay(
    `SELECT DISTINCT q.dang AS dang FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca JOIN game_v2_question q ON q.qid = cc.qid
      WHERE cc.sbd IN (SELECT value FROM json_each(?)) AND c.trang_thai <> 'da_xoa' AND (c.trang_thai = 'dong' OR ${SQL_DA_CONG_BO('c')}) AND q.dang IS NOT NULL`,
    arr,
  )
  return [...ra].sort()
}

/**
 * Dạng LỚP của em đã học — đọc bảng đệm `lop_da_hoc`, nạp lại lười khi cũ hơn 6 giờ (mốc `cau_hinh.lop_da_hoc|<tên lớp>`). Thiếu bảng đệm hoặc lỗi ⇒ [] (game rút theo bằng chứng của em như cũ).
 */
export async function docDangLop(env: Env, sbd: string, nowMs: number): Promise<string[]> {
  try {
    const ten = await tenLopEm(env, sbd)
    if (!ten) return []
    const moc = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_MOC_LOP(ten)).first<{ gia_tri: string }>()
    const tuoi = nowMs - Date.parse(String(moc?.gia_tri ?? ''))
    if (Number.isFinite(tuoi) && tuoi >= 0 && tuoi < SAU_GIO_MS) {
      const r = await env.DB.prepare('SELECT dang FROM lop_da_hoc WHERE ten_lop = ? ORDER BY dang').bind(ten).all<{ dang: string }>()
      return (r.results ?? []).map((x) => String(x.dang))
    }
    const dang = await tinhDangLop(env, ten)
    const iso = new Date(nowMs).toISOString()
    await env.DB.batch([
      env.DB.prepare('DELETE FROM lop_da_hoc WHERE ten_lop = ?').bind(ten),
      ...(dang.length ? [env.DB.prepare('INSERT OR REPLACE INTO lop_da_hoc (ten_lop, dang, cap_nhat_luc) SELECT ?, value, ? FROM json_each(?)').bind(ten, iso, JSON.stringify(dang))] : []),
      env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc').bind(KHOA_MOC_LOP(ten), iso, iso),
    ])
    return dang
  } catch (e) {
    console.error('[game-luot] đọc dạng lớp lỗi (rút theo bằng chứng của em):', e instanceof Error ? e.message : e)
    return []
  }
}

/** qid VÀ nhóm nội dung của mọi câu nằm trong bài tập về nhà em CHƯA nộp (bài cá nhân hoá: `btvn_em_cau`; bài thường: cả tờ đề). Game hiện lời giải ngay ⇒ KHÔNG rút các câu này. Lỗi ⇒ tập rỗng. */
export async function docCauBtvnChuaNop(env: Env, sbd: string): Promise<Set<string>> {
  const ra = new Set<string>()
  const doc = async (q: string): Promise<void> => {
    try {
      const r = await env.DB.prepare(q).bind(sbd).all<{ qid: string; grp: string | null }>()
      for (const x of r.results ?? []) { ra.add(String(x.qid)); if (x.grp) ra.add(String(x.grp)) }
    } catch { /* thiếu bảng/cột: bỏ nguồn */ }
  }
  await doc(
    `SELECT q.qid AS qid, q.content_group AS grp FROM btvn_em_cau ec JOIN btvn_em be ON be.ma_btvn = ec.ma_btvn AND be.sbd = ec.sbd JOIN btvn b ON b.ma_btvn = ec.ma_btvn
       JOIN game_v2_question q ON q.qid = ec.qid WHERE ec.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(be.thu_hoi, 0) = 0`,
  )
  await doc(
    `SELECT q.qid AS qid, q.content_group AS grp FROM btvn b JOIN btvn_em be ON be.ma_btvn = b.ma_btvn JOIN game_v2_question q ON q.ma_de = b.ma_de
      WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(b.ca_nhan, 0) = 0 AND COALESCE(be.thu_hoi, 0) = 0`,
  )
  return ra
}

/** Số lượt Đảo (mode adventure, KHÔNG phải Đoàn/Linh Tâm) em đã MỞ hôm nay (ngày VN). */
export async function demLuotHomNay(env: Env, sbd: string, ngay: string): Promise<number> {
  try {
    const r = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM game_v2_session WHERE sbd = ? AND created_at >= ? AND created_at < ? AND json_extract(json, '$.mode') = 'adventure'
          AND json_extract(json, '$.doan') IS NULL AND json_extract(json, '$.guardian') IS NULL`,
    ).bind(sbd, batDauNgay(ngay), hetNgay(ngay)).first<{ n: number }>()
    return so(r?.n)
  } catch {
    return 0
  }
}

/** Lượt Đảo em vừa mở mà CHƯA trả lời câu nào (còn trong 2 giờ): `start` lần nữa trả lại CHÍNH lượt ấy — không bốc lại câu, không tốn lượt. null nếu không có. */
export async function docLuotDangCho(env: Env, sbd: string, nowMs: number): Promise<{ id: string; json: string } | null> {
  try {
    const r = await env.DB.prepare(
      `SELECT s.id AS id, s.json AS json FROM game_v2_session s WHERE s.sbd = ? AND s.created_at > ? AND json_extract(s.json, '$.mode') = 'adventure'
          AND json_extract(s.json, '$.doan') IS NULL AND json_extract(s.json, '$.guardian') IS NULL
          AND NOT EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session = s.id AND a.sbd = s.sbd) ORDER BY s.created_at DESC LIMIT 1`,
    ).bind(sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).first<{ id: string; json: string }>()
    return r ?? null
  } catch {
    return null
  }
}

/** Dữ liệu cho `luotHomNay` (Code 1): số lượt đã mở, xong chặng BTVN hôm nay (null = không có bài đang chạy), xong ôn tới hạn, đạt ngày, số câu thú đúng/tổng hôm nay (Đoàn/Linh Tâm không tính). */
export async function docDauVaoLuot(env: Env, sbd: string, ngay: string, nowMs: number, datHomNay: boolean): Promise<DauVaoLuot> {
  const soLuotDaLam = await demLuotHomNay(env, sbd, ngay)
  let xongChangHomNay: boolean | null = null
  let xongOnToiHan = false
  try {
    const r = await env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(be.thu_hoi, 0) = 0 AND b.han_nop > ?) AS dang_chay,
              (SELECT COUNT(*) FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon = 'btvn_lo') AS lo_hom_nay,
              (SELECT COUNT(*) FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND nguon IN ('on_lai', 'khac_phuc')) AS on_hom_nay`,
    ).bind(sbd, new Date(nowMs).toISOString(), sbd, ngay, sbd, ngay).first<{ dang_chay: number; lo_hom_nay: number; on_hom_nay: number }>()
    xongChangHomNay = so(r?.dang_chay) > 0 ? so(r?.lo_hom_nay) > 0 : null
    xongOnToiHan = so(r?.on_hom_nay) > 0
  } catch { /* chưa có bảng BTVN nâng đỡ: coi như không có bài đang chạy */ }
  let dungHomNay = 0
  let tongHomNay = 0
  try {
    const r = await env.DB.prepare(
      `SELECT COUNT(*) AS tong, COALESCE(SUM(CASE WHEN json_extract(a.json, '$.attempt.correct') = 1 AND COALESCE(json_extract(a.json, '$.attempt.assisted'), 0) = 0 THEN 1 ELSE 0 END), 0) AS dung
         FROM game_v2_attempt a WHERE a.sbd = ? AND a.created_at >= ? AND a.created_at < ?
          AND NOT EXISTS (SELECT 1 FROM game_v2_session s WHERE s.id = a.session AND (json_extract(s.json, '$.doan') IS NOT NULL OR json_extract(s.json, '$.guardian') IS NOT NULL))`,
    ).bind(sbd, batDauNgay(ngay), hetNgay(ngay)).first<{ tong: number; dung: number }>()
    tongHomNay = so(r?.tong)
    dungHomNay = so(r?.dung)
  } catch { /* chưa có lượt nào */ }
  return { soLuotDaLam, xongChangHomNay, xongOnToiHan, datHomNay, dungHomNay, tongHomNay }
}

/** Phần trả cho máy em (chỉ-thêm): `luot` = kết quả `luotHomNay` + số lượt đã mở. */
export function tomTatLuot(k: KetQuaLuot, daLam: number): Record<string, unknown> {
  return { tongLuotMo: k.tongLuotMo, daLam, conLai: k.conLai, tran: k.tran, tongCauToiDa: k.tongCauToiDa, danhSach: k.danhSach, luotTiepTheo: k.luotTiepTheo, khoa: k.khoa }
}

/** Màn hết lượt: "Mai thú chờ em: N dạng mới · M câu tới hạn ôn". Dạng mới = dạng lớp đã học mà em chưa có mastery; tới hạn = dạng đã học có mốc ôn trong hôm nay/mai. */
export function maiCho(dangLop: readonly string[], mastery: readonly Mastery[], nowMs: number): { dangMoi: number; toiHan: number } {
  const daGap = new Set(mastery.map((m) => m.key))
  return { dangMoi: dangLop.filter((d) => !daGap.has(d)).length, toiHan: mastery.filter((m) => m.stage >= 1 && m.due <= nowMs + MOT_NGAY_MS).length }
}
