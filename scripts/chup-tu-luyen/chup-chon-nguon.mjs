#!/usr/bin/env node
// CHỤP ẢNH KHỐI "NGUỒN CÂU SAI" của chế độ 1 Sửa câu sai (30/09) — Chromium thật, dữ liệu GIẢ (trang.tsx). Ba khổ: 390×844, 844×390, 1280×800.
//   npx vite build --config scripts/chup-tu-luyen/vite.config.mjs --outDir <tạm>
//   node scripts/chup-tu-luyen/chup-chon-nguon.mjs <tạm> <thư mục ảnh>
// Mỗi khổ hai ảnh: mặc định (tick mọi nguồn có câu) và sau khi bỏ tick Ca kiểm tra; thêm một ảnh "chưa chọn nguồn". JPG ≤ 150 KB.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup')
const RA = resolve(process.argv[3] ?? 'anh-chon-nguon')
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
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })

async function chup(trang, ten) {
  for (const q of [72, 60, 50, 40, 32, 25]) {
    const buf = await trang.screenshot({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q === 25) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}
async function soat(trang, ten) {
  const r = await trang.evaluate(() => {
    const tran = document.documentElement.scrollWidth > window.innerWidth + 1 || [...document.querySelectorAll('.tlu-the-nguon')].some((e) => e.scrollWidth > e.clientWidth + 1)
    const nho = [...document.querySelectorAll('.tlu-the-nguon, .tlu-cau-hinh button')]
      .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 44 })
      .map((e) => (e.textContent || e.className).trim().slice(0, 24))
    return { tran, nho }
  })
  console.log(`  soát ${ten}: tràn ngang=${r.tran} · đích < 44px: ${r.nho.length ? r.nho.join(' | ') : 0}`)
}

for (const [w, hgt, nhan] of [[390, 844, '390x844'], [844, 390, '844x390'], [1280, 800, '1280x800']]) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'vi-VN', hasTouch: w < 1000 })
  const trang = await ctx.newPage()
  trang.on('pageerror', (e) => console.error('LỖI TRANG', e.message))
  await trang.goto(`${goc}?man=tl`)
  await trang.waitForSelector('.tlu-the-che-do')
  await trang.waitForTimeout(600)
  await trang.click('.tlu-the-che-do[data-che-do="1"]')
  await trang.waitForSelector('.tlu-nguon-sai')
  await trang.waitForTimeout(400)
  await trang.locator(w < 600 ? '.tlu-kho-sai' : '.tlu-cau-hinh').scrollIntoViewIfNeeded()
  if (w < 600) await trang.evaluate(() => document.querySelector('.tlu-kho-sai')?.scrollIntoView({ block: 'start' }))
  await trang.waitForTimeout(250)
  await soat(trang, `mac-dinh-${nhan}`)
  await chup(trang, `01-mac-dinh-${nhan}`)
  await trang.locator('.tlu-the-nguon[data-nguon="ca"]').click()
  await trang.waitForTimeout(250)
  await chup(trang, `02-bo-ca-kiem-tra-${nhan}`)
  if (w === 390) {
    for (const n of ['dao', 'doan', 'bia', 'tu_luyen']) {
      const o = trang.locator(`.tlu-the-nguon[data-nguon="${n}"][data-chon="1"]`)
      if (await o.count()) await o.click()
    }
    await trang.waitForTimeout(200)
    await trang.evaluate(() => document.querySelector('.tlu-nguon-sai')?.scrollIntoView({ block: 'start' }))
    await trang.waitForTimeout(200)
    await chup(trang, `03-chua-chon-nguon-${nhan}`)
  }
  await ctx.close()
}
await trinh.close()
may.close()
