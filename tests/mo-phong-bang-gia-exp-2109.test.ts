// @vitest-environment node
// MÔ PHỎNG KINH TẾ EXP — SỬA CÓ CHỦ Ý 29/09/2026 (luật v4, docs/DE-XUAT-EXP-2909.md): mô hình 21/09 ("mỗi ngày hấp thụ tối đa 200, cấp 10 ngày 12") đã bỏ cùng trần hấp thụ.
// Nay khoá: mô phỏng v4 chạy bằng hàm sản phẩm cho đúng bảng mục 4 của đề xuất, và lệnh `npm run mo-phong:bang-gia-exp` chạy được. Bảng nghiệm thu đầy đủ ở tests/exp-v4-2909.test.ts.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { HO_SO_MO_PHONG, chayMoPhong } from '../src/lib/mo-phong-bang-gia-exp'

describe('mô phỏng kinh tế EXP v4 (mục 4 của đề xuất 29/09)', () => {
  it('ba hồ sơ đúng bảng: EXP/ngày 584 · 314 · 157; cấp 10 ngày 21 · 38 · 75; khiên đầu 21 · 24 · 45', () => {
    const c = chayMoPhong(HO_SO_MO_PHONG.cham, 60), t = chayMoPhong(HO_SO_MO_PHONG.tb, 60), y = chayMoPhong(HO_SO_MO_PHONG.yeu, 120)
    expect([c, t, chayMoPhong(HO_SO_MO_PHONG.yeu, 60)].map((r) => Math.round(r.tbNgay))).toEqual([584, 314, 157])
    expect([c.cap[10], t.cap[10], y.cap[10]]).toEqual([21, 38, 75])
    expect([c.khienDau, t.khienDau, y.khienDau]).toEqual([21, 24, 45])
    expect([7, 14, 21, 30].map((n) => t.vangTichLuy[n])).toEqual([438, 876, 1314, 1882])
  })
  it('lệnh `npm run mo-phong:bang-gia-exp` chạy được, in bảng và thoát 0 khi đúng bất biến', () => {
    const ra = execFileSync(process.execPath, ['scripts/mo-phong-bang-gia-exp.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
    expect(ra).toContain('Chăm nhất')
    expect(ra).toContain('ĐẠT')
  })
})
