import { describe, expect, it } from 'vitest'
import { khoaCau, khuTrungNguon, laNhanhBoDe, tongBoQua } from '../src/lib/khu-trung-cau'
import type { TeacherExamSource } from '../src/data/examContent'

// Dựng câu tối thiểu, chỉ đủ trường mà luật khử trùng đọc tới.
const mcq = (ma: string, so: number, de: string, pa = ['a', 'b', 'c', 'd']) =>
  ({ id: `${ma}-I-${so}`, text: de, choices: pa, correct: 'A' }) as never
const ds4 = (ma: string, so: number, de: string, y = ['a', 'b', 'c', 'd']) =>
  ({ id: `${ma}-II-${so}`, text: de, ideas: y, correct: ['D', 'S', 'D', 'S'] }) as never
const tln = (ma: string, so: number, de: string) => ({ id: `${ma}-III-${so}`, text: de, correct: '1' }) as never

const de = (maDe: string, nhom: string, I: unknown[] = [], II: unknown[] = [], III: unknown[] = []): TeacherExamSource =>
  ({ maDe, nhom, phanI: I, phanII: II, phanIII: III }) as TeacherExamSource

describe('laNhanhBoDe', () => {
  it('nhận nhóm Bộ đề có phần khối phía trước', () => {
    expect(laNhanhBoDe({ nhom: '12 · Bộ đề chuẩn cấu trúc' })).toBe(true)
  })
  it('nhận nhóm Bộ đề không có phần khối', () => {
    expect(laNhanhBoDe({ nhom: 'Bộ đề chuẩn cấu trúc' })).toBe(true)
  })
  it('nhánh theo bài KHÔNG phải Bộ đề', () => {
    expect(laNhanhBoDe({ nhom: '12 · C1 - Ester – Lipid' })).toBe(false)
    expect(laNhanhBoDe({ nhom: '' })).toBe(false)
    expect(laNhanhBoDe({ nhom: undefined })).toBe(false)
  })
})

describe('khoaCau', () => {
  it('cùng thân câu nhưng khác phương án thì KHÁC khoá', () => {
    expect(khoaCau({ text: 'Chất nào tan?', choices: ['A1', 'B', 'C', 'D'] })).not.toBe(
      khoaCau({ text: 'Chất nào tan?', choices: ['A2', 'B', 'C', 'D'] }),
    )
  })
  it('chỉ khác khoảng trắng thì CÙNG khoá', () => {
    expect(khoaCau({ text: ' Chất  nào tan?\n', choices: ['a', 'b', 'c', 'd'] })).toBe(
      khoaCau({ text: 'Chất nào tan?', choices: ['a', 'b', 'c', 'd'] }),
    )
  })
  it('KHÔNG hạ chữ thường — Cl khác cl', () => {
    expect(khoaCau({ text: 'Cl2', choices: [] })).not.toBe(khoaCau({ text: 'cl2', choices: [] }))
  })
})

describe('khuTrungNguon — luật thầy chốt 09/09: trùng thì lấy bản ở Bộ đề', () => {
  it('bỏ bản THEO BÀI, giữ bản BỘ ĐỀ, dù bản theo bài đứng trước', () => {
    const theoBai = de('12-C1-B1-D1', '12 · C1 - Ester – Lipid', [mcq('12-C1-B1-D1', 7, 'Ester X là?')])
    const boDe = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('100', 3, 'Ester X là?')])
    const kq = khuTrungNguon([theoBai, boDe])
    expect(kq.nguon.map((s) => s.maDe)).toEqual(['100'])
    expect(kq.nguon[0].phanI).toHaveLength(1)
    expect(tongBoQua(kq.boQua)).toBe(1)
  })

  it('bản BỘ ĐỀ đứng trước cũng ra cùng kết quả', () => {
    const boDe = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('100', 3, 'Ester X là?')])
    const theoBai = de('12-C1-B1-D1', '12 · C1 - Ester – Lipid', [mcq('12-C1-B1-D1', 7, 'Ester X là?')])
    const kq = khuTrungNguon([boDe, theoBai])
    expect(kq.nguon.map((s) => s.maDe)).toEqual(['100'])
    expect(tongBoQua(kq.boQua)).toBe(1)
  })

  it('câu KHÔNG trùng thì giữ cả hai', () => {
    const theoBai = de('12-C1-B1-D1', '12 · C1 - Ester – Lipid', [mcq('a', 1, 'Câu riêng của nhánh bài')])
    const boDe = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('b', 1, 'Câu riêng của Bộ đề')])
    const kq = khuTrungNguon([theoBai, boDe])
    expect(kq.nguon).toHaveLength(2)
    expect(tongBoQua(kq.boQua)).toBe(0)
  })

  it('bỏ trùng đủ cả ba phần và đếm đúng từng phần', () => {
    const bai = de(
      'B',
      '12 · C1 - Ester – Lipid',
      [mcq('B', 1, 'I chung'), mcq('B', 2, 'I riêng')],
      [ds4('B', 1, 'II chung')],
      [tln('B', 1, 'III chung')],
    )
    const bo = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('100', 1, 'I chung')], [ds4('100', 1, 'II chung')], [tln('100', 1, 'III chung')])
    const kq = khuTrungNguon([bai, bo])
    expect(kq.boQua).toEqual({ I: 1, II: 1, III: 1 })
    expect(kq.nguon.find((s) => s.maDe === 'B')!.phanI.map((q) => q.text)).toEqual(['I riêng'])
  })

  it('nguồn sạch hết câu thì biến mất khỏi danh sách', () => {
    const bai = de('B', '12 · C1 - Ester – Lipid', [mcq('B', 1, 'X')])
    const bo = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('100', 1, 'X')])
    expect(khuTrungNguon([bai, bo]).nguon.map((s) => s.maDe)).toEqual(['100'])
  })

  it('KHÔNG có nguồn Bộ đề nào ⇒ giữ nguyên, không đổi hành vi ca cũ', () => {
    const a = de('A', '12 · C1 - Ester – Lipid', [mcq('A', 1, 'Câu 1'), mcq('A', 2, 'Câu 2')])
    const b = de('B', '12 · C2 - Carbohydrate', [mcq('B', 1, 'Câu 3')])
    const kq = khuTrungNguon([a, b])
    expect(kq.nguon).toEqual([a, b])
    expect(tongBoQua(kq.boQua)).toBe(0)
  })

  it('hai nhánh bài trùng nhau thì bản đầu tiên thắng', () => {
    const a = de('A', '12 · C1 - Ester – Lipid', [mcq('A', 1, 'X')])
    const b = de('B', '12 · C2 - Carbohydrate', [mcq('B', 1, 'X')])
    expect(khuTrungNguon([a, b]).nguon.map((s) => s.maDe)).toEqual(['A'])
  })

  it('danh sách rỗng không nổ', () => {
    expect(khuTrungNguon([])).toEqual({ nguon: [], boQua: { I: 0, II: 0, III: 0 } })
  })

  it('không sửa mảng gốc của thầy', () => {
    const bai = de('B', '12 · C1 - Ester – Lipid', [mcq('B', 1, 'X'), mcq('B', 2, 'Y')])
    const bo = de('100', '12 · Bộ đề chuẩn cấu trúc', [mcq('100', 1, 'X')])
    khuTrungNguon([bai, bo])
    expect(bai.phanI).toHaveLength(2)
  })
})
