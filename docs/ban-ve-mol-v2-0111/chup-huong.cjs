// Chụp ba hướng phong cách Mol (vẽ lại 01/11 tối): node docs/ban-ve-mol-v2-0111/chup-huong.cjs ⇒ anh/huong-phong-cach-{sang,toi}.jpg, anh/huong-64px.jpg (≤ 150 KB).
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs')
const RA = path.join(__dirname, 'anh'); fs.mkdirSync(RA, { recursive: true })
const TEP = 'file://' + path.join(__dirname, 'huong-phong-cach.html')
async function luu(chup, ten) {
  for (let q = 86; ; q -= 6) {
    const buf = await chup({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q <= 32) { fs.writeFileSync(path.join(RA, ten), buf); return `${ten} ${Math.round(buf.length / 1024)} KB q${q}` }
  }
}
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const kq = []
  for (const [hoi, ten, dsf] of [['', 'sang', 1.4], ['?toi', 'toi', 1.4]]) {
    const p = await b.newPage({ viewport: { width: 1220, height: 900 }, deviceScaleFactor: dsf, reducedMotion: 'reduce' })
    const loi = []; p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto(TEP + hoi); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
    if (loi.length) console.log('LỖI', loi)
    kq.push(await luu((o) => p.locator('#huong').screenshot(o), `huong-phong-cach-${ten}.jpg`))
    if (!hoi) kq.push(await luu((o) => p.locator('#h64').screenshot(o), 'huong-64px.jpg'))
    await p.close()
  }
  console.log(kq.join('\n'))
  await b.close()
})()
