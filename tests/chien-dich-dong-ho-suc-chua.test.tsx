// SỬA CÓ CHỦ ĐÍCH 14/10: giữ kiểm phép tính và ngày giờ dùng chung; bỏ riêng đồng hồ của màn chiến dịch cũ.
import { describe, expect, it } from 'vitest'
import { conLai, hienHanNop, hienNgay } from '../src/components/chien-dich/ngay'

describe('ngày giờ một kiểu', () => {
  it('"23:59 · Chủ Nhật 04/10/2026", khoảng còn lại kèm mốc', () => {
    expect(hienHanNop('2026-10-04')).toBe('23:59 · Chủ Nhật 04/10/2026')
    expect(hienNgay('2026-10-06', false)).toBe('Thứ Ba 06/10')
    // 18:59 giờ Việt Nam ngày 03/10 ⇒ còn 1 ngày 5 giờ tới 23:59 ngày 04/10
    expect(conLai('2026-10-04', Date.UTC(2026, 9, 3, 11, 59, 59))).toBe('còn 1 ngày 5 giờ')
    expect(conLai('2026-10-04', Date.UTC(2026, 9, 4, 17, 0, 0))).toBe('đã hết hạn nộp')
  })
})
