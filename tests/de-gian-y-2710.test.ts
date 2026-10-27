// Giãn ý đề (thầy 27/10, ảnh bản sống aniline): đề dài → đoạn, phương trình thành khối riêng, câu hỏi cuối tách riêng.
import { describe, expect, it } from 'vitest'
import { giuLienPhuongTrinh, laCongThuc, tachDoanDe, timPhuongTrinh } from '../src/lib/gian-y-de'
import { tachDongTheoY } from '../src/lib/tach-dong-cau'
import { DE_ANILINE } from './fixtures/de-aniline-2710'


describe('tachDoanDe — đề aniline như ảnh thầy', () => {
  const ds = tachDoanDe(tachDongTheoY(DE_ANILINE))
  it('đúng số đoạn và loại từng đoạn', () => {
    expect(ds.map((d) => d.loai)).toEqual(['chu', 'chu', 'nhan', 'pt', 'nhan', 'chu', 'hoi'])
  })
  it('nhãn «Bước 1:» đứng riêng, phương trình thành khối', () => {
    expect(ds[2]).toEqual({ loai: 'nhan', nhan: 'Bước 1:', chu: 'Nitro hoá aniline để tạo 2,4,6-trinitroaniline' })
    expect(ds[3].chu).toBe('C6H5NH2 + 3HNO3 đặc, (H2SO4 đặc, t°) → C6H2(NO2)3NH2 + 3H2O')
    expect(ds[4].nhan).toBe('Bước 2:')
  })
  it('câu hỏi cuối tách riêng, không cắt câu khác', () => {
    expect(ds[5].chu.startsWith('Giả sử')).toBe(true)
    expect(ds[5].chu.endsWith('(khối lượng riêng 1,42 g/mL).')).toBe(true)
    expect(ds[6].chu).toBe('Thể tích dung dịch HNO3 tối thiểu cần dùng là bao nhiêu lít?')
  })
  it('không mất chữ nào (chỉ khác khoảng trắng)', () => {
    const gom = (s: string) => s.replace(/\s+/g, '')
    expect(gom(ds.map((d) => (d.nhan ?? '') + d.chu).join(''))).toBe(gom(tachDongTheoY(DE_ANILINE)))
  })
})

describe('tachDoanDe — không đoán bừa', () => {
  it('đề dài một dòng nhiều câu: không tự cắt câu', () => {
    const de = 'Cho 10 gam hỗn hợp X gồm Fe và Cu vào dung dịch HCl dư. Sau phản ứng thu được 2,24 lít khí H2 ở đktc. Phần chất rắn không tan được lọc bỏ. Dung dịch thu được đem cô cạn cẩn thận rồi cân. Khối lượng muối khan thu được rất lớn so với dự kiến ban đầu của nhóm học sinh trong phòng thí nghiệm.'
    expect(de.length).toBeGreaterThan(350 - 80)
    expect(tachDoanDe(de)).toEqual([{ loai: 'chu', chu: de }])
  })
  it('mũi tên trong câu chữ không phải phương trình', () => {
    expect(timPhuongTrinh('Cho X tác dụng với NaOH → muối và nước')).toBeNull()
    expect(timPhuongTrinh('Thứ tự đúng là (1) → (3) → (2)')).toBeNull()
  })
  it('dòng chỉ có phương trình (kèm nhãn) là một khối', () => {
    expect(tachDoanDe('(1) Fe + 2HCl → FeCl2 + H2\n(2) 2KMnO4 → K2MnO4 + MnO2 + O2')).toEqual([
      { loai: 'pt', nhan: '(1)', chu: 'Fe + 2HCl → FeCl2 + H2' },
      { loai: 'pt', nhan: '(2)', chu: '2KMnO4 → K2MnO4 + MnO2 + O2' },
    ])
  })
  it('sơ đồ chuyển hoá cả dòng', () => {
    expect(tachDoanDe('Cho sơ đồ:\nCH4 → C2H2 → C6H6')[1]).toEqual({ loai: 'pt', chu: 'CH4 → C2H2 → C6H6' })
  })
  it('«Bước 2:» / «Giả sử» giữa dòng sau dấu chấm thì tách', () => {
    expect(tachDoanDe('Bước 1: Hoà tan X. Bước 2: Lọc lấy dung dịch. Giả sử hiệu suất 100%.').map((d) => d.nhan ?? d.chu.slice(0, 6))).toEqual(['Bước 1:', 'Bước 2:', 'Giả sử'])
  })
  it('phần sau dòng trống cuối là câu hỏi', () => {
    const ds = tachDoanDe('Cho 5,6 gam Fe vào dung dịch CuSO4 dư.\n\nTính khối lượng Cu thu được.')
    expect(ds.map((d) => d.loai)).toEqual(['chu', 'hoi'])
  })
  it('<br> là xuống dòng', () => {
    expect(tachDoanDe('Dòng một.<br>Dòng hai.').length).toBe(2)
  })
  it('laCongThuc', () => {
    for (const t of ['C6H5NH2', '3HNO3', 'C6H2(NO2)3NH2', 'Na2Cr2O7/H+', 'X', 'H2O(l)', 'Fe2(SO4)3', '(C6H10O5)n']) expect(laCongThuc(t), t).toBe(true)
    for (const t of ['Nitro', 'Bước', 'Cho', '2,4,6-trinitroaniline', 'aniline', 'Một']) expect(laCongThuc(t), t).toBe(false)
  })
})

describe('giuLienPhuongTrinh — chỉ ngắt tại toán tử', () => {
  it('trong ngoặc điều kiện và «chất đặc» không ngắt; sau «+» và trước mũi tên ngắt được', () => {
    const r = giuLienPhuongTrinh('C6H5NH2 + 3HNO3 đặc, (H2SO4 đặc, t°) → C6H2(NO2)3NH2 + 3H2O')
    expect(r.replace(/\u00a0/g, '~')).toBe('C6H5NH2~+ 3HNO3~đặc,~(H2SO4~đặc,~t°) →~C6H2(NO2)3NH2~+ 3H2O')
    expect(r.replace(/\u00a0/g, ' ')).toBe('C6H5NH2 + 3HNO3 đặc, (H2SO4 đặc, t°) → C6H2(NO2)3NH2 + 3H2O')
  })
})
