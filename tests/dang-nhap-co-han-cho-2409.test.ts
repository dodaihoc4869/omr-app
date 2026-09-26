// @vitest-environment jsdom
// ĐĂNG NHẬP KHÔNG QUAY MÃI: hsDangNhapApi phải có hạn chờ (mạng treo ⇒ trả lỗi, không kẹt spinner).
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
import { hsDangNhapApi } from '../src/lib/exam-api'

describe('hsDangNhapApi — có hạn chờ', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })
  it('fetch treo (không trả) ⇒ ABORT sau hạn chờ ⇒ trả lỗi, KHÔNG treo vô hạn', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation((_u: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_res, rej) => {
        init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
      }),
    )
    const p = hsDangNhapApi('', 'S1', 'mk')
    await vi.advanceTimersByTimeAsync(26_000)
    const r = await p
    expect(r.ok).toBe(false)
    expect(String(r.error)).toMatch(/không trả lời/i)
  })
})
