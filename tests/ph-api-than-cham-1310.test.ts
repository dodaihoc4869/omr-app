// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { layNhipHocCon, layHoSoThaiDoCon, layLichSuLamCauCon } from '../src/lib/ho-so-con-ph-api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/ph-token', () => ({ docPass: () => '' }))
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

describe('lệnh phụ huynh hết giờ cả khi thân phản hồi đang chờ', () => {
  it.each([layNhipHocCon, layHoSoThaiDoCon, layLichSuLamCauCon])('không treo hồ sơ nếu headers về nhưng JSON chưa về: %s', async (goi) => {
    vi.useFakeTimers()
    let dk!: ReadableStreamDefaultController<Uint8Array>
    let signal!: AbortSignal
    vi.stubGlobal('fetch', vi.fn(async (_url: string, o: RequestInit) => {
      signal = o.signal!
      const stream = new ReadableStream<Uint8Array>({ start(c) { dk = c } })
      signal.addEventListener('abort', () => dk.error(new DOMException('Hết giờ', 'AbortError')), { once: true })
      return new Response(stream, { status: 200, headers: { 'content-type': 'application/json' } })
    }))
    let kq: Awaited<ReturnType<typeof layNhipHocCon>> | undefined
    void goi('A').then((r) => { kq = r as typeof kq })
    await vi.advanceTimersByTimeAsync(20_000)
    expect(signal.aborted).toBe(true)
    expect(kq).toMatchObject({ ok: false, loai: 'cham' })
    expect(vi.getTimerCount()).toBe(0)
  })
})
