// Ô SỐ TRONG GOOGLE SHEET KHÔNG ĐƯỢC LÀM TRẮNG MÀN.
//
// Thầy quay màn hình: Mở ca kiểm tra → gõ Lớp "12" → chọn "Chọn từng em" →
// "Đang tải danh sách…" → MÀN TRẮNG. Nguyên nhân: máy chủ trả SBD và lớp là
// SỐ (sheet lưu 12000, 12), còn màn gọi `r.lop.trim()` — số không có .trim()
// nên ném TypeError giữa lúc render, React gỡ cả cây, app trắng.
//
// Hai lớp chắn, test cả hai:
//   1. `chuoi()` ép mọi trường chữ về string ngay tại cửa API.
//   2. `ChanLoi` bắt lỗi render, hiện màn báo lỗi có đường quay lại — không trắng.
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { chuoi } from '../src/lib/exam-api'
import ChanLoi from '../src/components/ChanLoi'

describe('chuoi() — ép ô sheet về chuỗi', () => {
  it('số thành chuỗi, gọi được .trim()', () => {
    expect(chuoi(12000)).toBe('12000')
    expect(chuoi(12).trim()).toBe('12')
    expect(chuoi(2009).toLowerCase()).toBe('2009')
  })

  it('null/undefined thành chuỗi rỗng, KHÔNG thành "null"/"undefined"', () => {
    expect(chuoi(null)).toBe('')
    expect(chuoi(undefined)).toBe('')
  })

  it('chuỗi giữ nguyên, kể cả chuỗi rỗng', () => {
    expect(chuoi('Đỗ Đại Học')).toBe('Đỗ Đại Học')
    expect(chuoi('')).toBe('')
  })

  // Đúng phép so sánh mà màn Mở ca chạy trên từng em.
  it('lọc theo lớp và sắp theo tên chạy được với dữ liệu kiểu số', () => {
    const tho = [
      { sbd: 12000, hoTen: 'Hoàng Thị Kim Ngân', lop: 12 },
      { sbd: 12121212, hoTen: 'Đỗ Đại Học', lop: 'GV' },
      { sbd: 11025, hoTen: null, lop: 11 },
    ]
    const nguon = tho.map((r) => ({ sbd: chuoi(r.sbd), hoTen: chuoi(r.hoTen), lop: chuoi(r.lop) }))
    const lop = '12'
    const loc = nguon.filter((r) => r.sbd && (!lop.trim() || !r.lop || r.lop.trim() === lop.trim()))
    expect(loc.map((r) => r.sbd)).toEqual(['12000'])
    expect(() => nguon.sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi'))).not.toThrow()
  })
})

function Vo(): React.ReactElement {
  throw new Error('r.lop.trim is not a function')
}

describe('ChanLoi — lỗi render không còn ra màn trắng', () => {
  it('hiện tên màn, thông báo lỗi và nút quay lại thay vì trắng', () => {
    const im = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ve = vi.fn()
    render(
      <ChanLoi o="Mở ca kiểm tra" veManChinh={ve}>
        <Vo />
      </ChanLoi>,
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(/Mở ca kiểm tra gặp lỗi/)).toBeTruthy()
    expect(screen.getByText(/r\.lop\.trim is not a function/)).toBeTruthy()
    screen.getByText('Về màn chính').click()
    expect(ve).toHaveBeenCalled()
    im.mockRestore()
  })

  it('không lỗi thì dựng nguyên nội dung, không xen gì vào', () => {
    render(
      <ChanLoi o="Ca thi">
        <div>Danh sách ca</div>
      </ChanLoi>,
    )
    expect(screen.getByText('Danh sách ca')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
