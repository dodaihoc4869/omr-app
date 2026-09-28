// @vitest-environment node
// Tối ưu máy chủ 28/09 (việc 6): gỡ route KHÔNG nơi gọi (src/, public/, scripts/, lịch sử git của app) + nối lại route bị rơi.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { taoD1That } from './_d1-that'
import worker from '../server/src/index'

const goi = async (env: unknown, p: string, b: Record<string, unknown> = {}) => {
  const r = await worker.fetch(new Request('https://x.dev' + p, { method: 'POST', body: JSON.stringify({ secret: 'bi-mat-thu', ...b }) }), env as never)
  return { status: r.status, j: (await r.json()) as Record<string, unknown> }
}

describe('mã chết máy chủ', () => {
  it('route đã gỡ ⇒ 404 "Không có đường này"', async () => {
    const d = taoD1That()
    for (const p of ['/em/cau-sai', '/ca/bat-dau', '/ca/xoa-vinh-vien']) {
      const r = await goi(d.env, p, { sbd: 'S1', maCa: 'C1' })
      expect(r.status, p).toBe(404)
    }
  })
  it('app không còn gọi các route đã gỡ', () => {
    const app = ['src/lib/exam-api.ts', 'src/lib/may-chu-moi.ts'].map((f) => { try { return readFileSync(f, 'utf8') } catch { return '' } }).join('\n')
    for (const p of ['/em/cau-sai', '/ca/bat-dau', '/ca/xoa-vinh-vien']) expect(app).not.toContain(`'${p}'`)
  })
  it('/gv/kho-de-giao (màn Giao đề theo tuần) có đường trên máy chủ — trước: 404', async () => {
    const d = taoD1That()
    const r = await goi(d.env, '/gv/kho-de-giao', { action: 'doc' })
    expect(r.status).not.toBe(404)
    expect(r.j.error).not.toBe('Không có đường này')
  })
})
