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

describe('phương trình dài ngắt dòng', () => {
  it('tách cụm ở «+» và mũi tên cấp ngoài; hệ số rời dính vào chất; ngoặc lệch ⇒ null', async () => {
    const { tachCumCe } = await import('../src/lib/chem-latex')
    expect(tachCumCe('2Al(s) + 3H2O(l) -> Al2O3(s) + 6H+ + 6e')).toEqual([
      { dau: '', chat: '2Al(s)' }, { dau: '+', chat: '3H2O(l)' }, { dau: '->', chat: 'Al2O3(s)' }, { dau: '+', chat: '6H+' }, { dau: '+', chat: '6e' }])
    expect(tachCumCe('Cu(s) + 2Fe^{3+}(aq) <=> Cu^{2+}(aq) + 2Fe^{2+}(aq)')?.map((c) => c.dau)).toEqual(['', '+', '<=>', '+'])
    expect(tachCumCe('2 H2O -> O2')).toBeNull() // dưới 3 cụm ⇒ để nguyên
    expect(tachCumCe('A + (B -> C')).toBeNull()
  })
})
