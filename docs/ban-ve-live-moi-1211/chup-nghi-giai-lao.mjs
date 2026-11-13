// Chụp bản vẽ nút «Nghỉ»: PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-nghi-giai-lao.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'nghi-giai-lao.html')
const b = await chromium.launch()
for (const [ten, k, w, h] of [['67-nghi-thay-nut-trong-khay', 'thay-khay', 1366, 768], ['68-nghi-thay-man-nghi-hoc-tiep', 'thay-nghi', 1366, 768], ['69-nghi-em-choi-game', 'em-nghi', 844, 390], ['70-nghi-em-thay-goi-hoc-tiep', 'em-vao', 844, 390]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 84; do { q -= 6; await p.screenshot({ path: tep, type: 'jpeg', quality: q }) } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop())
  await p.close()
}
await b.close()
