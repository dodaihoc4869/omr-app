// BIỂU ĐIỂM THEO SỐ CÂU CỦA CA — thầy báo 07/09, ca 248567.
//
// Ca đó rút 8 câu Phần I, 2 câu Phần II, 2 câu Phần III. Luật cũ chốt cứng
// 0,25đ/câu nên trần điểm chỉ còn 4,50 mà bảng điểm vẫn ghi thang 10.
//
// Hai điều phải khoá lại, cùng lúc:
//   1. Ca số câu bất kỳ vẫn ra trần đúng 10,00.
//   2. Ca đủ 18/4/6 ra Y HỆT luật cũ — không ca cũ nào bị đổi điểm.
import { describe, expect, it } from 'vitest'
import {
  moTaBieuDiem,
  quotaPhan,
  scoreStudent,
  TI_LE_PHAN,
  TONG_CENTS,
  type AnswerKey,
  type Choice,
  type DS,
  type GradedItem,
  type StudentAnswers,
} from '../src/engine/score'

function it_<T>(value: T | null, flag: GradedItem<T>['flag'] = null): GradedItem<T> {
  return { value, flag }
}

/** Đề giả lập: n câu Phần I (đáp án 'A'), m câu Phần II (D S D S), k câu Phần III. */
function deGia(n: number, m: number, k: number): AnswerKey {
  return {
    madeThi: '101',
    phanI: new Array(n).fill('A') as Choice[],
    phanII: new Array(m).fill(null).map(() => ['D', 'S', 'D', 'S'] as DS[]),
    phanIII: new Array(k).fill('1'),
  }
}

/** Bài làm: đúng `dungI` câu đầu Phần I, `yDung` ý mỗi câu Phần II, `dungIII` câu Phần III. */
function baiLam(key: AnswerKey, dungI: number, yDung: number, dungIII: number): StudentAnswers {
  return {
    sbd: '000001',
    madeThi: key.madeThi,
    phanI: key.phanI.map((v, i) => it_<Choice>(i < dungI ? v : v === 'A' ? 'B' : 'A')),
    phanII: key.phanII.map((row) => row.map((v, j) => it_<DS>(j < yDung ? v : v === 'D' ? 'S' : 'D'))),
    phanIII: key.phanIII.map((v, i) => it_<string>(i < dungIII ? v : 'sai')),
  }
}

describe('quota — 1 000 cents chia theo tỉ lệ chuẩn 450 · 400 · 150', () => {
  it('đủ ba phần thì chia đúng tỉ lệ của đề chuẩn, không xê dịch', () => {
    expect(quotaPhan({ I: 18, II: 4, III: 6 })).toEqual(TI_LE_PHAN)
    expect(quotaPhan({ I: 8, II: 2, III: 2 })).toEqual(TI_LE_PHAN)
    expect(quotaPhan({ I: 1, II: 1, III: 1 })).toEqual(TI_LE_PHAN)
  })

  it('phần KHÔNG có câu nào thì nhường quota, trần vẫn là 10,00', () => {
    // Thiếu Phần II: 450 và 150 chuẩn hoá thành 750 và 250.
    expect(quotaPhan({ I: 8, II: 0, III: 2 })).toEqual({ I: 750, II: 0, III: 250 })
    // Chỉ có Phần I: ăn trọn 1 000.
    expect(quotaPhan({ I: 5, II: 0, III: 0 })).toEqual({ I: 1000, II: 0, III: 0 })
    // Không có câu nào: không chia gì cả, không được bịa ra điểm.
    expect(quotaPhan({ I: 0, II: 0, III: 0 })).toEqual({ I: 0, II: 0, III: 0 })
  })

  it('tổng quota LUÔN đúng 1 000 cents dù chia không hết', () => {
    const bo: { I: number; II: number; III: number }[] = [
      { I: 18, II: 4, III: 6 },
      { I: 8, II: 2, III: 2 },
      { I: 7, II: 3, III: 5 },
      { I: 1, II: 0, III: 1 },
      { I: 0, II: 3, III: 0 },
      { I: 25, II: 8, III: 12 },
    ]
    for (const so of bo) {
      const q = quotaPhan(so)
      expect(q.I + q.II + q.III).toBe(TONG_CENTS)
    }
  })
})

