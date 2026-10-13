#!/usr/bin/env node
// CHỤP ẢNH ĐỢT 19 · LÀN R bằng Chromium THẬT (Playwright, /opt/pw-browsers/chromium — không tải trình duyệt), dữ liệu GIẢ (trang.tsx + gia.ts).
//   npx vite build --config scripts/chup-ph-dot19/vite.config.mjs --outDir <tạm> && node scripts/chup-ph-dot19/chup.mjs <tạm> docs/anh-dot19 [--soat]
// Ảnh (JPG tự hạ chất lượng tới khi ≤ 150 KB): ph-doc-1..3 (390×844 cả trang, 3 đoạn) · ph-ngang (844×390) · ph-may-tinh (1440×900 màn đầu)
//   · ph-may-tinh-ca-trang (1440 cả trang, thu nhỏ) · ph-doc-toi (390×844 tối).
// SOÁT (mọi khổ × sáng/tối): lỗi trang · tràn ngang · đích chạm < 44 px · phần dưới nạp khi cuộn tới (hai lệnh hồ sơ CHƯA gọi lúc mở, gọi sau khi cuộn).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-ph-dot19')
const RA = resolve(process.argv[3] ?? 'docs/anh-dot19')
const CHI_SOAT = process.argv.includes('--soat')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-ph-dot19/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const GOC = `http://127.0.0.1:${may.address().port}/scripts/chup-ph-dot19/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const loi = []

async function moTrang(w, hgt, nen, tl = 1, q = '') {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: tl, colorScheme: nen, reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loi.push(`${w}×${hgt} ${nen}: lỗi trang ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await t.goto(`${GOC}${q}`)
  await t.evaluate(() => document.fonts.ready)
  await t.locator('[data-vung="anh-hung"]').waitFor({ timeout: 20000 })
  await t.waitForTimeout(400)
  return { ctx, t }
}
/** Cuộn hết trang (để phần dưới nạp + vẽ), rồi về đầu. */
async function cuonHet(t) {
  for (let i = 0; i < 30; i++) {
    const xong = await t.evaluate(() => { window.scrollBy(0, window.innerHeight * 0.9); return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4 })
    await t.waitForTimeout(120)
    if (xong) break
  }
  await t.locator('[data-vung="tin-hieu"]').waitFor({ timeout: 20000 })
  await t.locator('[data-vung="cau-chua-sua"]').waitFor({ timeout: 20000 })
  await t.waitForTimeout(500)
  await t.evaluate(() => window.scrollTo(0, 0))
  await t.waitForTimeout(300)
}
async function luuJpg(buf0, ten, chup) {
  for (const q of [82, 74, 66, 58, 50, 42, 34]) {
    const buf = await chup(q)
    if (buf.length <= 150 * 1024 || q === 34) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}
async function soat(t, nhan) {
  const r = await t.evaluate(() => {
    const tran = document.documentElement.scrollWidth - window.innerWidth
    const nho = []
    for (const el of document.querySelectorAll('a, button, summary, [role="button"]')) {
      const b = el.getBoundingClientRect()
      const st = getComputedStyle(el)
      if (b.width === 0 || b.height === 0 || st.visibility === 'hidden' || st.display === 'none') continue
      if (el.closest('.ph3-an')) continue
      if (b.height < 44 || b.width < 44) nho.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40)}" ${Math.round(b.width)}×${Math.round(b.height)}`)
    }
    return { tran, nho }
  })
  if (r.tran > 0) loi.push(`${nhan}: tràn ngang ${r.tran}px`)
  for (const n of r.nho) loi.push(`${nhan}: đích chạm nhỏ ${n}`)
}

