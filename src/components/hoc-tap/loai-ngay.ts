// LOẠI NGÀY trên Lộ trình (khối B đợt 1, thầy 09/11 duyệt docs/ban-ve-moi-on-sua-0911) — chỉ mảnh Lộ trình (TrongHs) dùng ⇒ không nằm trên đường mở app.
export type LoaiNgay = 'moi' | 'sua'
export const NHAN_LOAI_NGAY: Record<LoaiNgay, string> = { moi: 'Ngày học mới', sua: 'Ngày sửa lỗi' }
/** Chữ nút học theo loại ngày: ngày sửa lỗi nói đúng việc; còn lại giữ chữ `chuNutHoc`. */
export const chuNutLoai = (chu: string, loai?: LoaiNgay): string => loai === 'sua' ? chu.replace(/^Bắt đầu học/, 'Bắt đầu sửa lỗi').replace(/^Học tiếp/, 'Sửa lỗi tiếp') : chu
/** Chữ trên nút chính (viên thuốc) của chặng đang làm. */
export const bongHoc = (dangDo: boolean, loai?: LoaiNgay): string => loai === 'sua' ? (dangDo ? 'Sửa lỗi tiếp' : 'Bắt đầu sửa lỗi') : dangDo ? 'Học tiếp' : 'Bắt đầu'
