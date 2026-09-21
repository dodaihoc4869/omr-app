// Menu ba chấm của "Bảng nhiệm vụ": lối vào mọi màn cũ (mở dạng sheet toàn màn
// ở màn cổng). Đặt ở đây để StudentPortalScreen/ParentPortalScreen chỉ còn nối
// dây, không phải mang theo danh sách biểu tượng.
import { BarChart3, ClipboardList, Heart, Newspaper, PawPrint, RotateCcw, LogOut } from 'lucide-react'
import type { MucMenu } from './DauTrang'

const CO = 18

export type ManCuHocSinh = 'diem' | 'btvn' | 'mom' | 'khacphuc' | 'bantin' | 'thanthu'

export function mucMenuHocSinh(moMan: (man: ManCuHocSinh) => void, dangXuat: () => void): MucMenu[] {
  return [
    { id: 'diem', nhan: 'Xem điểm & lịch sử ca kiểm tra', bieuTuong: <BarChart3 size={CO} aria-hidden="true" />, onChon: () => moMan('diem') },
    { id: 'btvn', nhan: 'Bài tập về nhà', bieuTuong: <ClipboardList size={CO} aria-hidden="true" />, onChon: () => moMan('btvn') },
    { id: 'mom', nhan: 'Bài gia đình giao', bieuTuong: <Heart size={CO} aria-hidden="true" />, onChon: () => moMan('mom') },
    { id: 'khacphuc', nhan: 'Khắc phục lỗi sai', bieuTuong: <RotateCcw size={CO} aria-hidden="true" />, onChon: () => moMan('khacphuc') },
    { id: 'bantin', nhan: 'Bảng tin & bài luyện hôm nay', bieuTuong: <Newspaper size={CO} aria-hidden="true" />, onChon: () => moMan('bantin') },
    { id: 'thanthu', nhan: 'Thần thú', bieuTuong: <PawPrint size={CO} aria-hidden="true" />, onChon: () => moMan('thanthu') },
    { id: 'dangxuat', nhan: 'Đăng xuất', bieuTuong: <LogOut size={CO} aria-hidden="true" />, keTren: true, onChon: dangXuat },
  ]
}

// Phụ huynh: KHÔNG còn menu ba chấm (thầy lệnh 21/09 — một màn một nút). Đường "Đổi số báo danh" nằm ở chân màn (BangNhiemVu `onDoiSbd`).
