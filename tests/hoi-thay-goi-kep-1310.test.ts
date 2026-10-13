// @vitest-environment node
// GỌI KÉP Gemini (thầy 13/10 gửi ảnh "Thầy trả lời chưa kịp"): lượt đầu quá hạn chờ chưa về ⇒ bắn thêm một lượt y hệt, lấy lượt về trước,
// huỷ lượt kia. Lượt đầu về nhanh ⇒ KHÔNG gọi thêm (không tốn token). Cả hai hỏng ⇒ trả lỗi của lượt hỏng trước.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { giaiCauHinhHoiThem, taoGoiGemini, xoaNhoTram } from '../server/src/hoi-tro-ly'
import { TramGemini, quaTram } from '../server/src/tram-gemini'

const cfg = giaiCauHinhHoiThem(null)
const noiDung = { systemInstruction: { parts: [{ text: 'x' }] }, contents: [{ role: 'user', parts: [{ text: 'Câu này bắt đầu từ đâu ạ?' }] }] }
const traDuoc = (chu: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: chu }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } }), { status: 200 })
/** Lượt treo: chỉ kết thúc khi bị huỷ (AbortSignal) — như Gemini không trả lời. */
const treo = (init?: RequestInit) => new Promise<Response>((_, loi) => { init?.signal?.addEventListener('abort', () => loi(new DOMException('Đã huỷ', 'AbortError'))) })
afterEach(() => { vi.restoreAllMocks(); xoaNhoTram() })

describe('goiGemini gọi kép', () => {
  it('lượt đầu treo ⇒ sau hạn chờ bắn lượt hai, lấy lượt hai, lượt đầu bị huỷ', async () => {
    const huy: boolean[] = []
    let lan = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_u, init) => {
      const i = lan++
      init?.signal?.addEventListener('abort', () => { huy[i] = true })
      return i === 0 ? treo(init) : traDuoc('{"lienQuan":true,"yChinh":"Em viết phương trình trước."}')
    })
    const kq = await taoGoiGemini(30)('khoa', cfg, noiDung as never)
    expect(kq).toMatchObject({ ok: true, model: 'gemini-3.1-flash-lite' })
    expect(lan).toBe(2)
    expect(huy[0]).toBe(true)
  })

  it('lượt đầu về trước hạn chờ ⇒ chỉ MỘT lượt gọi', async () => {
    const f = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => traDuoc('{"lienQuan":true,"yChinh":"Được."}'))
    const kq = await taoGoiGemini(5_000)('khoa', cfg, noiDung as never)
    expect(kq.ok).toBe(true)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('lượt đầu treo, lượt kép báo quá tải ⇒ vẫn chờ lượt đầu; lượt đầu trả được thì lấy', async () => {
    let lan = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      const i = lan++
      if (i === 1) return new Response(JSON.stringify({ error: { message: 'quá tải' } }), { status: 429 })
      await new Promise((r) => setTimeout(r, 80))
      return traDuoc('{"lienQuan":true,"yChinh":"Lượt đầu."}')
    })
    const kq = await taoGoiGemini(20)('khoa', cfg, noiDung as never)
    expect(kq).toMatchObject({ ok: true })
    expect(kq.ok && kq.chu).toContain('Lượt đầu.')
    expect(lan).toBe(2)
  })

  it('model không còn (404) ⇒ vẫn thử tên dự phòng như cũ', async () => {
    let lan = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => (lan++ === 0 ? new Response(JSON.stringify({ error: { message: 'not found' } }), { status: 404 }) : traDuoc('{"lienQuan":true,"yChinh":"Dự phòng."}')))
    const kq = await taoGoiGemini(5_000)('khoa', cfg, noiDung as never)
    expect(kq).toMatchObject({ ok: true, model: 'gemini-3.5-flash-lite' })
  })
})

