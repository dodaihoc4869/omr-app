// @vitest-environment node
// 31/10 19:20 (đo D1 thật): câu «nhớ / chuyển» của báo cáo A/B Hành trình 26,5 giây · 19,4 triệu dòng mỗi lần ⇒ D1 «overloaded», lưu bài thi hỏng.
// Giờ học tối 17:00–23:59 VN không chạy câu ấy (hanh-trinh-do-luong.ts `gioHocToiAB`).
import { expect, it } from 'vitest'
import { gioHocToiAB } from '../server/src/hanh-trinh-do-luong'

it('17:00–23:59 VN ⇒ tạm ẩn; 0:00–16:59 ⇒ tính như cũ', () => {
  const vn = (gio: string) => Date.parse(`2026-10-31T${gio}:00+07:00`)
  expect(gioHocToiAB(vn('19:20'))).toBe(true)
  expect(gioHocToiAB(vn('17:00'))).toBe(true)
  expect(gioHocToiAB(vn('23:59'))).toBe(true)
  expect(gioHocToiAB(vn('16:59'))).toBe(false)
  expect(gioHocToiAB(vn('00:30'))).toBe(false)
  expect(gioHocToiAB(vn('10:00'))).toBe(false)
})
