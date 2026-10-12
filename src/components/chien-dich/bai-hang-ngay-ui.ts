// BÀI HẰNG NGÀY — phép thuần dùng chung cho thẻ "Bài hằng ngày" (bảng nhiệt) và tấm hồ sơ một em (lịch hoạt động). Không IO.
import type { EmBaiHangNgay, MucTinHieu, NgayBaiEm, NhanThaiDo } from '../../lib/bai-hang-ngay-api'
import { LUAT_NHOM_NHIP, type NhomNhip } from '../../../server/src/nhip-hoc-kieu'

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

/** Xếp theo MỘT ngày (bấm đầu cột): thiếu nhiều câu ngày ấy trước → thứ tự chung (ngày thiếu → câu thiếu → thiếu hôm nay → tên). */
export function xepTheoNgay(ngay: string) {
  return (a: EmBaiHangNgay, b: EmBaiHangNgay): number => {
    const ta = a.ngay.find((n) => n.ngay === ngay)?.thieu ?? 0
    const tb = b.ngay.find((n) => n.ngay === ngay)?.thieu ?? 0
    return (
      tb - ta || b.soNgayThieu - a.soNgayThieu || b.tongCauThieu - a.tongCauThieu || b.thieuHomNay - a.thieuHomNay || a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd)
    )
  }
}

export const TEN_MUC_TIN_HIEU: Record<MucTinHieu, string> = { tot: 'Trong ngưỡng', 'chu-y': 'Cần để mắt', xau: 'Vượt ngưỡng', 'chua-du': 'Chưa đủ dữ liệu' }
/** Mô tả ngắn từng nhãn (đứng dưới nhãn ở đầu tấm). */
export const MO_TA_NHAN: Record<NhanThaiDo, string> = {
  'cham-chi': 'Làm đủ mức gần như mọi ngày, nhịp đều, không thấy dấu hiệu làm cho xong.',
  'chua-deu': 'Đủ mức chưa tới 80% số ngày, hoặc làm dồn vào khuya.',
  luoi: 'Đủ mức từ 40% số ngày trở xuống, hoặc 3 ngày liền không làm câu nào; thoát khi đủ mức 6 ngày liền.',
  'doi-pho': 'Có dấu hiệu làm cho xong: xem các tín hiệu vượt ngưỡng bên dưới.',
  'chua-du-du-lieu': 'Cần thêm ngày làm bài để kết luận.',
}

/** 12/10: đầu tấm hiện NHÓM Nhịp học (cùng luật Hôm nay › Nhịp học) làm nhãn chính — màu tô theo nhãn thái độ tương ứng, mô tả theo luật nhóm. */
export const NHAN_THEO_NHOM: Record<NhomNhip, NhanThaiDo> = { cham: 'cham-chi', 'chua-deu': 'chua-deu', luoi: 'luoi', 'chua-du': 'chua-du-du-lieu' }
export const MO_TA_NHOM: Record<NhomNhip, string> = {
  cham: `Đủ mức từ ${LUAT_NHOM_NHIP.chamTu}% số ngày đã qua, tính từ ngày em vào học.`,
  'chua-deu': `Đủ mức chưa tới ${LUAT_NHOM_NHIP.chamTu}% số ngày đã qua, hoặc vừa ra khỏi nhóm Lười nhờ ${LUAT_NHOM_NHIP.ngayLienThoatLuoi} ngày liền đủ mức.`,
  luoi: `Đủ mức từ ${LUAT_NHOM_NHIP.luoiDen}% số ngày trở xuống, hoặc ${LUAT_NHOM_NHIP.ngayLienKhongLam} ngày liền không làm câu nào; thoát khi đủ mức ${LUAT_NHOM_NHIP.ngayLienThoatLuoi} ngày liền.`,
  'chua-du': `Chưa đủ ${LUAT_NHOM_NHIP.soNgayToiThieu} ngày đã qua để xếp nhóm.`,
}
