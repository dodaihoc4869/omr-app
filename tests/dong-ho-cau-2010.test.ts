// Đồng hồ đo giây làm câu (20/10): dừng khi tab ẩn, dừng sau 180 giây không chạm, trần 900, không báo 0.
import { describe, expect, it } from 'vitest'
import { cumDoGiay, DongHoCau, IM_LANG_MS, TRAN_MS } from '../src/lib/dong-ho-cau'

const dongHo = () => { let t = 1_000_000; const d = new DongHoCau(() => t); return { d, troi: (ms: number) => { t += ms } } }

describe('DongHoCau', () => {
  it('cộng 1 giây mỗi nhịp khi tab hiện và em còn chạm', () => {
    const { d, troi } = dongHo()
    for (let i = 0; i < 14; i++) { troi(1000); d.nhip('q1', true) }
    expect(d.giay('q1')).toBe(14)
  })
  it('tab ẩn thì không cộng', () => {
    const { d, troi } = dongHo()
    for (let i = 0; i < 5; i++) { troi(1000); d.nhip('q1', true) }
    for (let i = 0; i < 40; i++) { troi(1000); d.nhip('q1', false) }
    expect(d.giay('q1')).toBe(5)
  })
  it('180 giây không chạm thì dừng, chạm lại thì chạy tiếp', () => {
    const { d, troi } = dongHo()
    for (let i = 0; i < 300; i++) { troi(1000); d.nhip('q1', true) }
    expect(d.giay('q1')).toBe(IM_LANG_MS / 1000) // dừng ở mốc 180
    d.cham()
    for (let i = 0; i < 10; i++) { troi(1000); d.nhip('q1', true) }
    expect(d.giay('q1')).toBe(190)
  })
  it('trần 900 giây một câu', () => {
    const { d, troi } = dongHo()
    for (let i = 0; i < 2000; i++) { troi(1000); if (i % 100 === 0) d.cham(); d.nhip('q1', true) }
    expect(d.giay('q1')).toBe(TRAN_MS / 1000)
  })
  it('chưa đủ 1 giây hoặc không có câu ⇒ null (không báo 0)', () => {
    const { d, troi } = dongHo()
    expect(d.giay('q1')).toBeNull()
    troi(1000); d.nhip(null, true)
    expect(d.giay('q1')).toBeNull()
  })
  it('đặt lại một câu thì đếm lại từ 0, câu khác không đổi', () => {
    const { d, troi } = dongHo()
    for (let i = 0; i < 8; i++) { troi(1000); d.nhip('a', true); d.nhip('b', true) }
    d.datLai('a')
    expect(d.giay('a')).toBeNull()
    expect(d.giay('b')).toBe(8)
  })
})

describe('cumDoGiay', () => {
  const cau = { text: 'Cho pin điện hóa Zn Cu ở điều kiện chuẩn đúng', choices: ['A. a b', 'B. c d'] }
  it('đếm số từ bằng hàm của màn lên bảng, có hình/không hình', () => {
    const c = cumDoGiay(14, 'I', cau)!
    expect(c).toMatchObject({ g: 14, p: 'I', h: 0 })
    expect(c.t).toBeGreaterThan(8)
    expect(cumDoGiay(9, 'I', { ...cau, thanCauImg: 'data:x' })!.h).toBe(1)
  })
  it('chưa có giây ⇒ undefined; giây > 900 bị kẹp', () => {
    expect(cumDoGiay(null, 'I', cau)).toBeUndefined()
    expect(cumDoGiay(0, 'I', cau)).toBeUndefined()
    expect(cumDoGiay(5000, 'II', cau)!.g).toBe(900)
  })
})
