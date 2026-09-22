// VIỆC PHỤ không nằm trong hợp đồng phản hồi (Boss 22/09, tốc độ tối đa: `/btvn/xong-lo`, `/hs/on-lai/nop`…).
// Tách riêng tệp (không đặt trong index.ts) để các lệnh ở tệp khác (on-lai-nop.ts, btvn-nang-do-d1.ts…) dùng được
// mà không vướng import vòng — index.ts vốn đã import ngược từ các tệp đó.
import type { ExecutionContext } from './kieu'

/**
 * Có `ctx` (Worker thật, hoặc test cố ý truyền vào) thì hoãn `viec()` qua `ctx.waitUntil` — trả lời nhanh hơn, việc
 * phụ vẫn CHẮC CHẮN chạy xong trước khi Worker dừng. KHÔNG có `ctx` (đường gọi cũ, `worker.fetch(req, env)` không có
 * tham số ba) thì CHẠY NGAY tại chỗ — hành vi y hệt trước khi có `ctx`, không mất tác dụng, chỉ mất phần "nhanh hơn".
 * Không bao giờ ném lỗi ra ngoài.
 */
export async function viecPhu(ctx: ExecutionContext | undefined, viec: () => Promise<unknown>): Promise<void> {
  const p = viec().then(() => undefined).catch((e) => { console.error('[viec-phu] lỗi (không chặn phản hồi):', e instanceof Error ? e.message : e) })
  if (ctx) ctx.waitUntil(p)
  else await p
}
