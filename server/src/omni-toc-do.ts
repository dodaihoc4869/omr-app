// OMNI 3 — ĐỘ TRÔI CHẢY (mô hình thời gian lognormal: ln t = β_câu − τ_em + ε). LÕI THUẦN.
// Đặc tả mục 4.3: β_j = trung vị ln(mili_giay) của lớp trên câu j (≥ 8 mẫu đúng, tự làm); thiếu ⇒ ln(baseSeconds × 1000) của
// uoc-luong-thoi-gian.ts (bảng GIAY_CO_SO). τ_em = trung vị (β_j − ln t) trên 20 lượt đúng tự làm gần nhất, co về 0 bằng 10 mẫu ảo.
// Nhãn: t ≤ 1,25·e^{β−τ} trôi chảy · > 2,0· chậm · sai và t < max(3 s, 10 % e^{β−τ}) (kẹp [3, 8] s) lướt.
import { GIAY_CO_SO } from './ho-so-cau-hinh'
import { THAM_SO_OMNI, type NhanTocDo, type Phan, type ThamSoOmni } from './omni-kieu'

const boDau = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

/**
 * Mức độ câu → bậc 0|1|2 của bảng giây cơ sở. Nhận: 'NB'/'Nhận biết'/'biet'/'nhan_biet' ⇒ 0 · 'TH'/'Thông hiểu'/'hieu'/'thong_hieu' ⇒ 1 ·
 * 'VD'/'Vận dụng'/'van_dung'/'VDC'/'Vận dụng cao'/'van_dung_cao' ⇒ 2 (bảng chỉ có 3 bậc). Lạ/thiếu ⇒ 0 (như `mucTuChu` của app).
 */
export function mucDoSo(mucDo: string | null | undefined): 0 | 1 | 2 {
  const k = boDau(String(mucDo ?? '')).trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (k === 'vd' || k === 'vdc' || k.startsWith('van_dung')) return 2
  if (k === 'th' || k === 'hieu' || k.startsWith('thong_hieu')) return 1
  return 0
}

/** Thời gian kỳ vọng riêng (ms) = e^{β − τ}. β vắng/không hữu hạn ⇒ ln(giây cơ sở theo phần × mức (GIAY_CO_SO) × 1000). τ không hữu hạn ⇒ 0. */
export function msKyVong(betaLn: number | null | undefined, tau: number, phan: Phan, mucDo: string | null): number {
  const bang = GIAY_CO_SO[phan] ?? GIAY_CO_SO.I
  const b = typeof betaLn === 'number' && Number.isFinite(betaLn) ? betaLn : Math.log(bang[mucDoSo(mucDo)] * 1000)
  return Math.exp(b - (Number.isFinite(tau) ? tau : 0))
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

/** Trung vị (cỡ chẵn ⇒ trung bình hai số giữa). Mảng rỗng ⇒ NaN. */
export function trungVi(ds: readonly number[]): number {
  const a = [...ds].sort((x, y) => x - y)
  const n = a.length
  if (!n) return Number.NaN
  return n % 2 ? a[(n - 1) / 2]! : (a[n / 2 - 1]! + a[n / 2]!) / 2
}

/**
 * τ riêng: trung vị (β − ln ms) trên tối đa TAU_SO_MAU mẫu HỢP LỆ gần nhất (β hữu hạn, 0 < ms ≤ MS_TOI_DA), co về 0 bằng TAU_MAU_AO mẫu ảo:
 * τ = med·n/(n + ảo). `mau` truyền theo thứ tự thời gian tăng ⇒ lấy phần CUỐI. Không mẫu ⇒ { tau: 0, n: 0 }. τ > 0 ⇒ nhanh hơn lớp.
 */
export function uocTau(mau: readonly { betaLn: number; ms: number }[], ts: ThamSoOmni = THAM_SO_OMNI): { tau: number; n: number } {
  const hopLe = mau.filter((m) => Number.isFinite(m.betaLn) && Number.isFinite(m.ms) && m.ms > 0 && m.ms <= ts.MS_TOI_DA)
  const dung = hopLe.slice(Math.max(0, hopLe.length - ts.TAU_SO_MAU))
  const n = dung.length
  if (!n) return { tau: 0, n: 0 }
  const med = trungVi(dung.map((m) => m.betaLn - Math.log(m.ms)))
  return { tau: (med * n) / (n + ts.TAU_MAU_AO), n }
}
/** β câu = trung vị ln(ms) của các lượt đúng tự làm HỢP LỆ (0 < ms ≤ MS_TOI_DA); < BETA_MAU_TOI_THIEU mẫu hợp lệ ⇒ null. */
export function betaTuMau(msDung: readonly number[], ts: ThamSoOmni = THAM_SO_OMNI): number | null {
  const a = msDung.filter((x) => Number.isFinite(x) && x > 0 && x <= ts.MS_TOI_DA)
  if (a.length < ts.BETA_MAU_TOI_THIEU) return null
  return trungVi(a.map(Math.log))
}
