// Đọc CHẶT nhóm lỗi ngày Sửa (khối B lát 3–4, 09/11) — nằm trong mảnh lười NhomSuaHomNay (không nằm trên đường mở app). Tối đa 8 nhóm; nhóm thiếu tên / số
// câu không dương ⇒ bỏ; loại lạ ⇒ bỏ loại (không đoán); `xong` kẹp trong [0, so], thiếu ⇒ 0.
export type LoaiNhomSua = 'tinh' | 'cach' | 'nham' | 'hoc_lai'
export interface NhomSuaGoi7 { ten: string; so: number; xong: number; loai?: LoaiNhomSua }
const LOAI: readonly string[] = ['tinh', 'cach', 'nham', 'hoc_lai']
export function docNhomSua(x: unknown): NhomSuaGoi7[] {
  if (!Array.isArray(x)) return []
  return x.slice(0, 8).flatMap((n) => {
    if (!n || typeof n !== 'object') return []
    const o = n as Record<string, unknown>, ten = typeof o.ten === 'string' ? o.ten.trim() : '', so = o.so
    if (!ten || typeof so !== 'number' || !Number.isFinite(so) || so <= 0) return []
    const tong = Math.floor(so), xong = typeof o.xong === 'number' && Number.isFinite(o.xong) ? Math.min(tong, Math.max(0, Math.floor(o.xong))) : 0
    return [{ ten, so: tong, xong, ...(typeof o.loai === 'string' && LOAI.includes(o.loai) ? { loai: o.loai as LoaiNhomSua } : {}) }]
  })
}
