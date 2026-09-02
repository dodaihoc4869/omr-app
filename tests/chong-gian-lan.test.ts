// Chống gian lận theo mức (QUANLYCATHI mục 6): kiểm chứng 9 (rời 1 lần → cảnh
// báo, KHÔNG khoá) và 10 (rời 3 lần → khoá), rời quá 30 s → khoá ngay, đếm lại
// sau khi thầy mở khoá, ngưỡng do thầy chỉnh.
import { describe, expect, it } from 'vitest'
import { chuanHoaNguong, khoaViRoiLau, loiCanhBao, mucKhiRoiMan, soLanTinhTu, NGUONG_MAC_DINH } from '../src/lib/chong-gian-lan'

describe('chong-gian-lan', () => {
  const n = NGUONG_MAC_DINH

  it('kiểm chứng 9: rời màn 1 lần → cảnh báo nhẹ, không khoá; lần 2 → đậm', () => {
    expect(mucKhiRoiMan(1, 0, n)).toBe('nhe')
    expect(mucKhiRoiMan(2, 0, n)).toBe('dam')
  })

  it('kiểm chứng 10: rời màn lần thứ 3 → khoá', () => {
    expect(mucKhiRoiMan(3, 0, n)).toBe('khoa')
    expect(mucKhiRoiMan(7, 0, n)).toBe('khoa')
  })

  it('rời quá 30 giây một lần → khoá ngay; 30 giây tròn thì chưa', () => {
    expect(khoaViRoiLau(31, n)).toBe(true)
    expect(khoaViRoiLau(30, n)).toBe(false)
    expect(khoaViRoiLau(3, n)).toBe(false)
  })

  it('sau khi thầy mở khoá, đếm lại từ mốc: đã rời 3 lần (mốc 3) → lần 4 chỉ là cảnh báo nhẹ, lần 6 mới khoá', () => {
    expect(soLanTinhTu(4, 3)).toBe(1)
    expect(mucKhiRoiMan(4, 3, n)).toBe('nhe')
    expect(mucKhiRoiMan(5, 3, n)).toBe('dam')
    expect(mucKhiRoiMan(6, 3, n)).toBe('khoa')
  })

  it('ngưỡng thầy chỉnh: 2 lần / 15 giây', () => {
    const t = chuanHoaNguong({ lan: 2, giay: 15 })
    expect(mucKhiRoiMan(1, 0, t)).toBe('nhe')
    expect(mucKhiRoiMan(2, 0, t)).toBe('khoa')
    expect(khoaViRoiLau(16, t)).toBe(true)
  })

  it('chuanHoaNguong: giá trị thiếu/lạ → mặc định 3 lần / 30 giây; giây tối thiểu 5', () => {
    expect(chuanHoaNguong(undefined)).toEqual({ lan: 3, giay: 30 })
    expect(chuanHoaNguong({ lan: 0, giay: 2 })).toEqual({ lan: 3, giay: 30 })
    expect(chuanHoaNguong({ lan: 5.7, giay: 60 })).toEqual({ lan: 5, giay: 60 })
  })

  it('lời cảnh báo nêu số lần và số lần còn lại', () => {
    expect(loiCanhBao('nhe', 1, n)).toContain('lần 1')
    expect(loiCanhBao('dam', 2, n)).toContain('Còn 1 lần')
    expect(loiCanhBao('dam', 2, n)).toContain('30 giây')
  })
})
