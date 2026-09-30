// @vitest-environment node
// DANH MỤC PHỤ KIỆN — test KHOÁ giá, bậc, điều kiện, mã (Boss 21/09: giá đi qua soát commit + test khoá; docs/hop-dong-shop-phu-kien-2109.md mục 1).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DANH_MUC_PHU_KIEN, DOT_MO_BAN, O_GAN, PHIEN_BAN, docMonPhuKien, monDangBan } from '../src/lib/phu-kien-danh-muc'
import { S_EXP_NGAY, EXP_MOI_VANG, vangTranNgay } from '../src/lib/kinh-te-game'
import { MON_DOT_1 } from '../src/game/than-thu-v2/phu-kien/phu-kien-mon'

// SỬA CÓ CHỦ Ý 30/09: yêu cầu cân lại giá theo vàng v5; giữ điều kiện học và giao dịch cũ.
const GIA: Record<string, number> = {
  'HQ-01': 40, 'HQ-02': 60, 'HQ-03': 180, 'HQ-04': 240, 'HQ-05': 420, 'HQ-06': 600, 'HQ-07': 1200, 'HQ-08': 2800,
  'VD-01': 40, 'VD-02': 50, 'VD-03': 75, 'VD-04': 150, 'VD-05': 220, 'VD-06': 500, 'VD-07': 1000, 'VD-08': 2400,
  'KT-01': 40, 'KT-02': 60, 'KT-03': 65, 'KT-04': 200, 'KT-05': 280, 'KT-06': 360, 'KT-07': 900, 'KT-08': 2000,
  'DA-01': 50, 'DA-02': 75, 'DA-03': 160, 'DA-04': 260, 'DA-05': 400, 'DA-06': 650, 'DA-07': 1400, 'DA-08': 3200,
  'CL-01': 50, 'CL-02': 65, 'CL-03': 190, 'CL-04': 280, 'CL-05': 460, 'CL-06': 550, 'CL-07': 1600, 'CL-08': 3000,
}
/** mã → [cần chuỗi, cần ấn thạch, số cái] (chỉ món có điều kiện). */
const DIEU_KIEN: Record<string, [number | null, number | null, number | null]> = {
  'HQ-07': [7, null, null], 'HQ-08': [14, 5, 20], 'VD-07': [7, null, null], 'VD-08': [21, null, 25], 'KT-08': [14, null, 30],
  'DA-07': [7, null, null], 'DA-08': [30, 5, 10], 'CL-07': [7, null, null], 'CL-08': [28, null, 15],
}
const KHOANG_GIA: Record<number, [number, number]> = { 1: [40, 75], 2: [150, 280], 3: [360, 650], 4: [900, 1600], 5: [2000, 3200] } // Theo mức vàng v5, xem docs/bat-linh-3009/gia-phu-kien.md

describe('danh mục phụ kiện · khoá bảng giá đã chốt', () => {
  it('40 món, mã khác nhau, đúng định dạng; 8 món mỗi chỗ đeo; 12/10/8/5/5 món theo bậc', () => {
    expect(DANH_MUC_PHU_KIEN).toHaveLength(40)
    expect(new Set(DANH_MUC_PHU_KIEN.map((m) => m.ma)).size).toBe(40)
    for (const m of DANH_MUC_PHU_KIEN) expect(m.ma, m.ma).toMatch(/^(HQ|VD|KT|DA|CL)-0[1-8]$/)
    for (const o of O_GAN) expect(DANH_MUC_PHU_KIEN.filter((m) => m.o === o), o).toHaveLength(8)
    expect([1, 2, 3, 4, 5].map((b) => DANH_MUC_PHU_KIEN.filter((m) => m.bac === b).length)).toEqual([12, 10, 8, 5, 5])
    expect(PHIEN_BAN).toBe('m1-v2')
  })
  it('giá từng món đúng bảng m1-v2 và nằm trong khoảng của bậc; trọn bộ 26.270 vàng (bỏ Huyền thoại 12.870)', () => {
    expect(Object.fromEntries(DANH_MUC_PHU_KIEN.map((m) => [m.ma, m.gia]))).toEqual(GIA)
    for (const m of DANH_MUC_PHU_KIEN) { const [lo, hi] = KHOANG_GIA[m.bac]!; expect(m.gia, m.ma).toBeGreaterThanOrEqual(lo); expect(m.gia, m.ma).toBeLessThanOrEqual(hi) }
    expect(DANH_MUC_PHU_KIEN.reduce((a, m) => a + m.gia, 0)).toBe(26270)
    expect(DANH_MUC_PHU_KIEN.filter((m) => m.bac < 5).reduce((a, m) => a + m.gia, 0)).toBe(12870)
  })
  it('điều kiện học + số cái KHÔNG đổi; mọi món Huyền thoại đều có điều kiện chuỗi và số cái giới hạn; món khác không giới hạn số cái', () => {
    const thuc = Object.fromEntries(DANH_MUC_PHU_KIEN.filter((m) => m.canChuoiNgay !== null || m.canAnThach !== null || m.suatTong !== null).map((m) => [m.ma, [m.canChuoiNgay, m.canAnThach, m.suatTong]]))
    expect(thuc).toEqual(DIEU_KIEN)
    for (const m of DANH_MUC_PHU_KIEN.filter((x) => x.bac === 5)) { expect(m.canChuoiNgay, m.ma).not.toBeNull(); expect(m.suatTong, m.ma).not.toBeNull() }
    for (const m of DANH_MUC_PHU_KIEN.filter((x) => x.bac < 5)) expect(m.suatTong, m.ma).toBeNull()
  })
  it('mỗi chỗ đeo có món đầu tiên trong một ngày vàng tham chiếu v5; bộ khởi đầu ba chỗ đang bán trong hai ngày thận trọng', () => {
    const vangThanTrong = vangTranNgay(S_EXP_NGAY)
    expect(vangThanTrong).toBe(63)
    expect(Math.floor(S_EXP_NGAY / EXP_MOI_VANG)).toBe(114)
    for (const o of O_GAN) expect(Math.min(...DANH_MUC_PHU_KIEN.filter((m) => m.o === o).map((m) => m.gia))).toBeLessThanOrEqual(vangThanTrong)
    const boDau = ['HQ-01', 'VD-01', 'KT-01'].reduce((tong, ma) => tong + docMonPhuKien(ma)!.gia, 0)
    expect(boDau).toBe(120)
    expect(boDau).toBeLessThanOrEqual(2 * vangThanTrong)
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
