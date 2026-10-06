// Chữ "Con chọn … / Con bỏ trống …" ở màn Chi tiết ca của phụ huynh — tách ra để test được (thầy 06/10: "hiển thị những câu học sinh sai phải chính xác tuyệt đối").
// Lá: chỉ import kiểu + hàm phân loại thuần.
import type { CauXemLai } from './du-lieu'
import { loaiCauChuaDung } from '../loai-cau-chua-dung'

export function chuKetQuaCau(c: Pick<CauXemLai, 'phan' | 'dapAnChon' | 'dapAnDung' | 'laDungNhungLau'>): string {
  if (c.laDungNhungLau) return 'Con làm đúng nhưng lâu hơn thường lệ'
  const dung = c.dapAnDung ? ` · Đáp án đúng ${c.dapAnDung}` : ''
  // Bỏ trống nhận bằng `loaiCauChuaDung`: Phần II bỏ trống được ghi "----" (không rỗng) nên bản cũ in "Con chọn ----". Câu Phần II đúng một phần nói rõ.
  const loai = loaiCauChuaDung(c)
  if (loai === 'trong') return `Con bỏ trống${dung}`
  return `Con chọn ${c.dapAnChon}${loai === 'mot_phan' ? ' (đúng một phần)' : ''}${dung}`
}
