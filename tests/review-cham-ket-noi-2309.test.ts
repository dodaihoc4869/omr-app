import { describe, expect, it } from 'vitest'
import { assignStudentQuestions } from '../src/lib/exam-assign'
import { gradeFromKeyBank } from '../src/lib/exam-grade'
import { taoChiTietCau } from '../src/lib/chi-tiet-cau'
import { scorePhanIII } from '../src/engine/score'
import type { AnswerRecord } from '../src/lib/exam-db'
import { gradeMom } from '../server/src/mom'

const bank = {
  phanI: [{ id: 'I-1', text: 'Câu chọn', choices: ['đúng', 'sai 1', 'sai 2', 'sai 3'], correct: 'A' }],
  phanII: [{ id: 'II-1', text: 'Câu đúng sai', ideas: ['ý 1', 'ý 2', 'ý 3', 'ý 4'], correct: ['D', 'S', 'D', 'S'] }],
  phanIII: [{ id: 'III-1', text: 'Câu số', correct: '−0,54' }],
  soCau: { I: 1, II: 1, III: 1 },
} as unknown as Parameters<typeof gradeFromKeyBank>[0]

describe('review đường hiển thị → lưu theo gốc → chấm', () => {
  it('phương án I và ý II đã xáo vẫn chấm đúng cùng chi tiết từng câu', () => {
    const maCa = 'review-2309'
    const sbd = Array.from({ length: 100 }, (_, i) => `HS${i}`).find((em) => {
      const a = assignStudentQuestions(bank, maCa, em)
      return a.phanI[0]!.choicePerm[0] !== 0 && a.phanII[0]!.yPerm.join('') !== '0123'
    })!
    expect(sbd).toBeTruthy()
    const a = assignStudentQuestions(bank, maCa, sbd)
    // UI vẽ câu I theo choicePerm nhưng onSelect nhận chữ gốc; II nhận chỉ số ý gốc.
    const viTriDungI = a.phanI[0]!.choicePerm.indexOf(0)
    const chonI = 'ABCD'[a.phanI[0]!.choicePerm[viTriDungI]!]!
    const chonII = Array(4).fill(null) as (string | null)[]
    a.phanII[0]!.yPerm.forEach((goc) => { chonII[goc] = ['D', 'S', 'D', 'S'][goc]! })
    const submitted: AnswerRecord = { phanI: { 'I-1': chonI as 'A' }, phanII: { 'II-1': chonII as ['D', 'S', 'D', 'S'] }, phanIII: { 'III-1': '-0.54' } }
    const graded = gradeFromKeyBank(bank, maCa, sbd, submitted)
    const details = taoChiTietCau(bank, maCa, sbd, submitted, null)
    expect(graded.score.total).toBe(10)
    expect([graded.wrongPhanI, graded.wrongPhanII, graded.wrongPhanIII]).toEqual([[], [], []])
    expect(details.map((x) => x.dungSai)).toEqual([true, true, true])
  })

  it('khóa số Phần III sai cấu trúc phải báo lỗi thay vì tính điểm', () => {
    expect(() => scorePhanIII([{ value: 'abc', flag: null }], ['abc'], 100)).toThrow(/khóa đáp án không hợp lệ/i)
  })

  it('Mom thiếu khóa trắc nghiệm không được tự coi A là đáp án đúng', () => {
    expect(gradeMom([{ id: 'I-1', phan: 'I' }], { 'I-1': 'A' }).soCauDung).toBe(0)
  })
})
