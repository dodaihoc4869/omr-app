// Bình Phản Ứng — lưới tên trên bảng chiếu (thầy 07/11: 68 em thì 3 hàng tràn xuống thanh phím, chữ chồng nhau; mỗi ô phải hiện đủ tên gọi).
import { describe, expect, it } from 'vitest'
import { DAY_LUOI, DINH_LUOI, KHE, RONG_LUOI, boLuoi, tenGoiLop } from '../src/lib/bpu/luoi'
import { kepGiay } from '../server/src/phong-binh-phan-ung'

describe('lưới tên', () => {
  it('mọi sĩ số 1–120: lưới nằm gọn trong dải, đủ ô, ô đủ rộng cho tên gọi', () => {
    for (let n = 1; n <= 120; n++) {
      const L = boLuoi(n)
      expect(L.cot * L.hang).toBeGreaterThanOrEqual(n)
      expect(L.top).toBeGreaterThanOrEqual(DINH_LUOI)
      expect(L.top + L.hang * L.h + (L.hang - 1) * KHE).toBeLessThanOrEqual(DAY_LUOI)
      expect(L.cot * L.w + (L.cot - 1) * KHE).toBeLessThanOrEqual(RONG_LUOI + 0.01)
      if (n <= 100) { expect(L.w).toBeGreaterThanOrEqual(64); expect(L.h).toBeGreaterThanOrEqual(40) }
    }
    const L68 = boLuoi(68)
    expect(L68.w).toBeGreaterThan(85) // «Nguyên» không bị cắt ở lớp 68 em
  })
  it('tên gọi: chữ cuối; trùng thì hai chữ cuối; vẫn trùng thì thêm số', () => {
    const m = tenGoiLop([
      { sbd: 'a', ten: 'Đỗ Đại Học' }, { sbd: 'b', ten: 'Trần Thảo Nguyên' },
      { sbd: 'c', ten: 'Nguyễn Minh Anh' }, { sbd: 'd', ten: 'Lê Ngọc Anh' },
      { sbd: 'e', ten: 'Phạm Bảo Châu' }, { sbd: 'f', ten: 'Võ Bảo Châu' }, { sbd: 'g', ten: '' },
    ])
    expect(m.get('a')).toBe('Học')
    expect(m.get('b')).toBe('Nguyên')
    expect(m.get('c')).toBe('Minh Anh')
    expect(m.get('d')).toBe('Ngọc Anh')
    expect(m.get('e')).toBe('Bảo Châu 5')
    expect(m.get('f')).toBe('Bảo Châu 6')
    expect(m.get('g')).toBe('g')
  })
})

describe('giờ mỗi câu', () => {
  it('kẹp 60–180 giây; không có ⇒ 90', () => {
    expect(kepGiay(30)).toBe(60)
    expect(kepGiay(135)).toBe(135)
    expect(kepGiay(400)).toBe(180)
    expect(kepGiay(undefined)).toBe(90)
    expect(kepGiay('abc')).toBe(90)
  })
})
