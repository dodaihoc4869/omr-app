// Chỉ dùng trong runner cục bộ của Actions với binding R2 remote; không deploy.
export default {
  async fetch(req, env) {
    const key = new URL(req.url).searchParams.get('key') ?? ''
    if (req.method !== 'GET' || !/^(kho|anh)\//.test(key)) return new Response('Không hợp lệ', { status: 400 })
    const obj = await env.DE.get(key)
    if (!obj) return new Response('Không có nguồn', { status: 404 })
    return new Response(obj.body, { headers: { 'content-type': obj.httpMetadata?.contentType || 'application/octet-stream' } })
  },
}
