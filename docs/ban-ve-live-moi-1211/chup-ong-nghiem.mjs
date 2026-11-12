// Chụp bản vẽ nút ống nghiệm «ai đã nộp» (máy thầy, màn chiếu, live theo khối — chế độ Học): node docs/ban-ve-live-moi-1211/chup-ong-nghiem.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'ong-nghiem-nop-bai.html')
const b = await chromium.launch()
for (const [ten, k, kho] of [['19-ong-nghiem-nut', 'nut', [[1366, 768]]], ['20-ong-nghiem-em-vua-gui', 'vua', [[1366, 768]]], ['21-ong-nghiem-danh-sach', 'ds', [[1366, 768], [1920, 1080], [1280, 720]]], ['22-ong-nghiem-chua-ai-nop', 'rong', [[1366, 768]]]]) for (const [w, h] of kho) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1600 ? 1 : 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tran = await p.evaluate(() => { const t = document.querySelector('.tam'); return t ? (t.scrollHeight > t.clientHeight + 1 ? 'TRÀN DỌC' : 'vừa') : '' })
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 72; do { await p.screenshot({ path: tep, type: 'jpeg', quality: q }); q -= 8 } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop(), tran)
  await p.close()
}
await b.close()
