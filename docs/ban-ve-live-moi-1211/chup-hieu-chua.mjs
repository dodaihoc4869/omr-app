// Chụp bản vẽ phím «/» hỏi nhanh Hiểu / Chưa hiểu: PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-hieu-chua.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'hieu-chua.html')
const b = await chromium.launch()
for (const [ten, k, kho] of [['38-hieu-chua-may-em', 'em', [[1280, 800], [844, 390]]], ['39-hieu-chua-may-em-da-bam', 'em-da', [[844, 390]]], ['40-hieu-chua-may-thay-dang-tra-loi', 'thay', [[1366, 768]]], ['41-hieu-chua-may-thay-ket-qua', 'thay-kq', [[1366, 768]]]]) for (const [w, h] of kho) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 76; do { await p.screenshot({ path: tep, type: 'jpeg', quality: q }); q -= 8 } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop())
  await p.close()
}
await b.close()
