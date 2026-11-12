// Chụp bản vẽ 3D trò Sinh Tồn (12/11) bằng Chromium thật (WebGL): CHROMIUM=<đường dẫn> THREE=<thư mục node_modules/three> node docs/ban-ve-sinh-ton-3d-1211/chup-3d.mjs [tên-màn]
// Trang nạp three.js từ CDN; máy không ra mạng được thì đặt THREE để lấy từ bản cài cục bộ. In: lỗi trang, lớp phủ đè nhau, cỡ tệp.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync, statSync } from 'node:fs'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const trang = 'file://' + join(thuMuc, 'mo-phong-3d.html')
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/'
const DS = [
  ['01-em-giao-tranh-3d', 'tran', [[844, 390], [667, 375], [1180, 820]]],
  ['01b-cung-canh-may-quay-thap-3d', 'tran&goc=thap', [[1180, 820]]],
  ['02-bon-be-ma-3d', 'nhan-vat', [[1366, 768]]],
  ['03-bon-cap-sung-3d', 'sung', [[1366, 768]]],
  ['04-em-an-trong-bui-3d', 'bui', [[844, 390]]],
  ['05-thay-xem-tran-3d', 'gv', [[1366, 768]]],
]
const loc = process.argv[2]
const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] })
let loi = 0
for (const [ten, man, kho] of DS) for (const [w, h] of kho) {
  if (loc && !ten.includes(loc)) continue
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  p.on('pageerror', (e) => { loi++; console.log('LỖI TRANG', ten, e.message) })
  p.on('console', (m) => { if (m.type() === 'error') { loi++; console.log('LỖI CONSOLE', ten, m.text().slice(0, 240)) } })
  if (process.env.THREE) await p.route(CDN + '**', (r) => {
    const duong = r.request().url().slice(CDN.length).split('?')[0]
    try { r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: readFileSync(join(process.env.THREE, duong)) }) } catch { r.fulfill({ status: 404, body: '' }) }
  })
  await p.goto(`${trang}?man=${man}`)
  try { await p.waitForFunction(() => document.body.dataset.xong === '1', null, { timeout: 90000 }) } catch { console.log('QUÁ GIỜ', ten) }
  await p.waitForTimeout(400)
  const soat = await p.evaluate(() => {
    const kq = [], lop = [...document.querySelectorAll('.roi, .am, .bang, .tin, .cho, .sc, .bao, .bd')]
    for (const e of lop) { const r = e.getBoundingClientRect(); if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) kq.push('TRÀN ' + e.className) }
    for (let i = 0; i < lop.length; i++) for (let j = i + 1; j < lop.length; j++) {
      if (lop[i].closest('.khung') !== lop[j].closest('.khung')) continue
      const a = lop[i].getBoundingClientRect(), c = lop[j].getBoundingClientRect()
      if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) kq.push(`ĐÈ ${lop[i].className} × ${lop[j].className}`)
    }
    return kq
  })
  const tep = join(thuMuc, `${ten}-${w}.jpg`)
  await p.screenshot({ path: tep, type: 'jpeg', quality: w >= 1366 ? 40 : w >= 1180 ? 46 : 70 })
  console.log(`${Math.round(statSync(tep).size / 1024)} KB`, tep.split('/').pop(), soat.join(' | '))
  await p.close()
}
await b.close()
console.log('lỗi trang:', loi)
