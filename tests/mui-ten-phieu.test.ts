// MŨI TÊN PHẢN ỨNG TRONG PHIẾU HTML — thầy chụp màn 06/09.
//
// Phiếu đang in `Triolein →(+H2 dư, Ni, t°) X →(+NaOH dư, t°) Y →(+HCl) Z`:
// điều kiện phản ứng tụt xuống ngang hàng với chất, đọc sơ đồ phải tự đoán
// ngoặc nào của mũi tên nào. Nay nhãn nằm TRÊN và DƯỚI thân mũi tên.
import { describe, expect, it } from 'vitest'
import { CSS_PHIEU, chuHtml } from '../src/lib/html-phieu'
import { chuThuanTuDoan, doanCongThuc } from '../src/lib/chu-hoa-hoc-pdf'

describe('Mũi tên mang theo nhãn của nó', () => {
  it('nhãn KHÔNG còn bị nhét vào ngoặc sau mũi tên', () => {
    const ra = chuHtml(String.raw`Triolein $\ce{->[+H2 dư, Ni, t^\circ]}$ X`)
    expect(ra).toContain('mt-tren')
    expect(ra).toContain('mt-than mt-phai')
    // Đây là dạng cũ, không được xuất hiện nữa.
    expect(ra).not.toContain('→(')
    expect(ra).not.toContain('→ (')
  })

  it('nhãn trên và nhãn dưới ra ĐÚNG hai ô khác nhau', () => {
    const ra = chuHtml(String.raw`X $\ce{->[+H2O][acid, t^\circ]}$ Y`)
    expect(ra).toMatch(/<span class="mt-tren">[^<]*\+H/)
    expect(ra).toMatch(/<span class="mt-duoi">acid, t°<\/span>/)
    // Thứ tự trong DOM: nhãn trên → thân → nhãn dưới.
    expect(ra.indexOf('mt-tren')).toBeLessThan(ra.indexOf('mt-than'))
    expect(ra.indexOf('mt-than')).toBeLessThan(ra.indexOf('mt-duoi'))
  })

  it('chỉ số dưới TRONG NHÃN vẫn là chỉ số dưới', () => {
    // `+H2O` trên mũi tên phải ra H₂O, không phải "H2O".
    expect(chuHtml(String.raw`X $\ce{->[+H2O]}$ Y`)).toContain('<sub>2</sub>')
  })

  it('mũi tên hai chiều dùng thân hai nét', () => {
    expect(chuHtml(String.raw`A $\ce{<=>[men]}$ B`)).toContain('mt-than mt-hai')
  })

  it('mũi tên ngược nhận đúng hướng', () => {
    expect(chuHtml(String.raw`A $\ce{<-[+H2O]}$ B`)).toContain('mt-than mt-trai')
  })

  it('mũi tên KHÔNG nhãn thì gọn, không dựng khung xếp chồng', () => {
    const ra = chuHtml(String.raw`$\ce{H2 + Cl2 -> 2HCl}$`)
    expect(ra).toContain('mt-tran')
    expect(ra).not.toContain('mt-tren')
    expect(ra).not.toContain('mt-duoi')
  })

  it('phức chất trong nhãn không làm vỡ nhãn — câu cellulose của thầy', () => {
    const ra = chuHtml(String.raw`X $\ce{->[+[Ag(NH3)2]OH][t^\circ]}$ Y`)
    // Cả cụm `[Ag(NH3)2]OH` phải nằm TRỌN trong nhãn trên, không rơi ra ngoài.
    const nhan = /<span class="mt-tren">([\s\S]*?)<\/span><span class="mt-than/.exec(ra)
    expect(nhan).not.toBeNull()
    expect(nhan![1]).toContain('[Ag(NH')
    expect(nhan![1]).toContain(']OH')
    expect(ra).toMatch(/<span class="mt-duoi">t°<\/span>/)
  })

  it('CSS của mũi tên có mặt trong phiếu, không thì ra HTML trần', () => {
    for (const lop of ['.mt-tren', '.mt-duoi', '.mt-than', '.mt-phai', '.mt-trai', '.mt-hai']) {
      expect(CSS_PHIEU).toContain(lop)
    }
  })

  it('chuỗi thuần vẫn giữ đủ điều kiện để đo bề rộng', () => {
    const s = chuThuanTuDoan(doanCongThuc(String.raw`X $\ce{->[+H2O][acid, t^\circ]}$ Y`))
    expect(s).toContain('H2O')
    expect(s).toContain('acid, t°')
  })

  it('câu chữ thuần không mọc thêm mũi tên nào', () => {
    expect(chuHtml('Ester nào sau đây có mùi chuối chín?')).not.toContain('mt-than')
  })
})
