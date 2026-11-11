// LIVE — Z2 «Loa» (chọn đầu ra âm thanh, `setSinkId` giả lập) + Z4 lọc ồn nhẹ cho mic của em lên bảng (AudioWorklet + RNNoise, tự tắt khi chậm).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { THAM_LOC_ON } from '../src/lib/live/chuoi-tieng'
import { apLoa, coChonLoa, dsLoa, loaDaNho, nhoLoa, thuLoa } from '../src/lib/live/loa'
import { dungLocMicEm, MA_MIC_EM } from '../src/lib/live/mic-em'

const RN = readFileSync(join(__dirname, '../src/lib/live/loc-on/rnnoise.wasm'))
const rnBuf = (): ArrayBuffer => RN.buffer.slice(RN.byteOffset, RN.byteOffset + RN.byteLength) as ArrayBuffer
type Proto = { setSinkId?: (id: string) => Promise<void> }
const proto = HTMLMediaElement.prototype as unknown as Proto
const datThietBi = (ds: { kind: string; deviceId: string; label: string }[]): void => { Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { enumerateDevices: async () => ds, addEventListener() { /* nghe */ }, removeEventListener() { /* thôi */ } } }) }

afterEach(() => { delete proto.setSinkId; vi.restoreAllMocks(); vi.unstubAllGlobals(); try { localStorage.removeItem('ddh.live.loa') } catch { /* không có */ } })

describe('Z2 · chọn đầu ra âm thanh («Loa»)', () => {
  it('trình duyệt KHÔNG có `setSinkId` (iPhone, Safari) ⇒ `coChonLoa()` false, danh sách rỗng ⇒ giao diện ẩn ô chọn; `apLoa` không ném lỗi', async () => {
    datThietBi([{ kind: 'audiooutput', deviceId: 'default', label: 'Loa máy' }])
    expect(coChonLoa()).toBe(false)
    expect(await dsLoa()).toEqual([])
    expect(await apLoa(document.createElement('audio'), 'x')).toBe(false)
  })

  it('có `setSinkId`: chỉ liệt kê đầu RA, bỏ mục «Communications», mục mặc định gọi rõ «Mặc định của máy — <tên>» và mang mã rỗng', async () => {
    proto.setSinkId = async () => undefined
    datThietBi([
      { kind: 'audioinput', deviceId: 'mic1', label: 'Mic BOYALINK' },
      { kind: 'audiooutput', deviceId: 'default', label: 'Default - Loa (Realtek)' },
      { kind: 'audiooutput', deviceId: 'communications', label: 'Communications - Loa (Realtek)' },
      { kind: 'audiooutput', deviceId: 'a1', label: 'Loa (Realtek)' },
      { kind: 'audiooutput', deviceId: 'b2', label: '' },
    ])
    expect(coChonLoa()).toBe(true)
    expect(await dsLoa()).toEqual([{ id: '', ten: 'Mặc định của máy — Loa (Realtek)' }, { id: 'a1', ten: 'Loa (Realtek)' }, { id: 'b2', ten: 'Loa 3' }])
  })

  it('áp loa cho thẻ âm thanh: gọi `setSinkId` đúng mã; thiết bị đã rút (trình duyệt từ chối) ⇒ về mặc định của máy, trả false, KHÔNG làm đứt tiếng', async () => {
    const goi: string[] = []
    proto.setSinkId = async function (id: string) { goi.push(id); if (id === 'da-rut') throw new DOMException('không thấy', 'NotFoundError') }
    const the = document.createElement('audio')
    expect(await apLoa(the, 'a1')).toBe(true)
    expect(await apLoa(the, 'da-rut')).toBe(false)
    expect(goi).toEqual(['a1', 'da-rut', ''])
    expect(await apLoa(null, 'a1')).toBe(false)
  })

  it('nhớ lựa chọn ở máy; localStorage bị chặn (chế độ riêng tư) ⇒ không ném lỗi, coi như chưa chọn', () => {
    nhoLoa('a1'); expect(loaDaNho()).toBe('a1')
    nhoLoa(''); expect(loaDaNho()).toBe('')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('chặn') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('chặn') })
    expect(() => nhoLoa('b2')).not.toThrow()
    expect(loaDaNho()).toBe('')
  })

  it('«Thử loa»: tiếng thử phát ra ĐÚNG thiết bị đã chọn (thẻ âm thanh riêng được `setSinkId` trước khi phát)', async () => {
    const goi: string[] = []
    let phat = 0
    proto.setSinkId = async (id: string) => { goi.push(id) }
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(async () => { phat++ })
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const nut = () => ({ connect() { /* nối */ }, start() { /* phát */ }, stop() { /* dừng */ }, type: 'sine', frequency: { value: 0 }, gain: { setValueAtTime() { /* đặt */ }, linearRampToValueAtTime() { /* dốc */ } } })
    vi.stubGlobal('AudioContext', class { currentTime = 0; createMediaStreamDestination() { return { stream: {} } } createGain() { return nut() } createOscillator() { return nut() } async resume() { /* chạy */ } async close() { /* đóng */ } })
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', { configurable: true, set() { /* nhận luồng */ }, get() { return null } })
    expect(await thuLoa('a1')).toBe(true)
    expect(goi).toEqual(['a1'])
    expect(phat).toBe(1)
    expect(await thuLoa('')).toBe(true) // mặc định của máy: không cần đổi đầu ra
    expect(goi).toEqual(['a1'])
  })
})

