#!/usr/bin/env node
// CHỤP ẢNH OMNI 3 bằng Chromium THẬT (Playwright), dữ liệu GIẢ (trang.tsx thay `fetch`; mọi yêu cầu ra ngoài máy cục bộ bị CHẶN).
//   npx vite build --config scripts/chup-omni-3/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-omni-3/chup.mjs <thư mục tạm> <thư mục ảnh> [man1,man2,…]
// Khổ: học sinh + phụ huynh 390×844 (điện thoại dọc), thầy 1440×900. Ảnh JPG, tự hạ chất lượng tới khi ≤ 150 KB.
// In ra: lỗi trang, tràn ngang (px) từng ảnh. Thoát mã 1 nếu có lỗi trang hoặc tràn ngang.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-omni')
const RA = resolve(process.argv[3] ?? 'anh-omni-3')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => {
  const p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/chup-omni-3/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const trangGoc = `${goc}/scripts/chup-omni-3/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

const loiTrang = []
const tran = []
async function chup(trang, ten, fullPage = false) {
  const t = await trang.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  if (t > 0) tran.push(`${ten}: ${t}px`)
  for (const q of [72, 60, 50, 40, 32, 25]) {
    const buf = await trang.screenshot({ type: 'jpeg', quality: q, fullPage })
    if (buf.length <= 150 * 1024 || q === 25) {
      writeFileSync(join(RA, `${ten}.jpg`), buf)
      console.log(`${ten}.jpg ${(buf.length / 1024).toFixed(0)} KB (q${q}) · tràn ngang ${t}px`)
      return
    }
  }
}

/** Mỗi màn: [tên, khổ, hàm chạy]. Hàm nhận trang đã mở `?man=<tên>`. */
const MAN = [
  ['sanh', [390, 844], async (t) => {
    await t.waitForSelector('text=Tu luyện', { timeout: 20000 })
    await t.waitForTimeout(1500)
    await chup(t, 'hs-sanh-390')
    await chup(t, 'hs-sanh-ca-trang-390', true)
  }],
  ['sanh-cho', [390, 844], async (t) => {
    await t.waitForSelector('text=Tu luyện', { timeout: 20000 })
    await t.waitForTimeout(1500)
    await chup(t, 'hs-sanh-cho-bai-moi-ca-trang-390', true)
  }],
  ['ph', [390, 844], async (t) => {
    await t.waitForSelector('[data-vung="chien-dich"]', { timeout: 30000 })
    await t.waitForTimeout(800)
    await t.locator('[data-vung="chien-dich"]').scrollIntoViewIfNeeded()
    await t.waitForTimeout(300)
    await chup(t, 'ph-chien-dich-cua-con-390')
    await chup(t, 'ph-hom-nay-ca-trang-390', true)
  }],
]

for (const [ten, [w, hgt], chay] of MAN) {
  if (CHON.length && !CHON.includes(ten)) continue
  const ctx = await trinh.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', serviceWorkers: 'block' })
  // Chặn cứng mọi yêu cầu ra ngoài máy cục bộ (trang.tsx đã thay fetch; đây là lưới an toàn thứ hai).
  await ctx.route('**/*', (r) => (new URL(r.request().url()).origin === goc || r.request().url().startsWith('data:') ? r.continue() : r.abort()))
  const trang = await ctx.newPage()
  trang.on('pageerror', (e) => loiTrang.push(`${ten}: ${e.message.slice(0, 200)}`))
  await trang.goto(`${trangGoc}?man=${ten}&vai=phuhuynh`)
  try {
    await chay(trang)
  } catch (e) {
    loiTrang.push(`${ten}: ${String(e?.message ?? e).slice(0, 200)}`)
    await chup(trang, `LOI-${ten}`)
  }
  await ctx.close()
}
await trinh.close()
may.close()
console.log(`lỗi trang: ${loiTrang.length}${loiTrang.length ? '\n  ' + loiTrang.join('\n  ') : ''}`)
console.log(`tràn ngang: ${tran.length}${tran.length ? '\n  ' + tran.join('\n  ') : ''}`)
process.exit(loiTrang.length || tran.length ? 1 : 0)
