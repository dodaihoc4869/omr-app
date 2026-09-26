// ĐỢT 2 "THẦN THÚ MỖI NGÀY" — MÁY CHỦ (prompt-than-thu-moi-ngay-2109.md; DE-XUAT-THAN-THU-MOI-NGAY-2109.md Điều 3, 4, 5): kho rút câu = phần LỚP đã học, quota lượt/ngày ở máy chủ, chặn câu bài tập về nhà CHƯA nộp.
// Hàm thuần chọn lượt (`chooseLuotMoi`, `luotHomNay`) của Code 1 ở src/game/than-thu-v2/core.ts; ở đây chỉ ĐỌC dữ liệu và đóng gói. Mọi đọc bọc try/catch: thiếu bảng/cột (Worker lên trước migration) ⇒ giá trị an toàn, KHÔNG ném lỗi.
import type { Env } from './kieu'
import type { Mastery } from '../../src/game/than-thu-v2/core'
import type { DauVaoLuot, KetQuaLuot } from '../../src/game/than-thu-v2/core'
import { dauVaoLuotTuSo } from '../../src/game/than-thu-v2/core'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { tenLopCuaEm } from './ten-lop'
import { LAN_MOI_LUOT } from './btvn-nang-do-chang'

/** Cờ LÙI NHANH: `cau_hinh.game_luot_moi = 'tat'` ⇒ game rút câu bằng đường CŨ (chooseSessionWithRoles). Vắng / khác ⇒ BẬT. */
export const KHOA_GAME_LUOT_MOI = 'game_luot_moi'
/** Trần dòng `chi_tiet_cau` đọc để tính "dạng em đã thi" (`tinhDang`), theo ca GẦN NHẤT trước — chặn D1 giờ cao điểm (Boss 22/09, lượt 2). */
export const TRAN_DONG_TINH_DANG = 3000
/**
 * TRẦN CÂU MỖI NGÀY VN — HAI TRẦN RIÊNG (thầy lệnh 21/09 ~19:30: "cho riêng trần hộ tống đoàn là 60 câu nhé, tính riêng hẳn"; trước đó một trần gộp 60, và trước nữa 200):
 *   • ĐOÀN HỘ TỐNG: 60 lượt trả lời/ngày, CHỈ đếm lượt thuộc phiên của Đoàn (phiên có `json $.doan = 1`, `taoNguoi` đánh dấu);
 *   • ĐẢO và mọi chế độ game khác (Linh Tâm, võ đài…): 36 lượt/ngày (thiết kế DE-XUAT-THAN-THU-MOI-NGAY), KHÔNG bị Đoàn ăn vào — và ngược lại.
 * Vé, lượt Đảo, EXP KHÔNG đổi. Một nguồn hằng số ở đây; máy đọc `tranNgay`/`dailyUsed` (recommendations = Đảo, doan-sanh = Đoàn), không viết cứng.
 */
