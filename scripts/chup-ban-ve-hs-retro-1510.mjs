#!/usr/bin/env node
// CHỤP BẢN VẼ APP HỌC SINH PHONG CÁCH RETRO (15/10) bằng Chromium THẬT (/opt/pw-browsers/chromium). Sáng/tối = colorScheme.
//   node scripts/chup-ban-ve-hs-retro-1510.mjs [thư mục ra = docs/ban-ve-hs-retro-1510/anh]
// JPG tự hạ chất lượng tới ≤ 150 KB. Soát: lỗi trang · tràn ngang · đích chạm < 44 px (button, a trong khung đang hiện).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-hs-retro-1510/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-hs-retro-1510/hs-retro.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
// [tên, tham số, rộng, cao, tối?]
const KHUNG = [
  ['00-tong-quan-sang', 'm=tong-quan', 1500, 860, false],
  ['00-tong-quan-toi', 'm=tong-quan', 1500, 860, true],
  ['01-hom-nay-doc-sang', 'm=hom-nay', 390, 844, false],
  ['02-hom-nay-doc-toi', 'm=hom-nay', 390, 844, true],
  ['03-hom-nay-doc-sang-toan-bo', 'm=hom-nay', 390, 1560, false],
  ['04-lam-cau-doc-sang-dang-chon', 'm=lam-cau', 390, 844, false],
  ['05-lam-cau-doc-toi-sau-nop-sai', 'm=lam-cau&kq=sai', 390, 844, true],
  ['06-lam-cau-doc-sang-sau-nop-dung', 'm=lam-cau&kq=dung', 390, 844, false],
  ['07-dung-sai-ngang-sang', 'm=dung-sai', 844, 390, false],
  ['08-dung-sai-ngang-toi', 'm=dung-sai', 844, 390, true],
  ['09-tra-loi-ngan-doc-toi', 'm=tra-loi-ngan', 390, 844, true],
  ['10-xong-chang-doc-sang', 'm=xong-chang', 390, 1040, false],
  ['11-xong-chang-doc-toi', 'm=xong-chang', 390, 1040, true],
  ['12-hanh-trinh-doc-sang', 'm=hanh-trinh', 390, 1220, false],
  ['13-hanh-trinh-doc-toi', 'm=hanh-trinh', 390, 1220, true],
  ['14-trang-thai-doc-sang', 'm=trang-thai', 390, 1340, false],
  ['15-trang-thai-doc-toi', 'm=trang-thai', 390, 1340, true],
  ['16-hom-nay-may-tinh-sang', 'm=hom-nay', 1440, 900, false],
  ['17-hom-nay-may-tinh-toi', 'm=hom-nay', 1440, 900, true],
  ['18-lam-cau-may-tinh-toi', 'm=lam-cau', 1440, 900, true],
]
for (const [ten, ts, w, h, toi] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : h > 1000 ? 1.25 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  t.on('requestfailed', (r) => soat.push(`${ten}: tải hỏng ${r.url()}`))
  t.on('response', (r) => { if (r.status() >= 400) soat.push(`${ten}: ${r.status()} ${r.url()}`) })
  await t.goto(`${URL_VE}?${ts}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(ts.includes('tong-quan') ? 1200 : 250)
  const kq = await t.evaluate(() => {
    const tran = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    const nho = [...document.querySelectorAll('.khung[data-hien] button, .khung[data-hien] a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) }).map((e) => `${e.textContent.trim().slice(0, 24) || e.getAttribute('aria-label')} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    const ve = [...document.querySelectorAll('.khung[data-hien] *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' }).map((e) => e.className || e.tagName).slice(0, 4)
    return { tran, nho, ve }
  })
  if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.ve.length) soat.push(`${ten}: phần tử ra ngoài khung ${kq.ve.join(' | ')}`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  let q = 84, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ')
