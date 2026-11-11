// 11/11 tối — «câm cả hai chiều» trên máy thật: (1) «Loa» chỉ gọi `setSinkId` khi người dùng chọn loa KHÁC mặc định, có công tắc lùi riêng; (2) cảnh báo loa
// mặc định là CHÍNH bộ thu mic (BOYALINK…); (3) so tên thiết bị khi mã mic đổi; (4) máy em đang phát mic không còn hạ tiếng thầy xuống 0,25.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loiThietBi, rangBuocMic, tenGon } from '../src/lib/live/thang-mic'
import { amLuongKhiNoi } from '../src/lib/live/em'

type TheGia = HTMLAudioElement & { sinkId: string }
let goiSink: string[] = []
let thietBi: { kind: string; deviceId: string; label: string }[] = []
beforeEach(() => {
  goiSink = []; thietBi = []
  localStorage.clear()
  Object.defineProperty(HTMLMediaElement.prototype, 'setSinkId', { configurable: true, writable: true, value: async function (this: TheGia, id: string) { goiSink.push(id); Object.defineProperty(this, 'sinkId', { configurable: true, value: id }) } })
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { enumerateDevices: async () => thietBi } })
  vi.resetModules()
})
afterEach(() => { delete (HTMLMediaElement.prototype as unknown as Record<string, unknown>).setSinkId })

describe('Loa: chỉ đụng `setSinkId` khi đã chọn loa khác mặc định', () => {
  it('thẻ mới ở mặc định ⇒ không gọi `setSinkId`; chọn lại «Mặc định» khi thẻ đang ở mặc định ⇒ cũng không gọi', async () => {
    const { theAmLoa, boLoa, apLoa } = await import('../src/lib/live/loa')
    const t = theAmLoa()
    expect(goiSink).toEqual([])
    expect(await apLoa(t, '')).toBe(true)
    expect(await boLoa.dat('')).toBe(true)
    expect(goiSink).toEqual([])
  })
  it('chọn loa khác ⇒ áp cho mọi thẻ đã có + thẻ tạo sau; chọn lại mặc định ⇒ đưa các thẻ ấy về mặc định', async () => {
    const { theAmLoa, boLoa } = await import('../src/lib/live/loa')
    const a = theAmLoa()
    await boLoa.dat('loa-lop')
    expect(goiSink).toEqual(['loa-lop'])
    const b = theAmLoa()
    await Promise.resolve()
    expect((b as TheGia).sinkId).toBe('loa-lop')
    expect(localStorage.getItem('ddh.live.loa')).toBe('loa-lop')
    await boLoa.dat('')
    expect((a as TheGia).sinkId).toBe('')
    expect(localStorage.getItem('ddh.live.loa')).toBeNull()
  })
  it('công tắc lùi `ddh.live.loa-chon` = `tat` ⇒ ẩn ô chọn, KHÔNG BAO GIỜ gọi `setSinkId` (kể cả loa đã nhớ từ trước)', async () => {
    localStorage.setItem('ddh.live.loa', 'loa-cu'); localStorage.setItem('ddh.live.loa-chon', 'tat')
    const { theAmLoa, boLoa, coChonLoa, dsLoa } = await import('../src/lib/live/loa')
    expect(coChonLoa()).toBe(false)
    expect(await dsLoa()).toEqual([])
    theAmLoa()
    expect(await boLoa.dat('loa-lop')).toBe(false)
    expect(goiSink).toEqual([])
  })
})

describe('Cảnh báo: loa mặc định là CHÍNH bộ thu mic', () => {
  it('«Default - Speakers (BOYALINK)» + mic «Microphone (BOYALINK)» ⇒ nhắc tên loa; loa Realtek ⇒ không nhắc; đã chọn loa khác ⇒ không nhắc', async () => {
    thietBi = [{ kind: 'audiooutput', deviceId: 'default', label: 'Default - Speakers (BOYALINK)' }, { kind: 'audiooutput', deviceId: 'r1', label: 'Speakers (Realtek(R) Audio)' }]
    const { loaTrungMic, boLoa } = await import('../src/lib/live/loa')
    expect(await loaTrungMic('Microphone (BOYALINK)')).toBe('Speakers (BOYALINK)')
    expect(await loaTrungMic('Microphone (2- BOYALINK)')).toBe('Speakers (BOYALINK)')
    expect(await loaTrungMic('Microphone Array (Intel® Smart Sound Technology for Digital Microphones)')).toBe('')
    expect(await loaTrungMic('')).toBe('')
    await boLoa.dat('r1')
    expect(await loaTrungMic('Microphone (BOYALINK)')).toBe('')
  })
})

describe('Thang nới mic: thiết bị luôn `exact`, so tên thiết bị', () => {
  it('ba bậc chỉ nới phần xử lý tiếng; không bậc nào để thiết bị là «ideal»', () => {
    for (const b of [0, 1, 2]) expect(rangBuocMic('usb1', true, b).deviceId).toEqual({ exact: 'usb1' })
    expect(rangBuocMic('usb1', true, 0)).toMatchObject({ echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: { ideal: 48000 } })
    expect(rangBuocMic('usb1', true, 1)).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: true })
    expect(rangBuocMic('usb1', true, 2)).toMatchObject({ echoCancellation: false, noiseSuppression: false, autoGainControl: false })
    expect(rangBuocMic(null, false, 0)).not.toHaveProperty('deviceId')
  })
  it('tên gọn bỏ «Default - », số Windows thêm khi cắm cổng khác; lõi thiết bị là phần trong ngoặc', () => {
    expect(tenGon('Default - Microphone (2- BOYALINK)')).toBe('microphone (boyalink)')
    expect(loiThietBi('Speakers (BOYALINK)')).toBe('boyalink')
    expect(loiThietBi('Microphone Array (Intel® Smart Sound Technology for Digital Microphones)')).toBe('intel® smart sound technology for digital microphones')
    expect(loiThietBi('Loa ngoài')).toBe('loa ngoài')
  })
})

describe('Máy em đang phát mic: âm lượng tiếng thầy', () => {
  const luong = (ec: boolean | undefined) => ({ getAudioTracks: () => [{ getSettings: () => (ec === undefined ? {} : { echoCancellation: ec }) }] }) as unknown as MediaStream
  it('có khử vọng của trình duyệt ⇒ 1 (không hạ); không có / không biết ⇒ 0,6 — không còn 0,25 (điện thoại gần như câm)', () => {
    expect(amLuongKhiNoi(luong(true))).toBe(1)
    expect(amLuongKhiNoi(luong(false))).toBe(0.6)
    expect(amLuongKhiNoi(luong(undefined))).toBe(0.6)
    expect(amLuongKhiNoi(null)).toBe(0.6)
  })
})
