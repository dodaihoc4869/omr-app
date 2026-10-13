import { afterEach, describe, expect, it, vi } from 'vitest'
import { napDong, taiLaiMotLan } from '../src/lib/nap-manh'

afterEach(() => vi.unstubAllGlobals())

describe('nạp mảnh mã khi trình duyệt chặn kho phiên', () => {
  const khoLoi = (loiDoc: boolean): Storage => ({
    getItem: () => { if (loiDoc) throw new DOMException('Kho phiên bị chặn', 'SecurityError'); return null },
    setItem: () => { throw new DOMException('Kho phiên đã đầy', 'QuotaExceededError') },
  } as unknown as Storage)

  it.each([true, false])('không ném lỗi kho và không nạp lại mất kiểm soát (lỗi đọc=%s)', loiDoc => {
    expect(taiLaiMotLan(1000, khoLoi(loiDoc))).toBe(false)
  })

  it('mất mảnh mã vẫn hiện lời thử lại khi không ghi được mốc chống vòng lặp', async () => {
    vi.stubGlobal('sessionStorage', khoLoi(false))
    await expect(napDong(async () => { throw new TypeError('Importing a module script failed.') }))
      .rejects.toThrow('Chưa tải được phần này. Kiểm tra mạng rồi thử lại.')
  })
})
