// HUỶ CHIẾN DỊCH ⇒ THU HỒI HẾT PHẦN ĐÃ PHÂN (thầy 06/10: "Tôi hủy một chiến dịch amine. Nhưng học sinh Đỗ Đại Học vẫn làm câu của chiến dịch.
// Tôi muốn khi hủy chiến dịch thì những học sinh đã phân phải đc thu hồi hết").
//
// Luật: HUỶ = như chưa từng giao. (KẾT THÚC `dong` KHÁC: nợ của chiến dịch vẫn theo em — sổ nợ 29/09.) Gốc lỗi cũ: `huy` chỉ đổi `trang_thai` ⇒ kế hoạch lập lại không còn câu chiến
// dịch, nhưng câu em đã làm SAI trong chiến dịch vẫn bị "nguồn thứ 4" (`docQidSaiV2`) kéo lại làm nợ cũ, và lượt game em đang mở (máy em đã tải câu) vẫn chấm tiếp câu ấy.
// Thu hồi gồm bốn phần:
//   1. NỢ do chiến dịch bị huỷ sinh ra: lọc lúc ĐỌC (srs2-d1.ts `docHoSo2` — `ChienDichDaHuy`), không ghi gì ⇒ mọi máy chủ thấy ngay, kế hoạch lập lại tự sạch.
//   2. KẾ HOẠCH hôm nay đã chốt: tự lập lại ở lần mở kế tiếp (mã chiến dịch / tập chiến dịch đổi — cơ chế sẵn có, giữ câu đã làm); câu không còn trong hồ sơ được thay tại chỗ.
//   3. LƯỢT GAME ĐANG MỞ (≤ 2 giờ, Đảo / Bi-a — Đoàn do phòng quản): đánh CỜ `thuHoiLuc` vào JSON lượt (tệp này) ⇒ `answer` báo mã `cau_doi` cho đúng câu của chiến dịch bị huỷ
//      (máy em tự sang câu kế, không tính sai — cùng đường câu bị rút khỏi kho), `resume` / `complete` bỏ câu ấy. Lượt không dính chiến dịch nào KHÔNG có cờ ⇒ không tốn thêm truy vấn.
//   4. BÀI ĐÃ TICK gắn chiến dịch: nhả dấu tick (như `bo-tick`) — bài không còn "đã dạy" nên câu bài ấy không quay lại làm "Ôn bài cũ"; thầy tick lại được (trước: tick lại chỉ trả
//      chiến dịch đã huỷ).
// KHÔNG xoá/sửa sổ làm bài (`su_kien_hoc`), điểm, EXP, hồ sơ đã có của em: huỷ thu hồi phần CHƯA làm và việc tính nợ, không làm mất dữ liệu thật.
import type { Env } from './kieu'
import { tachSongSinh } from './loi-hoc-luat'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))

/** Lượt game chỉ còn hiệu lực 2 giờ (game-v2.ts `answer`) ⇒ chỉ cần đánh cờ lượt tạo trong 2 giờ qua. */
const HAN_LUOT_MS = 2 * 3_600_000

export interface KetQuaThuHoi {
  /** Số em của chiến dịch (cùng nhận thu hồi). */
  soEm: number
  /** Số lượt game đang mở của các em được đánh cờ (lượt có câu của chiến dịch). */
  soLuotDangMo: number
  /** Bài tick gắn chiến dịch này đã được nhả (bài trở về "chưa dạy"). */
  nhaTick: boolean
}

