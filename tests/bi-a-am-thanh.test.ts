// BI-A PHẢN ỨNG · ÂM THANH (đặc tả mục 7): 15 tiếng tổng hợp bằng Web Audio, không tệp âm thanh; gộp va chạm mỗi khung (tối đa 5 bi + 3 băng);
// tắt tiếng dùng CHUNG khoá với trận Đảo (battle-audio); máy không có Web Audio thì im lặng, không lỗi.
import { describe, it, expect, afterEach } from 'vitest'
import { AmThanhBia, DS_TIENG } from '../src/game/bi-a/am-thanh'
import { battleMuted, setBattleMuted } from '../src/game/than-thu-v2/battle-audio'

// AudioContext giả: nút nào cũng nối được, đếm số nguồn âm đã `start`.
function taoCtxGia() {
  const dem = { nguon: 0, nut: 0 }
  const tham = () => ({ value: 0, setValueAtTime() { return this }, linearRampToValueAtTime() { return this }, exponentialRampToValueAtTime() { return this }, setTargetAtTime() { return this }, cancelScheduledValues() { return this } })
  const nut = (): Record<string, unknown> => {
    dem.nut++
    return new Proxy({} as Record<string, unknown>, {
      get(o, k: string) {
        if (k in o) return o[k]
        if (['gain', 'frequency', 'Q', 'pan', 'detune', 'playbackRate', 'threshold', 'knee', 'ratio', 'attack', 'release'].includes(k)) return (o[k] = tham())
        if (k === 'start') return () => { dem.nguon++ }
        return () => {}
      },
      set(o, k: string, v) { o[k] = v; return true },
    })
  }
  const buf = (ch: number, len: number, sr: number) => ({ numberOfChannels: ch, length: len, sampleRate: sr, getChannelData: () => new Float32Array(len) })
  const ctx = {
    sampleRate: 8000, currentTime: 0, state: 'running', destination: nut(),
    createBuffer: buf, createGain: nut, createOscillator: nut, createBufferSource: nut, createBiquadFilter: nut, createStereoPanner: nut,
    createDynamicsCompressor: nut, createConvolver: nut, createWaveShaper: nut, resume: async () => {}, close: async () => {},
  }
  return { ctx: ctx as unknown as AudioContext, dem }
}
afterEach(() => setBattleMuted(false))

describe('AmThanhBia', () => {
  it('máy không có Web Audio ⇒ mọi lệnh im lặng, không ném lỗi', () => {
    const a = new AmThanhBia(() => null)
    expect(() => { a.mo(); for (const k of DS_TIENG) a.phat(k, 500, 0.3); a.gom('bi', 900, 0); a.xa(); a.lan(3000); a.dong() }).not.toThrow()
    expect(a.ctx).toBeNull()
  })
  it('đủ 15 tiếng; tiếng nào cũng phát ra ít nhất một nguồn âm', () => {
    expect(DS_TIENG).toHaveLength(15)
    const { ctx, dem } = taoCtxGia()
    const a = new AmThanhBia(() => ctx)
    a.mo()
    for (const k of DS_TIENG) {
      const truoc = dem.nguon
      a.phat(k, 900, -0.4)
      expect(dem.nguon, `tiếng ${k}`).toBeGreaterThan(truoc)
    }
  })
  it('một khung nhiều va chạm ⇒ chỉ phát 5 tiếng bi + 3 tiếng băng to nhất', () => {
    const { ctx } = taoCtxGia()
    const a = new AmThanhBia(() => ctx)
    a.mo()
    for (let i = 0; i < 9; i++) a.gom('bi', 100 * i, 0)
    for (let i = 0; i < 6; i++) a.gom('bang', 50 * i, 0)
    expect(a.xa()).toBe(8)
    expect(a.xa()).toBe(0) // hàng đã xả
  })
  it('tắt tiếng: không phát nữa, lưu CHUNG khoá với trận Đảo; bản mới đọc lại trạng thái tắt', () => {
    const { ctx, dem } = taoCtxGia()
    const a = new AmThanhBia(() => ctx)
    a.mo()
    a.datTat(true)
    expect(battleMuted()).toBe(true)
    const truoc = dem.nguon
    a.phat('co', 900); a.gom('bi', 900, 0); a.xa()
    expect(dem.nguon).toBe(truoc)
    expect(new AmThanhBia(() => null).tat).toBe(true)
    a.datTat(false)
    expect(battleMuted()).toBe(false)
  })
})
