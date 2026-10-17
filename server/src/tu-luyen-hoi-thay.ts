// Mã câu trong lượt dùng cho tiến độ có thể khác mã nội dung em đang nhìn (thang làm lại).
// Chỉ đọc lượt của chính em. Không tin mã câu thay do máy em tự khai, không đổi điểm/lượt cũ.
import type { Env } from './kieu'

export async function cauHoiThayTuLuyen(env: Env, sbd: string, luotId: string, qid: string): Promise<string | null> {
  if (!/^tl_[a-z0-9]{6,20}$/.test(luotId)) return null
  const dong = await env.DB.prepare('SELECT de_rieng_json FROM tu_luyen_luot WHERE id = ? AND sbd = ?').bind(luotId, sbd).first<{ de_rieng_json: string }>()
  if (!dong) return null
  try {
    const ds: unknown = JSON.parse(dong.de_rieng_json)
    if (!Array.isArray(ds)) return null
    const c = ds.find((v) => v && typeof v === 'object' && v.qid === qid) as { qid: string; hien?: unknown } | undefined
    return c ? (typeof c.hien === 'string' && c.hien ? c.hien : c.qid).replace(/~\d+$/, '') : null
  } catch { return null }
}
