// GIÂY GIẢI GỐC theo PHẦN × MỨC — MỘT NGUỒN dùng chung cho HAI phía:
//   · `server/src/ho-so-cau-hinh.ts` (THAM-SO `baseSeconds` — bộ ước lượng thời gian của máy chủ);
//   · `src/game/than-thu-v2/doan-core.ts` (HẠN MỀM của Đoàn, 02 §8 — lõi thuần chạy cả ở máy em).
// Vì hai phía không import chéo được (lõi thuần không kéo mã máy chủ vào gói của em), bảng này được NHÂN BẢN
// ở đây và có TEST đối chiếu với bản của máy chủ (`tests/cnh-1-0-doan-han-mem-p06.test.ts`) để không trôi số.
export const GIAY_CO_SO: Readonly<Record<'I' | 'II' | 'III', readonly [number, number, number]>> = Object.freeze({
  I: Object.freeze([75, 105, 150] as const),
  II: Object.freeze([150, 210, 300] as const),
  III: Object.freeze([120, 180, 240] as const),
})

/** Bậc của một nhãn mức độ trong kho: 'biet'→0 · 'hieu'→1 · 'van_dung'→2 (khác/thiếu ⇒ 0). */
export const bacCuaMucDo = (mucDo: string | null | undefined): 0 | 1 | 2 => {
  const c = String(mucDo ?? '').trim().toLowerCase()
  return c === 'van_dung' ? 2 : c === 'hieu' ? 1 : 0
}

/** Giây giải GỐC (chưa gồm thời gian đọc/bảng-hình và chưa gồm hệ số riêng của em). */
export function giayGocCuaCau(phan: string | undefined, mucDo: string | null | undefined): number {
  const bang = GIAY_CO_SO[(phan === 'II' || phan === 'III' ? phan : 'I') as 'I' | 'II' | 'III']
  return bang[bacCuaMucDo(mucDo)] ?? bang[0]!
}
