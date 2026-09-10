// CẤU HÌNH ELECTRON HIỆN SAI TRÊN MÀN LÀM BÀI (thầy chụp ảnh 10/09, 21:0x).
//
// Ảnh: câu "Cấu hình electron nguyên tử của nitrogen là", bốn phương án hiện ra
//
//     A  1s₂₂s₂₂p₁      B  1s₂₂s₂₂p₅      C  1s₂₂s₂₂p₄      D  1s₂₂s₂₂p₃
//
// Đúng phải là  1s²2s²2p¹ · 1s²2s²2p⁵ · 1s²2s²2p⁴ · 1s²2s²2p³.
//
// HAI CHỖ SAI CÙNG LÚC:
//
//   1. Số electron bị in thành CHỈ SỐ DƯỚI. Chỉ số dưới là số nguyên tử trong
//      công thức (H₂O); `1s₂` là ký hiệu khác hẳn.
//   2. Nặng hơn: DÃY SỐ BỊ GỘP SAI. Luật cũ vơ cả dãy số đứng sau chữ, nên
//      `1s22s2` cắt thành `1s` + `22` + `s` + `2` — chữ số mở đầu lớp sau bị
//      nuốt vào số electron của lớp trước. Vì thế cả bốn phương án trông y hệt
//      nhau ở hai lớp đầu, em không phân biệt được đâu với đâu.
//
// Sửa ở tầng TRÌNH BÀY (`parseChemText`), không đụng kho đề: màn làm bài, phiếu
// gửi phụ huynh (`html-phieu`) và bản in PDF (`chu-hoa-hoc-pdf`) đều đi qua đúng
// hàm này, nên một chỗ sửa là cả ba đường ra cùng đúng.
import { describe, expect, it } from 'vitest'
import { cumCauHinhElectron, parseChemText } from '../src/lib/chem-format'
import { chuHtml } from '../src/lib/html-phieu'

/** Dựng lại chuỗi hiện ra màn hình, đánh dấu rõ mũ và chỉ số dưới. */
function hienRa(s: string): string {
  return parseChemText(s)
    .map((p) => (p.t === 'sup' ? `^(${p.v})` : p.t === 'sub' ? `_(${p.v})` : p.v))
    .join('')
}

describe('CẮT CỤM — chỗ khó là biết chữ số nào mở lớp mới', () => {
  it('cắt đúng cấu hình nitrogen', () => {
    expect(cumCauHinhElectron('1s22s22p3')).toEqual([
      { lop: '1s', soE: '2' },
      { lop: '2s', soE: '2' },
      { lop: '2p', soE: '3' },
    ])
  })

  it('số electron HAI CHỮ SỐ vẫn nguyên vẹn — `3d104s2`', () => {
    // `0` không mở được lớp nào (lớp phải là 1..7) nên `10` không bị cắt đôi.
    expect(cumCauHinhElectron('3d104s2')).toEqual([
      { lop: '3d', soE: '10' },
      { lop: '4s', soE: '2' },
    ])
  })

  it('`4f14` đứng cuối — `4` không có phân lớp theo sau nên không mở lớp mới', () => {
    expect(cumCauHinhElectron('4f14')).toEqual([{ lop: '4f', soE: '14' }])
  })

  it('cấu hình dài của argon cắt đủ sáu cụm', () => {
    expect(cumCauHinhElectron('1s22s22p63s23p6')?.map((c) => c.lop + c.soE)).toEqual(['1s2', '2s2', '2p6', '3s2', '3p6'])
  })

  it('KHÔNG nhận bừa: công thức Hoá thường trả null', () => {
    expect(cumCauHinhElectron('2SO4')).toBeNull()
    expect(cumCauHinhElectron('2p')).toBeNull() // "phân lớp 2p" — không có số electron
    expect(cumCauHinhElectron('')).toBeNull()
    expect(cumCauHinhElectron('12')).toBeNull()
  })
})

