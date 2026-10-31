// ĐỆM β CÂU (31/10, thử tải 500 lớp × 100 em, mốc 2000 em: `SELECT qid,beta FROM omni_beta_cau WHERE qid IN (json_each)` đứng ĐẦU thời gian D1 — 4.506 lần /
// 6 phút, 4,3 ms / lần vì mỗi lần dò β của CẢ tập câu ứng viên của em, hơn nghìn câu). β (thời gian chuẩn của câu) chung cho mọi em, chỉ cron OMNI tính lại ⇒ nhớ theo
// qid trong isolate 10 phút (kể cả câu CHƯA có β); chỉ câu chưa nhớ mới đọc D1. Tra đệm ĐỒNG BỘ (không thêm nhịp chờ nào trước câu đọc — giữ nguyên đợt D1 như cũ).
// Bộ test mặc định TẮT đệm ⇒ đọc thẳng y như mã cũ; test của đệm bật bằng `batDemBeta(true)`.
import type { Env } from './kieu'
import { dbGoc } from './cau-hinh-dem'

export const SQL_BETA_CAU = 'SELECT qid,beta FROM omni_beta_cau WHERE qid IN (SELECT value FROM json_each(?))'
const HAN_BETA_MS = 10 * 60_000
const TRAN_BETA = 60_000
let demBat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
export function batDemBeta(b: boolean): void { demBat = b; dem = null }
let dem: { luc: number; db: object; m: Map<string, number | null> } | null = null

/** Đệm β hiện hành (qid → β, `null` = câu chưa có β); đệm tắt ⇒ null (nơi gọi đọc thẳng như cũ). */
export function layBetaNho(env: Env): Map<string, number | null> | null {
  if (!demBat) return null
  const goc = dbGoc(env.DB as unknown as object), now = Date.now()
  if (!dem || dem.db !== goc || now - dem.luc < 0 || now - dem.luc >= HAN_BETA_MS) dem = { luc: now, db: goc, m: new Map() }
  return dem.m
}
/** Ghi kết quả đọc β của các câu `thieu` (dòng `co`) vào đệm, kể cả câu không có dòng. */
export function ghiBetaNho(nho: Map<string, number | null>, thieu: readonly string[], co: ReadonlyMap<string, number>): void {
  if (nho.size + thieu.length > TRAN_BETA) nho.clear()
  for (const q of thieu) nho.set(q, co.has(q) ? co.get(q)! : null)
}

/** β của các câu `qids` (dòng có β). Đệm tắt ⇒ ĐÚNG câu đọc cũ (`sql`, cùng nhịp — không bọc async), kết quả D1 nguyên. Lỗi đọc D1 ⇒ ném như câu đọc cũ. */
export function docBetaDong(env: Env, qids: Iterable<string>, thamSo?: string, sql = SQL_BETA_CAU): Promise<{ results: { qid: string; beta: number }[] }> {
  const nho = layBetaNho(env)
  if (!nho) return env.DB.prepare(sql).bind(thamSo ?? JSON.stringify([...new Set(qids)])).all<{ qid: string; beta: number }>()
  return docQuaDem(env, nho, qids)
}
async function docQuaDem(env: Env, nho: Map<string, number | null>, qids: Iterable<string>): Promise<{ results: { qid: string; beta: number }[] }> {
  const ds = [...new Set([...qids].filter(Boolean))]
  const thieu = ds.filter((q) => !nho.has(q))
  if (thieu.length) {
    const r = await env.DB.prepare(SQL_BETA_CAU).bind(JSON.stringify(thieu)).all<{ qid: string; beta: number }>()
    const co = new Map<string, number>()
    for (const x of r.results ?? []) if (x.beta != null && Number.isFinite(Number(x.beta))) co.set(String(x.qid), Number(x.beta))
    ghiBetaNho(nho, thieu, co)
  }
  return { results: ds.flatMap((q) => { const b = nho.get(q); return b == null ? [] : [{ qid: q, beta: b }] }) }
}
