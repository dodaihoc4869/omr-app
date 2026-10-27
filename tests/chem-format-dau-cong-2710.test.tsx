// DẤU CỘNG: TOÁN TỬ HAY ĐIỆN TÍCH + TRÌNH BÀY PHƯƠNG TRÌNH (thầy chụp 27/10, câu «Phản ứng nào dưới đây không thể hiện tính base của amine?»):
// phương án D hiện «ROH⁺N₂↑» — dấu cộng nối hai chất bị đọc thành điện tích. Sửa ở bộ phân tích chung ⇒ đúng cho cả app thầy, học sinh, phụ huynh, phiếu.
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { ChemText, parseChemText, type ChemPart } from '../src/lib/chem-format'
import { tachToanTuCongCe } from '../src/lib/chem-latex'
import { trinhBayChu } from '../src/lib/chem-trinh-bay' // nạp ⇒ tự cắm vào ChemText như màn làm bài HS

/** Dạng đọc được: `_{…}` chỉ số dưới, `^{…}` số mũ. */
const doc = (s: string) => parseChemText(s).map((p: ChemPart) => (p.t === 'sub' ? `_{${p.v}}` : p.t === 'sup' ? `^{${p.v}}` : p.t === 'text' ? p.v : `[${p.mui}]`)).join('')

describe('dấu cộng: toán tử hay điện tích', () => {
  it.each([
    ['RNH3+ + OH-', 'RNH_{3}^{+} + OH^{-}'],
    ['Fe3+ + 3RNH2', 'Fe^{3+} + 3RNH_{2}'],
    ['ROH + N2', 'ROH + N_{2}'],
    ['ROH+N2', 'ROH+N_{2}'],
    ['Na+', 'Na^{+}'],
    ['SO4 2-', 'SO_{4}^{2-}'],
    ['NH4+', 'NH_{4}^{+}'],
    ['2H+ + CO3 2-', '2H^{+} + CO_{3}^{2-}'],
    ['RNH2 + HNO2 → ROH + N2↑ + H2O', 'RNH_{2} + HNO_{2} → ROH + N_{2}↑ + H_{2}O'],
    ['RNH₂+HNO₂→ROH+N₂↑+H₂O.', 'RNH₂+HNO₂→ROH+N₂↑+H₂O.'],
    ['RNH₃+ + OH⁻', 'RNH₃^{+} + OH⁻'],
    ['C6H5NH3+', 'C_{6}H_{5}NH_{3}^{+}'],
    ['3NH4+ + OH-', '3NH_{4}^{+} + OH^{-}'],
    ['C6H5NH2+HCl→C6H5NH3Cl.', 'C_{6}H_{5}NH_{2}+HCl→C_{6}H_{5}NH_{3}Cl.'],
    ['CH3NH2+H2O⇌CH3NH3++OH-', 'CH_{3}NH_{2}+H_{2}O⇌CH_{3}NH_{3}^{+}+OH^{-}'],
    ['H2+3O2', 'H_{2}+3O_{2}'],
    ['Na+(aq)', 'Na^{+}(aq)'],
    ['[Ni(NH3)6]2+ được tạo thành', '[Ni(NH_{3})_{6}]^{2+} được tạo thành'],
    ['Na+ và Cl-', 'Na^{+} và Cl^{-}'],
    ['Cr2O7 2- + 14H+', 'Cr_{2}O_{7}^{2-} + 14H^{+}'],
  ])('%s', (vao, ra) => expect(doc(vao)).toBe(ra))

  it('không đoán bừa: câu văn «câu 2-3», ion một nguyên tố lạ, chỉ số hai chữ số kèm dấu', () => {
    expect(doc('Bài 2-3')).toBe('Bài 2-3')
    expect(doc('Cl3-')).toBe('Cl3-') // rác MathType, không phải ion có thật
    expect(doc('C2O42-')).toBe('C_{2}O42-') // `42-` cắt hai kiểu được ⇒ giữ nguyên như cũ
  })

  it('mhchem: `\\ce{ROH+N2}` nới thành toán tử, điện tích tường minh giữ nguyên', () => {
    expect(tachToanTuCongCe('RNH2+HNO2 -> ROH+N2 ^ + H2O')).toBe('RNH2 + HNO2 -> ROH + N2 ^ + H2O')
    expect(tachToanTuCongCe('Fe^{3+} + 3OH-')).toBe('Fe^{3+} + 3OH-')
    expect(tachToanTuCongCe('Na+(aq)')).toBe('Na+(aq)')
    const ve = (x: string) => katex.renderToString(`\\ce{${x}}`, { throwOnError: true })
    expect(ve(tachToanTuCongCe('ROH+N2'))).toBe(ve('ROH + N2')) // vẽ y như phương trình cách đều
    expect(ve('ROH+N2')).not.toBe(ve('ROH + N2')) // (mhchem trần đọc «+» là điện tích của ROH)
  })
})

describe('trình bày phương trình (app học sinh «Trong»)', () => {
  it('chuỗi không có gì cần bọc ⇒ trả nguyên chuỗi (DOM không đổi)', () => {
    expect(trinhBayChu('Phản ứng nào dưới đây')).toBe('Phản ứng nào dưới đây')
    expect(trinhBayChu('+3')).toBe('+3') // số oxi hoá đứng đầu: không chèn khoảng
  })

  it('đúng câu thầy chụp: toán tử dính liền có khoảng hẹp, ⇌ được bọc, «l» của Cl được bọc; chữ giữ nguyên', () => {
    const { container } = render(
      <div>
        <ChemText text="RNH₂+H₂O⇌RNH₃⁺+OH⁻." />|<ChemText text="C₆H₅NH₂+HCl→C₆H₅NH₃Cl." />|<ChemText text="RNH2+HNO2→ROH+N2↑+H2O." />
      </div>,
    )
    expect(container.textContent).toBe('RNH₂+H₂O⇌RNH₃⁺+OH⁻.|C₆H₅NH₂+HCl→C₆H₅NH₃Cl.|RNH2+HNO2→ROH+N2↑+H2O.')
    expect([...container.querySelectorAll('.ct-tt')].map((e) => e.textContent).join('')).toBe('+⇌++→+→++')
    expect(container.querySelectorAll('.ct-mt')).toHaveLength(3)
    expect([...container.querySelectorAll('.ct-l')].map((e) => e.parentElement?.textContent)).toEqual(['C₆H₅NH₂+HCl→C₆H₅NH₃Cl.', 'C₆H₅NH₂+HCl→C₆H₅NH₃Cl.'])
    expect(container.querySelectorAll('.ct-kh')).toHaveLength(1)
    expect(container.querySelector('sup')?.textContent).not.toBe('+') // ROH+N2: không còn điện tích giả
    expect(container.querySelectorAll('wbr').length).toBe(container.querySelectorAll('.ct-tt').length) // xuống dòng được sau toán tử
  })

  it('phương trình đã cách đều (`A + B → C`) không thêm khoảng; «Clo», «lời» không bọc «l»', () => {
    const { container } = render(<ChemText text="Clo + lời giải: Al + HCl → AlCl3" />)
    expect(container.querySelectorAll('.ct-tt')).toHaveLength(0)
    expect([...container.querySelectorAll('.ct-l')].map((e) => e.previousSibling?.textContent?.slice(-1))).toEqual(['A', 'C', 'A', 'C']) // Al, HCl, AlCl3
  })
})
