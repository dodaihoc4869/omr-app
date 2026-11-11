#!/usr/bin/env node
// ẢNH THẬT màn «Cứu chuỗi» kiểu LÀM BÙ (11/11): component thật ManCuuChuoi, dữ liệu giả scripts/chup-v2/gia/thuong.tsx (`v=cuu-bu`, `v=cuu-bu-28`).
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm> ; node docs/ban-ve-lam-bu-1111/chup-cuu-chuoi.mjs <thư mục tạm>
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const DIST = resolve(process.argv[2] ?? 'dist-chup-v2'), RA = join(import.meta.dirname, 'cuu-chuoi'), PUB = resolve(import.meta.dirname, '../../public')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const d = decodeURIComponent(new URL(req.url, 'http://x').pathname), p = join(DIST, d), pub = join(PUB, d)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const url = (v) => `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html?man=tp&v=${v}`
const KHUNG = [['dt-sang-thieu-8', 'cuu-bu', 390, 844, 'light'], ['dt-toi-thieu-8', 'cuu-bu', 390, 844, 'dark'], ['dt-sang-nghi-ca-ngay', 'cuu-bu-28', 390, 844, 'light'], ['mb-sang-thieu-8', 'cuu-bu', 820, 1180, 'light'], ['mt-sang-thieu-8', 'cuu-bu', 1366, 900, 'light']]
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
let xau = 0
for (const [ten, v, w, h, nen] of KHUNG) {
  const loi = []
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1.5 : 2, colorScheme: nen, hasTouch: w < 900, locale: 'vi-VN', reducedMotion: 'reduce' })
  const t = await ctx.newPage(); t.on('pageerror', (e) => loi.push(String(e).slice(0, 160)))
  let kq = null
  try {
    await t.goto(url(v)); await t.waitForSelector('[data-vung="bu-cau"]', { timeout: 20000 }); await t.evaluate(() => document.fonts.ready); await t.waitForTimeout(1500)
    kq = await t.evaluate(() => ({ tran: document.documentElement.scrollWidth > innerWidth, chu: document.querySelector('.tp-man').innerText.replace(/\n+/g, ' | ').replace(/\d\d:\d\d:\d\d/, 'hh:mm:ss'),
      nho: [...document.querySelectorAll('.tp-toan button')].filter((b) => { const r = b.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44) }).length }))
  } catch (e) { loi.push(String(e).slice(0, 200)) }
  let q = 84, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150_000 && q > 30)
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  const do_ = loi.length || !kq || kq.tran || kq.nho; if (do_) xau++
  console.log(`${do_ ? 'ĐỎ ' : ''}${ten}.jpg ${Math.round(buf.length / 1024)} KB · lỗi ${loi.length} · tràn ngang ${kq?.tran ? 'CÓ' : 'không'} · đích bấm < 44 px: ${kq?.nho ?? '?'}\n   ${kq?.chu ?? ''}${loi.length ? '\n   ' + loi.join(' ; ') : ''}`)
  await ctx.close()
}
await trinh.close(); may.close()
process.exit(xau ? 1 : 0)
