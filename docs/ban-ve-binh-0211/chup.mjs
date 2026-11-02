// Chụp bản vẽ bình (Chromium thật): node docs/ban-ve-binh-0211/chup.mjs — ảnh JPG ×2 + video webm 9 giây.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright'
const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..'), RA = path.join(GOC, 'docs/ban-ve-binh-0211/anh')
fs.mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2' }
const may = http.createServer((q, r) => { const p = path.join(GOC, decodeURIComponent(new URL(q.url, 'http://x').pathname)); if (!fs.existsSync(p)) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': LOAI[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r) }).listen(0)
const url = (s) => `http://127.0.0.1:${may.address().port}/docs/ban-ve-binh-0211/binh.html?${s}`
const tr = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
const CANH = [['1-thang', 'goc=0&muc=.54'], ['2-nghieng-trai', 'goc=-20&muc=.54'], ['3-nghieng-phai', 'goc=20&muc=.54'], ['4-doi-mau', 'goc=0&muc=1&du=1&pha=.5'], ['5-da-hong', 'goc=0&muc=1&du=1'], ['6-hong-nghieng', 'goc=16&muc=1&du=1']]
for (const sac of ['dark', 'light']) for (const [ten, s] of CANH) {
  const ctx = await tr.newContext({ viewport: { width: 440, height: 340 }, deviceScaleFactor: 3, colorScheme: sac }), p = await ctx.newPage()
  await p.goto(url(s)); await p.evaluate(() => document.fonts.ready)
  await p.screenshot({ path: path.join(RA, `${ten}-${sac === 'dark' ? 'toi' : 'sang'}.png`) }); await ctx.close()
}
for (const sac of ['dark', 'light']) {
  const ctx = await tr.newContext({ viewport: { width: 440, height: 340 }, deviceScaleFactor: 2, colorScheme: sac, recordVideo: { dir: RA, size: { width: 880, height: 680 } } }), p = await ctx.newPage()
  await p.goto(url('chay=1')); await p.waitForTimeout(9000); const v = p.video(); await ctx.close()
  fs.renameSync(await v.path(), path.join(RA, `video-${sac === 'dark' ? 'toi' : 'sang'}.webm`))
}
await tr.close(); may.close(); console.log(fs.readdirSync(RA).join(' '))
