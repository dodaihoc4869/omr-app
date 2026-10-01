import { describe, expect, it } from 'vitest'
import { demCauMoi, gopBai } from '../server/src/bai-bo-sung'

// Ca 313224 (01/10): máy chủ chốt bài 12049 bằng bản lưu tạm lúc 18:58 — Phần I đủ, Phần II câu đầu [D,null,D,null], Phần III trống.
const CHOT = { phanI: { a: 'A', b: 'C' }, phanII: { x: ['D', null, 'D', null] }, phanIII: {} }
const TREN_MAY = { phanI: { a: 'A', b: 'C' }, phanII: { x: ['D', 'S', 'D', 'S'], y: ['S', 'S', 'D', 'D'] }, phanIII: { p: '1,2375', q: '' } }

describe('bài bổ sung', () => {
  it('đếm đúng số câu làm thêm (ý mới ở câu II dở dang cũng tính một câu)', () => {
    expect(demCauMoi(CHOT, TREN_MAY)).toBe(3) // x (ý mới), y, p — q rỗng không tính
    expect(demCauMoi(JSON.stringify(CHOT), TREN_MAY)).toBe(3)
  })
  it('gửi lại y nguyên bài đã chốt ⇒ 0 (không tạo bài bổ sung)', () => {
    expect(demCauMoi(CHOT, CHOT)).toBe(0)
    expect(demCauMoi(CHOT, { phanI: { a: 'A' } })).toBe(0)
  })
  it('đổi đáp án một câu đã chốt cũng tính (thầy duyệt mới tính điểm)', () => {
    expect(demCauMoi(CHOT, { phanI: { a: 'B' } })).toBe(1)
  })
  it('gộp: giữ bài cũ, ô bổ sung có trả lời thì lấy bổ sung', () => {
    expect(gopBai(CHOT, TREN_MAY)).toEqual({
      phanI: { a: 'A', b: 'C' },
      phanII: { x: ['D', 'S', 'D', 'S'], y: ['S', 'S', 'D', 'D'] },
      phanIII: { p: '1,2375' },
    })
    expect(gopBai({ phanII: { x: ['D', 'S', null, null] } }, { phanII: { x: [null, null, 'D', null] } }).phanII).toEqual({ x: ['D', 'S', 'D', null] })
  })
  it('dữ liệu hỏng không ném lỗi', () => {
    expect(demCauMoi('không phải json', TREN_MAY)).toBe(5) // bài chốt đọc không được ⇒ coi như trống
    expect(demCauMoi(null, null)).toBe(0)
  })
})
