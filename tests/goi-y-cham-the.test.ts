// «Chạm để hiểu đề» — thẻ giải nghĩa khi chạm (khớp chữ bản vẽ docs/ban-ve-doc-de-2610, thầy chốt build 26/10).
import { describe, expect, it } from 'vitest'
import { phatHien } from '../src/lib/goi-y-cham/phat-hien'
import { theCho } from '../src/lib/goi-y-cham/the-cham'
import { docNguyenTuKhoiTrongDe } from '../src/lib/goi-y-cham/tu-dien-chat'
import type { TheGiaiNghia, VungCham } from '../src/lib/goi-y-cham/kieu'

const DE_ESTER =
  'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là'
const cham = (de: string, chu: string) => { const v = phatHien(de).find((x) => x.chu === chu); expect(v, chu).toBeDefined(); return theCho(v!) }

describe('thẻ trên đề ester (bản vẽ màn 2, 3, 3b, 3c)', () => {
  it('chạm «1,5 M»', () => {
    expect(cham(DE_ESTER, '1,5 M')).toEqual({
      ten: 'M · nồng độ mol', nhan: 'Đơn vị',
      doan: ['1,5 M đọc là 1,5 mol trên lít: cứ 1 lít dung dịch có 1,5 mol chất tan', 'Nhân C_M với thể tích (lít) là ra tiền (số mol) chất tan.'],
      congThuc: 'n = C_M × V (V tính bằng lít)', nhoDoi: '1000 mL = 1 L',
    })
  })
  it('chạm «ethyl acetate»', () => {
    expect(cham(DE_ESTER, 'ethyl acetate')).toMatchObject({
      ten: 'ethyl acetate', nhan: 'Chất', loai: 'Ester', tenCu: 'etyl axetat', M: 88, congThucChat: 'CH₃COOC₂H₅',
      doan: ['CH₃COOC₂H₅ · M = 88 g/mol', 'M tính từ nguyên tử khối C = 12, H = 1, O = 16 (4·12 + 8·1 + 2·16 = 88)'],
    })
  })
  it('chạm «NaOH»', () => {
    expect(cham(DE_ESTER, 'NaOH')).toMatchObject({
      ten: 'NaOH', nhan: 'Công thức', loai: 'Base mạnh', tenIupac: 'sodium hydroxide', tenCu: 'natri hiđroxit (xút ăn da)', M: 40,
      cachTinhM: 'Na = 23, O = 16, H = 1 (23 + 16 + 1 = 40)',
    })
  })
  it('chạm «Cô cạn»', () => {
    const t = cham(DE_ESTER, 'Cô cạn')!
    expect(t).toMatchObject({ ten: 'Cô cạn', nhan: 'Từ then chốt' })
    expect(t.doan[1]).toMatch(/^Gặp «cô cạn» ⇒ tự hỏi: Chất rắn gồm những gì\?/)
  })
  it('chạm «Giá trị của m là»', () => {
    const t = cham(DE_ESTER, 'Giá trị của m là')!
    expect(t).toMatchObject({ ten: 'Đề hỏi giá trị của m', nhan: 'Đề hỏi' })
    expect(t.doan[0]).toBe('m là khối lượng (gam): đó là thứ em cần tìm.')
    expect(t.doan.join(' ')).toMatch(/tiền \(số mol\)/)
  })
  it('mọi vùng của đề đều có thẻ, và thẻ không lộ đáp án (10,2 / 8,2)', () => {
    for (const v of phatHien(DE_ESTER)) {
      const t = theCho(v)
      expect(t, v.chu).not.toBeNull()
      const chu = JSON.stringify(t)
      expect(chu).not.toMatch(/10,2|8,2|12,2|14,2/)
      expect(t!.doan.length).toBeGreaterThanOrEqual(1)
      expect(t!.doan.length).toBeLessThanOrEqual(3)
    }
  })
  it('thẻ gán được vào TheGiaiNghia', () => {
    const t: TheGiaiNghia | null = cham(DE_ESTER, 'NaOH')
    expect(t?.nhan).toBe('Công thức')
  })
})

describe('thẻ Đề hỏi', () => {
  it('bẫy «không đúng» (bản vẽ màn 5)', () => {
    expect(cham('Phát biểu nào sau đây không đúng?', 'không đúng')).toEqual({
      ten: 'Đề hỏi phát biểu SAI', nhan: 'Đề hỏi',
      doan: ['Đọc từng phương án và tự hỏi «đúng hay sai?». Phương án sai là đáp án; ba phương án còn lại đều đúng.', 'Bẫy hay gặp: đọc nhanh rồi chọn phương án đúng đầu tiên.'],
    })
  })
  it('bẫy «không phải»', () => {
    expect(cham('Chất nào sau đây không phải là base?', 'không phải')?.ten).toBe('Đề hỏi điều KHÔNG phải')
  })
  it('«nào sau đây», «Số … là», «Tính …»', () => {
    expect(cham('Chất nào sau đây là chất điện li mạnh?', 'Chất nào sau đây')?.ten).toBe('Đề hỏi chọn một phương án')
    expect(cham('Cho các phát biểu sau về ester. Số phát biểu đúng là', 'Số phát biểu đúng là')?.ten).toBe('Đề hỏi đếm')
    expect(cham('Cho 0,1 mol glucose lên men. Tính khối lượng ethanol thu được.', 'Tính khối lượng')?.ten).toBe('Đề yêu cầu tính')
  })
})

