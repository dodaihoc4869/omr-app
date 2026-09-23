// GIỮ CHỖ THEO LƯỢT — CNH-1.0 (P05 mục 4, 04 §2). Bảng `giu_cho` (migration-2309-cnh1-giu-cho.sql +
// migration-2309-cnh1-giu-cho_nhom.sql).
//
// LUẬT CỨNG:
//   · KHOÁ THEO ĐƠN VỊ NỘI DUNG (`content_group`), không theo qid: hai bản sao cùng nhóm là MỘT đơn vị ⇒ không
//     thể phát cho hai nhiệm vụ cùng lúc (RV01). Câu KHÔNG có nhóm trong kho ⇒ khoá `qid:<qid>` (mỗi câu một
//     đơn vị — KHÔNG bịa nhóm để lách; nơi gọi truyền `nhomTheoQid`).
//   · Thắng chỗ = `INSERT … ON CONFLICT DO NOTHING` có `meta.changes = 1`.
//   · TÁCH LIFECYCLE: `lease_until` = hạn THIẾT BỊ giữ; `het_han_task` = hạn NHIỆM VỤ. Hết lease mà nhiệm vụ
//     CÒN hiệu lực ⇒ KHÔNG sinh nhiệm vụ mới (RV02): trả `dangMo` để nơi gọi RESUME đúng task cũ.
//     Chỉ tiếp quản khi nhiệm vụ đã kết thúc — bằng MỘT câu UPDATE có điều kiện (CAS), không đọc-rồi-ghi.
//   · Lượt thua KHÔNG được chiếm câu đã chốt của lượt khác; `thua` + `dangMo` để nơi gọi chọn lại phần chưa chốt.
import type { Env } from './kieu'

/** Hạn giữ chỗ MẶC ĐỊNH của THIẾT BỊ (giây) — THAM-SO `technical.reservationLeaseSeconds`. */
export const HAN_GIU_CHO_GIAY = 900
/** Hạn MẶC ĐỊNH của NHIỆM VỤ (giây) — 04 §8: còn nộp được trong 24 giờ từ lúc phát. */
export const HAN_TASK_GIAY = 24 * 3600

export interface YeuCauGiuCho {
  sbd: string
  /** Ngày VN (YYYY-MM-DD) — giữ chỗ theo NGÀY, không dùng đồng hồ máy khách. */
  ngay: string
  taskId: string
  qids: readonly string[]
  nowMs: number
  /** Hạn giữ chỗ của THIẾT BỊ tính bằng giây (mặc định `HAN_GIU_CHO_GIAY`). */
  hanGiay?: number
  /** Hạn của NHIỆM VỤ tính bằng giây (mặc định `HAN_TASK_GIAY`); hết hạn này mới được tiếp quản. */
  hanTaskGiay?: number
  /** `content_group` của từng qid; thiếu/không có nhãn ⇒ `qid:<qid>` (mỗi câu một đơn vị). */
  nhomTheoQid?: ReadonlyMap<string, string>
  nguon?: string
}

export interface KetQuaGiuCho {
  /** Câu giành được trong lượt này (đúng thứ tự yêu cầu). */
  thang: string[]
  /** Câu đã bị lượt khác giữ (còn hiệu lực) — nơi gọi phải CHỌN LẠI phần chưa chốt. */
  thua: string[]
  /** Task đang giữ từng câu thua (để giải thích, không lộ cho học sinh khác). */
  dangGiu: Map<string, string>
  /**
   * `qid` → `taskId` của nhiệm vụ CÒN HIỆU LỰC dù lease thiết bị đã hết (RV02): nơi gọi phải RESUME task này,
   * KHÔNG tạo attempt mới, KHÔNG phát bản khác.
   */
  dangMo: Map<string, string>
}

const mocIso = (ms: number): string => new Date(ms).toISOString()
const changes = (r: unknown): number => Number((r as { meta?: { changes?: number } }).meta?.changes ?? 0)
/** Khoá đơn vị nội dung của một câu: nhóm thật nếu có, không thì `qid:<qid>` (không bịa nhóm). */
const khoaNhom = (qid: string, nhomTheoQid?: ReadonlyMap<string, string>): string => {
  const g = String(nhomTheoQid?.get(qid) ?? '').trim()
  return g || `qid:${qid}`
}

interface HangCho { taskId: string; leaseUntil: number; hetHanTask: number; qid: string; taskConHieuLuc: (nowMs: number) => boolean }

const hangCho = (x: { task_id: unknown; lease_until: unknown; het_han_task?: unknown; qid?: unknown }): HangCho => {
  const hetHanTask = Number(x.het_han_task ?? 0) || 0
  const leaseUntil = Number(x.lease_until ?? 0) || 0
  return {
    taskId: String(x.task_id), leaseUntil, hetHanTask, qid: String(x.qid ?? ''),
    // Dòng cũ (`het_han_task = 0`) chưa biết hạn nhiệm vụ ⇒ theo lease (không chặn oan, không tạo task mới khi lease còn).
    taskConHieuLuc: (nowMs: number) => (hetHanTask > 0 ? hetHanTask > nowMs : leaseUntil >= nowMs),
  }
}

