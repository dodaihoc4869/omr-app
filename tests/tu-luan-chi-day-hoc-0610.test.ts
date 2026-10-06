// @vitest-environment node
// 06/10 (thầy): câu tự luận CHỈ hiện ở Gọi lên bảng phần DẠY HỌC; mọi chỗ khác cấm. `boTuLuanKhoiBanDe` là cổng cho màn Gọi lên bảng ngoài Dạy học.
import { describe, expect, it } from 'vitest'
import { boTuLuanKhoiBanDe } from '../src/lib/cau-tu-luan'

const tn = (id: string) => ({ id, text: `Câu ${id}`, choices: ['a', 'b', 'c', 'd'], correct: 'A' })
const ds = (id: string) => ({ id, text: `Ý ${id}`, ideas: ['1', '2', '3', '4'], correct: ['D', 'S', 'D', 'S'] })
const so = (id: string) => ({ id, text: `Tính khối lượng ${id}`, correct: '12,5' })
const tl = (id: string) => ({ id, text: 'Giải thích vì sao xà phòng có tác dụng giặt rửa.', correct: 'Do phần ưa nước và phần kị nước' })

describe('boTuLuanKhoiBanDe', () => {
  it('bỏ câu tự luận ở cả ba phần, giữ câu chấm tự động, không đổi đầu vào', () => {
    const goc = { maDe: 'X', phanI: [tn('I1'), { id: 'I2', text: 'thiếu phương án', choices: ['a'], correct: 'A' }], phanII: [ds('II1')], phanIII: [so('III1'), tl('III2')] }
    const copy = JSON.stringify(goc)
    const ra = boTuLuanKhoiBanDe(goc)
    expect(ra.phanI.map((q) => (q as { id: string }).id)).toEqual(['I1'])
    expect(ra.phanII).toHaveLength(1)
    expect(ra.phanIII.map((q) => (q as { id: string }).id)).toEqual(['III1'])
    expect(ra.maDe).toBe('X')
    expect(JSON.stringify(goc)).toBe(copy)
  })
})
