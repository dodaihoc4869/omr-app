// 07/10: màn thầy báo "Danh sách ca: Máy chủ trả lỗi HTTP 403" — không nói vì sao, không chỉ chỗ sửa. Nay: 403 trên LỆNH CỦA THẦY (body có `secret`)
// nói thẳng mã bí mật chưa đúng + chỉ Cài đặt. Lệnh công khai của em (không `secret`) giữ nguyên câu cũ: 403 ở đó là lý do khác.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { guiCauHoi, lichSuLenBang } from '../src/lib/exam-api'

afterEach(() => vi.unstubAllGlobals())

const fetch403 = () => vi.fn(async () => ({ ok: false, status: 403, json: async () => ({ ok: false, error: 'Sai mã bí mật' }) }))

describe('postJson — 403', () => {
  it('lệnh của thầy (có secret) ⇒ câu giữ "HTTP 403", nói mã bí mật chưa đúng và chỉ Cài đặt', async () => {
    vi.stubGlobal('fetch', fetch403())
    const loi = await lichSuLenBang('https://x', 'MAT-CU', 1).catch((e: Error) => e)
    expect(loi).toBeInstanceOf(Error)
    const chu = (loi as Error).message
    expect(chu).toContain('Máy chủ trả lỗi HTTP 403')
    expect(chu).toContain('mã bí mật')
    expect(chu).toContain('Cài đặt')
  })

  it('lệnh công khai của em (không secret) ⇒ GIỮ NGUYÊN câu cũ, không gán nhầm mã bí mật', async () => {
    vi.stubGlobal('fetch', fetch403())
    const loi = await guiCauHoi('https://x', { maCa: 'A', sbd: '1', maCau: ['q1'], ghiChu: '' } as never).catch((e: Error) => e)
    expect((loi as Error).message).toBe('Máy chủ trả lỗi HTTP 403')
  })

  it('mã rỗng cũng không bị gán nhầm (không có mã để sai)', async () => {
    vi.stubGlobal('fetch', fetch403())
    const loi = await lichSuLenBang('https://x', '', 1).catch((e: Error) => e)
    expect((loi as Error).message).toBe('Máy chủ trả lỗi HTTP 403')
  })

  // SỬA CÓ CHỦ ĐÍCH 28/10 (thầy chụp lỗi D1 export trên màn thi): 5xx ⇒ câu Việt, không mã số; vẫn có «đang bận» để tự thử lại. 4xx giữ câu cũ.
  it('5xx ⇒ "Máy chủ đang bận…" (không mã số); 404 vẫn giữ câu cũ', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })))
    const loi = await lichSuLenBang('https://x', 'MAT', 1).catch((e: Error) => e)
    expect((loi as Error).message).toBe('Máy chủ đang bận. Bài vẫn lưu trên máy, tự gửi lại.')
    expect((loi as Error).message).not.toMatch(/HTTP|\d/)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })))
    expect(((await lichSuLenBang('https://x', 'MAT', 1).catch((e: Error) => e)) as Error).message).toBe('Máy chủ trả lỗi HTTP 404')
  })
})
