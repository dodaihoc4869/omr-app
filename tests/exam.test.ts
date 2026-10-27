import { describe, expect, it } from 'vitest'
import { validateTeacherSource, mergeAndStrip, type TeacherExamSource } from '../src/data/examContent'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import { gradeSubmissionFull, gradeFromKeyBank } from '../src/lib/exam-grade'
import { hashSeed, seededPermutation } from '../src/lib/exam-shuffle'
import { emptyAnswerRecord } from '../src/lib/exam-db'

// Dựng đề mẫu thẳng thành đối tượng (bộ đọc văn bản đề exam-parse đã gỡ 27/10 vì không màn nào dùng).
// Cùng dạng bộ đọc cũ trả ra: id `${maDe}-pN-i`, Phần I đáp án xoay vòng A→D, Phần II Đ-S-Đ-S, Phần III "i+1,00".
function makeSampleSource(maDe: string, n1: number, n2: number, n3: number): TeacherExamSource {
  const letters = ['A', 'B', 'C', 'D'] as const
  return {
    maDe,
    phanI: Array.from({ length: n1 }, (_, i) => ({
      id: `${maDe}-p1-${i}`,
      text: `Câu hỏi phần I số ${i + 1} của ${maDe}`,
      choices: letters.map((l) => `Lựa chọn ${l} câu ${i + 1}`) as [string, string, string, string],
      correct: letters[i % 4],
    })),
    phanII: Array.from({ length: n2 }, (_, i) => ({
      id: `${maDe}-p2-${i}`,
      text: `Câu hỏi phần II số ${i + 1} của ${maDe}`,
      ideas: ['Ý a', 'Ý b', 'Ý c', 'Ý d'] as [string, string, string, string],
      correct: ['D', 'S', 'D', 'S'] as ['D', 'S', 'D', 'S'],
    })),
    phanIII: Array.from({ length: n3 }, (_, i) => ({
      id: `${maDe}-p3-${i}`,
      text: `Câu hỏi phần III số ${i + 1} của ${maDe}`,
      correct: `${i + 1},00`,
    })),
  }
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

describe('validateTeacherSource', () => {
  it('không bắt buộc đúng 18/4/6 câu — validateTeacherSource chỉ đòi >=1 mỗi phần', () => {
    expect(validateTeacherSource(makeSampleSource('de-nho', 3, 2, 2))).toEqual([])
  })
})

describe('mergeAndStrip', () => {
  it('gộp nhiều đề và xoá sạch đáp án đúng khỏi bản public', () => {
    const s1 = makeSampleSource('a', 10, 3, 4)
    const s2 = makeSampleSource('b', 10, 3, 4)
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

  it('mergeAndStrip giữ nguyên bảng/ảnh khi gộp sang bản public (không phải bí mật cần xoá)', () => {
    const source = makeSampleSource('giu-bang', 1, 1, 1)
    source.phanI[0] = { ...source.phanI[0], correct: 'B', imageDataUrl: 'data:image/png;base64,BBB' }
    const bank = mergeAndStrip([source])
    expect(bank.phanI[0].imageDataUrl).toBe('data:image/png;base64,BBB')
    expect((bank.phanI[0] as unknown as { correct?: string }).correct).toBeUndefined()
  })
})

describe('exam-assign — random chọn câu theo học sinh', () => {
  const s1 = makeSampleSource('nganhang', 40, 10, 12)
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
    const smallSource = makeSampleSource('nho', 5, 2, 3)
    const smallBank = mergeAndStrip([smallSource])
    const a = assignStudentQuestions(smallBank, 'ca02', 'hs001')
    expect(a.phanI).toHaveLength(5)
    expect(a.phanII).toHaveLength(2)
    expect(a.phanIII).toHaveLength(3)
  })
})

describe('exam-grade — chấm bài từ ngân hàng câu hỏi khớp với engine chấm chuẩn', () => {
  it('học sinh trả lời đúng hết toàn bộ câu được gán thì được 10 điểm', () => {
    const s1 = makeSampleSource('grade-test', 40, 10, 12)
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
    const s1 = makeSampleSource('grade-empty', 20, 5, 8)
    const graded = gradeSubmissionFull([s1], 'ca-empty', 'hs001', emptyAnswerRecord())
    expect(graded.score.total).toBe(0)
  })

  it('chấm lại (regrade) từ submission độc lập ra đúng kết quả y hệt lần đầu — vì assignment deterministic', () => {
    const s1 = makeSampleSource('regrade', 40, 10, 12)
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

  it('gradeFromKeyBank (dùng trực tiếp keyBank server trả về lúc nộp bài) liệt kê đúng câu sai theo thứ tự hiển thị', () => {
    const s1 = makeSampleSource('keybank-test', 8, 4, 4)
    const maCa = 'ca-keybank'
    const sbd = 'hs099'
    const keyBank = { phanI: s1.phanI, phanII: s1.phanII, phanIII: s1.phanIII }
    const assignment = assignStudentQuestions(keyBank, maCa, sbd)

    const answers = emptyAnswerRecord()
    // Câu 1 (displayIdx 0) trả lời sai, còn lại đúng hết.
    assignment.phanI.forEach((item, i) => {
      const correct = s1.phanI.find((q) => q.id === item.qid)!.correct
      if (i === 0) {
        const wrong = (['A', 'B', 'C', 'D'] as const).find((l) => l !== correct)!
        answers.phanI[item.qid] = wrong
      } else {
        answers.phanI[item.qid] = correct
      }
    })
    assignment.phanII.forEach((item) => {
      const correct = s1.phanII.find((q) => q.id === item.qid)!.correct
      answers.phanII[item.qid] = [...correct]
    })
    assignment.phanIII.forEach((item) => {
      const correct = s1.phanIII.find((q) => q.id === item.qid)!.correct
      answers.phanIII[item.qid] = correct
    })

    const graded = gradeFromKeyBank(keyBank, maCa, sbd, answers)
    expect(graded.wrongPhanI).toEqual([1])
    expect(graded.wrongPhanII).toEqual([])
    expect(graded.wrongPhanIII).toEqual([])
    // gradeFromKeyBank và gradeSubmissionFull phải cho CÙNG kết quả khi cùng nguồn dữ liệu
    // (gradeSubmissionFull chỉ là gradeFromKeyBank + gộp TeacherExamSource[] trước).
    const graded2 = gradeSubmissionFull([s1], maCa, sbd, answers)
    expect(graded2.wrongPhanI).toEqual(graded.wrongPhanI)
    expect(graded2.score.total).toBe(graded.score.total)
  })

  it('gradeFromKeyBank: đáp án Phần III lệch dấu phẩy/chấm hoặc có khoảng trắng vẫn được coi là đúng', () => {
    const s1 = makeSampleSource('keybank-norm', 2, 2, 4)
    const maCa = 'ca-keybank-norm'
    const sbd = 'hs100'
    const keyBank = { phanI: s1.phanI, phanII: s1.phanII, phanIII: s1.phanIII }
    const assignment = assignStudentQuestions(keyBank, maCa, sbd)

    const answers = emptyAnswerRecord()
    assignment.phanIII.forEach((item) => {
      const correct = s1.phanIII.find((q) => q.id === item.qid)!.correct // dạng "N,00"
      answers.phanIII[item.qid] = ` ${correct.replace(',', '.')} ` // đổi dấu phẩy -> chấm + thêm khoảng trắng thừa
    })

    const graded = gradeFromKeyBank(keyBank, maCa, sbd, answers)
    expect(graded.wrongPhanIII).toEqual([])
  })
})

// ĐÁP ÁN KHÔNG BAO GIỜ XUỐNG MÁY EM LÚC ĐANG THI.
// Đây là điểm dễ hỏng nhất mà không ai thấy: chỉ cần một lần thêm trường vào
// bản công khai là em mở công cụ nhà phát triển đọc được đáp án, mà app vẫn
// chạy đúng nên không test nào khác báo. Khoá cứng ở đây.
describe('Bản đề gửi máy em KHÔNG chứa đáp án', () => {
  const nguon = makeSampleSource('bi-mat', 4, 2, 2)

  it('bản gốc của thầy CÓ đáp án — nếu không thì test dưới vô nghĩa', () => {
    expect(nguon.phanI[0]).toHaveProperty('correct')
    expect(nguon.phanII[0]).toHaveProperty('correct')
    expect(nguon.phanIII[0]).toHaveProperty('correct')
  })

  it('bản công khai không còn trường đáp án nào', () => {
    const cong = mergeAndStrip([nguon])
    for (const q of [...cong.phanI, ...cong.phanII, ...cong.phanIII]) {
      expect(q).not.toHaveProperty('correct')
      expect(q).not.toHaveProperty('solution')
      expect(q).not.toHaveProperty('loiGiai')
      expect(q).not.toHaveProperty('dapAn')
    }
  })

  it('không có chuỗi đáp án nào lọt qua dạng JSON', () => {
    const chuoi = JSON.stringify(mergeAndStrip([nguon]))
    expect(chuoi).not.toContain('"correct"')
    expect(chuoi).not.toContain('"solution"')
  })

  it('đề đã xáo gửi cho từng em cũng không mang đáp án', () => {
    const cong = mergeAndStrip([nguon])
    const de = assignStudentQuestions(cong, '123456', '001')
    expect(JSON.stringify(de)).not.toContain('"correct"')
  })
})
