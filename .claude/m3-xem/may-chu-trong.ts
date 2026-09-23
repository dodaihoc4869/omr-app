// MÁY CHỦ CỤC BỘ TRỐNG (tạm, KHÔNG commit): chạy Worker THẬT (server/src/index.ts) trên D1 giả bằng sqlite thật — lược đồ thật, DỮ LIỆU TRỐNG.
// Dùng để soát app giáo viên ở trạng thái sau reset 21/09. Cổng 8787. Đường /__nap (POST {sql}) để gieo thêm dữ liệu khi cần.
import { createServer } from 'node:http'
import worker from '../../server/src/index'
import { taoD1That } from '../../tests/_d1-that'

const LECH = Number(process.env.LECH_NGAY || 0) * 86400000
if (LECH) { const that = Date.now; Date.now = () => that() + LECH }
const { env, sql } = taoD1That()
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' }
createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end() }
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    const body = Buffer.concat(chunks)
    if (req.url === '/__nap') { sql.exec(body.toString('utf8')); res.writeHead(200, CORS); return res.end('ok') }
    const r = await worker.fetch(new Request(`http://localhost:8787${req.url}`, { method: req.method, headers: req.headers as Record<string, string>, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body }), env)
    const h: Record<string, string> = { ...CORS }
    r.headers.forEach((v, k) => (h[k] = v))
    res.writeHead(r.status, h)
    res.end(Buffer.from(await r.arrayBuffer()))
  } catch (e) {
    console.error('LỖI MÁY CHỦ CỤC BỘ', req.url, e)
    res.writeHead(500, CORS); res.end(JSON.stringify({ ok: false, error: String(e) }))
  }
}).listen(8787, () => console.log('máy chủ trống ở :8787'))
