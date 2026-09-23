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
  /** Ngày VN (YYYY-MM-DD) của lượt gọi — ghi vào `ngay` như NGÀY HOẠT ĐỘNG GẦN NHẤT; KHÔNG nằm trong khoá. */
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
  /** `revision` mà nơi gọi biết (tuỳ chọn): CAS gia hạn/tiếp quản chỉ thắng khi đúng revision ⇒ không đè thay đổi mới. */
  revision?: number
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

/** Một dòng giữ chỗ theo ĐƠN VỊ NỘI DUNG (khoá `sbd + content_group`, không phụ thuộc ngày). */
export async function docTheoNhom(env: Env, sbd: string, nhom: string): Promise<HangCho | null> {
  try {
    const r = await env.DB.prepare(
      'SELECT qid, task_id, lease_until, het_han_task, revision FROM giu_cho WHERE sbd = ? AND content_group = ?',
    ).bind(sbd, nhom).first<{ qid: string; task_id: string; lease_until: number; het_han_task: number; revision: number }>()
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
  const moc = mocIso(yc.nowMs)
  const coRevision = Number.isFinite(yc.revision)
  for (const qid of yc.qids) {
    const q = String(qid ?? '').trim()
    if (!q) continue
    const nhom = khoaNhom(q, yc.nhomTheoQid)
    let won = false
    try {
      // (1) GIÀNH ĐƠN VỊ: PK là (sbd, content_group) nên một đơn vị chỉ có MỘT dòng, xuyên ngày (RV01-followup).
      //     `ngay` là ngày hoạt động gần nhất, KHÔNG nằm trong khoá.
      const r = await env.DB.prepare(
        `INSERT INTO giu_cho (sbd, content_group, qid, task_id, nguon, ngay, lease_until, het_han_task, revision, cap_nhat_luc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT DO NOTHING`,
      ).bind(yc.sbd, nhom, q, yc.taskId, yc.nguon ?? '', yc.ngay, den, denTask, moc).run()
      won = changes(r) === 1
      if (!won) {
        // (2) GIA HẠN cho CHÍNH CHỦ: MỘT câu UPDATE có đủ điều kiện chủ + revision + nhiệm vụ CÒN hiệu lực.
        //     RV02-followup: không đọc-rồi-ghi; `changes = 0` nghĩa là chủ đã đổi / nhiệm vụ hết hạn ⇒ KHÔNG thắng.
        //     KHÔNG đụng `het_han_task` ⇒ hạn nộp đã chốt từ lúc phát KHÔNG bị kéo dài.
        const u = await env.DB.prepare(
          `UPDATE giu_cho SET lease_until = ?, ngay = ?, cap_nhat_luc = ?
            WHERE sbd = ? AND content_group = ? AND task_id = ? AND het_han_task > ?
              ${coRevision ? 'AND revision = ?' : ''}`,
        ).bind(den, yc.ngay, moc, yc.sbd, nhom, yc.taskId, yc.nowMs, ...(coRevision ? [Math.floor(yc.revision as number)] : [])).run()
        won = changes(u) === 1
      }
      if (!won) {
        // (3) TIẾP QUẢN khi NHIỆM VỤ trước ĐÃ KẾT THÚC — và KHÔNG được là CHÍNH task đang hỏi (task hết hạn
        //     không được hồi sinh/kéo dài; muốn tiếp thì máy chủ phải phát nhiệm vụ MỚI với id mới).
        const t = await env.DB.prepare(
          `UPDATE giu_cho SET qid = ?, task_id = ?, nguon = ?, ngay = ?, lease_until = ?, het_han_task = ?,
                  revision = revision + 1, cap_nhat_luc = ?
            WHERE sbd = ? AND content_group = ? AND task_id <> ?
              AND ((het_han_task > 0 AND het_han_task <= ?) OR (het_han_task = 0 AND lease_until < ?))
              ${coRevision ? 'AND revision = ?' : ''}`,
        ).bind(q, yc.taskId, yc.nguon ?? '', yc.ngay, den, denTask, moc, yc.sbd, nhom, yc.taskId, yc.nowMs, yc.nowMs,
          ...(coRevision ? [Math.floor(yc.revision as number)] : [])).run()
        won = changes(t) === 1
      }
    } catch {
      won = false // chưa áp migration ⇒ coi như KHÔNG giữ được (không tự cho là đã chốt)
    }
    if (won) thang.push(q)
    else {
      thua.push(q)
      const cur = await docTheoNhom(env, yc.sbd, nhom)
      if (cur) {
        dangGiu.set(q, cur.taskId)
        if (cur.taskConHieuLuc(yc.nowMs)) dangMo.set(q, cur.taskId)
      }
    }
  }
  return { thang, thua, dangGiu, dangMo }
}

/** Một dòng giữ chỗ theo qid (null khi chưa có/lỗi đọc). */
export async function docMotCho(env: Env, sbd: string, qid: string): Promise<{ taskId: string; leaseUntil: number } | null> {
  try {
    const r = await env.DB.prepare('SELECT task_id, lease_until FROM giu_cho WHERE sbd = ? AND qid = ?')
      .bind(sbd, qid).first<{ task_id: string; lease_until: number }>()
    return r ? { taskId: String(r.task_id), leaseUntil: Number(r.lease_until) } : null
  } catch {
    return null
  }
}

/** Toàn bộ đơn vị CÒN HIỆU LỰC của một em (bất kể ngày) — qid → thông tin dòng. */
export async function docCho(
  env: Env, sbd: string, nowMs: number,
): Promise<Map<string, { taskId: string; leaseUntil: number; nhom: string; hetHanTask: number; revision: number }>> {
  const ra = new Map<string, { taskId: string; leaseUntil: number; nhom: string; hetHanTask: number; revision: number }>()
  try {
    const r = await env.DB.prepare(
      `SELECT qid, task_id, lease_until, content_group, het_han_task, revision FROM giu_cho
        WHERE sbd = ? AND ((het_han_task > 0 AND het_han_task > ?) OR (het_han_task = 0 AND lease_until >= ?))`,
    ).bind(sbd, nowMs, nowMs).all<{ qid: string; task_id: string; lease_until: number; content_group: string; het_han_task: number; revision: number }>()
    for (const x of r.results ?? []) {
      ra.set(String(x.qid), {
        taskId: String(x.task_id), leaseUntil: Number(x.lease_until),
        nhom: String(x.content_group ?? ''), hetHanTask: Number(x.het_han_task ?? 0) || 0, revision: Number(x.revision ?? 1) || 1,
      })
    }
  } catch {
    /* chưa có bảng ⇒ rỗng */
  }
  return ra
}

/** NHẢ chỗ (kết thúc lượt/nộp xong/huỷ) — chỉ nhả phần do chính `taskId` giữ, KHÔNG phụ thuộc ngày. */
export async function nhaCho(env: Env, sbd: string, taskId: string, qids?: readonly string[]): Promise<number> {
  try {
    const ds = qids && qids.length ? [...new Set(qids.map((q) => String(q).trim()).filter(Boolean))] : null
    const r = ds
      ? await env.DB.prepare('DELETE FROM giu_cho WHERE sbd = ? AND task_id = ? AND qid IN (SELECT value FROM json_each(?))')
        .bind(sbd, taskId, JSON.stringify(ds)).run()
      : await env.DB.prepare('DELETE FROM giu_cho WHERE sbd = ? AND task_id = ?').bind(sbd, taskId).run()
    return Number((r as { meta?: { changes?: number } }).meta?.changes ?? 0)
  } catch {
    return 0
  }
}
