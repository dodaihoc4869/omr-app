// Chụp trang chạy thử đợt 4 bằng Chromium thật (dữ liệu giả, mã sản xuất). Trước đó: npx vite --port 5231 --strictPort
//   CHROMIUM=/đường/chrome node docs/ban-ve-sinh-ton-v2-1311/that-dot4/chup.mjs
// In ra mỗi ảnh: cỡ tệp + lỗi soát (tràn ngang, nút < 44 px) + lỗi trang.
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)('playwright')
const thuMuc = dirname(fileURLToPath(import.meta.url))
const GOC = process.env.GOC || 'http://localhost:5231/docs/ban-ve-sinh-ton-v2-1311/that-dot4/'
const DS = [['15-tu-do-that-390', 'tu-do', 390, 844], ['16-sanh-that-390', 'sanh', 390, 844], ['17-thi-dua-that-1366', 'thi-dua', 1366, 768]]
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
let loi = 0
for (const [ten, man, w, h] of DS) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w >= 1180 ? 1.5 : 2, colorScheme: 'dark', hasTouch: true })
  p.on('pageerror', (e) => { loi++; console.log('LỖI TRANG', ten, e.message) })
  p.on('console', (m) => { if (m.type() === 'error') console.log('console', ten, m.text().slice(0, 200)) })
  await p.goto(`${GOC}?man=${man}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  const soat = await p.evaluate(() => {
    const ra = []
    if (document.documentElement.scrollWidth > innerWidth + 1) ra.push(`tràn ngang ${document.documentElement.scrollWidth}`)
    for (const el of document.querySelectorAll('button')) { const r = el.getBoundingClientRect(); if (r.width && (r.height < 44 || r.width < 44)) ra.push(`nút nhỏ «${el.textContent}» ${Math.round(r.width)}×${Math.round(r.height)}`) }
    return ra
  })
  const tep = join(thuMuc, `${ten}.jpg`)
  await p.screenshot({ path: tep, type: 'jpeg', quality: 72 })
  console.log(ten, `${Math.round(statSync(tep).size / 1024)} KB`, soat.length ? soat.join(' · ') : 'soát: 0 lỗi')
  await p.close()
}
await b.close()
console.log('lỗi trang:', loi)
