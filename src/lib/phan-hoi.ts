// MỘT chỗ phản hồi cho các màn luyện của app học sinh «Trong»: chạm/chọn · đúng · sai · hết chặng ⇒ rung (rung.ts). Gọi chung để rung và các phản hồi khác
// (tiếng) không lệch nhau. KHÔNG dùng ở màn thi thật.
import { rung, type KieuPhanHoi } from './rung'
export type { KieuPhanHoi }
export function phanHoi(kieu: KieuPhanHoi): void { rung(kieu) }
