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

/**
 * CHỈ MỤC CHỈ-THÊM dựng trong cron NGÀY 17:01 UTC (00:01 VN, ngoài cao điểm) — thay cho chạy migration tay (Boss 29/09: CI không chạy migration,
 * không có quyền D1 remote). `IF NOT EXISTS` ⇒ lần đầu dựng, các đêm sau là lệnh rỗng. Bản sao của server/migration-2909-chi-muc-cao-diem.sql.
 * KHÔNG gọi trên đường lệnh của em (dựng chỉ mục bảng luot giữ khoá ghi).
 */
export const CHI_MUC_CRON_DEM: readonly string[] = [
  'CREATE INDEX IF NOT EXISTS idx_luot_ca_tt ON luot(ma_ca, trang_thai, het_gio_luc)',
  // Quét tối ưu 30/09 (bản sao server/migration-3009-chi-muc-quet-cuoi.sql; EXPLAIN trước = "SCAN <bảng>"):
  //  · EXP hôm nay (`docExpHomNay`, mỗi lần em mở app qua /hs/ke-hoach-ngay) lọc game_v2_reward theo sbd + ngày — bảng ≈ một dòng mỗi câu game.
  'CREATE INDEX IF NOT EXISTS idx_game_v2_reward_sbd ON game_v2_reward(sbd, created_at)',
  //  · Sảnh Bi-a hỏi 6 s/lần: lời mời em ĐÃ GỬI (tu_sbd) — chỉ mục cũ chỉ theo người nhận.
  'CREATE INDEX IF NOT EXISTS bi_a_moi_tu ON bi_a_moi(tu_sbd, tao_luc)',
  //  · Vào bàn bằng mã / cấp mã bàn mới: bàn đang chờ trong hạn vé.
  'CREATE INDEX IF NOT EXISTS bi_a_van_cho ON bi_a_van(trang_thai, tao_luc)',
]
/** Chạy từng câu riêng (một câu lỗi không chặn câu khác). Trả số câu lỗi; nơi gọi ghi nhật ký máy. */
export async function dungChiMucCronDem(env: Env): Promise<number> {
  let loi = 0
  for (const s of CHI_MUC_CRON_DEM) {
    try { await env.DB.prepare(s).run() } catch (e) { loi++; console.error('[chi-muc] cron đêm không dựng được:', s, e instanceof Error ? e.message : e) }
  }
  return loi
}