// TRẠM GEMINI (thầy 14/10 gửi ảnh "Phần hỏi thêm Thầy đang gặp lỗi"; sổ: "HTTP 400 User location is not supported for the API use."):
// Worker chạy sát D1 ở Hồng Kông ⇒ Google chặn ⇒ gọi lại qua Durable Object ghim châu Đại Dương; 10 phút sau đó đi thẳng qua trạm.
describe('trạm Gemini khi Google chặn vị trí', () => {
  const chan = () => new Response(JSON.stringify({ error: { code: 400, message: 'User location is not supported for the API use.', status: 'FAILED_PRECONDITION' } }), { status: 400 })
  it('bị chặn vị trí ⇒ gọi lại qua trạm, trả lời được; lượt sau đi thẳng qua trạm (không tốn lượt bị chặn)', async () => {
    const thang = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => chan())
    const quaTramGoi: string[] = []
    const tram = async (url: string, init: RequestInit) => { quaTramGoi.push(url); expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('khoa'); return traDuoc('{"lienQuan":true,"yChinh":"Qua trạm."}') }
    const goi = taoGoiGemini(5_000, tram)
    const kq = await goi('khoa', cfg, noiDung as never)
    expect(kq).toMatchObject({ ok: true, model: 'gemini-3.1-flash-lite' })
    expect(thang).toHaveBeenCalledTimes(1)
    expect(quaTramGoi).toEqual(['https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'])
    await goi('khoa', cfg, noiDung as never)
    expect(thang).toHaveBeenCalledTimes(1) // lượt sau: thẳng qua trạm
    expect(quaTramGoi).toHaveLength(2)
  })
  it('không có trạm ⇒ báo lỗi như cũ (loi_ai, HTTP 400)', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => chan())
    const kq = await taoGoiGemini(5_000)('khoa', cfg, noiDung as never)
    expect(kq).toMatchObject({ ok: false, ma: 'loi_ai', http: 400 })
  })
  it('lỗi 400 khác (không phải chặn vị trí) ⇒ KHÔNG đi trạm', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify({ error: { message: 'Invalid JSON payload' } }), { status: 400 }))
    const tram = vi.fn()
    const kq = await taoGoiGemini(5_000, tram)('khoa', cfg, noiDung as never)
    expect(kq).toMatchObject({ ok: false, ma: 'loi_ai' })
    expect(tram).not.toHaveBeenCalled()
  })
  it('Durable Object trạm: chỉ chuyển tới Gemini, giữ khoá + thân; đích lạ ⇒ từ chối; quaTram ghim locationHint "oc"', async () => {
    const goiRa: { url: string; init?: RequestInit }[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (u, init) => { goiRa.push({ url: String(u), init }); return traDuoc('{"lienQuan":true}') })
    const t = new TramGemini({} as never, {} as never)
    const ok = await t.fetch(new Request('https://tram-gemini/goi', { method: 'POST', headers: { 'x-dich': 'https://generativelanguage.googleapis.com/v1beta/models/m:generateContent', 'x-goog-api-key': 'khoa' }, body: '{"a":1}' }))
    expect(ok.status).toBe(200)
    expect(goiRa[0]!.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/m:generateContent')
    expect((goiRa[0]!.init!.headers as Record<string, string>)['x-goog-api-key']).toBe('khoa')
    expect(goiRa[0]!.init!.body).toBe('{"a":1}')
    const la = await t.fetch(new Request('https://tram-gemini/goi', { method: 'POST', headers: { 'x-dich': 'https://ke-xau.example/', 'x-goog-api-key': 'khoa' }, body: '{}' }))
    expect(la.status).toBe(400)
    expect(goiRa).toHaveLength(1)
    const hint: unknown[] = []
    const ns = { idFromName: (n: string) => ({ toString: () => n }), get: (_id: unknown, tuy?: unknown) => { hint.push(tuy); return { fetch: (r: Request) => t.fetch(r) } } }
    const r = await quaTram(ns as never)('https://generativelanguage.googleapis.com/v1beta/models/m:generateContent', { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': 'khoa' }, body: '{"b":2}' })
    expect(r.status).toBe(200)
    expect(hint).toEqual([{ locationHint: 'oc' }])
    expect(goiRa[1]!.init!.body).toBe('{"b":2}')
  })
  it('trạm châu Đại Dương cũng bị chặn ⇒ thử trạm Tây Bắc Mỹ', async () => {
    const tenGoi: string[] = []
    const ns = {
      idFromName: (n: string) => ({ toString: () => n }),
      get: (id: { toString(): string }, tuy?: { locationHint?: string }) => ({
        fetch: async () => { tenGoi.push(`${id.toString()}@${tuy?.locationHint}`); return id.toString() === 'gemini-oc' ? chan() : traDuoc('{"lienQuan":true}') },
      }),
    }
    const r = await quaTram(ns as never)('https://generativelanguage.googleapis.com/v1beta/models/m:generateContent', { method: 'POST', headers: {}, body: '{}' })
    expect(r.status).toBe(200)
    expect(tenGoi).toEqual(['gemini-oc@oc', 'gemini-wnam@wnam'])
  })
})
