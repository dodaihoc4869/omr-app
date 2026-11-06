// CHỮ «KHÔNG» PHỦ ĐỊNH TRONG ĐỀ (thầy 06/11: «riêng phần đề để chữ mảnh, chỉ in đậm chữ Không cần thiết trong đề»): app học sinh bọc `ct-khong`
// (độ đậm đặt ở trong-lam-bai.css, chỉ trong khung đề). Chữ (textContent) giữ nguyên; từ ghép tính chất và «hay không» cuối câu bỏ qua.
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { ChemText } from '../src/lib/chem-format'
import { laKhongNhan } from '../src/lib/chem-trinh-bay' // nạp ⇒ tự cắm vào ChemText như màn làm bài HS

const nhan = (de: string) => {
  const { container } = render(<p><ChemText text={de} /></p>)
  return { chu: container.textContent, dau: [...container.querySelectorAll('.ct-khong')].map((x) => x.textContent) }
}

describe('«không» phủ định trong đề', () => {
  it.each([
    ['Chất nào sau đây không tác dụng với dung dịch HCl?', ['không']],
    ['Phát biểu nào sau đây KHÔNG đúng?', ['KHÔNG']],
    ['Không có kim loại nào tan trong nước ở điều kiện thường.', ['Không']],
    ['Kim loại nào không phản ứng với H2SO4 loãng?', ['không']],
    ['Khí X không màu, không mùi, nhẹ hơn không khí.', []],
    ['Hiđrocacbon không no, khối lượng không đổi, phân tử không phân cực.', []],
    ['Phản ứng có xảy ra hay không?', []],
    ['Phát biểu nào KHÔNG đúng? Khí này không màu.', ['KHÔNG']],
    ['Chất nào không tan trong nước?', ['không']],
    ['Không gian mạng tinh thể; không khí ẩm.', []],
    ['Có bao nhiêu chất không làm mất màu nước bromine', ['không']],
  ])('%s', (de, mong) => {
    const r = nhan(de)
    expect(r.chu).toBe(de.normalize('NFC'))
    expect(r.dau.map((x) => x?.normalize('NFC'))).toEqual(mong.map((x) => x.normalize('NFC')))
  })

  it('giữ trình bày phương trình quanh chữ «không»', () => {
    const { container } = render(<p><ChemText text={'Phản ứng nào không xảy ra: CH3NH2+HCl→CH3NH3Cl'} /></p>)
    expect(container.querySelectorAll('.ct-khong')).toHaveLength(1)
    expect(container.querySelector('.ct-l')?.textContent).toBe('HCl')
    expect(container.textContent).toContain('không xảy ra')
  })

  it('laKhongNhan: chữ hoa luôn nhấn, từ ghép không nhấn', () => {
    expect(laKhongNhan('KHÔNG khí', 0, 5)).toBe(true)
    expect(laKhongNhan('không khí', 0, 5)).toBe(false)
    expect(laKhongNhan('không tan', 0, 5)).toBe(true)
    expect(laKhongNhan('kho\u0302ng no', 0, 6)).toBe(false) // dấu mũ rời (nhánh trước khi ChemText gộp)
  })
})
