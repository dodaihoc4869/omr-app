// Chụp bản vẽ máy tính khoa học trên màn chiếu: PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-may-tinh.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'may-tinh.html')
const b = await chromium.launch()
for (const [ten, k, kho] of [['31-thay-may-tinh-noi', 'thay', [[1366, 768]]], ['32-thay-keo-may-tinh', 'keo', [[1366, 768]]], ['33-thay-an-may-tinh', 'an', [[1366, 768]]], ['34-em-thay-may-tinh-dong-bo', 'em', [[1280, 800], [844, 390]]]]) for (const [w, h] of kho) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tran = await p.evaluate(() => { const m = document.querySelector('.mt'); if (!m) return ''; const r = m.getBoundingClientRect(); return `máy tính ${Math.round(r.width)}×${Math.round(r.height)}${r.bottom > innerHeight || r.right > innerWidth ? ' · TRÀN MÀN' : ''}` })
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 76; do { await p.screenshot({ path: tep, type: 'jpeg', quality: q }); q -= 8 } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop(), tran)
  await p.close()
}
await b.close()
