// BI-A PHẢN ỨNG · ÂM THANH (đặc tả mục 7): 15 tiếng tổng hợp bằng Web Audio, không tệp âm thanh; gộp va chạm mỗi khung (tối đa 5 bi + 3 băng);
// tắt tiếng dùng CHUNG khoá với trận Đảo (battle-audio); máy không có Web Audio thì im lặng, không lỗi.
import { describe, it, expect, afterEach } from 'vitest'
import { AmThanhBia, DS_TIENG } from '../src/game/bi-a/am-thanh'
import { VanBia } from '../src/game/bi-a/dieu-khien'
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
    expect(() => { a.mo(); for (const k of DS_TIENG) a.phat(k, 500, 0.3); a.gom('bi', 900, 0); a.xa(); a.dong() }).not.toThrow()
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
  it('KHÔNG có tiếng lăn trên nỉ (thầy bỏ 28/09): mở âm thanh không bật nguồn nào chạy liên tục, không còn hàm lan', () => {
    const { ctx, dem } = taoCtxGia()
    const a = new AmThanhBia(() => ctx)
    a.mo()
    expect(dem.nguon).toBe(0)
    expect('lan' in a).toBe(false)
    expect(DS_TIENG).not.toContain('lan')
  })
  it('tiếng bi chạm bi "khô" (cú phá bàn) không gửi sang vang phòng — hàng chục đuôi vang chồng nhau nghe như bi lăn trên nỉ', () => {
    const { ctx, dem } = taoCtxGia()
    const a = new AmThanhBia(() => ctx)
    a.mo()
    let n = dem.nut; a.gom('bi', 1500, 0, false); a.xa(); const coVang = dem.nut - n
    n = dem.nut; a.gom('bi', 1500, 0, true); a.xa(); const kho = dem.nut - n
    expect(coVang - kho).toBe(1) // đúng một nút gửi vang phòng bị bỏ
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
  it('cú PHÁ BÀN thật (thầy 28/09): chỉ phát tiếng bi chạm bi, khô — không tiếng gậy, không băng, không rơi lỗ; cú sau có lại tiếng gậy', () => {
    let s = 7
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    const nhat: string[] = []
    const v = new VanBia({ cheDo: 'don', loai: 'ai', tenEm: 'Em', cauEm: [], chot: null, rand }, {
      moCau: () => {}, ketThuc: () => {},
      am: (k) => { nhat.push(k) },
      gomVa: (k, _v, _x, _y, kho) => { nhat.push(k === 'bi' ? (kho ? 'bi-kho' : 'bi-vang') : k) },
    })
    expect(v.isBreak).toBe(true)
    v.datLuc(1)
    expect(v.ban()).toBe(true)
    for (let i = 0; i < 4000 && v.pha === 'moving'; i++) v.buoc(1 / 60)
    const trongPhaBan = [...nhat]
    expect(trongPhaBan.filter((k) => k === 'bi-kho').length).toBeGreaterThan(5)
    expect(trongPhaBan.filter((k) => ['co', 'bang', 'lo', 'bi-vang'].includes(k))).toEqual([])
    // cú thường sau phá bàn: có lại tiếng gậy
    nhat.length = 0
    v.isBreak = false; v.pha = 'aim'; v.cur = 0; v.datLuc(0.5)
    expect(v.ban()).toBe(true)
    expect(nhat[0]).toBe('co')
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
