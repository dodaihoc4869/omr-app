// RÚT CÂU BÀI TẬP VỀ NHÀ (BA-APP.md đợt 3) — kiểm chứng 4: giao đúng số câu,
// đúng chuyên đề, ưu tiên câu em CHƯA từng làm.
import { describe, expect, it } from 'vitest'
import { chiaSoCau, demCauTheoChuyenDe, khopLoc, rutBaiTap, SO_CAU_BAI_TAP_TOI_DA } from '../src/lib/bai-tap'
import type { TeacherExamSource } from '../src/data/examContent'

const mcq = (id: string, chuyenDe: string, mucDo: string) => ({
  id,
  text: 'Câu ' + id,
  choices: ['A', 'B', 'C', 'D'] as [string, string, string, string],
  correct: 'A' as const,
  chuyenDe,
  mucDo: mucDo as 'biet' | 'hieu' | 'van_dung',
})
const tf = (id: string, chuyenDe: string, mucDo: string) => ({
  id,
  text: 'Câu ' + id,
  ideas: ['a', 'b', 'c', 'd'] as [string, string, string, string],
  correct: ['D', 'S', 'D', 'S'] as ['D' | 'S', 'D' | 'S', 'D' | 'S', 'D' | 'S'],
  chuyenDe,
  mucDo: mucDo as 'biet' | 'hieu' | 'van_dung',
})
const sa = (id: string, chuyenDe: string, mucDo: string) => ({
  id,
  text: 'Câu ' + id,
  correct: '1,5',
  chuyenDe,
  mucDo: mucDo as 'biet' | 'hieu' | 'van_dung',
})

/** Kho giả: 30 câu phần I, 8 phần II, 10 phần III; hai chuyên đề, hai mức độ. */
function khoGia(): TeacherExamSource[] {
  const phanI = []
  const phanII = []
  const phanIII = []
  for (let i = 0; i < 30; i++) phanI.push(mcq('I' + i, i % 2 === 0 ? 'pH và tính acid–base' : 'Cân bằng hoá học', i % 3 === 0 ? 'biet' : 'hieu'))
  for (let i = 0; i < 8; i++) phanII.push(tf('II' + i, i % 2 === 0 ? 'pH và tính acid–base' : 'Cân bằng hoá học', 'hieu'))
  for (let i = 0; i < 10; i++) phanIII.push(sa('III' + i, i % 2 === 0 ? 'pH và tính acid–base' : 'Cân bằng hoá học', 'van_dung'))
  return [{ maDe: 'kho', phanI, phanII, phanIII }]
}

// Hạt ngẫu nhiên cố định để test lặp lại được.
function rndCoDinh() {
  let x = 42
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648
    return x / 2147483648
  }
}

describe('khopLoc — lọc theo chuyên đề và mức độ', () => {
  it('rỗng chuyên đề = lấy mọi chuyên đề; mức độ "tron" = mọi mức', () => {
    const c = mcq('x', 'pH và tính acid–base', 'hieu')
    expect(khopLoc(c, [], 'tron')).toBe(true)
    expect(khopLoc(c, ['pH và tính acid–base'], 'hieu')).toBe(true)
    expect(khopLoc(c, ['Cân bằng hoá học'], 'tron')).toBe(false)
    expect(khopLoc(c, [], 'biet')).toBe(false)
  })
})

describe('chiaSoCau — không phần nào vượt trần của bộ gán câu', () => {
  it('10 câu chia theo tỉ lệ ma trận đề', () => {
    const r = chiaSoCau(10, { I: 30, II: 8, III: 10 })
    expect(r.I + r.II + r.III).toBe(10)
    expect(r.I).toBeLessThanOrEqual(18)
    expect(r.II).toBeLessThanOrEqual(4)
    expect(r.III).toBeLessThanOrEqual(6)
  })

  it('xin nhiều hơn trần thì cắt về đúng 28 câu — câu thừa sẽ không hiện cho em', () => {
    const r = chiaSoCau(100, { I: 30, II: 8, III: 10 })
    expect(r).toEqual({ I: 18, II: 4, III: 6 })
    expect(r.I + r.II + r.III).toBe(SO_CAU_BAI_TAP_TOI_DA)
  })

  it('kho ít câu thì chỉ chia đúng số đang có', () => {
    const r = chiaSoCau(20, { I: 3, II: 1, III: 0 })
    expect(r).toEqual({ I: 3, II: 1, III: 0 })
  })
})

