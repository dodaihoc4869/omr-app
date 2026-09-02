import { describe, it, expect } from 'vitest'
import { splitPhan } from '../src/lib/exam-question-split'

describe('splitPhan/splitCau/splitPa (tách câu + phương án, nhiều kiểu trình bày trong 1 file)', () => {
  it('4 phương án viết chung 1 dòng vẫn tách đúng 4 ý', () => {
    const vungA = 'PHẦN I. Mô tả\nCâu 1. Hỏi gì đó?\nA. (a) và (c). B. (a) và (d). C. Chỉ có (c). D. (c) và (d).\nCâu 2. Câu khác'
    const phan = splitPhan(vungA)
    expect(phan).toHaveLength(1)
    const c1 = phan[0].cau[0]
    expect(c1.de).toBe('Hỏi gì đó?')
    expect(c1.pa.map((p) => p.key)).toEqual(['A', 'B', 'C', 'D'])
    expect(c1.pa[0].text).toBe('(a) và (c)')
    expect(c1.pa[3].text).toBe('(c) và (d)')
  })

  it('2 phương án 1 dòng, 2 dòng vẫn tách đúng (không tách theo ranh giới dòng)', () => {
    const vungA = 'PHẦN I. Mô tả\nCâu 1. Hỏi?\nA. Khối lượng riêng lớn.\nB. Nhiệt độ nóng chảy cao.\nC. Dẫn điện tốt.\nD. Độ cứng thấp.'
    const c1 = splitPhan(vungA)[0].cau[0]
    expect(c1.pa.map((p) => `${p.key}:${p.text}`)).toEqual([
      'A:Khối lượng riêng lớn',
      'B:Nhiệt độ nóng chảy cao',
      'C:Dẫn điện tốt',
      'D:Độ cứng thấp',
    ])
  })

  it('mỗi phương án 1 dòng riêng vẫn tách đúng', () => {
    const vungA = 'PHẦN I. Mô tả\nCâu 1. Hỏi?\nA. một\nB. hai\nC. ba\nD. bốn'
    const c1 = splitPhan(vungA)[0].cau[0]
    expect(c1.pa.map((p) => p.text)).toEqual(['một', 'hai', 'ba', 'bốn'])
  })

  it('nhận "Câu 1." "Câu 2:" lẫn lộn trong cùng khối', () => {
    const vungA = 'PHẦN I.\nCâu 1. A?\nA. x B. y C. z D. t\nCâu 2: B?\nA. x B. y C. z D. t'
    const cau = splitPhan(vungA)[0].cau
    expect(cau.map((c) => c.so)).toEqual([1, 2])
  })

  it('tách đúng 3 khối PHẦN I/II/III theo đúng thứ tự, không lẫn câu phần này sang phần khác', () => {
    const vungA =
      'PHẦN I. Mô tả\nCâu 1. Đề 1\nA. a B. b C. c D. d\n' +
      'PHẦN II. Mô tả\nCâu 1. Đề 2\na) x b) y c) z d) t\n' +
      'PHẦN III: Mô tả\nCâu 1. Đề 3 trả lời ngắn'
    const phan = splitPhan(vungA)
    expect(phan.map((p) => p.ten)).toEqual(['I', 'II', 'III'])
    expect(phan[0].cau[0].de).toBe('Đề 1')
    expect(phan[1].cau[0].de).toContain('Đề 2')
    expect(phan[2].cau[0].de).toContain('Đề 3')
  })

  it('Phần II: tách đúng 4 ý a)/b)/c)/d) (chữ thường) thành pa, kể cả khi trải nhiều dòng', () => {
    const vungA =
      'PHẦN II. Mô tả\nCâu 1. Thực hiện thí nghiệm...\n' +
      'a) Phức chất được tạo thành.\nb) Dấu hiệu nhận biết là kết tủa tan ra.\nc) Chứa bốn phối tử NH3.\nd) Nguyên tử trung tâm là Ni2+.'
    const c1 = splitPhan(vungA)[0].cau[0]
    expect(c1.de).toBe('Thực hiện thí nghiệm...')
    expect(c1.pa.map((p) => p.key)).toEqual(['A', 'B', 'C', 'D'])
    expect(c1.pa[0].text).toBe('Phức chất được tạo thành')
    expect(c1.pa[3].text).toBe('Nguyên tử trung tâm là Ni2+')
  })

  it('Phần III không có phương án A/B/C/D -> pa rỗng, không báo lỗi', () => {
    const vungA = 'PHẦN III: Mô tả\nCâu 1. Tính giá trị x?'
    const c1 = splitPhan(vungA)[0].cau[0]
    expect(c1.pa).toEqual([])
    expect(c1.de).toContain('Tính giá trị x')
  })

  it('không có tiêu đề PHẦN nào -> trả về mảng rỗng, không đoán', () => {
    expect(splitPhan('chữ không có cấu trúc gì cả')).toEqual([])
  })

  it('đánh dấu canDocAnh khi câu có dấu hiệu công thức bị vỡ do PDF (số đứng trước nguyên tố)', () => {
    const vungA = 'PHẦN I.\nCâu 1. Nước có chứa nhiều ion 2\nCa + .\nA. a B. b C. c D. d'
    const c1 = splitPhan(vungA)[0].cau[0]
    expect(c1.canDocAnh).toBe(true)
  })

  it('câu bình thường không có dấu hiệu vỡ công thức -> canDocAnh false', () => {
    const vungA = 'PHẦN I.\nCâu 1. Chất nào sau đây là acid?\nA. HCl B. NaOH C. NaCl D. KOH'
    const c1 = splitPhan(vungA)[0].cau[0]
    expect(c1.canDocAnh).toBe(false)
  })
})
