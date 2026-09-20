// Chụp 3 khung mẫu BTVN nâng đỡ (390×844, dpr 2, sáng) → JPG ≤ 150 KB. Chạy: node hs-chup-mau.mjs <ra-thư-mục>
import { createRequire } from 'node:module'
import { mkdirSync, statSync } from 'node:fs'
const require = createRequire('/Volumes/SSD NGOÀI/omr-app/package.json')
const { chromium } = require('playwright')
const RA = process.argv[2]
mkdirSync(RA, { recursive: true })
const TEN = { m1: 'hs-1-dau-bai-cua-em', m2: 'hs-2-nhip-giua-chang', m3: 'hs-3-the-cuoi-chang' }
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light' })
const p = await ctx.newPage()
const loi = []
p.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()) })
p.on('pageerror', (e) => loi.push(String(e)))
await p.goto('file:///Volumes/SSD%20NGO%C3%80I/omr-app/docs/ban-ve-btvn-nang-do-2109/hs-mau.html')
await p.evaluate(() => document.fonts.ready)
for (const id of Object.keys(TEN)) {
  const dich = `${RA}/${TEN[id]}.jpg`
  let q = 82, kb = 0
  for (; q >= 50; q -= 6) {
    await p.locator('#' + id).screenshot({ path: dich, type: 'jpeg', quality: q })
    kb = Math.round(statSync(dich).size / 1024)
    if (kb <= 150) break
  }
  // đo tràn: nội dung .cuon có bị cắt mất không, chữ có tràn ngang không
  const d = await p.evaluate((id) => {
    const m = document.getElementById(id), c = m.querySelector('.cuon'), day = m.querySelector('.day')
    const r = (e) => e.getBoundingClientRect()
    const conCuoi = c.lastElementChild ? r(c.lastElementChild).bottom : 0
    const ngang = [...m.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible' && e.clientWidth > 0 && !['svg','use','path'].includes(e.tagName.toLowerCase())).length
    return { cuonBottom: Math.round(r(c).bottom), conCuoiBottom: Math.round(conCuoi), dayTop: Math.round(r(day).top), ngang, cao: Math.round(r(m).height) }
  }, id)
  console.log(TEN[id], `q=${q}`, kb + ' KB', JSON.stringify(d))
}
console.log('lỗi console:', loi.length, loi.slice(0, 3).join(' | '))
await b.close()
