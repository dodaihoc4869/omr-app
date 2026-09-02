import { describe, it, expect } from 'vitest'
import { autoStructureRawExam } from '../src/lib/exam-auto-structure'
import { parseExamText } from '../src/lib/exam-parse'

describe('autoStructureRawExam', () => {
  it('tự thêm MÃ ĐỀ khi file không có, và đổi PHẦN 1/2/3 -> PHẦN I/II/III', () => {
    const raw = `PHẦN 1\nCâu 1: Đề bài\nA) chọn A\nB) chọn B\nC) chọn C\nD) chọn D\nPHẦN 2\n1. Ý a b c d\nPHẦN 3\n1. Điền số`
    const { text } = autoStructureRawExam(raw, 'de-thi-132.pdf')
    expect(text).toMatch(/^MÃ ĐỀ: de-thi-132/)
    expect(text).toMatch(/PHẦN I\b/)
    expect(text).toMatch(/PHẦN II\b/)
    expect(text).toMatch(/PHẦN III\b/)
  })

  it('trích bảng ĐÁP ÁN ở cuối file để tự đánh dấu * đúng cho Phần I', () => {
    const raw = [
      'MÃ ĐỀ: 132',
      'PHẦN I',
      'Câu 1: Đề bài 1',
      'A. chọn A',
      'B. chọn B',
      'C. chọn C',
      'D. chọn D',
      'Câu 2: Đề bài 2',
      'A. chọn A',
      'B. chọn B',
      'C. chọn C',
      'D. chọn D',
      'PHẦN II',
      '1. Ý',
      'a) ý a (Đ)',
      'b) ý b (S)',
      'c) ý c (Đ)',
      'd) ý d (S)',
      'PHẦN III',
      '1. Điền số',
      '=> 12,5',
      'ĐÁP ÁN',
      '1. B',
      '2. D',
    ].join('\n')
    const { text, notes } = autoStructureRawExam(raw, 'de.docx')
    expect(text).toContain('*B. chọn B')
    expect(text).toContain('*D. chọn D')
    expect(text).not.toContain('ĐÁP ÁN')
    expect(notes.join(' ')).toMatch(/2 câu/)

    // Sau khi tự chuẩn hoá, exam-parse.ts phải đọc được và không còn cảnh báo
    // thiếu dấu * cho 2 câu Phần I đã được đối chiếu từ bảng đáp án.
    const parsed = parseExamText(text)
    expect(parsed.errors).toEqual([])
    expect(parsed.source?.phanI[0].correct).toBe('B')
    expect(parsed.source?.phanI[1].correct).toBe('D')
    expect(parsed.warnings.some((w) => w.includes('CHƯA đánh dấu đáp án đúng'))).toBe(false)
  })

  it('không có bảng ĐÁP ÁN -> không tự đánh dấu, và báo rõ cần thầy tự bổ sung', () => {
    const raw = [
      'MÃ ĐỀ: 132',
      'PHẦN I',
      'Câu 1: Đề bài 1',
      'A. chọn A',
      'B. chọn B',
      'C. chọn C',
      'D. chọn D',
      'PHẦN II',
      '1. Ý',
      'a) ý a (Đ)',
      'PHẦN III',
      '1. Điền số',
      '=> 5',
    ].join('\n')
    const { text, notes } = autoStructureRawExam(raw, 'de.docx')
    expect(text).not.toMatch(/\*[A-D]\./)
    expect(notes.join(' ')).toMatch(/Không tìm thấy bảng "ĐÁP ÁN"/)

    const parsed = parseExamText(text)
    expect(parsed.warnings.some((w) => w.includes('CHƯA đánh dấu đáp án đúng'))).toBe(true)
  })

  it('chuẩn hoá số thứ tự câu "Câu 5:" -> "5)"', () => {
    const raw = 'MÃ ĐỀ: 1\nPHẦN I\nCâu 5: nội dung\nA) a\nB) b\nC) c\nD) d\nPHẦN II\n1. x\nPHẦN III\n1. y'
    const { text } = autoStructureRawExam(raw, 'x.pdf')
    expect(text).toMatch(/^5\) nội dung/m)
  })

  it('file bị dính liền HẾT thành 1 dòng (mất xuống dòng thật) -> vẫn đoán được ranh giới 3 phần theo thứ tự, và báo rõ độ tin cậy thấp', () => {
    const raw =
      'MÃ ĐỀ: 132 PHẦN I Câu 1: Cho phản ứng A. chọn A B. chọn B C. chọn C D. chọn D PHẦN II 1. Ý a) ý a (Đ) PHẦN III 1. Điền số => 5'
    const { text, notes } = autoStructureRawExam(raw, 'de.pdf')
    // Đã chèn được xuống dòng thật trước mỗi tiêu đề, để dòng bắt đầu đúng "PHẦN I/II/III".
    expect(text).toMatch(/^PHẦN I\b/m)
    expect(text).toMatch(/^PHẦN II\b/m)
    expect(text).toMatch(/^PHẦN III\b/m)
    expect(notes.join(' ')).toMatch(/CẢNH BÁO ĐỘ TIN CẬY THẤP/)
  })

  it('có ít nhất 1 tiêu đề đã đúng đầu dòng -> KHÔNG kích hoạt suy đoán (tránh đoán sai khi đã có tín hiệu tốt)', () => {
    const raw = 'MÃ ĐỀ: 1\nPHẦN I\nCâu 1: a A. x B. y C. z D. t PHẦN II 1. y PHẦN III 1. z'
    const { notes } = autoStructureRawExam(raw, 'de.pdf')
    expect(notes.join(' ')).not.toMatch(/CẢNH BÁO ĐỘ TIN CẬY THẤP/)
  })

  it('cụm "chọn đáp án đúng" giữa câu hỏi KHÔNG bị nhầm là bảng đáp án (chỉ nhận dòng gần như chỉ có chữ "Đáp án")', () => {
    const raw = [
      'MÃ ĐỀ: 1',
      'PHẦN I',
      'Câu 1: Hãy chọn đáp án đúng nhất trong 4 phương án sau',
      'A. x',
      'B. y',
      'C. z',
      'D. t',
      'PHẦN II',
      '1. y',
      'a) ý a (Đ)',
      'PHẦN III',
      '1. z',
      '=> 5',
    ].join('\n')
    const { text } = autoStructureRawExam(raw, 'de.pdf')
    expect(text).toContain('Hãy chọn đáp án đúng nhất')
    // Câu hỏi Phần III (sau câu chứa "đáp án đúng") vẫn còn nguyên trong output.
    expect(text).toMatch(/=> 5/)
  })

  it('tìm thấy tiêu đề Phần nhưng không nhận diện được câu nào bên trong -> báo rõ để thầy tự xuống dòng thủ công', () => {
    const raw = 'MÃ ĐỀ: 1\nPHẦN I\nnội dung không có số thứ tự câu nào cả, không tách được câu\nPHẦN II\n1. y\nPHẦN III\n1. z'
    const { notes } = autoStructureRawExam(raw, 'de.pdf')
    expect(notes.join(' ')).toMatch(/Phần I: tìm thấy tiêu đề nhưng KHÔNG nhận diện được câu nào/)
  })
})
