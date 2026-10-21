// DÒNG TÓM TẮT CÁCH RA ĐỀ — màn Mở ca (thầy chốt 21/10).
//
// Hàm thuần, nhận ĐÚNG các giá trị màn Mở ca gửi lên máy chủ lúc bấm Mở ca
// (chuan2026, deRieng, lenBang, phamViHoiLai, soCau), để dòng chữ thầy đọc
// không thể lệch với thứ ca thật sự chạy. Không suy lại từ nút đang bấm.
import type { SoCauPhan } from './rut-de'

export interface DauVaoChuCach {
  chuan2026: boolean
  deRieng: boolean
  lenBang: boolean
  phamViHoiLai?: 'gan_nhat' | 'ba_ca' | 'khong' | 'da_dung'
  /** Số câu mỗi em; undefined = lấy trọn đề. */
  soCau?: SoCauPhan
  caChot?: boolean
}

const so = (s: SoCauPhan) => `${s.I} · ${s.II} · ${s.III}`

export function chuCachRaDe(x: DauVaoChuCach): string {
  if (x.chuan2026) return 'Cả lớp cùng một đề · Chuẩn Bộ 2026 (18 · 4 · 6 theo ma trận)'
  if (x.phamViHoiLai === 'da_dung') return `Kiểm chứng câu đã đúng · mỗi em một bộ riêng${x.soCau ? ` (${so(x.soCau)})` : ''}`
  if (x.lenBang) return `Kiểm tra điểm yếu · mỗi em một bộ riêng${x.soCau ? ` (${so(x.soCau)})` : ''}`
  if (x.deRieng) {
    const cauSai = x.phamViHoiLai === 'khong' ? '100% câu mới' : 'có câu chữa lỗi (tối đa 30% mỗi phần)'
    return `Đề riêng từng em · ${cauSai}${x.soCau ? ` · ${so(x.soCau)}` : ''}`
  }
  if (x.caChot) return `Cả lớp cùng một đề · bộ câu ca chốt${x.soCau ? ` · ${so(x.soCau)} câu` : ''}`
  if (x.soCau) return `Cả lớp cùng một đề · rút ${so(x.soCau)} câu`
  return 'Cả lớp cùng một đề · trọn đề'
}
