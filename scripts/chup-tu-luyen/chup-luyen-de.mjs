#!/usr/bin/env node
// CHỤP ẢNH THẺ "LUYỆN ĐỀ CẤU TRÚC" trong Tu luyện (30/09) — Chromium thật, dữ liệu GIẢ (trang.tsx `?ld=`). Ba khổ: 390×844, 844×390, 1280×800.
//   npx vite build --config scripts/chup-tu-luyen/vite.config.mjs --outDir <tạm>
//   node scripts/chup-tu-luyen/chup-luyen-de.mjs <tạm> <thư mục ảnh>
// Ảnh JPG ≤ 150 KB; in thêm phép soát tràn ngang + đích chạm < 44 px cho từng màn.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup')
const RA = resolve(process.argv[3] ?? 'anh-luyen-de')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }
const may = createServer((req, res) => {
  const p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/chup-tu-luyen/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-tu-luyen/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })

async function chup(trang, ten) {
  for (const q of [72, 60, 50, 40, 32, 25]) {
    const buf = await trang.screenshot({ type: 'jpeg', quality: q })
    if (buf.length <= 150 * 1024 || q === 25) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}
/** Tràn ngang + đích chạm < 44 px (trừ ô số câu 32–38 px của thanh nhảy câu — có chủ đích, cách nhau 6 px). */
async function soat(trang, ten) {
  const r = await trang.evaluate(() => {
    const tran = document.documentElement.scrollWidth > window.innerWidth + 1 || [...document.querySelectorAll('.ldct-toan')].some((e) => e.scrollWidth > e.clientWidth + 1)
    const nho = [...document.querySelectorAll('button, [role="tab"], select')]
      .filter((e) => {
        const b = e.getBoundingClientRect()
        return b.width > 0 && b.height > 0 && b.height < 44 && !e.classList.contains('ldct-dh-o')
      })
      .map((e) => (e.textContent || e.getAttribute('aria-label') || e.className).trim().slice(0, 30))
    return { tran, nho }
  })
  console.log(`  soát ${ten}: tràn ngang=${r.tran} · đích < 44px: ${r.nho.length ? r.nho.join(' | ') : 0}`)
}

for (const [w, hgt, nhan] of [[390, 844, '390x844'], [844, 390, '844x390'], [1280, 800, '1280x800']]) {
  for (const bien of ['', 'khoa']) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'vi-VN' })
    const trang = await ctx.newPage()
    trang.on('pageerror', (e) => console.error('LỖI TRANG', e.message))
    await trang.goto(`${goc}?man=tl&ld=${bien}`)
    await trang.waitForSelector('.tlu-the-phu-ldct')
    await trang.waitForTimeout(700)
    if (bien === 'khoa') {
      await trang.click('.tlu-the-phu-ldct')
      await trang.waitForSelector('.ldct-ly-do')
      await trang.waitForTimeout(400)
      await soat(trang, `khoa-${nhan}`)
      await chup(trang, `2b-the-khoa-ly-do-${nhan}`)
      await ctx.close()
      continue
    }
    await chup(trang, `1-tu-luyen-co-the-moi-${nhan}`)
    await trang.click('.tlu-the-phu-ldct')
    await trang.waitForSelector('.ldct-the')
    await trang.waitForTimeout(500)
    await soat(trang, `gioi-thieu-${nhan}`)
    await chup(trang, `2-gioi-thieu-de-${nhan}`)
    await trang.locator('#ldct-h-luot').scrollIntoViewIfNeeded()
    await trang.waitForTimeout(200)
    await chup(trang, `3-luot-gan-day-${nhan}`)
    await trang.click('.ldct-bat-dau .tlu-nut-chinh')
    await trang.waitForSelector('.ldct-cau')
    await trang.waitForTimeout(700)
    await soat(trang, `dang-lam-${nhan}`)
    await chup(trang, `4-dang-lam-${nhan}`)
    await trang.locator('.ldct-dh-phan').nth(1).locator('button').first().click()
    await trang.waitForTimeout(800)
    await chup(trang, `5-nhay-toi-phan-II-${nhan}`)
    await trang.click('.tlu-thanh-nop .tlu-nut-chinh')
    await trang.waitForTimeout(400)
    await chup(trang, `6-xac-nhan-nop-${nhan}`)
    await trang.getByRole('button', { name: 'Nộp bài' }).last().click()
    await trang.waitForSelector('.ldct-diem')
    await trang.waitForTimeout(600)
    await soat(trang, `ket-qua-${nhan}`)
    await chup(trang, `7-ket-qua-${nhan}`)
    await trang.evaluate(() => {
      const c = document.querySelector('.ldct-toan')
      const e = document.querySelectorAll('.ldct-toan .tlu-the-cau')[3]
      if (c && e) c.scrollTop = e.getBoundingClientRect().top + c.scrollTop - 16
    })
    await trang.waitForTimeout(300)
    await chup(trang, `8-xem-lai-dap-an-loi-giai-${nhan}`)
    await trang.click('.ldct-toan .tlu-hang-nut .tlu-nut-chinh').catch(() => {})
    await trang.waitForTimeout(300)
    await trang.getByRole('tab', { name: 'Tổng hợp' }).click()
    await trang.waitForSelector('#tlu-h-luyen-de')
    await trang.waitForTimeout(500)
    await chup(trang, `9-tong-hop-co-diem-luyen-de-${nhan}`)
    if (nhan === '390x844') {
      await trang.goto(`${goc}?man=tl&ld=gap`)
      await trang.waitForSelector('.tlu-the-phu-ldct')
      await trang.click('.tlu-the-phu-ldct')
      await trang.waitForSelector('.ldct-bat-dau .tlu-nut-chinh')
      await trang.click('.ldct-bat-dau .tlu-nut-chinh')
      await trang.waitForSelector('.ldct-dong-ho[data-gap="true"]')
      await trang.waitForTimeout(400)
      await chup(trang, `4b-dong-ho-do-duoi-5-phut-${nhan}`)
    }
    await ctx.close()
  }
}
await trinh.close()
may.close()
