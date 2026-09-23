// GIỮ CHỖ THEO LƯỢT — CNH-1.0 (P05 mục 4, 04 §4.1/§5). Bảng `giu_cho` (migration-2309-cnh1-giu-cho.sql).
//
// LUẬT CỨNG:
//   · Thắng chỗ = `INSERT OR IGNORE` với `meta.changes = 1`. `changes = 0` ⇒ câu ĐÃ có người giữ.
//   · Không đọc-rồi-ghi: hết hạn (`lease_until < now`) thì tiếp quản bằng MỘT câu UPDATE có điều kiện hạn
//     (CAS) — nếu `changes = 0` thì người khác vừa tiếp quản trước, lượt này THUA và phải chọn lại.
//   · Lượt thua KHÔNG được chiếm câu đã chốt của lượt khác; chỉ chọn lại phần chưa chốt (nơi gọi lấy
//     `thua` rồi gọi lại `giuCho` cho ứng viên KHÁC).
//   · Hạn giữ chỗ lấy từ THAM-SO `technical.reservationLeaseSeconds` (900 giây) — nơi gọi truyền vào.
import type { Env } from './kieu'

/** Hạn giữ chỗ mặc định (giây) — THAM-SO `technical.reservationLeaseSeconds`. */
export const HAN_GIU_CHO_GIAY = 900

export interface YeuCauGiuCho {
  sbd: string
  /** Ngày VN (YYYY-MM-DD) — giữ chỗ theo NGÀY, không dùng đồng hồ máy khách. */
  ngay: string
  taskId: string
  qids: readonly string[]
  nowMs: number
  /** Hạn giữ chỗ tính bằng giây (mặc định `HAN_GIU_CHO_GIAY`). */
  hanGiay?: number
  nguon?: string
}

export interface KetQuaGiuCho {
  /** Câu giành được trong lượt này (đúng thứ tự yêu cầu). */
  thang: string[]
  /** Câu đã bị lượt khác giữ (còn hạn) — nơi gọi phải CHỌN LẠI phần chưa chốt. */
  thua: string[]
  /** Task đang giữ từng câu thua (để giải thích, không lộ cho học sinh khác). */
  dangGiu: Map<string, string>
}

const mocIso = (ms: number): string => new Date(ms).toISOString()

/**
 * GIÀNH chỗ cho danh sách câu. Một câu lệnh cho mỗi qid để `meta.changes` là tín hiệu CAS thật.
 * Không dùng `INSERT OR IGNORE` rồi suy rằng cả lượt đã thành công (04 §5 cấm).
 */
export async function giuCho(env: Env, yc: YeuCauGiuCho): Promise<KetQuaGiuCho> {
  const thang: string[] = []
  const thua: string[] = []
  const dangGiu = new Map<string, string>()
  const han = Math.max(1, Math.floor(yc.hanGiay ?? HAN_GIU_CHO_GIAY))
  const den = yc.nowMs + han * 1000
  for (const qid of yc.qids) {
    const q = String(qid ?? '').trim()
    if (!q) continue
    let won = false
    try {
      const r = await env.DB.prepare(
        `INSERT OR IGNORE INTO giu_cho (sbd, ngay, qid, task_id, nguon, lease_until, cap_nhat_luc)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(yc.sbd, yc.ngay, q, yc.taskId, yc.nguon ?? '', den, mocIso(yc.nowMs)).run()
      won = Number((r as { meta?: { changes?: number } }).meta?.changes ?? 0) === 1
      if (!won) {
        // Chỗ đang bị giữ: chỉ tiếp quản khi ĐÃ HẾT HẠN — một câu UPDATE có điều kiện (CAS).
        const u = await env.DB.prepare(
          `UPDATE giu_cho SET task_id = ?, nguon = ?, lease_until = ?, cap_nhat_luc = ?
            WHERE sbd = ? AND ngay = ? AND qid = ? AND lease_until < ?`,
        ).bind(yc.taskId, yc.nguon ?? '', den, mocIso(yc.nowMs), yc.sbd, yc.ngay, q, yc.nowMs).run()
        won = Number((u as { meta?: { changes?: number } }).meta?.changes ?? 0) === 1
      }
    } catch {
      won = false // chưa áp migration ⇒ coi như KHÔNG giữ được (không tự cho là đã chốt)
    }
    if (won) thang.push(q)
    else {
      thua.push(q)
      const row = await docMotCho(env, yc.sbd, yc.ngay, q)
      if (row) dangGiu.set(q, row.taskId)
    }
  }
  return { thang, thua, dangGiu }
}

/** Một dòng giữ chỗ (null khi chưa có/hết hạn/lỗi đọc). */
export async function docMotCho(env: Env, sbd: string, ngay: string, qid: string): Promise<{ taskId: string; leaseUntil: number } | null> {
  try {
    const r = await env.DB.prepare('SELECT task_id, lease_until FROM giu_cho WHERE sbd = ? AND ngay = ? AND qid = ?')
      .bind(sbd, ngay, qid).first<{ task_id: string; lease_until: number }>()
    return r ? { taskId: String(r.task_id), leaseUntil: Number(r.lease_until) } : null
  } catch {
    return null
  }
}

/** Toàn bộ chỗ đang giữ trong ngày của một em (qid → {taskId, leaseUntil}). */
export async function docCho(env: Env, sbd: string, ngay: string): Promise<Map<string, { taskId: string; leaseUntil: number }>> {
  const ra = new Map<string, { taskId: string; leaseUntil: number }>()
  try {
    const r = await env.DB.prepare('SELECT qid, task_id, lease_until FROM giu_cho WHERE sbd = ? AND ngay = ?')
      .bind(sbd, ngay).all<{ qid: string; task_id: string; lease_until: number }>()
    for (const x of r.results ?? []) ra.set(String(x.qid), { taskId: String(x.task_id), leaseUntil: Number(x.lease_until) })
  } catch {
    /* chưa có bảng ⇒ rỗng */
  }
  return ra
}

/** NHẢ chỗ (kết thúc lượt/nộp xong/huỷ) — chỉ nhả phần do chính `taskId` giữ. */
export async function nhaCho(env: Env, sbd: string, ngay: string, taskId: string, qids?: readonly string[]): Promise<number> {
  try {
    const ds = qids && qids.length ? [...new Set(qids.map((q) => String(q).trim()).filter(Boolean))] : null
    const r = ds
      ? await env.DB.prepare('DELETE FROM giu_cho WHERE sbd = ? AND ngay = ? AND task_id = ? AND qid IN (SELECT value FROM json_each(?))')
        .bind(sbd, ngay, taskId, JSON.stringify(ds)).run()
      : await env.DB.prepare('DELETE FROM giu_cho WHERE sbd = ? AND ngay = ? AND task_id = ?').bind(sbd, ngay, taskId).run()
    return Number((r as { meta?: { changes?: number } }).meta?.changes ?? 0)
  } catch {
    return 0
  }
}
