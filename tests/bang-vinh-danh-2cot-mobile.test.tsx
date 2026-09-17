import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import BangVinhDanh from '../src/components/BangVinhDanh'

// Mock server URL and fetch
vi.mock('../src/lib/dia-chi-may-chu', () => ({
  layDiaChiMayChu: vi.fn().mockResolvedValue('http://localhost:3000'),
}))

describe('BangVinhDanh - Tối Giản Nhỏ Gọn & Đồng Bộ', () => {
  it('Dựng bảng vinh danh nhỏ gọn với header và không còn quote ngạn ngữ', () => {
    const { container } = render(<BangVinhDanh vaiTro="hocsinh" />)
    expect(container.querySelector('.honors')).not.toBeNull()
    expect(container.querySelector('.honors-heading')).not.toBeNull()
    // Không còn 3 ô quote ngạn ngữ
    expect(container.querySelector('.honors-split-2col')).toBeNull()
    expect(container.querySelector('.honors-col-quotes')).toBeNull()
    expect(container.querySelectorAll('.honors-quote-card').length).toBe(0)
  })

  it('Dựng bảng vinh danh đồng bộ cho phụ huynh không còn quotes', () => {
    const { container } = render(
      <BangVinhDanh
        vaiTro="phuhuynh"
        hoTen="Đỗ Đại Học"
        sbd="12121212"
        lop="12A1"
        tongSoCa={7}
      />
    )
    expect(container.querySelector('.honors')).not.toBeNull()
    expect(container.querySelector('.honors-split-2col')).toBeNull()
    expect(container.querySelector('.honors-col-quotes')).toBeNull()
  })

  it('Dựng bảng vinh danh cho giáo viên đồng bộ', () => {
    const { container } = render(<BangVinhDanh vaiTro="giaovien" />)
    expect(container.querySelector('.honors')).not.toBeNull()
    expect(container.querySelector('.honors-heading h2')?.textContent).toBe('Bảng vinh danh')
  })
})
