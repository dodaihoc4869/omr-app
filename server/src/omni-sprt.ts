// OMNI 3 — QUYẾT ĐỊNH "VỮNG" BẰNG SPRT (Wald) — ba trạng thái, sai số kiểm soát. LÕI THUẦN.
// ⚠ STUB HỢP ĐỒNG: agent "Lõi thuần" hoàn thiện + test. Đặc tả mục 4.4: đúng +ln(p1/p0), sai +ln((1−p1)/(1−p0)); ý Đúng–sai p1 = 0,93.
//   ≥ ln((1−β)/α) = 2,08 ⇒ 'vung' · ≤ ln(β/(1−α)) = −1,50 ⇒ 'chua_vung' · giữa ⇒ 'chua_du'.
import { THAM_SO_OMNI, type ThamSoOmni, type TrangThaiSprt } from './omni-kieu'

export function nguongSprt(ts: ThamSoOmni = THAM_SO_OMNI): { tren: number; duoi: number } {
  const { alpha, beta } = ts.SPRT
  return { tren: Math.log((1 - beta) / alpha), duoi: Math.log(beta / (1 - alpha)) }
}
export function buocSprt(diem: number, dung: boolean, laY: boolean, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const p1 = laY ? ts.SPRT.p1Y : ts.SPRT.p1
  const p0 = ts.SPRT.p0
  return diem + (dung ? Math.log(p1 / p0) : Math.log((1 - p1) / (1 - p0)))
}
export function trangThaiSprt(diem: number, ts: ThamSoOmni = THAM_SO_OMNI): TrangThaiSprt {
  const n = nguongSprt(ts)
  return diem >= n.tren ? 'vung' : diem <= n.duoi ? 'chua_vung' : 'chua_du'
}