export const TRAN_CAU_DOAN_NGAY = 60
export const TRAN_CAU_DAO_NGAY = 36
export type LoaiTran = 'doan' | 'dao'
export const tranCuaLoai = (loai: LoaiTran): number => (loai === 'doan' ? TRAN_CAU_DOAN_NGAY : TRAN_CAU_DAO_NGAY)
/** Điều kiện SQL "lượt `a` thuộc loại này" (bảng `game_v2_attempt` bí danh `a`): phiên Đoàn = `game_v2_session.json $.doan = 1`; phiên khác / phiên đã xoá = Đảo. Chỉ đọc. */
export const dieuKienLoaiPhien = (loai: LoaiTran): string => `${loai === 'doan' ? '' : 'NOT '}EXISTS (SELECT 1 FROM game_v2_session s WHERE s.id = a.session AND s.sbd = a.sbd AND json_extract(s.json, '$.doan') = 1)`
/** Số lượt trả lời hôm nay (từ `tuIso`, đầu ngày VN) của một em theo LOẠI. */
export async function demCauTrongNgay(env: Env, sbd: string, tuIso: string, loai: LoaiTran): Promise<number> {
  const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM game_v2_attempt a WHERE a.sbd = ? AND a.created_at >= ? AND ${dieuKienLoaiPhien(loai)}`).bind(sbd, tuIso).first<{ n: number }>()
  return Number(r?.n) || 0
}
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

/** Cấu hình KẾ THỪA kho lớp: `cau_hinh.lop_da_hoc_ke_thua` = JSON `{"<lớp mới>": "<lớp gốc>"}` (Boss 21/09: lớp mới tách chưa có bài/ca riêng vẫn phải thừa kho của lớp gốc; em giỏi nhất không được có kho nhỏ nhất). */
export const KHOA_LOP_KE_THUA = 'lop_da_hoc_ke_thua'

/** Chuỗi lớp cho `tenLop`: [chính nó, lớp gốc, lớp gốc của lớp gốc…] theo cấu hình; chống vòng; cấu hình hỏng/vắng ⇒ chỉ chính nó. */
export async function docChuoiKeThua(env: Env, tenLop: string): Promise<string[]> {
  const ra = [tenLop]
  try {
    const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_LOP_KE_THUA).first<{ gia_tri: string }>()
    if (!r?.gia_tri) return ra
    const map = JSON.parse(String(r.gia_tri)) as Record<string, unknown>
    if (!map || typeof map !== 'object' || Array.isArray(map)) return ra
    let cur = tenLop
    for (let i = 0; i < 3; i++) { // tối đa 3 tầng kế thừa
      const cha = typeof map[cur] === 'string' ? String(map[cur]).trim() : ''
      if (!cha || ra.includes(cha)) break
      ra.push(cha); cur = cha
    }
  } catch { /* cấu hình hỏng: không kế thừa */ }
  return ra
}

/** Các dạng đã học của một TẬP em (`dsSbd`), tính từ D1: bài tập về nhà được giao (cá nhân hoá qua `btvn_cau`, bài thường qua tờ đề) + ca đã làm mà ĐÃ ĐÓNG hoặc ĐÃ CÔNG BỐ. Mỗi nguồn bọc riêng: thiếu nguồn nào bỏ nguồn ấy. */
async function tinhDang(env: Env, dsSbd: string[]): Promise<Set<string>> {
  const ra = new Set<string>()
  if (dsSbd.length === 0) return ra
  const arr = JSON.stringify(dsSbd)
  const lay = async (q: string, ...tham: unknown[]): Promise<void> => {
    try {
      const r = await env.DB.prepare(q).bind(...tham).all<{ dang: string | null }>()
      for (const x of r.results ?? []) if (x.dang) ra.add(String(x.dang))
    } catch { /* thiếu bảng/cột nguồn này: bỏ nguồn */ }
  }
  await lay("SELECT DISTINCT q.dang AS dang FROM btvn b JOIN btvn_em be ON be.ma_btvn = b.ma_btvn JOIN game_v2_question q ON q.ma_de = b.ma_de WHERE b.da_xoa = 0 AND COALESCE(b.ca_nhan, 0) = 0 AND be.sbd IN (SELECT value FROM json_each(?)) AND q.dang IS NOT NULL", arr)
  await lay('SELECT DISTINCT bc.dang AS dang FROM btvn_cau bc JOIN btvn b ON b.ma_btvn = bc.ma_btvn JOIN btvn_em be ON be.ma_btvn = b.ma_btvn WHERE b.da_xoa = 0 AND be.sbd IN (SELECT value FROM json_each(?)) AND bc.dang IS NOT NULL', arr)
  // HẠ TẢI D1 (Boss 22/09, lượt 2 — Code 1 đo: query này 268.796 dòng/200 lượt, tệ nhất 191k một lượt, `docs/do-tai-d1/ban-tai-348a09f-am.md` dòng 79): em thi
  // càng nhiều ca thì `chi_tiet_cau` (một dòng MỖI câu MỖI lần thi) càng phình, quét KHÔNG mốc thời gian. Chặn bằng LIMIT theo ca GẦN NHẤT trước, JOIN
  // `game_v2_question` sau — cùng ý tưởng `attempts()` ở game-v2.ts (LIMIT 3000 theo lượt gần nhất). Dạng của ca RẤT CŨ có thể rớt khỏi tập nếu em thi quá
  // nhiều ca công bố — chấp nhận được (dạng học lâu ngày không còn phù hợp trình độ hiện tại của em cũng hợp lý cho việc chọn câu game).
  // SỬA theo soát của Code 1 (22/09): `tinhDangLop` gọi hàm này với `dsSbd` = CẢ LỚP — LIMIT một cục trên tổng gộp (bản đầu) để em thi nhiều/gần đây chiếm hết
  // trần, đẩy dạng của em ít hoạt động ra ngoài dù lớp vẫn đang học dạng đó. `ROW_NUMBER() OVER (PARTITION BY cc.sbd …)` áp trần ĐÚNG THEO TỪNG EM — mỗi em
  // luôn được xét tối đa TRAN_DONG_TINH_DANG dòng gần nhất của CHÍNH mình, không bị em khác trong cùng lượt gọi lấn.
  await lay(
    `SELECT DISTINCT q.dang AS dang FROM (
       SELECT y.qid FROM (
         SELECT cc.qid, ROW_NUMBER() OVER (PARTITION BY cc.sbd ORDER BY c.bat_dau DESC) AS rn
           FROM chi_tiet_cau cc JOIN ca c ON c.ma_ca = cc.ma_ca
          WHERE cc.sbd IN (SELECT value FROM json_each(?)) AND c.trang_thai <> 'da_xoa' AND (c.trang_thai = 'dong' OR ${SQL_DA_CONG_BO('c')})
       ) y WHERE y.rn <= ${TRAN_DONG_TINH_DANG}
     ) x JOIN game_v2_question q ON q.qid = x.qid WHERE q.dang IS NOT NULL`,
    arr,
  )
  return ra
}

/** Các dạng LỚP đã học: dạng của mọi em thuộc lớp `tenLop` VÀ các lớp gốc trong `chuoi` (kế thừa). */
async function tinhDangLop(env: Env, chuoi: readonly string[]): Promise<string[]> {
  const rHs = await env.DB.prepare("SELECT sbd, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'").all<{ sbd: string; lop: string | null; ten_lop?: string | null }>().catch(async () => env.DB.prepare("SELECT sbd, lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'").all<{ sbd: string; lop: string | null; ten_lop?: string | null }>())
  const ds = (rHs.results ?? []).filter((h) => chuoi.includes(tenLopCuaEm(h.lop, h.ten_lop ?? null))).map((h) => String(h.sbd))
  return [...(await tinhDang(env, ds))].sort()
}

/**
 * Dạng em ĐƯỢC PHÉP rút = dạng LỚP đã học (lớp hiện tại + lớp gốc kế thừa; bảng đệm `lop_da_hoc`, nạp lại lười khi cũ hơn 6 giờ HOẶC khi chuỗi kế thừa đổi; mốc `cau_hinh.lop_da_hoc|<tên lớp>` = `<ISO>|<chuỗi>`)
 * ∪ dạng từ bài/ca CHÍNH EM được giao hoặc đã làm (bất kể lúc đó em thuộc lớp nào). Thiếu bảng đệm hoặc lỗi ⇒ chỉ phần của chính em / [] (game rút theo bằng chứng của em như cũ).
 */
export async function docDangLop(env: Env, sbd: string, nowMs: number): Promise<string[]> {
  const rieng = await tinhDang(env, [sbd]).catch(() => new Set<string>())
  try {
    const ten = await tenLopEm(env, sbd)
    if (!ten) return [...rieng].sort()
    const chuoi = await docChuoiKeThua(env, ten)
    const khoaChuoi = chuoi.join('>')
    const moc = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(KHOA_MOC_LOP(ten)).first<{ gia_tri: string }>()
    const [tMoc, ...conLai] = String(moc?.gia_tri ?? '').split('|')
    const tuoi = nowMs - Date.parse(String(tMoc))
    if (Number.isFinite(tuoi) && tuoi >= 0 && tuoi < SAU_GIO_MS && conLai.join('|') === khoaChuoi) {
      const r = await env.DB.prepare('SELECT dang FROM lop_da_hoc WHERE ten_lop = ? ORDER BY dang').bind(ten).all<{ dang: string }>()
      // Bảng đệm rỗng dù mốc còn mới (vừa reset toàn app xoá bảng, hoặc lớp thật sự chưa học gì) ⇒ tính lại — rẻ với lớp rỗng, và không để em kẹt "kho trống" tới 6 giờ.
      if ((r.results ?? []).length > 0) return [...new Set([...(r.results ?? []).map((x) => String(x.dang)), ...rieng])].sort()
    }
    const dang = await tinhDangLop(env, chuoi)
    const iso = new Date(nowMs).toISOString()
    await env.DB.batch([
      env.DB.prepare('DELETE FROM lop_da_hoc WHERE ten_lop = ?').bind(ten),
      ...(dang.length ? [env.DB.prepare('INSERT OR REPLACE INTO lop_da_hoc (ten_lop, dang, cap_nhat_luc) SELECT ?, value, ? FROM json_each(?)').bind(ten, iso, JSON.stringify(dang))] : []),
      env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc').bind(KHOA_MOC_LOP(ten), `${iso}|${khoaChuoi}`, iso),
    ])
    return [...new Set([...dang, ...rieng])].sort()
  } catch (e) {
    console.error('[game-luot] đọc dạng lớp lỗi (rút theo bằng chứng của em):', e instanceof Error ? e.message : e)
    return [...rieng].sort()
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

/** Số lượt Đảo (mode adventure, KHÔNG phải Đoàn/Linh Tâm) em đã DÙNG hôm nay (ngày VN): phiên có ≥ 1 câu trả lời HOẶC còn trong 2 giờ (mở rồi bỏ quá 2 giờ chưa trả lời câu nào không mất lượt). */
export async function demLuotHomNay(env: Env, sbd: string, ngay: string, nowMs: number = Date.now()): Promise<number> {
  try {
    const r = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM game_v2_session s WHERE s.sbd = ? AND s.created_at >= ? AND s.created_at < ? AND json_extract(s.json, '$.mode') = 'adventure'
          AND json_extract(s.json, '$.doan') IS NULL AND json_extract(s.json, '$.guardian') IS NULL
          AND (s.created_at > ? OR EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session = s.id AND a.sbd = s.sbd))`,
    ).bind(sbd, batDauNgay(ngay), hetNgay(ngay), new Date(nowMs - 2 * 3_600_000).toISOString()).first<{ n: number }>()
    return so(r?.n)
  } catch {
    return 0
  }
}

