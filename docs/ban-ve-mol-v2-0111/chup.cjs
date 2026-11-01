// Chụp bản vẽ Mol v2 (ống nghiệm, 01/11 tối): node docs/ban-ve-mol-v2-0111/chup.cjs ⇒ anh/*.jpg (mỗi ảnh ≤ 150 KB).
// Cần playwright (node_modules của repo) + Chromium /opt/pw-browsers/chromium (như docs/ban-ve-mol-0111/chup.cjs).
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs')
const RA = path.join(__dirname, 'anh'); fs.mkdirSync(RA, { recursive: true })
const TEP = 'file://' + path.join(__dirname, 'mol-v2.html')
const TRAN = 150 * 1024
async function luu(chup, ten) { // hạ chất lượng tới khi ≤ 150 KB
  for (let q = 86; q >= 40; q -= 6) {
    const buf = await chup({ type: 'jpeg', quality: q })
    if (buf.length <= TRAN || q <= 40) { fs.writeFileSync(path.join(RA, ten), buf); return `${ten} ${Math.round(buf.length / 1024)} KB q${q}` }
  }
}
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const mo = async (hoi, w, h, dsf) => {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dsf })
    const loi = []; p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto(TEP + hoi)
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
    if (loi.length) console.log('LỖI', hoi, loi)
    return p
  }
  const kq = []
  const sang = await mo('', 1240, 900, 1.5)
  kq.push(await luu((o) => sang.locator('#so-sanh').screenshot(o), 'so-sanh-cu-moi.jpg'))
  kq.push(await luu((o) => sang.locator('#cam-xuc').screenshot(o), 'cam-xuc-A-sang.jpg'))
  kq.push(await luu((o) => sang.locator('#gian').screenshot(o), 'gian-truoc-sau.jpg'))
  kq.push(await luu((o) => sang.locator('#avo').screenshot(o), 'so-avogadro-can-canh.jpg'))
  await sang.close()
  const nho = await mo('', 1240, 900, 2)
  kq.push(await luu((o) => nho.locator('#co-nho').screenshot(o), 'co-nho.jpg'))
  await nho.close()
  for (const [hoi, ten] of [['', 'sang'], ['?toi', 'toi']]) { // bảng phương án cao ⇒ chụp 1,2× cho vừa 150 KB
    const p = await mo(hoi, 1240, 900, 1.2)
    kq.push(await luu((o) => p.locator('#phuong-an').screenshot(o), `3-phuong-an-mau-${ten}.jpg`))
    await p.close()
  }
  const toi = await mo('?toi', 1240, 900, 1.5)
  kq.push(await luu((o) => toi.locator('#cam-xuc').screenshot(o), 'cam-xuc-A-toi.jpg'))
  await toi.close()
  const dt = await mo('?dien-thoai', 390, 844, 2)
  kq.push(await luu((o) => dt.screenshot(o), 'ngu-canh-dien-thoai.jpg'))
  await dt.close()
  console.log(kq.join('\n'))
  await b.close()
})()
