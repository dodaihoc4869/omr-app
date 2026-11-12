// @vitest-environment jsdom
// Live theo khối: mảnh em-khoi nạp lười — tin giữ trong lúc tải được phát lại đúng thứ tự; nối lại sau khi đã nạp chạy đồng bộ như cũ.
import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/components/live-khoi/LopNoiEm', () => ({ default: () => null }))
class Ws extends EventTarget { readyState = 1; send = vi.fn() }
const em = JSON.stringify({ t: 'em', live: { khoi: { k: 11, gd: 'cho', che: 'hoc' } }, em: { sbd: 'A1', ten: 'An', doi: 2, vao: true } })
const ds = JSON.stringify({ t: 'lop-ds', ds: [['A1', 'An', 2, 0]], kj: [1, 2, 3, 4] })
const tin = (w: Ws, d: string) => w.dispatchEvent(Object.assign(new Event('message'), { data: d }))

describe('em-khoi nạp lười', () => {
  it('phát lại tin đã giữ rồi nhận tin mới; socket mới sau khi đã nạp nối ngay', async () => {
    const m = await import('../src/components/live-khoi/em-khoi')
    const w = new Ws()
    m.noiKhoi(w as unknown as WebSocket, [em, ds])
    expect(m.layKho().khoi).toEqual({ k: 11, gd: 'cho', che: 'hoc' })
    expect(m.layKho().noi).toBe(true)
    expect(m.layKho().kj).toEqual([1, 2, 3, 4])
    tin(w, JSON.stringify({ t: 'lop-ds', ds: [], kj: [9, 0, 0, 0] }))
    expect(m.layKho().kj[0]).toBe(9)
    const w2 = new Ws()
    m.noiKhoi(w2 as unknown as WebSocket)
    tin(w, JSON.stringify({ t: 'lop-ds', ds: [], kj: [5, 0, 0, 0] }))
    expect(m.layKho().kj[0]).toBe(9) // socket cũ không còn được nghe
    tin(w2, JSON.stringify({ t: 'lop-ds', ds: [], kj: [7, 0, 0, 0] }))
    expect(m.layKho().kj[0]).toBe(7)
    m.dongKhoi()
  })
})
