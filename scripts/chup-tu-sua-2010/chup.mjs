#!/usr/bin/env node
// CHỤP ẢNH "VIỆC HÔM NAY" CỦA TỰ SỬA LỖI bằng Chromium THẬT (Playwright), component thật + dữ liệu GIẢ (trang.tsx). Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
//   npx vite build --config scripts/chup-tu-sua-2010/vite.config.mjs --outDir <tạm> && node scripts/chup-tu-sua-2010/chup.mjs <tạm> docs/ban-ve-tu-sua-2010/anh-that
// Soát TOÀN BỘ ma trận (Hôm nay · màn Tự sửa lỗi) × 4 trạng thái × 3 khổ (390×844 · 844×390 · 1440×900) × sáng/tối: lỗi trang · tràn ngang · đích chạm < 44 px trong khối mới.
// Thoát mã 1 nếu có vấn đề. Chỉ lưu ảnh của bộ chọn `LUU`.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-tu-sua')
const RA = resolve(process.argv[3] ?? 'docs/ban-ve-tu-sua-2010/anh-that')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-tu-sua-2010/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-tu-sua-2010/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })

const KHO = { doc: [390, 844, 2], ngang: [844, 390, 2], 'may-tinh': [1440, 900, 1] }
const TT = ['moi', 'gan', 'dang', 'xong']
// Ảnh được lưu: [màn, trạng thái, khổ, nền]
const LUU = new Set([
  ...TT.map((t) => `hom-nay|${t}|doc|sang`), 'hom-nay|moi|may-tinh|sang', 'hom-nay|dang|doc|toi', 'hom-nay|xong|may-tinh|toi',
  ...TT.map((t) => `man|${t}|doc|sang`), 'man|moi|ngang|sang', 'man|moi|may-tinh|sang', 'man|dang|may-tinh|toi', 'man|moi|doc|toi', 'man|xong|doc|toi',
])
const soat = []
for (const k of ['hom-nay', 'man']) for (const tt of TT) for (const [kho, [w, h, dpr]] of Object.entries(KHO)) for (const nen of ['sang', 'toi']) {
  const ten = `${k}-${tt}-${kho}-${nen}`
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: nen === 'toi' ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${goc}?k=${k}&tt=${tt}`)
  try { await t.waitForSelector(k === 'man' ? '.vh-man .vh-cau, .vh-man[data-tt="xong"]' : '.ht2-moi-sua[data-viec]', { timeout: 15000 }) } catch { soat.push(`${ten}: không thấy khối mới`) }
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(400)
  const kq = await t.evaluate((vung) => {
    const tran = document.documentElement.scrollWidth > innerWidth + 1
    const nho = [...document.querySelectorAll(`${vung} button`)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) }).map((e) => `${(e.textContent || '').trim().slice(0, 28)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`)
    return { tran, nho, co: !!document.querySelector(vung) }
  }, k === 'man' ? '.vh-man' : '.ht2-moi-sua[data-viec]')
  if (!kq.co) soat.push(`${ten}: thiếu khối mới`)
  if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (LUU.has(`${k}|${tt}|${kho}|${nen}`)) {
    if (k === 'hom-nay' && kho === 'doc') await t.setViewportSize({ width: w, height: 1500 }) // thanh dưới dính đáy không che thẻ
    const vung = k === 'hom-nay' && kho !== 'ngang' ? await t.$('.ht2-moi-sua[data-viec]') : null
    let q = 82, buf
    for (;;) { buf = vung && kho === 'doc' ? await vung.screenshot({ type: 'jpeg', quality: q }) : await t.screenshot({ type: 'jpeg', quality: q, fullPage: k === 'man' || kho === 'doc' }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
    writeFileSync(join(RA, `${ten}.jpg`), buf)
    console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  }
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · đủ khối mới ở 48 tổ hợp')
process.exit(soat.length ? 1 : 0)
