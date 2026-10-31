// SỔ «LỬA HỌC THẬT» `ddh.lua-that` (docs/DE-XUAT-BI-CAM-XUC-3110.md mục 4.3): giữ đúng 10 câu, tách theo ngày Việt Nam + SBD, máy chặn localStorage thì không lỗi.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { docLuaThat, ghiCauLua, ghiXongChangLua, KHOA_LUA_THAT } from '../src/lib/lua-that'

const luc = (h: number, m = 0, ngay = 31) => Date.UTC(2026, 9, ngay, h - 7, m)
afterEach(() => { vi.restoreAllMocks(); try { localStorage.clear() } catch { /* */ } })

describe('sổ ddh.lua-that', () => {
  it('giữ đúng 10 câu gần nhất, cũ trước mới sau', () => {
    for (let i = 0; i < 14; i++) ghiCauLua('99001', i % 3 !== 0, luc(15, i))
    const s = docLuaThat('99001', luc(15, 20))
    expect(s.kq).toHaveLength(10)
    expect(s.kq[0]!.t).toBe(luc(15, 4))
    expect(s.kq.at(-1)!.t).toBe(luc(15, 13))
    expect(s.kq.map((x) => x.tinh)).toEqual([true, true, false, true, true, false, true, true, false, true])
  })
  it('tách theo ngày Việt Nam: 23:59 hôm nay ≠ 00:01 hôm sau', () => {
    ghiCauLua('99001', false, luc(23, 59))
    expect(docLuaThat('99001', luc(23, 59)).kq).toHaveLength(1)
    expect(docLuaThat('99001', luc(24, 1)).kq).toHaveLength(0)
    ghiCauLua('99001', true, luc(24, 1)) // sang ngày mới ⇒ sổ mới
    expect(docLuaThat('99001', luc(24, 2)).kq.map((x) => x.tinh)).toEqual([true])
  })
  it('tách theo SBD (cắt khoảng trắng); không có SBD ⇒ sổ trống, không ghi', () => {
    ghiCauLua(' 99001 ', false, luc(15))
    expect(docLuaThat('99001', luc(15)).kq).toHaveLength(1)
    expect(docLuaThat('99002', luc(15)).kq).toHaveLength(0)
    ghiCauLua('', false, luc(15)); ghiCauLua(null, false, luc(15))
    expect(docLuaThat(undefined, luc(15))).toEqual({ kq: [] })
    expect(JSON.parse(localStorage.getItem(KHOA_LUA_THAT)!).s).toBe('99001')
  })
  it('xong chặng: ≥ 2/3 câu được tính (4/6) mới ghi giờ làm thật', () => {
    expect(ghiXongChangLua('99001', 3, 6, luc(15))).toBe(false)
    expect(docLuaThat('99001', luc(15)).xongThat).toBeUndefined()
    expect(ghiXongChangLua('99001', 4, 6, luc(15, 5))).toBe(true)
    expect(docLuaThat('99001', luc(15, 6)).xongThat).toBe(luc(15, 5))
    expect(ghiXongChangLua('99001', 0, 0, luc(15, 7))).toBe(false)
  })
  it('bản lưu hỏng / máy chặn localStorage ⇒ đọc ra sổ trống, ghi không ném lỗi', () => {
    localStorage.setItem(KHOA_LUA_THAT, '{hỏng')
    expect(docLuaThat('99001', luc(15)).kq).toEqual([])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('chặn') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('chặn') })
    expect(() => ghiCauLua('99001', false, luc(15))).not.toThrow()
    expect(() => ghiXongChangLua('99001', 6, 6, luc(15))).not.toThrow()
    expect(docLuaThat('99001', luc(15))).toEqual({ kq: [] })
  })
})
