import { describe, it, expect } from 'vitest'
import { splitExamRegions, parseAnswerKey } from '../src/lib/exam-answer-key'

describe('splitExamRegions (tách đề gốc / bảng đáp án / hướng dẫn giải)', () => {
  it('tách đúng 3 vùng khi file có đủ HẾT và HƯỚNG DẪN GIẢI', () => {
    const text = 'PHẦN I\nCâu 1...\n------------------------- HẾT -------------------------\nPhần I: Mỗi câu trả lời đúng được 0,25 điểm\n1 D\nHƯỚNG DẪN GIẢI MÃ ĐỀ THI 100\nCâu 1 lời giải...'
    const r = splitExamRegions(text)
    expect(r.vungA).toContain('Câu 1...')
    expect(r.vungA).not.toContain('HẾT')
    expect(r.vungB).toContain('Phần I: Mỗi câu')
    expect(r.vungB).not.toContain('HƯỚNG DẪN GIẢI')
    expect(r.vungC).toContain('HƯỚNG DẪN GIẢI')
    expect(r.vungC).toContain('lời giải')
  })

  it('KHÔNG được lẫn đề lặp lại trong vùng C sang vùng A (chặn lỗi nhân đôi số câu)', () => {
    const text = 'Câu 1. Đề gốc\nA. x\n------------------------- HẾT -------------------------\nPhần I: Mỗi câu trả lời đúng\n1 D\nHƯỚNG DẪN GIẢI MÃ ĐỀ THI 100\nCâu 1. Đề gốc (lặp lại)\nA. x\nĐáp án: D'
    const r = splitExamRegions(text)
    const countCau1InA = (r.vungA.match(/Câu 1\./g) || []).length
    expect(countCau1InA).toBe(1)
  })

  it('không có "HẾT" -> toàn bộ text là vùng A, vùng B/C rỗng, không báo lỗi', () => {
    const r = splitExamRegions('Câu 1. Không có đáp án đi kèm\nA. x\nB. y')
    expect(r.vungA).toContain('Câu 1')
    expect(r.vungB).toBe('')
    expect(r.vungC).toBe('')
  })

  it('có HẾT nhưng không có HƯỚNG DẪN GIẢI -> vùng B lấy hết phần còn lại, vùng C rỗng', () => {
    const r = splitExamRegions('Câu 1...\nHẾT\n1 D\n2 C')
    expect(r.vungB).toContain('1 D')
    expect(r.vungC).toBe('')
  })
})

describe('parseAnswerKey (đọc bảng đáp án kiểu bảng 2 cột song song)', () => {
  // Đúng nguyên văn cách app tự trích từ file PDF thật (mã đề 100, đề tham
  // khảo THPT 2026 môn Hoá) bằng pdf.js — không phải văn bản tự bịa.
  const vungBThat = `ĐỀ THAM KHẢO SỐ 1 KÌ THI TỐT NGHIỆP THPT NĂM 2026
MÔN: HÓA HỌC
Phần I: Mỗi câu trả lời đúng được 0,25 điểm
Câu Đáp án Câu Đáp án
1 D 10 C
2 D 11 C
3 C 12 B
4 D 13 C
5 C 14 C
6 B 15 B
7 C 16 D
8 D 17 C
9 A 18 A
Phần II: Điểm tối đa của 01 câu hỏi là 1 điểm
- Thí sinh chỉ lựa chọn chính xác 01 ý trong 1 câu hỏi được 0,1 điểm;
Câu 1 2 3 4
Đáp án
a) Đúng
b) Đúng
c) Sai
d) Đúng
a) Sai
b) Đúng
c) Sai
d) Đúng
a) Đúng
b) Sai
c) Sai
d) Đúng
a) Sai
b) Đúng
c) Sai
d) Sai
Phần III: Mỗi câu trả lời đúng được 0,25 điểm
Câu 1 2 3 4 5 6
Đáp án 0,8 3 6,8 2 19,8 31,0`

  it('Phần I: đọc đúng cả 18/18 câu dù bảng 2 cột song song và bị chen dòng tiêu đề khác', () => {
    const r = parseAnswerKey(vungBThat)
    expect(r.phanI).toEqual({
      1: 'D', 2: 'D', 3: 'C', 4: 'D', 5: 'C', 6: 'B', 7: 'C', 8: 'D', 9: 'A',
      10: 'C', 11: 'C', 12: 'B', 13: 'C', 14: 'C', 15: 'B', 16: 'D', 17: 'C', 18: 'A',
    })
  })

  it('Phần II: ghép đúng 4 ý a-b-c-d thành chuỗi ĐĐSĐ theo đúng thứ tự câu', () => {
    const r = parseAnswerKey(vungBThat)
    expect(r.phanII).toEqual({ 1: 'ĐĐSĐ', 2: 'SĐSĐ', 3: 'ĐSSĐ', 4: 'SĐSS' })
  })

  it('Phần III: giữ nguyên dấu phẩy thập phân, đúng thứ tự câu 1-6', () => {
    const r = parseAnswerKey(vungBThat)
    expect(r.phanIII).toEqual({ 1: '0,8', 2: '3', 3: '6,8', 4: '2', 5: '19,8', 6: '31,0' })
  })

  it('không báo warning nào khi bảng đáp án đầy đủ, đúng cấu trúc', () => {
    const r = parseAnswerKey(vungBThat)
    expect(r.warnings).toEqual([])
  })

  it('vùng B rỗng -> báo không tìm thấy bảng đáp án, không lỗi, không đoán', () => {
    const r = parseAnswerKey('')
    expect(r.phanI).toEqual({})
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('Phần I thiếu 1 câu giữa chừng -> báo rõ số câu thiếu, KHÔNG tự gán đáp án', () => {
    const vungBThieu = `Phần I: Mỗi câu trả lời đúng
Câu Đáp án Câu Đáp án
1 D 4 A
2 C 5 B`
    const r = parseAnswerKey(vungBThieu)
    expect(r.phanI[3]).toBeUndefined()
    expect(r.warnings.some((w) => w.includes('thiếu đáp án câu 3'))).toBe(true)
  })
})
