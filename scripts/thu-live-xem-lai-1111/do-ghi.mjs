#!/usr/bin/env node
// ĐO MÁY GHI «XEM LẠI LIVE» (11/11) — Chromium THẬT + mic GIẢ (`--use-fake-device-for-media-stream`), máy chủ thử cục bộ. KHÔNG chạm máy chủ thật.
//   npx vite build --config scripts/thu-live-xem-lai-1111/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-xem-lai-1111/do-ghi.mjs <thư mục tạm> [số giây ghi = 70] [tệp số đo = docs/ban-ve-live-xem-lai-1011/so-do-may-ghi.json]
// Việc: chạy máy ghi thật ≥ 60 giây ⇒ khúc 10 giây tải về máy chủ thử ⇒ ghép bằng nối khung ⇒ mở `tieng.mp3` bằng <audio> qua HTTP Range (206) ⇒ tua tới
// giữa và nhiều chỗ, đo `currentTime` lệch bao nhiêu. Đây là máy MÔ PHỎNG (Chromium trên Linux, mic giả phát tiếng bíp); CHƯA có iPhone / Android thật.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-ghi')
const GIAY = Number(process.argv[3]) || 70
const RA = resolve(process.argv[4] ?? join(GOC, 'docs/ban-ve-live-xem-lai-1011/so-do-may-ghi.json'))
const KIEU = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json' }
const khuc = new Map(), range = [], rangeDai = []
let tieng = Buffer.alloc(0), tiengDai = Buffer.alloc(0)
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const doc = (req) => new Promise((xong) => { const ds = []; req.on('data', (d) => ds.push(d)); req.on('end', () => xong(Buffer.concat(ds))) })
const may = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname
  const json = (v, ma = 200) => { res.writeHead(ma, { 'content-type': 'application/json' }); res.end(JSON.stringify(v)) }
  if (req.method === 'POST' && p === '/bpu/live/ghi') { const stt = Number(u.searchParams.get('stt')); khuc.set(stt, { than: await doc(req), phien: u.searchParams.get('phien'), bu: u.searchParams.get('bu') === '1' }); return json({ ok: true }) }
  if (p === '/khuc') return json([...khuc.keys()].map((stt) => ({ stt, khoa: `${khuc.get(stt).phien}-${stt}` })))
  if (p.startsWith('/khuc/')) { const k = khuc.get(Number(p.slice(6))); if (!k) return json({ ok: false }, 404); res.writeHead(200, { 'content-type': 'application/octet-stream' }); return res.end(k.than) }
  if (req.method === 'POST' && p === '/tieng') { tieng = await doc(req); return json({ ok: true, byte: tieng.length }) }
  if (p === '/range') return json(range)
  if (req.method === 'POST' && p === '/tieng-dai') { tiengDai = await doc(req); return json({ ok: true, byte: tiengDai.length }) }
  if (p === '/range-dai') return json(rangeDai)
  if (p === '/tieng-dai.mp3') {
    // Tệp dài gửi CHẬM (64 KB mỗi 150 ms) ⇒ trình duyệt không kịp đệm cả tệp, tua phải xin Range mới.
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
    const a = m && m[1] ? Number(m[1]) : 0, z = m && m[2] ? Math.min(Number(m[2]), tiengDai.length - 1) : tiengDai.length - 1
    if (m) rangeDai.push(`${a}-${m[2] || ''}`)
    res.writeHead(m ? 206 : 200, { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-length': z - a + 1, ...(m ? { 'content-range': `bytes ${a}-${z}/${tiengDai.length}` } : {}) })
    let dong = false
    res.on('close', () => { dong = true })
    for (let o = a; o <= z && !dong; o += 65536) { res.write(tiengDai.subarray(o, Math.min(z + 1, o + 65536))); await ngu(150) }
    return res.end()
  }
  if (p === '/tieng.mp3') {
    // Như cửa `/live-tep` của Worker: có Range ⇒ 206.
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
    if (!m) { res.writeHead(200, { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-length': tieng.length }); return res.end(tieng) }
    const a = m[1] ? Number(m[1]) : Math.max(0, tieng.length - Number(m[2])), z = m[1] && m[2] ? Math.min(Number(m[2]), tieng.length - 1) : tieng.length - 1
    range.push(`${a}-${z}`)
    res.writeHead(206, { 'content-type': 'audio/mpeg', 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${z}/${tieng.length}`, 'content-length': z - a + 1 })
    return res.end(tieng.subarray(a, z + 1))
  }
  let tep = resolve(DIST, `.${decodeURIComponent(p)}`)
  if (p === '/' || !tep.startsWith(DIST)) tep = join(DIST, 'scripts/thu-live-xem-lai-1111/ghi.html')
  if (!existsSync(tep) || !statSync(tep).isFile()) { res.writeHead(404); return res.end('thiếu tệp') }
  res.writeHead(200, { 'content-type': KIEU[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
})
await new Promise((r) => may.listen(0, '127.0.0.1', r))
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'] })
const ctx = await trinh.newContext({ permissions: ['microphone'] })
await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort()) // không yêu cầu nào ra ngoài máy chủ thử
const trang = await ctx.newPage()
const loi = []
trang.on('pageerror', (e) => loi.push(e.message))
trang.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()) })
await trang.goto(`${goc}/scripts/thu-live-xem-lai-1111/ghi.html`)
await trang.waitForFunction(() => typeof window.__chay === 'function')
console.log(`Ghi ${GIAY} giây với mic giả…`)
const kq = await trang.evaluate((g) => window.__chay(g), GIAY)
const phienBan = await trinh.version()
await trinh.close(); may.close()
const ra = { luc: new Date().toISOString(), moiTruong: `Chromium ${phienBan} (Playwright) trên Linux, mic giả --use-fake-device-for-media-stream; MÁY MÔ PHỎNG, chưa có iPhone / Android thật`, loiTrang: loi, khucTaiBu: [...khuc.values()].filter((k) => k.bu).length, ...kq }
writeFileSync(RA, JSON.stringify(ra, null, 1))
console.log(JSON.stringify({ soKhuc: ra.soKhuc, byteTieng: ra.byteTieng, msTheoKhung: ra.msTheoKhung, msGiaiMa: ra.msGiaiMa, audio: ra.audio, tepDai: ra.tepDai, bip: ra.bip, troiKhuc: ra.troiKhuc, mocNet: ra.mocNet, loiTrang: loi }, null, 1))
console.log(`Số đo đầy đủ: ${RA}`)
process.exit(loi.length ? 1 : 0)
