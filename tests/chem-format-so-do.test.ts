// Sơ đồ chuyển hoá, nhãn mũi tên, tách dòng — mẫu lấy từ câu THẬT trong kho đề
// (thầy chụp câu DH-12-C2-B6 III.16 ngày 28/09).
import { describe, expect, it } from 'vitest'
import { tachMuiTen, parseChemText } from '../src/lib/chem-format'
import { gomTuCongThuc, nhanTruocMuiTenVeSau, tachDongSoDo } from '../src/lib/chem-format-so-do'
import { chuHtml } from '../src/lib/html-phieu'

const muis = (s: string) => tachMuiTen(s).filter((k) => k.t === 'mui') as { tren: string; duoi: string }[]
const chus = (s: string) =>
  tachMuiTen(s)
    .filter((k) => k.t === 'chu')
    .map((k) => (k as { v: string }).v)
    .join('|')

describe('nhãn mũi tên — ngoặc sau mũi tên KHÔNG phải lúc nào cũng là điều kiện', () => {
  it('câu thầy chụp: số hiệu mũ đặt trước mũi tên → lên trên thân mũi tên; (C₆H₁₀O₅)ₙ là chất', () => {
    const s = 'CO₂ ⁽¹⁾→ (C₆H₁₀O₅)ₙ ⁽²⁾→ C₆H₁₂O₆ ⁽³⁾→ C₂H₅OH ⁽⁴⁾→CH₃COOH'
    expect(muis(s).map((m) => m.tren)).toEqual(['(1)', '(2)', '(3)', '(4)'])
    expect(muis(s).every((m) => m.duoi === '')).toBe(true)
    expect(chus(s)).toContain('(C₆H₁₀O₅)ₙ')
    expect(chus(s)).toContain('CH₃COOH')
  })
  it('số hiệu thường đặt trước mũi tên: "CO₂ (1) → (C₆H₁₀O₅)ₙ (2) → …"', () => {
    const s = 'CO₂ (1) → (C₆H₁₀O₅)ₙ (2) → C₆H₁₂O₆ (3) → C₂H₅OH (4) → CH₃COOH'
    expect(muis(s).map((m) => m.tren)).toEqual(['(1)', '(2)', '(3)', '(4)'])
    expect(chus(s)).toContain('(C₆H₁₀O₅)ₙ')
  })
  it('"→(1) (C₆H₁₀O₅)ₙ": nhãn (1) dính liền, ngoặc sau dấu cách KHÔNG thành nhãn dưới', () => {
    const m = muis('CO₂ →(1) (C₆H₁₀O₅)ₙ →(2) C₆H₁₂O₆')
    expect(m[0]).toEqual(expect.objectContaining({ tren: '(1)', duoi: '' }))
  })
  it('"→((1))" ngoặc kép', () => {
    const m = muis('CO₂ →((1)) (C₆H₁₀O₅)ₙ →((2)) C₆H₁₂O₆')
    expect(m.map((x) => [x.tren, x.duoi])).toEqual([
      ['(1)', ''],
      ['(2)', ''],
    ])
  })
  it('sản phẩm bắt đầu bằng ngoặc có chỉ số: phức, muối nhóm', () => {
    expect(muis('Cu(OH)₂ + 4C₂H₅NH₂ → [Cu(C₂H₅NH₂)₄](OH)₂')[0]).toEqual(expect.objectContaining({ tren: '', duoi: '' }))
    expect(muis('2CH₃NH₂ + H₂SO₄ → (CH₃NH₃)₂SO₄')[0].tren).toBe('')
    expect(muis('[C₆H₇O₂(OH)₃]n + 3nHNO₃ →(C₆H₇O₂(ONO₂)₃)ₙ + 3nH₂O')[0].tren).toBe('')
    expect(muis('CoCl₂ ⇌ [CoCl₄]²⁻')[0].tren).toBe('')
  })
  it('dãy thứ tự ở phương án "(1) → (3) → (2)" không bị hút thành nhãn', () => {
    expect(muis('(1) → (3) → (2) → (5) → (4)').every((m) => !m.tren && !m.duoi)).toBe(true)
    expect(nhanTruocMuiTenVeSau('(1) → (3) → (2)')).toBe('(1) → (3) → (2)')
  })
  it('lời giải "pH = 13 → pOH = 1 → [OH⁻] = 0,1 M" — [OH⁻] không lên mũi tên', () => {
    expect(muis('pH = 13 → pOH = 1 → [OH⁻] = 0,1 M').every((m) => !m.tren)).toBe(true)
  })
  it('điều kiện thật vẫn lên trên/dưới: t°, enzyme, hai nhãn, nhãn có phức', () => {
    expect(muis('C₆H₁₂O₆ →(enzyme) 2C₂H₅OH')[0].tren).toBe('enzyme')
    expect(muis('Cellulose →(+H₂O)[acid, t°] X')[0]).toEqual(expect.objectContaining({ tren: '+H₂O', duoi: 'acid, t°' }))
    expect(muis('X →(+[Ag(NH₃)₂]OH)[t°] Y')[0]).toEqual(expect.objectContaining({ tren: '+[Ag(NH₃)₂]OH', duoi: 't°' }))
    expect(muis('X →(Ca(OH)₂) Y')[0].tren).toBe('Ca(OH)₂')
    expect(muis('CH₃COOH + C₂H₅OH ⇌(H₂SO₄ đặc, t°) CH₃COOC₂H₅ + H₂O')[0].tren).toBe('H₂SO₄ đặc, t°')
    expect(muis('A ->[t^o] B')[0].tren).toBe('t°')
  })
  it('mũi tên dài kiểu PDF "—(O₂, t°, xt)→", "—t°→", "--enzyme→" → nhãn trên mũi tên', () => {
    expect(muis('NH₃ —(O₂, t°, xt)→ NO —(O₂)→ NO₂').map((m) => m.tren)).toEqual(['O₂, t°, xt', 'O₂'])
    expect(muis('X + 3NaOH —t°→ 2C₁₇H₃₃COONa')[0].tren).toBe('t°')
    expect(muis('C₆H₁₂O₆ (glucose) --enzyme→ 2C₂H₅OH + 2CO₂')[0].tren).toBe('enzyme')
    expect(muis('C₆H₅NO₂ —(1) Fe + HCl→ C₆H₅NH₃Cl')[0].tren).toBe('(1) Fe + HCl')
  })
  it('điều kiện viết trước mũi tên "t°→", "Pt,t°→", "NH₄Clto→" → lên trên mũi tên', () => {
    expect(muis('Fe + H₂SO₄ t°→ Fe₂(SO₄)₃')[0].tren).toBe('t°')
    expect(muis('4NH₃(g)+5O₂(g)Pt,t°→4NO(g)')[0].tren).toBe('Pt, t°')
    expect(muis('NH₄Clto→NH₃+HCl')[0].tren).toBe('t°')
    expect(chus('NH₄Clto→NH₃+HCl')).not.toContain('to')
  })
  it('gạch ngang trong câu chữ KHÔNG bị hiểu là mũi tên dài', () => {
    expect(muis('Liên kết cho – nhận N → O kém bền.')[0].tren).toBe('')
    expect(muis('H₃N⁺–CH₂-COOH ⇌(+OH⁻)[+H⁺] H₃N⁺–CH₂-COO⁻')[0]).toEqual(expect.objectContaining({ tren: '+OH⁻', duoi: '+H⁺' }))
    expect(muis('oxi hoá – khử (N: −3 → 0)')[0].tren).toBe('')
  })
  it('ion, trạng thái, t° vẫn đúng quanh mũi tên', () => {
    const p = parseChemText('NaCl(aq) → Na⁺(aq) + Cl⁻(aq)')
    expect(p.map((x) => ('v' in x ? x.v : '')).join('')).toBe('NaCl(aq) → Na⁺(aq) + Cl⁻(aq)')
  })
})

