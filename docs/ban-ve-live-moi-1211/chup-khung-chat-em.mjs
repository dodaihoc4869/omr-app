// Chụp bản vẽ «khung chat máy em»: PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-khung-chat-em.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'khung-chat-em.html')
const b = await chromium.launch()
for (const [ten, k, w, h] of [['60-chat-em-dong-vuot-tu-mep-phai', 'dong', 844, 390], ['61-chat-em-dang-keo', 'keo', 844, 390], ['62-chat-em-mo', 'mo', 844, 390], ['63-chat-em-dang-go-ban-phim', 'go', 844, 390], ['64-chat-em-mo', 'mo', 667, 375], ['65-chat-em-may-tinh-dong', 'mt-dong', 1366, 768], ['66-chat-em-may-tinh-cot-ghim', 'mt', 1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 84; do { q -= 6; await p.screenshot({ path: tep, type: 'jpeg', quality: q }) } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop())
  await p.close()
}
await b.close()
