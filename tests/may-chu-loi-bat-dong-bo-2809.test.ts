// Tối ưu máy chủ 28/09 (việc 1): handler trả Promise KHÔNG await trong định tuyến ⇒ lỗi bất đồng bộ thoát khỏi catch ⇒ Cloudflare 1101 thiếu CORS.
// Sau sửa: MỌI lỗi (đồng bộ hay bất đồng bộ, trong hay ngoài khối try của định tuyến) trả JSON {ok:false,error} 500 kèm CORS.
import { describe, it, expect } from 'vitest'
import worker from '../server/src/index'

function dbHong() {
  const hong = () => Promise.reject(new Error('D1 hỏng thử'))
  const stmt: any = { bind: () => stmt, first: hong, all: hong, run: hong, raw: hong }
  return { prepare: () => stmt, batch: hong, exec: hong }
}
const r2Hong = () => Promise.reject(new Error('R2 hỏng thử'))
const env: any = { DB: dbHong(), MA_BI_MAT: 'mat-thu', DE: { get: r2Hong, put: r2Hong, head: r2Hong, list: r2Hong, delete: r2Hong } }

async function goi(p: string, body?: unknown, method = 'POST') {
  const req = new Request('https://x.dev' + p, method === 'GET' ? { method } : { method, body: JSON.stringify(body ?? {}), headers: { 'content-type': 'application/json', 'x-ma-bi-mat': 'mat-thu' } })
  return worker.fetch(req, env)
}

describe('lỗi bất đồng bộ ở handler ⇒ JSON có CORS (không 1101)', () => {
  const duong: [string, unknown, string?][] = [
    ['/vao-thi', { maCa: 'CA1', sbd: '123', hoTen: 'A' }],
    ['/luu-tam', { maCa: 'CA1', sbd: '123', traLoi: {} }],
    ['/nop', { maCa: 'CA1', sbd: '123', traLoi: {} }],
    ['/ca/danh-sach', {}],
    ['/kho/danh-sach', {}],
    ['/trang-thai?sbd=123', undefined, 'GET'],
    ['/de/abc', undefined, 'GET'],
  ]
  for (const [p, body, m] of duong) {
    it(`${m ?? 'POST'} ${p}`, async () => {
      const r = await goi(p, body, m)
      expect(r.headers.get('access-control-allow-origin')).toBe('*')
      expect(r.headers.get('content-type') ?? '').toContain('json')
      const j: any = await r.json()
      if (r.status >= 500) { expect(j.ok).toBe(false); expect(typeof j.error).toBe('string') }
    })
  }
})
