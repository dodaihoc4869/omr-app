// Bấm «Thêm em tay» bằng Chromium THẬT: khung thêm em có hiện TRONG TẦM MẮT không; tích 1 em ⇒ «Thêm» ⇒ có mặt tăng.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
const DIST = resolve(process.argv[2]); const RA = process.argv[3]
const L = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }
const may = createServer((q, r) => { const d = decodeURIComponent(new URL(q.url, 'http://x').pathname); const p = [join(DIST, d)].find((x) => existsSync(x) && statSync(x).isFile()) ?? join(DIST, 'scripts/kiem-them-em-2410/trang.html'); r.writeHead(200, { 'content-type': L[extname(p)] ?? 'application/octet-stream' }); r.end(readFileSync(p)) }).listen(0)
await new Promise((r) => may.once('listening', r))
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const t = await (await b.newContext({ viewport: { width: w, height: h } })).newPage()
  const loi = []; t.on('pageerror', (e) => loi.push(e.message))
  await t.goto(`http://127.0.0.1:${may.address().port}/scripts/kiem-them-em-2410/trang.html`)
  const nut = t.getByRole('button', { name: 'Thêm em tay' })
  await nut.waitFor({ timeout: 8000 })
  await nut.click()
  await t.waitForTimeout(700)
  const kq = await t.evaluate(() => { const k = document.querySelector('.dh-them'); if (!k) return { coKhung: false }; const r = k.getBoundingClientRect(); return { coKhung: true, trongTamMat: r.top < innerHeight && r.bottom > 0, top: Math.round(r.top), cuon: Math.round(scrollY), tieuDiem: document.activeElement?.className ?? '' } })
  await t.screenshot({ path: `${RA}-${w}.jpg`, type: 'jpeg', quality: 60 })
  let them = null
  if (kq.coKhung) {
    const o = t.locator('.dh-them input[type=checkbox]:not([disabled])').first()
    await o.check()
    const truoc = await t.locator('.dh-them .dh-chip--vang').count()
    await t.locator('.dh-them').getByRole('button', { name: /^Thêm \d+ em vào danh sách có mặt/ }).click()
    await t.waitForTimeout(600)
    them = `«thầy thêm» ${truoc} ⇒ ${await t.locator('.dh-them .dh-chip--vang').count()}`
  }
  console.log(w, JSON.stringify({ ...kq, them, loi }))
}
await b.close(); may.close()