/** Lượt Đảo em vừa mở mà CHƯA trả lời câu nào (còn trong 2 giờ): `start` lần nữa trả lại CHÍNH lượt ấy — không bốc lại câu, không tốn lượt. null nếu không có. */
/**
 * MỞ PHIÊN LƯỢT MỚI — NGUYÊN TỬ (thầy 24/09, lát cắt 1 "chống lặp câu + cấp phát retry/cạnh tranh").
 *
 * `docLuotDangCho` ở trên đọc "em đang có lượt chờ" rồi mới chèn phiên; giữa HAI bước ấy hai yêu cầu SONG SONG cùng thấy "chưa có lượt chờ"
 * ⇒ cả hai chèn hai phiên (id ngẫu nhiên) ⇒ PHÁT HAI BỘ CÂU cho một em (đã tái hiện bằng ca tích hợp đường thật `/game-v2/start`).
 * Hàm này gộp lại thành MỘT câu lệnh: chèn phiên CHỈ KHI chưa có lượt chờ, dùng ĐÚNG vị từ của `docLuotDangCho`.
 *
 * Trả `true` = phiên NÀY được mở. Trả `false` = một yêu cầu khác vừa mở trước (hoặc trùng id) ⇒ nơi gọi quay lại `startLuotMoi`, đọc ĐÚNG lượt đã mở.
 * KHÔNG đổi luật chọn câu/trần/lượt: câu lệnh chỉ chặn hai lần mở trùng trong cùng thời điểm.
 */
