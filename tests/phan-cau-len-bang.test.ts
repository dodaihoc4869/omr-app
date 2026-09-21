// ĐỘ CHỤM CỦA ĐÁP ÁN SAI (`doChum`) — phần còn sống của `phan-cau-len-bang.ts` sau khi gỡ mã chết (Code 1, 21/09/2026). Các phép kiểm 16–26 của bản phân câu cũ đã xoá cùng hàm của chúng
// (phanCauLenBang, phanMotLuot, xepCau, diemCau, tiLeDungLop, chiDocDapAn, nhacHieuNhamChung, bangChu, dungDuLieuTuCa: 0 nơi nhập; xem docs/ra-soat-du-thua-2109.md D4).
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { doChum } from '../src/lib/phan-cau-len-bang'

describe('độ chụm', () => {
  it('cả lớp sai cùng một phương án → độ chụm 1; sai mỗi em một kiểu → thấp', () => {
    expect(doChum(['B', 'B', 'B', 'B'])).toBe(1)
    expect(doChum(['B', 'C', 'D', 'B'])).toBe(0.5)
    expect(doChum([])).toBe(0)
    expect(doChum(['', '  '])).toBe(0)
  })

  it('bỏ khoảng trắng và giá trị rỗng; một em sai ⇒ chụm 1; ba kiểu sai đều nhau ⇒ 1/3', () => {
    expect(doChum([' B ', 'B', ''])).toBe(1)
    expect(doChum(['A'])).toBe(1)
    expect(doChum(['A', 'B', 'C'])).toBeCloseTo(1 / 3)
    expect(doChum(['A', undefined as unknown as string, 'A'])).toBe(1)
  })

  it('tệp chỉ còn hàm thuần này: không import gì, không nhắc lại chuỗi hàm đã gỡ (chống sống lại mã chết)', () => {
    const nguon = fs.readFileSync(path.join(process.cwd(), 'src/lib/phan-cau-len-bang.ts'), 'utf8')
    expect(nguon).not.toMatch(/^import /m)
    expect(nguon).not.toMatch(/export (function|const) (phanCauLenBang|phanMotLuot|xepCau|diemCau|tiLeDungLop|chiDocDapAn|nhacHieuNhamChung|bangChu|dungDuLieuTuCa)\b/)
    expect((nguon.match(/^export /gm) ?? []).length).toBe(1) // chỉ doChum
  })
})
