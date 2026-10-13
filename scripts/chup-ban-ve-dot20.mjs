#!/usr/bin/env node
// CHỤP BẢN VẼ ĐỢT 20 (Kiểm tra ôn tập) bằng Chromium THẬT (/opt/pw-browsers/chromium, không tải trình duyệt).
//   node scripts/chup-ban-ve-dot20.mjs [thư mục ra = docs/ban-ve-dot20/anh]
// Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB. Soát mỗi khung: lỗi trang · tràn ngang · đích chạm < 44 px.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-dot20/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-dot20/kiem-tra-on-tap.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []

const KHUNG = [
  ['01-hom-nay-ngay-kiem-tra-doc', 'k=hom-nay&tt=can_lam', 390, 844, false],
  ['02-the-5-trang-thai-doc', 'k=bang-the', 390, 844, true],
  ['03-hom-nay-ngay-kiem-tra-may-tinh', 'k=hom-nay&tt=can_lam', 1440, 900, false],
  ['04-hom-nay-dang-chuan-bi-may-tinh', 'k=hom-nay&tt=cho_nguon', 1440, 900, false],
  ['05-hom-nay-dang-chuan-bi-doc', 'k=hom-nay&tt=cho_nguon', 390, 844, false],
  ['06-tong-quan-bai-doc', 'k=tong-quan', 390, 844, true],
  ['07-lam-chang-doc', 'k=lam-chang', 390, 844, false],
  ['08-lam-chang-ngang', 'k=lam-chang', 844, 390, false],
  ['09-lam-chang-may-tinh', 'k=lam-chang', 1440, 900, false],
  ['10-lam-chang-toi-sap-het-gio', 'k=lam-chang&toi=1&gap=1', 390, 844, false],
  ['11-hop-nop-bai-doc', 'k=hop-nop', 390, 844, false],
  ['12-ket-qua-doc', 'k=ket-qua', 390, 844, true],
  ['13-ket-qua-may-tinh', 'k=ket-qua', 1440, 900, false],
  ['14-hom-nay-ngay-kiem-tra-ngang', 'k=hom-nay&tt=can_lam', 844, 390, false],
  ['15-the-5-trang-thai-toi', 'k=bang-the&toi=1', 390, 844, true],
]
for (const [ten, hash, w, h, caTrang] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : caTrang ? 1.5 : 2, colorScheme: hash.includes('toi=1') ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${URL_VE}#${hash}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(250)
  const kq = await t.evaluate(() => {
    const tran = document.documentElement.scrollWidth > innerWidth + 1
    const nho = [...document.querySelectorAll('button, a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40) && getComputedStyle(e).visibility !== 'hidden' }).map((e) => `${e.textContent.trim().slice(0, 20)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho }
  })
  if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: caTrang }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ')
