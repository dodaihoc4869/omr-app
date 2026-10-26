// Chụp đúng MỘT khung màn hình (không cả trang) — cho phần nổi cố định như menu chấm, hộp Hỏi thầy. node chup-khung.cjs ten:w:h:sang|toi …
const { chromium } = require('playwright'); const path = require('path')
;(async () => {
  const b = await chromium.launch()
  for (const a of process.argv.slice(2)) {
    const [t, w, h, che] = a.split(':')
    const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +w < 900 ? 2 : 1, colorScheme: che === 'toi' ? 'dark' : 'light' })
    await p.goto('file://' + path.join(__dirname, t + '.html') + (che === 'toi' ? '?toi' : '')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
    await p.screenshot({ path: path.join(__dirname, 'anh', `${t}-khung-${w}-${che}.jpg`), type: 'jpeg', quality: 80 })
    await p.close()
  }
  await b.close()
})()
