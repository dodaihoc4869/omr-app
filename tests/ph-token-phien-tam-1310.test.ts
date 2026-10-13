import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { docPass, luuPass, xoaPass, xacDinhPhuHuynh, KHOA_PH_PASS } from '../src/lib/ph-token'
import { danhTinhPhuHuynh } from '../src/lib/ho-so-con-ph-api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
beforeEach(() => xoaPass())
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); xoaPass(); localStorage.clear() })

describe('liên kết phụ huynh khi máy chặn lưu', () => {
  it('vẫn gửi đúng mã liên kết trong phiên này; đổi con thay mã, đăng xuất xóa mã', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Máy chặn lưu', 'SecurityError') })
    luuPass('LIEN-KET-GIA-A')
    expect(docPass()).toBe('LIEN-KET-GIA-A')
    expect(danhTinhPhuHuynh('B')).toEqual({ pass: 'LIEN-KET-GIA-A' })
    luuPass('LIEN-KET-GIA-B')
    expect(danhTinhPhuHuynh('B')).toEqual({ pass: 'LIEN-KET-GIA-B' })
    xoaPass()
    expect(docPass()).toBe('')
    expect(danhTinhPhuHuynh('B')).toEqual({ sbd: 'B' })
  })

  it('xóa thất bại không phục hồi liên kết cũ từ bộ nhớ máy; lưu lại thành công trở về đọc bộ nhớ', () => {
    luuPass('LIEN-KET-GIA-A')
    const bo = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('Máy chặn lưu', 'SecurityError') })
    xoaPass()
    expect(localStorage.getItem(KHOA_PH_PASS)).toBe('LIEN-KET-GIA-A')
    expect(docPass()).toBe('')
    bo.mockRestore()
    luuPass('LIEN-KET-GIA-B')
    expect(docPass()).toBe('LIEN-KET-GIA-B')
    localStorage.removeItem(KHOA_PH_PASS)
    expect(docPass()).toBe('')
  })
})

describe('xác định liên kết phụ huynh không treo vì thân phản hồi chậm', () => {
  it('headers về rồi nhưng JSON treo: hủy sau 20 giây và trả lỗi có thể thử lại', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | null | undefined
    vi.stubGlobal('fetch', vi.fn(async (_url: string, o: RequestInit) => {
      signal = o.signal
      return { json: () => new Promise((_r, tuChoi) => signal?.addEventListener('abort', () => tuChoi(new DOMException('Hết giờ', 'AbortError')), { once: true })) }
    }))
    let kq: Awaited<ReturnType<typeof xacDinhPhuHuynh>> | undefined
    void xacDinhPhuHuynh('LIEN-KET-GIA-A').then((r) => { kq = r })
    await vi.advanceTimersByTimeAsync(20_000)
    expect(kq).toMatchObject({ ok: false, error: expect.stringContaining('Chưa kết nối') })
    expect(signal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
