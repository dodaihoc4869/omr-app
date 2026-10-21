#!/usr/bin/env node
// CHỤP ẢNH TỜ CHIẾU THẬT có Mức làm 1–4 (thầy 21/10) bằng Chromium THẬT: nút X "Ai đã sai?" hai thẻ (4 kịch bản) và bảng chi tiết em gọi lên bảng (2 kịch bản), 1920×1080 và 1280×720 (tờ chiếu luôn nền tối).
//   npx vite build --config scripts/chup-muc-lam-2110/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-muc-lam-2110/chup-chieu.mjs <thư mục tạm> [thư mục ảnh = docs/anh-muc-lam-chieu-2110]
// Soát: lỗi trang · tràn ngang · đích chạm < 44 px · NỘI DUNG BỊ CẮT (thẻ cuộn được = có phần bị che) · tên bị cắt bằng "…" (đếm). JPG tự hạ chất lượng tới ≤ 150 KB.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-muc-lam')
const RA = resolve(process.argv[3] ?? 'docs/anh-muc-lam-chieu-2110')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-muc-lam-2110/trang-chieu.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
const KICH = [
  ['ai-sai', 'X', 'thuong', 'x'],
  ['ai-sai-dong-em', 'X', 'dong', 'x'],
  ['ai-sai-ngay-dau', 'X', 'ngay-dau', 'x'],
  ['ai-sai-chua-diem-danh', 'X', 'chua-diem-danh', 'x'],
  ['chi-tiet-em', 'EM', 'em', ''],
  ['chi-tiet-em-chua-do', 'EM', 'em-chua-do', ''],
]
const KHO = [['1920', 1920, 1080], ['1280', 1280, 720]]
for (const [ten, loai, kich] of KICH) {
  for (const [kho, w, h] of KHO) {
    const nhan = `${ten}-${kho}`
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce', locale: 'vi-VN' })
    await ctx.route((u) => !u.href.startsWith(goc) && !u.href.startsWith('about:') && !u.href.startsWith('data:') && !u.href.startsWith('blob:'), (r) => r.abort())
    const t = await ctx.newPage()
    t.setDefaultTimeout(10000)
    t.on('pageerror', (e) => soat.push(`${nhan}: lỗi trang ${e.message}`))
    await t.goto(`${goc}/scripts/chup-muc-lam-2110/trang-chieu.html?kich=${kich}`)
    const kh = t.frameLocator('iframe')
    try {
      await kh.locator('body.mc-noi').waitFor({ timeout: 15000 })
      await t.waitForTimeout(300)
      // Phím gửi thẳng vào tài liệu của tờ (nghe ở `document`): bàn phím Playwright chỉ tới khung ngoài khi chưa bấm vào tờ.
      const phim = (key) => t.frames().find((x) => x !== t.mainFrame()).evaluate((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })), key)
      if (loai === 'X') {
        await phim('x')
        await kh.locator('.mc-ai-the').first().waitFor({ timeout: 10000 })
      } else {
        await phim('l')
        await kh.locator('.mc-em[id]').first().click()
        await kh.locator('.mc-cau-nay').waitFor({ timeout: 10000 })
      }
    } catch (e) {
      soat.push(`${nhan}: không mở được bảng (${String(e.message).split('\n')[0]})`)
    }
    await t.waitForTimeout(700)
    const f = t.frames().find((x) => x !== t.mainFrame())
    const kq = await f.evaluate(() => {
      const tran = document.documentElement.scrollWidth > innerWidth + 1
      const nho = [...document.querySelectorAll('.mc-aisai button, .mc-ct button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) }).length
      const cuon = [...document.querySelectorAll('.mc-ai-the, .mc-the-ct, .mc-cau-nay, .mc-lan-ds, .mc-aisai, .mc-ct')].filter((e) => e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).display !== 'none').map((e) => `${e.className.split(' ')[0]} ${e.scrollHeight}>${e.clientHeight}`)
      const ngoai = [...document.querySelectorAll('.mc-aisai *, .mc-ct *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1) && !e.closest('.mc-ai-the, .mc-ct-luoi > *, .mc-lan-ds') }).length
      const rutGon = [...document.querySelectorAll('.mc-pl b')].filter((b) => b.scrollWidth > b.clientWidth + 1).length
      return { tran, nho, cuon, ngoai, rutGon }
    })
    if (kq.tran) soat.push(`${nhan}: TRÀN NGANG`)
    if (kq.nho) soat.push(`${nhan}: ${kq.nho} đích chạm nhỏ`)
    if (kq.cuon.length) soat.push(`${nhan}: BỊ CẮT/CUỘN ${kq.cuon.join(' | ')}`)
    if (kq.ngoai) soat.push(`${nhan}: ${kq.ngoai} phần tử lọt ngoài khung`)
    if (kq.rutGon) soat.push(`${nhan}: ${kq.rutGon} tên bị cắt bằng "…" dù đã viết tắt`)
    let q = 82, buf
    for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 22) break; q -= 6 }
    writeFileSync(join(RA, `${nhan}.jpg`), buf)
    console.log(`${nhan}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
    await ctx.close()
  }
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · 0 khung bị cắt · 0 tên bị cắt')
process.exit(soat.length ? 1 : 0)
