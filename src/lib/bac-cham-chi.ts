// 12 BẬC TỪ LƯỜI ĐẾN CHĂM — PHÍA APP (thầy 13/10: "tính toán tối ưu sắp xếp mức độ lười biếng … và hiển thị luôn", "Mỗi cấp độ hiển thị màu khác nhau").
// Phép tính ở MỘT chỗ: server/src/bac-cham-chi.ts (máy chủ gửi `bacCham` CHỈ THÊM ở `/gv/nhip-hoc`, `/hs|/ph/nhip-hoc`, hồ sơ thái độ). Tệp này chỉ:
//   · ĐỌC CHẶT `bacCham` (sai kiểu / ngoài khoảng / lệch nhóm ⇒ bỏ trường, phần bậc ẩn — không bịa số);
// TỆP NÀY NẰM TRONG TẢI ĐẦU app học sinh / phụ huynh (bộ đọc `/hs|/ph/nhip-hoc`) ⇒ KHÔNG import giá trị nào từ server/src/bac-cham-chi.ts (bảng 12 tên,
// phép tính sẽ bị kéo vào tải đầu). Khoảng bậc chép thành hằng nhỏ dưới đây — test tests/bac-cham-chi-giao-dien-1310 khoá khớp `NGUONG_BAC` của máy chủ.
// Bảng tên + phép tính lại theo Sảnh: src/components/bac-cham-chi/bac.ts (chỉ khối nạp khi cần dùng).
import type { KetQuaBac, NhomCoBac } from '../../server/src/bac-cham-chi'
import type { NhomNhip } from '../../server/src/nhip-hoc-kieu'

export type { KetQuaBac }

/** Khoảng bậc [đầu, cuối] của từng nhóm — Lười 1–5 · Chưa đều 6–7 · Chăm 8–12 (= `NGUONG_BAC`: đầu nhóm … đầu + số ngưỡng). */
export const KHOANG_BAC: Readonly<Record<NhomCoBac, readonly [number, number]>> = { luoi: [1, 5], 'chua-deu': [6, 7], cham: [8, 12] }
/** Bậc cao nhất. */
export const BAC_CAO_NHAT = KHOANG_BAC.cham[1]

/** Khoảng bậc của một nhóm; 'chua-du' / vắng ⇒ null (chưa xếp bậc). */
export const khoangBac = (nhom: NhomNhip | null | undefined): readonly [number, number] | null =>
  nhom === 'luoi' || nhom === 'chua-deu' || nhom === 'cham' ? KHOANG_BAC[nhom] : null

const soHuuHan = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/**
 * Đọc CHẶT `bacCham` của máy chủ: `bac` nguyên 1–12, `diem` 0–100, `diemLenBac` là null hoặc số dương ≤ 100. Có `nhom` (kể cả null) ⇒ bậc phải nằm trong
 * khoảng của nhóm ấy, và bậc cuối khoảng không có "còn N điểm" (lên nhóm theo luật nhóm). Sai bất kỳ điều gì ⇒ null (bỏ trường). Thuần.
 */
export function docBacCham(x: unknown, nhom?: NhomNhip | null): KetQuaBac | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null
  const o = x as Record<string, unknown>
  const bac = o.bac, diem = o.diem, len = o.diemLenBac
  if (!Number.isInteger(bac)) return null
  if (!soHuuHan(diem) || diem < 0 || diem > 100) return null
  if (len !== null && (!soHuuHan(len) || len <= 0 || len > 100)) return null
  const b = bac as number
  const k = nhom === undefined ? ([1, BAC_CAO_NHAT] as const) : khoangBac(nhom)
  if (!k || b < k[0] || b > k[1] || (len !== null && b === k[1])) return null
  return { bac: b, diem: Math.round(diem), diemLenBac: len === null ? null : Math.max(1, Math.round(len)) }
}
