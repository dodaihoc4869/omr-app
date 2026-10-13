// Luật ca dùng chung cho Hôm nay và Ca kiểm tra; không nạp kèm màn Ca kiểm tra.
import type { CaTomTat } from './exam-api'

/** Trạng thái hiển thị của ca theo mốc thời gian máy chủ + số đã nộp. */
export function trangThaiCa(ca: Pick<CaTomTat, 'trangThai' | 'batDau' | 'hetHanVao' | 'daVao' | 'daNop'>, nowMs: number): { ten: string; tone: 'xanh' | 'cam' | 'do' | 'tim' | 'xam' } {
  if (ca.trangThai === 'dong') return { ten: 'Đã đóng', tone: 'xam' }
  const batDau = ca.batDau ? new Date(ca.batDau).getTime() : NaN
  if (Number.isFinite(batDau) && nowMs < batDau) return { ten: 'Chưa mở', tone: 'xam' }
  const hetHan = ca.hetHanVao ? new Date(ca.hetHanVao).getTime() : NaN
  if (Number.isFinite(hetHan) && nowMs > hetHan) {
    if (ca.daVao > 0 && ca.daNop >= ca.daVao) return { ten: 'Xong', tone: 'xanh' }
    return { ten: ca.daVao > ca.daNop ? 'Còn em đang làm' : 'Hết giờ vào', tone: 'cam' }
  }
  return { ten: 'Đang mở', tone: 'tim' }
}

/** CA NÀY CÒN EM CHƯA NỘP XONG KHÔNG — dùng để cảnh báo trước khi xoá.
 *
 * Xoá ca là xoá MỀM, nhưng máy chủ coi `da_xoa` là KHOÁ (`caDangKhoa_`), nên
 * `nopBai` trả "Ca đã khoá — không lưu thêm được". Nghĩa là xoá một ca đang
 * chạy thì em đang làm dở KHÔNG NỘP ĐƯỢC BÀI. Khôi phục ca lại được, nhưng
 * mấy phút em ngồi bấm nút mà máy báo lỗi thì không lấy lại được.
 *
 * Dùng lại `trangThaiCa` chứ không viết luật thứ hai: hai bản đếm giờ lệch
 * nhau là cảnh báo hiện sai lúc, còn tệ hơn không có. */
export function caConEmDangLam(ca: Pick<CaTomTat, 'trangThai' | 'batDau' | 'hetHanVao' | 'daVao' | 'daNop'>, nowMs: number): boolean {
  const t = trangThaiCa(ca, nowMs).ten
  return t === 'Đang mở' || t === 'Còn em đang làm'
}

