import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChemText, splitCeSegments } from '../src/lib/chem-format'

// LƯU Ý: luôn truyền text bằng {'...'} (chuỗi JS thật, dấu \\ thành 1 dấu \)
// chứ KHÔNG viết bare JSX attribute text="\\ce{...}" — thuộc tính JSX trần
// không xử lý escape như chuỗi JS, \\ sẽ giữ nguyên 2 dấu gạch chéo và làm
// sai cú pháp LaTeX khi test (đã từng dính lỗi này khi viết bộ test này).

describe('splitCeSegments — tách \\ce{...} và $...$ khỏi chữ thường xung quanh', () => {
  it('tách đúng 1 đoạn \\ce{} nằm giữa chữ thường', () => {
    expect(splitCeSegments('Ion tạo thành là \\ce{Ca^2+} trong nước.')).toEqual([
      { t: 'plain', text: 'Ion tạo thành là ' },
      { t: 'ce', latex: 'Ca^2+' },
      { t: 'plain', text: ' trong nước.' },
    ])
  })

  it('tách đúng nhiều đoạn \\ce{} liên tiếp cách nhau bởi chữ thường', () => {
    expect(splitCeSegments('\\ce{Ag+}/\\ce{Ag}')).toEqual([
      { t: 'ce', latex: 'Ag+' },
      { t: 'plain', text: '/' },
      { t: 'ce', latex: 'Ag' },
    ])
  })

  it('tách đúng đoạn $...$ (ký hiệu toán/lý ngoài mhchem)', () => {
    expect(splitCeSegments('Biết $E^\\circ_{Ni^{2+}/Ni}$ = -0,26 V')).toEqual([
      { t: 'plain', text: 'Biết ' },
      { t: 'math', latex: 'E^\\circ_{Ni^{2+}/Ni}' },
      { t: 'plain', text: ' = -0,26 V' },
    ])
  })

  it('văn bản không có \\ce{}/$...$ nào -> 1 đoạn plain duy nhất', () => {
    expect(splitCeSegments('Chất X là acetic acid')).toEqual([{ t: 'plain', text: 'Chất X là acetic acid' }])
  })
})

describe('ChemText — render mhchem bằng KaTeX (6 ca theo yêu cầu: chỉ số dưới, điện tích, mũi tên thuận nghịch, xúc tác, trạng thái chất, kết tủa)', () => {
  const katexHtml = (text: string) => render(<ChemText text={text} />).container.innerHTML

  it('chỉ số dưới: \\ce{H2SO4}', () => {
    const html = katexHtml('\\ce{H2SO4}')
    expect(html).toContain('katex')
    expect(html).not.toContain('decoration-wavy') // không rơi vào nhánh lỗi
  })

  it('điện tích: \\ce{SO4^2-}', () => {
    const html = katexHtml('\\ce{SO4^2-}')
    expect(html).toContain('katex')
    expect(html).not.toContain('decoration-wavy')
  })

  it('mũi tên thuận nghịch: \\ce{CO2 + H2O <=> H2CO3}', () => {
    const html = katexHtml('\\ce{CO2 + H2O <=> H2CO3}')
    expect(html).toContain('katex')
    expect(html).not.toContain('decoration-wavy')
  })

  it('xúc tác/điều kiện: \\ce{N2 + 3H2 ->[Fe][t^\\circ] 2NH3}', () => {
    const html = katexHtml('\\ce{N2 + 3H2 ->[Fe][t^\\circ] 2NH3}')
    expect(html).toContain('katex')
    expect(html).not.toContain('decoration-wavy')
  })

  it('trạng thái chất: \\ce{CaCO3(s) -> CaO(s) + CO2(g)}', () => {
    const html = katexHtml('\\ce{CaCO3(s) -> CaO(s) + CO2(g)}')
    expect(html).toContain('katex')
    expect(html).not.toContain('decoration-wavy')
  })

  it('kết tủa: \\ce{AgNO3 + NaCl -> AgCl v + NaNO3}', () => {
    const html = katexHtml('\\ce{AgNO3 + NaCl -> AgCl v + NaNO3}')
    expect(html).toContain('katex')
    expect(html).not.toContain('decoration-wavy')
  })

  it('ký hiệu toán/lý ngoài mhchem: $\\Delta_f H^\\circ_{298}$', () => {
    const html = katexHtml('$\\Delta_f H^\\circ_{298}$')
    expect(html).toContain('katex')
    expect(html).not.toContain('decoration-wavy')
  })

  it('trộn cú pháp CŨ (tự suy chỉ số dưới) và MỚI (\\ce{}) trong cùng 1 chuỗi, không cần chuyển hết dữ liệu cũ', () => {
    const html = katexHtml('Cho H2SO4 tác dụng tạo ion \\ce{SO4^2-}')
    expect(html).toContain('<sub>2</sub>') // "H2SO4" cũ vẫn ra chỉ số dưới bằng <sub>
    expect(html).toContain('katex') // "\\ce{SO4^2-}" mới render bằng KaTeX
  })

  it('công thức lỗi cú pháp -> hiện nguyên văn kèm cảnh báo, KHÔNG làm sập trang, KHÔNG để trắng', () => {
    // Macro không tồn tại trong KaTeX -> chắc chắn ném ParseError.
    const { container } = render(<ChemText text={'\\ce{\\khongtontai{Ca}}'} />)
    expect(container.innerHTML.length).toBeGreaterThan(0)
    expect(container.textContent).toContain('\\ce{\\khongtontai{Ca}}')
    expect(container.innerHTML).toContain('decoration-wavy')
  })
})
