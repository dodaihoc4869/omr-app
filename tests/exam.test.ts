import { describe, expect, it } from 'vitest'
import { validateTeacherSource, mergeAndStrip } from '../src/data/examContent'
import { parseExamText } from '../src/lib/exam-parse'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import { gradeSubmissionFull } from '../src/lib/exam-grade'
import { hashSeed, seededPermutation } from '../src/lib/exam-shuffle'
import { emptyAnswerRecord } from '../src/lib/exam-db'

function makeSampleText(maDe: string, n1: number, n2: number, n3: number): string {
  const p1 = Array.from({ length: n1 }, (_, i) => {
    const correctIdx = i % 4
    const letters = ['A', 'B', 'C', 'D']
    return [
      `${i + 1}) Câu hỏi phần I số ${i + 1} của ${maDe}`,
      ...letters.map((l) => `${l === letters[correctIdx] ? '*' : ''}${l}. Lựa chọn ${l} câu ${i + 1}`),
    ].join('\n')
  }).join('\n')

  const p2 = Array.from({ length: n2 }, (_, i) => {
    return [
      `${i + 1}) Câu hỏi phần II số ${i + 1} của ${maDe}`,
      `a) Ý a (Đ)`,
      `b) Ý b (S)`,
      `c) Ý c (Đ)`,
      `d) Ý d (S)`,
    ].join('\n')
  }).join('\n')

  const p3 = Array.from({ length: n3 }, (_, i) => {
    return [`${i + 1}) Câu hỏi phần III số ${i + 1} của ${maDe}`, `=> ${i + 1},00`].join('\n')
  }).join('\n')

  return `MÃ ĐỀ: ${maDe}\nPHẦN I\n${p1}\nPHẦN II\n${p2}\nPHẦN III\n${p3}\n`
}

describe('exam-shuffle', () => {
  it('seededPermutation cùng seed luôn ra cùng kết quả (deterministic)', () => {
    const a = seededPermutation(20, 12345)
    const b = seededPermutation(20, 12345)
    expect(a).toEqual(b)
  })

  it('seededPermutation khác seed thường ra thứ tự khác', () => {
    const a = seededPermutation(20, hashSeed('x'))
    const b = seededPermutation(20, hashSeed('y'))
    expect(a).not.toEqual(b)
  })

  it('seededPermutation là hoán vị hợp lệ (đủ 0..n-1, không lặp)', () => {
    const perm = seededPermutation(30, 999)
    expect([...perm].sort((x, y) => x - y)).toEqual(Array.from({ length: 30 }, (_, i) => i))
  })
})

