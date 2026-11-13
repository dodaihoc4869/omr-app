// Chụp bản vẽ «Nhật ký bài dạy» bằng Chromium thật + tự soát (lỗi trang, tràn ngang, đích bấm nhỏ hơn 44 px, ảnh quá 150 KB).
// Chạy từ gốc repo:  node docs/ban-ve-nhat-ky-bai-day-1311/chup.mjs [lọc tên ảnh]
// Máy không có Chromium đúng bản của Playwright trong repo: PW_CHROMIUM=<đường tới chrome> (mặc định /opt/pw-browsers/chromium), hoặc PLAYWRIGHT_DUONG=<gói playwright khác>.
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, statSync, writeFileSync } from 'node:fs'
const can = createRequire(import.meta.url)
const { chromium } = can(process.env.PLAYWRIGHT_DUONG || 'playwright')
let sharp = null
try { sharp = can('sharp') } catch { /* không có sharp ⇒ dùng bộ nén JPEG của Chromium */ }
const DAY = dirname(fileURLToPath(import.meta.url)), exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', loc = process.argv[2] || ''

// [tên ảnh, tệp, tham số, rộng, cao, nền]
const ANH = [
  ['01-nhat-ky-may-tinh-1366-sang', 'nhat-ky.html', 'dung=1&tua=1', 1366, 768, 'sang'],
  ['02-nhat-ky-may-tinh-1366-toi', 'nhat-ky.html', 'dung=1&tua=1', 1366, 768, 'toi'],
  ['03-nhat-ky-may-tinh-1366-sang-tung-trang', 'nhat-ky.html', 'dung=1&tua=1&cuon=trang', 1366, 768, 'sang'],
  ['04-nhat-ky-may-tinh-1366-toi-tung-trang', 'nhat-ky.html', 'dung=1&tua=1&cuon=trang', 1366, 768, 'toi'],
  ['05-nhat-ky-may-tinh-1366-sang-bang-cuoi-buoi', 'nhat-ky.html', 'dung=1&tua=1&cuon=cuoi', 1366, 768, 'sang'],
  ['06-nhat-ky-ngang-844-sang', 'nhat-ky.html', 'dung=1&tua=1', 844, 390, 'sang'],
  ['07-nhat-ky-ngang-844-toi', 'nhat-ky.html', 'dung=1&tua=1', 844, 390, 'toi'],
  ['08-nhat-ky-ngang-844-sang-tung-trang', 'nhat-ky.html', 'dung=1&tua=1&cuon=trang', 844, 390, 'sang'],
  ['09-nhat-ky-doc-390-sang', 'nhat-ky.html', 'dung=1&tua=1', 390, 844, 'sang'],
  ['10-nhat-ky-doc-390-toi', 'nhat-ky.html', 'dung=1&tua=1', 390, 844, 'toi'],
  ['11-nhat-ky-doc-390-sang-y-dong-khung', 'nhat-ky.html', 'dung=1&tua=1&cuon=y', 390, 844, 'sang'],
  ['12-nhat-ky-doc-390-toi-tung-trang', 'nhat-ky.html', 'dung=1&tua=1&cuon=trang-4&le=70', 390, 844, 'toi'],
  ['13-hoat-hoa-tua-nhanh-dang-viet-1366-sang', 'nhat-ky.html', 'dung=1&tua=0.3', 1366, 768, 'sang'],
  ['14-hoat-hoa-trang-dang-ve-do-1366-toi', 'nhat-ky.html', 'dung=0.56&tua=1&cuon=trang', 1366, 768, 'toi'],
  ['15-hoat-hoa-trang-dang-ve-do-390-sang', 'nhat-ky.html', 'dung=0.42&tua=0.74&cuon=trang-4&le=70', 390, 844, 'sang'],
  ['16-tuy-chon-ten-goi-y-1366-sang', 'nhat-ky.html', 'dung=1&tua=1&ai=1&cuon=trang', 1366, 768, 'sang'],
  ['17-cho-gan-may-tinh-1366-sang', 'cho-gan.html', 'dung=0.62', 1366, 768, 'sang'],
  ['18-cho-gan-may-tinh-1366-toi', 'cho-gan.html', 'dung=0.62', 1366, 768, 'toi'],
  ['19-cho-gan-ngang-844-sang', 'cho-gan.html', 'dung=0.62&cuon=the-nk&le=96', 844, 390, 'sang'],
  ['20-cho-gan-ngang-844-toi', 'cho-gan.html', 'dung=0.62&cuon=the-nk&le=96', 844, 390, 'toi'],
  ['21-cho-gan-doc-390-sang', 'cho-gan.html', 'dung=0.62', 390, 844, 'sang'],
  ['22-cho-gan-doc-390-toi', 'cho-gan.html', 'dung=0.62', 390, 844, 'toi'],
  ['23-cho-gan-phuong-an-phu-duoi-dong-thoi-gian-1440x900-sang', 'cho-gan.html', 'dung=0.62&vt=duoi', 1440, 900, 'sang'],
]

