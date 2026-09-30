#!/usr/bin/env node
// CHỤP ẢNH TU LUYỆN NGANG + MÁY TÍNH (30/09, thầy: "mục tu luyện tất cả các thẻ các lớp phải có giao diện xoay ngang và máy tính") — Chromium thật,
// dữ liệu GIẢ (trang.tsx). Năm khổ: 1440×900, 1280×800 (máy tính), 844×390, 932×430 (điện thoại ngang), 390×844 (dọc — chứng minh không vỡ).
//   npx vite build --config scripts/chup-tu-luyen/vite.config.mjs --outDir <tạm>
//   node scripts/chup-tu-luyen/chup-ngang.mjs <tạm> <thư mục ảnh> <tiền tố: truoc|sau>
// Ảnh JPG ≤ 150 KB; in phép soát tràn ngang + đích chạm < 44 px từng màn.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup')
const RA = resolve(process.argv[3] ?? 'anh-tu-luyen-ngang')
const TIEN_TO = process.argv[4] ?? 'sau'
const CHI = process.argv[5] ?? '' // lọc khổ, ví dụ "1440"
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
      writeFileSync(join(RA, `${TIEN_TO}-${ten}.jpg`), buf)
      console.log(`${TIEN_TO}-${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q})`)
      return
    }
  }
}
async function soat(trang, ten) {
  const r = await trang.evaluate(() => {
    const tran = document.documentElement.scrollWidth > window.innerWidth + 1 || [...document.querySelectorAll('.ldct-toan, .tlu-lam-de, .tlu-lam-ben')].some((e) => e.scrollWidth > e.clientWidth + 1)
    const nho = [...document.querySelectorAll('button, [role="tab"], select')]
      .filter((e) => {
        const b = e.getBoundingClientRect()
        const st = getComputedStyle(e)
        return b.width > 0 && b.height > 0 && st.visibility !== 'hidden' && b.height < 44 && !e.closest('svg') && !e.classList.contains('ldct-dh-o') && !e.classList.contains('tlu-bc-so')
      })
      .map((e) => (e.textContent || e.getAttribute('aria-label') || e.className).trim().slice(0, 24))
    return { tran, nho }
  })
  console.log(`  soát ${ten}: tràn ngang=${r.tran} · đích < 44px: ${r.nho.length ? r.nho.join(' | ') : 0}`)
}
const nutNop = (trang) => trang.locator('button:visible', { hasText: /^Nộp bài$/ }).first()

