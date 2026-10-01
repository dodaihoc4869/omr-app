// KHO ẢNH ĐỀ — mở ca nhanh (thầy 01/10: "tối ưu để việc mở ca nhanh nhất có thể, phần này tôi dùng nhiều nhất").
//
// Ảnh câu hỏi trước đây nhúng base64 thẳng trong gói ca: ca 30/09 gói đề 6,6 MB thì ẢNH chiếm 6,1 MB (274 ảnh), lại có mặt hai lần (đề + tờ
// đáp án) ⇒ mỗi lần mở ca đẩy ≈ 13 MB, mạng trường đứt giữa chừng. Nay ảnh cất MỘT LẦN ở R2 dưới khoá theo NỘI DUNG (`anh/<sha256 của data URL>`):
//   · `POST /anh/co {ds:[hash]}`  (thầy) → hash nào máy chủ CHƯA có;
//   · `POST /anh/day {ds:[{h, d}]}` (thầy) → cất ảnh, máy chủ tự băm lại `d` và so với `h` (sai là bỏ — khoá luôn khớp nội dung);
//   · `GET /anh/<hash>` (công khai) → ảnh, đệm 1 năm (nội dung không bao giờ đổi dưới cùng khoá) + đệm cạnh Cloudflare cho 300 em cùng lúc.
// Gói ca chỉ còn đường dẫn ⇒ ≈ 1 MB. Ảnh dùng lại giữa các ca (cùng kho đề) ⇒ ca sau gần như không phải đẩy ảnh nào.
import type { Env } from './kieu'

const HEX64 = /^[0-9a-f]{64}$/
const DATA_ANH = /^data:(image\/(?:png|jpeg|jpg|gif|webp|svg\+xml|bmp));base64,([A-Za-z0-9+/=\s]+)$/
const TOI_DA_HOI = 1000
const TOI_DA_DAY = 400

const DAU_ANH = {
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=31536000, immutable',
  // Ảnh SVG mở thẳng trên tên miền máy chủ không được chạy mã.
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:",
  'x-content-type-options': 'nosniff',
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json;charset=utf-8', 'access-control-allow-origin': '*' } })

export async function bamAnh(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** `GET /anh/<hash>` — công khai. Có đệm cạnh (`caches.default`) để cả lớp cùng tải một ảnh chỉ tốn một lượt đọc R2. */
export async function layAnh(env: Env, ten: string, req: Request, ctx?: { waitUntil(p: Promise<unknown>): void }): Promise<Response> {
  const h = ten.replace(/\.[a-z]+$/i, '').toLowerCase()
  if (!HEX64.test(h)) return json({ ok: false, error: 'Mã ảnh không hợp lệ' }, 400)
  if (!env.DE) return json({ ok: false, error: 'Chưa nối R2' }, 500)
  const cache = typeof caches !== 'undefined' ? (caches as unknown as { default?: Cache }).default : undefined
  const khoaDem = new Request(new URL(`/anh/${h}`, req.url).toString(), { method: 'GET' })
  if (cache) {
    const co = await cache.match(khoaDem).catch(() => undefined)
    if (co) return co
  }
  const o = await env.DE.get(`anh/${h}`)
  if (!o) return json({ ok: false, error: 'Không có ảnh' }, 404)
  const res = new Response(o.body, { headers: { ...DAU_ANH, 'content-type': o.httpMetadata?.contentType || 'application/octet-stream', etag: o.httpEtag } })
  if (cache) {
    const ban = res.clone()
    const p = cache.put(khoaDem, ban).catch(() => undefined)
    if (ctx) ctx.waitUntil(p)
  }
  return res
}

/** `POST /anh/co {ds:[hash]}` — trả hash máy chủ CHƯA có (thầy). */
export async function anhCo(env: Env, b: Record<string, unknown>): Promise<Response> {
  if (!env.DE) return json({ ok: false, error: 'Chưa nối R2' }, 500)
  const ds = [...new Set((Array.isArray(b.ds) ? b.ds : []).map((x) => String(x).toLowerCase()).filter((x) => HEX64.test(x)))]
  if (ds.length > TOI_DA_HOI) return json({ ok: false, error: `Tối đa ${TOI_DA_HOI} ảnh mỗi lượt hỏi` }, 400)
  const thieu: string[] = []
  for (let i = 0; i < ds.length; i += 50) {
    const lo = ds.slice(i, i + 50)
    const coKhong = (k: string): Promise<unknown> => (env.DE!.head ? env.DE!.head(k) : env.DE!.get(k))
    const co = await Promise.all(lo.map((h) => coKhong(`anh/${h}`).then((x) => !!x).catch(() => false)))
    lo.forEach((h, j) => { if (!co[j]) thieu.push(h) })
  }
  return json({ ok: true, thieu })
}

function giaiBase64(s: string): Uint8Array {
  const nhi = atob(s.replace(/\s+/g, ''))
  const u8 = new Uint8Array(nhi.length)
  for (let i = 0; i < nhi.length; i++) u8[i] = nhi.charCodeAt(i)
  return u8
}

/** `POST /anh/day {ds:[{h, d}]}` — cất ảnh (thầy). `d` là data URL; khoá phải bằng sha256(d), sai thì bỏ. */
export async function anhDay(env: Env, b: Record<string, unknown>): Promise<Response> {
  if (!env.DE) return json({ ok: false, error: 'Chưa nối R2' }, 500)
  const ds = Array.isArray(b.ds) ? (b.ds as { h?: unknown; d?: unknown }[]) : []
  if (ds.length > TOI_DA_DAY) return json({ ok: false, error: `Tối đa ${TOI_DA_DAY} ảnh mỗi lượt` }, 400)
  const da: string[] = []
  const hong: string[] = []
  await Promise.all(ds.map(async (x) => {
    const h = String(x?.h ?? '').toLowerCase()
    const d = typeof x?.d === 'string' ? x.d : ''
    const m = DATA_ANH.exec(d)
    if (!HEX64.test(h) || !m || (await bamAnh(d)) !== h) { hong.push(h); return }
    try {
      await env.DE!.put(`anh/${h}`, giaiBase64(m[2]), { httpMetadata: { contentType: m[1] === 'image/jpg' ? 'image/jpeg' : m[1], cacheControl: DAU_ANH['cache-control'] } })
      da.push(h)
    } catch {
      hong.push(h)
    }
  }))
  return json({ ok: hong.length === 0, da, hong })
}
