// «Kiểm tra» theo luồng — phía máy em (src/components/hoa2/doc-luong-nop.ts `nopCauLuong`, thầy 28/10 «bấm kiểm tra … chưa tức thì ngay»).
// Dòng tạm ⇒ báo NGAY (trước khi luồng đóng); dòng đầy đủ ⇒ kết quả; máy chủ trả JSON thường ⇒ như `goiHoa2`; luồng đứt trước dòng đầy đủ ⇒ lỗi đường truyền
// (`mat_mang` ⇒ `guiLaiBenVung` gửi lại, biên nhận chống trùng); `ok:false` ⇒ lỗi kèm lời máy chủ.
import { afterEach, expect, it, vi } from 'vitest'
import { nopCauLuong } from '../src/components/hoa2/doc-luong-nop'
import { LoiHoa2 } from '../src/components/hoa2/api'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
afterEach(() => { vi.unstubAllGlobals() })

/** Luồng NDJSON điều khiển tay: `day(o)` đẩy một dòng, `dong()` đóng. */
function luongTay() {
  let ctl!: ReadableStreamDefaultController<Uint8Array>
  const than = new ReadableStream<Uint8Array>({ start(c) { ctl = c } })
  const mh = new TextEncoder()
  return { than, day: (o: unknown) => ctl.enqueue(mh.encode(JSON.stringify(o) + '\n')), dong: () => ctl.close(), loi: () => ctl.error(new Error('đứt')) }
}

it('dòng tạm báo ngay (trước dòng đầy đủ); xin luồng bằng luong:1; trả dòng đầy đủ', async () => {
  const l = luongTay()
  let gui: Record<string, unknown> = {}
  vi.stubGlobal('fetch', vi.fn(async (_u: string, o: RequestInit) => { gui = JSON.parse(String(o.body)); return new Response(l.than, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8' } }) }))
  const tam: Record<string, unknown>[] = []
  const hua = nopCauLuong('tk', { session: 's', qid: 'q', answer: 'A' }, 15, (o) => tam.push(o))
  l.day({ ok: true, tam: true, correct: true, answer: 'A' })
  await vi.waitFor(() => expect(tam).toHaveLength(1))
  expect(gui).toMatchObject({ luong: 1, token: 'tk', session: 's', qid: 'q', answer: 'A' })
  l.day({ ok: true, correct: true, answer: 'A', thuong: { tinh: true } }); l.dong()
  expect(await hua).toMatchObject({ ok: true, correct: true, thuong: { tinh: true } })
  expect(tam).toHaveLength(1)
})

it('máy chủ trả JSON thường (không chấm nhanh được) ⇒ như goiHoa2, không dòng tạm', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: true, correct: false, answer: 'B' }), { headers: { 'content-type': 'application/json' } })))
  const tam = vi.fn()
  expect(await nopCauLuong('tk', {}, 15, tam)).toMatchObject({ correct: false, answer: 'B' })
  expect(tam).not.toHaveBeenCalled()
})

it('luồng đứt sau dòng tạm ⇒ lỗi đường truyền mat_mang (gửi lại được); ok:false ⇒ lời máy chủ', async () => {
  const l = luongTay()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(l.than, { headers: { 'content-type': 'application/x-ndjson' } })))
  const hua = nopCauLuong('tk', {}, 15, () => {})
  l.day({ ok: true, tam: true, correct: true, answer: 'A' }); l.loi()
  const e = await hua.catch((x) => x)
  expect(e).toBeInstanceOf(LoiHoa2); expect((e as LoiHoa2).ma).toBe('mat_mang')
  const l2 = luongTay()
  vi.stubGlobal('fetch', vi.fn(async () => new Response(l2.than, { headers: { 'content-type': 'application/x-ndjson' } })))
  const hua2 = nopCauLuong('tk', {}, 15, () => {})
  l2.day({ ok: true, tam: true, correct: true, answer: 'A' }); l2.day({ ok: false, error: 'Lượt học đã hết hạn. Em mở lượt mới.' }); l2.dong()
  const e2 = await hua2.catch((x) => x)
  expect(e2).toBeInstanceOf(LoiHoa2); expect((e2 as Error).message).toBe('Lượt học đã hết hạn. Em mở lượt mới.')
})
