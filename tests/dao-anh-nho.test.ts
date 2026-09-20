// ĐẢO THẦN THÚ bản mới · mục 1: ảnh nhẹ trong public/than-thu-v2/nho/ sinh bằng scripts/cat-anh-than-thu.mjs.
// Test KHÔNG mở Chromium: chỉ so bảng toạ độ với evolution.ts và kiểm tệp đã commit (đủ bộ, đúng trần dung lượng).
import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
// @ts-expect-error script .mjs không có khai báo kiểu
import { oTienHoa, oThe, danhSachTep, THU_MUC_RA, TRAN_THU, TRAN_BE, TRAN_THE, SO_THU, SO_DANG, TRANG_THAI } from '../scripts/cat-anh-than-thu.mjs'
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
  it('khung thẻ tranh nằm trọn trong tấm 1536×1024, né tên hệ ở trên (y ≥ 192) và nhãn trạng thái ở dưới (y ≤ 892), hai nửa không chồng nhau', () => {
    for (let thu = 0; thu < SO_THU; thu++) {
      const [trai, phai] = TRANG_THAI.map((t: string) => oThe(thu, t))
      for (const o of [trai, phai]) {
        expect(o.x).toBeGreaterThanOrEqual(0); expect(o.x + o.canh).toBeLessThanOrEqual(1536)
        expect(o.y).toBeGreaterThanOrEqual(192); expect(o.y + o.canh).toBeLessThanOrEqual(892)
      }
      expect(trai.x + trai.canh).toBeLessThan(768); expect(phai.x).toBeGreaterThan(768)
    }
  })
})

describe('cắt ảnh thần thú — tệp đã sinh', () => {
  const ds = danhSachTep() as { ten: string; loai: 'thu' | 'be' | 'the'; tran: number }[]
  it('đủ 8 × (6 ảnh + 6 ảnh bé + 2 thẻ) = 112 tệp, tên không trùng', () => {
    expect(ds.length).toBe(112)
    expect(new Set(ds.map(t => t.ten)).size).toBe(112)
    expect(ds.filter(t => !existsSync(resolve(THU_MUC_RA, t.ten))).map(t => t.ten)).toEqual([])
  })
  it('đúng trần: ảnh thú ≤ 60 KB, ảnh bé ≤ 12 KB, thẻ tranh ≤ 90 KB', () => {
    expect([TRAN_THU, TRAN_BE, TRAN_THE]).toEqual([60 * 1024, 12 * 1024, 90 * 1024])
    const vuot = ds.filter(t => statSync(resolve(THU_MUC_RA, t.ten)).size > t.tran).map(t => t.ten)
    expect(vuot).toEqual([])
  })
  it('một lần vào đảo (1 ảnh thú + 6 ảnh bé) và một lần mở màn chọn (3 thẻ đầu) đều dưới 400 KB', () => {
    const co = (ten: string) => statSync(resolve(THU_MUC_RA, ten)).size
    for (let thu = 0; thu < SO_THU; thu++) {
      const dao = co(`thu-${thu}-5.webp`) + Array.from({ length: 6 }, (_, d) => co(`thu-${thu}-${d}-be.webp`)).reduce((a, b) => a + b, 0)
      expect(dao, `đảo của thú ${thu}`).toBeLessThan(400 * 1024)
    }
    const theNangNhat = ds.filter(t => t.loai === 'the').map(t => co(t.ten)).sort((a, b) => b - a).slice(0, 4).reduce((a, b) => a + b, 0)
    expect(theNangNhat).toBeLessThan(400 * 1024)
  })
})
