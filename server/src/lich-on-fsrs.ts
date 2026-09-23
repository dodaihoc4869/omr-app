// FSRS-6 (ts-fsrs 5.4.2): lịch theo ngày VN, replay từ sổ gốc, không lưu state mới vào D1.
import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'

/** Đổi cấu hình này phải tăng PHIEN_BAN_KE_HOACH để dựng lại hồ sơ đã lưu. */
export const CAU_HINH_FSRS = Object.freeze({ request_retention: 0.9, enable_fuzz: false, enable_short_term: false })
export interface LichOnFsrs {
  card: Card
  truocNgay: Card
  ngay: string
  daSai: boolean
  lucDauNgay: number
}
export const ngayVnFsrs = (ms: number): string => new Date(ms + 7 * 3_600_000).toISOString().slice(0, 10)

/** Một quan sát/ngày: có sai thì dùng Again trên state đầu ngày; Good lặp không tăng mốc.
 * Bỏ trống không gọi hàm này. Không suy luận Easy/Hard từ tốc độ. */
export function taoLichOnFsrs(retention: number = CAU_HINH_FSRS.request_retention) {
  if (!Number.isFinite(retention) || retention <= 0 || retention >= 1) throw new RangeError('Mức nhớ FSRS phải nằm giữa 0 và 1')
  const scheduler = fsrs({ ...CAU_HINH_FSRS, request_retention: retention })
  return (cu: LichOnFsrs | undefined, luc: number, ketQua: 0 | 1): LichOnFsrs => {
    const ngay = ngayVnFsrs(luc)
    if (cu?.ngay === ngay && (cu.daSai || ketQua === 1)) return cu
    const cungNgay = cu?.ngay === ngay
    const truocNgay = (cungNgay && cu ? cu.truocNgay : cu?.card) ?? createEmptyCard<Card>(new Date(luc))
    const lucDauNgay = cungNgay && cu ? cu.lucDauNgay : luc
    const card = scheduler.next(truocNgay, new Date(lucDauNgay), ketQua === 0 ? Rating.Again : Rating.Good).card
    return { card, truocNgay, ngay, daSai: ketQua === 0, lucDauNgay }
  }
}
