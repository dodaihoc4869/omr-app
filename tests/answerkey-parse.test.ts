import { describe, expect, it } from 'vitest'
import { parseAnswerKeyText } from '../src/lib/answerkey-parse'

describe('parseAnswerKeyText', () => {
  it('parse đúng định dạng chuẩn 4 dòng', () => {
    const text = [
      'Mã đề: 101',
      'Phần I: ABCDABCDABCDABCDAB',
      'Phần II: DSDS SDSD DDSS SSDD',
      'Phần III: -0,87 12 3,5 100 -5 0,25',
    ].join('\n')
    const result = parseAnswerKeyText(text)
    expect(result.ok).toBe(true)
    expect(result.key?.madeThi).toBe('101')
    expect(result.key?.phanI).toHaveLength(18)
    expect(result.key?.phanII).toHaveLength(4)
    expect(result.key?.phanIII).toHaveLength(6)
  })

  it('báo lỗi rõ ràng khi thiếu dòng, không crash', () => {
    const result = parseAnswerKeyText('Mã đề: 101')
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('báo lỗi khi Phần I sai số ký tự, không crash', () => {
    const text = ['Mã đề: 101', 'Phần I: ABC', 'Phần II: DSDS SDSD DDSS SSDD', 'Phần III: 1 2 3 4 5 6'].join('\n')
    const result = parseAnswerKeyText(text)
    expect(result.ok).toBe(false)
  })
})
