import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] })
const rows = []
for (const width of [390, 1440]) for (const theme of ['sang', 'toi']) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
  await page.goto(`http://127.0.0.1:5197/docs/sua-bang-cau-cuoi-0210/xem-thu.html?theme=${theme}`)
  await page.locator('table').waitFor()
  await page.locator('.cau-bang').scrollIntoViewIfNeeded()
  const result = await page.locator('.cau-bang').evaluate(el => ({
    height: el.clientHeight, tableHeight: el.querySelector('table').clientHeight,
    rows: el.querySelectorAll('tr').length, cells: el.querySelectorAll('td,th').length,
    shrink: getComputedStyle(el).flexShrink, pageOverflow: document.documentElement.scrollWidth > innerWidth,
  }))
  const key = `${width}-${theme}`
  rows.push({ key, ...result })
  await page.screenshot({ path: `docs/sua-bang-cau-cuoi-0210/${key}.jpg`, type: 'jpeg', quality: 60 })
  await page.close()
}
await browser.close()
writeFileSync('/tmp/omr-bang-browser.json', JSON.stringify(rows, null, 2))
console.log(JSON.stringify(rows))
if (rows.some(r => r.height < r.tableHeight || r.pageOverflow || r.cells !== 10)) process.exitCode = 1
