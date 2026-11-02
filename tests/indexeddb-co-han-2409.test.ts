// @vitest-environment jsdom
// INDEXEDDB KHÔNG ĐƯỢC TREO (Xiaomi/MIUI): getDb phải bỏ cuộc sau hạn chờ, không treo luồng đăng nhập.
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('idb', () => ({ openDB: () => new Promise(() => {}) }))
import { loadCauHinhMayChu } from '../src/lib/exam-db'
// 02/11: cập nhật theo bf286423 (khongTreo bỏ, thay bằng voiHanCho — màn đăng nhập HS bọc thêm .catch(dự phòng))
import { voiHanCho } from '../src/lib/han-cho'

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

describe('voiHanCho — hạn chờ khi treo/lỗi', () => {
  afterEach(() => { vi.useRealTimers() })
  it('promise treo vĩnh viễn ⇒ bị từ chối đúng lời báo sau hạn, gọi abort, KHÔNG treo', async () => {
    vi.useFakeTimers()
    const abort = vi.fn()
    const p = voiHanCho(new Promise(() => {}), 5_000, 'het-han', abort)
    const kq = expect(p).rejects.toThrow('het-han')
    await vi.advanceTimersByTimeAsync(4_999)
    expect(abort).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2)
    await kq
    expect(abort).toHaveBeenCalledTimes(1)
  })
  it('promise lỗi ⇒ lỗi truyền ra ngay (nơi gọi .catch về dự phòng), không gọi abort', async () => {
    const abort = vi.fn()
    await expect(voiHanCho(Promise.reject(new Error('x')), 5_000, 'het-han', abort)).rejects.toThrow('x')
    await expect(voiHanCho(Promise.reject(new Error('x')), 5_000, 'het-han').catch(() => 'du-phong')).resolves.toBe('du-phong')
    expect(abort).not.toHaveBeenCalled()
  })
})
