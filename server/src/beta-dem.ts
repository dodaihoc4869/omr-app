// ĐỆM β CÂU (31/10, thử tải 500 lớp × 100 em, mốc 2000 em: `SELECT qid,beta FROM omni_beta_cau WHERE qid IN (json_each)` đứng ĐẦU thời gian D1 — 4.506 lần /
// 6 phút, 4,3 ms / lần vì mỗi lần dò β của CẢ tập câu ứng viên của em, hơn nghìn câu). β (thời gian chuẩn của câu) chung cho mọi em, chỉ cron OMNI tính lại ⇒ nhớ theo
// qid trong isolate 10 phút (kể cả câu CHƯA có β); chỉ câu chưa nhớ mới đọc D1. Tra đệm ĐỒNG BỘ (không thêm nhịp chờ nào trước câu đọc — giữ nguyên đợt D1 như cũ).
// Bộ test mặc định TẮT đệm ⇒ đọc thẳng y như mã cũ; test của đệm bật bằng `batDemBeta(true)`.
// 12/11 (H2, hoá đơn D1: câu trên vẫn 29.039 lượt/ngày × 797 hàng — đệm isolate trượt vì nhiều isolate ngắn hạn): isolate thiếu β ⇒ nạp CẢ BẢNG β qua bản tính
// sẵn DÙNG CHUNG (bang-tinh-chung.ts, dấu omni_beta_cau do trigger giữ — đổi ⇔ có ghi) — trúng: một câu ~3 hàng, cùng số đợt D1 như câu cũ; đệm thành «đủ»:
// mọi qid đều biết (vắng ⇒ không có β, đúng như câu cũ không trả dòng). Không dùng được bản tính sẵn (D1 chưa chạy migration) ⇒ đọc theo qid như cũ.
import type { Env } from './kieu'
import { dbGoc } from './cau-hinh-dem'
import { docChungNeuCo } from './bang-tinh-chung'

export const SQL_BETA_CAU = 'SELECT qid,beta FROM omni_beta_cau WHERE qid IN (SELECT value FROM json_each(?))'
export const SQL_BETA_TAT_CA = 'SELECT qid, beta FROM omni_beta_cau'
const HAN_BETA_MS = 10 * 60_000
const TRAN_BETA = 60_000
let demBat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
/** Mốc (ms) tới lúc thử lại bản tính sẵn sau khi nó không dùng được — tránh mỗi lượt tốn thêm một câu dò. */
let khongCoAnh = 0
export function batDemBeta(b: boolean): void { demBat = b; dem = null; khongCoAnh = 0 }
/** Đệm β: `du` ⇒ đã nạp CẢ BẢNG — mọi qid đều "đã biết" (`has` true; vắng ⇒ `get` null = không có β). */
export class BetaNho extends Map<string, number | null> {
  du = false
  override has(k: string): boolean { return this.du || super.has(k) }
  override get(k: string): number | null | undefined { const v = super.get(k); return v === undefined && this.du ? null : v }
  override clear(): void { this.du = false; super.clear() }
}
let dem: { luc: number; db: object; m: BetaNho } | null = null

/** Đệm β hiện hành (qid → β, `null` = câu chưa có β); đệm tắt ⇒ null (nơi gọi đọc thẳng như cũ). */
export function layBetaNho(env: Env): BetaNho | null {
  if (!demBat) return null
  const goc = dbGoc(env.DB as unknown as object), now = Date.now()
  if (!dem || dem.db !== goc || now - dem.luc < 0 || now - dem.luc >= HAN_BETA_MS) dem = { luc: now, db: goc, m: new BetaNho() }
  return dem.m
}
/** Ghi kết quả đọc β của các câu `thieu` (dòng `co`) vào đệm, kể cả câu không có dòng. */
export function ghiBetaNho(nho: Map<string, number | null>, thieu: readonly string[], co: ReadonlyMap<string, number>): void {
  if (nho.size + thieu.length > TRAN_BETA) nho.clear()
  for (const q of thieu) nho.set(q, co.has(q) ? co.get(q)! : null)
}
/** Bản tính sẵn có thể dùng (chưa bị đánh dấu "không có" gần đây) — đồng bộ, để nơi gọi quyết có chạy song song `napBetaDu` hay không. */
export const coTheNapBetaDu = (): boolean => Date.now() >= khongCoAnh
/** Nạp CẢ BẢNG β vào đệm qua bản tính sẵn dùng chung ⇒ đệm «đủ». Không dùng được / bảng quá lớn ⇒ false (đệm giữ nguyên). Không ném. */
export async function napBetaDu(env: Env, nho: BetaNho): Promise<boolean> {
  if (nho.du) return true
  if (!coTheNapBetaDu()) return false
  const r = await docChungNeuCo<{ qid: unknown; beta: unknown }>(env, 'beta', SQL_BETA_TAT_CA, '', ['omni_beta_cau'], () => env.DB.prepare(SQL_BETA_TAT_CA)).catch(() => null)
  if (!r || r.results.length > TRAN_BETA) { khongCoAnh = Date.now() + HAN_BETA_MS; return false }
  if (nho.du) return true
  boMucCu(nho)
  for (const x of r.results) if (x.beta != null && Number.isFinite(Number(x.beta))) nho.set(String(x.qid), Number(x.beta))
  nho.du = true
  return true
}
/** Xoá mục cũ (không đụng cờ `du`): dữ liệu cả bảng vừa nạp thay toàn bộ. */
function boMucCu(nho: BetaNho): void { Map.prototype.clear.call(nho) }

/** β của các câu `qids` (dòng có β). Đệm tắt ⇒ ĐÚNG câu đọc cũ (`sql`, cùng nhịp — không bọc async), kết quả D1 nguyên. Lỗi đọc D1 ⇒ ném như câu đọc cũ. */
export function docBetaDong(env: Env, qids: Iterable<string>, thamSo?: string, sql = SQL_BETA_CAU): Promise<{ results: { qid: string; beta: number }[] }> {
  const nho = layBetaNho(env)
  if (!nho) return env.DB.prepare(sql).bind(thamSo ?? JSON.stringify([...new Set(qids)])).all<{ qid: string; beta: number }>()
  return docQuaDem(env, nho, qids)
}
async function docQuaDem(env: Env, nho: BetaNho, qids: Iterable<string>): Promise<{ results: { qid: string; beta: number }[] }> {
  const ds = [...new Set([...qids].filter(Boolean))]
  const thieu = ds.filter((q) => !nho.has(q))
  if (thieu.length && !(await napBetaDu(env, nho))) {
    const r = await env.DB.prepare(SQL_BETA_CAU).bind(JSON.stringify(thieu)).all<{ qid: string; beta: number }>()
    const co = new Map<string, number>()
    for (const x of r.results ?? []) if (x.beta != null && Number.isFinite(Number(x.beta))) co.set(String(x.qid), Number(x.beta))
    ghiBetaNho(nho, thieu, co)
  }
  return { results: ds.flatMap((q) => { const b = nho.get(q); return b == null ? [] : [{ qid: q, beta: b }] }) }
}
