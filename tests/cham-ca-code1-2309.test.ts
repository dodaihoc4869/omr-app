import { describe, expect, it } from 'vitest'
import { scorePhanI, scorePhanII, scorePhanIII } from '../src/engine/score'

const muc = <T>(value: T) => ({ value, flag: null })

describe('khóa đáp án và đáp số ca thi', () => {
  it('số 0 đúng, bỏ trống sai, và "0,00" = "0" theo LUẬT SỐ HỌC của ca thi', () => {
    expect(scorePhanIII([muc('0')], ['0'], 100).items[0]?.correct).toBe(true)
    expect(scorePhanIII([muc('　')], ['0'], 100).items[0]?.correct).toBe(false)
    // SỬA CÓ CHỦ Ý 23/09/2026: ca thi chốt luật `so_hoc` dùng chung (`src/lib/cham-so.ts`, sai số
    // tuyệt đối < 1e-4) — "0,00" và "0" là CÙNG MỘT SỐ nên ĐÚNG. Trước đó ca thi giữ luật riêng
    // phân biệt chữ số có nghĩa nên câu này tính sai (cùng họ với "0,540" ≠ "0,54").
    expect(scorePhanIII([muc('0,00')], ['0'], 100).items[0]?.correct).toBe(true)
    expect(scorePhanIII([muc('−0，54')], ['-0.54'], 100).items[0]?.correct).toBe(true)
  })

  it('khóa hỏng ở phần I, II, III dừng chấm thay vì ghi câu sai cho em', () => {
    expect(() => scorePhanI([muc('A')], ['' as 'A'], 100)).toThrow(/khóa đáp án không hợp lệ/)
    expect(() => scorePhanII([[muc('D'), muc('S'), muc('D'), muc('S')]], [['D', 'S', 'X' as 'D', 'S']], 100)).toThrow(/khóa đáp án không hợp lệ/)
    expect(() => scorePhanIII([muc('0')], [''], 100)).toThrow(/khóa đáp án không hợp lệ/)
    expect(() => scorePhanIII([muc('abc')], ['abc'], 100)).toThrow(/khóa đáp án không hợp lệ/)
  })
})
