#!/usr/bin/env node
// CHỤP ẢNH ĐỢT 16 · LÀN C bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx). Mỗi ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
//   npx vite build --config scripts/chup-lan-c/vite.config.mjs --outDir <tạm> && node scripts/chup-lan-c/chup.mjs <tạm> <thư mục ảnh> [ten1,ten2]
// In: lỗi trang, tràn ngang (px), vùng chạm < 44 px trong tấm / thẻ. Thoát mã 1 nếu có lỗi trang hoặc tràn ngang.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-lan-c')
const RA = resolve(process.argv[3] ?? 'anh-lan-c')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-lan-c/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-lan-c/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

// [tên ảnh, cảnh, rộng, cao, nền, việc]
const DS = [
  ['lan-c-hs-doc', 'hs', 390, 844, 'light', 'cuon-hop'],
  ['lan-c-gv-may-tinh', 'gv', 1440, 900, 'light', 'cho-tam'],
  ['lan-c-ph-ngang', 'ph', 844, 390, 'dark', 'mo-tam-ph'],
  ['lan-c-ph-hom-nay-doc', 'ph', 390, 844, 'light', 'cuon-nhip'],
  // ảnh SOÁT thêm (không nộp — chỉ chạy khi gọi tên, tiền tố "soat-"): phần dưới tấm ở máy tính / xoay ngang / tối
  ['soat-gv-tin-hieu', 'gv', 1440, 900, 'light', 'cuon:.hslc-th-luoi'],
  ['soat-gv-hop', 'gv', 1440, 900, 'dark', 'cuon:.hslc-so'],
  ['soat-hs-ngang', 'hs', 844, 390, 'light', 'cuon:.hslc-cs'],
  ['soat-hs-lich-su', 'hs', 390, 844, 'dark', 'lich-su'],
]
const loiTrang = []
const tran = []
const chamNho = []
for (const [ten, canh, w, hgt, nen, viec] of DS) {
  if (CHON.length ? !CHON.some((c) => ten.startsWith(c)) : ten.startsWith('soat-')) continue
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: nen, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`${ten}: ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await t.goto(`${goc}?man=${canh}`)
  if (viec === 'cuon-hop' || viec === 'cho-tam' || viec.startsWith('cuon:') || viec === 'lich-su') {
    await t.getByText('Số lượt làm câu').first().waitFor({ timeout: 15000 })
    await t.locator('.hslc-hero').first().waitFor({ timeout: 15000 })
  }
  if (viec === 'cuon-hop') {
    // điện thoại dọc: cuộn thân tấm tới lưới hộp "Chưa sửa được"
    await t.locator('.hslc-cs').first().evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await t.locator('.hslc-than').evaluate((el) => el.scrollBy(0, -120))
  }
  if (viec.startsWith('cuon:')) await t.locator(viec.slice(5)).first().evaluate((el) => el.scrollIntoView({ block: 'start' }))
  if (viec === 'lich-su') {
    await t.getByRole('tab', { name: /^Toàn bộ lịch sử/ }).click()
    await t.locator('.hslc-ls-ghi').first().evaluate((el) => el.scrollIntoView({ block: 'start' }))
  }
  if (viec === 'mo-tam-ph') {
    await t.getByRole('button', { name: 'Xem hồ sơ làm bài của con' }).click({ timeout: 15000 })
    await t.getByText('Số lượt làm câu').first().waitFor({ timeout: 15000 })
    await t.locator('.hslc-hero').first().waitFor({ timeout: 15000 })
  }
  if (viec === 'cuon-nhip') {
    const the = t.locator('[data-vung="nhip-hoc-con"]')
    await the.waitFor({ timeout: 15000 })
    await the.evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await t.evaluate(() => window.scrollBy(0, -12))
  }
  await t.waitForTimeout(700)
  const tr = await t.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (tr > 0) tran.push(`${ten}: ${tr}px`)
  const trTam = await t.evaluate(() => {
    const el = document.querySelector('.hslc-than')
    return el ? el.scrollWidth - el.clientWidth : 0
  })
  if (trTam > 0) tran.push(`${ten} (thân tấm): ${trTam}px`)
  const nho = await t.evaluate(() =>
    [...document.querySelectorAll('.hslc button, .hslc a[href], .ph3-nhip button')]
      .filter((e) => {
        const r = e.getBoundingClientRect()
        const s = getComputedStyle(e)
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && (r.width < 44 || r.height < 44)
      })
      .map((e) => `${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 40)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`),
  )
  if (nho.length) chamNho.push(`${ten}: ${nho.join(' | ')}`)
  for (const q of [72, 60, 50, 40, 32, 25, 20, 15]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q === 15) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q}) · tràn ngang ${tr}px`)
      break
    }
  }
  await ctx.close()
}
await trinh.close()
may.close()
console.log(`\nLỗi trang: ${loiTrang.length}`)
for (const l of loiTrang) console.log('  ' + l)
console.log(`Tràn ngang: ${tran.length}`)
for (const l of tran) console.log('  ' + l)
console.log(`Vùng chạm < 44px: ${chamNho.length}`)
for (const l of chamNho) console.log('  ' + l)
process.exit(loiTrang.length || tran.length ? 1 : 0)
