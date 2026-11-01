#!/usr/bin/env node
// CHỤP BẢN VẼ «CHIẾU CHỮA BÀI SAU CA» (01/11) bằng Chromium THẬT (/opt/pw-browsers/chromium). Cần `npm run build` trước (lấy CSS thật của app ở dist/).
//   node docs/ban-ve-chieu-chua-ca-0111/chup.mjs
// App thầy: màn «Ca đã kết thúc» THẬT (KetThucCa) + nút mới — 390 dọc · 844 ngang · 1440 máy tính × sáng/tối; ba trạng thái phụ ở 390.
// Màn chiếu: tờ chiếu THẬT (`taoHtmlMayChieu`) + nguyên mẫu thẻ tên — 1920×1080 · 1280×720, nền mặc định và nền tối của máy chiếu.
// Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB. Soát: lỗi trang · tràn ngang · đích bấm < 44 px.
import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'

const GOC = resolve(import.meta.dirname, '../..')
const VE = resolve(import.meta.dirname)
const RA = join(VE, 'anh')
const TAM = join(tmpdir(), 've-chieu-chua-ca')
mkdirSync(RA, { recursive: true }); mkdirSync(TAM, { recursive: true })
const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')
const esb = join(GOC, 'node_modules/.bin/esbuild')

// 1) Tờ chiếu thật + nguyên mẫu.
execFileSync(esb, [join(VE, 'to-chieu.ts'), '--bundle', '--platform=node', '--format=esm', `--outfile=${join(TAM, 'to.mjs')}`, '--log-level=warning', '--loader:.css=empty'])
execFileSync('node', [join(TAM, 'to.mjs'), join(TAM, 'to-goc.html')])
writeFileSync(join(TAM, 'to.html'), readFileSync(join(TAM, 'to-goc.html'), 'utf8').replace('</body>', `<script>${readFileSync(join(VE, 'nguyen-mau.js'), 'utf8')}</script></body>`))

// 2) Màn app thầy.
execFileSync(esb, [join(VE, 'ket-thuc-ca.tsx'), '--bundle', '--format=esm', '--jsx=automatic', `--outfile=${join(TAM, 'ktc.js')}`, '--log-level=warning', '--loader:.css=empty', '--define:process.env.NODE_ENV="production"'])
const css = readdirSync(join(GOC, 'dist/assets')).filter((f) => f.endsWith('.css')).map((f) => `<link rel="stylesheet" href="/assets/${f}">`).join('')
writeFileSync(join(TAM, 'ktc.html'), `<!doctype html><html lang="vi" data-trong="gv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}<link rel="stylesheet" href="/goc/src/styles/trong-gv.css"><style>.ve-chieu{display:flex;flex-direction:column;gap:4px;align-items:flex-end}.ve-chieu .ct-ghi{font-size:13px}@media (max-width:640px){.ve-chieu{align-items:stretch;width:100%;order:-1}.ve-chieu .ct-nut{width:100%;justify-content:center}}</style></head><body><div id="goc"></div><script type="module" src="/tam/ktc.js"></script></body></html>`)

