// SỬA CÓ CHỦ ĐÍCH 14/10: giữ 96 ảnh đăng nhập/màn chiếu; bỏ kiểm 16 thẻ tranh của game đã ngừng.
// Test KHÔNG mở Chromium: chỉ so bảng toạ độ với evolution.ts và kiểm tệp đã commit (đủ bộ, đúng trần dung lượng).
import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
// @ts-expect-error script .mjs không có khai báo kiểu
import { oTienHoa, danhSachTep, THU_MUC_RA, TRAN_THU, TRAN_BE, SO_THU, SO_DANG } from '../scripts/cat-anh-than-thu.mjs'
import { EVOLUTION_LEVELS, evolutionCrop, evolutionMirror } from '../src/game/than-thu-v2/evolution'

describe('cắt ảnh thần thú — bảng toạ độ', () => {
  it('48 ô tiến hoá khớp evolutionCrop + evolutionMirror của game', () => {
    for (let thu = 0; thu < SO_THU; thu++) for (let dang = 0; dang < SO_DANG; dang++) {
      const cap = EVOLUTION_LEVELS[dang]!, goc = evolutionCrop(thu, cap), o = oTienHoa(thu, dang)
      expect({ atlas: o.atlas, x: o.x, y: o.y, width: o.width, height: o.height }, `thú ${thu} dạng ${dang}`).toEqual({ atlas: goc.atlas, x: goc.x, y: goc.y, width: goc.width, height: goc.height })
      expect(o.lat).toBe(evolutionMirror(thu, cap))
      // khung vuông 288 px không phóng/thu ⇒ ô gốc phải lọt khung
      expect(Math.max(o.width, o.height)).toBeLessThanOrEqual(288)
    }
  })

})

describe('cắt ảnh thần thú — tệp đã sinh', () => {
  const ds = danhSachTep() as { ten: string; loai: 'thu' | 'be'; tran: number }[]
  it('đủ 8 × (6 ảnh + 6 ảnh bé) = 96 tệp, tên không trùng', () => {
    expect(ds.length).toBe(96)
    expect(new Set(ds.map(t => t.ten)).size).toBe(96)
    expect(ds.filter(t => !existsSync(resolve(THU_MUC_RA, t.ten))).map(t => t.ten)).toEqual([])
  })
  it('đúng trần: ảnh thú ≤ 60 KB, ảnh bé ≤ 12 KB', () => {
    expect([TRAN_THU, TRAN_BE]).toEqual([60 * 1024, 12 * 1024])
    const vuot = ds.filter(t => statSync(resolve(THU_MUC_RA, t.ten)).size > t.tran).map(t => t.ten)
    expect(vuot).toEqual([])
  })
  it('một ảnh thú + sáu ảnh bé dùng trong màn chiếu đều dưới 400 KB', () => {
    const co = (ten: string) => statSync(resolve(THU_MUC_RA, ten)).size
    for (let thu = 0; thu < SO_THU; thu++) {
      const dao = co(`thu-${thu}-5.webp`) + Array.from({ length: 6 }, (_, d) => co(`thu-${thu}-${d}-be.webp`)).reduce((a, b) => a + b, 0)
      expect(dao, `đảo của thú ${thu}`).toBeLessThan(400 * 1024)
    }

  })
})
