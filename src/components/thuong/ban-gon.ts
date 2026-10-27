// HỌC CÙNG BẠN · phần NHỎ dùng chung (27/10) giữa màn Học cùng bạn (ManBan, mảnh lười) và các lối vào hiện ngay (thẻ Lộ trình TheBanLoTrinh, khối «Lửa đôi»
// ở Chuỗi ngày): CÙNG cách gọi tên bạn (đủ họ tên), CÙNG hiệu ứng «Gõ cửa». Không gọi mạng, không dữ liệu nào khác của bạn ngoài tên · lửa đôi · đã học hôm nay chưa.
import { bungHat, hoatAnh, phanHoiThuong } from '../../lib/hieu-ung-thuong'
import type { BanHoc } from '../../lib/thuong-api'

/** Tên bạn hiện trên màn: ĐỦ HỌ TÊN đúng thứ tự tiếng Việt như danh sách lớp («Lê Minh Đức»), chỉ gọn khoảng trắng — thầy 27/10 «Cho hiện đủ tên nhé,
 *  chuẩn tên nhé» (không rút kiểu «Minh Đức L.» / «Đức»). Rỗng ⇒ «Bạn học». */
export const tenGoi = (ten: string): string => ten.trim().split(/\s+/).filter(Boolean).join(' ') || 'Bạn học'

/** Ô chữ đầu (avatar) — MỘT kiểu cho mọi chỗ của hệ thưởng: chữ đầu của tên đệm + tên (hai từ cuối). «Lê Minh Đức» ⇒ «MĐ» · «Đức» ⇒ «Đ». */
export const chuCai = (ten: string): string => ten.trim().split(/\s+/).filter(Boolean).slice(-2).map((x) => [...x][0] ?? '').join('').toLocaleUpperCase('vi')

/** Nhãn lớp (luật «số nào cũng có nhãn», thầy 27/10): «11» ⇒ «Lớp 11» · «12A1» ⇒ «Lớp 12A1» · đã có chữ «lớp» («12 - Lớp Thường», «Chưa xếp lớp») ⇒ giữ. */
export const nhanLop = (lop: string | undefined): string => { const l = (lop ?? '').trim(); return !l ? '' : /lớp/i.test(l) ? l : `Lớp ${l}` }

/** Bạn CHƯA xong bài hôm nay (em đã xong ⇒ gõ cửa được, hoặc cả hai chưa). */
export const banChuaHoc = (b: BanHoc): boolean => b.homNay === 'ban_chua' || b.homNay === 'ca_hai_chua'

/** Bạn nên nhắc trước: gõ cửa được mà chưa gõ ⇒ đã gõ ⇒ cả hai chưa học. Không ai chưa học ⇒ undefined. */
export function banCanNhac(ds: readonly BanHoc[]): BanHoc | undefined {
  const hang = (b: BanHoc) => (b.homNay === 'ban_chua' ? (b.daGoCua ? 1 : 0) : 2)
  return ds.filter(banChuaHoc).sort((a, b) => hang(a) - hang(b))[0]
}

/** Hiệu ứng «Gõ cửa» (bản vẽ tp-16): tiếng + rung, nút lắc 2 nhịp, gợn hạt. Giảm chuyển động ⇒ thư viện hiệu ứng tự tắt hoạt ảnh. */
export function hieuUngGoCua(nut: HTMLElement | null): void {
  phanHoiThuong('goCua')
  for (let k = 0; k < 2; k++) {
    hoatAnh(nut, [{ transform: 'none' }, { transform: 'translateX(-3px) rotate(-3deg)' }, { transform: 'translateX(3px) rotate(3deg)' }, { transform: 'none' }], 220, { tre: k * 320 })
    setTimeout(() => bungHat(nut, { n: 6, r: 36, co: 6, tron: true, mau: ['tt', 'trang'] }), k * 320 + 60)
  }
}
