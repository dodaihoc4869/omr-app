// «CHỈ GIỌNG THẦY» (12/11): lệnh máy chủ trả / thay tệp mô hình giọng thầy trong R2 (server/src/mo-hinh-thay.ts) — CHỈ mã thầy, không đệm, không chạm D1.
import { describe, expect, it } from 'vitest'
import worker from '../server/src/index'
import type { Env } from '../server/src/kieu'
import { KHOA_MO_HINH_THAY } from '../server/src/mo-hinh-thay'

function tepTgt(n = 64): Uint8Array { const u = new Uint8Array(n); u.set([84, 71, 84, 49]); for (let i = 4; i < n; i++) u[i] = i % 251; return u }
function dungEnv(co = true) {
  const kho = new Map<string, Uint8Array>(), goi: string[] = []
  if (co) kho.set(KHOA_MO_HINH_THAY, tepTgt(2117112 % 4096 + 64))
  const DE = {
    get: async (k: string) => { goi.push(`get ${k}`); const b = kho.get(k); return b ? { body: new Response(b).body!, httpEtag: '"e"', size: b.byteLength } : null },
    put: async (k: string, v: ArrayBuffer) => { goi.push(`put ${k}`); kho.set(k, new Uint8Array(v)); return {} },
    delete: async () => undefined,
  }
  // KHÔNG có DB: lệnh này không được chạm D1 (chạm là ném lỗi)
  const env = { MA_BI_MAT: 'ma-thay', DE } as unknown as Env
  return { env, kho, goi }
}
const goi = (env: Env, h: Record<string, string> = {}, o: RequestInit = {}) => worker.fetch(new Request('https://may-chu.example/gv/mo-hinh-thay', { ...o, headers: h }), env)

describe('GET /gv/mo-hinh-thay', () => {
  it('không mã / mã rỗng / sai mã ⇒ 403, không đọc R2', async () => {
    const { env, goi: g } = dungEnv()
    for (const h of [{}, { 'x-ma-bi-mat': '' }, { 'x-ma-bi-mat': 'sai' }, { 'x-ma-bi-mat': 'sai', 'x-omr-secret': 'ma-thay' }]) {
      const r = await goi(env, h)
      expect(r.status).toBe(403)
      expect(r.headers.get('cache-control')).toBe('no-store')
      expect(r.headers.get('access-control-allow-origin')).toBe('*')
    }
    expect(g).toEqual([])
  })
  it('đúng mã thầy ⇒ trả nguyên tệp, octet-stream, no-store, CORS; đúng MỘT lượt đọc R2', async () => {
    const { env, kho, goi: g } = dungEnv()
    const r = await goi(env, { 'x-ma-bi-mat': 'ma-thay' })
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('application/octet-stream')
    expect(r.headers.get('cache-control')).toBe('no-store')
    expect(r.headers.get('access-control-allow-origin')).toBe('*')
    const b = new Uint8Array(await r.arrayBuffer())
    expect(b).toEqual(kho.get(KHOA_MO_HINH_THAY))
    expect(r.headers.get('content-length')).toBe(String(b.byteLength))
    expect(g).toEqual([`get ${KHOA_MO_HINH_THAY}`])
  })
  it('chưa có tệp ⇒ 404', async () => {
    const { env } = dungEnv(false)
    expect((await goi(env, { 'x-ma-bi-mat': 'ma-thay' })).status).toBe(404)
  })
  it('xin trước (OPTIONS) cho đầu mục x-ma-bi-mat ⇒ 204 kèm CORS', async () => {
    const { env } = dungEnv()
    const r = await worker.fetch(new Request('https://may-chu.example/gv/mo-hinh-thay', { method: 'OPTIONS' }), env)
    expect(r.status).toBe(204)
    expect(r.headers.get('access-control-allow-headers')).toContain('x-ma-bi-mat')
  })
})

describe('POST /gv/mo-hinh-thay (thay tệp mô hình, cùng khoá)', () => {
  it('không mã ⇒ 403, không ghi', async () => {
    const { env, goi: g } = dungEnv(false)
    expect((await goi(env, {}, { method: 'POST', body: tepTgt() })).status).toBe(403)
    expect(g).toEqual([])
  })
  it('sai dạng (không phải TGT1 / quá nhỏ) ⇒ 400, không ghi', async () => {
    const { env, goi: g } = dungEnv(false)
    expect((await goi(env, { 'x-ma-bi-mat': 'ma-thay' }, { method: 'POST', body: new Uint8Array(64) })).status).toBe(400)
    expect((await goi(env, { 'x-ma-bi-mat': 'ma-thay' }, { method: 'POST', body: tepTgt(8) })).status).toBe(400)
    expect(g).toEqual([])
  })
  it('đúng mã + đúng dạng ⇒ ghi đúng khoá cố định, GET sau trả tệp mới', async () => {
    const { env, kho } = dungEnv(false)
    const tep = tepTgt(1000)
    const r = await goi(env, { 'x-ma-bi-mat': 'ma-thay' }, { method: 'POST', body: tep })
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, khoa: 'mo-hinh-thay/thu.tgt', kich: 1000 })
    expect(kho.get(KHOA_MO_HINH_THAY)).toEqual(tep)
    expect(new Uint8Array(await (await goi(env, { 'x-ma-bi-mat': 'ma-thay' })).arrayBuffer())).toEqual(tep)
  })
})
