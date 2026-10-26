// LỜI GIẢI KIỂU SƠ ĐỒ CỦA THẦY + GỢI Ý 3 TẦNG — LỆNH ĐỌC (thầy chốt build 26/10). Hợp đồng: src/lib/goi-y-cham/kieu.ts. Bảng: server/migration-2610-loi-giai-so-do.sql.
//
// `/hs/goi-y-so-do {token, qid, session?}` ⇒ `GoiYTraVe`:
//   · chỉ trả bản có `cong = 'dat'` VÀ qua lại cổng kiểm với đáp án HIỆN TẠI của kho (thầy sửa đề/đáp án ⇒ bản cũ tự tắt);
//   · TRƯỚC khi em nộp câu ⇒ `catTruocNop` (bỏ mọi `ketQua`); SAU khi máy chủ thấy em đã nộp câu (bản chấm của lượt `session`, hoặc dòng sổ luyện
//     như `/hs/loi-giai`) và em không còn đang làm câu ấy ở lượt nào ⇒ trả đủ;
//   · TẮT HẲN khi em đang có ca kiểm tra mở / chặng kiểm tra cá nhân đang chạy (`trangThaiHoiThay`), hoặc câu (qid / nhóm nội dung) đang nằm trong
//     một ca chưa công bố / còn làm được — kể cả bài tập về nhà chấm điểm (`protectedQuestions`, đúng tập game dùng để không phát câu ấy);
//   · MỌI lượt đọc chạy CÙNG một đợt D1 (Promise.all) — bản sơ đồ, câu kho, trạng thái làm/kiểm tra, tập bảo vệ, đã nộp, mật khẩu còn khớp.
//   · Đọc gợi ý TRƯỚC khi nộp trong một lượt game ⇒ đánh dấu câu của lượt `goiY` (lượt nộp tính «có trợ giúp», đặc tả mục 8.2) — việc phụ sau phản hồi.
//
// Lời giải sau nộp của lệnh `answer` (game-v2.ts) kèm `soDo` khi có bản đạt — đọc trong CÙNG đợt đọc sẵn đầu lượt (`docTruocAnswer`), không thêm vòng.
//
// LÙI MỘT DÒNG: `SO_DO_BAT = false` dưới đây, hoặc biến môi trường Worker `TAT_SO_DO=1` (không cần đẩy mã) ⇒ lệnh đọc trả `{ok:true, co:false}`
// và `answer` không đọc bảng, không kèm `soDo`. `solution` cũ của kho luôn giữ nguyên.
import type { Env, D1Database } from './kieu'
import type { BanSoDo, GoiYTraVe } from '../../src/lib/goi-y-cham/kieu'
import { catTruocNop, kiemCong, type CauKiemCong } from './so-do-cong'
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { protectedQuestions } from './game-v2-bank'
import { trangThaiHoiThay } from './hoi-thay-ca-nhan'
import { TU_CHI_MUC_GAME } from './cau-theo-qid'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v)).trim()

/** CÔNG TẮC TOÀN CỤC (hằng): false ⇒ tắt cả lệnh đọc lẫn trường `soDo` của `answer`. */
export const SO_DO_BAT = true
/** Tắt bằng hằng hoặc biến môi trường `TAT_SO_DO` có giá trị thật ('1', 'true'…). */
export const soDoBiTat = (env: unknown): boolean => {
  if (!SO_DO_BAT) return true
  const v = (env as Record<string, unknown> | null | undefined)?.TAT_SO_DO
  return v !== undefined && v !== null && v !== '' && v !== '0' && v !== 'false' && v !== false
}

/**
 * qid nào được dùng bản cho câu `qid`, theo thứ tự ưu tiên. Bản của chính qid luôn đứng đầu.
 * Câu LẶP cùng số liệu (`<Q>#n` lần làm trong ngày, `<Q>~n` bản lặp trong lượt) ⇒ thêm bản của câu gốc `<Q>`.
 * Song sinh / biến thể / ý Đ–S mới (`~ss` `~bt` `~yd`) ĐỔI số liệu ⇒ KHÔNG dùng bản gốc (không chắc thì không trả).
 */
