// Chụp bản vẽ thẻ «Em muốn làm câu này thế nào?» (thầy 10/11 «làm lại chỗ này cho tinh tế gọn gàng đẹp mắt hơn phù hợp với giao diện hơn»): màn làm câu THẬT
// (trang chụp scripts/chup-v2, cảnh `lam13&lam=g7`, dữ liệu giả) — hiện tại · bản A (proto-a.css) · bản B (proto-a.css + proto-b.css).
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <tạm> && node docs/ban-ve-chon-cach-1011/chup.mjs <tạm> docs/ban-ve-chon-cach-1011
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(resolve('package.json'))('playwright')
const DIST = resolve(process.argv[2]), RA = resolve(process.argv[3]), PUB = resolve('public')
const A = readFileSync(join(RA, 'proto-a.css'), 'utf8'), B = A + readFileSync(join(RA, 'proto-b.css'), 'utf8')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => { const d = decodeURIComponent(new URL(req.url, 'http://x').pathname), p = join(DIST, d), pub = join(PUB, d)
  const t = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(t)] ?? 'application/octet-stream' }); res.end(readFileSync(t)) }).listen(0)
await new Promise(r => may.once('listening', r))
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html?man=lam13&lam=g7`
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const KHO = [['may-tinh', 1366, 768, 'light'], ['may-tinh-toi', 1366, 768, 'dark'], ['ngang', 844, 390, 'light'], ['gap', 884, 1104, 'light']]
for (const [ban, css] of [['0-hien-tai', ''], ['A', A], ['B', B]]) for (const [kho, w, h, nen] of KHO) {
  if (ban === 'B' && kho !== 'may-tinh' && kho !== 'may-tinh-toi') continue
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: nen, reducedMotion: 'reduce' })
  const t = await ctx.newPage(); const loi = []; t.on('pageerror', e => loi.push(String(e)))
  await t.goto(goc); await t.waitForSelector('.duo-chon', { timeout: 15000 }).catch(() => {}); await t.waitForTimeout(1500)
  if (css) await t.addStyleTag({ content: css }); await t.waitForTimeout(300)
  const the = await t.$('.duo-chon'), hien = the && (await the.boundingBox())
  const tran = await t.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const ten = `${ban}-${kho}`
  let q = 82, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150_000 && q > 30)
  writeFileSync(join(RA, ten + '.jpg'), buf)
  if (hien) { let q2 = 88, b2; do { b2 = await the.screenshot({ type: 'jpeg', quality: q2 }); q2 -= 8 } while (b2.length > 150_000 && q2 > 30); writeFileSync(join(RA, ten + '-the.jpg'), b2) }
  console.log(ten, 'loi', loi.length, 'tran', tran, 'the', hien ? `${Math.round(hien.width)}×${Math.round(hien.height)}` : 'KHÔNG THẤY')
  await ctx.close()
}
await trinh.close(); may.close()
