// Chụp bản vẽ «khung chat luôn hiện bên phải app thầy»: PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-khung-chat-thay.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'khung-chat-thay.html')
const b = await chromium.launch()
for (const [ten, k, w, h, cat] of [['55-chat-thay-che-do-bang', 'bang', 1366, 768], ['56-chat-thay-che-do-hoc', 'hoc', 1366, 768], ['57-chat-thay-che-do-bang', 'bang', 1920, 1080], ['58-chat-thay-che-do-bang', 'bang', 1280, 720], ['59-chat-thay-can-canh-tin', 'bang', 1366, 768, true]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: cat ? 3 : w > 1400 ? 1.25 : 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tep = join(thuMuc, `${ten}-${w}.jpg`), c = cat ? await p.evaluate(() => { const r = document.getElementById('cot').getBoundingClientRect(); return { x: r.x, y: r.y + 150, width: r.width, height: 470 } }) : undefined
  let q = 78; do { q -= 6; await p.screenshot({ path: tep, type: 'jpeg', quality: q, ...(c ? { clip: c } : {}) }); } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop())
  await p.close()
}
await b.close()
