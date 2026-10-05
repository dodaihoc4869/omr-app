// OMNI 3 — QUYẾT ĐỊNH "VỮNG" BẰNG SPRT (Wald) — ba trạng thái, sai số kiểm soát. LÕI THUẦN.
// Đặc tả mục 4.4: đúng +ln(p1/p0), sai +ln((1−p1)/(1−p0)); ý Đúng–sai p1 = 0,93.
//   ≥ ln((1−β)/α) = 2,08 ⇒ 'vung' · ≤ ln(β/(1−α)) = −1,50 ⇒ 'chua_vung' · giữa ⇒ 'chua_du'.
// Nghĩa thực tế (p1 0,9): 9 lượt đúng liên tiếp ⇒ vững; 13 đúng + 1 sai ⇒ vững; 2 sai liền từ 0 ⇒ chưa vững.
import { THAM_SO_OMNI, type ThamSoOmni, type TrangThaiSprt } from './omni-kieu'

/** Hai ngưỡng Wald: trên = ln((1−β)/α), dưới = ln(β/(1−α)). */
export function nguongSprt(ts: ThamSoOmni = THAM_SO_OMNI): { tren: number; duoi: number } {
  const { alpha, beta } = ts.SPRT
  return { tren: Math.log((1 - beta) / alpha), duoi: Math.log(beta / (1 - alpha)) }
}
/** Một bước bằng chứng: đúng +ln(p1/p0), sai +ln((1−p1)/(1−p0)); `laY` (một ý Đúng–sai) dùng p1 = SPRT.p1Y. Không kẹp. */
export function buocSprt(diem: number, dung: boolean, laY: boolean, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const p1 = laY ? ts.SPRT.p1Y : ts.SPRT.p1
  const p0 = ts.SPRT.p0
  return diem + (dung ? Math.log(p1 / p0) : Math.log((1 - p1) / (1 - p0)))
}
/**
 * Bước SPRT dùng khi PHÁT LẠI LIÊN TỤC một hồ sơ (omni-p-vkn `phatLaiEm`): như `buocSprt` nhưng KHÔNG xuống dưới ngưỡng dưới.
 * Wald dừng khi chạm ngưỡng; hồ sơ thì chạy tiếp — đã kết luận 'chua_vung' thì bằng chứng mới tính TỪ ngưỡng (em học được rồi không phải
 * trả "nợ" điểm âm cũ: một lượt đúng là ra khỏi 'chua_vung'). Phía trên không kẹp (đúng nghĩa "13 đúng + 1 sai ⇒ vững" ở mọi thứ tự).
 */
export function buocSprtPhatLai(diem: number, dung: boolean, laY: boolean, ts: ThamSoOmni = THAM_SO_OMNI): number {
  return Math.max(nguongSprt(ts).duoi, buocSprt(diem, dung, laY, ts))
}
/** Ba trạng thái theo điểm: ≥ trên 'vung' · ≤ dưới 'chua_vung' · giữa 'chua_du'. */
export function trangThaiSprt(diem: number, ts: ThamSoOmni = THAM_SO_OMNI): TrangThaiSprt {
  const n = nguongSprt(ts)
  return diem >= n.tren ? 'vung' : diem <= n.duoi ? 'chua_vung' : 'chua_du'
}
