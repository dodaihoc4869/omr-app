// @vitest-environment node
// DANH MỤC PHỤ KIỆN — test KHOÁ giá, bậc, điều kiện, mã (Boss 21/09: giá đi qua soát commit + test khoá; docs/hop-dong-shop-phu-kien-2109.md mục 1).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DANH_MUC_PHU_KIEN, DOT_MO_BAN, O_GAN, PHIEN_BAN, docMonPhuKien, monDangBan } from '../src/lib/phu-kien-danh-muc'
import { MON_DOT_1 } from '../src/game/than-thu-v2/phu-kien/phu-kien-mon'

// SỬA CÓ CHỦ Ý 29/09 (luật v4, docs/DE-XUAT-EXP-2909.md mục 2.6): giá = làmTròn10(63 × số ngày của em trung bình); món đã mua và vàng cũ giữ nguyên.
const GIA: Record<string, number> = {
  'HQ-01': 130, 'HQ-02': 160, 'HQ-03': 300, 'HQ-04': 390, 'HQ-05': 590, 'HQ-06': 770, 'HQ-07': 1320, 'HQ-08': 2990,
  'VD-01': 130, 'VD-02': 140, 'VD-03': 190, 'VD-04': 250, 'VD-05': 370, 'VD-06': 680, 'VD-07': 1100, 'VD-08': 2600,
  'KT-01': 130, 'KT-02': 160, 'KT-03': 170, 'KT-04': 350, 'KT-05': 440, 'KT-06': 500, 'KT-07': 880, 'KT-08': 2210,
  'DA-01': 140, 'DA-02': 190, 'DA-03': 280, 'DA-04': 420, 'DA-05': 550, 'DA-06': 820, 'DA-07': 1540, 'DA-08': 3780,
  'CL-01': 140, 'CL-02': 170, 'CL-03': 320, 'CL-04': 440, 'CL-05': 640, 'CL-06': 730, 'CL-07': 1760, 'CL-08': 3390,
}
/** mã → [cần chuỗi, cần ấn thạch, số cái] (chỉ món có điều kiện). */
const DIEU_KIEN: Record<string, [number | null, number | null, number | null]> = {
  'HQ-07': [7, null, null], 'HQ-08': [14, 5, 20], 'VD-07': [7, null, null], 'VD-08': [21, null, 25], 'KT-08': [14, null, 30],
  'DA-07': [7, null, null], 'DA-08': [30, 5, 10], 'CL-07': [7, null, null], 'CL-08': [28, null, 15],
}
const KHOANG_GIA: Record<number, [number, number]> = { 1: [130, 190], 2: [250, 440], 3: [500, 820], 4: [880, 1760], 5: [2210, 3780] } // 63 × (2–3 · 4–7 · 8–13 · 14–28 · 35–60 ngày)

describe('danh mục phụ kiện · khoá bảng giá đã chốt', () => {
  it('40 món, mã khác nhau, đúng định dạng; 8 món mỗi chỗ đeo; 12/10/8/5/5 món theo bậc', () => {
    expect(DANH_MUC_PHU_KIEN).toHaveLength(40)
    expect(new Set(DANH_MUC_PHU_KIEN.map((m) => m.ma)).size).toBe(40)
    for (const m of DANH_MUC_PHU_KIEN) expect(m.ma, m.ma).toMatch(/^(HQ|VD|KT|DA|CL)-0[1-8]$/)
    for (const o of O_GAN) expect(DANH_MUC_PHU_KIEN.filter((m) => m.o === o), o).toHaveLength(8)
    expect([1, 2, 3, 4, 5].map((b) => DANH_MUC_PHU_KIEN.filter((m) => m.bac === b).length)).toEqual([12, 10, 8, 5, 5])
    expect(PHIEN_BAN).toBe('m1-v1')
  })
  it('giá từng món đúng bảng chốt v4 và nằm trong khoảng của bậc; trọn bộ 32.260 vàng (bỏ Huyền thoại 17.290)', () => {
    expect(Object.fromEntries(DANH_MUC_PHU_KIEN.map((m) => [m.ma, m.gia]))).toEqual(GIA)
    for (const m of DANH_MUC_PHU_KIEN) { const [lo, hi] = KHOANG_GIA[m.bac]!; expect(m.gia, m.ma).toBeGreaterThanOrEqual(lo); expect(m.gia, m.ma).toBeLessThanOrEqual(hi) }
    expect(DANH_MUC_PHU_KIEN.reduce((a, m) => a + m.gia, 0)).toBe(32260)
    expect(DANH_MUC_PHU_KIEN.filter((m) => m.bac < 5).reduce((a, m) => a + m.gia, 0)).toBe(17290)
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
