// NGHIỆM THU TRỌN VÒNG Đảo thần thú trên trang xem thử (vỏ thật + máy chủ giả) ở 360×740:
// chọn thú → đảo → 6 ải → về đảo → sổ tay → túi đồ; đo ảnh nạp lần đầu; kiểm reduce-motion. In JSON ra stdout.
//   npx vite --port 5196 --strictPort   (cửa sổ khác)
//   node docs/anh-dao-than-thu-2109/tron-vong.mjs [tiền-tố-ảnh]
import { chromium } from 'playwright'
const out = process.argv[2] ?? ''
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })
const page = await ctx.newPage()
const loi = []; page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') loi.push(m.type() + ': ' + m.text().slice(0, 200)) }); page.on('pageerror', e => loi.push(String(e)))
let anh = []; page.on('response', async r => { if (/than-thu-v2\/.*\.(webp|png)/.test(r.url())) { try { anh.push([r.url().split('/').pop(), (await r.body()).length]) } catch {} } })
const U = 'http://localhost:5196/src/game/than-thu-v2/dao/xem-thu.html?'
const kq = {}
// 1) chưa chọn thú → MỘT chạm → đảo
await page.goto(U + 'man=vo&chuachon&doan', { waitUntil: 'networkidle' })
kq.anhManChonKB = Math.round(anh.reduce((s, a) => s + a[1], 0) / 1024); anh = []
let cham = 0
await page.locator('.dao-nut-vang').click(); cham++
await page.waitForSelector('.dao-nha'); kq.chamChonThu = cham
kq.coMucDoan = await page.locator('.dao-nav button', { hasText: 'Đoàn' }).count()
// 2) đảo → câu đầu tiên
cham = 0
await page.locator('.dao-chuyen .dao-nut-vang').click(); cham++
await page.waitForSelector('.dao-cau'); kq.chamToiCauDau = cham
// 3) 6 ải
const dayTranCau = []
for (let i = 0; i < 6; i++) {
  await page.waitForSelector(`.dao-cau[aria-label="Ải ${i + 1}"]`)
  dayTranCau.push(await page.evaluate(() => Math.round(document.querySelector('.dao-cau').getBoundingClientRect().bottom + scrollY)))
  const phan = await page.evaluate(() => document.querySelector('.dao-cau input[type=text],.dao-cau input:not([type=checkbox])') ? 'III' : document.querySelectorAll('.dao-cau button').length >= 8 ? 'II' : 'I')
  if (phan === 'I') await page.locator('.dao-cau .pa-hang').nth(1).click()
  else if (phan === 'III') await page.locator('.dao-cau input:not([type=checkbox])').first().fill('8,2')
  else { const v = ['Đúng', 'Sai', 'Sai', 'Đúng']; for (let k = 0; k < 4; k++) await page.locator('.dao-cau').getByRole('button', { name: v[k], exact: true }).nth(k).click() }
  await page.locator('.dao-tham-chan .dao-nut-xanh').click()
  await page.waitForSelector('.dao-thuong')
  if (i === 2 && out) { await page.waitForTimeout(700); await page.screenshot({ path: out + '-ai3.jpg', type: 'jpeg', quality: 60 }) }
  await page.locator('.dao-tham-chan .dao-nut-xanh').click()
}
await page.waitForSelector('.dao-tham-xong'); kq.tongKet = (await page.locator('.dao-tham-xong ul').innerText()).replace(/\s+/g, ' ')
kq.dayTranCau = dayTranCau
await page.locator('.dao-tham-xong .dao-nut-vang').click(); await page.waitForSelector('.dao-nha')
kq.napSauChuyen = await page.locator('.dao-hon-nap').innerText().catch(() => '')
// 4) sổ tay + túi đồ
await page.locator('.dao-nav button', { hasText: 'Sổ tay' }).click(); await page.waitForSelector('.dao-so'); kq.soTay = await page.locator('.dao-so h2').innerText()
await page.locator('.dao-nav button', { hasText: 'Túi đồ' }).click(); await page.waitForSelector('.dao-tui')
kq.cuonNgang = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
kq.nhatKy = await page.locator('[data-nhat]').textContent()
// 5) đo ảnh màn đảo nạp lần đầu (em đã có thú), cờ doanMo tắt
const p2 = await ctx.newPage(); let a2 = []
p2.on('response', async r => { if (/than-thu-v2\/.*\.(webp|png)/.test(r.url())) { try { a2.push([r.url().split('/').pop(), (await r.body()).length]) } catch {} } })
p2.on('console', m => { if (m.type() === 'error') loi.push('p2 ' + m.text().slice(0, 200)) })
await p2.goto(U + 'man=vo&cap=100&thu=1', { waitUntil: 'networkidle' }); await p2.waitForTimeout(400)
kq.anhDaoLanDauKB = +(a2.reduce((s, a) => s + a[1], 0) / 1024).toFixed(1); kq.anhDao = a2.map(a => a[0]).join(' ')
kq.doanTat_coMucDoan = await p2.locator('.dao-nav button', { hasText: 'Đoàn' }).count()
// 6) reduce-motion: mọi hoạt ảnh của đảo phải tắt
const c3 = await b.newContext({ viewport: { width: 360, height: 740 }, reducedMotion: 'reduce' }), p3 = await c3.newPage()
await p3.goto(U + 'man=tham&buoc=no', { waitUntil: 'networkidle' })
kq.reduceMotion = await p3.evaluate(() => { const dang = [...document.querySelectorAll('.dao *')].filter(e => getComputedStyle(e).animationName !== 'none' || getComputedStyle(e, '::before').animationName !== 'none'); return { conHoatAnh: dang.length, tiaCuongNo: getComputedStyle(document.querySelector('.dao-san-tia')).display } })
kq.loi = loi
console.log(JSON.stringify(kq, null, 1))
await b.close()
