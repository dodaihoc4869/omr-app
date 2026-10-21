#!/usr/bin/env node
// CHỤP BẢN VẼ «EM VÀ CÂU NÀY» trong hộp Hỏi Thầy (21/10) bằng Chromium THẬT (/opt/pw-browsers/chromium). Sáng/tối = colorScheme.
//   node scripts/chup-ban-ve-hoi-thay-em-2110.mjs [thư mục ra = docs/ban-ve-hoi-thay-em-2110/anh]
// Ảnh chụp với reducedMotion, JPG tự hạ chất lượng tới ≤ 150 KB. Soát: lỗi trang · tràn ngang · đích chạm < 44 px (khối mới `.lg-ev`: < 48 px
// theo luật C9) · tương phản chữ trong thẻ < 4,5:1 (chữ lớn < 3:1) · ô nhắn (`.lg-nh-o` + nút Gửi) phải nằm TRỌN trong màn ở mọi ảnh không chụp toàn bộ (thẻ không được đẩy ô nhắn xuống).
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
// [tên, tham số, rộng, cao, tối?, toàn bộ?, cuộn cột trái tới phần tử?]
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
  ['19-co-du-lieu-mo-ngang-844-sang-cuon-xuong', 't=mo', 844, 390, false, false, '.lg-ev-hoi'],
]
let soTuongPhan = 0
for (const [ten, ts, w, h, toi, toanBo, cuon] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : toanBo ? 1.5 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  t.on('requestfailed', (r) => soat.push(`${ten}: tải hỏng ${r.url()}`))
  t.on('response', (r) => { if (r.status() >= 400) soat.push(`${ten}: ${r.status()} ${r.url()}`) })
  await t.goto(`${URL_VE}?${ts}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(250)
  if (cuon) await t.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'end' }), cuon)
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
    // Tương phản chữ của thẻ mới: trộn các lớp nền (kể cả nền trong suốt một phần) tới lớp đặc đầu tiên
    const doc = (c) => { let m = c.match(/^rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v[3] ?? 1] }
      m = c.match(/^color\(srgb ([^)]+)\)/); if (m) { const v = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [v[0] * 255, v[1] * 255, v[2] * 255, v[3] ?? 1] } return null }
    const tron = (tren, duoi) => [0, 1, 2].map((i) => tren[i] * tren[3] + duoi[i] * (1 - tren[3]))
    const nen = (e) => { const lop = []; for (let n = e; n; n = n.parentElement) { const c = doc(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) { lop.push(c); if (c[3] >= 1) break } }
      return lop.reverse().reduce((d, c) => tron(c, d), [255, 255, 255]) }
    const sang = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
    const tp = [], khongDo = []
    for (const e of goc.querySelectorAll('.lg-ev *, .lg-ev')) {
      if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue
      const s = getComputedStyle(e), chu = doc(s.color); if (!chu) { khongDo.push(e.className); continue }
      const b = nen(e), c = tron(chu, b), L1 = sang(c), L2 = sang(b), ti = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
      const lon = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && Number(s.fontWeight) >= 700)
      if (ti < (lon ? 3 : 4.5)) tp.push(`${e.className || e.tagName} ${ti.toFixed(2)}`)
    }
    return { tran, nho, ngang: document.documentElement.scrollWidth > innerWidth + 1, anO, cao: Math.round(hop.height), tp, khongDo, demTp: goc.querySelectorAll('.lg-ev').length }
  })
  if (kq.tran.length || kq.ngang) soat.push(`${ten}: TRÀN ${kq.tran.join(',')}`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (kq.tp.length) soat.push(`${ten}: TƯƠNG PHẢN thấp ${kq.tp.join(' | ')}`)
  if (kq.khongDo.length) soat.push(`${ten}: không đo được màu ${kq.khongDo.join(',')}`)
  if (kq.demTp) soTuongPhan++
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
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : `SOÁT ${KHUNG.length} ảnh: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · 0 chữ tương phản thấp (đo ${soTuongPhan} ảnh có thẻ) · ô nhắn luôn thấy trọn`)