describe('Z4 · lọc ồn nhẹ cho mic của em (AudioWorklet + RNNoise lượt 2)', () => {
  function taoXuLy(tin: unknown[], wasm: ArrayBuffer | null) {
    let Lop: (new (o: unknown) => { process(v: Float32Array[][], r: Float32Array[][]): boolean }) | null = null
    class Goc { port = { postMessage: (m: unknown) => tin.push(m) } }
    new Function('AudioWorkletProcessor', 'registerProcessor', 'postMessage', MA_MIC_EM)(Goc, (_: string, L: typeof Lop) => { Lop = L }, undefined) // phạm vi AudioWorklet thật không có `postMessage` toàn cục
    return new Lop!({ processorOptions: { wasm, muc: THAM_LOC_ON.vua } })
  }
  const on = (n: number, bien = 0.05): Float32Array => { let h = 99; const m = new Float32Array(n); for (let i = 0; i < n; i++) { h = (h * 1103515245 + 12345) & 0x7fffffff; m[i] = (h / 0x7fffffff - 0.5) * 2 * bien } return m }
  const chay = (p: { process(v: Float32Array[][], r: Float32Array[][]): boolean }, x: Float32Array): Float32Array => { const y = new Float32Array(x.length); for (let d = 0; d + 128 <= x.length; d += 128) { const ra = [[new Float32Array(128)]]; p.process([[x.subarray(d, d + 128)]], ra); y.set(ra[0]![0]!, d) } return y }
  const nl = (m: Float32Array, a: number, b: number): number => { let e = 0; for (let i = a; i < b; i++) e += m[i]! * m[i]!; return Math.sqrt(e / (b - a)) }

  it('gom khối 128 mẫu thành khung 10 ms, lọc bằng RNNoise, ra đều nhịp: sau khung đầu không còn khối câm nào; báo `chay` rồi `song`', () => {
    const tin: unknown[] = [], p = taoXuLy(tin, rnBuf()), x = on(128 * 400), y = chay(p, x)
    expect(tin[0]).toEqual({ loc: 'chay' })
    expect(tin).toContainEqual({ song: 1 })
    for (let d = 128 * 8; d + 128 <= y.length; d += 128) expect(nl(y, d, d + 128)).toBeGreaterThan(0)
    expect(nl(y, 128 * 200, y.length)).toBeLessThan(nl(x, 128 * 200, x.length)) // ồn nền đã hạ
  })

  it('luồng âm thanh chạy KHÔNG KỊP (trung bình > 3 ms cho một khung 10 ms, liền 1 giây) ⇒ tự tắt: báo `cham`, từ đó tiếng mic đi THẲNG nguyên vẹn', () => {
    let t = 0
    vi.spyOn(Date, 'now').mockImplementation(() => (t += 5)) // mỗi khung «mất» 5 ms
    const tin: unknown[] = [], p = taoXuLy(tin, rnBuf()), x = on(128 * 800), y = chay(p, x)
    const cham = tin.find((m) => (m as { loc?: string }).loc === 'cham') as { loc: string; ms: number } | undefined
    expect(cham).toBeTruthy()
    expect(cham!.ms).toBeGreaterThan(3)
    for (let i = 128 * 600; i < x.length; i++) expect(y[i]).toBe(x[i])
  })

  it('máy nhanh (dưới 3 ms mỗi khung) ⇒ KHÔNG tự tắt', () => {
    let t = 0
    vi.spyOn(Date, 'now').mockImplementation(() => (t += 0.5))
    const tin: unknown[] = [], p = taoXuLy(tin, rnBuf())
    chay(p, on(128 * 800))
    expect(tin.some((m) => (m as { loc?: string }).loc === 'cham')).toBe(false)
  })

  it('tệp bộ lọc hỏng ⇒ báo `loi`, tiếng mic đi thẳng (không bao giờ câm)', () => {
    const tin: unknown[] = [], p = taoXuLy(tin, new ArrayBuffer(8)), x = on(128 * 20), y = chay(p, x)
    expect(tin).toContainEqual({ loc: 'loi' })
    expect(Array.from(y)).toEqual(Array.from(x))
  })

  describe('lớp dựng (dungLocMicEm): chỉ đổi sang track đã lọc khi bộ lọc CHẠY THẬT; chậm / treo ⇒ đổi lại mic thô', () => {
    function moiTruong(o: { hz?: number; tinh?: string } = {}) {
      const nut: { port: { onmessage: ((e: { data: unknown }) => void) | null }; tuy: unknown }[] = []
      const ctx: { state: string; onstatechange: (() => void) | null; dong: number }[] = []
      vi.stubGlobal('AudioWorkletNode', class { port = { onmessage: null }; tuy: unknown; constructor(_c: unknown, _t: string, tuy: unknown) { this.tuy = tuy; nut.push(this as never) } connect() { /* nối */ } })
      const C = class { sampleRate = o.hz ?? 48000; state = o.tinh ?? 'running'; onstatechange = null; dong = 0; audioWorklet = { addModule: async () => undefined }; constructor() { ctx.push(this as never) } createMediaStreamSource() { return { connect() { /* nối */ } } } createMediaStreamDestination() { return { channelCount: 2, stream: { getAudioTracks: () => [{ kind: 'audio', label: 'da-loc', contentHint: '' }] } } } async resume() { /* chạy */ } async close() { this.dong++ } }
      vi.stubGlobal('AudioContext', C); (window as unknown as { AudioContext: unknown }).AudioContext = C
      const U = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown }
      U.createObjectURL = () => 'blob:mic-em'; U.revokeObjectURL = () => undefined
      return { nut, ctx }
    }
    const luong = {} as MediaStream

    it('bộ lọc báo đã chạy khung đầu + AudioContext đang chạy ⇒ `khiSan` (một lần); báo `cham` ⇒ `khiLui("cham")`', async () => {
      const mt = moiTruong(), san = vi.fn(), lui = vi.fn()
      const l = await dungLocMicEm(luong, rnBuf(), THAM_LOC_ON.vua, { khiSan: san, khiLui: lui })
      expect(l?.ra.label).toBe('da-loc')
      expect((mt.nut[0]!.tuy as { processorOptions: { muc: unknown } }).processorOptions.muc).toEqual(THAM_LOC_ON.vua)
      mt.nut[0]!.port.onmessage!({ data: { loc: 'chay' } })
      expect(san).not.toHaveBeenCalled() // mới nạp xong, chưa có khung nào ra ⇒ chưa đổi track
      mt.nut[0]!.port.onmessage!({ data: { song: 1 } }); mt.nut[0]!.port.onmessage!({ data: { song: 1 } })
      expect(san).toHaveBeenCalledTimes(1)
      mt.nut[0]!.port.onmessage!({ data: { loc: 'cham', ms: 4 } }); mt.nut[0]!.port.onmessage!({ data: { loc: 'cham', ms: 4 } })
      expect(lui).toHaveBeenCalledTimes(1)
      expect(lui).toHaveBeenCalledWith('cham')
      l!.don(); expect(mt.ctx[0]!.dong).toBe(1)
    })

    it('AudioContext CHƯA chạy (iPhone chưa có chạm) ⇒ không đổi sang track đã lọc (track ấy đang câm); đang dùng mà bị treo ⇒ `khiLui("treo")`', async () => {
      const mt = moiTruong({ tinh: 'suspended' }), san = vi.fn(), lui = vi.fn()
      await dungLocMicEm(luong, rnBuf(), THAM_LOC_ON.vua, { khiSan: san, khiLui: lui })
      mt.nut[0]!.port.onmessage!({ data: { song: 1 } })
      expect(san).not.toHaveBeenCalled()
      mt.ctx[0]!.state = 'running'; mt.nut[0]!.port.onmessage!({ data: { song: 1 } })
      expect(san).toHaveBeenCalledTimes(1)
      mt.ctx[0]!.state = 'interrupted'; mt.ctx[0]!.onstatechange!()
      expect(lui).toHaveBeenCalledWith('treo')
    })

    it('AudioContext không chạy 48 kHz, hoặc trình duyệt không có AudioWorklet ⇒ null (cứ gửi mic thô với lọc của trình duyệt)', async () => {
      moiTruong({ hz: 44100 })
      expect(await dungLocMicEm(luong, rnBuf(), THAM_LOC_ON.vua, { khiSan: () => undefined, khiLui: () => undefined })).toBeNull()
      vi.unstubAllGlobals(); vi.stubGlobal('AudioWorkletNode', undefined)
      expect(await dungLocMicEm(luong, rnBuf(), THAM_LOC_ON.vua, { khiSan: () => undefined, khiLui: () => undefined })).toBeNull()
    })
  })
})
