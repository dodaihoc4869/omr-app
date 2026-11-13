// Chụp bản vẽ «cổ vũ — tinh thể lửa»: PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-co-vu-tinh-the.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'co-vu-tinh-the.html')
const b = await chromium.launch()
for (const [ten, k, w, h] of [['73-co-vu-em-tinh-the-bay', 'em', 844, 390], ['74-co-vu-thay-tong-hop', 'thay', 1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 86; do { q -= 6; await p.screenshot({ path: tep, type: 'jpeg', quality: q }) } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop())
  await p.close()
}
await b.close()
