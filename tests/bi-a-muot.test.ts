// BI-A PHẢN ỨNG · MƯỢT (thầy 29/09: màn nhấp nháy, bàn tự xoay, bi giật).
// (b) Hướng bàn chốt theo khung nhìn: máy dọc ⇒ bàn dọc dù hộp bàn tạm thấp; khung ngang có trễ 8% (không lật qua lại).
// (c) Vẽ nội suy giữa hai bước vật lý: vị trí vẽ nằm giữa bước trước và bước hiện tại, tốc độ vẽ đều giữa các khung.
import { describe, it, expect } from 'vitest'
import { tinhKhungBan } from '../src/game/bi-a/bo-cuc'
import { VanBia } from '../src/game/bi-a/dieu-khien'

describe('hướng bàn Bi-a', () => {
  it('khung nhìn dọc: hộp bàn thấp (344 × 334) vẫn giữ bàn DỌC', () => {
    expect(tinhKhungBan(344, 334).xoay).toBe(true) // cách cũ: phần dư thấp ⇒ nằm ngang
    expect(tinhKhungBan(344, 334, { khungDoc: true }).xoay).toBe(false)
    expect(tinhKhungBan(344, 343, { khungDoc: true }).xoay).toBe(false)
  })
  it('khung ngang: có trễ — gần ngưỡng thì giữ hướng cũ, chỉ đổi khi chiều kia to hơn rõ', () => {
    // 344 × 337: hai chiều gần bằng nhau
    expect(tinhKhungBan(344, 337, { xoayCu: false }).xoay).toBe(false)
    expect(tinhKhungBan(344, 337, { xoayCu: true }).xoay).toBe(true)
    expect(tinhKhungBan(900, 400, { xoayCu: false }).xoay).toBe(true)
    expect(tinhKhungBan(400, 900, { xoayCu: true }).xoay).toBe(false)
  })
})

describe('nội suy khi vẽ', () => {
  it('vị trí vẽ nằm giữa bước trước và bước hiện tại; tốc độ vẽ đều dù dt khung lệch nhịp 240 Hz', () => {
    let s = 11
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    const v = new VanBia({ cheDo: 'don', loai: 'ai', tenEm: 'Em', cauEm: [], chot: null, rand }, { moCau: () => {}, ketThuc: () => {}, am: () => {}, gomVa: () => {} })
    const i = v.st.balls.findIndex((b) => b.id === 'cue')
    const o = { x: 0, y: 0 }
    v.viTriVe(i, o)
    expect(o).toEqual({ x: v.st.balls[i]!.x, y: v.st.balls[i]!.y }) // chưa lăn: vẽ đúng chỗ
    v.aim = { x: 1, y: 0 }; v.datLuc(0.3); v.isBreak = false
    expect(v.ban()).toBe(true)
    // khung 1/90 giây (máy 90 Hz): 2,67 bước mỗi khung
    const ve: number[] = []
    for (let k = 0; k < 8; k++) { v.buoc(1 / 90); v.viTriVe(i, o); ve.push(o.x) }
    const d = ve.slice(1).map((x, k) => x - ve[k]!)
    const tb = d.reduce((a, b) => a + b, 0) / d.length
    for (const x of d) expect(Math.abs(x - tb) / tb).toBeLessThan(0.05)
  })
})