describe('rutBaiTap — kiểm chứng 4', () => {
  it('giao đúng số câu và đúng chuyên đề thầy chọn', () => {
    const kq = rutBaiTap(khoGia(), { chuyenDe: ['pH và tính acid–base'], mucDo: 'tron', soCau: 10, ngauNhien: rndCoDinh() })
    expect(kq.soCau).toBe(10)
    const moiCau = [...kq.keyBank.phanI, ...kq.keyBank.phanII, ...kq.keyBank.phanIII]
    expect(moiCau.every((q) => q.chuyenDe === 'pH và tính acid–base')).toBe(true)
  })

  it('lọc cả mức độ', () => {
    const kq = rutBaiTap(khoGia(), { chuyenDe: [], mucDo: 'van_dung', soCau: 6, ngauNhien: rndCoDinh() })
    const moiCau = [...kq.keyBank.phanI, ...kq.keyBank.phanII, ...kq.keyBank.phanIII]
    expect(moiCau.length).toBeGreaterThan(0)
    expect(moiCau.every((q) => q.mucDo === 'van_dung')).toBe(true)
  })

  it('KHÔNG trùng câu em đã làm khi kho còn đủ câu mới', () => {
    const daLam = ['I0', 'I2', 'I4', 'I6', 'I8', 'I10']
    const kq = rutBaiTap(khoGia(), { chuyenDe: ['pH và tính acid–base'], mucDo: 'tron', soCau: 8, qidTranh: daLam, ngauNhien: rndCoDinh() })
    const ids = [...kq.keyBank.phanI, ...kq.keyBank.phanII, ...kq.keyBank.phanIII].map((q) => q.id)
    expect(ids.some((id) => daLam.includes(id))).toBe(false)
    expect(kq.soCauLapLai).toBe(0)
  })

  it('kho không đủ câu mới thì lấy lại câu cũ và ĐẾM RÕ bao nhiêu câu lặp', () => {
    // chuyên đề chỉ có 15 câu phần I + 4 phần II + 5 phần III; đã làm gần hết phần I
    const daLam = ['I0', 'I2', 'I4', 'I6', 'I8', 'I10', 'I12', 'I14', 'I16', 'I18', 'I20', 'I22', 'I24', 'I26', 'I28']
    const kq = rutBaiTap(khoGia(), { chuyenDe: ['pH và tính acid–base'], mucDo: 'tron', soCau: 20, qidTranh: daLam, ngauNhien: rndCoDinh() })
    expect(kq.soCauLapLai).toBeGreaterThan(0)
    expect(kq.soCau).toBeLessThanOrEqual(20)
  })

  it('kho thiếu câu thì trả đúng số có được, không bịa thêm', () => {
    const kho: TeacherExamSource[] = [{ maDe: 'it', phanI: [mcq('a', 'X', 'hieu'), mcq('b', 'X', 'hieu')], phanII: [], phanIII: [] }]
    const kq = rutBaiTap(kho, { chuyenDe: ['X'], mucDo: 'tron', soCau: 10, ngauNhien: rndCoDinh() })
    expect(kq.soCau).toBe(2)
    expect(kq.soCauKhop).toBe(2)
  })

  it('bank gửi cho em KHÔNG kèm đáp án, keyBank thì có', () => {
    const kq = rutBaiTap(khoGia(), { chuyenDe: [], mucDo: 'tron', soCau: 5, ngauNhien: rndCoDinh() })
    const chuoi = JSON.stringify(kq.bank)
    expect(chuoi.includes('correct')).toBe(false)
    expect(kq.keyBank.phanI.every((q) => !!q.correct)).toBe(true)
  })
})

describe('demCauTheoChuyenDe — số câu kho có, hiện trước khi giao', () => {
  it('đếm đúng theo chuyên đề, bỏ câu chưa phân loại', () => {
    const dem = demCauTheoChuyenDe(khoGia(), 'tron')
    expect(dem['pH và tính acid–base']).toBe(15 + 4 + 5)
    expect(dem['Cân bằng hoá học']).toBe(15 + 4 + 5)
  })

  it('lọc theo mức độ', () => {
    const dem = demCauTheoChuyenDe(khoGia(), 'van_dung')
    // chỉ phần III có mức van_dung: 5 câu mỗi chuyên đề
    expect(dem['pH và tính acid–base']).toBe(5)
  })
})
