// ĐỀ CẮT THEO BÀI ĐƯỢC PHÉP THIẾU PHẦN — không được coi là đề hỏng.
//
// Tối 09/09 thầy báo ngân hàng chỉ nhận 71/90 đề. Nguyên nhân: validateTeacherSource
// đòi cả ba phần đều có câu, trong khi kho đã cắt theo BÀI nên nhiều bài không
// có câu Phần II hoặc Phần III. Đồng bộ coi 19 đề đó là hỏng và bỏ qua.
import { describe, expect, it } from 'vitest'
import { bankSizeWarning, validateTeacherSource, type TeacherExamSource } from '../src/data/examContent'

const mcq = (i: number) => ({ id: `m${i}`, text: `Câu ${i}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' }) as never
const ds4 = (i: number) => ({ id: `d${i}`, text: `Câu ${i}`, ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'S', 'D', 'S'] }) as never
const tln = (i: number) => ({ id: `t${i}`, text: `Câu ${i}`, correct: '1' }) as never
const de = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource =>
  ({
    maDe,
    phanI: Array.from({ length: nI }, (_, i) => mcq(i)),
    phanII: Array.from({ length: nII }, (_, i) => ds4(i)),
    phanIII: Array.from({ length: nIII }, (_, i) => tln(i)),
  }) as TeacherExamSource

describe('validateTeacherSource — đề theo bài', () => {
  it('đề chỉ có Phần I vẫn hợp lệ (bài không có câu đúng/sai, trả lời ngắn)', () => {
    expect(validateTeacherSource(de('10-C3-B11', 5, 0, 0))).toEqual([])
  })

  it('đề chỉ có Phần II vẫn hợp lệ', () => {
    expect(validateTeacherSource(de('10-C2-B5', 0, 3, 0))).toEqual([])
  })

  it('đề chỉ có Phần III vẫn hợp lệ', () => {
    expect(validateTeacherSource(de('11-C1-B2-D1', 0, 0, 4))).toEqual([])
  })

  it('đề đủ ba phần vẫn hợp lệ như cũ', () => {
    expect(validateTeacherSource(de('12-C1-B1-D1', 18, 4, 6))).toEqual([])
  })

  it('đề RỖNG hoàn toàn thì vẫn phải báo lỗi', () => {
    expect(validateTeacherSource(de('rong', 0, 0, 0))).toEqual(['Đề chưa có câu nào'])
  })

  it('thiếu mã đề vẫn báo lỗi', () => {
    expect(validateTeacherSource(de('', 5, 0, 0))).toContain('Thiếu tên/mã đề')
  })

  it('đúng 19 đề kiểu thầy gặp đều qua được cửa', () => {
    // Hình dạng thật lấy từ màn hình báo lỗi của thầy: thiếu Phần II hoặc III.
    const ds = [de('10-C1-B3-D1', 90, 9, 0), de('10-C2-B5', 7, 0, 0), de('10-C3-B11', 0, 1, 0),
                de('11-C4-ON', 14, 0, 0), de('11-C6-ON', 8, 0, 0)]
    for (const d of ds) expect(validateTeacherSource(d)).toEqual([])
  })

  it('việc đủ 18·4·6 là của bankSizeWarning lúc ra đề, không phải của cửa nhập', () => {
    // Một mình đề theo bài thì thiếu, nhưng đó là cảnh báo chứ không phải lỗi nhập.
    expect(bankSizeWarning([de('10-C3-B11', 5, 0, 0)])).toBeTruthy()
    // Gộp nhiều bài lại thì đủ và hết cảnh báo.
    expect(bankSizeWarning([de('a', 18, 0, 0), de('b', 0, 4, 0), de('c', 0, 0, 6)])).toBeNull()
  })
})
