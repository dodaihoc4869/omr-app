// LƯỚI AN TOÀN BẮT «CÂM» (11/11 tối, src/lib/live/luoi-tieng.ts): phía gửi (chuỗi / bộ lọc ra câm ⇒ lùi về mic thô) và phía nghe (gói tới mà thẻ phát đứng ⇒
// bỏ chọn loa, phát lại, vẫn kẹt ⇒ «Chạm để nghe»). Mỗi lưới một công tắc lùi riêng (localStorage), độc lập nhau.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taoLuoiGui, taoLuoiPhat, xetGuiCam, xetPhatKet } from '../src/lib/live/luoi-tieng'

const mt = { hen: (f: () => void, ms: number) => setTimeout(f, ms), huyHen: (h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>), dongHo: () => Date.now() }
const troi = (ms: number) => vi.advanceTimersByTimeAsync(ms)
beforeEach(() => { vi.useFakeTimers({ now: 1_700_000_000_000 }); localStorage.clear() })
afterEach(() => { vi.useRealTimers() })

describe('quyết định thuần', () => {
  it('phía gửi: năng lượng đứng yên ≥ 1,5 giây ⇒ CÂM; tăng ⇒ không; mic vào đang im hẳn ⇒ không trách chuỗi; thiếu số đo / chưa đủ 1,5 giây ⇒ chưa kết luận', () => {
    const m = (nl: (number | null)[]) => nl.map((v, i) => ({ luc: i * 500, nl: v }))
    expect(xetGuiCam(m([5, 5, 5, 5]), true)).toBe(true)
    expect(xetGuiCam(m([5, 5, 5, 5]), null)).toBe(true)
    expect(xetGuiCam(m([5, 5, 5, 5]), false)).toBe(false)
    expect(xetGuiCam(m([5, 5.1, 5.2, 5.3]), true)).toBe(false)
    expect(xetGuiCam(m([5, 5, 5]), true)).toBe(false) // mới 1 giây
    expect(xetGuiCam(m([5, null, 5, 5]), true)).toBe(false)
  })
  it('phía nghe: gói tới + thẻ dừng / thời gian đứng ⇒ KẸT; thẻ tắt tiếng theo ý người dùng hoặc không có gói ⇒ không', () => {
    expect(xetPhatKet({ goiTang: true, tatTieng: false, dung: true, ctTang: 0 })).toBe(true)
    expect(xetPhatKet({ goiTang: true, tatTieng: false, dung: false, ctTang: 0 })).toBe(true)
    expect(xetPhatKet({ goiTang: true, tatTieng: false, dung: false, ctTang: 1 })).toBe(false)
    expect(xetPhatKet({ goiTang: true, tatTieng: true, dung: true, ctTang: 0 })).toBe(false)
    expect(xetPhatKet({ goiTang: false, tatTieng: false, dung: true, ctTang: 0 })).toBe(false)
  })
})

/** Bộ gửi giả: `media-source.totalAudioEnergy` cộng thêm `buoc()` mỗi lần đọc. */
function boGui(buoc: () => number) {
  let nl = 0
  const track = { id: 'chuoi' } as MediaStreamTrack
  return { track, getStats: async () => new Map([['ms', { type: 'media-source', kind: 'audio', totalAudioEnergy: (nl += buoc()) }]]) } as unknown as RTCRtpSender
}

describe('lưới phía GỬI', () => {
  it('chuỗi ra câm (năng lượng đứng) trong khi mic có tiếng ⇒ `khiCam` sau ≈ 1,5–2 giây, đúng một lần', async () => {
    const g = boGui(() => 0), khiCam = vi.fn()
    const l = taoLuoiGui({ gui: () => g, dangXuLy: () => true, micCoTieng: () => true, khiCam, mt })
    await troi(1000); expect(khiCam).not.toHaveBeenCalled()
    await troi(1600); expect(khiCam).toHaveBeenCalledTimes(1)
    l.huy()
  })
  it('chuỗi có tiếng ⇒ không bao giờ lùi; người dùng tắt tiếng (không `dangXuLy`) ⇒ không xét', async () => {
    const khiCam = vi.fn()
    const l1 = taoLuoiGui({ gui: () => boGui(() => 0.01), dangXuLy: () => true, micCoTieng: () => true, khiCam, mt })
    const g = boGui(() => 0)
    const l2 = taoLuoiGui({ gui: () => g, dangXuLy: () => false, micCoTieng: () => true, khiCam, mt })
    await troi(6000)
    expect(khiCam).not.toHaveBeenCalled()
    l1.huy(); l2.huy()
  })
  it('công tắc lùi `ddh.live.luoi-gui` = `tat` ⇒ lưới không làm gì', async () => {
    localStorage.setItem('ddh.live.luoi-gui', 'tat')
    const g = boGui(() => 0), khiCam = vi.fn()
    const l = taoLuoiGui({ gui: () => g, dangXuLy: () => true, micCoTieng: () => true, khiCam, mt })
    await troi(6000)
    expect(khiCam).not.toHaveBeenCalled()
    l.huy()
  })
})