describe('thẻ chất và công thức', () => {
  it('công thức nhiều chất cùng công thức phân tử ⇒ liệt kê, không chọn bừa', () => {
    const t = cham('Lên men 18 gam C6H12O6.', 'C6H12O6')!
    expect(t).toMatchObject({ ten: 'C₆H₁₂O₆', ungVien: ['glucose', 'fructose'], loai: 'Carbohydrate', M: 180 })
    expect(t.doan[0]).toMatch(/nhiều chất: glucose, fructose/)
  })
  it('tên cũ ⇒ thẻ tên IUPAC to, tên cũ nhỏ', () => {
    expect(cham('Cho natri hiđroxit vào nước.', 'natri hiđroxit')).toMatchObject({ ten: 'sodium hydroxide', tenCu: 'natri hiđroxit (xút ăn da)', M: 40, loai: 'Base mạnh' })
  })
  it('ion', () => {
    expect(cham('Dung dịch có ion SO4^2- và Fe3+.', 'SO4^2-')).toMatchObject({ ten: 'SO₄²⁻', loai: 'Ion', M: 96 })
    expect(cham('Dung dịch có ion SO4^2- và Fe3+.', 'Fe3+')).toMatchObject({ ten: 'Fe³⁺', loai: 'Ion', M: 56 })
  })
  it('polymer không công thức, tinh bột có M mắt xích', () => {
    expect(cham('Trùng hợp vinyl chloride thu được poly(vinyl chloride).', 'poly(vinyl chloride)')).toMatchObject({ ten: 'poly(vinyl chloride)', loai: 'Polymer' })
    expect(cham('Thuỷ phân tinh bột.', 'tinh bột')).toMatchObject({ ten: 'starch', M: 162, doan: ['(C₆H₁₀O₅)ₙ · M một mắt xích = 162 g/mol', expect.any(String)] })
  })
  it('công thức hợp lệ nhưng chưa có trong từ điển ⇒ vẫn có M', () => {
    const v: VungCham = { loai: 'chat', tu: 0, den: 6, chu: 'C5H10O', khoa: 'C5H10O' }
    expect(theCho(v)).toMatchObject({ ten: 'C₅H₁₀O', nhan: 'Công thức', M: 86, doan: ['Chưa có tên chất này trong từ điển của app.', 'C = 12, H = 1, O = 16 (5·12 + 10·1 + 16 = 86)'] })
  })
  it('M theo nguyên tử khối đề cho', () => {
    const de = 'Cho 5,85 gam NaCl vào nước. Cho nguyên tử khối: Na = 23; Cl = 35.'
    const v = phatHien(de).find((x) => x.chu === 'NaCl')!
    expect(theCho(v, docNguyenTuKhoiTrongDe(de).bang)).toMatchObject({ M: 58, cachTinhM: 'Na = 23, Cl = 35 (23 + 35 = 58)' })
    expect(theCho(v)?.M).toBe(58.5)
  })
})

describe('thẻ đơn vị theo ngữ cảnh', () => {
  it('đkc / đktc', () => {
    expect(cham('thu được 2,479 lít khí H2 (đkc).', 'đkc')?.congThuc).toBe('V = n × 24,79 · n = V : 24,79')
    expect(cham('thu được 2,24 lít khí H2 (đktc).', 'đktc')?.congThuc).toBe('V = n × 22,4 · n = V : 22,4')
  })
  it('% hiệu suất và % nồng độ', () => {
    expect(cham('Lên men với hiệu suất 80%.', '80%')?.ten).toBe('% · hiệu suất (H)')
    expect(cham('Dung dịch NaCl nồng độ 10%.', '10%')?.doan[0]).toBe('Cứ 100 g dung dịch có 10 g chất tan.')
  })
  it('vùng lạ ⇒ null', () => {
    expect(theCho({ loai: 'cho', tu: 0, den: 1, chu: 'x', khoa: 'khong-co' })).toBeNull()
    expect(theCho({ loai: 'khoa', tu: 0, den: 1, chu: 'x' })).toBeNull()
    expect(theCho({ loai: 'chat', tu: 0, den: 2, chu: 'Xy', khoa: 'Xy' })).toBeNull()
  })
})
