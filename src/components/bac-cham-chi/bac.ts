// Bảng 12 bậc (tên + biểu tượng — thầy 13/10, server/src/bac-cham-chi.ts) + chữ chung + phép tính lại theo Sảnh. CHỈ khối nạp khi cần (thành phần
// trong thư mục này, màn thầy, tấm hồ sơ) dùng tệp này — không để bộ đọc ở tải đầu app import nó.
import { BAC_CHAM_CHI, bacChamChi, SO_BAC, type KetQuaBac, type MotBac } from '../../../server/src/bac-cham-chi'
import type { NgayNhipEm, NhomNhip } from '../../../server/src/nhip-hoc-kieu'

export { BAC_CHAM_CHI, SO_BAC }
export type { MotBac }

/** Bậc số `so` (1–12); ngoài khoảng ⇒ null. */
export const motBac = (so: number): MotBac | null => BAC_CHAM_CHI[so - 1] ?? null

/** "Bậc 6/12 · Lười Có Tính Toán". */
export const chuBac = (b: MotBac): string => `Bậc ${b.so}/${SO_BAC} · ${b.ten}`
/** Như `chuBac` nhưng từ số bậc; ngoài khoảng ⇒ undefined. */
export const chuBacSo = (so: number): string | undefined => {
  const b = motBac(so)
  return b ? chuBac(b) : undefined
}

/**
 * Bậc của bảng em/phụ huynh SAU khi số hôm nay đã theo Sảnh (`nhipTheoSanh` có thể đổi nhóm / chuỗi ngày): máy chủ chưa gửi `bacCham` ⇒ null (ẩn phần
 * bậc); có ⇒ tính lại bằng ĐÚNG phép máy chủ trên cùng dãy ngày ⇒ bậc luôn khớp nhóm đang hiện (MỘT CON SỐ). Số Sảnh trùng số máy chủ ⇒ y số máy chủ. Thuần.
 */
export function bacTheoSanh(k: { ngay: readonly NgayNhipEm[]; homNay: string; nhom: NhomNhip; chuoiDuGanNhat: number; bacCham?: KetQuaBac }): KetQuaBac | null {
  return k.bacCham ? bacChamChi(k.ngay, k.homNay, k) : null
}
