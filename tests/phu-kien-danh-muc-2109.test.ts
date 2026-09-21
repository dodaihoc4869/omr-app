// @vitest-environment node
// DANH MỤC PHỤ KIỆN — test KHOÁ giá, bậc, điều kiện, mã (Boss 21/09: giá đi qua soát commit + test khoá; docs/hop-dong-shop-phu-kien-2109.md mục 1).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DANH_MUC_PHU_KIEN, DOT_MO_BAN, O_GAN, PHIEN_BAN, docMonPhuKien, monDangBan } from '../src/lib/phu-kien-danh-muc'
import { MON_DOT_1 } from '../src/game/than-thu-v2/phu-kien/phu-kien-mon'

const GIA: Record<string, number> = {
  'HQ-01': 20, 'HQ-02': 40, 'HQ-03': 150, 'HQ-04': 220, 'HQ-05': 600, 'HQ-06': 850, 'HQ-07': 2400, 'HQ-08': 9000,
  'VD-01': 20, 'VD-02': 30, 'VD-03': 60, 'VD-04': 120, 'VD-05': 200, 'VD-06': 700, 'VD-07': 2000, 'VD-08': 7500,
  'KT-01': 20, 'KT-02': 40, 'KT-03': 50, 'KT-04': 180, 'KT-05': 250, 'KT-06': 500, 'KT-07': 1800, 'KT-08': 6000,
  'DA-01': 30, 'DA-02': 60, 'DA-03': 140, 'DA-04': 240, 'DA-05': 550, 'DA-06': 900, 'DA-07': 2600, 'DA-08': 12000,
  'CL-01': 30, 'CL-02': 50, 'CL-03': 160, 'CL-04': 250, 'CL-05': 650, 'CL-06': 800, 'CL-07': 3000, 'CL-08': 10000,
}
/** mã → [cần chuỗi, cần ấn thạch, số cái] (chỉ món có điều kiện). */
const DIEU_KIEN: Record<string, [number | null, number | null, number | null]> = {
  'HQ-07': [7, null, null], 'HQ-08': [14, 5, 20], 'VD-07': [7, null, null], 'VD-08': [21, null, 25], 'KT-08': [14, null, 30],
  'DA-07': [7, null, null], 'DA-08': [30, 5, 10], 'CL-07': [7, null, null], 'CL-08': [28, null, 15],
}
const KHOANG_GIA: Record<number, [number, number]> = { 1: [20, 60], 2: [120, 250], 3: [500, 900], 4: [1800, 3000], 5: [6000, 12000] }

describe('danh mục phụ kiện · khoá bảng giá đã chốt', () => {
  it('40 món, mã khác nhau, đúng định dạng; 8 món mỗi chỗ đeo; 12/10/8/5/5 món theo bậc', () => {
    expect(DANH_MUC_PHU_KIEN).toHaveLength(40)
    expect(new Set(DANH_MUC_PHU_KIEN.map((m) => m.ma)).size).toBe(40)
    for (const m of DANH_MUC_PHU_KIEN) expect(m.ma, m.ma).toMatch(/^(HQ|VD|KT|DA|CL)-0[1-8]$/)
    for (const o of O_GAN) expect(DANH_MUC_PHU_KIEN.filter((m) => m.o === o), o).toHaveLength(8)
    expect([1, 2, 3, 4, 5].map((b) => DANH_MUC_PHU_KIEN.filter((m) => m.bac === b).length)).toEqual([12, 10, 8, 5, 5])
    expect(PHIEN_BAN).toBe('m1-v1')
  })
  it('giá từng món KHÔNG đổi (bảng chốt) và nằm trong khoảng của bậc; trọn bộ 64.210 vàng (bỏ Huyền thoại 19.710)', () => {
    expect(Object.fromEntries(DANH_MUC_PHU_KIEN.map((m) => [m.ma, m.gia]))).toEqual(GIA)
    for (const m of DANH_MUC_PHU_KIEN) { const [lo, hi] = KHOANG_GIA[m.bac]!; expect(m.gia, m.ma).toBeGreaterThanOrEqual(lo); expect(m.gia, m.ma).toBeLessThanOrEqual(hi) }
    expect(DANH_MUC_PHU_KIEN.reduce((a, m) => a + m.gia, 0)).toBe(64210)
    expect(DANH_MUC_PHU_KIEN.filter((m) => m.bac < 5).reduce((a, m) => a + m.gia, 0)).toBe(19710)
  })
  it('điều kiện học + số cái KHÔNG đổi; mọi món Huyền thoại đều có điều kiện chuỗi và số cái giới hạn; món khác không giới hạn số cái', () => {
    const thuc = Object.fromEntries(DANH_MUC_PHU_KIEN.filter((m) => m.canChuoiNgay !== null || m.canAnThach !== null || m.suatTong !== null).map((m) => [m.ma, [m.canChuoiNgay, m.canAnThach, m.suatTong]]))
    expect(thuc).toEqual(DIEU_KIEN)
    for (const m of DANH_MUC_PHU_KIEN.filter((x) => x.bac === 5)) { expect(m.canChuoiNgay, m.ma).not.toBeNull(); expect(m.suatTong, m.ma).not.toBeNull() }
    for (const m of DANH_MUC_PHU_KIEN.filter((x) => x.bac < 5)) expect(m.suatTong, m.ma).toBeNull()
  })
  it('chữ: tên ≤ 4 từ, Bật mí ≤ 14 từ, không rỗng, không có tên món nào lặp', () => {
    for (const m of DANH_MUC_PHU_KIEN) { expect(m.ten.trim().split(/\s+/).length, m.ten).toBeLessThanOrEqual(4); expect(m.batMi.trim().split(/\s+/).length, m.batMi).toBeLessThanOrEqual(14); expect(m.batMi.length).toBeGreaterThan(10) }
    expect(new Set(DANH_MUC_PHU_KIEN.map((m) => m.ten)).size).toBe(40)
  })
  it('khớp sổ hình của Code 4 (24 món đợt 1): cùng mã, cùng chỗ đeo, cùng bậc; đúng 24 món moBan 1', () => {
    expect(MON_DOT_1).toHaveLength(24)
    for (const h of MON_DOT_1) { const m = docMonPhuKien(h.ma); expect(m, h.ma).toBeDefined(); expect(m!.o, h.ma).toBe(h.o); expect(m!.bac, h.ma).toBe(h.bac); expect(m!.moBan, h.ma).toBe(1) }
    expect(DANH_MUC_PHU_KIEN.filter((m) => m.moBan === 1).map((m) => m.ma).sort()).toEqual(MON_DOT_1.map((h) => h.ma).sort())
    expect(DANH_MUC_PHU_KIEN.filter((m) => m.moBan === 2).every((m) => m.o === 'dau' || m.o === 'co-lung')).toBe(true)
  })
  it('đang bán = đợt mở (1 ⇒ 24 món); mã lạ ⇒ undefined; tệp không dùng window/localStorage (máy chủ nhập)', () => {
    expect(DOT_MO_BAN).toBe(1); expect(monDangBan()).toHaveLength(24)
    expect(docMonPhuKien('ZZ-99')).toBeUndefined(); expect(docMonPhuKien(null)).toBeUndefined(); expect(docMonPhuKien('VD-04')?.ten).toBe('Đuôi Lửa Tím')
    expect(readFileSync(new URL('../src/lib/phu-kien-danh-muc.ts', import.meta.url), 'utf8')).not.toMatch(/\b(window|localStorage|document)\b/)
  })
})