describe('trần điểm — làm đúng hết luôn ra 10,00', () => {
  const bo: [number, number, number][] = [
    [18, 4, 6],
    [8, 2, 2],
    [7, 3, 5],
    [40, 1, 1],
    [1, 1, 1],
    [8, 0, 2],
    [5, 0, 0],
  ]
  for (const [n, m, k] of bo) {
    it(`ca ${n}/${m}/${k} — đúng hết = 10,00`, () => {
      const key = deGia(n, m, k)
      const kq = scoreStudent(baiLam(key, n, 4, k), key)
      expect(kq.total).toBe(10)
      expect(kq.crossSumOk).toBe(true)
      expect(kq.phanIScore + kq.phanIIScore + kq.phanIIIScore).toBeCloseTo(10, 10)
    })
  }
})

describe('ca 8/2/2 của thầy — ca 248567', () => {
  const key = deGia(8, 2, 2)

  it('trần từng phần đúng 4,50 · 4,00 · 1,50', () => {
    const kq = scoreStudent(baiLam(key, 8, 4, 2), key)
    expect(kq.phanIScore).toBe(4.5)
    expect(kq.phanIIScore).toBe(4)
    expect(kq.phanIIIScore).toBe(1.5)
    expect(kq.quota).toEqual({ I: 450, II: 400, III: 150 })
  })

  it('sai hết ra 0,00 chứ không âm', () => {
    const kq = scoreStudent(baiLam(key, 0, 0, 0), key)
    expect(kq.total).toBe(0)
  })

  it('đúng 7/8 câu Phần I = 3,94 (4,5 × 7/8 = 3,9375, làm tròn lên)', () => {
    const kq = scoreStudent(baiLam(key, 7, 0, 0), key)
    expect(kq.phanIScore).toBe(3.94)
  })

  it('Phần II: 2 câu × 4 ý = 4,00; mỗi câu đúng 3 ý = 1,00 → tổng 2,00', () => {
    expect(scoreStudent(baiLam(key, 0, 4, 0), key).phanIIScore).toBe(4)
    expect(scoreStudent(baiLam(key, 0, 3, 0), key).phanIIScore).toBe(2)
    expect(scoreStudent(baiLam(key, 0, 2, 0), key).phanIIScore).toBe(1)
    expect(scoreStudent(baiLam(key, 0, 1, 0), key).phanIIScore).toBe(0.4)
  })

  it('Phần III: mỗi câu 0,75', () => {
    expect(scoreStudent(baiLam(key, 0, 0, 1), key).phanIIIScore).toBe(0.75)
    expect(scoreStudent(baiLam(key, 0, 0, 2), key).phanIIIScore).toBe(1.5)
  })
})

describe('CÔNG BẰNG — cùng số câu đúng thì cùng điểm, trượt câu nào cũng vậy', () => {
  it('8 câu Phần I: mọi cách trượt đúng 1 câu đều ra một điểm', () => {
    const key = deGia(8, 0, 0)
    const diem = new Set<number>()
    for (let truot = 0; truot < 8; truot++) {
      const answers: StudentAnswers = {
        sbd: '000001',
        madeThi: '101',
        phanI: key.phanI.map((v, i) => it_<Choice>(i === truot ? 'B' : v)),
        phanII: [],
        phanIII: [],
      }
      diem.add(scoreStudent(answers, key).phanIScore)
    }
    // Một giá trị duy nhất. Nếu chia quota thành 8 phần nguyên rồi cộng thì
    // đây là 2 giá trị lệch nhau 0,01 — chính là lối làm đã bị loại.
    expect(diem.size).toBe(1)
  })
})

