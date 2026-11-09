// Đọc CHẶT nhóm lỗi ngày Sửa (khối B lát 3, 09/11) — nằm trong mảnh lười NhomSuaHomNay (không nằm trên đường mở app). Tối đa 8 nhóm; nhóm thiếu tên / số
// câu không dương ⇒ bỏ; loại lạ ⇒ bỏ loại (không đoán).
export interface NhomSuaGoi7 { ten: string; so: number; loai?: 'tinh' | 'cach' | 'nham' }
export function docNhomSua(x: unknown): NhomSuaGoi7[] {
  if (!Array.isArray(x)) return []
  return x.slice(0, 8).flatMap((n) => {
    if (!n || typeof n !== 'object') return []
    const o = n as Record<string, unknown>, ten = typeof o.ten === 'string' ? o.ten.trim() : '', so = o.so
    if (!ten || typeof so !== 'number' || !Number.isFinite(so) || so <= 0) return []
    return [{ ten, so: Math.floor(so), ...(o.loai === 'tinh' || o.loai === 'cach' || o.loai === 'nham' ? { loai: o.loai } : {}) }]
  })
}
