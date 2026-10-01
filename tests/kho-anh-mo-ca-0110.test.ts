// @vitest-environment node
// KHO ẢNH ĐỀ — MỞ CA NHANH (thầy 01/10: "tối ưu để việc mở ca nhanh nhất có thể, phần này tôi dùng nhiều nhất").
// Ảnh câu hỏi (≈ 90 % gói ca) đi kho ảnh một lần theo mã nội dung; gói ca chỉ còn đường dẫn. Khoá:
//   máy chủ: /anh/co trả đúng ảnh thiếu · /anh/day chỉ cất khi băm khớp, đúng kiểu nội dung · GET /anh/<băm> công khai, đệm 1 năm, CORS · lệnh ghi đòi mã bí mật;
//   app thầy: gom + băm + chỉ đẩy ảnh thiếu, theo lô · thay đường dẫn ở CẢ đề lẫn tờ đáp án · ca mở bằng gói nhỏ · kho ảnh hỏng ⇒ vẫn mở ca với ảnh nhúng.
import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from '../server/src/index'
import { taoD1That } from './_d1-that'
import { bamChuoi, doiAnhSangKho, gomAnhNhung } from '../src/lib/anh-len-may-chu'
import { taoCaDaXacNhan } from '../src/lib/day-ca-may-chu-moi'

afterEach(() => vi.unstubAllGlobals())
const PNG = 'data:image/png;base64,' + Buffer.from('anh-png-' + 'x'.repeat(200)).toString('base64')
const JPG = 'data:image/jpeg;base64,' + Buffer.from('anh-jpg-' + 'y'.repeat(200)).toString('base64')

function mayChu() {
  const d = taoD1That()
  const kho = new Map<string, { b: Uint8Array; ct?: string }>()
  ;(d.env as any).DE = {
    async get(k: string) { const v = kho.get(k); return v ? { body: new Response(v.b).body, httpEtag: '"e"', httpMetadata: { contentType: v.ct } } : null },
    async head(k: string) { return kho.has(k) ? { httpEtag: '"e"' } : null },
    async put(k: string, v: Uint8Array | string, o?: { httpMetadata?: { contentType?: string } }) { kho.set(k, { b: typeof v === 'string' ? new TextEncoder().encode(v) : v, ct: o?.httpMetadata?.contentType }); return {} },
    async delete() {},
  }
  const goi = async (duong: string, than: Record<string, unknown>, method = 'POST') => {
    const ctx = { waitUntil: () => {} }
    return worker.fetch(new Request(`https://may.chu${duong}`, method === 'GET' ? { method } : { method, headers: { 'content-type': 'text/plain' }, body: JSON.stringify(than) }), d.env, ctx)
  }
  return { d, kho, goi }
}

describe('máy chủ kho ảnh', () => {
  it('/anh/co · /anh/day · GET /anh/<băm>', async () => {
    const { kho, goi } = mayChu()
    const h1 = await bamChuoi(PNG), h2 = await bamChuoi(JPG)
    expect((await (await goi('/anh/co', { ds: [h1, h2] })).json()).ok).toBe(false) // thiếu mã bí mật
    let j = await (await goi('/anh/co', { secret: 'bi-mat-thu', ds: [h1, h2, 'rac'] })).json()
    expect(j.thieu.sort()).toEqual([h1, h2].sort())
    j = await (await goi('/anh/day', { secret: 'bi-mat-thu', ds: [{ h: h1, d: PNG }, { h: h2, d: PNG }] })).json() // h2 ≠ băm(PNG) ⇒ bỏ
    expect(j.da).toEqual([h1])
    expect(j.hong).toEqual([h2])
    expect(kho.get(`anh/${h1}`)?.ct).toBe('image/png')
    j = await (await goi('/anh/co', { secret: 'bi-mat-thu', ds: [h1, h2] })).json()
    expect(j.thieu).toEqual([h2])
    const r = await goi(`/anh/${h1}`, {}, 'GET')
    expect(r.status).toBe(200)
    expect(r.headers.get('content-type')).toBe('image/png')
    expect(r.headers.get('cache-control')).toContain('immutable')
    expect(r.headers.get('access-control-allow-origin')).toBe('*')
    expect(Buffer.from(await r.arrayBuffer()).toString()).toBe('anh-png-' + 'x'.repeat(200))
    expect((await goi(`/anh/${h2}`, {}, 'GET')).status).toBe(404)
    expect((await goi('/anh/khong-hop-le', {}, 'GET')).status).toBe(400)
  })
})

