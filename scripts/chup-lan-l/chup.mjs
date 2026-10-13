#!/usr/bin/env node
// CHỤP ẢNH ĐỢT 18 · LÀN L bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx). Mỗi ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
//   npx vite build --config scripts/chup-lan-l/vite.config.mjs --outDir <tạm> && node scripts/chup-lan-l/chup.mjs <tạm> docs/anh-dot18
// Ngoài 4 ảnh: SOÁT mỗi cảnh ở 3 khổ (390×844 · 844×390 · 1440×900) × sáng/tối — lỗi trang, tràn ngang (px), phần bậc có hiện, nút trong phần bậc
// < 44 px. Thoát mã 1 nếu có lỗi trang, tràn ngang, phần bậc không hiện hoặc nút nhỏ.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-lan-l')
const RA = resolve(process.argv[3] ?? 'docs/anh-dot18')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-lan-l/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-lan-l/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })

/** Cảnh: phần tử chờ (phần bậc đã hiện) · việc trước khi chụp. */
const CANH = {
  hs: { cho: '.ht2-hn .bcc-thang' },
  gv: { cho: '.nht-bac .bcc-dem', bam: 'Theo bậc' },
  ph: { cho: '.ph3-nhip .bcc-thang' },
  chieu: { cho: '.ddc-bac .bcc-dem' },
}
// [tên ảnh, cảnh, rộng, cao, nền, kiểu chụp: 'trang' (cả trang) | 'khung' (khung nhìn) | 'the' (vùng thẻ Nhịp học của con)]
const ANH = [
  ['lan-l-hs-hom-nay-doc', 'hs', 390, 844, 'light', 'trang'],
  ['lan-l-gv-nhip-may-tinh', 'gv', 1440, 900, 'light', 'trang'],
  ['lan-l-ph-ngang-toi', 'ph', 844, 390, 'dark', 'the'],
  ['lan-l-man-chieu', 'chieu', 1440, 900, 'light', 'khung'],
]
const KHO = [[390, 844], [844, 390], [1440, 900]]
const loi = []

async function mo(canh, w, hgt, nen) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: nen, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loi.push(`${canh} ${w}×${hgt} ${nen}: lỗi trang ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await t.goto(`${goc}?man=${canh}`)
  try {
    await t.locator(CANH[canh].cho).first().waitFor({ timeout: 20000 })
  } catch {
    loi.push(`${canh} ${w}×${hgt} ${nen}: phần bậc KHÔNG hiện (${CANH[canh].cho})`)
  }
  if (CANH[canh].bam) await t.getByRole('radio', { name: CANH[canh].bam }).click()
  await t.waitForTimeout(700)
  return { ctx, t }
}

async function soat(t, nhan) {
  const tr = await t.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (tr > 0) loi.push(`${nhan}: tràn ngang ${tr}px`)
  // nút trong phần bậc (cách xếp) phải ≥ 44 px
  const nho = await t.evaluate(() =>
    [...document.querySelectorAll('.nht-bac button')].map((b) => b.getBoundingClientRect()).filter((r) => r.width > 0 && (r.height < 44 || r.width < 44)).length)
  if (nho) loi.push(`${nhan}: ${nho} nút trong phần bậc dưới 44 px`)
  // chip / ô bậc không tràn khỏi khung nhìn
  const vuot = await t.evaluate(() => [...document.querySelectorAll('.bcc-chip, .bcc-thang, .bcc-dem')].filter((x) => x.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length)
  if (vuot) loi.push(`${nhan}: ${vuot} phần bậc vượt mép phải`)
  return tr
}

for (const [ten, canh, w, hgt, nen, kieu] of ANH) {
  const { ctx, t } = await mo(canh, w, hgt, nen)
  const tr = await soat(t, ten)
  let opt = {}
  if (kieu === 'trang') {
    const cao = await t.evaluate(() => document.documentElement.scrollHeight)
    await t.setViewportSize({ width: w, height: Math.min(Math.max(hgt, cao), 2600) })
    await t.waitForTimeout(400)
  } else if (kieu === 'the') {
    const the = t.locator('.ph3-nhip').first()
    await the.scrollIntoViewIfNeeded()
    const hop = await the.boundingBox()
    const cuon = await t.evaluate(() => window.scrollY)
    if (hop) opt = { fullPage: true, clip: { x: 0, y: Math.max(0, hop.y + cuon - 12), width: w, height: Math.min(hop.height + 24, 900) } }
  }
  for (const q of [72, 62, 52, 44, 36, 28, 22, 16]) {
    const buf = await t.screenshot({ type: 'jpeg', quality: q, ...opt })
    if (buf.length <= 150 * 1024 || q === 16) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q}) · tràn ngang ${tr}px`)
      break
    }
  }
  await ctx.close()
}

// Soát 4 cảnh × 3 khổ × sáng/tối (không lưu ảnh).
let soLan = 0
for (const canh of Object.keys(CANH))
  for (const [w, hgt] of KHO)
    for (const nen of ['light', 'dark']) {
      const { ctx, t } = await mo(canh, w, hgt, nen)
      await soat(t, `${canh} ${w}×${hgt} ${nen}`)
      soLan++
      await ctx.close()
    }

await trinh.close()
may.close()
console.log(`\nĐã soát ${soLan} lượt (4 cảnh × 3 khổ × sáng/tối). Vấn đề: ${loi.length}`)
for (const l of loi) console.log('  ' + l)
process.exit(loi.length ? 1 : 0)
