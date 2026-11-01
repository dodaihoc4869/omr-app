// Chụp bản vẽ Mol (01/11): node docs/ban-ve-mol-0111/chup.cjs ⇒ anh/mol-{doc,may-tinh}-{sang,toi}.jpg + anh/mol-to.png (3 phương án cỡ lớn).
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs')
const RA = path.join(__dirname, 'anh'); fs.mkdirSync(RA, { recursive: true })
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  for (const [k, w, h, dsf] of [['doc', 390, 844, 2], ['may-tinh', 1440, 900, 1]]) for (const toi of [false, true]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dsf })
    const loi = []; p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto('file://' + path.join(__dirname, 'mol.html') + (toi ? '?toi' : ''))
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250)
    const tran = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const cao = await p.evaluate(() => document.documentElement.scrollHeight)
    await p.setViewportSize({ width: w, height: cao })
    const ten = `mol-${k}-${toi ? 'toi' : 'sang'}.jpg`
    await p.screenshot({ path: path.join(RA, ten), type: 'jpeg', quality: k === 'doc' ? 60 : 80 })
    console.log(ten, 'lỗi', loi.length, loi[0] || '', 'tràn', tran)
    if (k === 'may-tinh' && !toi) { const e = await p.$('.ba'); await e.screenshot({ path: path.join(RA, 'mol-ba-phuong-an.png') }) }
    await p.close()
  }
  await b.close()
})()
