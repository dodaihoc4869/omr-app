#!/usr/bin/env node
// CHỤP ẢNH ĐỢT 18 · LÀN I bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx). Mỗi ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
//   npx vite build --config scripts/chup-lan-i/vite.config.mjs --outDir <tạm> && node scripts/chup-lan-i/chup.mjs <tạm> docs/anh-dot18
// In: lỗi trang, tràn ngang (px), chữ hướng dẫn đã gỡ còn sót. Thoát mã 1 nếu có lỗi trang, tràn ngang hoặc còn sót chữ.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-lan-i')
const RA = resolve(process.argv[3] ?? 'docs/anh-dot18')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-lan-i/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-lan-i/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })

/** Chữ hướng dẫn đã gỡ ở đợt 18 — không được còn trên màn. */
const DA_GO = ['Gia đình hỗ trợ', 'Gợi ý nhắc con', 'Theo số liệu đến', 'Đúng, sai tính theo từng lần', 'theo quy tắc hiện hành', 'Từ ca thứ hai', 'Mỗi dạng có ba bậc', 'đã sửa là lần làm lại', 'Cách làm bài tập về nhà', 'CHẶNG ĐANG MỞ', 'Nhắc con đọc kỹ đề']

// [tên ảnh, trang (?man=… + #…), rộng, cao, nền, phần tử chờ, cả trang?]
const DS = [
  ['lan-i-ph-hom-nay-doc', 'ph', 390, 844, 'light', '[data-vung="lich-tuan"]', true],
  ['lan-i-ph-tien-bo-may-tinh', 'ph#tien-bo', 1440, 900, 'light', '[data-vung="cau-sai-gan-day"]', true],
  ['lan-i-hs-btvn-doc', 'hs-btvn', 390, 844, 'dark', '.btm-the', false],
]
const loiTrang = []
const tran = []
const sot = []
for (const [ten, trang, w, hgt, nen, cho, caTrang] of DS) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: nen, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`${ten}: ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  const [m, hash] = trang.split('#')
  await t.goto(`${goc}?man=${m}${hash ? `#${hash}` : ''}`)
  await t.locator(cho).first().waitFor({ timeout: 20000 })
  await t.waitForTimeout(900)
  const tr = await t.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (tr > 0) tran.push(`${ten}: ${tr}px`)
  const chu = await t.evaluate(() => document.body.innerText)
  for (const c of DA_GO) if (chu.includes(c)) sot.push(`${ten}: "${c}"`)
  // Cả trang: kéo cao khung nhìn bằng chiều cao trang (thanh mục cố định nằm đúng đáy như trên máy thật, không chèn giữa ảnh).
  if (caTrang) {
    const cao = await t.evaluate(() => document.documentElement.scrollHeight)
    await t.setViewportSize({ width: w, height: Math.max(hgt, cao) })
    await t.waitForTimeout(400)
  }
  for (const q of [70, 60, 50, 42, 35, 28, 22, 16]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q === 16) {
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
console.log(`Chữ đã gỡ còn sót: ${sot.length}`)
for (const l of sot) console.log('  ' + l)
process.exit(loiTrang.length || tran.length || sot.length ? 1 : 0)
