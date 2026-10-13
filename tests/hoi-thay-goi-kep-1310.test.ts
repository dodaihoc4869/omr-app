// @vitest-environment node
// GỌI KÉP Gemini (thầy 13/10 gửi ảnh "Thầy trả lời chưa kịp"): lượt đầu quá hạn chờ chưa về ⇒ bắn thêm một lượt y hệt, lấy lượt về trước,
// huỷ lượt kia. Lượt đầu về nhanh ⇒ KHÔNG gọi thêm (không tốn token). Cả hai hỏng ⇒ trả lỗi của lượt hỏng trước.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { giaiCauHinhHoiThem, taoGoiGemini } from '../server/src/hoi-tro-ly'

const cfg = giaiCauHinhHoiThem(null)
const noiDung = { systemInstruction: { parts: [{ text: 'x' }] }, contents: [{ role: 'user', parts: [{ text: 'Câu này bắt đầu từ đâu ạ?' }] }] }
const traDuoc = (chu: string) => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: chu }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } }), { status: 200 })
/** Lượt treo: chỉ kết thúc khi bị huỷ (AbortSignal) — như Gemini không trả lời. */
const treo = (init?: RequestInit) => new Promise<Response>((_, loi) => { init?.signal?.addEventListener('abort', () => loi(new DOMException('Đã huỷ', 'AbortError'))) })
afterEach(() => { vi.restoreAllMocks() })

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
