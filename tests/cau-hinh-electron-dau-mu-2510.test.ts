// CẤU HÌNH ELECTRON VIẾT CÓ DẤU MŨ (thầy chụp 25/10/2026, Câu 7 Liên kết hoá học: `1s^22s^22p^63s^23p^64s^1` hiện 1s²²s²²p⁶³s²³p⁶⁴s¹).
// Luật `^` + dãy số là luật tham ⇒ nhánh cấu hình electron nhận cả `^ { }` trong dãy, bỏ đi rồi tách như dạng viết liền (cumCauHinhElectron).
// Một sửa cho mọi đường: màn làm bài / xem lại (ChemText), phiếu HTML gửi em và phụ huynh (chuHtml).
import { describe, expect, it } from 'vitest'
import { parseChemText } from '../src/lib/chem-format'
import { chuHtml } from '../src/lib/html-phieu'

const mu = (s: string) => parseChemText(s).map((p) => (p.t === 'sup' ? `^${p.v}` : p.t === 'sub' ? `_${p.v}` : p.t === 'text' ? p.v : '')).join('')

describe('cấu hình electron có dấu mũ', () => {
  it('Câu 7 ảnh thầy chụp: X và Y hiện đúng số electron từng phân lớp', () => {
    expect(mu('X: 1s^22s^22p^63s^23p^64s^1, Y: 1s^22s^22p^5.')).toBe('X: 1s^22s^22p^63s^23p^64s^1, Y: 1s^22s^22p^5.')
    expect(parseChemText('1s^22s^22p^63s^23p^64s^1').filter((p) => p.t === 'sup').map((p) => p.v)).toEqual(['2', '2', '6', '2', '6', '1'])
    expect(parseChemText('[Ar]3d^{10}4s^2').filter((p) => p.t !== 'text').map((p) => `${p.t}:${p.v}`)).toEqual(['sup:10', 'sup:2'])
    expect(mu('3d^5 · Fe^{3+} · 10^-5 · 2^{10} · x^2')).toBe('3d^5 · Fe^3+ · 10^-5 · 2^10 · x^2')
    expect(mu('1s^2 2s^2 2p^6')).toBe('1s^2 2s^2 2p^6')
    expect(mu('H2SO4, Fe2O3, Os, Pd')).toBe('H_2SO_4, Fe_2O_3, Os, Pd')
  })
  it('phiếu HTML: không còn <sup>22</sup>', () => {
    const h = chuHtml('Nguyên tử X có cấu hình electron là 1s^22s^22p^63s^23p^64s^1')
    expect(h).toContain('1s<sup>2</sup>2s<sup>2</sup>2p<sup>6</sup>3s<sup>2</sup>3p<sup>6</sup>4s<sup>1</sup>')
    expect(h).not.toMatch(/<sup>(22|63|23|64)<\/sup>/)
  })
})
