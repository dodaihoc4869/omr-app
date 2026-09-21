// Menu ba chấm của "Bảng nhiệm vụ": lối vào mọi màn cũ (mở dạng sheet toàn màn
// ở màn cổng). Đặt ở đây để StudentPortalScreen/ParentPortalScreen chỉ còn nối
// dây, không phải mang theo danh sách biểu tượng.
import { BarChart3, BookOpen, ClipboardList, Heart, Newspaper, PawPrint, RotateCcw, LogOut, Zap } from 'lucide-react'
import type { MucMenu } from './DauTrang'

const CO = 18

export type ManCuHocSinh = 'diem' | 'btvn' | 'mom' | 'khacphuc' | 'bantin' | 'thanthu'
export type ManCuPhuHuynh = 'diem' | 'khacphuc' | 'bantin'

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

/** `giaoNhanh`: hai lối 1 chạm cũ của màn phụ huynh (khắc phục câu sai / luyện bứt phá). */
export function mucMenuPhuHuynh(
  moMan: (man: ManCuPhuHuynh) => void,
  doiSbd: () => void,
  giaoNhanh?: { khacPhuc: () => void; luyen: () => void },
): MucMenu[] {
  return [
    { id: 'diem', nhan: 'Báo cáo điểm các ca kiểm tra', bieuTuong: <BarChart3 size={CO} aria-hidden="true" />, onChon: () => moMan('diem') },
    { id: 'khacphuc', nhan: 'Giao bài khắc phục cho con', bieuTuong: <BookOpen size={CO} aria-hidden="true" />, onChon: () => moMan('khacphuc') },
    { id: 'bantin', nhan: 'Bảng tin của con', bieuTuong: <Newspaper size={CO} aria-hidden="true" />, onChon: () => moMan('bantin') },
    ...(giaoNhanh
      ? [
          { id: 'giao-khac-phuc', nhan: 'Giao nhanh: bài khắc phục câu sai', bieuTuong: <Zap size={CO} aria-hidden="true" />, onChon: giaoNhanh.khacPhuc },
          { id: 'giao-luyen', nhan: 'Giao nhanh: bài luyện bứt phá', bieuTuong: <Zap size={CO} aria-hidden="true" />, onChon: giaoNhanh.luyen },
        ]
      : []),
    { id: 'doisbd', nhan: 'Đổi số báo danh', bieuTuong: <LogOut size={CO} aria-hidden="true" />, keTren: true, onChon: doiSbd },
  ]
}
