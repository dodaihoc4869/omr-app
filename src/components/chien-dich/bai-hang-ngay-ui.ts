// BÀI HẰNG NGÀY — phép thuần dùng chung cho thẻ "Bài hằng ngày" (bảng nhiệt) và tấm hồ sơ một em (lịch hoạt động). Không IO.
import type { EmBaiHangNgay, MucTinHieu, NgayBaiEm, NhanThaiDo } from '../../lib/bai-hang-ngay-api'

/** Bốn mức tô của một ô ngày (màu KHÔNG là kênh duy nhất: ô luôn ghi "đã làm/mức"). */
export type MucO = 'du' | 'thieu-it' | 'thieu-nhieu' | 'khong-lam'
export const TEN_MUC_O: Record<MucO, string> = {
  du: 'Đủ mức',
  'thieu-it': 'Thiếu ít (đạt từ 50% mức)',
  'thieu-nhieu': 'Thiếu nhiều (dưới 50% mức)',
  'khong-lam': 'Không làm câu nào',
}
/** Đủ ⇒ 'du'; 0 câu ⇒ 'khong-lam'; đạt từ nửa mức ⇒ 'thieu-it'; còn lại 'thieu-nhieu'. */
export function mucO(n: Pick<NgayBaiEm, 'daLam' | 'mucToiThieu' | 'datMuc'>): MucO {
  if (n.datMuc) return 'du'
  if (n.daLam <= 0) return 'khong-lam'
  return 2 * n.daLam >= n.mucToiThieu ? 'thieu-it' : 'thieu-nhieu'
}

const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const
const THU_DU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'] as const
const thuSo = (ngay: string) => new Date(`${ngay}T00:00:00Z`).getUTCDay()
/** "13/10". */
export const ngayNgan = (ngay: string): string => `${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`
/** "T3" · "CN" (đầu cột hẹp; chữ đủ ở `thuDu`). */
export const thuNgan = (ngay: string): string => THU_NGAN[thuSo(ngay)] ?? ''
/** "Thứ Ba 13/10". */
export const thuDu = (ngay: string): string => `${THU_DU[thuSo(ngay)] ?? ''} ${ngayNgan(ngay)}`.trim()

/** Câu đầy đủ của một ô cho trình đọc màn hình / chú thích khi trỏ chuột. */
export function chuO(n: NgayBaiEm): string {
  const dau = `${thuDu(n.ngay)}${n.homNay ? ' (hôm nay, tính tới lúc tải)' : ''}: đã làm ${n.daLam}/${n.mucToiThieu} câu`
  const sau = n.datMuc ? 'đủ mức' : `thiếu ${n.thieu} câu`
  return `${dau} — ${sau}${n.mucUocTinh ? ' · mức ước tính' : ''}`
}

/** Xếp theo MỘT ngày (bấm đầu cột): thiếu nhiều câu ngày ấy trước → thứ tự chung (ngày thiếu → câu thiếu → tên). */
export function xepTheoNgay(ngay: string) {
  return (a: EmBaiHangNgay, b: EmBaiHangNgay): number => {
    const ta = a.ngay.find((n) => n.ngay === ngay)?.thieu ?? 0
    const tb = b.ngay.find((n) => n.ngay === ngay)?.thieu ?? 0
    return tb - ta || b.soNgayThieu - a.soNgayThieu || b.tongCauThieu - a.tongCauThieu || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd)
  }
}

export const TEN_MUC_TIN_HIEU: Record<MucTinHieu, string> = { tot: 'Trong ngưỡng', 'chu-y': 'Cần để mắt', xau: 'Vượt ngưỡng', 'chua-du': 'Chưa đủ dữ liệu' }
/** Mô tả ngắn từng nhãn (đứng dưới nhãn ở đầu tấm). */
export const MO_TA_NHAN: Record<NhanThaiDo, string> = {
  'cham-chi': 'Làm đủ mức gần như mọi ngày, nhịp đều, không thấy dấu hiệu làm cho xong.',
  'chua-deu': 'Có ngày không đủ mức hoặc làm dồn vào khuya.',
  'doi-pho': 'Có dấu hiệu làm cho xong: xem các tín hiệu vượt ngưỡng bên dưới.',
  'chua-du-du-lieu': 'Cần thêm ngày làm bài để kết luận.',
}
