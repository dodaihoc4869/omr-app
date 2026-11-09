// CẤU HÌNH ELECTRON GÕ SẴN SỐ MŨ UNICODE SAU KHÍ HIẾM (thầy chụp 09/11, Chặng sửa: «[Ar]3d⁵ 4s¹» hiện «[Ar]₃d⁵ 4s¹»).
// Gốc: dãy `3d⁵` không được nhận là cấu hình (bộ quét chỉ biết chữ số thường) ⇒ số `3` ngay sau `]` rơi vào luật chỉ số dưới.
// Sửa: bộ quét nhận cả ⁰–⁹; chữ Unicode gõ sẵn vẫn giữ nguyên (luật 10/09), chỉ không còn hạ số lớp.
import { describe, expect, it } from 'vitest'
import { parseChemText } from '../src/lib/chem-format'
import { chuHtml } from '../src/lib/html-phieu'

const mu = (s: string) => parseChemText(s).map((p) => (p.t === 'sup' ? `^${p.v}` : p.t === 'sub' ? `_${p.v}` : p.t === 'text' ? p.v : '')).join('')

describe('cấu hình electron có số mũ Unicode sau [khí hiếm]', () => {
  it('không còn chỉ số dưới ở số lớp', () => {
    for (const s of ['[Ar]3d⁵ 4s¹', '[Ar]3d⁵4s¹', '[Ne]3s²3p⁵', '[Kr]4d¹⁰5s¹', '[Xe]4f¹⁴5d¹⁰6s²', '[He]2s²2p⁴'])
      expect(parseChemText(s).some((p) => p.t === 'sub')).toBe(false)
    expect(mu('Ở trạng thái cơ bản, nguyên tử Cr có cấu hình electron là [Ar]3d⁵ 4s¹.')).toBe('Ở trạng thái cơ bản, nguyên tử Cr có cấu hình electron là [Ar]3d⁵ 4s¹.')
    expect(chuHtml('Cr: [Ar]3d⁵ 4s¹')).not.toContain('<sub>')
  })
  it('các dạng khác vẫn đúng như cũ', () => {
    expect(mu('[Ar]3d5 4s1')).toBe('[Ar]3d^5 4s^1')
    expect(mu('[Ar]3d^{10}4s^1')).toBe('[Ar]3d^10 4s^1'.replace(' ', ''))
    expect(mu('[Cu(NH3)4]2+')).toContain('_3')
    expect(mu('H2SO4, Fe2O3, Os, Pd')).toBe('H_2SO_4, Fe_2O_3, Os, Pd')
  })
})
