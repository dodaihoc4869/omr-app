#!/usr/bin/env node
// CHỤP BẢN VẼ «EM VÀ CÂU NÀY» trong hộp Hỏi Thầy (21/10) bằng Chromium THẬT (/opt/pw-browsers/chromium). Sáng/tối = colorScheme.
//   node scripts/chup-ban-ve-hoi-thay-em-2110.mjs [thư mục ra = docs/ban-ve-hoi-thay-em-2110/anh]
// Ảnh chụp với reducedMotion, JPG tự hạ chất lượng tới ≤ 150 KB. Soát: lỗi trang · tràn ngang · đích chạm < 44 px (khối mới `.lg-ev`: < 48 px
// theo luật C9) · ô nhắn (`.lg-nh-o` + nút Gửi) phải nằm TRỌN trong màn ở mọi ảnh không chụp toàn bộ (thẻ không được đẩy ô nhắn xuống).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-hoi-thay-em-2110/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-hoi-thay-em-2110/hoi-thay-em.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
const TOAN_BO = '.lg-hh{max-height:none!important;height:auto!important}.lg-hh-nen{position:absolute!important;inset:0 0 auto 0!important;min-height:100%;align-items:flex-start!important}.lg-ht-log{max-height:none!important;overflow:visible!important}.lg-ev-than,.lg-hh-de-than{max-height:none!important;overflow:visible!important}'
// [tên, tham số, rộng, cao, tối?, toàn bộ?]
const KHUNG = [
  ['01-co-du-lieu-gap-390-sang', 't=gap', 390, 844, false, false],
  ['02-co-du-lieu-gap-390-toi', 't=gap', 390, 844, true, false],
  ['03-co-du-lieu-mo-390-sang-toan-bo', 't=mo', 390, 844, false, true],
  ['04-co-du-lieu-mo-390-toi-toan-bo', 't=mo', 390, 844, true, true],
  ['05-co-du-lieu-mo-390-sang-man-that', 't=mo', 390, 844, false, false],
  ['06-dang-tai-390-sang', 't=tai', 390, 844, false, false],
  ['07-lan-dau-390-toi', 't=moi', 390, 844, true, false],
  ['08-loi-mat-mang-an-the-390-sang', 't=loi', 390, 844, false, false],
  ['09-dang-lam-chua-nop-390-toi-toan-bo', 't=dl', 390, 844, true, true],
  ['10-sau-hoi-nhanh-390-sang', 't=da-hoi', 390, 844, false, false],
  ['11-co-du-lieu-mo-360-sang-toan-bo', 't=mo', 360, 740, false, true],
  ['12-co-du-lieu-gap-360-toi', 't=gap', 360, 740, true, false],
  ['13-co-du-lieu-gap-ngang-844-sang', 't=gap', 844, 390, false, false],
  ['14-co-du-lieu-mo-ngang-844-toi', 't=mo', 844, 390, true, false],
  ['15-co-du-lieu-mo-may-tinh-1440-sang', 't=mo', 1440, 900, false, false],
  ['16-co-du-lieu-gap-may-tinh-1440-toi', 't=gap', 1440, 900, true, false],
  ['17-sau-hoi-nhanh-may-tinh-1440-toi', 't=da-hoi', 1440, 900, true, false],
  ['18-lan-dau-ngang-844-sang', 't=moi', 844, 390, false, false],
]
for (const [ten, ts, w, h, toi, toanBo] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : toanBo ? 1.5 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  t.on('requestfailed', (r) => soat.push(`${ten}: tải hỏng ${r.url()}`))
  t.on('response', (r) => { if (r.status() >= 400) soat.push(`${ten}: ${r.status()} ${r.url()}`) })
  await t.goto(`${URL_VE}?${ts}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(250)
  const kq = await t.evaluate(() => {
    const goc = document.querySelector('.lg-hh')
    const tran = [...goc.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0).map((e) => e.className.baseVal ?? e.className).slice(0, 4)
    const nho = [...goc.querySelectorAll('button, summary, input, textarea')].filter((e) => {
      const r = e.getBoundingClientRect(); const can = e.closest('.lg-ev') ? 48 : 44
      return r.width > 0 && r.height > 0 && (r.height < can || r.width < 44)
    }).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    // Ô nhắn và nút Gửi phải thấy trọn (không bị cắt bởi hộp, không lọt dưới mép màn)
    const hop = goc.getBoundingClientRect()
    const anO = ['.lg-nh-o', '.lg-nh-gui'].filter((s) => { const r = goc.querySelector(s).getBoundingClientRect(); return r.height === 0 || r.bottom > Math.min(innerHeight, hop.bottom) + 0.5 || r.top < hop.top })
    return { tran, nho, ngang: document.documentElement.scrollWidth > innerWidth + 1, anO, cao: Math.round(hop.height) }
  })
  if (kq.tran.length || kq.ngang) soat.push(`${ten}: TRÀN ${kq.tran.join(',')}`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (!toanBo && kq.anO.length) soat.push(`${ten}: Ô NHẮN BỊ CHE ${kq.anO.join(',')} (hộp cao ${kq.cao} px)`)
  if (toanBo) await t.addStyleTag({ content: TOAN_BO })
  await t.waitForTimeout(120)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: !!toanBo }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  if (buf.length > 150_000) soat.push(`${ten}: ảnh ${Math.round(buf.length / 1024)} KB > 150 KB`)
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : `SOÁT ${KHUNG.length} ảnh: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · ô nhắn luôn thấy trọn`)
