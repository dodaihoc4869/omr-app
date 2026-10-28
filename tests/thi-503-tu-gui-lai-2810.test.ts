// Thầy 28/10: màn thi /t gặp 503 (D1 đang export) không được hiện «Máy chủ trả lỗi HTTP 503»; câu Việt + máy tự thử lại.
import { afterEach, expect, it, vi } from 'vitest'
import { loiNenThuLai, luuTam } from '../src/lib/exam-api'

afterEach(() => vi.unstubAllGlobals())

it('503 ⇒ lỗi có chữ «đang bận» nên được tự thử lại', () => {
  expect(loiNenThuLai(new Error('Máy chủ đang bận. Bài vẫn lưu trên máy, tự gửi lại.'))).toBe(true)
})

it('lưu tạm gặp 503 rồi máy chủ trả lời lại ⇒ tự gửi lại, lưu được', async () => {
  let n = 0
  const f = vi.fn(async (url: unknown) => (String(url).endsWith('/goi') && n++ === 0
    ? { ok: false, status: 503, json: async () => ({ ok: false, maLoi: 'MAY_CHU_BAN' }) }
    : { ok: true, status: 200, json: async () => ({ ok: true }) }))
  vi.stubGlobal('fetch', f)
  expect(await luuTam('https://x', 'CA1', '12121212', { q1: 'A' } as never)).toBe(true)
  expect(f.mock.calls.filter((c) => String((c as unknown[])[0]).endsWith('/goi'))).toHaveLength(2)
})
