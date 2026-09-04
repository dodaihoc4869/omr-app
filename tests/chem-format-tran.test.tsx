import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChemText } from '../src/lib/chem-format'

describe('công thức dài không được cắt cụt', () => {
  it('phương trình phản ứng thành khối riêng cuộn ngang được', () => {
    const { container } = render(<ChemText text={'$\\ce{HCOOCH3 + NaOH -> HCOONa + CH3OH}$'} />)
    const khoi = container.querySelector('.ct-dai') as HTMLElement | null
    expect(khoi).not.toBeNull()
    expect(khoi!.style.display).toBe('block')
    expect(khoi!.style.overflowX).toBe('auto')
  })

  it('công thức MỘT CHẤT vẫn nằm trong dòng chữ, không tách khối', () => {
    const { container } = render(<ChemText text={'Ester $\\ce{CH3COOC2H5}$ thuỷ phân'} />)
    expect(container.querySelector('.ct-dai')).toBeNull()
  })

  it('khối cuộn có đệm trên dưới để không cắt mất chỉ số', () => {
    const { container } = render(<ChemText text={'$\\ce{CH3COOC2H5 + NaOH -> CH3COONa + C2H5OH}$'} />)
    const khoi = container.querySelector('.ct-dai') as HTMLElement
    expect(khoi.style.padding).toContain('6px')
    expect(khoi.style.overflowY).toBe('hidden')
  })
})
