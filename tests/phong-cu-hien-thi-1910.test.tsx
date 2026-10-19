// THẦY 19/10: ChemText (màn thi, thẻ câu, game…) sửa nhãn xen kẽ ngay vòng vẽ đầu — không chữ rác, chuỗi thường vẽ như cũ.
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { ChemText } from '../src/lib/chem-format'

afterEach(cleanup)
const DE = 'CO₂ + H₂O chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎→(C₆H₁₀O₅)ₙ + O₂'

describe('ChemText với nhãn mũi tên xen kẽ', () => {
  it('vẽ nhãn TRÊN "ánh sáng" và DƯỚI "chất diệp lục (chlorophyll)" ngay vòng vẽ đầu, không chữ rác', () => {
    const { container } = render(<ChemText text={DE} />)
    expect(container.textContent).toContain('ánh sáng')
    expect(container.textContent).toContain('chất diệp lục (chlorophyll)')
    expect(container.textContent).not.toMatch(/chÊt|¸|ⁿ|gorophyll₎/)
    expect(container.querySelector('.mt-phai')).not.toBeNull()
  })
  it('chữ thường có số mũ 10ⁿ vẫn vẽ như cũ', () => {
    const { container } = render(<ChemText text="Nồng độ 10ⁿ mol/L và Fe²⁺ + OH⁻" />)
    expect(container.textContent).toContain('10')
    expect(container.textContent).toContain('mol/L')
  })
  it('đổi chữ giữa hai câu: không hiện nhãn của câu trước', () => {
    const { container, rerender } = render(<ChemText text={DE} />)
    expect(container.textContent).toContain('ánh sáng')
    rerender(<ChemText text="Phản ứng thuỷ phân ester trong môi trường acid" />)
    expect(container.textContent).toContain('Phản ứng thuỷ phân')
    expect(container.textContent).not.toContain('ánh sáng')
  })
})