/** Đọc tập em + tập câu của chiến dịch (JSON hỏng ⇒ rỗng). */
async function docTap(env: Env, id: string): Promise<{ sbd: string[]; qids: string[] } | null> {
  const r = await env.DB.prepare('SELECT sbd_json, qid_json FROM chien_dich WHERE id = ?').bind(id).first<Row>().catch(() => null)
  if (!r) return null
  const mang = (v: unknown): string[] => { try { const a = JSON.parse(str(v) || '[]') as unknown; return Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string' && !!x) : [] } catch { return [] } }
  return { sbd: mang(r.sbd_json), qids: mang(r.qid_json) }
}

/**
 * Đánh cờ `thuHoiLuc` (lúc huỷ SỚM NHẤT ảnh hưởng lượt) vào các lượt game ĐANG MỞ của các em chiến dịch có chứa câu của chiến dịch. Khoá câu của lượt = câu của KẾ HOẠCH:
 * `tc` (câu lỗi mà câu anh em làm thay) hoặc phần đứng trước `~` của qid (bản song sinh / biến thể). Lượt Đoàn (`doan`) bỏ qua. Lỗi ⇒ 0 (huỷ vẫn thành công).
 */
async function danhCoLuotDangMo(env: Env, tap: { sbd: string[]; qids: string[] }, nowMs: number): Promise<number> {
  if (!tap.sbd.length || !tap.qids.length) return 0
  try {
    const r = await env.DB.prepare(`UPDATE game_v2_session SET json = json_set(json, '$.thuHoiLuc', COALESCE(json_extract(json, '$.thuHoiLuc'), ?))
        WHERE sbd IN (SELECT value FROM json_each(?)) AND created_at >= ? AND json_valid(json) AND COALESCE(json_extract(json, '$.doan'), 0) = 0
          AND EXISTS (SELECT 1 FROM json_each(game_v2_session.json, '$.questions') j
                       WHERE COALESCE(json_extract(j.value, '$.tc'), substr(json_extract(j.value, '$.qid'), 1, instr(json_extract(j.value, '$.qid') || '~', '~') - 1)) IN (SELECT value FROM json_each(?)))`)
      .bind(new Date(nowMs).toISOString(), JSON.stringify(tap.sbd), new Date(nowMs - HAN_LUOT_MS).toISOString(), JSON.stringify(tap.qids)).run()
    return Number(r.meta?.changes ?? 0)
  } catch (e) {
    console.error('[thu-hoi-chien-dich] đánh cờ lượt đang mở lỗi (huỷ vẫn thành công):', e instanceof Error ? e.message : e)
    return 0
  }
}

/**
 * Nhả dấu tick của bài gắn chiến dịch vừa huỷ (đúng việc `bo-tick` làm với dòng `bai_da_day`: chỉ ghi `bo_tick_luc`). Idempotent: `bo-tick` gọi `huy` SAU khi đã ghi dấu ⇒ không còn dòng
 * nào để nhả. Bảng chưa có (chưa ai tick bài) / lỗi ⇒ false.
 */
async function nhaTickKhiHuy(env: Env, id: string, nowMs: number): Promise<boolean> {
  try {
    const r = await env.DB.prepare('UPDATE bai_da_day SET bo_tick_luc = ? WHERE chien_dich_id = ? AND bo_tick_luc IS NULL').bind(new Date(nowMs).toISOString(), id).run()
    if (!Number(r.meta?.changes ?? 0)) return false
    // Nạp lười: bai-da-day.ts import ngược srs2-gv (→ tệp này) ⇒ import tĩnh tạo vòng. Đệm phạm vi tính theo lớp, không rõ lớp ⇒ xoá hết (rẻ, 30 s).
    const { xoaDemPhamVi } = await import('./bai-da-day')
    xoaDemPhamVi()
    return true
  } catch {
    return false
  }
}

/**
 * Việc GHI của lúc huỷ chiến dịch (gọi SAU khi đã đổi `trang_thai` và xoá đệm danh sách chiến dịch). Không bao giờ ném lỗi — phần nào lỗi thì bỏ phần ấy, huỷ vẫn thành công
 * (phần đọc ở `docHoSo2` đủ để em không nhận lại câu của chiến dịch).
 */
export async function thuHoiKhiHuy(env: Env, id: string, nowMs: number): Promise<KetQuaThuHoi> {
  const tap = await docTap(env, id).catch(() => null)
  if (!tap) return { soEm: 0, soLuotDangMo: 0, nhaTick: false }
  const [soLuotDangMo, nhaTick] = await Promise.all([danhCoLuotDangMo(env, tap, nowMs), nhaTickKhiHuy(env, id, nowMs)])
  return { soEm: tap.sbd.length, soLuotDangMo, nhaTick }
}

/** Phần tử tối thiểu của câu trong JSON lượt game mà hàm dưới cần. */
interface RefLuot { qid: string; tc?: string }
/** Khoá câu của KẾ HOẠCH của một câu trong lượt: câu lỗi `tc` (câu anh em làm thay) hoặc qid gốc (bỏ hậu tố song sinh / biến thể). */
export const khoaKeHoachCuaRef = (r: RefLuot): string => (r.tc ? String(r.tc) : tachSongSinh(r.qid).goc)

/**
 * Các qid CỦA LƯỢT mà nay đã bị THU HỒI: lượt có cờ `thuHoiLuc` (đánh lúc huỷ) VÀ khoá kế hoạch của câu nằm trong một chiến dịch ĐÃ HUỶ (từ lúc có cờ) có em này.
 * Lượt không có cờ ⇒ rỗng, KHÔNG truy vấn. Lỗi đọc ⇒ rỗng (không bao giờ chặn nhầm câu).
 */
export async function qidThuHoiTrongLuot(env: Env, sbd: string, luot: { thuHoiLuc?: string; questions: readonly RefLuot[] }): Promise<Set<string>> {
  const ra = new Set<string>()
  const luc = str(luot.thuHoiLuc)
  if (!luc || !luot.questions.length) return ra
  const hoi = [...new Set(luot.questions.map(khoaKeHoachCuaRef))]
  try {
    const r = await env.DB.prepare(`SELECT DISTINCT q.value AS qid FROM chien_dich c, json_each(c.qid_json) q
        WHERE c.trang_thai = 'da_huy' AND COALESCE(c.dong_luc, '') >= ? AND json_valid(c.qid_json) AND json_valid(c.sbd_json)
          AND EXISTS (SELECT 1 FROM json_each(c.sbd_json) s WHERE s.value = ?) AND q.value IN (SELECT value FROM json_each(?))`)
      .bind(luc, sbd, JSON.stringify(hoi)).all<Row>()
    const thuHoi = new Set((r.results ?? []).map((x) => str(x.qid)))
    for (const ref of luot.questions) if (thuHoi.has(khoaKeHoachCuaRef(ref))) ra.add(ref.qid)
  } catch {
    return new Set<string>()
  }
  return ra
}
