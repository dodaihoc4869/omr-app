import { describe, expect, it } from 'vitest'
import { khopPhanIII, soKhopSo } from '../src/lib/cham-so'
import { chamTheoPolicy, dinhTriKhoa } from '../src/lib/cham-so-policy'

// Thầy báo 01/10 (ảnh Ải 6): khoá "1,2375×10⁹ kJ", em ghi "1,2375" ⇒ bị chấm SAI vì ô số không gõ được ×10⁹.
describe('khoá a×10ⁿ: em ghi đúng định trị là đúng', () => {
  const K = '1,2375×10⁹ kJ'
  it.each([
    ['1,2375', true], ['1.2375', true], ['1237500000', true], ['1,2375×10^9', true], ['1,2375 kJ', true],
    ['1,24', false], ['1,2375×10^8', false], ['12375', false], ['', false], ['1,2375 g', false],
  ])('%s → %s', (em, dung) => {
    expect(khopPhanIII(em, K)).toBe(dung)
    expect(soKhopSo(em, K, 'chat')).toBe(dung)
    if (em) expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: K, answer: em }).correct).toBe(dung)
  })
  it('các cách viết số mũ của khoá', () => {
    expect(dinhTriKhoa('1,2375×10⁹ kJ')).toBe('1,2375')
    expect(dinhTriKhoa('2,5.10^-3')).toBe('2,5')
    expect(dinhTriKhoa('6,02 x 10^23')).toBe('6,02')
    expect(dinhTriKhoa('1,6·10⁻¹⁹')).toBe('1,6')
    expect(dinhTriKhoa('5×10⁰')).toBeNull()
    expect(dinhTriKhoa('0,54')).toBeNull()
    expect(dinhTriKhoa('10')).toBeNull()
  })
  it('khoá số mũ âm: định trị đúng, số sai vẫn sai', () => {
    expect(khopPhanIII('2,5', '2,5.10^-3')).toBe(true)
    expect(khopPhanIII('0,0025', '2,5.10^-3')).toBe(true)
    expect(khopPhanIII('2,6', '2,5.10^-3')).toBe(false)
  })
  it('khoá không có số mũ giữ nguyên luật cũ', () => {
    expect(khopPhanIII('0,54', '0,54')).toBe(true)
    expect(khopPhanIII('5,4', '0,54')).toBe(false)
  })
})

describe('phiếu HTML nhúng nguyên văn hai hàm', () => {
  it('chạy độc lập được', async () => {
    const { coSoMuRieng } = await import('../src/lib/cham-so-policy')
    const f = new Function(`var a = (${dinhTriKhoa.toString()}); var b = (${coSoMuRieng.toString()}); return [a('1,2375×10⁹ kJ'), b('1,2375'), b('2e9')]`)
    expect(f()).toEqual(['1,2375', false, true])
  })
})
