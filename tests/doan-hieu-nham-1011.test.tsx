// A.I ĐOÁN «HIỂU NHẦM» (khối B, bản vẽ docs/ban-ve-moi-on-sua-0911 dt-sang-2; thầy 10/11 «Làm nốt mấy việc còn lại»). Đoán từ lời giải từng phương án
// (`tungPa[X].viSao`) của phương án em chọn: lẫn khái niệm ⇒ chọn sẵn «Hiểu nhầm» + dòng «A.I Đỗ Đại Học đoán em mắc đúng bẫy của phương án …»; lỗi tính /
// đọc đề / đếm nhận định ⇒ không đoán. Không bao giờ chọn sẵn «Tính / đọc đề sai». Câu ví dụ lấy nguyên văn từ lời giải thật trong kho (docs/do-tai-d1).
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { daGuiLyDoSai, doanHieuNham, thanLyDoSai } from '../src/components/hoc-tap/vi-sao-sai'
import { KetSai } from '../src/components/hoc-tap/KetSaiDuo'

afterEach(() => { cleanup(); daGuiLyDoSai(thanLyDoSai()); localStorage.clear() })

describe('doanHieuNham', () => {
  it('lẫn khái niệm ⇒ đoán Hiểu nhầm', () => {
    for (const v of ['-log[OH⁻] là pOH, không phải pH.', 'Saccharose là disaccharide, không phải polysaccharide, không chọn.', 'NH₃ có tính base chứ không phải acid.',
      'Nhầm vị trí: Z là số hiệu nguyên tử, X mới là kí hiệu nguyên tố.', 'KW là tích chứ không phải thương.', 'Không chọn: cellulose là polysaccharide, không phải ester.'])
      expect(doanHieuNham(v), v).toBe(true)
  })
  it('lỗi tính / đọc đề / đếm nhận định / câu giải không nói bẫy ⇒ không đoán', () => {
    for (const v of ['4 là pOH, chưa đổi sang pH = 14 - 4 = 10.', '22,85 là 1/0,04375, vừa viết ngược vừa bỏ số mũ.', 'Ghép nhầm CO₂ với H₂O ở tử.',
      'Chỉ có 1 mệnh đề đúng, không phải 3.', 'Có tới bốn phát biểu đúng chứ không phải một.', '0,020 là nhầm lấy 0,01.(20/10) thay vì 0,01.(30/20).',
      'Đúng với ammonia nên không phải phương án cần chọn.', 'Saccharose không phản ứng với nước bromine.', '14,037 là nhầm phần trăm của ¹⁵N thành 3,7%.'])
      expect(doanHieuNham(v), v).toBe(false)
  })
})

describe('KetSai chọn sẵn', () => {
  const pa = ['pH', 'pOH', '[H⁺]', '[OH⁻]']
  const lg = { tungPa: { A: { viSao: '-log[OH⁻] là pOH, không phải pH.' }, B: { viSao: 'Đúng: pOH = -log[OH⁻].' }, C: { viSao: '4 là pOH, chưa đổi sang pH = 14 - 4 = 10.' } }, chot: 'pOH = -log[OH⁻].' }
  it('phương án bẫy ⇒ «Hiểu nhầm» chọn sẵn, dòng A.I đoán, Tiếp tục mở; em đổi được', () => {
    const { container, getByRole } = render(<KetSai qid="k1" dap="Đáp án đúng: B. pOH" giai="" laLamLai={false} pa={pa} lg={lg} em="A" da="B" />)
    expect(getByRole('button', { name: 'Hiểu nhầm' }).getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.ly-goi-y')!.textContent).toBe('A.I Đỗ Đại Học đoán em mắc đúng bẫy của phương án A. Không phải thì chạm ô khác.')
    expect(thanLyDoSai()).toEqual({ ly: [['k1', 'nham']] })
  })
  it('phương án lỗi tính ⇒ không chọn sẵn, em phải chạm', () => {
    const { container, getByRole } = render(<KetSai qid="k2" dap="Đáp án đúng: B. pOH" giai="" laLamLai={false} pa={pa} lg={lg} em="C" da="B" />)
    for (const t of ['Tính / đọc đề sai', 'Chưa biết cách', 'Hiểu nhầm']) expect(getByRole('button', { name: t }).getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelector('.ly-goi-y')!.textContent).toBe('Chạm một ô để A.I Đỗ Đại Học xếp cách sửa hợp với em.')
    expect(thanLyDoSai()).toEqual({})
  })
})
