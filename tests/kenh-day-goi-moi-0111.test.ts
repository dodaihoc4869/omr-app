// @vitest-environment jsdom
// MÁY EM NHẬN TIN «THẦY GIAO BÀI MỚI» (thầy 01/11: «Tự động tải lại câu mới đề và đáp án về máy học sinh»): tin kênh đẩy `{"t":"doi","k":["goi"]}` ⇒ tải lại NGAY gói
// cả ngày (`napGoiNgay(token, …, luon = true)` — bỏ nhịp 10 phút) + vẫn phát SU_KIEN_DOI để Sảnh / kế hoạch đọc lại; tin khác (`hoc`) ⇒ không tải gói.
// Nối lại sau khi mất kết nối ⇒ tải gói theo nhịp thường (`luon = false`).
import { afterEach, describe, expect, it, vi } from 'vitest'

const napGoiNgay = vi.fn(async () => {})
vi.mock('../src/components/hoc-tap/mo-chang-truoc', () => ({ napGoiNgay }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
import { moKenhDay, SU_KIEN_DOI } from '../src/lib/kenh-day'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); napGoiNgay.mockClear() })
const json = (o: unknown) => new Response(JSON.stringify(o), { headers: { 'content-type': 'application/json' } })

describe('kênh đẩy: tin giao bài mới', () => {
  it('k:goi ⇒ tải lại gói cả ngày NGAY (luon) + phát SU_KIEN_DOI; k:hoc ⇒ chỉ phát; nối lại ⇒ tải gói theo nhịp thường', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const ds: { onopen?: () => void; onclose?: () => void; onmessage?: (e: { data: unknown }) => void }[] = []
    class WsGia { onopen?: () => void; onclose?: () => void; onmessage?: (e: { data: unknown }) => void; onerror?: () => void; readyState = 1; constructor() { ds.push(this) } close() {} send() {} }
    vi.stubGlobal('WebSocket', WsGia)
    vi.stubGlobal('fetch', vi.fn(async () => json({ ok: true, ve: 'v' })))
    const nghe = vi.fn()
    window.addEventListener(SU_KIEN_DOI, nghe)
    const dong = moKenhDay('tk')
    await vi.advanceTimersByTimeAsync(50)
    ds[0]!.onopen?.()
    ds[0]!.onmessage?.({ data: '{"t":"doi","k":["hoc"]}' })
    await vi.advanceTimersByTimeAsync(600)
    expect(napGoiNgay).not.toHaveBeenCalled()
    expect(nghe).toHaveBeenCalledTimes(1)
    ds[0]!.onmessage?.({ data: '{"t":"doi","k":["goi"]}' })
    await vi.advanceTimersByTimeAsync(600)
    expect(napGoiNgay).toHaveBeenCalledTimes(1)
    expect(napGoiNgay.mock.calls[0]).toEqual(['tk', undefined, expect.any(Number), true])
    expect(nghe).toHaveBeenCalledTimes(2)
    ds[0]!.onclose?.()
    await vi.advanceTimersByTimeAsync(3_000)
    ds[1]!.onopen?.()
    await vi.advanceTimersByTimeAsync(600)
    expect(napGoiNgay).toHaveBeenCalledTimes(2)
    expect(napGoiNgay.mock.calls[1]![3]).toBe(false)
    dong()
    window.removeEventListener(SU_KIEN_DOI, nghe)
  })
})
