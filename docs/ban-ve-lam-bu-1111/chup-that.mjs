#!/usr/bin/env node
// ẢNH THẬT thẻ «Nợ câu» SAU KHI BUILD (11/11): component thật `TheNoCau` trên màn Hôm nay thật, dữ liệu giả của scripts/chup-v2 (`&ns=1&nc=…`).
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node docs/ban-ve-lam-bu-1111/chup-that.mjs <thư mục tạm>
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const DIST = resolve(process.argv[2] ?? 'dist-chup-v2'), RA = join(import.meta.dirname, 'that'), PUB = resolve(import.meta.dirname, '../../public')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const d = decodeURIComponent(new URL(req.url, 'http://x').pathname), p = join(DIST, d), pub = join(PUB, d)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const url = (nc) => `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html?man=hs-mot&tp=1&ns=1&dd=khong&nc=${nc}`
const KHUNG = [
  ['dt-sang-1-tra-toi-thieu', 'toi_thieu', 390, 844, 'light'], ['dt-sang-2-chon-tra-het', 'het', 390, 844, 'light'], ['dt-sang-3-da-tra-toi-thieu', 'da_tra', 390, 844, 'light'],
  ['dt-sang-4-ngay-thu-tu-phai-tra-het', 'phai_het', 390, 844, 'light'], ['dt-toi-1-tra-toi-thieu', 'toi_thieu', 390, 844, 'dark'], ['dt-toi-4-ngay-thu-tu-phai-tra-het', 'phai_het', 390, 844, 'dark'],
  ['mb-sang-1-tra-toi-thieu', 'toi_thieu', 820, 1180, 'light'], ['mt-sang-1-tra-toi-thieu', 'toi_thieu', 1366, 900, 'light'], ['mt-toi-1-tra-toi-thieu', 'toi_thieu', 1366, 900, 'dark'],
]
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
let do_ = 0
for (const [ten, canh, w, h, nen] of KHUNG) {
  const loi = []
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1.5 : 2, colorScheme: nen, hasTouch: w < 900, locale: 'vi-VN', reducedMotion: 'reduce' })
  const t = await ctx.newPage(); t.on('pageerror', (e) => loi.push(String(e).slice(0, 160)))
  await t.goto(url(canh)); await t.waitForSelector('.nc-the', { timeout: 20000 }); await t.waitForSelector('.kb-cta'); await t.evaluate(() => document.fonts.ready)
  const kq = await t.evaluate(() => {
    const the = document.querySelector('.nc-the'), cta = document.querySelector('.kb-cta'), hero = document.querySelector('.kb-hero')
    const r = (e) => e.getBoundingClientRect()
    return { tran: document.documentElement.scrollWidth > innerWidth,
      nho: [...document.querySelectorAll('.nc-the button, .kb-cta')].filter((b) => { const x = r(b); return x.width && x.height && (x.width < 44 || x.height < 44) }).length,
      ctaDay: Math.round(r(cta).bottom), cao: innerHeight, thuTu: [the, cta, hero].map((e) => Math.round(r(e).top)),
      the: the.innerText.replace(/\n+/g, ' | '), cta: cta.innerText.replace(/\n+/g, ' | '), hero: hero.querySelector('.kb-hero-chu').innerText.replace(/\n+/g, ' | '), sac: cta.getAttribute('data-sac') }
  })
  await t.waitForTimeout(300)
  let q = 84, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150_000 && q > 30)
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  const xau = loi.length || kq.tran || kq.nho; if (xau) do_++
  console.log(`${xau ? 'ĐỎ ' : ''}${ten}.jpg ${Math.round(buf.length / 1024)} KB · lỗi trang ${loi.length} · tràn ngang ${kq.tran ? 'CÓ' : 'không'} · đích bấm < 44 px: ${kq.nho} · đáy nút chính ${kq.ctaDay}/${kq.cao} · top thẻ/nút/mức ${kq.thuTu.join('/')} · sắc ${kq.sac}\n   thẻ: ${kq.the}\n   nút: ${kq.cta}\n   mức: ${kq.hero}${loi.length ? '\n   ' + loi.join(' ; ') : ''}`)
  await ctx.close()
}
await trinh.close(); may.close()
process.exit(do_ ? 1 : 0)
