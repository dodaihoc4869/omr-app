#!/usr/bin/env node
// SO GIAO DIỆN TRƯỚC / SAU một đợt tối ưu (27/10 độ mượt: «tối ưu không được đổi cách nhìn»). Chụp PNG cùng cảnh của HAI bản build chụp ảnh
// (scripts/chup-v2/vite.config.mjs) rồi so từng điểm ảnh. Giả lập «giảm chuyển động» cho cả hai bên ⇒ linh vật / hoạt ảnh đứng yên, ảnh tất định.
//   node scripts/chup-v2/so-truoc-sau.mjs <build trước> <build sau> <thư mục ra> [cảnh1,cảnh2…]
// Cảnh = `?man=…` của trang.tsx. Khổ 390×844 · 844×390 · 1440×900, sáng + tối. In số điểm ảnh khác (kênh lệch > 2/255) từng ảnh; thoát 1 nếu có khác.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const [A, B, RA] = process.argv.slice(2, 5).map((x) => resolve(x))
const CANH = (process.argv[5] ?? 'hs-mot&tp=1,lam13&lam=duo,lam13&lam=duo-nc,duo-kt,duo-sua&de=4,hs-ng&v=lam').split(',')
const KHO = [[390, 844], [844, 390], [1440, 900]]
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' }
const PUB = resolve(import.meta.dirname, '../../public')
const mayChu = (dist) => new Promise((ok) => {
  const s = createServer((req, res) => {
    const d = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = join(dist, d), q = join(PUB, d)
    const t = existsSync(p) && statSync(p).isFile() ? p : existsSync(q) && statSync(q).isFile() ? q : join(dist, 'scripts/chup-v2/trang.html')
    res.writeHead(200, { 'content-type': LOAI[extname(t)] ?? 'application/octet-stream' }); res.end(readFileSync(t))
  }).listen(0, '127.0.0.1', () => ok(s))
})
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const [sa, sb] = await Promise.all([mayChu(A), mayChu(B)])
const chup = async (s, canh, w, h, nen, tep) => {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: nen, reducedMotion: 'reduce', hasTouch: w < 900, isMobile: w < 500, timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN' })
  const p = await ctx.newPage()
  await p.clock.setFixedTime(new Date('2026-10-27T03:00:00Z'))
  await p.goto(`http://127.0.0.1:${s.address().port}/scripts/chup-v2/trang.html?man=${canh}`)
  await p.waitForLoadState('networkidle').catch(() => {})
  await p.waitForTimeout(2500)
  await p.screenshot({ path: tep, animations: 'disabled', caret: 'hide', fullPage: false })
  await ctx.close()
}
const soSanh = await trinh.newPage()
let khac = 0
for (const canh of CANH) for (const [w, h] of KHO) for (const nen of ['light', 'dark']) {
  const ten = `${canh.replace(/[^\w-]+/g, '_')}-${w}x${h}-${nen}`
  const ta = join(RA, `${ten}-truoc.png`), tb = join(RA, `${ten}-sau.png`)
  await chup(sa, canh, w, h, nen, ta); await chup(sb, canh, w, h, nen, tb)
  const so = await soSanh.evaluate(async ([a, b]) => {
    const anh = (u) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = u })
    const [x, y] = await Promise.all([anh(a), anh(b)])
    if (x.width !== y.width || x.height !== y.height) return -1
    const c = new OffscreenCanvas(x.width, x.height), g = c.getContext('2d')
    g.drawImage(x, 0, 0); const d1 = g.getImageData(0, 0, x.width, x.height).data
    g.drawImage(y, 0, 0); const d2 = g.getImageData(0, 0, x.width, x.height).data
    let n = 0
    for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) > 2 || Math.abs(d1[i + 1] - d2[i + 1]) > 2 || Math.abs(d1[i + 2] - d2[i + 2]) > 2) n++
    return n
  }, ['data:image/png;base64,' + readFileSync(ta).toString('base64'), 'data:image/png;base64,' + readFileSync(tb).toString('base64')])
  console.log(`${so === 0 ? '✓' : '✗'} ${ten}: ${so} điểm ảnh khác`)
  if (so !== 0) khac++
}
await trinh.close(); sa.close(); sb.close()
writeFileSync(join(RA, 'ket-qua.txt'), `khác: ${khac}\n`)
process.exit(khac ? 1 : 0)
