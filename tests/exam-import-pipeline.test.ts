import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { buildExamDraft } from '../src/lib/exam-import-pipeline'

// Fixture: ĐÚNG NGUYÊN VĂN text app tự trích (bằng pdf.js, pageItemsToText)
// từ file đề tham khảo THPT 2026 mã đề 100 thật thầy đã gửi — không phải văn
// bản tự bịa. Đây là bài kiểm chứng đầu-cuối bắt buộc trước khi báo xong.
const fixturePath = path.resolve(process.cwd(), 'tests/fixtures/de-thpt-2026-ma100.txt')
const REAL_TEXT = readFileSync(fixturePath, 'utf8')

describe('buildExamDraft — kiểm chứng đầu-cuối trên đề tham khảo THPT 2026 mã 100 thật', () => {
  const draft = buildExamDraft(REAL_TEXT)

  it('mã đề đọc đúng 100', () => {
    expect(draft.maDe).toBe('100')
  })

  it('Phần I ra ĐÚNG 18 câu, KHÔNG phải 36 (không lẫn đề lặp lại trong vùng lời giải)', () => {
    const phanI = draft.phan.find((p) => p.ten === 'I')!
    expect(phanI.cau).toHaveLength(18)
  })

  it('Phần I: câu 1=D, câu 9=A, câu 13=C, câu 18=A', () => {
    const phanI = draft.phan.find((p) => p.ten === 'I')!
    const bySo = Object.fromEntries(phanI.cau.map((c) => [c.so, c.dapAnDung]))
    expect(bySo[1]).toBe('D')
    expect(bySo[9]).toBe('A')
    expect(bySo[13]).toBe('C')
    expect(bySo[18]).toBe('A')
  })

  it('Phần I: tất cả 18 câu đều có đáp án, không câu nào thiếu', () => {
    const phanI = draft.phan.find((p) => p.ten === 'I')!
    expect(phanI.cau.every((c) => c.coDapAn)).toBe(true)
  })

  it('Câu 5 Phần I (4 phương án nằm chung 1 dòng trong file gốc) vẫn tách đủ 4 phương án', () => {
    const phanI = draft.phan.find((p) => p.ten === 'I')!
    const c5 = phanI.cau.find((c) => c.so === 5)!
    expect(c5.pa).toHaveLength(4)
    expect(c5.pa.map((p) => p.key)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('Phần II ra đúng 4 câu, đáp án ĐĐSĐ · SĐSĐ · ĐSSĐ · SĐSS', () => {
    const phanII = draft.phan.find((p) => p.ten === 'II')!
    expect(phanII.cau).toHaveLength(4)
    expect(phanII.cau.map((c) => c.dapAnDung)).toEqual(['ĐĐSĐ', 'SĐSĐ', 'ĐSSĐ', 'SĐSS'])
  })

  it('Phần II: mỗi câu tách đủ 4 ý a/b/c/d (không chỉ có đáp án, còn có cả nội dung ý)', () => {
    const phanII = draft.phan.find((p) => p.ten === 'II')!
    for (const c of phanII.cau) {
      expect(c.pa).toHaveLength(4)
      for (const idea of c.pa) expect(idea.text.length).toBeGreaterThan(0)
    }
  })

  it('Phần III ra đúng 6 câu, đáp án giữ nguyên dấu phẩy thập phân', () => {
    const phanIII = draft.phan.find((p) => p.ten === 'III')!
    expect(phanIII.cau).toHaveLength(6)
    expect(phanIII.cau.map((c) => c.dapAnDung)).toEqual(['0,8', '3', '6,8', '2', '19,8', '31,0'])
  })

  it('không còn câu nào thiếu đáp án', () => {
    expect(draft.thieuDapAn).toEqual([])
  })

  it('không có warning nào (file đầy đủ, đúng cấu trúc)', () => {
    expect(draft.warnings).toEqual([])
  })
})

describe('buildExamDraft — trường hợp thiếu đáp án phải bị chặn, không được đoán', () => {
  it('câu không có đáp án trong bảng đáp án -> coDapAn=false, liệt kê vào thieuDapAn', () => {
    const text = 'PHẦN I. Mô tả\nCâu 1. A?\nA. a B. b C. c D. d\nCâu 2. B?\nA. a B. b C. c D. d\nHẾT\n1 A'
    const draft = buildExamDraft(text)
    const c2 = draft.phan[0].cau.find((c) => c.so === 2)!
    expect(c2.coDapAn).toBe(false)
    expect(c2.dapAnDung).toBeUndefined()
    expect(draft.thieuDapAn).toContain('I.2')
  })
})
