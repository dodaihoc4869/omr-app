// LOẠI NGÀY trên Lộ trình (khối B đợt 1, thầy 09/11 duyệt docs/ban-ve-moi-on-sua-0911) — chỉ mảnh Lộ trình (TrongHs) dùng ⇒ không nằm trên đường mở app.
export type LoaiNgay = 'moi' | 'sua'
export const NHAN_LOAI_NGAY: Record<LoaiNgay, string> = { moi: 'Ngày học mới', sua: 'Ngày sửa lỗi' }
/** Chữ nút học theo loại ngày: ngày sửa lỗi nói đúng việc; còn lại giữ chữ `chuNutHoc`. */
export const chuNutLoai = (chu: string, loai?: LoaiNgay): string => loai === 'sua' ? chu.replace(/^Bắt đầu học/, 'Bắt đầu sửa lỗi').replace(/^Học tiếp/, 'Sửa lỗi tiếp') : chu
/** Chữ trên nút chính (viên thuốc) của chặng đang làm. */
export const bongHoc = (dangDo: boolean, loai?: LoaiNgay): string => loai === 'sua' ? (dangDo ? 'Sửa lỗi tiếp' : 'Bắt đầu sửa lỗi') : dangDo ? 'Học tiếp' : 'Bắt đầu'
/** Ngày Sửa (khối B lát 5, bản vẽ dt-sang-3 «Sửa nhóm 1»): nhóm đang sửa = nhóm đầu chưa xong trong `goi7.nhomSua` (thô, máy chủ xếp câu sửa liền theo nhóm)
 *  ⇒ { i (đánh số từ 1, cùng số trên thẻ Nhóm lỗi hôm nay), ten }. Không có / hết ⇒ null (nút giữ chữ chặng như cũ). */
export function nhomDangSua(tho: unknown): { i: number; ten: string } | null {
  if (!Array.isArray(tho)) return null
  for (let i = 0; i < tho.length && i < 8; i++) {
    const n = tho[i] as { ten?: unknown; so?: unknown; xong?: unknown } | null
    if (!n || typeof n.ten !== 'string' || !n.ten.trim() || typeof n.so !== 'number' || !(n.so > 0)) continue
    if (!(typeof n.xong === 'number' && n.xong >= n.so)) return { i: i + 1, ten: n.ten.trim() }
  }
  return null
}
