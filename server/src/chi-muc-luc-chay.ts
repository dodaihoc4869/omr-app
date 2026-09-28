// CHỈ MỤC TẠO LÚC CHẠY (tối ưu máy chủ 28/09, việc 3) — bản sao của server/migration-2809-chi-muc.sql.
// Chạy MỘT lần mỗi isolate (cờ trong bộ nhớ theo đối tượng D1), qua `ctx.waitUntil` ⇒ không làm chậm phản hồi.
// Lỗi (bảng chưa có ở D1 mới…) chỉ ghi log; KHÔNG thử lại trong cùng isolate (tránh dội D1 mỗi lượt).
// Chỉ thêm chỉ mục cho bảng NHỎ (≤ vài chục nghìn dòng). Bảng lớn (> vài trăm nghìn dòng) chỉ đưa vào migration để Boss chạy tay.
import type { Env } from './kieu'

export const CHI_MUC_LUC_CHAY: readonly string[] = [
  'CREATE INDEX IF NOT EXISTS game_v2_attempt_session ON game_v2_attempt(session, sbd)',
]

const daChay = new WeakMap<object, Promise<void>>()

export function damBaoChiMuc(env: Env): Promise<void> {
  const db = env.DB as unknown as object | undefined
  if (!db) return Promise.resolve()
  let p = daChay.get(db)
  if (!p) {
    p = env.DB.batch(CHI_MUC_LUC_CHAY.map((s) => env.DB.prepare(s)))
      .then(() => undefined, (e: unknown) => { console.error('[chi-muc] không tạo được (bỏ qua):', e instanceof Error ? e.message : e) })
    daChay.set(db, p)
  }
  return p
}
