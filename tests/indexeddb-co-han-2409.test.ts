// @vitest-environment jsdom
// INDEXEDDB KHÔNG ĐƯỢC TREO (Xiaomi/MIUI): getDb phải bỏ cuộc sau hạn chờ, không treo luồng đăng nhập.
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('idb', () => ({ openDB: () => new Promise(() => {}) }))
import { khongTreo, loadCauHinhMayChu } from '../src/lib/exam-db'

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

describe('khongTreo — trả fallback khi treo/lỗi', () => {
  it('promise treo vĩnh viễn ⇒ trả fallback sau hạn, KHÔNG treo', async () => {
    vi.useFakeTimers()
    const p = khongTreo(new Promise(() => {}), 5_000, 'du-phong')
    await vi.advanceTimersByTimeAsync(6_000)
    await expect(p).resolves.toBe('du-phong')
  })
  it('promise lỗi ⇒ trả fallback ngay', async () => {
    await expect(khongTreo(Promise.reject(new Error('x')), 5_000, 'du-phong')).resolves.toBe('du-phong')
  })
})
