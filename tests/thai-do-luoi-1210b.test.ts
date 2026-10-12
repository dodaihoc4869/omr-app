// Thầy 12/10 duyệt bản vẽ: nhãn thái độ trong tấm Hồ sơ làm bài dùng CÙNG luật nhóm Nhịp học ở Hôm nay —
// Lười = đủ mức ≤ 40% số ngày đã tính HOẶC ≥ 3 ngày liền không làm; Chăm chỉ ≥ 80%; ở giữa Chưa đều.
import { describe, expect, it } from 'vitest'
import { ketLuanThaiDo } from '../server/src/bai-hang-ngay'
import type { MucTinHieu, TinHieuThaiDo } from '../server/src/bai-hang-ngay-kieu'
import { nhomTheoLuat } from '../src/lib/nhip-hoc-thay'

const tin = (ma: TinHieuThaiDo['ma'], muc: MucTinHieu, tu = 0, mau = 0): TinHieuThaiDo =>
  ({ ma, ten: ma, tu, mau, giaTri: mau ? Math.round((tu / mau) * 100) : null, muc, chu: ma, nguong: '' }) as TinHieuThaiDo

/** Sáu tín hiệu: (a) ngày đủ mức `du`/`n`, các tín hiệu khác trong ngưỡng. */
function bo(du: number, n: number): TinHieuThaiDo[] {
  const p = (du / n) * 100
  return [
    tin('ngay-du-muc', n < 3 ? 'chua-du' : p >= 80 ? 'tot' : p >= 50 ? 'chu-y' : 'xau', du, n),
    tin('qua-nhanh', 'tot'), tin('don-bai', 'tot'), tin('goi-y', 'tot'), tin('chon-lap', 'tot'), tin('xu-huong', 'tot'),
  ]
}

describe('nhãn thái độ = luật nhóm Nhịp học', () => {
  it.each([
    [9, 11, 0, 'cham-chi', 'cham'],
    [7, 11, 0, 'chua-deu', 'chua-deu'],
    [5, 11, 0, 'chua-deu', 'chua-deu'],
    [4, 11, 0, 'luoi', 'luoi'],
    [0, 11, 11, 'luoi', 'luoi'],
    [9, 11, 3, 'luoi', 'luoi'],
    [2, 2, 0, 'chua-du-du-lieu', 'chua-du'],
  ] as const)('đủ %i/%i ngày, %i ngày liền không làm ⇒ hồ sơ %s, Hôm nay %s', (du, n, chuoi, nhan, nhom) => {
    expect(ketLuanThaiDo(bo(du, n), chuoi).nhan).toBe(nhan)
    expect(nhomTheoLuat(n, du, chuoi)).toBe(nhom)
  })

  it('Lười vì chuỗi ngày bỏ ⇒ lý do ghi rõ số ngày liền', () => {
    const k = ketLuanThaiDo(bo(9, 11), 4)
    expect(k.chu).toBe('Lười')
    expect(k.lyDo.join(' ')).toContain('4 ngày liền không làm câu nào')
  })
})
