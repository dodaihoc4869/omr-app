import { describe, expect, it } from 'vitest'
import { parseChemText } from '../src/lib/chem-format'

describe('chem-format — hiển thị công thức Hoá học', () => {
  it('chỉ số dưới tự động cho công thức đơn giản', () => {
    expect(parseChemText('H2O')).toEqual([
      { t: 'text', v: 'H' },
      { t: 'sub', v: '2' },
      { t: 'text', v: 'O' },
    ])
    expect(parseChemText('CO2')).toEqual([
      { t: 'text', v: 'CO' },
      { t: 'sub', v: '2' },
    ])
    expect(parseChemText('Fe2O3')).toEqual([
      { t: 'text', v: 'Fe' },
      { t: 'sub', v: '2' },
      { t: 'text', v: 'O' },
      { t: 'sub', v: '3' },
    ])
  })

  it('không chỉ số hoá số đứng riêng có khoảng trắng (không phải công thức)', () => {
    expect(parseChemText('Câu 1 và 3H2O')).toEqual([
      { t: 'text', v: 'Câu 1 và 3H' },
      { t: 'sub', v: '2' },
      { t: 'text', v: 'O' },
    ])
  })

  it('điện tích đơn giản (không số) thành số mũ', () => {
    expect(parseChemText('Na+')).toEqual([
      { t: 'text', v: 'Na' },
      { t: 'sup', v: '+' },
    ])
    expect(parseChemText('Cl-')).toEqual([
      { t: 'text', v: 'Cl' },
      { t: 'sup', v: '-' },
    ])
  })

  // ĐỔI 10/09/2026 — thầy duyệt. Bản cũ đòi `Fe3+` và `SO42-` GIỮ NGUYÊN chữ
  // thường vì máy không biết cắt số ở đâu. Đúng là không được đoán, nhưng ion
  // CÓ THẬT trong chương trình thì chỗ cắt là xác định, nên tra BẢNG ĐÓNG
  // `ION_QUEN_THUOC` thay vì đoán. Đo trên kho: 1.201 lượt / 348 câu / 48 đề
  // đang hiện sai. Ion ngoài bảng vẫn giữ nguyên y như cũ — xem hai phép kiểm
  // dưới và tests/chem-format-ion.test.ts.
  it('ion TRONG bảng đóng thì cắt đúng thân và điện tích', () => {
    expect(parseChemText('Fe3+')).toEqual([
      { t: 'text', v: 'Fe' },
      { t: 'sup', v: '3+' },
    ])
    expect(parseChemText('SO42-')).toEqual([
      { t: 'text', v: 'SO' },
      { t: 'sub', v: '4' },
      { t: 'sup', v: '2-' },
    ])
  })

  it('số đi liền dấu +/- NGOÀI bảng vẫn giữ nguyên chữ thường, không đoán bừa', () => {
    expect(parseChemText('Cl3-')).toEqual([{ t: 'text', v: 'Cl3-' }])
    expect(parseChemText('Xe2+')).toEqual([{ t: 'text', v: 'Xe2+' }])
    expect(parseChemText('C1-')).toEqual([{ t: 'text', v: 'C1-' }])
  })

  it('đánh dấu tường minh bằng ^{...} luôn đúng theo ý thầy gõ', () => {
    expect(parseChemText('SO4^{2-}')).toEqual([
      { t: 'text', v: 'SO' },
      { t: 'sub', v: '4' },
      { t: 'sup', v: '2-' },
    ])
    expect(parseChemText('Fe^3+')).toEqual([
      { t: 'text', v: 'Fe' },
      { t: 'sup', v: '3+' },
    ])
  })

  it('đánh dấu tường minh bằng _{...}', () => {
    expect(parseChemText('C_{6}H_{12}O_{6}')).toEqual([
      { t: 'text', v: 'C' },
      { t: 'sub', v: '6' },
      { t: 'text', v: 'H' },
      { t: 'sub', v: '12' },
      { t: 'text', v: 'O' },
      { t: 'sub', v: '6' },
    ])
  })

  it('mũi tên phản ứng tự chuyển ký hiệu', () => {
    expect(parseChemText('H2 + O2 -> H2O')).toEqual([
      { t: 'text', v: 'H' },
      { t: 'sub', v: '2' },
      { t: 'text', v: ' + O' },
      { t: 'sub', v: '2' },
      { t: 'text', v: ' → H' },
      { t: 'sub', v: '2' },
      { t: 'text', v: 'O' },
    ])
    expect(parseChemText('CH3COOH <=> CH3COO- + H+')).toEqual([
      { t: 'text', v: 'CH' },
      { t: 'sub', v: '3' },
      { t: 'text', v: 'COOH ⇌ CH' },
      { t: 'sub', v: '3' },
      { t: 'text', v: 'COO' },
      { t: 'sup', v: '-' },
      { t: 'text', v: ' + H' },
      { t: 'sup', v: '+' },
    ])
  })
})
