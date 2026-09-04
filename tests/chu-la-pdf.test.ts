import { describe, expect, it } from 'vitest'
import { conKyTuLa, donCau, goKyTuLa } from '../src/lib/chu-la-pdf'

/** Chuỗi thật lấy từ đề `12-C1-B1` Phần I câu 32 (thầy chụp 04-09). */
const THAT = 'K C = $\\ce{CH3COOH}$  $\\ce{HOC2H5}$ .'

describe('goKyTuLa', () => {
  it('đổi ký tự Symbol về đúng ASCII: U+F05B thành [', () => {
    expect(goKyTuLa('A')).toBe('[A]')
  })

  it('sửa đúng chuỗi thật trong kho đề', () => {
    expect(goKyTuLa(THAT)).toBe('K C = [$\\ce{CH3COOH}$ ][ $\\ce{HOC2H5}$ ].')
  })

  it('đổi cả dấu ngoặc đơn U+F028 / U+F029', () => {
    expect(goKyTuLa('x')).toBe('(x)')
  })

  it('không đụng chữ thường và chữ có dấu', () => {
    const s = 'Ester – lipid, CH3COOH, đúng/sai'
    expect(goKyTuLa(s)).toBe(s)
  })

  it('chuỗi rỗng vẫn an toàn', () => {
    expect(goKyTuLa('')).toBe('')
  })
})

describe('conKyTuLa', () => {
  it('bắt được ký tự vùng dùng riêng còn sót', () => {
    expect(conKyTuLa('ab')).toBe(true)
  })

  it('chuỗi sạch thì không báo', () => {
    expect(conKyTuLa('K C = [CH3COOH][HOC2H5]')).toBe(false)
  })

  it('sau khi gỡ dải Symbol thì không còn báo', () => {
    expect(conKyTuLa(goKyTuLa(THAT))).toBe(false)
  })
})

describe('donCau', () => {
  it('gỡ ký tự lạ trong mọi trường chữ, kể cả lồng sâu', () => {
    const { cau, conLa } = donCau({ de: THAT, pa: { A: 'x', B: 'y' }, loi_giai: { buoc: ['z'] } })
    expect(cau.de).toContain('[')
    expect(cau.pa.A).toBe('[x]')
    expect(cau.loi_giai.buoc[0]).toBe('(z)')
    expect(conLa).toBe(false)
  })

  it('báo conLa khi còn ký tự KHÔNG gỡ được — để cờ hoá cho thầy xem ảnh gốc', () => {
    const { conLa } = donCau({ de: 'ab' })
    expect(conLa).toBe(true)
  })

  it('KHÔNG quét trường src (ảnh base64) — quét là tốn công vô ích trên chuỗi vài trăm KB', () => {
    const src = 'data:image/png;base64,AAAA'
    const { cau } = donCau({ hinh: [{ src, viTri: 'sau_de' }] })
    expect(cau.hinh[0].src).toBe(src)
  })

  it('không sửa đối tượng gốc', () => {
    const goc = { de: THAT }
    donCau(goc)
    expect(goc.de).toBe(THAT)
  })
})