/** Một dòng giữ chỗ theo ĐƠN VỊ NỘI DUNG. */
export async function docTheoNhom(env: Env, sbd: string, ngay: string, nhom: string): Promise<HangCho | null> {
  try {
    const r = await env.DB.prepare(
      'SELECT qid, task_id, lease_until, het_han_task FROM giu_cho WHERE sbd = ? AND ngay = ? AND content_group = ?',
    ).bind(sbd, ngay, nhom).first<{ qid: string; task_id: string; lease_until: number; het_han_task: number }>()
    return r ? hangCho(r) : null
  } catch {
    return null
  }
}

/**
 * GIÀNH chỗ cho danh sách câu. Một câu lệnh cho mỗi qid để `meta.changes` là tín hiệu CAS thật.
 * Không dùng `INSERT OR IGNORE` rồi suy rằng cả lượt đã thành công (04 §5 cấm).
 */
export async function giuCho(env: Env, yc: YeuCauGiuCho): Promise<KetQuaGiuCho> {
  const thang: string[] = []
  const thua: string[] = []
  const dangGiu = new Map<string, string>()
  const dangMo = new Map<string, string>()
  const han = Math.max(1, Math.floor(yc.hanGiay ?? HAN_GIU_CHO_GIAY))
  const hanTask = Math.max(han, Math.floor(yc.hanTaskGiay ?? HAN_TASK_GIAY))
  const den = yc.nowMs + han * 1000
  const denTask = yc.nowMs + hanTask * 1000
  for (const qid of yc.qids) {
    const q = String(qid ?? '').trim()
    if (!q) continue
    const nhom = khoaNhom(q, yc.nhomTheoQid)
    let won = false
    try {
      // `ON CONFLICT DO NOTHING` phủ CẢ khoá chính (sbd,ngay,qid) LẪN khoá đơn vị nội dung (sbd,ngay,content_group).
      const r = await env.DB.prepare(
        `INSERT INTO giu_cho (sbd, ngay, qid, task_id, nguon, lease_until, cap_nhat_luc, content_group, het_han_task)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING`,
      ).bind(yc.sbd, yc.ngay, q, yc.taskId, yc.nguon ?? '', den, mocIso(yc.nowMs), nhom, denTask).run()
      won = changes(r) === 1
      if (!won) {
        const cur = await docTheoNhom(env, yc.sbd, yc.ngay, nhom)
        if (cur && cur.taskId === yc.taskId) {
          // Chính nhiệm vụ này đang giữ (gọi lại/khôi phục) ⇒ gia hạn, coi như thắng (không sinh task mới).
          await env.DB.prepare('UPDATE giu_cho SET lease_until = ?, het_han_task = ?, cap_nhat_luc = ? WHERE sbd = ? AND ngay = ? AND content_group = ?')
            .bind(den, denTask, mocIso(yc.nowMs), yc.sbd, yc.ngay, nhom).run()
          won = true
        } else if (cur && cur.taskConHieuLuc(yc.nowMs)) {
          // RV02: nhiệm vụ CÒN hiệu lực ⇒ KHÔNG sinh task mới; trả lại để nơi gọi RESUME.
          dangMo.set(q, cur.taskId)
        } else if (cur) {
          // Nhiệm vụ đã kết thúc ⇒ tiếp quản bằng MỘT câu UPDATE có điều kiện (CAS).
          const u = await env.DB.prepare(
            `UPDATE giu_cho SET qid = ?, task_id = ?, nguon = ?, lease_until = ?, het_han_task = ?, cap_nhat_luc = ?
              WHERE sbd = ? AND ngay = ? AND content_group = ? AND het_han_task <= ? AND lease_until < ?`,
          ).bind(q, yc.taskId, yc.nguon ?? '', den, denTask, mocIso(yc.nowMs), yc.sbd, yc.ngay, nhom, yc.nowMs, yc.nowMs).run()
          won = changes(u) === 1
        }
      }
    } catch {
      won = false // chưa áp migration ⇒ coi như KHÔNG giữ được (không tự cho là đã chốt)
    }
    if (won) thang.push(q)
    else {
      thua.push(q)
      const cur = await docTheoNhom(env, yc.sbd, yc.ngay, nhom)
      if (cur) {
        dangGiu.set(q, cur.taskId)
        if (cur.taskConHieuLuc(yc.nowMs)) dangMo.set(q, cur.taskId)
      }
    }
  }
  return { thang, thua, dangGiu, dangMo }
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

/** Toàn bộ chỗ đang giữ trong ngày của một em (qid → {taskId, leaseUntil, nhóm, hạn nhiệm vụ}). */
export async function docCho(
  env: Env, sbd: string, ngay: string,
): Promise<Map<string, { taskId: string; leaseUntil: number; nhom: string; hetHanTask: number }>> {
  const ra = new Map<string, { taskId: string; leaseUntil: number; nhom: string; hetHanTask: number }>()
  try {
    const r = await env.DB.prepare('SELECT qid, task_id, lease_until, content_group, het_han_task FROM giu_cho WHERE sbd = ? AND ngay = ?')
      .bind(sbd, ngay).all<{ qid: string; task_id: string; lease_until: number; content_group: string; het_han_task: number }>()
    for (const x of r.results ?? []) {
      ra.set(String(x.qid), {
        taskId: String(x.task_id), leaseUntil: Number(x.lease_until),
        nhom: String(x.content_group ?? ''), hetHanTask: Number(x.het_han_task ?? 0) || 0,
      })
    }
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
