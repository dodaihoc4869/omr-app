// Chụp bản vẽ «Sinh Tồn · Trang vở» bằng Chromium thật. Trước đó: npx vite --port 5231 --strictPort
//   CHROMIUM=/đường/chrome node docs/ban-ve-sinh-ton-v2-1311/chup.mjs [lọc-tên] [--do]
// In ra mỗi ảnh: cỡ tệp + lỗi soát (tràn khỏi màn, chữ bị cắt, lớp phủ đè nhau, nút < 44 px). --do: đo khung hình màn trận ở CPU ×1 / ×4 / ×6.
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')

const thuMuc = dirname(fileURLToPath(import.meta.url))
const GOC = process.env.GOC || 'http://localhost:5231/docs/ban-ve-sinh-ton-v2-1311/'
const NGANG = [[844, 390], [667, 375], [1180, 820]]
const DS = [
  ['01-tran', 'tran', NGANG], ['02-bo-hinh', 'bo-hinh', [[1366, 768]]], ['03-cau-ho', 'cau-ho', [[1366, 768]]],
  ['04-trung-ha-chuoi', 'trung-ha', [[844, 390]]], ['05-bi-ha', 'bi-ha', [[844, 390]]], ['06-bieu-cam', 'bieu-cam', [[844, 390]]],
  ['07-truy-na', 'truy-na', [[844, 390]]], ['08-diet-thu-khoa', 'diet-thu-khoa', [[844, 390]]], ['09-hop-tiep-te', 'hop', [[844, 390]]],
  ['10-boss-ma-muc', 'boss', [[844, 390]]], ['11-thay-vao-tran-em', 'thay-em', [[844, 390]]], ['12-thay-vao-tran-may-thay', 'thay-may-thay', [[1366, 768]]],
  ['13-bang-vang-may-thay', 'bang-vang', [[1366, 768]]], ['14-cuoi-van-em', 'cuoi-van', [[844, 390]]], ['15-tu-do', 'tu-do', [[390, 844]]],
  ['16-sanh-doi-ca-ky-danh-hieu', 'sanh', [[390, 844]]], ['17-thi-dua-tuan-may-thay', 'thi-dua', [[1366, 768]]], ['18-ban-em-phong-cho-ca', 'ban-em', [[844, 390]]],
  ['19-sau-khau-sung', 'sung', [[1366, 768]]], ['20-san-tu-lon-theo-si-so', 'co-san', [[1366, 768]]], ['21-xuat-hien-dau-van', 'xuat-hien', [[844, 390]]], ['22-song-lai', 'song-lai', [[844, 390]]],
]
const loc = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : ''
const DO = process.argv.includes('--do')
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
let loi = 0, tong = 0
// Thầy 13/11: «tối là #131f24 mặc định là nền này luôn nhé» ⇒ chỉ chụp bản tối.
for (const nen of ['toi']) for (const [ten, man, kho] of DS) for (const [w, h] of kho) {
  if (loc && !ten.includes(loc)) continue
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w >= 1180 ? 1.5 : 2, colorScheme: nen === 'toi' ? 'dark' : 'light', hasTouch: true })
  p.on('pageerror', (e) => { loi++; console.log('LỖI TRANG', ten, nen, e.message) })
  p.on('console', (m) => { if (m.type() === 'error') { loi++; console.log('LỖI CONSOLE', ten, nen, m.text().slice(0, 200)) } })
  await p.goto(`${GOC}?man=${man}`)
  await p.waitForSelector('body[data-xong]', { timeout: 20000 })
  await p.waitForTimeout(700)
  const soat = await p.evaluate(() => {
    const kq = []
    const phu = [...document.querySelectorAll('.tv-bang-diem, .tv-bao, .tv-tin, .tv-sung, .tv-nho, .tv-trang-thai, .tv-nut, .tv-dau, .tv-bang-lon, .tv-mau-lon, .tv-bc, .tv-the, .tv-toast, .tv-nhan, .gv-thanh, .gv-goi-y, .bv-o, .bv-nhan, .bh-nhan, .sv, .tu-o, .ch-o')]
    for (const e of phu) {
      const r = e.getBoundingClientRect()
      if (e.closest('.doc, .tu')) continue
      if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) kq.push('TRÀN ' + e.className)
    }
    for (const e of document.querySelectorAll('.tv-tin p, .tv-sung, .tv-trang-thai, .tv-bang-diem, .gv-chip, .tu-o b, .tu-o span')) if (e.scrollWidth > e.clientWidth + 1) kq.push('CHỮ CẮT ' + e.className + ' ' + e.textContent.slice(0, 30))
    const lop = [...document.querySelectorAll('.tv-bang-diem, .tv-bao, .tv-tin, .tv-sung, .tv-nho, .tv-trang-thai, .tv-nut, .tv-bang-lon, .tv-mau-lon, .tv-toast, .tv-nhan, .gv-goi-y, .tv-bc, .tv-goi-y')]
    for (let i = 0; i < lop.length; i++) for (let j = i + 1; j < lop.length; j++) {
      const a = lop[i].getBoundingClientRect(), c = lop[j].getBoundingClientRect()
      if (a.width && c.width && a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) kq.push(`ĐÈ ${lop[i].className} × ${lop[j].className}`)
    }
    for (const n of document.querySelectorAll('button')) { const r = n.getBoundingClientRect(); if (r.height < 44 || r.width < 44) kq.push(`NÚT < 44 (${Math.round(r.width)}×${Math.round(r.height)}) ` + n.className) }
    return kq
  })
  let khung = ''
  if (DO && man === 'tran' && w === 844) {
    const cdp = await p.context().newCDPSession(p)
    for (const cpu of [1, 4, 6]) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
      await p.goto(`${GOC}?man=tran&chay=1`); await p.waitForSelector('body[data-xong]'); await p.waitForTimeout(1500)
      const fps = await p.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 >= 3000) r((n / 3).toFixed(1)); else requestAnimationFrame(f) }; requestAnimationFrame(f) }))
      khung += ` CPU×${cpu}: ${fps} khung/giây ·`
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  }
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  await p.screenshot({ path: tep, type: 'jpeg', quality: man === 'thay-may-thay' ? 34 : w >= 1180 ? 38 : w <= 400 ? 62 : 54 })
  tong++
  const kb = Math.round(statSync(tep).size / 1024)
  console.log(`${kb} KB${kb > 150 ? ' (QUÁ 150)' : ''}`, tep.split('/').pop(), soat.length ? soat.join(' | ') : '', khung)
  await p.close()
}
await b.close()
console.log('ảnh:', tong, '· lỗi trang:', loi)
