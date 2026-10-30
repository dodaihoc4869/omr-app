#!/usr/bin/env node
// CHỤP NGHIỆM THU màn kiểm tra kiểu Duo (30/10, đặc tả docs/dac-ta-kiem-tra-duo-3010.md mục 7): Chromium thật, 3 khổ × sáng / tối × 6 cảnh + 4 khung
// hình đèn pha. Đếm lỗi trang, tràn ngang, đích chạm < 44 px. Dữ liệu giả (minh hoạ).
//   npx vite build --config scripts/chup-kiem-tra-duo-3010/vite.config.ts && node scripts/chup-kiem-tra-duo-3010/chup.mjs [--dist=<thư mục bản dựng>] [--ra=docs/ban-ve-kiem-tra-duo-3010]
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright'

const arg = (k, m) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? m
const DIST = resolve(arg('dist', process.env.RA_CHUP_KT || join(tmpdir(), 'dist-chup-kt'))), RA = resolve(arg('ra', 'docs/ban-ve-kiem-tra-duo-3010'))
mkdirSync(RA, { recursive: true })
const LOAI = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' }
const may = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html')
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
const GOC = `http://127.0.0.1:${may.address().port}/`
const KHO = { doc: { width: 390, height: 844, isMobile: true, hasTouch: true }, ngang: { width: 844, height: 390, isMobile: true, hasTouch: true }, may: { width: 1440, height: 900 } }
const CANH = ['a', 'b', 'e', 'c2', 'c3', 'd']
const thuMuc = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const trinh = await chromium.launch(thuMuc ? { executablePath: thuMuc } : {})
const bao = []

async function moTrang(kho, sac, canh, them = '') {
  const { width, height, ...k } = KHO[kho]
  const ctx = await trinh.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: sac === 'toi' ? 'dark' : 'light', ...k })
  const page = await ctx.newPage()
  const loi = []
  page.on('pageerror', (e) => loi.push(e.message))
  await page.goto(`${GOC}?canh=${canh}${them}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForSelector('.kt-gt:not([hidden]) svg, .duo-kt-nop', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(700)
  return { ctx, page, loi }
}
async function bam(page, canh) {
  if (canh === 'b') await page.locator('#cau-3 .pa-hang').nth(2).click()
  if (canh === 'c2') await page.locator('#cau-20 .y-nut').nth(2).locator('button').nth(1).click()
  if (canh === 'c3') { for (const s of ['0', ',', '8', '4']) await page.locator('#cau-25 .bns-phim button', { hasText: new RegExp(`^${s === ',' ? ',' : s}$`) }).first().click() }
}
async function do_(page) {
  return page.evaluate(() => {
    const tran = document.scrollingElement.scrollWidth > innerWidth + 1
    const nho = []
    for (const el of document.querySelectorAll('button, a[href], [role=button], input, [role=radio]')) {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el)
      if (!r.width || !r.height || s.visibility === 'hidden' || el.closest('[hidden], [aria-hidden=true]')) continue
      if (r.width < 44 || r.height < 44) nho.push(`${el.className || el.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`)
    }
    return { tran, nho }
  })
}
for (const kho of Object.keys(KHO)) for (const sac of ['sang', 'toi']) for (const canh of CANH) {
  const { ctx, page, loi } = await moTrang(kho, sac, canh)
  await bam(page, canh)
  if (['b', 'c2', 'c3'].includes(canh)) await page.waitForTimeout(520)
  const d = await do_(page)
  const tep = join(RA, `${kho}-${canh}-${sac}.jpg`)
  await page.screenshot({ path: tep, type: 'jpeg', quality: kho === 'may' ? 72 : 80 })
  bao.push({ tep, loi: loi.length, tran: d.tran, nho: d.nho, kb: Math.round(statSync(tep).size / 1024) })
  await ctx.close()
}
// Khung hình đèn pha (điện thoại dọc): dừng mọi hoạt ảnh ở mốc t ms sau khi đèn bật.
for (const sac of ['sang', 'toi']) {
  const MOC = [40, 140, 260, 520]
  for (const [i, t] of MOC.entries()) {
    const { ctx, page } = await moTrang('doc', sac, 'b')
    await page.locator('#cau-3 .pa-hang').nth(2).click()
    await page.waitForSelector('.kt-den[data-bat]')
    await page.evaluate((t) => { for (const a of document.querySelector('.kt-den').getAnimations({ subtree: true })) { a.pause(); a.currentTime = t } }, t)
    const tep = join(RA, `den-${sac}-${i + 1}-${t}ms.jpg`)
    await page.screenshot({ path: tep, type: 'jpeg', quality: 80 })
    bao.push({ tep, kb: Math.round(statSync(tep).size / 1024) })
    await ctx.close()
  }
}
// Máy yếu (bản gọn: chỉ opacity) — vẫn có đèn.
{
  const { ctx, page, loi } = await moTrang('doc', 'sang', 'b', '&yeu=1')
  await bam(page, 'b'); await page.waitForTimeout(300)
  const tep = join(RA, 'doc-b-may-yeu-sang.jpg')
  await page.screenshot({ path: tep, type: 'jpeg', quality: 80 })
  bao.push({ tep, loi: loi.length, kb: Math.round(statSync(tep).size / 1024) })
  await ctx.close()
}
await trinh.close(); may.close()
for (const b of bao) console.log(`${b.tep.split('/').pop()}\t${b.kb} KB\tlỗi=${b.loi ?? '-'}\ttràn=${b.tran ?? '-'}\tnhỏ=${b.nho ? b.nho.length : '-'}${b.nho?.length ? ' ' + b.nho.slice(0, 4).join(' | ') : ''}`)