describe('app thầy đẩy ảnh trước khi mở ca', () => {
  const bank = { phanI: [{ id: 'q1', text: 'Câu 1', hinhAnh: [{ src: PNG, viTri: 'sau_de' }] }, { id: 'q2', choiceImgs: [JPG, PNG] }] }
  const keyBank = { phanI: [{ id: 'q1', correct: 'A', hinhAnh: [{ src: PNG, viTri: 'sau_de' }], loiGiai: { hinh: JPG } }] }

  it('gom không trùng, chỉ đẩy ảnh thiếu, thay đường dẫn ở cả đề lẫn tờ đáp án', async () => {
    expect(gomAnhNhung(bank, keyBank).sort()).toEqual([PNG, JPG].sort())
    const { goi, kho } = mayChu()
    const h1 = await bamChuoi(PNG), h2 = await bamChuoi(JPG)
    await goi('/anh/day', { secret: 'bi-mat-thu', ds: [{ h: h1, d: PNG }] }) // PNG đã có từ ca trước
    const goiMang: string[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      goiMang.push(new URL(url).pathname)
      return goi(new URL(url).pathname, JSON.parse(String(init.body)))
    })
    const kq = await doiAnhSangKho('https://may.chu', 'bi-mat-thu', bank, keyBank)
    expect(kq).toMatchObject({ soAnh: 2, soAnhMoi: 1 })
    expect(goiMang).toEqual(['/anh/co', '/anh/day'])
    expect(kho.has(`anh/${h2}`)).toBe(true)
    const chu = JSON.stringify([kq.bank, kq.keyBank])
    expect(chu).not.toContain('data:image')
    expect(kq.bank.phanI[0].hinhAnh[0].src).toBe(`https://may.chu/anh/${h1}`)
    expect(kq.keyBank.phanI[0].loiGiai.hinh).toBe(`https://may.chu/anh/${h2}`)
    expect(JSON.stringify(bank)).toContain('data:image') // gói gốc không bị sửa tại chỗ
  })

  it('mở ca: gói /ca/day không còn ảnh nhúng', async () => {
    const { goi } = mayChu()
    const than: Record<string, unknown>[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const p = new URL(url).pathname
      if (p === '/ca/day') { than.push(JSON.parse(String(init.body))); return new Response(JSON.stringify({ ok: true })) }
      return goi(p, JSON.parse(String(init.body)))
    })
    const ca = { maCa: '654321', tenCa: 'Ca thử', batDau: '2026-10-01T12:00:00Z' } as any
    expect(await taoCaDaXacNhan({ BAT: true, URL: 'https://may.chu' } as any, 'bi-mat-thu', ca, bank, keyBank)).toBe(true)
    expect(than).toHaveLength(1)
    expect(JSON.stringify(than[0])).not.toContain('data:image')
    expect(JSON.stringify(than[0].bank)).toContain('https://may.chu/anh/')
  })

  it('kho ảnh hỏng ⇒ vẫn mở ca, gói giữ ảnh nhúng', async () => {
    const than: Record<string, unknown>[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      const p = new URL(url).pathname
      if (p === '/ca/day') { than.push(JSON.parse(String(init.body))); return new Response(JSON.stringify({ ok: true })) }
      return new Response('loi', { status: 500 })
    })
    const ca = { maCa: '654322', tenCa: 'Ca thử', batDau: '2026-10-01T12:00:00Z' } as any
    expect(await taoCaDaXacNhan({ BAT: true, URL: 'https://may.chu' } as any, 'bi-mat-thu', ca, bank, keyBank)).toBe(true)
    expect(JSON.stringify(than[0].bank)).toContain('data:image/png')
  })
})
