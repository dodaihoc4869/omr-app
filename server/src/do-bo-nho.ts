// ĐO BỘ NHỚ / ĐỒNG THỜI CỦA ISOLATE (29/10 22:00 — thầy «bắt buộc phải làm được 100%»; Analytics 19–23h: `exceededMemory` 1 070 lượt, mỗi lần giết isolate 128 MB kéo theo mọi lượt đang chạy).
// Workers không cho đọc heap ⇒ ghi cái đo được: số lượt ĐANG chạy cùng lúc (đỉnh trong phút), số lượt / phút, kích thước từng đệm (dem-chung.ts `thongKeDem`), hàng lập kế hoạch.
// Mỗi isolate tối đa MỘT dòng `[bo-nho]` / phút (rẻ: chỉ đếm). `wrangler tail` gom lại theo phút để thấy isolate nào đầy đệm / chạy chồng nhiều lượt trước khi bị giết.
import { thongKeDem } from './dem-chung'

let dang = 0, dinh = 0, soYc = 0, lanCuoi = 0
const batDauIsolate = Date.now()
/** Gọi lúc bắt đầu một yêu cầu; trả hàm gọi lúc xong (gọi nhiều lần vẫn chỉ trừ một lần). */
export function batDauYeuCau(): () => void {
  dang++; soYc++
  if (dang > dinh) dinh = dang
  let xong = false
  return () => { if (!xong) { xong = true; dang-- } }
}
/** Mỗi isolate tối đa một dòng / phút. Không bao giờ ném. */
export function ghiBoNhoDinhKy(now: number = Date.now()): void {
  if (now - lanCuoi < 60_000) return
  lanCuoi = now
  try {
    const mu = (globalThis as { process?: { memoryUsage?: () => { heapUsed?: number } } }).process?.memoryUsage?.()
    const tk = thongKeDem(8)
    console.log('[bo-nho] ' + JSON.stringify({ tuoiPhut: Math.round((now - batDauIsolate) / 60000), dang, dinh, soYc, heapMb: mu?.heapUsed ? Math.round(mu.heapUsed / 1048576) : null, dem: tk.dem, khac: tk.khac }))
  } catch { /* chỉ là số đo */ }
  dinh = dang; soYc = 0
}
