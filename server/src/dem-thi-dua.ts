// ĐỆM 30 GIÂY của bảng Thi đua theo LỚP — kho dùng chung ở MỨC MÔ-ĐUN (Map khoá chuỗi; không gắn với đối tượng `env`/`env.DB` vì Workers có thể đưa binding KHÁC đối tượng mỗi lượt gọi ⇒ đệm không bao giờ trúng).
// Tệp riêng, không phụ thuộc gì, để `tests/_d1-that.ts` xoá đệm mỗi khi dựng một D1 giả mới (các test cùng tên lớp / cùng ngày không lẫn nhau). Chi tiết luật đệm ở `thi-dua-hom-nay.ts`.
const kho = new Map<string, { at: number; kq: unknown }>()
const TOI_DA_KHOA = 40
/** Xoá toàn bộ đệm (test / sau khi đổi cấu hình). */
export function xoaDemThiDua(): void { kho.clear() }
/** Lấy đệm còn hạn (`nowMs - at ∈ [0, hanMs)`); đồng hồ lùi ⇒ coi như hết hạn. */
export function docDemThiDua<T>(khoa: string, nowMs: number, hanMs: number): T | null {
  const x = kho.get(khoa)
  return x && nowMs - x.at >= 0 && nowMs - x.at < hanMs ? (x.kq as T) : null
}
export function ghiDemThiDua(khoa: string, nowMs: number, kq: unknown): void {
  kho.set(khoa, { at: nowMs, kq })
  if (kho.size > TOI_DA_KHOA) for (const k of [...kho.keys()].slice(0, kho.size - TOI_DA_KHOA)) kho.delete(k)
}
