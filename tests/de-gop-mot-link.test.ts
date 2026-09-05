// ĐỀ GỘP MỘT CA MỘT LINK — đặc tả CA-THI-VA-GOI-LEN-BANG mục 2, phép kiểm
// 14–15. Mục này KHÔNG build lại (đã có sẵn từ đợt rút đề); test ở đây là để
// XÁC NHẬN nó đúng, và để lần sau ai sửa mergeAndStrip thì biết ngay.
import { describe, expect, it } from 'vitest'
import { mergeAndStrip, mergeKeepAnswers, type TeacherExamSource } from '../src/data/examContent'
import { randomSessionCode } from '../src/lib/ca-link'

const de = (maDe: string, nI: number, nII: number, nIII: number): TeacherExamSource =>
  ({
    maDe,
    phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i + 1}`, text: `TN ${i + 1}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' })),
    phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i + 1}`, text: `ĐS ${i + 1}`, ideas: ['a', 'b', 'c', 'd'], correct: ['D', 'D', 'D', 'D'] })),
    phanIII: Array.from({ length: nIII }, (_, i) => ({ id: `${maDe}-III-${i + 1}`, text: `TLN ${i + 1}`, correct: '1' })),
  }) as unknown as TeacherExamSource

const BA_NHOM = [de('12-C1-B1-TN', 18, 0, 0), de('12-C1-B1-DS', 0, 4, 0), de('12-C2-B4-TLN', 0, 0, 6)]

describe('PHÉP KIỂM 14 — ba nhóm khác nhau ra MỘT gói đề', () => {
  it('gộp thành một ngân hàng ba phần, không tách theo mã nhóm', () => {
    const bank = mergeAndStrip(BA_NHOM)
    expect(bank.phanI).toHaveLength(18)
    expect(bank.phanII).toHaveLength(4)
    expect(bank.phanIII).toHaveLength(6)
    expect(bank.phanI.length + bank.phanII.length + bank.phanIII.length).toBe(28)
  })

  it('mã ca là MỘT chuỗi 6 số — một ca một mã, link mời sinh từ đúng mã đó', () => {
    for (let i = 0; i < 20; i++) expect(randomSessionCode()).toMatch(/^\d{6}$/)
  })

  it('bản CÓ đáp án cũng gộp y như vậy, không lệch số câu với bản gửi em', () => {
    const key = mergeKeepAnswers(BA_NHOM)
    expect([key.phanI.length, key.phanII.length, key.phanIII.length]).toEqual([18, 4, 6])
  })
})

describe('PHÉP KIỂM 15 — ba phần, số gốc truy ngược được về kho', () => {
  const bank = mergeAndStrip(BA_NHOM)

  it('mỗi phần là một mảng liên tục — máy em đánh số lại từ 1 trong từng phần', () => {
    expect(bank.phanI.map((_, i) => i + 1)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1))
    expect(bank.phanIII.map((_, i) => i + 1)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('id giữ nguyên mã đề gốc và số gốc — đối chiếu về kho không cần trường riêng', () => {
    expect(bank.phanI[0].id).toBe('12-C1-B1-TN-I-1')
    expect(bank.phanII[3].id).toBe('12-C1-B1-DS-II-4')
    expect(bank.phanIII[5].id).toBe('12-C2-B4-TLN-III-6')
    // Mọi id là duy nhất trong cả gói: gộp ba nhóm không đè lên nhau.
    const ids = [...bank.phanI, ...bank.phanII, ...bank.phanIII].map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gói gửi máy chủ KHÔNG kèm đáp án', () => {
    const s = JSON.stringify(bank)
    expect(s).not.toContain('correct')
    expect(s).not.toContain('canChua')
  })
})