describe('exam-parse', () => {
  it('đọc đúng số câu + đáp án đúng đã đánh dấu bằng *', () => {
    const text = makeSampleText('de-a', 20, 5, 8)
    const result = parseExamText(text)
    expect(result.errors).toEqual([])
    expect(result.source).not.toBeNull()
    expect(result.source!.phanI).toHaveLength(20)
    expect(result.source!.phanII).toHaveLength(5)
    expect(result.source!.phanIII).toHaveLength(8)
    // câu 1 đánh dấu đúng ở lựa chọn A (correctIdx = 0 % 4 = 0)
    expect(result.source!.phanI[0].correct).toBe('A')
    // câu 2 đánh dấu đúng ở lựa chọn B (correctIdx = 1 % 4 = 1)
    expect(result.source!.phanI[1].correct).toBe('B')
    expect(result.source!.phanII[0].correct).toEqual(['D', 'S', 'D', 'S'])
    expect(result.source!.phanIII[0].correct).toBe('1,00')
  })

  it('không bắt buộc đúng 18/4/6 câu — validateTeacherSource chỉ đòi >=1 mỗi phần', () => {
    const text = makeSampleText('de-nho', 3, 2, 2)
    const result = parseExamText(text)
    expect(result.source).not.toBeNull()
    expect(validateTeacherSource(result.source!)).toEqual([])
  })

  it('báo lỗi khi thiếu tiêu đề Phần', () => {
    const result = parseExamText('MÃ ĐỀ: x\nPHẦN I\n1) a\nA. x\n*B. y\nC. z\nD. w\n')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('đọc đúng bảng số liệu [BANG]...[/BANG] — tái tạo y nguyên từng ô, không suy đoán', () => {
    const text = [
      'MÃ ĐỀ: co-bang',
      'PHẦN I',
      '1) Cho bảng số liệu sau:',
      '[BANG]',
      'Thời gian (phút) | Nồng độ (M)',
      '0 | 1,0',
      '5 | 0,5',
      '[/BANG]',
      'Nồng độ ở phút thứ 5 là bao nhiêu?',
      'A. 1,0',
      '*B. 0,5',
      'C. 0,25',
      'D. 2,0',
      '2) câu 2',
      'A. x',
      '*B. y',
      'C. z',
      'D. w',
      'PHẦN II',
      '1) c',
      'a) a (Đ)',
      'b) b (S)',
      'c) c (Đ)',
      'd) d (S)',
      'PHẦN III',
      '1) c',
      '=> 1',
    ].join('\n')
    const result = parseExamText(text)
    expect(result.errors).toEqual([])
    const q = result.source!.phanI[0]
    expect(q.table).toEqual([
      ['Thời gian (phút)', 'Nồng độ (M)'],
      ['0', '1,0'],
      ['5', '0,5'],
    ])
    // Dòng bảng KHÔNG bị lẫn vào text câu hỏi
    expect(q.text).not.toMatch(/\|/)
    expect(q.text).toContain('Cho bảng số liệu sau')
    expect(q.text).toContain('Nồng độ ở phút thứ 5 là bao nhiêu')
  })

  it('gắn đúng ảnh theo mã [ANH:token] và xoá marker khỏi text câu hỏi', () => {
    const text = [
      'MÃ ĐỀ: co-anh',
      'PHẦN I',
      '1) Quan sát đồ thị sau [ANH:img_test1] và cho biết X là gì?',
      'A. a',
      '*B. b',
      'C. c',
      'D. d',
      '2) câu 2',
      'A. x',
      '*B. y',
      'C. z',
      'D. w',
      'PHẦN II',
      '1) c',
      'a) a (Đ)',
      'b) b (S)',
      'c) c (Đ)',
      'd) d (S)',
      'PHẦN III',
      '1) c',
      '=> 1',
    ].join('\n')
    const imageMap = { img_test1: 'data:image/png;base64,AAA' }
    const result = parseExamText(text, imageMap)
    expect(result.errors).toEqual([])
    const q = result.source!.phanI[0]
    expect(q.imageDataUrl).toBe('data:image/png;base64,AAA')
    expect(q.text).not.toContain('[ANH:')
    expect(q.text).toContain('Quan sát đồ thị sau')
  })

  it('mergeAndStrip giữ nguyên bảng/ảnh khi gộp sang bản public (không phải bí mật cần xoá)', () => {
    const text = [
      'MÃ ĐỀ: giu-bang',
      'PHẦN I',
      '1) câu 1 [ANH:img_x]',
      'A. a',
      '*B. b',
      'C. c',
      'D. d',
      'PHẦN II',
      '1) c',
      'a) a (Đ)',
      'b) b (S)',
      'c) c (Đ)',
      'd) d (S)',
      'PHẦN III',
      '1) c',
      '=> 1',
    ].join('\n')
    const source = parseExamText(text, { img_x: 'data:image/png;base64,BBB' }).source!
    const bank = mergeAndStrip([source])
    expect(bank.phanI[0].imageDataUrl).toBe('data:image/png;base64,BBB')
    expect((bank.phanI[0] as unknown as { correct?: string }).correct).toBeUndefined()
  })
})

describe('mergeAndStrip', () => {
  it('gộp nhiều đề và xoá sạch đáp án đúng khỏi bản public', () => {
    const s1 = parseExamText(makeSampleText('a', 10, 3, 4)).source!
    const s2 = parseExamText(makeSampleText('b', 10, 3, 4)).source!
    const bank = mergeAndStrip([s1, s2])
    expect(bank.phanI).toHaveLength(20)
    expect(bank.phanII).toHaveLength(6)
    expect(bank.phanIII).toHaveLength(8)
    // Không còn field "correct" trong bản public
    expect((bank.phanI[0] as unknown as { correct?: string }).correct).toBeUndefined()
    // Id không trùng nhau giữa 2 đề (nhờ prefix theo mã đề)
    const ids = bank.phanI.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('exam-assign — random chọn câu theo học sinh', () => {
  const s1 = parseExamText(makeSampleText('nganhang', 40, 10, 12)).source!
  const bank = mergeAndStrip([s1])

  it('cùng 1 học sinh trong cùng 1 ca luôn nhận đúng 1 bộ câu cố định', () => {
    const a1 = assignStudentQuestions(bank, 'ca01', 'hs001')
    const a2 = assignStudentQuestions(bank, 'ca01', 'hs001')
    expect(a1.phanI.map((x) => x.qid)).toEqual(a2.phanI.map((x) => x.qid))
    expect(a1.phanI.map((x) => x.choicePerm)).toEqual(a2.phanI.map((x) => x.choicePerm))
  })

  it('2 học sinh khác nhau trong cùng ca thường nhận bộ câu khác nhau (ngân hàng đủ lớn)', () => {
    const a1 = assignStudentQuestions(bank, 'ca01', 'hs001')
    const a2 = assignStudentQuestions(bank, 'ca01', 'hs002')
    expect(a1.phanI.map((x) => x.qid)).not.toEqual(a2.phanI.map((x) => x.qid))
  })

  it('lấy đúng số câu cần dùng (18/4/6) khi ngân hàng đủ lớn', () => {
    const a = assignStudentQuestions(bank, 'ca01', 'hs003')
    expect(a.phanI).toHaveLength(18)
    expect(a.phanII).toHaveLength(4)
    expect(a.phanIII).toHaveLength(6)
  })

  it('ngân hàng nhỏ hơn mức cần thì lấy hết, không lỗi', () => {
    const smallSource = parseExamText(makeSampleText('nho', 5, 2, 3)).source!
    const smallBank = mergeAndStrip([smallSource])
    const a = assignStudentQuestions(smallBank, 'ca02', 'hs001')
    expect(a.phanI).toHaveLength(5)
    expect(a.phanII).toHaveLength(2)
    expect(a.phanIII).toHaveLength(3)
  })
})

describe('exam-grade — chấm bài từ ngân hàng câu hỏi khớp với engine chấm chuẩn', () => {
  it('học sinh trả lời đúng hết toàn bộ câu được gán thì được 10 điểm', () => {
    const s1 = parseExamText(makeSampleText('grade-test', 40, 10, 12)).source!
    const maCa = 'ca-grade'
    const sbd = 'hs042'
    const assignment = assignStudentQuestions(mergeAndStrip([s1]), maCa, sbd)

    const answers = emptyAnswerRecord()
    assignment.phanI.forEach((item) => {
      // Tìm lựa chọn hiển thị nào ứng với đáp án đúng gốc rồi trả lời đúng chữ cái GỐC
      // (đúng như ExamTakeScreen làm: lưu theo chữ cái gốc, không theo vị trí hiển thị)
      const correctLetter = s1.phanI.find((q) => q.id === item.qid)!.correct
      answers.phanI[item.qid] = correctLetter
    })
    assignment.phanII.forEach((item) => {
      const correct = s1.phanII.find((q) => q.id === item.qid)!.correct
      answers.phanII[item.qid] = [...correct]
    })
    assignment.phanIII.forEach((item) => {
      const correct = s1.phanIII.find((q) => q.id === item.qid)!.correct
      answers.phanIII[item.qid] = correct
    })

    const graded = gradeSubmissionFull([s1], maCa, sbd, answers)
    expect(graded.score.total).toBe(10)
    expect(graded.score.crossSumOk).toBe(true)
  })

  it('không trả lời gì thì được 0 điểm, không throw lỗi', () => {
    const s1 = parseExamText(makeSampleText('grade-empty', 20, 5, 8)).source!
    const graded = gradeSubmissionFull([s1], 'ca-empty', 'hs001', emptyAnswerRecord())
    expect(graded.score.total).toBe(0)
  })

  it('chấm lại (regrade) từ submission độc lập ra đúng kết quả y hệt lần đầu — vì assignment deterministic', () => {
    const s1 = parseExamText(makeSampleText('regrade', 40, 10, 12)).source!
    const maCa = 'ca-regrade'
    const sbd = 'hs777'
    const assignment = assignStudentQuestions(mergeAndStrip([s1]), maCa, sbd)
    const answers = emptyAnswerRecord()
    // Trả lời sai hết Phần I để kiểm tra điểm 0 phần đó, đúng hết Phần III
    assignment.phanI.forEach((item) => {
      const correct = s1.phanI.find((q) => q.id === item.qid)!.correct
      const wrong = (['A', 'B', 'C', 'D'] as const).find((l) => l !== correct)!
      answers.phanI[item.qid] = wrong
    })
    assignment.phanIII.forEach((item) => {
      const correct = s1.phanIII.find((q) => q.id === item.qid)!.correct
      answers.phanIII[item.qid] = correct
    })

    const graded1 = gradeSubmissionFull([s1], maCa, sbd, answers)
    const graded2 = gradeSubmissionFull([s1], maCa, sbd, answers)
    expect(graded1.score.total).toBe(graded2.score.total)
    expect(graded1.score.phanIScore).toBe(0)
    expect(graded1.score.phanIIIScore).toBe(1.5) // 6 câu x 0.25 đúng hết
  })
})
