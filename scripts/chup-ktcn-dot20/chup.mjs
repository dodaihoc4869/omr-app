#!/usr/bin/env node
// CHỤP ẢNH ĐỢT 20 (Kiểm tra ôn tập) bằng Chromium THẬT (/opt/pw-browsers/chromium — không tải trình duyệt), dữ liệu GIẢ (trang.tsx).
//   npx vite build --config scripts/chup-ktcn-dot20/vite.config.mjs --outDir <tạm> && node scripts/chup-ktcn-dot20/chup.mjs <tạm> docs/anh-dot20
// JPG tự hạ chất lượng tới khi ≤ 150 KB. SOÁT mọi khung: lỗi trang · tràn ngang · đích chạm < 44 px (nút/liên kết đang thấy).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-ktcn-dot20')
const RA = resolve(process.argv[3] ?? 'docs/anh-dot20')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-ktcn-dot20/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const GOC = `http://127.0.0.1:${may.address().port}/scripts/chup-ktcn-dot20/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
const lam = async (t) => { await t.getByRole('button', { name: /Làm tiếp chặng 2/ }).click(); await t.getByRole('group', { name: 'Các câu trong chặng' }).first().waitFor() }

// [tên ảnh, tham số, rộng, cao, tối?, cả trang?, thao tác]
const KHUNG = [
  ['01-the-5-trang-thai-doc', 'khung=bang', 390, 844, false, true],
  ['02-hom-nay-ngay-kiem-tra-doc', 'khung=hom-nay&tt=can_lam', 390, 844, false, false],
  ['03-hom-nay-ngay-kiem-tra-may-tinh', 'khung=hom-nay&tt=can_lam', 1440, 900, false, false],
  ['04-hom-nay-ngay-kiem-tra-ngang', 'khung=hom-nay&tt=can_lam', 844, 390, false, false],
  ['05-hom-nay-dang-chuan-bi-doc', 'khung=hom-nay&tt=cho_nguon', 390, 844, false, true],
  ['06-hom-nay-dang-chuan-bi-may-tinh', 'khung=hom-nay&tt=cho_nguon', 1440, 900, false, false],
  ['07-trang-bai-doc', 'khung=man-tong-quan', 390, 844, false, true],
  ['08-trang-bai-may-tinh', 'khung=man-tong-quan', 1440, 900, false, false],
  ['09-lam-chang-doc', 'khung=man-lam', 390, 844, false, false, lam],
  ['10-lam-chang-ngang', 'khung=man-lam', 844, 390, false, false, lam],
  ['11-lam-chang-may-tinh', 'khung=man-lam', 1440, 900, false, false, lam],
  ['12-lam-chang-toi-sap-het-gio', 'khung=man-lam&gap=1', 390, 844, true, false, lam],
  ['13-hop-nop-chang-doc', 'khung=man-lam', 390, 844, false, false, async (t) => { await lam(t); await t.getByRole('button', { name: 'Câu 6' }).first().click(); await t.getByRole('button', { name: 'Nộp chặng 2' }).click(); await t.getByRole('alertdialog').waitFor() }],
  ['14-ket-qua-doc', 'khung=man-ket', 390, 844, false, true],
  ['15-ket-qua-may-tinh', 'khung=man-ket', 1440, 900, false, false],
  ['16-the-5-trang-thai-toi', 'khung=bang', 390, 844, true, true],
]
for (const [ten, q, w, hgt, toi, caTrang, thaoTac] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: w > 1000 ? 1 : caTrang ? 1.5 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await t.goto(`${GOC}?${q}`)
  await t.evaluate(() => document.fonts.ready)
  await t.locator('.ktcn-the, .ktcn-man').first().waitFor({ timeout: 20000 })
  if (thaoTac) await thaoTac(t)
  await t.waitForTimeout(500)
  const kq = await t.evaluate(() => {
    const tran = document.documentElement.scrollWidth > innerWidth + 1
    const nho = [...document.querySelectorAll('.ktcn-the button, .ktcn-man button, .ktcn-man summary, [role=alertdialog] button')].filter((e) => {
      const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && (r.height < 44 || r.width < 44)
    }).map((e) => `${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho }
  })
  if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  let cl = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: cl, fullPage: caTrang }); if (buf.length <= 150_000 || cl <= 40) break; cl -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${cl})`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm < 44 px')