export async function moPhienLuotMoi(env: Env, id: string, sbd: string, json: string, nowMs: number): Promise<boolean> {
  const r = await env.DB.prepare(
    `INSERT OR IGNORE INTO game_v2_session(id,sbd,json,created_at)
     SELECT ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM game_v2_session s WHERE s.sbd = ? AND s.created_at > ?
        AND json_extract(s.json, '$.mode') = 'adventure' AND json_extract(s.json, '$.doan') IS NULL AND json_extract(s.json, '$.guardian') IS NULL
        AND NOT EXISTS (SELECT 1 FROM game_v2_attempt a WHERE a.session = s.id AND a.sbd = s.sbd))`,
  ).bind(id, sbd, json, new Date(nowMs).toISOString(), sbd, new Date(nowMs - 2 * 3_600_000).toISOString()).run()
  return Number(r.meta?.changes ?? 0) > 0
}

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
  const soLuotDaLam = await demLuotHomNay(env, sbd, ngay, nowMs)
  let xongChangHomNay: boolean | null = null
  let xongOnToiHan = false
  try {
    const r = await env.DB.prepare(
      // `+nguon` (dấu cộng đơn ngôi) CẤM planner dùng idx_skh_nguon(nguon, ma_nguon): không có ANALYZE nó ưu tiên chỉ mục có cột `nguon` và đọc MỌI dòng btvn_lo / on_lai của CẢ TRƯỜNG (≈2,4 nghìn dòng mỗi lượt, tăng theo số chặng nộp — Code 1 đo bằng EXPLAIN 21/09); có dấu cộng thì đi idx_skh_em_ngay(sbd, ngay_vn) chỉ các dòng của em hôm nay. Không đổi kết quả.
      // Bài "đang chạy" = CÒN chặng chưa xong (đã xong hết chặng mà chưa bấm nộp KHÔNG tính). Chặng "xong hôm nay" = có câu btvn_lo hôm nay của chặng ĐÃ XONG (chỉ số < lo_da_xong), không phải mới làm 1 câu.
      `SELECT (SELECT COUNT(*) FROM btvn_em be JOIN btvn b ON b.ma_btvn = be.ma_btvn WHERE be.sbd = ? AND be.nop_luc IS NULL AND b.da_xoa = 0 AND COALESCE(be.thu_hoi, 0) = 0 AND b.han_nop > ?
                 AND (be.so_chang IS NULL OR COALESCE(be.lo_da_xong, 0) < be.so_chang)) AS dang_chay,
              (SELECT COUNT(*) FROM (SELECT DISTINCT s.ma_nguon AS ma, (s.lan % ${LAN_MOI_LUOT}) AS chi FROM su_kien_hoc s WHERE s.sbd = ? AND s.ngay_vn = ? AND +s.nguon = 'btvn_lo' AND s.ket_qua IS NOT NULL) x
                 JOIN btvn_em be2 ON be2.ma_btvn = x.ma AND be2.sbd = ? WHERE x.chi < COALESCE(be2.lo_da_xong, 0)) AS chang_xong_hom_nay,
              (SELECT COUNT(*) FROM su_kien_hoc WHERE sbd = ? AND ngay_vn = ? AND +nguon = 'on_lai') AS on_hom_nay,
              (SELECT COUNT(*) FROM nam_kt_cau WHERE sbd = ? AND moc_on_ke IS NOT NULL AND substr(moc_on_ke, 1, 10) <= ? AND trang_thai IN ('moi_sai', 'dang_on') AND COALESCE(can_day_lai, 0) = 0) AS con_toi_han`,
    ).bind(sbd, new Date(nowMs).toISOString(), sbd, ngay, sbd, sbd, ngay, sbd, ngay).first<{ dang_chay: number; chang_xong_hom_nay: number; on_hom_nay: number; con_toi_han: number }>()
    // Luật "xong chặng / xong ôn tới hạn" là hàm thuần của Code 1 (`dauVaoLuotTuSo`): ôn tới hạn xong = hôm nay có ≥ 1 câu ôn lại VÀ không còn câu tới hạn; khắc phục không tính; số lạ ⇒ chưa xong.
    const t = dauVaoLuotTuSo({ changXongHomNay: so(r?.chang_xong_hom_nay) > 0, soCauOnHomNay: so(r?.on_hom_nay), conCauToiHan: so(r?.con_toi_han), coBaiConChang: so(r?.dang_chay) > 0 })
    xongChangHomNay = t.xongChangHomNay
    xongOnToiHan = t.xongOnToiHan
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
