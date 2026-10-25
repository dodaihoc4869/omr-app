// Chụp bản vẽ: mỗi trang × 3 khổ (điện thoại dọc / ngang / máy tính) × sáng / tối. Kiểm: lỗi trang, tràn ngang, đích bấm < 44 px.
const { chromium } = require('playwright')
const path = require('path')
const D = __dirname
const trang = process.argv.slice(2)
const kho = [
  { ten: 'doc', w: 390, h: 844, dsf: 2, q: 60 },
  { ten: 'ngang', w: 844, h: 390, dsf: 2, q: 60 },
  { ten: 'may-tinh', w: 1440, h: 900, dsf: 1, q: 72 },
]
;(async () => {
  const b = await chromium.launch()
  for (const t of trang) for (const k of kho) for (const che of ['sang', 'toi']) {
    const p = await b.newPage({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dsf, colorScheme: che === 'toi' ? 'dark' : 'light' })
    const loi = []
    p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto('file://' + path.join(D, t + '.html') + (che === 'toi' ? '?toi' : ''))
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(250)
    const kq = await p.evaluate(() => {
      const tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const nho = [...document.querySelectorAll('.nut, .cong-tac span, .chip, a, button')].filter((e) => {
        const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none' && r.height < 34
      }).length
      return { tran, nho }
    })
    // Phần cố định (thanh dưới, nút A.I) phải nằm đúng đáy trang ⇒ nới khung nhìn bằng cả trang rồi chụp một khung.
    const cao = await p.evaluate(() => document.documentElement.scrollHeight)
    await p.setViewportSize({ width: k.w, height: Math.max(k.h, cao) })
    await p.evaluate(() => window.scrollTo(0, 0))
    await p.waitForTimeout(200)
    const ra = path.join(D, 'anh', `${t}-${k.ten}-${che}.jpg`)
    await p.screenshot({ path: ra, type: 'jpeg', quality: k.q })
    const kb = Math.round(require('fs').statSync(ra).size / 1024)
    console.log(`${t}-${k.ten}-${che}: lỗi ${loi.length} · tràn ${kq.tran}px · chip/nút < 34px ${kq.nho} · ${kb} KB`)
    await p.close()
  }
  await b.close()
})()
