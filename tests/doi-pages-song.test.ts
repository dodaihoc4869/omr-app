// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
// @ts-expect-error công cụ vận hành dùng ESM JavaScript
import { kiemDuongPages } from '../scripts/doi-pages-song.mjs'

const url = 'https://omr-app-b3u.pages.dev/hs?chua=kiem'
const app = () => new Response('<html><div id="startup-retry"></div></html>', { headers: { 'content-type': 'text/html; charset=utf-8' } })
describe('Kiểm Pages sau khi bản mới truyền ra biên', () => {
  it('404 tạm rồi đúng app mới được qua, không bỏ lượt kiểm sau thời gian chờ', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(new Response('Chưa có', { status: 404 })).mockResolvedValueOnce(app())
    const doi = vi.fn().mockResolvedValue(undefined)
    await kiemDuongPages(url, { fetchFn, doi, soLan: 2, choMs: 10 })
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(doi).toHaveBeenCalledWith(10)
  })
  it('lỗi mạng rồi đúng app mới được qua', async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new TypeError('network')).mockResolvedValueOnce(app())
    const doi = vi.fn().mockResolvedValue(undefined)
    await kiemDuongPages(url, { fetchFn, doi, soLan: 2 })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
  it('404 cố định dừng đúng giới hạn, không kích hoạt khi cổng vẫn hỏng', async () => {
    const fetchFn = vi.fn().mockImplementation(() => new Response('Chưa có', { status: 404 }))
    const doi = vi.fn().mockResolvedValue(undefined)
    await expect(kiemDuongPages(url, { fetchFn, doi, soLan: 3 })).rejects.toThrow('HTTP 404')
    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(doi).toHaveBeenCalledTimes(2)
  })
  it.each([401,403])('lỗi quyền %i dừng ngay', async status => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('', { status }))
    const doi = vi.fn().mockResolvedValue(undefined)
    await expect(kiemDuongPages(url, { fetchFn, doi })).rejects.toThrow(`HTTP ${status}`)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(doi).not.toHaveBeenCalled()
  })
  it('HTTP 200 trang lỗi vẫn không được tính đạt', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('<html>Trang lỗi</html>', { headers: { 'content-type': 'text/html' } }))
    await expect(kiemDuongPages(url, { fetchFn })).rejects.toThrow('đúng trang app')
  })
  it('kiểm phiên bản SW thật, từ chối JSON thiếu builtAt', async () => {
    await expect(kiemDuongPages(url, { laPhienBan: true, fetchFn: vi.fn().mockResolvedValue(Response.json({})) })).rejects.toThrow('service worker')
    await kiemDuongPages(url, { laPhienBan: true, fetchFn: vi.fn().mockResolvedValue(Response.json({ builtAt: 1791350182747 })) })
  })
})
