// OMNI 3 — ĐỘ TRÔI CHẢY (mô hình thời gian lognormal: ln t = β_câu − τ_em + ε). LÕI THUẦN.
// ⚠ STUB HỢP ĐỒNG: agent "Lõi thuần" thay thân hàm bằng bản thật + test. Đặc tả mục 4.3.
import { THAM_SO_OMNI, type NhanTocDo, type Phan, type ThamSoOmni } from './omni-kieu'

/** Thời gian kỳ vọng riêng (ms) = e^{β − τ}. β vắng ⇒ ln(giây cơ sở theo phần × mức của uoc-luong-thoi-gian.ts × 1000). */
export function msKyVong(betaLn: number | null | undefined, tau: number, phan: Phan, mucDo: string | null): number {
  const coSo = phan === 'I' ? [75, 105, 150] : phan === 'II' ? [150, 210, 300] : [120, 180, 240]
  const m = mucDo && /van|VD/i.test(mucDo) ? 2 : mucDo && /hieu|TH/i.test(mucDo) ? 1 : 0
  const b = betaLn ?? Math.log(coSo[m]! * 1000)
  return Math.exp(b - tau)
}
/** Ngưỡng lướt (ms) = max(LUOT_MS_MIN, LUOT_TI_LE × kỳ vọng), kẹp [LUOT_MS_MIN, LUOT_MS_MAX]. */
export function nguongLuotMs(msKyVongRieng: number | null | undefined, ts: ThamSoOmni = THAM_SO_OMNI): number {
  const x = (msKyVongRieng ?? 0) * ts.LUOT_TI_LE
  return Math.min(ts.LUOT_MS_MAX, Math.max(ts.LUOT_MS_MIN, x))
}
/**
 * Nhãn tốc độ một lượt: ms vắng/ngoài [0, MS_TOI_DA] ⇒ null. SAI và ms < ngưỡng lướt ⇒ 'luot'. ĐÚNG: ms ≤ TROI_CHAY × kỳ vọng ⇒ 'troi_chay';
 * ms > CHAM × kỳ vọng ⇒ 'cham'; còn lại 'thuong'. SAI không lướt ⇒ 'thuong'.
 */
export function nhanTocDo(ms: number | null | undefined, msKyVongRieng: number | null | undefined, dung: boolean, ts: ThamSoOmni = THAM_SO_OMNI): NhanTocDo | null {
  if (ms == null || !(ms >= 0) || ms > ts.MS_TOI_DA || !msKyVongRieng) return null
  if (!dung) return ms < nguongLuotMs(msKyVongRieng, ts) ? 'luot' : 'thuong'
  if (ms <= ts.TROI_CHAY * msKyVongRieng) return 'troi_chay'
  if (ms > ts.CHAM * msKyVongRieng) return 'cham'
  return 'thuong'
}
/** τ riêng: trung vị (β − ln ms) trên tối đa TAU_SO_MAU mẫu gần nhất, co về 0 bằng TAU_MAU_AO mẫu ảo: τ = med·n/(n + ảo). */
export function uocTau(mau: readonly { betaLn: number; ms: number }[], ts: ThamSoOmni = THAM_SO_OMNI): { tau: number; n: number } {
  return { tau: 0, n: Math.min(mau.length, ts.TAU_SO_MAU) }
}
/** β câu = trung vị ln(ms) của các lượt đúng tự làm; < BETA_MAU_TOI_THIEU mẫu ⇒ null. */
export function betaTuMau(msDung: readonly number[], ts: ThamSoOmni = THAM_SO_OMNI): number | null {
  if (msDung.length < ts.BETA_MAU_TOI_THIEU) return null
  const a = msDung.filter((x) => x > 0).map(Math.log).sort((x, y) => x - y)
  return a.length ? a[Math.floor(a.length / 2)]! : null
}