const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png' }
const may = createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = u.startsWith('/assets/') ? join(GOC, 'dist', u) : u.startsWith('/tam/') ? join(TAM, u.slice(5)) : u.startsWith('/goc/') ? join(GOC, u.slice(5)) : ''
  if (!p || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const GOC_URL = `http://127.0.0.1:${may.address().port}`
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const soat = []

async function chup(t, ten, { full = true, kiem = true } = {}) {
  if (kiem) {
    const kq = await t.evaluate(() => ({
      tran: document.documentElement.scrollWidth > innerWidth + 1,
      nho: [...document.querySelectorAll('button, a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) && getComputedStyle(e).visibility !== 'hidden' }).map((e) => e.textContent.trim().slice(0, 30)),
    }))
    if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
    if (kq.nho.length) soat.push(`${ten}: đích bấm nhỏ ${kq.nho.join(' | ')}`)
  }
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: full }); if (buf.length <= 150_000 || q <= 30) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}

// App thầy — trạng thái chính ở 3 khổ × sáng/tối.
for (const [kho, w, h, dpr] of [['390-doc', 390, 844, 1.25], ['844-ngang', 844, 390, 1], ['1440-may-tinh', 1440, 900, 1]]) {
  for (const toi of [false, true]) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
    const t = await ctx.newPage()
    t.on('pageerror', (e) => soat.push(`app ${kho}: lỗi trang ${e.message}`))
    await t.goto(`${GOC_URL}/tam/ktc.html#tt=co`)
    await t.waitForSelector('.ve-chieu'); await t.evaluate(() => document.fonts.ready); await t.waitForTimeout(200)
    await chup(t, `01-app-ket-thuc-ca-${kho}-${toi ? 'toi' : 'sang'}`, { full: kho !== '844-ngang' })
    await ctx.close()
  }
}
// Ba trạng thái phụ (390 sáng, chỉ phần đầu màn).
for (const tt of ['dung-het', 'khong-de', 'con-em']) {
  const ctx = await trinh.newContext({ viewport: { width: 390, height: 520 }, deviceScaleFactor: 1.25, colorScheme: 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`app ${tt}: lỗi trang ${e.message}`))
  await t.goto(`${GOC_URL}/tam/ktc.html#tt=${tt}`)
  await t.waitForSelector('.ve-chieu'); await t.evaluate(() => document.fonts.ready); await t.waitForTimeout(200)
  await chup(t, `02-app-trang-thai-${tt}`, { full: false })
  await ctx.close()
}

// Màn chiếu.
async function moTo(w, h, toi) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`chiếu ${w}: lỗi trang ${e.message}`))
  await t.goto(`file://${join(TAM, 'to.html')}`)
  await t.waitForSelector('.ve-sai'); await t.waitForTimeout(1500)
  if (toi) { await t.evaluate(() => { const s = document.getElementById('mc-palette'); s.value = 'dark'; s.dispatchEvent(new Event('change', { bubbles: true })) }); await t.waitForTimeout(300) }
  return { ctx, t }
}
const sangCau = async (t, n) => { for (let i = 1; i < n; i++) { await t.click('#mc-sau'); await t.waitForTimeout(350) } }
for (const [w, h] of [[1920, 1080], [1280, 720]]) {
  for (const toi of [false, true]) {
    const { ctx, t } = await moTo(w, h, toi)
    await chup(t, `03-chieu-cau-1-${w}-${toi ? 'toi' : 'mac-dinh'}`, { full: false, kiem: false })
    await ctx.close()
  }
}
{ // Câu 3/9 (Đúng–sai) + phím T thống kê lớp.
  const { ctx, t } = await moTo(1920, 1080, false)
  await sangCau(t, 3); await t.keyboard.press('t'); await t.waitForTimeout(400)
  await chup(t, '04-chieu-cau-3-dung-sai-thong-ke-1920', { full: false, kiem: false })
  await ctx.close()
}
{ // Câu 2/9 (Trả lời ngắn) + phím G lời giải.
  const { ctx, t } = await moTo(1920, 1080, false)
  await sangCau(t, 2); await t.keyboard.press('g'); await t.waitForTimeout(500)
  await chup(t, '05-chieu-cau-2-tra-loi-ngan-loi-giai-1920', { full: false, kiem: false })
  await ctx.close()
}
{ // Câu 9/9 (1 em) + phím H ẩn tên ở câu 1.
  const { ctx, t } = await moTo(1920, 1080, false)
  await sangCau(t, 9)
  await chup(t, '06-chieu-cau-9-mot-em-1920', { full: false, kiem: false })
  await ctx.close()
}
{
  const { ctx, t } = await moTo(1920, 1080, false)
  await t.click('#mc-phim-nhom .mc-nut-phim:has-text("Ẩn tên")'); await t.waitForTimeout(200)
  await chup(t, '07-chieu-cau-1-an-ten-1920', { full: false, kiem: false })
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích bấm nhỏ')
