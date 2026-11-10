// Đọc CHẶT Lịch bài (khối B, bản vẽ docs/ban-ve-moi-on-sua-0911 dt-sang-1) — trong mảnh lười LichBaiHs. Tối đa 21 ngày; ngày sai dạng / loại lạ ⇒ bỏ ngày ấy.
export type LoaiLich = 'moi' | 'sua' | 'kiem' | 'du'
export interface LichBaiDoc { ten: string; han: string; ngay: { ngay: string; loai: LoaiLich }[] }
const LOAI: readonly string[] = ['moi', 'sua', 'kiem', 'du']
const NGAY = /^\d{4}-\d{2}-\d{2}$/
export function docLichBai(x: unknown): LichBaiDoc | null {
  if (!x || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  const ten = typeof o.ten === 'string' ? o.ten.trim() : '', han = typeof o.han === 'string' && NGAY.test(o.han) ? o.han : ''
  const ngay = Array.isArray(o.ngay) ? o.ngay.slice(0, 21).flatMap((n) => {
    const d = n && typeof n === 'object' ? (n as Record<string, unknown>) : {}
    return typeof d.ngay === 'string' && NGAY.test(d.ngay) && typeof d.loai === 'string' && LOAI.includes(d.loai) ? [{ ngay: d.ngay, loai: d.loai as LoaiLich }] : []
  }) : []
  return ten && han && ngay.length >= 2 ? { ten, han, ngay } : null
}