describe('sơ đồ đứng riêng một dòng', () => {
  const soDo = (s: string) => tachDongSoDo(s).filter((k) => k.t === 'sodo').map((k) => k.v)
  it('câu thầy chụp: "…→CH₃COOH Gán số thứ tự…" tách ra', () => {
    const s = 'Cho sơ đồ sau:\nCO₂ ⁽¹⁾→ (C₆H₁₀O₅)ₙ ⁽²⁾→ C₆H₁₂O₆ ⁽³⁾→ C₂H₅OH ⁽⁴⁾→CH₃COOH Gán số thứ tự phương trình hoá học'
    const k = tachDongSoDo(s)
    expect(k.map((x) => x.t)).toEqual(['chu', 'sodo', 'chu'])
    expect(k[0].v).toBe('Cho sơ đồ sau:')
    expect(k[1].v).toBe('CO₂ ⁽¹⁾→ (C₆H₁₀O₅)ₙ ⁽²⁾→ C₆H₁₂O₆ ⁽³⁾→ C₂H₅OH ⁽⁴⁾→CH₃COOH')
    expect(k[2].v).toBe('Gán số thứ tự phương trình hoá học')
  })
  it('"…CH₃COOH. Gán…" — giữ dấu chấm với sơ đồ', () => {
    expect(soDo('Cho sơ đồ phản ứng sau:\nCO₂ →(1) (C₆H₁₀O₅)ₙ →(2) C₆H₁₂O₆. Gán số thứ tự')).toEqual(['CO₂ →(1) (C₆H₁₀O₅)ₙ →(2) C₆H₁₂O₆.'])
  })
  it('sau dấu hai chấm cùng dòng', () => {
    expect(soDo('Cho sơ đồ chuyển hoá: Tinh bột →(+H₂O, acid, t°) X →(+[Ag(NH₃)₂]OH, t°) Y. Biết X, Y là các hợp chất hữu cơ.')).toEqual([
      'Tinh bột →(+H₂O, acid, t°) X →(+[Ag(NH₃)₂]OH, t°) Y.',
    ])
  })
  it('các phương trình đánh số dính nhau bằng dấu ; → mỗi phương trình một dòng', () => {
    const s =
      '(2) [C₆H₇O₂(OH)₃]n + 3n(CH₃CO)₂O →(H₂SO₄, t°) [C₆H₇O₂(OOCCH₃)₃]n + 3nCH₃COOH; (3) saccharose C₁₂H₂₂O₁₁ + H₂O →(H⁺, t°) C₆H₁₂O₆ + C₆H₁₂O₆ (glucose và fructose); (4) glucose C₆H₁₂O₆ →(enzyme) 2C₂H₅OH + 2CO₂.'
    expect(soDo(s).length).toBe(3)
    expect(soDo(s)[1].startsWith('(3) saccharose')).toBe(true)
  })
  it('phương án chỉ là một phương trình, hay câu chữ có mũi tên giải thích: KHÔNG tách', () => {
    expect(tachDongSoDo('CH₃COOH + NaOH → CH₃COONa + H₂O')).toEqual([{ t: 'chu', v: 'CH₃COOH + NaOH → CH₃COONa + H₂O' }])
    const y = 'Trong phương trình điện li, người ta dùng mũi tên từ trái sang phải (→).'
    expect(tachDongSoDo(y)).toEqual([{ t: 'chu', v: y }])
    const lg = 'pH = 13 → pOH = 1 → [OH⁻] = 0,1 M.'
    expect(tachDongSoDo(lg)).toEqual([{ t: 'chu', v: lg }])
  })
  it('phiếu HTML: sơ đồ nằm trong khối riêng, (C₆H₁₀O₅)ₙ không lên mũi tên, không thừa dòng trống', () => {
    const h = chuHtml('Cho sơ đồ sau:\nCO₂ ⁽¹⁾→ (C₆H₁₀O₅)ₙ ⁽²⁾→ C₆H₁₂O₆ Gán số thứ tự')
    expect(h).toContain('<span class="so-do"')
    expect(h).not.toMatch(/mt-(tren|duoi)">\(C₆H₁₀O₅/)
    expect(h).toContain('<span class="mt-tren">(1)</span>')
    expect(h).not.toContain('\n')
  })
})

describe('không ngắt dòng giữa công thức', () => {
  it('mũi tên dính với chất đứng sau, công thức có chỉ số được bọc liền', () => {
    const g = gomTuCongThuc<string>(
      ['CO₂', ' ', '→', ' ', '(C₆H₁₀O₅)ₙ', ' bị thủy phân'],
      (x) => (x === '→' ? null : x),
      (v) => v,
      (x) => x === '→',
    )
    const lien = g.filter((x) => x.lien).map((x) => (x.lien ? x.ds.join('') : ''))
    expect(lien).toContain('→ (C₆H₁₀O₅)ₙ')
  })
  it('phiếu HTML bọc ct-lien quanh "mũi tên + chất"', () => {
    expect(chuHtml('A → (C₆H₁₀O₅)ₙ')).toMatch(/<span class="ct-lien" style="white-space:nowrap">[^<]*<span class="mt mt-tran">.*\(C₆H₁₀O₅\)ₙ<\/span>/)
  })
})