/** Thẻ <audio> giả: `play()` bị chặn tới khi `choPhep`; đang phát thì `currentTime` chạy theo đồng hồ. */
function theGia(sinkId = '') {
  const e = { srcObject: {}, muted: false, paused: true, sinkId, choPhep: false, lanPhat: 0, t0: 0, goiSink: [] as string[],
    get currentTime() { return this.paused ? this.t0 : this.t0 + (Date.now() - this.batDau) / 1000 }, batDau: 0,
    async play() { this.lanPhat += 1; if (!this.choPhep) throw new Error('NotAllowedError'); if (this.paused) { this.paused = false; this.batDau = Date.now() } },
    async setSinkId(id: string) { this.goiSink.push(id); this.sinkId = id } }
  return e
}
const boNhan = () => { let goi = 0; return { getStats: async () => new Map([['ib', { type: 'inbound-rtp', kind: 'audio', packetsReceived: (goi += 50) }]]) } as unknown as RTCRtpReceiver }

describe('lưới phía NGHE', () => {
  it('gói tới mà thẻ đứng ⇒ lần 1 bỏ chọn loa + phát lại, lần 2 phát lại, lần 3 báo KẸT («Chạm để nghe»); chạm ⇒ phát được ⇒ hết kẹt', async () => {
    const e = theGia('loa-usb'), r = boNhan(), khiKet = vi.fn()
    const l = taoLuoiPhat({ the: () => e as unknown as HTMLMediaElement, thu: () => r, khiKet, mt })
    await troi(2100)
    expect(e.goiSink).toEqual(['']) // bỏ loa đã chọn trước
    expect(e.lanPhat).toBe(1)
    await troi(2000)
    expect(khiKet).toHaveBeenLastCalledWith(true)
    expect(l.ket()).toBe(true)
    e.choPhep = true
    window.dispatchEvent(new Event('pointerdown')) // cú chạm của người dùng ⇒ lưới tự phát lại
    await troi(10)
    expect(e.paused).toBe(false)
    await troi(2100)
    expect(khiKet).toHaveBeenLastCalledWith(false)
    l.huy()
  })
  it('thẻ tắt tiếng theo ý người dùng (em tắt «Tiếng», thầy tắt «Phát tiếng em») ⇒ không coi là kẹt', async () => {
    const e = theGia(); e.muted = true
    const khiKet = vi.fn()
    const l = taoLuoiPhat({ the: () => e as unknown as HTMLMediaElement, thu: boNhan, khiKet, mt })
    await troi(6000)
    expect(khiKet).not.toHaveBeenCalledWith(true)
    expect(e.lanPhat).toBe(0)
    l.huy()
  })
  it('công tắc lùi `ddh.live.luoi-phat` = `tat` ⇒ không đụng thẻ; độc lập với lưới phía gửi', async () => {
    localStorage.setItem('ddh.live.luoi-phat', 'tat')
    const e = theGia('loa-usb'), khiKet = vi.fn()
    const l = taoLuoiPhat({ the: () => e as unknown as HTMLMediaElement, thu: boNhan, khiKet, mt })
    const g = boGui(() => 0), khiCam = vi.fn()
    const lg = taoLuoiGui({ gui: () => g, dangXuLy: () => true, micCoTieng: () => true, khiCam, mt })
    await troi(6000)
    expect(e.lanPhat).toBe(0); expect(e.goiSink).toEqual([]); expect(khiKet).not.toHaveBeenCalled()
    expect(khiCam).toHaveBeenCalled() // lưới phía gửi vẫn chạy
    l.huy(); lg.huy()
  })
})
