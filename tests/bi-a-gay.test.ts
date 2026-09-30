// BI-A · HÌNH HỌC GẬY. Sửa 30/09 (thầy duyệt "Bàn Bi-a mới"): bỏ phân nhánh "cầm trúng gậy / kéo ngoài gậy chỉnh tinh × 0,25" —
// kéo ở BẤT KỲ đâu trên bàn là xoay gậy theo góc quét 1 : 1 (test đầy đủ ở bi-a-dieu-khien-3009.test.tsx). Ở đây giữ phần hình học còn dùng.
import { describe, expect, it } from 'vitest'
import { banKinhBatBiCai, chuanGoc, dauGay, gocToi } from '../src/game/bi-a/gay'
import { KeoXoay } from '../src/game/bi-a/dieu-khien-cham'
import { R } from '../src/game/bi-a/vat-ly'

const c = { x: 250, y: 700 }

describe('hình học gậy', () => {
  it('gậy lùi theo lực: đầu gậy lúc lực 1 xa hơn lúc lực 0 đúng 80', () => {
    expect(dauGay(1) - dauGay(0)).toBe(80)
    expect(dauGay(0)).toBe(R + 6)
  })
  it('gocToi: góc từ bi cái tới ngón', () => {
    expect(gocToi(c, { x: 350, y: 700 })).toBeCloseTo(0, 9)
    expect(gocToi(c, { x: 250, y: 800 })).toBeCloseTo(Math.PI / 2, 9)
  })
  it('chuanGoc đưa về (−π, π]', () => {
    expect(chuanGoc(3 * Math.PI)).toBeCloseTo(Math.PI, 9)
    expect(chuanGoc(-Math.PI)).toBeCloseTo(Math.PI, 9)
    expect(chuanGoc(0.5)).toBe(0.5)
  })
  it('vùng kéo bi cái ≥ 2,4 R và ≥ 30 px CSS', () => {
    for (const S of [0.3, 0.5, 0.8, 1.2]) { expect(banKinhBatBiCai(S) * S).toBeGreaterThanOrEqual(30 - 1e-9); expect(banKinhBatBiCai(S)).toBeGreaterThanOrEqual(R * 2.4) }
  })
})

describe('kéo ngoài thân gậy KHÔNG còn bị chia 0,25 (thầy duyệt 30/09)', () => {
  it('quét ngón 40° quanh bi cái ở phía trước bi cái ⇒ gậy xoay đúng 40°, cùng chiều', () => {
    const a = (d: number) => ({ x: c.x + 200 * Math.cos(d * Math.PI / 180), y: c.y + 200 * Math.sin(d * Math.PI / 180) })
    const k = new KeoXoay()
    k.bat(0, 0, 0, a(0), c, 0)
    const g = k.keo(16, 50, 0, a(40), c, 0, 1)!
    expect(g * 180 / Math.PI).toBeCloseTo(40, 6)
  })
})