// 1 · nạp khi cuộn tới: lúc mở CHƯA gọi hai lệnh hồ sơ; cuộn xuống thì gọi CẢ HAI
{
  const { ctx, t } = await moTrang(390, 844, 'light')
  const truoc = await t.evaluate(() => window.__goi.filter((d) => /ho-so-thai-do|lich-su-lam-cau/.test(d)))
  if (truoc.length) loi.push(`mở trang đã gọi ${truoc.join(', ')} (phải đợi cuộn tới)`)
  await cuonHet(t)
  const sau = await t.evaluate(() => window.__goi.filter((d) => /ho-so-thai-do|lich-su-lam-cau/.test(d)))
  if (sau.length !== 2) loi.push(`cuộn tới phần dưới: gọi ${sau.length} lệnh hồ sơ (phải đúng 2)`)
  // bấm khối bậc ở Hôm nay ⇒ tấm 12 bậc của làn M ("Con đang ở đây"); Esc đóng, tiêu điểm về nút
  const nut = t.locator('[data-vung="bac-hom-nay"]')
  await nut.click()
  await t.locator('.bcc-tam').waitFor({ timeout: 20000 })
  if (!(await t.locator('.bcc-tam').textContent())?.includes('Con đang ở đây')) loi.push('tấm 12 bậc không có "Con đang ở đây"')
  await t.keyboard.press('Escape')
  await t.waitForTimeout(300)
  if (await t.locator('.bcc-tam').count()) loi.push('Esc không đóng tấm 12 bậc')
  if (!(await t.evaluate(() => document.activeElement?.getAttribute('data-vung') === 'bac-hom-nay'))) loi.push('đóng tấm 12 bậc: tiêu điểm không về nút bậc')
  await ctx.close()
}

// 2 · soát mọi khổ × sáng/tối
for (const [w, hgt] of [[390, 844], [844, 390], [1440, 900]]) {
  for (const nen of ['light', 'dark']) {
    const { ctx, t } = await moTrang(w, hgt, nen)
    await cuonHet(t)
    await soat(t, `${w}×${hgt} ${nen}`)
    await ctx.close()
  }
}

if (!CHI_SOAT) {
  // 3 · dọc cả trang (3 đoạn)
  {
    const { ctx, t } = await moTrang(390, 844, 'light', 1)
    await cuonHet(t)
    const cao = await t.evaluate(() => document.documentElement.scrollHeight)
    const doan = Math.ceil(cao / 3)
    for (let i = 0; i < 3; i++) {
      const clip = { x: 0, y: i * doan, width: 390, height: Math.min(doan, cao - i * doan) }
      await luuJpg(null, `ph-doc-${i + 1}`, (q) => t.screenshot({ type: 'jpeg', quality: q, fullPage: true, clip }))
    }
    await ctx.close()
  }
  // 4 · ngang
  {
    const { ctx, t } = await moTrang(844, 390, 'light', 1.5)
    await luuJpg(null, 'ph-ngang', (q) => t.screenshot({ type: 'jpeg', quality: q }))
    await ctx.close()
  }
  // 5 · máy tính: màn đầu + cả trang (thu nhỏ)
  {
    const { ctx, t } = await moTrang(1440, 900, 'light')
    await luuJpg(null, 'ph-may-tinh', (q) => t.screenshot({ type: 'jpeg', quality: q }))
    await cuonHet(t)
    await ctx.close()
    const c2 = await trinh.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 0.5, colorScheme: 'light', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
    const t2 = await c2.newPage()
    await t2.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
    await t2.goto(GOC)
    await t2.evaluate(() => document.fonts.ready)
    await t2.locator('[data-vung="anh-hung"]').waitFor({ timeout: 20000 })
    await cuonHet(t2)
    await luuJpg(null, 'ph-may-tinh-ca-trang', (q) => t2.screenshot({ type: 'jpeg', quality: q, fullPage: true }))
    await c2.close()
  }
  // 6 · dọc tối (màn đầu + đoạn Thái độ)
  {
    const { ctx, t } = await moTrang(390, 844, 'dark', 2)
    await luuJpg(null, 'ph-doc-toi', (q) => t.screenshot({ type: 'jpeg', quality: q }))
    await cuonHet(t)
    await t.evaluate(() => document.getElementById('phan-thai-do')?.scrollIntoView({ block: 'start' }))
    await t.waitForTimeout(300)
    await luuJpg(null, 'ph-doc-toi-thai-do', (q) => t.screenshot({ type: 'jpeg', quality: q }))
    await ctx.close()
  }
}

await trinh.close()
may.close()
if (loi.length) {
  console.log(`VẤN ĐỀ (${loi.length}):\n  ${[...new Set(loi)].join('\n  ')}`)
  process.exitCode = 1
} else console.log('Soát: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · nạp khi cuộn tới đúng.')
