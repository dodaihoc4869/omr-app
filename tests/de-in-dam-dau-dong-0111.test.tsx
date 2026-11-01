// @vitest-environment jsdom
// Chữ đề (thầy 01/11): «**không**» in đậm, bỏ dấu sao; đề có các dòng (1) (2)… ⇒ mỗi dòng một hàng số | nội dung, đoạn sau danh sách tách thoáng.
import { beforeAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChemText, napKatex } from '../src/lib/chem-format'
import { tachDanhSach } from '../src/lib/chem-tang-cuong'

// in đậm + đầu dòng ở mảnh nạp lười (đi cùng KaTeX) ⇒ nạp trước khi vẽ
beforeAll(async () => { await napKatex() })
import { chuHtml } from '../src/lib/html-phieu'

describe('in đậm', () => {
  it('**không** ⇒ <b>không</b>, không còn dấu sao (màn làm bài + phiếu in)', () => {
    const { container } = render(<ChemText text="Nhận xét nào sau đây **không** đúng?" />)
    expect(container.textContent).toBe('Nhận xét nào sau đây không đúng?')
    expect(container.querySelector('b')?.textContent).toBe('không')
    expect(chuHtml('Phát biểu **không** đúng')).toContain('<b>không</b>')
    expect(chuHtml('Phát biểu **không** đúng')).not.toContain('**')
  })
  it('chữ có một dấu sao lẻ / công thức vẫn như cũ', () => {
    const { container } = render(<ChemText text="Dung dịch H2SO4 * loãng" />)
    expect(container.textContent).toContain('*')
    expect(container.querySelector('sub')?.textContent).toBe('2')
  })
})

describe('đầu dòng', () => {
  const DE = 'Cho các bán phản ứng sau:\n(1) Cu2+ + 2e → Cu\n(2) 2Al + 3H2O → Al2O3 + 6H+ + 6e\n(3) 2H2O + 2e → H2 + 2OH-\nHãy viết liền các chữ số tương ứng.'
  it('tách đoạn + dòng đánh số; dưới 2 dòng đánh số ⇒ giữ cách cũ', () => {
    expect(tachDanhSach(DE)?.map((k) => k.so)).toEqual([null, '(1)', '(2)', '(3)', null])
    expect(tachDanhSach('Một dòng (1) thôi')).toBeNull()
    expect(tachDanhSach('Câu:\n(1) chỉ một dòng\nHết')).toBeNull()
  })
  it('mỗi dòng (n) là một hàng hai cột; đoạn cuối tách riêng', () => {
    const { container } = render(<ChemText text={DE} />)
    const muc = [...container.querySelectorAll('.de-muc')]
    expect(muc).toHaveLength(3)
    expect(muc.map((m) => m.querySelector('.de-muc-so')?.textContent)).toEqual(['(1)', '(2)', '(3)'])
    expect(muc[1]!.querySelector('.de-muc-nd')?.textContent).toContain('Al')
    const doan = [...container.querySelectorAll('.de-doan')]
    expect(doan.map((d) => d.textContent)).toEqual(['Cho các bán phản ứng sau:', 'Hãy viết liền các chữ số tương ứng.'])
  })
})

describe('phương trình dài', () => {
  it('GIỮ một dòng trong ô cuộn ngang (thầy 01/11: «Cứ để thanh cuộn, đi xuống dòng thế không đúng cách»), kể cả trong dòng đánh số', async () => {
    const { findByText, container } = render(<ChemText text={'Cho:\n(1) $\\ce{2Al(s) + 3H2O(l) -> Al2O3(s) + 6H+ + 6e}$\n(2) $\\ce{2H2O(l) + 2e -> H2(g) + 2OH^-(aq)}$\nHỏi gì?'} />)
    await findByText('(1)')
    expect(container.querySelector('.ct-ngat')).toBeNull()
    expect(container.querySelectorAll('.de-muc .ct-dai').length).toBeGreaterThan(0)
  })
})
