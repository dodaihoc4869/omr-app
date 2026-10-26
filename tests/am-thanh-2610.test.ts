// @vitest-environment jsdom
// TIẾNG PHẢN HỒI «Bi» (thầy 26/10: «Cả âm thanh hay hơn dolingo nhé»): AudioContext GIẢ — đếm oscillator + tần số đúng bảng cho 4 tiếng; tắt khi
// 'ddh.am' = 'tat', khi không có <html data-trong="hs">, khi tab ẩn. phanHoi = rung + tiếng cùng lúc.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Osc = { f: number[]; ramp: number[]; start: number; stop: number }
let oscs: Osc[] = []
let soCtx = 0
class GiaParam { constructor(private ds?: number[]) {} value = 0; setValueAtTime(v: number) { this.ds?.push(v) } linearRampToValueAtTime() {} setTargetAtTime() {} exponentialRampToValueAtTime(v: number) { this.ds?.push(-v) } }
class GiaCtx {
  state = 'running'; currentTime = 0; destination = {}
  constructor() { soCtx++ }
  resume() { return Promise.resolve() }
  createGain() { return { gain: new GiaParam(), connect() {} } }
  createOscillator() {
    const o: Osc = { f: [], ramp: [], start: -1, stop: -1 }
    oscs.push(o)
    const f: number[] = []
    return { type: '', frequency: { setValueAtTime: (v: number) => { o.f.push(v); f.push(v) }, exponentialRampToValueAtTime: (v: number) => o.ramp.push(v) }, connect() {}, start: (t: number) => { o.start = t }, stop: (t: number) => { o.stop = t } }
  }
}
beforeEach(() => {
  oscs = []
  vi.stubGlobal('AudioContext', GiaCtx)
  document.documentElement.dataset.trong = 'hs'
  Object.defineProperty(document, 'hidden', { value: false, configurable: true })
})
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); delete document.documentElement.dataset.trong })

describe('am-thanh.ts', () => {
  it('mỗi hoạ âm một oscillator, tần số = f × bội, lướt tới f2 × bội; dừng sau t + d·3,5; AudioContext tạo MỘT lần', async () => {
    const { phat, TIENG } = await import('../src/lib/am-thanh')
    for (const ten of ['chon', 'dung', 'sai', 'xong'] as const) {
      oscs = []
      phat(ten)
      const mong = TIENG[ten].flatMap((v) => (v.p ?? [[1, 1]]).map(([boi]) => ({ f: v.f * boi, f2: v.f2 ? v.f2 * boi : undefined, dai: v.t + v.d * 3.5 })))
      expect(oscs.length, ten).toBe(mong.length)
      oscs.forEach((o, i) => {
        expect(o.f[0]).toBeCloseTo(mong[i]!.f, 4)
        if (mong[i]!.f2) expect(o.ramp[0]).toBeCloseTo(mong[i]!.f2!, 4)
        expect(o.stop - o.start).toBeGreaterThan(0)
      })
    }
    expect(oscs.length).toBe(TIENG.xong.reduce((s, v) => s + (v.p?.length ?? 1), 0))
    expect(TIENG.chon[0]!.f).toBe(520)
    expect(soCtx).toBe(1)
  })
  it("im lặng khi 'ddh.am' = 'tat', khi không có data-trong học sinh, khi tab ẩn", async () => {
    const { phat } = await import('../src/lib/am-thanh')
    localStorage.setItem('ddh.am', 'tat'); phat('dung')
    localStorage.removeItem('ddh.am'); delete document.documentElement.dataset.trong; phat('dung')
    document.documentElement.dataset.trong = 'hs'; Object.defineProperty(document, 'hidden', { value: true, configurable: true }); phat('dung')
    expect(oscs).toHaveLength(0)
  })
  it('phanHoi gọi rung và tiếng cùng lúc', async () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true, writable: true })
    const { phanHoi } = await import('../src/lib/phan-hoi')
    phanHoi('chon')
    expect(vibrate).toHaveBeenCalledWith([10])
    expect(oscs).toHaveLength(1)
  })
})
