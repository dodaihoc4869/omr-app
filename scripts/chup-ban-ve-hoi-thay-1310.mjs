#!/usr/bin/env node
// CHỤP BẢN VẼ HỎI THẦY (13/10) bằng Chromium THẬT (/opt/pw-browsers/chromium). Sáng/tối = colorScheme (m3-theme.css theo prefers-color-scheme như app).
//   node scripts/chup-ban-ve-hoi-thay-1310.mjs [thư mục ra = docs/ban-ve-hoi-thay-1310/anh]
// JPG tự hạ chất lượng tới ≤ 150 KB. Soát: lỗi trang · tràn ngang · đích chạm < 44 px (nút/ô bấm trong hộp).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-hoi-thay-1310/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-hoi-thay-1310/hoi-thay.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
// [tên, tham số, rộng, cao, tối?]
const KHUNG = [
  ['01-tra-loi-ngan-doc-toi', 'k=tln', 390, 844, true],
  ['02-tra-loi-ngan-doc-toi-toan-bo', 'k=tln&de=1', 390, 1720, true],
  ['03-tra-loi-ngan-doc-sang', 'k=tln', 390, 844, false],
  ['04-trac-nghiem-doc-toi-toan-bo', 'k=tn', 390, 1480, true],
  ['05-dung-sai-dang-lam-goi-huong-toi-toan-bo', 'k=ds-goi-y', 390, 1500, true],
  ['06-trac-nghiem-ngang-toi', 'k=tn', 844, 390, true],
  ['07-tra-loi-ngan-may-tinh-sang', 'k=tln&de=1', 1440, 900, false],
  ['08-trac-nghiem-may-tinh-toi', 'k=tn', 1440, 900, true],
]
for (const [ten, ts, w, h, toi] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : h > 1000 ? 1.25 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${URL_VE}?${ts}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(300)
  const kq = await t.evaluate(() => {
    const tran = [...document.querySelectorAll('.khung[data-hien] *')].some((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0) || document.documentElement.scrollWidth > innerWidth + 1
    const nho = [...document.querySelectorAll('.khung[data-hien] button, .khung[data-hien] summary')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) }).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho }
  })
  if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ')
