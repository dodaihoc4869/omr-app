// Mở ca kiểm tra · «Em đã điểm danh hôm nay» (thầy 23/10).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { emDiemDanhHomNay, ngayVnCuaMoc } from '../src/lib/chon-em-diem-danh'

// 23/10/2026 18:00 giờ Việt Nam = 11:00 UTC
const NAY = Date.parse('2026-10-23T11:00:00Z')

describe('emDiemDanhHomNay', () => {
  it('lấy buổi HÔM NAY theo giờ Việt Nam, bỏ buổi tối hôm qua', () => {
    const kq = emDiemDanhHomNay([
      { lop: '12A', moLuc: '2026-10-23T10:30:00Z', coMat: ['3', '1'] },
      { lop: '12A', moLuc: '2026-10-22T12:00:00Z', coMat: ['9'] }, // 19:00 VN 22/10
    ], '', NAY)
    expect(kq).toEqual({ sbd: ['1', '3'], soBuoi: 1, dungLop: false })
  })
  it('00:30 VN (17:30 UTC hôm trước) vẫn là hôm nay', () => {
    expect(ngayVnCuaMoc('2026-10-22T17:30:00Z')).toBe('2026-10-23')
    expect(ngayVnCuaMoc('hỏng')).toBe('')
  })
  it('có buổi đúng lớp ca ⇒ chỉ lấy lớp ấy (không phân biệt hoa thường, khoảng trắng)', () => {
    const kq = emDiemDanhHomNay([
      { lop: '12 Nhóm 10 điểm', moLuc: '2026-10-23T10:00:00Z', coMat: ['1', '2'] },
      { lop: '11A', moLuc: '2026-10-23T09:00:00Z', coMat: ['5'] },
    ], ' 12 nhóm 10 điểm ', NAY)
    expect(kq).toEqual({ sbd: ['1', '2'], soBuoi: 1, dungLop: true })
  })
  it('không buổi nào đúng lớp ⇒ gộp mọi buổi hôm nay, bỏ trùng', () => {
    const kq = emDiemDanhHomNay([
      { lop: '12A', moLuc: '2026-10-23T10:00:00Z', coMat: ['1', '2'] },
      { lop: '11A', moLuc: '2026-10-23T09:00:00Z', coMat: ['2', '5', ' '] },
    ], 'Lớp khác', NAY)
    expect(kq).toEqual({ sbd: ['1', '2', '5'], soBuoi: 2, dungLop: false })
  })
  it('hôm nay chưa có buổi ⇒ rỗng', () => {
    expect(emDiemDanhHomNay([], '12A', NAY)).toEqual({ sbd: [], soBuoi: 0, dungLop: false })
  })
})

describe('màn Mở ca có lựa chọn «Em đã điểm danh hôm nay»', () => {
  const src = readFileSync('src/screens/ExamSetupScreen.tsx', 'utf8')
  it('chip ở hàng «Ai được vào» + nút trong hộp chọn em, nạp lệnh điểm danh khi bấm (không tải sẵn)', () => {
    expect(src).toContain('Em đã điểm danh hôm nay')
    expect(src).toContain('Chọn em đã điểm danh hôm nay')
    expect(src).toMatch(/import\('\.\.\/lib\/buoi-hoc-api'\)/)
    expect(src).not.toMatch(/^import .*buoi-hoc-api/m)
  })
})
