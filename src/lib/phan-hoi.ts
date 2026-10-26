// MỘT chỗ phản hồi cho các màn luyện của app học sinh «Trong»: chạm/chọn · đúng · sai · hết chặng ⇒ rung (rung.ts) + tiếng (am-thanh.ts) cùng lúc, không
// lệch nhau. Mỗi phần tự kiểm công tắc của nó (menu: «Rung» 'ddh.rung', «Âm thanh» 'ddh.am'). KHÔNG dùng ở màn thi thật.
import { rung, type KieuPhanHoi } from './rung'
import { phat } from './am-thanh'
export type { KieuPhanHoi }
export function phanHoi(kieu: KieuPhanHoi): void { rung(kieu); phat(kieu) }
