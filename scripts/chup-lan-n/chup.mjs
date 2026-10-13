#!/usr/bin/env node
// CHỤP ẢNH ĐỢT 19 · LÀN N bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx). Mỗi ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
//   npx vite build --config scripts/chup-lan-n/vite.config.mjs --outDir <tạm> && node scripts/chup-lan-n/chup.mjs <tạm> docs/anh-dot19
// Ngoài ảnh: SOÁT 3 tab (Hôm nay · Hành trình · Ôn & sửa) × 3 khổ (390×844 · 844×390 · 1440×900) × sáng/tối × có/không tầng — lỗi trang, tràn ngang,
// đích chạm < 44 px trong phần làn N, nút "Học tiếp" thấy ở màn đầu (ngang) và ≤ 360 px (máy tính), không còn chữ "Chưa có danh sách bài" /
// chú giải màu. Thoát mã 1 nếu có vấn đề.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-lan-n')
const RA = resolve(process.argv[3] ?? 'docs/anh-dot19')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-lan-n/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-lan-n/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })

/** Tab: nút menu cần bấm · phần tử chờ. */
const TAB = {
  'hom-nay': { cho: '.ht2-moi-sua .bt64' },
  'hanh-trinh': { bam: 'Hành trình', cho: '.htn-thang .bt64' },
  'on-lai': { bam: 'Ôn & sửa', cho: '.htn-sua .bt64' },
}
// [tên ảnh, tab, rộng, cao, nền, kiểu chụp: 'trang' (cả trang) | 'khung' (khung nhìn) | 'the' (vùng thẻ mời), tham số]
const ANH = [
  ['hanh-trinh-doc', 'hanh-trinh', 390, 844, 'light', 'trang', ''],
  ['hanh-trinh-ngang', 'hanh-trinh', 844, 390, 'light', 'khung', ''],
  ['hanh-trinh-may-tinh', 'hanh-trinh', 1440, 900, 'light', 'khung', ''],
  // Đúng cảnh ảnh thầy (một bài, máy chủ đang chạy CHƯA gửi tầng): lỗi "Chưa có danh sách bài." đã hết ngay cả trước khi đẩy máy chủ.
  ['hanh-trinh-may-tinh-chua-tang', 'hanh-trinh', 1440, 900, 'light', 'khung', 'tang=0&mot=1'],
  ['on-sua-may-tinh', 'on-lai', 1440, 900, 'dark', 'khung', ''],
  ['on-sua-doc', 'on-lai', 390, 844, 'light', 'trang', ''],
  ['tu-sua-loi-the', 'hom-nay', 390, 844, 'light', 'the', ''],
]
const KHO = [[390, 844], [844, 390], [1440, 900]]
const loi = []

async function mo(tab, w, hgt, nen, ts = '', tiLe = 1) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: tiLe, colorScheme: nen, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loi.push(`${tab} ${w}×${hgt} ${nen}${ts}: lỗi trang ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await t.goto(`${goc}${ts ? `?${ts}` : ''}`)
  await t.locator('.ht2-hn').first().waitFor({ timeout: 20000 })
  if (TAB[tab].bam) await t.locator('.ht-menu button', { hasText: TAB[tab].bam }).first().click()
  try {
    await t.locator(TAB[tab].cho).first().waitFor({ timeout: 20000 })
  } catch {
    loi.push(`${tab} ${w}×${hgt} ${nen}${ts}: KHÔNG hiện ${TAB[tab].cho}`)
  }
  await t.waitForTimeout(900)
  return { ctx, t }
}

async function soat(t, tab, nhan) {
  const tr = await t.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (tr > 0) loi.push(`${nhan}: tràn ngang ${tr}px`)
  const nho = await t.evaluate(() =>
    [...document.querySelectorAll('.htn-ht button, .htn-os button, .ht2-moi-sua button, .ht2-nhom button')].map((b) => b.getBoundingClientRect()).filter((r) => r.width > 0 && r.height < 44).length)
  if (nho) loi.push(`${nhan}: ${nho} đích chạm dưới 44 px`)
  const chu = await t.evaluate(() => document.body.innerText)
  if (/Chưa có danh sách bài|Vàng trầm/.test(chu)) loi.push(`${nhan}: còn chữ cũ (Chưa có danh sách bài / chú giải màu)`)
  if (tab === 'hanh-trinh') {
    const n = await t.evaluate(() => { const r = document.querySelector('.htn-nut')?.getBoundingClientRect(); return r ? { w: r.width, day: r.bottom, h: r.height } : null })
    if (!n) loi.push(`${nhan}: không thấy nút Học tiếp`)
    else {
      const [vw, vh] = await t.evaluate(() => [innerWidth, innerHeight])
      if (vw > 700 && n.w > 361) loi.push(`${nhan}: nút Học tiếp rộng ${n.w}px (> 360)`)
      if (n.h < 44) loi.push(`${nhan}: nút Học tiếp cao ${n.h}px`)
      if (vh < 551 && n.day > vh) loi.push(`${nhan}: nút Học tiếp ngoài màn đầu (đáy ${n.day} > ${vh})`)
    }
    const bai = await t.locator('article.htn-bai').count()
    if (!bai) loi.push(`${nhan}: không có thẻ bài`)
  }
  if (tab === 'on-lai') {
    const so = await t.locator('.htn-os button').count()
    if (so !== 4) loi.push(`${nhan}: Ôn & sửa có ${so} thẻ (cần 4)`)
  }
  return tr
}

for (const [ten, tab, w, hgt, nen, kieu, ts] of ANH) {
  const { ctx, t } = await mo(tab, w, hgt, nen, ts, kieu === 'the' ? 2 : 1)
  const tr = await soat(t, tab, ten)
  let opt = {}
  if (kieu === 'trang') {
    const cao = await t.evaluate(() => document.documentElement.scrollHeight)
    await t.setViewportSize({ width: w, height: Math.min(Math.max(hgt, cao), 2600) })
    await t.waitForTimeout(400)
  } else if (kieu === 'the') {
    const the = t.locator('.ht2-moi-sua').first()
    await the.scrollIntoViewIfNeeded()
    await t.waitForTimeout(700)
    const hop = await the.boundingBox()
    if (hop) opt = { clip: { x: 0, y: Math.max(0, hop.y - 16), width: w, height: hop.height + 32 } }
  }
  for (const q of [80, 72, 62, 52, 44, 36, 28, 22, 16]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q, ...opt })
    if (buf.length <= 150 * 1024 || q === 16) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q}) · tràn ngang ${tr}px`)
      break
    }
  }
  await ctx.close()
}

// Soát 3 tab × 3 khổ × sáng/tối × (có tầng | máy chủ chưa gửi tầng) — không lưu ảnh.
let soLan = 0
for (const tab of Object.keys(TAB))
  for (const [w, hgt] of KHO)
    for (const nen of ['light', 'dark'])
      for (const ts of tab === 'hanh-trinh' ? ['', 'tang=0', 'tang=0&mot=1'] : ['']) {
        const { ctx, t } = await mo(tab, w, hgt, nen, ts)
        await soat(t, tab, `${tab} ${w}×${hgt} ${nen} ${ts}`)
        soLan++
        await ctx.close()
      }

await trinh.close()
may.close()
console.log(`\nĐã soát ${soLan} lượt. Vấn đề: ${loi.length}`)
for (const l of loi) console.log('  ' + l)
process.exit(loi.length ? 1 : 0)
