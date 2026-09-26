// @vitest-environment jsdom
// INDEXEDDB KHÔNG ĐƯỢC TREO (Xiaomi/MIUI): getDb phải bỏ cuộc sau hạn chờ, không treo luồng đăng nhập.
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('idb', () => ({ openDB: () => new Promise(() => {}) }))
import { loadCauHinhMayChu } from '../src/lib/exam-db'

describe('getDb — có hạn chờ (IndexedDB treo)', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })
  it('openDB treo vĩnh viễn ⇒ loadCauHinhMayChu trả cấu hình an toàn sau hạn chờ, KHÔNG treo', async () => {
    vi.useFakeTimers()
    const p = loadCauHinhMayChu()
    await vi.advanceTimersByTimeAsync(6_000)
    const ch = await p
    expect(ch).toBeTruthy()
    expect(ch.URL).toBeFalsy()
  })
})
