#!/usr/bin/env node
// CHỤP ẢNH MÀN THẬT HÀNH TRÌNH 4 BƯỚC + HỘP BỔ SUNG BÀI (21/10) bằng Chromium THẬT, component thật + máy chủ GIẢ (trang.tsx). JPG tự hạ chất lượng ≤ 150 KB.
//   npx vite build --config scripts/chup-hanh-trinh-2110/vite.config.mjs --outDir <tạm> && node scripts/chup-hanh-trinh-2110/chup.mjs <tạm> docs/ban-ve-hanh-trinh-2110/anh-that
// Soát TOÀN BỘ ma trận (6 khung × 3 khổ × sáng/tối): lỗi trang · tràn ngang · đích chạm < 44 px. Thoát mã 1 nếu có vấn đề. Chỉ lưu ảnh của `LUU`.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-hanh-trinh')
const RA = resolve(process.argv[3] ?? 'docs/ban-ve-hanh-trinh-2110/anh-that')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/chup-hanh-trinh-2110/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-hanh-trinh-2110/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })

const KHO = { doc: [390, 844, 1.5], ngang: [844, 390, 1], 'may-tinh': [1440, 900, 1] }
// [tên khung, tham số, bộ chọn chờ]
const KHUNG = [
  ['chua-mo', 'k=ht&chua=1', '[data-buoc-ht="1"][data-mo="true"]'],
  ['b1-diem-danh', 'k=ht&mo=1', '[data-buoc-ht="1"][data-mo="true"] .dd1-thanh, [data-buoc-ht="1"][data-mo="true"] .dh-buoc'],
  ['b2-dau-gio', 'k=ht&mo=2', '[data-buoc-ht="2"][data-mo="true"] .gvv2-dg-the'],
  ['b3-day-hoc', 'k=ht&mo=3', '[data-buoc-ht="3"][data-mo="true"] .dh-buoc'],
  ['b4-chua-cau', 'k=ht&mo=4', '[data-buoc-ht="4"][data-mo="true"] .gvv2-cb'],
  ['hop-bo-sung', 'k=hop', '[data-khoi="hop-bo-sung-bai"] .bhn'],
]
const LUU = new Set(['chua-mo|doc|sang', 'b1-diem-danh|may-tinh|toi', 'b1-diem-danh|doc|sang', 'b2-dau-gio|may-tinh|toi', 'b3-day-hoc|may-tinh|toi', 'b3-day-hoc|doc|sang', 'b3-day-hoc|ngang|toi', 'b4-chua-cau|may-tinh|toi', 'b4-chua-cau|doc|toi', 'hop-bo-sung|may-tinh|toi', 'hop-bo-sung|may-tinh|sang', 'hop-bo-sung|doc|sang'])
const soat = []
for (const [k, thamSo, cho] of KHUNG) for (const [kho, [w, h, dpr]] of Object.entries(KHO)) for (const nen of ['sang', 'toi']) {
  const ten = `${k}-${kho}-${nen}`
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: nen === 'toi' ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${goc}?${thamSo}`)
  try { await t.waitForSelector(cho, { timeout: 15000 }) } catch { soat.push(`${ten}: không thấy ${cho}`) }
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(500)
  const kq = await t.evaluate(() => {
    const tran = document.documentElement.scrollWidth > innerWidth + 1
    const vung = document.querySelector('[data-khoi="hop-bo-sung-bai"]') ?? document.querySelector('.gvv2')
    const nho = [...(vung?.querySelectorAll('button, a, summary, select') ?? [])].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) && !e.closest('.sr-only') }).map((e) => `${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho }
  })
  if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (LUU.has(`${k}|${kho}|${nen}`)) {
    // Ảnh cả trang: thước dính để tĩnh cho khỏi lơ lửng giữa ảnh.
    await t.addStyleTag({ content: '.gvv2-ht-thuoc{position:static!important}' })
    const hop = k === 'hop-bo-sung'
    let q = 82, buf
    for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: !hop }); if (buf.length <= 150_000 || q <= 22) break; q -= 6 }
    writeFileSync(join(RA, `${ten}.jpg`), buf)
    console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  }
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ')
process.exit(soat.length ? 1 : 0)
