#!/usr/bin/env node
// ẢNH TRƯỚC / SAU — bong bóng Mol đè nút KIỂM TRA ÔN TẬP + số «Đủ 17/12 câu hôm nay!» (thầy 02/11, hai ảnh thật nền tối, màn Lộ trình).
// Chromium THẬT, component THẬT (scripts/chup-v2, cảnh `?man=hs-mot&tp=1&anh=0211` = dữ liệu giống ảnh: mức 12, đã làm 17, 2/2 chặng, Kiểm tra ôn tập hôm nay chưa làm).
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>          (một lần với mã origin/main ⇒ «truoc», một lần với nhánh ⇒ «sau»)
//   node docs/anh-lo-trinh-bong-bong-0211/chup.mjs <dist> <tiền tố: truoc|sau>
// Mỗi ảnh JPG ≤ 150 KB; in chỗ bong bóng (data-cho) và số nút bị bong bóng đè (khung thật).
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2'), TIEN = process.argv[3] ?? 'sau'
const RA = import.meta.dirname, PUB = resolve(RA, '../../public')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname), p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
const trang = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html?man=hs-mot&tp=1&anh=0211`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
// `dai` = ảnh đầu trang (dải xanh «Đủ … câu hôm nay!»), các ảnh khác cuộn tới Mol
const DS = [['dai-doc-toi', 390, 844, 'dark', false], ['doc-toi', 390, 844, 'dark', true], ['doc-sang', 390, 844, 'light', true], ['ngang-toi', 844, 390, 'dark', true]]
let loi = 0
for (const [ten, w, h, nen, cuon] of DS) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: nen, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  const t = await ctx.newPage()
  t.on('pageerror', (e) => { loi++; console.error(`[${ten}] lỗi trang:`, e.message) })
  await t.goto(trang)
  await t.waitForSelector('.da-lv-loi-o .bi-loi-boc', { timeout: 20000 })
  if (cuon) await t.evaluate(() => document.querySelector('.da-linh-vat[data-lv="bi"]')?.scrollIntoView({ block: 'center' }))
  await t.waitForTimeout(1500) // gõ chữ xong + đo lại sau cuộn / phông chữ
  const so = await t.evaluate(() => {
    const neo = document.querySelector('.da-lv-loi-o'), d = neo?.closest('.da-duong'), bb = neo?.querySelector('.bi-loi-bong'), chip = neo?.querySelector('.da-lv-chip')
    const k = (bb && getComputedStyle(neo.querySelector('.bi-loi-boc')).visibility !== 'hidden' ? bb : chip)?.getBoundingClientRect()
    const vat = [...d.querySelectorAll('button, [role="button"], .da-vong, .da-bong, .da-dem')].filter((e) => !neo.contains(e)).map((e) => e.getBoundingClientRect()).filter((n) => n.width && n.height)
    const de = k ? vat.filter((n) => n.left < k.right && n.right > k.left && n.top < k.bottom && n.bottom > k.top).length : -1
    return { cho: neo?.dataset.cho ?? '(cũ: không có)', de, dai: document.querySelector('.da-bang[data-sac="dung"] b')?.textContent ?? '' }
  })
  console.log(`${TIEN}-${ten}: chỗ bong bóng=${so.cho} · nút bị đè=${so.de} · dải xanh «${so.dai}»`)
  for (let q = 80; q >= 30; q -= 10) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q })
    if (buf.length <= 150_000 || q === 30) { writeFileSync(join(RA, `${TIEN}-${ten}.jpg`), buf); break }
  }
  await ctx.close()
}
await trinh.close(); may.close()
process.exit(loi ? 1 : 0)
