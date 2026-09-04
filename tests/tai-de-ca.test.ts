import { describe, expect, it } from 'vitest'
import type { TeacherExamSource, TeacherMcqQuestion, TeacherShortAnswerQuestion, TeacherTrueFalseQuestion } from '../src/data/examContent'
import { cauLuyenTuBoCau, cauLuyenTuNguon } from '../src/lib/bai-tap-pdf'

const mcq = (id: string, o: Partial<TeacherMcqQuestion> = {}): TeacherMcqQuestion => ({
  id,
  text: `Đề ${id}`,
  choices: ['a', 'b', 'c', 'd'],
  correct: 'B',
  chuyenDe: 'Ester – lipid',
  mucDo: 'hieu',
  loiGiai: { chot: 'chốt', tungPa: { A: { dung: false, viSao: 'sai a' }, B: { dung: true, viSao: 'đúng b' } } },
  ...o,
})
const tf = (id: string): TeacherTrueFalseQuestion => ({ id, text: `Đề ${id}`, ideas: ['ya', 'yb', 'yc', 'yd'], correct: ['D', 'S', 'D', 'S'] })
const sa = (id: string): TeacherShortAnswerQuestion => ({ id, text: `Đề ${id}`, correct: '12', loiGiai: { chot: 'c', buoc: ['b1'], ketQua: 'kq' } })

const KHO: TeacherExamSource[] = [
  { maDe: 'A', phanI: [mcq('a1'), mcq('a2')], phanII: [tf('a3')], phanIII: [sa('a4')] },
  { maDe: 'B', phanI: [mcq('b1')], phanII: [], phanIII: [] },
]

describe('cauLuyenTuNguon — in ĐÚNG đề của ca', () => {
  it('lấy HẾT câu, không lọc chuyên đề, không bỏ câu nào', () => {
    expect(cauLuyenTuNguon(KHO).map((c) => c.id)).toEqual(['a1', 'a2', 'a3', 'a4', 'b1'])
  })

  it('giữ nguyên thứ tự gốc — in khác thứ tự là không đối chiếu được với bài em đã làm', () => {
    const ra = cauLuyenTuNguon([KHO[0]])
    expect(ra.map((c) => c.phan)).toEqual(['I', 'I', 'II', 'III'])
  })

  it('KHÔNG bỏ câu có hình như phiếu luyện — đây là đề thật của ca', () => {
    const coHinh: TeacherExamSource[] = [{ maDe: 'H', phanI: [mcq('h1', { thanCauImg: 'data:image/png;base64,AA' })], phanII: [], phanIII: [] }]
    expect(cauLuyenTuNguon(coHinh)).toHaveLength(1)
  })

  it('mang theo đáp án, câu chốt và lý do từng phương án', () => {
    const c = cauLuyenTuNguon([KHO[0]])[0]
    expect(c.dapAn).toBe('B')
    expect(c.chot).toBe('chốt')
    expect(c.lyDo?.map((l) => l.khoa)).toEqual(['A', 'B'])
    expect(c.lyDo?.find((l) => l.khoa === 'B')?.dung).toBe(true)
  })

  it('Phần II gộp đáp án thành chuỗi DSDS', () => {
    expect(cauLuyenTuNguon([KHO[0]]).find((c) => c.id === 'a3')?.dapAn).toBe('DSDS')
  })

  it('Phần III mang theo các bước và kết quả', () => {
    const c = cauLuyenTuNguon([KHO[0]]).find((x) => x.id === 'a4')!
    expect(c.dapAn).toBe('12')
    expect(c.buoc).toEqual(['b1'])
    expect(c.ketQua).toBe('kq')
  })

  it('kho rỗng thì trả mảng rỗng, không nổ', () => {
    expect(cauLuyenTuNguon([])).toEqual([])
  })
})

describe('cauLuyenTuBoCau — in ĐÚNG bộ câu một em đã làm', () => {
  it('giữ đúng thứ tự máy đã gán cho em, không xáo lại', () => {
    const bo = [
      { phan: 'I' as const, q: mcq('x2') },
      { phan: 'I' as const, q: mcq('x1') },
      { phan: 'III' as const, q: sa('x3') },
    ]
    expect(cauLuyenTuBoCau(bo).map((c) => c.id)).toEqual(['x2', 'x1', 'x3'])
  })

  it('bộ rỗng thì trả mảng rỗng', () => {
    expect(cauLuyenTuBoCau([])).toEqual([])
  })
})