const KHO = [[1440, 900, '1440x900'], [1280, 800, '1280x800'], [844, 390, '844x390'], [932, 430, '932x430'], [390, 844, '390x844']].filter((k) => !CHI || k[2].startsWith(CHI))
for (const [w, hgt, nhan] of KHO) {
  const dt = w < 1000
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'vi-VN', hasTouch: dt })
  const trang = await ctx.newPage()
  trang.on('pageerror', (e) => console.error('LỖI TRANG', e.message))
  // 1. Màn chọn
  await trang.goto(`${goc}?man=tl`)
  await trang.waitForSelector('.tlu-the-che-do')
  await trang.waitForTimeout(700)
  await soat(trang, `chon-${nhan}`)
  await chup(trang, `01-chon-${nhan}`)
  // 2. Cài đặt chế độ 1 + chế độ 3
  await trang.click('.tlu-the-che-do[data-che-do="1"]')
  await trang.waitForSelector('.tlu-cau-hinh')
  await trang.waitForTimeout(500)
  await trang.locator('.tlu-cau-hinh').scrollIntoViewIfNeeded()
  await trang.waitForTimeout(200)
  await soat(trang, `cai-dat-1-${nhan}`)
  await chup(trang, `02-cai-dat-sua-cau-sai-${nhan}`)
  await trang.click('.tlu-the-che-do[data-che-do="3"]')
  await trang.waitForTimeout(800)
  await trang.locator('.tlu-cau-hinh').scrollIntoViewIfNeeded()
  await trang.waitForTimeout(200)
  await chup(trang, `03-cai-dat-dang-bai-${nhan}`)
  // 3. Đang làm (chế độ 1 — câu có nhãn lần luyện + sai gốc)
  await trang.click('.tlu-the-che-do[data-che-do="1"]')
  await trang.waitForTimeout(400)
  await trang.locator('.tlu-cau-hinh .tlu-nut-chinh').click()
  await trang.waitForSelector('.tlu-the-cau')
  await trang.waitForTimeout(600)
  const pa = trang.locator('.tlu-the-cau').first().locator('.pa-noi-dung').first()
  if (await pa.count()) await pa.click().catch(() => {})
  await trang.waitForTimeout(300)
  await soat(trang, `dang-lam-${nhan}`)
  await chup(trang, `04-dang-lam-${nhan}`)
  // 4. Nộp ⇒ xác nhận ⇒ kết quả
  await nutNop(trang).click()
  await trang.waitForTimeout(400)
  await chup(trang, `05-xac-nhan-nop-${nhan}`)
  await trang.getByRole('button', { name: 'Nộp bài' }).last().click()
  await trang.waitForSelector('.tlu-diem')
  await trang.waitForTimeout(600)
  await soat(trang, `ket-qua-${nhan}`)
  await chup(trang, `06-ket-qua-${nhan}`)
  await trang.locator('.tlu-the-cau').nth(2).scrollIntoViewIfNeeded()
  await trang.waitForTimeout(300)
  await chup(trang, `07-xem-lai-dap-an-${nhan}`)
  // 5. Tổng hợp
  await trang.getByRole('button', { name: 'Xem tổng hợp' }).first().click()
  await trang.waitForSelector('.tlu-hero')
  await trang.waitForTimeout(700)
  await soat(trang, `tong-hop-${nhan}`)
  await chup(trang, `08-tong-hop-${nhan}`)
  await trang.locator('#tlu-h-gan').scrollIntoViewIfNeeded()
  await trang.waitForTimeout(300)
  await chup(trang, `09-tong-hop-luot-gan-day-${nhan}`)
  // 6. Luyện đề cấu trúc
  await trang.goto(`${goc}?man=tl`)
  await trang.waitForSelector('.tlu-the-phu-ldct')
  await trang.waitForTimeout(500)
  await trang.click('.tlu-the-phu-ldct')
  await trang.waitForSelector('.ldct-the')
  await trang.waitForTimeout(600)
  await soat(trang, `ld-gioi-thieu-${nhan}`)
  await chup(trang, `10-luyen-de-gioi-thieu-${nhan}`)
  await trang.click('.ldct-bat-dau .tlu-nut-chinh')
  await trang.waitForSelector('.ldct-cau')
  await trang.waitForTimeout(800)
  await soat(trang, `ld-dang-lam-${nhan}`)
  await chup(trang, `11-luyen-de-dang-lam-${nhan}`)
  await nutNop(trang).click()
  await trang.waitForTimeout(400)
  await chup(trang, `12-luyen-de-xac-nhan-${nhan}`)
  await trang.getByRole('button', { name: 'Nộp bài' }).last().click()
  await trang.waitForSelector('.ldct-diem')
  await trang.waitForTimeout(700)
  await soat(trang, `ld-ket-qua-${nhan}`)
  await chup(trang, `13-luyen-de-ket-qua-${nhan}`)
  // 7. Thẻ khoá
  await trang.goto(`${goc}?man=tl&ld=khoa`)
  await trang.waitForSelector('.tlu-the-phu-ldct')
  await trang.waitForTimeout(500)
  await trang.click('.tlu-the-phu-ldct')
  await trang.waitForSelector('.ldct-ly-do')
  await trang.waitForTimeout(400)
  await chup(trang, `14-luyen-de-khoa-${nhan}`)
  await ctx.close()
}
await trinh.close()
may.close()
