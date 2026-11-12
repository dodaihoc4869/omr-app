// Chụp bản vẽ luật «rời màn N lần thì bị mời ra»: PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-luat-roi-man.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'luat-roi-man.html')
const b = await chromium.launch()
for (const [ten, k, w, h] of [['48-luat-thay-bat-trong-nut-bon-o', 'thay-khay', 1366, 768], ['49-luat-em-nhan-thong-bao', 'em-bat-luat', 844, 390], ['50-luat-em-roi-lan-1', 'em-lan-1', 844, 390], ['51-luat-em-bi-moi-ra', 'em-moi-ra', 844, 390], ['52-luat-em-cho-thay-duyet', 'em-cho', 844, 390], ['53-luat-thay-duyet-vao-lai', 'thay-duyet', 1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 76; do { await p.screenshot({ path: tep, type: 'jpeg', quality: q }); q -= 8 } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop())
  await p.close()
}
await b.close()
