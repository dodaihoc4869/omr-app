import { describe, expect, it } from 'vitest'
import { scoreStudent, type AnswerKey, type StudentAnswers, type GradedItem, type Choice, type DS } from '../src/engine/score'

// Bài đối chứng "Lê Minh Đức" — dùng làm test bắt buộc trong Định nghĩa hoàn thành
// của OMR-APP.md: tổng phải ra đúng 6,60 (3,50 · 2,35 · 0,75).
//   Phần I : đúng 14/18 câu  → 14 × 0,25 = 3,50
//   Phần II: câu 1 đúng 4 ý (1,0) · câu 2 đúng 4 ý (1,0) · câu 3 đúng 2 ý (0,25)
//            · câu 4 đúng 1 ý (0,1) → tổng 2,35
//   Phần III: đúng 3/6 câu → 3 × 0,25 = 0,75

function item<T>(value: T | null, flag: GradedItem<T>['flag'] = null): GradedItem<T> {
  return { value, flag }
}

const KEY: AnswerKey = {
  madeThi: '101',
  phanI: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'] as Choice[],
  phanII: [
    ['D', 'S', 'D', 'S'],
    ['S', 'D', 'S', 'D'],
    ['D', 'D', 'S', 'S'],
    ['S', 'S', 'D', 'D'],
  ] as DS[][],
  phanIII: ['-0,87', '12', '3,5', '100', '-5', '0,25'],
}

function buildDucAnswers(): StudentAnswers {
  // Phần I: đúng 14/18 — sai chủ đích 4 câu cuối cùng của mỗi nhóm ABCD
  // (index 3, 7, 11, 15 — các câu đáp án đúng là D nhưng học sinh tô A)
  const phanI: GradedItem<Choice>[] = KEY.phanI.map((correct, i) => {
    const wrongIndexes = [3, 7, 11, 15]
    if (wrongIndexes.includes(i)) return item<Choice>('A')
    return item<Choice>(correct)
  })

  const phanII: GradedItem<DS>[][] = [
    KEY.phanII[0].map((v) => item<DS>(v)), // câu 1: đúng cả 4 ý
    KEY.phanII[1].map((v) => item<DS>(v)), // câu 2: đúng cả 4 ý
    [item<DS>(KEY.phanII[2][0]), item<DS>(KEY.phanII[2][1]), item<DS>('D'), item<DS>('D')], // câu 3: đúng 2/4
    [item<DS>(KEY.phanII[3][0]), item<DS>('D'), item<DS>('S'), item<DS>('S')], // câu 4: đúng 1/4
  ]

  const phanIII: GradedItem<string>[] = [
    item<string>('-0.87'), // đúng, viết dấu chấm thay vì phẩy — phải được chuẩn hoá là khớp
    item<string>('12'), // đúng
    item<string>('9,9'), // sai
    item<string>('100'), // đúng
    item<string>('0', 'WARN_ERASURE'), // sai + có cờ tẩy mờ
    item<string>('0,26'), // sai
  ]

  return { sbd: '000123', madeThi: '101', phanI, phanII, phanIII }
}

describe('scoreStudent — bài đối chứng Lê Minh Đức', () => {
  it('ra đúng 6,60 (3,50 · 2,35 · 0,75) và cộng chéo khớp', () => {
    const result = scoreStudent(buildDucAnswers(), KEY)

    expect(result.phanIScore).toBe(3.5)
    expect(result.phanIIScore).toBe(2.35)
    expect(result.phanIIIScore).toBe(0.75)
    expect(result.total).toBe(6.6)
    expect(result.crossSumOk).toBe(true)
    expect(result.phanIScore + result.phanIIScore + result.phanIIIScore).toBeCloseTo(result.total, 10)
    expect(result.remainingFlags).toBe(1) // ô WARN_ERASURE ở Phần III câu 5
  })
})

describe('scoreStudent — ca biên', () => {
  it('ERR_DOUBLE_MARK luôn tính 0 điểm câu đó dù value trùng đáp án', () => {
    const key: AnswerKey = { madeThi: '101', phanI: ['A'], phanII: [], phanIII: [] }
    const answers: StudentAnswers = {
      sbd: '000001',
      madeThi: '101',
      phanI: [item<Choice>('A', 'ERR_DOUBLE_MARK')],
      phanII: [],
      phanIII: [],
    }
    const result = scoreStudent(answers, key)
    expect(result.phanIScore).toBe(0)
    expect(result.remainingFlags).toBe(1)
  })

  it('điểm tối đa đúng 10,00 khi làm đúng toàn bộ', () => {
    const fullKey: AnswerKey = {
      madeThi: '101',
      phanI: new Array(18).fill('A') as Choice[],
      phanII: new Array(4).fill(['D', 'S', 'D', 'S']) as DS[][],
      phanIII: new Array(6).fill('1,00'),
    }
    const fullAnswers: StudentAnswers = {
      sbd: '000002',
      madeThi: '101',
      phanI: fullKey.phanI.map((v) => item<Choice>(v)),
      phanII: fullKey.phanII.map((q) => q.map((v) => item<DS>(v))),
      phanIII: fullKey.phanIII.map((v) => item<string>(v)),
    }
    const result = scoreStudent(fullAnswers, fullKey)
    expect(result.total).toBe(10)
  })
})