describe('KHÔNG ĐỔI ĐIỂM CA CŨ — đề chuẩn 18/4/6 giữ nguyên luật cũ', () => {
  it('mỗi câu Phần I và Phần III đúng 0,25; Phần II 0,1 · 0,25 · 0,5 · 1,0', () => {
    const key = deGia(18, 4, 6)
    // Phần I: từng mốc số câu đúng phải là bội của 0,25.
    for (let d = 0; d <= 18; d++) {
      expect(scoreStudent(baiLam(key, d, 0, 0), key).phanIScore).toBeCloseTo(0.25 * d, 10)
    }
    for (let d = 0; d <= 6; d++) {
      expect(scoreStudent(baiLam(key, 0, 0, d), key).phanIIIScore).toBeCloseTo(0.25 * d, 10)
    }
    // Phần II: 4 câu cùng số ý đúng.
    expect(scoreStudent(baiLam(key, 0, 1, 0), key).phanIIScore).toBeCloseTo(0.4, 10)
    expect(scoreStudent(baiLam(key, 0, 2, 0), key).phanIIScore).toBeCloseTo(1, 10)
    expect(scoreStudent(baiLam(key, 0, 3, 0), key).phanIIScore).toBeCloseTo(2, 10)
    expect(scoreStudent(baiLam(key, 0, 4, 0), key).phanIIScore).toBeCloseTo(4, 10)
  })
})

describe('moTaBieuDiem — dòng chữ em đọc trên màn làm bài phải khớp máy chấm', () => {
  it('chia hết thì nói thẳng điểm mỗi câu', () => {
    expect(moTaBieuDiem({ I: 18, II: 4, III: 6 }, 'I')).toBe('Mỗi câu đúng 0,25 điểm (18 câu, 4,5 điểm)')
    expect(moTaBieuDiem({ I: 18, II: 4, III: 6 }, 'III')).toBe('Mỗi câu đúng 0,25 điểm (6 câu, 1,5 điểm)')
  })

  it('chia không hết thì nói trần cả phần, KHÔNG in con số lẻ cộng lại không khớp', () => {
    expect(moTaBieuDiem({ I: 8, II: 2, III: 2 }, 'I')).toBe('8 câu chia đều 4,5 điểm')
    expect(moTaBieuDiem({ I: 8, II: 2, III: 2 }, 'III')).toBe('Mỗi câu đúng 0,75 điểm (2 câu, 1,5 điểm)')
  })

  it('Phần II nói đủ bốn mốc ý, theo trần thật của ca', () => {
    expect(moTaBieuDiem({ I: 18, II: 4, III: 6 }, 'II')).toBe(
      '4 câu, tối đa 4 điểm · trong một câu: 1 ý 0,1đ · 2 ý 0,25đ · 3 ý 0,5đ · cả 4 ý 1đ',
    )
    expect(moTaBieuDiem({ I: 8, II: 2, III: 2 }, 'II')).toBe(
      '2 câu, tối đa 4 điểm · trong một câu: 1 ý 0,2đ · 2 ý 0,5đ · 3 ý 1đ · cả 4 ý 2đ',
    )
  })

  it('phần không có câu nào thì không nói gì', () => {
    expect(moTaBieuDiem({ I: 8, II: 0, III: 2 }, 'II')).toBe('')
  })
})

describe('cờ và ca hỏng', () => {
  it('ERR_DOUBLE_MARK vẫn ăn 0 điểm câu đó dù tô trùng đáp án', () => {
    const key = deGia(8, 0, 0)
    const answers: StudentAnswers = {
      sbd: '1',
      madeThi: '101',
      phanI: key.phanI.map((v, i) => it_<Choice>(v, i === 0 ? 'ERR_DOUBLE_MARK' : null)),
      phanII: [],
      phanIII: [],
    }
    const kq = scoreStudent(answers, key)
    expect(kq.phanIScore).toBe(8.75) // 7/8 của 1 000 cents
    expect(kq.remainingFlags).toBe(1)
  })

  it('Phần II có số ý khác 4 thì BÁO LỖI, không trả NaN', () => {
    const key: AnswerKey = { madeThi: '101', phanI: [], phanII: [['D', 'S', 'D'] as DS[]], phanIII: [] }
    const answers: StudentAnswers = {
      sbd: '1',
      madeThi: '101',
      phanI: [],
      phanII: [[it_<DS>('D'), it_<DS>('S'), it_<DS>('D')]],
      phanIII: [],
    }
    expect(() => scoreStudent(answers, key)).toThrow(/3 ý/)
  })
})
