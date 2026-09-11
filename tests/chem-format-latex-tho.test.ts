// LaTeX VIẾT TRẦN và `\ce{}` CÓ NGOẶC LỒNG — thầy chụp màn hình 11/09/2026.
//
// Ba lỗi cùng một gốc: chuỗi đúng cú pháp LaTeX nhưng bản cũ không đưa được
// vào KaTeX nên em nhìn thấy nguyên văn mã lệnh:
//   1. `\ce{^{206}_{82}Pb}`  — regex cũ `[^}]*` cắt ở `}` đầu tiên.
//   2. `10^−17`              — dấu trừ Unicode U+2212, bản cũ chỉ nhận `-` ASCII.
//   3. `\bar{A} = \dfrac{…}` — thiếu cặp `$…$` bao quanh nên rơi ra chữ thường.
import { describe, expect, it } from 'vitest'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { parseChemText, splitCeSegments } from '../src/lib/chem-format'

const TRU = '\u2212' // −
const NHAN = '\u00d7' // ×

function hien(s: string): string {
  return splitCeSegments(s)
    .map((g) =>
      g.t === 'plain'
        ? parseChemText(g.text)
            .map((p) => (p.t === 'text' ? p.v : p.t === 'sup' ? `^(${p.v})` : `_(${p.v})`))
            .join('')
        : `[${g.t}|${g.latex}]`,
    )
    .join('')
}

describe('\\ce{} có ngoặc lồng', () => {
  it('đồng vị `\\ce{^{206}_{82}Pb}` viết trần vào KaTeX TRỌN VẸN', () => {
    expect(splitCeSegments('nguyên tử \\ce{^{206}_{82}Pb} là')).toEqual([
      { t: 'plain', text: 'nguyên tử ' },
      { t: 'ce', latex: '^{206}_{82}Pb' },
      { t: 'plain', text: ' là' },
    ])
  })

  it('có cặp `$…$` bao ngoài thì vẫn là một khúc math như cũ', () => {
    expect(splitCeSegments('nguyên tử $\\ce{^{206}_{82}Pb}$ là')).toEqual([
      { t: 'plain', text: 'nguyên tử ' },
      { t: 'math', latex: '\\ce{^{206}_{82}Pb}' },
      { t: 'plain', text: ' là' },
    ])
  })

  it('phương trình `\\ce{}` không ngoặc lồng giữ nguyên cách tách cũ', () => {
    expect(splitCeSegments('\\ce{H2SO4 + 2NaOH -> Na2SO4 + 2H2O}')).toEqual([
      { t: 'ce', latex: 'H2SO4 + 2NaOH -> Na2SO4 + 2H2O' },
    ])
  })

  it('`\\ce{` thiếu ngoặc đóng thì KHÔNG nuốt phần còn lại của câu', () => {
    expect(hien('\\ce{Ca^2+ và phần chữ')).toBe('\\ce{Ca^(2+) và phần chữ')
  })
})

describe('số mũ có dấu trừ Unicode', () => {
  it('`10^−17` (U+2212) lên số mũ', () => {
    expect(hien(`${TRU}1,26.10^${TRU}17 C.`)).toBe(`${TRU}1,26.10^(${TRU}17) C.`)
  })

  it('`10^-17` (gạch nối ASCII) vẫn như cũ', () => {
    expect(hien('+1,26.10^-17 C.')).toBe('+1,26.10^(-17) C.')
  })
})

describe('LaTeX viết trần, thiếu cặp $…$', () => {
  it('`\\bar{A} = \\dfrac{…}{…}` gom thành MỘT công thức, dấu chấm câu để ngoài', () => {
    expect(splitCeSegments(`\\bar{A} = \\dfrac{X ${NHAN} b + Y ${NHAN} a}{100}.`)).toEqual([
      { t: 'math', latex: `\\bar{A} = \\dfrac{X ${NHAN} b + Y ${NHAN} a}{100}` },
      { t: 'plain', text: '.' },
    ])
  })

  it('câu văn tiếng Việt xen giữa hai lệnh thì KHÔNG bị nuốt vào công thức', () => {
    expect(splitCeSegments('\\Delta H của phản ứng và \\dfrac{a}{b}')).toEqual([
      { t: 'math', latex: '\\Delta' },
      { t: 'plain', text: ' H của phản ứng và ' },
      { t: 'math', latex: '\\dfrac{a}{b}' },
    ])
  })

  it('dấu gạch chéo ngược trong chữ thường KHÔNG bị nhận nhầm là công thức', () => {
    expect(splitCeSegments('Cho C:\\thu-muc\\anh và chữ thường')).toEqual([
      { t: 'plain', text: 'Cho C:\\thu-muc\\anh và chữ thường' },
    ])
  })
})

describe('KaTeX dựng được thật, không rơi vào fallback đỏ', () => {
  const CAU_THAT = [
    'Số đơn vị điện tích hạt nhân của nguyên tử \\ce{^{206}_{82}Pb} là',
    `\\bar{A} = \\dfrac{X ${NHAN} b + Y ${NHAN} a}{100}.`,
    `\\bar{A} = \\dfrac{X ${NHAN} a + Y ${NHAN} b}{100 + a + b}.`,
    '$\\bar{A} = \\dfrac{X \\times b + Y \\times a}{100}$.',
    '\\ce{^{235}_{92}U} có 143 electron bên ngoài hạt nhân.',
  ]
  // Bản sao đúng quy tắc của ChemFormula: đổi ký hiệu Unicode rồi mới dựng.
  const veLatex = (s: string): string => s.replace(/\u00d7/g, '\\times ').replace(/\u00b7/g, '\\cdot ').replace(/\u2212/g, '-')

  for (const cau of CAU_THAT) {
    it(`dựng được: ${cau.slice(0, 42)}`, () => {
      for (const g of splitCeSegments(cau)) {
        if (g.t === 'plain') continue
        const latex = g.t === 'ce' ? `\\ce{${veLatex(g.latex)}}` : veLatex(g.latex)
        expect(() => katex.renderToString(latex, { throwOnError: true, strict: false, displayMode: false })).not.toThrow()
      }
    })
  }
})
