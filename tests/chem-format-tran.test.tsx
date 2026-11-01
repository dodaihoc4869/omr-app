import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChemText } from '../src/lib/chem-format'

describe('công thức dài không được cắt cụt', () => {
  it('phương trình dài TỰ XUỐNG DÒNG ở «+» / mũi tên (thầy 01/11), không bị cắt, không phải cuộn ngang', () => {
    const { container } = render(<ChemText text={'$\\ce{HCOOCH3 + NaOH -> HCOONa + CH3OH}$'} />)
    const khoi = container.querySelector('.ct-ngat') as HTMLElement | null
    expect(khoi).not.toBeNull()
    expect(khoi!.style.flexWrap).toBe('wrap')
    expect(khoi!.children).toHaveLength(4) // HCOOCH3 · + NaOH · → HCOONa · + CH3OH
  })

  it('công thức MỘT CHẤT vẫn nằm trong dòng chữ, không tách khối', () => {
    const { container } = render(<ChemText text={'Ester $\\ce{CH3COOC2H5}$ thuỷ phân'} />)
    expect(container.querySelector('.ct-dai')).toBeNull()
  })

  it('khối cuộn (phương trình không tách được cụm) có đệm trên dưới để không cắt mất chỉ số', () => {
    const { container } = render(<ChemText text={'$\\ce{(CH3COO)3C3H5 + 3NaOH(dung dịch đặc nóng)->[t^o](CH3COONa)}$'} />)
    const khoi = container.querySelector('.ct-dai') as HTMLElement
    expect(khoi.style.padding).toContain('6px')
    expect(khoi.style.overflowY).toBe('hidden')
  })
})
