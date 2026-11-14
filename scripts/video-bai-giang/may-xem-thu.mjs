// MÁY CHỦ THỬ cho trang xem video tóm tắt (public/video-bai/): phục vụ public/ + giả lệnh /live-tep/<id>/video-*.{json,m4a} của máy chủ thật
// (bỏ qua vé, CÓ Range ⇒ tua tiếng được). Chỉ để thử tại máy. Dùng: node may-xem-thu.mjs <thư mục có video-kb.json, video-net.json, video-am.m4a> [cổng]
import { createServer } from 'node:http'
import { createReadStream, statSync, existsSync } from 'node:fs'
import { join, extname, dirname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const [duLieu, congS = '8790'] = process.argv.slice(2)
const PUB = join(dirname(fileURLToPath(import.meta.url)), '../../public')
const KIEU = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.svg': 'image/svg+xml' }
createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  let tep
  const m = /^\/live-tep\/[^/]+\/(video-(?:kb|net)\.json|video-am\.m4a)$/.exec(u.pathname)
  if (m) tep = join(duLieu, m[1])
  else { const p = normalize(decodeURIComponent(u.pathname)).replace(/^(\.\.[/\\])+/, ''); tep = join(PUB, p.endsWith('/') ? `${p}index.html` : p) }
  if (!tep.startsWith(PUB) && !tep.startsWith(duLieu)) { res.writeHead(403).end(); return }
  if (!existsSync(tep)) { res.writeHead(404, { 'access-control-allow-origin': '*' }).end('{}'); return }
  const co = statSync(tep).size, kieu = KIEU[extname(tep)] || 'application/octet-stream'
  const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
  const dau = { 'content-type': kieu, 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' }
  if (r) {
    const a = r[1] ? Number(r[1]) : co - Number(r[2]), b = r[1] && r[2] ? Number(r[2]) : co - 1
    res.writeHead(206, { ...dau, 'content-range': `bytes ${a}-${b}/${co}`, 'content-length': b - a + 1 })
    if (req.method === 'HEAD') res.end(); else createReadStream(tep, { start: a, end: b }).pipe(res)
  } else { res.writeHead(200, { ...dau, 'content-length': co }); if (req.method === 'HEAD') res.end(); else createReadStream(tep).pipe(res) }
}).listen(Number(congS), () => console.log(`máy thử: http://127.0.0.1:${congS}/video-bai/?id=thu&ve=x&goc=http://127.0.0.1:${congS}`))
