#!/usr/bin/env node
// CHỤP NGHIỆM THU ca thi chế độ tập trung (thầy 01/11): Chromium thật — điện thoại dọc (thanh ẩn · thanh hiện · báo «Còn 6 phút» · «Còn 1 phút» · tối),
// điện thoại ngang, máy tính. Đếm lỗi trang, tràn ngang, đích chạm < 44 px; kiểm thanh trên nằm ngoài màn khi ẩn và nút «Đóng phòng thi» được cất.
//   npx vite build --config scripts/chup-thi-tap-trung-0111/vite.config.ts && node scripts/chup-thi-tap-trung-0111/chup.mjs [--dist=…] [--ra=docs/thi-tap-trung-0111]
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright'

const arg = (k, m) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? m
const DIST = resolve(arg('dist', process.env.RA_CHUP_TT || join(tmpdir(), 'dist-chup-tt'))), RA = resolve(arg('ra', 'docs/thi-tap-trung-0111'))
mkdirSync(RA, { recursive: true })
const LOAI = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' }
const may = createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html')
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
const GOC = `http://127.0.0.1:${may.address().port}/`
const KHO = { doc: { width: 390, height: 844, isMobile: true, hasTouch: true }, ngang: { width: 844, height: 390, isMobile: true, hasTouch: true }, may: { width: 1440, height: 900 } }
const thuMuc = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)
const trinh = await chromium.launch(thuMuc ? { executablePath: thuMuc } : {})
const bao = []

const CANH = [
  { ten: 'doc-thanh-an-sang', kho: 'doc' },
  { ten: 'doc-thanh-hien-sang', kho: 'doc', viec: 'hien' },
  { ten: 'doc-bao-6-phut-sang', kho: 'doc', gio: 420, viec: 'bao', toi: 360 },
  { ten: 'doc-bao-1-phut-sang', kho: 'doc', gio: 120, viec: 'bao', toi: 60 },
  { ten: 'doc-thanh-an-toi', kho: 'doc', sac: 'toi' },
  { ten: 'ngang-thanh-an-sang', kho: 'ngang' },
  { ten: 'may-thanh-an-sang', kho: 'may' },
  { ten: 'may-bao-6-phut-sang', kho: 'may', gio: 420, viec: 'bao', toi: 360 },
]
for (const c of CANH) {
  const { width, height, ...k } = KHO[c.kho]
  const ctx = await trinh.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: c.sac === 'toi' ? 'dark' : 'light', ...k })
  const page = await ctx.newPage()
  const loi = []
  page.on('pageerror', (e) => loi.push(e.message))
  await page.goto(`${GOC}?gio=${c.gio ?? 2292}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForSelector('.kt-gt:not([hidden]) svg', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(600)
  if (c.viec === 'hien') { await page.locator('.duo-kt-tay').click(); await page.waitForTimeout(350) }
  if (c.viec === 'bao') {
    await page.evaluate((x) => window.__datGio(x), c.toi)
    await page.waitForSelector('.duo-kt-bao-vien')
    // dừng hoạt ảnh ở giữa quãng hiện (đã rõ hẳn, chưa mờ đi)
    await page.evaluate(() => { for (const a of document.querySelector('.duo-kt-bao-vien').getAnimations()) { a.pause(); a.currentTime = 1500 } })
  }
  const d = await page.evaluate(() => {
    const tran = document.scrollingElement.scrollWidth > innerWidth + 1
    const nho = []
    for (const el of document.querySelectorAll('button, a[href], [role=button], input, [role=radio]')) {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el)
      if (!r.width || !r.height || s.visibility === 'hidden' || s.display === 'none' || r.bottom <= 0 || el.closest('[hidden], [aria-hidden=true]')) continue
      if (r.width < 44 || r.height < 44) nho.push(`${el.className || el.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`)
    }
    const tren = document.querySelector('.duo-kt-tren').getBoundingClientRect()
    const dong = document.querySelector('button[aria-label^="Đóng phòng thi"]')
    const bao = document.querySelector('.duo-kt-bao-vien')
    return {
      tran, nho, thanh: tren.bottom <= 0 ? 'ẩn' : `hiện (${Math.round(tren.top)}…${Math.round(tren.bottom)})`,
      dongCong: getComputedStyle(dong).display === 'none' ? 'cất' : 'CÒN',
      bao: bao ? `${bao.textContent} · ${bao.closest('[aria-live]').getAttribute('aria-live')}` : '-',
      tay: (() => { const r = document.querySelector('.duo-kt-tay').getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}` })(),
    }
  })
  const tep = join(RA, `${c.ten}.jpg`)
  await page.screenshot({ path: tep, type: 'jpeg', quality: c.kho === 'may' ? 70 : 80 })
  bao.push({ tep, loi: loi.length, kb: Math.round(statSync(tep).size / 1024), ...d })
  await ctx.close()
}
await trinh.close(); may.close()
for (const b of bao) console.log(`${b.tep.split('/').pop()}\t${b.kb} KB\tlỗi=${b.loi}\ttràn=${b.tran}\tthanh=${b.thanh}\tnút cổng=${b.dongCong}\ttay nắm=${b.tay}\tbáo=${b.bao}\tnhỏ=${b.nho.length}${b.nho.length ? ' ' + b.nho.slice(0, 4).join(' | ') : ''}`)
