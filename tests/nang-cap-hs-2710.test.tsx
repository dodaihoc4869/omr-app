// NÂNG CẤP THẨM MỸ APP HỌC SINH 27/10 (bản vẽ ve-moi/nang-cap): tranh Hoá học chỉ vẽ khi CHẮC (không đoán), mốc combo 3 · 5 · 10 (rồi mỗi 5), chủ đề ngắn ở nhãn câu.
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { chatCua, docCanh, MinhHoaDe, TranhPa } from '../src/components/hoc-tap/minh-hoa-hoa'
import { chuMoc, mocCombo } from '../src/components/hoc-tap/hieu-ung-duo'
import { chuDeNgan } from '../src/components/hoc-tap/ManLamBaiTap'

describe('tranh Hoá học (minh-hoa-hoa)', () => {
  it('nhận chất theo tên hoặc công thức (không phân biệt hoa thường, chỉ số Unicode, dấu chấm cuối)', () => {
    expect(chatCua('Methylamine')?.ct).toBe('CH3NH2')
    expect(chatCua('CH₃NH₂')?.ct).toBe('CH3NH2')
    expect(chatCua('acetic acid.')?.ct).toBe('CH3COOH')
    expect(chatCua('Glycerol')).toBeUndefined()
  })
  it('cảnh phản ứng: lượng phải đứng ngay trước tên chất; có chất phản ứng; đại lượng cần tìm', () => {
    expect(docCanh('Cho 4,5 gam ethylamine tác dụng với dung dịch HCl vừa đủ, thu được m gam muối. Giá trị của m là'))
      .toEqual({ ct: 'C2H5NH2', luong: '4,5 g', thuoc: 'HCl', tim: 'm = ?', dd: 1 })
    expect(docCanh('Cho 0,1 mol aniline tác dụng vừa đủ với HCl. Khối lượng muối phenylammonium chloride thu được là')?.luong).toBe('0,1 mol')
    expect(docCanh('Thuỷ phân hoàn toàn 8,8 gam ethyl acetate trong dung dịch sodium hydroxide dư')?.thuoc).toBe('NaOH')
    // «methylamine» không bị đọc nhầm thành «ethylamine»
    expect(docCanh('Cho 3,1 gam methylamine tác dụng với HCl')?.ct).toBe('CH3NH2')
    // hỗn hợp / lượng không gắn với chất / không có chất phản ứng ⇒ không vẽ
    expect(docCanh('Cho 10 gam hỗn hợp methylamine và ethylamine tác dụng với HCl')).toBeNull()
    expect(docCanh('Số đồng phân amine có công thức phân tử C4H11N là')).toBeNull()
    expect(docCanh('Cho 4,5 gam ethylamine vào nước')).toBeNull()
  })
  it('MinhHoaDe vẽ figure có nhãn; đề không nhận ra ⇒ không vẽ gì', () => {
    const a = render(<MinhHoaDe text="Cho 4,5 gam ethylamine tác dụng với dung dịch HCl vừa đủ" />)
    expect(a.container.querySelector('figure.mh-canh')?.getAttribute('aria-label')).toBe('Minh hoạ: 4,5 g C2H5NH2 tác dụng với HCl')
    const b = render(<MinhHoaDe text="Chất nào sau đây là amine?" />)
    expect(b.container.innerHTML).toBe('')
  })
  it('phân tử trong ô phương án: CẢ BỐN phải có trong từ điển phân tử, thiếu một ⇒ không ô nào', () => {
    const du = ['ethanol', 'methylamine', 'acetic acid', 'methyl formate']
    const r = render(<>{du.map((_, i) => <TranhPa key={i} choices={du} i={i} />)}</>)
    expect(r.container.querySelectorAll('.mh-pa svg[role=img]')).toHaveLength(4)
    const thieu = ['ethanol', 'methylamine', 'acetic acid', 'glucose']
    const t = render(<>{thieu.map((_, i) => <TranhPa key={i} choices={thieu} i={i} />)}</>)
    expect(t.container.querySelectorAll('.mh-pa')).toHaveLength(0)
  })
})

describe('mốc combo (hieu-ung-duo)', () => {
  it('3 · 5 · 10 rồi mỗi 5 câu; chữ băng đúng mốc', () => {
    expect([1, 2, 3, 4, 5, 6, 9, 10, 11, 15, 20].map(mocCombo)).toEqual([0, 0, 3, 0, 5, 0, 0, 10, 0, 10, 10])
    expect(chuMoc(3)).toBe('3 câu đúng liền!')
    expect(chuMoc(5)).toBe('Phản ứng dây chuyền! ×5')
    expect(chuMoc(10)).toBe('10 câu liền — huy hiệu mới!')
    expect(chuMoc(15)).toBe('Phản ứng dây chuyền! ×15')
  })
})

describe('nhãn câu gọn', () => {
  it('chủ đề ngắn = đoạn đầu trước « — »', () => {
    expect(chuDeNgan('Amine — tính base — tính khối lượng')).toBe('Amine')
    expect(chuDeNgan('Ester – Lipid')).toBe('Ester – Lipid')
    expect(chuDeNgan('Hợp chất chứa nitrogen')).toBe('Hợp chất chứa nitrogen')
  })
})
