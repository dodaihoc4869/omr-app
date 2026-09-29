#!/usr/bin/env node
// CHỤP ẢNH TU LUYỆN bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx thay `fetch`). Hai khổ: 390×844 (điện thoại dọc) và 1280×900.
//   node scripts/chup-tu-luyen/chup.mjs <thư mục build> <thư mục ảnh>
// Ảnh JPG; tự hạ chất lượng tới khi ≤ 150 KB.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup')
const RA = resolve(process.argv[3] ?? 'anh-tu-luyen')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }
const may = createServer((req, res) => {
  const p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/chup-tu-luyen/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-tu-luyen/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

async function chup(trang, ten, fullPage = false) {
  for (const q of [72, 60, 50, 40, 32, 25]) {
    const buf = await trang.screenshot({ type: 'jpeg', quality: q, fullPage })
    if (buf.length <= 150 * 1024 || q === 25) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}

for (const [w, hgt, nhan] of [[390, 844, '390'], [1280, 900, '1280']]) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'vi-VN' })
  const trang = await ctx.newPage()
  trang.on('pageerror', (e) => console.error('LỖI TRANG', e.message))
  // 1. Sảnh có cửa Tu luyện
  await trang.goto(`${goc}?man=sanh`)
  await trang.waitForSelector('text=Tu luyện', { timeout: 20000 })
  await trang.waitForTimeout(2500)
  await trang.locator('.h2-nut-tu-luyen, .h2-ng-tu-luyen').first().scrollIntoViewIfNeeded().catch(() => {})
  await trang.waitForTimeout(300)
  await chup(trang, `1-sanh-cua-tu-luyen-${nhan}`)
  // 2. Màn 4 chế độ (chọn Dạng bài)
  await trang.goto(`${goc}?man=tl`)
  await trang.waitForSelector('.tlu-the-che-do')
  await trang.waitForTimeout(400)
  await chup(trang, `2-bon-che-do-${nhan}`)
  await trang.click('.tlu-the-che-do[data-che-do="3"]')
  await trang.waitForSelector('.tlu-cau-hinh')
  await trang.waitForTimeout(700)
  await chup(trang, `3-cai-dat-dang-bai-${nhan}`, w > 800)
  // 3. Đang làm
  await trang.click('.tlu-nut-rong')
  await trang.waitForSelector('.tlu-the-cau')
  await trang.waitForTimeout(500)
  const pa = trang.locator('.tlu-the-cau').first().locator('.pa-noi-dung').first()
  if (await pa.count()) await pa.click().catch(() => {})
  await trang.waitForTimeout(300)
  await chup(trang, `4-dang-lam-${nhan}`)
  // 4. Nộp ⇒ kết quả có đáp án + lời giải
  await trang.click('.tlu-thanh-nop .tlu-nut-chinh')
  await trang.waitForTimeout(400)
  await trang.getByRole('button', { name: 'Nộp bài' }).last().click()
  await trang.waitForSelector('.tlu-diem')
  await trang.waitForTimeout(500)
  await chup(trang, `5-ket-qua-${nhan}`)
  await trang.locator('.tlu-the-cau').nth(1).scrollIntoViewIfNeeded()
  await trang.waitForTimeout(300)
  await chup(trang, `6-dap-an-loi-giai-${nhan}`)
  // 5. Tổng hợp
  await trang.getByRole('button', { name: 'Xem tổng hợp' }).click()
  await trang.waitForSelector('.tlu-hero')
  await trang.waitForTimeout(500)
  await chup(trang, `7-tong-hop-${nhan}`)
  await trang.locator('#tlu-h-dang').scrollIntoViewIfNeeded()
  await trang.waitForTimeout(300)
  await chup(trang, `8-tong-hop-theo-dang-${nhan}`)
  // Không tràn ngang
  const tran = await trang.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log(`khổ ${nhan}: tràn ngang ${tran}px`)
  await ctx.close()
}
await trinh.close()
may.close()
