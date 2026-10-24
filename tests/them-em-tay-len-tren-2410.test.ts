// «Thêm em tay» (thầy 24/10: "Mục điểm danh thêm em tay ko bấm đc"): khung thêm em từng nằm CUỐI trang, dưới lưới tên dài —
// bấm nút xong không thấy gì (Chromium thật: điện thoại khung ở y = 1506 px, ngoài màn). Nay khung mở NGAY DƯỚI hàng nút,
// tự cuộn vào tầm mắt và đặt con trỏ vào ô tìm. Kiểm bằng Chromium: scripts/kiem-them-em-2410/bam.mjs.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('khung «Thêm em tay» mở ngay dưới nút', () => {
  const b1 = readFileSync('src/components/day-hoc/Buoc1DiemDanh.tsx', 'utf8')
  const dd = readFileSync('src/components/day-hoc/DiemDanhBuoi.tsx', 'utf8')
  it('Buoc1DiemDanh vẽ {khoiThem} đúng một lần, TRƯỚC khối mã buổi / lưới em', () => {
    expect(b1.match(/\{khoiThem\}/g)).toHaveLength(1)
    expect(b1.indexOf('{khoiThem}')).toBeLessThan(b1.indexOf('{dangTaiBuoi ? ('))
    expect(b1.indexOf('{khoiThem}')).toBeGreaterThan(b1.indexOf('Thêm em tay'))
  })
  it('mở khung ⇒ cuộn vào tầm mắt + con trỏ vào ô tìm', () => {
    expect(dd).toMatch(/scrollIntoView\?\.\(\{ block: 'nearest'/)
    expect(dd).toMatch(/querySelector<HTMLInputElement>\('input\.dh-tim'\)\?\.focus/)
  })
})
