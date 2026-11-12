// Chụp bản vẽ trò Sinh Tồn phòng chờ live (12/11) bằng Chromium thật: node docs/ban-ve-sinh-ton-1211/chup.mjs [tên-màn]
// In ra: lỗi trang, phần tử lớp phủ tràn khỏi màn / đè nhau, đích bấm < 44 px, cỡ tệp. Ảnh JPG đặt cạnh tệp này.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const trang = 'file://' + join(thuMuc, 'mo-phong.html')
const NGANG = [[844, 390], [667, 375], [1180, 820]]
const DS = [
  ['01-em-giao-tranh', 'tran', NGANG],
  ['02-bon-nhan-vat', 'nhan-vat', [[1366, 768]]],
  ['11-bon-cap-sung', 'sung', [[1366, 768]]],
  ['12-em-sung-len-cap', 'len-cap', [[844, 390]]],
  ['03-em-dau-van-huong-dan', 'huong-dan', [[844, 390], [667, 375]]],
  ['04-em-cham-de-toi', 'cham', [[844, 390]]],
  ['05-em-an-trong-bui', 'bui', [[844, 390]]],
  ['06-em-bi-ha-hoi-sinh', 'ha', [[844, 390]]],
  ['07-em-ban-moi-thay-ban-may', 'doi-cho', [[844, 390]]],
  ['08-em-het-van', 'het-van', [[844, 390], [667, 375]]],
  ['09-em-mat-ket-noi', 'mat-mang', [[844, 390]]],
  ['10-thay-xem-tran', 'gv', [[1366, 768]]],
]
const loc = process.argv[2]
const b = await chromium.launch()
let loi = 0
for (const [ten, man, kho] of DS) for (const [w, h] of kho) {
  if (loc && !ten.includes(loc)) continue
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  p.on('pageerror', (e) => { loi++; console.log('LỖI TRANG', ten, e.message) })
  p.on('console', (m) => { if (m.type() === 'error') { loi++; console.log('LỖI CONSOLE', ten, m.text()) } })
  await p.goto(`${trang}?man=${man}`)
  await p.evaluate(() => document.fonts.ready)
  const soat = await p.evaluate(() => {
    const kq = []
    const phu = [...document.querySelectorAll('.roi, .bang, .tin, .cho, .bao, .bd, .mang, .kq, .ha, .gv > *, .bnv > *, .bnv .o, .bnv .the')]
    for (const e of phu) {
      const r = e.getBoundingClientRect()
      if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) kq.push('TRÀN ' + e.className)
      if (e.scrollWidth > e.clientWidth + 1) kq.push('CHỮ CẮT ' + e.className)
    }
    const lop = [...document.querySelectorAll('.roi, .bang, .tin, .cho, .bao, .bd, .mang, .sc')]
    for (let i = 0; i < lop.length; i++) for (let j = i + 1; j < lop.length; j++) {
      const a = lop[i].getBoundingClientRect(), c = lop[j].getBoundingClientRect()
      if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) kq.push(`ĐÈ ${lop[i].className} × ${lop[j].className}`)
    }
    for (const n of document.querySelectorAll('button')) { const r = n.getBoundingClientRect(); if (r.height < 44 || r.width < 44) kq.push('NÚT < 44 ' + n.className) }
    return kq
  })
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  await p.screenshot({ path: tep, type: 'jpeg', quality: w >= 1366 ? 30 : w >= 1180 ? 46 : 66 })
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop(), soat.length ? soat.join(' | ') : '')
  await p.close()
}
await b.close()
console.log('lỗi trang:', loi)
