// TRẠM GỌI GEMINI (thầy 14/10 gửi ảnh "Phần hỏi thêm Thầy đang gặp lỗi"): sổ hoi_tro_ly ghi `HTTP 400 User location is not supported
// for the API use.` (04:22 và 05:52 sáng). Worker để placement "smart" (wrangler.toml) nên lúc vắng chạy sát D1 (APAC, trạm Hồng Kông),
// mà Gemini API không phục vụ Hồng Kông. KHÔNG dời cả máy chủ (mọi lệnh D1 sẽ chậm): chỉ lượt gọi Gemini bị chặn vị trí mới đi qua
// Durable Object này, ghim ở châu Đại Dương (`locationHint: 'oc'`, nơi Gemini phục vụ).
// An toàn: không có địa chỉ công khai (chỉ gọi qua binding nội bộ của Worker), chỉ chuyển tới generativelanguage.googleapis.com,
// khoá đi trong header của chính máy chủ, không lưu gì.
import type { DurableObjectNamespace, DurableObjectState, Env } from './kieu'

const GOC_GEMINI = 'https://generativelanguage.googleapis.com/'
export const TEN_TRAM = 'gemini-oc'

export class TramGemini {
  constructor(_state: DurableObjectState, _env: Env) {}

  async fetch(req: Request): Promise<Response> {
    const dich = req.headers.get('x-dich') ?? ''
    if (req.method !== 'POST' || !dich.startsWith(GOC_GEMINI)) return new Response(JSON.stringify({ error: { message: 'Trạm Gemini: đích không hợp lệ.' } }), { status: 400 })
    return fetch(dich, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': req.headers.get('x-goog-api-key') ?? '' }, body: await req.text() })
  }
}

/** Trạm theo thứ tự thử: châu Đại Dương (gần Việt Nam, Gemini phục vụ), rồi Tây Bắc Mỹ nếu trạm đầu cũng bị chặn vị trí. */
export const DS_TRAM: readonly { ten: string; hint: string }[] = [{ ten: TEN_TRAM, hint: 'oc' }, { ten: 'gemini-wnam', hint: 'wnam' }]
const RE_CHAN = /location is not supported/i

/** Gọi Gemini qua trạm — cùng chữ ký `fetch(url, init)`. Huỷ (`init.signal`) ⇒ thôi chờ trạm (trạm tự xong việc của nó). */
export function quaTram(ns: DurableObjectNamespace): (url: string, init: RequestInit) => Promise<Response> {
  const motTram = (url: string, init: RequestInit, t: { ten: string; hint: string }): Promise<Response> => {
    const h = new Headers(init.headers)
    h.set('x-dich', url)
    const goi = ns.get(ns.idFromName(t.ten), { locationHint: t.hint }).fetch(new Request('https://tram-gemini/goi', { method: 'POST', headers: h, body: init.body as string }))
    const sig = init.signal
    if (!sig) return goi
    return new Promise<Response>((ok, loi) => {
      const huy = () => loi(new DOMException('Đã huỷ', 'AbortError'))
      if (sig.aborted) { huy(); return }
      sig.addEventListener('abort', huy, { once: true })
      goi.then(ok, loi).finally(() => sig.removeEventListener('abort', huy))
    })
  }
  return async (url, init) => {
    let r = await motTram(url, init, DS_TRAM[0]!)
    for (const t of DS_TRAM.slice(1)) {
      if (r.status !== 400 || !RE_CHAN.test(await r.clone().text().catch(() => ''))) break
      r = await motTram(url, init, t)
    }
    return r
  }
}
