// @vitest-environment node
// HẠN CHUNG CẢ LỚP (thầy 09/11) — server/src/han-chung.ts. Khoá: M = ⌈N/28⌉; T = phân vị 90 % của (M + 1 + ngày Sửa dự báo từng em),
// kẹp [M + 2, 28]; lớp yếu ⇒ hạn dài hơn; em chưa có dữ liệu ⇒ trung vị lớp; đọc năng lực MỘT truy vấn, mức thiếu dữ liệu suy thấp hơn chứ không bịa cao.
import { describe, expect, it } from 'vitest'
import { hanChung, ngaySuaDuBao, soNgayMoiHc, docNangLucLop, NANG_LUC_MAC_DINH, type NangLucEm } from '../server/src/han-chung'

const GIOI: NangLucEm = { biet: 0.97, hieu: 0.9, van_dung: 0.8 }
const YEU: NangLucEm = { biet: 0.75, hieu: 0.5, van_dung: 0.25 }

describe('hanChung', () => {
  it('M = ⌈N/28⌉, tối thiểu 1', () => {
    expect([soNgayMoiHc(0), soNgayMoiHc(28), soNgayMoiHc(29), soNgayMoiHc(112), soNgayMoiHc(96)]).toEqual([1, 1, 2, 4, 4])
  })
  it('em yếu cần nhiều ngày Sửa hơn em giỏi', () => {
    expect(ngaySuaDuBao(4, YEU)).toBeGreaterThan(ngaySuaDuBao(4, GIOI))
  })
  it('T = phân vị 90 %: ≥ 90 % em dự kiến xong; lớp yếu ⇒ hạn dài hơn; luôn trong [M + 2, 28]', () => {
    const lop = Array.from({ length: 53 }, (_, i) => { const a = (i + 0.5) / 53; return { biet: 0.75 + 0.22 * a, hieu: 0.5 + 0.4 * a, van_dung: 0.25 + 0.55 * a } })
    const h = hanChung(112, lop)
    expect(h.M).toBe(4)
    expect(h.duKienXong / h.tongEm).toBeGreaterThanOrEqual(0.9)
    expect(h.T).toBeGreaterThanOrEqual(h.M + 2)
    expect(h.T).toBeLessThanOrEqual(28)
    expect(hanChung(112, lop.map(() => YEU)).T).toBeGreaterThan(hanChung(112, lop.map(() => GIOI)).T)
    expect(hanChung(56, lop).T).toBeLessThan(h.T)
  })
  it('em chưa có dữ liệu dùng trung vị lớp; cả lớp chưa có dữ liệu dùng mức mặc định', () => {
    expect(hanChung(112, [GIOI, GIOI, null]).T).toBe(hanChung(112, [GIOI, GIOI, GIOI]).T)
    expect(hanChung(112, [null, null]).T).toBe(hanChung(112, [NANG_LUC_MAC_DINH, NANG_LUC_MAC_DINH]).T)
    expect(hanChung(112, []).tongEm).toBe(0)
  })
})

describe('docNangLucLop', () => {
  const env = (rows: { sbd: string; m: string; n: number; d: number }[]) => ({ DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: rows }) }) }) } }) as never
  it('gộp mức theo nhãn NB/TH/VD/VDC; mức < 5 câu ⇒ suy từ mức khác, thấp hơn; em không có dòng ⇒ null', async () => {
    const r = await docNangLucLop(env([
      { sbd: 'A', m: 'NB', n: 20, d: 18 }, { sbd: 'A', m: 'TH', n: 10, d: 7 }, { sbd: 'A', m: 'VD', n: 6, d: 3 }, { sbd: 'A', m: 'VDC', n: 4, d: 1 },
      { sbd: 'B', m: 'NB', n: 10, d: 9 }, { sbd: 'B', m: 'VD', n: 2, d: 2 },
    ]), ['A', 'B', 'C'], Date.UTC(2026, 10, 9))
    expect(r[0]).toEqual({ biet: 0.9, hieu: 0.7, van_dung: 0.4 })
    expect(r[1]!.biet).toBeCloseTo(0.9); expect(r[1]!.hieu).toBeCloseTo(0.75); expect(r[1]!.van_dung).toBeCloseTo(0.6)
    expect(r[2]).toBeNull()
  })
})
