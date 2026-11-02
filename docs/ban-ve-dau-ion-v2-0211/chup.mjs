// Chụp bản vẽ «Đấu Nguyên Tử v2» bằng Chromium thật: node docs/ban-ve-dau-ion-v2-0211/chup.mjs
// Phục vụ gốc repo qua http (để ve.html nạp đúng tokens.css, trong-hs-mau.css, phông ĐĐH Rounded).
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const NET = process.argv.includes('--net') // ảnh siêu nét: PNG, mật độ điểm ×3 (thầy 02/11 «Vẽ lại bằng vector siêu nét»)
const RA = path.join(GOC, 'docs/ban-ve-dau-ion-v2-0211', NET ? 'anh-net' : 'anh')
fs.mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.js': 'text/javascript' }
const may = http.createServer((q, r) => {
  const p = path.join(GOC, decodeURIComponent(new URL(q.url, 'http://x').pathname))
  if (!p.startsWith(GOC) || !fs.existsSync(p)) { r.writeHead(404); return r.end() }
  r.writeHead(200, { 'content-type': LOAI[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r)
}).listen(0)
const cong = may.address().port

const KHO = { 390: [390, 844], 844: [844, 390], 1440: [1440, 900] }
const CANH = [
  ['sanh', 390, 'light'], ['sanh', 390, 'dark'], ['sanh', 844, 'light'], ['sanh', 1440, 'light'], ['sanh', 1440, 'dark'],
  ['tran', 844, 'light'], ['tran', 844, 'dark'], ['tran', 390, 'light'], ['tran', 390, 'dark'], ['tran', 1440, 'light'], ['tran', 1440, 'dark'],
  ['goiy', 844, 'light'], ['vaothay', 844, 'dark'], ['vaothay', 390, 'light'],
  ['het', 390, 'light'], ['het', 844, 'light'], ['het', 844, 'dark'], ['het', 1440, 'light'],
  ['tran', 844, 'light', 1],
]
const tr = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
for (const [canh, kho, sac, yeu] of CANH) {
  const [w, h] = KHO[kho]
  const ctx = await tr.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: NET ? (kho === 1440 ? 2 : 3) : kho === 1440 ? 1 : 2, colorScheme: sac })
  const tg = await ctx.newPage()
  const loi = []
  tg.on('pageerror', (e) => loi.push(e.message)); tg.on('console', (m) => m.type() === 'error' && loi.push(m.text()))
  await tg.goto(`http://127.0.0.1:${cong}/docs/ban-ve-dau-ion-v2-0211/ve.html?canh=${canh}${yeu ? '&yeu=1' : ''}`)
  await tg.evaluate(() => document.fonts.ready)
  // tràn: phần tử chữ vượt khung cha hoặc vượt màn
  const tran = await tg.evaluate(() => [...document.querySelectorAll('.hud *, .trang *, .ket *, .goiy, .bang-vao')].filter((e) => {
    const b = e.getBoundingClientRect(); return b.width && (b.right > innerWidth + 1 || b.left < -1 || e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible')
  }).map((e) => e.className || e.tagName).slice(0, 5))
  const ten = `${canh}-${kho}-${sac === 'dark' ? 'toi' : 'sang'}${yeu ? '-yeu' : ''}.${NET ? 'png' : 'jpg'}`
  await tg.screenshot({ path: path.join(RA, ten), ...(NET ? { type: 'png' } : { type: 'jpeg', quality: 82 }) })
  console.log(ten, loi.length ? 'LỖI ' + loi.join(' | ') : 'ok', tran.length ? 'TRÀN ' + tran.join(',') : '')
  await ctx.close()
}
await tr.close(); may.close()
