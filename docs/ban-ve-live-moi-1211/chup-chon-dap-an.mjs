// Chụp bản vẽ «chọn đáp án ngay trên bảng» (máy em, live theo khối): node docs/ban-ve-live-moi-1211/chup-chon-dap-an.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'chon-dap-an-tren-bang.html')
const b = await chromium.launch()
for (const [ten, k] of [['15-em-chon-trac-nghiem', 'tn'], ['16-em-chon-dung-sai', 'ds'], ['17-em-nhap-tra-loi-ngan', 'so'], ['18-em-da-gui-tam-an', 'gui']]) for (const [w, h] of [[844, 390], [667, 375]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tran = await p.evaluate(() => { const t = document.querySelector('.tra'), g = document.querySelector('.bang'); if (!t) return ''; const a = t.getBoundingClientRect(), c = g.getBoundingClientRect(); return a.top < c.top + 2 ? 'TẤM CAO HƠN BẢNG' : '' })
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  await p.screenshot({ path: tep, type: 'jpeg', quality: 78 })
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop(), tran)
  await p.close()
}
await b.close()
