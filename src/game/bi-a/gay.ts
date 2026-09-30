// BI-A · HÌNH HỌC GẬY (hàm THUẦN, toạ độ bàn 500 × 900, không DOM). Từ 30/09 (thầy duyệt "Bàn Bi-a mới"): kéo ở BẤT KỲ đâu trên bàn
// là xoay gậy theo góc quét của ngón (dieu-khien-cham.ts) — bỏ phân nhánh "cầm trúng gậy / chỉnh tinh" của bản 29/09.
// Hình gậy khớp `ve-ban.ts`: gậy nằm phía NGƯỢC hướng bắn, đầu gậy cách tâm bi cái R + 6 + lực × 80, dài 400.
import { R } from './vat-ly'

export interface Diem { x: number; y: number }
export const DAI_GAY = 400
/** Khoảng đầu gậy tới tâm bi cái (đúng như lúc vẽ): gậy lùi theo lực. */
export const dauGay = (luc: number): number => R + 6 + Math.max(0, Math.min(1, luc)) * 80

/** Góc (radian) của hướng từ bi cái tới ngón tay. */
export const gocToi = (c: Diem, p: Diem): number => Math.atan2(p.y - c.y, p.x - c.x)
/** Đưa góc về (−π, π]. */
export function chuanGoc(a: number): number {
  let x = a % (2 * Math.PI)
  if (x > Math.PI) x -= 2 * Math.PI
  if (x <= -Math.PI) x += 2 * Math.PI
  return x
}
/** Bán kính vùng chạm để kéo bi cái khi đặt bi (đơn vị bàn): ≥ 2,4 R và ≥ 30 px CSS (bàn nhỏ khi xoay ngang vẫn chạm trúng). */
export const banKinhBatBiCai = (S: number): number => Math.max(R * 2.4, 30 / Math.max(0.05, S))
