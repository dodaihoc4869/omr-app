// Chụp bản vẽ «chọn đáp án ngay trên đề + con dấu đè cả màn» (live theo khối): PLAYWRIGHT_DUONG=<đường playwright> node docs/ban-ve-live-moi-1211/chup-chon-tren-de.mjs
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url)), trang = 'file://' + join(thuMuc, 'chon-dap-an-tren-de.html')
const b = await chromium.launch()
const MAY_EM = [[1280, 800], [844, 390]]
const CHI = process.env.CHI ? process.env.CHI.split(',') : null
for (const [ten, k, kho] of [['28-em-dai-thu-ve-thanh-xam', 'thu', MAY_EM], ['29-em-cham-thanh-xam-dai-hien', 'mo', MAY_EM], ['30-em-cau-moi-nhac-cham', 'thu-moi', [[1280, 800]]], ['23-em-chon-dung-sai-tren-de', 'ds', MAY_EM], ['24-em-chon-trac-nghiem-tren-de', 'tn', MAY_EM], ['25-em-tra-loi-ngan-tren-de', 'so', MAY_EM], ['26-em-con-dau-de-ca-man', 'dau', MAY_EM], ['27-thay-con-dau', 'thay', [[1366, 768]]]].filter((x) => !CHI || CHI.includes(x[1]))) for (const [w, h] of kho) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await p.goto(`${trang}?k=${k}`); await p.evaluate(() => document.fonts.ready)
  const tran = await p.evaluate(() => { const d = document.querySelector('.dai'), g = document.querySelector('.giay'); if (!d || !g) return ''; const a = d.getBoundingClientRect(), c = g.getBoundingClientRect(), y = [...g.querySelectorAll('.y')].pop()?.getBoundingClientRect(); return `dải cao ${Math.round(a.height)} px${a.right > c.right + 1 ? ' · TRÀN NGANG' : ''}${y && y.bottom > a.top ? ' · ĐÈ DÒNG CUỐI (đề phải cuộn)' : ''}` })
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  let q = 74; do { await p.screenshot({ path: tep, type: 'jpeg', quality: q }); q -= 8 } while (statSync(tep).size > 150 * 1024 && q > 30)
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop(), tran)
  await p.close()
}
await b.close()
