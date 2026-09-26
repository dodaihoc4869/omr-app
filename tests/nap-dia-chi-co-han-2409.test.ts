// @vitest-environment jsdom
// NẠP ĐỊA CHỈ MÁY CHỦ KHÔNG TREO: fetch(cau-hinh.json) phải có hạn chờ (treo ⇒ bỏ cuộc, trả '').
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadDiaChiMayChuMoiChoEm } from '../src/lib/exam-db'

describe('loadDiaChiMayChuMoiChoEm — có hạn chờ', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })
  it('fetch cau-hinh.json treo ⇒ bỏ cuộc sau hạn chờ, trả "" (không treo)', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation((_u: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_res, rej) => {
        init?.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')))
      }),
    )
    const p = loadDiaChiMayChuMoiChoEm()
    await vi.advanceTimersByTimeAsync(9_000)
    await expect(p).resolves.toBe('')
  })
})
