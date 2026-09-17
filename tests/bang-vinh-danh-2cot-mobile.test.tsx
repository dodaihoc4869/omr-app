import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import BangVinhDanh from '../src/components/BangVinhDanh'

// Mock server URL and fetch
vi.mock('../src/lib/dia-chi-may-chu', () => ({
  layDiaChiMayChu: vi.fn().mockResolvedValue('http://localhost:3000'),
}))

describe('BangVinhDanh - 2 Cột Đồng Bộ & Thu Nhỏ Trên Điện Thoại', () => {
  it('Dựng layout 2 cột honors-split-2col với 3 ô tôn vinh học sinh', () => {
    const { container } = render(<BangVinhDanh vaiTro="hocsinh" />)
    const split2col = container.querySelector('.honors-split-2col')
    expect(split2col).not.toBeNull()

    const colLeft = container.querySelector('.honors-col-left')
    expect(colLeft).not.toBeNull()

    const colQuotes = container.querySelector('.honors-col-quotes')
    expect(colQuotes).not.toBeNull()

    const quoteCards = container.querySelectorAll('.honors-quote-card')
    expect(quoteCards.length).toBe(3)

    // Check semantic classes for mobile scaling
    expect(container.querySelectorAll('.honors-quote-badge').length).toBe(3)
    expect(container.querySelectorAll('.honors-quote-body').length).toBe(3)
    expect(container.querySelectorAll('.honors-quote-foot').length).toBe(3)
  })

  it('Dựng layout 2 cột honors-split-2col với thông tin và lời tri ân phụ huynh', () => {
    const { container } = render(
      <BangVinhDanh
        vaiTro="phuhuynh"
        hoTen="Đỗ Đại Học"
        sbd="12121212"
        lop="12A1"
        tongSoCa={7}
      />
    )
    const split2col = container.querySelector('.honors-split-2col')
    expect(split2col).not.toBeNull()

    const quoteCards = container.querySelectorAll('.honors-quote-card')
    expect(quoteCards.length).toBe(3)

    // Check parent specific elements
    const parentTitle = container.querySelector('.honors-parent-title')
    expect(parentTitle?.textContent).toContain('Chào Quý Phụ huynh')
    expect(parentTitle?.textContent).toContain('Đỗ Đại Học')

    const caPill = container.querySelector('.honors-ca-pill')
    expect(caPill?.textContent).toContain('7 ca')

    const sbdSubtag = container.querySelector('.honors-quote-subtag')
    expect(sbdSubtag?.textContent).toContain('12121212')
  })

  it('Không kích hoạt honors-split-2col khi vaiTro không có quote (ví dụ giáo viên)', () => {
    const { container } = render(<BangVinhDanh />)
    expect(container.querySelector('.honors-split-2col')).toBeNull()
    expect(container.querySelector('.honors-col-quotes')).toBeNull()
  })
})
