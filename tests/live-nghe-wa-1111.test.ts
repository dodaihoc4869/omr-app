// PHÍA NGHE TRÊN ĐIỆN THOẠI (11/11 tối, #1630 «không nghe thấy gì»): «Chạm để nghe» khi tiếng thầy đã giải mã mà em chưa chạm; «Thử cách khác» phát qua WebAudio.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chamNghe, KHOA_WA, nhoWa, taoNgheWa } from '../src/lib/live/nghe-wa'

class NutGia { ketNoi: unknown[] = []; gain = { value: 1 }; connect(d: unknown) { this.ketNoi.push(d) } disconnect() { this.ketNoi = [] } }
class CtxGia {
  static ds: CtxGia[] = []
  state = 'suspended'; destination = new NutGia(); nguon: NutGia[] = []; khuech: NutGia[] = []; resumeGoi = 0
  constructor() { CtxGia.ds.push(this) }
  async resume() { this.resumeGoi += 1; this.state = 'running' }
  createMediaStreamSource() { const n = new NutGia(); this.nguon.push(n); return n }
  createGain() { const n = new NutGia(); this.khuech.push(n); return n }
}
const track = (id: string) => ({ id, readyState: 'live' }) as unknown as MediaStreamTrack
beforeEach(() => { CtxGia.ds = []; localStorage.clear(); vi.stubGlobal('AudioContext', CtxGia); vi.stubGlobal('MediaStream', class { constructor(public t: unknown[]) {} }) })
afterEach(() => { vi.unstubAllGlobals() })

describe('«Chạm để nghe»', () => {
  it('chỉ hiện khi đang bật nghe, chưa chạm từ lúc vào live, và tiếng thầy đã giải mã > −50 dBFS', () => {
    expect(chamNghe({ nghe: true, daCham: false, db: -24 })).toBe(true)
    expect(chamNghe({ nghe: true, daCham: true, db: -24 })).toBe(false)
    expect(chamNghe({ nghe: true, daCham: false, db: -65 })).toBe(false)
    expect(chamNghe({ nghe: false, daCham: false, db: -24 })).toBe(false)
    expect(chamNghe({ nghe: true, daCham: false, db: null })).toBe(false)
  })
})

describe('«Vẫn không nghe? Thử cách khác» — phát qua WebAudio', () => {
  it('bật trong cú chạm ⇒ AudioContext chạy, mỗi track nhận một nguồn → khuếch đại → loa; mức theo âm lượng; nhớ ở máy; tắt ⇒ gỡ hết', () => {
    const wa = taoNgheWa()
    expect(wa.bat()).toBe(false)
    wa.dat(true)
    expect(localStorage.getItem(KHOA_WA)).toBe('1')
    const c = CtxGia.ds[0]!
    expect(c.resumeGoi).toBe(1)
    const a = track('thay'), b = track('ban')
    wa.capNhat([a, b, null], 1)
    expect(c.nguon.length).toBe(2)
    expect(c.khuech.every((g) => g.ketNoi[0] === c.destination && g.gain.value === 1)).toBe(true)
    wa.capNhat([a, b], 0) // em tắt tiếng / rời màn
    expect(c.nguon.length).toBe(2) // không dựng lại
    expect(c.khuech.every((g) => g.gain.value === 0)).toBe(true)
    wa.capNhat([a], 0.6) // bạn thôi nói ⇒ gỡ nguồn của bạn
    expect(c.nguon[1]!.ketNoi).toEqual([])
    wa.dat(false)
    expect(nhoWa()).toBe(false)
    expect(c.nguon[0]!.ketNoi).toEqual([])
  })
  it('máy không có WebAudio ⇒ giữ tắt, không ném lỗi', () => {
    vi.stubGlobal('AudioContext', undefined)
    const wa = taoNgheWa()
    wa.dat(true)
    expect(wa.bat()).toBe(false)
    wa.capNhat([track('x')], 1)
  })
})