describe('BỐN PHƯƠNG ÁN TRONG ẢNH THẦY CHỤP', () => {
  const PA = ['1s22s22p1', '1s22s22p5', '1s22s22p4', '1s22s22p3']

  it('mỗi phương án ra đúng ba cụm, số electron là SỐ MŨ', () => {
    expect(PA.map(hienRa)).toEqual([
      '1s^(2)2s^(2)2p^(1)',
      '1s^(2)2s^(2)2p^(5)',
      '1s^(2)2s^(2)2p^(4)',
      '1s^(2)2s^(2)2p^(3)',
    ])
  })

  it('KHÔNG còn chỉ số dưới nào trong cấu hình electron', () => {
    for (const s of PA) expect(parseChemText(s).some((p) => p.t === 'sub')).toBe(false)
  })

  it('bốn phương án KHÁC NHAU khi hiện ra — trước đây hai lớp đầu giống hệt', () => {
    const ra = PA.map(hienRa)
    expect(new Set(ra).size).toBe(4)
    // Tái hiện cái sai cũ: gộp cả dãy số làm một thì `1s` + `22` là chung.
    const cuaBanCu = (s: string) => s.replace(/([A-Za-z])([0-9]+)/g, '$1_($2)')
    expect(cuaBanCu('1s22s22p1')).toContain('_(22)')
  })
})

describe('CÂU THẬT TRONG KHO CỦA THẦY — ca 890691, khối 10, Cấu tạo nguyên tử', () => {
  it('10-C1-B3-D1-I-41: cấu hình nằm GIỮA câu dẫn', () => {
    const de = 'Cấu hình electron của nguyên tử nguyên tố X là 1s22s22p2. Số hiệu nguyên tử của X là'
    expect(hienRa(de)).toContain('1s^(2)2s^(2)2p^(2)')
    expect(hienRa(de)).not.toContain('_(22)')
  })

  it('10-C1-B3-D1-I-55: bốn phương án của 24Cr, có cả `[Ar]` và số electron hai chữ số', () => {
    expect(hienRa('[Ar] 4s23d4.')).toBe('[Ar] 4s^(2)3d^(4).')
    expect(hienRa('[Ar] 3d44s2.')).toBe('[Ar] 3d^(4)4s^(2).')
    expect(hienRa('[Ar] 3d54s1.')).toBe('[Ar] 3d^(5)4s^(1).')
  })

  it('phương án đã gõ sẵn bằng ký tự mũ Unicode thì GIỮ NGUYÊN, không đụng vào', () => {
    expect(hienRa('1s²2s²2p³.')).toBe('1s²2s²2p³.')
  })
})

describe('KHÔNG ĐƯỢC LÀM HỎNG CÔNG THỨC THƯỜNG', () => {
  const GIU_CHI_SO_DUOI: [string, string][] = [
    ['H2O', 'H_(2)O'],
    ['CO2', 'CO_(2)'],
    ['Fe2O3', 'Fe_(2)O_(3)'],
    ['Na2S2O3', 'Na_(2)S_(2)O_(3)'],
    ['C6H12O6', 'C_(6)H_(12)O_(6)'],
    ['H2SO4', 'H_(2)SO_(4)'],
    ['CaCO3', 'CaCO_(3)'],
    ['Al(OH)3', 'Al(OH)_(3)'],
  ]
  it.each(GIU_CHI_SO_DUOI)('%s vẫn là chỉ số dưới', (vao, ra) => {
    expect(hienRa(vao)).toBe(ra)
  })

  it('tên nguyên tố có chữ thường s/p/d/f KHÔNG bị hiểu thành phân lớp', () => {
    // Chữ thường của Os, Np, Pd, Cf đứng sau chữ HOA chứ không sau chữ số.
    expect(hienRa('Os2O3')).toBe('Os_(2)O_(3)')
    expect(hienRa('Pd2')).toBe('Pd_(2)')
  })

  it('điện tích gõ tường minh vẫn là số mũ', () => {
    expect(hienRa('SO4^{2-}')).toBe('SO_(4)^(2-)')
  })
})

describe('PHIẾU GỬI PHỤ HUYNH đi qua CÙNG một bộ tách', () => {
  it('`chuHtml` in ra <sup>, không phải <sub>', () => {
    const html = chuHtml('1s22s22p3')
    expect(html).toBe('1s<sup>2</sup>2s<sup>2</sup>2p<sup>3</sup>')
    expect(html).not.toContain('<sub>')
  })

  it('phiếu vẫn in chỉ số dưới cho công thức thường', () => {
    expect(chuHtml('H2O')).toBe('H<sub>2</sub>O')
  })
})
