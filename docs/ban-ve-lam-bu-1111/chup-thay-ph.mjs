#!/usr/bin/env node
// ẢNH THẬT «Nợ câu» cho THẦY và PHỤ HUYNH xem (11/11): component thật, dữ liệu giả của scripts/chup-v2 (`&nc=1`, `&nc=het`).
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node docs/ban-ve-lam-bu-1111/chup-thay-ph.mjs <thư mục tạm>
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const DIST = resolve(process.argv[2] ?? 'dist-chup-v2'), RA = join(import.meta.dirname, 'thay-ph'), PUB = resolve(import.meta.dirname, '../../public')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const d = decodeURIComponent(new URL(req.url, 'http://x').pathname), p = join(DIST, d), pub = join(PUB, d)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html`
const KHUNG = [
  ['thay-mt-sang', `${goc}?man=gv-bhn&nc=1`, 1366, 900, 'light', 'small[data-vung="no-cau"]'],
  ['thay-mt-toi', `${goc}?man=gv-bhn&nc=1`, 1366, 900, 'dark', 'small[data-vung="no-cau"]'],
  ['thay-mb-sang', `${goc}?man=gv-bhn&nc=1`, 820, 1180, 'light', 'small[data-vung="no-cau"]'],
  ['thay-dt-sang', `${goc}?man=gv-bhn&nc=1`, 390, 844, 'light', 'small[data-vung="no-cau"]'],
  ['ph-dt-sang', `${goc}?man=ph&nc=1`, 390, 844, 'light', '.tvc-hn-no'],
  ['ph-dt-toi', `${goc}?man=ph&nc=1`, 390, 844, 'dark', '.tvc-hn-no'],
  ['ph-dt-sang-phai-tra-het', `${goc}?man=ph&nc=het`, 390, 844, 'light', '.tvc-hn-no'],
  ['ph-mb-sang', `${goc}?man=ph&nc=1`, 820, 1180, 'light', '.tvc-hn-no'],
  ['ph-mt-sang', `${goc}?man=ph&nc=1`, 1366, 900, 'light', '.tvc-hn-no'],
]
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
let xau = 0
for (const [ten, url, w, h, nen, chon] of KHUNG) {
  const loi = []
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1.5 : 2, colorScheme: nen, hasTouch: w < 900, locale: 'vi-VN', reducedMotion: 'reduce' })
  const t = await ctx.newPage(); t.on('pageerror', (e) => loi.push(String(e).slice(0, 160)))
  let kq = null
  try {
    await t.goto(url); await t.waitForSelector(chon, { timeout: 20000 }); await t.evaluate(() => document.fonts.ready)
    await t.locator(chon).first().scrollIntoViewIfNeeded(); await t.evaluate((c) => { const e = document.querySelector(c); e?.scrollIntoView({ block: 'center' }) }, chon)
    await t.waitForTimeout(400)
    kq = await t.evaluate((c) => { const ds = [...document.querySelectorAll(c)]; const r = ds[0].getBoundingClientRect()
      return { so: ds.length, chu: ds.map((e) => e.innerText.replace(/\n+/g, ' | ')).slice(0, 3), tran: document.documentElement.scrollWidth > innerWidth, tranThe: ds.some((e) => e.scrollWidth > e.clientWidth + 1), rong: Math.round(r.width), cao: Math.round(r.height) } }, chon)
  } catch (e) { loi.push(String(e).slice(0, 200)) }
  let q = 84, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150_000 && q > 30)
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  // Cảnh `gv-bhn` dựng thẻ đứng riêng (không có khung app thầy) ⇒ trang rộng hơn cửa sổ SẴN TỪ TRƯỚC (đo 11/11: 1439 px ở cả hai trường hợp có / không có
  // dòng nợ) ⇒ không tính «tràn ngang trang» cho cảnh thầy; vẫn tính chữ tràn khỏi dòng nợ.
  const do_ = loi.length || !kq || (kq.tran && !ten.startsWith('thay-')) || kq.tranThe; if (do_) xau++
  console.log(`${do_ ? 'ĐỎ ' : ''}${ten}.jpg ${Math.round(buf.length / 1024)} KB · lỗi ${loi.length} · tràn ngang trang ${kq?.tran ? 'CÓ' : 'không'} · chữ tràn khối ${kq?.tranThe ? 'CÓ' : 'không'} · ${kq?.so ?? 0} khối · ${kq?.rong}×${kq?.cao}\n   ${(kq?.chu ?? []).join('\n   ')}${loi.length ? '\n   ' + loi.join(' ; ') : ''}`)
  await ctx.close()
}
await trinh.close(); may.close()
process.exit(xau ? 1 : 0)
