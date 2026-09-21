// MÔ HÌNH "BẢNG GIÁ EXP HỌC TẬP" — khoá LÝ DO của bảng giá mới (Điều 10 của `DE-XUAT-THAN-THU-MOI-NGAY-2109.md`; Code 1, 21/09/2026). THUẦN.
//
// Bất biến cần giữ: em nào ĐẠT nhiệm vụ ngày MỖI ngày và chơi thú đều đặn thì kiếm đủ 200 EXP/ngày dù học yếu (đúng 50 %), nên thú ăn no 200 mỗi ngày và tới cấp 10 ĐÚNG ngày 21 (4 200 / 200).
// Bảng CŨ không làm được: thưởng nghiêng về câu đúng ⇒ em yếu-mà-chăm chỉ kiếm ~165 EXP/ngày, mất ~27 ngày. Không tính lại sổ cũ; chỉ dùng để chứng minh nên đổi bảng giá và để phát hiện ai lỡ tay hạ lại.
//
// Số liệu mỗi ngày của ba kiểu em (Boss cung cấp): game (kẹp 120), câu đúng, lên bậc, khắc phục — là số EXP kiếm được trong ngày ở từng nguồn. Chặng đúng nhịp 5/7 số ngày; chuỗi ngày đạt 2 × min(chuỗi, 10).
import { hapThu } from './hap-thu-ngay'
import { HAP_THU_DAT, TRAN_EXP_GAME_NGAY } from './hap-thu-ngay'

export interface KieuEm { ten: string; game: number; cau: number; lenBac: number; khacPhuc: number }
export const KIEU_EM: readonly KieuEm[] = [
  { ten: 'Yếu mà chăm (đúng 50 %)', game: 70, cau: 15, lenBac: 18, khacPhuc: 15 },
  { ten: 'Trung bình, chăm (đúng 70 %)', game: 105, cau: 30, lenBac: 12, khacPhuc: 9 },
  { ten: 'Giỏi, chăm (đúng 90 %)', game: 140, cau: 58, lenBac: 6, khacPhuc: 3 },
]

export interface BangGiaExp {
  ten: string
  /** Đạt nhiệm vụ ngày. */
  datNgay: number
  /** Xong chặng bài tập về nhà đúng nhịp. */
  loDungNhip: number
  /** Câu đúng đầu tiên trong ngày (chỉ bảng mới; KHÔNG tính vào trần game 120). */
  dauNgay: number
}
export const BANG_GIA_CU: BangGiaExp = { ten: 'cũ (trước 22/09)', datNgay: 20, loDungNhip: 10, dauNgay: 0 }
export const BANG_GIA_MOI: BangGiaExp = { ten: 'mới (từ 22/09)', datNgay: 80, loDungNhip: 20, dauNgay: 10 }

/** Chặng đúng nhịp xảy ra 5 trong 7 ngày (ngày 1…5 của mỗi tuần). */
export const coChangDungNhip = (ngay: number): boolean => ((ngay - 1) % 7) < 5
/** Thưởng chuỗi ngày đạt liên tiếp: 2 × số ngày, tối đa 20 (chuỗi = số ngày đạt liền tới hôm nay). */
export const thuongChuoi = (chuoi: number): number => 2 * Math.min(Math.max(0, Math.floor(chuoi)), 10)

/** EXP kiếm trong MỘT ngày của em `kieu` (ngày đạt liên tiếp thứ `ngay`, tính từ 1) theo `bang`. Game bị kẹp 120/ngày (Điều 9). */
export function expMotNgay(kieu: KieuEm, bang: BangGiaExp, ngay: number): number {
  return Math.min(kieu.game, TRAN_EXP_GAME_NGAY) + kieu.cau + kieu.lenBac + kieu.khacPhuc + bang.datNgay + bang.dauNgay + (coChangDungNhip(ngay) ? bang.loDungNhip : 0) + thuongChuoi(ngay)
}

/** Ngày đầu tiên thú tới cấp `capMuc` khi em đạt MỌI ngày, kiếm theo `bang` và thú hấp thụ tối đa 200/ngày qua cổng `hapThu`; 0 nếu chưa tới trong `toiDaNgay`. */
export function ngayToiCap(kieu: KieuEm, bang: BangGiaExp, capMuc = 10, toiDaNgay = 90): number {
  let h = { cap: 1, exp: 0, wallet: 0 } as { cap: number; exp: number; wallet: number; hapThu?: { ngay: string; da: number } }
  for (let d = 1; d <= toiDaNgay; d++) {
    h = { ...h, wallet: h.wallet + expMotNgay(kieu, bang, d) }
    h = hapThu(h, Number.POSITIVE_INFINITY, `n${d}`, HAP_THU_DAT).hoSo
    if (h.cap >= capMuc) return d
  }
  return 0
}
