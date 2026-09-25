// Chỉ chuyển tiếp hai lệnh tạo/xác nhận ca tới máy chủ cố định.
// Không thêm quyền: máy chủ vẫn kiểm tra mã xác thực trong từng yêu cầu.
export async function onRequest({ request, env }: { request: Request; env?: { OMR?: { fetch(url: string, init: RequestInit): Promise<Response> } } }): Promise<Response> {
  const path = new URL(request.url).pathname
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  if (path !== '/api/ca/day' && path !== '/api/ca/xac-nhan') return new Response('Not found', { status: 404 })
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 50000)
  try {
    const fetchFn = (env?.OMR && typeof env.OMR.fetch === 'function')
      ? env.OMR.fetch.bind(env.OMR)
      : fetch
    const headers: Record<string, string> = {}
    const ct = request.headers.get('content-type')
    if (ct) headers['content-type'] = ct
    else headers['content-type'] = 'application/octet-stream' // fallback
    const ce = request.headers.get('content-encoding')
    if (ce) headers['content-encoding'] = ce

    const response = await fetchFn(`https://omr.ttadodaihoc.workers.dev${path.slice(4)}`, {
      method: 'POST',
      headers,
      body: request.body,
      signal: controller.signal,
      redirect: 'manual',
    })
    return new Response(response.body, { status: response.status, headers: {
      'content-type': 'application/json;charset=utf-8', 'cache-control': 'no-store',
    } })
  } catch {
    return Response.json({ ok: false, error: 'Chưa kết nối được máy chủ lưu ca.' }, { status: 502 })
  } finally { clearTimeout(timer) }
}
