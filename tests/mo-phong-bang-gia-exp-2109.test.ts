// @vitest-environment node
// MÔ PHỎNG KINH TẾ EXP — (lịch sử) SỬA CÓ CHỦ Ý 29/09/2026 (luật v4, docs/DE-XUAT-EXP-2909.md): mô hình 21/09 ("mỗi ngày hấp thụ tối đa 200, cấp 10 ngày 12") đã bỏ cùng trần hấp thụ.
// Nay khoá: mô phỏng v4 chạy bằng hàm sản phẩm cho đúng bảng mục 4 của đề xuất, và lệnh `npm run mo-phong:bang-gia-exp` chạy được. Bảng nghiệm thu đầy đủ ở tests/exp-v4-2909.test.ts.
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { HO_SO_MO_PHONG, chayMoPhong } from '../src/lib/mo-phong-bang-gia-exp'

// SỬA CÓ CHỦ Ý 29/09 v5 (THẦY ĐÃ CHỐT luật EXP v5, docs/DE-XUAT-EXP-V5-2909.md): mô phỏng v4 (60 ngày) thay bằng v5 (1 300 ngày, 5 hồ sơ). Bảng nghiệm thu đầy đủ: tests/exp-v5-2909.test.ts.
describe('mô phỏng kinh tế EXP v5 (mục 7 của đề xuất 29/09 chiều)', () => {
  it('năm hồ sơ đúng bảng: EXP/ngày 3 494 · 636 · 313 · 152 · 363; cấp 10 ngày 21 · 21 · 38 · 78 · 36; khiên đầu 36 · 36 · 42 · 86 · 62', () => {
    const r = (['cay', 'cham', 'tb', 'yeu', 'quang'] as const).map((k) => chayMoPhong(HO_SO_MO_PHONG[k], 1300))
    expect(r.map((x) => Math.round(x.tbNgay))).toEqual([3494, 636, 313, 152, 363])
    expect(r.map((x) => x.cap[10])).toEqual([21, 21, 38, 78, 36])
    expect(r.map((x) => x.khien[1])).toEqual([36, 36, 42, 86, 62])
    expect([7, 21, 36, 100, 365].map((n) => r[2]!.vangTichLuy[n])).toEqual([438, 1314, 2255, 6263, 22_845])
  })
  it('lệnh `npm run mo-phong:bang-gia-exp` chạy được, in bảng và thoát 0 khi đúng bất biến', () => {
    const ra = execFileSync(process.execPath, ['scripts/mo-phong-bang-gia-exp.mjs'], { cwd: process.cwd(), encoding: 'utf8' })
    expect(ra).toContain('Chăm')
    expect(ra).toContain('ĐẠT')
  })
})
