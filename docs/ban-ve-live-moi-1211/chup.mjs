// Chụp bản vẽ Live mới (12/11) bằng Chromium thật: node docs/ban-ve-live-moi-1211/chup.mjs
// In ra: lỗi trang, tràn ngang / dọc của trang, cỡ tệp. Ảnh JPG đặt cạnh tệp này.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { statSync } from 'node:fs'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const trang = 'file://' + join(thuMuc, 'mo-phong.html')
const NGANG = [[844, 390], [667, 375], [1180, 820]]
const DS = [
  ['01-thay-nut-live-mo-ngay', 'g-nut', [[1366, 768]], ['toi', 'sang']],
  ['02-thay-hen-lich', 'g-lich', [[1366, 768]], ['toi', 'sang']],
  ['03-thay-phong-cho', 'g-cho', [[1366, 768]], ['toi']],
  ['04-thay-live-che-do-hoc', 'g-live&che=hoc', [[1366, 768]], ['toi']],
  ['05-thay-live-che-do-bang', 'g-live&che=bang', [[1366, 768], [1920, 1080]], ['toi']],
  ['06-em-nut-live', 'h-nut', [[390, 844]], ['toi', 'sang']],
  ['07-em-nhac-xoay-ngang', 'h-xoay', [[390, 844]], ['toi']],
  ['08-em-phong-cho-giu-lua', 'h-cho', NGANG, ['toi']],
  ['09-em-vao-live-bon-doi', 'h-chao', NGANG, ['toi']],
  ['10-em-che-do-hoc', 'h-hoc', [[844, 390]], ['toi']],
  ['11-em-che-do-bang', 'h-bang', NGANG, ['toi']],
  ['12-em-thanh-an-mo', 'h-khay', [[844, 390]], ['toi']],
  ['13-em-chat', 'h-chat', [[844, 390], [667, 375]], ['toi']],
  ['14-em-canh-bao-roi-man', 'h-roi', [[844, 390]], ['toi']],
]
const b = await chromium.launch()
let loi = 0
for (const [ten, man, kho, nen] of DS) for (const [w, h] of kho) for (const n of nen) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w >= 1920 ? 1 : 2 })
  p.on('pageerror', (e) => { loi++; console.log('LỖI TRANG', ten, e.message) })
  await p.goto(`${trang}?man=${man}&nen=${n}`)
  await p.evaluate(() => document.fonts.ready)
  const tran = await p.evaluate(() => {
    const kq = []
    for (const e of document.querySelectorAll('body *')) {
      const r = e.getBoundingClientRect()
      if (!r.width || e.closest('.dau-truong, svg, .chat-ds, .ds-ten')) continue
      if (r.right > innerWidth + 1 || r.bottom > innerHeight + 1) kq.push(e.className || e.tagName)
    }
    return kq.slice(0, 4)
  })
  const tep = join(thuMuc, `${ten}-${w}${nen.length > 1 ? '-' + n : ''}.jpg`)
  await p.screenshot({ path: tep, type: 'jpeg', quality: w >= 1920 ? 70 : w >= 1366 ? 40 : 62 })
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop(), tran.length ? 'TRÀN: ' + tran.join(' | ') : '')
  await p.close()
}
await b.close()
console.log('lỗi trang:', loi)