const b = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
for (const [ten, tep, ts, w, h, nen] of ANH) {
  if (loc && !ten.includes(loc)) continue
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: nen === 'toi' ? 'dark' : 'light', hasTouch: w < 900, isMobile: w < 900 })
  const loi = []
  p.on('pageerror', (e) => loi.push(String(e.message))); p.on('console', (m) => { if (m.type() === 'error') loi.push(m.text()) })
  await p.goto(`file://${join(DAY, tep)}?${ts}`)
  await p.waitForSelector('html[data-san]', { timeout: 8000 }).catch(() => loi.push('trang không báo sẵn sàng'))
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250)
  const kq = await p.evaluate(() => {
    const tran = document.documentElement.scrollWidth - window.innerWidth
    const nho = [...document.querySelectorAll('button, a[href], [role="slider"]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44) }).map((e) => (e.textContent || e.getAttribute('aria-label') || e.className).trim().slice(0, 40))
    const cat = [...document.querySelectorAll('h1, h2, h3, .nut, .nk-chip, .xl-chip, .nk-so span, .xl-so span')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).webkitLineClamp === 'none').map((e) => (e.textContent || '').trim().slice(0, 40))
    return { tran, nho, cat }
  })
  const duong = join(DAY, `${ten}.jpg`)
  let q = 90
  if (sharp) { const png = await p.screenshot({ type: 'png' }); do { q -= 4; writeFileSync(duong, await sharp(png).jpeg({ quality: q, mozjpeg: true }).toBuffer()) } while (statSync(duong).size > 148000 && q > 30) }
  else do { q -= 6; await p.screenshot({ path: duong, type: 'jpeg', quality: q }) } while (statSync(duong).size > 148000 && q > 26)
  const kb = Math.ceil(statSync(duong).size / 1000)
  soat.push({ anh: `${ten}.jpg`, kb, loiTrang: loi, tranNgang: Math.max(0, kq.tran), dichNho: kq.nho, chuBiCat: kq.cat })
  console.log(`${String(kb).padStart(4)} KB  q${q}  ${ten}.jpg${loi.length ? `  LỖI: ${loi[0]}` : ''}${kq.tran > 0 ? `  TRÀN ${kq.tran}px` : ''}${kq.nho.length ? `  ĐÍCH NHỎ: ${kq.nho.join(' | ')}` : ''}${kq.cat.length ? `  CHỮ CẮT: ${kq.cat.join(' | ')}` : ''}`)
  await p.close()
}
await b.close()
if (!loc) {
  const tong = { anh: soat.length, loiTrang: soat.reduce((s, x) => s + x.loiTrang.length, 0), tranNgang: soat.filter((x) => x.tranNgang > 0).length, dichNho: soat.reduce((s, x) => s + x.dichNho.length, 0), chuBiCat: soat.reduce((s, x) => s + x.chuBiCat.length, 0), anhQua150KB: soat.filter((x) => x.kb > 150).length }
  writeFileSync(join(DAY, 'soat.json'), JSON.stringify({ tong, anh: soat }, null, 1) + '\n')
  console.log('TỔNG', JSON.stringify(tong))
}
