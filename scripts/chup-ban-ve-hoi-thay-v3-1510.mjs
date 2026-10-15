#!/usr/bin/env node
// CHỤP BẢN VẼ HỎI THẦY v3 — câu trả lời theo Ý EM HỎI (15/10) bằng Chromium THẬT (/opt/pw-browsers/chromium). Sáng/tối = colorScheme.
//   node scripts/chup-ban-ve-hoi-thay-v3-1510.mjs [thư mục ra = docs/ban-ve-hoi-thay-v3-1510/anh]
// Ảnh tĩnh chụp với reducedMotion (hoạt cảnh đứng ở trạng thái cuối), JPG tự hạ chất lượng tới ≤ 150 KB; thêm video webm thao tác thật
// (mở gợi ý, chọn câu Thầy hỏi lại, em thử tính). Soát: lỗi trang · tràn ngang · đích chạm < 44 px (khối mới v3: < 48 px theo luật C9).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-hoi-thay-v3-1510/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-hoi-thay-v3-1510/hoi-thay-v3.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
const TOAN_BO = '.lg-hh{max-height:none!important;height:auto!important}.lg-hh-nen{position:absolute!important;inset:0 0 auto 0!important;min-height:100%;align-items:flex-start!important}.lg-ht-log{max-height:none!important;overflow:visible!important}.lg-ht--hop{overflow:visible!important}'
const MOI = '.lg-chua button, .lg-kiem-lua button, .lg-nac-mo, .lg-nut-phu, .lg-gon > summary, .lg-thu button, .lg-thu input'
// [tên, tham số, rộng, cao, tối?, toàn bộ?]
const KHUNG = [
  ['01-chi-cho-sai-doc-toi-toan-bo', 'k=sai', 390, 844, true, true],
  ['02-chi-cho-sai-da-tra-loi-dung-doc-sang-toan-bo', 'k=sai&kiem=dung', 390, 844, false, true],
  ['03-goi-y-tung-nac-doc-toi-toan-bo', 'k=goi-y', 390, 844, true, true],
  ['04-goi-y-tung-nac-mo-du-3-doc-sang-toan-bo', 'k=goi-y&mo=3', 390, 844, false, true],
  ['05-giai-thich-doc-toi-toan-bo', 'k=vi-sao&kiem=dung', 390, 844, true, true],
  ['06-giai-thich-doc-sang-toan-bo', 'k=vi-sao', 390, 844, false, true],
  ['07-tung-y-chon-sai-doc-toi-toan-bo', 'k=dung-sai&kiem=sai', 390, 844, true, true],
  ['08-tung-y-doc-sang-toan-bo', 'k=dung-sai', 390, 844, false, true],
  ['09-tinh-tung-buoc-doc-toi-toan-bo', 'k=tinh', 390, 844, true, true],
  ['10-tinh-tung-buoc-em-thu-dung-doc-sang-toan-bo', 'k=tinh&thu=dung', 390, 844, false, true],
  ['11-chi-cho-sai-ngang-toi', 'k=sai', 844, 390, true, false],
  ['12-giai-thich-may-tinh-sang', 'k=vi-sao&kiem=dung', 1440, 900, false, false],
  ['13-tung-y-may-tinh-toi', 'k=dung-sai', 1440, 900, true, false],
  ['14-dien-thoai-360-sang-toan-bo', 'k=sai', 360, 740, false, true],
]
for (const [ten, ts, w, h, toi, toanBo] of KHUNG) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : toanBo ? 1.5 : 2, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${URL_VE}?${ts}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(250)
  const kq = await t.evaluate((moi) => {
    const goc = document.querySelector('.khung[data-hien] .lg-hh')
    const tran = [...goc.querySelectorAll('*')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0).map((e) => e.className.baseVal ?? e.className).slice(0, 4)
    const moiDs = new Set(goc.querySelectorAll(moi))
    const nho = [...goc.querySelectorAll('button, summary, input')].filter((e) => { const r = e.getBoundingClientRect(); const can = moiDs.has(e) ? 48 : 44; return r.width > 0 && (r.height < can || r.width < 44) }).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho, ngang: document.documentElement.scrollWidth > innerWidth + 1 }
  }, MOI)
  if (kq.tran.length || kq.ngang) soat.push(`${ten}: TRÀN ${kq.tran.join(',')}`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (toanBo) await t.addStyleTag({ content: TOAN_BO })
  await t.waitForTimeout(120)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: !!toanBo }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
// VIDEO thao tác (không giảm chuyển động): mở gợi ý 3 → bài Đúng/Sai chọn sai rồi chọn đúng → em thử tính rồi mở bước 3.
{
  const ctx = await trinh.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', locale: 'vi-VN', recordVideo: { dir: RA, size: { width: 390, height: 844 } } })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`video: lỗi trang ${e.message}`))
  const keo = async (sel) => { await t.locator(`.khung[data-hien] ${sel}`).first().scrollIntoViewIfNeeded(); await t.waitForTimeout(500) }
  await t.goto(`${URL_VE}?k=goi-y`); await keo('.lg-tn-hang'); await t.waitForTimeout(3800); await keo('[data-mo-nac]'); await t.click('.khung[data-hien] [data-mo-nac]'); await t.waitForTimeout(1500)
  await t.goto(`${URL_VE}?k=dung-sai`); await t.waitForTimeout(800); await keo('.lg-kiem'); await t.click('.khung[data-hien] .lg-kiem-lua button >> nth=0'); await t.waitForTimeout(1600); await t.click('.khung[data-hien] .lg-kiem-lua [data-dung]'); await t.waitForTimeout(1600)
  await t.goto(`${URL_VE}?k=tinh`); await t.waitForTimeout(800); await keo('.lg-thu'); await t.fill('.khung[data-hien] .lg-thu input', '0,2'); await t.click('.khung[data-hien] [data-kiem-thu]'); await t.waitForTimeout(1500)
  await t.fill('.khung[data-hien] .lg-thu input', '0,16'); await t.click('.khung[data-hien] [data-kiem-thu]'); await t.waitForTimeout(1200); await t.click('.khung[data-hien] [data-buoc-3]'); await t.waitForTimeout(1600)
  const v = t.video(); await ctx.close()
  renameSync(await v.path(), join(RA, '15-thao-tac-hoat-canh.webm'))
  console.log(`15-thao-tac-hoat-canh.webm ${Math.round(statSync(join(RA, '15-thao-tac-hoat-canh.webm')).size / 1024)} KB`)
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ')