export function qidTraSoDo(qid: string): string[] {
  const q = str(qid)
  if (!q) return []
  if (/~(?:ss|bt|yd)\d+(?:#\d+)?$/.test(q)) return [q]
  let goc = q
  for (let i = 0; i < 4; i++) { const t = goc.replace(/#\d+$/, '').replace(/~\d+$/, ''); if (t === goc) break; goc = t }
  return goc && goc !== q ? [q, goc] : [q]
}

/** Các dòng bản ĐẠT của những qid ấy (MỘT câu SELECT theo khoá chính). Lỗi đọc (vd. chưa chạy migration) ⇒ rỗng: không có bản, không hỏng lệnh. */
export function docSoDoDat(db: D1Database, qids: string[]): Promise<Row[]> {
  if (!qids.length) return Promise.resolve([])
  return db.prepare("SELECT qid, ban_json FROM loi_giai_so_do WHERE qid IN (?, ?) AND cong = 'dat'")
    .bind(qids[0], qids[1] ?? qids[0]).all<Row>()
    .then((r) => r.results ?? [], () => [])
}

/** `choices` của câu kho (mảng) ⇒ `{A: …, B: …}`. */
export function luaChonTuChoices(choices: unknown): Record<string, string> {
  let ds: unknown = choices
  if (typeof ds === 'string') { try { ds = JSON.parse(ds) } catch { ds = [] } }
  if (!Array.isArray(ds)) return {}
  return Object.fromEntries(ds.slice(0, 4).map((x, i) => ['ABCD'[i]!, str(x)]))
}

/**
 * Chọn bản theo thứ tự `qids` và KIỂM LẠI với câu hiện tại (`cauCua(qid của bản)` — đáp án kho bây giờ, không tin cổng lúc lưu).
 * Không có câu để kiểm / cổng không còn 'dat' / JSON hỏng ⇒ null.
 */
export function chonBanDat(rows: Row[], qids: string[], cauCua: (qid: string) => CauKiemCong | null): BanSoDo | null {
  for (const q of qids) {
    const r = rows.find((x) => str(x.qid) === q)
    if (!r) continue
    let ban: BanSoDo
    try { ban = JSON.parse(str(r.ban_json)) as BanSoDo } catch { continue }
    const cau = cauCua(q)
    if (!cau || !ban || typeof ban !== 'object') continue
    if (kiemCong(ban, cau).ket === 'dat') return ban
  }
  return null
}

const PHAN = new Set(['I', 'II', 'III'])
/** Câu kho (dòng `SELECT phan, dap_an, lua_chon`) ⇒ đầu vào cổng kiểm. */
function cauTuDong(r: Row | undefined): CauKiemCong | null {
  if (!r) return null
  const phan = str(r.phan)
  if (!PHAN.has(phan)) return null
  return { phan: phan as CauKiemCong['phan'], dapAn: str(r.dap_an), ...(phan === 'I' ? { luaChon: luaChonTuChoices(r.lua_chon) } : {}) }
}

type TraVe = GoiYTraVe & { lyDo?: string }
const KHONG = (lyDo: string): TraVe => ({ ok: true, co: false, lyDo })

/**
 * `/hs/goi-y-so-do {token, qid, session?}` — em mở «Bắt đầu từ đâu?» (trước nộp) hoặc lời giải kiểu sơ đồ (sau nộp).
 * `sau(viec)`: chạy việc ghi phụ sau phản hồi (`ctx.waitUntil`); vắng ⇒ chạy tại chỗ.
 */
export async function hsGoiYSoDo(env: Env, b: Row, tuyChon: { sau?: (viec: Promise<unknown>) => void } = {}): Promise<TraVe | { ok: false; error: string }> {
  const { sbd, xong } = await gameIdentityHaiBuoc(env, b) // bước 1 không chạm D1: token hỏng ⇒ ném ngay
  const qid = str(b.qid).slice(0, 200)
  if (!qid) { await xong; return { ok: false, error: 'Thiếu câu cần xem.' } }
  if (soDoBiTat(env)) { await xong; return KHONG('tat') }
  const qids = qidTraSoDo(qid)
  const phien = str(b.session).slice(0, 80)
  const nay = Date.now()
  // MỘT ĐỢT D1: sáu lượt đọc độc lập chạy song song.
  const [, rows, cauRows, tt, baoVe, daNop] = await Promise.all([
    xong,
    docSoDoDat(env.DB, qids),
    env.DB.prepare(`SELECT q.qid, q.content_group AS nhom, json_extract(q.json,'$.phan') AS phan, json_extract(q.json,'$.correct') AS dap_an,
        json_extract(q.json,'$.choices') AS lua_chon ${TU_CHI_MUC_GAME}`).bind(JSON.stringify(qids)).all<Row>().then((r) => r.results ?? [], () => null),
    trangThaiHoiThay(env, sbd, qid, nay).catch(() => null),
    protectedQuestions(env).catch(() => null),
    env.DB.prepare(`SELECT EXISTS(SELECT 1 FROM game_v2_attempt WHERE id = ? AND sbd = ?) AS phien,
        EXISTS(SELECT 1 FROM su_kien_hoc WHERE sbd = ? AND qid IN (?, ?) AND nguon <> 'thi' AND COALESCE(visibility,'released') <> 'embargoed') AS luyen`)
      .bind(`${phien}|${qid}`, sbd, sbd, qid, qids[qids.length - 1]).first<Row>().catch(() => null),
  ])
  // Không kiểm được trạng thái ⇒ đóng (thà không gợi ý còn hơn lộ trong ca kiểm tra).
  if (!tt || tt.dangKiemTra) return KHONG('dang_kiem_tra')
  if (!baoVe || cauRows === null) return KHONG('ca_chua_cong_bo')
  const nhom = cauRows.map((r) => str(r.nhom)).filter(Boolean)
  if ([...qids, ...nhom].some((k) => baoVe.has(k))) return KHONG('ca_chua_cong_bo')
  const ban = chonBanDat(rows, qids, (q) => cauTuDong(cauRows.find((r) => str(r.qid) === q)))
  if (!ban) return KHONG('chua_co')
  const daNopCau = (Number(daNop?.phien) === 1 && !!phien) || Number(daNop?.luyen) === 1
  if (daNopCau && !tt.dangLam) return { ok: true, co: true, giaiDoan: 'sau', ban }
  // TRƯỚC NỘP trong một lượt game: câu của lượt mang `goiY` ⇒ lượt nộp tính «có trợ giúp» (game-v2.ts `answer`). Chỉ khi chưa có bản chấm.
  if (phien) {
    // `game_v2_session.json` ghi rõ bảng: trong json_each, `json` trần trỏ vào cột ẩn `json` của chính json_each (không khớp dòng nào).
    const viec = env.DB.prepare(`UPDATE game_v2_session SET json = json_set(json, '$.questions[' || (SELECT j.key FROM json_each(game_v2_session.json,'$.questions') j
        WHERE json_extract(j.value,'$.qid') = ? ORDER BY j.key LIMIT 1) || '].goiY', 1)
      WHERE id = ? AND sbd = ? AND EXISTS(SELECT 1 FROM json_each(game_v2_session.json,'$.questions') j WHERE json_extract(j.value,'$.qid') = ?)
        AND NOT EXISTS(SELECT 1 FROM game_v2_attempt WHERE id = ?)`).bind(qid, phien, sbd, qid, `${phien}|${qid}`).run().catch(() => null)
    if (tuyChon.sau) tuyChon.sau(viec)
    else await viec
  }
  return { ok: true, co: true, giaiDoan: 'truoc', ban: catTruocNop(ban) }
}
